import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';

if (typeof window !== 'undefined' && !window.WebSocket) {
  (window as any).WebSocket = class FakeWebSocket {
    constructor(url: string) {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

export interface OCRResult {
  text: string;
  confidence: number;
  pages: {
    pageNumber: number;
    text: string;
    confidence: number;
  }[];
}

let workerInstance: any = null;

const getWorker = async () => {
  if (!workerInstance) {
    workerInstance = await createWorker('eng', 1, {
      logger: () => {}, // Silent - geen spam
    });
  }
  return workerInstance;
};

/**
 * ✅ NEW: Convert image to PDF for better OCR
 * Images direct OCR'en werkt slecht - via PDF veel beter
 */
export const convertImageToPDF = async (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const img = document.createElement('img');
        const imageData = e.target?.result as string;
        
        img.onload = async () => {
          try {
            const pdfDoc = await PDFDocument.create();
            
            // Get image dimensions
            const width = img.width;
            const height = img.height;
            
            // Add page with image aspect ratio
            const aspectRatio = width / height;
            let pageWidth = 595; // A4 width
            let pageHeight = pageWidth / aspectRatio;
            
            // Limit max height
            if (pageHeight > 842) {
              pageHeight = 842;
              pageWidth = pageHeight * aspectRatio;
            }
            
            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            
            // Embed image
            const imageBytes = await fetch(imageData).then(res => res.arrayBuffer());
            const embeddedImage = await pdfDoc.embedPng(imageData).catch(async () => {
              // Fallback to jpg if png fails
              return await pdfDoc.embedJpg(imageData);
            });
            
            // Draw image to fill page
            page.drawImage(embeddedImage, {
              x: 0,
              y: 0,
              width: pageWidth,
              height: pageHeight,
            });
            
            const pdfBytes = await pdfDoc.save();
            resolve(pdfBytes);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = imageData;
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

export const extractTextFromPDF = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages = [];
    let totalConfidence = 0;
    let allText = '';
    const worker = await getWorker();

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      onProgress?.((pageNum / pdf.numPages) * 50);

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (!context) throw new Error('Canvas context failed');

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const result = await worker.recognize(canvas);
      const pageText = result.data.text;
      const pageConfidence = result.data.confidence;

      pages.push({
        pageNumber: pageNum,
        text: pageText,
        confidence: pageConfidence,
      });

      allText += `\n--- PAGE ${pageNum} ---\n${pageText}`;
      totalConfidence += pageConfidence;

      onProgress?.(50 + (pageNum / pdf.numPages) * 50);
    }

    const averageConfidence = pages.length > 0 ? totalConfidence / pages.length : 0;
    return {
      text: allText.trim(),
      confidence: averageConfidence,
      pages,
    };
  } catch (error) {
    console.error('PDF OCR error:', error);
    throw error;
  }
};

/**
 * ✅ UPDATED: Extract text from image by converting to PDF first
 */
export const extractTextFromImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  try {
    onProgress?.(10);
    
    // Convert image to PDF
    const pdfBuffer = await convertImageToPDF(file);
    onProgress?.(40);
    
    // Create a temporary File object from the PDF buffer
    const pdfFile = new File([pdfBuffer], 'converted.pdf', { type: 'application/pdf' });
    
    // Process as PDF
    const result = await extractTextFromPDF(pdfFile, (progress) => {
      // Map 40-100 to 40% already done
      onProgress?.(40 + (progress / 100) * 60);
    });
    
    return result;
  } catch (error) {
    console.error('Image OCR error:', error);
    throw error;
  }
};

/**
 * Parse Nederlands getal: 15.339,66 → 15339.66
 */
function parseNederlandsNumber(str: string): number {
  if (!str) return 0;
  let cleaned = str.replace(/€/g, '').replace(/\s/g, '').trim();
  cleaned = cleaned.replace(/\./g, '');
  cleaned = cleaned.replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Extract bedrag uit string - CORRECT voor Nederlands formaat
 * "€ 15.339,66" → 15339.66
 */
function extractAmount(text: string): number {
  // Match: optional €, optional spaces, digits/punten/komma
  const match = text.match(/€?\s*([\d\.]+,\d{2})/);
  if (match) {
    return parseNederlandsNumber(match[1]);
  }
  return 0;
}

/**
 * Extract invoice data - Werk van ACHTEREN naar VOREN
 * Facturen eindigen altijd met: Subtotaal, BTW, Totaal te voldoen
 */
export const extractInvoiceData = (ocrText: string) => {
  const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let supplierName = 'Onbekend';
  let invoiceNumber = `INV-${Date.now()}`;
  let invoiceDate = new Date();
  let subtotalExclVat = 0;
  let vatAmount = 0;
  let totalInclVat = 0;

  // ===== SUPPLIER: Zoek BEDRIJF (niet "--- PAGE 1 ---") =====
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    // Skip template/page markers
    if (line.includes('PAGE') || line.includes('---') || line.length < 3) continue;
    // Zoek BV, Ltd, of mixed case bedrijfsnaam
    if (line.match(/[A-Z][a-z]+.*(?:BV|Ltd|Inc|b\.v|B\.V)/i) || 
        (line.length > 5 && !line.match(/^\d/) && line !== line.toLowerCase() && line.match(/[A-Z]/))) {
      supplierName = line;
      break;
    }
  }

  // ===== INVOICE NUMBER =====
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (lower.includes('factuurnummer')) {
      // Format: "Factuurnummer: 2025-0015"
      const num = line.match(/:\s*([A-Z0-9\-\.]+)/)?.[1] || lines[i + 1]?.match(/^([A-Z0-9\-\.]+)/)?.[1];
      if (num) {
        invoiceNumber = num;
        break;
      }
    }
  }

  // ===== DATUM =====
  const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
  for (const line of lines) {
    const match = line.match(datePattern);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2030) {
        invoiceDate = new Date(year, month - 1, day);
        break;
      }
    }
  }

  // ===== BEDRAGEN: Werk VAN ACHTEREN =====
  // De factuur eindigt ALTIJD met: Subtotaal, 21% btw, Totaal te voldoen
  // Dus zoeken we van achteren naar voren
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // TOTAAL TE VOLDOEN (laatste bedrag)
    if (totalInclVat === 0 && lower.includes('totaal') && lower.includes('voldoen')) {
      totalInclVat = extractAmount(line);
      continue;
    }

    // 21% BTW
    if (vatAmount === 0 && lower.includes('21%') && lower.includes('btw')) {
      vatAmount = extractAmount(line);
      continue;
    }

    // SUBTOTAAL
    if (subtotalExclVat === 0 && lower.includes('subtotaal')) {
      subtotalExclVat = extractAmount(line);
      continue;
    }
  }

  // ===== Validatie & Fallback =====
  // Check: bedragen moeten realistisch zijn
  if (subtotalExclVat > 0 && vatAmount === 0) {
    vatAmount = Math.round((subtotalExclVat * 0.21) * 100) / 100;
  }
  if (subtotalExclVat > 0 && totalInclVat === 0) {
    totalInclVat = subtotalExclVat + vatAmount;
  }
  if (totalInclVat > 0 && subtotalExclVat === 0) {
    if (vatAmount > 0) {
      subtotalExclVat = totalInclVat - vatAmount;
    } else {
      // Assume 21% VAT
      subtotalExclVat = Math.round((totalInclVat / 1.21) * 100) / 100;
      vatAmount = totalInclVat - subtotalExclVat;
    }
  }

  // Safety check: als bedragen nul zijn, heeft OCR gefaald
  if (totalInclVat === 0) {
    console.warn('⚠️  Warning: Bedragen niet gevonden in OCR. Mogelijk OCR probleem.');
  }

  console.log('\n========== INVOICE EXTRACTED ==========');
  console.log('Supplier:        ', supplierName);
  console.log('Invoice Number:  ', invoiceNumber);
  console.log('Date:            ', invoiceDate.toLocaleDateString('nl-NL'));
  console.log('');
  console.log('Excl. BTW:       ', `€ ${subtotalExclVat.toFixed(2)}`);
  console.log('BTW (21%):       ', `€ ${vatAmount.toFixed(2)}`);
  console.log('Incl. BTW:       ', `€ ${totalInclVat.toFixed(2)}`);
  console.log('=========================================\n');

  return {
    supplierName,
    invoiceNumber,
    invoiceDate,
    amount: totalInclVat || subtotalExclVat,
    subtotal: subtotalExclVat,
    vatAmount,
    vatRate: 21,
    totalInclVat,
    rawText: ocrText,
  };
};

export const processInvoiceFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult & { invoiceData: ReturnType<typeof extractInvoiceData> }> => {
  try {
    let ocrResult: OCRResult;

    if (file.type === 'application/pdf') {
      ocrResult = await extractTextFromPDF(file, onProgress);
    } else if (file.type.startsWith('image/')) {
      ocrResult = await extractTextFromImage(file, onProgress);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    const invoiceData = extractInvoiceData(ocrResult.text);

    return {
      ...ocrResult,
      invoiceData,
    };
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
};

export const terminateOCRWorker = async () => {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
};
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined' && !window.WebSocket) {
  (window as any).WebSocket = class FakeWebSocket {
    constructor(url: string) {
      console.warn('WebSocket not available');
    }
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
      logger: (m: any) => console.log('OCR:', m),
    });
  }
  return workerInstance;
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

export const extractTextFromImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  try {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          onProgress?.(25);
          const worker = await getWorker();
          const result = await worker.recognize(img);
          onProgress?.(100);

          resolve({
            text: result.data.text,
            confidence: result.data.confidence,
            pages: [
              {
                pageNumber: 1,
                text: result.data.text,
                confidence: result.data.confidence,
              },
            ],
          });
          URL.revokeObjectURL(url);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image load failed'));
      };

      img.src = url;
    });
  } catch (error) {
    console.error('Image OCR error:', error);
    throw error;
  }
};

/**
 * Parse Nederlands getal: 15.339,66 -> 15339.66
 */
function parseNederlandsNumber(str: string): number {
  const cleaned = str.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Extract getal uit line - kijkt naar patroon: "€ 15.339,66"
 */
function extractNumber(line: string): number {
  // Zoek naar: optioneel €, spaties, getal met punten/komma's
  const match = line.match(/€?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
  if (match) {
    return parseNederlandsNumber(match[1]);
  }
  return 0;
}

/**
 * WERKENDE invoice data extraction - simpel en effectief
 */
export const extractInvoiceData = (ocrText: string) => {
  const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l);
  
  let supplierName = 'Onbekend';
  let invoiceNumber = `INV-${Date.now()}`;
  let invoiceDate = new Date();
  let dueDate = new Date();
  let subtotal = 0;
  let vatAmount = 0;
  let vatRate = 21;
  let totalInclVat = 0;

  console.log('[OCR] Processing', lines.length, 'lines');

  // ===== SUPPLIER NAME =====
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    if (lines[i].includes('bv') || lines[i].includes('B.V') || lines[i].includes('Ltd')) {
      supplierName = lines[i].replace(/B\.V\.?/gi, '').replace(/Ltd/gi, '').trim();
      if (supplierName.length > 3) break;
    }
  }

  // ===== INVOICE NUMBER =====
  for (const line of lines) {
    if (line.toLowerCase().includes('factuurnummer') || line.toLowerCase().includes('invoice')) {
      const parts = line.split(':');
      if (parts.length > 1) {
        invoiceNumber = parts[1].trim().toUpperCase();
        break;
      }
    }
  }

  // ===== DATES - patroon: DD-MM-YYYY =====
  const datePattern = /(\d{1,2})-(\d{1,2})-(\d{4})/;
  let dateCount = 0;
  for (const line of lines) {
    const match = line.match(datePattern);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);
      if (day > 0 && day <= 31 && month > 0 && month <= 12) {
        const date = new Date(year, month - 1, day);
        if (dateCount === 0) invoiceDate = date;
        else if (dateCount === 1) dueDate = date;
        dateCount++;
      }
    }
  }

  // ===== BEDRAGEN =====
  // Zoek naar specifieke labels en neem getal van VOLGENDE lijn
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const nextLine = lines[i + 1] || '';

    // Subtotaal
    if (line.includes('subtotaal') || line.includes('subtotal')) {
      const num = extractNumber(nextLine);
      if (num > 0) subtotal = num;
    }

    // VAT - zoek naar "21% btw" of gewoon "btw"
    if ((line.includes('21') && line.includes('btw')) || (line.includes('btw') && !line.includes('betaling'))) {
      const num = extractNumber(nextLine);
      if (num > 0) vatAmount = num;
    }

    // Totaal
    if (line.includes('totaal te voldoen') || 
        line.includes('total incl') || 
        line.includes('bedrag incl')) {
      const num = extractNumber(nextLine);
      if (num > 0) totalInclVat = num;
    }
  }

  // ===== FALLBACK: Kijk naar getallen die OP dezelfde lijn als label staan =====
  if (subtotal === 0 || vatAmount === 0 || totalInclVat === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes('subtotaal') && subtotal === 0) {
        subtotal = extractNumber(line);
      }
      if (lowerLine.includes('btw') && !lowerLine.includes('betaling') && vatAmount === 0) {
        vatAmount = extractNumber(line);
      }
      if ((lowerLine.includes('totaal') || lowerLine.includes('voldoen')) && totalInclVat === 0) {
        totalInclVat = extractNumber(line);
      }
    }
  }

  // ===== BEREKEN ONTBREKENDE =====
  if (subtotal > 0 && vatAmount === 0) {
    vatAmount = Math.round((subtotal * vatRate) / 100 * 100) / 100;
  }
  if (totalInclVat === 0 && subtotal > 0 && vatAmount > 0) {
    totalInclVat = Math.round((subtotal + vatAmount) * 100) / 100;
  }
  if (totalInclVat === 0 && subtotal > 0) {
    totalInclVat = Math.round((subtotal * (1 + vatRate / 100)) * 100) / 100;
  }

  const amount = totalInclVat > 0 ? totalInclVat : subtotal;

  console.log('[OCR] Result:', {
    supplier: supplierName,
    invoice: invoiceNumber,
    date: invoiceDate,
    subtotal,
    vat: vatAmount,
    total: totalInclVat,
  });

  return {
    supplierName,
    invoiceNumber,
    invoiceDate,
    dueDate,
    amount: amount,
    subtotal: subtotal,
    vatAmount: vatAmount,
    vatRate: vatRate,
    totalInclVat: totalInclVat,
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
/**
 * ✅ CLAUDE INVOICE EXTRACTION
 * Uses Claude API to intelligently extract invoice data from ANY format
 * Your API key stays in .env - never shared
 */

export interface ExtractedInvoice {
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: Date;
  amount: number;
  subtotal: number;
  vatAmount: number;
  vatRate: number;
  totalInclVat: number;
  confidence: 'high' | 'medium' | 'low';
  rawResponse: string;
}

/**
 * Extract invoice data using Claude (intelligent, works with ANY format)
 */
export const extractInvoiceWithClaude = async (
  ocrText: string,
  apiKey: string
): Promise<ExtractedInvoice> => {
  try {
    const prompt = `You are an invoice parsing expert. Extract the following data from this OCR text.

OCR TEXT:
${ocrText}

EXTRACT THESE FIELDS (respond ONLY with valid JSON, no markdown):
{
  "supplierName": "company name or 'Unknown'",
  "invoiceNumber": "invoice/receipt number or ticket number",
  "invoiceDate": "date in YYYY-MM-DD format or today's date",
  "totalAmount": "the TOTAL amount (highest number, in euros)",
  "subtotalExclVat": "amount before VAT if available, else totalAmount",
  "vatAmount": "VAT amount if visible, else calculate 21%",
  "confidence": "high/medium/low - how confident are you in the extraction?",
  "notes": "any issues or uncertainties"
}

IMPORTANT RULES:
- For amounts: extract numbers like 85,92 or 85.92 as 85.92
- Date can be any format: 24-10-2025, 24/10/2025, Oct 24 2025, etc
- TOTAAL/TOTAL/Amount = usually the final amount
- BTW/VAT = usually around 21% in Netherlands
- If numbers unclear, make your best guess and note it
- ALWAYS output valid JSON`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = (await response.json()) as any;
    const responseText = data.content[0].text;

    console.log('Claude response:', responseText);

    // Parse JSON from response
    let jsonData;
    try {
      jsonData = JSON.parse(responseText);
    } catch (e) {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Could not parse Claude response as JSON');
      }
    }

    // Parse date
    const invoiceDate = parseDate(jsonData.invoiceDate);

    // Parse amounts
    const totalAmount = parseAmount(jsonData.totalAmount);
    const subtotal = parseAmount(jsonData.subtotalExclVat) || totalAmount;
    const vatAmount = parseAmount(jsonData.vatAmount) || Math.round((subtotal * 0.21) * 100) / 100;

    console.log('\n========== 📄 INVOICE EXTRACTED (Claude) ==========');
    console.log('Supplier:        ', jsonData.supplierName);
    console.log('Invoice Number:  ', jsonData.invoiceNumber);
    console.log('Date:            ', invoiceDate.toLocaleDateString('nl-NL'));
    console.log('Confidence:      ', jsonData.confidence);
    console.log('Excl. BTW:       ', `€ ${subtotal.toFixed(2)}`);
    console.log('BTW (21%):       ', `€ ${vatAmount.toFixed(2)}`);
    console.log('Incl. BTW:       ', `€ ${totalAmount.toFixed(2)}`);
    console.log('====================================================\n');

    return {
      supplierName: jsonData.supplierName || 'Unknown',
      invoiceNumber: jsonData.invoiceNumber || `INV-${Date.now()}`,
      invoiceDate,
      amount: totalAmount,
      subtotal,
      vatAmount,
      vatRate: 21,
      totalInclVat: totalAmount,
      confidence: jsonData.confidence || 'medium',
      rawResponse: responseText,
    };
  } catch (error) {
    console.error('Claude extraction error:', error);
    throw error;
  }
};

function parseAmount(value: any): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;

  const str = String(value);
  // Handle both 85,92 and 85.92
  const cleaned = str
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parseDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;

  const str = String(value).trim();

  // Try parsing YYYY-MM-DD
  const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  }

  // Try parsing DD-MM-YYYY or DD/MM/YYYY
  const datedMatch = str.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (datedMatch) {
    const day = parseInt(datedMatch[1]);
    const month = parseInt(datedMatch[2]);
    const year = parseInt(datedMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
  }

  return new Date();
}
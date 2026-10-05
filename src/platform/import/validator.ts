import { ColumnMapping, RawImportRow } from './parser';

export interface ValidatedImportItem {
  row_number: number;
  product_name: string;
  brand_name: string | null;
  category_name: string | null;
  sku: string | null;
  barcode: string | null;
  sale_price: number;
  cost_price: number | null;
  size: string | null;
  color: string | null;
  stock: number;
  tax_rate: number;
  status: 'valid' | 'warning' | 'error';
  errors: string[];
}

/**
 * Clean and parse currency/number strings (handles €120,50 or 120.50)
 */
export function parseItalianNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val)
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .trim();

  // If contains comma and dot, assume dot is thousands and comma is decimal: 1.200,50 -> 1200.50
  if (str.includes('.') && str.includes(',')) {
    const cleaned = str.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  // If only comma, replace with dot: 120,50 -> 120.50
  if (str.includes(',')) {
    const cleaned = str.replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate parsed raw rows against chosen column mapping
 */
export function validateImportRows(
  rows: RawImportRow[],
  mapping: ColumnMapping
): { items: ValidatedImportItem[]; validCount: number; errorCount: number } {
  const items: ValidatedImportItem[] = [];
  let validCount = 0;
  let errorCount = 0;

  rows.forEach((row, idx) => {
    const rowErrors: string[] = [];
    const rowNum = idx + 2; // header is row 1

    const rawName = mapping.name ? row[mapping.name] : null;
    const productName = rawName ? String(rawName).trim() : '';

    if (!productName) {
      rowErrors.push('Nome prodotto mancante');
    }

    const rawPrice = mapping.sale_price ? row[mapping.sale_price] : null;
    const salePrice = parseItalianNumber(rawPrice);
    if (salePrice <= 0) {
      rowErrors.push('Prezzo di vendita mancante o non valido (deve essere > 0)');
    }

    const rawCost = mapping.cost_price ? row[mapping.cost_price] : null;
    const costPrice = rawCost ? parseItalianNumber(rawCost) : null;

    const rawStock = mapping.stock ? row[mapping.stock] : null;
    const stock = rawStock ? Math.max(0, parseInt(String(parseItalianNumber(rawStock)), 10)) : 0;

    const rawTax = mapping.tax_rate ? row[mapping.tax_rate] : null;
    const taxRate = rawTax ? parseItalianNumber(rawTax) : 22;

    const brandName = mapping.brand && row[mapping.brand] ? String(row[mapping.brand]).trim() : null;
    const categoryName = mapping.category && row[mapping.category] ? String(row[mapping.category]).trim() : null;
    const sku = mapping.sku && row[mapping.sku] ? String(row[mapping.sku]).trim() : null;
    const barcode = mapping.barcode && row[mapping.barcode] ? String(row[mapping.barcode]).trim() : null;
    const size = mapping.size && row[mapping.size] ? String(row[mapping.size]).trim() : null;
    const color = mapping.color && row[mapping.color] ? String(row[mapping.color]).trim() : null;

    const isValid = rowErrors.length === 0;
    if (isValid) {
      validCount++;
    } else {
      errorCount++;
    }

    items.push({
      row_number: rowNum,
      product_name: productName,
      brand_name: brandName || null,
      category_name: categoryName || null,
      sku: sku || null,
      barcode: barcode || null,
      sale_price: salePrice,
      cost_price: costPrice && costPrice > 0 ? costPrice : null,
      size: size || null,
      color: color || null,
      stock,
      tax_rate: taxRate > 0 ? taxRate : 22,
      status: isValid ? 'valid' : 'error',
      errors: rowErrors,
    });
  });

  return { items, validCount, errorCount };
}

import * as XLSX from 'xlsx';

export interface RawImportRow {
  [key: string]: any;
}

export interface ColumnMapping {
  name: string;
  brand?: string;
  category?: string;
  sku?: string;
  barcode?: string;
  sale_price: string;
  cost_price?: string;
  size?: string;
  color?: string;
  stock?: string;
  tax_rate?: string;
}

/**
 * Auto-detect column headers based on common Italian & English retail terms
 */
export function autoDetectColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  for (const h of headers) {
    const norm = normalize(h);

    // Name
    if (!mapping.name && (norm.includes('nome') || norm.includes('articolo') || norm.includes('descrizione') || norm.includes('product') || norm.includes('title'))) {
      mapping.name = h;
    }
    // Brand
    else if (!mapping.brand && (norm.includes('brand') || norm.includes('marca') || norm.includes('produttore'))) {
      mapping.brand = h;
    }
    // Category
    else if (!mapping.category && (norm.includes('categoria') || norm.includes('reparto') || norm.includes('category') || norm.includes('gruppo'))) {
      mapping.category = h;
    }
    // SKU
    else if (!mapping.sku && (norm.includes('sku') || norm === 'codice' || norm.includes('codart') || norm.includes('codicearticolo'))) {
      mapping.sku = h;
    }
    // Barcode
    else if (!mapping.barcode && (norm.includes('barcode') || norm.includes('ean') || norm.includes('codiceabarre') || norm.includes('upc'))) {
      mapping.barcode = h;
    }
    // Sale Price
    else if (!mapping.sale_price && (norm.includes('prezzo') || norm.includes('listino') || norm.includes('price') || norm.includes('vendita'))) {
      mapping.sale_price = h;
    }
    // Cost Price
    else if (!mapping.cost_price && (norm.includes('costo') || norm.includes('acquisto') || norm.includes('cost'))) {
      mapping.cost_price = h;
    }
    // Size
    else if (!mapping.size && (norm.includes('taglia') || norm.includes('misura') || norm.includes('size'))) {
      mapping.size = h;
    }
    // Color
    else if (!mapping.color && (norm.includes('colore') || norm.includes('color'))) {
      mapping.color = h;
    }
    // Stock / Quantity
    else if (!mapping.stock && (norm.includes('giacenza') || norm.includes('qta') || norm.includes('quantita') || norm.includes('stock') || norm.includes('esistenza'))) {
      mapping.stock = h;
    }
    // Tax Rate / VAT
    else if (!mapping.tax_rate && (norm.includes('iva') || norm.includes('aliquota') || norm.includes('vat'))) {
      mapping.tax_rate = h;
    }
  }

  return mapping;
}

/**
 * Parse an uploaded Buffer or ArrayBuffer of CSV/Excel into JSON rows
 */
export function parseImportBuffer(buffer: Buffer | ArrayBuffer): { headers: string[]; rows: RawImportRow[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Nessun foglio di lavoro trovato nel file caricato');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<RawImportRow>(worksheet, { defval: '' });

  if (jsonData.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = Object.keys(jsonData[0] || {});
  return { headers, rows: jsonData };
}

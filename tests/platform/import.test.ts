import { describe, it, expect } from 'vitest';
import { autoDetectColumnMapping, ColumnMapping } from '@/platform/import/parser';
import { parseItalianNumber, validateImportRows } from '@/platform/import/validator';

describe('Phase 8: Retail Catalog Import Engine Verification', () => {
  it('auto-detects Italian retail column headers correctly', () => {
    const headers = [
      'Descrizione Articolo',
      'Marca Produttore',
      'Reparto Categoria',
      'Codice SKU',
      'Codice a Barre',
      'Prezzo di Vendita',
      'Costo Acquisto Netto',
      'Misura Taglia',
      'Colore Scarpa',
      'Giacenza Magazzino',
      'Aliquota IVA',
    ];

    const mapping = autoDetectColumnMapping(headers);

    expect(mapping.name).toBe('Descrizione Articolo');
    expect(mapping.brand).toBe('Marca Produttore');
    expect(mapping.category).toBe('Reparto Categoria');
    expect(mapping.sku).toBe('Codice SKU');
    expect(mapping.barcode).toBe('Codice a Barre');
    expect(mapping.sale_price).toBe('Prezzo di Vendita');
    expect(mapping.cost_price).toBe('Costo Acquisto Netto');
    expect(mapping.size).toBe('Misura Taglia');
    expect(mapping.color).toBe('Colore Scarpa');
    expect(mapping.stock).toBe('Giacenza Magazzino');
    expect(mapping.tax_rate).toBe('Aliquota IVA');
  });

  it('parses various Italian currency and number formats reliably', () => {
    expect(parseItalianNumber('120,50 €')).toBe(120.5);
    expect(parseItalianNumber('€ 1.450,00')).toBe(1450.0);
    expect(parseItalianNumber('45.99')).toBe(45.99);
    expect(parseItalianNumber('80')).toBe(80.0);
    expect(parseItalianNumber(0)).toBe(0);
    expect(parseItalianNumber(null)).toBe(0);
  });

  it('validates rows, flagging invalid prices or missing product names', () => {
    const rawRows = [
      {
        Nome: 'Nike Air Max 95',
        Prezzo: '179,90',
        Taglia: '42',
        Stock: '6',
      },
      {
        Nome: '',
        Prezzo: '99,00',
        Taglia: '40',
        Stock: '2',
      },
      {
        Nome: 'Borsa Pelle',
        Prezzo: '0,00',
        Taglia: 'U',
        Stock: '1',
      },
    ];

    const mapping: ColumnMapping = {
      name: 'Nome',
      sale_price: 'Prezzo',
      size: 'Taglia',
      stock: 'Stock',
    };

    const { items, validCount, errorCount } = validateImportRows(rawRows, mapping);

    expect(validCount).toBe(1);
    expect(errorCount).toBe(2);

    expect(items[0].status).toBe('valid');
    expect(items[0].sale_price).toBe(179.9);
    expect(items[0].stock).toBe(6);

    expect(items[1].status).toBe('error');
    expect(items[1].errors).toContain('Nome prodotto mancante');

    expect(items[2].status).toBe('error');
    expect(items[2].errors.some((e) => e.includes('Prezzo'))).toBe(true);
  });

  it('groups multiple sizes and colors under single product family', () => {
    const rows = [
      { product_name: 'Sneaker Borrelli', brand_name: 'Borrelli', size: '40', stock: 5 },
      { product_name: 'Sneaker Borrelli', brand_name: 'Borrelli', size: '41', stock: 6 },
      { product_name: 'Sneaker Borrelli', brand_name: 'Borrelli', size: '42', stock: 8 },
      { product_name: 'Mocassino Classico', brand_name: 'Borrelli', size: '41', stock: 3 },
    ];

    const productGroups = new Map<string, typeof rows>();
    for (const r of rows) {
      const key = `${r.product_name.toLowerCase().trim()}_${r.brand_name.toLowerCase().trim()}`;
      const existing = productGroups.get(key) || [];
      existing.push(r);
      productGroups.set(key, existing);
    }

    expect(productGroups.size).toBe(2); // 2 distinct products
    const sneakerGroup = productGroups.get('sneaker borrelli_borrelli');
    expect(sneakerGroup?.length).toBe(3); // 3 variants for sneaker
    const totalSneakerStock = sneakerGroup?.reduce((acc, it) => acc + it.stock, 0);
    expect(totalSneakerStock).toBe(19);
  });
});

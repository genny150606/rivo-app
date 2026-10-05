import { describe, it, expect } from 'vitest';
import { parseRetailIntent } from '../../src/platform/ai/retail-nlp';

describe('Retail NLP Parser', () => {
  it('correctly parses user prompt: "inserisci 15 Air Max 95 di taglia 43"', () => {
    const result = parseRetailIntent('inserisci 15 Air Max 95 di taglia 43');
    
    expect(result.intent).toBe('ADD_PRODUCT_OR_STOCK');
    expect(result.quantity).toBe(15);
    expect(result.size).toBe('43');
    expect(result.brand).toBe('Nike');
    expect(result.category).toBe('Calzature');
    expect(result.productName.toLowerCase()).toContain('air max 95');
  });

  it('correctly parses: "aggiungi 8 mocassini Borrelli taglia 42 a 130 euro"', () => {
    const result = parseRetailIntent('aggiungi 8 mocassini Borrelli taglia 42 a 130 euro');
    
    expect(result.intent).toBe('ADD_PRODUCT_OR_STOCK');
    expect(result.quantity).toBe(8);
    expect(result.size).toBe('42');
    expect(result.brand).toBe('Borrelli');
    expect(result.category).toBe('Calzature');
    expect(result.sellingPrice).toBe(130);
  });

  it('correctly parses: "carica 4 borse tracolla colore cognac a 180 euro costo 80"', () => {
    const result = parseRetailIntent('carica 4 borse tracolla colore cognac a 180 euro costo 80');
    
    expect(result.intent).toBe('ADD_PRODUCT_OR_STOCK');
    expect(result.quantity).toBe(4);
    expect(result.color).toBe('Cognac');
    expect(result.category).toBe('Borse');
    expect(result.sellingPrice).toBe(180);
    expect(result.costPrice).toBe(80);
  });

  it('correctly parses stock query: "quante Air Max 95 abbiamo in magazzino?"', () => {
    const result = parseRetailIntent('quante Air Max 95 abbiamo in magazzino?');
    
    expect(result.intent).toBe('QUERY_STOCK');
    expect(result.productName.toLowerCase()).toContain('air max 95');
  });

  it('correctly parses low stock query: "quali prodotti sono sotto scorta?"', () => {
    const result = parseRetailIntent('quali prodotti sono sotto scorta?');
    
    expect(result.intent).toBe('QUERY_LOW_STOCK');
  });
});

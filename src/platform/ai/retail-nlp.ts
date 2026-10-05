/**
 * RIVO Retail Natural Language Parser (NLP)
 * Translates natural conversational instructions in Italian into structured inventory actions.
 * Examples:
 * - "inserisci 15 Air Max 95 di taglia 43"
 * - "aggiungi 8 mocassini Borrelli taglia 42 a 130 euro"
 * - "carica 4 borse tracolla colore cognac a 180€ costo 80"
 * - "quante Air Max 95 abbiamo in magazzino?"
 */

export interface ParsedRetailAction {
  intent: 'ADD_PRODUCT_OR_STOCK' | 'REMOVE_STOCK' | 'QUERY_STOCK' | 'QUERY_LOW_STOCK' | 'GENERAL_CHAT';
  productName: string;
  brand?: string;
  category: string;
  size?: string;
  color?: string;
  quantity?: number;
  sellingPrice?: number;
  costPrice?: number;
  barcode?: string;
  rawText: string;
  confidence: number;
}

const COMMON_BRANDS = [
  'Nike', 'Adidas', 'Puma', 'New Balance', 'Asics', 'Converse', 'Vans',
  'Borrelli', 'Gucci', 'Prada', 'Armani', 'Michael Kors', 'Guess',
  'Liu Jo', 'Timberland', 'Clarks', 'Geox', 'Saucony', 'Jordan'
];

const NUMBER_WORDS: Record<string, number> = {
  'un': 1, 'uno': 1, 'una': 1, 'paio': 1, 'due': 2, 'tre': 3, 'quattro': 4,
  'cinque': 5, 'sei': 6, 'sette': 7, 'otto': 8, 'nove': 9, 'dieci': 10,
  'quindici': 15, 'venti': 20, 'venticinque': 25, 'trenta': 30, 'cinquanta': 50, 'cento': 100
};

// Known model numbers that shouldn't be treated as sizes
const MODEL_NUMBERS = new Set(['90', '95', '97', '270', '720', '500', '550', '574', '990', '991', '992', '993', '327', '2002', '1906']);

export function parseRetailIntent(
  text: string,
  existingCatalog: Array<{ name: string; brand?: string; category?: string }> = []
): ParsedRetailAction {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Detect Intent
  let intent: ParsedRetailAction['intent'] = 'GENERAL_CHAT';
  if (/quante|quanti|quanto|giacenz|disponibil|c'è|ci sono|rimast/i.test(lower)) {
    intent = 'QUERY_STOCK';
  } else if (/sotto\s*scorta|in\s*esaurimento|terminat|finit/i.test(lower)) {
    intent = 'QUERY_LOW_STOCK';
  } else if (/scarica|rimuovi|elimina|danneggiat|reso|togli/i.test(lower)) {
    intent = 'REMOVE_STOCK';
  } else if (/inserisci|aggiungi|carica|metti|registra|nuov|arrivat|ricevut/i.test(lower)) {
    intent = 'ADD_PRODUCT_OR_STOCK';
  }

  // 2. Extract Prices first (with strict word boundaries)
  let sellingPrice: number | undefined;
  let costPrice: number | undefined;

  const costMatch = lower.match(/\b(?:costo|acquisto|carico)\s*(?:di)?\s*[:.]?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:€|euro)?\b/i);
  if (costMatch && costMatch[1]) {
    costPrice = parseFloat(costMatch[1].replace(',', '.'));
  }

  const sellMatch = lower.match(/\b(?:prezzo(?:\s*di\s*vendita)?|vendita|listino|\ba\b)\s*[:.]?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:€|euro)?\b/i);
  if (sellMatch && sellMatch[1]) {
    const val = parseFloat(sellMatch[1].replace(',', '.'));
    // Make sure it doesn't match costPrice or size
    if (val !== costPrice) {
      sellingPrice = val;
    }
  }

  // 3. Extract Size
  let size: string | undefined;
  const explicitSizeMatch = lower.match(/\b(?:taglia|tg|numero|misura|size)\s*[:.]?\s*(\d{2}(?:[.,]\d)?|[smlx]+|taglia\s*unica|tu)\b/i);
  if (explicitSizeMatch && explicitSizeMatch[1]) {
    size = explicitSizeMatch[1].toUpperCase().replace(',', '.');
  } else {
    // Check if there is "di taglia X" or standalone shoe sizes (35-48), ignoring model numbers like 95
    const shoeSizeMatch = lower.match(/\b(?:di\s+)?(3[5-9]|4[0-8])\b/);
    if (shoeSizeMatch && shoeSizeMatch[1] && !MODEL_NUMBERS.has(shoeSizeMatch[1])) {
      size = shoeSizeMatch[1];
    }
  }

  // 4. Extract Quantity
  let quantity: number | undefined;
  // Match quantity right after command verbs e.g. "inserisci 15", "carica 4", "aggiungi 8"
  const verbQuantityMatch = lower.match(/(?:inserisci|aggiungi|carica|metti|registra|scarica|rimuovi)\s+(\d+)\b/i);
  if (verbQuantityMatch && verbQuantityMatch[1]) {
    quantity = parseInt(verbQuantityMatch[1], 10);
  } else {
    const explicitQuantityMatch = lower.match(/\b(\d+)\s*(?:pz|pezzi|paia|articoli|unita)\b/i);
    if (explicitQuantityMatch && explicitQuantityMatch[1]) {
      quantity = parseInt(explicitQuantityMatch[1], 10);
    } else {
      // Check Italian words
      for (const [word, val] of Object.entries(NUMBER_WORDS)) {
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        if (wordRegex.test(lower)) {
          quantity = val;
          break;
        }
      }
    }
  }

  if (intent === 'ADD_PRODUCT_OR_STOCK' && (!quantity || quantity <= 0)) {
    quantity = 1;
  }

  // 5. Extract Color
  let color: string | undefined;
  const colorMatch = lower.match(/\b(?:colore|color)\s+([a-zàèéìòù]+)\b/i) || 
    lower.match(/\b(nero|nera|bianco|bianca|blu|notte|marrone|cognac|rosso|rossa|grigio|grigia|verde|giallo|beige|oro|argento)\b/i);
  if (colorMatch && colorMatch[1]) {
    color = colorMatch[1].charAt(0).toUpperCase() + colorMatch[1].slice(1).toLowerCase();
  }

  // 6. Extract Brand & Category
  let brand: string | undefined;
  for (const b of COMMON_BRANDS) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(clean)) {
      brand = b;
      break;
    }
  }

  if (!brand && existingCatalog.length > 0) {
    for (const item of existingCatalog) {
      if (item.brand && new RegExp(`\\b${item.brand}\\b`, 'i').test(clean)) {
        brand = item.brand;
        break;
      }
    }
  }

  let category: string | undefined;
  if (/scarpa|scarpe|sneaker|sneakers|mocassin|stival|ciabatt|sandalo|sandali|decollete|ballerin|air\s*max/i.test(lower)) {
    category = 'Calzature';
  } else if (/borsa|borse|tracoll|zaino|zaini|pochette|shopper/i.test(lower)) {
    category = 'Borse';
  } else if (/cintur|portafogli|cappell|foulard|occhial/i.test(lower)) {
    category = 'Accessori';
  }

  if (!brand) {
    if (/air\s*max|jordan|dunk|blazer/i.test(lower)) {
      brand = 'Nike';
    } else if (/stan\s*smith|superstar|samba|gazelle/i.test(lower)) {
      brand = 'Adidas';
    }
  }

  // 7. Clean and Extract Product Name
  let productName = clean;
  // Strip commands and stop phrases
  productName = productName.replace(/^(?:inserisci|aggiungi|carica|metti|registra|scarica|rimuovi|quante|quanti|quanto\s*costa|dimmi|vorrei\s*inserire|crea)\s+/i, '');
  productName = productName.replace(/\s+(?:abbiamo|ci\s*sono|rimaste?)\s+in\s+magazzino\??/i, '');
  productName = productName.replace(/\s+in\s+magazzino\??/i, '');

  if (quantity) {
    productName = productName.replace(new RegExp(`^${quantity}\\s+`, 'i'), '');
    productName = productName.replace(new RegExp(`\\b${quantity}\\s*(?:pz|pezzi|paia|articoli)?\\b`, 'i'), '');
  }

  // Strip size clause
  productName = productName.replace(/\b(?:di\s*)?(?:taglia|tg|numero|misura|size)\s*[:.]?\s*(?:\d{2}(?:[.,]\d)?|[smlx]+|taglia\s*unica|tu)\b/gi, '');
  if (size && !MODEL_NUMBERS.has(size)) {
    productName = productName.replace(new RegExp(`\\bdi\\s+${size}\\b`, 'gi'), '');
  }

  // Strip color clause
  if (color) {
    productName = productName.replace(new RegExp(`\\b(?:colore|color)\\s+${color}\\b`, 'gi'), '');
    productName = productName.replace(new RegExp(`\\b${color}\\b`, 'gi'), '');
  }

  // Strip price clauses
  if (sellingPrice) {
    productName = productName.replace(new RegExp(`\\b(?:prezzo|vendita|listino|\\ba\\b)?\\s*${sellingPrice}\\s*(?:€|euro)?\\b`, 'gi'), '');
  }
  if (costPrice) {
    productName = productName.replace(new RegExp(`\\b(?:costo|acquisto|carico)\\s*${costPrice}\\s*(?:€|euro)?\\b`, 'gi'), '');
  }

  // Clean remaining prepositions / stop words at boundaries
  productName = productName.replace(/\b(?:di|a|in|con|del|della|colore|costo|prezzo|euro)\b/gi, ' ');
  productName = productName.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();

  if (productName.length < 2) {
    if (brand && category) {
      productName = `${brand} ${category}`;
    } else {
      productName = 'Nuovo Articolo';
    }
  }

  return {
    intent,
    productName: productName.charAt(0).toUpperCase() + productName.slice(1),
    brand,
    category: category || 'Altro',
    size,
    color,
    quantity,
    sellingPrice,
    costPrice,
    rawText: text,
    confidence: intent !== 'GENERAL_CHAT' ? 0.95 : 0.4
  };
}

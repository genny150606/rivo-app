import { NextRequest, NextResponse } from 'next/server';
import { sanitizeString } from '@/lib/security';
import { CanvaDish, CanvaMenuCategory } from '@/lib/canva-menu';

interface MenuScannerRequest {
  text?: string;
  imageBase64?: string;
  imageMime?: string;
}

function parseMenuTextHeuristically(rawText: string): CanvaMenuCategory[] {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const categories: CanvaMenuCategory[] = [];
  let currentCat: CanvaMenuCategory | null = null;

  const categoryHeaders = [
    'antipasti',
    'primi',
    'secondi',
    'pizze',
    'contorni',
    'dolci',
    'dessert',
    'bevande',
    'carta dei vini',
    'vini',
    'birre',
    'cocktail',
    'caffetteria',
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Check if line looks like a category header
    const isCatHeader =
      categoryHeaders.some((h) => lower === h || lower.startsWith(`${h} -`) || lower.startsWith(`${h}:`)) ||
      (line.length < 30 && line === line.toUpperCase() && !line.includes('€') && !/\d+/.test(line));

    if (isCatHeader) {
      const catName = line.replace(/[:\-]/g, '').trim();
      currentCat = {
        id: `cat-${Date.now()}-${categories.length + 1}`,
        name: catName.charAt(0).toUpperCase() + catName.slice(1).toLowerCase(),
        subtitle: `Selezione della casa`,
        dishes: [],
        items: [],
      };
      categories.push(currentCat);
      continue;
    }

    if (!currentCat) {
      currentCat = {
        id: `cat-${Date.now()}-main`,
        name: 'Specialità della Casa',
        dishes: [],
        items: [],
      };
      categories.push(currentCat);
    }

    // Try to extract dish name and price
    const priceMatch = line.match(/(?:€|\bEUR\b)?\s*(\d+[,.]\d{2}|\d+)\s*(?:€|\bEUR\b)?/i);
    let priceStr = '12.00';
    let dishName = line;

    if (priceMatch) {
      priceStr = priceMatch[1].replace(',', '.');
      dishName = line.replace(priceMatch[0], '').trim();
    }

    // Clean dish name
    dishName = dishName.replace(/^[-*•.]\s*/, '').trim();
    if (!dishName || dishName.length < 2) continue;

    // Check next line for description if available and doesn't have a price
    let description = '';
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const nextHasPrice = /(?:€|\bEUR\b)?\s*(\d+[,.]\d{2}|\d+)\s*(?:€|\bEUR\b)?/i.test(nextLine);
      const nextIsCat = categoryHeaders.some((h) => nextLine.toLowerCase().includes(h));
      if (!nextHasPrice && !nextIsCat && nextLine.length > 5 && nextLine.length < 200) {
        description = nextLine;
        i++; // advance line
      }
    }

    const dish: CanvaDish = {
      id: `dish-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: dishName,
      description: description || 'Preparato artigianalmente con ingredienti di prima scelta.',
      price: parseFloat(priceStr) || 12,
      popular: currentCat.dishes.length === 0,
      tags: [],
      available: true,
      isAvailable: true,
      isPopular: currentCat.dishes.length === 0,
    };

    currentCat.dishes.push(dish);
    currentCat.items.push(dish);
  }

  return categories.filter((c) => c.dishes.length > 0);
}

export async function POST(request: NextRequest) {
  try {
    const body: MenuScannerRequest = await request.json();
    const rawText = sanitizeString(body.text || '', 5000);
    const { imageBase64, imageMime } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (apiKey) {
      try {
        const systemPrompt = `Sei un esperto sommelier e digitalizzatore di menù per ristoranti italiani.
Il tuo compito è analizzare il menù fornito (in testo o immagine) ed estrarre la struttura completa di categorie e piatti.

Regole ferree:
1. Raggruppa i piatti in categorie logiche (es: "Antipasti", "Primi Piatti", "Secondi di Carne", "Secondi di Pesce", "Pizze Tradizionali", "Pizze Gourmet", "Dessert", "Vini & Bevande").
2. Per ogni piatto estrai:
   - "name": Nome esatto del piatto
   - "description": Ingredienti e preparazione (se assente, riassumi in 1 frase elegante)
   - "price": Numero decimale in Euro (es: 14.50)
   - "tags": Array di tag/allergeni pertinenti tra ["Gluten Free", "Lattosio", "Crostacei", "Pesce", "Vegetariano", "Vegano", "Chef Selection"]
   - "isPopular": true se è una specialità evidenziata
3. Rispondi ESCLUSIVAMENTE con un oggetto JSON valido con questa struttura:
{
  "categories": [
    {
      "name": "Nome Categoria",
      "subtitle": "Breve sottotitolo",
      "dishes": [
        {
          "name": "Spaghetto alle Vongole",
          "description": "Vongole veraci, aglio dolce, prezzemolo fresco ed emulsione di mare.",
          "price": 16.00,
          "tags": ["Pesce", "Molluschi"],
          "isPopular": true
        }
      ]
    }
  ]
}`;

        const parts: any[] = [];
        if (imageBase64) {
          const cleanB64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
          parts.push({
            inline_data: {
              mime_type: imageMime || 'image/jpeg',
              data: cleanB64,
            },
          });
          parts.push({
            text: `${systemPrompt}\n\nEstrai tutti i piatti presenti in questa foto di menù.`,
          });
        } else if (rawText) {
          parts.push({
            text: `${systemPrompt}\n\nEcco il testo del menù da digitalizzare:\n${rawText}`,
          });
        }

        if (parts.length > 0) {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts }],
              }),
            }
          );

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const outputText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (outputText) {
              const cleaned = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              if (parsed.categories && Array.isArray(parsed.categories)) {
                // Format nicely with IDs
                const formattedCategories: CanvaMenuCategory[] = parsed.categories.map((c: any, idx: number) => {
                  const catId = `cat-ai-${Date.now()}-${idx + 1}`;
                  const dishes: CanvaDish[] = (c.dishes || []).map((d: any, dIdx: number) => ({
                    id: `dish-ai-${Date.now()}-${idx}-${dIdx}`,
                    name: d.name || 'Piatto Speciale',
                    description: d.description || '',
                    price: typeof d.price === 'number' ? d.price : parseFloat(d.price) || 10,
                    tags: Array.isArray(d.tags) ? d.tags : [],
                    popular: Boolean(d.isPopular),
                    isPopular: Boolean(d.isPopular),
                    available: true,
                    isAvailable: true,
                  }));
                  return {
                    id: catId,
                    name: c.name || `Categoria ${idx + 1}`,
                    subtitle: c.subtitle || '',
                    dishes,
                    items: dishes,
                  };
                });
                return NextResponse.json({ categories: formattedCategories });
              }
            }
          }
        }
      } catch (geminiErr) {
        console.warn('[AI Menu Scanner] Gemini error, using heuristic fallback:', geminiErr);
      }
    }

    // Heuristic Fallback
    if (rawText) {
      const fallbackCats = parseMenuTextHeuristically(rawText);
      return NextResponse.json({ categories: fallbackCats });
    }

    return NextResponse.json(
      { error: 'Nessun testo o immagine fornita per la scansione del menù.' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sanitizeString } from '@/lib/security';

interface DishEnhancerRequest {
  dishName: string;
  rawIngredients?: string;
  category?: string;
}

// Comprehensive allergen detection dictionary for Italian gastronomy
const ALLERGEN_RULES: { tag: string; patterns: RegExp[] }[] = [
  {
    tag: 'Gluten Free',
    patterns: [/\b(senza glutine|gluten free|no glutine|grano saraceno)\b/i],
  },
  {
    tag: 'Lattosio',
    patterns: [/\b(formaggi[oe]|burro|panna|parmigiano|mozzarella|burrata|stracciatella|ricotta|mascarpone|latte|gorgonzola|pecorino|provola|scamorza)\b/i],
  },
  {
    tag: 'Crostacei',
    patterns: [/\b(gamber[io]|scamp[io]|astice|aragosta|granchi[oe]|mazzancoll[ae]|canocch\w+)\b/i],
  },
  {
    tag: 'Molluschi',
    patterns: [/\b(vongol\w+|cozz\w+|calamar\w+|polp\w+|seppi\w+|moscardin\w+|tellin\w+|tartufi di mare)\b/i],
  },
  {
    tag: 'Pesce',
    patterns: [/\b(pesce|spigola|orata|tonno|salmone|merluzzo|baccal[aà]|alici|acciughe|rombo|pescespada)\b/i],
  },
  {
    tag: 'Uova',
    patterns: [/\b(uov\w+|tuorlo|albume|maionese|carbonara|crema pasticcera|zabaione)\b/i],
  },
  {
    tag: 'Frutta a guscio',
    patterns: [/\b(noc[ie]|nocciole|pistacchi\w*|mandorl\w+|pinoli|anacardi)\b/i],
  },
  {
    tag: 'Vegetariano',
    patterns: [/\b(vegetariano|verdure|ortaggi|senza carne)\b/i],
  },
  {
    tag: 'Vegano',
    patterns: [/\b(vegano|vegan|100% vegetale)\b/i],
  },
];

function analyzeAllergensHeuristically(text: string): string[] {
  const detected: string[] = [];
  const lower = text.toLowerCase();

  const meatFishPattern = /\b(carne|manzo|angus|maiale|pollo|prosciutto|guanciale|pancetta|salsiccia|bacon|pesce|spigola|tonno|gamber[io]|salmone|alici)\b/i;
  const hasMeatOrFish = meatFishPattern.test(lower);

  for (const rule of ALLERGEN_RULES) {
    if (rule.tag === 'Vegetariano') {
      if (!hasMeatOrFish && (lower.includes('verdure') || lower.includes('pomodoro') || lower.includes('formaggio') || lower.includes('mozzarella'))) {
        detected.push('Vegetariano');
      }
    } else if (rule.tag === 'Vegano') {
      const dairyEggPattern = /\b(formaggi[oe]|burro|panna|parmigiano|mozzarella|uov\w+|latte|miele)\b/i;
      if (!hasMeatOrFish && !dairyEggPattern.test(lower) && (lower.includes('verdura') || lower.includes('legumi') || lower.includes('vegan'))) {
        detected.push('Vegano');
      }
    } else if (rule.tag === 'Gluten Free') {
      if (rule.patterns.some((p) => p.test(lower))) {
        detected.push('Gluten Free');
      }
    } else {
      if (rule.patterns.some((p) => p.test(lower))) {
        detected.push(rule.tag);
      }
    }
  }

  return Array.from(new Set(detected));
}

function generateGourmetCopyFallback(name: string, rawIngredients?: string): { description: string; tags: string[] } {
  const cleanName = name.trim();
  const cleanIng = (rawIngredients || '').trim();
  const combined = `${cleanName} ${cleanIng}`.toLowerCase();

  let desc = '';
  if (combined.includes('carbonara')) {
    desc = 'Spaghetti di grano duro trafilati al bronzo mantecati con cremoso tuorlo d\'uovo di galline ruspanti, croccante guanciale artigianale e generosa spolverata di Pecorino Romano DOP stagionato con pepe nero tostato al momento.';
  } else if (combined.includes('margherita')) {
    desc = 'Impasto ad alta idratazione a lenta lievitazione naturale (48h), pomodoro San Marzano DOP schiacciato a mano, fior di latte di Agerola freschissimo e foglie di basilico napoletano profumato all\'olio evo biologico.';
  } else if (combined.includes('tagliata') || combined.includes('angus') || combined.includes('fiorentina')) {
    desc = 'Taglio nobile selezionato frollato con cura, cotto alla griglia su brace ardente, rifinito con fiocchi di sale Maldon puro, gocce di olio extravergine d\'oliva fruttato e rametti di rosmarino fresco.';
  } else if (combined.includes('risotto')) {
    desc = 'Riso Carnaroli autentico tostato a secco, sfumato al vino bianco e mantecato all\'onda con burro di malga fresco, arricchito da ingredienti di stagione selezionati con maestria dallo chef.';
  } else if (combined.includes('tiramis') || combined.includes('dolce') || combined.includes('cheesecake')) {
    desc = 'Creazione dolce artigianale preparata ogni mattina nella nostra pasticceria interna, equilibrio perfetto tra morbidezza vellutata e contrasto aromatico per chiudere in dolcezza.';
  } else {
    desc = cleanIng
      ? `Preparazione d'autore realizzata con ${cleanIng}. Sapori armoniosi e materie prime freschissime lavorate con passione e rispetto della tradizione.`
      : `Specialità della casa preparata a regola d'arte con ingredienti d'eccellenza rigorosamente selezionati, esaltati da una cottura impeccabile.`;
  }

  const detectedTags = analyzeAllergensHeuristically(`${cleanName} ${cleanIng} ${desc}`);
  return { description: desc, tags: detectedTags };
}

export async function POST(request: NextRequest) {
  try {
    const body: DishEnhancerRequest = await request.json();
    const dishName = sanitizeString(body.dishName, 150) || '';
    const rawIngredients = sanitizeString(body.rawIngredients || '', 300) || '';

    if (!dishName) {
      return NextResponse.json({ error: 'Nome del piatto obbligatorio' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `Sei uno Chef stellato Michelin e copywriter gastronomico di altissimo livello.
Il ristoratore vuole inserire nel menù il seguente piatto:
- Nome: "${dishName}"
- Ingredienti o bozza: "${rawIngredients || 'non specificati'}"

Il tuo compito:
1. Scrivi una descrizione breve (2-3 frasi, massimo 240 caratteri) invitante, poetica, appetitosa e professionale, in perfetto italiano, senza usare cliché banali né emoji.
2. Identifica gli allergeni e i tag corretti tra: ["Gluten Free", "Lattosio", "Crostacei", "Molluschi", "Pesce", "Uova", "Frutta a guscio", "Vegetariano", "Vegano", "Chef Selection", "Novità"].

Rispondi ESCLUSIVAMENTE in formato JSON valido:
{
  "description": "...",
  "tags": ["..."]
}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (rawText) {
            const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return NextResponse.json({
              description: parsed.description || generateGourmetCopyFallback(dishName, rawIngredients).description,
              tags: Array.isArray(parsed.tags) ? parsed.tags : analyzeAllergensHeuristically(`${dishName} ${rawIngredients}`),
            });
          }
        }
      } catch (geminiErr) {
        console.warn('[AI Dish Enhancer] Gemini error, using heuristic fallback:', geminiErr);
      }
    }

    // Heuristic fallback
    const result = generateGourmetCopyFallback(dishName, rawIngredients);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

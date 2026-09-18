import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID, sanitizeString } from '@/lib/security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface WinePairingRecommendation {
  name: string;
  type: 'Rosso' | 'Bianco' | 'Bollicine' | 'Rosato' | 'Passito';
  region: string;
  tastingNotes: string;
  whyItWorks: string;
  priceEstimate: string;
}

function getSmartDishPairingFallback(dishName: string, dishDescription: string = '', venueName: string = 'il nostro locale'): {
  reply: string;
  winePairing: WinePairingRecommendation;
} {
  const combined = `${dishName} ${dishDescription}`.toLowerCase();

  if (combined.includes('carne') || combined.includes('angus') || combined.includes('tagliata') || combined.includes('fiorentina') || combined.includes('filetto') || combined.includes('tartare')) {
    const wine: WinePairingRecommendation = {
      name: 'Chianti Classico DOCG Riserva',
      type: 'Rosso',
      region: 'Toscana',
      tastingNotes: 'Sentori di ciliegia marasca, tabacco e spezie tostate con tannini vellutati.',
      whyItWorks: 'L\'acidità viva e la trama tannica ripuliscono il palato dalla ricchezza succulenta della carne, esaltandone la frollatura.',
      priceEstimate: '28,00 €',
    };
    return {
      reply: `Per accompagnare al meglio "${dishName}", il nostro sommelier consiglia un ${wine.name} (${wine.region}): ${wine.whyItWorks}`,
      winePairing: wine,
    };
  }

  if (combined.includes('pesce') || combined.includes('vongol') || combined.includes('spigola') || combined.includes('gamber') || combined.includes('crostacei') || combined.includes('orata') || combined.includes('frutti di mare')) {
    const wine: WinePairingRecommendation = {
      name: 'Greco di Tufo DOCG',
      type: 'Bianco',
      region: 'Campania',
      tastingNotes: 'Bouquet minerale con note di pesca bianca, mandorla amara e zagara selvatica.',
      whyItWorks: 'La spiccata sapidità vulcanica crea un\'armonia sublime con la nota iodata e la dolcezza del pesce fresco.',
      priceEstimate: '24,00 €',
    };
    return {
      reply: `In abbinamento a "${dishName}", ti suggeriamo un eccellente ${wine.name} (${wine.region}): ${wine.whyItWorks}`,
      winePairing: wine,
    };
  }

  if (combined.includes('pizza') || combined.includes('margherita') || combined.includes('bufala') || combined.includes('burrata') || combined.includes('pomodoro')) {
    const wine: WinePairingRecommendation = {
      name: 'Franciacorta Brut DOCG',
      type: 'Bollicine',
      region: 'Lombardia',
      tastingNotes: 'Perlage finissimo e persistente, note di crosta di pane dorata e agrumi freschi.',
      whyItWorks: 'L\'effervescenza naturale bilancia perfettamente l\'untuosità nobile del fior di latte e l\'acidità del pomodoro San Marzano.',
      priceEstimate: '32,00 €',
    };
    return {
      reply: `Per esaltare la maestria dell'impasto di "${dishName}", la bollicina ideale è un ${wine.name} (${wine.region}): ${wine.whyItWorks}`,
      winePairing: wine,
    };
  }

  if (combined.includes('dolce') || combined.includes('tiramis') || combined.includes('cheesecake') || combined.includes('dessert') || combined.includes('cioccolato')) {
    const wine: WinePairingRecommendation = {
      name: 'Moscato d\'Asti DOCG di Canelli',
      type: 'Passito',
      region: 'Piemonte',
      tastingNotes: 'Profumo inebriante di salvia, pesca sciroppata e miele d\'acacia con piacevole effervescenza.',
      whyItWorks: 'La dolcezza aromatica e la freschezza naturale completano il dessert senza mai appesantire il finale di bocca.',
      priceEstimate: '20,00 €',
    };
    return {
      reply: `Per chiudere in gloria con "${dishName}", il connubio perfetto è con un ${wine.name} (${wine.region}): ${wine.whyItWorks}`,
      winePairing: wine,
    };
  }

  // Generic fallback
  const wine: WinePairingRecommendation = {
    name: 'Falanghina del Sannio DOC',
    type: 'Bianco',
    region: 'Campania',
    tastingNotes: 'Fragrante, equilibrato, con profumi floreali e sentori di mela verde.',
    whyItWorks: 'Vino versatile e brillante, capace di dialogare magnificamente con le sfumature delicate di questa portata.',
    priceEstimate: '22,00 €',
  };
  return {
    reply: `Per valorizzare "${dishName}", ti consigliamo una bottiglia di ${wine.name} (${wine.region}): ${wine.whyItWorks}`,
    winePairing: wine,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, message, dishName, dishDescription } = body;

    const cleanDishName = sanitizeString(dishName || '', 150) || '';
    const cleanDishDesc = sanitizeString(dishDescription || '', 300) || '';
    const cleanMessage = sanitizeString(message || (cleanDishName ? `Quale vino abbinare a ${cleanDishName}?` : ''), 500) || '';

    if (!cleanMessage && !cleanDishName) {
      return NextResponse.json({ error: 'Messaggio o piatto obbligatorio' }, { status: 400 });
    }

    // Fetch org details & custom menu context
    let orgName = 'il nostro locale';
    let menuContext = 'Cucina tradizionale di qualità, materie prime fresche, cantina vini campani e nazionali.';

    if (organization_id && isValidUUID(organization_id)) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, ai_menu_context')
        .eq('id', organization_id)
        .single();

      if (org) {
        orgName = sanitizeString(org.name, 100) || orgName;
        if (org.ai_menu_context) {
          menuContext = sanitizeString(org.ai_menu_context, 2000) || menuContext;
        }
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (cleanDishName) {
      // Dish-specific pairing request
      if (apiKey) {
        try {
          const prompt = `Sei il Sommelier AIS e Maître di sala di "${orgName}".
Un ospite al tavolo sta ordinando il piatto:
- Piatto: "${cleanDishName}"
- Descrizione: "${cleanDishDesc || 'specialità della casa'}"
- Dettagli cantina del locale: ${menuContext}

Consiglia il vino ideale (preferibilmente presente nella cantina o un grande classico italiano DOC/DOCG che si sposa alla perfezione).
Rispondi ESCLUSIVAMENTE in JSON valido con questo formato:
{
  "name": "Nome del Vino DOC/DOCG",
  "type": "Rosso" | "Bianco" | "Bollicine" | "Rosato" | "Passito",
  "region": "Regione d'origine",
  "tastingNotes": "Descrizione sintetica del bouquet olfattivo e gustativo",
  "whyItWorks": "Spiegazione enogastronomica di perché si abbina magnificamente al piatto",
  "priceEstimate": "26,00 €"
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
              const wine: WinePairingRecommendation = {
                name: parsed.name,
                type: parsed.type || 'Rosso',
                region: parsed.region || 'Italia',
                tastingNotes: parsed.tastingNotes || '',
                whyItWorks: parsed.whyItWorks || '',
                priceEstimate: parsed.priceEstimate || '24,00 €',
              };
              return NextResponse.json({
                reply: `Per "${cleanDishName}", ti consigliamo ${wine.name} (${wine.region}): ${wine.whyItWorks}`,
                winePairing: wine,
              });
            }
          }
        } catch (geminiErr) {
          console.warn('[AI Sommelier] Gemini pairing error, using fallback:', geminiErr);
        }
      }

      // Fallback dish pairing
      const fallback = getSmartDishPairingFallback(cleanDishName, cleanDishDesc, orgName);
      return NextResponse.json(fallback);
    }

    // General sommelier conversational advice
    if (apiKey) {
      try {
        const systemPrompt = `Sei il Sommelier e Maître di sala virtuale di "${orgName}".
Il tuo ruolo è accogliere l'ospite al tavolo, consigliare abbinamenti perfetti tra i piatti e i vini, chiarire dubbi su allergeni e valorizzare la cantina.
Menù e dettagli del locale:
${menuContext}

Stile di comunicazione:
- Stile sobrio, elegante e professionale, senza emoji o cliché informali.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: `${systemPrompt}\n\nDomanda dell'ospite: "${cleanMessage}"` }] },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (reply) {
            return NextResponse.json({ reply });
          }
        }
      } catch (geminiErr) {
        console.warn('[AI Sommelier] Gemini API error, using smart fallback:', geminiErr);
      }
    }

    // General fallback advice
    const fallbackGeneral = getSmartDishPairingFallback(cleanMessage, '', orgName);
    return NextResponse.json({ reply: fallbackGeneral.reply, winePairing: fallbackGeneral.winePairing });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

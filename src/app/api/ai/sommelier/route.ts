import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function getSmartFallbackAdvice(userMsg: string, venueName: string): string {
  const q = userMsg.toLowerCase();

  if (q.includes('carne') || q.includes('bistecca') || q.includes('tagliata') || q.includes('filetto')) {
    return `Per piatti a base di carne rossa come tagliata o filetto da ${venueName}, ti consiglio un rosso strutturato e armonico: un Aglianico del Taburno o un Chianti Classico esalteranno alla perfezione la succosità della carne.`;
  }

  if (q.includes('pesce') || q.includes('frutti di mare') || q.includes('spaghetti') || q.includes('bianco')) {
    return `Con primi piatti di mare o pesce fresco, l'abbinamento ideale da ${venueName} è un vino bianco fresco e minerale: ti suggerisco una Falanghina del Sannio o un Greco di Tufo dalle note agrumate e persistenti.`;
  }

  if (q.includes('glutine') || q.includes('celiac') || q.includes('allerg') || q.includes('lattosio')) {
    return `La nostra cucina pone estrema attenzione a intolleranze e celiachia. Abbiamo opzioni dedicate senza glutine e senza lattosio. Segnalalo subito al personale di sala che ti indicherà le portate cucinate in sicurezza assoluta.`;
  }

  if (q.includes('dolce') || q.includes('dessert') || q.includes('tiramis') || q.includes('fine')) {
    return `Per concludere in bellezza la tua esperienza da ${venueName}, ti consigliamo il nostro Tiramisù artigianale o la Cheesecake ai frutti di bosco, accompagnati da un bicchierino di amaro alle erbe o passito.`;
  }

  return `Benvenuto da ${venueName}! I nostri chef e sommelier consigliano di iniziare con un antipasto degustazione della casa e una bollicina fresca di benvenuto. Se hai richieste specifiche su carne, pesce o allergeni, chiedimi pure.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Messaggio obbligatorio' }, { status: 400 });
    }

    // Fetch org details & custom menu context
    let orgName = 'il nostro locale';
    let menuContext = 'Cucina tradizionale di qualità, materie prime fresche, cantina vini campani e nazionali.';

    if (organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, ai_menu_context')
        .eq('id', organization_id)
        .single();

      if (org) {
        orgName = org.name;
        if (org.ai_menu_context) {
          menuContext = org.ai_menu_context;
        }
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

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
                { role: 'user', parts: [{ text: `${systemPrompt}\n\nDomanda dell'ospite: "${message}"` }] },
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

    // Fallback
    const fallbackReply = getSmartFallbackAdvice(message, orgName);
    return NextResponse.json({ reply: fallbackReply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

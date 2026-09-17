import { NextRequest, NextResponse } from 'next/server';
import { sanitizeString } from '@/lib/security';

interface ReviewRequest {
  venueName?: string;
  tags?: string[];
  rating?: number;
}

const TEMPLATES: Record<string, string[]> = {
  food: [
    'Qualità del cibo davvero impeccabile, ogni piatto preparato con cura e ingredienti freschi.',
    'Esperienza gastronomica eccellente! Sapori autentici e porzioni giuste.',
    'Pietanze deliziose, cotte alla perfezione e presentate con grande cura.',
  ],
  service: [
    'Personale cordiale, veloce e sempre attento a ogni dettaglio durante tutto il servizio.',
    'Accoglienza calorosa e servizio rapido ed efficiente, ci siamo sentiti subito a casa.',
    'Camerieri gentili e professionali, attenti alle nostre richieste con il sorriso.',
  ],
  atmosphere: [
    'Atmosfera davvero piacevole e rilassante, location moderna e curata nei minimi dettagli.',
    'Ambiente elegante ma accogliente, perfetto sia per una cena tra amici che per una serata speciale.',
    'Locale pulitissimo e di grande atmosfera, musica di sottofondo ideale.',
  ],
  price: [
    'Rapporto qualità-prezzo eccellente, assolutamente consigliato a chi cerca qualità senza sorprese.',
    'Prezzi onesti per la qualità delle materie prime offerte. Torneremo sicuramente!',
  ],
};

function generateFallbackReview(venueName: string, tags: string[]): string {
  const cleanVenue = venueName || 'questo locale';
  const sentences: string[] = [];

  if (tags.some((t) => t.toLowerCase().includes('cibo') || t.toLowerCase().includes('piatto') || t.toLowerCase().includes('carne') || t.toLowerCase().includes('pizza'))) {
    sentences.push(TEMPLATES.food[Math.floor(Math.random() * TEMPLATES.food.length)]);
  }
  if (tags.some((t) => t.toLowerCase().includes('servizio') || t.toLowerCase().includes('staff') || t.toLowerCase().includes('veloce') || t.toLowerCase().includes('personale'))) {
    sentences.push(TEMPLATES.service[Math.floor(Math.random() * TEMPLATES.service.length)]);
  }
  if (tags.some((t) => t.toLowerCase().includes('atmosfera') || t.toLowerCase().includes('location') || t.toLowerCase().includes('posto'))) {
    sentences.push(TEMPLATES.atmosphere[Math.floor(Math.random() * TEMPLATES.atmosphere.length)]);
  }

  if (sentences.length === 0) {
    sentences.push(TEMPLATES.food[0]);
    sentences.push(TEMPLATES.service[0]);
  }

  sentences.push(`Consiglio vivamente ${cleanVenue} a chiunque voglia passare una piacevole esperienza!`);
  return sentences.join(' ');
}
 
export async function POST(request: NextRequest) {
  try {
    const body: ReviewRequest = await request.json();
    const venueName = sanitizeString(body.venueName, 100) || 'questo locale';
    const rawTags = Array.isArray(body.tags) ? body.tags : ['cibo squisito', 'servizio impeccabile'];
    const tags = rawTags
      .map((t) => sanitizeString(t, 50))
      .filter((t): t is string => Boolean(t))
      .slice(0, 8);

    if (tags.length === 0) {
      tags.push('ottimo servizio', 'qualità eccellente');
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    // If Gemini API Key is available, generate via Google Gemini
    if (apiKey) {
      try {
        const prompt = `Sei un cliente felice ed entusiasta che sta scrivendo una recensione Google a 5 stelle per il locale "${venueName}".
I punti forti da evidenziare sono: ${tags.join(', ')}.
Scrivi una recensione autentica, spontanea, in perfetto italiano, di massimo 2 o 3 frasi, ideale per la Local SEO su Google Maps.
Non usare virgolette all'inizio o alla fine. Non aggiungere spiegazioni o titoli.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (generatedText) {
            return NextResponse.json({ reviewText: generatedText });
          }
        }
      } catch (geminiErr) {
        console.warn('[AI Review API] Gemini API request failed, fallback used:', geminiErr);
      }
    }

    // High quality intelligent template fallback
    const fallbackText = generateFallbackReview(venueName, tags);
    return NextResponse.json({ reviewText: fallbackText });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

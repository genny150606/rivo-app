import { NextRequest, NextResponse } from 'next/server';
import { verifyUserOrgAccess } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'Immagine non valida o mancante' }, { status: 400 });
    }

    // Strip data:image/...;base64, prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (geminiKey) {
      try {
        const prompt = `Sei un sistema esperto OCR e Vision per il retail calzaturiero.
Analizza con la massima accuratezza questa foto dell'etichetta di una scatola di scarpe (o cartellino/codice a barre).
Estrai ESCLUSIVAMENTE le informazioni che riesci a LEGGERE sul testo stampato:
1. Marca/Brand (es. Nero Giardini, Hogan, Nike, Adidas, Geox, Liu Jo, Premiata, Saucony, Clarks, ecc.)
2. Modello o codice articolo scritto sulla scatola (es. codice stile tipo "I117001D", "Mocassino", o nome modello)
3. Taglia/Misura EU (es. 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46)
4. Colore stampato (es. Nero, T.Moro, Bianco, Blu, ecc.)
5. Codice a barre / EAN numerico impresso sotto le barre
6. Prezzo di listino se stampato, altrimenti 0

REGOLE TASSATIVE:
- NON INVENTARE ASSOLUTAMENTE NULLA. Riporta solo ciò che leggi con gli occhi.
- Se l'etichetta dice "NERO GIARDINI", brand è "Nero Giardini".
- Se un campo non è presente o illeggibile, restituisci una stringa vuota "" (o 0 per il prezzo).

Rispondi ESCLUSIVAMENTE con questo JSON:
{
  "brand": "stringa letta o vuota",
  "model": "stringa letta o vuota",
  "size": "taglia letta o vuota",
  "color": "colore letto o vuoto",
  "barcode": "cifre ean lette o vuoto",
  "estimatedPrice": 0,
  "confidence": 0.95
}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: base64Data
                    }
                  }
                ]
              }]
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (rawText) {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const brand = (parsed.brand || '').trim();
              const model = (parsed.model || '').trim();
              const fullName = [brand, model].filter(Boolean).join(' ') || 'Articolo da Scatola';
              const price = Number(parsed.estimatedPrice) || 0;

              return NextResponse.json({
                success: true,
                source: 'gemini_vision',
                recognized: {
                  brand,
                  name: fullName,
                  size: (parsed.size || '').trim(),
                  color: (parsed.color || '').trim(),
                  barcode: (parsed.barcode || '').trim(),
                  sellingPrice: price > 0 ? price : 0,
                  costPrice: price > 0 ? Math.round(price * 0.45) : 0,
                  confidence: parsed.confidence || 0.9
                }
              });
            }
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini vision API error:', geminiErr);
      }
    }

    if (!geminiKey) {
      return NextResponse.json({
        success: false,
        error: "Chiave Google AI Gemini mancante. Per attivare l'AI Vision in tempo reale e leggere le etichette delle scarpe, inserisci la GEMINI_API_KEY.",
        missingApiKey: true,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Etichetta non leggibile o non riconosciuta. Assicurati che l'etichetta sia ben illuminata e a fuoco.",
    }, { status: 422 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore scansione etichetta';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

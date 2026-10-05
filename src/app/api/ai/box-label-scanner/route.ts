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
        const prompt = `Sei un esperto di calzature e retail fashion. 
Analizza con estrema precisione questa foto di un'etichetta di una scatola di scarpe o codice a barre.
Trova e ricava:
1. Marca/Brand (es. Nike, Adidas, Borrelli, New Balance, Puma, ecc.)
2. Modello esatto (es. Air Max 95, Mocassino Artigianale, Dunk Low, ecc.)
3. Numero/Taglia EU (es. 42, 43, 39, ecc.)
4. Colore prevalente (es. Nero, Bianco, Cognac, Blu)
5. Eventuale codice a barre / EAN leggibile numerico
6. Prezzo indicativo di vendita in euro

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido (senza markdown o testo extra):
{
  "brand": "Nike",
  "model": "Air Max 95",
  "size": "43",
  "color": "Nero / Grigio",
  "barcode": "8051234567890",
  "estimatedPrice": 179.99,
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
            const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return NextResponse.json({
              success: true,
              source: 'gemini_vision',
              recognized: {
                brand: parsed.brand || 'Borrelli',
                name: `${parsed.brand || 'Scarpa'} ${parsed.model || 'Fashion'}`,
                size: parsed.size || '42',
                color: parsed.color || 'Standard',
                barcode: parsed.barcode || `EAN-${Date.now().toString().slice(-8)}`,
                sellingPrice: Number(parsed.estimatedPrice) || 130.00,
                costPrice: Math.round((Number(parsed.estimatedPrice) || 130.00) * 0.45),
                confidence: parsed.confidence || 0.95
              }
            });
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

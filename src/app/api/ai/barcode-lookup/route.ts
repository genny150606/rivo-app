import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('code')?.trim();

    if (!barcode) {
      return NextResponse.json({ error: 'Codice a barre richiesto' }, { status: 400 });
    }

    // 1. Check if barcode already exists in this tenant's inventory
    const { data: existingVariant } = await supabase
      .from('product_variants')
      .select(`
        id,
        sku,
        barcode,
        size,
        color,
        cost_price,
        sale_price,
        attributes,
        products (
          id,
          name,
          sku,
          brand,
          brand_id,
          category_name,
          category_id,
          sale_price,
          cost_price
        )
      `)
      .eq('barcode', barcode)
      .eq('organization_id', profile.organization_id)
      .maybeSingle();

    if (existingVariant && existingVariant.products) {
      const p = existingVariant.products as any;
      const { data: balance } = await supabase
        .from('inventory_balances')
        .select('quantity_on_hand')
        .eq('variant_id', existingVariant.id)
        .maybeSingle();

      const currentStock = balance?.quantity_on_hand || 0;
      return NextResponse.json({
        exists: true,
        item: {
          variantId: existingVariant.id,
          productId: p.id,
          name: p.name,
          brand: p.brand || '',
          category: p.category_name || 'Calzature',
          size: existingVariant.size || (existingVariant.attributes as any)?.size || '',
          color: existingVariant.color || (existingVariant.attributes as any)?.color || '',
          barcode: existingVariant.barcode,
          sku: existingVariant.sku,
          currentStock,
          sellingPrice: existingVariant.sale_price || p.sale_price || 0,
          costPrice: existingVariant.cost_price || p.cost_price || 0,
        }
      });
    }

    // 2. Barcode NOT in catalog -> Query Real Global Barcode Databases (UPCitemdb, OpenProductFacts, Gemini Grounding)
    let realItem: any = null;

    // A. Query UPCitemdb (Free global retail product database: 700M+ barcodes)
    try {
      const upcRes = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 86400 },
      });
      if (upcRes.ok) {
        const upcData = await upcRes.json();
        if (upcData.code === 'OK' && upcData.items && upcData.items.length > 0) {
          const item = upcData.items[0];
          const rawTitle = item.title || '';
          const brand = item.brand || '';
          
          // Extract shoe size from title or description if present (e.g. Size 43, US 9.5, EUR 42)
          const sizeMatch = rawTitle.match(/(?:size|tg|taglia|eur|eu|us)\s*[:.]?\s*(\d{1,2}(?:\.\d|\s*½)?)/i) || 
                            rawTitle.match(/\b(3[6-9]|4[0-8])\b/);
          const size = sizeMatch ? sizeMatch[1].trim() : '';

          const price = Number(item.highest_recorded_price || item.lowest_recorded_price || 0);

          realItem = {
            barcode,
            name: rawTitle || (brand ? `${brand} Prodotto` : 'Articolo Riconosciuto'),
            brand,
            category: item.category?.split('>')?.[0]?.trim() || 'Calzature',
            size,
            color: item.color || '',
            sellingPrice: price > 0 ? price : 0,
            costPrice: price > 0 ? Math.round(price * 0.45) : 0,
            source: 'upcitemdb_global',
          };
        }
      }
    } catch (upcErr) {
      console.warn('UPCitemdb lookup error:', upcErr);
    }

    // B. Query Open Food / Retail Facts if not yet found
    if (!realItem) {
      try {
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`, {
          headers: { 'Accept': 'application/json' },
        });
        if (offRes.ok) {
          const offData = await offRes.json();
          if (offData.status === 1 && offData.product) {
            const p = offData.product;
            const brand = p.brands || '';
            const name = p.product_name || (brand ? `${brand} Prodotto` : 'Articolo');
            realItem = {
              barcode,
              name,
              brand,
              category: p.categories?.split(',')?.[0]?.trim() || 'Retail',
              size: '',
              color: '',
              sellingPrice: 0,
              costPrice: 0,
              source: 'openfoodfacts_global',
            };
          }
        }
      } catch (offErr) {
        console.warn('OpenFoodFacts lookup error:', offErr);
      }
    }

    // C. Query Gemini AI with Live Google Search Grounding if API key is present
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!realItem && geminiKey) {
      try {
        const prompt = `Cerca sul web il codice a barre o EAN: "${barcode}".
Identifica il prodotto reale (marca, nome/modello esatto, categoria, eventuale taglia o colore, prezzo indicativo se noto).
REGOLE CRITICHE:
- Esegui una ricerca Google per questo EAN/codice a barre.
- NON inventare MAI marche, modelli o taglie!
- Se il codice a barre NON corrisponde ad alcun prodotto reale sul web o non sei sicuro al 100%, rispondi ESCLUSIVAMENTE con:
\`\`\`json
{
  "found": false
}
\`\`\`
- Se invece trovi con certezza il prodotto reale indicizzato sul web, restituisci il blocco JSON:
\`\`\`json
{
  "found": true,
  "brand": "Nome del Brand",
  "name": "Nome completo o modello del prodotto",
  "category": "Calzature",
  "size": "Taglia se presente altrimenti vuoto",
  "color": "Colore se specificato altrimenti vuoto",
  "sellingPrice": 0.00
}
\`\`\``;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              tools: [{ googleSearch: {} }]
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (rawText) {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.found && parsed.name) {
                const sellPrice = Number(parsed.sellingPrice) || 0;
                realItem = {
                  barcode,
                  name: parsed.name,
                  brand: parsed.brand || '',
                  category: parsed.category || 'Calzature',
                  size: parsed.size || '',
                  color: parsed.color || '',
                  sellingPrice: sellPrice > 0 ? sellPrice : 0,
                  costPrice: sellPrice > 0 ? Math.round(sellPrice * 0.45) : 0,
                  source: 'google_search_grounding',
                };
              }
            }
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini barcode lookup error:', geminiErr);
      }
    }

    // D. If found in real global databases:
    if (realItem) {
      return NextResponse.json({
        exists: false,
        recognized: realItem,
      });
    }

    // E. Truly UNKNOWN Barcode: NEVER invent fake mock data! Return truthful not-found
    return NextResponse.json({
      exists: false,
      recognized: null,
      notFound: true,
      barcode,
      message: 'Codice a barre non presente nei database globali. Inquadra l’etichetta della scatola per far leggere marca, modello e taglia con l’AI Vision.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore lookup';
    console.error('Barcode lookup error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

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
          brand: p.brand || 'Borrelli',
          category: p.category_name || 'Calzature',
          size: existingVariant.size || (existingVariant.attributes as any)?.size || 'TU',
          color: existingVariant.color || (existingVariant.attributes as any)?.color || 'Standard',
          barcode: existingVariant.barcode,
          sku: existingVariant.sku,
          currentStock,
          sellingPrice: existingVariant.sale_price || p.sale_price || 0,
          costPrice: existingVariant.cost_price || p.cost_price || 0,
        }
      });
    }

    // 2. Barcode NOT in catalog -> Query Real Global Barcode Databases (UPCitemdb, OpenProductFacts, Gemini)
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
          const brand = item.brand || 'Brand Riconosciuto';
          
          // Extract shoe size from title or description if present (e.g. Size 43, US 9.5, EUR 42)
          const sizeMatch = rawTitle.match(/(?:size|tg|taglia|eur|eu|us)\s*[:.]?\s*(\d{1,2}(?:\.\d|\s*½)?)/i) || 
                            rawTitle.match(/\b(3[6-9]|4[0-8])\b/);
          const size = sizeMatch ? sizeMatch[1].trim() : '42';

          const price = Number(item.highest_recorded_price || item.lowest_recorded_price || 0);

          realItem = {
            barcode,
            name: rawTitle || `${brand} Fashion`,
            brand,
            category: item.category?.split('>')?.[0]?.trim() || 'Calzature',
            size,
            color: item.color || 'Standard',
            sellingPrice: price > 0 ? price : 120.00,
            costPrice: price > 0 ? Math.round(price * 0.45) : 55.00,
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
            const brand = p.brands || 'Brand Riconosciuto';
            const name = p.product_name || `${brand} Prodotto`;
            realItem = {
              barcode,
              name,
              brand,
              category: p.categories?.split(',')?.[0]?.trim() || 'Retail',
              size: 'Standard',
              color: 'Standard',
              sellingPrice: 15.00,
              costPrice: 7.00,
              source: 'openfoodfacts_global',
            };
          }
        }
      } catch (offErr) {
        console.warn('OpenFoodFacts lookup error:', offErr);
      }
    }

    // C. Query Gemini AI with Google Knowledge Base if API key is present
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!realItem && geminiKey) {
      try {
        const prompt = `Sei un esperto di retail calzature e moda. Identifica il prodotto reale associato a questo codice a barre EAN/UPC: "${barcode}".
Se riesci a identificare la scarpa o il prodotto, rispondi ESCLUSIVAMENTE con un JSON:
{
  "found": true,
  "brand": "Nike",
  "name": "Nike Air Max 95",
  "category": "Calzature",
  "size": "43",
  "color": "Nero / Grigio",
  "sellingPrice": 180.00,
  "costPrice": 80.00
}
Se il codice a barre non corrisponde a nessun prodotto noto, rispondi con: { "found": false }`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
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
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (rawText) {
            const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            if (parsed.found) {
              realItem = {
                barcode,
                name: parsed.name || `${parsed.brand} Calzatura`,
                brand: parsed.brand || 'Brand',
                category: parsed.category || 'Calzature',
                size: parsed.size || '42',
                color: parsed.color || 'Standard',
                sellingPrice: Number(parsed.sellingPrice) || 120.00,
                costPrice: Number(parsed.costPrice) || 55.00,
                source: 'gemini_knowledge',
              };
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

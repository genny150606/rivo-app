import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseRetailIntent } from '@/platform/ai/retail-nlp';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Nessuna organizzazione associata' }, { status: 400 });
    }

    const orgId = profile.organization_id;
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Messaggio non valido' }, { status: 400 });
    }

    // 1. Load catalog context
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, name, sku')
      .eq('organization_id', orgId)
      .limit(100);

    const { data: existingBrands } = await supabase
      .from('brands')
      .select('id, name')
      .eq('organization_id', orgId);

    const { data: existingCategories } = await supabase
      .from('product_categories')
      .select('id, name')
      .eq('organization_id', orgId);

    // 2. Parse intent via Retail NLP Engine
    const parsed = parseRetailIntent(message, (existingProducts || []).map(p => ({ name: p.name })));

    // Optional Gemini 1.5 Flash Enhancement if API key is present
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (geminiKey && parsed.intent === 'GENERAL_CHAT') {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [{
                  text: `Sei l'Assistente AI di RIVO Retail per il punto vendita.
Il negoziante scrive: "${message}".
Prodotti attuali in negozio: ${(existingProducts || []).map(p => p.name).slice(0, 10).join(', ')}.
Rispondi in modo cordiale, sintetico e professionale in italiano (massimo 2-3 frasi). Spiega come puoi aiutarlo a caricare prodotti, verificare giacenze o registrare carichi.`
                }]
              }],
            }),
          }
        );
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (rawText) {
            return NextResponse.json({
              reply: rawText,
              parsed,
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini optional fallback error:', geminiErr);
      }
    }

    // 3. Handle ADD_PRODUCT_OR_STOCK
    if (parsed.intent === 'ADD_PRODUCT_OR_STOCK') {
      const quantityToAdd = parsed.quantity || 1;
      const targetSize = parsed.size || 'TU';
      const targetColor = parsed.color || null;

      // 3.1 Resolve or create Category
      let categoryId: string | null = null;
      const matchedCat = existingCategories?.find(
        c => c.name.toLowerCase() === (parsed.category || 'Altro').toLowerCase()
      );
      if (matchedCat) {
        categoryId = matchedCat.id;
      } else {
        const catName = parsed.category || 'Altro';
        const { data: newCat } = await supabase
          .from('product_categories')
          .insert({ organization_id: orgId, name: catName, slug: catName.toLowerCase().replace(/[^a-z0-9]/g, '-') })
          .select('id')
          .single();
        categoryId = newCat?.id || null;
      }

      // 3.2 Resolve or create Brand
      let brandId: string | null = null;
      if (parsed.brand) {
        const matchedBrand = existingBrands?.find(
          b => b.name.toLowerCase() === parsed.brand!.toLowerCase()
        );
        if (matchedBrand) {
          brandId = matchedBrand.id;
        } else {
          const { data: newBrand } = await supabase
            .from('brands')
            .insert({ organization_id: orgId, name: parsed.brand, slug: parsed.brand.toLowerCase().replace(/[^a-z0-9]/g, '-') })
            .select('id')
            .single();
          brandId = newBrand?.id || null;
        }
      }

      // 3.3 Find existing product by name
      let product = existingProducts?.find(
        p => p.name.toLowerCase().includes(parsed.productName.toLowerCase()) ||
             parsed.productName.toLowerCase().includes(p.name.toLowerCase())
      );

      let productId: string;
      let productSku: string;

      if (!product) {
        // Create Product
        productSku = `PRD-${Date.now().toString().slice(-6)}`;
        const { data: newProd, error: prodErr } = await supabase
          .from('products')
          .insert({
            organization_id: orgId,
            name: parsed.productName,
            sku: productSku,
            category_id: categoryId,
            brand_id: brandId,
            selling_price: parsed.sellingPrice || 120.00,
            cost_price: parsed.costPrice || (parsed.sellingPrice ? Math.round(parsed.sellingPrice * 0.45) : 50.00),
            tax_rate: 22,
            status: 'active',
          })
          .select('id, name, sku')
          .single();

        if (prodErr || !newProd) {
          return NextResponse.json({ error: prodErr?.message || 'Errore creazione prodotto' }, { status: 400 });
        }
        product = newProd;
        productId = newProd.id;
        productSku = newProd.sku;
      } else {
        productId = product.id;
        productSku = product.sku;
      }

      // 3.4 Find or create variant
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id, sku, barcode, attributes, quantity')
        .eq('product_id', productId);

      let variant = variants?.find(v => {
        const attrs = (v.attributes || {}) as Record<string, string>;
        return attrs.size?.toString() === targetSize.toString() &&
          (!targetColor || attrs.color?.toLowerCase() === targetColor.toLowerCase());
      });

      let variantId: string;
      if (!variant) {
        const variantSku = `${productSku}-${targetSize}${targetColor ? '-' + targetColor.slice(0, 3).toUpperCase() : ''}`;
        const { data: newVar, error: varErr } = await supabase
          .from('product_variants')
          .insert({
            product_id: productId,
            sku: variantSku,
            barcode: parsed.barcode || null,
            attributes: { size: targetSize, color: targetColor || 'Standard' },
            cost_price: parsed.costPrice || 50.00,
            selling_price: parsed.sellingPrice || 120.00,
            quantity: 0,
            min_stock_level: 2,
          })
          .select('id, sku, quantity')
          .single();

        if (varErr || !newVar) {
          return NextResponse.json({ error: varErr?.message || 'Errore creazione variante' }, { status: 400 });
        }
        variant = newVar as any;
        variantId = newVar.id;
      } else {
        variantId = variant.id;
      }

      // 3.5 Record atomic inventory movement to increase stock
      const { error: moveErr } = await supabase.rpc('rpc_record_inventory_movement', {
        p_organization_id: orgId,
        p_variant_id: variantId,
        p_type: 'purchase',
        p_quantity: quantityToAdd,
        p_reference_id: null,
        p_reference_type: 'ai_assistant',
        p_cost_price: parsed.costPrice || 50.00,
        p_operator_id: user.id,
        p_notes: `Carico via Assistente AI: "${message}"`
      });

      if (moveErr) {
        // Fallback update directly if RPC fails
        await supabase
          .from('product_variants')
          .update({ quantity: (variant?.quantity || 0) + quantityToAdd })
          .eq('id', variantId);
      }

      // Read updated stock balance
      const { data: updatedVar } = await supabase
        .from('product_variants')
        .select('quantity')
        .eq('id', variantId)
        .single();

      const newTotal = updatedVar?.quantity ?? ((variant?.quantity || 0) + quantityToAdd);

      return NextResponse.json({
        reply: `✅ Fatto! Ho aggiunto **${quantityToAdd} paia** di **${product.name}** (Taglia **${targetSize}**${targetColor ? `, Colore ${targetColor}` : ''}) a magazzino.\n\nGiacenza attuale aggiornata: **${newTotal} pezzi**.`,
        actionExecuted: {
          type: 'ADD_PRODUCT_OR_STOCK',
          productName: product.name,
          brand: parsed.brand,
          size: targetSize,
          color: targetColor,
          quantityAdded: quantityToAdd,
          newStock: newTotal,
          productId,
        }
      });
    }

    // 4. Handle QUERY_STOCK
    if (parsed.intent === 'QUERY_STOCK') {
      const q = parsed.productName.toLowerCase();
      const { data: matchedProds } = await supabase
        .from('products')
        .select('id, name, sku, product_variants(id, attributes, quantity)')
        .eq('organization_id', orgId)
        .ilike('name', `%${q}%`)
        .limit(5);

      if (!matchedProds || matchedProds.length === 0) {
        return NextResponse.json({
          reply: `Non ho trovato nessun articolo corrispondente a "${parsed.productName}" a catalogo. Vuoi che lo inserisca? Scrivimi ad esempio: *"inserisci 10 ${parsed.productName} di taglia 42"*.`
        });
      }

      let summary = `📦 Ecco le disponibilità trovate per **${parsed.productName}**:\n\n`;
      for (const p of matchedProds) {
        const variants = (p.product_variants || []) as Array<{ attributes: any, quantity: number }>;
        const total = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
        summary += `• **${p.name}** (Totale: ${total} pezzi):\n`;
        for (const v of variants) {
          const attrs = (v.attributes || {}) as Record<string, string>;
          summary += `  - Taglia ${attrs.size || 'TU'}${attrs.color ? ` (${attrs.color})` : ''}: **${v.quantity} disponibili**\n`;
        }
      }

      return NextResponse.json({ reply: summary.trim() });
    }

    // 5. Handle QUERY_LOW_STOCK
    if (parsed.intent === 'QUERY_LOW_STOCK') {
      const { data: lowStock } = await supabase
        .from('product_variants')
        .select('id, sku, quantity, min_stock_level, attributes, products(id, name, organization_id)')
        .eq('products.organization_id', orgId)
        .order('quantity', { ascending: true })
        .limit(10);

      const items = (lowStock || []).filter((v: any) => v.products && v.quantity <= (v.min_stock_level || 2));
      if (items.length === 0) {
        return NextResponse.json({
          reply: `Ottime notizie! Tutti i prodotti in magazzino sono attualmente sopra la soglia minima di scorta.`
        });
      }

      let summary = `⚠️ Prodotti sotto scorta o in esaurimento:\n\n`;
      for (const item of items) {
        const p = item.products as any;
        const attrs = (item.attributes || {}) as Record<string, string>;
        summary += `• **${p.name}** (Tg. ${attrs.size || 'TU'}): **${item.quantity} rimasti** (Scorta minima: ${item.min_stock_level || 2})\n`;
      }
      return NextResponse.json({ reply: summary.trim() });
    }

    // 6. Default Fallback
    return NextResponse.json({
      reply: `Ciao! Sono il tuo Assistente AI RIVO per il magazzino e la vendita.\n\nPuoi chiedermi ad esempio:\n• *"inserisci 15 Air Max 95 di taglia 43"*\n• *"aggiungi 8 mocassini Borrelli taglia 42 a 130 euro"*\n• *"quante Air Max 95 abbiamo in magazzino?"*\n• *"quali prodotti sono sotto scorta?"*`
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Errore interno';
    console.error('Retail Assistant Error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

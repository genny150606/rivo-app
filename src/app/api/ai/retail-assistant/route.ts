import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserOrgAccess, sanitizeString } from '@/lib/security';
import { parseRetailIntent } from '@/platform/ai/retail-nlp';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    const orgId = profile.organization_id;
    if (!orgId) {
      return NextResponse.json({ error: 'Nessuna organizzazione associata' }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Messaggio non valido' }, { status: 400 });
    }

    // 1. Load catalog context for natural language resolution
    const { data: existingProducts } = await adminClient
      .from('products')
      .select('id, name, sku, brand, sale_price, cost_price')
      .eq('organization_id', orgId)
      .limit(100);

    const { data: existingBrands } = await adminClient
      .from('brands')
      .select('id, name')
      .eq('organization_id', orgId);

    const { data: existingCategories } = await adminClient
      .from('product_categories')
      .select('id, name')
      .eq('organization_id', orgId);

    // 2. Parse intent via Retail NLP Engine
    const parsed = parseRetailIntent(message, (existingProducts || []).map(p => ({ name: p.name, brand: p.brand || undefined })));

    // Optional Gemini 1.5 Flash Enhancement if API key is present and intent is ambiguous
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
        console.warn('Gemini fallback warning:', geminiErr);
      }
    }

    // 3. Handle ADD_PRODUCT_OR_STOCK
    if (parsed.intent === 'ADD_PRODUCT_OR_STOCK') {
      const quantityToAdd = parsed.quantity || 1;
      const targetSize = parsed.size || 'TU';
      const targetColor = parsed.color || 'Standard';
      const salePrice = parsed.sellingPrice || 120.00;
      const costPrice = parsed.costPrice || Math.round(salePrice * 0.45);

      // 3.1 Resolve or create Category
      let categoryId: string | null = null;
      let categoryName = parsed.category || 'Calzature';
      const matchedCat = existingCategories?.find(
        c => c.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (matchedCat) {
        categoryId = matchedCat.id;
        categoryName = matchedCat.name;
      } else {
        const { data: newCat } = await adminClient
          .from('product_categories')
          .insert({ organization_id: orgId, name: categoryName, slug: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-') })
          .select('id')
          .single();
        categoryId = newCat?.id || null;
      }

      // 3.2 Resolve or create Brand
      let brandId: string | null = null;
      let brandName = parsed.brand || 'Borrelli';
      const matchedBrand = existingBrands?.find(
        b => b.name.toLowerCase() === brandName.toLowerCase()
      );
      if (matchedBrand) {
        brandId = matchedBrand.id;
        brandName = matchedBrand.name;
      } else {
        const { data: newBrand } = await adminClient
          .from('brands')
          .insert({ organization_id: orgId, name: brandName, slug: brandName.toLowerCase().replace(/[^a-z0-9]/g, '-') })
          .select('id')
          .single();
        brandId = newBrand?.id || null;
      }

      // 3.3 Find existing product by name (case-insensitive substring)
      let product = existingProducts?.find(
        p => p.name.toLowerCase().includes(parsed.productName.toLowerCase()) ||
             parsed.productName.toLowerCase().includes(p.name.toLowerCase())
      );

      let productId: string;
      let productSku: string;
      let productName: string;

      if (!product) {
        // Create Product
        productSku = `PRD-${Date.now().toString().slice(-6)}`;
        productName = parsed.productName;
        const { data: newProd, error: prodErr } = await adminClient
          .from('products')
          .insert({
            organization_id: orgId,
            name: sanitizeString(productName, 255),
            brand: sanitizeString(brandName, 100),
            brand_id: brandId,
            category_name: sanitizeString(categoryName, 100),
            category_id: categoryId,
            sku: productSku,
            cost_price: costPrice,
            sale_price: salePrice,
            tax_rate: 22.00,
            status: 'active',
            active: true,
            attribute_keys: ['size', 'color'],
          })
          .select('id, name, sku')
          .single();

        if (prodErr || !newProd) {
          return NextResponse.json({ error: prodErr?.message || 'Errore creazione prodotto' }, { status: 400 });
        }
        productId = newProd.id;
        productSku = newProd.sku;
      } else {
        productId = product.id;
        productSku = product.sku || `PRD-${Date.now().toString().slice(-6)}`;
        productName = product.name;
      }

      // 3.4 Find or create variant
      const { data: variants } = await adminClient
        .from('product_variants')
        .select('id, sku, barcode, size, color, attributes, sale_price, cost_price')
        .eq('product_id', productId);

      let variant = variants?.find(v => {
        const variantSize = v.size || (v.attributes as any)?.size;
        const variantColor = v.color || (v.attributes as any)?.color;
        const sizeMatches = variantSize?.toString().toUpperCase() === targetSize.toString().toUpperCase();
        const colorMatches = !targetColor || targetColor === 'Standard' || 
          variantColor?.toString().toLowerCase() === targetColor.toLowerCase();
        return sizeMatches && colorMatches;
      });

      let variantId: string;
      if (!variant) {
        const variantSku = `${productSku}-${targetSize}${targetColor && targetColor !== 'Standard' ? '-' + targetColor.slice(0, 3).toUpperCase() : ''}`;
        const { data: newVar, error: varErr } = await adminClient
          .from('product_variants')
          .insert({
            organization_id: orgId,
            product_id: productId,
            sku: sanitizeString(variantSku, 100),
            barcode: parsed.barcode || null,
            size: sanitizeString(targetSize, 50),
            color: sanitizeString(targetColor, 50),
            attributes: { size: targetSize, color: targetColor },
            cost_price: costPrice,
            sale_price: salePrice,
            reorder_threshold: 2,
            minimum_stock: 1,
            active: true,
            status: 'active',
          })
          .select('id, sku')
          .single();

        if (varErr || !newVar) {
          return NextResponse.json({ error: varErr?.message || 'Errore creazione variante' }, { status: 400 });
        }
        variantId = newVar.id;
      } else {
        variantId = variant.id;
      }

      // 3.5 Record atomic inventory movement to increase stock
      const { error: moveErr } = await adminClient.rpc('rpc_record_inventory_movement', {
        p_org_id: orgId,
        p_variant_id: variantId,
        p_location_id: null,
        p_type: 'initial',
        p_quantity_delta: quantityToAdd,
        p_reason: `Carico via Assistente AI: "${message}"`,
        p_reference: productSku,
        p_ref_id: productId,
        p_ref_type: 'ai_assistant',
        p_unit_cost: costPrice,
        p_user_id: profile.auth_user_id,
      });

      if (moveErr) {
        console.warn('RPC record inventory movement warning:', moveErr);
      }

      // Read current balance from inventory_balances
      const { data: balance } = await adminClient
        .from('inventory_balances')
        .select('quantity_on_hand')
        .eq('variant_id', variantId)
        .maybeSingle();

      const newTotal = balance?.quantity_on_hand ?? quantityToAdd;

      return NextResponse.json({
        reply: `✅ Fatto! Ho aggiunto **${quantityToAdd} paia** di **${productName}** (Taglia **${targetSize}**${targetColor && targetColor !== 'Standard' ? `, Colore ${targetColor}` : ''}) a magazzino.\n\nPrezzo vendita: **€ ${salePrice.toFixed(2)}** • Giacenza aggiornata: **${newTotal} pezzi**.`,
        actionExecuted: {
          type: 'ADD_PRODUCT_OR_STOCK',
          productName,
          brand: brandName,
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
      const { data: matchedProds } = await adminClient
        .from('products')
        .select(`
          id,
          name,
          sku,
          product_variants (
            id,
            size,
            color,
            attributes
          )
        `)
        .eq('organization_id', orgId)
        .ilike('name', `%${q}%`)
        .limit(5);

      if (!matchedProds || matchedProds.length === 0) {
        return NextResponse.json({
          reply: `Non ho trovato nessun articolo corrispondente a "${parsed.productName}" a catalogo. Vuoi che lo inserisca? Scrivimi ad esempio: *"inserisci 10 ${parsed.productName} di taglia 42"*.`
        });
      }

      // Collect variant balances
      const allVariantIds = matchedProds.flatMap(p => (p.product_variants || []).map((v: any) => v.id));
      const { data: balances } = await adminClient
        .from('inventory_balances')
        .select('variant_id, quantity_on_hand')
        .in('variant_id', allVariantIds.length > 0 ? allVariantIds : ['00000000-0000-0000-0000-000000000000']);

      const balanceMap = new Map((balances || []).map(b => [b.variant_id, b.quantity_on_hand]));

      let summary = `📦 Ecco le disponibilità trovate per **${parsed.productName}**:\n\n`;
      for (const p of matchedProds) {
        const variants = (p.product_variants || []) as Array<{ id: string, size?: string, color?: string, attributes?: any }>;
        let total = 0;
        let varLines = '';
        for (const v of variants) {
          const qty = balanceMap.get(v.id) || 0;
          total += qty;
          const sz = v.size || (v.attributes as any)?.size || 'TU';
          const col = v.color && v.color !== 'Standard' ? ` (${v.color})` : '';
          varLines += `  - Taglia ${sz}${col}: **${qty} disponibili**\n`;
        }
        summary += `• **${p.name}** (Totale: ${total} pezzi):\n${varLines}`;
      }

      return NextResponse.json({ reply: summary.trim() });
    }

    // 5. Handle QUERY_LOW_STOCK
    if (parsed.intent === 'QUERY_LOW_STOCK') {
      const { data: lowBalances } = await adminClient
        .from('inventory_balances')
        .select(`
          quantity_on_hand,
          product_variants (
            id,
            size,
            reorder_threshold,
            products (
              id,
              name
            )
          )
        `)
        .eq('organization_id', orgId)
        .lte('quantity_on_hand', 3)
        .order('quantity_on_hand', { ascending: true })
        .limit(10);

      const items = (lowBalances || []).filter((b: any) => b.product_variants?.products);
      if (items.length === 0) {
        return NextResponse.json({
          reply: `Ottime notizie! Tutti i prodotti in magazzino sono attualmente sopra la soglia minima di scorta.`
        });
      }

      let summary = `⚠️ Prodotti sotto scorta o in esaurimento:\n\n`;
      for (const item of items) {
        const pv = item.product_variants as any;
        const p = pv.products as any;
        summary += `• **${p.name}** (Tg. ${pv.size || 'TU'}): **${item.quantity_on_hand} rimasti**\n`;
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

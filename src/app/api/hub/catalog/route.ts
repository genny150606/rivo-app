import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID } from '@/lib/security';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * GET /api/hub/catalog?organization_id=...
 * Public read-only endpoint for guest smartphone Hub to browse active products,
 * variants, and live stock balances.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id');

    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'ID organizzazione mancante o non valido' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 1. Fetch active products with variants
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        sku,
        description,
        category_name,
        sale_price,
        active,
        variants:product_variants (
          id,
          size,
          color,
          barcode,
          active
        )
      `)
      .eq('organization_id', orgId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (prodErr) {
      console.error('Error fetching hub catalog products:', prodErr);
      return NextResponse.json({ error: 'Errore nel recupero catalogo' }, { status: 500 });
    }

    // 2. Fetch stock balances
    const { data: balances } = await supabase
      .from('inventory_balances')
      .select('variant_id, quantity_on_hand')
      .eq('organization_id', orgId);

    const balanceMap = new Map<string, number>();
    (balances || []).forEach((b: any) => {
      const current = balanceMap.get(b.variant_id) || 0;
      balanceMap.set(b.variant_id, current + (b.quantity_on_hand || 0));
    });

    // 3. Assemble products with stock
    const catalog = (products || []).map((p: any) => {
      const enrichedVariants = (p.variants || [])
        .filter((v: any) => v.active !== false)
        .map((v: any) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          barcode: v.barcode,
          stock: Math.max(0, balanceMap.get(v.id) || 0),
        }));

      const totalStock = enrichedVariants.reduce((sum: number, v: any) => sum + v.stock, 0);

      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        sku: p.sku,
        description: p.description,
        categoryName: p.category_name,
        salePrice: Number(p.sale_price) || 0,
        formattedPrice: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(p.sale_price) || 0),
        variants: enrichedVariants,
        totalStock,
        isAvailable: totalStock > 0,
      };
    });

    return NextResponse.json({
      organizationId: orgId,
      products: catalog,
      totalCount: catalog.length,
    });
  } catch (err: any) {
    console.error('Hub catalog API error:', err);
    return NextResponse.json({ error: err.message || 'Errore interno' }, { status: 500 });
  }
}

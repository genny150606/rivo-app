import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserOrgAccess, isValidUUID, sanitizeString } from '@/lib/security';
import { guardModuleAccess } from '@/lib/modules/guard';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * GET /api/products
 * List products and their variants for the organization.
 * Protected by module guard 'products'.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    const adminClient = getAdminClient();

    let targetOrgId = profile.organization_id;
    if (!targetOrgId && profile.role === 'admin') {
      const { searchParams } = new URL(request.url);
      const queryOrgId = searchParams.get('organization_id');
      if (queryOrgId && isValidUUID(queryOrgId)) {
        targetOrgId = queryOrgId;
      } else {
        const { data: firstOrg } = await adminClient
          .from('organizations')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        targetOrgId = firstOrg?.id || '';
      }
    }

    if (!targetOrgId) {
      return NextResponse.json({ error: 'Nessuna organizzazione trovata' }, { status: 400 });
    }

    // Server-side module guard: require 'products'
    const moduleDenied = await guardModuleAccess(targetOrgId, 'products');
    if (moduleDenied) return moduleDenied;

    // Fetch products with their variants
    const { data: products, error: prodErr } = await adminClient
      .from('products')
      .select(`
        id,
        organization_id,
        name,
        brand,
        sku,
        description,
        category_name,
        cost_price,
        sale_price,
        active,
        created_at,
        updated_at,
        variants:product_variants (
          id,
          product_id,
          size,
          color,
          barcode,
          reorder_threshold,
          active,
          created_at,
          updated_at
        )
      `)
      .eq('organization_id', targetOrgId)
      .order('created_at', { ascending: false });

    if (prodErr) {
      return NextResponse.json({ error: prodErr.message }, { status: 500 });
    }

    // Fetch stock balances for all variants of this org
    const { data: balances } = await adminClient
      .from('inventory_balances')
      .select('variant_id, quantity_on_hand')
      .eq('organization_id', targetOrgId);

    const balanceMap = new Map<string, number>();
    (balances || []).forEach((b: any) => {
      const current = balanceMap.get(b.variant_id) || 0;
      balanceMap.set(b.variant_id, current + (b.quantity_on_hand || 0));
    });

    const enrichedProducts = (products || []).map((p: any) => {
      const enrichedVariants = (p.variants || []).map((v: any) => ({
        ...v,
        stock: balanceMap.get(v.id) || 0
      }));
      const totalStock = enrichedVariants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
      return {
        ...p,
        variants: enrichedVariants,
        totalStock
      };
    });

    return NextResponse.json({ products: enrichedProducts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Create a new product with optional initial variants.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    const adminClient = getAdminClient();

    let targetOrgId = profile.organization_id;
    if (!targetOrgId && profile.role === 'admin') {
      const { data: firstOrg } = await adminClient
        .from('organizations')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      targetOrgId = firstOrg?.id || '';
    }

    if (!targetOrgId) {
      return NextResponse.json({ error: 'Organizzazione non valida' }, { status: 400 });
    }

    // Server-side module guard: require 'products'
    const moduleDenied = await guardModuleAccess(targetOrgId, 'products');
    if (moduleDenied) return moduleDenied;

    const body = await request.json();
    const {
      name,
      brand,
      sku,
      description,
      category_name,
      cost_price,
      sale_price,
      variants, // Array of { size, color, barcode, reorder_threshold, initial_stock }
    } = body;

    const cleanName = sanitizeString(name, 255);
    if (!cleanName) {
      return NextResponse.json({ error: 'Il nome del prodotto è obbligatorio' }, { status: 400 });
    }

    const { data: newProd, error: prodErr } = await adminClient
      .from('products')
      .insert({
        organization_id: targetOrgId,
        name: cleanName,
        brand: sanitizeString(brand, 100),
        sku: sanitizeString(sku, 100),
        description: sanitizeString(description, 1000),
        category_name: sanitizeString(category_name, 100),
        cost_price: typeof cost_price === 'number' ? cost_price : null,
        sale_price: typeof sale_price === 'number' ? sale_price : 0.00,
        active: true,
      })
      .select()
      .single();

    if (prodErr || !newProd) {
      return NextResponse.json({ error: prodErr?.message || 'Errore creazione prodotto' }, { status: 400 });
    }

    // Insert variants if provided
    const createdVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        const { data: newVar, error: varErr } = await adminClient
          .from('product_variants')
          .insert({
            organization_id: targetOrgId,
            product_id: newProd.id,
            size: sanitizeString(v.size, 50),
            color: sanitizeString(v.color, 50),
            barcode: sanitizeString(v.barcode, 100),
            reorder_threshold: typeof v.reorder_threshold === 'number' ? v.reorder_threshold : 3,
            active: true,
          })
          .select()
          .single();

        if (newVar && !varErr) {
          createdVariants.push(newVar);

          // Handle initial stock movement & balance
          const initialStock = parseInt(v.initial_stock, 10);
          if (!isNaN(initialStock) && initialStock > 0) {
            await adminClient.from('inventory_movements').insert({
              organization_id: targetOrgId,
              variant_id: newVar.id,
              type: 'initial',
              quantity_delta: initialStock,
              reason: 'Carico iniziale inventario',
              created_by: profile.auth_user_id || null,
            });

            await adminClient.from('inventory_balances').insert({
              organization_id: targetOrgId,
              variant_id: newVar.id,
              quantity_on_hand: initialStock,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        ...newProd,
        variants: createdVariants,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/products
 * Delete or deactivate a product
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    const adminClient = getAdminClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId || !isValidUUID(productId)) {
      return NextResponse.json({ error: 'ID prodotto non valido' }, { status: 400 });
    }

    let targetOrgId = profile.organization_id;
    if (!targetOrgId && profile.role === 'admin') {
      const { data: firstOrg } = await adminClient
        .from('organizations')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      targetOrgId = firstOrg?.id || '';
    }

    // Module guard
    const moduleDenied = await guardModuleAccess(targetOrgId, 'products');
    if (moduleDenied) return moduleDenied;

    const { error: delErr } = await adminClient
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('organization_id', targetOrgId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

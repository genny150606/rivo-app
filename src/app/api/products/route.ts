import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserOrgAccess, isValidUUID, sanitizeString } from '@/lib/security';
import { guardModuleAccess } from '@/lib/modules/guard';
import { hasPermission } from '@/lib/rbac';
import { CreateProductSchema } from '@/platform/retail/types';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * GET /api/products
 * List products and their variants for the organization with search and filters.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    const adminClient = getAdminClient();
    const targetOrgId = profile.organization_id;

    if (!targetOrgId) {
      return NextResponse.json({ error: 'Nessuna organizzazione trovata' }, { status: 400 });
    }

    const moduleDenied = await guardModuleAccess(targetOrgId, 'products');
    if (moduleDenied) return moduleDenied;

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q')?.trim() || '';
    const categoryId = searchParams.get('category_id');
    const brandId = searchParams.get('brand_id');
    const stockStatus = searchParams.get('stock_status'); // 'low', 'out', 'in'

    let query = adminClient
      .from('products')
      .select(`
        id,
        organization_id,
        name,
        brand,
        brand_id,
        sku,
        barcode,
        description,
        category_name,
        category_id,
        supplier_id,
        cost_price,
        sale_price,
        tax_rate,
        status,
        image_url,
        attribute_keys,
        active,
        created_at,
        updated_at,
        category:category_id (
          id,
          name
        ),
        brand_obj:brand_id (
          id,
          name,
          logo_url
        ),
        variants:product_variants (
          id,
          product_id,
          sku,
          barcode,
          size,
          color,
          attributes,
          cost_price,
          sale_price,
          minimum_stock,
          reorder_threshold,
          status,
          active,
          created_at,
          updated_at
        )
      `)
      .eq('organization_id', targetOrgId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (categoryId && isValidUUID(categoryId)) {
      query = query.eq('category_id', categoryId);
    }
    if (brandId && isValidUUID(brandId)) {
      query = query.eq('brand_id', brandId);
    }
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,barcode.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
    }

    const { data: products, error: prodErr } = await query;

    if (prodErr) {
      return NextResponse.json({ error: prodErr.message }, { status: 500 });
    }

    // Fetch stock balances for all variants of this org
    const { data: balances } = await adminClient
      .from('inventory_balances')
      .select('variant_id, quantity_on_hand')
      .eq('organization_id', targetOrgId);

    const balanceMap = new Map<string, number>();
    (balances || []).forEach((b: { variant_id: string; quantity_on_hand: number }) => {
      const current = balanceMap.get(b.variant_id) || 0;
      balanceMap.set(b.variant_id, current + (b.quantity_on_hand || 0));
    });

    interface RawVariant {
      id: string;
      product_id: string;
      sku: string | null;
      barcode: string | null;
      size: string | null;
      color: string | null;
      attributes: Record<string, string>;
      cost_price: number | null;
      sale_price: number | null;
      minimum_stock: number;
      reorder_threshold: number;
      status: string;
      active: boolean;
    }

    interface RawProduct {
      id: string;
      organization_id: string;
      name: string;
      brand: string | null;
      brand_id: string | null;
      sku: string | null;
      barcode: string | null;
      description: string | null;
      category_name: string | null;
      category_id: string | null;
      supplier_id: string | null;
      cost_price: number | null;
      sale_price: number;
      tax_rate: number;
      status: string;
      image_url: string | null;
      attribute_keys: string[];
      active: boolean;
      created_at: string;
      updated_at: string;
      category?: { id: string; name: string } | null;
      brand_obj?: { id: string; name: string; logo_url: string | null } | null;
      variants: RawVariant[];
    }

    let enrichedProducts = (products as unknown as RawProduct[] || []).map((p) => {
      const enrichedVariants = (p.variants || []).map((v) => {
        const stock = balanceMap.get(v.id) || 0;
        const isLowStock = stock > 0 && stock <= (v.reorder_threshold || 3);
        const isOutOfStock = stock <= 0;
        return {
          ...v,
          stock,
          isLowStock,
          isOutOfStock,
        };
      });

      const totalStock = enrichedVariants.reduce((acc, v) => acc + (v.stock || 0), 0);
      const hasLowStockVariant = enrichedVariants.some((v) => v.isLowStock);
      const isOutOfStock = totalStock <= 0;

      return {
        ...p,
        category_name: p.category?.name || p.category_name || null,
        brand: p.brand_obj?.name || p.brand || null,
        variants: enrichedVariants,
        totalStock,
        hasLowStockVariant,
        isOutOfStock,
      };
    });

    // Filter by stock status if requested
    if (stockStatus === 'out') {
      enrichedProducts = enrichedProducts.filter((p) => p.isOutOfStock);
    } else if (stockStatus === 'low') {
      enrichedProducts = enrichedProducts.filter((p) => p.hasLowStockVariant && !p.isOutOfStock);
    } else if (stockStatus === 'in') {
      enrichedProducts = enrichedProducts.filter((p) => !p.isOutOfStock);
    }

    return NextResponse.json({ products: enrichedProducts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Create a new product with variants and optional initial inventory.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    if (!hasPermission(profile.role, 'products.create', profile.permissions)) {
      return NextResponse.json({ error: 'Permessi insufficienti per creare prodotti' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    const targetOrgId = profile.organization_id;
    if (!targetOrgId) {
      return NextResponse.json({ error: 'Organizzazione non valida' }, { status: 400 });
    }

    const moduleDenied = await guardModuleAccess(targetOrgId, 'products');
    if (moduleDenied) return moduleDenied;

    const body = await request.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dati prodotto non validi' }, { status: 400 });
    }

    const {
      name,
      brand,
      brand_id,
      category_name,
      category_id,
      supplier_id,
      sku,
      barcode,
      description,
      cost_price,
      sale_price,
      tax_rate,
      status,
      image_url,
      attribute_keys,
      variants,
    } = parsed.data;

    // 1. Insert product
    const { data: newProd, error: prodErr } = await adminClient
      .from('products')
      .insert({
        organization_id: targetOrgId,
        name: sanitizeString(name, 255),
        brand: sanitizeString(brand, 100),
        brand_id: brand_id || null,
        category_name: sanitizeString(category_name, 100),
        category_id: category_id || null,
        supplier_id: supplier_id || null,
        sku: sanitizeString(sku, 100),
        barcode: sanitizeString(barcode, 100),
        description: sanitizeString(description, 1000),
        cost_price: typeof cost_price === 'number' ? cost_price : null,
        sale_price: typeof sale_price === 'number' ? sale_price : 0.00,
        tax_rate: typeof tax_rate === 'number' ? tax_rate : 22.00,
        status: status || 'active',
        image_url: image_url || null,
        attribute_keys: attribute_keys || ['size', 'color'],
        active: true,
      })
      .select()
      .single();

    if (prodErr || !newProd) {
      return NextResponse.json({ error: prodErr?.message || 'Errore creazione prodotto' }, { status: 400 });
    }

    // 2. Insert variants and handle initial stock atomically
    const createdVariants = [];
    for (const v of variants) {
      const { data: newVar, error: varErr } = await adminClient
        .from('product_variants')
        .insert({
          organization_id: targetOrgId,
          product_id: newProd.id,
          sku: sanitizeString(v.sku, 100),
          barcode: sanitizeString(v.barcode, 100),
          size: sanitizeString(v.size, 50),
          color: sanitizeString(v.color, 50),
          attributes: v.attributes || {},
          cost_price: typeof v.cost_price === 'number' ? v.cost_price : null,
          sale_price: typeof v.sale_price === 'number' ? v.sale_price : null,
          reorder_threshold: typeof v.reorder_threshold === 'number' ? v.reorder_threshold : 3,
          minimum_stock: typeof v.minimum_stock === 'number' ? v.minimum_stock : 1,
          active: true,
        })
        .select()
        .single();

      if (newVar && !varErr) {
        createdVariants.push(newVar);

        // Record initial inventory movement atomically via RPC
        const initialStock = v.initial_stock || 0;
        if (initialStock > 0) {
          await adminClient.rpc('rpc_record_inventory_movement', {
            p_org_id: targetOrgId,
            p_variant_id: newVar.id,
            p_location_id: null,
            p_type: 'initial',
            p_quantity_delta: initialStock,
            p_reason: 'Giacenza iniziale inserimento articolo',
            p_reference: newProd.sku || newVar.sku || 'INIZIALE',
            p_ref_id: newProd.id,
            p_ref_type: 'product',
            p_unit_cost: newProd.cost_price || null,
            p_user_id: profile.auth_user_id,
          });
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
 * PATCH /api/products
 * Update an existing product and its variants.
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    if (!hasPermission(profile.role, 'products.update', profile.permissions)) {
      return NextResponse.json({ error: 'Permessi insufficienti per modificare prodotti' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    const targetOrgId = profile.organization_id;
    if (!targetOrgId) {
      return NextResponse.json({ error: 'Organizzazione non valida' }, { status: 400 });
    }

    const moduleDenied = await guardModuleAccess(targetOrgId, 'products');
    if (moduleDenied) return moduleDenied;

    const body = await request.json();
    const { id, name, brand_id, category_id, sku, barcode, description, cost_price, sale_price, tax_rate, status, variants } = body;

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID prodotto non valido' }, { status: 400 });
    }

    // 1. Update product header
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = sanitizeString(name, 255);
    if (brand_id !== undefined) updateData.brand_id = brand_id || null;
    if (category_id !== undefined) updateData.category_id = category_id || null;
    if (sku !== undefined) updateData.sku = sanitizeString(sku, 100);
    if (barcode !== undefined) updateData.barcode = sanitizeString(barcode, 100);
    if (description !== undefined) updateData.description = sanitizeString(description, 1000);
    if (typeof cost_price === 'number') updateData.cost_price = cost_price;
    if (typeof sale_price === 'number') updateData.sale_price = sale_price;
    if (typeof tax_rate === 'number') updateData.tax_rate = tax_rate;
    if (status) updateData.status = status;

    const { data: updatedProd, error: updateErr } = await adminClient
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', targetOrgId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // 2. Handle variant updates if present
    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.id && isValidUUID(v.id)) {
          // Update existing variant
          await adminClient
            .from('product_variants')
            .update({
              sku: sanitizeString(v.sku, 100),
              barcode: sanitizeString(v.barcode, 100),
              size: sanitizeString(v.size, 50),
              color: sanitizeString(v.color, 50),
              reorder_threshold: typeof v.reorder_threshold === 'number' ? v.reorder_threshold : 3,
            })
            .eq('id', v.id)
            .eq('organization_id', targetOrgId);
        } else {
          // Insert newly added variant to this product
          const { data: newV } = await adminClient
            .from('product_variants')
            .insert({
              organization_id: targetOrgId,
              product_id: id,
              sku: sanitizeString(v.sku, 100),
              barcode: sanitizeString(v.barcode, 100),
              size: sanitizeString(v.size, 50),
              color: sanitizeString(v.color, 50),
              attributes: v.attributes || {},
              reorder_threshold: typeof v.reorder_threshold === 'number' ? v.reorder_threshold : 3,
              active: true,
            })
            .select()
            .single();

          if (newV && v.initial_stock > 0) {
            await adminClient.rpc('rpc_record_inventory_movement', {
              p_org_id: targetOrgId,
              p_variant_id: newV.id,
              p_location_id: null,
              p_type: 'initial',
              p_quantity_delta: v.initial_stock,
              p_reason: 'Giacenza iniziale aggiunta variante',
              p_reference: v.sku || 'VAR-NEW',
              p_ref_id: id,
              p_ref_type: 'product',
              p_unit_cost: updatedProd?.cost_price || null,
              p_user_id: profile.auth_user_id,
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, product: updatedProd });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/products
 * Soft-delete or remove a product and its variants.
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    if (!hasPermission(profile.role, 'products.delete', profile.permissions)) {
      return NextResponse.json({ error: 'Permessi insufficienti per eliminare prodotti' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId || !isValidUUID(productId)) {
      return NextResponse.json({ error: 'ID prodotto non valido' }, { status: 400 });
    }

    const targetOrgId = profile.organization_id;
    const moduleDenied = await guardModuleAccess(targetOrgId, 'products');
    if (moduleDenied) return moduleDenied;

    // Soft delete product so sale references remain intact
    const { error: delErr } = await adminClient
      .from('products')
      .update({ active: false, status: 'archived' })
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

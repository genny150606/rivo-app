import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { verifyUserOrgAccess, isValidUUID, sanitizeString } from '@/lib/security';
import { guardModuleAccess } from '@/lib/modules/guard';
import { hasPermission } from '@/lib/rbac';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

const MovementSchema = z.object({
  variant_id: z.string().uuid('Variante non valida'),
  location_id: z.string().uuid().optional().nullable(),
  type: z.enum([
    'in', 
    'out', 
    'adjustment', 
    'initial', 
    'purchase', 
    'sale', 
    'return', 
    'damaged', 
    'transfer', 
    'inventory_count'
  ]),
  quantity_delta: z.number().int().refine((n) => n !== 0, 'La variazione non può essere zero'),
  reason: z.string().max(255).optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  reference_id: z.string().uuid().optional().nullable(),
  reference_type: z.string().max(50).optional().nullable(),
  unit_cost: z.number().nonnegative().optional().nullable(),
});

/**
 * GET /api/inventory/movements
 * List inventory movements and balances for the organization.
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

    // Module guard: require 'inventory'
    const moduleDenied = await guardModuleAccess(targetOrgId, 'inventory');
    if (moduleDenied) return moduleDenied;

    // RBAC check
    if (!hasPermission(profile.role, 'inventory.view')) {
      return NextResponse.json({ error: 'Permessi insufficienti per visualizzare il magazzino' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '150', 10), 1), 500);
    const filterType = searchParams.get('type');
    const filterVariant = searchParams.get('variant_id');

    // Query movements
    let movQuery = adminClient
      .from('inventory_movements')
      .select(`
        id,
        organization_id,
        variant_id,
        location_id,
        type,
        quantity_delta,
        quantity_after,
        unit_cost,
        reason,
        reference,
        reference_id,
        reference_type,
        created_by,
        created_at,
        variant:product_variants (
          id,
          sku,
          barcode,
          size,
          color,
          attributes,
          reorder_threshold,
          cost_price,
          sale_price,
          product:products (
            id,
            name,
            sku,
            brand:brands (id, name),
            category:product_categories (id, name)
          )
        )
      `)
      .eq('organization_id', targetOrgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filterType && filterType !== 'all') {
      movQuery = movQuery.eq('type', filterType);
    }
    if (filterVariant && isValidUUID(filterVariant)) {
      movQuery = movQuery.eq('variant_id', filterVariant);
    }

    const { data: movements, error: movErr } = await movQuery;
    if (movErr) {
      return NextResponse.json({ error: movErr.message }, { status: 500 });
    }

    // Fetch summary stock balances
    const { data: balances, error: balErr } = await adminClient
      .from('inventory_balances')
      .select(`
        id,
        variant_id,
        location_id,
        quantity_on_hand,
        updated_at,
        variant:product_variants (
          id,
          sku,
          barcode,
          size,
          color,
          attributes,
          reorder_threshold,
          cost_price,
          sale_price,
          product:products (
            id,
            name,
            sku,
            cost_price,
            sale_price,
            brand:brands (id, name),
            category:product_categories (id, name)
          )
        )
      `)
      .eq('organization_id', targetOrgId)
      .order('quantity_on_hand', { ascending: true });

    if (balErr) {
      return NextResponse.json({ error: balErr.message }, { status: 500 });
    }

    return NextResponse.json({
      movements: movements || [],
      balances: balances || []
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/inventory/movements
 * Record a new inventory movement atomically via PostgreSQL RPC.
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
      return NextResponse.json({ error: 'Nessuna organizzazione trovata' }, { status: 400 });
    }

    // Module guard: require 'inventory'
    const moduleDenied = await guardModuleAccess(targetOrgId, 'inventory');
    if (moduleDenied) return moduleDenied;

    // RBAC check: must have inventory.movements permission
    if (!hasPermission(profile.role, 'inventory.movements')) {
      return NextResponse.json({ error: 'Permessi insufficienti per registrare movimenti di magazzino' }, { status: 403 });
    }

    const rawBody = await request.json();
    const parseResult = MovementSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || 'Dati movimento non validi';
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const {
      variant_id,
      location_id,
      type,
      quantity_delta,
      reason,
      reference,
      reference_id,
      reference_type,
      unit_cost,
    } = parseResult.data;

    // Normalise delta for 'out' or 'damaged'
    let actualDelta = quantity_delta;
    if ((type === 'out' || type === 'damaged') && actualDelta > 0) {
      actualDelta = -actualDelta;
    }

    // Call atomic RPC
    const { data: rpcResult, error: rpcErr } = await adminClient.rpc(
      'rpc_record_inventory_movement',
      {
        p_org_id: targetOrgId,
        p_variant_id: variant_id,
        p_location_id: location_id || null,
        p_type: type,
        p_quantity_delta: actualDelta,
        p_reason: reason ? sanitizeString(reason, 255) : null,
        p_reference: reference ? sanitizeString(reference, 100) : null,
        p_ref_id: reference_id || null,
        p_ref_type: reference_type ? sanitizeString(reference_type, 50) : null,
        p_unit_cost: unit_cost ?? null,
        p_user_id: profile.auth_user_id || null,
      }
    );

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message || 'Errore esecuzione movimento atomico' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result: rpcResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

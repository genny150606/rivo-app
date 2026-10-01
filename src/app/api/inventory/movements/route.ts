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
 * GET /api/inventory/movements
 * List inventory movements for the organization.
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

    const { data: movements, error: movErr } = await adminClient
      .from('inventory_movements')
      .select(`
        id,
        organization_id,
        variant_id,
        location_id,
        type,
        quantity_delta,
        reason,
        reference,
        created_at,
        variant:product_variants (
          id,
          size,
          color,
          barcode,
          reorder_threshold,
          product:products (
            id,
            name,
            brand,
            sku
          )
        )
      `)
      .eq('organization_id', targetOrgId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (movErr) {
      return NextResponse.json({ error: movErr.message }, { status: 500 });
    }

    // Also fetch summary stock balances
    const { data: balances, error: balErr } = await adminClient
      .from('inventory_balances')
      .select(`
        id,
        variant_id,
        quantity_on_hand,
        updated_at,
        variant:product_variants (
          id,
          size,
          color,
          barcode,
          reorder_threshold,
          product:products (
            id,
            name,
            brand,
            sku,
            sale_price
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
 * Record a new inventory movement (in, out, adjustment) and update balance.
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

    const body = await request.json();
    const {
      variant_id,
      type, // 'in' | 'out' | 'adjustment' | 'initial'
      quantity_delta,
      reason,
      reference,
    } = body;

    if (!variant_id || !isValidUUID(variant_id)) {
      return NextResponse.json({ error: 'Variante non valida' }, { status: 400 });
    }

    const delta = parseInt(quantity_delta, 10);
    if (isNaN(delta) || delta === 0) {
      return NextResponse.json({ error: 'Quantità non valida' }, { status: 400 });
    }

    const validTypes = ['in', 'out', 'adjustment', 'initial'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Tipo movimento non valido' }, { status: 400 });
    }

    // For 'out', delta should be negative
    const actualDelta = (type === 'out' && delta > 0) ? -delta : delta;

    // Insert movement
    const { data: mov, error: movErr } = await adminClient
      .from('inventory_movements')
      .insert({
        organization_id: targetOrgId,
        variant_id,
        type,
        quantity_delta: actualDelta,
        reason: sanitizeString(reason, 255),
        reference: sanitizeString(reference, 100),
        created_by: profile.auth_user_id || null,
      })
      .select()
      .single();

    if (movErr || !mov) {
      return NextResponse.json({ error: movErr?.message || 'Errore registrazione movimento' }, { status: 400 });
    }

    // Update or insert balance
    const { data: currentBal } = await adminClient
      .from('inventory_balances')
      .select('id, quantity_on_hand')
      .eq('organization_id', targetOrgId)
      .eq('variant_id', variant_id)
      .maybeSingle();

    let newQuantity = actualDelta;
    if (currentBal) {
      newQuantity = (currentBal.quantity_on_hand || 0) + actualDelta;
      await adminClient
        .from('inventory_balances')
        .update({
          quantity_on_hand: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentBal.id);
    } else {
      await adminClient
        .from('inventory_balances')
        .insert({
          organization_id: targetOrgId,
          variant_id,
          quantity_on_hand: newQuantity,
        });
    }

    return NextResponse.json({
      success: true,
      movement: mov,
      new_quantity: newQuantity,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

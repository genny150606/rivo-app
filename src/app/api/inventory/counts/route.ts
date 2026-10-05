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

/**
 * GET /api/inventory/counts
 * List counts or get single count details with items.
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

    const moduleDenied = await guardModuleAccess(targetOrgId, 'inventory');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'inventory.view')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const countId = searchParams.get('id');

    if (countId) {
      if (!isValidUUID(countId)) {
        return NextResponse.json({ error: 'ID non valido' }, { status: 400 });
      }

      const { data: count, error: countErr } = await adminClient
        .from('inventory_counts')
        .select('*')
        .eq('id', countId)
        .eq('organization_id', targetOrgId)
        .single();

      if (countErr || !count) {
        return NextResponse.json({ error: 'Inventario non trovato' }, { status: 404 });
      }

      const { data: items, error: itemsErr } = await adminClient
        .from('inventory_count_items')
        .select(`
          id,
          count_id,
          variant_id,
          expected_quantity,
          counted_quantity,
          discrepancy,
          notes,
          variant:product_variants (
            id,
            sku,
            barcode,
            size,
            color,
            cost_price,
            sale_price,
            product:products (
              id,
              name,
              sku,
              brand:brands (name),
              category:product_categories (name)
            )
          )
        `)
        .eq('count_id', countId)
        .order('created_at', { ascending: true });

      if (itemsErr) {
        return NextResponse.json({ error: itemsErr.message }, { status: 500 });
      }

      return NextResponse.json({
        count,
        items: items || [],
      });
    }

    // List all counts
    const { data: counts, error: listErr } = await adminClient
      .from('inventory_counts')
      .select('*')
      .eq('organization_id', targetOrgId)
      .order('created_at', { ascending: false });

    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }

    return NextResponse.json({ counts: counts || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/inventory/counts
 * Manage inventory count sessions: start, update_item, apply, cancel.
 */
export async function POST(request: NextRequest) {
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

    const moduleDenied = await guardModuleAccess(targetOrgId, 'inventory');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'inventory.update')) {
      return NextResponse.json({ error: 'Permessi insufficienti per gestire le sessioni di inventario' }, { status: 403 });
    }

    const body = await request.json();
    const action = body.action;

    // 1. START A NEW COUNT SESSION
    if (action === 'start') {
      const name = sanitizeString(body.name || `Inventario del ${new Date().toLocaleDateString('it-IT')}`, 255);
      const notes = sanitizeString(body.notes || '', 500);
      const locationId = body.location_id && isValidUUID(body.location_id) ? body.location_id : null;

      // Create session
      const { data: count, error: countErr } = await adminClient
        .from('inventory_counts')
        .insert({
          organization_id: targetOrgId,
          location_id: locationId,
          name,
          notes,
          created_by: profile.auth_user_id || null,
          status: 'in_progress',
        })
        .select()
        .single();

      if (countErr || !count) {
        return NextResponse.json({ error: countErr?.message || 'Errore creazione sessione' }, { status: 400 });
      }

      // Fetch all active variants for org
      const { data: variants } = await adminClient
        .from('product_variants')
        .select('id, organization_id')
        .eq('organization_id', targetOrgId);

      // Fetch existing balances
      const { data: balances } = await adminClient
        .from('inventory_balances')
        .select('variant_id, quantity_on_hand')
        .eq('organization_id', targetOrgId);

      const balMap = new Map<string, number>();
      (balances || []).forEach((b) => balMap.set(b.variant_id, b.quantity_on_hand));

      if (variants && variants.length > 0) {
        const itemsToInsert = variants.map((v) => {
          const expected = balMap.get(v.id) || 0;
          return {
            count_id: count.id,
            organization_id: targetOrgId,
            variant_id: v.id,
            expected_quantity: expected,
            counted_quantity: expected, // Default to expected so cashier only modifies changes or scans
          };
        });

        await adminClient.from('inventory_count_items').insert(itemsToInsert);
      }

      return NextResponse.json({ success: true, count });
    }

    // 2. UPDATE COUNT ITEM
    if (action === 'update_item') {
      const { item_id, counted_quantity, notes } = body;
      if (!item_id || !isValidUUID(item_id)) {
        return NextResponse.json({ error: 'Item ID non valido' }, { status: 400 });
      }

      const qty = parseInt(counted_quantity, 10);
      if (isNaN(qty) || qty < 0) {
        return NextResponse.json({ error: 'Quantità contata non valida (>= 0)' }, { status: 400 });
      }

      const { data: updatedItem, error: updateErr } = await adminClient
        .from('inventory_count_items')
        .update({
          counted_quantity: qty,
          notes: notes ? sanitizeString(notes, 255) : null,
        })
        .eq('id', item_id)
        .eq('organization_id', targetOrgId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, item: updatedItem });
    }

    // 3. APPLY AND RECONCILE DISCREPANCIES VIA ATOMIC RPC
    if (action === 'apply') {
      const { count_id } = body;
      if (!count_id || !isValidUUID(count_id)) {
        return NextResponse.json({ error: 'Count ID non valido' }, { status: 400 });
      }

      const { data: rpcResult, error: rpcErr } = await adminClient.rpc('rpc_apply_inventory_count', {
        p_count_id: count_id,
        p_user_id: profile.auth_user_id || null,
      });

      if (rpcErr) {
        return NextResponse.json({ error: rpcErr.message || 'Errore riconciliazione inventario' }, { status: 400 });
      }

      return NextResponse.json({ success: true, result: rpcResult });
    }

    // 4. CANCEL SESSION
    if (action === 'cancel') {
      const { count_id } = body;
      if (!count_id || !isValidUUID(count_id)) {
        return NextResponse.json({ error: 'Count ID non valido' }, { status: 400 });
      }

      const { error: cancelErr } = await adminClient
        .from('inventory_counts')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', count_id)
        .eq('organization_id', targetOrgId);

      if (cancelErr) {
        return NextResponse.json({ error: cancelErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Azione non riconosciuta' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

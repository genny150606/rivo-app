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

const POItemSchema = z.object({
  variant_id: z.string().uuid('Variante non valida'),
  product_name: z.string().min(1),
  variant_name: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  quantity_ordered: z.number().int().positive('Quantità ordinata non valida'),
  unit_cost: z.number().nonnegative('Costo non valido'),
});

const CreatePOSchema = z.object({
  supplier_id: z.string().uuid('Fornitore non valido'),
  location_id: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'ordered']).default('ordered'),
  expected_delivery_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(POItemSchema).min(1, 'L\'ordine deve contenere almeno un articolo'),
});

const ReceiveItemSchema = z.object({
  po_item_id: z.string().uuid('Item ordine non valido'),
  variant_id: z.string().uuid('Variante non valida'),
  quantity_received: z.number().int().positive('Quantità ricevuta non valida'),
  unit_cost: z.number().nonnegative().optional().nullable(),
});

const ReceivePOSchema = z.object({
  po_id: z.string().uuid('ID ordine non valido'),
  location_id: z.string().uuid().optional().nullable(),
  received_items: z.array(ReceiveItemSchema).min(1, 'Seleziona almeno un articolo ricevuto'),
});

/**
 * GET /api/purchase-orders
 * List purchase orders or get a single PO with items and supplier info.
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

    const moduleDenied = await guardModuleAccess(targetOrgId, 'suppliers');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'suppliers.view')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const poId = searchParams.get('id');

    // Single PO detail
    if (poId) {
      if (!isValidUUID(poId)) {
        return NextResponse.json({ error: 'ID non valido' }, { status: 400 });
      }

      const { data: po, error: poErr } = await adminClient
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers (*),
          items:purchase_order_items (
            id,
            purchase_order_id,
            variant_id,
            product_name,
            variant_name,
            sku,
            barcode,
            quantity_ordered,
            quantity_received,
            unit_cost,
            total_cost,
            variant:product_variants (
              id,
              size,
              color,
              barcode,
              reorder_threshold,
              product:products (
                id,
                name,
                image_url
              )
            )
          )
        `)
        .eq('id', poId)
        .eq('organization_id', targetOrgId)
        .single();

      if (poErr || !po) {
        return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
      }

      return NextResponse.json({ purchase_order: po });
    }

    // List POs
    const statusFilter = searchParams.get('status');
    const supplierFilter = searchParams.get('supplier_id');

    let query = adminClient
      .from('purchase_orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        expected_delivery_date,
        ordered_at,
        received_at,
        created_at,
        notes,
        supplier:suppliers (
          id,
          name,
          phone,
          email
        ),
        items:purchase_order_items (
          id,
          quantity_ordered,
          quantity_received,
          unit_cost,
          total_cost
        )
      `)
      .eq('organization_id', targetOrgId)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (supplierFilter && isValidUUID(supplierFilter)) {
      query = query.eq('supplier_id', supplierFilter);
    }

    const { data: orders, error: ordersErr } = await query;

    if (ordersErr) {
      return NextResponse.json({ error: ordersErr.message }, { status: 500 });
    }

    return NextResponse.json({ purchase_orders: orders || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/purchase-orders
 * Create a new purchase order.
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

    const moduleDenied = await guardModuleAccess(targetOrgId, 'suppliers');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'suppliers.create')) {
      return NextResponse.json({ error: 'Permessi insufficienti per creare ordini d\'acquisto' }, { status: 403 });
    }

    const rawBody = await request.json();
    const parseResult = CreatePOSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || 'Dati ordine non validi';
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const {
      supplier_id,
      location_id,
      status,
      expected_delivery_date,
      notes,
      items,
    } = parseResult.data;

    // Generate sequential order number: ORD-YYYYMMDD-XXXX
    const todayPrefix = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    const { count } = await adminClient
      .from('purchase_orders')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', targetOrgId)
      .like('order_number', `${todayPrefix}%`);

    const seq = (count || 0) + 1;
    const orderNumber = `${todayPrefix}-${String(seq).padStart(4, '0')}`;

    // Total amount calculation
    const totalAmount = items.reduce((acc, it) => acc + (it.quantity_ordered * it.unit_cost), 0);

    // Create PO header
    const { data: po, error: poErr } = await adminClient
      .from('purchase_orders')
      .insert({
        organization_id: targetOrgId,
        supplier_id,
        location_id: location_id || null,
        order_number: orderNumber,
        status,
        total_amount: totalAmount,
        expected_delivery_date: expected_delivery_date || null,
        notes: notes ? sanitizeString(notes, 1000) : null,
        ordered_at: status === 'ordered' ? new Date().toISOString() : null,
        created_by: profile.auth_user_id || null,
      })
      .select()
      .single();

    if (poErr || !po) {
      return NextResponse.json({ error: poErr?.message || 'Errore creazione ordine' }, { status: 400 });
    }

    // Insert items
    const poItemsToInsert = items.map((it) => ({
      purchase_order_id: po.id,
      organization_id: targetOrgId,
      variant_id: it.variant_id,
      product_name: sanitizeString(it.product_name, 255)!,
      variant_name: it.variant_name ? sanitizeString(it.variant_name, 100) : null,
      sku: it.sku ? sanitizeString(it.sku, 100) : null,
      barcode: it.barcode ? sanitizeString(it.barcode, 100) : null,
      quantity_ordered: it.quantity_ordered,
      quantity_received: 0,
      unit_cost: it.unit_cost,
      total_cost: it.quantity_ordered * it.unit_cost,
    }));

    const { error: itemsErr } = await adminClient
      .from('purchase_order_items')
      .insert(poItemsToInsert);

    if (itemsErr) {
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      purchase_order: po,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/purchase-orders
 * Perform receiving or update status of purchase order.
 */
export async function PATCH(request: NextRequest) {
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

    const moduleDenied = await guardModuleAccess(targetOrgId, 'suppliers');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'suppliers.update')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const rawBody = await request.json();
    const action = rawBody.action;

    // 1. RECEIVE MERCHANDISE ATOMICALLY
    if (action === 'receive') {
      const parseResult = ReceivePOSchema.safeParse(rawBody);
      if (!parseResult.success) {
        const firstIssue = parseResult.error.issues[0]?.message || 'Dati ricezione non validi';
        return NextResponse.json({ error: firstIssue }, { status: 400 });
      }

      const { po_id, location_id, received_items } = parseResult.data;

      // Call atomic RPC rpc_receive_purchase_order
      const { data: rpcResult, error: rpcErr } = await adminClient.rpc('rpc_receive_purchase_order', {
        p_org_id: targetOrgId,
        p_po_id: po_id,
        p_location_id: location_id || null,
        p_received_items: received_items,
        p_user_id: profile.auth_user_id || null,
      });

      if (rpcErr) {
        return NextResponse.json({ error: rpcErr.message || 'Errore durante la ricezione merce' }, { status: 400 });
      }

      return NextResponse.json({ success: true, result: rpcResult });
    }

    // 2. CHANGE STATUS (e.g. cancel, mark ordered)
    if (action === 'status') {
      const { po_id, status } = rawBody;
      if (!po_id || !isValidUUID(po_id)) {
        return NextResponse.json({ error: 'ID ordine non valido' }, { status: 400 });
      }

      const validStatuses = ['draft', 'ordered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Stato non consentito per questa azione' }, { status: 400 });
      }

      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'ordered') {
        updateData.ordered_at = new Date().toISOString();
      }

      const { data: updated, error: updErr } = await adminClient
        .from('purchase_orders')
        .update(updateData)
        .eq('id', po_id)
        .eq('organization_id', targetOrgId)
        .select()
        .single();

      if (updErr || !updated) {
        return NextResponse.json({ error: updErr?.message || 'Errore cambio stato' }, { status: 400 });
      }

      return NextResponse.json({ success: true, purchase_order: updated });
    }

    return NextResponse.json({ error: 'Azione non riconosciuta' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

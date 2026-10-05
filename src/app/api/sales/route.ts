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

const SaleItemSchema = z.object({
  variant_id: z.string().uuid().optional().nullable(),
  product_id: z.string().uuid().optional().nullable(),
  product_name: z.string().min(1, 'Nome prodotto richiesto'),
  variant_name: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  quantity: z.number().int().positive('La quantità deve essere positiva'),
  unit_price: z.number().nonnegative('Prezzo non valido'),
  cost_price: z.number().nonnegative().optional().nullable(),
  discount_amount: z.number().nonnegative().optional().default(0),
  tax_rate: z.number().nonnegative().optional().default(22),
});

const CompleteSaleSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid().optional().nullable(),
  payment_method: z.enum(['cash', 'card', 'transfer', 'mixed', 'coupon']),
  discount_amount: z.number().nonnegative().optional().default(0),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(SaleItemSchema).min(1, 'Il carrello deve contenere almeno un articolo'),
});

/**
 * GET /api/sales
 * List historical sales or fetch a single sale with items, payments and returns.
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

    // Module guard: require 'sales'
    const moduleDenied = await guardModuleAccess(targetOrgId, 'sales');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'sales.view')) {
      return NextResponse.json({ error: 'Permessi insufficienti per consultare le vendite' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('id');

    // Single sale detail
    if (saleId) {
      if (!isValidUUID(saleId)) {
        return NextResponse.json({ error: 'ID vendita non valido' }, { status: 400 });
      }

      const { data: sale, error: saleErr } = await adminClient
        .from('sales')
        .select(`
          *,
          customer:customers (
            id,
            first_name,
            last_name,
            phone,
            email,
            fidelity_points
          ),
          items:sale_items (
            id,
            product_id,
            variant_id,
            product_name,
            variant_name,
            sku,
            barcode,
            quantity,
            unit_price,
            cost_price,
            discount_amount,
            tax_rate,
            total_price,
            returned_quantity
          ),
          payments:sale_payments (*),
          returns:sale_returns (
            *,
            items:sale_return_items (*)
          )
        `)
        .eq('id', saleId)
        .eq('organization_id', targetOrgId)
        .single();

      if (saleErr || !sale) {
        return NextResponse.json({ error: 'Vendita non trovata' }, { status: 404 });
      }

      return NextResponse.json({ sale });
    }

    // List sales
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200);
    const querySearch = searchParams.get('search');
    const filterStatus = searchParams.get('status');
    const filterPayment = searchParams.get('payment_method');

    let salesQuery = adminClient
      .from('sales')
      .select(`
        id,
        sale_number,
        status,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        cost_total,
        gross_margin,
        payment_method,
        operator_name,
        created_at,
        customer:customers (
          id,
          first_name,
          last_name,
          phone
        ),
        items:sale_items (
          id,
          product_name,
          variant_name,
          quantity,
          unit_price,
          total_price,
          returned_quantity
        )
      `)
      .eq('organization_id', targetOrgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filterStatus && filterStatus !== 'all') {
      salesQuery = salesQuery.eq('status', filterStatus);
    }
    if (filterPayment && filterPayment !== 'all') {
      salesQuery = salesQuery.eq('payment_method', filterPayment);
    }
    if (querySearch) {
      salesQuery = salesQuery.or(`sale_number.ilike.%${querySearch}%,operator_name.ilike.%${querySearch}%`);
    }

    const { data: sales, error: listErr } = await salesQuery;

    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }

    return NextResponse.json({ sales: sales || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/sales
 * Complete a retail sale atomically via Postgres RPC rpc_complete_sale.
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

    // Module guard: require 'sales'
    const moduleDenied = await guardModuleAccess(targetOrgId, 'sales');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'sales.create')) {
      return NextResponse.json({ error: 'Permessi insufficienti per emettere scontrini e vendite' }, { status: 403 });
    }

    const rawBody = await request.json();
    const parseResult = CompleteSaleSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || 'Dati vendita non validi';
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const {
      customer_id,
      location_id,
      payment_method,
      discount_amount,
      notes,
      items,
    } = parseResult.data;

    // Operator info
    const operatorName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || 'Operatore Cassa';

    // Format items for PostgreSQL JSONB
    const formattedItems = items.map((it) => ({
      variant_id: it.variant_id || null,
      product_id: it.product_id || null,
      product_name: sanitizeString(it.product_name, 255),
      variant_name: it.variant_name ? sanitizeString(it.variant_name, 100) : null,
      sku: it.sku ? sanitizeString(it.sku, 100) : null,
      barcode: it.barcode ? sanitizeString(it.barcode, 100) : null,
      quantity: it.quantity,
      unit_price: it.unit_price,
      cost_price: it.cost_price ?? null,
      discount_amount: it.discount_amount ?? 0,
      tax_rate: it.tax_rate ?? 22,
    }));

    // Call atomic RPC
    const { data: rpcResult, error: rpcErr } = await adminClient.rpc('rpc_complete_sale', {
      p_org_id: targetOrgId,
      p_location_id: location_id || null,
      p_customer_id: customer_id || null,
      p_operator_id: profile.auth_user_id || null,
      p_operator_name: operatorName,
      p_items: formattedItems,
      p_payment_method: payment_method,
      p_discount_amount: discount_amount || 0,
      p_notes: notes ? sanitizeString(notes, 500) : null,
    });

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message || 'Errore durante la chiusura vendita' }, { status: 400 });
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

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

const CustomerSchema = z.object({
  first_name: z.string().min(1, 'Nome richiesto').max(100),
  last_name: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email('Email non valida').optional().nullable().or(z.literal('')),
  tax_code: z.string().max(20).optional().nullable(),
  birthdate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  fidelity_points: z.number().int().nonnegative().optional().default(0),
});

/**
 * GET /api/customers
 * List customers with optional search and sorting, or get single customer with sales history.
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

    // Module guard: crm
    const moduleDenied = await guardModuleAccess(targetOrgId, 'crm');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'customers.view')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');

    // Single Customer detail with sales history
    if (customerId) {
      if (!isValidUUID(customerId)) {
        return NextResponse.json({ error: 'ID non valido' }, { status: 400 });
      }

      const { data: customer, error: custErr } = await adminClient
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('organization_id', targetOrgId)
        .single();

      if (custErr || !customer) {
        return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });
      }

      // Fetch customer purchase history
      const { data: sales, error: salesErr } = await adminClient
        .from('sales')
        .select(`
          id,
          sale_number,
          status,
          total_amount,
          payment_method,
          created_at,
          items:sale_items (
            product_name,
            variant_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('customer_id', customerId)
        .eq('organization_id', targetOrgId)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        customer,
        sales: sales || [],
      });
    }

    // List customers
    const search = searchParams.get('search');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 500);

    let query = adminClient
      .from('customers')
      .select('*')
      .eq('organization_id', targetOrgId)
      .order('total_spent', { ascending: false })
      .limit(limit);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: customers, error: listErr } = await query;

    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }

    return NextResponse.json({ customers: customers || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/customers
 * Create a new customer.
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

    const moduleDenied = await guardModuleAccess(targetOrgId, 'crm');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'customers.create')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const rawBody = await request.json();
    const parseResult = CustomerSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || 'Dati cliente non validi';
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const d = parseResult.data;

    const { data: newCustomer, error: insertErr } = await adminClient
      .from('customers')
      .insert({
        organization_id: targetOrgId,
        first_name: sanitizeString(d.first_name, 100)!,
        last_name: sanitizeString(d.last_name, 100),
        phone: sanitizeString(d.phone, 50),
        email: d.email ? sanitizeString(d.email, 150) : null,
        tax_code: sanitizeString(d.tax_code, 20),
        birthdate: d.birthdate || null,
        notes: sanitizeString(d.notes, 1000),
        fidelity_points: d.fidelity_points || 0,
        total_spent: 0.00,
        purchases_count: 0,
      })
      .select()
      .single();

    if (insertErr || !newCustomer) {
      return NextResponse.json({ error: insertErr?.message || 'Errore creazione cliente' }, { status: 400 });
    }

    return NextResponse.json({ success: true, customer: newCustomer });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/customers
 * Update an existing customer.
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

    const moduleDenied = await guardModuleAccess(targetOrgId, 'crm');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'customers.update')) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const rawBody = await request.json();
    const { id, ...updateFields } = rawBody;

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID cliente non valido' }, { status: 400 });
    }

    const parseResult = CustomerSchema.partial().safeParse(updateFields);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || 'Dati non validi';
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const d = parseResult.data;
    const cleanData: Record<string, any> = { updated_at: new Date().toISOString() };

    if (d.first_name !== undefined) cleanData.first_name = sanitizeString(d.first_name, 100);
    if (d.last_name !== undefined) cleanData.last_name = sanitizeString(d.last_name, 100);
    if (d.phone !== undefined) cleanData.phone = sanitizeString(d.phone, 50);
    if (d.email !== undefined) cleanData.email = d.email ? sanitizeString(d.email, 150) : null;
    if (d.tax_code !== undefined) cleanData.tax_code = sanitizeString(d.tax_code, 20);
    if (d.birthdate !== undefined) cleanData.birthdate = d.birthdate || null;
    if (d.notes !== undefined) cleanData.notes = sanitizeString(d.notes, 1000);
    if (d.fidelity_points !== undefined) cleanData.fidelity_points = d.fidelity_points;

    const { data: updated, error: updateErr } = await adminClient
      .from('customers')
      .update(cleanData)
      .eq('id', id)
      .eq('organization_id', targetOrgId)
      .select()
      .single();

    if (updateErr || !updated) {
      return NextResponse.json({ error: updateErr?.message || 'Errore aggiornamento cliente' }, { status: 400 });
    }

    return NextResponse.json({ success: true, customer: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

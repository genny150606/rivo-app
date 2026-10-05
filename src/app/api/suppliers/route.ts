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

const SupplierSchema = z.object({
  name: z.string().min(1, 'Nome fornitore richiesto').max(255),
  company_name: z.string().max(255).optional().nullable(),
  contact_name: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email('Email non valida').optional().nullable().or(z.literal('')),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  vat_number: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  active: z.boolean().default(true),
});

/**
 * GET /api/suppliers
 * List suppliers for the tenant organization.
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

    // Module guard: require 'suppliers'
    const moduleDenied = await guardModuleAccess(targetOrgId, 'suppliers');
    if (moduleDenied) return moduleDenied;

    if (!hasPermission(profile.role, 'suppliers.view')) {
      return NextResponse.json({ error: 'Permessi insufficienti per visualizzare i fornitori' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = adminClient
      .from('suppliers')
      .select('*')
      .eq('organization_id', targetOrgId)
      .eq('active', true)
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,contact_name.ilike.%${search}%,vat_number.ilike.%${search}%`);
    }

    const { data: suppliers, error: fetchErr } = await query;

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    return NextResponse.json({ suppliers: suppliers || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/suppliers
 * Create a new supplier.
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
      return NextResponse.json({ error: 'Permessi insufficienti per creare fornitori' }, { status: 403 });
    }

    const rawBody = await request.json();
    const parseResult = SupplierSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || 'Dati fornitore non validi';
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const data = parseResult.data;

    const { data: newSupplier, error: insertErr } = await adminClient
      .from('suppliers')
      .insert({
        organization_id: targetOrgId,
        name: sanitizeString(data.name, 255)!,
        company_name: sanitizeString(data.company_name, 255),
        contact_name: sanitizeString(data.contact_name, 255),
        phone: sanitizeString(data.phone, 50),
        email: data.email ? sanitizeString(data.email, 150) : null,
        address: sanitizeString(data.address, 255),
        city: sanitizeString(data.city, 100),
        vat_number: sanitizeString(data.vat_number, 50),
        notes: sanitizeString(data.notes, 1000),
        active: data.active,
      })
      .select()
      .single();

    if (insertErr || !newSupplier) {
      return NextResponse.json({ error: insertErr?.message || 'Errore creazione fornitore' }, { status: 400 });
    }

    return NextResponse.json({ success: true, supplier: newSupplier });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/suppliers
 * Update an existing supplier.
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
      return NextResponse.json({ error: 'Permessi insufficienti per modificare fornitori' }, { status: 403 });
    }

    const rawBody = await request.json();
    const { id, ...updateFields } = rawBody;

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID fornitore non valido' }, { status: 400 });
    }

    const parseResult = SupplierSchema.partial().safeParse(updateFields);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || 'Dati non validi';
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const cleanData: Record<string, any> = { updated_at: new Date().toISOString() };
    const p = parseResult.data;
    if (p.name !== undefined) cleanData.name = sanitizeString(p.name, 255);
    if (p.company_name !== undefined) cleanData.company_name = sanitizeString(p.company_name, 255);
    if (p.contact_name !== undefined) cleanData.contact_name = sanitizeString(p.contact_name, 255);
    if (p.phone !== undefined) cleanData.phone = sanitizeString(p.phone, 50);
    if (p.email !== undefined) cleanData.email = p.email ? sanitizeString(p.email, 150) : null;
    if (p.address !== undefined) cleanData.address = sanitizeString(p.address, 255);
    if (p.city !== undefined) cleanData.city = sanitizeString(p.city, 100);
    if (p.vat_number !== undefined) cleanData.vat_number = sanitizeString(p.vat_number, 50);
    if (p.notes !== undefined) cleanData.notes = sanitizeString(p.notes, 1000);
    if (p.active !== undefined) cleanData.active = p.active;

    const { data: updated, error: updateErr } = await adminClient
      .from('suppliers')
      .update(cleanData)
      .eq('id', id)
      .eq('organization_id', targetOrgId)
      .select()
      .single();

    if (updateErr || !updated) {
      return NextResponse.json({ error: updateErr?.message || 'Errore aggiornamento fornitore' }, { status: 400 });
    }

    return NextResponse.json({ success: true, supplier: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/suppliers
 * Soft delete supplier (set active = false).
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 });
    }

    const { error: delErr } = await adminClient
      .from('suppliers')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
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

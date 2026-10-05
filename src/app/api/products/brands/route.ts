import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserOrgAccess, isValidUUID, sanitizeString } from '@/lib/security';
import { guardModuleAccess } from '@/lib/modules/guard';
import { hasPermission } from '@/lib/rbac';
import { CreateBrandSchema } from '@/platform/retail/types';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    const adminClient = getAdminClient();
    const targetOrgId = profile.organization_id;

    if (!targetOrgId) {
      return NextResponse.json({ error: 'Organizzazione non valida' }, { status: 400 });
    }

    const moduleDenied = await guardModuleAccess(targetOrgId, 'products');
    if (moduleDenied) return moduleDenied;

    const { data: brands, error } = await adminClient
      .from('brands')
      .select('*')
      .eq('organization_id', targetOrgId)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ brands: brands || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    if (!hasPermission(profile.role, 'products.create', profile.permissions)) {
      return NextResponse.json({ error: 'Permessi insufficienti per creare brand' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    const targetOrgId = profile.organization_id;
    if (!targetOrgId) {
      return NextResponse.json({ error: 'Organizzazione non valida' }, { status: 400 });
    }

    const moduleDenied = await guardModuleAccess(targetOrgId, 'products');
    if (moduleDenied) return moduleDenied;

    const body = await request.json();
    const parsed = CreateBrandSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dati non validi' }, { status: 400 });
    }

    const { name, description, logo_url } = parsed.data;

    const { data: brand, error } = await adminClient
      .from('brands')
      .insert({
        organization_id: targetOrgId,
        name: sanitizeString(name, 100),
        description: sanitizeString(description, 500),
        logo_url: logo_url || null,
        active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, brand });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;

    const { profile } = authResult;
    if (!hasPermission(profile.role, 'products.delete', profile.permissions)) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
    }

    const targetOrgId = profile.organization_id;
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('id');

    if (!brandId || !isValidUUID(brandId)) {
      return NextResponse.json({ error: 'ID brand non valido' }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from('brands')
      .delete()
      .eq('id', brandId)
      .eq('organization_id', targetOrgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

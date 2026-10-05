import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserOrgAccess, isValidUUID, sanitizeString } from '@/lib/security';
import { guardModuleAccess } from '@/lib/modules/guard';
import { hasPermission } from '@/lib/rbac';
import { CreateCategorySchema } from '@/platform/retail/types';

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

    const { data: categories, error } = await adminClient
      .from('product_categories')
      .select('*')
      .eq('organization_id', targetOrgId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories: categories || [] });
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
      return NextResponse.json({ error: 'Permessi insufficienti per creare categorie' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    const targetOrgId = profile.organization_id;
    if (!targetOrgId) {
      return NextResponse.json({ error: 'Organizzazione non valida' }, { status: 400 });
    }

    const moduleDenied = await guardModuleAccess(targetOrgId, 'products');
    if (moduleDenied) return moduleDenied;

    const body = await request.json();
    const parsed = CreateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dati non validi' }, { status: 400 });
    }

    const { name, parent_id, description, sort_order } = parsed.data;

    const { data: category, error } = await adminClient
      .from('product_categories')
      .insert({
        organization_id: targetOrgId,
        name: sanitizeString(name, 100),
        parent_id: parent_id || null,
        description: sanitizeString(description, 500),
        sort_order: sort_order || 0,
        active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, category });
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
    const categoryId = searchParams.get('id');

    if (!categoryId || !isValidUUID(categoryId)) {
      return NextResponse.json({ error: 'ID categoria non valido' }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from('product_categories')
      .delete()
      .eq('id', categoryId)
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

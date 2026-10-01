import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserOrgAccess, isValidUUID } from '@/lib/security';
import { MODULE_CATALOG, ModuleSlug } from '@/lib/modules/catalog';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * GET /api/admin/organizations/[id]/modules
 * Returns all system modules along with their enabled status for this organization.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'ID organizzazione non valido' }, { status: 400 });
    }

    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;
    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accesso riservato ai superadmin RIVO' }, { status: 403 });
    }

    const adminClient = getAdminClient();

    // 1. Fetch organization details
    const { data: org, error: orgErr } = await adminClient
      .from('organizations')
      .select('id, name, slug, category, business_type_id')
      .eq('id', orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
    }

    // 2. Fetch all system modules
    const { data: dbModules, error: modErr } = await adminClient
      .from('modules')
      .select('*')
      .order('sort_order', { ascending: true });

    if (modErr) {
      return NextResponse.json({ error: 'Errore nel recupero moduli di sistema' }, { status: 500 });
    }

    // 3. Fetch org module overrides
    const { data: orgModules } = await adminClient
      .from('organization_modules')
      .select('module_id, enabled, source, config_json')
      .eq('organization_id', orgId);

    const orgModMap = new Map<string, { enabled: boolean; source: string; configJson: any }>();
    if (orgModules) {
      for (const om of orgModules) {
        orgModMap.set(om.module_id, {
          enabled: om.enabled,
          source: om.source,
          configJson: om.config_json,
        });
      }
    }

    // 4. Map modules with catalog definitions
    const modulesWithStatus = (dbModules || []).map((m: any) => {
      const catalogDef = MODULE_CATALOG[m.slug as ModuleSlug];
      const orgState = orgModMap.get(m.id);
      return {
        id: m.id,
        slug: m.slug,
        name: m.name || catalogDef?.name,
        description: m.description || catalogDef?.description,
        category: m.category || catalogDef?.category || 'shared',
        dependencies: catalogDef?.dependencies || [],
        enabled: orgState ? orgState.enabled : false,
        source: orgState ? orgState.source : 'none',
        config: orgState?.configJson || {},
      };
    });

    return NextResponse.json({
      organization: org,
      modules: modulesWithStatus,
    });
  } catch (err: any) {
    console.error('Error fetching org modules:', err);
    return NextResponse.json({ error: err.message || 'Errore interno' }, { status: 500 });
  }
}

/**
 * POST /api/admin/organizations/[id]/modules
 * Toggle or upsert a module's enabled status for this organization.
 * Body: { moduleId: string, enabled: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'ID organizzazione non valido' }, { status: 400 });
    }

    const authResult = await verifyUserOrgAccess(request);
    if (!authResult.authorized) return authResult.errorResponse;
    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accesso riservato ai superadmin RIVO' }, { status: 403 });
    }

    const body = await request.json();
    const { moduleId, enabled } = body;

    if (!moduleId || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'moduleId ed enabled sono obbligatori' }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // Check if moduleId exists
    const { data: mod, error: modErr } = await adminClient
      .from('modules')
      .select('id, slug, name')
      .eq('id', moduleId)
      .single();

    if (modErr || !mod) {
      return NextResponse.json({ error: 'Modulo non trovato' }, { status: 404 });
    }

    // Upsert into organization_modules with source = 'admin_override'
    const { data: upserted, error: upsertErr } = await adminClient
      .from('organization_modules')
      .upsert(
        {
          organization_id: orgId,
          module_id: moduleId,
          enabled,
          source: 'admin_override',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,module_id' }
      )
      .select()
      .single();

    if (upsertErr) {
      console.error('Upsert org module error:', upsertErr);
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      module: mod,
      enabled,
      record: upserted,
    });
  } catch (err: any) {
    console.error('Error updating org module:', err);
    return NextResponse.json({ error: err.message || 'Errore interno' }, { status: 500 });
  }
}

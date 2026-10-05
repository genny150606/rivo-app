import { createClient } from '@supabase/supabase-js';
import { ModuleSlug } from '@/platform/modules/registry';
import { VERTICAL_REGISTRY, getVertical } from '@/platform/verticals/registry';
import { BusinessTypeSlug } from '@/platform/modules/registry';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

export interface OrgModuleState {
  moduleId: string;
  slug: ModuleSlug;
  name: string;
  category: string;
  enabled: boolean;
  source: string;
  configJson: Record<string, unknown>;
}

export interface ResolvedOrgModules {
  organizationId: string;
  businessTypeId?: string;
  businessTypeSlug?: BusinessTypeSlug;
  activeSlugs: Set<ModuleSlug>;
  allModules: OrgModuleState[];
}

interface RawModuleRow {
  id: string;
  slug: string;
  name: string;
  category: string;
}

interface OrgModuleRow {
  id: string;
  module_id: string;
  enabled: boolean;
  source: string;
  config_json: Record<string, unknown> | null;
  modules: RawModuleRow | RawModuleRow[] | null;
}

/**
 * Resolves active modules for an organization.
 * Queries `organization_modules` joined with `modules`.
 * If no modules are found (e.g. legacy org before backfill), falls back to default preset.
 */
export async function getOrganizationModules(organizationId: string): Promise<ResolvedOrgModules> {
  const adminClient = getAdminClient();
  const { data: orgData, error: orgErr } = await adminClient
    .from('organizations')
    .select('id, category, business_type_id')
    .eq('id', organizationId)
    .single();

  if (orgErr || !orgData) {
    return {
      organizationId,
      activeSlugs: new Set<ModuleSlug>(['analytics', 'nfc_qr', 'universal_hub']),
      allModules: []
    };
  }

  // Fetch active modules from organization_modules
  const { data: orgModules } = await adminClient
    .from('organization_modules')
    .select(`
      id,
      module_id,
      enabled,
      source,
      config_json,
      modules:module_id (
        id,
        slug,
        name,
        category
      )
    `)
    .eq('organization_id', organizationId);

  const activeSlugs = new Set<ModuleSlug>();
  const allModules: OrgModuleState[] = [];

  if (orgModules && orgModules.length > 0) {
    for (const om of orgModules as unknown as OrgModuleRow[]) {
      const mod = Array.isArray(om.modules) ? om.modules[0] : om.modules;
      if (mod && mod.slug) {
        const slug = mod.slug as ModuleSlug;
        allModules.push({
          moduleId: mod.id,
          slug,
          name: mod.name,
          category: mod.category,
          enabled: om.enabled,
          source: om.source,
          configJson: om.config_json || {}
        });

        if (om.enabled) {
          activeSlugs.add(slug);
        }
      }
    }
  } else {
    // Fallback if not configured: check category / business type
    const category = (orgData.category || 'restaurant') as BusinessTypeSlug;
    const vertical = getVertical(category in VERTICAL_REGISTRY ? category : 'restaurant');
    for (const slug of vertical.defaultModules) {
      activeSlugs.add(slug);
    }
  }

  return {
    organizationId,
    businessTypeId: orgData.business_type_id || undefined,
    activeSlugs,
    allModules
  };
}

/**
 * Checks if a specific module is active for an organization
 */
export async function isModuleActive(organizationId: string, slug: ModuleSlug): Promise<boolean> {
  const resolved = await getOrganizationModules(organizationId);
  return resolved.activeSlugs.has(slug);
}

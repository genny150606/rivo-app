import { createClient } from '@supabase/supabase-js';
import { ModuleSlug, MODULE_CATALOG } from './catalog';

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
  configJson: any;
}

export interface ResolvedOrgModules {
  organizationId: string;
  businessTypeId?: string;
  businessTypeSlug?: string;
  activeSlugs: Set<ModuleSlug>;
  allModules: OrgModuleState[];
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
  const { data: orgModules, error: modErr } = await adminClient
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
    for (const om of orgModules) {
      const mod = om.modules as any;
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
    // Fallback if not configured: check category
    const isRestaurant = !orgData.category || ['restaurant', 'bar', 'pizzeria'].includes(orgData.category);
    if (isRestaurant) {
      activeSlugs.add('analytics');
      activeSlugs.add('crm');
      activeSlugs.add('nfc_qr');
      activeSlugs.add('review_shield');
      activeSlugs.add('loyalty');
      activeSlugs.add('coupons');
      activeSlugs.add('smart_router');
      activeSlugs.add('universal_hub');
      activeSlugs.add('table_service');
      activeSlugs.add('staff');
      activeSlugs.add('service_calls');
      activeSlugs.add('canva_menu');
    } else {
      activeSlugs.add('analytics');
      activeSlugs.add('nfc_qr');
      activeSlugs.add('universal_hub');
      activeSlugs.add('products');
      activeSlugs.add('inventory');
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

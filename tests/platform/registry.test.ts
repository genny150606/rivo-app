import { describe, it, expect } from 'vitest';
import { MODULE_REGISTRY, validateModuleDependencies, ModuleSlug } from '@/platform/modules/registry';
import { VERTICAL_REGISTRY, getVertical } from '@/platform/verticals/registry';
import { resolveSidebarNavigation } from '@/platform/navigation/sidebar';

describe('Platform Module Registry', () => {
  it('contains all required modules with valid structure', () => {
    const requiredModules: ModuleSlug[] = [
      'analytics',
      'products',
      'inventory',
      'sales',
      'suppliers',
      'crm',
      'loyalty',
      'coupons',
      'review_shield',
      'nfc_qr',
      'universal_hub',
      'table_service',
      'service_calls',
      'canva_menu',
      'staff',
    ];

    for (const slug of requiredModules) {
      const mod = MODULE_REGISTRY[slug];
      expect(mod).toBeDefined();
      expect(mod.slug).toBe(slug);
      expect(mod.name.length).toBeGreaterThan(0);
      expect(mod.navGroupId).toBeDefined();
      expect(Array.isArray(mod.routes)).toBe(true);
    }
  });

  it('validates module dependencies correctly', () => {
    // Inventory requires products
    const invalidState: ModuleSlug[] = ['inventory'];
    const resInvalid = validateModuleDependencies(invalidState);
    expect(resInvalid.valid).toBe(false);
    expect(resInvalid.missingDependencies['inventory']).toContain('products');

    // Valid state: both products and inventory
    const validState: ModuleSlug[] = ['products', 'inventory'];
    const resValid = validateModuleDependencies(validState);
    expect(resValid.valid).toBe(true);
  });
});

describe('Platform Vertical Registry', () => {
  it('correctly defines retail and shoe_store verticals', () => {
    const shoeStore = getVertical('shoe_store');
    expect(shoeStore.slug).toBe('shoe_store');
    expect(shoeStore.dashboardType).toBe('retail');
    expect(shoeStore.defaultModules).toContain('products');
    expect(shoeStore.defaultModules).toContain('inventory');
    expect(shoeStore.defaultModules).toContain('sales');
    expect(shoeStore.defaultModules).toContain('suppliers');

    const retail = getVertical('retail');
    expect(retail.dashboardType).toBe('retail');
    expect(retail.defaultModules).toContain('products');
  });

  it('correctly defines restaurant vertical', () => {
    const restaurant = getVertical('restaurant');
    expect(restaurant.slug).toBe('restaurant');
    expect(restaurant.dashboardType).toBe('restaurant');
    expect(restaurant.defaultModules).toContain('table_service');
    expect(restaurant.defaultModules).toContain('canva_menu');
    expect(restaurant.defaultModules).toContain('service_calls');
  });
});

describe('Dynamic Navigation Resolver', () => {
  it('renders strictly retail navigation for a shoe store', () => {
    const activeModules = new Set<ModuleSlug>([
      'analytics',
      'products',
      'inventory',
      'sales',
      'suppliers',
      'crm',
      'loyalty',
    ]);

    const nav = resolveSidebarNavigation(activeModules, 'owner', 'shoe_store');
    const allHrefs = nav.flatMap((g) => g.items.map((i) => i.href));

    // Retail items must be present
    expect(allHrefs).toContain('/dashboard/products');
    expect(allHrefs).toContain('/dashboard/inventory');
    expect(allHrefs).toContain('/dashboard/sales');
    expect(allHrefs).toContain('/dashboard/suppliers');
    expect(allHrefs).toContain('/dashboard/leads');

    // Restaurant items must NOT be present
    expect(allHrefs).not.toContain('/dashboard/tables');
    expect(allHrefs).not.toContain('/dashboard/menu');
    expect(allHrefs).not.toContain('/dashboard/service');
    expect(allHrefs).not.toContain('/dashboard/waiter');
  });

  it('renders strictly restaurant navigation for a restaurant', () => {
    const activeModules = new Set<ModuleSlug>([
      'analytics',
      'table_service',
      'canva_menu',
      'service_calls',
      'crm',
      'loyalty',
    ]);

    const nav = resolveSidebarNavigation(activeModules, 'owner', 'restaurant');
    const allHrefs = nav.flatMap((g) => g.items.map((i) => i.href));

    // Restaurant items must be present
    expect(allHrefs).toContain('/dashboard/tables');
    expect(allHrefs).toContain('/dashboard/menu');
    expect(allHrefs).toContain('/dashboard/service');

    // Retail items must NOT be present
    expect(allHrefs).not.toContain('/dashboard/products');
    expect(allHrefs).not.toContain('/dashboard/inventory');
    expect(allHrefs).not.toContain('/dashboard/sales');
    expect(allHrefs).not.toContain('/dashboard/suppliers');
  });

  it('renders specialized console for waiter role', () => {
    const activeModules = new Set<ModuleSlug>([
      'table_service',
      'service_calls',
      'products',
    ]);

    const nav = resolveSidebarNavigation(activeModules, 'waiter', 'restaurant');
    const allHrefs = nav.flatMap((g) => g.items.map((i) => i.href));

    expect(allHrefs).toContain('/dashboard/waiter');
    expect(allHrefs).not.toContain('/dashboard/products');
    expect(allHrefs).not.toContain('/dashboard/settings');
  });
});

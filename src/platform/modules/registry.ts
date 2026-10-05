import { AppPermission } from '@/lib/rbac';

export type ModuleSlug =
  | 'analytics'
  | 'crm'
  | 'nfc_qr'
  | 'review_shield'
  | 'loyalty'
  | 'coupons'
  | 'smart_router'
  | 'universal_hub'
  | 'table_service'
  | 'staff'
  | 'service_calls'
  | 'canva_menu'
  | 'products'
  | 'inventory'
  | 'sales'
  | 'suppliers';

export type BusinessTypeSlug =
  | 'restaurant'
  | 'bar'
  | 'pizzeria'
  | 'gelateria'
  | 'hotel'
  | 'bb'
  | 'shoe_store'
  | 'retail'
  | 'gym'
  | 'medical_studio'
  | 'other';

export type ModuleCategory = 'core' | 'shared' | 'vertical';

export type NavGroupId =
  | 'overview'
  | 'catalog'
  | 'warehouse'
  | 'sales'
  | 'hospitality'
  | 'engagement'
  | 'crm'
  | 'suppliers'
  | 'analytics'
  | 'platform';

export interface NavItemConfig {
  label: string;
  href: string;
  iconName: string;
  badge?: string;
  exact?: boolean;
}

export interface ModuleDefinition {
  slug: ModuleSlug;
  name: string;
  shortName: string;
  description: string;
  category: ModuleCategory;
  verticals: BusinessTypeSlug[] | 'all';
  dependencies?: ModuleSlug[];
  permissions?: AppPermission[];
  navGroupId: NavGroupId;
  navItems: NavItemConfig[];
  routes: string[];
  sortOrder: number;
}

export const MODULE_REGISTRY: Record<ModuleSlug, ModuleDefinition> = {
  analytics: {
    slug: 'analytics',
    name: 'Analytics & Statistiche',
    shortName: 'Analytics',
    description: 'Monitoraggio interazioni, conversioni, KPI di vendita e traffico',
    category: 'core',
    verticals: 'all',
    navGroupId: 'analytics',
    navItems: [
      { label: 'Analytics', href: '/dashboard/analytics', iconName: 'BarChart3' },
    ],
    routes: ['/dashboard/analytics'],
    sortOrder: 10,
  },
  products: {
    slug: 'products',
    name: 'Catalogo Prodotti & Articoli',
    shortName: 'Prodotti',
    description: 'Articoli, categorie, brand, taglie, colori e prezzi di vendita',
    category: 'vertical',
    verticals: ['retail', 'shoe_store', 'other'],
    permissions: ['products.view'],
    navGroupId: 'catalog',
    navItems: [
      { label: 'Catalogo Prodotti', href: '/dashboard/products', iconName: 'ShoppingBag' },
      { label: 'Importa Catalogo', href: '/dashboard/import', iconName: 'Upload' },
    ],
    routes: ['/dashboard/products', '/dashboard/import'],
    sortOrder: 20,
  },
  inventory: {
    slug: 'inventory',
    name: 'Inventario & Giacenze Magazzino',
    shortName: 'Magazzino',
    description: 'Scorte in tempo reale, movimenti carico/scarico e alert sottoscorta',
    category: 'vertical',
    verticals: ['retail', 'shoe_store', 'other'],
    dependencies: ['products'],
    permissions: ['inventory.view'],
    navGroupId: 'warehouse',
    navItems: [
      { label: 'Magazzino & Scorte', href: '/dashboard/inventory', iconName: 'Boxes' },
      { label: 'Check Veloce Stock', href: '/dashboard/stock-check', iconName: 'SearchCheck' },
    ],
    routes: ['/dashboard/inventory', '/dashboard/stock-check'],
    sortOrder: 30,
  },
  sales: {
    slug: 'sales',
    name: 'Cassa & Registro Vendite',
    shortName: 'Cassa',
    description: 'Punto cassa POS rapido, scontrini, resi, metodi di pagamento e storico',
    category: 'vertical',
    verticals: ['retail', 'shoe_store', 'other'],
    dependencies: ['products'],
    permissions: ['sales.view'],
    navGroupId: 'sales',
    navItems: [
      { label: 'Registro Vendite', href: '/dashboard/sales', iconName: 'Receipt' },
    ],
    routes: ['/dashboard/sales'],
    sortOrder: 40,
  },
  suppliers: {
    slug: 'suppliers',
    name: 'Fornitori & Ordini Acquisto',
    shortName: 'Fornitori',
    description: 'Anagrafica fornitori, ordini di riordino e ricevimento merce',
    category: 'vertical',
    verticals: ['retail', 'shoe_store', 'other'],
    dependencies: ['products'],
    permissions: ['suppliers.view'],
    navGroupId: 'suppliers',
    navItems: [
      { label: 'Fornitori & Ordini', href: '/dashboard/suppliers', iconName: 'Truck' },
    ],
    routes: ['/dashboard/suppliers'],
    sortOrder: 50,
  },
  crm: {
    slug: 'crm',
    name: 'Clienti & CRM Anagrafica',
    shortName: 'Clienti',
    description: 'Database clienti, storico acquisti, contatti raccolti e marketing',
    category: 'shared',
    verticals: 'all',
    permissions: ['customers.view'],
    navGroupId: 'crm',
    navItems: [
      { label: 'Clienti & Leads', href: '/dashboard/leads', iconName: 'Users' },
    ],
    routes: ['/dashboard/leads'],
    sortOrder: 60,
  },
  loyalty: {
    slug: 'loyalty',
    name: 'Fidelity Pass & Timbri',
    shortName: 'Fidelity',
    description: 'Tessera punti digitale e pass fidelizzazione Apple & Google Wallet',
    category: 'shared',
    verticals: 'all',
    navGroupId: 'engagement',
    navItems: [
      { label: 'Fidelity Wallet', href: '/dashboard/loyalty', iconName: 'Award' },
    ],
    routes: ['/dashboard/loyalty'],
    sortOrder: 70,
  },
  coupons: {
    slug: 'coupons',
    name: 'Ruota Premi & Coupon',
    shortName: 'Coupon',
    description: 'Gamification in-store, sconti promozionali ed estrazione premi',
    category: 'shared',
    verticals: 'all',
    navGroupId: 'engagement',
    navItems: [
      { label: 'Ruota & Coupon', href: '/dashboard/coupons', iconName: 'Ticket' },
    ],
    routes: ['/dashboard/coupons'],
    sortOrder: 80,
  },
  review_shield: {
    slug: 'review_shield',
    name: 'Review Shield Google',
    shortName: 'Recensioni',
    description: 'Filtro recensioni proattivo e reputazione su Google Business Profile',
    category: 'shared',
    verticals: 'all',
    navGroupId: 'engagement',
    navItems: [
      { label: 'Google Reviews', href: '/dashboard/reviews', iconName: 'ShieldCheck' },
    ],
    routes: ['/dashboard/reviews'],
    sortOrder: 90,
  },
  nfc_qr: {
    slug: 'nfc_qr',
    name: 'NFC & QR Devices',
    shortName: 'Dispositivi',
    description: 'Gestione hardware, chip intelligenti da banco e stand QR fisici',
    category: 'shared',
    verticals: 'all',
    navGroupId: 'platform',
    navItems: [
      { label: 'Dispositivi NFC/QR', href: '/dashboard/devices', iconName: 'QrCode' },
    ],
    routes: ['/dashboard/devices'],
    sortOrder: 100,
  },
  universal_hub: {
    slug: 'universal_hub',
    name: 'Custom Hub Studio',
    shortName: 'Custom Hub',
    description: 'Micro-sito responsive con grafica personalizzata e pulsanti rapidi',
    category: 'shared',
    verticals: 'all',
    navGroupId: 'engagement',
    navItems: [
      { label: 'Custom Hub Studio', href: '/dashboard/custom-hub', iconName: 'Layers' },
    ],
    routes: ['/dashboard/custom-hub'],
    sortOrder: 110,
  },
  smart_router: {
    slug: 'smart_router',
    name: 'Smart Router Orario',
    shortName: 'Smart Router',
    description: 'Instradamento intelligente in base alla fascia oraria e giorno',
    category: 'shared',
    verticals: 'all',
    navGroupId: 'platform',
    navItems: [],
    routes: [],
    sortOrder: 120,
  },
  table_service: {
    slug: 'table_service',
    name: 'Gestione Sala & Tavoli',
    shortName: 'Tavoli',
    description: 'Mappa tavoli, assegnazione camerieri di rango e visuale coperti',
    category: 'vertical',
    verticals: ['restaurant', 'bar', 'pizzeria'],
    permissions: ['tables.view'],
    navGroupId: 'hospitality',
    navItems: [
      { label: 'Mappa Tavoli & Sala', href: '/dashboard/tables', iconName: 'LayoutGrid' },
      { label: 'Console Cameriere', href: '/dashboard/waiter', iconName: 'ConciergeBell' },
    ],
    routes: ['/dashboard/tables', '/dashboard/waiter'],
    sortOrder: 130,
  },
  service_calls: {
    slug: 'service_calls',
    name: 'Chiamate Sala & Telegram',
    shortName: 'Chiamate',
    description: 'Notifiche in tempo reale al cameriere, richieste conto e bot Telegram',
    category: 'vertical',
    verticals: ['restaurant', 'bar', 'pizzeria', 'hotel'],
    navGroupId: 'hospitality',
    navItems: [
      { label: 'Chiamate Sala', href: '/dashboard/service', iconName: 'BellRing' },
    ],
    routes: ['/dashboard/service'],
    sortOrder: 140,
  },
  canva_menu: {
    slug: 'canva_menu',
    name: 'Menù Canvas Digitale',
    shortName: 'Menù',
    description: 'Designer visuale per menu ristorante con categorie e piatti ordinabili',
    category: 'vertical',
    verticals: ['restaurant', 'bar', 'pizzeria'],
    permissions: ['menu.view'],
    navGroupId: 'hospitality',
    navItems: [
      { label: 'Menù Digitale', href: '/dashboard/menu', iconName: 'UtensilsCrossed' },
    ],
    routes: ['/dashboard/menu'],
    sortOrder: 150,
  },
  staff: {
    slug: 'staff',
    name: 'Staff & Risorse Umane',
    shortName: 'Staff',
    description: 'Inviti collaboratori, ruoli (Owner, Manager, Waiter, Employee) e turni',
    category: 'vertical',
    verticals: 'all',
    permissions: ['staff.view'],
    navGroupId: 'platform',
    navItems: [
      { label: 'Staff & Ruoli', href: '/dashboard/staff', iconName: 'UserCheck' },
    ],
    routes: ['/dashboard/staff'],
    sortOrder: 160,
  },
};

/**
 * Returns module definition or undefined
 */
export function getModule(slug: ModuleSlug): ModuleDefinition | undefined {
  return MODULE_REGISTRY[slug];
}

/**
 * Validates dependencies between enabled modules
 */
export function validateModuleDependencies(enabledSlugs: ModuleSlug[]): {
  valid: boolean;
  missingDependencies: Record<ModuleSlug, ModuleSlug[]>;
} {
  const enabledSet = new Set(enabledSlugs);
  const missing: Record<ModuleSlug, ModuleSlug[]> = {} as any;
  let valid = true;

  for (const slug of enabledSlugs) {
    const mod = MODULE_REGISTRY[slug];
    if (mod?.dependencies) {
      const unmet = mod.dependencies.filter((dep) => !enabledSet.has(dep));
      if (unmet.length > 0) {
        missing[slug] = unmet;
        valid = false;
      }
    }
  }

  return { valid, missingDependencies: missing };
}

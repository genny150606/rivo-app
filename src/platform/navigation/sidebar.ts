import { 
  BarChart3,
  ShoppingBag,
  Boxes,
  SearchCheck,
  Receipt,
  Truck,
  Users,
  Award,
  Ticket,
  ShieldCheck,
  QrCode,
  Layers,
  LayoutGrid,
  ConciergeBell,
  BellRing,
  UtensilsCrossed,
  UserCheck,
  Settings,
  MapPin,
  Building,
  Upload,
  ScanLine,
  LucideIcon
} from 'lucide-react';
import { ModuleSlug, MODULE_REGISTRY } from '../modules/registry';
import { BusinessTypeSlug } from '../modules/registry';
import { getVertical } from '../verticals/registry';

export interface NavLinkItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  exact?: boolean;
}

export interface NavGroup {
  id: string;
  label?: string;
  items: NavLinkItem[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  ShoppingBag,
  Boxes,
  SearchCheck,
  Receipt,
  Truck,
  Users,
  Award,
  Ticket,
  ShieldCheck,
  QrCode,
  Layers,
  LayoutGrid,
  ConciergeBell,
  BellRing,
  UtensilsCrossed,
  UserCheck,
  Settings,
  MapPin,
  Building,
  Upload,
};

export function resolveSidebarNavigation(
  activeModules: Set<ModuleSlug>,
  userRole: string = 'owner',
  businessTypeSlug?: BusinessTypeSlug
): NavGroup[] {
  const groups: NavGroup[] = [];
  const vertical = businessTypeSlug ? getVertical(businessTypeSlug) : undefined;

  // 1. Waiter specialized quick-mode
  if (userRole === 'waiter') {
    return [
      {
        id: 'waiter_core',
        items: [
          {
            id: 'waiter_console',
            label: 'I Miei Tavoli',
            href: '/dashboard/waiter',
            icon: ConciergeBell,
          },
          ...(activeModules.has('table_service')
            ? [
                {
                  id: 'waiter_tables',
                  label: 'Mappa Sala',
                  href: '/dashboard/tables',
                  icon: LayoutGrid,
                },
              ]
            : []),
          ...(activeModules.has('service_calls')
            ? [
                {
                  id: 'waiter_service',
                  label: 'Chiamate Sala',
                  href: '/dashboard/service',
                  icon: BellRing,
                },
              ]
            : []),
        ],
      },
    ];
  }

  // 2. Overview / Dashboard Home
  groups.push({
    id: 'overview',
    items: [
      {
        id: 'overview_item',
        label: 'Panoramica',
        href: '/dashboard',
        icon: BarChart3,
        exact: true,
      },
    ],
  });

  // 3. Retail & Commerce: Catalogo
  if (activeModules.has('products')) {
    const label = vertical?.terminology?.catalogLabel || 'Catalogo';
    groups.push({
      id: 'catalog_group',
      label: 'Commercio',
      items: [
        {
          id: 'catalog_products',
          label,
          href: '/dashboard/products',
          icon: ShoppingBag,
        },
      ],
    });
  }

  // 4. Retail & Commerce: Magazzino & Scorte
  if (activeModules.has('inventory')) {
    const label = vertical?.terminology?.inventoryLabel || 'Magazzino';
    groups.push({
      id: 'warehouse_group',
      label: 'Scorte',
      items: [
        {
          id: 'inventory_main',
          label,
          href: '/dashboard/inventory',
          icon: Boxes,
        },
        {
          id: 'inventory_scanner',
          label: 'Scanner Mobile',
          href: '/dashboard/scanner',
          icon: ScanLine,
          badge: 'AI',
        },
        {
          id: 'inventory_check',
          label: 'Verifica Giacenza',
          href: '/dashboard/stock-check',
          icon: SearchCheck,
        },
      ],
    });
  }

  // 5. Retail & Commerce: Cassa & Vendite
  if (activeModules.has('sales')) {
    const label = vertical?.terminology?.salesLabel || 'Registro Vendite';
    groups.push({
      id: 'sales_group',
      label: 'Operazioni',
      items: [
        {
          id: 'sales_register',
          label,
          href: '/dashboard/sales',
          icon: Receipt,
        },
      ],
    });
  }

  // 6. Retail & Commerce: Fornitori & Ordini
  if (activeModules.has('suppliers')) {
    const label = vertical?.terminology?.orderLabel || 'Fornitori & Ordini';
    groups.push({
      id: 'suppliers_group',
      items: [
        {
          id: 'suppliers_main',
          label,
          href: '/dashboard/suppliers',
          icon: Truck,
        },
      ],
    });
  }

  // 7. Hospitality & Sala: Tavoli, Menu, Chiamate, Cameriere
  const hospitalityItems: NavLinkItem[] = [];
  if (activeModules.has('table_service')) {
    hospitalityItems.push({
      id: 'hosp_tables',
      label: 'Mappa Tavoli & Sala',
      href: '/dashboard/tables',
      icon: LayoutGrid,
    });
  }
  if (activeModules.has('canva_menu')) {
    hospitalityItems.push({
      id: 'hosp_menu',
      label: 'Menù Digitale',
      href: '/dashboard/menu',
      icon: UtensilsCrossed,
    });
  }
  if (activeModules.has('service_calls')) {
    hospitalityItems.push({
      id: 'hosp_service',
      label: 'Chiamate Servizio',
      href: '/dashboard/service',
      icon: BellRing,
    });
  }
  if (activeModules.has('table_service')) {
    hospitalityItems.push({
      id: 'hosp_waiter',
      label: 'Console Cameriere',
      href: '/dashboard/waiter',
      icon: ConciergeBell,
    });
  }

  if (hospitalityItems.length > 0) {
    groups.push({
      id: 'hospitality_group',
      label: 'Servizio & Sala',
      items: hospitalityItems,
    });
  }

  // 8. Customer CRM
  if (activeModules.has('crm')) {
    const label = vertical?.terminology?.customerLabel || 'Clienti';
    groups.push({
      id: 'crm_group',
      label: 'Relazioni',
      items: [
        {
          id: 'crm_leads',
          label: `${label} & Contatti`,
          href: '/dashboard/leads',
          icon: Users,
        },
      ],
    });
  }

  // 9. Marketing & Customer Engagement
  const engagementItems: NavLinkItem[] = [];
  if (activeModules.has('loyalty')) {
    engagementItems.push({
      id: 'eng_loyalty',
      label: 'Fidelity Pass Wallet',
      href: '/dashboard/loyalty',
      icon: Award,
    });
  }
  if (activeModules.has('coupons')) {
    engagementItems.push({
      id: 'eng_coupons',
      label: 'Ruota Premi & Sconti',
      href: '/dashboard/coupons',
      icon: Ticket,
    });
  }
  if (activeModules.has('review_shield')) {
    engagementItems.push({
      id: 'eng_reviews',
      label: 'Recensioni Google',
      href: '/dashboard/reviews',
      icon: ShieldCheck,
    });
  }
  if (activeModules.has('universal_hub')) {
    engagementItems.push({
      id: 'eng_hub',
      label: 'Custom Hub Studio',
      href: '/dashboard/custom-hub',
      icon: Layers,
    });
  }

  if (engagementItems.length > 0) {
    groups.push({
      id: 'engagement_group',
      label: 'Engagement',
      items: engagementItems,
    });
  }

  // 10. Analytics & Hardware
  const techItems: NavLinkItem[] = [];
  if (activeModules.has('analytics')) {
    techItems.push({
      id: 'tech_analytics',
      label: 'Analytics & Trend',
      href: '/dashboard/analytics',
      icon: BarChart3,
    });
  }
  if (activeModules.has('nfc_qr')) {
    techItems.push({
      id: 'tech_devices',
      label: 'Chip NFC & QR',
      href: '/dashboard/devices',
      icon: QrCode,
    });
  }
  if (activeModules.has('staff') && userRole !== 'employee') {
    techItems.push({
      id: 'tech_staff',
      label: 'Staff & Permessi',
      href: '/dashboard/staff',
      icon: UserCheck,
    });
  }

  if (techItems.length > 0) {
    groups.push({
      id: 'tech_group',
      label: 'Dati & Strumenti',
      items: techItems,
    });
  }

  // 11. Core Platform Config
  groups.push({
    id: 'settings_group',
    label: 'Configurazione',
    items: [
      {
        id: 'set_locations',
        label: 'Sedi & Punti Vendita',
        href: '/dashboard/locations',
        icon: MapPin,
      },
      {
        id: 'set_profile',
        label: 'Profilo Attività',
        href: '/dashboard/profile',
        icon: Building,
      },
      {
        id: 'set_settings',
        label: 'Impostazioni',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ],
  });

  return groups;
}

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

export interface ModuleDefinition {
  slug: ModuleSlug;
  name: string;
  description: string;
  category: ModuleCategory;
  defaultSort: number;
  dependencies?: ModuleSlug[];
  navPath?: string;
  iconName?: string;
}

export const MODULE_CATALOG: Record<ModuleSlug, ModuleDefinition> = {
  analytics: {
    slug: 'analytics',
    name: 'Analytics & Statistiche',
    description: 'Monitoraggio interazioni NFC/QR, conversioni e andamento visite',
    category: 'core',
    defaultSort: 10,
    navPath: '/dashboard/analytics',
    iconName: 'BarChart3'
  },
  crm: {
    slug: 'crm',
    name: 'Clienti & CRM Leads',
    description: 'Database clienti raccolti, consensi privacy e marketing',
    category: 'shared',
    defaultSort: 20,
    navPath: '/dashboard/crm',
    iconName: 'Users'
  },
  nfc_qr: {
    slug: 'nfc_qr',
    name: 'NFC & QR Devices',
    description: 'Gestione hardware, chip intelligenti da tavolo e codici QR fisici',
    category: 'shared',
    defaultSort: 30,
    navPath: '/dashboard/devices',
    iconName: 'QrCode'
  },
  review_shield: {
    slug: 'review_shield',
    name: 'Review Shield Google',
    description: 'Filtro recensioni proattivo e potenziamento reputazione a 5 stelle',
    category: 'shared',
    defaultSort: 40,
    navPath: '/dashboard/review-shield',
    iconName: 'ShieldCheck'
  },
  loyalty: {
    slug: 'loyalty',
    name: 'Fidelity Pass & Timbri',
    description: 'Tessera fedeltà digitale con premi su Apple & Google Wallet',
    category: 'shared',
    defaultSort: 50,
    navPath: '/dashboard/loyalty',
    iconName: 'Award'
  },
  coupons: {
    slug: 'coupons',
    name: 'Ruota Premi & Coupon',
    description: 'Gamification in-store con sconti interattivi ed estrazione premi',
    category: 'shared',
    defaultSort: 60,
    navPath: '/dashboard/coupons',
    iconName: 'Ticket'
  },
  smart_router: {
    slug: 'smart_router',
    name: 'Smart Router Orario',
    description: 'Instradamento automatico intelligente in base alla fascia oraria',
    category: 'shared',
    defaultSort: 70,
    navPath: '/dashboard/smart-router',
    iconName: 'Clock'
  },
  universal_hub: {
    slug: 'universal_hub',
    name: 'Custom Hub Studio',
    description: 'Micro-sito responsive con grafica personalizzata e pulsanti rapidi',
    category: 'shared',
    defaultSort: 80,
    navPath: '/dashboard/custom-hub',
    iconName: 'Layers'
  },
  table_service: {
    slug: 'table_service',
    name: 'Gestione Sala & Tavoli',
    description: 'Mappa tavoli, assegnazione camerieri di rango e visuale coperti',
    category: 'vertical',
    defaultSort: 90,
    navPath: '/dashboard/tables',
    iconName: 'LayoutGrid'
  },
  staff: {
    slug: 'staff',
    name: 'Staff & Risorse Umane',
    description: 'Inviti collaboratori, ruoli (Owner, Manager, Waiter) e turni',
    category: 'vertical',
    defaultSort: 100,
    navPath: '/dashboard/staff',
    iconName: 'UserCheck'
  },
  service_calls: {
    slug: 'service_calls',
    name: 'Chiamate & Chiamata Sala',
    description: 'Notifiche in tempo reale al cameriere, richieste conto e Telegram bot',
    category: 'vertical',
    defaultSort: 110,
    navPath: '/dashboard/service',
    iconName: 'BellRing'
  },
  canva_menu: {
    slug: 'canva_menu',
    name: 'Menù Canvas Digitale',
    description: 'Designer visivo per menu ristorante con categorie e piatti ordinabili',
    category: 'vertical',
    defaultSort: 120,
    navPath: '/dashboard/menu',
    iconName: 'UtensilsCrossed'
  },
  products: {
    slug: 'products',
    name: 'Catalogo Prodotti & Articoli',
    description: 'Gestione articoli, brand, SKU, prezzi e varianti per negozi retail',
    category: 'vertical',
    defaultSort: 130,
    navPath: '/dashboard/products',
    iconName: 'ShoppingBag'
  },
  inventory: {
    slug: 'inventory',
    name: 'Inventario & Giacenze Magazzino',
    description: 'Controllo scorte, carichi/scarichi merci e alert sottoscorta',
    category: 'vertical',
    defaultSort: 140,
    dependencies: ['products'],
    navPath: '/dashboard/inventory',
    iconName: 'Boxes'
  },
  sales: {
    slug: 'sales',
    name: 'Cassa & Registro Vendite',
    description: 'Punto cassa POS rapido, scontrini, resi, metodi di pagamento e storico',
    category: 'vertical',
    defaultSort: 145,
    dependencies: ['products'],
    navPath: '/dashboard/sales',
    iconName: 'Receipt'
  },
  suppliers: {
    slug: 'suppliers',
    name: 'Fornitori & Riordini',
    description: 'Anagrafica fornitori e tracciamento riordini merce',
    category: 'vertical',
    defaultSort: 150,
    dependencies: ['products'],
    navPath: '/dashboard/suppliers',
    iconName: 'Truck'
  }
};

export interface BusinessTypeDefinition {
  slug: BusinessTypeSlug;
  name: string;
  description: string;
  defaultModules: ModuleSlug[];
  requiredModules: ModuleSlug[];
}

export const BUSINESS_TYPE_DEFINITIONS: Record<BusinessTypeSlug, BusinessTypeDefinition> = {
  restaurant: {
    slug: 'restaurant',
    name: 'Ristorante & Bistrot',
    description: 'Esperienze culinarie complete, menu digitale, comande e servizio al tavolo',
    defaultModules: ['analytics', 'crm', 'nfc_qr', 'review_shield', 'loyalty', 'coupons', 'smart_router', 'universal_hub', 'table_service', 'staff', 'service_calls', 'canva_menu'],
    requiredModules: ['analytics', 'nfc_qr', 'universal_hub']
  },
  bar: {
    slug: 'bar',
    name: 'Bar & Caffetteria',
    description: 'Colazioni, listini rapidi, caffetteria, fidelity card e Wi-Fi',
    defaultModules: ['analytics', 'crm', 'nfc_qr', 'review_shield', 'loyalty', 'coupons', 'smart_router', 'universal_hub', 'table_service', 'staff', 'service_calls'],
    requiredModules: ['analytics', 'nfc_qr', 'universal_hub']
  },
  pizzeria: {
    slug: 'pizzeria',
    name: 'Pizzeria & Pub',
    description: 'Pizze gourmet, birre alla spina, gestione ranghi sala e sconti',
    defaultModules: ['analytics', 'crm', 'nfc_qr', 'review_shield', 'loyalty', 'coupons', 'smart_router', 'universal_hub', 'table_service', 'staff', 'service_calls', 'canva_menu'],
    requiredModules: ['analytics', 'nfc_qr', 'universal_hub']
  },
  gelateria: {
    slug: 'gelateria',
    name: 'Gelateria & Pasticceria',
    description: 'Gusti artigianali, allergeni, ruota premi e fidelizzazione clienti',
    defaultModules: ['analytics', 'crm', 'nfc_qr', 'review_shield', 'loyalty', 'coupons', 'universal_hub'],
    requiredModules: ['analytics', 'nfc_qr', 'universal_hub']
  },
  hotel: {
    slug: 'hotel',
    name: 'Hotel & Resort',
    description: 'Room directory, servizi concierge, info turistiche e promozioni interne',
    defaultModules: ['analytics', 'crm', 'nfc_qr', 'review_shield', 'universal_hub', 'staff', 'service_calls'],
    requiredModules: ['analytics', 'nfc_qr', 'universal_hub']
  },
  bb: {
    slug: 'bb',
    name: 'B&B & Guest House',
    description: 'Check-in digitale, guida della città, Wi-Fi 1-Tap e colazioni',
    defaultModules: ['analytics', 'crm', 'nfc_qr', 'review_shield', 'universal_hub'],
    requiredModules: ['analytics', 'nfc_qr', 'universal_hub']
  },
  shoe_store: {
    slug: 'shoe_store',
    name: 'Negozio di Scarpe & Calzature',
    description: 'Catalogo calzature, taglie, colori, stock di magazzino e fedeltà',
    defaultModules: ['analytics', 'crm', 'nfc_qr', 'review_shield', 'loyalty', 'universal_hub', 'products', 'inventory', 'sales', 'suppliers'],
    requiredModules: ['analytics', 'nfc_qr', 'products']
  },
  retail: {
    slug: 'retail',
    name: 'Retail & Boutique Abbigliamento',
    description: 'Catalogo moda, inventario capi, promozioni e fidelizzazione clienti',
    defaultModules: ['analytics', 'crm', 'nfc_qr', 'review_shield', 'loyalty', 'universal_hub', 'products', 'inventory', 'sales'],
    requiredModules: ['analytics', 'nfc_qr', 'products']
  },
  gym: {
    slug: 'gym',
    name: 'Palestra & Fitness Club',
    description: 'Orari corsi, pass digitali, piani abbonamento e promozioni',
    defaultModules: ['analytics', 'crm', 'nfc_qr', 'review_shield', 'loyalty', 'coupons', 'universal_hub'],
    requiredModules: ['analytics', 'nfc_qr', 'universal_hub']
  },
  medical_studio: {
    slug: 'medical_studio',
    name: 'Studio Medico & Specialistico',
    description: 'Orari visite, prenotazione appuntamenti e documentazione informativa',
    defaultModules: ['analytics', 'crm', 'nfc_qr', 'review_shield', 'universal_hub'],
    requiredModules: ['analytics', 'nfc_qr', 'universal_hub']
  },
  other: {
    slug: 'other',
    name: 'Altra Attività Commerciale',
    description: 'Configurazione flessibile e modulare per qualsiasi punto vendita fisico',
    defaultModules: ['analytics', 'crm', 'nfc_qr', 'review_shield', 'loyalty', 'universal_hub'],
    requiredModules: ['analytics', 'nfc_qr']
  }
};

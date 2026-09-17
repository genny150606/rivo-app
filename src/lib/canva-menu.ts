// ============================================================================
// CANVA MENU TYPES & PRESETS FOR RIVO SMART HUB
// High-converting, visual menu designs with table-ordering support
// ============================================================================

export type CanvaMenuStylePreset =
  | 'chalkboard'
  | 'luxury_gold'
  | 'terracotta'
  | 'clean_white'
  | 'botanical';

// Backward compatibility alias for dashboard studio
export type CanvaMenuPreset =
  | CanvaMenuStylePreset
  | 'bistrot-chalk'
  | 'fine-dining'
  | 'trattoria'
  | 'modern-editorial'
  | 'botanical-garden';

export type CanvaFontFamily =
  | 'Playfair Display'
  | 'Cinzel'
  | 'Plus Jakarta'
  | 'Inter'
  | 'Space Grotesk'
  | 'Outfit'
  | 'DM Sans'
  | 'Syne';

export interface CanvaDish {
  id: string;
  name: string;
  description: string;
  price: string | number;
  imageUrl?: string;
  popular?: boolean;
  tags?: string[];
  available?: boolean;
  // Dashboard studio compatibility aliases
  photoUrl?: string;
  isPopular?: boolean;
  isAvailable?: boolean;
}

// Type alias for dashboard compatibility
export type CanvaMenuItem = CanvaDish;

export interface CanvaMenuCategory {
  id: string;
  name: string;
  subtitle?: string;
  dishes: CanvaDish[];
  // Dashboard studio compatibility alias
  items: CanvaDish[];
}

export interface CanvaMenuConfig {
  enabled?: boolean;
  preset: CanvaMenuStylePreset | CanvaMenuPreset;
  fontFamily?: CanvaFontFamily | string;
  primaryAccent?: string;
  accentColor?: string; // Dashboard alias
  headerTitle?: string;
  headerSubtitle?: string;
  coverImageUrl?: string;
  categories: CanvaMenuCategory[];
  allowTableOrders?: boolean;
  tableOrdersEnabled?: boolean; // Dashboard alias
  orderNotice?: string;
  restaurantNotice?: string; // Dashboard alias
}

export interface PresetMetadata {
  id: CanvaMenuStylePreset | CanvaMenuPreset;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  fontFamily: string;
  defaultFont: CanvaFontFamily;
  cssFamily: string;
  primaryAccent: string;
  defaultAccent: string;
  accentColor: string;
  bgClass: string;
  cardBgClass: string;
  textClass: string;
  subtextClass: string;
  accentClass: string;
  borderClass: string;
  borderStyle: string;
  badgeBgClass: string;
  badgeTextClass: string;
  priceClass: string;
  decorStyle: {
    background: string;
    cardBackground: string;
    accentGlow: string;
    headerOverlay?: string;
    dividerColor: string;
  };
}

export type CanvaPresetDefinition = PresetMetadata;

const CHALKBOARD_PRESET: PresetMetadata = {
  id: 'chalkboard',
  name: 'Lavagna Bistrot & Gesso',
  subtitle: 'Chalkboard Rustico & Moderno',
  description: 'Effetto ardesia scura con texture gesso, font artigianali e accenti ambra calda.',
  badge: 'Bistrot Chic',
  fontFamily: 'outfit',
  defaultFont: 'Outfit',
  cssFamily: "'Outfit', 'Comic Sans MS', cursive, sans-serif",
  primaryAccent: '#f59e0b',
  defaultAccent: '#f59e0b',
  accentColor: '#f59e0b',
  bgClass: 'bg-[#181a1b]',
  cardBgClass: 'bg-[#222527]/90 border-dashed border-zinc-600/60',
  textClass: 'text-zinc-100',
  subtextClass: 'text-zinc-400',
  accentClass: 'text-amber-300',
  borderClass: 'border-white/10',
  borderStyle: 'border-2 border-zinc-600/50 shadow-inner',
  badgeBgClass: 'bg-amber-500/15',
  badgeTextClass: 'text-amber-400',
  priceClass: 'text-amber-400',
  decorStyle: {
    background: 'radial-gradient(ellipse at top, #1e2326 0%, #121415 100%)',
    cardBackground: 'rgba(28, 32, 34, 0.85)',
    accentGlow: '0 0 25px rgba(245, 158, 11, 0.18)',
    dividerColor: 'rgba(245, 158, 11, 0.3)',
  },
};

const LUXURY_GOLD_PRESET: PresetMetadata = {
  id: 'luxury_gold',
  name: 'Fine Dining & Oro',
  subtitle: 'Luxury Obsidian Gold',
  description: 'Eleganza minimalista, neri profondi ossidiana e riflessi in oro satinato lucido.',
  badge: 'Gourmet Luxury',
  fontFamily: 'playfair',
  defaultFont: 'Playfair Display',
  cssFamily: "'Playfair Display', 'Cinzel', Georgia, serif",
  primaryAccent: '#d4af37',
  defaultAccent: '#d4af37',
  accentColor: '#d4af37',
  bgClass: 'bg-[#0a0a0c]',
  cardBgClass: 'bg-[#121217]/90 border border-[#d4af37]/30 backdrop-blur-md',
  textClass: 'text-[#fbf7ee]',
  subtextClass: 'text-[#b8ad9b]',
  accentClass: 'text-[#e5c07b]',
  borderClass: 'border-[#d4af37]/25',
  borderStyle: 'border border-[#d4af37]/40 shadow-xl shadow-black/60',
  badgeBgClass: 'bg-[#d4af37]/15',
  badgeTextClass: 'text-[#eac864]',
  priceClass: 'text-[#d4af37]',
  decorStyle: {
    background: 'radial-gradient(circle at top, #1c1811 0%, #0a0907 100%)',
    cardBackground: 'rgba(20, 18, 14, 0.92)',
    accentGlow: '0 0 30px rgba(212, 175, 55, 0.22)',
    dividerColor: 'rgba(212, 175, 55, 0.4)',
  },
};

const TERRACOTTA_PRESET: PresetMetadata = {
  id: 'terracotta',
  name: 'Trattoria Tradizione & Calore',
  subtitle: 'Terracotta & Argilla Mediterranea',
  description: 'Tonalità calde della terra cotta toscana, sfumature mattone e accoglienza artigianale.',
  badge: 'Tradizione',
  fontFamily: 'dm_sans',
  defaultFont: 'DM Sans',
  cssFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif",
  primaryAccent: '#e07a5f',
  defaultAccent: '#e07a5f',
  accentColor: '#e07a5f',
  bgClass: 'bg-[#181311]',
  cardBgClass: 'bg-[#221b18]/90 border border-orange-500/15',
  textClass: 'text-orange-50',
  subtextClass: 'text-stone-400',
  accentClass: 'text-orange-400',
  borderClass: 'border-orange-500/15',
  borderStyle: 'border border-orange-600/40 rounded-2xl',
  badgeBgClass: 'bg-orange-600/15',
  badgeTextClass: 'text-orange-300',
  priceClass: 'text-orange-400',
  decorStyle: {
    background: 'radial-gradient(ellipse at 50% 0%, #291d18 0%, #130f0d 100%)',
    cardBackground: 'rgba(34, 27, 24, 0.88)',
    accentGlow: '0 0 25px rgba(224, 122, 95, 0.2)',
    dividerColor: 'rgba(224, 122, 95, 0.35)',
  },
};

const CLEAN_WHITE_PRESET: PresetMetadata = {
  id: 'clean_white',
  name: 'Modern Editorial & White',
  subtitle: 'Pure Minimal White',
  description: 'Layout pulito da rivista gastronomica, tipografia audace e contrasti netti.',
  badge: 'Contemporaneo',
  fontFamily: 'inter',
  defaultFont: 'Inter',
  cssFamily: "'Inter', 'Outfit', sans-serif",
  primaryAccent: '#0f172a',
  defaultAccent: '#0f172a',
  accentColor: '#0f172a',
  bgClass: 'bg-[#f8fafc]',
  cardBgClass: 'bg-white border border-slate-200 shadow-md',
  textClass: 'text-slate-900',
  subtextClass: 'text-slate-500',
  accentClass: 'text-slate-800',
  borderClass: 'border-slate-200',
  borderStyle: 'border border-slate-200 rounded-2xl',
  badgeBgClass: 'bg-slate-100',
  badgeTextClass: 'text-slate-800',
  priceClass: 'text-slate-900',
  decorStyle: {
    background: '#f8fafc',
    cardBackground: '#ffffff',
    accentGlow: '0 10px 30px rgba(0, 0, 0, 0.06)',
    dividerColor: 'rgba(15, 23, 42, 0.15)',
  },
};

const BOTANICAL_PRESET: PresetMetadata = {
  id: 'botanical',
  name: 'Botanical Garden & Salvia',
  subtitle: 'Smeraldo Botanico Naturale & Bio',
  description: 'Ispirazione naturale, toni salvia rilassanti e freschezza organica per cucina d’autore.',
  badge: 'Bio & Verde',
  fontFamily: 'syne',
  defaultFont: 'Plus Jakarta',
  cssFamily: "'Syne', 'Outfit', sans-serif",
  primaryAccent: '#10b981',
  defaultAccent: '#10b981',
  accentColor: '#10b981',
  bgClass: 'bg-[#0e1713]',
  cardBgClass: 'bg-[#15231c]/90 border border-emerald-700/30',
  textClass: 'text-emerald-50',
  subtextClass: 'text-emerald-300/70',
  accentClass: 'text-emerald-400',
  borderClass: 'border-emerald-500/20',
  borderStyle: 'border border-emerald-600/40 rounded-3xl',
  badgeBgClass: 'bg-emerald-500/15',
  badgeTextClass: 'text-emerald-300',
  priceClass: 'text-emerald-400',
  decorStyle: {
    background: 'radial-gradient(ellipse at top, #162b20 0%, #0a110e 100%)',
    cardBackground: 'rgba(21, 35, 28, 0.88)',
    accentGlow: '0 0 25px rgba(16, 185, 129, 0.22)',
    dividerColor: 'rgba(16, 185, 129, 0.3)',
  },
};

export const CANVA_PRESETS: Record<CanvaMenuPreset, PresetMetadata> = {
  // New canonical keys
  chalkboard: CHALKBOARD_PRESET,
  luxury_gold: LUXURY_GOLD_PRESET,
  terracotta: TERRACOTTA_PRESET,
  clean_white: CLEAN_WHITE_PRESET,
  botanical: BOTANICAL_PRESET,
  // Backward compatibility alias keys
  'bistrot-chalk': { ...CHALKBOARD_PRESET, id: 'bistrot-chalk' },
  'fine-dining': { ...LUXURY_GOLD_PRESET, id: 'fine-dining' },
  'trattoria': { ...TERRACOTTA_PRESET, id: 'trattoria' },
  'modern-editorial': { ...CLEAN_WHITE_PRESET, id: 'modern-editorial' },
  'botanical-garden': { ...BOTANICAL_PRESET, id: 'botanical-garden' },
};

export const CANVA_FONT_OPTIONS: { id: CanvaFontFamily; name: string; style: string }[] = [
  { id: 'Playfair Display', name: 'Playfair Display', style: "'Playfair Display', serif" },
  { id: 'Cinzel', name: 'Cinzel', style: "'Cinzel', serif" },
  { id: 'Plus Jakarta', name: 'Plus Jakarta', style: "'Plus Jakarta Sans', sans-serif" },
  { id: 'Inter', name: 'Inter', style: "'Inter', sans-serif" },
  { id: 'Space Grotesk', name: 'Space Grotesk', style: "'Space Grotesk', sans-serif" },
  { id: 'Outfit', name: 'Outfit', style: "'Outfit', sans-serif" },
  { id: 'DM Sans', name: 'DM Sans', style: "'DM Sans', sans-serif" },
  { id: 'Syne', name: 'Syne', style: "'Syne', sans-serif" },
];

export const ACCENT_COLOR_PALETTES = [
  { name: 'Oro Reale', color: '#D4AF37' },
  { name: 'Ambra Bistrot', color: '#F59E0B' },
  { name: 'Terracotta', color: '#E07A5F' },
  { name: 'Verde Salvia', color: '#10B981' },
  { name: 'Lime RIVO', color: '#BFFF00' },
  { name: 'Rosso Corallo', color: '#EF4444' },
  { name: 'Cielo Elettrico', color: '#38BDF8' },
  { name: 'Viola Regale', color: '#A855F7' },
];

export const POPULAR_TAG_OPTIONS = [
  'Chef Special',
  'Gluten Free',
  'Vegetariano',
  'Vegano',
  'Km 0',
  'Pesce Fresco',
  'Fatto in Casa',
  'Piccante',
  'Novità',
  'Senza Lattosio',
  'Biologico',
  'DOP',
  'Da Condividere',
  'Iconico',
] as const;

export const MENU_TAGS_PRESETS = POPULAR_TAG_OPTIONS;

export interface FoodPhotoItem {
  id: string;
  name: string;
  category: string;
  url: string;
}

const BASE_FOOD_PHOTOS: FoodPhotoItem[] = [
  // Antipasti
  {
    id: 'ant-1',
    name: 'Tagliere di Salumi Artigianali & Formaggi DOP',
    category: 'Antipasti',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ant-2',
    name: 'Tartare di Manzo Fassona con Tuorlo d’Uovo',
    category: 'Antipasti',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ant-3',
    name: 'Bruschettoni al Pomodoro e Basilico Fresco',
    category: 'Antipasti',
    url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ant-4',
    name: 'Burrata Pugliese con Crudo e Datterini',
    category: 'Antipasti',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22d57?auto=format&fit=crop&w=800&q=80',
  },
  // Primi
  {
    id: 'primi-1',
    name: 'Spaghetti alla Carbonara Tradizionale',
    category: 'Primi',
    url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'primi-2',
    name: 'Ravioli Artigianali Burrata e Limone',
    category: 'Primi',
    url: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'primi-3',
    name: 'Risotto Carnaroli ai Funghi Porcini e Tartufo',
    category: 'Primi',
    url: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'primi-4',
    name: 'Lasagna Emiliana della Tradizione',
    category: 'Primi',
    url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80',
  },
  // Secondi
  {
    id: 'sec-1',
    name: 'Tagliata di Black Angus al Rosmarino',
    category: 'Secondi',
    url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sec-2',
    name: 'Filetto di Spigola in Crosta di Patate',
    category: 'Secondi',
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sec-3',
    name: 'Polpo Arrostito su Crema di Patate',
    category: 'Secondi',
    url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sec-4',
    name: 'Pizza Gourmet Fior di Latte & Tartufo',
    category: 'Secondi',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  },
  // Dolci
  {
    id: 'dolci-1',
    name: 'Tiramisù Tradizionale con Savoiardi al Caffè',
    category: 'Dolci',
    url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dolci-2',
    name: 'Cheesecake al Caramello Salato',
    category: 'Dolci',
    url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dolci-3',
    name: 'Cannolo Siciliano con Ricotta di Pecora',
    category: 'Dolci',
    url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
  },
  // Bevande & Cantina
  {
    id: 'bev-1',
    name: 'Calice Chianti Classico DOCG Riserva',
    category: 'Bevande',
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bev-2',
    name: 'Franciacorta Brut DOCG Perlage',
    category: 'Bevande',
    url: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bev-3',
    name: 'Signature Spritz & Cocktail Artigianali',
    category: 'Bevande',
    url: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=800&q=80',
  },
];

export type FoodPhotosCatalogType = FoodPhotoItem[] & {
  tagliere: string;
  tartare: string;
  bruschetta: string;
  burrata: string;
  carbonara: string;
  ravioli: string;
  risotto: string;
  lasagna: string;
  tagliata: string;
  pesce: string;
  polpo: string;
  pizza: string;
  tiramisu: string;
  cheesecake: string;
  cannolo: string;
  vinoRosso: string;
  bollicine: string;
  cocktail: string;
  coverHero: string;
};

export const FOOD_PHOTOS_CATALOG: FoodPhotosCatalogType = Object.assign(
  [...BASE_FOOD_PHOTOS],
  {
    tagliere: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    tartare: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    bruschetta: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=800&q=80',
    burrata: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22d57?auto=format&fit=crop&w=800&q=80',
    carbonara: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
    ravioli: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?auto=format&fit=crop&w=800&q=80',
    risotto: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80',
    lasagna: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80',
    tagliata: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
    pesce: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    polpo: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    tiramisu: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
    cheesecake: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
    cannolo: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
    vinoRosso: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
    bollicine: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?auto=format&fit=crop&w=800&q=80',
    cocktail: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=800&q=80',
    coverHero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  }
);

export function getDefaultCanvaMenuConfig(): CanvaMenuConfig {
  const antipastiDishes: CanvaDish[] = [
    {
      id: 'dish-ant-1',
      name: 'Tagliere di Salumi & Formaggi DOP',
      description: 'Crudo di Parma 24 mesi, pecorino toscano di fossa, confettura artigianale di fichi e focaccia calda all’origano.',
      price: '14,00 €',
      imageUrl: FOOD_PHOTOS_CATALOG.tagliere,
      photoUrl: FOOD_PHOTOS_CATALOG.tagliere,
      popular: true,
      isPopular: true,
      tags: ['Tradizione', 'Da Condividere', 'DOP'],
      available: true,
      isAvailable: true,
    },
    {
      id: 'dish-ant-2',
      name: 'Tartare di Manzo Fassona Piemontese',
      description: 'Battuta al coltello con senape in grani di Digione, tuorlo d’uovo marinato, fiocchi di sale Maldon e cialda croccante.',
      price: '15,00 €',
      imageUrl: FOOD_PHOTOS_CATALOG.tartare,
      photoUrl: FOOD_PHOTOS_CATALOG.tartare,
      popular: false,
      isPopular: false,
      tags: ['Gourmet', 'Gluten Free', 'Km 0'],
      available: true,
      isAvailable: true,
    },
    {
      id: 'dish-ant-3',
      name: 'Bruschettoni Pomodorino Giallo & Bufala',
      description: 'Pane casereccio lievitato 48h con datterino giallo confit, bocconcini di mozzarella di bufala campana e basilico fresco.',
      price: '9,50 €',
      imageUrl: FOOD_PHOTOS_CATALOG.bruschetta,
      photoUrl: FOOD_PHOTOS_CATALOG.bruschetta,
      popular: false,
      isPopular: false,
      tags: ['Vegetariano', 'Fatto in Casa'],
      available: true,
      isAvailable: true,
    },
  ];

  const primiDishes: CanvaDish[] = [
    {
      id: 'dish-pri-1',
      name: 'Spaghettone Artigianale alla Carbonara',
      description: 'Guanciale croccante di Amatrice, pecorino romano DOP selezione De Roma, tuorlo d’uovo bio e pepe nero di Rimbàs tostato.',
      price: '13,50 €',
      imageUrl: FOOD_PHOTOS_CATALOG.carbonara,
      photoUrl: FOOD_PHOTOS_CATALOG.carbonara,
      popular: true,
      isPopular: true,
      tags: ['Chef Special', 'Iconico', 'Fatto in Casa'],
      available: true,
      isAvailable: true,
    },
    {
      id: 'dish-pri-2',
      name: 'Ravioli di Burrata Pugliese al Limone',
      description: 'Pasta all’uovo fatta in casa ripiena di burrata di Andria, datterino rosso confit e zeste di limone bio di Sorrento.',
      price: '14,50 €',
      imageUrl: FOOD_PHOTOS_CATALOG.ravioli,
      photoUrl: FOOD_PHOTOS_CATALOG.ravioli,
      popular: false,
      isPopular: false,
      tags: ['Vegetariano', 'Fatto in Casa'],
      available: true,
      isAvailable: true,
    },
    {
      id: 'dish-pri-3',
      name: 'Risotto ai Funghi Porcini & Tartufo Nero',
      description: 'Riso Carnaroli riserva mantecato al Parmigiano Reggiano 30 mesi Vacche Rosse e lamelle fresche di tartufo estivo.',
      price: '16,00 €',
      imageUrl: FOOD_PHOTOS_CATALOG.risotto,
      photoUrl: FOOD_PHOTOS_CATALOG.risotto,
      popular: true,
      isPopular: true,
      tags: ['Gluten Free', 'Km 0'],
      available: true,
      isAvailable: true,
    },
  ];

  const secondiDishes: CanvaDish[] = [
    {
      id: 'dish-sec-1',
      name: 'Tagliata di Black Angus al Rosmarino',
      description: 'Tagliata tenera cotta su brace di faggio, fiocchi di sale Maldon affumicato e patate novelle al forno con rosmarino.',
      price: '19,50 €',
      imageUrl: FOOD_PHOTOS_CATALOG.tagliata,
      photoUrl: FOOD_PHOTOS_CATALOG.tagliata,
      popular: true,
      isPopular: true,
      tags: ['Black Angus', 'Gluten Free'],
      available: true,
      isAvailable: true,
    },
    {
      id: 'dish-sec-2',
      name: 'Filetto di Spigola in Crosta di Patate',
      description: 'Spigola fresca pescata all’amo in crosta dorata di patate, vellutata di zucchine e mentuccia selvatica.',
      price: '18,50 €',
      imageUrl: FOOD_PHOTOS_CATALOG.pesce,
      photoUrl: FOOD_PHOTOS_CATALOG.pesce,
      popular: false,
      isPopular: false,
      tags: ['Pesce Fresco', 'Gluten Free'],
      available: true,
      isAvailable: true,
    },
    {
      id: 'dish-sec-3',
      name: 'Pizza Gourmet Fior di Latte & Tartufo',
      description: 'Impasto a fermentazione naturale 72h, fior di latte di Agerola, crema di tartufo bianco e funghi chiodini saltati.',
      price: '14,00 €',
      imageUrl: FOOD_PHOTOS_CATALOG.pizza,
      photoUrl: FOOD_PHOTOS_CATALOG.pizza,
      popular: false,
      isPopular: false,
      tags: ['Fatto in Casa', 'Vegetariano'],
      available: true,
      isAvailable: true,
    },
  ];

  const dolciDishes: CanvaDish[] = [
    {
      id: 'dish-dol-1',
      name: 'Tiramisù Tradizionale della Casa',
      description: 'Savoiardi sardi bagnati al caffè espresso 100% Arabica, crema densa al mascarpone fresca e spolverata di cacao amaro.',
      price: '6,50 €',
      imageUrl: FOOD_PHOTOS_CATALOG.tiramisu,
      photoUrl: FOOD_PHOTOS_CATALOG.tiramisu,
      popular: true,
      isPopular: true,
      tags: ['Fatto in Casa', 'Iconico'],
      available: true,
      isAvailable: true,
    },
    {
      id: 'dish-dol-2',
      name: 'Cheesecake al Caramello Salato & Noci Pecan',
      description: 'Base croccante al burro di Bretagna, crema al formaggio vellutata e glassa calda al caramello salato.',
      price: '7,00 €',
      imageUrl: FOOD_PHOTOS_CATALOG.cheesecake,
      photoUrl: FOOD_PHOTOS_CATALOG.cheesecake,
      popular: false,
      isPopular: false,
      tags: ['Fatto in Casa'],
      available: true,
      isAvailable: true,
    },
  ];

  const bevandeDishes: CanvaDish[] = [
    {
      id: 'dish-bev-1',
      name: 'Calice Chianti Classico DOCG (Riserva)',
      description: 'Rosso toscano strutturato ed elegante, con note di frutti di bosco e vaniglia.',
      price: '6,50 €',
      imageUrl: FOOD_PHOTOS_CATALOG.vinoRosso,
      photoUrl: FOOD_PHOTOS_CATALOG.vinoRosso,
      popular: false,
      isPopular: false,
      tags: ['Carta Vini', 'DOP'],
      available: true,
      isAvailable: true,
    },
    {
      id: 'dish-bev-2',
      name: 'Franciacorta Brut DOCG al Calice',
      description: 'Metodo classico italiano d’eccellenza, perlage finissimo e sentori di crosta di pane dorata.',
      price: '7,50 €',
      imageUrl: FOOD_PHOTOS_CATALOG.bollicine,
      photoUrl: FOOD_PHOTOS_CATALOG.bollicine,
      popular: true,
      isPopular: true,
      tags: ['Bollicine', 'DOP'],
      available: true,
      isAvailable: true,
    },
    {
      id: 'dish-bev-3',
      name: 'Signature Spritz & Cocktail Botanici',
      description: 'Aperol o Campari Spritz tradizionale servito con scorza d’arancia bio e oliva ascolana gigante.',
      price: '6,50 €',
      imageUrl: FOOD_PHOTOS_CATALOG.cocktail,
      photoUrl: FOOD_PHOTOS_CATALOG.cocktail,
      popular: true,
      isPopular: true,
      tags: ['Aperitivo'],
      available: true,
      isAvailable: true,
    },
  ];

  return {
    enabled: true,
    preset: 'chalkboard',
    fontFamily: 'Outfit',
    primaryAccent: '#f59e0b',
    accentColor: '#f59e0b',
    headerTitle: 'Menù & Esperienza Gastronomica',
    headerSubtitle: 'Tradizione culinaria italiana & materie prime d’eccellenza',
    coverImageUrl: FOOD_PHOTOS_CATALOG.coverHero,
    allowTableOrders: true,
    tableOrdersEnabled: true,
    orderNotice: 'I piatti selezionati verranno inoltrati direttamente allo staff di sala e cucina.',
    restaurantNotice: 'I piatti selezionati verranno inoltrati direttamente allo staff di sala e cucina.',
    categories: [
      {
        id: 'cat-antipasti',
        name: 'Antipasti & Sfizi',
        subtitle: 'Sapori autentici per iniziare al meglio',
        dishes: antipastiDishes,
        items: antipastiDishes,
      },
      {
        id: 'cat-primi',
        name: 'Primi Piatti d’Autore',
        subtitle: 'Pasta fresca tirata a mano & risotti mantecati',
        dishes: primiDishes,
        items: primiDishes,
      },
      {
        id: 'cat-secondi',
        name: 'Secondi di Brace & Mare',
        subtitle: 'Cotture lente e sapori decisi',
        dishes: secondiDishes,
        items: secondiDishes,
      },
      {
        id: 'cat-dolci',
        name: 'Dessert Artigianali',
        subtitle: 'La dolce conclusione preparata ogni giorno',
        dishes: dolciDishes,
        items: dolciDishes,
      },
      {
        id: 'cat-bevande',
        name: 'Vini, Bollicine & Cocktail',
        subtitle: 'Selezione della nostra cantina',
        dishes: bevandeDishes,
        items: bevandeDishes,
      },
    ],
  };
}

import type { CSSProperties } from 'react';
import { BusinessCategory } from './types';
import { DEFAULT_HUB_COLOR } from './palettes';

export type HubFontFamily = 'outfit' | 'inter' | 'playfair' | 'syne' | 'jakarta' | 'cinzel' | 'dm_sans' | 'space_grotesk' | 'plus_jakarta';
export type HubThemeMode = 'dark' | 'midnight' | 'warm_charcoal' | 'minimal_light';
export type HubCardStyle = 'glass' | 'solid' | 'bordered' | 'neon';

export interface HubFontOption {
  id: HubFontFamily;
  name: string;
  category: string;
  cssFamily: string;
  sample: string;
}

export const HUB_FONT_OPTIONS: HubFontOption[] = [
  {
    id: 'outfit',
    name: 'Outfit',
    category: 'Moderno & Pulito',
    cssFamily: "'Outfit', var(--font-geist-sans), sans-serif",
    sample: 'Gusto & Design Moderno',
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'Neutro & Tecnico',
    cssFamily: "'Inter', var(--font-geist-sans), sans-serif",
    sample: 'Esperienza Chiara e Precisa',
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    category: 'Luxury & Gourmet',
    cssFamily: "'Playfair Display', Georgia, serif",
    sample: 'Raffinatezza ed Eleganza',
  },
  {
    id: 'syne',
    name: 'Syne',
    category: 'Trendy & Nightlife',
    cssFamily: "'Syne', var(--font-geist-sans), sans-serif",
    sample: 'Vibes & Cocktail Bar',
  },
  {
    id: 'space_grotesk',
    name: 'Space Grotesk',
    category: 'Cyberpunk & Tech',
    cssFamily: "'Space Grotesk', 'Syne', var(--font-geist-sans), sans-serif",
    sample: 'Futuro & Innovazione Digitale',
  },
  {
    id: 'jakarta',
    name: 'Plus Jakarta',
    category: 'Minimal & Fresco',
    cssFamily: "'Plus Jakarta Sans', var(--font-geist-sans), sans-serif",
    sample: 'Bistrot Contemporaneo',
  },
  {
    id: 'plus_jakarta',
    name: 'Plus Jakarta',
    category: 'Minimal & Fresco',
    cssFamily: "'Plus Jakarta Sans', var(--font-geist-sans), sans-serif",
    sample: 'Bistrot Contemporaneo',
  },
  {
    id: 'cinzel',
    name: 'Cinzel',
    category: 'Heritage & Nobile',
    cssFamily: "'Cinzel', Times New Roman, serif",
    sample: 'Tradizione d’Autore',
  },
  {
    id: 'dm_sans',
    name: 'DM Sans',
    category: 'Caldo & Amichevole',
    cssFamily: "'DM Sans', var(--font-geist-sans), sans-serif",
    sample: 'Ospitalità & Sapori',
  },
];

export interface HubThemeOption {
  id: HubThemeMode;
  name: string;
  bgHex: string;
  cardBgHex: string;
  textHex: string;
  borderHex: string;
}

export const HUB_THEME_OPTIONS: HubThemeOption[] = [
  {
    id: 'dark',
    name: 'Onyx Deep (Scuro)',
    bgHex: '#0c0f0d',
    cardBgHex: '#161816',
    textHex: '#ffffff',
    borderHex: 'rgba(255, 255, 255, 0.08)',
  },
  {
    id: 'midnight',
    name: 'Midnight Navy (Notte)',
    bgHex: '#070b14',
    cardBgHex: '#0f172a',
    textHex: '#ffffff',
    borderHex: 'rgba(56, 189, 248, 0.12)',
  },
  {
    id: 'warm_charcoal',
    name: 'Warm Charcoal (Bistrot)',
    bgHex: '#141210',
    cardBgHex: '#1c1917',
    textHex: '#ffffff',
    borderHex: 'rgba(245, 158, 11, 0.12)',
  },
  {
    id: 'minimal_light',
    name: 'Ivory Minimal (Chiaro)',
    bgHex: '#f8fafc',
    cardBgHex: '#ffffff',
    textHex: '#0f172a',
    borderHex: 'rgba(15, 23, 42, 0.10)',
  },
];

export interface HubCardStyleOption {
  id: HubCardStyle;
  name: string;
  description: string;
  previewClass: string;
}

export const HUB_CARD_STYLE_OPTIONS: HubCardStyleOption[] = [
  {
    id: 'glass',
    name: 'Vetro Glassmorphism',
    description: 'Effetto satinato trasparente e moderno con sfocatura di fondo',
    previewClass: 'backdrop-blur-md bg-white/[0.04] border border-white/10 shadow-lg',
  },
  {
    id: 'solid',
    name: 'Solido & Deciso',
    description: 'Sfondo compatto e scuro per la massima leggibilità immediata',
    previewClass: 'bg-[#181b19] border border-white/5 shadow-md',
  },
  {
    id: 'bordered',
    name: 'Bordo Satinato',
    description: 'Contorni definiti e sottili per un look geometrico e minimale',
    previewClass: 'bg-[#121413] border-2 border-white/20 shadow',
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    description: 'Bagliore soffuso sul perimetro con l’accento cromatico del locale',
    previewClass: 'bg-[#141715] border border-white/10 shadow-[0_0_15px_rgba(191,255,0,0.15)]',
  },
];

export type HubModuleId =
  | 'menu'
  | 'service'
  | 'sommelier'
  | 'wifi'
  | 'wheel'
  | 'loyalty'
  | 'reviews'
  | 'guide'
  | 'instagram'
  | 'whatsapp'
  | 'custom_cta'
  | (string & {});

export interface HubModuleConfig {
  id: HubModuleId;
  enabled: boolean;
  order: number;
  title: string;
  subtitle: string;
  badge?: string;
  customUrl?: string;
  // Bento Grid & Custom Modules Enhancements
  isCustom?: boolean;
  iconName?: string;
  actionType?: 'link' | 'modal';
  modalTitle?: string;
  modalContent?: string;
  colSpan?: 1 | 2; // 1 = standard half, 2 = full width bento span
  cardColor?: string;
}

export const ALL_HUB_MODULE_TEMPLATES: Omit<HubModuleConfig, 'order'>[] = [
  { id: 'menu', enabled: true, title: 'Menù Digitale', subtitle: 'Piatti, prezzi & vini', badge: 'Carta', colSpan: 1 },
  { id: 'service', enabled: true, title: 'Chiama Sala', subtitle: 'Cameriere o conto', badge: '1-Tap', colSpan: 1 },
  { id: 'sommelier', enabled: true, title: 'AI Sommelier', subtitle: 'Consigli abbinamento vini', badge: 'AI', colSpan: 1 },
  { id: 'wifi', enabled: true, title: 'Wi-Fi Ospiti', subtitle: 'Accesso rapido 1-tap', badge: 'Gratis', colSpan: 1 },
  { id: 'wheel', enabled: true, title: 'Ruota Premi', subtitle: 'Gira & vinci un dolce/caffè', badge: 'Bonus', colSpan: 1 },
  { id: 'loyalty', enabled: true, title: 'Fidelity Pass', subtitle: 'Timbri digitali al tavolo', badge: 'Fedeltà', colSpan: 1 },
  { id: 'reviews', enabled: true, title: 'Lascia Recensione', subtitle: 'Valuta l’esperienza su Google', badge: '5.0', colSpan: 2 },
  { id: 'guide', enabled: false, title: 'Guida Locale', subtitle: 'Cosa vedere & fare nei dintorni', badge: 'Consigli', colSpan: 1 },
  { id: 'instagram', enabled: false, title: 'Canale Instagram', subtitle: 'Foto, storie & novità', badge: '@Social', colSpan: 1 },
  { id: 'whatsapp', enabled: false, title: 'Chat WhatsApp', subtitle: 'Scrivi allo staff', badge: 'Chat', colSpan: 1 },
  { id: 'custom_cta', enabled: false, title: 'Offerta Speciale', subtitle: 'Scopri la promozione attiva', badge: 'Promo', colSpan: 2 },
];

export interface HubHeroConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  badgeText?: string;
  destinationType: 'in_app' | 'external';
  externalUrl?: string;
}

export interface HubConfig {
  fontFamily: HubFontFamily;
  themeMode: HubThemeMode;
  cardStyle: HubCardStyle;
  primaryColor: string;
  accentGlow: boolean;
  tableBadgeLabel: string; // e.g. "Tavolo Connesso", "La tua Postazione", "Camera"
  tableLiveTag: string; // e.g. "NFC LIVE", "SMART HUB"
  hero: HubHeroConfig;
  modules: HubModuleConfig[];
  footerNote?: string;
  // Visual Atmosphere & Custom Background
  bgType?: 'theme' | 'image' | 'gradient';
  bgImageUrl?: string;
  bgBlur?: number; // 0-20px
  bgOverlayOpacity?: number; // 0-90% dark overlay for guaranteed WCAG legibility
  bgGradientStops?: [string, string];
  borderRadius?: 'none' | 'md' | '2xl' | '3xl' | 'full';
  // Advanced Customization Controls
  cardDensity?: 'compact' | 'comfortable';
  buttonGlow?: boolean;
  showBottomDock?: boolean;
}

export function getDefaultModules(category: BusinessCategory = 'restaurant'): HubModuleConfig[] {
  switch (category) {
    case 'hotel':
    case 'bnb':
      return [
        {
          id: 'service',
          enabled: true,
          order: 1,
          title: 'Reception H24',
          subtitle: 'Assistenza & Richieste',
          badge: 'Staff',
        },
        {
          id: 'wifi',
          enabled: true,
          order: 2,
          title: 'Wi-Fi Ospiti',
          subtitle: 'Accesso Rapido 1-Tap',
          badge: 'Gratis',
        },
        {
          id: 'guide',
          enabled: true,
          order: 3,
          title: 'Guida Locale',
          subtitle: 'Cosa vedere & fare',
          badge: 'Consigli',
        },
        {
          id: 'reviews',
          enabled: true,
          order: 4,
          title: 'Lascia Recensione',
          subtitle: 'Valuta il soggiorno',
          badge: 'Google',
        },
        {
          id: 'whatsapp',
          enabled: true,
          order: 5,
          title: 'Chat WhatsApp',
          subtitle: 'Scrivi alla Concierge',
        },
        {
          id: 'wheel',
          enabled: false,
          order: 6,
          title: 'Ruota Premi',
          subtitle: 'Gira e vinci',
        },
      ];

    case 'beach_club':
      return [
        {
          id: 'service',
          enabled: true,
          order: 1,
          title: 'Ordina all’Ombrellone',
          subtitle: 'Cameriere al lettino',
          badge: 'Servizio',
        },
        {
          id: 'menu',
          enabled: true,
          order: 2,
          title: 'Menù Beach & Cocktails',
          subtitle: 'Pranzo & Drink estivi',
        },
        {
          id: 'wifi',
          enabled: true,
          order: 3,
          title: 'Wi-Fi Spiaggia',
          subtitle: 'Connessione al lido',
          badge: '1-Tap',
        },
        {
          id: 'wheel',
          enabled: true,
          order: 4,
          title: 'Ruota del Lido',
          subtitle: 'Vinci drink e gadget',
          badge: 'Premio',
        },
        {
          id: 'loyalty',
          enabled: true,
          order: 5,
          title: 'Beach Fidelity Pass',
          subtitle: 'Timbri e vantaggi',
        },
        {
          id: 'reviews',
          enabled: true,
          order: 6,
          title: 'Recensisci il Lido',
          subtitle: 'Supportaci su Google',
        },
      ];

    case 'bar':
    case 'nightlife':
      return [
        {
          id: 'menu',
          enabled: true,
          order: 1,
          title: 'Drink List & Cocktail',
          subtitle: 'Selezione distillati',
          badge: 'Signature',
        },
        {
          id: 'service',
          enabled: true,
          order: 2,
          title: 'Chiama al Bancone',
          subtitle: 'Ordina o chiedi il conto',
        },
        {
          id: 'sommelier',
          enabled: true,
          order: 3,
          title: 'AI Cocktail Finder',
          subtitle: 'Trova il drink ideale',
          badge: 'AI',
        },
        {
          id: 'wheel',
          enabled: true,
          order: 4,
          title: 'Ruota dei Drink',
          subtitle: 'Vinci shot omaggio',
          badge: 'Premio',
        },
        {
          id: 'wifi',
          enabled: true,
          order: 5,
          title: 'Wi-Fi del Locale',
          subtitle: 'Accesso immediato',
        },
        {
          id: 'loyalty',
          enabled: true,
          order: 6,
          title: 'Cocktail Club Pass',
          subtitle: 'Timbri & premi',
        },
      ];

    case 'restaurant':
    case 'pizzeria':
    default:
      return [
        {
          id: 'service',
          enabled: true,
          order: 1,
          title: 'Chiama Sala',
          subtitle: 'Cameriere o conto',
          badge: '1-Tap',
        },
        {
          id: 'sommelier',
          enabled: true,
          order: 2,
          title: 'AI Sommelier',
          subtitle: 'Consigli abbinamento vini',
          badge: 'AI',
        },
        {
          id: 'wifi',
          enabled: true,
          order: 3,
          title: 'Wi-Fi Ospiti',
          subtitle: 'Accesso rapido 1-tap',
          badge: 'Free',
        },
        {
          id: 'wheel',
          enabled: true,
          order: 4,
          title: 'Ruota Premi',
          subtitle: 'Gira & vinci un dolce/caffè',
          badge: 'Bonus',
        },
        {
          id: 'loyalty',
          enabled: true,
          order: 5,
          title: 'Fidelity Pass',
          subtitle: 'Timbri digitali al tavolo',
          badge: 'Fedeltà',
        },
        {
          id: 'reviews',
          enabled: true,
          order: 6,
          title: 'Lascia Recensione',
          subtitle: 'Valuta l’esperienza su Google',
          badge: '5.0',
        },
      ];
  }
}

export function getDefaultHubConfig(category: BusinessCategory = 'restaurant'): HubConfig {
  const isHotel = category === 'hotel' || category === 'bnb';
  const isBeach = category === 'beach_club';

  return {
    fontFamily: isHotel ? 'playfair' : 'outfit',
    themeMode: 'dark',
    cardStyle: 'glass',
    primaryColor: DEFAULT_HUB_COLOR,
    accentGlow: true,
    tableBadgeLabel: isHotel ? 'Camera / Suite' : isBeach ? 'Ombrellone' : 'Tavolo Connesso',
    tableLiveTag: 'NFC LIVE',
    hero: {
      enabled: true,
      title: isHotel ? 'Room Service & Info' : 'Menù Digitale',
      subtitle: isHotel ? 'Colazione & Servizi in camera' : 'Piatti, prezzi & vini del giorno',
      badgeText: 'In Evidenza',
      destinationType: 'in_app',
    },
    modules: getDefaultModules(category),
    footerNote: 'Tocca il simbolo NFC o inquadra il QR con la fotocamera',
  };
}

export function mergeHubConfig(
  rawConfig: unknown,
  category: BusinessCategory = 'restaurant',
  legacyFields?: {
    primaryColor?: string | null;
    customCtaLabel?: string | null;
    customCtaUrl?: string | null;
    lunchDestinationUrl?: string | null;
  }
): HubConfig {
  const defaults = getDefaultHubConfig(category);

  if (!rawConfig || typeof rawConfig !== 'object') {
    // Fill from legacy fields if present
    const res = { ...defaults };
    if (legacyFields?.primaryColor) {
      res.primaryColor = legacyFields.primaryColor;
    }
    if (legacyFields?.lunchDestinationUrl) {
      res.hero.destinationType = 'external';
      res.hero.externalUrl = legacyFields.lunchDestinationUrl;
    }
    if (legacyFields?.customCtaLabel) {
      res.hero.title = legacyFields.customCtaLabel;
    }
    return res;
  }

  const conf = rawConfig as Partial<HubConfig>;
  const mergedModules: HubModuleConfig[] = [];
  const defaultList = defaults.modules;
  const savedModules: HubModuleConfig[] = Array.isArray(conf.modules) ? conf.modules : [];

  // Match saved modules or supply defaults
  const seenIds = new Set<string>();
  for (const saved of savedModules) {
    if (saved && saved.id) {
      const def = defaultList.find((m) => m.id === saved.id);
      mergedModules.push({
        id: saved.id,
        enabled: saved.enabled ?? def?.enabled ?? true,
        order: typeof saved.order === 'number' ? saved.order : mergedModules.length + 1,
        title: saved.title || def?.title || saved.id,
        subtitle: saved.subtitle ?? def?.subtitle ?? '',
        badge: saved.badge ?? def?.badge ?? '',
        customUrl: saved.customUrl || def?.customUrl || '',
        isCustom: saved.isCustom ?? false,
        iconName: saved.iconName || 'Sparkles',
        actionType: saved.actionType || 'link',
        modalTitle: saved.modalTitle || saved.title,
        modalContent: saved.modalContent || '',
        colSpan: saved.colSpan ?? def?.colSpan ?? 1,
        cardColor: saved.cardColor,
      });
      seenIds.add(saved.id);
    }
  }

  // Add any default modules missing from saved
  for (const def of defaultList) {
    if (!seenIds.has(def.id)) {
      mergedModules.push({
        ...def,
        colSpan: def.colSpan ?? 1,
        order: mergedModules.length + 1,
      });
      seenIds.add(def.id);
    }
  }

  // Add any remaining modules from ALL_HUB_MODULE_TEMPLATES as disabled
  for (const tpl of ALL_HUB_MODULE_TEMPLATES) {
    if (!seenIds.has(tpl.id)) {
      mergedModules.push({
        ...tpl,
        enabled: false,
        colSpan: tpl.colSpan ?? 1,
        order: mergedModules.length + 1,
      });
      seenIds.add(tpl.id);
    }
  }

  // Sort by order ascending
  mergedModules.sort((a, b) => a.order - b.order);

  return {
    fontFamily: conf.fontFamily || defaults.fontFamily,
    themeMode: conf.themeMode || defaults.themeMode,
    cardStyle: conf.cardStyle || defaults.cardStyle,
    primaryColor:
      conf.primaryColor || legacyFields?.primaryColor || defaults.primaryColor,
    accentGlow: conf.accentGlow ?? defaults.accentGlow,
    tableBadgeLabel:
      conf.tableBadgeLabel || defaults.tableBadgeLabel,
    tableLiveTag: conf.tableLiveTag || defaults.tableLiveTag,
    hero: {
      enabled: conf.hero?.enabled ?? defaults.hero.enabled,
      title:
        conf.hero?.title ||
        legacyFields?.customCtaLabel ||
        defaults.hero.title,
      subtitle: conf.hero?.subtitle || defaults.hero.subtitle,
      badgeText: conf.hero?.badgeText || defaults.hero.badgeText,
      destinationType:
        conf.hero?.destinationType ||
        (legacyFields?.lunchDestinationUrl ? 'external' : defaults.hero.destinationType),
      externalUrl:
        conf.hero?.externalUrl || legacyFields?.lunchDestinationUrl || '',
    },
    modules: mergedModules,
    footerNote: conf.footerNote ?? defaults.footerNote,
    // Visual Atmosphere & Custom Background
    bgType: conf.bgType || 'theme',
    bgImageUrl: conf.bgImageUrl || '',
    bgBlur: typeof conf.bgBlur === 'number' ? conf.bgBlur : 8,
    bgOverlayOpacity: typeof conf.bgOverlayOpacity === 'number' ? conf.bgOverlayOpacity : 50,
    bgGradientStops: conf.bgGradientStops || ['#0c0f0d', '#1a241b'],
    borderRadius: conf.borderRadius || '2xl',
    // Advanced Customization Controls
    cardDensity: conf.cardDensity || 'comfortable',
    buttonGlow: conf.buttonGlow ?? true,
    showBottomDock: conf.showBottomDock ?? true,
  };
}

export function resetToDefaultHubConfig(category: BusinessCategory = 'restaurant'): HubConfig {
  return JSON.parse(JSON.stringify(getDefaultHubConfig(category)));
}

export function getBorderRadiusClass(radius?: HubConfig['borderRadius']): string {
  switch (radius) {
    case 'none':
      return 'rounded-none';
    case 'md':
      return 'rounded-xl';
    case '2xl':
      return 'rounded-2xl';
    case '3xl':
      return 'rounded-3xl';
    case 'full':
      return 'rounded-full';
    default:
      return 'rounded-2xl';
  }
}

export function getBorderRadiusStyle(radius?: HubConfig['borderRadius']): CSSProperties {
  switch (radius) {
    case 'none':
      return { borderRadius: '0px' };
    case 'md':
      return { borderRadius: '12px' };
    case '2xl':
      return { borderRadius: '20px' };
    case '3xl':
      return { borderRadius: '28px' };
    case 'full':
      return { borderRadius: '9999px' };
    default:
      return { borderRadius: '20px' };
  }
}

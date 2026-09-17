import { NextRequest, NextResponse } from 'next/server';
import {
  HubConfig,
  HubFontFamily,
  HubThemeMode,
  HubCardStyle,
  HubModuleConfig,
  mergeHubConfig,
  getDefaultHubConfig,
} from '@/lib/hub-config';
import { BusinessCategory } from '@/lib/types';
import { sanitizeString } from '@/lib/security';

interface HubArchitectRequestBody {
  prompt: string;
  businessName?: string;
  category?: BusinessCategory | string;
  currentConfig?: Partial<HubConfig>;
}

interface HeuristicProfile {
  primaryColor: string;
  themeMode: HubThemeMode;
  fontFamily: HubFontFamily;
  cardStyle: HubCardStyle;
  borderRadius: 'none' | 'md' | '2xl' | '3xl' | 'full';
  bgType: 'theme' | 'image' | 'gradient';
  bgImageUrl: string;
  bgBlur: number;
  bgOverlayOpacity: number;
  bgGradientStops: [string, string];
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  tableBadgeLabel: string;
  tableLiveTag: string;
  conceptExplanation: string;
  customModules: {
    id: string;
    title: string;
    subtitle: string;
    badge?: string;
    colSpan: 1 | 2;
    iconName?: string;
    enabled: boolean;
  }[];
}

// Curated high-resolution Unsplash textures specifically selected for hospitality atmospheres
const TEXTURE_ASSETS = {
  luxury: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop', // Dark polished marble with gold veins
  wine: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1600&auto=format&fit=crop', // Barrels & wine cellar
  nightlife: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop', // Vibrant neon club atmosphere
  rustic: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1600&auto=format&fit=crop', // Warm rustic wooden tavern
  sea: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop', // Mediterranean azure ocean
  brewery: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1600&auto=format&fit=crop', // Craft brewery & amber lights
  romantic: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1600&auto=format&fit=crop', // Soft candlelight dining
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1600&auto=format&fit=crop', // Artisanal roasted coffee & cozy cafe
  minimal: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop', // Scandinavian minimal architecture
  pizzeria: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1600&auto=format&fit=crop', // Artisanal pizza oven & warm dough
};

// Semantic keyword dictionary for colors
const COLOR_KEYWORDS: { pattern: RegExp; hex: string }[] = [
  { pattern: /\b(oro|dorat[oa]|gold|metallico)\b/i, hex: '#D4AF37' },
  { pattern: /\b(ambra|ambrat[oa]|amber|miele)\b/i, hex: '#F59E0B' },
  { pattern: /\b(rame|ramat[oa]|copper|bronzo)\b/i, hex: '#C2410C' },
  { pattern: /\b(fucsia|fuxia|magenta|neon pink|rosa acceso|shocking)\b/i, hex: '#EC4899' },
  { pattern: /\b(viola|purple|lilla|violett[oa]|ametista)\b/i, hex: '#A855F7' },
  { pattern: /\b(blu notte|midnight blue|blu navy|navy|oltremare)\b/i, hex: '#38BDF8' },
  { pattern: /\b(blu elettrico|cobalto|royal blue)\b/i, hex: '#2563EB' },
  { pattern: /\b(azzurr[oa]|celeste|cyan|ciano|capri)\b/i, hex: '#06B6D4' },
  { pattern: /\b(turchese|teal|acqua marina)\b/i, hex: '#14B8A6' },
  { pattern: /\b(verde smeraldo|smeraldo|emerald)\b/i, hex: '#10B981' },
  { pattern: /\b(salvia|verde salvia|sage)\b/i, hex: '#84A98C' },
  { pattern: /\b(verde bosco|foresta|oliva|muschio)\b/i, hex: '#15803D' },
  { pattern: /\b(lime|verde fluo|acido|fluorescente)\b/i, hex: '#84CC16' },
  { pattern: /\b(terracotta|ruggine|mattone|argilla)\b/i, hex: '#E07A5F' },
  { pattern: /\b(arancion[ei]|arancio|orange|carota)\b/i, hex: '#F97316' },
  { pattern: /\b(rosso rubino|bordeaux|granata|marsala|vino rosso)\b/i, hex: '#991B1B' },
  { pattern: /\b(rosso fuoco|rosso|red|scarlatto|cremisi)\b/i, hex: '#EF4444' },
  { pattern: /\b(giallo|senape|zafferano)\b/i, hex: '#EAB308' },
  { pattern: /\b(bianco|white|avorio|ivory|candido)\b/i, hex: '#E2E8F0' },
];

/**
 * Robust heuristic interior design & UI/UX analysis engine
 */
export function analyzePromptHeuristically(
  prompt: string,
  businessName?: string,
  category?: string
): HeuristicProfile {
  const p = prompt.toLowerCase();
  const name = businessName || 'Il Tuo Locale';

  // 1. Detect explicit hex color or color keyword
  const hexMatch = prompt.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/);
  let detectedColor: string | null = hexMatch ? hexMatch[0] : null;

  if (!detectedColor) {
    for (const item of COLOR_KEYWORDS) {
      if (item.pattern.test(p)) {
        detectedColor = item.hex;
        break;
      }
    }
  }

  // 2. Archetype scoring based on semantic patterns
  const scores = {
    cyberpunk: 0,
    luxury: 0,
    rustic: 0,
    sea: 0,
    brewery: 0,
    romantic: 0,
    minimal: 0,
    cafe: 0,
    vintage: 0,
    pizzeria: 0,
  };

  const checkKeywords = (keywords: string[], weight = 1): number => {
    let count = 0;
    for (const kw of keywords) {
      if (p.includes(kw)) count += weight;
    }
    return count;
  };

  scores.cyberpunk += checkKeywords(['cyberpunk', 'neon', 'techno', 'club', 'dj', 'rave', 'synth', 'notturn', 'elettron', 'laser', 'discoteca', 'afterhour', 'cocktail bar', 'barman', 'shots'], 2);
  scores.luxury += checkKeywords(['lusso', 'luxury', 'gourmet', 'stellat', 'fine dining', 'prestigio', 'oro', 'champagne', 'caviar', 'esclusiv', 'raffinat', 'sommelier', 'degustazione'], 2);
  scores.rustic += checkKeywords(['rustic', 'trattoria', 'osteria', 'agriturismo', 'caserecc', 'tradizion', 'legno', 'pietra', 'campagna', 'brace', 'braceria', 'bistecca', 'carne', 'nonna', 'casale'], 2);
  scores.sea += checkKeywords(['mare', 'beach', 'lido', 'spiaggia', 'costiera', 'mediterran', 'pesce', 'crudi', 'porto', 'isola', 'brezza', 'onde', 'marina', 'ombrellone', 'caletta'], 2);
  scores.brewery += checkKeywords(['birreria', 'birra', 'pub', 'craft beer', 'luppol', 'pinta', 'bavarese', 'irish', 'taproom', 'burger', 'stuzzich', 'spina', 'ipa'], 2);
  scores.romantic += checkKeywords(['romantic', 'intim', 'candela', 'candele', 'coppia', 'amore', 'cenetta', 'lume', 'anniversario', 'passione', 'dolcezza', 'parigino'], 2);
  scores.minimal += checkKeywords(['minimal', 'zen', 'nordic', 'scandinav', 'poke', 'healthy', 'pulito', 'lineare', 'bio', 'organico', 'vegetar', 'vegan', 'essenzial', 'luminoso'], 2);
  scores.cafe += checkKeywords(['caff', 'specialty coffee', 'bakery', 'pasticceria', 'colazion', 'brunch', 'croissant', 'lievitat', 'espresso', 'cappuccino', 'torte'], 2);
  scores.vintage += checkKeywords(['vintage', 'retro', 'anni 20', 'anni 50', 'anni 70', 'anni 80', 'speakeasy', 'storico', 'epoca', 'jazz', 'proibizionismo'], 2);
  scores.pizzeria += checkKeywords(['pizza', 'pizzeria', 'forno a legna', 'napoletan', 'margherita', 'impasto', 'lievitazion', 'cornicione', 'fritti'], 2);

  // Consider explicit category hint if available
  if (category) {
    const cat = category.toLowerCase();
    if (cat.includes('beach')) scores.sea += 3;
    if (cat.includes('bar') || cat.includes('nightlife')) scores.cyberpunk += 2;
    if (cat.includes('hotel') || cat.includes('bnb')) scores.luxury += 2;
    if (cat.includes('pizza')) scores.pizzeria += 3;
  }

  // Find top archetype
  let topArchetype: keyof typeof scores = 'luxury';
  let maxScore = -1;
  for (const [arch, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      topArchetype = arch as keyof typeof scores;
    }
  }

  // If no specific keywords matched, inspect category or fall back to refined modern hospitality
  if (maxScore === 0) {
    if (category === 'beach_club') topArchetype = 'sea';
    else if (category === 'nightlife' || category === 'bar') topArchetype = 'cyberpunk';
    else if (category === 'pizzeria') topArchetype = 'pizzeria';
    else topArchetype = 'luxury';
  }

  // Check for explicit theme mode, font, card style, or border radius overrides in prompt
  const explicitLight = /\b(chiar[oa]|bianc[oa]|light|ivory|luminos[oa]|solare)\b/i.test(p);
  const explicitMidnight = /\b(notte|navy|midnight|blu profondo)\b/i.test(p);
  const explicitWarm = /\b(cald[oa]|charcoal|bistrot|legno|ambrat[oa]|accogliente)\b/i.test(p);

  const explicitNeonCard = /\b(neon|glow|fluo|bagliore|elettric[oa])\b/i.test(p);
  const explicitGlassCard = /\b(vetro|glass|satinat[oa]|trasparen[te]|cristallo)\b/i.test(p);
  const explicitSolidCard = /\b(solid[oa]|opac[oa]|compatt[oa]|decis[oa])\b/i.test(p);
  const explicitBorderedCard = /\b(bord[oa]|bordered|contorn[oa]|linear[ei])\b/i.test(p);

  const explicitSharpBorder = /\b(squadrat[oa]|angoli retti|sharp|nessun raggio|zero)\b/i.test(p);
  const explicitFullBorder = /\b(pillola|full|tond[oa]|cerchi[oa])\b/i.test(p);
  const explicitSubtleBorder = /\b(sobri[oa]|discret[oa]|classico|piccolo)\b/i.test(p);

  // Archetype defaults
  switch (topArchetype) {
    case 'cyberpunk':
      return {
        primaryColor: detectedColor || '#EC4899',
        themeMode: explicitLight ? 'minimal_light' : explicitMidnight ? 'midnight' : 'dark',
        fontFamily: p.includes('syne') ? 'syne' : 'space_grotesk',
        cardStyle: explicitGlassCard ? 'glass' : explicitBorderedCard ? 'bordered' : 'neon',
        borderRadius: explicitSharpBorder ? 'none' : explicitFullBorder ? 'full' : '3xl',
        bgType: 'image',
        bgImageUrl: TEXTURE_ASSETS.nightlife,
        bgBlur: 12,
        bgOverlayOpacity: 65,
        bgGradientStops: ['#090314', '#1f0629'],
        heroTitle: `Nightlife & Signature Cocktails`,
        heroSubtitle: `DJ set dal vivo, mixology sperimentale e visual immersivi da ${name}`,
        heroBadge: 'Live Nightlife',
        tableBadgeLabel: 'Tavolo / Privee',
        tableLiveTag: 'VIBES LIVE',
        conceptExplanation: `Un concept notturno ad alto impatto visivo ispirato al clubbing contemporaneo: palette scura arricchita da bagliori neon ad alto contrasto, tipografia audace Space Grotesk e card con riflessi luminosi per un'atmosfera immersiva ed elettrizzante.`,
        customModules: [
          { id: 'menu', title: 'Signature Drinks & Mixology', subtitle: 'Distillati rari e ricette esclusive del bartender', badge: 'Carta', colSpan: 1, iconName: 'Wine', enabled: true },
          { id: 'custom_cta', title: 'DJ Set & Serate Live', subtitle: 'Line-up artisti, performance e ospiti di questa sera', badge: 'EVENTI', colSpan: 1, iconName: 'Music', enabled: true },
          { id: 'wheel', title: 'Shot Roulette', subtitle: 'Gira la ruota e sfida la fortuna per uno shot', badge: 'Bonus', colSpan: 1, iconName: 'Sparkles', enabled: true },
          { id: 'service', title: 'Chiama al Tavolo', subtitle: 'Ordina un altro giro con 1 solo tap', badge: 'Fast', colSpan: 1, enabled: true },
          { id: 'instagram', title: 'Segui le Nostre Serate', subtitle: 'Tagga le tue storie per apparire sui visual del locale', badge: '@Club', colSpan: 2, iconName: 'Camera', enabled: true },
        ],
      };

    case 'rustic':
      return {
        primaryColor: detectedColor || '#E07A5F',
        themeMode: explicitLight ? 'minimal_light' : 'warm_charcoal',
        fontFamily: p.includes('cinzel') ? 'cinzel' : 'dm_sans',
        cardStyle: explicitGlassCard ? 'glass' : explicitBorderedCard ? 'bordered' : 'solid',
        borderRadius: explicitSharpBorder ? 'none' : explicitSubtleBorder ? 'md' : '2xl',
        bgType: 'image',
        bgImageUrl: TEXTURE_ASSETS.rustic,
        bgBlur: 8,
        bgOverlayOpacity: 65,
        bgGradientStops: ['#14100c', '#271c14'],
        heroTitle: `Sapori Antichi & Ricette di Famiglia`,
        heroSubtitle: `Cottura alla brace, pasta fresca fatta in casa e genuinità d'altri tempi da ${name}`,
        heroBadge: 'Tradizione d\'Autore',
        tableBadgeLabel: 'Tavolo Ospite',
        tableLiveTag: 'OSTERIA LIVE',
        conceptExplanation: `Un'atmosfera calda e sincera che richiama le storiche osterie e trattorie della tradizione: sfumature calde terracotta/ambra, sfondo a texture legno vissuto, contrasti generosi e tipografia amichevole che trasmette calore e convivialità genuina.`,
        customModules: [
          { id: 'menu', title: 'Menù della Tradizione', subtitle: 'Primi tirati a mano, carni selezionate e dolci caserecci', badge: 'DOP', colSpan: 2, iconName: 'UtensilsCrossed', enabled: true },
          { id: 'sommelier', title: 'I Vini del Contadino', subtitle: 'Consigli sui migliori rossi e bianchi del territorio', badge: 'Cantina', colSpan: 1, iconName: 'Wine', enabled: true },
          { id: 'service', title: 'Chiama la Sala', subtitle: 'Il cameriere al tuo tavolo con un tocco', badge: '1-Tap', colSpan: 1, enabled: true },
          { id: 'reviews', title: 'Ti sei sentito a casa?', subtitle: 'Lascia una recensione spontanea su Google', badge: '5 Stelle', colSpan: 2, enabled: true },
        ],
      };

    case 'sea':
      return {
        primaryColor: detectedColor || '#0EA5E9',
        themeMode: explicitWarm ? 'warm_charcoal' : 'midnight',
        fontFamily: p.includes('playfair') ? 'playfair' : 'outfit',
        cardStyle: explicitSolidCard ? 'solid' : explicitNeonCard ? 'neon' : 'glass',
        borderRadius: explicitSharpBorder ? 'none' : '3xl',
        bgType: 'image',
        bgImageUrl: TEXTURE_ASSETS.sea,
        bgBlur: 10,
        bgOverlayOpacity: 55,
        bgGradientStops: ['#051321', '#0b2a47'],
        heroTitle: `Brezza Marina & Pescato del Giorno`,
        heroSubtitle: `Crudi di mare, primi profumati e cocktail rinfrescanti in riva alle onde da ${name}`,
        heroBadge: 'Sapore di Mare',
        tableBadgeLabel: 'Ombrellone / Lettino',
        tableLiveTag: 'LIDO LIVE',
        conceptExplanation: `Design rinfrescante e arioso ispirato alla luce del Mediterraneo: toni ciano/azzurro Capri su sfondi blu profondo oceanico, card in vetro satinato con effetto salsedine e bento dinamico ottimizzato per ordini rapidi sotto il sole.`,
        customModules: [
          { id: 'menu', title: 'Menù Fish & Raw Bar', subtitle: 'Pescato fresco, tartare, fritture e primi di mare', badge: 'Fresco', colSpan: 1, iconName: 'UtensilsCrossed', enabled: true },
          { id: 'service', title: 'Ordina all\'Ombrellone', subtitle: 'Cameriere al lettino senza alzarti dalla spiaggia', badge: 'Servizio', colSpan: 1, enabled: true },
          { id: 'wheel', title: 'Ruota della Spiaggia', subtitle: 'Tenta la sorte e vinci un drink al tramonto', badge: 'Premio', colSpan: 1, iconName: 'Sparkles', enabled: true },
          { id: 'wifi', title: 'Wi-Fi Lido Free', subtitle: 'Connessione ad alta velocità gratuita', badge: 'Gratis', colSpan: 1, enabled: true },
          { id: 'reviews', title: 'Valuta la tua Giornata', subtitle: 'Supporta il nostro lido con 5 stelle su Google', badge: 'Google', colSpan: 2, enabled: true },
        ],
      };

    case 'brewery':
      return {
        primaryColor: detectedColor || '#F59E0B',
        themeMode: explicitLight ? 'minimal_light' : 'dark',
        fontFamily: p.includes('cinzel') ? 'cinzel' : 'syne',
        cardStyle: explicitGlassCard ? 'glass' : explicitBorderedCard ? 'bordered' : 'solid',
        borderRadius: explicitSharpBorder ? 'none' : '2xl',
        bgType: 'image',
        bgImageUrl: TEXTURE_ASSETS.brewery,
        bgBlur: 9,
        bgOverlayOpacity: 65,
        bgGradientStops: ['#0f0d0a', '#221a11'],
        heroTitle: `Spine Artigianali & Street Gourmet`,
        heroSubtitle: `Malti pregiati, luppolature audaci, burger succulenti e fritti dorati da ${name}`,
        heroBadge: 'Craft Taproom',
        tableBadgeLabel: 'Tavolo Pinta',
        tableLiveTag: 'PUB LIVE',
        conceptExplanation: `Visual design energico e deciso ispirato alle grandi taproom artigianali: palette ambra/rame che richiama il colore della birra appena spillata, card scure solide e tipografia moderna e grintosa per una lettura chiara anche nelle serate più movimentate.`,
        customModules: [
          { id: 'menu', title: 'Tap List & Burger Gourmet', subtitle: 'Birre alla spina a rotazione continua e sfiziosità', badge: 'ON TAP', colSpan: 2, iconName: 'UtensilsCrossed', enabled: true },
          { id: 'service', title: 'Biro al Tavolo', subtitle: 'Ordina un\'altra pinta o chiedi il conto al volo', badge: 'Rapido', colSpan: 1, enabled: true },
          { id: 'wheel', title: 'Gira la Pinta', subtitle: 'Gira la ruota e vinci una degustazione della casa', badge: 'Bonus', colSpan: 1, iconName: 'Sparkles', enabled: true },
          { id: 'loyalty', title: 'Beer Club Pass', subtitle: 'Accumula pinte e sblocca birre speciali in omaggio', badge: 'Club', colSpan: 1, enabled: true },
          { id: 'reviews', title: 'Ti piace la nostra birra?', subtitle: 'Aiuta la nostra taproom lasciando 5 stelle', badge: 'Cheers', colSpan: 1, enabled: true },
        ],
      };

    case 'romantic':
      return {
        primaryColor: detectedColor || '#E11D48',
        themeMode: explicitLight ? 'minimal_light' : explicitWarm ? 'warm_charcoal' : 'dark',
        fontFamily: 'playfair',
        cardStyle: 'glass',
        borderRadius: '2xl',
        bgType: 'image',
        bgImageUrl: TEXTURE_ASSETS.romantic,
        bgBlur: 11,
        bgOverlayOpacity: 60,
        bgGradientStops: ['#12080d', '#2b0d1b'],
        heroTitle: `Atmosfera Intima & Calici d'Autore`,
        heroSubtitle: `Una cena a lume di candela curata in ogni dettaglio per regalare momenti indimenticabili da ${name}`,
        heroBadge: 'Esperienza per Due',
        tableBadgeLabel: 'Tavolo Riservato',
        tableLiveTag: 'INTIMO LIVE',
        conceptExplanation: `Atmosfera romantica e intima studiata per cene speciali e anniversari: tonalità velluto rosso rubino, sfumature a lume di candela e tipografia aggraziata Playfair Display con card satinate per la massima discrezione ed eleganza.`,
        customModules: [
          { id: 'menu', title: 'Menù Degustazione a Due', subtitle: 'Portate d\'autore con ingredienti afrodisiaci e ricercati', badge: 'Chef', colSpan: 1, iconName: 'UtensilsCrossed', enabled: true },
          { id: 'sommelier', title: 'Bollicine & Rosé d\'Annata', subtitle: 'L\'abbinamento perfetto consigliato per la serata', badge: 'Cru', colSpan: 1, iconName: 'Wine', enabled: true },
          { id: 'service', title: 'Servizio Discreto in Sala', subtitle: 'Chiama il personale con il massimo rispetto della privacy', badge: 'Discreto', colSpan: 1, enabled: true },
          { id: 'reviews', title: 'Il Ricordo della Serata', subtitle: 'Condividi le tue impressioni speciali su Google', badge: '5 Stelle', colSpan: 2, enabled: true },
        ],
      };

    case 'minimal':
      return {
        primaryColor: detectedColor || '#10B981',
        themeMode: explicitWarm ? 'warm_charcoal' : 'minimal_light',
        fontFamily: p.includes('inter') ? 'inter' : 'plus_jakarta',
        cardStyle: explicitGlassCard ? 'glass' : 'bordered',
        borderRadius: explicitSharpBorder ? 'none' : '2xl',
        bgType: 'theme',
        bgImageUrl: TEXTURE_ASSETS.minimal,
        bgBlur: 6,
        bgOverlayOpacity: 40,
        bgGradientStops: ['#f8fafc', '#e2e8f0'],
        heroTitle: `Armonia, Freschezza & Natura`,
        heroSubtitle: `Ingredienti biologici a km zero, piatti leggeri e sostenibilità consapevole da ${name}`,
        heroBadge: 'Organic & Clean',
        tableBadgeLabel: 'La tua Postazione',
        tableLiveTag: 'BIO LIVE',
        conceptExplanation: `Concept minimalista ispirato al design nordico ed ecosostenibile: linee chiare e ariose, tonalità verde smeraldo naturale, bordi definiti e tipografia modernissima Plus Jakarta per un'esperienza pura, pulita e distesa.`,
        customModules: [
          { id: 'menu', title: 'Bowls & Piatti Salutari', subtitle: 'Menù bilanciato, superfood, opzioni veg e gluten-free', badge: 'Bio', colSpan: 2, iconName: 'UtensilsCrossed', enabled: true },
          { id: 'wifi', title: 'Wi-Fi Smart Working', subtitle: 'Connessione fibra ultraveloce gratuita', badge: 'Fibra', colSpan: 1, enabled: true },
          { id: 'loyalty', title: 'Green Loyalty Card', subtitle: 'Accumula timbri ecologici e sblocca piatti omaggio', badge: 'Pass', colSpan: 1, enabled: true },
          { id: 'reviews', title: 'La tua Opinione Conta', subtitle: 'Aiutaci a migliorare con un voto su Google', badge: 'Feedback', colSpan: 2, enabled: true },
        ],
      };

    case 'cafe':
      return {
        primaryColor: detectedColor || '#D97706',
        themeMode: explicitLight ? 'minimal_light' : 'warm_charcoal',
        fontFamily: p.includes('playfair') ? 'playfair' : 'dm_sans',
        cardStyle: explicitGlassCard ? 'glass' : 'solid',
        borderRadius: '2xl',
        bgType: 'image',
        bgImageUrl: TEXTURE_ASSETS.cafe,
        bgBlur: 9,
        bgOverlayOpacity: 65,
        bgGradientStops: ['#17120e', '#291e17'],
        heroTitle: `Specialty Coffee & Dolci Artigianali`,
        heroSubtitle: `Miscele mono-origine tostate fresche, lievitati fragranti e colazioni d'autore da ${name}`,
        heroBadge: 'Torrefazione & Bakery',
        tableBadgeLabel: 'Tavolino Caffè',
        tableLiveTag: 'COFFEE LIVE',
        conceptExplanation: `Identità calda e avvolgente come l'aroma del caffè appena macinato: tonalità caramello ambrato, texture delicata di chicchi tostati, font morbido e accogliente con pulsanti veloci per ordinare dolci e bevande calde.`,
        customModules: [
          { id: 'menu', title: 'Caffetteria & Pasticceria', subtitle: 'Espressi pregiati, flat white, croissant e brunch del giorno', badge: 'Fresh', colSpan: 1, iconName: 'Coffee', enabled: true },
          { id: 'loyalty', title: 'Coffee Stamp Card', subtitle: 'Ogni 9 caffè gustati, il decimo è offerto dalla casa', badge: 'Timbri', colSpan: 1, enabled: true },
          { id: 'service', title: 'Ordina al Banco', subtitle: 'Segnala il tuo ordine allo staff in un istante', badge: '1-Tap', colSpan: 1, enabled: true },
          { id: 'wifi', title: 'Wi-Fi Bar', subtitle: 'Naviga comodamente mentre gusti la colazione', badge: 'Free', colSpan: 1, enabled: true },
          { id: 'reviews', title: 'Ti è piaciuta la colazione?', subtitle: 'Lasciaci 5 stelle per sostenere la nostra pasticceria', badge: 'Google', colSpan: 2, enabled: true },
        ],
      };

    case 'vintage':
      return {
        primaryColor: detectedColor || '#C2410C',
        themeMode: 'dark',
        fontFamily: 'cinzel',
        cardStyle: 'glass',
        borderRadius: explicitSharpBorder ? 'none' : 'md',
        bgType: 'image',
        bgImageUrl: TEXTURE_ASSETS.luxury,
        bgBlur: 10,
        bgOverlayOpacity: 68,
        bgGradientStops: ['#100b08', '#26150e'],
        heroTitle: `Secret Speakeasy & Retro Vibes`,
        heroSubtitle: `Ricette storiche dell'era del proibizionismo, musica jazz e distillati introvabili da ${name}`,
        heroBadge: 'Secret Room',
        tableBadgeLabel: 'Salottino Privato',
        tableLiveTag: 'HERITAGE LIVE',
        conceptExplanation: `Estetica d'epoca ispirata ai club clandestini degli anni '20: accenti rame ossidato, tipografia monumentale scolpita Cinzel, contrasti scuri profondi e dettagli d'antan che celebrano l'eredità storica dei cocktail classici.`,
        customModules: [
          { id: 'menu', title: 'The Secret Cocktail List', subtitle: 'Drink d\'epoca, affinamenti in botte e ricette segrete', badge: '1920', colSpan: 1, iconName: 'Wine', enabled: true },
          { id: 'custom_cta', title: 'Jazz Club Calendar', subtitle: 'Le serate musicali dal vivo con artisti e quintetti', badge: 'Jazz', colSpan: 1, iconName: 'Music', enabled: true },
          { id: 'service', title: 'Chiama il Barman', subtitle: 'Consulenza dedicata sul distillato perfetto per te', badge: 'Barman', colSpan: 1, enabled: true },
          { id: 'reviews', title: 'Custodisci il Segreto', subtitle: 'Valuta la tua esperienza esclusiva su Google', badge: '5 Stelle', colSpan: 2, enabled: true },
        ],
      };

    case 'pizzeria':
      return {
        primaryColor: detectedColor || '#F59E0B',
        themeMode: explicitLight ? 'minimal_light' : 'warm_charcoal',
        fontFamily: 'dm_sans',
        cardStyle: 'solid',
        borderRadius: '2xl',
        bgType: 'image',
        bgImageUrl: TEXTURE_ASSETS.pizzeria,
        bgBlur: 8,
        bgOverlayOpacity: 60,
        bgGradientStops: ['#14110e', '#2b1b10'],
        heroTitle: `Impasti a Lenta Lievitazione`,
        heroSubtitle: `Farine macinate a pietra, pomodoro San Marzano DOP e forno a legna da ${name}`,
        heroBadge: 'Fatto a Mano',
        tableBadgeLabel: 'Tavolo Pizzeria',
        tableLiveTag: 'FORNO LIVE',
        conceptExplanation: `Visual autentico e caldo dedicato all'arte della pizza: tonalità ambra dorata come la crosta croccante, sfondo caldo con riflessi di fiamma viva, layout bento chiaro con accesso immediato alle pizze speciali e alle birre artigianali.`,
        customModules: [
          { id: 'menu', title: 'Le Nostre Pizze & Fritti', subtitle: 'Classiche, contemporanee a canotto e sfizi napoletani', badge: 'Menù', colSpan: 2, iconName: 'UtensilsCrossed', enabled: true },
          { id: 'service', title: 'Chiama il Cameriere', subtitle: 'Ordina un\'altra bibita o chiedi il conto al tavolo', badge: '1-Tap', colSpan: 1, enabled: true },
          { id: 'wheel', title: 'Ruota della Pizza', subtitle: 'Gira e vinci un dolce artigianale o un caffè', badge: 'Premio', colSpan: 1, iconName: 'Sparkles', enabled: true },
          { id: 'loyalty', title: 'Pizza Fidelity Pass', subtitle: 'Raccogli timbri digitali e ricevi una pizza in omaggio', badge: 'Fidelity', colSpan: 1, enabled: true },
          { id: 'reviews', title: 'Ti è piaciuta la pizza?', subtitle: 'Sostienici con una recensione a 5 stelle su Google', badge: 'Google', colSpan: 1, enabled: true },
        ],
      };

    case 'luxury':
    default:
      return {
        primaryColor: detectedColor || '#D4AF37',
        themeMode: explicitLight ? 'minimal_light' : explicitMidnight ? 'midnight' : 'dark',
        fontFamily: p.includes('cinzel') ? 'cinzel' : 'playfair',
        cardStyle: explicitSolidCard ? 'solid' : 'glass',
        borderRadius: explicitSharpBorder ? 'none' : 'md',
        bgType: 'image',
        bgImageUrl: TEXTURE_ASSETS.luxury,
        bgBlur: 10,
        bgOverlayOpacity: 68,
        bgGradientStops: ['#0d0c0a', '#1e1a14'],
        heroTitle: `Esperienza Gastronomica d'Autore`,
        heroSubtitle: `Percorsi degustazione dello Chef e cantina d'eccellenza da ${name}`,
        heroBadge: 'Fine Dining',
        tableBadgeLabel: 'Tavolo Esclusivo',
        tableLiveTag: 'NFC PRESTIGE',
        conceptExplanation: `Un'identità di lusso sobria e ricercata adatta al fine dining: raffinati tocchi oro caldo su texture marmo scuro lucido, tipografia graziata Playfair Display e moduli in vetro satinato per un'esperienza digitale all'altezza dell'alta cucina.`,
        customModules: [
          { id: 'menu', title: 'Menù Degustazione & Carta', subtitle: 'I percorsi della cucina e gli ingredienti rari di stagione', badge: 'Gourmet', colSpan: 1, iconName: 'UtensilsCrossed', enabled: true },
          { id: 'sommelier', title: 'AI Sommelier Privato', subtitle: 'Abbinamenti consigliati per ogni portata della serata', badge: 'Prestige', colSpan: 1, iconName: 'Wine', enabled: true },
          { id: 'service', title: 'Maître di Sala', subtitle: 'Assistenza dedicata e discreta direttamente al tuo tavolo', badge: 'Concierge', colSpan: 1, enabled: true },
          { id: 'reviews', title: 'Condividi la tua Esperienza', subtitle: 'Aiuta gli altri appassionati di gastronomia su Google', badge: '5 Stelle', colSpan: 2, enabled: true },
        ],
      };
  }
}

/**
 * Call OpenAI API if configured
 */
async function generateWithOpenAI(
  prompt: string,
  businessName: string,
  category: string
): Promise<{ config: Partial<HubConfig>; conceptExplanation: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const systemPrompt = `Sei un acclamato Art Director, Senior Hospitality Interior Designer e Digital UI/UX Architect.
Il tuo compito è trasformare la descrizione libera di un locale o brand nel design perfetto per un Hub Digitale NFC al tavolo.

Devi restituire ESCLUSIVAMENTE un oggetto JSON valido (senza markdown o testo extra) con la seguente struttura:
{
  "primaryColor": "#HEX_COLORE_ALTO_CONTRASTO",
  "themeMode": "dark" | "midnight" | "warm_charcoal" | "minimal_light",
  "fontFamily": "cinzel" | "playfair" | "inter" | "space_grotesk" | "plus_jakarta" | "syne",
  "cardStyle": "glass" | "solid" | "bordered" | "neon",
  "borderRadius": "none" | "md" | "2xl" | "3xl" | "full",
  "bgType": "image" | "theme" | "gradient",
  "bgImageUrl": "URL_IMMAGINE_ALTA_RISOLUZIONE_O_TEXTURE_OPZIONALE",
  "bgBlur": 8,
  "bgOverlayOpacity": 60,
  "hero": {
    "enabled": true,
    "title": "Titolo suggestivo e coerente con lo stile",
    "subtitle": "Sottotitolo accogliente con il nome del locale",
    "badgeText": "Badge es. Fine Dining, Nightlife, Artigianale"
  },
  "modules": [
    {
      "id": "menu",
      "enabled": true,
      "order": 1,
      "title": "Titolo personalizzato",
      "subtitle": "Sottotitolo descrittivo",
      "badge": "Badge breve",
      "colSpan": 1 o 2,
      "iconName": "UtensilsCrossed" | "Wine" | "Coffee" | "Music" | "Sparkles" | "Camera"
    }
  ],
  "conceptExplanation": "Spiegazione professionale e affascinante in italiano della scelta di palette, atmosfera, tipografia e layout bento."
}`;

    const userContent = `Locale: "${businessName}" (Settore: ${category}).\nPrompt dell'utente: "${prompt}"`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          config: parsed,
          conceptExplanation: parsed.conceptExplanation || '',
        };
      }
    }
  } catch (err) {
    console.warn('[AI Hub Architect] OpenAI generation failed, falling back to heuristic engine:', err);
  }

  return null;
}

/**
 * Call Google Gemini API if configured
 */
async function generateWithGemini(
  prompt: string,
  businessName: string,
  category: string
): Promise<{ config: Partial<HubConfig>; conceptExplanation: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;

  try {
    const systemPrompt = `Sei un acclamato Art Director, Senior Hospitality Interior Designer e Digital UI/UX Architect.
Trasforma questa descrizione di un locale nel design ottimale per il suo Smart Hub NFC.
Rispondi con un unico blocco JSON valido con le chiavi:
"primaryColor" (hex), "themeMode" ("dark" | "midnight" | "warm_charcoal" | "minimal_light"),
"fontFamily" ("cinzel" | "playfair" | "inter" | "space_grotesk" | "plus_jakarta" | "syne"),
"cardStyle" ("glass" | "solid" | "bordered" | "neon"),
"borderRadius" ("none" | "md" | "2xl" | "3xl" | "full"),
"bgType" ("image" | "theme" | "gradient"), "bgImageUrl", "bgBlur", "bgOverlayOpacity",
"hero": { "enabled": true, "title": string, "subtitle": string, "badgeText": string },
"modules": array di moduli con id, enabled, order, title, subtitle, badge, colSpan (1 o 2), iconName,
"conceptExplanation": stringa esplicativa del concept visivo in italiano.`;

    const userPrompt = `Locale: "${businessName}" (Categoria: ${category}). Richiesta di stile: "${prompt}". Rispondi esclusivamente in formato JSON.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          config: parsed,
          conceptExplanation: parsed.conceptExplanation || '',
        };
      }
    }
  } catch (err) {
    console.warn('[AI Hub Architect] Gemini generation failed, falling back to heuristic engine:', err);
  }

  return null;
}

/**
 * Main API Route Handler
 */
export async function POST(request: NextRequest) {
  try {
    const body: HubArchitectRequestBody = await request.json();
    const rawPrompt = (body.prompt || '').trim();
    const cleanPrompt = sanitizeString(rawPrompt, 1500) || 'Un locale moderno ed elegante con forte identità visiva';
    const businessName = sanitizeString(body.businessName, 100) || 'Il Tuo Locale';
    const category: BusinessCategory = (body.category as BusinessCategory) || 'restaurant';
    const currentConfig = body.currentConfig;

    // 1. Try OpenAI if API Key is available
    let aiResult = await generateWithOpenAI(cleanPrompt, businessName, category);

    // 2. Try Gemini if OpenAI was not available or failed
    if (!aiResult) {
      aiResult = await generateWithGemini(cleanPrompt, businessName, category);
    }

    let finalConfig: HubConfig;
    let conceptExplanation = '';

    if (aiResult && aiResult.config) {
      conceptExplanation = aiResult.conceptExplanation || 'Concept visivo generato dal modello AI.';
      const partial = aiResult.config;
      finalConfig = mergeHubConfig(
        {
          ...currentConfig,
          ...partial,
          hero: {
            ...(currentConfig?.hero || {}),
            ...(partial.hero || {}),
            enabled: true,
          },
        },
        category
      );
    } else {
      // 3. Ultra-robust heuristic engine guaranteed to work with zero external dependencies
      const profile = analyzePromptHeuristically(cleanPrompt, businessName, category);
      conceptExplanation = profile.conceptExplanation;

      const baseDefaults = getDefaultHubConfig(category);

      // Construct dynamic bento modules
      const dynamicModules: HubModuleConfig[] = [];
      let orderIndex = 1;

      for (const customMod of profile.customModules) {
        dynamicModules.push({
          id: customMod.id,
          enabled: customMod.enabled,
          order: orderIndex++,
          title: customMod.title,
          subtitle: customMod.subtitle,
          badge: customMod.badge || '',
          colSpan: customMod.colSpan,
          iconName: customMod.iconName || 'Sparkles',
          isCustom: customMod.id === 'custom_cta',
        });
      }

      // Add remaining standard modules from defaults if not already present
      for (const defMod of baseDefaults.modules) {
        if (!dynamicModules.some((m) => m.id === defMod.id)) {
          dynamicModules.push({
            ...defMod,
            order: orderIndex++,
            colSpan: defMod.colSpan || 1,
          });
        }
      }

      finalConfig = mergeHubConfig(
        {
          ...currentConfig,
          primaryColor: profile.primaryColor,
          themeMode: profile.themeMode,
          fontFamily: profile.fontFamily,
          cardStyle: profile.cardStyle,
          borderRadius: profile.borderRadius,
          bgType: profile.bgType,
          bgImageUrl: profile.bgImageUrl,
          bgBlur: profile.bgBlur,
          bgOverlayOpacity: profile.bgOverlayOpacity,
          bgGradientStops: profile.bgGradientStops,
          tableBadgeLabel: profile.tableBadgeLabel,
          tableLiveTag: profile.tableLiveTag,
          hero: {
            enabled: true,
            title: profile.heroTitle,
            subtitle: profile.heroSubtitle,
            badgeText: profile.heroBadge,
            destinationType: 'in_app',
          },
          modules: dynamicModules,
        },
        category
      );
    }

    return NextResponse.json({
      success: true,
      config: finalConfig,
      conceptExplanation,
      designHighlights: {
        primaryColor: finalConfig.primaryColor,
        themeMode: finalConfig.themeMode,
        fontFamily: finalConfig.fontFamily,
        cardStyle: finalConfig.cardStyle,
        borderRadius: finalConfig.borderRadius || '2xl',
        bgType: finalConfig.bgType || 'theme',
      },
    });
  } catch (err: unknown) {
    console.error('[AI Hub Architect Error]', err);
    const msg = err instanceof Error ? err.message : 'Errore interno durante la generazione del concept';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
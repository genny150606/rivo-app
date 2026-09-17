import { HubConfig, mergeHubConfig } from './hub-config';
import { BusinessCategory } from './types';

export interface CommunityHubTemplate {
  id: string;
  name: string;
  author: string;
  category: string;
  styleTag: string; // es. 'Luxury & Fine Dining', 'Speakeasy & Jazz', 'Pizzeria Contemporanea', 'Bistrot & Brunch', 'Cyberpunk Lounge'
  description: string;
  likesCount: number;
  usageCount: number;
  preview: {
    primaryColor: string;
    themeMode: string;
    fontFamily: string;
    cardStyle: string;
    bgImageUrl?: string;
    modulesPreview: string[];
  };
  config: HubConfig; // HubConfig completa pronta all'uso
  createdAt: string;
}

/**
 * Collezione d'autore di template Hub pronti all'uso.
 * Ogni template è studiato nei minimi dettagli per un'esperienza visiva, tattile e funzionale di livello internazionale.
 */
export const CURATED_COMMUNITY_TEMPLATES: CommunityHubTemplate[] = [
  {
    id: 'tpl-aura-privee',
    name: 'Aura Privée',
    author: 'Chef & Sommelier Matteo V.',
    category: 'restaurant',
    styleTag: 'Luxury & Fine Dining',
    description:
      'Design sublime in marmo nero e finiture oro zecchino, pensato per ristoranti stellati, cantine d’élite e relais di lusso. Tipografia Cinzel nobiliare, bento grid asimmetrica e modulo AI Sommelier in primo piano.',
    likesCount: 342,
    usageCount: 128,
    preview: {
      primaryColor: '#E6AF2E',
      themeMode: 'dark',
      fontFamily: 'cinzel',
      cardStyle: 'glass',
      bgImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
      modulesPreview: ['AI Master Sommelier', 'Carta & Degustazione', 'Assistenza Sala', 'Recensione 5.0'],
    },
    createdAt: '2026-03-01T10:00:00Z',
    config: {
      fontFamily: 'cinzel',
      themeMode: 'dark',
      cardStyle: 'glass',
      primaryColor: '#E6AF2E',
      accentGlow: true,
      tableBadgeLabel: 'Tavolo Riservato',
      tableLiveTag: 'FINE DINING',
      hero: {
        enabled: true,
        title: 'Menù Degustazione & Cantina',
        subtitle: 'Percorso sensoriale in 7 portate e oltre 400 etichette selezionate',
        badgeText: 'Grand Cru Selection',
        destinationType: 'in_app',
      },
      modules: [
        {
          id: 'sommelier',
          enabled: true,
          order: 1,
          title: 'AI Master Sommelier',
          subtitle: 'Abbinamento calici e note olfattive su misura',
          badge: 'AI Cru',
          colSpan: 2,
        },
        {
          id: 'menu',
          enabled: true,
          order: 2,
          title: 'Carta & Degustazione',
          subtitle: 'I piatti d’autore dello Chef',
          badge: 'Gourmet',
          colSpan: 1,
        },
        {
          id: 'service',
          enabled: true,
          order: 3,
          title: 'Assistenza Sala',
          subtitle: 'Chiamata discreta cameriere o sommelier',
          badge: 'Discreto',
          colSpan: 1,
        },
        {
          id: 'reviews',
          enabled: true,
          order: 4,
          title: 'La Tua Esperienza',
          subtitle: 'Condividi la recensione su Google e Guide Gastronomiche',
          badge: '5.0',
          colSpan: 2,
        },
        {
          id: 'wifi',
          enabled: true,
          order: 5,
          title: 'Wi-Fi Riservato',
          subtitle: 'Connessione protetta ad alta velocità',
          badge: 'Fibra',
          colSpan: 1,
        },
        {
          id: 'loyalty',
          enabled: true,
          order: 6,
          title: 'Privilege Club',
          subtitle: 'Inviti a cene evento ed esclusive della cantina',
          badge: 'VIP',
          colSpan: 1,
        },
      ],
      footerNote: 'Esperienza gastronomica d’eccellenza • NFC Smart Hub',
      bgType: 'image',
      bgImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
      bgBlur: 10,
      bgOverlayOpacity: 65,
      bgGradientStops: ['#0c0f0d', '#1a1608'],
      borderRadius: '2xl',
    },
  },
  {
    id: 'tpl-velvet-sax',
    name: 'Velvet & Sax',
    author: 'Leo "The Alchemist" Mixology',
    category: 'nightlife',
    styleTag: 'Speakeasy & Jazz',
    description:
      'Atmosfera clandestina e soffusa da club segreto anni ’30. Tipografia Syne audace, accenti ambra calda e neon perimetrale soffuso, con AI Cocktail Alchemist per creazioni signature sartoriali.',
    likesCount: 289,
    usageCount: 94,
    preview: {
      primaryColor: '#F59E0B',
      themeMode: 'warm_charcoal',
      fontFamily: 'syne',
      cardStyle: 'neon',
      bgImageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop',
      modulesPreview: ['AI Cocktail Alchemist', 'Secret Drink List', 'Chiama Bancone', 'Ruota degli Shot'],
    },
    createdAt: '2026-03-05T14:30:00Z',
    config: {
      fontFamily: 'syne',
      themeMode: 'warm_charcoal',
      cardStyle: 'neon',
      primaryColor: '#F59E0B',
      accentGlow: true,
      tableBadgeLabel: 'Salotto Privato',
      tableLiveTag: 'SPEAKEASY',
      hero: {
        enabled: true,
        title: 'Secret Drink List & Distillati',
        subtitle: 'Infusioni botaniche, whisky rari e ricette clandestine',
        badgeText: 'Signature',
        destinationType: 'in_app',
      },
      modules: [
        {
          id: 'sommelier',
          enabled: true,
          order: 1,
          title: 'AI Cocktail Alchemist',
          subtitle: 'Trova il signature perfetto per i tuoi gusti',
          badge: 'Mixology AI',
          colSpan: 2,
        },
        {
          id: 'menu',
          enabled: true,
          order: 2,
          title: 'Rare Spirits & Cocktails',
          subtitle: 'Distillati artigianali e miscelazione d’autore',
          badge: 'Carta',
          colSpan: 1,
        },
        {
          id: 'service',
          enabled: true,
          order: 3,
          title: 'Chiama Bancone',
          subtitle: 'Ordina un altro giro o richiedi il conto al volo',
          badge: '1-Tap',
          colSpan: 1,
        },
        {
          id: 'wheel',
          enabled: true,
          order: 4,
          title: 'Ruota degli Shot',
          subtitle: 'Sfida la sorte: vinci uno shot segreto o un assaggio',
          badge: 'Lucky',
          colSpan: 1,
        },
        {
          id: 'wifi',
          enabled: true,
          order: 5,
          title: 'Wi-Fi Clandestino',
          subtitle: 'Codice d’accesso immediato al tavolo',
          badge: 'Free',
          colSpan: 1,
        },
        {
          id: 'reviews',
          enabled: true,
          order: 6,
          title: 'Supporta il Club',
          subtitle: 'Valuta l’atmosfera e i cocktail su Google',
          badge: 'Google 5',
          colSpan: 2,
        },
      ],
      footerNote: 'Password d’ingresso al bar disponibile al tavolo • Powered by Rivo',
      bgType: 'image',
      bgImageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop',
      bgBlur: 8,
      bgOverlayOpacity: 60,
      bgGradientStops: ['#141210', '#26190a'],
      borderRadius: '2xl',
    },
  },
  {
    id: 'tpl-vesuvio-contemporanea',
    name: 'Vesuvio & Corbezzolo',
    author: 'Gennaro D. - Pizza Lab',
    category: 'pizzeria',
    styleTag: 'Pizzeria Contemporanea',
    description:
      'Spirito napoletano evoluto: cornicione a canotto, impasti idratati a fermentazione naturale e grafica decisa con rosso fuoco e bordi satinati. Include Fidelity Card digitale per veri pizza lover.',
    likesCount: 412,
    usageCount: 215,
    preview: {
      primaryColor: '#FF3B30',
      themeMode: 'dark',
      fontFamily: 'outfit',
      cardStyle: 'bordered',
      bgImageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop',
      modulesPreview: ['Menù & Carte Birre', 'Chiama Servizio', 'Pizza Club Pass', 'Ruota dei Dolci'],
    },
    createdAt: '2026-03-08T18:00:00Z',
    config: {
      fontFamily: 'outfit',
      themeMode: 'dark',
      cardStyle: 'bordered',
      primaryColor: '#FF3B30',
      accentGlow: true,
      tableBadgeLabel: 'Tavolo Pizza',
      tableLiveTag: 'FORNO A LEGNA',
      hero: {
        enabled: true,
        title: 'Menù Pizze d’Autore & Fritti',
        subtitle: 'Impasti a lievitazione naturale 48h, ingredienti DOP e birre artigianali',
        badgeText: 'Specialità Forno',
        destinationType: 'in_app',
      },
      modules: [
        {
          id: 'menu',
          enabled: true,
          order: 1,
          title: 'Menù & Carte Birre',
          subtitle: 'Pizze contemporanee, calzoni ripieni e fritti vesuviani',
          badge: 'Menù',
          colSpan: 2,
        },
        {
          id: 'service',
          enabled: true,
          order: 2,
          title: 'Chiama Servizio',
          subtitle: 'Ordina ancora o chiedi il conto (POS / Contanti)',
          badge: 'Sala',
          colSpan: 1,
        },
        {
          id: 'loyalty',
          enabled: true,
          order: 3,
          title: 'Pizza Club Pass',
          subtitle: 'Timbri digitali: 1 pizza gratis ogni 8 timbri',
          badge: 'Premio',
          colSpan: 1,
        },
        {
          id: 'wheel',
          enabled: true,
          order: 4,
          title: 'Ruota dei Golosi',
          subtitle: 'Gira la ruota: vinci un babà al rum o un caffè',
          badge: 'Bonus',
          colSpan: 1,
        },
        {
          id: 'wifi',
          enabled: true,
          order: 5,
          title: 'Wi-Fi Pizzeria',
          subtitle: 'Accesso 1-tap ad alta velocità',
          badge: 'Gratis',
          colSpan: 1,
        },
        {
          id: 'reviews',
          enabled: true,
          order: 6,
          title: 'Ti è piaciuta la pizza?',
          subtitle: 'Aiutaci a scalare la classifica con 5 stelle su Google!',
          badge: 'Google 5',
          colSpan: 2,
        },
      ],
      footerNote: 'Impasti digeribili e farine macinate a pietra • Rivo Hub',
      bgType: 'image',
      bgImageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop',
      bgBlur: 7,
      bgOverlayOpacity: 65,
      bgGradientStops: ['#0c0f0d', '#220b0b'],
      borderRadius: '2xl',
    },
  },
  {
    id: 'tpl-botanica-brunch',
    name: 'Botanica & Brunch',
    author: 'Studio Botanica Milano',
    category: 'bar',
    styleTag: 'Bistrot & Brunch',
    description:
      'Freschezza organica e bio-design con verde smeraldo vivo, font Plus Jakarta Sans e card in vetro traslucido. Progettato per specialty coffee roasters, bakery artigianali, pancake house e pranzi salutari.',
    likesCount: 231,
    usageCount: 88,
    preview: {
      primaryColor: '#10B981',
      themeMode: 'dark',
      fontFamily: 'jakarta',
      cardStyle: 'glass',
      bgImageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop',
      modulesPreview: ['Brunch & Drink List', 'Wi-Fi Smart Working', 'Seguici su Instagram', 'Recensioni Google'],
    },
    createdAt: '2026-03-10T09:15:00Z',
    config: {
      fontFamily: 'jakarta',
      themeMode: 'dark',
      cardStyle: 'glass',
      primaryColor: '#10B981',
      accentGlow: true,
      tableBadgeLabel: 'Postazione Bistrot',
      tableLiveTag: 'ORGANIC HUB',
      hero: {
        enabled: true,
        title: 'Specialty Coffee & Brunch',
        subtitle: 'Avocado toast, pancake caldi e monorigini etiche estratte fresche',
        badgeText: 'Daily Fresh',
        destinationType: 'in_app',
      },
      modules: [
        {
          id: 'menu',
          enabled: true,
          order: 1,
          title: 'Brunch & Drink List',
          subtitle: 'Colazione d’autore, lunch bowl e dolci da forno',
          badge: 'Bio',
          colSpan: 2,
        },
        {
          id: 'wifi',
          enabled: true,
          order: 2,
          title: 'Wi-Fi Smart Working',
          subtitle: 'Banda ultra-larga con 1 tocco per lavorare sereni',
          badge: '1000Mbps',
          colSpan: 1,
        },
        {
          id: 'instagram',
          enabled: true,
          order: 3,
          title: 'Seguici su Instagram',
          subtitle: 'Taggaci nelle tue foto per apparire sulle nostre storie',
          badge: '@Botanica',
          colSpan: 1,
        },
        {
          id: 'service',
          enabled: true,
          order: 4,
          title: 'Chiama il Banco',
          subtitle: 'Ordina un altro flat white o richiedi il conto rapido',
          badge: 'Staff',
          colSpan: 1,
        },
        {
          id: 'loyalty',
          enabled: true,
          order: 5,
          title: 'Coffee Lover Card',
          subtitle: '10 caffè specialty = 1 tazza speciale in omaggio',
          badge: 'Fidelity',
          colSpan: 1,
        },
        {
          id: 'reviews',
          enabled: true,
          order: 6,
          title: 'Lascia una Recensione',
          subtitle: 'Supporta il nostro piccolo bistrot artigianale su Google',
          badge: 'Google',
          colSpan: 2,
        },
      ],
      footerNote: 'Caffè 100% Arabica e materie prime a km zero • Eco Friendly',
      bgType: 'image',
      bgImageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop',
      bgBlur: 8,
      bgOverlayOpacity: 60,
      bgGradientStops: ['#0c0f0d', '#0a2319'],
      borderRadius: '3xl',
    },
  },
  {
    id: 'tpl-neo-shibuya-2099',
    name: 'Neo-Shibuya 2099',
    author: 'CyberTokyo Lab',
    category: 'nightlife',
    styleTag: 'Cyberpunk Lounge',
    description:
      'Futurismo audace e clubbing d’avanguardia: tinte ciano neon elettrico su sfondo midnight navy, font DM Sans ad altissima leggibilità, bagliore diffuso e modulo DJ Set interattivo.',
    likesCount: 512,
    usageCount: 167,
    preview: {
      primaryColor: '#00F0FF',
      themeMode: 'midnight',
      fontFamily: 'dm_sans',
      cardStyle: 'neon',
      bgImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
      modulesPreview: ['AI Cocktail Selector', 'Cyber Drink List', 'VIP Table Call', 'Laser Wheel Bonus'],
    },
    createdAt: '2026-03-12T22:00:00Z',
    config: {
      fontFamily: 'dm_sans',
      themeMode: 'midnight',
      cardStyle: 'neon',
      primaryColor: '#00F0FF',
      accentGlow: true,
      tableBadgeLabel: 'VIP Neo Table',
      tableLiveTag: 'CYBER LIVE',
      hero: {
        enabled: true,
        title: 'Molecular Drinks & Laser Vibes',
        subtitle: 'Cocktail molecolari con fumo d’azoto e botaniche rare',
        badgeText: 'Neo Tokyo',
        destinationType: 'in_app',
      },
      modules: [
        {
          id: 'sommelier',
          enabled: true,
          order: 1,
          title: 'AI Cocktail Selector',
          subtitle: 'Algoritmo neurale per il tuo drink su misura',
          badge: 'Neural AI',
          colSpan: 2,
        },
        {
          id: 'menu',
          enabled: true,
          order: 2,
          title: 'Cyber Drink List',
          subtitle: 'Signature drink fosforescenti e shot molecolari',
          badge: 'Drinks',
          colSpan: 1,
        },
        {
          id: 'service',
          enabled: true,
          order: 3,
          title: 'VIP Table Call',
          subtitle: 'Richiesta hostess, bottiglie al tavolo e conto prioritario',
          badge: 'VIP Staff',
          colSpan: 1,
        },
        {
          id: 'wheel',
          enabled: true,
          order: 4,
          title: 'Laser Wheel Bonus',
          subtitle: 'Gira la ruota: vinci test-tube shot & gadget esclusivi',
          badge: 'Win 99%',
          colSpan: 1,
        },
        {
          id: 'wifi',
          enabled: true,
          order: 5,
          title: 'CyberNet Wi-Fi',
          subtitle: 'Connessione gigabit crittografata con 1 tap',
          badge: 'NFC Pass',
          colSpan: 1,
        },
        {
          id: 'instagram',
          enabled: true,
          order: 6,
          title: 'Cyber Community',
          subtitle: 'Live cam, DJ tracklist e tag social della serata',
          badge: '@NeoShibuya',
          colSpan: 2,
        },
      ],
      footerNote: 'Synthwave & Deep House ogni weekend • Rivo NFC Ultra',
      bgType: 'image',
      bgImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
      bgBlur: 8,
      bgOverlayOpacity: 55,
      bgGradientStops: ['#070b14', '#08253a'],
      borderRadius: 'md',
    },
  },
  {
    id: 'tpl-salsedine-tramonto',
    name: 'Salsedine & Tramonto',
    author: 'Capri Riviera Club',
    category: 'beach_club',
    styleTag: 'Beach Club & Sunset',
    description:
      'Il compagno perfetto per lidi balneari e terrazze vista mare: ordina direttamente dal lettino o cabina, scopri la drink list frozen e connettiti al Wi-Fi sulla spiaggia con 1 tocco.',
    likesCount: 378,
    usageCount: 142,
    preview: {
      primaryColor: '#06B6D4',
      themeMode: 'midnight',
      fontFamily: 'outfit',
      cardStyle: 'glass',
      bgImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
      modulesPreview: ['Ordina all’Ombrellone', 'Menù Lido & Poké', 'Wi-Fi Spiaggia', 'Beach Club Pass'],
    },
    createdAt: '2026-03-14T11:45:00Z',
    config: {
      fontFamily: 'outfit',
      themeMode: 'midnight',
      cardStyle: 'glass',
      primaryColor: '#06B6D4',
      accentGlow: true,
      tableBadgeLabel: 'Ombrellone / Lettino',
      tableLiveTag: 'SMART LIDO',
      hero: {
        enabled: true,
        title: 'Aperitivo Sunset & Fresh Food',
        subtitle: 'Cocktail ghiacciati, crudi di mare e frutta fresca al lettino',
        badgeText: 'Sunset Party',
        destinationType: 'in_app',
      },
      modules: [
        {
          id: 'service',
          enabled: true,
          order: 1,
          title: 'Ordina all’Ombrellone',
          subtitle: 'Il cameriere o bagnino consegna direttamente al tuo lettino',
          badge: '1-Tap',
          colSpan: 2,
        },
        {
          id: 'menu',
          enabled: true,
          order: 2,
          title: 'Menù Lido & Poké',
          subtitle: 'Pranzo vista mare, poké bowl e drink rinfrescanti',
          badge: 'Menù',
          colSpan: 1,
        },
        {
          id: 'wifi',
          enabled: true,
          order: 3,
          title: 'Wi-Fi Spiaggia',
          subtitle: 'Connessione sul bagnasciuga per tutta la giornata',
          badge: 'Gratis',
          colSpan: 1,
        },
        {
          id: 'wheel',
          enabled: true,
          order: 4,
          title: 'Ruota della Spiaggia',
          subtitle: 'Vinci una birra gelata, un ghiacciolo o un caffè',
          badge: 'Premio',
          colSpan: 1,
        },
        {
          id: 'loyalty',
          enabled: true,
          order: 5,
          title: 'Beach Club Pass',
          subtitle: 'Accumula ingressi per ricevere teli mare e drink gratuiti',
          badge: 'Club',
          colSpan: 1,
        },
        {
          id: 'reviews',
          enabled: true,
          order: 6,
          title: 'Valuta la Giornata al Lido',
          subtitle: 'Consiglia la nostra spiaggia su Google Reviews',
          badge: '5',
          colSpan: 2,
        },
      ],
      footerNote: 'Servizio attivo dalle 09:00 alle 20:30 • Rivo Beach Experience',
      bgType: 'image',
      bgImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
      bgBlur: 6,
      bgOverlayOpacity: 55,
      bgGradientStops: ['#070b14', '#0a2e38'],
      borderRadius: '3xl',
    },
  },
  {
    id: 'tpl-palazzo-grand-suite',
    name: 'Palazzo Grand Suite',
    author: 'Grand Heritage Hospitality',
    category: 'hotel',
    styleTag: 'Boutique Hotel & Spa',
    description:
      'Raffinatezza aristocratica e calore dell’ospitalità d’élite. Tipografia Playfair Display, room service 1-tap, concierge h24 su WhatsApp e guida d’autore alle bellezze segrete della città.',
    likesCount: 295,
    usageCount: 76,
    preview: {
      primaryColor: '#C084FC',
      themeMode: 'warm_charcoal',
      fontFamily: 'playfair',
      cardStyle: 'glass',
      bgImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop',
      modulesPreview: ['Concierge & Reception H24', 'Room Service & Champagne', 'Guida Segreta Città', 'Chat col Maggiordomo'],
    },
    createdAt: '2026-03-15T08:20:00Z',
    config: {
      fontFamily: 'playfair',
      themeMode: 'warm_charcoal',
      cardStyle: 'glass',
      primaryColor: '#C084FC',
      accentGlow: true,
      tableBadgeLabel: 'Camera / Suite',
      tableLiveTag: 'CONCIERGE LIVE',
      hero: {
        enabled: true,
        title: 'Suite Service & Spa Rituals',
        subtitle: 'Colazione d’alta pasticceria in camera e prenotazione percorsi benessere',
        badgeText: '5 Stars Luxury',
        destinationType: 'in_app',
      },
      modules: [
        {
          id: 'service',
          enabled: true,
          order: 1,
          title: 'Concierge & Reception H24',
          subtitle: 'Richiedi assistenza in camera, pulizia extra o sveglia',
          badge: 'H24',
          colSpan: 2,
        },
        {
          id: 'menu',
          enabled: true,
          order: 2,
          title: 'Room Service & Champagne',
          subtitle: 'Piatti gourmet e cantina serviti direttamente in suite',
          badge: 'Suite Carta',
          colSpan: 1,
        },
        {
          id: 'guide',
          enabled: true,
          order: 3,
          title: 'Guida Segreta alla Città',
          subtitle: 'I luoghi più esclusivi e riservati consigliati dalla direzione',
          badge: 'Guida VIP',
          colSpan: 1,
        },
        {
          id: 'whatsapp',
          enabled: true,
          order: 4,
          title: 'Chat con il Maggiordomo',
          subtitle: 'Comunica in tempo reale su WhatsApp con il nostro staff',
          badge: 'WhatsApp',
          colSpan: 1,
        },
        {
          id: 'wifi',
          enabled: true,
          order: 5,
          title: 'Wi-Fi Fibra Ultraveloce',
          subtitle: 'Connessione protetta per lavoro e intrattenimento in streaming',
          badge: 'Suite Net',
          colSpan: 1,
        },
        {
          id: 'reviews',
          enabled: true,
          order: 6,
          title: 'Valuta il Tuo Soggiorno',
          subtitle: 'Condividi l’esperienza con altri viaggiatori su Google e TripAdvisor',
          badge: '5',
          colSpan: 2,
        },
      ],
      footerNote: 'Servizio di Concierge & Valet sempre a Vostra disposizione • Rivo Luxury',
      bgType: 'image',
      bgImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop',
      bgBlur: 8,
      bgOverlayOpacity: 65,
      bgGradientStops: ['#141210', '#27192f'],
      borderRadius: '2xl',
    },
  },
];

const LOCAL_STORAGE_KEY = 'rivo_community_hub_templates';

/**
 * Carica i template predefiniti + eventuali template salvati o condivisi dall'utente.
 * Funziona sia in ambiente Client (localStorage + fallback) che SSR.
 */
export function getCommunityHubTemplates(): CommunityHubTemplate[] {
  if (typeof window === 'undefined') {
    return [...CURATED_COMMUNITY_TEMPLATES];
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [...CURATED_COMMUNITY_TEMPLATES];
    }
    const userTemplates = JSON.parse(raw);
    if (!Array.isArray(userTemplates)) {
      return [...CURATED_COMMUNITY_TEMPLATES];
    }

    // Filtra per evitare ID duplicati
    const curatedIds = new Set(CURATED_COMMUNITY_TEMPLATES.map((t) => t.id));
    const uniqueUserTemplates: CommunityHubTemplate[] = userTemplates.filter(
      (t): t is CommunityHubTemplate => Boolean(t && t.id && !curatedIds.has(t.id))
    );

    return [...uniqueUserTemplates, ...CURATED_COMMUNITY_TEMPLATES];
  } catch (err) {
    console.warn('[CommunityCatalog] Impossibile leggere i template locali:', err);
    return [...CURATED_COMMUNITY_TEMPLATES];
  }
}

/**
 * Condivide e salva un nuovo template nel catalogo community.
 * Lo memorizza in locale per disponibilità istantanea e tenta la sincronizzazione con l'API.
 */
export async function shareHubToCatalog(
  templateData: Omit<CommunityHubTemplate, 'id' | 'createdAt' | 'likesCount' | 'usageCount'>
): Promise<CommunityHubTemplate> {
  const cleanCategory = (templateData.category as BusinessCategory) || 'restaurant';
  const validatedConfig = mergeHubConfig(templateData.config, cleanCategory);

  const newTemplate: CommunityHubTemplate = {
    ...templateData,
    id: `hub-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    likesCount: 1,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    config: validatedConfig,
  };

  // 1. Salva in localStorage sul browser per reattività immediata
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const existing: CommunityHubTemplate[] = raw ? JSON.parse(raw) : [];
      const updated = [newTemplate, ...existing.filter((item) => item.id !== newTemplate.id)];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[CommunityCatalog] Errore salvataggio localStorage:', e);
    }
  }

  // 2. Tenta la sincronizzazione via API endpoint per la condivisione globale
  try {
    const response = await fetch('/api/community-catalog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTemplate),
    });

    if (response.ok) {
      const result = await response.json();
      if (result?.template) {
        return result.template as CommunityHubTemplate;
      }
    }
  } catch (netErr) {
    console.warn('[CommunityCatalog] Salvataggio server asincrono fallito, mantenuta copia locale:', netErr);
  }

  return newTemplate;
}

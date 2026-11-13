/**
 * Shared types, unguessable slug encoding/decoding, and vertical preset builders
 * for personalized prospect RIVO interactive previews (`/preview/[slug]`).
 *
 * Works identically in Server Components, Route Handlers, Client Components, and Vitest
 * without requiring Node-only crypto APIs or extra database migrations.
 */

export type DemoVerticalMode = 'food' | 'beauty' | 'hospitality' | 'retail';

export interface PublicRecommendedModuleDTO {
  moduleName: string;
  status: 'confirmed_opportunity' | 'plausible_opportunity' | 'not_verifiable';
  rationale: string;
}

export interface PublicProspectPreviewDTO {
  id: string;
  slug: string;
  businessName: string;
  logoUrl?: string | null;
  category: string;
  subcategory: string | null;
  city: string | null;
  province: string | null;
  region: string | null;
  address: string | null;
  vertical: DemoVerticalMode;
  recommendedModules: PublicRecommendedModuleDTO[];
}

export interface DemoMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  badge?: string;
}

export interface DemoSalonService {
  id: string;
  name: string;
  category: string;
  durationMin: number;
  price: number;
  description: string;
}

export interface DemoSalonStaff {
  id: string;
  name: string;
  role: string;
  specialty: string;
  color: string;
  slots: string[];
}

export interface DemoHospitalityService {
  id: string;
  title: string;
  subtitle: string;
  eta: string;
}

export interface DemoLocalGuideSpot {
  id: string;
  name: string;
  type: string;
  distance: string;
  highlight: string;
}

export interface DemoRetailProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  sizes: string[];
  inStockSizes: string[];
  description: string;
}

export const DEFAULT_APP_BASE_URL = 'https://rivo-app-ten.vercel.app';

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getPublicAppBaseUrl(override?: string): string {
  const raw =
    override ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_URL : undefined) ||
    DEFAULT_APP_BASE_URL;
  return raw.replace(/\/$/, '');
}

export function slugifyBusinessName(name: string): string {
  const normalized = (name || 'attivita')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return normalized || 'attivita';
}

function uuidToBytes(uuid: string): Uint8Array | null {
  if (!UUID_REGEX.test(uuid.trim())) return null;
  const hex = uuid.trim().replace(/-/g, '').toLowerCase();
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToUuid(bytes: Uint8Array): string | null {
  if (bytes.length !== 16) return null;
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  const formatted = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  return UUID_REGEX.test(formatted) ? formatted : null;
}

function encode16BytesToBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    out += BASE64URL_ALPHABET[b0 >> 2];
    out += BASE64URL_ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)];
    if (i + 1 < bytes.length) {
      out += BASE64URL_ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)];
    }
    if (i + 2 < bytes.length) {
      out += BASE64URL_ALPHABET[b2 & 0x3f];
    }
  }
  return out;
}

function decodeBase64UrlTo16Bytes(token: string): Uint8Array | null {
  if (token.length !== 22) return null;
  const values = new Array<number>(22);
  for (let i = 0; i < 22; i++) {
    const idx = BASE64URL_ALPHABET.indexOf(token[i]);
    if (idx === -1) return null;
    values[i] = idx;
  }

  // Last 2-char group carries byte 15 (6 bits + top 2 bits of the final base64url char).
  // Enforce canonical zero padding in the unused lower 4 bits of char 21.
  if ((values[21] & 0x0f) !== 0) return null;

  const bytes = new Uint8Array(16);
  let bi = 0;
  for (let i = 0; i < 18; i += 4) {
    const c0 = values[i];
    const c1 = values[i + 1];
    const c2 = values[i + 2];
    const c3 = values[i + 3];
    bytes[bi++] = (c0 << 2) | (c1 >> 4);
    bytes[bi++] = ((c1 & 0x0f) << 4) | (c2 >> 2);
    bytes[bi++] = ((c2 & 0x03) << 6) | c3;
  }
  bytes[15] = (values[20] << 2) | (values[21] >> 4);
  return bytes;
}

/**
 * Deterministically builds an unguessable, readable preview slug:
 * `<business-slug>--<22char-base64url-uuid>`.
 */
export function encodePreviewSlug(businessName: string, prospectId: string): string {
  const bytes = uuidToBytes(prospectId);
  const nameSlug = slugifyBusinessName(businessName);
  if (!bytes) {
    return `${nameSlug}--${encodeURIComponent(prospectId)}`;
  }
  return `${nameSlug}--${encode16BytesToBase64Url(bytes)}`;
}

/**
 * Decodes the prospect UUID from `/preview/[slug]`.
 * Accepts compact `<name>--<22char-token>`, bare 22-char token, `<name>-<uuid>`, or raw UUID.
 */
export function decodeProspectIdFromSlug(rawSlug: string): string | null {
  if (!rawSlug || typeof rawSlug !== 'string') return null;
  let cleaned = rawSlug.trim();
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // Keep raw string if malformed URI escape
  }

  if (UUID_REGEX.test(cleaned)) {
    return cleaned.toLowerCase();
  }

  if (cleaned.length > 36) {
    const tailUuid = cleaned.slice(-36);
    if (UUID_REGEX.test(tailUuid)) {
      return tailUuid.toLowerCase();
    }
  }

  const token = cleaned.includes('--') ? cleaned.split('--').pop() || '' : cleaned;
  const bytes = decodeBase64UrlTo16Bytes(token);
  return bytes ? bytesToUuid(bytes) : null;
}

export function buildProspectDemoUrl(
  businessName: string,
  prospectId: string,
  baseUrl?: string
): string {
  const base = getPublicAppBaseUrl(baseUrl);
  const slug = encodePreviewSlug(businessName, prospectId);
  return `${base}/preview/${slug}`;
}

export function resolveDemoVertical(category?: string | null, subcategory?: string | null): DemoVerticalMode {
  const combined = `${category || ''} ${subcategory || ''}`.toLowerCase();

  if (
    /barbier|barber|parruccier|hair|salon|estetic|beauty|nail|onicotec|spa|wellness|benessere|tatuag|tattoo/.test(
      combined
    )
  ) {
    return 'beauty';
  }

  if (/hotel|b&b|b&amp;b|ricettiv|hospitality|resort|agritur|affittacamer|ostell|villa/.test(combined)) {
    return 'hospitality';
  }

  if (/retail|negoz|boutique|abbigliamento|calzatur|scarpe|gioiell|ottica|shop|store|profumer/.test(combined)) {
    return 'retail';
  }

  return 'food';
}

export function getVerticalDefaultModules(vertical: DemoVerticalMode): PublicRecommendedModuleDTO[] {
  switch (vertical) {
    case 'beauty':
      return [
        {
          moduleName: 'Prenotazioni Smart & Agenda Poltrone',
          status: 'confirmed_opportunity',
          rationale: 'Permette ai clienti di scegliere trattamento, operatore e orario dal telefono in 20 secondi.',
        },
        {
          moduleName: 'Fidelity Card Digitale (Apple & Google Wallet)',
          status: 'confirmed_opportunity',
          rationale: 'Riduce le tessere cartacee e incentiva il ritorno ricorrente ogni 3-4 settimane.',
        },
        {
          moduleName: 'Google Review Shield + NFC al Banco',
          status: 'plausible_opportunity',
          rationale: 'Intercetta le recensioni positive verso Google e raccoglie in privato eventuali miglioramenti.',
        },
        {
          moduleName: 'Ruota Premi Post-Servizio',
          status: 'plausible_opportunity',
          rationale: 'Premia il cliente subito dopo il trattamento trasformando una visita singola in abitudine.',
        },
      ];
    case 'hospitality':
      return [
        {
          moduleName: '1-Tap Wi-Fi Ospiti & Hub Camera',
          status: 'confirmed_opportunity',
          rationale: 'Accesso Wi-Fi immediato da QR o tag NFC in camera, senza password complicate.',
        },
        {
          moduleName: 'Guida Locale Interattiva & Esperienze',
          status: 'confirmed_opportunity',
          rationale: 'Suggerisce ristoranti, transfer e luoghi del territorio direttamente marchiati dalla struttura.',
        },
        {
          moduleName: 'Richieste Reception & Room Service Live',
          status: 'plausible_opportunity',
          rationale: 'Centralizza richieste di colazione, late check-out o taxi in un pannello istantaneo.',
        },
        {
          moduleName: 'Raccolta Recensioni Post-Soggiorno',
          status: 'plausible_opportunity',
          rationale: 'Aumenta le recensioni verificate al check-out con zero frizione per l’ospite.',
        },
      ];
    case 'retail':
      return [
        {
          moduleName: 'Catalogo Interattivo & Richiesta Taglia',
          status: 'confirmed_opportunity',
          rationale: 'Il cliente verifica taglie/varianti e richiede l’articolo al commesso con un tocco.',
        },
        {
          moduleName: 'Fidelity Pass Digitale',
          status: 'confirmed_opportunity',
          rationale: 'Carta clienti sempre nello smartphone con saldo punti e vantaggi esclusivi.',
        },
        {
          moduleName: 'Ruota Premi in Cassa',
          status: 'plausible_opportunity',
          rationale: 'Aumenta lo scontrino medio e raccoglie contatti volontari per promozioni stagionali.',
        },
        {
          moduleName: 'Google Review Boost',
          status: 'plausible_opportunity',
          rationale: 'Invito rapido alla recensione subito dopo l’acquisto in negozio.',
        },
      ];
    case 'food':
    default:
      return [
        {
          moduleName: 'Carrello Tavolo Condiviso & Ordine NFC',
          status: 'confirmed_opportunity',
          rationale: 'Ogni commensale aggiunge dal proprio smartphone allo stesso tavolo senza scaricare app.',
        },
        {
          moduleName: 'Chiamata Cameriere & Conto Smart',
          status: 'confirmed_opportunity',
          rationale: 'Azzeramento attese al tavolo con divisione rapida del conto e richieste dirette alla sala.',
        },
        {
          moduleName: 'Google Review Shield & Feedback Privato',
          status: 'plausible_opportunity',
          rationale: 'Convoglia gli ospiti soddisfatti su Google Maps e gestisce internamente eventuali note critiche.',
        },
        {
          moduleName: 'Ruota Premi & Wi-Fi Lead Capture',
          status: 'plausible_opportunity',
          rationale: 'Cattura contatti clienti e incentiva il ritorno infrasettimanale con premi immediati.',
        },
      ];
  }
}

export function buildVerticalSandboxData(dto: PublicProspectPreviewDTO) {
  const combined = `${dto.category} ${dto.subcategory || ''}`.toLowerCase();
  const cityLabel = dto.city || 'Napoli';
  const isBarber = /barbier|barber/.test(combined);
  const isPizzeria = /pizz/.test(combined);
  const isBarPastry = /bar|pasticc|gelat|caff/.test(combined);

  const foodMenu: DemoMenuItem[] = isBarPastry
    ? [
        {
          id: 'item-1',
          name: 'Espresso Napoletano & Sfogliatella Calda',
          category: 'Caffetteria & Pasticceria',
          price: 4.5,
          description: 'Combo colazione signature servita al tavolo in 3 minuti.',
          badge: 'Più richiesto',
        },
        {
          id: 'item-2',
          name: 'Spritz Campano Agrumi & Olive',
          category: 'Aperitivi',
          price: 8.0,
          description: 'Con tagliere di taralli artigianali e rustici caldi.',
          badge: 'Aperitivo',
        },
        {
          id: 'item-3',
          name: 'Baba Artigianale al Rum Invecchiato',
          category: 'Caffetteria & Pasticceria',
          price: 5.0,
          description: 'Pasticceria fresca preparata ogni mattina in laboratorio.',
        },
        {
          id: 'item-4',
          name: 'Coppa Gelato 3 Gusti Artigianali',
          category: 'Gelateria',
          price: 5.5,
          description: 'Pistacchio di Bronte, nocciola e fiordilatte fresco.',
        },
      ]
    : isPizzeria
    ? [
        {
          id: 'item-1',
          name: 'Margherita Verace DOP',
          category: 'Pizze Classiche',
          price: 9.5,
          description: 'Pomodoro San Marzano DOP, fior di latte campano, basilico e olio EVO.',
          badge: 'Best Seller',
        },
        {
          id: 'item-2',
          name: 'Bufala, Datterini Gialli & Crudo',
          category: 'Pizze Speciali',
          price: 13.0,
          description: 'Impasto idratato 48h, mozzarella di bufala a crudo in uscita.',
          badge: 'Consigliata',
        },
        {
          id: 'item-3',
          name: 'Frittatina di Pasta Artigianale (x2)',
          category: 'Friggitoria',
          price: 7.0,
          description: 'Besciamella fatta in casa, piselli, prosciutto e provola affumicata.',
        },
        {
          id: 'item-4',
          name: 'Birra Artigianale Chiara 33cl',
          category: 'Bevande',
          price: 5.5,
          description: 'Bassa fermentazione fresca, abbinamento ideale per pizza.',
        },
      ]
    : [
        {
          id: 'item-1',
          name: 'Antipasto della Casa per 2',
          category: 'Antipasti',
          price: 16.0,
          description: 'Selezione del giorno con prodotti locali di stagione e pane caldo.',
          badge: 'Più scelto',
        },
        {
          id: 'item-2',
          name: 'Paccheri al Pomodorino del Piennolo',
          category: 'Primi Piatti',
          price: 15.5,
          description: 'Pasta trafilata al bronzo con basilico fresco e scaglie stagionate.',
          badge: 'Signature',
        },
        {
          id: 'item-3',
          name: 'Tagliata con Rucola e Scaglie',
          category: 'Secondi',
          price: 21.0,
          description: 'Cottura su piastra rovente con riduzione al balsamico.',
        },
        {
          id: 'item-4',
          name: 'Calice Vino Rosso Locale + Acqua',
          category: 'Bevande',
          price: 8.5,
          description: 'Selezione della cantina consigliata per l’abbinamento.',
        },
      ];

  const beautyServices: DemoSalonService[] = isBarber
    ? [
        {
          id: 'srv-1',
          name: 'Taglio Uomo & Styling',
          category: 'Capelli',
          durationMin: 30,
          price: 25,
          description: 'Consulenza look, taglio forbice/sfumatura, lavaggio e finish.',
        },
        {
          id: 'srv-2',
          name: 'Combo Taglio + Barba Panno Caldo',
          category: 'Combo Signature',
          durationMin: 45,
          price: 38,
          description: 'Esperienza completa con panno caldo agli oli essenziali e balsamo.',
        },
        {
          id: 'srv-3',
          name: 'Modellatura Barba & Rasatura',
          category: 'Barba',
          durationMin: 20,
          price: 18,
          description: 'Definizione contorni a lama e trattamento lenitivo post-rasatura.',
        },
        {
          id: 'srv-4',
          name: 'Trattamento Black Mask & Pulizia Viso',
          category: 'Viso',
          durationMin: 25,
          price: 20,
          description: 'Detossinazione rapida in poltrona dopo il taglio.',
        },
      ]
    : [
        {
          id: 'srv-1',
          name: 'Taglio, Lavaggio & Piega Moda',
          category: 'Styling',
          durationMin: 45,
          price: 35,
          description: 'Consulenza morfologica personalizzata con trattamento idratante.',
        },
        {
          id: 'srv-2',
          name: 'Colore & Sfumature Naturali',
          category: 'Colore',
          durationMin: 90,
          price: 75,
          description: 'Colorazione delicata senza ammoniaca con gloss illuminante.',
        },
        {
          id: 'srv-3',
          name: 'Trattamento Ristrutturante Cheratina',
          category: 'Cura Capelli',
          durationMin: 40,
          price: 42,
          description: 'Sigillatura cuticole anti-crespo ad alta lucentezza.',
        },
        {
          id: 'srv-4',
          name: 'Manicure Semipermanente Rinforzata',
          category: 'Estetica & Nail',
          durationMin: 45,
          price: 32,
          description: 'Preparazione precisa cuticole e finitura long-lasting.',
        },
      ];

  const beautyStaff: DemoSalonStaff[] = isBarber
    ? [
        {
          id: 'stf-1',
          name: 'Lorenzo M.',
          role: 'Master Barber',
          specialty: 'Fade & Tagli Classici',
          color: '#BFFF00',
          slots: ['10:30', '11:30', '15:00', '17:30', '18:30'],
        },
        {
          id: 'stf-2',
          name: 'Davide R.',
          role: 'Senior Barber',
          specialty: 'Barba Panno Caldo & Razor',
          color: '#38BDF8',
          slots: ['10:00', '12:00', '16:00', '17:00', '19:00'],
        },
        {
          id: 'stf-3',
          name: 'Marco V.',
          role: 'Stylist Specialist',
          specialty: 'Texturized Crop & Viso',
          color: '#F59E0B',
          slots: ['11:00', '14:30', '16:30', '18:00'],
        },
      ]
    : [
        {
          id: 'stf-1',
          name: 'Giulia F.',
          role: 'Art Director',
          specialty: 'Balayage & Taglio',
          color: '#BFFF00',
          slots: ['10:00', '11:30', '15:00', '17:00'],
        },
        {
          id: 'stf-2',
          name: 'Chiara S.',
          role: 'Color & Care Specialist',
          specialty: 'Gloss & Trattamenti',
          color: '#38BDF8',
          slots: ['09:30', '12:00', '16:00', '18:00'],
        },
        {
          id: 'stf-3',
          name: 'Elena D.',
          role: 'Beauty & Nail Specialist',
          specialty: 'Viso & Semipermanente',
          color: '#A78BFA',
          slots: ['10:30', '14:30', '16:30', '18:30'],
        },
      ];

  const hospitalityServices: DemoHospitalityService[] = [
    {
      id: 'hosp-1',
      title: 'Colazione Servita in Camera (08:30)',
      subtitle: 'Croissant caldi, spremuta e caffetteria espresso',
      eta: 'Conferma istantanea',
    },
    {
      id: 'hosp-2',
      title: 'Late Check-out fino alle 13:00',
      subtitle: 'Verifica disponibilità camera con un tap',
      eta: 'Risposta in 5 min',
    },
    {
      id: 'hosp-3',
      title: `Transfer / Taxi Stazione & Aeroporto`,
      subtitle: `Servizio privato dedicato a ${cityLabel}`,
      eta: 'Prenotazione prioritaria',
    },
    {
      id: 'hosp-4',
      title: 'Kit Asciugamani Extra & Cuscino Soft',
      subtitle: 'Richiesta diretta al team housekeeping',
      eta: 'Entro 15 min',
    },
  ];

  const hospitalityGuide: DemoLocalGuideSpot[] = [
    {
      id: 'guide-1',
      name: `Centro Storico di ${cityLabel}`,
      type: 'Itinerario a piedi',
      distance: '8 min',
      highlight: 'Percorso consigliato dalla struttura per evitare le fasce affollate.',
    },
    {
      id: 'guide-2',
      name: 'Trattoria Convenzionata (Sconto Ospiti -10%)',
      type: 'Food & Tipicità',
      distance: '4 min',
      highlight: 'Mostra il pass digitale della struttura all’arrivo.',
    },
    {
      id: 'guide-3',
      name: 'Belvedere & Tramonto Panoramico',
      type: 'Esperienza Consigliata',
      distance: '12 min',
      highlight: 'Orario suggerito: 18:15 con prenotazione aperitivo.',
    },
  ];

  const retailProducts: DemoRetailProduct[] = [
    {
      id: 'ret-1',
      name: 'Giacca Sartoriale Stagionale',
      category: 'Nuova Collezione',
      price: 149,
      sizes: ['S', 'M', 'L', 'XL'],
      inStockSizes: ['S', 'M', 'XL'],
      description: 'Tessuto traspirante premium, vestibilità moderna.',
    },
    {
      id: 'ret-2',
      name: 'Sneaker Artigianale Pelle Italiana',
      category: 'Calzature',
      price: 129,
      sizes: ['40', '41', '42', '43', '44'],
      inStockSizes: ['40', '42', '43'],
      description: 'Suola cucita e plantare comfort ad alta densità.',
    },
    {
      id: 'ret-3',
      name: 'Accessorio Signature Limited',
      category: 'Accessori',
      price: 59,
      sizes: ['Unica'],
      inStockSizes: ['Unica'],
      description: 'Edizione curata disponibile per prova immediata in store.',
    },
  ];

  return {
    foodMenu,
    beautyServices,
    beautyStaff,
    hospitalityServices,
    hospitalityGuide,
    retailProducts,
    wheelPrizes: [
      { label: 'Caffè / Bibita Omaggio', code: 'RIVO-FREE' },
      { label: '-10% Prossima Visita', code: 'RIVO-10' },
      { label: 'Upgrade Servizio VIP', code: 'RIVO-VIP' },
      { label: 'Omaggio Sorpresa al Banco', code: 'RIVO-GIFT' },
    ],
  };
}

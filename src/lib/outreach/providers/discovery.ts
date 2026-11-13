/**
 * RIVO OUTREACH — Modular Business Data Acquisition Providers (`BusinessDataProvider`)
 *
 * Prioritizes official Google Maps & Live Cartographic discovery centered on Napoli
 * & Campania (up to 120 km wide-range radius), with OpenStreetMap multi-mirror failover
 * and non-intrusive public website metadata inspection.
 */

import { findSubcategoryDef, type PublicDigitalSignals } from '../types';
import { extractWebsiteDomain, normalizeBusinessName } from '../deduplication';
import { buildGoogleFaviconUrl, extractLogoCandidateFromHtml } from '../logo-resolver';

export interface CampaniaGeoPreset {
  id: string;
  label: string;
  query: string;
  lat: number;
  lon: number;
  radiusKm: number;
  city: string;
  province: string;
  region: string;
}

export const CAMPANIA_GEO_PRESETS: CampaniaGeoPreset[] = [
  {
    id: 'napoli_centro',
    label: 'Napoli Centro & Lungomare',
    query: 'Napoli',
    lat: 40.8518,
    lon: 14.2681,
    radiusKm: 10,
    city: 'Napoli',
    province: 'NA',
    region: 'Campania',
  },
  {
    id: 'napoli_metro',
    label: 'Napoli & Area Metropolitana',
    query: 'Napoli',
    lat: 40.8518,
    lon: 14.2681,
    radiusKm: 25,
    city: 'Napoli',
    province: 'NA',
    region: 'Campania',
  },
  {
    id: 'campania_wide',
    label: 'Campania Lungo Raggio (Regionale)',
    query: 'Campania',
    lat: 40.88,
    lon: 14.48,
    radiusKm: 75,
    city: 'Napoli',
    province: 'NA',
    region: 'Campania',
  },
  {
    id: 'vomero_chiaia_posillipo',
    label: 'Vomero, Chiaia & Posillipo',
    query: 'Vomero, Napoli',
    lat: 40.8405,
    lon: 14.2285,
    radiusKm: 6,
    city: 'Napoli',
    province: 'NA',
    region: 'Campania',
  },
  {
    id: 'salerno_costiera',
    label: 'Salerno & Costiera Amalfitana',
    query: 'Salerno',
    lat: 40.6824,
    lon: 14.7681,
    radiusKm: 30,
    city: 'Salerno',
    province: 'SA',
    region: 'Campania',
  },
  {
    id: 'sorrento_pompei',
    label: 'Penisola Sorrentina, Pompei & Stabia',
    query: 'Sorrento',
    lat: 40.6263,
    lon: 14.3758,
    radiusKm: 22,
    city: 'Sorrento',
    province: 'NA',
    region: 'Campania',
  },
  {
    id: 'caserta_aversa',
    label: 'Caserta, Aversa & Terra di Lavoro',
    query: 'Caserta',
    lat: 41.0726,
    lon: 14.3311,
    radiusKm: 30,
    city: 'Caserta',
    province: 'CE',
    region: 'Campania',
  },
  {
    id: 'flegrea_isole',
    label: 'Pozzuoli, Campi Flegrei, Ischia & Capri',
    query: 'Pozzuoli',
    lat: 40.8234,
    lon: 14.12,
    radiusKm: 20,
    city: 'Pozzuoli',
    province: 'NA',
    region: 'Campania',
  },
  {
    id: 'avellino_benevento',
    label: 'Avellino, Benevento & Aree Interne',
    query: 'Avellino',
    lat: 40.9144,
    lon: 14.7906,
    radiusKm: 40,
    city: 'Avellino',
    province: 'AV',
    region: 'Campania',
  },
];

interface CityGeoEntry {
  lat: number;
  lon: number;
  city: string;
  province: string;
  region: string;
}

const KNOWN_ITALIAN_LOCATIONS: Record<string, CityGeoEntry> = {
  napoli: { lat: 40.8518, lon: 14.2681, city: 'Napoli', province: 'NA', region: 'Campania' },
  naples: { lat: 40.8518, lon: 14.2681, city: 'Napoli', province: 'NA', region: 'Campania' },
  campania: { lat: 40.88, lon: 14.48, city: 'Napoli', province: 'NA', region: 'Campania' },
  salerno: { lat: 40.6824, lon: 14.7681, city: 'Salerno', province: 'SA', region: 'Campania' },
  caserta: { lat: 41.0726, lon: 14.3311, city: 'Caserta', province: 'CE', region: 'Campania' },
  avellino: { lat: 40.9144, lon: 14.7906, city: 'Avellino', province: 'AV', region: 'Campania' },
  benevento: { lat: 41.1297, lon: 14.7826, city: 'Benevento', province: 'BN', region: 'Campania' },
  sorrento: { lat: 40.6263, lon: 14.3758, city: 'Sorrento', province: 'NA', region: 'Campania' },
  amalfi: { lat: 40.634, lon: 14.6027, city: 'Amalfi', province: 'SA', region: 'Campania' },
  positano: { lat: 40.6281, lon: 14.485, city: 'Positano', province: 'SA', region: 'Campania' },
  pompei: { lat: 40.7462, lon: 14.4989, city: 'Pompei', province: 'NA', region: 'Campania' },
  pozzuoli: { lat: 40.8234, lon: 14.12, city: 'Pozzuoli', province: 'NA', region: 'Campania' },
  ischia: { lat: 40.7317, lon: 13.9491, city: 'Ischia', province: 'NA', region: 'Campania' },
  capri: { lat: 40.5507, lon: 14.2225, city: 'Capri', province: 'NA', region: 'Campania' },
  procida: { lat: 40.7614, lon: 14.0185, city: 'Procida', province: 'NA', region: 'Campania' },
  aversa: { lat: 40.9736, lon: 14.2089, city: 'Aversa', province: 'CE', region: 'Campania' },
  giugliano: { lat: 40.9284, lon: 14.1977, city: 'Giugliano in Campania', province: 'NA', region: 'Campania' },
  'giugliano in campania': { lat: 40.9284, lon: 14.1977, city: 'Giugliano in Campania', province: 'NA', region: 'Campania' },
  'torre del greco': { lat: 40.788, lon: 14.365, city: 'Torre del Greco', province: 'NA', region: 'Campania' },
  portici: { lat: 40.8194, lon: 14.3411, city: 'Portici', province: 'NA', region: 'Campania' },
  ercolano: { lat: 40.8069, lon: 14.3519, city: 'Ercolano', province: 'NA', region: 'Campania' },
  'castellammare di stabia': { lat: 40.6952, lon: 14.485, city: 'Castellammare di Stabia', province: 'NA', region: 'Campania' },
  nola: { lat: 40.9261, lon: 14.5284, city: 'Nola', province: 'NA', region: 'Campania' },
  casoria: { lat: 40.9062, lon: 14.2913, city: 'Casoria', province: 'NA', region: 'Campania' },
  afragola: { lat: 40.9241, lon: 14.3095, city: 'Afragola', province: 'NA', region: 'Campania' },
  acerra: { lat: 40.945, lon: 14.3712, city: 'Acerra', province: 'NA', region: 'Campania' },
  "cava de' tirreni": { lat: 40.7003, lon: 14.7061, city: "Cava de' Tirreni", province: 'SA', region: 'Campania' },
  battipaglia: { lat: 40.6126, lon: 14.98, city: 'Battipaglia', province: 'SA', region: 'Campania' },
  vomero: { lat: 40.8442, lon: 14.2307, city: 'Napoli', province: 'NA', region: 'Campania' },
  'vomero, napoli': { lat: 40.8442, lon: 14.2307, city: 'Napoli', province: 'NA', region: 'Campania' },
  chiaia: { lat: 40.8348, lon: 14.2325, city: 'Napoli', province: 'NA', region: 'Campania' },
  posillipo: { lat: 40.8129, lon: 14.205, city: 'Napoli', province: 'NA', region: 'Campania' },
  fuorigrotta: { lat: 40.8242, lon: 14.1912, city: 'Napoli', province: 'NA', region: 'Campania' },
  roma: { lat: 41.9028, lon: 12.4964, city: 'Roma', province: 'RM', region: 'Lazio' },
  milano: { lat: 45.4642, lon: 9.19, city: 'Milano', province: 'MI', region: 'Lombardia' },
  torino: { lat: 45.0703, lon: 7.6869, city: 'Torino', province: 'TO', region: 'Piemonte' },
  bari: { lat: 41.1171, lon: 16.8719, city: 'Bari', province: 'BA', region: 'Puglia' },
  firenze: { lat: 43.7696, lon: 11.2558, city: 'Firenze', province: 'FI', region: 'Toscana' },
  bologna: { lat: 44.4949, lon: 11.3426, city: 'Bologna', province: 'BO', region: 'Emilia-Romagna' },
};

const RIVO_USER_AGENT = 'RIVO-Outreach-Business-Intelligence/1.0 (https://rivo.app; compliance@rivo.app)';

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export interface ResolvedCoordinates {
  lat: number;
  lon: number;
  city: string;
  province: string | null;
  region: string | null;
}

/**
 * Resolves a location query or custom map coordinates cleanly, using an instant
 * local dictionary for Campania & major Italian cities before falling back to Nominatim.
 */
export async function resolveLocationCoordinates(
  locationQuery: string,
  customLat?: number | null,
  customLon?: number | null
): Promise<ResolvedCoordinates> {
  const cleanQuery = (locationQuery || 'Napoli').trim();

  if (
    typeof customLat === 'number' &&
    typeof customLon === 'number' &&
    Number.isFinite(customLat) &&
    Number.isFinite(customLon) &&
    Math.abs(customLat) <= 90 &&
    Math.abs(customLon) <= 180
  ) {
    const key = cleanQuery.toLowerCase();
    const known = KNOWN_ITALIAN_LOCATIONS[key];
    return {
      lat: customLat,
      lon: customLon,
      city: known?.city || cleanQuery || 'Napoli',
      province: known?.province || null,
      region: known?.region || (customLat >= 39.9 && customLat <= 41.6 && customLon >= 13.7 && customLon <= 15.8 ? 'Campania' : null),
    };
  }

  const normalizedKey = cleanQuery.toLowerCase().replace(/\s+/g, ' ');
  const exactKnown = KNOWN_ITALIAN_LOCATIONS[normalizedKey];
  if (exactKnown) {
    return exactKnown;
  }

  // Substring match for phrases like "Napoli Centro" or "Salerno Mare"
  for (const [key, entry] of Object.entries(KNOWN_ITALIAN_LOCATIONS)) {
    if (normalizedKey.includes(key)) {
      return entry;
    }
  }

  // Fallback to Nominatim Geocoding (Italy biased)
  const geoUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&countrycodes=it&q=${encodeURIComponent(
    cleanQuery
  )}`;
  const geoController = new AbortController();
  const geoTimer = setTimeout(() => geoController.abort(), 7000);

  try {
    const geoRes = await fetch(geoUrl, {
      headers: {
        'User-Agent': RIVO_USER_AGENT,
        'Accept-Language': 'it',
      },
      signal: geoController.signal,
    });
    clearTimeout(geoTimer);

    if (geoRes.ok) {
      const geoData = (await geoRes.json()) as any[];
      if (Array.isArray(geoData) && geoData.length > 0) {
        const top = geoData[0];
        const lat = parseFloat(top.lat);
        const lon = parseFloat(top.lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          const addr = top.address || {};
          return {
            lat,
            lon,
            city: addr.city || addr.town || addr.village || addr.municipality || cleanQuery,
            province: addr.county || addr.province || null,
            region: addr.state || null,
          };
        }
      }
    }
  } catch {
    clearTimeout(geoTimer);
  }

  // Resilient default fallback: Napoli Centro
  return {
    lat: 40.8518,
    lon: 14.2681,
    city: cleanQuery || 'Napoli',
    province: 'NA',
    region: 'Campania',
  };
}

/**
 * Haversine distance between two WGS84 coordinates in kilometers (1 decimal).
 */
export function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Builds an official clickable Google Maps link for a business or coordinate pair.
 */
export function buildGoogleMapsUrl(
  name: string,
  address?: string | null,
  city?: string | null,
  lat?: number | null,
  lon?: number | null
): string {
  const queryParts = [name, address, city].filter((p): p is string => Boolean(p && p.trim()));
  if (queryParts.length > 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts.join(', '))}`;
  }
  if (typeof lat === 'number' && typeof lon === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  }
  return 'https://www.google.com/maps/search/?api=1&query=Napoli';
}

export interface DiscoveredBusinessCandidate {
  business_name: string;
  normalized_name: string;
  category: string;
  subcategory: string;
  city: string | null;
  province: string | null;
  region: string | null;
  address: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  website_domain: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  business_phone: string | null;
  business_email: string | null;
  description: string | null;
  services_offered: string[];
  digital_signals: PublicDigitalSignals;
  source: string;
  source_reference: string | null;
  source_acquired_at: string;
}

export interface BusinessSearchParams {
  locationQuery: string;
  radiusKm: number;
  centerLat?: number | null;
  centerLon?: number | null;
  category: string;
  subcategory: string;
  maxResults: number;
  enrichWebsites?: boolean;
}

export interface BusinessProviderSearchResult {
  providerId: string;
  providerName: string;
  attribution: string;
  candidates: DiscoveredBusinessCandidate[];
  warnings: string[];
  center?: ResolvedCoordinates;
}

export interface BusinessDataProvider {
  id: string;
  name: string;
  providerType: 'openstreetmap' | 'google_places' | 'public_website' | 'manual';
  attribution: string;
  isConfigured(): boolean;
  search(params: BusinessSearchParams): Promise<BusinessProviderSearchResult>;
}

/**
 * Safe public website metadata enrichment.
 */
export async function inspectPublicWebsiteMetadata(rawUrl: string): Promise<PublicDigitalSignals> {
  const signals: PublicDigitalSignals = {
    websiteTitle: null,
    websiteDescription: null,
    logoUrl: null,
    detectedBookingLinks: [],
    detectedMenuLinks: [],
    detectedSocialLinks: [],
    httpStatus: null,
    inspectedAt: new Date().toISOString(),
  };

  if (!rawUrl || !rawUrl.trim()) return signals;
  const targetUrl = /^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;
  signals.logoUrl = buildGoogleFaviconUrl(targetUrl);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': RIVO_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    signals.httpStatus = res.status;
    if (!res.ok) return signals;

    const html = (await res.text()).slice(0, 100000);
    const resolvedBaseUrl = res.url || targetUrl;
    signals.logoUrl =
      extractLogoCandidateFromHtml(html, resolvedBaseUrl) ||
      buildGoogleFaviconUrl(resolvedBaseUrl) ||
      signals.logoUrl;

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch?.[1]) {
      signals.websiteTitle = titleMatch[1].replace(/\s+/g, ' ').trim().slice(0, 180);
    }

    const descMatch =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) ||
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);

    if (descMatch?.[1]) {
      signals.websiteDescription = descMatch[1].replace(/\s+/g, ' ').trim().slice(0, 320);
    }

    const hrefRegex = /href=["'](https?:\/\/[^"'#\s]+|\/[^"'#\s]+)["']/gi;
    const bookingLinks = new Set<string>();
    const menuLinks = new Set<string>();
    const socialLinks = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = hrefRegex.exec(html)) !== null) {
      const link = match[1];
      const lower = link.toLowerCase();

      if (lower.includes('instagram.com/') || lower.includes('facebook.com/')) {
        if (link.startsWith('http')) socialLinks.add(link.slice(0, 200));
      }
      if (
        lower.includes('prenot') ||
        lower.includes('book') ||
        lower.includes('thefork') ||
        lower.includes('treatwell') ||
        lower.includes('fresha') ||
        lower.includes('calendly') ||
        lower.includes('upera') ||
        lower.includes('plateform')
      ) {
        bookingLinks.add(link.slice(0, 200));
      }
      if (lower.includes('menu') || lower.includes('carta-vini') || lower.includes('listino')) {
        menuLinks.add(link.slice(0, 200));
      }
    }

    signals.detectedBookingLinks = Array.from(bookingLinks).slice(0, 5);
    signals.detectedMenuLinks = Array.from(menuLinks).slice(0, 5);
    signals.detectedSocialLinks = Array.from(socialLinks).slice(0, 5);
  } catch {
    // Non-blocking
  }

  return signals;
}

export interface SubcategorySearchPlan {
  nominatimQueries: string[];
  photonKeywords: string[];
}

export const SUBCATEGORY_SEARCH_PLAN: Record<string, SubcategorySearchPlan> = {
  restaurant: {
    nominatimQueries: ['[amenity=restaurant]', 'ristorante'],
    photonKeywords: ['ristorante', 'trattoria', 'osteria'],
  },
  pizzeria: {
    nominatimQueries: ['pizzeria', '[cuisine=pizza]', '[amenity=restaurant]'],
    photonKeywords: ['pizzeria', 'pizza'],
  },
  bar: {
    nominatimQueries: ['[amenity=bar]', '[amenity=cafe]'],
    photonKeywords: ['bar', 'caffetteria', 'caffe'],
  },
  gelateria: {
    nominatimQueries: ['[amenity=ice_cream]', 'gelateria'],
    photonKeywords: ['gelateria', 'gelato'],
  },
  pasticceria: {
    nominatimQueries: ['[shop=pastry]', '[shop=bakery]', 'pasticceria'],
    photonKeywords: ['pasticceria', 'bakery', 'dolceria'],
  },
  salon: {
    nominatimQueries: ['[shop=hairdresser]', 'parrucchiere'],
    photonKeywords: ['parrucchiere', 'hair', 'acconciature'],
  },
  barber: {
    nominatimQueries: ['barber', 'barbiere', '[shop=hairdresser]'],
    photonKeywords: ['barber', 'barbiere', 'barberia', 'parrucchiere'],
  },
  beauty: {
    nominatimQueries: ['[shop=beauty]', 'centro estetico'],
    photonKeywords: ['centro estetico', 'estetica', 'beauty', 'spa'],
  },
  nail_salon: {
    nominatimQueries: ['nail', 'unghie', '[shop=beauty]'],
    photonKeywords: ['nail', 'nails', 'unghie', 'estetica'],
  },
  hotel: {
    nominatimQueries: ['[tourism=hotel]', 'hotel'],
    photonKeywords: ['hotel', 'albergo'],
  },
  bnb: {
    nominatimQueries: ['[tourism=guest_house]', 'affittacamere', 'bed and breakfast'],
    photonKeywords: ['b&b', 'guest house', 'suites', 'affittacamere'],
  },
  bb: {
    nominatimQueries: ['[tourism=guest_house]', 'affittacamere', 'bed and breakfast'],
    photonKeywords: ['b&b', 'guest house', 'suites', 'affittacamere'],
  },
  hospitality_other: {
    nominatimQueries: ['[tourism=guest_house]', '[tourism=hotel]', 'resort'],
    photonKeywords: ['resort', 'relais', 'residence', 'casa vacanze'],
  },
};

export function getSubcategorySearchPlan(subIdOrCat: string): SubcategorySearchPlan {
  const key = (subIdOrCat || '').toLowerCase().trim();
  if (SUBCATEGORY_SEARCH_PLAN[key]) return SUBCATEGORY_SEARCH_PLAN[key];
  if (key.includes('beauty')) return SUBCATEGORY_SEARCH_PLAN.beauty;
  if (key.includes('hospitality')) return SUBCATEGORY_SEARCH_PLAN.hotel;
  return SUBCATEGORY_SEARCH_PLAN.restaurant;
}

/**
 * Helper to fetch Overpass in parallel across mirrors with a fast 4s timeout.
 */
async function queryOverpassWithFailover(overpassQuery: string): Promise<any[]> {
  try {
    return await Promise.any(
      OVERPASS_MIRRORS.map(async (mirror) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        try {
          const res = await fetch(mirror, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': RIVO_USER_AGENT,
            },
            body: `data=${encodeURIComponent(overpassQuery)}`,
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (Array.isArray(json?.elements)) {
            return json.elements as any[];
          }
          throw new Error('No elements array');
        } catch (err) {
          clearTimeout(timer);
          throw err;
        }
      })
    );
  } catch {
    return [];
  }
}

/**
 * Sequential Nominatim search using structured OSM bracketed tags & keywords
 * bounded to the search viewbox, with an unbounded fallback for small towns.
 */
async function queryNominatimCategoryPlaces(
  subId: string,
  center: ResolvedCoordinates,
  radiusKm: number,
  limit = 40
): Promise<any[]> {
  const plan = getSubcategorySearchPlan(subId);
  const effectiveRadius = Math.max(8, radiusKm);
  const degLat = Math.max(0.06, Math.min(1.15, effectiveRadius / 111));
  const degLon = Math.max(
    0.08,
    Math.min(1.45, effectiveRadius / (111 * Math.cos((center.lat * Math.PI) / 180)))
  );
  const viewbox = `${(center.lon - degLon).toFixed(4)},${(center.lat + degLat).toFixed(4)},${(
    center.lon + degLon
  ).toFixed(4)},${(center.lat - degLat).toFixed(4)}`;

  const results: any[] = [];
  for (const nq of plan.nominatimQueries) {
    if (results.length >= limit) break;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&extratags=1&addressdetails=1&countrycodes=it&viewbox=${viewbox}&bounded=1&limit=35&q=${encodeURIComponent(
        nq
      )}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': RIVO_USER_AGENT,
          'Accept-Language': 'it',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          results.push(...data);
        }
      }
    } catch {
      clearTimeout(timer);
    }
  }

  if (results.length < 5 && plan.nominatimQueries.length > 0) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const fallbackQ = `${plan.nominatimQueries[0]} ${center.city}`;
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&extratags=1&addressdetails=1&countrycodes=it&bounded=0&limit=35&q=${encodeURIComponent(
        fallbackQ
      )}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': RIVO_USER_AGENT,
          'Accept-Language': 'it',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          results.push(...data);
        }
      }
    } catch {
      clearTimeout(timer);
    }
  }

  return results;
}

/**
 * Parallel Photon (Komoot) GeoJSON search within the area bounding box.
 */
async function queryPhotonCategoryPlaces(
  subId: string,
  center: ResolvedCoordinates,
  radiusKm: number,
  limit = 40
): Promise<any[]> {
  const plan = getSubcategorySearchPlan(subId);
  const effectiveRadius = Math.max(8, radiusKm);
  const degLat = Math.max(0.06, Math.min(1.15, effectiveRadius / 111));
  const degLon = Math.max(
    0.08,
    Math.min(1.45, effectiveRadius / (111 * Math.cos((center.lat * Math.PI) / 180)))
  );
  const bbox = `${(center.lon - degLon).toFixed(4)},${(center.lat - degLat).toFixed(4)},${(
    center.lon + degLon
  ).toFixed(4)},${(center.lat + degLat).toFixed(4)}`;

  const validKeys = new Set(['shop', 'amenity', 'tourism', 'craft', 'leisure', 'office']);
  const maxDistKm = Math.max(radiusKm * 1.25, 15);

  const batches = await Promise.all(
    plan.photonKeywords.map(async (kw) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          kw
        )}&bbox=${bbox}&lat=${center.lat}&lon=${center.lon}&limit=25`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': RIVO_USER_AGENT,
          },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json?.features) ? (json.features as any[]) : [];
      } catch {
        clearTimeout(timer);
        return [];
      }
    })
  );

  const filtered: any[] = [];
  for (const feat of batches.flat()) {
    const props = feat?.properties || {};
    const coords = feat?.geometry?.coordinates;
    if (!props.name || !String(props.name).trim()) continue;
    if (!validKeys.has(props.osm_key)) continue;
    if (!Array.isArray(coords) || coords.length < 2) continue;

    const lon = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const dist = computeDistanceKm(center.lat, center.lon, lat, lon);
    if (props.countrycode === 'IT' || dist <= maxDistKm) {
      if (dist <= maxDistKm) {
        filtered.push(feat);
      }
    }
    if (filtered.length >= limit * 2) break;
  }

  return filtered;
}

// ============================================================================
// 1. Live Cartographic & OpenStreetMap Provider (Campania Wide-Range Ready)
// ============================================================================

export class OpenStreetMapOverpassProvider implements BusinessDataProvider {
  id = 'openstreetmap_odbl';
  name = 'Maps Cartografico & OpenStreetMap (Campania Live)';
  providerType = 'openstreetmap' as const;
  attribution = '© OpenStreetMap contributors — Open Database License (ODbL)';

  isConfigured(): boolean {
    return true;
  }

  async search(params: BusinessSearchParams): Promise<BusinessProviderSearchResult> {
    const warnings: string[] = [];
    const subId = params.subcategory || params.category;
    const subDef = findSubcategoryDef(subId);
    const radiusKm = Math.max(1, Math.min(120, Number(params.radiusKm) || 35));
    const maxResults = Math.max(1, Math.min(100, params.maxResults || 25));
    const maxAllowedDistanceKm = Math.max(radiusKm * 1.25, 12);

    const center = await resolveLocationCoordinates(
      params.locationQuery,
      params.centerLat,
      params.centerLon
    );

    // Tight local bounding box (capped at 12 km) for fast sub-4s Overpass response
    const ovRadiusKm = Math.min(radiusKm, 12);
    const ovDegLat = Math.max(0.015, ovRadiusKm / 111);
    const ovDegLon = Math.max(
      0.02,
      ovRadiusKm / (111 * Math.cos((center.lat * Math.PI) / 180))
    );
    const ovBbox = `${(center.lat - ovDegLat).toFixed(4)},${(center.lon - ovDegLon).toFixed(
      4
    )},${(center.lat + ovDegLat).toFixed(4)},${(center.lon + ovDegLon).toFixed(4)}`;

    const tagClauses = subDef.osmQueries
      .map((q) => `node["${q.key}"="${q.value}"](${ovBbox});`)
      .join('\n  ');

    const overpassQuery = `[out:json][timeout:4];
(
  ${tagClauses}
);
out center tags ${Math.min(120, maxResults * 2)};`;

    const [ovElements, nomPlaces, photonFeatures] = await Promise.all([
      queryOverpassWithFailover(overpassQuery),
      queryNominatimCategoryPlaces(subDef.id || subId, center, radiusKm, maxResults * 2),
      queryPhotonCategoryPlaces(subDef.id || subId, center, radiusKm, maxResults * 2),
    ]);

    const rawCandidates: DiscoveredBusinessCandidate[] = [];
    const seenKeys = new Set<string>();

    for (const el of ovElements) {
      const tags = el.tags || {};
      const rawName = (tags.name || tags.brand || '').trim();
      if (!rawName) continue;

      const elLat = typeof el.lat === 'number' ? el.lat : el.center?.lat ?? null;
      const elLon = typeof el.lon === 'number' ? el.lon : el.center?.lon ?? null;
      const distanceKm =
        typeof elLat === 'number' && typeof elLon === 'number'
          ? computeDistanceKm(center.lat, center.lon, elLat, elLon)
          : null;
      if (distanceKm !== null && distanceKm > maxAllowedDistanceKm) continue;

      const street = tags['addr:street'] || '';
      const houseNumber = tags['addr:housenumber'] || '';
      const address = [street, houseNumber].filter(Boolean).join(', ') || null;
      const city = tags['addr:city'] || center.city || null;
      const province = tags['addr:province'] || center.province || null;
      const postalCode = tags['addr:postcode'] || null;

      const website = tags.website || tags['contact:website'] || tags.url || null;
      let instagramUrl = tags['contact:instagram'] || tags.instagram || null;
      if (instagramUrl && !instagramUrl.startsWith('http')) {
        instagramUrl = `https://www.instagram.com/${instagramUrl.replace(/^@/, '')}`;
      }

      let facebookUrl = tags['contact:facebook'] || tags.facebook || null;
      if (facebookUrl && !facebookUrl.startsWith('http')) {
        facebookUrl = `https://www.facebook.com/${facebookUrl}`;
      }

      const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null;
      const email = tags.email || tags['contact:email'] || null;

      const services: string[] = [];
      if (tags.cuisine) {
        services.push(
          ...String(tags.cuisine)
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        );
      }
      if (tags.outdoor_seating === 'yes') services.push('Tavoli all’aperto');
      if (tags.takeaway === 'yes') services.push('Asporto');
      if (tags.delivery === 'yes') services.push('Consegna a domicilio');
      if (tags.internet_access === 'wlan' || tags.wifi === 'yes') services.push('Wi-Fi pubblico dichiarato');
      if (tags.wheelchair === 'yes') services.push('Accessibile');

      const descriptionParts: string[] = [];
      if (tags.description) descriptionParts.push(String(tags.description));
      if (tags.opening_hours) descriptionParts.push(`Orari: ${tags.opening_hours}`);

      const norm = normalizeBusinessName(rawName);
      const dedupKey = `${norm}::${(city || '').toLowerCase()}`;
      if (!norm || seenKeys.has(dedupKey)) continue;
      seenKeys.add(dedupKey);

      rawCandidates.push({
        business_name: rawName,
        normalized_name: norm,
        category: params.category,
        subcategory: params.subcategory,
        city,
        province,
        region: center.region,
        address,
        postal_code: postalCode,
        latitude: elLat,
        longitude: elLon,
        website,
        website_domain: extractWebsiteDomain(website),
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        business_phone: phone,
        business_email: email,
        description: descriptionParts.join(' | ') || null,
        services_offered: services,
        digital_signals: {
          googleMapsUrl: buildGoogleMapsUrl(rawName, address, city, elLat, elLon),
          distanceKm,
        },
        source: this.id,
        source_reference: `osm:${el.type || 'node'}:${el.id}`,
        source_acquired_at: new Date().toISOString(),
      });
    }

    // Merge Nominatim geo places
    for (const np of nomPlaces) {
      const rawName = (np.name || np.display_name?.split(',')[0] || '').trim();
      if (!rawName || rawName.length < 2) continue;
      const npLat = parseFloat(np.lat);
      const npLon = parseFloat(np.lon);
      if (Number.isNaN(npLat) || Number.isNaN(npLon)) continue;

      const distanceKm = computeDistanceKm(center.lat, center.lon, npLat, npLon);
      if (distanceKm > maxAllowedDistanceKm) continue;

      const addr = np.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || center.city;
      const norm = normalizeBusinessName(rawName);
      const dedupKey = `${norm}::${(city || '').toLowerCase()}`;
      if (!norm || seenKeys.has(dedupKey)) continue;
      seenKeys.add(dedupKey);

      const address =
        [addr.road, addr.house_number].filter(Boolean).join(', ') ||
        np.display_name?.split(',').slice(1, 3).join(',').trim() ||
        null;
      const extratags = np.extratags || {};
      const website = extratags.website || extratags['contact:website'] || null;
      let instagramUrl = extratags['contact:instagram'] || extratags.instagram || null;
      if (instagramUrl && !instagramUrl.startsWith('http')) {
        instagramUrl = `https://www.instagram.com/${instagramUrl.replace(/^@/, '')}`;
      }
      let facebookUrl = extratags['contact:facebook'] || extratags.facebook || null;
      if (facebookUrl && !facebookUrl.startsWith('http')) {
        facebookUrl = `https://www.facebook.com/${facebookUrl}`;
      }
      const phone = extratags.phone || extratags['contact:phone'] || extratags['contact:mobile'] || null;

      rawCandidates.push({
        business_name: rawName,
        normalized_name: norm,
        category: params.category,
        subcategory: params.subcategory,
        city,
        province: addr.county || addr.province || center.province,
        region: addr.state || center.region,
        address,
        postal_code: addr.postcode || null,
        latitude: npLat,
        longitude: npLon,
        website,
        website_domain: extractWebsiteDomain(website),
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        business_phone: phone,
        business_email: extratags.email || extratags['contact:email'] || null,
        description: extratags.description || null,
        services_offered: [],
        digital_signals: {
          googleMapsUrl: buildGoogleMapsUrl(rawName, address, city, npLat, npLon),
          distanceKm,
        },
        source: this.id,
        source_reference: `osm_nom:${np.osm_type || 'node'}:${np.osm_id || np.place_id}`,
        source_acquired_at: new Date().toISOString(),
      });
    }

    // Merge Photon (Komoot) GeoJSON places
    for (const pf of photonFeatures) {
      const props = pf.properties || {};
      const rawName = String(props.name || '').trim();
      if (!rawName || rawName.length < 2) continue;
      const coords = pf.geometry?.coordinates || [];
      const pfLon = Number(coords[0]);
      const pfLat = Number(coords[1]);
      if (!Number.isFinite(pfLat) || !Number.isFinite(pfLon)) continue;

      const distanceKm = computeDistanceKm(center.lat, center.lon, pfLat, pfLon);
      if (distanceKm > maxAllowedDistanceKm) continue;

      const city = props.city || props.town || props.village || props.county || center.city;
      const norm = normalizeBusinessName(rawName);
      const dedupKey = `${norm}::${(city || '').toLowerCase()}`;
      if (!norm || seenKeys.has(dedupKey)) continue;
      seenKeys.add(dedupKey);

      const address = [props.street, props.housenumber].filter(Boolean).join(', ') || props.locality || null;

      rawCandidates.push({
        business_name: rawName,
        normalized_name: norm,
        category: params.category,
        subcategory: params.subcategory,
        city,
        province: props.county || center.province,
        region: props.state || center.region,
        address,
        postal_code: props.postcode || null,
        latitude: pfLat,
        longitude: pfLon,
        website: null,
        website_domain: null,
        instagram_url: null,
        facebook_url: null,
        business_phone: null,
        business_email: null,
        description: null,
        services_offered: [],
        digital_signals: {
          googleMapsUrl: buildGoogleMapsUrl(rawName, address, city, pfLat, pfLon),
          distanceKm,
        },
        source: this.id,
        source_reference: `osm_photon:${props.osm_type || 'N'}:${props.osm_id || rawName}`,
        source_acquired_at: new Date().toISOString(),
      });
    }

    // Prioritize dedicated category matches (e.g. barber keywords) + richer records + closest distance
    const isBarberSub = params.subcategory === 'barber';
    rawCandidates.sort((a, b) => {
      const barberBoostA =
        isBarberSub && /barber|barbiere|barberia|uomo|beard|rasatura/i.test(a.business_name) ? 5 : 0;
      const barberBoostB =
        isBarberSub && /barber|barbiere|barberia|uomo|beard|rasatura/i.test(b.business_name) ? 5 : 0;
      const scoreA = barberBoostA + (a.website ? 3 : 0) + (a.business_phone ? 2 : 0) + (a.address ? 1 : 0);
      const scoreB = barberBoostB + (b.website ? 3 : 0) + (b.business_phone ? 2 : 0) + (b.address ? 1 : 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (a.digital_signals.distanceKm ?? 999) - (b.digital_signals.distanceKm ?? 999);
    });

    const candidates = rawCandidates.slice(0, maxResults);

    // Optional public website metadata enrichment
    if (params.enrichWebsites !== false) {
      const withWebsite = candidates.filter((c) => c.website).slice(0, 6);
      await Promise.all(
        withWebsite.map(async (c) => {
          if (!c.website) return;
          const webSignals = await inspectPublicWebsiteMetadata(c.website);
          c.digital_signals = {
            ...webSignals,
            googleMapsUrl: c.digital_signals.googleMapsUrl,
            distanceKm: c.digital_signals.distanceKm,
          };
          if (!c.description && webSignals.websiteDescription) {
            c.description = webSignals.websiteDescription;
          }
          if (webSignals.detectedSocialLinks) {
            for (const sl of webSignals.detectedSocialLinks) {
              if (!c.instagram_url && sl.toLowerCase().includes('instagram.com')) {
                c.instagram_url = sl;
              }
              if (!c.facebook_url && sl.toLowerCase().includes('facebook.com')) {
                c.facebook_url = sl;
              }
            }
          }
        })
      );
    }

    if (candidates.length === 0) {
      warnings.push(
        `Nessuna attività trovata su Maps per "${subDef.label}" entro ${radiusKm} km da ${center.city}. Prova ad ampliare il raggio (fino a 120 km) o cambiare categoria.`
      );
    }

    return {
      providerId: this.id,
      providerName: this.name,
      attribution: this.attribution,
      candidates,
      warnings,
      center,
    };
  }
}

// ============================================================================
// 2. Priority Google Maps & Places Engine (With Live Cartographic Failover)
// ============================================================================

export class GooglePlacesAuthorizedProvider implements BusinessDataProvider {
  id = 'google_places_official';
  name = 'Google Maps & Places Engine (Prioritario)';
  providerType = 'google_places' as const;
  attribution = 'Powered by Google Maps Platform & Live Geo-Maps Engine';

  private getApiKey(): string | undefined {
    return process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  }

  isConfigured(): boolean {
    // Always enabled as primary Maps engine: uses Google Places API when key is present,
    // and automatically falls back to Live Cartographic Geo-Maps Engine (with Google Maps previews).
    return true;
  }

  async search(params: BusinessSearchParams): Promise<BusinessProviderSearchResult> {
    const apiKey = this.getApiKey();
    const radiusKm = Math.max(1, Math.min(120, Number(params.radiusKm) || 35));
    const center = await resolveLocationCoordinates(
      params.locationQuery,
      params.centerLat,
      params.centerLon
    );
    const subDef = findSubcategoryDef(params.subcategory || params.category);

    // If official Google Places API key is configured, query Places API (New) with locationBias
    if (apiKey) {
      const textQuery = `${subDef.label} vicino a ${center.city}${center.region ? ', ' + center.region : ''}`;

      try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.rating,places.userRatingCount',
          },
          body: JSON.stringify({
            textQuery,
            languageCode: 'it',
            maxResultCount: Math.min(20, params.maxResults || 20),
            locationBias: {
              circle: {
                center: { latitude: center.lat, longitude: center.lon },
                radius: Math.min(50000, radiusKm * 1000),
              },
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const places: any[] = Array.isArray(data?.places) ? data.places : [];
          if (places.length > 0) {
            const candidates: DiscoveredBusinessCandidate[] = [];
            for (const p of places) {
              const placeId = p.id;
              const name = p.displayName?.text;
              if (!placeId || !name) continue;

              const pLat = typeof p.location?.latitude === 'number' ? p.location.latitude : null;
              const pLon = typeof p.location?.longitude === 'number' ? p.location.longitude : null;
              const address = p.formattedAddress || null;
              const website = p.websiteUri || null;
              const webSignals = website ? await inspectPublicWebsiteMetadata(website) : {};
              const distanceKm =
                pLat !== null && pLon !== null
                  ? computeDistanceKm(center.lat, center.lon, pLat, pLon)
                  : null;

              candidates.push({
                business_name: name,
                normalized_name: normalizeBusinessName(name),
                category: params.category,
                subcategory: params.subcategory,
                city: center.city,
                province: center.province,
                region: center.region,
                address,
                postal_code: null,
                latitude: pLat,
                longitude: pLon,
                website,
                website_domain: extractWebsiteDomain(website),
                instagram_url: null,
                facebook_url: null,
                business_phone: p.nationalPhoneNumber || null,
                business_email: null,
                description: webSignals.websiteDescription || null,
                services_offered: [],
                digital_signals: {
                  ...webSignals,
                  googleMapsUrl:
                    p.googleMapsUri || buildGoogleMapsUrl(name, address, center.city, pLat, pLon),
                  distanceKm,
                  rating: typeof p.rating === 'number' ? p.rating : null,
                  userRatingCount:
                    typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
                },
                source: this.id,
                source_reference: `google_place_id:${placeId}`,
                source_acquired_at: new Date().toISOString(),
              });
            }

            return {
              providerId: this.id,
              providerName: this.name,
              attribution: this.attribution,
              candidates,
              warnings: [],
              center,
            };
          }
        }
      } catch {
        // Fall through smoothly to Live Cartographic Geo-Maps Engine below
      }
    }

    // Live Cartographic Geo-Maps Engine failover (always operational, zero API key needed)
    const fallbackProvider = new OpenStreetMapOverpassProvider();
    const fallbackRes = await fallbackProvider.search({
      ...params,
      centerLat: center.lat,
      centerLon: center.lon,
      radiusKm,
    });

    return {
      providerId: this.id,
      providerName: this.name,
      attribution: this.attribution,
      candidates: fallbackRes.candidates,
      warnings: fallbackRes.warnings,
      center,
    };
  }
}

export function getRegisteredDiscoveryProviders(): BusinessDataProvider[] {
  return [new GooglePlacesAuthorizedProvider(), new OpenStreetMapOverpassProvider()];
}

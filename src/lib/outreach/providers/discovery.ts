/**
 * RIVO OUTREACH — Modular Business Data Acquisition Providers (`BusinessDataProvider`)
 *
 * Strictly complies with:
 * - OpenStreetMap ODbL attribution & usage policy
 * - Google Maps Platform Terms (no automated scraping, official API only when key is present)
 * - Public Website non-intrusive metadata inspection
 */

import { findSubcategoryDef, type PublicDigitalSignals } from '../types';
import { extractWebsiteDomain, normalizeBusinessName } from '../deduplication';

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
}

export interface BusinessDataProvider {
  id: string;
  name: string;
  providerType: 'openstreetmap' | 'google_places' | 'public_website' | 'manual';
  attribution: string;
  isConfigured(): boolean;
  search(params: BusinessSearchParams): Promise<BusinessProviderSearchResult>;
}

const RIVO_USER_AGENT = 'RIVO-Outreach-Business-Intelligence/1.0 (https://rivo.app; compliance@rivo.app)';

/**
 * Safe public website metadata enrichment.
 * Extracts only publicly declared <title>, <meta name="description">, social links,
 * and observable digital signals (booking/menu links) with a strict 5s timeout.
 */
export async function inspectPublicWebsiteMetadata(rawUrl: string): Promise<PublicDigitalSignals> {
  const signals: PublicDigitalSignals = {
    websiteTitle: null,
    websiteDescription: null,
    detectedBookingLinks: [],
    detectedMenuLinks: [],
    detectedSocialLinks: [],
    httpStatus: null,
    inspectedAt: new Date().toISOString(),
  };

  if (!rawUrl) return signals;
  const targetUrl = /^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

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

    const html = (await res.text()).slice(0, 120000);

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

    // Detect public links (href="...")
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
    // Non-blocking: website may be unreachable or block automated requests
  }

  return signals;
}

// ============================================================================
// 1. OpenStreetMap Overpass Provider (Open Data ODbL)
// ============================================================================

export class OpenStreetMapOverpassProvider implements BusinessDataProvider {
  id = 'openstreetmap_odbl';
  name = 'OpenStreetMap Overpass (Open Data ODbL)';
  providerType = 'openstreetmap' as const;
  attribution = '© OpenStreetMap contributors — Open Database License (ODbL)';

  isConfigured(): boolean {
    return true;
  }

  async search(params: BusinessSearchParams): Promise<BusinessProviderSearchResult> {
    const warnings: string[] = [];
    const subDef = findSubcategoryDef(params.subcategory || params.category);
    const radiusMeters = Math.max(500, Math.min(25000, Math.round((params.radiusKm || 5) * 1000)));
    const maxResults = Math.max(1, Math.min(100, params.maxResults || 25));

    // Step 1: Geocode locality via Nominatim
    const geoUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(
      params.locationQuery
    )}`;

    const geoController = new AbortController();
    const geoTimer = setTimeout(() => geoController.abort(), 8000);

    let lat: number | null = null;
    let lon: number | null = null;
    let resolvedCity = params.locationQuery.trim();
    let resolvedProvince: string | null = null;
    let resolvedRegion: string | null = null;

    try {
      const geoRes = await fetch(geoUrl, {
        headers: {
          'User-Agent': RIVO_USER_AGENT,
          'Accept-Language': 'it',
        },
        signal: geoController.signal,
      });
      clearTimeout(geoTimer);

      if (!geoRes.ok) {
        throw new Error(`Nominatim HTTP ${geoRes.status}`);
      }

      const geoData = (await geoRes.json()) as any[];
      if (!Array.isArray(geoData) || geoData.length === 0) {
        return {
          providerId: this.id,
          providerName: this.name,
          attribution: this.attribution,
          candidates: [],
          warnings: [`Località "${params.locationQuery}" non trovata su OpenStreetMap.`],
        };
      }

      const top = geoData[0];
      lat = parseFloat(top.lat);
      lon = parseFloat(top.lon);
      const addr = top.address || {};
      resolvedCity = addr.city || addr.town || addr.village || addr.municipality || resolvedCity;
      resolvedProvince = addr.county || addr.province || null;
      resolvedRegion = addr.state || null;
    } catch (err: any) {
      clearTimeout(geoTimer);
      return {
        providerId: this.id,
        providerName: this.name,
        attribution: this.attribution,
        candidates: [],
        warnings: [`Impossibile geocodificare la località (${err?.message || 'errore di rete'}).`],
      };
    }

    if (lat === null || lon === null || Number.isNaN(lat) || Number.isNaN(lon)) {
      return {
        providerId: this.id,
        providerName: this.name,
        attribution: this.attribution,
        candidates: [],
        warnings: ['Coordinate geografiche non valide per la località specificata.'],
      };
    }

    // Step 2: Build Overpass QL query for the subcategory tags
    const tagClauses = subDef.osmQueries
      .map(
        (q) =>
          `node["${q.key}"="${q.value}"](around:${radiusMeters},${lat},${lon});way["${q.key}"="${q.value}"](around:${radiusMeters},${lat},${lon});`
      )
      .join('\n  ');

    const overpassQuery = `[out:json][timeout:18];
(
  ${tagClauses}
);
out center tags ${maxResults * 2};`;

    const ovController = new AbortController();
    const ovTimer = setTimeout(() => ovController.abort(), 18000);

    try {
      const ovRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': RIVO_USER_AGENT,
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: ovController.signal,
      });
      clearTimeout(ovTimer);

      if (!ovRes.ok) {
        throw new Error(`Overpass HTTP ${ovRes.status}`);
      }

      const ovJson = await ovRes.json();
      const elements: any[] = Array.isArray(ovJson?.elements) ? ovJson.elements : [];

      const candidates: DiscoveredBusinessCandidate[] = [];
      for (const el of elements) {
        const tags = el.tags || {};
        const rawName = (tags.name || tags['brand'] || '').trim();
        if (!rawName) continue;

        // If searching specifically for 'barber', prioritize barber tags or names if available
        if (params.subcategory === 'barber') {
          const isMaleOrBarber =
            tags.male === 'yes' ||
            tags.unisex === 'no' ||
            /barber|barbiere|uomo|rasatura|beard/i.test(`${rawName} ${tags.description || ''}`);
          // Keep both explicit barbers and hairdressers when results are sparse, or filter if plenty
          if (!isMaleOrBarber && elements.length > maxResults && candidates.length >= Math.floor(maxResults / 2)) {
            continue;
          }
        }

        const street = tags['addr:street'] || '';
        const houseNumber = tags['addr:housenumber'] || '';
        const address = [street, houseNumber].filter(Boolean).join(', ') || null;
        const city = tags['addr:city'] || resolvedCity || null;
        const province = tags['addr:province'] || resolvedProvince || null;
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
        if (tags.opening_hours) descriptionParts.push(`Orari OSM: ${tags.opening_hours}`);

        const elLat = typeof el.lat === 'number' ? el.lat : el.center?.lat ?? null;
        const elLon = typeof el.lon === 'number' ? el.lon : el.center?.lon ?? null;

        candidates.push({
          business_name: rawName,
          normalized_name: normalizeBusinessName(rawName),
          category: params.category,
          subcategory: params.subcategory,
          city,
          province,
          region: resolvedRegion,
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
          digital_signals: {},
          source: this.id,
          source_reference: `osm:${el.type || 'node'}:${el.id}`,
          source_acquired_at: new Date().toISOString(),
        });

        if (candidates.length >= maxResults) break;
      }

      // Optional public website metadata enrichment for the top candidates with websites
      if (params.enrichWebsites !== false) {
        const withWebsite = candidates.filter((c) => c.website).slice(0, 6);
        await Promise.all(
          withWebsite.map(async (c) => {
            if (!c.website) return;
            const signals = await inspectPublicWebsiteMetadata(c.website);
            c.digital_signals = signals;
            if (!c.description && signals.websiteDescription) {
              c.description = signals.websiteDescription;
            }
            if (signals.detectedSocialLinks) {
              for (const sl of signals.detectedSocialLinks) {
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

      return {
        providerId: this.id,
        providerName: this.name,
        attribution: this.attribution,
        candidates,
        warnings,
      };
    } catch (err: any) {
      clearTimeout(ovTimer);
      return {
        providerId: this.id,
        providerName: this.name,
        attribution: this.attribution,
        candidates: [],
        warnings: [`Overpass API temporaneamente occupata o in timeout: ${err?.message || 'riprova tra poco'}.`],
      };
    }
  }
}

// ============================================================================
// 2. Official Google Places API Provider (Strictly Terms-Compliant)
// ============================================================================

export class GooglePlacesAuthorizedProvider implements BusinessDataProvider {
  id = 'google_places_official';
  name = 'Google Places API (Official)';
  providerType = 'google_places' as const;
  attribution = 'Powered by Google Maps Platform (Official API)';

  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_PLACES_API_KEY);
  }

  async search(params: BusinessSearchParams): Promise<BusinessProviderSearchResult> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return {
        providerId: this.id,
        providerName: this.name,
        attribution: this.attribution,
        candidates: [],
        warnings: [
          'GOOGLE_PLACES_API_KEY non configurata sul server. Usa OpenStreetMap Overpass o configura la chiave ufficiale Google Places in Impostazioni.',
        ],
      };
    }

    const subDef = findSubcategoryDef(params.subcategory || params.category);
    const textQuery = `${subDef.label} a ${params.locationQuery}`;

    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.websiteUri',
        },
        body: JSON.stringify({
          textQuery,
          languageCode: 'it',
          maxResultCount: Math.min(20, params.maxResults || 10),
        }),
      });

      if (!res.ok) {
        return {
          providerId: this.id,
          providerName: this.name,
          attribution: this.attribution,
          candidates: [],
          warnings: [`Google Places API ha restituito HTTP ${res.status}.`],
        };
      }

      const data = await res.json();
      const places: any[] = Array.isArray(data?.places) ? data.places : [];

      // Per Google Maps Platform Terms, we store the allowed place_id identifier
      // and inspect public first-party website metadata when a public websiteUri is present.
      const candidates: DiscoveredBusinessCandidate[] = [];
      for (const p of places) {
        const placeId = p.id;
        const name = p.displayName?.text;
        if (!placeId || !name) continue;

        const website = p.websiteUri || null;
        const signals = website ? await inspectPublicWebsiteMetadata(website) : {};

        candidates.push({
          business_name: name,
          normalized_name: normalizeBusinessName(name),
          category: params.category,
          subcategory: params.subcategory,
          city: params.locationQuery.trim(),
          province: null,
          region: null,
          address: null,
          postal_code: null,
          latitude: null,
          longitude: null,
          website,
          website_domain: extractWebsiteDomain(website),
          instagram_url: null,
          facebook_url: null,
          business_phone: null,
          business_email: null,
          description: signals.websiteDescription || null,
          services_offered: [],
          digital_signals: signals,
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
      };
    } catch (err: any) {
      return {
        providerId: this.id,
        providerName: this.name,
        attribution: this.attribution,
        candidates: [],
        warnings: [`Errore Google Places API: ${err?.message || 'errore di connessione'}.`],
      };
    }
  }
}

export function getRegisteredDiscoveryProviders(): BusinessDataProvider[] {
  return [new OpenStreetMapOverpassProvider(), new GooglePlacesAuthorizedProvider()];
}

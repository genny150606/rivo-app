import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildFacebookGraphPictureUrl,
  buildGoogleFaviconUrl,
  extractLogoCandidatesFromHtml,
  extractSocialProfileOgImage,
  isSafePublicHttpUrl,
  isValidInstagramProfileUrl,
  resolveProspectLogoCandidates,
  type LogoCandidateInput,
} from './logo-resolver';
import { extractInstagramHandle, normalizeInstagramProfileUrl } from './instagram';
import type { PublicDigitalSignals } from './types';

export interface SafeLogoBinaryAsset {
  bytes: Buffer;
  mimeType: 'image/png' | 'image/jpeg' | 'image/gif';
  sourceUrl: string;
}

export interface ProspectBrandDiscoveryResult {
  logoUrl: string | null;
  logoSource: string | null;
  discoveredWebsite: string | null;
  discoveredInstagramUrl: string | null;
  discoveredFacebookUrl: string | null;
  imageAsset: SafeLogoBinaryAsset | null;
}

export interface ProspectBrandInput extends LogoCandidateInput {
  id: string;
  business_name: string;
  city?: string | null;
  province?: string | null;
  category?: string | null;
  subcategory?: string | null;
}

const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const GENERIC_SECTOR_STOPWORDS = new Set([
  'il',
  'lo',
  'la',
  'i',
  'gli',
  'le',
  'di',
  'da',
  'in',
  'su',
  'per',
  'con',
  'ed',
  'and',
  'the',
  'barbiere',
  'barber',
  'barberia',
  'barbershop',
  'shop',
  'parrucchiere',
  'parrucchieri',
  'salon',
  'salone',
  'studio',
  'atelier',
  'centro',
  'estetico',
  'estetica',
  'beauty',
  'spa',
  'nails',
  'nail',
  'ristorante',
  'pizzeria',
  'trattoria',
  'osteria',
  'bistrot',
  'lounge',
  'bar',
  'cafe',
  'caffetteria',
  'caffe',
  'gelateria',
  'pasticceria',
  'hotel',
  'resort',
  'relais',
  'suites',
  'suite',
  'boutique',
  'store',
  'uomo',
  'donna',
  'napoli',
  'naples',
  'campania',
  'italy',
  'italia',
  'srl',
  'srls',
  'sas',
  'snc',
]);

const DIRECTORY_OR_SPAM_HOST_REGEX =
  /(wikipedia\.org|wikidata\.org|wikimedia\.org|fandom\.com|fanpage\.it|rainews\.it|ansa\.it|corriere\.it|repubblica\.it|tgcom24|ilfattoquotidiano|news\.google\.com|bing\.com|yahoo\.com|amazon\.|ebay\.|firmania\.it|ameve\.it|informazione-aziende\.it|ufficiocamerale\.it|reportaziende\.it|registroaziende\.it|empresite\.it|oraridiapertura24\.it|italiarecensioni\.it|paginebianche\.it|paginegialle\.it|misterimprese\.it|tuttocitta\.it|findglocal\.com|beautynailhairsalons\.com|cylex|yelp\.|tripadvisor\.|kompass\.com|youtube\.com|zhihu\.com|baidu\.com|commentcamarche|reddit\.com|pinterest\.|prontoimprese\.|europages\.|hotfrog\.|bakeca\.|subito\.|groupon\.|tuugo\.|yalwa\.|cybo\.|infobel\.|creditsafe\.|fatturatoitalia\.|telextra\.|localgymsandfitness\.|nicelocal\.|restaurantguru\.|sluurpy\.|leggimenu\.|justeat\.|deliveroo\.|glovoapp\.|thefork\.|booking\.com|airbnb\.|expedia\.|trivago\.|hotels\.com|trovaorari\.|elencoaziende\.|trovaziende\.)/i;

const BOOKING_HOST_REGEX =
  /(fresha\.com|treatwell\.it|treatwell\.|booksy\.com|uala\.|sumupbookings\.com|linktr\.ee|bio\.link|heygoldie\.com|setmore\.com|timify\.com|square\.site)/i;

function normalizeTextForTokens(raw: string): string {
  return (raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractDistinctiveBrandTokens(businessName: string): {
  allTokens: string[];
  distinctiveTokens: string[];
} {
  const normalized = normalizeTextForTokens(businessName);
  const allTokens = normalized.split(' ').filter((w) => w.length >= 2);
  const distinctiveTokens = allTokens.filter(
    (w) => w.length >= 3 && !GENERIC_SECTOR_STOPWORDS.has(w)
  );
  return {
    allTokens,
    distinctiveTokens: distinctiveTokens.length > 0 ? distinctiveTokens : allTokens,
  };
}

function normalizeUrlWebsiteRoot(rawUrl: string): string | null {
  const parsed = isSafePublicHttpUrl(rawUrl);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase();
  if (
    DIRECTORY_OR_SPAM_HOST_REGEX.test(host) ||
    host.includes('instagram.com') ||
    host.includes('facebook.com') ||
    host.includes('tiktok.com') ||
    host.includes('apps.apple.com') ||
    host.includes('play.google.com')
  ) {
    return null;
  }
  return `${parsed.protocol}//${parsed.host}`;
}

function readPngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    width: view.getUint32(16, false),
    height: view.getUint32(20, false),
  };
}

function detectDirectRasterMime(bytes: Uint8Array): 'image/png' | 'image/jpeg' | 'image/gif' | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif';
  }
  return null;
}

function isWebpBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

function isIsoBmffImageBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  );
}

function isSvgBytes(bytes: Uint8Array, contentType: string): boolean {
  if (contentType.includes('image/svg+xml')) return true;
  const head = Buffer.from(bytes.subarray(0, Math.min(bytes.length, 400)))
    .toString('utf8')
    .trimStart()
    .toLowerCase();
  return head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'));
}

/**
 * Extracts the largest embedded PNG image from an ICO binary if present.
 */
function extractEmbeddedPngFromIco(bytes: Uint8Array): Buffer | null {
  if (bytes.length < 22) return null;
  // ICO header: reserved=0 (2B), type=1 (2B)
  if (bytes[0] !== 0 || bytes[1] !== 0 || bytes[2] !== 1 || bytes[3] !== 0) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = Math.min(view.getUint16(4, true), 20);
  let bestPng: Buffer | null = null;
  let bestSize = 0;

  for (let i = 0; i < count; i++) {
    const entryOffset = 6 + i * 16;
    if (entryOffset + 16 > bytes.length) break;
    const rawW = bytes[entryOffset] === 0 ? 256 : bytes[entryOffset];
    const rawH = bytes[entryOffset + 1] === 0 ? 256 : bytes[entryOffset + 1];
    const sizeInBytes = view.getUint32(entryOffset + 8, true);
    const imageOffset = view.getUint32(entryOffset + 12, true);
    if (
      imageOffset >= 6 + count * 16 &&
      imageOffset + sizeInBytes <= bytes.length &&
      sizeInBytes >= 24
    ) {
      const slice = bytes.subarray(imageOffset, imageOffset + sizeInBytes);
      if (slice[0] === 0x89 && slice[1] === 0x50 && slice[2] === 0x4e && slice[3] === 0x47) {
        const dims = readPngDimensions(slice);
        const w = dims?.width ?? rawW;
        const h = dims?.height ?? rawH;
        if (w >= 32 && h >= 32 && w * h > bestSize) {
          bestSize = w * h;
          bestPng = Buffer.from(slice);
        }
      }
    }
  }

  return bestPng;
}

async function normalizeBufferToPngWithSharp(
  inputBuffer: Buffer,
  isSvg = false
): Promise<Buffer | null> {
  try {
    const sharpMod = await import('sharp');
    const sharpFn = sharpMod.default;
    const pipeline = isSvg
      ? sharpFn(inputBuffer, { density: 144 })
      : sharpFn(inputBuffer);
    const pngBuffer = await pipeline
      .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    const dims = readPngDimensions(pngBuffer);
    if (dims && (dims.width < 32 || dims.height < 32)) {
      return null;
    }
    return pngBuffer;
  } catch {
    return null;
  }
}

function isLikelyGenericPlaceholder(bytes: Uint8Array, finalUrl: string): boolean {
  const lower = finalUrl.toLowerCase();
  if (
    lower.includes('static.xx.fbcdn.net/rsrc.php') ||
    lower.includes('static.cdninstagram.com/rsrc.php') ||
    lower.includes('default_avatar') ||
    lower.includes('placeholder')
  ) {
    return true;
  }
  // Tiny Google S2 16x16 globe fallback is typically ~400-750 bytes
  if (lower.includes('google.com/s2/favicons') && bytes.length < 850) {
    return true;
  }
  return false;
}

/**
 * Downloads and validates/normalizes the first viable Satori-safe logo image
 * (PNG, JPEG, GIF directly, plus WebP/SVG/AVIF/HEIC/PNG-in-ICO converted cleanly to PNG via Sharp).
 */
export async function fetchSafeLogoBinary(
  candidateUrls: string[],
  options?: { timeoutMs?: number }
): Promise<SafeLogoBinaryAsset | null> {
  const MAX_BYTES = 2_000_000;
  const timeoutMs = options?.timeoutMs ?? 2500;

  for (const rawUrl of candidateUrls) {
    const safeUrl = isSafePublicHttpUrl(rawUrl);
    if (!safeUrl) continue;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(safeUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': CHROME_USER_AGENT,
          Accept: 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif,*/*;q=0.5',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) continue;
      const finalUrl = res.url || safeUrl.toString();
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html') || contentType.includes('application/json')) {
        continue;
      }

      const contentLength = Number(res.headers.get('content-length') || '0');
      if (contentLength > MAX_BYTES) continue;

      const arrayBuf = await res.arrayBuffer();
      if (arrayBuf.byteLength === 0 || arrayBuf.byteLength > MAX_BYTES) continue;

      const bytes = new Uint8Array(arrayBuf);
      if (isLikelyGenericPlaceholder(bytes, finalUrl)) continue;

      const directMime = detectDirectRasterMime(bytes);
      if (directMime) {
        if (directMime === 'image/png') {
          const dims = readPngDimensions(bytes);
          if (dims && (dims.width < 32 || dims.height < 32)) {
            continue;
          }
        }
        return {
          bytes: Buffer.from(bytes),
          mimeType: directMime,
          sourceUrl: safeUrl.toString(),
        };
      }

      const embeddedIcoPng = extractEmbeddedPngFromIco(bytes);
      if (embeddedIcoPng) {
        return {
          bytes: embeddedIcoPng,
          mimeType: 'image/png',
          sourceUrl: safeUrl.toString(),
        };
      }

      const svgFlag = isSvgBytes(bytes, contentType);
      if (svgFlag || isWebpBytes(bytes) || isIsoBmffImageBytes(bytes)) {
        const converted = await normalizeBufferToPngWithSharp(Buffer.from(bytes), svgFlag);
        if (converted) {
          return {
            bytes: converted,
            mimeType: 'image/png',
            sourceUrl: safeUrl.toString(),
          };
        }
      }
    } catch {
      // Try next candidate
    }
  }

  return null;
}

export async function fetchSafeServerSatoriLogoDataUri(
  candidateUrls: string[],
  timeoutMs = 2600
): Promise<{ dataUri: string; asset: SafeLogoBinaryAsset } | null> {
  const asset = await fetchSafeLogoBinary(candidateUrls, { timeoutMs });
  if (!asset) return null;
  return {
    dataUri: `data:${asset.mimeType};base64,${asset.bytes.toString('base64')}`,
    asset,
  };
}

/**
 * Searches the official Apple App Store IT API for an exact business-branded mobile app.
 */
async function searchAppleAppStoreBrand(
  businessName: string,
  timeoutMs = 2200
): Promise<{ logoUrl: string; sellerUrl: string | null } | null> {
  const { allTokens, distinctiveTokens } = extractDistinctiveBrandTokens(businessName);
  if (allTokens.length === 0) return null;

  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(businessName)}&country=it&entity=software&limit=5`,
      { signal: AbortSignal.timeout(timeoutMs) }
    );
    if (!res.ok) return null;

    const json = (await res.json()) as {
      results?: Array<{
        trackName?: string;
        sellerName?: string;
        artistName?: string;
        primaryGenreName?: string;
        artworkUrl512?: string;
        artworkUrl100?: string;
        sellerUrl?: string;
      }>;
    };

    const allowedGenres = new Set([
      'Lifestyle',
      'Health & Fitness',
      'Food & Drink',
      'Shopping',
      'Business',
      'Productivity',
      'Travel',
      'Utilities',
    ]);

    for (const item of json.results || []) {
      const trackNorm = normalizeTextForTokens(item.trackName || '');
      if (!trackNorm) continue;
      if (item.primaryGenreName && !allowedGenres.has(item.primaryGenreName)) continue;

      const trackWords = trackNorm.split(' ');
      const distinctiveMatched = distinctiveTokens.filter((tok) => trackWords.includes(tok));
      const allMatched = allTokens.filter((tok) => trackWords.includes(tok));

      // Require all distinctive tokens AND either >=2 total tokens or exact match on full normalized name
      const isStrongMatch =
        distinctiveMatched.length === distinctiveTokens.length &&
        (allMatched.length >= Math.min(2, allTokens.length) ||
          trackNorm === normalizeTextForTokens(businessName));

      if (!isStrongMatch) continue;

      const logoUrl = item.artworkUrl512 || item.artworkUrl100 || null;
      if (logoUrl && isSafePublicHttpUrl(logoUrl)) {
        return {
          logoUrl,
          sellerUrl: item.sellerUrl && isSafePublicHttpUrl(item.sellerUrl) ? item.sellerUrl : null,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

interface WebSearchHit {
  url: string;
  title: string;
}

async function queryYahooItaliaHits(query: string, timeoutMs = 2600): Promise<WebSearchHit[]> {
  try {
    const res = await fetch(`https://it.search.yahoo.com/search?p=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': CHROME_USER_AGENT,
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const olIdx = html.indexOf('<ol');
    const body = olIdx >= 0 ? html.slice(olIdx, olIdx + 160000) : html.slice(0, 160000);

    const hits: WebSearchHit[] = [];
    const seen = new Set<string>();
    const linkMatches = body.matchAll(
      /<h3[^>]*class=["'][^"']*title[^"']*["'][^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    );

    for (const m of linkMatches) {
      let href = (m[1] || '').replace(/&amp;/g, '&');
      const ru = href.match(/\/RU=([^/]+)\//);
      if (ru) {
        try {
          href = decodeURIComponent(ru[1]);
        } catch {
          // Keep original
        }
      }
      if (!isSafePublicHttpUrl(href)) continue;
      const lowerHref = href.toLowerCase();
      if (lowerHref.includes('yahoo.com') || lowerHref.includes('bingj.com')) continue;
      if (seen.has(href)) continue;
      seen.add(href);

      const title = (m[2] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      hits.push({ url: href, title });
      if (hits.length >= 8) break;
    }

    return hits;
  } catch {
    return [];
  }
}

async function queryDuckDuckGoHits(query: string, timeoutMs = 2400): Promise<WebSearchHit[]> {
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': CHROME_USER_AGENT,
          'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(timeoutMs),
      }
    );
    if (res.status !== 200) return [];
    const html = (await res.text()).slice(0, 140000);
    const hits: WebSearchHit[] = [];
    const seen = new Set<string>();

    const matches = html.matchAll(/class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi);
    for (const m of matches) {
      let href = (m[1] || '').replace(/&amp;/g, '&');
      const uddg = href.match(/[?&]uddg=([^&]+)/);
      if (uddg) {
        try {
          href = decodeURIComponent(uddg[1]);
        } catch {
          // Keep original
        }
      }
      if (!isSafePublicHttpUrl(href) || seen.has(href)) continue;
      seen.add(href);
      const title = (m[2] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      hits.push({ url: href, title });
      if (hits.length >= 8) break;
    }
    return hits;
  } catch {
    return [];
  }
}

function classifyAndScoreWebHit(
  hit: WebSearchHit,
  businessName: string,
  city?: string | null
): {
  kind: 'instagram' | 'facebook' | 'website' | 'booking' | 'play_store' | 'apple_store';
  score: number;
  normalizedUrl: string;
} | null {
  const parsed = isSafePublicHttpUrl(hit.url);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase();
  if (DIRECTORY_OR_SPAM_HOST_REGEX.test(host)) return null;

  const { allTokens, distinctiveTokens } = extractDistinctiveBrandTokens(businessName);
  const haystack = normalizeTextForTokens(`${hit.title} ${parsed.pathname} ${host}`);
  const matchedDistinctive = distinctiveTokens.filter((t) => haystack.includes(t));
  const matchedAll = allTokens.filter((t) => haystack.includes(t));

  // Must match ALL distinctive tokens, or >= 2 distinctive tokens when name has 3+
  const minRequired =
    distinctiveTokens.length <= 2 ? distinctiveTokens.length : distinctiveTokens.length - 1;
  if (matchedDistinctive.length < minRequired) return null;

  // Reject single short generic brand token without city corroboration
  const normCity = normalizeTextForTokens(city || '');
  const cityVariants = normCity === 'napoli' ? ['napoli', 'naples'] : normCity ? [normCity] : [];
  const cityMatched = cityVariants.some((c) => haystack.includes(c));

  if (distinctiveTokens.length === 1 && !cityMatched && matchedAll.length < 2) {
    return null;
  }

  let score = matchedDistinctive.length * 30 + matchedAll.length * 10 + (cityMatched ? 25 : 0);

  if (host.includes('instagram.com') || host.includes('instagr.am')) {
    const normalizedIg = normalizeInstagramProfileUrl(hit.url);
    if (!normalizedIg) return null;
    const handle = extractInstagramHandle(normalizedIg) || '';
    if (handle && distinctiveTokens.some((t) => handle.includes(t))) score += 18;
    return { kind: 'instagram', score: score + 22, normalizedUrl: normalizedIg };
  }

  if (host.includes('facebook.com') || host.includes('fb.com')) {
    const graphPic = buildFacebookGraphPictureUrl(hit.url);
    if (!graphPic) return null;
    return { kind: 'facebook', score: score + 18, normalizedUrl: hit.url };
  }

  if (host.includes('apps.apple.com')) {
    return { kind: 'apple_store', score: score + 16, normalizedUrl: hit.url };
  }

  if (host.includes('play.google.com') && parsed.pathname.includes('/store/apps/details')) {
    return { kind: 'play_store', score: score + 14, normalizedUrl: hit.url };
  }

  if (BOOKING_HOST_REGEX.test(host)) {
    if (!cityMatched && matchedDistinctive.length < distinctiveTokens.length) return null;
    return { kind: 'booking', score: score + 8, normalizedUrl: hit.url };
  }

  const root = normalizeUrlWebsiteRoot(hit.url);
  if (!root) return null;
  const hostNorm = normalizeTextForTokens(host);
  if (distinctiveTokens.some((t) => hostNorm.includes(t))) {
    score += 24;
  } else if (!cityMatched) {
    // Non-brand domain without city corroboration in result is too risky
    return null;
  }

  return { kind: 'website', score: score + 20, normalizedUrl: root };
}

async function extractPlayStoreAppIcon(appUrl: string, timeoutMs = 2200): Promise<string | null> {
  try {
    const res = await fetch(appUrl, {
      headers: { 'User-Agent': CHROME_USER_AGENT, 'Accept-Language': 'it-IT,it;q=0.9' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 140000);
    const metaMatch =
      html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i)?.[1];
    if (metaMatch && isSafePublicHttpUrl(metaMatch)) {
      return metaMatch.replace(/&amp;/g, '&');
    }
    const playIcon = html.match(/https:\/\/play-lh\.googleusercontent\.com\/[^"'\s<>\\]+/i)?.[0];
    return playIcon && isSafePublicHttpUrl(playIcon) ? playIcon : null;
  } catch {
    return null;
  }
}

async function extractWebsiteLogos(
  siteUrl: string,
  businessName: string,
  timeoutMs = 2200
): Promise<string[]> {
  try {
    const res = await fetch(siteUrl, {
      headers: { 'User-Agent': CHROME_USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return [];
    const html = (await res.text()).slice(0, 100000);
    const found = extractLogoCandidatesFromHtml(html, res.url || siteUrl, businessName);
    const s2 = buildGoogleFaviconUrl(res.url || siteUrl);
    if (s2 && !found.includes(s2)) found.push(s2);
    return found;
  } catch {
    return [];
  }
}

async function discoverViaGeminiGroundingFallback(
  prospect: ProspectBrandInput,
  timeoutMs = 3000
): Promise<{
  websiteUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
} | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const location = [prospect.city, prospect.province, 'Italia'].filter(Boolean).join(', ');
    const prompt = `Trova i profili ufficiali online dell'attività "${prospect.business_name}" (${location}).
Restituisci SOLO JSON valido senza testo extra:
{
  "instagramUrl": string | null,
  "facebookUrl": string | null,
  "websiteUrl": string | null
}`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0 },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      }
    );
    if (!res.ok) return null;

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = (json.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || '')
      .join('\n')
      .trim();
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) return null;

    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    return {
      instagramUrl:
        typeof parsed.instagramUrl === 'string'
          ? normalizeInstagramProfileUrl(parsed.instagramUrl)
          : null,
      facebookUrl:
        typeof parsed.facebookUrl === 'string' && extractFacebookPageSlugSafe(parsed.facebookUrl)
          ? parsed.facebookUrl
          : null,
      websiteUrl:
        typeof parsed.websiteUrl === 'string' ? normalizeUrlWebsiteRoot(parsed.websiteUrl) : null,
    };
  } catch {
    return null;
  }
}

function extractFacebookPageSlugSafe(rawUrl: string): string | null {
  return buildFacebookGraphPictureUrl(rawUrl);
}

export async function searchWebForInstagramProfile(
  businessName: string,
  city?: string | null,
  timeoutMs = 2400
): Promise<{ instagramUrl: string; evidenceSource: string } | null> {
  const query = [businessName, city || '', 'instagram'].filter(Boolean).join(' ');
  const [yahooHits, ddgHits] = await Promise.all([
    queryYahooItaliaHits(query, timeoutMs),
    queryDuckDuckGoHits(query, timeoutMs),
  ]);

  const ranked = [...yahooHits, ...ddgHits]
    .map((h) => classifyAndScoreWebHit(h, businessName, city))
    .filter((x): x is NonNullable<typeof x> => Boolean(x && x.kind === 'instagram'))
    .sort((a, b) => b.score - a.score);

  if (ranked.length > 0) {
    return {
      instagramUrl: ranked[0].normalizedUrl,
      evidenceSource: 'Ricerca Web Pubblica',
    };
  }
  return null;
}

/**
 * Discovers verified public brand assets (logo candidates, website, Instagram, Facebook)
 * without violating Maps Terms or relying on a single rate-limited provider.
 */
export async function discoverBrandOnlineForProspect(
  prospect: ProspectBrandInput,
  options?: { timeoutMs?: number; allowGeminiFallback?: boolean }
): Promise<{
  candidateUrls: string[];
  logoSource: string | null;
  discoveredWebsite: string | null;
  discoveredInstagramUrl: string | null;
  discoveredFacebookUrl: string | null;
}> {
  const timeoutMs = options?.timeoutMs ?? 2500;
  const searchQuery = [prospect.business_name, prospect.city || ''].filter(Boolean).join(' ');

  const [appleMatch, yahooHits, ddgHits] = await Promise.all([
    searchAppleAppStoreBrand(prospect.business_name, timeoutMs),
    queryYahooItaliaHits(searchQuery, timeoutMs),
    queryDuckDuckGoHits(searchQuery, timeoutMs),
  ]);

  const candidateUrls: string[] = [];
  const sourceLabels: string[] = [];
  let discoveredWebsite: string | null = null;
  let discoveredInstagramUrl: string | null = isValidInstagramProfileUrl(prospect.instagram_url)
    ? prospect.instagram_url || null
    : null;
  let discoveredFacebookUrl: string | null = prospect.facebook_url || null;

  const pushCandidate = (u?: string | null, label?: string) => {
    const safe = isSafePublicHttpUrl(u);
    if (safe && !candidateUrls.includes(safe.toString())) {
      candidateUrls.push(safe.toString());
      if (label && !sourceLabels.includes(label)) {
        sourceLabels.push(label);
      }
    }
  };

  if (appleMatch?.logoUrl) {
    pushCandidate(appleMatch.logoUrl, 'App Store Ufficiale');
  }

  const classified = [...yahooHits, ...ddgHits]
    .map((hit) => classifyAndScoreWebHit(hit, prospect.business_name, prospect.city))
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score);

  const followTasks: Array<Promise<void>> = [];

  for (const hit of classified.slice(0, 5)) {
    if (hit.kind === 'website' && !discoveredWebsite) {
      discoveredWebsite = hit.normalizedUrl;
      followTasks.push(
        extractWebsiteLogos(hit.normalizedUrl, prospect.business_name, timeoutMs).then((urls) => {
          for (const u of urls) pushCandidate(u, 'Sito Web Ufficiale');
        })
      );
    } else if (hit.kind === 'instagram') {
      if (!discoveredInstagramUrl) discoveredInstagramUrl = hit.normalizedUrl;
      followTasks.push(
        extractSocialProfileOgImage(hit.normalizedUrl, timeoutMs).then((igImg) => {
          pushCandidate(igImg, 'Profilo Instagram');
        })
      );
    } else if (hit.kind === 'facebook') {
      if (!discoveredFacebookUrl) discoveredFacebookUrl = hit.normalizedUrl;
      pushCandidate(buildFacebookGraphPictureUrl(hit.normalizedUrl), 'Pagina Facebook');
      followTasks.push(
        extractSocialProfileOgImage(hit.normalizedUrl, timeoutMs).then((fbImg) => {
          pushCandidate(fbImg, 'Pagina Facebook');
        })
      );
    } else if (hit.kind === 'play_store') {
      followTasks.push(
        extractPlayStoreAppIcon(hit.normalizedUrl, timeoutMs).then((iconUrl) => {
          pushCandidate(iconUrl, 'Google Play Ufficiale');
        })
      );
    } else if (hit.kind === 'booking' && candidateUrls.length === 0) {
      followTasks.push(
        extractWebsiteLogos(hit.normalizedUrl, prospect.business_name, timeoutMs).then((urls) => {
          for (const u of urls.slice(0, 2)) pushCandidate(u, 'Profilo Booking');
        })
      );
    }
  }

  if (followTasks.length > 0) {
    await Promise.all(followTasks);
  }

  if (candidateUrls.length === 0 && options?.allowGeminiFallback) {
    const gemini = await discoverViaGeminiGroundingFallback(prospect, timeoutMs);
    if (gemini) {
      if (gemini.instagramUrl) {
        discoveredInstagramUrl ||= gemini.instagramUrl;
        pushCandidate(
          await extractSocialProfileOgImage(gemini.instagramUrl, timeoutMs),
          'Profilo Instagram'
        );
      }
      if (gemini.facebookUrl) {
        discoveredFacebookUrl ||= gemini.facebookUrl;
        pushCandidate(buildFacebookGraphPictureUrl(gemini.facebookUrl), 'Pagina Facebook');
      }
      if (gemini.websiteUrl) {
        discoveredWebsite ||= gemini.websiteUrl;
        const siteLogos = await extractWebsiteLogos(
          gemini.websiteUrl,
          prospect.business_name,
          timeoutMs
        );
        for (const u of siteLogos) pushCandidate(u, 'Sito Web Ufficiale');
      }
    }
  }

  return {
    candidateUrls,
    logoSource: sourceLabels[0] || null,
    discoveredWebsite,
    discoveredInstagramUrl,
    discoveredFacebookUrl,
  };
}

/**
 * Ensures a prospect has a verified raster logo resolved and persisted into `digital_signals.logoUrl`.
 * Used across preview OG generation, preview DTO loading, and CRM auto-detection.
 */
export async function ensureProspectLogoPersisted(
  adminDb: SupabaseClient | null,
  prospect: ProspectBrandInput,
  options?: {
    discoverIfMissing?: boolean;
    forceRediscover?: boolean;
    allowGeminiFallback?: boolean;
    timeoutMs?: number;
  }
): Promise<ProspectBrandDiscoveryResult> {
  const timeoutMs = options?.timeoutMs ?? 2400;
  const existingSignals = (prospect.digital_signals || {}) as PublicDigitalSignals &
    Record<string, unknown>;
  const existingCustomLogo =
    typeof existingSignals.customLogoUrl === 'string' && existingSignals.customLogoUrl.trim()
      ? existingSignals.customLogoUrl.trim()
      : null;

  if (!options?.forceRediscover) {
    const { fallbackCandidates } = await resolveProspectLogoCandidates(prospect, {
      allowLiveWebsiteFetch: true,
      timeoutMs,
    });
    if (fallbackCandidates.length > 0) {
      const asset = await fetchSafeLogoBinary(fallbackCandidates, { timeoutMs });
      if (asset) {
        const inferredSource = existingCustomLogo
          ? 'Logo Custom'
          : prospect.website
          ? 'Sito Web'
          : prospect.instagram_url
          ? 'Profilo Instagram'
          : prospect.facebook_url
          ? 'Pagina Facebook'
          : (existingSignals.logoSource as string | undefined) || 'Rilevato Online';

        if (
          adminDb &&
          !existingCustomLogo &&
          existingSignals.logoUrl !== asset.sourceUrl
        ) {
          await persistDiscoveredFields(adminDb, prospect.id, existingSignals, {
            logoUrl: asset.sourceUrl,
            logoSource: inferredSource,
          });
        }

        return {
          logoUrl: existingCustomLogo || asset.sourceUrl,
          logoSource: inferredSource,
          discoveredWebsite: null,
          discoveredInstagramUrl: null,
          discoveredFacebookUrl: null,
          imageAsset: asset,
        };
      }
    }
  }

  if (options?.discoverIfMissing === false) {
    return {
      logoUrl: existingCustomLogo,
      logoSource: existingCustomLogo ? 'Logo Custom' : null,
      discoveredWebsite: null,
      discoveredInstagramUrl: null,
      discoveredFacebookUrl: null,
      imageAsset: null,
    };
  }

  const online = await discoverBrandOnlineForProspect(prospect, {
    timeoutMs,
    allowGeminiFallback: options?.allowGeminiFallback ?? false,
  });

  if (online.candidateUrls.length === 0) {
    return {
      logoUrl: existingCustomLogo,
      logoSource: existingCustomLogo ? 'Logo Custom' : null,
      discoveredWebsite: online.discoveredWebsite,
      discoveredInstagramUrl: online.discoveredInstagramUrl,
      discoveredFacebookUrl: online.discoveredFacebookUrl,
      imageAsset: null,
    };
  }

  const asset = await fetchSafeLogoBinary(online.candidateUrls, { timeoutMs });
  if (!asset) {
    return {
      logoUrl: existingCustomLogo,
      logoSource: existingCustomLogo ? 'Logo Custom' : null,
      discoveredWebsite: online.discoveredWebsite,
      discoveredInstagramUrl: online.discoveredInstagramUrl,
      discoveredFacebookUrl: online.discoveredFacebookUrl,
      imageAsset: null,
    };
  }

  if (adminDb) {
    await persistDiscoveredFields(adminDb, prospect.id, existingSignals, {
      logoUrl: existingCustomLogo ? undefined : asset.sourceUrl,
      logoSource: existingCustomLogo ? undefined : online.logoSource || 'Rilevato Online',
      website: prospect.website ? undefined : online.discoveredWebsite || undefined,
      instagramUrl: prospect.instagram_url ? undefined : online.discoveredInstagramUrl || undefined,
      facebookUrl: prospect.facebook_url ? undefined : online.discoveredFacebookUrl || undefined,
    });
  }

  return {
    logoUrl: existingCustomLogo || asset.sourceUrl,
    logoSource: existingCustomLogo ? 'Logo Custom' : online.logoSource || 'Rilevato Online',
    discoveredWebsite: online.discoveredWebsite,
    discoveredInstagramUrl: online.discoveredInstagramUrl,
    discoveredFacebookUrl: online.discoveredFacebookUrl,
    imageAsset: asset,
  };
}

async function persistDiscoveredFields(
  adminDb: SupabaseClient,
  prospectId: string,
  existingSignals: Record<string, unknown>,
  updatesInput: {
    logoUrl?: string;
    logoSource?: string;
    website?: string;
    instagramUrl?: string;
    facebookUrl?: string;
  }
): Promise<void> {
  try {
    const nowIso = new Date().toISOString();
    const nextSignals: Record<string, unknown> = {
      ...existingSignals,
      ...(updatesInput.logoUrl ? { logoUrl: updatesInput.logoUrl, logoDiscoveredAt: nowIso } : {}),
      ...(updatesInput.logoSource ? { logoSource: updatesInput.logoSource } : {}),
    };

    const rowUpdates: Record<string, unknown> = {
      digital_signals: nextSignals,
      updated_at: nowIso,
    };

    if (updatesInput.website) {
      rowUpdates.website = updatesInput.website;
      try {
        rowUpdates.website_domain = new URL(updatesInput.website).hostname.replace(/^www\./i, '');
      } catch {
        // Ignore domain parse error
      }
    }
    if (updatesInput.instagramUrl) {
      rowUpdates.instagram_url = updatesInput.instagramUrl;
    }
    if (updatesInput.facebookUrl) {
      rowUpdates.facebook_url = updatesInput.facebookUrl;
    }

    await adminDb.from('outreach_prospects').update(rowUpdates).eq('id', prospectId);
  } catch {
    // Opportunistic cache write must never break public preview generation
  }
}

export async function discoverBrandLogosBatch(
  adminDb: SupabaseClient | null,
  prospects: ProspectBrandInput[],
  options?: { concurrency?: number; maxItems?: number; timeoutMs?: number }
): Promise<Map<string, ProspectBrandDiscoveryResult>> {
  const concurrency = Math.max(1, Math.min(options?.concurrency ?? 4, 6));
  const queue = prospects.slice(0, options?.maxItems ?? 15);
  const results = new Map<string, ProspectBrandDiscoveryResult>();
  let cursor = 0;

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (cursor < queue.length) {
      const idx = cursor++;
      const item = queue[idx];
      if (!item?.id) continue;
      const res = await ensureProspectLogoPersisted(adminDb, item, {
        discoverIfMissing: true,
        allowGeminiFallback: false,
        timeoutMs: options?.timeoutMs ?? 2200,
      });
      if (res.logoUrl) {
        results.set(item.id, res);
      }
    }
  });

  await Promise.all(workers);
  return results;
}

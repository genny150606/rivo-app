import type { PublicDigitalSignals } from './types';

const PRIVATE_HOSTNAME_REGEX =
  /^(localhost|.*\.local|.*\.internal|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|0\.0\.0\.0|\[?::1\]?|\[?fe80:.*|\[?fc.*|\[?fd.*)$/i;

const BLOCKED_PATH_FILENAME_REGEX =
  /(pixel|spacer|1x1|blank|transparent|analytics|tracking|cookie|gdpr|badge[-_.]?google|app[-_.]?store[-_.]?badge|google[-_.]?play[-_.]?badge)/i;

const BLOCKED_SOCIAL_ICON_FILENAME_REGEX =
  /(facebook|instagram|whatsapp|youtube|tiktok|linkedin|twitter)[-_.]?(icon|logo|badge|btn|button|share|mark)|\/(icons?|social|sprites?)\/.*(facebook|instagram|whatsapp|youtube|tiktok)/i;

const BLOCKED_GENERIC_AVATAR_REGEX =
  /(static\.xx\.fbcdn\.net\/rsrc\.php|static\.cdninstagram\.com\/rsrc\.php|default[-_.]?avatar|silhouett|anonymous[-_.]?user|placeholder[-_.]?logo)/i;

const RESERVED_FACEBOOK_SLUGS = new Set([
  'login',
  'watch',
  'marketplace',
  'events',
  'groups',
  'share',
  'sharer',
  'sharer.php',
  'photo',
  'photo.php',
  'story.php',
  'help',
  'policies',
  'privacy',
  'settings',
  'pages',
  'reel',
  'reels',
]);

const RESERVED_INSTAGRAM_SLUGS = new Set([
  'p',
  'reel',
  'reels',
  'stories',
  'explore',
  'accounts',
  'about',
  'legal',
  'privacy',
  'developer',
  'direct',
  'tv',
  'tags',
  'locations',
]);

const SOCIAL_CRAWLER_USER_AGENT =
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

/**
 * Validates that a candidate external URL is a safe public http(s) URL (anti-SSRF).
 */
export function isSafePublicHttpUrl(rawUrl?: string | null): URL | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 1500) return null;

  try {
    const hasExplicitScheme = /^[a-z][a-z0-9+-]*:/i.test(trimmed);
    const normalized = hasExplicitScheme ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname || !parsed.hostname.includes('.')) return null;
    if (PRIVATE_HOSTNAME_REGEX.test(parsed.hostname)) return null;
    if (parsed.username || parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getBusinessInitials(businessName: string): string {
  const words = (businessName || 'RIVO')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1 || /^\d+$/.test(w));

  if (words.length === 0) return 'RV';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function computeLogoVersionTag(
  logoUrl?: string | null,
  businessName?: string | null
): string {
  const input = `${logoUrl || 'none'}|${businessName || ''}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return `3-${hash.toString(36)}`;
}

function isBlockedDecorativeImageUrl(resolvedUrl: string): boolean {
  if (BLOCKED_GENERIC_AVATAR_REGEX.test(resolvedUrl)) return true;
  try {
    const parsed = new URL(resolvedUrl);
    const pathAndQuery = `${parsed.pathname}${parsed.search}`.toLowerCase();
    // Allow Instagram / Facebook CDN image endpoints without rejecting their hostname
    const isSocialCdnHost =
      /(cdninstagram\.com|fbcdn\.net|fbsbx\.com|graph\.facebook\.com|mzstatic\.com|googleusercontent\.com)$/i.test(
        parsed.hostname
      );
    if (!isSocialCdnHost && BLOCKED_SOCIAL_ICON_FILENAME_REGEX.test(pathAndQuery)) {
      return true;
    }
    return BLOCKED_PATH_FILENAME_REGEX.test(pathAndQuery);
  } catch {
    return true;
  }
}

function resolveCandidateUrl(raw: string, baseUrl: string): string | null {
  const cleaned = raw.trim().replace(/&amp;/g, '&').replace(/^['"]|['"]$/g, '');
  if (!cleaned || cleaned.startsWith('data:') || cleaned.startsWith('javascript:')) return null;
  try {
    const resolved = new URL(cleaned, baseUrl).toString();
    return isSafePublicHttpUrl(resolved) ? resolved : null;
  } catch {
    return null;
  }
}

function extractTagAttribute(tag: string, attrName: string): string | null {
  const re = new RegExp(`${attrName}=["']([^"']+)["']`, 'i');
  return tag.match(re)?.[1] ?? null;
}

function pickFirstSrcsetUrl(srcset: string | null): string | null {
  if (!srcset) return null;
  const firstEntry = srcset.split(',')[0]?.trim();
  if (!firstEntry) return null;
  return firstEntry.split(/\s+/)[0] || null;
}

function extractJsonLdLogoUrls(html: string): string[] {
  const found: string[] = [];
  const scripts =
    html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ||
    [];

  for (const scriptTag of scripts.slice(0, 8)) {
    const jsonText = scriptTag
      .replace(/^<script[^>]*>/i, '')
      .replace(/<\/script>$/i, '')
      .trim();
    if (!jsonText || jsonText.length > 35000) continue;

    try {
      const parsed = JSON.parse(jsonText) as unknown;
      const queue: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed];

      while (queue.length > 0) {
        const node = queue.shift();
        if (!node || typeof node !== 'object') continue;
        const obj = node as Record<string, unknown>;

        if (Array.isArray(obj['@graph'])) {
          queue.push(...obj['@graph']);
        }

        const rawLogo = obj.logo;
        if (typeof rawLogo === 'string') {
          found.push(rawLogo);
        } else if (rawLogo && typeof rawLogo === 'object') {
          const logoObj = rawLogo as Record<string, unknown>;
          if (typeof logoObj.url === 'string') found.push(logoObj.url);
          if (typeof logoObj.contentUrl === 'string') found.push(logoObj.contentUrl);
        }

        if (found.length < 3 && typeof obj.image === 'string') {
          found.push(obj.image);
        } else if (found.length < 3 && Array.isArray(obj.image) && typeof obj.image[0] === 'string') {
          found.push(obj.image[0]);
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks
    }
  }

  return found;
}

/**
 * Extracts and ranks brand logo / icon URL candidates from a website or profile HTML page.
 */
export function extractLogoCandidatesFromHtml(
  html: string,
  baseUrl: string,
  businessName?: string | null
): string[] {
  if (!html || !baseUrl) return [];
  const candidates: Array<{ url: string; score: number }> = [];

  const pushCandidate = (raw: string | null, score: number) => {
    if (!raw) return;
    const resolved = resolveCandidateUrl(raw, baseUrl);
    if (!resolved || isBlockedDecorativeImageUrl(resolved)) return;
    const lower = resolved.toLowerCase();
    let adjusted = score;
    if (/\.png(\?|$)/.test(lower)) adjusted += 16;
    else if (/\.jpe?g(\?|$)/.test(lower)) adjusted += 12;
    else if (/\.webp(\?|$)/.test(lower)) adjusted += 8;
    else if (/\.svg(\?|$)/.test(lower)) adjusted += 2;
    else if (/\.ico(\?|$)/.test(lower)) adjusted -= 18;
    candidates.push({ url: resolved, score: adjusted });
  };

  // 0. JSON-LD Organization / LocalBusiness logo
  for (const jsonLdUrl of extractJsonLdLogoUrls(html)) {
    pushCandidate(jsonLdUrl, 96);
  }

  // 1. <link> tags (apple-touch-icon, icon, shortcut icon)
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    const rel = (extractTagAttribute(tag, 'rel') || '').toLowerCase();
    const href = extractTagAttribute(tag, 'href');
    if (!href) continue;

    if (rel.includes('apple-touch-icon')) {
      pushCandidate(href, 93);
    } else if (/\bicon\b/.test(rel)) {
      const sizes = extractTagAttribute(tag, 'sizes') || '';
      const bigSize = /192|180|152|144|128|96|any/.test(sizes);
      pushCandidate(href, bigSize ? 88 : 70);
    }
  }

  // 2. Header / brand <img> tags mentioning logo or matching business name
  const nameTokens = (businessName || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);

  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of imgTags.slice(0, 75)) {
    const src =
      extractTagAttribute(tag, 'src') ||
      extractTagAttribute(tag, 'data-src') ||
      extractTagAttribute(tag, 'data-lazy-src') ||
      pickFirstSrcsetUrl(extractTagAttribute(tag, 'srcset'));
    if (!src) continue;

    const alt = extractTagAttribute(tag, 'alt') || '';
    const cls = extractTagAttribute(tag, 'class') || '';
    const id = extractTagAttribute(tag, 'id') || '';
    const combined = `${src} ${alt} ${cls} ${id}`.toLowerCase();

    if (/logo|brand|header-img|navbar-brand|custom-logo|site-logo/.test(combined)) {
      pushCandidate(src, 91);
    } else if (nameTokens.some((tok) => alt.toLowerCase().includes(tok))) {
      pushCandidate(src, 82);
    }
  }

  // 3. OpenGraph / Twitter meta images
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metaTags) {
    const prop = (
      extractTagAttribute(tag, 'property') ||
      extractTagAttribute(tag, 'name') ||
      ''
    ).toLowerCase();
    const content = extractTagAttribute(tag, 'content');
    if (!content) continue;
    if (
      prop === 'og:image' ||
      prop === 'og:image:secure_url' ||
      prop === 'twitter:image' ||
      prop === 'twitter:image:src'
    ) {
      pushCandidate(content, 76);
    }
  }

  if (candidates.length === 0) return [];
  candidates.sort((a, b) => b.score - a.score);

  const uniqueUrls: string[] = [];
  for (const item of candidates) {
    if (!uniqueUrls.includes(item.url)) {
      uniqueUrls.push(item.url);
    }
    if (uniqueUrls.length >= 6) break;
  }
  return uniqueUrls;
}

/**
 * Backwards-compatible wrapper returning the highest-scoring logo URL candidate from HTML.
 */
export function extractLogoCandidateFromHtml(
  html: string,
  baseUrl: string,
  businessName?: string | null
): string | null {
  return extractLogoCandidatesFromHtml(html, baseUrl, businessName)[0] || null;
}

export function buildGoogleFaviconUrl(domainOrUrl?: string | null): string | null {
  const parsed = isSafePublicHttpUrl(domainOrUrl);
  if (!parsed) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=256`;
}

/**
 * Extracts a clean page ID or slug from a public Facebook URL.
 */
export function extractFacebookPageSlug(rawUrl?: string | null): string | null {
  const parsed = isSafePublicHttpUrl(rawUrl);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase();
  if (!host.includes('facebook.com') && !host.includes('fb.com')) return null;

  const profileId = parsed.searchParams.get('id');
  if (profileId && /^\d{6,22}$/.test(profileId)) {
    return profileId;
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const firstLower = segments[0].toLowerCase();
  if (RESERVED_FACEBOOK_SLUGS.has(firstLower)) return null;

  if (firstLower === 'p' && segments[1]) {
    const idTail = segments[1].match(/-(\d{8,22})$/)?.[1];
    return idTail || segments[1];
  }

  if (firstLower === 'people' && segments[2] && /^\d{6,22}$/.test(segments[2])) {
    return segments[2];
  }

  return segments[0];
}

export function buildFacebookGraphPictureUrl(rawUrl?: string | null): string | null {
  const slug = extractFacebookPageSlug(rawUrl);
  if (!slug) return null;
  return `https://graph.facebook.com/${encodeURIComponent(slug)}/picture?type=large&width=400&height=400`;
}

export function isValidInstagramProfileUrl(rawUrl?: string | null): string | null {
  const parsed = isSafePublicHttpUrl(rawUrl);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase();
  if (!host.includes('instagram.com') && !host.includes('instagr.am')) return null;
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  if (host.includes('instagram.com') && RESERVED_INSTAGRAM_SLUGS.has(segments[0].toLowerCase())) {
    return null;
  }
  return parsed.toString();
}

/**
 * Extracts the public `og:image` avatar URL from an Instagram profile or Facebook page.
 */
export async function extractSocialProfileOgImage(
  rawUrl?: string | null,
  timeoutMs = 2400
): Promise<string | null> {
  const safeUrl = isSafePublicHttpUrl(rawUrl);
  if (!safeUrl) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(safeUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': SOCIAL_CRAWLER_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const html = (await res.text()).slice(0, 140000);
    const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const tag of metaTags) {
      const prop = (
        extractTagAttribute(tag, 'property') ||
        extractTagAttribute(tag, 'name') ||
        ''
      ).toLowerCase();
      if (prop !== 'og:image' && prop !== 'og:image:secure_url') continue;
      const content = extractTagAttribute(tag, 'content');
      const resolved = content ? resolveCandidateUrl(content, res.url || safeUrl.toString()) : null;
      if (resolved && !BLOCKED_GENERIC_AVATAR_REGEX.test(resolved)) {
        return resolved;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export interface LogoCandidateInput {
  id?: string | null;
  business_name?: string | null;
  website?: string | null;
  website_domain?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  digital_signals?: PublicDigitalSignals | Record<string, unknown> | null;
}

/**
 * Resolves the best public logo URL candidates for a prospect record:
 * 1) Admin customLogoUrl override
 * 2) Cached digital_signals.logoUrl
 * 3) Optional quick live scan of prospect.website (JSON-LD, apple-touch-icon, header img, og:image)
 * 4) Public Instagram profile og:image or Facebook Graph / page avatar
 * 5) Google high-res favicon service when website/domain exists
 */
export async function resolveProspectLogoCandidates(
  prospect: LogoCandidateInput,
  options?: { allowLiveWebsiteFetch?: boolean; timeoutMs?: number }
): Promise<{ primaryLogoUrl: string | null; fallbackCandidates: string[] }> {
  const signals = (prospect.digital_signals || {}) as PublicDigitalSignals;
  const ordered: string[] = [];

  const pushUnique = (u?: string | null) => {
    const valid = isSafePublicHttpUrl(u);
    if (valid && !ordered.includes(valid.toString())) {
      ordered.push(valid.toString());
    }
  };

  pushUnique(signals.customLogoUrl);
  pushUnique(signals.logoUrl);

  const siteUrl = isSafePublicHttpUrl(prospect.website || prospect.website_domain);
  const timeoutMs = options?.timeoutMs ?? 2000;
  const allowLive = options?.allowLiveWebsiteFetch !== false;

  if (ordered.length === 0 && siteUrl && allowLive) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(siteUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'RIVO-PreviewResolver/1.0 (+https://rivo-app-ten.vercel.app)',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const html = (await res.text()).slice(0, 100000);
        const extractedList = extractLogoCandidatesFromHtml(
          html,
          res.url || siteUrl.toString(),
          prospect.business_name
        );
        for (const candidate of extractedList.slice(0, 4)) {
          pushUnique(candidate);
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  if (allowLive && (prospect.instagram_url || prospect.facebook_url)) {
    const [igOgImage, fbOgImage] = await Promise.all([
      isValidInstagramProfileUrl(prospect.instagram_url)
        ? extractSocialProfileOgImage(prospect.instagram_url, timeoutMs)
        : Promise.resolve(null),
      prospect.facebook_url && !buildFacebookGraphPictureUrl(prospect.facebook_url)
        ? extractSocialProfileOgImage(prospect.facebook_url, timeoutMs)
        : Promise.resolve(null),
    ]);

    pushUnique(igOgImage);
    pushUnique(buildFacebookGraphPictureUrl(prospect.facebook_url));
    pushUnique(fbOgImage);
  } else {
    pushUnique(buildFacebookGraphPictureUrl(prospect.facebook_url));
  }

  const s2 = buildGoogleFaviconUrl(prospect.website || prospect.website_domain);
  pushUnique(s2);

  return {
    primaryLogoUrl: ordered[0] || null,
    fallbackCandidates: ordered,
  };
}

function readPngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  return { width, height };
}

function detectSatoriRasterMime(bytes: Uint8Array): 'image/png' | 'image/jpeg' | 'image/gif' | null {
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

function uint8ToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Downloads the first valid Satori-compatible raster image (PNG, JPEG, GIF) as a data URI.
 * For WebP/SVG/ICO conversion in Node.js server routes, prefer `fetchSafeServerSatoriLogoDataUri`
 * from `./brand-discovery`.
 */
export async function fetchSafeSatoriLogoDataUri(
  candidateUrls: string[],
  timeoutMs = 2200
): Promise<string | null> {
  const MAX_BYTES = 1_500_000;

  for (const rawUrl of candidateUrls) {
    const safeUrl = isSafePublicHttpUrl(rawUrl);
    if (!safeUrl) continue;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(safeUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'image/png,image/jpeg,image/gif,*/*;q=0.5',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) continue;

      const contentLength = Number(res.headers.get('content-length') || '0');
      if (contentLength > MAX_BYTES) continue;

      const buf = await res.arrayBuffer();
      if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) continue;

      const bytes = new Uint8Array(buf);
      const mime = detectSatoriRasterMime(bytes);
      if (!mime) continue;

      if (mime === 'image/png') {
        const dims = readPngDimensions(bytes);
        if (dims && (dims.width < 32 || dims.height < 32)) {
          continue;
        }
      }

      return `data:${mime};base64,${uint8ToBase64(bytes)}`;
    } catch {
      // Try next candidate
    }
  }

  return null;
}

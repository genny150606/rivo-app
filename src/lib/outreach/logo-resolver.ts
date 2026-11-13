import type { PublicDigitalSignals } from './types';

const PRIVATE_HOSTNAME_REGEX =
  /^(localhost|.*\.local|.*\.internal|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|0\.0\.0\.0|\[?::1\]?|\[?fe80:.*|\[?fc.*|\[?fd.*)$/i;

const BLOCKED_IMAGE_FILENAME_REGEX =
  /(pixel|spacer|1x1|blank|transparent|analytics|tracking|badge-google|app-store|google-play|facebook|instagram|whatsapp|youtube|tiktok|cookie|gdpr)/i;

/**
 * Validates that a candidate external URL is a safe public http(s) URL (anti-SSRF).
 */
export function isSafePublicHttpUrl(rawUrl?: string | null): URL | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 1000) return null;

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
  return `2-${hash.toString(36)}`;
}

function resolveCandidateUrl(raw: string, baseUrl: string): string | null {
  const cleaned = raw.trim().replace(/&amp;/g, '&');
  if (!cleaned || cleaned.startsWith('data:')) return null;
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

/**
 * Extracts and ranks the best brand logo / icon URL candidate from a website's HTML.
 */
export function extractLogoCandidateFromHtml(html: string, baseUrl: string): string | null {
  if (!html || !baseUrl) return null;
  const candidates: Array<{ url: string; score: number }> = [];

  const pushCandidate = (raw: string | null, score: number) => {
    if (!raw) return;
    if (BLOCKED_IMAGE_FILENAME_REGEX.test(raw)) return;
    const resolved = resolveCandidateUrl(raw, baseUrl);
    if (!resolved) return;
    if (BLOCKED_IMAGE_FILENAME_REGEX.test(resolved)) return;
    const lower = resolved.toLowerCase();
    let adjusted = score;
    if (lower.endsWith('.png')) adjusted += 18;
    else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) adjusted += 12;
    else if (lower.endsWith('.webp')) adjusted += 6;
    else if (lower.endsWith('.ico')) adjusted -= 20;
    else if (lower.endsWith('.svg')) adjusted -= 6;
    candidates.push({ url: resolved, score: adjusted });
  };

  // 1. <link> tags (apple-touch-icon, icon, shortcut icon)
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    const rel = (extractTagAttribute(tag, 'rel') || '').toLowerCase();
    const href = extractTagAttribute(tag, 'href');
    if (!href) continue;

    if (rel.includes('apple-touch-icon')) {
      pushCandidate(href, 92);
    } else if (/\bicon\b/.test(rel)) {
      const sizes = extractTagAttribute(tag, 'sizes') || '';
      const bigSize = /192|180|152|144|128|96/.test(sizes);
      pushCandidate(href, bigSize ? 86 : 68);
    }
  }

  // 2. Header / brand <img> tags mentioning logo
  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of imgTags.slice(0, 60)) {
    const src = extractTagAttribute(tag, 'src') || extractTagAttribute(tag, 'data-src');
    if (!src) continue;
    const alt = extractTagAttribute(tag, 'alt') || '';
    const cls = extractTagAttribute(tag, 'class') || '';
    const id = extractTagAttribute(tag, 'id') || '';
    const combined = `${src} ${alt} ${cls} ${id}`.toLowerCase();

    if (/logo|brand|header-img|navbar-brand|custom-logo/.test(combined)) {
      pushCandidate(src, 90);
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
    if (prop === 'og:image' || prop === 'og:image:secure_url' || prop === 'twitter:image') {
      pushCandidate(content, 74);
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].url;
}

export function buildGoogleFaviconUrl(domainOrUrl?: string | null): string | null {
  const parsed = isSafePublicHttpUrl(domainOrUrl);
  if (!parsed) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=256`;
}

/**
 * Resolves the best public logo URL for a prospect record:
 * 1) Admin customLogoUrl override
 * 2) Cached digital_signals.logoUrl
 * 3) Optional quick live scan of prospect.website
 * 4) Google high-res favicon service when website/domain exists
 */
export async function resolveProspectLogoCandidates(
  prospect: {
    website?: string | null;
    website_domain?: string | null;
    digital_signals?: PublicDigitalSignals | Record<string, unknown> | null;
  },
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

  if (ordered.length === 0 && siteUrl && options?.allowLiveWebsiteFetch !== false) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options?.timeoutMs ?? 2000);
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
        const html = (await res.text()).slice(0, 90000);
        const extracted = extractLogoCandidateFromHtml(html, res.url || siteUrl.toString());
        pushUnique(extracted);
      }
    } catch {
      // Non-blocking fallback
    }
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
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  return { width, height };
}

function detectSatoriRasterMime(bytes: Uint8Array): 'image/png' | 'image/jpeg' | 'image/gif' | null {
  if (bytes.length < 12) return null;
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  // GIF
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
 * Rejects default tiny 16x16 favicons or unsupported formats (e.g. WebP/ICO/broken SVG) so
 * Next.js ImageResponse never throws.
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
          'User-Agent': 'RIVO-OGImageResolver/1.0',
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

      // Reject generic tiny 16x16 / 24x24 default globe favicons from Google S2
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

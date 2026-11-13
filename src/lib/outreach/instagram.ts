import { buildProspectDemoUrl, resolveDemoVertical } from './preview';
import { findSubcategoryDef, type OutreachProspectRecord } from './types';

const RESERVED_INSTAGRAM_SEGMENTS = new Set([
  'p',
  'reel',
  'reels',
  'stories',
  'story',
  'explore',
  'accounts',
  'direct',
  'tv',
  'share',
  'sharer',
  'oauth',
  'legal',
  'about',
  'developer',
  'developers',
  'directory',
  'privacy',
  'terms',
  'help',
  'press',
  'blog',
  'api',
  'static',
  'web',
  'tags',
  'locations',
  'audio',
  'nametag',
  'challenge',
  'login',
  'signup',
]);

const GENERIC_BUSINESS_STOPWORDS = new Set([
  'ristorante',
  'pizzeria',
  'trattoria',
  'osteria',
  'bar',
  'caffe',
  'caffetteria',
  'pasticceria',
  'gelateria',
  'barbiere',
  'barber',
  'shop',
  'barberia',
  'parrucchiere',
  'parrucchieri',
  'salone',
  'hair',
  'studio',
  'centro',
  'estetico',
  'estetica',
  'beauty',
  'nail',
  'hotel',
  'bed',
  'breakfast',
  'resort',
  'boutique',
  'store',
  'negozio',
  'di',
  'da',
  'del',
  'della',
  'delle',
  'dei',
  'degli',
  'la',
  'il',
  'lo',
  'le',
  'gli',
  'un',
  'una',
  'uno',
  'e',
  'ed',
  'the',
  'srl',
  'srls',
  'sas',
  'snc',
  'spa',
  'napoli',
  'milano',
  'roma',
  'salerno',
  'caserta',
  'campania',
  'italia',
  'italy',
]);

const INSTAGRAM_HANDLE_REGEX = /^[a-z0-9](?:[a-z0-9._]{0,28}[a-z0-9])?$/i;

/**
 * Extracts and validates a clean Instagram username (without leading `@`)
 * from either an Instagram URL (`instagram.com/<user>`, `ig.me/m/<user>`) or `@handle`.
 */
export function extractInstagramHandle(rawUrlOrHandle?: string | null): string | null {
  if (!rawUrlOrHandle || typeof rawUrlOrHandle !== 'string') return null;
  let value = rawUrlOrHandle.trim();
  if (!value) return null;

  if (value.startsWith('@')) {
    const candidate = value.slice(1).split(/[/?#\s]/)[0]?.toLowerCase() || '';
    return isValidHandle(candidate) ? candidate : null;
  }

  // Handle full URLs or bare domains like instagram.com/xyz or ig.me/m/xyz
  if (/instagram\.com|instagr\.am|ig\.me/i.test(value)) {
    if (!/^https?:\/\//i.test(value)) {
      value = `https://${value}`;
    }
    try {
      const parsed = new URL(value);
      const host = parsed.hostname.toLowerCase();
      const segments = parsed.pathname
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean);

      if (host.includes('ig.me')) {
        if (segments[0]?.toLowerCase() === 'm' && segments[1]) {
          const h = segments[1].replace(/^@/, '').replace(/[.,;:!?)'"]+$/g, '').toLowerCase();
          return isValidHandle(h) ? h : null;
        }
        return null;
      }

      if (host.includes('instagram.com') || host.includes('instagr.am')) {
        if (segments.length === 0) return null;
        // Skip internal `_u/` only if not meaningful, unwrap `instagram.com/_u/handle`
        const first = segments[0].replace(/^@/, '').replace(/[.,;:!?)'"]+$/g, '').toLowerCase();
        if (first === '_u' && segments[1]) {
          const second = segments[1].replace(/^@/, '').replace(/[.,;:!?)'"]+$/g, '').toLowerCase();
          return isValidHandle(second) ? second : null;
        }
        return isValidHandle(first) ? first : null;
      }
    } catch {
      return null;
    }
  }

  // Fallback bare handle without @ only if strict handle syntax
  const bare = value
    .replace(/^@/, '')
    .split(/[/?#\s]/)[0]
    ?.replace(/[.,;:!?)'"]+$/g, '')
    .toLowerCase() || '';
  return isValidHandle(bare) ? bare : null;
}

function isValidHandle(candidate: string): boolean {
  if (!candidate || candidate.length < 2 || candidate.length > 30) return false;
  if (candidate.includes('..')) return false;
  if (RESERVED_INSTAGRAM_SEGMENTS.has(candidate.toLowerCase())) return false;
  return INSTAGRAM_HANDLE_REGEX.test(candidate);
}

/**
 * Normalizes any valid handle or Instagram URL into canonical `https://www.instagram.com/<handle>/`.
 */
export function normalizeInstagramProfileUrl(rawUrlOrHandle?: string | null): string | null {
  const handle = extractInstagramHandle(rawUrlOrHandle);
  if (!handle) return null;
  return `https://www.instagram.com/${handle}/`;
}

/**
 * Builds Meta's official direct-message deep link (`https://ig.me/m/<handle>`)
 * that opens the DM conversation with `<handle>` in the Instagram app or web Direct.
 */
export function buildInstagramDmDeepLink(rawUrlOrHandle?: string | null): string | null {
  const handle = extractInstagramHandle(rawUrlOrHandle);
  if (!handle) return null;
  return `https://ig.me/m/${handle}`;
}

/**
 * Scans HTML for clean public Instagram profile URLs, skipping post/reel/story embeds.
 */
export function extractVerifiedInstagramFromHtml(html: string): string | null {
  if (!html) return null;
  const regex = /https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/[a-zA-Z0-9._/@%-]+/gi;
  const matches = html.match(regex) || [];
  for (const raw of matches) {
    const normalized = normalizeInstagramProfileUrl(raw);
    if (normalized) return normalized;
  }
  return null;
}

function tokenizeComparable(input: string): string[] {
  return (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

export function scoreInstagramCandidateForProspect(
  candidate: {
    handle: string;
    title?: string | null;
    snippet?: string | null;
    fromGroundingChunk?: boolean;
  },
  prospect: { business_name: string; city?: string | null; website?: string | null }
): number {
  const handle = candidate.handle.toLowerCase();
  const handleNorm = handle.replace(/[._]/g, '');
  const titleNorm = (candidate.title || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const snippetNorm = (candidate.snippet || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const allTokens = tokenizeComparable(prospect.business_name);
  const distinctiveTokens = allTokens.filter((t) => !GENERIC_BUSINESS_STOPWORDS.has(t));
  const tokensToMatch = distinctiveTokens.length > 0 ? distinctiveTokens : allTokens;

  let score = 0;
  if (candidate.fromGroundingChunk) {
    score += 22;
  }

  // Reject huge portal / aggregator accounts unless the business itself is called that
  const blockedPortals = ['tripadvisor', 'thefork', 'paginegialle', 'justeat', 'glovo', 'deliveroo', 'airbnb'];
  if (blockedPortals.includes(handleNorm) && !allTokens.includes(handleNorm)) {
    return -100;
  }

  let matchedDistinctive = 0;
  for (const tok of tokensToMatch) {
    if (handleNorm.includes(tok)) {
      score += 28;
      matchedDistinctive++;
    } else if (titleNorm.includes(tok)) {
      score += 20;
      matchedDistinctive++;
    } else if (snippetNorm.includes(tok)) {
      score += 8;
    }
  }

  // Exact concatenated business slug match inside handle
  const compactBiz = tokensToMatch.join('');
  if (compactBiz.length >= 4 && handleNorm.includes(compactBiz)) {
    score += 25;
  }

  // City alignment bonus
  if (prospect.city) {
    const cityTokens = tokenizeComparable(prospect.city);
    for (const cTok of cityTokens) {
      if (handleNorm.includes(cTok) || titleNorm.includes(cTok) || snippetNorm.includes(cTok)) {
        score += 12;
        break;
      }
    }
  }

  // Must match at least one distinctive name token (or full business name token)
  if (matchedDistinctive === 0 && score < 50) {
    return 0;
  }

  return score;
}

export interface InstagramDiscoveryResult {
  instagramUrl: string | null;
  handle: string | null;
  evidenceSource: string | null;
  confidence: 'high' | 'medium' | 'none';
  searchQuery: string;
}

export type InstagramWebSearchFallback = (
  businessName: string,
  city?: string | null
) => Promise<{ instagramUrl: string; evidenceSource: string } | null>;

async function runGeminiInstagramGrounding(
  prospect: {
    business_name: string;
    city?: string | null;
    province?: string | null;
    address?: string | null;
    website?: string | null;
    category?: string | null;
  },
  searchQuery: string
): Promise<InstagramDiscoveryResult | null> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!geminiKey) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5500);

  try {
    const locationPart = [prospect.city, prospect.province].filter(Boolean).join(' ');
    const prompt = `Usa Google Search per trovare il profilo Instagram ufficiale dell'attività commerciale "${prospect.business_name}"${
      locationPart ? ` situata a ${locationPart}` : ''
    }${prospect.address ? ` (${prospect.address})` : ''}${
      prospect.website ? ` — sito web: ${prospect.website}` : ''
    }.
Regole rigide:
- Cerca risultati reali su instagram.com pertinenti esattamente a questa attività e città.
- Se trovi un profilo Instagram ufficiale confermato dai risultati di ricerca, indica chiaramente l'URL completo nel formato https://www.instagram.com/username/ .
- Se non esiste alcun profilo verificabile nei risultati di ricerca, rispondi solo: NESSUNO.
- Non indovinare e non inventare mai username.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0 },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();
    const candidate = data?.candidates?.[0];
    if (!candidate) return null;

    const responseText = (candidate.content?.parts || [])
      .map((p: { text?: string }) => p.text || '')
      .join('\n');

    const groundingChunks: Array<{ web?: { uri?: string; title?: string } }> =
      candidate.groundingMetadata?.groundingChunks || [];

    const scoredCandidates = new Map<
      string,
      {
        handle: string;
        score: number;
        evidenceSource: string;
      }
    >();

    const register = (
      rawCandidate: string,
      title: string | null,
      snippet: string | null,
      fromGroundingChunk: boolean,
      evidenceLabel: string
    ) => {
      const handle = extractInstagramHandle(rawCandidate);
      if (!handle) return;
      const score = scoreInstagramCandidateForProspect(
        { handle, title, snippet, fromGroundingChunk },
        prospect
      );
      if (score <= 0) return;

      const existing = scoredCandidates.get(handle);
      if (!existing || score > existing.score) {
        scoredCandidates.set(handle, {
          handle,
          score,
          evidenceSource: evidenceLabel,
        });
      }
    };

    // 1. Inspect actual Google Search grounding chunks (highest authority)
    for (const chunk of groundingChunks) {
      const uri = chunk?.web?.uri || '';
      const title = chunk?.web?.title || '';

      if (/instagram\.com/i.test(uri)) {
        register(uri, title, responseText, true, title || uri);
      }

      // Google Search titles for Instagram profiles frequently follow: "Name (@handle) • Instagram..."
      const titleHandleMatches = title.match(/\(@([a-zA-Z0-9._]{2,30})\)/g) || [];
      for (const m of titleHandleMatches) {
        register(m.slice(1, -1), title, responseText, true, title || uri);
      }

      const titleUrlMatches = title.match(/instagram\.com\/([a-zA-Z0-9._]{2,30})/gi) || [];
      for (const u of titleUrlMatches) {
        register(u, title, responseText, true, title || uri);
      }
    }

    // 2. Inspect grounded answer text for canonical URLs or explicit @handles
    if (!/\bNESSUNO\b/i.test(responseText) || scoredCandidates.size > 0) {
      const hasAnyGrounding = groundingChunks.length > 0;
      const urlMatches =
        responseText.match(/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._/@%-]+/gi) || [];
      for (const u of urlMatches) {
        register(
          u,
          null,
          responseText,
          hasAnyGrounding,
          hasAnyGrounding ? 'Google Search Grounding + URL verificato' : 'Gemini AI Search'
        );
      }

      const atHandles = responseText.match(/(?:^|[\s(])@([a-zA-Z0-9._]{2,30})/g) || [];
      for (const h of atHandles) {
        const cleaned = h.trim().replace(/^[(\s]+/, '');
        register(
          cleaned,
          null,
          responseText,
          hasAnyGrounding,
          hasAnyGrounding ? 'Google Search Grounding (@handle)' : 'Gemini AI Search'
        );
      }
    }

    if (scoredCandidates.size === 0) {
      return null;
    }

    const best = Array.from(scoredCandidates.values()).sort((a, b) => b.score - a.score)[0];
    if (!best || best.score < 32) {
      return null;
    }

    return {
      instagramUrl: `https://www.instagram.com/${best.handle}/`,
      handle: best.handle,
      evidenceSource: best.evidenceSource,
      confidence: best.score >= 52 ? 'high' : 'medium',
      searchQuery,
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Discovers the real public Instagram profile for a commercial business using Gemini 2.5 Flash
 * with live Google Search Grounding (`tools: [{ google_search: {} }]`), falling back to zero-quota
 * public web search when Gemini is unavailable or unindexed.
 * Strictly verifies handles against grounding chunks and business-name similarity (never inventing handles).
 */
export async function findInstagramProfileViaGeminiSearch(
  prospect: {
    business_name: string;
    city?: string | null;
    province?: string | null;
    address?: string | null;
    website?: string | null;
    category?: string | null;
  },
  options?: { webSearchFallback?: InstagramWebSearchFallback }
): Promise<InstagramDiscoveryResult> {
  const searchQuery = `site:instagram.com "${prospect.business_name}" ${prospect.city || ''}`.trim();
  const empty: InstagramDiscoveryResult = {
    instagramUrl: null,
    handle: null,
    evidenceSource: null,
    confidence: 'none',
    searchQuery,
  };

  if (!prospect.business_name?.trim()) {
    return empty;
  }

  const geminiMatch = await runGeminiInstagramGrounding(prospect, searchQuery);
  if (geminiMatch?.instagramUrl) {
    return geminiMatch;
  }

  if (options?.webSearchFallback) {
    try {
      const webMatch = await options.webSearchFallback(prospect.business_name, prospect.city);
      if (webMatch?.instagramUrl) {
        const handle = extractInstagramHandle(webMatch.instagramUrl);
        if (handle) {
          return {
            instagramUrl: webMatch.instagramUrl,
            handle,
            evidenceSource: webMatch.evidenceSource,
            confidence: 'medium',
            searchQuery,
          };
        }
      }
    } catch {
      // Non-blocking zero-quota web fallback
    }
  }

  return empty;
}

/**
 * Concurrently discovers Instagram profiles for a batch of prospects missing `instagram_url`.
 */
export async function discoverInstagramProfilesBatch(
  prospects: Array<{
    id: string;
    business_name: string;
    city?: string | null;
    province?: string | null;
    address?: string | null;
    website?: string | null;
    category?: string | null;
    instagram_url?: string | null;
  }>,
  options?: {
    concurrency?: number;
    maxItems?: number;
    webSearchFallback?: InstagramWebSearchFallback;
  }
): Promise<Map<string, InstagramDiscoveryResult>> {
  const results = new Map<string, InstagramDiscoveryResult>();
  const concurrency = Math.max(1, Math.min(6, options?.concurrency ?? 4));
  const maxItems = Math.max(1, Math.min(25, options?.maxItems ?? 18));

  const targets = prospects
    .filter((p) => !normalizeInstagramProfileUrl(p.instagram_url))
    .slice(0, maxItems);

  if (targets.length === 0) return results;

  let cursor = 0;
  const worker = async () => {
    while (cursor < targets.length) {
      const idx = cursor++;
      const item = targets[idx];
      const res = await findInstagramProfileViaGeminiSearch(item, {
        webSearchFallback: options?.webSearchFallback,
      });
      if (res.instagramUrl) {
        results.set(item.id, res);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, () => worker()));
  return results;
}

/**
 * Generates a concise, natural Instagram DM message tailored to the business
 * and embedding its personalized co-branded RIVO demo URL.
 */
export function buildInstagramDmDraft(
  prospect: Pick<
    OutreachProspectRecord,
    'id' | 'business_name' | 'category' | 'subcategory' | 'city' | 'website' | 'ai_analysis'
  >,
  demoUrlOverride?: string
): string {
  const demoUrl = demoUrlOverride || buildProspectDemoUrl(prospect.business_name, prospect.id);
  const subDef = findSubcategoryDef(prospect.subcategory || prospect.category);
  const vertical = resolveDemoVertical(prospect.category, prospect.subcategory);

  const verticalHook =
    vertical === 'beauty'
      ? 'prenotazione smart in 20 sec, fidelity digitale nel Wallet e raccolta recensioni'
      : vertical === 'hospitality'
      ? 'Wi-Fi 1-tap in camera, guida locale e richieste dirette in reception'
      : vertical === 'retail'
      ? 'catalogo interattivo taglie, VIP pass digitale e raccolta recensioni'
      : 'carrello tavolo condiviso via QR/NFC, conto smart e scudo recensioni Google';

  const topModule = prospect.ai_analysis?.opportunities?.[0]?.moduleName;
  const focusPhrase = topModule ? `${topModule} e ${verticalHook}` : verticalHook;

  return `Ciao team ${prospect.business_name}! 👋 Vedo che curate molto il lavoro${
    prospect.city ? ` a ${prospect.city}` : ''
  } nel settore ${subDef.label.toLowerCase()}. Ho preparato senza alcun impegno una demo interattiva RIVO già personalizzata su di voi (${focusPhrase}) con Vista Cliente e Vista Titolare: ${demoUrl} — se vi incuriosisce vi spiego tutto in 5 minuti qui su IG!`;
}

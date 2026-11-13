import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { decodeProspectIdFromSlug } from '@/lib/outreach/preview';
import { getBusinessInitials } from '@/lib/outreach/logo-resolver';
import {
  ensureProspectLogoPersisted,
  fetchSafeServerSatoriLogoDataUri,
} from '@/lib/outreach/brand-discovery';
import { renderCoBrandedOgElement, type CoBrandedOgCardProps } from '@/lib/outreach/og-card';
import { OUTREACH_DISCOVERY_CATEGORIES, type PublicDigitalSignals } from '@/lib/outreach/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SAFE_OG_PROSPECT_COLUMNS =
  'id, business_name, category, subcategory, city, province, website, website_domain, instagram_url, facebook_url, digital_signals, merged_into_id';

const OG_CACHE_HEADERS = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=300, s-maxage=300',
};

let cachedRivoLogoDataUri: string | null = null;

interface SafeOgProspectRow {
  id: string;
  business_name: string;
  category: string | null;
  subcategory: string | null;
  city: string | null;
  province: string | null;
  website: string | null;
  website_domain: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  digital_signals: PublicDigitalSignals | Record<string, unknown> | null;
  merged_into_id: string | null;
}

async function getRivoLogoDataUri(): Promise<string | null> {
  if (cachedRivoLogoDataUri) return cachedRivoLogoDataUri;
  try {
    const buf = await readFile(join(process.cwd(), 'public', 'brand', 'rivo-icon.png'));
    cachedRivoLogoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
    return cachedRivoLogoDataUri;
  } catch {
    return null;
  }
}

function getServiceDb(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function loadSafeOgProspect(
  adminDb: SupabaseClient,
  slug: string
): Promise<SafeOgProspectRow | null> {
  const decodedId = decodeProspectIdFromSlug(slug);
  if (!decodedId) return null;

  const { data, error } = await adminDb
    .from('outreach_prospects')
    .select(SAFE_OG_PROSPECT_COLUMNS)
    .eq('id', decodedId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as SafeOgProspectRow;
  if (!row.merged_into_id) return row;

  // Follow at most 1 hop to resolve canonical post-merge record
  const { data: canonical, error: canonicalError } = await adminDb
    .from('outreach_prospects')
    .select(SAFE_OG_PROSPECT_COLUMNS)
    .eq('id', row.merged_into_id)
    .maybeSingle();

  if (canonicalError || !canonical) return null;
  return canonical as SafeOgProspectRow;
}

function formatCategoryBadge(category?: string | null, subcategory?: string | null): string | null {
  const candidate = (subcategory || category || '').trim();
  if (!candidate) return null;

  const lower = candidate.toLowerCase();
  for (const macro of OUTREACH_DISCOVERY_CATEGORIES) {
    if (macro.id === lower) return macro.label;
    for (const sub of macro.subcategories) {
      if (sub.id === lower || sub.rivoCategorySlug === lower || sub.label.toLowerCase() === lower) {
        return sub.label;
      }
    }
  }
  return candidate;
}

async function renderOgPngBuffer(
  cardProps: CoBrandedOgCardProps,
  width: number,
  height: number
): Promise<ArrayBuffer> {
  const imageResponse = new ImageResponse(renderCoBrandedOgElement(cardProps), {
    width,
    height,
    headers: { 'Cache-Control': OG_CACHE_HEADERS['Cache-Control'] },
  });
  return imageResponse.arrayBuffer();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const variant: 'card' | 'icon' =
    request.nextUrl.searchParams.get('variant') === 'icon' ? 'icon' : 'card';
  const width = variant === 'icon' ? 256 : 1200;
  const height = variant === 'icon' ? 256 : 630;

  const rivoLogoDataUri = await getRivoLogoDataUri();

  let businessName = 'Anteprima RIVO';
  let city: string | null = null;
  let category: string | null = null;
  let prospectLogoDataUri: string | null = null;
  let initials = 'RV';

  try {
    const { slug } = await context.params;
    const adminDb = getServiceDb();

    if (adminDb && slug) {
      const row = await loadSafeOgProspect(adminDb, slug);
      if (row) {
        businessName = row.business_name || 'Anteprima RIVO';
        city = row.city ?? null;
        category = formatCategoryBadge(row.category, row.subcategory);
        initials = getBusinessInitials(businessName);

        const brand = await ensureProspectLogoPersisted(adminDb, row, {
          discoverIfMissing: true,
          allowGeminiFallback: true,
          timeoutMs: 3600,
        });

        if (brand.imageAsset) {
          prospectLogoDataUri = `data:${brand.imageAsset.mimeType};base64,${brand.imageAsset.bytes.toString('base64')}`;
        } else if (brand.logoUrl) {
          const fetched = await fetchSafeServerSatoriLogoDataUri([brand.logoUrl], 2000);
          prospectLogoDataUri = fetched?.dataUri ?? null;
        }
      }
    }
  } catch {
    // Fall back cleanly to generic RIVO card so crawlers never receive a broken image
  }

  const baseProps: CoBrandedOgCardProps = {
    variant,
    businessName,
    city,
    category,
    rivoLogoDataUri,
    prospectLogoDataUri,
    initials,
  };

  try {
    const pngBuffer = await renderOgPngBuffer(baseProps, width, height);
    return new Response(pngBuffer, {
      status: 200,
      headers: OG_CACHE_HEADERS,
    });
  } catch {
    // If third-party image data triggers a Satori error, retry once cleanly with monogram tile
    try {
      const fallbackBuffer = await renderOgPngBuffer(
        {
          ...baseProps,
          prospectLogoDataUri: null,
        },
        width,
        height
      );
      return new Response(fallbackBuffer, {
        status: 200,
        headers: OG_CACHE_HEADERS,
      });
    } catch {
      const minimalBuffer = await renderOgPngBuffer(
        {
          ...baseProps,
          rivoLogoDataUri: null,
          prospectLogoDataUri: null,
        },
        width,
        height
      );
      return new Response(minimalBuffer, {
        status: 200,
        headers: OG_CACHE_HEADERS,
      });
    }
  }
}

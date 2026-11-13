import { NextRequest } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { decodeProspectIdFromSlug } from '@/lib/outreach/preview';
import { ensureProspectLogoPersisted } from '@/lib/outreach/brand-discovery';
import type { PublicDigitalSignals } from '@/lib/outreach/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SAFE_LOGO_PROSPECT_COLUMNS =
  'id, business_name, city, province, category, subcategory, website, website_domain, instagram_url, facebook_url, digital_signals, merged_into_id';

interface SafeLogoProspectRow {
  id: string;
  business_name: string;
  city: string | null;
  province: string | null;
  category: string | null;
  subcategory: string | null;
  website: string | null;
  website_domain: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  digital_signals: PublicDigitalSignals | Record<string, unknown> | null;
  merged_into_id: string | null;
}

function getServiceDb(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function loadSafeLogoProspect(
  adminDb: SupabaseClient,
  slug: string
): Promise<SafeLogoProspectRow | null> {
  const decodedId = decodeProspectIdFromSlug(slug);
  if (!decodedId) return null;

  const { data, error } = await adminDb
    .from('outreach_prospects')
    .select(SAFE_LOGO_PROSPECT_COLUMNS)
    .eq('id', decodedId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as SafeLogoProspectRow;
  if (!row.merged_into_id) return row;

  // Follow at most 1 hop to resolve canonical post-merge record
  const { data: canonical, error: canonicalError } = await adminDb
    .from('outreach_prospects')
    .select(SAFE_LOGO_PROSPECT_COLUMNS)
    .eq('id', row.merged_into_id)
    .maybeSingle();

  if (canonicalError || !canonical) return null;
  return canonical as SafeLogoProspectRow;
}

function notFoundLogoResponse(): Response {
  return new Response(null, {
    status: 404,
    headers: { 'Cache-Control': 'public, max-age=120' },
  });
}

/**
 * GET /api/outreach/preview/[slug]/logo
 * Same-origin logo binary proxy that discovers, normalizes, and caches prospect brand logos
 * so browser previews never hit third-party CORP/lookaside/WebP failures.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const adminDb = getServiceDb();
    if (!adminDb || !slug) {
      return notFoundLogoResponse();
    }

    const row = await loadSafeLogoProspect(adminDb, slug);
    if (!row) {
      return notFoundLogoResponse();
    }

    const brand = await ensureProspectLogoPersisted(adminDb, row, {
      discoverIfMissing: true,
      allowGeminiFallback: true,
      timeoutMs: 3600,
    });

    if (brand.imageAsset) {
      return new Response(new Uint8Array(brand.imageAsset.bytes), {
        status: 200,
        headers: {
          'Content-Type': brand.imageAsset.mimeType,
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    return notFoundLogoResponse();
  } catch {
    return notFoundLogoResponse();
  }
}

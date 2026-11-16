import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import ProspectDemoSandbox from '@/components/preview/ProspectDemoSandbox';
import {
  decodeProspectIdFromSlug,
  encodePreviewSlug,
  getPublicAppBaseUrl,
  getVerticalDefaultModules,
  resolveDemoVertical,
  type DemoVerticalMode,
  type PublicProspectPreviewDTO,
  type PublicRecommendedModuleDTO,
} from '@/lib/outreach/preview';
import { ensureProspectLogoPersisted } from '@/lib/outreach/brand-discovery';
import { computeLogoVersionTag } from '@/lib/outreach/logo-resolver';
import type { PublicDigitalSignals } from '@/lib/outreach/types';

export const dynamic = 'force-dynamic';

const SAFE_PROSPECT_COLUMNS =
  'id, business_name, category, subcategory, city, province, region, address, website, website_domain, instagram_url, facebook_url, digital_signals, ai_analysis, merged_into_id';

interface SafePreviewPageRow {
  id: string;
  business_name: string;
  category: string;
  subcategory: string | null;
  city: string | null;
  province: string | null;
  region: string | null;
  address: string | null;
  website: string | null;
  website_domain: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  digital_signals: PublicDigitalSignals | Record<string, unknown> | null;
  ai_analysis: unknown;
  merged_into_id: string | null;
}

interface SafePreviewData {
  preview: PublicProspectPreviewDTO;
  versionLogoSource: string | null;
}

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
}

function mapOpportunityStatus(rawStatus: unknown): PublicRecommendedModuleDTO['status'] {
  if (rawStatus === 'confirmed' || rawStatus === 'confirmed_opportunity') {
    return 'confirmed_opportunity';
  }
  if (rawStatus === 'plausible' || rawStatus === 'plausible_opportunity') {
    return 'plausible_opportunity';
  }
  return 'not_verifiable';
}

function normalizeRecommendedModules(
  aiAnalysis: unknown,
  vertical: DemoVerticalMode
): PublicRecommendedModuleDTO[] {
  if (!aiAnalysis || typeof aiAnalysis !== 'object') {
    return getVerticalDefaultModules(vertical);
  }

  const opportunities = (aiAnalysis as { opportunities?: unknown }).opportunities;
  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    return getVerticalDefaultModules(vertical);
  }

  const mapped: PublicRecommendedModuleDTO[] = [];
  for (const entry of opportunities) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as {
      moduleName?: unknown;
      verificationStatus?: unknown;
      status?: unknown;
      rationale?: unknown;
    };
    if (typeof record.moduleName !== 'string' || !record.moduleName.trim()) continue;

    mapped.push({
      moduleName: record.moduleName.trim(),
      status: mapOpportunityStatus(record.verificationStatus ?? record.status),
      rationale:
        typeof record.rationale === 'string' && record.rationale.trim()
          ? record.rationale.trim()
          : 'Modulo consigliato per digitalizzare il contatto diretto con i tuoi clienti.',
    });
  }

  return mapped.length > 0 ? mapped.slice(0, 6) : getVerticalDefaultModules(vertical);
}

const loadSafePreviewData = cache(
  async (rawSlug: string): Promise<SafePreviewData | null> => {
    const prospectId = decodeProspectIdFromSlug(rawSlug);
    if (!prospectId) return null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return null;

    const adminDb = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: initialRow, error: initialError } = await adminDb
      .from('outreach_prospects')
      .select(SAFE_PROSPECT_COLUMNS)
      .eq('id', prospectId)
      .maybeSingle();

    if (initialError || !initialRow) return null;

    let activeRow = initialRow as SafePreviewPageRow;

    // Follow 1-hop merge redirect cleanly if this record was deduplicated
    if (activeRow.merged_into_id) {
      const { data: mergedRow, error: mergedError } = await adminDb
        .from('outreach_prospects')
        .select(SAFE_PROSPECT_COLUMNS)
        .eq('id', activeRow.merged_into_id)
        .maybeSingle();

      if (mergedError || !mergedRow) return null;
      activeRow = mergedRow as SafePreviewPageRow;
    }

    const vertical = resolveDemoVertical(activeRow.category, activeRow.subcategory);
    const recommendedModules = normalizeRecommendedModules(activeRow.ai_analysis, vertical);
    const canonicalSlug = encodePreviewSlug(activeRow.business_name, activeRow.id);

    let versionLogoSource: string | null = null;
    try {
      const brand = await ensureProspectLogoPersisted(adminDb, activeRow, {
        discoverIfMissing: true,
        allowGeminiFallback: true,
        timeoutMs: 3600,
      });
      versionLogoSource = brand.logoUrl;
    } catch {
      versionLogoSource = null;
    }

    const logoProxyUrl = versionLogoSource
      ? `/api/outreach/preview/${canonicalSlug}/logo?v=${computeLogoVersionTag(
          versionLogoSource,
          activeRow.business_name
        )}`
      : null;

    return {
      versionLogoSource,
      preview: {
        id: activeRow.id,
        slug: canonicalSlug,
        businessName: activeRow.business_name,
        logoUrl: logoProxyUrl,
        category: activeRow.category,
        subcategory: activeRow.subcategory ?? null,
        city: activeRow.city ?? null,
        province: activeRow.province ?? null,
        region: activeRow.region ?? null,
        address: activeRow.address ?? null,
        vertical,
        recommendedModules,
      },
    };
  }
);

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadSafePreviewData(slug);

  if (!data) {
    return {
      title: 'Anteprima RIVO',
      description: 'Anteprima interattiva RIVO.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { preview, versionLogoSource } = data;
  const baseUrl = getPublicAppBaseUrl();
  const versionTag = computeLogoVersionTag(versionLogoSource, preview.businessName);
  const ogCardUrl = `${baseUrl}/api/outreach/preview/${encodeURIComponent(preview.slug)}/og?v=${encodeURIComponent(versionTag)}`;
  const ogIconUrl = `${ogCardUrl}&variant=icon`;
  const description = `Anteprima interattiva RIVO + ${preview.businessName}${
    preview.city ? ` (${preview.city})` : ''
  }: prova la Vista Cliente e la Vista Titolare in tempo reale.`;

  return {
    title: `RIVO + ${preview.businessName} — Anteprima Demo`,
    description,
    openGraph: {
      title: `RIVO + ${preview.businessName}`,
      description,
      type: 'website',
      url: `${baseUrl}/preview/${encodeURIComponent(preview.slug)}`,
      siteName: 'RIVO',
      images: [
        {
          url: ogCardUrl,
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: `RIVO + ${preview.businessName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `RIVO + ${preview.businessName}`,
      description,
      images: [ogCardUrl],
    },
    icons: {
      icon: ogIconUrl,
      apple: ogIconUrl,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ProspectPreviewPage({ params }: PreviewPageProps) {
  const { slug } = await params;
  const data = await loadSafePreviewData(slug);

  if (!data) {
    return (
      <main className="min-h-screen min-h-dvh bg-[#09090B] text-[#FAFAFA] flex items-center justify-center px-4 py-12 overflow-x-hidden">
        <div className="w-full max-w-md rounded-2xl bg-[#111114] border border-[#27272A] p-7 text-center space-y-5 shadow-2xl">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-center p-1.5">
              <Image
                src="/brand/rivo-icon.png"
                alt="RIVO"
                width={26}
                height={26}
                className="rounded-xs"
              />
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#BFFF00] font-bold">
              RIVO PREVIEW
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-amber-300" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-extrabold text-[#FAFAFA]">
              Anteprima non trovata o link non valido
            </h1>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Il collegamento potrebbe essere incompleto, scaduto oppure riferito a una scheda non
              più disponibile.
            </p>
          </div>

          <Link
            href="/"
            className="w-full min-h-[48px] px-4 rounded-xl bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] text-xs font-extrabold transition-colors inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna a RIVO</span>
          </Link>
        </div>
      </main>
    );
  }

  return <ProspectDemoSandbox preview={data.preview} />;
}

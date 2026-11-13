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
  getVerticalDefaultModules,
  resolveDemoVertical,
  type DemoVerticalMode,
  type PublicProspectPreviewDTO,
  type PublicRecommendedModuleDTO,
} from '@/lib/outreach/preview';

export const dynamic = 'force-dynamic';

const PROSPECT_PREVIEW_SELECT =
  'id, business_name, category, subcategory, city, province, region, address, ai_analysis, merged_into_id';

interface ProspectPreviewRow {
  id: string;
  business_name: string;
  category: string;
  subcategory: string | null;
  city: string | null;
  province: string | null;
  region: string | null;
  address: string | null;
  ai_analysis: unknown;
  merged_into_id: string | null;
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

const getSafeProspectPreview = cache(
  async (rawSlug: string): Promise<PublicProspectPreviewDTO | null> => {
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
      .select(PROSPECT_PREVIEW_SELECT)
      .eq('id', prospectId)
      .maybeSingle();

    if (initialError || !initialRow) return null;

    let activeRow = initialRow as ProspectPreviewRow;

    // Follow 1-hop merge redirect cleanly if this record was deduplicated
    if (activeRow.merged_into_id) {
      const { data: mergedRow, error: mergedError } = await adminDb
        .from('outreach_prospects')
        .select(PROSPECT_PREVIEW_SELECT)
        .eq('id', activeRow.merged_into_id)
        .maybeSingle();

      if (mergedError || !mergedRow) return null;
      activeRow = mergedRow as ProspectPreviewRow;
    }

    const vertical = resolveDemoVertical(activeRow.category, activeRow.subcategory);
    const recommendedModules = normalizeRecommendedModules(activeRow.ai_analysis, vertical);

    return {
      id: activeRow.id,
      slug: encodePreviewSlug(activeRow.business_name, activeRow.id),
      businessName: activeRow.business_name,
      category: activeRow.category,
      subcategory: activeRow.subcategory ?? null,
      city: activeRow.city ?? null,
      province: activeRow.province ?? null,
      region: activeRow.region ?? null,
      address: activeRow.address ?? null,
      vertical,
      recommendedModules,
    };
  }
);

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const preview = await getSafeProspectPreview(slug);

  return {
    title: preview ? `Anteprima RIVO — ${preview.businessName}` : 'Anteprima RIVO',
    description: preview
      ? `Anteprima interattiva RIVO personalizzata per ${preview.businessName}${
          preview.city ? ` (${preview.city})` : ''
        }.`
      : 'Anteprima interattiva RIVO.',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ProspectPreviewPage({ params }: PreviewPageProps) {
  const { slug } = await params;
  const initialPreview = await getSafeProspectPreview(slug);

  if (!initialPreview) {
    return (
      <main className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-[#121214] border border-[#27272A] p-7 text-center space-y-5 shadow-2xl">
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
            className="w-full py-3 px-4 rounded-xl bg-[#BFFF00] hover:bg-[#BFFF00]/90 text-[#09090B] text-xs font-extrabold transition-colors inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna a RIVO</span>
          </Link>
        </div>
      </main>
    );
  }

  return <ProspectDemoSandbox preview={initialPreview} />;
}

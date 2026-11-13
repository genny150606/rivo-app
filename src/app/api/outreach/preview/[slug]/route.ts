import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  decodeProspectIdFromSlug,
  encodePreviewSlug,
  getVerticalDefaultModules,
  resolveDemoVertical,
  type DemoVerticalMode,
  type PublicProspectPreviewDTO,
  type PublicRecommendedModuleDTO,
} from '@/lib/outreach/preview';
import { resolveProspectLogoCandidates } from '@/lib/outreach/logo-resolver';
import type { OutreachCommercialStatus, PublicDigitalSignals } from '@/lib/outreach/types';
import { sanitizeString } from '@/lib/security';

export const dynamic = 'force-dynamic';

const SAFE_PROSPECT_COLUMNS =
  'id, business_name, category, subcategory, city, province, region, address, website, website_domain, digital_signals, ai_analysis, merged_into_id, commercial_status';

const DEMO_OPEN_DEDUP_WINDOW_MS = 10 * 60 * 1000;

const UPGRADABLE_COMMERCIAL_STATUSES = new Set<OutreachCommercialStatus>([
  'nuovo',
  'da_analizzare',
  'analizzato',
  'da_contattare',
  'contatto_consentito',
  'in_conversazione',
]);

interface SafeProspectRow {
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
  digital_signals: PublicDigitalSignals | Record<string, unknown> | null;
  ai_analysis: unknown;
  merged_into_id: string | null;
  commercial_status: OutreachCommercialStatus;
}

function getServiceDb(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function loadSafeProspectBySlug(
  adminDb: SupabaseClient,
  slug: string
): Promise<SafeProspectRow | null> {
  const decodedId = decodeProspectIdFromSlug(slug);
  if (!decodedId) return null;

  const { data, error } = await adminDb
    .from('outreach_prospects')
    .select(SAFE_PROSPECT_COLUMNS)
    .eq('id', decodedId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as SafeProspectRow;
  if (!row.merged_into_id) {
    return row;
  }

  // Follow at most 1 hop to resolve canonical post-merge record
  const { data: canonical, error: canonicalError } = await adminDb
    .from('outreach_prospects')
    .select(SAFE_PROSPECT_COLUMNS)
    .eq('id', row.merged_into_id)
    .maybeSingle();

  if (canonicalError || !canonical) return null;
  return canonical as SafeProspectRow;
}

function normalizeOpportunityStatus(raw: unknown): PublicRecommendedModuleDTO['status'] {
  if (raw === 'confirmed_opportunity' || raw === 'confirmed') {
    return 'confirmed_opportunity';
  }
  if (raw === 'not_verifiable' || raw === 'unverifiable') {
    return 'not_verifiable';
  }
  return 'plausible_opportunity';
}

function extractRecommendedModules(
  aiAnalysis: unknown,
  vertical: DemoVerticalMode
): PublicRecommendedModuleDTO[] {
  const opportunities = (aiAnalysis as { opportunities?: unknown } | null)?.opportunities;
  if (!Array.isArray(opportunities)) {
    return getVerticalDefaultModules(vertical);
  }

  const modules: PublicRecommendedModuleDTO[] = [];
  for (const item of opportunities) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const status = normalizeOpportunityStatus(o.status ?? o.verificationStatus);
    if (status === 'not_verifiable') continue;

    const moduleName = String(o.moduleName || '').trim();
    if (!moduleName) continue;

    modules.push({
      moduleName,
      status,
      rationale: String(o.rationale || ''),
    });

    if (modules.length >= 4) break;
  }

  return modules.length > 0 ? modules : getVerticalDefaultModules(vertical);
}

function buildPublicPreviewDTO(
  row: SafeProspectRow,
  logoUrl: string | null = null
): PublicProspectPreviewDTO {
  const vertical = resolveDemoVertical(row.category, row.subcategory);
  return {
    id: row.id,
    slug: encodePreviewSlug(row.business_name, row.id),
    businessName: row.business_name,
    logoUrl,
    category: row.category,
    subcategory: row.subcategory ?? null,
    city: row.city ?? null,
    province: row.province ?? null,
    region: row.region ?? null,
    address: row.address ?? null,
    vertical,
    recommendedModules: extractRecommendedModules(row.ai_analysis, vertical),
  };
}

function sanitizeField(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  return sanitizeString(value, maxLength);
}

function serviceNotConfiguredResponse() {
  return NextResponse.json(
    { error: 'Servizio anteprima temporaneamente non configurato.' },
    { status: 503 }
  );
}

function prospectNotFoundResponse() {
  return NextResponse.json(
    { error: 'Anteprima personalizzata non trovata o non più disponibile.' },
    { status: 404 }
  );
}

/**
 * GET /api/outreach/preview/[slug]
 * Publicly resolves a prospect's safe preview DTO without exposing PII or internal scoring.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const adminDb = getServiceDb();
    if (!adminDb) return serviceNotConfiguredResponse();

    const { slug } = await context.params;
    const activeRow = await loadSafeProspectBySlug(adminDb, slug);
    if (!activeRow) return prospectNotFoundResponse();

    const { primaryLogoUrl } = await resolveProspectLogoCandidates(activeRow, {
      allowLiveWebsiteFetch: true,
      timeoutMs: 1500,
    });
    const preview = buildPublicPreviewDTO(activeRow, primaryLogoUrl);
    return NextResponse.json(
      { preview },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Errore interno durante il caricamento dell’anteprima.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/outreach/preview/[slug]
 * Records prospect preview engagement (open, sandbox interaction, activation CTA)
 * into outreach_activity_logs without touching production tenant tables.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const adminDb = getServiceDb();
    if (!adminDb) return serviceNotConfiguredResponse();

    const { slug } = await context.params;
    const row = await loadSafeProspectBySlug(adminDb, slug);
    if (!row) return prospectNotFoundResponse();

    let body: Record<string, unknown>;
    try {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return NextResponse.json({ error: 'Payload JSON non valido.' }, { status: 400 });
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Payload JSON non valido.' }, { status: 400 });
    }

    const action = typeof body.action === 'string' ? body.action.trim() : '';
    const contactName = sanitizeField(body.contactName, 80);
    const contactPhone = sanitizeField(body.contactPhone, 40);
    const preferredTime = sanitizeField(body.preferredTime, 80);
    const note = sanitizeField(body.note, 500);
    const sanitizedModule = sanitizeField(body.moduleName, 80);

    const canonicalSlug = encodePreviewSlug(row.business_name, row.id);
    const vertical = resolveDemoVertical(row.category, row.subcategory);

    if (action === 'track_open') {
      const cutoffIso = new Date(Date.now() - DEMO_OPEN_DEDUP_WINDOW_MS).toISOString();
      const { data: recentOpens, error: lookupError } = await adminDb
        .from('outreach_activity_logs')
        .select('id')
        .eq('prospect_id', row.id)
        .eq('action', 'demo_opened')
        .gte('created_at', cutoffIso)
        .limit(1);

      if (lookupError) {
        return NextResponse.json(
          { error: 'Errore nella verifica della sessione anteprima.' },
          { status: 500 }
        );
      }

      if (!recentOpens || recentOpens.length === 0) {
        const { error: insertError } = await adminDb
          .from('outreach_activity_logs')
          .insert({
            prospect_id: row.id,
            action: 'demo_opened',
            metadata: {
              slug: canonicalSlug,
              business_name: row.business_name,
              vertical,
            },
          });

        if (insertError) {
          return NextResponse.json(
            { error: 'Errore nella registrazione apertura anteprima.' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (action === 'track_interaction') {
      const { error: insertError } = await adminDb
        .from('outreach_activity_logs')
        .insert({
          prospect_id: row.id,
          action: 'demo_interaction',
          metadata: {
            module: sanitizedModule || 'sandbox',
            slug: canonicalSlug,
          },
        });

      if (insertError) {
        return NextResponse.json(
          { error: 'Errore nella registrazione interazione demo.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    if (action === 'request_activation') {
      const shouldUpgrade = UPGRADABLE_COMMERCIAL_STATUSES.has(row.commercial_status);

      if (shouldUpgrade) {
        const { error: updateError } = await adminDb
          .from('outreach_prospects')
          .update({
            commercial_status: 'interessato',
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)
          .in('commercial_status', Array.from(UPGRADABLE_COMMERCIAL_STATUSES));

        if (updateError) {
          return NextResponse.json(
            { error: 'Errore nell’aggiornamento dello stato richiesta.' },
            { status: 500 }
          );
        }
      }

      const { error: insertError } = await adminDb
        .from('outreach_activity_logs')
        .insert({
          prospect_id: row.id,
          action: 'demo_cta_submitted',
          metadata: {
            slug: canonicalSlug,
            contact_name: contactName || null,
            contact_phone: contactPhone || null,
            preferred_time: preferredTime || null,
            note: note || null,
            upgraded_to_interessato: shouldUpgrade,
          },
        });

      if (insertError) {
        return NextResponse.json(
          { error: 'Errore nella registrazione della richiesta.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        upgraded: shouldUpgrade,
        message:
          'Richiesta registrata! Un consulente RIVO ti contatterà a breve per attivare il servizio.',
      });
    }

    return NextResponse.json({ error: 'Azione non valida.' }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: 'Errore interno durante l’elaborazione della richiesta.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminAccess } from '@/lib/outreach/auth';
import { OUTREACH_DISCOVERY_CATEGORIES, type OutreachProspectRecord } from '@/lib/outreach/types';
import {
  CAMPANIA_GEO_PRESETS,
  getRegisteredDiscoveryProviders,
  inspectPublicWebsiteMetadata,
} from '@/lib/outreach/providers/discovery';
import {
  extractWebsiteDomain,
  matchDuplicateInList,
  normalizeBusinessName,
} from '@/lib/outreach/deduplication';
import { processOutreachJob, loadActiveKnowledgeBase } from '@/lib/outreach/jobs';
import { analyzeProspectsBatchWithAI } from '@/lib/outreach/ai-intelligence';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = await verifySuperAdminAccess(request);
  if (!auth.authorized) return auth.errorResponse;
  const { adminDb } = auth;

  const providers = getRegisteredDiscoveryProviders().map((p) => ({
    id: p.id,
    name: p.name,
    providerType: p.providerType,
    attribution: p.attribution,
    configured: p.isConfigured(),
  }));

  const [{ data: recentJobs }, { data: existingProspects }] = await Promise.all([
    adminDb
      .from('outreach_jobs')
      .select('*')
      .eq('job_type', 'discovery')
      .order('created_at', { ascending: false })
      .limit(12),
    adminDb
      .from('outreach_prospects')
      .select('*')
      .is('merged_into_id', null)
      .order('created_at', { ascending: false })
      .limit(60),
  ]);

  return NextResponse.json({
    categories: OUTREACH_DISCOVERY_CATEGORIES,
    campaniaPresets: CAMPANIA_GEO_PRESETS,
    providers,
    recentJobs: recentJobs || [],
    existingProspects: existingProspects || [],
  });
}

export async function POST(request: NextRequest) {
  const auth = await verifySuperAdminAccess(request);
  if (!auth.authorized) return auth.errorResponse;
  const { adminDb, user } = auth;

  try {
    const body = await request.json();
    const action = String(body.action || 'start_discovery');

    if (action === 'start_discovery') {
      const locationQuery = String(body.locationQuery || 'Napoli').trim() || 'Napoli';
      const radiusKm = Math.max(1, Math.min(120, Number(body.radiusKm) || 35));
      const centerLat = typeof body.centerLat === 'number' && Number.isFinite(body.centerLat) ? body.centerLat : null;
      const centerLon = typeof body.centerLon === 'number' && Number.isFinite(body.centerLon) ? body.centerLon : null;
      const category = String(body.category || 'food_beverage');
      const subcategory = String(body.subcategory || 'restaurant');
      const maxResults = Math.max(1, Math.min(50, Number(body.maxResults) || 25));
      const providerIds: string[] = Array.isArray(body.providerIds) && body.providerIds.length > 0
        ? body.providerIds
        : ['google_places_official', 'openstreetmap_odbl'];

      if (!locationQuery && (centerLat === null || centerLon === null)) {
        return NextResponse.json(
          { error: 'Inserisci una località valida (es. Napoli, Salerno, Caserta, Campania).' },
          { status: 400 }
        );
      }

      const { data: createdJob, error: jobErr } = await adminDb
        .from('outreach_jobs')
        .insert({
          job_type: 'discovery',
          status: 'queued',
          progress: 0,
          payload: {
            locationQuery,
            radiusKm,
            centerLat,
            centerLon,
            category,
            subcategory,
            maxResults,
            providerIds,
          },
          created_by: user.id,
        })
        .select('*')
        .single();

      if (jobErr || !createdJob) {
        return NextResponse.json(
          { error: jobErr?.message || 'Errore nella creazione del job di ricerca.' },
          { status: 500 }
        );
      }

      const completedJob = await processOutreachJob(adminDb, createdJob.id, user.id);

      const insertedIds: string[] = completedJob?.result?.insertedIds || [];
      const allResultIds: string[] = completedJob?.result?.allResultIds || insertedIds;

      let allSearchProspects: any[] = [];
      if (allResultIds.length > 0) {
        const { data: rows } = await adminDb
          .from('outreach_prospects')
          .select('*')
          .in('id', allResultIds)
          .order('created_at', { ascending: false });
        allSearchProspects = rows || [];
      }

      const insertedSet = new Set(insertedIds);
      const insertedProspects = allSearchProspects.filter((r) => insertedSet.has(r.id));

      return NextResponse.json({
        job: completedJob,
        insertedProspects,
        allSearchProspects,
        searchCenter: completedJob?.result?.searchCenter || null,
      });
    }

    if (action === 'manual_import') {
      const items = Array.isArray(body.items) ? body.items : [body];
      const { data: existingRows } = await adminDb
        .from('outreach_prospects')
        .select('*')
        .is('merged_into_id', null);
      const existingList = (existingRows || []) as OutreachProspectRecord[];

      const inserted: OutreachProspectRecord[] = [];
      const duplicates: { name: string; reason: string; matchedId: string }[] = [];

      for (const raw of items) {
        const businessName = String(raw.business_name || '').trim();
        if (!businessName) continue;

        const category = String(raw.category || 'food_beverage');
        const subcategory = String(raw.subcategory || 'restaurant');
        const city = raw.city ? String(raw.city).trim() : null;
        const province = raw.province ? String(raw.province).trim() : null;
        const region = raw.region ? String(raw.region).trim() : null;
        const address = raw.address ? String(raw.address).trim() : null;
        const website = raw.website ? String(raw.website).trim() : null;
        const instagramUrl = raw.instagram_url ? String(raw.instagram_url).trim() : null;
        const facebookUrl = raw.facebook_url ? String(raw.facebook_url).trim() : null;
        const phone = raw.business_phone ? String(raw.business_phone).trim() : null;
        const email = raw.business_email ? String(raw.business_email).trim() : null;
        const description = raw.description ? String(raw.description).trim() : null;

        const dupCheck = matchDuplicateInList(
          {
            business_name: businessName,
            city,
            address,
            website,
            business_phone: phone,
            source: 'manual_admin_entry',
          },
          existingList
        );

        if (dupCheck.isDuplicate && dupCheck.matchedProspect) {
          duplicates.push({
            name: businessName,
            reason: dupCheck.matchReason || 'duplicato',
            matchedId: dupCheck.matchedProspect.id,
          });
          continue;
        }

        const signals = website ? await inspectPublicWebsiteMetadata(website) : {};

        const { data: created, error: insErr } = await adminDb
          .from('outreach_prospects')
          .insert({
            business_name: businessName,
            normalized_name: normalizeBusinessName(businessName),
            category,
            subcategory,
            city,
            province,
            region,
            address,
            website,
            website_domain: extractWebsiteDomain(website),
            instagram_url: instagramUrl,
            facebook_url: facebookUrl,
            business_phone: phone,
            business_email: email,
            description: description || signals.websiteDescription || null,
            services_offered: Array.isArray(raw.services_offered) ? raw.services_offered : [],
            digital_signals: signals,
            source: String(raw.source || 'manual_admin_entry'),
            source_reference: raw.source_reference || `manual:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
            commercial_status: 'da_analizzare',
          })
          .select('*')
          .single();

        if (!insErr && created) {
          inserted.push(created as OutreachProspectRecord);
          existingList.push(created as OutreachProspectRecord);
        }
      }

      if (inserted.length > 0) {
        const kb = await loadActiveKnowledgeBase(adminDb);
        const analysisMap = await analyzeProspectsBatchWithAI(inserted, kb);
        const aiGenerations: any[] = [];
        const aiLogs: any[] = [];

        await Promise.all(
          inserted.map(async (p, idx) => {
            const analysis = analysisMap.get(p.id);
            if (!analysis) return;
            const { data: updated } = await adminDb
              .from('outreach_prospects')
              .update({
                lead_score: analysis.totalLeadScore,
                confidence_score: analysis.confidenceScore,
                ai_analysis: analysis,
                commercial_status: 'analizzato',
                updated_at: new Date().toISOString(),
              })
              .eq('id', p.id)
              .select('*')
              .maybeSingle();
            if (updated) {
              inserted[idx] = updated as OutreachProspectRecord;
            }
            aiGenerations.push({
              prospect_id: p.id,
              generation_type: 'business_intelligence',
              prompt_version: 'v1.0',
              generated_content: analysis,
              model: analysis.modelUsed,
            });
            aiLogs.push({
              prospect_id: p.id,
              action: 'ai_analysis_completed',
              metadata: {
                lead_score: analysis.totalLeadScore,
                confidence_score: analysis.confidenceScore,
                model: analysis.modelUsed,
                auto_on_import: true,
              },
              admin_user_id: user.id,
            });
          })
        );

        await Promise.all([
          aiGenerations.length > 0
            ? adminDb.from('outreach_ai_generations').insert(aiGenerations)
            : Promise.resolve(),
          aiLogs.length > 0
            ? adminDb.from('outreach_activity_logs').insert(aiLogs)
            : Promise.resolve(),
        ]);
      }

      return NextResponse.json({
        insertedCount: inserted.length,
        duplicatesCount: duplicates.length,
        inserted,
        duplicates,
      });
    }

    return NextResponse.json({ error: 'Azione non riconosciuta.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Errore durante l’acquisizione dei prospect.' },
      { status: 500 }
    );
  }
}

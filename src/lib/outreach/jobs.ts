/**
 * RIVO OUTREACH — Background Jobs & Asynchronous Campaign Processing Engine
 * (`outreach_jobs`)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getRegisteredDiscoveryProviders } from './providers/discovery';
import { matchDuplicateInList } from './deduplication';
import {
  analyzeProspectWithAI,
  analyzeProspectsBatchWithAI,
  generatePersonalizedSalesPitches,
} from './ai-intelligence';
import { DEFAULT_RIVO_KNOWLEDGE_BASE, type RivoProductKnowledgeBase } from './knowledge-base';
import { discoverInstagramProfilesBatch, normalizeInstagramProfileUrl } from './instagram';
import type { OutreachProspectRecord } from './types';

export interface OutreachJobRecord {
  id: string;
  job_type:
    | 'discovery'
    | 'deduplication'
    | 'website_enrichment'
    | 'ai_analysis'
    | 'message_generation'
    | 'campaign_execution'
    | 'retention_cleanup';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  payload: Record<string, any>;
  result: Record<string, any> | null;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export async function loadActiveKnowledgeBase(
  adminDb: SupabaseClient
): Promise<RivoProductKnowledgeBase> {
  const { data } = await adminDb
    .from('outreach_settings')
    .select('setting_value')
    .eq('setting_key', 'rivo_knowledge_base')
    .maybeSingle();

  if (data?.setting_value && typeof data.setting_value === 'object') {
    return {
      ...DEFAULT_RIVO_KNOWLEDGE_BASE,
      ...(data.setting_value as Partial<RivoProductKnowledgeBase>),
    };
  }
  return DEFAULT_RIVO_KNOWLEDGE_BASE;
}

/**
 * Discovers missing public Instagram profiles for a deduplicated pool of prospects,
 * persists found URLs & metadata, logs activity, and syncs in-memory records before AI analysis.
 */
async function discoverAndPersistMissingInstagram(
  adminDb: SupabaseClient,
  candidates: OutreachProspectRecord[],
  options: {
    maxItems: number;
    autoOnDiscovery?: boolean;
    adminUserId?: string;
    syncTargets?: OutreachProspectRecord[];
  }
): Promise<number> {
  const poolMap = new Map<string, OutreachProspectRecord>();
  for (const p of candidates) {
    if (p?.id && !normalizeInstagramProfileUrl(p.instagram_url)) {
      poolMap.set(p.id, p);
    }
  }
  if (poolMap.size === 0) return 0;

  const igMatches = await discoverInstagramProfilesBatch(Array.from(poolMap.values()), {
    concurrency: 4,
    maxItems: options.maxItems,
  });
  if (igMatches.size === 0) return 0;

  const syncMap = new Map<string, OutreachProspectRecord>();
  for (const p of options.syncTargets || []) {
    if (p?.id) syncMap.set(p.id, p);
  }

  const nowIso = new Date().toISOString();
  const activityInserts: Array<Record<string, unknown>> = [];

  await Promise.all(
    Array.from(igMatches.entries()).map(async ([prospectId, igRes]) => {
      if (!igRes.instagramUrl) return;
      const candidateRef = poolMap.get(prospectId);
      const syncRef = syncMap.get(prospectId);
      const baseSignals = syncRef?.digital_signals || candidateRef?.digital_signals || {};
      const mergedSignals = {
        ...baseSignals,
        instagramDiscoverySource: igRes.evidenceSource,
        instagramHandle: igRes.handle,
        instagramConfidence: igRes.confidence,
        instagramDiscoveredAt: nowIso,
      };

      await adminDb
        .from('outreach_prospects')
        .update({
          instagram_url: igRes.instagramUrl,
          digital_signals: mergedSignals,
          updated_at: nowIso,
        })
        .eq('id', prospectId);

      if (candidateRef) {
        candidateRef.instagram_url = igRes.instagramUrl;
        candidateRef.digital_signals = mergedSignals;
      }
      if (syncRef) {
        syncRef.instagram_url = igRes.instagramUrl;
        syncRef.digital_signals = mergedSignals;
      }

      activityInserts.push({
        prospect_id: prospectId,
        action: 'ai_instagram_discovered',
        metadata: {
          instagram_url: igRes.instagramUrl,
          handle: igRes.handle,
          confidence: igRes.confidence,
          evidence_source: igRes.evidenceSource,
          ...(options.autoOnDiscovery ? { auto_on_discovery: true } : {}),
        },
        admin_user_id: options.adminUserId || null,
      });
    })
  );

  if (activityInserts.length > 0) {
    await adminDb.from('outreach_activity_logs').insert(activityInserts);
  }

  return igMatches.size;
}

/**
 * Executes a queued or running job in `outreach_jobs` with progress updates,
 * retry tracking, idempotency, and cancellation checks.
 */
export async function processOutreachJob(
  adminDb: SupabaseClient,
  jobId: string,
  adminUserId?: string
): Promise<OutreachJobRecord | null> {
  const { data: jobRow } = await adminDb
    .from('outreach_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (!jobRow) return null;
  const job = jobRow as OutreachJobRecord;

  if (job.status === 'cancelled' || job.status === 'completed') {
    return job;
  }

  if (job.attempts >= job.max_attempts) {
    const { data: failedJob } = await adminDb
      .from('outreach_jobs')
      .update({
        status: 'failed',
        error_message: job.error_message || 'Numero massimo di tentativi superato.',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)
      .select('*')
      .single();
    return failedJob as OutreachJobRecord;
  }

  // Mark as running
  await adminDb
    .from('outreach_jobs')
    .update({
      status: 'running',
      progress: 10,
      attempts: (job.attempts || 0) + 1,
      error_message: null,
    })
    .eq('id', job.id);

  try {
    const kb = await loadActiveKnowledgeBase(adminDb);

    // ========================================================================
    // JOB TYPE 1: DISCOVERY
    // ========================================================================
    if (job.job_type === 'discovery') {
      const {
        locationQuery = 'Napoli',
        radiusKm = 35,
        centerLat = null,
        centerLon = null,
        category = 'food_beverage',
        subcategory = 'restaurant',
        maxResults = 25,
        providerIds = ['google_places_official', 'openstreetmap_odbl'],
      } = job.payload || {};

      let providers = getRegisteredDiscoveryProviders().filter((p) =>
        providerIds.includes(p.id)
      );
      if (providers.length === 0) {
        providers = [getRegisteredDiscoveryProviders()[0]];
      }

      const hasGooglePlacesKey = Boolean(
        process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      );
      if (
        !hasGooglePlacesKey &&
        providers.some((p) => p.id === 'google_places_official') &&
        providers.length > 1
      ) {
        providers = providers.filter((p) => p.id !== 'openstreetmap_odbl');
      }

      const { data: existingRows } = await adminDb
        .from('outreach_prospects')
        .select('*')
        .is('merged_into_id', null);
      const existingList = (existingRows || []) as OutreachProspectRecord[];

      let discoveredTotal = 0;
      let insertedCount = 0;
      let skippedDuplicates = 0;
      const insertedIds: string[] = [];
      const matchedIds: string[] = [];
      const matchedSet = new Set<string>();
      const warnings: string[] = [];
      const pendingInsertRows: Record<string, any>[] = [];
      const matchedProspectsMap = new Map<string, OutreachProspectRecord>();
      let searchCenter: {
        lat: number;
        lon: number;
        radiusKm: number;
        locationQuery: string;
      } | null = null;

      for (const provider of providers) {
        const searchRes = await provider.search({
          locationQuery,
          radiusKm: Math.max(1, Math.min(120, Number(radiusKm) || 35)),
          centerLat: typeof centerLat === 'number' ? centerLat : null,
          centerLon: typeof centerLon === 'number' ? centerLon : null,
          category,
          subcategory,
          maxResults: Number(maxResults) || 25,
          enrichWebsites: true,
        });

        if (searchRes.center && !searchCenter) {
          searchCenter = {
            lat: searchRes.center.lat,
            lon: searchRes.center.lon,
            radiusKm: Math.max(1, Math.min(120, Number(radiusKm) || 35)),
            locationQuery,
          };
        }

        warnings.push(...searchRes.warnings);
        discoveredTotal += searchRes.candidates.length;

        await adminDb
          .from('outreach_jobs')
          .update({ progress: 45 })
          .eq('id', job.id);

        for (const cand of searchRes.candidates) {
          const dupCheck = matchDuplicateInList(cand, existingList);
          if (dupCheck.isDuplicate && dupCheck.matchedProspect) {
            skippedDuplicates++;
            const existingMatch = dupCheck.matchedProspect;
            if (!matchedSet.has(existingMatch.id)) {
              matchedSet.add(existingMatch.id);
              matchedIds.push(existingMatch.id);
              matchedProspectsMap.set(existingMatch.id, existingMatch);
            }

            // Backfill missing coordinates, address, or Maps link on existing prospect
            const patch: Record<string, any> = {};
            if (existingMatch.latitude == null && cand.latitude != null) {
              patch.latitude = cand.latitude;
            }
            if (existingMatch.longitude == null && cand.longitude != null) {
              patch.longitude = cand.longitude;
            }
            if (!existingMatch.address && cand.address) {
              patch.address = cand.address;
            }
            if (!existingMatch.digital_signals?.googleMapsUrl && cand.digital_signals?.googleMapsUrl) {
              patch.digital_signals = {
                ...(existingMatch.digital_signals || {}),
                googleMapsUrl: cand.digital_signals.googleMapsUrl,
                distanceKm: cand.digital_signals.distanceKm ?? existingMatch.digital_signals?.distanceKm ?? null,
              };
            }
            if (Object.keys(patch).length > 0) {
              patch.updated_at = new Date().toISOString();
              await adminDb
                .from('outreach_prospects')
                .update(patch)
                .eq('id', existingMatch.id);
              Object.assign(existingMatch, patch);
            }
            continue;
          }

          const newRowPayload = {
            business_name: cand.business_name,
            normalized_name: cand.normalized_name,
            category: cand.category,
            subcategory: cand.subcategory,
            city: cand.city,
            province: cand.province,
            region: cand.region,
            address: cand.address,
            postal_code: cand.postal_code,
            latitude: cand.latitude,
            longitude: cand.longitude,
            website: cand.website,
            website_domain: cand.website_domain,
            instagram_url: cand.instagram_url,
            facebook_url: cand.facebook_url,
            business_phone: cand.business_phone,
            business_email: cand.business_email,
            description: cand.description,
            services_offered: cand.services_offered,
            digital_signals: cand.digital_signals,
            source: cand.source,
            source_reference: cand.source_reference,
            source_acquired_at: cand.source_acquired_at,
            commercial_status: 'da_analizzare',
          };

          pendingInsertRows.push(newRowPayload);
          existingList.push({
            id: `pending-${pendingInsertRows.length}`,
            ...(newRowPayload as any),
          } as OutreachProspectRecord);
        }
      }

      // Bulk insert newly discovered prospects (with row-by-row fallback on rare constraint collision)
      const insertedRows: OutreachProspectRecord[] = [];
      if (pendingInsertRows.length > 0) {
        const { data: bulkInserted, error: bulkErr } = await adminDb
          .from('outreach_prospects')
          .insert(pendingInsertRows)
          .select('*');

        if (!bulkErr && Array.isArray(bulkInserted)) {
          insertedRows.push(...(bulkInserted as OutreachProspectRecord[]));
        } else {
          for (const row of pendingInsertRows) {
            const { data: singleInserted, error: singleErr } = await adminDb
              .from('outreach_prospects')
              .insert(row)
              .select('*')
              .maybeSingle();
            if (!singleErr && singleInserted) {
              insertedRows.push(singleInserted as OutreachProspectRecord);
            } else {
              skippedDuplicates++;
            }
          }
        }
      }

      for (const r of insertedRows) {
        insertedCount++;
        insertedIds.push(r.id);
      }

      await adminDb.from('outreach_jobs').update({ progress: 70 }).eq('id', job.id);

      // Automatically execute AI Business Intelligence analysis on all newly discovered
      // prospects AND any matched prospects from earlier searches that lacked AI analysis.
      const matchedNeedingAnalysis = Array.from(matchedProspectsMap.values()).filter(
        (m) =>
          !m.ai_analysis ||
          m.commercial_status === 'nuovo' ||
          m.commercial_status === 'da_analizzare'
      );

      const toAnalyzeMap = new Map<string, OutreachProspectRecord>();
      for (const p of [...insertedRows, ...matchedNeedingAnalysis]) {
        if (p?.id) toAnalyzeMap.set(p.id, p);
      }
      const prospectsToAnalyze = Array.from(toAnalyzeMap.values());

      const instagramDiscoveredCount = await discoverAndPersistMissingInstagram(
        adminDb,
        [...insertedRows, ...Array.from(matchedProspectsMap.values())],
        {
          maxItems: 18,
          autoOnDiscovery: true,
          adminUserId,
          syncTargets: prospectsToAnalyze,
        }
      );

      let analyzedCount = 0;
      if (prospectsToAnalyze.length > 0) {
        const analysisMap = await analyzeProspectsBatchWithAI(prospectsToAnalyze, kb);
        const nowIso = new Date().toISOString();
        const generationInserts: any[] = [];
        const activityInserts: Array<Record<string, unknown>> = [];

        await Promise.all(
          prospectsToAnalyze.map(async (p) => {
            const analysis = analysisMap.get(p.id);
            if (!analysis) return;

            const nextStatus =
              p.commercial_status === 'nuovo' || p.commercial_status === 'da_analizzare'
                ? 'analizzato'
                : p.commercial_status;

            await adminDb
              .from('outreach_prospects')
              .update({
                lead_score: analysis.totalLeadScore,
                confidence_score: analysis.confidenceScore,
                ai_analysis: analysis,
                commercial_status: nextStatus,
                updated_at: nowIso,
              })
              .eq('id', p.id);

            generationInserts.push({
              prospect_id: p.id,
              generation_type: 'business_intelligence',
              prompt_version: 'v1.0',
              generated_content: analysis,
              model: analysis.modelUsed,
            });
            activityInserts.push({
              prospect_id: p.id,
              action: 'ai_analysis_completed',
              metadata: {
                lead_score: analysis.totalLeadScore,
                confidence_score: analysis.confidenceScore,
                model: analysis.modelUsed,
                auto_on_discovery: true,
              },
              admin_user_id: adminUserId || null,
            });
            analyzedCount++;
          })
        );

        await Promise.all([
          generationInserts.length > 0
            ? adminDb.from('outreach_ai_generations').insert(generationInserts)
            : Promise.resolve(),
          activityInserts.length > 0
            ? adminDb.from('outreach_activity_logs').insert(activityInserts)
            : Promise.resolve(),
        ]);
      }

      const alreadyAnalyzedMatchedCount = Array.from(matchedProspectsMap.values()).filter(
        (m) => Boolean(m.ai_analysis)
      ).length;

      const allResultIds = Array.from(new Set([...insertedIds, ...matchedIds]));
      const resultSummary = {
        discoveredTotal,
        insertedCount,
        skippedDuplicates,
        analyzedCount: analyzedCount + alreadyAnalyzedMatchedCount,
        newlyAnalyzedCount: analyzedCount,
        instagramDiscoveredCount,
        insertedIds,
        matchedIds,
        allResultIds,
        searchCenter,
        warnings: Array.from(new Set(warnings)),
      };

      const { data: completedJob } = await adminDb
        .from('outreach_jobs')
        .update({
          status: 'completed',
          progress: 100,
          result: resultSummary,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .select('*')
        .single();

      return completedJob as OutreachJobRecord;
    }

    // ========================================================================
    // JOB TYPE 2: AI ANALYSIS BATCH
    // ========================================================================
    if (job.job_type === 'ai_analysis') {
      const prospectIds: string[] = Array.isArray(job.payload?.prospectIds)
        ? job.payload.prospectIds
        : [];

      const { data: pRows } =
        prospectIds.length > 0
          ? await adminDb.from('outreach_prospects').select('*').in('id', prospectIds)
          : { data: [] };

      const targetProspects = (pRows || []) as OutreachProspectRecord[];
      const instagramDiscoveredCount = await discoverAndPersistMissingInstagram(
        adminDb,
        targetProspects,
        {
          maxItems: 15,
          adminUserId,
          syncTargets: targetProspects,
        }
      );

      const analysisMap = await analyzeProspectsBatchWithAI(targetProspects, kb);
      const nowIso = new Date().toISOString();
      const generationInserts: any[] = [];
      let analyzedCount = 0;

      await Promise.all(
        targetProspects.map(async (prospect) => {
          const analysis = analysisMap.get(prospect.id);
          if (!analysis) return;

          await adminDb
            .from('outreach_prospects')
            .update({
              lead_score: analysis.totalLeadScore,
              confidence_score: analysis.confidenceScore,
              ai_analysis: analysis,
              commercial_status:
                prospect.commercial_status === 'nuovo' ||
                prospect.commercial_status === 'da_analizzare'
                  ? 'analizzato'
                  : prospect.commercial_status,
              updated_at: nowIso,
            })
            .eq('id', prospect.id);

          generationInserts.push({
            prospect_id: prospect.id,
            generation_type: 'business_intelligence',
            prompt_version: 'v1.0',
            generated_content: analysis,
            model: analysis.modelUsed,
          });
          analyzedCount++;
        })
      );

      if (generationInserts.length > 0) {
        await adminDb.from('outreach_ai_generations').insert(generationInserts);
      }

      const { data: completedJob } = await adminDb
        .from('outreach_jobs')
        .update({
          status: 'completed',
          progress: 100,
          result: { analyzedCount, instagramDiscoveredCount },
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .select('*')
        .single();

      return completedJob as OutreachJobRecord;
    }

    // ========================================================================
    // JOB TYPE 3: CAMPAIGN EXECUTION
    // ========================================================================
    if (job.job_type === 'campaign_execution') {
      const campaignId = job.payload?.campaignId;
      const { data: campaign } = await adminDb
        .from('outreach_campaigns')
        .select('*')
        .eq('id', campaignId)
        .maybeSingle();

      if (!campaign || campaign.status === 'cancelled' || campaign.status === 'paused') {
        const { data: cancelledJob } = await adminDb
          .from('outreach_jobs')
          .update({
            status: 'cancelled',
            result: { reason: 'Campagna in pausa o annullata.' },
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id)
          .select('*')
          .single();
        return cancelledJob as OutreachJobRecord;
      }

      const cfg = campaign.configuration || {};
      const maxToAnalyze = Math.min(30, Number(cfg.maxProspects) || 10);
      const minLeadScore = Number(cfg.minLeadScore) || 50;
      const subcategory = cfg.subcategory || campaign.category;
      const preferredVariant = cfg.preferredVariant || 'C_consultative';
      const channel = cfg.channel || 'email';

      // Step 1: Discover new prospects for campaign location & category
      const mapsProvider = getRegisteredDiscoveryProviders()[0];
      const searchRes = await mapsProvider.search({
        locationQuery: campaign.location || 'Napoli',
        radiusKm: Math.max(1, Math.min(120, Number(cfg.radiusKm) || 35)),
        category: campaign.category,
        subcategory,
        maxResults: maxToAnalyze,
        enrichWebsites: true,
      });

      const { data: existingRows } = await adminDb
        .from('outreach_prospects')
        .select('*')
        .is('merged_into_id', null);
      const existingList = (existingRows || []) as OutreachProspectRecord[];

      const campaignProspects: OutreachProspectRecord[] = [];

      for (const cand of searchRes.candidates) {
        const dup = matchDuplicateInList(cand, existingList);
        if (dup.isDuplicate && dup.matchedProspect) {
          campaignProspects.push(dup.matchedProspect);
          continue;
        }

        const { data: inserted } = await adminDb
          .from('outreach_prospects')
          .insert({
            business_name: cand.business_name,
            normalized_name: cand.normalized_name,
            category: cand.category,
            subcategory: cand.subcategory,
            city: cand.city,
            province: cand.province,
            region: cand.region,
            address: cand.address,
            postal_code: cand.postal_code,
            latitude: cand.latitude,
            longitude: cand.longitude,
            website: cand.website,
            website_domain: cand.website_domain,
            instagram_url: cand.instagram_url,
            facebook_url: cand.facebook_url,
            business_phone: cand.business_phone,
            business_email: cand.business_email,
            description: cand.description,
            services_offered: cand.services_offered,
            digital_signals: cand.digital_signals,
            source: cand.source,
            source_reference: cand.source_reference,
            source_acquired_at: cand.source_acquired_at,
            commercial_status: 'da_analizzare',
          })
          .select('*')
          .maybeSingle();

        if (inserted) {
          const p = inserted as OutreachProspectRecord;
          campaignProspects.push(p);
          existingList.push(p);
        }
      }

      await adminDb.from('outreach_jobs').update({ progress: 45 }).eq('id', job.id);

      // Step 2, 3, 4, 5: Analyze, Qualify, Generate Draft Communications, Link to Campaign
      let analyzed = 0;
      let qualified = 0;
      let draftsGenerated = 0;

      for (const p of campaignProspects.slice(0, maxToAnalyze)) {
        // Re-check if campaign was paused/cancelled mid-run
        const { data: liveCamp } = await adminDb
          .from('outreach_campaigns')
          .select('status')
          .eq('id', campaign.id)
          .maybeSingle();
        if (liveCamp?.status === 'paused' || liveCamp?.status === 'cancelled') {
          break;
        }

        const analysis = await analyzeProspectWithAI(p, kb);
        analyzed++;

        const isQualified = analysis.totalLeadScore >= minLeadScore;
        const nextStatus = isQualified ? 'da_contattare' : 'analizzato';

        const { data: updatedP } = await adminDb
          .from('outreach_prospects')
          .update({
            lead_score: analysis.totalLeadScore,
            confidence_score: analysis.confidenceScore,
            ai_analysis: analysis,
            commercial_status:
              p.commercial_status === 'convertito_in_cliente' ||
              p.commercial_status === 'non_contattare'
                ? p.commercial_status
                : nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', p.id)
          .select('*')
          .single();

        await adminDb.from('outreach_ai_generations').insert({
          prospect_id: p.id,
          generation_type: 'business_intelligence',
          prompt_version: 'v1.0',
          generated_content: analysis,
          model: analysis.modelUsed,
        });

        let campProcStatus: 'analyzed' | 'qualified' | 'message_generated' | 'in_pipeline' = 'analyzed';

        if (isQualified && updatedP) {
          qualified++;
          const pitchPayload = await generatePersonalizedSalesPitches(
            updatedP as OutreachProspectRecord,
            kb,
            cfg.objective || undefined
          );

          await adminDb.from('outreach_ai_generations').insert({
            prospect_id: p.id,
            generation_type: 'sales_pitch',
            prompt_version: pitchPayload.promptVersion,
            generated_content: pitchPayload,
            model: pitchPayload.modelUsed,
          });

          const chosenVariant =
            pitchPayload.variants[preferredVariant as keyof typeof pitchPayload.variants] ||
            pitchPayload.variants.C_consultative;

          // Save strictly in Draft/Approval queue — never auto-send without compliance check
          await adminDb.from('outreach_messages').insert({
            prospect_id: p.id,
            channel,
            direction: 'outbound',
            delivery_mode: cfg.deliveryMode === 'approval' ? 'approval' : 'draft',
            subject: chosenVariant.subject,
            content: chosenVariant.fullMessageBody,
            variant_used: chosenVariant.variant,
            provider_status: cfg.deliveryMode === 'approval' ? 'pending_approval' : 'draft',
          });

          draftsGenerated++;
          campProcStatus = 'in_pipeline';
        }

        await adminDb.from('outreach_campaign_prospects').upsert(
          {
            campaign_id: campaign.id,
            prospect_id: p.id,
            processing_status: campProcStatus,
          },
          { onConflict: 'campaign_id,prospect_id' }
        );
      }

      await adminDb
        .from('outreach_campaigns')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      const { data: completedJob } = await adminDb
        .from('outreach_jobs')
        .update({
          status: 'completed',
          progress: 100,
          result: {
            discovered: campaignProspects.length,
            analyzed,
            qualified,
            draftsGenerated,
          },
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .select('*')
        .single();

      return completedJob as OutreachJobRecord;
    }

    // Default completion for other job types
    const { data: doneJob } = await adminDb
      .from('outreach_jobs')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)
      .select('*')
      .single();

    return doneJob as OutreachJobRecord;
  } catch (err: any) {
    const errMsg = err?.message || 'Errore durante l’elaborazione del job asincrono.';
    const { data: failedJob } = await adminDb
      .from('outreach_jobs')
      .update({
        status: 'failed',
        error_message: errMsg,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)
      .select('*')
      .single();

    if (adminUserId) {
      await adminDb.from('outreach_activity_logs').insert({
        action: 'job_failed',
        metadata: { job_id: job.id, job_type: job.job_type, error: errMsg },
        admin_user_id: adminUserId,
      });
    }

    return failedJob as OutreachJobRecord;
  }
}

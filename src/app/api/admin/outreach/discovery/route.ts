import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminAccess } from '@/lib/outreach/auth';
import { OUTREACH_DISCOVERY_CATEGORIES, type OutreachProspectRecord } from '@/lib/outreach/types';
import {
  getRegisteredDiscoveryProviders,
  inspectPublicWebsiteMetadata,
} from '@/lib/outreach/providers/discovery';
import {
  extractWebsiteDomain,
  matchDuplicateInList,
  normalizeBusinessName,
} from '@/lib/outreach/deduplication';
import { processOutreachJob } from '@/lib/outreach/jobs';

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

  const { data: recentJobs } = await adminDb
    .from('outreach_jobs')
    .select('*')
    .eq('job_type', 'discovery')
    .order('created_at', { ascending: false })
    .limit(12);

  return NextResponse.json({
    categories: OUTREACH_DISCOVERY_CATEGORIES,
    providers,
    recentJobs: recentJobs || [],
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
      const locationQuery = String(body.locationQuery || '').trim();
      const radiusKm = Math.max(1, Math.min(25, Number(body.radiusKm) || 5));
      const category = String(body.category || 'food_beverage');
      const subcategory = String(body.subcategory || 'restaurant');
      const maxResults = Math.max(1, Math.min(50, Number(body.maxResults) || 20));
      const providerIds: string[] = Array.isArray(body.providerIds)
        ? body.providerIds
        : ['openstreetmap_odbl'];

      if (!locationQuery) {
        return NextResponse.json(
          { error: 'Inserisci una località valida (es. Napoli, Milano, Roma).' },
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
      let insertedProspects: any[] = [];
      if (insertedIds.length > 0) {
        const { data: rows } = await adminDb
          .from('outreach_prospects')
          .select('*')
          .in('id', insertedIds)
          .order('created_at', { ascending: false });
        insertedProspects = rows || [];
      }

      return NextResponse.json({
        job: completedJob,
        insertedProspects,
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

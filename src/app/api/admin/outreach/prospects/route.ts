import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminAccess } from '@/lib/outreach/auth';
import { ensureProspectLogoPersisted } from '@/lib/outreach/brand-discovery';
import {
  extractWebsiteDomain,
  mergeDuplicateProspects,
  normalizeBusinessName,
} from '@/lib/outreach/deduplication';
import { inspectPublicWebsiteMetadata } from '@/lib/outreach/providers/discovery';
import { isSafePublicHttpUrl } from '@/lib/outreach/logo-resolver';
import { convertProspectToRivoClient } from '@/lib/outreach/conversion';
import { OUTREACH_PIPELINE_STAGES, type OutreachCommercialStatus } from '@/lib/outreach/types';
import { isValidUUID } from '@/lib/security';

const VALID_STATUSES = new Set<string>(OUTREACH_PIPELINE_STAGES.map((s) => s.id));
const MAX_LOGO_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_UPLOAD_MIMES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const ALLOWED_LOGO_UPLOAD_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);

function toSignalsRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

export async function GET(request: NextRequest) {
  const auth = await verifySuperAdminAccess(request);
  if (!auth.authorized) return auth.errorResponse;
  const { adminDb } = auth;

  try {
    const sp = request.nextUrl.searchParams;
    const singleId = sp.get('id');

    // 1. Single Prospect full dossier
    if (singleId) {
      if (!isValidUUID(singleId)) {
        return NextResponse.json({ error: 'ID prospect non valido.' }, { status: 400 });
      }

      const [
        { data: prospect },
        { data: generations },
        { data: messages },
        { data: permissions },
        { data: suppressions },
        { data: logs },
      ] = await Promise.all([
        adminDb.from('outreach_prospects').select('*').eq('id', singleId).maybeSingle(),
        adminDb
          .from('outreach_ai_generations')
          .select('*')
          .eq('prospect_id', singleId)
          .order('created_at', { ascending: false }),
        adminDb
          .from('outreach_messages')
          .select('*')
          .eq('prospect_id', singleId)
          .order('created_at', { ascending: false }),
        adminDb
          .from('outreach_contact_permissions')
          .select('*')
          .eq('prospect_id', singleId)
          .order('created_at', { ascending: false }),
        adminDb
          .from('outreach_suppressions')
          .select('*')
          .eq('prospect_id', singleId),
        adminDb
          .from('outreach_activity_logs')
          .select('*')
          .eq('prospect_id', singleId)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      if (!prospect) {
        return NextResponse.json({ error: 'Prospect non trovato.' }, { status: 404 });
      }

      // Check potential duplicates (same normalized_name or website_domain)
      let duplicateCandidates: Array<Record<string, unknown>> = [];
      if (prospect.normalized_name) {
        const { data: dups } = await adminDb
          .from('outreach_prospects')
          .select('id, business_name, city, address, website, source, lead_score')
          .neq('id', prospect.id)
          .is('merged_into_id', null)
          .eq('normalized_name', prospect.normalized_name)
          .limit(5);
        duplicateCandidates = dups || [];
      }

      return NextResponse.json({
        prospect,
        generations: generations || [],
        messages: messages || [],
        permissions: permissions || [],
        suppressions: suppressions || [],
        logs: logs || [],
        duplicateCandidates,
      });
    }

    // 2. Paginated, filterable, sortable Prospect list
    const q = (sp.get('q') || '').trim();
    const category = sp.get('category') || '';
    const subcategory = sp.get('subcategory') || '';
    const city = (sp.get('city') || '').trim();
    const status = sp.get('status') || '';
    const minScore = Number(sp.get('minScore') || 0);
    const sortBy = sp.get('sortBy') || 'created_at';
    const sortDir = sp.get('sortDir') === 'asc' ? true : false;
    const page = Math.max(1, Number(sp.get('page') || 1));
    const pageSize = Math.max(1, Math.min(200, Number(sp.get('pageSize') || 50)));

    let query = adminDb
      .from('outreach_prospects')
      .select('*', { count: 'exact' })
      .is('merged_into_id', null);

    if (q) {
      query = query.or(
        `business_name.ilike.%${q}%,city.ilike.%${q}%,website.ilike.%${q}%,business_email.ilike.%${q}%`
      );
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    if (status && VALID_STATUSES.has(status)) {
      query = query.eq('commercial_status', status);
    }
    if (minScore > 0) {
      query = query.gte('lead_score', minScore);
    }

    const allowedSortCols = new Set(['created_at', 'lead_score', 'business_name', 'updated_at']);
    const sortColumn = allowedSortCols.has(sortBy) ? sortBy : 'created_at';

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: rows, count, error } = await query
      .order(sortColumn, { ascending: sortDir })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      prospects: rows || [],
      totalCount: count || 0,
      page,
      pageSize,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Errore nel caricamento dei prospect.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifySuperAdminAccess(request);
  if (!auth.authorized) return auth.errorResponse;
  const { adminDb, user } = auth;

  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.toLowerCase().includes('multipart/form-data')) {
      const formData = await request.formData();
      const formAction = String(formData.get('action') || '');

      if (formAction === 'upload_prospect_logo') {
        const prospectId = String(formData.get('prospect_id') || '').trim();
        if (!isValidUUID(prospectId)) {
          return NextResponse.json({ error: 'ID prospect non valido.' }, { status: 400 });
        }

        const rawFile = formData.get('file');
        if (!rawFile || typeof rawFile === 'string' || typeof rawFile.arrayBuffer !== 'function') {
          return NextResponse.json({ error: 'Nessun file selezionato.' }, { status: 400 });
        }

        const mimeType = (rawFile.type || '').toLowerCase();
        const fallbackExt = ALLOWED_LOGO_UPLOAD_MIMES[mimeType];
        if (!fallbackExt) {
          return NextResponse.json(
            { error: 'Formato file non supportato. Usa PNG, JPEG, WEBP o GIF.' },
            { status: 400 }
          );
        }

        if (rawFile.size <= 0) {
          return NextResponse.json({ error: 'Il file selezionato è vuoto.' }, { status: 400 });
        }
        if (rawFile.size > MAX_LOGO_UPLOAD_BYTES) {
          return NextResponse.json(
            { error: 'Il file è troppo grande. Dimensione massima 5MB.' },
            { status: 400 }
          );
        }

        const { data: existingProspect, error: existingErr } = await adminDb
          .from('outreach_prospects')
          .select('id, digital_signals')
          .eq('id', prospectId)
          .maybeSingle();

        if (existingErr) {
          return NextResponse.json({ error: existingErr.message }, { status: 500 });
        }
        if (!existingProspect) {
          return NextResponse.json({ error: 'Prospect non trovato.' }, { status: 404 });
        }

        const fileName = 'name' in rawFile && typeof rawFile.name === 'string' ? rawFile.name : '';
        const nameExt = fileName.split('.').pop()?.toLowerCase() || '';
        const ext = ALLOWED_LOGO_UPLOAD_EXTS.has(nameExt) ? nameExt : fallbackExt;

        const filePath = `outreach-prospects/${prospectId}/logo-${Date.now()}.${ext}`;
        const fileBuffer = Buffer.from(await rawFile.arrayBuffer());

        const { error: uploadError } = await adminDb.storage
          .from('logos')
          .upload(filePath, fileBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) {
          return NextResponse.json(
            { error: `Errore caricamento storage: ${uploadError.message}` },
            { status: 500 }
          );
        }

        const { data: publicUrlData } = adminDb.storage
          .from('logos')
          .getPublicUrl(filePath);
        const publicUrl = publicUrlData.publicUrl;

        const existingSignals = toSignalsRecord(existingProspect.digital_signals);
        const { data: updated, error: updateError } = await adminDb
          .from('outreach_prospects')
          .update({
            digital_signals: {
              ...existingSignals,
              customLogoUrl: publicUrl,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', prospectId)
          .select('*')
          .single();

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        await adminDb.from('outreach_activity_logs').insert({
          prospect_id: prospectId,
          action: 'prospect_logo_uploaded',
          metadata: { logo_url: publicUrl, file_path: filePath },
          admin_user_id: user.id,
        });

        return NextResponse.json({
          success: true,
          prospect: updated,
          logoUrl: publicUrl,
        });
      }

      return NextResponse.json({ error: 'Azione multipart non riconosciuta.' }, { status: 400 });
    }

    const body = await request.json();
    const action = String(body.action || '');

    // 1. Update pipeline status (single or bulk multi-selection)
    if (action === 'update_status') {
      const ids: string[] = Array.isArray(body.prospect_ids)
        ? body.prospect_ids
        : body.prospect_id
        ? [body.prospect_id]
        : [];
      const newStatus = String(body.commercial_status || '') as OutreachCommercialStatus;

      if (ids.length === 0 || !VALID_STATUSES.has(newStatus)) {
        return NextResponse.json(
          { error: 'Seleziona almeno un prospect e uno stato pipeline valido.' },
          { status: 400 }
        );
      }

      const nowIso = new Date().toISOString();
      const { error } = await adminDb
        .from('outreach_prospects')
        .update({ commercial_status: newStatus, updated_at: nowIso })
        .in('id', ids);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await adminDb.from('outreach_activity_logs').insert(
        ids.map((id) => ({
          prospect_id: id,
          action: 'pipeline_status_updated',
          metadata: { new_status: newStatus },
          admin_user_id: user.id,
        }))
      );

      return NextResponse.json({ success: true, updatedCount: ids.length });
    }

    // 2. Update prospect profile & admin notes
    if (action === 'update_prospect') {
      const prospectId = String(body.prospect_id || '');
      if (!isValidUUID(prospectId)) {
        return NextResponse.json({ error: 'ID prospect non valido.' }, { status: 400 });
      }

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (typeof body.business_name === 'string' && body.business_name.trim()) {
        updates.business_name = body.business_name.trim();
        updates.normalized_name = normalizeBusinessName(body.business_name);
      }
      if (typeof body.admin_notes === 'string') updates.admin_notes = body.admin_notes;
      if (typeof body.business_email === 'string') updates.business_email = body.business_email.trim() || null;
      if (typeof body.business_phone === 'string') updates.business_phone = body.business_phone.trim() || null;
      if (typeof body.website === 'string') {
        updates.website = body.website.trim() || null;
        updates.website_domain = extractWebsiteDomain(body.website);
      }
      if (typeof body.instagram_url === 'string') updates.instagram_url = body.instagram_url.trim() || null;
      if (typeof body.facebook_url === 'string') updates.facebook_url = body.facebook_url.trim() || null;
      if (typeof body.city === 'string') updates.city = body.city.trim() || null;
      if (typeof body.address === 'string') updates.address = body.address.trim() || null;

      if (typeof body.custom_logo_url === 'string') {
        const trimmedLogo = body.custom_logo_url.trim();
        let nextCustomLogoUrl: string | null = null;
        if (trimmedLogo) {
          const validUrl = isSafePublicHttpUrl(trimmedLogo);
          if (!validUrl) {
            return NextResponse.json(
              { error: 'URL logo non valido (usa un link https:// pubblico).' },
              { status: 400 }
            );
          }
          nextCustomLogoUrl = validUrl.toString();
        }

        const { data: existingProspect, error: existingErr } = await adminDb
          .from('outreach_prospects')
          .select('digital_signals')
          .eq('id', prospectId)
          .maybeSingle();

        if (existingErr) {
          return NextResponse.json({ error: existingErr.message }, { status: 500 });
        }
        if (!existingProspect) {
          return NextResponse.json({ error: 'Prospect non trovato.' }, { status: 404 });
        }

        const existingSignals = toSignalsRecord(existingProspect.digital_signals);

        updates.digital_signals = {
          ...existingSignals,
          customLogoUrl: nextCustomLogoUrl,
        };
      }

      const { data: updated, error } = await adminDb
        .from('outreach_prospects')
        .update(updates)
        .eq('id', prospectId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await adminDb.from('outreach_activity_logs').insert({
        prospect_id: prospectId,
        action: 'prospect_profile_updated',
        metadata: { updated_fields: Object.keys(updates) },
        admin_user_id: user.id,
      });

      return NextResponse.json({ success: true, prospect: updated });
    }

    // 3. Enrich public website metadata
    if (action === 'enrich_website') {
      const prospectId = String(body.prospect_id || '');
      if (!isValidUUID(prospectId)) {
        return NextResponse.json({ error: 'ID prospect non valido.' }, { status: 400 });
      }

      const { data: prospect } = await adminDb
        .from('outreach_prospects')
        .select('*')
        .eq('id', prospectId)
        .maybeSingle();

      if (!prospect || !prospect.website) {
        return NextResponse.json(
          { error: 'Il prospect non ha un URL sito web associato.' },
          { status: 400 }
        );
      }

      const signals = await inspectPublicWebsiteMetadata(prospect.website);
      const existingSignals = toSignalsRecord(prospect.digital_signals);
      const existingCustom =
        typeof existingSignals.customLogoUrl === 'string' && existingSignals.customLogoUrl.trim()
          ? existingSignals.customLogoUrl.trim()
          : null;

      const mergedSignals = {
        ...signals,
        ...(existingCustom ? { customLogoUrl: existingCustom } : {}),
        ...(typeof existingSignals.googleMapsUrl === 'string'
          ? { googleMapsUrl: existingSignals.googleMapsUrl }
          : {}),
        ...(typeof existingSignals.distanceKm === 'number'
          ? { distanceKm: existingSignals.distanceKm }
          : {}),
        ...(typeof existingSignals.rating === 'number' ? { rating: existingSignals.rating } : {}),
        ...(typeof existingSignals.userRatingCount === 'number'
          ? { userRatingCount: existingSignals.userRatingCount }
          : {}),
      };

      const { data: updated, error: enrichErr } = await adminDb
        .from('outreach_prospects')
        .update({
          digital_signals: mergedSignals,
          description: prospect.description || signals.websiteDescription || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prospectId)
        .select('*')
        .single();

      if (enrichErr) {
        return NextResponse.json({ error: enrichErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, prospect: updated });
    }

    // 3b. Auto-discover verified brand logo (website, social, app stores, Gemini grounding fallback)
    if (action === 'discover_logo') {
      const prospectId = String(body.prospect_id || '');
      if (!isValidUUID(prospectId)) {
        return NextResponse.json({ error: 'ID prospect non valido.' }, { status: 400 });
      }

      const { data: prospect, error: prospectErr } = await adminDb
        .from('outreach_prospects')
        .select('*')
        .eq('id', prospectId)
        .maybeSingle();

      if (prospectErr) {
        return NextResponse.json({ error: prospectErr.message }, { status: 500 });
      }
      if (!prospect) {
        return NextResponse.json({ error: 'Prospect non trovato.' }, { status: 404 });
      }

      const result = await ensureProspectLogoPersisted(adminDb, prospect, {
        discoverIfMissing: true,
        forceRediscover: true,
        allowGeminiFallback: true,
        timeoutMs: 3200,
      });

      const { data: freshProspect, error: freshErr } = await adminDb
        .from('outreach_prospects')
        .select('*')
        .eq('id', prospectId)
        .single();

      if (freshErr) {
        return NextResponse.json({ error: freshErr.message }, { status: 500 });
      }

      if (result.logoUrl) {
        await adminDb.from('outreach_activity_logs').insert({
          prospect_id: prospectId,
          action: 'prospect_logo_discovered',
          metadata: {
            logo_url: result.logoUrl,
            logo_source: result.logoSource,
          },
          admin_user_id: user.id,
        });
      }

      return NextResponse.json({
        success: true,
        found: Boolean(result.logoUrl),
        logoUrl: result.logoUrl,
        logoSource: result.logoSource,
        prospect: freshProspect,
      });
    }

    // 4. Merge duplicate prospects
    if (action === 'merge_duplicates') {
      const primaryId = String(body.primary_prospect_id || '');
      const secondaryId = String(body.secondary_prospect_id || '');
      if (!isValidUUID(primaryId) || !isValidUUID(secondaryId)) {
        return NextResponse.json({ error: 'ID schede non validi.' }, { status: 400 });
      }

      const res = await mergeDuplicateProspects(adminDb, primaryId, secondaryId, user.id);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    // 5. Convert Prospect to RIVO Client (Transactional & Idempotent)
    if (action === 'convert_to_client') {
      const prospectId = String(body.prospect_id || '');
      const ownerEmail = String(body.owner_email || '').trim();
      const ownerPassword = String(body.owner_password || 'Rivo2026!').trim();
      const ownerFirstName = String(body.owner_first_name || '').trim();
      const ownerLastName = String(body.owner_last_name || '').trim();
      const categoryOverride = body.category ? String(body.category) : undefined;
      const selectedModuleSlugs = Array.isArray(body.selected_modules)
        ? body.selected_modules.map(String)
        : undefined;

      if (!isValidUUID(prospectId) || !ownerEmail || !ownerPassword) {
        return NextResponse.json(
          { error: 'Prospect ID, email titolare e password sono obbligatori per la conversione.' },
          { status: 400 }
        );
      }

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(
        /\/$/,
        ''
      );

      const convRes = await convertProspectToRivoClient(adminDb, {
        prospectId,
        ownerEmail,
        ownerPassword,
        ownerFirstName,
        ownerLastName,
        categoryOverride,
        selectedModuleSlugs,
        appUrl,
        adminUserId: user.id,
      });

      if (!convRes.success) {
        return NextResponse.json({ error: convRes.error }, { status: 400 });
      }

      return NextResponse.json(convRes);
    }

    // 6. GDPR Right to Erasure / Delete Prospect
    if (action === 'erase_prospect') {
      const prospectId = String(body.prospect_id || '');
      if (!isValidUUID(prospectId)) {
        return NextResponse.json({ error: 'ID prospect non valido.' }, { status: 400 });
      }

      await adminDb.from('outreach_prospects').delete().eq('id', prospectId);
      await adminDb.from('outreach_activity_logs').insert({
        action: 'gdpr_prospect_erased',
        metadata: { erased_prospect_id: prospectId },
        admin_user_id: user.id,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Azione non riconosciuta.' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Errore durante l’operazione sui prospect.' },
      { status: 500 }
    );
  }
}

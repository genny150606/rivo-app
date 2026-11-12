import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminAccess } from '@/lib/outreach/auth';
import { processOutreachJob } from '@/lib/outreach/jobs';
import { isValidUUID } from '@/lib/security';

export async function GET(request: NextRequest) {
  const auth = await verifySuperAdminAccess(request);
  if (!auth.authorized) return auth.errorResponse;
  const { adminDb } = auth;

  try {
    const [{ data: campaigns }, { data: campProspects }, { data: jobs }] = await Promise.all([
      adminDb
        .from('outreach_campaigns')
        .select('*')
        .order('created_at', { ascending: false }),
      adminDb
        .from('outreach_campaign_prospects')
        .select('campaign_id, prospect_id, processing_status'),
      adminDb
        .from('outreach_jobs')
        .select('*')
        .eq('job_type', 'campaign_execution')
        .order('created_at', { ascending: false })
        .limit(15),
    ]);

    const cpRows = campProspects || [];
    const enriched = (campaigns || []).map((c) => {
      const rows = cpRows.filter((r) => r.campaign_id === c.id);
      return {
        ...c,
        metrics: {
          discovered: rows.length,
          analyzed: rows.filter((r) => r.processing_status !== 'discovered').length,
          qualified: rows.filter(
            (r) =>
              r.processing_status === 'qualified' ||
              r.processing_status === 'message_generated' ||
              r.processing_status === 'in_pipeline'
          ).length,
          inPipeline: rows.filter((r) => r.processing_status === 'in_pipeline').length,
        },
      };
    });

    return NextResponse.json({
      campaigns: enriched,
      recentJobs: jobs || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Errore nel caricamento delle campagne.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifySuperAdminAccess(request);
  if (!auth.authorized) return auth.errorResponse;
  const { adminDb, user } = auth;

  try {
    const body = await request.json();
    const action = String(body.action || '');

    // 1. Create Campaign
    if (action === 'create_campaign') {
      const name = String(body.name || '').trim();
      const category = String(body.category || 'beauty_personal_care');
      const location = String(body.location || '').trim();
      const configuration = body.configuration || {};

      if (!name || !location) {
        return NextResponse.json(
          { error: 'Nome della campagna e località sono obbligatori.' },
          { status: 400 }
        );
      }

      const { data: created, error } = await adminDb
        .from('outreach_campaigns')
        .insert({
          name,
          category,
          location,
          configuration,
          status: 'draft',
        })
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await adminDb.from('outreach_activity_logs').insert({
        action: 'campaign_created',
        metadata: { campaign_id: created.id, name, location },
        admin_user_id: user.id,
      });

      return NextResponse.json({ campaign: created });
    }

    // 2. Run / Start Campaign asynchronously
    if (action === 'run_campaign') {
      const campaignId = String(body.campaign_id || '');
      if (!isValidUUID(campaignId)) {
        return NextResponse.json({ error: 'ID campagna non valido.' }, { status: 400 });
      }

      await adminDb
        .from('outreach_campaigns')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('id', campaignId);

      const { data: job } = await adminDb
        .from('outreach_jobs')
        .insert({
          job_type: 'campaign_execution',
          status: 'queued',
          progress: 0,
          payload: { campaignId },
          created_by: user.id,
        })
        .select('*')
        .single();

      const completedJob = job ? await processOutreachJob(adminDb, job.id, user.id) : null;

      return NextResponse.json({
        success: true,
        job: completedJob,
      });
    }

    // 3. Pause, Resume or Cancel Campaign
    if (action === 'update_campaign_status') {
      const campaignId = String(body.campaign_id || '');
      const status = String(body.status || '');

      if (!isValidUUID(campaignId) || !['paused', 'running', 'cancelled', 'draft'].includes(status)) {
        return NextResponse.json(
          { error: 'Stato campagna o ID non valido.' },
          { status: 400 }
        );
      }

      const { data: updated, error } = await adminDb
        .from('outreach_campaigns')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', campaignId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, campaign: updated });
    }

    return NextResponse.json({ error: 'Azione non riconosciuta.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Errore nella gestione della campagna.' },
      { status: 500 }
    );
  }
}

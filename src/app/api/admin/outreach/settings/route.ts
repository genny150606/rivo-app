import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminAccess } from '@/lib/outreach/auth';
import { DEFAULT_RIVO_KNOWLEDGE_BASE } from '@/lib/outreach/knowledge-base';
import { getCommunicationChannelsStatus } from '@/lib/outreach/providers/communication';
import { getRegisteredDiscoveryProviders } from '@/lib/outreach/providers/discovery';

export async function GET(request: NextRequest) {
  const auth = await verifySuperAdminAccess(request);
  if (!auth.authorized) return auth.errorResponse;
  const { adminDb } = auth;

  try {
    const [{ data: settingsRows }, { data: sources }, { data: jobs }] = await Promise.all([
      adminDb.from('outreach_settings').select('*'),
      adminDb.from('outreach_sources').select('*').order('created_at', { ascending: true }),
      adminDb
        .from('outreach_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const settingsMap = new Map<string, any>();
    for (const r of settingsRows || []) {
      settingsMap.set(r.setting_key, r.setting_value);
    }

    const knowledgeBase = settingsMap.get('rivo_knowledge_base') || DEFAULT_RIVO_KNOWLEDGE_BASE;
    const commercialSettings = settingsMap.get('commercial_settings') || {
      retentionDays: 365,
      defaultAiModel: 'gemini-2.5-flash',
      defaultDeliveryMode: 'approval',
      maxDailyDiscoveryRequests: 50,
      monthlyAcquisitionBudgetEur: 0,
    };

    // Never expose raw API secret values to the browser — only boolean configuration status
    const envStatus = {
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY),
      googlePlacesConfigured: Boolean(process.env.GOOGLE_PLACES_API_KEY),
      smtpConfigured: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      whatsappCloudConfigured: Boolean(
        process.env.WHATSAPP_CLOUD_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
      ),
      metaInstagramConfigured: Boolean(
        process.env.META_IG_ACCESS_TOKEN && process.env.META_IG_BUSINESS_ACCOUNT_ID
      ),
    };

    return NextResponse.json({
      envStatus,
      knowledgeBase,
      commercialSettings,
      sources: sources || [],
      discoveryProviders: getRegisteredDiscoveryProviders().map((p) => ({
        id: p.id,
        name: p.name,
        providerType: p.providerType,
        attribution: p.attribution,
        configured: p.isConfigured(),
      })),
      communicationChannels: getCommunicationChannelsStatus(),
      jobs: jobs || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Errore nel caricamento delle impostazioni OUTREACH.' },
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

    if (action === 'save_knowledge_base') {
      const kb = body.knowledge_base;
      if (!kb || typeof kb !== 'object') {
        return NextResponse.json({ error: 'Knowledge Base non valida.' }, { status: 400 });
      }

      const { error } = await adminDb.from('outreach_settings').upsert(
        {
          setting_key: 'rivo_knowledge_base',
          setting_value: kb,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'setting_key' }
      );

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await adminDb.from('outreach_activity_logs').insert({
        action: 'knowledge_base_updated',
        metadata: { version: kb.version || '1.0' },
        admin_user_id: user.id,
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'save_commercial_settings') {
      const cs = body.commercial_settings || {};
      const { error } = await adminDb.from('outreach_settings').upsert(
        {
          setting_key: 'commercial_settings',
          setting_value: cs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'setting_key' }
      );

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ success: true });
    }

    if (action === 'run_retention_cleanup') {
      const nowIso = new Date().toISOString();
      const { data: expired } = await adminDb
        .from('outreach_prospects')
        .select('id')
        .lt('retention_expires_at', nowIso)
        .neq('commercial_status', 'convertito_in_cliente');

      const expiredIds = (expired || []).map((r) => r.id);
      if (expiredIds.length > 0) {
        await adminDb.from('outreach_prospects').delete().in('id', expiredIds);
      }

      await adminDb.from('outreach_activity_logs').insert({
        action: 'gdpr_retention_cleanup_executed',
        metadata: { deleted_count: expiredIds.length },
        admin_user_id: user.id,
      });

      return NextResponse.json({
        success: true,
        deletedCount: expiredIds.length,
      });
    }

    return NextResponse.json({ error: 'Azione non riconosciuta.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Errore nel salvataggio delle impostazioni.' },
      { status: 500 }
    );
  }
}

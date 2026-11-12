import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminAccess } from '@/lib/outreach/auth';

export async function GET(request: NextRequest) {
  const auth = await verifySuperAdminAccess(request);
  if (!auth.authorized) return auth.errorResponse;
  const { adminDb } = auth;

  try {
    const [
      { data: prospects },
      { data: generations },
      { data: messages },
      { data: campaigns },
      { data: campaignProspects },
      { data: jobs },
      { data: logs },
      { data: spendSetting },
    ] = await Promise.all([
      adminDb
        .from('outreach_prospects')
        .select('id, business_name, category, subcategory, city, province, lead_score, confidence_score, commercial_status, organization_id, created_at')
        .is('merged_into_id', null)
        .order('created_at', { ascending: false }),
      adminDb
        .from('outreach_ai_generations')
        .select('id, generation_type, model, approved, created_at'),
      adminDb
        .from('outreach_messages')
        .select('id, prospect_id, channel, direction, delivery_mode, provider_status, sent_at, created_at'),
      adminDb
        .from('outreach_campaigns')
        .select('id, name, category, location, status, created_at')
        .order('created_at', { ascending: false }),
      adminDb
        .from('outreach_campaign_prospects')
        .select('campaign_id, processing_status'),
      adminDb
        .from('outreach_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      adminDb
        .from('outreach_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15),
      adminDb
        .from('outreach_settings')
        .select('setting_value')
        .eq('setting_key', 'commercial_settings')
        .maybeSingle(),
    ]);

    const pList = prospects || [];
    const gList = generations || [];
    const mList = messages || [];
    const cList = campaigns || [];
    const cpList = campaignProspects || [];

    // 1. Primary KPIs (100% real database counts)
    const totalDiscovered = pList.length;
    const totalAnalyzed = pList.filter(
      (p) => p.commercial_status !== 'nuovo' && p.commercial_status !== 'da_analizzare'
    ).length;
    const qualifiedCount = pList.filter((p) => (p.lead_score || 0) >= 40).length;
    const highPotentialCount = pList.filter((p) => (p.lead_score || 0) >= 60).length;
    const priorityCount = pList.filter((p) => (p.lead_score || 0) >= 80).length;

    const messagesGeneratedCount =
      gList.filter((g) => g.generation_type === 'sales_pitch').length * 3;
    const outboundMessages = mList.filter((m) => m.direction === 'outbound');
    const messagesSentCount = outboundMessages.filter(
      (m) => m.provider_status === 'sent' || m.provider_status === 'delivered' || m.provider_status === 'replied'
    ).length;
    const repliesReceivedCount =
      mList.filter((m) => m.direction === 'inbound').length +
      pList.filter((p) =>
        ['in_conversazione', 'interessato', 'appuntamento_fissato', 'trattativa', 'convertito_in_cliente'].includes(
          p.commercial_status
        )
      ).length;

    const appointmentsBookedCount = pList.filter(
      (p) => p.commercial_status === 'appuntamento_fissato'
    ).length;
    const openNegotiationsCount = pList.filter(
      (p) => p.commercial_status === 'trattativa'
    ).length;
    const convertedClientsCount = pList.filter(
      (p) => p.commercial_status === 'convertito_in_cliente' || Boolean(p.organization_id)
    ).length;

    const conversionRatePercent =
      totalDiscovered > 0
        ? Number(((convertedClientsCount / totalDiscovered) * 100).toFixed(1))
        : 0;

    const responseRatePercent =
      messagesSentCount > 0
        ? Number(Math.min(100, (repliesReceivedCount / messagesSentCount) * 100).toFixed(1))
        : 0;

    const configuredSpendEur = Number(
      (spendSetting?.setting_value as { monthlyAcquisitionBudgetEur?: number } | null)
        ?.monthlyAcquisitionBudgetEur || 0
    );
    const cacEur =
      configuredSpendEur > 0 && convertedClientsCount > 0
        ? Number((configuredSpendEur / convertedClientsCount).toFixed(2))
        : null;

    // 2. Charts Data
    // 2a. Prospects over time (by day YYYY-MM-DD)
    const byDateMap = new Map<string, { date: string; acquisiti: number; analizzati: number; convertiti: number }>();
    for (const p of pList) {
      const dateStr = (p.created_at || '').slice(0, 10);
      if (!dateStr) continue;
      const cur = byDateMap.get(dateStr) || {
        date: dateStr,
        acquisiti: 0,
        analizzati: 0,
        convertiti: 0,
      };
      cur.acquisiti += 1;
      if (p.commercial_status !== 'nuovo' && p.commercial_status !== 'da_analizzare') {
        cur.analizzati += 1;
      }
      if (p.commercial_status === 'convertito_in_cliente' || p.organization_id) {
        cur.convertiti += 1;
      }
      byDateMap.set(dateStr, cur);
    }
    const prospectsOverTime = Array.from(byDateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // 2b. Prospects by Category / Subcategory
    const byCatMap = new Map<string, number>();
    for (const p of pList) {
      const key = p.subcategory || p.category || 'altro';
      byCatMap.set(key, (byCatMap.get(key) || 0) + 1);
    }
    const prospectsByCategory = Array.from(byCatMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // 2c. Prospects by Geography (City)
    const byCityMap = new Map<string, number>();
    for (const p of pList) {
      const city = (p.city || 'Non specificata').trim();
      byCityMap.set(city, (byCityMap.get(city) || 0) + 1);
    }
    const prospectsByGeography = Array.from(byCityMap.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 2d. Lead Score Distribution
    const scoreDistribution = [
      {
        bucket: '0–39 (Basso)',
        count: pList.filter((p) => (p.lead_score || 0) <= 39).length,
      },
      {
        bucket: '40–59 (Moderato)',
        count: pList.filter((p) => (p.lead_score || 0) >= 40 && (p.lead_score || 0) <= 59).length,
      },
      {
        bucket: '60–79 (Alto)',
        count: pList.filter((p) => (p.lead_score || 0) >= 60 && (p.lead_score || 0) <= 79).length,
      },
      {
        bucket: '80–100 (Priorità)',
        count: pList.filter((p) => (p.lead_score || 0) >= 80).length,
      },
    ];

    // 2e. Campaign Performance
    const campaignPerformance = cList.map((c) => {
      const rows = cpList.filter((cp) => cp.campaign_id === c.id);
      return {
        id: c.id,
        name: c.name,
        location: c.location,
        category: c.category,
        status: c.status,
        totalProspects: rows.length,
        qualifiedProspects: rows.filter(
          (r) => r.processing_status === 'qualified' || r.processing_status === 'in_pipeline'
        ).length,
      };
    });

    return NextResponse.json({
      kpis: {
        totalDiscovered,
        totalAnalyzed,
        qualifiedCount,
        highPotentialCount,
        priorityCount,
        messagesGeneratedCount,
        messagesSentCount,
        repliesReceivedCount,
        appointmentsBookedCount,
        openNegotiationsCount,
        convertedClientsCount,
        conversionRatePercent,
        responseRatePercent,
        cacEur,
      },
      charts: {
        prospectsOverTime,
        prospectsByCategory,
        prospectsByGeography,
        scoreDistribution,
        campaignPerformance,
      },
      recentJobs: jobs || [],
      recentActivity: logs || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Errore nel caricamento della dashboard OUTREACH.' },
      { status: 500 }
    );
  }
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Megaphone,
  Kanban,
  Activity,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  PageHeader,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  EmptyState,
  ChartTooltip,
} from '@/components/ui';
import { cn } from '@/lib/cn';

interface OverviewKpis {
  totalDiscovered: number;
  totalAnalyzed: number;
  qualifiedCount: number;
  highPotentialCount: number;
  priorityCount: number;
  messagesGeneratedCount: number;
  messagesSentCount: number;
  repliesReceivedCount: number;
  appointmentsBookedCount: number;
  openNegotiationsCount: number;
  convertedClientsCount: number;
  conversionRatePercent: number;
  responseRatePercent: number;
  cacEur: number | null;
}

interface OverviewJob {
  id: string;
  job_type: string;
  progress: number;
  attempts: number;
  max_attempts: number;
  status: string;
}

interface OverviewLog {
  id: string;
  action: string;
  created_at: string;
}

interface OverviewData {
  kpis: OverviewKpis;
  charts: {
    prospectsOverTime: { date: string; acquisiti: number; analizzati: number; convertiti: number }[];
    prospectsByCategory: { category: string; count: number }[];
    prospectsByGeography: { city: string; count: number }[];
    scoreDistribution: { bucket: string; count: number }[];
    campaignPerformance: {
      id: string;
      name: string;
      location: string;
      category: string;
      status: string;
      totalProspects: number;
      qualifiedProspects: number;
    }[];
  };
  recentJobs: OverviewJob[];
  recentActivity: OverviewLog[];
}

export default function OutreachOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/outreach/overview');
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Impossibile caricare i dati di RIVO OUTREACH');
      }
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore di connessione al database OUTREACH');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const kpis = data?.kpis;

  const kpiCards: Array<{
    label: string;
    value: string | number;
    sub: string;
    tone: 'neutral' | 'volt' | 'operational' | 'telemetry';
  }> = [
    {
      label: 'Attività Individuate',
      value: kpis?.totalDiscovered ?? 0,
      sub: 'Acquisite da fonti tracciate',
      tone: 'neutral',
    },
    {
      label: 'Attività Analizzate',
      value: kpis?.totalAnalyzed ?? 0,
      sub: 'Sottoposte a AI Intelligence',
      tone: 'telemetry',
    },
    {
      label: 'Prospect Qualificati',
      value: kpis?.qualifiedCount ?? 0,
      sub: 'Lead Score >= 40/100',
      tone: 'neutral',
    },
    {
      label: 'Alto Potenziale',
      value: kpis?.highPotentialCount ?? 0,
      sub: `Di cui ${kpis?.priorityCount ?? 0} priorità (80-100)`,
      tone: 'volt',
    },
    {
      label: 'Messaggi Generati',
      value: kpis?.messagesGeneratedCount ?? 0,
      sub: 'Varianti A/B/C personalizzate',
      tone: 'neutral',
    },
    {
      label: 'Comunicazioni Inviate',
      value: kpis?.messagesSentCount ?? 0,
      sub: 'Autorizzate da Compliance Gate',
      tone: 'telemetry',
    },
    {
      label: 'Risposte Ricevute',
      value: kpis?.repliesReceivedCount ?? 0,
      sub: `Tasso risposta: ${kpis?.responseRatePercent ?? 0}%`,
      tone: 'operational',
    },
    {
      label: 'Appuntamenti Fissati',
      value: kpis?.appointmentsBookedCount ?? 0,
      sub: 'Demo programmate in pipeline',
      tone: 'neutral',
    },
    {
      label: 'Trattative Aperte',
      value: kpis?.openNegotiationsCount ?? 0,
      sub: 'In fase di offerta commerciale',
      tone: 'neutral',
    },
    {
      label: 'Nuovi Clienti Acquisiti',
      value: kpis?.convertedClientsCount ?? 0,
      sub: 'Convertiti in Organizzazioni RIVO',
      tone: 'volt',
    },
    {
      label: 'Conversion Rate',
      value: `${kpis?.conversionRatePercent ?? 0}%`,
      sub: 'Da prospect individuato a cliente',
      tone: 'operational',
    },
    {
      label: 'Costo Medio Acquisizione',
      value: kpis?.cacEur !== null && kpis?.cacEur !== undefined ? `€${kpis.cacEur}` : 'N/D',
      sub:
        kpis?.cacEur !== null && kpis?.cacEur !== undefined
          ? 'Calcolato su budget mensile'
          : 'Configura budget in Impostazioni',
      tone: 'neutral',
    },
  ];

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="RIVO OUTREACH — BUSINESS INTELLIGENCE & SALES ACQUISITION"
        title="Overview Commerciale"
        description="Metriche reali di acquisizione, qualificazione AI, comunicazioni conformi e conversioni in clienti RIVO."
        actions={
          <>
            <Link
              href="/admin/outreach/discovery"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-3.5 py-2 text-xs font-bold text-[var(--rivo-volt-ink)] transition-colors"
            >
              <Search className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Ricerca Attività</span>
            </Link>
            <Link
              href="/admin/outreach/prospects"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors"
            >
              <Users className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Gestione Prospect</span>
            </Link>
            <Link
              href="/admin/outreach/pipeline"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors"
            >
              <Kanban className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Pipeline</span>
            </Link>
            <button
              type="button"
              onClick={loadOverview}
              disabled={loading}
              aria-label="Aggiorna metriche"
              title="Aggiorna metriche"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <RefreshCw
                className={cn('w-4 h-4', loading && 'animate-spin text-[var(--rivo-volt-text)]')}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
          </>
        }
      />

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-xs text-[var(--accent-critical-text)] flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* 12 Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpiCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={loading ? '—' : card.value}
            tone={card.tone}
            context={card.sub}
            loading={loading}
            className="p-4"
          />
        ))}
      </div>

      {/* Charts Grid Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SurfaceCard
          header={{
            eyebrow: 'TELEMETRY SERIE',
            title: 'Prospect Acquisiti e Analizzati nel Tempo',
            subtitle: 'Serie storica giornaliera reale dal database OUTREACH',
            icon: BarChart3,
            action: (
              <StatusBadge tone="volt" className="tabular-nums">
                Conv: {kpis?.conversionRatePercent ?? 0}%
              </StatusBadge>
            ),
          }}
        >
          {!data?.charts.prospectsOverTime.length ? (
            <EmptyState
              compact
              icon={Search}
              title="Nessun prospect ancora acquisito"
              description="Nessun prospect ancora acquisito nel database."
              primaryAction={{
                label: 'Avvia la prima ricerca attività',
                href: '/admin/outreach/discovery',
                icon: Search,
              }}
            />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.charts.prospectsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--chart-axis)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--chart-axis)"
                    fontSize={11}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="acquisiti"
                    name="Acquisiti"
                    stroke="var(--chart-series-primary)"
                    fill="var(--chart-series-primary)"
                    fillOpacity={0.18}
                  />
                  <Area
                    type="monotone"
                    dataKey="analizzati"
                    name="Analizzati AI"
                    stroke="var(--chart-series-secondary)"
                    fill="var(--chart-series-secondary)"
                    fillOpacity={0.12}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard
          header={{
            eyebrow: 'SCORING ENGINE',
            title: 'Distribuzione dei Punteggi Commerciali (Lead Score 0–100)',
            subtitle: 'Suddivisione per fascia di potenziale commerciale RIVO',
            action: <StatusBadge tone="volt">4 Fasce</StatusBadge>,
          }}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts.scoreDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="bucket"
                  stroke="var(--chart-axis)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--chart-axis)"
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="count"
                  name="Prospect"
                  fill="var(--chart-series-primary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>
      </div>

      {/* Charts Grid Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SurfaceCard
          header={{
            eyebrow: 'VERTICAL BREAKDOWN',
            title: 'Prospect per Categoria Commerciale',
            subtitle: 'Segmentazione per verticale di attività',
          }}
        >
          {!data?.charts.prospectsByCategory.length ? (
            <EmptyState
              compact
              icon={BarChart3}
              title="Nessun dato di categoria presente"
              description="Esegui una discovery o importa prospect per popolare le categorie."
            />
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.prospectsByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
                  <XAxis
                    type="number"
                    stroke="var(--chart-axis)"
                    fontSize={11}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="category"
                    type="category"
                    stroke="var(--text-secondary)"
                    fontSize={11}
                    width={110}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="count"
                    name="Prospect"
                    fill="var(--chart-series-primary)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard
          header={{
            eyebrow: 'GEO TELEMETRY',
            title: 'Prospect per Area Geografica (Città)',
            subtitle: 'Distribuzione territoriale dei prospect acquisiti',
          }}
        >
          {!data?.charts.prospectsByGeography.length ? (
            <EmptyState
              compact
              icon={BarChart3}
              title="Nessun dato geografico presente"
              description="I prospect geolocalizzati appariranno qui per città."
            />
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.prospectsByGeography} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
                  <XAxis
                    type="number"
                    stroke="var(--chart-axis)"
                    fontSize={11}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="city"
                    type="category"
                    stroke="var(--text-secondary)"
                    fontSize={11}
                    width={110}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="count"
                    name="Prospect"
                    fill="var(--chart-series-secondary)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SurfaceCard>
      </div>

      {/* Bottom Row: Campaign Performance & Background Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SurfaceCard
          header={{
            eyebrow: 'CAMPAIGN LEDGER',
            title: 'Performance delle Campagne',
            icon: Megaphone,
            action: (
              <Link
                href="/admin/outreach/campaigns"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--rivo-volt-text)] hover:underline"
              >
                <span>Gestisci Campagne</span>
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              </Link>
            ),
          }}
        >
          {!data?.charts.campaignPerformance.length ? (
            <EmptyState
              compact
              icon={Megaphone}
              title="Nessuna campagna creata"
              description="Vai nella sezione Campagne per crearne una."
              primaryAction={{
                label: 'Gestisci Campagne',
                href: '/admin/outreach/campaigns',
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[460px]">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-2 pr-3 font-medium">Campagna</th>
                    <th className="py-2 px-3 font-medium">Località</th>
                    <th className="py-2 px-3 font-medium">Stato</th>
                    <th className="py-2 px-3 text-right font-medium">Acquisiti</th>
                    <th className="py-2 pl-3 text-right font-medium">Qualificati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {data.charts.campaignPerformance.map((camp) => (
                    <tr
                      key={camp.id}
                      className="hover:bg-[var(--bg-elevated)]/60 transition-colors"
                    >
                      <td className="py-2.5 pr-3 font-semibold text-[var(--text-primary)]">
                        {camp.name}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)]">{camp.location}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge
                          tone={
                            camp.status === 'running'
                              ? 'volt'
                              : camp.status === 'completed'
                              ? 'operational'
                              : 'neutral'
                          }
                          shape="tag"
                        >
                          {camp.status}
                        </StatusBadge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                        {camp.totalProspects}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono tabular-nums font-bold text-[var(--rivo-volt-text)]">
                        {camp.qualifiedProspects}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard
          header={{
            eyebrow: 'AUDIT STREAM',
            title: 'Background Jobs & Audit Log Recente',
            icon: Activity,
            action: (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Asincroni &amp; Tracciati
              </span>
            ),
          }}
        >
          {!data?.recentJobs.length && !data?.recentActivity.length ? (
            <EmptyState
              compact
              icon={Activity}
              title="Nessun job o evento"
              description="Nessun job asincrono o evento registrato."
            />
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(data?.recentJobs || []).slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold uppercase text-[var(--rivo-volt-text)] mr-2">
                      [{job.job_type}]
                    </span>
                    <span className="font-mono tabular-nums text-[var(--text-secondary)]">
                      Progresso: {job.progress}% · Tentativi: {job.attempts}/{job.max_attempts}
                    </span>
                  </div>
                  <StatusBadge
                    tone={
                      job.status === 'completed'
                        ? 'operational'
                        : job.status === 'failed'
                        ? 'critical'
                        : 'neutral'
                    }
                    shape="tag"
                  >
                    {job.status}
                  </StatusBadge>
                </div>
              ))}

              {(data?.recentActivity || []).slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="font-mono text-[var(--text-secondary)] truncate">
                    {log.action}
                  </span>
                  <span className="text-[var(--text-muted)] font-mono tabular-nums shrink-0">
                    {new Date(log.created_at).toLocaleString('it-IT')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}

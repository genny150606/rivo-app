'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Radar,
  Search,
  Users,
  Cpu,
  MessageSquare,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Megaphone,
  Kanban,
  Activity,
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
  recentJobs: any[];
  recentActivity: any[];
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
    } catch (err: any) {
      setError(err?.message || 'Errore di connessione al database OUTREACH');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const kpis = data?.kpis;

  const kpiCards = [
    {
      label: 'Attività Individuate',
      value: kpis?.totalDiscovered ?? 0,
      sub: 'Acquisite da fonti tracciate',
    },
    {
      label: 'Attività Analizzate',
      value: kpis?.totalAnalyzed ?? 0,
      sub: 'Sottoposte a AI Intelligence',
    },
    {
      label: 'Prospect Qualificati',
      value: kpis?.qualifiedCount ?? 0,
      sub: 'Lead Score >= 40/100',
    },
    {
      label: 'Alto Potenziale',
      value: kpis?.highPotentialCount ?? 0,
      sub: `Di cui ${kpis?.priorityCount ?? 0} priorità (80-100)`,
      highlight: true,
    },
    {
      label: 'Messaggi Generati',
      value: kpis?.messagesGeneratedCount ?? 0,
      sub: 'Varianti A/B/C personalizzate',
    },
    {
      label: 'Comunicazioni Inviate',
      value: kpis?.messagesSentCount ?? 0,
      sub: 'Autorizzate da Compliance Gate',
    },
    {
      label: 'Risposte Ricevute',
      value: kpis?.repliesReceivedCount ?? 0,
      sub: `Tasso risposta: ${kpis?.responseRatePercent ?? 0}%`,
    },
    {
      label: 'Appuntamenti Fissati',
      value: kpis?.appointmentsBookedCount ?? 0,
      sub: 'Demo programmate in pipeline',
    },
    {
      label: 'Trattative Aperte',
      value: kpis?.openNegotiationsCount ?? 0,
      sub: 'In fase di offerta commerciale',
    },
    {
      label: 'Nuovi Clienti Acquisiti',
      value: kpis?.convertedClientsCount ?? 0,
      sub: 'Convertiti in Organizzazioni RIVO',
      highlight: true,
    },
    {
      label: 'Conversion Rate',
      value: `${kpis?.conversionRatePercent ?? 0}%`,
      sub: 'Da prospect individuato a cliente',
    },
    {
      label: 'Costo Medio Acquisizione',
      value: kpis?.cacEur !== null && kpis?.cacEur !== undefined ? `€${kpis.cacEur}` : 'N/D',
      sub:
        kpis?.cacEur !== null && kpis?.cacEur !== undefined
          ? 'Calcolato su budget mensile'
          : 'Configura budget in Impostazioni',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#27272A] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.15em] text-[#BFFF00] mb-1">
            <Radar className="w-3.5 h-3.5" />
            <span>RIVO OUTREACH — BUSINESS INTELLIGENCE & SALES ACQUISITION</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Overview Commerciale
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Metriche reali di acquisizione, qualificazione AI, comunicazioni conformi e conversioni in clienti RIVO.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/outreach/discovery"
            className="bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-xs px-3.5 py-2 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Ricerca Attività</span>
          </Link>
          <Link
            href="/admin/outreach/prospects"
            className="bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] font-medium text-xs px-3.5 py-2 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gestione Prospect</span>
          </Link>
          <Link
            href="/admin/outreach/pipeline"
            className="bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] font-medium text-xs px-3.5 py-2 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Pipeline</span>
          </Link>
          <button
            type="button"
            onClick={loadOverview}
            disabled={loading}
            className="p-2 rounded-md bg-[#121214] border border-[#27272A] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Aggiorna metriche"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#BFFF00]' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-950/30 border border-red-500/40 text-xs text-red-200 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 12 Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`p-4 rounded-md border flex flex-col justify-between ${
              card.highlight
                ? 'bg-[#121214] border-[#BFFF00]/50'
                : 'bg-[#121214] border-[#27272A]'
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              {card.label}
            </span>
            <div
              className={`text-2xl font-bold tracking-tight my-1.5 ${
                card.highlight ? 'text-[#BFFF00]' : 'text-white'
              }`}
            >
              {loading ? '—' : card.value}
            </div>
            <span className="text-[11px] text-zinc-500 leading-tight">{card.sub}</span>
          </div>
        ))}
      </div>

      {/* Charts Grid Row 1: Prospects Over Time & Lead Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Prospect acquisiti nel tempo */}
        <div className="p-5 rounded-md bg-[#121214] border border-[#27272A]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Prospect Acquisiti e Analizzati nel Tempo
              </h2>
              <p className="text-xs text-zinc-500">
                 Serie storica giornaliera reale dal database OUTREACH
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase text-zinc-400">
              Tasso Conversione: {kpis?.conversionRatePercent ?? 0}%
            </span>
          </div>

          {!data?.charts.prospectsOverTime.length ? (
            <div className="h-56 flex flex-col items-center justify-center border border-dashed border-[#27272A] text-xs text-zinc-500 gap-2">
              <span>Nessun prospect ancora acquisito nel database.</span>
              <Link
                href="/admin/outreach/discovery"
                className="text-[#BFFF00] hover:underline font-mono uppercase text-[11px]"
              >
                Avvia la prima ricerca attività →
              </Link>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.charts.prospectsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis dataKey="date" stroke="#71717A" fontSize={11} />
                  <YAxis stroke="#71717A" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090B',
                      borderColor: '#27272A',
                      fontSize: '12px',
                      color: '#FFFFFF',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="acquisiti"
                    name="Acquisiti"
                    stroke="#BFFF00"
                    fill="#BFFF00"
                    fillOpacity={0.18}
                  />
                  <Area
                    type="monotone"
                    dataKey="analizzati"
                    name="Analizzati AI"
                    stroke="#FFFFFF"
                    fill="#FFFFFF"
                    fillOpacity={0.08}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Distribuzione dei punteggi commerciali */}
        <div className="p-5 rounded-md bg-[#121214] border border-[#27272A]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Distribuzione dei Punteggi Commerciali (Lead Score 0–100)
              </h2>
              <p className="text-xs text-zinc-500">
                Suddivisione per fascia di potenziale commerciale RIVO
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase text-[#BFFF00]">
              4 Fasce
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts.scoreDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="bucket" stroke="#71717A" fontSize={11} />
                <YAxis stroke="#71717A" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090B',
                    borderColor: '#27272A',
                    fontSize: '12px',
                    color: '#FFFFFF',
                  }}
                />
                <Bar dataKey="count" name="Prospect" fill="#BFFF00" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2: By Category & By Geography */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Prospect per categoria */}
        <div className="p-5 rounded-md bg-[#121214] border border-[#27272A]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Prospect per Categoria Commerciale
              </h2>
              <p className="text-xs text-zinc-500">
                Segmentazione per verticale di attività
              </p>
            </div>
          </div>

          {!data?.charts.prospectsByCategory.length ? (
            <div className="h-48 flex items-center justify-center border border-dashed border-[#27272A] text-xs text-zinc-500">
              Nessun dato di categoria presente
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.prospectsByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis type="number" stroke="#71717A" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="category" type="category" stroke="#A1A1AA" fontSize={11} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090B',
                      borderColor: '#27272A',
                      fontSize: '12px',
                      color: '#FFFFFF',
                    }}
                  />
                  <Bar dataKey="count" name="Prospect" fill="#BFFF00" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Prospect per area geografica */}
        <div className="p-5 rounded-md bg-[#121214] border border-[#27272A]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Prospect per Area Geografica (Città)
              </h2>
              <p className="text-xs text-zinc-500">
                Distribuzione territoriale dei prospect acquisiti
              </p>
            </div>
          </div>

          {!data?.charts.prospectsByGeography.length ? (
            <div className="h-48 flex items-center justify-center border border-dashed border-[#27272A] text-xs text-zinc-500">
              Nessun dato geografico presente
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.prospectsByGeography} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis type="number" stroke="#71717A" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="city" type="category" stroke="#A1A1AA" fontSize={11} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090B',
                      borderColor: '#27272A',
                      fontSize: '12px',
                      color: '#FFFFFF',
                    }}
                  />
                  <Bar dataKey="count" name="Prospect" fill="#FFFFFF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Campaign Performance & Background Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance delle Campagne */}
        <div className="p-5 rounded-md bg-[#121214] border border-[#27272A]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#BFFF00]" />
              <h2 className="text-sm font-semibold text-white">
                Performance delle Campagne
              </h2>
            </div>
            <Link
              href="/admin/outreach/campaigns"
              className="text-xs text-[#BFFF00] hover:underline flex items-center gap-1"
            >
              <span>Gestisci Campagne</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!data?.charts.campaignPerformance.length ? (
            <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-[#27272A]">
              Nessuna campagna creata. Vai nella sezione Campagne per crearne una.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#27272A] text-zinc-400 font-mono uppercase text-[10px]">
                    <th className="py-2 pr-3">Campagna</th>
                    <th className="py-2 px-3">Località</th>
                    <th className="py-2 px-3">Stato</th>
                    <th className="py-2 px-3 text-right">Acquisiti</th>
                    <th className="py-2 pl-3 text-right">Qualificati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]">
                  {data.charts.campaignPerformance.map((camp) => (
                    <tr key={camp.id} className="hover:bg-[#18181B]/60">
                      <td className="py-2.5 pr-3 font-medium text-white">{camp.name}</td>
                      <td className="py-2.5 px-3 text-zinc-400">{camp.location}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[#18181B] border border-[#27272A] text-zinc-300">
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                        {camp.totalProspects}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono font-bold text-[#BFFF00]">
                        {camp.qualifiedProspects}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Background Jobs & Audit Trail */}
        <div className="p-5 rounded-md bg-[#121214] border border-[#27272A]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#BFFF00]" />
              <h2 className="text-sm font-semibold text-white">
                Background Jobs & Audit Log Recente
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase text-zinc-500">
              Asincroni & Tracciati
            </span>
          </div>

          {!data?.recentJobs.length && !data?.recentActivity.length ? (
            <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-[#27272A]">
              Nessun job asincrono o evento registrato.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(data?.recentJobs || []).slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="p-2.5 rounded bg-[#09090B] border border-[#27272A] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold uppercase text-[#BFFF00] mr-2">
                      [{job.job_type}]
                    </span>
                    <span className="text-zinc-300">
                      Progresso: {job.progress}% • Tentativi: {job.attempts}/{job.max_attempts}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono uppercase ${
                      job.status === 'completed'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        : job.status === 'failed'
                        ? 'bg-red-950/60 text-red-400 border border-red-500/30'
                        : 'bg-zinc-900 text-zinc-300 border border-[#27272A]'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              ))}

              {(data?.recentActivity || []).slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded bg-[#18181B]/40 border border-[#27272A]/60 flex items-center justify-between text-[11px]"
                >
                  <span className="font-mono text-zinc-300">{log.action}</span>
                  <span className="text-zinc-500 font-mono">
                    {new Date(log.created_at).toLocaleString('it-IT')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

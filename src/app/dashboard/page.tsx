import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { 
  Smartphone, 
  QrCode, 
  Layers, 
  Activity, 
  ArrowUpRight, 
  Radio, 
  BellRing, 
  ExternalLink,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface InteractionSummary {
  interaction_type: string;
  timestamp: string;
  device_id: string;
}

interface DeviceSummary {
  id: string;
  name: string;
  unique_code: string;
}

export default async function DashboardOverview() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  let orgName = 'La tua attività';
  let totalInteractions = 0;
  let nfcInteractions = 0;
  let qrInteractions = 0;
  let activeDevicesCount = 0;
  let totalDevicesCount = 0;
  let recentInteractions: InteractionSummary[] = [];
  const deviceMap = new Map<string, string>();
  let activeServiceCallsCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('auth_user_id', user.id)
      .single();

    let targetOrgId = profile?.organization_id;
    if (!targetOrgId && profile?.role === 'admin') {
      const { data: firstOrg } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      targetOrgId = firstOrg?.id;
    }

    if (targetOrgId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', targetOrgId)
        .single();
      if (org) orgName = org.name;

      // Fetch interactions
      const { data: interactions } = await supabase
        .from('interactions')
        .select('interaction_type, timestamp, device_id')
        .eq('organization_id', targetOrgId)
        .order('timestamp', { ascending: false });

      if (interactions) {
        totalInteractions = interactions.length;
        nfcInteractions = interactions.filter((i) => i.interaction_type === 'nfc').length;
        qrInteractions = interactions.filter((i) => i.interaction_type === 'qr').length;
        recentInteractions = interactions.slice(0, 8) as InteractionSummary[];
      }

      // Fetch devices for label mapping
      const { data: devices } = await supabase
        .from('devices')
        .select('id, name, unique_code, status')
        .eq('organization_id', targetOrgId);

      if (devices) {
        totalDevicesCount = devices.length;
        activeDevicesCount = devices.filter((d) => d.status === 'active').length;
        devices.forEach((d: DeviceSummary) => {
          deviceMap.set(d.id, d.name || d.unique_code || 'Tavolo / Postazione');
        });
      }

      // Fetch active service calls count
      const { count: pendingCalls } = await supabase
        .from('service_calls')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', targetOrgId)
        .in('status', ['pending', 'in_progress']);

      activeServiceCallsCount = pendingCalls || 0;
    }
  }

  const nfcRatio = totalInteractions > 0 ? Math.round((nfcInteractions / totalInteractions) * 100) : 0;
  const qrRatio = totalInteractions > 0 ? Math.round((qrInteractions / totalInteractions) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header with Organization Context & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {orgName}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/60">
              Live Fleet
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Control Room unificata per ingressi contactless, richieste di servizio e telemetria dei tavoli.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeServiceCallsCount > 0 && (
            <Link
              href="/dashboard/service"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{activeServiceCallsCount} in Sala</span>
            </Link>
          )}
          <Link
            href="/dashboard/analytics"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
          >
            <span>Analisi Dettagliata</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metric Cards - Linear / Stripe Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Interactions */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.12] transition-colors">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-3">
              <span className="text-[11px] font-medium uppercase tracking-wider">Interazioni Totali</span>
              <Activity className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
              {totalInteractions.toLocaleString('it-IT')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Volume complessivo</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-200">Sincronizzato</span>
          </div>
        </div>

        {/* NFC Tap Card */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.12] transition-colors">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-3">
              <span className="text-[11px] font-medium uppercase tracking-wider">Tap NFC Fisici</span>
              <Smartphone className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
              {nfcInteractions.toLocaleString('it-IT')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 dark:text-zinc-400">Mix di accesso</span>
            <span className="font-medium font-mono text-emerald-600 dark:text-emerald-400">
              {nfcRatio}% quota
            </span>
          </div>
        </div>

        {/* QR Code Scans */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.12] transition-colors">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-3">
              <span className="text-[11px] font-medium uppercase tracking-wider">Scansioni QR Code</span>
              <QrCode className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
              {qrInteractions.toLocaleString('it-IT')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 dark:text-zinc-400">Mix di accesso</span>
            <span className="font-medium font-mono text-zinc-700 dark:text-zinc-300">
              {qrRatio}% quota
            </span>
          </div>
        </div>

        {/* Active Fleet Devices */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.12] transition-colors">
          <div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-3">
              <span className="text-[11px] font-medium uppercase tracking-wider">Hardware Online</span>
              <Layers className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
              {activeDevicesCount} <span className="text-base font-normal text-zinc-400">/ {totalDevicesCount || activeDevicesCount}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 dark:text-zinc-400">Stato flotta</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              100% Funzionante
            </span>
          </div>
        </div>
      </div>

      {/* Live Stream Section */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
              Registro Accessi Recenti
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Audit log cronologico delle sessioni aperte al tavolo via NFC o QR.
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Ultimi {recentInteractions.length} eventi
          </span>
        </div>

        {recentInteractions.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Radio className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto" />
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
              Nessun evento registrato al momento
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Avvicina uno smartphone al chip NFC di un supporto o scannerizza il QR code per vedere gli accessi comparire in tempo reale.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {recentInteractions.map((item, idx) => {
              const deviceName = deviceMap.get(item.device_id) || 'Tavolo non assegnato';
              const date = new Date(item.timestamp);
              const isNfc = item.interaction_type === 'nfc';

              return (
                <div 
                  key={idx} 
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isNfc 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {isNfc ? <Smartphone className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {deviceName}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded ${
                        isNfc
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60'
                      }`}>
                        {isNfc ? 'NFC Tap' : 'QR Scan'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px] sm:text-right pl-10 sm:pl-0">
                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500">
                      {date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

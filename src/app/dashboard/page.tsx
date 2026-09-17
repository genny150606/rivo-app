import { createClient } from '@/lib/supabase/server';
import { ArrowUpRight, Smartphone, QrCode, Layers, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface InteractionSummary {
  interaction_type: string;
  timestamp: string;
  device_id: string;
}

export default async function DashboardOverview() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  let orgName = 'La tua attività';
  let totalInteractions = 0;
  let nfcInteractions = 0;
  let qrInteractions = 0;
  let activeDevicesCount = 0;
  let recentInteractions: InteractionSummary[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profile?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', profile.organization_id)
        .single();
      if (org) orgName = org.name;

      const { data: interactions } = await supabase
        .from('interactions')
        .select('interaction_type, timestamp, device_id')
        .eq('organization_id', profile.organization_id)
        .order('timestamp', { ascending: false });

      if (interactions) {
        totalInteractions = interactions.length;
        nfcInteractions = interactions.filter((i) => i.interaction_type === 'nfc').length;
        qrInteractions = interactions.filter((i) => i.interaction_type === 'qr').length;
        recentInteractions = interactions.slice(0, 5) as InteractionSummary[];
      }

      const { count } = await supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active');
      activeDevicesCount = count || 0;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">
          {orgName}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Panoramica delle prestazioni e interazioni NFC/QR registrate in tempo reale.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-[#27272A] shadow-xs relative overflow-hidden flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider truncate">Interazioni Totali</span>
              <Activity className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{totalInteractions}</div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-[#BFFF00]">
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Dati reali dal DB</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-[#27272A] shadow-xs relative overflow-hidden flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider truncate">Tap NFC</span>
              <Smartphone className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{nfcInteractions}</div>
          </div>
          <div className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
            {totalInteractions > 0 ? Math.round((nfcInteractions / totalInteractions) * 100) : 0}% del totale
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-[#27272A] shadow-xs relative overflow-hidden flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider truncate">Scansioni QR</span>
              <QrCode className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{qrInteractions}</div>
          </div>
          <div className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
            {totalInteractions > 0 ? Math.round((qrInteractions / totalInteractions) * 100) : 0}% del totale
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-[#27272A] shadow-xs relative overflow-hidden flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider truncate">Dispositivi Attivi</span>
              <Layers className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{activeDevicesCount}</div>
          </div>
          <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">
            Pienamente operativi
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-[#27272A] p-4 sm:p-6 shadow-xs transition-colors">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-4">Ultime Interazioni Registrate</h2>
        {recentInteractions.length === 0 ? (
          <div className="text-sm text-zinc-500 dark:text-zinc-400 py-6 text-center">
            Nessuna interazione ancora registrata. Avvicina uno smartphone al chip NFC o inquadra il QR per vedere il dato comparire istantaneamente.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-[#27272A]">
            {recentInteractions.map((item, idx) => (
              <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded uppercase shrink-0 ${
                    item.interaction_type === 'nfc'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:bg-[#BFFF00]/10 dark:text-[#BFFF00]'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}>
                    {item.interaction_type}
                  </span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium">Nuovo accesso registrato</span>
                </div>
                <span className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-right pl-7 sm:pl-0 font-mono">
                  {new Date(item.timestamp).toLocaleString('it-IT')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

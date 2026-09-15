import { createClient } from '@/lib/supabase/server';
import { Building2, Layers, Activity, PlusCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Aggregate statistics across RIVO network
  const [
    { count: totalOrgs },
    { count: totalDevices },
    { count: totalInteractions },
    { data: recentOrgs }
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('devices').select('*', { count: 'exact', head: true }),
    supabase.from('interactions').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('id, name, slug, status, created_at').order('created_at', { ascending: false }).limit(5)
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">RIVO Command Center</h1>
          <p className="text-sm text-zinc-400">
            Monitoraggio globale delle attività clienti, dispositivi hardware e traffico NFC/QR.
          </p>
        </div>
        <Link
          href="/admin/organizations/new"
          className="bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-sm min-h-[44px] px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-press shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuova Organizzazione</span>
        </Link>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 lg:p-6 rounded-xl bg-[#121214] border border-[#27272A] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider truncate">Aziende Clienti</span>
              <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{totalOrgs || 0}</div>
          </div>
          <p className="text-xs text-zinc-500 mt-2 truncate">Registrate nella piattaforma</p>
        </div>

        <div className="p-4 sm:p-5 lg:p-6 rounded-xl bg-[#121214] border border-[#27272A] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider truncate">Dispositivi Distribuiti</span>
              <Layers className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{totalDevices || 0}</div>
          </div>
          <p className="text-xs text-zinc-500 mt-2 truncate">NFC / QR attivi e tracciati</p>
        </div>

        <div className="p-4 sm:p-5 lg:p-6 rounded-xl bg-[#121214] border border-[#27272A] sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider truncate">Traffico Complessivo</span>
              <Activity className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{totalInteractions || 0}</div>
          </div>
          <p className="text-xs text-zinc-500 mt-2 truncate">Interazioni reali registrate</p>
        </div>
      </div>

      {/* Recent Organizations */}
      <div className="rounded-xl border border-[#27272A] bg-[#121214] p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Ultime Aziende Attivate</h2>
          <Link
            href="/admin/organizations"
            className="text-xs text-[#BFFF00] hover:underline flex items-center gap-1 min-h-[44px] px-2"
          >
            Tutte <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {(!recentOrgs || recentOrgs.length === 0) ? (
          <div className="text-sm text-zinc-500 py-6 text-center">
            Nessuna azienda creata. Inizia creando la prima organizzazione (es. &quot;Bar Centrale&quot;).
          </div>
        ) : (
          <div className="divide-y divide-[#27272A]">
            {recentOrgs.map((org) => (
              <Link
                key={org.id}
                href={`/admin/organizations/${org.id}`}
                className="py-3.5 px-2 -mx-2 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm hover:bg-[#18181B]/50 transition-colors touch-press min-h-[44px]"
              >
                <div>
                  <div className="font-medium text-white">{org.name}</div>
                  <div className="text-xs text-zinc-500">slug: {org.slug}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/10 text-emerald-400">
                    {org.status}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(org.created_at).toLocaleDateString('it-IT')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

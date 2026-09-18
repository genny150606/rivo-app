'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, 
  Download, 
  Search, 
  Wifi, 
  Gift, 
  Award, 
  Mail, 
  Phone, 
  Calendar, 
  RefreshCw 
} from 'lucide-react';

interface LeadItem {
  id: string;
  name: string | null;
  contact: string;
  source: 'wifi' | 'wheel' | 'loyalty';
  created_at: string;
}

export default function LeadsDashboardPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      if (!targetOrgId) {
        setLoading(false);
        return;
      }

      setOrgId(targetOrgId);

      const res = await fetch(`/api/leads?organization_id=${targetOrgId}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleExportCsv = () => {
    if (leads.length === 0) return;

    const headers = ['Nome', 'Contatto', 'Canale Origine', 'Data Registrazione'];
    const rows = leads.map((l) => [
      `"${l.name || 'Anonimo'}"`,
      `"${l.contact}"`,
      `"${l.source}"`,
      `"${new Date(l.created_at).toLocaleString('it-IT')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rivo_clienti_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((l) =>
    (l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    l.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const wifiCount = leads.filter((l) => l.source === 'wifi').length;
  const wheelCount = leads.filter((l) => l.source === 'wheel').length;
  const loyaltyCount = leads.filter((l) => l.source === 'loyalty').length;

  const sourceConfig: Record<string, { label: string; icon: typeof Wifi; color: string }> = {
    wifi: { label: 'Wi-Fi Guest', icon: Wifi, color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/40' },
    wheel: { label: 'Ruota Premi', icon: Gift, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40' },
    loyalty: { label: 'Fidelity Pass', icon: Award, color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/40' },
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/4 animate-pulse" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/3 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-400" />
            <span>CRM &amp; Contatti Raccolti</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Database clienti profilati tramite Wi-Fi, Ruota della Fortuna e Tessere Fedeltà al tavolo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={leads.length === 0}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold text-xs flex items-center gap-2 transition-all shadow-xs touch-press active:scale-[0.98] disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Esporta CSV</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            title="Aggiorna lista"
            className="p-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Totale Contatti</span>
          <div className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight font-mono">{leads.length}</div>
          <span className="text-[11px] text-zinc-400 mt-1 block">Lead profilati nel DB</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Da Wi-Fi Guest</span>
          <div className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight font-mono">{wifiCount}</div>
          <span className="text-[11px] text-zinc-400 mt-1 block">Accessi a internet</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Da Ruota Premi</span>
          <div className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight font-mono">{wheelCount}</div>
          <span className="text-[11px] text-zinc-400 mt-1 block">Gamification al tavolo</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] shadow-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">Da Tessera Punti</span>
          <div className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight font-mono">{loyaltyCount}</div>
          <span className="text-[11px] text-zinc-400 mt-1 block">Wallet &amp; Fidelizzazione</span>
        </div>
      </div>

      {/* Search & Leads Table */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.07] bg-white dark:bg-zinc-900/50 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Registro Lead ({filteredLeads.length})</h2>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca nome o recapito..."
              className="w-full min-h-[36px] bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
            />
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500">
            Nessun contatto trovato. Quando i clienti useranno il Wi-Fi o la Ruota al tavolo, i loro dati compariranno qui.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {filteredLeads.map((item) => {
              const config = sourceConfig[item.source] || sourceConfig.wifi;
              const Icon = config.icon;

              return (
                <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-semibold text-zinc-700 dark:text-zinc-300 shrink-0 text-xs">
                      {item.name ? item.name.charAt(0).toUpperCase() : 'O'}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 block">
                        {item.name || 'Ospite Riservato'}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5">
                        {item.contact.includes('@') ? <Mail className="w-3 h-3 text-zinc-400" /> : <Phone className="w-3 h-3 text-zinc-400" />}
                        <span>{item.contact}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${config.color}`}>
                      <Icon className="w-3 h-3" />
                      <span>{config.label}</span>
                    </span>

                    <span className="text-zinc-400 font-mono text-[11px]">
                      {new Date(item.created_at).toLocaleString('it-IT')}
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

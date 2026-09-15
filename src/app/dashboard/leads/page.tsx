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
    wifi: { label: 'Wi-Fi Guest', icon: Wifi, color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    wheel: { label: 'Ruota Premi', icon: Gift, color: 'bg-[#BFFF00]/10 text-[#BFFF00] border-[#BFFF00]/30' },
    loyalty: { label: 'Fidelity Pass', icon: Award, color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl">
        <div className="h-8 bg-zinc-800 rounded w-1/4" />
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#121214] border border-[#27272A] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#BFFF00]" />
            <span>CRM & Contatti Raccolti</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Database clienti profilati tramite Wi-Fi, Ruota della Fortuna e Tessere Fedeltà al tavolo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={leads.length === 0}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-[#BFFF00]/20 touch-press disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Esporta CSV</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">Totale Contatti</span>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{leads.length}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Lead proprietari salvati</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">Da Wi-Fi Guest</span>
          <div className="text-2xl sm:text-3xl font-bold text-blue-400 tracking-tight">{wifiCount}</div>
          <span className="text-[11px] text-blue-400 mt-1 block">Accessi a internet</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">Da Ruota Premi</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#BFFF00] tracking-tight">{wheelCount}</div>
          <span className="text-[11px] text-[#BFFF00] mt-1 block">Voucher gamification</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">Da Tessera Punti</span>
          <div className="text-2xl sm:text-3xl font-bold text-purple-400 tracking-tight">{loyaltyCount}</div>
          <span className="text-[11px] text-purple-400 mt-1 block">Clienti fidelizzati</span>
        </div>
      </div>

      {/* Search & Leads Table */}
      <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">Registro Contatti ({filteredLeads.length})</h2>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca nome o numero..."
              className="w-full min-h-[38px] bg-[#18181B] border border-[#27272A] rounded-xl pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#BFFF00]"
            />
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            Nessun contatto trovato. Quando i clienti useranno il Wi-Fi o la Ruota al tavolo, i loro dati compariranno qui.
          </div>
        ) : (
          <div className="divide-y divide-[#27272A]">
            {filteredLeads.map((item) => {
              const config = sourceConfig[item.source] || sourceConfig.wifi;
              const Icon = config.icon;

              return (
                <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white shrink-0">
                      {item.name ? item.name.charAt(0).toUpperCase() : 'O'}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        {item.name || 'Ospite Riservato'}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                        {item.contact.includes('@') ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                        <span>{item.contact}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${config.color}`}>
                      <Icon className="w-3 h-3" />
                      <span>{config.label}</span>
                    </span>

                    <span className="text-zinc-500 text-[11px]">
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

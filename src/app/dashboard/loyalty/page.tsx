'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Award, 
  CheckCircle2, 
  Plus, 
  RotateCcw, 
  Users, 
  Gift, 
  Search, 
  Save, 
  RefreshCw 
} from 'lucide-react';

interface LoyaltyCardItem {
  id: string;
  customer_contact: string;
  customer_name: string | null;
  stamps_count: number;
  max_stamps: number;
  updated_at: string;
}

export default function LoyaltyDashboardPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [cards, setCards] = useState<LoyaltyCardItem[]>([]);
  const [rewardText, setRewardText] = useState('Caffè o Dessert omaggio con 10 timbri');
  const [savingReward, setSavingReward] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Quick Stamp Form
  const [stampPhone, setStampPhone] = useState('');
  const [stampName, setStampName] = useState('');
  const [stamping, setStamping] = useState(false);
  const [stampMsg, setStampMsg] = useState<string | null>(null);

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

      // Fetch org reward text
      const { data: org } = await supabase
        .from('organizations')
        .select('loyalty_reward_text')
        .eq('id', targetOrgId)
        .single();

      if (org?.loyalty_reward_text) {
        setRewardText(org.loyalty_reward_text);
      }

      // Fetch cards
      const res = await fetch(`/api/loyalty?organization_id=${targetOrgId}`);
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleQuickStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !stampPhone.trim()) return;

    setStamping(true);
    setStampMsg(null);

    try {
      const res = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: orgId,
          customer_contact: stampPhone.trim(),
          customer_name: stampName.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.card) {
        setStampMsg(`Timbro aggiunto a ${stampPhone}! Totale: ${data.card.stamps_count}/${data.card.max_stamps}`);
        setStampPhone('');
        setStampName('');
        loadData();
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setStamping(false);
    }
  };

  const handleResetReward = async (cardId: string) => {
    try {
      const res = await fetch('/api/loyalty', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: cardId, action: 'reset' }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveRewardConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    setSavingReward(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ loyalty_reward_text: rewardText.trim() })
        .eq('id', orgId);

      if (!error) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingReward(false);
    }
  };

  const totalMembers = cards.length;
  const readyForReward = cards.filter((c) => c.stamps_count >= c.max_stamps).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl">
        <div className="h-8 bg-zinc-800 rounded w-1/4" />
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
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
            <Award className="w-6 h-6 text-[#BFFF00]" />
            <span>Tessera Fedeltà Digitale</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Gestisci i timbri dei clienti abituali e definisci i premi fedeltà della tua attività.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-400 hover:text-white transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 2 Column Actions: Quick Stamp + Reward Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Stamp */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#BFFF00]" />
            <h2 className="text-sm font-bold text-white">Timbratura Rapida alla Cassa</h2>
          </div>

          <form onSubmit={handleQuickStamp} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Numero di Telefono Cliente <span className="text-[#BFFF00]">*</span>
              </label>
              <input
                type="tel"
                required
                value={stampPhone}
                onChange={(e) => setStampPhone(e.target.value)}
                placeholder="+39 340 1234567"
                className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Nome Cliente (opzionale)</label>
              <input
                type="text"
                value={stampName}
                onChange={(e) => setStampName(e.target.value)}
                placeholder="Mario Rossi"
                className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <button
              type="submit"
              disabled={stamping}
              className="w-full min-h-[44px] bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 touch-press shadow-md shadow-[#BFFF00]/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{stamping ? 'Registrazione...' : 'Aggiungi Timbro al Cliente'}</span>
            </button>
          </form>

          {stampMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{stampMsg}</span>
            </div>
          )}
        </div>

        {/* Reward Settings */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#BFFF00]" />
            <h2 className="text-sm font-bold text-white">Configura Premio Fedeltà</h2>
          </div>

          <form onSubmit={handleSaveRewardConfig} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Descrizione Premio (sbloccato dopo 10 timbri)
              </label>
              <input
                type="text"
                required
                value={rewardText}
                onChange={(e) => setRewardText(e.target.value)}
                placeholder="Es. Caffè e cornetto omaggio, o 10€ di sconto"
                className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Questo messaggio comparirà nella tessera digitale visibile sullo smartphone dei tuoi clienti.
            </p>

            <button
              type="submit"
              disabled={savingReward}
              className="w-full min-h-[44px] bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700 touch-press disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingReward ? 'Salvataggio...' : 'Salva Regole Premio'}</span>
            </button>
          </form>

          {savedSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Premio salvato correttamente!</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">Membri Fidelity</span>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{totalMembers}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Tessere digitali attive</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">Pronti per il Premio</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#BFFF00] tracking-tight">{readyForReward}</div>
          <span className="text-[11px] text-[#BFFF00] mt-1 block">Con 10 timbri completati</span>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">Clienti con Tessera Attiva ({cards.length})</h2>

        {cards.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            Nessun cliente registrato ancora. Aggiungi il primo timbro usando il form in alto o fai scansionare il chip NFC ai clienti al tavolo.
          </div>
        ) : (
          <div className="divide-y divide-[#27272A]">
            {cards.map((c) => {
              const hasReachedReward = c.stamps_count >= c.max_stamps;
              return (
                <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-white shrink-0">
                      {c.stamps_count}/{c.max_stamps}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        {c.customer_name || 'Cliente'}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {c.customer_contact}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {hasReachedReward ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#BFFF00] text-black animate-pulse inline-flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-black" />
                          <span>PREMIO DISPONIBILE</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleResetReward(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors touch-press"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Eroga & Resetta</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-[11px]">
                        Mancano {c.max_stamps - c.stamps_count} timbri al premio
                      </span>
                    )}
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

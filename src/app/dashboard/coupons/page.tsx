'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Ticket, 
  Gift, 
  CheckCircle2, 
  Clock, 
  Search, 
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface CouponItem {
  id: string;
  code: string;
  reward: string;
  customer_name: string | null;
  customer_contact: string;
  status: 'active' | 'redeemed' | 'expired';
  expires_at: string;
  created_at: string;
}

export default function CouponsDashboardPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  
  // Redeem input
  const [inputCode, setInputCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

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

      const res = await fetch(`/api/coupons?organization_id=${targetOrgId}`);
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (e) {
      console.error('Error loading coupons:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !inputCode.trim()) return;

    setRedeeming(true);
    setRedeemSuccess(null);
    setRedeemError(null);

    try {
      const res = await fetch('/api/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: inputCode.trim(),
          organization_id: orgId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore convalida');
      }

      setRedeemSuccess(`Coupon ${inputCode.toUpperCase()} riscattato con successo! Premio: ${data.reward}`);
      setInputCode('');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore';
      setRedeemError(msg);
    } finally {
      setRedeeming(false);
    }
  };

  const totalCoupons = coupons.length;
  const redeemedCoupons = coupons.filter((c) => c.status === 'redeemed').length;
  const conversionRate = totalCoupons > 0 ? Math.round((redeemedCoupons / totalCoupons) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl">
        <div className="h-8 bg-zinc-800 rounded w-1/4" />
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
            <Gift className="w-6 h-6 text-[#BFFF00]" />
            <span>Ruota della Fortuna & Coupon</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Valida e riscatta i voucher vinti dai clienti al tavolo per incentivare le visite di ritorno.
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

      {/* QUICK REDEEM FORM */}
      <div className="rounded-2xl border border-[#BFFF00]/30 bg-gradient-to-r from-[#121214] via-[#151a10] to-[#121214] p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-[#BFFF00]" />
          <h2 className="text-base font-bold text-white">Convalida Rapida Coupon in Cassa</h2>
        </div>

        <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Inserisci codice (es. RIVO-AB12CD)"
            className="flex-1 min-h-[46px] bg-[#18181B] border border-[#27272A] rounded-xl px-4 text-sm text-white uppercase font-mono tracking-wider focus:outline-none focus:border-[#BFFF00]"
          />
          <button
            type="submit"
            disabled={redeeming}
            className="min-h-[46px] px-6 py-2.5 bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-sm rounded-xl transition-all shadow-md shadow-[#BFFF00]/20 flex items-center justify-center gap-2 touch-press disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{redeeming ? 'Verifica in corso...' : 'Valida & Riscatta'}</span>
          </button>
        </form>

        {redeemSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{redeemSuccess}</span>
          </div>
        )}

        {redeemError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{redeemError}</span>
          </div>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">Coupon Vinti</span>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{totalCoupons}</div>
          <span className="text-[11px] text-zinc-500 mt-1 block">Generati dalla ruota</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">Coupon Riscattati</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#BFFF00] tracking-tight">{redeemedCoupons}</div>
          <span className="text-[11px] text-[#BFFF00] mt-1 block">Clienti tornati al locale</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">Tasso di Ritorno</span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">{conversionRate}%</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Ritorno effettivo</span>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">Registro Coupon Emessi ({coupons.length})</h2>

        {coupons.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            Nessun coupon ancora generato. I tuoi clienti potranno girare la ruota al tavolo per sbloccare sconti di ritorno.
          </div>
        ) : (
          <div className="divide-y divide-[#27272A]">
            {coupons.map((c) => {
              const isExpired = new Date(c.expires_at).getTime() < Date.now();
              return (
                <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[#BFFF00] bg-black px-2 py-1 rounded border border-zinc-800 text-xs">
                      {c.code}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-white block">{c.reward}</span>
                      <span className="text-[11px] text-zinc-400">
                        {c.customer_name || 'Ospite'} • {c.customer_contact}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 text-[11px]">
                      Scadenza: {new Date(c.expires_at).toLocaleDateString('it-IT')}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      c.status === 'redeemed'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isExpired
                        ? 'bg-zinc-800 text-zinc-500'
                        : 'bg-[#BFFF00]/15 text-[#BFFF00] border border-[#BFFF00]/30'
                    }`}>
                      {c.status === 'redeemed' ? 'Riscattato' : isExpired ? 'Scaduto' : 'Attivo'}
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

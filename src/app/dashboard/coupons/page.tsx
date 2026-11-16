'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Ticket,
  Gift,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  StatusBadge,
  SurfaceCard,
} from '@/components/ui';

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

  const [renderNowTs, setRenderNowTs] = useState<number>(() => Date.now());

  const fetchCouponsForOrg = useCallback(async (targetOrgId: string) => {
    const res = await fetch(`/api/coupons?organization_id=${targetOrgId}`);
    if (res.ok) {
      const data = await res.json();
      setCoupons(data.coupons || []);
      setRenderNowTs(Date.now());
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

      if (!targetOrgId) return;

      setOrgId(targetOrgId);
      await fetchCouponsForOrg(targetOrgId);
    } catch (e) {
      console.error('Error loading coupons:', e);
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchCouponsForOrg]);

  useEffect(() => {
    let active = true;
    async function initCoupons() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !active) return;

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

        if (!targetOrgId || !active) return;

        setOrgId(targetOrgId);
        await fetchCouponsForOrg(targetOrgId);
      } catch (e) {
        console.error('Error loading coupons:', e);
      } finally {
        if (active) setLoading(false);
      }
    }
    void initCoupons();
    return () => {
      active = false;
    };
  }, [supabase, fetchCouponsForOrg]);

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

      setRedeemSuccess(
        `Coupon ${inputCode.toUpperCase()} riscattato con successo! Premio: ${data.reward}`
      );
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
  const conversionRate =
    totalCoupons > 0 ? Math.round((redeemedCoupons / totalCoupons) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl min-w-0">
        <PageHeader title="Ruota della Fortuna & Coupon" loading />
        <SurfaceCard loading />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="" value="" loading />
          <KpiCard label="" value="" loading />
          <KpiCard label="" value="" loading />
        </div>
        <SurfaceCard loading />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl min-w-0">
      <PageHeader
        eyebrow="Engagement & Promozioni"
        title="Ruota della Fortuna & Coupon"
        description="Valida e riscatta i voucher vinti dai clienti al tavolo per incentivare le visite di ritorno."
        actions={
          <button
            type="button"
            onClick={loadData}
            aria-label="Aggiorna lista coupon"
            title="Aggiorna lista coupon"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        }
      />

      {/* QUICK REDEEM FORM */}
      <SurfaceCard
        radius="2xl"
        padding="lg"
        header={{
          eyebrow: 'Operatività Cassa',
          title: 'Convalida Rapida Coupon in Cassa',
          icon: Ticket,
        }}
      >
        <div className="space-y-4">
          <form onSubmit={handleRedeem} className="space-y-2">
            <label
              htmlFor="coupon-code-input"
              className="block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Codice Coupon Cliente
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="coupon-code-input"
                name="couponCode"
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Inserisci codice (es. RIVO-AB12CD)…"
                className="flex-1 min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] uppercase font-mono tracking-wider focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
              />
              <button
                type="submit"
                disabled={redeeming}
                className="min-h-[44px] px-6 py-2.5 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-sm rounded-lg transition-[background-color,transform] duration-[180ms] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                <span>{redeeming ? 'Verifica in corso…' : 'Valida & Riscatta'}</span>
              </button>
            </div>
          </form>

          {redeemSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="p-3 bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] rounded-lg text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{redeemSuccess}</span>
            </div>
          )}

          {redeemError && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] rounded-lg text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{redeemError}</span>
            </div>
          )}
        </div>
      </SurfaceCard>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Coupon Vinti"
          value={totalCoupons}
          icon={Gift}
          tone="neutral"
          context="Generati dalla ruota"
        />
        <KpiCard
          label="Coupon Riscattati"
          value={redeemedCoupons}
          icon={CheckCircle2}
          tone="volt"
          context="Clienti tornati al locale"
        />
        <KpiCard
          label="Tasso di Ritorno"
          value={`${conversionRate}%`}
          icon={TrendingUp}
          tone="operational"
          context="Ritorno effettivo"
        />
      </div>

      {/* Coupons Ledger */}
      <SurfaceCard
        radius="xl"
        padding="none"
        header={{
          eyebrow: 'Archivio Promozioni',
          title: `Registro Coupon Emessi (${coupons.length})`,
          icon: Gift,
        }}
      >
        {coupons.length === 0 ? (
          <div className="p-5">
            <EmptyState
              compact
              icon={Ticket}
              title="Nessun coupon ancora generato"
              description="Nessun coupon ancora generato. I tuoi clienti potranno girare la ruota al tavolo per sbloccare sconti di ritorno."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {coupons.map((c) => {
              const isExpired = new Date(c.expires_at).getTime() < renderNowTs;
              const statusTone =
                c.status === 'redeemed' ? 'operational' : isExpired ? 'neutral' : 'volt';
              const statusLabel =
                c.status === 'redeemed' ? 'Riscattato' : isExpired ? 'Scaduto' : 'Attivo';

              return (
                <div
                  key={c.id}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg-elevated)]/50 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      translate="no"
                      className="font-mono tabular-nums font-bold text-[var(--text-primary)] bg-[var(--bg-elevated)] px-2.5 py-1 rounded-lg border border-[var(--border-strong)] text-xs shrink-0"
                    >
                      {c.code}
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-[var(--text-primary)] block truncate">
                        {c.reward}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] block truncate">
                        {c.customer_name || 'Ospite'} •{' '}
                        <span className="font-mono tabular-nums">{c.customer_contact}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
                      Scadenza: {new Date(c.expires_at).toLocaleDateString('it-IT')}
                    </span>

                    <StatusBadge tone={statusTone} dot mono>
                      {statusLabel}
                    </StatusBadge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}

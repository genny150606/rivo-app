'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Award,
  CheckCircle2,
  Plus,
  RotateCcw,
  Users,
  Gift,
  Save,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  StatusBadge,
  SurfaceCard,
} from '@/components/ui';

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
  const [stampError, setStampError] = useState<string | null>(null);

  const fetchLoyaltyForOrg = useCallback(
    async (targetOrgId: string) => {
      const { data: org } = await supabase
        .from('organizations')
        .select('loyalty_reward_text')
        .eq('id', targetOrgId)
        .single();

      if (org?.loyalty_reward_text) {
        setRewardText(org.loyalty_reward_text);
      }

      const res = await fetch(`/api/loyalty?organization_id=${targetOrgId}`);
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
      }
    },
    [supabase]
  );

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
      await fetchLoyaltyForOrg(targetOrgId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchLoyaltyForOrg]);

  useEffect(() => {
    let active = true;
    async function initLoyalty() {
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
        await fetchLoyaltyForOrg(targetOrgId);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    }
    void initLoyalty();
    return () => {
      active = false;
    };
  }, [supabase, fetchLoyaltyForOrg]);

  const handleQuickStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !stampPhone.trim()) return;

    setStamping(true);
    setStampMsg(null);
    setStampError(null);

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
        setStampMsg(
          `Timbro aggiunto a ${stampPhone}! Totale: ${data.card.stamps_count}/${data.card.max_stamps}`
        );
        setStampPhone('');
        setStampName('');
        loadData();
      } else if (!res.ok) {
        setStampError(data.error || 'Errore durante la registrazione del timbro');
      }
    } catch (e) {
      console.warn(e);
      setStampError('Errore di connessione durante la timbratura');
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
      <div className="space-y-6 max-w-5xl min-w-0">
        <PageHeader title="Tessera Fedeltà Digitale" loading />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SurfaceCard loading />
          <SurfaceCard loading />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        eyebrow="Fidelizzazione"
        title="Tessera Fedeltà Digitale"
        description="Gestisci i timbri dei clienti abituali e definisci i premi fedeltà della tua attività."
        actions={
          <button
            type="button"
            onClick={loadData}
            aria-label="Aggiorna tessere fedeltà"
            title="Aggiorna tessere fedeltà"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        }
      />

      {/* 2 Column Actions: Quick Stamp + Reward Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Stamp */}
        <SurfaceCard
          radius="xl"
          padding="md"
          header={{
            eyebrow: 'Operatività Cassa',
            title: 'Timbratura Rapida alla Cassa',
            icon: Plus,
          }}
        >
          <div className="space-y-4">
            <form onSubmit={handleQuickStamp} className="space-y-3.5">
              <div>
                <label
                  htmlFor="loyalty-stamp-phone"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                >
                  Numero di Telefono Cliente{' '}
                  <span className="text-[var(--rivo-volt-text)]">*</span>
                </label>
                <input
                  id="loyalty-stamp-phone"
                  name="customerPhone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={stampPhone}
                  onChange={(e) => setStampPhone(e.target.value)}
                  placeholder="+39 340 1234567…"
                  className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="loyalty-stamp-name"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                >
                  Nome Cliente (opzionale)
                </label>
                <input
                  id="loyalty-stamp-name"
                  name="customerName"
                  type="text"
                  autoComplete="name"
                  value={stampName}
                  onChange={(e) => setStampName(e.target.value)}
                  placeholder="Mario Rossi…"
                  className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={stamping}
                className="w-full min-h-[44px] bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs sm:text-sm rounded-lg transition-[background-color,transform] duration-[180ms] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                <span>{stamping ? 'Registrazione…' : 'Aggiungi Timbro al Cliente'}</span>
              </button>
            </form>

            {stampMsg && (
              <div
                role="status"
                aria-live="polite"
                className="p-3 bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] rounded-lg text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>{stampMsg}</span>
              </div>
            )}

            {stampError && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] rounded-lg text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>{stampError}</span>
              </div>
            )}
          </div>
        </SurfaceCard>

        {/* Reward Settings */}
        <SurfaceCard
          radius="xl"
          padding="md"
          header={{
            eyebrow: 'Regole Premio',
            title: 'Configura Premio Fedeltà',
            icon: Gift,
          }}
        >
          <div className="space-y-4">
            <form onSubmit={handleSaveRewardConfig} className="space-y-3.5">
              <div>
                <label
                  htmlFor="loyalty-reward-text"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                >
                  Descrizione Premio (sbloccato dopo 10 timbri)
                </label>
                <input
                  id="loyalty-reward-text"
                  name="rewardText"
                  type="text"
                  required
                  value={rewardText}
                  onChange={(e) => setRewardText(e.target.value)}
                  placeholder="Es. Caffè e cornetto omaggio, o 10€ di sconto…"
                  className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
                />
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Questo messaggio comparirà nella tessera digitale visibile sullo smartphone dei tuoi
                clienti.
              </p>

              <button
                type="submit"
                disabled={savingReward}
                className="w-full min-h-[44px] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold text-xs sm:text-sm rounded-lg transition-[background-color,border-color,transform] duration-[180ms] flex items-center justify-center gap-2 border border-[var(--border-strong)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                <span>{savingReward ? 'Salvataggio…' : 'Salva Regole Premio'}</span>
              </button>
            </form>

            {savedSuccess && (
              <div
                role="status"
                aria-live="polite"
                className="p-3 bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] rounded-lg text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>Premio salvato correttamente!</span>
              </div>
            )}
          </div>
        </SurfaceCard>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label="Membri Fidelity"
          value={totalMembers}
          icon={Users}
          tone="neutral"
          context="Tessere digitali attive"
        />
        <KpiCard
          label="Pronti per il Premio"
          value={readyForReward}
          icon={Award}
          tone="volt"
          context="Con 10 timbri completati"
        />
      </div>

      {/* Members Table */}
      <SurfaceCard
        radius="xl"
        padding="none"
        header={{
          eyebrow: 'Archivio Tessere',
          title: `Clienti con Tessera Attiva (${cards.length})`,
          icon: Users,
        }}
      >
        {cards.length === 0 ? (
          <div className="p-5">
            <EmptyState
              compact
              icon={Award}
              title="Nessun cliente registrato ancora"
              description="Nessun cliente registrato ancora. Aggiungi il primo timbro usando il form in alto o fai scansionare il chip NFC ai clienti al tavolo."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {cards.map((c) => {
              const hasReachedReward = c.stamps_count >= c.max_stamps;
              return (
                <div
                  key={c.id}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg-elevated)]/50 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center font-mono tabular-nums font-bold text-xs text-[var(--text-primary)] shrink-0">
                      {c.stamps_count}/{c.max_stamps}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-[var(--text-primary)] block truncate">
                        {c.customer_name || 'Cliente'}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] font-mono tabular-nums block truncate">
                        {c.customer_contact}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {hasReachedReward ? (
                      <>
                        <StatusBadge tone="volt" variant="solid" size="md" icon={Gift} mono>
                          PREMIO DISPONIBILE
                        </StatusBadge>
                        <button
                          type="button"
                          onClick={() => handleResetReward(c.id)}
                          className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-[0.98] cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                          <span>Eroga & Resetta</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
                        Mancano {c.max_stamps - c.stamps_count} timbri al premio
                      </span>
                    )}
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

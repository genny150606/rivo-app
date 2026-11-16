'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Star,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  StatusBadge,
  SurfaceCard,
} from '@/components/ui';

interface PrivateFeedbackItem {
  id: string;
  rating: number;
  customer_name: string | null;
  customer_contact: string | null;
  comment: string;
  status: 'new' | 'read' | 'archived';
  created_at: string;
}

export default function ReviewsPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>('');
  const [shieldEnabled, setShieldEnabled] = useState(true);
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string>('');
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<PrivateFeedbackItem[]>([]);
  const [updatingShield, setUpdatingShield] = useState(false);
  const [shieldMessage, setShieldMessage] = useState<string | null>(null);
  const [shieldError, setShieldError] = useState<string | null>(null);

  const fetchReviewsForOrg = useCallback(
    async (targetOrgId: string) => {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, review_shield_enabled, google_review_url')
        .eq('id', targetOrgId)
        .single();

      if (org) {
        setOrgName(org.name);
        setShieldEnabled(org.review_shield_enabled ?? true);
        setGoogleReviewUrl(org.google_review_url || '');
      }

      const { data: dev } = await supabase
        .from('devices')
        .select('unique_code')
        .eq('organization_id', targetOrgId)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (dev) {
        setDeviceCode(dev.unique_code);
      }

      const { data: feedbackData } = await supabase
        .from('private_feedbacks')
        .select('*')
        .eq('organization_id', targetOrgId)
        .order('created_at', { ascending: false });

      if (feedbackData) {
        setFeedbacks(feedbackData as PrivateFeedbackItem[]);
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
      await fetchReviewsForOrg(targetOrgId);
    } catch (err) {
      console.error('Error loading reviews data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchReviewsForOrg]);

  useEffect(() => {
    let active = true;
    async function initReviews() {
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
        await fetchReviewsForOrg(targetOrgId);
      } catch (err) {
        console.error('Error loading reviews data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    void initReviews();
    return () => {
      active = false;
    };
  }, [supabase, fetchReviewsForOrg]);

  // Toggle Review Shield setting
  const handleToggleShield = async () => {
    if (!orgId) return;
    const newStatus = !shieldEnabled;
    setUpdatingShield(true);
    setShieldMessage(null);
    setShieldError(null);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ review_shield_enabled: newStatus })
        .eq('id', orgId);

      if (error) throw error;

      setShieldEnabled(newStatus);
      setShieldMessage(
        newStatus
          ? 'Review Shield ATTIVATO: le recensioni negative vengono intercettate.'
          : 'Review Shield DISATTIVATO: tutti i tap vanno direttamente a Google.'
      );
      setTimeout(() => setShieldMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore';
      setShieldError(`Errore aggiornamento: ${msg}`);
    } finally {
      setUpdatingShield(false);
    }
  };

  // Toggle status of feedback (new <-> read)
  const handleToggleStatus = async (item: PrivateFeedbackItem) => {
    const nextStatus = item.status === 'new' ? 'read' : 'new';
    try {
      const { error } = await supabase
        .from('private_feedbacks')
        .update({ status: nextStatus })
        .eq('id', item.id);

      if (error) throw error;

      setFeedbacks((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: nextStatus } : f))
      );
    } catch (err) {
      console.error('Error updating feedback status:', err);
    }
  };

  const interceptedCount = feedbacks.length;
  const newFeedbacksCount = feedbacks.filter((f) => f.status === 'new').length;

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl min-w-0">
        <PageHeader title="Google Reviews & Review Shield" loading />
        <SurfaceCard loading />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="" value="" loading />
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
        eyebrow={orgName ? `Reputazione • ${orgName}` : 'Reputazione & Protezione'}
        title="Google Reviews & Review Shield"
        badge={
          <StatusBadge tone="volt" mono>
            PRO
          </StatusBadge>
        }
        description="Filtra automaticamente le recensioni a 5 stelle su Google e gestisci privatamente i clienti insoddisfatti."
        actions={
          deviceCode ? (
            <Link
              href={`/review/${deviceCode}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-strong)] text-xs font-semibold transition-colors shrink-0"
            >
              <span>Simula Esperienza Cliente</span>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          ) : undefined
        }
      />

      {/* SHIELD CONTROL BANNER */}
      <SurfaceCard
        radius="xl"
        padding="lg"
        variant={shieldEnabled ? 'default' : 'elevated'}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border ${
                shieldEnabled
                  ? 'bg-[var(--accent-operational-bg)] text-[var(--accent-operational-text)] border-[var(--accent-operational-border)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}
            >
              {shieldEnabled ? (
                <ShieldCheck className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <ShieldAlert className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
                  {shieldEnabled ? 'Review Shield Attivo' : 'Review Shield Disattivato'}
                </h2>
                <StatusBadge tone={shieldEnabled ? 'operational' : 'neutral'} dot mono>
                  {shieldEnabled ? 'Protetto' : 'Libero'}
                </StatusBadge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] max-w-xl leading-relaxed">
                {shieldEnabled ? (
                  <>
                    I clienti che valutano{' '}
                    <strong className="text-[var(--text-primary)]">4 o 5 stelle</strong> vengono
                    reindirizzati istantaneamente alla pagina Google del locale. Le valutazioni da{' '}
                    <strong className="text-[var(--text-primary)]">1 a 3 stelle</strong> generano
                    un feedback privato interno, preservando il punteggio pubblico e l&apos;algoritmo
                    di raccomandazione.
                  </>
                ) : (
                  <>
                    Il filtro intelligente è disattivato. Tutti i clienti che aprono l&apos;Hub
                    vengono inviati direttamente all&apos;URL di Google senza protezione preventiva.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex sm:justify-end shrink-0">
            <button
              type="button"
              onClick={handleToggleShield}
              disabled={updatingShield}
              className={`min-h-[44px] px-5 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition-[background-color,border-color,transform] duration-[180ms] active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
                shieldEnabled
                  ? 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-strong)]'
                  : 'bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B]'
              }`}
            >
              {updatingShield ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Salvataggio…</span>
                </>
              ) : shieldEnabled ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-[var(--text-secondary)]" strokeWidth={1.75} aria-hidden="true" />
                  <span>Disattiva Shield</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                  <span>Attiva Review Shield</span>
                </>
              )}
            </button>
          </div>
        </div>

        {shieldMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-xs font-medium text-[var(--accent-operational-text)] flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{shieldMessage}</span>
          </div>
        )}

        {shieldError && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-xs font-medium text-[var(--accent-critical-text)] flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{shieldError}</span>
          </div>
        )}
      </SurfaceCard>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Recensioni Salve"
          value={interceptedCount}
          icon={ShieldCheck}
          tone="operational"
          context="Filtro privato attivo"
        />
        <KpiCard
          label="Messaggi da Leggere"
          value={newFeedbacksCount}
          icon={Clock}
          tone={newFeedbacksCount > 0 ? 'warning' : 'telemetry'}
          context="Segnalazioni recenti"
        />
        <KpiCard
          label="Tasso di Protezione"
          value={shieldEnabled ? '100%' : '0%'}
          icon={TrendingUp}
          tone={shieldEnabled ? 'operational' : 'neutral'}
          context="Filtro preventivo attivo"
        />
        <SurfaceCard radius="xl" padding="md" className="min-w-0 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] block">
              Google Reviews
            </span>
            <div className="text-xs font-mono text-[var(--text-primary)] truncate mt-2">
              {googleReviewUrl ? googleReviewUrl.replace('https://', '') : 'Non configurato'}
            </div>
          </div>
          <div className="mt-3">
            <Link
              href="/dashboard/profile"
              className="text-xs text-[var(--rivo-volt-text)] hover:underline font-semibold inline-flex items-center gap-1 min-h-[36px]"
            >
              <span>Configura URL</span>
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
        </SurfaceCard>
      </div>

      {/* PRIVATE FEEDBACKS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--text-muted)] shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="truncate tabular-nums">
                Segnalazioni e Reclami Intercettati ({feedbacks.length})
              </span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Ospiti che hanno valutato da 1 a 3 stelle lasciando una nota interna prima
              dell&apos;uscita.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            title="Ricarica lista"
            aria-label="Ricarica lista segnalazioni"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {feedbacks.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Nessuna recensione negativa intercettata"
            description="Il sistema è in ascolto. Quando un ospite inserisce una valutazione da 1 a 3 stelle, la segnalazione comparirà qui in forma riservata per consentire di gestire l'esperienza internamente."
          />
        ) : (
          <div className="space-y-3">
            {feedbacks.map((item) => (
              <SurfaceCard
                key={item.id}
                radius="xl"
                padding="md"
                variant={item.status === 'new' ? 'warning' : 'default'}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    {/* Stars badge */}
                    <div className="flex items-center gap-1 bg-[var(--bg-elevated)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          aria-hidden="true"
                          className={`w-3 h-3 ${
                            star <= item.rating
                              ? 'text-[var(--accent-warning-text)] fill-[var(--accent-warning)]'
                              : 'text-[var(--border-strong)]'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-semibold text-[var(--text-primary)] ml-1 font-mono tabular-nums">
                        {item.rating}/5
                      </span>
                    </div>

                    {/* Customer name */}
                    <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {item.customer_name || 'Ospite Anonimo'}
                    </span>

                    {/* Status badge */}
                    <StatusBadge tone={item.status === 'new' ? 'warning' : 'neutral'} dot mono>
                      {item.status === 'new' ? 'Nuovo' : 'Letto'}
                    </StatusBadge>
                  </div>

                  <div className="text-xs font-mono tabular-nums text-[var(--text-muted)] flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>{new Date(item.created_at).toLocaleString('it-IT')}</span>
                  </div>
                </div>

                {/* Comment */}
                <div className="bg-[var(--bg-elevated)] p-3.5 rounded-lg border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed italic mb-3">
                  &ldquo;{item.comment}&rdquo;
                </div>

                {/* Footer bar with contact info & mark read button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
                  <div className="flex items-center gap-4 text-[var(--text-secondary)] min-w-0">
                    {item.customer_contact ? (
                      <div className="flex items-center gap-2 min-w-0">
                        {item.customer_contact.includes('@') ? (
                          <a
                            href={`mailto:${item.customer_contact}`}
                            className="inline-flex items-center gap-1.5 min-h-[36px] text-[var(--text-primary)] hover:underline font-mono text-xs truncate"
                          >
                            <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" strokeWidth={1.75} aria-hidden="true" />
                            <span className="truncate">{item.customer_contact}</span>
                          </a>
                        ) : (
                          <a
                            href={`tel:${item.customer_contact}`}
                            className="inline-flex items-center gap-1.5 min-h-[36px] text-[var(--text-primary)] hover:underline font-mono tabular-nums text-xs truncate"
                          >
                            <Phone className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" strokeWidth={1.75} aria-hidden="true" />
                            <span className="truncate">{item.customer_contact}</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-[var(--text-muted)] italic text-xs">
                        Nessun recapito rilasciato
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    className="self-start sm:self-auto min-h-[44px] px-3.5 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {item.status === 'new' ? 'Segna come letto' : 'Segna come da leggere'}
                  </button>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>

      {/* HOW IT WORKS CARD */}
      <SurfaceCard
        radius="xl"
        padding="lg"
        header={{
          eyebrow: 'Architettura',
          title: 'Funzionamento del Review Shield',
          icon: ShieldCheck,
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center gap-2 text-[var(--accent-operational-text)] font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span>Valutazioni 4 e 5 Stelle • Inoltro a Google</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Il cliente tocca 4 o 5 stelle: la piattaforma apre istantaneamente la scheda Google
              Maps del locale con il form precompilato a 5 stelle, massimizzando il volume di
              recensioni positive.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center gap-2 text-[var(--accent-warning-text)] font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Valutazioni 1, 2 e 3 Stelle • Intercettazione Protetta</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Invece di approdare su Google rovinando il rating medio, il cliente compila un feedback
              riservato. La segnalazione arriva qui e su Telegram per consentirti di rimediare prima
              che sia troppo tardi.
            </p>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}

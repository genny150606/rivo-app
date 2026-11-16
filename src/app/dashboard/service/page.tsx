'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  BellRing,
  CreditCard,
  Banknote,
  CheckCircle2,
  Clock,
  RefreshCw,
  Volume2,
  VolumeX,
  UtensilsCrossed,
  MessageSquareText,
  Music,
  Play,
  X,
  Check,
  ShieldAlert,
  Receipt,
  Copy,
  Building2,
  Users,
  User,
  Utensils,
  CheckCheck,
  Send,
} from 'lucide-react';
import {
  SERVICE_SOUND_OPTIONS,
  ServiceSoundId,
  playServiceSound,
} from '@/lib/service-sounds';
import { hapticTap, hapticSelection, hapticSuccess } from '@/lib/haptics';
import { formatInvoiceForCashier } from '@/lib/invoice-helpers';
import { PageHeader, SurfaceCard, StatusBadge, EmptyState } from '@/components/ui';

interface ServiceCallRecord {
  id: string;
  type:
    | 'waiter'
    | 'bill_pos'
    | 'bill_cash'
    | 'dish_order'
    | 'negative_review_alert'
    | 'in_dining_review_alert'
    | 'bill_invoice';
  table_label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  order_details?: {
    items?: Array<{
      id?: string;
      name: string;
      quantity: number;
      price: string;
      guest_name?: string | null;
      notes?: string | null;
      shared?: boolean;
    }>;
    collaborative?: boolean;
    guests?: string[];
    round?: number;
    total?: string;
    notes?: string;
    rating?: number;
    split_count?: number;
    split_quota?: string;
    payment_method?: string;
    payment_intent?: 'pos_contactless' | 'pos_traditional' | 'cash_exact' | 'cash_needs_change';
    banknote?: number;
    change_due?: string;
    action_required?: string;
    bill_request_id?: string;
    invoice?: {
      companyName?: string;
      vatNumber?: string;
      sdiCode?: string;
      pec?: string;
      address?: string;
    };
  };
}

type StatusTone = 'neutral' | 'volt' | 'operational' | 'warning' | 'critical' | 'telemetry';

export default function ServiceDashboardPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [calls, setCalls] = useState<ServiceCallRecord[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRealtimeLive, setIsRealtimeLive] = useState(false);
  const [selectedSound, setSelectedSound] = useState<ServiceSoundId>('reception_bell');
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const selectedSoundRef = useRef(selectedSound);
  const previousCallsCountRef = useRef(0);

  const handleCopyInvoice = (call: ServiceCallRecord) => {
    hapticTap();
    const text = formatInvoiceForCashier({
      invoice: call.order_details?.invoice,
      tableLabel: call.table_label,
      total: call.order_details?.total,
      splitCount: call.order_details?.split_count,
      splitQuota: call.order_details?.split_quota,
      paymentMethod: call.order_details?.payment_method,
    });

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(call.id);
      hapticSuccess();
      setTimeout(() => {
        setCopiedId((prev) => (prev === call.id ? null : prev));
      }, 2500);
    }
  };

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    selectedSoundRef.current = selectedSound;
    if (typeof window !== 'undefined') {
      localStorage.setItem('rivo_service_sound', selectedSound);
    }
  }, [selectedSound]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rivo_service_sound') as ServiceSoundId | null;
      if (saved && SERVICE_SOUND_OPTIONS.some((o) => o.id === saved)) {
        setSelectedSound(saved);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSoundModal) {
        setShowSoundModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSoundModal]);

  // Supabase Realtime Live WebSocket Channel (Zero-Refresh)
  useEffect(() => {
    if (!orgId) return;

    const channelName = `realtime-service-calls-${orgId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_calls',
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as ServiceCallRecord;
            if (newRecord.status === 'pending' || newRecord.status === 'in_progress') {
              setCalls((prev) => {
                if (prev.some((c) => c.id === newRecord.id)) return prev;
                return [newRecord, ...prev];
              });
              if (soundEnabledRef.current) {
                playChime();
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as ServiceCallRecord;
            setCalls((prev) => {
              if (updatedRecord.status === 'completed' || updatedRecord.status === 'cancelled') {
                return prev.filter((c) => c.id !== updatedRecord.id);
              }
              return prev.map((c) => (c.id === updatedRecord.id ? updatedRecord : c));
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRecord = payload.old as { id: string };
            setCalls((prev) => prev.filter((c) => c.id !== oldRecord.id));
          }
        }
      )
      .on('broadcast', { event: 'table_alert' }, () => {
        if (soundEnabledRef.current) playChime();
        loadCallsOnly();
      })
      .on('broadcast', { event: 'bill_status_change' }, () => {
        loadCallsOnly();
      })
      .subscribe((status) => {
        setIsRealtimeLive(status === 'SUBSCRIBED');
      });

    // Fallback sync interval every 8s in case of temporary network dropout
    const interval = setInterval(loadCallsOnly, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [orgId, supabase]);

  async function loadData() {
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
        const { data: firstOrg } = await supabase.from('organizations').select('id').limit(1).single();
        targetOrgId = firstOrg?.id;
      }

      if (!targetOrgId) {
        setLoading(false);
        return;
      }

      setOrgId(targetOrgId);

      const res = await fetch(`/api/service?organization_id=${targetOrgId}`);
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls || []);
        previousCallsCountRef.current = data.calls?.length || 0;
      }
    } catch (e) {
      console.error('Error loading service calls:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadCallsOnly() {
    if (!orgId) return;
    try {
      const res = await fetch(`/api/service?organization_id=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        const newCalls = data.calls || [];

        // If count increased from polling, sound chime as fallback
        if (newCalls.length > previousCallsCountRef.current && soundEnabledRef.current) {
          playChime();
        }

        previousCallsCountRef.current = newCalls.length;
        setCalls(newCalls);
      }
    } catch (e) {
      console.warn('Polling fallback error:', e);
    }
  }

  function playChime() {
    playServiceSound(selectedSoundRef.current);
  }

  const handleDispatchAttendant = async (call: ServiceCallRecord) => {
    hapticTap();
    try {
      if (call.order_details?.bill_request_id) {
        await fetch('/api/bill-request', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: call.order_details.bill_request_id,
            status: 'attendant_dispatched',
            dispatched_by: 'Monitor Cassa',
          }),
        });
      } else {
        await fetch('/api/service', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: call.id, status: 'in_progress' }),
        });
      }

      setCalls((prev) => prev.map((c) => (c.id === call.id ? { ...c, status: 'in_progress' } : c)));
      hapticSuccess();
    } catch (e) {
      console.error('Error dispatching attendant:', e);
    }
  };

  const handleResolve = async (id: string, billRequestId?: string) => {
    hapticTap();
    try {
      if (billRequestId) {
        await fetch('/api/bill-request', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: billRequestId, status: 'settled' }),
        });
      }

      const res = await fetch('/api/service', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'completed' }),
      });

      if (res.ok) {
        setCalls((prev) => prev.filter((c) => c.id !== id));
        hapticSuccess();
      }
    } catch (e) {
      console.error('Error resolving call:', e);
    }
  };

  const typeConfig: Record<
    string,
    { label: string; icon: typeof BellRing; tone: StatusTone; iconWrap: string }
  > = {
    waiter: {
      label: 'Cameriere al Tavolo',
      icon: BellRing,
      tone: 'warning',
      iconWrap: 'bg-[var(--accent-warning-bg)] text-[var(--accent-warning-text)] border-[var(--accent-warning-border)]',
    },
    bill_pos: {
      label: 'Conto con POS / Carta',
      icon: CreditCard,
      tone: 'telemetry',
      iconWrap: 'bg-[var(--accent-telemetry-bg)] text-[var(--accent-telemetry-text)] border-[var(--accent-telemetry-border)]',
    },
    bill_cash: {
      label: 'Conto in Contanti',
      icon: Banknote,
      tone: 'operational',
      iconWrap: 'bg-[var(--accent-operational-bg)] text-[var(--accent-operational-text)] border-[var(--accent-operational-border)]',
    },
    dish_order: {
      label: 'Comanda Cucina',
      icon: UtensilsCrossed,
      tone: 'telemetry',
      iconWrap: 'bg-[var(--accent-telemetry-bg)] text-[var(--accent-telemetry-text)] border-[var(--accent-telemetry-border)]',
    },
    negative_review_alert: {
      label: 'Priorità: Esperienza Negativa',
      icon: ShieldAlert,
      tone: 'critical',
      iconWrap: 'bg-[var(--accent-critical-bg)] text-[var(--accent-critical-text)] border-[var(--accent-critical-border)]',
    },
    in_dining_review_alert: {
      label: 'Priorità: Esperienza Negativa',
      icon: ShieldAlert,
      tone: 'critical',
      iconWrap: 'bg-[var(--accent-critical-bg)] text-[var(--accent-critical-text)] border-[var(--accent-critical-border)]',
    },
    bill_invoice: {
      label: 'Conto con Fattura Elettronica',
      icon: Receipt,
      tone: 'volt',
      iconWrap: 'bg-[var(--rivo-volt-bg)] text-[var(--rivo-volt-text)] border-[var(--rivo-volt-border)]',
    },
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="h-8 bg-[var(--bg-subtle)] rounded-lg w-1/4 animate-pulse" />
        <div className="h-4 bg-[var(--bg-subtle)] rounded-md w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl animate-fade-in">
      <PageHeader
        eyebrow="Duplex Floor Console"
        eyebrowTone="volt"
        title="Chiamate Sala & Richieste Conto"
        description="Console di servizio duplex per personale di sala e cassa: sincronizzazione istantanea senza ricaricamento."
        badge={
          <div className="flex flex-wrap items-center gap-2">
            {calls.length > 0 && (
              <StatusBadge tone="neutral" variant="solid" size="sm" mono>
                {calls.length} {calls.length === 1 ? 'Attiva' : 'Attive'}
              </StatusBadge>
            )}
            {isRealtimeLive ? (
              <StatusBadge tone="operational" size="sm" dot pulse>
                Live Realtime
              </StatusBadge>
            ) : (
              <StatusBadge tone="neutral" size="sm" dot>
                Connessione...
              </StatusBadge>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setShowSoundModal(true);
              }}
              className="px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all touch-press bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-primary)] shadow-2xs"
              title="Scegli suono chiamate"
            >
              <Music className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="hidden sm:inline">
                {SERVICE_SOUND_OPTIONS.find((s) => s.id === selectedSound)?.name || 'Campanello'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all touch-press ${
                soundEnabled
                  ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border-[var(--border-strong)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Audio Attivo' : 'Muto'}</span>
            </button>

            <button
              type="button"
              onClick={loadCallsOnly}
              aria-label="Aggiorna chiamate"
              className="p-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-2xs"
              title="Aggiorna chiamate"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      {/* Active Calls Grid */}
      {calls.length === 0 ? (
        <SurfaceCard padding="none">
          <EmptyState
            icon={CheckCircle2}
            title="Nessuna chiamata in attesa"
            description="Tutti i tavoli sono serviti. Quando un cliente tocca 'Chiama Cameriere' o 'Richiedi Conto', il ticket di servizio comparirà qui in tempo reale."
          />
        </SurfaceCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {calls.map((call) => {
            const config = typeConfig[call.type] || typeConfig.waiter;
            const Icon = config.icon;
            const date = new Date(call.created_at);
            const minutesAgo = Math.floor((Date.now() - date.getTime()) / 60000);

            return (
              <SurfaceCard
                key={call.id}
                padding="md"
                className="space-y-4 hover:border-[var(--border-strong)] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${config.iconWrap}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)] truncate">
                        {call.table_label}
                      </h2>
                      <div className="mt-0.5">
                        <StatusBadge tone={config.tone} size="sm">
                          {config.label}
                        </StatusBadge>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums shrink-0">
                    <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{minutesAgo < 1 ? 'Adesso' : `${minutesAgo} min fa`}</span>
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Dettaglio Comanda Piatti */}
                {call.type === 'dish_order' && call.order_details && (
                  <div className="bg-[var(--bg-subtle)] rounded-xl p-3.5 border border-[var(--border-subtle)] space-y-2.5">
                    {call.order_details.collaborative &&
                      call.order_details.guests &&
                      call.order_details.guests.length > 0 && (
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)] text-[11px]">
                          <span className="font-semibold text-[var(--accent-telemetry-text)] inline-flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>Ordine Condiviso ({call.order_details.guests.length} al tavolo)</span>
                          </span>
                          <span className="text-[var(--text-muted)] truncate">
                            {call.order_details.guests.join(', ')}
                          </span>
                        </div>
                      )}
                    {/* Lista piatti ordinati con quantità in evidenza */}
                    {call.order_details.items && call.order_details.items.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                          Portate Ordinate {call.order_details.round ? `• Giro #${call.order_details.round}` : ''}
                        </p>
                        <div className="divide-y divide-[var(--border-subtle)]">
                          {call.order_details.items.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[11px] shrink-0 font-mono tabular-nums">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-medium text-[var(--text-primary)] truncate">
                                    {item.name}
                                  </span>
                                  {item.shared ? (
                                    <StatusBadge tone="warning" size="sm" icon={Utensils}>
                                      Al Centro
                                    </StatusBadge>
                                  ) : item.guest_name ? (
                                    <StatusBadge tone="telemetry" size="sm" icon={User}>
                                      {item.guest_name}
                                    </StatusBadge>
                                  ) : null}
                                </div>
                                {item.notes && (
                                  <p className="text-[11px] text-[var(--accent-warning-text)] italic pl-7 mt-0.5">
                                    Nota: {item.notes}
                                  </p>
                                )}
                              </div>
                              <span className="font-mono tabular-nums text-[var(--text-secondary)] text-xs shrink-0">
                                {item.price}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Note cliente per la cucina */}
                    {call.order_details.notes && (
                      <div className="p-2.5 rounded-lg bg-[var(--accent-warning-bg)] border border-[var(--accent-warning-border)] text-xs text-[var(--text-primary)] flex items-start gap-2">
                        <MessageSquareText className="w-4 h-4 shrink-0 mt-0.5 text-[var(--accent-warning-text)]" />
                        <div className="min-w-0">
                          <span className="font-semibold block text-[11px] text-[var(--accent-warning-text)]">
                            Note per la cucina:
                          </span>
                          <span className="break-words">{call.order_details.notes}</span>
                        </div>
                      </div>
                    )}

                    {/* Totale comanda */}
                    {call.order_details.total && (
                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-xs text-[var(--text-secondary)] font-medium">Totale Comanda:</span>
                        <span className="font-mono tabular-nums font-semibold text-sm text-[var(--text-primary)]">
                          {call.order_details.total}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Dettaglio Alert Recensione / Insoddisfazione In-Dining */}
                {(call.type === 'negative_review_alert' || call.type === 'in_dining_review_alert') &&
                  call.order_details && (
                    <div className="bg-[var(--accent-critical-bg)] rounded-xl p-3.5 border border-[var(--accent-critical-border)] space-y-2">
                      <div className="flex items-center gap-2 text-[var(--accent-critical-text)] font-semibold text-xs">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span className="tabular-nums">
                          Valutazione: {call.order_details.rating || '1-3'} Stelle • Intervento Immediato
                        </span>
                      </div>
                      {call.order_details.notes && (
                        <p className="text-xs text-[var(--text-primary)] bg-[var(--bg-surface)]/70 p-2.5 rounded-lg italic border border-[var(--accent-critical-border)]">
                          &quot;{call.order_details.notes}&quot;
                        </p>
                      )}
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Raggiungete il tavolo per assistere l&apos;ospite prima del pagamento e dell&apos;uscita dal
                        locale.
                      </p>
                    </div>
                  )}

                {/* Dettaglio Conto con Fattura Elettronica / Split Bill */}
                {(call.type === 'bill_invoice' ||
                  call.order_details?.invoice ||
                  (call.order_details?.split_count && call.order_details.split_count > 1)) && (
                  <div className="bg-[var(--bg-subtle)] rounded-xl p-3.5 border border-[var(--border-subtle)] space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-[var(--rivo-volt-text)] shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-[var(--text-primary)] block">
                            {call.order_details?.invoice ? 'Fattura Elettronica Richiesta' : 'Richiesta Conto al Tavolo'}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {call.order_details?.payment_method === 'cash'
                              ? 'Pagamento in contanti'
                              : 'Pagamento con POS al tavolo'}
                          </span>
                        </div>
                      </div>

                      {call.order_details?.invoice && (
                        <button
                          type="button"
                          onClick={() => handleCopyInvoice(call)}
                          className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-[11px] font-medium flex items-center gap-1.5 shadow-2xs transition-all touch-press active:scale-95 cursor-pointer"
                          title="Copia dati fiscali pronti per registratore o software fatture"
                        >
                          {copiedId === call.id ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-[var(--accent-operational-text)]" />
                              <span className="text-[var(--accent-operational-text)] font-semibold">Copiato</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copia Dati Cassa</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Dati Fiscali Aziendali */}
                    {call.order_details?.invoice && (
                      <div className="bg-[var(--bg-surface)] rounded-lg p-3 border border-[var(--border-subtle)] text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase text-[var(--text-muted)] font-medium block">
                              Ragione Sociale
                            </span>
                            <span className="font-semibold text-[var(--text-primary)] text-xs truncate block">
                              {call.order_details.invoice.companyName || 'Non specificata'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[var(--border-subtle)]">
                          <div>
                            <span className="text-[10px] uppercase text-[var(--text-muted)] font-medium block">
                              Partita IVA / CF
                            </span>
                            <span className="font-mono tabular-nums text-[var(--text-primary)] text-[11px] font-medium">
                              {call.order_details.invoice.vatNumber || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-[var(--text-muted)] font-medium block">
                              Codice SDI
                            </span>
                            <span className="font-mono tabular-nums text-[var(--text-primary)] text-[11px] font-bold bg-[var(--bg-subtle)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)] inline-block">
                              {call.order_details.invoice.sdiCode?.toUpperCase() || '0000000'}
                            </span>
                          </div>
                        </div>

                        {call.order_details.invoice.pec && (
                          <div className="pt-1.5 border-t border-[var(--border-subtle)]">
                            <span className="text-[10px] uppercase text-[var(--text-muted)] font-medium block">
                              PEC
                            </span>
                            <span className="font-mono text-[var(--text-secondary)] text-[11px] break-all">
                              {call.order_details.invoice.pec}
                            </span>
                          </div>
                        )}

                        {call.order_details.invoice.address && (
                          <div className="pt-1.5 border-t border-[var(--border-subtle)]">
                            <span className="text-[10px] uppercase text-[var(--text-muted)] font-medium block">
                              Indirizzo Sede
                            </span>
                            <span className="text-[var(--text-secondary)] text-[11px]">
                              {call.order_details.invoice.address}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dettaglio Divisione Spesa "Alla Romana" */}
                    {call.order_details?.split_count && call.order_details.split_count > 1 && (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                          <span className="text-[var(--text-secondary)] font-medium">
                            Conto diviso per{' '}
                            <strong className="text-[var(--text-primary)] font-mono tabular-nums">
                              {call.order_details.split_count} persone
                            </strong>
                          </span>
                        </div>
                        {call.order_details.split_quota && (
                          <span className="font-mono tabular-nums font-semibold text-[var(--text-primary)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                            {call.order_details.split_quota} a quota
                          </span>
                        )}
                      </div>
                    )}

                    {/* Banner Azione Richiesta Smart Bill (POS / Resto) */}
                    {call.order_details?.action_required && (
                      <div className="p-2.5 rounded-lg bg-[var(--accent-telemetry-bg)] border border-[var(--accent-telemetry-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-[var(--accent-telemetry-text)] flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5" />
                          <span>{call.order_details.action_required}</span>
                        </span>
                        {call.order_details.change_due && (
                          <span className="font-mono tabular-nums font-semibold text-[var(--accent-operational-text)] bg-[var(--accent-operational-bg)] px-2 py-0.5 rounded border border-[var(--accent-operational-border)]">
                            Resto: {call.order_details.change_due}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 flex-wrap">
                  {call.status === 'in_progress' ? (
                    <StatusBadge tone="warning" size="sm" dot>
                      Cameriere in Arrivo al Tavolo
                    </StatusBadge>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)]">In attesa di presa in carico</span>
                  )}

                  <div className="flex items-center gap-2">
                    {call.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleDispatchAttendant(call)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium text-xs flex items-center gap-1.5 transition-all touch-press active:scale-95 cursor-pointer shadow-2xs"
                        title="Segnala al tavolo che il cameriere sta arrivando con POS o Resto"
                      >
                        <Send className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Invia Cameriere</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleResolve(call.id, call.order_details?.bill_request_id)}
                      className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 font-semibold text-xs flex items-center gap-1.5 transition-opacity shadow-xs touch-press active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{call.type === 'dish_order' ? 'Comanda Evasa' : 'Saldato / Evadi'}</span>
                    </button>
                  </div>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      )}

      {/* Sound Selection Modal */}
      {showSoundModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sound-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs animate-fade-in overscroll-contain"
        >
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="sound-modal-title" className="text-sm font-semibold text-[var(--text-primary)]">
                    Suono Chiamate Sala
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Segnale acustico riprodotto all&apos;arrivo di nuove notifiche
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setShowSoundModal(false);
                }}
                aria-label="Chiudi selezione suono"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of sound options */}
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-0.5">
              {SERVICE_SOUND_OPTIONS.map((opt) => {
                const isSelected = selectedSound === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[var(--bg-subtle)] border-[var(--border-strong)] shadow-2xs'
                        : 'bg-transparent border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)]/60'
                    }`}
                  >
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        hapticSelection();
                        setSelectedSound(opt.id);
                        playServiceSound(opt.id);
                      }}
                      className="min-w-0 flex-1 p-3 text-left flex items-center justify-between gap-3 cursor-pointer rounded-l-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`text-xs font-semibold ${
                              isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            {opt.name}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                            {opt.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] leading-tight">{opt.tagline}</p>
                      </div>

                      {/* Selection Checkmark */}
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                          isSelected
                            ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-canvas)]'
                            : 'border-[var(--border-strong)] bg-transparent text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />
                      </div>
                    </button>

                    {/* Play Preview Button (sibling, non-nested) */}
                    <div className="pr-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          hapticTap();
                          playServiceSound(opt.id);
                        }}
                        aria-label={`Ascolta anteprima ${opt.name}`}
                        className="p-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors cursor-pointer"
                        title="Ascolta anteprima"
                      >
                        <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  hapticSuccess();
                  setShowSoundModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Conferma Selezione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

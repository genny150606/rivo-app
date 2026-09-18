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
  Sparkles,
  Layers,
  UtensilsCrossed,
  MessageSquareText,
  Music,
  Play,
  X,
  Check,
  Sliders,
  ShieldAlert,
  Receipt,
  FileText,
  Copy,
  Building2,
  Users,
  CheckCheck,
  Coins,
  Send,
  Wifi,
} from 'lucide-react';
import {
  SERVICE_SOUND_OPTIONS,
  ServiceSoundId,
  playServiceSound,
} from '@/lib/service-sounds';
import { hapticTap, hapticSelection, hapticSuccess } from '@/lib/haptics';
import { formatInvoiceForCashier } from '@/lib/invoice-helpers';

interface ServiceCallRecord {
  id: string;
  type: 'waiter' | 'bill_pos' | 'bill_cash' | 'dish_order' | 'negative_review_alert' | 'in_dining_review_alert' | 'bill_invoice';
  table_label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  order_details?: {
    items?: Array<{ id?: string; name: string; quantity: number; price: string }>;
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

      setCalls((prev) =>
        prev.map((c) => (c.id === call.id ? { ...c, status: 'in_progress' } : c))
      );
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

  const typeConfig: Record<string, { label: string; icon: typeof BellRing; color: string; badge: string }> = {
    waiter: {
      label: 'Cameriere al Tavolo',
      icon: BellRing,
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
    },
    bill_pos: {
      label: 'Conto con POS / Carta',
      icon: CreditCard,
      color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
      badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/40',
    },
    bill_cash: {
      label: 'Conto in Contanti',
      icon: Banknote,
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40',
    },
    dish_order: {
      label: 'Comanda Cucina',
      icon: UtensilsCrossed,
      color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
      badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40',
    },
    negative_review_alert: {
      label: 'Priorità: Esperienza Negativa',
      icon: ShieldAlert,
      color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25',
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40',
    },
    in_dining_review_alert: {
      label: 'Priorità: Esperienza Negativa',
      icon: ShieldAlert,
      color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25',
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40',
    },
    bill_invoice: {
      label: 'Conto con Fattura Elettronica',
      icon: Receipt,
      color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/25',
      badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/40',
    },
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/4 animate-pulse" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 rounded-xl animate-pulse" />
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
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Chiamate Sala &amp; Richieste Conto
            </h1>
            {calls.length > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 tabular-nums">
                {calls.length} {calls.length === 1 ? 'Attiva' : 'Attive'}
              </span>
            )}
            {isRealtimeLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Live Realtime</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                <span>Connessione...</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Console di servizio duplex per personale di sala e cassa: sincronizzazione istantanea senza ricaricamento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Custom Sound Picker */}
          <button
            type="button"
            onClick={() => {
              hapticTap();
              setShowSoundModal(true);
            }}
            className="px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all touch-press bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs"
            title="Scegli suono chiamate"
          >
            <Music className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">
              {SERVICE_SOUND_OPTIONS.find((s) => s.id === selectedSound)?.name || 'Campanello'}
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all touch-press ${
              soundEnabled
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                : 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200/80 dark:border-zinc-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Audio Attivo' : 'Muto'}</span>
          </button>

          <button
            type="button"
            onClick={loadCallsOnly}
            className="p-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-2xs"
            title="Aggiorna chiamate"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Calls Grid */}
      {calls.length === 0 ? (
        <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.07] bg-white dark:bg-zinc-900/40 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Nessuna chiamata in attesa</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Tutti i tavoli sono serviti. Quando un cliente tocca &ldquo;Chiama Cameriere&rdquo; o &ldquo;Richiedi Conto&rdquo;, il ticket di servizio comparirà qui in tempo reale.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {calls.map((call) => {
            const config = typeConfig[call.type] || typeConfig.waiter;
            const Icon = config.icon;
            const date = new Date(call.created_at);
            const minutesAgo = Math.floor((Date.now() - date.getTime()) / 60000);

            return (
              <div
                key={call.id}
                className="rounded-xl border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0E0F12] p-5 space-y-4 shadow-xs hover:border-zinc-300 dark:hover:border-white/[0.15] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                        {call.table_label}
                      </h2>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border inline-block mt-0.5 ${config.badge}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{minutesAgo < 1 ? 'Adesso' : `${minutesAgo} min fa`}</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Dettaglio Comanda Piatti */}
                {call.type === 'dish_order' && call.order_details && (
                  <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-200/80 dark:border-white/[0.06] space-y-2.5">
                    {/* Lista piatti ordinati con quantità in evidenza */}
                    {call.order_details.items && call.order_details.items.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Portate Ordinate
                        </p>
                        <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                          {call.order_details.items.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[11px] shrink-0 font-mono">
                                  {item.quantity}x
                                </span>
                                <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                  {item.name}
                                </span>
                              </div>
                              <span className="font-mono text-zinc-500 dark:text-zinc-400 text-xs shrink-0 ml-2">
                                {item.price}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Note cliente per la cucina */}
                    {call.order_details.notes && (
                      <div className="p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <MessageSquareText className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div className="min-w-0">
                          <span className="font-semibold block text-[11px] text-amber-800 dark:text-amber-400">
                            Note per la cucina:
                          </span>
                          <span className="break-words">{call.order_details.notes}</span>
                        </div>
                      </div>
                    )}

                    {/* Totale comanda */}
                    {call.order_details.total && (
                      <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-xs text-zinc-500 font-medium">Totale Comanda:</span>
                        <span className="font-mono font-semibold text-sm text-zinc-950 dark:text-zinc-50">
                          {call.order_details.total}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Dettaglio Alert Recensione / Insoddisfazione In-Dining */}
                {(call.type === 'negative_review_alert' || call.type === 'in_dining_review_alert') && call.order_details && (
                  <div className="bg-rose-50 dark:bg-rose-950/30 rounded-lg p-3.5 border border-rose-200/60 dark:border-rose-800/40 space-y-2">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-xs">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Valutazione: {call.order_details.rating || '1-3'} Stelle • Intervento Immediato</span>
                    </div>
                    {call.order_details.notes && (
                      <p className="text-xs text-rose-900 dark:text-rose-200 bg-rose-100/60 dark:bg-rose-900/30 p-2.5 rounded-md italic">
                        &quot;{call.order_details.notes}&quot;
                      </p>
                    )}
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Raggiungete il tavolo per assistere l&apos;ospite prima del pagamento e dell&apos;uscita dal locale.
                    </p>
                  </div>
                )}

                {/* Dettaglio Conto con Fattura Elettronica / Split Bill */}
                {(call.type === 'bill_invoice' || call.order_details?.invoice || (call.order_details?.split_count && call.order_details.split_count > 1)) && (
                  <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-200/80 dark:border-white/[0.06] space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        <div>
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                            {call.order_details?.invoice ? 'Fattura Elettronica Richiesta' : 'Richiesta Conto al Tavolo'}
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {call.order_details?.payment_method === 'cash' ? 'Pagamento in contanti' : 'Pagamento con POS al tavolo'}
                          </span>
                        </div>
                      </div>

                      {call.order_details?.invoice && (
                        <button
                          type="button"
                          onClick={() => handleCopyInvoice(call)}
                          className="px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-[11px] font-medium flex items-center gap-1.5 shadow-2xs transition-all touch-press active:scale-95 cursor-pointer"
                          title="Copia dati fiscali pronti per registratore o software fatture"
                        >
                          {copiedId === call.id ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copiato</span>
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
                      <div className="bg-white dark:bg-zinc-950/70 rounded-md p-3 border border-zinc-200/80 dark:border-white/[0.05] text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase text-zinc-400 font-medium block">Ragione Sociale</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs truncate block">
                              {call.order_details.invoice.companyName || 'Non specificata'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80">
                          <div>
                            <span className="text-[10px] uppercase text-zinc-400 font-medium block">Partita IVA / CF</span>
                            <span className="font-mono text-zinc-900 dark:text-zinc-100 text-[11px] font-medium">
                              {call.order_details.invoice.vatNumber || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-zinc-400 font-medium block">Codice SDI</span>
                            <span className="font-mono text-zinc-900 dark:text-zinc-100 text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 inline-block">
                              {call.order_details.invoice.sdiCode?.toUpperCase() || '0000000'}
                            </span>
                          </div>
                        </div>

                        {call.order_details.invoice.pec && (
                          <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80">
                            <span className="text-[10px] uppercase text-zinc-400 font-medium block">PEC</span>
                            <span className="font-mono text-zinc-600 dark:text-zinc-300 text-[11px] break-all">
                              {call.order_details.invoice.pec}
                            </span>
                          </div>
                        )}

                        {call.order_details.invoice.address && (
                          <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80">
                            <span className="text-[10px] uppercase text-zinc-400 font-medium block">Indirizzo Sede</span>
                            <span className="text-zinc-600 dark:text-zinc-300 text-[11px]">
                              {call.order_details.invoice.address}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dettaglio Divisione Spesa "Alla Romana" */}
                    {call.order_details?.split_count && call.order_details.split_count > 1 && (
                      <div className="flex items-center justify-between p-2 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 text-xs">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                            Conto diviso per <strong>{call.order_details.split_count} persone</strong>
                          </span>
                        </div>
                        {call.order_details.split_quota && (
                          <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                            {call.order_details.split_quota} a quota
                          </span>
                        )}
                      </div>
                    )}

                    {/* Banner Azione Richiesta Smart Bill (POS / Resto) */}
                    {call.order_details?.action_required && (
                      <div className="p-2 rounded-md bg-sky-50 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/40 flex items-center justify-between text-xs">
                        <span className="font-medium text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          <span>{call.order_details.action_required}</span>
                        </span>
                        {call.order_details.change_due && (
                          <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                            Resto: {call.order_details.change_due}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                  {call.status === 'in_progress' ? (
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>Cameriere in Arrivo al Tavolo</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500">In attesa di presa in carico</span>
                  )}

                  <div className="flex items-center gap-2">
                    {call.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleDispatchAttendant(call)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-xs flex items-center gap-1.5 transition-all touch-press active:scale-95 cursor-pointer shadow-2xs"
                        title="Segnala al tavolo che il cameriere sta arrivando con POS o Resto"
                      >
                        <Send className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Invia Cameriere</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleResolve(call.id, call.order_details?.bill_request_id)}
                      className="min-h-[38px] px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs touch-press active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{call.type === 'dish_order' ? 'Comanda Evasa' : 'Saldato / Evadi'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sound Selection Modal */}
      {showSoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Suono Chiamate Sala</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
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
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
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
                    onClick={() => {
                      hapticSelection();
                      setSelectedSound(opt.id);
                      playServiceSound(opt.id);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-2xs'
                        : 'bg-transparent border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-zinc-950 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {opt.name}
                        </span>
                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {opt.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                        {opt.tagline}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Play Preview Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          hapticTap();
                          playServiceSound(opt.id);
                        }}
                        className="p-2 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
                        title="Ascolta anteprima"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>

                      {/* Selection Checkmark */}
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-950'
                            : 'border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  hapticSuccess();
                  setShowSoundModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-100"
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

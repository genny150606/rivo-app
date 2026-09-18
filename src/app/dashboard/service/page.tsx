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
} from 'lucide-react';
import {
  SERVICE_SOUND_OPTIONS,
  ServiceSoundId,
  playServiceSound,
} from '@/lib/service-sounds';
import { hapticTap, hapticSelection, hapticSuccess } from '@/lib/haptics';

interface ServiceCallRecord {
  id: string;
  type: 'waiter' | 'bill_pos' | 'bill_cash' | 'dish_order';
  table_label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  order_details?: {
    items?: Array<{ id?: string; name: string; quantity: number; price: string }>;
    total?: string;
    notes?: string;
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
  const soundEnabledRef = useRef(soundEnabled);
  const selectedSoundRef = useRef(selectedSound);
  const previousCallsCountRef = useRef(0);

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

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch('/api/service', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'completed' }),
      });

      if (res.ok) {
        setCalls((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {
      console.error('Error resolving call:', e);
    }
  };

  const typeConfig: Record<string, { label: string; icon: typeof BellRing; color: string }> = {
    waiter: {
      label: 'Cameriere al Tavolo',
      icon: BellRing,
      color: 'bg-[#BFFF00]/10 text-[#BFFF00] border-[#BFFF00]/30',
    },
    bill_pos: {
      label: 'Conto con POS / Carta',
      icon: CreditCard,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    },
    bill_cash: {
      label: 'Conto in Contanti',
      icon: Banknote,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    dish_order: {
      label: 'Nuovo Ordine Piatti',
      icon: UtensilsCrossed,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl">
        <div className="h-8 bg-zinc-800 rounded w-1/4" />
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#121214] border border-[#27272A] rounded-2xl" />
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
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex flex-wrap items-center gap-2.5">
            <span>Chiamate Sala &amp; Richieste Conto</span>
            {calls.length > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#BFFF00] text-black animate-pulse">
                {calls.length} ATTIVE
              </span>
            )}
            {isRealtimeLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="font-mono text-[11px] tracking-wider uppercase">Live Realtime</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                <span className="font-mono text-[11px] uppercase">Connessione...</span>
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-400">
            Monitor live WebSocket per camerieri e cassa: le chiamate e le comande compaiono all'istante senza ricaricare.
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
            className="p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all touch-press bg-[#18181B] hover:bg-[#27272A] border-[#27272A] text-zinc-300 hover:text-white"
            title="Scegli suono chiamate"
          >
            <Music className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">
              {SERVICE_SOUND_OPTIONS.find((s) => s.id === selectedSound)?.name || 'Campanello'}
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all touch-press ${
              soundEnabled
                ? 'bg-zinc-800 text-[#BFFF00] border-zinc-700'
                : 'bg-[#18181B] text-zinc-500 border-[#27272A]'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Audio Attivo' : 'Muto'}</span>
          </button>

          <button
            type="button"
            onClick={loadCallsOnly}
            className="p-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Calls Grid */}
      {calls.length === 0 ? (
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Nessuna chiamata in attesa</h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Tutti i tavoli sono serviti! Quando un cliente tocca &ldquo;Chiama Cameriere&rdquo; o &ldquo;Richiedi Conto&rdquo;, la scheda comparirà qui istantaneamente.
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
                className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 space-y-4 shadow-xl relative overflow-hidden transition-all hover:border-zinc-700 animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${config.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">
                        {call.table_label}
                      </h2>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-zinc-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{minutesAgo < 1 ? 'Adesso' : `${minutesAgo} min fa`}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Dettaglio Comanda Piatti */}
                {call.type === 'dish_order' && call.order_details && (
                  <div className="bg-[#18181B] rounded-xl p-3.5 border border-[#27272A] space-y-3">
                    {/* Lista piatti ordinati con quantità in evidenza */}
                    {call.order_details.items && call.order_details.items.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Portate Ordinate
                        </p>
                        <div className="divide-y divide-zinc-800/80">
                          {call.order_details.items.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-amber-400 bg-amber-400/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[11px] shrink-0 font-mono">
                                  {item.quantity}x
                                </span>
                                <span className="font-medium text-zinc-200 truncate">
                                  {item.name}
                                </span>
                              </div>
                              <span className="font-mono text-zinc-400 text-xs shrink-0 ml-2">
                                {item.price}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Note cliente per la cucina */}
                    {call.order_details.notes && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                        <MessageSquareText className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        <div className="min-w-0">
                          <span className="font-semibold block text-[11px] text-amber-400">
                            Note per la cucina:
                          </span>
                          <span className="break-words">{call.order_details.notes}</span>
                        </div>
                      </div>
                    )}

                    {/* Totale comanda */}
                    {call.order_details.total && (
                      <div className="pt-2 border-t border-[#27272A] flex items-center justify-between">
                        <span className="text-xs text-zinc-400 font-medium">Totale Comanda:</span>
                        <span className="font-mono font-bold text-sm text-amber-400">
                          {call.order_details.total}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-[#27272A] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleResolve(call.id)}
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-[#BFFF00]/10 touch-press"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{call.type === 'dish_order' ? 'Comanda Evasa / Servita' : 'Servito / Evadi Chiamata'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sound Selection Modal */}
      {showSoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#131614] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Suono Chiamate Sala</h3>
                  <p className="text-xs text-zinc-400">
                    Scegli e ascolta il segnale acustico per cassa e camerieri
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setShowSoundModal(false);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of sound options */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
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
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
                        : 'bg-white/[0.03] border-white/5 hover:border-white/15 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                          {opt.name}
                        </span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-white/10 text-zinc-400">
                          {opt.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight">
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
                        className="p-2 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black text-zinc-300 transition-colors"
                        title="Ascolta anteprima"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>

                      {/* Selection Checkmark */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-amber-500 border-amber-400 text-black'
                            : 'border-zinc-700 bg-black/40 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  hapticSuccess();
                  setShowSoundModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Conferma Suono
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

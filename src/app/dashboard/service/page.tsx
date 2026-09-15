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
  Layers
} from 'lucide-react';

interface ServiceCallRecord {
  id: string;
  type: 'waiter' | 'bill_pos' | 'bill_cash';
  table_label: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

export default function ServiceDashboardPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [calls, setCalls] = useState<ServiceCallRecord[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousCallsCountRef = useRef(0);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadCallsOnly, 5000); // live polling every 5s
    return () => clearInterval(interval);
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

        // If new call came in, trigger web audio chime if sound is enabled
        if (newCalls.length > previousCallsCountRef.current && soundEnabled) {
          playChime();
        }

        previousCallsCountRef.current = newCalls.length;
        setCalls(newCalls);
      }
    } catch (e) {
      console.warn('Polling error:', e);
    }
  }

  function playChime() {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio not available:', e);
    }
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
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2.5">
            <span>Chiamate Sala & Richieste Conto</span>
            {calls.length > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#BFFF00] text-black animate-pulse">
                {calls.length} ATTIVE
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-400">
            Monitor in tempo reale per camerieri e cassa: evadi le chiamate con un tocco.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

                <div className="pt-2 border-t border-[#27272A] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleResolve(call.id)}
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-[#BFFF00]/10 touch-press"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Servito / Evadi Chiamata</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

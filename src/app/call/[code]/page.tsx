'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BellRing, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CallPageProps {
  params: Promise<{ code: string }>;
}

export default function CallServicePage({ params }: CallPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code ? resolvedParams.code.toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<{
    id: string;
    name: string;
    organization_id: string;
    destination_url: string;
  } | null>(null);
  const [org, setOrg] = useState<{
    name: string;
    logo_url: string | null;
  } | null>(null);

  const [activeRequest, setActiveRequest] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requestedTime, setRequestedTime] = useState<Date | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!code) {
        setLoading(false);
        return;
      }

      const { data: dev } = await supabase
        .from('devices')
        .select('id, name, organization_id, destination_url, status')
        .eq('unique_code', code)
        .single();

      if (dev) {
        setDevice(dev);
        if (dev.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name, logo_url')
            .eq('id', dev.organization_id)
            .single();
          if (orgData) setOrg(orgData);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [code]);

  const handleCall = async (type: 'waiter' | 'bill_pos' | 'bill_cash') => {
    if (!device) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: device.organization_id,
          device_id: device.id,
          type,
          table_label: device.name || `Tavolo (${code})`,
        }),
      });

      if (res.ok) {
        setActiveRequest(type);
        setRequestedTime(new Date());
      }
    } catch (e) {
      console.warn('Call error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] text-white flex items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#18181B] border border-[#27272A] flex items-center justify-center animate-pulse">
          <BellRing className="w-7 h-7 text-[#BFFF00] animate-bounce" />
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl border border-red-500/20 bg-red-500/10 flex items-center justify-center mb-3 text-red-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold">Dispositivo non trovato</h2>
        <p className="text-xs text-zinc-400 max-w-xs mb-4">Questo chip non risulta attivo o registrato.</p>
        <Link
          href={`/hub/${code}`}
          className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-semibold"
        >
          Torna all&apos;Hub
        </Link>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    waiter: 'Cameriere chiamato',
    bill_pos: 'Conto con POS richiesto',
    bill_cash: 'Conto in Contanti richiesto',
  };

  return (
    <div className="min-h-screen min-h-dvh h-screen sm:h-dvh bg-[#09090B] text-zinc-100 flex flex-col justify-between p-3 sm:p-5 overflow-y-auto relative selection:bg-[#BFFF00] selection:text-black">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#BFFF00]/10 blur-[100px] pointer-events-none rounded-full" />

      {/* TOP NAVIGATION BAR: RETURN TO HUB */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between z-10 pt-1 pb-2">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all active:scale-95 min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4 text-[#BFFF00]" />
          <span>Torna all&apos;Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
          <span className="text-white font-medium">{device.name}</span>
        </span>
      </nav>

      {/* MAIN CONTENT CARD */}
      <main className="max-w-md w-full mx-auto my-auto py-2 z-10 space-y-3">
        {/* Title Info */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {org?.name || 'Servizio di Sala'}
          </h1>
          <p className="text-xs text-zinc-400">
            Invia una notifica istantanea allo staff del locale
          </p>
        </div>

        {/* ACTIVE REQUEST CONFIRMATION */}
        {activeRequest ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 to-[#121214] p-5 text-center space-y-3 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {typeLabels[activeRequest]}!
              </h2>
              <p className="text-xs text-zinc-300 mt-1">
                La sala ha ricevuto l&apos;alert per <strong>{device.name}</strong>. Il cameriere arriverà a breve.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 bg-black/50 px-3 py-1 rounded-full border border-zinc-800">
              <Clock className="w-3 h-3 text-[#BFFF00]" />
              <span>Inviato alle {requestedTime?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href={`/hub/${code}`}
                className="w-full py-2.5 rounded-xl bg-[#BFFF00] hover:bg-[#a8e000] text-black font-bold text-xs transition-all shadow-lg shadow-[#BFFF00]/20 flex items-center justify-center gap-1.5"
              >
                <span>Torna all&apos;Hub dei Servizi</span>
              </Link>
              <button
                type="button"
                onClick={() => setActiveRequest(null)}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 underline py-1"
              >
                Invia un&apos;altra richiesta
              </button>
            </div>
          </div>
        ) : (
          /* ACTION CARDS (3 OPTIONS) */
          <div className="space-y-2.5">
            {/* Action 1: Call Waiter */}
            <button
              type="button"
              onClick={() => handleCall('waiter')}
              disabled={submitting}
              className="w-full text-left rounded-2xl border border-white/10 bg-gradient-to-r from-red-500/10 via-[#18181B] to-transparent hover:border-red-500/40 p-3.5 sm:p-4 transition-all flex items-center justify-between group touch-press active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">Chiama Cameriere</h3>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-semibold">Tavolo</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Richiedi assistenza immediata del personale</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            {/* Action 2: Bill POS */}
            <button
              type="button"
              onClick={() => handleCall('bill_pos')}
              disabled={submitting}
              className="w-full text-left rounded-2xl border border-white/10 bg-gradient-to-r from-blue-500/10 via-[#18181B] to-transparent hover:border-blue-500/40 p-3.5 sm:p-4 transition-all flex items-center justify-between group touch-press active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">Conto con POS</h3>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold">Carte/Apple Pay</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Porta il terminale per il pagamento elettronico</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            {/* Action 3: Bill Cash */}
            <button
              type="button"
              onClick={() => handleCall('bill_cash')}
              disabled={submitting}
              className="w-full text-left rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/10 via-[#18181B] to-transparent hover:border-emerald-500/40 p-3.5 sm:p-4 transition-all flex items-center justify-between group touch-press active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">Conto in Contanti</h3>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Cassa</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Richiedi conto cartaceo per contanti</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-md mx-auto text-center pb-2 text-[11px] text-zinc-600 flex items-center justify-center gap-1">
        <span>Gestione Sala Smart • Powered by </span>
        <strong className="text-zinc-400 font-semibold">RIVO</strong>
      </footer>
    </div>
  );
}

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
  ExternalLink,
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
      <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 rounded-2xl border border-[#27272A] bg-[#121214] text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto" />
          <div className="h-5 bg-zinc-800 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-zinc-800 rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 rounded-2xl border border-red-500/20 bg-[#18181B] text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <h2 className="text-lg font-semibold">Tavolo non trovato</h2>
          <p className="text-xs text-zinc-400">Questo chip non risulta attivo.</p>
        </div>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    waiter: 'Cameriere chiamato',
    bill_pos: 'Conto con POS richiesto',
    bill_cash: 'Conto in Contanti richiesto',
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#BFFF00]/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="max-w-md w-full mx-auto text-center pt-6 sm:pt-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18181B] border border-[#27272A] text-[11px] font-medium text-[#BFFF00] mb-3">
          <span className="w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
          <span>Servizio al Tavolo</span>
        </span>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {org?.name || 'RIVO Hospitality'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          {device.name} • Cosa desideri richiedere?
        </p>
      </div>

      {/* Main interactive area */}
      <div className="max-w-md w-full mx-auto my-auto py-6 space-y-4">
        {activeRequest ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-4 shadow-xl animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                {typeLabels[activeRequest]}!
              </h2>
              <p className="text-xs text-zinc-300 mt-1">
                La sala ha ricevuto la segnalazione per <strong>{device.name}</strong>. Un cameriere arriverà a breve.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-xs text-zinc-400 bg-black/40 px-3 py-1.5 rounded-full border border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-[#BFFF00]" />
              <span>Inviato alle {requestedTime?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveRequest(null)}
                className="text-xs text-zinc-400 hover:text-white underline"
              >
                Invia un&apos;altra richiesta &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Action 1: Call Waiter */}
            <button
              type="button"
              onClick={() => handleCall('waiter')}
              disabled={submitting}
              className="w-full text-left rounded-2xl border border-[#27272A] bg-[#121214] hover:border-[#BFFF00]/50 hover:bg-[#18181B] p-5 transition-all flex items-center justify-between group touch-press"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#BFFF00]/10 text-[#BFFF00] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <BellRing className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Chiama Cameriere
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Ordinare qualcosa o richiedere assistenza
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-[#BFFF00] transition-colors" />
            </button>

            {/* Action 2: Bill POS */}
            <button
              type="button"
              onClick={() => handleCall('bill_pos')}
              disabled={submitting}
              className="w-full text-left rounded-2xl border border-[#27272A] bg-[#121214] hover:border-blue-500/50 hover:bg-[#18181B] p-5 transition-all flex items-center justify-between group touch-press"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Richiedi Conto (POS / Carta)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Il personale porterà il POS al tavolo
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition-colors" />
            </button>

            {/* Action 3: Bill Cash */}
            <button
              type="button"
              onClick={() => handleCall('bill_cash')}
              disabled={submitting}
              className="w-full text-left rounded-2xl border border-[#27272A] bg-[#121214] hover:border-emerald-500/50 hover:bg-[#18181B] p-5 transition-all flex items-center justify-between group touch-press"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Richiedi Conto (Contanti)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Conto cartaceo con pagamento in contanti
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
            </button>
          </div>
        )}

        {/* Secondary link to review */}
        <div className="text-center pt-2">
          <Link
            href={`/review/${code}`}
            className="text-xs text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1"
          >
            <span>Vuoi lasciare una recensione? Clicca qui</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center pb-4 text-[11px] text-zinc-600">
        <span>Gestione Sala Smart • Powered by </span>
        <strong className="text-zinc-400 font-semibold">RIVO</strong>
      </footer>
    </div>
  );
}

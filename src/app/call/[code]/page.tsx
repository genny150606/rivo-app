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
  ChevronRight,
  Receipt,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import SmartBillModal from '@/components/SmartBillModal';
import { 
  cacheLocalHubData, 
  getLocalHubData, 
  enqueueOutboxItem, 
  initOfflineSyncListeners 
} from '@/lib/offline-outbox';

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
  const [isOfflineRequest, setIsOfflineRequest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingType, setSubmittingType] = useState<string | null>(null);
  const [requestedTime, setRequestedTime] = useState<Date | null>(null);
  const [showBillModal, setShowBillModal] = useState<boolean>(false);

  // Initialize offline sync listeners for auto-drain
  useEffect(() => {
    const cleanup = initOfflineSyncListeners();
    return cleanup;
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      if (!code) {
        setLoading(false);
        return;
      }

      // Check IndexedDB local cache for 0ms initial render
      try {
        const cached = await getLocalHubData(code);
        if (cached && !isCancelled) {
          if (cached.device) setDevice(cached.device);
          if (cached.org) setOrg(cached.org);
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setLoading(false);
            return;
          }
        }
      } catch (cacheErr) {
        console.warn('[Offline] Cache load in call page:', cacheErr);
      }

      try {
        const { data: dev } = await supabase
          .from('devices')
          .select('id, name, organization_id, destination_url, status')
          .eq('unique_code', code)
          .single();

        if (dev && !isCancelled) {
          setDevice(dev);
          let fetchedOrg: { name: string; logo_url: string | null } | null = null;
          if (dev.organization_id) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('name, logo_url')
              .eq('id', dev.organization_id)
              .single();
            if (orgData && !isCancelled) {
              fetchedOrg = orgData;
              setOrg(orgData);
            }
          }

          // Cache locally for instant next renders
          await cacheLocalHubData(code, {
            device: dev,
            org: fetchedOrg,
          });
        }
      } catch (err) {
        console.warn('Network load in call error:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [code]);

  const handleCall = async (type: 'waiter' | 'bill_pos' | 'bill_cash') => {
    if (!device) return;
    setSubmitting(true);
    setSubmittingType(type);

    const callPayload = {
      organization_id: device.organization_id,
      device_id: device.id,
      type,
      table_label: device.name || `Tavolo (${code})`,
    };

    // If offline before fetch
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        await enqueueOutboxItem({
          type: 'call',
          url: '/api/service',
          body: callPayload,
        });
        setIsOfflineRequest(true);
        setActiveRequest(type);
        setRequestedTime(new Date());
      } catch (enqueueErr) {
        console.warn('Failed to enqueue call offline:', enqueueErr);
      } finally {
        setSubmitting(false);
        setSubmittingType(null);
      }
      return;
    }

    try {
      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callPayload),
      });

      if (res.ok) {
        setIsOfflineRequest(false);
        setActiveRequest(type);
        setRequestedTime(new Date());
      } else {
        throw new Error('Service response not ok');
      }
    } catch (e: unknown) {
      console.warn('Call error:', e);
      const isNetworkError =
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        (e instanceof TypeError) ||
        (e instanceof Error && /network|fetch|failed to fetch/i.test(e.message));

      if (isNetworkError) {
        try {
          await enqueueOutboxItem({
            type: 'call',
            url: '/api/service',
            body: callPayload,
          });
          // Reassure the guest with active confirmation
          setIsOfflineRequest(true);
          setActiveRequest(type);
          setRequestedTime(new Date());
        } catch (enqueueErr) {
          console.warn('Failed to enqueue call on network error:', enqueueErr);
        }
      }
    } finally {
      setSubmitting(false);
      setSubmittingType(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] text-white flex items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#111114] border border-[#27272A] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#BFFF00] animate-spin motion-reduce:animate-none" />
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
          className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-white/20 text-white text-xs font-semibold inline-flex items-center justify-center"
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
    <div className="min-h-screen min-h-dvh bg-[#09090B] text-[#FAFAFA] flex flex-col justify-between p-4 sm:p-5 overflow-x-hidden relative selection:bg-[#BFFF00] selection:text-[#09090B]">
      {/* TOP NAVIGATION BAR: RETURN TO HUB */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between gap-2 z-10 pb-2">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3.5 min-h-[48px] rounded-xl bg-[#111114] hover:bg-[#18181B] border border-[#27272A] text-xs font-semibold text-zinc-200 hover:text-white transition-colors active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 text-[#BFFF00]" />
          <span>Torna all&apos;Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full bg-[#111114] border border-[#27272A] text-[11px] font-mono text-zinc-400 truncate max-w-[170px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-white font-semibold truncate">{device.name}</span>
        </span>
      </nav>

      {/* MAIN CONTENT CARD */}
      <main className="max-w-md w-full mx-auto my-auto py-3 z-10 space-y-4">
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
          <div className="rounded-2xl border border-emerald-500/40 bg-[#111114] p-5 sm:p-6 text-center space-y-4 shadow-2xl animate-fade-in relative overflow-hidden">
            {/* Sonar / Radar Wave Central Icon with Swinging Bell */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center my-1">
              <div className="absolute inset-2 rounded-full border-2 border-emerald-400/60 bg-emerald-400/10 animate-radar-wave-1 motion-reduce:hidden pointer-events-none" />
              <div className="absolute inset-2 rounded-full border-2 border-[#BFFF00]/50 bg-[#BFFF00]/10 animate-radar-wave-2 motion-reduce:hidden pointer-events-none" />

              <div className="relative z-10 w-16 h-16 rounded-full bg-[#18181B] border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-lg">
                <BellRing className="w-8 h-8 text-[#BFFF00] animate-bell-swing motion-reduce:animate-none origin-top" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-[#09090B] flex items-center justify-center border-2 border-[#111114] shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>
            </div>

            {/* Badge di stato pulsante */}
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs ${isOfflineRequest ? 'bg-amber-500/10 border-amber-500/35 text-amber-300' : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300'}`}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping motion-reduce:hidden absolute inline-flex h-full w-full rounded-full ${isOfflineRequest ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOfflineRequest ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                </span>
                <span className="font-semibold tracking-tight">
                  {isOfflineRequest ? 'Richiesta salvata offline • Coda Outbox' : 'Segnale ricevuto dallo staff • In arrivo'}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                {typeLabels[activeRequest] || 'Richiesta ricevuta'}!
              </h2>
              <p className="text-xs text-zinc-300 mt-1 max-w-xs mx-auto leading-relaxed">
                {isOfflineRequest
                  ? `Richiesta memorizzata per ${device.name}. Verrà recapitata allo staff non appena si riaggancia la linea.`
                  : <>La sala ha ricevuto l&apos;alert per <strong>{device.name}</strong>. Il cameriere arriverà a breve.</>}
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-zinc-300 bg-[#09090B] px-3 py-1 rounded-full border border-[#27272A]">
              <Clock className="w-3 h-3 text-[#BFFF00]" />
              <span>Inviato alle {requestedTime?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href={`/hub/${code}`}
                className="w-full min-h-[48px] rounded-xl bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-[#BFFF00]/20 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Torna all&apos;Hub dei Servizi</span>
              </Link>
              <button
                type="button"
                onClick={() => setActiveRequest(null)}
                className="min-h-[44px] text-xs text-zinc-400 hover:text-white underline py-1 active:scale-95 transition-colors cursor-pointer"
              >
                Invia un&apos;altra richiesta
              </button>
            </div>
          </div>
        ) : (
          /* ACTION CARDS */
          <div className="space-y-3">
            {/* Action 0: Split Bill & Electronic Invoice */}
            <button
              type="button"
              onClick={() => {
                setShowBillModal(true);
              }}
              disabled={submitting}
              className="w-full min-h-[68px] text-left rounded-2xl border border-cyan-500/45 bg-[#111114] hover:bg-[#18181B] hover:border-cyan-400 p-4 transition-all flex items-center justify-between gap-3 group active:scale-[0.98] shadow-xl cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 flex items-center justify-center shrink-0">
                  <Receipt className="w-6 h-6 text-cyan-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-white">Chiedi il Conto / Fattura</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                      Alla Romana
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#BFFF00]/20 text-[#BFFF00] font-semibold border border-[#BFFF00]/30">
                      Fattura SDI
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5">
                    Calcola quota per persona e compila i dati fiscali con QR AdE
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors shrink-0" />
            </button>

            {/* Action 1: Call Waiter */}
            <button
              type="button"
              onClick={() => handleCall('waiter')}
              disabled={submitting}
              className="w-full min-h-[64px] text-left rounded-2xl border border-[#27272A] bg-[#111114] hover:bg-[#18181B] hover:border-red-500/45 p-4 transition-all flex items-center justify-between gap-3 group active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 flex items-center justify-center shrink-0">
                  {submitting && submittingType === 'waiter' ? (
                    <BellRing className="w-5 h-5 animate-bell-swing motion-reduce:animate-none text-[#BFFF00]" />
                  ) : (
                    <BellRing className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">Chiama Cameriere</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold">Tavolo</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {submitting && submittingType === 'waiter' ? 'Invio segnale alla sala...' : 'Richiedi assistenza immediata del personale'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
            </button>

            {/* Action 2: Bill POS */}
            <button
              type="button"
              onClick={() => handleCall('bill_pos')}
              disabled={submitting}
              className="w-full min-h-[64px] text-left rounded-2xl border border-[#27272A] bg-[#111114] hover:bg-[#18181B] hover:border-sky-500/45 p-4 transition-all flex items-center justify-between gap-3 group active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">Conto Rapido POS</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold">Carte/Apple Pay</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {submitting && submittingType === 'bill_pos' ? 'Invio segnale alla cassa...' : 'Porta il terminale per il pagamento elettronico'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
            </button>

            {/* Action 3: Bill Cash */}
            <button
              type="button"
              onClick={() => handleCall('bill_cash')}
              disabled={submitting}
              className="w-full min-h-[64px] text-left rounded-2xl border border-[#27272A] bg-[#111114] hover:bg-[#18181B] hover:border-emerald-500/45 p-4 transition-all flex items-center justify-between gap-3 group active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">Conto Rapido Contanti</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Cassa</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {submitting && submittingType === 'bill_cash' ? 'Invio segnale alla cassa...' : 'Richiedi conto cartaceo per contanti'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0" />
            </button>
          </div>
        )}
      </main>

      {/* Smart Bill & Invoice Modal */}
      {device && device.organization_id && (
        <SmartBillModal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          organizationId={device.organization_id}
          deviceId={device.id}
          tableLabel={device.name || `Tavolo ${code}`}
          onSuccess={() => {
            setActiveRequest('bill_invoice');
            setRequestedTime(new Date());
          }}
        />
      )}

      {/* Hardware RIVO Footer Badge */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111114] border border-[#27272A] text-[11px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
          <span>Gestione Sala Smart • Powered by</span>
          <strong className="text-white font-bold tracking-wide">RIVO</strong>
        </div>
      </footer>
    </div>
  );
}

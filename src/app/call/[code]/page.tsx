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
  ChevronRight,
  Receipt,
  Users,
  Wifi,
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
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 via-[#121214] to-[#121214] p-5 sm:p-6 text-center space-y-4 shadow-2xl animate-fade-in relative overflow-hidden">
            {/* Background ambient radial glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 blur-[50px] pointer-events-none rounded-full" />

            {/* Sonar / Radar Wave Central Icon with Swinging Bell */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center my-1">
              {/* Radar concentric wave 1 */}
              <div className="absolute inset-2 rounded-full border-2 border-emerald-400/60 bg-emerald-400/10 animate-radar-wave-1 pointer-events-none" />
              {/* Radar concentric wave 2 */}
              <div className="absolute inset-2 rounded-full border-2 border-[#BFFF00]/50 bg-[#BFFF00]/10 animate-radar-wave-2 pointer-events-none" />

              {/* Central glowing container with swinging bell */}
              <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500/30 via-zinc-900 to-[#BFFF00]/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <BellRing className="w-8 h-8 text-[#BFFF00] animate-bell-swing origin-top" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center border-2 border-[#121214] shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />
                </span>
              </div>
            </div>

            {/* Badge di stato pulsante ("Segnale ricevuto dallo staff • In arrivo" o fallback offline) */}
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs shadow-inner ${isOfflineRequest ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOfflineRequest ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOfflineRequest ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                </span>
                <span className="font-semibold tracking-tight">
                  {isOfflineRequest ? 'Richiesta salvata offline • Coda Outbox' : 'Segnale ricevuto dallo staff • In arrivo'}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {typeLabels[activeRequest]}!
              </h2>
              <p className="text-xs text-zinc-300 mt-1 max-w-xs mx-auto">
                {isOfflineRequest 
                  ? `Richiesta memorizzata per ${device.name}. Verrà recapitata allo staff non appena si riaggancia la linea.` 
                  : <>La sala ha ricevuto l&apos;alert per <strong>{device.name}</strong>. Il cameriere arriverà a breve.</>}
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 bg-black/50 px-3 py-1 rounded-full border border-zinc-800">
              <Clock className="w-3 h-3 text-[#BFFF00]" />
              <span>Inviato alle {requestedTime?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href={`/hub/${code}`}
                className="w-full py-2.5 rounded-xl bg-[#BFFF00] hover:bg-[#a8e000] text-black font-bold text-xs transition-all shadow-lg shadow-[#BFFF00]/20 flex items-center justify-center gap-1.5 touch-press active:scale-95"
              >
                <span>Torna all&apos;Hub dei Servizi</span>
              </Link>
              <button
                type="button"
                onClick={() => setActiveRequest(null)}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 underline py-1 touch-press active:scale-95 transition-transform"
              >
                Invia un&apos;altra richiesta
              </button>
            </div>
          </div>
        ) : (
          /* ACTION CARDS */
          <div className="space-y-2.5">
            {/* Action 0: Split Bill & Electronic Invoice (Feature Killer) */}
            <button
              type="button"
              onClick={() => {
                setShowBillModal(true);
              }}
              disabled={submitting}
              className="w-full text-left rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 via-[#18181B] to-[#121214] hover:border-cyan-400 p-4 transition-all flex items-center justify-between group touch-press active:scale-95 shadow-xl shadow-cyan-500/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 blur-xl pointer-events-none rounded-full" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Receipt className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-white">Chiedi il Conto / Fattura</h3>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                      Alla Romana
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#BFFF00]/20 text-[#BFFF00] font-semibold border border-[#BFFF00]/30">
                      Fattura SDI
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5">
                    Calcola quota per persona e compila i dati fiscali con QR AdE
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors shrink-0 relative z-10" />
            </button>

            {/* Action 1: Call Waiter */}
            <button
              type="button"
              onClick={() => handleCall('waiter')}
              disabled={submitting}
              className="w-full text-left rounded-2xl border border-white/10 bg-gradient-to-r from-red-500/10 via-[#18181B] to-transparent hover:border-red-500/40 p-3.5 sm:p-4 transition-all flex items-center justify-between group touch-press active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {submitting && submittingType === 'waiter' ? (
                    <>
                      <span className="absolute inset-0 rounded-xl border border-red-400/80 animate-radar-wave-1 pointer-events-none" />
                      <span className="absolute inset-0 rounded-xl border border-red-400/50 animate-radar-wave-2 pointer-events-none" />
                      <BellRing className="w-5 h-5 animate-bell-swing text-[#BFFF00]" />
                    </>
                  ) : (
                    <BellRing className="w-5 h-5 group-hover:animate-bell-swing" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">Chiama Cameriere</h3>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-semibold">Tavolo</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {submitting && submittingType === 'waiter' ? 'Invio segnale alla sala...' : 'Richiedi assistenza immediata del personale'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            {/* Action 2: Bill POS */}
            <button
              type="button"
              onClick={() => handleCall('bill_pos')}
              disabled={submitting}
              className="w-full text-left rounded-2xl border border-white/10 bg-gradient-to-r from-blue-500/10 via-[#18181B] to-transparent hover:border-blue-500/40 p-3.5 sm:p-4 transition-all flex items-center justify-between group touch-press active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {submitting && submittingType === 'bill_pos' ? (
                    <>
                      <span className="absolute inset-0 rounded-xl border border-blue-400/80 animate-radar-wave-1 pointer-events-none" />
                      <span className="absolute inset-0 rounded-xl border border-blue-400/50 animate-radar-wave-2 pointer-events-none" />
                      <CreditCard className="w-5 h-5 animate-pulse text-blue-300" />
                    </>
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">Conto Rapido POS</h3>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold">Carte/Apple Pay</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {submitting && submittingType === 'bill_pos' ? 'Invio segnale alla cassa...' : 'Porta il terminale per il pagamento elettronico'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            {/* Action 3: Bill Cash */}
            <button
              type="button"
              onClick={() => handleCall('bill_cash')}
              disabled={submitting}
              className="w-full text-left rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/10 via-[#18181B] to-transparent hover:border-emerald-500/40 p-3.5 sm:p-4 transition-all flex items-center justify-between group touch-press active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {submitting && submittingType === 'bill_cash' ? (
                    <>
                      <span className="absolute inset-0 rounded-xl border border-emerald-400/80 animate-radar-wave-1 pointer-events-none" />
                      <span className="absolute inset-0 rounded-xl border border-emerald-400/50 animate-radar-wave-2 pointer-events-none" />
                      <Banknote className="w-5 h-5 animate-pulse text-emerald-300" />
                    </>
                  ) : (
                    <Banknote className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white">Conto Rapido Contanti</h3>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Cassa</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {submitting && submittingType === 'bill_cash' ? 'Invio segnale alla cassa...' : 'Richiedi conto cartaceo per contanti'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
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

      {/* Minimal Footer */}
      <footer className="w-full max-w-md mx-auto text-center pb-2 text-[11px] text-zinc-600 flex items-center justify-center gap-1">
        <span>Gestione Sala Smart • Powered by </span>
        <strong className="text-zinc-400 font-semibold">RIVO</strong>
      </footer>
    </div>
  );
}

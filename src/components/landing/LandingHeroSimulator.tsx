'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { 
  Smartphone, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  CreditCard, 
  Receipt, 
  Zap, 
  Activity, 
  Radio, 
  ShieldCheck, 
  BellRing,
  QrCode,
  Users,
  ChevronRight,
  TrendingUp,
  Wifi
} from 'lucide-react';

type SimulationMode = 'bill' | 'review' | 'wallet';

export default function LandingHeroSimulator() {
  const [mode, setMode] = useState<SimulationMode>('bill');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [packetPosition, setPacketPosition] = useState(0);

  const triggerCelebration = (modeType: SimulationMode) => {
    if (typeof window === 'undefined') return;

    if (modeType === 'review') {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#F59E0B', '#FBBF24', '#FFFFFF', '#FCD34D'],
        ticks: 200,
      });
    } else if (modeType === 'wallet') {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#6366F1', '#818CF8', '#A78BFA', '#10B981'],
        ticks: 200,
      });
    } else {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.65 },
        colors: ['#10B981', '#34D399', '#6EE7B7'],
        ticks: 180,
      });
    }
  };

  const handleSelectMode = (newMode: SimulationMode) => {
    setMode(newMode);
    setIsTransmitting(true);
    setPacketPosition(0);
    triggerCelebration(newMode);

    setTimeout(() => {
      setIsTransmitting(false);
    }, 1200);
  };

  return (
    <section className="relative pt-28 sm:pt-36 pb-20 px-4 sm:px-6 overflow-hidden">
      {/* Background radial ambient lights with breathing glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-ambient-drift-1" />
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-[450px] h-[450px] bg-emerald-500/12 rounded-full blur-[120px] pointer-events-none -z-10 animate-ambient-drift-2" />

      <div className="max-w-6xl mx-auto">
        {/* Top Announcement Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-medium text-slate-300 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:border-emerald-500/40 transition-colors animate-float-gentle">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-white font-semibold">RIVO 2.0</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Nuovo Motore Unificato per Tavoli e Cassa</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-4xl mx-auto space-y-5 mb-10">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.04]">
            Il Sistema Operativo <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Fisico-Digitale
            </span>{' '}
            per Ristorazione e Retail.
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Elimina 6 abbonamenti disconnessi. Connetti tavoli fisici, cassa e magazzino al Cloud in <span className="text-white font-medium">0.4 secondi</span> con NFC, comande smart, recensioni 5★ su Google e Apple Wallet nativo.
          </p>

          {/* Primary Action Row with tactile press and subtle sheen */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="#lead-capture"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-slate-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] active:scale-[0.98] relative overflow-hidden group touch-press"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span>Richiedi Dimostrazione Gratuita</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>

            <Link
              href="/demo/retail"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold text-sm border border-white/[0.12] hover:border-white/[0.25] transition-all active:scale-[0.98] group touch-press"
            >
              <Sparkles className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
              <span>Esplora Demo Retail Live</span>
            </Link>
          </div>

          {/* Trust Stat Ticker with Hover Glow */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-white/[0.06]">
            <div className="text-center p-2 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">&lt;0.4s</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">Latenza Tap-to-Cloud</div>
            </div>
            <div className="text-center p-2 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums">99.98%</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">Uptime Offline Outbox</div>
            </div>
            <div className="text-center p-2 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">340+</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">Punti Vendita Attivi</div>
            </div>
            <div className="text-center p-2 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="text-xl sm:text-2xl font-bold text-amber-400 tabular-nums">4.9 / 5.0</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">Rating Medio Google</div>
            </div>
          </div>
        </div>

        {/* =========================================================
            INTERACTIVE "TAP-TO-CLOUD" SPLIT SIMULATOR
            ========================================================= */}
        <div id="ecosistema" className="mt-12 rounded-3xl p-4 sm:p-6 lg:p-8 bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] relative overflow-hidden group">
          {/* Subtle perimeter border sheen */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          
          {/* Header of the Simulator */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08] relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-mono bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded">
                  SIMULATORE LIVE
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Feedback Bidirezionale Fisico ➔ Cloud
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mt-1">
                Fai un Tap sulla sinistra: osserva la Dashboard reagire istantaneamente.
              </h2>
            </div>

            {/* Interactive Mode Selectors with Tactile Physics */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSelectMode('bill')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 active:scale-[0.96] touch-press ${
                  mode === 'bill'
                    ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/40'
                    : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] border border-white/[0.08]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>1. Chiedi Conto Smart</span>
              </button>

              <button
                onClick={() => handleSelectMode('review')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 active:scale-[0.96] touch-press ${
                  mode === 'review'
                    ? 'bg-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] ring-2 ring-amber-400/40'
                    : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] border border-white/[0.08]'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>2. Recensione 5★ con AI</span>
              </button>

              <button
                onClick={() => handleSelectMode('wallet')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 active:scale-[0.96] touch-press ${
                  mode === 'wallet'
                    ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] ring-2 ring-indigo-400/40'
                    : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] border border-white/[0.08]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>3. Carta Apple Wallet</span>
              </button>
            </div>
          </div>

          {/* Animated data transfer packet indicator */}
          {isTransmitting && (
            <div className="absolute top-1/2 left-1/3 -translate-y-1/2 z-30 pointer-events-none hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500 text-zinc-950 text-xs font-mono font-bold shadow-[0_0_30px_rgba(16,185,129,0.8)] animate-data-stream">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>NFC Handshake 380ms ➔ Cloud Sincronizzato</span>
            </div>
          )}

          {/* Split Body: Left Phone + Right Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch relative z-10">
            {/* LEFT SIDE: Il Mondo Fisico & Mobile (Span 5) */}
            <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-[#08090D] border border-white/[0.06] relative overflow-hidden group/phone animate-float-slow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Dispositivo Ospite (Zero App)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>NFC 424 DNA Rilevato</span>
                </div>
              </div>

              {/* iPhone Mockup Frame with Specular Highlight and Dynamic Notch */}
              <div className="mx-auto w-full max-w-[280px] bg-zinc-950 rounded-[32px] p-2.5 border-[3px] border-zinc-700 shadow-2xl relative transition-transform duration-300 group-hover/phone:scale-[1.02]">
                {/* Dynamic Island with micro camera */}
                <div className="w-20 h-4 bg-black rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-900 ml-auto mr-1.5" />
                </div>

                {/* Screen Content depending on active mode */}
                <div className="bg-[#0B0C10] rounded-[24px] p-4 text-left border border-white/[0.08] min-h-[360px] flex flex-col justify-between shadow-inner">
                  {mode === 'bill' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="text-xs font-bold text-white">Tavolo 14</span>
                        <span className="badge-mono text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                          Servizio Aperto
                        </span>
                      </div>
                      <div className="text-center py-2">
                        <div className="text-[11px] text-slate-400">Totale Conto</div>
                        <div className="text-3xl font-bold text-white tabular-nums mt-0.5 font-mono">€48,50</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-1">2 Calici Nebbiolo + 2 Pizze Gourmet</div>
                      </div>
                      <div className="space-y-1.5 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>Divisione Conto:</span>
                          <span className="font-semibold text-white font-mono">€24,25 a persona</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Ricevuta / Fattura SDI:</span>
                          <span className="text-emerald-400 font-medium">Inclusa</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerCelebration('bill')}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-[0.97] transition-all touch-press"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Paga o Chiama POS al Tavolo</span>
                      </button>
                    </div>
                  )}

                  {mode === 'review' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="text-xs font-bold text-white">Google Business Hub</span>
                        <span className="badge-mono text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                          Review Shield™
                        </span>
                      </div>
                      <div className="text-center py-2">
                        <div className="text-[11px] text-slate-400">Come è stata la tua esperienza?</div>
                        <div className="flex justify-center gap-1.5 text-amber-400 my-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-5 h-5 fill-current text-amber-400 animate-star-twinkle" style={{ animationDelay: `${s * 200}ms` }} />
                          ))}
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Reindirizzamento Diretto Google
                        </span>
                      </div>
                      <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06] text-[11px] text-slate-300 italic">
                        &quot;Pizza eccellente con impasto leggerissimo e servizio ultrarapido. La gestione del conto con tap dal tavolo è geniale!&quot;
                      </div>
                      <button 
                        onClick={() => triggerCelebration('review')}
                        className="w-full py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-[0.97] transition-all touch-press"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Copia e Pubblica su Google</span>
                      </button>
                    </div>
                  )}

                  {mode === 'wallet' && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="text-xs font-bold text-white">Apple Wallet Pass</span>
                        <span className="badge-mono text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                          Zero Download App
                        </span>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/40 p-3 rounded-xl border border-indigo-500/30 text-white shadow-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[9px] uppercase tracking-wider text-indigo-300">Carta Fedeltà Privilegi</div>
                            <div className="text-sm font-bold mt-0.5">RIVO Club VIP</div>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-400">6 / 10 Timbri</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 mt-3">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
                            <div
                              key={idx}
                              className={`h-5 rounded-md flex items-center justify-center text-[9px] font-bold ${
                                idx <= 6
                                  ? 'bg-emerald-500 text-zinc-950 font-mono shadow-xs animate-stamp-bounce'
                                  : 'bg-white/10 text-white/40 border border-white/10'
                              }`}
                            >
                              {idx <= 6 ? '✓' : idx}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 text-center">
                        Prossimo premio: <span className="text-white font-semibold">Calice Spumante o Dessert</span> al 10° timbro.
                      </div>
                      <button 
                        onClick={() => triggerCelebration('wallet')}
                        className="w-full py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-white/20 active:scale-[0.97] transition-all touch-press"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Aggiungi ad Apple Wallet</span>
                      </button>
                    </div>
                  )}

                  {/* Micro NFC hardware cue */}
                  <div className="pt-2 text-center border-t border-white/[0.06]">
                    <span className="text-[9px] font-mono text-slate-500 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Dispositivo fisico: Supporto Tavolo Plexiglass NTAG 424
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardware Stand Indicator */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  NFC Wave + QR Laser HD
                </span>
                <span className="badge-mono text-slate-300">RIVO-TAVOLO-14</span>
              </div>
            </div>

            {/* RIGHT SIDE: La Dashboard RIVO in Tempo Reale (Span 7) */}
            <div className="lg:col-span-7 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#0F1015] border border-white/[0.08] relative overflow-hidden group/dash">
              {/* Top specular edge reflection */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Top Chrome Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-semibold text-white">Merchant Control Room Live</span>
                  <span className="badge-mono text-[9px] bg-white/[0.06] text-slate-300 px-1.5 py-0.5 rounded">
                    Sede: Napoli Centro
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>Sincronizzato in 0.3s</span>
                </div>
              </div>

              {/* Dynamic Notification Alert Toast (Reacting to selected action) */}
              <div className="my-4">
                {mode === 'bill' && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs animate-fade-in shadow-md shadow-emerald-500/10">
                    <BellRing className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-bell-swing" />
                    <div>
                      <div className="font-semibold text-emerald-300 flex items-center gap-2">
                        <span>Richiesta Conto Ricevuta — Tavolo 14</span>
                        <span className="badge-mono text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">SALA ALERT</span>
                      </div>
                      <div className="text-slate-300 text-[11px] mt-0.5">
                        Importo: <span className="font-mono font-bold text-white">€48,50</span> (Carta POS richiesta) • Notifica inoltrata allo smartwatch di sala e canale Telegram.
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'review' && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs animate-fade-in shadow-md shadow-amber-500/10">
                    <Star className="w-4 h-4 text-amber-400 fill-current shrink-0 mt-0.5 animate-star-pop" />
                    <div>
                      <div className="font-semibold text-amber-300 flex items-center gap-2">
                        <span>Nuova Recensione 5★ Verificata su Google</span>
                        <span className="badge-mono text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">SHIELD VERIFIED</span>
                      </div>
                      <div className="text-slate-300 text-[11px] mt-0.5">
                        Review Shield™ ha autorizzato il redirect pubblico: rating locale incrementato a <span className="font-mono font-bold text-white">4.92 / 5.0</span>.
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'wallet' && (
                  <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3 text-xs animate-fade-in shadow-md shadow-indigo-500/10">
                    <Users className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <div className="font-semibold text-indigo-300 flex items-center gap-2">
                        <span>Nuovo Membro CRM Registrato — Apple Wallet</span>
                        <span className="badge-mono text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded">PASS ACQUIRED</span>
                      </div>
                      <div className="text-slate-300 text-[11px] mt-0.5">
                        Cliente profilato via NFC senza form invasivi. Timbro 6 registrato. Push notification lock-screen pronta per invio promo feriale.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time Miniature KPI Bar with Tabular Numbers */}
              <div className="grid grid-cols-3 gap-3 my-2">
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Incasso Odierno</div>
                  <div className="text-lg sm:text-xl font-bold text-white tabular-nums mt-0.5 font-mono">
                    {mode === 'bill' ? '€ 2.528,50' : '€ 2.480,00'}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18.4% vs ieri</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Rating Google</div>
                  <div className="text-lg sm:text-xl font-bold text-amber-400 tabular-nums mt-0.5 font-mono flex items-center gap-1">
                    <span>4.9</span>
                    <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">128 Recensioni 5★</div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Pass Wallet Attivi</div>
                  <div className="text-lg sm:text-xl font-bold text-indigo-400 tabular-nums mt-0.5 font-mono">
                    {mode === 'wallet' ? '419' : '418'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">LTV Cliente: +34%</div>
                </div>
              </div>

              {/* Table Map / Floor Status Preview */}
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-300">Stato Tavoli in Sala (Live)</span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    8 / 12 Occupati
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'T11', status: 'occupied', label: 'Coperto' },
                    { id: 'T12', status: 'free', label: 'Libero' },
                    { id: 'T13', status: 'occupied', label: 'Coperto' },
                    { 
                      id: 'T14', 
                      status: mode === 'bill' ? 'bill' : 'occupied', 
                      label: mode === 'bill' ? 'Conto Richiesto' : 'Coperto' 
                    },
                    { id: 'T15', status: 'free', label: 'Libero' },
                    { id: 'T16', status: 'occupied', label: 'Coperto' },
                  ].map((table) => (
                    <div
                      key={table.id}
                      className={`p-2 rounded-lg text-center border transition-all ${
                        table.id === 'T14'
                          ? mode === 'bill'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold ring-2 ring-emerald-500/40 animate-pulse'
                            : 'bg-white/[0.04] border-white/10 text-white'
                          : table.status === 'free'
                          ? 'bg-white/[0.02] border-white/[0.04] text-slate-500'
                          : 'bg-white/[0.04] border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{table.id}</div>
                      <div className="text-[8px] uppercase tracking-wider truncate mt-0.5">
                        {table.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Metric */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px] text-slate-400">
                  Transazione archiviata in Supabase PostgreSQL &amp; Redis Edge
                </span>
                <span className="badge-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  0 LATENCY LAG
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

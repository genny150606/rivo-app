'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Star,
  CreditCard,
  Receipt,
  Zap,
  Activity,
  Radio,
  BellRing,
  Users,
  ChevronRight,
  TrendingUp,
  Terminal,
} from 'lucide-react';

type SimulationMode = 'bill' | 'review' | 'wallet';

export default function LandingHeroSimulator() {
  const [mode, setMode] = useState<SimulationMode>('bill');
  const [isTransmitting, setIsTransmitting] = useState(false);

  const handleSelectMode = (newMode: SimulationMode) => {
    setMode(newMode);
    setIsTransmitting(true);
    setTimeout(() => {
      setIsTransmitting(false);
    }, 900);
  };

  return (
    <section className="relative z-10 pt-24 sm:pt-32 pb-20 px-4 sm:px-6 overflow-x-clip">
      <div className="max-w-6xl mx-auto">
        {/* Top System Release Eyebrow */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111215] border border-white/[0.1] text-xs font-mono text-[#A1A1AA]">
            <span className="inline-flex rounded-full h-2 w-2 bg-[#BFFF00]" />
            <span className="text-[#F4F4F6] font-semibold">RIVO OS 2.0</span>
            <span className="text-[#71717A]">/</span>
            <span>Motore Unificato per Tavoli, Cassa &amp; NFC</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717A] hidden sm:inline" />
          </div>
        </div>

        {/* Hero Typography — High-Contrast Geometric Authority */}
        <div className="text-center max-w-4xl mx-auto space-y-5 mb-12">
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F4F4F6] leading-[1.03]">
            Il Sistema Operativo{' '}
            <span className="text-[#BFFF00]">Fisico-Digitale</span>
            <br className="hidden sm:inline" /> per Ristorazione e Retail.
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-[#A1A1AA] max-w-2xl mx-auto font-normal leading-relaxed">
            Elimina 6 abbonamenti disconnessi. Connetti tavoli fisici, cassa e magazzino al Cloud in{' '}
            <span className="text-[#F4F4F6] font-mono font-semibold">0.4s</span> con hardware NTAG 424, Review Shield™ e Apple Wallet nativo.
          </p>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="#lead-capture"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#BFFF00] text-[#09090B] font-bold text-sm hover:bg-[#D4FF33] transition-colors min-h-[48px]"
            >
              <span>Richiedi Dimostrazione Gratuita</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              href="/demo/retail"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#111215] hover:bg-[#18191D] text-[#F4F4F6] font-semibold text-sm border border-white/[0.12] hover:border-white/[0.22] transition-colors min-h-[48px]"
            >
              <Terminal className="w-4 h-4 text-[#BFFF00]" />
              <span>Esplora Demo Retail Live</span>
            </Link>
          </div>

          {/* Hardware Telemetry Stat Ticker */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto border-t border-white/[0.08]">
            <div className="text-center p-2.5 rounded-xl bg-[#111215]/70 border border-white/[0.06]">
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#F4F4F6] tabular-nums">&lt;0.4s</div>
              <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-medium mt-0.5">
                Latenza Tap-to-Cloud
              </div>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-[#111215]/70 border border-white/[0.06]">
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#10B981] tabular-nums">99.98%</div>
              <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-medium mt-0.5">
                Uptime Offline Outbox
              </div>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-[#111215]/70 border border-white/[0.06]">
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#F4F4F6] tabular-nums">340+</div>
              <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-medium mt-0.5">
                Punti Vendita Attivi
              </div>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-[#111215]/70 border border-white/[0.06]">
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#BFFF00] tabular-nums">4.9 / 5.0</div>
              <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-medium mt-0.5">
                Rating Medio Google
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Tap-to-Cloud Control Simulator */}
        <div
          id="ecosistema"
          className="rounded-2xl p-4 sm:p-6 lg:p-7 bg-[#111215] border border-white/[0.1] relative overflow-hidden"
        >
          {/* Simulator Header & Mode Selector */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#BFFF00]/10 text-[#BFFF00] border border-[#BFFF00]/25 px-2 py-0.5 rounded">
                  SIMULATORE LIVE
                </span>
                <span className="text-xs text-[#A1A1AA] font-mono inline-flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isTransmitting ? 'bg-[#BFFF00]' : 'bg-[#10B981]'
                    }`}
                  />
                  {isTransmitting
                    ? 'Handshake NTAG 424 -> Sync Cloud 380ms'
                    : 'Telemetria Bidirezionale Fisico -> Cloud'}
                </span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-semibold text-[#F4F4F6] tracking-tight mt-1.5">
                Fai un Tap sulla sinistra: osserva la Control Room reagire in tempo reale.
              </h2>
            </div>

            <div className="flex flex-wrap lg:flex-nowrap shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectMode('bill')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 min-h-[40px] cursor-pointer ${
                  mode === 'bill'
                    ? 'bg-[#BFFF00] text-[#09090B] font-bold'
                    : 'bg-[#18191D] text-[#A1A1AA] hover:text-[#F4F4F6] border border-white/[0.08]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>1. Conto Smart</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode('review')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 min-h-[40px] cursor-pointer ${
                  mode === 'review'
                    ? 'bg-[#BFFF00] text-[#09090B] font-bold'
                    : 'bg-[#18191D] text-[#A1A1AA] hover:text-[#F4F4F6] border border-white/[0.08]'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>2. Review Shield™</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode('wallet')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 min-h-[40px] cursor-pointer ${
                  mode === 'wallet'
                    ? 'bg-[#BFFF00] text-[#09090B] font-bold'
                    : 'bg-[#18191D] text-[#A1A1AA] hover:text-[#F4F4F6] border border-white/[0.08]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>3. Apple Wallet</span>
              </button>
            </div>
          </div>

          {/* Asymmetric 12-Col Split Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6 items-stretch">
            {/* LEFT (Span 5): Physical NFC Guest Device */}
            <div className="lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-[#09090B] border border-white/[0.08] min-w-0">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Smartphone className="w-4 h-4 text-[#BFFF00] shrink-0" />
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#A1A1AA] truncate">
                    Dispositivo Ospite (Zero App)
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#10B981] shrink-0">NTAG 424</span>
              </div>

              {/* Authentic Hardware Phone Silhouette */}
              <div className="mx-auto w-full max-w-[280px] bg-[#18191D] rounded-[28px] p-2.5 border border-white/[0.14]">
                <div className="w-16 h-3.5 bg-[#09090B] rounded-full mx-auto mb-2" />

                <div className="bg-[#09090B] rounded-[20px] p-4 border border-white/[0.08] min-h-[340px] flex flex-col justify-between">
                  {mode === 'bill' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="text-xs font-bold text-[#F4F4F6]">Tavolo 14</span>
                        <span className="font-mono text-[10px] bg-[#10B981]/15 text-[#10B981] px-2 py-0.5 rounded border border-[#10B981]/25">
                          Servizio Aperto
                        </span>
                      </div>
                      <div className="text-center py-2">
                        <div className="text-[11px] text-[#A1A1AA]">Totale Conto</div>
                        <div className="text-3xl font-bold text-[#F4F4F6] tabular-nums mt-0.5 font-mono">
                          €48,50
                        </div>
                        <div className="text-[10px] text-[#A1A1AA] font-mono mt-1">
                          2 Calici Nebbiolo + 2 Pizze Gourmet
                        </div>
                      </div>
                      <div className="space-y-1.5 bg-[#111215] p-2.5 rounded-lg border border-white/[0.06]">
                        <div className="flex justify-between text-xs text-[#A1A1AA]">
                          <span>Divisione Conto:</span>
                          <span className="font-semibold text-[#F4F4F6] font-mono tabular-nums">€24,25 / persona</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-[#A1A1AA]">
                          <span>Fattura SDI:</span>
                          <span className="text-[#10B981] font-medium">Automatica</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectMode('bill')}
                        className="w-full py-2.5 rounded-lg bg-[#BFFF00] text-[#09090B] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Paga o Chiama POS al Tavolo</span>
                      </button>
                    </div>
                  )}

                  {mode === 'review' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="text-xs font-bold text-[#F4F4F6]">Google Business Hub</span>
                        <span className="font-mono text-[10px] bg-[#F59E0B]/15 text-[#F59E0B] px-2 py-0.5 rounded border border-[#F59E0B]/25">
                          Review Shield™
                        </span>
                      </div>
                      <div className="text-center py-2">
                        <div className="text-[11px] text-[#A1A1AA]">Come è stata la tua esperienza?</div>
                        <div className="flex justify-center gap-1 text-[#F59E0B] my-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-5 h-5 fill-current" />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/25">
                          Redirect Diretto Google Maps
                        </span>
                      </div>
                      <div className="bg-[#111215] p-2.5 rounded-lg border border-white/[0.06] text-[11px] text-[#A1A1AA] italic">
                        &quot;Servizio impeccabile e conto digitale istantaneo al tavolo. Esperienza da 5 stelle.&quot;
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectMode('review')}
                        className="w-full py-2.5 rounded-lg bg-[#BFFF00] text-[#09090B] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Copia e Pubblica su Google</span>
                      </button>
                    </div>
                  )}

                  {mode === 'wallet' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                        <span className="text-xs font-bold text-[#F4F4F6]">Apple Wallet Pass</span>
                        <span className="font-mono text-[10px] bg-[#38BDF8]/15 text-[#38BDF8] px-2 py-0.5 rounded border border-[#38BDF8]/25">
                          Zero Download
                        </span>
                      </div>
                      <div className="bg-[#111215] p-3 rounded-xl border border-white/[0.1] text-[#F4F4F6]">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="text-[9px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                              Carta Fedeltà
                            </div>
                            <div className="text-sm font-bold mt-0.5">RIVO Club VIP</div>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#BFFF00] tabular-nums">6 / 10</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 mt-3">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
                            <div
                              key={idx}
                              className={`h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold ${
                                idx <= 6
                                  ? 'bg-[#BFFF00] text-[#09090B]'
                                  : 'bg-[#18191D] text-[#71717A] border border-white/[0.08]'
                              }`}
                            >
                              {idx <= 6 ? '✓' : idx}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-[10px] text-[#A1A1AA] text-center">
                        Prossimo premio: <span className="text-[#F4F4F6] font-semibold">Calice o Dessert</span> al 10° timbro.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectMode('wallet')}
                        className="w-full py-2.5 rounded-lg bg-[#BFFF00] text-[#09090B] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Aggiungi ad Apple Wallet</span>
                      </button>
                    </div>
                  )}

                  <div className="pt-2.5 text-center border-t border-white/[0.08]">
                    <span className="text-[9px] font-mono text-[#71717A]">
                      Hardware: Supporto Plexiglass NTAG 424
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#A1A1AA]">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#BFFF00]" />
                  NFC Wave + QR Laser HD
                </span>
                <span className="font-mono text-[#F4F4F6]">RIVO-TAVOLO-14</span>
              </div>
            </div>

            {/* RIGHT (Span 7): Real-time Cloud Control Room */}
            <div className="lg:col-span-7 flex flex-col justify-between p-4 sm:p-6 rounded-xl bg-[#09090B] border border-white/[0.08] min-w-0">
              {/* Top Chrome Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="text-xs font-semibold text-[#F4F4F6]">Merchant Control Room Live</span>
                  <span className="font-mono text-[10px] bg-[#18191D] text-[#A1A1AA] px-2 py-0.5 rounded border border-white/[0.08]">
                    Sede: Napoli Centro
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#A1A1AA]">
                  <Activity className="w-3.5 h-3.5 text-[#BFFF00]" />
                  <span className="tabular-nums">Sincronizzato in 0.3s</span>
                </div>
              </div>

              {/* Event Dispatch Alert */}
              <div className="my-4">
                {mode === 'bill' && (
                  <div className="p-3.5 rounded-xl bg-[#111215] border border-[#BFFF00]/35 flex items-start gap-3 text-xs">
                    <BellRing className="w-4 h-4 text-[#BFFF00] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#F4F4F6] flex flex-wrap items-center gap-2">
                        <span>Richiesta Conto Ricevuta — Tavolo 14</span>
                        <span className="font-mono text-[10px] bg-[#BFFF00]/15 text-[#BFFF00] px-1.5 py-0.5 rounded">
                          SALA ALERT
                        </span>
                      </div>
                      <div className="text-[#A1A1AA] text-[11px] mt-1">
                        Importo: <span className="font-mono font-bold text-[#F4F4F6] tabular-nums">€48,50</span> (POS richiesto) • Notifica inoltrata a smartwatch sala e Telegram.
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'review' && (
                  <div className="p-3.5 rounded-xl bg-[#111215] border border-[#F59E0B]/35 flex items-start gap-3 text-xs">
                    <Star className="w-4 h-4 text-[#F59E0B] fill-current shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#F4F4F6] flex flex-wrap items-center gap-2">
                        <span>Nuova Recensione 5★ Verificata su Google</span>
                        <span className="font-mono text-[10px] bg-[#F59E0B]/15 text-[#F59E0B] px-1.5 py-0.5 rounded">
                          SHIELD VERIFIED
                        </span>
                      </div>
                      <div className="text-[#A1A1AA] text-[11px] mt-1">
                        Review Shield™ ha indirizzato il cliente su Google: rating medio locale{' '}
                        <span className="font-mono font-bold text-[#F4F4F6] tabular-nums">4.92 / 5.0</span>.
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'wallet' && (
                  <div className="p-3.5 rounded-xl bg-[#111215] border border-[#38BDF8]/35 flex items-start gap-3 text-xs">
                    <Users className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#F4F4F6] flex flex-wrap items-center gap-2">
                        <span>Nuovo Membro CRM Registrato — Apple Wallet</span>
                        <span className="font-mono text-[10px] bg-[#38BDF8]/15 text-[#38BDF8] px-1.5 py-0.5 rounded">
                          PASS ACQUIRED
                        </span>
                      </div>
                      <div className="text-[#A1A1AA] text-[11px] mt-1">
                        Cliente profilato via NFC senza moduli cartacei. Timbro 6 registrato con push geofence attiva.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Miniature Live KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
                <div className="p-3.5 rounded-xl bg-[#111215] border border-white/[0.08]">
                  <div className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider">Incasso Odierno</div>
                  <div className="text-lg sm:text-xl font-bold text-[#F4F4F6] tabular-nums mt-1 font-mono">
                    {mode === 'bill' ? '€ 2.528,50' : '€ 2.480,00'}
                  </div>
                  <div className="text-[11px] text-[#10B981] flex items-center gap-1 mt-1 font-medium tabular-nums">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18.4% vs ieri</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111215] border border-white/[0.08]">
                  <div className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider">Rating Google</div>
                  <div className="text-lg sm:text-xl font-bold text-[#F59E0B] tabular-nums mt-1 font-mono flex items-center gap-1">
                    <span>4.9</span>
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div className="text-[11px] text-[#A1A1AA] mt-1 tabular-nums">128 recensioni 5★</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111215] border border-white/[0.08]">
                  <div className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider">Pass Wallet Attivi</div>
                  <div className="text-lg sm:text-xl font-bold text-[#BFFF00] tabular-nums mt-1 font-mono">
                    {mode === 'wallet' ? '419' : '418'}
                  </div>
                  <div className="text-[11px] text-[#A1A1AA] mt-1 tabular-nums">LTV Cliente: +34%</div>
                </div>
              </div>

              {/* Floor Status Preview */}
              <div className="mt-4 pt-3 border-t border-white/[0.08]">
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <span className="font-semibold text-[#A1A1AA]">Stato Tavoli in Sala</span>
                  <span className="text-[11px] font-mono text-[#10B981] tabular-nums">
                    8 / 12 Occupati
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'T11', status: 'occupied', label: 'Coperto' },
                    { id: 'T12', status: 'free', label: 'Libero' },
                    { id: 'T13', status: 'occupied', label: 'Coperto' },
                    {
                      id: 'T14',
                      status: mode === 'bill' ? 'bill' : 'occupied',
                      label: mode === 'bill' ? 'Conto' : 'Coperto',
                    },
                    { id: 'T15', status: 'free', label: 'Libero' },
                    { id: 'T16', status: 'occupied', label: 'Coperto' },
                  ].map((table) => (
                    <div
                      key={table.id}
                      className={`p-2 rounded-lg text-center border transition-colors ${
                        table.id === 'T14' && mode === 'bill'
                          ? 'bg-[#BFFF00]/15 border-[#BFFF00] text-[#BFFF00] font-bold'
                          : table.status === 'free'
                          ? 'bg-[#111215] border-white/[0.06] text-[#71717A]'
                          : 'bg-[#18191D] border-white/[0.1] text-[#F4F4F6]'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{table.id}</div>
                      <div className="text-[9px] uppercase tracking-wider truncate mt-0.5">
                        {table.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Telemetry Bar */}
              <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-[#71717A]">
                <span className="font-mono text-[11px]">
                  Archiviato in Supabase PostgreSQL &amp; Edge Cache
                </span>
                <span className="font-mono text-[11px] text-[#10B981] inline-flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  SYNC REALTIME 0 LAG
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

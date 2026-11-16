'use client';

import { useState } from 'react';
import {
  Star,
  ShieldCheck,
  Copy,
  Check,
  CreditCard,
  Gift,
  WifiOff,
  Wifi,
  RefreshCw,
  Lock,
  Smartphone,
  Bell,
  AlertCircle,
  Wand2,
} from 'lucide-react';

export default function LandingBentoGrid() {
  const [shieldRating, setShieldRating] = useState<number>(5);
  const [aiReviewCopied, setAiReviewCopied] = useState<boolean>(false);
  const [privateFeedback, setPrivateFeedback] = useState<string>('');
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  const [spinning, setSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [prizeWon, setPrizeWon] = useState<string | null>(null);

  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [outboxCount, setOutboxCount] = useState<number>(0);

  const [selectedRole, setSelectedRole] = useState<'owner' | 'manager' | 'staff'>('owner');

  const handleRatingClick = (stars: number) => {
    setShieldRating(stars);
    setFeedbackSent(false);
  };

  const handleCopyAiReview = () => {
    setAiReviewCopied(true);
    setTimeout(() => setAiReviewCopied(false), 1800);
  };

  const handleSpinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setPrizeWon(null);

    const randomRot = 1440 + Math.floor(Math.random() * 360);
    setWheelRotation((prev) => prev + randomRot);

    setTimeout(() => {
      const prizes = [
        'Calice di Benvenuto in Omaggio',
        'Sconto 15% sul Prossimo Acquisto',
        'Dessert Artigianale Offerto',
      ];
      setPrizeWon(prizes[Math.floor(Math.random() * prizes.length)]);
      setSpinning(false);
    }, 1400);
  };

  const handleToggleOffline = () => {
    if (!isOffline) {
      setIsOffline(true);
      setOutboxCount(3);
    } else {
      setIsOffline(false);
      setTimeout(() => {
        setOutboxCount(0);
      }, 450);
    }
  };

  return (
    <section id="review-shield" className="py-20 px-4 sm:px-6 relative z-10 overflow-x-clip">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#111215] border border-white/[0.08] text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span>ECOSISTEMA INTEGRATO A 360°</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F4F6]">
            Reputazione Blindata, Wallet Nativo
            <br className="hidden sm:inline" /> e Resilienza Offline.
          </h2>
          <p className="text-[#A1A1AA] text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Ogni modulo lavora in sinergia per convertire visite occasionali in clienti fidelizzati e proteggere la tua scheda Google.
          </p>
        </div>

        {/* 12-Col Asymmetric Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* CARD 1 (Span 7): Review Shield */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-[#111215] border border-white/[0.08] flex flex-col justify-between min-w-0">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 px-2 py-0.5 rounded inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  REVIEW SHIELD™ ALGORITMICO
                </span>
                <span className="text-xs font-mono text-[#71717A]">Clicca le stelle</span>
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#F4F4F6] tracking-tight">
                Filtro Intelligente 5★ &amp; Generatore AI
              </h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1.5 max-w-xl">
                Con 4 o 5 stelle l&apos;ospite viene indirizzato su Google Maps con testo precompilato. Con 1–3 stelle il feedback resta riservato alla direzione.
              </p>

              <div className="my-5 p-4 rounded-xl bg-[#09090B] border border-white/[0.08] text-center">
                <div className="text-xs text-[#A1A1AA] mb-2">Seleziona valutazione:</div>
                <div className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
                        shieldRating >= star
                          ? 'text-[#F59E0B]'
                          : 'text-[#71717A] hover:text-[#A1A1AA]'
                      }`}
                      aria-label={`${star} stelle`}
                    >
                      <Star className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                    </button>
                  ))}
                </div>
                <div className="text-xs font-mono font-bold mt-2">
                  {shieldRating >= 4 ? (
                    <span className="text-[#10B981]">
                      Valutazione Positiva ({shieldRating}★): Redirect Pubblico Google
                    </span>
                  ) : (
                    <span className="text-[#F59E0B]">
                      Valutazione Critica ({shieldRating}★): Scudo Attivo (Privato)
                    </span>
                  )}
                </div>
              </div>

              {shieldRating >= 4 ? (
                <div className="p-4 rounded-xl bg-[#09090B] border border-[#10B981]/30 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#10B981] flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      Testo Recensione AI Pronto
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAiReview}
                      className="px-2.5 py-1.5 rounded-md bg-[#18191D] hover:bg-white/[0.08] text-[#F4F4F6] text-[11px] font-semibold flex items-center gap-1.5 border border-white/[0.1] cursor-pointer"
                    >
                      {aiReviewCopied ? <Check className="w-3 h-3 text-[#BFFF00]" /> : <Copy className="w-3 h-3" />}
                      <span>{aiReviewCopied ? 'Copiato' : 'Copia'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-[#A1A1AA] italic leading-relaxed">
                    &quot;Cena impeccabile! Personale accogliente, servizio al tavolo digitale istantaneo e qualità eccellente.&quot;
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#09090B] border border-[#F59E0B]/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B]">
                    <AlertCircle className="w-4 h-4" />
                    <span>Scudo Attivo: Redirect Google Bloccato</span>
                  </div>
                  <p className="text-xs text-[#A1A1AA]">
                    Il feedback viene recapitato in forma privata al titolare per gestire il recupero cliente.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      aria-label="Testo simulato del feedback privato"
                      value={privateFeedback}
                      onChange={(e) => setPrivateFeedback(e.target.value)}
                      placeholder="Es: tempi di attesa..."
                      className="flex-1 min-h-[40px] bg-[#111215] border border-white/[0.12] rounded-lg px-3 py-1.5 text-xs text-[#F4F4F6] placeholder-[#71717A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus:border-[#F59E0B]"
                    />
                    <button
                      type="button"
                      onClick={() => setFeedbackSent(true)}
                      className="px-4 py-2 rounded-lg bg-[#F59E0B] text-[#09090B] font-bold text-xs shrink-0 min-h-[40px] cursor-pointer"
                    >
                      Invia a Titolare
                    </button>
                  </div>
                  {feedbackSent && (
                    <div className="text-[11px] text-[#10B981] font-mono flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Intercettato con successo: notifica privata inviata.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1A1AA]">
              <span>Aumento medio rating Google: +0.4★ in 45 giorni.</span>
              <span className="font-mono text-[#F59E0B]">100% PROTEZIONE BRAND</span>
            </div>
          </div>

          {/* CARD 2 (Span 5): Apple & Google Wallet */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#111215] border border-white/[0.08] flex flex-col justify-between min-w-0">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 px-2 py-0.5 rounded inline-flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  APPLE &amp; GOOGLE WALLET
                </span>
                <span className="text-xs font-mono text-[#71717A]">Zero App</span>
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#F4F4F6] tracking-tight">
                La Carta Fedeltà sul Lock-Screen
              </h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1.5">
                Un tap NFC installa la carta punti nativa nel Wallet del cliente con notifiche push geolocalizzate.
              </p>

              <div className="my-5 p-4 rounded-xl bg-[#09090B] border border-white/[0.1] space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                      Ristorante &amp; Lounge
                    </span>
                    <div className="text-base font-bold text-[#F4F4F6] mt-0.5">Borgo Antico Club</div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[#18191D] border border-white/[0.1] flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-[#BFFF00]" />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#111215] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#71717A]">Timbri Raccolti</div>
                    <div className="text-xl font-bold font-mono text-[#BFFF00] tabular-nums">7 / 10</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#71717A]">Premio Sbloccato</div>
                    <div className="text-xs font-bold text-[#F4F4F6] font-mono">Calice Riserva</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#18191D] border border-white/[0.08] text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#38BDF8] font-mono">
                    <span className="flex items-center gap-1 font-semibold">
                      <Bell className="w-3 h-3" /> Apple Wallet • Prossimità
                    </span>
                    <span>Adesso</span>
                  </div>
                  <div className="text-[11px] text-[#A1A1AA]">
                    &quot;Sei vicino a Borgo Antico: ti mancano 3 timbri per il calice omaggio.&quot;
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1A1AA]">
              <span>Tasso di ritorno cliente: +38%</span>
              <span className="font-mono text-[#38BDF8]">PUSH GEOLOCALIZZATE</span>
            </div>
          </div>

          {/* CARD 3 (Span 4): Wheel */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-[#111215] border border-white/[0.08] flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#BFFF00]/15 text-[#BFFF00] border border-[#BFFF00]/30 px-2 py-0.5 rounded inline-flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  GAMIFICATION CRM
                </span>
                <span className="text-xs font-mono text-[#71717A]">/wheel</span>
              </div>

              <h3 className="font-display text-lg font-semibold text-[#F4F4F6] tracking-tight">
                Ruota della Fortuna al Tavolo
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Trasforma il dopo-cena in acquisizione lead consensuale: gira la ruota con premio immediato.
              </p>

              <div className="my-4 p-4 rounded-xl bg-[#09090B] border border-white/[0.08] text-center flex flex-col items-center">
                <div className="relative w-24 h-24 my-1 flex items-center justify-center">
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-[#BFFF00]" />
                  <div
                    className="w-full h-full rounded-full border-2 border-white/20 relative overflow-hidden transition-transform ease-out"
                    style={{
                      transform: `rotate(${wheelRotation}deg)`,
                      transitionDuration: spinning ? '1400ms' : '0ms',
                      background:
                        'conic-gradient(#18191D 0deg 60deg, #27272A 60deg 120deg, #18191D 120deg 180deg, #27272A 180deg 240deg, #18191D 240deg 300deg, #27272A 300deg 360deg)',
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSpinWheel}
                  disabled={spinning}
                  className="w-full mt-3 py-2.5 rounded-lg bg-[#BFFF00] hover:bg-[#D4FF33] text-[#09090B] font-bold text-xs flex items-center justify-center gap-2 transition-colors min-h-[40px] disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} />
                  <span>{spinning ? 'Estrazione in corso...' : 'Simula: Gira la Ruota'}</span>
                </button>

                {prizeWon && (
                  <div className="mt-2.5 px-3 py-2 rounded-lg bg-[#18191D] border border-[#BFFF00]/35 text-xs font-mono font-bold text-[#BFFF00] w-full">
                    PREMIO: {prizeWon}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] text-xs text-[#A1A1AA] flex justify-between">
              <span>Lead Profilati GDPR</span>
              <span className="font-mono text-[#F4F4F6] font-bold tabular-nums">120+ / mese</span>
            </div>
          </div>

          {/* CARD 4 (Span 4): Offline Outbox */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-[#111215] border border-white/[0.08] flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 px-2 py-0.5 rounded inline-flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  OFFLINE-OUTBOX
                </span>
                <span className="text-xs font-mono text-[#71717A]">IndexedDB</span>
              </div>

              <h3 className="font-display text-lg font-semibold text-[#F4F4F6] tracking-tight">
                Funziona Anche Senza Wi-Fi
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Se cade la linea in negozio, vendite e comande restano in coda locale sicura e si sincronizzano automaticamente al ripristino.
              </p>

              <div className="my-5 p-4 rounded-xl bg-[#09090B] border border-white/[0.08] space-y-3">
                <button
                  type="button"
                  onClick={handleToggleOffline}
                  className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors min-h-[40px] cursor-pointer ${
                    isOffline
                      ? 'bg-[#EF4444]/15 border border-[#EF4444]/35 text-[#EF4444]'
                      : 'bg-[#10B981] text-[#09090B]'
                  }`}
                >
                  {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                  <span>{isOffline ? 'Ripristina Rete (Auto-Drain)' : 'Simula Caduta Wi-Fi'}</span>
                </button>

                <div className="text-xs text-[#A1A1AA] flex justify-between items-center px-1">
                  <span>Coda Locale:</span>
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      outboxCount > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'
                    }`}
                  >
                    {outboxCount} operazioni in attesa
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] text-xs text-[#A1A1AA] flex justify-between">
              <span>Perdita Dati</span>
              <span className="font-mono text-[#10B981] font-bold tabular-nums">0.00%</span>
            </div>
          </div>

          {/* CARD 5 (Span 4): Multi-Sede & RBAC */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-[#111215] border border-white/[0.08] flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-white/[0.06] text-[#F4F4F6] border border-white/[0.12] px-2 py-0.5 rounded inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  SICUREZZA RBAC
                </span>
                <span className="text-xs font-mono text-[#71717A]">Ruoli &amp; Sedi</span>
              </div>

              <h3 className="font-display text-lg font-semibold text-[#F4F4F6] tracking-tight">
                Multi-Sede &amp; Permessi Staff
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Isolamento rigoroso dei dati con Row-Level Security: il titolare controlla i margini, lo staff gestisce la sala.
              </p>

              <div className="my-5 p-3 rounded-xl bg-[#09090B] border border-white/[0.08] space-y-2.5">
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'owner', label: 'Titolare' },
                    { id: 'manager', label: 'Manager' },
                    { id: 'staff', label: 'Staff' },
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id as 'owner' | 'manager' | 'staff')}
                      className={`py-2 rounded-lg text-xs font-semibold transition-colors min-h-[38px] cursor-pointer ${
                        selectedRole === role.id
                          ? 'bg-[#BFFF00] text-[#09090B] font-bold'
                          : 'bg-[#18191D] text-[#A1A1AA] hover:text-[#F4F4F6]'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-[#111215] text-[11px] text-[#A1A1AA] min-h-[54px] flex items-center">
                  {selectedRole === 'owner' && 'Accesso P&L globale, margini, multi-sede e fatturazione.'}
                  {selectedRole === 'manager' && 'Controllo giacenze magazzino, resi e chiusura cassa giornaliera.'}
                  {selectedRole === 'staff' && 'Mappa tavoli, chiamate di servizio e scontrini senza margini.'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] text-xs text-[#A1A1AA] flex justify-between">
              <span>Conformità</span>
              <span className="font-mono text-[#F4F4F6] font-bold">RLS &amp; GDPR</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

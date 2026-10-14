'use client';

import { useState } from 'react';
import { 
  Star, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  CreditCard, 
  Gift, 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  Users, 
  Lock, 
  Smartphone, 
  Bell, 
  Send,
  AlertCircle
} from 'lucide-react';

export default function LandingBentoGrid() {
  // Card 1: Review Shield State
  const [shieldRating, setShieldRating] = useState<number>(5);
  const [aiReviewCopied, setAiReviewCopied] = useState<boolean>(false);
  const [privateFeedback, setPrivateFeedback] = useState<string>('');
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  // Card 3: Wheel Spin State
  const [spinning, setSpinning] = useState<boolean>(false);
  const [prizeWon, setPrizeWon] = useState<string | null>(null);

  // Card 4: Offline Outbox State
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [outboxCount, setOutboxCount] = useState<number>(0);

  // Card 5: RBAC Role State
  const [selectedRole, setSelectedRole] = useState<'owner' | 'manager' | 'staff'>('owner');

  const handleRatingClick = (stars: number) => {
    setShieldRating(stars);
    setFeedbackSent(false);
  };

  const handleCopyAiReview = () => {
    setAiReviewCopied(true);
    setTimeout(() => setAiReviewCopied(false), 2000);
  };

  const handleSpinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setPrizeWon(null);
    setTimeout(() => {
      const prizes = [
        'Calice di Benvenuto in Omaggio',
        'Sconto 15% sul Prossimo Acquisto',
        'Dessert Artigianale Offerto',
      ];
      const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
      setPrizeWon(randomPrize);
      setSpinning(false);
    }, 1200);
  };

  const handleToggleOffline = () => {
    if (!isOffline) {
      setIsOffline(true);
      setOutboxCount(3);
    } else {
      setIsOffline(false);
      // Auto-drain simulation
      setTimeout(() => setOutboxCount(0), 600);
    }
  };

  return (
    <section id="review-shield" className="py-20 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>ECOSISTEMA INTEGRATO A 360°</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white headline-tight">
            Reputazione Blindata, Wallet Nativo <br className="hidden sm:inline" />
            e Resilienza Offline.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Ogni componente di RIVO lavora in sinergia per trasformare avventori anonimi in clienti fidelizzati, difendendo la tua reputazione su Google in tempo reale.
          </p>
        </div>

        {/* =========================================================
            BENTO GRID (12-COLUMNS ASYMMETRIC)
            ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* =========================================================
              CARD 1 (SPAN 7): Review Shield™ & AI Review Generator
              ========================================================= */}
          <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="badge-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  REVIEW SHIELD™ ALGORITMICO
                </span>
                <span className="text-xs font-mono text-slate-400">Interattivo: Clicca le stelle</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                Filtro Intelligente 5★ &amp; Generatore AI
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Se il cliente seleziona 4 o 5 stelle viene guidato su Google con un testo ottimizzato dall&apos;AI. Se seleziona 1–3 stelle, RIVO attiva lo Scudo: il feedback resta privato per la direzione.
              </p>

              {/* Interactive Star Selector */}
              <div className="my-6 p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-center">
                <div className="text-xs text-slate-400 mb-2 font-medium">
                  Seleziona la valutazione da testare:
                </div>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingClick(star)}
                      className={`p-2 rounded-xl transition-all touch-press ${
                        shieldRating >= star
                          ? 'text-amber-400 scale-110'
                          : 'text-zinc-700 hover:text-zinc-500'
                      }`}
                      aria-label={`${star} stelle`}
                    >
                      <Star className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
                    </button>
                  ))}
                </div>
                <div className="text-xs font-mono font-bold mt-2">
                  {shieldRating >= 4 ? (
                    <span className="text-emerald-400">Valutazione Positiva ({shieldRating}★): Redirect Pubblico Google</span>
                  ) : (
                    <span className="text-amber-400">Valutazione Critica ({shieldRating}★): Scudo Attivo (Privato)</span>
                  )}
                </div>
              </div>

              {/* Dynamic Shield Response View */}
              {shieldRating >= 4 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Testo Recensione AI Generato Pronto all&apos;Uso:
                    </span>
                    <button
                      onClick={handleCopyAiReview}
                      className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      {aiReviewCopied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                      <span>{aiReviewCopied ? 'Copiato!' : 'Copia'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 italic leading-relaxed">
                    &quot;Cena impeccabile! Personale accogliente, piatti della tradizione reinterpretati con maestria e servizio al tavolo digitale comodissimo. Ritorneremo sicuramente!&quot;
                  </p>
                  <div className="text-[10px] text-emerald-400/90 font-mono">
                    ✓ Il cliente atterra direttamente nella scheda Google My Business con le 5 stelle già preimpostate.
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Scudo Attivo: Reindirizzamento Google Bloccato</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Il messaggio non va su Google ma viene recapitato in via riservata al General Manager con possibilità di contatto diretto per risolvere l&apos;insoddisfazione.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={privateFeedback}
                      onChange={(e) => setPrivateFeedback(e.target.value)}
                      placeholder="Simula feedback del cliente (es: tempi attesa lunghi)..."
                      className="flex-1 bg-black/50 border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      onClick={() => setFeedbackSent(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs shrink-0"
                    >
                      Invia a Titolare
                    </button>
                  </div>
                  {feedbackSent && (
                    <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Intercettato con successo! Notifica privata inviata al titolare.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <span>Aumento medio del rating Google: +0.4 stelle in 45 giorni.</span>
              <span className="badge-mono text-amber-400">100% PROTEZIONE BRAND</span>
            </div>
          </div>

          {/* =========================================================
              CARD 2 (SPAN 5): Apple & Google Wallet Nativo (Zero App)
              ========================================================= */}
          <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="badge-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  APPLE &amp; GOOGLE WALLET
                </span>
                <span className="text-xs font-mono text-slate-400">Zero App da Scaricare</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                La Carta Fedeltà sul Lock-Screen
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Nessuna app da scaricare dall&apos;App Store. Un tap NFC installa la carta punti nativa in Apple Wallet, abilitando notifiche push geolocalizzate quando il cliente è nei paraggi.
              </p>

              {/* Realistic Apple Wallet Pass UI */}
              <div className="my-5 p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                      Ristorante &amp; Lounge
                    </span>
                    <div className="text-base font-bold text-white mt-0.5">Borgo Antico Club</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="my-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">Timbri Raccolti</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">7 / 10</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Premio Sbloccato</div>
                    <div className="text-xs font-bold text-white font-mono">Calice Riserva</div>
                  </div>
                </div>

                {/* Simulated Lock-Screen Push Notification Banner */}
                <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-xs text-white space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-indigo-300">
                    <span className="flex items-center gap-1 font-semibold">
                      <Bell className="w-3 h-3" /> Apple Wallet • Notifica Prossimità
                    </span>
                    <span>Adesso</span>
                  </div>
                  <div className="text-[11px] text-slate-200">
                    &quot;Sei vicino a Borgo Antico: ti mancano solo 3 timbri per il calice di riserva omaggio!&quot;
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <span>Tasso di ritorno del cliente: +38%</span>
              <span className="badge-mono text-indigo-400">PUSH GEOLOCALIZZATE</span>
            </div>
          </div>

          {/* =========================================================
              CARD 3 (SPAN 4): Ruota della Fortuna & Lead Capture (/wheel)
              ========================================================= */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="badge-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  GAMIFICATION CRM
                </span>
                <span className="text-xs font-mono text-slate-400">/wheel</span>
              </div>

              <h3 className="text-lg font-semibold text-white tracking-tight">
                Ruota della Fortuna al Tavolo
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Trasforma il momento del conto in un gioco a premi istantaneo: l&apos;ospite lascia email e telefono per girare la ruota.
              </p>

              {/* Interactive Wheel Trigger */}
              <div className="my-5 p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-center">
                <button
                  onClick={handleSpinWheel}
                  disabled={spinning}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 touch-press disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
                  <span>{spinning ? 'Estrazione Premio...' : 'Simula: Gira la Ruota'}</span>
                </button>

                {prizeWon && (
                  <div className="mt-3 p-2.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-xs font-bold text-purple-200 animate-fade-in">
                    🎉 Hai Vinto: {prizeWon}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] text-xs text-slate-400 flex justify-between">
              <span>Lead Profilati GDPR</span>
              <span className="font-mono text-white font-bold">120+ / mese</span>
            </div>
          </div>

          {/* =========================================================
              CARD 4 (SPAN 4): Architettura Offline-First
              ========================================================= */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="badge-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  OFFLINE-OUTBOX
                </span>
                <span className="text-xs font-mono text-slate-400">offline-outbox.ts</span>
              </div>

              <h3 className="text-lg font-semibold text-white tracking-tight">
                Funziona Anche Senza Wi-Fi
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Se la connessione del locale cade, RIVO non si blocca mai. Le comande restano in coda sicura IndexedDB e si sincronizzano al ripristino.
              </p>

              {/* Interactive Offline Simulation */}
              <div className="my-5 p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3">
                <button
                  onClick={handleToggleOffline}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isOffline
                      ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                      : 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                  <span>{isOffline ? 'Riconnetti al Cloud' : 'Simula Caduta Rete'}</span>
                </button>

                <div className="text-xs text-slate-300 flex justify-between items-center px-1">
                  <span>Coda Outbox Locale:</span>
                  <span className={`font-mono font-bold ${outboxCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {outboxCount} operazioni in attesa
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] text-xs text-slate-400 flex justify-between">
              <span>Perdita Dati</span>
              <span className="font-mono text-emerald-400 font-bold">0.00%</span>
            </div>
          </div>

          {/* =========================================================
              CARD 5 (SPAN 4): Multi-Sede & Permessi Staff (RBAC)
              ========================================================= */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="badge-mono bg-slate-500/10 text-slate-300 border border-slate-500/20 px-2 py-0.5 rounded flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  SICUREZZA RBAC
                </span>
                <span className="text-xs font-mono text-slate-400">Ruoli &amp; Sedi</span>
              </div>

              <h3 className="text-lg font-semibold text-white tracking-tight">
                Multi-Sede &amp; Permessi Staff
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Isolamento rigido dei dati con Supabase Row-Level Security: il titolare controlla il gruppo, lo staff vede solo la sala.
              </p>

              {/* Interactive Role Selector */}
              <div className="my-5 p-3 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'owner', label: 'Titolare' },
                    { id: 'manager', label: 'Manager' },
                    { id: 'staff', label: 'Staff' },
                  ].map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id as 'owner' | 'manager' | 'staff')}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedRole === role.id
                          ? 'bg-white text-zinc-950 font-bold'
                          : 'bg-white/[0.03] text-slate-400 hover:text-white'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.02] text-[11px] text-slate-300">
                  {selectedRole === 'owner' && 'Accesso P&L globale, margini, multi-sede e fatturazione.'}
                  {selectedRole === 'manager' && 'Controllo giacenze magazzino, resi, chiusura cassa giornaliera.'}
                  {selectedRole === 'staff' && 'Mappa tavoli, chiamate di servizio e scontrini senza dati sensibili.'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] text-xs text-slate-400 flex justify-between">
              <span>Conformità</span>
              <span className="font-mono text-white font-bold">RLS &amp; GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

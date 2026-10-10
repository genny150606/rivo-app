'use client';

import { useState } from 'react';
import { sound } from './SoundSystem';
import {
  ShieldCheck,
  ShieldAlert,
  Star,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  Bell,
  Smartphone,
} from 'lucide-react';

export default function ReviewShield() {
  const [ratingMode, setRatingMode] = useState<'positive' | 'negative'>('positive');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const setMode = (mode: 'positive' | 'negative') => {
    setRatingMode(mode);
    setFeedbackSent(false);
    if (mode === 'positive') {
      sound.playStar(5);
    } else {
      sound.playShield();
    }
  };

  return (
    <section
      id="shield"
      className={`relative min-h-screen w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 transition-colors duration-700 overflow-hidden ${
        ratingMode === 'positive'
          ? 'bg-[#050607]'
          : 'bg-[#0a0705]'
      }`}
    >
      {/* Dynamic Ambient Glow depending on mode */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] pointer-events-none transition-all duration-700"
        style={{
          backgroundColor:
            ratingMode === 'positive'
              ? 'rgba(16, 185, 129, 0.08)'
              : 'rgba(245, 158, 11, 0.12)',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-mono tracking-widest uppercase mb-4 transition-colors ${
              ratingMode === 'positive'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
            }`}
          >
            {ratingMode === 'positive' ? (
              <>
                <ShieldCheck size={14} />
                <span>INTELLIGENT REPUTATION PROTECTION</span>
              </>
            ) : (
              <>
                <ShieldAlert size={14} className="animate-pulse" />
                <span>SHIELD ENGAGED • PUBLIC BYPASS</span>
              </>
            )}
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.03em] uppercase leading-tight font-['Space_Grotesk'] text-white">
            REVIEW SHIELD. <br />
            <span
              className={`transition-colors duration-500 ${
                ratingMode === 'positive'
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#BFFF00]'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400'
              }`}
            >
              AUTOMATIC REPUTATION DEFENSE.
            </span>
          </h2>

          <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
            Prova i due scenari qui sotto. Guarda come RIVO intercetta le recensioni negative prima che raggiungano Google.
          </p>

          {/* Interactive Simulation Switcher */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setMode('positive')}
              data-cursor="TEST"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-mono tracking-wider uppercase transition-all duration-300 ${
                ratingMode === 'positive'
                  ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <div className="flex text-amber-300">
                {'★★★★★'}
              </div>
              <span>TEST 5-STELLE (ECCELLENTE)</span>
            </button>

            <button
              onClick={() => setMode('negative')}
              data-cursor="SHIELD"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-mono tracking-wider uppercase transition-all duration-300 ${
                ratingMode === 'negative'
                  ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-[0_0_30px_rgba(245,158,11,0.6)] scale-105'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <div className="flex text-amber-300">
                {'★★☆☆☆'}
              </div>
              <span>TEST 2-STELLE (CRITICO)</span>
            </button>
          </div>
        </div>

        {/* Live Side-by-Side Metamorphosis Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Customer Phone Screen */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-[380px] rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative overflow-hidden">
              
              {/* Dynamic status pill */}
              <div className="flex items-center justify-between text-[11px] font-mono pb-4 border-b border-zinc-800">
                <span className="text-zinc-500">SCHERMO CLIENTE • TAVOLO 04</span>
                <span
                  className={
                    ratingMode === 'positive' ? 'text-emerald-400' : 'text-amber-400'
                  }
                >
                  {ratingMode === 'positive' ? 'GOOGLE REDIRECT' : 'INTERCEPTED'}
                </span>
              </div>

              {ratingMode === 'positive' ? (
                /* POSITIVE SCENARIO */
                <div className="py-6 flex flex-col items-center text-center animate-in fade-in duration-300">
                  <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} />
                  </div>

                  <div className="flex gap-1 text-[#F59E0B] text-xl mb-2">
                    {'★★★★★'}
                  </div>

                  <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">
                    Esperienza a 5 Stelle Verificata!
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2 max-w-xs">
                    Grazie di cuore! Aiutaci a far conoscere il nostro lavoro condividendo la tua recensione su Google.
                  </p>

                  <div className="w-full mt-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-black text-xs">
                        G
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white">Google Maps</div>
                        <div className="text-[10px] text-zinc-400">Voto preimpostato: 5 Stelle</div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-emerald-400 animate-pulse" />
                  </div>

                  <div className="mt-4 text-[10px] font-mono text-emerald-400">
                    ✓ Reindirizzamento istantaneo senza login
                  </div>
                </div>
              ) : (
                /* NEGATIVE SCENARIO (THE SHIELD ACTIVATION) */
                <div className="py-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-14 h-14 rounded-full bg-amber-950/80 border border-amber-500/80 text-amber-400 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                    <ShieldAlert size={32} />
                  </div>

                  <div className="flex gap-1 text-amber-500 text-xl mb-1">
                    {'★★☆☆☆'}
                  </div>

                  <div className="text-xs font-mono tracking-widest text-amber-400 uppercase font-semibold">
                    SHIELD ATTIVATO • GOOGLE BLOCCATO
                  </div>

                  {/* Cinematic Headline */}
                  <h3 className="text-3xl font-black text-white uppercase mt-3 font-['Space_Grotesk']">
                    LET’S TALK FIRST.
                  </h3>

                  <p className="text-xs text-zinc-300 mt-2 max-w-xs">
                    Ci dispiace sinceramente. Dicci subito cosa possiamo fare per riparare prima che tu te ne vada.
                  </p>

                  {/* Private Feedback Form */}
                  <div className="w-full mt-5 text-left">
                    <textarea
                      rows={2}
                      defaultValue="L'attesa per il secondo piatto è stata troppo lunga..."
                      className="w-full p-3 rounded-xl bg-zinc-900 border border-amber-500/40 text-xs text-zinc-200 focus:outline-none"
                    />

                    <button
                      onClick={() => {
                        setFeedbackSent(true);
                        sound.playTap();
                      }}
                      className="mt-3 w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send size={13} />
                      <span>{feedbackSent ? '✓ INVIATO DIRETTAMENTE AL MANAGER' : 'INVIA FEEDBACK PRIVATO AL DIRETTORE'}</span>
                    </button>
                  </div>

                  <div className="mt-3 text-[10px] font-mono text-zinc-500">
                    🔒 Nessun dato inviato a Google o piattaforme pubbliche
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Business Owner / Manager Smartwatch & Dashboard Alert */}
          <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-4 border-b border-zinc-800">
                <span className="flex items-center gap-2">
                  <Smartphone size={14} className="text-[#BFFF00]" />
                  <span>NOTIFICHE IN TEMPO REALE PROPRIETARIO</span>
                </span>
                <span className="text-[#BFFF00]">LIVE SYNC</span>
              </div>

              {ratingMode === 'positive' ? (
                <div className="py-6 space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0">
                      <Star size={20} className="fill-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Nuova Recensione Google +5★</div>
                      <div className="text-xs text-zinc-400 mt-1">
                        Cliente verificato via NFC Tavolo 04 ha confermato 5 stelle su Google Maps.
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-2">12 SECONDI FA • GOOGLE BUSINESS API</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
                    <span className="font-bold text-white">STATISTICHE MENSILI:</span> +42 recensioni positive questo mese. Posizionamento SEO locale migliorato di 3 posizioni.
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-4 animate-in fade-in duration-300">
                  {/* Urgent Manager Alert */}
                  <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center shrink-0 animate-bounce">
                      <Bell size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white flex items-center gap-2">
                        <span>⚠️ ALLERTA SERVIZIO TAVOLO 04</span>
                        <span className="text-[10px] font-mono bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">
                          URGENTE
                        </span>
                      </div>
                      <div className="text-xs text-amber-200/90 mt-1">
                        Ospite ha espresso insoddisfazione (attesa piatto). Intervento del maître suggerito prima del conto.
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-2">
                        NOTIFICA INVIATA A SMARTWATCH MAÎTRE • 3 SECONDI FA
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">DANNO REPUBBLICA GOOGLE EVITATO:</span>
                      <span className="text-emerald-400 font-mono font-bold">100% PREVENUTO</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">OPPORTUNITÀ RECUPERO CLIENTE:</span>
                      <span className="text-amber-400 font-mono font-bold">AL TAVOLO ORA</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom summary metric */}
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">RATING MEDIO PROTETTO</span>
              <span className="text-white font-bold text-sm">4.92 / 5.0 GOOGLE MAPS</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

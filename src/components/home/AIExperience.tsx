'use client';

import { useState } from 'react';
import { sound } from './SoundSystem';
import { Brain, Sparkles, Cpu, Clock, History, UserCheck, ArrowRight, Zap } from 'lucide-react';

interface AIProfile {
  id: string;
  name: string;
  type: string;
  context: {
    customer: string;
    touchpoint: string;
    time: string;
    history: string;
  };
  reasoning: {
    decision: string;
    confidence: string;
    impact: string;
    staffAction: string;
  };
}

const PROFILES: AIProfile[] = [
  {
    id: 'marco',
    name: 'Marco • Aperitivo VIP',
    type: 'Wine Bar & Bistrot',
    context: {
      customer: 'Ospite VIP (5 visite questo mese)',
      touchpoint: 'NFC Tavolo 04 (Terrazza)',
      time: 'Venerdì 19:42 • Picco Happy Hour',
      history: 'Spesa media €48 • Predilige Franciacorta & Crudi',
    },
    reasoning: {
      decision: 'Erogazione istantanea calice benvenuto chef su Wallet Pass',
      confidence: '98.4% Match Probabilistico',
      impact: '+42% permanenza media al tavolo • Upsell cena spontaneo',
      staffAction: 'Notifica smartwatch sommelier: "Marco al Tavolo 4, prepara calice benvenuto"',
    },
  },
  {
    id: 'elena',
    name: 'Elena • First-Time Guest',
    type: 'Specialty Coffee & Bakery',
    context: {
      customer: 'Nuovo Ospite (Nessun cookie, prima scansione)',
      touchpoint: 'Smart Stand Cassa',
      time: 'Lunedì 08:30 • Colazione rapida',
      history: 'Scansione Wi-Fi completata in 3 secondi',
    },
    reasoning: {
      decision: 'Proposta iscrizione 1-Tap Loyalty: "Il 5° caffè lo offre RIVO"',
      confidence: '94.2% Lead Conversion Rate',
      impact: '68% probabilità di seconda visita entro giovedì',
      staffAction: 'Scontrino include timbro digitale attivo su Apple Wallet',
    },
  },
  {
    id: 'luxury',
    name: 'Suite 204 • Ospite Hotel',
    type: 'Luxury Boutique Resort',
    context: {
      customer: 'Soggiorno 3 notti • Business Executive',
      touchpoint: 'Keycard NFC Comodino Camera',
      time: 'Giovedì 22:15 • Post-Conferenza',
      history: 'Preferenza per cuscini ergonomici e colazione salata',
    },
    reasoning: {
      decision: 'Concierge AI propone pre-ordine colazione camera e transfer aeroporto',
      confidence: '99.1% High-Intent Prediction',
      impact: 'Zero chiamate alla reception • Esperienza 5-stelle automatica',
      staffAction: 'Room Service programma consegna room 204 per le 07:15',
    },
  },
];

export default function AIExperience() {
  const [activeProfileId, setActiveProfileId] = useState<string>('marco');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const active = PROFILES.find((p) => p.id === activeProfileId) || PROFILES[0];

  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    setIsSynthesizing(true);
    sound.playTap();
    sound.playNeuralTick();

    setTimeout(() => {
      sound.playNeuralTick();
    }, 150);

    setTimeout(() => {
      sound.playLaser();
      setIsSynthesizing(false);
    }, 450);
  };

  return (
    <section
      id="ai"
      className="relative min-h-screen w-full bg-[#010103] text-white py-24 sm:py-36 px-4 sm:px-6 lg:px-8 border-t border-zinc-900/80 overflow-hidden"
    >
      {/* Void Neural Grid Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(191,255,0,0.06),rgba(255,255,255,0))]" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Typographic Cadence */}
        <div className="max-w-3xl mb-16 sm:mb-24">
          <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-ping" />
            <span>NEURAL REASONING CORE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black uppercase tracking-[-0.04em] leading-[0.95] font-['Space_Grotesk'] text-zinc-500">
            AND RIVO DOESN’T JUST <br />
            COLLECT DATA.
          </h2>

          <div className="h-6 sm:h-8" />

          <h3 className="text-4xl sm:text-6xl lg:text-8xl font-black uppercase tracking-[-0.04em] leading-[0.95] font-['Space_Grotesk'] text-white">
            IT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFFF00] to-cyan-300">UNDERSTANDS IT.</span>
          </h3>

          <p className="mt-8 text-base sm:text-lg text-zinc-400 max-w-xl font-light leading-relaxed">
            Nessun chatbot banale. RIVO analizza contesto, orario, storico e posizione fisica per prendere decisioni in tempo reale che aumentano il fatturato.
          </p>
        </div>

        {/* Live Scenario Selector Buttons */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none mb-10">
          <span className="text-xs font-mono text-zinc-500 uppercase mr-2 shrink-0">
            SCENARI DI TEST:
          </span>
          {PROFILES.map((p) => {
            const isSelected = p.id === activeProfileId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectProfile(p.id)}
                data-cursor="PROFILE"
                className={`px-4 py-2 rounded-full border text-xs font-mono tracking-wider transition-all duration-300 shrink-0 ${
                  isSelected
                    ? 'bg-[#BFFF00] text-black border-[#BFFF00] font-bold shadow-[0_0_20px_rgba(191,255,0,0.3)]'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* The Neural Synthesis Engine Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: 4 Context Vectors */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest px-1">
              INPUT REAL-TIME (4 VETTORI CONTESTUALI)
            </div>

            {/* Vector 1: Customer */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-[#BFFF00] shrink-0">
                <UserCheck size={16} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">IDENTITÀ OSPITE</span>
                <p className="text-xs sm:text-sm font-semibold text-zinc-200 mt-0.5">
                  {active.context.customer}
                </p>
              </div>
            </div>

            {/* Vector 2: Touchpoint */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-cyan-400 shrink-0">
                <Cpu size={16} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">TOUCHPOINT FISICO</span>
                <p className="text-xs sm:text-sm font-semibold text-zinc-200 mt-0.5">
                  {active.context.touchpoint}
                </p>
              </div>
            </div>

            {/* Vector 3: Time */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-amber-400 shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">TEMPO & STAGIONE</span>
                <p className="text-xs sm:text-sm font-semibold text-zinc-200 mt-0.5">
                  {active.context.time}
                </p>
              </div>
            </div>

            {/* Vector 4: History */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-purple-400 shrink-0">
                <History size={16} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">STORICO ACQUISTI</span>
                <p className="text-xs sm:text-sm font-semibold text-zinc-200 mt-0.5">
                  {active.context.history}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: AI Live Synthesis & Decision Ledger */}
          <div className="lg:col-span-7 rounded-2xl bg-zinc-950 border border-zinc-800/90 p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            
            {/* Glowing neural aura in corner */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#BFFF00]/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#BFFF00]">
                  <Brain size={16} className={isSynthesizing ? 'animate-spin' : ''} />
                  <span>RIVO DECISION MATRIX</span>
                </div>
                <span className="text-zinc-500">
                  {isSynthesizing ? 'COMPUTING VECTORS...' : 'SYNCHRONIZED (14ms)'}
                </span>
              </div>

              {/* Main Decision Output */}
              <div className="mt-6">
                <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">
                  AZIONE GENERATA AUTOMATICAMENTE
                </span>
                <h4 className="text-xl sm:text-2xl font-bold text-white mt-1 leading-snug font-['Space_Grotesk']">
                  {active.reasoning.decision}
                </h4>
              </div>

              {/* Decision Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">AFFIDABILITÀ AI</span>
                  <div className="text-sm font-bold text-[#BFFF00] font-mono mt-1">
                    {active.reasoning.confidence}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">IMPATTO ESTIMATO</span>
                  <div className="text-sm font-bold text-white mt-1">
                    {active.reasoning.impact}
                  </div>
                </div>
              </div>

              {/* Real-time Staff Dispatch Notification */}
              <div className="mt-4 p-4 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/30 text-xs">
                <div className="text-[10px] font-mono font-bold text-[#BFFF00] uppercase mb-1">
                  DISPATCH DIRETTO AL PERSONALE:
                </div>
                <div className="text-zinc-200">
                  {active.reasoning.staffAction}
                </div>
              </div>
            </div>

            {/* Bottom Engine Specs */}
            <div className="pt-6 mt-6 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>ZERO MACHINE LEARNING TRAINING BY MERCHANT</span>
              <span className="text-[#BFFF00]">READY OUT-OF-THE-BOX</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

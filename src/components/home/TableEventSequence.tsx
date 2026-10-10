'use client';

import { useState, useEffect } from 'react';
import { sound } from './SoundSystem';
import {
  Smartphone,
  Cpu,
  Route,
  Sparkles,
  Database,
  TrendingUp,
  Play,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';

interface Step {
  id: number;
  name: string;
  sub: string;
  metric: string;
  icon: typeof Smartphone;
  description: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    name: 'TAP',
    sub: 'Physical Contact',
    metric: '13.56 MHz',
    icon: Smartphone,
    description: 'Il cliente avvicina lo smartphone al touchpoint in alluminio spazzolato sul tavolo. Nessuna app richiesta.',
  },
  {
    id: 2,
    name: 'IDENTIFY',
    sub: 'Hardware Auth',
    metric: '11ms',
    icon: Cpu,
    description: 'Il chip crittografico RIVO UID #A992 invia una chiave di sessione effimera verificata via edge server.',
  },
  {
    id: 3,
    name: 'ROUTE',
    sub: 'Dynamic Routing',
    metric: 'Zero Config',
    icon: Route,
    description: 'Lo Smart Router analizza orario, giorno e storico del cliente per reindirizzare all’esperienza ideale.',
  },
  {
    id: 4,
    name: 'EXPERIENCE',
    sub: 'Instant Launch',
    metric: '0.2s Load',
    icon: Sparkles,
    description: 'Il telefono apre all’istante: Menu digitale, chiamata cameriere o recensione verificata.',
  },
  {
    id: 5,
    name: 'DATA',
    sub: 'Edge Ledger',
    metric: '100% Privacy',
    icon: Database,
    description: 'L’evento viene memorizzato senza cookie invasivi nel CRM del locale: tavolo, tempo di permanenza e interazione.',
  },
  {
    id: 6,
    name: 'INSIGHT',
    sub: 'Intelligence',
    metric: '+32% ROI',
    icon: TrendingUp,
    description: 'La direzione del ristorante visualizza all’istante la rotazione dei tavoli, feedback clienti e conversioni reali.',
  },
];

export default function TableEventSequence() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= 6) {
            setIsPlaying(false);
            return 1;
          }
          const next = prev + 1;
          sound.playTap();
          if (next === 2) sound.playLaser();
          if (next === 4) sound.playStar(5);
          return next;
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const selectStep = (id: number) => {
    setIsPlaying(false);
    setActiveStep(id);
    sound.playTap();
    if (id === 1) sound.playNfcPulse();
    if (id === 3) sound.playLaser();
  };

  const currentStep = STEPS.find((s) => s.id === activeStep) || STEPS[0];
  const progressPercent = ((activeStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <section className="relative min-h-screen w-full bg-[#050507] text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#BFFF00]/5 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 text-[11px] font-mono tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
            <span>REALITY TO DATA CONVERSION</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.03em] uppercase leading-tight font-['Space_Grotesk']">
            ONE TAP → <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              EVERYTHING HAPPENS.
            </span>
          </h2>

          <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
            Guarda come un singolo gesto nel mondo fisico attiva istantaneamente una catena neurale digitale.
          </p>

          {/* Interactive Play / Replay button */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                sound.playTap();
                setIsPlaying(!isPlaying);
              }}
              data-cursor="RUN"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-[#BFFF00] transition-colors"
            >
              {isPlaying ? (
                <>
                  <RotateCcw size={13} className="animate-spin" />
                  <span>PAUSA SIMULAZIONE</span>
                </>
              ) : (
                <>
                  <Play size={13} className="fill-black" />
                  <span>AVVIA CATENA EVENTI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* The Table & Fiber Visualizer Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Visual Scene (Table + Tag + Light Fiber) */}
          <div className="lg:col-span-6 relative flex flex-col items-center">
            
            {/* Fine dining table plane in 3D perspective */}
            <div className="relative w-full max-w-[420px] aspect-[4/3] rounded-3xl bg-gradient-to-b from-[#18181c] to-[#0d0d10] border border-zinc-800 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden">
              
              {/* Overhead spotlight cone */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-100/10 rounded-full blur-2xl pointer-events-none" />

              {/* Table ambient styling: Table Number + Wood grain hint */}
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>TERRAZZA • TAVOLO 04</span>
                <span className="text-zinc-400">SERVIZIO CENA</span>
              </div>

              {/* Center: The RIVO Physical Tag */}
              <div className="relative my-auto flex flex-col items-center">
                <div
                  className={`w-20 h-20 rounded-full border-2 transition-all duration-500 flex items-center justify-center relative ${
                    activeStep >= 1
                      ? 'border-[#BFFF00] shadow-[0_0_35px_rgba(191,255,0,0.6)] bg-zinc-900'
                      : 'border-zinc-700 bg-zinc-950'
                  }`}
                >
                  {/* Concentric antenna */}
                  <div className="w-14 h-14 rounded-full border border-dashed border-zinc-600 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Smartphone
                        size={16}
                        className={activeStep >= 1 ? 'text-[#BFFF00]' : 'text-zinc-500'}
                      />
                    </div>
                  </div>

                  {/* Pulsing shockwave on tap step */}
                  {activeStep === 1 && (
                    <div className="absolute -inset-4 rounded-full border border-[#BFFF00] animate-ping opacity-60" />
                  )}
                </div>

                <span className="mt-2 text-[10px] font-mono tracking-widest text-zinc-400">
                  RIVO NFC PUCK #T04
                </span>
              </div>

              {/* Bottom: Simulated Phone Tap representation */}
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-3 border-t border-zinc-800/80">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
                  <span>TAP STATUS: {activeStep >= 1 ? 'CONNESSO' : 'IN ATTESA'}</span>
                </span>
                <span className="text-[#BFFF00]">EDGE ACTIVE</span>
              </div>
            </div>

            {/* Glowing Energy Fiber Cable between Table and Edge */}
            <div className="w-full max-w-[420px] h-12 flex items-center justify-center relative">
              <div className="w-full h-0.5 bg-zinc-800 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#BFFF00] via-cyan-400 to-[#BFFF00] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Moving Data Photon */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#BFFF00] shadow-[0_0_16px_rgba(191,255,0,1)] transition-all duration-300 -translate-x-1/2"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Right Column: Step-by-Step Chain Reaction Ledger */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            {STEPS.map((step) => {
              const isCurrent = step.id === activeStep;
              const isPast = step.id < activeStep;
              const IconComp = step.icon;

              return (
                <div
                  key={step.id}
                  onClick={() => selectStep(step.id)}
                  data-cursor="STEP"
                  className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-start gap-4 ${
                    isCurrent
                      ? 'bg-zinc-900 border-[#BFFF00] shadow-[0_0_20px_rgba(191,255,0,0.15)] translate-x-1'
                      : isPast
                      ? 'bg-zinc-950/90 border-zinc-800 hover:border-zinc-700'
                      : 'bg-zinc-950/40 border-zinc-900/60 opacity-60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                      isCurrent
                        ? 'bg-[#BFFF00] text-black shadow-[0_0_15px_rgba(191,255,0,0.5)]'
                        : isPast
                        ? 'bg-zinc-800 text-emerald-400'
                        : 'bg-zinc-900 text-zinc-600'
                    }`}
                  >
                    {isPast ? <CheckCircle size={16} /> : `#0${step.id}`}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-white tracking-tight font-['Space_Grotesk']">
                          {step.name}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          / {step.sub}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {step.metric}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}

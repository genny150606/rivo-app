'use client';

import { useState, useEffect } from 'react';
import { sound } from './SoundSystem';
import {
  TrendingUp,
  Users,
  Star,
  Activity,
  ShieldCheck,
  Smartphone,
  Calendar,
  Layers,
} from 'lucide-react';

interface MetricData {
  interactions: number;
  leads: number;
  returning: number;
  ratingUplift: string;
  shieldDeflected: number;
}

const PERIODS: Record<'today' | 'week' | 'month', MetricData> = {
  today: {
    interactions: 2481,
    leads: 742,
    returning: 316,
    ratingUplift: '+18.4%',
    shieldDeflected: 14,
  },
  week: {
    interactions: 16840,
    leads: 4890,
    returning: 2150,
    ratingUplift: '+22.6%',
    shieldDeflected: 89,
  },
  month: {
    interactions: 68420,
    leads: 19410,
    returning: 9280,
    ratingUplift: '+28.1%',
    shieldDeflected: 342,
  },
};

export default function DataIntelligence() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [animatedCount, setAnimatedCount] = useState<number>(0);
  const [activeHour, setActiveHour] = useState<number>(19); // 7 PM peak

  const data = PERIODS[period];

  useEffect(() => {
    let start = 0;
    const end = data.interactions;
    const duration = 800;
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = end / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedCount(end);
        clearInterval(timer);
      } else {
        setAnimatedCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [period, data.interactions]);

  const handlePeriodChange = (p: 'today' | 'week' | 'month') => {
    setPeriod(p);
    sound.playTap();
    sound.playLaser();
  };

  return (
    <section
      id="intelligence"
      className="relative min-h-screen w-full bg-[#030305] text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-zinc-900"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 text-[11px] font-mono tracking-widest uppercase mb-4">
            <Activity size={13} className="text-[#BFFF00]" />
            <span>EXECUTIVE PHYSICAL TELEMETRY</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-[-0.03em] uppercase leading-tight font-['Space_Grotesk']">
            EVERY INTERACTION <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#BFFF00]">
              BECOMES INTELLIGENCE.
            </span>
          </h2>

          <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
            I tocchi fisici sui tavoli e banconi si aggregano in tempo reale, costruendo la prima mappa analitica completa del tuo spazio commerciale.
          </p>

          {/* Timeframe Filter Switcher */}
          <div className="mt-8 inline-flex p-1.5 rounded-full bg-zinc-900/90 border border-zinc-800">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                data-cursor="FILTER"
                className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase transition-all ${
                  period === p
                    ? 'bg-[#BFFF00] text-black font-bold shadow-[0_0_15px_rgba(191,255,0,0.4)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {p === 'today' ? 'OGGI' : p === 'week' ? 'QUESTA SETTIMANA' : 'QUESTO MESE'}
              </button>
            ))}
          </div>
        </div>

        {/* Live Constructed Dashboard */}
        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.85)] relative overflow-hidden">
          
          {/* Subtle green ambient trace */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#BFFF00]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Dashboard Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-zinc-800/80 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#BFFF00] animate-pulse" />
              <span className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                RIVO LIVE COMMAND CENTER
              </span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                12 ACTIVE VENUES
              </span>
            </div>

            <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
              <Calendar size={13} />
              <span>SYNC ATTIVO IN TEMPO REALE</span>
            </div>
          </div>

          {/* 4 Core Hero KPI Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
            
            {/* KPI 1 */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                INTERAZIONI FISICHE
              </span>
              <div className="my-2">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                  {animatedCount.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <TrendingUp size={12} /> +34.2% vs periodo precedente
              </span>
            </div>

            {/* KPI 2 */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                NUOVI LEAD CRM
              </span>
              <div className="my-2">
                <span className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono tracking-tight">
                  {data.leads.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                WhatsApp & Email verificate
              </span>
            </div>

            {/* KPI 3 */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                CLIENTI RICORRENTI (VIP)
              </span>
              <div className="my-2">
                <span className="text-3xl sm:text-4xl font-black text-[#BFFF00] font-mono tracking-tight">
                  {data.returning.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                Attraverso Apple/Google Wallet
              </span>
            </div>

            {/* KPI 4 */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                RATING GOOGLE UPLIFT
              </span>
              <div className="my-2">
                <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
                  {data.ratingUplift}
                </span>
              </div>
              <span className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                <ShieldCheck size={12} /> {data.shieldDeflected} recensioni negative bloccate
              </span>
            </div>

          </div>

          {/* Real-time Hourly Traffic Chart Simulation */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
              <div>
                <h4 className="text-sm font-bold text-white font-mono uppercase">
                  ATTIVITÀ FISICA PER ORA DEL GIORNO
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Picchi di scansione NFC e QR su tavoli, banconi e ingressi
                </p>
              </div>

              <div className="text-xs font-mono text-[#BFFF00] bg-[#BFFF00]/10 px-3 py-1 rounded-full border border-[#BFFF00]/30">
                PICCO ORE {activeHour}:00 ({activeHour === 19 ? 'APERITIVO' : activeHour === 13 ? 'PRANZO' : 'COLAZIONE'})
              </div>
            </div>

            {/* Interactive SVG Bar Distribution */}
            <div className="h-44 sm:h-52 w-full flex items-end gap-1 sm:gap-2 pt-6">
              {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((hour) => {
                // Peak heights based on restaurant / retail reality
                let hRatio = 0.2;
                if (hour === 8 || hour === 9) hRatio = 0.55;
                if (hour === 12 || hour === 13) hRatio = 0.85;
                if (hour === 18 || hour === 19) hRatio = 0.98;
                if (hour === 20 || hour === 21) hRatio = 0.9;
                if (hour === 22 || hour === 23) hRatio = 0.45;

                const isSelected = activeHour === hour;

                return (
                  <div
                    key={hour}
                    onClick={() => {
                      setActiveHour(hour);
                      sound.playTap();
                    }}
                    data-cursor="HOUR"
                    className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer"
                  >
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        isSelected
                          ? 'bg-[#BFFF00] shadow-[0_0_15px_rgba(191,255,0,0.6)]'
                          : 'bg-zinc-800 hover:bg-zinc-700'
                      }`}
                      style={{ height: `${Math.round(hRatio * 100)}%` }}
                    />
                    <span
                      className={`text-[9px] font-mono mt-2 transition-colors ${
                        isSelected ? 'text-[#BFFF00] font-bold' : 'text-zinc-500'
                      }`}
                    >
                      {hour}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

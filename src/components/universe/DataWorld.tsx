'use client';

import { useState } from 'react';
import Link from 'next/link';
import { universeAudio } from './UniverseAudio';
import {
  TrendingUp,
  Activity,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DataWorldProps {
  onClose: () => void;
}

export default function DataWorld({ onClose }: DataWorldProps) {
  const [selectedHour, setSelectedHour] = useState<number>(19);

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl bg-zinc-950/95 border border-zinc-800 p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-white animate-in fade-in zoom-in-95 duration-300">
      
      {/* World Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-zinc-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#BFFF00] uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
            <span>WORLD 06 • EXECUTIVE TELEMETRY & ATTRIBUTION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] mt-1">
            INTERACTION → EVENT → DATA → INSIGHT
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/analytics"
            target="_blank"
            onClick={() => universeAudio.playClick()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white hover:border-[#BFFF00] transition-colors"
          >
            <span>APRI /dashboard/analytics</span>
            <ExternalLink size={12} />
          </Link>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-full bg-zinc-900 text-xs font-mono text-zinc-400 hover:text-white border border-zinc-800"
          >
            CHIUDI MONDO [ESC]
          </button>
        </div>
      </div>

      {/* KPI Numerical Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">INTERAZIONI FISICHE</span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white mt-1">2,481</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1">+34.2% vs mese prec.</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">LEAD CRM ACQUISITI</span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-cyan-400 mt-1">742</div>
          <div className="text-[10px] text-zinc-400 font-mono mt-1">WhatsApp & Email opt-in</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">CLIENTI FIDELIZZATI</span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-[#BFFF00] mt-1">316</div>
          <div className="text-[10px] text-zinc-400 font-mono mt-1">Wallet Pass attivi</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">RATING REPUTATION</span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400 mt-1">+18.4%</div>
          <div className="text-[10px] text-amber-300 font-mono mt-1 flex items-center gap-1">
            <ShieldCheck size={11} /> 100% Shield Deflect
          </div>
        </div>
      </div>

      {/* Hourly Physical Footprint Telemetry Chart */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase">
              DISTRIBUZIONE ATTIVITÀ PER FASCIA ORARIA
            </h4>
            <p className="text-[11px] text-zinc-400">Clicca sulle barre per ispezionare il picco di interazioni reali.</p>
          </div>

          <div className="text-[10px] font-mono text-[#BFFF00] bg-[#BFFF00]/10 px-3 py-1 rounded-full border border-[#BFFF00]/30">
            ORE {selectedHour}:00 ({selectedHour >= 18 ? 'PICCO APERITIVO / CENA' : 'PRANZO'})
          </div>
        </div>

        {/* Dynamic Histogram Bars */}
        <div className="h-40 w-full flex items-end gap-1.5 sm:gap-2 pt-4">
          {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((h) => {
            let ratio = 0.2;
            if (h === 8 || h === 9) ratio = 0.55;
            if (h === 12 || h === 13) ratio = 0.85;
            if (h === 18 || h === 19) ratio = 0.98;
            if (h === 20 || h === 21) ratio = 0.88;
            if (h === 22 || h === 23) ratio = 0.45;

            const isSelected = selectedHour === h;

            return (
              <div
                key={h}
                onClick={() => {
                  setSelectedHour(h);
                  universeAudio.playClick();
                }}
                className="flex-1 h-full flex flex-col items-center justify-end cursor-pointer group"
              >
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    isSelected ? 'bg-[#BFFF00] shadow-[0_0_15px_rgba(191,255,0,0.6)]' : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                  style={{ height: `${Math.round(ratio * 100)}%` }}
                />
                <span className={`text-[8px] font-mono mt-1.5 ${isSelected ? 'text-[#BFFF00] font-bold' : 'text-zinc-600'}`}>
                  {h}h
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer connection to live dashboard */}
      <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400 mt-4">
        <span>DATI CRITTOGRAFATI AES-128 • SYNC IN TEMPO REALE</span>
        <Link
          href="/dashboard"
          target="_blank"
          onClick={() => universeAudio.playClick()}
          className="text-[#BFFF00] hover:underline flex items-center gap-1 font-bold"
        >
          <span>Accedi al Centro di Controllo</span>
          <ArrowRight size={13} />
        </Link>
      </div>

    </div>
  );
}

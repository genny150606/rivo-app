'use client';

import { useState } from 'react';
import Link from 'next/link';
import { universeAudio } from './UniverseAudio';
import {
  ShieldCheck,
  TrendingUp,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function SectionEcosystem() {
  const [selectedHour, setSelectedHour] = useState<number>(19);

  return (
    <section
      id="ecosystem"
      className="relative min-h-screen w-full py-28 px-4 sm:px-6 lg:px-8 flex flex-col justify-center border-t border-zinc-900/60"
    >
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-mono tracking-widest uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#BFFF00]" />
            <span>WORLD 06 • THE UNIFIED ECOSYSTEM & DATA</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.03em] text-white font-['Space_Grotesk'] leading-tight">
            ONE CONNECTED OS. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#BFFF00]">
              EVERY PHYSICAL TOUCHPOINT.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto">
            I mondi Restaurant, Retail, AI, Maps e Staff confluiscono in un unico flusso dati continuo. Ogni tocco fisico diventa intelligenza esecutiva.
          </p>
        </div>

        {/* Unified Dashboard Assembly Container */}
        <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">INTERAZIONI FISICHE</span>
              <div className="text-2xl sm:text-4xl font-mono font-black text-white mt-1">2,481</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-1">+34.2% vs periodo prec.</div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">LEAD CRM ACQUISITI</span>
              <div className="text-2xl sm:text-4xl font-mono font-black text-cyan-400 mt-1">742</div>
              <div className="text-[10px] text-zinc-400 font-mono mt-1">WhatsApp & Email verificate</div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">CLIENTI FIDELIZZATI</span>
              <div className="text-2xl sm:text-4xl font-mono font-black text-[#BFFF00] mt-1">316</div>
              <div className="text-[10px] text-zinc-400 font-mono mt-1">Wallet Pass attivi</div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">RATING REPUTATION</span>
              <div className="text-2xl sm:text-4xl font-mono font-black text-amber-400 mt-1">+18.4%</div>
              <div className="text-[10px] text-amber-300 font-mono mt-1 flex items-center gap-1">
                <ShieldCheck size={11} /> 100% Shield Deflect
              </div>
            </div>
          </div>

          {/* Hourly Telemetry Bar Distribution */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase">
                  ATTIVITÀ FISICA PER FASCIA ORARIA (NFC & QR TAPS)
                </h4>
                <p className="text-[11px] text-zinc-400">Clicca sulle barre per ispezionare i picchi reali di contatto.</p>
              </div>

              <div className="text-[10px] font-mono text-[#BFFF00] bg-[#BFFF00]/10 px-3 py-1 rounded-full border border-[#BFFF00]/30">
                ORE {selectedHour}:00 ({selectedHour >= 18 ? 'PICCO APERITIVO / CENA' : 'PRANZO'})
              </div>
            </div>

            <div className="h-44 w-full flex items-end gap-1.5 sm:gap-2 pt-4">
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

          {/* Action Row */}
          <div className="pt-6 mt-6 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>DATI PRIVACY-BY-DESIGN • GDPR COMPLIANT</span>
            <Link
              href="/dashboard/analytics"
              target="_blank"
              onClick={() => universeAudio.playClick()}
              className="text-[#BFFF00] hover:underline flex items-center gap-1 font-bold"
            >
              <span>Apri RIVO Analytics Dashboard</span>
              <ArrowRight size={13} />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}

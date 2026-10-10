'use client';

import { useState } from 'react';
import Link from 'next/link';
import { universeAudio } from './UniverseAudio';
import { ArrowDown, Radio, Sparkles, ArrowRight } from 'lucide-react';

interface SectionNucleusProps {
  onScrollNext?: () => void;
}

export default function SectionNucleus({ onScrollNext }: SectionNucleusProps = {}) {
  const [tapCount, setTapCount] = useState(0);
  const [hasTapped, setHasTapped] = useState(false);

  const handlePuckTap = () => {
    universeAudio.playNucleusActivate();
    universeAudio.playClick();
    setTapCount((prev) => prev + 1);
    setHasTapped(true);
  };

  const handleScrollNext = () => {
    universeAudio.playClick();
    if (onScrollNext) {
      onScrollNext();
      return;
    }
    const el = document.getElementById('restaurant');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="nucleus"
      className="relative min-h-screen w-full flex flex-col items-center justify-between pt-32 pb-16 px-4 sm:px-6 lg:px-8 select-none text-center"
    >
      {/* Top Status Hardware Pill */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl text-zinc-400 text-xs font-mono tracking-widest uppercase">
        <span className="w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
        <span>RIVO UNIVERSE • PERSISTENT GEOMETRIC NUCLEUS</span>
      </div>

      {/* Main Hero Composition */}
      <div className="max-w-5xl mx-auto my-auto flex flex-col items-center">
        
        {/* Interactive Physical NFC Puck (Center Focal Object) */}
        <div
          onClick={handlePuckTap}
          data-cursor="TAP"
          className="group relative cursor-pointer w-28 h-28 sm:w-36 sm:h-36 rounded-full my-6 flex items-center justify-center transition-all duration-500 hover:scale-105"
        >
          {/* Outer glowing rim */}
          <div className="absolute inset-0 rounded-full border border-zinc-700 bg-gradient-to-tr from-[#0a0a0d] via-[#16161c] to-[#22222a] p-[1.5px] shadow-[0_0_50px_rgba(0,0,0,0.9)] group-hover:border-[#BFFF00]/60 transition-colors">
            <div className="w-full h-full rounded-full bg-[#08080a] flex items-center justify-center relative overflow-hidden">
              
              {/* Concentric laser etched antenna spirals */}
              <svg className="w-24 h-24 text-zinc-700/60 group-hover:text-[#BFFF00]/40 transition-colors duration-500" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 2" />
                <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="0.9" />
                <circle cx="50" cy="50" r="24" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="1.1" />
              </svg>

              {/* Core Active Signal Transceiver */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    hasTapped
                      ? 'bg-[#BFFF00] text-black shadow-[0_0_24px_rgba(191,255,0,0.9)] scale-110'
                      : 'bg-zinc-900 border border-zinc-700 text-[#BFFF00] group-hover:border-[#BFFF00]'
                  }`}
                >
                  <Radio size={16} className={hasTapped ? 'animate-spin' : 'animate-pulse'} />
                </div>
                <span className="mt-1 text-[8px] font-mono tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                  {hasTapped ? `TAP #${tapCount}` : 'TAP ME'}
                </span>
              </div>

            </div>
          </div>

          <div className="absolute -inset-3 rounded-full border border-[#BFFF00]/25 animate-ping opacity-40 pointer-events-none" />
        </div>

        {/* 5-Second Instant Comprehension Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-[-0.04em] leading-[0.96] text-white font-['Space_Grotesk'] max-w-4xl">
          RIVO CONNECTS PHYSICAL CUSTOMER INTERACTIONS <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#BFFF00]">
            WITH DIGITAL EXPERIENCES AND BUSINESS TOOLS.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-lg text-zinc-400 max-w-2xl font-light leading-relaxed">
          Dai tavoli di ristoranti e banconi retail fino a intelligenza artificiale, gestione del personale e telemetria in tempo reale.
        </p>

        {/* Call to Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleScrollNext}
            className="group px-8 py-3.5 rounded-full bg-white text-black font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:bg-[#BFFF00] hover:shadow-[0_0_30px_rgba(191,255,0,0.6)] active:scale-95 flex items-center gap-2"
          >
            <span>ESPLORA L'UNIVERSO</span>
            <ArrowDown size={14} className="transition-transform group-hover:translate-y-0.5" />
          </button>

          <Link
            href="/login"
            onClick={() => universeAudio.playClick()}
            className="px-8 py-3.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-xs font-semibold uppercase hover:text-white hover:border-zinc-500 transition-colors flex items-center gap-2"
          >
            <span>ACCEDI AL DASHBOARD</span>
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>

      {/* Bottom Scroll Indicator */}
      <button
        onClick={handleScrollNext}
        className="flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mt-8"
      >
        <span className="text-[10px] font-mono tracking-widest uppercase">
          SCORRI IN BASSO PER ESPLORARE I 6 MONDI
        </span>
        <div className="w-5 h-8 rounded-full border border-zinc-700 flex items-start justify-center p-1">
          <span className="w-1 h-2 rounded-full bg-[#BFFF00] animate-bounce" />
        </div>
      </button>
    </section>
  );
}

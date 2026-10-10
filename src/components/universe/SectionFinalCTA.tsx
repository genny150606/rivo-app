'use client';

import Link from 'next/link';
import { universeAudio } from './UniverseAudio';
import { ArrowUpRight, Radio, Shield, Zap, Sparkles } from 'lucide-react';

export default function SectionFinalCTA() {
  const scrollToTop = () => {
    universeAudio.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section
      id="cta"
      className="relative min-h-screen w-full flex flex-col justify-between pt-32 pb-12 px-4 sm:px-6 lg:px-8 border-t border-zinc-900/60 select-none text-center"
    >
      <div className="max-w-4xl mx-auto my-auto flex flex-col items-center">
        
        {/* Monolithic RIVO Emblem */}
        <div
          onClick={() => {
            universeAudio.playNucleusActivate();
            universeAudio.playLaserBeam();
          }}
          className="group relative cursor-pointer w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-zinc-950 border border-zinc-700 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] transition-all duration-500 hover:border-[#BFFF00] hover:scale-105"
        >
          <div className="absolute inset-0 rounded-3xl bg-[#BFFF00]/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
          
          <svg
            className="w-10 h-10 text-white group-hover:text-[#BFFF00] transition-colors relative z-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>

          <div className="absolute -inset-2 rounded-3xl border border-[#BFFF00]/25 animate-pulse pointer-events-none" />
        </div>

        {/* Closing Monumental Headline */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-[-0.04em] leading-[0.92] font-['Space_Grotesk'] text-white">
          THE PHYSICAL WORLD <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#BFFF00]">
            JUST GOT AN INTERFACE.
          </span>
        </h2>

        {/* Clear Subtitle */}
        <p className="mt-8 text-base sm:text-xl text-zinc-400 max-w-2xl font-light leading-relaxed">
          Connetti la tua attività fisica a RIVO. Zero app da scaricare per i clienti, attivazione in 10 minuti, risultati immediati dal primo tocco.
        </p>

        {/* Action Pair */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/login"
            onClick={() => universeAudio.playClick()}
            className="w-full sm:w-auto group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white text-black font-mono font-bold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-[#BFFF00] hover:shadow-[0_0_35px_rgba(191,255,0,0.6)] active:scale-95"
          >
            <span>BUILD YOUR EXPERIENCE →</span>
            <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <Link
            href="/dashboard"
            onClick={() => universeAudio.playClick()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-sm tracking-wider uppercase hover:text-white hover:border-zinc-500 transition-colors"
          >
            <span>ACCEDI AL DASHBOARD</span>
          </Link>
        </div>

        {/* Hardware & Standards Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-zinc-500 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Radio size={13} className="text-[#BFFF00]" />
            <span>NFC FORUM TYPE 5 CERTIFIED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield size={13} className="text-[#BFFF00]" />
            <span>100% GDPR PRIVACY BY DESIGN</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-[#BFFF00]" />
            <span>SUB-SECOND EDGE DISPATCH</span>
          </div>
        </div>

      </div>

      {/* Minimal Footer */}
      <footer className="w-full max-w-7xl mx-auto pt-16 mt-16 border-t border-zinc-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 font-mono gap-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-zinc-300">RIVO™ PLATFORM</span>
          <span>© 2026</span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ALL SYSTEMS NORMAL
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-zinc-300 transition-colors">
            LOGIN
          </Link>
          <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
            DASHBOARD
          </Link>
          <button
            onClick={scrollToTop}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            TORNA IN CIMA ↑
          </button>
        </div>
      </footer>
    </section>
  );
}

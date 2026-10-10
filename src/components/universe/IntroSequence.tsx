'use client';

import { useEffect, useState } from 'react';
import { universeAudio } from './UniverseAudio';
import { Sparkles } from 'lucide-react';

interface IntroSequenceProps {
  onComplete: () => void;
}

export default function IntroSequence({ onComplete }: IntroSequenceProps) {
  const [phase, setPhase] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState(false);

  const skip = () => {
    if (isDismissed) return;
    setIsDismissed(true);
    universeAudio.playNucleusActivate();
    onComplete();
  };

  useEffect(() => {
    // Check reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }

    // Keyboard ESC to skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        skip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Sequence stages
    const t1 = setTimeout(() => setPhase(1), 400); // Point appears
    const t2 = setTimeout(() => {
      setPhase(2);
      universeAudio.playClick();
    }, 1100); // Geometric lines converge
    const t3 = setTimeout(() => {
      setPhase(3);
      universeAudio.playNucleusActivate();
    }, 1800); // Neon energy bursts & identity reveals
    const t4 = setTimeout(() => {
      skip();
    }, 2800); // Auto complete

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  if (isDismissed) return null;

  return (
    <div
      onClick={skip}
      className="fixed inset-0 z-[999] bg-[#020204] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden transition-opacity duration-700"
    >
      {/* Subtle background ambient pulse */}
      <div
        className={`absolute w-[480px] h-[480px] rounded-full blur-[120px] transition-all duration-1000 ${
          phase >= 3 ? 'bg-[#BFFF00]/15 scale-125' : 'bg-white/5 scale-90'
        }`}
      />

      {/* Symmetrical Geometric Assembly Core */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        {/* Stage 1: Singularity Point */}
        <div
          className={`absolute w-3 h-3 rounded-full bg-white transition-all duration-700 ${
            phase >= 1 ? 'scale-100 opacity-100 shadow-[0_0_20px_#fff]' : 'scale-0 opacity-0'
          }`}
        />

        {/* Stage 2: Concentric Interlocking Wireframe Rings */}
        <svg
          className={`absolute inset-0 w-full h-full text-zinc-600 transition-all duration-700 ${
            phase >= 2 ? 'opacity-100 rotate-90 scale-100' : 'opacity-0 rotate-0 scale-50'
          }`}
          viewBox="0 0 100 100"
          fill="none"
        >
          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 2" />
          <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="24" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
          <polygon points="50,15 85,50 50,85 15,50" stroke="currentColor" strokeWidth="0.8" />
        </svg>

        {/* Stage 3: Neon Green Energy Ignition */}
        <div
          className={`absolute inset-4 rounded-full border-2 border-[#BFFF00] transition-all duration-500 flex items-center justify-center ${
            phase >= 3
              ? 'opacity-100 scale-100 shadow-[0_0_35px_rgba(191,255,0,0.8)]'
              : 'opacity-0 scale-75'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-[#BFFF00] flex items-center justify-center text-[#BFFF00] shadow-[0_0_15px_rgba(191,255,0,0.6)]">
            <span className="font-mono font-black text-xs">R</span>
          </div>
        </div>
      </div>

      {/* Typography Reveal */}
      <div
        className={`mt-10 flex flex-col items-center text-center transition-all duration-700 ${
          phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <span className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] font-['Space_Grotesk'] text-white">
          RIVO
        </span>
        <span className="text-[10px] font-mono tracking-widest text-[#BFFF00] uppercase mt-1">
          THE INTERACTIVE UNIVERSE
        </span>
      </div>

      {/* Skip Hint */}
      <div className="absolute bottom-10 flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase">
        <Sparkles size={12} className="text-[#BFFF00]" />
        <span>CLICK OR PRESS ESC TO ENTER IMMEDIATELY</span>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { sound } from './SoundSystem';

interface NavbarProps {
  onNavigate?: (sectionId: string) => void;
}

export default function HomeNavbar({ onNavigate }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMuted(sound.getMuted());

    const handleSoundToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isMuted: boolean }>;
      setIsMuted(customEvent.detail.isMuted);
    };

    window.addEventListener('rivo-sound-toggle', handleSoundToggle);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('rivo-sound-toggle', handleSoundToggle);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSoundClick = () => {
    const newMuted = sound.toggleMute();
    setIsMuted(newMuted);
  };

  const scrollTo = (id: string) => {
    sound.playTap();
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(id);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isScrolled
          ? 'py-3 bg-[#050507]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.8)]'
          : 'py-5 sm:py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Mark */}
        <Link
          href="/"
          onClick={() => sound.playTap()}
          className="group flex items-center gap-3 select-none"
          data-cursor="RIVO"
        >
          <div className="relative w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105 group-hover:border-[#BFFF00]/60">
            {/* Ambient LED glow behind mark */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#BFFF00]/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
            
            {/* Concentric NFC antenna emblem */}
            <svg
              className="w-4 h-4 text-zinc-100 group-hover:text-[#BFFF00] transition-colors relative z-10"
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
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-['Space_Grotesk']">
                RIVO
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono tracking-widest text-[#BFFF00] uppercase bg-[#BFFF00]/10 border border-[#BFFF00]/30 rounded">
                OS 2.0
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Minimal Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 rounded-full px-4 py-1.5 bg-zinc-900/60 border border-white/[0.08] backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
          <button
            onClick={() => scrollTo('portal')}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]"
            data-cursor="EXPLORE"
          >
            EXPERIENCE
          </button>
          <button
            onClick={() => scrollTo('touchpoints')}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]"
            data-cursor="TOUCHPOINTS"
          >
            PHYSICAL WORLD
          </button>
          <button
            onClick={() => scrollTo('shield')}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]"
            data-cursor="SHIELD"
          >
            REVIEW SHIELD
          </button>
          <button
            onClick={() => scrollTo('ai')}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]"
            data-cursor="AI"
          >
            AI CORE
          </button>
          <button
            onClick={() => scrollTo('intelligence')}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]"
            data-cursor="DATA"
          >
            INTELLIGENCE
          </button>
          <button
            onClick={() => scrollTo('industries')}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.05]"
            data-cursor="INDUSTRIES"
          >
            INDUSTRIES
          </button>
        </nav>

        {/* Right CTA / Sound Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Sound Synthesizer Audio Button */}
          <button
            onClick={handleSoundClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all duration-300 ${
              !isMuted
                ? 'bg-[#BFFF00]/10 border-[#BFFF00]/40 text-[#BFFF00] shadow-[0_0_12px_rgba(191,255,0,0.2)]'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            data-cursor="AUDIO"
            title={isMuted ? 'Abilita audio immersivo' : 'Disabilita audio'}
            aria-label="Sound Toggle"
          >
            {!isMuted ? (
              <>
                <Volume2 size={13} className="text-[#BFFF00] animate-pulse" />
                <span className="hidden sm:inline text-[10px] tracking-wider uppercase font-semibold">
                  AUDIO ON
                </span>
                <span className="flex items-center gap-0.5 h-2.5">
                  <span className="w-0.5 h-2 bg-[#BFFF00] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-0.5 h-3 bg-[#BFFF00] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-0.5 h-1.5 bg-[#BFFF00] rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              </>
            ) : (
              <>
                <VolumeX size={13} />
                <span className="hidden sm:inline text-[10px] tracking-wider uppercase">
                  AUDIO
                </span>
              </>
            )}
          </button>

          {/* Login Link */}
          <Link
            href="/login"
            onClick={() => sound.playTap()}
            className="hidden sm:inline-flex text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 transition-colors"
            data-cursor="LOGIN"
          >
            LOGIN
          </Link>

          {/* Primary Action Button */}
          <Link
            href="/login"
            onClick={() => sound.playTap()}
            className="relative group overflow-hidden px-4 py-2 rounded-full bg-white text-black font-semibold text-xs tracking-tight transition-all duration-300 hover:bg-[#BFFF00] hover:shadow-[0_0_24px_rgba(191,255,0,0.5)] active:scale-95"
            data-cursor="START"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <span>GET STARTED</span>
              <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => {
              sound.playTap();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="lg:hidden p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-full bg-[#09090B]/95 backdrop-blur-2xl border-b border-zinc-800 p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <button
            onClick={() => scrollTo('portal')}
            className="text-left text-sm font-medium text-zinc-300 hover:text-[#BFFF00] py-2 border-b border-zinc-800/60"
          >
            EXPERIENCE SYSTEM
          </button>
          <button
            onClick={() => scrollTo('touchpoints')}
            className="text-left text-sm font-medium text-zinc-300 hover:text-[#BFFF00] py-2 border-b border-zinc-800/60"
          >
            PHYSICAL WORLD
          </button>
          <button
            onClick={() => scrollTo('shield')}
            className="text-left text-sm font-medium text-zinc-300 hover:text-[#BFFF00] py-2 border-b border-zinc-800/60"
          >
            REVIEW SHIELD DEMO
          </button>
          <button
            onClick={() => scrollTo('ai')}
            className="text-left text-sm font-medium text-zinc-300 hover:text-[#BFFF00] py-2 border-b border-zinc-800/60"
          >
            AI REASONING CORE
          </button>
          <button
            onClick={() => scrollTo('intelligence')}
            className="text-left text-sm font-medium text-zinc-300 hover:text-[#BFFF00] py-2 border-b border-zinc-800/60"
          >
            INTELLIGENCE DASHBOARD
          </button>
          <button
            onClick={() => scrollTo('industries')}
            className="text-left text-sm font-medium text-zinc-300 hover:text-[#BFFF00] py-2 border-b border-zinc-800/60"
          >
            INDUSTRIES METAMORPHOSIS
          </button>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full text-center py-2.5 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700"
            >
              LOGIN TO DASHBOARD
            </Link>
            <Link
              href="/login"
              className="w-full text-center py-2.5 rounded-lg bg-[#BFFF00] text-black text-sm font-bold shadow-[0_0_20px_rgba(191,255,0,0.3)]"
            >
              BUILD YOUR EXPERIENCE →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { universeAudio } from './UniverseAudio';
import {
  Volume2,
  VolumeX,
  ArrowUpRight,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

export default function UniverseHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('nucleus');

  useEffect(() => {
    setIsMuted(!universeAudio.isSoundActive());

    const handleSoundChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isMuted: boolean }>;
      setIsMuted(customEvent.detail.isMuted);
    };

    window.addEventListener('rivo-universe-sound-changed', handleSoundChange);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);

      const sections = ['nucleus', 'restaurant', 'retail', 'ai', 'maps', 'staff', 'ecosystem', 'cta'];
      const scrollPos = window.scrollY + 200;

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('rivo-universe-sound-changed', handleSoundChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSoundToggle = () => {
    const muted = universeAudio.toggleMute();
    setIsMuted(muted);
  };

  const scrollTo = (id: string) => {
    universeAudio.playClick();
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-3 bg-[#020204]/80 backdrop-blur-xl border-b border-zinc-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.8)]'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Core */}
        <button
          onClick={() => scrollTo('nucleus')}
          className="group flex items-center gap-2.5 text-left select-none"
        >
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-black flex items-center justify-center border border-zinc-800 group-hover:border-[#BFFF00]/60 transition-colors">
            <Image
              src="/brand/rivo-icon.png"
              alt="RIVO Emblem"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-['Space_Grotesk'] leading-none">
                RIVO
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#BFFF00] uppercase bg-[#BFFF00]/10 border border-[#BFFF00]/30 px-1 py-0.5 rounded">
                UNIVERSE
              </span>
            </div>
          </div>
        </button>

        {/* Center Desktop Anchor Links */}
        <nav className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl shadow-lg">
          {[
            { id: 'nucleus', label: 'NUCLEUS' },
            { id: 'restaurant', label: 'RESTAURANT' },
            { id: 'retail', label: 'RETAIL' },
            { id: 'ai', label: 'AI CORE' },
            { id: 'maps', label: 'MAPS' },
            { id: 'staff', label: 'STAFF' },
            { id: 'ecosystem', label: 'ECOSYSTEM' },
          ].map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`px-3 py-1 rounded-full text-xs font-mono tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-[#BFFF00] text-black font-bold shadow-[0_0_15px_rgba(191,255,0,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Controls & Login */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Wave Toggle */}
          <button
            onClick={handleSoundToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all ${
              !isMuted
                ? 'bg-[#BFFF00]/10 border-[#BFFF00]/40 text-[#BFFF00] shadow-[0_0_15px_rgba(191,255,0,0.2)]'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title={isMuted ? 'Abilita audio' : 'Disabilita audio'}
          >
            {!isMuted ? (
              <>
                <Volume2 size={13} className="text-[#BFFF00]" />
                <span className="hidden sm:inline text-[10px] tracking-widest uppercase">SOUND ON</span>
                <span className="flex items-center gap-0.5 h-2">
                  <span className="w-0.5 h-2 bg-[#BFFF00] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-0.5 h-3 bg-[#BFFF00] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-0.5 h-1.5 bg-[#BFFF00] rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              </>
            ) : (
              <>
                <VolumeX size={13} />
                <span className="hidden sm:inline text-[10px] tracking-widest uppercase">MUTE</span>
              </>
            )}
          </button>

          {/* Login Route */}
          <Link
            href="/login"
            onClick={() => universeAudio.playClick()}
            className="hidden sm:inline-flex text-xs font-medium font-mono text-zinc-300 hover:text-white px-3 py-1.5 transition-colors"
          >
            LOGIN
          </Link>

          {/* Primary Action Button */}
          <Link
            href="/login"
            onClick={() => universeAudio.playClick()}
            className="relative group overflow-hidden px-4 py-2 rounded-full bg-white text-black font-semibold text-xs tracking-tight transition-all duration-300 hover:bg-[#BFFF00] hover:shadow-[0_0_25px_rgba(191,255,0,0.5)] active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-1.5 font-mono">
              <span>GET STARTED</span>
              <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => {
              universeAudio.playClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="lg:hidden p-2 rounded-xl bg-zinc-950/90 border border-zinc-800 text-zinc-300 hover:text-white"
            aria-label="Toggle Mobile Navigation"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-full bg-[#020204]/98 backdrop-blur-2xl border-b border-zinc-800 p-6 flex flex-col gap-3 animate-in fade-in duration-200">
          {[
            { id: 'nucleus', label: 'THE NUCLEUS' },
            { id: 'restaurant', label: 'RESTAURANT WORLD' },
            { id: 'retail', label: 'RETAIL INVENTORY' },
            { id: 'ai', label: 'RIVO AI CORE' },
            { id: 'maps', label: 'MAPS & LOCATIONS' },
            { id: 'staff', label: 'STAFF & OPERATIONS' },
            { id: 'ecosystem', label: 'THE ECOSYSTEM' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-left text-sm font-mono text-zinc-300 hover:text-[#BFFF00] py-2 border-b border-zinc-800/60"
            >
              {item.label}
            </button>
          ))}

          <div className="pt-4 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full text-center py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs font-semibold"
            >
              ACCEDI AL DASHBOARD
            </Link>
            <Link
              href="/login"
              className="w-full text-center py-2.5 rounded-xl bg-[#BFFF00] text-black font-mono text-xs font-bold shadow-[0_0_20px_rgba(191,255,0,0.4)]"
            >
              INIZIA SUBITO →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

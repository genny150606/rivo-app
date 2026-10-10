'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { universeAudio } from './UniverseAudio';
import { WorldId, WORLDS_CONFIG } from './UniverseScene';
import {
  Volume2,
  VolumeX,
  Compass,
  ArrowUpRight,
  Menu,
  X,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface UniverseHUDProps {
  activeWorld: WorldId | null;
  onSelectWorld: (world: WorldId) => void;
  onReturnToNucleus: () => void;
  onToggleAccessibleView: () => void;
  isAccessibleView: boolean;
}

export default function UniverseHUD({
  activeWorld,
  onSelectWorld,
  onReturnToNucleus,
  onToggleAccessibleView,
  isAccessibleView,
}: UniverseHUDProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsMuted(!universeAudio.isSoundActive());

    const handleSoundChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isMuted: boolean }>;
      setIsMuted(customEvent.detail.isMuted);
    };

    window.addEventListener('rivo-universe-sound-changed', handleSoundChange);
    return () => window.removeEventListener('rivo-universe-sound-changed', handleSoundChange);
  }, []);

  const handleSoundToggle = () => {
    const muted = universeAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <>
      {/* Top Floating Glass Command Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-4 flex items-center justify-between pointer-events-none">
        {/* Brand Core Identity */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => {
              universeAudio.playClick();
              onReturnToNucleus();
            }}
            className="group flex items-center gap-2.5 p-1 rounded-xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl hover:border-[#BFFF00]/60 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
            title="Return to Central Nucleus"
          >
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-black flex items-center justify-center border border-zinc-800 group-hover:border-[#BFFF00]/40 transition-colors">
              <Image
                src="/brand/rivo-icon.png"
                alt="RIVO Emblem"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="pr-2 flex flex-col text-left">
              <span className="font-extrabold text-sm tracking-tight text-white font-['Space_Grotesk'] leading-none">
                RIVO
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#BFFF00] uppercase mt-0.5">
                UNIVERSE
              </span>
            </div>
          </button>

          {/* Reset / Return to Nucleus Action when in a World */}
          {activeWorld && (
            <button
              onClick={() => {
                universeAudio.playClick();
                onReturnToNucleus();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white hover:border-[#BFFF00] transition-all pointer-events-auto"
            >
              <RotateCcw size={12} className="text-[#BFFF00]" />
              <span>NUCLEUS</span>
            </button>
          )}
        </div>

        {/* Center Spatial Compass Navigation Dock */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-zinc-950/85 border border-zinc-800/90 backdrop-blur-xl shadow-2xl pointer-events-auto">
          {WORLDS_CONFIG.map((world) => {
            const isActive = activeWorld === world.id;
            return (
              <button
                key={world.id}
                onClick={() => {
                  universeAudio.playClick();
                  onSelectWorld(world.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-[#BFFF00] text-black font-bold shadow-[0_0_20px_rgba(191,255,0,0.5)] scale-105'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {world.name}
              </button>
            );
          })}
        </nav>

        {/* Right Utility & Real Business Routes */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Audio Synthesizer Wave Toggle */}
          <button
            onClick={handleSoundToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all ${
              !isMuted
                ? 'bg-[#BFFF00]/10 border-[#BFFF00]/40 text-[#BFFF00] shadow-[0_0_15px_rgba(191,255,0,0.2)]'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title={isMuted ? 'Abilita audio universale' : 'Disabilita audio'}
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

          {/* Accessible 2D Grid Switcher */}
          <button
            onClick={onToggleAccessibleView}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all ${
              isAccessibleView
                ? 'bg-zinc-800 border-zinc-600 text-white'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Passa a visualizzazione 2D accessibile"
          >
            <Layers size={13} className="text-[#BFFF00]" />
            <span className="text-[10px] tracking-wider uppercase">
              {isAccessibleView ? '3D UNIVERSE' : 'LIST VIEW'}
            </span>
          </button>

          {/* Real Authentication Route */}
          <Link
            href="/login"
            onClick={() => universeAudio.playClick()}
            className="hidden sm:inline-flex text-xs font-medium font-mono text-zinc-300 hover:text-white px-3 py-1.5 transition-colors"
          >
            LOGIN
          </Link>

          {/* Real Executive Dashboard Route */}
          <Link
            href="/dashboard"
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
              setMenuOpen(!menuOpen);
            }}
            className="lg:hidden p-2 rounded-xl bg-zinc-950/90 border border-zinc-800 text-zinc-300 hover:text-white"
            aria-label="Toggle Mobile Universe Menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-[#020204]/98 backdrop-blur-2xl p-6 flex flex-col justify-between animate-in fade-in duration-200">
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Image src="/brand/rivo-icon.png" alt="RIVO" width={28} height={28} className="rounded" />
                <span className="font-bold text-lg text-white">RIVO UNIVERSE</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg bg-zinc-900 text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-6 flex flex-col gap-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
                ESPLORA I 6 MONDI RIVO:
              </span>
              {WORLDS_CONFIG.map((world) => (
                <button
                  key={world.id}
                  onClick={() => {
                    universeAudio.playClick();
                    onSelectWorld(world.id);
                    setMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                    activeWorld === world.id
                      ? 'bg-[#BFFF00]/10 border-[#BFFF00] text-white'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div>
                    <div className="font-bold font-mono text-sm">{world.name}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{world.tagline}</div>
                  </div>
                  <span className="text-[10px] font-mono text-[#BFFF00]">{world.metric}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full text-center py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs font-semibold"
            >
              LOGIN TO DASHBOARD
            </Link>
            <Link
              href="/dashboard"
              className="w-full text-center py-3 rounded-xl bg-[#BFFF00] text-black font-mono text-xs font-bold shadow-[0_0_20px_rgba(191,255,0,0.4)]"
            >
              INIZIA ORA • REGISTRA IL LOCALE →
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Floating Telemetry Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between text-[11px] font-mono text-zinc-500 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-pulse" />
          <span className="text-zinc-400">
            {activeWorld
              ? `DESTINATION: [${activeWorld.toUpperCase()}] • SPATIAL NODE ACTIVE`
              : 'NUCLEUS STATUS: PERSISTENT CORE • 6 WORLDS SYNCED'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-4 pointer-events-auto">
          <span className="hover:text-zinc-300 transition-colors">
            NFC 13.56 MHz • GDPR PRIVACY BY DESIGN • EDGE LOW-LATENCY
          </span>
        </div>
      </footer>
    </>
  );
}

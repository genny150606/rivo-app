'use client';

import { useState } from 'react';
import Link from 'next/link';
import { universeAudio } from './UniverseAudio';
import {
  Smartphone,
  BellRing,
  Star,
  Award,
  Utensils,
  ArrowRight,
  CheckCircle,
  Radio,
  ExternalLink,
} from 'lucide-react';

export default function SectionRestaurant() {
  const [step, setStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'call' | 'menu' | 'review' | 'loyalty'>('call');
  const [callSent, setCallSent] = useState(false);
  const [stampCount, setStampCount] = useState(4);
  const [stars, setStars] = useState(5);

  const handlePuckTap = () => {
    universeAudio.playNucleusActivate();
    universeAudio.playClick();
    setStep(2);
    setTimeout(() => {
      setStep(3);
      universeAudio.playStaffAlert();
    }, 500);
    setTimeout(() => {
      setStep(4);
      universeAudio.playLaserBeam();
    }, 1100);
  };

  return (
    <section
      id="restaurant"
      className="relative min-h-screen w-full py-28 px-4 sm:px-6 lg:px-8 flex flex-col justify-center border-t border-zinc-900/60"
    >
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-mono tracking-widest uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#BFFF00]" />
            <span>WORLD 01 • RESTAURANT OS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.03em] text-white font-['Space_Grotesk'] leading-tight">
            PHYSICAL TABLE TO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#BFFF00]">
              DIGITAL EXPERIENCE.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Il cliente tocca il touchpoint NFC al tavolo. Nessuna app da scaricare. In 0.2 secondi si apre il menu, la chiamata cameriere o la recensione 5 stelle.
          </p>
        </div>

        {/* 4-Step Chain Reaction Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { num: 1, label: 'PHYSICAL TAP', desc: 'Chip NFC 13.56 MHz sul tavolo' },
            { num: 2, label: 'DIGITAL EXP', desc: '0.2s Safari / Chrome nativo' },
            { num: 3, label: 'BUSINESS EVENT', desc: 'Notifica smartwatch cameriere' },
            { num: 4, label: 'EDGE DATA', desc: 'Telemetria permanenza tavolo' },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-4 rounded-2xl border text-left transition-all ${
                step >= s.num
                  ? 'bg-zinc-900/90 border-[#BFFF00]/60 text-white shadow-[0_0_20px_rgba(191,255,0,0.15)]'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-500'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-xs font-bold">
                <span>0{s.num}. {s.label}</span>
                {step >= s.num && <CheckCircle size={13} className="text-[#BFFF00]" />}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* The Dual Architectural Scene (Table + Mobile Screen) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-zinc-950/80 border border-zinc-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          {/* Left: Fine Dining Table Model */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-tr from-[#121216] via-[#1a1a24] to-[#0c0c0f] border border-zinc-700/80 p-6 flex flex-col justify-between relative shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center text-xs font-mono text-zinc-500">
                <span>SALA TERRAZZA • TAVOLO 04</span>
                <span className="text-[#BFFF00]">HARDWARE CHIP ID #RVO-404</span>
              </div>

              {/* The Physical Touchpoint Puck */}
              <div className="my-auto flex flex-col items-center">
                <div
                  onClick={handlePuckTap}
                  className="group relative cursor-pointer w-24 h-24 rounded-full border-2 border-zinc-600 bg-zinc-900 flex items-center justify-center transition-all duration-300 hover:border-[#BFFF00] hover:scale-105 shadow-[0_0_35px_rgba(0,0,0,0.8)]"
                >
                  <div className="absolute inset-1 rounded-full border border-dashed border-zinc-700 group-hover:border-[#BFFF00]/50" />
                  <div className="w-10 h-10 rounded-full bg-zinc-950 flex items-center justify-center text-[#BFFF00] group-hover:bg-[#BFFF00] group-hover:text-black transition-colors">
                    <Radio size={20} className="animate-pulse" />
                  </div>
                  <div className="absolute -inset-3 rounded-full border border-[#BFFF00]/30 animate-ping opacity-40 pointer-events-none" />
                </div>
                <span className="mt-3 text-xs font-mono tracking-widest text-zinc-400">
                  CLICCA IL PUCK PER SIMULARE IL TAP
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-t border-zinc-800/80 pt-3">
                <span>STATO CONTATTO: {step >= 2 ? 'ATTIVO (11ms)' : 'IN ATTESA'}</span>
                <span className="text-emerald-400">ZERO APP INSTALLATE</span>
              </div>
            </div>
          </div>

          {/* Right: Working Mobile Guest OS */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-[340px] rounded-[36px] bg-[#0c0c0e] border-[5px] border-zinc-800 p-4 shadow-2xl">
              <div className="mx-auto w-20 h-4 bg-black rounded-full mb-3" />

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pb-2 border-b border-zinc-800">
                <span>RIVO GUEST OS</span>
                <span className="text-[#BFFF00]">TAVOLO 04</span>
              </div>

              {/* Module Selector */}
              <div className="grid grid-cols-4 gap-1 my-3 bg-zinc-900/80 p-1 rounded-xl">
                {[
                  { id: 'call', label: 'CHIAMA', icon: BellRing },
                  { id: 'menu', label: 'MENU', icon: Utensils },
                  { id: 'review', label: 'REVIEW', icon: Star },
                  { id: 'loyalty', label: 'WALLET', icon: Award },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      universeAudio.playClick();
                    }}
                    className={`py-1.5 rounded-lg flex flex-col items-center text-[9px] font-mono font-bold transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#BFFF00] text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <tab.icon size={13} className="mb-0.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Module Panel */}
              <div className="min-h-[220px] py-2 flex flex-col justify-between text-left">
                {activeTab === 'call' && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-white">Chiamata Cameriere al Tavolo</div>
                    <p className="text-[11px] text-zinc-400">Notifica istantanea inviata allo smartwatch del personale di servizio.</p>
                    <button
                      onClick={() => {
                        setCallSent(true);
                        universeAudio.playStaffAlert();
                        setTimeout(() => setCallSent(false), 3000);
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <BellRing size={14} />
                      <span>{callSent ? '✓ CAMERIERE AVVISATO' : 'CHIAMA CAMERIERE'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setCallSent(true);
                        universeAudio.playStaffAlert();
                        setTimeout(() => setCallSent(false), 3000);
                      }}
                      className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold"
                    >
                      CHIEDI IL CONTO POS
                    </button>
                  </div>
                )}

                {activeTab === 'menu' && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-white font-bold">
                      <span>Menu Degustazione</span>
                      <span className="text-[#BFFF00] font-mono">€48</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">4 portate dello chef con calice Franciacorta abbinato.</p>
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400">
                      ✓ Filtri per allergeni e intolleranze in 12 lingue
                    </div>
                  </div>
                )}

                {activeTab === 'review' && (
                  <div className="space-y-3 text-center">
                    <div className="text-xs font-bold text-white">Valuta la tua esperienza</div>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setStars(s);
                            universeAudio.playClick();
                          }}
                        >
                          <Star size={20} className={s <= stars ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-zinc-700'} />
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {stars >= 4 ? '✓ Shield: Reindirizzamento Google 5-stelle' : '⚠️ Shield: Feedback privato al direttore'}
                    </div>
                  </div>
                )}

                {activeTab === 'loyalty' && (
                  <div className="p-3 rounded-xl bg-gradient-to-tr from-zinc-900 to-zinc-800 border border-zinc-700 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-[#BFFF00]">APPLE / GOOGLE WALLET</span>
                      <Award size={14} className="text-[#BFFF00]" />
                    </div>
                    <div className="font-bold text-white text-xs mt-1">Pass Fedeltà Bistrot</div>
                    <div className="grid grid-cols-6 gap-1 my-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className={`h-7 rounded flex items-center justify-center font-bold text-[9px] ${
                            i <= stampCount ? 'bg-[#BFFF00] text-black' : 'bg-zinc-950 text-zinc-600'
                          }`}
                        >
                          {i <= stampCount ? '✓' : i}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setStampCount((prev) => (prev >= 6 ? 1 : prev + 1));
                        universeAudio.playClick();
                      }}
                      className="w-full py-1.5 rounded bg-white text-black font-bold text-[10px]"
                    >
                      SIMULA TIMBRO (+1)
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-800 text-center text-[9px] font-mono text-zinc-600">
                  POWERED BY RIVO RESTAURANT ENGINE
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

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

interface RestaurantWorldProps {
  onClose: () => void;
}

export default function RestaurantWorld({ onClose }: RestaurantWorldProps) {
  const [step, setStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'menu' | 'call' | 'review' | 'loyalty'>('call');
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
    }, 600);
    setTimeout(() => {
      setStep(4);
      universeAudio.playLaserBeam();
    }, 1200);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl bg-zinc-950/95 border border-zinc-800 p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-white animate-in fade-in zoom-in-95 duration-300">
      
      {/* World Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-zinc-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#BFFF00] uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
            <span>WORLD 01 • RESTAURANT ARCHITECTURE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] mt-1">
            PHYSICAL TABLE TO CLOUD INTERFACE
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/call/demo"
            target="_blank"
            onClick={() => universeAudio.playClick()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white hover:border-[#BFFF00] transition-colors"
          >
            <span>LIVE /call DEMO</span>
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

      {/* 4-Step Pipeline Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-6">
        {[
          { num: 1, label: 'PHYSICAL TAP', desc: '13.56 MHz NFC Tag' },
          { num: 2, label: 'DIGITAL EXP', desc: '0.2s Safari / Chrome' },
          { num: 3, label: 'BUSINESS EVENT', desc: 'Staff Smartwatch Alert' },
          { num: 4, label: 'EDGE DATA', desc: 'Table Dwell Telemetry' },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-3 rounded-xl border text-left transition-all ${
              step >= s.num
                ? 'bg-[#BFFF00]/10 border-[#BFFF00]/50 text-white'
                : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500'
            }`}
          >
            <div className="flex items-center justify-between font-mono text-xs font-bold">
              <span>0{s.num}. {s.label}</span>
              {step >= s.num && <CheckCircle size={12} className="text-[#BFFF00]" />}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Visual Scene: Architectural Table + Live Smartphone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left: The Architectural Dining Table */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-tr from-[#121216] via-[#1a1a22] to-[#0d0d10] border border-zinc-700/80 p-6 flex flex-col justify-between relative shadow-2xl overflow-hidden">
            
            {/* Ambient overhead spotlight */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-50/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center text-xs font-mono text-zinc-500">
              <span>TERRAZZA • TAVOLO 04</span>
              <span className="text-[#BFFF00]">HARDWARE CHIP ID #RVO-404</span>
            </div>

            {/* The Center Interactive Tag Puck */}
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
                CLICCA PER SIMULARE IL TAP
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-t border-zinc-800/80 pt-3">
              <span>CONTATTO FISICO: {step >= 2 ? 'ATTIVO (11ms)' : 'IN ATTESA'}</span>
              <span className="text-emerald-400">ZERO APP INSTALLATE</span>
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Smartphone Interface */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-[340px] rounded-[36px] bg-[#0c0c0e] border-[5px] border-zinc-800 p-4 shadow-2xl">
            {/* Dynamic Island */}
            <div className="mx-auto w-20 h-4 bg-black rounded-full mb-3" />

            {/* Screen Header */}
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pb-2 border-b border-zinc-800">
              <span>RIVO GUEST OS</span>
              <span className="text-[#BFFF00]">TAVOLO 04</span>
            </div>

            {/* Module Switcher Buttons */}
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

            {/* Working Module Area */}
            <div className="min-h-[220px] py-2 flex flex-col justify-between text-left">
              {activeTab === 'call' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white">Richiesta Personale al Tavolo</div>
                  <p className="text-[11px] text-zinc-400">Notifica istantanea inviata allo smartwatch del cameriere di turno.</p>
                  
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
                    CHIEDI IL CONTO
                  </button>
                </div>
              )}

              {activeTab === 'menu' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-white font-bold">
                    <span>Menu Degustazione</span>
                    <span className="text-[#BFFF00] font-mono">€48</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">4 portate dello chef • Calice Franciacorta incluso</p>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400">
                    ✓ Filtri allergeni in tempo reale • 12 lingue disponibili
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
                    {stars >= 4 ? '✓ Shield: Reindirizzamento Google 5-stelle' : '⚠️ Shield: Feedback privato al manager'}
                  </div>
                </div>
              )}

              {activeTab === 'loyalty' && (
                <div className="p-3 rounded-xl bg-gradient-to-tr from-zinc-900 to-zinc-800 border border-zinc-700 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-[#BFFF00]">APPLE WALLET PASS</span>
                    <Award size={14} className="text-[#BFFF00]" />
                  </div>
                  <div className="font-bold text-white text-xs mt-1">Caffè & Bistrot VIP</div>
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
                DISPATCH LATENCY: 12ms
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { universeAudio } from './UniverseAudio';
import {
  Brain,
  Sparkles,
  Zap,
  ArrowRight,
  ExternalLink,
  Cpu,
  Clock,
  User,
  History,
  CheckCircle2,
} from 'lucide-react';

interface AIWorldProps {
  onClose: () => void;
}

const AI_SCENARIOS = [
  {
    id: 'sommelier',
    title: 'AI Sommelier & Abbinamento Menu',
    input: 'Ospite al Tavolo 4 ordina "Fiorentina 1.2kg con patate"',
    context: 'Orario: 20:30 • Preferenza: Rossi strutturati • Spesa media: €85',
    reasoning: 'RIVO analizza la carta vini in cantina (Tignanello 2021 vs Brunello di Montalcino 2019)',
    action: 'Suggerimento interattivo su smartphone ospite: "Abbinamento consigliato: Brunello di Montalcino DOCG". Conversione +36%.',
    link: '/ai-sommelier/demo',
    linkText: 'Prova AI Sommelier',
  },
  {
    id: 'retention',
    title: 'Predictive Retention VIP Pass',
    input: 'Cliente scansiona NFC al bancone cassa (visita #4 nel mese)',
    context: 'Distanza ultima visita: 3 giorni • Prodotto preferito: Cold Brew',
    reasoning: 'Probabilità di fidelizzazione permanente all’80% se ricompensato entro 48h',
    action: 'Erogazione automatica coupon su Apple Wallet: "Il prossimo Cold Brew è offerto dalla casa".',
    link: '/dashboard/loyalty',
    linkText: 'Gestione Loyalty RIVO',
  },
  {
    id: 'staff_opt',
    title: 'Previsione Carico & Turni Sala',
    input: '18 tavoli occupati contemporaneamente • 42 minuti tempo medio seduta',
    context: 'Pioggia improvvisa all’esterno • Prenotazioni online +14 per le 21:00',
    reasoning: 'Rischio collo di bottiglia in cucina tra 25 minuti sui secondi piatti',
    action: 'Notifica preventiva al maître: "Rallenta leggermente l’uscita antipasti di 4 minuti per sincronizzare i fuochi."',
    link: '/dashboard/service',
    linkText: 'Live Service Dashboard',
  },
];

export default function AIWorld({ onClose }: AIWorldProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('sommelier');
  const active = AI_SCENARIOS.find((s) => s.id === activeScenarioId) || AI_SCENARIOS[0];

  const handleSelect = (id: string) => {
    setActiveScenarioId(id);
    universeAudio.playLaserBeam();
    universeAudio.playClick();
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl bg-zinc-950/95 border border-zinc-800 p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-white animate-in fade-in zoom-in-95 duration-300">
      
      {/* World Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-zinc-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#BFFF00] uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
            <span>WORLD 03 • AI REASONING PIPELINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] mt-1">
            INPUT → CONTEXT → REASONING → ACTION
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/ai-sommelier/demo"
            target="_blank"
            onClick={() => universeAudio.playClick()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white hover:border-[#BFFF00] transition-colors"
          >
            <span>LIVE /ai-sommelier</span>
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

      {/* Scenario Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none my-6">
        {AI_SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            onClick={() => handleSelect(sc.id)}
            className={`px-4 py-2 rounded-full border text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
              activeScenarioId === sc.id
                ? 'bg-[#BFFF00] text-black font-bold border-[#BFFF00] shadow-[0_0_20px_rgba(191,255,0,0.4)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            {sc.title}
          </button>
        ))}
      </div>

      {/* Visual Sequence: The 4 Stations */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-6">
        
        {/* Step 1: Input */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase pb-2 border-b border-zinc-800">
              <span>01. RAW INPUT</span>
              <Cpu size={12} className="text-zinc-400" />
            </div>
            <p className="mt-3 text-xs text-zinc-300 font-medium">
              {active.input}
            </p>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 mt-4">NFC HARDWARE EVENT</span>
        </div>

        {/* Step 2: Context */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase pb-2 border-b border-zinc-800">
              <span>02. CONTEXT VECTOR</span>
              <Clock size={12} className="text-cyan-400" />
            </div>
            <p className="mt-3 text-xs text-zinc-300 font-medium">
              {active.context}
            </p>
          </div>
          <span className="text-[9px] font-mono text-cyan-400 mt-4">CRM & TEMPORAL MATRIX</span>
        </div>

        {/* Step 3: Reasoning */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase pb-2 border-b border-zinc-800">
              <span>03. NEURAL REASONING</span>
              <Brain size={12} className="text-amber-400" />
            </div>
            <p className="mt-3 text-xs text-zinc-300 font-medium">
              {active.reasoning}
            </p>
          </div>
          <span className="text-[9px] font-mono text-amber-400 mt-4">LATENZA: 14ms</span>
        </div>

        {/* Step 4: Action */}
        <div className="p-4 rounded-2xl bg-[#BFFF00]/10 border border-[#BFFF00]/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#BFFF00] uppercase pb-2 border-b border-[#BFFF00]/30 font-bold">
              <span>04. PROPRIETARY ACTION</span>
              <Zap size={12} className="text-[#BFFF00]" />
            </div>
            <p className="mt-3 text-xs text-zinc-100 font-semibold leading-relaxed">
              {active.action}
            </p>
          </div>
          <span className="text-[9px] font-mono text-[#BFFF00] mt-4 font-bold">AUTONOMOUS EXECUTION</span>
        </div>

      </div>

      {/* Direct link footer */}
      <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
        <span>NO CHATBOT GIMMICKS • AZIONI CONCRETE SUL FATTURATO</span>
        <Link
          href={active.link}
          target="_blank"
          onClick={() => universeAudio.playClick()}
          className="text-[#BFFF00] hover:underline flex items-center gap-1 font-bold"
        >
          <span>{active.linkText}</span>
          <ArrowRight size={13} />
        </Link>
      </div>

    </div>
  );
}

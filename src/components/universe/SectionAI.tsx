'use client';

import { useState } from 'react';
import Link from 'next/link';
import { universeAudio } from './UniverseAudio';
import {
  Brain,
  Zap,
  Cpu,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'sommelier',
    title: 'AI Sommelier & Abbinamento Menu',
    input: 'Ospite al Tavolo 4 ordina "Fiorentina 1.2kg con patate al forno"',
    context: 'Orario: 20:30 • Preferenza: Rossi toscani strutturati • Spesa media: €85',
    reasoning: 'RIVO incrocia i vini in cantina e seleziona Brunello di Montalcino DOCG 2019',
    action: 'Proposta istantanea su smartphone cliente: "Abbinamento consigliato dello Chef". Conversione +36%.',
    link: '/ai-sommelier/demo',
    linkText: 'Prova AI Sommelier',
  },
  {
    id: 'loyalty',
    title: 'Predictive Retention & VIP Perks',
    input: 'Cliente scansiona NFC al bancone (quarta visita del mese)',
    context: 'Distanza ultima visita: 3 giorni • Prodotto preferito: Cold Brew',
    reasoning: 'Probabilità di fidelizzazione all’88% se ricompensato all’istante',
    action: 'Erogazione coupon automatico su Apple Wallet: "Il prossimo Cold Brew è omaggio".',
    link: '/dashboard/loyalty',
    linkText: 'Gestione Loyalty RIVO',
  },
  {
    id: 'kitchen',
    title: 'Previsione Carico & Turni Cucina',
    input: '18 tavoli occupati • 42 minuti tempo medio di permanenza',
    context: 'Orario di punta serale • Prenotazioni online +14 per le 21:00',
    reasoning: 'Rischio collo di bottiglia in cucina tra 25 minuti sui secondi piatti',
    action: 'Notifica al maître: "Rallenta l’uscita antipasti di 4 minuti per sincronizzare i fuochi."',
    link: '/dashboard/service',
    linkText: 'Live Service Dashboard',
  },
];

export default function SectionAI() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('sommelier');
  const active = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  const handleSelect = (id: string) => {
    setActiveScenarioId(id);
    universeAudio.playLaserBeam();
    universeAudio.playClick();
  };

  return (
    <section
      id="ai"
      className="relative min-h-screen w-full py-28 px-4 sm:px-6 lg:px-8 flex flex-col justify-center border-t border-zinc-900/60"
    >
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-mono tracking-widest uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#BFFF00]" />
            <span>WORLD 03 • RIVO AI REASONING CORE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.03em] text-white font-['Space_Grotesk'] leading-tight">
            INPUT → CONTEXT → <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#BFFF00]">
              REASONING → ACTION.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Nessun chatbot convenzionale. L'AI di RIVO unisce contesto fisico, orario, scorte in magazzino e storico cliente per generare azioni autonome ad alto rendimento.
          </p>
        </div>

        {/* Scenario Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center mb-10">
          {SCENARIOS.map((sc) => (
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

        {/* The 4 Stations of Intelligence */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-950/80 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          
          {/* 1. Input */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between text-left">
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

          {/* 2. Context */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between text-left">
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

          {/* 3. Reasoning */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between text-left">
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

          {/* 4. Action */}
          <div className="p-5 rounded-2xl bg-[#BFFF00]/10 border border-[#BFFF00]/50 flex flex-col justify-between text-left">
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

        {/* Live module link */}
        <div className="mt-6 flex justify-center">
          <Link
            href={active.link}
            target="_blank"
            onClick={() => universeAudio.playClick()}
            className="px-6 py-2.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-mono text-[#BFFF00] hover:border-[#BFFF00] transition-colors flex items-center gap-2"
          >
            <span>{active.linkText} (Live Demo)</span>
            <ExternalLink size={13} />
          </Link>
        </div>

      </div>
    </section>
  );
}

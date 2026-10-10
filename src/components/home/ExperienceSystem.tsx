'use client';

import { useState } from 'react';
import { sound } from './SoundSystem';
import {
  Star,
  Award,
  Wifi,
  Gift,
  UtensilsCrossed,
  BellRing,
  Users,
  BrainCircuit,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ExperienceNode {
  id: string;
  label: string;
  tagline: string;
  icon: typeof Star;
  color: string;
  metric: string;
  demoType: 'review' | 'loyalty' | 'wifi' | 'coupons' | 'menu' | 'call' | 'crm' | 'ai';
}

const NODES: ExperienceNode[] = [
  {
    id: 'review',
    label: 'REVIEW & SHIELD',
    tagline: '5-Star Google rating accelerator + automatic bad review interception',
    icon: Star,
    color: '#F59E0B',
    metric: '+18.4% rating uplift',
    demoType: 'review',
  },
  {
    id: 'loyalty',
    label: 'WALLET LOYALTY',
    tagline: 'Digital stamp cards and VIP tier passes in Apple/Google Wallet',
    icon: Award,
    color: '#10B981',
    metric: '68% retention rate',
    demoType: 'loyalty',
  },
  {
    id: 'wifi',
    label: 'WI-FI CAPTURE',
    tagline: 'Zero-friction instant Wi-Fi login capturing verified phone & email',
    icon: Wifi,
    color: '#06B6D4',
    metric: '4x faster lead capture',
    demoType: 'wifi',
  },
  {
    id: 'coupons',
    label: 'SMART COUPONS',
    tagline: 'Gamified spin wheels, scratch cards and instant activation coupons',
    icon: Gift,
    color: '#EC4899',
    metric: '+31% return visits',
    demoType: 'coupons',
  },
  {
    id: 'menu',
    label: 'INTERACTIVE MENU',
    tagline: 'Instant dynamic digital menu with real-time allergens & multi-language',
    icon: UtensilsCrossed,
    color: '#84CC16',
    metric: '0.2s load time',
    demoType: 'menu',
  },
  {
    id: 'call',
    label: 'CHIAMA SALA',
    tagline: 'Discreet table-to-waiter pager for service requests and bill payment',
    icon: BellRing,
    color: '#F97316',
    metric: '-4 min wait time',
    demoType: 'call',
  },
  {
    id: 'crm',
    label: 'UNIFIED CRM',
    tagline: 'Automatic customer identity stitching from physical taps into your database',
    icon: Users,
    color: '#8B5CF6',
    metric: '100% GDPR compliant',
    demoType: 'crm',
  },
  {
    id: 'ai',
    label: 'AI INTELLIGENCE',
    tagline: 'Contextual behavioral predictions and personalized promotions in real-time',
    icon: BrainCircuit,
    color: '#BFFF00',
    metric: '3.2x promo conversion',
    demoType: 'ai',
  },
];

export default function ExperienceSystem() {
  const [activeNodeId, setActiveNodeId] = useState<string>('review');
  const [stampCount, setStampCount] = useState<number>(4);
  const [starRating, setStarRating] = useState<number>(5);
  const [wifiConnected, setWifiConnected] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'confirmed'>('idle');

  const activeNode = NODES.find((n) => n.id === activeNodeId) || NODES[0];

  const handleSelectNode = (id: string) => {
    setActiveNodeId(id);
    sound.playLaser();
    sound.playTap();
  };

  return (
    <section
      id="experience-system"
      className="relative min-h-screen w-full bg-[#050507] text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-zinc-900"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700 text-zinc-400 text-[11px] font-mono tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
            <span>THE RIVO EXPERIENCE CONSTELLATION</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.03em] uppercase leading-tight font-['Space_Grotesk']">
            ONE SYSTEM. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-300 to-zinc-500">
              EVERY PHYSICAL INTERACTION.
            </span>
          </h2>
          <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
            Select an experience node to inspect the live software layer activated by a single NFC tap.
          </p>
        </div>

        {/* Constellation & Interactive Device Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Orbital Node Grid */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NODES.map((node) => {
                const isActive = node.id === activeNodeId;
                const IconComponent = node.icon;

                return (
                  <div
                    key={node.id}
                    onClick={() => handleSelectNode(node.id)}
                    data-cursor="NODE"
                    className={`relative group cursor-pointer p-4 rounded-xl border transition-all duration-300 text-left overflow-hidden ${
                      isActive
                        ? 'bg-zinc-900/90 border-[#BFFF00] shadow-[0_0_25px_rgba(191,255,0,0.15)] translate-x-1'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
                    }`}
                  >
                    {/* Active Laser Tracer highlight */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: node.color }}
                      />
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: isActive ? `${node.color}22` : '#18181b',
                          color: node.color,
                        }}
                      >
                        <IconComponent size={20} />
                      </div>

                      <span className="text-[10px] font-mono tracking-wider text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {node.metric}
                      </span>
                    </div>

                    <h3 className="mt-3 font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                      <span>{node.label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-ping" />
                      )}
                    </h3>

                    <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {node.tagline}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Micro summary badge */}
            <div className="mt-4 p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#BFFF00]" />
                <span>DYNAMIC ROUTING ENGINE</span>
              </div>
              <span className="text-zinc-500">TAG DISPATCH: 12ms</span>
            </div>
          </div>

          {/* Right Column: Live Working Mobile Interface Simulator */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] rounded-[44px] border-[6px] border-zinc-800 bg-[#0c0c0e] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden">
              
              {/* iPhone Dynamic Island */}
              <div className="mx-auto w-24 h-5 rounded-full bg-black flex items-center justify-end px-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pb-3 border-b border-zinc-800">
                <span>RIVO OS • TAP #TABLE-04</span>
                <span className="text-[#BFFF00]">ACTIVE</span>
              </div>

              {/* Live Interactive Screen Content */}
              <div className="py-4 min-h-[380px] flex flex-col justify-between">
                
                {/* 1. Review Demo */}
                {activeNode.demoType === 'review' && (
                  <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
                    <div className="w-12 h-12 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center mb-3">
                      <Star size={24} className="fill-[#F59E0B]" />
                    </div>
                    <span className="text-xs font-mono text-zinc-400">RISTORANTE AURELIA</span>
                    <h4 className="text-lg font-bold mt-1 text-white">Come è andata oggi?</h4>
                    <p className="text-xs text-zinc-400 mt-1">Valuta la tua esperienza con un tap.</p>

                    <div className="flex gap-2 my-5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setStarRating(s);
                            sound.playStar(s);
                          }}
                          className="p-1.5 transition-transform hover:scale-125"
                        >
                          <Star
                            size={24}
                            className={
                              s <= starRating
                                ? 'text-[#F59E0B] fill-[#F59E0B]'
                                : 'text-zinc-700'
                            }
                          />
                        </button>
                      ))}
                    </div>

                    {starRating >= 4 ? (
                      <div className="w-full p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs">
                        <p className="font-semibold flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={14} /> Reindirizzamento Google Reviews
                        </p>
                        <p className="text-[10px] text-emerald-400/80 mt-1">
                          Apertura automatica app Google Maps in 1 secondo
                        </p>
                      </div>
                    ) : (
                      <div className="w-full p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs">
                        <p className="font-semibold flex items-center justify-center gap-1.5">
                          <ShieldCheck size={14} /> Review Shield Attivato
                        </p>
                        <p className="text-[10px] text-amber-400/80 mt-1">
                          Feedback privato diretto al manager — zero danni pubblici
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Loyalty Demo */}
                {activeNode.demoType === 'loyalty' && (
                  <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
                    <div className="w-full p-4 rounded-2xl bg-gradient-to-tr from-zinc-900 to-zinc-800 border border-zinc-700/80 text-left shadow-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-[#BFFF00] uppercase">
                            VIP PASS • RIVO WALLET
                          </span>
                          <h4 className="font-bold text-white text-base">Caffè Del Doge</h4>
                        </div>
                        <Award size={20} className="text-[#BFFF00]" />
                      </div>

                      {/* Stamp Grid */}
                      <div className="grid grid-cols-3 gap-2 my-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => {
                          const isStamped = i <= stampCount;
                          return (
                            <div
                              key={i}
                              className={`h-12 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                                isStamped
                                  ? 'bg-[#BFFF00] text-black border-[#BFFF00] shadow-[0_0_12px_rgba(191,255,0,0.4)]'
                                  : 'bg-zinc-950/80 text-zinc-500 border-zinc-800'
                              }`}
                            >
                              {isStamped ? '✓ STAMP' : `#${i}`}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>Ancora {Math.max(0, 6 - stampCount)} per il regalo VIP</span>
                        <span className="font-mono text-white">{stampCount}/6</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setStampCount((prev) => (prev >= 6 ? 1 : prev + 1));
                        sound.playTap();
                      }}
                      className="mt-5 w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs tracking-wider uppercase hover:bg-[#BFFF00] transition-colors"
                    >
                      SIMULA TIMBRO NFC (+1)
                    </button>
                  </div>
                )}

                {/* 3. Wi-Fi Demo */}
                {activeNode.demoType === 'wifi' && (
                  <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
                    <div className="w-12 h-12 rounded-full bg-cyan-950/60 text-cyan-400 flex items-center justify-center mb-3">
                      <Wifi size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-white">Wi-Fi Ospiti Ultra-Fast</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                      Connessione in un tap. Nessuna password complicata da digitare.
                    </p>

                    <div className="w-full my-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">
                        Nome & Numero WhatsApp
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="Marco Rossi • +39 347 889..."
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setWifiConnected(!wifiConnected);
                        sound.playTap();
                      }}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${
                        wifiConnected
                          ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                          : 'bg-cyan-500 text-black hover:bg-cyan-400'
                      }`}
                    >
                      {wifiConnected ? '✓ CONNESSO • LEAD SALVATO IN CRM' : 'CONNETTI SUBITO (1-TAP)'}
                    </button>
                  </div>
                )}

                {/* 4. Chiama Sala Demo */}
                {activeNode.demoType === 'call' && (
                  <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
                    <div className="w-12 h-12 rounded-full bg-orange-950/60 text-orange-400 flex items-center justify-center mb-3">
                      <BellRing size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-white">Chiama il Personale</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Servizio immediato al Tavolo 04 senza alzare la mano.
                    </p>

                    <div className="w-full flex flex-col gap-2.5 my-5">
                      <button
                        onClick={() => {
                          setCallStatus('calling');
                          sound.playTap();
                          setTimeout(() => setCallStatus('confirmed'), 600);
                        }}
                        className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-2"
                      >
                        <BellRing size={14} className="text-orange-400" />
                        <span>CHIAMA CAMERIERE</span>
                      </button>

                      <button
                        onClick={() => {
                          setCallStatus('calling');
                          sound.playTap();
                          setTimeout(() => setCallStatus('confirmed'), 600);
                        }}
                        className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-2"
                      >
                        <span>CHIEDI IL CONTO AL TAVOLO</span>
                      </button>
                    </div>

                    {callStatus !== 'idle' && (
                      <div className="w-full p-2.5 rounded-lg bg-orange-950/40 border border-orange-500/40 text-orange-300 text-xs">
                        {callStatus === 'calling'
                          ? 'Invio notifica allo smartwatch staff...'
                          : '✓ Notifica ricevuta! Il cameriere sta arrivando.'}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Fallback for other nodes */}
                {!['review', 'loyalty', 'wifi', 'call'].includes(activeNode.demoType) && (
                  <div className="flex flex-col items-center text-center justify-center py-8 animate-in fade-in duration-300">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${activeNode.color}22`, color: activeNode.color }}
                    >
                      <activeNode.icon size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-white">{activeNode.label}</h4>
                    <p className="text-xs text-zinc-400 mt-2 max-w-xs">{activeNode.tagline}</p>

                    <div className="w-full mt-6 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-left font-mono text-[11px] text-zinc-300 space-y-1">
                      <div className="text-zinc-500">EVENT_DISPATCHED</div>
                      <div className="text-[#BFFF00]">{`> module: "${activeNode.id}"`}</div>
                      <div>{`> latency: "14ms"`}</div>
                      <div>{`> hardware_auth: "NFC_GEN2_OK"`}</div>
                    </div>
                  </div>
                )}

                {/* Persistent Footer on Simulated Screen */}
                <div className="pt-3 border-t border-zinc-800 text-center text-[10px] text-zinc-600 font-mono">
                  POWERED BY RIVO ENGINE
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

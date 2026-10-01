'use client';

import { useScrollReveal } from './useScrollReveal';
import { Route, Shield, Smartphone, Award, Gift, Users, UserCog, BarChart3, Receipt } from 'lucide-react';
import Image from 'next/image';

export function Ecosystem() {
  const { ref, isVisible } = useScrollReveal();

  const nodes = [
    { id: 1, label: 'Smart Router', icon: Route, desc: 'Indirizza in base a ora e contesto', angle: -90 },
    { id: 2, label: 'Review Shield', icon: Shield, desc: 'Filtra le recensioni negative', angle: -50 },
    { id: 3, label: 'Universal Hub', icon: Smartphone, desc: 'Interfaccia personalizzata', angle: -10 },
    { id: 4, label: 'Loyalty', icon: Award, desc: 'Tessere fedeltà digitali', angle: 30 },
    { id: 5, label: 'Coupons', icon: Gift, desc: 'Premi e gamification', angle: 70 },
    { id: 6, label: 'CRM', icon: Users, desc: 'Acquisizione contatti', angle: 110 },
    { id: 7, label: 'Staff', icon: UserCog, desc: 'Gestione tavoli e chiamate', angle: 150 },
    { id: 8, label: 'Analytics', icon: BarChart3, desc: 'Dati di interazione', angle: 190 },
    { id: 9, label: 'Smart Bill', icon: Receipt, desc: 'Richiesta conto contactless', angle: 230 },
  ];

  return (
    <section className="py-24 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight mb-4">
          Un solo ingresso. Infinite esperienze.
        </h2>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          L'NFC diventa il punto di accesso a un intero ecosistema digitale.
        </p>
      </div>

      <div 
        ref={ref}
        className={`transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Mobile Layout (Grid) */}
        <div className="md:hidden grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="col-span-2 sm:col-span-3 flex justify-center mb-8">
            <div className="w-24 h-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-[0_0_30px_rgba(163,230,53,0.2)]">
              <Image src="/brand/rivo-mark-transparent-cropped.png" alt="RIVO" width={48} height={48} className="object-contain" />
            </div>
          </div>
          {nodes.map((node) => {
            const Icon = node.icon;
            return (
              <div key={node.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center group hover:border-lime-500/50 transition-colors">
                <Icon className="w-6 h-6 text-zinc-400 group-hover:text-lime-400 mb-2 transition-colors" />
                <span className="text-xs font-medium text-zinc-300">{node.label}</span>
              </div>
            );
          })}
        </div>

        {/* Desktop Layout (Orbital) */}
        <div className="hidden md:flex relative h-[600px] items-center justify-center max-w-4xl mx-auto">
          {/* Center Hub */}
          <div className="absolute z-20 w-32 h-32 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-[0_0_50px_rgba(163,230,53,0.15)] animate-pulse">
            <Image src="/brand/rivo-mark-transparent-cropped.png" alt="RIVO" width={64} height={64} className="object-contain" />
          </div>

          {/* Surrounding Nodes */}
          {nodes.map((node, i) => {
            const Icon = node.icon;
            // Calculate positions around a circle
            const radius = 240;
            const angleRad = (node.angle * Math.PI) / 180;
            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;

            return (
              <div 
                key={node.id}
                className="absolute z-10 transition-all duration-700"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  transitionDelay: isVisible ? `${i * 100}ms` : '0ms',
                  opacity: isVisible ? 1 : 0,
                }}
              >
                {/* Connecting Line (SVG SVG) */}
                <svg className="absolute top-1/2 left-1/2 -z-10 pointer-events-none" style={{
                  width: `${radius * 2}px`,
                  height: `${radius * 2}px`,
                  transform: 'translate(-50%, -50%)',
                  overflow: 'visible'
                }}>
                  <line 
                    x1="50%" 
                    y1="50%" 
                    x2={50 - (Math.cos(angleRad) * 100)} 
                    y2={50 - (Math.sin(angleRad) * 100)} 
                    stroke="url(#line-gradient)" 
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="opacity-20"
                  />
                  <defs>
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a3e635" />
                      <stop offset="100%" stopColor="#27272a" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="relative group bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-36 flex flex-col items-center justify-center text-center hover:bg-zinc-800 hover:border-lime-500/50 hover:scale-105 transition-all duration-300 cursor-default shadow-lg">
                  <Icon className="w-8 h-8 text-zinc-400 group-hover:text-lime-400 mb-2 transition-colors" />
                  <span className="text-sm font-medium text-zinc-200">{node.label}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute top-full mt-2 w-48 bg-zinc-800 text-zinc-300 text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30 shadow-xl border border-zinc-700">
                    {node.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

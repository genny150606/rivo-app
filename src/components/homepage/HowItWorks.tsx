'use client';

import { useScrollReveal } from './useScrollReveal';
import { Nfc, Route, Zap, BarChart3 } from 'lucide-react';

export function HowItWorks() {
  const { ref, isVisible } = useScrollReveal(0.1);

  const steps = [
    {
      num: '01',
      title: 'Il cliente interagisce',
      desc: 'Avvicina lo smartphone a un tag NFC o scansiona un QR Code posizionato nel tuo locale.',
      icon: Nfc,
    },
    {
      num: '02',
      title: 'RIVO capisce cosa serve',
      desc: "Lo Smart Router indirizza automaticamente il cliente verso l'esperienza più utile in base all'orario e alla configurazione.",
      icon: Route,
    },
    {
      num: '03',
      title: 'Il cliente agisce',
      desc: 'Recensione, loyalty, chiamata cameriere, coupon, Wi-Fi, menù digitale: tutto a portata di tap.',
      icon: Zap,
    },
    {
      num: '04',
      title: 'Il business misura',
      desc: "Ogni interazione diventa un dato. Ogni dato diventa un'opportunità.",
      icon: BarChart3,
    },
  ];

  return (
    <section id="come-funziona" className="py-24 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight mb-4">
          Un gesto. Un ecosistema.
        </h2>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Dal primo tap NFC alla relazione con il cliente.
        </p>
      </div>

      <div 
        ref={ref}
        className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative"
      >
        {/* Connecting line for desktop */}
        <div className="hidden md:block absolute top-12 left-1/8 right-1/8 h-0.5 bg-zinc-800 -z-10"></div>
        
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div 
              key={idx}
              className="flex flex-col items-center text-center relative transition-all duration-700 ease-out transform"
              style={{ 
                transitionDelay: isVisible ? `${idx * 200}ms` : '0ms',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
              }}
            >
              <div className="text-6xl font-black text-zinc-800/50 absolute -top-8 -left-4 select-none pointer-events-none">
                {step.num}
              </div>
              
              <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 relative group">
                <div className="absolute inset-0 rounded-full bg-lime-500/10 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center relative z-10 group-hover:bg-zinc-700 transition-colors">
                  <Icon className="w-8 h-8 text-lime-400" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-zinc-100 mb-3">
                {step.title}
              </h3>
              
              <p className="text-zinc-400 text-sm leading-relaxed px-4">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

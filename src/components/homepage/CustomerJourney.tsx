'use client';

import { useEffect, useRef, useState } from 'react';
import { Network, Search, HandHeart, Users, Gift, LineChart } from 'lucide-react';

const phases = [
  {
    id: 'first-tap',
    title: 'First Tap',
    description: 'Il cliente scopre RIVO per la prima volta.',
    module: 'Smart Router',
    icon: Network
  },
  {
    id: 'discovery',
    title: 'Discovery',
    description: 'Esplora le esperienze del tuo locale.',
    module: 'Universal Hub',
    icon: Search
  },
  {
    id: 'interaction',
    title: 'Interaction',
    description: 'Agisce: recensione, loyalty, ordine.',
    module: 'Review Shield, Loyalty',
    icon: HandHeart
  },
  {
    id: 'contact',
    title: 'Contact',
    description: 'I suoi dati entrano nel tuo CRM.',
    module: 'CRM',
    icon: Users
  },
  {
    id: 'loyalty',
    title: 'Loyalty',
    description: 'Torna e accumula punti.',
    module: 'Loyalty, Coupons',
    icon: Gift
  },
  {
    id: 'return',
    title: 'Return',
    description: 'Diventa cliente abituale.',
    module: 'Analytics',
    icon: LineChart
  }
];

export function CustomerJourney() {
  const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set());
  const elementsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveIndices((prev) => {
              const next = new Set(prev);
              next.add(index);
              return next;
            });
          }
        });
      },
      { rootMargin: '-10% 0px -40% 0px', threshold: 0.1 }
    );

    elementsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 bg-[#09090B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-bold text-[#f4f4f5] text-center mb-16">
          Dal primo tap al cliente abituale.
        </h2>

        <div className="relative max-w-3xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-[39px] md:left-1/2 top-0 bottom-0 w-0.5 bg-zinc-800 md:-translate-x-1/2 rounded-full overflow-hidden">
            <div 
              className="w-full bg-lime-500 transition-all duration-1000 ease-out"
              style={{
                height: activeIndices.size > 0 ? `${(Math.max(...Array.from(activeIndices)) / (phases.length - 1)) * 100}%` : '0%'
              }}
            />
          </div>

          <div className="flex flex-col space-y-12 relative">
            {phases.map((phase, index) => {
              const isActive = activeIndices.has(index);
              const isEven = index % 2 === 0;
              const Icon = phase.icon;

              return (
                <div
                  key={phase.id}
                  data-index={index}
                  ref={(el) => {
                    elementsRef.current[index] = el;
                  }}
                  className={`flex items-start md:items-center relative ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-30'}`}
                >
                  {/* Icon Node */}
                  <div className="absolute left-[20px] md:left-1/2 transform md:-translate-x-1/2 -translate-y-1 md:translate-y-0 z-10 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-[#121214] transition-colors duration-500 ${isActive ? 'border-lime-500 text-lime-400 shadow-[0_0_15px_-3px_rgba(132,204,22,0.4)]' : 'border-zinc-800 text-zinc-600'}`}>
                      <Icon size={20} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`ml-20 md:ml-0 md:w-1/2 ${isEven ? 'md:pr-16 md:text-right flex md:justify-end' : 'md:pl-16 md:text-left flex md:justify-start'}`}>
                    <div className={`bg-[#121214] border border-zinc-800 p-6 rounded-xl w-full transition-transform duration-700 ${isActive ? 'translate-y-0' : 'translate-y-4'}`}>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 border ${isActive ? 'bg-lime-500/10 text-lime-400 border-lime-500/20' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700'}`}>
                        {phase.module}
                      </div>
                      <h3 className="text-xl font-bold text-zinc-100 mb-2">{phase.title}</h3>
                      <p className="text-zinc-400">{phase.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CustomerJourney;

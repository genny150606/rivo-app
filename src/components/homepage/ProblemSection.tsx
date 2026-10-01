'use client';

import { useScrollReveal } from './useScrollReveal';

export function ProblemSection() {
  const { ref, isVisible } = useScrollReveal();

  const withoutRivo = [
    'Cliente',
    'Esperienza',
    'Esce',
    'Nessun dato',
    'Nessun follow-up',
    'Nessuna fidelizzazione',
  ];

  const withRivo = [
    'Cliente',
    'RIVO',
    'Interazione',
    'Dati',
    'Engagement',
    'Ritorno',
  ];

  return (
    <section className="py-24 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
          Il tuo cliente entra nel locale. Poi cosa succede?
        </h2>
      </div>

      <div 
        ref={ref}
        className={`grid grid-cols-1 md:grid-cols-2 gap-12 transition-all duration-1000 ease-out transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Senza RIVO */}
        <div className="bg-zinc-900/30 rounded-2xl p-8 border border-zinc-800/50">
          <h3 className="text-zinc-500 font-medium mb-8 text-center uppercase tracking-wider text-sm">
            Senza RIVO
          </h3>
          <div className="flex flex-col space-y-4 relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 -translate-x-1/2 border-dashed border-l border-zinc-700" style={{ height: 'calc(100% - 2rem)' }}></div>
            {withoutRivo.map((step, idx) => (
              <div 
                key={idx} 
                className="relative z-10 flex justify-center transition-all duration-700"
                style={{ 
                  transitionDelay: isVisible ? `${idx * 150}ms` : '0ms',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(10px)'
                }}
              >
                <div className="bg-zinc-900 border border-zinc-800 text-zinc-500 py-3 px-6 rounded-lg shadow-sm w-48 text-center text-sm font-medium">
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Con RIVO */}
        <div className="bg-zinc-900/50 rounded-2xl p-8 border border-zinc-800 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-lime-500/5 pointer-events-none"></div>
          <h3 className="text-lime-400 font-medium mb-8 text-center uppercase tracking-wider text-sm relative z-10">
            Con RIVO
          </h3>
          <div className="flex flex-col space-y-4 relative z-10">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-zinc-700 via-lime-500/50 to-lime-400 -translate-x-1/2" style={{ height: 'calc(100% - 2rem)' }}></div>
            {withRivo.map((step, idx) => (
              <div 
                key={idx} 
                className="relative z-10 flex justify-center transition-all duration-700"
                style={{ 
                  transitionDelay: isVisible ? `${idx * 150 + 300}ms` : '0ms',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(10px)'
                }}
              >
                <div className={`py-3 px-6 rounded-lg w-48 text-center text-sm font-semibold shadow-lg border ${
                  idx === 1 
                    ? 'bg-lime-500 text-zinc-950 border-lime-400' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-100 hover:border-lime-500/50 transition-colors'
                }`}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

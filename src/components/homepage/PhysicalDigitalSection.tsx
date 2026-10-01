'use client';

import { useEffect, useRef, useState } from 'react';
import { Smartphone, LayoutDashboard, MonitorSmartphone, Nfc, Coffee } from 'lucide-react';

const stages = [
  { id: 'tavolo', label: 'Il punto di contatto', icon: Coffee },
  { id: 'nfc', label: 'Il dispositivo RIVO', icon: Nfc },
  { id: 'smartphone', label: 'L\'esperienza cliente', icon: Smartphone },
  { id: 'hub', label: 'Le azioni', icon: MonitorSmartphone },
  { id: 'dashboard', label: 'I dati', icon: LayoutDashboard },
];

export function PhysicalDigitalSection() {
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const stagesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveStageIndex((prev) => Math.max(prev, index));
          }
        });
      },
      { threshold: 0.8 }
    );

    stagesRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 bg-[#09090B] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-[#f4f4f5] mb-4">
            Dal mondo fisico al digitale. In un tap.
          </h2>
        </div>

        <div className="relative" ref={containerRef}>
          <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-12 md:gap-4">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = index <= activeStageIndex;
              return (
                <div
                  key={stage.id}
                  data-index={index}
                  ref={(el) => {
                    stagesRef.current[index] = el;
                  }}
                  className={`flex flex-col items-center gap-4 transition-all duration-700 w-full md:w-auto ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-8 md:translate-y-0 md:opacity-30'
                  }`}
                >
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-colors duration-500 bg-[#121214] ${
                      isActive ? 'border-lime-500 text-lime-400 shadow-[0_0_30px_-5px_rgba(132,204,22,0.3)]' : 'border-zinc-800 text-zinc-600'
                    }`}
                  >
                    <Icon size={32} />
                  </div>
                  <span className={`text-sm md:text-base font-medium transition-colors duration-500 text-center ${
                    isActive ? 'text-zinc-200' : 'text-zinc-600'
                  }`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="absolute top-10 left-10 right-10 h-0.5 bg-zinc-800 -z-0 hidden md:block">
            <div
              className="h-full bg-lime-500 transition-all duration-1000 ease-in-out"
              style={{
                width: activeStageIndex >= 0 ? `${(activeStageIndex / (stages.length - 1)) * 100}%` : '0%',
              }}
            />
          </div>
          
          <div className="absolute top-10 bottom-10 left-1/2 w-0.5 bg-zinc-800 -z-0 md:hidden transform -translate-x-1/2">
            <div
              className="w-full bg-lime-500 transition-all duration-1000 ease-in-out"
              style={{
                height: activeStageIndex >= 0 ? `${(activeStageIndex / (stages.length - 1)) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default PhysicalDigitalSection;

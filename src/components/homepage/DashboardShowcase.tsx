'use client';

import { useEffect, useRef, useState } from 'react';
import { Nfc, Users, Star, Smartphone, Activity, LayoutDashboard, ChevronRight, Menu } from 'lucide-react';

export function DashboardShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Apply slight tilt when visible
            setTilt({ x: 2, y: -2 });
          } else {
            setTilt({ x: 0, y: 0 });
          }
        });
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 bg-[#09090B] overflow-hidden perspective-1000">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-[#f4f4f5] mb-6">
            Tutto quello che succede. In un unico posto.
          </h2>
          <p className="text-xl text-zinc-400">
            La dashboard RIVO raccoglie ogni interazione, ogni dato, ogni opportunità.
          </p>
        </div>

        <div 
          ref={containerRef}
          className="transition-transform duration-1000 ease-out will-change-transform gpu-layer"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Dashboard Mockup */}
          <div className="bg-[#121214] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px]">
            {/* Sidebar */}
            <div className="w-full md:w-20 lg:w-64 border-b md:border-b-0 md:border-r border-zinc-800 bg-[#0c0c0e] flex flex-row md:flex-col items-center lg:items-start p-4 md:py-6 lg:px-4 shrink-0 gap-4 overflow-x-auto md:overflow-visible">
              <div className="hidden lg:flex items-center gap-3 mb-8 px-2 w-full">
                <div className="w-8 h-8 rounded bg-lime-500 flex items-center justify-center shrink-0">
                  <span className="text-zinc-900 font-bold">R</span>
                </div>
                <span className="font-bold text-zinc-100 tracking-wide">RIVO</span>
              </div>
              <div className="md:hidden lg:hidden w-8 h-8 rounded bg-lime-500 flex items-center justify-center shrink-0 mb-4 md:mb-8">
                <span className="text-zinc-900 font-bold">R</span>
              </div>
              
              <div className="flex flex-row md:flex-col gap-2 w-full">
                <div className="p-3 lg:px-4 rounded-lg bg-zinc-800/50 text-lime-400 flex items-center gap-3">
                  <LayoutDashboard size={20} />
                  <span className="hidden lg:block font-medium">Overview</span>
                </div>
                {[Users, Activity, Star, Nfc].map((Icon, i) => (
                  <div key={i} className="p-3 lg:px-4 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 transition-colors flex items-center gap-3 cursor-pointer">
                    <Icon size={20} />
                    <span className="hidden lg:block font-medium">
                      {['Clienti', 'Analitiche', 'Recensioni', 'Dispositivi'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#121214]">
              {/* Header */}
              <div className="h-16 border-b border-zinc-800 flex items-center px-6 shrink-0 justify-between">
                <h3 className="font-semibold text-lg text-zinc-100">Overview</h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-zinc-400 hidden sm:block">Ultimo aggiornamento: Oggi, 14:30</div>
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700"></div>
                </div>
              </div>

              {/* Dashboard Body */}
              <div className="p-6 flex flex-col gap-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Interazioni', value: '1,248', icon: Nfc, color: 'text-blue-400', trend: '+12%' },
                    { label: 'Clienti', value: '842', icon: Users, color: 'text-lime-400', trend: '+5%' },
                    { label: 'Recensioni', value: '4.8', icon: Star, color: 'text-yellow-400', trend: '+2%' },
                    { label: 'Dispositivi', value: '24', icon: Smartphone, color: 'text-purple-400', trend: '0%' }
                  ].map((kpi, i) => (
                    <div key={i} className="bg-[#18181B] border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400 font-medium">{kpi.label}</span>
                        <kpi.icon size={16} className={kpi.color} />
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-zinc-100">{kpi.value}</span>
                        <span className="text-xs text-lime-400 bg-lime-400/10 px-1.5 py-0.5 rounded">{kpi.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                  <div className="lg:col-span-2 bg-[#18181B] border border-zinc-800 rounded-xl p-5 flex flex-col">
                    <h4 className="text-sm font-medium text-zinc-400 mb-4">Traffico settimanale</h4>
                    <div className="flex-1 relative w-full h-48 overflow-hidden rounded-lg flex items-end">
                      {/* Fake Area Chart */}
                      <div className="absolute inset-0 bg-gradient-to-t from-lime-500/20 to-transparent"></div>
                      <svg className="w-full h-full absolute inset-0 text-lime-500" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0,100 L0,60 Q10,50 20,70 T40,40 T60,60 T80,30 T100,50 L100,100 Z" fill="currentColor" opacity="0.2" />
                        <path d="M0,60 Q10,50 20,70 T40,40 T60,60 T80,30 T100,50" fill="none" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                        {[1,2,3,4].map(i => <div key={i} className="w-full border-b border-zinc-600 border-dashed h-0" />)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-5 flex flex-col h-full">
                    <h4 className="text-sm font-medium text-zinc-400 mb-4">Attività recenti</h4>
                    <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                      {[
                        { time: '2 min fa', text: 'Nuovo cliente acquisito', type: 'user' },
                        { time: '15 min fa', text: 'Recensione 5 stelle', type: 'review' },
                        { time: '1 ora fa', text: 'Scansione Tag Tavolo 4', type: 'scan' },
                        { time: '2 ore fa', text: 'Scansione Tag Tavolo 12', type: 'scan' },
                      ].map((activity, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-lime-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(132,204,22,0.6)]"></div>
                          <div className="flex flex-col">
                            <span className="text-sm text-zinc-200">{activity.text}</span>
                            <span className="text-xs text-zinc-500">{activity.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardShowcase;

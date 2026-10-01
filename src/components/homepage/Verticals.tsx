'use client';

import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  Coffee, 
  Hotel, 
  ShoppingBag, 
  Dumbbell, 
  Briefcase,
  Smartphone,
  Shield,
  Award,
  Users,
  LineChart,
  Wifi,
  PackageSearch
} from 'lucide-react';

const verticals = [
  {
    id: 'ristoranti',
    name: 'Ristoranti',
    icon: UtensilsCrossed,
    headline: 'Dal menù digitale alla fidelizzazione del cliente.',
    modules: [
      { name: 'Menù Digitale', icon: Smartphone },
      { name: 'Ordini al Tavolo', icon: UtensilsCrossed },
      { name: 'Smart Bill', icon: Smartphone },
      { name: 'Review Shield', icon: Shield },
      { name: 'Loyalty', icon: Award },
      { name: 'AI Sommelier', icon: Smartphone }
    ],
    mockup: (
      <div className="relative w-full h-[400px] bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden p-6 flex flex-col gap-4">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-lime-400/10 to-transparent"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h4 className="text-white font-bold text-lg">Il Tuo Ristorante</h4>
            <p className="text-zinc-400 text-sm">Menù Digitale</p>
          </div>
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
            <UtensilsCrossed size={18} className="text-lime-400" />
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4 mt-4">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-col gap-2">
            <div className="w-full h-24 bg-zinc-800 rounded-md"></div>
            <div className="w-3/4 h-4 bg-zinc-700 rounded mt-2"></div>
            <div className="w-1/2 h-3 bg-zinc-800 rounded"></div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-lime-400 text-sm">€ 18.00</span>
              <div className="w-6 h-6 bg-lime-400 text-zinc-950 rounded-full flex items-center justify-center text-xs">+</div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-col gap-2">
            <div className="w-full h-24 bg-zinc-800 rounded-md"></div>
            <div className="w-3/4 h-4 bg-zinc-700 rounded mt-2"></div>
            <div className="w-1/2 h-3 bg-zinc-800 rounded"></div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-lime-400 text-sm">€ 14.50</span>
              <div className="w-6 h-6 bg-lime-400 text-zinc-950 rounded-full flex items-center justify-center text-xs">+</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'bar',
    name: 'Bar',
    icon: Coffee,
    headline: 'Velocità al bancone, relazione con il cliente.',
    modules: [
      { name: 'Smart Router', icon: Smartphone },
      { name: 'Review Shield', icon: Shield },
      { name: 'Loyalty', icon: Award },
      { name: 'Coupon / Ruota', icon: Award },
      { name: 'CRM', icon: Users },
      { name: 'Wi-Fi Bridge', icon: Wifi }
    ],
    mockup: (
      <div className="relative w-full h-[400px] bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="w-64 h-64 border-4 border-lime-400 rounded-full border-dashed animate-[spin_20s_linear_infinite]"></div>
        </div>
        <div className="relative z-10 w-48 h-48 bg-zinc-900 border border-zinc-700 rounded-full flex flex-col items-center justify-center gap-2 p-6 text-center shadow-2xl">
          <Award size={32} className="text-lime-400 mb-2" />
          <h4 className="text-white font-bold">Gira la Ruota</h4>
          <p className="text-xs text-zinc-400">Vinci un caffè o uno spritz in omaggio!</p>
          <button className="mt-2 w-full py-2 bg-lime-400 text-zinc-950 text-xs font-bold rounded-full">GIRA ORA</button>
        </div>
      </div>
    )
  },
  {
    id: 'hotel',
    name: 'Hotel',
    icon: Hotel,
    headline: 'Ogni camera, un punto di contatto digitale.',
    modules: [
      { name: 'Universal Hub', icon: Smartphone },
      { name: 'Chiamata Staff', icon: Users },
      { name: 'Review Shield', icon: Shield },
      { name: 'Wi-Fi Bridge', icon: Wifi },
      { name: 'CRM', icon: Users },
      { name: 'Analytics', icon: LineChart }
    ],
    mockup: (
      <div className="relative w-full h-[400px] bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden p-6 flex flex-col gap-4">
        <div className="text-center mb-4">
          <h4 className="text-white font-bold text-xl">Camera 402</h4>
          <p className="text-zinc-400 text-sm">Benvenuto, Marco</p>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-grow">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center gap-2 p-4">
            <Wifi size={24} className="text-zinc-400" />
            <span className="text-sm text-zinc-300">Connetti Wi-Fi</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center gap-2 p-4">
            <UtensilsCrossed size={24} className="text-zinc-400" />
            <span className="text-sm text-zinc-300">Room Service</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center gap-2 p-4">
            <Shield size={24} className="text-zinc-400" />
            <span className="text-sm text-zinc-300">Lascia Feedback</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center gap-2 p-4">
            <Users size={24} className="text-zinc-400" />
            <span className="text-sm text-zinc-300">Reception</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'retail',
    name: 'Retail',
    icon: ShoppingBag,
    headline: 'Il tuo negozio fisico, connesso.',
    modules: [
      { name: 'Catalogo Prodotti', icon: PackageSearch },
      { name: 'Inventario', icon: PackageSearch },
      { name: 'Loyalty', icon: Award },
      { name: 'Coupon', icon: Award },
      { name: 'CRM', icon: Users },
      { name: 'Analytics', icon: LineChart }
    ],
    mockup: (
      <div className="relative w-full h-[400px] bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden p-6">
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between mb-6">
          <span className="text-zinc-300 text-sm">Punti Accumulati</span>
          <span className="text-lime-400 font-bold text-xl">1.250</span>
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-white font-bold text-sm mb-1">Coupon Disponibili</div>
          <div className="w-full bg-zinc-900 border border-zinc-800 border-l-4 border-l-lime-400 rounded-r-lg p-4 flex justify-between items-center">
            <div>
              <div className="text-white font-medium">-20% Nuova Collezione</div>
              <div className="text-zinc-500 text-xs mt-1">Scade tra 2 giorni</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-lime-400/10 flex items-center justify-center">
              <span className="text-lime-400 text-xs font-bold">Usa</span>
            </div>
          </div>
          <div className="w-full bg-zinc-900 border border-zinc-800 border-l-4 border-l-zinc-600 rounded-r-lg p-4 flex justify-between items-center opacity-70">
            <div>
              <div className="text-zinc-400 font-medium">-10% Accessori</div>
              <div className="text-zinc-500 text-xs mt-1">Scade tra 10 giorni</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'palestre',
    name: 'Palestre',
    icon: Dumbbell,
    headline: 'Coinvolgi i tuoi iscritti oltre l\'allenamento.',
    modules: [
      { name: 'Loyalty', icon: Award },
      { name: 'Review Shield', icon: Shield },
      { name: 'CRM', icon: Users },
      { name: 'Wi-Fi Bridge', icon: Wifi },
      { name: 'Analytics', icon: LineChart }
    ],
    mockup: (
      <div className="relative w-full h-[400px] bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden p-6 flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-lime-400 flex items-center justify-center">
            <Dumbbell size={24} className="text-lime-400" />
          </div>
          <div>
            <h4 className="text-white font-bold">Livello: Avanzato</h4>
            <div className="w-32 h-2 bg-zinc-800 rounded-full mt-2 overflow-hidden">
              <div className="w-3/4 h-full bg-lime-400 rounded-full"></div>
            </div>
            <p className="text-xs text-zinc-500 mt-1">750 / 1000 PT</p>
          </div>
        </div>
        <div className="flex-grow bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col justify-center">
          <div className="text-center mb-4">
            <div className="text-zinc-400 text-sm">Accesso Wi-Fi</div>
            <div className="text-white font-medium mt-1">Fitness Club Guest</div>
          </div>
          <button className="w-full py-3 bg-lime-400 text-zinc-950 font-bold rounded-lg mb-2">Connettiti Ora</button>
          <p className="text-center text-xs text-zinc-500">Connettendoti riceverai 10 punti fedeltà</p>
        </div>
      </div>
    )
  },
  {
    id: 'servizi',
    name: 'Servizi',
    icon: Briefcase,
    headline: 'Professionalità e fidelizzazione.',
    modules: [
      { name: 'Review Shield', icon: Shield },
      { name: 'Loyalty', icon: Award },
      { name: 'CRM', icon: Users },
      { name: 'Analytics', icon: LineChart },
      { name: 'Smart Router', icon: Smartphone }
    ],
    mockup: (
      <div className="relative w-full h-[400px] bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden p-6 flex flex-col justify-between">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-white font-medium text-sm">La tua recensione</h4>
            <Shield size={16} className="text-lime-400" />
          </div>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <svg key={i} className="w-6 h-6 text-zinc-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            ))}
          </div>
          <div className="w-full h-20 bg-zinc-800 rounded-md p-2">
            <div className="w-1/2 h-2 bg-zinc-700 rounded mb-2"></div>
            <div className="w-3/4 h-2 bg-zinc-700 rounded"></div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-lime-400/10 border border-lime-400/20 p-4 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0">
            <Shield size={14} className="text-zinc-950" />
          </div>
          <p className="text-xs text-lime-400">Le recensioni a 4-5 stelle verranno inviate a Google, le altre gestite privatamente.</p>
        </div>
      </div>
    )
  }
];

export default function Verticals() {
  const [activeTab, setActiveTab] = useState(verticals[0].id);
  const activeVertical = verticals.find(v => v.id === activeTab) || verticals[0];

  return (
    <section className="py-24 sm:py-32 bg-[#09090B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#f4f4f5] tracking-tight">
            RIVO si adatta al <span className="text-lime-400">tuo business.</span>
          </h2>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
            Soluzioni studiate per ogni settore, per massimizzare i risultati e semplificare il tuo lavoro.
          </p>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-zinc-800 mb-12" style={{ scrollbarWidth: 'none' }}>
          <div className="flex space-x-8 px-2 mx-auto min-w-max">
            {verticals.map((v) => {
              const isActive = activeTab === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveTab(v.id)}
                  className={`pb-4 text-sm font-medium transition-colors whitespace-nowrap px-1 relative ${
                    isActive ? 'text-lime-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {v.name}
                  {isActive && (
                    <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-lime-400 rounded-t-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[400px]">
          {/* Content side */}
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500" key={activeTab}>
            <div className="w-12 h-12 bg-lime-400/10 rounded-xl flex items-center justify-center text-lime-400 mb-6">
              <activeVertical.icon size={24} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-8 leading-tight">
              {activeVertical.headline}
            </h3>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              {activeVertical.modules.map((mod, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                    <mod.icon size={14} />
                  </div>
                  <span className="text-sm text-zinc-300 font-medium">{mod.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup side */}
          <div className="w-full relative animate-in fade-in zoom-in-95 duration-700" key={`${activeTab}-mockup`}>
            {activeVertical.mockup}
            
            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-lime-400/5 blur-3xl -z-10 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

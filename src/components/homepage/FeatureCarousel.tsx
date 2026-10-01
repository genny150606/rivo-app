'use client';

import React, { useRef, useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  Route,
  Shield,
  Award,
  Users,
  UserCog,
  Receipt,
  BarChart3,
  UtensilsCrossed,
  Wine,
  Star
} from 'lucide-react';

const slides = [
  {
    id: 'smart-router',
    icon: Route,
    title: 'Smart Router',
    description: 'Ogni dispositivo NFC diventa un ingresso intelligente. Lo Smart Router indirizza il cliente verso l\'esperienza giusta in base all\'orario.',
    visual: (
      <div className="flex flex-col gap-3 p-4 bg-zinc-900 rounded-lg border border-zinc-800 text-sm">
        <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-md border border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-lime-400"></div>
            <span className="text-zinc-300 font-medium">12:00 - 15:00</span>
          </div>
          <span className="text-lime-400 flex items-center gap-1">
            <UtensilsCrossed size={14} /> Menù
          </span>
        </div>
        <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-md border border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className="text-zinc-300 font-medium">20:00 - 23:00</span>
          </div>
          <span className="text-blue-400 flex items-center gap-1">
            <Star size={14} /> Recensioni
          </span>
        </div>
      </div>
    )
  },
  {
    id: 'review-shield',
    icon: Shield,
    title: 'Review Shield',
    description: 'Le recensioni positive vanno su Google. Quelle negative restano private e ti arrivano come feedback riservato.',
    visual: (
      <div className="flex flex-col gap-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 text-lime-400">
            <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
          </div>
          <div className="flex-1 h-[1px] bg-zinc-800"></div>
          <span className="text-zinc-300 text-xs px-2 py-1 bg-zinc-800 rounded">Google Maps</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 text-red-400">
            <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} className="text-zinc-700" /><Star size={16} className="text-zinc-700" /><Star size={16} className="text-zinc-700" />
          </div>
          <div className="flex-1 h-[1px] bg-zinc-800"></div>
          <span className="text-zinc-300 text-xs px-2 py-1 bg-zinc-800 rounded">Feedback Privato</span>
        </div>
      </div>
    )
  },
  {
    id: 'loyalty',
    icon: Award,
    title: 'Loyalty',
    description: 'Tessere fedeltà digitali con timbri. Integrazione Apple Wallet e Google Wallet.',
    visual: (
      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 flex justify-center">
        <div className="w-full max-w-[200px] aspect-[1.58] bg-zinc-950 rounded-xl border border-zinc-800 p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-lime-400/10 blur-xl rounded-full"></div>
          <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Carta Fedeltà</div>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${i <= 7 ? 'bg-lime-400 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-600'}`}>
                {i <= 7 ? '✓' : i}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'crm',
    icon: Users,
    title: 'CRM',
    description: 'Ogni contatto catturato dal Wi-Fi, dalla Ruota o dalla Loyalty finisce nel tuo database clienti.',
    visual: (
      <div className="flex flex-col gap-2 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
        {[
          { n: 'Marco B.', s: 'Wi-Fi', c: 'bg-blue-400/20 text-blue-400' },
          { n: 'Giulia R.', s: 'Loyalty', c: 'bg-lime-400/20 text-lime-400' },
          { n: 'Andrea T.', s: 'Ruota', c: 'bg-purple-400/20 text-purple-400' },
        ].map((u, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-zinc-950 rounded border border-zinc-800/50">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400">{u.n[0]}</div>
              <span className="text-sm text-zinc-300">{u.n}</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.c}`}>{u.s}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 'staff',
    icon: UserCog,
    title: 'Staff',
    description: 'Gestisci il team, assegna i tavoli, invita collaboratori con ruoli dedicati.',
    visual: (
      <div className="flex flex-col gap-3 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
        <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-md border border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800"></div>
            <div className="flex flex-col">
              <span className="text-sm text-zinc-200">Elena G.</span>
              <span className="text-[10px] text-zinc-500">Manager</span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-lime-400"></span>
        </div>
        <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-md border border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800"></div>
            <div className="flex flex-col">
              <span className="text-sm text-zinc-200">Luca M.</span>
              <span className="text-[10px] text-zinc-500">Cameriere</span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-500">Tavoli 1-10</span>
        </div>
      </div>
    )
  },
  {
    id: 'smart-bill',
    icon: Receipt,
    title: 'Smart Bill',
    description: 'Il cliente richiede il conto dal tavolo. POS contactless, contanti, split, fattura elettronica.',
    visual: (
      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 grid grid-cols-2 gap-3">
        <div className="col-span-2 flex justify-between items-center bg-zinc-950 p-3 rounded-md border border-zinc-800/50">
          <span className="text-zinc-400 text-sm">Totale (Tavolo 4)</span>
          <span className="text-lime-400 font-bold">€ 42.50</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-zinc-950 rounded-md border border-zinc-800/50 text-zinc-300 gap-1">
          <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">💳</div>
          <span className="text-[10px]">Paga Ora</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-zinc-950 rounded-md border border-zinc-800/50 text-zinc-300 gap-1">
          <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">➗</div>
          <span className="text-[10px]">Dividi</span>
        </div>
      </div>
    )
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics',
    description: 'Scopri cosa succede dopo ogni interazione. NFC vs QR, fasce orarie, dispositivi più attivi.',
    visual: (
      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 flex items-end gap-2 h-[140px]">
        {[40, 70, 45, 90, 60, 110, 85].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1">
            <div className="w-full bg-lime-400/20 rounded-t-sm" style={{ height: `${h}%` }}>
              <div className="w-full bg-lime-400 rounded-t-sm" style={{ height: '4px' }}></div>
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: 'menu',
    icon: UtensilsCrossed,
    title: 'Menù Digitale',
    description: 'Designer visuale per il menù del tuo ristorante. Ordini al tavolo integrati.',
    visual: (
      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
        <div className="w-full h-8 bg-zinc-950 rounded flex gap-2 p-1 mb-3">
          <div className="flex-1 bg-zinc-800 rounded text-[10px] text-zinc-300 flex items-center justify-center">Primi</div>
          <div className="flex-1 rounded text-[10px] text-zinc-500 flex items-center justify-center">Secondi</div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start bg-zinc-950 p-2 rounded border border-zinc-800/50">
            <div className="flex flex-col gap-1">
              <div className="w-20 h-2 bg-zinc-700 rounded"></div>
              <div className="w-16 h-1.5 bg-zinc-800 rounded"></div>
            </div>
            <div className="w-8 h-3 bg-lime-400/20 rounded"></div>
          </div>
          <div className="flex justify-between items-start bg-zinc-950 p-2 rounded border border-zinc-800/50">
            <div className="flex flex-col gap-1">
              <div className="w-24 h-2 bg-zinc-700 rounded"></div>
              <div className="w-12 h-1.5 bg-zinc-800 rounded"></div>
            </div>
            <div className="w-8 h-3 bg-lime-400/20 rounded"></div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'sommelier',
    icon: Wine,
    title: 'AI Sommelier',
    description: 'Il tuo sommelier virtuale consiglia vini e abbinamenti ai clienti.',
    visual: (
      <div className="flex flex-col gap-3 p-4 bg-zinc-900 rounded-lg border border-zinc-800 text-xs">
        <div className="self-end bg-zinc-800 text-zinc-300 p-2 rounded-lg rounded-tr-none max-w-[80%]">
          Cosa abbinare a un branzino?
        </div>
        <div className="self-start bg-lime-400/10 text-lime-400 p-2 rounded-lg rounded-tl-none border border-lime-400/20 max-w-[80%]">
          Consiglio un Vermentino ligure o un Franciacorta Brut per esaltarne la delicatezza.
        </div>
      </div>
    )
  }
];

export default function FeatureCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.clientWidth > 600 ? 600 : scrollRef.current.clientWidth;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(index, 0), slides.length - 1));
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth > 600 ? 600 : scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-24 sm:py-32 bg-[#09090B] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#f4f4f5] tracking-tight">
            Tutto quello che serve <span className="text-lime-400">al tuo business.</span>
          </h2>
          <p className="mt-4 text-zinc-400 max-w-2xl">
            Un unico ecosistema per gestire accoglienza, ordinazioni, recensioni e fidelizzazione.
          </p>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gpu-layer touch-press"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === slides.length - 1}
            className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gpu-layer touch-press"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="relative w-full">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 lg:px-8 pb-8 no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {slides.map((slide, index) => {
            const Icon = slide.icon;
            return (
              <div 
                key={slide.id}
                className="snap-start shrink-0 w-full max-w-[calc(100vw-2rem)] md:w-[600px] bg-[#121214] border border-zinc-800 rounded-xl p-8 hover:-translate-y-1 transition-transform duration-300 flex flex-col h-full"
              >
                <div className="w-12 h-12 rounded-lg bg-lime-400/10 flex items-center justify-center mb-6 text-lime-400">
                  <Icon size={24} />
                </div>
                <h3 className="text-2xl font-bold text-[#f4f4f5] mb-3">{slide.title}</h3>
                <p className="text-zinc-400 mb-8 flex-grow">{slide.description}</p>
                <div className="mt-auto w-full">
                  {slide.visual}
                </div>
              </div>
            );
          })}
          {/* Spacer for right padding at the end of scroll */}
          <div className="shrink-0 w-4 md:w-[calc(50vw-300px)] snap-end" aria-hidden="true"></div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4 px-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeIndex === index ? 'bg-lime-400 w-6' : 'bg-zinc-700 hover:bg-zinc-500'
            }`}
            aria-label={`Vai alla slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

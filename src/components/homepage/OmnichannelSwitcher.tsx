'use client';

import { useState } from 'react';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  Sparkles, 
  Boxes, 
  Barcode, 
  CreditCard, 
  Users, 
  TrendingUp, 
  QrCode, 
  Wine, 
  Star, 
  Check, 
  ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

export default function OmnichannelSwitcher() {
  const [activeVertical, setActiveVertical] = useState<'retail' | 'hospitality'>('retail');

  const retailData = {
    title: 'RIVO Retail & Moda',
    subtitle: 'Negozi di abbigliamento, calzature, boutique e concept store phygital.',
    kpis: [
      { label: 'Tempo inventario', value: '-82%', desc: 'Scanner AI multi-barcode' },
      { label: 'Allucinazioni barcode', value: '0%', desc: 'Google Grounding certificato' },
      { label: 'Giacenza sincronizzata', value: '140ms', desc: 'Scontrini e magazzino cloud' },
    ],
    features: [
      {
        icon: Barcode,
        title: 'Scanner AI & Vision Scatola',
        desc: 'Legge marca (es. Nero Giardini, Hogan), taglia, colore e codice a barre direttamente dalla scatola o cartellino.',
      },
      {
        icon: Boxes,
        title: 'Gestione Taglie & Colori',
        desc: 'Matrice variante automatica (36-46, S-XXL) con alert sottoscorta e riordino fornitori istantaneo.',
      },
      {
        icon: CreditCard,
        title: 'Cassa Veloce & Resi Smart',
        desc: 'Emissione scontrino, pagamenti split, tracciamento reso e riassortimento automatico a scaffale.',
      },
      {
        icon: Users,
        title: 'CRM & Fidelity Moda',
        desc: 'Profili acquirente con taglie preferite, punti fedeltà Apple & Google Wallet e notifiche arrivi.',
      },
    ],
    ctaHref: '/dashboard/products',
    ctaText: 'Esplora Modulo Prodotti & Magazzino',
  };

  const hospitalityData = {
    title: 'RIVO Ristorazione & Hospitality',
    subtitle: 'Ristoranti, bistrot, cocktail bar, beach club e pizzerie gourmet.',
    kpis: [
      { label: 'Velocità al tavolo', value: 'x3', desc: 'Ordinazione e conto 1-tap NFC' },
      { label: 'Scontrino medio', value: '+24%', desc: 'Upselling con AI Sommelier' },
      { label: 'Recensioni Google', value: '+340%', desc: 'Filtro reputazione a 5 stelle' },
    ],
    features: [
      {
        icon: QrCode,
        title: 'Smart Stand NFC al Tavolo',
        desc: 'I clienti toccano con il telefono senza scaricare app: menu digitale multilingua con foto in 4K.',
      },
      {
        icon: Wine,
        title: 'AI Sommelier & Consigli',
        desc: 'Suggerisce al cliente l’abbinamento vino ideale e i dolci consigliati dallo chef in base al piatto scelto.',
      },
      {
        icon: UtensilsCrossed,
        title: 'Gestione Comande & Cucina',
        desc: 'Invio ordini immediato su stampanti comande o display KDS con distinzione portate e varianti allergeni.',
      },
      {
        icon: Star,
        title: 'Turbo Recensioni 5 Stelle',
        desc: 'Raccoglie feedback immediato a fine pasto e indirizza i clienti soddisfatti direttamente su Google Maps.',
      },
    ],
    ctaHref: '/dashboard/menu',
    ctaText: 'Esplora Modulo Menu & Tavoli',
  };

  const activeData = activeVertical === 'retail' ? retailData : hospitalityData;

  return (
    <section className="py-24 px-4 md:px-6 relative bg-[#09090B] border-t border-zinc-900">
      <div className="max-w-6xl mx-auto">
        {/* Switcher Navigation Bar (NO EMOJIS, PURE SVG ICONS) */}
        <div className="flex flex-col items-center text-center space-y-4 mb-14">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Due mondi verticali • Un&apos;unica piattaforma unificata
          </span>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Progettato per chi vende e per chi ospita.
          </h2>

          <div className="p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex items-center gap-2 mt-4 shadow-xl">
            <button
              type="button"
              onClick={() => setActiveVertical('retail')}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
                activeVertical === 'retail'
                  ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20 scale-[1.02]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Retail & Moda</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveVertical('hospitality')}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
                activeVertical === 'hospitality'
                  ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20 scale-[1.02]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 shrink-0" />
              <span>Ristorazione & Hospitality</span>
            </button>
          </div>
        </div>

        {/* Dynamic Morphing Card Content */}
        <div className="bg-zinc-950/60 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl transition-all duration-500">
          
          {/* Header of Active Vertical */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-800/80">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-lime-400 font-mono mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verticale Attivo</span>
              </div>
              <h3 className="text-2xl md:text-4xl font-black text-white">{activeData.title}</h3>
              <p className="text-sm md:text-base text-zinc-400 mt-2 max-w-xl">{activeData.subtitle}</p>
            </div>

            <Link
              href={activeData.ctaHref}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs md:text-sm font-bold text-white transition-all group shrink-0"
            >
              <span>{activeData.ctaText}</span>
              <ArrowRight className="w-4 h-4 text-lime-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Key Metrics / KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-8 border-b border-zinc-800/80">
            {activeData.kpis.map((kpi, idx) => (
              <div key={idx} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5">
                <div className="text-3xl md:text-4xl font-black text-lime-400 font-mono">{kpi.value}</div>
                <div className="text-xs font-bold text-white mt-1">{kpi.label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{kpi.desc}</div>
              </div>
            ))}
          </div>

          {/* Features Quad Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            {activeData.features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/5 hover:border-lime-400/30 rounded-2xl p-6 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 mb-4 group-hover:scale-110 transition-transform">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-lime-300 transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-xs md:text-sm text-zinc-400 mt-2 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}

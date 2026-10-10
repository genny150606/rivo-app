'use client';

import { useState } from 'react';
import { sound } from './SoundSystem';
import {
  Utensils,
  Coffee,
  Hotel,
  IceCream,
  ShoppingBag,
  Dumbbell,
  Scissors,
  Store,
  Sparkles,
  Check,
} from 'lucide-react';

interface Industry {
  id: string;
  name: string;
  icon: typeof Utensils;
  headline: string;
  stageTransform: string;
  touchpoints: string[];
  keyModules: string[];
  roiMetric: string;
  quote: string;
  quoteAuthor: string;
}

const INDUSTRIES: Industry[] = [
  {
    id: 'restaurant',
    name: 'RESTAURANT',
    icon: Utensils,
    headline: 'Dal tavolo al conto: zero attrito, recensioni perfette',
    stageTransform: 'Tavolo in rovere scuro con segnaposto NFC in alluminio spazzolato',
    touchpoints: ['Tavolo sala', 'Terrazza esterna', 'Scontrino fiscale'],
    keyModules: ['Chiama Cameriere', 'Review Shield Google', 'Menu Allergeni Dinamico'],
    roiMetric: '+18.4% recensioni a 5 stelle nei primi 30 giorni',
    quote: 'I clienti non aspettano più con la mano alzata. Il servizio è diventato fluido e le recensioni negative sono azzerate.',
    quoteAuthor: 'Executive Chef & Owner • Milano',
  },
  {
    id: 'bar',
    name: 'BAR & CAFÉ',
    icon: Coffee,
    headline: 'Velocità al bancone e clienti fedeli ogni mattina',
    stageTransform: 'Bancone in marmo nero con Smart Stand NFC ad alta velocità di contatto',
    touchpoints: ['Bancone cassa', 'Tavolini dehors', 'Bicchiere takeaway'],
    keyModules: ['1-Tap Wi-Fi Capture', 'Timbro Digitale Colazione', 'Google Review'],
    roiMetric: '420 nuovi contatti WhatsApp raccolti ogni mese',
    quote: 'Al mattino la gente va di fretta. Con un tocco si collegano al Wi-Fi e hanno la carta fedeltà nel loro Apple Wallet.',
    quoteAuthor: 'Founder • Specialty Coffee Roastery',
  },
  {
    id: 'hotel',
    name: 'HOTEL & SUITES',
    icon: Hotel,
    headline: 'Concierge invisibile 24/7 in ogni suite',
    stageTransform: 'Comodino in noce canaletto con piastra NFC e illuminazione soffusa',
    touchpoints: ['Portachiavi in pelle', 'Comodino suite', 'Tavoli colazione'],
    keyModules: ['Concierge AI Multilingua', 'Room Service 1-Click', 'Express Checkout'],
    roiMetric: '+24% ordini in camera e zero code al check-out',
    quote: 'Gli ospiti stranieri adorano non dover telefonare alla reception per ordinare o chiedere informazioni.',
    quoteAuthor: 'General Manager • Boutique Hotel Firenze',
  },
  {
    id: 'gelateria',
    name: 'GELATERIA',
    icon: IceCream,
    headline: 'Gamification e ritorno settimanale dei clienti',
    stageTransform: 'Vetrina pozzetti artigianali con QR/NFC totem integrato',
    touchpoints: ['Cassa pagamento', 'Coppetta eco-friendly', 'Vetrina ingresso'],
    keyModules: ['Ruota della Fortuna', 'Coupon Gusto del Mese', 'Club Fedeltà'],
    roiMetric: '31% tasso di ritorno entro 7 giorni con spin wheel',
    quote: 'I bambini e le famiglie adorano girare la ruota per vincere il topping omaggio. Tornano continuamente.',
    quoteAuthor: 'Mastro Gelatiere • Bologna',
  },
  {
    id: 'boutique',
    name: 'BOUTIQUE & RETAIL',
    icon: ShoppingBag,
    headline: 'Il capo parla al cliente e lo porta nel club esclusivo',
    stageTransform: 'Stander appendiabiti minimalista con etichette tessute NFC interattive',
    touchpoints: ['Cartellino abito', 'Specchio camerino', 'Shopping bag'],
    keyModules: ['Storytelling Manifattura', 'Certificato Autenticità', 'VIP Private Sale'],
    roiMetric: '3.4x iscrizioni al VIP Club rispetto alla newsletter web',
    quote: 'Quando una cliente tocca l’etichetta con il telefono e vede il video del laboratorio di sartoria, l’acquisto è immediato.',
    quoteAuthor: 'Creative Director • Luxury Fashion',
  },
  {
    id: 'gym',
    name: 'GYM & FITNESS',
    icon: Dumbbell,
    headline: 'Check-in istantaneo, schede workout e pass amici',
    stageTransform: 'Pannello in grafite opaca all’ingresso della sala pesi con scanner NFC',
    touchpoints: ['Tornello ingresso', 'Macchinari sala', 'Spogliatoio'],
    keyModules: ['Pass Amico 1-Tap', 'Video Tutorial Attrezzature', 'Rinnovo Abbonamento'],
    roiMetric: '+38 referral spontanei per trimestre senza costi adv',
    quote: 'I soci condividono il pass d’ingresso con gli amici direttamente via WhatsApp con un tocco sullo specchio.',
    quoteAuthor: 'Head Coach & Owner • Crossfit Studio',
  },
  {
    id: 'studio',
    name: 'STUDIO & SALON',
    icon: Scissors,
    headline: 'Prenotazione automatica prima di uscire dalla poltrona',
    stageTransform: 'Specchiera salon illuminata a LED con puck NFC discreto sul piano',
    touchpoints: ['Specchiera postazione', 'Biglietto da visita smart', 'Confezione prodotti'],
    keyModules: ['Riboooking 1-Tap', 'Scheda Consulenza Look', 'Review Google'],
    roiMetric: '88% dei clienti riprenota il prossimo appuntamento prima di pagare',
    quote: 'La cliente appoggia il telefono e blocca il prossimo appuntamento mentre le finisco la piega. Incredibile.',
    quoteAuthor: 'Master Stylist • Roma',
  },
  {
    id: 'shop',
    name: 'SPECIALTY SHOP',
    icon: Store,
    headline: 'Connetti i prodotti sullo scaffale al tuo magazzino cloud',
    stageTransform: 'Scaffale in rovere naturale con profili NFC intelligenti per ogni referenza',
    touchpoints: ['Scaffale vini & oli', 'Confezione regalo', 'Banco assaggi'],
    keyModules: ['AI Sommelier abbinamenti', 'Spedizione a casa', 'Scheda Degustazione'],
    roiMetric: '+28% vendite di etichette premium con guida AI',
    quote: 'I clienti che prima erano intimiditi dai vini complessi ora toccano la bottiglia e l’AI consiglia il piatto ideale.',
    quoteAuthor: 'Sommelier & Proprietario • Enoteca Storica',
  },
];

export default function IndustryScenes() {
  const [activeIndustryId, setActiveIndustryId] = useState<string>('restaurant');

  const active = INDUSTRIES.find((i) => i.id === activeIndustryId) || INDUSTRIES[0];

  const handleSelect = (id: string) => {
    setActiveIndustryId(id);
    sound.playTap();
    sound.playLaser();
  };

  return (
    <section
      id="industries"
      className="relative min-h-screen w-full bg-[#050507] text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 text-[11px] font-mono tracking-widest uppercase mb-4">
            <Sparkles size={13} className="text-[#BFFF00]" />
            <span>A UNIVERSAL HORIZONTAL PLATFORM</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-[-0.03em] uppercase leading-tight font-['Space_Grotesk']">
            ONE OS. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#BFFF00]">
              EVERY INDUSTRY.
            </span>
          </h2>

          <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
            Nessuna barriera di settore. Guarda come la scena e i flussi RIVO si trasformano in base al tuo modello di business.
          </p>
        </div>

        {/* Industry Metamorphosis Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 justify-start sm:justify-center scrollbar-none mb-12">
          {INDUSTRIES.map((ind) => {
            const isSelected = ind.id === activeIndustryId;
            const Icon = ind.icon;

            return (
              <button
                key={ind.id}
                onClick={() => handleSelect(ind.id)}
                data-cursor="INDUSTRY"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-mono tracking-wider uppercase transition-all duration-300 shrink-0 ${
                  isSelected
                    ? 'bg-[#BFFF00] text-black border-[#BFFF00] font-bold shadow-[0_0_25px_rgba(191,255,0,0.4)] scale-105'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{ind.name}</span>
              </button>
            );
          })}
        </div>

        {/* The Transforming Stage Display */}
        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.85)] relative overflow-hidden transition-all duration-500">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Metamorphic Scene Details */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#BFFF00]">
                  <active.icon size={24} />
                </div>
                <div>
                  <span className="text-xs font-mono text-[#BFFF00] tracking-widest uppercase">
                    SETTORE ATTIVO • {active.name}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] mt-0.5">
                    {active.headline}
                  </h3>
                </div>
              </div>

              {/* Physical Environment Metamorphosis description */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  AMBIENTE FISICO TRASFORMATO
                </span>
                <p className="text-sm text-zinc-300 mt-1 font-medium">
                  {active.stageTransform}
                </p>
              </div>

              {/* Key Active Software Modules */}
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
                  MODULI RIVO ATTIVATI
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {active.keyModules.map((mod, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-center gap-2 text-xs font-semibold text-zinc-200"
                    >
                      <Check size={14} className="text-[#BFFF00] shrink-0" />
                      <span>{mod}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real Customer Quote */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border-l-2 border-[#BFFF00] text-xs">
                <p className="italic text-zinc-300">
                  “{active.quote}”
                </p>
                <span className="text-[10px] font-mono text-zinc-500 mt-2 block uppercase">
                  {active.quoteAuthor}
                </span>
              </div>

            </div>

            {/* Right: ROI Metric & Hardware Preview */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              <div className="p-6 rounded-2xl bg-gradient-to-tr from-zinc-900 to-zinc-800/80 border border-zinc-700 flex flex-col justify-between text-left">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                  IMPATTO MISURATO SUL FATTURATO
                </span>
                <div className="my-4 text-xl sm:text-2xl font-black text-[#BFFF00] font-['Space_Grotesk'] leading-snug">
                  {active.roiMetric}
                </div>
                <div className="text-[11px] text-zinc-400">
                  Dati aggregati da oltre 400 attività attive su piattaforma RIVO in Italia ed Europa.
                </div>
              </div>

              {/* Touchpoints in venue */}
              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-3">
                  PUNTI DI CONTATTO INSTALLATI NEL LOCALE
                </span>
                <div className="flex flex-wrap gap-2">
                  {active.touchpoints.map((tp, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-zinc-800 text-xs font-mono text-zinc-300 border border-zinc-700"
                    >
                      • {tp}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

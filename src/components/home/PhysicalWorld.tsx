'use client';

import { useState } from 'react';
import { sound } from './SoundSystem';
import {
  Layers,
  Utensils,
  Store,
  DoorOpen,
  BedDouble,
  Package,
  ReceiptText,
  CheckCircle,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';

interface Touchpoint {
  id: string;
  name: string;
  category: string;
  icon: typeof Utensils;
  headline: string;
  physicalDesc: string;
  digitalLayer: string[];
  specs: { label: string; val: string }[];
}

const TOUCHPOINTS: Touchpoint[] = [
  {
    id: 'table',
    name: 'TABLE',
    category: 'Hospitality & Dining',
    icon: Utensils,
    headline: 'Il tavolo diventa un terminale ospite intelligente',
    physicalDesc: 'Disco NFC in alluminio anodizzato o sticker antimicrobico resistente a calore e liquidi.',
    digitalLayer: ['Chiama Sala / Cameriere', 'Menu Multilingua con Filtri Allergeni', 'Google Review Shield al checkout', 'Timbro Fedeltà Digitale'],
    specs: [
      { label: 'ATTIVAZIONE', val: '0.2s via NFC/QR' },
      { label: 'TEMPO ATTESA', val: '-38% tempo cameriere' },
      { label: 'SCONTRINO MEDIO', val: '+14% con menu visivo' },
    ],
  },
  {
    id: 'counter',
    name: 'COUNTER',
    category: 'Retail & Quick Service',
    icon: Store,
    headline: 'La cassa trasforma ogni pagamento in un contatto ricorrente',
    physicalDesc: 'Smart Stand da banco in legno noce o acrilico specchiato con chip ad alta portata.',
    digitalLayer: ['Accesso Wi-Fi ospiti 1-Click', 'Lead Capture WhatsApp / Email', 'Ruota della Fortuna & Coupon istantaneo', 'Recensione 5-Stelle verificata'],
    specs: [
      { label: 'ACQUISIZIONE LEAD', val: '4.8x rispetto a moduli carta' },
      { label: 'CONVERSIONE COUPON', val: '31% entro 14 giorni' },
      { label: 'GDPR STATUS', val: 'Verificato con doppio opt-in' },
    ],
  },
  {
    id: 'door',
    name: 'DOOR & ENTRANCE',
    category: 'Retail & Nightlife',
    icon: DoorOpen,
    headline: 'La vetrina comunica anche quando il locale è chiuso',
    physicalDesc: 'Smart Plate trasparente in policarbonato retroilluminato con protezione UV.',
    digitalLayer: ['Orari in tempo reale e prenotazione tavolo', 'Pass VIP evento esclusivo', 'Menu e catalogo sfogliabile', 'Notifiche WhatsApp aperture speciali'],
    specs: [
      { label: 'ENGAGEMENT NOTTURNO', val: '+45 interazioni off-hours/settimana' },
      { label: 'PRENOTAZIONI TAVOLO', val: 'Dirette senza commissioni' },
      { label: 'RESISTENZA', val: 'IP68 per intemperie esterne' },
    ],
  },
  {
    id: 'room',
    name: 'ROOM',
    category: 'Hotels & Luxury Suites',
    icon: BedDouble,
    headline: 'La camera offre un concierge digitale a 5 stelle',
    physicalDesc: 'Portachiavi in pelle rigenerata o targa comodino integrata.',
    digitalLayer: ['Concierge 24/7 con intelligenza artificiale', 'Room Service & Ordinazioni colazione', 'Guide locali curate dal proprietario', 'Check-out express senza coda'],
    specs: [
      { label: 'UPSELL SERVIZI', val: '+22% ordini in camera' },
      { label: 'SODDISFAZIONE OSPITE', val: '4.9/5 rating medio' },
      { label: 'APP DOWNLOAD', val: '0 (Web Nativo Istantaneo)' },
    ],
  },
  {
    id: 'product',
    name: 'PRODUCT & PACK',
    category: 'Brands, Wine & Gourmet',
    icon: Package,
    headline: 'La confezione fisica racconta la storia autentica del prodotto',
    physicalDesc: 'Tag NFC integrato nel collarino della bottiglia, astuccio o etichetta tessuta.',
    digitalLayer: ['Certificato di Autenticità anti-contraffazione', 'AI Sommelier: Abbinamento cibo-vino', 'Rilascio NFT / Club collezionisti', 'Riordino 1-Click con consegna a domicilio'],
    specs: [
      { label: 'SICUREZZA', val: 'Chip crittografico univoco' },
      { label: 'RETENTION CLIENTE', val: '+28% ordini ripetuti' },
      { label: 'TRACKING GEOGRAFICO', val: 'Mappa globale di stappatura' },
    ],
  },
  {
    id: 'receipt',
    name: 'RECEIPT',
    category: 'Post-Purchase Lifecycle',
    icon: ReceiptText,
    headline: 'La ricevuta chiude l’esperienza e assicura il ritorno del cliente',
    physicalDesc: 'QR dinamico integrato nello scontrino termico o slip cassa POS.',
    digitalLayer: ['Invito recensione tempestiva su Google', 'Accredito punti spesa automatico', 'Coupon di ringraziamento per visita successiva', 'Assistenza clienti post-vendita'],
    specs: [
      { label: 'TASSO DI RITORNO', val: '+19% clienti entro 30gg' },
      { label: 'SHIELD PROTEZIONE', val: '100% feedback critici gestiti' },
      { label: 'COSTO STAMPA', val: '€0 (integrato nel rotolo cassa)' },
    ],
  },
];

export default function PhysicalWorld() {
  const [activeTouchpointId, setActiveTouchpointId] = useState<string>('table');

  const active = TOUCHPOINTS.find((t) => t.id === activeTouchpointId) || TOUCHPOINTS[0];

  const handleSelect = (id: string) => {
    setActiveTouchpointId(id);
    sound.playTap();
    sound.playLaser();
  };

  return (
    <section
      id="touchpoints"
      className="relative min-h-screen w-full bg-[#030305] text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-zinc-900"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 text-[11px] font-mono tracking-widest uppercase mb-4">
            <Layers size={13} className="text-[#BFFF00]" />
            <span>ANY SURFACE BECOMES AN INTERFACE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.03em] uppercase leading-tight font-['Space_Grotesk']">
            RIVO IS NOT A QR CODE. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFFF00] via-white to-cyan-400">
              IT’S A DIGITAL LAYER OVER REALITY.
            </span>
          </h2>

          <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
            Seleziona un touchpoint per vedere come RIVO trasforma oggetti fisici inerti in nodi interattivi programmabili.
          </p>
        </div>

        {/* Horizontal Touchpoint Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 justify-start sm:justify-center scrollbar-none mb-12">
          {TOUCHPOINTS.map((tp) => {
            const isSelected = tp.id === activeTouchpointId;
            const Icon = tp.icon;

            return (
              <button
                key={tp.id}
                onClick={() => handleSelect(tp.id)}
                data-cursor="TOUCHPOINT"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-mono tracking-wider uppercase transition-all duration-300 shrink-0 ${
                  isSelected
                    ? 'bg-[#BFFF00] text-black border-[#BFFF00] font-bold shadow-[0_0_25px_rgba(191,255,0,0.4)] scale-105'
                    : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{tp.name}</span>
              </button>
            );
          })}
        </div>

        {/* The Dual Layer Showcase Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-zinc-950/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          
          {/* Left Column: Physical Anchor vs Digital Hologram */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Upper Badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#BFFF00] tracking-widest uppercase">
                {active.category}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                ACTIVE SURFACE
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-['Space_Grotesk']">
              {active.headline}
            </h3>

            {/* Layer A: Physical Substrate */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-left">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase mb-1">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <span>STRATO FISICO (HARDWARE)</span>
              </div>
              <p className="text-sm text-zinc-300">
                {active.physicalDesc}
              </p>
            </div>

            {/* Layer B: The Active Digital Layer */}
            <div className="p-5 rounded-xl bg-zinc-900/90 border border-[#BFFF00]/40 shadow-[0_0_20px_rgba(191,255,0,0.08)] text-left">
              <div className="flex items-center gap-2 text-xs font-mono text-[#BFFF00] uppercase mb-3">
                <Sparkles size={14} className="text-[#BFFF00]" />
                <span>STRATO DIGITALE RIVO (SOFTWARE)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {active.digitalLayer.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-zinc-200">
                    <CheckCircle size={14} className="text-[#BFFF00] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Physical & Performance Metrics */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {active.specs.map((spec, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between"
                >
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    {spec.label}
                  </span>
                  <span className="mt-3 text-lg sm:text-xl font-black text-white font-mono">
                    {spec.val}
                  </span>
                </div>
              ))}
            </div>

            {/* Real-time Hardware Telemetry Bar */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[#BFFF00]">
                  <Shield size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">NFC Chipset Type 5 & QR Dinamico</div>
                  <div className="text-[11px] text-zinc-400">Firmware crittografato AES-128 con zero duplicazione</div>
                </div>
              </div>
              <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800">
                100% OPERATIONAL
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

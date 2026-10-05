'use client';

import { useState, useRef } from 'react';
import { 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Zap, 
  ShoppingBag, 
  UtensilsCrossed, 
  ArrowRight,
  Barcode
} from 'lucide-react';
import Link from 'next/link';

interface DemoItem {
  id: string;
  type: 'retail' | 'hospitality';
  title: string;
  subtitle: string;
  barcode: string;
  brand: string;
  spec1: { label: string; value: string };
  spec2: { label: string; value: string };
  price: string;
  status: string;
  badge: string;
}

const DEMO_SAMPLES: DemoItem[] = [
  {
    id: 'retail-shoe',
    type: 'retail',
    title: 'Nero Giardini Décolleté Pelle',
    subtitle: 'Calzature Donna • Collezione Autunno',
    barcode: '8059346618712',
    brand: 'Nero Giardini',
    spec1: { label: 'Taglia', value: 'EU 38' },
    spec2: { label: 'Colore', value: 'Nero Lucido' },
    price: '€ 139,00',
    status: 'Giacenza Sincronizzata: +1 pz',
    badge: 'Lettura Scatola AI & Barcode',
  },
  {
    id: 'hospitality-table',
    type: 'hospitality',
    title: 'Tartare di Salmone & Avocado',
    subtitle: 'Tavolo 14 • Comanda Digitale NFC',
    barcode: 'NFC-TBL-014',
    brand: 'Menu Gourmet RIVO',
    spec1: { label: 'Abbinamento', value: 'Franciacorta DOCG' },
    spec2: { label: 'Allergeni', value: 'Pesce, Sesamo' },
    price: '€ 18,00',
    status: 'Inviato in Cucina in 0.4s',
    badge: 'NFC Touch & AI Sommelier',
  },
];

export default function InteractiveScannerSimulator() {
  const [activeSample, setActiveSample] = useState<DemoItem>(DEMO_SAMPLES[0]);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const playChime = () => {
    if (!audioEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.07 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.35);
      });
    } catch {}
  };

  const handleTriggerScan = () => {
    if (scanning) return;
    setScanning(true);
    setScanComplete(false);

    setTimeout(() => {
      setScanning(false);
      setScanComplete(true);
      playChime();
    }, 1200);
  };

  const handleReset = () => {
    setScanning(false);
    setScanComplete(false);
  };

  return (
    <section id="scanner-interattivo" className="py-24 px-4 md:px-6 relative overflow-hidden bg-[#09090B] scroll-mt-20">
      {/* Background neon ambient aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-lime-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Esperienza Interattiva Live</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Prova l’AI RIVO in tempo reale.
          </h2>
          <p className="mt-4 text-zinc-400 text-base md:text-lg">
            Sperimenta la velocità del motore di riconoscimento visivo e barcode: tocca per scansionare e guarda la scheda crearsi all’istante.
          </p>

          {/* Sample Switcher (No Emojis, Pure SVG Icons) */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              type="button"
              onClick={() => {
                setActiveSample(DEMO_SAMPLES[0]);
                handleReset();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeSample.id === 'retail-shoe'
                  ? 'bg-lime-400 text-black border-lime-400 shadow-lg shadow-lime-400/20 scale-105'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Calzature & Scatola Retail</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSample(DEMO_SAMPLES[1]);
                handleReset();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeSample.id === 'hospitality-table'
                  ? 'bg-lime-400 text-black border-lime-400 shadow-lg shadow-lime-400/20 scale-105'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Hospitality & Piatto Gourmet</span>
            </button>
          </div>
        </div>

        {/* Interactive Viewfinder & Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-zinc-950/80 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-2xl shadow-2xl">
          
          {/* Left: Hologram Viewfinder HUD */}
          <div className="relative aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-zinc-800 flex flex-col items-center justify-center p-6 shadow-inner">
            {/* Viewfinder Reticle Grid */}
            <div className="absolute inset-4 border border-lime-400/20 rounded-xl pointer-events-none flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-lime-400" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-lime-400" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-lime-400" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-lime-400" />

              {/* Laser sweep animation when scanning */}
              {scanning && (
                <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-lime-400 to-transparent shadow-[0_0_16px_#bfff00] animate-bounce top-1/2" />
              )}
            </div>

            {/* Target Item Hologram Illustration */}
            <div className={`transition-all duration-500 text-center space-y-3 ${scanning ? 'scale-105 opacity-80' : 'opacity-100'}`}>
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center mx-auto shadow-xl">
                {activeSample.type === 'retail' ? (
                  <ShoppingBag className="w-9 h-9 text-lime-400" />
                ) : (
                  <UtensilsCrossed className="w-9 h-9 text-sky-400" />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-white">{activeSample.title}</p>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">{activeSample.barcode}</p>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-300">
                <Barcode className="w-3 h-3 text-lime-400" />
                <span>Punta il mirino laser</span>
              </span>
            </div>

            {/* Bottom HUD Controls */}
            <div className="absolute bottom-3 inset-x-4 flex items-center justify-between z-20">
              <button
                type="button"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-2 rounded-lg bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                title={audioEnabled ? 'Audio Chime attivo' : 'Audio muto'}
              >
                {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-lime-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleTriggerScan}
                disabled={scanning}
                className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-lime-400/25 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>{scanning ? 'Scansione in corso...' : 'Avvia Scansione AI'}</span>
              </button>
            </div>
          </div>

          {/* Right: AI Decoded Output Card */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                Output Riconoscimento Real-Time
              </span>

              {scanComplete && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resetta</span>
                </button>
              )}
            </div>

            {scanComplete ? (
              /* Decoded Card */
              <div className="bg-zinc-900/90 border-2 border-lime-400/60 rounded-2xl p-6 space-y-4 shadow-xl shadow-lime-400/10 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-lime-400/20 text-lime-300 border border-lime-400/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {activeSample.badge}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">{activeSample.barcode}</span>
                </div>

                <div>
                  <h4 className="text-xl font-black text-white">{activeSample.title}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{activeSample.subtitle}</p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-800 text-center">
                  <div className="bg-zinc-800/50 p-2 rounded-xl">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">{activeSample.spec1.label}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{activeSample.spec1.value}</div>
                  </div>
                  <div className="bg-zinc-800/50 p-2 rounded-xl">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">{activeSample.spec2.label}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{activeSample.spec2.value}</div>
                  </div>
                  <div className="bg-zinc-800/50 p-2 rounded-xl">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Prezzo</div>
                    <div className="text-sm font-black text-lime-400 mt-0.5">{activeSample.price}</div>
                  </div>
                </div>

                {/* Live Synchronization notification */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-lime-400 font-medium font-mono text-[11px]">
                    ● {activeSample.status}
                  </span>
                  <span className="text-zinc-500 text-[10px] font-mono">Latenza: 140ms</span>
                </div>
              </div>
            ) : (
              /* Idle Standby Box */
              <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto text-zinc-500">
                  <Camera className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-300">Scanner in attesa</p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Clicca sul pulsante &quot;Avvia Scansione AI&quot; per vedere come il radar ottico legge istantaneamente l&apos;articolo senza allucinazioni.
                </p>
              </div>
            )}

            {/* Direct App Link */}
            <div className="pt-2">
              <Link
                href="/dashboard/scanner"
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all group"
              >
                <span>Usa la Fotocamera reale del tuo Telefono</span>
                <ArrowRight className="w-4 h-4 text-lime-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

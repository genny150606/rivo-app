'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import { 
  Smartphone, 
  QrCode, 
  Boxes, 
  ScanLine, 
  Receipt, 
  BarChart3, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight, 
  Tag, 
  Footprints, 
  Search, 
  Check, 
  Copy, 
  ShoppingBag, 
  ArrowUpRight, 
  Zap, 
  AlertTriangle, 
  Sliders, 
  Users, 
  CreditCard,
  Volume2,
  VolumeX,
  RotateCw,
  Eye,
  Info
} from 'lucide-react';

interface ShoeSample {
  id: string;
  name: string;
  brand: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  margin: number;
  sizes: Array<{ size: string; stock: number; barcode: string; low: boolean; out: boolean }>;
}

const SHOE_SAMPLES: ShoeSample[] = [
  {
    id: '1',
    name: 'Mocassino Artigianale Borrelli',
    brand: 'Borrelli Heritage',
    sku: 'BOR-MOC-01',
    category: 'Calzature Uomo',
    price: 149.00,
    cost: 65.00,
    margin: 56.4,
    sizes: [
      { size: '40', stock: 4, barcode: '8012345001402', low: false, out: false },
      { size: '41', stock: 6, barcode: '8012345001419', low: false, out: false },
      { size: '42', stock: 5, barcode: '8012345001426', low: false, out: false },
      { size: '43', stock: 2, barcode: '8012345001433', low: true, out: false },
      { size: '44', stock: 1, barcode: '8012345001440', low: true, out: false },
      { size: '45', stock: 0, barcode: '8012345001457', low: false, out: true },
    ],
  },
  {
    id: '2',
    name: 'Francesina Oxford Classic Borrelli',
    brand: 'Borrelli Heritage',
    sku: 'BOR-OXF-02',
    category: 'Calzature Uomo',
    price: 169.00,
    cost: 75.00,
    margin: 55.6,
    sizes: [
      { size: '40', stock: 3, barcode: '8012345002409', low: false, out: false },
      { size: '41', stock: 5, barcode: '8012345002416', low: false, out: false },
      { size: '42', stock: 4, barcode: '8012345002423', low: false, out: false },
      { size: '43', stock: 3, barcode: '8012345002430', low: false, out: false },
      { size: '44', stock: 2, barcode: '8012345002447', low: true, out: false },
    ],
  },
  {
    id: '3',
    name: 'Sneaker Premiata Mick',
    brand: 'Premiata',
    sku: 'PRE-MCK-5890',
    category: 'Sneakers & Casual',
    price: 230.00,
    cost: 108.00,
    margin: 53.0,
    sizes: [
      { size: '41', stock: 4, barcode: '8033984110412', low: false, out: false },
      { size: '42', stock: 3, barcode: '8033984110429', low: false, out: false },
      { size: '43', stock: 5, barcode: '8033984110436', low: false, out: false },
      { size: '44', stock: 2, barcode: '8033984110443', low: true, out: false },
      { size: '45', stock: 1, barcode: '8033984110450', low: true, out: false },
    ],
  },
  {
    id: '4',
    name: 'Hogan H-Stripes Platform',
    brand: 'Hogan',
    sku: 'HOG-HST-01',
    category: 'Sneakers & Casual',
    price: 360.00,
    cost: 175.00,
    margin: 51.4,
    sizes: [
      { size: '37', stock: 2, barcode: '8059345010375', low: true, out: false },
      { size: '38', stock: 4, barcode: '8059345010382', low: false, out: false },
      { size: '39', stock: 3, barcode: '8059345010399', low: false, out: false },
      { size: '40', stock: 2, barcode: '8059345010405', low: true, out: false },
      { size: '41', stock: 1, barcode: '8059345010412', low: true, out: false },
    ],
  },
  {
    id: '5',
    name: 'Nero Giardini Décolleté Glove Tacco 8',
    brand: 'Nero Giardini',
    sku: 'NG-DEC-A111640D',
    category: 'Calzature Donna',
    price: 139.50,
    cost: 58.00,
    margin: 58.4,
    sizes: [
      { size: '36', stock: 3, barcode: '8021045003361', low: false, out: false },
      { size: '37', stock: 5, barcode: '8021045003378', low: false, out: false },
      { size: '38', stock: 6, barcode: '8021045003385', low: false, out: false },
      { size: '39', stock: 4, barcode: '8021045003392', low: false, out: false },
      { size: '40', stock: 2, barcode: '8021045003408', low: true, out: false },
    ],
  },
];

type DemoTab = 'touchpoint' | 'stockcheck' | 'scanner' | 'pos' | 'controlroom';

export default function RetailDemoPage() {
  const [activeTab, setActiveTab] = useState<DemoTab>('touchpoint');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Stock check interactive simulation state
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [selectedShoe, setSelectedShoe] = useState<ShoeSample>(SHOE_SAMPLES[0]);

  // Scanner interactive simulator state
  const [simulatedCode, setSimulatedCode] = useState('8012345001426');
  const [scannerResult, setScannerResult] = useState<any>(null);
  const [scannerScanning, setScannerScanning] = useState(false);

  // POS simulation state
  const [posCart, setPosCart] = useState<Array<{ name: string; size: string; price: number; qty: number }>>([
    { name: 'Mocassino Artigianale Borrelli', size: '42', price: 149.00, qty: 1 },
  ]);
  const [posCustomer, setPosCustomer] = useState('Marco Esposito (VIP 140 pt)');
  const [posDiscount, setPosDiscount] = useState(10);
  const [posSaleComplete, setPosSaleComplete] = useState(false);

  const deviceCode = 'RIVO-FMT1GW';
  const hubUrl = typeof window !== 'undefined' ? `${window.location.origin}/hub/${deviceCode}` : `https://rivo-app-ten.vercel.app/hub/${deviceCode}`;
  const tapUrl = typeof window !== 'undefined' ? `${window.location.origin}/t/${deviceCode}` : `https://rivo-app-ten.vercel.app/t/${deviceCode}`;

  useEffect(() => {
    QRCode.toDataURL(tapUrl, {
      margin: 1,
      width: 280,
      color: {
        dark: '#00FF66',
        light: '#0a0d0b',
      },
    }).then(setQrDataUrl);
  }, [tapUrl]);

  // Audio effect
  const playLaserBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {}
  }, [soundEnabled]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Run simulated scan
  const triggerSimulatedScan = (barcode: string) => {
    setSimulatedCode(barcode);
    setScannerScanning(true);
    playLaserBeep();
    setTimeout(() => {
      setScannerScanning(false);
      const match = SHOE_SAMPLES.flatMap(s => 
        s.sizes.map(sz => ({ ...sz, shoeName: s.name, brand: s.brand, price: s.price, cost: s.cost }))
      ).find(x => x.barcode === barcode);

      if (match) {
        setScannerResult(match);
      } else {
        setScannerResult({
          shoeName: 'Articolo Non a Catalogo',
          brand: 'Nuovo Fornitore',
          size: '42',
          price: 120.00,
          stock: 0,
          barcode,
        });
      }
    }, 450);
  };

  const filteredShoes = useMemo(() => {
    const q = stockSearchQuery.trim().toLowerCase();
    if (!q) return SHOE_SAMPLES;
    return SHOE_SAMPLES.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.brand.toLowerCase().includes(q) ||
      s.sku.toLowerCase().includes(q) ||
      s.sizes.some(sz => sz.size === q || sz.barcode.includes(q))
    );
  }, [stockSearchQuery]);

  const posSubtotal = posCart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const posDiscountAmount = (posSubtotal * posDiscount) / 100;
  const posTotal = posSubtotal - posDiscountAmount;

  return (
    <div className="min-h-screen bg-[#020204] text-white selection:bg-[#00FF66] selection:text-black font-sans pb-24">
      {/* Top Banner / Breadcrumb */}
      <header className="sticky top-0 z-40 bg-[#020204]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center p-1.5 group-hover:border-[#00FF66] transition-colors">
                <Image src="/brand/rivo-icon.png" alt="RIVO" width={22} height={22} className="rounded-xs" />
              </div>
              <span className="font-mono text-xs tracking-widest text-zinc-400 group-hover:text-white transition-colors uppercase">
                RIVO / RETAIL
              </span>
            </Link>
            <span className="text-zinc-600">/</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">Borrelli Calzature</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
                LIVE DEMO
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 text-xs transition-colors"
              title={soundEnabled ? 'Disattiva effetti audio' : 'Attiva effetti audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00FF66]" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-[#00FF66] transition-colors shadow-sm"
            >
              <span>Accedi al Gestionale</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Presentation Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-zinc-900/90 via-zinc-950/80 to-[#020204] border border-white/[0.1] shadow-2xl overflow-hidden">
          {/* Subtle Glow Background */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00FF66]/10 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
                <Footprints className="w-4 h-4 text-[#00FF66]" />
                <span>Piattaforma Operativa Retail • Calzature & Accessori</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Esperienza RIVO per <span className="text-[#00FF66]">Borrelli Calzature</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                Dimostrazione live dei 5 pilastri retail: dal touchpoint fisico NFC al banco per recensioni e catalogo, 
                fino alla verifica istantanea delle taglie per i commessi, scanner IA scatole e cassa veloce con scarico scorte.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-center">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">Catalogo Attivo</span>
                <span className="text-xl font-mono font-bold text-white">10 Modelli</span>
                <span className="text-[10px] text-[#00FF66] block">40 Numerazioni</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-center">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">Margine Medio</span>
                <span className="text-xl font-mono font-bold text-[#00FF66]">54.2%</span>
                <span className="text-[10px] text-zinc-400 block">Ricarico Reale</span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-black/60 border border-white/10 text-center">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">Touchpoint Cassa</span>
                <span className="text-xs font-mono font-bold text-zinc-200 block truncate">{deviceCode}</span>
                <span className="text-[10px] text-emerald-400 block">NFC + QR Live</span>
              </div>
            </div>
          </div>

          {/* Interactive Scenario Tabs */}
          <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('touchpoint')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'touchpoint'
                  ? 'bg-[#00FF66] text-black shadow-lg shadow-[#00FF66]/20 font-bold scale-[1.02]'
                  : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-white/5'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>1. Touchpoint Cliente (NFC/QR)</span>
            </button>

            <button
              onClick={() => setActiveTab('stockcheck')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'stockcheck'
                  ? 'bg-[#00FF66] text-black shadow-lg shadow-[#00FF66]/20 font-bold scale-[1.02]'
                  : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-white/5'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>2. Verifica Taglie Rapida</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'scanner'
                  ? 'bg-[#00FF66] text-black shadow-lg shadow-[#00FF66]/20 font-bold scale-[1.02]'
                  : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-white/5'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              <span>3. Scanner IA Scatole</span>
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'pos'
                  ? 'bg-[#00FF66] text-black shadow-lg shadow-[#00FF66]/20 font-bold scale-[1.02]'
                  : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-white/5'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>4. Cassa POS & Vendita</span>
            </button>

            <button
              onClick={() => setActiveTab('controlroom')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'controlroom'
                  ? 'bg-[#00FF66] text-black shadow-lg shadow-[#00FF66]/20 font-bold scale-[1.02]'
                  : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>5. Control Room Titolare</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Dynamic Interactive Showcase Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* ============================================================ */}
        {/* TAB 1: TOUCHPOINT CLIENTE (NFC, QR, REVIEW SHIELD, CATALOG) */}
        {/* ============================================================ */}
        {activeTab === 'touchpoint' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Left Column: Context & Real QR Code for Vincenzo Borrelli */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-[#00FF66] uppercase">
                  <Zap className="w-4 h-4" />
                  <span>Cosa mostrare al titolare</span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Il Puck NFC fisico sul banco cassa di Borrelli
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Quando il cliente conclude un acquisto o è in cassa, appoggia lo smartphone sul puck NFC 
                  oppure inquadra il QR con la fotocamera. Non richiede alcuna app da scaricare.
                </p>

                {/* Features Pill List */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <ShieldCheck className="w-4 h-4 text-[#00FF66] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-white block">Review Shield Google 5 Stelle</span>
                      <span className="text-[11px] text-zinc-400">
                        Se il cliente clicca 5 stelle va dritto su Google Maps di Borrelli Calzature. Se vota 1-3 stelle, invia un feedback privato al titolare.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-white block">Catalogo Digitale con Giacenze Live</span>
                      <span className="text-[11px] text-zinc-400">
                        I clienti sfogliano i modelli, vedono i prezzi ufficiali e le taglie attualmente in stock.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-white block">Fidelity Pass & Timbri Digitali</span>
                      <span className="text-[11px] text-zinc-400">
                        10 timbri digitali per il 15% di sconto. Nessuna tessera cartacea da stampare o perdere.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live QR Code Box */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4">
                  {qrDataUrl ? (
                    <div className="p-3 bg-[#0a0d0b] border border-[#00FF66]/30 rounded-2xl shadow-xl shrink-0">
                      <img src={qrDataUrl} alt="QR Code Borrelli" className="w-32 h-32 rounded-lg" />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-zinc-900 animate-pulse shrink-0" />
                  )}

                  <div className="space-y-2 text-center sm:text-left">
                    <span className="text-xs font-bold text-white block">
                      Fai inquadrare lo schermo al cliente
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Vincenzo può inquadrare questo QR col proprio telefono per provare in prima persona l'apertura istantanea dell'Hub.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => copyToClipboard(tapUrl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-[#00FF66]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copiato!' : 'Copia Link'}</span>
                      </button>

                      <a
                        href={hubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00FF66]/20 text-[#00FF66] hover:bg-[#00FF66]/30 border border-[#00FF66]/30 text-xs font-medium transition-colors"
                      >
                        <span>Apri in nuova scheda</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Smartphone Simulator */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-[380px] rounded-[48px] p-3.5 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black border-4 border-zinc-700 shadow-2xl relative">
                {/* Speaker pill notch */}
                <div className="w-28 h-4 bg-black rounded-full mx-auto mb-2" />

                {/* Smartphone Screen Viewport with live iframe */}
                <div className="w-full h-[680px] rounded-[36px] overflow-hidden bg-black border border-white/10 relative">
                  <iframe
                    src={`/hub/${deviceCode}?demo=1`}
                    title="Borrelli Calzature Hub Simulator"
                    className="w-full h-full border-0 select-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: VERIFICA TAGLIE RAPIDA (SHOP FLOOR FOR SALES STAFF) */}
        {/* ============================================================ */}
        {activeTab === 'stockcheck' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Left Column: Search & Size Matrix Simulator */}
            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono text-[#00FF66] uppercase block">Strumento Commessi in Negozio</span>
                    <h3 className="text-xl font-bold text-white">Verifica Giacenza Taglie in Tempo Reale</h3>
                  </div>
                  <Link
                    href="/dashboard/stock-check"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 text-xs text-zinc-200 hover:text-white border border-white/10"
                  >
                    <span>Apri Schermata Intera</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Instant Search Bar */}
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    placeholder="Digita modello, brand (Hogan, Premiata...) o taglia (es. 42)..."
                    className="w-full pl-11 pr-4 py-3 bg-black/60 border border-zinc-700 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00FF66]"
                  />
                  {stockSearchQuery && (
                    <button
                      onClick={() => setStockSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                    >
                      Azzera
                    </button>
                  )}
                </div>

                {/* Quick Size Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-zinc-500 font-mono pr-1">Filtro rapido taglia:</span>
                  {['37', '38', '40', '41', '42', '43', '44', '45'].map(size => (
                    <button
                      key={size}
                      onClick={() => setStockSearchQuery(size)}
                      className={`px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                        stockSearchQuery === size
                          ? 'bg-[#00FF66] text-black border-[#00FF66] font-bold'
                          : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* Shoe Cards with Size Matrix */}
                <div className="space-y-3 pt-2">
                  {filteredShoes.map((shoe) => {
                    const totalPieces = shoe.sizes.reduce((sum, s) => sum + s.stock, 0);
                    const isSelected = selectedShoe.id === shoe.id;

                    return (
                      <div
                        key={shoe.id}
                        onClick={() => setSelectedShoe(shoe)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#121613] border-[#00FF66]/50 shadow-lg'
                            : 'bg-black/40 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold uppercase text-[#00FF66]">
                                {shoe.brand}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500">
                                {shoe.sku}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-white">{shoe.name}</h4>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-mono font-extrabold text-white block">
                              € {shoe.price.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {totalPieces} paia in negozio
                            </span>
                          </div>
                        </div>

                        {/* Size Matrix Pills */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {shoe.sizes.map((sz) => (
                            <div
                              key={sz.size}
                              className={`p-2 rounded-xl border text-center transition-all ${
                                sz.out
                                  ? 'bg-rose-500/5 border-rose-500/20 opacity-50'
                                  : sz.low
                                  ? 'bg-amber-500/10 border-amber-500/30'
                                  : 'bg-zinc-900 border-zinc-700/60'
                              }`}
                            >
                              <span className="text-xs font-mono font-bold text-white block">
                                TG {sz.size}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold block ${
                                  sz.out
                                    ? 'text-rose-400'
                                    : sz.low
                                    ? 'text-amber-400'
                                    : 'text-[#00FF66]'
                                }`}
                              >
                                {sz.out ? 'Esaurito' : sz.stock === 1 ? '1 rimasto' : `${sz.stock} paia`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Explanatory Pitch & Focus Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
                <span className="text-xs font-mono text-[#00FF66] uppercase block">Il Valore per il Negozio</span>
                <h4 className="text-lg font-bold text-white">Zero corse a vuoto in magazzino</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Quando un cliente chiede al banco: <em>"Avete il 42 o il 43 in questo colore?"</em>, 
                  il personale non deve più assentarsi per 5 minuti a cercare tra le scatole. 
                  In 1 secondo sul cellulare sanno la disponibilità esatta.
                </p>

                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                  <span className="text-xs font-bold text-white block">Articolo Selezionato:</span>
                  <p className="text-sm font-semibold text-[#00FF66]">{selectedShoe.name}</p>
                  <div className="text-xs text-zinc-400 space-y-1 pt-1">
                    <p>• Prezzo vendita: <strong>€ {selectedShoe.price.toFixed(2)}</strong></p>
                    <p>• Costo fornitore: <strong>€ {selectedShoe.cost.toFixed(2)}</strong></p>
                    <p>• Margine lordo: <strong className="text-emerald-400">{selectedShoe.margin}%</strong></p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/dashboard/stock-check"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#00FF66] text-black font-bold text-xs hover:bg-[#00FF66]/90 transition-colors shadow-lg shadow-[#00FF66]/10"
                  >
                    <span>Apri Schermata Verifica Taglie</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: SCANNER IA SCATOLE & BARCODE */}
        {/* ============================================================ */}
        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Left Column: Interactive Laser Simulator */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono text-[#00FF66] uppercase block">Magazzino & Carico Merce</span>
                    <h3 className="text-xl font-bold text-white">Scanner Codici a Barre & Visione IA</h3>
                  </div>
                  <Link
                    href="/dashboard/scanner"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 text-xs text-zinc-200 hover:text-white border border-white/10"
                  >
                    <span>Apri Scanner Camera</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Laser Scanning Frame Simulation */}
                <div className="relative rounded-2xl h-64 bg-black/80 border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center overflow-hidden">
                  {/* Red / Neon Laser line */}
                  <div
                    className={`absolute inset-x-0 h-1 bg-[#00FF66] shadow-[0_0_15px_#00FF66] transition-all duration-300 ${
                      scannerScanning ? 'top-1/2 animate-bounce' : 'top-1/3'
                    }`}
                  />

                  {/* Corner Targets */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#00FF66]" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#00FF66]" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#00FF66]" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#00FF66]" />

                  <ScanLine className={`w-12 h-12 text-[#00FF66] mb-2 ${scannerScanning ? 'animate-pulse' : ''}`} />
                  <span className="font-mono text-xs text-zinc-400">Puntamento Laser Codice EAN-13</span>
                  <span className="font-mono text-sm font-bold text-white mt-1 tracking-widest">{simulatedCode}</span>
                </div>

                {/* Sample Barcode Triggers */}
                <div>
                  <span className="text-xs font-mono text-zinc-400 block mb-2">Simula scansione con un tap:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => triggerSimulatedScan('8012345001426')}
                      className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-left border border-white/5 transition-colors"
                    >
                      <span className="text-[11px] font-bold text-white block">Mocassino TG 42</span>
                      <span className="text-[10px] font-mono text-zinc-400">8012345001426</span>
                    </button>

                    <button
                      onClick={() => triggerSimulatedScan('8033984110436')}
                      className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-left border border-white/5 transition-colors"
                    >
                      <span className="text-[11px] font-bold text-white block">Premiata Mick TG 43</span>
                      <span className="text-[10px] font-mono text-zinc-400">8033984110436</span>
                    </button>

                    <button
                      onClick={() => triggerSimulatedScan('8059345010382')}
                      className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-left border border-white/5 transition-colors"
                    >
                      <span className="text-[11px] font-bold text-white block">Hogan Platform TG 38</span>
                      <span className="text-[10px] font-mono text-zinc-400">8059345010382</span>
                    </button>
                  </div>
                </div>

                {/* Scanner Result Card */}
                {scannerResult && (
                  <div className="p-4 rounded-2xl bg-[#0d140e] border border-[#00FF66]/40 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#00FF66]" />
                        <span className="text-xs font-bold text-white">Articolo Riconosciuto Istantaneamente</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded-md">
                        Stock Attuale: {scannerResult.stock} pz
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white">{scannerResult.shoeName}</h4>
                        <span className="text-xs text-zinc-400">
                          {scannerResult.brand} • Taglia: <strong>{scannerResult.size}</strong>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-mono font-bold text-white">€ {scannerResult.price?.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Vuoi aggiungere carico a magazzino?</span>
                      <button
                        onClick={() => {
                          playLaserBeep();
                          alert(`Carico di +1 paio per "${scannerResult.shoeName}" (TG ${scannerResult.size}) registrato con successo!`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#00FF66] text-black text-xs font-bold hover:bg-[#00FF66]/90 transition-colors"
                      >
                        +1 Carico a Magazzino
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: AI Shoe Box Label Vision Explainer */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>Riconoscimento OCR Etichette Scatola</span>
                </div>
                <h4 className="text-lg font-bold text-white">Scatta una foto alla scatola di scarpe</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Quando arrivano nuovi scatoloni dai fornitori (Nero Giardini, Hogan, Premiata...), il commesso 
                  può semplicemente <strong>inquadrare l'etichetta frontale della scatola</strong> col telefono.
                </p>

                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 text-xs text-zinc-300">
                  <span className="font-bold text-white block">L'IA estrae automaticamente:</span>
                  <p>✓ Marchio (es. <em>Nero Giardini</em>)</p>
                  <p>✓ Codice Modello (es. <em>A111640D</em>)</p>
                  <p>✓ Misura Europea (es. <em>TG 38</em>)</p>
                  <p>✓ Colore stampato (es. <em>Nero Spazzolato</em>)</p>
                  <p>✓ Codice a barre EAN impresso</p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/dashboard/scanner"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 font-bold text-xs transition-colors"
                  >
                    <span>Apri Scanner con Fotocamera Live</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: CASSA POS RAPIDA & VENDITA CON SCARICO SCORTE */}
        {/* ============================================================ */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Left Column: POS Touch Screen Simulator */}
            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono text-[#00FF66] uppercase block">Vendite & Cassa Touch</span>
                    <h3 className="text-xl font-bold text-white">Registratore Cassa & Scarico Immediato</h3>
                  </div>
                  <Link
                    href="/dashboard/sales"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 text-xs text-zinc-200 hover:text-white border border-white/10"
                  >
                    <span>Apri Schermata POS Completa</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Quick Add Product Chips */}
                <div>
                  <span className="text-xs font-mono text-zinc-400 block mb-2">Aggiungi calzatura al carrello con 1 tap:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SHOE_SAMPLES.slice(0, 3).map((shoe) => (
                      <button
                        key={shoe.id}
                        onClick={() => {
                          playLaserBeep();
                          setPosCart([...posCart, { name: shoe.name, size: '42', price: shoe.price, qty: 1 }]);
                          setPosSaleComplete(false);
                        }}
                        className="p-3 rounded-2xl bg-black/60 hover:bg-zinc-800 border border-white/5 text-left transition-colors"
                      >
                        <span className="text-xs font-bold text-white block truncate">{shoe.name}</span>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                          <span>TG 42</span>
                          <span className="font-mono text-[#00FF66] font-bold">€ {shoe.price.toFixed(2)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cart View */}
                <div className="p-4 rounded-2xl bg-black/80 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-800 pb-2">
                    <span>Articolo nel Carrello</span>
                    <span>Subtotale</span>
                  </div>

                  {posCart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <span className="font-bold text-white block">{item.name}</span>
                        <span className="text-xs text-zinc-400">Taglia: <strong>{item.size}</strong> • Qty: {item.qty}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white">€ {(item.price * item.qty).toFixed(2)}</span>
                        <button
                          onClick={() => setPosCart(posCart.filter((_, i) => i !== idx))}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          Rimuovi
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Customer Link & Discount Controls */}
                  <div className="pt-3 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-400 block mb-1">Cliente Fidelity Associato:</span>
                      <select
                        value={posCustomer}
                        onChange={(e) => setPosCustomer(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FF66]"
                      >
                        <option value="Marco Esposito (VIP 140 pt)">Marco Esposito (Fidelity 140 pt)</option>
                        <option value="Elena De Luca (VIP 90 pt)">Elena De Luca (Fidelity 90 pt)</option>
                        <option value="Vincenzo Rossi (VIP 210 pt)">Vincenzo Rossi (Fidelity 210 pt)</option>
                        <option value="Scontrino Anonimo">Cliente Anonimo al Banco</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-zinc-400 block mb-1">Sconto Promozionale:</span>
                      <div className="flex items-center gap-1.5">
                        {[0, 10, 15, 20].map((d) => (
                          <button
                            key={d}
                            onClick={() => setPosDiscount(d)}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition-colors ${
                              posDiscount === d
                                ? 'bg-white text-black border-white'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                            }`}
                          >
                            {d === 0 ? '0%' : `-${d}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Totals Summary */}
                  <div className="pt-3 border-t border-zinc-800 space-y-1 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Totale Listino:</span>
                      <span className="font-mono">€ {posSubtotal.toFixed(2)}</span>
                    </div>
                    {posDiscount > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Sconto Fedeltà ({posDiscount}%):</span>
                        <span className="font-mono">- € {posDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-zinc-800">
                      <span>Totale da Pagare:</span>
                      <span className="font-mono text-xl text-[#00FF66]">€ {posTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Complete Sale Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        playLaserBeep();
                        setPosSaleComplete(true);
                      }}
                      disabled={posCart.length === 0}
                      className="w-full py-3 rounded-2xl bg-[#00FF66] text-black font-extrabold text-sm hover:bg-[#00FF66]/90 transition-all shadow-lg shadow-[#00FF66]/10 disabled:opacity-50"
                    >
                      Emetti Scontrino & Scarica Scorta
                    </button>
                  </div>

                  {posSaleComplete && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Scontrino registrato! Giacenza magazzino aggiornata in tempo reale.</span>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400">#BOR-0142</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: POS Explainer */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
                <span className="text-xs font-mono text-[#00FF66] uppercase block">Integrazione Totale</span>
                <h4 className="text-lg font-bold text-white">Niente più doppie scritture</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Ogni volta che vendi un paio in negozio, il sistema scarica all'istante la taglia venduta:
                </p>

                <div className="space-y-2 text-xs text-zinc-300">
                  <p>1. Se un commesso cerca la taglia sul telefono, vedrà subito la scorta aggiornata.</p>
                  <p>2. Se il cliente apre il catalogo dall'NFC, non vedrà scarpe non disponibili.</p>
                  <p>3. Il titolare vede la marginalità reale dell'operazione all'istante.</p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/dashboard/sales"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
                  >
                    <span>Apri Schermata Cassa</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: CONTROL ROOM TITOLARE (KPI, MARGINI, NOTIFICHE) */}
        {/* ============================================================ */}
        {activeTab === 'controlroom' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-[#00FF66] uppercase block">Control Room Titolare</span>
                  <h3 className="text-xl font-bold text-white">Telemetria Finanziaria & Scorte Borrelli Calzature</h3>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00FF66] text-black font-bold text-xs hover:bg-[#00FF66]/90 transition-colors"
                >
                  <span>Apri Dashboard Ufficiale</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 4 Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-zinc-400 block">Fatturato Ultimi 7 Giorni</span>
                  <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white">€ 6.480,00</span>
                  <span className="text-[10px] text-emerald-400 block">+14.2% rispetto a settimana scorsa</span>
                </div>

                <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-zinc-400 block">Margine Lordo Reale</span>
                  <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[#00FF66]">€ 3.512,18</span>
                  <span className="text-[10px] text-[#00FF66] block">54.2% marginalità netta sui capi venduti</span>
                </div>

                <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-zinc-400 block">Scontrino Medio</span>
                  <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white">€ 165,40</span>
                  <span className="text-[10px] text-zinc-400 block">39 paia totali transate</span>
                </div>

                <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-zinc-400 block">Allerte Sotto Scorta</span>
                  <span className="text-2xl sm:text-3xl font-mono font-extrabold text-amber-400">4 Modelli</span>
                  <span className="text-[10px] text-amber-300 block">Riordino fornitore consigliato</span>
                </div>
              </div>

              {/* Low Stock Alerts Table for Shoe Store */}
              <div className="p-5 rounded-2xl bg-black/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Numerazioni Critiche da Riordinare (Segnalate dall'IA)</span>
                  </h4>
                  <Link
                    href="/dashboard/inventory"
                    className="text-xs text-[#00FF66] hover:underline"
                  >
                    Vedi tutto l'inventario →
                  </Link>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Mocassino Artigianale Borrelli - TG 44</span>
                      <span className="text-zinc-400">Fornitore: Calzaturificio Artigiano Campano</span>
                    </div>
                    <span className="font-mono text-amber-400 font-bold px-2 py-1 rounded bg-amber-500/20">
                      1 PAIO RIMASTO
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Mocassino Artigianale Borrelli - TG 45</span>
                      <span className="text-zinc-400">Fornitore: Calzaturificio Artigiano Campano</span>
                    </div>
                    <span className="font-mono text-rose-400 font-bold px-2 py-1 rounded bg-rose-500/20">
                      ESAURITO (0 pz)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Hogan H-Stripes Platform - TG 41</span>
                      <span className="text-zinc-400">Fornitore: Premiata Luxury Footwear</span>
                    </div>
                    <span className="font-mono text-amber-400 font-bold px-2 py-1 rounded bg-amber-500/20">
                      1 PAIO RIMASTO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Presentation Cheat Sheet Floating Card (for Genny) */}
      <aside className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-50">
        <div className="p-4 rounded-2xl bg-[#0e120f]/95 backdrop-blur-xl border border-[#00FF66]/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00FF66]/20 border border-[#00FF66]/40 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-[#00FF66]" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Pronto per Borrelli Calzature
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Account Titolare: <code className="text-white font-mono">enzoborrelli73@gmail.com</code> • Cassa: <code className="text-[#00FF66] font-mono">{deviceCode}</code>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/hub/${deviceCode}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-white/10 transition-colors"
            >
              Hub Smartphone
            </a>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-[#00FF66] text-black text-xs font-bold hover:bg-[#00FF66]/90 transition-colors shadow-sm"
            >
              Dashboard Completa →
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore, useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import {
  Smartphone,
  Boxes,
  ScanLine,
  Receipt,
  BarChart3,
  ShieldCheck,
  Award,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Footprints,
  Search,
  Check,
  Copy,
  ShoppingBag,
  ArrowUpRight,
  Zap,
  AlertTriangle,
  Volume2,
  VolumeX,
  Cpu,
  X,
} from 'lucide-react';
import { useSimpleMode } from '@/lib/simple-mode';
import { ThemeToggle } from '@/components/theme-toggle';
import SimpleRetailERPView from '@/components/dashboard/SimpleRetailERPView';
import {
  SurfaceCard,
  StatusBadge,
  SegmentedControl,
  KpiCard,
  EmptyState,
  type SegmentedOption,
} from '@/components/ui';
import { formatItCurrency } from '@/lib/chart-theme';
import { cn } from '@/lib/cn';

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

const INITIAL_SHOE_SAMPLES: ShoeSample[] = [
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
type DemoInterfaceMode = 'control' | 'simple';

interface ScannerMatchResult {
  shoeName: string;
  brand: string;
  size: string;
  price: number;
  stock: number;
  barcode: string;
}

interface ToastNotification {
  title: string;
  detail: string;
}

const MODE_SWITCH_OPTIONS: ReadonlyArray<SegmentedOption<DemoInterfaceMode>> = [
  { value: 'control', label: 'Standard Control', icon: Cpu },
  { value: 'simple', label: 'Semplice ERP', icon: Boxes },
];

const DEMO_TABS: ReadonlyArray<{ id: DemoTab; label: string; icon: typeof Smartphone }> = [
  { id: 'touchpoint', label: '1. Touchpoint NFC/QR', icon: Smartphone },
  { id: 'stockcheck', label: '2. Verifica Taglie', icon: Search },
  { id: 'scanner', label: '3. Scanner IA Scatole', icon: ScanLine },
  { id: 'pos', label: '4. Cassa POS', icon: Receipt },
  { id: 'controlroom', label: '5. Control Room', icon: BarChart3 },
];

const subscribeEmpty = () => () => {};

export default function RetailDemoPage() {
  const { isSimple, setSimple } = useSimpleMode();
  const posCustomerId = useId();
  const [activeTab, setActiveTab] = useState<DemoTab>('touchpoint');
  const origin = useSyncExternalStore(
    subscribeEmpty,
    () => window.location.origin,
    () => 'https://rivo-app-ten.vercel.app'
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [showPresenterStrip, setShowPresenterStrip] = useState(true);

  // Stock samples state (supports live increment in scanner tab)
  const [shoeSamples, setShoeSamples] = useState<ShoeSample[]>(INITIAL_SHOE_SAMPLES);

  // Stock check interactive simulation state
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [selectedShoeId, setSelectedShoeId] = useState<string>(INITIAL_SHOE_SAMPLES[0].id);

  // Scanner interactive simulator state
  const [simulatedCode, setSimulatedCode] = useState('8012345001426');
  const [scannerResult, setScannerResult] = useState<ScannerMatchResult | null>(null);
  const [scannerScanning, setScannerScanning] = useState(false);

  // POS simulation state
  const [posCart, setPosCart] = useState<
    Array<{ name: string; size: string; price: number; qty: number }>
  >([{ name: 'Mocassino Artigianale Borrelli', size: '42', price: 149.00, qty: 1 }]);
  const [posCustomer, setPosCustomer] = useState('Marco Esposito (VIP 140 pt)');
  const [posDiscount, setPosDiscount] = useState(10);
  const [posSaleComplete, setPosSaleComplete] = useState(false);

  const deviceCode = 'RIVO-FMT1GW';
  const hubRelativeUrl = `/hub/${deviceCode}`;

  const selectedShoe = useMemo(
    () => shoeSamples.find((s) => s.id === selectedShoeId) ?? shoeSamples[0],
    [shoeSamples, selectedShoeId]
  );

  const tapUrl = `${origin}/t/${deviceCode}`;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(tapUrl, {
      margin: 1,
      width: 280,
      color: {
        dark: '#BFFF00',
        light: '#09090B',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [tapUrl]);

  // Auto-dismiss non-blocking toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const triggerHaptic = useCallback((duration = 12) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(duration);
      } catch {}
    }
  }, []);

  // Audio effect
  const playLaserBeep = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
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

  const copyToClipboard = async (text: string) => {
    triggerHaptic(10);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedLink(true);
      setToast({
        title: 'Link Touchpoint copiato',
        detail: text,
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setToast({
        title: 'Copia manuale richiesta',
        detail: text,
      });
    }
  };

  // Run simulated scan
  const triggerSimulatedScan = (barcode: string) => {
    triggerHaptic(16);
    setSimulatedCode(barcode);
    setScannerScanning(true);
    playLaserBeep();
    setTimeout(() => {
      setScannerScanning(false);
      const match = shoeSamples
        .flatMap((s) =>
          s.sizes.map((sz) => ({
            ...sz,
            shoeName: s.name,
            brand: s.brand,
            price: s.price,
          }))
        )
        .find((x) => x.barcode === barcode);

      if (match) {
        setScannerResult({
          shoeName: match.shoeName,
          brand: match.brand,
          size: match.size,
          price: match.price,
          stock: match.stock,
          barcode: match.barcode,
        });
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

  const handleRegisterStockLoad = (barcode: string, shoeName: string, size: string) => {
    triggerHaptic(18);
    playLaserBeep();

    setShoeSamples((prev) =>
      prev.map((shoe) => ({
        ...shoe,
        sizes: shoe.sizes.map((sz) =>
          sz.barcode === barcode
            ? {
                ...sz,
                stock: sz.stock + 1,
                out: false,
                low: sz.stock + 1 <= 2,
              }
            : sz
        ),
      }))
    );

    setScannerResult((prev) =>
      prev && prev.barcode === barcode ? { ...prev, stock: prev.stock + 1 } : prev
    );

    setToast({
      title: 'Carico magazzino registrato (+1 pz)',
      detail: `${shoeName} — TG ${size} aggiornato in tempo reale.`,
    });
  };

  const filteredShoes = useMemo(() => {
    const q = stockSearchQuery.trim().toLowerCase();
    if (!q) return shoeSamples;
    return shoeSamples.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        s.sizes.some((sz) => sz.size === q || sz.barcode.includes(q))
    );
  }, [shoeSamples, stockSearchQuery]);

  const posSubtotal = posCart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const posDiscountAmount = (posSubtotal * posDiscount) / 100;
  const posTotal = posSubtotal - posDiscountAmount;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] font-sans pb-16 overflow-x-clip">
      {/* Non-blocking Top-Right Notification Toast (never overlaps bottom interactive cards) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-[var(--rivo-volt-border)] bg-[var(--bg-surface)] p-3.5 shadow-xl flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)]">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--text-primary)]">{toast.title}</p>
              <p className="mt-0.5 text-[11px] text-[var(--text-secondary)] break-words">
                {toast.detail}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Chiudi notifica"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Top Sticky Command Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          {/* Brand + Live Demo Context */}
          <div className="flex items-center justify-between gap-2.5 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <div className="w-8 h-8 rounded-lg bg-[#09090B] border border-[#22242A] flex items-center justify-center p-1.5">
                  <Image
                    src="/brand/rivo-icon.png"
                    alt="RIVO"
                    width={20}
                    height={20}
                    className="rounded-xs"
                  />
                </div>
                <span className="hidden xl:inline font-mono text-[11px] tracking-[0.12em] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors uppercase whitespace-nowrap">
                  RIVO / RETAIL
                </span>
              </Link>
              <span className="hidden xl:inline text-[var(--border-strong)]" aria-hidden="true">
                /
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-display font-bold text-sm tracking-tight text-[var(--text-primary)] truncate">
                  Borrelli Calzature
                </span>
                <StatusBadge
                  tone="volt"
                  variant="hardware"
                  size="sm"
                  dot
                  pulse
                  className="whitespace-nowrap shrink-0"
                >
                  LIVE DEMO
                </StatusBadge>
              </div>
            </div>

            {/* Mobile right quick utility icons */}
            <div className="flex items-center gap-1.5 lg:hidden shrink-0">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-label={soundEnabled ? 'Disattiva effetti audio' : 'Attiva effetti audio'}
                className="inline-flex min-h-[38px] max-sm:min-h-[44px] min-w-[38px] max-sm:min-w-[44px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <VolumeX className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Interactive Mode Switcher + Theme + Sound + CTA */}
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-between lg:justify-end gap-2 shrink-0">
            <SegmentedControl<DemoInterfaceMode>
              options={MODE_SWITCH_OPTIONS}
              value={isSimple ? 'simple' : 'control'}
              onChange={(mode) => {
                triggerHaptic(10);
                setSimple(mode === 'simple');
              }}
              ariaLabel="Modalità interfaccia demo"
              size="sm"
              className="shrink-0"
            />

            <div className="hidden lg:flex items-center gap-1.5 shrink-0">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-label={soundEnabled ? 'Disattiva effetti audio' : 'Attiva effetti audio'}
                title={soundEnabled ? 'Disattiva effetti audio' : 'Attiva effetti audio'}
                className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <VolumeX className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex min-h-[38px] max-sm:min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-3.5 text-xs font-bold text-[var(--rivo-volt-ink)] transition-colors whitespace-nowrap shrink-0"
            >
              <span className="sm:hidden">Gestionale</span>
              <span className="hidden sm:inline">Accedi al Gestionale</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Non-Overlapping Inline Presenter Reference Strip */}
      {showPresenterStrip && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)]">
                <Zap className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Pronto per Borrelli Calzature
                  </span>
                  <StatusBadge tone="operational" size="sm">
                    Sandbox Interattiva
                  </StatusBadge>
                </div>
                <div className="mt-1 inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[var(--text-secondary)]">
                  <span className="inline-flex flex-wrap items-center gap-1">
                    <span>Account Titolare:</span>
                    <code className="font-mono text-[var(--text-primary)] break-all">
                      enzoborrelli73@gmail.com
                    </code>
                  </span>
                  <span className="hidden sm:inline text-[var(--text-muted)]" aria-hidden="true">
                    •
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-0.5 whitespace-nowrap">
                    <span className="text-[var(--text-muted)]">Cassa:</span>
                    <code className="font-mono font-semibold text-[var(--rivo-volt-text)]">
                      {deviceCode}
                    </code>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href={hubRelativeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[36px] max-sm:min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] px-3 text-xs font-semibold text-[var(--text-primary)] transition-colors"
              >
                <span>Hub Smartphone</span>
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={() => setShowPresenterStrip(false)}
                aria-label="Nascondi barra riepilogo demo"
                className="inline-flex min-h-[36px] max-sm:min-h-[44px] min-w-[36px] max-sm:min-w-[44px] items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isSimple ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
          <SimpleRetailERPView
            orgName="Borrelli Calzature"
            onExitSimpleMode={() => setSimple(false)}
          />
        </main>
      ) : (
        <>
          {/* Hero Presentation Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-6">
            <SurfaceCard variant="default" padding="lg" radius="2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2.5 max-w-2xl min-w-0">
                  <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--rivo-volt-text)] font-semibold">
                    <Footprints className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <span>Piattaforma Operativa Retail • Calzature &amp; Accessori</span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-[-0.03em] text-[var(--text-primary)] leading-tight text-balance">
                    Esperienza RIVO per Borrelli Calzature
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed text-pretty">
                    Dimostrazione interattiva dei 5 pilastri retail: dal touchpoint NFC sul banco
                    cassa per recensioni e catalogo, fino alla verifica istantanea taglie, scanner
                    scatole e punto cassa veloce con scarico scorte.
                  </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 text-center">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      Catalogo Attivo
                    </span>
                    <span className="mt-1 block font-mono tabular-nums text-lg font-bold text-[var(--text-primary)]">
                      10 Modelli
                    </span>
                    <span className="block font-mono text-[10px] text-[var(--rivo-volt-text)]">
                      40 Numerazioni
                    </span>
                  </div>

                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 text-center">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      Margine Medio
                    </span>
                    <span className="mt-1 block font-mono tabular-nums text-lg font-bold text-[var(--rivo-volt-text)]">
                      54.2%
                    </span>
                    <span className="block text-[10px] text-[var(--text-secondary)]">
                      Ricarico Reale
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 text-center">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      Touchpoint Cassa
                    </span>
                    <span className="mt-1 block font-mono text-xs font-bold text-[var(--text-primary)] truncate">
                      {deviceCode}
                    </span>
                    <div className="mt-1 flex justify-center">
                      <StatusBadge tone="operational" size="sm" dot>
                        NFC + QR Live
                      </StatusBadge>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5 Interactive Scenario Tabs (single horizontal bar >=1024px, clean wrap <1024px) */}
              <div
                role="tablist"
                aria-label="Scenari dimostrativi RIVO Retail"
                className="mt-6 pt-5 border-t border-[var(--border-subtle)] flex flex-wrap lg:flex-nowrap items-center gap-1.5 xl:gap-2"
              >
                {DEMO_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        triggerHaptic(8);
                        setActiveTab(tab.id);
                      }}
                      className={cn(
                        'inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border px-2.5 xl:px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-[background-color,border-color,color] duration-[180ms] cursor-pointer',
                        active
                          ? 'bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] border-transparent font-bold'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </SurfaceCard>
          </section>

          {/* Main Dynamic Interactive Showcase Stage */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* ============================================================ */}
            {/* TAB 1: TOUCHPOINT CLIENTE (NFC, QR, REVIEW SHIELD, CATALOG) */}
            {/* ============================================================ */}
            {activeTab === 'touchpoint' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Context & Real QR Code */}
                <div className="lg:col-span-5 min-w-0">
                  <SurfaceCard
                    padding="lg"
                    radius="2xl"
                    header={{
                      eyebrow: 'COSA MOSTRARE AL TITOLARE',
                      title: 'Puck NFC fisico sul banco cassa',
                      icon: Zap,
                    }}
                  >
                    <div className="space-y-5">
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                        Quando il cliente conclude un acquisto o attende al banco, avvicina lo
                        smartphone al puck NFC oppure inquadra il QR Code. Non richiede alcuna app
                        da scaricare.
                      </p>

                      <div className="space-y-2.5">
                        <div className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                          <ShieldCheck
                            className="w-4 h-4 text-[var(--rivo-volt-text)] shrink-0 mt-0.5"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <div>
                            <span className="text-xs font-bold text-[var(--text-primary)] block">
                              Review Shield Google 5 Stelle
                            </span>
                            <span className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                              Con 5 stelle il cliente accede direttamente a Google Maps di Borrelli
                              Calzature. Con 1–3 stelle invia un feedback privato al titolare.
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                          <ShoppingBag
                            className="w-4 h-4 text-[var(--accent-warning-text)] shrink-0 mt-0.5"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <div>
                            <span className="text-xs font-bold text-[var(--text-primary)] block">
                              Catalogo Digitale con Giacenze Live
                            </span>
                            <span className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                              I clienti sfogliano i modelli disponibili, i prezzi ufficiali e le
                              numerazioni effettivamente in negozio.
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                          <Award
                            className="w-4 h-4 text-[var(--accent-telemetry-text)] shrink-0 mt-0.5"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <div>
                            <span className="text-xs font-bold text-[var(--text-primary)] block">
                              Fidelity Pass &amp; Timbri Digitali
                            </span>
                            <span className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                              10 timbri digitali per ottenere il 15% di sconto. Zero tessere
                              cartacee da stampare o smarrire.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Live QR Code Box */}
                      <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center gap-4">
                        {qrDataUrl ? (
                          <div className="p-2.5 bg-[#09090B] border border-[#22242A] rounded-xl shrink-0">
                            <Image
                              src={qrDataUrl}
                              alt="QR Code Borrelli Calzature"
                              width={128}
                              height={128}
                              unoptimized
                              className="w-32 h-32 rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-xl bg-[var(--bg-elevated)] animate-pulse shrink-0" />
                        )}

                        <div className="space-y-2 text-center sm:text-left min-w-0">
                          <span className="text-xs font-bold text-[var(--text-primary)] block">
                            Fai inquadrare lo schermo al cliente
                          </span>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-normal">
                            Inquadra questo QR col telefono per testare in tempo reale l&apos;apertura
                            istantanea dell&apos;Hub cliente.
                          </p>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(tapUrl)}
                              className="inline-flex min-h-[38px] max-sm:min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] px-3 text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
                            >
                              {copiedLink ? (
                                <Check
                                  className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]"
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />
                              ) : (
                                <Copy className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                              )}
                              <span>{copiedLink ? 'Copiato' : 'Copia Link'}</span>
                            </button>

                            <a
                              href={hubRelativeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-[38px] max-sm:min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-3 text-xs font-bold text-[var(--rivo-volt-ink)] transition-colors"
                            >
                              <span>Apri Hub</span>
                              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SurfaceCard>
                </div>

                {/* Right Column: Live Smartphone Simulator */}
                <div className="lg:col-span-7 flex justify-center min-w-0">
                  <div className="w-full max-w-[358px] sm:max-w-[380px] rounded-[40px] p-3 bg-[#09090B] border-2 border-[#32353E] shadow-2xl relative">
                    <div className="w-24 h-3.5 bg-[#18191E] rounded-full mx-auto mb-2.5" />
                    <div className="w-full h-[600px] sm:h-[660px] rounded-[30px] overflow-hidden bg-black border border-[#22242A] relative">
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 min-w-0">
                  <SurfaceCard
                    padding="lg"
                    radius="2xl"
                    header={{
                      eyebrow: 'STRUMENTO COMMESSI IN NEGOZIO',
                      title: 'Verifica Giacenza Taglie in Tempo Reale',
                      icon: Search,
                      action: (
                        <Link
                          href="/dashboard/stock-check"
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] px-3 text-xs font-semibold text-[var(--text-primary)]"
                        >
                          <span>Schermata Intera</span>
                          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                      ),
                    }}
                  >
                    <div className="space-y-4">
                      {/* Instant Search Bar */}
                      <div className="relative">
                        <Search
                          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <input
                          type="text"
                          aria-label="Cerca modello, brand o taglia disponibile"
                          value={stockSearchQuery}
                          onChange={(e) => setStockSearchQuery(e.target.value)}
                          placeholder="Digita modello, brand (Hogan, Premiata…) o taglia (es. 42)…"
                          spellCheck={false}
                          autoComplete="off"
                          className="w-full min-h-[44px] pl-10 pr-20 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                        />
                        {stockSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setStockSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                          >
                            Azzera
                          </button>
                        )}
                      </div>

                      {/* Quick Size Filter Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[var(--text-muted)] font-mono pr-1">
                          Filtro rapido taglia:
                        </span>
                        {['37', '38', '40', '41', '42', '43', '44', '45'].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setStockSearchQuery(size)}
                            className={cn(
                              'min-h-[34px] max-sm:min-h-[44px] min-w-[36px] px-2.5 rounded-lg border font-mono tabular-nums font-semibold transition-colors cursor-pointer',
                              stockSearchQuery === size
                                ? 'bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] border-transparent font-bold'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>

                      {/* Shoe Cards with Size Matrix */}
                      {filteredShoes.length === 0 ? (
                        <EmptyState
                          icon={Search}
                          title="Nessuna calzatura trovata"
                          description="Nessun modello o numerazione corrisponde alla ricerca impostata."
                          primaryAction={{
                            label: 'Mostra tutto il catalogo',
                            onClick: () => setStockSearchQuery(''),
                          }}
                          compact
                        />
                      ) : (
                        <div className="space-y-3 pt-1">
                          {filteredShoes.map((shoe) => {
                            const totalPieces = shoe.sizes.reduce((sum, s) => sum + s.stock, 0);
                            const isSelected = selectedShoe.id === shoe.id;

                            return (
                              <button
                                key={shoe.id}
                                type="button"
                                onClick={() => setSelectedShoeId(shoe.id)}
                                className={cn(
                                  'w-full text-left p-4 rounded-xl border transition-colors cursor-pointer',
                                  isSelected
                                    ? 'bg-[var(--bg-elevated)] border-[var(--rivo-volt-border)]'
                                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                                )}
                              >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-mono text-[10px] font-bold uppercase text-[var(--rivo-volt-text)]">
                                        {shoe.brand}
                                      </span>
                                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                                        {shoe.sku}
                                      </span>
                                    </div>
                                    <h4 className="font-display text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">
                                      {shoe.name}
                                    </h4>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="font-mono tabular-nums text-base font-bold text-[var(--text-primary)] block">
                                      {formatItCurrency(shoe.price)}
                                    </span>
                                    <StatusBadge tone="operational" size="sm">
                                      {totalPieces} paia in negozio
                                    </StatusBadge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                  {shoe.sizes.map((sz) => (
                                    <div
                                      key={sz.size}
                                      className={cn(
                                        'p-2 rounded-lg border text-center',
                                        sz.out
                                          ? 'bg-[var(--accent-critical-bg)] border-[var(--accent-critical-border)] opacity-75'
                                          : sz.low
                                          ? 'bg-[var(--accent-warning-bg)] border-[var(--accent-warning-border)]'
                                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)]'
                                      )}
                                    >
                                      <span className="text-xs font-mono tabular-nums font-bold text-[var(--text-primary)] block">
                                        TG {sz.size}
                                      </span>
                                      <span
                                        className={cn(
                                          'text-[10px] font-mono tabular-nums font-bold block mt-0.5',
                                          sz.out
                                            ? 'text-[var(--accent-critical-text)]'
                                            : sz.low
                                            ? 'text-[var(--accent-warning-text)]'
                                            : 'text-[var(--rivo-volt-text)]'
                                        )}
                                      >
                                        {sz.out
                                          ? 'Esaurito'
                                          : sz.stock === 1
                                          ? '1 rimasto'
                                          : `${sz.stock} paia`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </SurfaceCard>
                </div>

                {/* Right Column: Focus Panel */}
                <div className="lg:col-span-4 min-w-0">
                  <SurfaceCard
                    padding="lg"
                    radius="2xl"
                    header={{
                      eyebrow: 'IL VALORE PER IL NEGOZIO',
                      title: 'Zero corse a vuoto in magazzino',
                      icon: Boxes,
                    }}
                  >
                    <div className="space-y-4">
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Quando un cliente chiede al banco la disponibilità di una taglia, il
                        personale verifica in 1 secondo sul cellulare l&apos;esatta giacenza di
                        negozio e deposito senza lasciare il cliente.
                      </p>

                      <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                          Articolo Selezionato
                        </span>
                        <p className="font-display text-sm font-bold text-[var(--rivo-volt-text)]">
                          {selectedShoe.name}
                        </p>
                        <div className="text-xs text-[var(--text-secondary)] space-y-1 pt-1 font-mono tabular-nums">
                          <p className="flex justify-between">
                            <span>Prezzo vendita:</span>
                            <strong className="text-[var(--text-primary)]">
                              {formatItCurrency(selectedShoe.price)}
                            </strong>
                          </p>
                          <p className="flex justify-between">
                            <span>Costo fornitore:</span>
                            <strong className="text-[var(--text-primary)]">
                              {formatItCurrency(selectedShoe.cost)}
                            </strong>
                          </p>
                          <p className="flex justify-between">
                            <span>Margine lordo:</span>
                            <strong className="text-[var(--accent-operational-text)]">
                              {selectedShoe.margin}%
                            </strong>
                          </p>
                        </div>
                      </div>

                      <Link
                        href="/dashboard/stock-check"
                        className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] font-bold text-xs transition-colors"
                      >
                        <span>Apri Verifica Taglie</span>
                        <ArrowRight className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                      </Link>
                    </div>
                  </SurfaceCard>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: SCANNER IA SCATOLE & BARCODE */}
            {/* ============================================================ */}
            {activeTab === 'scanner' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 min-w-0">
                  <SurfaceCard
                    padding="lg"
                    radius="2xl"
                    header={{
                      eyebrow: 'MAGAZZINO & CARICO MERCE',
                      title: 'Scanner Codici a Barre & Visione IA',
                      icon: ScanLine,
                      action: (
                        <Link
                          href="/dashboard/scanner"
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] px-3 text-xs font-semibold text-[var(--text-primary)]"
                        >
                          <span>Apri Scanner Camera</span>
                          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                      ),
                    }}
                  >
                    <div className="space-y-5">
                      {/* Laser Scanning Frame Simulation (hardware dark sensor viewport) */}
                      <div className="relative rounded-xl h-56 bg-[#09090B] border border-[#22242A] flex flex-col items-center justify-center overflow-hidden">
                        <div
                          className={cn(
                            'absolute inset-x-6 h-0.5 bg-[#BFFF00] transition-transform duration-300',
                            scannerScanning ? 'translate-y-6' : '-translate-y-6'
                          )}
                        />
                        <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#BFFF00]" />
                        <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#BFFF00]" />
                        <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#BFFF00]" />
                        <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#BFFF00]" />

                        <ScanLine
                          className="w-10 h-10 text-[#BFFF00] mb-2"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span className="font-mono text-[11px] text-[#A1A1AA]">
                          Puntamento Laser Codice EAN-13
                        </span>
                        <span className="font-mono tabular-nums text-sm font-bold text-[#F4F4F6] mt-1 tracking-widest">
                          {simulatedCode}
                        </span>
                      </div>

                      {/* Sample Barcode Triggers */}
                      <div>
                        <span className="text-xs font-mono text-[var(--text-muted)] block mb-2">
                          Simula scansione con un tap:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => triggerSimulatedScan('8012345001426')}
                            className="p-3 min-h-[56px] rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-left border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                          >
                            <span className="text-xs font-bold text-[var(--text-primary)] block">
                              Mocassino TG 42
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                              8012345001426
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerSimulatedScan('8033984110436')}
                            className="p-3 min-h-[56px] rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-left border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                          >
                            <span className="text-xs font-bold text-[var(--text-primary)] block">
                              Premiata Mick TG 43
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                              8033984110436
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerSimulatedScan('8059345010382')}
                            className="p-3 min-h-[56px] rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-left border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                          >
                            <span className="text-xs font-bold text-[var(--text-primary)] block">
                              Hogan Platform TG 38
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                              8059345010382
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Scanner Result Card */}
                      {scannerResult && (
                        <div className="p-4 rounded-xl bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className="w-4 h-4 text-[var(--rivo-volt-text)] shrink-0"
                                strokeWidth={1.75}
                                aria-hidden="true"
                              />
                              <span className="text-xs font-bold text-[var(--text-primary)]">
                                Articolo Riconosciuto Istantaneamente
                              </span>
                            </div>
                            <StatusBadge tone="volt" size="sm">
                              Stock Attuale: {scannerResult.stock} pz
                            </StatusBadge>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h4 className="font-display text-sm font-bold text-[var(--text-primary)]">
                                {scannerResult.shoeName}
                              </h4>
                              <span className="text-xs text-[var(--text-secondary)]">
                                {scannerResult.brand} • Taglia:{' '}
                                <strong className="text-[var(--text-primary)]">
                                  {scannerResult.size}
                                </strong>
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-base font-mono tabular-nums font-bold text-[var(--text-primary)]">
                                {formatItCurrency(scannerResult.price)}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-[var(--rivo-volt-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs text-[var(--text-secondary)]">
                              Vuoi aggiungere carico a magazzino?
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRegisterStockLoad(
                                  scannerResult.barcode,
                                  scannerResult.shoeName,
                                  scannerResult.size
                                )
                              }
                              className="min-h-[38px] max-sm:min-h-[44px] px-3.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold transition-colors cursor-pointer"
                            >
                              +1 Carico a Magazzino
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </SurfaceCard>
                </div>

                {/* Right Column: OCR Box Label Vision Explainer */}
                <div className="lg:col-span-5 min-w-0">
                  <SurfaceCard
                    padding="lg"
                    radius="2xl"
                    header={{
                      eyebrow: 'RICONOSCIMENTO OCR ETICHETTE SCATOLA',
                      title: 'Scatta una foto alla scatola di scarpe',
                      icon: Cpu,
                    }}
                  >
                    <div className="space-y-4">
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Quando arrivano nuovi colli dai fornitori (Nero Giardini, Hogan, Premiata),
                        il commesso inquadra semplicemente l&apos;etichetta frontale della scatola
                        col telefono.
                      </p>

                      <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2 text-xs text-[var(--text-secondary)]">
                        <span className="font-bold text-[var(--text-primary)] block">
                          Il motore estrae automaticamente:
                        </span>
                        {[
                          'Marchio (es. Nero Giardini)',
                          'Codice Modello (es. A111640D)',
                          'Misura Europea (es. TG 38)',
                          'Colore stampato (es. Nero Spazzolato)',
                          'Codice a barre EAN impresso',
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-2">
                            <Check
                              className="w-3.5 h-3.5 text-[var(--rivo-volt-text)] shrink-0"
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>

                      <Link
                        href="/dashboard/scanner"
                        className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] font-bold text-xs transition-colors"
                      >
                        <span>Apri Scanner con Fotocamera Live</span>
                        <ArrowRight className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                      </Link>
                    </div>
                  </SurfaceCard>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 4: CASSA POS RAPIDA & VENDITA CON SCARICO SCORTE */}
            {/* ============================================================ */}
            {activeTab === 'pos' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 min-w-0">
                  <SurfaceCard
                    padding="lg"
                    radius="2xl"
                    header={{
                      eyebrow: 'VENDITE & CASSA TOUCH',
                      title: 'Registratore Cassa & Scarico Immediato',
                      icon: Receipt,
                      action: (
                        <Link
                          href="/dashboard/sales"
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] px-3 text-xs font-semibold text-[var(--text-primary)]"
                        >
                          <span>Schermata POS</span>
                          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                      ),
                    }}
                  >
                    <div className="space-y-5">
                      {/* Quick Add Product Chips */}
                      <div>
                        <span className="text-xs font-mono text-[var(--text-muted)] block mb-2">
                          Aggiungi calzatura al carrello con 1 tap:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {shoeSamples.slice(0, 3).map((shoe) => (
                            <button
                              key={shoe.id}
                              type="button"
                              onClick={() => {
                                triggerHaptic(10);
                                playLaserBeep();
                                setPosCart([
                                  ...posCart,
                                  { name: shoe.name, size: '42', price: shoe.price, qty: 1 },
                                ]);
                                setPosSaleComplete(false);
                              }}
                              className="p-3 min-h-[60px] rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-left transition-colors cursor-pointer"
                            >
                              <span className="text-xs font-bold text-[var(--text-primary)] block truncate">
                                {shoe.name}
                              </span>
                              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mt-1">
                                <span>TG 42</span>
                                <span className="font-mono tabular-nums text-[var(--rivo-volt-text)] font-bold">
                                  {formatItCurrency(shoe.price)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cart View */}
                      <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">
                          <span>Articolo nel Carrello</span>
                          <span>Subtotale</span>
                        </div>

                        {posCart.length === 0 ? (
                          <p className="py-4 text-center text-xs text-[var(--text-muted)]">
                            Carrello vuoto. Tocca un modello sopra per aggiungerlo alla vendita.
                          </p>
                        ) : (
                          posCart.map((item, idx) => (
                            <div
                              key={`${item.name}-${idx}`}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <div className="min-w-0">
                                <span className="font-semibold text-[var(--text-primary)] block truncate">
                                  {item.name}
                                </span>
                                <span className="text-xs text-[var(--text-secondary)] font-mono tabular-nums">
                                  Taglia: <strong>{item.size}</strong> • Qty: {item.qty}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono tabular-nums font-bold text-[var(--text-primary)]">
                                  {formatItCurrency(item.price * item.qty)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPosCart(posCart.filter((_, i) => i !== idx))
                                  }
                                  className="text-xs font-semibold text-[var(--accent-critical-text)] hover:underline cursor-pointer"
                                >
                                  Rimuovi
                                </button>
                              </div>
                            </div>
                          ))
                        )}

                        {/* Customer Link & Discount Controls */}
                        <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label
                              htmlFor={posCustomerId}
                              className="text-[var(--text-secondary)] block mb-1.5 font-medium"
                            >
                              Cliente Fidelity Associato
                            </label>
                            <select
                              id={posCustomerId}
                              value={posCustomer}
                              onChange={(e) => setPosCustomer(e.target.value)}
                              className="w-full min-h-[40px] max-sm:min-h-[44px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                            >
                              <option value="Marco Esposito (VIP 140 pt)">
                                Marco Esposito (Fidelity 140 pt)
                              </option>
                              <option value="Elena De Luca (VIP 90 pt)">
                                Elena De Luca (Fidelity 90 pt)
                              </option>
                              <option value="Vincenzo Rossi (VIP 210 pt)">
                                Vincenzo Rossi (Fidelity 210 pt)
                              </option>
                              <option value="Scontrino Anonimo">
                                Cliente Anonimo al Banco
                              </option>
                            </select>
                          </div>

                          <div>
                            <span className="text-[var(--text-secondary)] block mb-1.5 font-medium">
                              Sconto Promozionale
                            </span>
                            <div className="flex items-center gap-1.5">
                              {[0, 10, 15, 20].map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => setPosDiscount(d)}
                                  className={cn(
                                    'flex-1 min-h-[40px] max-sm:min-h-[44px] rounded-lg border text-xs font-mono tabular-nums font-bold transition-colors cursor-pointer',
                                    posDiscount === d
                                      ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-transparent'
                                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                                  )}
                                >
                                  {d === 0 ? '0%' : `-${d}%`}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Totals Summary */}
                        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5 text-xs">
                          <div className="flex justify-between text-[var(--text-secondary)]">
                            <span>Totale Listino:</span>
                            <span className="font-mono tabular-nums">
                              {formatItCurrency(posSubtotal)}
                            </span>
                          </div>
                          {posDiscount > 0 && (
                            <div className="flex justify-between text-[var(--accent-warning-text)]">
                              <span>Sconto Fedeltà ({posDiscount}%):</span>
                              <span className="font-mono tabular-nums">
                                - {formatItCurrency(posDiscountAmount)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-baseline text-base font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border-subtle)]">
                            <span>Totale da Pagare:</span>
                            <span className="font-mono tabular-nums text-xl text-[var(--rivo-volt-text)]">
                              {formatItCurrency(posTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Complete Sale Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(20);
                              playLaserBeep();
                              setPosSaleComplete(true);
                              setToast({
                                title: 'Scontrino emesso #BOR-0142',
                                detail: `Incasso ${formatItCurrency(posTotal)} • Giacenze aggiornate.`,
                              });
                            }}
                            disabled={posCart.length === 0}
                            className="w-full min-h-[44px] rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Emetti Scontrino &amp; Scarica Scorta
                          </button>
                        </div>

                        {posSaleComplete && (
                          <div
                            role="status"
                            aria-live="polite"
                            className="p-3.5 rounded-xl bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] text-xs flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                              <span className="font-semibold">
                                Scontrino registrato! Giacenza magazzino aggiornata in tempo reale.
                              </span>
                            </div>
                            <span className="font-mono text-[10px] shrink-0">#BOR-0142</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </SurfaceCard>
                </div>

                {/* Right Column: POS Explainer */}
                <div className="lg:col-span-4 min-w-0">
                  <SurfaceCard
                    padding="lg"
                    radius="2xl"
                    header={{
                      eyebrow: 'INTEGRAZIONE TOTALE',
                      title: 'Niente più doppie scritture',
                      icon: Receipt,
                    }}
                  >
                    <div className="space-y-4">
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Ogni volta che vendi un paio in negozio, il sistema scarica all&apos;istante
                        la taglia venduta su tutti i touchpoint:
                      </p>

                      <div className="space-y-2.5 text-xs text-[var(--text-secondary)]">
                        <p>
                          <strong className="font-mono text-[var(--rivo-volt-text)]">01.</strong>{' '}
                          Il commesso vede subito la scorta aggiornata dallo smartphone.
                        </p>
                        <p>
                          <strong className="font-mono text-[var(--rivo-volt-text)]">02.</strong>{' '}
                          Il catalogo cliente NFC nasconde in automatico le taglie esaurite.
                        </p>
                        <p>
                          <strong className="font-mono text-[var(--rivo-volt-text)]">03.</strong>{' '}
                          Il titolare monitora la marginalità reale di ogni transazione.
                        </p>
                      </div>

                      <Link
                        href="/dashboard/sales"
                        className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] font-bold text-xs transition-colors"
                      >
                        <span>Apri Schermata Cassa</span>
                        <ArrowRight className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                      </Link>
                    </div>
                  </SurfaceCard>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 5: CONTROL ROOM TITOLARE (KPI, MARGINI, NOTIFICHE) */}
            {/* ============================================================ */}
            {activeTab === 'controlroom' && (
              <SurfaceCard
                padding="lg"
                radius="2xl"
                header={{
                  eyebrow: 'CONTROL ROOM TITOLARE',
                  title: 'Telemetria Finanziaria & Scorte Borrelli Calzature',
                  icon: BarChart3,
                  action: (
                    <Link
                      href="/dashboard"
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-4 text-xs font-bold text-[var(--rivo-volt-ink)] transition-colors"
                    >
                      <span>Apri Dashboard Ufficiale</span>
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  ),
                }}
              >
                <div className="space-y-6">
                  {/* 4 Financial KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                      label="Fatturato Ultimi 7 Giorni"
                      value="€ 6.480,00"
                      tone="neutral"
                      delta={{
                        value: '+14.2%',
                        direction: 'up',
                        sentiment: 'positive',
                        label: 'rispetto a settimana scorsa',
                      }}
                    />

                    <KpiCard
                      label="Margine Lordo Reale"
                      value="€ 3.512,18"
                      tone="volt"
                      context="54.2% marginalità netta sui capi"
                    />

                    <KpiCard
                      label="Scontrino Medio"
                      value="€ 165,40"
                      tone="neutral"
                      context="39 paia totali transate"
                    />

                    <KpiCard
                      label="Allerte Sotto Scorta"
                      value="4 Modelli"
                      tone="warning"
                      context="Riordino fornitore consigliato"
                    />
                  </div>

                  {/* Low Stock Alerts List */}
                  <div className="p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-display text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <AlertTriangle
                          className="w-4 h-4 text-[var(--accent-warning-text)]"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span>Numerazioni Critiche da Riordinare</span>
                      </h4>
                      <Link
                        href="/dashboard/inventory"
                        className="text-xs font-semibold text-[var(--rivo-volt-text)] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Vedi tutto l&apos;inventario</span>
                        <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                      </Link>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-lg bg-[var(--accent-warning-bg)] border border-[var(--accent-warning-border)] flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[var(--text-primary)] block">
                            Mocassino Artigianale Borrelli — TG 44
                          </span>
                          <span className="text-[var(--text-secondary)]">
                            Fornitore: Calzaturificio Artigiano Campano
                          </span>
                        </div>
                        <StatusBadge tone="warning" size="md">
                          1 PAIO RIMASTO
                        </StatusBadge>
                      </div>

                      <div className="p-3 rounded-lg bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[var(--text-primary)] block">
                            Mocassino Artigianale Borrelli — TG 45
                          </span>
                          <span className="text-[var(--text-secondary)]">
                            Fornitore: Calzaturificio Artigiano Campano
                          </span>
                        </div>
                        <StatusBadge tone="critical" size="md">
                          ESAURITO (0 PZ)
                        </StatusBadge>
                      </div>

                      <div className="p-3 rounded-lg bg-[var(--accent-warning-bg)] border border-[var(--accent-warning-border)] flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[var(--text-primary)] block">
                            Hogan H-Stripes Platform — TG 41
                          </span>
                          <span className="text-[var(--text-secondary)]">
                            Fornitore: Premiata Luxury Footwear
                          </span>
                        </div>
                        <StatusBadge tone="warning" size="md">
                          1 PAIO RIMASTO
                        </StatusBadge>
                      </div>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            )}
          </main>
        </>
      )}
    </div>
  );
}

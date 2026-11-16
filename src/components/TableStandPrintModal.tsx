'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  X,
  Check,
  Scissors,
  Smartphone,
  Wifi,
  UtensilsCrossed,
  BellRing,
  Palette,
  Layers,
  HelpCircle,
  Copy,
  Eye,
} from 'lucide-react';
import QRCode from 'qrcode';
import { HubConfig, HUB_FONT_OPTIONS } from '@/lib/hub-config';
import { BusinessCategory } from '@/lib/types';
import { getCategoryDefinition } from '@/lib/categories';
import { getContrastColor } from '@/lib/palettes';
import { StatusBadge } from '@/components/ui';

export interface DeviceOption {
  id: string;
  name: string;
  unique_code: string;
}

export interface TableStandPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  logoUrl?: string;
  category: BusinessCategory;
  hubConfig: HubConfig;
  devices: DeviceOption[];
  selectedDeviceCode?: string;
}

type PrintFormat = 'stand' | 'sticker';
type StickerShape = 'round' | 'square';
type PrintTheme = 'dark' | 'white';

export default function TableStandPrintModal({
  isOpen,
  onClose,
  name,
  logoUrl,
  category,
  hubConfig,
  devices,
  selectedDeviceCode: initialDeviceCode,
}: TableStandPrintModalProps) {
  // Device / Table Selection (override resets automatically if initialDeviceCode prop changes)
  const [overrideCode, setOverrideCode] = useState<{
    base: string | undefined;
    value: string;
  } | null>(null);

  const selectedCode =
    (overrideCode && overrideCode.base === initialDeviceCode ? overrideCode.value : undefined) ||
    initialDeviceCode ||
    (devices.length > 0 ? devices[0].unique_code : 'generic');

  // Escape key close handler
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Selected device object
  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.unique_code === selectedCode) || null;
  }, [devices, selectedCode]);

  // Table Label Override (defaults to device name e.g. "Tavolo 1", or "Postazione Tavolo")
  const [customLabelOverride, setCustomLabelOverride] = useState<{
    deviceCode: string;
    value: string;
  } | null>(null);

  const customTableLabel =
    customLabelOverride && customLabelOverride.deviceCode === selectedCode
      ? customLabelOverride.value
      : selectedDevice?.name || 'Postazione Tavolo';

  // Format & Styles
  const [format, setFormat] = useState<PrintFormat>('stand');
  const [stickerShape, setStickerShape] = useState<StickerShape>('round');
  const [printTheme, setPrintTheme] = useState<PrintTheme>('dark');
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [showTableBadge, setShowTableBadge] = useState<boolean>(true);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // QR Code SVG state keyed by targetUrl (avoids synchronous setLoading in effect)
  const [qrResult, setQrResult] = useState<{ url: string; svg: string } | null>(null);

  // Target URL computation: https://.../t/[code]?source=stand
  const targetUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://rivo-app-ten.vercel.app';

    if (selectedCode && selectedCode !== 'generic') {
      return `${origin}/t/${selectedCode}?source=stand`;
    }
    // Generic mode: use first active device or fallback
    const fallbackCode = devices[0]?.unique_code || 'DEMO';
    return `${origin}/t/${fallbackCode}?source=stand`;
  }, [selectedCode, devices]);

  const qrSvg = qrResult?.url === targetUrl ? qrResult.svg : '';
  const qrLoading = qrResult === null || qrResult.url !== targetUrl;

  // Generate high-resolution vector QR code SVG whenever targetUrl changes
  useEffect(() => {
    let isMounted = true;

    QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((svg) => {
        if (isMounted) {
          setQrResult({ url: targetUrl, svg });
        }
      })
      .catch((err) => {
        console.error('Error generating QR SVG:', err);
        if (isMounted) {
          setQrResult({ url: targetUrl, svg: '' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [targetUrl]);

  // Selected Font Family CSS
  const selectedFontCss = useMemo(() => {
    const found = HUB_FONT_OPTIONS.find((f) => f.id === hubConfig.fontFamily);
    return found?.cssFamily || "'Plus Jakarta Sans', sans-serif";
  }, [hubConfig.fontFamily]);

  // Accent Color & Category
  const primaryColor = hubConfig.primaryColor || '#BFFF00';
  const primaryContrastInk = getContrastColor(primaryColor);
  const categoryDef = getCategoryDefinition(category);

  // Handle Print Action
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-stand-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overscroll-contain bg-[var(--bg-backdrop)] backdrop-blur-sm"
    >
      {/* Dedicated @media print styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
          }

          /* Hide entire dashboard UI, dialog overlays, sidebars and headers */
          body * {
            visibility: hidden !important;
          }

          /* Show only the dedicated stand sheet */
          #rivo-stand-print-target,
          #rivo-stand-print-target * {
            visibility: visible !important;
          }

          #rivo-stand-print-target {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            box-shadow: none !important;
            z-index: 9999999 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Dialog Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] no-print"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] flex items-center justify-center text-[var(--rivo-volt-text)] shrink-0">
              <Printer className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="table-stand-modal-title"
                  className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight truncate"
                >
                  Stampa Stand Tavolo & Cavaliere NFC
                </h2>
                <StatusBadge tone="volt" mono>
                  HD Print Ready
                </StatusBadge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                Genera cavalieri in plexiglass (10×15 cm) e adesivi NFC ad alta definizione con il
                brand del tuo locale.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer shrink-0"
            aria-label="Chiudi modale"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body: Two Columns (Settings Left, Live HD Preview Right) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column (Left - 5 Cols) */}
          <div className="lg:col-span-5 space-y-5 min-w-0">
            {/* 1. Device / Table Selection */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
              <label
                htmlFor="print-device-select"
                className="text-xs font-mono font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                <span>Seleziona Postazione / Tavolo</span>
              </label>

              {devices.length > 0 ? (
                <div className="space-y-2.5">
                  <select
                    id="print-device-select"
                    value={selectedCode}
                    onChange={(e) =>
                      setOverrideCode({ base: initialDeviceCode, value: e.target.value })
                    }
                    className="w-full min-h-[44px] bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus-visible:border-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors"
                  >
                    <option value="generic">Modalità Generica (Hub Principale Locale)</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.unique_code}>
                        {device.name} • Codice [{device.unique_code}]
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <label htmlFor="print-table-label" className="sr-only">
                      Etichetta Stand
                    </label>
                    <input
                      id="print-table-label"
                      type="text"
                      value={customTableLabel}
                      onChange={(e) =>
                        setCustomLabelOverride({ deviceCode: selectedCode, value: e.target.value })
                      }
                      placeholder="Etichetta Stand (es. Tavolo 04, Bancone)…"
                      className="flex-1 min-w-0 min-h-[44px] bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs px-3 py-2 rounded-lg focus:outline-none focus-visible:border-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="min-h-[44px] px-3 py-2 text-xs rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-strong)] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      title="Copia URL di destinazione"
                      aria-label="Copia URL di destinazione"
                    >
                      {copiedUrl ? (
                        <Check
                          className="w-3.5 h-3.5 text-[var(--accent-operational-text)]"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      ) : (
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                      )}
                      <span className="hidden sm:inline font-semibold">
                        {copiedUrl ? 'Copiato' : 'Copia URL'}
                      </span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    Destinazione:{' '}
                    <span className="text-[var(--text-secondary)] font-mono">{targetUrl}</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Nessun dispositivo specifico registrato. Verrà generato uno Stand Generico per
                    il tuo Hub.
                  </p>
                  <label htmlFor="print-generic-label" className="sr-only">
                    Etichetta Stand
                  </label>
                  <input
                    id="print-generic-label"
                    type="text"
                    value={customTableLabel}
                    onChange={(e) =>
                      setCustomLabelOverride({ deviceCode: selectedCode, value: e.target.value })
                    }
                    placeholder="Etichetta Stand (es. Tavolo 01, Bancone)…"
                    className="w-full min-h-[44px] bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs px-3 py-2 rounded-lg focus:outline-none focus-visible:border-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  />
                </div>
              )}
            </div>

            {/* 2. Format Selection (Stand vs Sticker) */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
              <span className="text-xs font-mono font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                <span>Formato Supporto di Stampa</span>
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormat('stand')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-[background-color,border-color] duration-[180ms] cursor-pointer ${
                    format === 'stand'
                      ? 'bg-[var(--bg-surface)] border-[var(--text-primary)] ring-1 ring-[var(--text-primary)]'
                      : 'bg-[var(--bg-surface)]/50 border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Cavaliere Stand
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono tabular-nums shrink-0">
                      10×15 cm
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                    Verticale per stand da tavolo e plexiglass bifacciale.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('sticker')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-[background-color,border-color] duration-[180ms] cursor-pointer ${
                    format === 'sticker'
                      ? 'bg-[var(--bg-surface)] border-[var(--text-primary)] ring-1 ring-[var(--text-primary)]'
                      : 'bg-[var(--bg-surface)]/50 border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Adesivo NFC
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono tabular-nums shrink-0">
                      8×8 cm
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                    Compatto per centro tavola, bancone o cover menu.
                  </p>
                </button>
              </div>

              {/* Sticker Shape options if sticker is selected */}
              {format === 'sticker' && (
                <div className="pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)]">Forma adesivo:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStickerShape('round')}
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        stickerShape === 'round'
                          ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--text-primary)]'
                          : 'bg-[var(--bg-surface)]/50 text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Rotondo (Ø 8 cm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStickerShape('square')}
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        stickerShape === 'square'
                          ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--text-primary)]'
                          : 'bg-[var(--bg-surface)]/50 text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Quadrato (8×8 cm)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Theme & Style (Dark Luxury vs Pure White) */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
              <span className="text-xs font-mono font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                <span>Tema Grafico di Stampa</span>
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPrintTheme('dark')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-[background-color,border-color] duration-[180ms] cursor-pointer ${
                    printTheme === 'dark'
                      ? 'bg-[var(--bg-surface)] border-[var(--text-primary)] ring-1 ring-[var(--text-primary)]'
                      : 'bg-[var(--bg-surface)]/50 border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#09090B] border border-[var(--border-strong)] shrink-0" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Dark Luxury
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                    Sfondo scuro satinato e accenti luminosi. Effetto premium.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintTheme('white')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-[background-color,border-color] duration-[180ms] cursor-pointer ${
                    printTheme === 'white'
                      ? 'bg-[var(--bg-surface)] border-[var(--text-primary)] ring-1 ring-[var(--text-primary)]'
                      : 'bg-[var(--bg-surface)]/50 border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-white border border-[var(--border-strong)] shrink-0" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Pure White (Eco)
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                    Sfondo bianco ottico ad alto contrasto. Risparmia inchiostro.
                  </p>
                </button>
              </div>

              {/* Toggles */}
              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
                <label className="flex items-center justify-between min-h-[36px] text-xs text-[var(--text-primary)] cursor-pointer select-none gap-2">
                  <span className="flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.75} aria-hidden="true" />
                    <span>Guide di ritaglio e crocette di taglio</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showCropMarks}
                    onChange={(e) => setShowCropMarks(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--rivo-volt-text)] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between min-h-[36px] text-xs text-[var(--text-primary)] cursor-pointer select-none gap-2">
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.75} aria-hidden="true" />
                    <span>Badge nome postazione / tavolo</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showTableBadge}
                    onChange={(e) => setShowTableBadge(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--rivo-volt-text)] cursor-pointer"
                  />
                </label>

                {format === 'stand' && (
                  <label className="flex items-center justify-between min-h-[36px] text-xs text-[var(--text-primary)] cursor-pointer select-none gap-2">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.75} aria-hidden="true" />
                      <span>Istruzioni 1-Tap (Menù, Wi-Fi, Servizio)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showInstructions}
                      onChange={(e) => setShowInstructions(e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--rivo-volt-text)] cursor-pointer"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Print Action Trigger Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full min-h-[48px] flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-sm transition-[background-color,transform] duration-[180ms] active:scale-[0.98] cursor-pointer"
              >
                <Printer className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
                <span>Stampa / Salva in PDF</span>
              </button>

              <p className="text-[11px] text-[var(--text-muted)] text-center mt-2.5 leading-relaxed">
                Suggerimento: nella finestra di stampa, seleziona{' '}
                <strong className="text-[var(--text-secondary)]">Salva come PDF</strong> o la tua
                stampante, e assicurati di spuntare{' '}
                <strong className="text-[var(--text-secondary)]">
                  &quot;Grafica di sfondo&quot;
                </strong>{' '}
                per i colori corretti.
              </p>
            </div>
          </div>

          {/* Live Preview Column (Right - 7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-3 sm:p-5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl min-h-[560px] relative overflow-hidden min-w-0">
            {/* Live Indicator Header */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-4 pb-2.5 border-b border-[var(--border-subtle)] px-1 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className="font-semibold text-[var(--text-primary)]">
                  Anteprima Vettoriale HD
                </span>
                <span className="text-[var(--text-muted)]" aria-hidden="true">
                  •
                </span>
                <span className="font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                  {format === 'stand' ? '100 × 150 mm (10×15 cm)' : '80 × 80 mm'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                  Risoluzione: 600 DPI Vettoriale
                </span>
              </div>
            </div>

            {/* The Print Sheet / Canvas - This exact element is isolated during window.print() */}
            <div className="flex items-center justify-center w-full py-2 overflow-x-auto">
              <div
                id="rivo-stand-print-target"
                className={`transition-[transform,opacity] duration-300 select-none relative ${
                  format === 'stand' ? 'format-stand' : 'format-sticker'
                }`}
                style={{
                  fontFamily: selectedFontCss,
                }}
              >
                {/* Visual Crop Marks & Cut Border */}
                {showCropMarks && (
                  <div
                    className={`absolute inset-0 pointer-events-none z-30 ${
                      format === 'sticker' && stickerShape === 'round'
                        ? 'rounded-full border-2 border-dashed border-zinc-400/60'
                        : 'border border-dashed border-zinc-400/50'
                    }`}
                  >
                    {/* Corner registration marks for Stand or Square Sticker */}
                    {!(format === 'sticker' && stickerShape === 'round') && (
                      <>
                        <span className="absolute -top-3 -left-3 text-zinc-400 text-xs font-mono select-none">
                          +
                        </span>
                        <span className="absolute -top-3 -right-3 text-zinc-400 text-xs font-mono select-none">
                          +
                        </span>
                        <span className="absolute -bottom-3 -left-3 text-zinc-400 text-xs font-mono select-none">
                          +
                        </span>
                        <span className="absolute -bottom-3 -right-3 text-zinc-400 text-xs font-mono select-none">
                          +
                        </span>
                        <div className="absolute top-1 left-2 flex items-center gap-1 text-[8px] text-zinc-400 tracking-wider uppercase font-mono opacity-60">
                          <Scissors className="w-2.5 h-2.5" aria-hidden="true" />
                          <span>Guida taglio</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* =========================================================================
                    RENDER FORMAT: STAND (10x15 cm)
                   ========================================================================= */}
                {format === 'stand' && (
                  <div
                    className={`relative w-[340px] h-[510px] rounded-2xl p-5 flex flex-col justify-between items-center text-center overflow-hidden shadow-xl transition-colors ${
                      printTheme === 'dark'
                        ? 'bg-[#0A0B0E] text-white border border-zinc-800'
                        : 'bg-white text-zinc-900 border border-zinc-200'
                    }`}
                    style={{
                      aspectRatio: '10 / 15',
                    }}
                  >
                    {/* TOP SECTION: Brand Logo & Title */}
                    <div className="w-full flex flex-col items-center relative z-10 pt-1">
                      {/* Logo or Brand Monogram */}
                      {logoUrl ? (
                        <div className="w-13 h-13 rounded-xl overflow-hidden mb-2 bg-white/10 p-1 flex items-center justify-center border border-white/20 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={logoUrl}
                            alt={name || 'Logo'}
                            width={52}
                            height={52}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-sm mb-2"
                          style={{
                            backgroundColor: `${primaryColor}20`,
                            color: primaryColor,
                            border: `1.5px solid ${primaryColor}50`,
                          }}
                        >
                          {(name || 'R').charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Business Name */}
                      <h3
                        className={`font-extrabold tracking-tight leading-tight max-w-[280px] line-clamp-1 ${
                          printTheme === 'dark' ? 'text-white text-xl' : 'text-zinc-950 text-xl'
                        }`}
                      >
                        {name || 'Nome del Tuo Locale'}
                      </h3>

                      {/* Category Subtitle */}
                      <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">
                        {categoryDef.label}
                      </p>

                      {/* Table / Device Badge */}
                      {showTableBadge && (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mt-2 shadow-xs"
                          style={{
                            backgroundColor:
                              printTheme === 'dark' ? `${primaryColor}25` : `${primaryColor}20`,
                            color: printTheme === 'dark' ? primaryColor : '#0f172a',
                            border: `1px solid ${primaryColor}60`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: primaryColor }}
                          />
                          <span>{customTableLabel || 'Tavolo'}</span>
                        </div>
                      )}
                    </div>

                    {/* MIDDLE SECTION: NFC Touch Zone & Stylized NFC Wave */}
                    <div className="w-full flex flex-col items-center relative z-10 my-auto py-1">
                      {/* Stylized Contactless Vector Wave */}
                      <div className="flex flex-col items-center">
                        <div
                          className="relative flex items-center justify-center w-14 h-14 rounded-2xl mb-1.5 shadow-sm"
                          style={{
                            backgroundColor: printTheme === 'dark' ? '#14151B' : '#F1F3F5',
                            border: `1.5px solid ${primaryColor}40`,
                            color: primaryColor,
                          }}
                        >
                          {/* Authentic Contactless / NFC Wave SVG */}
                          <svg viewBox="0 0 100 100" className="w-9 h-9" fill="none" aria-hidden="true">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeDasharray="4 3"
                              opacity="0.3"
                            />
                            {/* Waves radiating left towards smartphone */}
                            <path
                              d="M 32 68 A 22 22 0 0 1 32 32"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M 42 75 A 34 34 0 0 1 42 25"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              opacity="0.8"
                            />
                            <path
                              d="M 52 82 A 46 46 0 0 1 52 18"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              opacity="0.5"
                            />
                            {/* Smartphone Icon */}
                            <rect
                              x="58"
                              y="30"
                              width="22"
                              height="38"
                              rx="4"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            />
                            <line
                              x1="65"
                              y1="34"
                              x2="73"
                              y2="34"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <circle cx="69" cy="61" r="1.5" fill="currentColor" />
                          </svg>
                        </div>

                        <span
                          className={`text-xs font-black tracking-wide uppercase ${
                            printTheme === 'dark' ? 'text-white' : 'text-zinc-950'
                          }`}
                        >
                          Avvicina lo smartphone qui
                        </span>
                        <span
                          className={`text-[10px] font-medium mt-0.5 ${
                            printTheme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                          }`}
                        >
                          Connessione NFC Immediata (Zero App)
                        </span>
                      </div>

                      {/* Divider Or Scan QR */}
                      <div className="w-full flex items-center gap-3 my-2 px-4 opacity-70">
                        <div
                          className={`flex-1 h-px ${
                            printTheme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'
                          }`}
                        />
                        <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">
                          oppure inquadra il QR Code
                        </span>
                        <div
                          className={`flex-1 h-px ${
                            printTheme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'
                          }`}
                        />
                      </div>

                      {/* High-Contrast QR Code Card */}
                      <div className="bg-white p-2.5 rounded-xl shadow-lg border border-zinc-200/80 flex items-center justify-center">
                        {qrLoading ? (
                          <div className="w-28 h-28 flex items-center justify-center text-zinc-400 text-xs">
                            Generazione QR…
                          </div>
                        ) : (
                          <div
                            className="w-28 h-28 [&>svg]:w-full [&>svg]:h-full"
                            dangerouslySetInnerHTML={{ __html: qrSvg }}
                          />
                        )}
                      </div>
                    </div>

                    {/* BOTTOM SECTION: Elegant Guest Instructions */}
                    <div className="w-full relative z-10 pb-1">
                      {showInstructions && (
                        <div
                          className={`p-2.5 rounded-xl border mb-2 ${
                            printTheme === 'dark'
                              ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                          }`}
                        >
                          <p
                            className={`text-[10px] font-bold tracking-tight mb-1.5 ${
                              printTheme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
                            }`}
                          >
                            Accedi al Menù Digitale, Wi-Fi e Assistenza Tavolo in 1-Tap
                          </p>

                          <div className="flex items-center justify-center gap-3 text-[10px] font-medium">
                            <span className="flex items-center gap-1">
                              <UtensilsCrossed className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                              <span>Menù</span>
                            </span>
                            <span className="opacity-40">•</span>
                            <span className="flex items-center gap-1">
                              <Wifi className="w-3 h-3 text-sky-500" aria-hidden="true" />
                              <span>Wi-Fi</span>
                            </span>
                            <span className="opacity-40">•</span>
                            <span className="flex items-center gap-1">
                              <BellRing className="w-3 h-3 text-amber-500" aria-hidden="true" />
                              <span>Assistenza</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Micro Footer Badge */}
                      <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold tracking-wider text-zinc-500 uppercase">
                        <span>Tecnologia Smart Hub</span>
                        <span>•</span>
                        <span className="font-extrabold text-zinc-400">RIVO Experience</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================================
                    RENDER FORMAT: STICKER (8x8 cm)
                   ========================================================================= */}
                {format === 'sticker' && (
                  <div
                    className={`relative w-[340px] h-[340px] p-5 flex flex-col justify-between items-center text-center overflow-hidden shadow-xl transition-colors ${
                      stickerShape === 'round' ? 'rounded-full' : 'rounded-2xl'
                    } ${
                      printTheme === 'dark'
                        ? 'bg-[#0A0B0E] text-white border border-zinc-800'
                        : 'bg-white text-zinc-900 border border-zinc-200'
                    }`}
                    style={{
                      aspectRatio: '1 / 1',
                    }}
                  >
                    {/* Decorative Ring for round sticker */}
                    {stickerShape === 'round' && (
                      <div
                        className="absolute inset-2 rounded-full pointer-events-none border border-dashed opacity-30"
                        style={{ borderColor: primaryColor }}
                      />
                    )}

                    {/* TOP: Brand & Table */}
                    <div className="w-full flex flex-col items-center relative z-10 pt-1">
                      <div className="flex items-center gap-2">
                        {logoUrl && (
                          <div className="w-6 h-6 rounded-md overflow-hidden bg-white/10 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={logoUrl}
                              alt="Logo"
                              width={24}
                              height={24}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <h4
                          className={`font-black text-sm tracking-tight truncate max-w-[200px] ${
                            printTheme === 'dark' ? 'text-white' : 'text-zinc-950'
                          }`}
                        >
                          {name || 'Nome Locale'}
                        </h4>
                      </div>

                      {showTableBadge && (
                        <div
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mt-1"
                          style={{
                            backgroundColor: `${primaryColor}20`,
                            color: printTheme === 'dark' ? primaryColor : '#09090b',
                            border: `1px solid ${primaryColor}50`,
                          }}
                        >
                          <span>{customTableLabel || 'Tavolo'}</span>
                        </div>
                      )}
                    </div>

                    {/* CENTER: High-contrast QR with NFC Accent */}
                    <div className="relative z-10 flex flex-col items-center my-auto">
                      <div className="relative bg-white p-2.5 rounded-2xl shadow-lg border border-zinc-200 flex items-center justify-center">
                        {/* NFC Badge Pill Floating on top of QR */}
                        <div
                          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase flex items-center gap-1 shadow-md"
                          style={{ backgroundColor: primaryColor, color: primaryContrastInk }}
                        >
                          <Smartphone className="w-2.5 h-2.5" aria-hidden="true" />
                          <span>NFC + QR</span>
                        </div>

                        {qrLoading ? (
                          <div className="w-28 h-28 flex items-center justify-center text-zinc-400 text-xs">
                            Generazione…
                          </div>
                        ) : (
                          <div
                            className="w-28 h-28 [&>svg]:w-full [&>svg]:h-full"
                            dangerouslySetInnerHTML={{ __html: qrSvg }}
                          />
                        )}
                      </div>

                      <div className="mt-2 text-center">
                        <span
                          className={`text-[10px] font-black tracking-wide uppercase ${
                            printTheme === 'dark' ? 'text-white' : 'text-zinc-900'
                          }`}
                        >
                          Avvicina lo smartphone qui
                        </span>
                      </div>
                    </div>

                    {/* BOTTOM: Minimal Instruction */}
                    <div className="w-full relative z-10 pb-1">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                        Menù • Wi-Fi • Assistenza Tavolo
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Print Dimensions & Info Callout */}
            <div className="w-full mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)] px-1">
              <span className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>
                  Ritaglia lungo il bordo o inserisci direttamente nel porta-stand plexiglass
                </span>
              </span>
              <span className="font-mono text-[var(--text-secondary)]">RIVO Print Engine</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="hidden sm:inline">Formato attuale:</span>
            <span className="font-bold font-mono tabular-nums text-[var(--text-primary)] uppercase">
              {format === 'stand' ? 'Stand Tavolo 10×15 cm' : `Adesivo ${stickerShape} 8×8 cm`}
            </span>
            <span className="text-[var(--text-muted)]" aria-hidden="true">
              •
            </span>
            <span className="text-[var(--text-secondary)]">
              {selectedDevice ? selectedDevice.name : 'Modalità Generica'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              Chiudi
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs transition-[background-color,transform] duration-[180ms] active:scale-[0.98] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
              <span>Stampa / Salva PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

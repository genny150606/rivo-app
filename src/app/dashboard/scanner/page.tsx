'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Barcode,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  PackagePlus,
  RefreshCw,
  Flashlight,
  Plus,
  Minus,
  Search,
  Check,
  Zap,
  Boxes,
  Volume2,
  VolumeX,
  Cpu,
  X,
} from 'lucide-react';
import { PageHeader, SurfaceCard, StatusBadge } from '@/components/ui';
import { formatItCurrency } from '@/lib/chart-theme';
import { cn } from '@/lib/cn';

interface ExistingItem {
  variantId: string;
  productId: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  barcode: string;
  sku: string;
  currentStock: number;
  sellingPrice: number;
  costPrice: number;
}

interface RecognizedItem {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  sellingPrice: number;
  costPrice: number;
  confidence?: number;
}

export default function MobileScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraErrorCode, setCameraErrorCode] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{ name: string; message: string } | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);

  // Scanning & Detection State
  const [manualCode, setManualCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);

  // Result Cards
  const [existingItem, setExistingItem] = useState<ExistingItem | null>(null);
  const [recognizedItem, setRecognizedItem] = useState<RecognizedItem | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannerFlash, setScannerFlash] = useState(false);
  const [isBarcodePromptOpen, setIsBarcodePromptOpen] = useState(false);
  const [promptBarcodeValue, setPromptBarcodeValue] = useState('');

  // Scan History
  const [history, setHistory] = useState<
    Array<{ name: string; size: string; quantity: number; time: string }>
  >([]);

  // Harmonic Chime Synthesizer
  const playScanChime = useCallback(() => {
    if (!audioEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
      });
    } catch {
      // AudioContext policy
    }

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([50, 40, 90]);
    }
  }, [audioEnabled]);

  // Robust Camera Starter
  const startCamera = async () => {
    setCameraError(null);
    setCameraErrorCode(null);
    setErrorDetails(null);

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;
    }
    setStream(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError(
        'Il tuo browser non supporta lo streaming video diretto. Usa il tasto "Usa Fotocamera Telefono".'
      );
      setCameraActive(false);
      return;
    }

    const attempts: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: 'environment' } }, audio: false },
      { video: true, audio: false },
    ];

    let mediaStream: MediaStream | null = null;
    let lastErr: unknown = null;

    for (const constraints of attempts) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (mediaStream) break;
      } catch (err: unknown) {
        lastErr = err;
        const e = err as { name?: string };
        if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
          break;
        }
      }
    }

    if (!mediaStream) {
      console.warn('Camera cascade failed:', lastErr);
      const errObj = lastErr as { name?: string; message?: string };
      const errName = errObj?.name || 'Error';
      const errMsg = errObj?.message || '';
      setCameraErrorCode(errName);
      setErrorDetails({ name: errName, message: errMsg });

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraError('Permesso fotocamera negato.');
      } else if (errName === 'NotReadableError') {
        setCameraError(
          'Fotocamera occupata da un’altra applicazione. Chiudi le altre app e riprova.'
        );
      } else {
        setCameraError(errMsg || 'Impossibile avviare la fotocamera.');
      }
      setCameraActive(false);
      return;
    }

    streamRef.current = mediaStream;
    setStream(mediaStream);
    setCameraActive(true);
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('webkit-playsinline', 'true');
      videoRef.current.play().catch((playErr) => {
        console.warn('Video play error:', playErr);
      });
    }
  }, [stream]);

  const stopCamera = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setCameraActive(false);
    setTorchOn(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isBarcodePromptOpen) {
        setIsBarcodePromptOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isBarcodePromptOpen]);

  // Torch toggle
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && (track.getCapabilities() as { torch?: boolean })?.torch) {
      try {
        await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints(
          { advanced: [{ torch: !torchOn }] }
        );
        setTorchOn(!torchOn);
      } catch (e) {
        console.warn('Torch error:', e);
      }
    }
  };

  // Immediate Stock In for Continuous Mode
  const executeImmediateStockIn = async (
    variantId: string,
    qty: number,
    name: string,
    size: string
  ) => {
    try {
      await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: variantId,
          type: 'purchase',
          quantity: qty,
          notes: 'Scan Continuo',
        }),
      });

      setSuccessMessage(`Immagazzinato al volo: +${qty} ${name} (Tg. ${size})`);
      setHistory((prev) => [
        {
          name,
          size,
          quantity: qty,
          time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 9),
      ]);

      setTimeout(() => {
        setExistingItem(null);
        setLastScannedCode(null);
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle scanned or searched barcode
  const handleBarcodeDetected = useCallback(
    async (code: string) => {
      setLastScannedCode(code);
      playScanChime();
      setScannerFlash(true);
      setTimeout(() => setScannerFlash(false), 400);

      setLookupLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setExistingItem(null);
      setRecognizedItem(null);
      setQuantityToAdd(1);

      try {
        const res = await fetch(`/api/ai/barcode-lookup?code=${encodeURIComponent(code)}`);
        const data = await res.json();

        if (data.exists && data.item) {
          setExistingItem(data.item);

          if (continuousMode) {
            await executeImmediateStockIn(
              data.item.variantId,
              1,
              data.item.name,
              data.item.size
            );
          }
        } else if (data.recognized) {
          setRecognizedItem(data.recognized);
        } else if (data.notFound) {
          setRecognizedItem({
            barcode: code,
            name: '',
            brand: '',
            category: 'Calzature',
            size: '',
            color: '',
            sellingPrice: 0,
            costPrice: 0,
          });
          setSuccessMessage(
            `Barcode ${code} nuovo: inquadra l'etichetta scatola o completa i dati.`
          );
        }
      } catch (err: unknown) {
        console.error('Barcode lookup error:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Errore ricerca barcode');
      } finally {
        setLookupLoading(false);
      }
    },
    [continuousMode, playScanChime]
  );

  // Barcode Detection Loop
  useEffect(() => {
    if (!cameraActive || !videoRef.current) return;

    let active = true;
    let detector: { detect: (el: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } | null =
      null;

    if ('BarcodeDetector' in window) {
      try {
        const BD = (window as unknown as {
          BarcodeDetector: new (opts: { formats: string[] }) => typeof detector;
        }).BarcodeDetector;
        detector = new BD({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
        });
      } catch (e) {
        console.warn('BarcodeDetector setup error:', e);
      }
    }

    const checkFrame = async () => {
      if (!active || !videoRef.current || videoRef.current.readyState < 2) {
        if (active) requestAnimationFrame(checkFrame);
        return;
      }

      if (detector && !lookupLoading && !existingItem && !recognizedItem) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            const code = barcodes[0].rawValue.trim();
            if (code && code !== lastScannedCode) {
              handleBarcodeDetected(code);
            }
          }
        } catch {
          // Ignore intermittent frame decode errors
        }
      }

      if (active) {
        requestAnimationFrame(checkFrame);
      }
    };

    const animId = requestAnimationFrame(checkFrame);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [
    cameraActive,
    lookupLoading,
    existingItem,
    recognizedItem,
    lastScannedCode,
    handleBarcodeDetected,
  ]);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle Photo Capture / Box Label AI Vision
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingPhoto(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setExistingItem(null);
    setRecognizedItem(null);

    try {
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const BD = (window as unknown as {
            BarcodeDetector: new (opts: { formats: string[] }) => {
              detect: (bmp: ImageBitmap) => Promise<Array<{ rawValue?: string }>>;
            };
          }).BarcodeDetector;
          const detector = new BD({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
          });
          const bitmap = await createImageBitmap(file);
          const detected = await detector.detect(bitmap);
          if (detected && detected.length > 0 && detected[0].rawValue) {
            const code = detected[0].rawValue.trim();
            if (code) {
              await handleBarcodeDetected(code);
              setAnalyzingPhoto(false);
              return;
            }
          }
        } catch (bitmapErr) {
          console.warn('Bitmap barcode detector error, falling back to AI Vision:', bitmapErr);
        }
      }

      const base64 = await readFileAsBase64(file);
      playScanChime();

      const res = await fetch('/api/ai/box-label-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore analisi foto etichetta');

      if (data.recognized) {
        const finalBarcode = data.recognized.barcode || lastScannedCode || '';
        setRecognizedItem({
          ...data.recognized,
          barcode: finalBarcode,
        });
        if (finalBarcode) setLastScannedCode(finalBarcode);
        setSuccessMessage('Etichetta analizzata con successo.');
      }
    } catch (err: unknown) {
      setErrorMessage(
        `Errore scansione foto: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`
      );
    } finally {
      setAnalyzingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit Stock-In for EXISTING Item
  const handleStockInExisting = async () => {
    if (!existingItem) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: existingItem.variantId,
          type: 'purchase',
          quantity: quantityToAdd,
          cost_price: existingItem.costPrice,
          notes: `Carico Scanner Mobile (Barcode: ${existingItem.barcode})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore caricamento');

      setSuccessMessage(
        `Caricati +${quantityToAdd} pezzi di ${existingItem.name} (Tg. ${existingItem.size})`
      );
      setHistory((prev) => [
        {
          name: existingItem.name,
          size: existingItem.size,
          quantity: quantityToAdd,
          time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 9),
      ]);
      setExistingItem(null);
      setLastScannedCode(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Errore caricamento');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Stock-In for NEW Recognized Item
  const handleStockInNew = async () => {
    if (!recognizedItem) return;
    const prodName = recognizedItem.name.trim();
    if (!prodName) {
      setErrorMessage('Inserisci il nome o modello dell’articolo prima di salvare.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/ai/retail-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: {
            name: prodName,
            brand: recognizedItem.brand?.trim() || undefined,
            category: recognizedItem.category || 'Calzature',
            size: recognizedItem.size?.trim() || 'TU',
            color: recognizedItem.color?.trim() || 'Standard',
            sellingPrice: Number(recognizedItem.sellingPrice) || 0,
            costPrice: Number(recognizedItem.costPrice) || 0,
            quantity: quantityToAdd,
            barcode: recognizedItem.barcode?.trim() || lastScannedCode || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore creazione articolo');

      setSuccessMessage(
        `Creato e Immagazzinato: +${quantityToAdd} ${prodName} (Tg. ${recognizedItem.size || 'TU'})`
      );
      setHistory((prev) => [
        {
          name: prodName,
          size: recognizedItem.size || 'TU',
          quantity: quantityToAdd,
          time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 9),
      ]);
      setRecognizedItem(null);
      setLastScannedCode(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Errore creazione articolo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-20 space-y-4 min-w-0">
      <PageHeader
        eyebrow="04 // HARDWARE OPTICAL TERMINAL"
        title="Scanner Mobile"
        backHref="/dashboard"
        backLabel="Dashboard"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAudioEnabled(!audioEnabled)}
              aria-label={audioEnabled ? 'Disattiva audio scansione' : 'Attiva audio scansione'}
              title={audioEnabled ? 'Audio Attivo' : 'Audio Disattivato'}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {audioEnabled ? (
                <Volume2 className="w-4 h-4 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <VolumeX className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setContinuousMode(!continuousMode)}
              title="Scan Continuo: aggiunge +1 automaticamente a ogni scansione"
              className={cn(
                'flex items-center gap-1.5 px-3 min-h-[40px] rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
                continuousMode
                  ? 'bg-[var(--accent-warning-bg)] text-[var(--accent-warning-text)] border-[var(--accent-warning-border)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
              )}
            >
              <Zap className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Scan Rapido</span>
            </button>
          </div>
        }
      />

      {/* Hardware Optical Viewfinder */}
      <div
        className={cn(
          'relative bg-[#09090B] rounded-2xl overflow-hidden aspect-[4/3] border-2 transition-[border-color,transform] duration-200 flex items-center justify-center',
          scannerFlash ? 'border-[var(--accent-operational)] scale-[1.01]' : 'border-[var(--border-strong)]'
        )}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            'w-full h-full object-cover transition-opacity duration-200',
            cameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
          )}
        />

        {cameraActive ? (
          <>
            {/* Optical Reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="relative w-64 h-36 rounded-xl border border-[#BFFF00]/45 bg-[#BFFF00]/[0.03] flex items-center justify-center">
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#BFFF00] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#BFFF00] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#BFFF00] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#BFFF00] rounded-br-lg" />

                <div className="absolute inset-x-3 h-0.5 bg-[#BFFF00]/80 top-1/2 -translate-y-1/2" />

                <div className="absolute -bottom-7 inset-x-0 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#09090B]/90 border border-[#BFFF00]/30 text-[10px] font-mono uppercase tracking-widest text-[#BFFF00]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
                    Radar Ottico Attivo
                  </span>
                </div>
              </div>
            </div>

            {/* Controls Bar over Viewfinder */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTorch}
                aria-label="Attiva o disattiva torcia"
                title="Torcia"
                className={cn(
                  'min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border transition-colors cursor-pointer',
                  torchOn
                    ? 'bg-[var(--accent-warning)] text-[#09090B] border-transparent'
                    : 'bg-[#09090B]/75 text-[#F4F4F6] border-white/15 hover:bg-[#09090B]'
                )}
              >
                <Flashlight className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  startCamera();
                }}
                aria-label="Riavvia fotocamera"
                title="Riavvia Fotocamera"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-[#09090B]/75 text-[#F4F4F6] border border-white/15 hover:bg-[#09090B] cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-5 space-y-3 z-10 w-full max-w-sm">
            <div className="w-12 h-12 rounded-xl bg-[#18191E] border border-[#22242A] flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6 text-[#BFFF00]" strokeWidth={1.75} aria-hidden="true" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#F4F4F6]">Fotocamera Scanner RIVO</p>
              <p className="text-[11px] text-[#A1A1AA] max-w-xs mx-auto">
                Tocca il pulsante per attivare la scansione barcode in tempo reale.
              </p>
            </div>

            {(cameraError || errorDetails) && (
              <div className="bg-[var(--accent-warning-bg)] border border-[var(--accent-warning-border)] rounded-xl p-3 text-left space-y-2">
                <div className="flex items-center gap-1.5 text-[var(--accent-warning-text)] font-bold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span>
                    {cameraError || 'Nessun permesso concesso da Chrome o Android'}
                  </span>
                </div>
                {cameraErrorCode && (
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Se il popup del browser non appare, il permesso è disattivato a livello di
                    sistema Android:
                  </p>
                )}
                <div className="text-[10px] text-[var(--text-secondary)] space-y-1 bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                  <p>
                    <strong>Su Android:</strong> Vai in{' '}
                    <em>Impostazioni Telefono &gt; App &gt; Chrome &gt; Autorizzazioni &gt; Fotocamera &gt; Consenti</em>
                  </p>
                  <p>
                    <strong>Su Chrome:</strong> Tocca le levette a sinistra del link in basso &gt;{' '}
                    <em>Autorizzazioni &gt; Consenti</em>
                  </p>
                </div>
                {errorDetails?.message && (
                  <p className="text-[9px] font-mono text-[var(--text-muted)] break-all">
                    System: {errorDetails.name} ({errorDetails.message})
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={startCamera}
              className="w-full min-h-[44px] py-2.5 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Attiva Fotocamera
            </button>

            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[44px] py-2.5 bg-[#18191E] hover:bg-[#1F2128] border border-[#32353E] text-[#F4F4F6] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#BFFF00]" strokeWidth={1.75} aria-hidden="true" />
                <span>Usa Fotocamera Telefono (Funziona Subito)</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading / Vision Overlay */}
        {(lookupLoading || analyzingPhoto) && (
          <div className="absolute inset-0 bg-[#09090B]/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
            <div className="relative flex items-center justify-center">
              <RefreshCw className="w-9 h-9 text-[#BFFF00] animate-spin" aria-hidden="true" />
            </div>
            <span className="text-xs font-mono font-semibold text-[#F4F4F6] tracking-wide">
              {analyzingPhoto
                ? 'Analisi Visiva Etichetta con AI…'
                : 'Riconoscimento Calzatura AI…'}
            </span>
          </div>
        )}
      </div>

      {/* Action Strip: Photo Label Snap & Barcode Search */}
      <div className="grid grid-cols-2 gap-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={analyzingPhoto || lookupLoading}
          className="min-h-[44px] p-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-50"
        >
          <Camera className="w-4 h-4 text-[var(--accent-telemetry-text)]" strokeWidth={1.75} aria-hidden="true" />
          <span>Scatta Foto Scatola</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPromptBarcodeValue('');
            setIsBarcodePromptOpen(true);
          }}
          className="min-h-[44px] p-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <Barcode className="w-4 h-4 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
          <span>Digita Barcode</span>
        </button>
      </div>

      {/* Manual Input Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <label htmlFor="manual-barcode-input" className="sr-only">
            Cerca barcode manualmente
          </label>
          <Barcode
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <input
            id="manual-barcode-input"
            ref={manualInputRef}
            type="text"
            placeholder="Cerca barcode (es: 8051234567890)…"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualCode.trim()) {
                handleBarcodeDetected(manualCode.trim());
              }
            }}
            className="w-full min-h-[44px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--focus-ring)]"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            if (manualCode.trim()) handleBarcodeDetected(manualCode.trim());
          }}
          disabled={!manualCode.trim() || lookupLoading}
          className="min-h-[44px] px-4 bg-[var(--text-primary)] hover:opacity-90 disabled:opacity-50 text-[var(--bg-canvas)] font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-opacity shrink-0 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
          <span>Cerca</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] rounded-xl text-xs text-[var(--accent-critical-text)] font-medium flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Chiudi errore"
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Animated Confirmation Strip (replaces canvas-confetti) */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 bg-[var(--accent-operational-bg)] border border-[var(--accent-operational)] rounded-xl text-xs text-[var(--accent-operational-text)] font-semibold flex items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
          <StatusBadge tone="operational" size="sm">
            OK
          </StatusBadge>
        </div>
      )}

      {/* Case A: EXISTING ITEM DETECTED */}
      {existingItem && (
        <SurfaceCard
          padding="md"
          className="border-2 border-[var(--accent-operational)] space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between gap-2">
            <StatusBadge tone="operational" icon={Check} size="md">
              Articolo a Catalogo
            </StatusBadge>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono tabular-nums text-[var(--text-muted)] truncate">
                {existingItem.barcode}
              </span>
              <button
                type="button"
                onClick={() => setExistingItem(null)}
                aria-label="Chiudi scheda articolo"
                className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] leading-tight">
              {existingItem.name}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Brand: <strong className="text-[var(--text-primary)]">{existingItem.brand}</strong> •
              Categoria: {existingItem.category}
            </p>
          </div>

          {/* Details & Current Stock */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-[var(--border-subtle)] text-center">
            <div className="bg-[var(--bg-elevated)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
              <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                Taglia
              </div>
              <div className="font-mono text-lg font-bold text-[var(--text-primary)]">
                {existingItem.size}
              </div>
            </div>
            <div className="bg-[var(--bg-elevated)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
              <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                Giacenza
              </div>
              <div className="font-mono tabular-nums text-lg font-bold text-[var(--rivo-volt-text)]">
                {existingItem.currentStock} pz
              </div>
            </div>
            <div className="bg-[var(--bg-elevated)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
              <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                Prezzo
              </div>
              <div className="font-mono tabular-nums text-lg font-bold text-[var(--text-primary)]">
                {formatItCurrency(existingItem.sellingPrice)}
              </div>
            </div>
          </div>

          {/* Fast Increment Controls */}
          <div className="space-y-2">
            <label
              htmlFor="existing-qty-add"
              className="text-xs text-[var(--text-secondary)] font-semibold block"
            >
              Quantità da Caricare a Magazzino:
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Riduci quantità"
                onClick={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                <Minus className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
              <input
                id="existing-qty-add"
                type="number"
                min={1}
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="flex-1 min-h-[48px] text-center bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-xl py-2.5 font-mono tabular-nums text-xl font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
              />
              <button
                type="button"
                aria-label="Aumenta quantità"
                onClick={() => setQuantityToAdd(quantityToAdd + 1)}
                className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2 pt-1">
              {[1, 2, 5, 10].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setQuantityToAdd(qty)}
                  className={cn(
                    'flex-1 min-h-[38px] py-1.5 rounded-lg font-mono tabular-nums text-xs font-bold border transition-colors cursor-pointer',
                    quantityToAdd === qty
                      ? 'bg-[var(--rivo-volt)] text-[#09090B] border-transparent'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  )}
                >
                  +{qty}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExistingItem(null)}
              className="min-h-[48px] px-4 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleStockInExisting}
              disabled={submitting}
              className="flex-1 min-h-[48px] bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] disabled:opacity-50 text-[#09090B] font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <PackagePlus className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              <span>
                {submitting ? 'Caricamento in corso…' : `Carica +${quantityToAdd} a Magazzino`}
              </span>
            </button>
          </div>
        </SurfaceCard>
      )}

      {/* Case B: NEW RECOGNIZED ITEM (AI VISION) */}
      {recognizedItem && (
        <SurfaceCard
          padding="md"
          className="border-2 border-[var(--accent-telemetry)] space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between gap-2">
            <StatusBadge tone="telemetry" icon={Cpu} size="md">
              {recognizedItem.name ? 'Riconosciuto da AI' : 'Nuovo Articolo da Registrare'}
            </StatusBadge>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono tabular-nums text-[var(--text-muted)] truncate">
                {recognizedItem.barcode}
              </span>
              <button
                type="button"
                onClick={() => setRecognizedItem(null)}
                aria-label="Chiudi scheda nuovo articolo"
                className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </div>

          {!recognizedItem.name && (
            <div className="bg-[var(--accent-telemetry-bg)] border border-[var(--accent-telemetry-border)] rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-[var(--accent-telemetry-text)] text-xs font-bold">
                <ScanLine className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                <span>Barcode non presente online</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Inquadra l’etichetta della scatola: l’AI leggerà Marca (es. Nero Giardini), Modello
                e Taglia in automatico.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[42px] bg-[#1D4ED8] hover:opacity-90 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-opacity cursor-pointer"
              >
                <Camera className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                <span>Scatta Foto Etichetta Scatola</span>
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label
                htmlFor="rec-item-name"
                className="font-mono text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-1"
              >
                Modello Scarpa / Prodotto *
              </label>
              <input
                id="rec-item-name"
                type="text"
                placeholder="es: Décolleté Pelle, Sneaker Fondo Alto, Mocassino…"
                value={recognizedItem.name}
                onChange={(e) => setRecognizedItem({ ...recognizedItem, name: e.target.value })}
                className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--focus-ring)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="rec-item-brand"
                  className="font-mono text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-1"
                >
                  Brand
                </label>
                <input
                  id="rec-item-brand"
                  type="text"
                  placeholder="es: Nero Giardini"
                  value={recognizedItem.brand}
                  onChange={(e) => setRecognizedItem({ ...recognizedItem, brand: e.target.value })}
                  className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
              </div>
              <div>
                <label
                  htmlFor="rec-item-size"
                  className="font-mono text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-1"
                >
                  Numero / Taglia
                </label>
                <input
                  id="rec-item-size"
                  type="text"
                  placeholder="es: 38"
                  value={recognizedItem.size}
                  onChange={(e) => setRecognizedItem({ ...recognizedItem, size: e.target.value })}
                  className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs font-mono font-bold text-center text-[var(--rivo-volt-text)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="rec-item-sell"
                  className="font-mono text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-1"
                >
                  Prezzo Vendita (€)
                </label>
                <input
                  id="rec-item-sell"
                  type="number"
                  step="0.01"
                  value={recognizedItem.sellingPrice || ''}
                  onChange={(e) =>
                    setRecognizedItem({
                      ...recognizedItem,
                      sellingPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
              </div>
              <div>
                <label
                  htmlFor="rec-item-cost"
                  className="font-mono text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-1"
                >
                  Prezzo Costo (€)
                </label>
                <input
                  id="rec-item-cost"
                  type="number"
                  step="0.01"
                  value={recognizedItem.costPrice || ''}
                  onChange={(e) =>
                    setRecognizedItem({
                      ...recognizedItem,
                      costPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="rec-item-qty"
                className="font-mono text-[10px] text-[var(--text-muted)] uppercase font-semibold block mb-1"
              >
                Quantità Iniziale da Immagazzinare
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="rec-item-qty"
                  type="number"
                  min={1}
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-24 min-h-[40px] text-center bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg py-2 text-xs font-mono tabular-nums font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
                <span className="text-xs text-[var(--text-secondary)] font-medium">
                  paia di scarpe
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRecognizedItem(null)}
              className="min-h-[44px] px-4 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleStockInNew}
              disabled={submitting || !recognizedItem.name.trim()}
              className="flex-1 min-h-[44px] bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] disabled:opacity-40 text-[#09090B] font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              <span>
                {submitting ? 'Creazione in corso…' : 'Salva nel Catalogo & Immagazzina'}
              </span>
            </button>
          </div>
        </SurfaceCard>
      )}

      {/* Session History */}
      {history.length > 0 && (
        <SurfaceCard
          header={{
            title: 'Ultime Scansioni Sessione',
            icon: Boxes,
            action: (
              <StatusBadge tone="neutral" size="sm">
                {history.length} articoli
              </StatusBadge>
            ),
          }}
          padding="none"
        >
          <div className="divide-y divide-[var(--border-subtle)]">
            {history.map((h, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="font-semibold text-[var(--text-primary)] truncate block">
                    {h.name}
                  </span>
                  <span className="text-[var(--text-muted)] text-[11px] font-mono">
                    Tg. {h.size}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <StatusBadge tone="operational" size="sm">
                    +{h.quantity} pz
                  </StatusBadge>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
                    {h.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      {/* Inline Barcode Entry Modal (replaces window.prompt) */}
      {isBarcodePromptOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prompt-barcode-title"
        >
          <div className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2
                id="prompt-barcode-title"
                className="font-display text-sm font-bold text-[var(--text-primary)]"
              >
                Inserisci Codice a Barre / EAN
              </h2>
              <button
                type="button"
                onClick={() => setIsBarcodePromptOpen(false)}
                aria-label="Chiudi"
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (promptBarcodeValue.trim()) {
                  setIsBarcodePromptOpen(false);
                  handleBarcodeDetected(promptBarcodeValue.trim());
                }
              }}
              className="space-y-3"
            >
              <div>
                <label htmlFor="prompt-barcode-input" className="sr-only">
                  Codice a barre o EAN
                </label>
                <input
                  id="prompt-barcode-input"
                  type="text"
                  required
                  value={promptBarcodeValue}
                  onChange={(e) => setPromptBarcodeValue(e.target.value)}
                  placeholder="es. 8051234567890…"
                  className="w-full min-h-[44px] px-3 py-2 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBarcodePromptOpen(false)}
                  className="px-3.5 min-h-[40px] text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 min-h-[40px] text-xs font-bold rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] cursor-pointer"
                >
                  Cerca Barcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

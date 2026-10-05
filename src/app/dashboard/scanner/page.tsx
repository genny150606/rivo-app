'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  Barcode, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  PackagePlus, 
  RefreshCw, 
  Flashlight, 
  Plus, 
  Minus, 
  ArrowLeft,
  Search,
  Check,
  Zap,
  Boxes,
  Upload,
  Volume2,
  VolumeX,
  Layers,
  Sparkle
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
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
  const [magicalFlash, setMagicalFlash] = useState(false);

  // Scan History
  const [history, setHistory] = useState<Array<{ name: string; size: string; quantity: number; time: string }>>([]);

  // Harmonic Sci-Fi Crystal Chime Synthesizer
  const playMagicalChime = useCallback(() => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Dual-tone harmonic crystal chime: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz)
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

    if ('vibrate' in navigator) {
      navigator.vibrate([50, 40, 90]);
    }
  }, [audioEnabled]);

  // Launch celebratory confetti burst
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#BFFF00', '#10B981', '#38BDF8', '#A855F7'],
        disableForReducedMotion: true,
      });
    } catch {
      // Confetti fallback
    }
  };

  // Robust Camera Starter with Multi-Tier Fallback Cascade
  const startCamera = async () => {
    setCameraError(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Il tuo browser non supporta lo streaming video diretto. Usa il tasto "Scatta Foto Scatola".');
      return;
    }

    const attempts: MediaStreamConstraints[] = [
      // 1. Ideal Environment (Rear) with 720p
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } },
      // 2. Strict Environment (Rear)
      { video: { facingMode: 'environment' } },
      // 3. Any Available Video Camera
      { video: true },
    ];

    let mediaStream: MediaStream | null = null;
    let lastErr: any = null;

    for (const constraints of attempts) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (mediaStream) break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!mediaStream) {
      console.warn('Camera cascade failed:', lastErr);
      setCameraError('Permesso fotocamera negato o fotocamera occupata da un’altra app. Tocca "Attiva Fotocamera" o usa "Scatta Foto".');
      setCameraActive(false);
      return;
    }

    setStream(mediaStream);
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('webkit-playsinline', 'true');
      try {
        await videoRef.current.play();
      } catch (playErr) {
        console.warn('Video play error:', playErr);
      }
    }
    setCameraActive(true);
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    // Attempt camera start on mount
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Torch toggle
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && (track.getCapabilities() as any)?.torch) {
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      } catch (e) {
        console.warn('Torch error:', e);
      }
    }
  };

  // Barcode Detection Loop using BarcodeDetector API if available
  useEffect(() => {
    if (!cameraActive || !videoRef.current) return;

    let active = true;
    let detector: any = null;

    if ('BarcodeDetector' in window) {
      try {
        detector = new (window as any).BarcodeDetector({
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
  }, [cameraActive, lookupLoading, existingItem, recognizedItem, lastScannedCode]);

  // Handle scanned or searched barcode
  const handleBarcodeDetected = async (code: string) => {
    setLastScannedCode(code);
    playMagicalChime();
    setMagicalFlash(true);
    setTimeout(() => setMagicalFlash(false), 400);

    setLookupLoading(true);
    setSuccessMessage(null);
    setExistingItem(null);
    setRecognizedItem(null);
    setQuantityToAdd(1);

    try {
      const res = await fetch(`/api/ai/barcode-lookup?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (data.exists && data.item) {
        setExistingItem(data.item);

        // If continuous mode is enabled, immediately stock in +1 without prompts!
        if (continuousMode) {
          await executeImmediateStockIn(data.item.variantId, 1, data.item.name, data.item.size);
        }
      } else if (data.recognized) {
        setRecognizedItem(data.recognized);
      }
    } catch (err: any) {
      console.error('Barcode lookup error:', err);
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle Photo Capture / Box Label AI Vision
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingPhoto(true);
    setSuccessMessage(null);
    setExistingItem(null);
    setRecognizedItem(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        playMagicalChime();

        const res = await fetch('/api/ai/box-label-scanner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Errore analisi foto etichetta');

        if (data.recognized) {
          setRecognizedItem(data.recognized);
          setLastScannedCode(data.recognized.barcode);
          triggerConfetti();
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(`Errore AI Vision: ${err.message}`);
    } finally {
      setAnalyzingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Immediate Stock In for Continuous Mode
  const executeImmediateStockIn = async (variantId: string, qty: number, name: string, size: string) => {
    try {
      await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: variantId,
          type: 'purchase',
          quantity: qty,
          notes: 'Magic Scan Continuo',
        }),
      });

      triggerConfetti();
      setSuccessMessage(`✨ Immagazzinato al volo: +${qty} ${name} (Tg. ${size})`);
      setHistory(prev => [
        { name, size, quantity: qty, time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) },
        ...prev.slice(0, 9)
      ]);

      // Reset for next box in 1.5 seconds
      setTimeout(() => {
        setExistingItem(null);
        setLastScannedCode(null);
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Stock-In for EXISTING Item
  const handleStockInExisting = async () => {
    if (!existingItem) return;
    setSubmitting(true);
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

      triggerConfetti();
      setSuccessMessage(`✅ Caricati +${quantityToAdd} pezzi di ${existingItem.name} (Tg. ${existingItem.size})`);
      setHistory(prev => [
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Stock-In for NEW Recognized Item
  const handleStockInNew = async () => {
    if (!recognizedItem) return;
    setSubmitting(true);
    try {
      const instruction = `inserisci ${quantityToAdd} ${recognizedItem.name} di taglia ${recognizedItem.size} colore ${recognizedItem.color} a ${recognizedItem.sellingPrice} euro costo ${recognizedItem.costPrice}`;
      const res = await fetch('/api/ai/retail-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: instruction }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore creazione articolo');

      triggerConfetti();
      setSuccessMessage(`🎉 Creato e Immagazzinato: +${quantityToAdd} ${recognizedItem.name} (Tg. ${recognizedItem.size})`);
      setHistory(prev => [
        {
          name: recognizedItem.name,
          size: recognizedItem.size,
          quantity: quantityToAdd,
          time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 9),
      ]);
      setRecognizedItem(null);
      setLastScannedCode(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 space-y-4">
      {/* Top Mobile Bar */}
      <div className="flex items-center justify-between pt-2">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
            title={audioEnabled ? 'Audio Attivo' : 'Audio Disattivato'}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-lime-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
          </button>

          {/* Continuous Magic Mode Toggle */}
          <button
            type="button"
            onClick={() => setContinuousMode(!continuousMode)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              continuousMode 
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-sm shadow-amber-400/20' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
            title="Scan Continuo: aggiunge +1 automaticamente a ogni scansione"
          >
            <Zap className={`w-3 h-3 ${continuousMode ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
            <span>Scan Rapido</span>
          </button>
        </div>
      </div>

      {/* Hologram HUD Viewfinder */}
      <div className={`relative bg-zinc-950 rounded-3xl overflow-hidden aspect-[4/3] border-2 transition-all duration-300 shadow-2xl flex items-center justify-center ${
        magicalFlash 
          ? 'border-lime-400 shadow-[0_0_50px_rgba(190,255,0,0.6)] scale-[1.02]' 
          : 'border-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.8)]'
      }`}>
        {cameraActive ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />

            {/* Futuristic Holographic Reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="relative w-64 h-36 rounded-2xl border border-lime-400/40 bg-lime-400/[0.03] backdrop-blur-[1px] shadow-[inset_0_0_20px_rgba(190,255,0,0.15)] flex items-center justify-center">
                {/* Glowing Corner Brackets */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-lime-400 rounded-tl-xl shadow-[0_0_10px_#bfff00]" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-lime-400 rounded-tr-xl shadow-[0_0_10px_#bfff00]" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-lime-400 rounded-bl-xl shadow-[0_0_10px_#bfff00]" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-lime-400 rounded-br-xl shadow-[0_0_10px_#bfff00]" />

                {/* Sweeping Laser Line */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-lime-400 to-transparent shadow-[0_0_12px_#bfff00] animate-bounce top-1/2" />

                {/* Subtitle HUD */}
                <div className="absolute -bottom-7 inset-x-0 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 border border-lime-400/30 text-[10px] font-mono uppercase tracking-widest text-lime-400 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping" />
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
                className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                  torchOn ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30' : 'bg-black/60 text-white hover:bg-black/80'
                }`}
                title="Torcia"
              >
                <Flashlight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { stopCamera(); startCamera(); }}
                className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
                title="Riavvia Fotocamera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Camera className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white">Fotocamera Pronta per lo Scan</p>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                {cameraError || 'Inquadra le scatole delle scarpe per immagazzinarle in tempo reale.'}
              </p>
            </div>
            <button
              onClick={startCamera}
              className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl text-xs shadow-lg shadow-lime-400/20 active:scale-95 transition-all"
            >
              Attiva Fotocamera
            </button>
          </div>
        )}

        {/* Loading / Vision Overlay */}
        {(lookupLoading || analyzingPhoto) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <RefreshCw className="w-10 h-10 text-lime-400 animate-spin" />
              <Sparkles className="w-4 h-4 text-lime-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-xs font-bold text-white tracking-wide">
              {analyzingPhoto ? 'Analisi Visiva Etichetta con AI...' : 'Riconoscimento Calzatura AI...'}
            </span>
          </div>
        )}
      </div>

      {/* Magic Action Strip: Photo Label Snap & Barcode Search */}
      <div className="grid grid-cols-2 gap-2">
        {/* Hidden Camera File Input */}
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
          className="p-3 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-900/60 hover:to-indigo-900/60 border border-purple-500/30 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-purple-300 transition-all active:scale-[0.98]"
        >
          <Camera className="w-4 h-4 text-purple-400" />
          <span>Scatta Foto Scatola</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const code = prompt('Inserisci o incolla il codice a barre / EAN:');
            if (code && code.trim()) handleBarcodeDetected(code.trim());
          }}
          className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-zinc-300 transition-all active:scale-[0.98]"
        >
          <Barcode className="w-4 h-4 text-lime-400" />
          <span>Digita Barcode</span>
        </button>
      </div>

      {/* Manual Input Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Cerca barcode (es: 8051234567890)..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualCode.trim()) {
                handleBarcodeDetected(manualCode.trim());
              }
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
          />
        </div>
        <button
          onClick={() => {
            if (manualCode.trim()) handleBarcodeDetected(manualCode.trim());
          }}
          disabled={!manualCode.trim() || lookupLoading}
          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Cerca</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-lime-500/10 border-2 border-lime-500/40 rounded-2xl text-xs text-lime-400 font-bold flex items-center gap-3 shadow-lg shadow-lime-500/10 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-lime-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Case A: EXISTING ITEM DETECTED */}
      {existingItem && (
        <div className="bg-zinc-900 border-2 border-lime-400/50 rounded-3xl p-5 space-y-4 shadow-2xl shadow-lime-400/10 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-lime-400/20 text-lime-300 border border-lime-400/40">
              <Check className="w-3.5 h-3.5" />
              Articolo a Catalogo
            </span>
            <span className="text-xs font-mono text-zinc-400">{existingItem.barcode}</span>
          </div>

          <div>
            <h3 className="text-lg font-black text-white leading-tight">{existingItem.name}</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Brand: <strong className="text-zinc-200">{existingItem.brand}</strong> • Categoria: {existingItem.category}
            </p>
          </div>

          {/* Details & Current Stock */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-800 text-center">
            <div className="bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-700/50">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Taglia</div>
              <div className="text-lg font-black text-white">{existingItem.size}</div>
            </div>
            <div className="bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-700/50">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Giacenza</div>
              <div className="text-lg font-black text-lime-400">{existingItem.currentStock} pz</div>
            </div>
            <div className="bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-700/50">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Prezzo</div>
              <div className="text-lg font-black text-white">€ {existingItem.sellingPrice.toFixed(2)}</div>
            </div>
          </div>

          {/* Fast Increment Controls */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-semibold">Quantità da Caricare a Magazzino:</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                className="w-12 h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-xl active:scale-95 transition-all"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                min={1}
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center bg-black border border-zinc-700 rounded-2xl py-3 font-mono text-xl font-black text-white focus:outline-none focus:border-lime-400"
              />
              <button
                type="button"
                onClick={() => setQuantityToAdd(quantityToAdd + 1)}
                className="w-12 h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-xl active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2 pt-1">
              {[1, 2, 5, 10].map(qty => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setQuantityToAdd(qty)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    quantityToAdd === qty 
                      ? 'bg-lime-400 text-black border-lime-400 shadow-md shadow-lime-400/30' 
                      : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  +{qty}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStockInExisting}
            disabled={submitting}
            className="w-full py-4 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-lime-400/25 active:scale-[0.98] transition-all"
          >
            <PackagePlus className="w-5 h-5" />
            <span>{submitting ? 'Caricamento in corso...' : `Carica +${quantityToAdd} a Magazzino`}</span>
          </button>
        </div>
      )}

      {/* Case B: NEW RECOGNIZED ITEM (AI VISION) */}
      {recognizedItem && (
        <div className="bg-zinc-900 border-2 border-purple-500/50 rounded-3xl p-5 space-y-4 shadow-2xl shadow-purple-500/10 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
              Riconosciuto da AI Vision
            </span>
            <span className="text-xs font-mono text-zinc-400">{recognizedItem.barcode}</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-400 uppercase font-bold">Modello Scarpa / Prodotto</label>
              <input
                type="text"
                value={recognizedItem.name}
                onChange={(e) => setRecognizedItem({ ...recognizedItem, name: e.target.value })}
                className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Brand</label>
                <input
                  type="text"
                  value={recognizedItem.brand}
                  onChange={(e) => setRecognizedItem({ ...recognizedItem, brand: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Numero / Taglia</label>
                <input
                  type="text"
                  value={recognizedItem.size}
                  onChange={(e) => setRecognizedItem({ ...recognizedItem, size: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-extrabold text-center focus:outline-none focus:border-purple-400 text-lime-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Prezzo Vendita (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={recognizedItem.sellingPrice}
                  onChange={(e) => setRecognizedItem({ ...recognizedItem, sellingPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Prezzo Costo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={recognizedItem.costPrice}
                  onChange={(e) => setRecognizedItem({ ...recognizedItem, costPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase font-bold">Quantità Iniziale da Immagazzinare</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={1}
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center bg-black border border-zinc-700 rounded-xl py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-400"
                />
                <span className="text-xs text-zinc-400 font-medium">paia di scarpe</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleStockInNew}
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-lime-500 hover:from-purple-500 hover:to-lime-400 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-purple-500/25 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span>{submitting ? 'Creazione in corso...' : 'Salva nel Catalogo & Immagazzina'}</span>
          </button>
        </div>
      )}

      {/* Session History */}
      {history.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold flex items-center gap-2 text-white">
              <Boxes className="w-4 h-4 text-lime-400" />
              Ultime Scansioni Sessione
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-bold">
              {history.length} articoli
            </span>
          </div>

          <div className="divide-y divide-zinc-800">
            {history.map((h, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{h.name}</span>
                  <span className="text-zinc-400 text-[11px] ml-2 font-mono">Tg. {h.size}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-black text-lime-400">+{h.quantity} pz</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{h.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

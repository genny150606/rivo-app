'use client';

import { useState, useEffect, useRef } from 'react';
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
  Sliders,
  Check,
  Zap,
  Boxes
} from 'lucide-react';
import Link from 'next/link';

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
  suggestedQuantity: number;
}

export default function MobileScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);

  // Scanning & Detection State
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Result Cards
  const [existingItem, setExistingItem] = useState<ExistingItem | null>(null);
  const [recognizedItem, setRecognizedItem] = useState<RecognizedItem | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Scan History
  const [history, setHistory] = useState<Array<{ name: string; size: string; quantity: number; time: string }>>([]);

  // Beep Audio
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {
      // AudioContext not allowed or not supported
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(80);
    }
  };

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Permesso fotocamera non concesso o non disponibile su questo dispositivo.');
      setCameraActive(false);
    }
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
        console.warn('BarcodeDetector error:', e);
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
          // Frame error, continue
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
    playBeep();
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
      } else if (data.recognized) {
        setRecognizedItem(data.recognized);
      }
    } catch (err: any) {
      console.error('Barcode lookup error:', err);
    } finally {
      setLookupLoading(false);
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
          notes: `Carico rapido da Scanner Mobile (Barcode: ${existingItem.barcode})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore caricamento');

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
      // Use Retail Assistant API to atomically create product, variant, and stock
      const instruction = `inserisci ${quantityToAdd} ${recognizedItem.name} di taglia ${recognizedItem.size} colore ${recognizedItem.color} a ${recognizedItem.sellingPrice} euro costo ${recognizedItem.costPrice}`;
      const res = await fetch('/api/ai/retail-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: instruction }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore creazione articolo');

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
    <div className="max-w-md mx-auto min-h-screen pb-20 space-y-4">
      {/* Top Mobile Bar */}
      <div className="flex items-center justify-between pt-2">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-lime-500/10 border border-lime-500/20 rounded-full">
          <Zap className="w-3.5 h-3.5 text-lime-400 animate-pulse" />
          <span className="text-xs font-semibold text-lime-400 uppercase tracking-wider">Scanner Retail AI</span>
        </div>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] border border-zinc-800 shadow-2xl flex items-center justify-center">
        {cameraActive ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            {/* Reticle / Aim Box */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-36 border-2 border-lime-400/80 rounded-xl bg-lime-400/5 shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                {/* Red Laser Sweep Line */}
                <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-bounce top-1/2" />
                <div className="absolute -top-6 inset-x-0 text-center text-[10px] font-mono uppercase tracking-widest text-lime-400 bg-black/60 py-0.5 rounded">
                  Inquadra Codice a Barre
                </div>
              </div>
            </div>

            {/* Viewfinder Controls */}
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
                title="Ricarica Fotocamera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-6 space-y-3">
            <Camera className="w-12 h-12 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400">{cameraError || 'Fotocamera non attiva'}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-lime-400 text-black font-semibold rounded-lg text-xs"
            >
              Attiva Fotocamera
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {lookupLoading && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-lime-400 animate-spin" />
            <span className="text-sm font-medium text-white">Riconoscimento Articolo AI...</span>
          </div>
        )}
      </div>

      {/* Manual Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Scrivi o incolla codice a barre..."
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
        <div className="p-3.5 bg-lime-500/10 border border-lime-500/30 rounded-xl text-xs text-lime-400 font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Case A: EXISTING ITEM DETECTED */}
      {existingItem && (
        <div className="bg-zinc-900 border-2 border-lime-500/40 rounded-2xl p-4 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-lime-500/20 text-lime-400 border border-lime-500/30">
              <Check className="w-3 h-3" />
              Articolo a Catalogo
            </span>
            <span className="text-xs font-mono text-zinc-500">{existingItem.barcode}</span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white leading-tight">{existingItem.name}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Brand: <strong className="text-zinc-200">{existingItem.brand}</strong> • Categoria: {existingItem.category}
            </p>
          </div>

          {/* Details & Current Stock */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-800 text-center">
            <div className="bg-zinc-800/50 p-2 rounded-lg">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Taglia</div>
              <div className="text-base font-black text-white">{existingItem.size}</div>
            </div>
            <div className="bg-zinc-800/50 p-2 rounded-lg">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Giacenza</div>
              <div className="text-base font-black text-lime-400">{existingItem.currentStock} pz</div>
            </div>
            <div className="bg-zinc-800/50 p-2 rounded-lg">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Prezzo</div>
              <div className="text-base font-black text-white">{existingItem.sellingPrice.toFixed(2)} €</div>
            </div>
          </div>

          {/* Fast Increment Controls */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-medium">Quantità da Caricare a Magazzino:</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={1}
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center bg-black border border-zinc-700 rounded-xl py-2 font-mono text-lg font-bold text-white focus:outline-none focus:border-lime-400"
              />
              <button
                type="button"
                onClick={() => setQuantityToAdd(quantityToAdd + 1)}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-1.5 pt-1">
              {[1, 2, 5, 10].map(qty => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setQuantityToAdd(qty)}
                  className={`flex-1 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    quantityToAdd === qty 
                      ? 'bg-lime-400 text-black border-lime-400' 
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
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
            className="w-full py-3.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 active:scale-[0.98] transition-all"
          >
            <PackagePlus className="w-4 h-4" />
            <span>{submitting ? 'Caricamento in corso...' : `Carica +${quantityToAdd} a Magazzino`}</span>
          </button>
        </div>
      )}

      {/* Case B: NEW RECOGNIZED ITEM (AI) */}
      {recognizedItem && (
        <div className="bg-zinc-900 border-2 border-indigo-500/40 rounded-2xl p-4 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Riconosciuto da AI
            </span>
            <span className="text-xs font-mono text-zinc-500">{recognizedItem.barcode}</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-400 uppercase font-bold">Modello Scarpa / Prodotto</label>
              <input
                type="text"
                value={recognizedItem.name}
                onChange={(e) => setRecognizedItem({ ...recognizedItem, name: e.target.value })}
                className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Brand</label>
                <input
                  type="text"
                  value={recognizedItem.brand}
                  onChange={(e) => setRecognizedItem({ ...recognizedItem, brand: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Numero / Taglia</label>
                <input
                  type="text"
                  value={recognizedItem.size}
                  onChange={(e) => setRecognizedItem({ ...recognizedItem, size: e.target.value })}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold text-center focus:outline-none focus:border-indigo-400"
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
                  className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Prezzo Costo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={recognizedItem.costPrice}
                  onChange={(e) => setRecognizedItem({ ...recognizedItem, costPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase font-bold">Quantità Iniziale da Caricare</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={1}
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center bg-black border border-zinc-700 rounded-lg py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-400"
                />
                <span className="text-xs text-zinc-400">paia di scarpe</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleStockInNew}
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{submitting ? 'Salvataggio in corso...' : 'Crea Prodotto & Immagazzina Subito'}</span>
          </button>
        </div>
      )}

      {/* Session History */}
      {history.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-lime-400" />
              Ultimi Articoli Immagazzinati
            </span>
            <span className="text-[10px] font-mono text-zinc-500">{history.length} articoli</span>
          </div>

          <div className="divide-y divide-zinc-800">
            {history.map((h, i) => (
              <div key={i} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-white">{h.name}</span>
                  <span className="text-zinc-500 text-[11px] ml-2">Tg. {h.size}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lime-400">+{h.quantity}</span>
                  <span className="text-[10px] text-zinc-500">{h.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

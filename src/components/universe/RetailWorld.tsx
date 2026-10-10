'use client';

import { useState } from 'react';
import Link from 'next/link';
import { universeAudio } from './UniverseAudio';
import {
  Package,
  Scan,
  Barcode,
  Layers,
  CheckCircle,
  ExternalLink,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface RetailWorldProps {
  onClose: () => void;
}

export default function RetailWorld({ onClose }: RetailWorldProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(true);

  const triggerScan = () => {
    setIsScanning(true);
    universeAudio.playScanBeam();
    setTimeout(() => {
      universeAudio.playClick();
      setIsScanning(false);
      setHasScanned(true);
    }, 700);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl bg-zinc-950/95 border border-zinc-800 p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-white animate-in fade-in zoom-in-95 duration-300">
      
      {/* World Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-zinc-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#00FF66] uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            <span>WORLD 02 • RETAIL & INVENTORY REASONING</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] mt-1">
            PHYSICAL PRODUCT TO STRUCTURED DIGITAL RECORD
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/inventory"
            target="_blank"
            onClick={() => universeAudio.playClick()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white hover:border-[#00FF66] transition-colors"
          >
            <span>APRI /dashboard/inventory</span>
            <ExternalLink size={12} />
          </Link>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-full bg-zinc-900 text-xs font-mono text-zinc-400 hover:text-white border border-zinc-800"
          >
            CHIUDI MONDO [ESC]
          </button>
        </div>
      </div>

      {/* Interactive Scan Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-6">
        
        {/* Left: The Physical Item with Scanning Laser Plane */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-2xl bg-gradient-to-b from-[#141418] to-[#09090b] border border-zinc-700 p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
            
            {/* Laser scanning beam line */}
            <div
              className={`absolute left-0 right-0 h-1 bg-[#00FF66] shadow-[0_0_20px_#00FF66] transition-all duration-700 pointer-events-none ${
                isScanning ? 'top-[90%] opacity-100' : 'top-[10%] opacity-40'
              }`}
            />

            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
              <span>RFID/NFC TYPE 5</span>
              <span className="text-[#00FF66]">EDGE VERIFIED</span>
            </div>

            {/* Stylized Product Silhouette */}
            <div className="my-auto flex flex-col items-center">
              <div className="w-20 h-44 rounded-xl border border-zinc-600 bg-zinc-900/80 flex flex-col items-center justify-between p-3 relative shadow-lg">
                <div className="w-8 h-4 bg-zinc-800 rounded-t" />
                <div className="w-full py-4 px-2 rounded bg-zinc-950 border border-zinc-800 text-center">
                  <span className="text-[8px] font-mono tracking-widest text-[#00FF66] uppercase block">
                    RIVO AUTH
                  </span>
                  <Barcode size={32} className="mx-auto text-zinc-300 mt-1" />
                </div>
                <div className="w-12 h-2 bg-zinc-800 rounded-b" />
              </div>
            </div>

            {/* Action Trigger */}
            <button
              onClick={triggerScan}
              className="w-full py-2.5 rounded-xl bg-[#00FF66] text-black font-bold text-xs font-mono uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(0,255,102,0.4)] flex items-center justify-center gap-2"
            >
              <Scan size={14} className={isScanning ? 'animate-spin' : ''} />
              <span>{isScanning ? 'SCANSIONE IN CORSO...' : 'RI-ATTIVA SCANSIONE'}</span>
            </button>
          </div>
        </div>

        {/* Right: The Structured Digital Record */}
        <div className="lg:col-span-7 flex flex-col gap-4 text-left">
          
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-3 border-b border-zinc-800">
              <span className="text-[#00FF66] font-bold">DIGITAL INVENTORY RECORD</span>
              <span>SKU: #RVO-9924-TIG</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">PRODOTTO & ANNATA</span>
                <div className="font-bold text-white text-sm mt-0.5">Tignanello Toscana IGT 2021</div>
                <div className="text-xs text-zinc-400">Tenuta Tignanello • Marchesi Antinori</div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">CODICE A BARRE EAN-13</span>
                <div className="font-mono text-white text-sm mt-0.5">8001234567890</div>
                <div className="text-xs text-emerald-400">Verificato via RIVO Barcode API</div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">GIACENZA MAGAZZINO</span>
                <div className="font-bold text-[#00FF66] font-mono text-base mt-0.5">24 IN CANTINA</div>
                <div className="text-xs text-zinc-400">120 nel deposito centrale hub</div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">COLLOCAZIONE FISICA</span>
                <div className="font-bold text-white text-sm mt-0.5">Scaffale A-03 • Posizione 14</div>
                <div className="text-xs text-zinc-400">Tracciamento RFID in tempo reale</div>
              </div>
            </div>
          </div>

          {/* Quick links to real features */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/scanner"
              onClick={() => universeAudio.playClick()}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 hover:border-[#00FF66] transition-colors"
            >
              Scanner Box Etichette AI →
            </Link>
            <Link
              href="/dashboard/products"
              onClick={() => universeAudio.playClick()}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 hover:border-[#00FF66] transition-colors"
            >
              Catalogo Prodotti Cloud →
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}

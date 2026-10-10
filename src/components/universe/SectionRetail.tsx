'use client';

import { useState } from 'react';
import Link from 'next/link';
import { universeAudio } from './UniverseAudio';
import {
  Scan,
  Barcode,
  ExternalLink,
  Layers,
  CheckCircle,
} from 'lucide-react';

export default function SectionRetail() {
  const [isScanning, setIsScanning] = useState(false);

  const triggerScan = () => {
    setIsScanning(true);
    universeAudio.playScanBeam();
    setTimeout(() => {
      universeAudio.playClick();
      setIsScanning(false);
    }, 700);
  };

  return (
    <section
      id="retail"
      className="relative min-h-screen w-full py-28 px-4 sm:px-6 lg:px-8 flex flex-col justify-center border-t border-zinc-900/60"
    >
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-mono tracking-widest uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#00FF66]" />
            <span>WORLD 02 • RETAIL & INVENTORY</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.03em] text-white font-['Space_Grotesk'] leading-tight">
            PHYSICAL PRODUCT TO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#00FF66]">
              STRUCTURED DIGITAL RECORD.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Ogni cartellino, bottiglia o packaging si trasforma all'istante in un record di magazzino cloud sincronizzato con tracciamento EAN-13 e verifica RFID.
          </p>
        </div>

        {/* The Scanning Stage Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-zinc-950/80 border border-zinc-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          {/* Left: Physical Product with Laser Scanning Plane */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-[300px] aspect-[3/4] rounded-2xl bg-gradient-to-b from-[#141418] to-[#09090c] border border-zinc-700 p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
              
              {/* Animated Laser Plane */}
              <div
                className={`absolute left-0 right-0 h-1 bg-[#00FF66] shadow-[0_0_20px_#00FF66] transition-all duration-700 pointer-events-none ${
                  isScanning ? 'top-[90%] opacity-100' : 'top-[15%] opacity-40'
                }`}
              />

              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                <span>RFID/NFC TYPE 5</span>
                <span className="text-[#00FF66]">AUTENTICATO</span>
              </div>

              {/* Physical Product Silhouette */}
              <div className="my-auto flex flex-col items-center">
                <div className="w-20 h-44 rounded-xl border border-zinc-600 bg-zinc-900/90 flex flex-col items-center justify-between p-3 relative shadow-lg">
                  <div className="w-8 h-4 bg-zinc-800 rounded-t" />
                  <div className="w-full py-4 px-2 rounded bg-zinc-950 border border-zinc-800 text-center">
                    <span className="text-[8px] font-mono tracking-widest text-[#00FF66] uppercase block">
                      RIVO TAG
                    </span>
                    <Barcode size={32} className="mx-auto text-zinc-300 mt-1" />
                  </div>
                  <div className="w-12 h-2 bg-zinc-800 rounded-b" />
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={triggerScan}
                className="w-full py-2.5 rounded-xl bg-[#00FF66] hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,255,102,0.4)] flex items-center justify-center gap-2"
              >
                <Scan size={14} className={isScanning ? 'animate-spin' : ''} />
                <span>{isScanning ? 'SCANSIONE LASER...' : 'ATTIVA SCANSIONE LASER'}</span>
              </button>
            </div>
          </div>

          {/* Right: Digital Record Details & Dashboard Link */}
          <div className="lg:col-span-7 flex flex-col gap-4 text-left">
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
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

            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Link
                href="/dashboard/inventory"
                onClick={() => universeAudio.playClick()}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 hover:border-[#00FF66] transition-colors flex items-center gap-2"
              >
                <span>Gestione Magazzino Cloud</span>
                <ExternalLink size={13} />
              </Link>
              <Link
                href="/dashboard/scanner"
                onClick={() => universeAudio.playClick()}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 hover:border-[#00FF66] transition-colors flex items-center gap-2"
              >
                <span>Scanner Box Etichette AI</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  ShoppingBag,
  BellRing,
  Wine,
  ScanLine,
  Sliders,
  Bot,
  Check,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

type VerticalType = 'restaurant' | 'retail';

interface WinePairingOption {
  dish: string;
  wine: string;
  region: string;
  temperature: string;
  tastingNote: string;
  marginBoost: string;
}

const WINE_OPTIONS: WinePairingOption[] = [
  {
    dish: 'Tagliata di Manzo al Rosmarino',
    wine: 'Barolo DOCG 2019 — Cascina Francia',
    region: 'Piemonte',
    temperature: '18°C',
    tastingNote:
      'Tannino setoso, note di viola appassita e liquirizia perfetta per sgrassare la fibra del manzo.',
    marginBoost: '+34% sul conto medio tavolo',
  },
  {
    dish: 'Risotto Carnaroli ai Frutti di Mare',
    wine: 'Greco di Tufo DOCG — Pietracupa',
    region: 'Campania',
    temperature: '10°C',
    tastingNote:
      'Mineralità sulfurea tagliente, agrumi gialli e persistenza salina che esalta crostacei e molluschi.',
    marginBoost: '+28% sul conto medio tavolo',
  },
  {
    dish: 'Fettuccine al Tartufo Bianco & Porcini',
    wine: 'Etna Rosso DOC — Contrada Santo Spirito',
    region: 'Sicilia',
    temperature: '16°C',
    tastingNote:
      'Eleganza vulcanica, pepe nero e sottobosco in equilibrio con la nota aromatica del tartufo.',
    marginBoost: '+42% sul conto medio tavolo',
  },
];

export default function LandingDualVertical() {
  const [vertical, setVertical] = useState<VerticalType>('restaurant');

  const [selectedTable, setSelectedTable] = useState<number>(3);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [splitGuests, setSplitGuests] = useState<number>(2);
  const [selectedWineDish, setSelectedWineDish] = useState<number>(0);

  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(false);
  const [scannedShoe, setScannedShoe] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('42');

  const baseBill = 86.0;
  const splitAmount = (baseBill / splitGuests).toFixed(2);
  const currentWine = WINE_OPTIONS[selectedWineDish];

  return (
    <section id="dual-vertical" className="py-20 px-4 sm:px-6 relative z-10 overflow-x-clip">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#111215] border border-white/[0.08] text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
            <span>ARCHITETTURA MULTI-VERTICALE</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F4F6]">
            Due Settori Specializzati.
            <br />
            Un Unico Sistema Operativo.
          </h2>
          <p className="text-[#A1A1AA] text-sm sm:text-base mt-3 max-w-xl mx-auto">
            RIVO adatta moduli e flussi in base al punto vendita: comande e sala per l&apos;Hospitality, magazzino taglie e cassa rapida per il Retail.
          </p>

          {/* Responsive Vertical Switcher */}
          <div className="flex justify-center mt-8">
            <div className="inline-flex flex-wrap sm:flex-nowrap justify-center p-1 rounded-xl bg-[#111215] border border-white/[0.1] gap-1 max-w-full">
              <button
                type="button"
                onClick={() => setVertical('restaurant')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[42px] cursor-pointer ${
                  vertical === 'restaurant'
                    ? 'bg-[#BFFF00] text-[#09090B] font-bold'
                    : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Ristorazione &amp; Sala</span>
              </button>

              <button
                type="button"
                onClick={() => setVertical('retail')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[42px] cursor-pointer ${
                  vertical === 'retail'
                    ? 'bg-[#BFFF00] text-[#09090B] font-bold'
                    : 'text-[#A1A1AA] hover:text-[#F4F4F6]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Retail &amp; ERP Veloce</span>
              </button>
            </div>
          </div>
        </div>

        {/* MODE 1: HOSPITALITY */}
        {vertical === 'restaurant' && (
          <div className="space-y-6" id="ristorazione">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Feature 1: Sala & Chiamata Cameriere */}
              <div className="lg:col-span-7 p-6 rounded-2xl bg-[#111215] border border-white/[0.08] flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 px-2 py-0.5 rounded">
                      SALA &amp; STAFF DISPATCH
                    </span>
                    <span className="text-xs font-mono text-[#71717A]">Clicca un tavolo</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#F4F4F6] tracking-tight">
                    Mappa Tavoli &amp; Chiamata Cameriere in 0.4s
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1.5 leading-relaxed">
                    L&apos;ospite tocca il supporto NFC sul tavolo e richiede assistenza o refill. L&apos;allerta arriva sullo smartwatch di sala e su Telegram in tempo reale.
                  </p>
                </div>

                <div className="my-6 p-4 rounded-xl bg-[#09090B] border border-white/[0.08]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3 text-[#A1A1AA]">
                    <span className="font-semibold text-[#F4F4F6]">Planimetria Sala Principale</span>
                    <span className="font-mono text-[#10B981]">6 Tavoli Configurati NFC</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((tNum) => {
                      const isSelected = selectedTable === tNum;
                      const hasCall = tNum === 3 && waiterCalled;
                      return (
                        <button
                          key={tNum}
                          type="button"
                          onClick={() => {
                            setSelectedTable(tNum);
                            if (tNum === 3) setWaiterCalled((prev) => !prev);
                          }}
                          className={`p-3 rounded-xl border text-center transition-colors min-h-[56px] cursor-pointer ${
                            hasCall
                              ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B] font-bold'
                              : isSelected
                              ? 'bg-[#18191D] border-[#BFFF00] text-[#F4F4F6] font-bold'
                              : 'bg-[#111215] border-white/[0.08] text-[#A1A1AA] hover:border-white/[0.2]'
                          }`}
                        >
                          <div className="text-sm font-mono font-bold">T{tNum}</div>
                          <div className="text-[9px] uppercase tracking-wider truncate mt-1">
                            {hasCall ? 'Chiamata' : tNum % 2 === 0 ? 'Libero' : 'Occupato'}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[#A1A1AA]">Tavolo Selezionato: </span>
                      <span className="font-bold text-[#F4F4F6]">Tavolo {selectedTable}</span>
                      <span className="mx-2 text-[#71717A]">•</span>
                      <span className="text-[#A1A1AA]">Coperti: </span>
                      <span className="font-mono text-[#F4F4F6] tabular-nums">4</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setWaiterCalled((prev) => !prev)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[38px] cursor-pointer ${
                        waiterCalled
                          ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/35'
                          : 'bg-[#BFFF00] text-[#09090B]'
                      }`}
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>{waiterCalled ? 'Annulla Notifica Sala' : 'Simula Chiamata Ospite'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                  <Clock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span>Tempo medio risposta ridotto da 4.8 min a 45 secondi.</span>
                </div>
              </div>

              {/* Feature 2: Smart Bill & Divisione */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-[#111215] border border-white/[0.08] flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 px-2 py-0.5 rounded">
                      FINTECH AL TAVOLO
                    </span>
                    <span className="text-xs font-mono text-[#71717A]">Zero Code in Cassa</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#F4F4F6] tracking-tight">
                    Smart Bill &amp; Divisione Conto
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1.5 leading-relaxed">
                    I commensali dividono il conto istantaneamente dallo smartphone, con richiesta di ricevuta o fattura elettronica SDI precompilata.
                  </p>
                </div>

                <div className="my-6 p-4 rounded-xl bg-[#09090B] border border-white/[0.08] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <span className="text-xs text-[#A1A1AA]">Totale Conto Tavolo:</span>
                    <span className="text-xl font-bold font-mono text-[#F4F4F6] tabular-nums">
                      € {baseBill.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#A1A1AA] mb-2 font-medium">
                      Dividi tra commensali:
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSplitGuests(num)}
                          className={`py-2 rounded-lg text-xs font-bold font-mono transition-colors min-h-[40px] cursor-pointer ${
                            splitGuests === num
                              ? 'bg-[#BFFF00] text-[#09090B]'
                              : 'bg-[#18191D] text-[#A1A1AA] hover:text-[#F4F4F6] border border-white/[0.08]'
                          }`}
                        >
                          {num} Persone
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#111215] border border-[#10B981]/25 text-center">
                    <span className="text-[11px] text-[#A1A1AA]">Quota per persona:</span>
                    <div className="text-2xl font-bold font-mono text-[#BFFF00] tabular-nums mt-0.5">
                      € {splitAmount}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1A1AA] pt-2 border-t border-white/[0.08]">
                  <span className="flex items-center gap-1.5 text-[#F4F4F6]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    Apple Pay, Google Pay e POS al tavolo
                  </span>
                  <span className="font-mono text-[#71717A]">SDI READY</span>
                </div>
              </div>
            </div>

            {/* Feature 3: AI Sommelier */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#111215] border border-white/[0.08]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 px-2 py-0.5 rounded">
                      RIVO AI SOMMELIER
                    </span>
                    <span className="text-xs font-mono text-[#71717A]">Algoritmo Pairing &amp; Margine</span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#F4F4F6] tracking-tight">
                    Abbinamento Calice Intelligente al Tavolo
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-2xl mt-1">
                    Seleziona un piatto dal menu digitale: RIVO suggerisce il vino disponibile nella cantina del locale con note di degustazione e temperatura di servizio.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] shrink-0">
                  <span>+34% Scontrino Medio Vino</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                {WINE_OPTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedWineDish(idx)}
                    className={`p-3.5 rounded-xl border text-left transition-colors min-h-[60px] cursor-pointer min-w-0 ${
                      selectedWineDish === idx
                        ? 'bg-[#18191D] border-[#BFFF00] text-[#F4F4F6]'
                        : 'bg-[#09090B] border-white/[0.08] hover:border-white/[0.2] text-[#A1A1AA]'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-mono text-[#71717A]">Piatto Selezionato</div>
                    <div className="text-xs sm:text-sm font-semibold text-[#F4F4F6] mt-0.5 truncate">
                      {item.dish}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-5 rounded-xl bg-[#09090B] border border-white/[0.08] grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                <div className="lg:col-span-4 flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#18191D] border border-white/[0.12] flex items-center justify-center shrink-0">
                    <Wine className="w-5 h-5 text-[#BFFF00]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#BFFF00]">
                      {currentWine.region} • Servizio {currentWine.temperature}
                    </span>
                    <div className="text-sm sm:text-base font-bold text-[#F4F4F6] mt-0.5">
                      {currentWine.wine}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 text-xs text-[#A1A1AA] leading-relaxed italic lg:border-l border-white/[0.08] lg:pl-4">
                  &quot;{currentWine.tastingNote}&quot;
                </div>

                <div className="lg:col-span-3 flex flex-col items-start lg:items-end justify-center">
                  <span className="text-[10px] font-mono text-[#71717A] uppercase">Impatto Finanziario</span>
                  <span className="text-sm font-bold text-[#10B981] font-mono mt-0.5">
                    {currentWine.marginBoost}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: RETAIL ERP */}
        {vertical === 'retail' && (
          <div className="space-y-6" id="retail">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Feature 1: Box Label Scanner */}
              <div className="lg:col-span-7 p-6 rounded-2xl bg-[#111215] border border-white/[0.08] flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 px-2 py-0.5 rounded">
                      VISION OCR &amp; BARCODE
                    </span>
                    <span className="text-xs font-mono text-[#71717A]">Carico Merce 0.3s</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#F4F4F6] tracking-tight">
                    AI Box Label &amp; Barcode Scanner
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1.5 leading-relaxed">
                    Inquadra l&apos;etichetta della scatola con lo smartphone: l&apos;OCR estrae SKU, taglie, colore e listino senza digitazione manuale.
                  </p>
                </div>

                <div className="my-6 p-4 rounded-xl bg-[#09090B] border border-white/[0.08]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-[#18191D] border border-[#10B981]/35 flex items-center justify-center shrink-0">
                        <ScanLine className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold text-[#F4F4F6] flex flex-wrap items-center gap-2">
                          <span>BOR-MOC-01</span>
                          <span className="text-[10px] bg-[#10B981]/15 text-[#10B981] px-1.5 py-0.5 rounded">
                            {scannedShoe ? 'SCARICO +1 REGISTRATO' : 'OCR VERIFICATO'}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-[#F4F4F6] truncate mt-0.5">
                          Mocassino Artigianale Borrelli
                        </div>
                        <div className="text-[11px] text-[#71717A] font-mono">
                          EAN: 8012345001426 • Pelle Abrasivata
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setScannedShoe((prev) => !prev)}
                      className="px-4 py-2.5 rounded-lg bg-[#BFFF00] text-[#09090B] font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 min-h-[40px] cursor-pointer"
                    >
                      <ScanLine className="w-3.5 h-3.5" />
                      <span>{scannedShoe ? 'Resetta Scanner' : 'Simula Scansione'}</span>
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-[#111215] border border-white/[0.06]">
                      <div className="text-[10px] text-[#71717A] font-mono">Prezzo</div>
                      <div className="font-bold text-[#F4F4F6] font-mono mt-0.5 tabular-nums">€ 149,00</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#111215] border border-white/[0.06]">
                      <div className="text-[10px] text-[#71717A] font-mono">Costo</div>
                      <div className="font-bold text-[#A1A1AA] font-mono mt-0.5 tabular-nums">€ 65,00</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#111215] border border-white/[0.06]">
                      <div className="text-[10px] text-[#71717A] font-mono">Margine</div>
                      <div className="font-bold text-[#10B981] font-mono mt-0.5 tabular-nums">56.4%</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#111215] border border-white/[0.06]">
                      <div className="text-[10px] text-[#71717A] font-mono">Giacenza</div>
                      <div className="font-bold text-[#F4F4F6] font-mono mt-0.5 tabular-nums">
                        {scannedShoe ? '17 paia' : '18 paia'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1A1AA]">
                  <span>Compatibile EAN-13, Code 128 e QR-Code.</span>
                  <span className="font-mono text-[#10B981]">ACCURATEZZA 99.8%</span>
                </div>
              </div>

              {/* Feature 2: Simple Mode Toggle */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-[#111215] border border-white/[0.08] flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#BFFF00]/15 text-[#BFFF00] border border-[#BFFF00]/30 px-2 py-0.5 rounded">
                      INTERFACCIA DUAL-MODE
                    </span>
                    <span className="text-xs font-mono text-[#71717A]">Training Staff: 0 Min</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#F4F4F6] tracking-tight">
                    Simple Mode: La Cassa a 3 Tasti
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1.5 leading-relaxed">
                    Con un clic si passa dalla modalità ERP completa alla vista essenziale da banco per velocizzare l&apos;operatività nelle ore di punta.
                  </p>
                </div>

                <div className="my-6 p-4 rounded-xl bg-[#09090B] border border-white/[0.08] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
                    <span className="text-xs text-[#A1A1AA] font-semibold">Stato Interfaccia:</span>
                    <button
                      type="button"
                      onClick={() => setIsSimpleMode((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 min-h-[38px] cursor-pointer ${
                        isSimpleMode
                          ? 'bg-[#BFFF00] text-[#09090B]'
                          : 'bg-[#18191D] text-[#F4F4F6] border border-white/[0.12]'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{isSimpleMode ? 'Simple Mode (Attiva)' : 'ERP Completa'}</span>
                    </button>
                  </div>

                  {isSimpleMode ? (
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono text-[#BFFF00] uppercase tracking-wider">
                        Vista Cassa Rapida Attiva:
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-lg bg-[#111215] border border-[#BFFF00]/35 text-center">
                          <span className="text-xs font-bold text-[#F4F4F6] block">1. Cassa</span>
                          <span className="text-[10px] text-[#71717A]">1-Touch POS</span>
                        </div>
                        <div className="p-3 rounded-lg bg-[#111215] border border-white/[0.1] text-center">
                          <span className="text-xs font-bold text-[#F4F4F6] block">2. Scanner</span>
                          <span className="text-[10px] text-[#71717A]">Camera HD</span>
                        </div>
                        <div className="p-3 rounded-lg bg-[#111215] border border-white/[0.1] text-center">
                          <span className="text-xs font-bold text-[#F4F4F6] block">3. Incasso</span>
                          <span className="text-[10px] text-[#71717A]">Ricevuta</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-[#A1A1AA]">
                      <div className="text-[10px] font-mono text-[#38BDF8] uppercase tracking-wider">
                        Vista ERP Completa (Direzione):
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#111215] border border-white/[0.06] flex justify-between">
                        <span>P&amp;L Settimanale:</span>
                        <span className="font-mono font-bold text-[#10B981] tabular-nums">+€ 14.850,00</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#111215] border border-white/[0.06] flex justify-between">
                        <span>Indice Rotazione Giacenze:</span>
                        <span className="font-mono font-bold text-[#F4F4F6] tabular-nums">4.2x / anno</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                  <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span>Operatività priva di errori anche nei picchi di traffico.</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Size Run & AI Copilot */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#111215] border border-white/[0.08]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 px-2 py-0.5 rounded">
                      STOCK RUN &amp; TELEMETRIA
                    </span>
                    <span className="text-xs font-mono text-[#71717A]">Sync Multi-Sede</span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#F4F4F6] tracking-tight">
                    Scala Taglie Live &amp; Previsione Riordini
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-2xl mt-1">
                    Verifica istantaneamente le disponibilità di taglia in store o seconda sede evitando rotture di stock.
                  </p>
                </div>

                <Link
                  href="/demo/retail"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#BFFF00] text-[#09090B] font-bold text-xs shrink-0 min-h-[40px]"
                >
                  <span>Apri Simulatore Completo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-4 rounded-xl bg-[#09090B] border border-white/[0.08]">
                <div className="text-xs font-semibold text-[#A1A1AA] mb-3">
                  Scala Taglie: Mocassino Borrelli Heritage
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {[
                    { size: '40', stock: 4, status: 'ok' },
                    { size: '41', stock: 6, status: 'ok' },
                    { size: '42', stock: 5, status: 'ok' },
                    { size: '43', stock: 2, status: 'low' },
                    { size: '44', stock: 1, status: 'critical' },
                    { size: '45', stock: 0, status: 'out' },
                  ].map((item) => (
                    <button
                      key={item.size}
                      type="button"
                      onClick={() => setSelectedSize(item.size)}
                      className={`p-3 rounded-xl border text-center transition-colors min-h-[64px] cursor-pointer ${
                        selectedSize === item.size
                          ? 'border-[#BFFF00] bg-[#18191D] text-[#F4F4F6] font-bold'
                          : 'bg-[#111215] border-white/[0.08] text-[#A1A1AA] hover:border-white/[0.2]'
                      }`}
                    >
                      <div className="text-sm font-mono font-bold">Misura {item.size}</div>
                      <div className="text-[11px] font-mono mt-1 tabular-nums">
                        {item.stock > 0 ? (
                          <span
                            className={
                              item.status === 'critical'
                                ? 'text-[#EF4444] font-bold'
                                : item.status === 'low'
                                ? 'text-[#F59E0B]'
                                : 'text-[#10B981]'
                            }
                          >
                            {item.stock} pz
                          </span>
                        ) : (
                          <span className="text-[#EF4444] font-bold uppercase text-[10px]">Esaurito</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-3.5 rounded-lg bg-[#111215] border border-white/[0.08] flex items-start gap-3 text-xs">
                  <Bot className="w-4 h-4 text-[#BFFF00] shrink-0 mt-0.5" />
                  <div className="text-[#A1A1AA]">
                    <span className="font-semibold text-[#F4F4F6]">RIVO Retail Copilot: </span>
                    La misura <span className="font-mono font-bold text-[#F4F4F6]">{selectedSize}</span> registra una velocità di 2.4 paia/settimana. Consigliato riordino di{' '}
                    <span className="font-mono font-bold text-[#BFFF00]">8 paia</span> al fornitore.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  BellRing, 
  Wine, 
  Receipt, 
  Sparkles, 
  ScanLine, 
  Sliders, 
  Boxes, 
  Bot, 
  Check, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  Tag,
  AlertTriangle,
  Clock,
  Percent,
  CheckCircle2,
  Share2
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
    tastingNote: 'Tannino setoso, note di viola appassita e liquirizia perfetta per sgrassare la fibra del manzo.',
    marginBoost: '+34% sul conto medio tavolo',
  },
  {
    dish: 'Risotto Carnaroli ai Frutti di Mare',
    wine: 'Greco di Tufo DOCG — Pietracupa',
    region: 'Campania',
    temperature: '10°C',
    tastingNote: 'Mineralità sulfurea tagliente, agrumi gialli e persistenza salina che esalta crostacei e molluschi.',
    marginBoost: '+28% sul conto medio tavolo',
  },
  {
    dish: 'Fettuccine al Tartufo Bianco & Porcini',
    wine: 'Etna Rosso DOC — Contrada Santo Spirito',
    region: 'Sicilia',
    temperature: '16°C',
    tastingNote: 'Eleganza vulcanica, pepe nero e sottobosco in perfetta armonia con la nota terrosa del tartufo.',
    marginBoost: '+42% sul conto medio tavolo',
  },
];

export default function LandingDualVertical() {
  const [vertical, setVertical] = useState<VerticalType>('restaurant');

  // Restaurant Interactive State
  const [selectedTable, setSelectedTable] = useState<number>(3);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [splitGuests, setSplitGuests] = useState<number>(2);
  const [selectedWineDish, setSelectedWineDish] = useState<number>(0);

  // Retail Interactive State
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(false);
  const [scannedShoe, setScannedShoe] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('42');

  const baseBill = 86.0;
  const splitAmount = (baseBill / splitGuests).toFixed(2);

  return (
    <section id="dual-vertical" className="py-20 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>ARCHITETTURA MULTI-VERTICALE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white headline-tight">
            Due Settori Specializzati. <br />
            Un Unico Cervello Digitale.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            RIVO adatta la propria interfaccia in base alla natura fisica del tuo punto vendita: comande e chiamate rapide per l&apos;Hospitality, magazzino e cassa ultraveloce per il Retail.
          </p>

          {/* Master Vertical Switcher Pills */}
          <div className="flex justify-center mt-8">
            <div className="inline-flex p-1.5 rounded-2xl bg-[#0B0C10] border border-white/[0.1] shadow-2xl">
              <button
                onClick={() => setVertical('restaurant')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all touch-press ${
                  vertical === 'restaurant'
                    ? 'bg-amber-500 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Ristorazione & Sala</span>
              </button>

              <button
                onClick={() => setVertical('retail')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all touch-press ${
                  vertical === 'retail'
                    ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Retail & ERP Veloce</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            MODE 1: RISTORAZIONE & HOSPITALITY
            ========================================================= */}
        {vertical === 'restaurant' && (
          <div className="space-y-8 animate-fade-in" id="ristorazione">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Feature 1: Mappa Tavoli & Chiamata Cameriere (Span 7) */}
              <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                      SALA & SMARTWATCH DISPATCH
                    </span>
                    <span className="text-xs font-mono text-slate-400">Interattivo: Clicca un tavolo</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white tracking-tight">
                    Mappa Tavoli & Chiamata Cameriere in 0.4s
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    L&apos;ospite tocca il supporto NFC RIVO sul tavolo e chiama il cameriere o ordina un refill d&apos;acqua. L&apos;allerta vibra direttamente sullo smartwatch dello staff senza urla in sala.
                  </p>
                </div>

                {/* Interactive Floor Plan Grid */}
                <div className="my-6 p-4 rounded-xl bg-black/40 border border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs mb-3 text-slate-300">
                    <span className="font-semibold">Planimetria Sala Principale</span>
                    <span className="font-mono text-emerald-400">6 Tavoli Configurato NFC</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {[1, 2, 3, 4, 5, 6].map((tNum) => {
                      const isSelected = selectedTable === tNum;
                      const hasCall = tNum === 3 && waiterCalled;
                      return (
                        <button
                          key={tNum}
                          onClick={() => {
                            setSelectedTable(tNum);
                            if (tNum === 3) setWaiterCalled(!waiterCalled);
                          }}
                          className={`p-3 rounded-xl border text-center transition-all touch-press ${
                            hasCall
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 animate-pulse'
                              : isSelected
                              ? 'bg-white/10 border-white text-white font-bold'
                              : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:border-white/20'
                          }`}
                        >
                          <div className="text-sm font-mono font-bold">T{tNum}</div>
                          <div className="text-[9px] uppercase tracking-wider mt-1 truncate">
                            {hasCall ? 'Chiamata' : tNum % 2 === 0 ? 'Libero' : 'Occupato'}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Table Detail Card */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Tavolo Selezionato: </span>
                      <span className="font-bold text-white">Tavolo {selectedTable}</span>
                      <span className="mx-2 text-slate-600">•</span>
                      <span className="text-slate-400">Coperti: </span>
                      <span className="font-mono text-white">4</span>
                    </div>

                    <button
                      onClick={() => setWaiterCalled(!waiterCalled)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        waiterCalled
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500 text-zinc-950'
                      }`}
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>{waiterCalled ? 'Annulla Notifica Sala' : 'Simula Chiamata Ospite'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tempo medio risposta del cameriere ridotto da 4.8 min a 45 secondi.</span>
                </div>
              </div>

              {/* Feature 2: Smart Bill & Divisione Conto (Span 5) */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                      FINTECH AL TAVOLO
                    </span>
                    <span className="text-xs font-mono text-slate-400">Zero Code in Cassa</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white tracking-tight">
                    Smart Bill &amp; Divisione Conto
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    I commensali dividono il conto alla romana in un secondo dallo smartphone, con richiesta automatica di fattura elettronica via SDI.
                  </p>
                </div>

                {/* Interactive Bill Splitter Tool */}
                <div className="my-6 p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <span className="text-xs text-slate-400">Totale Conto Tavolo:</span>
                    <span className="text-xl font-bold font-mono text-white tabular-nums">€ {baseBill.toFixed(2)}</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-2 font-medium">
                      Dividi tra commensali:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[2, 3, 4].map((num) => (
                        <button
                          key={num}
                          onClick={() => setSplitGuests(num)}
                          className={`py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                            splitGuests === num
                              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                              : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] border border-white/[0.08]'
                          }`}
                        >
                          {num} Persone
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-[11px] text-emerald-300">Quota per persona:</span>
                    <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                      € {splitAmount}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.06]">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Apple Pay, Google Pay e POS al tavolo
                  </span>
                  <span className="badge-mono text-slate-400">SDI READY</span>
                </div>
              </div>
            </div>

            {/* Feature 3: AI Sommelier (Full Width Interactive Dish-to-Wine Engine) */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                      RIVO AI SOMMELIER
                    </span>
                    <span className="text-xs font-mono text-slate-400">Algoritmo di Pairing & Margine</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                    Abbinamento Calice Intelligente al Tavolo
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
                    Il cliente apre il menu digitale e tocca un piatto: l&apos;AI suggerisce istantaneamente il vino ideale della cantina del locale, con note di degustazione e temperatura perfetta, incrementando le vendite di bottiglie ad alto margine.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+34% Scontrino Medio Vino</span>
                </div>
              </div>

              {/* Interactive Dish Selector Tabs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {WINE_OPTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedWineDish(idx)}
                    className={`p-3.5 rounded-xl border text-left transition-all touch-press ${
                      selectedWineDish === idx
                        ? 'bg-purple-950/40 border-purple-500/60 ring-1 ring-purple-500/40'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-mono text-slate-400">Piatto Selezionato:</div>
                    <div className="text-xs sm:text-sm font-semibold text-white mt-0.5 truncate">{item.dish}</div>
                  </button>
                ))}
              </div>

              {/* Wine Pairing Recommendation Card */}
              {(() => {
                const current = WINE_OPTIONS[selectedWineDish];
                return (
                  <div className="p-5 rounded-xl bg-black/50 border border-purple-500/20 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                    <div className="lg:col-span-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center shrink-0">
                        <Wine className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300">
                          {current.region} • Servizio {current.temperature}
                        </span>
                        <div className="text-base font-bold text-white mt-0.5">{current.wine}</div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 text-xs text-slate-300 leading-relaxed italic border-l border-white/[0.08] pl-4">
                      &quot;{current.tastingNote}&quot;
                    </div>

                    <div className="lg:col-span-3 flex flex-col items-start lg:items-end justify-center">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Impatto Finanziario</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                        {current.marginBoost}
                      </span>
                      <span className="text-[9px] text-slate-500 mt-1">Suggerito in tempo reale all&apos;ospite</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* =========================================================
            MODE 2: RETAIL, NEGOZI & MAGAZZINO
            ========================================================= */}
        {vertical === 'retail' && (
          <div className="space-y-8 animate-fade-in" id="retail">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Feature 1: AI Box Label Scanner (Span 7) */}
              <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                      VISION COMPUTER AI
                    </span>
                    <span className="text-xs font-mono text-slate-400">Carico Merce in 0.3s</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white tracking-tight">
                    AI Box Label &amp; Barcode Scanner
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Inquadra l&apos;etichetta della scatola di scarpe con la fotocamera dello smartphone: il modello OCR estrae istantaneamente SKU, taglie, colore e prezzo di listino senza inserimento manuale.
                  </p>
                </div>

                {/* Simulated Scanner Camera View */}
                <div className="my-6 p-4 rounded-xl bg-black/60 border border-white/[0.08] relative overflow-hidden">
                  {/* Green scan beam */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
                        <ScanLine className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-white">BOR-MOC-01</div>
                        <div className="text-sm font-semibold text-slate-200">Mocassino Artigianale Borrelli</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">EAN: 8012345001426 • Pelle Abrasivata</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setScannedShoe(!scannedShoe)}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 touch-press shadow-md shadow-emerald-500/25 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{scannedShoe ? 'Resetta Scanner' : 'Simula Scansione Scatola'}</span>
                    </button>
                  </div>

                  {/* Scanned breakdown */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <div className="text-[10px] text-slate-400">Prezzo Vendita</div>
                      <div className="font-bold text-white font-mono mt-0.5">€ 149,00</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <div className="text-[10px] text-slate-400">Costo Acquisto</div>
                      <div className="font-bold text-slate-300 font-mono mt-0.5">€ 65,00</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <div className="text-[10px] text-slate-400">Margine Lordo</div>
                      <div className="font-bold text-emerald-400 font-mono mt-0.5">56.4%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <div className="text-[10px] text-slate-400">Giacenza Totale</div>
                      <div className="font-bold text-white font-mono mt-0.5">18 paia</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Compatibile con tutti i barcode EAN-13, Code 128 e QR-Code.</span>
                  <span className="badge-mono text-emerald-400">ACCURATEZZA 99.8%</span>
                </div>
              </div>

              {/* Feature 2: Simple Mode Toggle (Span 5) */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded">
                      INTERFACCIA DUAL-MODE
                    </span>
                    <span className="text-xs font-mono text-slate-400">Addestramento Staff: 0 Minuti</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white tracking-tight">
                    Simple Mode: La Cassa a 3 Tasti
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Il commesso o stagista non deve perdersi in menu complessi. Con un clic si passa dalla modalità ERP completa all&apos;interfaccia ultra-rapida a 3 pulsanti.
                  </p>
                </div>

                {/* Interactive Mode Toggle Simulator */}
                <div className="my-6 p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <span className="text-xs text-slate-300 font-semibold">Stato Interfaccia:</span>
                    <button
                      onClick={() => setIsSimpleMode(!isSimpleMode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSimpleMode
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-indigo-500 text-white'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{isSimpleMode ? 'Simple Mode (Attiva)' : 'ERP Mode Completa'}</span>
                    </button>
                  </div>

                  {isSimpleMode ? (
                    <div className="space-y-2 animate-fade-in">
                      <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                        Schermata Cassa Rapida Attiva:
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-center">
                          <span className="text-xs font-bold text-emerald-300 block">1. Cassa Rapida</span>
                          <span className="text-[9px] text-slate-400">1-Touch POS</span>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-center">
                          <span className="text-xs font-bold text-indigo-300 block">2. Scanner</span>
                          <span className="text-[9px] text-slate-400">Fotocamera HD</span>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/40 text-center">
                          <span className="text-xs font-bold text-purple-300 block">3. Incasso</span>
                          <span className="text-[9px] text-slate-400">Stampa Ricevuta</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-fade-in text-xs text-slate-300">
                      <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                        Vista ERP Completa (Direzione):
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex justify-between">
                        <span>P&amp;L Settimanale:</span>
                        <span className="font-mono font-bold text-emerald-400">+€ 14.850,00</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex justify-between">
                        <span>Indice di Rotazione Giacenze:</span>
                        <span className="font-mono font-bold text-white">4.2x / anno</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nessun errore di cassa anche nei giorni di saldi o massimo affollamento.</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Stock Check in Tempo Reale & AI Copilot */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                      STOCK RUN &amp; TELEMETRIA
                    </span>
                    <span className="text-xs font-mono text-slate-400">Sincronizzazione Multi-Sede</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                    Scala Taglie Live &amp; Previsione Riordini con AI
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
                    Il commesso verifica in 1 secondo se la misura richiesta dal cliente è presente in magazzino o nella seconda sede, prevenendo la perdita della vendita.
                  </p>
                </div>

                <Link
                  href="/demo/retail"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold text-xs border border-white/[0.1] transition-all touch-press"
                >
                  <span>Apri Simulatore Completo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Interactive Size Run Checker */}
              <div className="p-4 rounded-xl bg-black/50 border border-white/[0.06]">
                <div className="text-xs font-semibold text-slate-300 mb-3">
                  Scala Taglie: Mocassino Borrelli Heritage (Seleziona misura):
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
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
                      onClick={() => setSelectedSize(item.size)}
                      className={`p-3 rounded-xl border text-center transition-all touch-press ${
                        selectedSize === item.size
                          ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold ring-2 ring-indigo-500/30'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <div className="text-base font-mono font-bold">Misura {item.size}</div>
                      <div className="text-[11px] font-mono mt-1">
                        {item.stock > 0 ? (
                          <span className={item.status === 'critical' ? 'text-red-400 font-bold' : item.status === 'low' ? 'text-amber-400' : 'text-emerald-400'}>
                            {item.stock} pz disponibili
                          </span>
                        ) : (
                          <span className="text-red-500 font-bold uppercase text-[9px]">Esaurito</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* AI Copilot Suggestion Box */}
                <div className="mt-4 p-3.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 text-xs">
                  <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-indigo-300">
                      RIVO AI Retail Copilot:
                    </span>
                    <span className="text-slate-300 ml-1">
                      La misura <span className="font-mono font-bold text-white">{selectedSize}</span> ha una velocità di rotazione di 2.4 paia/settimana. Consigliato riordino automatico al fornitore Borrelli di <span className="font-mono font-bold text-emerald-400">8 paia</span> entro venerdì per evitare rottura di stock.
                    </span>
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

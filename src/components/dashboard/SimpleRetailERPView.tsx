'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSimpleMode } from '@/lib/simple-mode';

export interface SimpleERPVariant {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  barcode: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  reorderThreshold: number;
  supplier: string;
}

export interface SimpleERPSale {
  id: string;
  number: string;
  time: string;
  items: string;
  pieces: number;
  total: number;
  margin: number;
  payment: string;
  operator: string;
}

interface SimpleRetailERPViewProps {
  orgName?: string;
  initialBalances?: any[];
  initialSales?: any[];
  onExitSimpleMode?: () => void;
}

// Fallback high-fidelity dataset for Borrelli Calzature
const DEFAULT_ERP_VARIANTS: SimpleERPVariant[] = [
  { id: 'v1', sku: 'BOR-MOC-40', name: 'Mocassino Artigianale', brand: 'Borrelli Heritage', category: 'Uomo', size: '40', color: 'Testa di Moro', barcode: '8012345001402', costPrice: 65.00, salePrice: 149.00, stock: 4, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v2', sku: 'BOR-MOC-41', name: 'Mocassino Artigianale', brand: 'Borrelli Heritage', category: 'Uomo', size: '41', color: 'Testa di Moro', barcode: '8012345001419', costPrice: 65.00, salePrice: 149.00, stock: 6, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v3', sku: 'BOR-MOC-42', name: 'Mocassino Artigianale', brand: 'Borrelli Heritage', category: 'Uomo', size: '42', color: 'Testa di Moro', barcode: '8012345001426', costPrice: 65.00, salePrice: 149.00, stock: 5, reorderThreshold: 3, supplier: 'Calzaturificio Campano' },
  { id: 'v4', sku: 'BOR-MOC-43', name: 'Mocassino Artigianale', brand: 'Borrelli Heritage', category: 'Uomo', size: '43', color: 'Testa di Moro', barcode: '8012345001433', costPrice: 65.00, salePrice: 149.00, stock: 2, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v5', sku: 'BOR-MOC-44', name: 'Mocassino Artigianale', brand: 'Borrelli Heritage', category: 'Uomo', size: '44', color: 'Testa di Moro', barcode: '8012345001440', costPrice: 65.00, salePrice: 149.00, stock: 1, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v6', sku: 'BOR-MOC-45', name: 'Mocassino Artigianale', brand: 'Borrelli Heritage', category: 'Uomo', size: '45', color: 'Testa di Moro', barcode: '8012345001457', costPrice: 65.00, salePrice: 149.00, stock: 0, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },

  { id: 'v7', sku: 'BOR-OXF-40', name: 'Francesina Oxford Classic', brand: 'Borrelli Heritage', category: 'Uomo', size: '40', color: 'Nero Lucido', barcode: '8012345002409', costPrice: 75.00, salePrice: 169.00, stock: 3, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v8', sku: 'BOR-OXF-41', name: 'Francesina Oxford Classic', brand: 'Borrelli Heritage', category: 'Uomo', size: '41', color: 'Nero Lucido', barcode: '8012345002416', costPrice: 75.00, salePrice: 169.00, stock: 5, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v9', sku: 'BOR-OXF-42', name: 'Francesina Oxford Classic', brand: 'Borrelli Heritage', category: 'Uomo', size: '42', color: 'Nero Lucido', barcode: '8012345002423', costPrice: 75.00, salePrice: 169.00, stock: 4, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v10', sku: 'BOR-OXF-43', name: 'Francesina Oxford Classic', brand: 'Borrelli Heritage', category: 'Uomo', size: '43', color: 'Nero Lucido', barcode: '8012345002430', costPrice: 75.00, salePrice: 169.00, stock: 3, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },
  { id: 'v11', sku: 'BOR-OXF-44', name: 'Francesina Oxford Classic', brand: 'Borrelli Heritage', category: 'Uomo', size: '44', color: 'Nero Lucido', barcode: '8012345002447', costPrice: 75.00, salePrice: 169.00, stock: 2, reorderThreshold: 2, supplier: 'Calzaturificio Campano' },

  { id: 'v12', sku: 'PRE-MCK-41', name: 'Sneaker Premiata Mick', brand: 'Premiata', category: 'Sneakers', size: '41', color: 'Antracite', barcode: '8033984110412', costPrice: 108.00, salePrice: 230.00, stock: 4, reorderThreshold: 2, supplier: 'Premiata Luxury' },
  { id: 'v13', sku: 'PRE-MCK-42', name: 'Sneaker Premiata Mick', brand: 'Premiata', category: 'Sneakers', size: '42', color: 'Antracite', barcode: '8033984110429', costPrice: 108.00, salePrice: 230.00, stock: 3, reorderThreshold: 2, supplier: 'Premiata Luxury' },
  { id: 'v14', sku: 'PRE-MCK-43', name: 'Sneaker Premiata Mick', brand: 'Premiata', category: 'Sneakers', size: '43', color: 'Antracite', barcode: '8033984110436', costPrice: 108.00, salePrice: 230.00, stock: 5, reorderThreshold: 2, supplier: 'Premiata Luxury' },
  { id: 'v15', sku: 'PRE-MCK-44', name: 'Sneaker Premiata Mick', brand: 'Premiata', category: 'Sneakers', size: '44', color: 'Antracite', barcode: '8033984110443', costPrice: 108.00, salePrice: 230.00, stock: 2, reorderThreshold: 2, supplier: 'Premiata Luxury' },

  { id: 'v16', sku: 'HOG-HST-37', name: 'Hogan H-Stripes Leather', brand: 'Hogan', category: 'Sneakers', size: '37', color: 'Bianco/Argento', barcode: '8059345010375', costPrice: 175.00, salePrice: 360.00, stock: 2, reorderThreshold: 1, supplier: 'Premiata Luxury' },
  { id: 'v17', sku: 'HOG-HST-38', name: 'Hogan H-Stripes Leather', brand: 'Hogan', category: 'Sneakers', size: '38', color: 'Bianco/Argento', barcode: '8059345010382', costPrice: 175.00, salePrice: 360.00, stock: 4, reorderThreshold: 2, supplier: 'Premiata Luxury' },
  { id: 'v18', sku: 'HOG-HST-39', name: 'Hogan H-Stripes Leather', brand: 'Hogan', category: 'Sneakers', size: '39', color: 'Bianco/Argento', barcode: '8059345010399', costPrice: 175.00, salePrice: 360.00, stock: 3, reorderThreshold: 2, supplier: 'Premiata Luxury' },
  { id: 'v19', sku: 'HOG-HST-40', name: 'Hogan H-Stripes Leather', brand: 'Hogan', category: 'Sneakers', size: '40', color: 'Bianco/Argento', barcode: '8059345010405', costPrice: 175.00, salePrice: 360.00, stock: 2, reorderThreshold: 1, supplier: 'Premiata Luxury' },
  { id: 'v20', sku: 'HOG-HST-41', name: 'Hogan H-Stripes Leather', brand: 'Hogan', category: 'Sneakers', size: '41', color: 'Bianco/Argento', barcode: '8059345010412', costPrice: 175.00, salePrice: 360.00, stock: 1, reorderThreshold: 1, supplier: 'Premiata Luxury' },

  { id: 'v21', sku: 'NG-DEC-37', name: 'Nero Giardini Décolleté Glove', brand: 'Nero Giardini', category: 'Donna', size: '37', color: 'Nero', barcode: '8021045003378', costPrice: 58.00, salePrice: 139.50, stock: 5, reorderThreshold: 2, supplier: 'NeroGiardini Group' },
  { id: 'v22', sku: 'NG-DEC-38', name: 'Nero Giardini Décolleté Glove', brand: 'Nero Giardini', category: 'Donna', size: '38', color: 'Nero', barcode: '8021045003385', costPrice: 58.00, salePrice: 139.50, stock: 6, reorderThreshold: 2, supplier: 'NeroGiardini Group' },
  { id: 'v23', sku: 'NG-DEC-39', name: 'Nero Giardini Décolleté Glove', brand: 'Nero Giardini', category: 'Donna', size: '39', color: 'Nero', barcode: '8021045003392', costPrice: 58.00, salePrice: 139.50, stock: 4, reorderThreshold: 2, supplier: 'NeroGiardini Group' },

  { id: 'v24', sku: 'NK-AM95-42', name: 'Nike Air Max 95 OG', brand: 'Nike', category: 'Sneakers', size: '42', color: 'Triple Black', barcode: '0194956789029', costPrice: 92.00, salePrice: 189.99, stock: 5, reorderThreshold: 2, supplier: 'Premiata Luxury' },
  { id: 'v25', sku: 'NK-AM95-43', name: 'Nike Air Max 95 OG', brand: 'Nike', category: 'Sneakers', size: '43', color: 'Triple Black', barcode: '0194956789036', costPrice: 92.00, salePrice: 189.99, stock: 4, reorderThreshold: 2, supplier: 'Premiata Luxury' },

  { id: 'v26', sku: 'BOR-BAG-01', name: 'Borsa Shopping in Cuoio', brand: 'Borrelli Heritage', category: 'Pelletteria', size: 'Unica', color: 'Cuoio Naturale', barcode: '8012345006018', costPrice: 52.00, salePrice: 129.00, stock: 8, reorderThreshold: 3, supplier: 'Pelletterie Toscane' },
  { id: 'v27', sku: 'SAP-KIT-01', name: 'Kit Manutenzione Deluxe', brand: 'Saphir', category: 'Accessori', size: 'Standard', color: 'Neutro/Nero', barcode: '3324012015003', costPrice: 12.00, salePrice: 29.50, stock: 16, reorderThreshold: 5, supplier: 'Calzaturificio Campano' },
];

const DEFAULT_ERP_SALES: SimpleERPSale[] = [
  { id: 's1', number: 'BOR-20261010-0101', time: '11:15', items: 'Mocassino Artigianale (TG 40)', pieces: 1, total: 149.00, margin: 84.00, payment: 'Carta POS', operator: 'Vincenzo Borrelli' },
  { id: 's2', number: 'BOR-20261010-0102', time: '11:48', items: 'Sneaker Premiata Mick (TG 42)', pieces: 1, total: 230.00, margin: 122.00, payment: 'Carta POS', operator: 'Cassa 1' },
  { id: 's3', number: 'BOR-20261010-0103', time: '12:30', items: 'NG Décolleté (TG 38) + Kit Saphir', pieces: 2, total: 169.00, margin: 99.00, payment: 'Carta POS', operator: 'Vincenzo Borrelli' },
  { id: 's4', number: 'BOR-20261010-0104', time: '13:05', items: 'Francesina Oxford (TG 41)', pieces: 1, total: 169.00, margin: 94.00, payment: 'Contanti', operator: 'Cassa 1' },
];

export default function SimpleRetailERPView({
  orgName = 'Borrelli Calzature',
  initialBalances,
  initialSales,
  onExitSimpleMode,
}: SimpleRetailERPViewProps) {
  const [, toggleSimpleMode] = useSimpleMode();

  // Working inventory state (allows instant in-memory adjustment during presentation)
  const [variants, setVariants] = useState<SimpleERPVariant[]>(DEFAULT_ERP_VARIANTS);
  const [salesList, setSalesList] = useState<SimpleERPSale[]>(DEFAULT_ERP_SALES);

  // Search & Filters for Inventory Table
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Quick POS State
  const [posBarcodeOrSku, setPosBarcodeOrSku] = useState('');
  const [posSelectedVariantId, setPosSelectedVariantId] = useState(variants[2].id); // Default to Mocassino TG 42
  const [posQty, setPosQty] = useState(1);
  const [posCart, setPosCart] = useState<Array<{ variant: SimpleERPVariant; qty: number; discount: number }>>([
    { variant: variants[2], qty: 1, discount: 0 },
  ]);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'card' | 'cash'>('card');
  const [posFeedback, setPosFeedback] = useState<string | null>(null);

  // Stock Adjustment Handlers (+1 / -1)
  const handleAdjustStock = useCallback((variantId: string, delta: number) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === variantId) {
          const newStock = Math.max(0, v.stock + delta);
          return { ...v, stock: newStock };
        }
        return v;
      })
    );
  }, []);

  // POS Add to Cart
  const handleAddToCart = useCallback(() => {
    const target = variants.find((v) => v.id === posSelectedVariantId);
    if (!target) return;

    setPosCart((prev) => {
      const existing = prev.find((item) => item.variant.id === target.id);
      if (existing) {
        return prev.map((item) =>
          item.variant.id === target.id ? { ...item, qty: item.qty + posQty } : item
        );
      }
      return [...prev, { variant: target, qty: posQty, discount: 0 }];
    });
    setPosFeedback(null);
  }, [variants, posSelectedVariantId, posQty]);

  // Barcode / SKU Direct Add
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = posBarcodeOrSku.trim().toLowerCase();
    if (!query) return;

    const matched = variants.find(
      (v) => v.barcode === query || v.sku.toLowerCase() === query || v.name.toLowerCase().includes(query)
    );

    if (matched) {
      setPosSelectedVariantId(matched.id);
      setPosCart((prev) => {
        const existing = prev.find((item) => item.variant.id === matched.id);
        if (existing) {
          return prev.map((item) =>
            item.variant.id === matched.id ? { ...item, qty: item.qty + 1 } : item
          );
        }
        return [...prev, { variant: matched, qty: 1, discount: 0 }];
      });
      setPosBarcodeOrSku('');
      setPosFeedback(`Aggiunto: ${matched.name} TG ${matched.size}`);
    } else {
      setPosFeedback(`Nessun articolo corrispondente a: "${query}"`);
    }
  };

  // Complete POS Sale
  const handleCompleteSale = () => {
    if (posCart.length === 0) return;

    let saleTotal = 0;
    let saleMargin = 0;
    let totalPieces = 0;
    const itemNames: string[] = [];

    // Deduct stock in memory
    setVariants((prev) => {
      const next = [...prev];
      for (const cartItem of posCart) {
        const idx = next.findIndex((v) => v.id === cartItem.variant.id);
        if (idx !== -1) {
          next[idx] = { ...next[idx], stock: Math.max(0, next[idx].stock - cartItem.qty) };
        }
      }
      return next;
    });

    for (const item of posCart) {
      const lineTotal = (item.variant.salePrice * item.qty * (100 - item.discount)) / 100;
      const lineCost = item.variant.costPrice * item.qty;
      saleTotal += lineTotal;
      saleMargin += lineTotal - lineCost;
      totalPieces += item.qty;
      itemNames.push(`${item.variant.name} (TG ${item.variant.size})`);
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const saleNum = `BOR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(salesList.length + 101).padStart(4, '0')}`;

    const newSaleRecord: SimpleERPSale = {
      id: `s_${Date.now()}`,
      number: saleNum,
      time: timeStr,
      items: itemNames.join(', '),
      pieces: totalPieces,
      total: saleTotal,
      margin: saleMargin,
      payment: posPaymentMethod === 'card' ? 'Carta POS' : 'Contanti',
      operator: 'Vincenzo Borrelli',
    };

    setSalesList([newSaleRecord, ...salesList]);
    setPosCart([]);
    setPosFeedback(`SCONTRINO EMESSO [${saleNum}] • Incasso: € ${saleTotal.toFixed(2)} • Scorte aggiornate.`);
  };

  // Filtered variants for table
  const filteredVariants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return variants.filter((v) => {
      if (categoryFilter !== 'ALL' && v.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.barcode.includes(q) ||
        v.size === q
      );
    });
  }, [variants, searchQuery, categoryFilter]);

  // Critical Low Stock Variants
  const criticalItems = useMemo(() => {
    return variants.filter((v) => v.stock <= v.reorderThreshold);
  }, [variants]);

  // Aggregate Totals
  const todayTotalRevenue = useMemo(() => salesList.reduce((acc, s) => acc + s.total, 0), [salesList]);
  const todayTotalMargin = useMemo(() => salesList.reduce((acc, s) => acc + s.margin, 0), [salesList]);
  const todayTotalPieces = useMemo(() => salesList.reduce((acc, s) => acc + s.pieces, 0), [salesList]);
  const totalStockPieces = useMemo(() => variants.reduce((acc, v) => acc + v.stock, 0), [variants]);

  const posSubtotal = posCart.reduce((acc, item) => acc + item.variant.salePrice * item.qty, 0);

  return (
    <div className="w-full bg-[#f8f9fa] dark:bg-[#0c0d0e] text-[#1a1a1a] dark:text-[#e4e4e7] font-mono text-xs select-text pb-16 space-y-4">
      {/* 1. ERP SYSTEM HEADER BAR */}
      <div className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141517] p-3 rounded-none shadow-none flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm uppercase tracking-wider text-black dark:text-white">
              {orgName.toUpperCase()} — MODULO GESTIONALE RETAIL
            </span>
            <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.2 text-[10px]">
              ONLINE
            </span>
            <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.2 text-[10px]">
              REGISTRO CASSA 01
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Operatore: <strong>Vincenzo Borrelli</strong> | Punto Vendita: <strong>Boutique Centro</strong> | Ambiente: <strong>Produzione</strong>
          </div>
        </div>

        {/* Exit Simple Mode CTA */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Modalità Semplice Attiva</span>
          <button
            type="button"
            onClick={() => {
              if (onExitSimpleMode) onExitSimpleMode();
              else toggleSimpleMode(false);
            }}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-900 font-bold text-[11px] border border-transparent transition-none"
          >
            ← Torna alla Grafica Standard
          </button>
        </div>
      </div>

      {/* 2. OPERATIONAL SUMMARY KPI BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141517] p-2.5">
          <div className="text-[10px] text-zinc-500 uppercase">Incasso Giornaliero</div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            € {todayTotalRevenue.toFixed(2)}
          </div>
          <div className="text-[10px] text-zinc-400">{salesList.length} scontrini emessi oggi</div>
        </div>

        <div className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141517] p-2.5">
          <div className="text-[10px] text-zinc-500 uppercase">Margine Utile Lordo</div>
          <div className="text-lg font-black text-black dark:text-white">
            € {todayTotalMargin.toFixed(2)}
          </div>
          <div className="text-[10px] text-zinc-400">
            {todayTotalRevenue > 0 ? ((todayTotalMargin / todayTotalRevenue) * 100).toFixed(1) : '0.0'}% di ricarico medio
          </div>
        </div>

        <div className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141517] p-2.5">
          <div className="text-[10px] text-zinc-500 uppercase">Pezzi Venduti Oggi</div>
          <div className="text-lg font-black text-black dark:text-white">
            {todayTotalPieces} PAIA
          </div>
          <div className="text-[10px] text-zinc-400">Giacenza globale: {totalStockPieces} paia</div>
        </div>

        <div className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141517] p-2.5">
          <div className="text-[10px] text-zinc-500 uppercase">Numerazioni Sotto Scorta</div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400">
            {criticalItems.length} CODICI
          </div>
          <div className="text-[10px] text-zinc-400">Richiede riordino fornitore</div>
        </div>
      </div>

      {/* 3. CASSA VELOCE (FAST POS TERMINAL) */}
      <div className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141517] p-3 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
          <span className="font-bold text-xs uppercase text-black dark:text-white">
            [F2] TERMINALE CASSA RAPIDA — EMISSIONE SCONTRINO
          </span>
          <span className="text-[11px] text-zinc-500">Scanner Barcode USB / Fotocamera Attivo</span>
        </div>

        {/* Input Barcode / SKU + Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <form onSubmit={handleBarcodeSubmit} className="md:col-span-5 flex gap-1">
            <input
              type="text"
              value={posBarcodeOrSku}
              onChange={(e) => setPosBarcodeOrSku(e.target.value)}
              placeholder="Digita Barcode EAN-13 o SKU..."
              className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-400 dark:border-zinc-600 px-2 py-1 text-xs text-black dark:text-white font-mono focus:outline-none focus:border-black dark:focus:border-white"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-zinc-800 text-white font-bold hover:bg-black transition-none text-xs"
            >
              Invio
            </button>
          </form>

          <div className="md:col-span-4">
            <select
              value={posSelectedVariantId}
              onChange={(e) => setPosSelectedVariantId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-400 dark:border-zinc-600 px-2 py-1 text-xs text-black dark:text-white font-mono focus:outline-none"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} (TG {v.size}) — € {v.salePrice.toFixed(2)} [Scorta: {v.stock}]
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <input
              type="number"
              min={1}
              max={99}
              value={posQty}
              onChange={(e) => setPosQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-400 dark:border-zinc-600 px-2 py-1 text-xs text-black dark:text-white font-mono text-center"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1 text-xs transition-none"
            >
              + Aggiungi
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {posFeedback && (
          <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 text-[11px]">
            {posFeedback}
          </div>
        )}

        {/* Cart Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-700 text-left text-[11px]">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold border-b border-zinc-300 dark:border-zinc-700">
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 w-12 text-center">#</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700">Articolo / Descrizione</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 w-16 text-center">Taglia</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 w-32 font-mono">Barcode</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 w-24 text-right">Prezzo Unit.</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 w-16 text-center">Q.tà</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 w-24 text-right">Totale Riga</th>
                <th className="p-1.5 w-16 text-center">Azione</th>
              </tr>
            </thead>
            <tbody>
              {posCart.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-3 text-center text-zinc-500 italic">
                    Nessun articolo nel carrello cassa. Aggiungi un modello sopra per emettere scontrino.
                  </td>
                </tr>
              ) : (
                posCart.map((item, idx) => (
                  <tr key={idx} className="border-b border-zinc-200 dark:border-zinc-800">
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-center font-bold">{idx + 1}</td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 font-bold text-black dark:text-white">
                      {item.variant.name} — {item.variant.brand}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-center font-bold bg-zinc-50 dark:bg-zinc-900">
                      {item.variant.size}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 font-mono text-zinc-500">
                      {item.variant.barcode}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-right">
                      € {item.variant.salePrice.toFixed(2)}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-center font-bold">
                      {item.qty}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-right font-bold text-black dark:text-white">
                      € {(item.variant.salePrice * item.qty).toFixed(2)}
                    </td>
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => setPosCart(posCart.filter((_, i) => i !== idx))}
                        className="text-rose-600 dark:text-rose-400 font-bold hover:underline"
                      >
                        [Canc]
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Checkout Action Bar */}
        {posCart.length > 0 && (
          <div className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-black p-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs">
              <div>
                Metodo Pagamento:
                <select
                  value={posPaymentMethod}
                  onChange={(e) => setPosPaymentMethod(e.target.value as any)}
                  className="ml-2 bg-white dark:bg-zinc-900 border border-zinc-400 dark:border-zinc-600 px-2 py-0.5 font-bold"
                >
                  <option value="card">Carta POS Bancomat</option>
                  <option value="cash">Contanti alla Cassa</option>
                </select>
              </div>

              <div className="font-bold text-sm">
                TOTALE DOVUTO: <span className="text-emerald-600 dark:text-emerald-400 font-black">€ {posSubtotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompleteSale}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider transition-none shadow-none"
            >
              EMETTI SCONTRINO (SCARICA MAGAZZINO)
            </button>
          </div>
        )}
      </div>

      {/* 4. TABELLA COMPLETA GIACENZE & NUMERAZIONI MAGAZZINO */}
      <div className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141517] p-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          <span className="font-bold text-xs uppercase text-black dark:text-white">
            [F3] ANAGRAFICA ARTICOLI, NUMERAZIONI & GIACENZE FISICHE
          </span>

          {/* Table Filters */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca modello, brand, barcode..."
              className="bg-zinc-50 dark:bg-black border border-zinc-400 dark:border-zinc-600 px-2 py-1 text-[11px] w-48 text-black dark:text-white"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-50 dark:bg-black border border-zinc-400 dark:border-zinc-600 px-2 py-1 text-[11px] text-black dark:text-white"
            >
              <option value="ALL">Tutte le Categorie</option>
              <option value="Uomo">Calzature Uomo</option>
              <option value="Donna">Calzature Donna</option>
              <option value="Sneakers">Sneakers & Casual</option>
              <option value="Pelletteria">Pelletteria</option>
              <option value="Accessori">Accessori</option>
            </select>
          </div>
        </div>

        {/* Master Stock Table */}
        <div className="overflow-x-auto max-h-[440px] border border-zinc-300 dark:border-zinc-700">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 z-10 border-b border-zinc-300 dark:border-zinc-700 font-bold">
              <tr>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700">Codice SKU</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700">Descrizione Modello</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700">Brand</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 w-14 text-center">Taglia</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700">Colore</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 font-mono">Barcode EAN-13</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-right">Costo €</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-right">Vendita €</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-right">Margine</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-center font-bold w-20">Giacenza</th>
                <th className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-center">Stato</th>
                <th className="p-1.5 text-center w-20">Rettifica</th>
              </tr>
            </thead>
            <tbody>
              {filteredVariants.map((v) => {
                const marginVal = v.salePrice - v.costPrice;
                const marginPct = ((marginVal / v.salePrice) * 100).toFixed(1);
                const isOutOfStock = v.stock === 0;
                const isLowStock = v.stock > 0 && v.stock <= v.reorderThreshold;

                return (
                  <tr
                    key={v.id}
                    className={`border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${
                      isOutOfStock ? 'bg-rose-50/50 dark:bg-rose-950/20' : isLowStock ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 font-mono text-zinc-600 dark:text-zinc-400">
                      {v.sku}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 font-bold text-black dark:text-white">
                      {v.name}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                      {v.brand}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-center font-black bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white">
                      {v.size}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-zinc-500">
                      {v.color}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 font-mono text-[10px]">
                      {v.barcode}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-right font-mono text-zinc-500">
                      € {v.costPrice.toFixed(2)}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-right font-mono font-bold text-black dark:text-white">
                      € {v.salePrice.toFixed(2)}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {marginPct}%
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-center font-mono font-black text-sm">
                      {v.stock}
                    </td>
                    <td className="p-1.5 border-r border-zinc-300 dark:border-zinc-700 text-center">
                      {isOutOfStock ? (
                        <span className="bg-rose-600 text-white font-bold px-1.5 py-0.2 text-[9px] uppercase">
                          Esaurito
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-amber-600 text-white font-bold px-1.5 py-0.2 text-[9px] uppercase">
                          Sotto Scorta
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="p-1.5 text-center">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(v.id, -1)}
                          className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[10px]"
                          title="Scarica 1 pezzo"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(v.id, 1)}
                          className="px-1.5 py-0.5 bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black font-bold hover:bg-black text-[10px]"
                          title="Carica 1 pezzo"
                        >
                          +1
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. SEZIONE RIPORTO FORNITORI & STORICO SCONTRINI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Notifiche Riordino Fornitori */}
        <div className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141517] p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-1.5">
            <span className="font-bold text-xs uppercase text-amber-600 dark:text-amber-400">
              RIORDINI FORNITORI (SOTTO SOGLIA MINIMA)
            </span>
            <span className="text-[10px] text-zinc-400">{criticalItems.length} articoli da ordinare</span>
          </div>

          <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-700 text-[10px]">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-b border-zinc-300 dark:border-zinc-700">
                <th className="p-1">Articolo</th>
                <th className="p-1 text-center">Tg</th>
                <th className="p-1 text-center">Giacenza</th>
                <th className="p-1">Fornitore</th>
                <th className="p-1 text-center">Da Ordinare</th>
              </tr>
            </thead>
            <tbody>
              {criticalItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-2 text-center text-zinc-500 italic">
                    Tutte le scorte sono sopra la soglia minima.
                  </td>
                </tr>
              ) : (
                criticalItems.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-200 dark:border-zinc-800">
                    <td className="p-1 font-bold text-black dark:text-white">{c.name}</td>
                    <td className="p-1 text-center font-bold">{c.size}</td>
                    <td className="p-1 text-center font-bold text-rose-600 dark:text-rose-400">{c.stock} pz</td>
                    <td className="p-1 text-zinc-500">{c.supplier}</td>
                    <td className="p-1 text-center font-bold text-emerald-600 dark:text-emerald-400">+6 paia</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Registro Vendite Odierne */}
        <div className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141517] p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-1.5">
            <span className="font-bold text-xs uppercase text-black dark:text-white">
              ULTIMI SCONTRINI EMESSI ALLA CASSA OGGI
            </span>
            <span className="text-[10px] text-zinc-400">Tot: € {todayTotalRevenue.toFixed(2)}</span>
          </div>

          <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-700 text-[10px]">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-b border-zinc-300 dark:border-zinc-700">
                <th className="p-1 w-12 text-center">Ora</th>
                <th className="p-1">Scontrino #</th>
                <th className="p-1">Dettaglio Articoli</th>
                <th className="p-1 text-right">Totale €</th>
                <th className="p-1 text-center">Metodo</th>
              </tr>
            </thead>
            <tbody>
              {salesList.slice(0, 5).map((s) => (
                <tr key={s.id} className="border-b border-zinc-200 dark:border-zinc-800">
                  <td className="p-1 text-center font-mono text-zinc-500">{s.time}</td>
                  <td className="p-1 font-mono font-bold text-zinc-700 dark:text-zinc-300">{s.number}</td>
                  <td className="p-1 text-black dark:text-white truncate max-w-[180px]">{s.items}</td>
                  <td className="p-1 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    € {s.total.toFixed(2)}
                  </td>
                  <td className="p-1 text-center text-zinc-500">{s.payment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

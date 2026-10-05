'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw,
  SlidersHorizontal, 
  AlertTriangle, 
  Search, 
  Plus, 
  Loader2, 
  AlertCircle,
  X,
  History,
  CheckCircle2,
  Calendar,
  Download,
  ClipboardList,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
  ArrowUpDown,
  Barcode,
  TrendingDown,
  Building2,
  Check,
  ChevronRight
} from 'lucide-react';

interface Movement {
  id: string;
  type: string;
  quantity_delta: number;
  quantity_after: number | null;
  unit_cost: number | null;
  reason: string | null;
  reference: string | null;
  reference_type: string | null;
  created_at: string;
  variant: {
    id: string;
    sku: string | null;
    barcode: string | null;
    size: string | null;
    color: string | null;
    attributes: Record<string, string> | null;
    reorder_threshold: number;
    cost_price: number | null;
    sale_price: number | null;
    product: {
      id: string;
      name: string;
      sku: string | null;
      brand: { id: string; name: string } | null;
      category: { id: string; name: string } | null;
    } | null;
  } | null;
}

interface Balance {
  id: string;
  variant_id: string;
  quantity_on_hand: number;
  updated_at: string;
  variant: {
    id: string;
    sku: string | null;
    barcode: string | null;
    size: string | null;
    color: string | null;
    attributes: Record<string, string> | null;
    reorder_threshold: number;
    cost_price: number | null;
    sale_price: number | null;
    product: {
      id: string;
      name: string;
      sku: string | null;
      cost_price: number | null;
      sale_price: number | null;
      brand: { id: string; name: string } | null;
      category: { id: string; name: string } | null;
    } | null;
  } | null;
}

interface InventoryCountSession {
  id: string;
  name: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

interface InventoryCountItem {
  id: string;
  count_id: string;
  variant_id: string;
  expected_quantity: number;
  counted_quantity: number;
  discrepancy: number;
  notes: string | null;
  variant: {
    id: string;
    sku: string | null;
    barcode: string | null;
    size: string | null;
    color: string | null;
    product: {
      name: string;
      brand: { name: string } | null;
    } | null;
  } | null;
}

export default function InventoryPage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [counts, setCounts] = useState<InventoryCountSession[]>([]);
  const [activeCount, setActiveCount] = useState<{ session: InventoryCountSession; items: InventoryCountItem[] } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'balances' | 'movements' | 'counts'>('balances');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');

  // Movement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Movement Form
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [movementType, setMovementType] = useState<string>('purchase');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');

  // Start Count Modal
  const [isStartCountModalOpen, setIsStartCountModalOpen] = useState(false);
  const [newCountName, setNewCountName] = useState('');
  const [newCountNotes, setNewCountNotes] = useState('');
  const [startingCount, setStartingCount] = useState(false);
  const [applyingCount, setApplyingCount] = useState(false);

  // Load Inventory Data
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [movRes, countsRes] = await Promise.all([
        fetch('/api/inventory/movements?limit=150'),
        fetch('/api/inventory/counts'),
      ]);

      const [movData, countsData] = await Promise.all([
        movRes.json(),
        countsRes.json(),
      ]);

      if (!movRes.ok) throw new Error(movData.error || 'Errore recupero inventario');
      if (!countsRes.ok) throw new Error(countsData.error || 'Errore recupero inventari');

      setBalances(movData.balances || []);
      setMovements(movData.movements || []);
      setCounts(countsData.counts || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore nel caricamento del magazzino';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Load Active Count Session
  const loadCountDetails = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/counts?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore caricamento dettagli inventario');
      setActiveCount({ session: data.count, items: data.items || [] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore caricamento sessione';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const stats = useMemo(() => {
    let totalPieces = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const b of balances) {
      const qty = b.quantity_on_hand || 0;
      totalPieces += qty;
      const cost = b.variant?.cost_price || b.variant?.product?.cost_price || ((b.variant?.sale_price || b.variant?.product?.sale_price || 0) * 0.5);
      totalValue += qty * cost;

      const threshold = b.variant?.reorder_threshold ?? 2;
      if (qty <= 0) {
        outOfStockCount++;
      } else if (qty <= threshold) {
        lowStockCount++;
      }
    }

    return { totalPieces, totalValue, lowStockCount, outOfStockCount };
  }, [balances]);

  // Filtered Balances
  const filteredBalances = useMemo(() => {
    return balances.filter((b) => {
      // Stock level filter
      const qty = b.quantity_on_hand || 0;
      const threshold = b.variant?.reorder_threshold ?? 2;
      if (balanceFilter === 'low' && (qty <= 0 || qty > threshold)) return false;
      if (balanceFilter === 'out' && qty > 0) return false;
      if (balanceFilter === 'in' && qty <= threshold) return false;

      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const pName = b.variant?.product?.name?.toLowerCase() || '';
      const brand = b.variant?.product?.brand?.name?.toLowerCase() || '';
      const cat = b.variant?.product?.category?.name?.toLowerCase() || '';
      const sku = (b.variant?.sku || b.variant?.product?.sku || '').toLowerCase();
      const barcode = (b.variant?.barcode || '').toLowerCase();
      const size = (b.variant?.size || '').toLowerCase();
      const color = (b.variant?.color || '').toLowerCase();

      return (
        pName.includes(q) ||
        brand.includes(q) ||
        cat.includes(q) ||
        sku.includes(q) ||
        barcode.includes(q) ||
        size.includes(q) ||
        color.includes(q)
      );
    });
  }, [balances, balanceFilter, searchQuery]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (movementTypeFilter !== 'all' && m.type !== movementTypeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const pName = m.variant?.product?.name?.toLowerCase() || '';
      const brand = m.variant?.product?.brand?.name?.toLowerCase() || '';
      const sku = (m.variant?.sku || m.variant?.product?.sku || '').toLowerCase();
      const barcode = (m.variant?.barcode || '').toLowerCase();
      const reason = (m.reason || '').toLowerCase();
      const ref = (m.reference || '').toLowerCase();

      return (
        pName.includes(q) ||
        brand.includes(q) ||
        sku.includes(q) ||
        barcode.includes(q) ||
        reason.includes(q) ||
        ref.includes(q)
      );
    });
  }, [movements, movementTypeFilter, searchQuery]);

  // Record Movement Submit
  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) {
      setModalError('Seleziona un articolo o variante');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty === 0) {
      setModalError('Inserisci una quantità valida diversa da zero');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      const parsedCost = unitCost ? parseFloat(unitCost) : null;

      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: selectedVariantId,
          type: movementType,
          quantity_delta: qty,
          unit_cost: parsedCost && !isNaN(parsedCost) ? parsedCost : null,
          reason: reason.trim() || null,
          reference: reference.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la registrazione del movimento');
      }

      setIsModalOpen(false);
      setSelectedVariantId('');
      setQuantity('');
      setUnitCost('');
      setReason('');
      setReference('');
      await fetchInventory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore registrazione';
      setModalError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Export Low Stock Reorder List (CSV)
  const exportReorderCSV = () => {
    const lowStockItems = balances.filter(
      (b) => (b.quantity_on_hand || 0) <= (b.variant?.reorder_threshold ?? 2)
    );

    if (lowStockItems.length === 0) {
      alert('Nessun articolo attualmente sotto scorta.');
      return;
    }

    const headers = ['Prodotto', 'Brand', 'Taglia', 'Colore', 'SKU', 'Barcode', 'Giacenza Attuale', 'Soglia Minima', 'Qta Consigliata Riordino', 'Prezzo Costo Stimato'];
    const rows = lowStockItems.map((b) => {
      const p = b.variant?.product;
      const v = b.variant;
      const onHand = b.quantity_on_hand || 0;
      const threshold = v?.reorder_threshold ?? 2;
      const suggested = Math.max(threshold * 2 - onHand, 3);
      const cost = v?.cost_price || p?.cost_price || 0;

      return [
        `"${p?.name || ''}"`,
        `"${p?.brand?.name || ''}"`,
        `"${v?.size || ''}"`,
        `"${v?.color || ''}"`,
        `"${v?.sku || p?.sku || ''}"`,
        `"${v?.barcode || ''}"`,
        onHand,
        threshold,
        suggested,
        cost.toFixed(2),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RIVO_Lista_Riordino_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Start New Count Session
  const handleStartCount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStartingCount(true);
      const res = await fetch('/api/inventory/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          name: newCountName || `Inventario del ${new Date().toLocaleDateString('it-IT')}`,
          notes: newCountNotes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore creazione inventario');

      setIsStartCountModalOpen(false);
      setNewCountName('');
      setNewCountNotes('');
      await fetchInventory();
      if (data.count?.id) {
        await loadCountDetails(data.count.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore avvio inventario';
      alert(msg);
    } finally {
      setStartingCount(false);
    }
  };

  // Update Counted Quantity on Item
  const handleUpdateCountItem = async (itemId: string, newCountedQty: number) => {
    if (!activeCount) return;
    try {
      // Optimistic update
      setActiveCount({
        ...activeCount,
        items: activeCount.items.map((it) =>
          it.id === itemId
            ? { ...it, counted_quantity: newCountedQty, discrepancy: newCountedQty - it.expected_quantity }
            : it
        ),
      });

      await fetch('/api/inventory/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_item',
          item_id: itemId,
          counted_quantity: newCountedQty,
        }),
      });
    } catch (err) {
      console.error('Update count item error:', err);
    }
  };

  // Apply Inventory Count
  const handleApplyCount = async () => {
    if (!activeCount) return;
    const discrepanciesCount = activeCount.items.filter((it) => it.discrepancy !== 0).length;
    const confirmMsg = `Confermi la riconciliazione dell'inventario?\n\nVerranno applicate ${discrepanciesCount} rettifiche automatiche di magazzino in modo atomico.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setApplyingCount(true);
      const res = await fetch('/api/inventory/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          count_id: activeCount.session.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore riconciliazione');

      alert(`Inventario riconciliato con successo! Rettifiche applicate: ${data.result?.adjustments_applied || 0}`);
      setActiveCount(null);
      await fetchInventory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore applicazione inventario';
      alert(msg);
    } finally {
      setApplyingCount(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            <Boxes className="w-3.5 h-3.5 text-lime-500 dark:text-[#bfff00]" />
            <span>Retail Inventory & Stock Logistics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Magazzino & Scorte
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Controllo giacenze in tempo reale per variante, storico movimenti atomico e procedura di inventario periodico.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportReorderCSV}
            title="Esporta lista prodotti sotto scorta in formato CSV per riordino fornitori"
            className="inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            <span className="hidden md:inline">Lista Riordino CSV</span>
          </button>

          <button
            onClick={() => {
              setModalError(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-[#bfff00] text-black px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#a8e600] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Registra Movimento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-zinc-500 font-medium">Valore Magazzino (Costo)</span>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white font-mono mt-1">
            € {stats.totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Stima costo d&apos;acquisto totale
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-zinc-500 font-medium">Pezzi Totali in Stock</span>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white font-mono mt-1">
            {stats.totalPieces.toLocaleString('it-IT')} pz
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Distribuite su {balances.length} varianti
          </span>
        </div>

        <div 
          onClick={() => { setActiveTab('balances'); setBalanceFilter('low'); }}
          className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs cursor-pointer hover:border-amber-500/40 transition-colors"
        >
          <span className="text-xs text-zinc-500 font-medium flex items-center justify-between">
            <span>Sotto Scorta Riordino</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </span>
          <div className={`text-2xl font-bold font-mono mt-1 ${stats.lowStockCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {stats.lowStockCount} varianti
          </div>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1 block">
            {stats.lowStockCount > 0 ? 'Clicca per filtrare e riordinare' : 'Tutte le scorte sono ottimali'}
          </span>
        </div>

        <div 
          onClick={() => { setActiveTab('balances'); setBalanceFilter('out'); }}
          className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs cursor-pointer hover:border-rose-500/40 transition-colors"
        >
          <span className="text-xs text-zinc-500 font-medium flex items-center justify-between">
            <span>Giacenze a Zero (Esauriti)</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </span>
          <div className={`text-2xl font-bold font-mono mt-1 ${stats.outOfStockCount > 0 ? 'text-rose-500' : 'text-zinc-500'}`}>
            {stats.outOfStockCount} varianti
          </div>
          <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1 block">
            {stats.outOfStockCount > 0 ? 'Articoli con stock terminato' : 'Nessun articolo a zero'}
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('balances'); setActiveCount(null); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'balances'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Giacenze per Variante ({balances.length})
          </button>
          <button
            onClick={() => { setActiveTab('movements'); setActiveCount(null); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'movements'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Storico Movimenti ({movements.length})
          </button>
          <button
            onClick={() => setActiveTab('counts')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'counts'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Inventario Fisico ({counts.length})</span>
          </button>
        </div>

        {/* Global Search within active tab */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'balances' 
                ? "Cerca articolo, SKU, barcode, taglia..." 
                : activeTab === 'movements'
                ? "Cerca per documento, articolo o causale..."
                : "Filtra sessioni inventario..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
          />
        </div>
      </div>

      {/* Error state banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Giacenze Attuali (Stock Balances) */}
      {loading ? (
        <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#bfff00]" />
          <span className="text-xs">Sincronizzazione scorte di magazzino in corso...</span>
        </div>
      ) : activeTab === 'balances' ? (
        <div className="space-y-3">
          {/* Sub-filters for balances */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium">Stato Giacenza:</span>
            <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-900">
              <button
                onClick={() => setBalanceFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  balanceFilter === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Tutti ({balances.length})
              </button>
              <button
                onClick={() => setBalanceFilter('low')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  balanceFilter === 'low'
                    ? 'bg-amber-500/20 text-amber-500 font-semibold'
                    : 'text-zinc-500 hover:text-amber-500'
                }`}
              >
                Sotto Scorta ({stats.lowStockCount})
              </button>
              <button
                onClick={() => setBalanceFilter('out')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  balanceFilter === 'out'
                    ? 'bg-rose-500/20 text-rose-500 font-semibold'
                    : 'text-zinc-500 hover:text-rose-500'
                }`}
              >
                Esauriti ({stats.outOfStockCount})
              </button>
              <button
                onClick={() => setBalanceFilter('in')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  balanceFilter === 'in'
                    ? 'bg-emerald-500/20 text-emerald-500 font-semibold'
                    : 'text-zinc-500 hover:text-emerald-500'
                }`}
              >
                Disponibili ({balances.length - stats.lowStockCount - stats.outOfStockCount})
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Articolo & Brand</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Taglia / Colore</th>
                    <th className="px-4 py-3">SKU & Barcode</th>
                    <th className="px-4 py-3 text-right">Giacenza</th>
                    <th className="px-4 py-3 text-right">Soglia Min.</th>
                    <th className="px-4 py-3 text-right">Valore Stimato</th>
                    <th className="px-4 py-3 text-center">Stato</th>
                    <th className="px-4 py-3 text-right">Azioni Rapide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                  {filteredBalances.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-zinc-400">
                        Nessuna giacenza trovata con i filtri correnti.
                      </td>
                    </tr>
                  ) : (
                    filteredBalances.map((b) => {
                      const onHand = b.quantity_on_hand || 0;
                      const threshold = b.variant?.reorder_threshold ?? 2;
                      const isLow = onHand > 0 && onHand <= threshold;
                      const isOut = onHand <= 0;
                      const cost = b.variant?.cost_price || b.variant?.product?.cost_price || 0;
                      const itemVal = onHand * cost;

                      return (
                        <tr key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-white">
                            <div>{b.variant?.product?.name || 'N/D'}</div>
                            {b.variant?.product?.brand?.name && (
                              <span className="text-[10px] text-zinc-400 block font-normal uppercase">
                                {b.variant.product.brand.name}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-zinc-500">
                            {b.variant?.product?.category?.name || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                              {b.variant?.size || 'U'}
                            </span>
                            {b.variant?.color && (
                              <span className="text-zinc-500 ml-1.5">• {b.variant.color}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">
                            <div>{b.variant?.sku || b.variant?.product?.sku || '-'}</div>
                            {b.variant?.barcode && (
                              <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                                <Barcode className="w-3 h-3 text-zinc-400" />
                                <span>{b.variant.barcode}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-sm text-zinc-950 dark:text-white">
                            {onHand}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-500">
                            {threshold}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                            € {itemVal.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                Esaurito
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <AlertTriangle className="w-3 h-3" /> Sotto scorta
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> In stock
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedVariantId(b.variant_id);
                                setMovementType('purchase');
                                setQuantity('10');
                                setIsModalOpen(true);
                              }}
                              className="text-[11px] font-medium text-lime-600 dark:text-[#bfff00] hover:underline"
                            >
                              Carica Merce
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'movements' ? (
        /* Tab 2: Storico Movimenti (Full Audit Trail) */
        <div className="space-y-3">
          {/* Sub-filter by movement type */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium">Filtra per Tipo:</span>
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-white focus:outline-none"
            >
              <option value="all">Tutti i tipi</option>
              <option value="purchase">Carico Acquisto / Fornitore</option>
              <option value="sale">Scarico Vendita Cassa</option>
              <option value="return">Reso Cliente</option>
              <option value="adjustment">Rettifica Magazzino</option>
              <option value="inventory_count">Inventario Fisico</option>
              <option value="damaged">Merce Danneggiata</option>
              <option value="initial">Giacenza Iniziale</option>
            </select>
          </div>

          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Data & Ora</th>
                    <th className="px-4 py-3">Tipo Movimento</th>
                    <th className="px-4 py-3">Articolo & Variante</th>
                    <th className="px-4 py-3 text-right">Variazione</th>
                    <th className="px-4 py-3 text-right">Giacenza Dopo</th>
                    <th className="px-4 py-3 text-right">Costo Unit.</th>
                    <th className="px-4 py-3">Causale & Documento Rif.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-zinc-400">
                        Nessun movimento registrato.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const delta = m.quantity_delta;
                      return (
                        <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-3 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                            {new Date(m.created_at).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3">
                            {m.type === 'purchase' || m.type === 'in' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <ArrowDownLeft className="w-3.5 h-3.5" /> Carico Acquisto
                              </span>
                            ) : m.type === 'sale' || m.type === 'out' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                <ArrowUpRight className="w-3.5 h-3.5" /> Vendita Cassa
                              </span>
                            ) : m.type === 'return' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-500">
                                <RotateCcw className="w-3.5 h-3.5" /> Reso Merce
                              </span>
                            ) : m.type === 'inventory_count' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-500">
                                <ClipboardList className="w-3.5 h-3.5" /> Inventario Fisico
                              </span>
                            ) : m.type === 'damaged' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-500">
                                Danneggiato / Difetto
                              </span>
                            ) : m.type === 'initial' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500">
                                Iniziale
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                                Rettifica Manuale
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-zinc-950 dark:text-white">
                              {m.variant?.product?.name || 'Articolo'}
                            </span>
                            <span className="text-zinc-500 block text-[11px]">
                              {m.variant?.product?.brand?.name ? `${m.variant.product.brand.name} • ` : ''}
                              Taglia {m.variant?.size || 'U'} {m.variant?.color ? `• ${m.variant.color}` : ''}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-bold ${
                            delta > 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {delta > 0 ? `+${delta}` : delta}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-950 dark:text-white">
                            {m.quantity_after !== null ? m.quantity_after : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-500">
                            {m.unit_cost !== null ? `€ ${Number(m.unit_cost).toFixed(2)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-zinc-500">
                            <div>{m.reason || '-'}</div>
                            {m.reference && (
                              <span className="font-mono text-[10px] text-zinc-400 block">
                                Rif: {m.reference}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 3: Inventario Fisico Periodico (PRD §21) */
        <div className="space-y-4">
          {!activeCount ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Sessioni di Inventario Periodico</h3>
                  <p className="text-xs text-zinc-500">
                    Esegui la conta fisica dei prodotti nel punto vendita, calcola le discrepanze teoriche e riconcilia il magazzino.
                  </p>
                </div>
                <button
                  onClick={() => setIsStartCountModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-[#bfff00] text-black px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-[#a8e600] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuovo Inventario Fisico</span>
                </button>
              </div>

              <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Data Creazione</th>
                      <th className="px-4 py-3">Nome Sessione</th>
                      <th className="px-4 py-3">Stato</th>
                      <th className="px-4 py-3">Note</th>
                      <th className="px-4 py-3 text-right">Azione</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                    {counts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-zinc-400">
                          Nessuna sessione di inventario registrata finora.
                        </td>
                      </tr>
                    ) : (
                      counts.map((c) => (
                        <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono text-zinc-500">
                            {new Date(c.created_at).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-white">
                            {c.name}
                          </td>
                          <td className="px-4 py-3">
                            {c.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Completato & Riconciliato
                              </span>
                            ) : c.status === 'in_progress' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                In Corso (Bozza)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                Annullato
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-zinc-500">
                            {c.notes || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => loadCountDetails(c.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-lime-600 dark:text-[#bfff00] hover:underline"
                            >
                              <span>{c.status === 'in_progress' ? 'Continua Conta' : 'Visualizza Report'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Active Count Detail View */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div>
                  <button
                    onClick={() => setActiveCount(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-1 inline-flex items-center gap-1"
                  >
                    ← Torna all&apos;elenco sessioni
                  </button>
                  <h3 className="text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    <span>{activeCount.session.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      activeCount.session.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {activeCount.session.status === 'completed' ? 'Riconciliato' : 'In Corso'}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Righe totali: {activeCount.items.length} | Discrepanze:{' '}
                    <span className="font-semibold text-amber-500">
                      {activeCount.items.filter((it) => it.discrepancy !== 0).length}
                    </span>
                  </p>
                </div>

                {activeCount.session.status === 'in_progress' && (
                  <button
                    onClick={handleApplyCount}
                    disabled={applyingCount}
                    className="inline-flex items-center gap-2 bg-[#bfff00] text-black px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#a8e600] disabled:opacity-50"
                  >
                    {applyingCount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>Conferma & Riconcilia Magazzino</span>
                  </button>
                )}
              </div>

              <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Articolo / Brand</th>
                      <th className="px-4 py-3">Taglia / Colore</th>
                      <th className="px-4 py-3">SKU & Barcode</th>
                      <th className="px-4 py-3 text-right">Giacenza Teorica</th>
                      <th className="px-4 py-3 text-right">Quantità Contata</th>
                      <th className="px-4 py-3 text-right">Discrepanza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                    {activeCount.items.map((it) => {
                      const isDiff = it.discrepancy !== 0;
                      return (
                        <tr key={it.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-white">
                            <div>{it.variant?.product?.name || 'Articolo'}</div>
                            {it.variant?.product?.brand?.name && (
                              <span className="text-[10px] text-zinc-400 font-normal uppercase">
                                {it.variant.product.brand.name}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-semibold">{it.variant?.size || 'U'}</span>
                            {it.variant?.color && <span className="text-zinc-500 ml-1">• {it.variant.color}</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">
                            <div>{it.variant?.sku || '-'}</div>
                            {it.variant?.barcode && <div className="text-[10px] text-zinc-500">{it.variant.barcode}</div>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {it.expected_quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {activeCount.session.status === 'in_progress' ? (
                              <input
                                type="number"
                                min="0"
                                value={it.counted_quantity}
                                onChange={(e) => handleUpdateCountItem(it.id, parseInt(e.target.value, 10) || 0)}
                                className="w-16 text-right font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                              />
                            ) : (
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">{it.counted_quantity}</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono font-bold ${
                            it.discrepancy === 0
                              ? 'text-emerald-500'
                              : it.discrepancy < 0
                              ? 'text-rose-500'
                              : 'text-blue-500'
                          }`}>
                            {it.discrepancy > 0 ? `+${it.discrepancy}` : it.discrepancy}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[#bfff00]" />
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Registra Movimento Magazzino</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleRecordMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Articolo / Variante *
                </label>
                <select
                  required
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                >
                  <option value="">Seleziona variante dal catalogo...</option>
                  {balances.map((b) => (
                    <option key={b.variant_id} value={b.variant_id}>
                      {b.variant?.product?.name} ({b.variant?.product?.brand?.name || 'No brand'}) - Taglia {b.variant?.size || 'U'} {b.variant?.color || ''} [Giacenza: {b.quantity_on_hand}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tipo Operazione
                  </label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  >
                    <option value="purchase">Carico Merce / Acquisto (+)</option>
                    <option value="sale">Scarico Vendita (-)</option>
                    <option value="return">Reso Merce (+)</option>
                    <option value="adjustment">Rettifica Magazzino (+/-)</option>
                    <option value="damaged">Merce Danneggiata (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Quantità *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Costo Unitario € (Opzionale)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Riferimento DDT / Fattura
                  </label>
                  <input
                    type="text"
                    placeholder="es. DDT-2026-99"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Causale Movimento
                </label>
                <input
                  type="text"
                  placeholder="es. Arrivo merce fornitore Borrelli, reso cliente scontrino #104..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#bfff00] text-black px-5 py-2 rounded-xl text-xs font-semibold hover:bg-[#a8e600] disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Registra Movimento Atomico</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Count Modal */}
      {isStartCountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#bfff00]" />
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Nuova Sessione di Inventario</h2>
              </div>
              <button
                onClick={() => setIsStartCountModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartCount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome Sessione *
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Inventario del ${new Date().toLocaleDateString('it-IT')}`}
                  value={newCountName}
                  onChange={(e) => setNewCountName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Note Operative (Opzionale)
                </label>
                <textarea
                  rows={3}
                  placeholder="es. Inventario semestrale calzature e accessori..."
                  value={newCountNotes}
                  onChange={(e) => setNewCountNotes(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsStartCountModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={startingCount}
                  className="inline-flex items-center gap-2 bg-[#bfff00] text-black px-5 py-2 rounded-xl text-xs font-semibold hover:bg-[#a8e600] disabled:opacity-50"
                >
                  {startingCount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Avvia Sessione</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

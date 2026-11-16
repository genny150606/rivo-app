'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  AlertTriangle,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  Download,
  ClipboardList,
  ShieldCheck,
  Barcode,
  TrendingDown,
  ChevronRight,
  Coins,
  ArrowLeft,
} from 'lucide-react';
import {
  PageHeader,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  SegmentedControl,
  EmptyState,
} from '@/components/ui';
import { formatItCurrency } from '@/lib/chart-theme';
import { cn } from '@/lib/cn';

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
  const [activeCount, setActiveCount] = useState<{
    session: InventoryCountSession;
    items: InventoryCountItem[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);
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

  // Start Count Modal & Apply Count Confirm Modal
  const [isStartCountModalOpen, setIsStartCountModalOpen] = useState(false);
  const [startCountError, setStartCountError] = useState<string | null>(null);
  const [newCountName, setNewCountName] = useState('');
  const [newCountNotes, setNewCountNotes] = useState('');
  const [startingCount, setStartingCount] = useState(false);
  const [applyingCount, setApplyingCount] = useState(false);
  const [isConfirmApplyOpen, setIsConfirmApplyOpen] = useState(false);

  // Load Inventory Data
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [movRes, countsRes] = await Promise.all([
        fetch('/api/inventory/movements?limit=150'),
        fetch('/api/inventory/counts'),
      ]);

      const [movData, countsData] = await Promise.all([movRes.json(), countsRes.json()]);

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

  // Escape closes open modals
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isConfirmApplyOpen) setIsConfirmApplyOpen(false);
      else if (isStartCountModalOpen) setIsStartCountModalOpen(false);
      else if (isModalOpen) setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isConfirmApplyOpen, isStartCountModalOpen, isModalOpen]);

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
      const cost =
        b.variant?.cost_price ||
        b.variant?.product?.cost_price ||
        (b.variant?.sale_price || b.variant?.product?.sale_price || 0) * 0.5;
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
      const qty = b.quantity_on_hand || 0;
      const threshold = b.variant?.reorder_threshold ?? 2;
      if (balanceFilter === 'low' && (qty <= 0 || qty > threshold)) return false;
      if (balanceFilter === 'out' && qty > 0) return false;
      if (balanceFilter === 'in' && qty <= threshold) return false;

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
      const reasonText = (m.reason || '').toLowerCase();
      const ref = (m.reference || '').toLowerCase();

      return (
        pName.includes(q) ||
        brand.includes(q) ||
        sku.includes(q) ||
        barcode.includes(q) ||
        reasonText.includes(q) ||
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
      setFeedback({ type: 'success', message: 'Movimento di magazzino registrato con successo.' });
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
      setFeedback({
        type: 'warning',
        message: 'Nessun articolo attualmente sotto scorta da esportare.',
      });
      return;
    }

    const headers = [
      'Prodotto',
      'Brand',
      'Taglia',
      'Colore',
      'SKU',
      'Barcode',
      'Giacenza Attuale',
      'Soglia Minima',
      'Qta Consigliata Riordino',
      'Prezzo Costo Stimato',
    ];
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
      setStartCountError(null);
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
      setStartCountError(msg);
    } finally {
      setStartingCount(false);
    }
  };

  // Update Counted Quantity on Item
  const handleUpdateCountItem = async (itemId: string, newCountedQty: number) => {
    if (!activeCount) return;
    try {
      setActiveCount({
        ...activeCount,
        items: activeCount.items.map((it) =>
          it.id === itemId
            ? {
                ...it,
                counted_quantity: newCountedQty,
                discrepancy: newCountedQty - it.expected_quantity,
              }
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

  // Apply Inventory Count (inline confirmation modal instead of window.confirm/alert)
  const executeApplyCount = async () => {
    if (!activeCount) return;

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

      setIsConfirmApplyOpen(false);
      setActiveCount(null);
      setFeedback({
        type: 'success',
        message: `Inventario riconciliato con successo! Rettifiche applicate: ${
          data.result?.adjustments_applied || 0
        }`,
      });
      await fetchInventory();
    } catch (err: unknown) {
      setIsConfirmApplyOpen(false);
      const msg = err instanceof Error ? err.message : 'Errore applicazione inventario';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setApplyingCount(false);
    }
  };

  const activeDiscrepanciesCount = activeCount
    ? activeCount.items.filter((it) => it.discrepancy !== 0).length
    : 0;

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="02 // RETAIL INVENTORY & LOGISTICS"
        title="Magazzino & Scorte"
        description="Controllo giacenze in tempo reale per variante, storico movimenti atomico e procedura di inventario periodico."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={exportReorderCSV}
              title="Esporta lista prodotti sotto scorta in formato CSV per riordino fornitori"
              className="inline-flex items-center justify-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-3.5 min-h-[40px] max-sm:min-h-[44px] rounded-lg text-xs font-semibold hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden md:inline">Lista Riordino CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-4 min-h-[40px] max-sm:min-h-[44px] rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              <span>Registra Movimento</span>
            </button>
          </div>
        }
      />

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3',
            feedback.type === 'success'
              ? 'bg-[var(--accent-operational-bg)] border-[var(--accent-operational-border)] text-[var(--accent-operational-text)]'
              : feedback.type === 'warning'
              ? 'bg-[var(--accent-warning-bg)] border-[var(--accent-warning-border)] text-[var(--accent-warning-text)]'
              : 'bg-[var(--accent-critical-bg)] border-[var(--accent-critical-border)] text-[var(--accent-critical-text)]'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            ) : feedback.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            )}
            <span className="font-medium truncate">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Chiudi notifica"
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Valore Magazzino (Costo)"
          value={formatItCurrency(stats.totalValue)}
          icon={Coins}
          context="Stima costo d'acquisto totale"
          loading={loading}
        />
        <KpiCard
          label="Pezzi Totali in Stock"
          value={`${stats.totalPieces.toLocaleString('it-IT')} pz`}
          icon={Boxes}
          context={`Distribuite su ${balances.length} varianti`}
          loading={loading}
        />
        <KpiCard
          label="Sotto Scorta Riordino"
          value={`${stats.lowStockCount} varianti`}
          icon={AlertTriangle}
          tone={stats.lowStockCount > 0 ? 'warning' : 'operational'}
          context={
            stats.lowStockCount > 0
              ? 'Clicca per filtrare e riordinare'
              : 'Tutte le scorte sono ottimali'
          }
          onClick={() => {
            setActiveTab('balances');
            setBalanceFilter('low');
          }}
          loading={loading}
        />
        <KpiCard
          label="Giacenze a Zero (Esauriti)"
          value={`${stats.outOfStockCount} varianti`}
          icon={TrendingDown}
          tone={stats.outOfStockCount > 0 ? 'critical' : 'neutral'}
          context={
            stats.outOfStockCount > 0 ? 'Articoli con stock terminato' : 'Nessun articolo a zero'
          }
          onClick={() => {
            setActiveTab('balances');
            setBalanceFilter('out');
          }}
          loading={loading}
        />
      </div>

      {/* Main Tabs Navigation + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="overflow-x-auto pb-1 lg:pb-0">
          <SegmentedControl
            ariaLabel="Sezioni magazzino"
            value={activeTab}
            onChange={(next) => {
              setActiveTab(next);
              if (next !== 'counts') setActiveCount(null);
            }}
            options={[
              { value: 'balances', label: 'Giacenze per Variante', badge: balances.length },
              { value: 'movements', label: 'Storico Movimenti', badge: movements.length },
              {
                value: 'counts',
                label: 'Inventario Fisico',
                icon: ClipboardList,
                badge: counts.length,
              },
            ]}
          />
        </div>

        {/* Global Search within active tab */}
        <div className="relative w-full lg:w-80">
          <label htmlFor="inventory-search" className="sr-only">
            Cerca in magazzino
          </label>
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <input
            id="inventory-search"
            type="search"
            placeholder={
              activeTab === 'balances'
                ? 'Cerca articolo, SKU, barcode, taglia…'
                : activeTab === 'movements'
                ? 'Cerca per documento, articolo o causale…'
                : 'Filtra sessioni inventario…'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[40px] max-sm:min-h-[44px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--focus-ring)] transition-colors"
          />
        </div>
      </div>

      {/* Error state banner */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-2" aria-busy="true">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rivo-volt-text)]" aria-hidden="true" />
          <span className="text-xs font-mono uppercase tracking-wider">
            Sincronizzazione scorte di magazzino in corso…
          </span>
        </div>
      ) : activeTab === 'balances' ? (
        <div className="space-y-3">
          {/* Sub-filters for balances */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[var(--text-muted)] font-medium">Stato Giacenza:</span>
            <div className="overflow-x-auto max-w-full">
              <SegmentedControl
                size="sm"
                ariaLabel="Filtra stato giacenza"
                value={balanceFilter}
                onChange={setBalanceFilter}
                options={[
                  { value: 'all', label: 'Tutti', badge: balances.length },
                  { value: 'low', label: 'Sotto Scorta', badge: stats.lowStockCount },
                  { value: 'out', label: 'Esauriti', badge: stats.outOfStockCount },
                  {
                    value: 'in',
                    label: 'Disponibili',
                    badge: Math.max(0, balances.length - stats.lowStockCount - stats.outOfStockCount),
                  },
                ]}
              />
            </div>
          </div>

          <SurfaceCard padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[860px]">
                <thead className="bg-[var(--bg-elevated)]/70 border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px] font-semibold uppercase tracking-wider">
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
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredBalances.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6">
                        <EmptyState
                          icon={Boxes}
                          title="Nessuna giacenza trovata"
                          description="Nessuna giacenza trovata con i filtri correnti."
                          compact
                        />
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
                        <tr
                          key={b.id}
                          className="hover:bg-[var(--bg-elevated)]/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                            <div>{b.variant?.product?.name || 'N/D'}</div>
                            {b.variant?.product?.brand?.name && (
                              <span className="font-mono text-[10px] text-[var(--text-muted)] block font-normal uppercase">
                                {b.variant.product.brand.name}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)]">
                            {b.variant?.product?.category?.name || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-semibold text-[var(--text-primary)]">
                              {b.variant?.size || 'U'}
                            </span>
                            {b.variant?.color && (
                              <span className="text-[var(--text-secondary)] ml-1.5">
                                • {b.variant.color}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                            <div>{b.variant?.sku || b.variant?.product?.sku || '—'}</div>
                            {b.variant?.barcode && (
                              <div className="text-[10px] flex items-center gap-1">
                                <Barcode className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
                                <span>{b.variant.barcode}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-sm text-[var(--text-primary)]">
                            {onHand}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                            {threshold}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                            {formatItCurrency(itemVal)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isOut ? (
                              <StatusBadge tone="critical" size="sm">
                                Esaurito
                              </StatusBadge>
                            ) : isLow ? (
                              <StatusBadge tone="warning" icon={AlertTriangle} size="sm">
                                Sotto scorta
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone="operational" icon={CheckCircle2} size="sm">
                                In stock
                              </StatusBadge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVariantId(b.variant_id);
                                setMovementType('purchase');
                                setQuantity('10');
                                setIsModalOpen(true);
                              }}
                              className="text-[11px] font-semibold text-[var(--rivo-volt-text)] hover:underline cursor-pointer"
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
          </SurfaceCard>
        </div>
      ) : activeTab === 'movements' ? (
        /* Tab 2: Storico Movimenti (Full Audit Trail) */
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label htmlFor="movement-type-filter" className="text-[var(--text-muted)] font-medium">
              Filtra per Tipo:
            </label>
            <select
              id="movement-type-filter"
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="min-h-[38px] max-sm:min-h-[44px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
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

          <SurfaceCard padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[820px]">
                <thead className="bg-[var(--bg-elevated)]/70 border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px] font-semibold uppercase tracking-wider">
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
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6">
                        <EmptyState
                          icon={Boxes}
                          title="Nessun movimento registrato"
                          description="I carichi, scarichi e rettifiche appariranno qui in ordine cronologico."
                          compact
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const delta = m.quantity_delta;
                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-[var(--bg-elevated)]/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap font-mono tabular-nums text-[11px]">
                            {new Date(m.created_at).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3">
                            {m.type === 'purchase' || m.type === 'in' ? (
                              <StatusBadge tone="operational" icon={ArrowDownLeft} size="sm">
                                Carico Acquisto
                              </StatusBadge>
                            ) : m.type === 'sale' || m.type === 'out' ? (
                              <StatusBadge tone="critical" icon={ArrowUpRight} size="sm">
                                Vendita Cassa
                              </StatusBadge>
                            ) : m.type === 'return' ? (
                              <StatusBadge tone="telemetry" icon={RotateCcw} size="sm">
                                Reso Merce
                              </StatusBadge>
                            ) : m.type === 'inventory_count' ? (
                              <StatusBadge tone="volt" icon={ClipboardList} size="sm">
                                Inventario Fisico
                              </StatusBadge>
                            ) : m.type === 'damaged' ? (
                              <StatusBadge tone="warning" size="sm">
                                Danneggiato / Difetto
                              </StatusBadge>
                            ) : m.type === 'initial' ? (
                              <StatusBadge tone="telemetry" size="sm">
                                Iniziale
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone="neutral" size="sm">
                                Rettifica Manuale
                              </StatusBadge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-[var(--text-primary)]">
                              {m.variant?.product?.name || 'Articolo'}
                            </span>
                            <span className="text-[var(--text-secondary)] block text-[11px]">
                              {m.variant?.product?.brand?.name
                                ? `${m.variant.product.brand.name} • `
                                : ''}
                              Taglia {m.variant?.size || 'U'}{' '}
                              {m.variant?.color ? `• ${m.variant.color}` : ''}
                            </span>
                          </td>
                          <td
                            className={cn(
                              'px-4 py-3 text-right font-mono tabular-nums font-bold',
                              delta > 0
                                ? 'text-[var(--accent-operational-text)]'
                                : 'text-[var(--accent-critical-text)]'
                            )}
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--text-primary)]">
                            {m.quantity_after !== null ? m.quantity_after : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                            {m.unit_cost !== null ? formatItCurrency(Number(m.unit_cost)) : '—'}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)]">
                            <div>{m.reason || '—'}</div>
                            {m.reference && (
                              <span className="font-mono text-[10px] text-[var(--text-muted)] block">
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
          </SurfaceCard>
        </div>
      ) : (
        /* Tab 3: Inventario Fisico Periodico */
        <div className="space-y-4">
          {!activeCount ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">
                    Sessioni di Inventario Periodico
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Esegui la conta fisica dei prodotti nel punto vendita, calcola le discrepanze teoriche e riconcilia il magazzino.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStartCountError(null);
                    setIsStartCountModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-3.5 min-h-[40px] max-sm:min-h-[44px] rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                  <span>Nuovo Inventario Fisico</span>
                </button>
              </div>

              <SurfaceCard padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[640px]">
                    <thead className="bg-[var(--bg-elevated)]/70 border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px] font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Data Creazione</th>
                        <th className="px-4 py-3">Nome Sessione</th>
                        <th className="px-4 py-3">Stato</th>
                        <th className="px-4 py-3">Note</th>
                        <th className="px-4 py-3 text-right">Azione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {counts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6">
                            <EmptyState
                              icon={ClipboardList}
                              title="Nessuna sessione di inventario"
                              description="Avvia una nuova sessione di inventario fisico per verificare le giacenze."
                              compact
                            />
                          </td>
                        </tr>
                      ) : (
                        counts.map((c) => (
                          <tr
                            key={c.id}
                            className="hover:bg-[var(--bg-elevated)]/50 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono tabular-nums text-[var(--text-secondary)]">
                              {new Date(c.created_at).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                              {c.name}
                            </td>
                            <td className="px-4 py-3">
                              {c.status === 'completed' ? (
                                <StatusBadge tone="operational" icon={CheckCircle2} size="sm">
                                  Completato & Riconciliato
                                </StatusBadge>
                              ) : c.status === 'in_progress' ? (
                                <StatusBadge tone="warning" size="sm">
                                  In Corso (Bozza)
                                </StatusBadge>
                              ) : (
                                <StatusBadge tone="neutral" size="sm">
                                  Annullato
                                </StatusBadge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[var(--text-secondary)]">
                              {c.notes || '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => loadCountDetails(c.id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--rivo-volt-text)] hover:underline cursor-pointer"
                              >
                                <span>
                                  {c.status === 'in_progress'
                                    ? 'Continua Conta'
                                    : 'Visualizza Report'}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SurfaceCard>
            </div>
          ) : (
            /* Active Count Detail View */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveCount(null)}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-1.5 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Torna all&apos;elenco sessioni</span>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                      {activeCount.session.name}
                    </h2>
                    <StatusBadge
                      tone={activeCount.session.status === 'completed' ? 'operational' : 'warning'}
                      size="sm"
                    >
                      {activeCount.session.status === 'completed' ? 'Riconciliato' : 'In Corso'}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-mono tabular-nums mt-1">
                    Righe totali: {activeCount.items.length} | Discrepanze:{' '}
                    <span className="font-semibold text-[var(--accent-warning-text)]">
                      {activeDiscrepanciesCount}
                    </span>
                  </p>
                </div>

                {activeCount.session.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmApplyOpen(true)}
                    disabled={applyingCount}
                    className="inline-flex items-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-4 min-h-[40px] max-sm:min-h-[44px] rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {applyingCount ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                    )}
                    <span>Conferma & Riconcilia Magazzino</span>
                  </button>
                )}
              </div>

              <SurfaceCard padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[680px]">
                    <thead className="bg-[var(--bg-elevated)]/70 border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px] font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Articolo / Brand</th>
                        <th className="px-4 py-3">Taglia / Colore</th>
                        <th className="px-4 py-3">SKU & Barcode</th>
                        <th className="px-4 py-3 text-right">Giacenza Teorica</th>
                        <th className="px-4 py-3 text-right">Quantità Contata</th>
                        <th className="px-4 py-3 text-right">Discrepanza</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {activeCount.items.map((it) => (
                        <tr
                          key={it.id}
                          className="hover:bg-[var(--bg-elevated)]/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                            <div>{it.variant?.product?.name || 'Articolo'}</div>
                            {it.variant?.product?.brand?.name && (
                              <span className="font-mono text-[10px] text-[var(--text-muted)] font-normal uppercase">
                                {it.variant.product.brand.name}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-semibold text-[var(--text-primary)]">
                              {it.variant?.size || 'U'}
                            </span>
                            {it.variant?.color && (
                              <span className="text-[var(--text-secondary)] ml-1">
                                • {it.variant.color}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                            <div>{it.variant?.sku || '—'}</div>
                            {it.variant?.barcode && (
                              <div className="text-[10px]">{it.variant.barcode}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[var(--text-primary)]">
                            {it.expected_quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {activeCount.session.status === 'in_progress' ? (
                              <input
                                type="number"
                                min="0"
                                aria-label={`Quantità contata per ${it.variant?.product?.name || 'Articolo'} ${it.variant?.size || ''}`}
                                value={it.counted_quantity}
                                onChange={(e) =>
                                  handleUpdateCountItem(it.id, parseInt(e.target.value, 10) || 0)
                                }
                                className="w-20 text-right font-mono tabular-nums font-bold bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                              />
                            ) : (
                              <span className="font-bold text-[var(--text-primary)]">
                                {it.counted_quantity}
                              </span>
                            )}
                          </td>
                          <td
                            className={cn(
                              'px-4 py-3 text-right font-mono tabular-nums font-bold',
                              it.discrepancy === 0
                                ? 'text-[var(--accent-operational-text)]'
                                : it.discrepancy < 0
                                ? 'text-[var(--accent-critical-text)]'
                                : 'text-[var(--accent-telemetry-text)]'
                            )}
                          >
                            {it.discrepancy > 0 ? `+${it.discrepancy}` : it.discrepancy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SurfaceCard>
            </div>
          )}
        </div>
      )}

      {/* Record Movement Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="record-movement-title"
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                <h2
                  id="record-movement-title"
                  className="font-display text-lg font-bold text-[var(--text-primary)]"
                >
                  Registra Movimento Magazzino
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Chiudi finestra"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            {modalError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleRecordMovement} className="space-y-4">
              <div>
                <label
                  htmlFor="mov-variant"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Articolo / Variante *
                </label>
                <select
                  id="mov-variant"
                  required
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                >
                  <option value="">Seleziona variante dal catalogo…</option>
                  {balances.map((b) => (
                    <option key={b.variant_id} value={b.variant_id}>
                      {b.variant?.product?.name} ({b.variant?.product?.brand?.name || 'No brand'}) -
                      Taglia {b.variant?.size || 'U'} {b.variant?.color || ''} [Giacenza:{' '}
                      {b.quantity_on_hand}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="mov-type"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Tipo Operazione
                  </label>
                  <select
                    id="mov-type"
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                    className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                  >
                    <option value="purchase">Carico Merce / Acquisto (+)</option>
                    <option value="sale">Scarico Vendita (-)</option>
                    <option value="return">Reso Merce (+)</option>
                    <option value="adjustment">Rettifica Magazzino (+/-)</option>
                    <option value="damaged">Merce Danneggiata (-)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="mov-qty"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Quantità *
                  </label>
                  <input
                    id="mov-qty"
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] font-mono tabular-nums focus:outline-none focus:border-[var(--focus-ring)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="mov-unit-cost"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Costo Unitario € (Opzionale)
                  </label>
                  <input
                    id="mov-unit-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] font-mono tabular-nums focus:outline-none focus:border-[var(--focus-ring)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mov-reference"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Riferimento DDT / Fattura
                  </label>
                  <input
                    id="mov-reference"
                    type="text"
                    placeholder="es. DDT-2026-99…"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--focus-ring)]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="mov-reason"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Causale Movimento
                </label>
                <input
                  id="mov-reason"
                  type="text"
                  placeholder="es. Arrivo merce fornitore Borrelli, reso cliente scontrino #104…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 min-h-[40px] text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-5 min-h-[40px] rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                  <span>Registra Movimento Atomico</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Count Modal */}
      {isStartCountModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="start-count-title"
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                <h2
                  id="start-count-title"
                  className="font-display text-lg font-bold text-[var(--text-primary)]"
                >
                  Nuova Sessione di Inventario
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsStartCountModalOpen(false)}
                aria-label="Chiudi finestra"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            {startCountError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>{startCountError}</span>
              </div>
            )}

            <form onSubmit={handleStartCount} className="space-y-4">
              <div>
                <label
                  htmlFor="count-session-name"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Nome Sessione *
                </label>
                <input
                  id="count-session-name"
                  type="text"
                  required
                  placeholder={`Inventario del ${new Date().toLocaleDateString('it-IT')}`}
                  value={newCountName}
                  onChange={(e) => setNewCountName(e.target.value)}
                  className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
              </div>

              <div>
                <label
                  htmlFor="count-session-notes"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Note Operative (Opzionale)
                </label>
                <textarea
                  id="count-session-notes"
                  rows={3}
                  placeholder="es. Inventario semestrale calzature e accessori…"
                  value={newCountNotes}
                  onChange={(e) => setNewCountNotes(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsStartCountModalOpen(false)}
                  className="px-4 min-h-[40px] text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={startingCount}
                  className="inline-flex items-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-5 min-h-[40px] rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {startingCount && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                  <span>Avvia Sessione</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Inventory Reconciliation Modal */}
      {isConfirmApplyOpen && activeCount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-reconcile-title"
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2
                  id="confirm-reconcile-title"
                  className="font-display text-base font-bold text-[var(--text-primary)]"
                >
                  Conferma Riconciliazione Inventario
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Confermi la riconciliazione dell&apos;inventario? Verranno applicate{' '}
                  <strong className="font-mono tabular-nums text-[var(--text-primary)]">
                    {activeDiscrepanciesCount}
                  </strong>{' '}
                  rettifiche automatiche di magazzino in modo atomico.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setIsConfirmApplyOpen(false)}
                disabled={applyingCount}
                className="px-4 min-h-[40px] text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={executeApplyCount}
                disabled={applyingCount}
                className="inline-flex items-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-5 min-h-[40px] rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {applyingCount && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                <span>Conferma & Riconcilia</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

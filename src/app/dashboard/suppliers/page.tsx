'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Truck,
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowDownLeft,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Supplier, Product, ProductVariant } from '@/platform/retail/types';
import {
  PageHeader,
  SurfaceCard,
  KpiCard,
  StatusBadge,
  SegmentedControl,
  EmptyState,
} from '@/components/ui';
import { formatItCurrency } from '@/lib/chart-theme';

interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  barcode: string | null;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  total_amount: number;
  expected_delivery_date: string | null;
  ordered_at: string | null;
  received_at: string | null;
  created_at: string;
  notes: string | null;
  supplier?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
  items?: PurchaseOrderItem[];
}

const INPUT_CLASS =
  'w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--rivo-volt)] focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors';

const COMPACT_NUMBER_INPUT_CLASS =
  'text-right font-mono tabular-nums font-bold bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)] focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors';

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filters
  const [supplierSearch, setSupplierSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Supplier Modal (Create / Edit)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierCompany, setSupplierCompany] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierCity, setSupplierCity] = useState('');
  const [supplierVat, setSupplierVat] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [supplierModalError, setSupplierModalError] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [confirmDeleteSupplier, setConfirmDeleteSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState(false);

  // Create Purchase Order Modal
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poDeliveryDate, setPoDeliveryDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<
    Array<{
      variant_id: string;
      product_name: string;
      variant_name: string;
      sku: string;
      barcode: string;
      quantity_ordered: number;
      unit_cost: number;
    }>
  >([]);
  const [savingPO, setSavingPO] = useState(false);
  const [poModalError, setPoModalError] = useState<string | null>(null);

  // Receive Merchandise Modal
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [savingReceive, setSavingReceive] = useState(false);
  const [receiveModalError, setReceiveModalError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [supRes, poRes, prodRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/purchase-orders'),
        fetch('/api/products'),
      ]);

      const [supData, poData, prodData] = await Promise.all([
        supRes.json(),
        poRes.json(),
        prodRes.json(),
      ]);

      if (supRes.ok) setSuppliers(supData.suppliers || []);
      if (poRes.ok) setOrders(poData.purchase_orders || []);
      if (prodRes.ok) setProducts(prodData.products || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore caricamento fornitori';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmDeleteSupplier && !deletingSupplier) {
        setConfirmDeleteSupplier(null);
      } else if (isReceiveModalOpen && !savingReceive) {
        setIsReceiveModalOpen(false);
      } else if (isPOModalOpen && !savingPO) {
        setIsPOModalOpen(false);
      } else if (isSupplierModalOpen && !savingSupplier) {
        setIsSupplierModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    confirmDeleteSupplier,
    deletingSupplier,
    isReceiveModalOpen,
    savingReceive,
    isPOModalOpen,
    savingPO,
    isSupplierModalOpen,
    savingSupplier,
  ]);

  // Open Edit Supplier
  const handleOpenEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupplierName(sup.name);
    setSupplierCompany(sup.company_name || '');
    setSupplierContact(sup.contact_name || '');
    setSupplierPhone(sup.phone || '');
    setSupplierEmail(sup.email || '');
    setSupplierAddress(sup.address || '');
    setSupplierCity(sup.city || '');
    setSupplierVat(sup.vat_number || '');
    setSupplierNotes(sup.notes || '');
    setSupplierModalError(null);
    setIsSupplierModalOpen(true);
  };

  // Open Create Supplier
  const handleOpenCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierName('');
    setSupplierCompany('');
    setSupplierContact('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierAddress('');
    setSupplierCity('');
    setSupplierVat('');
    setSupplierNotes('');
    setSupplierModalError(null);
    setIsSupplierModalOpen(true);
  };

  // Save Supplier Submit
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSupplier(true);
      setSupplierModalError(null);

      const url = '/api/suppliers';
      const method = editingSupplier ? 'PATCH' : 'POST';
      const body = {
        id: editingSupplier?.id,
        name: supplierName.trim(),
        company_name: supplierCompany.trim() || null,
        contact_name: supplierContact.trim() || null,
        phone: supplierPhone.trim() || null,
        email: supplierEmail.trim() || null,
        address: supplierAddress.trim() || null,
        city: supplierCity.trim() || null,
        vat_number: supplierVat.trim() || null,
        notes: supplierNotes.trim() || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore salvataggio fornitore');

      setIsSupplierModalOpen(false);
      setFeedback({
        type: 'success',
        message: editingSupplier ? 'Scheda fornitore aggiornata.' : 'Nuovo fornitore registrato.',
      });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore';
      setSupplierModalError(msg);
    } finally {
      setSavingSupplier(false);
    }
  };

  // Delete / Archive Supplier
  const handleConfirmDeleteSupplier = async () => {
    if (!confirmDeleteSupplier) return;
    try {
      setDeletingSupplier(true);
      const res = await fetch(`/api/suppliers?id=${confirmDeleteSupplier.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore eliminazione fornitore');
      setConfirmDeleteSupplier(null);
      setFeedback({
        type: 'success',
        message: 'Fornitore archiviato con successo.',
      });
      await loadData();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Errore eliminazione',
      });
      setConfirmDeleteSupplier(null);
    } finally {
      setDeletingSupplier(false);
    }
  };

  // Open Create Purchase Order Modal
  const handleOpenCreatePO = () => {
    setPoSupplierId(suppliers[0]?.id || '');
    setPoDeliveryDate('');
    setPoNotes('');
    setPoItems([]);
    setPoModalError(null);
    setIsPOModalOpen(true);
  };

  // Add line to PO
  const handleAddLineToPO = (variant: ProductVariant, prod: Product) => {
    const existing = poItems.find((it) => it.variant_id === variant.id);
    if (existing) {
      setPoItems(
        poItems.map((it) =>
          it.variant_id === variant.id ? { ...it, quantity_ordered: it.quantity_ordered + 6 } : it
        )
      );
    } else {
      const brandStr = typeof prod.brand === 'string' ? prod.brand : prod.brand_obj?.name || '';
      const vName = [variant.size ? `Tg. ${variant.size}` : null, variant.color].filter(Boolean).join(' • ');
      const cost = variant.cost_price || prod.cost_price || prod.sale_price * 0.45;

      setPoItems([
        ...poItems,
        {
          variant_id: variant.id,
          product_name: `${prod.name} ${brandStr ? `(${brandStr})` : ''}`,
          variant_name: vName,
          sku: variant.sku || prod.sku || '',
          barcode: variant.barcode || prod.barcode || '',
          quantity_ordered: 12, // standard wholesale lot
          unit_cost: cost,
        },
      ]);
    }
  };

  // Save Purchase Order Submit
  const handleSavePO = async (status: 'draft' | 'ordered') => {
    if (!poSupplierId) {
      setPoModalError("Seleziona un fornitore per l'ordine");
      return;
    }
    if (poItems.length === 0) {
      setPoModalError("Aggiungi almeno un articolo all'ordine");
      return;
    }

    try {
      setSavingPO(true);
      setPoModalError(null);

      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: poSupplierId,
          status,
          expected_delivery_date: poDeliveryDate || null,
          notes: poNotes || null,
          items: poItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore creazione ordine');

      setIsPOModalOpen(false);
      setFeedback({
        type: 'success',
        message:
          status === 'ordered'
            ? "Ordine d'acquisto inviato e registrato."
            : "Bozza ordine d'acquisto salvata.",
      });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore';
      setPoModalError(msg);
    } finally {
      setSavingPO(false);
    }
  };

  // Open Receive Merchandise Modal
  const handleOpenReceiveModal = async (orderId: string) => {
    try {
      setLoading(true);
      setReceiveModalError(null);
      const res = await fetch(`/api/purchase-orders?id=${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore recupero dettagli ordine');

      const po = data.purchase_order;
      setReceivingOrder(po);

      const initialQtys: Record<string, number> = {};
      (po.items || []).forEach((it: PurchaseOrderItem) => {
        const remaining = it.quantity_ordered - (it.quantity_received || 0);
        initialQtys[it.id] = remaining > 0 ? remaining : 0;
      });
      setReceivedQtys(initialQtys);
      setIsReceiveModalOpen(true);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Errore apertura ricezione merce',
      });
    } finally {
      setLoading(false);
    }
  };

  // Confirm Receive Merchandise (calls rpc_receive_purchase_order)
  const handleConfirmReceive = async () => {
    if (!receivingOrder) return;

    const itemsToReceive = (receivingOrder.items || [])
      .map((it) => {
        const qty = receivedQtys[it.id] || 0;
        if (qty <= 0) return null;
        return {
          po_item_id: it.id,
          variant_id: it.variant_id,
          quantity_received: qty,
          unit_cost: it.unit_cost,
        };
      })
      .filter(Boolean);

    if (itemsToReceive.length === 0) {
      setReceiveModalError('Nessun articolo ha una quantità in arrivo maggiore di zero.');
      return;
    }

    try {
      setSavingReceive(true);
      setReceiveModalError(null);
      const res = await fetch('/api/purchase-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'receive',
          po_id: receivingOrder.id,
          received_items: itemsToReceive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore carico merce');

      setIsReceiveModalOpen(false);
      setReceivingOrder(null);
      setFeedback({
        type: 'success',
        message: 'Merce caricata a magazzino con successo! Giacenze aggiornate atomicamente.',
      });
      await loadData();
    } catch (err: unknown) {
      setReceiveModalError(err instanceof Error ? err.message : 'Errore ricezione');
    } finally {
      setSavingReceive(false);
    }
  };

  // KPIs for Purchase Orders
  const orderStats = useMemo(() => {
    let pendingCount = 0;
    let pendingValue = 0;
    let receivedCount = 0;

    for (const o of orders) {
      if (o.status === 'ordered' || o.status === 'partially_received') {
        pendingCount++;
        pendingValue += Number(o.total_amount) || 0;
      } else if (o.status === 'received') {
        receivedCount++;
      }
    }

    return { pendingCount, pendingValue, receivedCount };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      return true;
    });
  }, [orders, orderStatusFilter]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase().trim();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.company_name || '').toLowerCase().includes(q) ||
        (s.contact_name || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.vat_number || '').toLowerCase().includes(q)
    );
  }, [suppliers, supplierSearch]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Retail Supply Chain & Purchasing"
        eyebrowTone="volt"
        title="Fornitori & Ordini d'Acquisto"
        description="Gestione anagrafica fornitori, ordini merce e ricezione con carico atomico a magazzino."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCreateSupplier}
              className="inline-flex items-center justify-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[var(--bg-subtle)] transition-colors shadow-2xs min-h-[40px]"
            >
              <Building2 className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Nuovo Fornitore</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreatePO}
              className="inline-flex items-center justify-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Crea Ordine d&apos;Acquisto</span>
            </button>
          </div>
        }
      />

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-[var(--accent-operational-bg)] border-[var(--accent-operational-border)] text-[var(--accent-operational-text)]'
              : 'bg-[var(--accent-critical-bg)] border-[var(--accent-critical-border)] text-[var(--accent-critical-text)]'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Chiudi notifica"
            className="p-1 rounded-lg hover:bg-[var(--bg-surface)]/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Ordini in Attesa Consegna"
          value={`${orderStats.pendingCount} ordini`}
          icon={Clock}
          tone={orderStats.pendingCount > 0 ? 'warning' : 'neutral'}
          context="Merce ordinata non ancora arrivata"
        />

        <KpiCard
          label="Valore Merce in Ordine"
          value={formatItCurrency(orderStats.pendingValue)}
          icon={Truck}
          tone="volt"
          context="Totale costo acquisto concordato"
        />

        <KpiCard
          label="Ordini Ricevuti & Caricati"
          value={orderStats.receivedCount}
          icon={CheckCircle2}
          tone="operational"
          context="Carichi magazzino completati"
        />
      </div>

      {/* Tabs & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedControl
          ariaLabel="Seleziona vista fornitori o ordini"
          value={activeTab}
          onChange={setActiveTab}
          options={[
            {
              value: 'orders',
              label: `Ordini d'Acquisto (${orders.length})`,
              icon: Truck,
            },
            {
              value: 'suppliers',
              label: `Anagrafica Fornitori (${suppliers.length})`,
              icon: Building2,
            },
          ]}
        />

        {activeTab === 'suppliers' ? (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              aria-label="Cerca fornitore, referente o Partita IVA"
              placeholder="Cerca fornitore, referente, P.IVA..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--rivo-volt)] focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="order-status-filter" className="text-[var(--text-secondary)] font-medium">
              Stato Ordine:
            </label>
            <select
              id="order-status-filter"
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--rivo-volt)] focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <option value="all">Tutti gli stati</option>
              <option value="ordered">Inviati (In attesa)</option>
              <option value="partially_received">Parzialmente Arrivati</option>
              <option value="received">Completati & Ricevuti</option>
              <option value="draft">Bozze</option>
              <option value="cancelled">Annullati</option>
            </select>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content based on Active Tab */}
      {loading ? (
        <SurfaceCard className="p-16 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rivo-volt-text)]" />
          <span className="text-xs text-[var(--text-muted)]">
            Caricamento ordini d&apos;acquisto e fornitori...
          </span>
        </SurfaceCard>
      ) : activeTab === 'orders' ? (
        /* Tab 1: Orders Table */
        <SurfaceCard padding="none" className="overflow-hidden">
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Nessun ordine d'acquisto registrato"
              description="Clicca 'Crea Ordine d'Acquisto' per emettere un ordine verso i tuoi fornitori."
              primaryAction={{
                label: "Crea Ordine d'Acquisto",
                onClick: handleOpenCreatePO,
                icon: Plus,
              }}
            />
          ) : (
            <>
              <div className="lg:hidden divide-y divide-[var(--border-subtle)]">
                {filteredOrders.map((o) => {
                  const totalOrdered = (o.items || []).reduce((acc, it) => acc + it.quantity_ordered, 0);
                  const totalReceived = (o.items || []).reduce(
                    (acc, it) => acc + (it.quantity_received || 0),
                    0
                  );

                  return (
                    <div key={o.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono tabular-nums font-bold text-xs text-[var(--text-primary)] block">
                            {o.order_number}
                          </span>
                          <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                            {o.supplier?.name || 'Fornitore'}
                          </p>
                          {o.supplier?.phone && (
                            <span className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums block">
                              {o.supplier.phone}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0">
                          {o.status === 'received' ? (
                            <StatusBadge tone="operational" size="sm" icon={CheckCircle2}>
                              Ricevuto
                            </StatusBadge>
                          ) : o.status === 'partially_received' ? (
                            <StatusBadge tone="warning" size="sm" mono>
                              Parziale ({totalReceived}/{totalOrdered})
                            </StatusBadge>
                          ) : o.status === 'ordered' ? (
                            <StatusBadge tone="telemetry" size="sm" icon={Clock}>
                              In Attesa Consegna
                            </StatusBadge>
                          ) : o.status === 'draft' ? (
                            <StatusBadge tone="neutral" size="sm">
                              Bozza
                            </StatusBadge>
                          ) : (
                            <StatusBadge tone="critical" size="sm">
                              Annullato
                            </StatusBadge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block uppercase">Pezzi</span>
                          <span className="font-mono tabular-nums">
                            <span className="font-bold text-[var(--text-primary)]">{totalReceived}</span>
                            <span className="text-[var(--text-muted)]"> / {totalOrdered} pz</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block uppercase">Consegna</span>
                          <span className="font-mono tabular-nums text-[var(--text-secondary)]">
                            {o.expected_delivery_date
                              ? new Date(o.expected_delivery_date).toLocaleDateString('it-IT')
                              : '—'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[var(--text-muted)] block uppercase">Totale</span>
                          <span className="font-mono tabular-nums font-bold text-[var(--text-primary)]">
                            {formatItCurrency(Number(o.total_amount) || 0)}
                          </span>
                        </div>
                      </div>

                      {(o.status === 'ordered' || o.status === 'partially_received') && (
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenReceiveModal(o.id)}
                            className="inline-flex items-center gap-1.5 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-3 min-h-[38px] rounded-lg text-xs font-bold transition-colors"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Ricevi Merce</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[680px]">
                  <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">N. Ordine</th>
                      <th className="px-4 py-3">Fornitore</th>
                      <th className="px-4 py-3">Pezzi Ordinati / Arrivati</th>
                      <th className="px-4 py-3 text-right">Totale Ordine</th>
                      <th className="px-4 py-3">Consegna Prevista</th>
                      <th className="px-4 py-3 text-center">Stato</th>
                      <th className="px-4 py-3 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {filteredOrders.map((o) => {
                      const totalOrdered = (o.items || []).reduce((acc, it) => acc + it.quantity_ordered, 0);
                      const totalReceived = (o.items || []).reduce(
                        (acc, it) => acc + (it.quantity_received || 0),
                        0
                      );

                      return (
                        <tr key={o.id} className="hover:bg-[var(--bg-subtle)]/70 transition-colors">
                          <td className="px-4 py-3 font-mono tabular-nums font-bold text-[var(--text-primary)]">
                            {o.order_number}
                          </td>
                          <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                            <div>{o.supplier?.name || 'Fornitore'}</div>
                            {o.supplier?.phone && (
                              <span className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums font-normal block">
                                {o.supplier.phone}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums">
                            <span className="font-bold text-[var(--text-primary)]">{totalReceived}</span>
                            <span className="text-[var(--text-muted)]"> / {totalOrdered} pz</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[var(--text-primary)]">
                            {formatItCurrency(Number(o.total_amount) || 0)}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] font-mono tabular-nums text-[11px]">
                            {o.expected_delivery_date
                              ? new Date(o.expected_delivery_date).toLocaleDateString('it-IT')
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {o.status === 'received' ? (
                              <StatusBadge tone="operational" size="sm" icon={CheckCircle2}>
                                Ricevuto
                              </StatusBadge>
                            ) : o.status === 'partially_received' ? (
                              <StatusBadge tone="warning" size="sm" mono>
                                Parziale ({totalReceived}/{totalOrdered})
                              </StatusBadge>
                            ) : o.status === 'ordered' ? (
                              <StatusBadge tone="telemetry" size="sm" icon={Clock}>
                                In Attesa Consegna
                              </StatusBadge>
                            ) : o.status === 'draft' ? (
                              <StatusBadge tone="neutral" size="sm">
                                Bozza
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone="critical" size="sm">
                                Annullato
                              </StatusBadge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              {(o.status === 'ordered' || o.status === 'partially_received') && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceiveModal(o.id)}
                                  className="inline-flex items-center gap-1 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                                >
                                  <ArrowDownLeft className="w-3 h-3" />
                                  <span>Ricevi Merce</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </SurfaceCard>
      ) : (
        /* Tab 2: Suppliers Directory */
        <SurfaceCard padding="none" className="overflow-hidden">
          {filteredSuppliers.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Nessun fornitore registrato"
              description="Clicca 'Nuovo Fornitore' per aggiungere il primo partner commerciale."
              primaryAction={{
                label: 'Nuovo Fornitore',
                onClick: handleOpenCreateSupplier,
                icon: Plus,
              }}
            />
          ) : (
            <>
              <div className="lg:hidden divide-y divide-[var(--border-subtle)]">
                {filteredSuppliers.map((s) => (
                  <div key={s.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{s.name}</p>
                        {s.company_name && (
                          <span className="text-[11px] text-[var(--text-muted)] block truncate">
                            {s.company_name}
                          </span>
                        )}
                      </div>
                      <div className="inline-flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSupplier(s)}
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                          aria-label={`Modifica scheda fornitore ${s.name}`}
                          title="Modifica scheda fornitore"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSupplier(s)}
                          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-critical-text)] hover:bg-[var(--accent-critical-bg)] transition-colors"
                          aria-label={`Archivia fornitore ${s.name}`}
                          title="Archivia fornitore"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block uppercase">Referente</span>
                        <span className="text-[var(--text-secondary)]">{s.contact_name || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block uppercase">P.IVA / CF</span>
                        <span className="font-mono tabular-nums text-[var(--text-secondary)]">
                          {s.vat_number || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block uppercase">Città</span>
                        <span className="text-[var(--text-secondary)]">{s.city || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block uppercase">Contatti</span>
                        <div className="space-y-0.5 text-[var(--text-secondary)]">
                          {s.phone && (
                            <div className="flex items-center gap-1 font-mono tabular-nums text-[11px]">
                              <Phone className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                              <span className="truncate">{s.phone}</span>
                            </div>
                          )}
                          {s.email && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Mail className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                              <span className="truncate">{s.email}</span>
                            </div>
                          )}
                          {!s.phone && !s.email && <span>—</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[680px]">
                  <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Ragione Sociale / Fornitore</th>
                      <th className="px-4 py-3">Referente</th>
                      <th className="px-4 py-3">Contatti</th>
                      <th className="px-4 py-3">P.IVA / Cod. Fiscale</th>
                      <th className="px-4 py-3">Città</th>
                      <th className="px-4 py-3 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {filteredSuppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--bg-subtle)]/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                          <div>{s.name}</div>
                          {s.company_name && (
                            <span className="text-[11px] text-[var(--text-muted)] block font-normal">
                              {s.company_name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{s.contact_name || '—'}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)] space-y-0.5">
                          {s.phone && (
                            <div className="flex items-center gap-1.5 font-mono tabular-nums text-[11px]">
                              <Phone className="w-3 h-3 text-[var(--text-muted)]" />
                              <span>{s.phone}</span>
                            </div>
                          )}
                          {s.email && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Mail className="w-3 h-3 text-[var(--text-muted)]" />
                              <span>{s.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums text-[var(--text-secondary)]">
                          {s.vat_number || '—'}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{s.city || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSupplier(s)}
                              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                              aria-label={`Modifica scheda fornitore ${s.name}`}
                              title="Modifica scheda fornitore"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteSupplier(s)}
                              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-critical-text)] hover:bg-[var(--accent-critical-bg)] transition-colors"
                              aria-label={`Archivia fornitore ${s.name}`}
                              title="Archivia fornitore"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </SurfaceCard>
      )}

      {/* ARCHIVE SUPPLIER CONFIRMATION MODAL */}
      {confirmDeleteSupplier && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-archive-supplier-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[var(--accent-critical-text)]" />
                <h2
                  id="confirm-archive-supplier-title"
                  className="text-base font-bold text-[var(--text-primary)]"
                >
                  Archivia Fornitore
                </h2>
              </div>
              <button
                type="button"
                onClick={() => !deletingSupplier && setConfirmDeleteSupplier(null)}
                aria-label="Chiudi finestra"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Sei sicuro di voler archiviare questo fornitore? (
              <span className="font-semibold text-[var(--text-primary)]">{confirmDeleteSupplier.name}</span>)
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                disabled={deletingSupplier}
                onClick={() => setConfirmDeleteSupplier(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={deletingSupplier}
                onClick={handleConfirmDeleteSupplier}
                className="inline-flex items-center gap-2 bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {deletingSupplier && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Archivia Fornitore</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="supplier-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--rivo-volt-text)]" />
                <h2 id="supplier-modal-title" className="text-lg font-bold text-[var(--text-primary)]">
                  {editingSupplier ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                aria-label="Chiudi modale fornitore"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {supplierModalError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{supplierModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="supplier-name-input"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Nome / Brand Fornitore *
                  </label>
                  <input
                    id="supplier-name-input"
                    type="text"
                    required
                    placeholder="es. Borrelli Calzature Srl"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label
                    htmlFor="supplier-company-input"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Ragione Sociale
                  </label>
                  <input
                    id="supplier-company-input"
                    type="text"
                    placeholder="es. Borrelli Group SpA"
                    value={supplierCompany}
                    onChange={(e) => setSupplierCompany(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="supplier-contact-input"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Referente Commerciale
                  </label>
                  <input
                    id="supplier-contact-input"
                    type="text"
                    placeholder="es. Mario Rossi"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label
                    htmlFor="supplier-vat-input"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Partita IVA / C.F.
                  </label>
                  <input
                    id="supplier-vat-input"
                    type="text"
                    placeholder="IT01234567890"
                    value={supplierVat}
                    onChange={(e) => setSupplierVat(e.target.value)}
                    className={`${INPUT_CLASS} font-mono tabular-nums`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="supplier-phone-input"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Telefono
                  </label>
                  <input
                    id="supplier-phone-input"
                    type="tel"
                    placeholder="+39 081 123456"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className={`${INPUT_CLASS} font-mono tabular-nums`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="supplier-email-input"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Email Ordini
                  </label>
                  <input
                    id="supplier-email-input"
                    type="email"
                    placeholder="ordini@fornitore.it"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="supplier-address-input"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Indirizzo Sede
                  </label>
                  <input
                    id="supplier-address-input"
                    type="text"
                    placeholder="Via Roma, 120"
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label
                    htmlFor="supplier-city-input"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Città
                  </label>
                  <input
                    id="supplier-city-input"
                    type="text"
                    placeholder="Napoli"
                    value={supplierCity}
                    onChange={(e) => setSupplierCity(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="supplier-notes-input"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Note & Condizioni di Pagamento
                </label>
                <textarea
                  id="supplier-notes-input"
                  rows={2}
                  placeholder="es. Pagamento RiBa 30gg fine mese, spedizione gratuita sopra 500€..."
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={savingSupplier}
                  className="inline-flex items-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  {savingSupplier && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSupplier ? 'Aggiorna Fornitore' : 'Salva Fornitore'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      {isPOModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="po-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[var(--rivo-volt-text)]" />
                <h2 id="po-modal-title" className="text-lg font-bold text-[var(--text-primary)]">
                  Nuovo Ordine d&apos;Acquisto Merce
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPOModalOpen(false)}
                aria-label="Chiudi modale ordine"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {poModalError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{poModalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="po-supplier-select"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Seleziona Fornitore *
                </label>
                <select
                  id="po-supplier-select"
                  required
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Seleziona fornitore...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.contact_name ? `(${s.contact_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="po-delivery-date"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Data Prevista Consegna
                </label>
                <input
                  id="po-delivery-date"
                  type="date"
                  value={poDeliveryDate}
                  onChange={(e) => setPoDeliveryDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* Catalog quick-picker */}
            <div className="space-y-2 border-t border-[var(--border-subtle)] pt-3">
              <span className="text-xs font-semibold text-[var(--text-secondary)] block">
                Aggiungi Prodotti & Varianti dal Catalogo:
              </span>
              <div className="max-h-40 overflow-y-auto border border-[var(--border-subtle)] rounded-xl p-2 space-y-1.5 bg-[var(--bg-subtle)]">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface)] text-xs transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-[var(--text-primary)]">{p.name}</span>
                      <span className="text-[var(--text-muted)] ml-1.5 font-mono tabular-nums">
                        SKU: {p.sku || '—'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(p.variants || []).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleAddLineToPO(v, p)}
                          className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-mono tabular-nums text-[var(--text-primary)] hover:bg-[var(--rivo-volt)] hover:text-[#09090B] hover:border-[var(--rivo-volt)] font-semibold transition-colors"
                        >
                          + Tg {v.size || 'U'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Added PO Items */}
            <div className="space-y-2 border-t border-[var(--border-subtle)] pt-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                <span>Righe Ordine ({poItems.length}):</span>
                <span className="font-mono tabular-nums text-sm font-bold text-[var(--rivo-volt-text)]">
                  Totale:{' '}
                  {formatItCurrency(
                    poItems.reduce((acc, it) => acc + it.quantity_ordered * it.unit_cost, 0)
                  )}
                </span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {poItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                    Nessun articolo aggiunto. Clicca sui pulsanti &quot;+ Tg&quot; qui sopra per inserire
                    varianti all&apos;ordine.
                  </div>
                ) : (
                  poItems.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-[var(--text-primary)] block truncate">
                          {it.product_name}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">{it.variant_name}</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
                        <div className="flex items-center gap-1.5">
                          <label htmlFor={`po-qty-${idx}`} className="text-[11px] text-[var(--text-muted)]">
                            Qta Ordine:
                          </label>
                          <input
                            id={`po-qty-${idx}`}
                            type="number"
                            min="1"
                            value={it.quantity_ordered}
                            onChange={(e) =>
                              setPoItems(
                                poItems.map((item, i) =>
                                  i === idx
                                    ? { ...item, quantity_ordered: parseInt(e.target.value, 10) || 1 }
                                    : item
                                )
                              )
                            }
                            className={`w-16 ${COMPACT_NUMBER_INPUT_CLASS}`}
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <label htmlFor={`po-cost-${idx}`} className="text-[11px] text-[var(--text-muted)]">
                            Costo Unit (€):
                          </label>
                          <input
                            id={`po-cost-${idx}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.unit_cost}
                            onChange={(e) =>
                              setPoItems(
                                poItems.map((item, i) =>
                                  i === idx
                                    ? { ...item, unit_cost: parseFloat(e.target.value) || 0 }
                                    : item
                                )
                              )
                            }
                            className={`w-20 ${COMPACT_NUMBER_INPUT_CLASS}`}
                          />
                        </div>

                        <div className="text-right font-mono tabular-nums font-bold text-xs text-[var(--text-primary)] min-w-16">
                          {formatItCurrency(it.quantity_ordered * it.unit_cost)}
                        </div>

                        <button
                          type="button"
                          onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                          aria-label={`Rimuovi ${it.product_name}`}
                          className="text-[var(--text-muted)] hover:text-[var(--accent-critical-text)] p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setIsPOModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                Annulla
              </button>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={savingPO || poItems.length === 0}
                  onClick={() => handleSavePO('draft')}
                  className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-50 transition-colors"
                >
                  Salva come Bozza
                </button>
                <button
                  type="button"
                  disabled={savingPO || poItems.length === 0}
                  onClick={() => handleSavePO('ordered')}
                  className="inline-flex items-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 shadow-sm transition-colors"
                >
                  {savingPO && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Invia Ordine Fornitore</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVE MERCHANDISE MODAL */}
      {isReceiveModalOpen && receivingOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="receive-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-[var(--accent-operational-text)]" />
                <div>
                  <h2 id="receive-modal-title" className="text-base font-bold text-[var(--text-primary)]">
                    Ricezione Merce — Ordine {receivingOrder.order_number}
                  </h2>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {receivingOrder.supplier?.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiveModalOpen(false)}
                aria-label="Chiudi modale ricezione merce"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {receiveModalError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{receiveModalError}</span>
              </div>
            )}

            <div className="space-y-3">
              <span className="text-xs font-semibold text-[var(--text-secondary)] block">
                Verifica quantitativi in arrivo da caricare a magazzino:
              </span>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(receivingOrder.items || []).map((it) => {
                  const remaining = it.quantity_ordered - (it.quantity_received || 0);

                  return (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[var(--text-primary)]">{it.product_name}</div>
                        <div className="text-[11px] text-[var(--text-secondary)]">{it.variant_name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
                          Ordinati: {it.quantity_ordered} • Già Arrivati: {it.quantity_received || 0}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                        <label
                          htmlFor={`receive-qty-${it.id}`}
                          className="text-[11px] font-semibold text-[var(--accent-operational-text)]"
                        >
                          In Arrivo Ora:
                        </label>
                        <input
                          id={`receive-qty-${it.id}`}
                          type="number"
                          min="0"
                          max={remaining * 2}
                          value={receivedQtys[it.id] ?? 0}
                          onChange={(e) =>
                            setReceivedQtys({
                              ...receivedQtys,
                              [it.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          className={`w-16 ${COMPACT_NUMBER_INPUT_CLASS}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setIsReceiveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmReceive}
                disabled={savingReceive}
                className="inline-flex items-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 shadow-sm transition-colors"
              >
                {savingReceive && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Carica a Magazzino Atomico</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

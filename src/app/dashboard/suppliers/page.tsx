'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Truck, 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Calendar, 
  DollarSign, 
  Layers, 
  ArrowDownLeft, 
  ChevronRight, 
  Edit3, 
  Trash2,
  Boxes,
  Barcode
} from 'lucide-react';
import { Supplier, Product, ProductVariant } from '@/platform/retail/types';

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

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Create Purchase Order Modal
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poDeliveryDate, setPoDeliveryDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<Array<{
    variant_id: string;
    product_name: string;
    variant_name: string;
    sku: string;
    barcode: string;
    quantity_ordered: number;
    unit_cost: number;
  }>>([]);
  const [savingPO, setSavingPO] = useState(false);
  const [poModalError, setPoModalError] = useState<string | null>(null);

  // Receive Merchandise Modal
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [savingReceive, setSavingReceive] = useState(false);

  // View PO Details Drawer / Modal
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

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
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore';
      setSupplierModalError(msg);
    } finally {
      setSavingSupplier(false);
    }
  };

  // Delete / Archive Supplier
  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm('Sei sicuro di voler archiviare questo fornitore?')) return;
    try {
      const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore eliminazione fornitore');
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Errore eliminazione');
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
      const cost = variant.cost_price || prod.cost_price || (prod.sale_price * 0.45);

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
      setPoModalError('Seleziona un fornitore per l\'ordine');
      return;
    }
    if (poItems.length === 0) {
      setPoModalError('Aggiungi almeno un articolo all\'ordine');
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
      alert(err instanceof Error ? err.message : 'Errore apertura ricezione merce');
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
      alert('Nessun articolo ha una quantità in arrivo maggiore di zero.');
      return;
    }

    try {
      setSavingReceive(true);
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

      alert('Merce caricata a magazzino con successo! Giacenze aggiornate atomicamente.');
      setIsReceiveModalOpen(false);
      setReceivingOrder(null);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Errore ricezione');
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            <Truck className="w-3.5 h-3.5 text-lime-500 dark:text-[#bfff00]" />
            <span>Retail Supply Chain & Purchasing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Fornitori & Ordini d&apos;Acquisto
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Gestione anagrafica fornitori, ordini merce e ricezione con carico atomico a magazzino.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreateSupplier}
            className="inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <Building2 className="w-4 h-4 text-zinc-500" />
            <span>Nuovo Fornitore</span>
          </button>

          <button
            onClick={handleOpenCreatePO}
            className="inline-flex items-center justify-center gap-2 bg-[#bfff00] text-black px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#a8e600] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Crea Ordine d&apos;Acquisto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-zinc-500 font-medium">Ordini in Attesa Consegna</span>
          <div className="text-2xl font-bold text-amber-500 font-mono mt-1">
            {orderStats.pendingCount} ordini
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Merce ordinata non ancora arrivata
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-zinc-500 font-medium">Valore Merce in Ordine</span>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white font-mono mt-1">
            € {orderStats.pendingValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Totale costo acquisto concordato
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-zinc-500 font-medium">Ordini Ricevuti & Caricati</span>
          <div className="text-2xl font-bold text-emerald-500 font-mono mt-1">
            {orderStats.receivedCount}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Carichi magazzino completati
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Ordini d&apos;Acquisto ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'suppliers'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Anagrafica Fornitori ({suppliers.length})</span>
          </button>
        </div>

        {activeTab === 'suppliers' ? (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cerca fornitore, referente, P.IVA..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">Stato Ordine:</span>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-white focus:outline-none"
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
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content based on Active Tab */}
      {loading ? (
        <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#bfff00]" />
          <span className="text-xs">Caricamento ordini d&apos;acquisto e fornitori...</span>
        </div>
      ) : activeTab === 'orders' ? (
        /* Tab 1: Orders Table */
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
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
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-zinc-400">
                      Nessun ordine d&apos;acquisto registrato. Clicca &quot;Crea Ordine d&apos;Acquisto&quot; per iniziare.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const totalOrdered = (o.items || []).reduce((acc, it) => acc + it.quantity_ordered, 0);
                    const totalReceived = (o.items || []).reduce((acc, it) => acc + (it.quantity_received || 0), 0);

                    return (
                      <tr key={o.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-zinc-950 dark:text-white">
                          {o.order_number}
                        </td>
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          <div>{o.supplier?.name || 'Fornitore'}</div>
                          {o.supplier?.phone && (
                            <span className="text-[10px] text-zinc-400 font-normal block">
                              {o.supplier.phone}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <span className="font-bold text-zinc-950 dark:text-white">{totalReceived}</span>
                          <span className="text-zinc-400"> / {totalOrdered} pz</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-zinc-950 dark:text-white">
                          € {Number(o.total_amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 font-mono text-[11px]">
                          {o.expected_delivery_date
                            ? new Date(o.expected_delivery_date).toLocaleDateString('it-IT')
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {o.status === 'received' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Ricevuto
                            </span>
                          ) : o.status === 'partially_received' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Parziale ({totalReceived}/{totalOrdered})
                            </span>
                          ) : o.status === 'ordered' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              <Clock className="w-3 h-3" /> In Attesa Consegna
                            </span>
                          ) : o.status === 'draft' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                              Bozza
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              Annullato
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            {(o.status === 'ordered' || o.status === 'partially_received') && (
                              <button
                                onClick={() => handleOpenReceiveModal(o.id)}
                                className="inline-flex items-center gap-1 bg-[#bfff00] text-black px-2.5 py-1 rounded-lg text-[11px] font-bold hover:bg-[#a8e600] transition-colors"
                              >
                                <ArrowDownLeft className="w-3 h-3" />
                                <span>Ricevi Merce</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Suppliers Directory */
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Ragione Sociale / Fornitore</th>
                  <th className="px-4 py-3">Referente</th>
                  <th className="px-4 py-3">Contatti</th>
                  <th className="px-4 py-3">P.IVA / Cod. Fiscale</th>
                  <th className="px-4 py-3">Città</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                      Nessun fornitore registrato. Clicca &quot;Nuovo Fornitore&quot; per iniziare.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-white">
                        <div>{s.name}</div>
                        {s.company_name && (
                          <span className="text-[10px] text-zinc-400 block font-normal">
                            {s.company_name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {s.contact_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {s.phone && (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                        {s.email && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Mail className="w-3 h-3 text-zinc-400" />
                            <span>{s.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-500">
                        {s.vat_number || '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {s.city || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditSupplier(s)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                            title="Modifica scheda fornitore"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(s.id)}
                            className="p-1 rounded text-zinc-400 hover:text-rose-500"
                            title="Archivia fornitore"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#bfff00]" />
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                  {editingSupplier ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
                </h2>
              </div>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {supplierModalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{supplierModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nome / Brand Fornitore *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Borrelli Calzature Srl"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ragione Sociale
                  </label>
                  <input
                    type="text"
                    placeholder="es. Borrelli Group SpA"
                    value={supplierCompany}
                    onChange={(e) => setSupplierCompany(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Referente Commerciale
                  </label>
                  <input
                    type="text"
                    placeholder="es. Mario Rossi"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Partita IVA / C.F.
                  </label>
                  <input
                    type="text"
                    placeholder="IT01234567890"
                    value={supplierVat}
                    onChange={(e) => setSupplierVat(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    placeholder="+39 081 123456"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Ordini
                  </label>
                  <input
                    type="email"
                    placeholder="ordini@fornitore.it"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Indirizzo Sede
                  </label>
                  <input
                    type="text"
                    placeholder="Via Roma, 120"
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Città
                  </label>
                  <input
                    type="text"
                    placeholder="Napoli"
                    value={supplierCity}
                    onChange={(e) => setSupplierCity(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Note & Condizioni di Pagamento
                </label>
                <textarea
                  rows={2}
                  placeholder="es. Pagamento RiBa 30gg fine mese, spedizione gratuita sopra 500€..."
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={savingSupplier}
                  className="inline-flex items-center gap-2 bg-[#bfff00] text-black px-5 py-2 rounded-xl text-xs font-semibold hover:bg-[#a8e600] disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#bfff00]" />
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Nuovo Ordine d&apos;Acquisto Merce</h2>
              </div>
              <button
                onClick={() => setIsPOModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {poModalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{poModalError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Seleziona Fornitore *
                </label>
                <select
                  required
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
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
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Data Prevista Consegna
                </label>
                <input
                  type="date"
                  value={poDeliveryDate}
                  onChange={(e) => setPoDeliveryDate(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                />
              </div>
            </div>

            {/* Catalog quick-picker */}
            <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                Aggiungi Prodotti & Varianti dal Catalogo:
              </span>
              <div className="max-h-36 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 space-y-1.5 bg-zinc-50/50 dark:bg-zinc-900/50">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs">
                    <div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</span>
                      <span className="text-zinc-400 ml-1.5">SKU: {p.sku || '-'}</span>
                    </div>
                    <div className="flex gap-1">
                      {(p.variants || []).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleAddLineToPO(v, p)}
                          className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[10px] font-mono hover:bg-[#bfff00] hover:text-black font-semibold"
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
            <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>Righe Ordine ({poItems.length}):</span>
                <span className="font-mono text-sm text-lime-600 dark:text-[#bfff00]">
                  Totale: € {poItems.reduce((acc, it) => acc + it.quantity_ordered * it.unit_cost, 0).toFixed(2)}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {poItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-400">
                    Nessun articolo aggiunto. Clicca sui pulsanti &quot;+ Tg&quot; qui sopra per inserire varianti all&apos;ordine.
                  </div>
                ) : (
                  poItems.map((it, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{it.product_name}</span>
                        <span className="text-[10px] text-zinc-400">{it.variant_name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-zinc-400">Qta Ordine:</label>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity_ordered}
                          onChange={(e) =>
                            setPoItems(
                              poItems.map((item, i) =>
                                i === idx ? { ...item, quantity_ordered: parseInt(e.target.value, 10) || 1 } : item
                              )
                            )
                          }
                          className="w-16 text-right font-mono font-bold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-zinc-400">Costo Unit (€):</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.unit_cost}
                          onChange={(e) =>
                            setPoItems(
                              poItems.map((item, i) =>
                                i === idx ? { ...item, unit_cost: parseFloat(e.target.value) || 0 } : item
                              )
                            )
                          }
                          className="w-20 text-right font-mono font-bold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>

                      <div className="text-right font-mono font-bold text-xs min-w-16">
                        € {(it.quantity_ordered * it.unit_cost).toFixed(2)}
                      </div>

                      <button
                        type="button"
                        onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                        className="text-zinc-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsPOModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Annulla
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={savingPO || poItems.length === 0}
                  onClick={() => handleSavePO('draft')}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  Salva come Bozza
                </button>
                <button
                  type="button"
                  disabled={savingPO || poItems.length === 0}
                  onClick={() => handleSavePO('ordered')}
                  className="inline-flex items-center gap-2 bg-[#bfff00] text-black px-5 py-2 rounded-xl text-xs font-semibold hover:bg-[#a8e600] disabled:opacity-50 shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                <div>
                  <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                    Ricezione Merce — Ordine {receivingOrder.order_number}
                  </h2>
                  <span className="text-[11px] text-zinc-400">{receivingOrder.supplier?.name}</span>
                </div>
              </div>
              <button
                onClick={() => setIsReceiveModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                Verifica quantitativi in arrivo da caricare a magazzino:
              </span>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(receivingOrder.items || []).map((it) => {
                  const remaining = it.quantity_ordered - (it.quantity_received || 0);

                  return (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between text-xs gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-zinc-900 dark:text-white">{it.product_name}</div>
                        <div className="text-[11px] text-zinc-500">{it.variant_name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          Ordinati: {it.quantity_ordered} • Già Arrivati: {it.quantity_received || 0}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-[11px] font-semibold text-emerald-500">In Arrivo Ora:</label>
                        <input
                          type="number"
                          min="0"
                          max={remaining * 2} // allow overdelivery if needed
                          value={receivedQtys[it.id] ?? 0}
                          onChange={(e) =>
                            setReceivedQtys({
                              ...receivedQtys,
                              [it.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          className="w-16 text-right font-mono font-bold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsReceiveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmReceive}
                disabled={savingReceive}
                className="inline-flex items-center gap-2 bg-[#bfff00] text-black px-5 py-2 rounded-xl text-xs font-semibold hover:bg-[#a8e600] disabled:opacity-50 shadow-sm"
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

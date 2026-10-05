'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  CreditCard, 
  Banknote, 
  Receipt, 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RotateCcw, 
  Printer, 
  User, 
  Barcode, 
  Tag, 
  Percent, 
  X,
  History,
  TrendingUp,
  Store,
  Layers,
  Sparkles,
  ChevronRight,
  UserCheck,
  Building2
} from 'lucide-react';
import { Product, ProductVariant, Customer } from '@/platform/retail/types';

interface CartItem {
  id: string; // unique cart line id
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string;
  brand_name: string;
  sku: string | null;
  barcode: string | null;
  size: string | null;
  color: string | null;
  unit_price: number;
  cost_price: number | null;
  quantity: number;
  discount_amount: number;
  tax_rate: number;
  available_stock: number;
}

interface SaleSummary {
  id: string;
  sale_number: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  gross_margin: number;
  payment_method: string;
  operator_name: string;
  created_at: string;
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
  items?: Array<{
    id: string;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    returned_quantity: number;
    variant_id?: string;
  }>;
}

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // POS State
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'transfer' | 'coupon'>('card');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [processingSale, setProcessingSale] = useState(false);

  // Completed sale receipt modal
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  // Sales History State
  const [salesHistory, setSalesHistory] = useState<SaleSummary[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [viewingSale, setViewingSale] = useState<SaleSummary | null>(null);

  // Return / Refund Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnSale, setReturnSale] = useState<SaleSummary | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('Cambio taglia');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'coupon'>('cash');
  const [restockItem, setRestockItem] = useState(true);
  const [processingReturn, setProcessingReturn] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load Products, Customers, and History
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodRes, custRes, salesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/customers'),
        fetch('/api/sales?limit=100'),
      ]);

      const [prodData, custData, salesData] = await Promise.all([
        prodRes.json(),
        custRes.json().catch(() => ({ customers: [] })),
        salesRes.json().catch(() => ({ sales: [] })),
      ]);

      if (prodRes.ok) setProducts(prodData.products || []);
      if (custRes.ok) setCustomers(custData.customers || []);
      if (salesRes.ok) setSalesHistory(salesData.sales || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore nel caricamento del registratore di cassa';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Categories list for filter pills
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.category?.id && p.category?.name) {
        map.set(p.category.id, p.category.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  // Filtered Products for POS catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategoryFilter !== 'all' && p.category_id !== selectedCategoryFilter) {
        return false;
      }
      if (!searchProductQuery.trim()) return true;
      const q = searchProductQuery.toLowerCase().trim();
      const inName = p.name.toLowerCase().includes(q);
      const brandStr = typeof p.brand === 'string' ? p.brand : p.brand_obj?.name || '';
      const inBrand = brandStr.toLowerCase().includes(q);
      const inSku = (p.sku || '').toLowerCase().includes(q);
      const inBarcode = (p.barcode || '').toLowerCase().includes(q);
      const inVariant = (p.variants || []).some(
        (v) =>
          (v.size || '').toLowerCase().includes(q) ||
          (v.color || '').toLowerCase().includes(q) ||
          (v.barcode || '').toLowerCase().includes(q)
      );
      return inName || inBrand || inSku || inBarcode || inVariant;
    });
  }, [products, selectedCategoryFilter, searchProductQuery]);

  // Add Variant to Cart
  const addToCart = (product: Product, variant: ProductVariant) => {
    const lineId = `${product.id}-${variant.id}`;
    const existing = cart.find((item) => item.id === lineId);

    const availableStock = variant.quantity_on_hand ?? (variant as any).stock ?? 0;

    if (existing) {
      if (existing.quantity >= availableStock) {
        alert(`Attenzione: giacenza massima disponibile (${availableStock} pz) raggiunta per questa variante!`);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.id === lineId ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      if (availableStock <= 0) {
        if (!window.confirm('Questa variante risulta esaurita a magazzino. Vuoi forzare l\'aggiunta alla vendita?')) {
          return;
        }
      }
      const unitPrice = variant.sale_price || product.sale_price;
      const costPrice = variant.cost_price || product.cost_price || null;
      const brandName = typeof product.brand === 'string' ? product.brand : product.brand_obj?.name || '';
      const variantName = [variant.size ? `Tg. ${variant.size}` : null, variant.color]
        .filter(Boolean)
        .join(' • ');

      setCart((prev) => [
        ...prev,
        {
          id: lineId,
          product_id: product.id,
          variant_id: variant.id,
          product_name: product.name,
          variant_name: variantName,
          brand_name: brandName,
          sku: variant.sku || product.sku || null,
          barcode: variant.barcode || product.barcode || null,
          size: variant.size || null,
          color: variant.color || null,
          unit_price: unitPrice,
          cost_price: costPrice,
          quantity: 1,
          discount_amount: 0,
          tax_rate: product.tax_rate || 22,
          available_stock: availableStock,
        },
      ]);
    }
  };

  // Update Cart Item Quantity
  const updateQuantity = (lineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === lineId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (delta > 0 && newQty > item.available_stock && item.available_stock > 0) {
              alert(`Giacenza disponibile: ${item.available_stock} pz`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove Item from Cart
  const removeFromCart = (lineId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== lineId));
  };

  // Cart Totals Calculation
  const totals = useMemo(() => {
    let subtotal = 0;
    let itemDiscounts = 0;
    let totalPieces = 0;

    for (const item of cart) {
      subtotal += item.unit_price * item.quantity;
      itemDiscounts += item.discount_amount;
      totalPieces += item.quantity;
    }

    const netBeforeTotalDiscount = subtotal - itemDiscounts;
    const finalTotal = Math.max(0, netBeforeTotalDiscount - cartDiscount);
    // IVA 22% scorporata: Netto = Totale / 1.22, IVA = Totale - Netto
    const taxAmount = finalTotal - finalTotal / 1.22;

    return {
      subtotal,
      itemDiscounts,
      cartDiscount,
      totalPieces,
      taxAmount,
      finalTotal,
    };
  }, [cart, cartDiscount]);

  // Cash Change Calculation
  const cashChange = useMemo(() => {
    if (paymentMethod !== 'cash') return 0;
    const tendered = parseFloat(cashTendered) || 0;
    return Math.max(0, tendered - totals.finalTotal);
  }, [paymentMethod, cashTendered, totals.finalTotal]);

  // Complete Sale Handler
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      alert('Il carrello è vuoto. Aggiungi almeno un prodotto per emettere la vendita.');
      return;
    }

    if (paymentMethod === 'cash') {
      const tendered = parseFloat(cashTendered) || 0;
      if (tendered < totals.finalTotal) {
        alert(`Importo contanti insufficiente! Totale: €${totals.finalTotal.toFixed(2)}, Ricevuto: €${tendered.toFixed(2)}`);
        return;
      }
    }

    try {
      setProcessingSale(true);
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomerId || null,
          payment_method: paymentMethod,
          discount_amount: cartDiscount,
          notes: saleNotes || null,
          items: cart.map((it) => ({
            variant_id: it.variant_id,
            product_id: it.product_id,
            product_name: it.product_name,
            variant_name: it.variant_name,
            sku: it.sku,
            barcode: it.barcode,
            quantity: it.quantity,
            unit_price: it.unit_price,
            cost_price: it.cost_price,
            discount_amount: it.discount_amount,
            tax_rate: it.tax_rate,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la chiusura vendita');
      }

      // Open receipt modal
      setCompletedSale({
        ...data.result,
        cartItems: [...cart],
        totals: { ...totals },
        paymentMethod,
        cashTendered: parseFloat(cashTendered) || totals.finalTotal,
        cashChange,
        customer: customers.find((c) => c.id === selectedCustomerId),
        createdAt: new Date().toISOString(),
      });

      // Clear POS state
      setCart([]);
      setCartDiscount(0);
      setCashTendered('');
      setSaleNotes('');
      setSelectedCustomerId('');

      // Refresh sales history and catalog balances in background
      loadInitialData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore chiusura vendita';
      alert(msg);
    } finally {
      setProcessingSale(false);
    }
  };

  // Open Return Modal
  const handleOpenReturnModal = (sale: SaleSummary) => {
    setReturnSale(sale);
    const initialQtys: Record<string, number> = {};
    (sale.items || []).forEach((item) => {
      const maxReturnable = item.quantity - (item.returned_quantity || 0);
      initialQtys[item.id] = maxReturnable > 0 ? 1 : 0;
    });
    setReturnQuantities(initialQtys);
    setIsReturnModalOpen(true);
  };

  // Submit Return / Refund
  const handleProcessReturn = async () => {
    if (!returnSale) return;

    const returnItems = (returnSale.items || [])
      .map((it) => {
        const qty = returnQuantities[it.id] || 0;
        if (qty <= 0) return null;
        return {
          sale_item_id: it.id,
          variant_id: it.variant_id || null,
          quantity: qty,
          refund_unit_price: it.unit_price,
          restock: restockItem,
        };
      })
      .filter(Boolean);

    if (returnItems.length === 0) {
      alert('Seleziona almeno un articolo da rendere.');
      return;
    }

    try {
      setProcessingReturn(true);
      const res = await fetch('/api/sales/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_id: returnSale.id,
          refund_method: refundMethod,
          reason: returnReason,
          return_items: returnItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore processamento reso');

      alert(`Reso ${data.result?.return_number} registrato con successo! Rimborso: €${Number(data.result?.refund_amount).toFixed(2)}`);
      setIsReturnModalOpen(false);
      setReturnSale(null);
      await loadInitialData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore reso';
      alert(msg);
    } finally {
      setProcessingReturn(false);
    }
  };

  // Sales History KPIs
  const historyStats = useMemo(() => {
    let totalRevenue = 0;
    let completedCount = 0;
    let totalMargin = 0;

    for (const s of salesHistory) {
      if (s.status === 'completed' || s.status === 'partial_refund') {
        totalRevenue += Number(s.total_amount) || 0;
        completedCount++;
        totalMargin += Number(s.gross_margin) || 0;
      }
    }

    const averageBasket = completedCount > 0 ? totalRevenue / completedCount : 0;
    return { totalRevenue, completedCount, averageBasket, totalMargin };
  }, [salesHistory]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
            <Store className="w-3.5 h-3.5 text-lime-500 dark:text-[#bfff00]" />
            <span>Retail Point of Sale & Checkout</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Cassa & Vendite
          </h1>
        </div>

        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'pos'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#bfff00]" />
            <span>Punto Cassa Live</span>
            {cart.length > 0 && (
              <span className="bg-[#bfff00] text-black text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {totals.totalPieces}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Storico Vendite ({salesHistory.length})</span>
          </button>
        </div>
      </div>

      {/* POS REGISTER VIEW */}
      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Product Search & Variant Matrix (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Search Bar & Barcode Scanner */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scansiona Barcode o cerca scarpa, borsa, SKU..."
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                />
                {searchProductQuery && (
                  <button
                    onClick={() => setSearchProductQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-zinc-950 dark:bg-white text-white dark:text-black font-semibold shadow-2xs'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Tutti ({products.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryFilter(c.id)}
                    className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategoryFilter === c.id
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-black font-semibold shadow-2xs'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* Products & Variants Grid */}
            {loading ? (
              <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#bfff00]" />
                <span className="text-xs">Caricamento catalogo punto vendita...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                Nessun prodotto trovato per la ricerca &quot;{searchProductQuery}&quot;.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const brandName = typeof p.brand === 'string' ? p.brand : p.brand_obj?.name;
                  const price = p.sale_price;

                  return (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {brandName && (
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                                {brandName}
                              </span>
                            )}
                            <h3 className="text-sm font-bold text-zinc-950 dark:text-white leading-tight">
                              {p.name}
                            </h3>
                          </div>
                          <span className="text-sm font-mono font-bold text-zinc-950 dark:text-white shrink-0">
                            € {Number(price).toFixed(2)}
                          </span>
                        </div>

                        {p.sku && (
                          <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                            SKU: {p.sku}
                          </span>
                        )}
                      </div>

                      {/* Variant Size Matrix Buttons */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                          Taglie disponibili (clicca per vendere):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(p.variants || []).map((v) => {
                            const stock = v.quantity_on_hand ?? (v as any).stock ?? 0;
                            const isAvailable = stock > 0;
                            return (
                              <button
                                key={v.id}
                                onClick={() => addToCart(p, v)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                                  isAvailable
                                    ? 'bg-zinc-100 dark:bg-zinc-800 hover:bg-[#bfff00] hover:text-black text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700/80'
                                    : 'bg-zinc-100 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 line-through opacity-60'
                                }`}
                                title={`Disponibili: ${stock} pz`}
                              >
                                <span>{v.size || 'U'}</span>
                                {v.color && <span className="text-[9px] font-normal opacity-70">({v.color})</span>}
                                <span className={`text-[10px] font-sans ${isAvailable ? 'text-zinc-400' : 'text-rose-500'}`}>
                                  {stock}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Active Cart & Checkout (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[580px]">
            <div className="space-y-4">
              {/* Cart Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#bfff00]" />
                  <h2 className="text-sm font-bold text-zinc-950 dark:text-white">Carrello Vendita</h2>
                  <span className="text-xs text-zinc-400">({totals.totalPieces} pz)</span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-rose-500 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Svuota</span>
                  </button>
                )}
              </div>

              {/* Customer Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Cliente (Fidelity / Ricevuta)</span>
                  </span>
                  {selectedCustomerId && (
                    <button
                      onClick={() => setSelectedCustomerId('')}
                      className="text-zinc-400 hover:text-white text-[10px]"
                    >
                      Deseleziona
                    </button>
                  )}
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                >
                  <option value="">Cliente anonimo (Vendita standard al banco)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} {c.phone ? `(${c.phone})` : ''} — Punti: {c.fidelity_points || 0}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-xs">
                    Carrello vuoto. Clicca su una taglia per aggiungere al conto.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-zinc-950 dark:text-white truncate">
                          {item.product_name}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {item.brand_name ? `${item.brand_name} • ` : ''}
                          <span className="font-mono font-semibold">{item.variant_name || 'Taglia U'}</span>
                        </div>
                        <div className="font-mono text-zinc-400 text-[10px]">
                          € {item.unit_price.toFixed(2)} cad.
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold px-1.5 text-xs text-zinc-950 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0 min-w-16">
                        <div className="font-mono font-bold text-zinc-950 dark:text-white">
                          € {(item.unit_price * item.quantity).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[10px] text-zinc-400 hover:text-rose-500"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Checkout & Payment Section */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              {/* Discounts & Totals */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-zinc-500">
                  <span>Subtotale merce:</span>
                  <span className="font-mono">€ {totals.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-500" />
                    <span>Sconto cassa (€):</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={cartDiscount || ''}
                    onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-20 text-right bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-0.5 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>di cui IVA 22% scorporata:</span>
                  <span className="font-mono">€ {totals.taxAmount.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-base font-bold text-zinc-950 dark:text-white pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                  <span>TOTALE DA PAGARE:</span>
                  <span className="font-mono text-xl text-lime-600 dark:text-[#bfff00]">
                    € {totals.finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Metodo di Pagamento:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-black shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>POS / Carta</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-black shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Contanti</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('transfer')}
                    className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'transfer'
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-black shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Bonifico</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('coupon')}
                    className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'coupon'
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-black shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    <span>Buono</span>
                  </button>
                </div>
              </div>

              {/* Cash Change Calculator */}
              {paymentMethod === 'cash' && (
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium">Contante ricevuto:</span>
                    <input
                      type="number"
                      step="1"
                      placeholder="0.00"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-24 text-right font-mono font-bold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex items-center gap-1">
                    {[10, 20, 50, 100].map((val) => (
                      <button
                        key={val}
                        onClick={() => setCashTendered(val.toString())}
                        className="flex-1 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                      >
                        €{val}
                      </button>
                    ))}
                    <button
                      onClick={() => setCashTendered(totals.finalTotal.toFixed(2))}
                      className="px-2 py-1 rounded bg-lime-500/20 text-[#bfff00] text-[10px] font-bold"
                    >
                      Esatto
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200 dark:border-zinc-800 font-bold">
                    <span className="text-zinc-500">Resto da rendere:</span>
                    <span className="font-mono text-emerald-500 text-sm">
                      € {cashChange.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Big Checkout CTA */}
              <button
                onClick={handleCompleteSale}
                disabled={processingSale || cart.length === 0}
                className="w-full py-3 rounded-xl bg-[#bfff00] hover:bg-[#a8e600] text-black font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processingSale ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Conferma Vendita & Emetti Ricevuta (€{totals.finalTotal.toFixed(2)})</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* HISTORICAL SALES & RETURNS VIEW */
        <div className="space-y-4">
          {/* History KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-zinc-500 font-medium">Incasso Totale Registrato</span>
              <div className="text-2xl font-bold text-zinc-950 dark:text-white font-mono mt-1">
                € {historyStats.totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Su {historyStats.completedCount} scontrini emessi
              </span>
            </div>

            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-zinc-500 font-medium">Scontrino Medio</span>
              <div className="text-2xl font-bold text-zinc-950 dark:text-white font-mono mt-1">
                € {historyStats.averageBasket.toFixed(2)}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Valore medio per transazione
              </span>
            </div>

            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-zinc-500 font-medium">Margine Lordo Totale</span>
              <div className="text-2xl font-bold text-emerald-500 font-mono mt-1">
                € {historyStats.totalMargin.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Ricavi netti meno costo acquisto
              </span>
            </div>

            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-zinc-500 font-medium">Transazioni Completate</span>
              <div className="text-2xl font-bold text-zinc-950 dark:text-white font-mono mt-1">
                {salesHistory.length}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Ultimi 100 scontrini visualizzati
              </span>
            </div>
          </div>

          {/* Search bar for history */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cerca scontrino o cassiere..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
            />
          </div>

          {/* Sales History Table */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Data & Ora</th>
                    <th className="px-4 py-3">N. Scontrino</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Articoli</th>
                    <th className="px-4 py-3">Pagamento</th>
                    <th className="px-4 py-3 text-right">Totale</th>
                    <th className="px-4 py-3 text-center">Stato</th>
                    <th className="px-4 py-3 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                  {salesHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-zinc-400">
                        Nessuna vendita registrata finora.
                      </td>
                    </tr>
                  ) : (
                    salesHistory.map((s) => {
                      const itemCount = (s.items || []).reduce((acc, it) => acc + it.quantity, 0);
                      const isRefunded = s.status === 'refunded';
                      const isPartial = s.status === 'partial_refund';

                      return (
                        <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-3 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                            {new Date(s.created_at).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-zinc-950 dark:text-white">
                            {s.sale_number}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {s.customer ? `${s.customer.first_name} ${s.customer.last_name}` : 'Cliente al banco'}
                          </td>
                          <td className="px-4 py-3 text-zinc-500">
                            {itemCount} pz ({(s.items || []).length} righe)
                          </td>
                          <td className="px-4 py-3">
                            <span className="capitalize text-zinc-600 dark:text-zinc-300">
                              {s.payment_method === 'card'
                                ? 'POS / Carta'
                                : s.payment_method === 'cash'
                                ? 'Contanti'
                                : s.payment_method === 'transfer'
                                ? 'Bonifico'
                                : 'Buono'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-zinc-950 dark:text-white">
                            € {Number(s.total_amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isRefunded ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                Rimborsato
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Reso Parziale
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Completato
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              {!isRefunded && (
                                <button
                                  onClick={() => handleOpenReturnModal(s)}
                                  className="text-xs text-rose-500 hover:underline font-medium"
                                  title="Esegui reso o cambio merce"
                                >
                                  Reso
                                </button>
                              )}
                              <button
                                onClick={() => setCompletedSale({
                                  sale_number: s.sale_number,
                                  totals: {
                                    finalTotal: Number(s.total_amount),
                                    subtotal: Number(s.subtotal),
                                    cartDiscount: Number(s.discount_amount),
                                    taxAmount: Number(s.tax_amount),
                                  },
                                  paymentMethod: s.payment_method,
                                  cartItems: s.items || [],
                                  customer: s.customer,
                                  createdAt: s.created_at,
                                })}
                                className="text-xs text-lime-600 dark:text-[#bfff00] hover:underline font-medium flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Ristampa</span>
                              </button>
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
        </div>
      )}

      {/* COMPLETED SALE / RECEIPT PREVIEW MODAL */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="text-center space-y-1 border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Vendita Completata!</h2>
              <div className="font-mono text-xs text-zinc-400">
                Ricevuta: <span className="font-bold text-zinc-900 dark:text-zinc-100">{completedSale.sale_number}</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                {new Date(completedSale.createdAt).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Receipt Items */}
            <div className="space-y-2 text-xs border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-3 max-h-48 overflow-y-auto">
              {(completedSale.cartItems || []).map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">{it.product_name}</span>
                    <span className="text-[10px] text-zinc-400">{it.variant_name || ''} × {it.quantity}</span>
                  </div>
                  <span className="font-mono font-bold">
                    € {(it.unit_price * it.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-xs border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotale:</span>
                <span className="font-mono">€ {completedSale.totals?.subtotal?.toFixed(2) || completedSale.totals?.finalTotal?.toFixed(2)}</span>
              </div>
              {completedSale.totals?.cartDiscount > 0 && (
                <div className="flex justify-between text-amber-500">
                  <span>Sconto:</span>
                  <span className="font-mono">- € {completedSale.totals.cartDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400 text-[11px]">
                <span>di cui IVA 22%:</span>
                <span className="font-mono">€ {completedSale.totals?.taxAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-zinc-950 dark:text-white pt-1">
                <span>TOTALE PAGATO:</span>
                <span className="font-mono text-lime-600 dark:text-[#bfff00]">
                  € {completedSale.totals?.finalTotal?.toFixed(2)}
                </span>
              </div>
              {completedSale.paymentMethod === 'cash' && (
                <div className="flex justify-between text-xs text-emerald-500 pt-1">
                  <span>Resto corrisposto:</span>
                  <span className="font-mono">€ {completedSale.cashChange?.toFixed(2) || '0.00'}</span>
                </div>
              )}
            </div>

            {/* Customer info if attached */}
            {completedSale.customer && (
              <div className="text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl">
                Cliente: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{completedSale.customer.first_name} {completedSale.customer.last_name}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Stampa Ricevuta</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#bfff00] hover:bg-[#a8e600] text-black px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                <span>Nuova Vendita</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN & REFUND MODAL */}
      {isReturnModalOpen && returnSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                  Reso Merce — Scontrino {returnSale.sale_number}
                </h2>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                Seleziona quantità da rendere per articolo:
              </span>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {(returnSale.items || []).map((it) => {
                  const maxQty = it.quantity - (it.returned_quantity || 0);
                  if (maxQty <= 0) return null;

                  return (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white">{it.product_name}</div>
                        <div className="text-[11px] text-zinc-500">{it.variant_name}</div>
                        <div className="font-mono text-zinc-400">€ {it.unit_price.toFixed(2)} cad. (Max: {maxQty} pz)</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-zinc-400">Qta Reso:</label>
                        <input
                          type="number"
                          min="0"
                          max={maxQty}
                          value={returnQuantities[it.id] ?? 0}
                          onChange={(e) =>
                            setReturnQuantities({
                              ...returnQuantities,
                              [it.id]: Math.min(maxQty, Math.max(0, parseInt(e.target.value, 10) || 0)),
                            })
                          }
                          className="w-16 text-right font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Causale Reso
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="Cambio taglia">Cambio taglia</option>
                    <option value="Difetto fabbrica">Difetto di fabbrica</option>
                    <option value="Ripensamento cliente">Ripensamento cliente</option>
                    <option value="Altro">Altro motivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Modalità Rimborso
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="cash">Contanti</option>
                    <option value="card">Riaccredito Carta</option>
                    <option value="coupon">Buono Spesa RIVO</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restockItem}
                  onChange={(e) => setRestockItem(e.target.checked)}
                  className="rounded text-[#bfff00] focus:ring-[#bfff00]"
                />
                <span>Rimetti gli articoli a magazzino (Ricarico stock automatico)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Annulla
              </button>
              <button
                onClick={handleProcessReturn}
                disabled={processingReturn}
                className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {processingReturn && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Conferma Reso & Rimborsa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  CreditCard,
  Banknote,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Printer,
  User,
  Tag,
  X,
  History,
  Building2,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { Product, ProductVariant, Customer } from '@/platform/retail/types';
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

interface CartItem {
  id: string;
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

interface CompletedSaleReceipt {
  sale_number: string;
  totals: {
    finalTotal: number;
    subtotal: number;
    cartDiscount: number;
    taxAmount: number;
  };
  paymentMethod: string;
  cashTendered?: number;
  cashChange?: number;
  cartItems: Array<{
    product_name: string;
    variant_name?: string | null;
    quantity: number;
    unit_price: number;
  }>;
  customer?: {
    first_name: string;
    last_name: string;
  } | null;
  createdAt: string;
}

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posNotice, setPosNotice] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // POS State
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'transfer' | 'coupon'>(
    'card'
  );
  const [cashTendered, setCashTendered] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [processingSale, setProcessingSale] = useState(false);

  // Zero-stock confirmation modal (replaces window.confirm)
  const [confirmZeroStockItem, setConfirmZeroStockItem] = useState<{
    product: Product;
    variant: ProductVariant;
    availableStock: number;
  } | null>(null);

  // Completed sale receipt modal
  const [completedSale, setCompletedSale] = useState<CompletedSaleReceipt | null>(null);

  // Sales History State
  const [salesHistory, setSalesHistory] = useState<SaleSummary[]>([]);
  const [historySearch, setHistorySearch] = useState('');

  // Return / Refund Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnSale, setReturnSale] = useState<SaleSummary | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('Cambio taglia');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'coupon'>('cash');
  const [restockItem, setRestockItem] = useState(true);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [returnModalError, setReturnModalError] = useState<string | null>(null);

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
      const msg =
        err instanceof Error ? err.message : 'Errore nel caricamento del registratore di cassa';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Escape key handler for modals
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmZeroStockItem) setConfirmZeroStockItem(null);
      else if (isReturnModalOpen) setIsReturnModalOpen(false);
      else if (completedSale) setCompletedSale(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmZeroStockItem, isReturnModalOpen, completedSale]);

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

  // Push item into cart (shared helper after stock check)
  const commitAddToCart = (product: Product, variant: ProductVariant, availableStock: number) => {
    const lineId = `${product.id}-${variant.id}`;
    const unitPrice = variant.sale_price || product.sale_price;
    const costPrice = variant.cost_price || product.cost_price || null;
    const brandName =
      typeof product.brand === 'string' ? product.brand : product.brand_obj?.name || '';
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
  };

  // Add Variant to Cart
  const addToCart = (product: Product, variant: ProductVariant) => {
    const lineId = `${product.id}-${variant.id}`;
    const existing = cart.find((item) => item.id === lineId);
    const availableStock =
      variant.quantity_on_hand ?? (variant as unknown as { stock?: number }).stock ?? 0;

    setPosNotice(null);

    if (existing) {
      if (availableStock > 0 && existing.quantity >= availableStock) {
        setPosNotice({
          type: 'warning',
          message: `Attenzione: giacenza massima disponibile (${availableStock} pz) raggiunta per questa variante.`,
        });
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.id === lineId ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      if (availableStock <= 0) {
        setConfirmZeroStockItem({ product, variant, availableStock });
        return;
      }
      commitAddToCart(product, variant, availableStock);
    }
  };

  // Update Cart Item Quantity
  const updateQuantity = (lineId: string, delta: number) => {
    setPosNotice(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === lineId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (delta > 0 && newQty > item.available_stock && item.available_stock > 0) {
              setPosNotice({
                type: 'warning',
                message: `Giacenza disponibile: ${item.available_stock} pz`,
              });
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

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
    setPosNotice(null);

    if (cart.length === 0) {
      setPosNotice({
        type: 'warning',
        message: 'Il carrello è vuoto. Aggiungi almeno un prodotto per emettere la vendita.',
      });
      return;
    }

    if (paymentMethod === 'cash') {
      const tendered = parseFloat(cashTendered) || 0;
      if (tendered < totals.finalTotal) {
        setPosNotice({
          type: 'error',
          message: `Importo contanti insufficiente! Totale: €${totals.finalTotal.toFixed(
            2
          )}, Ricevuto: €${tendered.toFixed(2)}`,
        });
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

      setCart([]);
      setCartDiscount(0);
      setCashTendered('');
      setSaleNotes('');
      setSelectedCustomerId('');

      loadInitialData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore chiusura vendita';
      setPosNotice({ type: 'error', message: msg });
    } finally {
      setProcessingSale(false);
    }
  };

  // Open Return Modal
  const handleOpenReturnModal = (sale: SaleSummary) => {
    setReturnSale(sale);
    setReturnModalError(null);
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
    setReturnModalError(null);

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
      setReturnModalError('Seleziona almeno un articolo da rendere.');
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

      setPosNotice({
        type: 'success',
        message: `Reso ${data.result?.return_number} registrato con successo! Rimborso: €${Number(
          data.result?.refund_amount
        ).toFixed(2)}`,
      });
      setIsReturnModalOpen(false);
      setReturnSale(null);
      await loadInitialData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore reso';
      setReturnModalError(msg);
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

  const filteredSalesHistory = useMemo(() => {
    if (!historySearch.trim()) return salesHistory;
    const q = historySearch.toLowerCase().trim();
    return salesHistory.filter(
      (s) =>
        s.sale_number.toLowerCase().includes(q) ||
        (s.operator_name || '').toLowerCase().includes(q) ||
        `${s.customer?.first_name || ''} ${s.customer?.last_name || ''}`.toLowerCase().includes(q)
    );
  }, [salesHistory, historySearch]);

  return (
    <div className="space-y-5 min-w-0">
      <PageHeader
        eyebrow="05 // RETAIL POINT OF SALE"
        title="Cassa & Vendite"
        actions={
          <div className="overflow-x-auto max-w-full">
            <SegmentedControl
              ariaLabel="Modalità cassa e storico"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                {
                  value: 'pos',
                  label: 'Punto Cassa Live',
                  icon: ShoppingCart,
                  badge: cart.length > 0 ? totals.totalPieces : undefined,
                },
                {
                  value: 'history',
                  label: 'Storico Vendite',
                  icon: History,
                  badge: salesHistory.length,
                },
              ]}
            />
          </div>
        }
      />

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {posNotice && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3',
            posNotice.type === 'success'
              ? 'bg-[var(--accent-operational-bg)] border-[var(--accent-operational-border)] text-[var(--accent-operational-text)]'
              : posNotice.type === 'warning'
              ? 'bg-[var(--accent-warning-bg)] border-[var(--accent-warning-border)] text-[var(--accent-warning-text)]'
              : 'bg-[var(--accent-critical-bg)] border-[var(--accent-critical-border)] text-[var(--accent-critical-text)]'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {posNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            ) : posNotice.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            )}
            <span className="font-medium">{posNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setPosNotice(null)}
            aria-label="Chiudi notifica"
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* POS REGISTER VIEW */}
      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Product Search & Variant Matrix (7 cols) */}
          <div className="lg:col-span-7 space-y-3 min-w-0">
            {/* Search Bar */}
            <div className="relative">
              <label htmlFor="pos-product-search" className="sr-only">
                Scansiona Barcode o cerca articolo
              </label>
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <input
                id="pos-product-search"
                ref={barcodeInputRef}
                type="text"
                placeholder="Scansiona Barcode o cerca scarpa, borsa, SKU…"
                value={searchProductQuery}
                onChange={(e) => setSearchProductQuery(e.target.value)}
                className="w-full min-h-[44px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl pl-9 pr-10 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--focus-ring)]"
              />
              {searchProductQuery && (
                <button
                  type="button"
                  onClick={() => setSearchProductQuery('')}
                  aria-label="Cancella ricerca prodotti"
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={cn(
                    'px-3 min-h-[36px] max-sm:min-h-[42px] rounded-lg font-medium whitespace-nowrap transition-colors border cursor-pointer',
                    selectedCategoryFilter === 'all'
                      ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-transparent font-semibold'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  )}
                >
                  Tutti ({products.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(c.id)}
                    className={cn(
                      'px-3 min-h-[36px] max-sm:min-h-[42px] rounded-lg font-medium whitespace-nowrap transition-colors border cursor-pointer',
                      selectedCategoryFilter === c.id
                        ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-transparent font-semibold'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* Products & Variants Grid */}
            {loading ? (
              <div className="p-16 text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--rivo-volt-text)]" aria-hidden="true" />
                <span className="text-xs font-mono uppercase tracking-wider">
                  Caricamento catalogo punto vendita…
                </span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Nessun prodotto trovato"
                description={`Nessun prodotto trovato per la ricerca "${searchProductQuery}".`}
                compact
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const brandName = typeof p.brand === 'string' ? p.brand : p.brand_obj?.name;
                  const price = p.sale_price;

                  return (
                    <SurfaceCard
                      key={p.id}
                      padding="sm"
                      className="flex flex-col justify-between hover:border-[var(--border-strong)]"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {brandName && (
                              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                                {brandName}
                              </span>
                            )}
                            <h3 className="font-display text-sm font-bold text-[var(--text-primary)] leading-tight">
                              {p.name}
                            </h3>
                          </div>
                          <span className="text-sm font-mono tabular-nums font-bold text-[var(--text-primary)] shrink-0">
                            {formatItCurrency(Number(price))}
                          </span>
                        </div>

                        {p.sku && (
                          <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-0.5">
                            SKU: {p.sku}
                          </span>
                        )}
                      </div>

                      {/* Variant Size Matrix Buttons */}
                      <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)]">
                        <span className="font-mono text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                          Taglie disponibili (clicca per vendere):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(p.variants || []).map((v) => {
                            const stock =
                              v.quantity_on_hand ??
                              (v as unknown as { stock?: number }).stock ??
                              0;
                            const isAvailable = stock > 0;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => addToCart(p, v)}
                                className={cn(
                                  'px-2.5 min-h-[34px] max-sm:min-h-[40px] rounded-lg text-xs font-mono tabular-nums font-bold transition-colors flex items-center gap-1.5 border cursor-pointer',
                                  isAvailable
                                    ? 'bg-[var(--bg-elevated)] hover:bg-[var(--rivo-volt)] hover:text-[#09090B] hover:border-transparent text-[var(--text-primary)] border-[var(--border-subtle)]'
                                    : 'bg-[var(--bg-subtle)]/50 text-[var(--text-muted)] border-[var(--border-subtle)] line-through opacity-60'
                                )}
                                title={`Disponibili: ${stock} pz`}
                              >
                                <span>{v.size || 'U'}</span>
                                {v.color && (
                                  <span className="text-[9px] font-sans font-normal opacity-75">
                                    ({v.color})
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    'text-[10px]',
                                    isAvailable
                                      ? 'text-[var(--text-muted)]'
                                      : 'text-[var(--accent-critical-text)]'
                                  )}
                                >
                                  {stock}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </SurfaceCard>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Active Cart & Checkout (5 cols) */}
          <SurfaceCard
            padding="sm"
            className="lg:col-span-5 flex flex-col justify-between min-h-[540px] min-w-0"
          >
            <div className="space-y-4">
              {/* Cart Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart
                    className="w-4 h-4 text-[var(--rivo-volt-text)]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">
                    Carrello Vendita
                  </h2>
                  <span className="font-mono tabular-nums text-xs text-[var(--text-muted)]">
                    ({totals.totalPieces} pz)
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs text-[var(--accent-critical-text)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Svuota</span>
                  </button>
                )}
              </div>

              {/* Customer Selector */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  <label htmlFor="pos-customer-select" className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Cliente (Fidelity / Ricevuta)</span>
                  </label>
                  {selectedCustomerId && (
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerId('')}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[10px] cursor-pointer"
                    >
                      Deseleziona
                    </button>
                  )}
                </div>
                <select
                  id="pos-customer-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                >
                  <option value="">Cliente anonimo (Vendita standard al banco)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} {c.phone ? `(${c.phone})` : ''} — Punti:{' '}
                      {c.fidelity_points || 0}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-[var(--text-muted)] text-xs">
                    Carrello vuoto. Clicca su una taglia per aggiungere al conto.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 flex items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[var(--text-primary)] truncate">
                          {item.product_name}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {item.brand_name ? `${item.brand_name} • ` : ''}
                          <span className="font-mono font-semibold">
                            {item.variant_name || 'Taglia U'}
                          </span>
                        </div>
                        <div className="font-mono tabular-nums text-[var(--text-muted)] text-[10px]">
                          {formatItCurrency(item.unit_price)} cad.
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 shrink-0 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label={`Riduci quantità di ${item.product_name}`}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
                        </button>
                        <span className="font-mono tabular-nums font-bold px-1.5 text-xs text-[var(--text-primary)]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label={`Aumenta quantità di ${item.product_name}`}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </div>

                      <div className="text-right shrink-0 min-w-16">
                        <div className="font-mono tabular-nums font-bold text-[var(--text-primary)]">
                          {formatItCurrency(item.unit_price * item.quantity)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-critical-text)] cursor-pointer"
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
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3 mt-4">
              {/* Discounts & Totals */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span>Subtotale merce:</span>
                  <span className="font-mono tabular-nums">
                    {formatItCurrency(totals.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <label htmlFor="pos-cart-discount" className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[var(--accent-warning-text)]" strokeWidth={1.75} aria-hidden="true" />
                    <span>Sconto cassa (€):</span>
                  </label>
                  <input
                    id="pos-cart-discount"
                    type="number"
                    min="0"
                    step="0.5"
                    value={cartDiscount || ''}
                    onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-24 text-right bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-2 py-1 text-xs font-mono tabular-nums text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>di cui IVA 22% scorporata:</span>
                  <span className="font-mono tabular-nums">
                    {formatItCurrency(totals.taxAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-base font-bold text-[var(--text-primary)] pt-2 border-t border-dashed border-[var(--border-subtle)]">
                  <span className="font-display">TOTALE DA PAGARE:</span>
                  <span className="font-mono tabular-nums text-xl text-[var(--rivo-volt-text)]">
                    {formatItCurrency(totals.finalTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                  Metodo di Pagamento:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'card' as const, label: 'POS / Carta', icon: CreditCard },
                    { id: 'cash' as const, label: 'Contanti', icon: Banknote },
                    { id: 'transfer' as const, label: 'Bonifico', icon: Building2 },
                    { id: 'coupon' as const, label: 'Buono', icon: Tag },
                  ].map((pm) => {
                    const Icon = pm.icon;
                    const active = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={cn(
                          'min-h-[48px] py-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors border cursor-pointer',
                          active
                            ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-transparent'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                        )}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Change Calculator */}
              {paymentMethod === 'cash' && (
                <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <label
                      htmlFor="pos-cash-tendered"
                      className="text-[var(--text-secondary)] font-medium"
                    >
                      Contante ricevuto:
                    </label>
                    <input
                      id="pos-cash-tendered"
                      type="number"
                      step="1"
                      placeholder="0.00"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-28 text-right font-mono tabular-nums font-bold bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[10, 20, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashTendered(val.toString())}
                        className="flex-1 min-h-[34px] py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-mono tabular-nums font-bold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                      >
                        €{val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCashTendered(totals.finalTotal.toFixed(2))}
                      className="px-3 min-h-[34px] py-1 rounded-lg bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)] text-[11px] font-bold cursor-pointer"
                    >
                      Esatto
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[var(--border-subtle)] font-bold">
                    <span className="text-[var(--text-secondary)]">Resto da rendere:</span>
                    <span className="font-mono tabular-nums text-[var(--accent-operational-text)] text-sm">
                      {formatItCurrency(cashChange)}
                    </span>
                  </div>
                </div>
              )}

              {/* Big Checkout CTA */}
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={processingSale || cart.length === 0}
                className="w-full min-h-[48px] py-3 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {processingSale ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                )}
                <span className="font-mono tabular-nums">
                  Conferma Vendita & Emetti Ricevuta (€{totals.finalTotal.toFixed(2)})
                </span>
              </button>
            </div>
          </SurfaceCard>
        </div>
      ) : (
        /* HISTORICAL SALES & RETURNS VIEW */
        <div className="space-y-4">
          {/* History KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Incasso Totale Registrato"
              value={formatItCurrency(historyStats.totalRevenue)}
              icon={Receipt}
              context={`Su ${historyStats.completedCount} scontrini emessi`}
              loading={loading}
            />
            <KpiCard
              label="Scontrino Medio"
              value={formatItCurrency(historyStats.averageBasket)}
              icon={ShoppingCart}
              context="Valore medio per transazione"
              loading={loading}
            />
            <KpiCard
              label="Margine Lordo Totale"
              value={formatItCurrency(historyStats.totalMargin)}
              icon={TrendingUp}
              tone="operational"
              context="Ricavi netti meno costo acquisto"
              loading={loading}
            />
            <KpiCard
              label="Transazioni Completate"
              value={salesHistory.length}
              icon={History}
              context="Ultimi 100 scontrini visualizzati"
              loading={loading}
            />
          </div>

          {/* Search bar for history */}
          <div className="relative max-w-sm">
            <label htmlFor="sales-history-search" className="sr-only">
              Cerca scontrino o cassiere
            </label>
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              id="sales-history-search"
              type="search"
              placeholder="Cerca scontrino, cliente o cassiere…"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full min-h-[40px] max-sm:min-h-[44px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--focus-ring)]"
            />
          </div>

          {/* Sales History Table */}
          <SurfaceCard padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead className="bg-[var(--bg-elevated)]/70 border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px] font-semibold uppercase tracking-wider">
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
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredSalesHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6">
                        <EmptyState
                          icon={Receipt}
                          title="Nessuna vendita trovata"
                          description="Nessuna vendita registrata corrisponde alla ricerca corrente."
                          compact
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredSalesHistory.map((s) => {
                      const itemCount = (s.items || []).reduce((acc, it) => acc + it.quantity, 0);
                      const isRefunded = s.status === 'refunded';
                      const isPartial = s.status === 'partial_refund';

                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-[var(--bg-elevated)]/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-[var(--text-muted)] font-mono tabular-nums text-[11px] whitespace-nowrap">
                            {new Date(s.created_at).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums font-bold text-[var(--text-primary)]">
                            {s.sale_number}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)]">
                            {s.customer
                              ? `${s.customer.first_name} ${s.customer.last_name}`
                              : 'Cliente al banco'}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-[var(--text-secondary)]">
                            {itemCount} pz ({(s.items || []).length} righe)
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)]">
                            {s.payment_method === 'card'
                              ? 'POS / Carta'
                              : s.payment_method === 'cash'
                              ? 'Contanti'
                              : s.payment_method === 'transfer'
                              ? 'Bonifico'
                              : 'Buono'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[var(--text-primary)]">
                            {formatItCurrency(Number(s.total_amount))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isRefunded ? (
                              <StatusBadge tone="critical" size="sm">
                                Rimborsato
                              </StatusBadge>
                            ) : isPartial ? (
                              <StatusBadge tone="warning" size="sm">
                                Reso Parziale
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone="operational" size="sm">
                                Completato
                              </StatusBadge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-3">
                              {!isRefunded && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReturnModal(s)}
                                  className="text-xs text-[var(--accent-critical-text)] hover:underline font-medium cursor-pointer"
                                  title="Esegui reso o cambio merce"
                                >
                                  Reso
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setCompletedSale({
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
                                  })
                                }
                                className="text-xs text-[var(--rivo-volt-text)] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
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
          </SurfaceCard>
        </div>
      )}

      {/* ZERO STOCK FORCE-ADD CONFIRMATION MODAL (replaces window.confirm) */}
      {confirmZeroStockItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="zero-stock-title"
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-warning-bg)] border border-[var(--accent-warning-border)] text-[var(--accent-warning-text)] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="zero-stock-title"
                  className="font-display text-base font-bold text-[var(--text-primary)]"
                >
                  Variante Esaurita a Magazzino
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  La variante{' '}
                  <strong className="text-[var(--text-primary)]">
                    {confirmZeroStockItem.product.name} ({confirmZeroStockItem.variant.size || 'U'})
                  </strong>{' '}
                  risulta esaurita a magazzino. Vuoi forzare l&apos;aggiunta alla vendita?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setConfirmZeroStockItem(null)}
                className="px-4 min-h-[40px] text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  commitAddToCart(
                    confirmZeroStockItem.product,
                    confirmZeroStockItem.variant,
                    confirmZeroStockItem.availableStock
                  );
                  setConfirmZeroStockItem(null);
                }}
                className="px-4 min-h-[40px] text-xs font-bold rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] cursor-pointer"
              >
                Forza Aggiunta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED SALE / RECEIPT PREVIEW MODAL */}
      {completedSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-modal-title"
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="text-center space-y-1 border-b border-dashed border-[var(--border-subtle)] pb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] mb-1">
                <CheckCircle2 className="w-6 h-6" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h2
                id="receipt-modal-title"
                className="font-display text-lg font-bold text-[var(--text-primary)]"
              >
                Vendita Completata!
              </h2>
              <div className="font-mono text-xs text-[var(--text-muted)]">
                Ricevuta:{' '}
                <span className="font-bold text-[var(--text-primary)]">
                  {completedSale.sale_number}
                </span>
              </div>
              <div className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                {new Date(completedSale.createdAt).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="space-y-2 text-xs border-b border-dashed border-[var(--border-subtle)] pb-3 max-h-48 overflow-y-auto">
              {(completedSale.cartItems || []).map((it, idx) => (
                <div key={idx} className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-[var(--text-primary)] block">
                      {it.product_name}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {it.variant_name || ''} × {it.quantity}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-[var(--text-primary)] shrink-0">
                    {formatItCurrency(it.unit_price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs border-b border-dashed border-[var(--border-subtle)] pb-3">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotale:</span>
                <span className="font-mono tabular-nums">
                  {formatItCurrency(
                    completedSale.totals?.subtotal ?? completedSale.totals?.finalTotal ?? 0
                  )}
                </span>
              </div>
              {completedSale.totals?.cartDiscount > 0 && (
                <div className="flex justify-between text-[var(--accent-warning-text)]">
                  <span>Sconto:</span>
                  <span className="font-mono tabular-nums">
                    - {formatItCurrency(completedSale.totals.cartDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[var(--text-muted)] text-[11px]">
                <span>di cui IVA 22%:</span>
                <span className="font-mono tabular-nums">
                  {formatItCurrency(completedSale.totals?.taxAmount ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[var(--text-primary)] pt-1">
                <span className="font-display">TOTALE PAGATO:</span>
                <span className="font-mono tabular-nums text-[var(--rivo-volt-text)]">
                  {formatItCurrency(completedSale.totals?.finalTotal ?? 0)}
                </span>
              </div>
              {completedSale.paymentMethod === 'cash' && (
                <div className="flex justify-between text-xs text-[var(--accent-operational-text)] pt-1">
                  <span>Resto corrisposto:</span>
                  <span className="font-mono tabular-nums">
                    {formatItCurrency(completedSale.cashChange ?? 0)}
                  </span>
                </div>
              )}
            </div>

            {completedSale.customer && (
              <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
                Cliente:{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  {completedSale.customer.first_name} {completedSale.customer.last_name}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span>Stampa Ricevuta</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <span>Nuova Vendita</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN & REFUND MODAL */}
      {isReturnModalOpen && returnSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-modal-title"
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <RotateCcw
                  className="w-5 h-5 text-[var(--accent-critical-text)] shrink-0"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <h2
                  id="return-modal-title"
                  className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] truncate"
                >
                  Reso Merce — Scontrino {returnSale.sale_number}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                aria-label="Chiudi finestra reso"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            {returnModalError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>{returnModalError}</span>
              </div>
            )}

            <div className="space-y-3">
              <span className="text-xs font-semibold text-[var(--text-secondary)] block">
                Seleziona quantità da rendere per articolo:
              </span>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {(returnSale.items || []).map((it) => {
                  const maxQty = it.quantity - (it.returned_quantity || 0);
                  if (maxQty <= 0) return null;

                  return (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[var(--text-primary)]">
                          {it.product_name}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {it.variant_name}
                        </div>
                        <div className="font-mono tabular-nums text-[var(--text-muted)]">
                          {formatItCurrency(it.unit_price)} cad. (Max: {maxQty} pz)
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label
                          htmlFor={`return-qty-${it.id}`}
                          className="text-[11px] text-[var(--text-muted)]"
                        >
                          Qta Reso:
                        </label>
                        <input
                          id={`return-qty-${it.id}`}
                          type="number"
                          min="0"
                          max={maxQty}
                          value={returnQuantities[it.id] ?? 0}
                          onChange={(e) =>
                            setReturnQuantities({
                              ...returnQuantities,
                              [it.id]: Math.min(
                                maxQty,
                                Math.max(0, parseInt(e.target.value, 10) || 0)
                              ),
                            })
                          }
                          className="w-16 text-right font-mono tabular-nums font-bold bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label
                    htmlFor="return-reason"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Causale Reso
                  </label>
                  <select
                    id="return-reason"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                  >
                    <option value="Cambio taglia">Cambio taglia</option>
                    <option value="Difetto fabbrica">Difetto di fabbrica</option>
                    <option value="Ripensamento cliente">Ripensamento cliente</option>
                    <option value="Altro">Altro motivo</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="refund-method"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Modalità Rimborso
                  </label>
                  <select
                    id="refund-method"
                    value={refundMethod}
                    onChange={(e) =>
                      setRefundMethod(e.target.value as 'cash' | 'card' | 'coupon')
                    }
                    className="w-full min-h-[40px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)]"
                  >
                    <option value="cash">Contanti</option>
                    <option value="card">Riaccredito Carta</option>
                    <option value="coupon">Buono Spesa RIVO</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={restockItem}
                  onChange={(e) => setRestockItem(e.target.checked)}
                  className="rounded accent-[var(--rivo-volt)]"
                />
                <span>Rimetti gli articoli a magazzino (Ricarico stock automatico)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 min-h-[40px] text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleProcessReturn}
                disabled={processingReturn}
                className="inline-flex items-center gap-2 bg-[#B91C1C] hover:opacity-90 text-white px-5 min-h-[40px] rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {processingReturn && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                <span>Conferma Reso & Rimborsa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

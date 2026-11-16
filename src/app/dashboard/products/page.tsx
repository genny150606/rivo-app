'use client';

import { Fragment, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Barcode,
  Edit3,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Cpu,
  ScanLine,
  Boxes,
  Package,
  Coins,
} from 'lucide-react';
import Link from 'next/link';
import { Product, ProductCategory, Brand } from '@/platform/retail/types';
import { PageHeader, KpiCard, SurfaceCard, StatusBadge, EmptyState } from '@/components/ui';
import { formatItCurrency } from '@/lib/chart-theme';
import { cn } from '@/lib/cn';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('all'); // all, in, low, out
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // New Category / Brand quick inputs
  const [newCatName, setNewCatName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // Form state for Create / Edit
  const [formName, setFormName] = useState('');
  const [formBrandId, setFormBrandId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formTaxRate, setFormTaxRate] = useState('22');
  const [formDescription, setFormDescription] = useState('');
  const [formVariants, setFormVariants] = useState<Array<{
    id?: string;
    size: string;
    color: string;
    barcode: string;
    sku: string;
    initial_stock: number;
    reorder_threshold: number;
  }>>([
    { size: '40', color: 'Nero', barcode: '', sku: '', initial_stock: 4, reorder_threshold: 2 },
    { size: '41', color: 'Nero', barcode: '', sku: '', initial_stock: 6, reorder_threshold: 2 },
    { size: '42', color: 'Nero', barcode: '', sku: '', initial_stock: 8, reorder_threshold: 3 },
    { size: '43', color: 'Nero', barcode: '', sku: '', initial_stock: 6, reorder_threshold: 2 },
  ]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/products/categories'),
        fetch('/api/products/brands'),
      ]);

      const [prodData, catData, brandData] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        brandRes.json(),
      ]);

      if (prodRes.ok) setProducts(prodData.products || []);
      if (catRes.ok) setCategories(catData.categories || []);
      if (brandRes.ok) setBrands(brandData.brands || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore nel caricamento del catalogo';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Escape closes active modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmDeleteProduct) setConfirmDeleteProduct(null);
      else if (isBrandModalOpen) setIsBrandModalOpen(false);
      else if (isCategoryModalOpen) setIsCategoryModalOpen(false);
      else if (isCreateOpen) setIsCreateOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmDeleteProduct, isBrandModalOpen, isCategoryModalOpen, isCreateOpen]);

  // Toggle Row Expansion
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalArticles = products.length;
    let totalPieces = 0;
    let totalStockValue = 0;
    let lowStockCount = 0;

    for (const p of products) {
      const cost = p.cost_price || p.sale_price * 0.5;
      for (const v of p.variants || []) {
        const qty = v.quantity_on_hand || (v as unknown as { stock?: number }).stock || 0;
        totalPieces += qty;
        totalStockValue += qty * cost;
        if (qty > 0 && qty <= (v.reorder_threshold || 3)) {
          lowStockCount += 1;
        }
      }
    }

    return { totalArticles, totalPieces, totalStockValue, lowStockCount };
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku?.toLowerCase().includes(q);
        const matchesBarcode = p.barcode?.toLowerCase().includes(q);
        const matchesBrand = p.brand?.toLowerCase().includes(q);
        const matchesVariant = p.variants?.some(
          (v) =>
            v.size?.toLowerCase().includes(q) ||
            v.color?.toLowerCase().includes(q) ||
            v.barcode?.toLowerCase().includes(q) ||
            v.sku?.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesSku && !matchesBarcode && !matchesBrand && !matchesVariant) {
          return false;
        }
      }

      if (selectedCategory && p.category_id !== selectedCategory) {
        return false;
      }

      if (selectedBrand && p.brand_id !== selectedBrand) {
        return false;
      }

      const totalStock = p.total_stock || (p as unknown as { totalStock?: number }).totalStock || 0;
      const hasLow = (p as unknown as { hasLowStockVariant?: boolean }).hasLowStockVariant;
      if (stockFilter === 'out' && totalStock > 0) return false;
      if (stockFilter === 'in' && totalStock <= 0) return false;
      if (stockFilter === 'low' && !hasLow) return false;

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, stockFilter]);

  // Preset Shoe Sizes Generator
  const applyShoeSizePreset = (type: 'men' | 'women') => {
    const sizes =
      type === 'men'
        ? ['39', '40', '41', '42', '43', '44', '45', '46']
        : ['35', '36', '37', '38', '39', '40', '41'];
    setFormVariants(
      sizes.map((s) => ({
        size: s,
        color: formVariants[0]?.color || 'Nero',
        barcode: '',
        sku: formSku ? `${formSku}-${s}` : '',
        initial_stock: 4,
        reorder_threshold: 2,
      }))
    );
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBrandId(brands[0]?.id || '');
    setFormCategoryId(categories[0]?.id || '');
    setFormSku('');
    setFormBarcode('');
    setFormCostPrice('');
    setFormSalePrice('');
    setFormTaxRate('22');
    setFormDescription('');
    setFormVariants([
      { size: '40', color: 'Nero', barcode: '', sku: '', initial_stock: 4, reorder_threshold: 2 },
      { size: '41', color: 'Nero', barcode: '', sku: '', initial_stock: 6, reorder_threshold: 2 },
      { size: '42', color: 'Nero', barcode: '', sku: '', initial_stock: 8, reorder_threshold: 3 },
      { size: '43', color: 'Nero', barcode: '', sku: '', initial_stock: 6, reorder_threshold: 2 },
    ]);
    setModalError(null);
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBrandId(p.brand_id || '');
    setFormCategoryId(p.category_id || '');
    setFormSku(p.sku || '');
    setFormBarcode(p.barcode || '');
    setFormCostPrice(p.cost_price ? String(p.cost_price) : '');
    setFormSalePrice(String(p.sale_price));
    setFormTaxRate(String(p.tax_rate || 22));
    setFormDescription(p.description || '');
    setFormVariants(
      (p.variants || []).map((v) => ({
        id: v.id,
        size: v.size || '',
        color: v.color || '',
        barcode: v.barcode || '',
        sku: v.sku || '',
        initial_stock: 0,
        reorder_threshold: v.reorder_threshold || 2,
      }))
    );
    setModalError(null);
    setIsCreateOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const costNum = formCostPrice ? parseFloat(formCostPrice) : undefined;
      const saleNum = parseFloat(formSalePrice);

      if (!formName.trim()) throw new Error('Inserire il nome dell’articolo');
      if (isNaN(saleNum) || saleNum < 0) throw new Error('Inserire un prezzo di vendita valido');
      if (formVariants.length === 0) throw new Error('Inserire almeno una variante o taglia');

      const payload = {
        name: formName.trim(),
        brand_id: formBrandId || null,
        category_id: formCategoryId || null,
        sku: formSku.trim() || undefined,
        barcode: formBarcode.trim() || undefined,
        cost_price: costNum,
        sale_price: saleNum,
        tax_rate: parseFloat(formTaxRate) || 22,
        description: formDescription.trim() || undefined,
        variants: formVariants.map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          size: v.size.trim(),
          color: v.color.trim(),
          sku: v.sku.trim() || undefined,
          barcode: v.barcode.trim() || undefined,
          reorder_threshold: Number(v.reorder_threshold) || 2,
          initial_stock: Number(v.initial_stock) || 0,
        })),
      };

      const method = editingProduct ? 'PATCH' : 'POST';
      const body = editingProduct ? { id: editingProduct.id, ...payload } : payload;

      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Errore nel salvataggio');
      }

      setIsCreateOpen(false);
      setFeedback({
        type: 'success',
        message: editingProduct
          ? `Articolo "${formName.trim()}" aggiornato.`
          : `Articolo "${formName.trim()}" aggiunto al catalogo.`,
      });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore salvataggio';
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Product (inline confirmation modal instead of window.confirm/alert)
  const executeDeleteProduct = async () => {
    if (!confirmDeleteProduct) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/products?id=${confirmDeleteProduct.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante l’eliminazione');
      setFeedback({
        type: 'success',
        message: `Articolo "${confirmDeleteProduct.name}" rimosso dal catalogo.`,
      });
      setConfirmDeleteProduct(null);
      loadData();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Errore durante l’eliminazione',
      });
      setConfirmDeleteProduct(null);
    } finally {
      setDeleting(false);
    }
  };

  // Create Category directly
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch('/api/products/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCategories((prev) => [...prev, data.category]);
        setFormCategoryId(data.category.id);
        setNewCatName('');
        setIsCategoryModalOpen(false);
        setFeedback({ type: 'success', message: `Categoria "${data.category.name}" aggiunta.` });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Brand directly
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    try {
      const res = await fetch('/api/products/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrandName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setBrands((prev) => [...prev, data.brand]);
        setFormBrandId(data.brand.id);
        setNewBrandName('');
        setIsBrandModalOpen(false);
        setFeedback({ type: 'success', message: `Brand "${data.brand.name}" aggiunto.` });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Estimated Margin Calculation
  const estimatedMargin = useMemo(() => {
    const sale = parseFloat(formSalePrice);
    const cost = parseFloat(formCostPrice);
    if (isNaN(sale) || isNaN(cost) || sale <= 0) return null;
    const marginEuro = sale - cost;
    const marginPercent = ((marginEuro / sale) * 100).toFixed(1);
    return { marginEuro: marginEuro.toFixed(2), marginPercent };
  }, [formSalePrice, formCostPrice]);

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="01 // CATALOGO ERP"
        title="Catalogo Prodotti & Articoli"
        description="Gestione articoli, numerazioni scarpe, prezzi e scorte di magazzino in tempo reale."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3 min-h-[40px] max-sm:min-h-[44px] text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              + Categoria
            </button>
            <button
              type="button"
              onClick={() => setIsBrandModalOpen(true)}
              className="px-3 min-h-[40px] max-sm:min-h-[44px] text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              + Brand
            </button>
            <Link
              href="/dashboard/scanner"
              className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] max-sm:min-h-[44px] text-xs font-bold rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] transition-colors"
            >
              <ScanLine className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden sm:inline">Scanner Mobile</span>
            </Link>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 min-h-[40px] max-sm:min-h-[44px] text-xs font-semibold rounded-lg bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-canvas)] transition-opacity cursor-pointer"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Nuovo Articolo</span>
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
              : 'bg-[var(--accent-critical-bg)] border-[var(--accent-critical-border)] text-[var(--accent-critical-text)]'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
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

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Articoli a Catalogo"
          value={stats.totalArticles}
          icon={Package}
          loading={loading}
        />
        <KpiCard
          label="Pezzi a Magazzino"
          value={stats.totalPieces.toLocaleString('it-IT')}
          icon={Boxes}
          loading={loading}
        />
        <KpiCard
          label="Valore Stimato Carico"
          value={formatItCurrency(stats.totalStockValue)}
          icon={Coins}
          loading={loading}
        />
        <KpiCard
          label="Varianti Sottoscorta"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          tone={stats.lowStockCount > 0 ? 'warning' : 'operational'}
          context={stats.lowStockCount > 0 ? 'Sotto soglia riordino' : 'Scorte regolari'}
          loading={loading}
        />
      </div>

      {/* AI Quick Copilot Banner (Crisp operational strip, zero rainbow glow) */}
      <SurfaceCard variant="elevated" padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-[var(--rivo-volt-text)]">
              <Cpu className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                Carico Veloce con l&apos;Assistente AI
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Non vuoi inserire i dati a mano? Usa l&apos;Assistente AI in basso a destra (es.{' '}
                <em>&quot;inserisci 15 Air Max 95 di taglia 43&quot;</em>) oppure inquadra il codice a barre da smartphone.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/scanner"
            className="inline-flex items-center justify-center gap-1.5 px-4 min-h-[40px] max-sm:min-h-[44px] text-xs font-bold rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] shrink-0 transition-colors"
          >
            <ScanLine className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            <span>Scanner Fotocamera</span>
          </Link>
        </div>
      </SurfaceCard>

      {/* Search & Filter Toolbar */}
      <SurfaceCard padding="sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-0">
            <label htmlFor="products-search" className="sr-only">
              Cerca per modello, codice SKU, barcode, colore o taglia
            </label>
            <Search
              className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              id="products-search"
              name="products-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per modello, codice SKU, barcode, colore o taglia…"
              className="w-full min-h-[40px] max-sm:min-h-[44px] pl-9 pr-3 py-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="filter-category" className="sr-only">
              Filtra per categoria
            </label>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-h-[40px] max-sm:min-h-[44px] px-2.5 py-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <option value="">Tutte le Categorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <label htmlFor="filter-brand" className="sr-only">
              Filtra per brand
            </label>
            <select
              id="filter-brand"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="min-h-[40px] max-sm:min-h-[44px] px-2.5 py-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <option value="">Tutti i Brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <label htmlFor="filter-stock" className="sr-only">
              Filtra per stato stock
            </label>
            <select
              id="filter-stock"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="min-h-[40px] max-sm:min-h-[44px] px-2.5 py-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <option value="all">Tutti gli stati stock</option>
              <option value="in">Disponibili in magazzino</option>
              <option value="low">Sotto scorta / Riordino</option>
              <option value="out">Esauriti (0 pezzi)</option>
            </select>
          </div>
        </div>
      </SurfaceCard>

      {/* Main Catalog Data Table */}
      <SurfaceCard padding="none" className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3" aria-busy="true">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--rivo-volt-text)]" aria-hidden="true" />
            <span className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">
              Caricamento catalogo…
            </span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={ShoppingBag}
              title="Nessun articolo trovato"
              description={
                searchQuery || selectedCategory || selectedBrand
                  ? 'Nessun prodotto corrisponde ai filtri di ricerca applicati.'
                  : 'Inizia creando il tuo primo articolo con le relative taglie e scorte iniziali.'
              }
              primaryAction={
                !searchQuery
                  ? { label: 'Crea Articolo', onClick: openCreateModal, icon: Plus }
                  : undefined
              }
              compact
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[780px]">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 font-mono text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="py-3 px-3 w-10">
                    <span className="sr-only">Espandi varianti</span>
                  </th>
                  <th className="py-3 px-4">Articolo / Modello</th>
                  <th className="py-3 px-3">Brand</th>
                  <th className="py-3 px-3">Categoria</th>
                  <th className="py-3 px-3 text-right">Prezzo Vendita</th>
                  <th className="py-3 px-3 text-right">Costo / Margine</th>
                  <th className="py-3 px-3 text-center">Giacenza</th>
                  <th className="py-3 px-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredProducts.map((p) => {
                  const isExpanded = expandedRows.has(p.id);
                  const totalStock =
                    p.total_stock || (p as unknown as { totalStock?: number }).totalStock || 0;
                  const hasLow = (p as unknown as { hasLowStockVariant?: boolean }).hasLowStockVariant;

                  return (
                    <Fragment key={p.id}>
                      <tr className="hover:bg-[var(--bg-elevated)]/50 transition-colors group">
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleRow(p.id)}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? `Comprimi varianti per ${p.name}` : `Espandi varianti per ${p.name}`}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                            ) : (
                              <ChevronRight className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[var(--text-primary)] flex flex-wrap items-center gap-2">
                            <span>{p.name}</span>
                            {p.barcode && (
                              <span
                                className="font-mono tabular-nums text-[10px] text-[var(--text-muted)] flex items-center gap-0.5"
                                translate="no"
                              >
                                <Barcode className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
                                {p.barcode}
                              </span>
                            )}
                          </div>
                          {p.sku && (
                            <div className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]" translate="no">
                              SKU: {p.sku}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[var(--text-secondary)] font-medium">
                          {p.brand || '—'}
                        </td>
                        <td className="py-3 px-3 text-[var(--text-secondary)]">
                          {p.category_name || '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-[var(--text-primary)]">
                          {formatItCurrency(Number(p.sale_price))}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                          {p.cost_price ? (
                            <div>
                              <span>{formatItCurrency(Number(p.cost_price))}</span>
                              <span className="ml-1 text-[10px] font-semibold text-[var(--accent-operational-text)]">
                                ({(((p.sale_price - p.cost_price) / p.sale_price) * 100).toFixed(0)}%)
                              </span>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StatusBadge
                            tone={totalStock === 0 ? 'critical' : hasLow ? 'warning' : 'operational'}
                            size="sm"
                          >
                            {totalStock} pz
                          </StatusBadge>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            title="Modifica articolo"
                            aria-label={`Modifica articolo ${p.name}`}
                            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProduct({ id: p.id, name: p.name })}
                            title="Rimuovi dal catalogo"
                            aria-label={`Rimuovi ${p.name} dal catalogo`}
                            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-critical-text)] hover:bg-[var(--accent-critical-bg)] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>

                      {/* Nested Variant Breakdown Table */}
                      {isExpanded && (
                        <tr className="bg-[var(--bg-elevated)]/30">
                          <td colSpan={8} className="py-3 px-4 sm:px-8">
                            <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden bg-[var(--bg-surface)]">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="bg-[var(--bg-elevated)]/70 font-mono text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                                      <th className="py-2 px-3">Taglia / Misura</th>
                                      <th className="py-2 px-3">Colore / Variante</th>
                                      <th className="py-2 px-3">Codice Barcode</th>
                                      <th className="py-2 px-3">SKU Univoco</th>
                                      <th className="py-2 px-3 text-center">Giacenza Attuale</th>
                                      <th className="py-2 px-3 text-center">Soglia Riordino</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {(p.variants || []).map((v) => {
                                      const stock =
                                        v.quantity_on_hand ||
                                        (v as unknown as { stock?: number }).stock ||
                                        0;
                                      const isLow = stock > 0 && stock <= (v.reorder_threshold || 2);
                                      const isOut = stock <= 0;

                                      return (
                                        <tr
                                          key={v.id || v.size}
                                          className="hover:bg-[var(--bg-elevated)]/40 transition-colors"
                                        >
                                          <td className="py-2 px-3 font-mono font-bold text-[var(--text-primary)]">
                                            {v.size || 'Unica'}
                                          </td>
                                          <td className="py-2 px-3 text-[var(--text-secondary)]">
                                            {v.color || 'Standard'}
                                          </td>
                                          <td className="py-2 px-3 font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                                            {v.barcode || '—'}
                                          </td>
                                          <td className="py-2 px-3 font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
                                            {v.sku || '—'}
                                          </td>
                                          <td className="py-2 px-3 text-center font-mono tabular-nums font-bold">
                                            <span
                                              className={cn(
                                                isOut
                                                  ? 'text-[var(--accent-critical-text)]'
                                                  : isLow
                                                  ? 'text-[var(--accent-warning-text)]'
                                                  : 'text-[var(--text-primary)]'
                                              )}
                                            >
                                              {stock}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-center font-mono tabular-nums text-[var(--text-muted)]">
                                            {v.reorder_threshold || 2} pz
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>

      {/* Modal: Create or Edit Product */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-5 sm:p-6 my-8">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              aria-label="Chiudi finestra"
              className="absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
            </button>

            <h2
              id="product-modal-title"
              className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)] pr-10"
            >
              {editingProduct ? 'Modifica Articolo' : 'Nuovo Articolo a Catalogo'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Inserisci informazioni prodotto, prezzi, e matrice taglie con giacenze.
            </p>

            {modalError && (
              <div
                role="alert"
                className="mt-4 p-3 rounded-lg bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-xs text-[var(--accent-critical-text)]"
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-4 text-xs">
              {/* Row 1: Name & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="prod-form-name"
                    className="block font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Nome Modello / Articolo *
                  </label>
                  <input
                    id="prod-form-name"
                    name="prod-form-name"
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Es. Nike Air Max 95, Mocassino Pelle…"
                    className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-form-sku"
                    className="block font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Codice SKU Principale
                  </label>
                  <input
                    id="prod-form-sku"
                    name="prod-form-sku"
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="Es. NK-AM95-BLK…"
                    className="w-full min-h-[40px] px-3 py-2 font-mono bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  />
                </div>
              </div>

              {/* Row 2: Category & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="prod-form-cat"
                    className="block font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Categoria
                  </label>
                  <select
                    id="prod-form-cat"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    <option value="">Seleziona Categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="prod-form-brand"
                    className="block font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Brand / Marchio
                  </label>
                  <select
                    id="prod-form-brand"
                    value={formBrandId}
                    onChange={(e) => setFormBrandId(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    <option value="">Seleziona Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Pricing & Margin */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <div>
                  <label
                    htmlFor="prod-form-sale-price"
                    className="block font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Prezzo Vendita (€) *
                  </label>
                  <input
                    id="prod-form-sale-price"
                    type="number"
                    step="0.01"
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    placeholder="Es. 189.00"
                    className="w-full min-h-[38px] px-3 py-1.5 font-mono tabular-nums font-bold bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-form-cost-price"
                    className="block font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Costo Acquisto (€)
                  </label>
                  <input
                    id="prod-form-cost-price"
                    type="number"
                    step="0.01"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    placeholder="Es. 90.00"
                    className="w-full min-h-[38px] px-3 py-1.5 font-mono tabular-nums bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  />
                </div>
                <div>
                  <span className="block font-semibold text-[var(--text-muted)] mb-1">
                    Margine Stimato
                  </span>
                  <div className="min-h-[38px] flex items-center px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg font-mono tabular-nums font-bold text-[var(--accent-operational-text)]">
                    {estimatedMargin
                      ? `€ ${estimatedMargin.marginEuro} (${estimatedMargin.marginPercent}%)`
                      : '—'}
                  </div>
                </div>
              </div>

              {/* Variant Matrix Section */}
              <div className="border border-[var(--border-subtle)] rounded-xl p-4 bg-[var(--bg-elevated)]/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-[var(--text-primary)]">
                      Taglie & Numerazioni
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Definisci le varianti con quantità iniziale in magazzino.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyShoeSizePreset('men')}
                      className="px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      Preset Uomo (39-46)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyShoeSizePreset('women')}
                      className="px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      Preset Donna (35-41)
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {formVariants.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 sm:grid-cols-12 items-end gap-2 bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-subtle)]"
                    >
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`variant-size-${idx}`}
                          className="text-[10px] font-mono text-[var(--text-muted)] block mb-0.5"
                        >
                          Taglia
                        </label>
                        <input
                          id={`variant-size-${idx}`}
                          type="text"
                          required
                          value={v.size}
                          onChange={(e) => {
                            const updated = [...formVariants];
                            updated[idx].size = e.target.value;
                            setFormVariants(updated);
                          }}
                          className="w-full px-2 py-1.5 font-mono font-bold text-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`variant-color-${idx}`}
                          className="text-[10px] font-mono text-[var(--text-muted)] block mb-0.5"
                        >
                          Colore
                        </label>
                        <input
                          id={`variant-color-${idx}`}
                          type="text"
                          value={v.color}
                          onChange={(e) => {
                            const updated = [...formVariants];
                            updated[idx].color = e.target.value;
                            setFormVariants(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                        />
                      </div>
                      <div className={cn(editingProduct ? 'col-span-2 sm:col-span-5' : 'col-span-2 sm:col-span-3')}>
                        <label
                          htmlFor={`variant-barcode-${idx}`}
                          className="text-[10px] font-mono text-[var(--text-muted)] block mb-0.5"
                        >
                          Barcode Univoco
                        </label>
                        <input
                          id={`variant-barcode-${idx}`}
                          type="text"
                          value={v.barcode}
                          placeholder="805…"
                          onChange={(e) => {
                            const updated = [...formVariants];
                            updated[idx].barcode = e.target.value;
                            setFormVariants(updated);
                          }}
                          className="w-full px-2 py-1.5 font-mono text-[11px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                        />
                      </div>
                      {!editingProduct && (
                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`variant-stock-${idx}`}
                            className="text-[10px] font-mono text-[var(--text-muted)] block mb-0.5"
                          >
                            Scorta Iniziale
                          </label>
                          <input
                            id={`variant-stock-${idx}`}
                            type="number"
                            min="0"
                            value={v.initial_stock}
                            onChange={(e) => {
                              const updated = [...formVariants];
                              updated[idx].initial_stock = parseInt(e.target.value, 10) || 0;
                              setFormVariants(updated);
                            }}
                            className="w-full px-2 py-1.5 text-center font-mono tabular-nums font-bold bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-[var(--accent-operational-text)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                          />
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`variant-threshold-${idx}`}
                          className="text-[10px] font-mono text-[var(--text-muted)] block mb-0.5"
                        >
                          Soglia Alert
                        </label>
                        <input
                          id={`variant-threshold-${idx}`}
                          type="number"
                          min="1"
                          value={v.reorder_threshold}
                          onChange={(e) => {
                            const updated = [...formVariants];
                            updated[idx].reorder_threshold = parseInt(e.target.value, 10) || 2;
                            setFormVariants(updated);
                          }}
                          className="w-full px-2 py-1.5 text-center font-mono tabular-nums bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-[var(--text-secondary)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setFormVariants(formVariants.filter((_, i) => i !== idx))}
                          aria-label={`Rimuovi variante ${v.size || idx + 1}`}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-critical-text)] rounded-lg hover:bg-[var(--accent-critical-bg)] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFormVariants([
                      ...formVariants,
                      {
                        size: '',
                        color: formVariants[0]?.color || '',
                        barcode: '',
                        sku: '',
                        initial_stock: 0,
                        reorder_threshold: 2,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--rivo-volt-text)] hover:underline pt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" /> Aggiungi altra taglia
                </button>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 min-h-[40px] text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 min-h-[40px] text-xs font-bold rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                  <span>{editingProduct ? 'Salva Modifiche' : 'Crea Articolo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {confirmDeleteProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
        >
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3
                  id="delete-product-title"
                  className="font-display text-base font-bold text-[var(--text-primary)]"
                >
                  Rimozione Articolo
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Sei sicuro di voler rimuovere{' '}
                  <strong className="text-[var(--text-primary)]">{confirmDeleteProduct.name}</strong> dal
                  catalogo?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setConfirmDeleteProduct(null)}
                disabled={deleting}
                className="px-4 min-h-[40px] text-xs font-semibold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={executeDeleteProduct}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 min-h-[40px] text-xs font-bold rounded-lg bg-[#B91C1C] text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                <span>Rimuovi Articolo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Category Modal */}
      {isCategoryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-cat-title"
        >
          <div className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-xl">
            <h3 id="quick-cat-title" className="font-display text-sm font-bold text-[var(--text-primary)]">
              Nuova Categoria
            </h3>
            <form onSubmit={handleCreateCategory} className="mt-3 space-y-3">
              <div>
                <label htmlFor="new-cat-name" className="sr-only">
                  Nome categoria
                </label>
                <input
                  id="new-cat-name"
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Es. Sneakers, Stivali, Borse…"
                  className="w-full min-h-[40px] px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 min-h-[38px] text-xs rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3.5 min-h-[38px] text-xs font-bold rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] cursor-pointer"
                >
                  Aggiungi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Brand Modal */}
      {isBrandModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-xs overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-brand-title"
        >
          <div className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-xl">
            <h3 id="quick-brand-title" className="font-display text-sm font-bold text-[var(--text-primary)]">
              Nuovo Brand
            </h3>
            <form onSubmit={handleCreateBrand} className="mt-3 space-y-3">
              <div>
                <label htmlFor="new-brand-name" className="sr-only">
                  Nome brand
                </label>
                <input
                  id="new-brand-name"
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Es. Nike, Adidas, Tod's…"
                  className="w-full min-h-[40px] px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-3 min-h-[38px] text-xs rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3.5 min-h-[38px] text-xs font-bold rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] cursor-pointer"
                >
                  Aggiungi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Barcode, 
  Tag, 
  Edit3, 
  Trash2, 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  X, 
  Building2, 
  Layers, 
  PlusCircle, 
  ArrowUpDown,
  Sparkles,
  Info
} from 'lucide-react';
import { Product, ProductCategory, Brand, ProductVariant } from '@/platform/retail/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('all'); // all, in, low, out
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
      const cost = p.cost_price || (p.sale_price * 0.5); // fallback estimate
      for (const v of p.variants || []) {
        const qty = v.quantity_on_hand || (v as any).stock || 0;
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
      // Search query filter
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

      // Category filter
      if (selectedCategory && p.category_id !== selectedCategory) {
        return false;
      }

      // Brand filter
      if (selectedBrand && p.brand_id !== selectedBrand) {
        return false;
      }

      // Stock status filter
      if (stockFilter === 'out' && (p.total_stock || (p as any).totalStock || 0) > 0) return false;
      if (stockFilter === 'in' && (p.total_stock || (p as any).totalStock || 0) <= 0) return false;
      if (stockFilter === 'low' && !(p as any).hasLowStockVariant) return false;

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, stockFilter]);

  // Preset Shoe Sizes Generator
  const applyShoeSizePreset = (type: 'men' | 'women') => {
    const sizes = type === 'men' ? ['39', '40', '41', '42', '43', '44', '45', '46'] : ['35', '36', '37', '38', '39', '40', '41'];
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
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore salvataggio';
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Sei sicuro di voler rimuovere "${name}" dal catalogo?`)) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante l’eliminazione');
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Errore');
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
      }
    } catch (e) {
      console.error(e);
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
      }
    } catch (e) {
      console.error(e);
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
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-white/[0.06] pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Catalogo Prodotti & Articoli
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Gestione articoli, numerazioni scarpe, prezzi e scorte di magazzino in tempo reale.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
          >
            + Categoria
          </button>
          <button
            onClick={() => setIsBrandModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
          >
            + Brand
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Articolo</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0D0D10] border border-zinc-200/80 dark:border-white/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Articoli a Catalogo
          </span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white mt-1">
            {stats.totalArticles}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0D0D10] border border-zinc-200/80 dark:border-white/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Pezzi a Magazzino
          </span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white mt-1">
            {stats.totalPieces}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0D0D10] border border-zinc-200/80 dark:border-white/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Valore Stimato Carico
          </span>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white mt-1">
            € {stats.totalStockValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs ${
          stats.lowStockCount > 0 
            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60' 
            : 'bg-white dark:bg-[#0D0D10] border-zinc-200/80 dark:border-white/[0.06]'
        }`}>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
            {stats.lowStockCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
            Varianti Sottoscorta
          </span>
          <div className={`text-2xl font-bold tracking-tight mt-1 ${
            stats.lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-950 dark:text-white'
          }`}>
            {stats.lowStockCount}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#0D0D10] border border-zinc-200/80 dark:border-white/[0.06] shadow-xs">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-zinc-600 dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per modello, codice SKU, barcode, colore o taglia..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
          >
            <option value="">Tutte le Categorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
          >
            <option value="">Tutti i Brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
          >
            <option value="all">Tutti gli stati stock</option>
            <option value="in">Disponibili in magazzino</option>
            <option value="low">Sotto scorta / Riordino</option>
            <option value="out">Esauriti (0 pezzi)</option>
          </select>
        </div>
      </div>

      {/* Main Catalog Data Table */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0D0D10] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Caricamento catalogo...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nessun articolo trovato</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory || selectedBrand
                ? 'Nessun prodotto corrisponde ai filtri di ricerca applicati.'
                : 'Inizia creando il tuo primo articolo con le relative taglie e scorte iniziali.'}
            </p>
            {!searchQuery && (
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950"
              >
                <Plus className="w-3.5 h-3.5" />
                Crea Articolo
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-3 w-8"></th>
                  <th className="py-3 px-4">Articolo / Modello</th>
                  <th className="py-3 px-3">Brand</th>
                  <th className="py-3 px-3">Categoria</th>
                  <th className="py-3 px-3 text-right">Prezzo Vendita</th>
                  <th className="py-3 px-3 text-right">Costo / Margine</th>
                  <th className="py-3 px-3 text-center">Giacenza</th>
                  <th className="py-3 px-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {filteredProducts.map((p) => {
                  const isExpanded = expandedRows.has(p.id);
                  const totalStock = p.total_stock || (p as any).totalStock || 0;
                  const hasLow = (p as any).hasLowStockVariant;

                  return (
                    <tbody key={p.id}>
                      <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 transition-colors group">
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => toggleRow(p.id)}
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-zinc-950 dark:text-white flex items-center gap-2">
                            <span>{p.name}</span>
                            {p.barcode && (
                              <span className="font-mono text-[10px] text-zinc-400 flex items-center gap-0.5">
                                <Barcode className="w-3 h-3" />
                                {p.barcode}
                              </span>
                            )}
                          </div>
                          {p.sku && (
                            <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                              SKU: {p.sku}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300 font-medium">
                          {p.brand || '—'}
                        </td>
                        <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                          {p.category_name || '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-zinc-950 dark:text-white">
                          € {Number(p.sale_price).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-zinc-600 dark:text-zinc-400">
                          {p.cost_price ? (
                            <div>
                              <span>€ {Number(p.cost_price).toFixed(2)}</span>
                              <span className="ml-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                ({(((p.sale_price - p.cost_price) / p.sale_price) * 100).toFixed(0)}%)
                              </span>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            totalStock === 0
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : hasLow
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                          }`}>
                            {totalStock} pz
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => openEditModal(p)}
                            title="Modifica articolo"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            title="Rimuovi dal catalogo"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* Nested Variant Breakdown Table */}
                      {isExpanded && (
                        <tr className="bg-zinc-50/50 dark:bg-zinc-900/20">
                          <td colSpan={8} className="py-3 px-8">
                            <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-[#0B0B0E]">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-zinc-100/60 dark:bg-zinc-900/60 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                                    <th className="py-2 px-3">Taglia / Misura</th>
                                    <th className="py-2 px-3">Colore / Variante</th>
                                    <th className="py-2 px-3">Codice Barcode</th>
                                    <th className="py-2 px-3">SKU Univoco</th>
                                    <th className="py-2 px-3 text-center">Giacenza Attuale</th>
                                    <th className="py-2 px-3 text-center">Soglia Riordino</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                                  {(p.variants || []).map((v) => {
                                    const stock = v.quantity_on_hand || (v as any).stock || 0;
                                    const isLow = stock > 0 && stock <= (v.reorder_threshold || 2);
                                    const isOut = stock <= 0;

                                    return (
                                      <tr key={v.id || v.size} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                                        <td className="py-2 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                                          {v.size || 'Unica'}
                                        </td>
                                        <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                                          {v.color || 'Standard'}
                                        </td>
                                        <td className="py-2 px-3 font-mono text-[11px] text-zinc-500">
                                          {v.barcode || '—'}
                                        </td>
                                        <td className="py-2 px-3 font-mono text-[11px] text-zinc-500">
                                          {v.sku || '—'}
                                        </td>
                                        <td className="py-2 px-3 text-center font-bold">
                                          <span className={`${
                                            isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-white'
                                          }`}>
                                            {stock}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-center text-zinc-400">
                                          {v.reorder_threshold || 2} pz
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Product */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0E0E12] border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-2xl p-6 my-8">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white">
              {editingProduct ? 'Modifica Articolo' : 'Nuovo Articolo a Catalogo'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Inserisci informazioni prodotto, prezzi, e matrice taglie con giacenze.
            </p>

            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-4 text-xs">
              {/* Row 1: Name & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nome Modello / Articolo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Es. Nike Air Max 95, Mocassino Pelle"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Codice SKU Principale
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="Es. NK-AM95-BLK"
                    className="w-full px-3 py-2 font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Row 2: Category & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-white"
                  >
                    <option value="">Seleziona Categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Brand / Marchio
                  </label>
                  <select
                    value={formBrandId}
                    onChange={(e) => setFormBrandId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-white"
                  >
                    <option value="">Seleziona Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Pricing & Margin */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Prezzo Vendita (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    placeholder="Es. 189.00"
                    className="w-full px-3 py-1.5 font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Costo Acquisto (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    placeholder="Es. 90.00"
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-500 mb-1">
                    Margine Stimato
                  </label>
                  <div className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {estimatedMargin ? `€ ${estimatedMargin.marginEuro} (${estimatedMargin.marginPercent}%)` : '—'}
                  </div>
                </div>
              </div>

              {/* Variant Matrix Section */}
              <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/40 dark:bg-zinc-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-zinc-950 dark:text-white">Taglie & Numerazioni</h4>
                    <p className="text-[11px] text-zinc-500">Definisci le varianti con quantità iniziale in magazzino.</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyShoeSizePreset('men')}
                      className="px-2 py-1 text-[10px] font-semibold rounded bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    >
                      Preset Uomo (39-46)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyShoeSizePreset('women')}
                      className="px-2 py-1 text-[10px] font-semibold rounded bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    >
                      Preset Donna (35-41)
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {formVariants.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white dark:bg-[#0E0E12] p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <div className="w-16">
                        <label className="text-[10px] text-zinc-400 block">Taglia</label>
                        <input
                          type="text"
                          required
                          value={v.size}
                          onChange={(e) => {
                            const updated = [...formVariants];
                            updated[idx].size = e.target.value;
                            setFormVariants(updated);
                          }}
                          className="w-full px-2 py-1 font-bold text-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded"
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[10px] text-zinc-400 block">Colore</label>
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => {
                            const updated = [...formVariants];
                            updated[idx].color = e.target.value;
                            setFormVariants(updated);
                          }}
                          className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-zinc-400 block">Barcode Univoco</label>
                        <input
                          type="text"
                          value={v.barcode}
                          placeholder="805..."
                          onChange={(e) => {
                            const updated = [...formVariants];
                            updated[idx].barcode = e.target.value;
                            setFormVariants(updated);
                          }}
                          className="w-full px-2 py-1 font-mono text-[11px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded"
                        />
                      </div>
                      {!editingProduct && (
                        <div className="w-20">
                          <label className="text-[10px] text-zinc-400 block">Scorta Iniziale</label>
                          <input
                            type="number"
                            min="0"
                            value={v.initial_stock}
                            onChange={(e) => {
                              const updated = [...formVariants];
                              updated[idx].initial_stock = parseInt(e.target.value, 10) || 0;
                              setFormVariants(updated);
                            }}
                            className="w-full px-2 py-1 text-center font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                      )}
                      <div className="w-20">
                        <label className="text-[10px] text-zinc-400 block">Soglia Alert</label>
                        <input
                          type="number"
                          min="1"
                          value={v.reorder_threshold}
                          onChange={(e) => {
                            const updated = [...formVariants];
                            updated[idx].reorder_threshold = parseInt(e.target.value, 10) || 2;
                            setFormVariants(updated);
                          }}
                          className="w-full px-2 py-1 text-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormVariants(formVariants.filter((_, i) => i !== idx))}
                        className="p-1.5 mt-3 text-zinc-400 hover:text-rose-600 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFormVariants([
                      ...formVariants,
                      { size: '', color: formVariants[0]?.color || '', barcode: '', sku: '', initial_stock: 0, reorder_threshold: 2 },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:underline pt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Aggiungi altra taglia
                </button>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 flex items-center gap-1.5 shadow-xs"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProduct ? 'Salva Modifiche' : 'Crea Articolo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#0E0E12] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Nuova Categoria</h3>
            <form onSubmit={handleCreateCategory} className="mt-3 space-y-3">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Es. Sneakers, Stivali, Borse..."
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#0E0E12] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Nuovo Brand</h3>
            <form onSubmit={handleCreateBrand} className="mt-3 space-y-3">
              <input
                type="text"
                required
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Es. Nike, Adidas, Tod's..."
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
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

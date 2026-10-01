'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Barcode, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  Boxes,
  ArrowUpDown,
  Tag
} from 'lucide-react';

interface ProductVariant {
  id?: string;
  size?: string;
  color?: string;
  barcode?: string;
  reorder_threshold?: number;
  stock?: number;
  initial_stock?: number;
}

interface Product {
  id: string;
  name: string;
  brand: string | null;
  sku: string | null;
  description: string | null;
  category_name: string | null;
  cost_price: number | null;
  sale_price: number;
  active: boolean;
  variants: ProductVariant[];
  totalStock: number;
  created_at: string;
}

export default function ProductsPage() {
  const [supabase] = useState(() => createClient());
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Product Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([
    { size: '42', color: 'Nero', barcode: '', reorder_threshold: 3, initial_stock: 5 }
  ]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore nel recupero prodotti');
      }
      setProducts(data.products || []);
    } catch (err: any) {
      console.error('Fetch products error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      { size: '', color: '', barcode: '', reorder_threshold: 3, initial_stock: 0 }
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, val: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError('Il nome del prodotto è obbligatorio');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      const payload = {
        name: name.trim(),
        brand: brand.trim() || null,
        sku: sku.trim() || null,
        category_name: categoryName.trim() || null,
        description: description.trim() || null,
        cost_price: costPrice ? parseFloat(costPrice) : null,
        sale_price: salePrice ? parseFloat(salePrice) : 0.00,
        variants: variants.map(v => ({
          ...v,
          reorder_threshold: Number(v.reorder_threshold) || 3,
          initial_stock: Number(v.initial_stock) || 0
        }))
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore creazione prodotto');
      }

      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      console.error('Create product error:', err);
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore eliminazione');
      }
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setBrand('');
    setSku('');
    setCategoryName('');
    setCostPrice('');
    setSalePrice('');
    setDescription('');
    setVariants([
      { size: '42', color: 'Nero', barcode: '', reorder_threshold: 3, initial_stock: 5 }
    ]);
  };

  const filtered = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            <ShoppingBag className="w-3.5 h-3.5 text-[#bfff00]" />
            <span>Retail & Shoe Store</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Catalogo Prodotti & Articoli
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Gestisci calzature, abbigliamento e varianti per taglia, colore e codice a barre.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-[#bfff00] text-black px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a8e600] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Articolo</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Cerca per modello, brand o SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Products Grid / Table */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#bfff00]" />
          <span className="text-sm">Caricamento catalogo prodotti...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
          <ShoppingBag className="w-12 h-12 text-zinc-400 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Nessun prodotto trovato</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Nessun risultato corrispondente ai filtri.' : 'Inizia aggiungendo il primo articolo con le sue varianti di taglia e colore.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 bg-[#bfff00] text-black px-4 py-2 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Aggiungi Articolo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    {prod.brand && (
                      <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                        {prod.brand}
                      </span>
                    )}
                    <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
                      {prod.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(prod.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    title="Elimina articolo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {prod.sku && (
                  <div className="text-xs text-zinc-500 mb-2 font-mono">
                    SKU: {prod.sku}
                  </div>
                )}

                {prod.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                    {prod.description}
                  </p>
                )}

                {/* Variants preview badges */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="text-[11px] font-semibold text-zinc-500 flex items-center justify-between">
                    <span>Varianti ({prod.variants?.length || 0})</span>
                    <span className="text-zinc-900 dark:text-white font-mono">
                      Giacenza Tot: {prod.totalStock} pz
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                    {prod.variants?.map((v, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium"
                      >
                        {v.size && <span>Taglia {v.size}</span>}
                        {v.color && <span className="opacity-60">• {v.color}</span>}
                        <span className={`ml-1 font-bold ${Number(v.stock) <= Number(v.reorder_threshold) ? 'text-amber-500' : 'text-emerald-500'}`}>
                          ({v.stock || 0})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price and footer */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Prezzo al pubblico</span>
                <span className="text-lg font-bold text-zinc-950 dark:text-white font-mono">
                  €{Number(prod.sale_price).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#bfff00]" />
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Nuovo Articolo</h2>
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

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nome Articolo / Modello *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Air Sneaker Classic"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Brand / Marchio
                  </label>
                  <input
                    type="text"
                    placeholder="es. Nike, Adidas, Gucci..."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Codice SKU Principale
                  </label>
                  <input
                    type="text"
                    placeholder="es. SNK-2026-BLK"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Prezzo al Pubblico (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Varianti (Taglia, Colore, Barcode & Stock Iniziale)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="text-xs text-[#bfff00] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Aggiungi Variante
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-zinc-50 dark:bg-zinc-900/60 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800"
                    >
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Taglia (es. 42)"
                          value={v.size || ''}
                          onChange={(e) => handleUpdateVariant(idx, 'size', e.target.value)}
                          className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Colore"
                          value={v.color || ''}
                          onChange={(e) => handleUpdateVariant(idx, 'color', e.target.value)}
                          className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Barcode"
                          value={v.barcode || ''}
                          onChange={(e) => handleUpdateVariant(idx, 'barcode', e.target.value)}
                          className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Q.tà"
                          title="Quantità iniziale"
                          value={v.initial_stock ?? ''}
                          onChange={(e) => handleUpdateVariant(idx, 'initial_stock', parseInt(e.target.value, 10))}
                          className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white font-mono"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="text-zinc-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
                  <span>Salva Prodotto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Barcode, 
  RotateCw, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Boxes, 
  ArrowLeft,
  X,
  Sparkles,
  Layers,
  Tag
} from 'lucide-react';
import Link from 'next/link';

interface ProductVariant {
  id: string;
  size?: string;
  color?: string;
  barcode?: string;
  stock: number;
}

interface ProductItem {
  id: string;
  name: string;
  brand: string | null;
  sku: string | null;
  category_name: string | null;
  sale_price: number;
  totalStock: number;
  variants: ProductVariant[];
}

export default function StockCheckPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchStock = async () => {
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
      console.error('Stock check fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category_name) set.add(p.category_name);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(p => {
      if (selectedCategory !== 'all' && p.category_name !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const inName = p.name.toLowerCase().includes(q);
      const inBrand = (p.brand || '').toLowerCase().includes(q);
      const inSku = (p.sku || '').toLowerCase().includes(q);
      const inVariant = (p.variants || []).some(
        v =>
          (v.size || '').toLowerCase().includes(q) ||
          (v.color || '').toLowerCase().includes(q) ||
          (v.barcode || '').toLowerCase().includes(q)
      );
      return inName || inBrand || inSku || inVariant;
    });
  }, [products, query, selectedCategory]);

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-xs text-zinc-200">Verifica Taglie Rapida</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1 flex items-center gap-2">
            <span>Verifica Taglie Rapida</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#BFFF00]/10 text-[#BFFF00] border border-[#BFFF00]/30">
              Staff Live
            </span>
          </h1>
        </div>

        <button
          onClick={fetchStock}
          disabled={loading}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          title="Aggiorna giacenze"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#BFFF00]' : ''}`} />
        </button>
      </div>

      {/* Instant Search Bar */}
      <div className="space-y-2 sticky top-2 z-20">
        <div className="relative shadow-2xl">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cerca per modello, brand, taglia o barcode..."
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-[#141715]/95 backdrop-blur-xl border border-zinc-700/80 text-white placeholder:text-zinc-500 text-sm font-medium focus:outline-none focus:border-[#BFFF00] focus:ring-1 focus:ring-[#BFFF00] shadow-xl"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-white text-black font-bold shadow-xs'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Tutti ({products.length})
            </button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === c
                    ? 'bg-white text-black font-bold shadow-xs'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results List */}
      {loading && products.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 space-y-2">
          <RotateCw className="w-6 h-6 mx-auto animate-spin text-[#BFFF00]" />
          <p className="text-xs">Caricamento disponibilità scorte...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 bg-[#121214] border border-zinc-800 rounded-2xl space-y-2">
          <Package className="w-8 h-8 mx-auto opacity-40" />
          <p className="text-sm font-semibold text-zinc-300">Nessun articolo corrispondente</p>
          <p className="text-xs text-zinc-500">Prova a cercare un nome diverso o azzera i filtri.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(prod => {
            const hasStock = prod.totalStock > 0;
            return (
              <div
                key={prod.id}
                className="p-4 rounded-2xl border border-zinc-800 bg-[#121413] hover:border-zinc-700 transition-all shadow-md space-y-3"
              >
                {/* Product Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {prod.brand && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                          {prod.brand}
                        </span>
                      )}
                      {prod.sku && (
                        <span className="text-[10px] font-mono text-zinc-500">
                          SKU: {prod.sku}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">{prod.name}</h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-white block">
                      € {Number(prod.sale_price).toFixed(2)}
                    </span>
                    <span
                      className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        hasStock
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {hasStock ? `${prod.totalStock} pz in negozio` : 'Esaurito'}
                    </span>
                  </div>
                </div>

                {/* Instant Size & Stock Matrix */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#BFFF00]" />
                    <span>Disponibilità taglie in magazzino:</span>
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {prod.variants.map(v => {
                      const qty = v.stock;
                      const isAvailable = qty > 0;
                      const isLow = qty > 0 && qty <= 2;

                      return (
                        <div
                          key={v.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                            isAvailable
                              ? isLow
                                ? 'bg-amber-500/5 border-amber-500/30'
                                : 'bg-zinc-900 border-zinc-700/80'
                              : 'bg-zinc-900/30 border-zinc-800/60 opacity-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="text-sm font-black text-white block font-mono">
                              {v.size || 'Unica'}
                            </span>
                            {v.color && (
                              <span className="text-[10px] text-zinc-400 block truncate">
                                {v.color}
                              </span>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg inline-block ${
                                isAvailable
                                  ? isLow
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-500'
                              }`}
                            >
                              {qty} pz
                            </span>
                          </div>
                        </div>
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
  );
}

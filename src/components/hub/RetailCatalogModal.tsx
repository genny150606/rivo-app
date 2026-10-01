'use client';

import { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  X, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  Tag, 
  Sparkles,
  Layers
} from 'lucide-react';
import { hapticTap, hapticSelection } from '@/lib/haptics';

export interface RetailProductVariant {
  id: string;
  size?: string;
  color?: string;
  barcode?: string;
  stock: number;
}

export interface RetailProduct {
  id: string;
  name: string;
  brand: string | null;
  sku: string | null;
  description: string | null;
  categoryName: string | null;
  salePrice: number;
  formattedPrice: string;
  variants: RetailProductVariant[];
  totalStock: number;
  isAvailable: boolean;
}

interface RetailCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: RetailProduct[];
  orgName: string;
  primaryColor: string;
  isLight: boolean;
}

export default function RetailCatalogModal({
  isOpen,
  onClose,
  products,
  orgName,
  primaryColor,
  isLight,
}: RetailCatalogModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<RetailProduct | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName && p.categoryName.trim()) {
        set.add(p.categoryName.trim());
      }
    });
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.categoryName !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const inName = p.name.toLowerCase().includes(q);
      const inBrand = (p.brand || '').toLowerCase().includes(q);
      const inSku = (p.sku || '').toLowerCase().includes(q);
      const inVariants = (p.variants || []).some(
        (v) => (v.size || '').toLowerCase().includes(q) || (v.color || '').toLowerCase().includes(q)
      );
      return inName || inBrand || inSku || inVariants;
    });
  }, [products, search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-lg h-[92vh] sm:h-[86vh] rounded-t-[32px] sm:rounded-[32px] border flex flex-col overflow-hidden shadow-2xl transition-all relative ${
          isLight
            ? 'bg-white text-slate-900 border-slate-200'
            : 'bg-[#121413] text-zinc-100 border-white/10'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-black/20 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0"
              style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
            >
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold truncate">
                Catalogo & Nuovi Arrivi
              </h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate flex items-center gap-1.5">
                <span>{orgName}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400 font-semibold">{products.length} articoli disponibili</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              hapticTap();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
            aria-label="Chiudi catalogo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-3 border-b border-white/5 space-y-2.5 shrink-0 bg-black/10">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca modello, brand, taglia (es. Nike, 42, Air)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white/5 border border-white/10 focus:outline-none focus:border-white/30 text-white placeholder:text-zinc-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => {
                hapticSelection();
                setSelectedCategory('all');
              }}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              Tutti ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  hapticSelection();
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Products List */}
        <div className="overflow-y-auto flex-1 p-3.5 space-y-3 no-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 space-y-2">
              <ShoppingBag className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">Nessun articolo trovato con i filtri attuali.</p>
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const hasStock = prod.totalStock > 0;
              return (
                <div
                  key={prod.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isLight
                      ? 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/60'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {prod.brand && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                          {prod.brand}
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-white leading-tight">{prod.name}</h4>
                      {prod.description && (
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-extrabold text-white block">
                        {prod.formattedPrice}
                      </span>
                      <span
                        className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          hasStock
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {hasStock ? `${prod.totalStock} disponibili` : 'Esaurito'}
                      </span>
                    </div>
                  </div>

                  {/* Size Matrix Chips with Stock Badges */}
                  {prod.variants && prod.variants.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/5">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#BFFF00]" />
                        <span>Taglie e disponibilità in negozio:</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {prod.variants.map((v) => {
                          const isAvailable = v.stock > 0;
                          return (
                            <div
                              key={v.id}
                              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
                                isAvailable
                                  ? 'bg-zinc-900 border-zinc-700 text-white'
                                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 line-through opacity-60'
                              }`}
                            >
                              <span className="font-bold">{v.size || 'Taglia unica'}</span>
                              {v.color && (
                                <span className="text-[9px] text-zinc-400 font-sans">({v.color})</span>
                              )}
                              <span
                                className={`text-[9px] font-bold px-1 rounded ${
                                  v.stock > 3
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : v.stock > 0
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'text-zinc-600'
                                }`}
                              >
                                {v.stock > 0 ? `${v.stock} pz` : '0'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 border-t border-white/10 bg-black/40 text-center shrink-0">
          <p className="text-[10px] text-zinc-400">
            Richiedi assistenza al personale di vendita per provare un modello o verificare altre varianti.
          </p>
        </div>
      </div>
    </div>
  );
}

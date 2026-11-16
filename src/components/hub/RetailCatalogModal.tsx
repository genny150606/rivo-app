'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  X,
  Tag,
} from 'lucide-react';
import { hapticTap, hapticSelection } from '@/lib/haptics';

function getContrastInk(hex: string): '#09090B' | '#FFFFFF' {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return '#FFFFFF';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#09090B' : '#FFFFFF';
}

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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const accentInk = getContrastInk(primaryColor);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          hapticTap();
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Catalogo ${orgName}`}
        className={`w-full max-w-lg h-[92vh] sm:h-[86vh] rounded-t-2xl sm:rounded-2xl border flex flex-col overflow-hidden shadow-2xl transition-colors relative ${
          isLight
            ? 'bg-white text-[#09090B] border-[#E4E6EB]'
            : 'bg-[#09090B] text-[#F4F4F6] border-[#22242A]'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between gap-2 shrink-0 z-10 ${
            isLight ? 'border-[#E4E6EB] bg-[#F6F7F9]' : 'border-[#22242A] bg-[#111215]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0"
              style={{ backgroundColor: primaryColor, color: accentInk }}
            >
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold truncate tracking-tight">
                Catalogo & Nuovi Arrivi
              </h3>
              <p
                className={`text-[11px] truncate flex items-center gap-1.5 ${
                  isLight ? 'text-[#52525B]' : 'text-[#A1A1AA]'
                }`}
              >
                <span>{orgName}</span>
                <span>•</span>
                <span
                  className={`font-semibold tabular-nums ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  {products.length} articoli disponibili
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              hapticTap();
              onClose();
            }}
            className={`p-2 rounded-xl min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] ${
              isLight
                ? 'text-[#52525B] hover:text-zinc-950 bg-zinc-200/70 hover:bg-zinc-200'
                : 'text-[#A1A1AA] hover:text-white bg-white/5 hover:bg-white/10'
            }`}
            aria-label="Chiudi catalogo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div
          className={`p-3 border-b space-y-2.5 shrink-0 ${
            isLight ? 'border-[#E4E6EB] bg-[#F6F7F9]/70' : 'border-[#22242A] bg-[#0D0D10]'
          }`}
        >
          <div className="relative">
            <label htmlFor="retail-catalog-search" className="sr-only">
              Cerca nel catalogo
            </label>
            <Search
              className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-[#71717A]' : 'text-[#A1A1AA]'
              }`}
            />
            <input
              id="retail-catalog-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca modello, brand, taglia (es. Nike, 42, Air)…"
              className={`w-full min-h-[44px] pl-9 pr-12 py-2 rounded-xl text-xs border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] transition-colors ${
                isLight
                  ? 'bg-white border-[#D4D4D8] text-[#09090B] placeholder:text-[#71717A] focus:border-[#09090B]'
                  : 'bg-[#111215] border-[#22242A] text-white placeholder:text-[#71717A] focus:border-white/30'
              }`}
            />
            {search && (
              <button
                type="button"
                aria-label="Cancella ricerca"
                onClick={() => setSearch('')}
                className={`absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] ${
                  isLight ? 'text-[#71717A] hover:text-[#09090B]' : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              type="button"
              aria-label="Mostra tutte le categorie"
              aria-pressed={selectedCategory === 'all'}
              onClick={() => {
                hapticSelection();
                setSelectedCategory('all');
              }}
              className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] ${
                selectedCategory === 'all'
                  ? ''
                  : isLight
                  ? 'bg-white text-zinc-700 hover:text-zinc-950 border border-[#E4E6EB]'
                  : 'bg-white/5 text-[#D4D4D8] hover:text-white border border-[#22242A]'
              }`}
              style={
                selectedCategory === 'all'
                  ? { backgroundColor: primaryColor, color: accentInk }
                  : undefined
              }
            >
              Tutti ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-label={`Filtra categoria ${cat}`}
                aria-pressed={selectedCategory === cat}
                onClick={() => {
                  hapticSelection();
                  setSelectedCategory(cat);
                }}
                className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] ${
                  selectedCategory === cat
                    ? ''
                    : isLight
                    ? 'bg-white text-zinc-700 hover:text-zinc-950 border border-[#E4E6EB]'
                    : 'bg-white/5 text-[#D4D4D8] hover:text-white border border-[#22242A]'
                }`}
                style={
                  selectedCategory === cat
                    ? { backgroundColor: primaryColor, color: accentInk }
                    : undefined
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Products List */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-3.5 space-y-3 no-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-[#71717A] space-y-2">
              <ShoppingBag className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">Nessun articolo trovato con i filtri attuali.</p>
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const hasStock = prod.totalStock > 0;
              return (
                <div
                  key={prod.id}
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    isLight
                      ? 'bg-zinc-50 border-[#E4E6EB] hover:bg-[#F6F7F9]/80'
                      : 'bg-[#111215] border-[#22242A] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {prod.brand && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${
                            isLight ? 'text-[#71717A]' : 'text-[#A1A1AA]'
                          }`}
                        >
                          {prod.brand}
                        </span>
                      )}
                      <h4
                        className={`text-sm font-bold leading-tight ${
                          isLight ? 'text-zinc-950' : 'text-white'
                        }`}
                      >
                        {prod.name}
                      </h4>
                      {prod.description && (
                        <p
                          className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                            isLight ? 'text-[#52525B]' : 'text-[#A1A1AA]'
                          }`}
                        >
                          {prod.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm sm:text-base font-extrabold tabular-nums block ${
                          isLight ? 'text-zinc-950' : 'text-white'
                        }`}
                      >
                        {prod.formattedPrice}
                      </span>
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                          hasStock
                            ? isLight
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : isLight
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-red-500/15 text-red-400 border border-red-500/25'
                        }`}
                      >
                        {hasStock ? `${prod.totalStock} disponibili` : 'Esaurito'}
                      </span>
                    </div>
                  </div>

                  {/* Size Matrix Chips with Stock Badges */}
                  {prod.variants && prod.variants.length > 0 && (
                    <div
                      className={`mt-3 pt-2.5 border-t ${
                        isLight ? 'border-[#E4E6EB]' : 'border-[#22242A]'
                      }`}
                    >
                      <span
                        className={`text-[10px] uppercase font-bold block mb-1.5 flex items-center gap-1 ${
                          isLight ? 'text-[#52525B]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        <Tag
                          className="w-3 h-3"
                          style={{ color: isLight ? undefined : '#BFFF00' }}
                        />
                        <span>Taglie e disponibilità in negozio:</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {prod.variants.map((v) => {
                          const isAvailable = v.stock > 0;
                          return (
                            <div
                              key={v.id}
                              className={`px-2 py-1 rounded-lg text-xs font-mono tabular-nums flex items-center gap-1.5 border transition-colors ${
                                isAvailable
                                  ? isLight
                                    ? 'bg-white border-[#D4D4D8] text-[#09090B]'
                                    : 'bg-[#18191E] border-[#22242A] text-[#F4F4F6]'
                                  : isLight
                                  ? 'bg-[#F6F7F9] border-[#E4E6EB] text-[#A1A1AA] line-through opacity-70'
                                  : 'bg-[#111215] border-[#22242A] text-[#71717A] line-through opacity-60'
                              }`}
                            >
                              <span className="font-bold">{v.size || 'Taglia unica'}</span>
                              {v.color && (
                                <span
                                  className={`text-[9px] font-sans ${
                                    isLight ? 'text-[#71717A]' : 'text-[#A1A1AA]'
                                  }`}
                                >
                                  ({v.color})
                                </span>
                              )}
                              <span
                                className={`text-[9px] font-bold px-1 rounded ${
                                  v.stock > 3
                                    ? isLight
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-emerald-500/20 text-emerald-400'
                                    : v.stock > 0
                                    ? isLight
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-amber-500/20 text-amber-400'
                                    : isLight
                                    ? 'text-[#52525B]'
                                    : 'text-[#A1A1AA]'
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
        <div
          className={`p-3 border-t text-center shrink-0 ${
            isLight
              ? 'border-[#E4E6EB] bg-[#F6F7F9] text-[#52525B]'
              : 'border-[#22242A] bg-[#111215] text-[#A1A1AA]'
          }`}
        >
          <p className="text-[11px]">
            Richiedi assistenza al personale di vendita per provare un modello o verificare altre varianti.
          </p>
        </div>
      </div>
    </div>
  );
}

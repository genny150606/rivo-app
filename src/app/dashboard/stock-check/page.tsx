'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RotateCw,
  Package,
  AlertCircle,
  X,
  Tag,
} from 'lucide-react';
import { PageHeader, SurfaceCard, StatusBadge, EmptyState } from '@/components/ui';
import { formatItCurrency } from '@/lib/chart-theme';
import { cn } from '@/lib/cn';

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
    } catch (err: unknown) {
      console.error('Stock check fetch error:', err);
      setError(err instanceof Error ? err.message : 'Errore nel recupero prodotti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category_name) set.add(p.category_name);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category_name !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const inName = p.name.toLowerCase().includes(q);
      const inBrand = (p.brand || '').toLowerCase().includes(q);
      const inSku = (p.sku || '').toLowerCase().includes(q);
      const inVariant = (p.variants || []).some(
        (v) =>
          (v.size || '').toLowerCase().includes(q) ||
          (v.color || '').toLowerCase().includes(q) ||
          (v.barcode || '').toLowerCase().includes(q)
      );
      return inName || inBrand || inSku || inVariant;
    });
  }, [products, query, selectedCategory]);

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-16 min-w-0">
      <PageHeader
        eyebrow="01 // CONTROLLO RAPIDO"
        title="Verifica Taglie Rapida"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Verifica Taglie Rapida' },
        ]}
        badge={
          <StatusBadge tone="volt" variant="soft" dot>
            Staff Live
          </StatusBadge>
        }
        actions={
          <button
            type="button"
            onClick={fetchStock}
            disabled={loading}
            aria-label="Aggiorna giacenze"
            title="Aggiorna giacenze"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCw
              className={cn('w-4 h-4', loading && 'animate-spin text-[var(--rivo-volt-text)]')}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
        }
      />

      {/* Instant Search Bar */}
      <div className="space-y-2.5 sticky top-16 z-10 bg-[var(--bg-canvas)]/95 backdrop-blur-xs py-1">
        <div className="relative">
          <label htmlFor="stock-check-search" className="sr-only">
            Cerca per modello, brand, taglia o barcode
          </label>
          <Search
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <input
            id="stock-check-search"
            name="stock-check-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per modello, brand, taglia o barcode…"
            className="w-full min-h-[48px] pl-10 pr-11 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm font-medium focus:outline-none focus:border-[var(--focus-ring)] transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Cancella ricerca"
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-3 min-h-[40px] sm:min-h-[34px] rounded-lg font-medium whitespace-nowrap transition-colors border cursor-pointer',
                selectedCategory === 'all'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-transparent font-semibold'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              )}
            >
              Tutti ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={cn(
                  'px-3 min-h-[40px] sm:min-h-[34px] rounded-lg font-medium whitespace-nowrap transition-colors border cursor-pointer',
                  selectedCategory === c
                    ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-transparent font-semibold'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Results List */}
      {loading && products.length === 0 ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <SurfaceCard key={i} loading />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nessun articolo corrispondente"
          description="Prova a cercare un nome diverso o azzera i filtri."
          primaryAction={
            query || selectedCategory !== 'all'
              ? {
                  label: 'Azzera filtri',
                  onClick: () => {
                    setQuery('');
                    setSelectedCategory('all');
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((prod) => {
            const hasStock = prod.totalStock > 0;
            return (
              <SurfaceCard key={prod.id} padding="md" className="space-y-3.5">
                {/* Product Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      {prod.brand && (
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                          {prod.brand}
                        </span>
                      )}
                      {prod.sku && (
                        <span className="font-mono text-[10px] text-[var(--text-muted)]" translate="no">
                          SKU: {prod.sku}
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-base font-bold text-[var(--text-primary)] leading-snug">
                      {prod.name}
                    </h2>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span className="font-mono tabular-nums text-sm font-bold text-[var(--text-primary)] block">
                      {formatItCurrency(Number(prod.sale_price))}
                    </span>
                    <StatusBadge tone={hasStock ? 'operational' : 'critical'} size="sm">
                      {hasStock ? `${prod.totalStock} pz in negozio` : 'Esaurito'}
                    </StatusBadge>
                  </div>
                </div>

                {/* Instant Size & Stock Matrix */}
                <div>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                    <span>Disponibilità taglie in magazzino:</span>
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {prod.variants.map((v) => {
                      const qty = v.stock;
                      const isAvailable = qty > 0;
                      const isLow = qty > 0 && qty <= 2;

                      return (
                        <div
                          key={v.id}
                          className={cn(
                            'p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors',
                            isAvailable
                              ? isLow
                                ? 'bg-[var(--accent-warning-bg)] border-[var(--accent-warning-border)]'
                                : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]'
                              : 'bg-[var(--bg-subtle)]/50 border-[var(--border-subtle)] opacity-55'
                          )}
                        >
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-[var(--text-primary)] block font-mono tabular-nums">
                              {v.size || 'Unica'}
                            </span>
                            {v.color && (
                              <span className="text-[11px] text-[var(--text-secondary)] block truncate">
                                {v.color}
                              </span>
                            )}
                          </div>

                          <StatusBadge
                            tone={isAvailable ? (isLow ? 'warning' : 'operational') : 'neutral'}
                            size="sm"
                          >
                            {qty} pz
                          </StatusBadge>
                        </div>
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
  );
}

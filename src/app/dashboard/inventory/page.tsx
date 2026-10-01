'use client';

import { useState, useEffect } from 'react';
import { 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  AlertTriangle, 
  Search, 
  Plus, 
  Loader2, 
  AlertCircle,
  X,
  History,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface Movement {
  id: string;
  type: 'in' | 'out' | 'adjustment' | 'initial';
  quantity_delta: number;
  reason: string | null;
  reference: string | null;
  created_at: string;
  variant: {
    id: string;
    size: string | null;
    color: string | null;
    barcode: string | null;
    reorder_threshold: number;
    product: {
      id: string;
      name: string;
      brand: string | null;
      sku: string | null;
    } | null;
  } | null;
}

interface Balance {
  id: string;
  variant_id: string;
  quantity_on_hand: number;
  updated_at: string;
  variant: {
    id: string;
    size: string | null;
    color: string | null;
    barcode: string | null;
    reorder_threshold: number;
    product: {
      id: string;
      name: string;
      brand: string | null;
      sku: string | null;
      sale_price: number;
    } | null;
  } | null;
}

export default function InventoryPage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances');

  // Movement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form state
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/inventory/movements');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore nel recupero inventario');
      }
      setBalances(data.balances || []);
      setMovements(data.movements || []);
    } catch (err: any) {
      console.error('Fetch inventory error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) {
      setModalError('Seleziona un articolo o variante');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setModalError('Inserisci una quantità valida maggiore di zero');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: selectedVariantId,
          type: movementType,
          quantity_delta: qty,
          reason: reason.trim() || null,
          reference: reference.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la registrazione');
      }

      setIsModalOpen(false);
      setSelectedVariantId('');
      setQuantity('');
      setReason('');
      setReference('');
      fetchInventory();
    } catch (err: any) {
      console.error('Record movement error:', err);
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredBalances = balances.filter(b => {
    const q = searchQuery.toLowerCase();
    const prodName = b.variant?.product?.name?.toLowerCase() || '';
    const brand = b.variant?.product?.brand?.toLowerCase() || '';
    const size = b.variant?.size?.toLowerCase() || '';
    return prodName.includes(q) || brand.includes(q) || size.includes(q);
  });

  const lowStockCount = balances.filter(
    b => b.quantity_on_hand <= (b.variant?.reorder_threshold ?? 3)
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            <Boxes className="w-3.5 h-3.5 text-[#bfff00]" />
            <span>Stock & Warehouse</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Magazzino & Scorte
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Controllo giacenze in tempo reale, carichi di merce, vendite e movimenti di magazzino.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-[#bfff00] text-black px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a8e600] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Registra Movimento</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-zinc-500 font-medium">Totale Articoli in Stock</span>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white font-mono mt-1">
            {balances.reduce((acc, b) => acc + (b.quantity_on_hand || 0), 0)} pz
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-zinc-500 font-medium">Varianti a Catalogo</span>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white font-mono mt-1">
            {balances.length}
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-zinc-500 font-medium">Sotto Soglia Riordino</span>
          <div className={`text-2xl font-bold font-mono mt-1 ${lowStockCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {lowStockCount} varianti
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'balances'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Giacenze Attuali ({balances.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'movements'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Storico Movimenti ({movements.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Cerca per modello, taglia o brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content based on Tab */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#bfff00]" />
          <span className="text-sm">Caricamento inventario...</span>
        </div>
      ) : activeTab === 'balances' ? (
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Articolo / Modello</th>
                  <th className="px-4 py-3">Taglia</th>
                  <th className="px-4 py-3">Colore</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3 text-right">Giacenza</th>
                  <th className="px-4 py-3 text-right">Soglia Min.</th>
                  <th className="px-4 py-3 text-center">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                      Nessuna giacenza registrata.
                    </td>
                  </tr>
                ) : (
                  filteredBalances.map((b) => {
                    const isLow = b.quantity_on_hand <= (b.variant?.reorder_threshold ?? 3);
                    return (
                      <tr key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-white">
                          <div>{b.variant?.product?.name || 'N/D'}</div>
                          {b.variant?.product?.brand && (
                            <span className="text-[10px] text-zinc-400 block font-normal uppercase">
                              {b.variant.product.brand}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono">{b.variant?.size || '-'}</td>
                        <td className="px-4 py-3 text-zinc-500">{b.variant?.color || '-'}</td>
                        <td className="px-4 py-3 font-mono text-zinc-400">{b.variant?.barcode || '-'}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-sm text-zinc-950 dark:text-white">
                          {b.quantity_on_hand}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-500">
                          {b.variant?.reorder_threshold ?? 3}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3" /> Sotto scorta
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Disponibile
                            </span>
                          )}
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
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Articolo</th>
                  <th className="px-4 py-3">Taglia / Colore</th>
                  <th className="px-4 py-3 text-right">Delta</th>
                  <th className="px-4 py-3">Causale</th>
                  <th className="px-4 py-3">Riferimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                      Nessun movimento registrato.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {m.type === 'in' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                            <ArrowDownLeft className="w-3.5 h-3.5" /> Carico Merce
                          </span>
                        ) : m.type === 'out' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Scarico / Vendita
                          </span>
                        ) : m.type === 'initial' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500">
                            Iniziale
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                            Rettifica
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-white">
                        {m.variant?.product?.name || 'Articolo'}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {m.variant?.size ? `Taglia ${m.variant.size}` : ''} {m.variant?.color ? `• ${m.variant.color}` : ''}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${
                        m.quantity_delta > 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{m.reason || '-'}</td>
                      <td className="px-4 py-3 text-zinc-400 font-mono">{m.reference || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[#bfff00]" />
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Registra Movimento</h2>
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

            <form onSubmit={handleRecordMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Articolo / Variante *
                </label>
                <select
                  required
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                >
                  <option value="">Seleziona variante...</option>
                  {balances.map((b) => (
                    <option key={b.variant_id} value={b.variant_id}>
                      {b.variant?.product?.name} ({b.variant?.product?.brand}) - Taglia {b.variant?.size || 'U'} {b.variant?.color || ''} [Giacenza: {b.quantity_on_hand}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tipo Operazione
                  </label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  >
                    <option value="in">Carico Merce (+)</option>
                    <option value="out">Scarico / Vendita (-)</option>
                    <option value="adjustment">Rettifica Inventario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Quantità *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Causale Movimento
                </label>
                <input
                  type="text"
                  placeholder="es. Arrivo fornitore, Vendita banco, Reso cliente..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Riferimento DDT / Documento (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="es. DDT-2026-88"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#bfff00]"
                />
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
                  <span>Registra Movimento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

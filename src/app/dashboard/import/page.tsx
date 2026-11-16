'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Download,
  ShoppingBag,
  Boxes,
  Store,
  Check,
  X,
} from 'lucide-react';
import { ColumnMapping } from '@/platform/import/parser';
import { ValidatedImportItem } from '@/platform/import/validator';
import { PageHeader, SurfaceCard, StatusBadge, KpiCard } from '@/components/ui';
import { formatItCurrency } from '@/lib/chart-theme';
import { cn } from '@/lib/cn';

export default function CatalogImportPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview Data
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    sale_price: '',
  });
  const [rawRows, setRawRows] = useState<unknown[]>([]);
  const [previewItems, setPreviewItems] = useState<ValidatedImportItem[]>([]);
  const [validRowsCount, setValidRowsCount] = useState(0);
  const [errorRowsCount, setErrorRowsCount] = useState(0);

  // Commit / Result Data
  const [importSummary, setImportSummary] = useState<{
    imported_products: number;
    imported_variants: number;
    initial_stock_units: number;
    errors_count: number;
    errors: string[];
  } | null>(null);

  // Step 1: Upload File and Preview
  const handleFileUpload = async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/import/catalog', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore elaborazione file');

      setHeaders(data.headers || []);
      setRawRows(data.raw_rows || []);
      setMapping({
        name: data.auto_mapping?.name || data.headers?.[0] || '',
        brand: data.auto_mapping?.brand || '',
        category: data.auto_mapping?.category || '',
        sku: data.auto_mapping?.sku || '',
        barcode: data.auto_mapping?.barcode || '',
        sale_price: data.auto_mapping?.sale_price || '',
        cost_price: data.auto_mapping?.cost_price || '',
        size: data.auto_mapping?.size || '',
        color: data.auto_mapping?.color || '',
        stock: data.auto_mapping?.stock || '',
        tax_rate: data.auto_mapping?.tax_rate || '',
      });
      setPreviewItems(data.preview_items || []);
      setValidRowsCount(data.valid_rows || 0);
      setErrorRowsCount(data.error_rows || 0);

      setStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore upload file';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> 3: Re-validate with chosen mappings
  const handleProceedToPreview = () => {
    if (!mapping.name || !mapping.sale_price) {
      setError('I campi Nome Prodotto e Prezzo di Vendita sono obbligatori.');
      return;
    }
    setError(null);
    setStep(3);
  };

  // Step 3 -> 4: Commit Batch Import
  const handleExecuteImport = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/import/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'commit',
          items: previewItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore importazione batch');

      setImportSummary(data.summary);
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore esecuzione importazione';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Download Sample Template CSV
  const handleDownloadSampleCSV = () => {
    const csvContent = [
      'Nome Articolo,Brand,Categoria,Codice SKU,Barcode EAN,Taglia,Colore,Prezzo Vendita,Prezzo Costo,Giacenza Iniziale,Aliquota IVA',
      'Nike Air Max 95,Nike,Sneakers,NIK-AM95-42,8012345678901,42,Black,179.90,85.00,6,22',
      'Nike Air Max 95,Nike,Sneakers,NIK-AM95-43,8012345678902,43,Black,179.90,85.00,8,22',
      'Borsa a Spalla Pelle,Borrelli,Borse,BOR-BAG-01,8012345678903,Unica,Cognac,140.00,60.00,4,22',
      'Mocassino Artigianale,Borrelli,Calzature Classiche,BOR-MOC-41,8012345678904,41,Marrone,125.00,52.00,5,22',
      'Cintura Reversibile Cuoio,Borrelli,Accessori,BOR-BLT-110,8012345678905,110cm,Nero/Marrone,45.00,18.00,10,22',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'RIVO_Modello_Import_Catalogo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 min-w-0">
      <PageHeader
        eyebrow="03 // CATALOG MIGRATION ENGINE"
        title="Importazione Catalogo & Scorte"
        description="Migra i prodotti, varianti taglia/colore e giacenze dal tuo gestionale precedente in pochi clic."
        actions={
          <button
            type="button"
            onClick={handleDownloadSampleCSV}
            className="inline-flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-3.5 min-h-[40px] max-sm:min-h-[44px] rounded-lg text-xs font-semibold hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.75} aria-hidden="true" />
            <span>Scarica File Esempio CSV</span>
          </button>
        }
      />

      {/* Stepper Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {[
          { num: 1, label: 'Carica File' },
          { num: 2, label: 'Mappa Colonne' },
          { num: 3, label: 'Verifica & Anteprima' },
          { num: 4, label: 'Importazione Conclusa' },
        ].map((s) => (
          <div
            key={s.num}
            className={cn(
              'p-3 rounded-xl border flex items-center gap-2.5 transition-colors',
              step === s.num
                ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-transparent font-bold'
                : step > s.num
                ? 'bg-[var(--rivo-volt-bg)] text-[var(--rivo-volt-text)] border-[var(--rivo-volt-border)] font-semibold'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)]'
            )}
          >
            <span
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center font-mono tabular-nums text-[10px] font-bold shrink-0',
                step > s.num
                  ? 'bg-[var(--rivo-volt)] text-[#09090B]'
                  : step === s.num
                  ? 'bg-[var(--bg-canvas)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
              )}
            >
              {step > s.num ? '✓' : s.num}
            </span>
            <span className="truncate">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD FILE */}
      {step === 1 && (
        <SurfaceCard padding="lg" className="space-y-6 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] text-[var(--rivo-volt-text)] flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
              Carica il tuo catalogo prodotti
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Formati supportati: Excel (
              <span className="font-mono font-semibold text-[var(--text-primary)]">.xlsx</span>,{' '}
              <span className="font-mono font-semibold text-[var(--text-primary)]">.xls</span>)
              oppure file di testo{' '}
              <span className="font-mono font-semibold text-[var(--text-primary)]">.csv</span>{' '}
              esportato da Zucchetti, Danea, TeamSystem o fogli di calcolo.
            </p>
          </div>

          <label className="block border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--rivo-volt-text)] rounded-2xl p-8 cursor-pointer transition-colors max-w-lg mx-auto bg-[var(--bg-elevated)]/40">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--rivo-volt-text)]" aria-hidden="true" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Analisi del file in corso…
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-6 h-6 text-[var(--text-muted)] mx-auto" strokeWidth={1.75} aria-hidden="true" />
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  Trascina qui il file oppure clicca per selezionarlo
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Verranno analizzate automaticamente le intestazioni delle colonne
                </div>
              </div>
            )}
          </label>
        </SurfaceCard>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {step === 2 && (
        <SurfaceCard padding="lg" className="space-y-6">
          <div>
            <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
              Mappatura delle Colonne del File
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Abbiamo rilevato automaticamente i campi. Verifica o modifica l&apos;associazione con
              le colonne del tuo file caricato (
              <span className="font-mono text-[var(--text-primary)]">{file?.name}</span>,{' '}
              <span className="font-mono tabular-nums">{rawRows.length}</span> righe trovate).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Mandatory Fields */}
            <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--rivo-volt-text)] block">
                Campi Obbligatori
              </span>

              <div>
                <label
                  htmlFor="map-name"
                  className="block font-semibold text-[var(--text-primary)] mb-1"
                >
                  Nome / Descrizione Prodotto *
                </label>
                <select
                  id="map-name"
                  value={mapping.name}
                  onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                  className="w-full min-h-[40px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)]"
                >
                  <option value="">Seleziona colonna…</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="map-sale-price"
                  className="block font-semibold text-[var(--text-primary)] mb-1"
                >
                  Prezzo di Vendita (€) *
                </label>
                <select
                  id="map-sale-price"
                  value={mapping.sale_price}
                  onChange={(e) => setMapping({ ...mapping, sale_price: e.target.value })}
                  className="w-full min-h-[40px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)]"
                >
                  <option value="">Seleziona colonna…</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Fashion & Footwear Fields */}
            <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Varianti Retail & Magazzino
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="map-size"
                    className="block font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Taglia / Misura
                  </label>
                  <select
                    id="map-size"
                    value={mapping.size || ''}
                    onChange={(e) => setMapping({ ...mapping, size: e.target.value })}
                    className="w-full min-h-[40px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="">Non presente</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="map-color"
                    className="block font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Colore
                  </label>
                  <select
                    id="map-color"
                    value={mapping.color || ''}
                    onChange={(e) => setMapping({ ...mapping, color: e.target.value })}
                    className="w-full min-h-[40px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="">Non presente</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="map-stock"
                    className="block font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Giacenza Iniziale (Stock)
                  </label>
                  <select
                    id="map-stock"
                    value={mapping.stock || ''}
                    onChange={(e) => setMapping({ ...mapping, stock: e.target.value })}
                    className="w-full min-h-[40px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="">Nessuno (Stock a 0)</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="map-cost"
                    className="block font-semibold text-[var(--text-secondary)] mb-1"
                  >
                    Prezzo di Costo (€)
                  </label>
                  <select
                    id="map-cost"
                    value={mapping.cost_price || ''}
                    onChange={(e) => setMapping({ ...mapping, cost_price: e.target.value })}
                    className="w-full min-h-[40px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="">Non specificato</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Categorization & Identifiers */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <div>
                <label
                  htmlFor="map-brand"
                  className="block font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Marca / Brand
                </label>
                <select
                  id="map-brand"
                  value={mapping.brand || ''}
                  onChange={(e) => setMapping({ ...mapping, brand: e.target.value })}
                  className="w-full min-h-[40px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                >
                  <option value="">Non presente</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="map-category"
                  className="block font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Categoria
                </label>
                <select
                  id="map-category"
                  value={mapping.category || ''}
                  onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
                  className="w-full min-h-[40px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                >
                  <option value="">Non presente</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="map-sku"
                  className="block font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Codice SKU
                </label>
                <select
                  id="map-sku"
                  value={mapping.sku || ''}
                  onChange={(e) => setMapping({ ...mapping, sku: e.target.value })}
                  className="w-full min-h-[40px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                >
                  <option value="">Non presente</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="map-barcode"
                  className="block font-semibold text-[var(--text-secondary)] mb-1"
                >
                  Barcode EAN
                </label>
                <select
                  id="map-barcode"
                  value={mapping.barcode || ''}
                  onChange={(e) => setMapping({ ...mapping, barcode: e.target.value })}
                  className="w-full min-h-[40px] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                >
                  <option value="">Non presente</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 min-h-[40px] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Scegli un altro file</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToPreview}
              className="inline-flex items-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-5 min-h-[40px] rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Continua all&apos;Anteprima</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </SurfaceCard>
      )}

      {/* STEP 3: PREVIEW & VERIFICATION */}
      {step === 3 && (
        <SurfaceCard padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                Anteprima e Validazione Righe
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Verifica come verranno creati i prodotti e le varianti prima di eseguire
                l&apos;importazione definitiva.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <StatusBadge tone="operational" size="md">
                {validRowsCount} righe pronte
              </StatusBadge>
              {errorRowsCount > 0 && (
                <StatusBadge tone="critical" size="md">
                  {errorRowsCount} errori da correggere
                </StatusBadge>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px] font-semibold uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5">Stato</th>
                    <th className="px-3 py-2.5">Prodotto</th>
                    <th className="px-3 py-2.5">Brand</th>
                    <th className="px-3 py-2.5">Taglia/Colore</th>
                    <th className="px-3 py-2.5 text-right">Prezzo Vendita</th>
                    <th className="px-3 py-2.5 text-right">Giacenza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {previewItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                      <td className="px-3 py-2.5">
                        {item.status === 'valid' ? (
                          <StatusBadge tone="operational" icon={Check} size="sm">
                            OK
                          </StatusBadge>
                        ) : (
                          <span title={item.errors.join(', ')}>
                            <StatusBadge tone="critical" icon={X} size="sm">
                              Errore
                            </StatusBadge>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">
                        {item.product_name || '<Nome mancante>'}
                      </td>
                      <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                        {item.brand_name || '—'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[var(--text-secondary)]">
                        {item.size ? `Tg. ${item.size}` : ''}{' '}
                        {item.color ? `• ${item.color}` : ''}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-[var(--text-primary)]">
                        {formatItCurrency(item.sale_price)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--rivo-volt-text)] font-bold">
                        {item.stock} pz
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 min-h-[40px] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Modifica mappatura</span>
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={loading || validRowsCount === 0}
              className="inline-flex items-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-6 min-h-[44px] rounded-lg text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              )}
              <span>Conferma & Importa {validRowsCount} Articoli</span>
            </button>
          </div>
        </SurfaceCard>
      )}

      {/* STEP 4: IMPORT COMPLETED REPORT */}
      {step === 4 && importSummary && (
        <SurfaceCard padding="lg" className="space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" strokeWidth={1.75} aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              Importazione Completata con Successo!
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Il catalogo prodotti, le varianti e le giacenze iniziali di magazzino sono ora attivi
              sul tuo tenant.
            </p>
          </div>

          {/* Stat Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
            <KpiCard label="Prodotti Creati" value={importSummary.imported_products} />
            <KpiCard label="Varianti Taglia/Colore" value={importSummary.imported_variants} />
            <KpiCard
              label="Pezzi Caricati"
              value={`${importSummary.initial_stock_units} pz`}
              tone="volt"
            />
          </div>

          {/* Quick Action Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Link
              href="/dashboard/products"
              className="inline-flex items-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-4 min-h-[44px] rounded-lg text-xs font-semibold transition-colors"
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Vai al Catalogo Prodotti</span>
            </Link>

            <Link
              href="/dashboard/inventory"
              className="inline-flex items-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-4 min-h-[44px] rounded-lg text-xs font-semibold transition-colors"
            >
              <Boxes className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Verifica Scorte di Magazzino</span>
            </Link>

            <Link
              href="/dashboard/sales"
              className="inline-flex items-center gap-2 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] px-5 min-h-[44px] rounded-lg text-xs font-bold transition-colors"
            >
              <Store className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Apri Punto Cassa POS</span>
            </Link>
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}

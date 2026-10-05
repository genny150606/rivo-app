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
  Sparkles,
  Layers,
  Table,
  Check,
  X
} from 'lucide-react';
import { ColumnMapping } from '@/platform/import/parser';
import { ValidatedImportItem } from '@/platform/import/validator';

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
  const [rawRows, setRawRows] = useState<any[]>([]);
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
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            <Upload className="w-3.5 h-3.5 text-lime-500 dark:text-[#bfff00]" />
            <span>Catalog Migration Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Importazione Catalogo & Scorte
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Migra i prodotti, varianti taglia/colore e giacenze dal tuo gestionale precedente in pochi clic.
          </p>
        </div>

        <button
          onClick={handleDownloadSampleCSV}
          className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
        >
          <Download className="w-4 h-4 text-zinc-500" />
          <span>Scarica File Esempio CSV</span>
        </button>
      </div>

      {/* Stepper Indicator */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {[
          { num: 1, label: 'Carica File' },
          { num: 2, label: 'Mappa Colonne' },
          { num: 3, label: 'Verifica & Anteprima' },
          { num: 4, label: 'Importazione Conclusa' },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
              step === s.num
                ? 'bg-zinc-950 dark:bg-white text-white dark:text-black border-transparent shadow-xs font-bold'
                : step > s.num
                ? 'bg-lime-500/10 text-lime-600 dark:text-[#bfff00] border-lime-500/20 font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step > s.num ? 'bg-[#bfff00] text-black' : 'bg-current text-white dark:text-black opacity-30'
            }`}>
              {step > s.num ? '✓' : s.num}
            </span>
            <span className="truncate">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD FILE */}
      {step === 1 && (
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xs space-y-6 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-lime-500/10 text-lime-600 dark:text-[#bfff00] flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              Carica il tuo catalogo prodotti
            </h2>
            <p className="text-xs text-zinc-500">
              Formati supportati: Excel (<span className="font-mono font-bold">.xlsx</span>, <span className="font-mono font-bold">.xls</span>) oppure file di testo <span className="font-mono font-bold">.csv</span> esportato da Zucchetti, Danea, TeamSystem o fogli di calcolo.
            </p>
          </div>

          <label className="block border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#bfff00] dark:hover:border-[#bfff00] rounded-2xl p-8 cursor-pointer transition-colors max-w-lg mx-auto">
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
                <Loader2 className="w-6 h-6 animate-spin text-[#bfff00]" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Analisi del file in corso...
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-6 h-6 text-zinc-400 mx-auto" />
                <div className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Trascina qui il file oppure clicca per selezionarlo
                </div>
                <div className="text-[11px] text-zinc-400">
                  Verranno analizzate automaticamente le intestazioni delle colonne
                </div>
              </div>
            )}
          </label>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {step === 2 && (
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-zinc-950 dark:text-white">
              Mappatura delle Colonne del File
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Abbiamo rilevato automaticamente i campi. Verifica o modifica l&apos;associazione con le colonne del tuo file caricato (<span className="font-mono text-zinc-300">{file?.name}</span>, {rawRows.length} righe trovate).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Mandatory Fields */}
            <div className="space-y-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lime-600 dark:text-[#bfff00] block">
                Campi Obbligatori
              </span>

              <div>
                <label className="block font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  Nome / Descrizione Prodotto *
                </label>
                <select
                  value={mapping.name}
                  onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white"
                >
                  <option value="">Seleziona colonna...</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  Prezzo di Vendita (€) *
                </label>
                <select
                  value={mapping.sale_price}
                  onChange={(e) => setMapping({ ...mapping, sale_price: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white"
                >
                  <option value="">Seleziona colonna...</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Fashion & Footwear Fields */}
            <div className="space-y-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Varianti Retail & Magazzino
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Taglia / Misura
                  </label>
                  <select
                    value={mapping.size || ''}
                    onChange={(e) => setMapping({ ...mapping, size: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white"
                  >
                    <option value="">Non presente</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Colore
                  </label>
                  <select
                    value={mapping.color || ''}
                    onChange={(e) => setMapping({ ...mapping, color: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white"
                  >
                    <option value="">Non presente</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Giacenza Iniziale (Stock)
                  </label>
                  <select
                    value={mapping.stock || ''}
                    onChange={(e) => setMapping({ ...mapping, stock: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white"
                  >
                    <option value="">Nessuno (Stock a 0)</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Prezzo di Costo (€)
                  </label>
                  <select
                    value={mapping.cost_price || ''}
                    onChange={(e) => setMapping({ ...mapping, cost_price: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white"
                  >
                    <option value="">Non specificato</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Categorization & Identifiers */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Marca / Brand
                </label>
                <select
                  value={mapping.brand || ''}
                  onChange={(e) => setMapping({ ...mapping, brand: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white"
                >
                  <option value="">Non presente</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Categoria
                </label>
                <select
                  value={mapping.category || ''}
                  onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white"
                >
                  <option value="">Non presente</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Codice SKU
                </label>
                <select
                  value={mapping.sku || ''}
                  onChange={(e) => setMapping({ ...mapping, sku: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white"
                >
                  <option value="">Non presente</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Barcode EAN
                </label>
                <select
                  value={mapping.barcode || ''}
                  onChange={(e) => setMapping({ ...mapping, barcode: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white"
                >
                  <option value="">Non presente</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Scegli un altro file</span>
            </button>

            <button
              onClick={handleProceedToPreview}
              className="inline-flex items-center gap-2 bg-[#bfff00] text-black px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#a8e600] transition-colors shadow-sm"
            >
              <span>Continua all&apos;Anteprima</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & VERIFICATION */}
      {step === 3 && (
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                Anteprima e Validazione Righe
              </h2>
              <p className="text-xs text-zinc-500">
                Verifica come verranno creati i prodotti e le varianti prima di eseguire l&apos;importazione definitiva.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                {validRowsCount} righe pronte
              </span>
              {errorRowsCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20">
                  {errorRowsCount} errori da correggere
                </span>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-3 py-2">Stato</th>
                  <th className="px-3 py-2">Prodotto</th>
                  <th className="px-3 py-2">Brand</th>
                  <th className="px-3 py-2">Taglia/Colore</th>
                  <th className="px-3 py-2 text-right">Prezzo Vendita</th>
                  <th className="px-3 py-2 text-right">Giacenza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                {previewItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                    <td className="px-3 py-2">
                      {item.status === 'valid' ? (
                        <span className="inline-flex items-center text-emerald-500 font-semibold gap-1 text-[11px]">
                          <Check className="w-3.5 h-3.5" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-500 font-semibold gap-1 text-[11px]" title={item.errors.join(', ')}>
                          <X className="w-3.5 h-3.5" /> Errore
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-semibold text-zinc-950 dark:text-white">
                      {item.product_name || '<Nome mancante>'}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {item.brand_name || '-'}
                    </td>
                    <td className="px-3 py-2 font-mono text-zinc-400">
                      {item.size ? `Tg. ${item.size}` : ''} {item.color ? `• ${item.color}` : ''}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-zinc-950 dark:text-white">
                      € {item.sale_price.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-lime-600 dark:text-[#bfff00] font-bold">
                      {item.stock} pz
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Modifica mappatura</span>
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={loading || validRowsCount === 0}
              className="inline-flex items-center gap-2 bg-[#bfff00] text-black px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#a8e600] disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Conferma & Importa {validRowsCount} Articoli</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: IMPORT COMPLETED REPORT */}
      {step === 4 && importSummary && (
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xs space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              Importazione Completata con Successo!
            </h2>
            <p className="text-xs text-zinc-500">
              Il catalogo prodotti, le varianti e le giacenze iniziali di magazzino sono ora attivi sul tuo tenant.
            </p>
          </div>

          {/* Stat Pills */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Prodotti Creati</span>
              <span className="text-xl font-bold font-mono text-zinc-950 dark:text-white">
                {importSummary.imported_products}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Varianti Taglia/Colore</span>
              <span className="text-xl font-bold font-mono text-zinc-950 dark:text-white">
                {importSummary.imported_variants}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Pezzi Caricati</span>
              <span className="text-xl font-bold font-mono text-lime-600 dark:text-[#bfff00]">
                {importSummary.initial_stock_units} pz
              </span>
            </div>
          </div>

          {/* Quick Action Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link
              href="/dashboard/products"
              className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Vai al Catalogo Prodotti</span>
            </Link>

            <Link
              href="/dashboard/inventory"
              className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
            >
              <Boxes className="w-4 h-4" />
              <span>Verifica Scorte di Magazzino</span>
            </Link>

            <Link
              href="/dashboard/sales"
              className="inline-flex items-center gap-2 bg-[#bfff00] hover:bg-[#a8e600] text-black px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Store className="w-4 h-4" />
              <span>Apri Punto Cassa POS</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

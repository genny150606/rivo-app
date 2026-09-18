'use client';

import { useState, useId, useMemo, useEffect, ChangeEvent, FormEvent } from 'react';
import { 
  Receipt, 
  CreditCard, 
  Banknote, 
  Users, 
  Building2, 
  FileText, 
  CheckCircle2, 
  X, 
  Send, 
  QrCode, 
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Clock,
  Coins,
  ArrowRight,
  Check,
  Wifi
} from 'lucide-react';
import { 
  BillRequestStatus, 
  PaymentMethodIntent, 
  BillRequestInvoiceData 
} from '@/lib/types/smart-bill';
import { parseAdeQrCode } from '@/lib/invoice-helpers';

interface SmartBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  deviceId?: string | null;
  tableLabel: string;
  estimatedTotal?: string | null;
  onSuccess?: (details: { status: BillRequestStatus; intent: PaymentMethodIntent }) => void;
}

// Ultra-safe haptic execution to guarantee 0 TypeErrors on iOS WebKit
function safeHaptic(pattern: number | number[] = 15): void {
  try {
    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function'
    ) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Graceful no-op on non-supporting devices or restricted iframes
  }
}

const CASH_BANKNOTE_PRESETS = [10, 20, 50, 100];

export default function SmartBillModal({
  isOpen,
  onClose,
  organizationId,
  deviceId,
  tableLabel,
  estimatedTotal,
  onSuccess,
}: SmartBillModalProps) {
  const fileInputId = useId();

  // State: Payment Method & Intent
  const [mainMethod, setMainMethod] = useState<'pos' | 'cash'>('pos');
  const [posVariant, setPosVariant] = useState<'contactless' | 'traditional'>('contactless');
  
  // Cash details
  const [isExactCash, setIsExactCash] = useState<boolean>(false);
  const [selectedBanknote, setSelectedBanknote] = useState<number>(50);
  const [customBanknoteInput, setCustomBanknoteInput] = useState<string>('');

  // Total & Split
  const [customTotal, setCustomTotal] = useState<string>(
    estimatedTotal ? estimatedTotal.replace(/[^0-9.,]/g, '').replace(',', '.') : ''
  );
  const [splitCount, setSplitCount] = useState<number>(1);

  // Electronic Invoice
  const [wantsInvoice, setWantsInvoice] = useState<boolean>(false);
  const [invoiceData, setInvoiceData] = useState<BillRequestInvoiceData>({
    companyName: '',
    vatNumber: '',
    sdiCode: '0000000',
    pec: '',
    address: '',
  });
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [qrRawText, setQrRawText] = useState<string>('');

  // Lifecycle & Anti-Spam Rate Limit
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Check existing table cooldown in sessionStorage to prevent accidental spam
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `rivo_bill_cooldown_${organizationId}_${tableLabel}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const expiresAt = parseInt(stored, 10);
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      if (remaining > 0) {
        setCooldownRemaining(remaining);
      }
    }
  }, [isOpen, organizationId, tableLabel]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  // Calculations
  const numericTotal = useMemo(() => {
    return parseFloat(customTotal.replace(',', '.')) || 0;
  }, [customTotal]);

  const splitQuota = useMemo(() => {
    if (numericTotal > 0 && splitCount > 0) {
      return (numericTotal / splitCount).toFixed(2) + ' €';
    }
    return null;
  }, [numericTotal, splitCount]);

  // Active banknote calculation
  const effectiveBanknote = useMemo(() => {
    if (isExactCash) return numericTotal;
    if (customBanknoteInput.trim()) {
      return parseFloat(customBanknoteInput.replace(',', '.')) || 0;
    }
    return selectedBanknote;
  }, [isExactCash, numericTotal, customBanknoteInput, selectedBanknote]);

  const changeDue = useMemo(() => {
    if (mainMethod !== 'cash' || isExactCash) return 0;
    if (effectiveBanknote > numericTotal && numericTotal > 0) {
      return Number((effectiveBanknote - numericTotal).toFixed(2));
    }
    return 0;
  }, [mainMethod, isExactCash, effectiveBanknote, numericTotal]);

  const computedIntent = useMemo<PaymentMethodIntent>(() => {
    if (mainMethod === 'pos') {
      return posVariant === 'contactless' ? 'pos_contactless' : 'pos_traditional';
    }
    return isExactCash ? 'cash_exact' : 'cash_needs_change';
  }, [mainMethod, posVariant, isExactCash]);

  if (!isOpen) return null;

  const handleAdjustSplit = (delta: number) => {
    safeHaptic(10);
    setSplitCount((prev) => Math.max(1, Math.min(20, prev + delta)));
  };

  const handleQrTextApply = () => {
    safeHaptic([15, 30]);
    if (!qrRawText.trim()) return;
    const parsed = parseAdeQrCode(qrRawText);
    setInvoiceData((prev) => ({
      ...prev,
      companyName: parsed.companyName || prev.companyName,
      vatNumber: parsed.vatNumber || prev.vatNumber,
      sdiCode: parsed.sdiCode || prev.sdiCode,
      pec: parsed.pec || prev.pec,
      address: parsed.address || prev.address,
    }));
    setQrModalOpen(false);
    setQrRawText('');
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    safeHaptic(15);

    if (file.type.includes('text') || file.type.includes('xml') || file.name.endsWith('.xml')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const parsed = parseAdeQrCode(text);
          setInvoiceData((prev) => ({
            ...prev,
            companyName: parsed.companyName || prev.companyName,
            vatNumber: parsed.vatNumber || prev.vatNumber,
            sdiCode: parsed.sdiCode || prev.sdiCode,
            pec: parsed.pec || prev.pec,
            address: parsed.address || prev.address,
          }));
          safeHaptic([20, 40]);
        }
      };
      reader.readAsText(file);
    } else {
      setQrModalOpen(true);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (cooldownRemaining > 0) {
      setErrorMsg(`Richiesta già inviata per questo tavolo. Attendi ${cooldownRemaining}s prima di sollecitare.`);
      safeHaptic([30, 60]);
      return;
    }

    if (mainMethod === 'cash' && !isExactCash && effectiveBanknote < numericTotal && numericTotal > 0) {
      setErrorMsg(`La banconota selezionata (${effectiveBanknote}€) è inferiore al totale (${numericTotal}€).`);
      safeHaptic([30, 60]);
      return;
    }

    if (wantsInvoice) {
      if (!invoiceData.companyName.trim()) {
        setErrorMsg('Inserisci la Ragione Sociale o Nome Azienda per la fattura.');
        safeHaptic([30, 60]);
        return;
      }
      if (!invoiceData.vatNumber.trim()) {
        setErrorMsg('Inserisci la Partita IVA o Codice Fiscale per la fattura.');
        safeHaptic([30, 60]);
        return;
      }
    }

    setSubmitting(true);
    safeHaptic(20);

    try {
      // Direct submission to the atomic bill request API
      const res = await fetch('/api/bill-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          device_id: deviceId || null,
          table_label: tableLabel || 'Tavolo',
          payment_method_intent: computedIntent,
          total_amount: numericTotal,
          banknote_denomination: mainMethod === 'cash' && !isExactCash ? effectiveBanknote : null,
          split_count: splitCount,
          invoice_data: wantsInvoice ? {
            companyName: invoiceData.companyName.trim(),
            vatNumber: invoiceData.vatNumber.trim().toUpperCase(),
            sdiCode: (invoiceData.sdiCode.trim() || '0000000').toUpperCase(),
            pec: invoiceData.pec?.trim() || '',
            address: invoiceData.address?.trim() || '',
          } : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Concurrency lock conflict: another guest already requested the bill
        if (res.status === 409) {
          throw new Error('Un commensale al tuo tavolo ha già chiamato il conto! Il personale sta arrivando.');
        }
        throw new Error(data.error || 'Impossibile inviare la richiesta del conto.');
      }

      // Set 90 seconds anti-spam cooldown lock in sessionStorage
      const expiresAt = Date.now() + 90 * 1000;
      sessionStorage.setItem(`rivo_bill_cooldown_${organizationId}_${tableLabel}`, expiresAt.toString());
      setCooldownRemaining(90);

      safeHaptic([20, 50, 30]);
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess({ status: 'bill_requested', intent: computedIntent });
      }

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore di connessione.';
      setErrorMsg(msg);
      safeHaptic([40, 80]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-[#121214] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-white my-auto relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[90px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#BFFF00]/10 blur-[90px] pointer-events-none rounded-full" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-[#BFFF00]/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Chiamata Conto Intelligente</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                  {tableLabel}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Pre-seleziona POS o Resto per velocizzare la cassa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              safeHaptic(10);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-4 relative z-10 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-9 h-9 animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">Cameriere Allertato al Tavolo!</h3>
              <p className="text-xs text-zinc-300 max-w-xs mx-auto">
                Lo staff sa già come intendi pagare:
              </p>
              <div className="inline-block px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-semibold text-[#BFFF00]">
                {mainMethod === 'pos' 
                  ? (posVariant === 'contactless' ? 'Terminale POS Contactless in arrivo' : 'POS Tradizionale con Chip') 
                  : (isExactCash ? 'Contanti esatti alla cassa' : `Contanti: banconota da ${effectiveBanknote}€ (Porta ${changeDue}€ di resto)`)}
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-zinc-800 text-xs text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#BFFF00]" />
              <span>Nessuna attesa in fila: il servizio arriva direttamente qui</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {cooldownRemaining > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-amber-400 animate-spin" />
                <span>Richiesta inviata di recente. Riprova tra <strong>{cooldownRemaining}s</strong> per evitare duplicati in sala.</span>
              </div>
            )}

            {/* SEZIONE 1: METODO DI PAGAMENTO CON SUB-SELETTORI */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                1. Come vuoi pagare?
              </label>

              {/* Main Selector: POS vs Cash */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    safeHaptic(10);
                    setMainMethod('pos');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    mainMethod === 'pos'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                      : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    mainMethod === 'pos' ? 'bg-cyan-500/30 text-cyan-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Carta / Bancomat</span>
                    <span className="text-[10px] text-zinc-400 block">Terminale POS al tavolo</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    safeHaptic(10);
                    setMainMethod('cash');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    mainMethod === 'cash'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    mainMethod === 'cash' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Contanti</span>
                    <span className="text-[10px] text-zinc-400 block">Con eventuale resto</span>
                  </div>
                </button>
              </div>

              {/* Sub-selector: POS Variants */}
              {mainMethod === 'pos' && (
                <div className="bg-[#18181B] rounded-2xl p-3 border border-cyan-500/20 space-y-2 animate-fade-in">
                  <span className="text-[11px] font-semibold text-zinc-400 block">
                    Preferenza terminale:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        safeHaptic(8);
                        setPosVariant('contactless');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        posVariant === 'contactless'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Wifi className="w-3.5 h-3.5 rotate-90" />
                      <span>Contactless / Apple Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        safeHaptic(8);
                        setPosVariant('traditional');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        posVariant === 'traditional'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-black/30 border-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Chip & PIN Fisico</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-selector: Cash Banknote & Change calculation */}
              {mainMethod === 'cash' && (
                <div className="bg-[#18181B] rounded-2xl p-3.5 border border-emerald-500/20 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Resto al tavolo:</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        safeHaptic(10);
                        setIsExactCash(!isExactCash);
                      }}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isExactCash
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {isExactCash ? 'Conto Esatto (Nessun resto)' : 'Hai soldi giusti?'}
                    </button>
                  </div>

                  {!isExactCash && (
                    <div className="space-y-2">
                      <span className="text-[11px] text-zinc-400 block">
                        Con quale banconota paghi?
                      </span>

                      <div className="grid grid-cols-4 gap-2">
                        {CASH_BANKNOTE_PRESETS.map((note) => (
                          <button
                            key={note}
                            type="button"
                            onClick={() => {
                              safeHaptic(8);
                              setSelectedBanknote(note);
                              setCustomBanknoteInput('');
                            }}
                            className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                              selectedBanknote === note && !customBanknoteInput
                                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10'
                                : 'bg-black/40 border-white/5 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {note} €
                          </button>
                        ))}
                      </div>

                      {/* Dynamic Change indicator */}
                      {numericTotal > 0 && (
                        <div className="flex items-center justify-between bg-black/40 rounded-xl p-2.5 border border-white/5 text-xs">
                          <span className="text-zinc-400">
                            Totale {numericTotal.toFixed(2)} € con banconota da {effectiveBanknote} €:
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            Resto: {changeDue > 0 ? `${changeDue.toFixed(2)} €` : '0.00 €'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SEZIONE 2: SPLIT "ALLA ROMANA" */}
            <div className="bg-[#18181B] rounded-2xl p-4 border border-[#27272A] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#BFFF00]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    2. Dividi Spesa (Alla Romana)
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400">
                  {splitCount === 1 ? 'Conto Singolo' : `${splitCount} Persone`}
                </span>
              </div>

              <div className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/5">
                <span className="text-xs text-zinc-300 pl-2">Numero commensali:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjustSplit(-1)}
                    disabled={splitCount <= 1}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold flex items-center justify-center text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono text-base font-bold text-white w-6 text-center">
                    {splitCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustSplit(1)}
                    disabled={splitCount >= 20}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold flex items-center justify-center text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                    Totale Tavolo (€)
                  </label>
                  <input
                    type="text"
                    value={customTotal}
                    onChange={(e) => setCustomTotal(e.target.value)}
                    placeholder="Es. 60.00"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#BFFF00]"
                  />
                </div>

                <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex flex-col justify-center">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                    Quota a persona
                  </span>
                  <span className="text-base font-mono font-bold text-[#BFFF00]">
                    {splitQuota || (numericTotal > 0 ? `${(numericTotal / splitCount).toFixed(2)} €` : 'Da definire')}
                  </span>
                </div>
              </div>
            </div>

            {/* SEZIONE 3: FATTURA ELETTRONICA B2B */}
            <div className="bg-[#18181B] rounded-2xl p-4 border border-[#27272A] space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      3. Richiedi Fattura Elettronica
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      Per detrazione aziendale e professionisti
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    safeHaptic(10);
                    setWantsInvoice(!wantsInvoice);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    wantsInvoice ? 'bg-cyan-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      wantsInvoice ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {wantsInvoice && (
                <div className="pt-2 border-t border-zinc-800 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        safeHaptic(10);
                        setQrModalOpen(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Incolla / Scansiona QR AdE</span>
                    </button>

                    <label
                      htmlFor={fileInputId}
                      className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Carica file XML o immagine QR dell'Agenzia delle Entrate"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Carica XML/QR</span>
                      <input
                        id={fileInputId}
                        type="file"
                        accept=".xml,text/xml,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                        Ragione Sociale <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={invoiceData.companyName}
                          onChange={(e) => setInvoiceData({ ...invoiceData, companyName: e.target.value })}
                          placeholder="Mario Rossi S.r.l."
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                          Partita IVA o CF <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={invoiceData.vatNumber}
                          onChange={(e) => setInvoiceData({ ...invoiceData, vatNumber: e.target.value })}
                          placeholder="11 cifre o CF"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono uppercase text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                          Codice SDI (7 caratteri)
                        </label>
                        <input
                          type="text"
                          maxLength={7}
                          value={invoiceData.sdiCode}
                          onChange={(e) => setInvoiceData({ ...invoiceData, sdiCode: e.target.value.toUpperCase() })}
                          placeholder="0000000"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono uppercase text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Submit Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  safeHaptic(10);
                  onClose();
                }}
                className="px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Annulla
              </button>

              <button
                type="submit"
                disabled={submitting || cooldownRemaining > 0}
                className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-400 via-[#BFFF00] to-emerald-400 hover:opacity-95 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span>Invio al monitor cassa...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-black" />
                    <span>Chiama Conto al Tavolo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Modal: Paste/Scan AdE QR */}
        {qrModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md bg-[#18181B] border border-cyan-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                  <QrCode className="w-4 h-4" />
                  <span>Acquisizione Dati Agenzia delle Entrate</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQrModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-300">
                Incolla il testo del tuo QR AdE o il frammento XML per estrarre Partita IVA e SDI:
              </p>

              <textarea
                rows={4}
                value={qrRawText}
                onChange={(e) => setQrRawText(e.target.value)}
                placeholder="Es. PI:01234567890;CF:...;RA:Azienda Srl;CD:M5UXCR1;"
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 resize-none"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQrModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-medium"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleQrTextApply}
                  className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs shadow-md"
                >
                  Estrai Dati e Compila
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

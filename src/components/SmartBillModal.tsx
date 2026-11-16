'use client';

import { useState, useId, useMemo, useEffect, ChangeEvent, FormEvent } from 'react';
import {
  Receipt,
  CreditCard,
  Banknote,
  Users,
  User,
  Building2,
  FileText,
  CheckCircle2,
  X,
  Send,
  QrCode,
  Upload,
  ShieldCheck,
  AlertCircle,
  Clock,
  Coins,
  Wifi,
} from 'lucide-react';
import {
  BillRequestStatus,
  PaymentMethodIntent,
  BillRequestInvoiceData,
} from '@/lib/types/smart-bill';
import { parseAdeQrCode } from '@/lib/invoice-helpers';
import { enqueueOutboxItem } from '@/lib/offline-outbox';
import { StatusBadge } from '@/components/ui';

interface SmartBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  deviceId?: string | null;
  tableLabel: string;
  estimatedTotal?: string | null;
  personalQuota?: number | null;
  initialSplitCount?: number | null;
  guestName?: string | null;
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

const SMART_INPUT_CLASS =
  'w-full min-h-[44px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--rivo-volt)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] transition-colors';

export default function SmartBillModal({
  isOpen,
  onClose,
  organizationId,
  deviceId,
  tableLabel,
  estimatedTotal,
  personalQuota,
  initialSplitCount,
  guestName,
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
  const [splitCount, setSplitCount] = useState<number>(
    initialSplitCount && initialSplitCount > 0 ? initialSplitCount : 1
  );

  useEffect(() => {
    if (!isOpen) return;
    const cleaned = estimatedTotal ? estimatedTotal.replace(/[^0-9.,]/g, '').replace(',', '.') : '';
    const num = parseFloat(cleaned) || 0;
    if (num > 0) setCustomTotal(num.toFixed(2));
    if (initialSplitCount && initialSplitCount > 0) setSplitCount(initialSplitCount);
  }, [isOpen, estimatedTotal, initialSplitCount]);

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
  const [isOfflineSuccess, setIsOfflineSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (qrModalOpen) {
        setQrModalOpen(false);
      } else if (!submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, qrModalOpen, submitting, onClose]);

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

    const billPayload = {
      organization_id: organizationId,
      device_id: deviceId || null,
      table_label: tableLabel || 'Tavolo',
      payment_method_intent: computedIntent,
      total_amount: numericTotal,
      banknote_denomination: mainMethod === 'cash' && !isExactCash ? effectiveBanknote : null,
      split_count: splitCount,
      invoice_data: wantsInvoice
        ? {
            companyName: invoiceData.companyName.trim(),
            vatNumber: invoiceData.vatNumber.trim().toUpperCase(),
            sdiCode: (invoiceData.sdiCode.trim() || '0000000').toUpperCase(),
            pec: invoiceData.pec?.trim() || '',
            address: invoiceData.address?.trim() || '',
          }
        : null,
    };

    const handleSuccessState = (offline: boolean = false) => {
      // Set 90 seconds anti-spam cooldown lock in sessionStorage
      const expiresAt = Date.now() + 90 * 1000;
      sessionStorage.setItem(`rivo_bill_cooldown_${organizationId}_${tableLabel}`, expiresAt.toString());
      setCooldownRemaining(90);

      safeHaptic([20, 50, 30]);
      setIsOfflineSuccess(offline);
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess({ status: 'bill_requested', intent: computedIntent });
      }

      setTimeout(() => {
        setIsSuccess(false);
        setIsOfflineSuccess(false);
        onClose();
      }, 3500);
    };

    // Pre-flight check: if browser is currently offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        await enqueueOutboxItem({
          type: 'bill',
          url: '/api/bill-request',
          body: billPayload,
        });
        handleSuccessState(true);
      } catch (enqueueErr) {
        console.warn('Failed to enqueue bill offline:', enqueueErr);
        setErrorMsg('Errore nel salvataggio offline della richiesta.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      // Direct submission to the atomic bill request API
      const res = await fetch('/api/bill-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billPayload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Concurrency lock conflict: another guest already requested the bill
        if (res.status === 409) {
          throw new Error('Un commensale al tuo tavolo ha già chiamato il conto! Il personale sta arrivando.');
        }
        throw new Error(data.error || 'Impossibile inviare la richiesta del conto.');
      }

      handleSuccessState(false);
    } catch (err: unknown) {
      const isNetworkError =
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        err instanceof TypeError ||
        (err instanceof Error && /network|fetch|failed to fetch/i.test(err.message));

      if (isNetworkError) {
        try {
          await enqueueOutboxItem({
            type: 'bill',
            url: '/api/bill-request',
            body: billPayload,
          });
          handleSuccessState(true);
          return;
        } catch (enqueueErr) {
          console.warn('Failed to enqueue bill on network error:', enqueueErr);
        }
      }

      const msg = err instanceof Error ? err.message : 'Errore di connessione.';
      setErrorMsg(msg);
      safeHaptic([40, 80]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-bill-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--bg-backdrop)] backdrop-blur-md animate-fade-in overflow-y-auto overscroll-contain"
    >
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 text-[var(--text-primary)] my-auto relative max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] flex items-center justify-center text-[var(--rivo-volt-text)] shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="smart-bill-modal-title"
                className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] flex flex-wrap items-center gap-2"
              >
                <span>Chiamata Conto Intelligente</span>
                <StatusBadge tone="neutral" size="sm" mono>
                  {tableLabel}
                </StatusBadge>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Invia allo staff il metodo di pagamento e i dettagli fattura
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi modale chiamata conto"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-4 animate-fade-in">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${
                isOfflineSuccess
                  ? 'bg-[var(--accent-warning-bg)] text-[var(--accent-warning-text)] border-[var(--accent-warning-border)]'
                  : 'bg-[var(--accent-operational-bg)] text-[var(--accent-operational-text)] border-[var(--accent-operational-border)]'
              }`}
            >
              {isOfflineSuccess ? (
                <Wifi className="w-9 h-9 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-9 h-9" />
              )}
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {isOfflineSuccess ? 'Richiesta conto registrata offline!' : 'Cameriere Allertato al Tavolo!'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                {isOfflineSuccess
                  ? 'Sarà recapitata alla cassa appena torna la connessione.'
                  : 'Lo staff sa già come intendi pagare:'}
              </p>
              <div className="inline-block px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--rivo-volt-text)] font-mono tabular-nums">
                {mainMethod === 'pos'
                  ? posVariant === 'contactless'
                    ? 'Terminale POS Contactless in arrivo'
                    : 'POS Tradizionale con Chip'
                  : isExactCash
                  ? 'Contanti esatti alla cassa'
                  : `Contanti: banconota da ${effectiveBanknote}€ (Porta ${changeDue}€ di resto)`}
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
              <span>
                {isOfflineSuccess
                  ? 'Nessuna preoccupazione: la richiesta è salvata in locale e verrà recapitata non appena torna linea'
                  : 'Nessuna attesa in fila: il servizio arriva direttamente qui'}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-xs text-[var(--accent-critical-text)] flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {cooldownRemaining > 0 && (
              <div className="p-3 rounded-xl bg-[var(--accent-warning-bg)] border border-[var(--accent-warning-border)] text-xs text-[var(--accent-warning-text)] flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  Richiesta inviata di recente. Riprova tra{' '}
                  <strong className="font-mono tabular-nums">{cooldownRemaining}s</strong> per evitare duplicati
                  in sala.
                </span>
              </div>
            )}

            {/* SEZIONE 1: METODO DI PAGAMENTO CON SUB-SELETTORI */}
            <div className="space-y-2.5">
              <span
                id="smartbill-payment-method-label"
                className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block"
              >
                1. Come vuoi pagare?
              </span>

              {/* Main Selector: POS vs Cash */}
              <div
                role="group"
                aria-labelledby="smartbill-payment-method-label"
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              >
                <button
                  type="button"
                  onClick={() => {
                    safeHaptic(10);
                    setMainMethod('pos');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    mainMethod === 'pos'
                      ? 'bg-[var(--accent-telemetry-bg)] border-[var(--accent-telemetry-border)] text-[var(--text-primary)] ring-1 ring-[var(--accent-telemetry)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      mainMethod === 'pos'
                        ? 'bg-[var(--accent-telemetry)]/15 text-[var(--accent-telemetry-text)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-[var(--text-primary)]">
                      Carta / Bancomat
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] block">
                      Terminale POS al tavolo
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    safeHaptic(10);
                    setMainMethod('cash');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    mainMethod === 'cash'
                      ? 'bg-[var(--accent-operational-bg)] border-[var(--accent-operational-border)] text-[var(--text-primary)] ring-1 ring-[var(--accent-operational)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      mainMethod === 'cash'
                        ? 'bg-[var(--accent-operational)]/15 text-[var(--accent-operational-text)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-[var(--text-primary)]">Contanti</span>
                    <span className="text-[11px] text-[var(--text-muted)] block">Con eventuale resto</span>
                  </div>
                </button>
              </div>

              {/* Sub-selector: POS Variants */}
              {mainMethod === 'pos' && (
                <div className="bg-[var(--bg-elevated)] rounded-2xl p-3 border border-[var(--accent-telemetry-border)] space-y-2 animate-fade-in">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                    Preferenza terminale:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        safeHaptic(8);
                        setPosVariant('contactless');
                      }}
                      className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] ${
                        posVariant === 'contactless'
                          ? 'bg-[var(--accent-telemetry-bg)] border-[var(--accent-telemetry)] text-[var(--accent-telemetry-text)] font-bold'
                          : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                      className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] ${
                        posVariant === 'traditional'
                          ? 'bg-[var(--accent-telemetry-bg)] border-[var(--accent-telemetry)] text-[var(--accent-telemetry-text)] font-bold'
                          : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Chip &amp; PIN Fisico</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-selector: Cash Banknote & Change calculation */}
              {mainMethod === 'cash' && (
                <div className="bg-[var(--bg-elevated)] rounded-2xl p-3.5 border border-[var(--accent-operational-border)] space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-[var(--accent-operational-text)]" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">Resto al tavolo:</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        safeHaptic(10);
                        setIsExactCash(!isExactCash);
                      }}
                      className={`min-h-[44px] text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] ${
                        isExactCash
                          ? 'bg-[var(--accent-operational-bg)] border-[var(--accent-operational)] text-[var(--accent-operational-text)]'
                          : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {isExactCash ? 'Conto Esatto (Nessun resto)' : 'Hai soldi giusti?'}
                    </button>
                  </div>

                  {!isExactCash && (
                    <div className="space-y-2">
                      <span className="text-[11px] text-[var(--text-secondary)] block">
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
                            className={`min-h-[44px] py-2 rounded-xl text-xs font-mono tabular-nums font-bold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] ${
                              selectedBanknote === note && !customBanknoteInput
                                ? 'bg-[var(--accent-operational-bg)] border-[var(--accent-operational)] text-[var(--accent-operational-text)]'
                                : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {note} €
                          </button>
                        ))}
                      </div>

                      {/* Dynamic Change indicator */}
                      {numericTotal > 0 && (
                        <div className="flex items-center justify-between gap-2 bg-[var(--bg-subtle)] rounded-xl p-2.5 border border-[var(--border-subtle)] text-xs">
                          <span className="text-[var(--text-secondary)] font-mono tabular-nums">
                            Totale {numericTotal.toFixed(2)} € con banconota da {effectiveBanknote} €:
                          </span>
                          <span className="font-mono tabular-nums font-bold text-[var(--accent-operational-text)] shrink-0">
                            Resto: {changeDue > 0 ? `${changeDue.toFixed(2)} €` : '0.00 €'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SEZIONE 2: SPLIT "ALLA ROMANA" O QUOTA PERSONALE */}
            <div className="bg-[var(--bg-elevated)] rounded-2xl p-4 border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--rivo-volt-text)]" />
                  <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    2. Dividi Spesa / La Tua Quota
                  </span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                  {splitCount === 1 ? 'Conto Singolo / Personale' : `${splitCount} Persone`}
                </span>
              </div>

              {typeof personalQuota === 'number' && personalQuota > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      safeHaptic(12);
                      setCustomTotal(personalQuota.toFixed(2));
                      setSplitCount(1);
                    }}
                    className="p-2.5 rounded-xl bg-[var(--rivo-volt-bg)] hover:opacity-90 border border-[var(--rivo-volt-border)] text-left transition-all cursor-pointer"
                  >
                    <span className="text-[10px] font-bold uppercase text-[var(--rivo-volt-text)] flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>Solo la mia quota {guestName ? `(${guestName})` : ''}</span>
                    </span>
                    <span className="text-sm font-mono tabular-nums font-extrabold text-[var(--text-primary)] mt-0.5 block">
                      {personalQuota.toFixed(2)} €
                    </span>
                  </button>

                  {estimatedTotal && (
                    <button
                      type="button"
                      onClick={() => {
                        safeHaptic(12);
                        const cleaned = estimatedTotal.replace(/[^0-9.,]/g, '').replace(',', '.');
                        const val = parseFloat(cleaned) || 0;
                        if (val > 0) setCustomTotal(val.toFixed(2));
                        setSplitCount(initialSplitCount && initialSplitCount > 1 ? initialSplitCount : 2);
                      }}
                      className="p-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-left transition-all cursor-pointer"
                    >
                      <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>Totale Tavolo (Alla Romana)</span>
                      </span>
                      <span className="text-sm font-mono tabular-nums font-extrabold text-[var(--text-primary)] mt-0.5 block">
                        {estimatedTotal}
                      </span>
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between bg-[var(--bg-subtle)] rounded-xl p-2 border border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-secondary)] pl-2">Numero commensali:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjustSplit(-1)}
                    disabled={splitCount <= 1}
                    aria-label="Riduci numero commensali"
                    className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 text-[var(--text-primary)] font-bold flex items-center justify-center text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]"
                  >
                    -
                  </button>
                  <span className="font-mono tabular-nums text-base font-bold text-[var(--text-primary)] w-6 text-center">
                    {splitCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustSplit(1)}
                    disabled={splitCount >= 20}
                    aria-label="Aumenta numero commensali"
                    className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 text-[var(--text-primary)] font-bold flex items-center justify-center text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label
                    htmlFor="smartbill-custom-total"
                    className="text-[11px] text-[var(--text-muted)] uppercase font-semibold block mb-1"
                  >
                    Totale Tavolo (€)
                  </label>
                  <input
                    id="smartbill-custom-total"
                    type="text"
                    value={customTotal}
                    onChange={(e) => setCustomTotal(e.target.value)}
                    placeholder="Es. 60.00"
                    className={`${SMART_INPUT_CLASS} font-mono tabular-nums`}
                  />
                </div>

                <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl p-2.5 flex flex-col justify-center">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold block">
                    Quota a persona
                  </span>
                  <span className="text-base font-mono tabular-nums font-bold text-[var(--rivo-volt-text)]">
                    {splitQuota ||
                      (numericTotal > 0 ? `${(numericTotal / splitCount).toFixed(2)} €` : 'Da definire')}
                  </span>
                </div>
              </div>
            </div>

            {/* SEZIONE 3: FATTURA ELETTRONICA B2B */}
            <div className="bg-[var(--bg-elevated)] rounded-2xl p-4 border border-[var(--border-subtle)] space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--accent-telemetry-text)] shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                      3. Richiedi Fattura Elettronica
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] block">
                      Per detrazione aziendale e professionisti
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={wantsInvoice}
                  aria-label="Richiedi Fattura Elettronica"
                  onClick={() => {
                    safeHaptic(10);
                    setWantsInvoice(!wantsInvoice);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)] ${
                    wantsInvoice ? 'bg-[var(--accent-telemetry)]' : 'bg-[var(--border-strong)]'
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
                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3 animate-fade-in">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        safeHaptic(10);
                        setQrModalOpen(true);
                      }}
                      className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-[var(--accent-telemetry-bg)] hover:opacity-90 border border-[var(--accent-telemetry-border)] text-[var(--accent-telemetry-text)] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Incolla / Scansiona QR AdE</span>
                    </button>

                    <label
                      htmlFor={fileInputId}
                      className="min-h-[44px] py-2 px-3 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Carica file XML o immagine QR dell'Agenzia delle Entrate"
                    >
                      <Upload className="w-3.5 h-3.5 text-[var(--accent-warning-text)]" />
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
                      <label
                        htmlFor="smartbill-company-name"
                        className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1"
                      >
                        Ragione Sociale <span className="text-[var(--accent-critical-text)]">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="smartbill-company-name"
                          type="text"
                          required
                          value={invoiceData.companyName}
                          onChange={(e) => setInvoiceData({ ...invoiceData, companyName: e.target.value })}
                          placeholder="Mario Rossi S.r.l."
                          className={`${SMART_INPUT_CLASS} pl-9`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label
                          htmlFor="smartbill-vat-number"
                          className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1"
                        >
                          Partita IVA o CF <span className="text-[var(--accent-critical-text)]">*</span>
                        </label>
                        <input
                          id="smartbill-vat-number"
                          type="text"
                          required
                          value={invoiceData.vatNumber}
                          onChange={(e) => setInvoiceData({ ...invoiceData, vatNumber: e.target.value })}
                          placeholder="11 cifre o CF"
                          className={`${SMART_INPUT_CLASS} font-mono tabular-nums uppercase`}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="smartbill-sdi-code"
                          className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1"
                        >
                          Codice SDI (7 caratteri)
                        </label>
                        <input
                          id="smartbill-sdi-code"
                          type="text"
                          maxLength={7}
                          value={invoiceData.sdiCode}
                          onChange={(e) =>
                            setInvoiceData({ ...invoiceData, sdiCode: e.target.value.toUpperCase() })
                          }
                          placeholder="0000000"
                          className={`${SMART_INPUT_CLASS} font-mono tabular-nums uppercase`}
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
                className="min-h-[44px] px-4 py-3 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]"
              >
                Annulla
              </button>

              <button
                type="submit"
                disabled={submitting || cooldownRemaining > 0}
                className="flex-1 min-h-[44px] py-3 px-5 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
              >
                {submitting ? (
                  <span>Invio al monitor cassa...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#09090B]" />
                    <span>Chiama Conto al Tavolo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Modal: Paste/Scan AdE QR */}
        {qrModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="smart-qr-modal-title"
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-md animate-fade-in overscroll-contain"
          >
            <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div
                  id="smart-qr-modal-title"
                  className="flex items-center gap-2 text-[var(--accent-telemetry-text)] font-bold text-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Acquisizione Dati Agenzia delle Entrate</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQrModalOpen(false)}
                  aria-label="Chiudi finestra QR AdE"
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Incolla il testo del tuo QR AdE o il frammento XML per estrarre Partita IVA e SDI:
              </p>

              <div>
                <label htmlFor="smartbill-qr-raw" className="sr-only">
                  Testo QR Agenzia delle Entrate o XML
                </label>
                <textarea
                  id="smartbill-qr-raw"
                  rows={4}
                  value={qrRawText}
                  onChange={(e) => setQrRawText(e.target.value)}
                  placeholder="Es. PI:01234567890;CF:...;RA:Azienda Srl;CD:M5UXCR1;"
                  className={`${SMART_INPUT_CLASS} p-3 font-mono resize-none`}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQrModalOpen(false)}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleQrTextApply}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]"
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

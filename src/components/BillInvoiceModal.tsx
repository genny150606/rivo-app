'use client';

import { useState, useId, useEffect, ChangeEvent } from 'react';
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
  Upload,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { hapticTap, hapticSelection, hapticSuccess, hapticWarning } from '@/lib/haptics';
import { parseAdeQrCode, InvoiceData } from '@/lib/invoice-helpers';
import { StatusBadge } from '@/components/ui';

interface BillInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  deviceId?: string | null;
  tableLabel: string;
  estimatedTotal?: string | null;
  onSubmitted?: () => void;
}

const MODAL_INPUT_CLASS =
  'w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--rivo-volt)] focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors';

export default function BillInvoiceModal({
  isOpen,
  onClose,
  organizationId,
  deviceId,
  tableLabel,
  estimatedTotal,
  onSubmitted,
}: BillInvoiceModalProps) {
  const fileInputId = useId();
  const [splitCount, setSplitCount] = useState<number>(1);
  const [customTotal, setCustomTotal] = useState<string>(
    estimatedTotal ? estimatedTotal.replace(/[^0-9.,]/g, '').replace(',', '.') : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<'pos' | 'cash'>('pos');
  const [wantsInvoice, setWantsInvoice] = useState<boolean>(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    companyName: '',
    vatNumber: '',
    sdiCode: '0000000',
    pec: '',
    address: '',
  });
  const [qrInputModal, setQrInputModal] = useState<boolean>(false);
  const [qrRawText, setQrRawText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (qrInputModal) {
        setQrInputModal(false);
      } else if (!submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, qrInputModal, submitting, onClose]);

  if (!isOpen) return null;

  // Numerical calculation for split bill
  const numericTotal = parseFloat(customTotal.replace(',', '.')) || 0;
  const splitQuota =
    numericTotal > 0 && splitCount > 0 ? (numericTotal / splitCount).toFixed(2) + ' €' : null;

  const handleAdjustSplit = (delta: number) => {
    hapticSelection();
    setSplitCount((prev) => Math.max(1, Math.min(20, prev + delta)));
  };

  const handleQrTextApply = () => {
    hapticTap();
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
    hapticSuccess();
    setQrInputModal(false);
    setQrRawText('');
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    hapticTap();

    // Check if it's text/xml or image
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
          hapticSuccess();
        }
      };
      reader.readAsText(file);
    } else {
      // Prompt modal to paste text if camera OCR or direct QR image
      setQrInputModal(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (wantsInvoice) {
      if (!invoiceData.companyName.trim()) {
        hapticWarning();
        setErrorMsg('Inserisci la Ragione Sociale o Nome Azienda.');
        return;
      }
      if (!invoiceData.vatNumber.trim()) {
        hapticWarning();
        setErrorMsg('Inserisci la Partita IVA o Codice Fiscale.');
        return;
      }
    }

    setSubmitting(true);
    hapticTap();

    try {
      const callType = wantsInvoice
        ? 'bill_invoice'
        : paymentMethod === 'pos'
        ? 'bill_pos'
        : 'bill_cash';

      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          device_id: deviceId || null,
          type: callType,
          table_label: tableLabel || 'Tavolo',
          order_details: {
            total: numericTotal > 0 ? `${numericTotal.toFixed(2)} €` : estimatedTotal || undefined,
            split_count: splitCount,
            split_quota: splitQuota || undefined,
            payment_method: paymentMethod,
            invoice: wantsInvoice
              ? {
                  companyName: invoiceData.companyName.trim(),
                  vatNumber: invoiceData.vatNumber.trim().toUpperCase(),
                  sdiCode: (invoiceData.sdiCode.trim() || '0000000').toUpperCase(),
                  pec: invoiceData.pec.trim(),
                  address: invoiceData.address?.trim() || '',
                }
              : null,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Impossibile inviare la richiesta');
      }

      hapticSuccess();
      setIsSuccess(true);
      if (onSubmitted) onSubmitted();

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 3200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore di connessione';
      hapticWarning();
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-invoice-modal-title"
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
                id="bill-invoice-modal-title"
                className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] flex flex-wrap items-center gap-2"
              >
                <span>Richiedi il Conto</span>
                <StatusBadge tone="neutral" size="sm" mono>
                  {tableLabel}
                </StatusBadge>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Divisione &ldquo;alla romana&rdquo; e fattura elettronica con 1 tap
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onClose();
            }}
            aria-label="Chiudi modale richiesta conto"
            className="w-8 h-8 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-operational-bg)] text-[var(--accent-operational-text)] flex items-center justify-center mx-auto border border-[var(--accent-operational-border)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Richiesta inviata alla cassa!</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                Lo staff ha ricevuto la tua richiesta per il <strong>{tableLabel}</strong>.
                {wantsInvoice && ' I dati per la fattura elettronica sono già stati caricati sul gestionale.'}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
              <span>Nessuna attesa in fila alla cassa</span>
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

            {/* SEZIONE 1: DIVISIONE ALLA ROMANA */}
            <div className="bg-[var(--bg-elevated)] rounded-2xl p-4 border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--rivo-volt-text)]" />
                  <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Dividi Conto (Alla Romana)
                  </span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                  {splitCount === 1 ? 'Conto Unico' : `${splitCount} Persone`}
                </span>
              </div>

              {/* Stepper Persone */}
              <div className="flex items-center justify-between bg-[var(--bg-subtle)] rounded-xl p-2 border border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-secondary)] pl-2">Numero commensali:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjustSplit(-1)}
                    disabled={splitCount <= 1}
                    aria-label="Riduci numero commensali"
                    className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 text-[var(--text-primary)] font-bold flex items-center justify-center text-sm transition-all active:scale-95 cursor-pointer"
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
                    className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 text-[var(--text-primary)] font-bold flex items-center justify-center text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Calcolo Quota se disponibile o input stima */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] uppercase font-semibold block mb-1">
                    Totale Tavolo (€)
                  </label>
                  <input
                    type="text"
                    value={customTotal}
                    onChange={(e) => setCustomTotal(e.target.value)}
                    placeholder="Es. 60.00"
                    className={`${MODAL_INPUT_CLASS} font-mono tabular-nums`}
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

            {/* SEZIONE 2: METODO DI PAGAMENTO */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                Come preferisci pagare?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    hapticSelection();
                    setPaymentMethod('pos');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 touch-press cursor-pointer ${
                    paymentMethod === 'pos'
                      ? 'bg-[var(--accent-telemetry-bg)] border-[var(--accent-telemetry-border)] text-[var(--text-primary)] ring-1 ring-[var(--accent-telemetry)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      paymentMethod === 'pos'
                        ? 'bg-[var(--accent-telemetry)]/15 text-[var(--accent-telemetry-text)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-[var(--text-primary)]">POS / Carta</span>
                    <span className="text-[11px] text-[var(--text-muted)] block">Terminale al tavolo</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    hapticSelection();
                    setPaymentMethod('cash');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 touch-press cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-[var(--accent-operational-bg)] border-[var(--accent-operational-border)] text-[var(--text-primary)] ring-1 ring-[var(--accent-operational)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      paymentMethod === 'cash'
                        ? 'bg-[var(--accent-operational)]/15 text-[var(--accent-operational-text)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-[var(--text-primary)]">Contanti</span>
                    <span className="text-[11px] text-[var(--text-muted)] block">Alla cassa</span>
                  </div>
                </button>
              </div>
            </div>

            {/* SEZIONE 3: FATTURA ELETTRONICA B2B (TOGGLE & FORM) */}
            <div className="bg-[var(--bg-elevated)] rounded-2xl p-4 border border-[var(--border-subtle)] space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--accent-telemetry-text)] shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                      Ti serve la Fattura Elettronica?
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] block">
                      Per aziende, professionisti e deduzioni fiscali
                    </span>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={wantsInvoice}
                  aria-label="Richiedi Fattura Elettronica"
                  onClick={() => {
                    hapticSelection();
                    setWantsInvoice(!wantsInvoice);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
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

              {/* Form Espandibile Dati Fattura */}
              {wantsInvoice && (
                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3 animate-fade-in">
                  {/* Tasto Acquisizione Rapida QR Agenzia delle Entrate */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        hapticTap();
                        setQrInputModal(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-[var(--accent-telemetry-bg)] hover:opacity-90 border border-[var(--accent-telemetry-border)] text-[var(--accent-telemetry-text)] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Incolla o Scansiona QR AdE</span>
                    </button>

                    <label
                      htmlFor={fileInputId}
                      className="py-2 px-3 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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

                  {/* Campi input manuali */}
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1">
                        Ragione Sociale o Nome Azienda{' '}
                        <span className="text-[var(--accent-critical-text)]">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={invoiceData.companyName}
                          onChange={(e) => setInvoiceData({ ...invoiceData, companyName: e.target.value })}
                          placeholder="Es. Mario Rossi S.r.l."
                          className={`${MODAL_INPUT_CLASS} pl-9`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1">
                          Partita IVA o CF <span className="text-[var(--accent-critical-text)]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={invoiceData.vatNumber}
                          onChange={(e) => setInvoiceData({ ...invoiceData, vatNumber: e.target.value })}
                          placeholder="11 cifre o CF"
                          className={`${MODAL_INPUT_CLASS} font-mono tabular-nums uppercase`}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1">
                          Codice SDI (7 caratteri)
                        </label>
                        <input
                          type="text"
                          maxLength={7}
                          value={invoiceData.sdiCode}
                          onChange={(e) =>
                            setInvoiceData({ ...invoiceData, sdiCode: e.target.value.toUpperCase() })
                          }
                          placeholder="0000000"
                          className={`${MODAL_INPUT_CLASS} font-mono tabular-nums uppercase`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1">
                          PEC (opzionale)
                        </label>
                        <input
                          type="email"
                          value={invoiceData.pec}
                          onChange={(e) => setInvoiceData({ ...invoiceData, pec: e.target.value })}
                          placeholder="azienda@pec.it"
                          className={MODAL_INPUT_CLASS}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-[var(--text-secondary)] font-semibold block mb-1">
                          Indirizzo Sede Legale
                        </label>
                        <input
                          type="text"
                          value={invoiceData.address}
                          onChange={(e) => setInvoiceData({ ...invoiceData, address: e.target.value })}
                          placeholder="Via, CAP, Città"
                          className={MODAL_INPUT_CLASS}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  onClose();
                }}
                className="px-4 py-3 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs transition-colors cursor-pointer"
              >
                Annulla
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-5 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span>Invio alla Cassa...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#09090B]" />
                    <span>Invia Richiesta Conto {wantsInvoice ? '& Fattura' : ''}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Modal Secondaria di Input Testo / XML QR Agenzia Entrate */}
        {qrInputModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-qr-modal-title"
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[var(--bg-backdrop)] backdrop-blur-md animate-fade-in overscroll-contain"
          >
            <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div
                  id="bill-qr-modal-title"
                  className="flex items-center gap-2 text-[var(--accent-telemetry-text)] font-bold text-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Acquisizione Dati Agenzia Entrate</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQrInputModal(false)}
                  aria-label="Chiudi finestra QR AdE"
                  className="w-7 h-7 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Incolla qui la stringa decodificata del tuo QR Code AdE (o il testo XML):
              </p>

              <textarea
                rows={4}
                value={qrRawText}
                onChange={(e) => setQrRawText(e.target.value)}
                placeholder="Es. PI:01234567890;CF:...;RA:Azienda Srl;CD:M5UXCR1;PC:pec@pec.it"
                className={`${MODAL_INPUT_CLASS} p-3 font-mono resize-none`}
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQrInputModal(false)}
                  className="px-3 py-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleQrTextApply}
                  className="px-4 py-2 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs shadow-sm"
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

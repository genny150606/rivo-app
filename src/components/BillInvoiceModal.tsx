'use client';

import { useState, useId, ChangeEvent } from 'react';
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
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { hapticTap, hapticSelection, hapticSuccess, hapticWarning } from '@/lib/haptics';
import { parseAdeQrCode, InvoiceData } from '@/lib/invoice-helpers';

interface BillInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  deviceId?: string | null;
  tableLabel: string;
  estimatedTotal?: string | null;
  onSubmitted?: () => void;
}

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
  const [customTotal, setCustomTotal] = useState<string>(estimatedTotal ? estimatedTotal.replace(/[^0-9.,]/g, '').replace(',', '.') : '');
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

  if (!isOpen) return null;

  // Numerical calculation for split bill
  const numericTotal = parseFloat(customTotal.replace(',', '.')) || 0;
  const splitQuota = numericTotal > 0 && splitCount > 0 
    ? (numericTotal / splitCount).toFixed(2) + ' €' 
    : null;

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
        : (paymentMethod === 'pos' ? 'bill_pos' : 'bill_cash');

      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          device_id: deviceId || null,
          type: callType,
          table_label: tableLabel || 'Tavolo',
          order_details: {
            total: numericTotal > 0 ? `${numericTotal.toFixed(2)} €` : (estimatedTotal || undefined),
            split_count: splitCount,
            split_quota: splitQuota || undefined,
            payment_method: paymentMethod,
            invoice: wantsInvoice ? {
              companyName: invoiceData.companyName.trim(),
              vatNumber: invoiceData.vatNumber.trim().toUpperCase(),
              sdiCode: (invoiceData.sdiCode.trim() || '0000000').toUpperCase(),
              pec: invoiceData.pec.trim(),
              address: invoiceData.address?.trim() || '',
            } : null,
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
                <span>Richiedi il Conto</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                  {tableLabel}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
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
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Richiesta inviata alla cassa!</h3>
              <p className="text-xs text-zinc-300 max-w-xs mx-auto">
                Lo staff ha ricevuto la tua richiesta per il <strong>{tableLabel}</strong>.
                {wantsInvoice && ' I dati per la fattura elettronica sono già stati caricati sul gestionale.'}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-zinc-800 text-xs text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#BFFF00]" />
              <span>Nessuna attesa in fila alla cassa</span>
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

            {/* SEZIONE 1: DIVISIONE ALLA ROMANA */}
            <div className="bg-[#18181B] rounded-2xl p-4 border border-[#27272A] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#BFFF00]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Dividi Conto (Alla Romana)
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400">
                  {splitCount === 1 ? 'Conto Unico' : `${splitCount} Persone`}
                </span>
              </div>

              {/* Stepper Persone */}
              <div className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/5">
                <span className="text-xs text-zinc-300 pl-2">Numero commensali:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjustSplit(-1)}
                    disabled={splitCount <= 1}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold flex items-center justify-center text-sm transition-all active:scale-95 cursor-pointer"
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
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold flex items-center justify-center text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Calcolo Quota se disponibile o input stima */}
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

            {/* SEZIONE 2: METODO DI PAGAMENTO */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Come preferisci pagare?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    hapticSelection();
                    setPaymentMethod('pos');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 touch-press cursor-pointer ${
                    paymentMethod === 'pos'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    paymentMethod === 'pos' ? 'bg-cyan-500/30 text-cyan-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">POS / Carta</span>
                    <span className="text-[10px] text-zinc-400 block">Terminale al tavolo</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    hapticSelection();
                    setPaymentMethod('cash');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 touch-press cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    paymentMethod === 'cash' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Contanti</span>
                    <span className="text-[10px] text-zinc-400 block">Alla cassa</span>
                  </div>
                </button>
              </div>
            </div>

            {/* SEZIONE 3: FATTURA ELETTRONICA B2B (TOGGLE & FORM) */}
            <div className="bg-[#18181B] rounded-2xl p-4 border border-[#27272A] space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Ti serve la Fattura Elettronica?
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      Per aziende, professionisti e deduzioni fiscali
                    </span>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    hapticSelection();
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

              {/* Form Espandibile Dati Fattura */}
              {wantsInvoice && (
                <div className="pt-2 border-t border-zinc-800 space-y-3 animate-fade-in">
                  {/* Tasto Acquisizione Rapida QR Agenzia delle Entrate */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        hapticTap();
                        setQrInputModal(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Incolla o Scansiona QR AdE</span>
                    </button>

                    <label
                      htmlFor={fileInputId}
                      className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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

                  {/* Campi input manuali */}
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                        Ragione Sociale o Nome Azienda <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={invoiceData.companyName}
                          onChange={(e) => setInvoiceData({ ...invoiceData, companyName: e.target.value })}
                          placeholder="Es. Mario Rossi S.r.l."
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

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                          PEC (opzionale)
                        </label>
                        <input
                          type="email"
                          value={invoiceData.pec}
                          onChange={(e) => setInvoiceData({ ...invoiceData, pec: e.target.value })}
                          placeholder="azienda@pec.it"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                          Indirizzo Sede Legale
                        </label>
                        <input
                          type="text"
                          value={invoiceData.address}
                          onChange={(e) => setInvoiceData({ ...invoiceData, address: e.target.value })}
                          placeholder="Via, CAP, Città"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
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
                className="px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Annulla
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-400 via-[#BFFF00] to-emerald-400 hover:opacity-95 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span>Invio alla Cassa...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-black" />
                    <span>Invia Richiesta Conto {wantsInvoice ? '& Fattura' : ''}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Modal Secondaria di Input Testo / XML QR Agenzia Entrate */}
        {qrInputModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md bg-[#18181B] border border-cyan-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                  <QrCode className="w-4 h-4" />
                  <span>Acquisizione Dati Agenzia Entrate</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQrInputModal(false)}
                  className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-300">
                Incolla qui la stringa decodificata del tuo QR Code AdE (o il testo XML):
              </p>

              <textarea
                rows={4}
                value={qrRawText}
                onChange={(e) => setQrRawText(e.target.value)}
                placeholder="Es. PI:01234567890;CF:...;RA:Azienda Srl;CD:M5UXCR1;PC:pec@pec.it"
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 resize-none"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQrInputModal(false)}
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

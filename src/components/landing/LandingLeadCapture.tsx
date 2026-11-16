'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export default function LandingLeadCapture() {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contact, setContact] = useState('');
  const [vertical, setVertical] = useState('restaurant');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!name.trim() || !contact.trim()) {
        setErrorMsg('Nome e contatto (email o telefono) sono obbligatori.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          business_name: businessName.trim(),
          contact: contact.trim(),
          vertical,
          source: `landing_${vertical}`,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Errore durante l'invio della richiesta.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Impossibile completare la richiesta. Riprova.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="lead-capture" className="py-20 px-4 sm:px-6 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl p-6 sm:p-10 bg-[#111215] border border-white/[0.1] relative">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#BFFF00]/10 border border-[#BFFF00]/25 text-[11px] font-mono uppercase tracking-wider text-[#BFFF00] mb-3">
              ONBOARDING B2B RAPIDO
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F4F6]">
              Porta RIVO nel Tuo Locale o Negozio.
            </h2>
            <p className="text-[#A1A1AA] text-xs sm:text-sm mt-2">
              Configuriamo il tuo ambiente demo dedicato in 2 ore e spediamo il kit hardware NFC di prova nella tua sede.
            </p>
          </div>

          {success ? (
            <div className="p-8 rounded-xl bg-[#09090B] border border-[#10B981]/35 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#F4F4F6] tracking-tight">
                Richiesta Ricevuta con Successo
              </h3>
              <p className="text-[#A1A1AA] text-xs sm:text-sm max-w-md mx-auto">
                Grazie <span className="font-semibold text-[#F4F4F6]">{name}</span>. Il team RIVO ti contatterà per attivare il workspace di{' '}
                <span className="font-semibold text-[#F4F4F6]">
                  {businessName || 'la tua attività'}
                </span>
                .
              </p>
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/demo/retail"
                  className="px-5 py-2.5 rounded-xl bg-[#BFFF00] text-[#09090B] font-bold text-xs inline-flex items-center gap-2 min-h-[44px]"
                >
                  <span>Prova il Simulatore Retail Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setName('');
                    setBusinessName('');
                    setContact('');
                    setNotes('');
                  }}
                  className="text-xs text-[#A1A1AA] hover:text-[#F4F4F6] underline cursor-pointer min-h-[44px] px-3"
                >
                  Invia un&apos;altra richiesta
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
              {errorMsg && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-name" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                    Nome e Cognome *
                  </label>
                  <input
                    id="lead-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mario Rossi"
                    className="w-full min-h-[44px] bg-[#09090B] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] placeholder-[#71717A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus:border-[#BFFF00] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="lead-business" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                    Nome Locale o Negozio
                  </label>
                  <input
                    id="lead-business"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ristorante Bellavista / Boutique Roma"
                    className="w-full min-h-[44px] bg-[#09090B] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] placeholder-[#71717A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus:border-[#BFFF00] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-contact" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                    Email o Telefono *
                  </label>
                  <input
                    id="lead-contact"
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="mario@locale.it o +39 340 1234567"
                    className="w-full min-h-[44px] bg-[#09090B] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] placeholder-[#71717A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus:border-[#BFFF00] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="lead-vertical" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                    Settore di Attività
                  </label>
                  <select
                    id="lead-vertical"
                    value={vertical}
                    onChange={(e) => setVertical(e.target.value)}
                    className="w-full min-h-[44px] bg-[#09090B] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus:border-[#BFFF00] transition-colors"
                  >
                    <option value="restaurant">Ristorante / Osteria / Trattoria</option>
                    <option value="pizzeria">Pizzeria / Bistrot</option>
                    <option value="bar">Cocktail Bar / Caffetteria</option>
                    <option value="retail_shoes">Retail Calzature &amp; Pelletteria</option>
                    <option value="retail_fashion">Retail Abbigliamento &amp; Moda</option>
                    <option value="hotel">Hotel &amp; Hospitality</option>
                    <option value="other">Altra attività commerciale</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="lead-notes" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                  Dettagli opzionali (tavoli, casse, esigenze)
                </label>
                <textarea
                  id="lead-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Es: 24 tavoli, interesse per Review Shield e chiamate cameriere..."
                  className="w-full bg-[#09090B] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-[#F4F4F6] placeholder-[#71717A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus:border-[#BFFF00] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 min-h-[48px] py-3 px-6 rounded-xl bg-[#BFFF00] hover:bg-[#D4FF33] text-[#09090B] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Invio richiesta in corso...</span>
                  </>
                ) : (
                  <>
                    <span>Invia Richiesta Demo e Ricevi Hardware di Prova</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#71717A]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  Nessun vincolo contrattuale • Prova 14 giorni
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Risposta operativa entro 2 ore
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

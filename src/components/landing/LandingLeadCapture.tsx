'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  PhoneCall, 
  Clock 
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
        throw new Error(data.error || 'Errore durante l\'invio della richiesta.');
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossibile completare la richiesta. Riprova.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="lead-capture" className="py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto relative">
        {/* Animated glowing border beam behind container */}
        <div className="absolute -inset-[1px] rounded-[26px] bg-gradient-to-r from-emerald-500/30 via-indigo-500/20 to-amber-500/30 blur-sm -z-10 opacity-70 animate-glow-breathe" />

        <div className="rounded-3xl p-6 sm:p-10 lg:p-12 bg-[#0B0C10] border border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
          {/* Subtle top edge specular highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-3 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ONBOARDING B2B RAPIDO</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white headline-tight">
              Porta RIVO nel Tuo Locale o Negozio.
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Configuriamo il tuo ambiente demo dedicato in 2 ore. Ricevi il kit hardware NFC di prova direttamente nella tua sede.
            </p>
          </div>

          {success ? (
            <div className="p-8 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Richiesta Ricevuta con Successo!
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
                Grazie <span className="font-semibold text-white">{name}</span>. Un nostro Principal Solutions Engineer ti contatterà al numero/email indicato per configurare il workspace di <span className="font-semibold text-white">{businessName || 'la tua attività'}</span>.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/demo/retail"
                  className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-white/20 touch-press"
                >
                  <span>Nell&apos;attesa, prova il Simulatore Retail Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setName('');
                    setBusinessName('');
                    setContact('');
                    setNotes('');
                  }}
                  className="text-xs text-slate-400 hover:text-white underline pt-2 sm:pt-0"
                >
                  Invia un&apos;altra richiesta
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome e Cognome *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mario Rossi"
                    className="w-full bg-[#12141C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome Locale o Negozio
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ristorante Bellavista / Boutique Roma"
                    className="w-full bg-[#12141C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email o Telefono per Contatto *
                  </label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="mario@locale.it o +39 340 1234567"
                    className="w-full bg-[#12141C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Settore di Attività
                  </label>
                  <select
                    value={vertical}
                    onChange={(e) => setVertical(e.target.value)}
                    className="w-full bg-[#12141C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Dettagli opzionali (Tavoli, punti cassa, esigenze particolari)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Es: Abbiamo 24 tavoli all'aperto e vorremmo testare Review Shield e chiamate cameriere..."
                  className="w-full bg-[#12141C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] touch-press disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Configurazione richiesta in corso...</span>
                  </>
                ) : (
                  <>
                    <span>Invia Richiesta Demo e Ricevi Hardware di Prova</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Nessun impegno contrattuale • Prova 14 giorni
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Risposta garantita entro 2 ore
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

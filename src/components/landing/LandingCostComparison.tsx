'use client';

import { useState } from 'react';
import { Check, X, TrendingUp, Calculator, ShieldCheck, Zap } from 'lucide-react';

export default function LandingCostComparison() {
  const [dailyCustomers, setDailyCustomers] = useState<number>(120);

  // Dynamic calculations based on daily customer volume
  const annualSubscriptionSavings = 3312; // €276/month net saving vs 6 tools
  const estimatedNew5StarMonthly = Math.round((dailyCustomers * 30 * 0.035));
  const estimatedLoyalReturns = Math.round(dailyCustomers * 0.28);
  const staffHoursSavedWeekly = (dailyCustomers * 0.04).toFixed(1);

  const comparisonRows = [
    {
      feature: 'Menu Digitale Interattivo & Multilingua',
      traditional: '€ 39 / mese (piattaforma terza)',
      rivo: 'Incluso nel core',
    },
    {
      feature: 'Protezione Recensioni & Filtro 5★',
      traditional: '€ 49 / mese (servizio esterno)',
      rivo: 'Review Shield™ Integrato',
    },
    {
      feature: 'Fidelity Card su Apple & Google Wallet',
      traditional: '€ 79 / mese (app o timbri carta)',
      rivo: 'Nativo Zero-App Incluso',
    },
    {
      feature: 'Chiamata Cameriere & Smartwatch Staff',
      traditional: '€ 29 / mese (cercapersone fisici)',
      rivo: 'Incluso via NFC al Tavolo',
    },
    {
      feature: 'Gestione Cassa, Magazzino & ERP Veloce',
      traditional: '€ 89 / mese (software separato)',
      rivo: 'Simple Mode ERP Incluso',
    },
    {
      feature: 'AI Sommelier & Upselling Calici',
      traditional: '€ 40 / mese (non integrabile)',
      rivo: 'Algoritmo AI Nativo',
    },
  ];

  return (
    <section id="roi" className="py-20 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>CONSOLIDAMENTO SAAS &amp; ROI</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white headline-tight">
            Prima di RIVO vs. Con RIVO. <br />
            Consolida Costi e Caos Gestionale.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Basta pagare 6 fornitori diversi con 6 login separati e dati non sincronizzati. Un unico sistema operativo fa risparmiare migliaia di euro l&apos;anno.
          </p>
        </div>

        {/* =========================================================
            COMPARISON MATRIX TABLE
            ========================================================= */}
        <div className="rounded-3xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-black/40 text-xs uppercase tracking-wider text-slate-400 font-mono">
                  <th className="py-4 px-6 font-semibold">Funzionalità Operativa</th>
                  <th className="py-4 px-6 font-semibold text-red-400">Stack Tradizionale (6 Software)</th>
                  <th className="py-4 px-6 font-semibold text-emerald-400">Con RIVO OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs sm:text-sm">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-medium text-white">{row.feature}</td>
                    <td className="py-4 px-6 text-slate-400 flex items-center gap-2">
                      <X className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{row.traditional}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-emerald-300">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{row.rivo}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-white/[0.03] font-bold text-sm sm:text-base">
                  <td className="py-5 px-6 text-white">Totale Costo Licenze Mensili</td>
                  <td className="py-5 px-6 font-mono text-red-400">~€ 325 / mese + attrito</td>
                  <td className="py-5 px-6 font-mono text-emerald-400">
                    A partire da € 49 / mese (Tutto Incluso)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================
            INTERACTIVE ROI CALCULATOR
            ========================================================= */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0F1015] border border-white/[0.08] relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
                <Calculator className="w-4 h-4" />
                <span>CALCOLATORE D&apos;IMPATTO ECONOMICO</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                Stima il Ritorno del Tuo Locale o Negozio
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Clienti / Coperti al Giorno:</span>
              <span className="text-xl font-bold font-mono text-white tabular-nums bg-white/[0.06] px-3 py-1 rounded-lg border border-white/[0.1]">
                {dailyCustomers}
              </span>
            </div>
          </div>

          {/* Slider Input */}
          <div className="my-6">
            <input
              type="range"
              min="30"
              max="400"
              step="10"
              value={dailyCustomers}
              onChange={(e) => setDailyCustomers(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-2">
              <span>30 coperti/die (piccolo bistrot)</span>
              <span>200 coperti/die (locale medio)</span>
              <span>400+ coperti/die (alta rotazione)</span>
            </div>
          </div>

          {/* Computed Dynamic KPIs Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Risparmio Licenze Annuo</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
                € {annualSubscriptionSavings.toLocaleString('it-IT')}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Eliminando 6 canoni SaaS</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Nuove Recensioni 5★ / Mese</div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono tabular-nums mt-1">
                +{estimatedNew5StarMonthly}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Verificate su Google Maps</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Clienti Ricorrenti Wallet</div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-400 font-mono tabular-nums mt-1">
                +{estimatedLoyalReturns} / die
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Grazie alle notifiche push</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Tempo Risparmiato Staff</div>
              <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums mt-1">
                {staffHoursSavedWeekly} ore
              </div>
              <div className="text-[10px] text-slate-500 mt-1">A settimana per gestione conti</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { Check, X, Calculator } from 'lucide-react';

export default function LandingCostComparison() {
  const [dailyCustomers, setDailyCustomers] = useState<number>(120);

  const annualSubscriptionSavings = 3312;
  const estimatedNew5StarMonthly = Math.round(dailyCustomers * 30 * 0.035);
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
      feature: 'Chiamata Cameriere & Notifiche Staff',
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
    <section id="roi" className="py-20 px-4 sm:px-6 relative z-10 overflow-x-clip">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#111215] border border-white/[0.08] text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
            <span>CONSOLIDAMENTO SAAS &amp; ROI</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F4F6]">
            Prima di RIVO vs. Con RIVO.
            <br />
            Consolida Costi e Caos Gestionale.
          </h2>
          <p className="text-[#A1A1AA] text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Basta pagare 6 fornitori diversi con 6 login separati e dati disallineati. Un solo sistema operativo abbatte costi fissi e tempi morti.
          </p>
        </div>

        {/* Comparison Table Matrix */}
        <div className="rounded-2xl bg-[#111215] border border-white/[0.08] overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#09090B] text-[11px] uppercase tracking-wider text-[#A1A1AA] font-mono">
                  <th className="py-4 px-5 font-semibold">Funzionalità Operativa</th>
                  <th className="py-4 px-5 font-semibold text-[#EF4444]">Stack Tradizionale (6 Software)</th>
                  <th className="py-4 px-5 font-semibold text-[#BFFF00]">Con RIVO OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs sm:text-sm">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5 font-medium text-[#F4F4F6]">{row.feature}</td>
                    <td className="py-4 px-5 text-[#A1A1AA]">
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-[#EF4444] shrink-0" />
                        <span>{row.traditional}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-semibold text-[#10B981]">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                        <span>{row.rivo}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#18191D] font-bold text-sm sm:text-base">
                  <td className="py-4 px-5 text-[#F4F4F6]">Totale Costo Licenze Mensili</td>
                  <td className="py-4 px-5 font-mono text-[#EF4444] tabular-nums">~€ 325 / mese + attrito</td>
                  <td className="py-4 px-5 font-mono text-[#BFFF00] tabular-nums">
                    Da € 49 / mese (Tutto Incluso)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive ROI Calculator */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#111215] border border-white/[0.08]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#BFFF00] mb-1">
                <Calculator className="w-4 h-4" />
                <span>CALCOLATORE D&apos;IMPATTO ECONOMICO</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#F4F4F6] tracking-tight">
                Stima il Ritorno del Tuo Locale o Negozio
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="roi-slider" className="text-xs text-[#A1A1AA] font-medium">
                Clienti / Coperti al Giorno:
              </label>
              <span className="text-xl font-bold font-mono text-[#BFFF00] tabular-nums bg-[#18191D] px-3 py-1 rounded-lg border border-white/[0.1]">
                {dailyCustomers}
              </span>
            </div>
          </div>

          <div className="my-6">
            <input
              id="roi-slider"
              type="range"
              min="30"
              max="400"
              step="10"
              value={dailyCustomers}
              onChange={(e) => setDailyCustomers(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[#18191D] rounded-lg appearance-none cursor-pointer accent-[#BFFF00]"
            />
            <div className="flex justify-between gap-2 text-[11px] font-mono text-[#71717A] mt-2">
              <span>30 coperti/die</span>
              <span>200 coperti/die</span>
              <span>400+ coperti/die</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-[#09090B] border border-white/[0.08]">
              <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-medium">
                Risparmio Licenze Annuo
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#10B981] font-mono tabular-nums mt-1">
                € {annualSubscriptionSavings.toLocaleString('it-IT')}
              </div>
              <div className="text-[11px] text-[#71717A] mt-1">Eliminando 6 canoni SaaS</div>
            </div>

            <div className="p-4 rounded-xl bg-[#09090B] border border-white/[0.08]">
              <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-medium">
                Nuove Recensioni 5★ / Mese
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#F59E0B] font-mono tabular-nums mt-1">
                +{estimatedNew5StarMonthly}
              </div>
              <div className="text-[11px] text-[#71717A] mt-1">Verificate su Google Maps</div>
            </div>

            <div className="p-4 rounded-xl bg-[#09090B] border border-white/[0.08]">
              <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-medium">
                Clienti Ricorrenti Wallet
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#38BDF8] font-mono tabular-nums mt-1">
                +{estimatedLoyalReturns} / die
              </div>
              <div className="text-[11px] text-[#71717A] mt-1">Con notifiche prossimità</div>
            </div>

            <div className="p-4 rounded-xl bg-[#09090B] border border-white/[0.08]">
              <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-medium">
                Tempo Risparmiato Staff
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#BFFF00] font-mono tabular-nums mt-1">
                {staffHoursSavedWeekly} ore
              </div>
              <div className="text-[11px] text-[#71717A] mt-1">A settimana per gestione conti</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

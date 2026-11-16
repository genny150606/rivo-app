'use client';

import { CheckCircle2 } from 'lucide-react';

export default function LandingArchitectureFlow() {
  const steps = [
    {
      step: '01',
      badge: 'HARDWARE CRITTOGRAFATO',
      title: 'Supporto Fisico NFC + Laser QR',
      description:
        'Chip NTAG 424 DNA a sicurezza bancaria con URL dinamico crittografato. Realizzato in plexiglass ad alta densità e alluminio satinato. Zero batterie, resistente ad acqua e usura.',
      spec: 'NTAG 424 DNA • IP67 • Zero manutenzione',
    },
    {
      step: '02',
      badge: 'ZERO ATTRITO OSPITE',
      title: 'Tap Istantaneo in 0.4s (Senza App)',
      description:
        'Nessuna applicazione da scaricare o registrazione richiesta. Un accostamento dello smartphone apre Safari o Chrome nativo in meno di 400 millisecondi con interfaccia reattiva.',
      spec: 'Handshake: 380ms • Web App Istantanea',
    },
    {
      step: '03',
      badge: 'CLOUD & EDGE COMPUTING',
      title: 'Control Room Unificata & Sync',
      description:
        'Ogni interazione si sincronizza in tempo reale con PostgreSQL, notifiche operative per la sala, terminali staff e cassa centralizzata, aggiornando P&L e fidelizzazione.',
      spec: 'Realtime Cloud • Telegram Webhook • Edge Cache',
    },
  ];

  return (
    <section id="architettura" className="py-20 px-4 sm:px-6 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#111215] border border-white/[0.08] text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
            <span>ARCHITETTURA HIGH-THROUGHPUT</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F4F6]">
            Dal Tavolo o Cassa al Cloud{' '}
            <span className="text-[#BFFF00]">in Meno di 0.4 Secondi.</span>
          </h2>
          <p className="text-[#A1A1AA] text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Abbiamo eliminato ogni frizione tecnologica sia per il cliente che per lo staff con un&apos;infrastruttura ingegnerizzata per continuità e velocità.
          </p>
        </div>

        {/* 3-Step Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
          {/* Desktop 1px hardware trace line */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-12 left-12 right-12 h-px bg-white/[0.1] pointer-events-none"
          />

          {steps.map((item) => (
            <div
              key={item.step}
              className="p-6 rounded-2xl bg-[#111215] border border-white/[0.08] flex flex-col justify-between relative z-10 hover:border-white/[0.16] transition-colors min-w-0"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#18191D] border border-white/[0.1]">
                    <span className="font-mono text-sm font-bold text-[#BFFF00] tabular-nums">
                      {item.step}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.04] text-[#A1A1AA] border border-white/[0.08]">
                    {item.badge}
                  </span>
                </div>

                <h3 className="font-display text-lg sm:text-xl font-semibold text-[#F4F4F6] tracking-tight">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#A1A1AA] mt-2.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.08]">
                <div className="text-[11px] font-mono text-[#A1A1AA] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span className="truncate">{item.spec}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

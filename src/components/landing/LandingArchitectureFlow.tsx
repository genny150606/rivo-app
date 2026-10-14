'use client';

import { Smartphone, Zap, Server, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

export default function LandingArchitectureFlow() {
  const steps = [
    {
      step: '01',
      badge: 'HARDWARE CRITTOGRAFATO',
      title: 'Supporto Fisico NFC + Laser QR',
      description:
        'Chip NTAG 424 DNA a sicurezza bancaria con URL dinamico crittografato. Realizzato in plexiglass ad alta densità e alluminio satinato. Zero batterie, zero cavi, resistente ad acqua e disinfettanti.',
      spec: 'NTAG 424 DNA • IP67 • Nessuna manutenzione',
      accent: 'emerald',
    },
    {
      step: '02',
      badge: 'ZERO ATTRITO OSPITE',
      title: 'Tap Istantaneo in 0.4s (Senza App)',
      description:
        'Nessuna applicazione da scaricare o registrazione noiosa. Un semplice accostamento dello smartphone apre Safari o Chrome nativo in meno di 400 millisecondi con interfaccia fluida a 120fps.',
      spec: 'Latenza Handshake: 380ms • PWA Nativa',
      accent: 'amber',
    },
    {
      step: '03',
      badge: 'CLOUD & EDGE COMPUTING',
      title: 'Control Room Unificata & AI Sync',
      description:
        'Ogni interazione si sincronizza istantaneamente con Supabase PostgreSQL, notifiche Telegram per la sala, smartwatch dello staff e cassa centralizzata, aggiornando P&L e fidelizzazione.',
      spec: 'Supabase Realtime • Webhook Telegram • Edge Cache',
      accent: 'indigo',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>ARCHITETTURA HIGH-THROUGHPUT</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white headline-tight">
            Dal Tavolo o Cassa al Cloud <br />
            in Meno di 0.4 Secondi.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Come abbiamo eliminato ogni frizione tecnologica sia per l&apos;avventore che per lo staff con un&apos;infrastruttura ingegnerizzata per la massima velocità.
          </p>
        </div>

        {/* 3-Step Horizontal High-Craft Visual Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Animated horizontal connecting beam on desktop */}
          <div className="hidden md:block absolute top-1/2 left-8 right-8 h-[2px] bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-indigo-500/20 -translate-y-1/2 -z-0 pointer-events-none">
            <div className="w-24 h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-laser-sweep" />
          </div>

          {steps.map((item, idx) => (
            <div
              key={item.step}
              className="p-6 sm:p-7 rounded-3xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] flex flex-col justify-between relative group hover:border-white/[0.22] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(255,255,255,0.03)] transition-all duration-300 z-10"
            >
              {/* Top ambient highlight on hover */}
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                {/* Step Pill & Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono text-slate-600 group-hover:text-white transition-colors">
                      {item.step}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-ping group-hover:bg-emerald-400" />
                  </div>
                  <span
                    className={`badge-mono px-2 py-0.5 rounded text-[10px] ${
                      item.accent === 'emerald'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:border-emerald-500/40'
                        : item.accent === 'amber'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:border-amber-500/40'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:border-indigo-500/40'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Technical Spec Box */}
              <div className="mt-6 pt-4 border-t border-white/[0.06]">
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{item.spec}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

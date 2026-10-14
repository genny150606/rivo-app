'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Heart, Sparkles, Activity } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050507] pt-16 pb-12 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/[0.06]">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center p-1">
                <Image
                  src="/brand/rivo-icon.png"
                  alt="RIVO"
                  width={22}
                  height={22}
                  className="rounded-xs"
                />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">RIVO</span>
              <span className="badge-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px]">
                OS 2.0
              </span>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Il sistema operativo fisico-digitale che unifica comande, pagamenti al tavolo, recensioni Google con AI, carte Apple Wallet e gestione cassa/magazzino.
            </p>

            {/* Live System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistemi Operativi: 100% Online</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-300">CDN 18ms</span>
            </div>
          </div>

          {/* Solutions Column */}
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Soluzioni
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#ristorazione" className="hover:text-white transition-colors">
                  Ristorazione &amp; Sala
                </a>
              </li>
              <li>
                <a href="#retail" className="hover:text-white transition-colors">
                  Retail &amp; Magazzino ERP
                </a>
              </li>
              <li>
                <a href="#review-shield" className="hover:text-white transition-colors">
                  Review Shield™ 5★
                </a>
              </li>
              <li>
                <a href="#dual-vertical" className="hover:text-white transition-colors">
                  AI Sommelier al Tavolo
                </a>
              </li>
              <li>
                <Link href="/demo/retail" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Demo Retail Live</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Column */}
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Piattaforma
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#ecosistema" className="hover:text-white transition-colors">
                  Architettura Tap-to-Cloud
                </a>
              </li>
              <li>
                <a href="#review-shield" className="hover:text-white transition-colors">
                  Offline-Outbox Sync
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Area Riservata Clienti
                </Link>
              </li>
              <li>
                <a href="#roi" className="hover:text-white transition-colors">
                  Calcolatore ROI
                </a>
              </li>
            </ul>
          </div>

          {/* Company & Legal Column */}
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Conformità &amp; Legale
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  GDPR &amp; Privacy Compliant
                </span>
              </li>
              <li>
                <span className="text-slate-400">Crittografia NTAG 424 DNA</span>
              </li>
              <li>
                <span className="text-slate-400">Fatturazione Elettronica SDI</span>
              </li>
              <li>
                <span className="text-slate-400">Termini di Servizio B2B</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} RIVO Technologies. Tutti i diritti riservati.
          </div>

          <div className="flex items-center gap-2">
            <span>Ingegnerizzato con orgoglio per le attività commerciali in Italia</span>
            <span className="text-slate-400 font-semibold">🇮🇹 Made in Italy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

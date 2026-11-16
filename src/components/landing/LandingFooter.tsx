'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Terminal } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#09090B] pt-16 pb-12 px-4 sm:px-6 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/[0.08]">
          {/* Brand Column */}
          <div className="sm:col-span-2 space-y-4 min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#18191D] border border-white/[0.12] flex items-center justify-center p-1">
                <Image
                  src="/brand/rivo-icon.png"
                  alt="RIVO"
                  width={22}
                  height={22}
                  className="rounded-xs"
                />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-[#F4F4F6]">RIVO</span>
              <span className="font-mono font-semibold text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#BFFF00]/10 text-[#BFFF00] border border-[#BFFF00]/25">
                OS 2.0
              </span>
            </div>

            <p className="text-xs text-[#A1A1AA] max-w-sm leading-relaxed">
              Il sistema operativo fisico-digitale che unifica comande, pagamenti al tavolo, recensioni Google verificate, carte Apple Wallet e gestione cassa/magazzino.
            </p>

            {/* Live System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111215] border border-white/[0.08] text-[11px] text-[#A1A1AA]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Sistemi Operativi: 100% Online</span>
              <span className="text-[#71717A]">•</span>
              <span className="font-mono text-[#F4F4F6] tabular-nums">CDN 18ms</span>
            </div>
          </div>

          {/* Solutions Column */}
          <div>
            <div className="text-[11px] font-mono font-bold text-[#F4F4F6] uppercase tracking-wider mb-3">
              Soluzioni
            </div>
            <ul className="space-y-2 text-xs text-[#A1A1AA]">
              <li>
                <a href="#dual-vertical" className="hover:text-[#F4F4F6] transition-colors">
                  Ristorazione &amp; Sala
                </a>
              </li>
              <li>
                <a href="#dual-vertical" className="hover:text-[#F4F4F6] transition-colors">
                  Retail &amp; Magazzino ERP
                </a>
              </li>
              <li>
                <a href="#review-shield" className="hover:text-[#F4F4F6] transition-colors">
                  Review Shield™ 5★
                </a>
              </li>
              <li>
                <a href="#dual-vertical" className="hover:text-[#F4F4F6] transition-colors">
                  AI Sommelier al Tavolo
                </a>
              </li>
              <li>
                <Link
                  href="/demo/retail"
                  className="text-[#BFFF00] hover:text-[#D4FF33] font-semibold inline-flex items-center gap-1.5"
                >
                  <Terminal className="w-3 h-3" />
                  <span>Demo Retail Live</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Column */}
          <div>
            <div className="text-[11px] font-mono font-bold text-[#F4F4F6] uppercase tracking-wider mb-3">
              Piattaforma
            </div>
            <ul className="space-y-2 text-xs text-[#A1A1AA]">
              <li>
                <a href="#ecosistema" className="hover:text-[#F4F4F6] transition-colors">
                  Architettura Tap-to-Cloud
                </a>
              </li>
              <li>
                <a href="#review-shield" className="hover:text-[#F4F4F6] transition-colors">
                  Offline-Outbox Sync
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#F4F4F6] transition-colors">
                  Area Riservata Clienti
                </Link>
              </li>
              <li>
                <a href="#roi" className="hover:text-[#F4F4F6] transition-colors">
                  Calcolatore ROI
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance Column */}
          <div>
            <div className="text-[11px] font-mono font-bold text-[#F4F4F6] uppercase tracking-wider mb-3">
              Conformità &amp; Legale
            </div>
            <ul className="space-y-2 text-xs text-[#A1A1AA]">
              <li>
                <span className="flex items-center gap-1.5 text-[#F4F4F6]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  GDPR &amp; Privacy Compliant
                </span>
              </li>
              <li>Crittografia NTAG 424 DNA</li>
              <li>Fatturazione Elettronica SDI</li>
              <li>Termini di Servizio B2B</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <div>
            &copy; {new Date().getFullYear()} RIVO Technologies. Tutti i diritti riservati.
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Ingegnerizzato per le attività commerciali in Italia</span>
            <span className="text-[#F4F4F6] font-semibold px-1.5 py-0.5 rounded bg-[#18191D] border border-white/[0.08]">
              IT • MADE IN ITALY
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

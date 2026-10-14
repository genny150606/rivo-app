'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronRight, Menu, X, Sparkles, Shield, Smartphone } from 'lucide-react';

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 sm:pt-6 transition-all duration-300">
      <nav
        className={`w-full max-w-6xl transition-all duration-300 rounded-2xl ${
          scrolled
            ? 'glass-chrome shadow-[0_12px_40px_rgba(0,0,0,0.6)] py-2.5 px-4 sm:px-6'
            : 'bg-[#0B0C10]/60 backdrop-blur-md border border-white/[0.06] py-3 px-4 sm:px-6'
        }`}
        aria-label="Navigazione principale"
      >
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center p-1 transition-transform group-hover:scale-105">
              <Image
                src="/brand/rivo-icon.png"
                alt="RIVO Logo"
                width={22}
                height={22}
                priority
                className="rounded-xs"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  RIVO
                </span>
                <span className="badge-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px]">
                  OS 2.0
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <a
              href="#ecosistema"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              Ecosistema
            </a>
            <a
              href="#ristorazione"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              Ristorazione
            </a>
            <a
              href="#retail"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              Retail ERP
            </a>
            <a
              href="#review-shield"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              Review Shield™
            </a>
            <a
              href="#roi"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              ROI & Costi
            </a>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/demo/retail"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] transition-all hover:border-white/[0.2] touch-press"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Live Demo</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              Area Clienti
            </Link>

            <a
              href="#lead-capture"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-white text-zinc-950 hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] touch-press"
            >
              <span>Richiedi Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg bg-white/[0.05] text-slate-300 hover:text-white border border-white/[0.08]"
            aria-label="Apri menu mobile"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-white/[0.08] flex flex-col gap-2 pb-2">
            <a
              href="#ecosistema"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/[0.05]"
            >
              Ecosistema
            </a>
            <a
              href="#ristorazione"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/[0.05]"
            >
              Ristorazione & Sala
            </a>
            <a
              href="#retail"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/[0.05]"
            >
              Retail & Magazzino
            </a>
            <a
              href="#review-shield"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/[0.05]"
            >
              Review Shield™
            </a>
            <a
              href="#roi"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/[0.05]"
            >
              ROI & Consolidamento
            </a>
            <div className="pt-2 flex flex-col gap-2 border-t border-white/[0.06]">
              <Link
                href="/demo/retail"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                <span>Apri Simulatore Retail Live</span>
              </Link>
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-xs font-medium text-center"
                >
                  Area Clienti
                </Link>
                <a
                  href="#lead-capture"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold text-center"
                >
                  Richiedi Demo
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

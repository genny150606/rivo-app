'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Menu, X, Terminal } from 'lucide-react';

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
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 pt-3 sm:pt-4">
      <nav
        aria-label="Navigazione principale"
        className={`mx-auto w-full max-w-6xl rounded-xl border transition-colors duration-200 ${
          scrolled || mobileMenuOpen
            ? 'bg-[#09090B]/95 backdrop-blur-md border-white/[0.12] shadow-[0_12px_32px_rgba(0,0,0,0.65)]'
            : 'bg-[#111215]/88 backdrop-blur-md border-white/[0.08]'
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-3.5 sm:px-5 py-2.5 min-w-0">
          {/* Logo & Brand Lockup */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]">
            <div className="w-8 h-8 rounded-lg bg-[#18191D] border border-white/[0.12] flex items-center justify-center p-1 transition-colors group-hover:border-[#BFFF00]/50">
              <Image
                src="/brand/rivo-icon.png"
                alt="RIVO Logo"
                width={22}
                height={22}
                priority
                className="rounded-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base tracking-tight text-[#F4F4F6] group-hover:text-[#BFFF00] transition-colors">
                RIVO
              </span>
              <span className="hidden xs:inline-block font-mono font-semibold text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#BFFF00]/10 text-[#BFFF00] border border-[#BFFF00]/25">
                OS 2.0
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {[
              { href: '#ecosistema', label: 'Ecosistema' },
              { href: '#dual-vertical', label: 'Verticali' },
              { href: '#review-shield', label: 'Review Shield' },
              { href: '#architettura', label: 'Architettura' },
              { href: '#roi', label: 'ROI & Costi' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs font-medium text-[#A1A1AA] hover:text-[#F4F4F6] px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link
              href="/demo/retail"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#18191D] hover:bg-white/[0.08] text-[#F4F4F6] border border-white/[0.1] transition-colors min-h-[38px] whitespace-nowrap"
            >
              <Terminal className="w-3.5 h-3.5 text-[#BFFF00]" />
              <span>Live Demo</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center text-xs font-medium px-3 py-2 rounded-lg text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-white/[0.04] transition-colors min-h-[38px] whitespace-nowrap"
            >
              Area Clienti
            </Link>

            <a
              href="#lead-capture"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-[#BFFF00] text-[#09090B] hover:bg-[#D4FF33] transition-colors min-h-[38px] whitespace-nowrap"
            >
              <span>Richiedi Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Actions + Menu Button */}
          <div className="flex sm:hidden items-center gap-2 shrink-0">
            <a
              href="#lead-capture"
              className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-2 rounded-lg bg-[#BFFF00] text-[#09090B] min-h-[40px]"
            >
              <span>Demo</span>
              <ArrowRight className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg bg-[#18191D] text-[#F4F4F6] border border-white/[0.12] min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Chiudi menu mobile' : 'Apri menu mobile'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/[0.08] px-3.5 pb-4 pt-3 flex flex-col gap-1.5 bg-[#09090B]/98 rounded-b-xl">
            {[
              { href: '#ecosistema', label: 'Ecosistema Tap-to-Cloud' },
              { href: '#dual-vertical', label: 'Ristorazione & Retail ERP' },
              { href: '#review-shield', label: 'Review Shield™ & Wallet' },
              { href: '#architettura', label: 'Architettura Hardware' },
              { href: '#roi', label: 'ROI & Consolidamento' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#A1A1AA] hover:text-[#F4F4F6] py-2.5 px-3 rounded-lg hover:bg-white/[0.05] min-h-[44px] flex items-center"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2.5 mt-1 border-t border-white/[0.08] flex flex-col gap-2">
              <Link
                href="/demo/retail"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 min-h-[44px] rounded-lg bg-[#18191D] border border-[#BFFF00]/30 text-[#BFFF00] text-xs font-semibold"
              >
                <Terminal className="w-4 h-4" />
                <span>Apri Simulatore Retail Live</span>
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.1] text-[#F4F4F6] text-xs font-medium"
                >
                  Area Clienti
                </Link>
                <a
                  href="#lead-capture"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] flex items-center justify-center rounded-lg bg-[#BFFF00] text-[#09090B] text-xs font-bold"
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

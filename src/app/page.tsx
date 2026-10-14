import type { Metadata } from 'next';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingAmbientCanvas from '@/components/landing/LandingAmbientCanvas';
import LandingHeroSimulator from '@/components/landing/LandingHeroSimulator';
import LandingDualVertical from '@/components/landing/LandingDualVertical';
import LandingBentoGrid from '@/components/landing/LandingBentoGrid';
import LandingArchitectureFlow from '@/components/landing/LandingArchitectureFlow';
import LandingCostComparison from '@/components/landing/LandingCostComparison';
import LandingLeadCapture from '@/components/landing/LandingLeadCapture';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'RIVO — Il Sistema Operativo Fisico-Digitale per Ristorazione e Retail',
  description:
    'Unifica hardware NFC/QR, comande al tavolo, recensioni 5★ su Google con AI, Apple Wallet nativo e gestione cassa/magazzino in un unico ecosistema Cloud in tempo reale.',
  openGraph: {
    title: 'RIVO — Il Sistema Operativo Fisico-Digitale per Ristorazione e Retail',
    description:
      'Elimina 6 abbonamenti disconnessi. Connetti tavoli fisici, cassa e magazzino al Cloud in 0.4 secondi con RIVO.',
    siteName: 'RIVO Technologies',
    type: 'website',
    locale: 'it_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RIVO — Il Sistema Operativo Fisico-Digitale per Ristorazione e Retail',
    description:
      'Elimina 6 abbonamenti disconnessi. Connetti tavoli fisici, cassa e magazzino al Cloud in 0.4 secondi con RIVO.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050507] text-slate-100 overflow-x-hidden selection:bg-emerald-500 selection:text-black relative">
      {/* 60fps Hardware-Accelerated Ambient Star & Constellation Field */}
      <LandingAmbientCanvas />

      {/* Precision Floating Navbar */}
      <LandingNavbar />

      {/* Hero Section + Interactive "Tap-to-Cloud" Split Simulator */}
      <LandingHeroSimulator />

      {/* Dual-Vertical Engine: Ristorazione vs Retail ERP */}
      <LandingDualVertical />

      {/* Interactive 5-Card Bento Grid */}
      <LandingBentoGrid />

      {/* 3-Step Architecture Flow */}
      <LandingArchitectureFlow />

      {/* Cost Consolidation & ROI Calculator */}
      <LandingCostComparison />

      {/* Live Lead Capture Form wired to /api/leads */}
      <LandingLeadCapture />

      {/* Monumental Enterprise Footer */}
      <LandingFooter />
    </main>
  );
}

import AnnouncementBar from '@/components/homepage/AnnouncementBar';
import Navbar from '@/components/homepage/Navbar';
import Hero from '@/components/homepage/Hero';
import { TrustStrip } from '@/components/homepage/TrustStrip';
import { ProblemSection } from '@/components/homepage/ProblemSection';
import { HowItWorks } from '@/components/homepage/HowItWorks';
import { Ecosystem } from '@/components/homepage/Ecosystem';
import FeatureCarousel from '@/components/homepage/FeatureCarousel';
import PhysicalDigitalSection from '@/components/homepage/PhysicalDigitalSection';
import Verticals from '@/components/homepage/Verticals';
import CustomerJourney from '@/components/homepage/CustomerJourney';
import DashboardShowcase from '@/components/homepage/DashboardShowcase';
import AISection from '@/components/homepage/AISection';
import OmnichannelSwitcher from '@/components/homepage/OmnichannelSwitcher';
import InteractiveScannerSimulator from '@/components/homepage/InteractiveScannerSimulator';
import FinalCTA from '@/components/homepage/FinalCTA';
import Footer from '@/components/homepage/Footer';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RIVO — Customer Experience connessa per il tuo business',
  description:
    'RIVO connette attività fisiche e clienti attraverso NFC, QR Code, CRM, loyalty, analytics e strumenti intelligenti per la customer experience.',
  openGraph: {
    title: 'RIVO — Customer Experience connessa per il tuo business',
    description:
      'RIVO connette attività fisiche e clienti attraverso NFC, QR Code, CRM, loyalty, analytics e strumenti intelligenti per la customer experience.',
    siteName: 'RIVO',
    type: 'website',
    locale: 'it_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RIVO — Customer Experience connessa per il tuo business',
    description:
      'RIVO connette attività fisiche e clienti attraverso NFC, QR Code, CRM, loyalty, analytics e strumenti intelligenti per la customer experience.',
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
    <main className="min-h-screen bg-[#09090B] text-zinc-100 overflow-x-hidden">
      <AnnouncementBar />
      <Navbar />
      <Hero />
      <TrustStrip />
      <OmnichannelSwitcher />
      <InteractiveScannerSimulator />
      <ProblemSection />
      <HowItWorks />
      <Ecosystem />
      <FeatureCarousel />
      <PhysicalDigitalSection />
      <Verticals />
      <CustomerJourney />
      <DashboardShowcase />
      <AISection />
      <FinalCTA />
      <Footer />
    </main>
  );
}

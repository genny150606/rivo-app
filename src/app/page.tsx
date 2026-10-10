import type { Metadata } from 'next';
import HomeNavbar from '@/components/home/Navbar';
import CustomCursor from '@/components/home/CustomCursor';
import HeroExperience from '@/components/home/HeroExperience';
import NfcPortal from '@/components/home/NfcPortal';
import ExperienceSystem from '@/components/home/ExperienceSystem';
import TableEventSequence from '@/components/home/TableEventSequence';
import PhysicalWorld from '@/components/home/PhysicalWorld';
import ReviewShield from '@/components/home/ReviewShield';
import AIExperience from '@/components/home/AIExperience';
import DataIntelligence from '@/components/home/DataIntelligence';
import IndustryScenes from '@/components/home/IndustryScenes';
import FinalReveal from '@/components/home/FinalReveal';

export const metadata: Metadata = {
  title: 'RIVO — The Physical World Just Got An Interface',
  description:
    'RIVO trasforma ogni touchpoint fisico (tavoli, banconi, porte, prodotti, camere, ricevute) in un’interfaccia digitale tramite NFC e QR: Google Reviews, Review Shield, Wi-Fi Capture, Loyalty, Menu, CRM e AI.',
  openGraph: {
    title: 'RIVO — The Physical World Just Got An Interface',
    description:
      'Turn every physical touchpoint into a digital experience. B2B NFC & QR platform for hospitality, retail and luxury.',
    siteName: 'RIVO',
    type: 'website',
    locale: 'it_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RIVO — The Physical World Just Got An Interface',
    description:
      'Turn every physical touchpoint into a digital experience with RIVO NFC & QR infrastructure.',
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
    <main className="min-h-screen bg-[#020204] text-zinc-100 overflow-x-hidden selection:bg-[#BFFF00] selection:text-black">
      {/* Custom Fluid Precision Cursor (desktop only) */}
      <CustomCursor />

      {/* Ultra-Minimalist Cinematic Navigation */}
      <HomeNavbar />

      {/* 1. Hero Experience: "Everything Starts With A Touch" */}
      <HeroExperience />

      {/* 2. First Reveal & Camera Dolly: Physical to Digital Portal */}
      <NfcPortal />

      {/* 3. The RIVO Experience System: Living Constellation */}
      <ExperienceSystem />

      {/* 4. One Tap → Everything Happens: Restaurant Table Event Sequence */}
      <TableEventSequence />

      {/* 5. The Physical World: Multi-Surface Metamorphosis */}
      <PhysicalWorld />

      {/* 6. Review Shield: Interactive Cinematic Reputation Demo */}
      <ReviewShield />

      {/* 7. AI Core: "And RIVO Doesn't Just Collect Data. It Understands It." */}
      <AIExperience />

      {/* 8. Data → Intelligence: Live Dashboard Construction */}
      <DataIntelligence />

      {/* 9. Industries Metamorphosis: Fluid Sector Morphing */}
      <IndustryScenes />

      {/* 10. Final Reveal: Monolith & Minimalist Footer */}
      <FinalReveal />
    </main>
  );
}

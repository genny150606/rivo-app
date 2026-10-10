import type { Metadata } from 'next';
import CustomCursor from '@/components/home/CustomCursor';
import UniverseHeader from '@/components/universe/UniverseHeader';
import UniverseBackground3D from '@/components/universe/UniverseBackground3D';
import SectionNucleus from '@/components/universe/SectionNucleus';
import SectionRestaurant from '@/components/universe/SectionRestaurant';
import SectionRetail from '@/components/universe/SectionRetail';
import SectionAI from '@/components/universe/SectionAI';
import SectionMaps from '@/components/universe/SectionMaps';
import SectionStaff from '@/components/universe/SectionStaff';
import SectionEcosystem from '@/components/universe/SectionEcosystem';
import SectionFinalCTA from '@/components/universe/SectionFinalCTA';

export const metadata: Metadata = {
  title: 'RIVO — The Interactive Universe',
  description:
    'RIVO connects physical customer interactions with digital experiences and business tools. Transform tables, counters, products and venues into an intelligent interface.',
  openGraph: {
    title: 'RIVO — The Interactive Universe',
    description:
      'Enter the RIVO digital universe: 3D interactive Nucleus connecting Restaurant, Retail, AI, Maps, Staff, and Data.',
    siteName: 'RIVO',
    type: 'website',
    locale: 'it_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RIVO — The Interactive Universe',
    description:
      'RIVO connects physical customer interactions with digital experiences and business tools.',
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
      {/* Precision fluid custom cursor (desktop only) */}
      <CustomCursor />

      {/* Fixed 3D WebGL Background: RIVO Nucleus & Spatial Nodes responding to native scroll */}
      <UniverseBackground3D />

      {/* Persistent Floating Command Navigation */}
      <UniverseHeader />

      {/* 1. THE NUCLEUS — Hero & 5-Second Instant Product Comprehension */}
      <SectionNucleus />

      {/* 2. RESTAURANT — Physical Table NFC to Live Guest OS */}
      <SectionRestaurant />

      {/* 3. RETAIL — Product Laser Scanning to Structured Digital Inventory */}
      <SectionRetail />

      {/* 4. RIVO AI — Neural Decision Pipeline (Input → Context → Reasoning → Action) */}
      <SectionAI />

      {/* 5. MAPS & LOCATIONS — Multi-Venue Footprint & Real-Time Table Topology */}
      <SectionMaps />

      {/* 6. STAFF & OPERATIONS — Smartwatch Service Dispatch & Table Routing */}
      <SectionStaff />

      {/* 7. THE ECOSYSTEM — Unified OS Telemetry & Hourly Physical Traffic Peaks */}
      <SectionEcosystem />

      {/* 8. FINAL CTA — Monolithic Closing Emblem, Direct Action, and Minimal Footer */}
      <SectionFinalCTA />
    </main>
  );
}

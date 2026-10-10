import type { Metadata } from 'next';
import UniverseMaster from '@/components/universe/UniverseMaster';
import CustomCursor from '@/components/home/CustomCursor';

export const metadata: Metadata = {
  title: 'RIVO — The Interactive Universe',
  description:
    'RIVO is the interactive digital universe connecting physical businesses with digital experiences, AI, retail operations, customer data, maps, and staff management.',
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
      'Enter the RIVO digital universe: 3D interactive Nucleus connecting Restaurant, Retail, AI, Maps, Staff, and Data.',
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
    <main className="w-screen h-screen overflow-hidden bg-[#020204] text-zinc-100 selection:bg-[#BFFF00] selection:text-black">
      {/* Precision fluid custom cursor */}
      <CustomCursor />

      {/* The Master RIVO Interactive Universe */}
      <UniverseMaster />
    </main>
  );
}

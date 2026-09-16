import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#09090B',
};

export const metadata: Metadata = {
  title: 'RIVO — B2B NFC & QR Platform',
  description: 'Physical touchpoint analytics and review automation',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RIVO',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" data-scroll-behavior="smooth" className="dark bg-[#09090B] text-zinc-100 antialiased">
      <body className={`${inter.className} min-h-screen bg-[#09090B] flex flex-col`}>
        {children}
      </body>
    </html>
  );
}

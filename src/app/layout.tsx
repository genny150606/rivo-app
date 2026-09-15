import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RIVO — B2B NFC & QR Platform',
  description: 'Physical touchpoint analytics and review automation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark h-full bg-[#09090B] text-zinc-100 antialiased">
      <body className={`${inter.className} min-h-screen bg-[#09090B] flex flex-col`}>
        {children}
      </body>
    </html>
  );
}

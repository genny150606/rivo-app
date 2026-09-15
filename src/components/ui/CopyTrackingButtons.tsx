'use client';

import { useState } from 'react';
import { Check, Radio, QrCode } from 'lucide-react';

interface CopyTrackingButtonsProps {
  uniqueCode: string;
}

export default function CopyTrackingButtons({ uniqueCode }: CopyTrackingButtonsProps) {
  const [copiedType, setCopiedType] = useState<'nfc' | 'qr' | null>(null);

  const copyUrl = (type: 'nfc' | 'qr') => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rivo-app-ten.vercel.app';
    const trackingUrl = `${baseUrl}/t/${uniqueCode}?source=${type}`;
    navigator.clipboard.writeText(trackingUrl);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => copyUrl('nfc')}
        title="Copia link per chip NFC"
        aria-label="Copia link per chip NFC"
        className="min-h-[44px] px-3.5 py-2 text-xs rounded-lg bg-[#18181B] hover:bg-zinc-800 border border-[#27272A] text-zinc-300 hover:text-white flex items-center gap-2 transition-all active:scale-95 touch-press"
      >
        {copiedType === 'nfc' ? (
          <>
            <Check className="w-4 h-4 text-[#BFFF00] shrink-0" />
            <span className="text-[#BFFF00] font-medium">NFC Copiato!</span>
          </>
        ) : (
          <>
            <Radio className="w-4 h-4 text-[#BFFF00] shrink-0" />
            <span>Copia NFC</span>
          </>
        )}
      </button>

      <button
        onClick={() => copyUrl('qr')}
        title="Copia link per QR Code"
        aria-label="Copia link per QR Code"
        className="min-h-[44px] px-3.5 py-2 text-xs rounded-lg bg-[#18181B] hover:bg-zinc-800 border border-[#27272A] text-zinc-400 hover:text-white flex items-center gap-2 transition-all active:scale-95 touch-press"
      >
        {copiedType === 'qr' ? (
          <>
            <Check className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-blue-400 font-medium">QR Copiato!</span>
          </>
        ) : (
          <>
            <QrCode className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Copia QR</span>
          </>
        )}
      </button>
    </div>
  );
}

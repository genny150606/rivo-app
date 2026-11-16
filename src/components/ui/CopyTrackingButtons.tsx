'use client';

import { useState } from 'react';
import { Check, Radio, QrCode } from 'lucide-react';

interface CopyTrackingButtonsProps {
  uniqueCode: string;
}

export default function CopyTrackingButtons({ uniqueCode }: CopyTrackingButtonsProps) {
  const [copiedType, setCopiedType] = useState<'nfc' | 'qr' | null>(null);

  const copyUrl = (type: 'nfc' | 'qr') => {
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : 'https://rivo-app-ten.vercel.app';
    const trackingUrl = `${baseUrl}/t/${uniqueCode}?source=${type}`;
    navigator.clipboard.writeText(trackingUrl);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => copyUrl('nfc')}
        title="Copia link per chip NFC"
        aria-label="Copia link per chip NFC"
        className="min-h-[44px] px-3.5 py-2 text-xs font-medium rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)] flex items-center gap-2 transition-[background-color,border-color,transform] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 cursor-pointer"
      >
        {copiedType === 'nfc' ? (
          <>
            <Check className="w-4 h-4 text-[var(--rivo-volt-text)] shrink-0" strokeWidth={1.75} />
            <span className="text-[var(--rivo-volt-text)] font-mono font-semibold">
              NFC Copiato
            </span>
          </>
        ) : (
          <>
            <Radio className="w-4 h-4 text-[var(--rivo-volt-text)] shrink-0" strokeWidth={1.75} />
            <span>Copia NFC</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => copyUrl('qr')}
        title="Copia link per QR Code"
        aria-label="Copia link per QR Code"
        className="min-h-[44px] px-3.5 py-2 text-xs font-medium rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-[background-color,border-color,transform] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 cursor-pointer"
      >
        {copiedType === 'qr' ? (
          <>
            <Check className="w-4 h-4 text-[var(--accent-telemetry-text)] shrink-0" strokeWidth={1.75} />
            <span className="text-[var(--accent-telemetry-text)] font-mono font-semibold">
              QR Copiato
            </span>
          </>
        ) : (
          <>
            <QrCode className="w-4 h-4 text-[var(--accent-telemetry-text)] shrink-0" strokeWidth={1.75} />
            <span>Copia QR</span>
          </>
        )}
      </button>
    </div>
  );
}

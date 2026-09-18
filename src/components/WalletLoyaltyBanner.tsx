'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  QrCode, 
  AlertCircle, 
  Loader2,
  Smartphone
} from 'lucide-react';

interface WalletLoyaltyBannerProps {
  cardId: string;
  organizationId: string;
  customerName?: string | null;
  stampsCount: number;
  maxStamps: number;
  rewardText?: string | null;
  orgName?: string;
  accentColor?: string;
}

export default function WalletLoyaltyBanner({
  cardId,
  organizationId,
  customerName,
  stampsCount,
  maxStamps,
  rewardText,
  orgName = 'Locale Partner',
  accentColor = '#BFFF00',
}: WalletLoyaltyBannerProps) {
  const [platform, setPlatform] = useState<'apple' | 'google' | 'other'>('other');
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQrFallback, setShowQrFallback] = useState<boolean>(false);

  // User-Agent detection on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/i.test(ua);

    if (isIOS) {
      setPlatform('apple');
    } else if (isAndroid) {
      setPlatform('google');
    } else {
      setPlatform('other');
    }

    // Check local storage cache
    const cacheKey = `rivo_wallet_added_${cardId}`;
    if (localStorage.getItem(cacheKey) === 'true') {
      setIsAdded(true);
    }
  }, [cardId]);

  const handleSaveToAppleWallet = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // In iOS Safari, navigation directly to the .pkpass endpoint triggers native Apple Wallet modal
      const passUrl = `/api/wallet/apple/${cardId}?org_id=${organizationId}`;
      
      // Cache addition state
      localStorage.setItem(`rivo_wallet_added_${cardId}`, 'true');
      setIsAdded(true);

      // Trigger native download
      window.location.href = passUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossibile scaricare il pass Apple Wallet';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToGoogleWallet = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/wallet/google/${cardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          customer_name: customerName,
          stamps_count: stampsCount,
          max_stamps: maxStamps,
          reward_text: rewardText,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.saveUrl) {
        throw new Error(data.error || 'Impossibile generare il pass Google Wallet');
      }

      localStorage.setItem(`rivo_wallet_added_${cardId}`, 'true');
      setIsAdded(true);

      // Redirect to official Google Wallet Save URL
      window.location.href = data.saveUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore durante la creazione del pass Google Wallet';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-[#18181B] via-[#121214] to-black rounded-3xl border border-white/10 p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-3.5">
      {/* Glow ambient background */}
      <div 
        className="absolute -top-10 -right-10 w-36 h-36 blur-2xl opacity-15 pointer-events-none rounded-full"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
            <Smartphone className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-white">
                Salva nel tuo Wallet
              </h4>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                Zero-App
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Tieni i tuoi timbri sempre a portata di mano con notifiche di prossimità
            </p>
          </div>
        </div>

        {isAdded && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Aggiunto</span>
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Buttons based on User-Agent */}
      <div className="relative z-10 pt-1">
        {/* iOS / Safari -> Official Apple Wallet Badge */}
        {platform === 'apple' && (
          <button
            type="button"
            disabled={loading}
            onClick={handleSaveToAppleWallet}
            className="w-full h-12 rounded-xl bg-black border border-white/20 hover:border-white/40 text-white font-medium text-xs flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            ) : (
              <>
                {/* Official Apple Wallet Card Icon SVG */}
                <svg className="w-6 h-6" viewBox="0 0 50 32" fill="none">
                  <rect width="50" height="32" rx="4" fill="#000" />
                  <path d="M12 6h26a2 2 0 0 1 2 2v1h-30v-1a2 2 0 0 1 2-2z" fill="#007AFF" />
                  <path d="M10 11h30v2H10v-2z" fill="#34C759" />
                  <path d="M10 15h30v2H10v-2z" fill="#FF9500" />
                  <path d="M10 19h30a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z" fill="#FF2D55" />
                </svg>
                <span className="font-semibold tracking-tight text-sm">
                  {isAdded ? 'Aggiorna in Apple Wallet' : 'Aggiungi a Apple Wallet'}
                </span>
              </>
            )}
          </button>
        )}

        {/* Android / Chrome -> Official Google Wallet Badge */}
        {platform === 'google' && (
          <button
            type="button"
            disabled={loading}
            onClick={handleSaveToGoogleWallet}
            className="w-full h-12 rounded-xl bg-[#1F1F1F] border border-[#3C4043] hover:border-[#5F6368] text-white font-medium text-xs flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            ) : (
              <>
                {/* Official Google Wallet G Logo SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="font-medium text-sm">
                  {isAdded ? 'Visualizza in Google Wallet' : 'Salva in Google Wallet'}
                </span>
              </>
            )}
          </button>
        )}

        {/* Desktop / Fallback -> Dual selector */}
        {platform === 'other' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleSaveToAppleWallet}
              className="py-2.5 px-3 rounded-xl bg-black border border-white/20 hover:border-white/40 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Apple Wallet</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSaveToGoogleWallet}
              className="py-2.5 px-3 rounded-xl bg-[#1F1F1F] border border-white/10 hover:border-white/30 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Wallet</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-info banner */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/5">
        <span>Valido presso: <strong className="text-zinc-400">{orgName}</strong></span>
        <span>{stampsCount} / {maxStamps} Timbri</span>
      </div>
    </div>
  );
}

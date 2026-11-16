'use client';

import { useState, useSyncExternalStore } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  AlertCircle,
  Loader2,
  Smartphone,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui';

type WalletPlatform = 'apple' | 'google' | 'other';

const noopSubscribe = () => () => {};

function getClientPlatform(): WalletPlatform {
  if (typeof window === 'undefined') return 'other';
  const ua =
    navigator.userAgent ||
    navigator.vendor ||
    (window as unknown as { opera?: string }).opera ||
    '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'apple';
  if (/android/i.test(ua)) return 'google';
  return 'other';
}

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
  const platform = useSyncExternalStore<WalletPlatform>(
    noopSubscribe,
    getClientPlatform,
    () => 'other'
  );
  const cachedAdded = useSyncExternalStore<boolean>(
    noopSubscribe,
    () => {
      try {
        return localStorage.getItem(`rivo_wallet_added_${cardId}`) === 'true';
      } catch {
        return false;
      }
    },
    () => false
  );

  const [justAdded, setJustAdded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdded = justAdded || cachedAdded;

  const handleSaveToAppleWallet = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // In iOS Safari, navigation directly to the .pkpass endpoint triggers native Apple Wallet modal
      const passUrl = new URL(
        `/api/wallet/apple/${cardId}?org_id=${organizationId}`,
        window.location.origin
      ).toString();

      // Cache addition state
      localStorage.setItem(`rivo_wallet_added_${cardId}`, 'true');
      setJustAdded(true);

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
      setJustAdded(true);

      // Redirect to official Google Wallet Save URL
      window.location.href = data.saveUrl;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Errore durante la creazione del pass Google Wallet';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 sm:p-5 relative overflow-hidden space-y-3.5"
      style={{ borderTopWidth: '2px', borderTopColor: accentColor }}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-warning-text)] shrink-0">
            <Smartphone className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="font-display text-xs sm:text-sm font-bold text-[var(--text-primary)] tracking-tight">
                Salva nel tuo Wallet
              </h4>
              <StatusBadge tone="volt" shape="pill" mono>
                Zero-App
              </StatusBadge>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
              Tieni i tuoi timbri sempre a portata di mano con notifiche di prossimità
            </p>
          </div>
        </div>

        {isAdded && (
          <StatusBadge tone="operational" icon={CheckCircle2} mono>
            Aggiunto
          </StatusBadge>
        )}
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-2.5 rounded-lg bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-xs text-[var(--accent-critical-text)] flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Buttons based on User-Agent */}
      <div className="pt-1">
        {/* iOS / Safari -> Official Apple Wallet Badge */}
        {platform === 'apple' && (
          <button
            type="button"
            disabled={loading}
            onClick={handleSaveToAppleWallet}
            className="w-full min-h-[48px] rounded-xl bg-[#09090B] border border-[#32353E] hover:border-[#71717A] text-white font-medium text-xs flex items-center justify-center gap-2.5 active:scale-[0.98] transition-[border-color,transform] duration-[180ms] cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" aria-hidden="true" />
            ) : (
              <>
                {/* Official Apple Wallet Card Icon SVG */}
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 50 32" fill="none" aria-hidden="true">
                  <rect width="50" height="32" rx="4" fill="#000" />
                  <path d="M12 6h26a2 2 0 0 1 2 2v1h-30v-1a2 2 0 0 1 2-2z" fill="#007AFF" />
                  <path d="M10 11h30v2H10v-2z" fill="#34C759" />
                  <path d="M10 15h30v2H10v-2z" fill="#FF9500" />
                  <path
                    d="M10 19h30a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z"
                    fill="#FF2D55"
                  />
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
            className="w-full min-h-[48px] rounded-xl bg-[#1F1F1F] border border-[#3C4043] hover:border-[#5F6368] text-white font-medium text-xs flex items-center justify-center gap-2.5 active:scale-[0.98] transition-[border-color,transform] duration-[180ms] cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" aria-hidden="true" />
            ) : (
              <>
                {/* Official Google Wallet G Logo SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleSaveToAppleWallet}
              className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#09090B] border border-[#32353E] hover:border-[#71717A] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-[border-color,transform] duration-[180ms] active:scale-[0.98] disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5 text-[#60A5FA]" strokeWidth={1.75} aria-hidden="true" />
              <span>Apple Wallet</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSaveToGoogleWallet}
              className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-[background-color,border-color,transform] duration-[180ms] active:scale-[0.98] disabled:opacity-60"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[var(--accent-operational-text)]" strokeWidth={1.75} aria-hidden="true" />
              <span>Google Wallet</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-info banner */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
        <span className="truncate min-w-0">
          Valido presso: <strong className="text-[var(--text-secondary)]">{orgName}</strong>
        </span>
        <span className="font-mono tabular-nums font-semibold text-[var(--text-secondary)] shrink-0">
          {stampsCount} / {maxStamps} Timbri
        </span>
      </div>
    </div>
  );
}

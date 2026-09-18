'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { 
  CreditCard, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  ArrowLeft, 
  Search, 
  Gift, 
  AlertCircle, 
  Plus,
  Trophy,
  PartyPopper
} from 'lucide-react';
import {
  triggerHaptic,
  hapticImpact,
  hapticNotification,
  hapticSelection,
  hapticStamp,
  hapticReward,
  hapticConfirm,
} from '@/lib/haptics';
import Link from 'next/link';
import WalletLoyaltyBanner from '@/components/WalletLoyaltyBanner';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface LoyaltyPageProps {
  params: Promise<{ code: string }>;
}

export default function LoyaltyPage({ params }: LoyaltyPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code ? resolvedParams.code.toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<{ id: string; name: string; organization_id: string } | null>(null);
  const [org, setOrg] = useState<{
    name: string;
    logo_url: string | null;
    loyalty_reward_text: string | null;
  } | null>(null);

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [card, setCard] = useState<{
    id: string;
    customer_name: string | null;
    stamps_count: number;
    max_stamps: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newlyStampedIndex, setNewlyStampedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!code) {
        setLoading(false);
        return;
      }

      const { data: dev } = await supabase
        .from('devices')
        .select('id, name, organization_id')
        .eq('unique_code', code)
        .single();

      if (dev) {
        setDevice(dev);
        if (dev.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name, logo_url, loyalty_reward_text')
            .eq('id', dev.organization_id)
            .single();
          if (orgData) setOrg(orgData);
        }
      }
      setLoading(false);
    }

    loadData();
  }, [code]);

  const triggerConfettiCelebration = () => {
    try {
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#BFFF00', '#FACC15', '#38BDF8', '#FFFFFF', '#EC4899'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 65,
          angle: 60,
          spread: 60,
          origin: { x: 0.05, y: 0.7 },
          colors: ['#FACC15', '#F59E0B', '#BFFF00'],
        });
        confetti({
          particleCount: 65,
          angle: 120,
          spread: 60,
          origin: { x: 0.95, y: 0.7 },
          colors: ['#FACC15', '#F59E0B', '#BFFF00'],
        });
      }, 250);
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  };

  const handleLookupCard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!device || !phone.trim()) return;

    hapticSelection();
    setSearching(true);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/loyalty?organization_id=${encodeURIComponent(device.organization_id)}&contact=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json();
      if (res.ok && data.card) {
        setCard(data.card);
        setNewlyStampedIndex(null);
        if (data.card.stamps_count >= data.card.max_stamps) {
          hapticReward();
          setMessage('Traguardo raggiunto! Premio pronto per il ritiro al tavolo!');
          triggerConfettiCelebration();
        } else {
          hapticConfirm();
          setMessage(`Tessera trovata! Hai ${data.card.stamps_count} su ${data.card.max_stamps} timbri.`);
        }
      } else {
        hapticNotification('warning');
        setMessage('Nessuna tessera trovata per questo numero. Aggiungi il tuo primo timbro!');
      }
    } catch (err) {
      console.warn('Loyalty lookup error:', err);
      hapticNotification('error');
      setMessage('Errore durante la ricerca della tessera.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddStamp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!device || !phone.trim()) return;

    hapticSelection();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: device.organization_id,
          customer_contact: phone.trim(),
          customer_name: name.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.card) {
        const newCount = data.card.stamps_count;
        setCard(data.card);
        setNewlyStampedIndex(newCount - 1);

        if (newCount >= data.card.max_stamps) {
          hapticReward();
          setMessage('Traguardo completato! Il tuo premio è pronto da ritirare al tavolo!');
          triggerConfettiCelebration();
        } else {
          hapticStamp();
          setMessage(data.isNew ? 'Benvenuto! Primo timbro impresso sul tuo pass.' : 'Timbro a inchiostro impresso con successo!');
        }
      } else {
        hapticNotification('error');
        setMessage(data.error || 'Errore durante la timbratura.');
      }
    } catch (err) {
      console.warn('Loyalty error:', err);
      hapticNotification('error');
      setMessage('Errore di connessione. Riprova tra poco.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] flex items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#18181B] border border-[#27272A] flex items-center justify-center animate-pulse">
          <CreditCard className="w-7 h-7 text-emerald-400 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl border border-red-500/20 bg-red-500/10 flex items-center justify-center mb-3 text-red-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold">Dispositivo non trovato</h2>
        <Link
          href={`/hub/${code}`}
          className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-semibold touch-press active:scale-95 transition-all"
        >
          Torna all&apos;Hub
        </Link>
      </div>
    );
  }

  const maxStamps = card?.max_stamps || 10;
  const currentStamps = card?.stamps_count || 0;
  const isCompleted = currentStamps >= maxStamps;

  return (
    <div className="min-h-screen min-h-dvh h-screen sm:h-dvh bg-[#09090B] text-zinc-100 flex flex-col justify-between p-3 sm:p-5 overflow-y-auto relative selection:bg-[#BFFF00] selection:text-black">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* TOP NAVIGATION: BACK TO HUB */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between z-10 pt-1 pb-2">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all active:scale-95 touch-press min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Torna all&apos;Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] text-zinc-400">
          <CreditCard className="w-3 h-3 text-emerald-400" />
          <span className="text-white font-medium">{device.name}</span>
        </span>
      </nav>

      {/* MAIN CARD CONTAINER */}
      <main className="max-w-md w-full mx-auto my-auto py-1 z-10 space-y-3">
        {/* Title */}
        <div className="text-center space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {org?.name || 'Carta Fedeltà'}
          </h1>
          <p className="text-[11px] text-zinc-400">
            Colleziona timbri digitali con 1 tap al tavolo!
          </p>
        </div>

        {/* VISUAL DIGITAL FIDELITY PASS */}
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-[#121214] via-[#18181B] to-emerald-950/20 p-4 shadow-2xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 block">Fidelity Pass Ufficiale</span>
              <span className="text-sm font-bold text-white">{card?.customer_name || 'Pass Digitale'}</span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono font-bold">
              {currentStamps} / {maxStamps} Timbri
            </div>
          </div>

          {/* 10 STAMPS BUBBLE MATRIX (2 ROWS OF 5) */}
          <div className="grid grid-cols-5 gap-2 py-1">
            {Array.from({ length: maxStamps }).map((_, index) => {
              const isStamped = index < currentStamps;
              const isRewardSlot = index === maxStamps - 1;
              const isNewlyStamped = newlyStampedIndex === index;
              
              // Organic ink stamp rotation angles mimicking real physical hand stamping
              const stampRotations = [
                '-rotate-3',
                'rotate-2',
                '-rotate-2',
                'rotate-3',
                '-rotate-1',
                'rotate-2',
                '-rotate-3',
                'rotate-2',
                '-rotate-2',
                'rotate-1',
              ];
              const rotClass = stampRotations[index % stampRotations.length];

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (isStamped) {
                      hapticStamp();
                    } else if (isRewardSlot) {
                      if (isCompleted) {
                        hapticReward();
                        triggerConfettiCelebration();
                      } else {
                        hapticImpact('medium');
                      }
                    } else {
                      hapticImpact('light');
                    }
                  }}
                  aria-label={`Timbro ${index + 1}`}
                  className={`aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 select-none overflow-hidden cursor-pointer touch-press active:scale-95 ${
                    isStamped
                      ? `bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.35)] scale-100 ${
                          isNewlyStamped ? 'animate-stamp-bounce ring-4 ring-emerald-400/30' : ''
                        }`
                      : isRewardSlot
                      ? 'bg-amber-500/10 border-2 border-dashed border-amber-500/50 text-amber-400'
                      : 'bg-black/40 border border-zinc-800 text-zinc-600'
                  }`}
                >
                  {isStamped ? (
                    <div
                      className={`flex flex-col items-center justify-center transition-transform ${rotClass} ${
                        isNewlyStamped ? 'animate-stamp-bounce' : ''
                      }`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-emerald-300/80 bg-emerald-500/30 flex items-center justify-center shadow-inner">
                        {isRewardSlot ? (
                          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#BFFF00] stroke-[2.5]" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-300 stroke-[2.5]" />
                        )}
                      </div>
                      <span className="text-[8px] font-mono font-black text-emerald-400 tracking-tight mt-0.5 uppercase">
                        {index + 1}
                      </span>
                    </div>
                  ) : isRewardSlot ? (
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Gift className="w-5 h-5 animate-pulse text-amber-400" />
                      <span className="text-[8px] sm:text-[9px] font-mono font-bold text-amber-400/90">{index + 1}</span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-semibold text-zinc-600">{index + 1}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* REWARD BADGE: GOLDEN GLOW ON COMPLETION (10 TIMBRI) */}
          {isCompleted ? (
            <button
              type="button"
              onClick={() => {
                hapticReward();
                triggerConfettiCelebration();
              }}
              className="w-full text-left rounded-xl p-3 border-2 border-yellow-400 bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-500/20 animate-golden-glow flex flex-col gap-1.5 transition-all cursor-pointer touch-press active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-yellow-300">
                  <PartyPopper className="w-4 h-4 text-yellow-400 animate-bounce shrink-0" />
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Premio Sbloccato • Al Tavolo!
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-yellow-400/30 border border-yellow-400/60 text-[10px] font-extrabold text-yellow-200 uppercase tracking-tight flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-300" />
                  <span>Pronto al Ritiro</span>
                </span>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[11px] text-zinc-300">Il tuo omaggio:</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#BFFF00] drop-shadow-[0_0_8px_rgba(191,255,0,0.5)]">
                  {org?.loyalty_reward_text || 'Omaggio Esclusivo'}
                </span>
              </div>
              <p className="text-[10px] text-yellow-200/90 italic text-center pt-0.5">
                Mostra questa schermata al cameriere per ricevere il premio al tuo tavolo!
              </p>
            </button>
          ) : (
            <div className="bg-black/50 rounded-xl p-2.5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>Premio al 10° timbro:</span>
              </div>
              <span className="text-xs font-bold text-[#BFFF00]">
                {org?.loyalty_reward_text || 'Omaggio Esclusivo'}
              </span>
            </div>
          )}
        </div>

        {/* NATIVE DIGITAL WALLET PASS ENGINE (APPLE & GOOGLE WALLET ZERO-APP) */}
        {device && (
          <WalletLoyaltyBanner
            cardId={card?.id || 'demo_pass'}
            organizationId={device.organization_id}
            customerName={card?.customer_name || name || undefined}
            stampsCount={currentStamps}
            maxStamps={maxStamps}
            rewardText={org?.loyalty_reward_text}
            orgName={org?.name}
          />
        )}

        {/* LOOKUP / ADD STAMP FORM */}
        <div className="rounded-2xl border border-white/10 bg-[#121214] p-3.5 shadow-xl space-y-2.5">
          {message && (
            <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium animate-fade-in flex items-center justify-center gap-1.5 text-center">
              {isCompleted ? (
                <PartyPopper className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleAddStamp} className="space-y-2.5">
            {!card && (
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Il tuo Nome"
                  className="w-full min-h-[38px] bg-[#18181B] border border-[#27272A] rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            )}

            <div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Numero di Cellulare (es. 3331234567)"
                className="w-full min-h-[38px] bg-[#18181B] border border-[#27272A] rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* ACTION BUTTONS WITH TOUCH-PRESS & ACTIVE:SCALE-95 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleLookupCard}
                disabled={submitting || searching || !phone.trim()}
                className="w-full min-h-[42px] bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] hover:border-zinc-500 text-zinc-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 touch-press active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                <Search className="w-4 h-4 text-zinc-400" />
                <span>{searching ? 'Ricerca in corso...' : 'Cerca Tessera'}</span>
              </button>

              <button
                type="submit"
                disabled={submitting || searching || !phone.trim()}
                className="w-full min-h-[42px] bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 touch-press active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                <Plus className="w-4 h-4 text-black stroke-[3]" />
                <span>{submitting ? 'Impressione...' : 'Aggiungi Timbro'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-md mx-auto text-center pb-2 text-[11px] text-zinc-600 flex items-center justify-center gap-1">
        <span>Fidelity Pass Smart • Powered by </span>
        <strong className="text-zinc-400 font-semibold">RIVO</strong>
      </footer>
    </div>
  );
}

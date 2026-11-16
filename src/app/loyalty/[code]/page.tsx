'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CreditCard, 
  Award, 
  CheckCircle2, 
  ArrowLeft, 
  Search, 
  Gift, 
  AlertCircle, 
  Plus,
  Trophy,
  Loader2
} from 'lucide-react';
import {
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
            .from('public_organizations')
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
        <div className="w-14 h-14 rounded-2xl bg-[#111114] border border-[#27272A] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#BFFF00] animate-spin motion-reduce:animate-none" />
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
          className="mt-4 min-h-[48px] px-5 py-2.5 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-white/20 text-white text-xs font-semibold inline-flex items-center justify-center active:scale-95 transition-all"
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
    <div className="min-h-screen min-h-dvh bg-[#09090B] text-[#FAFAFA] flex flex-col justify-between p-4 sm:p-5 overflow-x-hidden relative selection:bg-[#BFFF00] selection:text-[#09090B]">
      {/* TOP NAVIGATION: BACK TO HUB */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between gap-2 z-10 pb-2">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3.5 min-h-[48px] rounded-xl bg-[#111114] hover:bg-[#18181B] border border-[#27272A] text-xs font-semibold text-zinc-200 hover:text-white transition-colors active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 text-[#BFFF00]" />
          <span>Torna all&apos;Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full bg-[#111114] border border-[#27272A] text-[11px] font-mono text-zinc-400 truncate max-w-[170px]">
          <CreditCard className="w-3.5 h-3.5 text-[#BFFF00] shrink-0" />
          <span className="text-white font-semibold truncate">{device.name}</span>
        </span>
      </nav>

      {/* MAIN CARD CONTAINER */}
      <main className="max-w-md w-full mx-auto my-auto py-2 z-10 space-y-3.5">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {org?.name || 'Carta Fedeltà'}
          </h1>
          <p className="text-xs text-zinc-400">
            Colleziona timbri digitali con 1 tap al tavolo
          </p>
        </div>

        {/* VISUAL DIGITAL FIDELITY PASS */}
        <div className="rounded-2xl border border-[#27272A] bg-[#111114] p-4 sm:p-5 relative overflow-hidden space-y-3.5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-2.5 gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#BFFF00] block">
                Fidelity Pass Ufficiale
              </span>
              <span className="text-sm font-bold text-white truncate block">
                {card?.customer_name || 'Pass Digitale'}
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[11px] text-emerald-300 font-mono font-bold tabular-nums shrink-0">
              {currentStamps} / {maxStamps} Timbri
            </div>
          </div>

          {/* 10 STAMPS BUBBLE MATRIX (2 ROWS OF 5) */}
          <div className="grid grid-cols-5 gap-2 py-1">
            {Array.from({ length: maxStamps }).map((_, index) => {
              const isStamped = index < currentStamps;
              const isRewardSlot = index === maxStamps - 1;
              const isNewlyStamped = newlyStampedIndex === index;

              // Organic ink stamp rotation angles mimicking physical hand stamping
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
                      } else {
                        hapticImpact('medium');
                      }
                    } else {
                      hapticImpact('light');
                    }
                  }}
                  aria-label={`Timbro ${index + 1}`}
                  className={`aspect-square min-h-[48px] rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 select-none overflow-hidden cursor-pointer active:scale-95 motion-reduce:transition-none ${
                    isStamped
                      ? `bg-emerald-500/15 border-2 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.28)] ${
                          isNewlyStamped ? 'animate-stamp-bounce ring-2 ring-[#BFFF00]/50 motion-reduce:animate-none' : ''
                        }`
                      : isRewardSlot
                      ? 'bg-amber-500/10 border-2 border-dashed border-amber-500/50 text-amber-400'
                      : 'bg-[#09090B] border border-[#27272A] text-zinc-500'
                  }`}
                >
                  {isStamped ? (
                    <div
                      className={`flex flex-col items-center justify-center transition-transform ${rotClass} ${
                        isNewlyStamped ? 'animate-stamp-bounce motion-reduce:animate-none' : ''
                      }`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-emerald-300/80 bg-emerald-500/25 flex items-center justify-center">
                        {isRewardSlot ? (
                          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#BFFF00] stroke-[2.5]" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
                        )}
                      </div>
                      <span className="text-[9px] font-mono font-black text-emerald-400 tracking-tight mt-0.5 tabular-nums">
                        {index + 1}
                      </span>
                    </div>
                  ) : isRewardSlot ? (
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Gift className="w-5 h-5 text-amber-400" />
                      <span className="text-[9px] font-mono font-bold text-amber-400 tabular-nums">{index + 1}</span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-semibold text-zinc-500 tabular-nums">{index + 1}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* REWARD BADGE ON COMPLETION (10 TIMBRI) */}
          {isCompleted ? (
            <button
              type="button"
              onClick={() => hapticReward()}
              className="w-full min-h-[48px] text-left rounded-xl p-3.5 border border-[#BFFF00]/60 bg-[#BFFF00]/10 flex flex-col gap-1.5 transition-all cursor-pointer active:scale-[0.98] relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[#BFFF00]">
                  <Trophy className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Premio Sbloccato • Al Tavolo
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#BFFF00] text-[10px] font-extrabold text-[#09090B] uppercase tracking-tight shrink-0">
                  Pronto al Ritiro
                </span>
              </div>
              <div className="flex items-center justify-between pt-0.5 gap-2">
                <span className="text-[11px] text-zinc-300">Il tuo omaggio:</span>
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  {org?.loyalty_reward_text || 'Omaggio Esclusivo'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 text-center pt-0.5">
                Mostra questa schermata al cameriere per ricevere il premio al tuo tavolo.
              </p>
            </button>
          ) : (
            <div className="bg-[#09090B] rounded-xl p-3 border border-[#27272A] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Premio al 10° timbro:</span>
              </div>
              <span className="text-xs font-bold text-[#BFFF00] text-right">
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
        <div className="rounded-2xl border border-[#27272A] bg-[#111114] p-4 shadow-xl space-y-3">
          {message && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-medium animate-fade-in flex items-center justify-center gap-2 text-center">
              {isCompleted ? (
                <Trophy className="w-4 h-4 text-[#BFFF00] shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleAddStamp} className="space-y-3">
            {!card && (
              <div>
                <label htmlFor="loyalty-name" className="sr-only">
                  Il tuo Nome
                </label>
                <input
                  id="loyalty-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Il tuo Nome"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#BFFF00]"
                />
              </div>
            )}

            <div>
              <label htmlFor="loyalty-phone" className="sr-only">
                Numero di Cellulare
              </label>
              <input
                id="loyalty-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Numero di Cellulare (es. 3331234567)"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleLookupCard}
                disabled={submitting || searching || !phone.trim()}
                className="w-full min-h-[48px] bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] hover:border-zinc-500 text-zinc-100 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <Search className="w-4 h-4 text-zinc-400" />
                <span>{searching ? 'Ricerca in corso...' : 'Cerca Tessera'}</span>
              </button>

              <button
                type="submit"
                disabled={submitting || searching || !phone.trim()}
                className="w-full min-h-[48px] bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] font-extrabold text-xs rounded-xl shadow-lg shadow-[#BFFF00]/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{submitting ? 'Impressione...' : 'Aggiungi Timbro'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Hardware RIVO Footer Badge */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111114] border border-[#27272A] text-[11px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
          <span>Fidelity Pass Smart • Powered by</span>
          <strong className="text-white font-bold tracking-wide">RIVO</strong>
        </div>
      </footer>
    </div>
  );
}

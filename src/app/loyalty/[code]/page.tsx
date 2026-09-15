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
  Plus
} from 'lucide-react';
import Link from 'next/link';

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
  const [message, setMessage] = useState<string | null>(null);

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

  const handleLookupOrAddStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device || !phone.trim()) return;

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
        setCard(data.card);
        setMessage(data.message || 'Timbro aggiunto con successo!');
        if (data.card.stamps_count >= data.card.max_stamps) {
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#BFFF00', '#FACC15', '#38BDF8', '#FFFFFF'],
            });
          } catch (e) {
            console.warn(e);
          }
        }
      }
    } catch (err) {
      console.warn('Loyalty error:', err);
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
          className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-semibold"
        >
          Torna all&apos;Hub
        </Link>
      </div>
    );
  }

  const maxStamps = card?.max_stamps || 10;
  const currentStamps = card?.stamps_count || 0;

  return (
    <div className="min-h-screen min-h-dvh h-screen sm:h-dvh bg-[#09090B] text-zinc-100 flex flex-col justify-between p-3 sm:p-5 overflow-y-auto relative selection:bg-[#BFFF00] selection:text-black">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* TOP NAVIGATION: BACK TO HUB */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between z-10 pt-1 pb-2">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all active:scale-95 min-h-[40px]"
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
              return (
                <div
                  key={index}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                    isStamped
                      ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)] scale-105'
                      : isRewardSlot
                      ? 'bg-amber-500/10 border-2 border-dashed border-amber-500/40 text-amber-400'
                      : 'bg-black/40 border border-zinc-800 text-zinc-700'
                  }`}
                >
                  {isStamped ? (
                    <CheckCircle2 className="w-5 h-5 animate-scale-in" />
                  ) : isRewardSlot ? (
                    <Gift className="w-5 h-5 animate-pulse" />
                  ) : (
                    <span className="text-xs font-mono font-semibold">{index + 1}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-black/50 rounded-xl p-2.5 border border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-zinc-400">Premio finale:</span>
            <span className="text-xs font-bold text-[#BFFF00]">{org?.loyalty_reward_text || 'Omaggio Esclusivo'}</span>
          </div>
        </div>

        {/* LOOKUP / ADD STAMP FORM */}
        <div className="rounded-2xl border border-white/10 bg-[#121214] p-3.5 shadow-xl space-y-2.5">
          {message && (
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] text-center font-medium animate-fade-in">
              {message}
            </div>
          )}

          <form onSubmit={handleLookupOrAddStamp} className="space-y-2">
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[42px] bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Aggiornamento...' : 'Aggiungi Timbro di Oggi'}</span>
            </button>
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

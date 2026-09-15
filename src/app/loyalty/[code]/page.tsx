'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { 
  CreditCard, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Plus, 
  Search, 
  Coffee, 
  Gift, 
  Smartphone,
  ChevronRight
} from 'lucide-react';

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
  const [device, setDevice] = useState<{ id: string; organization_id: string } | null>(null);
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
        .select('id, organization_id')
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
        if (data.card.stamps_count >= data.card.max_stamps) {
          try {
            confetti({
              particleCount: 120,
              spread: 90,
              origin: { y: 0.5 },
              colors: ['#BFFF00', '#38BDF8', '#FACC15'],
            });
          } catch (e) {
            console.warn(e);
          }
          setMessage('🎉 COMPLIMENTI! Hai completato la tessera e sbloccato il premio!');
        } else {
          setMessage(`✅ Timbro registrato con successo! (${data.card.stamps_count}/${data.card.max_stamps})`);
        }
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
        <div className="w-12 h-12 border-2 border-[#BFFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stampsCount = card ? card.stamps_count : 0;
  const maxStamps = card ? card.max_stamps : 10;
  const rewardText = org?.loyalty_reward_text || 'Caffè o Dessert omaggio con 10 timbri';

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 selection:bg-[#BFFF00] selection:text-black">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#BFFF00]/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="max-w-md w-full mx-auto text-center pt-4 sm:pt-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18181B] border border-[#27272A] text-[11px] font-semibold text-[#BFFF00] mb-3">
          <Award className="w-3.5 h-3.5" />
          <span>Carta Fedeltà Digitale</span>
        </span>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {org?.name || 'Tessera Fedeltà'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Raccogli i timbri a ogni visita senza dover portare la tessera di carta!
        </p>
      </div>

      {/* Main card */}
      <div className="max-w-md w-full mx-auto my-auto py-6 space-y-5">
        {/* Apple Wallet Style Digital Card */}
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-[#18181B] via-[#141416] to-[#0E0E10] p-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#BFFF00] text-black font-bold flex items-center justify-center text-sm shadow-md shadow-[#BFFF00]/20">
                R
              </div>
              <span className="text-sm font-bold text-white tracking-wide">
                {org?.name || 'RIVO Club'}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#BFFF00]/15 text-[#BFFF00] border border-[#BFFF00]/30">
              LOYALTY PASS
            </span>
          </div>

          {/* 10 Stamps Grid */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Progresso Timbri</span>
              <span className="font-bold text-white">{stampsCount} / {maxStamps}</span>
            </div>

            <div className="grid grid-cols-5 gap-2.5 pt-1">
              {Array.from({ length: maxStamps }).map((_, i) => {
                const isStamped = i < stampsCount;
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                      isStamped
                        ? 'bg-[#BFFF00] text-black shadow-lg shadow-[#BFFF00]/30 scale-105'
                        : 'bg-[#18181B] border border-zinc-800 text-zinc-600'
                    }`}
                  >
                    {isStamped ? (
                      <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                    ) : (
                      <span className="text-xs font-mono font-semibold">{i + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reward Footer */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-zinc-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#BFFF00]/15 text-[#BFFF00] flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block font-semibold">PREMIO AL TRAGUARDO</span>
              <span className="text-xs font-bold text-white">{rewardText}</span>
            </div>
          </div>
        </div>

        {/* Input form: Enter phone to add stamp or view card */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#BFFF00]" />
            <h2 className="text-sm font-bold text-white">Aggiorna la tua Tessera</h2>
          </div>

          <form onSubmit={handleLookupOrAddStamp} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Numero di Cellulare <span className="text-[#BFFF00]">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+39 340 1234567"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Il tuo Nome (opzionale)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mario Rossi"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 touch-press shadow-lg shadow-[#BFFF00]/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Aggiornamento...' : 'Aggiungi Timbro di Oggi'}</span>
            </button>
          </form>

          {message && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center pb-4 text-[11px] text-zinc-600">
        <span>Fidelity Pass Digitale • Powered by </span>
        <strong className="text-zinc-400 font-semibold">RIVO</strong>
      </footer>
    </div>
  );
}

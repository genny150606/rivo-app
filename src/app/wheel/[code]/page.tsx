'use client';

import { useEffect, useState, useRef, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Copy,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const REWARDS = [
  { label: 'Calice 🍷', color: '#18181B', textColor: '#BFFF00' },
  { label: 'Dessert 🍰', color: '#121214', textColor: '#FFFFFF' },
  { label: 'Sconto 15% 🏷️', color: '#18181B', textColor: '#38BDF8' },
  { label: 'Caffè ☕', color: '#121214', textColor: '#FACC15' },
  { label: 'Antipasto 🍕', color: '#18181B', textColor: '#4ADE80' },
  { label: 'Brindisi 🍾', color: '#121214', textColor: '#F472B6' },
];

interface WheelPageProps {
  params: Promise<{ code: string }>;
}

export default function WheelPage({ params }: WheelPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code ? resolvedParams.code.toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<{ id: string; name: string; organization_id: string } | null>(null);
  const [org, setOrg] = useState<{ name: string; logo_url: string | null } | null>(null);

  // Wheel State
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<string | null>(null);

  // Claim Form
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimedCoupon, setClaimedCoupon] = useState<{
    code: string;
    reward: string;
    expires_at: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

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
            .select('name, logo_url')
            .eq('id', dev.organization_id)
            .single();
          if (orgData) setOrg(orgData);
        }
      }
      setLoading(false);
    }

    loadData();
  }, [code]);

  const spinWheel = () => {
    if (spinning || wonReward) return;

    setSpinning(true);

    const extraDegrees = Math.floor(Math.random() * 360);
    const totalRotation = rotation + 1800 + extraDegrees;
    setRotation(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      const normalizedDegrees = (360 - (totalRotation % 360)) % 360;
      const winningIndex = Math.floor(normalizedDegrees / 60);
      const reward = REWARDS[winningIndex]?.label || REWARDS[0].label;
      setWonReward(reward);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#BFFF00', '#FACC15', '#38BDF8', '#FFFFFF'],
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }, 4000);
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device || !wonReward || !contact.trim()) return;

    setClaiming(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: device.organization_id,
          reward: wonReward,
          customer_name: name.trim() || null,
          customer_contact: contact.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.coupon) {
        setClaimedCoupon(data.coupon);
      }
    } catch (err) {
      console.warn('Claim error:', err);
    } finally {
      setClaiming(false);
    }
  };

  const copyVoucher = () => {
    if (claimedCoupon?.code && navigator.clipboard) {
      navigator.clipboard.writeText(claimedCoupon.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] flex items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#18181B] border border-[#27272A] flex items-center justify-center animate-pulse">
          <Sparkles className="w-7 h-7 text-[#BFFF00] animate-spin" />
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

  return (
    <div className="min-h-screen min-h-dvh h-screen sm:h-dvh bg-[#09090B] text-zinc-100 flex flex-col justify-between p-3 sm:p-5 overflow-y-auto relative selection:bg-[#BFFF00] selection:text-black">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#BFFF00]/10 blur-[120px] pointer-events-none rounded-full" />

      {/* TOP NAVIGATION: BACK TO HUB */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between z-10 pt-1 pb-2">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all active:scale-95 min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4 text-[#BFFF00]" />
          <span>Torna all&apos;Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] text-zinc-400">
          <Sparkles className="w-3 h-3 text-[#BFFF00]" />
          <span className="text-white font-medium">{device.name}</span>
        </span>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-md w-full mx-auto my-auto py-1 z-10 space-y-3 text-center flex flex-col items-center">
        {/* Title */}
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {org?.name || 'Ruota della Fortuna'}
          </h1>
          <p className="text-[11px] text-zinc-400">
            Gira la ruota e riscatta un premio esclusivo!
          </p>
        </div>

        {!claimedCoupon ? (
          <div className="space-y-3.5 flex flex-col items-center w-full">
            {/* Visual Wheel Disc (Scaled so it fits 100% on screen) */}
            <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center my-1">
              {/* Pointer */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-[#BFFF00] drop-shadow-[0_0_8px_rgba(191,255,0,0.8)]" />

              {/* Spinning Disc */}
              <div
                className="w-full h-full rounded-full border-4 border-[#27272A] shadow-[0_0_30px_rgba(0,0,0,0.9)] relative overflow-hidden transition-transform duration-[4000ms] ease-out"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  background: 'conic-gradient(#18181B 0deg 60deg, #121214 60deg 120deg, #18181B 120deg 180deg, #121214 180deg 240deg, #18181B 240deg 300deg, #121214 300deg 360deg)',
                }}
              >
                {REWARDS.map((r, i) => {
                  const deg = i * 60 + 30;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 left-1/2 -translate-x-1/2 origin-bottom w-8 h-1/2 flex items-start justify-center pt-2 text-center"
                      style={{
                        transform: `rotate(${deg}deg)`,
                        transformOrigin: 'bottom center',
                      }}
                    >
                      <span
                        className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap -rotate-90 origin-center"
                        style={{ color: r.textColor }}
                      >
                        {r.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Center Cap */}
              <div className="absolute z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#18181B] border-2 border-[#BFFF00] flex items-center justify-center shadow-lg shadow-[#BFFF00]/20">
                <Gift className="w-5 h-5 text-[#BFFF00]" />
              </div>
            </div>

            {/* Spin CTA or Win Claim Form */}
            {!wonReward ? (
              <button
                type="button"
                onClick={spinWheel}
                disabled={spinning}
                className="w-full max-w-xs min-h-[46px] bg-[#BFFF00] hover:bg-[#a8e000] text-black font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all shadow-xl shadow-[#BFFF00]/20 flex items-center justify-center gap-2 touch-press active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{spinning ? 'La ruota gira...' : 'GIRA LA RUOTA ADESSO!'}</span>
              </button>
            ) : (
              /* CLAIM FORM */
              <div className="w-full max-w-sm rounded-2xl border border-[#BFFF00]/40 bg-[#121214] p-4 text-center space-y-2.5 shadow-2xl animate-fade-in">
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#BFFF00] bg-[#BFFF00]/10 px-2.5 py-0.5 rounded-full">
                  <span>🎉 Hai Vinto:</span>
                  <span className="text-white underline">{wonReward}</span>
                </div>

                <form onSubmit={handleClaim} className="space-y-2 text-left pt-1">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400 mb-0.5">Il tuo Nome</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Mario Rossi"
                      className="w-full min-h-[38px] bg-[#18181B] border border-[#27272A] rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-[#BFFF00]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-zinc-400 mb-0.5">Cellulare o Email *</label>
                    <input
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="333 1234567 oppure email"
                      className="w-full min-h-[38px] bg-[#18181B] border border-[#27272A] rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-[#BFFF00]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={claiming}
                    className="w-full min-h-[42px] bg-[#BFFF00] hover:bg-[#a8e000] text-black font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>{claiming ? 'Generazione Voucher...' : 'Riscatta il tuo Voucher Ora'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* COUPON WON & READY TO COPY */
          <div className="w-full max-w-sm rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 to-[#121214] p-4 text-center space-y-3 shadow-2xl animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] text-[#BFFF00] font-bold uppercase tracking-wider block">Voucher Attivato!</span>
              <h3 className="text-base font-bold text-white mt-0.5">{claimedCoupon.reward}</h3>
            </div>

            <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="font-mono font-bold text-base text-[#BFFF00] tracking-wider">{claimedCoupon.code}</span>
              <button
                type="button"
                onClick={copyVoucher}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs text-white flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>

            <Link
              href={`/hub/${code}`}
              className="w-full py-2.5 rounded-xl bg-[#BFFF00] hover:bg-[#a8e000] text-black font-bold text-xs transition-all shadow-lg shadow-[#BFFF00]/20 flex items-center justify-center gap-1.5"
            >
              <span>Torna all&apos;Hub dei Servizi</span>
            </Link>
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-md mx-auto text-center pb-2 text-[11px] text-zinc-600 flex items-center justify-center gap-1">
        <span>Ruota Premi Smart • Powered by </span>
        <strong className="text-zinc-400 font-semibold">RIVO</strong>
      </footer>
    </div>
  );
}

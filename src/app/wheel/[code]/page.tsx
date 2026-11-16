'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Zap,
  Gift,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowLeft,
  Trophy,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const REWARDS = [
  { label: 'Calice di Vino', color: '#18191E', textColor: '#BFFF00' },
  { label: 'Dessert dello Chef', color: '#111215', textColor: '#FFFFFF' },
  { label: 'Sconto 15%', color: '#18191E', textColor: '#38BDF8' },
  { label: 'Caffè Speciale', color: '#111215', textColor: '#FACC15' },
  { label: 'Antipasto della Casa', color: '#18191E', textColor: '#4ADE80' },
  { label: 'Brindisi di Benvenuto', color: '#111215', textColor: '#FB923C' },
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
            .from('public_organizations')
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
        <div className="w-14 h-14 rounded-2xl bg-[#111215] border border-[#22242A] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#BFFF00] animate-spin motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] bg-rivo-grid text-[#F4F4F6] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl border border-red-500/20 bg-red-500/10 flex items-center justify-center mb-3 text-red-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold">Dispositivo non trovato</h2>
        <Link
          href={`/hub/${code}`}
          className="mt-4 min-h-[48px] px-5 py-2.5 rounded-xl bg-[#18191E] border border-[#22242A] hover:border-white/20 text-white text-xs font-semibold inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]"
        >
          Torna all&apos;Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh bg-[#09090B] bg-rivo-grid text-[#F4F4F6] flex flex-col justify-between p-4 sm:p-5 overflow-x-hidden relative selection:bg-[#BFFF00] selection:text-[#09090B]">
      {/* Top navigation: Back to Hub */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between gap-2 z-10 pb-2">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3.5 min-h-[48px] rounded-xl bg-[#111215] hover:bg-[#18191E] border border-[#22242A] text-xs font-semibold text-[#E4E4E7] hover:text-white transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]"
        >
          <ArrowLeft className="w-4 h-4 text-[#BFFF00]" />
          <span>Torna all&apos;Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full bg-[#111215] border border-[#22242A] text-[11px] font-mono text-[#A1A1AA] truncate max-w-[170px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] shrink-0" />
          <span className="text-white font-semibold truncate">{device.name}</span>
        </span>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-md w-full mx-auto my-auto py-3 z-10 space-y-4 text-center flex flex-col items-center">
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {org?.name || 'Ruota della Fortuna'}
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Gira la ruota e riscatta un premio esclusivo al tuo tavolo
          </p>
        </div>

        {!claimedCoupon ? (
          <div className="space-y-4 flex flex-col items-center w-full">
            {/* Visual Wheel Disc */}
            <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center my-1">
              {wonReward && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-1.5 rounded-full border-2 border-[#BFFF00]/70"
                />
              )}

              {/* Pointer */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-[#BFFF00]" />

              {/* Spinning Disc */}
              <div
                className="w-full h-full rounded-full border-4 border-[#22242A] shadow-2xl relative overflow-hidden transition-transform duration-[4000ms] ease-out motion-reduce:duration-300"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  background: 'conic-gradient(#18191E 0deg 60deg, #111215 60deg 120deg, #18191E 120deg 180deg, #111215 180deg 240deg, #18191E 240deg 300deg, #111215 300deg 360deg)',
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
              <div className="absolute z-10 w-12 h-12 rounded-full bg-[#111215] border-2 border-[#BFFF00] flex items-center justify-center shadow-lg shadow-[#BFFF00]/20">
                <Gift className="w-5 h-5 text-[#BFFF00]" />
              </div>
            </div>

            {/* Spin CTA or Win Claim Form */}
            {!wonReward ? (
              <button
                type="button"
                onClick={spinWheel}
                disabled={spinning}
                className="w-full max-w-xs min-h-[48px] bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-[#BFFF00]/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]"
              >
                <Zap className="w-4 h-4 shrink-0" />
                <span>{spinning ? 'La ruota gira...' : 'GIRA LA RUOTA ADESSO!'}</span>
              </button>
            ) : (
              /* CLAIM FORM + CELEBRATORY BADGE */
              <div className="w-full rounded-2xl border border-[#BFFF00]/40 bg-[#111215] p-4 sm:p-5 text-center space-y-3 shadow-2xl animate-fade-in">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#09090B] bg-[#BFFF00] px-3 py-1 rounded-full shadow-sm">
                  <Trophy className="w-3.5 h-3.5 shrink-0" />
                  <span>PREMIO SBLOCCATO</span>
                </div>

                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA]">Hai vinto</p>
                  <p className="text-base font-extrabold text-white mt-0.5">{wonReward}</p>
                </div>

                <form onSubmit={handleClaim} className="space-y-3 text-left pt-1">
                  <div>
                    <label htmlFor="wheel-name" className="block text-[11px] font-semibold text-[#D4D4D8] mb-1">
                      Il tuo Nome
                    </label>
                    <input
                      id="wheel-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Mario Rossi"
                      className="w-full min-h-[44px] bg-[#18191E] border border-[#22242A] rounded-xl px-3 text-xs text-white placeholder-[#71717A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus:border-[#BFFF00]"
                    />
                  </div>

                  <div>
                    <label htmlFor="wheel-contact" className="block text-[11px] font-semibold text-[#D4D4D8] mb-1">
                      Cellulare o Email <span className="text-[#BFFF00]">*</span>
                    </label>
                    <input
                      id="wheel-contact"
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="333 1234567 oppure email"
                      className="w-full min-h-[44px] bg-[#18191E] border border-[#22242A] rounded-xl px-3 text-xs text-white placeholder-[#71717A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus:border-[#BFFF00]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={claiming}
                    className="w-full min-h-[48px] bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111215]"
                  >
                    <span>{claiming ? 'Generazione Voucher...' : 'Riscatta il tuo Voucher Ora'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* COUPON WON & READY TO COPY */
          <div className="w-full rounded-2xl border border-emerald-500/40 bg-[#111215] p-5 text-center space-y-3.5 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-mono text-[#BFFF00] font-bold uppercase tracking-wider block">
                Voucher Attivato
              </span>
              <h3 className="text-lg font-extrabold text-white mt-0.5">{claimedCoupon.reward}</h3>
            </div>

            <div className="p-3 bg-[#09090B] rounded-xl border border-[#22242A] flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-base text-[#BFFF00] tracking-wider tabular-nums">
                {claimedCoupon.code}
              </span>
              <button
                type="button"
                onClick={copyVoucher}
                className="min-h-[48px] px-3.5 rounded-lg bg-[#18191E] hover:bg-[#22242A] border border-[#22242A] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>

            <Link
              href={`/hub/${code}`}
              className="w-full min-h-[48px] rounded-xl bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-[#BFFF00]/20 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111215]"
            >
              <span>Torna all&apos;Hub dei Servizi</span>
            </Link>
          </div>
        )}
      </main>

      {/* Hardware RIVO Footer Badge */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111215] border border-[#22242A] text-[11px] font-mono text-[#A1A1AA]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
          <span>Ruota Premi Smart • Powered by</span>
          <strong className="text-white font-bold tracking-wide">RIVO</strong>
        </div>
      </footer>
    </div>
  );
}

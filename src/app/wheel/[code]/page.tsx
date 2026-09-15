'use client';

import { useEffect, useState, useRef, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Ticket, 
  AlertCircle,
  Copy,
  ChevronRight
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const REWARDS = [
  { label: 'Calice di Benvenuto 🍷', color: '#18181B', textColor: '#BFFF00' },
  { label: 'Dessert della Casa 🍰', color: '#121214', textColor: '#FFFFFF' },
  { label: 'Sconto 15% (Lun-Gio) 🏷️', color: '#18181B', textColor: '#38BDF8' },
  { label: 'Caffè Speciale ☕', color: '#121214', textColor: '#FACC15' },
  { label: 'Antipasto Omaggio 🍕', color: '#18181B', textColor: '#4ADE80' },
  { label: 'Brindisi Finale 🍾', color: '#121214', textColor: '#F472B6' },
];

interface WheelPageProps {
  params: Promise<{ code: string }>;
}

export default function WheelPage({ params }: WheelPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code ? resolvedParams.code.toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<{ id: string; organization_id: string } | null>(null);
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
        .select('id, organization_id')
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

    const segmentDegree = 360 / REWARDS.length;
    const randomExtraRotations = 5 + Math.floor(Math.random() * 4); // 5 to 8 turns
    const winningIndex = Math.floor(Math.random() * REWARDS.length);
    
    // Calculate final rotation so arrow at top points to winning segment
    const targetDegree = randomExtraRotations * 360 + (REWARDS.length - 1 - winningIndex) * segmentDegree + segmentDegree / 2;

    setRotation(targetDegree);

    setTimeout(() => {
      setSpinning(false);
      const reward = REWARDS[winningIndex].label;
      setWonReward(reward);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#BFFF00', '#38BDF8', '#FACC15', '#FFFFFF'],
        });
      } catch (e) {
        console.warn(e);
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
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
        <div className="w-12 h-12 border-2 border-[#BFFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 overflow-x-hidden selection:bg-[#BFFF00] selection:text-black">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#BFFF00]/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="max-w-md w-full mx-auto text-center pt-4 sm:pt-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18181B] border border-[#27272A] text-[11px] font-semibold text-[#BFFF00] mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Premi di Ritorno RIVO</span>
        </span>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {org?.name || 'Ruota della Fortuna'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Gira la ruota e sblocca un vantaggio speciale per la tua prossima visita!
        </p>
      </div>

      {/* Wheel Area */}
      <div className="max-w-md w-full mx-auto my-auto py-6 flex flex-col items-center">
        {!claimedCoupon ? (
          <div className="space-y-6 flex flex-col items-center w-full">
            {/* Visual Wheel Container */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Pointer */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-[#BFFF00] drop-shadow-[0_0_8px_rgba(191,255,0,0.8)]" />

              {/* Spinning Disc */}
              <div
                className="w-full h-full rounded-full border-4 border-[#27272A] shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden transition-transform duration-[4000ms] ease-out"
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
                      className="absolute top-0 left-1/2 -translate-x-1/2 origin-bottom w-8 h-1/2 flex items-start justify-center pt-3 text-center"
                      style={{
                        transform: `rotate(${deg}deg)`,
                        transformOrigin: 'bottom center',
                      }}
                    >
                      <span
                        className="text-[10px] sm:text-xs font-bold whitespace-nowrap -rotate-90 origin-center"
                        style={{ color: r.textColor }}
                      >
                        {r.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Center Cap */}
              <div className="absolute z-10 w-14 h-14 rounded-full bg-[#18181B] border-2 border-[#BFFF00] flex items-center justify-center shadow-lg shadow-[#BFFF00]/20">
                <Gift className="w-6 h-6 text-[#BFFF00]" />
              </div>
            </div>

            {/* Spin CTA or Win Form */}
            {!wonReward ? (
              <button
                type="button"
                onClick={spinWheel}
                disabled={spinning}
                className="w-full max-w-xs min-h-[50px] bg-[#BFFF00] hover:bg-[#a8e000] text-black font-bold text-sm px-6 py-3 rounded-2xl transition-all shadow-xl shadow-[#BFFF00]/25 flex items-center justify-center gap-2 touch-press disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{spinning ? 'La ruota sta girando...' : 'GIRA LA RUOTA ORA!'}</span>
              </button>
            ) : (
              <div className="w-full max-w-sm rounded-2xl border border-[#BFFF00]/30 bg-[#121214] p-5 text-center space-y-4 shadow-2xl animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-[#BFFF00]/15 text-[#BFFF00] flex items-center justify-center mx-auto">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#BFFF00] uppercase tracking-wider block">PREMIO SBLOCCATO!</span>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">{wonReward}</h3>
                </div>

                <form onSubmit={handleClaim} className="space-y-3 pt-2 text-left">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Il tuo Nome (opzionale)</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Mario Rossi"
                      className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#BFFF00]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Cellulare o WhatsApp <span className="text-[#BFFF00]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+39 340 1234567"
                      className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#BFFF00]"
                    />
                    <span className="text-[10px] text-zinc-500 block mt-1">Riceverai il voucher da mostrare al cameriere</span>
                  </div>

                  <button
                    type="submit"
                    disabled={claiming}
                    className="w-full min-h-[46px] bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 touch-press shadow-lg shadow-[#BFFF00]/20 disabled:opacity-50"
                  >
                    <span>{claiming ? 'Generazione Voucher...' : 'Salva il mio Voucher'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* CLAIMED VOUCHER TICKET */
          <div className="w-full max-w-sm rounded-2xl border border-[#27272A] bg-gradient-to-b from-[#18181B] to-[#121214] p-6 text-center space-y-5 shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#BFFF00] uppercase block mb-1">VOUCHER RIVO VALIDO</span>
              <h2 className="text-lg font-bold text-white">{claimedCoupon.reward}</h2>
              <span className="text-xs text-zinc-400 block mt-1">Presso {org?.name || 'il nostro locale'}</span>
            </div>

            {/* Ticket Code Box */}
            <div className="p-4 rounded-xl bg-black border border-dashed border-[#BFFF00]/40 space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">CODICE UNIVOCO DA MOSTRARE</span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-[#BFFF00] tracking-wider">
                {claimedCoupon.code}
              </div>
              <button
                type="button"
                onClick={copyVoucher}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white pt-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'Copiato negli appunti!' : 'Copia codice'}</span>
              </button>
            </div>

            <div className="text-[11px] text-zinc-400 space-y-1">
              <p className="flex items-center justify-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#BFFF00]" />
                <span>Valido per 14 giorni (fino al {new Date(claimedCoupon.expires_at).toLocaleDateString('it-IT')})</span>
              </p>
              <p className="text-zinc-500">Mostra questo codice al cameriere o in cassa al momento del conto.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center pb-4 text-[11px] text-zinc-600">
        <span>Gamification & Premi • Powered by </span>
        <strong className="text-zinc-400 font-semibold">RIVO</strong>
      </footer>
    </div>
  );
}

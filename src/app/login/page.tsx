'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  CheckCircle2,
  Radio,
  Activity
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Check user role and status from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('auth_user_id', data.user.id)
        .single();

      if (profile?.status === 'deactivated') {
        await supabase.auth.signOut();
        setErrorMsg('Questo account collaboratore è stato disattivato dal responsabile.');
        setLoading(false);
        return;
      }

      if (profile?.status === 'suspended') {
        await supabase.auth.signOut();
        setErrorMsg('Questo account collaboratore è temporaneamente sospeso.');
        setLoading(false);
        return;
      }

      if (profile?.role === 'admin') {
        router.push('/admin');
      } else if (profile?.role === 'waiter') {
        router.push('/dashboard/waiter');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#050507] text-white">
      {/* Left Pane (Desktop Showcase): High-Craft Brand & Trust */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 bg-[#08090D] border-r border-white/[0.08] relative overflow-hidden">
        {/* Ambient radial glow */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
              <Image
                src="/brand/rivo-icon.png"
                alt="RIVO"
                width={24}
                height={24}
                priority
                className="rounded-xs"
              />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">RIVO</span>
              <span className="ml-2 badge-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px]">
                OS 2.0
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Torna al sito</span>
          </Link>
        </div>

        {/* Central Commanding Value Prop */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CONTROL ROOM MERCANTILE</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight text-white leading-[1.08] headline-tight">
            Il Sistema Operativo Fisico-Digitale per la Tua Attività.
          </h1>

          <p className="text-slate-400 text-sm xl:text-base leading-relaxed">
            Monitora telemetria dei tavoli, chiamate di servizio in sala, recensioni Google con AI e sincronizzazione cassa/magazzino in tempo reale.
          </p>

          {/* Pillars List */}
          <div className="space-y-3 pt-2">
            {[
              'Sincronizzazione Edge con latenza <0.4 secondi',
              'Protezione Offline-Outbox con persistenza locale IndexedDB',
              'Accesso multi-sede profilato con Supabase Row-Level Security',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom System Status Bar */}
        <div className="relative z-10 pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">CDN Cloud: 100% Operativo</span>
          </div>
          <span>B2B Merchant Portal</span>
        </div>
      </div>

      {/* Right Pane: Login Form Card */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center p-6 sm:p-10 relative">
        {/* Mobile Header Link */}
        <div className="lg:hidden w-full max-w-md mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/rivo-icon.png"
              alt="RIVO"
              width={26}
              height={26}
              className="rounded-xs"
            />
            <span className="font-bold text-white text-base">RIVO</span>
          </Link>
          <Link href="/" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>

        <div className="w-full max-w-md p-8 rounded-3xl bg-[#0B0C10] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px]">
                ACCESSO RISERVATO
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Accedi alla Control Room
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Inserisci le credenziali fornite dal tuo amministratore o titolare.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-400 animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Aziendale
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="amministrazione@locale.it"
                className="w-full min-h-[44px] bg-[#12141C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full min-h-[44px] bg-[#12141C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-white hover:bg-slate-200 text-zinc-950 font-bold text-sm min-h-[44px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(255,255,255,0.15)] touch-press disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Autenticazione in corso...</span>
                </>
              ) : (
                <>
                  <span>Accedi alla Piattaforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Non hai ancora un account? Richiedi una demo dalla home page per attivare il kit RIVO per la tua sede.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  CheckCircle2,
  Activity,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#09090B] text-[#F4F4F6] font-sans">
      {/* Left Pane (Desktop Architecture Showcase): Industrial Blueprint & Hardware Telemetry */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 bg-[#09090B] bg-rivo-grid border-r border-[#22242A] relative overflow-hidden">
        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#111215] border border-[#32353E] flex items-center justify-center p-1.5 transition-colors group-hover:border-[#BFFF00]/60">
              <Image
                src="/brand/rivo-icon.png"
                alt="RIVO"
                width={22}
                height={22}
                priority
                className="rounded-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base tracking-tight text-white">
                RIVO
              </span>
              <span className="rounded bg-[#111215] border border-[#22242A] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#BFFF00]">
                CONTROL OS
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#22242A] bg-[#111215] px-3 text-xs font-medium text-[#A1A1AA] hover:border-[#32353E] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Torna al sito</span>
          </Link>
        </div>

        {/* Central Commanding Value Prop */}
        <div className="relative z-10 max-w-xl space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111215] border border-[#22242A] font-mono text-[11px] uppercase tracking-[0.12em] text-[#A1A1AA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
            <span>CONTROL ROOM MERCANTILE // TLS 1.3</span>
          </div>

          <h1 className="font-display text-4xl xl:text-5xl font-bold tracking-[-0.035em] text-white leading-[1.06]">
            Il Sistema Operativo Fisico-Digitale per la Tua Attività.
          </h1>

          <p className="text-[#A1A1AA] text-sm xl:text-base leading-relaxed max-w-lg">
            Gestisci nodi NFC NTAG 424, telemetria tavoli e sala, Review Shield Google e
            sincronizzazione POS/ERP in un unico terminale ad alta precisione.
          </p>

          {/* Architectural Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-[#22242A] bg-[#111215] p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#71717A]">
                EDGE SYNC LATENCY
              </div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#BFFF00]">
                &lt; 0.4s
              </div>
              <div className="mt-1 text-xs text-[#A1A1AA]">
                Tap NFC diretto al gestionale
              </div>
            </div>

            <div className="rounded-xl border border-[#22242A] bg-[#111215] p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#71717A]">
                OFFLINE RESILIENCE
              </div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-white">
                IndexedDB + RLS
              </div>
              <div className="mt-1 text-xs text-[#A1A1AA]">
                Protezione multi-sede profilata
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              'Routing hardware crittografato su chip NTAG 424 & QR dinamici',
              'Interfaccia adattiva Dark Control & Light ERP senza perdita di dati',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-[#A1A1AA]">
                <CheckCircle2
                  className="w-4 h-4 text-[#10B981] shrink-0"
                  strokeWidth={1.75}
                />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom System Status Bar */}
        <div className="relative z-10 pt-6 border-t border-[#22242A] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <Activity className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.75} />
            <span>CDN CLOUD: 100% OPERATIVO</span>
          </div>
          <span className="text-[#71717A]">B2B MERCHANT PORTAL</span>
        </div>
      </div>

      {/* Right Pane: Crisp Enterprise Login Card */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center p-5 sm:p-10 bg-[#09090B]">
        {/* Mobile Header */}
        <div className="lg:hidden w-full max-w-md mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111215] border border-[#22242A] p-1">
              <Image
                src="/brand/rivo-icon.png"
                alt="RIVO"
                width={20}
                height={20}
                className="rounded-xs"
              />
            </div>
            <span className="font-display font-bold text-white text-base">RIVO</span>
          </Link>
          <Link
            href="/"
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-[#22242A] bg-[#111215] px-3 text-xs text-[#A1A1AA] hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>

        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#111215] border border-[#22242A]">
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-[#32353E] bg-[#18191E] px-2.5 py-1 mb-3">
              <Lock className="w-3 h-3 text-[#BFFF00]" strokeWidth={1.75} />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#F4F4F6]">
                ACCESSO RISERVATO
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">
              Accedi alla Control Room
            </h2>
            <p className="text-sm text-[#A1A1AA] mt-1.5 leading-relaxed">
              Inserisci le credenziali aziendali fornite dal responsabile della sede.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-6 p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#F87171]"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-[#F4F4F6] mb-1.5"
              >
                Email Aziendale
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@azienda.it"
                className="w-full min-h-[44px] bg-[#18191E] border border-[#32353E] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#A1A1AA]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus:border-[#BFFF00] transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[#F4F4F6] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Inserisci la tua password"
                  className="w-full min-h-[44px] bg-[#18191E] border border-[#32353E] rounded-lg pl-3.5 pr-11 py-2.5 text-sm text-white placeholder:text-[#A1A1AA]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus:border-[#BFFF00] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#A1A1AA] hover:text-white cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#BFFF00] hover:bg-[#CEFF33] text-[#09090B] font-bold text-sm min-h-[44px] py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#09090B]" />
                  <span>Autenticazione in corso…</span>
                </>
              ) : (
                <>
                  <span>Accedi alla Piattaforma</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-[#22242A] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Non hai ancora un kit hardware?
            </p>
            <Link
              href="/demo/retail"
              className="font-mono text-xs font-semibold text-[#BFFF00] hover:underline shrink-0"
            >
              Esplora Demo Live
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

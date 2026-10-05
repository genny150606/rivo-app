'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Wifi, 
  CheckCircle2, 
  Copy, 
  Lock, 
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface WifiPageProps {
  params: Promise<{ code: string }>;
}

export default function WifiAccessPage({ params }: WifiPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code ? resolvedParams.code.toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<{ id: string; name: string; organization_id: string } | null>(null);
  const [org, setOrg] = useState<{ name: string; logo_url: string | null } | null>(null);

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [wifiCreds, setWifiCreds] = useState<{ ssid: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device || !contact.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: device.organization_id,
          name: name.trim() || null,
          contact: contact.trim(),
          source: 'wifi',
        }),
      });

      const data = await res.json();
      if (res.ok && data.wifi) {
        setWifiCreds(data.wifi);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = () => {
    if (wifiCreds?.password && navigator.clipboard) {
      navigator.clipboard.writeText(wifiCreds.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] flex items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#18181B] border border-[#27272A] flex items-center justify-center animate-pulse">
          <Wifi className="w-7 h-7 text-blue-400 animate-pulse" />
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
        <p className="text-xs text-zinc-400 max-w-xs mb-4">Questo chip non risulta attivo o registrato.</p>
        <Link
          href={`/hub/${code}`}
          className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-semibold"
        >
          Torna all&apos;Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh h-screen sm:h-dvh bg-[#09090B] text-zinc-100 flex flex-col justify-between p-3 sm:p-5 overflow-y-auto relative selection:bg-[#BFFF00] selection:text-black">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-blue-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* TOP NAVIGATION: BACK TO HUB */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between z-10 pt-1 pb-2">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all active:scale-95 min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400" />
          <span>Torna all&apos;Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-white font-medium">{device.name}</span>
        </span>
      </nav>

      {/* MAIN INTERACTIVE CARD */}
      <main className="max-w-md w-full mx-auto my-auto py-2 z-10 space-y-3">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {org?.name || 'Wi-Fi Ospiti'}
          </h1>
          <p className="text-xs text-zinc-400">
            Connessione ultra-rapida gratuita riservata ai clienti
          </p>
        </div>

        {!wifiCreds ? (
          /* CONNECT FORM */
          <div className="rounded-2xl border border-white/10 bg-[#121214]/90 backdrop-blur-xl p-4 sm:p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Accesso 1-Tap</h3>
                <p className="text-[10px] text-zinc-400">Inserisci i tuoi dati per sbloccare la password</p>
              </div>
            </div>

            <form onSubmit={handleConnect} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Nome (Opzionale)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Es. Mario"
                  className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Cellulare o Email <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Es. 333 1234567 oppure mario@email.it"
                  className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 touch-press shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                <span>{submitting ? 'Connessione...' : 'Sblocca Password Wi-Fi'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* CREDENTIALS UNLOCKED */
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 to-[#121214] p-5 text-center space-y-3.5 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#BFFF00] uppercase tracking-wider block">Accesso Concesso</span>
              <h2 className="text-base sm:text-lg font-bold text-white">Credenziali Wi-Fi Ufficiali</h2>
            </div>

            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-2.5 text-left">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase block font-bold">NOME RETE (SSID)</span>
                <span className="text-sm font-bold font-mono text-white block mt-0.5">{wifiCreds.ssid}</span>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block font-bold">PASSWORD</span>
                  <span className="text-sm font-bold font-mono text-[#BFFF00] block mt-0.5">{wifiCreds.password}</span>
                </div>

                <button
                  type="button"
                  onClick={copyPassword}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors touch-press min-h-[36px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copiata!' : 'Copia'}</span>
                </button>
              </div>
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
        <span>Connessione Wi-Fi Smart • Powered by </span>
        <strong className="text-zinc-400 font-semibold">RIVO</strong>
      </footer>
    </div>
  );
}

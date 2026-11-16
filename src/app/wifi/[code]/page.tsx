'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Wifi,
  CheckCircle2,
  Copy,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
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
        <p className="text-xs text-[#A1A1AA] max-w-xs mb-4">Questo chip non risulta attivo o registrato.</p>
        <Link
          href={`/hub/${code}`}
          className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#18191E] border border-[#22242A] hover:border-white/20 text-white text-xs font-semibold inline-flex items-center justify-center"
        >
          Torna all&apos;Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh bg-[#09090B] bg-rivo-grid text-[#F4F4F6] flex flex-col justify-between p-4 sm:p-5 overflow-x-hidden relative selection:bg-[#BFFF00] selection:text-[#09090B]">
      {/* TOP NAVIGATION: BACK TO HUB */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between gap-2 z-10 pb-2">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3.5 min-h-[48px] rounded-xl bg-[#111215] hover:bg-[#18191E] border border-[#22242A] text-xs font-semibold text-[#E4E4E7] hover:text-white transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#BFFF00]" />
          <span>Torna all&apos;Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full bg-[#111215] border border-[#22242A] text-[11px] font-mono text-[#A1A1AA] truncate max-w-[170px]">
          <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
          <span className="text-white font-semibold truncate">{device.name}</span>
        </span>
      </nav>

      {/* MAIN INTERACTIVE CARD */}
      <main className="max-w-md w-full mx-auto my-auto py-3 z-10 space-y-4">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {org?.name || 'Wi-Fi Ospiti'}
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Connessione ultra-rapida gratuita riservata ai clienti
          </p>
        </div>

        {!wifiCreds ? (
          /* CONNECT FORM */
          <div className="rounded-2xl border border-[#22242A] bg-[#111215] p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#22242A]">
              <div className="w-10 h-10 rounded-xl bg-[#18191E] border border-[#22242A] text-[#BFFF00] flex items-center justify-center shrink-0">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#F4F4F6]">Accesso Wi-Fi Ospiti</h3>
                <p className="text-[11px] text-[#A1A1AA]">Inserisci i tuoi dati per sbloccare la password</p>
              </div>
            </div>

            <form onSubmit={handleConnect} className="space-y-3">
              <div>
                <label htmlFor="wifi-name" className="block text-[11px] font-medium text-[#D4D4D8] mb-1">
                  Nome (Opzionale)
                </label>
                <input
                  id="wifi-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Es. Mario"
                  className="w-full min-h-[44px] bg-[#18191E] border border-[#22242A] rounded-xl px-3 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div>
                <label htmlFor="wifi-contact" className="block text-[11px] font-medium text-[#D4D4D8] mb-1">
                  Cellulare o Email <span className="text-[#BFFF00]">*</span>
                </label>
                <input
                  id="wifi-contact"
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Es. 333 1234567 oppure mario@email.it"
                  className="w-full min-h-[44px] bg-[#18191E] border border-[#22242A] rounded-xl px-3 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#BFFF00]/20 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              >
                <span>{submitting ? 'Connessione...' : 'Sblocca Password Wi-Fi'}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </form>
          </div>
        ) : (
          /* CREDENTIALS UNLOCKED */
          <div className="rounded-2xl border border-emerald-500/40 bg-[#111215] p-5 text-center space-y-4 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-mono font-bold text-[#BFFF00] uppercase tracking-wider block">
                Accesso Concesso
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">Credenziali Wi-Fi Ufficiali</h2>
            </div>

            <div className="p-3.5 rounded-xl bg-[#09090B] border border-[#22242A] space-y-3 text-left">
              <div>
                <span className="text-[10px] font-mono text-[#A1A1AA] uppercase block font-semibold">
                  NOME RETE (SSID)
                </span>
                <span className="text-sm font-bold font-mono text-white block mt-0.5">{wifiCreds.ssid}</span>
              </div>

              <div className="pt-2.5 border-t border-[#22242A] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-[#A1A1AA] uppercase block font-semibold">
                    PASSWORD
                  </span>
                  <span className="text-sm font-bold font-mono text-[#BFFF00] block mt-0.5 truncate tabular-nums">
                    {wifiCreds.password}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={copyPassword}
                  className="px-3.5 min-h-[48px] rounded-xl bg-[#18191E] hover:bg-[#22242A] border border-[#22242A] text-[#F4F4F6] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copiata!' : 'Copia'}</span>
                </button>
              </div>
            </div>

            <Link
              href={`/hub/${code}`}
              className="w-full min-h-[48px] rounded-xl bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-[#BFFF00]/20 flex items-center justify-center gap-1.5"
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
          <span>Connessione Wi-Fi Smart • Powered by</span>
          <strong className="text-white font-bold tracking-wide">RIVO</strong>
        </div>
      </footer>
    </div>
  );
}

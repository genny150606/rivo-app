'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Wifi, 
  CheckCircle2, 
  Copy, 
  Lock, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

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
  const [device, setDevice] = useState<{ id: string; organization_id: string } | null>(null);
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
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
        <div className="w-12 h-12 border-2 border-[#BFFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 selection:bg-[#BFFF00] selection:text-black">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#BFFF00]/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="max-w-md w-full mx-auto text-center pt-6 sm:pt-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18181B] border border-[#27272A] text-[11px] font-semibold text-[#BFFF00] mb-3">
          <Wifi className="w-3.5 h-3.5" />
          <span>Wi-Fi Gratuito Ospiti</span>
        </span>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {org?.name || 'Benvenuto'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Naviga gratis ad alta velocità durante la tua sosta al locale!
        </p>
      </div>

      {/* Main card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        {!wifiCreds ? (
          <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-[#27272A]">
              <div className="w-10 h-10 rounded-xl bg-[#BFFF00]/15 text-[#BFFF00] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Accesso Rapido a Internet</h2>
                <p className="text-[11px] text-zinc-400">Zero password difficili da copiare dal menu</p>
              </div>
            </div>

            <form onSubmit={handleConnect} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Il tuo Nome (opzionale)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mario Rossi"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Cellulare o Email <span className="text-[#BFFF00]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+39 340 1234567 oppure email"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[46px] bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 touch-press shadow-lg shadow-[#BFFF00]/20 disabled:opacity-50"
                >
                  <span>{submitting ? 'Connessione in corso...' : 'Connettiti al Wi-Fi'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* WIFI CREDENTIALS CARD */
          <div className="rounded-2xl border border-emerald-500/30 bg-[#121214] p-6 shadow-2xl text-center space-y-5 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-[#BFFF00] uppercase tracking-wider block mb-1">Accesso Concesso</span>
              <h2 className="text-lg font-bold text-white">Credenziali Wi-Fi Ufficiali</h2>
            </div>

            <div className="p-4 rounded-xl bg-[#18181B] border border-zinc-800 space-y-3 text-left">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">NOME RETE WI-FI (SSID)</span>
                <span className="text-sm font-bold font-mono text-white block mt-0.5">{wifiCreds.ssid}</span>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block font-semibold">PASSWORD</span>
                  <span className="text-sm font-bold font-mono text-[#BFFF00] block mt-0.5">{wifiCreds.password}</span>
                </div>

                <button
                  type="button"
                  onClick={copyPassword}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors touch-press"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copiata!' : 'Copia'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Apri le impostazioni Wi-Fi del tuo smartphone, seleziona la rete <strong>{wifiCreds.ssid}</strong> e incolla la password. Buona navigazione!
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center pb-4 text-[11px] text-zinc-600">
        <span>Connessione Wi-Fi Smart • Powered by </span>
        <strong className="text-zinc-400 font-semibold">RIVO</strong>
      </footer>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Star, 
  ShieldCheck, 
  ShieldAlert, 
  ExternalLink, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Phone, 
  Sparkles,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface PrivateFeedbackItem {
  id: string;
  rating: number;
  customer_name: string | null;
  customer_contact: string | null;
  comment: string;
  status: 'new' | 'read' | 'archived';
  created_at: string;
}

export default function ReviewsPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>('');
  const [shieldEnabled, setShieldEnabled] = useState(true);
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string>('');
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<PrivateFeedbackItem[]>([]);
  const [updatingShield, setUpdatingShield] = useState(false);
  const [shieldMessage, setShieldMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('auth_user_id', user.id)
        .single();

      let targetOrgId = profile?.organization_id;

      // If superadmin without direct org, fetch first org
      if (!targetOrgId && profile?.role === 'admin') {
        const { data: firstOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        targetOrgId = firstOrg?.id;
      }

      if (!targetOrgId) {
        setLoading(false);
        return;
      }

      setOrgId(targetOrgId);

      // Fetch organization details
      const { data: org } = await supabase
        .from('organizations')
        .select('name, review_shield_enabled, google_review_url')
        .eq('id', targetOrgId)
        .single();

      if (org) {
        setOrgName(org.name);
        setShieldEnabled(org.review_shield_enabled ?? true);
        setGoogleReviewUrl(org.google_review_url || '');
      }

      // Fetch sample device for preview
      const { data: dev } = await supabase
        .from('devices')
        .select('unique_code')
        .eq('organization_id', targetOrgId)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (dev) {
        setDeviceCode(dev.unique_code);
      }

      // Fetch private feedbacks
      const { data: feedbackData } = await supabase
        .from('private_feedbacks')
        .select('*')
        .eq('organization_id', targetOrgId)
        .order('created_at', { ascending: false });

      if (feedbackData) {
        setFeedbacks(feedbackData as PrivateFeedbackItem[]);
      }
    } catch (err) {
      console.error('Error loading reviews data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Toggle Review Shield setting
  const handleToggleShield = async () => {
    if (!orgId) return;
    const newStatus = !shieldEnabled;
    setUpdatingShield(true);
    setShieldMessage(null);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ review_shield_enabled: newStatus })
        .eq('id', orgId);

      if (error) throw error;

      setShieldEnabled(newStatus);
      setShieldMessage(
        newStatus 
          ? 'Review Shield ATTIVATO: le recensioni negative vengono intercettate.' 
          : 'Review Shield DISATTIVATO: tutti i tap vanno direttamente a Google.'
      );
      setTimeout(() => setShieldMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore';
      alert(`Errore aggiornamento: ${msg}`);
    } finally {
      setUpdatingShield(false);
    }
  };

  // Toggle status of feedback (new <-> read)
  const handleToggleStatus = async (item: PrivateFeedbackItem) => {
    const nextStatus = item.status === 'new' ? 'read' : 'new';
    try {
      const { error } = await supabase
        .from('private_feedbacks')
        .update({ status: nextStatus })
        .eq('id', item.id);

      if (error) throw error;

      setFeedbacks((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: nextStatus } : f))
      );
    } catch (err) {
      console.error('Error updating feedback status:', err);
    }
  };

  const interceptedCount = feedbacks.length;
  const newFeedbacksCount = feedbacks.filter((f) => f.status === 'new').length;
  const avgNegativeRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
      : '5.0';

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl animate-pulse">
        <div className="h-8 bg-zinc-800 rounded w-1/3" />
        <div className="h-4 bg-zinc-800 rounded w-1/2" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[#121214] border border-[#27272A] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2.5">
            <span>Google Reviews & Review Shield</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#BFFF00]/10 text-[#BFFF00] border border-[#BFFF00]/20">
              PRO
            </span>
          </h1>
          <p className="text-sm text-zinc-400">
            Filtra automaticamente le recensioni a 5 stelle su Google e gestisci privatamente i clienti insoddisfatti.
          </p>
        </div>

        {/* Demo preview button */}
        {deviceCode && (
          <Link
            href={`/review/${deviceCode}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-zinc-200 border border-[#27272A] text-xs font-medium transition-colors touch-press shrink-0"
          >
            <span>Simula Esperienza Cliente</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#BFFF00]" />
          </Link>
        )}
      </div>

      {/* SHIELD CONTROL BANNER */}
      <div className={`rounded-2xl border p-5 sm:p-6 transition-all relative overflow-hidden ${
        shieldEnabled 
          ? 'bg-gradient-to-r from-[#121214] via-[#151a10] to-[#121214] border-[#BFFF00]/30 shadow-[0_0_25px_rgba(191,255,0,0.06)]'
          : 'bg-[#121214] border-[#27272A]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              shieldEnabled 
                ? 'bg-[#BFFF00]/15 text-[#BFFF00] shadow-[0_0_15px_rgba(191,255,0,0.3)]'
                : 'bg-zinc-800 text-zinc-400'
            }`}>
              {shieldEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {shieldEnabled ? 'Review Shield Attivo' : 'Review Shield Disattivato'}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                  shieldEnabled ? 'bg-[#BFFF00]/15 text-[#BFFF00]' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {shieldEnabled ? 'Protetto' : 'Libero'}
                </span>
              </div>
              <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                {shieldEnabled ? (
                  <>
                    I clienti che valutano <strong>4 o 5 stelle</strong> vengono reindirizzati istantaneamente a Google Reviews. Chi valuta <strong>1, 2 o 3 stelle</strong> invia una segnalazione privata che puoi leggere qui sotto senza danneggiare il punteggio pubblico.
                  </>
                ) : (
                  <>
                    Il filtro intelligente è spento. Tutti i clienti che toccano i dispositivi NFC/QR vengono inviati direttamente all&apos;URL di Google senza alcun filtro.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Toggle button */}
          <div className="flex sm:justify-end shrink-0">
            <button
              type="button"
              onClick={handleToggleShield}
              disabled={updatingShield}
              className={`min-h-[46px] px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 transition-all touch-press ${
                shieldEnabled
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                  : 'bg-[#BFFF00] hover:bg-[#a8e000] text-black shadow-lg shadow-[#BFFF00]/20'
              }`}
            >
              {updatingShield ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : shieldEnabled ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-zinc-400" />
                  <span>Disattiva Shield</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Attiva Review Shield</span>
                </>
              )}
            </button>
          </div>
        </div>

        {shieldMessage && (
          <div className="mt-4 pt-3 border-t border-zinc-800 text-xs font-medium text-[#BFFF00] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{shieldMessage}</span>
          </div>
        )}
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A] relative overflow-hidden">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Recensioni Negative Intercettate
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#BFFF00] tracking-tight">
            {interceptedCount}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#BFFF00]" />
            <span>Salvate dal web pubblico</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A] relative overflow-hidden">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Nuovi Messaggi da Leggere
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {newFeedbacksCount}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Segnalazioni recenti</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A] relative overflow-hidden">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Tasso di Protezione
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
            {shieldEnabled ? '100%' : '0%'}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filtro anti 1-3 stelle attivo</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A] relative overflow-hidden">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Destinazione Google Reviews
          </span>
          <div className="text-xs font-mono text-zinc-300 truncate mt-1">
            {googleReviewUrl ? googleReviewUrl.replace('https://', '') : 'Non configurato'}
          </div>
          <div className="mt-3">
            <Link
              href="/dashboard/profile"
              className="text-[11px] text-[#BFFF00] hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Modifica link</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* PRIVATE FEEDBACKS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#BFFF00]" />
              <span>Segnalazioni e Reclami Intercettati ({feedbacks.length})</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Clienti che hanno assegnato 1-3 stelle e hanno lasciato una nota privata prima di pubblicare online.
            </p>
          </div>

          <button
            onClick={loadData}
            title="Ricarica lista"
            className="p-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {feedbacks.length === 0 ? (
          <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#BFFF00]/10 text-[#BFFF00] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Nessuna recensione negativa intercettata!</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Ottimo lavoro! Quando un ospite assegnerà 1, 2 o 3 stelle tramite NFC o QR, la sua segnalazione comparirà qui con tutti i dettagli per consentirti di risolvere il problema internamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 sm:p-5 transition-all ${
                  item.status === 'new'
                    ? 'bg-[#18181B] border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                    : 'bg-[#121214] border-[#27272A] opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    {/* Stars badge */}
                    <div className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= item.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-zinc-700'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-amber-400 ml-1">
                        {item.rating}/5
                      </span>
                    </div>

                    {/* Customer name */}
                    <span className="text-sm font-semibold text-white">
                      {item.customer_name || 'Ospite Anonimo'}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                        item.status === 'new'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.status === 'new' ? 'Nuovo' : 'Letto'}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(item.created_at).toLocaleString('it-IT')}</span>
                  </div>
                </div>

                {/* Comment */}
                <div className="bg-[#121214] p-3.5 rounded-lg border border-[#27272A] text-xs sm:text-sm text-zinc-200 leading-relaxed italic mb-3">
                  &ldquo;{item.comment}&rdquo;
                </div>

                {/* Footer bar with contact info & mark read button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#27272A]/70 text-xs">
                  <div className="flex items-center gap-4 text-zinc-400">
                    {item.customer_contact ? (
                      <div className="flex items-center gap-2">
                        {item.customer_contact.includes('@') ? (
                          <a
                            href={`mailto:${item.customer_contact}`}
                            className="inline-flex items-center gap-1.5 text-blue-400 hover:underline"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{item.customer_contact}</span>
                          </a>
                        ) : (
                          <a
                            href={`tel:${item.customer_contact}`}
                            className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{item.customer_contact}</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-500 italic">Nessun recapito lasciato</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors touch-press"
                  >
                    {item.status === 'new' ? 'Segna come letto' : 'Segna come da leggere'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HOW IT WORKS CARD */}
      <div className="rounded-2xl border border-[#27272A] bg-gradient-to-b from-[#18181B] to-[#121214] p-5 sm:p-7">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#BFFF00]" />
          <span>Come funziona l&apos;algoritmo del Review Shield</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-zinc-300">
          <div className="p-4 rounded-xl bg-[#121214] border border-[#27272A] space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Star className="w-4 h-4 fill-emerald-400" />
              <span>Valutazioni 4 e 5 Stelle (Ospiti Entusiasti)</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Il cliente tocca 4 o 5 stelle: un&apos;animazione a coriandoli conferma il gradimento e la pagina reindirizza all&apos;istante alla scheda Google Maps per raccogliere una recensione certificata.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#121214] border border-[#27272A] space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Valutazioni 1, 2 e 3 Stelle (Ospiti Insoddisfatti)</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Invece di approdare su Google rovinando il tuo rating medio, il cliente trova un form dedicato per spiegare cosa non è andato. La recensione resta 100% privata e ti dà l&apos;opportunità di ricontattarlo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

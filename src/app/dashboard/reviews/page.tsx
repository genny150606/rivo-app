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
      <div className={`rounded-xl border p-5 sm:p-6 transition-all relative overflow-hidden ${
        shieldEnabled 
          ? 'bg-white dark:bg-zinc-900/60 border-zinc-200/90 dark:border-white/[0.08] shadow-xs'
          : 'bg-white dark:bg-zinc-900/40 border-zinc-200/80 dark:border-white/[0.05]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border ${
              shieldEnabled 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700'
            }`}>
              {shieldEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {shieldEnabled ? 'Review Shield Attivo' : 'Review Shield Disattivato'}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  shieldEnabled 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40' 
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                }`}>
                  {shieldEnabled ? 'Protetto' : 'Libero'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                {shieldEnabled ? (
                  <>
                    I clienti che valutano <strong className="text-zinc-800 dark:text-zinc-200">4 o 5 stelle</strong> vengono reindirizzati istantaneamente alla pagina Google del locale. Le valutazioni da <strong className="text-zinc-800 dark:text-zinc-200">1 a 3 stelle</strong> generano un feedback privato interno, preservando il punteggio pubblico e l&apos;algoritmo di raccomandazione.
                  </>
                ) : (
                  <>
                    Il filtro intelligente è disattivato. Tutti i clienti che aprono l&apos;Hub vengono inviati direttamente all&apos;URL di Google senza protezione preventiva.
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
              className={`min-h-[40px] px-5 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition-all touch-press active:scale-[0.98] ${
                shieldEnabled
                  ? 'bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-2xs'
                  : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs'
              }`}
            >
              {updatingShield ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : shieldEnabled ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Disattiva Shield</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Attiva Review Shield</span>
                </>
              )}
            </button>
          </div>
        </div>

        {shieldMessage && (
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{shieldMessage}</span>
          </div>
        )}
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] shadow-xs relative overflow-hidden">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
            Recensioni Salve
          </span>
          <div className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight font-mono">
            {interceptedCount}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Filtro privato attivo</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] shadow-xs relative overflow-hidden">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
            Messaggi da Leggere
          </span>
          <div className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight font-mono">
            {newFeedbacksCount}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Segnalazioni recenti</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] shadow-xs relative overflow-hidden">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
            Tasso di Protezione
          </span>
          <div className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight font-mono">
            {shieldEnabled ? '100%' : '0%'}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Filtro preventivo attivo</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-white/[0.07] shadow-xs relative overflow-hidden">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
            Google Reviews
          </span>
          <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate mt-1">
            {googleReviewUrl ? googleReviewUrl.replace('https://', '') : 'Non configurato'}
          </div>
          <div className="mt-3">
            <Link
              href="/dashboard/profile"
              className="text-[11px] text-zinc-900 dark:text-zinc-100 hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Configura URL</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* PRIVATE FEEDBACKS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              <span>Segnalazioni e Reclami Intercettati ({feedbacks.length})</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Ospiti che hanno valutato da 1 a 3 stelle lasciando una nota interna prima dell&apos;uscita.
            </p>
          </div>

          <button
            onClick={loadData}
            title="Ricarica lista"
            className="p-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {feedbacks.length === 0 ? (
          <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.07] bg-white dark:bg-zinc-900/40 p-10 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">Nessuna recensione negativa intercettata</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Il sistema è in ascolto. Quando un ospite inserisce una valutazione da 1 a 3 stelle, la segnalazione comparirà qui in forma riservata per consentire di gestire l&apos;esperienza internamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 sm:p-5 transition-all shadow-xs ${
                  item.status === 'new'
                    ? 'bg-white dark:bg-zinc-900/80 border-amber-300 dark:border-amber-500/30'
                    : 'bg-white/60 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-white/[0.05] opacity-90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    {/* Stars badge */}
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= item.rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-zinc-300 dark:text-zinc-600'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 ml-1 font-mono">
                        {item.rating}/5
                      </span>
                    </div>

                    {/* Customer name */}
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.customer_name || 'Ospite Anonimo'}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        item.status === 'new'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {item.status === 'new' ? 'Nuovo' : 'Letto'}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleString('it-IT')}</span>
                  </div>
                </div>

                {/* Comment */}
                <div className="bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-lg border border-zinc-200/80 dark:border-white/[0.05] text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed italic mb-3">
                  &ldquo;{item.comment}&rdquo;
                </div>

                {/* Footer bar with contact info & mark read button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
                    {item.customer_contact ? (
                      <div className="flex items-center gap-2">
                        {item.customer_contact.includes('@') ? (
                          <a
                            href={`mailto:${item.customer_contact}`}
                            className="inline-flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 hover:underline font-mono text-xs"
                          >
                            <Mail className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{item.customer_contact}</span>
                          </a>
                        ) : (
                          <a
                            href={`tel:${item.customer_contact}`}
                            className="inline-flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 hover:underline font-mono text-xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{item.customer_contact}</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500 italic text-[11px]">Nessun recapito rilasciato</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    className="self-start sm:self-auto px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
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
      <div className="rounded-xl border border-zinc-200/80 dark:border-white/[0.07] bg-white dark:bg-zinc-900/40 p-5 sm:p-6 shadow-xs">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mb-3 flex items-center gap-2">
          <span>Funzionamento del Review Shield</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Valutazioni 4 e 5 Stelle • Inoltro a Google</span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Il cliente tocca 4 o 5 stelle: la piattaforma apre istantaneamente la scheda Google Maps del locale con il form precompilato a 5 stelle, massimizzando il volume di recensioni positive.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Valutazioni 1, 2 e 3 Stelle • Intercettazione Protetta</span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Invece di approdare su Google rovinando il rating medio, il cliente compila un feedback riservato. La segnalazione arriva qui e su Telegram per consentirti di rimediare prima che sia troppo tardi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { 
  Star, 
  Send, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  HeartHandshake, 
  AlertCircle,
  Wand2,
  Award,
  Copy,
  Check,
  Zap,
  Sun,
  Tag,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ReviewPageProps {
  params: Promise<{ code: string }>;
}

export default function ReviewShieldPage({ params }: ReviewPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code ? resolvedParams.code.toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<{
    id: string;
    organization_id: string;
    destination_url: string;
  } | null>(null);
  const [org, setOrg] = useState<{
    name: string;
    logo_url: string | null;
    google_review_url: string | null;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Rating & Pop state
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [popKey, setPopKey] = useState(0);

  // Positive state (4-5 stars)
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountdownPaused, setIsCountdownPaused] = useState(false);
  const [selectedAiTags, setSelectedAiTags] = useState<string[]>(['Cibo squisito', 'Servizio rapido']);
  const [aiReviewText, setAiReviewText] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [copied, setCopied] = useState(false);

  // Negative/Feedback state (1-3 stars)
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Haptic feedback for tactile interactions on touch devices
  const triggerHaptic = (pattern: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!code) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // 1. Fetch active device
      const { data: dev, error: devErr } = await supabase
        .from('devices')
        .select('id, organization_id, destination_url, status')
        .eq('unique_code', code)
        .eq('status', 'active')
        .single();

      if (devErr || !dev) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setDevice(dev);

      // 2. Fetch organization
      if (dev.organization_id) {
        const { data: orgData } = await supabase
          .from('public_organizations')
          .select('name, logo_url, google_review_url')
          .eq('id', dev.organization_id)
          .single();

        if (orgData) {
          setOrg(orgData);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [code]);

  // Visual countdown timer for 4-5 stars auto-redirect
  useEffect(() => {
    if (!rating || rating < 4 || isCountdownPaused || countdown === null) return;
    if (countdown <= 0) {
      handleImmediateRedirect();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [rating, countdown, isCountdownPaused]);

  // Handle rating selection with star pop & celebrations
  const handleSelectRating = (stars: number) => {
    setRating(stars);
    setPopKey((k) => k + 1);

    if (stars >= 4) {
      triggerHaptic([25, 45, 30]);
      // Start 5-second countdown
      setCountdown(5);
      setIsCountdownPaused(false);
    } else {
      triggerHaptic(18);
      setCountdown(null);
    }
  };

  const toggleAiTag = (tag: string) => {
    triggerHaptic(15);
    setIsCountdownPaused(true); // Pause auto-redirect if guest customizes AI tags
    setSelectedAiTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleGenerateAiReview = async () => {
    triggerHaptic(20);
    setIsCountdownPaused(true);
    setGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueName: org?.name || 'questo locale',
          tags: selectedAiTags,
          rating: rating || 5,
        }),
      });
      const data = await res.json();
      if (data.reviewText) {
        setAiReviewText(data.reviewText);
      }
    } catch (e) {
      console.warn('Error generating AI review:', e);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleCopyAndGoToGoogle = async () => {
    triggerHaptic([30, 45, 30]);
    if (aiReviewText && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(aiReviewText);
        setCopied(true);
      } catch (e) {
        console.warn('Clipboard write failed:', e);
      }
    }

    const targetUrl = org?.google_review_url || device?.destination_url || 'https://google.com';
    const destination = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

    setTimeout(() => {
      window.open(destination, '_blank');
    }, 600);
  };

  // Immediate manual redirect for positive rating
  const handleImmediateRedirect = () => {
    triggerHaptic(20);
    const targetUrl = org?.google_review_url || device?.destination_url || 'https://google.com';
    const destination = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    window.location.href = destination;
  };

  // Submit private feedback for 1-3 stars
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setFeedbackError('Per favore scrivi due righe sul motivo della tua valutazione.');
      return;
    }

    setSubmittingFeedback(true);
    setFeedbackError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: device?.organization_id,
          device_id: device?.id,
          rating: rating || 3,
          customer_name: customerName.trim() || null,
          customer_contact: customerContact.trim() || null,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l\'invio');
      }

      setFeedbackSubmitted(true);
      triggerHaptic([20, 50, 40]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      setFeedbackError(msg);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 rounded-2xl border border-[#27272A] bg-[#111114] text-center space-y-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto animate-pulse motion-reduce:animate-none" />
          <div className="h-5 bg-zinc-800 rounded w-3/4 mx-auto animate-pulse motion-reduce:animate-none" />
          <div className="h-4 bg-zinc-800 rounded w-1/2 mx-auto animate-pulse motion-reduce:animate-none" />
          <div className="flex justify-center gap-2 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-12 h-12 bg-zinc-800 rounded-xl animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !device) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090B] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 rounded-2xl border border-red-500/20 bg-[#111114] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold">Dispositivo non trovato</h2>
          <p className="text-xs text-zinc-400">
            Questo chip NFC o codice QR (<span className="font-mono text-white">{code}</span>) non risulta associato a un punto vendita attivo.
          </p>
        </div>
      </div>
    );
  }

  const ratingLabels: Record<number, string> = {
    1: 'Pessima esperienza',
    2: 'Esperienza da migliorare',
    3: 'Esperienza nella media',
    4: 'Esperienza molto buona',
    5: 'Esperienza eccellente!',
  };

  const activeHoverOrRating = hoverRating || rating || 0;

  return (
    <div className="min-h-screen min-h-dvh bg-[#09090B] text-[#FAFAFA] flex flex-col justify-between p-4 sm:p-5 overflow-x-hidden selection:bg-[#BFFF00] selection:text-[#09090B]">
      {/* TOP NAVIGATION: BACK TO HUB */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between gap-2 z-10 pb-2">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3.5 min-h-[48px] rounded-xl bg-[#111114] hover:bg-[#18181B] border border-[#27272A] text-xs font-semibold text-zinc-200 hover:text-white transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00]"
        >
          <ArrowLeft className="w-4 h-4 text-[#BFFF00]" />
          <span>Torna all&apos;Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full bg-[#111114] border border-[#27272A] text-[11px] font-mono text-zinc-300">
          <ShieldCheck className="w-3.5 h-3.5 text-[#BFFF00]" />
          <span>Review Shield™</span>
        </span>
      </nav>

      {/* Header venue branding */}
      <div className="max-w-md w-full mx-auto text-center pt-2 sm:pt-3">
        {org?.logo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={org.logo_url}
            alt={org.name}
            width={56}
            height={56}
            className="w-14 h-14 rounded-2xl object-cover mx-auto mb-2.5 border border-[#27272A] shadow-xl"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-[#111114] border border-[#27272A] flex items-center justify-center mx-auto mb-2.5 text-lg font-bold text-[#BFFF00] shadow-xl">
            {org?.name ? org.name.charAt(0).toUpperCase() : 'R'}
          </div>
        )}

        <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
          {org?.name || 'La tua opinione'}
        </h1>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
          Come valuteresti la tua esperienza oggi?
        </p>
      </div>

      {/* Main card */}
      <div className="max-w-md w-full mx-auto my-auto py-4">
        <div className="rounded-2xl border border-[#27272A] bg-[#111114] shadow-2xl p-5 sm:p-6 space-y-5">

          {/* Star selector */}
          <div className="space-y-3">
            <div className="flex justify-center items-center gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating || 0) >= star;
                const shouldPop = popKey > 0 && (rating || 0) >= star;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleSelectRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    aria-label={`Valuta ${star} stelle su 5`}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer ${
                      shouldPop ? 'animate-star-pop motion-reduce:animate-none' : ''
                    } ${
                      isFilled
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/60 scale-105 shadow-[0_0_16px_rgba(245,158,11,0.3)]'
                        : 'bg-[#18181B] text-zinc-500 border border-[#27272A] hover:text-zinc-300 hover:border-white/20'
                    }`}
                    style={shouldPop ? { animationDelay: `${(star - 1) * 45}ms` } : undefined}
                  >
                    <Star
                      key={`${star}-${popKey}`}
                      className={`w-6 h-6 sm:w-7 sm:h-7 transition-all duration-200 ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Dynamic Label */}
            <div className="h-6 text-center">
              {activeHoverOrRating > 0 ? (
                <span className="text-xs sm:text-sm font-semibold text-amber-400 inline-block font-mono">
                  {ratingLabels[activeHoverOrRating]}
                </span>
              ) : (
                <span className="text-xs text-zinc-400">Tocca una stella per valutare</span>
              )}
            </div>
          </div>

          {/* POSITIVE FLOW: 4 or 5 stars WITH AI REVIEW BOOSTER */}
          {rating && rating >= 4 && (
            <div className="pt-4 border-t border-[#27272A] text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-[#BFFF00]/15 border border-[#BFFF00]/40 text-[#BFFF00] flex items-center justify-center mx-auto">
                <HeartHandshake className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Grazie di cuore!</h3>
                <p className="text-xs text-zinc-300 mt-1">
                  La tua opinione è fondamentale. Aiutaci su Google con una recensione a 5 stelle!
                </p>
              </div>

              {/* PULSING VISUAL COUNTDOWN TO GOOGLE REVIEWS */}
              {countdown !== null && !isCountdownPaused && (
                <div className="relative overflow-hidden p-3.5 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/40 text-left space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping motion-reduce:hidden absolute inline-flex h-full w-full rounded-full bg-[#BFFF00] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#BFFF00]"></span>
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5 flex-wrap">
                          <span>Reindirizzamento Google Reviews</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#BFFF00] text-[#09090B] font-mono text-[11px] font-bold tabular-nums">
                            {countdown}s
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          Apertura automatica della scheda recensioni
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(10);
                          setIsCountdownPaused(true);
                        }}
                        className="min-h-[44px] px-3.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs text-zinc-200 font-semibold transition-all active:scale-95 cursor-pointer"
                      >
                        Pausa
                      </button>
                      <button
                        type="button"
                        onClick={handleImmediateRedirect}
                        className="min-h-[44px] px-4 rounded-xl bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      >
                        <span>Vai ora</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Countdown progress bar */}
                  <div className="h-1 bg-black/50 rounded-full overflow-hidden w-full">
                    <div
                      className="h-full bg-[#BFFF00] transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${(countdown / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {isCountdownPaused && (
                <div className="px-3.5 py-2.5 rounded-xl bg-[#18181B] border border-[#27272A] text-xs text-zinc-300 flex items-center justify-between gap-2 text-left">
                  <span>Timer in pausa: usa l&apos;AI per creare una recensione perfetta!</span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      setIsCountdownPaused(false);
                      setCountdown(5);
                    }}
                    className="min-h-[44px] px-2.5 text-[#BFFF00] hover:underline font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Riprendi</span>
                  </button>
                </div>
              )}

              {/* AI Review Booster Box */}
              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] text-left space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#BFFF00] flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-[#BFFF00]" />
                    <span>AI Review Booster</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#BFFF00]/20 text-[#BFFF00] font-mono">1-CLICK</span>
                  </span>
                  <span className="text-[11px] text-zinc-400">Cosa ti è piaciuto di più?</span>
                </div>

                {/* Quick Tags Selector */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'cibo', label: 'Cibo squisito', icon: Award },
                    { id: 'servizio', label: 'Servizio rapido', icon: Zap },
                    { id: 'staff', label: 'Staff accogliente', icon: Sun },
                    { id: 'location', label: 'Bella atmosfera', icon: Star },
                    { id: 'prezzo', label: 'Prezzo onesto', icon: Tag },
                  ].map((tag) => {
                    const TagIcon = tag.icon;
                    const isSelected = selectedAiTags.includes(tag.label);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleAiTag(tag.label)}
                        className={`text-xs min-h-[44px] px-3 rounded-xl border transition-all duration-150 flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-[#BFFF00]/15 text-[#BFFF00] border-[#BFFF00]/60 font-semibold'
                            : 'bg-[#111114] text-zinc-300 border-[#27272A] hover:text-white hover:border-zinc-600'
                        }`}
                      >
                        <TagIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{tag.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Generated AI Review Preview */}
                {aiReviewText ? (
                  <div className="space-y-3 pt-2 border-t border-[#27272A] animate-fade-in">
                    <p className="text-xs text-zinc-100 italic bg-[#09090B] p-3 rounded-xl border border-[#27272A] leading-relaxed">
                      &ldquo;{aiReviewText}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyAndGoToGoogle}
                      className="w-full min-h-[48px] bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#BFFF00]/20 active:scale-[0.98] cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 shrink-0" />
                          <span>Testo Copiato! Incolla su Google</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 shrink-0" />
                          <span>Copia &amp; Apri Google Reviews</span>
                        </>
                      )}
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateAiReview}
                    disabled={generatingAi}
                    className="w-full min-h-[48px] bg-[#111114] hover:bg-[#27272A] text-white font-semibold text-xs px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-[#27272A] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {generatingAi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none text-[#BFFF00]" />
                        <span>Scrittura in corso con AI...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 text-[#BFFF00]" />
                        <span>Genera recensione ottimizzata con AI</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleImmediateRedirect}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-4 text-xs text-zinc-300 hover:text-white transition-colors rounded-xl border border-[#27272A] hover:border-white/20 active:scale-95 cursor-pointer"
                >
                  <span>Oppure vai direttamente a Google Reviews</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#BFFF00]" />
                </button>
              </div>
            </div>
          )}

          {/* NEGATIVE/CONSTRUCTIVE FLOW: 1, 2 or 3 stars */}
          {rating && rating <= 3 && !feedbackSubmitted && (
            <div className="pt-4 border-t border-[#27272A] space-y-4 animate-fade-in text-left">
              {/* Badge protetto "Messaggio riservato alla direzione" */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#18181B] border border-emerald-500/35 rounded-xl px-3.5 py-2.5">
                <div className="inline-flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-white">
                    Messaggio riservato alla direzione
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-medium text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Privato al 100%
                </span>
              </div>

              {/* Rassicurazione cliente */}
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 p-3.5 rounded-xl text-amber-200">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                <div className="text-xs leading-relaxed">
                  <strong className="block text-white font-semibold mb-0.5">
                    Ci dispiace che qualcosa non sia andato come previsto.
                  </strong>
                  Questa segnalazione <span className="text-emerald-400 font-semibold">non sarà pubblicata online</span>. Viene recapitata direttamente e riservatamente alla direzione per risolvere il problema e migliorare il servizio.
                </div>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-3">
                <div>
                  <label htmlFor="review-comment" className="block text-xs font-medium text-zinc-200 mb-1.5">
                    Cosa possiamo migliorare? <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="review-comment"
                    rows={3}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Es. tempi di attesa, pietanza, servizio al tavolo..."
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus:border-[#BFFF00] transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="review-customer-name" className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Il tuo nome (opzionale)
                    </label>
                    <input
                      id="review-customer-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Mario Rossi"
                      className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus:border-[#BFFF00]"
                    />
                  </div>
                  <div>
                    <label htmlFor="review-customer-contact" className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Contatto (se desideri risposta)
                    </label>
                    <input
                      id="review-customer-contact"
                      type="text"
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      placeholder="Cellulare o Email"
                      className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus:border-[#BFFF00]"
                    />
                  </div>
                </div>

                {feedbackError && (
                  <p className="text-xs text-red-400">{feedbackError}</p>
                )}

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full min-h-[48px] bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111114]"
                >
                  {submittingFeedback ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
                      <span>Invio in corso...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Invia privatamente alla direzione</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* FEEDBACK CONFIRMATION (1-3 stars submitted) */}
          {rating && rating <= 3 && feedbackSubmitted && (
            <div className="pt-4 border-t border-[#27272A] text-center space-y-3 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Messaggio inviato</h3>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
                Grazie per la tua franchezza. Il titolare ha ricevuto la tua segnalazione e faremo tutto il possibile per offrirti un&apos;esperienza migliore.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Hardware RIVO Footer Badge */}
      <footer className="w-full max-w-md mx-auto pt-3 pb-2 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111114] border border-[#27272A] text-[11px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
          <span>Esperienza protetta da</span>
          <strong className="text-white font-bold tracking-wide">RIVO</strong>
        </div>
      </footer>
    </div>
  );
}

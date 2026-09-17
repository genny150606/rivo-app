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
  Sparkles,
  Copy,
  Check,
  Zap,
  Sun,
  Tag,
  Loader2,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
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
          .from('organizations')
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
      // Start 5-second pulsing countdown
      setCountdown(5);
      setIsCountdownPaused(false);

      // Golden & festive celebratory confetti
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#BFFF00', '#FACC15', '#FFD700', '#F59E0B', '#FFFFFF'],
          startVelocity: 35,
          ticks: 200,
        });

        // Dual side bursts
        setTimeout(() => {
          confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0.15, y: 0.65 },
            colors: ['#BFFF00', '#FACC15', '#FFD700', '#FFFFFF'],
          });
          confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 0.85, y: 0.65 },
            colors: ['#BFFF00', '#FACC15', '#FFD700', '#FFFFFF'],
          });
        }, 150);
      } catch (e) {
        console.warn('Confetti error:', e);
      }
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

    // Mini confetti celebratory flash on successful copy
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#BFFF00', '#FACC15', '#FFFFFF'],
      });
    } catch {}

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
      <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 rounded-2xl border border-[#27272A] bg-[#121214] text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto" />
          <div className="h-5 bg-zinc-800 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-zinc-800 rounded w-1/2 mx-auto" />
          <div className="flex justify-center gap-2 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-10 h-10 bg-zinc-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !device) {
    return (
      <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 rounded-2xl border border-red-500/20 bg-[#18181B] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold">Dispositivo non trovato</h2>
          <p className="text-xs text-zinc-400">
            Questo chip NFC o codice QR ({code}) non risulta associato a un punto vendita attivo.
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
    <div className="min-h-screen min-h-dvh h-screen sm:h-dvh bg-[#09090B] text-zinc-100 flex flex-col justify-between p-3 sm:p-5 overflow-y-auto selection:bg-[#BFFF00] selection:text-black">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#BFFF00]/10 blur-[100px] pointer-events-none rounded-full" />

      {/* TOP NAVIGATION: BACK TO HUB */}
      <nav className="w-full max-w-md mx-auto flex items-center justify-between z-10 pt-1 pb-1">
        <Link
          href={`/hub/${code}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all active:scale-95 min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4 text-[#BFFF00]" />
          <span>Torna all&apos;Hub</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-[#BFFF00]" />
          <span>Review Shield</span>
        </span>
      </nav>

      {/* Header venue branding */}
      <div className="max-w-md w-full mx-auto text-center pt-2 sm:pt-4">
        {org?.logo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={org.logo_url}
            alt={org.name}
            className="w-14 h-14 rounded-2xl object-cover mx-auto mb-2 border border-[#27272A] shadow-xl"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#18181B] to-[#27272A] border border-zinc-700 flex items-center justify-center mx-auto mb-2 text-lg font-bold text-[#BFFF00] shadow-xl">
            {org?.name ? org.name.charAt(0).toUpperCase() : 'R'}
          </div>
        )}

        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          {org?.name || 'La tua opinione'}
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5 max-w-xs mx-auto">
          Come valuteresti la tua esperienza oggi?
        </p>
      </div>

      {/* Main card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="rounded-2xl border border-[#27272A] bg-[#121214]/90 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-6">
          
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
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all duration-200 transform active:scale-90 touch-press ${
                      shouldPop ? 'animate-star-pop' : ''
                    } ${
                      isFilled
                        ? 'bg-[#BFFF00]/15 text-[#BFFF00] border border-[#BFFF00]/60 scale-105 shadow-[0_0_18px_rgba(191,255,0,0.35)] ring-1 ring-[#BFFF00]/30'
                        : 'bg-[#18181B] text-zinc-600 border border-[#27272A] hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                    style={shouldPop ? { animationDelay: `${(star - 1) * 45}ms` } : undefined}
                  >
                    <Star
                      key={`${star}-${popKey}`}
                      className={`w-6 h-6 sm:w-7 sm:h-7 transition-all duration-300 ${
                        isFilled
                          ? 'fill-[#BFFF00] text-[#BFFF00] drop-shadow-[0_0_8px_rgba(191,255,0,0.6)]'
                          : 'text-zinc-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Dynamic Label */}
            <div className="h-6 text-center">
              {activeHoverOrRating > 0 ? (
                <span className="text-xs sm:text-sm font-semibold text-[#BFFF00] animate-fade-in inline-block">
                  {ratingLabels[activeHoverOrRating]}
                </span>
              ) : (
                <span className="text-xs text-zinc-500">Tocca una stella per valutare</span>
              )}
            </div>
          </div>

          {/* POSITIVE FLOW: 4 or 5 stars WITH AI REVIEW BOOSTER */}
          {rating && rating >= 4 && (
            <div className="pt-4 border-t border-[#27272A] text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-[#BFFF00]/10 text-[#BFFF00] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(191,255,0,0.2)]">
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
                <div className="relative overflow-hidden p-3.5 rounded-xl bg-gradient-to-r from-[#BFFF00]/15 via-[#BFFF00]/5 to-transparent border border-[#BFFF00]/40 shadow-[0_0_25px_rgba(191,255,0,0.18)] animate-fade-in text-left">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BFFF00] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#BFFF00]"></span>
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>Reindirizzamento Google Reviews</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-[#BFFF00]/25 text-[#BFFF00] font-mono text-[11px] font-bold">
                            {countdown}s
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          Apertura automatica della scheda recensioni
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(10);
                          setIsCountdownPaused(true);
                        }}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 font-medium transition-all active:scale-95 touch-press"
                      >
                        Pausa
                      </button>
                      <button
                        type="button"
                        onClick={handleImmediateRedirect}
                        className="px-3 py-1 text-[11px] rounded-lg bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold transition-all flex items-center gap-1 shadow-sm active:scale-95 touch-press"
                      >
                        <span>Vai ora</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Countdown progress bar */}
                  <div className="mt-2.5 h-1 bg-black/40 rounded-full overflow-hidden w-full">
                    <div 
                      className="h-full bg-[#BFFF00] transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${(countdown / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {isCountdownPaused && (
                <div className="px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between animate-fade-in text-left">
                  <span>Timer in pausa: usa l&apos;AI per creare una recensione perfetta!</span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      setIsCountdownPaused(false);
                      setCountdown(5);
                    }}
                    className="text-[#BFFF00] hover:underline font-medium ml-2 shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Riprendi</span>
                  </button>
                </div>
              )}

              {/* AI Review Booster Box */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-[#18181B] to-[#121214] border border-[#27272A] text-left space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#BFFF00] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#BFFF00]" />
                    <span>AI Review Booster</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#BFFF00]/20 text-[#BFFF00] font-mono">1-CLICK</span>
                  </span>
                  <span className="text-[11px] text-zinc-500">Cosa ti è piaciuto di più?</span>
                </div>

                {/* Quick Tags Selector with tactile response */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'cibo', label: 'Cibo squisito', icon: Sparkles },
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
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all duration-200 flex items-center gap-1.5 touch-press active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-[#BFFF00]/15 text-[#BFFF00] border-[#BFFF00]/50 font-medium scale-[1.03] shadow-[0_0_12px_rgba(191,255,0,0.18)]'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <TagIcon className="w-3 h-3 shrink-0" />
                        <span>{tag.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Generated AI Review Preview */}
                {aiReviewText ? (
                  <div className="space-y-2 pt-2 border-t border-zinc-800 animate-fade-in">
                    <p className="text-xs text-zinc-200 italic bg-black/40 p-2.5 rounded-lg border border-zinc-800">
                      &ldquo;{aiReviewText}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyAndGoToGoogle}
                      className="w-full min-h-[46px] bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#BFFF00]/25 touch-press active:scale-[0.97]"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-black animate-star-pop" />
                          <span>Testo Copiato! Incolla su Google</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-black" />
                          <span>Copia & Apri Google Reviews</span>
                        </>
                      )}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateAiReview}
                    disabled={generatingAi}
                    className="w-full min-h-[42px] bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700 touch-press active:scale-[0.98] disabled:opacity-50"
                  >
                    {generatingAi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#BFFF00]" />
                        <span>Scrittura in corso con AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#BFFF00]" />
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
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors py-1 px-3 rounded-lg border border-transparent hover:border-zinc-800 active:scale-95 touch-press"
                >
                  <span>Oppure vai direttamente a Google Reviews</span>
                  <ArrowRight className="w-3 h-3 text-[#BFFF00]" />
                </button>
              </div>
            </div>
          )}

          {/* NEGATIVE/CONSTRUCTIVE FLOW: 1, 2 or 3 stars */}
          {rating && rating <= 3 && !feedbackSubmitted && (
            <div className="pt-4 border-t border-[#27272A] space-y-4 animate-fade-in text-left">
              {/* Badge protetto "Messaggio riservato alla direzione" */}
              <div className="flex items-center justify-between bg-zinc-900/90 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 shadow-sm">
                <div className="inline-flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-white tracking-wide">
                    Messaggio riservato alla direzione
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-medium text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Privato al 100%
                </span>
              </div>

              {/* Rassicurazione cliente */}
              <div className="flex items-start gap-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl text-amber-300 shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                <div className="text-xs leading-relaxed">
                  <strong className="block text-white font-medium mb-0.5">Ci dispiace che qualcosa non sia andato come previsto.</strong>
                  Questa segnalazione <span className="text-emerald-400 font-medium">non sarà pubblicata online</span>. Viene recapitata direttamente e riservatamente alla direzione per risolvere il problema e migliorare il servizio.
                </div>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Cosa possiamo migliorare? <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Es. tempi di attesa, pietanza, servizio al tavolo..."
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#BFFF00] transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Il tuo nome (opzionale)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Mario Rossi"
                      className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#BFFF00]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Contatto (se desideri risposta)
                    </label>
                    <input
                      type="text"
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      placeholder="Cellulare o Email"
                      className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#BFFF00]"
                    />
                  </div>
                </div>

                {feedbackError && (
                  <p className="text-xs text-red-400">{feedbackError}</p>
                )}

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full min-h-[46px] bg-zinc-200 hover:bg-white text-black font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 touch-press active:scale-[0.98] disabled:opacity-50 shadow-md"
                >
                  {submittingFeedback ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                      <span>Invio in corso...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
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
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
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

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center pb-4 text-[11px] text-zinc-600">
        <span>Esperienza protetta da </span>
        <strong className="text-zinc-400 font-semibold">RIVO</strong>
      </footer>
    </div>
  );
}

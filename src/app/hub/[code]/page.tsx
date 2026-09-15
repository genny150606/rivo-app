'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Utensils,
  BellRing,
  Wifi,
  Sparkles,
  Wine,
  CreditCard,
  Star,
  Scissors,
  CalendarCheck,
  Compass,
  HeartPulse,
  ShoppingBag,
  Dumbbell,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Info,
  X,
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createClient } from '@supabase/supabase-js';
import { BusinessCategory } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface HubPageProps {
  params: Promise<{ code: string }>;
}

interface OrgData {
  id: string;
  name: string;
  logo_url: string | null;
  category: BusinessCategory;
  phone: string | null;
  website: string | null;
  custom_cta_label: string | null;
  custom_cta_url: string | null;
  city_guide_text: string | null;
  google_review_url: string | null;
  review_shield_enabled: boolean;
  smart_routing_enabled: boolean;
  lunch_destination_url: string | null;
  lunch_start_time: string | null;
  lunch_end_time: string | null;
  wifi_ssid: string | null;
  loyalty_reward_text: string | null;
  ai_menu_context: string | null;
}

interface DeviceData {
  id: string;
  name: string;
  unique_code: string;
  destination_url: string;
}

export default function UniversalHubPage({ params }: HubPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code ? resolvedParams.code.toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Modals & Interactivity
  const [showCityGuide, setShowCityGuide] = useState(false);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isLunchTime, setIsLunchTime] = useState(false);

  useEffect(() => {
    async function loadHub() {
      if (!code) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch active device
        const { data: dev, error: devErr } = await supabase
          .from('devices')
          .select('id, organization_id, name, unique_code, destination_url, status')
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
          const { data: orgData, error: orgErr } = await supabase
            .from('organizations')
            .select(`
              id,
              name,
              logo_url,
              category,
              phone,
              website,
              custom_cta_label,
              custom_cta_url,
              city_guide_text,
              google_review_url,
              review_shield_enabled,
              smart_routing_enabled,
              lunch_destination_url,
              lunch_start_time,
              lunch_end_time,
              wifi_ssid,
              loyalty_reward_text,
              ai_menu_context
            `)
            .eq('id', dev.organization_id)
            .single();

          if (!orgErr && orgData) {
            setOrg({
              ...orgData,
              category: (orgData.category || 'restaurant') as BusinessCategory,
            });

            // Check if lunch hours apply
            if (orgData.smart_routing_enabled && orgData.lunch_destination_url) {
              try {
                const romeFormatter = new Intl.DateTimeFormat('it-IT', {
                  timeZone: 'Europe/Rome',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                });
                const currentRomeTime = romeFormatter.format(new Date());
                const start = orgData.lunch_start_time || '12:00';
                const end = orgData.lunch_end_time || '15:30';
                if (currentRomeTime >= start && currentRomeTime <= end) {
                  setIsLunchTime(true);
                }
              } catch (e) {
                console.warn('Could not calculate Rome time:', e);
              }
            }
          }
        }
      } catch (err) {
        console.error('Hub load error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadHub();
  }, [code]);

  // Handle rating click from the Hub review widget
  const handleRatingClick = (stars: number) => {
    setSelectedRating(stars);
    if (stars >= 4) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#BFFF00', '#FACC15', '#38BDF8', '#FFFFFF'],
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
    // Redirect to review shield page after brief animation
    setTimeout(() => {
      window.location.href = `/review/${code}`;
    }, 650);
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090b] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#18181B] border border-[#27272A] flex items-center justify-center mb-3 animate-pulse">
          <Sparkles className="w-7 h-7 text-[#BFFF00] animate-spin" />
        </div>
        <p className="text-zinc-400 text-xs font-medium animate-pulse">Caricamento esperienza RIVO...</p>
      </div>
    );
  }

  if (notFound || !org) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3 text-red-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-bold text-white mb-1.5">Dispositivo non trovato</h1>
        <p className="text-xs text-zinc-400 max-w-xs mb-5">
          Il tag NFC o codice QR (<span className="text-white font-mono">{code}</span>) non è attivo o non è configurato.
        </p>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
        >
          Torna alla Home
        </Link>
      </div>
    );
  }

  // Category Configuration Helper
  const categoryConfig: Record<
    BusinessCategory,
    { label: string; icon: string; badgeColor: string; subtitle: string }
  > = {
    restaurant: {
      label: 'Ristorante & Bar',
      icon: '🍽️',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      subtitle: 'Tutti i servizi del tavolo a portata di tap',
    },
    salon: {
      label: 'Salone & Beauty',
      icon: '💈',
      badgeColor: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
      subtitle: 'La tua esperienza di bellezza esclusiva',
    },
    hotel: {
      label: 'Hotel & B&B',
      icon: '🏨',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      subtitle: 'Benvenuto! Servizi per un soggiorno perfetto',
    },
    medical: {
      label: 'Studio Medico',
      icon: '🩺',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      subtitle: 'Servizi digitali dedicati ai pazienti',
    },
    retail: {
      label: 'Boutique & Retail',
      icon: '🛍️',
      badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      subtitle: 'Offerte esclusive e vantaggi in store',
    },
    generic: {
      label: 'Palestra & Servizi',
      icon: '🏢',
      badgeColor: 'bg-lime-500/10 text-lime-400 border-lime-500/20',
      subtitle: 'Accedi rapidamente a tutti i servizi',
    },
  };

  const currentCat = categoryConfig[org.category] || categoryConfig.restaurant;
  const hasCustomCta = Boolean(org.custom_cta_label && org.custom_cta_url);

  const menuTargetUrl = isLunchTime && org.lunch_destination_url
    ? org.lunch_destination_url
    : org.custom_cta_url || org.website || `tel:${org.phone || ''}`;

  return (
    <div className="min-h-screen min-h-dvh h-screen sm:h-dvh bg-[#09090b] text-white flex flex-col justify-between p-2.5 sm:p-4 md:p-6 overflow-x-hidden overflow-y-auto relative selection:bg-[#BFFF00] selection:text-black">
      {/* Background ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] h-[220px] bg-[#BFFF00]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Viewport-adaptive Main Container */}
      <div className="w-full max-w-lg md:max-w-4xl lg:max-w-5xl mx-auto my-auto flex-1 flex flex-col justify-between py-1 sm:py-2 relative z-10 gap-2.5 sm:gap-3.5">
        
        {/* RESPONSIVE DESKTOP/TABLET/MOBILE LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-4 md:items-center my-auto">

          {/* LEFT PANEL: IDENTITY, HERO CTA, REVIEW SHIELD */}
          <div className="md:col-span-5 flex flex-col justify-center gap-2.5 sm:gap-3">
            
            {/* BRAND HEADER CARD */}
            <header className="rounded-2xl border border-[#27272A] bg-gradient-to-b from-[#18181B] to-[#121214] p-3 sm:p-4 relative overflow-hidden shadow-lg">
              <div className="flex items-center gap-3">
                {/* Logo / Monogram */}
                <div className="shrink-0">
                  {org.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-[#27272A] shadow-md bg-black"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-[#3F3F46] flex items-center justify-center text-2xl shadow-md">
                      <span>{currentCat.icon}</span>
                    </div>
                  )}
                </div>

                {/* Identity Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${currentCat.badgeColor}`}>
                      <span>{currentCat.icon}</span>
                      <span>{currentCat.label}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 border border-white/10 text-[10px] text-zinc-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-pulse" />
                      <span>NFC</span>
                      {device?.name && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span className="text-white font-medium truncate max-w-[80px]">{device.name}</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                    {org.name}
                  </h1>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {currentCat.subtitle}
                  </p>
                </div>
              </div>
            </header>

            {/* HERO FEATURED CTA BANNER (If defined) */}
            {hasCustomCta && (
              <a
                href={org.custom_cta_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block rounded-2xl border-2 border-[#BFFF00] bg-gradient-to-r from-[#BFFF00]/15 via-[#18181B] to-[#BFFF00]/10 p-2.5 sm:p-3 shadow-[0_0_20px_rgba(191,255,0,0.12)] hover:shadow-[0_0_25px_rgba(191,255,0,0.2)] transition-all active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold text-[#BFFF00] bg-[#BFFF00]/20 px-1.5 py-0.2 rounded-full mb-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> In Evidenza
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#BFFF00] transition-colors">
                      {org.custom_cta_label}
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[#BFFF00] text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </a>
            )}

            {/* COMPACT REVIEW SHIELD SECTION */}
            <div className="rounded-2xl border border-[#27272A] bg-gradient-to-b from-[#18181B] to-[#121214] p-2.5 sm:p-3 shadow-md flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-[#BFFF00]" />
                  <span>Valuta la tua esperienza</span>
                </div>
                <span className="text-[10px] text-zinc-400">1-Tap Google</span>
              </div>

              {/* 5 Stars Rating Bar */}
              <div className="flex items-center justify-around py-1 bg-black/30 rounded-xl border border-white/5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (ratingHover !== null ? ratingHover >= star : (selectedRating !== null && selectedRating >= star));
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(null)}
                      onClick={() => handleRatingClick(star)}
                      className="p-1 transition-transform hover:scale-125 active:scale-95 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Vota ${star} stelle`}
                    >
                      <Star
                        className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                            : 'text-zinc-600 fill-zinc-800/40'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: SERVICES GRID (ADAPTIVE 2-COL / 3-COL TILES) */}
          <div className="md:col-span-7 flex flex-col justify-center gap-1.5 sm:gap-2">
            
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Servizi Rapidi Disponibili
              </span>
              <span className="text-[10px] text-[#BFFF00] font-mono">Tocca per aprire</span>
            </div>

            {/* SERVICES TILES GRID (2 COLS ON MOBILE & DESKTOP) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 flex-1 content-start">
              
              {/* ====== RESTAURANT TILES ====== */}
              {org.category === 'restaurant' && (
                <>
                  {/* Menù Digitale */}
                  <a
                    href={menuTargetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-amber-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate">Menù Digitale</span>
                        {isLunchTime && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">Piatti & prezzi</p>
                    </div>
                  </a>

                  {/* Chiama Cameriere */}
                  <Link
                    href={`/call/${code}`}
                    className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-red-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white truncate block">Chiama Sala</span>
                      <p className="text-[10px] text-zinc-400 truncate">Cameriere o conto</p>
                    </div>
                  </Link>

                  {/* AI Sommelier */}
                  <Link
                    href={`/ai-sommelier/${code}`}
                    className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-purple-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Wine className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white truncate block">AI Sommelier</span>
                      <p className="text-[10px] text-zinc-400 truncate">Consigli abbinamento</p>
                    </div>
                  </Link>
                </>
              )}

              {/* ====== SALON & BEAUTY TILES ====== */}
              {org.category === 'salon' && (
                <>
                  <a
                    href={org.custom_cta_url || (org.phone ? `tel:${org.phone}` : '#')}
                    target={org.custom_cta_url ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-fuchsia-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white truncate block">Prenota Taglio</span>
                      <p className="text-[10px] text-zinc-400 truncate">Scegli orario</p>
                    </div>
                  </a>

                  {org.website ? (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-pink-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
                    >
                      <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-white truncate block">Lookbook</span>
                        <p className="text-[10px] text-zinc-400 truncate">Listino & trattamenti</p>
                      </div>
                    </a>
                  ) : (
                    <div className="rounded-xl border border-[#27272A] bg-[#121214] p-2.5 sm:p-3 flex items-center gap-2.5 min-h-[56px]">
                      <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-white truncate block">Salone Style</span>
                        <p className="text-[10px] text-zinc-400 truncate">Hair & Beauty</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ====== HOTEL & B&B TILES ====== */}
              {org.category === 'hotel' && (
                <>
                  <a
                    href={org.phone ? `tel:${org.phone}` : org.custom_cta_url || '#'}
                    className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-sky-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white truncate block">Reception</span>
                      <p className="text-[10px] text-zinc-400 truncate">Contatto diretto H24</p>
                    </div>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowCityGuide(true)}
                    className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-amber-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px] text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white truncate block">Guida Città</span>
                      <p className="text-[10px] text-zinc-400 truncate">Luoghi consigliati</p>
                    </div>
                  </button>
                </>
              )}

              {/* ====== MEDICAL & CLINIC TILES ====== */}
              {org.category === 'medical' && (
                <>
                  <a
                    href={org.custom_cta_url || (org.phone ? `tel:${org.phone}` : '#')}
                    target={org.custom_cta_url ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-emerald-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white truncate block">Prenota Visita</span>
                      <p className="text-[10px] text-zinc-400 truncate">Segreteria rapida</p>
                    </div>
                  </a>

                  {org.phone && (
                    <a
                      href={`tel:${org.phone}`}
                      className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-cyan-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
                    >
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-white truncate block">Segreteria</span>
                        <p className="text-[10px] text-zinc-400 truncate">Chiama studio</p>
                      </div>
                    </a>
                  )}
                </>
              )}

              {/* ====== RETAIL & BOUTIQUE TILES ====== */}
              {org.category === 'retail' && (
                <>
                  <a
                    href={org.custom_cta_url || org.website || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-violet-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white truncate block">Nuovi Arrivi</span>
                      <p className="text-[10px] text-zinc-400 truncate">Catalogo & sconti</p>
                    </div>
                  </a>
                </>
              )}

              {/* ====== GENERIC / GYM & SERVICES TILES ====== */}
              {org.category === 'generic' && (
                <>
                  <a
                    href={org.custom_cta_url || org.website || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-lime-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-lime-500/10 border border-lime-500/20 text-lime-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white truncate block">Orari & Corsi</span>
                      <p className="text-[10px] text-zinc-400 truncate">Programmazione</p>
                    </div>
                  </a>
                </>
              )}

              {/* ====== SHARED MODULES (WI-FI, WHEEL, LOYALTY) ====== */}

              {/* Wi-Fi 1-Tap */}
              <Link
                href={`/wifi/${code}`}
                className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-blue-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Wifi className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white truncate block">Wi-Fi Gratuito</span>
                  <p className="text-[10px] text-zinc-400 truncate">Accesso 1-tap</p>
                </div>
              </Link>

              {/* Ruota della Fortuna */}
              <Link
                href={`/wheel/${code}`}
                className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-[#BFFF00]/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
              >
                <div className="w-9 h-9 rounded-lg bg-[#BFFF00]/10 border border-[#BFFF00]/20 text-[#BFFF00] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white truncate">Ruota Premi</span>
                    <span className="text-[9px] bg-[#BFFF00]/20 text-[#BFFF00] font-bold px-1 rounded">Vinci</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate">Gira & sblocca sconti</p>
                </div>
              </Link>

              {/* Carta Fedeltà */}
              <Link
                href={`/loyalty/${code}`}
                className="rounded-xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] hover:border-emerald-500/40 p-2.5 sm:p-3 flex items-center gap-2.5 group transition-all active:scale-[0.98] min-h-[56px]"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white truncate block">Carta Fedeltà</span>
                  <p className="text-[10px] text-zinc-400 truncate">Timbri digitali</p>
                </div>
              </Link>

            </div>

          </div>

        </div>

        {/* CITY GUIDE MODAL (For Hotel & B&B) */}
        {showCityGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-[#121214] border border-[#27272A] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
                  <Compass className="w-4 h-4" />
                  <span>Guida & Luoghi Consigliati</span>
                </div>
                <button
                  onClick={() => setShowCityGuide(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {org.city_guide_text ? (
                  <p>{org.city_guide_text}</p>
                ) : (
                  <div className="text-center py-3 space-y-1.5">
                    <p className="text-zinc-400 text-xs">
                      I consigli personalizzati su attrazioni, ristoranti convenzionati e trasporti saranno disponibili a breve.
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Chiedi direttamente alla reception per qualsiasi necessità!
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowCityGuide(false)}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors min-h-[44px]"
              >
                Chiudi Guida
              </button>
            </div>
          </div>
        )}

        {/* MINIMAL VIEWPORT FOOTER */}
        <footer className="text-center pt-1 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
          <span className="font-medium text-zinc-400 truncate max-w-[150px] sm:max-w-xs">{org.name}</span>
          <span className="text-zinc-600">•</span>
          <span>Powered by</span>
          <span className="text-[#BFFF00] font-semibold">RIVO</span>
        </footer>

      </div>
    </div>
  );
}

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
    }, 700);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-[#18181B] border border-[#27272A] flex items-center justify-center mb-4 animate-pulse">
          <Sparkles className="w-8 h-8 text-[#BFFF00] animate-spin" />
        </div>
        <p className="text-zinc-400 text-sm font-medium animate-pulse">Caricamento esperienza RIVO...</p>
      </div>
    );
  }

  if (notFound || !org) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Dispositivo non trovato</h1>
        <p className="text-sm text-zinc-400 max-w-xs mb-6">
          Il tag NFC o codice QR scansionato (<span className="text-white font-mono">{code}</span>) non è attivo o non è configurato.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
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
      subtitle: 'Servizi digitali dedicati ai nostri pazienti',
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

  // Custom Primary CTA resolution
  const hasCustomCta = Boolean(org.custom_cta_label && org.custom_cta_url);

  // Digital menu target resolution
  const menuTargetUrl = isLunchTime && org.lunch_destination_url
    ? org.lunch_destination_url
    : org.custom_cta_url || org.website || `tel:${org.phone || ''}`;

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-start p-4 sm:p-6 overflow-x-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] sm:w-[500px] h-[300px] bg-[#BFFF00]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main container */}
      <div className="w-full max-w-lg mx-auto flex flex-col space-y-5 sm:space-y-6 relative z-10 pt-2 pb-12">
        
        {/* TOP BRANDING & HEADER */}
        <header className="rounded-3xl border border-[#27272A] bg-gradient-to-b from-[#18181B] to-[#121214] p-5 sm:p-6 text-center relative overflow-hidden shadow-2xl">
          {/* Subtle NFC connection pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] text-zinc-400 font-medium mb-3 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse" />
            <span>NFC Experience attiva</span>
            {device?.name && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-white font-semibold">{device.name}</span>
              </>
            )}
          </div>

          {/* Logo or Monogram */}
          <div className="flex justify-center mb-3">
            {org.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logo_url}
                alt={org.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#27272A] shadow-xl bg-black"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border-2 border-[#3F3F46] flex items-center justify-center text-3xl shadow-xl">
                <span>{currentCat.icon}</span>
              </div>
            )}
          </div>

          {/* Organization Name & Category Badge */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
            {org.name}
          </h1>

          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${currentCat.badgeColor}`}>
              <span>{currentCat.icon}</span>
              <span>{currentCat.label}</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
            {currentCat.subtitle}
          </p>
        </header>

        {/* PRIMARY FEATURED HERO CTA (If defined by merchant) */}
        {hasCustomCta && (
          <a
            href={org.custom_cta_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block rounded-2xl border-2 border-[#BFFF00] bg-gradient-to-r from-[#BFFF00]/15 via-[#18181B] to-[#BFFF00]/10 p-4 sm:p-5 shadow-[0_0_25px_rgba(191,255,0,0.15)] hover:shadow-[0_0_35px_rgba(191,255,0,0.25)] transition-all transform active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-[#BFFF00] bg-[#BFFF00]/20 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> In Evidenza
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#BFFF00] transition-colors">
                  {org.custom_cta_label}
                </h3>
                <p className="text-xs text-zinc-400">
                  Tocca qui per accedere direttamente al servizio
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#BFFF00] text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ExternalLink className="w-5 h-5" />
              </div>
            </div>
          </a>
        )}

        {/* CATEGORY SPECIFIC ACTION GRID */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
            Servizi Rapidi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* ====== 1. RESTAURANT CARDS ====== */}
            {org.category === 'restaurant' && (
              <>
                {/* Menù Digitale */}
                <a
                  href={menuTargetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">Menù Digitale</span>
                        {isLunchTime && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded">Pranzo</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">Piatti, bevande & prezzi</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </a>

                {/* Chiama Cameriere / Conto */}
                <Link
                  href={`/call/${code}`}
                  className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">Chiama Cameriere</span>
                      <p className="text-xs text-zinc-400">Richiedi assistenza o il conto</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </Link>

                {/* AI Sommelier */}
                <Link
                  href={`/ai-sommelier/${code}`}
                  className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Wine className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">AI Sommelier</span>
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.2 rounded">Gemini AI</span>
                      </div>
                      <p className="text-xs text-zinc-400">Abbinamenti vino & consigli</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </Link>
              </>
            )}

            {/* ====== 2. SALON & BEAUTY CARDS ====== */}
            {org.category === 'salon' && (
              <>
                {/* Prenota Trattamento */}
                {org.custom_cta_url ? (
                  <a
                    href={org.custom_cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <CalendarCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">Prenota Appuntamento</span>
                        <p className="text-xs text-zinc-400">Scegli orario & stylist</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </a>
                ) : (
                  <a
                    href={org.phone ? `tel:${org.phone}` : '#'}
                    className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">Prenota Taglio o Piega</span>
                        <p className="text-xs text-zinc-400">{org.phone || 'Chiama il salone'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </a>
                )}

                {/* Listino Prezzi & Lookbook */}
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">Listino & Lookbook</span>
                        <p className="text-xs text-zinc-400">Trattamenti & stili</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </a>
                )}
              </>
            )}

            {/* ====== 3. HOTEL & B&B CARDS ====== */}
            {org.category === 'hotel' && (
              <>
                {/* Reception & Concierge Direct Contact */}
                <a
                  href={org.phone ? `tel:${org.phone}` : org.custom_cta_url || '#'}
                  className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">Contatta Reception</span>
                      <p className="text-xs text-zinc-400">Assistenza & servizio concierge</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </a>

                {/* Guida del Territorio / City Guide */}
                <button
                  type="button"
                  onClick={() => setShowCityGuide(true)}
                  className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px] text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">Guida del Territorio</span>
                      <p className="text-xs text-zinc-400">Cosa fare & dove mangiare</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </button>
              </>
            )}

            {/* ====== 4. MEDICAL & CLINIC CARDS ====== */}
            {org.category === 'medical' && (
              <>
                {/* Prenota Visita */}
                <a
                  href={org.custom_cta_url || (org.phone ? `tel:${org.phone}` : '#')}
                  target={org.custom_cta_url ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">Prenota o Sposta Visita</span>
                      <p className="text-xs text-zinc-400">Servizio rapido segreteria</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </a>

                {/* Segreteria Telefonica */}
                {org.phone && (
                  <a
                    href={`tel:${org.phone}`}
                    className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">Chiama Segreteria</span>
                        <p className="text-xs text-zinc-400">{org.phone}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </a>
                )}
              </>
            )}

            {/* ====== 5. RETAIL & BOUTIQUE CARDS ====== */}
            {org.category === 'retail' && (
              <>
                {/* Catalogo / Collezione */}
                <a
                  href={org.custom_cta_url || org.website || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">Nuovi Arrivi & Promo</span>
                      <p className="text-xs text-zinc-400">Guarda le collezioni esclusive</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </a>
              </>
            )}

            {/* ====== 6. GENERIC / GYM & SERVICES CARDS ====== */}
            {org.category === 'generic' && (
              <>
                {/* Orari & Corsi */}
                <a
                  href={org.custom_cta_url || org.website || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-lime-500/10 border border-lime-500/20 text-lime-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">Orari, Corsi & Info</span>
                      <p className="text-xs text-zinc-400">Scopri la programmazione</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </a>
              </>
            )}

            {/* ====== UNIVERSAL SHARED MODULES ====== */}

            {/* Wi-Fi Guests Easy Connect */}
            <Link
              href={`/wifi/${code}`}
              className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">Wi-Fi Gratuito</span>
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.2 rounded">1-Tap</span>
                  </div>
                  <p className="text-xs text-zinc-400">Accesso istantaneo senza password</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </Link>

            {/* Ruota della Fortuna (Wheel of Fortune) */}
            <Link
              href={`/wheel/${code}`}
              className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/20 text-[#BFFF00] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">Ruota della Fortuna</span>
                    <span className="text-[9px] bg-[#BFFF00]/20 text-[#BFFF00] font-bold px-1.5 py-0.2 rounded">Vinci Subito</span>
                  </div>
                  <p className="text-xs text-zinc-400">Gira e sblocca sconti & omaggi</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </Link>

            {/* Fidelity Pass / Card Timbri */}
            <Link
              href={`/loyalty/${code}`}
              className="rounded-2xl border border-[#27272A] bg-[#121214] hover:bg-[#18181B] p-4 flex items-center justify-between group transition-all active:scale-[0.98] min-h-[72px]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">Carta Fedeltà</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded">Timbri</span>
                  </div>
                  <p className="text-xs text-zinc-400">Colleziona timbri & premi esclusivi</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </Link>

          </div>
        </div>

        {/* INTEGRATED REVIEW SHIELD SECTION */}
        <div className="rounded-3xl border border-[#27272A] bg-gradient-to-b from-[#18181B] to-[#121214] p-5 sm:p-6 text-center shadow-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BFFF00]/10 border border-[#BFFF00]/20 text-[11px] text-[#BFFF00] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Valutazione Esperienza</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white">
            Come valuti la tua esperienza da noi?
          </h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Il tuo feedback è fondamentale per offrirvi sempre il massimo standard.
          </p>

          {/* Interactive Star Rating Selector */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = (ratingHover !== null ? ratingHover >= star : (selectedRating !== null && selectedRating >= star));
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setRatingHover(star)}
                  onMouseLeave={() => setRatingHover(null)}
                  onClick={() => handleRatingClick(star)}
                  className="p-1.5 transition-transform hover:scale-125 active:scale-95 focus:outline-none min-h-[48px] min-w-[48px] flex items-center justify-center"
                  aria-label={`Vota ${star} stelle`}
                >
                  <Star
                    className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'text-zinc-600 fill-zinc-800/40'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <Link
              href={`/review/${code}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              <span>Oppure apri la scheda recensione completa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* CITY GUIDE MODAL (For Hotel & B&B or custom guide) */}
        {showCityGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-[#121214] border border-[#27272A] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Compass className="w-4 h-4" />
                  <span>Guida & Luoghi Consigliati</span>
                </div>
                <button
                  onClick={() => setShowCityGuide(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {org.city_guide_text ? (
                  <p>{org.city_guide_text}</p>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-zinc-400 text-xs">
                      I consigli personalizzati del nostro staff su attrazioni, ristoranti tipici e trasporti saranno disponibili a breve.
                    </p>
                    <p className="text-xs text-zinc-500">
                      Chiedi direttamente alla reception per qualsiasi suggerimento in tempo reale!
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowCityGuide(false)}
                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors min-h-[44px]"
              >
                Chiudi Guida
              </button>
            </div>
          </div>
        )}

        {/* FOOTER & POWERED BY RIVO */}
        <footer className="text-center pt-4 text-xs text-zinc-500 space-y-1">
          <p className="font-medium text-zinc-400">
            {org.name}
          </p>
          <p className="text-[11px] text-zinc-600 flex items-center justify-center gap-1">
            <span>Powered by</span>
            <span className="text-[#BFFF00] font-semibold">RIVO</span>
            <span>— Smart NFC Experience</span>
          </p>
        </footer>

      </div>
    </div>
  );
}

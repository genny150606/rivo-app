'use client';

import { useEffect, useState, use, useMemo } from 'react';
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
  AlertCircle,
  Share2,
  Search,
  Check,
  Tag,
  Pizza,
  Beef,
  Cake,
  UtensilsCrossed,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createClient } from '@supabase/supabase-js';
import { BusinessCategory } from '@/lib/types';
import { getCategoryDefinition } from '@/lib/categories';

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
  description?: string | null;
}

interface DeviceData {
  id: string;
  name: string;
  unique_code: string;
  destination_url: string;
}

interface MenuItem {
  id: string;
  category: 'antipasti' | 'primi' | 'secondi' | 'dolci' | 'bevande';
  name: string;
  description: string;
  price: string;
  tags?: string[];
  popular?: boolean;
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // Antipasti
  {
    id: 'ant-1',
    category: 'antipasti',
    name: 'Tagliere di Salumi & Formaggi DOP',
    description: 'Selezione di crudo di Parma 24 mesi, pecorino toscano, confettura di fichi e focaccia calda.',
    price: '14,00 €',
    tags: ['Tradizione', 'Da Condividere'],
    popular: true,
  },
  {
    id: 'ant-2',
    category: 'antipasti',
    name: 'Tartare di Manzo Fassona Piemontese',
    description: 'Battuta al coltello con senape in grani, tuorlo d’uovo marinato e cialda croccante al sesamo.',
    price: '15,00 €',
    tags: ['Gourmet', 'Gluten Free'],
  },
  {
    id: 'ant-3',
    category: 'antipasti',
    name: 'Bruschettoni Caldi Pomodorino & Bufala',
    description: 'Pane casereccio tostato con pomodorini di Collina, mozzarella di bufala campana e basilico fresco.',
    price: '9,50 €',
    tags: ['Vegetariano'],
  },
  // Primi
  {
    id: 'pri-1',
    category: 'primi',
    name: 'Spaghettone Artigianale alla Carbonara',
    description: 'Guanciale croccante di Amatrice, pecorino romano DOP, tuorlo d’uovo pastorizzato e pepe nero tostato.',
    price: '13,50 €',
    tags: ['Piatto Iconico', 'Chef Special'],
    popular: true,
  },
  {
    id: 'pri-2',
    category: 'primi',
    name: 'Ravioli di Burrata Pugliese al Limone',
    description: 'Pasta fresca tirata a mano con ripieno cremoso, datterino giallo confit e zeste di limone di Sorrento.',
    price: '14,50 €',
    tags: ['Vegetariano', 'Pasta Fresca'],
  },
  {
    id: 'pri-3',
    category: 'primi',
    name: 'Risotto ai Funghi Porcini & Tartufo',
    description: 'Riso Carnaroli mantecato al parmigiano reggiano 30 mesi e lamelle di tartufo nero estivo.',
    price: '16,00 €',
    tags: ['Gluten Free'],
  },
  // Secondi
  {
    id: 'sec-1',
    category: 'secondi',
    name: 'Tagliata di Black Angus con Rosmarino',
    description: 'Carne tenerissima cotta su brace di faggio, sale Maldon in fiocchi e patate novelle al forno.',
    price: '19,00 €',
    tags: ['Black Angus', 'Gluten Free'],
    popular: true,
  },
  {
    id: 'sec-2',
    category: 'secondi',
    name: 'Filetto di Spigola in Crosta di Patate',
    description: 'Spigola fresca sfilettata con scaglie di patate dorate, vellutata di zucchine e mentuccia selvatica.',
    price: '18,50 €',
    tags: ['Pesce Fresco'],
  },
  // Dolci
  {
    id: 'dol-1',
    category: 'dolci',
    name: 'Tiramisù Tradizionale della Casa',
    description: 'Savoiardi sardi bagnati al caffè espresso arabica, crema al mascarpone fresca e cacao amaro.',
    price: '6,50 €',
    tags: ['Fatto in Casa'],
    popular: true,
  },
  {
    id: 'dol-2',
    category: 'dolci',
    name: 'Cheesecake al Caramello Salato & Noci',
    description: 'Base friabile di frolla burrosa con crema soffice al formaggio e glassa artigianale al caramello.',
    price: '7,00 €',
    tags: ['Dolce del Giorno'],
  },
  // Bevande & Carta Vini
  {
    id: 'bev-1',
    category: 'bevande',
    name: 'Calice Chianti Classico DOCG (Riserva)',
    description: 'Rosso toscano elegante, profumi di ciliegia matura e spezie dolci.',
    price: '6,00 €',
    tags: ['Carta Vini'],
  },
  {
    id: 'bev-2',
    category: 'bevande',
    name: 'Franciacorta Brut DOCG al Calice',
    description: 'Metodo classico brillante con perlage fine e persistente, ideale come aperitivo.',
    price: '7,50 €',
    tags: ['Bollicine'],
  },
  {
    id: 'bev-3',
    category: 'bevande',
    name: 'Signature Spritz & Cocktail Artigianali',
    description: 'Aperol/Campari Spritz classico oppure selezione di cocktail miscelati al bancone.',
    price: '6,50 €',
    tags: ['Aperitivo'],
  },
];

export default function UniversalHubPage({ params }: HubPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code ? resolvedParams.code.toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Modals & Interactivity
  const [showCityGuide, setShowCityGuide] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuTab, setMenuTab] = useState<'tutti' | 'antipasti' | 'primi' | 'secondi' | 'dolci' | 'bevande'>('tutti');
  const [menuSearch, setMenuSearch] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [sharedNotification, setSharedNotification] = useState(false);

  // Star Rating Bar
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
              ai_menu_context,
              description
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

  // Web Share or Copy Link
  const handleShare = async () => {
    const shareData = {
      title: org?.name || 'RIVO Hub',
      text: `Scopri i servizi esclusivi e il menù di ${org?.name || 'questo locale'}!`,
      url: window.location.href,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Share dismissed
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setSharedNotification(true);
      setTimeout(() => setSharedNotification(false), 2500);
    }
  };

  // Filter menu items
  const filteredMenuItems = useMemo(() => {
    return DEFAULT_MENU_ITEMS.filter((item) => {
      const matchesCategory = menuTab === 'tutti' || item.category === menuTab;
      const matchesSearch =
        !menuSearch.trim() ||
        item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(menuSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuTab, menuSearch]);

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

  // Category Configuration Helper using pure Lucide SVG icons
  const catDef = getCategoryDefinition(org.category);
  const CatIcon = catDef.icon;
  const currentCat = {
    label: catDef.badgeLabel,
    badgeColor: 'bg-[#BFFF00]/10 text-[#BFFF00] border-[#BFFF00]/25',
    subtitle: org.description || catDef.desc,
  };

  const hasCustomCta = Boolean(org.custom_cta_label && org.custom_cta_url);

  // Star feelings label
  const activeStar = ratingHover || selectedRating || 0;
  const starFeelings: Record<number, { text: string; color: string; bg: string }> = {
    5: { text: '5 Stelle • Esperienza Eccellente!', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
    4: { text: '4 Stelle • Molto Soddisfatto', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30' },
    3: { text: '3 Stelle • Nella Media', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
    2: { text: '2 Stelle • Invia feedback privato', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
    1: { text: '1 Stella • Invia feedback privato', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
  };

  return (
    <div className="min-h-screen min-h-dvh h-screen sm:h-dvh bg-[#09090b] text-white flex flex-col justify-between p-2.5 sm:p-4 md:p-6 overflow-x-hidden overflow-y-auto relative selection:bg-[#BFFF00] selection:text-black">
      {/* Background ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] h-[220px] bg-[#BFFF00]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Share Toast Notification */}
      {sharedNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#18181B] border border-[#BFFF00]/40 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-[#BFFF00]" />
          <span>Link copiato negli appunti!</span>
        </div>
      )}

      {/* Viewport-adaptive Main Container */}
      <div className="w-full max-w-lg md:max-w-4xl lg:max-w-5xl mx-auto my-auto flex-1 flex flex-col justify-between py-1 sm:py-2 relative z-10 gap-2.5 sm:gap-3.5">
        
        {/* RESPONSIVE DESKTOP/TABLET/MOBILE LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-4 md:items-center my-auto">

          {/* LEFT PANEL: IDENTITY, HERO CTA, REVIEW SHIELD */}
          <div className="md:col-span-5 flex flex-col justify-center gap-2.5 sm:gap-3">
            
            {/* BRAND HEADER CARD */}
            <header className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#18181B]/90 via-[#141416]/80 to-[#101012] backdrop-blur-xl p-3 sm:p-4 md:p-5 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Logo / Monogram */}
                  <div className="shrink-0 relative">
                    {org.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={org.logo_url}
                        alt={org.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl object-cover border border-white/10 shadow-lg bg-black ring-2 ring-white/5"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 flex items-center justify-center text-white shadow-lg ring-2 ring-white/5">
                        <CatIcon className="w-6 h-6 md:w-8 md:h-8 text-[#BFFF00]" />
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  {/* Identity Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] md:text-xs font-semibold border ${currentCat.badgeColor}`}>
                        <CatIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{catDef.label}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] md:text-xs text-zinc-300 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-pulse" />
                        <span>NFC</span>
                        {device?.name && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-white font-medium truncate max-w-[85px] sm:max-w-xs">{device.name}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <h1 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-white truncate">
                      {org.name}
                    </h1>
                    <p className="text-[11px] md:text-xs text-zinc-400 truncate">
                      {currentCat.subtitle}
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons (Share & Contact) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Condividi locale"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    aria-label="Info e contatti"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </header>

            {/* HERO FEATURED CTA BANNER (If defined) */}
            {hasCustomCta && (
              <a
                href={org.custom_cta_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block rounded-2xl border-2 border-[#BFFF00]/80 bg-gradient-to-r from-[#BFFF00]/20 via-[#18181B] to-[#BFFF00]/10 p-2.5 sm:p-3 shadow-[0_0_20px_rgba(191,255,0,0.15)] hover:shadow-[0_0_25px_rgba(191,255,0,0.25)] transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] uppercase tracking-wider font-extrabold text-[#BFFF00] bg-[#BFFF00]/20 px-2 py-0.5 rounded-full mb-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> In Evidenza
                    </span>
                    <h3 className="text-xs sm:text-sm md:text-base font-bold text-white truncate group-hover:text-[#BFFF00] transition-colors">
                      {org.custom_cta_label}
                    </h3>
                  </div>
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#BFFF00] text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </a>
            )}

            {/* COMPACT REVIEW SHIELD SECTION WITH DYNAMIC STAR FEELINGS */}
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#18181B]/90 to-[#121214] backdrop-blur-xl p-2.5 sm:p-3 md:p-3.5 shadow-xl flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-[#BFFF00]" />
                  <span>Valuta la tua esperienza</span>
                </div>
                <span className="text-[10px] md:text-xs text-zinc-400">1-Tap Google</span>
              </div>

              {/* 5 Stars Rating Bar */}
              <div className="flex items-center justify-around py-1 bg-black/40 rounded-xl border border-white/5">
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
                        className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-all ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] scale-110'
                            : 'text-zinc-600 fill-zinc-800/40'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Star feelings text pill */}
              <div className="h-5 text-center mt-1 flex items-center justify-center">
                {activeStar > 0 ? (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${starFeelings[activeStar]?.bg} ${starFeelings[activeStar]?.color} animate-fade-in`}>
                    <span>{starFeelings[activeStar]?.text}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500">Tocca una stella per valutare o inviare un feedback</span>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: SERVICES GRID (ADAPTIVE 2-COL / 3-COL TILES) */}
          <div className="md:col-span-7 flex flex-col justify-center gap-1.5 sm:gap-2">
            
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Servizi Rapidi al Tavolo
              </span>
              <span className="text-[10px] text-[#BFFF00] font-mono">Tocca per aprire</span>
            </div>

            {/* SERVICES TILES GRID (2 COLS ON MOBILE & DESKTOP) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 flex-1 content-start">
              
              {/* ====== RESTAURANT TILES ====== */}
              {org.category === 'restaurant' && (
                <>
                  {/* Menù Digitale (Interactive In-App Modal) */}
                  <button
                    type="button"
                    onClick={() => setShowMenuModal(true)}
                    className="text-left rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      <Utensils className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs md:text-sm font-bold text-white truncate">Menù Digitale</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1 rounded">Sfoglia</span>
                      </div>
                      <p className="text-[10px] md:text-xs text-zinc-400 truncate">Piatti, prezzi & vini</p>
                    </div>
                  </button>

                  {/* Chiama Cameriere */}
                  <Link
                    href={`/call/${code}`}
                    className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-rose-500/40 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                      <BellRing className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs md:text-sm font-bold text-white truncate">Chiama Sala</span>
                        <span className="text-[9px] bg-rose-500/20 text-rose-300 font-bold px-1 rounded">1-Tap</span>
                      </div>
                      <p className="text-[10px] md:text-xs text-zinc-400 truncate">Cameriere o conto</p>
                    </div>
                  </Link>

                  {/* AI Sommelier */}
                  <Link
                    href={`/ai-sommelier/${code}`}
                    className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                      <Wine className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs md:text-sm font-bold text-white truncate">AI Sommelier</span>
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 font-bold px-1 rounded">AI</span>
                      </div>
                      <p className="text-[10px] md:text-xs text-zinc-400 truncate">Consigli abbinamento</p>
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
                    className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-fuchsia-500/40 p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <CalendarCheck className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs md:text-sm font-bold text-white truncate block">Prenota Taglio</span>
                      <p className="text-[10px] md:text-xs text-zinc-400 truncate">Scegli orario</p>
                    </div>
                  </a>

                  {org.website ? (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-pink-500/40 p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
                    >
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Scissors className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs md:text-sm font-bold text-white truncate block">Lookbook</span>
                        <p className="text-[10px] md:text-xs text-zinc-400 truncate">Listino & trattamenti</p>
                      </div>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowContactModal(true)}
                      className="text-left rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 min-h-[58px] md:min-h-[64px]"
                    >
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center shrink-0">
                        <Scissors className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs md:text-sm font-bold text-white truncate block">Salone Style</span>
                        <p className="text-[10px] md:text-xs text-zinc-400 truncate">Info & trattamenti</p>
                      </div>
                    </button>
                  )}
                </>
              )}

              {/* ====== HOTEL & B&B TILES ====== */}
              {org.category === 'hotel' && (
                <>
                  <a
                    href={org.phone ? `tel:${org.phone}` : '#'}
                    onClick={() => !org.phone && setShowContactModal(true)}
                    className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-sky-500/40 p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <BellRing className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs md:text-sm font-bold text-white truncate block">Reception</span>
                      <p className="text-[10px] md:text-xs text-zinc-400 truncate">Contatto diretto H24</p>
                    </div>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowCityGuide(true)}
                    className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-amber-500/40 p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px] text-left"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Compass className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs md:text-sm font-bold text-white truncate block">Guida Città</span>
                      <p className="text-[10px] md:text-xs text-zinc-400 truncate">Luoghi consigliati</p>
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
                    className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-emerald-500/40 p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <CalendarCheck className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs md:text-sm font-bold text-white truncate block">Prenota Visita</span>
                      <p className="text-[10px] md:text-xs text-zinc-400 truncate">Segreteria rapida</p>
                    </div>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="text-left rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-cyan-500/40 p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Phone className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs md:text-sm font-bold text-white truncate block">Segreteria</span>
                      <p className="text-[10px] md:text-xs text-zinc-400 truncate">Chiama studio</p>
                    </div>
                  </button>
                </>
              )}

              {/* ====== RETAIL & BOUTIQUE TILES ====== */}
              {org.category === 'retail' && (
                <>
                  <a
                    href={org.custom_cta_url || org.website || '#'}
                    onClick={() => !org.custom_cta_url && !org.website && setShowContactModal(true)}
                    target={org.custom_cta_url || org.website ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-violet-500/40 p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs md:text-sm font-bold text-white truncate block">Nuovi Arrivi</span>
                      <p className="text-[10px] md:text-xs text-zinc-400 truncate">Catalogo & sconti</p>
                    </div>
                  </a>
                </>
              )}

              {/* ====== GENERIC / GYM & SERVICES TILES ====== */}
              {org.category === 'generic' && (
                <>
                  <a
                    href={org.custom_cta_url || org.website || '#'}
                    onClick={() => !org.custom_cta_url && !org.website && setShowContactModal(true)}
                    target={org.custom_cta_url || org.website ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-lime-500/40 p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-lime-500/15 border border-lime-500/30 text-lime-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Dumbbell className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs md:text-sm font-bold text-white truncate block">Orari & Corsi</span>
                      <p className="text-[10px] md:text-xs text-zinc-400 truncate">Programmazione</p>
                    </div>
                  </a>
                </>
              )}

              {/* ====== SHARED MODULES (WI-FI, WHEEL, LOYALTY) ====== */}

              {/* Wi-Fi 1-Tap */}
              <Link
                href={`/wifi/${code}`}
                className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-sky-500/40 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(14,165,233,0.2)]">
                  <Wifi className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs md:text-sm font-bold text-white truncate">Wi-Fi Ospiti</span>
                    <span className="text-[9px] bg-sky-500/20 text-sky-300 font-bold px-1 rounded">Gratis</span>
                  </div>
                  <p className="text-[10px] md:text-xs text-zinc-400 truncate">Accesso 1-tap</p>
                </div>
              </Link>

              {/* Ruota della Fortuna */}
              <Link
                href={`/wheel/${code}`}
                className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-[#BFFF00]/40 hover:shadow-[0_0_20px_rgba(191,255,0,0.2)] p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#BFFF00]/15 border border-[#BFFF00]/30 text-[#BFFF00] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(191,255,0,0.2)]">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs md:text-sm font-bold text-white truncate">Ruota Premi</span>
                    <span className="text-[9px] bg-[#BFFF00]/20 text-[#BFFF00] font-bold px-1 rounded">Vinci</span>
                  </div>
                  <p className="text-[10px] md:text-xs text-zinc-400 truncate">Gira & vinci sconti</p>
                </div>
              </Link>

              {/* Carta Fedeltà */}
              <Link
                href={`/loyalty/${code}`}
                className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 hover:bg-[#18181B] hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] p-2.5 sm:p-3 md:p-3.5 flex items-center gap-2.5 md:gap-3 group transition-all active:scale-[0.96] min-h-[58px] md:min-h-[64px]"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs md:text-sm font-bold text-white truncate">Carta Fedeltà</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1 rounded">Timbri</span>
                  </div>
                  <p className="text-[10px] md:text-xs text-zinc-400 truncate">Raccolta punti smart</p>
                </div>
              </Link>

            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE DIGITAL MENU MODAL (FOR RESTAURANT) */}
        {/* ========================================================================= */}
        {showMenuModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg bg-[#121214] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden space-y-3">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white">Menù Digitale</h3>
                    <p className="text-[10px] sm:text-[11px] text-zinc-400">{org.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* External Menu Button if exists */}
                  {(org.lunch_destination_url || org.website) && (
                    <a
                      href={org.lunch_destination_url || org.website!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1"
                    >
                      <span>PDF / Web</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => setShowMenuModal(false)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                    aria-label="Chiudi menù"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chef Notes & Daily Context Banner */}
              {org.ai_menu_context && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-amber-300 text-[11px] uppercase tracking-wider font-bold">Consiglio dello Chef</strong>
                    <span>{org.ai_menu_context}</span>
                  </div>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Cerca piatti, ingredienti..."
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Category Pills with pure Lucide SVG icons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'tutti', label: 'Tutti', icon: Utensils },
                  { id: 'antipasti', label: 'Antipasti', icon: Pizza },
                  { id: 'primi', label: 'Primi', icon: UtensilsCrossed },
                  { id: 'secondi', label: 'Secondi', icon: Beef },
                  { id: 'dolci', label: 'Dolci', icon: Cake },
                  { id: 'bevande', label: 'Vini & Bar', icon: Wine },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMenuTab(tab.id as typeof menuTab)}
                      className={`shrink-0 text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                        menuTab === tab.id
                          ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                          : 'bg-white/[0.05] text-zinc-400 hover:text-white border border-white/5'
                      }`}
                    >
                      <TabIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Dish List */}
              <div className="overflow-y-auto flex-1 space-y-2.5 pr-1 max-h-[50vh]">
                {filteredMenuItems.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    Nessun piatto trovato con questi criteri di ricerca.
                  </div>
                ) : (
                  filteredMenuItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-white">{item.name}</h4>
                          {item.popular && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded-full">
                              Top
                            </span>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-[#BFFF00] font-mono shrink-0">
                          {item.price}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {item.description}
                      </p>

                      {item.tags && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-2 py-0.5 rounded-md bg-black/40 text-zinc-400 border border-white/5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Quick Order Footer */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                <Link
                  href={`/call/${code}`}
                  onClick={() => setShowMenuModal(false)}
                  className="flex-1 min-h-[42px] bg-[#BFFF00] hover:bg-[#a8e000] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#BFFF00]/20 active:scale-95"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Chiama Cameriere per Ordinare</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowMenuModal(false)}
                  className="px-4 min-h-[42px] bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Chiudi
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CONTACT & DIRECT ASSISTANCE MODAL */}
        {/* ========================================================================= */}
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-sm bg-[#121214] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#BFFF00]/15 text-[#BFFF00] flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Info & Assistenza</h3>
                    <p className="text-[10px] text-zinc-400">{org.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Device table info */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-zinc-400">Postazione Attuale:</span>
                  <strong className="text-white font-mono">{device?.name || code}</strong>
                </div>

                {/* Phone Call Option */}
                {org.phone && (
                  <a
                    href={`tel:${org.phone}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-white block">Telefono Locale</span>
                        <span className="text-[10px] text-zinc-400">{org.phone}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-bold group-hover:underline">Chiama</span>
                  </a>
                )}

                {/* WhatsApp Option if phone present */}
                {org.phone && (
                  <a
                    href={`https://wa.me/${org.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Ciao! Sono al ${device?.name || 'tavolo'} di ${org.name}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-white block">Chat WhatsApp</span>
                        <span className="text-[10px] text-zinc-400">Messaggio diretto al locale</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-bold group-hover:underline">Chat</span>
                  </a>
                )}

                {/* Website Option */}
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-sky-400" />
                      <div>
                        <span className="font-bold text-white block">Sito Web Ufficiale</span>
                        <span className="text-[10px] text-zinc-400 truncate max-w-[180px] block">{org.website}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-sky-400 font-bold group-hover:underline">Apri</span>
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors min-h-[42px]"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CITY GUIDE MODAL (For Hotel & B&B) */}
        {/* ========================================================================= */}
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

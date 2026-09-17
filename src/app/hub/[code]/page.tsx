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
  ShoppingBag,
  Dumbbell,
  ExternalLink,
  ShieldCheck,
  Info,
  X,
  Phone,
  Clock,
  MessageCircle,
  AlertCircle,
  Share2,
  Search,
  Check,
  Pizza,
  Beef,
  Cake,
  UtensilsCrossed,
  Home,
  BookOpen,
  Bell,
  Award,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createClient } from '@supabase/supabase-js';
import { BusinessCategory } from '@/lib/types';
import { getCategoryDefinition } from '@/lib/categories';
import { DEFAULT_HUB_COLOR, getContrastColor } from '@/lib/palettes';

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
  whatsapp_number?: string | null;
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
  primary_color?: string | null;
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
  const [, setIsLunchTime] = useState(false);

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
              whatsapp_number,
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
              description,
              primary_color
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
    const primaryColor = org?.primary_color || DEFAULT_HUB_COLOR;
    if (stars >= 4) {
      try {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.7 },
          colors: [primaryColor, '#FACC15', '#38BDF8', '#FFFFFF'],
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

  const primaryColor = org?.primary_color || DEFAULT_HUB_COLOR;
  const contrastText = getContrastColor(primaryColor);

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#0b0e0c] flex flex-col items-center justify-center p-4">
        <div
          className="w-14 h-14 rounded-2xl bg-[#141715] border border-white/10 flex items-center justify-center mb-3 animate-pulse"
          style={{ boxShadow: `0 0 25px ${primaryColor}25` }}
        >
          <Sparkles className="w-7 h-7 animate-spin" style={{ color: primaryColor }} />
        </div>
        <p className="text-zinc-400 text-xs font-medium animate-pulse">Caricamento esperienza RIVO...</p>
      </div>
    );
  }

  if (notFound || !org) {
    return (
      <div className="min-h-screen min-h-dvh bg-[#0b0e0c] flex flex-col items-center justify-center p-6 text-center">
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

  // Category Definition
  const catDef = getCategoryDefinition(org.category);
  const CatIcon = catDef.icon;
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
    <div className="min-h-screen min-h-dvh bg-[#0c0f0d] text-white flex flex-col justify-between relative selection:bg-white selection:text-black">
      {/* Ambient background soft glow based on activity's primary color */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[340px] sm:w-[520px] h-[240px] blur-[140px] rounded-full pointer-events-none opacity-25"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Share Toast Notification */}
      {sharedNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#161816] border border-white/20 text-white px-4 py-2 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" style={{ color: primaryColor }} />
          <span>Link copiato negli appunti!</span>
        </div>
      )}

      {/* Center Phone-Proportioned Main Container */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-4 pt-2.5 sm:pt-4 pb-24 sm:pb-28 relative z-10 gap-2.5 sm:gap-3">
        
        {/* ========================================================================= */}
        {/* TOP APP BAR / HEADER (Stagger 1) */}
        {/* ========================================================================= */}
        <header className="animate-nfc-stagger-1 flex items-center justify-between gap-3 pt-0.5">
          {/* Left: Avatar / Logo + Business Name */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="shrink-0 relative">
              {org.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={org.logo_url}
                  alt={org.name}
                  className="w-11 h-11 rounded-full object-cover border-2 shadow-md bg-black"
                  style={{ borderColor: primaryColor }}
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shadow-md text-black font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  <CatIcon className="w-5 h-5" style={{ color: contrastText }} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-base font-extrabold tracking-tight text-white truncate leading-tight">
                {org.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                <span className="font-semibold text-zinc-300 truncate max-w-[140px]">
                  {catDef.label}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-500 font-mono text-[10px]">RIVO Hub</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Notification & Action Icons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Bell with Badge */}
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              aria-label="Notifiche e assistenza"
              className="touch-press w-9 h-9 rounded-full bg-[#181b19] hover:bg-[#202421] border border-white/[0.08] text-zinc-300 hover:text-white flex items-center justify-center transition-all relative active:scale-95"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#181b19] animate-pulse" />
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Condividi locale"
              className="touch-press w-9 h-9 rounded-full bg-[#181b19] hover:bg-[#202421] border border-white/[0.08] text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* BADGE TAVOLO CONNESSO (Stagger 2) */}
        {/* ========================================================================= */}
        <div className="animate-nfc-stagger-2 flex items-center justify-between px-3.5 py-2 rounded-2xl bg-[#141715]/90 border border-white/[0.08] backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Pulsing emerald dot (animate-ping + solid dot) for real-time live connection feedback */}
            <div className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
            </div>
            <div className="flex items-center gap-1.5 text-xs min-w-0">
              <span className="text-zinc-400 font-medium shrink-0">Tavolo Connesso:</span>
              <span className="font-bold text-white tracking-wide truncate max-w-[150px] sm:max-w-[200px]">
                {device?.name || 'Tavolo Ospiti'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shrink-0">
            NFC LIVE
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SQUIRCLE ACTION GRID (2 COLUMNS x 3 ROWS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">

          {/* ====== RESTAURANT TILES ====== */}
          {org.category === 'restaurant' && (
            <>
              {/* CARD 1 (HERO HIGHLIGHT): MENÙ DIGITALE */}
              <button
                type="button"
                onClick={() => setShowMenuModal(true)}
                className="animate-nfc-stagger-3 animate-hero-glow touch-press active:scale-95 rounded-3xl p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-xl group relative overflow-hidden"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastText,
                  boxShadow: `0 10px 25px ${primaryColor}35`,
                  '--hero-glow-1': `${primaryColor}35`,
                  '--hero-glow-2': `${primaryColor}20`,
                  '--hero-glow-strong-1': `${primaryColor}65`,
                  '--hero-glow-strong-2': `${primaryColor}40`,
                } as React.CSSProperties}
              >
                {/* Luminous breath overlay */}
                <div
                  className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20 blur-xl pointer-events-none animate-pulse"
                />
                <div className="w-10 h-10 rounded-2xl bg-black/15 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <UtensilsCrossed className="w-5 h-5" style={{ color: contrastText }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-tight leading-none mb-1">
                    Menù Digitale
                  </h3>
                  <p className="text-[11px] font-semibold opacity-85">
                    Piatti, prezzi & vini
                  </p>
                </div>
              </button>

              {/* CARD 2: CHIAMA SALA */}
              <Link
                href={`/call/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] hover:border-white/20 p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div
                  className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                >
                  <BellRing className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">
                    Chiama Sala
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Cameriere o conto
                  </p>
                </div>
              </Link>

              {/* CARD 3: AI SOMMELIER */}
              <Link
                href={`/ai-sommelier/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] hover:border-white/20 p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Wine className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">
                    AI Sommelier
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Consigli abbinamento
                  </p>
                </div>
              </Link>

              {/* CARD 4: WI-FI OSPITI */}
              <Link
                href={`/wifi/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] hover:border-white/20 p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Wifi className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">
                    Wi-Fi Ospiti
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Accesso rapido 1-tap
                  </p>
                </div>
              </Link>

              {/* CARD 5: RUOTA PREMI */}
              <Link
                href={`/wheel/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] hover:border-white/20 p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">
                    Ruota Premi
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Gira e vinci sconti
                  </p>
                </div>
              </Link>

              {/* CARD 6: CARTA FEDELTÀ */}
              <Link
                href={`/loyalty/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] hover:border-white/20 p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">
                    Carta Fedeltà
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Raccolta timbri smart
                  </p>
                </div>
              </Link>
            </>
          )}

          {/* ====== SALON & BEAUTY TILES ====== */}
          {(org.category === 'salon' || org.category === 'barber' || org.category === 'beauty') && (
            <>
              {/* HERO CARD: PRENOTA TAGLIO */}
              <a
                href={org.custom_cta_url || (org.phone ? `tel:${org.phone}` : '#')}
                target={org.custom_cta_url ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="animate-nfc-stagger-3 animate-hero-glow touch-press active:scale-95 rounded-3xl p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-xl group relative overflow-hidden"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastText,
                  boxShadow: `0 10px 25px ${primaryColor}35`,
                  '--hero-glow-1': `${primaryColor}35`,
                  '--hero-glow-2': `${primaryColor}20`,
                  '--hero-glow-strong-1': `${primaryColor}65`,
                  '--hero-glow-strong-2': `${primaryColor}40`,
                } as React.CSSProperties}
              >
                {/* Luminous breath overlay */}
                <div
                  className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20 blur-xl pointer-events-none animate-pulse"
                />
                <div className="w-10 h-10 rounded-2xl bg-black/15 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CalendarCheck className="w-5 h-5" style={{ color: contrastText }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-tight leading-none mb-1">
                    Prenota
                  </h3>
                  <p className="text-[11px] font-semibold opacity-85">
                    Scegli data & orario
                  </p>
                </div>
              </a>

              {/* CARD 2: LOOKBOOK */}
              {org.website ? (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Scissors className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">
                      Lookbook
                    </h3>
                    <p className="text-[11px] text-zinc-400">Listino & trattamenti</p>
                  </div>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Scissors className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">
                      Salone Style
                    </h3>
                    <p className="text-[11px] text-zinc-400">Info & trattamenti</p>
                  </div>
                </button>
              )}

              {/* CARD 3: WI-FI */}
              <Link
                href={`/wifi/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Wifi className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Wi-Fi Ospiti</h3>
                  <p className="text-[11px] text-zinc-400">Connessione gratis</p>
                </div>
              </Link>

              {/* CARD 4: RUOTA PREMI */}
              <Link
                href={`/wheel/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Ruota Premi</h3>
                  <p className="text-[11px] text-zinc-400">Sconti & trattamenti</p>
                </div>
              </Link>

              {/* CARD 5: CARTA FEDELTÀ */}
              <Link
                href={`/loyalty/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Carta Fedeltà</h3>
                  <p className="text-[11px] text-zinc-400">Timbri & vantaggi</p>
                </div>
              </Link>

              {/* CARD 6: CONTATTO RAPIDO */}
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Contatta</h3>
                  <p className="text-[11px] text-zinc-400">WhatsApp & Telefono</p>
                </div>
              </button>
            </>
          )}

          {/* ====== HOTEL & B&B TILES ====== */}
          {(org.category === 'hotel' || org.category === 'bnb') && (
            <>
              {/* HERO CARD: RECEPTION */}
              <a
                href={org.phone ? `tel:${org.phone}` : '#'}
                onClick={() => !org.phone && setShowContactModal(true)}
                className="animate-nfc-stagger-3 animate-hero-glow touch-press active:scale-95 rounded-3xl p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-xl group relative overflow-hidden"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastText,
                  boxShadow: `0 10px 25px ${primaryColor}35`,
                  '--hero-glow-1': `${primaryColor}35`,
                  '--hero-glow-2': `${primaryColor}20`,
                  '--hero-glow-strong-1': `${primaryColor}65`,
                  '--hero-glow-strong-2': `${primaryColor}40`,
                } as React.CSSProperties}
              >
                {/* Luminous breath overlay */}
                <div
                  className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20 blur-xl pointer-events-none animate-pulse"
                />
                <div className="w-10 h-10 rounded-2xl bg-black/15 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <BellRing className="w-5 h-5" style={{ color: contrastText }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-tight leading-none mb-1">
                    Reception H24
                  </h3>
                  <p className="text-[11px] font-semibold opacity-85">
                    Contatto immediato
                  </p>
                </div>
              </a>

              {/* CARD 2: GUIDA CITTÀ */}
              <button
                type="button"
                onClick={() => setShowCityGuide(true)}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Compass className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Guida Città</h3>
                  <p className="text-[11px] text-zinc-400">Luoghi consigliati</p>
                </div>
              </button>

              {/* CARD 3: WI-FI */}
              <Link
                href={`/wifi/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Wifi className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Wi-Fi Ospiti</h3>
                  <p className="text-[11px] text-zinc-400">Accesso camera</p>
                </div>
              </Link>

              {/* CARD 4: RUOTA PREMI */}
              <Link
                href={`/wheel/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Ruota Premi</h3>
                  <p className="text-[11px] text-zinc-400">Vinci sconti soggiorno</p>
                </div>
              </Link>

              {/* CARD 5: CARTA FEDELTÀ */}
              <Link
                href={`/loyalty/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Fidelity Pass</h3>
                  <p className="text-[11px] text-zinc-400">Punti fedeltà</p>
                </div>
              </Link>

              {/* CARD 6: INFO & WHATSAPP */}
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Info className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Concierge</h3>
                  <p className="text-[11px] text-zinc-400">Orari & check-out</p>
                </div>
              </button>
            </>
          )}

          {/* ====== OTHER / GENERIC / RETAIL / MEDICAL TILES ====== */}
          {!['restaurant', 'salon', 'barber', 'beauty', 'hotel', 'bnb'].includes(org.category) && (
            <>
              {/* HERO CARD: AZIONE PRINCIPALE */}
              <a
                href={org.custom_cta_url || (org.phone ? `tel:${org.phone}` : '#')}
                onClick={() => !org.custom_cta_url && !org.phone && setShowContactModal(true)}
                target={org.custom_cta_url ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="animate-nfc-stagger-3 animate-hero-glow touch-press active:scale-95 rounded-3xl p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-xl group relative overflow-hidden"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastText,
                  boxShadow: `0 10px 25px ${primaryColor}35`,
                  '--hero-glow-1': `${primaryColor}35`,
                  '--hero-glow-2': `${primaryColor}20`,
                  '--hero-glow-strong-1': `${primaryColor}65`,
                  '--hero-glow-strong-2': `${primaryColor}40`,
                } as React.CSSProperties}
              >
                {/* Luminous breath overlay */}
                <div
                  className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20 blur-xl pointer-events-none animate-pulse"
                />
                <div className="w-10 h-10 rounded-2xl bg-black/15 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CatIcon className="w-5 h-5" style={{ color: contrastText }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-tight leading-none mb-1 truncate max-w-full">
                    {org.custom_cta_label || 'Servizi'}
                  </h3>
                  <p className="text-[11px] font-semibold opacity-85">
                    Accedi 1-Tap
                  </p>
                </div>
              </a>

              {/* CARD 2: WI-FI */}
              <Link
                href={`/wifi/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Wifi className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Wi-Fi Ospiti</h3>
                  <p className="text-[11px] text-zinc-400">Accesso rapido</p>
                </div>
              </Link>

              {/* CARD 3: RUOTA PREMI */}
              <Link
                href={`/wheel/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Ruota Premi</h3>
                  <p className="text-[11px] text-zinc-400">Vinci vantaggi</p>
                </div>
              </Link>

              {/* CARD 4: CARTA FEDELTÀ */}
              <Link
                href={`/loyalty/${code}`}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Carta Fedeltà</h3>
                  <p className="text-[11px] text-zinc-400">Timbri & premi</p>
                </div>
              </Link>

              {/* CARD 5: SITO / INFO */}
              {org.website ? (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <ExternalLink className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Sito Web</h3>
                    <p className="text-[11px] text-zinc-400">Tutte le informazioni</p>
                  </div>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Orari & Info</h3>
                    <p className="text-[11px] text-zinc-400">Dettagli attività</p>
                  </div>
                </button>
              )}

              {/* CARD 6: CONTATTI */}
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="animate-nfc-stagger-4 touch-press active:scale-95 rounded-3xl bg-[#161816]/95 hover:bg-[#1c201d] border border-white/[0.08] p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all shadow-lg group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mb-1">Assistenza</h3>
                  <p className="text-[11px] text-zinc-400">WhatsApp & Telefono</p>
                </div>
              </button>
            </>
          )}

        </div>

        {/* ========================================================================= */}
        {/* WIDE BANNER CARD (Review Shield 5-Stars & Custom CTA Banner) */}
        {/* ========================================================================= */}
        <div className="animate-nfc-stagger-4 space-y-2.5">
          {/* Custom CTA Banner if configured */}
          {hasCustomCta && (
            <a
              href={org.custom_cta_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-press group relative block rounded-3xl border p-3.5 transition-all active:scale-[0.98] shadow-lg overflow-hidden"
              style={{
                borderColor: `${primaryColor}60`,
                background: `linear-gradient(135deg, ${primaryColor}20 0%, #161816 100%)`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full mb-1"
                    style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                  >
                    <Sparkles className="w-2.5 h-2.5" /> In Evidenza
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    {org.custom_cta_label}
                  </h3>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md"
                  style={{ backgroundColor: primaryColor, color: contrastText }}
                >
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </a>
          )}

          {/* Interactive Review Shield Banner */}
          <div
            className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#181b19] to-[#121413] p-4 shadow-xl relative overflow-hidden"
            style={{ boxShadow: `0 8px 30px ${primaryColor}12` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <ShieldCheck className="w-4 h-4" style={{ color: primaryColor }} />
                <span>Valuta la tua esperienza</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">1-Tap Google</span>
            </div>

            {/* 5 Stars Rating Bar */}
            <div className="flex items-center justify-around py-1.5 bg-black/40 rounded-2xl border border-white/5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled =
                  ratingHover !== null ? ratingHover >= star : selectedRating !== null && selectedRating >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(null)}
                    onClick={() => handleRatingClick(star)}
                    className="touch-press p-1 transition-transform hover:scale-125 active:scale-95 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Vota ${star} stelle`}
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-all ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] scale-110'
                          : 'text-zinc-600 fill-zinc-800/40'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Star feelings text pill */}
            <div className="h-5 text-center mt-1.5 flex items-center justify-center">
              {activeStar > 0 ? (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${starFeelings[activeStar]?.bg} ${starFeelings[activeStar]?.color} animate-fade-in`}
                >
                  <span>{starFeelings[activeStar]?.text}</span>
                </span>
              ) : (
                <span className="text-[10px] text-zinc-500">Tocca una stella per recensire o inviare feedback</span>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Footer Info */}
        <footer className="text-center pt-2 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
          <span className="font-medium text-zinc-400 truncate max-w-[160px]">{org.name}</span>
          <span className="text-zinc-600">•</span>
          <span>Powered by</span>
          <span className="font-bold" style={{ color: primaryColor }}>RIVO</span>
        </footer>

      </div>

      {/* ========================================================================= */}
      {/* DOCKED BOTTOM NAVIGATION BAR (Inspired by native app bottom dock in photo) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-0 max-w-md mx-auto px-4 z-40 pointer-events-none">
        <nav
          aria-label="Navigazione rapida"
          className="pointer-events-auto bg-[#141715]/95 backdrop-blur-2xl border border-white/10 rounded-full px-5 py-2 flex items-center justify-between shadow-[0_12px_45px_rgba(0,0,0,0.85)]"
        >
          {/* Home */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Torna all'inizio"
            className="touch-press active:scale-95 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all p-1.5"
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-medium mt-0.5">Home</span>
          </button>

          {/* Menù / Servizi */}
          <button
            type="button"
            onClick={() => setShowMenuModal(true)}
            aria-label="Apri Menù"
            className="touch-press active:scale-95 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all p-1.5"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] font-medium mt-0.5">Menù</span>
          </button>

          {/* CENTER ELEVATED FLOATING ACTION BUTTON (Primary Accent) */}
          <Link
            href={`/call/${code}`}
            aria-label="Chiama Sala Rapido"
            className="touch-press active:scale-95 w-12 h-12 -mt-6 rounded-full flex items-center justify-center transition-all shadow-2xl relative group"
            style={{
              backgroundColor: primaryColor,
              color: contrastText,
              boxShadow: `0 6px 25px ${primaryColor}55`,
            }}
          >
            <BellRing className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Link>

          {/* Info & Assistenza */}
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            aria-label="Info e contatti"
            className="touch-press active:scale-95 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all p-1.5"
          >
            <Info className="w-5 h-5" />
            <span className="text-[9px] font-medium mt-0.5">Info</span>
          </button>

          {/* Condividi */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Condividi"
            className="touch-press active:scale-95 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition-all p-1.5"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[9px] font-medium mt-0.5">Share</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE DIGITAL MENU MODAL */}
      {/* ========================================================================= */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#131614] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden space-y-3">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                >
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">Menù Digitale</h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400">{org.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {(org.lunch_destination_url || org.website) && (
                  <a
                    href={org.lunch_destination_url || org.website!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 text-white"
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
              <div
                className="p-2.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  borderColor: `${primaryColor}30`,
                  color: '#ffffff',
                }}
              >
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: primaryColor }} />
                <div>
                  <strong className="block text-[11px] uppercase tracking-wider font-bold" style={{ color: primaryColor }}>
                    Consiglio dello Chef
                  </strong>
                  <span className="text-zinc-200">{org.ai_menu_context}</span>
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
                className="w-full bg-[#181b19] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                style={{ borderColor: menuSearch ? primaryColor : undefined }}
              />
            </div>

            {/* Category Pills */}
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
                const isSelected = menuTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMenuTab(tab.id as typeof menuTab)}
                    className={`shrink-0 text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'font-bold shadow-md'
                        : 'bg-white/[0.05] text-zinc-400 hover:text-white border border-white/5'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: primaryColor, color: contrastText }
                        : {}
                    }
                  >
                    <TabIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Dish List */}
            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1 max-h-[48vh]">
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Nessun piatto trovato con questi criteri di ricerca.
                </div>
              ) : (
                filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-white">{item.name}</h4>
                        {item.popular && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                          >
                            Top
                          </span>
                        )}
                      </div>
                      <span
                        className="text-xs sm:text-sm font-extrabold font-mono shrink-0"
                        style={{ color: primaryColor }}
                      >
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
                className="flex-1 min-h-[42px] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastText,
                  boxShadow: `0 4px 18px ${primaryColor}40`,
                }}
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
          <div className="w-full max-w-sm bg-[#131614] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                >
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
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-zinc-400">Postazione Attuale:</span>
                <strong className="text-white font-mono">{device?.name || code}</strong>
              </div>

              {/* Phone Call Option */}
              {org.phone && (
                <a
                  href={`tel:${org.phone}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-colors group"
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

              {/* WhatsApp Option */}
              {(org.whatsapp_number || org.phone) && (
                <a
                  href={`https://wa.me/${(org.whatsapp_number || org.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Ciao! Sono al ${device?.name || 'tavolo'} di ${org.name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-white block">Chat WhatsApp</span>
                      <span className="text-[10px] text-zinc-400">Messaggio rapido al locale</span>
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
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-colors group"
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
              className="w-full py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors min-h-[42px]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#131614] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-white">
                <Compass className="w-4 h-4" style={{ color: primaryColor }} />
                <span>Guida & Luoghi Consigliati</span>
              </div>
              <button
                onClick={() => setShowCityGuide(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
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
              className="w-full py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors min-h-[44px]"
            >
              Chiudi Guida
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

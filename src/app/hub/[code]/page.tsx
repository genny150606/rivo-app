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
  Compass,
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
  Scissors,
  CalendarCheck,
  ShoppingBag,
  Dumbbell,
  Award,
  ChevronRight,
  Radio,
  CheckCircle2,
  Zap,
  Coffee,
  Music,
  Ticket,
  Camera,
  Heart,
  HelpCircle,
  Globe,
} from 'lucide-react';

const NfcWaveIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9a6 6 0 0 1 0 6" />
    <path d="M10 6a10 10 0 0 1 0 12" />
    <path d="M14 3a14 14 0 0 1 0 18" />
  </svg>
);

const Instagram = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
import confetti from 'canvas-confetti';
import { createClient } from '@supabase/supabase-js';
import { BusinessCategory } from '@/lib/types';
import { getCategoryDefinition } from '@/lib/categories';
import { DEFAULT_HUB_COLOR, getContrastColor } from '@/lib/palettes';
import {
  mergeHubConfig,
  HubConfig,
  HUB_FONT_OPTIONS,
  HUB_THEME_OPTIONS,
  HUB_CARD_STYLE_OPTIONS,
  HubCardStyle,
  HubModuleConfig,
} from '@/lib/hub-config';

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
  instagram_url?: string | null;
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
  hub_config?: any;
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
  const [nfcPhase, setNfcPhase] = useState<'sensing' | 'synced' | 'assembling' | 'ready'>('sensing');
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [hubConfig, setHubConfig] = useState<HubConfig | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Modals & Interactivity
  const [showCityGuide, setShowCityGuide] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuTab, setMenuTab] = useState<'tutti' | 'antipasti' | 'primi' | 'secondi' | 'dolci' | 'bevande'>('tutti');
  const [menuSearch, setMenuSearch] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeCustomModal, setActiveCustomModal] = useState<{ title: string; content: string } | null>(null);
  const [sharedNotification, setSharedNotification] = useState(false);

  // Star Rating Bar
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [, setIsLunchTime] = useState(false);

  // Replay NFC Tap & Assemble Magic Animation
  const replayNfcTap = () => {
    setNfcPhase('sensing');
    setLoading(true);
    setTimeout(() => {
      setNfcPhase('synced');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([20, 50, 25]);
        } catch {}
      }
      setTimeout(() => {
        setLoading(false);
        setNfcPhase('assembling');
        setTimeout(() => {
          setNfcPhase('ready');
        }, 850);
      }, 450);
    }, 400);
  };

  useEffect(() => {
    let isCancelled = false;

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
          if (!isCancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        if (isCancelled) return;
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
              instagram_url,
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
              primary_color,
              hub_config
            `)
            .eq('id', dev.organization_id)
            .single();

          if (!orgErr && orgData && !isCancelled) {
            const currentCategory = (orgData.category || 'restaurant') as BusinessCategory;
            setOrg({
              ...orgData,
              category: currentCategory,
            });

            // Initialize/Merge HubConfig with absolute backwards compatibility
            const merged = mergeHubConfig(
              orgData.hub_config,
              currentCategory,
              {
                primaryColor: orgData.primary_color,
                customCtaLabel: orgData.custom_cta_label,
                customCtaUrl: orgData.custom_cta_url,
                lunchDestinationUrl: orgData.lunch_destination_url,
              }
            );
            setHubConfig(merged);

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

            // Phase 2: NFC Tag Synced Feedback with Haptic Wave
            setNfcPhase('synced');
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate([20, 50, 25]);
              } catch {}
            }

            // Phase 3: Transition to Hub with Spring Bloom Assembling
            setTimeout(() => {
              if (isCancelled) return;
              setLoading(false);
              setNfcPhase('assembling');

              // Phase 4: Settle into ready state
              setTimeout(() => {
                if (isCancelled) return;
                setNfcPhase('ready');
              }, 850);
            }, 460);
            return;
          }
        }
      } catch (err) {
        console.error('Hub load error:', err);
        if (!isCancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    loadHub();

    return () => {
      isCancelled = true;
    };
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

  const activeConfig: HubConfig = useMemo(() => {
    if (hubConfig) return hubConfig;
    return mergeHubConfig(
      org?.hub_config,
      (org?.category || 'restaurant') as BusinessCategory,
      {
        primaryColor: org?.primary_color,
        customCtaLabel: org?.custom_cta_label,
        customCtaUrl: org?.custom_cta_url,
        lunchDestinationUrl: org?.lunch_destination_url,
      }
    );
  }, [hubConfig, org]);

  const primaryColor = activeConfig.primaryColor || org?.primary_color || DEFAULT_HUB_COLOR;
  const contrastText = getContrastColor(primaryColor);

  const activeFont = useMemo(() => {
    return HUB_FONT_OPTIONS.find((f) => f.id === activeConfig.fontFamily) || HUB_FONT_OPTIONS[0];
  }, [activeConfig.fontFamily]);

  const activeTheme = useMemo(() => {
    return HUB_THEME_OPTIONS.find((t) => t.id === activeConfig.themeMode) || HUB_THEME_OPTIONS[0];
  }, [activeConfig.themeMode]);

  const isLight = activeTheme.id === 'minimal_light';

  const cardBaseClass = useMemo(() => {
    switch (activeConfig.cardStyle) {
      case 'glass':
        return isLight
          ? 'backdrop-blur-md bg-white/70 border border-slate-200/90 shadow-md hover:bg-white/85'
          : 'backdrop-blur-md bg-white/[0.04] border border-white/10 shadow-lg hover:bg-white/[0.07]';
      case 'solid':
        return isLight
          ? 'bg-white border border-slate-200 shadow-md hover:bg-slate-50'
          : 'bg-[#181b19] border border-white/5 shadow-md hover:bg-[#1f2320]';
      case 'bordered':
        return isLight
          ? 'bg-white border-2 border-slate-300 shadow hover:border-slate-400'
          : 'bg-[#121413] border-2 border-white/20 shadow hover:border-white/30';
      case 'neon':
        return isLight
          ? 'bg-white border border-slate-200 shadow-md hover:bg-slate-50'
          : 'bg-[#141715] border border-white/10 shadow-lg hover:bg-[#1a1d1b]';
      default:
        return isLight
          ? 'bg-white border border-slate-200 shadow-md hover:bg-slate-50'
          : 'bg-[#161816]/95 border border-white/[0.08] shadow-lg hover:bg-[#1c201d]';
    }
  }, [activeConfig.cardStyle, isLight]);

  const cardCustomStyle = useMemo<React.CSSProperties>(() => {
    if (activeConfig.cardStyle === 'neon') {
      return {
        boxShadow: `0 0 16px ${primaryColor}25`,
        borderColor: `${primaryColor}40`,
      };
    }
    return {};
  }, [activeConfig.cardStyle, primaryColor]);

  const enabledModules = useMemo(() => {
    return [...(activeConfig.modules || [])]
      .filter((m) => m && m.enabled)
      .sort((a, b) => a.order - b.order);
  }, [activeConfig.modules]);

  if (loading) {
    const isSynced = nfcPhase === 'synced';
    return (
      <div
        className="min-h-screen min-h-dvh flex flex-col items-center justify-center p-6 relative overflow-hidden select-none transition-colors duration-300"
        style={{
          backgroundColor: activeTheme.bgHex,
          color: activeTheme.textHex,
          fontFamily: activeFont.cssFamily,
        }}
      >
        {/* Background Aurora Ambient Light */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full blur-[120px] transition-all duration-700"
            style={{
              backgroundColor: primaryColor,
              opacity: isSynced ? (isLight ? 0.35 : 0.6) : (isLight ? 0.18 : 0.35),
              transform: isSynced ? 'translate(-50%, -50%) scale(1.15)' : 'translate(-50%, -50%) scale(1)',
            }}
          />
        </div>

        {/* Central NFC Resonator Hub */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Concentric Radar / Sonar Rings */}
          <div className="relative flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48 mb-6">
            {/* Pulsing Sonar Ring 1 */}
            <div
              className="absolute inset-0 rounded-full border border-dashed pointer-events-none animate-nfc-sonar-1"
              style={{
                borderColor: `${primaryColor}65`,
                boxShadow: `0 0 25px ${primaryColor}20`,
              }}
            />
            {/* Pulsing Sonar Ring 2 */}
            <div
              className="absolute inset-0 rounded-full border pointer-events-none animate-nfc-sonar-2"
              style={{
                borderColor: `${primaryColor}45`,
                boxShadow: `0 0 35px ${primaryColor}15`,
              }}
            />
            {/* Pulsing Sonar Ring 3 */}
            <div
              className="absolute inset-0 rounded-full border pointer-events-none animate-nfc-sonar-3"
              style={{
                borderColor: `${primaryColor}25`,
              }}
            />

            {/* Core Floating Glass NFC Token */}
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-2 flex items-center justify-center relative shadow-2xl transition-all duration-500 ${
                isSynced ? 'animate-nfc-contact-flash' : 'animate-float-gentle'
              } ${
                isLight
                  ? 'bg-white/90 border-slate-200/90 shadow-slate-300/60'
                  : 'bg-[#141715]/90 border-white/20 shadow-black/80'
              }`}
              style={{
                borderColor: isSynced ? primaryColor : undefined,
                boxShadow: isSynced
                  ? `0 0 45px ${primaryColor}60, inset 0 0 20px ${primaryColor}25`
                  : `0 12px 35px rgba(0,0,0,0.35)`,
              }}
            >
              {/* Internal Radiant Glow */}
              <div
                className="absolute inset-1 rounded-2xl opacity-25 pointer-events-none transition-opacity duration-300"
                style={{
                  backgroundColor: primaryColor,
                  filter: 'blur(8px)',
                }}
              />

              {isSynced ? (
                <div className="flex flex-col items-center justify-center gap-1 animate-scale-in">
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: primaryColor }} />
                </div>
              ) : (
                <div className="relative flex items-center justify-center">
                  <NfcWaveIcon className="w-9 h-9 sm:w-11 sm:h-11 animate-pulse" style={{ color: primaryColor }} />
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-[#141715] animate-ping"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Status Text with Magic Feedback */}
          <div className="text-center max-w-xs px-4">
            {isSynced ? (
              <div className="space-y-1 animate-fade-in">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-1">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span>Tag NFC Riconosciuto</span>
                </div>
                <h2 className={`text-base sm:text-lg font-black tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {device?.name || 'Tavolo Connesso'}
                </h2>
                <p className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  {org?.name ? `Benvenuto da ${org.name}` : 'Apertura esperienza RIVO in corso...'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase bg-white/5 border border-white/10 text-zinc-400">
                  <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                  <span>Sincronizzazione 13.56 MHz</span>
                </div>
                <h2 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                  Avvicinamento al Tag NFC...
                </h2>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  Connessione istantanea con il locale
                </p>

                {/* Shimmer Loading Beam */}
                <div className="w-36 h-1 mx-auto mt-3 rounded-full bg-white/10 overflow-hidden relative">
                  <div
                    className="absolute inset-y-0 w-1/2 rounded-full animate-shimmer-beam"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !org) {
    return (
      <div
        className="min-h-screen min-h-dvh flex flex-col items-center justify-center p-6 text-center transition-colors duration-300"
        style={{
          backgroundColor: activeTheme.bgHex,
          color: activeTheme.textHex,
          fontFamily: activeFont.cssFamily,
        }}
      >
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3 text-red-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className={`text-lg font-bold mb-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Dispositivo non trovato
        </h1>
        <p className={`text-xs max-w-xs mb-5 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
          Il tag NFC o codice QR (<span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{code}</span>) non è attivo o non è configurato.
        </p>
        <Link
          href="/"
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-zinc-800 hover:bg-zinc-700 text-white'
          }`}
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
    <div
      className="min-h-screen min-h-dvh flex flex-col justify-between relative selection:bg-white selection:text-black overflow-x-hidden transition-colors duration-300"
      style={{
        backgroundColor: activeTheme.bgHex,
        color: activeTheme.textHex,
        fontFamily: activeFont.cssFamily,
      }}
    >
      {/* Visual Atmosphere & Custom Background Layer */}
      {activeConfig.bgType === 'image' && activeConfig.bgImageUrl && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{
              backgroundImage: `url(${activeConfig.bgImageUrl})`,
              filter: `blur(${activeConfig.bgBlur ?? 0}px)`,
              transform: (activeConfig.bgBlur ?? 0) > 0 ? 'scale(1.08)' : 'scale(1)',
            }}
          />
          <div
            className="absolute inset-0 bg-black transition-opacity duration-300"
            style={{
              opacity: (activeConfig.bgOverlayOpacity ?? 50) / 100,
            }}
          />
        </div>
      )}

      {/* Dynamic Ambient Aurora Glow Mesh (60/120fps GPU-accelerated) */}
      {activeConfig.accentGlow !== false && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-[340px] sm:w-[520px] h-[300px] rounded-full blur-[130px] animate-ambient-drift-1"
            style={{
              backgroundColor: primaryColor,
              opacity: isLight ? 0.25 : 0.65,
            }}
          />
          <div
            className="absolute top-1/4 -right-12 w-[220px] sm:w-[320px] h-[260px] rounded-full blur-[120px] animate-ambient-drift-2"
            style={{
              backgroundColor: `${primaryColor}85`,
              opacity: isLight ? 0.2 : 0.5,
            }}
          />
        </div>
      )}

      {/* Share Toast Notification */}
      {sharedNotification && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in ${
            isLight
              ? 'bg-white border border-slate-200 text-slate-900'
              : 'bg-[#161816] border border-white/20 text-white'
          }`}
        >
          <Check className="w-4 h-4" style={{ color: primaryColor }} />
          <span>Link copiato negli appunti!</span>
        </div>
      )}

      {/* NFC Magic Assemble Sparkle Burst from Center */}
      {nfcPhase === 'assembling' && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            const dist = 75 + (i % 4) * 28;
            const tx = `${Math.round(Math.cos(angle) * dist)}px`;
            const ty = `${Math.round(Math.sin(angle) * dist)}px`;
            return (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-sparkle-drift"
                style={{
                  backgroundColor: i % 2 === 0 ? primaryColor : '#fbbf24',
                  boxShadow: `0 0 14px ${primaryColor}`,
                  '--tx': tx,
                  '--ty': ty,
                  '--s': i % 2 === 0 ? 1.3 : 0.8,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      {/* Center Phone-Proportioned Main Container */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-4 pt-2.5 sm:pt-4 pb-24 sm:pb-28 relative z-10 gap-2.5 sm:gap-3">
        
        {/* ========================================================================= */}
        {/* TOP APP BAR / HEADER */}
        {/* ========================================================================= */}
        <header
          className={`${
            nfcPhase === 'assembling' ? 'animate-assemble-header' : 'animate-nfc-stagger-1'
          } flex items-center justify-between gap-3 pt-0.5`}
        >
          {/* Left: Avatar / Logo + Business Name */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="shrink-0 relative group">
              {/* Breathing Halo Glow Ring */}
              <div
                className="absolute -inset-1 rounded-full blur-xs opacity-70 animate-pulse pointer-events-none"
                style={{ backgroundColor: primaryColor }}
              />
              {org.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={org.logo_url}
                  alt={org.name}
                  className="relative w-11 h-11 rounded-full object-cover border-2 shadow-lg bg-black transition-transform duration-300 group-hover:scale-105"
                  style={{ borderColor: primaryColor }}
                />
              ) : (
                <div
                  className="relative w-11 h-11 rounded-full flex items-center justify-center shadow-lg text-black font-bold transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: primaryColor }}
                >
                  <CatIcon className="w-5 h-5" style={{ color: contrastText }} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1
                className={`text-base font-extrabold tracking-tight truncate leading-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {org.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                <span className={`font-semibold truncate max-w-[140px] ${isLight ? 'text-slate-600' : 'text-zinc-300'}`}>
                  {catDef.label}
                </span>
                <span className={isLight ? 'text-slate-400' : 'text-zinc-600'}>•</span>
                <span className={`font-mono text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>RIVO Hub</span>
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
              className={`touch-press w-9 h-9 rounded-full border flex items-center justify-center transition-all relative active:scale-95 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
                  : 'bg-[#181b19] hover:bg-[#202421] border-white/[0.08] text-zinc-300 hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#181b19] animate-pulse" />
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Condividi locale"
              className={`touch-press w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-95 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
                  : 'bg-[#181b19] hover:bg-[#202421] border-white/[0.08] text-zinc-300 hover:text-white'
              }`}
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* BADGE TAVOLO CONNESSO (Con supporto Replay Tap al tocco) */}
        {/* ========================================================================= */}
        <button
          type="button"
          onClick={replayNfcTap}
          title="Tocca per riprodurre l'animazione di connessione NFC"
          className={`${
            nfcPhase === 'assembling' ? 'animate-assemble-badge' : 'animate-nfc-stagger-2'
          } w-full text-left touch-press active:scale-[0.98] flex items-center justify-between px-3.5 py-2 rounded-2xl backdrop-blur-md shadow-sm transition-all cursor-pointer ${
            isLight
              ? 'bg-white/90 border border-slate-200/90 text-slate-800 hover:bg-slate-50'
              : 'bg-[#141715]/90 border border-white/[0.08] text-white hover:bg-[#1a1d1b]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Pulsing emerald dot (animate-ping + solid dot) */}
            <div className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
            </div>
            <div className="flex items-center gap-1.5 text-xs min-w-0">
              <span className={`font-medium shrink-0 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                {activeConfig.tableBadgeLabel || 'Tavolo Connesso'}:
              </span>
              <span
                className={`font-bold tracking-wide truncate max-w-[150px] sm:max-w-[200px] ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {device?.name || 'Tavolo Ospiti'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shrink-0">
            <Zap className="w-2.5 h-2.5 animate-pulse" />
            <span>{activeConfig.tableLiveTag || 'NFC LIVE'}</span>
          </div>
        </button>

        {/* ========================================================================= */}
        {/* CARD HERO (Se abilitata) */}
        {/* ========================================================================= */}
        {activeConfig.hero?.enabled && (
          activeConfig.hero.destinationType === 'external' && activeConfig.hero.externalUrl ? (
            <a
              href={activeConfig.hero.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${
                nfcPhase === 'assembling' ? 'animate-assemble-hero' : 'animate-nfc-stagger-3'
              } animate-hero-glow touch-press active:scale-[0.98] rounded-3xl p-4 sm:p-5 flex items-center justify-between transition-all shadow-xl group relative overflow-hidden w-full text-left`}
              style={{
                backgroundColor: primaryColor,
                color: contrastText,
                boxShadow: `0 10px 28px ${primaryColor}35`,
                '--hero-glow-1': `${primaryColor}35`,
                '--hero-glow-2': `${primaryColor}20`,
                '--hero-glow-strong-1': `${primaryColor}65`,
                '--hero-glow-strong-2': `${primaryColor}40`,
              } as React.CSSProperties}
            >
              {/* Continuous Diagonal Mirror Shimmer Beam */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-beam" />
              </div>
              {/* Luminous breath overlay */}
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/20 blur-xl pointer-events-none animate-pulse" />

              <div className="relative z-10 flex-1 min-w-0 pr-3">
                {activeConfig.hero.badgeText && (
                  <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-black/20 mb-1.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{activeConfig.hero.badgeText}</span>
                  </div>
                )}
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight leading-tight mb-1 truncate">
                  {activeConfig.hero.title}
                </h3>
                <p className="text-xs font-semibold opacity-90 truncate">
                  {activeConfig.hero.subtitle}
                </p>
              </div>

              <div className="relative z-10 shrink-0 flex items-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-black/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ExternalLink className="w-5 h-5 animate-float-gentle" style={{ color: contrastText }} />
                </div>
              </div>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setShowMenuModal(true)}
              className={`${
                nfcPhase === 'assembling' ? 'animate-assemble-hero' : 'animate-nfc-stagger-3'
              } animate-hero-glow touch-press active:scale-[0.98] rounded-3xl p-4 sm:p-5 flex items-center justify-between transition-all shadow-xl group relative overflow-hidden w-full text-left cursor-pointer`}
              style={{
                backgroundColor: primaryColor,
                color: contrastText,
                boxShadow: `0 10px 28px ${primaryColor}35`,
                '--hero-glow-1': `${primaryColor}35`,
                '--hero-glow-2': `${primaryColor}20`,
                '--hero-glow-strong-1': `${primaryColor}65`,
                '--hero-glow-strong-2': `${primaryColor}40`,
              } as React.CSSProperties}
            >
              {/* Continuous Diagonal Mirror Shimmer Beam */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-beam" />
              </div>
              {/* Luminous breath overlay */}
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/20 blur-xl pointer-events-none animate-pulse" />

              <div className="relative z-10 flex-1 min-w-0 pr-3">
                {activeConfig.hero.badgeText && (
                  <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-black/20 mb-1.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{activeConfig.hero.badgeText}</span>
                  </div>
                )}
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight leading-tight mb-1 truncate">
                  {activeConfig.hero.title}
                </h3>
                <p className="text-xs font-semibold opacity-90 truncate">
                  {activeConfig.hero.subtitle}
                </p>
              </div>

              <div className="relative z-10 shrink-0 flex items-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-black/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UtensilsCrossed className="w-5 h-5 animate-float-gentle" style={{ color: contrastText }} />
                </div>
              </div>
            </button>
          )
        )}

        {/* ========================================================================= */}
        {/* GRIGLIA MODULI DINAMICA (BENTO GRID CON SUPPORTO 1 E 2 COLONNE) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {enabledModules.map((mod, modIdx) => {
            const isFullWidth = mod.colSpan === 2;
            const cardSpanClass = isFullWidth ? 'col-span-2' : 'col-span-1';

            const renderModuleIcon = () => {
              if (mod.isCustom || mod.iconName) {
                switch (mod.iconName) {
                  case 'Wine':
                    return <Wine className="w-5 h-5" style={{ color: primaryColor }} />;
                  case 'Coffee':
                    return <Coffee className="w-5 h-5" style={{ color: primaryColor }} />;
                  case 'Music':
                    return <Music className="w-5 h-5" style={{ color: primaryColor }} />;
                  case 'Ticket':
                    return <Ticket className="w-5 h-5" style={{ color: primaryColor }} />;
                  case 'ShoppingBag':
                    return <ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} />;
                  case 'Camera':
                    return <Camera className="w-5 h-5" style={{ color: primaryColor }} />;
                  case 'Heart':
                    return <Heart className="w-5 h-5 text-rose-400" />;
                  case 'HelpCircle':
                    return <HelpCircle className="w-5 h-5" style={{ color: primaryColor }} />;
                  case 'Globe':
                    return <Globe className="w-5 h-5" style={{ color: primaryColor }} />;
                  case 'CalendarCheck':
                    return <CalendarCheck className="w-5 h-5" style={{ color: primaryColor }} />;
                  case 'UtensilsCrossed':
                    return <UtensilsCrossed className="w-5 h-5 animate-float-gentle" style={{ color: primaryColor }} />;
                  case 'Sparkles':
                  default:
                    return <Sparkles className="w-5 h-5 animate-float-gentle" style={{ color: primaryColor }} />;
                }
              }

              switch (mod.id) {
                case 'service':
                  return <BellRing className="w-5 h-5 animate-bell-swing origin-top" style={{ color: primaryColor }} />;
                case 'sommelier':
                  return (
                    <div className="relative">
                      <Wine className="w-5 h-5" style={{ color: primaryColor }} />
                      <Sparkles className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-300 animate-pulse" />
                    </div>
                  );
                case 'wifi':
                  return <Wifi className="w-5 h-5 animate-pulse" style={{ color: primaryColor }} />;
                case 'wheel':
                  return <Sparkles className="w-5 h-5 animate-float-gentle" style={{ color: primaryColor }} />;
                case 'loyalty':
                  return <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />;
                case 'reviews':
                  return <Star className="w-5 h-5 fill-amber-400 text-amber-400" />;
                case 'guide':
                  return <BookOpen className="w-5 h-5" style={{ color: primaryColor }} />;
                case 'whatsapp':
                  return <MessageCircle className="w-5 h-5 text-emerald-400" />;
                case 'menu':
                  return <UtensilsCrossed className="w-5 h-5 animate-float-gentle" style={{ color: primaryColor }} />;
                case 'instagram':
                  return <Instagram className="w-5 h-5 text-pink-400" />;
                case 'custom_cta':
                  return <ExternalLink className="w-5 h-5" style={{ color: primaryColor }} />;
                default:
                  return <CatIcon className="w-5 h-5" style={{ color: primaryColor }} />;
              }
            };

            const commonInner = (
              <>
                <div className="flex items-start justify-between w-full mb-2">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform relative ${
                      isLight ? 'bg-slate-100 border border-slate-200' : 'bg-white/[0.05] border border-white/5'
                    }`}
                  >
                    {renderModuleIcon()}
                  </div>
                  {mod.badge && (
                    <span
                      className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${primaryColor}20`,
                        color: primaryColor,
                        border: `1px solid ${primaryColor}35`,
                      }}
                    >
                      {mod.badge}
                    </span>
                  )}
                </div>

                <div className="w-full">
                  <h3
                    className={`text-sm sm:text-base font-bold tracking-tight leading-none mb-1 truncate ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {mod.title}
                  </h3>
                  {mod.subtitle && (
                    <p
                      className={`text-[11px] leading-tight truncate ${
                        isLight ? 'text-slate-500' : 'text-zinc-400'
                      }`}
                    >
                      {mod.subtitle}
                    </p>
                  )}
                </div>
              </>
            );

            const isLeft = modIdx % 2 === 0;
            const cardAnimClass =
              nfcPhase === 'assembling'
                ? isFullWidth
                  ? 'animate-assemble-hero'
                  : isLeft
                  ? 'animate-assemble-left'
                  : 'animate-assemble-right'
                : isLeft
                ? 'animate-nfc-stagger-3'
                : 'animate-nfc-stagger-4';

            const cardRadiusClass =
              activeConfig.borderRadius === 'full'
                ? 'rounded-full'
                : activeConfig.borderRadius === 'none'
                ? 'rounded-none'
                : activeConfig.borderRadius === 'md'
                ? 'rounded-xl'
                : activeConfig.borderRadius === '3xl'
                ? 'rounded-3xl'
                : 'rounded-2xl';

            const cardClassName = `${cardSpanClass} ${cardAnimClass} touch-press active:scale-95 ${cardRadiusClass} p-4 flex flex-col justify-between items-start text-left min-h-[115px] sm:min-h-[125px] transition-all group relative overflow-hidden ${cardBaseClass}`;

            const moduleCardStyle: React.CSSProperties = {
              ...cardCustomStyle,
              ...(mod.cardColor ? { borderColor: `${mod.cardColor}50` } : {}),
            };

            // Custom modules or modal actions
            if (mod.isCustom) {
              if (mod.actionType === 'modal') {
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() =>
                      setActiveCustomModal({
                        title: mod.modalTitle || mod.title,
                        content: mod.modalContent || '',
                      })
                    }
                    className={cardClassName}
                    style={moduleCardStyle}
                  >
                    {commonInner}
                  </button>
                );
              }
              if (mod.customUrl) {
                return (
                  <a
                    key={mod.id}
                    href={mod.customUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClassName}
                    style={moduleCardStyle}
                  >
                    {commonInner}
                  </a>
                );
              }
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() =>
                    setActiveCustomModal({
                      title: mod.title,
                      content: mod.subtitle || 'Nessun dettaglio aggiuntivo specificato.',
                    })
                  }
                  className={cardClassName}
                  style={moduleCardStyle}
                >
                  {commonInner}
                </button>
              );
            }

            // Standard modules
            switch (mod.id) {
              case 'service':
                return (
                  <Link key={mod.id} href={`/call/${code}`} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </Link>
                );
              case 'sommelier':
                return (
                  <Link key={mod.id} href={`/ai-sommelier/${code}`} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </Link>
                );
              case 'wifi':
                return (
                  <Link key={mod.id} href={`/wifi/${code}`} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </Link>
                );
              case 'wheel':
                return (
                  <Link key={mod.id} href={`/wheel/${code}`} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </Link>
                );
              case 'loyalty':
                return (
                  <Link key={mod.id} href={`/loyalty/${code}`} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </Link>
                );
              case 'reviews':
                return (
                  <Link key={mod.id} href={`/review/${code}`} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </Link>
                );
              case 'guide':
                if (mod.customUrl) {
                  return (
                    <a key={mod.id} href={mod.customUrl} target="_blank" rel="noopener noreferrer" className={cardClassName} style={moduleCardStyle}>
                      {commonInner}
                    </a>
                  );
                }
                return (
                  <button key={mod.id} type="button" onClick={() => setShowCityGuide(true)} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </button>
                );
              case 'whatsapp': {
                const cleanNumber = (org.whatsapp_number || org.phone || '').replace(/[^0-9]/g, '');
                if (cleanNumber) {
                  return (
                    <a
                      key={mod.id}
                      href={`https://wa.me/${cleanNumber}?text=${encodeURIComponent(
                        `Ciao! Sono al ${device?.name || 'tavolo'} di ${org.name}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cardClassName}
                      style={moduleCardStyle}
                    >
                      {commonInner}
                    </a>
                  );
                }
                return (
                  <button key={mod.id} type="button" onClick={() => setShowContactModal(true)} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </button>
                );
              }
              case 'menu':
                if (mod.customUrl) {
                  return (
                    <a key={mod.id} href={mod.customUrl} target="_blank" rel="noopener noreferrer" className={cardClassName} style={moduleCardStyle}>
                      {commonInner}
                    </a>
                  );
                }
                return (
                  <button key={mod.id} type="button" onClick={() => setShowMenuModal(true)} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </button>
                );
              case 'instagram':
                return (
                  <a
                    key={mod.id}
                    href={mod.customUrl || org.instagram_url || org.website || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClassName}
                    style={moduleCardStyle}
                  >
                    {commonInner}
                  </a>
                );
              case 'custom_cta':
                return (
                  <a
                    key={mod.id}
                    href={mod.customUrl || org.custom_cta_url || org.website || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClassName}
                    style={moduleCardStyle}
                  >
                    {commonInner}
                  </a>
                );
              default:
                if (mod.customUrl) {
                  return (
                    <a key={mod.id} href={mod.customUrl} target="_blank" rel="noopener noreferrer" className={cardClassName} style={moduleCardStyle}>
                      {commonInner}
                    </a>
                  );
                }
                return (
                  <button key={mod.id} type="button" onClick={() => setShowContactModal(true)} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </button>
                );
            }
          })}
        </div>

        {/* ========================================================================= */}
        {/* WIDE BANNER CARD (Review Shield 5-Stars & Custom CTA Banner) */}
        {/* ========================================================================= */}
        <div
          className={`${
            nfcPhase === 'assembling' ? 'animate-assemble-center' : 'animate-nfc-stagger-4'
          } space-y-2.5`}
        >
          {/* Custom CTA Banner if configured (and not already in modules) */}
          {hasCustomCta && !enabledModules.some((m) => m.id === 'custom_cta') && (
            <a
              href={org.custom_cta_url!}
              target="_blank"
              rel="noopener noreferrer"
              className={`touch-press group relative block rounded-3xl border p-3.5 transition-all active:scale-[0.98] shadow-lg overflow-hidden ${
                isLight ? 'bg-white border-slate-200' : 'border-white/10'
              }`}
              style={{
                borderColor: `${primaryColor}60`,
                background: isLight
                  ? `linear-gradient(135deg, ${primaryColor}15 0%, #ffffff 100%)`
                  : `linear-gradient(135deg, ${primaryColor}20 0%, #161816 100%)`,
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
                  <h3 className={`text-xs sm:text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
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
            className={`rounded-3xl border p-4 shadow-xl relative overflow-hidden ${
              isLight
                ? 'bg-white border-slate-200'
                : 'border-white/[0.08] bg-gradient-to-b from-[#181b19] to-[#121413]'
            }`}
            style={{ boxShadow: `0 8px 30px ${primaryColor}12` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-2 text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <ShieldCheck className="w-4 h-4" style={{ color: primaryColor }} />
                <span>Valuta la tua esperienza</span>
              </div>
              <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>1-Tap Google</span>
            </div>

            {/* 5 Stars Rating Bar */}
            <div
              className={`flex items-center justify-around py-1.5 rounded-2xl border ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/5'
              }`}
            >
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
                    className="touch-press p-1 transition-transform hover:scale-125 active:scale-90 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center relative"
                    aria-label={`Vota ${star} stelle`}
                  >
                    <Star
                      style={{
                        animationDelay: isFilled ? '0ms' : `${(star - 1) * 220}ms`,
                      }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-all ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)] scale-115 animate-star-pop'
                          : isLight
                          ? 'text-slate-300 fill-slate-200 animate-star-twinkle'
                          : 'text-zinc-600 fill-zinc-800/40 animate-star-twinkle'
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
                <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  Tocca una stella per recensire o inviare feedback
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Footer Info */}
        <div className="pt-2 text-center space-y-1">
          {activeConfig.footerNote && (
            <p className={`text-[10px] sm:text-[11px] max-w-xs mx-auto ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
              {activeConfig.footerNote}
            </p>
          )}
          <footer className="text-[11px] flex items-center justify-center gap-1.5 text-zinc-500">
            <span className={`font-medium truncate max-w-[160px] ${isLight ? 'text-slate-700' : 'text-zinc-400'}`}>
              {org.name}
            </span>
            <span className={isLight ? 'text-slate-400' : 'text-zinc-600'}>•</span>
            <span>Powered by</span>
            <span className="font-bold" style={{ color: primaryColor }}>RIVO</span>
          </footer>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* DOCKED BOTTOM NAVIGATION BAR (Inspired by native app bottom dock in photo) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-0 max-w-md mx-auto px-4 z-40 pointer-events-none">
        <nav
          aria-label="Navigazione rapida"
          className={`pointer-events-auto backdrop-blur-2xl border rounded-full px-5 py-2 flex items-center justify-between shadow-[0_12px_45px_rgba(0,0,0,0.85)] ${
            nfcPhase === 'assembling' ? 'animate-assemble-dock' : ''
          } ${
            isLight
              ? 'bg-white/95 text-slate-700 border-slate-200/90 shadow-[0_12px_45px_rgba(0,0,0,0.12)]'
              : 'bg-[#141715]/95 text-zinc-300 border-white/10 shadow-[0_12px_45px_rgba(0,0,0,0.85)]'
          }`}
        >
          {/* Home */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Torna all'inizio"
            className="touch-press active:scale-95 flex flex-col items-center justify-center hover:opacity-80 transition-all p-1.5"
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-medium mt-0.5">Home</span>
          </button>

          {/* Menù / Servizi */}
          <button
            type="button"
            onClick={() => setShowMenuModal(true)}
            aria-label="Apri Menù"
            className="touch-press active:scale-95 flex flex-col items-center justify-center hover:opacity-80 transition-all p-1.5"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] font-medium mt-0.5">Menù</span>
          </button>

          {/* CENTER ELEVATED FLOATING ACTION BUTTON (Primary Accent) */}
          <Link
            href={`/call/${code}`}
            aria-label="Chiama Sala Rapido"
            className="touch-press active:scale-90 w-12 h-12 -mt-6 rounded-full flex items-center justify-center transition-all shadow-2xl relative group"
            style={{
              backgroundColor: primaryColor,
              color: contrastText,
              boxShadow: `0 6px 25px ${primaryColor}65`,
            }}
          >
            {/* Ambient radar pulse ring */}
            <span
              className="absolute inset-0 rounded-full animate-fab-pulse-ring pointer-events-none"
              style={{ backgroundColor: primaryColor }}
            />
            <BellRing className="w-5 h-5 relative z-10 animate-bell-swing origin-top" />
          </Link>

          {/* Info & Assistenza */}
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            aria-label="Info e contatti"
            className="touch-press active:scale-95 flex flex-col items-center justify-center hover:opacity-80 transition-all p-1.5"
          >
            <Info className="w-5 h-5" />
            <span className="text-[9px] font-medium mt-0.5">Info</span>
          </button>

          {/* Condividi */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Condividi"
            className="touch-press active:scale-95 flex flex-col items-center justify-center hover:opacity-80 transition-all p-1.5"
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

      {/* ========================================================================= */}
      {/* CUSTOM MODULE DETAILS MODAL (Info/Testo personalizzato) */}
      {/* ========================================================================= */}
      {activeCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#131614] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3.5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-white">
                <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
                <span>{activeCustomModal.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveCustomModal(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {activeCustomModal.content ? (
                <p>{activeCustomModal.content}</p>
              ) : (
                <p className="text-zinc-500 italic">Nessun dettaglio aggiuntivo disponibile al momento.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveCustomModal(null)}
              className="w-full py-2.5 rounded-2xl text-xs font-bold transition-all min-h-[44px] shadow-lg active:scale-95"
              style={{
                backgroundColor: primaryColor,
                color: contrastText,
              }}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

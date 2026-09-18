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
  Plus,
  Minus,
  Trash2,
  Send,
  Receipt,
  Mic,
  MicOff,
  ShieldAlert,
  Wand2,
  Loader2,
} from 'lucide-react';

import {
  CanvaMenuConfig,
  CanvaMenuStylePreset,
  CanvaDish,
  CanvaMenuCategory,
  CANVA_PRESETS,
  getDefaultCanvaMenuConfig,
} from '@/lib/canva-menu';

import { VoiceOrderRecognizer, matchSpokenDishes, isSpeechRecognitionSupported } from '@/lib/voice-ordering';
import { fetchWinePairing, WinePairingData } from '@/lib/wine-pairing';

const NfcWaveIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9a6 6 0 0 1 0 6" />
    <path d="M10 6a10 10 0 0 1 0 12" />
    <path d="M14 3a14 14 0 0 1 0 18" />
  </svg>
);

import { WhatsAppIcon, InstagramIcon } from '@/components/brand-icons';
import SmartBillModal from '@/components/SmartBillModal';
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
  getBorderRadiusClass,
  getBorderRadiusStyle,
} from '@/lib/hub-config';
import {
  hapticTap,
  hapticSelection,
  hapticSuccess,
  hapticWarning,
  hapticNfcPulse,
  hapticStarRating,
  hapticWaiterCall,
} from '@/lib/haptics';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  getTagTranslation,
} from '@/lib/translations';

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
  
  // Canva Menu & Table Cart State (for restaurants)
  const [canvaCategoryTab, setCanvaCategoryTab] = useState<string>('tutti');
  const [canvaSearchQuery, setCanvaSearchQuery] = useState<string>('');
  const [tableCart, setTableCart] = useState<Record<string, { dish: CanvaDish; quantity: number }>>({});
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSending, setOrderSending] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);
  const [orderErrorMessage, setOrderErrorMessage] = useState<string | null>(null);
  const [showBillInvoiceModal, setShowBillInvoiceModal] = useState(false);

  // AI Sommelier & Wine Pairing State
  const [showWinePairingModal, setShowWinePairingModal] = useState(false);
  const [pairingDish, setPairingDish] = useState<CanvaDish | null>(null);
  const [winePairingResult, setWinePairingResult] = useState<{ reply: string; winePairing: WinePairingData } | null>(null);
  const [winePairingLoading, setWinePairingLoading] = useState(false);

  // AI Intolerance & Allergy Filter
  const [activeAllergyFilter, setActiveAllergyFilter] = useState<string>('all');

  // AI Voice-to-Cart Ordering State
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceLiveTranscript, setVoiceLiveTranscript] = useState('');
  const [voiceFeedbackToast, setVoiceFeedbackToast] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Dynamic Upselling State
  const [upsellSuggestion, setUpsellSuggestion] = useState<{ dish: CanvaDish; message: string } | null>(null);

  // AI In-Dining Review Shield State
  const [showInDiningShieldModal, setShowInDiningShieldModal] = useState(false);
  const [inDiningFeedbackText, setInDiningFeedbackText] = useState('');
  const [inDiningSending, setInDiningSending] = useState(false);
  const [inDiningSuccess, setInDiningSuccess] = useState(false);

  const [showContactModal, setShowContactModal] = useState(false);
  const [activeCustomModal, setActiveCustomModal] = useState<{ title: string; content: string } | null>(null);
  const [sharedNotification, setSharedNotification] = useState(false);

  // Language Selector & Multi-Language Translation
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('it');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = useMemo(() => TRANSLATIONS[selectedLang] || TRANSLATIONS.it, [selectedLang]);

  // Automatic browser language detection for tourists
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.slice(0, 2).toLowerCase();
      if (['it', 'en', 'de', 'fr', 'es'].includes(browserLang)) {
        setSelectedLang(browserLang as SupportedLanguage);
      }
    }
  }, []);

  // Star Rating Bar
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [, setIsLunchTime] = useState(false);

  // Replay NFC Tap & Assemble Magic Animation
  const replayNfcTap = () => {
    setNfcPhase('sensing');
    hapticNfcPulse();
    setLoading(true);
    setTimeout(() => {
      setNfcPhase('synced');
      hapticSuccess();
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

      hapticNfcPulse();

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
            hapticSuccess();

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
    hapticStarRating(stars);
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
      setTimeout(() => {
        window.location.href = `/review/${code}`;
      }, 650);
    } else {
      // 1, 2, or 3 stars: IN-DINING REVIEW SHIELD!
      // Opens immediate intervention modal before the customer leaves
      hapticWarning();
      setShowInDiningShieldModal(true);
    }
  };

  const handleSendInDiningReviewAlert = async () => {
    if (!org) return;
    setInDiningSending(true);
    hapticTap();
    try {
      await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: org.id,
          device_id: device?.id || null,
          type: 'negative_review_alert',
          table_label: device?.name || `Tavolo ${code}`,
          order_details: {
            rating: selectedRating,
            notes: inDiningFeedbackText.trim() || 'Valutazione bassa prima del pagamento',
          },
        }),
      });
      hapticSuccess();
      setInDiningSuccess(true);
      setTimeout(() => {
        setShowInDiningShieldModal(false);
        setInDiningSuccess(false);
        setInDiningFeedbackText('');
      }, 3000);
    } catch (err) {
      console.error('Failed to send in-dining review alert:', err);
    } finally {
      setInDiningSending(false);
    }
  };

  const handleOpenWinePairing = async (dish: CanvaDish) => {
    hapticTap();
    setPairingDish(dish);
    setShowWinePairingModal(true);
    setWinePairingLoading(true);
    setWinePairingResult(null);
    try {
      const res = await fetchWinePairing(dish.name, dish.description, org?.id);
      setWinePairingResult(res);
      hapticSuccess();
    } catch (e) {
      console.error('Wine pairing error:', e);
    } finally {
      setWinePairingLoading(false);
    }
  };

  const handleToggleVoiceOrdering = () => {
    hapticTap();
    if (isVoiceListening) {
      setIsVoiceListening(false);
      return;
    }

    setShowVoiceModal(true);
    setIsVoiceListening(true);
    setVoiceLiveTranscript('');
    setVoiceFeedbackToast(null);

    const allDishes = canvaMenu.categories.flatMap((c) => c.dishes);

    const recognizer = new VoiceOrderRecognizer(
      (transcript, isFinal) => {
        setVoiceLiveTranscript(transcript);
        if (isFinal) {
          const result = matchSpokenDishes(transcript, allDishes);
          if (result.matchedItems.length > 0) {
            hapticSuccess();
            setTableCart((prev) => {
              const next = { ...prev };
              for (const item of result.matchedItems) {
                const current = next[item.dish.id]?.quantity || 0;
                next[item.dish.id] = {
                  dish: item.dish,
                  quantity: current + item.quantity,
                };
              }
              return next;
            });
            if (result.extractedNotes) {
              setOrderNotes((prev) => (prev ? `${prev}, ${result.extractedNotes}` : result.extractedNotes));
            }
            const addedNames = result.matchedItems.map((i) => `${i.quantity}x ${i.dish.name}`).join(', ');
            setVoiceFeedbackToast(`Aggiunto al vassoio: ${addedNames}!`);
            setTimeout(() => {
              setShowVoiceModal(false);
              setIsVoiceListening(false);
            }, 1800);
          } else {
            setVoiceFeedbackToast(`Ascoltato: "${transcript}". Prova a dire "Due pizze margherite" o "Una tagliata".`);
          }
        }
      },
      (err) => {
        console.warn('Voice recognition error:', err);
        setIsVoiceListening(false);
      },
      () => {
        setIsVoiceListening(false);
      }
    );

    const started = recognizer.start();
    if (!started) {
      setIsVoiceListening(false);
      alert('Riconoscimento vocale non consentito dal browser. Verifica i permessi microfono.');
    }
  };

  // Web Share or Copy Link
  const handleShare = async () => {
    hapticTap();
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

  const isRestaurant = org?.category === 'restaurant';

  const canvaMenu: CanvaMenuConfig = useMemo(() => {
    if (org?.category === 'restaurant') {
      if (activeConfig?.canvaMenu && activeConfig.canvaMenu.enabled !== false) {
        return activeConfig.canvaMenu;
      }
      return getDefaultCanvaMenuConfig();
    }
    return getDefaultCanvaMenuConfig();
  }, [org?.category, activeConfig?.canvaMenu]);

  const canvaPreset = useMemo(() => {
    const presetKey = canvaMenu.preset || 'chalkboard';
    return CANVA_PRESETS[presetKey] || CANVA_PRESETS.chalkboard;
  }, [canvaMenu.preset]);

  const canvaAccent = canvaMenu.primaryAccent || canvaPreset.primaryAccent || primaryColor;
  const canvaContrastText = getContrastColor(canvaAccent);

  const canvaFontCss = useMemo(() => {
    if (canvaMenu.fontFamily) {
      const found = HUB_FONT_OPTIONS.find((f) => f.id === canvaMenu.fontFamily);
      if (found) return found.cssFamily;
    }
    return canvaPreset.cssFamily;
  }, [canvaMenu.fontFamily, canvaPreset]);

  const getLocalizedModule = (mod: HubModuleConfig) => {
    if (selectedLang === 'it' || mod.isCustom) return { title: mod.title, subtitle: mod.subtitle };
    switch (mod.id) {
      case 'menu': return { title: t.menuTitle, subtitle: t.menuSubtitle };
      case 'service': return { title: t.serviceTitle, subtitle: t.serviceSubtitle };
      case 'sommelier': return { title: t.sommelierTitle, subtitle: t.sommelierSubtitle };
      case 'wifi': return { title: t.wifiTitle, subtitle: t.wifiSubtitle };
      case 'wheel': return { title: t.wheelTitle, subtitle: t.wheelSubtitle };
      case 'loyalty': return { title: t.loyaltyTitle, subtitle: t.loyaltySubtitle };
      case 'reviews': return { title: t.reviewTitle, subtitle: t.reviewSubtitle };
      case 'guide': return { title: t.guideTitle, subtitle: t.guideSubtitle };
      case 'whatsapp': return { title: t.whatsappTitle, subtitle: t.whatsappSubtitle };
      case 'instagram': return { title: t.instagramTitle, subtitle: t.instagramSubtitle };
      default: return { title: mod.title, subtitle: mod.subtitle };
    }
  };

  const cartItems = useMemo(() => {
    return Object.values(tableCart).filter((entry) => entry.quantity > 0);
  }, [tableCart]);

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const totalCartNumeric = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const cleaned = String(item.dish.price).replace(/[^0-9.,]/g, '').replace(',', '.');
      const val = parseFloat(cleaned) || 0;
      return acc + val * item.quantity;
    }, 0);
  }, [cartItems]);

  const formattedTotal = useMemo(() => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(totalCartNumeric);
  }, [totalCartNumeric]);

  const addToTableCart = (dish: CanvaDish) => {
    hapticTap();
    setTableCart((prev) => {
      const current = prev[dish.id]?.quantity || 0;
      return {
        ...prev,
        [dish.id]: {
          dish,
          quantity: current + 1,
        },
      };
    });

    // Dynamic Upselling: suggest matching drink, side or dessert
    const lowerName = dish.name.toLowerCase();
    const isBeverage = lowerName.includes('vino') || lowerName.includes('birra') || lowerName.includes('acqua') || lowerName.includes('spritz') || lowerName.includes('caffè');
    if (!isBeverage && !upsellSuggestion) {
      const companion = canvaMenu?.categories
        ?.flatMap((c) => c.dishes)
        ?.find((d) => {
          const l = d.name.toLowerCase();
          return (l.includes('birra') || l.includes('vino') || l.includes('patat') || l.includes('tiramis')) && d.id !== dish.id;
        });
      if (companion) {
        setUpsellSuggestion({
          dish: companion,
          message: 'Abbinamento consigliato per completare la portata:',
        });
        setTimeout(() => setUpsellSuggestion(null), 6000);
      }
    }
  };

  const removeFromTableCart = (dishId: string) => {
    hapticTap();
    setTableCart((prev) => {
      const current = prev[dishId]?.quantity || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[dishId];
        return next;
      }
      return {
        ...prev,
        [dishId]: {
          ...prev[dishId],
          quantity: current - 1,
        },
      };
    });
  };

  const removeDishEntirelyFromCart = (dishId: string) => {
    hapticTap();
    setTableCart((prev) => {
      const next = { ...prev };
      delete next[dishId];
      return next;
    });
  };

  const handleSendOrder = async () => {
    if (cartItems.length === 0 || !org) return;
    setOrderSending(true);
    setOrderErrorMessage(null);
    hapticSuccess();
    hapticNfcPulse();

    try {
      const payloadItems = cartItems.map((item) => ({
        id: item.dish.id,
        name: item.dish.name,
        quantity: item.quantity,
        price: item.dish.price,
      }));

      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: org.id,
          device_id: device?.id || null,
          type: 'dish_order',
          table_label: device?.name || 'Tavolo',
          order_details: {
            items: payloadItems,
            total: formattedTotal,
            notes: orderNotes.trim() || undefined,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Errore durante l’invio dell’ordine');
      }

      setOrderSuccessMessage('Ordine inviato alla cassa e cucina! Il personale sta preparando i tuoi piatti.');
      setTableCart({});
      setOrderNotes('');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: [canvaAccent, '#10b981', '#f59e0b', '#ffffff'],
        });
      } catch {}
    } catch (err: any) {
      hapticWarning();
      setOrderErrorMessage(err?.message || 'Impossibile inviare la comanda. Riprova o chiama il cameriere.');
    } finally {
      setOrderSending(false);
    }
  };

  const visibleCanvaCategories = useMemo(() => {
    const query = canvaSearchQuery.trim().toLowerCase();
    const categories = canvaMenu?.categories || [];
    return categories
      .filter((cat) => canvaCategoryTab === 'tutti' || cat.id === canvaCategoryTab)
      .map((cat) => {
        const filteredDishes = cat.dishes.filter((dish) => {
          // Allergy filter
          if (activeAllergyFilter !== 'all') {
            const tags = (dish.tags || []).map((t) => t.toLowerCase());
            const text = `${dish.name} ${dish.description}`.toLowerCase();
            if (activeAllergyFilter === 'Gluten Free') {
              const hasGf = tags.some((t) => t.includes('gluten free') || t.includes('senza glutine'));
              if (!hasGf && !text.includes('gluten free') && !text.includes('senza glutine')) return false;
            } else if (activeAllergyFilter === 'Lattosio') {
              const hasDairy = tags.some((t) => t.includes('lattosio')) || text.includes('formagg') || text.includes('mozzarella') || text.includes('burrata') || text.includes('parmigiano');
              if (hasDairy) return false;
            } else if (activeAllergyFilter === 'Vegetariano') {
              const isVeg = tags.some((t) => t.includes('vegetariano') || t.includes('vegano'));
              if (!isVeg && !text.includes('vegetariano') && !text.includes('vegano')) return false;
            } else if (activeAllergyFilter === 'Vegano') {
              const isVegan = tags.some((t) => t.includes('vegano'));
              if (!isVegan && !text.includes('vegano')) return false;
            } else if (activeAllergyFilter === 'Crostacei') {
              const hasShellfish = tags.some((t) => t.includes('crostacei') || t.includes('molluschi')) || text.includes('gamber') || text.includes('scamp') || text.includes('cozz') || text.includes('vongol');
              if (hasShellfish) return false;
            }
          }

          if (!query) return true;
          const inName = dish.name.toLowerCase().includes(query);
          const inDesc = dish.description.toLowerCase().includes(query);
          const inTags = dish.tags?.some((t) => t.toLowerCase().includes(query));
          return inName || inDesc || inTags;
        });
        return {
          ...cat,
          dishes: filteredDishes,
        };
      })
      .filter((cat) => cat.dishes.length > 0);
  }, [canvaMenu?.categories, canvaCategoryTab, canvaSearchQuery, activeAllergyFilter]);

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
          } relative z-50 flex items-center justify-between gap-3 pt-0.5`}
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

          {/* Right: Language Switcher, Notification & Share Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  hapticSelection();
                  setShowLangMenu(!showLangMenu);
                }}
                aria-label="Cambia lingua"
                className={`touch-press h-9 px-2.5 rounded-full border flex items-center gap-1.5 transition-all text-xs font-bold active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800 shadow-xs'
                    : 'bg-[#181b19] hover:bg-[#202421] border-white/[0.08] text-zinc-200'
                }`}
              >
                <span>{SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.flag || '🇮🇹'}</span>
                <span className="uppercase text-[10px] tracking-wider font-mono">{selectedLang}</span>
              </button>

              {showLangMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLangMenu(false)}
                  />
                  <div
                    className={`absolute right-0 top-11 z-50 py-1.5 px-1 rounded-2xl shadow-2xl border min-w-[145px] animate-fade-in backdrop-blur-2xl ${
                      isLight
                        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-[0_10px_35px_rgba(0,0,0,0.15)]'
                        : 'bg-[#161816]/95 border-white/10 text-white shadow-[0_10px_35px_rgba(0,0,0,0.7)]'
                    }`}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          hapticSelection();
                          setSelectedLang(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          selectedLang === lang.code
                            ? 'bg-amber-500/20 text-amber-400 font-bold'
                            : isLight
                            ? 'hover:bg-slate-100 text-slate-700'
                            : 'hover:bg-white/5 text-zinc-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        {selectedLang === lang.code && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Notification Bell with Badge */}
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setShowContactModal(true);
              }}
              aria-label="Notifiche e assistenza"
              className={`touch-press w-9 h-9 rounded-full border flex items-center justify-center transition-all relative active:scale-95 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
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
                  ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
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
          } w-full text-left touch-press active:scale-[0.98] flex items-center justify-between px-3.5 py-2 ${getBorderRadiusClass(activeConfig.borderRadius)} backdrop-blur-md shadow-sm transition-all cursor-pointer ${
            isLight
              ? 'bg-white/90 border border-slate-200/90 text-slate-800 hover:bg-slate-50'
              : 'bg-[#141715]/90 border border-white/[0.08] text-white hover:bg-[#1a1d1b]'
          }`}
          style={getBorderRadiusStyle(activeConfig.borderRadius)}
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
          <div
            className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 ${getBorderRadiusClass(activeConfig.borderRadius)} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shrink-0`}
            style={getBorderRadiusStyle(activeConfig.borderRadius)}
          >
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
              onClick={() => hapticTap()}
              target="_blank"
              rel="noopener noreferrer"
              className={`${
                nfcPhase === 'assembling' ? 'animate-assemble-hero' : 'animate-nfc-stagger-3'
              } animate-hero-glow touch-press active:scale-[0.98] ${getBorderRadiusClass(activeConfig.borderRadius)} p-4 sm:p-5 flex items-center justify-between transition-all shadow-xl group relative overflow-hidden w-full text-left`}
              style={{
                backgroundColor: primaryColor,
                color: contrastText,
                boxShadow: `0 10px 28px ${primaryColor}35`,
                '--hero-glow-1': `${primaryColor}35`,
                '--hero-glow-2': `${primaryColor}20`,
                '--hero-glow-strong-1': `${primaryColor}65`,
                '--hero-glow-strong-2': `${primaryColor}40`,
                ...getBorderRadiusStyle(activeConfig.borderRadius),
              } as React.CSSProperties}
            >
              {/* Continuous Diagonal Mirror Shimmer Beam */}
              <div
                className={`absolute inset-0 pointer-events-none overflow-hidden ${getBorderRadiusClass(activeConfig.borderRadius)}`}
                style={getBorderRadiusStyle(activeConfig.borderRadius)}
              >
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-beam" />
              </div>
              {/* Luminous breath overlay */}
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/20 blur-xl pointer-events-none animate-pulse" />

              <div className="relative z-10 flex-1 min-w-0 pr-3">
                {activeConfig.hero.badgeText && (
                  <div
                    className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 ${getBorderRadiusClass(activeConfig.borderRadius)} bg-black/20 mb-1.5`}
                    style={getBorderRadiusStyle(activeConfig.borderRadius)}
                  >
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
                <div
                  className={`w-11 h-11 ${getBorderRadiusClass(activeConfig.borderRadius)} bg-black/15 flex items-center justify-center group-hover:scale-110 transition-transform`}
                  style={getBorderRadiusStyle(activeConfig.borderRadius)}
                >
                  <ExternalLink className="w-5 h-5 animate-float-gentle" style={{ color: contrastText }} />
                </div>
              </div>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setShowMenuModal(true);
              }}
              className={`${
                nfcPhase === 'assembling' ? 'animate-assemble-hero' : 'animate-nfc-stagger-3'
              } ${activeConfig.buttonGlow !== false ? 'animate-hero-glow' : ''} touch-press active:scale-[0.98] ${getBorderRadiusClass(activeConfig.borderRadius)} p-4 sm:p-5 flex items-center justify-between transition-all shadow-xl group relative overflow-hidden w-full text-left cursor-pointer`}
              style={{
                backgroundColor: primaryColor,
                color: contrastText,
                boxShadow: activeConfig.buttonGlow !== false ? `0 10px 28px ${primaryColor}35` : 'none',
                '--hero-glow-1': `${primaryColor}35`,
                '--hero-glow-2': `${primaryColor}20`,
                '--hero-glow-strong-1': `${primaryColor}65`,
                '--hero-glow-strong-2': `${primaryColor}40`,
                ...getBorderRadiusStyle(activeConfig.borderRadius),
              } as React.CSSProperties}
            >
              {/* Continuous Diagonal Mirror Shimmer Beam */}
              <div
                className={`absolute inset-0 pointer-events-none overflow-hidden ${getBorderRadiusClass(activeConfig.borderRadius)}`}
                style={getBorderRadiusStyle(activeConfig.borderRadius)}
              >
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-beam" />
              </div>
              {/* Luminous breath overlay */}
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/20 blur-xl pointer-events-none animate-pulse" />

              <div className="relative z-10 flex-1 min-w-0 pr-3">
                {activeConfig.hero.badgeText && (
                  <div
                    className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 ${getBorderRadiusClass(activeConfig.borderRadius)} bg-black/20 mb-1.5`}
                    style={getBorderRadiusStyle(activeConfig.borderRadius)}
                  >
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
                <div
                  className={`w-11 h-11 ${getBorderRadiusClass(activeConfig.borderRadius)} bg-black/15 flex items-center justify-center group-hover:scale-110 transition-transform`}
                  style={getBorderRadiusStyle(activeConfig.borderRadius)}
                >
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
                  case 'WhatsApp':
                    return <WhatsAppIcon className="w-5 h-5" color="#25D366" />;
                  case 'Instagram':
                    return <InstagramIcon className="w-5 h-5 text-pink-500" />;
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
                  return <WhatsAppIcon className="w-5 h-5" color="#25D366" />;
                case 'menu':
                  return <UtensilsCrossed className="w-5 h-5 animate-float-gentle" style={{ color: primaryColor }} />;
                case 'instagram':
                  return <InstagramIcon className="w-5 h-5 text-pink-500" />;
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
                    className={`w-10 h-10 ${getBorderRadiusClass(activeConfig.borderRadius)} flex items-center justify-center group-hover:scale-110 transition-transform relative ${
                      isLight ? 'bg-slate-100 border border-slate-200' : 'bg-white/[0.05] border border-white/5'
                    }`}
                    style={getBorderRadiusStyle(activeConfig.borderRadius)}
                  >
                    {renderModuleIcon()}
                  </div>
                  {mod.badge && (
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 ${getBorderRadiusClass(activeConfig.borderRadius)}`}
                      style={{
                        backgroundColor: `${primaryColor}20`,
                        color: primaryColor,
                        border: `1px solid ${primaryColor}35`,
                        ...getBorderRadiusStyle(activeConfig.borderRadius),
                      }}
                    >
                      {mod.badge}
                    </span>
                  )}
                </div>

                <div className="w-full">
                  {(() => {
                    const loc = getLocalizedModule(mod);
                    return (
                      <>
                        <h3
                          className={`text-sm sm:text-base font-bold tracking-tight leading-none mb-1 truncate ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {loc.title}
                        </h3>
                        {loc.subtitle && (
                          <p
                            className={`text-[11px] leading-tight truncate ${
                              isLight ? 'text-slate-500' : 'text-zinc-400'
                            }`}
                          >
                            {loc.subtitle}
                          </p>
                        )}
                      </>
                    );
                  })()}
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

            const cardRadiusClass = getBorderRadiusClass(activeConfig.borderRadius);
            const cardRadiusStyle = getBorderRadiusStyle(activeConfig.borderRadius);

            const isCompact = activeConfig.cardDensity === 'compact';
            const densityClass = isCompact ? 'p-3 min-h-[96px] sm:min-h-[105px]' : 'p-4 min-h-[115px] sm:min-h-[125px]';

            const cardClassName = `${cardSpanClass} ${cardAnimClass} touch-press active:scale-95 ${cardRadiusClass} ${densityClass} flex flex-col justify-between items-start text-left transition-all group relative overflow-hidden ${cardBaseClass}`;

            const moduleCardStyle: React.CSSProperties = {
              ...cardCustomStyle,
              ...cardRadiusStyle,
              ...(mod.cardColor ? { borderColor: `${mod.cardColor}50` } : {}),
            };

            // Custom modules or modal actions
            if (mod.isCustom) {
              if (mod.actionType === 'modal') {
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setActiveCustomModal({
                        title: mod.modalTitle || mod.title,
                        content: mod.modalContent || '',
                      });
                    }}
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
                    onClick={() => hapticTap()}
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
                  onClick={() => {
                    hapticTap();
                    setActiveCustomModal({
                      title: mod.title,
                      content: mod.subtitle || 'Nessun dettaglio aggiuntivo specificato.',
                    });
                  }}
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
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setShowBillInvoiceModal(true);
                    }}
                    className={cardClassName}
                    style={moduleCardStyle}
                  >
                    {commonInner}
                  </button>
                );
              case 'sommelier':
                return (
                  <Link key={mod.id} href={`/ai-sommelier/${code}`} onClick={() => hapticTap()} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </Link>
                );
              case 'wifi':
                return (
                  <Link key={mod.id} href={`/wifi/${code}`} onClick={() => hapticTap()} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </Link>
                );
              case 'wheel':
                return (
                  <Link key={mod.id} href={`/wheel/${code}`} onClick={() => hapticTap()} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </Link>
                );
              case 'loyalty':
                return (
                  <Link key={mod.id} href={`/loyalty/${code}`} onClick={() => hapticTap()} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </Link>
                );
              case 'reviews':
                return (
                  <Link key={mod.id} href={`/review/${code}`} onClick={() => hapticTap()} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </Link>
                );
              case 'guide':
                if (mod.customUrl) {
                  return (
                    <a key={mod.id} href={mod.customUrl} onClick={() => hapticTap()} target="_blank" rel="noopener noreferrer" className={cardClassName} style={moduleCardStyle}>
                      {commonInner}
                    </a>
                  );
                }
                return (
                  <button key={mod.id} type="button" onClick={() => { hapticTap(); setShowCityGuide(true); }} className={cardClassName} style={moduleCardStyle}>
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
                      onClick={() => hapticTap()}
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
                  <button key={mod.id} type="button" onClick={() => { hapticTap(); setShowContactModal(true); }} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </button>
                );
              }
              case 'menu':
                if (mod.customUrl) {
                  return (
                    <a key={mod.id} href={mod.customUrl} onClick={() => hapticTap()} target="_blank" rel="noopener noreferrer" className={cardClassName} style={moduleCardStyle}>
                      {commonInner}
                    </a>
                  );
                }
                return (
                  <button key={mod.id} type="button" onClick={() => { hapticTap(); setShowMenuModal(true); }} className={cardClassName} style={moduleCardStyle}>
                    {commonInner}
                  </button>
                );
              case 'instagram':
                return (
                  <a
                    key={mod.id}
                    href={mod.customUrl || org.instagram_url || org.website || '#'}
                    onClick={() => hapticTap()}
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
                    onClick={() => hapticTap()}
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
                    <a key={mod.id} href={mod.customUrl} onClick={() => hapticTap()} target="_blank" rel="noopener noreferrer" className={cardClassName} style={moduleCardStyle}>
                      {commonInner}
                    </a>
                  );
                }
                return (
                  <button key={mod.id} type="button" onClick={() => { hapticTap(); setShowContactModal(true); }} className={cardClassName} style={moduleCardStyle}>
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
              onClick={() => hapticTap()}
              target="_blank"
              rel="noopener noreferrer"
              className={`touch-press group relative block ${getBorderRadiusClass(activeConfig.borderRadius)} border p-3.5 transition-all active:scale-[0.98] shadow-lg overflow-hidden ${
                isLight ? 'bg-white border-slate-200' : 'border-white/10'
              }`}
              style={{
                borderColor: `${primaryColor}60`,
                background: isLight
                  ? `linear-gradient(135deg, ${primaryColor}15 0%, #ffffff 100%)`
                  : `linear-gradient(135deg, ${primaryColor}20 0%, #161816 100%)`,
                ...getBorderRadiusStyle(activeConfig.borderRadius),
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 ${getBorderRadiusClass(activeConfig.borderRadius)} mb-1`}
                    style={{
                      backgroundColor: `${primaryColor}25`,
                      color: primaryColor,
                      ...getBorderRadiusStyle(activeConfig.borderRadius),
                    }}
                  >
                    <Sparkles className="w-2.5 h-2.5" /> In Evidenza
                  </span>
                  <h3 className={`text-xs sm:text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {org.custom_cta_label}
                  </h3>
                </div>
                <div
                  className={`w-8 h-8 ${getBorderRadiusClass(activeConfig.borderRadius)} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md`}
                  style={{
                    backgroundColor: primaryColor,
                    color: contrastText,
                    ...getBorderRadiusStyle(activeConfig.borderRadius),
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </a>
          )}

          {/* Interactive Review Shield Banner */}
          <div
            className={`${getBorderRadiusClass(activeConfig.borderRadius)} border p-4 shadow-xl relative overflow-hidden ${
              isLight
                ? 'bg-white border-slate-200'
                : 'border-white/[0.08] bg-gradient-to-b from-[#181b19] to-[#121413]'
            }`}
            style={{
              boxShadow: `0 8px 30px ${primaryColor}12`,
              ...getBorderRadiusStyle(activeConfig.borderRadius),
            }}
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
              className={`flex items-center justify-around py-1.5 ${getBorderRadiusClass(activeConfig.borderRadius)} border ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/5'
              }`}
              style={getBorderRadiusStyle(activeConfig.borderRadius)}
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
      {activeConfig.showBottomDock !== false && (
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
              onClick={() => {
                hapticTap();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Torna all'inizio"
              className="touch-press active:scale-95 flex flex-col items-center justify-center hover:opacity-80 transition-all p-1.5"
            >
              <Home className="w-5 h-5" />
              <span className="text-[9px] font-medium mt-0.5">{t.home}</span>
            </button>

            {/* Menù / Servizi */}
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setShowMenuModal(true);
              }}
              aria-label="Apri Menù"
              className="touch-press active:scale-95 flex flex-col items-center justify-center hover:opacity-80 transition-all p-1.5"
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[9px] font-medium mt-0.5">{t.menu}</span>
            </button>

            {/* CENTER ELEVATED FLOATING ACTION BUTTON (Primary Accent) */}
            <Link
              href={`/call/${code}`}
              onClick={() => hapticWaiterCall()}
              aria-label="Chiama Sala Rapido"
              className="touch-press active:scale-90 w-12 h-12 -mt-6 rounded-full flex items-center justify-center transition-all shadow-2xl relative group"
              style={{
                backgroundColor: primaryColor,
                color: contrastText,
                boxShadow: activeConfig.buttonGlow !== false ? `0 6px 25px ${primaryColor}65` : 'none',
              }}
            >
              {/* Ambient radar pulse ring */}
              {activeConfig.buttonGlow !== false && (
                <span
                  className="absolute inset-0 rounded-full animate-fab-pulse-ring pointer-events-none"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
              <BellRing className="w-5 h-5 relative z-10 animate-bell-swing origin-top" />
            </Link>

            {/* Info & Assistenza */}
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setShowContactModal(true);
              }}
              aria-label="Info e contatti"
              className="touch-press active:scale-95 flex flex-col items-center justify-center hover:opacity-80 transition-all p-1.5"
            >
              <Info className="w-5 h-5" />
              <span className="text-[9px] font-medium mt-0.5">{t.info}</span>
            </button>

            {/* Condividi */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Condividi"
              className="touch-press active:scale-95 flex flex-col items-center justify-center hover:opacity-80 transition-all p-1.5"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-[9px] font-medium mt-0.5">{t.share}</span>
            </button>
          </nav>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIGITAL MENU MODAL (CANVA STYLE FOR RESTAURANTS / STANDARD FOR OTHERS) */}
      {/* ========================================================================= */}
      {showMenuModal && (
        isRestaurant ? (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div
              className={`w-full max-w-lg h-[94vh] sm:h-[88vh] rounded-t-[32px] sm:rounded-[32px] border ${canvaPreset.borderClass} flex flex-col overflow-hidden shadow-2xl transition-all relative`}
              style={{
                background: canvaPreset.decorStyle.background,
                fontFamily: canvaFontCss,
              }}
            >
              {/* Top Header Bar */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-black/30 backdrop-blur-md z-10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0"
                    style={{ backgroundColor: `${canvaAccent}25`, color: canvaAccent }}
                  >
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-sm sm:text-base font-extrabold truncate ${canvaPreset.textClass}`}>
                      {canvaMenu.headerTitle || 'Menù & Specialità'}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate flex items-center gap-1.5">
                      <span>{org.name}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="font-semibold text-emerald-400">📍 {device?.name || 'Tavolo'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {(org.lunch_destination_url || org.website) && (
                    <a
                      href={org.lunch_destination_url || org.website!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-1 text-white transition-colors"
                    >
                      <span>PDF / Web</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      hapticTap();
                      setShowMenuModal(false);
                    }}
                    className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                    aria-label="Chiudi menù"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Menu Body */}
              <div className="overflow-y-auto flex-1 space-y-4 p-4 no-scrollbar">
                {/* Cover Hero Banner */}
                {canvaMenu.coverImageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden min-h-[140px] sm:min-h-[160px] flex flex-col justify-end p-4 border border-white/10 shadow-lg group">
                    <img
                      src={canvaMenu.coverImageUrl}
                      alt={canvaMenu.headerTitle || 'Cover menù'}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="relative z-10 space-y-1">
                      <span
                        className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block backdrop-blur-md"
                        style={{ backgroundColor: `${canvaAccent}40`, color: '#ffffff', border: `1px solid ${canvaAccent}60` }}
                      >
                        {canvaPreset.name}
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                        {canvaMenu.headerTitle || 'Menù Digitale'}
                      </h2>
                      {canvaMenu.headerSubtitle && (
                        <p className="text-xs text-zinc-200 line-clamp-2">
                          {canvaMenu.headerSubtitle}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-4 rounded-2xl border border-white/10 text-left space-y-1"
                    style={{ background: canvaPreset.decorStyle.cardBackground }}
                  >
                    <span
                      className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md inline-block"
                      style={{ backgroundColor: `${canvaAccent}20`, color: canvaAccent }}
                    >
                      {canvaPreset.name}
                    </span>
                    <h2 className={`text-base sm:text-lg font-black ${canvaPreset.textClass}`}>
                      {canvaMenu.headerTitle || 'Menù Digitale'}
                    </h2>
                    {canvaMenu.headerSubtitle && (
                      <p className={`text-xs ${canvaPreset.subtextClass}`}>
                        {canvaMenu.headerSubtitle}
                      </p>
                    )}
                  </div>
                )}

                {/* Order Notice or Chef Context */}
                {(canvaMenu.orderNotice || org.ai_menu_context) && (
                  <div
                    className="p-3 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 backdrop-blur-sm"
                    style={{
                      backgroundColor: `${canvaAccent}12`,
                      borderColor: `${canvaAccent}30`,
                      color: '#ffffff',
                    }}
                  >
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: canvaAccent }} />
                    <div className="space-y-0.5">
                      <strong className="block text-[10px] uppercase tracking-wider font-extrabold" style={{ color: canvaAccent }}>
                        {canvaMenu.allowTableOrders !== false ? 'Ordinazione al Tavolo Attiva' : 'Nota della Cucina'}
                      </strong>
                      <p className="text-zinc-200 text-[11px] leading-relaxed">
                        {canvaMenu.orderNotice || org.ai_menu_context}
                      </p>
                    </div>
                  </div>
                )}

                {/* Search Bar & Voice Order Action */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={canvaSearchQuery}
                      onChange={(e) => setCanvaSearchQuery(e.target.value)}
                      placeholder="Cerca piatti, allergeni, ingredienti..."
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                      style={{ borderColor: canvaSearchQuery ? canvaAccent : undefined }}
                    />
                    {canvaSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCanvaSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* AI Voice-to-Cart Button */}
                  <button
                    type="button"
                    onClick={handleToggleVoiceOrdering}
                    className="px-3 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer shadow-xs"
                    title="Comanda Vocale AI: parla per ordinare"
                  >
                    <Mic className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span className="hidden sm:inline">Comanda Vocale</span>
                    <span className="sm:hidden">Voce</span>
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setCanvaCategoryTab('tutti');
                    }}
                    className={`shrink-0 text-[11px] px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                      canvaCategoryTab === 'tutti'
                        ? 'font-bold shadow-md'
                        : 'bg-white/[0.05] text-zinc-400 hover:text-white border border-white/5'
                    }`}
                    style={
                      canvaCategoryTab === 'tutti'
                        ? { backgroundColor: canvaAccent, color: canvaContrastText }
                        : {}
                    }
                  >
                    <span>{t.all}</span>
                    <span className="text-[9px] opacity-75">
                      ({canvaMenu.categories.reduce((a, c) => a + c.dishes.length, 0)})
                    </span>
                  </button>
                  {canvaMenu.categories.map((cat) => {
                    const isSelected = canvaCategoryTab === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          hapticTap();
                          setCanvaCategoryTab(cat.id);
                        }}
                        className={`shrink-0 text-[11px] px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'font-bold shadow-md'
                            : 'bg-white/[0.05] text-zinc-400 hover:text-white border border-white/5'
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: canvaAccent, color: canvaContrastText }
                            : {}
                        }
                      >
                        <span>{cat.name}</span>
                        <span className="text-[9px] opacity-75">({cat.dishes.length})</span>
                      </button>
                    );
                  })}
                </div>

                {/* AI Intolerance & Dietary Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Filtro AI:</span>
                  </span>
                  {[
                    { id: 'all', label: 'Tutti i piatti' },
                    { id: 'Gluten Free', label: 'Senza Glutine' },
                    { id: 'Lattosio', label: 'Senza Lattosio' },
                    { id: 'Vegetariano', label: 'Vegetariano' },
                    { id: 'Vegano', label: 'Vegano' },
                    { id: 'Crostacei', label: 'No Frutti di Mare' },
                  ].map((filter) => {
                    const active = activeAllergyFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => {
                          hapticTap();
                          setActiveAllergyFilter(filter.id);
                        }}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                          active
                            ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-xs'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>

                {/* Dishes Rendered by Category */}
                {visibleCanvaCategories.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-xs space-y-2">
                    <Utensils className="w-8 h-8 mx-auto opacity-30" />
                    <p>Nessun piatto trovato per "{canvaSearchQuery}".</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCanvaSearchQuery('');
                        setCanvaCategoryTab('tutti');
                      }}
                      className="text-[11px] underline"
                      style={{ color: canvaAccent }}
                    >
                      Reimposta filtri
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 pb-20">
                    {visibleCanvaCategories.map((category) => (
                      <div key={category.id} className="space-y-3">
                        {/* Category Header */}
                        <div className="flex items-baseline justify-between border-b pb-1.5" style={{ borderColor: canvaPreset.decorStyle.dividerColor }}>
                          <div>
                            <h3 className={`text-sm sm:text-base font-black ${canvaPreset.textClass}`}>
                              {category.name}
                            </h3>
                            {category.subtitle && (
                              <p className={`text-[10px] sm:text-[11px] ${canvaPreset.subtextClass}`}>
                                {category.subtitle}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono font-medium">
                            {category.dishes.length} {category.dishes.length === 1 ? 'portata' : 'portate'}
                          </span>
                        </div>

                        {/* Dishes Cards */}
                        <div className="grid grid-cols-1 gap-3">
                          {category.dishes.map((dish) => {
                            const inCartCount = tableCart[dish.id]?.quantity || 0;
                            return (
                              <div
                                key={dish.id}
                                className={`p-3.5 rounded-2xl border ${canvaPreset.borderClass} transition-all space-y-2.5 flex flex-col justify-between`}
                                style={{
                                  background: canvaPreset.decorStyle.cardBackground,
                                }}
                              >
                                <div className="flex gap-3 items-start">
                                  {/* Dish Image */}
                                  {dish.imageUrl && (
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-white/10 relative shadow-md bg-black/40">
                                      <img
                                        src={dish.imageUrl}
                                        alt={dish.name}
                                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                        loading="lazy"
                                      />
                                      {dish.popular && (
                                        <span
                                          className="absolute top-1 left-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md backdrop-blur-md shadow"
                                          style={{ backgroundColor: `${canvaAccent}E6`, color: canvaContrastText }}
                                        >
                                          Top
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Info */}
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className={`text-xs sm:text-sm font-bold leading-snug ${canvaPreset.textClass}`}>
                                          {dish.name}
                                        </h4>
                                        {dish.popular && !dish.imageUrl && (
                                          <span
                                            className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0"
                                            style={{ backgroundColor: `${canvaAccent}25`, color: canvaAccent }}
                                          >
                                            <Sparkles className="w-2 h-2" /> {t.topBadge}
                                          </span>
                                        )}
                                      </div>
                                      <span
                                        className="text-xs sm:text-sm font-extrabold font-mono shrink-0"
                                        style={{ color: canvaAccent }}
                                      >
                                        {dish.price}
                                      </span>
                                    </div>

                                    <p className={`text-[11px] leading-relaxed line-clamp-2 sm:line-clamp-3 ${canvaPreset.subtextClass}`}>
                                      {dish.description}
                                    </p>

                                    {/* Tags */}
                                    {dish.tags && dish.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {dish.tags.map((tag, idx) => (
                                          <span
                                            key={idx}
                                            className={`text-[9px] px-2 py-0.5 rounded-md font-medium border border-white/5 ${canvaPreset.badgeBgClass} ${canvaPreset.badgeTextClass}`}
                                          >
                                            {getTagTranslation(tag, selectedLang)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Controls & Wine Pairing */}
                                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                                  {/* AI Wine Pairing Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWinePairing(dish)}
                                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs"
                                    title="Chiedi al Sommelier AI quale vino abbinare a questo piatto"
                                  >
                                    <Wine className="w-3 h-3 text-purple-400" />
                                    <Sparkles className="w-2 h-2 text-amber-300" />
                                    <span>Abbina Vino</span>
                                  </button>

                                  {/* Order Controls (if allowTableOrders) */}
                                  {canvaMenu.allowTableOrders !== false && (
                                    <div className="flex items-center gap-2 ml-auto">
                                      {inCartCount > 0 ? (
                                        <div className="flex items-center gap-1.5 bg-white/10 rounded-xl p-1 border border-white/10">
                                          <button
                                            type="button"
                                            onClick={() => removeFromTableCart(dish.id)}
                                            className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                                            aria-label="Diminuisci quantità"
                                          >
                                            <Minus className="w-3.5 h-3.5" />
                                          </button>
                                          <span className="w-6 text-center text-xs font-bold font-mono text-white">
                                            {inCartCount}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => addToTableCart(dish)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all font-bold cursor-pointer"
                                            style={{ backgroundColor: canvaAccent, color: canvaContrastText }}
                                            aria-label="Aumenta quantità"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => addToTableCart(dish)}
                                          className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow border border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                                          style={{
                                            borderColor: `${canvaAccent}40`,
                                          }}
                                        >
                                          <Plus className="w-3.5 h-3.5" style={{ color: canvaAccent }} />
                                          <span>{t.addToCart}</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sticky Bottom Tray Bar inside modal */}
              {canvaMenu.allowTableOrders !== false && totalCartCount > 0 && (
                <div
                  className="p-3.5 border-t border-white/10 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-xl shrink-0 z-20"
                  style={{ background: 'rgba(15, 17, 18, 0.95)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 shadow"
                      style={{ backgroundColor: `${canvaAccent}25`, color: canvaAccent }}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white truncate">
                        Vassoio Tavolo ({totalCartCount} {totalCartCount === 1 ? 'piatto' : 'piatti'})
                      </p>
                      <p className="text-xs font-mono font-bold" style={{ color: canvaAccent }}>
                        {formattedTotal}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setShowOrderModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 shrink-0"
                    style={{
                      backgroundColor: canvaAccent,
                      color: canvaContrastText,
                      boxShadow: `0 4px 18px ${canvaAccent}50`,
                    }}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Vedi Comanda</span>
                  </button>
                </div>
              )}

              {/* Modal Bottom Footer */}
              <div className="p-3 bg-black/40 border-t border-white/10 flex items-center gap-2 shrink-0">
                <Link
                  href={`/call/${code}`}
                  onClick={() => {
                    hapticWaiterCall();
                    setShowMenuModal(false);
                  }}
                  className="flex-1 min-h-[40px] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow active:scale-95 bg-white/10 hover:bg-white/15 text-white"
                >
                  <BellRing className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chiama Cameriere</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    setShowMenuModal(false);
                  }}
                  className="px-4 min-h-[40px] bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        ) : (
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
                    onClick={() => {
                      hapticTap();
                      setShowMenuModal(false);
                    }}
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
                      onClick={() => {
                        hapticTap();
                        setMenuTab(tab.id as typeof menuTab);
                      }}
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
                          <h4 className="text-xs font-bold text-white leading-tight">
                            {item.name}
                          </h4>
                          {item.popular && (
                            <span
                              className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0"
                              style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                            >
                              <Sparkles className="w-2 h-2" /> Top
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
                  onClick={() => {
                    hapticWaiterCall();
                    setShowMenuModal(false);
                  }}
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
                  onClick={() => {
                    hapticTap();
                    setShowMenuModal(false);
                  }}
                  className="px-4 min-h-[42px] bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Chiudi
                </button>
              </div>

            </div>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* FLOATING TRAY BAR OUTSIDE MENU MODAL (ACTIVE TABLE ORDERING) */}
      {/* ========================================================================= */}
      {!showMenuModal && !showOrderModal && isRestaurant && canvaMenu.allowTableOrders !== false && totalCartCount > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md animate-fade-in">
          <div
            className="p-3 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3"
            style={{
              backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(20,24,22,0.95)',
              borderColor: `${canvaAccent}50`,
              boxShadow: `0 8px 30px rgba(0,0,0,0.5)`,
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0"
                style={{ backgroundColor: `${canvaAccent}25`, color: canvaAccent }}
              >
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {t.tableTray} ({totalCartCount} {t.orderAtTable})
                </p>
                <p className="text-[11px] font-mono font-bold" style={{ color: canvaAccent }}>
                  {formattedTotal}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setShowOrderModal(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 shrink-0"
              style={{
                backgroundColor: canvaAccent,
                color: canvaContrastText,
                boxShadow: `0 4px 16px ${canvaAccent}50`,
              }}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{t.viewOrder}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TABLE ORDER SUMMARY (COMANDA TAVOLO) MODAL */}
      {/* ========================================================================= */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#131614] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
                  style={{ backgroundColor: `${canvaAccent}25`, color: canvaAccent }}
                >
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">{t.orderSummary}</h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400">
                    {t.table}: <strong className="text-white font-semibold">{device?.name || 'Tavolo'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  hapticTap();
                  setShowOrderModal(false);
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderSuccessMessage ? (
              <div className="py-6 px-4 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 animate-bounce-short">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-extrabold text-white">{t.orderSentSuccess}</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
                    {orderSuccessMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    setOrderSuccessMessage(null);
                    setShowOrderModal(false);
                  }}
                  className="w-full py-3 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 transition-colors"
                >
                  {t.close}
                </button>
              </div>
            ) : (
              <>
                {/* Dishes in Comanda */}
                <div className="overflow-y-auto flex-1 space-y-2.5 max-h-[40vh] pr-1">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-xs">
                      {t.emptyTrayDesc}
                    </div>
                  ) : (
                    cartItems.map(({ dish, quantity }) => {
                      const cleanPrice = parseFloat(String(dish.price).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                      const subtotal = cleanPrice * quantity;
                      return (
                        <div
                          key={dish.id}
                          className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-between gap-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">{dish.name}</h4>
                            <p className="text-[10px] text-zinc-400 font-mono">
                              {dish.price} cad. • Subtotale:{' '}
                              <span style={{ color: canvaAccent }} className="font-bold">
                                {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(subtotal)}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => removeFromTableCart(dish.id)}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-95 transition-all"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold font-mono text-white">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToTableCart(dish)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-95 transition-all"
                              style={{ backgroundColor: canvaAccent, color: canvaContrastText }}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDishEntirelyFromCart(dish.id)}
                              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center active:scale-95 ml-1 transition-all"
                              title="Rimuovi"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Notes field */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-300 block">
                    {t.kitchenNotes}:
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder={t.kitchenNotesPlaceholder}
                    rows={2}
                    className="w-full bg-[#181b19] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 resize-none"
                  />
                </div>

                {orderErrorMessage && (
                  <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{orderErrorMessage}</span>
                  </div>
                )}

                {/* Total & Action */}
                <div className="pt-2 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">{t.total}:</span>
                    <span className="text-base font-extrabold font-mono" style={{ color: canvaAccent }}>
                      {formattedTotal}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSendOrder}
                      disabled={orderSending || cartItems.length === 0}
                      className="flex-1 min-h-[44px] font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: canvaAccent,
                        color: canvaContrastText,
                        boxShadow: `0 4px 18px ${canvaAccent}40`,
                      }}
                    >
                      {orderSending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          <span>Invio in corso...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{t.sendOrderToCashier}</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        hapticTap();
                        setShowOrderModal(false);
                      }}
                      className="px-4 min-h-[44px] bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-colors"
                    >
                      {t.close}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setShowOrderModal(false);
                      setShowBillInvoiceModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Chiedi il Conto / Dividi Spesa / Fattura Elettronica</span>
                  </button>
                </div>
              </>
            )}
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
                onClick={() => {
                  hapticTap();
                  setShowContactModal(false);
                }}
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
                    <WhatsAppIcon className="w-4 h-4" color="#25D366" />
                    <div>
                      <span className="font-bold text-white block">Chat WhatsApp</span>
                      <span className="text-[10px] text-zinc-400">Messaggio rapido al locale</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold group-hover:underline">Chat</span>
                </a>
              )}

              {/* Instagram Option */}
              {org.instagram_url && (
                <a
                  href={org.instagram_url.startsWith('http') ? org.instagram_url : `https://instagram.com/${org.instagram_url.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl bg-pink-500/10 hover:bg-pink-500/15 border border-pink-500/20 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <InstagramIcon className="w-4 h-4" color="#E1306C" />
                    <div>
                      <span className="font-bold text-white block">Profilo Instagram</span>
                      <span className="text-[10px] text-zinc-400">Seguici per storie e foto</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-pink-400 font-bold group-hover:underline">Apri</span>
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
              onClick={() => {
                hapticTap();
                setShowContactModal(false);
              }}
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
                onClick={() => {
                  hapticTap();
                  setShowCityGuide(false);
                }}
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
              onClick={() => {
                hapticTap();
                setShowCityGuide(false);
              }}
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
                onClick={() => {
                  hapticTap();
                  setActiveCustomModal(null);
                }}
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
              onClick={() => {
                hapticTap();
                setActiveCustomModal(null);
              }}
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

      {/* ========================================================================= */}
      {/* FLOATING DYNAMIC UPSELLING BANNER */}
      {/* ========================================================================= */}
      {upsellSuggestion && (
        <div className="fixed bottom-24 inset-x-4 max-w-sm mx-auto z-40 animate-slide-up pointer-events-auto">
          <div className="p-3.5 rounded-2xl bg-zinc-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">
                  Suggerimento dello Chef:
                </span>
                <p className="text-xs font-bold truncate">
                  {upsellSuggestion.dish.name} ({upsellSuggestion.dish.price})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  addToTableCart(upsellSuggestion.dish);
                  setUpsellSuggestion(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition-all active:scale-95 cursor-pointer shadow"
              >
                + Aggiungi
              </button>
              <button
                type="button"
                onClick={() => setUpsellSuggestion(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AI SOMMELIER & WINE PAIRING */}
      {/* ========================================================================= */}
      {showWinePairingModal && pairingDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#141615] border border-purple-500/30 rounded-3xl p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                  <Wine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Sommelier Virtuale AI</span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </h3>
                  <p className="text-[10px] text-zinc-400">Abbinamento per: {pairingDish.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWinePairingModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {winePairingLoading ? (
              <div className="py-10 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <p className="text-xs text-zinc-300">
                  Il sommelier sta selezionando l&apos;abbinamento perfetto per &quot;{pairingDish.name}&quot;...
                </p>
              </div>
            ) : winePairingResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                        {winePairingResult.winePairing.type} • {winePairingResult.winePairing.region}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {winePairingResult.winePairing.name}
                      </h4>
                    </div>
                    <span className="text-xs font-extrabold font-mono text-amber-400 shrink-0">
                      {winePairingResult.winePairing.priceEstimate}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-300 leading-relaxed italic">
                    &quot;{winePairingResult.winePairing.tastingNotes}&quot;
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <strong className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Perché si abbina:
                  </strong>
                  <p className="text-[11px] text-zinc-200 leading-relaxed">
                    {winePairingResult.winePairing.whyItWorks}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      hapticSuccess();
                      addToTableCart({
                        id: `wine-${Date.now()}`,
                        name: winePairingResult.winePairing.name,
                        description: `${winePairingResult.winePairing.type} • ${winePairingResult.winePairing.region}`,
                        price: winePairingResult.winePairing.priceEstimate,
                        tags: ['Carta Vini', winePairingResult.winePairing.type],
                      });
                      setShowWinePairingModal(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi Calice/Bottiglia al Vassoio</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AI VOICE-TO-CART ORDERING */}
      {/* ========================================================================= */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#141715] border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-center text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                <Mic className="w-3.5 h-3.5 animate-pulse" />
                <span>Comanda Vocale AI</span>
              </span>
              <button
                type="button"
                onClick={() => setShowVoiceModal(false)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pulsing Mic Graphic */}
            <div className="relative py-4 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-purple-500/20 animate-ping absolute inset-0 m-auto" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg relative z-10">
                <Mic className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {isVoiceListening ? 'Ti sto ascoltando...' : 'Elaborazione comanda...'}
              </h3>
              <p className="text-xs text-zinc-400">
                Parla liberamente, ad esempio: <br />
                <span className="text-purple-300 font-semibold italic">
                  &quot;Due margherite e una tagliata di manzo&quot;
                </span>
              </p>
            </div>

            {/* Live Transcript Display */}
            {voiceLiveTranscript && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-purple-200">
                &quot;{voiceLiveTranscript}&quot;
              </div>
            )}

            {/* Feedback / Added Toast */}
            {voiceFeedbackToast && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fade-in">
                {voiceFeedbackToast}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowVoiceModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AI IN-DINING REVIEW SHIELD */}
      {/* ========================================================================= */}
      {showInDiningShieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#171918] border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ci dispiace molto!</h3>
                  <p className="text-[10px] text-zinc-400">Risolviamo subito al tuo tavolo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInDiningShieldModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inDiningSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Segnalazione inviata al Maître!</h4>
                <p className="text-xs text-zinc-300">
                  Un responsabile dello staff sta arrivando subito al vostro tavolo per assistervi. Grazie per avercelo detto!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Vogliamo che la tua esperienza da <strong>{org.name}</strong> sia perfetta. Dicci cosa non è andato (es. piatto freddo, cottura o tempi d&apos;attesa):
                </p>

                <textarea
                  rows={3}
                  value={inDiningFeedbackText}
                  onChange={(e) => setInDiningFeedbackText(e.target.value)}
                  placeholder="Es. La carne è troppo cotta / Stiamo aspettando da molto..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 resize-none"
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowInDiningShieldModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-semibold cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    disabled={inDiningSending}
                    onClick={handleSendInDiningReviewAlert}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {inDiningSending ? (
                      <span>Invio in corso...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Allerta Staff al Tavolo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SMART BILL & ELECTRONIC INVOICE MODAL (FEATURE 3: POS/RESTO & ALLA ROMANA) */}
      {/* ========================================================================= */}
      {org && (
        <SmartBillModal
          isOpen={showBillInvoiceModal}
          onClose={() => setShowBillInvoiceModal(false)}
          organizationId={org.id}
          deviceId={device?.id}
          tableLabel={device?.name || `Tavolo ${code}`}
          estimatedTotal={formattedTotal}
        />
      )}

    </div>
  );
}

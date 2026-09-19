'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Smartphone,
  Palette,
  Sparkles,
  UtensilsCrossed,
  BellRing,
  Wifi,
  Wine,
  CreditCard,
  Star,
  ExternalLink,
  Upload,
  Link2,
  Check,
  Loader2,
  Phone,
  MessageCircle,
  Clock,
  ShieldCheck,
  Eye,
  RotateCcw,
  Save,
  CheckCircle2,
  ArrowUpRight,
  Info,
  Radio,
  Image as ImageIcon,
  Send,
  Sliders,
  ChevronUp,
  ChevronDown,
  Compass,
  Flame,
  Globe,
  Plus,
  Trash2,
  HelpCircle,
  Heart,
  Camera,
  Coffee,
  Music,
  Ticket,
  ShoppingBag,
  Wand2,
  AlertTriangle,
  Grid,
  Maximize2,
  Minimize2,
  X,
  CalendarCheck,
  Layers,
  Type,
  Zap,
  Share2,
  Search,
  ArrowLeft,
  Crown,
  Building,
  Printer,
} from 'lucide-react';
import TableStandPrintModal from '@/components/TableStandPrintModal';
import { WhatsAppIcon, InstagramIcon } from '@/components/brand-icons';
import {
  CommunityHubTemplate,
  getCommunityHubTemplates,
  shareHubToCatalog,
} from '@/lib/community-catalog';
import { HUB_COLOR_PRESETS, DEFAULT_HUB_COLOR, getContrastColor } from '@/lib/palettes';
import { BusinessCategory } from '@/lib/types';
import { getCategoryDefinition } from '@/lib/categories';
import {
  HUB_FONT_OPTIONS,
  HUB_THEME_OPTIONS,
  HUB_CARD_STYLE_OPTIONS,
  getDefaultHubConfig,
  mergeHubConfig,
  getDefaultModules,
  resetToDefaultHubConfig,
  HubConfig,
  HubModuleConfig,
  WifiBridgeConfig,
  generateWifiQrPayload,
  HubFontFamily,
  HubThemeMode,
  HubCardStyle,
  HubModuleId,
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

interface DeviceOption {
  id: string;
  name: string;
  unique_code: string;
}

type StudioTab = 'theme' | 'atmosphere' | 'modules' | 'hero' | 'services' | 'reviews' | 'contacts';

export default function CustomHubStudioPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Business ID & Active Devices
  const [orgId, setOrgId] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [selectedDeviceCode, setSelectedDeviceCode] = useState<string>('');

  // Business Profile Info
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('restaurant');

  // Unified Hub Configuration State
  const [hubConfig, setHubConfig] = useState<HubConfig>(() => getDefaultHubConfig('restaurant'));

  // Reset to Original Safety Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Add Custom Module Modal State
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customBadge, setCustomBadge] = useState('');
  const [customIconName, setCustomIconName] = useState('Sparkles');
  const [customActionType, setCustomActionType] = useState<'link' | 'modal'>('link');
  const [customUrl, setCustomUrl] = useState('');
  const [customModalTitle, setCustomModalTitle] = useState('');
  const [customModalContent, setCustomModalContent] = useState('');
  const [customColSpan, setCustomColSpan] = useState<1 | 2>(1);

  // AI Brand Architect Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [conceptExplanation, setConceptExplanation] = useState<string>('');

  // Community Hub Catalog State
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showShareCatalogModal, setShowShareCatalogModal] = useState(false);
  const [catalogTemplates, setCatalogTemplates] = useState<CommunityHubTemplate[]>(() => getCommunityHubTemplates());
  const [catalogFilter, setCatalogFilter] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogAppliedToast, setCatalogAppliedToast] = useState<string | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<CommunityHubTemplate | null>(null);
  const [previewModuleToast, setPreviewModuleToast] = useState<string | null>(null);

  // Table Stand & NFC Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Share to Catalog Form State
  const [shareTplName, setShareTplName] = useState('');
  const [shareTplAuthor, setShareTplAuthor] = useState('');
  const [shareTplStyle, setShareTplStyle] = useState('Luxury & Fine Dining');
  const [shareTplDesc, setShareTplDesc] = useState('');
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [shareSuccessToast, setShareSuccessToast] = useState(false);

  const handleApplyTemplate = (tpl: CommunityHubTemplate) => {
    hapticSuccess();
    setHubConfig(tpl.config);
    setShimmerKey((k) => k + 1);
    setIsShimmering(true);
    setTimeout(() => setIsShimmering(false), 1400);
    setCatalogAppliedToast(`Template "${tpl.name}" applicato! Clicca su "Salva Modifiche" per pubblicarlo.`);
    setTimeout(() => setCatalogAppliedToast(null), 4500);
    setShowCatalogModal(false);
  };

  const handleShareCurrentHub = async () => {
    if (!shareTplName.trim()) return;
    setShareSubmitting(true);
    try {
      const newTpl = await shareHubToCatalog({
        name: shareTplName.trim(),
        author: shareTplAuthor.trim() || name || 'Community Creator',
        category,
        styleTag: shareTplStyle.trim() || 'Signature Experience',
        description: shareTplDesc.trim() || `Design curato da ${name || 'un utente RIVO'}`,
        preview: {
          primaryColor: hubConfig.primaryColor,
          themeMode: hubConfig.themeMode,
          fontFamily: hubConfig.fontFamily,
          cardStyle: hubConfig.cardStyle,
          bgImageUrl: hubConfig.bgImageUrl,
          modulesPreview: hubConfig.modules.filter((m) => m.enabled).map((m) => m.title),
        },
        config: hubConfig,
      });

      setCatalogTemplates((prev) => [newTpl, ...prev]);
      setShareSuccessToast(true);
      setTimeout(() => setShareSuccessToast(false), 3500);
      setShowShareCatalogModal(false);
      setShareTplName('');
      setShareTplDesc('');
    } catch (e) {
      console.error('Error sharing hub to catalog:', e);
    } finally {
      setShareSubmitting(false);
    }
  };

  // Secondary Service Configurations
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [aiMenuContext, setAiMenuContext] = useState('');
  const [loyaltyRewardText, setLoyaltyRewardText] = useState('10% di sconto al 10° timbro');

  // Telegram Staff Alerts
  const [telegramAlertsEnabled, setTelegramAlertsEnabled] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);

  // Review Shield & Promo Banner
  const [reviewShieldEnabled, setReviewShieldEnabled] = useState(true);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [customCtaLabel, setCustomCtaLabel] = useState('');
  const [customCtaUrl, setCustomCtaUrl] = useState('');

  // Contacts
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  // Active Tab & View Mode
  const [activeTab, setActiveTab] = useState<StudioTab>('theme');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [simulatedWifiConnected, setSimulatedWifiConnected] = useState(false);

  // Glass Shimmer Animation for Simulator Mockup
  const [isShimmering, setIsShimmering] = useState(false);
  const [shimmerKey, setShimmerKey] = useState(0);
  const isInitialLoadDone = useRef(false);

  // Mockup NFC Tap Simulator Animation
  const [mockupNfcPhase, setMockupNfcPhase] = useState<'idle' | 'sensing' | 'synced' | 'assembling'>('idle');
  const triggerMockupNfcTap = () => {
    hapticNfcPulse();
    setMockupNfcPhase('sensing');
    setTimeout(() => {
      setMockupNfcPhase('synced');
      hapticSuccess();
      setTimeout(() => {
        setMockupNfcPhase('assembling');
        setTimeout(() => {
          setMockupNfcPhase('idle');
        }, 850);
      }, 450);
    }, 400);
  };

  // Reset Factory Settings to Original Hub with Direct Persistence
  const handleResetToOriginal = async () => {
    if (!orgId) return;
    hapticWarning();
    setResetting(true);
    try {
      const defaultCfg = resetToDefaultHubConfig(category);
      setHubConfig(defaultCfg);

      // Persist to Supabase
      const { error: resetErr } = await supabase
        .from('organizations')
        .update({
          hub_config: defaultCfg,
          primary_color: defaultCfg.primaryColor,
        })
        .eq('id', orgId);

      if (resetErr) throw resetErr;

      setShowResetModal(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore durante il ripristino';
      console.error('Error resetting to original hub:', msg);
      setErrorMsg('Errore durante il ripristino dell\'hub originale.');
    } finally {
      setResetting(false);
    }
  };

  // Add Custom Module Handler
  const handleAddCustomModule = () => {
    if (!customTitle.trim()) return;
    const newModule: HubModuleConfig = {
      id: `custom_${Date.now()}`,
      isCustom: true,
      enabled: true,
      order: hubConfig.modules.length + 1,
      title: customTitle.trim(),
      subtitle: customSubtitle.trim(),
      badge: customBadge.trim() || undefined,
      iconName: customIconName,
      actionType: customActionType,
      customUrl: customActionType === 'link' ? customUrl.trim() : undefined,
      modalTitle: customActionType === 'modal' ? (customModalTitle.trim() || customTitle.trim()) : undefined,
      modalContent: customActionType === 'modal' ? customModalContent.trim() : undefined,
      colSpan: customColSpan,
    };

    setHubConfig((prev) => ({
      ...prev,
      modules: [...prev.modules, newModule],
    }));

    // Reset Form
    setCustomTitle('');
    setCustomSubtitle('');
    setCustomBadge('');
    setCustomIconName('Sparkles');
    setCustomActionType('link');
    setCustomUrl('');
    setCustomModalTitle('');
    setCustomModalContent('');
    setCustomColSpan(1);
    setShowAddCustomModal(false);
  };

  // Delete Custom Module
  const handleDeleteCustomModule = (id: string) => {
    setHubConfig((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== id).map((m, idx) => ({ ...m, order: idx + 1 })),
    }));
  };

  // Toggle Bento ColSpan (1 Col vs 2 Cols)
  const toggleModuleColSpan = (id: string) => {
    setHubConfig((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === id ? { ...m, colSpan: m.colSpan === 2 ? 1 : 2 } : m
      ),
    }));
  };

  // AI Brand Architect Generator with Free Textual Prompt
  const handleGenerateWithAiPrompt = async (promptOverride?: string) => {
    const promptToUse = (promptOverride || aiPrompt).trim();
    if (!promptToUse) return;

    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai/hub-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          businessName: name || 'Il Tuo Locale',
          category: category || 'restaurant',
          currentConfig: hubConfig,
        }),
      });

      const data = await res.json();
      if (data.success && data.config) {
        setHubConfig(data.config);
        setConceptExplanation(data.conceptExplanation || '');
        setShowAiModal(false);
      } else {
        console.error('AI Architect error:', data.error);
      }
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Trigger Glass Shimmer Effect on visual changes
  useEffect(() => {
    if (loading) return;

    if (!isInitialLoadDone.current) {
      isInitialLoadDone.current = true;
      return;
    }

    setIsShimmering(true);
    setShimmerKey((k) => k + 1);
    const timer = setTimeout(() => {
      setIsShimmering(false);
    }, 1400);

    return () => clearTimeout(timer);
  }, [hubConfig.primaryColor, hubConfig.themeMode, hubConfig.fontFamily, hubConfig.cardStyle, logoUrl, loading]);

  // Load Organization & Devices
  useEffect(() => {
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

        // Fetch Organization data
        const { data: org, error: orgErr } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', targetOrgId)
          .single();

        if (orgErr) throw orgErr;

        if (org) {
          setName(org.name || '');
          setLogoUrl(org.logo_url || '');
          setDescription(org.description || '');
          const cat = (org.category || 'restaurant') as BusinessCategory;
          setCategory(cat);

          // Populate complete HubConfig state using mergeHubConfig
          const merged = mergeHubConfig(org.hub_config, cat, {
            primaryColor: org.primary_color,
            customCtaLabel: org.custom_cta_label,
            customCtaUrl: org.custom_cta_url,
            lunchDestinationUrl: org.lunch_destination_url,
          });
          setHubConfig(merged);

          // Services
          const loadedWifiSsid = merged.wifiBridge?.ssid || org.wifi_ssid || '';
          const loadedWifiPassword = merged.wifiBridge?.password || org.wifi_password || '';
          setWifiSsid(loadedWifiSsid);
          setWifiPassword(loadedWifiPassword);
          setAiMenuContext(org.ai_menu_context || '');
          setLoyaltyRewardText(org.loyalty_reward_text || '10% di sconto al 10° timbro');

          // Telegram Staff Alerts
          setTelegramAlertsEnabled(org.telegram_alerts_enabled ?? false);
          setTelegramToken(org.telegram_bot_token || '');
          setTelegramChatId(org.telegram_chat_id || '');

          // Review Shield & Promo
          setReviewShieldEnabled(org.review_shield_enabled ?? true);
          setGoogleReviewUrl(org.google_review_url || '');
          setCustomCtaLabel(org.custom_cta_label || '');
          setCustomCtaUrl(org.custom_cta_url || '');

          // Contacts
          setPhone(org.phone || '');
          setWhatsappNumber(org.whatsapp_number || '');
          setWebsite(org.website || '');
          setInstagramUrl(org.instagram_url || '');
        }

        // Fetch active devices for this org
        const { data: devList } = await supabase
          .from('devices')
          .select('id, name, unique_code')
          .eq('organization_id', targetOrgId)
          .eq('status', 'active')
          .order('created_at', { ascending: true });

        if (devList && devList.length > 0) {
          setDevices(devList);
          setSelectedDeviceCode(devList[0].unique_code);
        }
      } catch (err) {
        console.error('Error loading Custom Hub data:', err);
        setErrorMsg('Impossibile caricare le configurazioni del Custom Hub');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Il file supera i 5MB. Scegli un\'immagine più leggera.');
      return;
    }

    setUploadingLogo(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orgId', orgId);

      const res = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante il caricamento');

      const uploadedUrl = data.logoUrl || data.url || '';
      setLogoUrl(uploadedUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore upload logo';
      setErrorMsg(msg);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Save All Custom Hub Settings Atomically
  const handleSave = async () => {
    if (!orgId) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const currentHubConfig: HubConfig = {
        ...hubConfig,
        primaryColor: hubConfig.primaryColor || DEFAULT_HUB_COLOR,
        tableBadgeLabel: (hubConfig.tableBadgeLabel || 'Tavolo Connesso').trim(),
        tableLiveTag: (hubConfig.tableLiveTag || 'NFC LIVE').trim(),
        hero: {
          ...hubConfig.hero,
          title: (hubConfig.hero.title || 'Menù Digitale').trim(),
          subtitle: (hubConfig.hero.subtitle || '').trim(),
          badgeText: (hubConfig.hero.badgeText || 'In Evidenza').trim(),
          destinationType: hubConfig.hero.destinationType,
          externalUrl: hubConfig.hero.destinationType === 'external' ? (hubConfig.hero.externalUrl || '').trim() : undefined,
        },
        modules: hubConfig.modules.map((m, i) => ({
          ...m,
          order: i + 1,
          title: (m.title || '').trim(),
          subtitle: (m.subtitle || '').trim(),
          badge: (m.badge || '').trim(),
          customUrl: (m.customUrl || '').trim(),
        })),
        wifiBridge: {
          enabled: Boolean(hubConfig.wifiBridge?.enabled),
          ssid: (hubConfig.wifiBridge?.ssid || wifiSsid || '').trim(),
          password: (hubConfig.wifiBridge?.password || wifiPassword || '').trim(),
          securityType: hubConfig.wifiBridge?.securityType || 'WPA',
          welcomeNotice: (hubConfig.wifiBridge?.welcomeNotice || '').trim(),
        },
      };

      const { error } = await supabase
        .from('organizations')
        .update({
          name: (name || '').trim(),
          logo_url: (logoUrl || '').trim() || null,
          description: (description || '').trim() || null,
          hub_config: currentHubConfig,
          primary_color: currentHubConfig.primaryColor,
          custom_cta_label: currentHubConfig.hero.title || null,
          custom_cta_url: (customCtaUrl || '').trim() || null,
          lunch_destination_url:
            currentHubConfig.hero.destinationType === 'external'
              ? (currentHubConfig.hero.externalUrl || '').trim() || null
              : null,
          wifi_ssid: (currentHubConfig.wifiBridge?.ssid || wifiSsid || '').trim() || null,
          wifi_password: (currentHubConfig.wifiBridge?.password || wifiPassword || '').trim() || null,
          ai_menu_context: (aiMenuContext || '').trim() || null,
          loyalty_reward_text: (loyaltyRewardText || '').trim() || null,
          telegram_alerts_enabled: Boolean(telegramAlertsEnabled),
          telegram_bot_token: (telegramToken || '').trim() || null,
          telegram_chat_id: (telegramChatId || '').trim() || null,
          review_shield_enabled: Boolean(reviewShieldEnabled),
          google_review_url: (googleReviewUrl || '').trim() || null,
          phone: (phone || '').trim() || null,
          whatsapp_number: (whatsappNumber || '').trim() || null,
          website: (website || '').trim() || null,
          instagram_url: (instagramUrl || '').trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId);

      if (error) throw error;

      hapticSuccess();
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore durante il salvataggio';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  // Test Telegram Bot
  const handleTestTelegram = async () => {
    if (!telegramToken?.trim() || !telegramChatId?.trim()) {
      setErrorMsg('Inserisci sia il Bot Token sia il Chat ID prima di inviare un test.');
      return;
    }

    setTestSending(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`https://api.telegram.org/bot${(telegramToken || '').trim()}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: (telegramChatId || '').trim(),
          text: `[TEST NOTIFICA RIVO STAFF]\n\n• Locale: ${name || 'La tua attività'}\n• Stato: Connessione Bot Telegram attiva con successo!\n• Chiamate Cameriere: Pronte a essere ricevute in tempo reale.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.description || 'Errore invio messaggio Telegram');

      setTestSentSuccess(true);
      setTimeout(() => setTestSentSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore Telegram';
      setErrorMsg(msg);
    } finally {
      setTestSending(false);
    }
  };

  // Module Reordering & Toggle Helpers
  const moveModule = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= hubConfig.modules.length) return;

    setHubConfig((prev) => {
      const newModules = [...prev.modules];
      const temp = newModules[index];
      newModules[index] = newModules[targetIndex];
      newModules[targetIndex] = temp;
      return {
        ...prev,
        modules: newModules.map((m, idx) => ({ ...m, order: idx + 1 })),
      };
    });
  };

  const toggleModule = (id: HubModuleId) => {
    setHubConfig((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === id ? { ...m, enabled: !m.enabled } : m
      ),
    }));
  };

  const updateModuleField = (
    id: HubModuleId,
    field: 'title' | 'subtitle' | 'badge' | 'customUrl',
    val: string
  ) => {
    setHubConfig((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === id ? { ...m, [field]: val } : m
      ),
    }));
  };

  const resetModulesToDefault = () => {
    setHubConfig((prev) => ({
      ...prev,
      modules: getDefaultModules(category),
    }));
  };

  // Active theme, font, card style resolvers
  const activeFont = useMemo(
    () => HUB_FONT_OPTIONS.find((f) => f.id === hubConfig.fontFamily) || HUB_FONT_OPTIONS[0],
    [hubConfig.fontFamily]
  );

  const activeTheme = useMemo(
    () => HUB_THEME_OPTIONS.find((t) => t.id === hubConfig.themeMode) || HUB_THEME_OPTIONS[0],
    [hubConfig.themeMode]
  );

  const activeCardStyle = useMemo(
    () => HUB_CARD_STYLE_OPTIONS.find((s) => s.id === hubConfig.cardStyle) || HUB_CARD_STYLE_OPTIONS[0],
    [hubConfig.cardStyle]
  );

  const isLight = hubConfig.themeMode === 'minimal_light';
  const contrastText = getContrastColor(hubConfig.primaryColor);
  const catDef = getCategoryDefinition(category);
  const CatIcon = catDef.icon;

  // Active visible modules count
  const activeModulesCount = useMemo(
    () => hubConfig.modules.filter((m) => m.enabled).length,
    [hubConfig.modules]
  );

  // Helper for Lucide module icon
  const getModuleIcon = (id: HubModuleId, iconName?: string) => {
    if (iconName) {
      switch (iconName) {
        case 'Wine': return Wine;
        case 'Coffee': return Coffee;
        case 'Music': return Music;
        case 'Ticket': return Ticket;
        case 'ShoppingBag': return ShoppingBag;
        case 'Camera': return Camera;
        case 'Heart': return Heart;
        case 'HelpCircle': return HelpCircle;
        case 'Globe': return Globe;
        case 'CalendarCheck': return CalendarCheck;
        case 'UtensilsCrossed': return UtensilsCrossed;
        case 'WhatsApp': return WhatsAppIcon;
        case 'Instagram': return InstagramIcon;
        case 'Sparkles':
        default:
          return Sparkles;
      }
    }
    switch (id) {
      case 'menu':
        return UtensilsCrossed;
      case 'service':
        return BellRing;
      case 'sommelier':
        return Wine;
      case 'wifi':
        return Wifi;
      case 'wheel':
        return Sparkles;
      case 'loyalty':
        return CreditCard;
      case 'reviews':
        return Star;
      case 'guide':
        return Compass;
      case 'instagram':
        return InstagramIcon;
      case 'whatsapp':
        return WhatsAppIcon;
      case 'custom_cta':
      default:
        return ArrowUpRight;
    }
  };

  // Card style classes generator for phone preview
  const getCardStyleClass = () => {
    switch (hubConfig.cardStyle) {
      case 'solid':
        return isLight
          ? 'bg-white border border-slate-200/90 shadow-sm text-slate-900'
          : 'bg-[#161816] border border-white/10 shadow-md text-white';
      case 'bordered':
        return isLight
          ? 'bg-white/80 border-2 border-slate-300 shadow text-slate-900'
          : 'bg-[#121413] border-2 border-white/20 shadow text-white';
      case 'neon':
        return isLight
          ? 'bg-white border border-slate-300 shadow-sm text-slate-900'
          : 'bg-[#141715] border border-white/15 text-white';
      case 'glass':
      default:
        return isLight
          ? 'backdrop-blur-md bg-white/70 border border-slate-200/80 shadow text-slate-900'
          : 'backdrop-blur-md bg-white/[0.05] border border-white/10 shadow text-white';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#BFFF00]/10 text-[#BFFF00] border border-[#BFFF00]/25">
              NFC & QR Experience
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-xs text-zinc-400">Live Editor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Smartphone className="w-7 h-7 text-[#BFFF00]" />
            <span>Custom Hub Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Personalizza l&apos;interfaccia mobile che i tuoi clienti vedono istantaneamente al tap del chip NFC o scansione QR al tavolo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Community Hub Catalog Trigger */}
          <button
            type="button"
            onClick={() => setShowCatalogModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/25 transition-all active:scale-95 touch-press shadow-sm cursor-pointer"
            title="Sfoglia il catalogo di Hub d'autore pronti all'uso o condividi il tuo"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Catalogo Hub</span>
          </button>

          {/* Share to Catalog Trigger */}
          <button
            type="button"
            onClick={() => {
              setShareTplName(`${name || 'Locale'} Signature`);
              setShareTplAuthor(name || 'Creatore RIVO');
              setShowShareCatalogModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/25 transition-all active:scale-95 touch-press shadow-sm cursor-pointer"
            title="Condividi il design del tuo Hub nel catalogo pubblico"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Condividi Hub</span>
          </button>

          {/* AI Brand Architect Trigger */}
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/25 transition-all active:scale-95 touch-press shadow-sm cursor-pointer"
            title="Genera il tema e i testi ideali con un prompt libero con l'AI"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">AI Architect</span>
          </button>

          {/* Table Stand & NFC Print Trigger */}
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/25 transition-all active:scale-95 touch-press shadow-sm cursor-pointer"
            title="Stampa stand da tavolo in plexiglass e adesivi NFC personalizzati"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Stampa Stand NFC</span>
          </button>

          {/* Reset to Original Hub Trigger */}
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all active:scale-95 touch-press shadow-sm cursor-pointer"
            title="Ripristina l'Hub originale di fabbrica con le dovute conferme"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ripristina Hub</span>
          </button>

          {selectedDeviceCode && (
            <a
              href={`/hub/${selectedDeviceCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700 transition-all active:scale-95 touch-press shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Apri Hub Reale</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#BFFF00] hover:bg-[#a8e000] text-black font-extrabold text-xs shadow-lg shadow-[#BFFF00]/20 transition-all active:scale-95 disabled:opacity-50 touch-press cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Salvato!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salva Modifiche</span>
              </>
            )}
          </button>
        </div>
      </div>

      {catalogAppliedToast && (
        <div className="p-4 bg-sky-500/15 border border-sky-500/30 text-sky-200 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-lg">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{catalogAppliedToast}</span>
        </div>
      )}

      {shareSuccessToast && (
        <div className="p-4 bg-amber-500/15 border border-amber-500/30 text-amber-200 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Il tuo Hub è stato pubblicato con successo nel Catalogo della Community ed è ora accessibile a tutti!</span>
        </div>
      )}

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Le personalizzazioni del tuo Custom Hub sono state salvate e sono attive in tempo reale su tutti i chip NFC e codici QR!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-2xl text-xs font-semibold animate-fade-in">
          {errorMsg}
        </div>
      )}

      {/* Mobile Mode Switcher (< lg screens) */}
      <div className="lg:hidden flex items-center p-1 bg-[#121214] border border-white/10 rounded-2xl w-full max-w-sm mx-auto shadow-lg mb-2">
        <button
          type="button"
          onClick={() => {
            hapticSelection();
            setMobileView('editor');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            mobileView === 'editor'
              ? 'bg-[#18181B] text-[#BFFF00] shadow border border-white/10'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Editor & Controlli</span>
        </button>
        <button
          type="button"
          onClick={() => {
            hapticSelection();
            setMobileView('preview');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            mobileView === 'preview'
              ? 'bg-[#18181B] text-[#BFFF00] shadow border border-white/10'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Anteprima Live Hub</span>
        </button>
      </div>

      {/* Main Studio Grid: Controls (Left) & Live Smartphone Mockup (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: CONTROLS & CUSTOMIZATION FORMS */}
        {/* ========================================================================= */}
        <div className={`lg:col-span-7 space-y-4 ${mobileView === 'preview' ? 'hidden lg:block' : 'block'}`}>
          
          {/* AI Concept Explanation Banner */}
          {conceptExplanation && (
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3 text-purple-200 text-xs animate-fade-in shadow-lg">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px] uppercase tracking-wider">Concept Visivo AI</span>
                  <button
                    type="button"
                    onClick={() => setConceptExplanation('')}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-zinc-300 leading-relaxed text-[11px]">{conceptExplanation}</p>
              </div>
            </div>
          )}

          {/* Studio Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-[#121214] border border-white/10 rounded-2xl overflow-x-auto scrollbar-none snap-x snap-mandatory touch-pan-x">
            {[
              { id: 'theme', label: 'Stile & Font', icon: Palette },
              { id: 'atmosphere', label: 'Sfondo & Texture', icon: Layers },
              { id: 'modules', label: 'Moduli & Bento Grid', icon: Sliders },
              { id: 'hero', label: 'Hero & Badge', icon: Sparkles },
              { id: 'services', label: 'Servizi Tavolo', icon: UtensilsCrossed },
              { id: 'reviews', label: 'Recensioni & Promo', icon: Star },
              { id: 'contacts', label: 'Contatti & Info', icon: Phone },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    hapticSelection();
                    setActiveTab(tab.id as StudioTab);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 snap-start transition-all min-h-[44px] touch-press active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-[#1c1d20] text-[#BFFF00] shadow-md border border-[#BFFF00]/30 ring-1 ring-[#BFFF00]/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ======================================================================= */}
          {/* TAB 1: ASPETTO & FONT (Font, Tema di Sfondo, Stile Card, Palette) */}
          {/* ======================================================================= */}
          {activeTab === 'theme' && (
            <div className="rounded-3xl border border-white/10 bg-[#121413] p-5 sm:p-6 space-y-6 shadow-xl animate-fade-in">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[#BFFF00]" />
                  <span>Tipografia, Stile Card & Palette</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Personalizza la firma visiva del tuo locale: font iconico, tema e contrasti ad alta leggibilità.
                </p>
              </div>

              {/* 1. SELETTORE FONT TIPOGRAFICO */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-[#BFFF00]" />
                    <span>Carattere Tipografico (Font)</span>
                  </label>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Attuale: <strong className="text-white">{activeFont.name}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Scegli il font principale che valorizza l&apos;identità del tuo locale: moderno, minimal, gourmet o tradizionale.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {HUB_FONT_OPTIONS.map((f) => {
                    const isSelected = hubConfig.fontFamily === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          hapticSelection();
                          setHubConfig((prev) => ({ ...prev, fontFamily: f.id }));
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative touch-press active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? 'bg-white/10 border-[#BFFF00] shadow-lg ring-1 ring-[#BFFF00]/40'
                            : 'bg-[#181b19] border-white/5 hover:border-white/20 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white">{f.name}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 font-mono">
                            {f.category}
                          </span>
                        </div>
                        <div
                          className="text-sm font-semibold truncate text-zinc-200 mt-1"
                          style={{ fontFamily: f.cssFamily }}
                        >
                          {f.sample}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#BFFF00] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. SELETTORE TEMA DI SFONDO */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>Tema & Atmosfera di Sfondo</span>
                  </label>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Attuale: <strong className="text-white">{activeTheme.name}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Imposta il mood cromatico dello sfondo dell&apos;Hub e delle aree circostanti.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {HUB_THEME_OPTIONS.map((t) => {
                    const isSelected = hubConfig.themeMode === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          hapticSelection();
                          setHubConfig((prev) => ({ ...prev, themeMode: t.id }));
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all relative touch-press active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-white/10 border-white shadow-xl ring-2 ring-white/30'
                            : 'bg-[#181b19] border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="w-full h-10 rounded-xl mb-2 flex items-center justify-center border border-white/10 relative overflow-hidden" style={{ backgroundColor: t.bgHex }}>
                          <div className="w-8 h-5 rounded-md border border-white/15" style={{ backgroundColor: t.cardBgHex }} />
                          {isSelected && (
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                              <Check className="w-4 h-4 text-white stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-bold text-white block truncate">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. SELETTORE STILE CARD */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Stile & Finitura delle Card</span>
                  </label>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Attuale: <strong className="text-white">{activeCardStyle.name}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Determina il trattamento dei riquadri: vetro satinato moderno, sfondo pieno scuro, bordo geometrico o bagliore neon.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {HUB_CARD_STYLE_OPTIONS.map((s) => {
                    const isSelected = hubConfig.cardStyle === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          hapticSelection();
                          setHubConfig((prev) => ({ ...prev, cardStyle: s.id }));
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative touch-press active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? 'bg-white/10 border-white shadow-xl ring-2 ring-white/30'
                            : 'bg-[#181b19] border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{s.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#BFFF00] stroke-[3]" />}
                        </div>
                        <p className="text-[11px] text-zinc-400 mb-2.5">{s.description}</p>
                        <div className={`py-1.5 px-3 rounded-xl text-[10px] font-semibold text-zinc-300 ${s.previewClass}`}>
                          Anteprima: Tasto Servizio
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. PALETTE COLORI + INPUT HEX */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Palette className="w-4 h-4" style={{ color: hubConfig.primaryColor }} />
                  <span>Colore Primario di Accento</span>
                </label>
                <p className="text-[11px] text-zinc-400">
                  Illumina il pulsante hero, le icone attive, il tasto centrale del cameriere e i bagliori d&apos;atmosfera.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {HUB_COLOR_PRESETS.map((p) => {
                    const isSelected = hubConfig.primaryColor.toUpperCase() === p.primary.toUpperCase();
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          hapticSelection();
                          setHubConfig((prev) => ({ ...prev, primaryColor: p.primary }));
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all duration-200 relative touch-press active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-white/10 border-white text-white shadow-xl ring-2 ring-white/40 scale-[1.02]'
                            : 'bg-[#181b19] border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className="w-6 h-6 rounded-full border border-white/20 shadow-md flex items-center justify-center"
                            style={{ backgroundColor: p.primary }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                        <span className="text-[10px] text-zinc-500 block truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Hex & Picker */}
                <div className="p-3.5 rounded-2xl bg-[#181b19] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block">Colore Brand Personalizzato</span>
                    <span className="text-[11px] text-zinc-400">Codice HEX esatto del tuo logo o brand</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={hubConfig.primaryColor.startsWith('#') ? hubConfig.primaryColor : '#BFFF00'}
                      onChange={(e) => setHubConfig((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={hubConfig.primaryColor}
                      onChange={(e) => setHubConfig((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#BFFF00"
                      className="w-28 min-h-[38px] bg-[#121214] border border-white/10 rounded-xl px-3 text-xs text-white font-mono uppercase focus:outline-none focus:border-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5. IDENTITÀ & LOGO DEL LOCALE */}
              <div className="pt-3 border-t border-white/5 space-y-4">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Identità del Locale & Logo</span>
                </h3>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="shrink-0 relative group">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt="Logo"
                        onError={() => console.warn('Logo image failed to load:', logoUrl)}
                        className="w-16 h-16 rounded-full object-cover border-2 shadow-lg bg-black transition-all"
                        style={{ borderColor: hubConfig.primaryColor }}
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg text-black transition-all"
                        style={{ backgroundColor: hubConfig.primaryColor }}
                      >
                        <CatIcon className="w-8 h-8" style={{ color: contrastText }} />
                      </div>
                    )}
                    {logoUrl && (
                      <span
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#121413] flex items-center justify-center shadow"
                        title="Logo attivo"
                      >
                        <Check className="w-3 h-3 text-black stroke-[3]" />
                      </span>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/75 rounded-full flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#BFFF00] hover:bg-[#a8e000] text-black font-bold text-xs shadow-md transition-all active:scale-95">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingLogo ? 'Caricamento...' : 'Carica Nuovo Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Link URL</span>
                      </button>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors"
                        >
                          Rimuovi
                        </button>
                      )}
                    </div>

                    {showUrlInput && (
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://.../logo.png"
                        className="w-full min-h-[38px] bg-[#18181B] border border-white/10 rounded-xl px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Attività</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Descrizione / Slogan</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="es. Cucina Tradizionale & Cocktail Bar"
                      className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 2: SFONDO, TEXTURE & ATMOSFERA */}
          {/* ======================================================================= */}
          {activeTab === 'atmosphere' && (
            <div className="rounded-3xl border border-white/10 bg-[#121413] p-5 sm:p-6 space-y-6 shadow-xl animate-fade-in">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#BFFF00]" />
                  <span>Sfondo & Atmosfera Visiva</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Scegli se usare i colori minimali del tema, un&apos;immagine reale del tuo locale o una texture materica di prestigio.
                </p>
              </div>

              {/* Background Type Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'theme', label: 'Colore Pieno / Tema', desc: 'Sfondo minimale a tinta scura o chiara' },
                  { id: 'image', label: 'Foto / Texture Locale', desc: 'Immagine del locale o texture con blur' },
                  { id: 'gradient', label: 'Gradiente Mesh Neon', desc: 'Onda sfumata dinamica bicolore' },
                ].map((typeOption) => {
                  const isSelected = (hubConfig.bgType || 'theme') === typeOption.id;
                  return (
                    <button
                      key={typeOption.id}
                      type="button"
                      onClick={() => setHubConfig((prev) => ({ ...prev, bgType: typeOption.id as 'theme' | 'image' | 'gradient' }))}
                      className={`p-3.5 rounded-2xl border text-left transition-all touch-press active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-white/10 border-white shadow-lg ring-2 ring-white/20'
                          : 'bg-[#181b19] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{typeOption.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#BFFF00] stroke-[3]" />}
                      </div>
                      <span className="text-[10px] text-zinc-400 block">{typeOption.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Image / Texture Controls */}
              {hubConfig.bgType === 'image' && (
                <div className="p-4 rounded-2xl bg-[#181b19] border border-white/10 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white mb-1.5">
                      Texture Rapide ad Alta Definizione
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Marmo Noir', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80' },
                        { label: 'Legno Noce Caldo', url: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=1200&q=80' },
                        { label: 'Ardesia Pietra', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80' },
                        { label: 'Cemento Minimal', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80' },
                      ].map((tex) => (
                        <button
                          key={tex.label}
                          type="button"
                          onClick={() => setHubConfig((prev) => ({ ...prev, bgImageUrl: tex.url }))}
                          className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all ${
                            hubConfig.bgImageUrl === tex.url
                              ? 'bg-white/15 border-white text-[#BFFF00]'
                              : 'bg-black/30 border-white/10 text-zinc-300 hover:text-white'
                          }`}
                        >
                          {tex.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Oppure inserisci URL Immagine / Foto del Locale
                    </label>
                    <input
                      type="url"
                      value={hubConfig.bgImageUrl || ''}
                      onChange={(e) => setHubConfig((prev) => ({ ...prev, bgImageUrl: e.target.value }))}
                      placeholder="https://images.unsplash.com/... o link alla tua foto"
                      className="w-full min-h-[40px] bg-[#121214] border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-white font-mono"
                    />
                  </div>

                  {/* Sliders: Blur & Overlay Opacity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-zinc-300">Sfocatura Sfondo (Blur)</span>
                        <span className="font-mono text-[#BFFF00]">{hubConfig.bgBlur ?? 8}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={hubConfig.bgBlur ?? 8}
                        onChange={(e) => setHubConfig((prev) => ({ ...prev, bgBlur: Number(e.target.value) }))}
                        className="w-full accent-[#BFFF00] cursor-pointer"
                      />
                      <span className="text-[10px] text-zinc-500">Mantiene l&apos;attenzione totale sulle card</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-zinc-300">Filtro Scuro Protettivo</span>
                        <span className="font-mono text-[#BFFF00]">{hubConfig.bgOverlayOpacity ?? 50}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        value={hubConfig.bgOverlayOpacity ?? 50}
                        onChange={(e) => setHubConfig((prev) => ({ ...prev, bgOverlayOpacity: Number(e.target.value) }))}
                        className="w-full accent-[#BFFF00] cursor-pointer"
                      />
                      <span className="text-[10px] text-zinc-500">Garantisce leggibilità e contrasto perfetto WCAG</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Border Radius Setting */}
              <div className="pt-2 border-t border-white/5">
                <label className="block text-xs font-bold text-white mb-2">
                  Raggio dei Bordi delle Card (Geometria)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'none', label: 'Squadrato', r: 'rounded-none' },
                    { id: 'md', label: 'Morbido', r: 'rounded-xl' },
                    { id: '2xl', label: 'Moderno (2XL)', r: 'rounded-2xl' },
                    { id: '3xl', label: 'Accogliente (3XL)', r: 'rounded-3xl' },
                    { id: 'full', label: 'Pillola', r: 'rounded-full' },
                  ].map((br) => {
                    const isSelected = (hubConfig.borderRadius || '2xl') === br.id;
                    return (
                      <button
                        key={br.id}
                        type="button"
                        onClick={() => {
                          hapticSelection();
                          setHubConfig((prev) => ({ ...prev, borderRadius: br.id as HubConfig['borderRadius'] }));
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-white/15 border-white text-[#BFFF00] font-bold shadow'
                            : 'bg-[#181b19] border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className={`w-6 h-4 mx-auto mb-1 border border-white/30 ${br.r} bg-white/10`} />
                        <span className="text-[11px] block truncate">{br.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Layout & Customization Controls */}
              <div className="pt-3 border-t border-white/5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Density */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                      Densità Card
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-[#181b19] p-1 rounded-xl border border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          hapticSelection();
                          setHubConfig((p) => ({ ...p, cardDensity: 'comfortable' }));
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                          (hubConfig.cardDensity || 'comfortable') === 'comfortable'
                            ? 'bg-white/15 text-white shadow'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Ariosa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          hapticSelection();
                          setHubConfig((p) => ({ ...p, cardDensity: 'compact' }));
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                          hubConfig.cardDensity === 'compact'
                            ? 'bg-white/15 text-white shadow'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Compatta
                      </button>
                    </div>
                  </div>

                  {/* Button Glow */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                      Effetto Bagliore CTA
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-[#181b19] p-1 rounded-xl border border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          hapticSelection();
                          setHubConfig((p) => ({ ...p, buttonGlow: true }));
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                          hubConfig.buttonGlow !== false
                            ? 'bg-white/15 text-white shadow'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Luminoso
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          hapticSelection();
                          setHubConfig((p) => ({ ...p, buttonGlow: false }));
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                          hubConfig.buttonGlow === false
                            ? 'bg-white/15 text-white shadow'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Flat
                      </button>
                    </div>
                  </div>

                  {/* Bottom Dock Bar */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                      Barra Dock Inferiore
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-[#181b19] p-1 rounded-xl border border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          hapticSelection();
                          setHubConfig((p) => ({ ...p, showBottomDock: true }));
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                          hubConfig.showBottomDock !== false
                            ? 'bg-white/15 text-white shadow'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Visibile
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          hapticSelection();
                          setHubConfig((p) => ({ ...p, showBottomDock: false }));
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                          hubConfig.showBottomDock === false
                            ? 'bg-white/15 text-white shadow'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Nascosta
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 3: MODULI & BENTO GRID (Lista completa, Reorder, Toggle, Custom Add, Bento) */}
          {/* ======================================================================= */}
          {activeTab === 'modules' && (
            <div className="rounded-3xl border border-white/10 bg-[#121413] p-5 sm:p-6 space-y-5 shadow-xl animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#BFFF00]" />
                    <span>Moduli dell&apos;Hub & Layout Bento Grid</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Riordina le card, scegli tra 1 colonna o 2 colonne a larghezza intera e aggiungi blocchi personalizzati illimitati.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#BFFF00] hover:bg-[#a8e000] text-black font-extrabold text-xs shadow-md transition-all active:scale-95 touch-press cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Aggiungi Blocco</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetModulesToDefault}
                    title="Ripristina moduli consigliati per la tua categoria"
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Ristoranti: Canva Menu Promo Banner */}
              {category === 'restaurant' && (
                <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-zinc-900/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white tracking-tight">Personalizza il tuo Menù Stile Canva</span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400 text-black">Esclusivo Ristoranti</span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        Crea un&apos;esperienza visiva elegante con preset grafici (Lavagna, Fine Dining, Trattoria) e anteprima smartphone live.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/menu"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-md transition-all active:scale-95 touch-press shrink-0"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Vai a Menù Canvas</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Module List with Up/Down buttons, Visibility Toggle, and Inline Inputs */}
              <div className="space-y-3">
                {hubConfig.modules.map((m, idx) => {
                  const Icon = getModuleIcon(m.id);
                  const isFirst = idx === 0;
                  const isLast = idx === hubConfig.modules.length - 1;

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        m.enabled
                          ? 'bg-[#181b19] border-white/10 shadow'
                          : 'bg-[#141514] border-white/5 opacity-60'
                      }`}
                    >
                      {/* Top Header of Module Card: Order #, Icon, Title, Up/Down, Toggle */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                            style={{
                              backgroundColor: m.enabled ? `${hubConfig.primaryColor}20` : '#222',
                              color: m.enabled ? hubConfig.primaryColor : '#888',
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate leading-tight">
                              {m.title || m.id}
                            </span>
                            <span className="text-[10px] text-zinc-400 block truncate">
                              ID: {m.id} • {m.enabled ? 'Visibile' : 'Nascosto'}
                            </span>
                          </div>
                        </div>

                        {/* Actions: Move Up, Move Down, Toggle Switch */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveModule(idx, 'up')}
                            disabled={isFirst}
                            title="Sposta Su nella griglia"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveModule(idx, 'down')}
                            disabled={isLast}
                            title="Sposta Giù nella griglia"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleModule(m.id)}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors touch-press ml-1 ${
                              m.enabled ? 'bg-[#BFFF00]' : 'bg-zinc-800'
                            }`}
                            title={m.enabled ? 'Disattiva modulo' : 'Attiva modulo'}
                          >
                            <div
                              className={`w-5 h-5 rounded-full transition-transform ${
                                m.enabled ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white/60'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Inline Editable Fields: Title, Subtitle, Badge Tag */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/5 text-xs">
                        <div>
                          <label className="block text-[10px] font-medium text-zinc-400 mb-0.5">Titolo Card</label>
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => updateModuleField(m.id, 'title', e.target.value)}
                            className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-semibold"
                            placeholder="Titolo"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-zinc-400 mb-0.5">Sottotitolo / Didascalia</label>
                          <input
                            type="text"
                            value={m.subtitle}
                            onChange={(e) => updateModuleField(m.id, 'subtitle', e.target.value)}
                            className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white"
                            placeholder="Descrizione breve"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-zinc-400 mb-0.5">Badge / Tag (Opzionale)</label>
                          <input
                            type="text"
                            value={m.badge || ''}
                            onChange={(e) => updateModuleField(m.id, 'badge', e.target.value)}
                            className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white placeholder-zinc-600"
                            placeholder="es. 1-Tap, Free, AI, 5.0"
                          />
                        </div>
                      </div>

                      {/* Bento Grid ColSpan Selector & Custom Module Actions */}
                      <div className="mt-2.5 pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                            <Grid className="w-3 h-3 text-zinc-500" />
                            <span>Formato Card Bento:</span>
                          </span>
                          <div className="flex items-center p-0.5 bg-black/40 border border-white/10 rounded-lg">
                            <button
                              type="button"
                              onClick={() => toggleModuleColSpan(m.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                (m.colSpan || 1) === 1
                                  ? 'bg-[#BFFF00] text-black shadow-sm'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              1 Colonna (1x1)
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleModuleColSpan(m.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                (m.colSpan || 1) === 2
                                  ? 'bg-[#BFFF00] text-black shadow-sm'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              2 Colonne (2x1 Full Width)
                            </button>
                          </div>
                        </div>

                        {m.isCustom && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 text-[10px] font-mono font-bold border border-purple-500/30">
                              {m.actionType === 'modal' ? 'Popup Modale' : 'Link Esterno'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomModule(m.id)}
                              title="Elimina blocco personalizzato"
                              className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Custom URL Field for modules that support direct links */}
                      {((m.isCustom && m.actionType === 'link') ||
                        m.id === 'whatsapp' ||
                        m.id === 'instagram' ||
                        m.id === 'custom_cta' ||
                        m.id === 'guide') && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <label className="block text-[10px] font-medium text-zinc-400 mb-0.5">
                            Link / URL di Destinazione Personalizzato
                          </label>
                          <input
                            type="text"
                            value={m.customUrl || ''}
                            onChange={(e) => updateModuleField(m.id, 'customUrl', e.target.value)}
                            placeholder={
                              m.id === 'whatsapp'
                                ? 'https://wa.me/393331234567'
                                : m.id === 'instagram'
                                ? 'https://instagram.com/nomelocale'
                                : 'https://...'
                            }
                            className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white"
                          />
                        </div>
                      )}

                      {/* Custom Modal Text Editor for Modal Custom Modules */}
                      {m.isCustom && m.actionType === 'modal' && (
                        <div className="mt-2 pt-2 border-t border-white/5 space-y-2">
                          <div>
                            <label className="block text-[10px] font-medium text-zinc-400 mb-0.5">
                              Titolo della Schermata Popup
                            </label>
                            <input
                              type="text"
                              value={m.modalTitle || m.title}
                              onChange={(e) =>
                                setHubConfig((prev) => ({
                                  ...prev,
                                  modules: prev.modules.map((modItem) =>
                                    modItem.id === m.id ? { ...modItem, modalTitle: e.target.value } : modItem
                                  ),
                                }))
                              }
                              className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white"
                              placeholder="es. Regole della Casa / Info Utili"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-zinc-400 mb-0.5">
                              Contenuto del Popup Informativo
                            </label>
                            <textarea
                              rows={3}
                              value={m.modalContent || ''}
                              onChange={(e) =>
                                setHubConfig((prev) => ({
                                  ...prev,
                                  modules: prev.modules.map((modItem) =>
                                    modItem.id === m.id ? { ...modItem, modalContent: e.target.value } : modItem
                                  ),
                                }))
                              }
                              className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white resize-none"
                              placeholder="Inserisci qui il testo che il cliente leggerà toccando questa card..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 3: HERO & BADGE (Hero Title, Subtitle, Destinazione, Table Badge, Tag NFC) */}
          {/* ======================================================================= */}
          {activeTab === 'hero' && (
            <div className="rounded-3xl border border-white/10 bg-[#121413] p-5 sm:p-6 space-y-6 shadow-xl animate-fade-in">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: hubConfig.primaryColor }} />
                  <span>Personalizzazione Tasto Hero & Badge di Postazione</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Configura il pulsante di risalto principale (in alto a sinistra) e personalizza la dicitura del tavolo/camera/ombrellone.
                </p>
              </div>

              {/* 1. HERO MAIN CARD */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-[#BFFF00]" />
                  <span>Testi del Pulsante Hero in Evidenza</span>
                </h3>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Titolo del Pulsante Hero</label>
                  <input
                    type="text"
                    value={hubConfig.hero.title}
                    onChange={(e) =>
                      setHubConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, title: e.target.value },
                      }))
                    }
                    placeholder="es. Menù Digitale, Prenota Taglio, Ordina al Tavolo"
                    className="w-full min-h-[44px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Sottotitolo / Didascalia Hero</label>
                  <input
                    type="text"
                    value={hubConfig.hero.subtitle}
                    onChange={(e) =>
                      setHubConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, subtitle: e.target.value },
                      }))
                    }
                    placeholder="es. Piatti, prezzi & vini del giorno"
                    className="w-full min-h-[44px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Destinazione al Click</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setHubConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, destinationType: 'in_app' },
                        }))
                      }
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        hubConfig.hero.destinationType === 'in_app'
                          ? 'bg-white/10 border-white text-white shadow-lg'
                          : 'bg-[#18181B] border-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-white block mb-0.5">Menù Digitale In-App</span>
                      <span className="text-[11px] text-zinc-500 block">Apre il menù interattivo con ricerca piatti, filtri allergeni e categorie</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setHubConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, destinationType: 'external' },
                        }))
                      }
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        hubConfig.hero.destinationType === 'external'
                          ? 'bg-white/10 border-white text-white shadow-lg'
                          : 'bg-[#18181B] border-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-white block mb-0.5">Link Esterno o File PDF</span>
                      <span className="text-[11px] text-zinc-500 block">Reindirizza a un link personalizzato o carta menù esterna</span>
                    </button>
                  </div>
                </div>

                {hubConfig.hero.destinationType === 'external' && (
                  <div className="p-3.5 rounded-2xl bg-[#181b19] border border-white/5 space-y-2 animate-fade-in">
                    <label className="block text-xs font-medium text-zinc-300">URL Destinazione Menù / PDF</label>
                    <input
                      type="url"
                      value={hubConfig.hero.externalUrl || ''}
                      onChange={(e) =>
                        setHubConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, externalUrl: e.target.value },
                        }))
                      }
                      placeholder="https://tuosito.it/menu.pdf"
                      className="w-full min-h-[42px] bg-[#121214] border border-white/10 rounded-xl px-3.5 text-xs text-white font-mono focus:outline-none focus:border-white"
                    />
                  </div>
                )}
              </div>

              {/* 2. BADGE TAVOLO & LOCALIZZAZIONE */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Dicitura Badge di Postazione / Tavolo</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Questa etichetta compare sotto al nome del locale per indicare all&apos;ospite la sua postazione (es. &quot;Tavolo Connesso&quot;, &quot;Camera Suite&quot;, &quot;Ombrellone&quot;).
                </p>

                <div>
                  <input
                    type="text"
                    value={hubConfig.tableBadgeLabel}
                    onChange={(e) =>
                      setHubConfig((prev) => ({
                        ...prev,
                        tableBadgeLabel: e.target.value,
                      }))
                    }
                    placeholder="es. Tavolo Connesso"
                    className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white font-semibold focus:outline-none focus:border-white"
                  />
                </div>

                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Tavolo Connesso', 'Camera / Suite', 'Ombrellone Spiaggia', 'Postazione Smart', 'Tavolo VIP', 'La tua Postazione'].map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() =>
                          setHubConfig((prev) => ({
                            ...prev,
                            tableBadgeLabel: suggestion,
                          }))
                        }
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors"
                      >
                        + {suggestion}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* 3. TAG NFC LIVE */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Tag NFC Live Superiore</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Il badge con il punto verde pulsante nella barra di stato (es. &quot;NFC LIVE&quot;, &quot;SMART HUB&quot;, &quot;LIVE PASS&quot;).
                </p>

                <div>
                  <input
                    type="text"
                    value={hubConfig.tableLiveTag}
                    onChange={(e) =>
                      setHubConfig((prev) => ({
                        ...prev,
                        tableLiveTag: e.target.value,
                      }))
                    }
                    placeholder="es. NFC LIVE"
                    className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white font-mono uppercase font-bold focus:outline-none focus:border-white"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['NFC LIVE', 'SMART HUB', 'LIVE PASS', '1-TAP NFC', 'RIVO SMART'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() =>
                        setHubConfig((prev) => ({
                          ...prev,
                          tableLiveTag: suggestion,
                        }))
                      }
                      className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 4: SERVIZI TAVOLO (Waiter Call, Telegram, Wi-Fi, AI Sommelier, Loyalty) */}
          {/* ======================================================================= */}
          {activeTab === 'services' && (
            <div className="rounded-3xl border border-white/10 bg-[#121413] p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5" style={{ color: hubConfig.primaryColor }} />
                  <span>Servizi Rapidi al Tavolo & Alert Staff</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Configura gli strumenti operativi: notifiche per le chiamate dei camerieri, credenziali Wi-Fi e intelligenza artificiale.
                </p>
              </div>

              {/* Ristoranti: Canva Menu Promo Banner */}
              {category === 'restaurant' && (
                <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-zinc-900/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white tracking-tight">Personalizza il tuo Menù Stile Canva</span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400 text-black">Esclusivo Ristoranti</span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        Passa al designer visuale avanzato: gestisci piatti, foto HD, allergeni, ordini al tavolo e stili grafici d&apos;autore.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/menu"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs shadow-md transition-all active:scale-95 touch-press shrink-0"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Vai a Menù Canvas</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Waiter Call & Staff Notification Card */}
              <div className="p-4 rounded-2xl bg-[#181b19] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <BellRing className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Chiamata Cameriere & Monitor Sala</h4>
                      <p className="text-[11px] text-zinc-400">Ricevi le richieste dei tavoli in tempo reale sul tablet o su smartphone</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/service"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors shrink-0"
                  >
                    <span>Apri Monitor Sala</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-3 rounded-xl bg-[#121214] border border-white/5 space-y-2">
                  <div className="text-[11px] text-zinc-300 font-medium">Come funziona per l&apos;attività:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-400">
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                      <span className="text-amber-400 font-bold">1.</span>
                      <span><strong>Monitor Sala (Tablet / Cassa):</strong> lascialo aperto su uno schermo al banco. Emette un segnale acustico ad ogni chiamata con il numero del tavolo.</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                      <span className="text-blue-400 font-bold">2.</span>
                      <span><strong>Bot Telegram (Smartphone Staff):</strong> ricevi notifiche push istantanee con suono sul cellulare dei camerieri o in un gruppo Telegram dello staff.</span>
                    </div>
                  </div>
                </div>

                {/* Telegram Staff Alerts Toggle & Fields */}
                <div className="pt-2 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">Notifiche Push Telegram Staff</span>
                      <span className="text-[11px] text-zinc-400">Invia alert istantanei direttamente sul telefono dei camerieri</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTelegramAlertsEnabled(!telegramAlertsEnabled)}
                      className={`w-12 h-7 rounded-full p-1 transition-colors touch-press ${
                        telegramAlertsEnabled ? 'bg-blue-500' : 'bg-zinc-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          telegramAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {telegramAlertsEnabled && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            Telegram Bot Token
                          </label>
                          <input
                            type="text"
                            value={telegramToken}
                            onChange={(e) => setTelegramToken(e.target.value)}
                            placeholder="Es. 7123456789:AAHKz..."
                            className="w-full min-h-[40px] bg-[#121214] border border-white/10 rounded-xl px-3 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            Telegram Chat ID / Canale / Gruppo
                          </label>
                          <input
                            type="text"
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            placeholder="Es. -1001987654321 oppure 12345678"
                            className="w-full min-h-[40px] bg-[#121214] border border-white/10 rounded-xl px-3 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>Crea il bot gratis in 30 secondi su Telegram cercando <strong>@BotFather</strong>, invia <code>/newbot</code> e copia il token generato.</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleTestTelegram}
                          disabled={testSending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {testSending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Invia Notifica Test</span>
                        </button>
                      </div>

                      {testSentSuccess && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Notifica di test inviata con successo su Telegram! Controlla la chat.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Ponte Wi-Fi Ospiti (Opzionale) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#181b19] border border-white/5 space-y-4">
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400 shadow-sm">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white tracking-tight">Ponte Wi-Fi Ospiti (Opzionale)</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                          Opzione D
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Offri ai clienti la connessione istantanea al Wi-Fi del locale per azzerare i problemi di segnale 4G/5G debole al tavolo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-semibold text-zinc-300 hidden sm:inline">
                      Abilita Ponte Wi-Fi
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        hapticSelection();
                        setHubConfig((prev) => {
                          const currentBridge = prev.wifiBridge || { enabled: false, securityType: 'WPA' };
                          const nextEnabled = !currentBridge.enabled;
                          return {
                            ...prev,
                            wifiBridge: {
                              ...currentBridge,
                              enabled: nextEnabled,
                              ssid: currentBridge.ssid ?? wifiSsid,
                              password: currentBridge.password ?? wifiPassword,
                              securityType: currentBridge.securityType || 'WPA',
                            },
                          };
                        });
                      }}
                      className={`w-12 h-7 rounded-full p-1 transition-colors touch-press ${
                        hubConfig.wifiBridge?.enabled ? 'bg-sky-500' : 'bg-zinc-800'
                      }`}
                      aria-label="Abilita Ponte Wi-Fi"
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          hubConfig.wifiBridge?.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* When enabled, show fields */}
                {hubConfig.wifiBridge?.enabled && (
                  <div className="space-y-4 pt-3 border-t border-white/5 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                          Nome Rete (SSID) <span className="text-sky-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={hubConfig.wifiBridge?.ssid ?? wifiSsid}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWifiSsid(val);
                            setHubConfig((prev) => ({
                              ...prev,
                              wifiBridge: {
                                ...(prev.wifiBridge || { enabled: true, securityType: 'WPA' }),
                                ssid: val,
                              },
                            }));
                          }}
                          placeholder="es. BarCentrale_Guest"
                          className="w-full min-h-[42px] bg-[#121214] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                          Password Wi-Fi {hubConfig.wifiBridge?.securityType === 'nopass' ? '(Rete Aperta)' : ''}
                        </label>
                        <input
                          type="text"
                          disabled={hubConfig.wifiBridge?.securityType === 'nopass'}
                          value={hubConfig.wifiBridge?.securityType === 'nopass' ? '' : (hubConfig.wifiBridge?.password ?? wifiPassword)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWifiPassword(val);
                            setHubConfig((prev) => ({
                              ...prev,
                              wifiBridge: {
                                ...(prev.wifiBridge || { enabled: true, securityType: 'WPA' }),
                                password: val,
                              },
                            }));
                          }}
                          placeholder={hubConfig.wifiBridge?.securityType === 'nopass' ? 'Nessuna password richiesta' : 'es. estate2026'}
                          className="w-full min-h-[42px] bg-[#121214] border border-white/10 rounded-xl px-3.5 text-xs text-white font-mono focus:outline-none focus:border-sky-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                          Tipo di sicurezza
                        </label>
                        <select
                          value={hubConfig.wifiBridge?.securityType || 'WPA'}
                          onChange={(e) => {
                            const val = e.target.value as 'WPA' | 'WEP' | 'nopass';
                            setHubConfig((prev) => ({
                              ...prev,
                              wifiBridge: {
                                ...(prev.wifiBridge || { enabled: true }),
                                securityType: val,
                              },
                            }));
                          }}
                          className="w-full min-h-[42px] bg-[#121214] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-sky-400 transition-colors cursor-pointer"
                        >
                          <option value="WPA">WPA / WPA2 / WPA3 (Standard consigliato)</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">Aperta / Nessuna password</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                          Messaggio di cortesia <span className="text-zinc-500 font-normal">(opzionale)</span>
                        </label>
                        <input
                          type="text"
                          value={hubConfig.wifiBridge?.welcomeNotice || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setHubConfig((prev) => ({
                              ...prev,
                              wifiBridge: {
                                ...(prev.wifiBridge || { enabled: true, securityType: 'WPA' }),
                                welcomeNotice: val,
                              },
                            }));
                          }}
                          placeholder="es. Buona permanenza da tutto lo staff!"
                          className="w-full min-h-[42px] bg-[#121214] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <span>
                        Quando abilitato, gli ospiti vedranno la card del Wi-Fi in evidenza nell&apos;Hub e potranno connettersi istantaneamente al tavolo con 1 tap senza inserire la password.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Assistant Context */}
              <div className="p-4 rounded-2xl bg-[#181b19] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Wine className="w-4 h-4 text-purple-400" />
                  <span>AI Sommelier & Consigli dello Chef</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Scrivi i piatti speciali del giorno o gli abbinamenti consigliati che l&apos;assistente proporrà ai clienti.
                </p>
                <textarea
                  rows={2}
                  value={aiMenuContext}
                  onChange={(e) => setAiMenuContext(e.target.value)}
                  placeholder="es. Consigliare lo spaghettone alla carbonara abbinato a un calice di Chianti riserva."
                  className="w-full bg-[#121214] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white resize-none"
                />
              </div>

              {/* Loyalty Text */}
              <div className="p-4 rounded-2xl bg-[#181b19] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Carta Fedeltà (Testo Premio)</span>
                </div>
                <input
                  type="text"
                  value={loyaltyRewardText}
                  onChange={(e) => setLoyaltyRewardText(e.target.value)}
                  placeholder="es. Caffè omaggio al 10° timbro"
                  className="w-full min-h-[40px] bg-[#121214] border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 5: RECENSIONI & PROMO (Review Shield & Banner Promozionale) */}
          {/* ======================================================================= */}
          {activeTab === 'reviews' && (
            <div className="rounded-3xl border border-white/10 bg-[#121413] p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5" style={{ color: hubConfig.primaryColor }} />
                  <span>Review Shield & Banner Promozionale</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Proteggi la tua reputazione online filtrando i feedback negativi e massimizzando le recensioni positive a 5 stelle su Google.
                </p>
              </div>

              {/* Review Shield Google Link */}
              <div className="p-4 rounded-2xl bg-[#181b19] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Review Shield Attivo (1-Tap Google)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={reviewShieldEnabled}
                    onChange={(e) => setReviewShieldEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#BFFF00] rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Link Diretto Recensioni Google Maps</label>
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/... o link recensioni Google"
                    className="w-full min-h-[42px] bg-[#121214] border border-white/10 rounded-xl px-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              {/* Custom CTA Banner */}
              <div className="p-4 rounded-2xl bg-[#181b19] border border-white/5 space-y-3">
                <span className="text-xs font-bold text-white block">Banner In Evidenza (Opzionale)</span>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Titolo Promo</label>
                  <input
                    type="text"
                    value={customCtaLabel}
                    onChange={(e) => setCustomCtaLabel(e.target.value)}
                    placeholder="es. Prenota Cena di Capodanno / Scopri il Nuovo Menù"
                    className="w-full min-h-[40px] bg-[#121214] border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Link Destinazione Promo</label>
                  <input
                    type="url"
                    value={customCtaUrl}
                    onChange={(e) => setCustomCtaUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full min-h-[40px] bg-[#121214] border border-white/10 rounded-xl px-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 6: CONTATTI & INFO (WhatsApp, Telefono, Sito web) */}
          {/* ======================================================================= */}
          {activeTab === 'contacts' && (
            <div className="rounded-3xl border border-white/10 bg-[#121413] p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5" style={{ color: hubConfig.primaryColor }} />
                  <span>Contatti & Assistenza Rapida al Tavolo</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Canali di contatto rapido che appaiono ai clienti per informazioni o messaggi diretti allo staff.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                    <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" /> WhatsApp Diretto del Locale
                  </label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+39 333 1234567"
                    className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                    <InstagramIcon className="w-3.5 h-3.5 text-[#E1306C]" /> Profilo Instagram (URL o @username)
                  </label>
                  <input
                    type="text"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="@nomelocale o https://instagram.com/..."
                    className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-sky-400" /> Telefono Fisso / Reception
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+39 081 1234567"
                    className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-violet-400" /> Sito Web Ufficiale
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://nomelocale.it"
                    className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: REAL-TIME INTERACTIVE SMARTPHONE MOCKUP */}
        {/* ========================================================================= */}
        <div className={`lg:col-span-5 flex flex-col items-center sticky top-6 ${mobileView === 'editor' ? 'hidden lg:flex' : 'flex'}`}>
          
          <div className="flex items-center justify-between w-full max-w-[340px] sm:max-w-[360px] px-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Eye className="w-3.5 h-3.5 text-[#BFFF00]" />
              <span>Simulatore Live Hub</span>
            </div>
            <button
              type="button"
              onClick={triggerMockupNfcTap}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#BFFF00]/10 hover:bg-[#BFFF00]/20 text-[#BFFF00] border border-[#BFFF00]/30 transition-all touch-press active:scale-95 cursor-pointer"
              title="Riproduci l'animazione di sincronizzazione NFC e fioritura dal centro"
            >
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Simula Tap NFC</span>
            </button>
          </div>

          {/* Smartphone Frame applying the Selected Theme, Font, and Card Styles */}
          <div
            className="w-full max-w-[340px] sm:max-w-[360px] border-[8px] border-[#222624] rounded-[48px] p-4 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col justify-between select-none transition-colors duration-300"
            style={{
              minHeight: '660px',
              backgroundColor: activeTheme.bgHex,
              color: activeTheme.textHex,
              fontFamily: activeFont.cssFamily,
            }}
          >
            {/* Simulated NFC Tap Portal Overlay */}
            {(mockupNfcPhase === 'sensing' || mockupNfcPhase === 'synced') && (
              <div
                className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-xl transition-all duration-300"
                style={{ backgroundColor: activeTheme.bgHex }}
              >
                <div className="relative flex items-center justify-center w-36 h-36 mb-4">
                  <div
                    className="absolute inset-0 rounded-full border border-dashed animate-nfc-sonar-1 pointer-events-none"
                    style={{ borderColor: `${hubConfig.primaryColor}70` }}
                  />
                  <div
                    className="absolute inset-0 rounded-full border animate-nfc-sonar-2 pointer-events-none"
                    style={{ borderColor: `${hubConfig.primaryColor}50` }}
                  />
                  <div
                    className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center shadow-xl ${
                      mockupNfcPhase === 'synced' ? 'animate-nfc-contact-flash' : 'animate-float-gentle'
                    }`}
                    style={{
                      borderColor: hubConfig.primaryColor,
                      backgroundColor: isLight ? '#ffffff' : '#141715',
                      boxShadow: `0 0 35px ${hubConfig.primaryColor}40`,
                    }}
                  >
                    {mockupNfcPhase === 'synced' ? (
                      <CheckCircle2 className="w-9 h-9" style={{ color: hubConfig.primaryColor }} />
                    ) : (
                      <Radio className="w-8 h-8 animate-pulse" style={{ color: hubConfig.primaryColor }} />
                    )}
                  </div>
                </div>
                <p className="text-xs font-bold text-center">
                  {mockupNfcPhase === 'synced' ? 'Tag Riconosciuto!' : 'Avvicinamento Tag NFC...'}
                </p>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                  {mockupNfcPhase === 'synced' ? `${devices[0]?.name || 'Tavolo 1'} Connesso` : 'Frequenza 13.56 MHz'}
                </span>
              </div>
            )}

            {/* Ambient inner glow based on chosen primary color */}
            {hubConfig.accentGlow && (
              <div
                className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-48 blur-[80px] rounded-full pointer-events-none opacity-35 transition-all duration-300"
                style={{ backgroundColor: hubConfig.primaryColor }}
              />
            )}

            {/* Glass Shimmer Effect on visual modifications */}
            {isShimmering && (
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-[40px]">
                <div
                  key={shimmerKey}
                  className="w-1/2 h-[200%] -top-1/2 absolute bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer-slide pointer-events-none"
                  style={{ animationDuration: '1.4s' }}
                />
              </div>
            )}

            {/* Top Status Bar: Clock + Centered Dynamic Island + Live Tag Badge */}
            <div className="relative z-20 flex items-center justify-between mb-2 px-1">
              <span className={`text-[10px] font-mono font-bold tracking-tight ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                12:45
              </span>

              {/* Dynamic Island / Notch */}
              <div className="w-20 h-3.5 bg-black rounded-full flex items-center justify-end px-2 border border-white/10 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1c221e]" />
              </div>

              {/* Synchronized Pulsating Live Tag Badge */}
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border backdrop-blur-md shadow-sm ${
                  isLight
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400'
                }`}
                title="Sincronizzazione Live NFC"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[8px] font-black tracking-wider uppercase font-mono leading-none">
                  {hubConfig.tableLiveTag || 'NFC LIVE'}
                </span>
              </div>
            </div>

            {/* NFC Magic Sparkle Burst inside Mockup */}
            {mockupNfcPhase === 'assembling' && (
              <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center overflow-hidden">
                {[...Array(8)].map((_, i) => {
                  const angle = (i * 45) * (Math.PI / 180);
                  const dist = 50;
                  const tx = `${Math.round(Math.cos(angle) * dist)}px`;
                  const ty = `${Math.round(Math.sin(angle) * dist)}px`;
                  return (
                    <div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full animate-sparkle-drift"
                      style={{
                        backgroundColor: i % 2 === 0 ? hubConfig.primaryColor : '#fbbf24',
                        boxShadow: `0 0 10px ${hubConfig.primaryColor}`,
                        '--tx': tx,
                        '--ty': ty,
                      } as React.CSSProperties}
                    />
                  );
                })}
              </div>
            )}

            {/* Hub Header inside Mockup */}
            <div className={`flex items-center justify-between gap-2 relative z-10 mb-3 ${
              mockupNfcPhase === 'assembling' ? 'animate-assemble-header' : ''
            }`}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-9 h-9 rounded-full object-cover border shadow-sm bg-black"
                    style={{ borderColor: hubConfig.primaryColor }}
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-black"
                    style={{ backgroundColor: hubConfig.primaryColor }}
                  >
                    <CatIcon className="w-4 h-4" style={{ color: contrastText }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className={`text-xs font-extrabold truncate leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {name || 'Nome Attività'}
                  </h4>
                  <div className={`flex items-center gap-1 text-[9px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: hubConfig.primaryColor }} />
                    <span className="truncate">
                      {hubConfig.tableBadgeLabel || 'Tavolo Connesso'} • {devices[0]?.name || 'Tavolo 1'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center relative ${
                  isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#181b19] border-white/10'
                }`}>
                  <BellRing className={`w-3.5 h-3.5 ${isLight ? 'text-slate-700' : 'text-zinc-300'}`} />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>
              </div>
            </div>

            {/* Table Badge inside Mockup */}
            <div
              className={`w-full flex items-center justify-between px-3 py-1.5 mb-2.5 backdrop-blur-md border transition-all ${getBorderRadiusClass(hubConfig.borderRadius)} ${
                isLight
                  ? 'bg-white/90 border-slate-200 text-slate-800'
                  : 'bg-[#141715]/90 border-white/[0.08] text-white'
              } ${mockupNfcPhase === 'assembling' ? 'animate-assemble-badge' : ''}`}
              style={getBorderRadiusStyle(hubConfig.borderRadius)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className={`text-[10px] font-medium truncate ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  {hubConfig.tableBadgeLabel || 'Tavolo Connesso'}: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{devices[0]?.name || 'Tavolo 1'}</strong>
                </span>
              </div>
              <div
                className={`flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 ${getBorderRadiusClass(hubConfig.borderRadius)} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shrink-0`}
                style={getBorderRadiusStyle(hubConfig.borderRadius)}
              >
                <Zap className="w-2.5 h-2.5 animate-pulse" />
                <span>{hubConfig.tableLiveTag || 'NFC LIVE'}</span>
              </div>
            </div>

            {/* Wi-Fi Bridge Live Simulator Card (Strictly only when enabled and ssid present) */}
            {hubConfig.wifiBridge?.enabled && Boolean(hubConfig.wifiBridge.ssid?.trim()) && (
              <div
                onClick={() => {
                  hapticTap();
                  setSimulatedWifiConnected(true);
                  setTimeout(() => setSimulatedWifiConnected(false), 2800);
                }}
                className={`w-full p-2.5 mb-2.5 relative z-10 border transition-all cursor-pointer touch-press active:scale-[0.98] ${getCardStyleClass()} ${
                  mockupNfcPhase === 'assembling' ? 'animate-assemble-badge' : ''
                } ${getBorderRadiusClass(hubConfig.borderRadius)}`}
                style={{
                  boxShadow: `0 4px 16px ${hubConfig.primaryColor}20`,
                  ...getBorderRadiusStyle(hubConfig.borderRadius),
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 ${getBorderRadiusClass(hubConfig.borderRadius)} flex items-center justify-center shrink-0 ${
                        isLight ? 'bg-sky-50 text-sky-600' : 'bg-sky-500/15 text-sky-400'
                      }`}
                      style={getBorderRadiusStyle(hubConfig.borderRadius)}
                    >
                      <Wifi className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold truncate leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Wi-Fi: {hubConfig.wifiBridge.ssid}
                        </span>
                        <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 shrink-0">
                          1-Tap
                        </span>
                      </div>
                      <span className={`text-[8.5px] block truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                        {hubConfig.wifiBridge.welcomeNotice || 'Connessione rapida al Wi-Fi del locale'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      hapticSuccess();
                      setSimulatedWifiConnected(true);
                      setTimeout(() => setSimulatedWifiConnected(false), 2800);
                    }}
                    className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-lg shrink-0 flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: simulatedWifiConnected ? '#10b981' : hubConfig.primaryColor,
                      color: simulatedWifiConnected ? '#ffffff' : contrastText,
                    }}
                  >
                    {simulatedWifiConnected ? (
                      <>
                        <Check className="w-2.5 h-2.5" />
                        <span>Connesso!</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-2.5 h-2.5" />
                        <span>Connetti</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Grid of Cards inside Mockup: Hero + Reordered Modules */}
            <div className="grid grid-cols-2 gap-2.5 relative z-10 mb-3 flex-1 content-start">
              {/* HERO HIGHLIGHT CARD */}
              {hubConfig.hero.enabled && (
                <div
                  onClick={() => hapticTap()}
                  className={`${getBorderRadiusClass(hubConfig.borderRadius)} p-3 flex flex-col justify-between min-h-[96px] shadow-lg transition-all relative overflow-hidden cursor-pointer touch-press active:scale-95 ${
                    mockupNfcPhase === 'assembling' ? 'animate-assemble-hero' : ''
                  }`}
                  style={{
                    backgroundColor: hubConfig.primaryColor,
                    color: contrastText,
                    boxShadow: `0 8px 20px ${hubConfig.primaryColor}35`,
                    ...getBorderRadiusStyle(hubConfig.borderRadius),
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div
                      className={`w-7 h-7 ${getBorderRadiusClass(hubConfig.borderRadius)} bg-black/15 flex items-center justify-center`}
                      style={getBorderRadiusStyle(hubConfig.borderRadius)}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" style={{ color: contrastText }} />
                    </div>
                    {hubConfig.hero.badgeText && (
                      <span
                        className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 ${getBorderRadiusClass(hubConfig.borderRadius)} bg-black/20 tracking-wider`}
                        style={getBorderRadiusStyle(hubConfig.borderRadius)}
                      >
                        {hubConfig.hero.badgeText}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-tight block leading-tight truncate">
                      {hubConfig.hero.title || 'Menù Digitale'}
                    </span>
                    <span className="text-[9px] font-semibold opacity-85 block truncate">
                      {hubConfig.hero.subtitle || 'Piatti, prezzi & vini'}
                    </span>
                  </div>
                </div>
              )}

              {/* RENDER DYNAMIC MODULES ORDERED & ENABLED */}
              {hubConfig.modules
                .filter((m) => m.enabled)
                .map((m, idx) => {
                  const Icon = getModuleIcon(m.id, m.iconName);
                  const isNeon = hubConfig.cardStyle === 'neon';
                  const isLeft = idx % 2 === 0;
                  const isFullWidth = m.colSpan === 2;

                  return (
                    <div
                      key={m.id}
                      onClick={() => hapticTap()}
                      className={`${isFullWidth ? 'col-span-2' : 'col-span-1'} ${getBorderRadiusClass(hubConfig.borderRadius)} p-3 flex flex-col justify-between min-h-[96px] transition-all relative overflow-hidden cursor-pointer touch-press active:scale-95 ${getCardStyleClass()} ${
                        mockupNfcPhase === 'assembling'
                          ? isLeft
                            ? 'animate-assemble-left'
                            : 'animate-assemble-right'
                          : ''
                      }`}
                      style={{
                        boxShadow: isNeon ? `0 0 14px ${hubConfig.primaryColor}25` : undefined,
                        ...getBorderRadiusStyle(hubConfig.borderRadius),
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div
                          className={`w-7 h-7 ${getBorderRadiusClass(hubConfig.borderRadius)} flex items-center justify-center ${
                            isLight ? 'bg-slate-100' : 'bg-white/5'
                          }`}
                          style={getBorderRadiusStyle(hubConfig.borderRadius)}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: hubConfig.primaryColor }} />
                        </div>
                        {m.badge && (
                          <span
                            className={`text-[8px] font-bold px-1.5 py-0.5 ${getBorderRadiusClass(hubConfig.borderRadius)} ${
                              isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-zinc-300'
                            }`}
                            style={getBorderRadiusStyle(hubConfig.borderRadius)}
                          >
                            {m.badge}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className={`text-[11px] font-bold block leading-tight truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {m.title}
                        </span>
                        <span className={`text-[9px] block truncate ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                          {m.subtitle}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Review Shield inside Mockup */}
            {reviewShieldEnabled && (
              <div
                className={`${getBorderRadiusClass(hubConfig.borderRadius)} p-2.5 mb-2 relative z-10 border transition-all ${getCardStyleClass()}`}
                style={{
                  boxShadow: `0 4px 15px ${hubConfig.primaryColor}15`,
                  ...getBorderRadiusStyle(hubConfig.borderRadius),
                }}
              >
                <div className={`flex items-center justify-between mb-1 text-[10px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: hubConfig.primaryColor }} />
                    Valuta Esperienza
                  </span>
                  <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>1-Tap</span>
                </div>
                <div
                  className={`flex items-center justify-around py-1 ${getBorderRadiusClass(hubConfig.borderRadius)} ${isLight ? 'bg-slate-100' : 'bg-black/40'}`}
                  style={getBorderRadiusStyle(hubConfig.borderRadius)}
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => hapticStarRating(s)}
                      className="p-0.5 touch-press active:scale-125 focus:outline-none cursor-pointer"
                      aria-label={`Simula ${s} stelle`}
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Docked Bottom Bar inside Mockup */}
            <div className="relative z-10 pt-1">
              <div className={`rounded-full px-3 py-1.5 flex items-center justify-between shadow-xl border ${
                isLight ? 'bg-white/95 border-slate-200 text-slate-600' : 'bg-[#141715]/95 border-white/10 text-zinc-400'
              }`}>
                <button type="button" onClick={() => hapticTap()} className="text-[8px] font-semibold hover:opacity-80 touch-press active:scale-95">Home</button>
                <button type="button" onClick={() => hapticTap()} className="text-[8px] font-semibold hover:opacity-80 touch-press active:scale-95">Menù</button>
                {/* Elevated Circle FAB */}
                <button
                  type="button"
                  onClick={() => hapticWaiterCall()}
                  className="w-8 h-8 -mt-4 rounded-full flex items-center justify-center shadow-lg cursor-pointer touch-press active:scale-90"
                  style={{
                    backgroundColor: hubConfig.primaryColor,
                    color: contrastText,
                    boxShadow: `0 4px 12px ${hubConfig.primaryColor}60`,
                  }}
                  aria-label="Simula Chiama Sala"
                >
                  <BellRing className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => hapticTap()} className="text-[8px] font-semibold hover:opacity-80 touch-press active:scale-95">Info</button>
                <button type="button" onClick={() => hapticTap()} className="text-[8px] font-semibold hover:opacity-80 touch-press active:scale-95">Share</button>
              </div>
            </div>

            {/* Home Indicator Bar */}
            <div className={`w-24 h-1 rounded-full mx-auto mt-2 opacity-50 ${isLight ? 'bg-slate-400' : 'bg-zinc-600'}`} />
          </div>

          {/* Quick NFC Device Selector below Mockup */}
          {devices.length > 0 && (
            <div className="w-full max-w-[340px] sm:max-w-[360px] mt-3 p-3 rounded-2xl bg-[#121214] border border-white/5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Dispositivo NFC:</span>
                <select
                  value={selectedDeviceCode}
                  onChange={(e) => setSelectedDeviceCode(e.target.value)}
                  className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer truncate max-w-[170px]"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.unique_code} className="bg-[#18181B] text-white">
                      {d.name} ({d.unique_code})
                    </option>
                  ))}
                </select>
              </div>

              <a
                href={`/hub/${selectedDeviceCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold border border-zinc-700 flex items-center gap-1 shrink-0 transition-colors"
              >
                <span>Testa Fullscreen</span>
                <ArrowUpRight className="w-3 h-3 text-[#BFFF00]" />
              </a>
            </div>
          )}

        </div>

      </div>

      {/* Floating Action Button for Mobile Fast Switching */}
      <div className="lg:hidden fixed bottom-5 right-5 z-40">
        {mobileView === 'editor' ? (
          <button
            type="button"
            onClick={() => {
              setMobileView('preview');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#18181B] border border-[#BFFF00]/50 text-[#BFFF00] text-xs font-black shadow-[0_10px_30px_rgba(0,0,0,0.8)] active:scale-95 transition-all touch-press"
          >
            <Eye className="w-4 h-4" />
            <span>Anteprima Live Hub</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMobileView('editor');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#BFFF00] text-black text-xs font-black shadow-[0_10px_30px_rgba(191,255,0,0.3)] active:scale-95 transition-all touch-press"
          >
            <Sliders className="w-4 h-4" />
            <span>Torna all&apos;Editor</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: RIPRISTINO HUB ORIGINALE (SAFETY GUARD CON CONFERME) */}
      {/* ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#141514] border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ripristina Hub Originale</h3>
                <p className="text-xs text-zinc-400">Attenzione: operazione irreversibile</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/20 text-xs text-zinc-300 leading-relaxed space-y-2">
              <p>
                Stai per ripristinare il tuo Hub alla <strong>configurazione originale di fabbrica</strong>.
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px]">
                <li>Font, colori e stili card torneranno ai default del settore.</li>
                <li>I moduli riordinati torneranno nella disposizione standard.</li>
                <li>Eventuali blocchi personalizzati aggiunti verranno rimossi.</li>
                <li>Lo sfondo tornerà al colore scuro predefinito.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleResetToOriginal}
                disabled={resetting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Ripristino in corso...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Conferma e Ripristina</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: + AGGIUNGI BLOCCO PERSONALIZZATO */}
      {/* ========================================================================= */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#141514] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#BFFF00]/10 border border-[#BFFF00]/25 flex items-center justify-center text-[#BFFF00]">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nuovo Blocco Personalizzato</h3>
                  <p className="text-xs text-zinc-400">Aggiungi qualsiasi servizio o informazione al tuo Hub</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-white mb-1">Titolo Card (Obbligatorio)</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="es. Tour Virtuale 3D, Carta Vini Riserva, Prenota Lettino"
                  className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Sottotitolo / Didascalia</label>
                <input
                  type="text"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  placeholder="es. Esplora le sale interne a 360°"
                  className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Badge (Opzionale)</label>
                  <input
                    type="text"
                    value={customBadge}
                    onChange={(e) => setCustomBadge(e.target.value)}
                    placeholder="es. 3D, Novità, VIP, Info"
                    className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Dimensione Bento</label>
                  <select
                    value={customColSpan}
                    onChange={(e) => setCustomColSpan(Number(e.target.value) as 1 | 2)}
                    className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-white cursor-pointer"
                  >
                    <option value={1} className="bg-[#18181B]">1 Colonna (1x1 Compatta)</option>
                    <option value={2} className="bg-[#18181B]">2 Colonne (2x1 In Evidenza)</option>
                  </select>
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">Scegli l&apos;Icona</label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { name: 'Sparkles', icon: Sparkles },
                    { name: 'WhatsApp', icon: WhatsAppIcon },
                    { name: 'Instagram', icon: InstagramIcon },
                    { name: 'Wine', icon: Wine },
                    { name: 'Coffee', icon: Coffee },
                    { name: 'Music', icon: Music },
                    { name: 'Ticket', icon: Ticket },
                    { name: 'ShoppingBag', icon: ShoppingBag },
                    { name: 'Camera', icon: Camera },
                    { name: 'Heart', icon: Heart },
                    { name: 'Globe', icon: Globe },
                    { name: 'CalendarCheck', icon: CalendarCheck },
                    { name: 'HelpCircle', icon: HelpCircle },
                    { name: 'UtensilsCrossed', icon: UtensilsCrossed },
                  ].map((ic) => {
                    const IcComponent = ic.icon;
                    const isSelected = customIconName === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setCustomIconName(ic.name)}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#BFFF00]/15 border-[#BFFF00] text-[#BFFF00] shadow'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <IcComponent className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Type */}
              <div className="pt-2 border-t border-white/5">
                <label className="block text-xs font-bold text-white mb-2">Azione al Tap del Cliente</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setCustomActionType('link')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      customActionType === 'link'
                        ? 'bg-white/15 border-white text-white font-bold'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    <span className="block text-xs">Link Esterno</span>
                    <span className="text-[10px] text-zinc-400">TheFork, Spotify, TikTok, Sito Web</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomActionType('modal')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      customActionType === 'modal'
                        ? 'bg-white/15 border-white text-white font-bold'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    <span className="block text-xs">Popup Informativo</span>
                    <span className="text-[10px] text-zinc-400">Testo a comparsa, regole, orari, FAQ</span>
                  </button>
                </div>

                {customActionType === 'link' ? (
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">URL di Destinazione</label>
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white font-mono focus:outline-none focus:border-white"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Titolo Popup</label>
                      <input
                        type="text"
                        value={customModalTitle}
                        onChange={(e) => setCustomModalTitle(e.target.value)}
                        placeholder={customTitle || 'Titolo schermata'}
                        className="w-full min-h-[40px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Testo / Contenuto Informativo</label>
                      <textarea
                        rows={3}
                        value={customModalContent}
                        onChange={(e) => setCustomModalContent(e.target.value)}
                        placeholder="Descrivi in dettaglio le informazioni che vuoi mostrare ai tuoi ospiti..."
                        className="w-full bg-[#18181B] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleAddCustomModule}
                disabled={!customTitle.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#BFFF00] hover:bg-[#a8e000] text-black font-extrabold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Inserisci Blocco</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AI BRAND ARCHITECT (GENERATORE MAGICO IN 1-CLICK) */}
      {/* ========================================================================= */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#141514] border border-purple-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Brand Architect</h3>
                  <p className="text-xs text-zinc-400">Genera l&apos;identità ideale per il tuo locale in 1 click</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Descrivi il tuo locale in piena libertà</span>
                  <span className="text-[10px] text-purple-400 font-normal">Stile, atmosfera, colori, mood</span>
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="es. Club notturno cyberpunk con neon fucsia e cocktail bar sperimentale, oppure Trattoria toscana rustica con pietra a vista e brace..."
                  className="w-full bg-[#18181B] border border-white/15 focus:border-purple-500/60 rounded-2xl p-3.5 text-xs text-white focus:outline-none transition-all placeholder:text-zinc-500 shadow-inner resize-none"
                  disabled={aiGenerating}
                />
              </div>

              {/* Inspiration Chips */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-zinc-400 font-medium">Oppure prova un&apos;ispirazione rapida:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Cyberpunk & Neon', icon: Zap, text: 'Club notturno cyberpunk con luci neon fucsia, musica elettronica e cocktail sperimentali' },
                    { label: 'Fine Dining & Oro', icon: Crown, text: 'Ristorante di lusso fine dining con dettagli in oro, marmo nero e atmosfera riservata' },
                    { label: 'Trattoria Rustica', icon: UtensilsCrossed, text: 'Trattoria rustica toscana con forno a legna, pietra a vista, carne alla brace e vino rosso' },
                    { label: 'Lido & Mare', icon: Compass, text: 'Lido balneare estivo vista mare, azzurro e cocktail freschi sotto l\'ombrellone' },
                    { label: 'Birreria Artigianale', icon: Wine, text: 'Pub birreria artigianale con spine a vista, burger gourmet e tinte ambrate' },
                    { label: 'Minimal Zen & Bio', icon: Coffee, text: 'Bistrot minimal chiaro nordico con cucina biologica sana, bowls e piante' },
                  ].map((item, idx) => {
                    const ChipIcon = item.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAiPrompt(item.text)}
                        disabled={aiGenerating}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] bg-white/5 hover:bg-purple-950/30 text-zinc-300 hover:text-purple-200 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer"
                      >
                        <ChipIcon className="w-3 h-3 text-purple-400" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {aiGenerating && (
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center gap-2.5 text-purple-300 text-xs font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analisi stilistica ed elaborazione layout bento in corso...</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  disabled={aiGenerating}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateWithAiPrompt()}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generazione...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Genera Hub con AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CATALOGO HUB PRONTI ALL'USO & COMMUNITY */}
      {/* ========================================================================= */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className={`w-full ${previewingTemplate ? 'max-w-5xl' : 'max-w-4xl'} bg-[#121413] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden space-y-4 transition-all`}>
            {previewingTemplate ? (
              /* LIVE INTERACTIVE TEMPLATE PREVIEW */
              <div className="flex flex-col h-full space-y-4 max-h-[84vh]">
                {/* Preview Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewingTemplate(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Torna all&apos;Elenco</span>
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-white">
                          {previewingTemplate.name}
                        </h4>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/25">
                          {previewingTemplate.styleTag}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Design di <strong className="text-zinc-200">{previewingTemplate.author}</strong> — Modalità Anteprima dal Vivo
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(previewingTemplate)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-black" />
                      <span>Applica questo Hub</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewingTemplate(null);
                        setShowCatalogModal(false);
                      }}
                      className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Preview Content: Left Phone Simulator, Right Specs */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pr-1">
                  {/* Left Column: Phone Simulator Mockup */}
                  <div className="lg:col-span-6 flex flex-col items-center justify-center py-1">
                    <div className="text-[11px] font-bold text-sky-400 mb-2 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Simulatore Live (Tocca i moduli per testarli)</span>
                    </div>

                    {(() => {
                      const cfg = previewingTemplate.config;
                      const themeOpt = HUB_THEME_OPTIONS.find((t) => t.id === cfg.themeMode) || HUB_THEME_OPTIONS[0];
                      const fontOpt = HUB_FONT_OPTIONS.find((f) => f.id === cfg.fontFamily) || HUB_FONT_OPTIONS[0];
                      const isTplLight = cfg.themeMode === 'minimal_light';
                      const pColor = cfg.primaryColor || '#00F0FF';
                      const cText = getContrastColor(pColor);
                      const radiusClass = getBorderRadiusClass(cfg.borderRadius);
                      const radiusStyle = getBorderRadiusStyle(cfg.borderRadius);

                      const getTplCardClass = () => {
                        switch (cfg.cardStyle) {
                          case 'solid':
                            return isTplLight ? 'bg-white border border-slate-200 shadow-sm' : 'bg-[#181b19] border border-white/5 shadow-md';
                          case 'bordered':
                            return isTplLight ? 'bg-slate-50 border-2 border-slate-300' : 'bg-[#121413] border-2 border-white/20 shadow';
                          case 'neon':
                            return isTplLight ? 'bg-white border-2 border-sky-400/40 shadow-md' : 'bg-[#141715] border border-white/10 shadow-[0_0_15px_rgba(0,240,255,0.15)]';
                          case 'glass':
                          default:
                            return isTplLight ? 'bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-md' : 'bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-lg';
                        }
                      };

                      return (
                        <div
                          className="w-full max-w-[320px] sm:max-w-[340px] border-[8px] border-[#222624] rounded-[44px] p-3.5 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none"
                          style={{
                            minHeight: '580px',
                            maxHeight: '600px',
                            backgroundColor: themeOpt.bgHex,
                            color: themeOpt.textHex,
                            fontFamily: fontOpt.cssFamily,
                          }}
                        >
                          {/* Background Image / Gradient / Blur if configured */}
                          {cfg.bgType === 'image' && cfg.bgImageUrl && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={cfg.bgImageUrl}
                                alt="Sfondo Hub"
                                className="w-full h-full object-cover scale-105"
                                style={{ filter: `blur(${cfg.bgBlur || 8}px)` }}
                              />
                              <div
                                className="absolute inset-0 bg-black"
                                style={{ opacity: (cfg.bgOverlayOpacity ?? 50) / 100 }}
                              />
                            </div>
                          )}

                          {/* Top Status Bar */}
                          <div className="relative z-20 flex items-center justify-between mb-2 px-1">
                            <span className={`text-[10px] font-mono font-bold ${isTplLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                              12:45
                            </span>
                            <div className="w-16 h-3 bg-black rounded-full border border-white/10 shadow-inner" />
                            <div
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-bold font-mono ${
                                isTplLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{cfg.tableLiveTag || 'NFC LIVE'}</span>
                            </div>
                          </div>

                          {/* Scrollable Phone Content */}
                          <div className="relative z-10 flex-1 overflow-y-auto pr-0.5 space-y-2.5 scrollbar-none">
                            {/* Table Badge */}
                            <div
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 border backdrop-blur-md ${radiusClass} ${
                                isTplLight ? 'bg-white/80 border-slate-200 text-slate-800' : 'bg-black/30 border-white/10 text-white'
                              }`}
                              style={radiusStyle}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pColor }} />
                                <span className="text-[10px] font-bold tracking-tight">
                                  {cfg.tableBadgeLabel || 'Tavolo Riservato'}
                                </span>
                              </div>
                              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-semibold">
                                TAVOLO 1
                              </span>
                            </div>

                            {/* Hero Card */}
                            {cfg.hero && cfg.hero.enabled !== false && (
                              <div
                                className={`${radiusClass} p-3 flex flex-col justify-between min-h-[90px] shadow-lg relative overflow-hidden text-left`}
                                style={{
                                  backgroundColor: pColor,
                                  color: cText,
                                  boxShadow: cfg.buttonGlow !== false ? `0 6px 20px ${pColor}40` : 'none',
                                  ...radiusStyle,
                                }}
                              >
                                <div className="relative z-10">
                                  {cfg.hero.badgeText && (
                                    <span
                                      className={`inline-block text-[8px] font-extrabold uppercase px-1.5 py-0.5 ${radiusClass} bg-black/20 mb-1`}
                                      style={radiusStyle}
                                    >
                                      {cfg.hero.badgeText}
                                    </span>
                                  )}
                                  <h4 className="text-xs sm:text-sm font-black uppercase leading-tight truncate">
                                    {cfg.hero.title || 'Menù Digitale'}
                                  </h4>
                                  <p className="text-[10px] font-semibold opacity-90 truncate mt-0.5">
                                    {cfg.hero.subtitle || 'Esplora i nostri piatti'}
                                  </p>
                                </div>
                                <div className="relative z-10 self-end mt-1">
                                  <div
                                    className={`w-6 h-6 ${radiusClass} bg-black/15 flex items-center justify-center`}
                                    style={radiusStyle}
                                  >
                                    <UtensilsCrossed className="w-3.5 h-3.5" style={{ color: cText }} />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Bento Grid Modules */}
                            <div className="grid grid-cols-2 gap-2">
                              {cfg.modules
                                .filter((m) => m.enabled)
                                .map((m) => {
                                  const isFull = m.colSpan === 2;
                                  const ModIcon = getModuleIcon(m.id, m.iconName);
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => {
                                        setPreviewModuleToast(`Modulo: ${m.title}`);
                                        setTimeout(() => setPreviewModuleToast(null), 2000);
                                      }}
                                      className={`${isFull ? 'col-span-2' : 'col-span-1'} ${radiusClass} p-2.5 flex flex-col justify-between ${
                                        cfg.cardDensity === 'compact' ? 'min-h-[82px]' : 'min-h-[96px]'
                                      } transition-transform active:scale-95 text-left relative overflow-hidden ${getTplCardClass()}`}
                                      style={{
                                        ...radiusStyle,
                                        ...(m.cardColor ? { borderColor: `${m.cardColor}50` } : {}),
                                      }}
                                    >
                                      <div className="flex items-start justify-between w-full mb-1">
                                        <div
                                          className={`w-6 h-6 ${radiusClass} flex items-center justify-center ${
                                            isTplLight ? 'bg-slate-100 text-slate-800' : 'bg-white/10 text-white'
                                          }`}
                                          style={radiusStyle}
                                        >
                                          <ModIcon className="w-3.5 h-3.5" style={{ color: pColor }} />
                                        </div>
                                        {m.badge && (
                                          <span
                                            className={`text-[8px] font-bold px-1.5 py-0.5 ${radiusClass} ${
                                              isTplLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-zinc-300'
                                            }`}
                                            style={radiusStyle}
                                          >
                                            {m.badge}
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        <h5 className={`text-[11px] font-bold truncate leading-tight ${isTplLight ? 'text-slate-900' : 'text-white'}`}>
                                          {m.title}
                                        </h5>
                                        {m.subtitle && (
                                          <p className={`text-[9px] truncate mt-0.5 ${isTplLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                                            {m.subtitle}
                                          </p>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                            </div>

                            {/* Review Banner */}
                            <div
                              className={`${radiusClass} p-2 relative z-10 border text-center ${getTplCardClass()}`}
                              style={radiusStyle}
                            >
                              <span className="text-[9px] font-bold block mb-1">Valuta l&apos;Esperienza</span>
                              <div className="flex items-center justify-center gap-1 text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Bottom Dock Bar if enabled */}
                          {cfg.showBottomDock !== false && (
                            <div className="relative z-20 pt-2">
                              <div
                                className={`flex items-center justify-around py-1.5 px-3 rounded-full border shadow-md ${
                                  isTplLight ? 'bg-white/95 border-slate-200 text-slate-700' : 'bg-black/60 border-white/10 text-zinc-300'
                                }`}
                              >
                                <span className="text-[9px] font-bold">Home</span>
                                <span className="text-[9px] font-bold">Menù</span>
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center -mt-3 shadow-md"
                                  style={{ backgroundColor: pColor, color: cText }}
                                >
                                  <BellRing className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[9px] font-bold">Info</span>
                                <span className="text-[9px] font-bold">Share</span>
                              </div>
                            </div>
                          )}

                          {/* Toast overlay inside phone */}
                          {previewModuleToast && (
                            <div className="absolute top-10 inset-x-4 z-50 bg-black/90 border border-sky-400/50 text-white text-[10px] font-bold py-1.5 px-3 rounded-xl text-center shadow-lg animate-fade-in">
                              {previewModuleToast}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right Column: Template Specifications & Apply Action */}
                  <div className="lg:col-span-6 space-y-4 py-2">
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Specifiche del Design</span>
                        <h4 className="text-lg font-black text-white mt-0.5">{previewingTemplate.name}</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed mt-1">{previewingTemplate.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">Font Tipografico</span>
                          <span className="font-extrabold text-white mt-0.5 block capitalize">{previewingTemplate.config.fontFamily}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">Stile Card</span>
                          <span className="font-extrabold text-white mt-0.5 block capitalize">{previewingTemplate.config.cardStyle}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">Tema & Contrasto</span>
                          <span className="font-extrabold text-white mt-0.5 block capitalize">{previewingTemplate.config.themeMode}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">Angoli Bordo</span>
                          <span className="font-extrabold text-white mt-0.5 block capitalize">{previewingTemplate.config.borderRadius || '2xl'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-zinc-400">Colore Primario d&apos;Accento:</span>
                        <div
                          className="w-5 h-5 rounded-full border border-white/40 shadow-sm"
                          style={{ backgroundColor: previewingTemplate.preview.primaryColor }}
                        />
                        <span className="text-xs font-mono font-bold text-white">
                          {previewingTemplate.preview.primaryColor}
                        </span>
                      </div>
                    </div>

                    {/* Notice Box */}
                    <div className="bg-sky-500/10 border border-sky-500/25 rounded-2xl p-3.5 flex items-start gap-2.5 text-sky-200 text-xs">
                      <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">Nessuna modifica è stata ancora salvata.</p>
                        <p className="text-[11px] text-sky-300/80 leading-relaxed">
                          Puoi esplorare questo mockup senza alcun rischio. Se decidi di applicarlo, potrai comunque personalizzarlo ulteriormente in qualsiasi momento.
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate(previewingTemplate)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-black text-sm shadow-xl transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-black" />
                        <span>Applica questo Hub al Tuo Locale</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewingTemplate(null)}
                        className="w-full py-2.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Torna all&apos;Elenco dei Design
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* CATALOG TEMPLATES LIST */
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <span>Catalogo Hub Pronti all&apos;Uso & Community</span>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-extrabold border border-sky-500/30">
                          {catalogTemplates.length} Design
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Scegli un Hub d&apos;autore già pronto per il tuo locale oppure condividi il tuo design con la community
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShareTplName(`${name || 'Locale'} Signature`);
                        setShareTplAuthor(name || 'Creatore RIVO');
                        setShowShareCatalogModal(true);
                      }}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all active:scale-95 touch-press cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Condividi il Tuo Hub</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCatalogModal(false)}
                      className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder="Cerca template per nome, stile, autore o parole chiave..."
                        className="w-full bg-[#18181B] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShareTplName(`${name || 'Locale'} Signature`);
                        setShareTplAuthor(name || 'Creatore RIVO');
                        setShowShareCatalogModal(true);
                      }}
                      className="sm:hidden inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Condividi</span>
                    </button>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { id: 'all', label: 'Tutti i Design', icon: Globe },
                      { id: 'luxury', label: 'Luxury & Fine Dining', icon: Crown },
                      { id: 'nightlife', label: 'Cocktail & Speakeasy', icon: Wine },
                      { id: 'pizzeria', label: 'Pizzeria Contemporanea', icon: UtensilsCrossed },
                      { id: 'bistrot', label: 'Bistrot & Brunch', icon: Coffee },
                      { id: 'cyberpunk', label: 'Cyberpunk Lounge', icon: Zap },
                      { id: 'beach', label: 'Beach Club', icon: Compass },
                      { id: 'hotel', label: 'Boutique Hotel', icon: Building },
                    ].map((f) => {
                      const FilterIcon = f.icon;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setCatalogFilter(f.id)}
                          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                            catalogFilter === f.id
                              ? 'bg-sky-500 text-black font-bold shadow'
                              : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                          }`}
                        >
                          <FilterIcon className="w-3.5 h-3.5" />
                          <span>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scrollable Templates Grid */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[58vh]">
                  {(() => {
                    const filtered = catalogTemplates.filter((t) => {
                      const matchesSearch =
                        !catalogSearch.trim() ||
                        t.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                        t.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                        t.author.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                        t.styleTag.toLowerCase().includes(catalogSearch.toLowerCase());

                      let matchesCategory = true;
                      if (catalogFilter === 'luxury') matchesCategory = t.styleTag.toLowerCase().includes('luxury') || t.styleTag.toLowerCase().includes('fine');
                      else if (catalogFilter === 'nightlife') matchesCategory = t.styleTag.toLowerCase().includes('jazz') || t.styleTag.toLowerCase().includes('cocktail') || t.styleTag.toLowerCase().includes('speakeasy');
                      else if (catalogFilter === 'pizzeria') matchesCategory = t.styleTag.toLowerCase().includes('pizz');
                      else if (catalogFilter === 'bistrot') matchesCategory = t.styleTag.toLowerCase().includes('bistrot') || t.styleTag.toLowerCase().includes('brunch');
                      else if (catalogFilter === 'cyberpunk') matchesCategory = t.styleTag.toLowerCase().includes('cyber') || t.styleTag.toLowerCase().includes('lounge');
                      else if (catalogFilter === 'beach') matchesCategory = t.styleTag.toLowerCase().includes('beach') || t.styleTag.toLowerCase().includes('sunset');
                      else if (catalogFilter === 'hotel') matchesCategory = t.styleTag.toLowerCase().includes('hotel') || t.styleTag.toLowerCase().includes('suite');

                      return matchesSearch && matchesCategory;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-zinc-500 space-y-2">
                          <p className="text-sm">Nessun template corrisponde ai filtri selezionati.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setCatalogFilter('all');
                              setCatalogSearch('');
                            }}
                            className="text-xs text-sky-400 font-bold underline"
                          >
                            Azzera i filtri
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filtered.map((tpl) => {
                          return (
                            <div
                              key={tpl.id}
                              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-sky-500/30 transition-all flex flex-col justify-between space-y-3 group"
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/25 mb-1">
                                      {tpl.styleTag}
                                    </span>
                                    <h4 className="text-sm sm:text-base font-extrabold text-white group-hover:text-sky-200 transition-colors">
                                      {tpl.name}
                                    </h4>
                                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                                      Creato da <strong className="text-zinc-200">{tpl.author}</strong>
                                    </span>
                                  </div>

                                  <div
                                    className="w-8 h-8 rounded-full border-2 shadow-md shrink-0"
                                    style={{
                                      backgroundColor: tpl.preview.primaryColor,
                                      borderColor: '#ffffff',
                                    }}
                                    title={`Colore primario: ${tpl.preview.primaryColor}`}
                                  />
                                </div>

                                <p className="text-[11px] text-zinc-300 line-clamp-3 leading-relaxed">
                                  {tpl.description}
                                </p>

                                {/* Badges preview */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-zinc-400">
                                    Font: <strong className="text-zinc-200">{tpl.preview.fontFamily}</strong>
                                  </span>
                                  <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-zinc-400">
                                    Card: <strong className="text-zinc-200">{tpl.preview.cardStyle}</strong>
                                  </span>
                                  <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-zinc-400">
                                    Tema: <strong className="text-zinc-200">{tpl.preview.themeMode}</strong>
                                  </span>
                                </div>

                                {/* Modules included preview */}
                                {tpl.preview.modulesPreview && tpl.preview.modulesPreview.length > 0 && (
                                  <div className="text-[10px] text-zinc-400 pt-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="text-zinc-500">Include:</span>
                                    {tpl.preview.modulesPreview.slice(0, 4).map((modName, mIdx) => (
                                      <span key={mIdx} className="text-zinc-300 font-medium bg-black/30 px-1.5 py-0.2 rounded border border-white/5">
                                        {modName}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Footer with Preview and Apply Buttons */}
                              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                                  <span>{tpl.likesCount} preferiti</span>
                                </span>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewingTemplate(tpl)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer border border-white/10"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                                    <span>Prova Anteprima</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleApplyTemplate(tpl)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                                  >
                                    <Zap className="w-3.5 h-3.5 fill-black" />
                                    <span>Applica</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Modal Bottom Footer */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quando applichi un template puoi modificarlo a tuo piacimento e salvarlo.</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCatalogModal(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Chiudi
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CONDIVIDI IL TUO HUB NEL CATALOGO DELLA COMMUNITY */}
      {/* ========================================================================= */}
      {showShareCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#131514] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Condividi nel Catalogo</h3>
                  <p className="text-xs text-zinc-400">Fai entrare il tuo Hub nel catalogo pubblico</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareCatalogModal(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Nome del Design / Template</label>
                <input
                  type="text"
                  value={shareTplName}
                  onChange={(e) => setShareTplName(e.target.value)}
                  placeholder="es. Positano Dream Signature"
                  className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Nome Autore o Locale</label>
                <input
                  type="text"
                  value={shareTplAuthor}
                  onChange={(e) => setShareTplAuthor(e.target.value)}
                  placeholder={name || 'Il tuo nome o nome del locale'}
                  className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Etichetta di Stile</label>
                <select
                  value={shareTplStyle}
                  onChange={(e) => setShareTplStyle(e.target.value)}
                  className="w-full min-h-[42px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-amber-500/60 cursor-pointer"
                >
                  <option value="Luxury & Fine Dining">Luxury & Fine Dining</option>
                  <option value="Cocktail & Speakeasy">Cocktail & Speakeasy</option>
                  <option value="Pizzeria Contemporanea">Pizzeria Contemporanea</option>
                  <option value="Bistrot & Brunch">Bistrot & Brunch</option>
                  <option value="Cyberpunk Lounge">Cyberpunk Lounge</option>
                  <option value="Sunset Beach Club">Sunset Beach Club</option>
                  <option value="Boutique Hotel & Spa">Boutique Hotel & Spa</option>
                  <option value="Tradizione & Rustico">Tradizione & Rustico</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Descrizione del Concept</label>
                <textarea
                  rows={3}
                  value={shareTplDesc}
                  onChange={(e) => setShareTplDesc(e.target.value)}
                  placeholder="Descrivi l'atmosfera, i punti di forza e le scelte visive del tuo Hub..."
                  className="w-full bg-[#18181B] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 resize-none"
                />
              </div>

              {/* Current Configuration Summary */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  Caratteristiche che verranno condivise:
                </span>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: hubConfig.primaryColor }} />
                    {hubConfig.primaryColor}
                  </span>
                  <span>•</span>
                  <span>Font: {hubConfig.fontFamily}</span>
                  <span>•</span>
                  <span>Card: {hubConfig.cardStyle}</span>
                  <span>•</span>
                  <span>{hubConfig.modules.filter((m) => m.enabled).length} Moduli attivi</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowShareCatalogModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  disabled={shareSubmitting}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleShareCurrentHub}
                  disabled={shareSubmitting || !shareTplName.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {shareSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Pubblicazione...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Pubblica nel Catalogo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Stand & NFC Print Generator Modal */}
      <TableStandPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        name={name}
        logoUrl={logoUrl}
        category={category}
        hubConfig={hubConfig}
        devices={devices}
        selectedDeviceCode={selectedDeviceCode}
      />

    </div>
  );
}

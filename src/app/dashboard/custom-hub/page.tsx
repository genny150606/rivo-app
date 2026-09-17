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
} from 'lucide-react';
import { HUB_COLOR_PRESETS, DEFAULT_HUB_COLOR, getContrastColor } from '@/lib/palettes';
import { BusinessCategory, HubMode } from '@/lib/types';
import { getCategoryDefinition } from '@/lib/categories';

interface DeviceOption {
  id: string;
  name: string;
  unique_code: string;
}

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

  // 1. Palette & Theme
  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_HUB_COLOR);

  // 2. Brand & Identity
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('restaurant');

  // 3. Hero Card (Top-Left)
  const [heroTitle, setHeroTitle] = useState('Menù Digitale');
  const [heroSubtitle, setHeroSubtitle] = useState('Piatti, prezzi & vini');
  const [heroDestinationType, setHeroDestinationType] = useState<'in_app' | 'external'>('in_app');
  const [lunchUrl, setLunchUrl] = useState('');

  // 4. In-Store Table Services (2x3 Grid Modules)
  const [callEnabled, setCallEnabled] = useState(true);
  const [sommelierEnabled, setSommelierEnabled] = useState(true);
  const [aiMenuContext, setAiMenuContext] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [loyaltyRewardText, setLoyaltyRewardText] = useState('10% di sconto al 10° timbro');

  // Telegram Staff Alerts for Waiter Calls
  const [telegramAlertsEnabled, setTelegramAlertsEnabled] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);

  // 5. Review Shield & Promo Banner
  const [reviewShieldEnabled, setReviewShieldEnabled] = useState(true);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [customCtaLabel, setCustomCtaLabel] = useState('');
  const [customCtaUrl, setCustomCtaUrl] = useState('');

  // 6. Direct Contact & Assistance
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [website, setWebsite] = useState('');

  // Active Tab for Studio Controls
  const [activeTab, setActiveTab] = useState<'theme' | 'hero' | 'services' | 'reviews' | 'contacts'>('theme');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  // Contextual Glass Shimmer Animation for Simulator Mockup
  const [isShimmering, setIsShimmering] = useState(false);
  const [shimmerKey, setShimmerKey] = useState(0);
  const isInitialLoadDone = useRef(false);

  // Trigger Glass Shimmer Effect on color palette or logo change
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
  }, [primaryColor, logoUrl, loading]);

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

        // Fetch Org data
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
          setCategory((org.category || 'restaurant') as BusinessCategory);
          setPrimaryColor(org.primary_color || DEFAULT_HUB_COLOR);

          // Hero customization
          setHeroTitle(org.custom_cta_label && org.hub_mode === 'direct' ? org.custom_cta_label : 'Menù Digitale');
          setHeroSubtitle('Piatti, prezzi & vini');
          setHeroDestinationType(org.lunch_destination_url ? 'external' : 'in_app');
          setLunchUrl(org.lunch_destination_url || '');

          // Services
          setWifiSsid(org.wifi_ssid || '');
          setWifiPassword(org.wifi_password || '');
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

  // Save All Custom Hub Settings
  const handleSave = async () => {
    if (!orgId) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: (name || '').trim(),
          logo_url: (logoUrl || '').trim() || null,
          description: (description || '').trim() || null,
          primary_color: primaryColor || DEFAULT_HUB_COLOR,
          custom_cta_label: (customCtaLabel || '').trim() || null,
          custom_cta_url: (customCtaUrl || '').trim() || null,
          lunch_destination_url: heroDestinationType === 'external' ? (lunchUrl || '').trim() || null : null,
          wifi_ssid: (wifiSsid || '').trim() || null,
          wifi_password: (wifiPassword || '').trim() || null,
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore durante il salvataggio';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

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
          text: `🔔 [TEST NOTIFICA RIVO STAFF]\n\n• Locale: ${name || 'La tua attività'}\n• Stato: Connessione Bot Telegram attiva con successo!\n• Chiamate Cameriere: Pronte a essere ricevute in tempo reale.`,
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

  const contrastText = getContrastColor(primaryColor);
  const catDef = getCategoryDefinition(category);
  const CatIcon = catDef.icon;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-[#BFFF00] animate-spin" />
        <p className="text-zinc-400 text-xs font-medium">Caricamento Custom Hub Studio...</p>
      </div>
    );
  }

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

        <div className="flex items-center gap-2.5 shrink-0">
          {selectedDeviceCode && (
            <a
              href={`/hub/${selectedDeviceCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700 transition-all active:scale-95 touch-press shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Apri Hub Reale</span>
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
          onClick={() => setMobileView('editor')}
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
          onClick={() => setMobileView('preview')}
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
          
          {/* Studio Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-[#121214] border border-white/10 rounded-2xl overflow-x-auto scrollbar-none snap-x snap-mandatory touch-pan-x">
            {[
              { id: 'theme', label: 'Palette & Tema', icon: Palette },
              { id: 'hero', label: 'Tasto Hero', icon: Sparkles },
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
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
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

          {/* TAB 1: PALETTE & THEME */}
          {activeTab === 'theme' && (
            <div className="rounded-3xl border border-white/10 bg-[#121413] p-5 sm:p-6 space-y-5 shadow-xl animate-fade-in">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>Palette di Colori & Atmosfera dell&apos;Hub</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Seleziona il colore di spicco che caratterizza il tuo locale. Questo colore illumina il primo tasto hero, le icone, il pulsante centrale di chiamata e i bagliori d&apos;atmosfera.
                </p>
              </div>

              {/* Color Preset Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {HUB_COLOR_PRESETS.map((p) => {
                  const isSelected = primaryColor.toUpperCase() === p.primary.toUpperCase();
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPrimaryColor(p.primary)}
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
                        {p.id === 'lime' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white font-mono">
                            Foto
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                      <span className="text-[10px] text-zinc-500 block truncate">{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Picker */}
              <div className="p-4 rounded-2xl bg-[#181b19] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Colore Brand Personalizzato</span>
                  <span className="text-[11px] text-zinc-400">Inserisci il codice HEX esatto del tuo logo o brand</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={primaryColor.startsWith('#') ? primaryColor : '#B4F02A'}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#B4F02A"
                    className="w-28 min-h-[38px] bg-[#121214] border border-white/10 rounded-xl px-3 text-xs text-white font-mono uppercase focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              {/* Brand Logo & Name */}
              <div className="pt-2 border-t border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-white">Identità & Logo nel Mockup</h3>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="shrink-0 relative group">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt="Logo"
                        onError={() => console.warn('Logo image failed to load:', logoUrl)}
                        className="w-16 h-16 rounded-full object-cover border-2 shadow-lg bg-black transition-all"
                        style={{ borderColor: primaryColor }}
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg text-black transition-all"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <CatIcon className="w-8 h-8" style={{ color: contrastText }} />
                      </div>
                    )}
                    {logoUrl && (
                      <span
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#121413] flex items-center justify-center text-[10px] text-black font-black shadow"
                        title="Logo attivo"
                      >
                        ✓
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

          {/* TAB 2: HERO ACTION CARD */}
          {activeTab === 'hero' && (
            <div className="rounded-3xl border border-white/10 bg-[#121413] p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>Personalizzazione del Tasto Hero (In Alto a Sinistra)</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  È il pulsante più visibile dell&apos;Hub con sfondo a tutto colore. Configura cosa apre quando il cliente lo tocca.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Titolo del Pulsante Hero</label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="es. Menù Digitale, Prenota Taglio, Ordina al Tavolo"
                    className="w-full min-h-[44px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Sottotitolo / Didascalia</label>
                  <input
                    type="text"
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    placeholder="es. Piatti, prezzi & vini oppure Sfoglia"
                    className="w-full min-h-[44px] bg-[#18181B] border border-white/10 rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Destinazione al Click</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setHeroDestinationType('in_app')}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        heroDestinationType === 'in_app'
                          ? 'bg-white/10 border-white text-white shadow-lg'
                          : 'bg-[#18181B] border-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-white block mb-0.5">Menù Digitale In-App</span>
                      <span className="text-[11px] text-zinc-500 block">Apre il menù interattivo con ricerca piatti, prezzi e categorie</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHeroDestinationType('external')}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        heroDestinationType === 'external'
                          ? 'bg-white/10 border-white text-white shadow-lg'
                          : 'bg-[#18181B] border-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-white block mb-0.5">Link Esterno o File PDF</span>
                      <span className="text-[11px] text-zinc-500 block">Reindirizza a un link personalizzato o carta menù esterna</span>
                    </button>
                  </div>
                </div>

                {heroDestinationType === 'external' && (
                  <div className="p-3.5 rounded-2xl bg-[#181b19] border border-white/5 space-y-2 animate-fade-in">
                    <label className="block text-xs font-medium text-zinc-300">URL Destinazione Menù / PDF</label>
                    <input
                      type="url"
                      value={lunchUrl}
                      onChange={(e) => setLunchUrl(e.target.value)}
                      placeholder="https://tuosito.it/menu.pdf"
                      className="w-full min-h-[42px] bg-[#121214] border border-white/10 rounded-xl px-3.5 text-xs text-white font-mono focus:outline-none focus:border-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TABLE SERVICES */}
          {activeTab === 'services' && (
            <div className="rounded-3xl border border-white/10 bg-[#121413] p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>Servizi Rapidi al Tavolo (Griglia 2x3)</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Configura le card della griglia per offrire servizi immediati e connessione ai clienti.
                </p>
              </div>

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

                {/* Telegram Integration Toggle & Fields */}
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
                        <span className="text-[10px] text-zinc-400">
                          💡 Crea il bot gratis in 30 secondi su Telegram cercando <strong>@BotFather</strong>, invia <code>/newbot</code> e copia il token generato.
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

              {/* Wi-Fi Settings */}
              <div className="p-4 rounded-2xl bg-[#181b19] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Wifi className="w-4 h-4 text-sky-400" />
                  <span>Wi-Fi Ospiti (Connessione 1-Tap)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Nome Rete Wi-Fi (SSID)</label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="es. BarCentrale_Guest"
                      className="w-full min-h-[40px] bg-[#121214] border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Password Wi-Fi</label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="es. estate2026"
                      className="w-full min-h-[40px] bg-[#121214] border border-white/10 rounded-xl px-3 text-xs text-white font-mono focus:outline-none focus:border-white"
                    />
                  </div>
                </div>
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

          {/* TAB 4: REVIEWS & PROMO */}
          {activeTab === 'reviews' && (
            <div className="rounded-3xl border border-white/10 bg-[#121413] p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5" style={{ color: primaryColor }} />
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

          {/* TAB 5: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="rounded-3xl border border-white/10 bg-[#121413] p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                  <span>Contatti & Assistenza Rapida al Tavolo</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Questi canali appaiono quando i clienti premono il tasto Info nel loro Hub o hanno bisogno di contattare il personale.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Diretto del Locale
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
                    <ExternalLink className="w-3.5 h-3.5 text-violet-400" /> Sito Web Ufficiale
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
        {/* RIGHT COLUMN: STICKY REAL-TIME SMARTPHONE MOCKUP (Inspired by reference photo) */}
        {/* ========================================================================= */}
        <div className={`lg:col-span-5 flex flex-col items-center sticky top-6 ${mobileView === 'editor' ? 'hidden lg:flex' : 'flex'}`}>
          
          <div className="flex items-center justify-between w-full max-w-[340px] sm:max-w-[360px] px-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Eye className="w-3.5 h-3.5 text-[#BFFF00]" />
              <span>Anteprima Live Hub</span>
            </div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
              Aggiornamento Real-time
            </span>
          </div>

          {/* Realistic Smartphone Frame on Marble/Dark Aura */}
          <div
            className="w-full max-w-[340px] sm:max-w-[360px] bg-[#0c0f0d] border-[8px] border-[#222624] rounded-[48px] p-4 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col justify-between select-none"
            style={{ minHeight: '640px' }}
          >
            {/* Ambient inner glow based on chosen primary color */}
            <div
              className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-48 blur-[80px] rounded-full pointer-events-none opacity-30"
              style={{ backgroundColor: primaryColor }}
            />

            {/* Glass Shimmer Effect (Translucent diagonal light bar feedback on color or logo change) */}
            {isShimmering && (
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-[40px]">
                <div
                  key={shimmerKey}
                  className="w-1/2 h-[200%] -top-1/2 absolute bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer-slide pointer-events-none"
                  style={{ animationDuration: '1.4s' }}
                />
              </div>
            )}

            {/* Top Status Bar: Clock + Centered Dynamic Island + LIVE SIMULATOR Badge */}
            <div className="relative z-20 flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-mono text-zinc-400 font-bold tracking-tight">
                12:45
              </span>

              {/* Dynamic Island / Notch */}
              <div className="w-20 h-3.5 bg-black rounded-full flex items-center justify-end px-2 border border-white/5 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1c221e]" />
              </div>

              {/* Badge "LIVE SIMULATOR" with synchronized pulsating green dot */}
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 backdrop-blur-md shadow-sm"
                title="Anteprima 1:1 sincronizzata con l'esperienza tavolo reale"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[8px] font-black tracking-wider text-emerald-400 uppercase font-mono leading-none">
                  LIVE SIMULATOR
                </span>
              </div>
            </div>

            {/* Hub Header inside Mockup */}
            <div className="flex items-center justify-between gap-2 relative z-10 mb-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-9 h-9 rounded-full object-cover border shadow-sm bg-black"
                    style={{ borderColor: primaryColor }}
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-black"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <CatIcon className="w-4 h-4" style={{ color: contrastText }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-white truncate leading-none">
                    {name || 'Nome Attività'}
                  </h4>
                  <div className="flex items-center gap-1 text-[9px] text-zinc-400 mt-0.5">
                    <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
                    <span className="truncate">{devices[0]?.name || 'Tavolo 1'} • RIVO</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-7 h-7 rounded-full bg-[#181b19] border border-white/10 flex items-center justify-center relative">
                  <BellRing className="w-3.5 h-3.5 text-zinc-300" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>
              </div>
            </div>

            {/* 2x3 Squircle Cards Grid inside Mockup */}
            <div className="grid grid-cols-2 gap-2.5 relative z-10 mb-3 flex-1 content-start">
              {/* HERO HIGHLIGHT CARD */}
              <div
                className="rounded-2xl p-3 flex flex-col justify-between min-h-[95px] shadow-lg transition-all"
                style={{
                  backgroundColor: primaryColor,
                  color: contrastText,
                  boxShadow: `0 8px 20px ${primaryColor}35`,
                }}
              >
                <div className="w-8 h-8 rounded-xl bg-black/15 flex items-center justify-center mb-1">
                  <UtensilsCrossed className="w-4 h-4" style={{ color: contrastText }} />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-tight block leading-tight truncate">
                    {heroTitle || 'Menù Digitale'}
                  </span>
                  <span className="text-[9px] font-semibold opacity-85 block truncate">
                    {heroSubtitle || 'Piatti & vini'}
                  </span>
                </div>
              </div>

              {/* TILE 2: CHIAMA SALA */}
              <div className="rounded-2xl bg-[#161816]/95 border border-white/[0.08] p-3 flex flex-col justify-between min-h-[95px] shadow">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-1">
                  <BellRing className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-white block leading-tight truncate">
                    Chiama Sala
                  </span>
                  <span className="text-[9px] text-zinc-400 block truncate">Cameriere o conto</span>
                </div>
              </div>

              {/* TILE 3: AI SOMMELIER */}
              <div className="rounded-2xl bg-[#161816]/95 border border-white/[0.08] p-3 flex flex-col justify-between min-h-[95px] shadow">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-1">
                  <Wine className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-white block leading-tight truncate">
                    AI Sommelier
                  </span>
                  <span className="text-[9px] text-zinc-400 block truncate">Consigli abbinamento</span>
                </div>
              </div>

              {/* TILE 4: WI-FI */}
              <div className="rounded-2xl bg-[#161816]/95 border border-white/[0.08] p-3 flex flex-col justify-between min-h-[95px] shadow">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-1">
                  <Wifi className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-white block leading-tight truncate">
                    Wi-Fi Ospiti
                  </span>
                  <span className="text-[9px] text-zinc-400 block truncate">Accesso 1-tap</span>
                </div>
              </div>

              {/* TILE 5: RUOTA PREMI */}
              <div className="rounded-2xl bg-[#161816]/95 border border-white/[0.08] p-3 flex flex-col justify-between min-h-[95px] shadow">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-1">
                  <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-white block leading-tight truncate">
                    Ruota Premi
                  </span>
                  <span className="text-[9px] text-zinc-400 block truncate">Gira & vinci</span>
                </div>
              </div>

              {/* TILE 6: CARTA FEDELTÀ */}
              <div className="rounded-2xl bg-[#161816]/95 border border-white/[0.08] p-3 flex flex-col justify-between min-h-[95px] shadow">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-1">
                  <CreditCard className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-white block leading-tight truncate">
                    Carta Fedeltà
                  </span>
                  <span className="text-[9px] text-zinc-400 block truncate">Raccolta timbri</span>
                </div>
              </div>
            </div>

            {/* Review Shield inside Mockup */}
            <div
              className="rounded-2xl border border-white/[0.08] bg-[#161816] p-2.5 mb-2 relative z-10"
              style={{ boxShadow: `0 4px 15px ${primaryColor}15` }}
            >
              <div className="flex items-center justify-between mb-1 text-[10px] font-bold text-white">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  Valuta Esperienza
                </span>
                <span className="text-[9px] text-zinc-400">1-Tap</span>
              </div>
              <div className="flex items-center justify-around py-1 bg-black/40 rounded-xl">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>

            {/* Docked Bottom Bar inside Mockup */}
            <div className="relative z-10 pt-1">
              <div className="bg-[#141715]/95 border border-white/10 rounded-full px-3 py-1.5 flex items-center justify-between shadow-xl">
                <span className="text-[8px] text-zinc-400">Home</span>
                <span className="text-[8px] text-zinc-400">Menù</span>
                {/* Elevated Circle FAB */}
                <div
                  className="w-8 h-8 -mt-4 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: primaryColor,
                    color: contrastText,
                    boxShadow: `0 4px 12px ${primaryColor}60`,
                  }}
                >
                  <BellRing className="w-3.5 h-3.5" />
                </div>
                <span className="text-[8px] text-zinc-400">Info</span>
                <span className="text-[8px] text-zinc-400">Share</span>
              </div>
            </div>

            {/* Home Indicator Bar */}
            <div className="w-24 h-1 bg-zinc-600 rounded-full mx-auto mt-2 opacity-50" />
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
    </div>
  );
}

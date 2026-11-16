'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Save,
  Check,
  ShieldCheck,
  Clock,
  Utensils,
  Link2,
  AlertCircle,
  RefreshCw,
  Send,
  Wifi,
  Wine,
  Sliders,
  Compass,
  Layers,
  Building2,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  ArrowUpRight,
  Palette,
  Smartphone,
} from 'lucide-react';
import { HUB_COLOR_PRESETS, getContrastColor } from '@/lib/palettes';
import { BusinessCategory, HubMode } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import { PageHeader, StatusBadge, SurfaceCard } from '@/components/ui';

export default function ProfilePage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Org ID
  const [orgId, setOrgId] = useState<string | null>(null);

  // Logo State
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoSuccess, setLogoSuccess] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Hub Color Theme State
  const [primaryColor, setPrimaryColor] = useState('#B4F02A');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [reviewUrl, setReviewUrl] = useState('');
  const [reviewShieldEnabled, setReviewShieldEnabled] = useState(true);

  // Category & Hub Configuration Fields
  const [category, setCategory] = useState<BusinessCategory>('restaurant');
  const [hubMode, setHubMode] = useState<HubMode>('hub');
  const [customCtaLabel, setCustomCtaLabel] = useState('');
  const [customCtaUrl, setCustomCtaUrl] = useState('');
  const [cityGuideText, setCityGuideText] = useState('');

  // Smart Routing Fields
  const [smartRoutingEnabled, setSmartRoutingEnabled] = useState(false);
  const [lunchUrl, setLunchUrl] = useState('');
  const [lunchStart, setLunchStart] = useState('12:00');
  const [lunchEnd, setLunchEnd] = useState('15:30');

  // Telegram Alerts Fields
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramAlertsEnabled, setTelegramAlertsEnabled] = useState(false);

  // Wi-Fi Guest Fields
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');

  // AI Menu Context
  const [aiMenuContext, setAiMenuContext] = useState('');

  useEffect(() => {
    let active = true;
    async function initProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !active) return;

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

        if (!targetOrgId || !active) return;

        setOrgId(targetOrgId);

        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', targetOrgId)
          .single();

        if (error) throw error;

        if (org && active) {
          setName(org.name || '');
          setLogoUrl(org.logo_url || '');
          setEmail(org.email || '');
          setPhone(org.phone || '');
          setWebsite(org.website || '');
          setReviewUrl(org.google_review_url || '');
          setReviewShieldEnabled(org.review_shield_enabled ?? true);
          setCategory((org.category || 'restaurant') as BusinessCategory);
          setHubMode((org.hub_mode || 'hub') as HubMode);
          setCustomCtaLabel(org.custom_cta_label || '');
          setCustomCtaUrl(org.custom_cta_url || '');
          setCityGuideText(org.city_guide_text || '');
          setSmartRoutingEnabled(org.smart_routing_enabled ?? false);
          setLunchUrl(org.lunch_destination_url || '');
          setLunchStart(org.lunch_start_time || '12:00');
          setLunchEnd(org.lunch_end_time || '15:30');
          setTelegramToken(org.telegram_bot_token || '');
          setTelegramChatId(org.telegram_chat_id || '');
          setTelegramAlertsEnabled(org.telegram_alerts_enabled ?? false);
          setWifiSsid(org.wifi_ssid || '');
          setWifiPassword(org.wifi_password || '');
          setAiMenuContext(org.ai_menu_context || '');
          setPrimaryColor(org.primary_color || '#B4F02A');
        }
      } catch (err) {
        console.error('Error loading profile data:', err);
        if (active) setErrorMsg("Impossibile caricare i dettagli dell'attività");
      } finally {
        if (active) setLoading(false);
      }
    }
    void initProfile();
    return () => {
      active = false;
    };
  }, [supabase]);

  // Handle Logo File Upload via API
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Il file selezionato supera i 5MB. Seleziona un'immagine più leggera.");
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
      if (!res.ok || !data.logoUrl) {
        throw new Error(data.error || 'Errore durante il caricamento del logo.');
      }

      setLogoUrl(data.logoUrl);
      setLogoSuccess(true);
      setTimeout(() => setLogoSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore upload logo';
      setErrorMsg(msg);
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Handle Remove Logo
  const handleRemoveLogo = async () => {
    if (!orgId) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('orgId', orgId);
      formData.append('action', 'remove');

      await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      setLogoUrl('');
      setLogoSuccess(true);
      setTimeout(() => setLogoSuccess(false), 3000);
    } catch (err) {
      console.warn('Remove logo error:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: name.trim(),
          logo_url: logoUrl.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          website: website.trim() || null,
          google_review_url: reviewUrl.trim() || null,
          review_shield_enabled: reviewShieldEnabled,
          category,
          hub_mode: hubMode,
          custom_cta_label: customCtaLabel.trim() || null,
          custom_cta_url: customCtaUrl.trim() || null,
          city_guide_text: cityGuideText.trim() || null,
          smart_routing_enabled: smartRoutingEnabled,
          lunch_destination_url: lunchUrl.trim() || null,
          lunch_start_time: lunchStart,
          lunch_end_time: lunchEnd,
          telegram_bot_token: telegramToken.trim() || null,
          telegram_chat_id: telegramChatId.trim() || null,
          telegram_alerts_enabled: telegramAlertsEnabled,
          wifi_ssid: wifiSsid.trim() || null,
          wifi_password: wifiPassword.trim() || null,
          ai_menu_context: aiMenuContext.trim() || null,
          primary_color: primaryColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore nel salvataggio';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl min-w-0">
        <PageHeader title="Profilo Attività & Smart Routing" loading />
        <SurfaceCard loading />
        <SurfaceCard loading />
        <SurfaceCard loading />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl min-w-0">
      <PageHeader
        eyebrow="Configurazione Sede & Hub"
        title="Profilo Attività & Smart Routing"
        description="Personalizza le informazioni aziendali, il filtro recensioni e il routing orario intelligente (Menù Pranzo vs Google Reviews)."
      />

      {/* Callout Banner to Custom Hub Studio */}
      <Link
        href="/dashboard/custom-hub"
        className="group flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--rivo-volt-border)] hover:border-[var(--rivo-volt)] hover:bg-[var(--bg-elevated)]/60 transition-[background-color,border-color,transform] duration-[180ms] active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--rivo-volt)] text-[#09090B] flex items-center justify-center font-bold shrink-0">
            <Smartphone className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--rivo-volt-text)] transition-colors">
                Personalizza il tuo Custom Hub NFC
              </span>
              <StatusBadge tone="volt" mono>
                Nuovo Studio
              </StatusBadge>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">
              Modifica palette, pulsanti e servizi con l&apos;anteprima live su mockup smartphone in
              tempo reale.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-[var(--rivo-volt-text)] group-hover:translate-x-0.5 transition-transform shrink-0">
          <span>Apri Custom Hub</span>
          <ArrowUpRight className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
        </div>
      </Link>

      <form onSubmit={handleSave} className="space-y-6">
        {saved && (
          <div
            role="status"
            aria-live="polite"
            className="p-4 bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] rounded-xl text-sm flex items-center gap-2.5"
          >
            <Check className="w-5 h-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>Configurazione salvata con successo sul database di produzione!</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            aria-live="polite"
            className="p-4 bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] rounded-xl text-sm flex items-center gap-2.5"
          >
            <AlertCircle className="w-5 h-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOGO DEL LOCALE / MARCHIO */}
        <SurfaceCard
          radius="2xl"
          padding="lg"
          header={{
            eyebrow: 'Identità Visiva',
            title: 'Logo del Locale / Marchio',
            subtitle:
              'Questo logo apparirà in cima al tuo Universal Hub, sulla Ruota Premi e sulla scheda di valutazione.',
            icon: ImageIcon,
            action: (
              <StatusBadge tone="volt" dot mono>
                Live su NFC
              </StatusBadge>
            ),
          }}
        >
          <div className="space-y-4">
            {logoSuccess && (
              <div
                role="status"
                aria-live="polite"
                className="p-3 bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] rounded-lg text-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>
                  Logo aggiornato e salvato con successo! Visibile su tutti i dispositivi NFC.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Visual Live Preview */}
              <div className="shrink-0 relative">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Anteprima Logo"
                    width={96}
                    height={96}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-[var(--border-strong)] bg-[var(--bg-elevated)]"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[var(--bg-elevated)] border-2 border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center text-[var(--text-muted)]">
                    <ImageIcon className="w-7 h-7 mb-1" strokeWidth={1.75} aria-hidden="true" />
                    <span className="text-[9px] font-mono uppercase font-semibold">
                      Nessun Logo
                    </span>
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-[var(--bg-backdrop)] rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 text-[var(--rivo-volt)] animate-spin" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex-1 space-y-3 text-center sm:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <label className="min-h-[44px] cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs transition-[background-color,transform] duration-[180ms] active:scale-[0.98]">
                    <Upload className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                    <span>
                      {uploadingLogo
                        ? 'Caricamento in corso…'
                        : logoUrl
                        ? 'Sostituisci Logo'
                        : 'Carica Logo (File)'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border-strong)] transition-colors cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>{showUrlInput ? 'Nascondi Link' : 'Inserisci Link URL'}</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={uploadingLogo}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--accent-critical-bg)] hover:opacity-90 text-[var(--accent-critical-text)] text-xs font-semibold border border-[var(--accent-critical-border)] transition-opacity cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                      <span>Rimuovi</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-[var(--text-muted)]">
                  Formati supportati: PNG, JPG, WEBP, SVG (massimo 5&nbsp;MB). Consigliato formato
                  quadrato 1:1.
                </p>

                {showUrlInput && (
                  <div className="pt-1">
                    <label htmlFor="profile-logo-url" className="sr-only">
                      URL immagine logo
                    </label>
                    <input
                      id="profile-logo-url"
                      name="logoUrl"
                      type="url"
                      spellCheck={false}
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://tuosito.it/logo.png…"
                      className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </SurfaceCard>

        {/* PALETTE COLORI & TEMA UNIVERSAL HUB */}
        <SurfaceCard
          radius="2xl"
          padding="lg"
          header={{
            eyebrow: 'Tema Cliente',
            title: 'Palette Colori & Tema Hub',
            subtitle:
              'Scegli in autonomia il colore guida del tuo Hub cliente. Si applica istantaneamente su pulsanti, icone e bagliori del tuo tag NFC/QR.',
            icon: Palette,
            action: (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <span className="text-[11px] text-[var(--text-muted)]">Colore attivo:</span>
                <div
                  className="w-4 h-4 rounded-full border border-[var(--border-strong)] shrink-0"
                  style={{ backgroundColor: primaryColor }}
                />
                <span
                  translate="no"
                  className="font-mono tabular-nums text-xs font-bold text-[var(--text-primary)] uppercase"
                >
                  {primaryColor}
                </span>
              </div>
            ),
          }}
        >
          <div className="space-y-4">
            {/* Preset Palettes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {HUB_COLOR_PRESETS.map((p) => {
                const isSelected = primaryColor.toUpperCase() === p.primary.toUpperCase();
                const checkColor = getContrastColor(p.primary);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPrimaryColor(p.primary)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-[background-color,border-color] duration-[180ms] cursor-pointer min-h-[44px] ${
                      isSelected
                        ? 'bg-[var(--bg-subtle)] border-[var(--text-primary)] ring-1 ring-[var(--text-primary)] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: p.primary }}
                    >
                      {isSelected && (
                        <Check
                          className="w-4 h-4 stroke-[2.75]"
                          style={{ color: checkColor }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="min-w-0 w-full">
                      <span className="text-xs font-bold block text-[var(--text-primary)] truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] line-clamp-1">
                        {p.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Color Picker */}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label
                htmlFor="profile-custom-color-hex"
                className="text-xs text-[var(--text-secondary)] font-medium"
              >
                Oppure seleziona un colore su misura:
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  aria-label="Selettore colore personalizzato"
                  value={primaryColor.startsWith('#') ? primaryColor : '#B4F02A'}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-11 h-11 rounded-lg cursor-pointer bg-[var(--bg-elevated)] border border-[var(--border-strong)] p-1"
                />
                <input
                  id="profile-custom-color-hex"
                  name="primaryColor"
                  type="text"
                  spellCheck={false}
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#B4F02A…"
                  className="w-28 min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono uppercase focus:outline-none focus-visible:border-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>
        </SurfaceCard>

        {/* SECTION 1: INFORMAZIONI GENERALI */}
        <SurfaceCard
          radius="2xl"
          padding="lg"
          header={{
            eyebrow: 'Anagrafica',
            title: 'Informazioni Attività',
            icon: Building2,
          }}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="profile-org-name"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                Ragione Sociale / Nome Locale{' '}
                <span className="text-[var(--rivo-volt-text)]">*</span>
              </label>
              <input
                id="profile-org-name"
                name="orgName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-org-email"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                >
                  Email Pubblica
                </label>
                <input
                  id="profile-org-email"
                  name="orgEmail"
                  type="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@tuolocale.it…"
                  className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-org-phone"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                >
                  Telefono
                </label>
                <input
                  id="profile-org-phone"
                  name="orgPhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 081 123456…"
                  className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2 text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-org-website"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                Sito Web Ufficiale
              </label>
              <input
                id="profile-org-website"
                name="orgWebsite"
                type="url"
                spellCheck={false}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.tuolocale.it…"
                className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2 text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
              />
            </div>
          </div>
        </SurfaceCard>

        {/* SECTION 2: SETTORE ATTIVITÀ & UNIVERSAL NFC HUB */}
        <SurfaceCard
          radius="2xl"
          padding="lg"
          header={{
            eyebrow: 'Esperienza Dinamica',
            title: 'Settore Attività & Universal NFC Hub',
            icon: Sliders,
            action: (
              <StatusBadge tone="volt" mono>
                Cloud Adaptive
              </StatusBadge>
            ),
          }}
        >
          <div className="space-y-5">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              I chip NFC e i QR code RIVO non necessitano di alcuna riprogrammazione fisica:
              cambiando il settore o la modalità qui, l&apos;esperienza del cliente si aggiorna
              istantaneamente in tempo reale.
            </p>

            {/* Category Selection Cards with pure Lucide SVG icons */}
            <div>
              <span className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                Settore di Attività Commerciale ({CATEGORIES.length} Settori Disponibili){' '}
                <span className="text-[var(--rivo-volt-text)]">*</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto p-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id as BusinessCategory);
                        if (!customCtaLabel || customCtaLabel === 'Consulta Menù Digitale') {
                          setCustomCtaLabel(cat.defaultCtaLabel);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-[background-color,border-color] duration-[180ms] flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--rivo-volt-bg)] border-[var(--rivo-volt-border)] text-[var(--text-primary)] ring-1 ring-[var(--rivo-volt-border)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected
                              ? 'bg-[var(--rivo-volt)] text-[#09090B]'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                          }`}
                        >
                          <Icon className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                        </div>
                        {isSelected && (
                          <Check
                            className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[var(--text-primary)] block leading-snug">
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 line-clamp-2 leading-tight">
                          {cat.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hub Mode Selector with pure Lucide SVG icons */}
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <span className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                Modalità di Reindirizzamento NFC / QR
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'hub',
                    label: 'Universal Experience Hub',
                    tag: 'Consigliato',
                    icon: Layers,
                    desc: 'Apre la pagina multifunzione adattata al settore (Menù/Servizi, Wi-Fi 1-tap, Ruota della Fortuna, Fidelity Card e Recensioni).',
                  },
                  {
                    id: 'shield',
                    label: 'Review Shield Diretto',
                    tag: 'Solo Recensioni',
                    icon: ShieldCheck,
                    desc: 'Apre direttamente la schermata di filtro recensioni a 5 stelle anti 1-3 stelle.',
                  },
                  {
                    id: 'smart_routing',
                    label: 'Smart Routing Orario',
                    tag: 'Orario Pranzo',
                    icon: Clock,
                    desc: 'Mostra il menù pranzo negli orari definiti e il filtro recensioni per il resto della giornata.',
                  },
                  {
                    id: 'direct',
                    label: 'Reindirizzamento Diretto',
                    tag: 'Standard',
                    icon: ArrowUpRight,
                    desc: "Reindirizza istantaneamente alla scheda Google Business o all'URL configurato sul chip.",
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = hubMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setHubMode(m.id as HubMode)}
                      className={`p-3.5 rounded-xl border text-left transition-[background-color,border-color] duration-[180ms] cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--rivo-volt-bg)] border-[var(--rivo-volt-border)] text-[var(--text-primary)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className="w-4 h-4 text-[var(--rivo-volt-text)] shrink-0"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {m.label}
                          </span>
                        </div>
                        <StatusBadge tone={isSelected ? 'volt' : 'neutral'} shape="tag" mono>
                          {m.tag}
                        </StatusBadge>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-snug pl-6">
                        {m.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hero Custom CTA Configuration */}
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                <ExternalLink
                  className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>Pulsante in Evidenza sull&apos;Hub (Hero CTA)</span>
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mb-3">
                Un banner luminoso ad alta conversione posizionato in cima all&apos;Hub del cliente.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="profile-cta-label"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Testo del Pulsante
                  </label>
                  <input
                    id="profile-cta-label"
                    name="customCtaLabel"
                    type="text"
                    value={customCtaLabel}
                    onChange={(e) => setCustomCtaLabel(e.target.value)}
                    placeholder="Es. Prenota Taglio / Prenota Visita / Menù del Giorno…"
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-cta-url"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Link di Destinazione
                  </label>
                  <input
                    id="profile-cta-url"
                    name="customCtaUrl"
                    type="url"
                    spellCheck={false}
                    value={customCtaUrl}
                    onChange={(e) => setCustomCtaUrl(e.target.value)}
                    placeholder="https://wa.me/39… oppure link prenotazione/PDF"
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* City Guide / Territorio (Especially for Hotel & B&B) */}
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <label
                htmlFor="profile-city-guide"
                className="text-xs font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-1.5"
              >
                <Compass
                  className="w-3.5 h-3.5 text-[var(--accent-warning-text)]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>Guida del Territorio & Informazioni per gli Ospiti</span>
              </label>
              <p className="text-[11px] text-[var(--text-secondary)] mb-2">
                Mostra consigli turistici, ristoranti convenzionati e info utili nel pop-up della
                Guida del Territorio sull&apos;Hub.
              </p>
              <textarea
                id="profile-city-guide"
                name="cityGuideText"
                rows={3}
                value={cityGuideText}
                onChange={(e) => setCityGuideText(e.target.value)}
                placeholder="Es. Ristorante convenzionato a 200m: Trattoria del Porto (10% sconto esibendo la card). Farmacia di turno in Via Roma. Taxi H24: +39 081 99999…"
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg p-3 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors resize-none"
              />
            </div>
          </div>
        </SurfaceCard>

        {/* SECTION 3: REVIEW SHIELD CONFIGURATION */}
        <SurfaceCard
          radius="2xl"
          padding="lg"
          header={{
            eyebrow: 'Reputazione',
            title: 'Review Shield (Filtro 5 Stelle)',
            icon: ShieldCheck,
            action: (
              <StatusBadge tone="volt" mono>
                Anti 1-3 Stelle
              </StatusBadge>
            ),
          }}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="profile-review-url"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                URL Scheda Google Business / Recensioni
              </label>
              <input
                id="profile-review-url"
                name="reviewUrl"
                type="url"
                spellCheck={false}
                value={reviewUrl}
                onChange={(e) => setReviewUrl(e.target.value)}
                placeholder="https://g.page/r/tuo-codice-recensione/review…"
                className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Tutti i clienti che assegnano 4 o 5 stelle verranno reindirizzati direttamente a
                questo link ufficiale di Google.
              </p>
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-[var(--text-primary)] block">
                  Attiva Review Shield
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Intercetta recensioni da 1 a 3 stelle convogliandole nel pannello privato.
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={reviewShieldEnabled}
                aria-label="Attiva Review Shield"
                onClick={() => setReviewShieldEnabled(!reviewShieldEnabled)}
                className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 flex items-center ${
                  reviewShieldEnabled
                    ? 'bg-[var(--rivo-volt)]'
                    : 'bg-[var(--bg-subtle)] border border-[var(--border-strong)]'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full transition-transform ${
                    reviewShieldEnabled
                      ? 'translate-x-6 bg-[#09090B]'
                      : 'translate-x-0 bg-[var(--text-muted)]'
                  }`}
                />
              </button>
            </div>
          </div>
        </SurfaceCard>

        {/* SECTION 4: SMART ROUTING CONDITIONAL */}
        <SurfaceCard
          radius="2xl"
          padding="lg"
          header={{
            eyebrow: 'Automazione Oraria',
            title: 'Smart Routing Orario (Menù vs Recensioni)',
            icon: Utensils,
            action: (
              <StatusBadge tone="telemetry" mono>
                Automatismo
              </StatusBadge>
            ),
          }}
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Invece di usare due QR code separati al tavolo, RIVO instrada il cliente in base
              all&apos;orario: mostra il <strong className="text-[var(--text-primary)]">Menù Digitale a Pranzo</strong> e chiede la{' '}
              <strong className="text-[var(--text-primary)]">Recensione / Review Shield di Sera</strong>!
            </p>

            <div className="pt-2 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-[var(--text-primary)] block">
                  Abilita Cambio Automatico Pranzo
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Durante la fascia del pranzo apre il menù, poi torna alle recensioni.
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={smartRoutingEnabled}
                aria-label="Abilita Cambio Automatico Pranzo"
                onClick={() => setSmartRoutingEnabled(!smartRoutingEnabled)}
                className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 flex items-center ${
                  smartRoutingEnabled
                    ? 'bg-[var(--accent-telemetry)]'
                    : 'bg-[var(--bg-subtle)] border border-[var(--border-strong)]'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full transition-transform ${
                    smartRoutingEnabled
                      ? 'translate-x-6 bg-white'
                      : 'translate-x-0 bg-[var(--text-muted)]'
                  }`}
                />
              </button>
            </div>

            {smartRoutingEnabled && (
              <div className="space-y-4 pt-3 border-t border-[var(--border-subtle)]">
                <div>
                  <label
                    htmlFor="profile-lunch-url"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Link Menù Digitale Pranzo{' '}
                    <span className="text-[var(--accent-telemetry-text)]">*</span>
                  </label>
                  <input
                    id="profile-lunch-url"
                    name="lunchUrl"
                    type="url"
                    spellCheck={false}
                    required={smartRoutingEnabled}
                    value={lunchUrl}
                    onChange={(e) => setLunchUrl(e.target.value)}
                    placeholder="https://menu.tuolocale.it oppure link PDF/Drive…"
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="profile-lunch-start"
                      className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                      <span>Orario Inizio Pranzo</span>
                    </label>
                    <input
                      id="profile-lunch-start"
                      name="lunchStart"
                      type="time"
                      value={lunchStart}
                      onChange={(e) => setLunchStart(e.target.value)}
                      className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2 text-sm font-mono tabular-nums text-[var(--text-primary)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-lunch-end"
                      className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                      <span>Orario Fine Pranzo</span>
                    </label>
                    <input
                      id="profile-lunch-end"
                      name="lunchEnd"
                      type="time"
                      value={lunchEnd}
                      onChange={(e) => setLunchEnd(e.target.value)}
                      className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2 text-sm font-mono tabular-nums text-[var(--text-primary)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </SurfaceCard>

        {/* SECTION 5: TELEGRAM NOTIFICATIONS */}
        <SurfaceCard
          radius="2xl"
          padding="lg"
          header={{
            eyebrow: 'Alert Sala',
            title: 'Notifiche Istantanee Telegram (Staff & Titolare)',
            icon: Send,
            action: (
              <StatusBadge tone="telemetry" mono>
                Anti-Crisi & Sala
              </StatusBadge>
            ),
          }}
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Ricevi un messaggio istantaneo sul tuo Telegram personale o del gruppo camerieri ogni
              volta che un cliente invia una recensione 1-3 stelle o chiama il cameriere al
              tavolo.
            </p>

            <div className="pt-2 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-[var(--text-primary)] block">
                  Attiva Notifiche Telegram
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Invia alert immediati in sala.
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={telegramAlertsEnabled}
                aria-label="Attiva Notifiche Telegram"
                onClick={() => setTelegramAlertsEnabled(!telegramAlertsEnabled)}
                className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 flex items-center ${
                  telegramAlertsEnabled
                    ? 'bg-[var(--accent-telemetry)]'
                    : 'bg-[var(--bg-subtle)] border border-[var(--border-strong)]'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full transition-transform ${
                    telegramAlertsEnabled
                      ? 'translate-x-6 bg-white'
                      : 'translate-x-0 bg-[var(--text-muted)]'
                  }`}
                />
              </button>
            </div>

            {telegramAlertsEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--border-subtle)]">
                <div>
                  <label
                    htmlFor="profile-telegram-token"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Telegram Bot Token
                  </label>
                  <input
                    id="profile-telegram-token"
                    name="telegramToken"
                    type="text"
                    spellCheck={false}
                    autoComplete="off"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    placeholder="Es. 123456789:ABCdefGhI…"
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 text-xs text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="profile-telegram-chat-id"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Telegram Chat ID / Canale
                  </label>
                  <input
                    id="profile-telegram-chat-id"
                    name="telegramChatId"
                    type="text"
                    spellCheck={false}
                    autoComplete="off"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="Es. -10012345678 oppure tuo ID…"
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 text-xs text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                  />
                </div>
              </div>
            )}
          </div>
        </SurfaceCard>

        {/* SECTION 6: WI-FI GUEST CONFIG */}
        <SurfaceCard
          radius="2xl"
          padding="lg"
          header={{
            eyebrow: 'Connettività Ospiti',
            title: 'Wi-Fi Guest & Rete Clienti',
            icon: Wifi,
          }}
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              I clienti possono connettersi al Wi-Fi del locale toccando il chip NFC. Inserisci il
              nome della tua rete e la password da mostrare dopo che hanno lasciato il loro
              contatto.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-wifi-ssid"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                >
                  Nome Rete Wi-Fi (SSID)
                </label>
                <input
                  id="profile-wifi-ssid"
                  name="wifiSsid"
                  type="text"
                  spellCheck={false}
                  autoComplete="off"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="Es. BarCentrale_Guest…"
                  className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-wifi-password"
                  className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                >
                  Password Wi-Fi
                </label>
                <input
                  id="profile-wifi-password"
                  name="wifiPassword"
                  type="text"
                  spellCheck={false}
                  autoComplete="off"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Es. Benvenuto2026!…"
                  className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 text-xs sm:text-sm text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>
        </SurfaceCard>

        {/* SECTION 7: AI SOMMELIER KNOWLEDGE BASE */}
        <SurfaceCard
          radius="2xl"
          padding="lg"
          header={{
            eyebrow: 'Intelligenza Artificiale',
            title: 'AI Sommelier & Menù Knowledge Base',
            icon: Wine,
            action: (
              <StatusBadge tone="telemetry" mono>
                Google Gemini
              </StatusBadge>
            ),
          }}
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Incolla qui una breve descrizione del menù del tuo locale, le specialità di punta
              della casa e le etichette di vino su cui vuoi fare up-selling. L&apos;AI Sommelier
              userà queste informazioni per consigliare i clienti al tavolo.
            </p>

            <div>
              <label htmlFor="profile-ai-menu-context" className="sr-only">
                Knowledge Base Menù per AI Sommelier
              </label>
              <textarea
                id="profile-ai-menu-context"
                name="aiMenuContext"
                rows={4}
                value={aiMenuContext}
                onChange={(e) => setAiMenuContext(e.target.value)}
                placeholder="Es. Specialità: Fiorentina di Scottona frollata 40 giorni, Risotto ai Porcini e Tartufo. Vini consigliati: Aglianico del Taburno per le carni, Greco di Tufo per il pesce. Disponibili pizze e pasta senza glutine…"
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg p-3.5 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors resize-none"
              />
            </div>
          </div>
        </SurfaceCard>

        {/* SUBMIT BUTTON */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-sm rounded-lg transition-[background-color,transform] duration-[180ms] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Salvataggio…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                <span>Salva Modifiche</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

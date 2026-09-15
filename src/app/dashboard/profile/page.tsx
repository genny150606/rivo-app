'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Save, 
  Check, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Utensils, 
  Link2, 
  AlertCircle,
  RefreshCw,
  Send,
  Wifi,
  Wine,
  Sparkles,
  Compass,
  Layers,
  Building2,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { BusinessCategory, HubMode } from '@/lib/types';
import { CATEGORIES, getCategoryDefinition } from '@/lib/categories';

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
    loadProfile();
  }, []);

  async function loadProfile() {
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

      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', targetOrgId)
        .single();

      if (error) throw error;

      if (org) {
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
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
      setErrorMsg('Impossibile caricare i dettagli dell\'attività');
    } finally {
      setLoading(false);
    }
  }

  // Handle Logo File Upload via API
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Il file selezionato supera i 5MB. Seleziona un\'immagine più leggera.');
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
      <div className="space-y-6 max-w-3xl animate-pulse">
        <div className="h-8 bg-zinc-800 rounded w-1/3" />
        <div className="h-4 bg-zinc-800 rounded w-1/2" />
        <div className="h-96 bg-[#121214] border border-[#27272A] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
          Profilo Attività & Smart Routing
        </h1>
        <p className="text-sm text-zinc-400">
          Personalizza le informazioni aziendali, il filtro recensioni e il routing orario intelligente (Menù Pranzo vs Google Reviews).
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {saved && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2.5 animate-fade-in">
            <Check className="w-5 h-5 shrink-0" />
            <span>Configurazione salvata con successo sul database di produzione!</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOGO DEL LOCALE / MARCHIO */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#18181B] to-[#121214] p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#BFFF00]" />
                <span>Logo del Locale / Marchio</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Questo logo apparirà in cima al tuo Universal Hub, sulla Ruota Premi e sulla scheda di valutazione.
              </p>
            </div>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-[#BFFF00]/10 text-[#BFFF00] border border-[#BFFF00]/20">
              Live su NFC
            </span>
          </div>

          {logoSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>Logo aggiornato e salvato con successo! Visibile su tutti i dispositivi NFC.</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-2">
            {/* Visual Live Preview */}
            <div className="shrink-0 relative group">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Anteprima Logo"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/20 shadow-2xl bg-black ring-4 ring-white/5"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#18181B] border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 shadow-inner group-hover:border-zinc-500 transition-colors">
                  <ImageIcon className="w-7 h-7 mb-1 text-zinc-600" />
                  <span className="text-[9px] uppercase font-semibold">Nessun Logo</span>
                </div>
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-black/75 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="w-6 h-6 text-[#BFFF00] animate-spin" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                {/* Upload Button */}
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#BFFF00] hover:bg-[#a8e000] text-black font-bold text-xs shadow-lg shadow-[#BFFF00]/20 transition-all active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingLogo ? 'Caricamento in corso...' : logoUrl ? 'Sostituisci Logo' : 'Carica Logo (File)'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>

                {/* Toggle Direct URL input */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>{showUrlInput ? 'Nascondi Link' : 'Inserisci Link URL'}</span>
                </button>

                {/* Remove Button */}
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Rimuovi</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-zinc-500">
                Formati supportati: PNG, JPG, WEBP, SVG (massimo 5MB). Consigliato formato quadrato 1:1.
              </p>

              {/* Direct URL input accordion */}
              {showUrlInput && (
                <div className="pt-2 flex items-center gap-2 animate-fade-in">
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://tuosito.it/logo.png"
                    className="flex-1 min-h-[38px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#BFFF00]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 1: INFORMAZIONI GENERALI */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Informazioni Attività</h2>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Ragione Sociale / Nome Locale <span className="text-[#BFFF00]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email Pubblica</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@tuolocale.it"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Telefono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+39 081 123456"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Sito Web Ufficiale</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.tuolocale.it"
              className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00] transition-colors"
            />
          </div>
        </div>

        {/* SECTION 2: SETTORE ATTIVITÀ & UNIVERSAL NFC HUB */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#BFFF00]" />
              <h2 className="text-base font-semibold text-white">Settore Attività & Universal NFC Hub</h2>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-[#BFFF00]/10 text-[#BFFF00]">
              Cloud Adaptive
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            I chip NFC e i QR code RIVO non necessitano di alcuna riprogrammazione fisica: cambiando il settore o la modalità qui, l&apos;esperienza del cliente si aggiorna istantaneamente in tempo reale.
          </p>

          {/* Category Selection Cards with pure Lucide SVG icons */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Settore di Attività Commerciale ({CATEGORIES.length} Settori Disponibili) <span className="text-[#BFFF00]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto p-1 rounded-xl border border-[#27272A]/50 bg-[#09090B]/40 scrollbar-thin">
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
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#BFFF00]/15 border-[#BFFF00] text-white shadow-[0_0_15px_rgba(191,255,0,0.15)] ring-1 ring-[#BFFF00]'
                        : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#BFFF00] text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#BFFF00]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block leading-snug">{cat.label}</span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5 line-clamp-2 leading-tight">{cat.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hub Mode Selector with pure Lucide SVG icons */}
          <div className="pt-2 border-t border-[#27272A]">
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Modalità di Reindirizzamento NFC / QR
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'hub',
                  label: 'Universal Experience Hub',
                  tag: 'Consigliato',
                  icon: Sparkles,
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
                  desc: 'Reindirizza istantaneamente alla scheda Google Business o all\'URL configurato sul chip.',
                },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = hubMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setHubMode(m.id as HubMode)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#BFFF00]/10 border-[#BFFF00] text-white shadow-[0_0_12px_rgba(191,255,0,0.1)]'
                        : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#BFFF00]" />
                        <span className="text-xs font-bold text-white">{m.label}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                        {m.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-snug pl-6">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hero Custom CTA Configuration */}
          <div className="pt-2 border-t border-[#27272A]">
            <h3 className="text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-[#BFFF00]" />
              Pulsante in Evidenza sull&apos;Hub (Hero CTA)
            </h3>
            <p className="text-[11px] text-zinc-400 mb-3">
              Un banner luminoso ad alta conversione posizionato in cima all&apos;Hub del cliente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Testo del Pulsante
                </label>
                <input
                  type="text"
                  value={customCtaLabel}
                  onChange={(e) => setCustomCtaLabel(e.target.value)}
                  placeholder="Es. Prenota Taglio / Prenota Visita / Menù del Giorno"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Link di Destinazione
                </label>
                <input
                  type="url"
                  value={customCtaUrl}
                  onChange={(e) => setCustomCtaUrl(e.target.value)}
                  placeholder="https://wa.me/39... oppure link prenotazione/PDF"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-[#BFFF00] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* City Guide / Territorio (Especially for Hotel & B&B) */}
          <div className="pt-2 border-t border-[#27272A]">
            <h3 className="text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Guida del Territorio & Informazioni per gli Ospiti
            </h3>
            <p className="text-[11px] text-zinc-400 mb-2">
              Mostra consigli turistici, ristoranti convenzionati e info utili nel pop-up della Guida del Territorio sull&apos;Hub.
            </p>
            <textarea
              rows={3}
              value={cityGuideText}
              onChange={(e) => setCityGuideText(e.target.value)}
              placeholder="Es. Ristorante convenzionato a 200m: Trattoria del Porto (10% sconto esibendo la card). Farmacia di turno in Via Roma. Taxi H24: +39 081 99999..."
              className="w-full bg-[#18181B] border border-[#27272A] rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition-colors resize-none"
            />
          </div>
        </div>

        {/* SECTION 3: REVIEW SHIELD CONFIGURATION */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#BFFF00]" />
              <h2 className="text-base font-semibold text-white">Review Shield (Filtro 5 Stelle)</h2>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-[#BFFF00]/10 text-[#BFFF00]">
              Anti 1-3 Stelle
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              URL Scheda Google Business / Recensioni
            </label>
            <input
              type="url"
              value={reviewUrl}
              onChange={(e) => setReviewUrl(e.target.value)}
              placeholder="https://g.page/r/tuo-codice-recensione/review"
              className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-[#BFFF00] transition-colors"
            />
            <p className="text-xs text-zinc-500 mt-1.5">
              Tutti i clienti che assegnano 4 o 5 stelle verranno reindirizzati direttamente a questo link ufficiale di Google.
            </p>
          </div>

          <div className="pt-3 border-t border-[#27272A] flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-white block">Attiva Review Shield</span>
              <span className="text-xs text-zinc-400">
                Intercetta recensioni da 1 a 3 stelle convogliandole nel pannello privato.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setReviewShieldEnabled(!reviewShieldEnabled)}
              className={`w-14 h-8 rounded-full p-1 transition-colors touch-press ${
                reviewShieldEnabled ? 'bg-[#BFFF00]' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-black transition-transform ${
                  reviewShieldEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* SECTION 3: SMART ROUTING CONDITIONAL */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Smart Routing Orario (Menù vs Recensioni)</h2>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-blue-500/10 text-blue-400">
              Automatismo
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Invece di usare due QR code separati al tavolo, RIVO instrada il cliente in base all&apos;orario: mostra il <strong>Menù Digitale a Pranzo</strong> e chiede la <strong>Recensione / Review Shield di Sera</strong>!
          </p>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-white block">Abilita Cambio Automatico Pranzo</span>
              <span className="text-xs text-zinc-400">
                Durante la fascia del pranzo apre il menù, poi torna alle recensioni.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSmartRoutingEnabled(!smartRoutingEnabled)}
              className={`w-14 h-8 rounded-full p-1 transition-colors touch-press ${
                smartRoutingEnabled ? 'bg-blue-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-black transition-transform ${
                  smartRoutingEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {smartRoutingEnabled && (
            <div className="space-y-4 pt-3 border-t border-[#27272A] animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Link Menù Digitale Pranzo <span className="text-blue-400">*</span>
                </label>
                <input
                  type="url"
                  required={smartRoutingEnabled}
                  value={lunchUrl}
                  onChange={(e) => setLunchUrl(e.target.value)}
                  placeholder="https://menu.tuolocale.it oppure link PDF/Drive"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Orario Inizio Pranzo
                  </label>
                  <input
                    type="time"
                    value={lunchStart}
                    onChange={(e) => setLunchStart(e.target.value)}
                    className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Orario Fine Pranzo
                  </label>
                  <input
                    type="time"
                    value={lunchEnd}
                    onChange={(e) => setLunchEnd(e.target.value)}
                    className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: TELEGRAM NOTIFICATIONS */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Notifiche Istantanee Telegram (Staff & Titolare)</h2>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-blue-500/10 text-blue-400">
              Anti-Crisi & Sala
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Ricevi un messaggio istantaneo sul tuo Telegram personale o del gruppo camerieri ogni volta che un cliente invia una recensione 1-3 stelle o chiama il cameriere al tavolo.
          </p>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-white block">Attiva Notifiche Telegram</span>
              <span className="text-xs text-zinc-400">Invia alert immediati in sala.</span>
            </div>

            <button
              type="button"
              onClick={() => setTelegramAlertsEnabled(!telegramAlertsEnabled)}
              className={`w-14 h-8 rounded-full p-1 transition-colors touch-press ${
                telegramAlertsEnabled ? 'bg-blue-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-black transition-transform ${
                  telegramAlertsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {telegramAlertsEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#27272A] animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Telegram Bot Token</label>
                <input
                  type="text"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="Es. 123456789:ABCdefGhI..."
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Telegram Chat ID / Canale</label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="Es. -10012345678 oppure tuo ID"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: WI-FI GUEST CONFIG */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-[#BFFF00]" />
            <h2 className="text-base font-semibold text-white">Wi-Fi Guest & Rete Clienti</h2>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            I clienti possono connettersi al Wi-Fi del locale toccando il chip NFC. Inserisci il nome della tua rete e la password da mostrare dopo che hanno lasciato il loro contatto.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome Rete Wi-Fi (SSID)</label>
              <input
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="Es. BarCentrale_Guest"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#BFFF00]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password Wi-Fi</label>
              <input
                type="text"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="Es. Benvenuto2026!"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-[#BFFF00]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: AI SOMMELIER KNOWLEDGE BASE */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wine className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-semibold text-white">AI Sommelier & Menù Knowledge Base</h2>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-purple-500/10 text-purple-400">
              Google Gemini
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Incolla qui una breve descrizione del menù del tuo locale, le specialità di punta della casa e le etichette di vino su cui vuoi fare up-selling. L&apos;AI Sommelier userà queste informazioni per consigliare i clienti al tavolo.
          </p>

          <div>
            <textarea
              rows={4}
              value={aiMenuContext}
              onChange={(e) => setAiMenuContext(e.target.value)}
              placeholder="Es. Specialità: Fiorentina di Scottona frollata 40 giorni, Risotto ai Porcini e Tartufo. Vini consigliati: Aglianico del Taburno per le carni, Greco di Tufo per il pesce. Disponibili pizze e pasta senza glutine..."
              className="w-full bg-[#18181B] border border-[#27272A] rounded-xl p-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400 transition-colors resize-none"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-sm rounded-xl transition-all shadow-lg shadow-[#BFFF00]/20 flex items-center justify-center gap-2 touch-press disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salva Modifiche</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

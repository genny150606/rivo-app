'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Building,
  MapPin,
  UserCheck,
  Cpu,
  Phone,
  Wifi,
  Star,
  Palette,
  Globe,
  MessageSquare,
  KeyRound,
  Search,
  Image as ImageIcon,
  Boxes,
} from 'lucide-react';
import Link from 'next/link';
import { HUB_COLOR_PRESETS } from '@/lib/palettes';
import {
  CATEGORIES,
  CATEGORY_GROUPS,
  getCategoryDefinition,
} from '@/lib/categories';
import { BusinessCategory } from '@/lib/types';
import {
  MODULE_CATALOG,
  BUSINESS_TYPE_DEFINITIONS,
  ModuleSlug,
  BusinessTypeSlug,
} from '@/lib/modules/catalog';
import { PageHeader, SurfaceCard, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';

function InstagramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const INPUT_CLASS =
  'w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors';

const NESTED_INPUT_CLASS =
  'w-full min-h-[44px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors';

export default function NewOrganizationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completionMsg, setCompletionMsg] = useState<string | null>(null);

  // Category filter in Step 1
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State - Step 1: Identità & Brand
  const [category, setCategory] = useState<BusinessCategory>('restaurant');
  const [businessType, setBusinessType] = useState<BusinessTypeSlug>('restaurant');
  const [selectedModules, setSelectedModules] = useState<Set<ModuleSlug>>(
    () => new Set(BUSINESS_TYPE_DEFINITIONS.restaurant.defaultModules)
  );
  const [businessName, setBusinessName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Form State - Step 2: Contatti, Web & Social
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');

  // Form State - Step 3: Esperienza Hub & Servizi In-Store
  const [hubMode, setHubMode] = useState<'hub' | 'shield' | 'smart_routing' | 'direct'>('hub');
  const [primaryColor, setPrimaryColor] = useState('#B4F02A');
  const [customCtaLabel, setCustomCtaLabel] = useState('Consulta Menù Digitale');
  const [customCtaUrl, setCustomCtaUrl] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [aiMenuContext, setAiMenuContext] = useState('');
  const [loyaltyRewardText, setLoyaltyRewardText] = useState('10% di sconto al 10° timbro');

  // Form State - Step 4: Sede Fisica
  const [locationName, setLocationName] = useState('Sede Principale');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [province, setProvince] = useState('');

  // Form State - Step 5: Credenziali Titolare & Dispositivo Hardware
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('Rivo2026!');
  const [planName, setPlanName] = useState('Starter');

  const [deviceName, setDeviceName] = useState('Tavolo 1');
  const [deviceType, setDeviceType] = useState<'nfc' | 'qr' | 'both'>('both');
  const [deviceCode, setDeviceCode] = useState(
    () => 'RIVO-' + Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [destinationUrl, setDestinationUrl] = useState('https://google.com');
  const [outreachProspectId, setOutreachProspectId] = useState<string | null>(null);

  // Pre-fill wizard when converting a prospect from RIVO OUTREACH
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const prospectId = params.get('outreachProspectId');
    if (!prospectId) return;

    setOutreachProspectId(prospectId);
    fetch(`/api/admin/outreach/prospects?id=${encodeURIComponent(prospectId)}`)
      .then((r) => r.json())
      .then((json) => {
        const p = json?.prospect;
        if (!p) return;
        if (p.business_name) {
          setBusinessName(p.business_name);
          setSlug(
            p.business_name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
          );
        }
        const rawCat = (p.subcategory || p.category || 'restaurant') as BusinessCategory;
        if (CATEGORIES.some((c) => c.id === rawCat)) {
          handleSelectCategory(rawCat);
        }
        if (p.description) setDescription(p.description);
        if (p.business_email) {
          setEmail(p.business_email);
          setOwnerEmail(p.business_email);
        }
        if (p.business_phone) {
          setPhone(p.business_phone);
          setWhatsappNumber(p.business_phone);
        }
        if (p.website) {
          setWebsite(p.website);
          setDestinationUrl(p.website);
        }
        if (p.instagram_url) setInstagramUrl(p.instagram_url);
        if (p.address) setAddress(p.address);
        if (p.city) setCity(p.city);
        if (p.postal_code) setPostalCode(p.postal_code);
        if (p.province) setProvince(p.province);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter((cat) => {
      const matchesGroup = selectedGroup === 'all' || cat.categoryGroup === selectedGroup;
      const matchesSearch =
        searchQuery === '' ||
        cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [selectedGroup, searchQuery]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pass = 'Rivo-';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setOwnerPassword(pass);
  };

  const handleSelectCategory = (catId: BusinessCategory) => {
    setCategory(catId);
    const def = getCategoryDefinition(catId);
    setCustomCtaLabel(def.defaultCtaLabel);

    let mappedBt: BusinessTypeSlug = 'restaurant';
    if (catId === 'hotel') mappedBt = 'hotel';
    else if (catId === 'bnb') mappedBt = 'bb';
    else if (catId === 'bar') mappedBt = 'bar';
    else if (catId === 'pizzeria') mappedBt = 'pizzeria';
    else if ((catId as string) === 'gelateria') mappedBt = 'gelateria';
    else if (catId === 'salon') mappedBt = 'salon';
    else if (catId === 'barber') mappedBt = 'barber';
    else if (catId === 'beauty') mappedBt = 'beauty';
    else if (catId === 'retail' || catId === 'store') mappedBt = 'retail';
    else if (catId === 'fitness') mappedBt = 'gym';
    else if (catId === 'medical' || catId === 'dental') mappedBt = 'medical_studio';
    else mappedBt = 'restaurant';

    setBusinessType(mappedBt);
    const btDef = BUSINESS_TYPE_DEFINITIONS[mappedBt] || BUSINESS_TYPE_DEFINITIONS.restaurant;
    setSelectedModules(new Set(btDef.defaultModules));

    if (catId === 'hotel' || catId === 'bnb') {
      setDeviceName('Camera 101');
    } else if (catId === 'salon' || catId === 'barber' || catId === 'beauty') {
      setDeviceName('Postazione 1');
    } else if (catId === 'retail' || catId === 'store' || catId === 'pharmacy') {
      setDeviceName('Cassa Principale');
    } else if (catId === 'medical' || catId === 'dental' || catId === 'professional') {
      setDeviceName("Sala d'Attesa");
    } else {
      setDeviceName('Tavolo 1');
    }
  };

  const handleToggleModule = (modSlug: ModuleSlug) => {
    const btDef = BUSINESS_TYPE_DEFINITIONS[businessType] || BUSINESS_TYPE_DEFINITIONS.restaurant;
    if (btDef.requiredModules.includes(modSlug)) {
      return;
    }
    const next = new Set(selectedModules);
    if (next.has(modSlug)) {
      next.delete(modSlug);
      Object.entries(MODULE_CATALOG).forEach(([k, def]) => {
        if (def.dependencies?.includes(modSlug)) {
          next.delete(k as ModuleSlug);
        }
      });
    } else {
      next.add(modSlug);
      const def = MODULE_CATALOG[modSlug];
      if (def?.dependencies) {
        def.dependencies.forEach((dep) => next.add(dep));
      }
    }
    setSelectedModules(next);
  };

  const handleCreateOrg = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          slug,
          logoUrl,
          phone,
          email,
          website,
          category,
          businessTypeSlug: businessType,
          selectedModuleSlugs: Array.from(selectedModules),
          hubMode,
          customCtaLabel,
          customCtaUrl,
          vatNumber,
          whatsappNumber,
          instagramUrl,
          description,
          googleReviewUrl,
          wifiSsid,
          wifiPassword,
          aiMenuContext,
          loyaltyRewardText,
          primaryColor,
          locationName,
          address,
          city,
          postalCode,
          province,
          ownerFirstName,
          ownerLastName,
          ownerEmail,
          ownerPassword,
          planName,
          deviceName,
          deviceType,
          deviceCode,
          destinationUrl,
          outreachProspectId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la creazione.');
      }

      if (data.emailWarning) {
        setCompletionMsg(`Organizzazione creata con successo. ${data.emailWarning}`);
        setLoading(false);
        return;
      }

      router.push('/admin/organizations');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore imprevisto';
      setErrorMsg(msg);
      setLoading(false);
      setDeviceCode('RIVO-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    }
  };

  if (completionMsg) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <SurfaceCard radius="2xl" padding="lg" className="border-[var(--rivo-volt-border)]">
          <CheckCircle2
            className="w-10 h-10 text-[var(--rivo-volt-text)] mb-4"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Organizzazione Attivata
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{completionMsg}</p>
          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] flex flex-wrap gap-3">
            <Link
              href="/admin/organizations"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-5 py-2.5 text-sm font-bold text-[var(--rivo-volt-ink)] transition-colors"
            >
              <span>Vai all&apos;Elenco Organizzazioni</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 min-w-0">
      <PageHeader
        backHref="/admin/organizations"
        backLabel="Torna alle Organizzazioni"
        eyebrow="ONBOARDING WIZARD"
        title="Nuova Attività Cliente"
        description="Configurazione approfondita: identità, canali digitali, esperienza Hub in-store, sede e chip NFC/QR."
        badge={
          <StatusBadge tone="volt" variant="soft" className="tabular-nums">
            Fase {step} di 5
          </StatusBadge>
        }
      />

      {/* Progress Steps Bar */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 border-b border-[var(--border-subtle)] pb-4">
        {[
          { num: 1, label: 'Identità', icon: Building },
          { num: 2, label: 'Contatti & Web', icon: Phone },
          { num: 3, label: 'Hub In-Store', icon: Wifi },
          { num: 4, label: 'Sede Fisica', icon: MapPin },
          { num: 5, label: 'Accesso & Chip', icon: Cpu },
        ].map((s) => {
          const Icon = s.icon;
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num < step) setStep(s.num);
              }}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 p-2 rounded-xl text-left border transition-colors min-h-[48px]',
                isCurrent
                  ? 'bg-[var(--bg-elevated)] border-[var(--border-strong)]'
                  : isDone
                  ? 'border-transparent hover:bg-[var(--bg-elevated)]/60 cursor-pointer'
                  : 'border-transparent opacity-50 cursor-default'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors',
                  isCurrent
                    ? 'bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)]'
                    : isDone
                    ? 'bg-[var(--rivo-volt-bg)] text-[var(--rivo-volt-text)] border border-[var(--rivo-volt-border)]'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                )}
              </div>
              <div className="hidden md:block min-w-0">
                <span
                  className={cn(
                    'text-[11px] font-semibold block truncate',
                    isCurrent ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  )}
                >
                  {s.label}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)] block tabular-nums">
                  Fase {s.num}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-4 bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] rounded-xl text-sm flex items-center gap-2"
        >
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Wizard Form Card */}
      <SurfaceCard radius="2xl" padding="lg" className="space-y-6">
        {/* STEP 1: IDENTITÀ & BRAND */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1">
                1. Identità &amp; Categoria Attività
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Seleziona il settore merceologico per preconfigurare l&apos;Hub e le interazioni automatiche.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <label
                  htmlFor="category-search"
                  className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]"
                >
                  Settore di Attività ({CATEGORIES.length} Categorie Disponibili) *
                </label>
                <div className="relative w-full sm:w-64">
                  <Search
                    className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <input
                    id="category-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca settore o attività…"
                    className="w-full min-h-[38px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              {/* Group Pill Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {CATEGORY_GROUPS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroup(g.id)}
                    className={cn(
                      'min-h-[34px] px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors cursor-pointer border',
                      selectedGroup === g.id
                        ? 'bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] border-[var(--rivo-volt)] font-bold'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
                {filteredCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-colors relative flex flex-col justify-between cursor-pointer',
                        isSelected
                          ? 'bg-[var(--rivo-volt-bg)] border-[var(--rivo-volt)] text-[var(--text-primary)] ring-1 ring-[var(--rivo-volt)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            isSelected
                              ? 'bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)]'
                              : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                          )}
                        >
                          <Icon className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                        </div>
                        {isSelected && (
                          <CheckCircle2
                            className="w-4 h-4 text-[var(--rivo-volt-text)]"
                            strokeWidth={1.75}
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

            {/* Modular Platform Presets Configurator */}
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[var(--text-primary)] font-mono font-semibold text-xs uppercase tracking-[0.08em]">
                  <Boxes className="w-4 h-4 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                  <span className="tabular-nums">
                    Moduli &amp; Preset Piattaforma ({selectedModules.size} attivi)
                  </span>
                </div>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Preset:{' '}
                  <strong className="text-[var(--text-primary)]">
                    {BUSINESS_TYPE_DEFINITIONS[businessType]?.name || businessType}
                  </strong>
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                In base al tipo di business selezionato, RIVO pre-configura i moduli ideali. Puoi abilitare o disabilitare funzionalità su misura per questo cliente.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {Object.values(MODULE_CATALOG).map((mod) => {
                  const isChecked = selectedModules.has(mod.slug);
                  const isReq = (
                    BUSINESS_TYPE_DEFINITIONS[businessType]?.requiredModules || []
                  ).includes(mod.slug);
                  return (
                    <label
                      key={mod.slug}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-colors flex items-start gap-2.5 select-none',
                        isReq
                          ? 'bg-[var(--bg-surface)] border-[var(--border-strong)] opacity-85 cursor-not-allowed'
                          : isChecked
                          ? 'bg-[var(--rivo-volt-bg)] border-[var(--rivo-volt-border)] cursor-pointer'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] cursor-pointer opacity-70'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isReq}
                        onChange={() => !isReq && handleToggleModule(mod.slug)}
                        className="mt-0.5 rounded border-[var(--border-strong)] accent-[var(--rivo-volt)] cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {mod.name}
                          </span>
                          {isReq && (
                            <span className="font-mono text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] shrink-0">
                              Obbligatorio
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] line-clamp-1 block mt-0.5">
                          {mod.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Business Names & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label
                  htmlFor="business-name-input"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Ragione Sociale / Nome Attività *
                </label>
                <input
                  id="business-name-input"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (!slug) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '-')
                          .replace(/-+/g, '-')
                      );
                    }
                  }}
                  placeholder="es. Bar Centrale oppure Studio Dentistico De Luca…"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label
                  htmlFor="vat-number-input"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Partita IVA / Codice Fiscale
                </label>
                <input
                  id="vat-number-input"
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="es. IT12345678901"
                  className={cn(INPUT_CLASS, 'font-mono')}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description-input"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Slogan / Breve Descrizione (Mostrato nell&apos;Hub)
              </label>
              <input
                id="description-input"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="es. Dal 1985 la migliore tradizione napoletana nel cuore della città…"
                className={INPUT_CLASS}
              />
            </div>

            {/* Slug & Logo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="slug-input"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Slug URL Piattaforma
                </label>
                <input
                  id="slug-input"
                  type="text"
                  spellCheck={false}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="es. bar-centrale-napoli"
                  className={cn(INPUT_CLASS, 'font-mono text-xs')}
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Generato automaticamente dal nome.
                </p>
              </div>

              <div>
                <label
                  htmlFor="logo-url-input"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  URL Logo Attività (Opzionale)
                </label>
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-xl object-cover border border-[var(--border-subtle)] shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                  )}
                  <input
                    id="logo-url-input"
                    type="url"
                    spellCheck={false}
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://… (potrà caricarlo anche il titolare)"
                    className={cn(INPUT_CLASS, 'flex-1 text-xs')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CONTATTI, WEB & SOCIAL */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1">
                2. Contatti, Web &amp; Canali Digitali
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                I recapiti verranno utilizzati nei pulsanti rapidi dell&apos;Hub e per l&apos;assistenza clienti.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="phone-input"
                  className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.75} aria-hidden="true" />
                  <span>Telefono Sede</span>
                </label>
                <input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 081 1234567"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="whatsapp-input"
                  className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5"
                >
                  <MessageSquare
                    className="w-3.5 h-3.5 text-[var(--accent-operational-text)]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>WhatsApp Assistenza / Ordini</span>
                </label>
                <input
                  id="whatsapp-input"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+39 340 1234567"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Email Ufficiale Attività
                </label>
                <input
                  id="email-input"
                  type="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@nomelocale.it"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="website-input"
                  className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.75} aria-hidden="true" />
                  <span>Sito Web</span>
                </label>
                <input
                  id="website-input"
                  type="url"
                  spellCheck={false}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.nomelocale.it"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="instagram-input"
                  className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span>Profilo Instagram (URL o @username)</span>
                </label>
                <input
                  id="instagram-input"
                  type="text"
                  spellCheck={false}
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="@nomelocale oppure https://instagram.com/…"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="google-review-input"
                  className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5"
                >
                  <Star
                    className="w-3.5 h-3.5 text-[var(--accent-warning-text)]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>Link Diretto Recensioni Google (Review Shield)</span>
                </label>
                <input
                  id="google-review-input"
                  type="url"
                  spellCheck={false}
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://g.page/r/… o link Google Maps"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: HUB ESPERIENZA & SERVIZI IN-STORE */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1">
                3. Esperienza Hub &amp; Servizi In-Store
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Configura i servizi rapidi che i clienti vedranno con un tap del chip NFC o scansione QR.
              </p>
            </div>

            {/* Hub Mode Selector */}
            <div>
              <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] mb-2">
                Modalità Operativa del Tag NFC/QR
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'hub',
                    label: 'Universal Experience Hub',
                    desc: 'Hub interattivo con menù, Wi-Fi, recensioni, premi e chiamata sala.',
                  },
                  {
                    id: 'shield',
                    label: 'Review Shield Diretto',
                    desc: 'Apre direttamente la schermata di protezione recensioni a 5 stelle.',
                  },
                  {
                    id: 'smart_routing',
                    label: 'Smart Routing Orario',
                    desc: 'Mostra il menù durante il pranzo e recensioni/promozioni a cena.',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setHubMode(mode.id as 'hub' | 'shield' | 'smart_routing' | 'direct')}
                    className={cn(
                      'p-3.5 rounded-xl border text-left transition-colors cursor-pointer',
                      hubMode === mode.id
                        ? 'bg-[var(--rivo-volt-bg)] border-[var(--rivo-volt)] text-[var(--text-primary)] ring-1 ring-[var(--rivo-volt)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <span className="text-xs font-bold text-[var(--text-primary)] block mb-1">
                      {mode.label}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] leading-snug block">
                      {mode.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Palette Colori Hub */}
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[var(--text-primary)] font-mono font-semibold text-xs uppercase tracking-[0.08em]">
                  <Palette className="w-4 h-4 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                  <span>Palette Colori &amp; Tema Hub</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-secondary)]">Colore attivo:</span>
                  <div
                    className="w-5 h-5 rounded-full border border-[var(--border-strong)]"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="font-mono text-xs text-[var(--text-primary)] uppercase">
                    {primaryColor}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Personalizza l&apos;accento cromatico dell&apos;Hub cliente (tasto hero, icone, pulsante chiamata e accenti).
              </p>

              {/* Color Presets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
                {HUB_COLOR_PRESETS.map((p) => {
                  const isSelected = primaryColor.toUpperCase() === p.primary.toUpperCase();
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPrimaryColor(p.primary)}
                      className={cn(
                        'p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-[var(--bg-surface)] border-[var(--text-primary)] text-[var(--text-primary)] ring-1 ring-[var(--text-primary)]/40'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                      )}
                    >
                      <div
                        className="w-7 h-7 rounded-full border border-[var(--border-strong)] flex items-center justify-center"
                        style={{ backgroundColor: p.primary }}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#09090B]" aria-hidden="true" />}
                      </div>
                      <span className="text-[11px] font-bold truncate max-w-full">{p.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Input */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border-subtle)]">
                <label htmlFor="hub-hex-input" className="text-xs text-[var(--text-secondary)] shrink-0">
                  Colore Personalizzato (HEX):
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="color"
                    aria-label="Selettore colore personalizzato"
                    value={primaryColor.startsWith('#') ? primaryColor : '#B4F02A'}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    id="hub-hex-input"
                    type="text"
                    spellCheck={false}
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#B4F02A"
                    className="w-28 min-h-[38px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Wi-Fi Configuration */}
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-mono font-semibold text-xs uppercase tracking-[0.08em]">
                <Wifi className="w-4 h-4 text-[var(--accent-telemetry-text)]" strokeWidth={1.75} aria-hidden="true" />
                <span>Rete Wi-Fi Ospiti (Connessione 1-Tap)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wifi-ssid-input" className="block text-xs text-[var(--text-secondary)] mb-1">
                    Nome Rete (SSID)
                  </label>
                  <input
                    id="wifi-ssid-input"
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="es. BarCentrale_Ospiti"
                    className={NESTED_INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="wifi-password-input" className="block text-xs text-[var(--text-secondary)] mb-1">
                    Password Wi-Fi
                  </label>
                  <input
                    id="wifi-password-input"
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="es. benvenuto2026"
                    className={cn(NESTED_INPUT_CLASS, 'font-mono')}
                  />
                </div>
              </div>
            </div>

            {/* Custom CTA Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="cta-label-input"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Testo Pulsante Principale Hub
                </label>
                <input
                  id="cta-label-input"
                  type="text"
                  value={customCtaLabel}
                  onChange={(e) => setCustomCtaLabel(e.target.value)}
                  placeholder="Es. Consulta Menù / Prenota Trattamento"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="cta-url-input"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Link di Destinazione (Opzionale)
                </label>
                <input
                  id="cta-url-input"
                  type="url"
                  spellCheck={false}
                  value={customCtaUrl}
                  onChange={(e) => setCustomCtaUrl(e.target.value)}
                  placeholder="https://… (se vuoto apre il menù in-app)"
                  className={cn(INPUT_CLASS, 'font-mono text-xs')}
                />
              </div>
            </div>

            {/* AI Menu Context & Loyalty Reward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ai-menu-context-input"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Contesto Menù / Specialità per AI Sommelier
                </label>
                <textarea
                  id="ai-menu-context-input"
                  rows={3}
                  value={aiMenuContext}
                  onChange={(e) => setAiMenuContext(e.target.value)}
                  placeholder="Es. Specialità pesce fresco, pasta trafilata al bronzo, ottima selezione di vini bianchi campani e dolci fatti in casa…"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] rounded-lg p-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div>
                <label
                  htmlFor="loyalty-reward-input"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Premio Fedeltà / Ruota della Fortuna
                </label>
                <textarea
                  id="loyalty-reward-input"
                  rows={3}
                  value={loyaltyRewardText}
                  onChange={(e) => setLoyaltyRewardText(e.target.value)}
                  placeholder="Es. 10% di sconto sul conto al 10° timbro oppure caffè omaggio alla cassa…"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--rivo-volt)] rounded-lg p-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SEDE FISICA */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1">
                4. Sede Fisica dell&apos;Attività
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Specifica l&apos;indirizzo per le statistiche geolocalizzate e il routing dei dispositivi.
              </p>
            </div>

            <div>
              <label
                htmlFor="location-name-input"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Nome Sede *
              </label>
              <input
                id="location-name-input"
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="es. Sede Principale, oppure Napoli Centro, Milano Duomo"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label
                htmlFor="address-input"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Indirizzo (Via e Civico)
              </label>
              <input
                id="address-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="es. Via Toledo 120"
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="city-input"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Città
                </label>
                <input
                  id="city-input"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Napoli"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="province-input"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Provincia (Sigla)
                </label>
                <input
                  id="province-input"
                  type="text"
                  maxLength={4}
                  value={province}
                  onChange={(e) => setProvince(e.target.value.toUpperCase())}
                  placeholder="NA"
                  className={cn(INPUT_CLASS, 'uppercase font-mono')}
                />
              </div>

              <div>
                <label
                  htmlFor="postal-code-input"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  CAP
                </label>
                <input
                  id="postal-code-input"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="80134"
                  className={cn(INPUT_CLASS, 'font-mono')}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: ACCESSO TITOLARE & DISPOSITIVO HARDWARE */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1">
                5. Accesso Titolare &amp; Hardware NFC
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Crea l&apos;account esercente e associa il primo chip/QR fisico pronto all&apos;uso.
              </p>
            </div>

            {/* Owner Details */}
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-4">
              <div className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                <span>Dati del Titolare dell&apos;Attività</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner-first-name" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Nome
                  </label>
                  <input
                    id="owner-first-name"
                    type="text"
                    value={ownerFirstName}
                    onChange={(e) => setOwnerFirstName(e.target.value)}
                    placeholder="Mario"
                    className={NESTED_INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="owner-last-name" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Cognome
                  </label>
                  <input
                    id="owner-last-name"
                    type="text"
                    value={ownerLastName}
                    onChange={(e) => setOwnerLastName(e.target.value)}
                    placeholder="Rossi"
                    className={NESTED_INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="owner-email" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Email di Accesso Dashboard Titolare *
                </label>
                <input
                  id="owner-email"
                  type="email"
                  required
                  spellCheck={false}
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="mario.rossi@barcentrale.it"
                  className={NESTED_INPUT_CLASS}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="owner-password" className="text-xs font-medium text-[var(--text-secondary)]">
                    Password Iniziale Titolare *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-semibold text-[var(--rivo-volt-text)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" strokeWidth={1.75} aria-hidden="true" />
                    <span>Genera Casuale</span>
                  </button>
                </div>
                <input
                  id="owner-password"
                  type="text"
                  required
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className={cn(NESTED_INPUT_CLASS, 'font-mono')}
                />
              </div>

              <div>
                <label htmlFor="plan-name-select" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Piano Abbonamento
                </label>
                <select
                  id="plan-name-select"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className={NESTED_INPUT_CLASS}
                >
                  <option value="Free">Free (€0/mese - 3 dispositivi)</option>
                  <option value="Starter">Starter (€29/mese - 10 dispositivi)</option>
                  <option value="Pro">Pro (€79/mese - 50 dispositivi)</option>
                </select>
              </div>
            </div>

            {/* First Device */}
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-4">
              <div className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[var(--accent-operational-text)]" strokeWidth={1.75} aria-hidden="true" />
                <span>Primo Chip / QR Code Hardware</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="first-device-name" className="block text-xs text-[var(--text-secondary)] mb-1">
                    Nome Dispositivo *
                  </label>
                  <input
                    id="first-device-name"
                    type="text"
                    required
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="es. Tavolo 1"
                    className={NESTED_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="first-device-type" className="block text-xs text-[var(--text-secondary)] mb-1">
                    Tecnologia Supportata
                  </label>
                  <select
                    id="first-device-type"
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value as 'both' | 'nfc' | 'qr')}
                    className={NESTED_INPUT_CLASS}
                  >
                    <option value="both">Entrambi (NFC + QR)</option>
                    <option value="nfc">Solo Chip NFC</option>
                    <option value="qr">Solo Codice QR</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="first-device-code" className="block text-xs text-[var(--text-secondary)]">
                      Codice Seriale Univoco
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setDeviceCode('RIVO-' + Math.random().toString(36).substring(2, 8).toUpperCase())
                      }
                      className="text-[11px] font-semibold text-[var(--rivo-volt-text)] hover:underline cursor-pointer"
                    >
                      Rigenera
                    </button>
                  </div>
                  <input
                    id="first-device-code"
                    type="text"
                    required
                    spellCheck={false}
                    value={deviceCode}
                    onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
                    className={cn(NESTED_INPUT_CLASS, 'font-mono text-xs uppercase')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="first-device-url" className="block text-xs text-[var(--text-secondary)] mb-1">
                  URL Reale di Destinazione *
                </label>
                <input
                  id="first-device-url"
                  type="url"
                  required
                  spellCheck={false}
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://… oppure link Google Maps"
                  className={cn(NESTED_INPUT_CLASS, 'font-mono text-xs')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] text-xs font-semibold transition-colors min-h-[44px] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Indietro</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !businessName.trim()) {
                  setErrorMsg("Inserisci la ragione sociale o il nome dell'attività.");
                  return;
                }
                setErrorMsg(null);
                setStep(step + 1);
              }}
              className="px-5 py-2.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold transition-colors min-h-[44px] flex items-center gap-1.5 cursor-pointer"
            >
              <span>Avanti</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleCreateOrg}
              className="px-6 py-2.5 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[var(--rivo-volt-ink)] text-xs font-bold transition-colors min-h-[44px] flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Attivazione in Corso…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                  <span>Completa Registrazione &amp; Attiva</span>
                </>
              )}
            </button>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}

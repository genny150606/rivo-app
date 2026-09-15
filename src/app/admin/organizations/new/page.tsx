'use client';

import { useState, useMemo } from 'react';
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
  Sparkles, 
  Globe, 
  MessageSquare, 
  KeyRound, 
  Search,
  SlidersHorizontal,
  Image as ImageIcon
} from 'lucide-react';

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
import Link from 'next/link';
import { 
  CATEGORIES, 
  CATEGORY_GROUPS, 
  getCategoryDefinition 
} from '@/lib/categories';
import { BusinessCategory } from '@/lib/types';

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
  const [deviceCode, setDeviceCode] = useState(() => 'RIVO-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [destinationUrl, setDestinationUrl] = useState('https://google.com');

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter((cat) => {
      const matchesGroup = selectedGroup === 'all' || cat.categoryGroup === selectedGroup;
      const matchesSearch = searchQuery === '' || 
        cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [selectedGroup, searchQuery]);

  // Generate random strong password
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
    if (catId === 'hotel' || catId === 'bnb') {
      setDeviceName('Camera 101');
    } else if (catId === 'salon' || catId === 'barber' || catId === 'beauty') {
      setDeviceName('Postazione 1');
    } else if (catId === 'retail' || catId === 'store' || catId === 'pharmacy') {
      setDeviceName('Cassa Principale');
    } else if (catId === 'medical' || catId === 'dental' || catId === 'professional') {
      setDeviceName('Sala d\'Attesa');
    } else {
      setDeviceName('Tavolo 1');
    }
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
    }
  };

  if (completionMsg) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-xl border border-[#BFFF00]/30 bg-[#121214] p-6 sm:p-8">
          <CheckCircle2 className="w-10 h-10 text-[#BFFF00] mb-4" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Organizzazione Attivata</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{completionMsg}</p>
          <div className="mt-6 pt-6 border-t border-[#27272A] flex flex-wrap gap-3">
            <Link
              href="/admin/organizations"
              className="inline-flex items-center gap-2 rounded-lg bg-[#BFFF00] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#a8e000]"
            >
              Vai all&apos;Elenco Organizzazioni <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 min-w-0">
      {/* Header */}
      <div>
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-3 min-h-[44px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Torna alle Organizzazioni
        </Link>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Nuova Attività Cliente
          </h1>
          <span className="text-xs text-[#BFFF00] font-semibold px-2.5 py-1 rounded-full bg-[#BFFF00]/10 border border-[#BFFF00]/20">
            Fase {step} di 5
          </span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Configurazione approfondita: identità, canali digitali, esperienza Hub in-store, sede e chip NFC/QR.
        </p>
      </div>

      {/* Progress Steps Bar */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 border-b border-[#27272A] pb-4">
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
              className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-lg text-left transition-all ${
                isCurrent
                  ? 'bg-zinc-800/80 border border-zinc-700'
                  : isDone
                  ? 'hover:bg-zinc-900 cursor-pointer'
                  : 'opacity-50 cursor-default'
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-[#BFFF00] text-black ring-2 ring-[#BFFF00]/30'
                    : isDone
                    ? 'bg-zinc-800 text-[#BFFF00]'
                    : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden md:block min-w-0">
                <span className={`text-[11px] font-medium block truncate ${isCurrent ? 'text-white' : 'text-zinc-500'}`}>
                  {s.label}
                </span>
                <span className="text-[9px] text-zinc-500 block">Fase {s.num}</span>
              </div>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Wizard Form Card */}
      <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-4 sm:p-6 lg:p-7 space-y-6">
        
        {/* STEP 1: IDENTITÀ & BRAND (18+ SETTORI CON SVG) */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1">1. Identità & Categoria Attività</h2>
              <p className="text-xs text-zinc-400">Seleziona il settore merceologico per preconfigurare l&apos;Hub e le interazioni automatiche.</p>
            </div>

            {/* Category Filter Tabs */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Settore di Attività ({CATEGORIES.length} Categorie Disponibili) *
                </label>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca settore o attività..."
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#BFFF00]"
                  />
                </div>
              </div>

              {/* Group Pill Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {CATEGORY_GROUPS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroup(g.id)}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                      selectedGroup === g.id
                        ? 'bg-[#BFFF00] text-black font-semibold'
                        : 'bg-[#18181B] text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto p-1 rounded-xl border border-[#27272A]/50 bg-[#09090B]/50 scrollbar-thin">
                {filteredCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#BFFF00]/15 border-[#BFFF00] text-white shadow-[0_0_15px_rgba(191,255,0,0.15)] ring-1 ring-[#BFFF00]'
                          : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#BFFF00] text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#BFFF00]" />}
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

            {/* Business Names & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Ragione Sociale / Nome Attività *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                    }
                  }}
                  placeholder="es. Bar Centrale oppure Studio Dentistico De Luca"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Partita IVA / Codice Fiscale</label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="es. IT12345678901"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#BFFF00]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Slogan / Breve Descrizione (Mostrato nell&apos;Hub)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="es. Dal 1985 la migliore tradizione napoletana nel cuore della città"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            {/* Slug & Logo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Slug URL Piattaforma</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="es. bar-centrale-napoli"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white font-mono text-xs focus:outline-none focus:border-[#BFFF00]"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Generato automaticamente dal nome.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">URL Logo Attività (Opzionale)</label>
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="w-11 h-11 rounded-xl object-cover border border-[#27272A] shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-[#27272A] flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 text-zinc-500" />
                    </div>
                  )}
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://... (potrà caricarlo anche il titolare)"
                    className="flex-1 min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#BFFF00]"
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
              <h2 className="text-base sm:text-lg font-bold text-white mb-1">2. Contatti, Web & Canali Digitali</h2>
              <p className="text-xs text-zinc-400">I recapiti verranno utilizzati nei pulsanti rapidi dell&apos;Hub e per l&apos;assistenza clienti.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" /> Telefono Sede
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 081 1234567"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Assistenza / Ordini
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+39 340 1234567"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Email Ufficiale Attività</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@nomelocale.it"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-400" /> Sito Web
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.nomelocale.it"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                  <InstagramIcon className="w-3.5 h-3.5 text-pink-400" /> Profilo Instagram (URL o @username)
                </label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="@nomelocale oppure https://instagram.com/..."
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Link Diretto Recensioni Google (Review Shield)
                </label>
                <input
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://g.page/r/... o link Google Maps"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: HUB ESPERIENZA & SERVIZI IN-STORE */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1">3. Esperienza Hub & Servizi In-Store</h2>
              <p className="text-xs text-zinc-400">Configura i servizi rapidi che i clienti vedranno con un tap del chip NFC o scansione QR.</p>
            </div>

            {/* Hub Mode Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Modalità Operativa del Tag NFC/QR
              </label>
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
                    onClick={() => setHubMode(mode.id as any)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      hubMode === mode.id
                        ? 'bg-[#BFFF00]/15 border-[#BFFF00] text-white shadow-[0_0_15px_rgba(191,255,0,0.15)] ring-1 ring-[#BFFF00]'
                        : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs font-bold text-white block mb-1">{mode.label}</span>
                    <span className="text-[11px] text-zinc-500 leading-snug block">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wi-Fi Configuration */}
            <div className="p-4 rounded-xl bg-[#18181B]/80 border border-[#27272A] space-y-3">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs uppercase tracking-wider">
                <Wifi className="w-4 h-4 text-cyan-400" /> Rete Wi-Fi Ospiti (Connessione 1-Tap)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Nome Rete (SSID)</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="es. BarCentrale_Ospiti"
                    className="w-full min-h-[44px] bg-[#121214] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Password Wi-Fi</label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="es. benvenuto2026"
                    className="w-full min-h-[44px] bg-[#121214] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#BFFF00]"
                  />
                </div>
              </div>
            </div>

            {/* Custom CTA Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Testo Pulsante Principale Hub</label>
                <input
                  type="text"
                  value={customCtaLabel}
                  onChange={(e) => setCustomCtaLabel(e.target.value)}
                  placeholder="Es. Consulta Menù / Prenota Trattamento"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Link di Destinazione (Opzionale)</label>
                <input
                  type="url"
                  value={customCtaUrl}
                  onChange={(e) => setCustomCtaUrl(e.target.value)}
                  placeholder="https://... (se vuoto apre il menù in-app)"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white font-mono text-xs focus:outline-none focus:border-[#BFFF00]"
                />
              </div>
            </div>

            {/* AI Menu Context & Loyalty Reward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Contesto Menù / Specialità per AI Sommelier</label>
                <textarea
                  rows={3}
                  value={aiMenuContext}
                  onChange={(e) => setAiMenuContext(e.target.value)}
                  placeholder="Es. Specialità pesce fresco, pasta trafilata al bronzo, ottima selezione di vini bianchi campani e dolci fatti in casa..."
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Premio Fedeltà / Ruota della Fortuna</label>
                <textarea
                  rows={3}
                  value={loyaltyRewardText}
                  onChange={(e) => setLoyaltyRewardText(e.target.value)}
                  placeholder="Es. 10% di sconto sul conto al 10° timbro oppure caffè omaggio alla cassa"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SEDE FISICA */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1">4. Sede Fisica dell&apos;Attività</h2>
              <p className="text-xs text-zinc-400">Specifica l&apos;indirizzo per le statistiche geolocalizzate e il routing dei dispositivi.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Nome Sede *</label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="es. Sede Principale, oppure Napoli Centro, Milano Duomo"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Indirizzo (Via e Civico)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="es. Via Toledo 120"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Città</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Napoli"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Provincia (Sigla)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={province}
                  onChange={(e) => setProvince(e.target.value.toUpperCase())}
                  placeholder="NA"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">CAP</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="80134"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: ACCESSO TITOLARE & DISPOSITIVO HARDWARE */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1">5. Accesso Titolare & Hardware NFC</h2>
              <p className="text-xs text-zinc-400">Crea l&apos;account esercente e associa il primo chip/QR fisico pronto all&apos;uso.</p>
            </div>

            {/* Owner Details */}
            <div className="p-4 rounded-xl bg-[#18181B]/80 border border-[#27272A] space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#BFFF00]" /> Dati del Titolare dell&apos;Attività
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Nome</label>
                  <input
                    type="text"
                    value={ownerFirstName}
                    onChange={(e) => setOwnerFirstName(e.target.value)}
                    placeholder="Mario"
                    className="w-full min-h-[44px] bg-[#121214] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Cognome</label>
                  <input
                    type="text"
                    value={ownerLastName}
                    onChange={(e) => setOwnerLastName(e.target.value)}
                    placeholder="Rossi"
                    className="w-full min-h-[44px] bg-[#121214] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Email di Accesso Dashboard Titolare *</label>
                <input
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="mario.rossi@barcentrale.it"
                  className="w-full min-h-[44px] bg-[#121214] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-400">Password Iniziale Titolare *</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-[#BFFF00] hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" /> Genera Casuale
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full min-h-[44px] bg-[#121214] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#BFFF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Piano Abbonamento</label>
                <select
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full min-h-[44px] bg-[#121214] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                >
                  <option value="Free">Free (€0/mese - 3 dispositivi)</option>
                  <option value="Starter">Starter (€29/mese - 10 dispositivi)</option>
                  <option value="Pro">Pro (€79/mese - 50 dispositivi)</option>
                </select>
              </div>
            </div>

            {/* First Device */}
            <div className="p-4 rounded-xl bg-[#18181B]/80 border border-[#27272A] space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-400" /> Primo Chip / QR Code Hardware
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Nome Dispositivo *</label>
                  <input
                    type="text"
                    required
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="es. Tavolo 1"
                    className="w-full min-h-[44px] bg-[#121214] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Tecnologia Supportata</label>
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value as 'both' | 'nfc' | 'qr')}
                    className="w-full min-h-[44px] bg-[#121214] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                  >
                    <option value="both">Entrambi (NFC + QR)</option>
                    <option value="nfc">Solo Chip NFC</option>
                    <option value="qr">Solo Codice QR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Codice Seriale Univoco</label>
                  <input
                    type="text"
                    required
                    value={deviceCode}
                    onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
                    className="w-full min-h-[44px] bg-[#121214] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white font-mono text-xs uppercase focus:outline-none focus:border-[#BFFF00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">URL Reale di Destinazione *</label>
                <input
                  type="url"
                  required
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://... oppure link Google Maps"
                  className="w-full min-h-[44px] bg-[#121214] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white font-mono text-xs focus:outline-none focus:border-[#BFFF00]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#27272A] gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-lg border border-[#27272A] text-zinc-300 hover:text-white hover:bg-[#18181B] text-xs font-semibold transition-colors min-h-[44px] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Indietro
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !businessName.trim()) {
                  setErrorMsg('Inserisci la ragione sociale o il nome dell\'attività.');
                  return;
                }
                setErrorMsg(null);
                setStep(step + 1);
              }}
              className="px-5 py-2.5 rounded-lg bg-[#BFFF00] hover:bg-[#a8e000] text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(191,255,0,0.2)] min-h-[44px] flex items-center gap-1.5"
            >
              Avanti <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleCreateOrg}
              className="px-6 py-2.5 rounded-lg bg-[#BFFF00] hover:bg-[#a8e000] text-black text-xs font-bold transition-all shadow-[0_0_20px_rgba(191,255,0,0.25)] min-h-[44px] flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Attivazione in Corso...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completa Registrazione & Attiva</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

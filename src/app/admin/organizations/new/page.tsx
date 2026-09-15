'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Building, MapPin, UserCheck, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function NewOrganizationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completionMsg, setCompletionMsg] = useState<string | null>(null);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [category, setCategory] = useState<'restaurant' | 'salon' | 'hotel' | 'medical' | 'retail' | 'generic'>('restaurant');
  const [hubMode, setHubMode] = useState<'hub' | 'shield' | 'smart_routing' | 'direct'>('hub');
  const [customCtaLabel, setCustomCtaLabel] = useState('');
  const [customCtaUrl, setCustomCtaUrl] = useState('');

  const [locationName, setLocationName] = useState('Sede Principale');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('Rivo2026!');

  const [planName, setPlanName] = useState('Starter');

  const [deviceName, setDeviceName] = useState('Tavolo 1');
  const [deviceType, setDeviceType] = useState<'nfc' | 'qr' | 'both'>('both');
  const [destinationUrl, setDestinationUrl] = useState('https://google.com');

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
          locationName,
          address,
          city,
          postalCode,
          ownerFirstName,
          ownerLastName,
          ownerEmail,
          ownerPassword,
          planName,
          deviceName,
          deviceType,
          destinationUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la creazione.');
      }

      if (data.emailWarning) {
        setCompletionMsg(`Organizzazione creata. ${data.emailWarning}`);
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
          <CheckCircle2 className="w-8 h-8 text-[#BFFF00] mb-4" />
          <h1 className="text-xl font-bold text-white">Organizzazione attivata</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{completionMsg}</p>
        </div>
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-2 rounded-lg bg-[#BFFF00] px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#a8e000]"
        >
          Vai alle organizzazioni <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-3 min-h-[44px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Torna alle Organizzazioni
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Nuova Organizzazione Cliente
          </h1>
          <span className="text-xs text-[#BFFF00] font-medium sm:hidden">Fase {step} di 4</span>
        </div>
        <p className="text-sm text-zinc-400">
          Configurazione guidata dell&apos;attività, sede iniziale, credenziali del titolare e primo chip NFC/QR.
        </p>
      </div>

      {/* Steps Progress Indicator */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-4 gap-2">
        {[
          { num: 1, label: 'Attività', icon: Building },
          { num: 2, label: 'Sede', icon: MapPin },
          { num: 3, label: 'Credenziali', icon: UserCheck },
          { num: 4, label: 'Hardware', icon: Cpu },
        ].map((s) => {
          const Icon = s.icon;
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-[#BFFF00] text-black ring-2 ring-[#BFFF00]/30'
                    : isDone
                    ? 'bg-zinc-800 text-[#BFFF00]'
                    : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${isCurrent ? 'text-white' : 'text-zinc-500'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      {/* Form Steps */}
      <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 sm:p-6 space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-1">Dati dell&apos;Attività Commerciale</h2>
            <p className="text-xs text-zinc-400 mb-3">Seleziona il settore per adattare automaticamente l&apos;Universal Hub e le funzionalità.</p>

            {/* Category Selector Cards */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Settore di Attività *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'restaurant', label: 'Ristorante / Bar', icon: '🍽️', desc: 'Menù, Sala, Wi-Fi' },
                  { id: 'salon', label: 'Salone & Beauty', icon: '💈', desc: 'Prenota, Timbri, Wi-Fi' },
                  { id: 'hotel', label: 'Hotel & B&B', icon: '🏨', desc: 'Wi-Fi, Reception, Guida' },
                  { id: 'medical', label: 'Studio Medico', icon: '🩺', desc: 'Visite, Sala attesa' },
                  { id: 'retail', label: 'Retail & Negozio', icon: '🛍️', desc: 'Ruota sconti, Fidelity' },
                  { id: 'generic', label: 'Palestre & Servizi', icon: '🏢', desc: 'Contatti, Info, Orari' },
                ].map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id as any);
                        if (cat.id === 'salon' && !customCtaLabel) setCustomCtaLabel('Prenota un Appuntamento');
                        else if (cat.id === 'restaurant' && !customCtaLabel) setCustomCtaLabel('Consulta Menù Digitale');
                        else if (cat.id === 'medical' && !customCtaLabel) setCustomCtaLabel('Prenota Visita Specialistica');
                        else if (cat.id === 'hotel' && !customCtaLabel) setCustomCtaLabel('Contatta la Reception');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#BFFF00]/15 border-[#BFFF00] text-white shadow-[0_0_15px_rgba(191,255,0,0.15)]'
                          : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xl block mb-1">{cat.icon}</span>
                      <span className="text-xs font-bold text-white block">{cat.label}</span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">{cat.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Attività *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="es. Barber Club Milano oppure Ristorante Da Mario"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">URL Logo Attività (Opzionale)</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://... (oppure potrà caricarlo il titolare dal suo profilo)"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Pulsante Principale Hub (Opzionale)</label>
                <input
                  type="text"
                  value={customCtaLabel}
                  onChange={(e) => setCustomCtaLabel(e.target.value)}
                  placeholder="Es. Prenota Taglio / Menù Pranzo"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Link di Destinazione Pulsante</label>
                <input
                  type="url"
                  value={customCtaUrl}
                  onChange={(e) => setCustomCtaUrl(e.target.value)}
                  placeholder="https://wa.me/39... oppure link prenotazione"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white font-mono text-xs focus:outline-none focus:border-[#BFFF00]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Slug Univoco (URL)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Lascia vuoto per generarlo automaticamente"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white font-mono text-xs focus:outline-none focus:border-[#BFFF00]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Email di contatto</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@tuolocale.it"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Telefono</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 081 123456"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-2">Sede Principale</h2>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Sede *</label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="es. Napoli Centro"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Indirizzo</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Via Toledo 120"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Città</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Napoli"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">CAP</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="80134"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-2">Credenziali di Accesso del Titolare</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={ownerFirstName}
                  onChange={(e) => setOwnerFirstName(e.target.value)}
                  placeholder="Mario"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Cognome</label>
                <input
                  type="text"
                  value={ownerLastName}
                  onChange={(e) => setOwnerLastName(e.target.value)}
                  placeholder="Rossi"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Email di Accesso Titolare *</label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="mario.rossi@barcentrale.it"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              />
              <p className="text-xs text-zinc-500 mt-1">Questa sarà l&apos;email con cui il cliente effettuerà il login.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Password Iniziale Assegnata *</label>
              <input
                type="text"
                required
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Rivo2026!"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white font-mono"
              />
              <p className="text-xs text-zinc-500 mt-1">
                La password che consegnerai al cliente (potrà cambiarla in autonomia dalle Impostazioni).
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Piano Abbonamento</label>
              <select
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="Free">Free (€0/mese - 3 dispositivi)</option>
                <option value="Starter">Starter (€29/mese - 10 dispositivi)</option>
                <option value="Pro">Pro (€79/mese - 50 dispositivi)</option>
              </select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-2">Dispositivo Iniziale NFC / QR</h2>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Dispositivo *</label>
              <input
                type="text"
                required
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="es. Tavolo 1 o Cassa"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Tecnologia Supportata</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value as 'both' | 'nfc' | 'qr')}
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="both">Entrambi (NFC + QR)</option>
                <option value="nfc">Solo NFC</option>
                <option value="qr">Solo QR Code</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">URL Destinazione (es. Google Review Link) *</label>
              <input
                type="url"
                required
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://g.page/r/your-google-review-link"
                className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Questo link può essere aggiornato in qualsiasi momento senza modificare il chip fisico.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#27272A]/80 gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="min-h-[44px] px-4 py-2 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors touch-press"
            >
              Indietro
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              disabled={step === 1 && !businessName.trim()}
              onClick={() => setStep(step + 1)}
              className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-black bg-[#BFFF00] hover:bg-[#a8e000] rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 touch-press"
            >
              <span>Continua</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || !deviceName.trim() || !destinationUrl.trim()}
              onClick={handleCreateOrg}
              className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-black bg-[#BFFF00] hover:bg-[#a8e000] rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 touch-press"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crea e Attiva Organizzazione'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

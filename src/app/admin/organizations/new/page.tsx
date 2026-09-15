'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Building, MapPin, UserCheck, CreditCard, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function NewOrganizationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  const [locationName, setLocationName] = useState('Sede Principale');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  const [planName, setPlanName] = useState('Starter');

  const [deviceName, setDeviceName] = useState('Tavolo 1');
  const [deviceType, setDeviceType] = useState<'nfc' | 'qr' | 'both'>('both');
  const [destinationUrl, setDestinationUrl] = useState('https://google.com');

  const handleCreateOrg = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();

      // 1. Get Plan ID
      const { data: plan } = await supabase
        .from('plans')
        .select('id')
        .eq('name', planName)
        .single();

      // 2. Create Organization
      const finalSlug = slug.trim() || businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({
          name: businessName,
          slug: finalSlug,
          phone: phone || null,
          email: email || null,
          website: website || null,
          plan_id: plan?.id || null,
          status: 'active',
        })
        .select()
        .single();

      if (orgErr || !org) throw new Error(orgErr?.message || 'Errore creazione organizzazione');

      // 3. Create Location
      const { data: loc, error: locErr } = await supabase
        .from('locations')
        .insert({
          organization_id: org.id,
          name: locationName,
          address: address || null,
          city: city || null,
          postal_code: postalCode || null,
          country: 'IT',
        })
        .select()
        .single();

      if (locErr || !loc) throw new Error(locErr?.message || 'Errore creazione sede');

      // 4. Create Initial Device with auto-generated code
      const randCode = 'RIVO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error: devErr } = await supabase
        .from('devices')
        .insert({
          organization_id: org.id,
          location_id: loc.id,
          name: deviceName,
          type: deviceType,
          unique_code: randCode,
          destination_url: destinationUrl,
          status: 'active',
        });

      if (devErr) throw new Error(devErr.message);

      router.push('/admin/organizations');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore imprevisto';
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Torna alle Organizzazioni
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
          Nuova Organizzazione Cliente
        </h1>
        <p className="text-sm text-zinc-400">
          Configurazione guidata dell'attività commerciale, sede iniziale e primo dispositivo NFC/QR.
        </p>
      </div>

      {/* Steps Progress Indicator */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
        {[
          { num: 1, label: 'Attività', icon: Building },
          { num: 2, label: 'Sede', icon: MapPin },
          { num: 3, label: 'Proprietario', icon: UserCheck },
          { num: 4, label: 'Hardware', icon: Cpu },
        ].map((s) => {
          const Icon = s.icon;
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isCurrent
                    ? 'bg-[#BFFF00] text-black'
                    : isDone
                    ? 'bg-zinc-800 text-[#BFFF00]'
                    : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
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
      <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6 space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-2">Dati dell'Attività Commerciale</h2>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Attività *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="es. Bar Centrale"
                className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Slug Univoco (URL)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="bar-centrale"
                className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Email di contatto</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@barcentrale.it"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Telefono</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 081 123456"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
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
                className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Indirizzo</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Via Toledo 120"
                className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Città</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Napoli"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">CAP</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="80134"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white mb-2">Titolare / Amministratore dell'Attività</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={ownerFirstName}
                  onChange={(e) => setOwnerFirstName(e.target.value)}
                  placeholder="Mario"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Cognome</label>
                <input
                  type="text"
                  value={ownerLastName}
                  onChange={(e) => setOwnerLastName(e.target.value)}
                  placeholder="Rossi"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Email Account Titolare *</label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="mario.rossi@barcentrale.it"
                className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Piano Abbonamento</label>
              <select
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
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
                className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Tecnologia Supportata</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value as any)}
                className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
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
                className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Questo link può essere aggiornato in qualsiasi momento senza modificare il chip fisico.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#27272A]/80">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-sm text-zinc-300 hover:text-white bg-zinc-800 rounded-lg transition-colors"
            >
              Indietro
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              disabled={step === 1 && !businessName.trim()}
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 text-sm font-semibold text-black bg-[#BFFF00] hover:bg-[#a8e000] rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              Continua <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || !deviceName.trim() || !destinationUrl.trim()}
              onClick={handleCreateOrg}
              className="px-5 py-2 text-sm font-semibold text-black bg-[#BFFF00] hover:bg-[#a8e000] rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crea e Attiva Organizzazione'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

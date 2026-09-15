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
  Wine
} from 'lucide-react';

export default function ProfilePage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Org ID
  const [orgId, setOrgId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [reviewUrl, setReviewUrl] = useState('');
  const [reviewShieldEnabled, setReviewShieldEnabled] = useState(true);

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
        setEmail(org.email || '');
        setPhone(org.phone || '');
        setWebsite(org.website || '');
        setReviewUrl(org.google_review_url || '');
        setReviewShieldEnabled(org.review_shield_enabled ?? true);
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
          email: email.trim() || null,
          phone: phone.trim() || null,
          website: website.trim() || null,
          google_review_url: reviewUrl.trim() || null,
          review_shield_enabled: reviewShieldEnabled,
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

        {/* SECTION 2: REVIEW SHIELD CONFIGURATION */}
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

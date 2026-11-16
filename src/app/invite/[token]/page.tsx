'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Lock, 
  User, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface InviteData {
  valid: boolean;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationName: string;
  locationName?: string | null;
}

const ROLE_DISPLAY: Record<string, string> = {
  owner: 'Proprietario / Admin',
  manager: 'Manager di Sala',
  waiter: 'Cameriere / Staff',
};

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('Token di invito non presente.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/staff/invite?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Invito non valido o scaduto.');
        } else {
          setInvite(data);
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
        }
      } catch (err) {
        console.error('Error validating invite token:', err);
        setError('Impossibile verificare l’invito. Controlla la tua connessione.');
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Le due password inserite non coincidono.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante l’attivazione dell’account.');
        setSubmitting(false);
      } else {
        setSubmitSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2200);
      }
    } catch (err) {
      console.error('Error activating invite:', err);
      setError('Errore di rete durante la registrazione.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center p-4 bg-[#09090B] text-[#FAFAFA] font-sans overflow-x-hidden selection:bg-[#BFFF00] selection:text-[#09090B]">
      <div className="w-full max-w-md mx-auto bg-[#111114] border border-[#27272A] rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Top hardware accent strip */}
        <div className="absolute top-0 inset-x-0 h-1 bg-[#BFFF00]" />

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 pt-2">
          <div className="flex items-center gap-2.5 mb-2">
            <Image
              src="/brand/rivo-icon.png"
              alt="RIVO"
              width={34}
              height={34}
              className="rounded-sm"
              priority
            />
            <span className="text-xl font-bold tracking-tight text-white">RIVO</span>
          </div>
          <span className="text-[11px] font-mono font-semibold tracking-wider text-[#BFFF00] uppercase">
            Staff &amp; Floor Operations
          </span>
        </div>

        {/* State: Loading */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin motion-reduce:animate-none text-[#BFFF00]" />
            <p className="text-sm">Verifica invito in corso...</p>
          </div>
        )}

        {/* State: Error / Expired */}
        {!loading && error && !invite && (
          <div className="py-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">Invito Non Valido</h2>
            <p className="text-sm text-zinc-400 mb-6 max-w-xs">{error}</p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              Torna al Login
            </button>
          </div>
        )}

        {/* State: Success Screen */}
        {submitSuccess && (
          <div className="py-8 flex flex-col items-center text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Account Attivato!</h2>
            <p className="text-sm text-zinc-300 mb-4">
              Le tue credenziali sono state salvate. Ti stiamo reindirizzando al login...
            </p>
            <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none text-[#BFFF00]" />
          </div>
        )}

        {/* State: Active Form */}
        {!loading && invite && !submitSuccess && (
          <div>
            {/* Organization Info Box */}
            <div className="mb-6 p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-[#BFFF00]" />
                <span>Invito da {invite.organizationName}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-[#27272A]">
                <span className="text-zinc-400">Ruolo Assegnato:</span>
                <span className="font-semibold text-white px-2.5 py-0.5 rounded-lg bg-[#111114] border border-[#27272A] text-xs">
                  {ROLE_DISPLAY[invite.role] || invite.role}
                </span>
              </div>
              {invite.locationName && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Sede:</span>
                  <span className="text-zinc-200 text-xs">{invite.locationName}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (Readonly) */}
              <div>
                <label htmlFor="invite-email" className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email di accesso
                </label>
                <input
                  id="invite-email"
                  type="email"
                  disabled
                  value={invite.email}
                  className="w-full min-h-[44px] bg-[#09090B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-zinc-400 cursor-not-allowed"
                />
              </div>

              {/* Name and Surname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="invite-firstname" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Nome
                  </label>
                  <input
                    id="invite-firstname"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Mario"
                    className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#BFFF00] transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="invite-lastname" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Cognome
                  </label>
                  <input
                    id="invite-lastname"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Rossi"
                    className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#BFFF00] transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="invite-password" className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Crea una Password
                </label>
                <div className="relative">
                  <input
                    id="invite-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Almeno 8 caratteri"
                    className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl pl-3 pr-12 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#BFFF00] transition-colors"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="invite-confirm-password" className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Conferma Password
                </label>
                <input
                  id="invite-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ripeti la password"
                  className="w-full min-h-[44px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#BFFF00] transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-[#BFFF00] hover:bg-[#d2ff4d] text-[#09090B] font-extrabold text-sm min-h-[48px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#BFFF00]/15 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
                ) : (
                  <>
                    <span>Completa e Attiva Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#27272A] text-center">
              <p className="text-[11px] text-zinc-400">
                Creando l&apos;account accetti le condizioni di servizio e le policy aziendali di {invite.organizationName}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hardware RIVO Footer Badge */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111114] border border-[#27272A] text-[11px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BFFF00]" />
          <span>Accesso Staff • Powered by</span>
          <strong className="text-white font-bold tracking-wide">RIVO</strong>
        </div>
      </footer>
    </div>
  );
}

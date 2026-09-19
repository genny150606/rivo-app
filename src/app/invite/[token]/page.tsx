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
    <div className="min-h-screen min-h-dvh flex items-center justify-center p-4 bg-[#09090B] text-zinc-100 font-sans">
      <div className="w-full max-w-md bg-[#121214] border border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#bfff00] rounded-full shadow-[0_0_20px_#bfff00]" />

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
          <span className="text-[11px] font-semibold tracking-wider text-[#bfff00] uppercase">
            Staff & Floor Operations
          </span>
        </div>

        {/* State: Loading */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#bfff00]" />
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
              onClick={() => router.push('/login')}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-white transition-colors"
            >
              Torna al Login
            </button>
          </div>
        )}

        {/* State: Success Screen */}
        {submitSuccess && (
          <div className="py-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Account Attivato!</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Le tue credenziali sono state salvate. Ti stiamo reindirizzando al login...
            </p>
            <Loader2 className="w-5 h-5 animate-spin text-[#bfff00]" />
          </div>
        )}

        {/* State: Active Form */}
        {!loading && invite && !submitSuccess && (
          <div>
            {/* Organization Info Box */}
            <div className="mb-6 p-4 rounded-xl bg-[#18181B] border border-[#27272A]/80 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-[#bfff00]" />
                <span>Invito da {invite.organizationName}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-1 border-t border-zinc-800">
                <span className="text-zinc-400">Ruolo Assegnato:</span>
                <span className="font-semibold text-white px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-xs">
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
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Email di accesso</label>
                <input
                  type="email"
                  disabled
                  value={invite.email}
                  className="w-full min-h-[42px] bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-400 cursor-not-allowed opacity-80"
                />
              </div>

              {/* Name and Surname */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Nome</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Mario"
                      className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Cognome</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Rossi"
                    className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Crea una Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Almeno 8 caratteri"
                    className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl pl-3 pr-10 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Conferma Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ripeti la password"
                  className="w-full min-h-[42px] bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-3 bg-[#bfff00] hover:bg-[#a6df00] text-black font-bold text-sm min-h-[46px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#bfff00]/10"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Completa e Attiva Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
              <p className="text-[11px] text-zinc-500">
                Creando l'account accetti le condizioni di servizio e le policy aziendali di {invite.organizationName}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

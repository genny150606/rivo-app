'use client';

import { useState } from 'react';
import { KeyRound, Check, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, SurfaceCard } from '@/components/ui';

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La password deve contenere almeno 6 caratteri.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateErr) {
      setError(updateErr.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-2xl min-w-0">
      <PageHeader
        eyebrow="Sicurezza Account"
        title="Impostazioni Account"
        description="Sicurezza, credenziali di accesso e preferenze del tuo account RIVO."
      />

      <SurfaceCard
        radius="2xl"
        padding="lg"
        header={{
          eyebrow: 'Credenziali',
          title: 'Modifica Password',
          subtitle: 'Aggiorna la tua password di accesso alla dashboard',
          icon: KeyRound,
        }}
      >
        <div className="space-y-5">
          {success && (
            <div
              role="status"
              aria-live="polite"
              className="p-3.5 bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] rounded-lg text-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>Password aggiornata con successo.</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3.5 bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] rounded-lg text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label
                htmlFor="settings-new-password"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                Nuova Password
              </label>
              <input
                id="settings-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 6 caratteri…"
                className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="settings-confirm-password"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                Conferma Nuova Password
              </label>
              <input
                id="settings-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la nuova password…"
                className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)] transition-colors"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading || !newPassword}
                className="w-full sm:w-auto bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-semibold text-sm min-h-[44px] px-5 py-2.5 rounded-lg transition-[background-color,transform] duration-[180ms] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Aggiornamento…</span>
                  </>
                ) : (
                  'Aggiorna Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </SurfaceCard>
    </div>
  );
}

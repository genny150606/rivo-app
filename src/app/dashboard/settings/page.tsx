'use client';

import { useState } from 'react';
import { KeyRound, Shield, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Impostazioni Account</h1>
        <p className="text-sm text-zinc-400">
          Sicurezza, credenziali di accesso e preferenze del tuo account RIVO.
        </p>
      </div>

      <div className="rounded-xl border border-[#27272A] bg-[#121214] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Modifica Password</h2>
            <p className="text-xs text-zinc-500">Aggiorna la tua password di accesso alla dashboard</p>
          </div>
        </div>

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> Password aggiornata con successo.
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Nuova Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimo 6 caratteri"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Conferma Nuova Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ripeti la nuova password"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading || !newPassword}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aggiorna Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

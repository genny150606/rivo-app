'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Eye, EyeOff, RefreshCw, Copy, Check, X, ShieldAlert, Users } from 'lucide-react';

interface OrgUser {
  id: string;
  auth_user_id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Titolare',
  admin: 'Superadmin',
  manager: 'Manager',
  staff: 'Staff',
  waiter: 'Cameriere',
  cashier: 'Cassiere',
};

function generatePassword(length = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}

export default function OrgUsersPasswordManager({ organizationId }: { organizationId: string }) {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ email: string | null; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/organizations/${organizationId}/users`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore caricamento utenti');
      setUsers(data.users || []);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Errore caricamento utenti');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openEditor = (userId: string) => {
    setEditingId(userId);
    setPassword('');
    setShowPassword(false);
    setFormError(null);
    setSuccess(null);
    setCopied(false);
  };

  const closeEditor = () => {
    setEditingId(null);
    setPassword('');
    setFormError(null);
  };

  const handleSave = async (user: OrgUser) => {
    if (password.length < 8) {
      setFormError('La password deve avere almeno 8 caratteri');
      return;
    }
    const label = user.email || 'questo utente';
    if (!confirm(`Confermi di voler impostare una nuova password per ${label}? La vecchia password smetterà di funzionare.`)) {
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/admin/organizations/${organizationId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: user.id, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore aggiornamento password');

      setSuccess({ email: user.email, password });
      setEditingId(null);
      setPassword('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Errore aggiornamento password');
    } finally {
      setSaving(false);
    }
  };

  const copyPassword = async () => {
    if (!success) return;
    try {
      await navigator.clipboard.writeText(success.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#121214] p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#BFFF00]" />
            Account & Password
          </h2>
          <p className="text-xs text-zinc-500">Imposta una nuova password per gli utenti di questa attività</p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          title="Ricarica"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-semibold">
              Password aggiornata per {success.email || 'l’utente'}
            </span>
            <button type="button" onClick={() => setSuccess(null)} className="text-zinc-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono bg-black/50 border border-zinc-800 rounded px-2 py-1.5 text-white break-all">
              {success.password}
            </code>
            <button
              type="button"
              onClick={copyPassword}
              className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiata' : 'Copia'}</span>
            </button>
          </div>
          <p className="text-zinc-500">Comunicala al cliente in modo sicuro: non verrà mostrata di nuovo.</p>
        </div>
      )}

      {loadError ? (
        <p className="text-sm text-red-400">{loadError}</p>
      ) : loading && users.length === 0 ? (
        <p className="text-sm text-zinc-500">Caricamento utenti...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-zinc-500 flex items-center gap-2">
          <Users className="w-4 h-4" /> Nessun account associato a questa attività.
        </p>
      ) : (
        <div className="divide-y divide-[#27272A]">
          {users.map((u) => {
            const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ');
            const isEditing = editingId === u.id;
            const isProtected = u.role === 'admin';
            const noAccount = !u.auth_user_id;

            return (
              <div key={u.id} className="py-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-white text-sm block truncate">
                      {u.email || 'Email non disponibile'}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {fullName ? `${fullName} • ` : ''}
                      {ROLE_LABELS[u.role] || u.role}
                      {u.status && u.status !== 'active' ? ` • ${u.status}` : ''}
                    </span>
                  </div>

                  {isProtected ? (
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Account superadmin
                    </span>
                  ) : noAccount ? (
                    <span className="text-[11px] text-zinc-500">Invito non ancora accettato</span>
                  ) : !isEditing ? (
                    <button
                      type="button"
                      onClick={() => openEditor(u.id)}
                      className="min-h-[40px] px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#BFFF00]" />
                      Cambia password
                    </button>
                  ) : null}
                </div>

                {isEditing && (
                  <div className="p-3 rounded-lg bg-black/40 border border-zinc-800 space-y-2.5">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Nuova password (min. 8 caratteri)"
                          autoComplete="new-password"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-3 pr-9 py-2 text-sm text-white focus:outline-none focus:border-[#BFFF00]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                          title={showPassword ? 'Nascondi' : 'Mostra'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPassword(generatePassword());
                          setShowPassword(true);
                        }}
                        className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 whitespace-nowrap"
                      >
                        Genera
                      </button>
                    </div>

                    {formError && <p className="text-xs text-red-400">{formError}</p>}

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={closeEditor}
                        className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300"
                      >
                        Annulla
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(u)}
                        disabled={saving || password.length < 8}
                        className="px-4 py-2 rounded-lg bg-[#BFFF00] hover:bg-lime-300 disabled:opacity-40 text-black text-xs font-bold"
                      >
                        {saving ? 'Salvataggio...' : 'Salva nuova password'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

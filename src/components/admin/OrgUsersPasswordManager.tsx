'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  X,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { SurfaceCard, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';

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
    if (
      !confirm(
        `Confermi di voler impostare una nuova password per ${label}? La vecchia password smetterà di funzionare.`
      )
    ) {
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
    <SurfaceCard
      header={{
        eyebrow: 'IDENTITY & ACCESS',
        title: 'Account & Password',
        subtitle: 'Imposta una nuova password per gli utenti di questa attività',
        icon: KeyRound,
        action: (
          <button
            type="button"
            onClick={loadUsers}
            aria-label="Ricarica utenti"
            title="Ricarica"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <RefreshCw
              className={cn('w-4 h-4', loading && 'animate-spin')}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
        ),
      }}
    >
      <div className="space-y-4">
        {success && (
          <div
            aria-live="polite"
            className="p-3.5 rounded-xl bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-xs space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--accent-operational-text)] font-semibold">
                Password aggiornata per {success.email || 'l’utente'}
              </span>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                aria-label="Chiudi notifica"
                className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-2 text-[var(--text-primary)] break-all">
                {success.password}
              </code>
              <button
                type="button"
                onClick={copyPassword}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-primary)] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[var(--accent-operational-text)]" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{copied ? 'Copiata' : 'Copia'}</span>
              </button>
            </div>
            <p className="text-[var(--text-secondary)]">
              Comunicala al cliente in modo sicuro: non verrà mostrata di nuovo.
            </p>
          </div>
        )}

        {loadError ? (
          <p role="alert" className="text-sm text-[var(--accent-critical-text)]">
            {loadError}
          </p>
        ) : loading && users.length === 0 ? (
          <div className="space-y-3 py-2" aria-busy="true">
            <div className="h-12 rounded-lg bg-[var(--bg-elevated)] animate-pulse" />
            <div className="h-12 rounded-lg bg-[var(--bg-elevated)] animate-pulse" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] flex items-center gap-2 py-2">
            <Users className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>Nessun account associato a questa attività.</span>
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {users.map((u) => {
              const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ');
              const isEditing = editingId === u.id;
              const isProtected = u.role === 'admin';
              const noAccount = !u.auth_user_id;

              return (
                <div key={u.id} className="py-3.5 space-y-3 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-[var(--text-primary)] text-sm block truncate">
                        {u.email || 'Email non disponibile'}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {fullName ? `${fullName} · ` : ''}
                        {ROLE_LABELS[u.role] || u.role}
                        {u.status && u.status !== 'active' ? ` · ${u.status}` : ''}
                      </span>
                    </div>

                    {isProtected ? (
                      <StatusBadge tone="neutral" icon={ShieldAlert}>
                        Account superadmin
                      </StatusBadge>
                    ) : noAccount ? (
                      <StatusBadge tone="warning">Invito non ancora accettato</StatusBadge>
                    ) : !isEditing ? (
                      <button
                        type="button"
                        onClick={() => openEditor(u.id)}
                        className="inline-flex min-h-[44px] px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
                        <span>Cambia password</span>
                      </button>
                    ) : null}
                  </div>

                  {isEditing && (
                    <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <label htmlFor={`pwd-input-${u.id}`} className="sr-only">
                            Nuova password per {u.email || 'utente'}
                          </label>
                          <input
                            id={`pwd-input-${u.id}`}
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nuova password (min. 8 caratteri)…"
                            autoComplete="new-password"
                            className="w-full min-h-[44px] bg-[var(--bg-surface)] border border-[var(--border-strong)] focus:border-[var(--rivo-volt)] rounded-lg pl-3 pr-10 py-2 text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                            title={showPassword ? 'Nascondi' : 'Mostra'}
                            className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <Eye className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPassword(generatePassword());
                            setShowPassword(true);
                          }}
                          className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap transition-colors cursor-pointer"
                        >
                          Genera
                        </button>
                      </div>

                      {formError && (
                        <p role="alert" className="text-xs text-[var(--accent-critical-text)]">
                          {formError}
                        </p>
                      )}

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={closeEditor}
                          className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSave(u)}
                          disabled={saving || password.length < 8}
                          className="min-h-[40px] px-4 py-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] disabled:opacity-40 text-[var(--rivo-volt-ink)] text-xs font-bold transition-colors cursor-pointer"
                        >
                          {saving ? 'Salvataggio…' : 'Salva nuova password'}
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
    </SurfaceCard>
  );
}

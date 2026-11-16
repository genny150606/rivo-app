'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Layers,
  X,
  Send,
  Loader2,
  Building,
} from 'lucide-react';
import { StaffRole } from '@/lib/rbac';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  StatusBadge,
  type StatusTone,
  SurfaceCard,
} from '@/components/ui';

interface StaffMember {
  id: string;
  auth_user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: 'active' | 'suspended' | 'deactivated';
  location_id: string | null;
  last_login_at: string | null;
  created_at: string;
}

interface StaffInvitation {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  location_id: string | null;
  status: string;
  created_at: string;
  expires_at: string;
}

interface TableAssignment {
  id: string;
  waiter_id: string;
  device_id: string;
  assigned_at: string;
  devices: {
    id: string;
    name: string;
    unique_code: string;
  };
}

interface LocationItem {
  id: string;
  name: string;
}

const ROLE_INFO: Record<string, { label: string; tone: StatusTone; desc: string }> = {
  owner: {
    label: 'Proprietario',
    tone: 'warning',
    desc: 'Accesso completo alla gestione locale, staff e configurazione.',
  },
  client: {
    label: 'Proprietario',
    tone: 'warning',
    desc: 'Accesso completo alla gestione locale, staff e configurazione.',
  },
  manager: {
    label: 'Manager di Sala',
    tone: 'telemetry',
    desc: 'Gestione sala, assegnazione tavoli, monitor chiamate e ordini.',
  },
  waiter: {
    label: 'Cameriere',
    tone: 'operational',
    desc: 'Gestione comande al tavolo, ricezione chiamate e presa tavoli.',
  },
};

export default function StaffManagementPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [assignments, setAssignments] = useState<TableAssignment[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('waiter');
  const [inviteLocationId, setInviteLocationId] = useState<string>('');
  const [inviting, setInviting] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Inline deactivation confirmation modal state (replaces native confirm())
  const [confirmDeactivateMember, setConfirmDeactivateMember] = useState<StaffMember | null>(null);

  // Action states
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadStaffByOrg = useCallback(async (activeOrg?: string | null) => {
    try {
      setError(null);
      const url = activeOrg ? `/api/staff?organization_id=${activeOrg}` : '/api/staff';
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore nel recupero dello staff');
      }

      setStaffList(data.staff || []);
      setInvitations(data.invitations || []);
      setAssignments(data.assignments || []);
      setLocations(data.locations || []);
    } catch (err: unknown) {
      console.error('Fetch staff error:', err);
      setError(err instanceof Error ? err.message : 'Errore nel recupero dello staff');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaffData = useCallback(
    async (orgIdOverride?: string) => {
      setLoading(true);
      await loadStaffByOrg(orgIdOverride ?? currentOrgId);
    },
    [loadStaffByOrg, currentOrgId]
  );

  const resetInviteModal = useCallback(() => {
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteFirstName('');
    setInviteLastName('');
    setInviteRole('waiter');
    setInviteLocationId('');
    setGeneratedInviteUrl(null);
    setCopiedLink(false);
  }, []);

  useEffect(() => {
    async function initUserAndOrg() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          await loadStaffByOrg();
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id, role')
          .eq('auth_user_id', user.id)
          .single();

        let resolvedOrgId = profile?.organization_id;
        const role = profile?.role;
        setUserRole(role ?? null);

        if (role === 'admin') {
          const { data: allOrgs } = await supabase
            .from('organizations')
            .select('id, name')
            .order('name', { ascending: true });

          if (allOrgs && allOrgs.length > 0) {
            setOrganizations(allOrgs);
            if (!resolvedOrgId) {
              resolvedOrgId = allOrgs[0].id;
            }
          }
        }

        if (resolvedOrgId) {
          setCurrentOrgId(resolvedOrgId);
        }
        await loadStaffByOrg(resolvedOrgId);
      } catch (e) {
        console.error('Staff init error:', e);
        await loadStaffByOrg();
      }
    }
    void initUserAndOrg();
  }, [loadStaffByOrg, supabase]);

  // Escape key closes open dialogs
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmDeactivateMember) {
        setConfirmDeactivateMember(null);
      } else if (isInviteModalOpen) {
        resetInviteModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isInviteModalOpen, confirmDeactivateMember, resetInviteModal]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setError('Inserisci un indirizzo email valido.');
      return;
    }

    setInviting(true);
    setError(null);

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          firstName: inviteFirstName,
          lastName: inviteLastName,
          role: inviteRole,
          locationId: inviteLocationId || null,
          organizationId: currentOrgId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l’invito');
      }

      setGeneratedInviteUrl(data.inviteUrl);
      setSuccessMsg(
        data.emailSent
          ? 'Invito spedito via email con successo!'
          : 'Invito generato! Puoi condividere il link diretto con il collaboratore.'
      );
      fetchStaffData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore durante l’invito');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateStatus = async (
    staffId: string,
    status: 'active' | 'suspended' | 'deactivated'
  ) => {
    setActionInProgress(staffId);
    try {
      const res = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          status,
          organizationId: currentOrgId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operazione fallita');

      setSuccessMsg(`Stato collaboratore aggiornato a "${status}".`);
      setConfirmDeactivateMember(null);
      fetchStaffData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Operazione fallita');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setActionInProgress(inviteId);
    try {
      const deleteUrl = currentOrgId
        ? `/api/staff/invite?id=${inviteId}&organization_id=${currentOrgId}`
        : `/api/staff/invite?id=${inviteId}`;
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nella revoca');

      setSuccessMsg('Invito revocato con successo.');
      fetchStaffData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore nella revoca');
    } finally {
      setActionInProgress(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Helper to get active tables assigned to a waiter
  const getAssignedTables = (waiterId: string) => {
    return assignments
      .filter((a) => a.waiter_id === waiterId)
      .map((a) => a.devices?.name || 'Tavolo');
  };

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      <PageHeader
        eyebrow="Organizzazione & Risorse Umane"
        title="Gestione Staff & Collaboratori"
        description="Invita camerieri e manager, assegna ruoli e monitora l'assegnazione operativa ai tavoli in sala in tempo reale."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {userRole === 'admin' && organizations.length > 0 && (
              <div className="flex items-center gap-2 bg-[var(--bg-surface)] px-3 min-h-[44px] rounded-lg border border-[var(--border-strong)]">
                <Building
                  className="w-4 h-4 text-[var(--rivo-volt-text)] shrink-0"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <label htmlFor="staff-org-select" className="text-xs text-[var(--text-muted)] font-medium shrink-0">
                  Attività:
                </label>
                <select
                  id="staff-org-select"
                  value={currentOrgId || ''}
                  onChange={(e) => {
                    const newOrg = e.target.value;
                    setCurrentOrgId(newOrg);
                    fetchStaffData(newOrg);
                  }}
                  className="bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer max-w-[180px] truncate"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs sm:text-sm transition-[background-color,transform] duration-[180ms] active:scale-[0.98] cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              <span>Invita Collaboratore</span>
            </button>
          </div>
        }
      />

      {/* Alerts */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] flex items-center justify-between gap-3 text-sm text-[var(--accent-critical-text)]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Chiudi avviso errore"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-[var(--bg-surface)]/40 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] flex items-center justify-between gap-3 text-sm text-[var(--accent-operational-text)]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            aria-label="Chiudi avviso successo"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-[var(--bg-surface)]/40 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Staff Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Collaboratori Attivi"
          value={staffList.filter((s) => s.status === 'active').length}
          icon={Users}
          tone="neutral"
          loading={loading}
        />
        <KpiCard
          label="Camerieri in Turno"
          value={staffList.filter((s) => s.role === 'waiter' && s.status === 'active').length}
          icon={Shield}
          tone="operational"
          loading={loading}
        />
        <KpiCard
          label="Tavoli Assegnati"
          value={assignments.length}
          icon={Layers}
          tone="volt"
          loading={loading}
        />
        <KpiCard
          label="Inviti in Attesa"
          value={invitations.length}
          icon={Mail}
          tone="warning"
          loading={loading}
        />
      </div>

      {/* Staff Table / Directory */}
      <SurfaceCard
        radius="xl"
        padding="none"
        header={{
          eyebrow: 'Team',
          title: `Organigramma Staff (${staffList.length} membri)`,
          icon: Users,
          action: (
            <button
              type="button"
              onClick={() => fetchStaffData()}
              disabled={loading}
              title="Aggiorna lista"
              aria-label="Aggiorna organigramma staff"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
          ),
        }}
      >
        {loading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-[var(--bg-elevated)]" />
            ))}
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-5">
            <EmptyState
              compact
              icon={Users}
              title="Nessun collaboratore trovato"
              description='Nessun collaboratore trovato. Fai clic su "Invita Collaboratore" per iniziare.'
              primaryAction={{
                label: 'Invita Collaboratore',
                onClick: () => setIsInviteModalOpen(true),
                icon: UserPlus,
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-elevated)] font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Collaboratore</th>
                  <th className="px-4 py-3.5 font-medium">Ruolo</th>
                  <th className="px-4 py-3.5 font-medium">Stato</th>
                  <th className="px-4 py-3.5 font-medium">Tavoli Presi in Carico</th>
                  <th className="px-4 py-3.5 font-medium">Ultimo Accesso</th>
                  <th className="px-5 py-3.5 text-right font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {staffList.map((member) => {
                  const roleMeta = ROLE_INFO[member.role] || {
                    label: member.role,
                    tone: 'neutral' as StatusTone,
                    desc: '',
                  };
                  const assignedTables = getAssignedTables(member.id);

                  return (
                    <tr
                      key={member.id}
                      className="min-h-[48px] hover:bg-[var(--bg-elevated)]/60 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center font-bold text-xs text-[var(--text-primary)] shrink-0">
                            {(member.first_name?.[0] || member.email?.[0] || 'U').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text-primary)] truncate">
                              {member.first_name
                                ? `${member.first_name} ${member.last_name || ''}`.trim()
                                : 'Collaboratore'}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] truncate">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge tone={roleMeta.tone} mono>
                          {roleMeta.label}
                        </StatusBadge>
                      </td>

                      <td className="px-4 py-3.5">
                        {member.status === 'active' && (
                          <StatusBadge tone="operational" dot mono>
                            Attivo
                          </StatusBadge>
                        )}
                        {member.status === 'suspended' && (
                          <StatusBadge tone="warning" dot mono>
                            Sospeso
                          </StatusBadge>
                        )}
                        {member.status === 'deactivated' && (
                          <StatusBadge tone="neutral" dot mono>
                            Disattivato
                          </StatusBadge>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {assignedTables.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedTables.map((tName, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-mono"
                              >
                                {tName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] italic">
                            Nessun tavolo
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs font-mono tabular-nums text-[var(--text-secondary)]">
                        {member.last_login_at
                          ? new Date(member.last_login_at).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Mai'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {member.role !== 'owner' && member.role !== 'client' && (
                          <div className="inline-flex items-center gap-1">
                            {member.status === 'active' ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(member.id, 'suspended')}
                                disabled={actionInProgress === member.id}
                                title="Sospendi temporaneamente"
                                aria-label={`Sospendi ${member.first_name || member.email || 'collaboratore'}`}
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-warning-text)] hover:bg-[var(--accent-warning-bg)] transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <PauseCircle className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(member.id, 'active')}
                                disabled={actionInProgress === member.id}
                                title="Riattiva collaboratore"
                                aria-label={`Riattiva ${member.first_name || member.email || 'collaboratore'}`}
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-operational-text)] hover:bg-[var(--accent-operational-bg)] transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <PlayCircle className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                              </button>
                            )}

                            {member.status !== 'deactivated' && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeactivateMember(member)}
                                disabled={actionInProgress === member.id}
                                title="Disattiva account"
                                aria-label={`Disattiva ${member.first_name || member.email || 'collaboratore'}`}
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-critical-text)] hover:bg-[var(--accent-critical-bg)] transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <SurfaceCard
          radius="xl"
          padding="none"
          header={{
            eyebrow: 'Onboarding',
            title: `Inviti in Attesa di Registrazione (${invitations.length})`,
            icon: Mail,
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-elevated)] font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Destinatario</th>
                  <th className="px-4 py-3.5 font-medium">Ruolo Proposto</th>
                  <th className="px-4 py-3.5 font-medium">Data Invito</th>
                  <th className="px-4 py-3.5 font-medium">Scadenza</th>
                  <th className="px-5 py-3.5 text-right font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {invitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="min-h-[48px] hover:bg-[var(--bg-elevated)]/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[var(--text-primary)]">
                        {inv.first_name
                          ? `${inv.first_name} ${inv.last_name || ''}`.trim()
                          : inv.email}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">{inv.email}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge tone={ROLE_INFO[inv.role]?.tone || 'neutral'} mono>
                        {ROLE_INFO[inv.role]?.label || inv.role}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-3.5 text-xs font-mono tabular-nums text-[var(--text-secondary)]">
                      {new Date(inv.created_at).toLocaleDateString('it-IT')}
                    </td>

                    <td className="px-4 py-3.5 text-xs font-mono tabular-nums text-[var(--text-secondary)]">
                      {new Date(inv.expires_at).toLocaleDateString('it-IT')}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRevokeInvite(inv.id)}
                        disabled={actionInProgress === inv.id}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent-critical-text)] hover:bg-[var(--accent-critical-bg)] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                        <span>Revoca</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      {/* Deactivate Confirmation Modal (replaces native confirm()) */}
      {confirmDeactivateMember && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivate-confirm-title"
          onClick={() => setConfirmDeactivateMember(null)}
          className="fixed inset-0 bg-[var(--bg-backdrop)] backdrop-blur-sm z-50 flex items-center justify-center p-4 overscroll-contain"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] flex items-center justify-center text-[var(--accent-critical-text)] shrink-0">
                <AlertCircle className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2
                  id="deactivate-confirm-title"
                  className="font-display text-base font-bold text-[var(--text-primary)]"
                >
                  Disattiva Collaboratore
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Sei sicuro di voler disattivare{' '}
                  <strong className="text-[var(--text-primary)]">
                    {confirmDeactivateMember.first_name || confirmDeactivateMember.email}
                  </strong>
                  ? Lo storico dei suoi ordini e mance rimarrà intatto.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setConfirmDeactivateMember(null)}
                className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={actionInProgress === confirmDeactivateMember.id}
                onClick={() => handleUpdateStatus(confirmDeactivateMember.id, 'deactivated')}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B91C1C] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
              >
                {actionInProgress === confirmDeactivateMember.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                )}
                <span>Disattiva Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Collaborator Modal */}
      {isInviteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-modal-title"
          onClick={resetInviteModal}
          className="fixed inset-0 bg-[var(--bg-backdrop)] backdrop-blur-sm z-50 flex items-center justify-center p-4 overscroll-contain"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5 font-display font-bold text-base text-[var(--text-primary)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] flex items-center justify-center text-[var(--rivo-volt-text)] shrink-0">
                  <UserPlus className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <span id="invite-modal-title">Invita Nuovo Collaboratore</span>
              </div>
              <button
                type="button"
                onClick={resetInviteModal}
                aria-label="Chiudi modale invito"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {generatedInviteUrl ? (
              <div className="py-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] flex items-center justify-center text-[var(--accent-operational-text)] mx-auto">
                  <CheckCircle2 className="w-6 h-6" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="text-center">
                  <h3 className="font-display font-bold text-[var(--text-primary)] text-base">
                    Invito Generato con Successo!
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Abbiamo inviato un&apos;email a{' '}
                    <span className="font-semibold text-[var(--text-primary)]">{inviteEmail}</span>
                    . Puoi anche copiare direttamente il link di registrazione monouso:
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    aria-label="Link di invito monouso"
                    value={generatedInviteUrl}
                    className="w-full bg-transparent text-xs text-[var(--text-primary)] outline-none font-mono truncate"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedInviteUrl)}
                    className="min-h-[44px] px-3 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? (
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{copiedLink ? 'Copiato!' : 'Copia'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={resetInviteModal}
                  className="w-full min-h-[44px] py-2.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-[var(--text-primary)] font-semibold text-sm transition-colors cursor-pointer"
                >
                  Fatto
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="pt-4 space-y-4">
                <div>
                  <label
                    htmlFor="invite-email"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Email del Collaboratore *
                  </label>
                  <input
                    id="invite-email"
                    name="email"
                    type="email"
                    spellCheck={false}
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="cameriere@ristorante.it…"
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="invite-first-name"
                      className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                    >
                      Nome
                    </label>
                    <input
                      id="invite-first-name"
                      name="firstName"
                      type="text"
                      value={inviteFirstName}
                      onChange={(e) => setInviteFirstName(e.target.value)}
                      placeholder="Mario…"
                      className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="invite-last-name"
                      className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                    >
                      Cognome
                    </label>
                    <input
                      id="invite-last-name"
                      name="lastName"
                      type="text"
                      value={inviteLastName}
                      onChange={(e) => setInviteLastName(e.target.value)}
                      placeholder="Rossi…"
                      className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="invite-role"
                    className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                  >
                    Ruolo Operativo *
                  </label>
                  <select
                    id="invite-role"
                    name="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                    className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                  >
                    <option value="waiter">Cameriere (Solo gestione tavoli e comande)</option>
                    <option value="manager">Manager di Sala (Assegnazione tavoli e monitor)</option>
                    <option value="owner">Proprietario / Admin (Accesso completo)</option>
                  </select>
                </div>

                {locations.length > 0 && (
                  <div>
                    <label
                      htmlFor="invite-location"
                      className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                    >
                      Sede di Assegnazione (Opzionale)
                    </label>
                    <select
                      id="invite-location"
                      name="locationId"
                      value={inviteLocationId}
                      onChange={(e) => setInviteLocationId(e.target.value)}
                      className="w-full min-h-[44px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus-visible:border-[var(--text-primary)]"
                    >
                      <option value="">Tutte le sedi</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={inviting}
                    className="w-full min-h-[44px] bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-[background-color,transform] duration-[180ms] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {inviting ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                        <span>Invia Invito</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

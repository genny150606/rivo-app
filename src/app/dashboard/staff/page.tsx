'use client';

import { useState, useEffect, useTransition } from 'react';
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
  MapPin, 
  Clock, 
  Layers,
  X,
  Send,
  Loader2,
  Lock
} from 'lucide-react';
import { StaffRole } from '@/lib/rbac';

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

const ROLE_INFO: Record<string, { label: string; badgeClass: string; desc: string }> = {
  owner: {
    label: 'Proprietario',
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    desc: 'Accesso completo alla gestione locale, staff e configurazione.',
  },
  client: {
    label: 'Proprietario',
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    desc: 'Accesso completo alla gestione locale, staff e configurazione.',
  },
  manager: {
    label: 'Manager di Sala',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    desc: 'Gestione sala, assegnazione tavoli, monitor chiamate e ordini.',
  },
  waiter: {
    label: 'Cameriere',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    desc: 'Gestione comande al tavolo, ricezione chiamate e presa tavoli.',
  },
};

export default function StaffManagementPage() {
  const [loading, setLoading] = useState(true);
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

  // Action states
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/staff');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore nel recupero dello staff');
      }

      setStaffList(data.staff || []);
      setInvitations(data.invitations || []);
      setAssignments(data.assignments || []);
      setLocations(data.locations || []);
    } catch (err: any) {
      console.error('Fetch staff error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l’invito');
      }

      setGeneratedInviteUrl(data.inviteUrl);
      setSuccessMsg(data.emailSent ? 'Invito spedito via email con successo!' : 'Invito generato! Puoi condividere il link diretto con il collaboratore.');
      fetchStaffData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateStatus = async (staffId: string, status: 'active' | 'suspended' | 'deactivated') => {
    setActionInProgress(staffId);
    try {
      const res = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operazione fallita');

      setSuccessMsg(`Stato collaboratore aggiornato a "${status}".`);
      fetchStaffData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setActionInProgress(inviteId);
    try {
      const res = await fetch(`/api/staff/invite?id=${inviteId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nella revoca');

      setSuccessMsg('Invito revocato con successo.');
      fetchStaffData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const resetInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteFirstName('');
    setInviteLastName('');
    setInviteRole('waiter');
    setInviteLocationId('');
    setGeneratedInviteUrl(null);
    setCopiedLink(false);
  };

  // Helper to get active tables assigned to a waiter
  const getAssignedTables = (waiterId: string) => {
    return assignments
      .filter((a) => a.waiter_id === waiterId)
      .map((a) => a.devices?.name || 'Tavolo');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5 text-[#bfff00]" />
            <span>Organizzazione & Risorse Umane</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Gestione Staff & Collaboratori
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Invita camerieri e manager, assegna ruoli e monitora l'assegnazione operativa ai tavoli in sala in tempo reale.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-medium text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-[0.98] shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4 text-[#bfff00] dark:text-zinc-950" />
          <span>Invita Collaboratore</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3 text-sm text-rose-500">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-sm text-emerald-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Staff Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Collaboratori Attivi</span>
          <p className="text-2xl font-bold text-zinc-950 dark:text-white mt-1">
            {staffList.filter((s) => s.status === 'active').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Camerieri in Turno</span>
          <p className="text-2xl font-bold text-emerald-500 mt-1">
            {staffList.filter((s) => s.role === 'waiter' && s.status === 'active').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tavoli Assegnati</span>
          <p className="text-2xl font-bold text-[#bfff00] mt-1">{assignments.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Inviti in Attesa</span>
          <p className="text-2xl font-bold text-amber-500 mt-1">{invitations.length}</p>
        </div>
      </div>

      {/* Staff Table / Directory */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <h2 className="font-semibold text-base text-zinc-950 dark:text-white flex items-center gap-2">
            <span>Organigramma Staff</span>
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">({staffList.length} membri)</span>
          </h2>
          <button
            onClick={fetchStaffData}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
            title="Aggiorna lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#bfff00]" />
            <p className="text-sm">Caricamento staff...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-sm">
            Nessun collaboratore trovato. Fai clic su "Invita Collaboratore" per iniziare.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-5 py-3">Collaboratore</th>
                  <th className="px-4 py-3">Ruolo</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3">Tavoli Presi in Carico</th>
                  <th className="px-4 py-3">Ultimo Accesso</th>
                  <th className="px-5 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {staffList.map((member) => {
                  const roleMeta = ROLE_INFO[member.role] || {
                    label: member.role,
                    badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
                    desc: '',
                  };
                  const assignedTables = getAssignedTables(member.id);

                  return (
                    <tr key={member.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-center font-bold text-xs text-zinc-800 dark:text-zinc-200 shrink-0">
                            {(member.first_name?.[0] || member.email?.[0] || 'U').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-950 dark:text-white truncate">
                              {member.first_name ? `${member.first_name} ${member.last_name || ''}`.trim() : 'Collaboratore'}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleMeta.badgeClass}`}>
                          {roleMeta.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {member.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Attivo
                          </span>
                        )}
                        {member.status === 'suspended' && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Sospeso
                          </span>
                        )}
                        {member.status === 'deactivated' && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                            Disattivato
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {assignedTables.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedTables.map((tName, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono"
                              >
                                {tName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">Nessun tavolo</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-zinc-500 dark:text-zinc-400">
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
                                onClick={() => handleUpdateStatus(member.id, 'suspended')}
                                disabled={actionInProgress === member.id}
                                title="Sospendi temporaneamente"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                              >
                                <PauseCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(member.id, 'active')}
                                disabled={actionInProgress === member.id}
                                title="Riattiva collaboratore"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                              >
                                <PlayCircle className="w-4 h-4" />
                              </button>
                            )}

                            {member.status !== 'deactivated' && (
                              <button
                                onClick={() => {
                                  if (confirm(`Sei sicuro di voler disattivare ${member.first_name || member.email}? Lo storico dei suoi ordini e mance rimarrà intatto.`)) {
                                    handleUpdateStatus(member.id, 'deactivated');
                                  }
                                }}
                                disabled={actionInProgress === member.id}
                                title="Disattiva account"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <div className="bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
            <h2 className="font-semibold text-base text-zinc-950 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500" />
              <span>Inviti in Attesa di Registrazione</span>
              <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">({invitations.length})</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-5 py-3">Destinatario</th>
                  <th className="px-4 py-3">Ruolo Proposto</th>
                  <th className="px-4 py-3">Data Invito</th>
                  <th className="px-4 py-3">Scadenza</th>
                  <th className="px-5 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-zinc-950 dark:text-white">
                        {inv.first_name ? `${inv.first_name} ${inv.last_name || ''}`.trim() : inv.email}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{inv.email}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {ROLE_INFO[inv.role]?.label || inv.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(inv.created_at).toLocaleDateString('it-IT')}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(inv.expires_at).toLocaleDateString('it-IT')}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleRevokeInvite(inv.id)}
                        disabled={actionInProgress === inv.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoca</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Collaborator Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center gap-2 font-bold text-base text-zinc-950 dark:text-white">
                <UserPlus className="w-5 h-5 text-[#bfff00]" />
                <span>Invita Nuovo Collaboratore</span>
              </div>
              <button
                onClick={resetInviteModal}
                className="text-zinc-400 hover:text-zinc-950 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedInviteUrl ? (
              <div className="py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-zinc-950 dark:text-white text-base">Invito Generato con Successo!</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Abbiamo inviato un'email a <span className="font-semibold text-zinc-800 dark:text-zinc-200">{inviteEmail}</span>. Puoi anche copiare direttamente il link di registrazione monouso:
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteUrl}
                    className="w-full bg-transparent text-xs text-zinc-700 dark:text-zinc-300 outline-none font-mono truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedInviteUrl)}
                    className="p-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold shrink-0 hover:opacity-90 flex items-center gap-1"
                  >
                    {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copiato!' : 'Copia'}</span>
                  </button>
                </div>

                <button
                  onClick={resetInviteModal}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm transition-all"
                >
                  Fatto
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Email del Collaboratore *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="cameriere@ristorante.it"
                    className="w-full min-h-[42px] bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Nome</label>
                    <input
                      type="text"
                      value={inviteFirstName}
                      onChange={(e) => setInviteFirstName(e.target.value)}
                      placeholder="Mario"
                      className="w-full min-h-[42px] bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Cognome</label>
                    <input
                      type="text"
                      value={inviteLastName}
                      onChange={(e) => setInviteLastName(e.target.value)}
                      placeholder="Rossi"
                      className="w-full min-h-[42px] bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Ruolo Operativo *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                    className="w-full min-h-[42px] bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                  >
                    <option value="waiter">Cameriere (Solo gestione tavoli e comande)</option>
                    <option value="manager">Manager di Sala (Assegnazione tavoli e monitor)</option>
                    <option value="owner">Proprietario / Admin (Accesso completo)</option>
                  </select>
                </div>

                {locations.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Sede di Assegnazione (Opzionale)
                    </label>
                    <select
                      value={inviteLocationId}
                      onChange={(e) => setInviteLocationId(e.target.value)}
                      className="w-full min-h-[42px] bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
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
                    className="w-full min-h-[44px] bg-[#bfff00] hover:bg-[#a6df00] text-zinc-950 font-bold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-[#bfff00]/10"
                  >
                    {inviting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
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

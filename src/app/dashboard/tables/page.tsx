'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Layers,
  UserCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  Clock,
  Building,
  Loader2,
  X,
} from 'lucide-react';
import {
  PageHeader,
  SurfaceCard,
  KpiCard,
  StatusBadge,
  SegmentedControl,
  EmptyState,
} from '@/components/ui';

interface DeviceTable {
  id: string;
  name: string;
  unique_code: string;
  location_id: string | null;
  status?: string;
}

interface TableAssignment {
  id: string;
  device_id: string;
  waiter_id: string;
  status: string;
  assigned_at: string;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role: string;
  } | null;
}

interface StaffMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  status: string;
}

export default function FloorManagementPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [tables, setTables] = useState<DeviceTable[]>([]);
  const [assignments, setAssignments] = useState<TableAssignment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'free'>('all');

  // Modal / Assign selection
  const [selectedTable, setSelectedTable] = useState<DeviceTable | null>(null);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  const fetchFloorData = async (orgIdOverride?: string) => {
    try {
      setLoading(true);
      setError(null);
      const activeOrg = orgIdOverride || currentOrgId;
      const url = activeOrg ? `/api/tables/assignments?organization_id=${activeOrg}` : '/api/tables/assignments';
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore nel recupero della sala');
      }

      setTables(data.tables || []);
      setAssignments(data.assignments || []);
      setStaff(data.staff || []);
    } catch (err: any) {
      console.error('Fetch floor error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function initUserAndOrg() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError('Accesso non autorizzato. Effettua il login.');
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id, role')
          .eq('auth_user_id', user.id)
          .single();

        let resolvedOrgId = profile?.organization_id;
        const role = profile?.role;
        setUserRole(role);

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
          await fetchFloorData(resolvedOrgId);
        } else {
          await fetchFloorData();
        }
      } catch (e: any) {
        console.error('Tables init error:', e);
        setError(e?.message || "Errore durante l'inizializzazione della sala");
        setLoading(false);
      }
    }
    initUserAndOrg();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTable && !assigning) {
        setSelectedTable(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTable, assigning]);

  const handleAssignTable = async (deviceId: string, waiterId: string) => {
    setAssigning(true);
    setError(null);

    try {
      const res = await fetch('/api/tables/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, waiterId, organizationId: currentOrgId || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore nell’assegnazione');
      }

      setSuccessMsg('Tavolo assegnato con successo!');
      setSelectedTable(null);
      setSelectedWaiterId('');
      fetchFloorData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleReleaseTable = async (deviceId: string) => {
    setError(null);
    try {
      const deleteUrl = currentOrgId
        ? `/api/tables/assignments?deviceId=${deviceId}&organization_id=${currentOrgId}`
        : `/api/tables/assignments?deviceId=${deviceId}`;
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore nel rilascio del tavolo');
      }

      setSuccessMsg('Tavolo liberato con successo.');
      fetchFloorData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Find assignment map
  const assignmentByDeviceId = new Map<string, TableAssignment>();
  assignments.forEach((a) => {
    assignmentByDeviceId.set(a.device_id, a);
  });

  // Filtered tables
  const filteredTables = tables.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.unique_code.toLowerCase().includes(searchQuery.toLowerCase());
    const isAssigned = assignmentByDeviceId.has(t.id);

    if (!matchesSearch) return false;
    if (statusFilter === 'assigned') return isAssigned;
    if (statusFilter === 'free') return !isAssigned;
    return true;
  });

  const totalTables = tables.length;
  const assignedCount = assignments.length;
  const freeCount = totalTables - assignedCount;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Floor Operations"
        eyebrowTone="volt"
        title="Sala & Gestione Tavoli"
        description="Mappa operativa in tempo reale dei tavoli del ristorante. Assegna e libera i camerieri responsabili per il routing delle chiamate e delle comande."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {userRole === 'admin' && organizations.length > 0 && (
              <div className="flex items-center gap-2 bg-[var(--bg-surface)] px-3 py-2 rounded-xl border border-[var(--border-subtle)] min-h-[40px]">
                <Building className="w-4 h-4 text-[var(--rivo-volt-text)] shrink-0" />
                <label htmlFor="floor-org-select" className="text-xs text-[var(--text-secondary)] font-medium shrink-0">
                  Attività:
                </label>
                <select
                  id="floor-org-select"
                  value={currentOrgId || ''}
                  onChange={(e) => {
                    const newOrg = e.target.value;
                    setCurrentOrgId(newOrg);
                    fetchFloorData(newOrg);
                  }}
                  className="bg-transparent text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer max-w-[180px] truncate"
                >
                  {organizations.map((org) => (
                    <option
                      key={org.id}
                      value={org.id}
                      className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    >
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={() => fetchFloorData()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold text-xs hover:bg-[var(--bg-subtle)] transition-colors shadow-2xs min-h-[40px]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Aggiorna Sala</span>
            </button>
          </div>
        }
      />

      {/* Alerts */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] flex items-center justify-between gap-3 text-xs text-[var(--accent-critical-text)]"
        >
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Chiudi errore"
            className="p-1 rounded-lg hover:bg-[var(--bg-surface)]/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xl bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] flex items-center justify-between gap-3 text-xs text-[var(--accent-operational-text)]"
        >
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            aria-label="Chiudi notifica"
            className="p-1 rounded-lg hover:bg-[var(--bg-surface)]/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floor KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard label="Totale Tavoli" value={totalTables} icon={Layers} tone="neutral" />
        <KpiCard label="Tavoli Coperti" value={assignedCount} icon={UserCheck} tone="operational" />
        <KpiCard label="Tavoli Liberi" value={freeCount} icon={Clock} tone="warning" />
      </div>

      {/* Filter and Search Bar */}
      <SurfaceCard padding="sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              aria-label="Cerca tavolo o codice"
              placeholder="Cerca tavolo (es. Tavolo 5)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--rivo-volt)] focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>

          <SegmentedControl
            ariaLabel="Filtra tavoli per stato"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: `Tutti (${totalTables})` },
              { value: 'assigned', label: `Coperti (${assignedCount})` },
              { value: 'free', label: `Liberi (${freeCount})` },
            ]}
          />
        </div>
      </SurfaceCard>

      {/* Table Cards Grid */}
      {loading ? (
        <SurfaceCard className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--rivo-volt-text)]" />
          <p className="text-sm text-[var(--text-muted)]">Caricamento sala...</p>
        </SurfaceCard>
      ) : filteredTables.length === 0 ? (
        <SurfaceCard padding="none">
          <EmptyState
            icon={Layers}
            title="Nessun tavolo trovato"
            description="Nessun tavolo trovato con i filtri correnti."
          />
        </SurfaceCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const assignment = assignmentByDeviceId.get(table.id);
            const isAssigned = !!assignment;
            const waiter = assignment?.profiles;

            return (
              <SurfaceCard
                key={table.id}
                padding="md"
                className={`flex flex-col justify-between transition-all ${
                  isAssigned
                    ? 'border-[var(--accent-operational-border)]'
                    : 'hover:border-[var(--border-strong)]'
                }`}
              >
                <div>
                  {/* Top table info */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono tabular-nums text-xs text-[var(--text-muted)] tracking-wider uppercase">
                      {table.unique_code}
                    </span>
                    <StatusBadge tone={isAssigned ? 'operational' : 'warning'} size="sm" dot>
                      {isAssigned ? 'Preso in Carico' : 'Libero'}
                    </StatusBadge>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{table.name}</h3>

                  {/* Waiter Details or Unassigned prompt */}
                  {isAssigned && waiter ? (
                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] font-bold text-xs flex items-center justify-center shrink-0">
                          {(waiter.first_name?.[0] || 'C').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {waiter.first_name
                              ? `${waiter.first_name} ${waiter.last_name || ''}`.trim()
                              : 'Cameriere'}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)]">Responsabile Tavolo</p>
                        </div>
                      </div>
                      <div className="mt-2 text-[11px] text-[var(--text-muted)] font-mono tabular-nums flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Dalle{' '}
                          {new Date(assignment.assigned_at).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)]/70 border border-dashed border-[var(--border-subtle)] mb-4 text-center">
                      <p className="text-xs text-[var(--text-muted)] italic">Nessun cameriere assegnato</p>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-subtle)]">
                  {isAssigned ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTable(table);
                          setSelectedWaiterId(assignment.waiter_id);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors"
                      >
                        Riassegna
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReleaseTable(table.id)}
                        className="py-2 px-3 rounded-xl text-xs font-semibold text-[var(--accent-critical-text)] hover:bg-[var(--accent-critical-bg)] transition-colors"
                      >
                        Libera
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTable(table);
                        setSelectedWaiterId('');
                      }}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assegna a Cameriere</span>
                    </button>
                  )}
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      )}

      {/* Assignment Modal */}
      {selectedTable && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-table-modal-title"
          className="fixed inset-0 bg-[var(--bg-backdrop)] backdrop-blur-xs z-50 flex items-center justify-center p-4 overscroll-contain"
        >
          <div className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 id="assign-table-modal-title" className="font-bold text-base text-[var(--text-primary)]">
                  Assegna {selectedTable.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Seleziona il cameriere che gestirà il tavolo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                aria-label="Chiudi modale assegnazione"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Staff Disponibile ({staff.length})
              </label>

              {staff.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">
                  Nessun collaboratore attivo disponibile. Invita un cameriere nella sezione Staff.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {staff.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedWaiterId(member.id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        selectedWaiterId === member.id
                          ? 'border-[var(--rivo-volt)] bg-[var(--rivo-volt-bg)] text-[var(--text-primary)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {member.first_name
                            ? `${member.first_name} ${member.last_name || ''}`.trim()
                            : member.email}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] capitalize">
                          {member.role === 'waiter' ? 'Cameriere' : member.role}
                        </p>
                      </div>
                      {selectedWaiterId === member.id && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--rivo-volt-text)] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={!selectedWaiterId || assigning}
                onClick={() => handleAssignTable(selectedTable.id, selectedWaiterId)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {assigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Conferma Assegnazione</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

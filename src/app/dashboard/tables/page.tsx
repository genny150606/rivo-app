'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Layers, 
  UserCheck, 
  UserX, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Clock, 
  ChevronRight,
  Shield,
  Building,
  Loader2,
  X
} from 'lucide-react';

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
        const { data: { user } } = await supabase.auth.getUser();
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
        setError(e?.message || 'Errore durante l\'inizializzazione della sala');
        setLoading(false);
      }
    }
    initUserAndOrg();
  }, []);

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
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5 text-[#bfff00]" />
            <span>Floor Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Sala & Gestione Tavoli
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Mappa operativa in tempo reale dei tavoli del ristorante. Assegna e libera i camerieri responsabili per il routing delle chiamate e delle comande.
          </p>
        </div>

        {userRole === 'admin' && organizations.length > 0 && (
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <Building className="w-4 h-4 text-[#bfff00] shrink-0" />
            <span className="text-xs text-zinc-500 font-medium shrink-0">Attività:</span>
            <select
              value={currentOrgId || ''}
              onChange={(e) => {
                const newOrg = e.target.value;
                setCurrentOrgId(newOrg);
                fetchFloorData(newOrg);
              }}
              className="bg-transparent text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={() => fetchFloorData()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Aggiorna Sala</span>
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

      {/* Floor KPIs */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Totale Tavoli</span>
          <p className="text-2xl font-bold text-zinc-950 dark:text-white mt-1">{totalTables}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tavoli Coperti</span>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{assignedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tavoli Liberi</span>
          <p className="text-2xl font-bold text-amber-500 mt-1">{freeCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#121214] p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Cerca tavolo (es. Tavolo 5)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Tutti ({totalTables})
          </button>
          <button
            onClick={() => setStatusFilter('assigned')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'assigned'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Coperti ({assignedCount})
          </button>
          <button
            onClick={() => setStatusFilter('free')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'free'
                ? 'bg-amber-600 text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Liberi ({freeCount})
          </button>
        </div>
      </div>

      {/* Table Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#bfff00]" />
          <p className="text-sm">Caricamento sala...</p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 text-sm bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
          Nessun tavolo trovato con i filtri correnti.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const assignment = assignmentByDeviceId.get(table.id);
            const isAssigned = !!assignment;
            const waiter = assignment?.profiles;

            return (
              <div
                key={table.id}
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  isAssigned
                    ? 'bg-white dark:bg-[#121214] border-emerald-500/30 shadow-xs'
                    : 'bg-white dark:bg-[#121214] border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div>
                  {/* Top table info */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs text-zinc-400 tracking-wider uppercase">
                      {table.unique_code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isAssigned
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAssigned ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      {isAssigned ? 'Preso in Carico' : 'Libero'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-950 dark:text-white mb-2">
                    {table.name}
                  </h3>

                  {/* Waiter Details or Unassigned prompt */}
                  {isAssigned && waiter ? (
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {(waiter.first_name?.[0] || 'C').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {waiter.first_name ? `${waiter.first_name} ${waiter.last_name || ''}`.trim() : 'Cameriere'}
                          </p>
                          <p className="text-[10px] text-zinc-400">Responsabile Tavolo</p>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>
                          Dalle {new Date(assignment.assigned_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 mb-4 text-center">
                      <p className="text-xs text-zinc-400 italic">Nessun cameriere assegnato</p>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  {isAssigned ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedTable(table);
                          setSelectedWaiterId(assignment.waiter_id);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
                      >
                        Riassegna
                      </button>
                      <button
                        onClick={() => handleReleaseTable(table.id)}
                        className="py-1.5 px-3 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        Libera
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedTable(table);
                        setSelectedWaiterId('');
                      }}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assegna a Cameriere</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div>
                <h3 className="font-bold text-base text-zinc-950 dark:text-white">
                  Assegna {selectedTable.name}
                </h3>
                <p className="text-xs text-zinc-500">Seleziona il cameriere che gestirà il tavolo</p>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-zinc-400 hover:text-zinc-950 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Staff Disponibile ({staff.length})
              </label>

              {staff.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">
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
                          ? 'border-[#bfff00] bg-[#bfff00]/10 text-zinc-950 dark:text-white'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {member.first_name ? `${member.first_name} ${member.last_name || ''}`.trim() : member.email}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
                          {member.role === 'waiter' ? 'Cameriere' : member.role}
                        </p>
                      </div>
                      {selectedWaiterId === member.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#bfff00] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={!selectedWaiterId || assigning}
                onClick={() => handleAssignTable(selectedTable.id, selectedWaiterId)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#bfff00] hover:bg-[#a6df00] text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all shadow-md shadow-[#bfff00]/10"
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

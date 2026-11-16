'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellRing,
  Layers,
  CheckCircle2,
  PlusCircle,
  LogOut,
  X,
  RefreshCw,
  Banknote,
  Utensils,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { hapticTap, hapticSuccess, hapticWarning, hapticWaiterCall } from '@/lib/haptics';
import { SurfaceCard, StatusBadge, EmptyState } from '@/components/ui';

interface ServiceCall {
  id: string;
  table_label: string;
  type: string;
  status: string;
  created_at: string;
  order_details?: any;
  assigned_waiter_id?: string | null;
}

interface AssignedTable {
  id: string; // assignment id
  deviceId: string;
  tableName: string;
  uniqueCode: string;
  assignedAt: string;
}

interface FreeTable {
  id: string;
  name: string;
  unique_code: string;
}

export default function WaiterDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [myTables, setMyTables] = useState<AssignedTable[]>([]);
  const [freeTables, setFreeTables] = useState<FreeTable[]>([]);
  const [activeCalls, setActiveCalls] = useState<ServiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Take Table modal & Release Confirmation modal
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [confirmReleaseTable, setConfirmReleaseTable] = useState<AssignedTable | null>(null);

  const fetchWaiterData = useCallback(async () => {
    try {
      setError(null);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch user profile
      const { data: userProfile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (profErr || !userProfile) {
        throw new Error('Profilo non trovato');
      }

      setProfile(userProfile);

      const orgId = userProfile.organization_id;

      // 1. Fetch tables assigned to this waiter
      const { data: assignments } = await supabase
        .from('table_assignments')
        .select('id, device_id, assigned_at, devices(id, name, unique_code)')
        .eq('organization_id', orgId)
        .eq('waiter_id', userProfile.id)
        .eq('status', 'active');

      const mappedMyTables: AssignedTable[] = (assignments || []).map((a: any) => ({
        id: a.id,
        deviceId: a.device_id,
        tableName: a.devices?.name || 'Tavolo',
        uniqueCode: a.devices?.unique_code || '',
        assignedAt: a.assigned_at,
      }));
      setMyTables(mappedMyTables);

      // 2. Fetch all tables and compute free tables
      const { data: allDevices } = await supabase
        .from('devices')
        .select('id, name, unique_code')
        .eq('organization_id', orgId);

      const { data: allActiveAssignments } = await supabase
        .from('table_assignments')
        .select('device_id')
        .eq('organization_id', orgId)
        .eq('status', 'active');

      const occupiedDeviceIds = new Set((allActiveAssignments || []).map((a: any) => a.device_id));
      const unassigned = (allDevices || []).filter((d: any) => !occupiedDeviceIds.has(d.id));
      setFreeTables(unassigned);

      // 3. Fetch active service calls (filtered to this waiter or unassigned)
      const myTableNames = new Set(mappedMyTables.map((t) => t.tableName.toLowerCase()));
      const resCalls = await fetch(`/api/service?organization_id=${orgId}`);
      const callsData = await resCalls.json();

      if (callsData.calls) {
        const relevantCalls = callsData.calls.filter((c: any) => {
          if (c.assigned_waiter_id === userProfile.id) return true;
          if (myTableNames.has((c.table_label || '').toLowerCase())) return true;
          return false;
        });
        setActiveCalls(relevantCalls);
      }
    } catch (err: any) {
      console.error('Waiter data error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchWaiterData();

    // Supabase Realtime subscription for service calls
    const supabase = createClient();
    const channel = supabase
      .channel('waiter-operations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_calls' }, () => {
        hapticWaiterCall();
        fetchWaiterData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_assignments' }, () => {
        fetchWaiterData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWaiterData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmReleaseTable && !actionLoading) {
        setConfirmReleaseTable(null);
      } else if (showTakeModal && !actionLoading) {
        setShowTakeModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmReleaseTable, showTakeModal, actionLoading]);

  // Handle Take Table
  const handleTakeTable = async (deviceId: string) => {
    setActionLoading(true);
    setError(null);
    hapticTap();

    try {
      const res = await fetch('/api/tables/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        hapticWarning();
        throw new Error(data.error || 'Impossibile prendere il tavolo');
      }

      hapticSuccess();
      setShowTakeModal(false);
      fetchWaiterData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Release Table (confirmed via modal)
  const handleConfirmReleaseTable = async () => {
    if (!confirmReleaseTable) return;
    setActionLoading(true);
    hapticTap();

    try {
      const res = await fetch(`/api/tables/assignments?assignmentId=${confirmReleaseTable.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nel rilascio');

      hapticSuccess();
      setConfirmReleaseTable(null);
      fetchWaiterData();
    } catch (err: any) {
      setError(err.message);
      setConfirmReleaseTable(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Resolve Service Call
  const handleResolveCall = async (callId: string) => {
    hapticTap();
    try {
      const res = await fetch('/api/service', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: callId, status: 'completed' }),
      });

      if (!res.ok) throw new Error('Errore durante la chiusura della richiesta');
      hapticSuccess();
      fetchWaiterData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] font-sans pb-12">
      {/* Waiter Mobile Top Bar */}
      <header className="sticky top-0 z-30 glass-chrome border-b border-[var(--border-subtle)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--rivo-volt)] text-[#09090B] font-bold flex items-center justify-center text-sm shadow-xs">
            {(profile?.first_name?.[0] || 'C').toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
              {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Cameriere'}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-operational)] animate-pulse" />
              <span>In Turno Operativo</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchWaiterData}
            aria-label="Ricarica dati turno"
            className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
            title="Ricarica"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Esci dal turno"
            className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-critical-text)] hover:bg-[var(--accent-critical-bg)] transition-colors"
            title="Esci dal turno"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Error notification */}
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-xs text-[var(--accent-critical-text)] flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Chiudi errore"
              className="p-1 rounded-lg hover:bg-[var(--bg-surface)]/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Button: Prendi Tavolo */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              hapticTap();
              setShowTakeModal(true);
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] text-[#09090B] font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Prendi Tavolo in Carico</span>
          </button>
        </div>

        {/* Section: Richieste Live al Tavolo */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-[var(--accent-warning-text)]" />
              <span className="tabular-nums">Chiamate &amp; Richieste ({activeCalls.length})</span>
            </h2>
            {activeCalls.length > 0 && (
              <StatusBadge tone="warning" size="sm" dot pulse>
                Attive Ora
              </StatusBadge>
            )}
          </div>

          {activeCalls.length === 0 ? (
            <SurfaceCard padding="none">
              <EmptyState
                compact
                icon={CheckCircle2}
                title="Nessuna richiesta in attesa sui tuoi tavoli."
                description="Ti avviseremo appena un cliente chiama il cameriere o chiede il conto."
              />
            </SurfaceCard>
          ) : (
            <div className="space-y-3">
              {activeCalls.map((call) => {
                const isBill = call.type.startsWith('bill');
                const isOrder = call.type === 'dish_order';

                return (
                  <SurfaceCard
                    key={call.id}
                    variant="warning"
                    padding="md"
                    className="shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono tabular-nums font-bold text-xs">
                          {call.table_label}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                          {new Date(call.created_at).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {isBill ? (
                        <StatusBadge tone="telemetry" size="sm" icon={Banknote}>
                          Conto
                        </StatusBadge>
                      ) : isOrder ? (
                        <StatusBadge tone="telemetry" size="sm" icon={Utensils}>
                          Comanda
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="warning" size="sm" icon={BellRing}>
                          Assistenza
                        </StatusBadge>
                      )}
                    </div>

                    {/* Order Details / Instructions */}
                    {call.order_details?.action_required && (
                      <p className="text-xs font-semibold text-[var(--rivo-volt-text)] mb-2">
                        • {call.order_details.action_required}
                      </p>
                    )}

                    {call.order_details?.total && (
                      <p className="text-xs text-[var(--text-secondary)] mb-3">
                        Importo:{' '}
                        <strong className="text-[var(--text-primary)] font-mono tabular-nums">
                          {call.order_details.total}
                        </strong>
                        {call.order_details.split_count > 1 &&
                          ` (diviso tra ${call.order_details.split_count} persone)`}
                      </p>
                    )}

                    {/* Action button: Risolvi */}
                    <button
                      type="button"
                      onClick={() => handleResolveCall(call.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#047857] hover:opacity-90 text-white dark:bg-[var(--accent-operational)] dark:text-[#09090B] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Segna come Servito / Risolto</span>
                    </button>
                  </SurfaceCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: I Miei Tavoli Assegnati */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]" />
              <span className="tabular-nums">I Miei Tavoli in Turno ({myTables.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center text-[var(--text-muted)]">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--rivo-volt-text)]" />
            </div>
          ) : myTables.length === 0 ? (
            <SurfaceCard className="p-6 text-center">
              <p className="text-xs text-[var(--text-secondary)]">
                Non hai ancora preso in carico nessun tavolo per questo turno.
              </p>
              <button
                type="button"
                onClick={() => setShowTakeModal(true)}
                className="mt-3 text-xs font-semibold text-[var(--rivo-volt-text)] hover:underline"
              >
                + Seleziona i tuoi tavoli ora
              </button>
            </SurfaceCard>
          ) : (
            <div className="space-y-2.5">
              {myTables.map((t) => (
                <SurfaceCard key={t.id} padding="sm" className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--rivo-volt-text)] flex items-center justify-center font-bold text-xs font-mono tabular-nums shrink-0">
                      {t.tableName.replace(/\D/g, '') || '#'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--text-primary)] truncate">{t.tableName}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
                        {t.uniqueCode}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setConfirmReleaseTable(t);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--accent-critical-bg)] text-[var(--text-secondary)] hover:text-[var(--accent-critical-text)] border border-[var(--border-subtle)] text-xs font-semibold transition-colors"
                  >
                    Libera
                  </button>
                </SurfaceCard>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Prendi Tavolo */}
      {showTakeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="take-table-modal-title"
          className="fixed inset-0 bg-[var(--bg-backdrop)] backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain"
        >
          <div className="w-full sm:max-w-md bg-[var(--bg-surface)] border-t sm:border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 id="take-table-modal-title" className="font-bold text-base text-[var(--text-primary)]">
                  Prendi Tavolo in Carico
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">Tavoli attualmente liberi in sala</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTakeModal(false)}
                aria-label="Chiudi modale tavoli liberi"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 max-h-[60vh] overflow-y-auto space-y-2">
              {freeTables.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-6">
                  Tutti i tavoli risultano già presi in carico o non ci sono tavoli configurati.
                </p>
              ) : (
                freeTables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleTakeTable(table.id)}
                    className="w-full p-3.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] flex items-center justify-between text-left transition-all active:scale-[0.98]"
                  >
                    <div>
                      <p className="font-bold text-sm text-[var(--text-primary)]">{table.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
                        {table.unique_code}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--rivo-volt-text)] flex items-center gap-1">
                      <span>Prendi</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Conferma Rilascio Tavolo */}
      {confirmReleaseTable && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="release-table-modal-title"
          className="fixed inset-0 bg-[var(--bg-backdrop)] backdrop-blur-xs z-50 flex items-center justify-center p-4 overscroll-contain"
        >
          <div className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[var(--accent-warning-text)]" />
                <h3 id="release-table-modal-title" className="font-bold text-base text-[var(--text-primary)]">
                  Rilascia {confirmReleaseTable.tableName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !actionLoading && setConfirmReleaseTable(null)}
                aria-label="Chiudi conferma rilascio"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Vuoi rilasciare questo tavolo? Non riceverai più le sue chiamate dirette.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmReleaseTable(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReleaseTable}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B91C1C] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Rilascia Tavolo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

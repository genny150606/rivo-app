'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BellRing, 
  Layers, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  LogOut, 
  UserCheck, 
  X, 
  RefreshCw, 
  CreditCard, 
  Banknote, 
  Utensils, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { hapticTap, hapticSuccess, hapticWarning, hapticWaiterCall } from '@/lib/haptics';

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

  // Take Table modal
  const [showTakeModal, setShowTakeModal] = useState(false);

  const fetchWaiterData = useCallback(async () => {
    try {
      setError(null);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

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
        // Prioritize calls for this waiter's tables or assigned explicitly to this waiter
        const relevantCalls = callsData.calls.filter((c: any) => {
          if (c.assigned_waiter_id === userProfile.id) return true;
          if (myTableNames.has((c.table_label || '').toLowerCase())) return true;
          // Also show calls from tables not taken by anyone
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

  // Handle Release Table
  const handleReleaseTable = async (assignmentId: string) => {
    hapticTap();
    if (!confirm('Vuoi rilasciare questo tavolo? Non riceverai più le sue chiamate dirette.')) {
      return;
    }

    try {
      const res = await fetch(`/api/tables/assignments?assignmentId=${assignmentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nel rilascio');

      hapticSuccess();
      fetchWaiterData();
    } catch (err: any) {
      setError(err.message);
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
    <div className="min-h-screen bg-[#09090B] text-zinc-100 font-sans pb-12">
      {/* Waiter Mobile Top Bar */}
      <header className="sticky top-0 z-30 bg-[#121214]/90 backdrop-blur-md border-b border-[#27272A] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#bfff00] text-black font-bold flex items-center justify-center text-sm shadow-sm">
            {(profile?.first_name?.[0] || 'C').toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Cameriere'}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>In Turno Operativo</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWaiterData}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Ricarica"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-rose-400 transition-colors"
            title="Esci dal turno"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Button: Prendi Tavolo */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              hapticTap();
              setShowTakeModal(true);
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#bfff00] hover:bg-[#a6df00] text-black font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#bfff00]/10"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Prendi Tavolo in Carico</span>
          </button>
        </div>

        {/* Section: Richieste Live al Tavolo */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Chiamate & Richieste ({activeCalls.length})</span>
            </h2>
            {activeCalls.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                Attive Ora
              </span>
            )}
          </div>

          {activeCalls.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#121214] border border-[#27272A] text-center">
              <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-zinc-400">Nessuna richiesta in attesa sui tuoi tavoli.</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Ti avviseremo appena un cliente chiama il cameriere o chiede il conto.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCalls.map((call) => {
                const isBill = call.type.startsWith('bill');
                const isOrder = call.type === 'dish_order';

                return (
                  <div
                    key={call.id}
                    className="p-4 rounded-2xl bg-[#18181B] border border-amber-500/40 shadow-lg relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-white font-mono font-bold text-xs">
                          {call.table_label}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {new Date(call.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {isBill ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-semibold">
                          <Banknote className="w-3 h-3" />
                          Conto
                        </span>
                      ) : isOrder ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-semibold">
                          <Utensils className="w-3 h-3" />
                          Comanda
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                          <BellRing className="w-3 h-3" />
                          Assistenza
                        </span>
                      )}
                    </div>

                    {/* Order Details / Instructions */}
                    {call.order_details?.action_required && (
                      <p className="text-xs font-semibold text-[#bfff00] mb-3">
                        • {call.order_details.action_required}
                      </p>
                    )}

                    {call.order_details?.total && (
                      <p className="text-xs text-zinc-300 mb-3">
                        Importo: <strong className="text-white">{call.order_details.total}</strong>
                        {call.order_details.split_count > 1 && ` (diviso tra ${call.order_details.split_count} persone)`}
                      </p>
                    )}

                    {/* Action button: Risolvi */}
                    <button
                      onClick={() => handleResolveCall(call.id)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Segna come Servito / Risolto</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: I Miei Tavoli Assegnati */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#bfff00]" />
              <span>I Miei Tavoli in Turno ({myTables.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#bfff00]" />
            </div>
          ) : myTables.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#121214] border border-[#27272A] text-center">
              <p className="text-xs text-zinc-400">Non hai ancora preso in carico nessun tavolo per questo turno.</p>
              <button
                onClick={() => setShowTakeModal(true)}
                className="mt-3 text-xs font-semibold text-[#bfff00] hover:underline"
              >
                + Seleziona i tuoi tavoli ora
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myTables.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-[#121214] border border-[#27272A] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 text-[#bfff00] flex items-center justify-center font-bold text-xs font-mono">
                      {t.tableName.replace(/\D/g, '') || '#'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{t.tableName}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{t.uniqueCode}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReleaseTable(t.id)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 text-xs font-medium transition-colors"
                  >
                    Libera
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Prendi Tavolo */}
      {showTakeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-[#18181B] border-t sm:border border-[#27272A] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div>
                <h3 className="font-bold text-base text-white">Prendi Tavolo in Carico</h3>
                <p className="text-xs text-zinc-400">Tavoli attualmente liberi in sala</p>
              </div>
              <button
                onClick={() => setShowTakeModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 max-h-[60vh] overflow-y-auto space-y-2">
              {freeTables.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6">
                  Tutti i tavoli risultano già presi in carico o non ci sono tavoli configurati.
                </p>
              ) : (
                freeTables.map((table) => (
                  <button
                    key={table.id}
                    disabled={actionLoading}
                    onClick={() => handleTakeTable(table.id)}
                    className="w-full p-3.5 rounded-xl bg-[#121214] hover:bg-zinc-800 border border-[#27272A] flex items-center justify-between text-left transition-all active:scale-[0.98]"
                  >
                    <div>
                      <p className="font-bold text-sm text-white">{table.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{table.unique_code}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#bfff00] flex items-center gap-1">
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
    </div>
  );
}

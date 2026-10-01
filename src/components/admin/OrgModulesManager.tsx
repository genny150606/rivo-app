'use client';

import { useState, useEffect } from 'react';
import { 
  Boxes, 
  Check, 
  AlertTriangle, 
  Loader2, 
  Layers, 
  UtensilsCrossed, 
  ShoppingBag, 
  BarChart3, 
  Users, 
  Star, 
  Gift, 
  Award, 
  Smartphone, 
  BellRing,
  RotateCw,
  SlidersHorizontal
} from 'lucide-react';

interface ModuleItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: 'core' | 'shared' | 'vertical';
  dependencies: string[];
  enabled: boolean;
  source: string;
  config: any;
}

interface OrgModulesManagerProps {
  organizationId: string;
  organizationName: string;
}

export default function OrgModulesManager({ organizationId, organizationName }: OrgModulesManagerProps) {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/organizations/${organizationId}/modules`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore recupero moduli');
      }
      setModules(data.modules || []);
    } catch (err: any) {
      console.error('Fetch modules error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [organizationId]);

  const handleToggle = async (mod: ModuleItem) => {
    const nextState = !mod.enabled;
    setUpdatingId(mod.id);
    setError(null);
    setSuccessNotice(null);

    // Optimistic update
    setModules(prev =>
      prev.map(m => (m.id === mod.id ? { ...m, enabled: nextState } : m))
    );

    try {
      const res = await fetch(`/api/admin/organizations/${organizationId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: mod.id,
          enabled: nextState,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Revert on error
        setModules(prev =>
          prev.map(m => (m.id === mod.id ? { ...m, enabled: !nextState } : m))
        );
        throw new Error(data.error || 'Errore salvataggio modulo');
      }

      setSuccessNotice(`Modulo "${mod.name}" ${nextState ? 'attivato' : 'disattivato'} con successo`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      console.error('Toggle module error:', err);
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const coreModules = modules.filter(m => m.category === 'core');
  const sharedModules = modules.filter(m => m.category === 'shared');
  const verticalModules = modules.filter(m => m.category === 'vertical');

  const getModuleIcon = (slug: string) => {
    switch (slug) {
      case 'analytics': return BarChart3;
      case 'crm': return Users;
      case 'nfc_qr': return Layers;
      case 'review_shield': return Star;
      case 'loyalty': return Award;
      case 'coupons': return Gift;
      case 'universal_hub': return Smartphone;
      case 'table_service': return Layers;
      case 'staff': return Users;
      case 'service_calls': return BellRing;
      case 'canva_menu': return UtensilsCrossed;
      case 'products': return ShoppingBag;
      case 'inventory': return Boxes;
      default: return SlidersHorizontal;
    }
  };

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#121214] p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#27272A] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#BFFF00]" />
            <h2 className="text-base font-semibold text-white">Moduli & Funzionalità Piattaforma</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Abilita o disabilita in tempo reale i moduli accessibili da <strong className="text-zinc-200">{organizationName}</strong>
          </p>
        </div>

        <button
          onClick={fetchModules}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs text-zinc-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Ricarica</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {loading && modules.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#BFFF00]" />
          <span>Caricamento moduli dell&apos;attività...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Vertical Modules (Ristorazione vs Retail/Store) */}
          {verticalModules.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Moduli Verticali di Settore (Ristorazione & Retail)
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {verticalModules.filter(m => m.enabled).length}/{verticalModules.length} attivi
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {verticalModules.map(mod => {
                  const Icon = getModuleIcon(mod.slug);
                  const isUpdating = updatingId === mod.id;
                  const isRestaurantVertical = ['table_service', 'canva_menu', 'service_calls', 'staff'].includes(mod.slug);
                  const isRetailVertical = ['products', 'inventory', 'suppliers'].includes(mod.slug);

                  return (
                    <div
                      key={mod.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        mod.enabled
                          ? 'bg-zinc-900/90 border-[#3f3f46]'
                          : 'bg-[#18181b]/40 border-[#27272a] opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            mod.enabled ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white truncate">{mod.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                isRestaurantVertical 
                                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                                  : isRetailVertical
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {isRestaurantVertical ? 'Ristoranti' : isRetailVertical ? 'Retail / Negozi' : 'Vertical'}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{mod.description}</p>
                            {mod.dependencies && mod.dependencies.length > 0 && (
                              <p className="text-[10px] text-zinc-500 mt-1">
                                Richiede: {mod.dependencies.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Toggle switch */}
                        <button
                          type="button"
                          onClick={() => handleToggle(mod)}
                          disabled={isUpdating}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            mod.enabled ? 'bg-[#BFFF00]' : 'bg-zinc-700'
                          } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                          role="switch"
                          aria-checked={mod.enabled}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                              mod.enabled ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shared Modules (Fidelity, Reviews, Coupons, CRM) */}
          {sharedModules.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Moduli Condivisi (Fidelity, Recensioni, CRM)
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {sharedModules.filter(m => m.enabled).length}/{sharedModules.length} attivi
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sharedModules.map(mod => {
                  const Icon = getModuleIcon(mod.slug);
                  const isUpdating = updatingId === mod.id;

                  return (
                    <div
                      key={mod.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        mod.enabled
                          ? 'bg-zinc-900/90 border-[#3f3f46]'
                          : 'bg-[#18181b]/40 border-[#27272a] opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            mod.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-white block truncate">{mod.name}</span>
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{mod.description}</p>
                          </div>
                        </div>

                        {/* Toggle switch */}
                        <button
                          type="button"
                          onClick={() => handleToggle(mod)}
                          disabled={isUpdating}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            mod.enabled ? 'bg-[#BFFF00]' : 'bg-zinc-700'
                          } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                          role="switch"
                          aria-checked={mod.enabled}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                              mod.enabled ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Core Modules (Analytics, NFC/QR, Hub) */}
          {coreModules.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Moduli Core di Base
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {coreModules.filter(m => m.enabled).length}/{coreModules.length} attivi
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {coreModules.map(mod => {
                  const Icon = getModuleIcon(mod.slug);
                  const isUpdating = updatingId === mod.id;

                  return (
                    <div
                      key={mod.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        mod.enabled
                          ? 'bg-zinc-900/90 border-[#3f3f46]'
                          : 'bg-[#18181b]/40 border-[#27272a] opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            mod.enabled ? 'bg-cyan-500/10 text-cyan-400' : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-white block truncate">{mod.name}</span>
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{mod.description}</p>
                          </div>
                        </div>

                        {/* Toggle switch */}
                        <button
                          type="button"
                          onClick={() => handleToggle(mod)}
                          disabled={isUpdating}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            mod.enabled ? 'bg-[#BFFF00]' : 'bg-zinc-700'
                          } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                          role="switch"
                          aria-checked={mod.enabled}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                              mod.enabled ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

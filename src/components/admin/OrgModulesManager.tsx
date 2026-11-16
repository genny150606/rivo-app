'use client';

import { useState, useEffect, useCallback } from 'react';
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
  SlidersHorizontal,
} from 'lucide-react';
import { SurfaceCard, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';

interface ModuleItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: 'core' | 'shared' | 'vertical';
  dependencies: string[];
  enabled: boolean;
  source: string;
  config: unknown;
}

interface OrgModulesManagerProps {
  organizationId: string;
  organizationName: string;
}

export default function OrgModulesManager({
  organizationId,
  organizationName,
}: OrgModulesManagerProps) {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/organizations/${organizationId}/modules`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore recupero moduli');
      }
      setModules(data.modules || []);
    } catch (err: unknown) {
      console.error('Fetch modules error:', err);
      setError(err instanceof Error ? err.message : 'Errore recupero moduli');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleToggle = async (mod: ModuleItem) => {
    const nextState = !mod.enabled;
    setUpdatingId(mod.id);
    setError(null);
    setSuccessNotice(null);

    setModules((prev) =>
      prev.map((m) => (m.id === mod.id ? { ...m, enabled: nextState } : m))
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
        setModules((prev) =>
          prev.map((m) => (m.id === mod.id ? { ...m, enabled: !nextState } : m))
        );
        throw new Error(data.error || 'Errore salvataggio modulo');
      }

      setSuccessNotice(
        `Modulo "${mod.name}" ${nextState ? 'attivato' : 'disattivato'} con successo`
      );
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      console.error('Toggle module error:', err);
      setError(err instanceof Error ? err.message : 'Errore salvataggio modulo');
    } finally {
      setUpdatingId(null);
    }
  };

  const coreModules = modules.filter((m) => m.category === 'core');
  const sharedModules = modules.filter((m) => m.category === 'shared');
  const verticalModules = modules.filter((m) => m.category === 'vertical');

  const getModuleIcon = (slug: string) => {
    switch (slug) {
      case 'analytics':
        return BarChart3;
      case 'crm':
        return Users;
      case 'nfc_qr':
        return Layers;
      case 'review_shield':
        return Star;
      case 'loyalty':
        return Award;
      case 'coupons':
        return Gift;
      case 'universal_hub':
        return Smartphone;
      case 'table_service':
        return Layers;
      case 'staff':
        return Users;
      case 'service_calls':
        return BellRing;
      case 'canva_menu':
        return UtensilsCrossed;
      case 'products':
        return ShoppingBag;
      case 'inventory':
        return Boxes;
      default:
        return SlidersHorizontal;
    }
  };

  const renderSection = (
    title: string,
    items: ModuleItem[],
    tone: 'warning' | 'operational' | 'telemetry',
    showVerticalTag = false
  ) => {
    if (items.length === 0) return null;
    const activeCount = items.filter((m) => m.enabled).length;

    const dotColor =
      tone === 'warning'
        ? 'bg-[var(--accent-warning)]'
        : tone === 'operational'
        ? 'bg-[var(--accent-operational)]'
        : 'bg-[var(--accent-telemetry)]';

    const titleColor =
      tone === 'warning'
        ? 'text-[var(--accent-warning-text)]'
        : tone === 'operational'
        ? 'text-[var(--accent-operational-text)]'
        : 'text-[var(--accent-telemetry-text)]';

    const activeIconTone =
      tone === 'warning'
        ? 'bg-[var(--accent-warning-bg)] text-[var(--accent-warning-text)] border-[var(--accent-warning-border)]'
        : tone === 'operational'
        ? 'bg-[var(--accent-operational-bg)] text-[var(--accent-operational-text)] border-[var(--accent-operational-border)]'
        : 'bg-[var(--accent-telemetry-bg)] text-[var(--accent-telemetry-text)] border-[var(--accent-telemetry-border)]';

    return (
      <div>
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className={cn('text-xs font-mono font-bold uppercase tracking-[0.08em] flex items-center gap-2', titleColor)}>
            <span className={cn('w-2 h-2 rounded-full shrink-0', dotColor)} aria-hidden="true" />
            <span>{title}</span>
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums shrink-0">
            {activeCount}/{items.length} attivi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((mod) => {
            const Icon = getModuleIcon(mod.slug);
            const isUpdating = updatingId === mod.id;
            const isRestaurantVertical = [
              'table_service',
              'canva_menu',
              'service_calls',
              'staff',
            ].includes(mod.slug);
            const isRetailVertical = ['products', 'inventory', 'suppliers'].includes(mod.slug);

            return (
              <div
                key={mod.id}
                className={cn(
                  'p-4 rounded-xl border transition-[background-color,border-color,opacity] duration-[180ms]',
                  mod.enabled
                    ? 'bg-[var(--bg-elevated)] border-[var(--border-strong)]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-75'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg border flex items-center justify-center shrink-0',
                        mod.enabled
                          ? activeIconTone
                          : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                      )}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {mod.name}
                        </span>
                        {showVerticalTag && (
                          <StatusBadge
                            tone={
                              isRestaurantVertical
                                ? 'warning'
                                : isRetailVertical
                                ? 'telemetry'
                                : 'neutral'
                            }
                            shape="tag"
                          >
                            {isRestaurantVertical
                              ? 'Ristoranti'
                              : isRetailVertical
                              ? 'Retail / Negozi'
                              : 'Vertical'}
                          </StatusBadge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {mod.description}
                      </p>
                      {mod.dependencies && mod.dependencies.length > 0 && (
                        <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1.5">
                          Richiede: {mod.dependencies.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(mod)}
                    disabled={isUpdating}
                    role="switch"
                    aria-checked={mod.enabled}
                    aria-label={`${mod.enabled ? 'Disattiva' : 'Attiva'} modulo ${mod.name}`}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--rivo-volt)]',
                      mod.enabled ? 'bg-[var(--rivo-volt)]' : 'bg-[var(--bg-subtle)] border-[var(--border-strong)]',
                      isUpdating && 'opacity-50 cursor-wait'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-xs transition-transform duration-200',
                        mod.enabled
                          ? 'translate-x-5 bg-[#09090B]'
                          : 'translate-x-0 bg-[var(--text-secondary)]'
                      )}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <SurfaceCard
      header={{
        eyebrow: 'MULTI-VERTICAL ENGINE',
        title: 'Moduli & Funzionalità Piattaforma',
        subtitle: `Abilita o disabilita in tempo reale i moduli accessibili da ${organizationName}`,
        icon: Boxes,
        action: (
          <button
            type="button"
            onClick={fetchModules}
            disabled={loading}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] px-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCw
              className={cn('w-3.5 h-3.5', loading && 'animate-spin')}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Ricarica</span>
          </button>
        ),
      }}
    >
      <div className="space-y-6">
        {error && (
          <div
            role="alert"
            className="p-3 bg-[var(--accent-critical-bg)] border border-[var(--accent-critical-border)] text-[var(--accent-critical-text)] text-xs rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div
            aria-live="polite"
            className="p-3 bg-[var(--accent-operational-bg)] border border-[var(--accent-operational-border)] text-[var(--accent-operational-text)] text-xs rounded-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{successNotice}</span>
          </div>
        )}

        {loading && modules.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-[var(--text-muted)] text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--rivo-volt)]" aria-hidden="true" />
            <span>Caricamento moduli dell&apos;attività…</span>
          </div>
        ) : (
          <div className="space-y-6">
            {renderSection(
              'Moduli Verticali di Settore (Ristorazione & Retail)',
              verticalModules,
              'warning',
              true
            )}
            {renderSection(
              'Moduli Condivisi (Fidelity, Recensioni, CRM)',
              sharedModules,
              'operational'
            )}
            {renderSection(
              'Moduli Core di Base',
              coreModules,
              'telemetry'
            )}
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

import { createClient } from '@/lib/supabase/server';
import { Building2, Layers, Activity, PlusCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { PageHeader, KpiCard, SurfaceCard, StatusBadge, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Aggregate statistics across RIVO network
  const [
    { count: totalOrgs },
    { count: totalDevices },
    { count: totalInteractions },
    { data: recentOrgs },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('devices').select('*', { count: 'exact', head: true }),
    supabase.from('interactions').select('*', { count: 'exact', head: true }),
    supabase
      .from('organizations')
      .select('id, name, slug, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const orgCount = totalOrgs ?? 0;
  const deviceCount = totalDevices ?? 0;
  const interactionCount = totalInteractions ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      <PageHeader
        eyebrow="01 // COMMAND CENTER"
        title="RIVO Command Center"
        description="Monitoraggio globale delle attività clienti, dispositivi hardware e traffico NFC/QR."
        actions={
          <Link
            href="/admin/organizations/new"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-4 py-2 text-sm font-bold text-[var(--rivo-volt-ink)] transition-[background-color,transform] duration-[180ms] active:scale-[0.98] shrink-0"
          >
            <PlusCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>Nuova Organizzazione</span>
          </Link>
        }
      />

      {/* Global Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Aziende Clienti"
          value={orgCount.toLocaleString('it-IT')}
          icon={Building2}
          tone="volt"
          context="Registrate nella piattaforma"
          href="/admin/organizations"
        />
        <KpiCard
          label="Dispositivi Distribuiti"
          value={deviceCount.toLocaleString('it-IT')}
          icon={Layers}
          tone="operational"
          context="NFC / QR attivi e tracciati"
          href="/admin/devices"
        />
        <KpiCard
          label="Traffico Complessivo"
          value={interactionCount.toLocaleString('it-IT')}
          icon={Activity}
          tone="telemetry"
          context="Interazioni reali registrate"
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      {/* Recent Organizations */}
      <SurfaceCard
        padding="none"
        header={{
          eyebrow: 'RECENT TENANTS',
          title: 'Ultime Aziende Attivate',
          icon: Building2,
          action: (
            <Link
              href="/admin/organizations"
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] px-3 text-xs font-semibold text-[var(--rivo-volt-text)] transition-colors"
            >
              <span>Tutte</span>
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          ),
        }}
      >
        {!recentOrgs || recentOrgs.length === 0 ? (
          <div className="p-5">
            <EmptyState
              compact
              icon={Building2}
              eyebrow="NETWORK REGISTRY"
              title="Nessuna azienda creata"
              description='Inizia creando la prima organizzazione (es. "Bar Centrale").'
              primaryAction={{
                label: 'Nuova Organizzazione',
                href: '/admin/organizations/new',
                icon: PlusCircle,
              }}
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {recentOrgs.map((org) => (
              <Link
                key={org.id}
                href={`/admin/organizations/${org.id}`}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm hover:bg-[var(--bg-elevated)]/60 transition-colors min-h-[56px]"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] truncate">
                    {org.name}
                  </div>
                  <div className="font-mono text-xs text-[var(--text-muted)] truncate">
                    slug: {org.slug}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge
                    tone={org.status === 'active' ? 'operational' : 'neutral'}
                    dot
                  >
                    {org.status}
                  </StatusBadge>
                  <span className="font-mono tabular-nums text-xs text-[var(--text-muted)]">
                    {new Date(org.created_at).toLocaleDateString('it-IT')}
                  </span>
                  <ChevronRight
                    className="w-4 h-4 text-[var(--text-muted)]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}

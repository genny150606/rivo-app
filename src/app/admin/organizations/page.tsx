import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, ChevronRight, Building2 } from 'lucide-react';
import { PageHeader, SurfaceCard, StatusBadge, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

interface OrgItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  plans?: { name: string } | null;
  locations?: { count: number }[];
  devices?: { count: number }[];
}

export default async function AdminOrganizationsPage() {
  const supabase = await createClient();

  const { data: orgs } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      status,
      created_at,
      plans ( name ),
      locations ( count ),
      devices ( count )
    `)
    .order('created_at', { ascending: false });

  const list: OrgItem[] = (orgs || []) as unknown as OrgItem[];

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="02 // CLIENT PORTFOLIO"
        title="Organizzazioni"
        description="Tutte le aziende commerciali clienti registrate nell'ecosistema RIVO."
        badge={
          <StatusBadge tone="volt" variant="soft" className="tabular-nums">
            {list.length} attività
          </StatusBadge>
        }
        actions={
          <Link
            href="/admin/organizations/new"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-4 py-2 text-sm font-bold text-[var(--rivo-volt-ink)] transition-[background-color,transform] duration-[180ms] active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>Nuova Organizzazione</span>
          </Link>
        }
      />

      <SurfaceCard padding="none" className="overflow-hidden">
        {list.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Building2}
              eyebrow="TENANT DIRECTORY"
              title="Nessuna organizzazione presente"
              description='Clicca su "+ Nuova Organizzazione" per configurare la prima attività.'
              primaryAction={{
                label: 'Nuova Organizzazione',
                href: '/admin/organizations/new',
                icon: Plus,
              }}
            />
          </div>
        ) : (
          <>
            {/* Desktop / Large Viewport Table with horizontal scroll containment */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm text-[var(--text-secondary)] min-w-[680px]">
                <thead className="bg-[var(--bg-elevated)] font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="px-6 py-3 font-medium">Nome Azienda</th>
                    <th className="px-6 py-3 font-medium">Slug</th>
                    <th className="px-6 py-3 font-medium">Piano</th>
                    <th className="px-6 py-3 font-medium text-right">Sedi</th>
                    <th className="px-6 py-3 font-medium text-right">Dispositivi</th>
                    <th className="px-6 py-3 font-medium">Stato</th>
                    <th className="px-6 py-3 font-medium text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {list.map((org) => (
                    <tr
                      key={org.id}
                      className="hover:bg-[var(--bg-elevated)]/60 transition-colors min-h-[52px]"
                    >
                      <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">
                        <Link
                          href={`/admin/organizations/${org.id}`}
                          className="hover:text-[var(--rivo-volt-text)] transition-colors"
                        >
                          {org.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-[var(--text-muted)]">
                        {org.slug}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-primary)]">
                        {org.plans?.name || 'Free'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono tabular-nums text-[var(--text-primary)]">
                        {org.locations?.[0]?.count ?? 1}
                      </td>
                      <td className="px-6 py-4 text-right font-mono tabular-nums text-[var(--text-primary)]">
                        {org.devices?.[0]?.count ?? 1}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          tone={org.status === 'active' ? 'operational' : 'neutral'}
                          dot
                        >
                          {org.status}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/organizations/${org.id}`}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <span>Dettagli</span>
                          <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< lg) */}
            <div className="lg:hidden divide-y divide-[var(--border-subtle)]">
              {list.map((org) => (
                <div key={org.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-semibold text-[var(--text-primary)] text-base leading-snug truncate">
                      {org.name}
                    </span>
                    <StatusBadge
                      tone={org.status === 'active' ? 'operational' : 'neutral'}
                      dot
                    >
                      {org.status}
                    </StatusBadge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">
                        Slug
                      </span>
                      <span className="font-mono text-[var(--text-secondary)] truncate block">
                        {org.slug}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">
                        Piano
                      </span>
                      <span className="text-[var(--text-primary)] font-medium">
                        {org.plans?.name || 'Free'}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">
                        Sedi Fisiche
                      </span>
                      <span className="font-mono tabular-nums text-[var(--text-primary)] font-semibold">
                        {org.locations?.[0]?.count ?? 1}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">
                        Chip/QR
                      </span>
                      <span className="font-mono tabular-nums text-[var(--text-primary)] font-semibold">
                        {org.devices?.[0]?.count ?? 1}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-semibold flex items-center justify-between transition-colors"
                    >
                      <span>Gestisci Sedi &amp; Dispositivi</span>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SurfaceCard>
    </div>
  );
}

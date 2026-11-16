import { createClient } from '@/lib/supabase/server';
import { ExternalLink, Layers } from 'lucide-react';
import CopyTrackingButtons from '@/components/ui/CopyTrackingButtons';
import { PageHeader, SurfaceCard, StatusBadge, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

interface DeviceDetail {
  id: string;
  name: string;
  type: string;
  unique_code: string;
  destination_url: string;
  status: string;
  created_at: string;
  organizations?: { name: string; slug: string } | null;
  locations?: { name: string } | null;
}

export default async function AdminDevicesPage() {
  const supabase = await createClient();

  const { data: devices } = await supabase
    .from('devices')
    .select(`
      id,
      name,
      type,
      unique_code,
      destination_url,
      status,
      created_at,
      organizations ( name, slug ),
      locations ( name )
    `)
    .order('created_at', { ascending: false });

  const list: DeviceDetail[] = (devices || []) as unknown as DeviceDetail[];

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="04 // HARDWARE FLEET"
        title="Tutti i Dispositivi RIVO"
        description="Panoramica centralizzata di tutti i chip NFC e codici QR con copia rapida del link di tracciamento."
        badge={
          <StatusBadge variant="hardware" dot className="tabular-nums">
            {list.length} nodi
          </StatusBadge>
        }
      />

      <SurfaceCard padding="none" className="overflow-hidden">
        {list.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Layers}
              eyebrow="HARDWARE REGISTRY"
              title="Nessun dispositivo registrato"
              description="Nessun dispositivo registrato nel sistema."
            />
          </div>
        ) : (
          <>
            {/* Desktop / Large Viewport Table with horizontal scroll containment */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm text-[var(--text-secondary)] min-w-[700px]">
                <thead className="bg-[var(--bg-elevated)] font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="px-6 py-3 font-medium">Nome</th>
                    <th className="px-6 py-3 font-medium">Attività Commerciale</th>
                    <th className="px-6 py-3 font-medium">Sede</th>
                    <th className="px-6 py-3 font-medium">Codice Hardware</th>
                    <th className="px-6 py-3 font-medium">Copia Link</th>
                    <th className="px-6 py-3 font-medium">Stato</th>
                    <th className="px-6 py-3 font-medium text-right">Redirect Test</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {list.map((device) => (
                    <tr
                      key={device.id}
                      className="hover:bg-[var(--bg-elevated)]/60 transition-colors min-h-[52px]"
                    >
                      <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">
                        {device.name}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-primary)]">
                        {device.organizations?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">
                        {device.locations?.name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge variant="hardware" shape="tag">
                          {device.unique_code}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4">
                        <CopyTrackingButtons uniqueCode={device.unique_code} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          tone={device.status === 'active' ? 'operational' : 'neutral'}
                          dot
                        >
                          {device.status}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/t/${device.unique_code}?source=admin-test`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <span>Verifica</span>
                          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< lg) */}
            <div className="lg:hidden divide-y divide-[var(--border-subtle)]">
              {list.map((device) => (
                <div key={device.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-display font-semibold text-[var(--text-primary)] text-base block truncate">
                        {device.name}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] block truncate">
                        {device.organizations?.name || '—'} · {device.locations?.name || '—'}
                      </span>
                    </div>
                    <StatusBadge
                      tone={device.status === 'active' ? 'operational' : 'neutral'}
                      dot
                    >
                      {device.status}
                    </StatusBadge>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <StatusBadge variant="hardware" shape="tag">
                      {device.unique_code}
                    </StatusBadge>
                    <a
                      href={`/t/${device.unique_code}?source=admin-test`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[44px] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg items-center gap-1.5 transition-colors shrink-0"
                    >
                      <span>Verifica link</span>
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                    </a>
                  </div>

                  <div className="pt-1">
                    <CopyTrackingButtons uniqueCode={device.unique_code} />
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

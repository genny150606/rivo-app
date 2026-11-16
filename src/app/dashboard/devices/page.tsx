import { createClient } from '@/lib/supabase/server';
import { Cpu, ExternalLink, Radio } from 'lucide-react';
import { EmptyState, PageHeader, StatusBadge, SurfaceCard } from '@/components/ui';
import CopyTrackingButtons from '@/components/ui/CopyTrackingButtons';

export const dynamic = 'force-dynamic';

interface DeviceItem {
  id: string;
  name: string;
  type: string;
  unique_code: string;
  destination_url: string;
  status: string;
  created_at: string;
  locations?: { name: string } | null;
}

export default async function DevicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let devices: DeviceItem[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profile?.organization_id) {
      const { data } = await supabase
        .from('devices')
        .select(`
          id,
          name,
          type,
          unique_code,
          destination_url,
          status,
          created_at,
          locations ( name )
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (data) devices = data as unknown as DeviceItem[];
    }
  }

  const activeCount = devices.filter((d) => d.status === 'active').length;

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="Hardware & Touchpoint"
        title="Dispositivi"
        description="Tutti i chip NFC e codici QR configurati per le tue sedi fisiche."
        badge={
          devices.length > 0 ? (
            <StatusBadge
              tone={activeCount > 0 ? 'operational' : 'neutral'}
              dot
              pulse={activeCount > 0}
              mono
            >
              {activeCount}/{devices.length} Attivi
            </StatusBadge>
          ) : undefined
        }
      />

      {devices.length === 0 ? (
        <EmptyState
          icon={Cpu}
          eyebrow="Infrastruttura Fisica"
          title="Nessun dispositivo associato"
          description="Nessun dispositivo associato. Contatta il supporto RIVO o l'amministratore per aggiungere nuovi punti fisici."
        />
      ) : (
        <SurfaceCard
          padding="none"
          radius="xl"
          header={{
            eyebrow: 'Registro Nodi',
            title: 'Chip NFC & Codici QR Configurati',
            subtitle: `${devices.length} dispositivi registrati`,
            icon: Radio,
          }}
        >
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-elevated)] font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Nome Dispositivo</th>
                  <th className="px-6 py-3.5 font-medium">Sede</th>
                  <th className="px-6 py-3.5 font-medium">Codice Univoco</th>
                  <th className="px-6 py-3.5 font-medium">Copia Link</th>
                  <th className="px-6 py-3.5 font-medium">Destinazione</th>
                  <th className="px-6 py-3.5 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {devices.map((device) => (
                  <tr
                    key={device.id}
                    className="min-h-[48px] hover:bg-[var(--bg-elevated)]/60 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">
                      {device.name}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {device.locations?.name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge variant="hardware" shape="tag" size="md" mono>
                        <span translate="no">{device.unique_code}</span>
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4">
                      <CopyTrackingButtons uniqueCode={device.unique_code} />
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <a
                        href={device.destination_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] truncate max-w-full transition-colors"
                      >
                        <span className="truncate">{device.destination_url}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        tone={device.status === 'active' ? 'operational' : 'neutral'}
                        dot
                        mono
                      >
                        {device.status === 'active' ? 'Attivo' : 'Disattivato'}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-[var(--border-subtle)]">
            {devices.map((device) => (
              <div key={device.id} className="p-4 space-y-3 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-semibold text-[var(--text-primary)] text-base truncate min-w-0">
                    {device.name}
                  </span>
                  <StatusBadge
                    tone={device.status === 'active' ? 'operational' : 'neutral'}
                    dot
                    mono
                  >
                    {device.status === 'active' ? 'Attivo' : 'Off'}
                  </StatusBadge>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="font-mono uppercase tracking-wider font-medium">
                    {device.type}
                  </span>
                  <span className="text-[var(--text-muted)]" aria-hidden="true">
                    •
                  </span>
                  <span className="truncate">{device.locations?.name || '—'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge variant="hardware" shape="tag" size="md" mono>
                    <span translate="no">{device.unique_code}</span>
                  </StatusBadge>
                </div>

                <div className="pt-1">
                  <CopyTrackingButtons uniqueCode={device.unique_code} />
                </div>

                {device.destination_url && (
                  <div className="pt-1">
                    <a
                      href={device.destination_url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[44px] px-3 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <span className="truncate min-w-0">
                        Destinazione: {device.destination_url}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}

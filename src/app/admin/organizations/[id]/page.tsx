import { createClient } from '@/lib/supabase/server';
import {
  ExternalLink,
  Smartphone,
  CreditCard,
  MapPin,
  Layers,
  Activity,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import AddDeviceModal from '@/components/admin/AddDeviceModal';
import CopyTrackingButtons from '@/components/ui/CopyTrackingButtons';
import OrgModulesManager from '@/components/admin/OrgModulesManager';
import OrgUsersPasswordManager from '@/components/admin/OrgUsersPasswordManager';
import {
  PageHeader,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  EmptyState,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

interface LocationItem {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
}

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

export default async function AdminOrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: org },
    { data: locations },
    { data: devices },
    { data: interactions },
  ] = await Promise.all([
    supabase.from('organizations').select('*, plans(name)').eq('id', id).single(),
    supabase.from('locations').select('*').eq('organization_id', id),
    supabase
      .from('devices')
      .select('*, locations(name)')
      .eq('organization_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('interactions')
      .select('id, interaction_type, timestamp, devices(name)')
      .eq('organization_id', id)
      .order('timestamp', { ascending: false })
      .limit(10),
  ]);

  if (!org) {
    notFound();
  }

  const locList = (locations || []) as LocationItem[];
  const devList = (devices || []) as unknown as DeviceItem[];
  const totalTaps = (interactions || []).length;
  const sampleDevice = devList.find((d) => d.status === 'active') || devList[0];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl min-w-0">
      <PageHeader
        backHref="/admin/organizations"
        backLabel="Torna a tutte le organizzazioni"
        eyebrow="03 // TENANT INSPECTOR"
        title={org.name}
        badge={
          <StatusBadge
            tone={org.status === 'active' ? 'operational' : 'neutral'}
            dot
          >
            {org.status}
          </StatusBadge>
        }
        meta={
          <p className="font-mono text-xs text-[var(--text-muted)] break-all">
            slug: {org.slug} · id: {org.id}
          </p>
        }
        actions={
          sampleDevice ? (
            <a
              href={`/hub/${sampleDevice.unique_code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--rivo-volt-border)] bg-[var(--rivo-volt-bg)] px-3.5 py-2 text-xs font-semibold text-[var(--rivo-volt-text)] hover:border-[var(--rivo-volt)] transition-colors"
            >
              <Smartphone className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>Visualizza Custom Hub</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            </a>
          ) : undefined
        }
      />

      {/* Info Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <KpiCard
          label="Piano Attivo"
          value={org.plans?.name || 'Starter'}
          icon={CreditCard}
          tone="volt"
        />
        <KpiCard
          label="Sedi Fisiche"
          value={locList.length.toLocaleString('it-IT')}
          icon={MapPin}
          tone="neutral"
        />
        <KpiCard
          label="Dispositivi Hardware"
          value={devList.length.toLocaleString('it-IT')}
          icon={Layers}
          tone="operational"
        />
        <KpiCard
          label="Interazioni Recenti"
          value={totalTaps.toLocaleString('it-IT')}
          icon={Activity}
          tone="telemetry"
        />
      </div>

      {/* Devices list for this Org */}
      <SurfaceCard
        padding="none"
        header={{
          eyebrow: 'HARDWARE REGISTRY',
          title: 'Dispositivi NFC & QR Configurati',
          subtitle: 'Copia con un clic il link esatto da inserire nei chip fisici',
          icon: Layers,
          action: <AddDeviceModal organizationId={org.id} locations={locList} />,
        }}
      >
        {devList.length === 0 ? (
          <div className="p-5">
            <EmptyState
              compact
              icon={Layers}
              title="Nessun dispositivo assegnato"
              description="Nessun dispositivo assegnato a questa attività. Aggiungi il primo tag NFC o codice QR."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {devList.map((dev) => (
              <div
                key={dev.id}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-3 hover:bg-[var(--bg-elevated)]/40 transition-colors"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-[var(--text-primary)] block truncate">
                    {dev.name}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    Sede: {dev.locations?.name || 'Principale'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <StatusBadge variant="hardware" shape="tag">
                    {dev.unique_code}
                  </StatusBadge>
                  <CopyTrackingButtons uniqueCode={dev.unique_code} />
                  <a
                    href={`/t/${dev.unique_code}?source=test`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <span>Test</span>
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      {/* Account & Password degli utenti dell'attività */}
      <OrgUsersPasswordManager organizationId={org.id} />

      {/* Moduli & Funzionalità Piattaforma (Multi-Vertical Engine) */}
      <OrgModulesManager organizationId={org.id} organizationName={org.name} />
    </div>
  );
}

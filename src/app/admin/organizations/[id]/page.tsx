import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Smartphone } from 'lucide-react';
import { notFound } from 'next/navigation';
import AddDeviceModal from '@/components/admin/AddDeviceModal';
import CopyTrackingButtons from '@/components/ui/CopyTrackingButtons';
import OrgModulesManager from '@/components/admin/OrgModulesManager';
import OrgUsersPasswordManager from '@/components/admin/OrgUsersPasswordManager';

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
    { data: interactions }
  ] = await Promise.all([
    supabase.from('organizations').select('*, plans(name)').eq('id', id).single(),
    supabase.from('locations').select('*').eq('organization_id', id),
    supabase.from('devices').select('*, locations(name)').eq('organization_id', id).order('created_at', { ascending: false }),
    supabase.from('interactions').select('id, interaction_type, timestamp, devices(name)').eq('organization_id', id).order('timestamp', { ascending: false }).limit(10)
  ]);

  if (!org) {
    notFound();
  }

  const locList = (locations || []) as LocationItem[];
  const devList = (devices || []) as unknown as DeviceItem[];
  const totalTaps = (interactions || []).length;
  const sampleDevice = devList.find(d => d.status === 'active') || devList[0];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl">
      <div>
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-3 min-h-[44px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Torna a tutte le organizzazioni
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">{org.name}</h1>
            <p className="text-xs text-zinc-500 font-mono break-all">slug: {org.slug} • id: {org.id}</p>
          </div>
          <div className="flex items-center gap-2.5">
            {sampleDevice && (
              <a
                href={`/hub/${sampleDevice.unique_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#BFFF00] border border-[#BFFF00]/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Visualizza Custom Hub</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            )}
            <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase self-start sm:self-auto">
              {org.status}
            </span>
          </div>
        </div>
      </div>

      {/* Info Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase text-zinc-400 block mb-1">Piano Attivo</span>
          <span className="text-lg sm:text-xl font-bold text-white">{org.plans?.name || 'Starter'}</span>
        </div>
        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase text-zinc-400 block mb-1">Sedi Fisiche</span>
          <span className="text-lg sm:text-xl font-bold text-white">{locList.length}</span>
        </div>
        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase text-zinc-400 block mb-1">Dispositivi Hardware</span>
          <span className="text-lg sm:text-xl font-bold text-white">{devList.length}</span>
        </div>
        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase text-zinc-400 block mb-1">Interazioni Recenti</span>
          <span className="text-lg sm:text-xl font-bold text-white">{totalTaps}</span>
        </div>
      </div>

      {/* Devices list for this Org */}
      <div className="rounded-xl border border-[#27272A] bg-[#121214] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Dispositivi NFC & QR Configurati</h2>
            <p className="text-xs text-zinc-500">Copia con un clic il link esatto da inserire nei chip fisici</p>
          </div>
          <AddDeviceModal organizationId={org.id} locations={locList} />
        </div>

        {devList.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center sm:text-left">Nessun dispositivo assegnato a questa attività.</p>
        ) : (
          <div className="divide-y divide-[#27272A]">
            {devList.map((dev) => (
              <div key={dev.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-3">
                <div>
                  <span className="font-semibold text-white block">{dev.name}</span>
                  <span className="text-xs text-zinc-500">Sede: {dev.locations?.name || 'Principale'}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <span className="font-mono text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                    {dev.unique_code}
                  </span>
                  {/* One-click copy buttons */}
                  <CopyTrackingButtons uniqueCode={dev.unique_code} />
                  <a
                    href={`/t/${dev.unique_code}?source=test`}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[44px] px-3 py-2 text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors touch-press bg-zinc-800/60 rounded-lg sm:bg-transparent"
                  >
                    <span>Test</span> <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Account & Password degli utenti dell'attività */}
      <OrgUsersPasswordManager organizationId={org.id} />

      {/* Moduli & Funzionalità Piattaforma (Multi-Vertical Engine) */}
      <OrgModulesManager organizationId={org.id} organizationName={org.name} />
    </div>
  );
}

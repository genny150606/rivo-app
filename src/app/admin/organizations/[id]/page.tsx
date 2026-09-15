import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, Layers, ExternalLink, Activity, QrCode } from 'lucide-react';
import { notFound } from 'next/navigation';
import AddDeviceModal from '@/components/admin/AddDeviceModal';

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

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Torna a tutte le organizzazioni
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">{org.name}</h1>
            <p className="text-xs text-zinc-500 font-mono">slug: {org.slug} • id: {org.id}</p>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
            {org.status}
          </span>
        </div>
      </div>

      {/* Info Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase text-zinc-400 block mb-1">Piano Attivo</span>
          <span className="text-xl font-bold text-white">{org.plans?.name || 'Starter'}</span>
        </div>
        <div className="p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase text-zinc-400 block mb-1">Sedi Fisiche</span>
          <span className="text-xl font-bold text-white">{locList.length}</span>
        </div>
        <div className="p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase text-zinc-400 block mb-1">Dispositivi Hardware</span>
          <span className="text-xl font-bold text-white">{devList.length}</span>
        </div>
        <div className="p-5 rounded-xl bg-[#121214] border border-[#27272A]">
          <span className="text-xs font-medium uppercase text-zinc-400 block mb-1">Interazioni Recenti</span>
          <span className="text-xl font-bold text-white">{totalTaps}</span>
        </div>
      </div>

      {/* Devices list for this Org */}
      <div className="rounded-xl border border-[#27272A] bg-[#121214] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Dispositivi NFC & QR Configurati</h2>
            <p className="text-xs text-zinc-500">Punti di contatto fisici associati alle sedi di questa attività</p>
          </div>
          <AddDeviceModal organizationId={org.id} locations={locList} />
        </div>

        {devList.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4">Nessun dispositivo assegnato a questa attività.</p>
        ) : (
          <div className="divide-y divide-[#27272A]">
            {devList.map((dev) => (
              <div key={dev.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-white block">{dev.name}</span>
                  <span className="text-xs text-zinc-500">Sede: {dev.locations?.name || 'Principale'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs bg-zinc-800 text-[#BFFF00] px-2 py-1 rounded">
                    {dev.unique_code}
                  </span>
                  <a
                    href={`/t/${dev.unique_code}?source=test`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Test Link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

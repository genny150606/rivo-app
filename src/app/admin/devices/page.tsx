import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ExternalLink, Layers, Building2, MapPin } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Tutti i Dispositivi RIVO</h1>
        <p className="text-sm text-zinc-400">
          Panoramica centralizzata di tutti i chip NFC e codici QR attivi nella rete commerciale.
        </p>
      </div>

      <div className="rounded-xl border border-[#27272A] bg-[#121214] overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Nessun dispositivo registrato nel sistema.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-[#18181B] text-xs uppercase text-zinc-400 border-b border-[#27272A]">
              <tr>
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Attività Commerciale</th>
                <th className="px-6 py-3 font-medium">Sede</th>
                <th className="px-6 py-3 font-medium">Codice Hardware</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Stato</th>
                <th className="px-6 py-3 font-medium text-right">Redirect Test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]">
              {list.map((device) => (
                <tr key={device.id} className="hover:bg-[#18181B]/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">{device.name}</td>
                  <td className="px-6 py-4 text-zinc-300">{device.organizations?.name || '—'}</td>
                  <td className="px-6 py-4 text-zinc-400">{device.locations?.name || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-zinc-800 text-[#BFFF00] px-2 py-1 rounded">
                      {device.unique_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 uppercase text-xs">{device.type}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`/t/${device.unique_code}?source=admin-test`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Verifica <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

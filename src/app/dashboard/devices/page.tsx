import { createClient } from '@/lib/supabase/server';
import { ExternalLink } from 'lucide-react';
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
  const { data: { user } } = await supabase.auth.getUser();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Dispositivi</h1>
          <p className="text-sm text-zinc-400">
            Tutti i chip NFC e codici QR configurati per le tue sedi fisiche.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#27272A] bg-[#121214] overflow-hidden">
        {devices.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-sm text-zinc-500">
            Nessun dispositivo associato. Contatta il supporto RIVO o l&apos;amministratore per aggiungere nuovi punti fisici.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <table className="hidden lg:table w-full text-left text-sm text-zinc-300">
              <thead className="bg-[#18181B] text-xs uppercase text-zinc-400 border-b border-[#27272A]">
                <tr>
                  <th className="px-6 py-3 font-medium">Nome Dispositivo</th>
                  <th className="px-6 py-3 font-medium">Sede</th>
                  <th className="px-6 py-3 font-medium">Codice Univoco</th>
                  <th className="px-6 py-3 font-medium">Copia Link</th>
                  <th className="px-6 py-3 font-medium">Destinazione</th>
                  <th className="px-6 py-3 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]">
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-[#18181B]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{device.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{device.locations?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-zinc-800 text-zinc-200 px-2.5 py-1 rounded">
                        {device.unique_code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <CopyTrackingButtons uniqueCode={device.unique_code} />
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={device.destination_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white truncate max-w-xs transition-colors"
                      >
                        <span className="truncate">{device.destination_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          device.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {device.status === 'active' ? 'Attivo' : 'Disattivato'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-[#27272A]">
              {devices.map((device) => (
                <div key={device.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white text-base">{device.name}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        device.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {device.status === 'active' ? 'Attivo' : 'Off'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="uppercase tracking-wider font-medium">{device.type}</span>
                    <span className="text-zinc-600">•</span>
                    <span>{device.locations?.name || '—'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-zinc-800 text-zinc-200 px-2.5 py-1 rounded">
                      {device.unique_code}
                    </span>
                  </div>

                  {/* Copy buttons for mobile */}
                  <div className="pt-1">
                    <CopyTrackingButtons uniqueCode={device.unique_code} />
                  </div>

                  {device.destination_url && (
                    <div className="pt-1">
                      <a
                        href={device.destination_url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[44px] px-3 py-2 -mx-1 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 flex items-center justify-between text-xs text-zinc-400 hover:text-white transition-colors touch-press"
                      >
                        <span className="truncate mr-2">Destinazione: {device.destination_url}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

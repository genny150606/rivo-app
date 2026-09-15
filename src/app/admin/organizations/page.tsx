import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Building2, MapPin, Layers } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Organizzazioni</h1>
          <p className="text-sm text-zinc-400">
            Tutte le aziende commerciali clienti registrate nell'ecosistema RIVO.
          </p>
        </div>
        <Link
          href="/admin/organizations/new"
          className="bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Nuova Organizzazione
        </Link>
      </div>

      <div className="rounded-xl border border-[#27272A] bg-[#121214] overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Nessuna organizzazione presente. Clicca su "+ Nuova Organizzazione" per configurare la prima attività.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-[#18181B] text-xs uppercase text-zinc-400 border-b border-[#27272A]">
              <tr>
                <th className="px-6 py-3 font-medium">Nome Azienda</th>
                <th className="px-6 py-3 font-medium">Slug</th>
                <th className="px-6 py-3 font-medium">Piano</th>
                <th className="px-6 py-3 font-medium">Sedi</th>
                <th className="px-6 py-3 font-medium">Dispositivi</th>
                <th className="px-6 py-3 font-medium">Stato</th>
                <th className="px-6 py-3 font-medium">Data Creazione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]">
              {list.map((org) => (
                <tr key={org.id} className="hover:bg-[#18181B]/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">{org.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-400">{org.slug}</td>
                  <td className="px-6 py-4">{org.plans?.name || 'Free'}</td>
                  <td className="px-6 py-4">{org.locations?.[0]?.count ?? 1}</td>
                  <td className="px-6 py-4">{org.devices?.[0]?.count ?? 1}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                      {org.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500">
                    {new Date(org.created_at).toLocaleDateString('it-IT')}
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

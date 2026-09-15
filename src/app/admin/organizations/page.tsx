import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, ChevronRight, Building2, Layers, MapPin } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Organizzazioni</h1>
          <p className="text-sm text-zinc-400">
            Tutte le aziende commerciali clienti registrate nell&apos;ecosistema RIVO.
          </p>
        </div>
        <Link
          href="/admin/organizations/new"
          className="bg-[#BFFF00] hover:bg-[#a8e000] text-black font-semibold text-sm min-h-[44px] px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-press shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuova Organizzazione</span>
        </Link>
      </div>

      <div className="rounded-xl border border-[#27272A] bg-[#121214] overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Nessuna organizzazione presente. Clicca su &quot;+ Nuova Organizzazione&quot; per configurare la prima attività.
          </div>
        ) : (
          <>
            {/* Desktop / Large Viewport Table with horizontal scroll containment */}
            <div className="hidden lg:block overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-sm text-zinc-300 min-w-[640px]">
                <thead className="bg-[#18181B] text-xs uppercase text-zinc-400 border-b border-[#27272A]">
                  <tr>
                    <th className="px-6 py-3 font-medium">Nome Azienda</th>
                    <th className="px-6 py-3 font-medium">Slug</th>
                    <th className="px-6 py-3 font-medium">Piano</th>
                    <th className="px-6 py-3 font-medium">Sedi</th>
                    <th className="px-6 py-3 font-medium">Dispositivi</th>
                    <th className="px-6 py-3 font-medium">Stato</th>
                    <th className="px-6 py-3 font-medium text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]">
                  {list.map((org) => (
                    <tr key={org.id} className="hover:bg-[#18181B]/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">
                        <Link href={`/admin/organizations/${org.id}`} className="hover:underline">
                          {org.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-400">{org.slug}</td>
                      <td className="px-6 py-4">{org.plans?.name || 'Free'}</td>
                      <td className="px-6 py-4">{org.locations?.[0]?.count ?? 1}</td>
                      <td className="px-6 py-4">{org.devices?.[0]?.count ?? 1}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                          {org.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/organizations/${org.id}`}
                          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                        >
                          Dettagli <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< lg) */}
            <div className="lg:hidden divide-y divide-[#27272A]">
              {list.map((org) => (
                <div key={org.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white text-base leading-snug">{org.name}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 shrink-0">
                      {org.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                    <div>
                      <span className="text-zinc-500 block">Slug</span>
                      <span className="font-mono text-zinc-300">{org.slug}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Piano</span>
                      <span className="text-zinc-200">{org.plans?.name || 'Free'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Sedi Fisiche</span>
                      <span className="text-zinc-200">{org.locations?.[0]?.count ?? 1}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Chip/QR</span>
                      <span className="text-zinc-200">{org.devices?.[0]?.count ?? 1}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-medium flex items-center justify-between transition-colors touch-press"
                    >
                      <span>Gestisci Sedi & Dispositivi</span>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

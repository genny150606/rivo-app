import { createClient } from '@/lib/supabase/server';
import { MapPin, Building, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface LocationItem {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  created_at: string;
}

export default async function LocationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let locations: LocationItem[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profile?.organization_id) {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (data) locations = data as LocationItem[];
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Sedi Commerciali</h1>
        <p className="text-sm text-zinc-400">
          I punti vendita o locali fisici associati alla tua attività.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.length === 0 ? (
          <div className="p-8 col-span-2 rounded-xl bg-[#121214] border border-[#27272A] text-center text-sm text-zinc-500">
            Nessuna sede configurata. Contatta l'amministratore per aggiungere una nuova sede.
          </div>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="p-6 rounded-xl bg-[#121214] border border-[#27272A] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#BFFF00]" />
                  <span className="font-semibold text-white">{loc.name}</span>
                </div>
                <span className="text-xs font-mono uppercase bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                  {loc.country}
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                {loc.address ? `${loc.address}, ` : ''}{loc.city || ''} {loc.postal_code || ''}
              </p>
              <div className="pt-3 border-t border-[#27272A]/70 flex items-center justify-between text-xs text-zinc-500">
                <span>Stato: Operativa</span>
                <span>Creata: {new Date(loc.created_at).toLocaleDateString('it-IT')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

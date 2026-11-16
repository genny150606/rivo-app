import { createClient } from '@/lib/supabase/server';
import { MapPin } from 'lucide-react';
import { EmptyState, PageHeader, StatusBadge, SurfaceCard } from '@/components/ui';

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <div className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="Sedi & Punti Fisici"
        title="Sedi Commerciali"
        description="I punti vendita o locali fisici associati alla tua attività."
        badge={
          <StatusBadge tone="neutral" mono>
            {locations.length} {locations.length === 1 ? 'Sede' : 'Sedi'}
          </StatusBadge>
        }
      />

      {locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          eyebrow="Configurazione Sedi"
          title="Nessuna sede configurata"
          description="Nessuna sede configurata. Contatta l'amministratore per aggiungere una nuova sede."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((loc) => (
            <SurfaceCard key={loc.id} radius="xl" padding="lg" className="min-w-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--rivo-volt-bg)] border border-[var(--rivo-volt-border)] flex items-center justify-center text-[var(--rivo-volt-text)] shrink-0">
                      <MapPin className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <h2 className="font-display font-semibold text-base text-[var(--text-primary)] truncate">
                      {loc.name}
                    </h2>
                  </div>
                  <StatusBadge tone="neutral" shape="tag" mono>
                    <span translate="no">{loc.country}</span>
                  </StatusBadge>
                </div>

                <p className="text-sm text-[var(--text-secondary)]">
                  {loc.address ? `${loc.address}, ` : ''}
                  {loc.city || ''} {loc.postal_code || ''}
                </p>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                  <StatusBadge tone="operational" dot mono>
                    Stato: Operativa
                  </StatusBadge>
                  <span className="font-mono tabular-nums">
                    Creata: {new Date(loc.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}

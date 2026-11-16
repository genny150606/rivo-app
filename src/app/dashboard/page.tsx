import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Smartphone,
  QrCode,
  Layers,
  Activity,
  ArrowUpRight,
  Radio,
  BellRing,
  CalendarDays,
  Scissors,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { getVertical, VERTICAL_REGISTRY } from '@/platform/verticals/registry';
import { BusinessTypeSlug } from '@/platform/modules/registry';
import RetailDashboardOverview, {
  type RetailOverviewProps,
} from '@/components/dashboard/RetailDashboardOverview';
import {
  PageHeader,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  EmptyState,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

interface InteractionSummary {
  interaction_type: string;
  timestamp: string;
  device_id: string;
}

interface DeviceSummary {
  id: string;
  name: string;
  unique_code: string;
  status: string;
}

interface OrgRow {
  name?: string | null;
  category?: string | null;
  business_type?: string | null;
}

interface RawCustomerJoin {
  first_name?: string | null;
  last_name?: string | null;
}

interface RawRetailSaleRow {
  id: string;
  sale_number: string;
  status: string;
  total_amount: number;
  subtotal: number;
  cost_total: number;
  gross_margin: number;
  payment_method: string;
  operator_name: string;
  created_at: string;
  customer?: RawCustomerJoin | RawCustomerJoin[] | null;
  items?: RetailOverviewProps['sales'][number]['items'];
}

interface RawRetailProductJoin {
  id: string;
  name: string;
  brand: string | null;
  sku?: string | null;
  barcode?: string | null;
  category_name?: string | null;
  cost_price: number | null;
  sale_price: number | null;
}

interface RawRetailVariantJoin {
  id: string;
  sku?: string | null;
  barcode?: string | null;
  size: string | null;
  color: string | null;
  reorder_threshold: number;
  cost_price: number | null;
  sale_price: number | null;
  product?: RawRetailProductJoin | RawRetailProductJoin[] | null;
}

interface RawRetailBalanceRow {
  id: string;
  quantity_on_hand: number;
  variant?: RawRetailVariantJoin | RawRetailVariantJoin[] | null;
}

export default async function DashboardOverview() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let orgName = 'La tua attività';
  let isSalonOrBarber = false;
  let todayBookingsCount = 0;
  let activeStaffCount = 0;
  let servicesCatalogCount = 0;
  let totalInteractions = 0;
  let nfcInteractions = 0;
  let qrInteractions = 0;
  let activeDevicesCount = 0;
  let totalDevicesCount = 0;
  let recentInteractions: InteractionSummary[] = [];
  const deviceMap = new Map<string, string>();
  let activeServiceCallsCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('auth_user_id', user.id)
      .single();

    let targetOrgId = profile?.organization_id;
    if (!targetOrgId && profile?.role === 'admin') {
      const { data: firstOrg } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      targetOrgId = firstOrg?.id;
    }

    if (targetOrgId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, category, business_type')
        .eq('id', targetOrgId)
        .single();
      const orgRecord = org as OrgRow | null;
      if (orgRecord?.name) orgName = orgRecord.name;

      const rawCategory = (orgRecord?.category || '') as string;
      const rawBt = (orgRecord?.business_type || '') as string;
      let bType = (
        rawCategory && rawCategory in VERTICAL_REGISTRY
          ? rawCategory
          : rawBt || rawCategory || 'restaurant'
      ) as BusinessTypeSlug;
      if ((bType as string) === 'store' || (bType as string) === 'retail') {
        bType = 'shoe_store';
      }
      isSalonOrBarber = ['salon', 'barber', 'beauty'].includes(bType);
      const vertical = getVertical(bType);
      const isRetail = vertical?.dashboardType === 'retail';

      // RETAIL VERTICAL DASHBOARD BRANCH
      if (isRetail) {
        // Fetch retail sales
        const { data: retailSales } = await supabase
          .from('sales')
          .select(`
            id,
            sale_number,
            status,
            total_amount,
            subtotal,
            cost_total,
            gross_margin,
            payment_method,
            operator_name,
            created_at,
            customer:customers (first_name, last_name),
            items:sale_items (
              product_name,
              variant_name,
              quantity,
              unit_price,
              total_price
            )
          `)
          .eq('organization_id', targetOrgId)
          .order('created_at', { ascending: false })
          .limit(100);

        // Fetch retail stock balances
        const { data: balances } = await supabase
          .from('inventory_balances')
          .select(`
            id,
            quantity_on_hand,
            variant:product_variants (
              id,
              sku,
              barcode,
              size,
              color,
              reorder_threshold,
              cost_price,
              sale_price,
              product:products (
                id,
                name,
                brand,
                sku,
                barcode,
                category_name,
                cost_price,
                sale_price
              )
            )
          `)
          .eq('organization_id', targetOrgId);

        // Count customers and products
        const { count: custCount } = await supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', targetOrgId);

        const { count: prodCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', targetOrgId);

        const formattedSales: RetailOverviewProps['sales'] = ((retailSales || []) as unknown as RawRetailSaleRow[]).map(
          (s) => {
            const cust = Array.isArray(s.customer) ? s.customer[0] : s.customer;
            return {
              ...s,
              customer_name: cust
                ? `${cust.first_name || ''} ${cust.last_name || ''}`.trim() || null
                : null,
            };
          }
        );

        const formattedBalances: RetailOverviewProps['balances'] = (
          (balances || []) as unknown as RawRetailBalanceRow[]
        ).map((b) => {
          const variant = Array.isArray(b.variant)
            ? (b.variant[0] ?? null)
            : (b.variant ?? null);
          const product = variant
            ? Array.isArray(variant.product)
              ? (variant.product[0] ?? null)
              : (variant.product ?? null)
            : null;

          return {
            id: b.id,
            quantity_on_hand: b.quantity_on_hand,
            variant: variant
              ? {
                  id: variant.id,
                  sku: variant.sku ?? null,
                  barcode: variant.barcode ?? null,
                  size: variant.size,
                  color: variant.color,
                  reorder_threshold: variant.reorder_threshold,
                  cost_price: variant.cost_price,
                  sale_price: variant.sale_price,
                  product: product
                    ? {
                        id: product.id,
                        name: product.name,
                        brand: product.brand,
                        sku: product.sku ?? null,
                        barcode: product.barcode ?? null,
                        category_name: product.category_name ?? null,
                        cost_price: product.cost_price,
                        sale_price: product.sale_price,
                      }
                    : null,
                }
              : null,
          };
        });

        return (
          <RetailDashboardOverview
            orgId={targetOrgId}
            orgName={orgRecord?.name || 'Retail Store'}
            businessType={bType}
            sales={formattedSales}
            balances={formattedBalances}
            customersCount={custCount || 0}
            totalProductsCount={prodCount || 0}
          />
        );
      }

      // RESTAURANT / HOSPITALITY FLEET CONTROL ROOM BRANCH
      const { data: interactions } = await supabase
        .from('interactions')
        .select('interaction_type, timestamp, device_id')
        .eq('organization_id', targetOrgId)
        .order('timestamp', { ascending: false });

      if (interactions) {
        totalInteractions = interactions.length;
        nfcInteractions = interactions.filter((i) => i.interaction_type === 'nfc').length;
        qrInteractions = interactions.filter((i) => i.interaction_type === 'qr').length;
        recentInteractions = interactions.slice(0, 8) as InteractionSummary[];
      }

      // Fetch devices for label mapping
      const { data: devices } = await supabase
        .from('devices')
        .select('id, name, unique_code, status')
        .eq('organization_id', targetOrgId);

      if (devices) {
        totalDevicesCount = devices.length;
        activeDevicesCount = devices.filter((d) => d.status === 'active').length;
        devices.forEach((d: DeviceSummary) => {
          deviceMap.set(d.id, d.name || d.unique_code || 'Tavolo / Postazione');
        });
      }

      // Fetch active service calls count
      const { count: pendingCalls } = await supabase
        .from('service_calls')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', targetOrgId)
        .in('status', ['pending', 'in_progress']);

      activeServiceCallsCount = pendingCalls || 0;

      if (isSalonOrBarber) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const [{ count: bCount }, { count: stCount }, { count: srvCount }] = await Promise.all([
          supabase
            .from('salon_bookings')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', targetOrgId)
            .eq('booking_date', todayStr)
            .neq('status', 'cancelled'),
          supabase
            .from('salon_staff')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', targetOrgId)
            .eq('is_active', true),
          supabase
            .from('salon_services')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', targetOrgId)
            .eq('is_active', true),
        ]);
        todayBookingsCount = bCount || 0;
        activeStaffCount = stCount || 0;
        servicesCatalogCount = srvCount || 0;
      }
    }
  }

  const nfcRatio = totalInteractions > 0 ? Math.round((nfcInteractions / totalInteractions) * 100) : 0;
  const qrRatio = totalInteractions > 0 ? Math.round((qrInteractions / totalInteractions) * 100) : 0;

  const timeFormatter = new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });

  const quickActions = [
    {
      href: '/dashboard/custom-hub',
      label: 'Personalizza Hub Cliente',
      meta: 'Tema, moduli e link',
      icon: Layers,
      badge: null,
    },
    {
      href: '/dashboard/devices',
      label: 'Flotta Dispositivi NFC & QR',
      meta: `${activeDevicesCount} su ${totalDevicesCount} attivi`,
      icon: Radio,
      badge: null,
    },
    {
      href: isSalonOrBarber ? '/dashboard/bookings' : '/dashboard/service',
      label: isSalonOrBarber ? 'Agenda & Appuntamenti' : 'Sala & Chiamate Servizio',
      meta: isSalonOrBarber
        ? `${todayBookingsCount} appuntamenti oggi`
        : activeServiceCallsCount > 0
        ? `${activeServiceCallsCount} richieste in attesa`
        : 'Nessuna chiamata pendente',
      icon: isSalonOrBarber ? CalendarDays : BellRing,
      badge: !isSalonOrBarber && activeServiceCallsCount > 0 ? `${activeServiceCallsCount}` : null,
    },
    {
      href: '/dashboard/reviews',
      label: 'Review Shield & Reputazione',
      meta: 'Protezione recensioni Google',
      icon: ShieldCheck,
      badge: null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PANORAMICA OPERATIVA"
        title={orgName}
        badge={
          <StatusBadge
            tone={activeDevicesCount > 0 ? 'operational' : 'warning'}
            variant="hardware"
            size="md"
            dot
            pulse={activeDevicesCount > 0}
          >
            {isSalonOrBarber
              ? `Beauty OS • ${activeDevicesCount}/${totalDevicesCount} nodi`
              : `Live Fleet • ${activeDevicesCount}/${totalDevicesCount} attivi`}
          </StatusBadge>
        }
        description={
          isSalonOrBarber
            ? 'Gestione agenda appuntamenti, disponibilità parrucchieri e barbieri, listino trattamenti e Hub cliente.'
            : 'Control Room unificata per ingressi contactless, richieste di servizio e telemetria dei tavoli.'
        }
        actions={
          <>
            {!isSalonOrBarber && activeServiceCallsCount > 0 && (
              <Link
                href="/dashboard/service"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--accent-warning-border)] bg-[var(--accent-warning-bg)] px-3.5 text-xs font-semibold text-[var(--accent-warning-text)] hover:opacity-90 transition-opacity"
              >
                <BellRing className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className="font-mono tabular-nums">{activeServiceCallsCount} in Sala</span>
              </Link>
            )}
            <Link
              href={isSalonOrBarber ? '/dashboard/analytics' : '/dashboard/devices'}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] px-3.5 text-xs font-semibold text-[var(--text-primary)] transition-colors"
            >
              <span>{isSalonOrBarber ? 'Analisi Dettagliata' : 'Gestisci Hardware'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <Link
              href={isSalonOrBarber ? '/dashboard/bookings' : '/dashboard/analytics'}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-4 text-xs font-bold text-[var(--rivo-volt-ink)] transition-colors"
            >
              {isSalonOrBarber ? (
                <CalendarDays className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Activity className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              )}
              <span>{isSalonOrBarber ? 'Agenda & Prenotazioni' : 'Analisi Dettagliata'}</span>
            </Link>
          </>
        }
      />

      {isSalonOrBarber && (
        <SurfaceCard variant="elevated" padding="md" radius="xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--rivo-volt-border)] bg-[var(--rivo-volt-bg)] text-[var(--rivo-volt-text)]">
                <Scissors className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-sm sm:text-base font-bold tracking-tight text-[var(--text-primary)]">
                  Gestore Prenotazioni Salone &amp; Barberia Attivo
                </h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                  Oggi hai{' '}
                  <strong className="font-mono tabular-nums text-[var(--text-primary)]">
                    {todayBookingsCount} appuntamenti
                  </strong>{' '}
                  in agenda,{' '}
                  <strong className="font-mono tabular-nums text-[var(--text-primary)]">
                    {activeStaffCount} operatori
                  </strong>{' '}
                  attivi e{' '}
                  <strong className="font-mono tabular-nums text-[var(--text-primary)]">
                    {servicesCatalogCount} trattamenti
                  </strong>{' '}
                  prenotabili dall&apos;Hub cliente.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href="/dashboard/bookings"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-4 text-xs font-bold text-[var(--rivo-volt-ink)] transition-colors"
              >
                <CalendarDays className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>Apri Calendario &amp; Staff</span>
              </Link>
              <Link
                href="/dashboard/custom-hub"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] px-3.5 text-xs font-semibold text-[var(--text-primary)] transition-colors"
              >
                <span>Personalizza Hub Cliente</span>
              </Link>
            </div>
          </div>
        </SurfaceCard>
      )}

      {/* Top Row: 4 Operational KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Interazioni Totali"
          value={totalInteractions.toLocaleString('it-IT')}
          icon={Activity}
          tone="neutral"
          context="Volume complessivo sincronizzato"
          href="/dashboard/analytics"
        />
        <KpiCard
          label="Tap NFC Fisici"
          value={nfcInteractions.toLocaleString('it-IT')}
          icon={Smartphone}
          tone="volt"
          delta={{
            value: `${nfcRatio}%`,
            direction: nfcInteractions > 0 ? 'up' : 'flat',
            sentiment: nfcInteractions > 0 ? 'positive' : 'neutral',
            label: 'quota accessi',
          }}
        />
        <KpiCard
          label="Scansioni QR Code"
          value={qrInteractions.toLocaleString('it-IT')}
          icon={QrCode}
          tone="telemetry"
          delta={{
            value: `${qrRatio}%`,
            direction: qrInteractions > 0 ? 'up' : 'flat',
            sentiment: 'neutral',
            label: 'quota fotocamera',
          }}
        />
        <KpiCard
          label="Dispositivi Attivi"
          value={`${activeDevicesCount} / ${totalDevicesCount}`}
          icon={Radio}
          tone={activeDevicesCount > 0 ? 'operational' : 'warning'}
          context={activeDevicesCount > 0 ? 'Rete hardware online' : 'Configura primo nodo'}
          href="/dashboard/devices"
        />
      </div>

      {/* Main Row: Asymmetric 12-Column RIVO Control Grid (8-col Live Feed + 4-col Telemetry & Quick Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 8-Column Live Feed / Activity Stream */}
        <div className="lg:col-span-8 min-w-0">
          <SurfaceCard
            padding="none"
            header={{
              eyebrow: 'ACTIVITY STREAM',
              title: 'Live Feed Interazioni',
              subtitle: 'Ultimi tap NFC e scansioni QR registrati dai dispositivi sul punto vendita',
              icon: Activity,
              action: (
                <StatusBadge
                  tone={recentInteractions.length > 0 ? 'operational' : 'neutral'}
                  dot
                  pulse={recentInteractions.length > 0}
                >
                  {recentInteractions.length > 0 ? 'Live' : 'In attesa'}
                </StatusBadge>
              ),
            }}
            footer={
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  Mostra gli ultimi {recentInteractions.length} eventi
                </span>
                <Link
                  href="/dashboard/analytics"
                  className="inline-flex items-center gap-1 font-semibold text-[var(--rivo-volt-text)] hover:underline"
                >
                  <span>Apri archivio completo</span>
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                </Link>
              </div>
            }
          >
            {recentInteractions.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Radio}
                  eyebrow="TELEMETRIA IN ATTESA"
                  title="Nessuna interazione recente registrata"
                  description="Avvicina uno smartphone a un tag NFC oppure inquadra un QR Code configurato per visualizzare gli accessi in tempo reale."
                  primaryAction={{
                    label: 'Configura Dispositivi',
                    href: '/dashboard/devices',
                    icon: Smartphone,
                  }}
                  compact
                />
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)]">
                {recentInteractions.map((evt, idx) => {
                  const label = deviceMap.get(evt.device_id) || 'Tavolo / Postazione';
                  const isNfc = evt.interaction_type === 'nfc';
                  const timeStr = timeFormatter.format(new Date(evt.timestamp));

                  return (
                    <li
                      key={`${evt.device_id}-${evt.timestamp}-${idx}`}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 min-h-[52px] hover:bg-[var(--bg-elevated)]/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={
                            isNfc
                              ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--rivo-volt-border)] bg-[var(--rivo-volt-bg)] text-[var(--rivo-volt-text)]'
                              : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-telemetry-border)] bg-[var(--accent-telemetry-bg)] text-[var(--accent-telemetry-text)]'
                          }
                        >
                          {isNfc ? (
                            <Smartphone className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                          ) : (
                            <QrCode className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                            {label}
                          </span>
                          <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                            {isNfc ? 'Accesso Near-Field (NTAG)' : 'Scansione Ottica Fotocamera'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <StatusBadge tone={isNfc ? 'volt' : 'telemetry'} size="sm">
                          {isNfc ? 'NFC' : 'QR'}
                        </StatusBadge>
                        <span className="font-mono tabular-nums text-xs text-[var(--text-muted)]">
                          {timeStr}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SurfaceCard>
        </div>

        {/* 4-Column Hardware Telemetry & Quick Actions */}
        <div className="lg:col-span-4 space-y-6 min-w-0">
          <SurfaceCard
            header={{
              eyebrow: 'TELEMETRIA HARDWARE',
              title: 'Canali di Acquisizione',
              icon: Radio,
              action: (
                <StatusBadge tone={activeDevicesCount > 0 ? 'operational' : 'warning'} dot>
                  {activeDevicesCount} online
                </StatusBadge>
              ),
            }}
            footer={
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[var(--text-secondary)]">Hardware RIVO attivo</span>
                <Link
                  href="/dashboard/devices"
                  className="inline-flex items-center gap-1 font-semibold text-[var(--rivo-volt-text)] hover:underline"
                >
                  <span>Configura Tag</span>
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                </Link>
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                    <Smartphone
                      className="w-3.5 h-3.5 text-[var(--rivo-volt-text)]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span>Tap NFC (High Intent)</span>
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[var(--text-primary)]">
                    {nfcInteractions} ({nfcRatio}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-operational)]"
                    style={{ width: `${nfcRatio}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                    <QrCode
                      className="w-3.5 h-3.5 text-[var(--accent-telemetry-text)]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span>Scansioni QR</span>
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[var(--text-primary)]">
                    {qrInteractions} ({qrRatio}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-telemetry)]"
                    style={{ width: `${qrRatio}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2.5">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    Nodi Attivi
                  </span>
                  <span className="mt-0.5 block font-mono tabular-nums text-sm font-bold text-[var(--text-primary)]">
                    {activeDevicesCount} / {totalDevicesCount}
                  </span>
                </div>
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2.5">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {isSalonOrBarber ? 'Agenda Oggi' : 'Sala Attiva'}
                  </span>
                  <span className="mt-0.5 block font-mono tabular-nums text-sm font-bold text-[var(--text-primary)]">
                    {isSalonOrBarber ? `${todayBookingsCount} app.` : `${activeServiceCallsCount} chiamate`}
                  </span>
                </div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard
            header={{
              eyebrow: 'AZIONI RAPIDE',
              title: 'Comandi Control Room',
              icon: Layers,
            }}
          >
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex min-h-[48px] items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2.5 hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className="w-4 h-4 shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--rivo-volt-text)] transition-colors"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">
                          {action.label}
                        </span>
                        <span className="block truncate text-[11px] text-[var(--text-muted)]">
                          {action.meta}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {action.badge && (
                        <StatusBadge tone="warning" size="sm">
                          {action.badge}
                        </StatusBadge>
                      )}
                      <ChevronRight
                        className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

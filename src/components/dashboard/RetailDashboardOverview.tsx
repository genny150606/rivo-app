'use client';

import { useState, useMemo, useId } from 'react';
import Link from 'next/link';
import {
  Store,
  ShoppingBag,
  Boxes,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Plus,
  Clock,
  ChevronRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Receipt,
  Cpu,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useSimpleMode } from '@/lib/simple-mode';
import SimpleRetailERPView from '@/components/dashboard/SimpleRetailERPView';
import {
  PageHeader,
  SurfaceCard,
  KpiCard,
  StatusBadge,
  SegmentedControl,
  EmptyState,
  ChartTooltip,
  type SegmentedOption,
} from '@/components/ui';
import {
  RIVO_CHART_GRID,
  RIVO_CHART_AXIS_TICK,
  RIVO_CHART_SERIES,
  formatItCurrency,
} from '@/lib/chart-theme';

export interface RetailOverviewProps {
  orgId: string;
  orgName: string;
  businessType: string;
  sales: Array<{
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
    customer_name?: string | null;
    items?: Array<{
      product_name: string;
      variant_name: string | null;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  }>;
  balances: Array<{
    id: string;
    quantity_on_hand: number;
    variant: {
      id: string;
      sku?: string | null;
      barcode?: string | null;
      size: string | null;
      color: string | null;
      reorder_threshold: number;
      cost_price: number | null;
      sale_price: number | null;
      product: {
        id: string;
        name: string;
        brand: string | null;
        sku?: string | null;
        barcode?: string | null;
        category_name?: string | null;
        cost_price: number | null;
        sale_price: number | null;
      } | null;
    } | null;
  }>;
  customersCount: number;
  totalProductsCount: number;
}

type TimeRangeValue = 'today' | '7d' | '30d';

const TIME_RANGE_OPTIONS: ReadonlyArray<SegmentedOption<TimeRangeValue>> = [
  { value: 'today', label: 'Oggi' },
  { value: '7d', label: 'Ultimi 7 Giorni' },
  { value: '30d', label: 'Ultimi 30 Giorni' },
];

export default function RetailDashboardOverview({
  orgName,
  businessType,
  sales,
  balances,
  customersCount,
  totalProductsCount,
}: RetailOverviewProps) {
  const { isSimple, setSimple } = useSimpleMode();
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('7d');
  const retailSalesGradId = useId();

  // Anchor reference timestamp once to keep memoized ranges stable
  const now = useMemo(() => new Date(), []);
  const startOfToday = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(),
    [now]
  );
  const startOf7d = useMemo(() => now.getTime() - 7 * 24 * 60 * 60 * 1000, [now]);
  const startOf30d = useMemo(() => now.getTime() - 30 * 24 * 60 * 60 * 1000, [now]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const t = new Date(s.created_at).getTime();
      if (timeRange === 'today') return t >= startOfToday;
      if (timeRange === '7d') return t >= startOf7d;
      return t >= startOf30d;
    });
  }, [sales, timeRange, startOfToday, startOf7d, startOf30d]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let piecesSold = 0;
    const transactions = filteredSales.filter((s) => s.status !== 'cancelled');

    for (const s of transactions) {
      revenue += Number(s.total_amount) || 0;
      cost += Number(s.cost_total) || 0;
      for (const it of s.items || []) {
        piecesSold += it.quantity;
      }
    }

    const margin = revenue - cost;
    const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;
    const avgBasket = transactions.length > 0 ? revenue / transactions.length : 0;

    // Inventory metrics
    let totalPiecesInStock = 0;
    let totalStockCostValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const b of balances) {
      const q = b.quantity_on_hand || 0;
      totalPiecesInStock += q;
      const c =
        b.variant?.cost_price ||
        b.variant?.product?.cost_price ||
        (b.variant?.sale_price || b.variant?.product?.sale_price || 0) * 0.5;
      totalStockCostValue += q * c;

      const threshold = b.variant?.reorder_threshold ?? 2;
      if (q <= 0) outOfStockCount++;
      else if (q <= threshold) lowStockCount++;
    }

    return {
      revenue,
      transactionsCount: transactions.length,
      piecesSold,
      margin,
      marginPercent,
      avgBasket,
      totalPiecesInStock,
      totalStockCostValue,
      lowStockCount,
      outOfStockCount,
    };
  }, [filteredSales, balances]);

  // Sales Trend Chart Data (Daily timeline)
  const chartData = useMemo(() => {
    const days = timeRange === 'today' ? 1 : timeRange === '7d' ? 7 : 30;
    const map = new Map<
      string,
      { date: string; displayDate: string; revenue: number; orders: number }
    >();
    const dayFormatter = new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Europe/Rome',
    });

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const displayDate = dayFormatter.format(d);
      map.set(key, { date: key, displayDate, revenue: 0, orders: 0 });
    }

    for (const s of sales) {
      const key = s.created_at.slice(0, 10);
      if (map.has(key)) {
        const item = map.get(key)!;
        item.revenue += Number(s.total_amount) || 0;
        item.orders += 1;
      }
    }

    return Array.from(map.values());
  }, [sales, timeRange, now]);

  // Top 5 Products by Quantity Sold
  const topProducts = useMemo(() => {
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const s of filteredSales) {
      for (const it of s.items || []) {
        const current = productMap.get(it.product_name) || {
          name: it.product_name,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += it.quantity;
        current.revenue += it.total_price;
        productMap.set(it.product_name, current);
      }
    }

    return Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales]);

  // Critical Low Stock Variants (Top 5 items requiring reorder)
  const criticalStockItems = useMemo(() => {
    return balances
      .filter((b) => (b.quantity_on_hand || 0) <= (b.variant?.reorder_threshold ?? 2))
      .sort((a, b) => (a.quantity_on_hand || 0) - (b.quantity_on_hand || 0))
      .slice(0, 5);
  }, [balances]);

  // Recent Sales (Top 5 transactions)
  const recentSales = useMemo(() => {
    return sales.slice(0, 5);
  }, [sales]);

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Rome',
      }),
    []
  );

  if (isSimple) {
    return (
      <div className="space-y-4">
        <SimpleRetailERPView
          orgName={orgName}
          initialBalances={balances}
          initialSales={sales}
          onExitSimpleMode={() => setSimple(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          businessType === 'shoe_store' ? 'FOOTWEAR & FASHION OS' : 'RETAIL COMMERCIAL OS'
        }
        title={orgName}
        badge={
          <StatusBadge tone="operational" variant="soft" size="md" dot pulse>
            Operativo
          </StatusBadge>
        }
        description="Panoramica vendite, andamento margini lordi, controllo scorte e registro transazioni."
        meta={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-[var(--rivo-volt-text)]" strokeWidth={1.75} aria-hidden="true" />
              <span>Catalogo: {totalProductsCount} articoli</span>
            </span>
            <span aria-hidden="true">•</span>
            <span>Giacenza: {kpis.totalPiecesInStock.toLocaleString('it-IT')} pz</span>
            <span aria-hidden="true">•</span>
            <span>Clienti CRM: {customersCount.toLocaleString('it-IT')}</span>
          </div>
        }
        actions={
          <>
            <Link
              href="/dashboard/inventory"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] px-3.5 text-xs font-semibold text-[var(--text-primary)] transition-colors"
            >
              <Boxes className="w-4 h-4 text-[var(--text-secondary)] shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>Magazzino</span>
            </Link>

            <Link
              href="/dashboard/sales"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-4 text-xs font-bold text-[var(--rivo-volt-ink)] transition-colors"
            >
              <Store className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>Apri Punto Cassa POS</span>
            </Link>
          </>
        }
      />

      {/* Time Range Segmented Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] font-medium">
            Periodo di Analisi
          </span>
        </div>

        <SegmentedControl
          options={TIME_RANGE_OPTIONS}
          value={timeRange}
          onChange={setTimeRange}
          ariaLabel="Periodo di analisi vendite"
          size="sm"
        />
      </div>

      {/* 4 Operational Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Fatturato Vendite"
          value={formatItCurrency(kpis.revenue)}
          icon={TrendingUp}
          tone="volt"
          context={`${kpis.transactionsCount} scontrini (${kpis.piecesSold} pezzi venduti)`}
        />

        <KpiCard
          label="Margine Lordo Stimato"
          value={formatItCurrency(kpis.margin)}
          icon={DollarSign}
          tone="operational"
          delta={{
            value: `${kpis.marginPercent.toFixed(1)}%`,
            direction: kpis.margin > 0 ? 'up' : 'flat',
            sentiment: kpis.margin > 0 ? 'positive' : 'neutral',
            label: 'sui ricavi netti',
          }}
        />

        <KpiCard
          label="Scontrino Medio"
          value={formatItCurrency(kpis.avgBasket)}
          icon={ShoppingBag}
          tone="neutral"
          context="Valore medio per cliente"
        />

        <KpiCard
          label="Varianti Sotto Scorta"
          value={`${kpis.lowStockCount} varianti`}
          icon={AlertTriangle}
          tone={kpis.lowStockCount > 0 || kpis.outOfStockCount > 0 ? 'warning' : 'operational'}
          context={
            kpis.outOfStockCount > 0
              ? `${kpis.outOfStockCount} esaurite • Ordina fornitori`
              : kpis.lowStockCount > 0
              ? 'Clicca per ordinare ai fornitori'
              : 'Scorte in ottimo stato'
          }
          href="/dashboard/inventory"
        />
      </div>

      {/* Asymmetric 8/4 Split: Sales Trend Chart + Reorder Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 min-w-0">
          <SurfaceCard
            className="h-full"
            header={{
              eyebrow: 'TELEMETRIA INCASSI',
              title: 'Andamento Vendite (€)',
              subtitle: 'Evoluzione giornaliera del fatturato registrato a cassa',
              icon: BarChart3,
              action: (
                <StatusBadge tone="volt" variant="soft" size="sm">
                  {timeRange === 'today' ? 'Oggi' : timeRange === '7d' ? '7 Giorni' : '30 Giorni'}
                </StatusBadge>
              ),
            }}
          >
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={retailSalesGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--chart-series-primary)"
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--chart-series-primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...RIVO_CHART_GRID} />
                  <XAxis
                    dataKey="displayDate"
                    tick={RIVO_CHART_AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={RIVO_CHART_AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    width={54}
                    tickFormatter={(v) => `€${v}`}
                  />
                  <Tooltip
                    content={<ChartTooltip currency />}
                    cursor={{
                      stroke: 'var(--chart-cursor)',
                      strokeWidth: 1,
                      strokeDasharray: '3 3',
                    }}
                  />
                  <Area
                    type="monotone"
                    name="Fatturato"
                    dataKey="revenue"
                    stroke={RIVO_CHART_SERIES.primary}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#${retailSalesGradId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SurfaceCard>
        </div>

        {/* Low Stock Alerts (4 Columns) */}
        <div className="lg:col-span-4 min-w-0">
          <SurfaceCard
            className="h-full flex flex-col justify-between"
            header={{
              eyebrow: 'MAGAZZINO',
              title: 'Alert Riordino',
              icon: AlertTriangle,
              action: (
                <Link
                  href="/dashboard/inventory"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-warning-text)] hover:underline"
                >
                  <span>Vedi tutto</span>
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                </Link>
              ),
            }}
          >
            {criticalStockItems.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Scorte sotto controllo"
                description="Nessun articolo attualmente sotto soglia minima di riordino."
                compact
              />
            ) : (
              <div className="space-y-2.5">
                {criticalStockItems.map((b) => {
                  const onHand = b.quantity_on_hand || 0;
                  const p = b.variant?.product;
                  const v = b.variant;

                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--accent-warning-border)] bg-[var(--accent-warning-bg)] p-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--text-primary)] truncate">
                          {p?.name || 'Articolo'}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[var(--text-secondary)] truncate">
                          {p?.brand ? `${p.brand} • ` : ''}
                          Taglia {v?.size || 'U'}
                          {v?.color ? ` • ${v.color}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <StatusBadge
                            tone={onHand === 0 ? 'critical' : 'warning'}
                            size="sm"
                          >
                            {onHand === 0 ? 'Esaurito' : `${onHand} pz`}
                          </StatusBadge>
                          <span className="mt-0.5 block font-mono tabular-nums text-[10px] text-[var(--text-muted)]">
                            Soglia {v?.reorder_threshold ?? 2}
                          </span>
                        </div>
                        <Link
                          href="/dashboard/suppliers"
                          aria-label={`Ordina ${p?.name || 'articolo'} al fornitore`}
                          title="Ordina al fornitore"
                          className="inline-flex h-8 w-8 max-sm:min-h-[44px] max-sm:min-w-[44px] items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--rivo-volt)] hover:text-[var(--rivo-volt-ink)] hover:border-transparent transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SurfaceCard>
        </div>
      </div>

      {/* Bottom Asymmetric Row: Top 5 Products (4 Cols) + Recent Sales Ledger (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 min-w-0">
          <SurfaceCard
            header={{
              eyebrow: 'PERFORMANCE PRODOTTO',
              title: 'Top 5 Più Venduti',
              icon: ShoppingBag,
              action: (
                <Link
                  href="/dashboard/sales"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--rivo-volt-text)] hover:underline"
                >
                  <span>Vendite</span>
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                </Link>
              ),
            }}
          >
            {topProducts.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Nessuna vendita nel periodo"
                description="Registra una vendita al Punto Cassa per visualizzare la classifica dei modelli più richiesti."
                primaryAction={{
                  label: 'Apri Punto Cassa',
                  href: '/dashboard/sales',
                  icon: Store,
                }}
                compact
              />
            ) : (
              <div className="space-y-2.5">
                {topProducts.map((p, idx) => (
                  <div
                    key={`${p.name}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-mono tabular-nums text-[11px] font-bold text-[var(--text-secondary)]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-[var(--text-primary)] truncate">
                        {p.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-mono tabular-nums font-bold text-[var(--text-primary)]">
                        {formatItCurrency(p.revenue)}
                      </span>
                      <span className="block font-mono tabular-nums text-[10px] text-[var(--text-muted)]">
                        {p.quantity} pz venduti
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>

        <div className="lg:col-span-8 min-w-0">
          <SurfaceCard
            padding="none"
            header={{
              eyebrow: 'REGISTRO TRANSAZIONI',
              title: 'Ultime Vendite Registrate a Cassa',
              icon: Clock,
              action: (
                <Link
                  href="/dashboard/sales"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--rivo-volt-text)] hover:underline"
                >
                  <span>Registro Completo</span>
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                </Link>
              ),
            }}
          >
            {recentSales.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Receipt}
                  title="Nessuna vendita registrata finora"
                  description="Gli scontrini emessi dal Punto Cassa POS appariranno qui in tempo reale con dettagli su articoli e marginalità."
                  primaryAction={{
                    label: 'Emetti Primo Scontrino',
                    href: '/dashboard/sales',
                    icon: Store,
                  }}
                  compact
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Scontrino</th>
                      <th className="px-4 py-3 font-semibold">Data e Ora</th>
                      <th className="px-4 py-3 font-semibold">Cliente</th>
                      <th className="px-4 py-3 font-semibold">Articoli</th>
                      <th className="px-4 py-3 font-semibold">Pagamento</th>
                      <th className="px-4 py-3 text-right font-semibold">Totale Incasso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {recentSales.map((s) => {
                      const itemsCount = (s.items || []).reduce(
                        (acc, it) => acc + it.quantity,
                        0
                      );
                      const paymentLabel =
                        s.payment_method === 'card'
                          ? 'Carta POS'
                          : s.payment_method === 'cash'
                          ? 'Contanti'
                          : s.payment_method === 'transfer'
                          ? 'Bonifico'
                          : 'Buono';

                      return (
                        <tr
                          key={s.id}
                          className="min-h-[48px] hover:bg-[var(--bg-elevated)]/60 transition-colors"
                        >
                          <td className="px-4 py-3.5 font-mono tabular-nums font-bold text-[var(--text-primary)] whitespace-nowrap">
                            {s.sale_number}
                          </td>
                          <td className="px-4 py-3.5 font-mono tabular-nums text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                            {dateTimeFormatter.format(new Date(s.created_at))}
                          </td>
                          <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                            {s.customer_name || 'Cliente al banco'}
                          </td>
                          <td className="px-4 py-3.5 font-mono tabular-nums text-[var(--text-secondary)] whitespace-nowrap">
                            {itemsCount} pz ({(s.items || []).length} righe)
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge tone="neutral" size="sm">
                              {paymentLabel}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono tabular-nums font-bold text-[var(--text-primary)] whitespace-nowrap">
                            {formatItCurrency(Number(s.total_amount))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo, useCallback, useId } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import {
  Smartphone,
  QrCode,
  TrendingUp,
  Layers,
  ArrowUpRight,
  RefreshCw,
  DollarSign,
  Receipt,
  CreditCard,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import {
  ChartTooltip,
  EmptyState,
  KpiCard,
  PageHeader,
  SegmentedControl,
  SurfaceCard,
} from '@/components/ui';
import {
  RIVO_CHART_GRID,
  RIVO_CHART_AXIS_TICK,
  RIVO_CHART_SERIES,
  formatItCurrency,
} from '@/lib/chart-theme';

interface InteractionRecord {
  id: string;
  interaction_type: 'nfc' | 'qr' | 'unknown';
  timestamp: string;
  device_id: string;
}

interface DeviceRecord {
  id: string;
  name: string;
  unique_code: string;
}

interface SaleRecord {
  id: string;
  sale_number: string;
  status: string;
  total_amount: number;
  subtotal: number;
  cost_total: number;
  gross_margin: number;
  payment_method: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const [supabase] = useState(() => createClient());
  const chartUid = useId().replace(/:/g, '');
  const revGradId = `revGrad-${chartUid}`;
  const marginGradId = `marginGrad-${chartUid}`;
  const nfcGradId = `nfcGrad-${chartUid}`;
  const qrGradId = `qrGrad-${chartUid}`;
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [activeTab, setActiveTab] = useState<'sales' | 'interactions'>('sales');

  const [interactions, setInteractions] = useState<InteractionRecord[]>([]);
  const [devices, setDevices] = useState<Record<string, DeviceRecord>>({});
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [hasSalesData, setHasSalesData] = useState(false);

  const loadAnalyticsForRange = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

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

    if (!targetOrgId) return null;

    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : 30;
    const cutoffDate = new Date(
      now.getTime() - daysBack * 24 * 60 * 60 * 1000
    ).toISOString();

    const [interactionsRes, devicesRes, salesRes] = await Promise.all([
      supabase
        .from('interactions')
        .select('id, interaction_type, timestamp, device_id')
        .eq('organization_id', targetOrgId)
        .gte('timestamp', cutoffDate)
        .order('timestamp', { ascending: true }),
      supabase
        .from('devices')
        .select('id, name, unique_code')
        .eq('organization_id', targetOrgId),
      supabase
        .from('sales')
        .select(
          'id, sale_number, status, total_amount, subtotal, cost_total, gross_margin, payment_method, created_at'
        )
        .eq('organization_id', targetOrgId)
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: true }),
    ]);

    const devMap: Record<string, DeviceRecord> = {};
    devicesRes.data?.forEach((d) => {
      devMap[d.id] = d;
    });

    return {
      devMap,
      interactions: (interactionsRes.data as InteractionRecord[]) || [],
      sales: (salesRes.data as SaleRecord[]) || [],
    };
  }, [supabase, timeRange]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadAnalyticsForRange();
      if (!result) return;
      setDevices(result.devMap);
      setInteractions(result.interactions);
      setSales(result.sales);
      const salesExist = result.sales.length > 0;
      setHasSalesData(salesExist);
      if (!salesExist) {
        setActiveTab('interactions');
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [loadAnalyticsForRange]);

  useEffect(() => {
    let active = true;
    async function initAnalytics() {
      try {
        const result = await loadAnalyticsForRange();
        if (!active || !result) return;
        setDevices(result.devMap);
        setInteractions(result.interactions);
        setSales(result.sales);
        const salesExist = result.sales.length > 0;
        setHasSalesData(salesExist);
        if (!salesExist) {
          setActiveTab('interactions');
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    void initAnalytics();
    return () => {
      active = false;
    };
  }, [loadAnalyticsForRange]);

  // Aggregate daily sales data for AreaChart
  const salesChartData = useMemo(() => {
    const daysBack = timeRange === '7d' ? 7 : 30;
    const now = new Date();
    const map = new Map<
      string,
      {
        dateStr: string;
        displayDay: string;
        revenue: number;
        margin: number;
        orders: number;
      }
    >();

    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      const displayDay = d.toLocaleDateString('it-IT', {
        weekday: timeRange === '7d' ? 'short' : undefined,
        day: 'numeric',
        month: timeRange === '30d' ? 'short' : undefined,
      });
      map.set(key, { dateStr: key, displayDay, revenue: 0, margin: 0, orders: 0 });
    }

    sales.forEach((s) => {
      const key = s.created_at.split('T')[0];
      if (map.has(key)) {
        const item = map.get(key)!;
        item.revenue += Number(s.total_amount) || 0;
        item.margin += Number(s.gross_margin) || 0;
        item.orders += 1;
      }
    });

    return Array.from(map.values());
  }, [sales, timeRange]);

  // Payment methods breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      const m = s.payment_method || 'other';
      map[m] = (map[m] || 0) + Number(s.total_amount || 0);
    });

    const labels: Record<string, string> = {
      card: 'Carta / POS',
      cash: 'Contanti',
      transfer: 'Bonifico',
      coupon: 'Buono Spesa',
      other: 'Altro',
    };

    return Object.entries(map).map(([k, val]) => ({
      name: labels[k] || k,
      value: Number(val.toFixed(2)),
    }));
  }, [sales]);

  // Aggregate daily interactions data for AreaChart
  const interactionsChartData = useMemo(() => {
    const daysBack = timeRange === '7d' ? 7 : 30;
    const result: Record<
      string,
      { day: string; dateStr: string; nfc: number; qr: number; total: number }
    > = {};

    const now = new Date();
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('it-IT', {
        weekday: timeRange === '7d' ? 'short' : undefined,
        day: 'numeric',
        month: timeRange === '30d' ? 'short' : undefined,
      });

      result[key] = {
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        dateStr: key,
        nfc: 0,
        qr: 0,
        total: 0,
      };
    }

    interactions.forEach((item) => {
      const key = item.timestamp.split('T')[0];
      if (result[key]) {
        if (item.interaction_type === 'nfc') {
          result[key].nfc += 1;
        } else {
          result[key].qr += 1;
        }
        result[key].total += 1;
      }
    });

    return Object.values(result);
  }, [interactions, timeRange]);

  // Channel metrics
  const nfcCount = useMemo(
    () => interactions.filter((i) => i.interaction_type === 'nfc').length,
    [interactions]
  );
  const qrCount = useMemo(
    () => interactions.filter((i) => i.interaction_type === 'qr').length,
    [interactions]
  );
  const totalCount = interactions.length;
  const nfcPercent = totalCount > 0 ? Math.round((nfcCount / totalCount) * 100) : 0;
  const qrPercent = totalCount > 0 ? Math.round((qrCount / totalCount) * 100) : 0;

  // Sales totals
  const totalSalesRevenue = useMemo(
    () => sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0),
    [sales]
  );
  const totalSalesMargin = useMemo(
    () => sales.reduce((acc, s) => acc + Number(s.gross_margin || 0), 0),
    [sales]
  );
  const avgBasket = useMemo(
    () => (sales.length > 0 ? totalSalesRevenue / sales.length : 0),
    [sales, totalSalesRevenue]
  );
  const marginPercent =
    totalSalesRevenue > 0 ? (totalSalesMargin / totalSalesRevenue) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl min-w-0">
        <PageHeader title="Analytics & Reportistica" loading />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="" value="" loading />
          <KpiCard label="" value="" loading />
          <KpiCard label="" value="" loading />
          <KpiCard label="" value="" loading />
        </div>
        <SurfaceCard loading />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl min-w-0">
      <PageHeader
        eyebrow="Telemetria & Marginalità"
        title="Analytics & Reportistica"
        description="Dati aggregati in tempo reale su vendite, marginalità, traffico NFC/QR e touchpoint."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              ariaLabel="Intervallo temporale"
              size="sm"
              value={timeRange}
              onChange={(nextRange) => {
                setLoading(true);
                setTimeRange(nextRange);
              }}
              options={[
                { value: '7d', label: 'Ultimi 7 Giorni' },
                { value: '30d', label: 'Ultimi 30 Giorni' },
              ]}
            />
            <button
              type="button"
              onClick={loadAnalytics}
              title="Aggiorna dati"
              aria-label="Aggiorna dati analytics"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        }
      />

      {/* Tabs Switcher: Sales vs Interactions */}
      <div className="overflow-x-auto max-w-full pb-1">
        <SegmentedControl
          ariaLabel="Sezione analytics"
          value={activeTab}
          onChange={setActiveTab}
          options={
            hasSalesData
              ? [
                  { value: 'sales', label: 'Vendite & Redditività', icon: DollarSign },
                  {
                    value: 'interactions',
                    label: 'Traffico Contactless NFC / QR',
                    icon: Smartphone,
                    badge: totalCount,
                  },
                ]
              : [
                  {
                    value: 'interactions',
                    label: 'Traffico Contactless NFC / QR',
                    icon: Smartphone,
                    badge: totalCount,
                  },
                ]
          }
        />
      </div>

      {/* TAB 1: RETAIL SALES ANALYTICS */}
      {activeTab === 'sales' && (
        <div className="space-y-6 min-w-0">
          {/* Sales KPIs Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Fatturato Periodo"
              value={formatItCurrency(totalSalesRevenue)}
              icon={DollarSign}
              tone="neutral"
              context={`${sales.length} transazioni concluse`}
            />
            <KpiCard
              label="Margine Lordo Totale"
              value={formatItCurrency(totalSalesMargin)}
              icon={Percent}
              tone="operational"
              context={`${marginPercent.toFixed(1)}% di redditività media`}
            />
            <KpiCard
              label="Scontrino Medio"
              value={formatItCurrency(avgBasket)}
              icon={Receipt}
              tone="neutral"
              context="Importo medio speso per scontrino"
            />
            <KpiCard
              label="Transazioni a Cassa"
              value={sales.length.toLocaleString('it-IT')}
              icon={ShoppingBag}
              tone="volt"
              context="Scontrini emessi nel periodo"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
            {/* Daily Sales & Margin Chart */}
            <SurfaceCard
              radius="2xl"
              padding="lg"
              className={paymentBreakdown.length > 0 ? 'lg:col-span-8 min-w-0' : 'lg:col-span-12 min-w-0'}
              header={{
                eyebrow: 'Andamento Ricavi',
                title: 'Evoluzione Giornaliera Fatturato & Margine Lordo',
                icon: TrendingUp,
              }}
            >
              {sales.length === 0 ? (
                <EmptyState
                  compact
                  icon={TrendingUp}
                  title="Nessuna vendita nel periodo"
                  description="Nessuna transazione registrata nell'intervallo temporale selezionato."
                />
              ) : (
                <div className="h-64 sm:h-72 w-full min-w-0 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={salesChartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id={revGradId} x1="0" y1="0" x2="0" y2="1">
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
                        <linearGradient id={marginGradId} x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="var(--chart-series-operational)"
                            stopOpacity={0.24}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--chart-series-operational)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...RIVO_CHART_GRID} />
                      <XAxis
                        dataKey="displayDay"
                        tick={RIVO_CHART_AXIS_TICK}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={RIVO_CHART_AXIS_TICK}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `€${v}`}
                      />
                      <Tooltip
                        content={<ChartTooltip currency />}
                        cursor={{ stroke: 'var(--chart-cursor)', strokeWidth: 1 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={RIVO_CHART_SERIES.primary}
                        strokeWidth={2}
                        fill={`url(#${revGradId})`}
                        name="Fatturato"
                      />
                      <Area
                        type="monotone"
                        dataKey="margin"
                        stroke={RIVO_CHART_SERIES.operational}
                        strokeWidth={2}
                        fill={`url(#${marginGradId})`}
                        name="Margine"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SurfaceCard>

            {/* Payment Method Distribution */}
            {paymentBreakdown.length > 0 && (
              <SurfaceCard
                radius="2xl"
                padding="lg"
                className="lg:col-span-4 min-w-0"
                header={{
                  eyebrow: 'Incassi',
                  title: 'Ripartizione per Metodo di Pagamento',
                  icon: CreditCard,
                }}
              >
                <div className="space-y-4">
                  {paymentBreakdown.map((pb, idx) => {
                    const pct =
                      totalSalesRevenue > 0 ? (pb.value / totalSalesRevenue) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center gap-2 font-medium">
                          <span className="text-[var(--text-secondary)] truncate">
                            {pb.name}
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-[var(--text-primary)] shrink-0">
                            {formatItCurrency(pb.value)} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[var(--chart-series-primary)] h-full rounded-full transition-[width] duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SurfaceCard>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTION FLEET ANALYTICS */}
      {activeTab === 'interactions' && (
        <div className="space-y-6 min-w-0">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Totale Interazioni"
              value={totalCount.toLocaleString('it-IT')}
              icon={Layers}
              tone="neutral"
              context="Volume complessivo"
            />
            <KpiCard
              label="Tap NFC Fisici"
              value={nfcCount.toLocaleString('it-IT')}
              icon={Smartphone}
              tone="operational"
              context={`${nfcPercent}% del totale`}
            />
            <KpiCard
              label="Scansioni QR Code"
              value={qrCount.toLocaleString('it-IT')}
              icon={QrCode}
              tone="telemetry"
              context={`${qrPercent}% del totale`}
            />
            <KpiCard
              label="Dispositivi Attivi"
              value={Object.keys(devices).length}
              icon={ArrowUpRight}
              tone="volt"
              context="Punti contatto fisici"
            />
          </div>

          {/* Interactions Area Chart */}
          <SurfaceCard
            radius="2xl"
            padding="lg"
            header={{
              eyebrow: 'Traffico Touchpoint',
              title: 'Trend Temporale Interazioni',
              icon: Smartphone,
            }}
          >
            <div className="h-64 sm:h-72 w-full min-w-0 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={interactionsChartData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={nfcGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--chart-series-operational)"
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--chart-series-operational)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id={qrGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--chart-series-secondary)"
                        stopOpacity={0.24}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--chart-series-secondary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...RIVO_CHART_GRID} />
                  <XAxis
                    dataKey="day"
                    tick={RIVO_CHART_AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={RIVO_CHART_AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: 'var(--chart-cursor)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="nfc"
                    stroke={RIVO_CHART_SERIES.operational}
                    strokeWidth={2}
                    fill={`url(#${nfcGradId})`}
                    name="NFC"
                  />
                  <Area
                    type="monotone"
                    dataKey="qr"
                    stroke={RIVO_CHART_SERIES.secondary}
                    strokeWidth={2}
                    fill={`url(#${qrGradId})`}
                    name="QR Code"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SurfaceCard>
        </div>
      )}
    </div>
  );
}

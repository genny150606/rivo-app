'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { 
  Calendar, 
  Smartphone, 
  QrCode, 
  TrendingUp, 
  Clock, 
  Layers,
  ArrowUpRight,
  RefreshCw,
  DollarSign,
  Receipt,
  CreditCard,
  Banknote,
  ShoppingBag,
  Percent
} from 'lucide-react';

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

const PIE_COLORS = ['#bfff00', '#38bdf8', '#a855f7', '#f43f5e', '#fbbf24'];

export default function AnalyticsPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [activeTab, setActiveTab] = useState<'sales' | 'interactions'>('sales');

  const [interactions, setInteractions] = useState<InteractionRecord[]>([]);
  const [devices, setDevices] = useState<Record<string, DeviceRecord>>({});
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [hasSalesData, setHasSalesData] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      if (!targetOrgId) {
        setLoading(false);
        return;
      }

      // Date cutoff
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : 30;
      const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      // Fetch Interactions & Devices
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
          .select('id, sale_number, status, total_amount, subtotal, cost_total, gross_margin, payment_method, created_at')
          .eq('organization_id', targetOrgId)
          .gte('created_at', cutoffDate)
          .order('created_at', { ascending: true }),
      ]);

      const devMap: Record<string, DeviceRecord> = {};
      devicesRes.data?.forEach((d) => {
        devMap[d.id] = d;
      });
      setDevices(devMap);
      setInteractions((interactionsRes.data as InteractionRecord[]) || []);

      const salesList = (salesRes.data as SaleRecord[]) || [];
      setSales(salesList);
      const salesExist = salesList.length > 0;
      setHasSalesData(salesExist);
      if (!salesExist) {
        setActiveTab('interactions');
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Aggregate daily sales data for AreaChart
  const salesChartData = useMemo(() => {
    const daysBack = timeRange === '7d' ? 7 : 30;
    const now = new Date();
    const map = new Map<string, { dateStr: string; displayDay: string; revenue: number; margin: number; orders: number }>();

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

  // Payment methods breakdown for pie chart
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
    const result: Record<string, { day: string; dateStr: string; nfc: number; qr: number; total: number }> = {};

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
  const nfcCount = useMemo(() => interactions.filter((i) => i.interaction_type === 'nfc').length, [interactions]);
  const qrCount = useMemo(() => interactions.filter((i) => i.interaction_type === 'qr').length, [interactions]);
  const totalCount = interactions.length;
  const nfcPercent = totalCount > 0 ? Math.round((nfcCount / totalCount) * 100) : 0;
  const qrPercent = totalCount > 0 ? Math.round((qrCount / totalCount) * 100) : 0;

  // Sales totals
  const totalSalesRevenue = useMemo(() => sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0), [sales]);
  const totalSalesMargin = useMemo(() => sales.reduce((acc, s) => acc + Number(s.gross_margin || 0), 0), [sales]);
  const avgBasket = useMemo(() => sales.length > 0 ? totalSalesRevenue / sales.length : 0, [sales, totalSalesRevenue]);
  const marginPercent = totalSalesRevenue > 0 ? (totalSalesMargin / totalSalesRevenue) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-800 rounded w-1/4" />
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[#121214] border border-[#27272A] rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-[#121214] border border-[#27272A] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl animate-in fade-in duration-200">
      {/* Header with period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white mb-1">
            Analytics & Reportistica
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Dati aggregati in tempo reale su vendite, marginalità, traffico NFC/QR e touchpoint.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeRange === '7d'
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-black shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Ultimi 7 Giorni
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeRange === '30d'
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-black shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Ultimi 30 Giorni
            </button>
          </div>

          <button
            onClick={loadAnalytics}
            title="Aggiorna dati"
            className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Sales vs Interactions */}
      <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-fit border border-zinc-200 dark:border-zinc-800">
        {hasSalesData && (
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'sales'
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-lime-500 dark:text-[#bfff00]" />
            <span>Vendite & Redditività</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('interactions')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'interactions'
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-2xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-500" />
          <span>Traffico Contactless NFC / QR ({totalCount})</span>
        </button>
      </div>

      {/* TAB 1: RETAIL SALES ANALYTICS */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Sales KPIs Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-zinc-500 font-medium">Fatturato Periodo</span>
              <div className="text-2xl font-bold font-mono text-zinc-950 dark:text-white mt-1">
                € {totalSalesRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                {sales.length} transazioni concluse
              </span>
            </div>

            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-zinc-500 font-medium">Margine Lordo Totale</span>
              <div className="text-2xl font-bold font-mono text-emerald-500 mt-1">
                € {totalSalesMargin.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">
                {marginPercent.toFixed(1)}% di redditività media
              </span>
            </div>

            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-zinc-500 font-medium">Scontrino Medio</span>
              <div className="text-2xl font-bold font-mono text-zinc-950 dark:text-white mt-1">
                € {avgBasket.toFixed(2)}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Importo medio speso per scontrino
              </span>
            </div>

            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-zinc-500 font-medium">Transazioni a Cassa</span>
              <div className="text-2xl font-bold font-mono text-lime-600 dark:text-[#bfff00] mt-1">
                {sales.length}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Scontrini emessi nel periodo
              </span>
            </div>
          </div>

          {/* Daily Sales & Margin Chart */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
              Evoluzione Giornaliera Fatturato & Margine Lordo
            </h2>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#bfff00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#bfff00" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.3} />
                  <XAxis dataKey="displayDay" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(v) => `€${v}`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-3 bg-zinc-950 text-white border border-zinc-800 rounded-xl shadow-xl text-xs space-y-1">
                            <div className="font-semibold text-zinc-400">{d.dateStr}</div>
                            <div className="font-mono text-[#bfff00]">Fatturato: €{d.revenue.toFixed(2)}</div>
                            <div className="font-mono text-emerald-400">Margine: €{d.margin.toFixed(2)}</div>
                            <div className="text-[10px] text-zinc-500">{d.orders} scontrini</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#bfff00" strokeWidth={2} fill="url(#revGrad)" name="Fatturato" />
                  <Area type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} fill="url(#marginGrad)" name="Margine" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Distribution */}
          {paymentBreakdown.length > 0 && (
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-3 max-w-lg">
              <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
                Ripartizione per Metodo di Pagamento
              </h2>
              <div className="space-y-2">
                {paymentBreakdown.map((pb, idx) => {
                  const pct = totalSalesRevenue > 0 ? (pb.value / totalSalesRevenue) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-zinc-700 dark:text-zinc-300">{pb.name}</span>
                        <span className="font-mono text-zinc-950 dark:text-white">€{pb.value.toFixed(2)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#bfff00] h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERACTION FLEET ANALYTICS */}
      {activeTab === 'interactions' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-zinc-500 font-medium">Totale Interazioni</span>
              <div className="text-2xl font-bold font-mono text-zinc-950 dark:text-white mt-1">
                {totalCount.toLocaleString('it-IT')}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">Volume complessivo</span>
            </div>

            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-zinc-500 font-medium">Tap NFC Fisici</span>
              <div className="text-2xl font-bold font-mono text-emerald-500 mt-1">
                {nfcCount.toLocaleString('it-IT')}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">{nfcPercent}% del totale</span>
            </div>

            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-zinc-500 font-medium">Scansioni QR Code</span>
              <div className="text-2xl font-bold font-mono text-blue-500 mt-1">
                {qrCount.toLocaleString('it-IT')}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">{qrPercent}% del totale</span>
            </div>

            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-zinc-500 font-medium">Dispositivi Attivi</span>
              <div className="text-2xl font-bold font-mono text-zinc-950 dark:text-white mt-1">
                {Object.keys(devices).length}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">Punti contatto fisici</span>
            </div>
          </div>

          {/* Interactions Area Chart */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
              Trend Temporale Interazioni
            </h2>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={interactionsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="nfcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="qrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.3} />
                  <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-3 bg-zinc-950 text-white border border-zinc-800 rounded-xl shadow-xl text-xs space-y-1">
                            <div className="font-semibold text-zinc-400">{d.dateStr}</div>
                            <div className="font-mono text-emerald-400">NFC: {d.nfc}</div>
                            <div className="font-mono text-blue-400">QR: {d.qr}</div>
                            <div className="font-bold">Totale: {d.total}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="nfc" stroke="#10b981" strokeWidth={2} fill="url(#nfcGrad)" name="NFC" />
                  <Area type="monotone" dataKey="qr" stroke="#3b82f6" strokeWidth={2} fill="url(#qrGrad)" name="QR Code" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

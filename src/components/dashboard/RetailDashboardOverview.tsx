'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Store, 
  ShoppingBag, 
  Boxes, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Banknote, 
  Users, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  BarChart3,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

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
      size: string | null;
      color: string | null;
      reorder_threshold: number;
      cost_price: number | null;
      sale_price: number | null;
      product: {
        id: string;
        name: string;
        brand: string | null;
        cost_price: number | null;
        sale_price: number | null;
      } | null;
    } | null;
  }>;
  customersCount: number;
  totalProductsCount: number;
}

export default function RetailDashboardOverview({
  orgName,
  businessType,
  sales,
  balances,
  customersCount,
  totalProductsCount,
}: RetailOverviewProps) {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('7d');

  // Filter sales by timeRange
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOf7d = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const startOf30d = now.getTime() - 30 * 24 * 60 * 60 * 1000;

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
      const c = b.variant?.cost_price || b.variant?.product?.cost_price || ((b.variant?.sale_price || b.variant?.product?.sale_price || 0) * 0.5);
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
    const map = new Map<string, { date: string; displayDate: string; revenue: number; orders: number }>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const displayDate = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
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
        const current = productMap.get(it.product_name) || { name: it.product_name, quantity: 0, revenue: 0 };
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Store Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            <Store className="w-3.5 h-3.5 text-lime-500 dark:text-[#bfff00]" />
            <span>
              {businessType === 'shoe_store' ? 'Footwear & Fashion OS' : 'Retail Commercial OS'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white flex items-center gap-2.5">
            <span>{orgName}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime-500/10 text-lime-600 dark:text-[#bfff00] border border-lime-500/20">
              Operativo
            </span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Panoramica vendite, andamento margini lordi, controllo scorte e registro transazioni.
          </p>
        </div>

        {/* Quick Actions Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/inventory"
            className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <Boxes className="w-4 h-4 text-zinc-500" />
            <span>Magazzino</span>
          </Link>

          <Link
            href="/dashboard/sales"
            className="inline-flex items-center gap-2 bg-[#bfff00] text-black px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#a8e600] transition-colors shadow-sm"
          >
            <Store className="w-4 h-4" />
            <span>Apri Punto Cassa POS</span>
          </Link>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-500">Periodo di Analisi:</span>
        <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900 text-xs">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1 rounded-lg transition-all ${
              timeRange === 'today'
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-bold shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Oggi
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 rounded-lg transition-all ${
              timeRange === '7d'
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-bold shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Ultimi 7 Giorni
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 rounded-lg transition-all ${
              timeRange === '30d'
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-bold shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Ultimi 30 Giorni
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Fatturato Vendite</span>
            <TrendingUp className="w-3.5 h-3.5 text-lime-500 dark:text-[#bfff00]" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 dark:text-white mt-1">
            € {kpis.revenue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            {kpis.transactionsCount} scontrini ({kpis.piecesSold} pezzi venduti)
          </span>
        </div>

        {/* Gross Margin */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Margine Lordo Stimato</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-500 mt-1">
            € {kpis.margin.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">
            {kpis.marginPercent.toFixed(1)}% sui ricavi netti
          </span>
        </div>

        {/* Average Basket */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Scontrino Medio</span>
            <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 dark:text-white mt-1">
            € {kpis.avgBasket.toFixed(2)}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Valore medio per cliente
          </span>
        </div>

        {/* Stock Alert */}
        <Link
          href="/dashboard/inventory"
          className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs hover:border-amber-500/40 transition-colors block"
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Varianti Sotto Scorta</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className={`text-2xl font-bold font-mono mt-1 ${kpis.lowStockCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {kpis.lowStockCount} varianti
          </div>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1 block">
            {kpis.lowStockCount > 0 ? 'Clicca per ordinare ai fornitori' : 'Scorte in ottimo stato'}
          </span>
        </Link>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
              Andamento Vendite (€)
            </h2>
            <p className="text-xs text-zinc-500">
              Evoluzione giornaliera del fatturato registrato a cassa
            </p>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="retailSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#bfff00" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#bfff00" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.3} />
              <XAxis dataKey="displayDate" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(v) => `€${v}`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-zinc-950 text-white border border-zinc-800 rounded-xl shadow-xl text-xs space-y-1">
                        <div className="font-semibold text-zinc-400">{data.date}</div>
                        <div className="font-mono font-bold text-[#bfff00]">
                          € {Number(data.revenue).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {data.orders} vendite completate
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#bfff00"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#retailSalesGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom 2 Columns: Top Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 5 Best Selling Products */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-lime-500 dark:text-[#bfff00]" />
              <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
                Articoli Più Venduti (Top 5)
              </h2>
            </div>
            <Link
              href="/dashboard/sales"
              className="text-xs font-semibold text-lime-600 dark:text-[#bfff00] hover:underline flex items-center gap-1"
            >
              <span>Tutte le vendite</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Nessuna vendita registrata in questo periodo.
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 font-mono font-bold flex items-center justify-center text-[10px] text-zinc-600 dark:text-zinc-300">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-zinc-950 dark:text-white truncate max-w-xs">
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-zinc-950 dark:text-white block">
                      € {p.revenue.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {p.quantity} pezzi venduti
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
                Alert Riordino Magazzino
              </h2>
            </div>
            <Link
              href="/dashboard/inventory"
              className="text-xs font-semibold text-amber-500 hover:underline flex items-center gap-1"
            >
              <span>Vedi tutto</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {criticalStockItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Nessun articolo attualmente sotto scorta. Ottimo lavoro!
              </div>
            ) : (
              criticalStockItems.map((b) => {
                const onHand = b.quantity_on_hand || 0;
                const p = b.variant?.product;
                const v = b.variant;

                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-zinc-950 dark:text-white">
                        {p?.name || 'Articolo'}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {p?.brand ? `${p.brand} • ` : ''}
                        Taglia {v?.size || 'U'} {v?.color ? `• ${v.color}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`font-mono font-bold block ${onHand === 0 ? 'text-rose-500' : 'text-amber-500'}`}>
                          {onHand === 0 ? 'Esaurito' : `${onHand} pz`}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Soglia: {v?.reorder_threshold ?? 2} pz
                        </span>
                      </div>
                      <Link
                        href="/dashboard/suppliers"
                        className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:text-black hover:bg-[#bfff00] transition-colors"
                        title="Ordina al fornitore"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
              Ultime Vendite Registrate a Cassa
            </h2>
          </div>
          <Link
            href="/dashboard/sales"
            className="text-xs font-semibold text-lime-600 dark:text-[#bfff00] hover:underline"
          >
            Apri Registro Completo →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Scontrino</th>
                <th className="px-4 py-3">Data e Ora</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Articoli</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3 text-right">Totale Incasso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                    Nessuna vendita registrata finora.
                  </td>
                </tr>
              ) : (
                recentSales.map((s) => {
                  const itemsCount = (s.items || []).reduce((acc, it) => acc + it.quantity, 0);

                  return (
                    <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-zinc-950 dark:text-white">
                        {s.sale_number}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(s.created_at).toLocaleString('it-IT')}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {s.customer_name || 'Cliente al banco'}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {itemsCount} pz ({(s.items || []).length} righe)
                      </td>
                      <td className="px-4 py-3 capitalize text-zinc-600 dark:text-zinc-300">
                        {s.payment_method === 'card'
                          ? 'Carta POS'
                          : s.payment_method === 'cash'
                          ? 'Contanti'
                          : s.payment_method === 'transfer'
                          ? 'Bonifico'
                          : 'Buono'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-zinc-950 dark:text-white">
                        € {Number(s.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

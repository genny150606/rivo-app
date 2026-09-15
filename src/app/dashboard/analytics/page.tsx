'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
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
  RefreshCw 
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

export default function AnalyticsPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [interactions, setInteractions] = useState<InteractionRecord[]>([]);
  const [devices, setDevices] = useState<Record<string, DeviceRecord>>({});

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
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

      // Fetch devices for mapping names
      const { data: devicesList } = await supabase
        .from('devices')
        .select('id, name, unique_code')
        .eq('organization_id', targetOrgId);

      const devMap: Record<string, DeviceRecord> = {};
      devicesList?.forEach((d) => {
        devMap[d.id] = d;
      });
      setDevices(devMap);

      // Date cutoff
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : 30;
      const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      const { data: interactionsData } = await supabase
        .from('interactions')
        .select('id, interaction_type, timestamp, device_id')
        .eq('organization_id', targetOrgId)
        .gte('timestamp', cutoffDate)
        .order('timestamp', { ascending: true });

      setInteractions((interactionsData as InteractionRecord[]) || []);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  // Aggregate daily data for AreaChart
  const chartData = useMemo(() => {
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

  // Aggregate channel breakdown
  const nfcCount = useMemo(() => interactions.filter((i) => i.interaction_type === 'nfc').length, [interactions]);
  const qrCount = useMemo(() => interactions.filter((i) => i.interaction_type === 'qr').length, [interactions]);
  const totalCount = interactions.length;
  const nfcPercent = totalCount > 0 ? Math.round((nfcCount / totalCount) * 100) : 0;
  const qrPercent = totalCount > 0 ? Math.round((qrCount / totalCount) * 100) : 0;

  // Aggregate hourly peak slots
  const hourlySlots = useMemo(() => {
    let lunch = 0; // 12:00 - 15:00
    let aperitivo = 0; // 18:00 - 21:00
    let dinner = 0; // 21:00 - 00:00
    let other = 0;

    interactions.forEach((item) => {
      const date = new Date(item.timestamp);
      const hour = date.getHours();
      if (hour >= 12 && hour < 15) lunch++;
      else if (hour >= 18 && hour < 21) aperitivo++;
      else if (hour >= 21 || hour < 1) dinner++;
      else other++;
    });

    return { lunch, aperitivo, dinner, other };
  }, [interactions]);

  // Top devices ranking
  const topDevices = useMemo(() => {
    const counts: Record<string, number> = {};
    interactions.forEach((i) => {
      if (i.device_id) {
        counts[i.device_id] = (counts[i.device_id] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([devId, count]) => ({
        device: devices[devId] || { name: 'Chip non identificato', unique_code: devId.substring(0, 8) },
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [interactions, devices]);

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
    <div className="space-y-6 sm:space-y-8 max-w-6xl">
      {/* Header with period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Analytics Dettagliati
          </h1>
          <p className="text-sm text-zinc-400">
            Dati aggregati in tempo reale su trend di utilizzo, fasce orarie e dispositivi più scansionati.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#18181B] p-1 rounded-xl border border-[#27272A] flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === '7d'
                  ? 'bg-[#BFFF00] text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ultimi 7 Giorni
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === '30d'
                  ? 'bg-[#BFFF00] text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ultimi 30 Giorni
            </button>
          </div>

          <button
            onClick={loadAnalytics}
            title="Aggiorna dati"
            className="p-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-400 hover:text-white transition-colors touch-press"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider truncate">Interazioni Totali</span>
              <TrendingUp className="w-4 h-4 text-[#BFFF00] shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{totalCount}</div>
          </div>
          <span className="text-[11px] text-zinc-500 mt-2 block">Nel periodo selezionato</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider truncate">NFC Touch</span>
              <Smartphone className="w-4 h-4 text-[#BFFF00] shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{nfcCount}</div>
          </div>
          <span className="text-[11px] text-[#BFFF00] font-medium mt-2 block">{nfcPercent}% del volume</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider truncate">Scansioni QR</span>
              <QrCode className="w-4 h-4 text-blue-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{qrCount}</div>
          </div>
          <span className="text-[11px] text-blue-400 font-medium mt-2 block">{qrPercent}% del volume</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-[#121214] border border-[#27272A] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider truncate">Fascia di Picco</span>
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <div className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight truncate">
              {hourlySlots.dinner >= hourlySlots.lunch && hourlySlots.dinner >= hourlySlots.aperitivo
                ? 'Cena (21-00)'
                : hourlySlots.aperitivo >= hourlySlots.lunch
                ? 'Aperitivo (18-21)'
                : 'Pranzo (12-15)'}
            </div>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium mt-2 block">Massima affluenza</span>
        </div>
      </div>

      {/* Main Trend Chart */}
      <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Trend Temporale Interazioni</h2>
            <p className="text-xs text-zinc-400">Distribuzione giornaliera tra tap NFC e inquadrature QR</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BFFF00]" />
              <span className="text-zinc-300">NFC Touch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-zinc-300">QR Code</span>
            </div>
          </div>
        </div>

        <div className="h-60 sm:h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNfc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#BFFF00" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#BFFF00" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorQr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                stroke="#52525b" 
                fontSize={11} 
                tickLine={false} 
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={11} 
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  borderColor: '#27272a', 
                  borderRadius: '12px', 
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="nfc" 
                name="NFC Touch"
                stroke="#BFFF00" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorNfc)" 
              />
              <Area 
                type="monotone" 
                dataKey="qr" 
                name="QR Code"
                stroke="#3b82f6" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorQr)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Breakdown & Top Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Channel Breakdown */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Rapporto Canali NFC vs QR</h2>
          <p className="text-xs text-zinc-400">Comportamento dei clienti con i supporti fisici RIVO</p>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#BFFF00]" /> NFC Touch
                </span>
                <span className="text-[#BFFF00] font-bold">{nfcPercent}% ({nfcCount})</span>
              </div>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#BFFF00] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${nfcPercent}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-blue-400" /> Scansione QR
                </span>
                <span className="text-blue-400 font-bold">{qrPercent}% ({qrCount})</span>
              </div>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${qrPercent}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#27272A] grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-[#18181B] rounded-xl border border-[#27272A]">
              <span className="text-zinc-500 block text-[11px]">Pranzo</span>
              <span className="font-bold text-white text-sm">{hourlySlots.lunch} tap</span>
            </div>
            <div className="p-2.5 bg-[#18181B] rounded-xl border border-[#27272A]">
              <span className="text-zinc-500 block text-[11px]">Aperitivo</span>
              <span className="font-bold text-white text-sm">{hourlySlots.aperitivo} tap</span>
            </div>
            <div className="p-2.5 bg-[#18181B] rounded-xl border border-[#27272A]">
              <span className="text-zinc-500 block text-[11px]">Cena</span>
              <span className="font-bold text-white text-sm">{hourlySlots.dinner} tap</span>
            </div>
          </div>
        </div>

        {/* Top Devices */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121214] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#BFFF00]" />
              <span>Chip Più Scansionati</span>
            </h2>
            <span className="text-xs text-zinc-500">Top performance</span>
          </div>

          {topDevices.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              Nessun dato dispositivo registrato in questo periodo.
            </div>
          ) : (
            <div className="divide-y divide-[#27272A] pt-1">
              {topDevices.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-xs font-bold text-[#BFFF00]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-white block">
                        {item.device.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {item.device.unique_code}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-white block">
                      {item.count}
                    </span>
                    <span className="text-[10px] text-zinc-500">interazioni</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

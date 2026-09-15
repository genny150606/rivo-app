'use client';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';
import { Activity, Smartphone, QrCode, TrendingUp } from 'lucide-react';

const mockWeeklyData = [
  { day: 'Lun', total: 12, nfc: 9, qr: 3 },
  { day: 'Mar', total: 19, nfc: 14, qr: 5 },
  { day: 'Mer', total: 15, nfc: 11, qr: 4 },
  { day: 'Gio', total: 24, nfc: 18, qr: 6 },
  { day: 'Ven', total: 38, nfc: 28, qr: 10 },
  { day: 'Sab', total: 54, nfc: 41, qr: 13 },
  { day: 'Dom', total: 42, nfc: 32, qr: 10 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Analytics Dettagliati</h1>
        <p className="text-sm text-zinc-400">
          Metriche approfondite su trend orari, canali di interazione e dispositivi più performanti.
        </p>
      </div>

      {/* Main Trend Chart */}
      <div className="rounded-xl border border-[#27272A] bg-[#121214] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Trend Settimanale Interazioni</h2>
            <p className="text-xs text-zinc-500">Volume giornaliero suddiviso tra tap NFC e scansioni QR</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BFFF00]" />
              <span className="text-zinc-300">NFC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-zinc-300">QR Code</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockWeeklyData}>
              <defs>
                <linearGradient id="colorNfc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#BFFF00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#BFFF00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="nfc" stroke="#BFFF00" strokeWidth={2} fillOpacity={1} fill="url(#colorNfc)" />
              <Area type="monotone" dataKey="qr" stroke="#3b82f6" strokeWidth={2} fillOpacity={0} fill="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly / Distribution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#27272A] bg-[#121214] p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Rapporto Canali</h2>
          <p className="text-xs text-zinc-500">Percentuale di coinvolgimento NFC rispetto a QR Code</p>
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300">NFC Touch</span>
                <span className="text-[#BFFF00] font-semibold">74%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-[#BFFF00] h-full rounded-full" style={{ width: '74%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300">Scansione QR</span>
                <span className="text-blue-400 font-semibold">26%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '26%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#27272A] bg-[#121214] p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Fasce Orarie di Picco</h2>
          <p className="text-xs text-zinc-500">I momenti della giornata con maggior coinvolgimento</p>
          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            <div className="bg-[#18181B] p-3 rounded-lg border border-[#27272A]">
              <span className="text-xs text-zinc-500 block">Pranzo</span>
              <span className="text-lg font-semibold text-white">12:30 - 14:30</span>
              <span className="text-xs text-emerald-400 block mt-1">+45% tap</span>
            </div>
            <div className="bg-[#18181B] p-3 rounded-lg border border-[#27272A]">
              <span className="text-xs text-zinc-500 block">Aperitivo</span>
              <span className="text-lg font-semibold text-white">18:30 - 20:30</span>
              <span className="text-xs text-emerald-400 block mt-1">+60% tap</span>
            </div>
            <div className="bg-[#18181B] p-3 rounded-lg border border-[#27272A]">
              <span className="text-xs text-zinc-500 block">Cena</span>
              <span className="text-lg font-semibold text-white">21:00 - 23:00</span>
              <span className="text-xs text-emerald-400 block mt-1">+85% tap</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

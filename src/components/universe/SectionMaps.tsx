'use client';

import { useState } from 'react';
import Link from 'next/link';
import { universeAudio } from './UniverseAudio';
import {
  MapPin,
  ExternalLink,
  Building2,
  Radio,
  ArrowRight,
} from 'lucide-react';

const VENUES = [
  {
    id: 'milano',
    name: 'Ristorante Terrazza Milano',
    address: 'Piazza del Duomo • Milano',
    touchpoints: 24,
    activeGuests: 68,
    occupancy: '88%',
    tables: [
      { id: 'T01', status: 'OCCUPATO', time: '42m' },
      { id: 'T02', status: 'CHIAMATA', time: '1m' },
      { id: 'T03', status: 'LIBERO', time: '-' },
      { id: 'T04', status: 'CONTO', time: '55m' },
      { id: 'T05', status: 'OCCUPATO', time: '28m' },
      { id: 'T06', status: 'OCCUPATO', time: '15m' },
    ],
  },
  {
    id: 'roma',
    name: 'Bistrot Roma Centro',
    address: 'Via del Corso • Roma',
    touchpoints: 16,
    activeGuests: 42,
    occupancy: '74%',
    tables: [
      { id: 'T01', status: 'OCCUPATO', time: '20m' },
      { id: 'T02', status: 'LIBERO', time: '-' },
      { id: 'T03', status: 'LIBERO', time: '-' },
      { id: 'T04', status: 'OCCUPATO', time: '48m' },
    ],
  },
  {
    id: 'firenze',
    name: 'Enoteca & Cantina Firenze',
    address: 'Ponte Vecchio • Firenze',
    touchpoints: 12,
    activeGuests: 36,
    occupancy: '92%',
    tables: [
      { id: 'T01', status: 'OCCUPATO', time: '60m' },
      { id: 'T02', status: 'CHIAMATA', time: '2m' },
      { id: 'T03', status: 'OCCUPATO', time: '35m' },
    ],
  },
];

export default function SectionMaps() {
  const [selectedVenueId, setSelectedVenueId] = useState<string>('milano');
  const venue = VENUES.find((v) => v.id === selectedVenueId) || VENUES[0];

  const handleSelect = (id: string) => {
    setSelectedVenueId(id);
    universeAudio.playClick();
    universeAudio.playLaserBeam();
  };

  return (
    <section
      id="maps"
      className="relative min-h-screen w-full py-28 px-4 sm:px-6 lg:px-8 flex flex-col justify-center border-t border-zinc-900/60"
    >
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-mono tracking-widest uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <span>WORLD 04 • MAPS & SPATIAL TOPOLOGY</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.03em] text-white font-['Space_Grotesk'] leading-tight">
            MULTI-LOCATION NETWORK & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#38BDF8]">
              REAL-TIME VENUE TOPOLOGY.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Mappa e monitora ogni sede fisica. Planimetrie dei tavoli in tempo reale, tassi di occupazione e tracciamento dei touchpoint attivi.
          </p>
        </div>

        {/* Symmetrical Dark Topology Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-zinc-950/80 border border-zinc-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          {/* Left: Venue Switcher */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1 text-left">
              SEDI FISICHE CONNESSE:
            </div>

            {VENUES.map((v) => {
              const isSelected = v.id === selectedVenueId;
              return (
                <div
                  key={v.id}
                  onClick={() => handleSelect(v.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-zinc-900 border-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.2)] translate-x-1'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white font-['Space_Grotesk']">{v.name}</span>
                    <span className="text-[10px] font-mono text-[#38BDF8] font-bold">{v.occupancy} OCC</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{v.address}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                    <span>{v.touchpoints} TOUCHPOINT NFC</span>
                    <span className="text-emerald-400 font-bold">{v.activeGuests} OSPITI ATTIVI</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Live Floorplan Matrix */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 text-xs font-mono">
              <span className="text-[#38BDF8] font-bold uppercase">
                PLANIMETRIA ATTIVA • {venue.name}
              </span>
              <span className="text-zinc-500">LIVE SYNC</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6">
              {venue.tables.map((tbl) => {
                let badgeColor = 'bg-zinc-800 text-zinc-300';
                if (tbl.status === 'OCCUPATO') badgeColor = 'bg-emerald-950 text-emerald-400 border border-emerald-800';
                if (tbl.status === 'CHIAMATA') badgeColor = 'bg-amber-950 text-amber-400 border border-amber-600 animate-pulse';
                if (tbl.status === 'CONTO') badgeColor = 'bg-cyan-950 text-cyan-400 border border-cyan-700';

                return (
                  <div
                    key={tbl.id}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-white">{tbl.id}</span>
                      <Radio size={12} className={tbl.status === 'CHIAMATA' ? 'text-amber-400 animate-spin' : 'text-zinc-600'} />
                    </div>
                    <div className="my-2">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                        {tbl.status}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      Permanenza: {tbl.time}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">PLANIMETRIA DIGITALE:</span>
              <Link
                href="/dashboard/tables"
                target="_blank"
                onClick={() => universeAudio.playClick()}
                className="text-[#38BDF8] hover:underline flex items-center gap-1 font-bold"
              >
                <span>Gestione Tavoli Dashboard</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

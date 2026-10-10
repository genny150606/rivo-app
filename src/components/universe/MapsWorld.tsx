'use client';

import { useState } from 'react';
import Link from 'next/link';
import { universeAudio } from './UniverseAudio';
import {
  MapPin,
  ExternalLink,
  Layers,
  Building2,
  Users,
  Radio,
  ArrowRight,
} from 'lucide-react';

interface MapsWorldProps {
  onClose: () => void;
}

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

export default function MapsWorld({ onClose }: MapsWorldProps) {
  const [selectedVenueId, setSelectedVenueId] = useState<string>('milano');
  const venue = VENUES.find((v) => v.id === selectedVenueId) || VENUES[0];

  const handleSelect = (id: string) => {
    setSelectedVenueId(id);
    universeAudio.playClick();
    universeAudio.playLaserBeam();
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl bg-zinc-950/95 border border-zinc-800 p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-white animate-in fade-in zoom-in-95 duration-300">
      
      {/* World Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-zinc-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8] uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            <span>WORLD 04 • SPATIAL TOPOLOGY & VENUES</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] mt-1">
            MULTI-LOCATION FOOTPRINT & REAL-TIME TABLES
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/locations"
            target="_blank"
            onClick={() => universeAudio.playClick()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white hover:border-[#38BDF8] transition-colors"
          >
            <span>APRI /dashboard/locations</span>
            <ExternalLink size={12} />
          </Link>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-full bg-zinc-900 text-xs font-mono text-zinc-400 hover:text-white border border-zinc-800"
          >
            CHIUDI MONDO [ESC]
          </button>
        </div>
      </div>

      {/* Symmetrical Dark Topology Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-6">
        
        {/* Left: Venue Selector list */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">
            SEDI FISICHE CONNESSE (MULTI-LOCATION):
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

        {/* Right: Live Floorplan Table Topology */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-left">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 text-xs font-mono">
            <span className="text-[#38BDF8] font-bold uppercase">
              MAPPA TAVOLI IN TEMPO REALE • {venue.name}
            </span>
            <span className="text-zinc-500">LIVE SYNC</span>
          </div>

          {/* Symmetrical Grid of Tables */}
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
            <span className="text-zinc-400">CONFIGURA PLANIMETRIA DIGITALE:</span>
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
  );
}

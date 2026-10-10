'use client';

import { useState } from 'react';
import Link from 'next/link';
import { universeAudio } from './UniverseAudio';
import {
  BellRing,
  Smartphone,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

interface ServiceTicket {
  id: string;
  table: string;
  type: string;
  assignedTo: string;
  status: 'PENDING' | 'ACCEPTED' | 'RESOLVED';
  timeAgo: string;
}

export default function SectionStaff() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([
    { id: 'SR-104', table: 'TAVOLO 04', type: 'Chiamata Cameriere', assignedTo: 'Marco R. (Smartwatch)', status: 'ACCEPTED', timeAgo: '35s fa' },
    { id: 'SR-103', table: 'TAVOLO 12', type: 'Richiesta Conto POS', assignedTo: 'Sara L. (Tablet Cassa)', status: 'PENDING', timeAgo: '12s fa' },
    { id: 'SR-102', table: 'TAVOLO 02', type: 'Ghiaccio & Acqua', assignedTo: 'Marco R.', status: 'RESOLVED', timeAgo: '3m fa' },
  ]);

  const handleSimulateCall = () => {
    universeAudio.playStaffAlert();
    const newId = `SR-${Math.floor(105 + Math.random() * 50)}`;
    const tableNum = `TAVOLO 0${Math.floor(1 + Math.random() * 8)}`;
    const newTicket: ServiceTicket = {
      id: newId,
      table: tableNum,
      type: 'Assistenza Ospite Tavolo',
      assignedTo: 'In assegnazione automatica...',
      status: 'PENDING',
      timeAgo: 'Adesso',
    };

    setTickets((prev) => [newTicket, ...prev.slice(0, 3)]);

    setTimeout(() => {
      setTickets((curr) =>
        curr.map((t) => (t.id === newId ? { ...t, assignedTo: 'Marco R. (Accettato)', status: 'ACCEPTED' } : t))
      );
      universeAudio.playClick();
    }, 1200);
  };

  return (
    <section
      id="staff"
      className="relative min-h-screen w-full py-28 px-4 sm:px-6 lg:px-8 flex flex-col justify-center border-t border-zinc-900/60"
    >
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-mono tracking-widest uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span>WORLD 05 • STAFF & OPERATIONS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.03em] text-white font-['Space_Grotesk'] leading-tight">
            SMART DISPATCH & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#F59E0B]">
              SERVICE WORKFLOW ROUTING.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Elimina le attese con la mano alzata. Ogni chiamata o richiesta di conto dal tavolo viene instradata direttamente allo smartwatch del cameriere competente.
          </p>
        </div>

        {/* Dispatch Simulator Container */}
        <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 mb-8 gap-4">
            <div className="text-left">
              <div className="text-xs font-bold text-white">Simulazione Interattiva Staff Dispatch</div>
              <div className="text-[11px] text-zinc-400">Genera una chiamata reale e osserva lo smistamento immediato al personale di sala.</div>
            </div>

            <button
              onClick={handleSimulateCall}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              <BellRing size={14} />
              <span>SIMULA CHIAMATA TAVOLO</span>
            </button>
          </div>

          {/* Ticket Feed */}
          <div className="space-y-3">
            {tickets.map((t) => {
              let badge = 'bg-amber-950 text-amber-400 border border-amber-600 animate-pulse';
              if (t.status === 'ACCEPTED') badge = 'bg-cyan-950 text-cyan-400 border border-cyan-700';
              if (t.status === 'RESOLVED') badge = 'bg-zinc-800 text-zinc-400';

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-400 font-mono text-xs font-bold">
                      {t.table.replace('TAVOLO ', 'T')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white font-['Space_Grotesk']">{t.table}</span>
                        <span className="text-zinc-500 text-xs font-mono">• {t.type}</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                        <Smartphone size={12} className="text-[#F59E0B]" />
                        <span>{t.assignedTo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-zinc-500">{t.timeAgo}</span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${badge}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 mt-6 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>TEMPO MEDIO DI RISOLUZIONE: 1M 14S</span>
            <Link
              href="/dashboard/service"
              target="_blank"
              onClick={() => universeAudio.playClick()}
              className="text-[#F59E0B] hover:underline flex items-center gap-1 font-bold"
            >
              <span>Accedi alla Coda Servizio Live</span>
              <ArrowRight size={13} />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}

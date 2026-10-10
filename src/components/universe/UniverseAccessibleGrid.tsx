'use client';

import { WorldId, WORLDS_CONFIG } from './UniverseScene';
import { universeAudio } from './UniverseAudio';
import { ArrowUpRight, Compass, Sparkles } from 'lucide-react';

interface UniverseAccessibleGridProps {
  onSelectWorld: (world: WorldId) => void;
  activeWorld: WorldId | null;
}

export default function UniverseAccessibleGrid({
  onSelectWorld,
  activeWorld,
}: UniverseAccessibleGridProps) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-24 select-none">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs font-mono tracking-widest uppercase mb-3">
          <Compass size={13} className="text-[#BFFF00]" />
          <span>ACCESSIBLE 2D SPATIAL INDEX</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white uppercase font-['Space_Grotesk'] tracking-tight">
          THE SIX RIVO WORLDS
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          Seleziona una destinazione per aprire l’ambiente operativo interattivo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {WORLDS_CONFIG.map((world, idx) => {
          const isCurrent = activeWorld === world.id;

          return (
            <div
              key={world.id}
              onClick={() => {
                universeAudio.playClick();
                universeAudio.playLaserBeam();
                onSelectWorld(world.id);
              }}
              className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                isCurrent
                  ? 'bg-zinc-900 border-[#BFFF00] shadow-[0_0_30px_rgba(191,255,0,0.3)] scale-[1.02]'
                  : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 pb-3 border-b border-zinc-800">
                  <span>WORLD 0{idx + 1}</span>
                  <span className="text-[#BFFF00]">{world.category}</span>
                </div>

                <h3 className="text-2xl font-black text-white font-['Space_Grotesk'] mt-4 flex items-center justify-between">
                  <span>{world.name}</span>
                  <ArrowUpRight size={18} className="text-zinc-600 group-hover:text-white" />
                </h3>

                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {world.tagline}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">SPEC:</span>
                <span className="text-zinc-300 font-bold">{world.metric}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

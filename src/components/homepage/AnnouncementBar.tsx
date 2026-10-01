'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-lime-500/10 border-b border-lime-500/20 py-2 px-4 relative flex items-center justify-center transition-all duration-300 ease-in-out">
      <div className="flex items-center gap-2 text-xs md:text-sm text-zinc-300">
        <span className="bg-lime-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
          RIVO
        </span>
        <span className="font-medium">La nuova generazione di customer experience per attività fisiche.</span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 md:right-4 text-lime-500/70 hover:text-lime-500 p-1.5 rounded-full hover:bg-lime-500/20 transition-colors"
        aria-label="Chiudi"
      >
        <X size={16} />
      </button>
    </div>
  );
}

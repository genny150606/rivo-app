'use client';

import { useSimpleMode } from '@/lib/simple-mode';
import { Sliders, Zap, Check } from 'lucide-react';

interface SimpleModeToggleProps {
  className?: string;
  showBadge?: boolean;
}

export default function SimpleModeToggle({ className = '', showBadge = true }: SimpleModeToggleProps) {
  const [isSimple, toggle] = useSimpleMode();

  return (
    <button
      type="button"
      onClick={() => toggle()}
      aria-label="Attiva o disattiva la modalità semplice gestionale"
      aria-pressed={isSimple}
      className={`group inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors select-none ${
        isSimple
          ? 'bg-zinc-900 border-emerald-500 text-emerald-400 dark:bg-zinc-100 dark:text-zinc-900 dark:border-emerald-600 shadow-xs'
          : 'bg-zinc-100 dark:bg-zinc-900/80 border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
      } ${className}`}
      title={isSimple ? 'Modalità semplice attiva (zero animazioni, stile ERP)' : 'Attiva la modalità semplice (zero animazioni, stile ERP)'}
    >
      {/* Switch Track */}
      <span
        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out ${
          isSimple ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-150 ease-in-out ${
            isSimple ? 'translate-x-3' : 'translate-x-0'
          }`}
        />
      </span>

      <span className="font-semibold tracking-tight text-[11px] sm:text-xs">
        Modalità Semplice
      </span>

      {showBadge && (
        <span
          className={`hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
            isSimple
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700'
          }`}
        >
          ERP
        </span>
      )}
    </button>
  );
}

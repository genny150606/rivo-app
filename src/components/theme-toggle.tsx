'use client';

import { useTheme } from './theme-provider';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      title={isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      className={`relative flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 touch-press select-none cursor-pointer ${
        showLabel
          ? 'w-full px-3.5 min-h-[44px] text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-[#18181B]/50'
          : 'p-2 min-h-[38px] min-w-[38px] justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-[#18181B] border border-zinc-200/80 dark:border-[#27272A]/80'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        <Sun
          className={`w-4 h-4 absolute transition-all duration-300 ${
            isDark
              ? 'rotate-90 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100 text-amber-500'
          }`}
        />
        <Moon
          className={`w-4 h-4 absolute transition-all duration-300 ${
            isDark
              ? 'rotate-0 scale-100 opacity-100 text-[#BFFF00]'
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>

      {showLabel && (
        <span className="truncate">
          {isDark ? 'Tema Chiaro' : 'Tema Scuro'}
        </span>
      )}
    </button>
  );
}

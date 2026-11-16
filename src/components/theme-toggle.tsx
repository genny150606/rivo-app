'use client';

import { useTheme } from './theme-provider';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/cn';

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
      aria-label={isDark ? 'Tema attuale: Scuro. Passa a Chiaro' : 'Tema attuale: Chiaro. Passa a Scuro'}
      aria-pressed={isDark}
      title={isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      className={cn(
        'relative flex items-center gap-2.5 rounded-lg text-xs font-medium transition-[background-color,border-color,color,transform] duration-[180ms] active:scale-95 select-none cursor-pointer',
        showLabel
          ? 'w-full px-3.5 min-h-[44px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
          : 'px-2.5 min-h-[38px] max-sm:min-h-[44px] min-w-[38px] max-sm:min-w-[44px] justify-center bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)]',
        className
      )}
    >
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        <Sun
          className={cn(
            'w-4 h-4 absolute transition-[transform,opacity] duration-200',
            isDark
              ? 'rotate-90 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100 text-[var(--accent-warning-text)]'
          )}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <Moon
          className={cn(
            'w-4 h-4 absolute transition-[transform,opacity] duration-200',
            isDark
              ? 'rotate-0 scale-100 opacity-100 text-[var(--rivo-volt-text)]'
              : '-rotate-90 scale-0 opacity-0'
          )}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>

      {showLabel ? (
        <span className="truncate font-medium">
          {isDark ? 'Passa a Tema Chiaro' : 'Passa a Tema Scuro'}
        </span>
      ) : (
        <span className="hidden xl:inline font-mono text-[11px] uppercase tracking-wider">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}

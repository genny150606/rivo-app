'use client';

import { useSimpleMode } from '@/lib/simple-mode';
import { cn } from '@/lib/cn';

interface SimpleModeToggleProps {
  className?: string;
  showBadge?: boolean;
}

export default function SimpleModeToggle({
  className = '',
  showBadge = true,
}: SimpleModeToggleProps) {
  const [isSimple, toggle] = useSimpleMode();

  return (
    <button
      type="button"
      onClick={() => toggle()}
      aria-label="Attiva o disattiva la modalità semplice gestionale"
      aria-pressed={isSimple}
      title={
        isSimple
          ? 'Modalità semplice attiva (zero animazioni, stile ERP)'
          : 'Attiva la modalità semplice (zero animazioni, stile ERP)'
      }
      className={cn(
        'group inline-flex min-h-[38px] max-sm:min-h-[44px] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium select-none cursor-pointer transition-[background-color,border-color,color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2',
        isSimple
          ? 'bg-[var(--bg-surface)] border-[var(--rivo-volt-border)] text-[var(--text-primary)]'
          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]',
        className
      )}
    >
      {/* Switch Track */}
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border p-0.5 transition-[background-color,border-color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          isSimple
            ? 'bg-[var(--rivo-volt)] border-[var(--rivo-volt-ink)]/20'
            : 'bg-[var(--bg-subtle)] border-[var(--border-strong)]'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-2.5 w-2.5 rounded-full transition-transform duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
            isSimple
              ? 'translate-x-3 bg-[var(--rivo-volt-ink)]'
              : 'translate-x-0 bg-[var(--text-muted)]'
          )}
        />
      </span>

      <span className="font-semibold tracking-tight text-[11px] sm:text-xs whitespace-nowrap">
        Modalità Semplice
      </span>

      {showBadge && (
        <span
          className={cn(
            'hidden sm:inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider leading-none',
            isSimple
              ? 'bg-[var(--rivo-volt)]/15 text-[var(--rivo-volt-text)] border-[var(--rivo-volt-border)]'
              : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
          )}
        >
          ERP
        </span>
      )}
    </button>
  );
}

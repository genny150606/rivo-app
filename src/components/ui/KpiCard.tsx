import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export type KpiTone =
  | 'neutral'
  | 'volt'
  | 'operational'
  | 'warning'
  | 'critical'
  | 'telemetry';

export interface KpiDelta {
  value: string;
  direction: 'up' | 'down' | 'flat';
  label?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: KpiTone;
  delta?: KpiDelta;
  context?: string;
  href?: string;
  onClick?: () => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const VALUE_TONE_CLASSES: Record<KpiTone, string> = {
  neutral: 'text-[var(--text-primary)]',
  volt: 'text-[var(--rivo-volt-text)]',
  operational: 'text-[var(--accent-operational-text)]',
  warning: 'text-[var(--accent-warning-text)]',
  critical: 'text-[var(--accent-critical-text)]',
  telemetry: 'text-[var(--accent-telemetry-text)]',
};

const ICON_TONE_CLASSES: Record<KpiTone, string> = {
  neutral: 'text-[var(--text-secondary)]',
  volt: 'text-[var(--rivo-volt-text)]',
  operational: 'text-[var(--accent-operational-text)]',
  warning: 'text-[var(--accent-warning-text)]',
  critical: 'text-[var(--accent-critical-text)]',
  telemetry: 'text-[var(--accent-telemetry-text)]',
};

/**
 * 3-tier operational telemetry KPI card with tabular numerals and WCAG-safe Light/Dark tone accents.
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  delta,
  context,
  href,
  onClick,
  loading = false,
  error = null,
  className,
}: KpiCardProps) {
  const interactive = Boolean(href || onClick);

  const shellClass = cn(
    'rounded-xl p-5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] min-w-0 text-left transition-[background-color,border-color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
    interactive && 'hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]/60 cursor-pointer',
    className
  );

  if (loading) {
    return (
      <div aria-busy="true" className={shellClass}>
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 w-24 rounded bg-[var(--bg-elevated)] animate-pulse motion-reduce:animate-none" />
          <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)] animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="mt-3 h-8 w-28 rounded bg-[var(--bg-elevated)] animate-pulse motion-reduce:animate-none" />
        <div className="mt-2.5 h-3.5 w-32 rounded bg-[var(--bg-elevated)] animate-pulse motion-reduce:animate-none" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(shellClass, 'border-[var(--accent-critical-border)]')}>
        <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] truncate">
          {label}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--accent-critical-text)]">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="truncate">{error}</span>
        </div>
      </div>
    );
  }

  const resolvedSentiment =
    delta?.sentiment ??
    (delta?.direction === 'up' ? 'positive' : delta?.direction === 'down' ? 'negative' : 'neutral');

  const deltaToneClass =
    resolvedSentiment === 'positive'
      ? 'text-[var(--accent-operational-text)]'
      : resolvedSentiment === 'negative'
      ? 'text-[var(--accent-critical-text)]'
      : 'text-[var(--text-secondary)]';

  const DeltaIcon =
    delta?.direction === 'up'
      ? TrendingUp
      : delta?.direction === 'down'
      ? TrendingDown
      : Minus;

  const content = (
    <>
      {/* Tier 1: Label + Optional Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] truncate">
          {label}
        </span>
        {Icon && (
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]',
              ICON_TONE_CLASSES[tone]
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Tier 2: Tabular Numeral Value */}
      <div
        className={cn(
          'mt-3 font-mono tabular-nums font-bold text-2xl sm:text-[28px] leading-none tracking-[-0.02em] truncate',
          VALUE_TONE_CLASSES[tone]
        )}
      >
        {value}
      </div>

      {/* Tier 3: Delta or Context */}
      {(delta || context) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs min-w-0">
          {delta && (
            <span className={cn('inline-flex items-center gap-1 font-mono tabular-nums font-semibold shrink-0', deltaToneClass)}>
              <DeltaIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>{delta.value}</span>
            </span>
          )}
          {(delta?.label || context) && (
            <span className="truncate text-[var(--text-secondary)]">
              {delta?.label ?? context}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn('block', shellClass)}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn('w-full', shellClass)}>
        {content}
      </button>
    );
  }

  return <div className={shellClass}>{content}</div>;
}

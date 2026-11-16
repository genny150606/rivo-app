import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  eyebrow?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  tone?: 'default' | 'error';
  compact?: boolean;
  className?: string;
}

function ActionButton({
  action,
  variant,
}: {
  action: EmptyStateAction;
  variant: 'primary' | 'secondary';
}) {
  const Icon = action.icon;
  const classes =
    variant === 'primary'
      ? 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--rivo-volt)] hover:bg-[var(--rivo-volt-hover)] px-4 text-xs font-bold text-[var(--rivo-volt-ink)] transition-[background-color,transform] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100'
      : 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] px-4 text-xs font-semibold text-[var(--text-primary)] transition-[background-color,border-color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

  const content = (
    <>
      {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
      <span>{action.label}</span>
    </>
  );

  if (action.href) {
    return (
      <Link href={action.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={classes}>
      {content}
    </button>
  );
}

/**
 * Architectural empty/error state panel with geometric icon frame and primary action guidance.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  eyebrow,
  primaryAction,
  secondaryAction,
  tone = 'default',
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'rounded-xl p-6' : 'rounded-2xl p-8 sm:p-10',
        tone === 'error'
          ? 'border border-solid border-[var(--accent-critical-border)] bg-[var(--accent-critical-bg)]'
          : 'border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]',
        className
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-11 w-11 items-center justify-center rounded-xl border',
          tone === 'error'
            ? 'border-[var(--accent-critical-border)] bg-[var(--bg-surface)] text-[var(--accent-critical-text)]'
            : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </div>

      {eyebrow && (
        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {eyebrow}
        </div>
      )}

      <h3 className="font-display text-base font-semibold tracking-tight text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
        {description}
      </p>

      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {primaryAction && <ActionButton action={primaryAction} variant="primary" />}
          {secondaryAction && <ActionButton action={secondaryAction} variant="secondary" />}
        </div>
      )}
    </div>
  );
}

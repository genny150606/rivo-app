import type { MouseEventHandler, ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SurfaceCardVariant =
  | 'default'
  | 'elevated'
  | 'subtle'
  | 'interactive'
  | 'warning'
  | 'critical';

export interface SurfaceCardHeaderConfig {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export interface SurfaceCardProps {
  children?: ReactNode;
  variant?: SurfaceCardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'xl' | '2xl';
  header?: SurfaceCardHeaderConfig;
  footer?: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  as?: 'div' | 'section' | 'article' | 'aside';
  className?: string;
}

const VARIANT_CLASSES: Record<SurfaceCardVariant, string> = {
  default: 'bg-[var(--bg-surface)] border-[var(--border-subtle)]',
  elevated: 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]',
  subtle: 'bg-[var(--bg-subtle)] border-transparent',
  interactive:
    'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]/60 cursor-pointer',
  warning: 'bg-[var(--bg-surface)] border-[var(--accent-warning-border)]',
  critical: 'bg-[var(--bg-surface)] border-[var(--accent-critical-border)]',
};

const PADDING_CLASSES: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

/**
 * Hairline-constructed RIVO panel supporting interactive semantics, loading skeletons, and inline error retry states.
 */
export function SurfaceCard({
  children,
  variant = 'default',
  padding = 'md',
  radius = 'xl',
  header,
  footer,
  href,
  onClick,
  disabled = false,
  loading = false,
  error = null,
  onRetry,
  as = 'div',
  className,
}: SurfaceCardProps) {
  const baseClass = cn(
    'border text-left transition-[background-color,border-color,transform] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
    radius === '2xl' ? 'rounded-2xl' : 'rounded-xl',
    VARIANT_CLASSES[variant],
    disabled && 'opacity-60 pointer-events-none',
    className
  );

  const HeaderIcon = header?.icon;

  const innerContent = loading ? (
    <div aria-busy="true" className={cn('space-y-3', PADDING_CLASSES[padding === 'none' ? 'md' : padding])}>
      <div className="h-3.5 w-32 rounded bg-[var(--bg-elevated)] animate-pulse motion-reduce:animate-none" />
      <div className="h-7 w-48 rounded bg-[var(--bg-elevated)] animate-pulse motion-reduce:animate-none" />
      <div className="h-24 w-full rounded-lg bg-[var(--bg-elevated)] animate-pulse motion-reduce:animate-none" />
    </div>
  ) : error ? (
    <div className={cn('flex items-start justify-between gap-3', PADDING_CLASSES[padding === 'none' ? 'md' : padding])}>
      <div className="flex items-start gap-2.5 text-sm text-[var(--accent-critical-text)]">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span>{error}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--accent-critical-border)] bg-[var(--accent-critical-bg)] px-3 text-xs font-semibold text-[var(--accent-critical-text)] hover:opacity-90 transition-opacity duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          <span>Riprova</span>
        </button>
      )}
    </div>
  ) : (
    <>
      {header && (
        <div
          className={cn(
            'flex items-start justify-between gap-3 border-b border-[var(--border-subtle)]',
            padding === 'none' ? 'px-5 py-4' : 'px-5 py-4'
          )}
        >
          <div className="flex items-start gap-3 min-w-0">
            {HeaderIcon && (
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                <HeaderIcon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              {header.eyebrow && (
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {header.eyebrow}
                </div>
              )}
              <h2 className="font-display text-sm sm:text-base font-semibold tracking-tight text-[var(--text-primary)] truncate">
                {header.title}
              </h2>
              {header.subtitle && (
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{header.subtitle}</p>
              )}
            </div>
          </div>
          {header.action && <div className="shrink-0">{header.action}</div>}
        </div>
      )}

      {children !== undefined && (
        <div className={cn(header ? (padding === 'none' ? '' : PADDING_CLASSES[padding]) : PADDING_CLASSES[padding])}>
          {children}
        </div>
      )}

      {footer && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 px-5 py-3 rounded-b-[inherit]">
          {footer}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn('block', baseClass)}>
        {innerContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={cn('w-full', baseClass)}>
        {innerContent}
      </button>
    );
  }

  const Tag = as;
  return <Tag className={baseClass}>{innerContent}</Tag>;
}

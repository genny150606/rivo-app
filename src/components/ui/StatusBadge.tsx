import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type StatusTone =
  | 'neutral'
  | 'volt'
  | 'operational'
  | 'warning'
  | 'critical'
  | 'telemetry';

export interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusTone;
  variant?: 'soft' | 'solid' | 'outline' | 'hardware';
  size?: 'sm' | 'md';
  shape?: 'pill' | 'tag';
  dot?: boolean;
  pulse?: boolean;
  icon?: LucideIcon;
  mono?: boolean;
  className?: string;
}

const SOFT_TONE_CLASSES: Record<StatusTone, string> = {
  neutral:
    'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  volt:
    'bg-[var(--rivo-volt-bg)] text-[var(--rivo-volt-text)] border-[var(--rivo-volt-border)]',
  operational:
    'bg-[var(--accent-operational-bg)] text-[var(--accent-operational-text)] border-[var(--accent-operational-border)]',
  warning:
    'bg-[var(--accent-warning-bg)] text-[var(--accent-warning-text)] border-[var(--accent-warning-border)]',
  critical:
    'bg-[var(--accent-critical-bg)] text-[var(--accent-critical-text)] border-[var(--accent-critical-border)]',
  telemetry:
    'bg-[var(--accent-telemetry-bg)] text-[var(--accent-telemetry-text)] border-[var(--accent-telemetry-border)]',
};

const SOLID_TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-transparent',
  volt: 'bg-[var(--rivo-volt)] text-[var(--rivo-volt-ink)] border-transparent',
  operational:
    'bg-[#047857] text-white dark:bg-[var(--accent-operational)] dark:text-[#09090B] border-transparent',
  warning:
    'bg-[#B45309] text-white dark:bg-[var(--accent-warning)] dark:text-[#09090B] border-transparent',
  critical: 'bg-[#B91C1C] text-white border-transparent',
  telemetry: 'bg-[#1D4ED8] text-white border-transparent',
};

const OUTLINE_TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-transparent text-[var(--text-secondary)] border-[var(--border-strong)]',
  volt: 'bg-transparent text-[var(--rivo-volt-text)] border-[var(--rivo-volt-border)]',
  operational:
    'bg-transparent text-[var(--accent-operational-text)] border-[var(--accent-operational-border)]',
  warning:
    'bg-transparent text-[var(--accent-warning-text)] border-[var(--accent-warning-border)]',
  critical:
    'bg-transparent text-[var(--accent-critical-text)] border-[var(--accent-critical-border)]',
  telemetry:
    'bg-transparent text-[var(--accent-telemetry-text)] border-[var(--accent-telemetry-border)]',
};

const DOT_TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-[var(--text-muted)]',
  volt: 'bg-[var(--rivo-volt)]',
  operational: 'bg-[var(--accent-operational)]',
  warning: 'bg-[var(--accent-warning)]',
  critical: 'bg-[var(--accent-critical)]',
  telemetry: 'bg-[var(--accent-telemetry)]',
};

/**
 * Semantic status pill or hardware identifier tag adapted for both Light and Dark mode WCAG contrast.
 */
export function StatusBadge({
  children,
  tone = 'neutral',
  variant = 'soft',
  size = 'sm',
  shape = 'pill',
  dot = false,
  pulse = false,
  icon: Icon,
  mono = true,
  className,
}: StatusBadgeProps) {
  let variantClass: string;
  if (variant === 'hardware') {
    variantClass =
      'bg-[#09090B] text-[#F4F4F6] border-[#22242A] dark:bg-[var(--bg-subtle)] dark:text-[var(--rivo-volt)] dark:border-[var(--rivo-volt-border)]';
  } else if (variant === 'solid') {
    variantClass = SOLID_TONE_CLASSES[tone];
  } else if (variant === 'outline') {
    variantClass = OUTLINE_TONE_CLASSES[tone];
  } else {
    variantClass = SOFT_TONE_CLASSES[tone];
  }

  return (
    <span
      className={cn(
        'inline-flex items-center border select-none shrink-0',
        shape === 'pill' ? 'rounded-full' : 'rounded-lg',
        size === 'sm' ? 'px-2 py-0.5 text-[10px] gap-1.5' : 'px-2.5 py-1 text-[11px] gap-1.5',
        mono
          ? 'font-mono tabular-nums uppercase tracking-[0.06em] font-medium'
          : 'font-sans font-semibold tracking-tight',
        variantClass,
        className
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          {pulse && (
            <span
              data-status-pulse="true"
              className={cn(
                'motion-reduce:hidden absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                variant === 'hardware' ? 'bg-[#BFFF00]' : DOT_TONE_CLASSES[tone]
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex h-1.5 w-1.5 rounded-full',
              variant === 'hardware' ? 'bg-[#BFFF00]' : DOT_TONE_CLASSES[tone]
            )}
          />
        </span>
      )}
      {Icon && <Icon className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
      <span className="truncate">{children}</span>
    </span>
  );
}

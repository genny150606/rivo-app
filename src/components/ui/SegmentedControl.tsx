'use client';

import type { KeyboardEvent } from 'react';
import { useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Keyboard-accessible segmented tablist with roving focus across ArrowLeft / ArrowRight / Home / End.
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  fullWidth = false,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const enabledIndices = options
      .map((opt, i) => (!opt.disabled && !disabled ? i : -1))
      .filter((i) => i !== -1);

    if (enabledIndices.length === 0) return;

    const currentPos = enabledIndices.indexOf(idx);
    let targetIdx: number | undefined;

    if (e.key === 'ArrowRight') {
      targetIdx = enabledIndices[(currentPos + 1) % enabledIndices.length];
    } else if (e.key === 'ArrowLeft') {
      targetIdx =
        enabledIndices[(currentPos - 1 + enabledIndices.length) % enabledIndices.length];
    } else if (e.key === 'Home') {
      targetIdx = enabledIndices[0];
    } else if (e.key === 'End') {
      targetIdx = enabledIndices[enabledIndices.length - 1];
    }

    if (targetIdx !== undefined) {
      e.preventDefault();
      onChange(options[targetIdx].value);
      buttonRefs.current[targetIdx]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] gap-1',
        fullWidth && 'w-full',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      {options.map((opt, index) => {
        const selected = opt.value === value;
        const isDisabled = disabled || Boolean(opt.disabled);
        const Icon = opt.icon;

        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium select-none cursor-pointer transition-[background-color,color,border-color,transform] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:active:scale-100',
              !isDisabled && 'active:scale-[0.98]',
              size === 'sm'
                ? 'min-h-[36px] max-sm:min-h-[44px] px-2.5 text-xs'
                : 'min-h-[40px] max-sm:min-h-[44px] px-3.5 text-xs sm:text-sm',
              fullWidth && 'flex-1',
              selected
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-2xs font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]/60 border border-transparent',
              isDisabled && 'opacity-45 cursor-not-allowed'
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
            <span className="truncate">{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={cn(
                  'rounded px-1.5 py-0.2 font-mono tabular-nums text-[10px] font-semibold transition-[background-color,color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                  selected
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

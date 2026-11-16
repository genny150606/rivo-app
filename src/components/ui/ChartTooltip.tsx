'use client';

import { formatItCurrency } from '@/lib/chart-theme';

interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  valueFormatter?: (value: number, name?: string) => string;
  currency?: boolean;
}

/**
 * Dual-mode Recharts tooltip styled on --bg-surface with tabular numerals.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  currency = false,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[160px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs shadow-lg">
      {label && (
        <div className="mb-1.5 border-b border-[var(--border-subtle)] pb-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
          {label}
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, idx) => {
          const numeric = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0);
          const formatted = valueFormatter
            ? valueFormatter(numeric, entry.name)
            : currency
            ? formatItCurrency(numeric)
            : new Intl.NumberFormat('it-IT').format(numeric);

          return (
            <div key={`${entry.dataKey ?? idx}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || 'var(--chart-series-primary)' }}
                />
                <span>{entry.name ?? 'Valore'}</span>
              </span>
              <span className="font-mono tabular-nums font-semibold text-[var(--text-primary)]">
                {formatted}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

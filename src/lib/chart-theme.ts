/**
 * Shared Recharts theme helpers adapting seamlessly across RIVO Light and Dark modes.
 */

export const RIVO_CHART_GRID = {
  strokeDasharray: '3 3',
  vertical: false,
  stroke: 'var(--chart-grid)',
  strokeOpacity: 1,
} as const;

export const RIVO_CHART_AXIS_TICK = {
  fill: 'var(--chart-axis)',
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
} as const;

export const RIVO_CHART_SERIES = {
  primary: 'var(--chart-series-primary)',
  secondary: 'var(--chart-series-secondary)',
  tertiary: 'var(--chart-series-tertiary)',
  operational: 'var(--chart-series-operational)',
  warning: 'var(--chart-series-warning)',
  critical: 'var(--chart-series-critical)',
} as const;

export function formatItCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('it-IT', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('it-IT').format(value);
}

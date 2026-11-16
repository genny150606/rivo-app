import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PageHeaderBreadcrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  eyebrowTone?: 'volt' | 'muted';
  badge?: ReactNode;
  breadcrumbs?: PageHeaderBreadcrumb[];
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  as?: 'h1' | 'h2';
  loading?: boolean;
  className?: string;
}

/**
 * Standardized enterprise PageHeader with optional mono eyebrow, breadcrumbs, status badge, and right-aligned actions.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  eyebrowTone = 'volt',
  badge,
  breadcrumbs,
  backHref,
  backLabel = 'Indietro',
  actions,
  meta,
  as = 'h1',
  loading = false,
  className,
}: PageHeaderProps) {
  if (loading) {
    return (
      <header
        aria-busy="true"
        className={cn(
          'border-b border-[var(--border-subtle)] pb-5 mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
          className
        )}
      >
        <div className="space-y-2.5 flex-1">
          <div className="h-3.5 w-28 rounded bg-[var(--bg-elevated)] animate-pulse motion-reduce:animate-none" />
          <div className="h-8 w-56 rounded-lg bg-[var(--bg-elevated)] animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-80 max-w-full rounded bg-[var(--bg-elevated)] animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-[var(--bg-elevated)] animate-pulse motion-reduce:animate-none shrink-0" />
      </header>
    );
  }

  const HeadingTag = as;

  return (
    <header
      className={cn(
        'border-b border-[var(--border-subtle)] pb-5 mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
        )}

        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <span key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-1.5">
                {idx > 0 && (
                  <ChevronRight
                    className="h-3 w-3 text-[var(--text-muted)]"
                    aria-hidden="true"
                  />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        {eyebrow && (
          <p
            className={cn(
              'font-mono text-[11px] uppercase tracking-[0.14em] font-medium',
              eyebrowTone === 'volt'
                ? 'text-[var(--rivo-volt-text)]'
                : 'text-[var(--text-muted)]'
            )}
          >
            {eyebrow}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <HeadingTag className="font-display font-bold text-2xl sm:text-[28px] leading-[1.15] tracking-[-0.025em] text-[var(--text-primary)] text-balance">
            {title}
          </HeadingTag>
          {badge}
        </div>

        {description && (
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed text-pretty">
            {description}
          </p>
        )}

        {meta && <div className="pt-1">{meta}</div>}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>
      )}
    </header>
  );
}

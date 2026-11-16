'use client';

import type { ReactNode } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { CornerDownLeft, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  group: string;
  href?: string;
  onSelect?: () => void;
  icon?: LucideIcon;
  keywords?: string[];
  shortcut?: string;
  badge?: string;
}

export interface CommandPaletteProps {
  items: CommandItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  footerSlot?: ReactNode;
  className?: string;
}

export interface CommandPaletteTriggerProps {
  onClick: () => void;
  label?: string;
  shortcutLabel?: string;
  className?: string;
}

/**
 * Interactive Cmd+K / Ctrl+K trigger pill for the RIVO command bar.
 */
export function CommandPaletteTrigger({
  onClick,
  label = 'Cerca o esegui azione…',
  shortcutLabel = '⌘K',
  className,
}: CommandPaletteTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Apri ricerca rapida (Comando K)"
      aria-haspopup="dialog"
      className={cn(
        'inline-flex min-h-[38px] max-sm:min-h-[44px] items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 text-xs text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-[background-color,border-color,color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none cursor-pointer',
        className
      )}
    >
      <span className="flex items-center gap-2 min-w-0">
        <Search className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" strokeWidth={1.75} aria-hidden="true" />
        <span className="truncate hidden sm:inline">{label}</span>
        <span className="truncate sm:hidden">Cerca</span>
      </span>
      <kbd className="hidden md:inline-flex items-center rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--text-muted)]">
        {shortcutLabel}
      </kbd>
    </button>
  );
}

/**
 * Keyboard-first global Command Palette (Cmd+K / Ctrl+K) following Raycast & Linear ergonomics.
 */
export function CommandPalette({
  items,
  open: controlledOpen,
  onOpenChange,
  placeholder = 'Cerca modulo, pagina o azione rapida…',
  emptyTitle = 'Nessun risultato trovato',
  emptyDescription = 'Prova a cercare un modulo (es. Vendite, Magazzino, NFC, Review).',
  footerSlot,
  className,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    if (controlledOpen === undefined) setInternalOpen(next);
  };

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const listId = useId();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    } else if (lastFocusedRef.current) {
      lastFocusedRef.current.focus?.();
      lastFocusedRef.current = null;
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = [
        item.label,
        item.description ?? '',
        item.group,
        ...(item.keywords ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const existing = map.get(item.group) ?? [];
      existing.push(item);
      map.set(item.group, existing);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flatFiltered = useMemo(() => grouped.flatMap(([, gItems]) => gItems), [grouped]);

  useEffect(() => {
    if (activeIndex >= flatFiltered.length) {
      setActiveIndex(0);
    }
  }, [flatFiltered.length, activeIndex]);

  const executeItem = (item: CommandItem) => {
    setOpen(false);
    if (item.onSelect) {
      item.onSelect();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  if (!open) return null;

  const activeItem = flatFiltered[activeIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ricerca rapida RIVO"
      className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--bg-backdrop)] backdrop-blur-sm px-4 pt-[10vh] sm:pt-[12vh] animate-backdrop-in motion-reduce:animate-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        className={cn(
          'w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl animate-panel-in motion-reduce:animate-none',
          className
        )}
      >
        {/* Search Header */}
        <div className="flex h-12 items-center gap-3 border-b border-[var(--border-subtle)] px-4">
          <Search
            className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={activeItem ? `cmd-opt-${activeItem.id}` : undefined}
            aria-label={placeholder}
            placeholder={placeholder}
            value={query}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) =>
                  flatFiltered.length > 0 ? (prev + 1) % flatFiltered.length : 0
                );
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) =>
                  flatFiltered.length > 0
                    ? (prev - 1 + flatFiltered.length) % flatFiltered.length
                    : 0
                );
              } else if (e.key === 'Enter' && activeItem) {
                e.preventDefault();
                executeItem(activeItem);
              }
            }}
            className="h-full w-full rounded px-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Cancella ricerca"
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-[background-color,color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-[background-color,color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          >
            ESC
          </button>
        </div>

        {/* Options List */}
        <div
          id={listId}
          role="listbox"
          className="max-h-[360px] overflow-y-auto overscroll-contain p-2 space-y-2"
        >
          {grouped.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="font-display text-sm font-semibold text-[var(--text-primary)]">
                {emptyTitle}
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{emptyDescription}</p>
            </div>
          ) : (
            grouped.map(([groupName, groupItems]) => (
              <div key={groupName}>
                <div className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {groupName}
                </div>
                <div className="space-y-0.5">
                  {groupItems.map((item) => {
                    const globalIdx = flatFiltered.findIndex((x) => x.id === item.id);
                    const selected = globalIdx === activeIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        id={`cmd-opt-${item.id}`}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        onClick={() => executeItem(item)}
                        className={cn(
                          'flex w-full min-h-[44px] items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-[background-color,color] duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none cursor-pointer',
                          selected
                            ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/60 hover:text-[var(--text-primary)]'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {Icon && (
                            <Icon
                              className={cn(
                                'h-4 w-4 shrink-0',
                                selected ? 'text-[var(--rivo-volt-text)]' : 'text-[var(--text-muted)]'
                              )}
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate">{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-[var(--text-muted)] truncate">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                              {item.badge}
                            </span>
                          )}
                          {item.shortcut && (
                            <kbd className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                              {item.shortcut}
                            </kbd>
                          )}
                          {selected && (
                            <CornerDownLeft
                              className="h-3.5 w-3.5 text-[var(--text-muted)]"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-4 py-2.5 font-mono text-[11px] text-[var(--text-muted)]">
          <span>↑↓ naviga • ↵ apri • ESC chiudi</span>
          {footerSlot}
        </div>
      </div>
    </div>
  );
}

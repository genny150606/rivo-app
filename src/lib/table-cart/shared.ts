/**
 * Collaborative Table Cart — shared types & pure helpers.
 * Used by the API route (/api/table-cart), the client hook and the UI.
 */

export interface TableCartGuest {
  id: string;
  guest_name: string;
  color: string;
  is_ready: boolean;
  ready_at: string | null;
  last_seen_at: string;
  created_at: string;
}

export interface TableCartItem {
  id: string;
  guest_id: string | null;
  dish_id: string;
  dish_name: string;
  unit_price: number;
  quantity: number;
  notes: string | null;
  is_shared: boolean;
  is_custom: boolean;
  status: 'draft' | 'sent';
  order_round: number | null;
  created_at: string;
}

export interface TableCartSession {
  id: string;
  organization_id: string;
  device_id: string | null;
  table_label: string;
  status: 'active' | 'closed';
  current_round: number;
  created_at: string;
}

export interface TableCartState {
  session: TableCartSession;
  guests: TableCartGuest[];
  items: TableCartItem[];
  me: TableCartGuest | null;
  serverTime: string;
}

/** A guest that has not polled the server for this long is considered away. */
export const GUEST_AWAY_AFTER_MS = 2 * 60 * 1000;
/** Sessions without activity for this long are closed and a new one is started. */
export const SESSION_IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000;
export const MAX_GUESTS_PER_SESSION = 20;
export const MAX_DRAFT_ITEMS_PER_SESSION = 150;
export const MAX_ITEM_QUANTITY = 20;
export const MAX_GUEST_NAME_LENGTH = 30;
export const MAX_ITEM_NOTES_LENGTH = 160;

export const GUEST_COLORS = [
  '#60a5fa', // blue
  '#c084fc', // purple
  '#34d399', // green
  '#fbbf24', // amber
  '#f472b6', // pink
  '#22d3ee', // cyan
  '#fb923c', // orange
  '#a3e635', // lime
  '#f87171', // red
  '#818cf8', // indigo
];

export function pickGuestColor(index: number): string {
  return GUEST_COLORS[((index % GUEST_COLORS.length) + GUEST_COLORS.length) % GUEST_COLORS.length];
}

/** Parses menu prices like "12,50 €", "€ 8.00", 9.5 → number (EUR). */
export function parsePrice(price: unknown): number {
  if (typeof price === 'number') return Number.isFinite(price) && price > 0 ? price : 0;
  if (typeof price !== 'string') return 0;
  const cleaned = price.replace(/[^0-9.,]/g, '');
  if (!cleaned) return 0;
  // "1.234,50" → "1234.50" ; "12,50" → "12.50" ; "12.50" → "12.50"
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const val = parseFloat(normalized);
  return Number.isFinite(val) && val > 0 ? val : 0;
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function isGuestAway(guest: Pick<TableCartGuest, 'last_seen_at'>, now: number = Date.now()): boolean {
  const seen = new Date(guest.last_seen_at).getTime();
  return !Number.isFinite(seen) || now - seen > GUEST_AWAY_AFTER_MS;
}

export interface GuestShare {
  guestId: string;
  name: string;
  color: string;
  personal: number;
  sharedQuota: number;
  total: number;
}

/**
 * Computes how much each guest owes for a set of items:
 * personal items go to their author, shared items are split evenly
 * among all guests of the table. Amounts are rounded to cents and the
 * rounding remainder of shared items is assigned to the first guests so
 * the sum of shares always equals the table total.
 */
export function computeGuestShares(
  items: Pick<TableCartItem, 'guest_id' | 'unit_price' | 'quantity' | 'is_shared'>[],
  guests: Pick<TableCartGuest, 'id' | 'guest_name' | 'color'>[]
): { shares: GuestShare[]; total: number; sharedTotal: number; unassigned: number } {
  const toCents = (v: number) => Math.round(v * 100);
  const guestIds = new Set(guests.map((g) => g.id));

  const personalCents = new Map<string, number>();
  let sharedCents = 0;
  let unassignedCents = 0;

  for (const item of items) {
    const line = toCents(item.unit_price) * item.quantity;
    if (item.is_shared) {
      sharedCents += line;
    } else if (item.guest_id && guestIds.has(item.guest_id)) {
      personalCents.set(item.guest_id, (personalCents.get(item.guest_id) || 0) + line);
    } else {
      // Author left the table: treat as shared so the bill still adds up
      unassignedCents += line;
    }
  }

  const splittable = sharedCents + unassignedCents;
  const n = guests.length;
  const base = n > 0 ? Math.floor(splittable / n) : 0;
  let remainder = n > 0 ? splittable - base * n : 0;

  const shares: GuestShare[] = guests.map((g) => {
    let quota = base;
    if (remainder > 0) {
      quota += 1;
      remainder -= 1;
    }
    const personal = personalCents.get(g.id) || 0;
    return {
      guestId: g.id,
      name: g.guest_name,
      color: g.color,
      personal: personal / 100,
      sharedQuota: quota / 100,
      total: (personal + quota) / 100,
    };
  });

  const totalCents =
    Array.from(personalCents.values()).reduce((a, b) => a + b, 0) + sharedCents + unassignedCents;

  return {
    shares,
    total: totalCents / 100,
    sharedTotal: sharedCents / 100,
    unassigned: unassignedCents / 100,
  };
}

export type ReadyCheckStatus =
  | { kind: 'empty' } // nothing in the draft cart
  | { kind: 'waiting'; ready: number; total: number; waitingFor: TableCartGuest[] }
  | { kind: 'all_ready'; total: number };

/**
 * Ready Check: the round can be sent only when every guest at the table
 * has confirmed. Guests who joined but never added anything still count:
 * everybody has to say "I'm ready".
 */
export function getReadyCheckStatus(
  guests: TableCartGuest[],
  draftItems: Pick<TableCartItem, 'status'>[]
): ReadyCheckStatus {
  if (draftItems.filter((i) => i.status === 'draft').length === 0) return { kind: 'empty' };
  const waitingFor = guests.filter((g) => !g.is_ready);
  if (waitingFor.length === 0 && guests.length > 0) return { kind: 'all_ready', total: guests.length };
  return { kind: 'waiting', ready: guests.length - waitingFor.length, total: guests.length, waitingFor };
}

/**
 * "Send without waiting": allowed only when at least 2 guests are ready
 * (or, at a table of 2, when the missing guest has gone away), so a single
 * person can never bypass the table.
 */
export function canForceSubmit(guests: TableCartGuest[], now: number = Date.now()): boolean {
  const ready = guests.filter((g) => g.is_ready);
  const notReady = guests.filter((g) => !g.is_ready);
  if (ready.length === 0 || notReady.length === 0) return false;
  if (ready.length >= 2) return true;
  return notReady.every((g) => isGuestAway(g, now));
}

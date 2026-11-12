import { describe, it, expect } from 'vitest';
import {
  computeGuestShares,
  getReadyCheckStatus,
  canForceSubmit,
  parsePrice,
  type TableCartGuest,
  type TableCartItem,
} from '@/lib/table-cart/shared';

describe('Collaborative Table Cart — Shared Logic & Ready Check', () => {
  const nowIso = new Date().toISOString();

  const guests: TableCartGuest[] = [
    { id: 'g1', guest_name: 'Marco', color: '#60a5fa', is_ready: true, ready_at: nowIso, last_seen_at: nowIso, created_at: nowIso },
    { id: 'g2', guest_name: 'Sara', color: '#c084fc', is_ready: true, ready_at: nowIso, last_seen_at: nowIso, created_at: nowIso },
    { id: 'g3', guest_name: 'Luca', color: '#34d399', is_ready: false, ready_at: null, last_seen_at: nowIso, created_at: nowIso },
  ];

  it('parses Italian and international menu prices accurately', () => {
    expect(parsePrice('14,50 €')).toBe(14.5);
    expect(parsePrice('€ 8.00')).toBe(8);
    expect(parsePrice(12)).toBe(12);
  });

  it('computes personal and shared quotas to the exact cent', () => {
    const items: Pick<TableCartItem, 'guest_id' | 'unit_price' | 'quantity' | 'is_shared'>[] = [
      { guest_id: 'g1', unit_price: 12, quantity: 1, is_shared: false }, // Marco: 12€
      { guest_id: 'g2', unit_price: 8.5, quantity: 1, is_shared: false }, // Sara: 8.50€
      { guest_id: 'g3', unit_price: 15, quantity: 1, is_shared: false }, // Luca: 15€
      { guest_id: 'g1', unit_price: 9, quantity: 1, is_shared: true }, // Tagliere al centro: 9€ / 3 = 3€ each
    ];

    const result = computeGuestShares(items, guests);
    expect(result.total).toBe(44.5);
    expect(result.sharedTotal).toBe(9);

    const marco = result.shares.find((s) => s.guestId === 'g1')!;
    const sara = result.shares.find((s) => s.guestId === 'g2')!;
    const luca = result.shares.find((s) => s.guestId === 'g3')!;

    expect(marco.personal).toBe(12);
    expect(marco.sharedQuota).toBe(3);
    expect(marco.total).toBe(15);

    expect(sara.total).toBe(11.5);
    expect(luca.total).toBe(18);
  });

  it('enforces unanimous Ready Check before returning all_ready', () => {
    const draft = [{ status: 'draft' as const }];

    const waiting = getReadyCheckStatus(guests, draft);
    expect(waiting.kind).toBe('waiting');
    if (waiting.kind === 'waiting') {
      expect(waiting.ready).toBe(2);
      expect(waiting.total).toBe(3);
      expect(waiting.waitingFor.map((g) => g.guest_name)).toEqual(['Luca']);
    }

    const allReadyGuests = guests.map((g) => ({ ...g, is_ready: true }));
    const unanimous = getReadyCheckStatus(allReadyGuests, draft);
    expect(unanimous).toEqual({ kind: 'all_ready', total: 3 });
  });

  it('allows force submit when at least 2 guests are ready and waiting on someone', () => {
    expect(canForceSubmit(guests)).toBe(true);
    const onlyOneReady = guests.map((g, idx) => ({ ...g, is_ready: idx === 0 }));
    expect(canForceSubmit(onlyOneReady)).toBe(false);
  });
});

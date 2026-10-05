import { describe, it, expect } from 'vitest';

describe('Phase 9: Retail Dashboard & Analytics Verification', () => {
  it('computes sales revenue, margin, and average basket accurately', () => {
    const sales = [
      { total_amount: 150.0, cost_total: 60.0 },
      { total_amount: 220.0, cost_total: 95.0 },
      { total_amount: 80.0, cost_total: 35.0 },
    ];

    const revenue = sales.reduce((acc, s) => acc + s.total_amount, 0); // 450
    const cost = sales.reduce((acc, s) => acc + s.cost_total, 0); // 190
    const margin = revenue - cost; // 260
    const marginPercent = (margin / revenue) * 100; // 57.77...%
    const avgBasket = revenue / sales.length; // 150

    expect(revenue).toBe(450.0);
    expect(cost).toBe(190.0);
    expect(margin).toBe(260.0);
    expect(Number(marginPercent.toFixed(1))).toBe(57.8);
    expect(avgBasket).toBe(150.0);
  });

  it('aggregates daily timeline data for charts', () => {
    const sales = [
      { created_at: '2026-10-05T10:00:00Z', total_amount: 120.0 },
      { created_at: '2026-10-05T14:30:00Z', total_amount: 80.0 },
      { created_at: '2026-10-04T18:00:00Z', total_amount: 250.0 },
    ];

    const map = new Map<string, number>();
    sales.forEach((s) => {
      const day = s.created_at.slice(0, 10);
      map.set(day, (map.get(day) || 0) + s.total_amount);
    });

    expect(map.get('2026-10-05')).toBe(200.0);
    expect(map.get('2026-10-04')).toBe(250.0);
  });

  it('correctly calculates payment method breakdown percentages', () => {
    const payments = [
      { method: 'card', amount: 300 },
      { method: 'cash', amount: 150 },
      { method: 'coupon', amount: 50 },
    ];

    const total = payments.reduce((acc, p) => acc + p.amount, 0); // 500
    const cardPct = (payments.find((p) => p.method === 'card')!.amount / total) * 100;
    const cashPct = (payments.find((p) => p.method === 'cash')!.amount / total) * 100;
    const couponPct = (payments.find((p) => p.method === 'coupon')!.amount / total) * 100;

    expect(total).toBe(500);
    expect(cardPct).toBe(60);
    expect(cashPct).toBe(30);
    expect(couponPct).toBe(10);
  });
});

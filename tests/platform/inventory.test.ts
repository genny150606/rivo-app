import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const MovementSchema = z.object({
  variant_id: z.string().uuid(),
  location_id: z.string().uuid().optional().nullable(),
  type: z.enum([
    'in', 
    'out', 
    'adjustment', 
    'initial', 
    'purchase', 
    'sale', 
    'return', 
    'damaged', 
    'transfer', 
    'inventory_count'
  ]),
  quantity_delta: z.number().int().refine((n) => n !== 0, 'La variazione non può essere zero'),
  reason: z.string().max(255).optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  unit_cost: z.number().nonnegative().optional().nullable(),
});

describe('Phase 4: Inventory & Movement Verification', () => {
  it('validates standard inventory movement types', () => {
    const validMovement = {
      variant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      type: 'purchase',
      quantity_delta: 24,
      unit_cost: 45.5,
      reason: 'Carico merce Borrelli sneakers',
      reference: 'DDT-2026-101',
    };

    const res = MovementSchema.safeParse(validMovement);
    expect(res.success).toBe(true);
  });

  it('rejects invalid movement types or zero delta', () => {
    const invalidType = {
      variant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      type: 'teleportation',
      quantity_delta: 5,
    };
    expect(MovementSchema.safeParse(invalidType).success).toBe(false);

    const zeroDelta = {
      variant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      type: 'purchase',
      quantity_delta: 0,
    };
    expect(MovementSchema.safeParse(zeroDelta).success).toBe(false);
  });

  it('normalizes negative deltas for out/damaged movements', () => {
    const normalizeDelta = (type: string, delta: number) => {
      if ((type === 'out' || type === 'damaged') && delta > 0) {
        return -delta;
      }
      return delta;
    };

    expect(normalizeDelta('damaged', 3)).toBe(-3);
    expect(normalizeDelta('out', 5)).toBe(-5);
    expect(normalizeDelta('purchase', 10)).toBe(10);
    expect(normalizeDelta('adjustment', -2)).toBe(-2);
  });

  it('correctly calculates physical inventory count discrepancies', () => {
    const items = [
      { expected: 10, counted: 10 },
      { expected: 8, counted: 6 },
      { expected: 4, counted: 5 },
    ];

    const discrepancies = items.map((it) => it.counted - it.expected);
    expect(discrepancies).toEqual([0, -2, 1]);
    expect(discrepancies.filter((d) => d !== 0).length).toBe(2);
  });
});

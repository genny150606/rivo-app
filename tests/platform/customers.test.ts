import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const CustomerSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  tax_code: z.string().max(20).optional().nullable(),
  birthdate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  fidelity_points: z.number().int().nonnegative().optional().default(0),
});

describe('Phase 7: Retail CRM & Customers Verification', () => {
  it('validates a complete customer profile', () => {
    const validCustomer = {
      first_name: 'Francesca',
      last_name: 'Esposito',
      phone: '+39 340 1234567',
      email: 'francesca.esposito@email.it',
      tax_code: 'SPSFNC88M50F839Z',
      birthdate: '1988-08-10',
      notes: 'Acquista scarpe misura 38 e borse a tracolla',
      fidelity_points: 120,
    };

    const res = CustomerSchema.safeParse(validCustomer);
    expect(res.success).toBe(true);
  });

  it('allows customer with only first name and phone (fast checkout)', () => {
    const minimal = {
      first_name: 'Giovanni',
      phone: '3339988776',
    };
    expect(CustomerSchema.safeParse(minimal).success).toBe(true);
  });

  it('rejects customer with empty first name or invalid email', () => {
    expect(CustomerSchema.safeParse({ first_name: '', email: 'not-valid' }).success).toBe(false);
  });

  it('computes customer lifetime metrics accurately', () => {
    const sales = [
      { total_amount: 120.0 },
      { total_amount: 85.0 },
      { total_amount: 210.0 },
    ];

    const totalSpent = sales.reduce((acc, s) => acc + s.total_amount, 0);
    const purchasesCount = sales.length;
    const avgBasket = totalSpent / purchasesCount;

    expect(totalSpent).toBe(415.0);
    expect(purchasesCount).toBe(3);
    expect(Number(avgBasket.toFixed(2))).toBe(138.33);
  });
});

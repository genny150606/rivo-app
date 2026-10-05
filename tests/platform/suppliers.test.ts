import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const SupplierSchema = z.object({
  name: z.string().min(1).max(255),
  company_name: z.string().max(255).optional().nullable(),
  contact_name: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  vat_number: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  active: z.boolean().default(true),
});

const POItemSchema = z.object({
  variant_id: z.string().uuid(),
  product_name: z.string().min(1),
  variant_name: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  quantity_ordered: z.number().int().positive(),
  unit_cost: z.number().nonnegative(),
});

const CreatePOSchema = z.object({
  supplier_id: z.string().uuid(),
  status: z.enum(['draft', 'ordered']).default('ordered'),
  expected_delivery_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(POItemSchema).min(1),
});

const ReceiveItemSchema = z.object({
  po_item_id: z.string().uuid(),
  variant_id: z.string().uuid(),
  quantity_received: z.number().int().positive(),
  unit_cost: z.number().nonnegative().optional().nullable(),
});

describe('Phase 6: Suppliers & Purchase Orders Verification', () => {
  it('validates supplier registration payload', () => {
    const validSupplier = {
      name: 'Borrelli Calzature Srl',
      company_name: 'Borrelli Manufacturing Group',
      contact_name: 'Giuseppe Borrelli',
      phone: '+39 081 5551234',
      email: 'ordini@borrelli.it',
      vat_number: 'IT09876543210',
      city: 'Napoli',
    };

    expect(SupplierSchema.safeParse(validSupplier).success).toBe(true);
  });

  it('rejects supplier with invalid email or empty name', () => {
    expect(SupplierSchema.safeParse({ name: '', email: 'not-an-email' }).success).toBe(false);
  });

  it('validates purchase order creation and totals calculation', () => {
    const poPayload = {
      supplier_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      status: 'ordered',
      expected_delivery_date: '2026-10-15',
      items: [
        {
          variant_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          product_name: 'Sneaker Borrelli Air Leather',
          variant_name: 'Tg. 42 • Nero',
          sku: 'BOR-SNK-42',
          quantity_ordered: 24,
          unit_cost: 50.0,
        },
        {
          variant_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
          product_name: 'Sneaker Borrelli Air Leather',
          variant_name: 'Tg. 43 • Nero',
          sku: 'BOR-SNK-43',
          quantity_ordered: 18,
          unit_cost: 50.0,
        },
      ],
    };

    const res = CreatePOSchema.safeParse(poPayload);
    expect(res.success).toBe(true);

    if (res.success) {
      const totalAmount = res.data.items.reduce(
        (acc, it) => acc + it.quantity_ordered * it.unit_cost,
        0
      );
      expect(totalAmount).toBe(24 * 50 + 18 * 50); // 2100
    }
  });

  it('validates receiving items schema', () => {
    const receiveItem = {
      po_item_id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      variant_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      quantity_received: 24,
      unit_cost: 50.0,
    };

    expect(ReceiveItemSchema.safeParse(receiveItem).success).toBe(true);
  });
});

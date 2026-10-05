import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const SaleItemSchema = z.object({
  variant_id: z.string().uuid().optional().nullable(),
  product_id: z.string().uuid().optional().nullable(),
  product_name: z.string().min(1),
  variant_name: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  cost_price: z.number().nonnegative().optional().nullable(),
  discount_amount: z.number().nonnegative().optional().default(0),
  tax_rate: z.number().nonnegative().optional().default(22),
});

const CompleteSaleSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid().optional().nullable(),
  payment_method: z.enum(['cash', 'card', 'transfer', 'mixed', 'coupon']),
  discount_amount: z.number().nonnegative().optional().default(0),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(SaleItemSchema).min(1),
});

const ReturnItemSchema = z.object({
  sale_item_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  quantity: z.number().int().positive(),
  refund_unit_price: z.number().nonnegative(),
  restock: z.boolean().default(true),
});

const ProcessReturnSchema = z.object({
  sale_id: z.string().uuid(),
  location_id: z.string().uuid().optional().nullable(),
  refund_method: z.enum(['cash', 'card', 'coupon', 'exchange']),
  reason: z.string().max(255).optional().nullable(),
  return_items: z.array(ReturnItemSchema).min(1),
});

describe('Phase 5: Retail Sales (POS) & Returns Verification', () => {
  it('validates a complete sale payload with multi-item cart', () => {
    const salePayload = {
      customer_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      payment_method: 'card',
      discount_amount: 10,
      items: [
        {
          product_name: 'Sneaker Borrelli Air Leather',
          variant_name: 'Tg. 42 • Nero',
          sku: 'BOR-SNK-42',
          quantity: 1,
          unit_price: 120.0,
          cost_price: 55.0,
          discount_amount: 0,
          tax_rate: 22,
        },
        {
          product_name: 'Cintura in Pelle Artigianale',
          variant_name: 'M • Marrone',
          sku: 'BOR-BLT-M',
          quantity: 2,
          unit_price: 45.0,
          cost_price: 18.0,
          discount_amount: 5,
          tax_rate: 22,
        },
      ],
    };

    const result = CompleteSaleSchema.safeParse(salePayload);
    expect(result.success).toBe(true);
  });

  it('rejects empty sales carts or negative prices', () => {
    const emptySale = {
      payment_method: 'cash',
      items: [],
    };
    expect(CompleteSaleSchema.safeParse(emptySale).success).toBe(false);

    const negativePriceSale = {
      payment_method: 'cash',
      items: [
        {
          product_name: 'Scarpa',
          quantity: 1,
          unit_price: -50,
        },
      ],
    };
    expect(CompleteSaleSchema.safeParse(negativePriceSale).success).toBe(false);
  });

  it('computes VAT and Gross Margin accurately', () => {
    const items = [
      { unit_price: 100, cost_price: 40, quantity: 1, discount: 0 },
      { unit_price: 50, cost_price: 20, quantity: 2, discount: 10 },
    ];
    const totalDiscount = 5;

    let subtotal = 0;
    let costTotal = 0;
    for (const it of items) {
      subtotal += it.unit_price * it.quantity - it.discount;
      costTotal += it.cost_price * it.quantity;
    }

    const finalTotal = subtotal - totalDiscount; // (100 + 90) - 5 = 185
    expect(finalTotal).toBe(185);

    // VAT 22% scorporo
    const netTotal = finalTotal / 1.22;
    const vat = finalTotal - netTotal;
    expect(Number(vat.toFixed(2))).toBe(33.36);

    // Gross Margin = FinalTotal - CostTotal
    const grossMargin = finalTotal - costTotal; // 185 - (40 + 40) = 105
    expect(grossMargin).toBe(105);
  });

  it('calculates cash tendered and change accurately', () => {
    const total = 74.5;
    const tendered = 100.0;
    const change = Math.max(0, tendered - total);
    expect(Number(change.toFixed(2))).toBe(25.5);
  });

  it('validates return payload with restock flag', () => {
    const returnPayload = {
      sale_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      refund_method: 'cash',
      reason: 'Cambio taglia da 42 a 43',
      return_items: [
        {
          sale_item_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          quantity: 1,
          refund_unit_price: 120.0,
          restock: true,
        },
      ],
    };

    const res = ProcessReturnSchema.safeParse(returnPayload);
    expect(res.success).toBe(true);
  });
});

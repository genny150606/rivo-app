import { describe, it, expect } from 'vitest';
import { 
  CreateProductSchema, 
  CreateCategorySchema, 
  CreateBrandSchema, 
  CreateSupplierSchema, 
  CreateCustomerSchema,
  CompleteSaleSchema,
  RecordMovementSchema 
} from '@/platform/retail/types';

describe('Retail Domain Zod Schemas Validation', () => {
  it('validates a correct shoe product with multiple size variants', () => {
    const validShoe = {
      name: 'Nike Air Max 95',
      brand: 'Nike',
      category_name: 'Sneakers',
      sale_price: 189.90,
      cost_price: 95.00,
      tax_rate: 22.00,
      status: 'active' as const,
      attribute_keys: ['size', 'color'],
      variants: [
        {
          size: '41',
          color: 'Nero',
          attributes: { size: '41', color: 'Nero', season: 'FW26' },
          barcode: '8051234567890',
          sku: 'NK-AM95-BLK-41',
          initial_stock: 5,
        },
        {
          size: '42',
          color: 'Nero',
          attributes: { size: '42', color: 'Nero', season: 'FW26' },
          barcode: '8051234567891',
          sku: 'NK-AM95-BLK-42',
          initial_stock: 8,
        },
      ],
    };

    const parsed = CreateProductSchema.safeParse(validShoe);
    expect(parsed.success).toBe(true);
  });

  it('rejects product without variants', () => {
    const invalidProduct = {
      name: 'Scarpa Elegante',
      sale_price: 120.00,
      variants: [],
    };

    const parsed = CreateProductSchema.safeParse(invalidProduct);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toContain('almeno una variante');
    }
  });

  it('validates retail categories and brands', () => {
    const cat = CreateCategorySchema.safeParse({
      name: 'Calzature Uomo',
      sort_order: 1,
    });
    expect(cat.success).toBe(true);

    const brand = CreateBrandSchema.safeParse({
      name: 'Gucci',
      description: 'Alta moda e pelletteria',
    });
    expect(brand.success).toBe(true);
  });

  it('validates customers and suppliers', () => {
    const customer = CreateCustomerSchema.safeParse({
      first_name: 'Mario',
      last_name: 'Rossi',
      phone: '+39 333 1234567',
      email: 'mario.rossi@example.com',
      tax_code: 'RSSMRA85M01H501Z',
    });
    expect(customer.success).toBe(true);

    const supplier = CreateSupplierSchema.safeParse({
      name: 'Distribuzione Calzature Campania',
      vat_number: 'IT12345678901',
      phone: '081 5551234',
    });
    expect(supplier.success).toBe(true);
  });

  it('validates a complete POS sale payload', () => {
    const salePayload = {
      payment_method: 'card' as const,
      discount_amount: 10.00,
      items: [
        {
          product_name: 'Nike Air Max 95',
          variant_name: 'Taglia 42 / Nero',
          sku: 'NK-AM95-BLK-42',
          quantity: 1,
          unit_price: 189.90,
          cost_price: 95.00,
          discount_amount: 10.00,
          tax_rate: 22.00,
        },
      ],
    };

    const parsed = CompleteSaleSchema.safeParse(salePayload);
    expect(parsed.success).toBe(true);
  });

  it('rejects sale with zero or negative item quantity', () => {
    const invalidSale = {
      payment_method: 'cash' as const,
      items: [
        {
          product_name: 'Mocassino Pelle',
          quantity: 0,
          unit_price: 110.00,
        },
      ],
    };

    const parsed = CompleteSaleSchema.safeParse(invalidSale);
    expect(parsed.success).toBe(false);
  });

  it('validates inventory movement payload', () => {
    const movement = RecordMovementSchema.safeParse({
      variant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      type: 'purchase',
      quantity_delta: 12,
      reason: 'Carico merce DDT 450',
      unit_cost: 45.00,
    });
    expect(movement.success).toBe(true);
  });
});

import { z } from 'zod';

export interface ProductCategory {
  id: string;
  organization_id: string;
  parent_id?: string | null;
  name: string;
  slug?: string | null;
  description?: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  organization_id: string;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  company_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  vat_number?: string | null;
  notes?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  first_name: string;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  tax_code?: string | null;
  birthdate?: string | null;
  notes?: string | null;
  total_spent: number;
  purchases_count: number;
  fidelity_points?: number;
  last_purchase_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  organization_id: string;
  product_id: string;
  sku?: string | null;
  barcode?: string | null;
  size?: string | null;
  color?: string | null;
  attributes: Record<string, string>;
  cost_price?: number | null;
  sale_price?: number | null;
  minimum_stock: number;
  reorder_threshold: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  quantity_on_hand?: number;
}

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  brand?: string | null;
  brand_id?: string | null;
  brand_obj?: { id: string; name: string; logo_url?: string | null } | null;
  category_name?: string | null;
  category_id?: string | null;
  category?: { id: string; name: string } | null;
  supplier_id?: string | null;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  cost_price?: number | null;
  sale_price: number;
  tax_rate: number;
  status: 'active' | 'archived' | 'draft';
  image_url?: string | null;
  attribute_keys: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
  total_stock?: number;
}

export interface InventoryMovement {
  id: string;
  organization_id: string;
  variant_id: string;
  location_id?: string | null;
  type: 'purchase' | 'sale' | 'return' | 'adjustment' | 'damaged' | 'transfer' | 'inventory_count' | 'initial';
  quantity_delta: number;
  quantity_after?: number | null;
  unit_cost?: number | null;
  reason?: string | null;
  reference?: string | null;
  reference_id?: string | null;
  reference_type?: string | null;
  created_by?: string | null;
  created_at: string;
  variant?: ProductVariant;
  product?: Product;
}

export interface InventoryBalance {
  id: string;
  organization_id: string;
  variant_id: string;
  location_id?: string | null;
  quantity_on_hand: number;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  organization_id: string;
  product_id?: string | null;
  variant_id?: string | null;
  product_name: string;
  variant_name?: string | null;
  sku?: string | null;
  barcode?: string | null;
  quantity: number;
  unit_price: number;
  cost_price?: number | null;
  discount_amount: number;
  tax_rate: number;
  total_price: number;
  returned_quantity: number;
  created_at: string;
}

export interface SalePayment {
  id: string;
  sale_id: string;
  organization_id: string;
  method: 'cash' | 'card' | 'bank_transfer' | 'other';
  amount: number;
  reference?: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  organization_id: string;
  location_id?: string | null;
  sale_number: string;
  customer_id?: string | null;
  operator_id?: string | null;
  operator_name?: string | null;
  status: 'completed' | 'refunded' | 'partial_refund' | 'cancelled';
  subtotal: number;
  discount_amount: number;
  discount_percent?: number | null;
  tax_amount: number;
  total_amount: number;
  cost_total?: number | null;
  gross_margin?: number | null;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'split' | 'other';
  payment_status: 'paid' | 'pending' | 'refunded';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items?: SaleItem[];
  payments?: SalePayment[];
  customer?: Customer;
}

export interface SaleReturnItem {
  id: string;
  return_id: string;
  organization_id: string;
  sale_item_id: string;
  variant_id?: string | null;
  quantity: number;
  refund_unit_price: number;
  restock: boolean;
  created_at: string;
}

export interface SaleReturn {
  id: string;
  organization_id: string;
  sale_id: string;
  return_number: string;
  refund_amount: number;
  refund_method: string;
  reason?: string | null;
  created_by?: string | null;
  created_at: string;
  items?: SaleReturnItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  organization_id: string;
  product_id?: string | null;
  variant_id?: string | null;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
  variant?: ProductVariant;
  product?: Product;
}

export interface PurchaseOrder {
  id: string;
  organization_id: string;
  supplier_id?: string | null;
  location_id?: string | null;
  order_number: string;
  status: 'draft' | 'submitted' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  notes?: string | null;
  total_amount: number;
  ordered_at?: string | null;
  expected_at?: string | null;
  received_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Il nome della categoria è obbligatorio').max(100),
  parent_id: z.string().uuid().nullable().optional(),
  description: z.string().max(500).optional(),
  sort_order: z.number().int().default(0),
});

export const CreateBrandSchema = z.object({
  name: z.string().min(1, 'Il nome del brand è obbligatorio').max(100),
  description: z.string().max(500).optional(),
  logo_url: z.string().url().nullable().optional(),
});

export const CreateSupplierSchema = z.object({
  name: z.string().min(1, 'Il nome fornitore è obbligatorio').max(150),
  company_name: z.string().max(150).optional(),
  contact_name: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  vat_number: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateCustomerSchema = z.object({
  first_name: z.string().min(1, 'Nome obbligatorio').max(100),
  last_name: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  tax_code: z.string().max(50).optional(),
  birthdate: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateVariantSchema = z.object({
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  attributes: z.record(z.string(), z.string()).default({}),
  cost_price: z.number().nonnegative().optional(),
  sale_price: z.number().nonnegative().optional(),
  reorder_threshold: z.number().int().default(3),
  minimum_stock: z.number().int().default(1),
  initial_stock: z.number().int().default(0),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Nome articolo obbligatorio').max(255),
  brand_id: z.string().uuid().nullable().optional(),
  brand: z.string().max(100).optional(),
  category_id: z.string().uuid().nullable().optional(),
  category_name: z.string().max(100).optional(),
  supplier_id: z.string().uuid().nullable().optional(),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  description: z.string().optional(),
  cost_price: z.number().nonnegative().optional(),
  sale_price: z.number().nonnegative('Prezzo di vendita non valido'),
  tax_rate: z.number().default(22.00),
  status: z.enum(['active', 'archived', 'draft']).default('active'),
  image_url: z.string().url().nullable().optional(),
  attribute_keys: z.array(z.string()).default(['size', 'color']),
  variants: z.array(CreateVariantSchema).min(1, 'Inserire almeno una variante/taglia'),
});

export const RecordMovementSchema = z.object({
  variant_id: z.string().uuid('ID variante non valido'),
  location_id: z.string().uuid().nullable().optional(),
  type: z.enum(['purchase', 'sale', 'return', 'adjustment', 'damaged', 'transfer', 'inventory_count', 'initial']),
  quantity_delta: z.number().int('La quantità deve essere un intero'),
  reason: z.string().max(255).optional(),
  reference: z.string().max(100).optional(),
  unit_cost: z.number().nonnegative().optional(),
});

export const CreateSaleItemSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  variant_id: z.string().uuid().nullable().optional(),
  product_name: z.string().min(1),
  variant_name: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  quantity: z.number().int().positive('Quantità minima 1'),
  unit_price: z.number().nonnegative('Prezzo non valido'),
  cost_price: z.number().nonnegative().optional(),
  discount_amount: z.number().nonnegative().default(0),
  tax_rate: z.number().default(22.00),
});

export const CompleteSaleSchema = z.object({
  location_id: z.string().uuid().nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  operator_id: z.string().uuid().nullable().optional(),
  operator_name: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'split', 'other']).default('card'),
  discount_amount: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  items: z.array(CreateSaleItemSchema).min(1, 'Inserire almeno un articolo nel carrello'),
});

/**
 * Types & Contracts for Feature 3: Smart Bill Request
 * RIVO Autonomous Hospitality Operating System
 */

export type BillRequestStatus = 
  | 'idle' 
  | 'bill_requested' 
  | 'attendant_dispatched' 
  | 'settled';

export type PaymentMethodIntent = 
  | 'pos_contactless' 
  | 'pos_traditional' 
  | 'cash_exact' 
  | 'cash_needs_change';

export interface TableSession {
  id: string;
  organization_id: string;
  device_id?: string | null;
  table_label: string;
  session_token: string;
  status: 'active' | 'closed';
  guest_count: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
}

export interface BillRequestInvoiceData {
  companyName: string;
  vatNumber: string;
  sdiCode: string;
  pec?: string;
  address?: string;
}

export interface BillRequest {
  id: string;
  organization_id: string;
  session_id?: string | null;
  device_id?: string | null;
  table_label: string;
  status: BillRequestStatus;
  payment_method_intent: PaymentMethodIntent;
  total_amount: number;
  banknote_denomination?: number | null;
  change_due?: number | null;
  split_count: number;
  split_quota_amount?: number | null;
  invoice_data?: BillRequestInvoiceData | null;
  notes?: string | null;
  dispatched_by?: string | null;
  dispatched_at?: string | null;
  settled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBillRequestInput {
  organization_id: string;
  session_token?: string;
  device_id?: string | null;
  table_label: string;
  payment_method_intent: PaymentMethodIntent;
  total_amount?: number;
  banknote_denomination?: number | null;
  split_count?: number;
  invoice_data?: BillRequestInvoiceData | null;
  notes?: string;
}

export interface UpdateBillRequestStatusInput {
  id: string;
  status: BillRequestStatus;
  dispatched_by?: string;
}

export interface WebSocketTableAlertPayload {
  table_id: string;
  action: 'BILL_REQUEST' | 'ATTENDANT_DISPATCHED' | 'SETTLED' | 'CALL_WAITER';
  method: 'POS_CONTACTLESS' | 'POS_TRADITIONAL' | 'CASH_EXACT' | 'CASH_CHANGE' | 'WAITER';
  action_required: string;
  timestamp: string;
  details?: {
    bill_request_id?: string;
    total_amount?: number;
    banknote_denomination?: number;
    change_due?: number;
    split_count?: number;
    split_quota?: string;
    has_invoice?: boolean;
    invoice_company?: string;
    invoice_sdi?: string;
  };
}

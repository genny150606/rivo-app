export type Role = 'admin' | 'client';
export type OrgStatus = 'active' | 'suspended' | 'inactive';
export type DeviceType = 'nfc' | 'qr' | 'both';
export type DeviceStatus = 'active' | 'inactive';
export type InteractionType = 'nfc' | 'qr' | 'unknown';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';
export type BusinessCategory = 
  | 'restaurant' 
  | 'bar' 
  | 'pizzeria' 
  | 'salon' 
  | 'barber' 
  | 'beauty' 
  | 'hotel' 
  | 'bnb' 
  | 'beach_club' 
  | 'medical' 
  | 'dental' 
  | 'pharmacy' 
  | 'fitness' 
  | 'retail' 
  | 'store' 
  | 'professional' 
  | 'automotive' 
  | 'nightlife' 
  | 'generic';

export type HubMode = 'hub' | 'shield' | 'smart_routing' | 'direct';

export interface Plan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  limits: {
    devices?: number;
    locations?: number;
  };
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: OrgStatus;
  plan_id: string | null;
  category?: BusinessCategory;
  hub_mode?: HubMode;
  custom_cta_label?: string | null;
  custom_cta_url?: string | null;
  city_guide_text?: string | null;
  vat_number?: string | null;
  whatsapp_number?: string | null;
  instagram_url?: string | null;
  description?: string | null;
  admin_notes?: string | null;
  review_shield_enabled?: boolean;
  google_review_url?: string | null;
  smart_routing_enabled?: boolean;
  lunch_destination_url?: string | null;
  lunch_start_time?: string;
  lunch_end_time?: string;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
  telegram_alerts_enabled?: boolean;
  wifi_ssid?: string | null;
  wifi_password?: string | null;
  ai_menu_context?: string | null;
  loyalty_reward_text?: string | null;
  primary_color?: string | null;
  hub_config?: any;
  created_at: string;
  updated_at: string;
}

export interface PrivateFeedback {
  id: string;
  organization_id: string;
  device_id: string | null;
  rating: number;
  customer_name: string | null;
  customer_contact: string | null;
  comment: string;
  status: 'new' | 'read' | 'archived';
  created_at: string;
}

export interface ServiceCall {
  id: string;
  organization_id: string;
  device_id: string | null;
  type: 'waiter' | 'bill_pos' | 'bill_cash' | 'dish_order';
  table_label: string | null;
  order_details?: any;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

export interface Coupon {
  id: string;
  organization_id: string;
  code: string;
  reward: string;
  customer_name: string | null;
  customer_contact: string;
  status: 'active' | 'redeemed' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface LoyaltyCard {
  id: string;
  organization_id: string;
  customer_contact: string;
  customer_name: string | null;
  stamps_count: number;
  max_stamps: number;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  name: string | null;
  contact: string;
  source: 'wifi' | 'wheel' | 'loyalty';
  created_at: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  organization_id: string | null;
  role: Role;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  organization_id: string;
  location_id: string;
  name: string;
  type: DeviceType;
  unique_code: string;
  destination_url: string;
  status: DeviceStatus;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  organization_id: string;
  location_id: string;
  device_id: string;
  interaction_type: InteractionType;
  timestamp: string;
  user_agent: string | null;
  referrer: string | null;
  anonymous_session_id: string | null;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

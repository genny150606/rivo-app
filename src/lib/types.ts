export type Role = 'admin' | 'client';
export type OrgStatus = 'active' | 'suspended' | 'inactive';
export type DeviceType = 'nfc' | 'qr' | 'both';
export type DeviceStatus = 'active' | 'inactive';
export type InteractionType = 'nfc' | 'qr' | 'unknown';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

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
  created_at: string;
  updated_at: string;
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

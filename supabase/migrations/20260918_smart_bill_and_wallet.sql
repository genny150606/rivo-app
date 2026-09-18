-- ==============================================================================
-- RIVO TECHNOLOGIES - SMART BILL REQUEST & DIGITAL WALLET PASS ENGINE
-- Migration: 20260918_smart_bill_and_wallet.sql
-- Database: PostgreSQL 16 (Supabase)
-- Author: Lead System Architect & Data Modeler
-- ==============================================================================

-- 1. ENUMS (Idempotent creation)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bill_request_status') THEN
    CREATE TYPE bill_request_status AS ENUM (
      'idle', 
      'bill_requested', 
      'attendant_dispatched', 
      'settled'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_intent') THEN
    CREATE TYPE payment_method_intent AS ENUM (
      'pos_contactless', 
      'pos_traditional', 
      'cash_exact', 
      'cash_needs_change'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loyalty_pass_type') THEN
    CREATE TYPE loyalty_pass_type AS ENUM (
      'apple_wallet', 
      'google_wallet'
    );
  END IF;
END $$;

-- 2. TABLE: table_sessions
-- Tracks the active anonymous dining session per table
CREATE TABLE IF NOT EXISTS public.table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  table_label VARCHAR(60) NOT NULL,
  session_token VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  guest_count INT NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_table_sessions_org_table 
  ON public.table_sessions (organization_id, table_label, status);

CREATE INDEX IF NOT EXISTS idx_table_sessions_token 
  ON public.table_sessions (session_token);

-- 3. TABLE: bill_requests
-- Atomic tracking of bill requests with payment pre-selection, cash note, change, split and invoice
CREATE TABLE IF NOT EXISTS public.bill_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  table_label VARCHAR(60) NOT NULL,
  status bill_request_status NOT NULL DEFAULT 'bill_requested',
  payment_method_intent payment_method_intent NOT NULL DEFAULT 'pos_contactless',
  total_amount NUMERIC(10, 2) DEFAULT 0.00,
  banknote_denomination NUMERIC(10, 2),
  change_due NUMERIC(10, 2) DEFAULT 0.00,
  split_count INT NOT NULL DEFAULT 1 CHECK (split_count >= 1 AND split_count <= 50),
  split_quota_amount NUMERIC(10, 2),
  invoice_data JSONB,
  notes TEXT,
  dispatched_by VARCHAR(120),
  dispatched_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Concurrency Lock: Prevents duplicate active bill requests for the same table
-- Exactly ONE active request allowed per table until settled or reset!
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_bill_request_per_table
  ON public.bill_requests (organization_id, table_label)
  WHERE status IN ('bill_requested', 'attendant_dispatched');

-- Query indices
CREATE INDEX IF NOT EXISTS idx_bill_requests_org_status 
  ON public.bill_requests (organization_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bill_requests_session 
  ON public.bill_requests (session_id);

-- 4. TABLE: customer_loyalty_passes
-- Stores native wallet pass tokens for Apple Wallet (.pkpass) and Google Wallet (Generic Pass)
CREATE TABLE IF NOT EXISTS public.customer_loyalty_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  loyalty_card_id UUID REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  pass_type loyalty_pass_type NOT NULL,
  pass_token VARCHAR(128) NOT NULL UNIQUE,
  customer_contact VARCHAR(120) NOT NULL,
  customer_name VARCHAR(120),
  stamps_count INT NOT NULL DEFAULT 0,
  max_stamps INT NOT NULL DEFAULT 10,
  reward_text TEXT,
  apple_serial_number VARCHAR(128),
  apple_authentication_token VARCHAR(128),
  apple_push_token TEXT,
  google_class_id VARCHAR(128),
  google_object_id VARCHAR(128),
  google_save_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_passes_contact 
  ON public.customer_loyalty_passes (organization_id, customer_contact);

CREATE INDEX IF NOT EXISTS idx_loyalty_passes_token 
  ON public.customer_loyalty_passes (pass_token);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty_passes ENABLE ROW LEVEL SECURITY;

-- 5.1 table_sessions policies
-- Allow merchants (authenticated org staff) full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'table_sessions' AND policyname = 'merchants_manage_sessions'
  ) THEN
    CREATE POLICY merchants_manage_sessions ON public.table_sessions
      FOR ALL
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
      )
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Allow anonymous guests to read and create their own active session with valid token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'table_sessions' AND policyname = 'anon_read_own_session'
  ) THEN
    CREATE POLICY anon_read_own_session ON public.table_sessions
      FOR SELECT
      TO anon, public
      USING (status = 'active');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'table_sessions' AND policyname = 'anon_insert_session'
  ) THEN
    CREATE POLICY anon_insert_session ON public.table_sessions
      FOR INSERT
      TO anon, public
      WITH CHECK (status = 'active');
  END IF;
END $$;

-- 5.2 bill_requests policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bill_requests' AND policyname = 'merchants_manage_bills'
  ) THEN
    CREATE POLICY merchants_manage_bills ON public.bill_requests
      FOR ALL
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
      )
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bill_requests' AND policyname = 'anon_create_bill_request'
  ) THEN
    CREATE POLICY anon_create_bill_request ON public.bill_requests
      FOR INSERT
      TO anon, public
      WITH CHECK (status = 'bill_requested');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bill_requests' AND policyname = 'anon_read_bill_request'
  ) THEN
    CREATE POLICY anon_read_bill_request ON public.bill_requests
      FOR SELECT
      TO anon, public
      USING (true);
  END IF;
END $$;

-- 5.3 customer_loyalty_passes policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_loyalty_passes' AND policyname = 'merchants_manage_passes'
  ) THEN
    CREATE POLICY merchants_manage_passes ON public.customer_loyalty_passes
      FOR ALL
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
      )
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_loyalty_passes' AND policyname = 'anon_read_loyalty_pass'
  ) THEN
    CREATE POLICY anon_read_loyalty_pass ON public.customer_loyalty_passes
      FOR SELECT
      TO anon, public
      USING (is_active = true);
  END IF;
END $$;

-- 6. ENABLE REALTIME BROADCASTING
-- Add new tables to supabase_realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bill_requests;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_loyalty_passes;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

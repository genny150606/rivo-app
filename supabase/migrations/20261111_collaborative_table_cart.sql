-- ==============================================================================
-- RIVO TECHNOLOGIES - COLLABORATIVE TABLE CART (MULTIPLAYER TABLE ORDER)
-- Migration: 20261111_collaborative_table_cart.sql
-- Database: PostgreSQL 16 (Supabase)
--
-- Every guest who taps the same table device joins the same active
-- table_session, adds dishes to a shared cart and confirms with a
-- "Ready Check": the order is sent to the kitchen only when everybody is ready.
--
-- All reads/writes go through /api/table-cart (service role). Guests are
-- authenticated by a random secret token kept in their browser: only its
-- SHA-256 hash is stored here.
-- ==============================================================================

-- 1. ROUND COUNTER ON TABLE SESSIONS
-- Used as an optimistic lock so a round can be submitted exactly once,
-- even if several phones fire the submit at the same moment.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'table_sessions' AND column_name = 'current_round'
  ) THEN
    ALTER TABLE public.table_sessions ADD COLUMN current_round INT NOT NULL DEFAULT 1;
  END IF;
END $$;

-- One active session per device (only created if no duplicates already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT device_id FROM public.table_sessions
    WHERE status = 'active' AND device_id IS NOT NULL
    GROUP BY device_id HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_session_per_device
      ON public.table_sessions (device_id)
      WHERE status = 'active' AND device_id IS NOT NULL;
  ELSE
    RAISE NOTICE 'Skipped idx_unique_active_session_per_device: duplicate active sessions found';
  END IF;
END $$;

-- 2. TABLE: table_session_guests
CREATE TABLE IF NOT EXISTS public.table_session_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  guest_name VARCHAR(40) NOT NULL,
  guest_token_hash VARCHAR(64) NOT NULL UNIQUE,
  color VARCHAR(16) NOT NULL DEFAULT '#60a5fa',
  is_ready BOOLEAN NOT NULL DEFAULT false,
  ready_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_table_session_guests_session
  ON public.table_session_guests (session_id, created_at);

-- 3. TABLE: table_cart_items
CREATE TABLE IF NOT EXISTS public.table_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.table_session_guests(id) ON DELETE SET NULL,
  dish_id VARCHAR(100) NOT NULL,
  dish_name VARCHAR(150) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 50),
  notes VARCHAR(200),
  is_shared BOOLEAN NOT NULL DEFAULT false,
  is_custom BOOLEAN NOT NULL DEFAULT false, -- off-menu item (e.g. AI wine pairing), indicative price
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  order_round INT,
  service_call_id UUID REFERENCES public.service_calls(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_table_cart_items_session_status
  ON public.table_cart_items (session_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_table_cart_items_guest
  ON public.table_cart_items (guest_id);

-- 4. ROW LEVEL SECURITY
-- RLS enabled with NO anon/authenticated policies: only the service role
-- (used by /api/table-cart) can read or write these tables.
ALTER TABLE public.table_session_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_cart_items ENABLE ROW LEVEL SECURITY;

-- Merchants can read the carts of their own organization (dashboard views)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'table_session_guests' AND policyname = 'merchants_read_session_guests'
  ) THEN
    CREATE POLICY merchants_read_session_guests ON public.table_session_guests
      FOR SELECT TO authenticated
      USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'table_cart_items' AND policyname = 'merchants_read_cart_items'
  ) THEN
    CREATE POLICY merchants_read_cart_items ON public.table_cart_items
      FOR SELECT TO authenticated
      USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;

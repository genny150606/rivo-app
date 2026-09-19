-- ==============================================================================
-- RIVO TECHNOLOGIES - STAFF MANAGEMENT, RBAC, TABLE ASSIGNMENTS & AUDIT LOGS
-- Migration: 20260919_staff_management.sql
-- Database: PostgreSQL 16 (Supabase)
-- ==============================================================================

-- 1. EXTEND PROFILES ROLES AND STATUS
-- Support 'admin', 'client', 'owner', 'manager', 'waiter'
DO $$ 
BEGIN
  -- Drop existing check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  -- Add updated check constraint
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role = ANY (ARRAY['admin'::text, 'client'::text, 'owner'::text, 'manager'::text, 'waiter'::text]));
END $$;

-- Add new columns to profiles if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE public.profiles ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'location_id') THEN
    ALTER TABLE public.profiles ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'permissions') THEN
    ALTER TABLE public.profiles ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_login_at') THEN
    ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email VARCHAR(255);
  END IF;
END $$;

-- 2. TABLE: staff_invitations
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'manager', 'waiter')),
  permissions JSONB DEFAULT '[]'::jsonb,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_invitations_org 
  ON public.staff_invitations (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_staff_invitations_token_hash 
  ON public.staff_invitations (token_hash);

-- 3. TABLE: table_assignments
CREATE TABLE IF NOT EXISTS public.table_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  table_label VARCHAR(60) NOT NULL,
  waiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'released')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Concurrency Lock: only ONE active assignment per table / device in an organization!
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_table_assignment 
  ON public.table_assignments (organization_id, device_id) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_table_assignments_waiter_active 
  ON public.table_assignments (waiter_id, status) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_table_assignments_org_status 
  ON public.table_assignments (organization_id, status, assigned_at DESC);

-- 4. TABLE: tips (Readiness for Tip Tracking)
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  table_label VARCHAR(60),
  waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  bill_request_id UUID REFERENCES public.bill_requests(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  payment_method VARCHAR(30) DEFAULT 'card',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tips_org_waiter 
  ON public.tips (organization_id, waiter_id, created_at DESC);

-- 5. TABLE: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name VARCHAR(150),
  actor_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(100),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org 
  ON public.audit_logs (organization_id, created_at DESC);

-- 6. ROUTING COLUMNS ON SERVICE CALLS & BILL REQUESTS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_calls' AND column_name = 'assigned_waiter_id') THEN
    ALTER TABLE public.service_calls ADD COLUMN assigned_waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bill_requests' AND column_name = 'assigned_waiter_id') THEN
    ALTER TABLE public.bill_requests ADD COLUMN assigned_waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_calls_waiter 
  ON public.service_calls (organization_id, assigned_waiter_id, status);

CREATE INDEX IF NOT EXISTS idx_bill_requests_waiter 
  ON public.bill_requests (organization_id, assigned_waiter_id, status);

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES (Allow service role and authenticated tenant access)
-- Drop existing policies if needed to ensure idempotency
DO $$
BEGIN
  DROP POLICY IF EXISTS "Service role full access on staff_invitations" ON public.staff_invitations;
  DROP POLICY IF EXISTS "Service role full access on table_assignments" ON public.table_assignments;
  DROP POLICY IF EXISTS "Service role full access on tips" ON public.tips;
  DROP POLICY IF EXISTS "Service role full access on audit_logs" ON public.audit_logs;
END $$;

CREATE POLICY "Service role full access on staff_invitations" 
  ON public.staff_invitations FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on table_assignments" 
  ON public.table_assignments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on tips" 
  ON public.tips FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on audit_logs" 
  ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

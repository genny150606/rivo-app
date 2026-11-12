-- ==============================================================================
-- RIVO TECHNOLOGIES - SALON & BARBER SHOP BOOKING ENGINE
-- Migration: 20261111_salon_bookings.sql
-- Database: PostgreSQL 16 (Supabase)
-- ==============================================================================

-- 1. TABLE: salon_services (Treatments catalog: Taglio, Barba, Colore, Piega...)
CREATE TABLE IF NOT EXISTS public.salon_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'taglio',
  description VARCHAR(300),
  duration_minutes INT NOT NULL DEFAULT 30 CHECK (duration_minutes >= 5 AND duration_minutes <= 360),
  price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salon_services_org
  ON public.salon_services (organization_id, is_active, sort_order);

-- 2. TABLE: salon_staff (Barbers / Hair Stylists / Beauticians)
CREATE TABLE IF NOT EXISTS public.salon_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  role_title VARCHAR(80) NOT NULL DEFAULT 'Hair Stylist',
  color VARCHAR(20) NOT NULL DEFAULT '#10b981',
  service_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- empty array = performs all active services
  working_hours JSONB, -- optional custom weekly schedule override for this staff member
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_present_today BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salon_staff_org
  ON public.salon_staff (organization_id, is_active, sort_order);

-- 3. TABLE: salon_bookings (Appointments)
CREATE TABLE IF NOT EXISTS public.salon_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.salon_staff(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  customer_notes VARCHAR(300),
  service_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  services_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  booking_date DATE NOT NULL,
  start_time VARCHAR(5) NOT NULL, -- 'HH:MM'
  end_time VARCHAR(5) NOT NULL,   -- 'HH:MM'
  total_duration_minutes INT NOT NULL CHECK (total_duration_minutes >= 5 AND total_duration_minutes <= 480),
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  source VARCHAR(20) NOT NULL DEFAULT 'hub' CHECK (source IN ('hub', 'manual')),
  cancel_token_hash VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salon_bookings_org_date
  ON public.salon_bookings (organization_id, booking_date, status);

CREATE INDEX IF NOT EXISTS idx_salon_bookings_staff_date
  ON public.salon_bookings (staff_id, booking_date, status);

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.salon_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'salon_services' AND policyname = 'merchants_manage_salon_services'
  ) THEN
    CREATE POLICY merchants_manage_salon_services ON public.salon_services
      FOR ALL TO authenticated
      USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()))
      WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'salon_staff' AND policyname = 'merchants_manage_salon_staff'
  ) THEN
    CREATE POLICY merchants_manage_salon_staff ON public.salon_staff
      FOR ALL TO authenticated
      USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()))
      WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'salon_bookings' AND policyname = 'merchants_manage_salon_bookings'
  ) THEN
    CREATE POLICY merchants_manage_salon_bookings ON public.salon_bookings
      FOR ALL TO authenticated
      USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()))
      WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()));
  END IF;
END $$;

-- 5. REGISTER 'bookings' MODULE IN MULTI-VERTICAL ENGINE (IF TABLE EXISTS)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules') THEN
    INSERT INTO public.modules (slug, name, description, category, default_sort)
    VALUES (
      'bookings',
      'Agenda & Prenotazioni Salone',
      'Calendario appuntamenti per poltrona/operatore, turni staff e prenotazione online per Barber e Parrucchieri',
      'vertical',
      125
    )
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

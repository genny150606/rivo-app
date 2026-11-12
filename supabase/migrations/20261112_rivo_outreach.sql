-- ============================================================================
-- RIVO OUTREACH — AI-Powered Business Intelligence & Sales Acquisition
-- Migration: 20261112_rivo_outreach.sql
-- Access restricted exclusively to RIVO Superadmins (profiles.role = 'admin')
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper function to verify if the current authenticated user is a RIVO Superadmin
CREATE OR REPLACE FUNCTION public.is_rivo_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.auth_user_id = auth.uid()
      AND profiles.role = 'admin'
  );
$$;

-- ============================================================================
-- 1. outreach_sources — Data Acquisition Providers Configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.outreach_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL UNIQUE,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('openstreetmap', 'public_website', 'google_places', 'directory', 'manual')),
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default non-secret provider records
INSERT INTO public.outreach_sources (provider_name, provider_type, configuration, enabled)
VALUES
  (
    'OpenStreetMap Overpass (ODbL)',
    'openstreetmap',
    '{"attribution": "© OpenStreetMap contributors (ODbL)", "supportsRadius": true, "rateLimitPerMinute": 15}'::jsonb,
    true
  ),
  (
    'Public Website Metadata Inspector',
    'public_website',
    '{"timeoutMs": 6000, "respectRobots": true}'::jsonb,
    true
  ),
  (
    'Google Places API (Official)',
    'google_places',
    '{"requiresEnvKey": "GOOGLE_PLACES_API_KEY", "terms": "Google Maps Platform Terms — ID & live lookup compliant"}'::jsonb,
    true
  ),
  (
    'Inserimento Manuale & Import CSV Autorizzato',
    'manual',
    '{"supportsCsv": true}'::jsonb,
    true
  )
ON CONFLICT (provider_name) DO NOTHING;

-- ============================================================================
-- 2. outreach_prospects — Core Prospect CRM Entities
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.outreach_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  city TEXT,
  province TEXT,
  region TEXT,
  address TEXT,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  website TEXT,
  website_domain TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  business_phone TEXT,
  business_email TEXT,
  description TEXT,
  services_offered JSONB NOT NULL DEFAULT '[]'::jsonb,
  digital_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL,
  source_reference TEXT,
  source_acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_score INTEGER NOT NULL DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  confidence_score INTEGER NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ai_analysis JSONB,
  commercial_status TEXT NOT NULL DEFAULT 'nuovo' CHECK (
    commercial_status IN (
      'nuovo',
      'da_analizzare',
      'analizzato',
      'da_contattare',
      'contatto_consentito',
      'in_conversazione',
      'interessato',
      'appuntamento_fissato',
      'trattativa',
      'convertito_in_cliente',
      'non_interessato',
      'non_contattare'
    )
  ),
  admin_notes TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  merged_into_id UUID REFERENCES public.outreach_prospects(id) ON DELETE SET NULL,
  retention_expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '365 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_prospects_status ON public.outreach_prospects(commercial_status);
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_category ON public.outreach_prospects(category);
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_city ON public.outreach_prospects(city);
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_lead_score ON public.outreach_prospects(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_norm_name ON public.outreach_prospects(normalized_name);
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_domain ON public.outreach_prospects(website_domain) WHERE website_domain IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_prospects_source_ref
  ON public.outreach_prospects(source, source_reference)
  WHERE source_reference IS NOT NULL AND merged_into_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_prospects_org_unique
  ON public.outreach_prospects(organization_id)
  WHERE organization_id IS NOT NULL;

-- ============================================================================
-- 3. outreach_campaigns & outreach_campaign_prospects
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_status ON public.outreach_campaigns(status);

CREATE TABLE IF NOT EXISTS public.outreach_campaign_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES public.outreach_prospects(id) ON DELETE CASCADE,
  processing_status TEXT NOT NULL DEFAULT 'discovered' CHECK (
    processing_status IN ('discovered', 'analyzed', 'qualified', 'message_generated', 'in_pipeline', 'skipped', 'failed')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, prospect_id)
);

CREATE INDEX IF NOT EXISTS idx_outreach_campaign_prospects_camp ON public.outreach_campaign_prospects(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_campaign_prospects_prosp ON public.outreach_campaign_prospects(prospect_id);

-- ============================================================================
-- 4. outreach_ai_generations — AI Analysis & Sales Pitch Variants History
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.outreach_ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.outreach_prospects(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('business_intelligence', 'sales_pitch')),
  prompt_version TEXT NOT NULL DEFAULT 'v1.0',
  generated_content JSONB NOT NULL,
  model TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_variant TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_ai_gen_prospect ON public.outreach_ai_generations(prospect_id, created_at DESC);

-- ============================================================================
-- 5. outreach_conversations & outreach_messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.outreach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.outreach_prospects(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'instagram', 'manual')),
  conversation_status TEXT NOT NULL DEFAULT 'open' CHECK (
    conversation_status IN ('open', 'open_user_initiated', 'awaiting_reply', 'replied', 'closed', 'opted_out')
  ),
  provider_reference TEXT,
  last_user_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_conversations_prospect ON public.outreach_conversations(prospect_id);

CREATE TABLE IF NOT EXISTS public.outreach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.outreach_prospects(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.outreach_conversations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'instagram', 'manual')),
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  delivery_mode TEXT NOT NULL DEFAULT 'draft' CHECK (delivery_mode IN ('draft', 'approval', 'automated', 'manual')),
  subject TEXT,
  content TEXT NOT NULL,
  variant_used TEXT,
  provider_status TEXT NOT NULL DEFAULT 'draft' CHECK (
    provider_status IN ('draft', 'pending_approval', 'approved', 'sent', 'delivered', 'replied', 'blocked_compliance', 'failed')
  ),
  provider_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_messages_prospect ON public.outreach_messages(prospect_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_status ON public.outreach_messages(provider_status);

-- ============================================================================
-- 6. outreach_contact_permissions & outreach_suppressions (GDPR & Policy Gate)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.outreach_contact_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.outreach_prospects(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'instagram', 'manual')),
  permission_status TEXT NOT NULL CHECK (permission_status IN ('granted', 'pending_verification', 'denied', 'withdrawn')),
  legal_basis TEXT NOT NULL CHECK (
    legal_basis IN (
      'explicit_consent',
      'user_initiated_inbound',
      'pre_contractual_request',
      'documented_b2b_legitimate_interest',
      'manual_1to1_inquiry'
    )
  ),
  evidence_reference TEXT NOT NULL,
  evidence_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  scope TEXT NOT NULL DEFAULT 'b2b_commercial_outreach',
  source TEXT NOT NULL,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_permissions_prospect ON public.outreach_contact_permissions(prospect_id, channel);

CREATE TABLE IF NOT EXISTS public.outreach_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES public.outreach_prospects(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('all', 'email', 'whatsapp', 'instagram', 'manual')),
  contact_identifier TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_suppressions_prospect ON public.outreach_suppressions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_outreach_suppressions_identifier ON public.outreach_suppressions(contact_identifier) WHERE contact_identifier IS NOT NULL;

-- ============================================================================
-- 7. outreach_activity_logs, outreach_settings & outreach_jobs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.outreach_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES public.outreach_prospects(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  admin_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_logs_prospect ON public.outreach_activity_logs(prospect_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_logs_created ON public.outreach_activity_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS public.outreach_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.outreach_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (
    job_type IN (
      'discovery',
      'deduplication',
      'website_enrichment',
      'ai_analysis',
      'message_generation',
      'campaign_execution',
      'retention_cleanup'
    )
  ),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'running', 'completed', 'failed', 'cancelled')
  ),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outreach_jobs_status ON public.outreach_jobs(status, created_at DESC);

-- ============================================================================
-- 8. Row Level Security (RLS) — Strictly Superadmin Only
-- ============================================================================
ALTER TABLE public.outreach_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_campaign_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_contact_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_jobs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'outreach_sources',
    'outreach_prospects',
    'outreach_campaigns',
    'outreach_campaign_prospects',
    'outreach_ai_generations',
    'outreach_conversations',
    'outreach_messages',
    'outreach_contact_permissions',
    'outreach_suppressions',
    'outreach_activity_logs',
    'outreach_settings',
    'outreach_jobs'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS admin_only_all_%I ON public.%I;', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY admin_only_all_%I ON public.%I FOR ALL TO authenticated USING (public.is_rivo_admin()) WITH CHECK (public.is_rivo_admin());',
      tbl,
      tbl
    );
  END LOOP;
END
$$;

-- ==============================================================================
-- RIVO — MODULAR MULTI-VERTICAL PLATFORM (PRD v2.0)
-- Migration: 20261001_multi_vertical_modules.sql
-- Database: PostgreSQL 16 (Supabase)
-- ==============================================================================

-- 1. BUSINESS TYPES TABLE
CREATE TABLE IF NOT EXISTS public.business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. MODULES CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'shared' CHECK (category IN ('core', 'shared', 'vertical')),
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. BUSINESS TYPE DEFAULT MODULES (PRESETS)
CREATE TABLE IF NOT EXISTS public.business_type_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES public.business_types(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  enabled_by_default BOOLEAN NOT NULL DEFAULT true,
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(business_type_id, module_id)
);

-- 4. ORGANIZATION MODULES (EFFECTIVE TENANT STATE)
CREATE TABLE IF NOT EXISTS public.organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  source VARCHAR(30) NOT NULL DEFAULT 'preset' CHECK (source IN ('preset', 'admin_override', 'migration', 'system')),
  config_json JSONB DEFAULT '{}'::jsonb,
  enabled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  disabled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(organization_id, module_id)
);

-- 5. EXTEND ORGANIZATIONS WITH business_type_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'business_type_id'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN business_type_id UUID REFERENCES public.business_types(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. RETAIL VERTICAL TABLES (PRODUCTS, VARIANTS, MOVEMENTS, BALANCES)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  sku VARCHAR(100),
  description TEXT,
  category_name VARCHAR(100),
  cost_price NUMERIC(10, 2),
  sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size VARCHAR(50),
  color VARCHAR(50),
  barcode VARCHAR(100),
  reorder_threshold INT NOT NULL DEFAULT 3,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'initial')),
  quantity_delta INT NOT NULL,
  reason VARCHAR(255),
  reference VARCHAR(100),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  quantity_on_hand INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, variant_id, location_id)
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_org_modules_org_id ON public.organization_modules(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_modules_enabled ON public.organization_modules(organization_id, enabled);
CREATE INDEX IF NOT EXISTS idx_products_org_id ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_org_id ON public.product_variants(organization_id);
CREATE INDEX IF NOT EXISTS idx_movements_org_id ON public.inventory_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_balances_org_var ON public.inventory_balances(organization_id, variant_id);

-- 8. SEED BUSINESS TYPES
INSERT INTO public.business_types (slug, name, description, sort_order) VALUES
  ('restaurant', 'Ristorante & Bistrot', 'Esperienze culinarie complete, menu digitale, comande e servizio al tavolo', 10),
  ('bar', 'Bar & Caffetteria', 'Colazioni, listini rapidi, caffetteria, fidelity card e Wi-Fi', 20),
  ('pizzeria', 'Pizzeria & Pub', 'Pizze gourmet, birre alla spina, gestione ranghi sala e sconti', 30),
  ('gelateria', 'Gelateria & Pasticceria', 'Gusti artigianali, allergeni, ruota premi e fidelizzazione clienti', 40),
  ('hotel', 'Hotel & Resort', 'Room directory, servizi concierge, info turistiche e promozioni interne', 50),
  ('bb', 'B&B & Guest House', 'Check-in digitale, guida della città, Wi-Fi 1-Tap e colazioni', 60),
  ('shoe_store', 'Negozio di Scarpe & Calzature', 'Catalogo calzature, taglie, colori, stock di magazzino e fedeltà', 70),
  ('retail', 'Retail & Boutique Abbigliamento', 'Catalogo moda, inventario capi, promozioni e fidelizzazione clienti', 80),
  ('gym', 'Palestra & Fitness Club', 'Orari corsi, pass digitali, piani abbonamento e promozioni', 90),
  ('medical_studio', 'Studio Medico & Specialistico', 'Orari visite, prenotazione appuntamenti e documentazione informativa', 100),
  ('other', 'Altra Attività Commerciale', 'Configurazione flessibile e modulare per qualsiasi punto vendita fisico', 110)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 9. SEED MODULES CATALOG
INSERT INTO public.modules (slug, name, description, category, sort_order) VALUES
  ('analytics', 'Analytics & Statistiche', 'Monitoraggio interazioni NFC/QR, conversioni e andamento visite', 'core', 10),
  ('crm', 'Clienti & CRM Leads', 'Database clienti raccolti, consensi privacy e marketing', 'shared', 20),
  ('nfc_qr', 'NFC & QR Devices', 'Gestione hardware, chip intelligenti da tavolo e codici QR fisici', 'shared', 30),
  ('review_shield', 'Review Shield Google', 'Filtro recensioni proattivo e potenziamento reputazione a 5 stelle', 'shared', 40),
  ('loyalty', 'Fidelity Pass & Timbri', 'Tessera fedeltà digitale con premi su Apple & Google Wallet', 'shared', 50),
  ('coupons', 'Ruota Premi & Coupon', 'Gamification in-store con sconti interattivi ed estrazione premi', 'shared', 60),
  ('smart_router', 'Smart Router Orario', 'Instradamento automatico intelligente in base alla fascia oraria', 'shared', 70),
  ('universal_hub', 'Custom Hub Studio', 'Micro-sito responsive con grafica personalizzata e pulsanti rapidi', 'shared', 80),
  ('table_service', 'Gestione Sala & Tavoli', 'Mappa tavoli, assegnazione camerieri di rango e visuale coperti', 'vertical', 90),
  ('staff', 'Staff & Risorse Umane', 'Inviti collaboratori, ruoli (Owner, Manager, Waiter) e turni', 'vertical', 100),
  ('service_calls', 'Chiamate & Chiamata Sala', 'Notifiche in tempo reale al cameriere, richieste conto e Telegram bot', 'vertical', 110),
  ('canva_menu', 'Menù Canvas Digitale', 'Designer visivo per menu ristorante con categorie e piatti ordinabili', 'vertical', 120),
  ('products', 'Catalogo Prodotti & Articoli', 'Gestione articoli, brand, SKU, prezzi e varianti per negozi retail', 'vertical', 130),
  ('inventory', 'Inventario & Giacenze Magazzino', 'Controllo scorte, carichi/scarichi merci e alert sottoscorta', 'vertical', 140),
  ('suppliers', 'Fornitori & Riordini', 'Anagrafica fornitori e tracciamento riordini merce', 'vertical', 150)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order;

-- 10. HELPER FUNCTION TO SEED PRESETS
CREATE OR REPLACE FUNCTION public._seed_bt_module(p_bt_slug VARCHAR, p_mod_slug VARCHAR, p_default BOOLEAN, p_required BOOLEAN, p_order INT)
RETURNS void AS $$
DECLARE
  v_bt_id UUID;
  v_mod_id UUID;
BEGIN
  SELECT id INTO v_bt_id FROM public.business_types WHERE slug = p_bt_slug;
  SELECT id INTO v_mod_id FROM public.modules WHERE slug = p_mod_slug;
  
  IF v_bt_id IS NOT NULL AND v_mod_id IS NOT NULL THEN
    INSERT INTO public.business_type_modules (business_type_id, module_id, enabled_by_default, required, sort_order)
    VALUES (v_bt_id, v_mod_id, p_default, p_required, p_order)
    ON CONFLICT (business_type_id, module_id) DO UPDATE SET
      enabled_by_default = EXCLUDED.enabled_by_default,
      required = EXCLUDED.required,
      sort_order = EXCLUDED.sort_order;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Preset: Ristorante
SELECT public._seed_bt_module('restaurant', 'analytics', true, true, 10);
SELECT public._seed_bt_module('restaurant', 'crm', true, false, 20);
SELECT public._seed_bt_module('restaurant', 'nfc_qr', true, true, 30);
SELECT public._seed_bt_module('restaurant', 'review_shield', true, false, 40);
SELECT public._seed_bt_module('restaurant', 'loyalty', true, false, 50);
SELECT public._seed_bt_module('restaurant', 'coupons', true, false, 60);
SELECT public._seed_bt_module('restaurant', 'smart_router', true, false, 70);
SELECT public._seed_bt_module('restaurant', 'universal_hub', true, true, 80);
SELECT public._seed_bt_module('restaurant', 'table_service', true, false, 90);
SELECT public._seed_bt_module('restaurant', 'staff', true, false, 100);
SELECT public._seed_bt_module('restaurant', 'service_calls', true, false, 110);
SELECT public._seed_bt_module('restaurant', 'canva_menu', true, false, 120);

-- Preset: Bar
SELECT public._seed_bt_module('bar', 'analytics', true, true, 10);
SELECT public._seed_bt_module('bar', 'crm', true, false, 20);
SELECT public._seed_bt_module('bar', 'nfc_qr', true, true, 30);
SELECT public._seed_bt_module('bar', 'review_shield', true, false, 40);
SELECT public._seed_bt_module('bar', 'loyalty', true, false, 50);
SELECT public._seed_bt_module('bar', 'coupons', true, false, 60);
SELECT public._seed_bt_module('bar', 'smart_router', true, false, 70);
SELECT public._seed_bt_module('bar', 'universal_hub', true, true, 80);
SELECT public._seed_bt_module('bar', 'table_service', true, false, 90);
SELECT public._seed_bt_module('bar', 'staff', true, false, 100);
SELECT public._seed_bt_module('bar', 'service_calls', true, false, 110);

-- Preset: Pizzeria
SELECT public._seed_bt_module('pizzeria', 'analytics', true, true, 10);
SELECT public._seed_bt_module('pizzeria', 'crm', true, false, 20);
SELECT public._seed_bt_module('pizzeria', 'nfc_qr', true, true, 30);
SELECT public._seed_bt_module('pizzeria', 'review_shield', true, false, 40);
SELECT public._seed_bt_module('pizzeria', 'loyalty', true, false, 50);
SELECT public._seed_bt_module('pizzeria', 'coupons', true, false, 60);
SELECT public._seed_bt_module('pizzeria', 'smart_router', true, false, 70);
SELECT public._seed_bt_module('pizzeria', 'universal_hub', true, true, 80);
SELECT public._seed_bt_module('pizzeria', 'table_service', true, false, 90);
SELECT public._seed_bt_module('pizzeria', 'staff', true, false, 100);
SELECT public._seed_bt_module('pizzeria', 'service_calls', true, false, 110);
SELECT public._seed_bt_module('pizzeria', 'canva_menu', true, false, 120);

-- Preset: Negozio di scarpe (Shoe store)
SELECT public._seed_bt_module('shoe_store', 'analytics', true, true, 10);
SELECT public._seed_bt_module('shoe_store', 'crm', true, false, 20);
SELECT public._seed_bt_module('shoe_store', 'nfc_qr', true, true, 30);
SELECT public._seed_bt_module('shoe_store', 'review_shield', true, false, 40);
SELECT public._seed_bt_module('shoe_store', 'loyalty', true, false, 50);
SELECT public._seed_bt_module('shoe_store', 'universal_hub', true, false, 60);
SELECT public._seed_bt_module('shoe_store', 'products', true, true, 70);
SELECT public._seed_bt_module('shoe_store', 'inventory', true, false, 80);
SELECT public._seed_bt_module('shoe_store', 'suppliers', true, false, 90);

-- Preset: Retail / Boutique
SELECT public._seed_bt_module('retail', 'analytics', true, true, 10);
SELECT public._seed_bt_module('retail', 'crm', true, false, 20);
SELECT public._seed_bt_module('retail', 'nfc_qr', true, true, 30);
SELECT public._seed_bt_module('retail', 'review_shield', true, false, 40);
SELECT public._seed_bt_module('retail', 'loyalty', true, false, 50);
SELECT public._seed_bt_module('retail', 'universal_hub', true, false, 60);
SELECT public._seed_bt_module('retail', 'products', true, true, 70);
SELECT public._seed_bt_module('retail', 'inventory', true, false, 80);

DROP FUNCTION public._seed_bt_module;

-- 11. AUTOMATIC BACKFILL FOR EXISTING ORGANIZATIONS
DO $$
DECLARE
  v_org RECORD;
  v_bt_id UUID;
  v_target_bt_slug VARCHAR(50);
  v_mod RECORD;
BEGIN
  FOR v_org IN SELECT id, category FROM public.organizations LOOP
    -- Map category to business type slug
    v_target_bt_slug := CASE 
      WHEN v_org.category = 'hotel' THEN 'hotel'
      WHEN v_org.category = 'bnb' THEN 'bb'
      WHEN v_org.category = 'bar' THEN 'bar'
      WHEN v_org.category = 'pizzeria' THEN 'pizzeria'
      WHEN v_org.category = 'retail' THEN 'retail'
      ELSE 'restaurant'
    END;

    SELECT id INTO v_bt_id FROM public.business_types WHERE slug = v_target_bt_slug;

    -- Update organization business_type_id if null
    UPDATE public.organizations 
    SET business_type_id = v_bt_id 
    WHERE id = v_org.id AND business_type_id IS NULL;

    -- Backfill modules from business_type_modules
    FOR v_mod IN 
      SELECT module_id, enabled_by_default 
      FROM public.business_type_modules 
      WHERE business_type_id = v_bt_id
    LOOP
      INSERT INTO public.organization_modules (
        organization_id, 
        module_id, 
        enabled, 
        source
      ) VALUES (
        v_org.id, 
        v_mod.module_id, 
        v_mod.enabled_by_default, 
        'migration'
      ) ON CONFLICT (organization_id, module_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 12. RLS SECURITY POLICIES
ALTER TABLE public.business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_type_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_balances ENABLE ROW LEVEL SECURITY;

-- Read policies for catalogs (authenticated and anon can read business_types and modules)
CREATE POLICY "Public read business_types" ON public.business_types FOR SELECT USING (true);
CREATE POLICY "Public read modules" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Public read business_type_modules" ON public.business_type_modules FOR SELECT USING (true);

-- Organization Modules RLS
CREATE POLICY "Org members read their modules" ON public.organization_modules
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin manage org modules" ON public.organization_modules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Products RLS
CREATE POLICY "Org members read products" ON public.products
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Org members manage products" ON public.products
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Product variants RLS
CREATE POLICY "Org members read variants" ON public.product_variants
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Org members manage variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Inventory movements RLS
CREATE POLICY "Org members read movements" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Org members insert movements" ON public.inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Inventory balances RLS
CREATE POLICY "Org members read balances" ON public.inventory_balances
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Org members manage balances" ON public.inventory_balances
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

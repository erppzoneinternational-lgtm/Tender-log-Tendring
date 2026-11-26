-- =============================================================================
-- P.ZONE Unified Tendering System — Database 2 Safe RLS Policies
-- Target Supabase Project: owgwlrrpqxlejbdodbsd (Intelligent Tendering ERP — 36 Tables)
-- =============================================================================
-- PREREQUISITE BEFORE RUNNING THIS SCRIPT ON `owgwlrrpqxlejbdodbsd`:
--   In Supabase Dashboard (`owgwlrrpqxlejbdodbsd`) -> Authentication -> Providers:
--   Enable the EXACT SAME Google / Firebase Auth configuration used on Database 1
--   (`gjfqnmustacsmwvccvou`) so `erpSupabase.auth.signInWithIdToken` issues a JWT!
--   (Verify in the app under Master Catalog & DB -> Health -> Authentication Mode
--   that it reads: "Google JWT Session (RLS Active)" before running this SQL.)
--
-- SAFE BY DESIGN:
-- 1. Creates `public.erp_authorized_users` seeded with the primary App Admin Gmail
--    (and automatically synced from Admin -> Users by the app).
-- 2. Allows ALL active authorized team members to SELECT all 30+ Master Catalog
--    tables (`items`, `brands`, pumps, filters, cables, finishes, etc.) so Civil,
--    MEP, and Commercial engineering formulas NEVER lose unit rates.
-- 3. Restricts Master Catalog INSERT / UPDATE / DELETE to `app_admin` or users
--    granted Catalog Edit access (`can_edit_catalog = true`).
-- 4. Allows active authorized team members to SELECT / INSERT / UPDATE / DELETE
--    transactional proposal, phase, geometry, structural, finishes, and BOQ tables.
-- =============================================================================

BEGIN;

-- 1. Authorized Gmail Allowlist Mirror Table on Database 2
CREATE TABLE IF NOT EXISTS public.erp_authorized_users (
  email text PRIMARY KEY,
  role text NOT NULL DEFAULT 'viewer',
  active boolean NOT NULL DEFAULT true,
  can_edit_catalog boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Primary App Admin so Admin is never locked out
INSERT INTO public.erp_authorized_users (email, role, active, can_edit_catalog)
VALUES ('amr.faisal.elaraby@gmail.com', 'app_admin', true, true)
ON CONFLICT (email) DO UPDATE
SET role = 'app_admin',
    active = true,
    can_edit_catalog = true,
    updated_at = now();

-- 2. Non-recursive SECURITY DEFINER helper functions
CREATE OR REPLACE FUNCTION public.erp_current_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')));
$$;

CREATE OR REPLACE FUNCTION public.erp_is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.erp_authorized_users u
    WHERE LOWER(TRIM(u.email)) = public.erp_current_email()
      AND u.active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.erp_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.erp_authorized_users u
    WHERE LOWER(TRIM(u.email)) = public.erp_current_email()
      AND u.active = true
      AND u.role = 'app_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.erp_can_edit_catalog()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.erp_authorized_users u
    WHERE LOWER(TRIM(u.email)) = public.erp_current_email()
      AND u.active = true
      AND (u.role = 'app_admin' OR u.can_edit_catalog = true)
  );
$$;

GRANT EXECUTE ON FUNCTION public.erp_current_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.erp_is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.erp_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.erp_can_edit_catalog() TO authenticated;

-- 3. RLS on `erp_authorized_users` (Admin-Managed Allowlist)
ALTER TABLE public.erp_authorized_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "erp_auth_users_select" ON public.erp_authorized_users;
CREATE POLICY "erp_auth_users_select"
  ON public.erp_authorized_users
  FOR SELECT
  TO authenticated
  USING (
    LOWER(TRIM(email)) = public.erp_current_email()
    OR public.erp_is_admin()
  );

DROP POLICY IF EXISTS "erp_auth_users_admin_write" ON public.erp_authorized_users;
CREATE POLICY "erp_auth_users_admin_write"
  ON public.erp_authorized_users
  FOR ALL
  TO authenticated
  USING (public.erp_is_admin())
  WITH CHECK (public.erp_is_admin());

-- 4. Apply Safe RLS Across All Public ERP Tables Dynamically
DO $$
DECLARE
  rec record;
  transactional_tables text[] := ARRAY[
    'tender_log',
    'phases',
    'boq_items',
    'proposal_breakdown_items',
    'proposal_data_entry',
    'pump_room_data_entry',
    'water_feature_structural_works',
    'pump_room_structural_works',
    'proposal_finishes_water_feature',
    'proposal_finishes_pump_room',
    'clients',
    'countries',
    'governorates',
    'regions',
    'districts'
  ];
BEGIN
  FOR rec IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> 'erp_authorized_users'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', rec.tablename);

    -- Everyone who is an active allowlisted user can SELECT every ERP & Catalog table
    EXECUTE format('DROP POLICY IF EXISTS "erp_%s_select" ON public.%I;', rec.tablename, rec.tablename);
    EXECUTE format(
      'CREATE POLICY "erp_%s_select" ON public.%I FOR SELECT TO authenticated USING (public.erp_is_active_user());',
      rec.tablename, rec.tablename
    );

    IF rec.tablename = ANY(transactional_tables) THEN
      -- Proposal, Phase, Geometry, BOQ & Stakeholder/Geography quick-add tables:
      -- Active allowlisted engineers & managers can INSERT / UPDATE / DELETE
      EXECUTE format('DROP POLICY IF EXISTS "erp_%s_write" ON public.%I;', rec.tablename, rec.tablename);
      EXECUTE format(
        'CREATE POLICY "erp_%s_write" ON public.%I FOR ALL TO authenticated USING (public.erp_is_active_user()) WITH CHECK (public.erp_is_active_user());',
        rec.tablename, rec.tablename
      );
    ELSE
      -- Master Pricing & Equipment Specification Catalog tables (`items`, `brands`, pumps, cables, etc.):
      -- Write access restricted to App Admin or Catalog Editors
      EXECUTE format('DROP POLICY IF EXISTS "erp_%s_catalog_write" ON public.%I;', rec.tablename, rec.tablename);
      EXECUTE format(
        'CREATE POLICY "erp_%s_catalog_write" ON public.%I FOR ALL TO authenticated USING (public.erp_can_edit_catalog()) WITH CHECK (public.erp_can_edit_catalog());',
        rec.tablename, rec.tablename
      );
    END IF;
  END LOOP;
END $$;

COMMIT;

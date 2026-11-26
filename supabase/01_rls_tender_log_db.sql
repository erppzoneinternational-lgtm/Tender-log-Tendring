-- =============================================================================
-- P.ZONE Unified Tendering System — Database 1 Safe RLS Policies
-- Target Supabase Project: gjfqnmustacsmwvccvou (PZ.Tender Log, Profiles & Audit)
-- =============================================================================
-- SAFE BY DESIGN:
-- 1. Blocks 100% of unauthenticated (`anon`) and unauthorized/inactive Gmail users.
-- 2. Allows ALL active authorized team members (`profiles.active = true`) to SELECT
--    shared operational tables (`tenders`, `proposal_components`, `tasks`, etc.)
--    so engineers, managers, and approvers NEVER lose visibility of team tenders.
-- 3. Restricts `audit_log` SELECT & DELETE strictly to `app_admin` ONLY (while
--    allowing INSERT for active users so actions continue logging automatically).
-- 4. Restricts `profiles` INSERT / UPDATE / DELETE strictly to `app_admin` ONLY.
-- =============================================================================

BEGIN;

-- 1. Non-recursive SECURITY DEFINER helpers (prevents infinite policy recursion on `profiles`)
CREATE OR REPLACE FUNCTION public.pzone_current_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')));
$$;

CREATE OR REPLACE FUNCTION public.pzone_is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE LOWER(TRIM(p.email)) = public.pzone_current_email()
      AND p.active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.pzone_is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE LOWER(TRIM(p.email)) = public.pzone_current_email()
      AND p.active = true
      AND p.role = 'app_admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.pzone_current_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pzone_is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pzone_is_app_admin() TO authenticated;

-- =============================================================================
-- 2. PROFILES (Allowlist Verification + Admin-Only User Management)
-- =============================================================================
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pzone_profiles_select" ON public.profiles;
CREATE POLICY "pzone_profiles_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow user to check their own email row on login OR any active team member to resolve names
    LOWER(TRIM(email)) = public.pzone_current_email()
    OR public.pzone_is_active_user()
  );

DROP POLICY IF EXISTS "pzone_profiles_admin_insert" ON public.profiles;
CREATE POLICY "pzone_profiles_admin_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.pzone_is_app_admin());

DROP POLICY IF EXISTS "pzone_profiles_admin_update" ON public.profiles;
CREATE POLICY "pzone_profiles_admin_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.pzone_is_app_admin())
  WITH CHECK (public.pzone_is_app_admin());

DROP POLICY IF EXISTS "pzone_profiles_admin_delete" ON public.profiles;
CREATE POLICY "pzone_profiles_admin_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.pzone_is_app_admin());

-- =============================================================================
-- 3. AUDIT LOG (Append-Only for Active Users, View & Clear ONLY for App Admin)
-- =============================================================================
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pzone_audit_admin_select" ON public.audit_log;
CREATE POLICY "pzone_audit_admin_select"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.pzone_is_app_admin());

DROP POLICY IF EXISTS "pzone_audit_active_insert" ON public.audit_log;
CREATE POLICY "pzone_audit_active_insert"
  ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.pzone_is_active_user());

DROP POLICY IF EXISTS "pzone_audit_admin_delete" ON public.audit_log;
CREATE POLICY "pzone_audit_admin_delete"
  ON public.audit_log
  FOR DELETE
  TO authenticated
  USING (public.pzone_is_app_admin());

-- =============================================================================
-- 4. SHARED OPERATIONAL TABLES (Full Team Collaboration for Active Allowlisted Users)
-- =============================================================================
DO $$
DECLARE
  tbl text;
  operational_tables text[] := ARRAY[
    'lookup_values',
    'exchange_rates',
    'tenders',
    'proposal_components',
    'tender_documents',
    'tender_assignments',
    'tasks',
    'task_comments',
    'notifications',
    'saved_views'
  ];
BEGIN
  FOREACH tbl IN ARRAY operational_tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

      EXECUTE format('DROP POLICY IF EXISTS "pzone_%s_active_select" ON public.%I;', tbl, tbl);
      EXECUTE format(
        'CREATE POLICY "pzone_%s_active_select" ON public.%I FOR SELECT TO authenticated USING (public.pzone_is_active_user());',
        tbl, tbl
      );

      EXECUTE format('DROP POLICY IF EXISTS "pzone_%s_active_insert" ON public.%I;', tbl, tbl);
      EXECUTE format(
        'CREATE POLICY "pzone_%s_active_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.pzone_is_active_user());',
        tbl, tbl
      );

      EXECUTE format('DROP POLICY IF EXISTS "pzone_%s_active_update" ON public.%I;', tbl, tbl);
      EXECUTE format(
        'CREATE POLICY "pzone_%s_active_update" ON public.%I FOR UPDATE TO authenticated USING (public.pzone_is_active_user()) WITH CHECK (public.pzone_is_active_user());',
        tbl, tbl
      );

      EXECUTE format('DROP POLICY IF EXISTS "pzone_%s_active_delete" ON public.%I;', tbl, tbl);
      EXECUTE format(
        'CREATE POLICY "pzone_%s_active_delete" ON public.%I FOR DELETE TO authenticated USING (public.pzone_is_active_user());',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

COMMIT;

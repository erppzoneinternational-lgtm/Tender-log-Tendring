-- OLD (before the merged platform). Do not run on the company project.
-- =============================================================================
-- P.ZONE Unified Tendering System — Database 1 Enterprise Audit & Trigger Patch
-- Target Supabase Project: gjfqnmustacsmwvccvou (PZ.Tender Log, Profiles & Audit)
-- =============================================================================
-- WHY THIS MIGRATION IS REQUIRED ON DATABASE 1 (`gjfqnmustacsmwvccvou`):
-- 1. Fixes `public.tg_write_audit_log()` (used by `tr_audit_tenders`,
--    `tr_audit_proposal_components`, `tr_audit_tender_documents`,
--    `tr_audit_tasks`, and `tr_audit_tender_assignments`) so `audit_log.user_id`
--    always records `public.current_user_profile_id()` instead of `auth.uid()`.
--    `profiles.id` remains 100% immutable while `profiles.auth_user_id` links
--    1:1 to `auth.users(id)`, preventing `audit_log_user_id_fkey` (`23503`)
--    rollbacks for both seeded Admins and pre-assigned Engineers.
-- 2. Aligns `public.tg_compute_and_guard_tender()` and
--    `public.tg_guard_tender_assignment_update()` with the 8-Module Custom
--    Permission Matrix (`lookup_values` where `category = 'user_access_matrix'`)
--    and Two-Way Intelligent ERP BOQ Pricing Sync.
-- =============================================================================

BEGIN;

-- 1. Helper: Check if the signed-in user has custom `edit` override on a module
--    in Admin -> Users (`lookup_values` where `category = 'user_access_matrix'`)
CREATE OR REPLACE FUNCTION public.pzone_has_custom_module_edit(p_module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lookup_values lv
    WHERE lv.category = 'user_access_matrix'
      AND lv.active = true
      AND LOWER(TRIM(lv.code)) = LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')))
      AND (lv.metadata -> 'module_permissions' ->> p_module) = 'edit'
  );
$$;

GRANT EXECUTE ON FUNCTION public.pzone_has_custom_module_edit(text) TO authenticated;

-- 2. Fix `tg_write_audit_log()` (and alias `tg_log_audit_event()`) to use
--    `public.current_user_profile_id()` and `text` `record_id`
CREATE OR REPLACE FUNCTION public.tg_write_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_changed text[] := '{}';
  v_key text;
  v_tender_id uuid;
  v_record_id text;
  v_profile_id uuid;
BEGIN
  v_profile_id := public.current_user_profile_id();

  IF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    v_record_id := COALESCE(v_new ->> 'id', '');
    v_tender_id := CASE
      WHEN TG_TABLE_NAME = 'tenders' THEN NULLIF(v_new ->> 'id', '')::uuid
      ELSE NULLIF(v_new ->> 'tender_id', '')::uuid
    END;
    INSERT INTO public.audit_log(table_name, record_id, tender_id, user_id, action, changed_fields, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_record_id, v_tender_id, v_profile_id, 'INSERT', ARRAY['*'], NULL, v_new);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_record_id := COALESCE(v_new ->> 'id', '');
    v_tender_id := CASE
      WHEN TG_TABLE_NAME = 'tenders' THEN NULLIF(v_new ->> 'id', '')::uuid
      ELSE NULLIF(v_new ->> 'tender_id', '')::uuid
    END;
    FOR v_key IN SELECT jsonb_object_keys(v_new)
    LOOP
      IF v_key NOT IN ('updated_at', 'updated_by') AND (v_old -> v_key IS DISTINCT FROM v_new -> v_key) THEN
        v_changed := array_append(v_changed, v_key);
      END IF;
    END LOOP;
    IF array_length(v_changed, 1) > 0 THEN
      INSERT INTO public.audit_log(table_name, record_id, tender_id, user_id, action, changed_fields, old_data, new_data)
      VALUES (TG_TABLE_NAME, v_record_id, v_tender_id, v_profile_id, 'UPDATE', v_changed, v_old, v_new);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_record_id := COALESCE(v_old ->> 'id', '');
    v_tender_id := CASE
      WHEN TG_TABLE_NAME = 'tenders' THEN NULLIF(v_old ->> 'id', '')::uuid
      ELSE NULLIF(v_old ->> 'tender_id', '')::uuid
    END;
    INSERT INTO public.audit_log(table_name, record_id, tender_id, user_id, action, changed_fields, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_record_id, v_tender_id, v_profile_id, 'DELETE', ARRAY['*'], v_old, NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Align `tg_compute_and_guard_tender()` with custom module matrix & ERP BOQ sync
CREATE OR REPLACE FUNCTION public.tg_compute_and_guard_tender()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_fx record;
  v_has_tender_edit boolean;
  v_has_erp_edit boolean;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    v_role := public.current_user_role();
    v_has_tender_edit := public.pzone_has_custom_module_edit('tender_log');
    v_has_erp_edit := (
      public.pzone_has_custom_module_edit('erp_geometry')
      OR public.pzone_has_custom_module_edit('erp_civil')
      OR public.pzone_has_custom_module_edit('erp_mep')
      OR public.pzone_has_custom_module_edit('erp_overheads')
    );

    IF v_role = 'viewer' AND NOT v_has_tender_edit AND NOT v_has_erp_edit THEN
      RAISE EXCEPTION 'Viewer role cannot insert or modify tenders unless granted Edit permission in Admin -> Users.';
    END IF;

    IF TG_OP = 'UPDATE' AND v_role = 'document_control' AND NOT v_has_erp_edit THEN
      IF NEW.responsible_civil_engineer_id IS DISTINCT FROM OLD.responsible_civil_engineer_id
         OR NEW.mechanical_pricing_responsible_id IS DISTINCT FROM OLD.mechanical_pricing_responsible_id
         OR NEW.electrical_pricing_responsible_id IS DISTINCT FROM OLD.electrical_pricing_responsible_id
         OR NEW.is_archived IS DISTINCT FROM OLD.is_archived
      THEN
        IF NOT public.pzone_has_custom_module_edit('kanban_team') THEN
          RAISE EXCEPTION 'Document Control cannot modify team assignments or archiving without Kanban/Team Edit permission.';
        END IF;
      END IF;
    ELSIF TG_OP = 'UPDATE' AND public.is_engineer_role(v_role) AND NOT v_has_tender_edit THEN
      IF NEW.proposal_code IS DISTINCT FROM OLD.proposal_code
         OR NEW.proposal_rev IS DISTINCT FROM OLD.proposal_rev
         OR NEW.is_latest_revision IS DISTINCT FROM OLD.is_latest_revision
         OR NEW.owner IS DISTINCT FROM OLD.owner
         OR NEW.proposal_name IS DISTINCT FROM OLD.proposal_name
         OR NEW.is_archived IS DISTINCT FROM OLD.is_archived
      THEN
        RAISE EXCEPTION 'Engineers cannot modify proposal identity or archive status without Tender Log Edit permission.';
      END IF;
    END IF;
  END IF;

  -- Compute delayed_days
  IF NEW.expected_send_date IS NOT NULL THEN
    NEW.delayed_days := GREATEST(
      0,
      (COALESCE(NEW.actual_sent_date, CURRENT_DATE) - NEW.expected_send_date)::integer
    );
  ELSE
    NEW.delayed_days := 0;
  END IF;

  -- Compute tender_total_price
  NEW.maintenance_cost := COALESCE(NEW.maintenance_cost, 0);
  NEW.supply_cost := COALESCE(NEW.supply_cost, 0);
  NEW.design_cost := COALESCE(NEW.design_cost, 0);
  NEW.civil_cost := COALESCE(NEW.civil_cost, 0);
  NEW.mechanical_cost := COALESCE(NEW.mechanical_cost, 0);
  NEW.electrical_cost := COALESCE(NEW.electrical_cost, 0);

  IF NOT COALESCE(NEW.total_price_is_manual, false) THEN
    NEW.tender_total_price := ROUND(
      NEW.maintenance_cost +
      NEW.supply_cost +
      NEW.design_cost +
      NEW.civil_cost +
      NEW.mechanical_cost +
      NEW.electrical_cost,
      2
    );
  END IF;

  -- Auto FX rate lookup on actual_sent_date
  IF NEW.actual_sent_date IS NOT NULL AND NOT COALESCE(NEW.sent_rate_is_manual, false) THEN
    IF TG_OP = 'INSERT' OR NEW.actual_sent_date IS DISTINCT FROM OLD.actual_sent_date OR NEW.exchange_rate_on_sent_date IS NULL THEN
      SELECT rate_to_usd, rate_date, source
        INTO v_fx
        FROM public.exchange_rates
       WHERE currency = 'EGP' AND rate_date <= NEW.actual_sent_date
       ORDER BY rate_date DESC
       LIMIT 1;
      IF FOUND THEN
        NEW.exchange_rate_on_sent_date := v_fx.rate_to_usd;
        NEW.sent_rate_date_used := v_fx.rate_date;
        NEW.sent_rate_source := v_fx.source;
      END IF;
    END IF;
  END IF;

  IF NEW.exchange_rate_on_sent_date IS NOT NULL AND NEW.exchange_rate_on_sent_date > 0 THEN
    NEW.tender_total_price_usd := ROUND(NEW.tender_total_price / NEW.exchange_rate_on_sent_date, 2);
  ELSE
    NEW.tender_total_price_usd := NULL;
  END IF;

  -- Auto FX rate lookup on contract date
  IF COALESCE(NEW.pr_contract_date, NEW.contract_date) IS NOT NULL AND NOT COALESCE(NEW.contract_rate_is_manual, false) THEN
    SELECT rate_to_usd, rate_date, source
      INTO v_fx
      FROM public.exchange_rates
     WHERE currency = 'EGP' AND rate_date <= COALESCE(NEW.pr_contract_date, NEW.contract_date)
     ORDER BY rate_date DESC
     LIMIT 1;
    IF FOUND THEN
      NEW.exchange_rate_on_contract_date := v_fx.rate_to_usd;
      NEW.contract_rate_date_used := v_fx.rate_date;
      NEW.contract_rate_source := v_fx.source;
    END IF;
  END IF;

  IF NEW.final_pr_contract_total_price IS NOT NULL
     AND NEW.exchange_rate_on_contract_date IS NOT NULL
     AND NEW.exchange_rate_on_contract_date > 0
  THEN
    NEW.pr_contract_total_price_usd := ROUND(NEW.final_pr_contract_total_price / NEW.exchange_rate_on_contract_date, 2);
  ELSE
    NEW.pr_contract_total_price_usd := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Align `tg_guard_tender_assignment_update()` with custom `kanban_team` Edit access
CREATE OR REPLACE FUNCTION public.tg_guard_tender_assignment_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND auth.uid() IS NOT NULL THEN
    IF NOT public.has_full_tender_authority()
       AND NOT public.pzone_has_custom_module_edit('kanban_team')
    THEN
      IF NEW.tender_id IS DISTINCT FROM OLD.tender_id
         OR NEW.user_id IS DISTINCT FROM OLD.user_id
         OR NEW.discipline IS DISTINCT FROM OLD.discipline
         OR NEW.assigned_by IS DISTINCT FROM OLD.assigned_by
         OR NEW.due_date IS DISTINCT FROM OLD.due_date
      THEN
        RAISE EXCEPTION 'Permission denied: Assigned engineers may only update their assignment status and completion note.';
      END IF;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

COMMIT;

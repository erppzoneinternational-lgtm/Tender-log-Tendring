import { createClient } from '@supabase/supabase-js';
import { nowCairoIso } from '@/components/ui/DatePickerInput';

const supabaseUrl = import.meta.env.VITE_ERP_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://your-project-ref.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_ERP_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'pzone-erp-supabase-auth-v1',
  },
});

/**
 * Mirrors authorized Gmail profiles from Admin -> Users into `public.erp_authorized_users`
 * on the ERP database when RLS is enabled on Database 2 (`owgwlrrpqxlejbdodbsd`).
 * Silently no-ops if `erp_authorized_users` has not been created yet.
 */
export async function syncErpAllowlistUsers(profiles = []) {
  try {
    if (!Array.isArray(profiles) || profiles.length === 0) return;
    const rows = profiles
      .filter((p) => p && p.email)
      .map((p) => ({
        email: String(p.email).trim().toLowerCase(),
        role: String(p.role || 'viewer'),
        active: Boolean(p.active),
        can_edit_catalog:
          p.role === 'app_admin' ||
          p.role === 'tender_manager' ||
          p.role === 'procurement_cost_control' ||
          p.module_permissions?.catalog_fx === 'edit',
        updated_at: nowCairoIso(),
      }));
    if (rows.length === 0) return;
    await supabase.from('erp_authorized_users').upsert(rows, { onConflict: 'email' });
  } catch {
    // Non-blocking before SQL migration 02_rls_intelligent_erp_db.sql is applied
  }
}

export async function deleteErpAllowlistUser(email) {
  try {
    const clean = String(email || '').trim().toLowerCase();
    if (!clean) return;
    await supabase.from('erp_authorized_users').delete().eq('email', clean);
  } catch {
    // Non-blocking before SQL migration 02_rls_intelligent_erp_db.sql is applied
  }
}

export { supabaseUrl };

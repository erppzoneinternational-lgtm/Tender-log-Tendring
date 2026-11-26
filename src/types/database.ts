export type UserRole =
  | 'app_admin'
  | 'commercial_approver'
  | 'tender_manager'
  | 'civil_tender_engineer'
  | 'mechanical_engineer'
  | 'electrical_engineer'
  | 'procurement_cost_control'
  | 'document_control'
  | 'viewer';

export const ALL_USER_ROLES: readonly UserRole[] = [
  'app_admin',
  'commercial_approver',
  'tender_manager',
  'civil_tender_engineer',
  'mechanical_engineer',
  'electrical_engineer',
  'procurement_cost_control',
  'document_control',
  'viewer',
] as const;

export const NON_APP_ADMIN_ROLES: readonly UserRole[] = [
  'commercial_approver',
  'tender_manager',
  'civil_tender_engineer',
  'mechanical_engineer',
  'electrical_engineer',
  'procurement_cost_control',
  'document_control',
  'viewer',
] as const;

export const ROLE_DEFAULT_TEAM: Record<UserRole, string> = {
  app_admin: 'App Administration',
  commercial_approver: 'Executive & Commercial Pricing',
  tender_manager: 'Tender Management',
  civil_tender_engineer: 'Civil Engineering',
  mechanical_engineer: 'Mechanical Engineering',
  electrical_engineer: 'Electrical Engineering',
  procurement_cost_control: 'Procurement & Cost Control',
  document_control: 'Document Control',
  viewer: 'Viewer',
};

export type AccessLevel = 'hidden' | 'view' | 'edit';

export type SystemModuleKey =
  | 'tender_log'
  | 'kanban_team'
  | 'erp_geometry'
  | 'erp_civil'
  | 'erp_mep'
  | 'erp_overheads'
  | 'catalog_fx'
  | 'analytics_reports';

export type ModulePermissions = Record<SystemModuleKey, AccessLevel>;

export type ThemeMode = 'light' | 'dark' | 'system';
export type AppLanguage = 'en' | 'ar';

export type DisciplineType =
  | 'Civil/Arch'
  | 'Mechanical Pricing'
  | 'Electrical Pricing';

export type AssignmentStatus = 'Assigned' | 'In Progress' | 'Waiting' | 'Finished';

export type KanbanStatus =
  | 'Not Started'
  | 'New'
  | 'Assigned'
  | 'In Progress'
  | 'Cancelled or Waiting'
  | 'Waiting'
  | 'Finished'
  | 'Sent';

export type KanbanBoardStage =
  | 'Not Started'
  | 'In Progress'
  | 'Cancelled or Waiting'
  | 'Finished'
  | 'Sent';

export interface Profile {
  id: string;
  full_name: string;
  full_name_ar?: string | null;
  role: UserRole;
  team?: string | null;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  preferred_theme: ThemeMode;
  preferred_lang: AppLanguage;
  active: boolean;
  /** Per-module permission overrides ('hidden' | 'view' | 'edit') layered on top of the selected Role Preset */
  module_permissions?: Partial<ModulePermissions>;
  /** Explicit per-user permission controlled by App Admin in Admin -> Users to view & decide Commercial Overheads (/erp/commercial-bid) */
  can_access_commercial_overheads?: boolean;
  created_at: string;
  updated_at: string;
}

export type LookupCategory =
  | 'company_directory'
  | 'owner_developer'
  | 'main_contractor'
  | 'country'
  | 'governorate'
  | 'area'
  | 'district'
  | 'pzone_role'
  | 'project_priority'
  | 'proposal_origin'
  | 'tender_status'
  | 'project_status'
  | 'final_contracted_status'
  | 'scope_of_work'
  | 'proposal_type'
  | 'water_feature'
  | 'component_shape'
  | 'water_feature_type'
  | 'filtration_method'
  | 'finishing_type'
  | 'sales_representative'
  | 'duplicate_status'
  | 'revision_reason';

export interface LookupValue {
  id: string;
  parent_id?: string | null;
  category: LookupCategory | string;
  code: string;
  label_en: string;
  label_ar: string;
  color?: string | null;
  sort_order: number;
  metadata?: {
    requires_depth?: boolean;
    icon?: string;
    country?: string;
    country_id?: string;
    governorate?: string;
    governorate_id?: string;
    area?: string;
    area_id?: string;
    default_contact_name?: string;
    default_contact_title?: string;
    default_contact_phone?: string;
    default_contact_email?: string;
    default_contact_address?: string;
    [key: string]: unknown;
  };
  active: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_by?: string | null;
  updated_at?: string;
}

export interface ExchangeRate {
  id: string;
  currency: string;
  rate_date: string; // YYYY-MM-DD
  rate_to_usd: number; // EGP per 1 USD
  source: string;
  is_manual: boolean;
  fetched_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  tender_id?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  user_role?: UserRole | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changed_fields: string[];
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  timestamp: string;
}

export interface Tender {
  id: string;
  serial_no: number;
  year: number;
  proposal_code: string;
  proposal_rev: number;
  previous_revision_id?: string | null;
  revision_reason?: string | null;
  revision_requested_by?: string | null;
  is_latest_revision: boolean;
  sales_representative_id?: string | null;
  pzone_role?: string | null;
  contractor?: string | null;
  owner: string;
  country?: string | null;
  governorate?: string | null;
  area?: string | null;
  district?: string | null;
  location?: string | null;
  proposal_origin?: string | null;
  proposal_name: string;
  total_components_area_m2: number;
  total_components_volume_m3: number;
  server_link_path?: string | null;
  scope_of_work: string[];
  components_summary: string;
  pump_room_included_in_water_features?: boolean;
  project_priority: string;
  received_date: string;
  expected_send_date?: string | null;
  deadline_date?: string | null;
  actual_sent_date?: string | null;
  tender_status: string;
  responsible_civil_engineer_id?: string | null;
  civil_assigned_at?: string | null;
  mechanical_pricing_responsible_id?: string | null;
  mechanical_assigned_at?: string | null;
  electrical_pricing_responsible_id?: string | null;
  electrical_assigned_at?: string | null;
  tender_status_notes?: string | null;
  delayed_days: number;
  currency: string;
  maintenance_cost: number;
  supply_cost: number;
  design_cost: number;
  civil_cost: number;
  mechanical_cost: number;
  electrical_cost: number;
  total_price_is_manual: boolean;
  tender_total_price: number;
  estimated_price_if_not_sent?: number | null;
  is_duplicate: string;
  duplicate_of_tender_id?: string | null;
  contact_name?: string | null;
  contact_number?: string | null;
  contact_job_title?: string | null;
  contact_email?: string | null;
  contact_address?: string | null;
  exchange_rate_on_sent_date?: number | null;
  sent_rate_date_used?: string | null;
  sent_rate_source?: string | null;
  sent_rate_is_manual: boolean;
  tender_total_price_usd?: number | null;
  project_status?: string | null;
  contract_date?: string | null;
  project_status_note?: string | null;
  pr_code?: string | null;
  project_name?: string | null;
  pr_contract_date?: string | null;
  final_pr_contract_total_price?: number | null;
  exchange_rate_on_contract_date?: number | null;
  contract_rate_date_used?: string | null;
  contract_rate_source?: string | null;
  contract_rate_is_manual: boolean;
  pr_contract_total_price_usd?: number | null;
  final_contracted_status?: string | null;
  final_contracted_status_notes?: string | null;
  is_archived: boolean;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
}

export interface ComponentSubZone {
  id: string;
  label: string;
  area_m2: number;
  depth_m: number;
  volume_m3: number;
}

export interface ProposalComponent {
  id: string;
  tender_id: string;
  sort_order: number;
  component_title?: string | null;
  water_feature: string;
  component_shape?: string | null;
  proposal_type?: string | null;
  water_feature_type: string;
  pump_room_included?: boolean;
  filtration_method?: string | null;
  finishing_type?: string | null;
  qty_same_specs: number;
  each_length_m?: number | null;
  each_width_m?: number | null;
  each_perimeter_m?: number | null;
  total_perimeter_m?: number | null;
  sub_zones?: ComponentSubZone[] | null;
  each_area_m2: number;
  each_avg_depth_m: number;
  volume_is_manual: boolean;
  each_volume_m3: number;
  total_area_m2: number;
  total_volume_m3: number;
  currency: string;
  total_maintenance_cost: number;
  total_supply_cost: number;
  total_design_cost: number;
  total_civil_cost: number;
  total_mechanical_cost: number;
  total_electrical_cost: number;
  total_price: number;
  est_price_per_m2_full_scope?: number | null;
  est_cost_full_scope?: number | null;
  est_price_per_m2_civil?: number | null;
  est_total_civil?: number | null;
  est_price_per_m2_mep?: number | null;
  est_total_mep?: number | null;
  est_total_tender?: number | null;
  avg_cost_per_m2?: number | null;
  avg_cost_per_m3?: number | null;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
}

export interface TenderDocument {
  id: string;
  tender_id: string;
  file_name: string;
  doc_type: 'RFP' | 'Drawings' | 'BOQ' | 'Addendum' | 'Quotation' | 'Other' | string;
  server_path: string;
  version: string;
  notes?: string | null;
  uploaded_by?: string | null;
  uploaded_at: string;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
}

export interface TenderAssignment {
  id: string;
  tender_id: string;
  user_id: string;
  discipline: DisciplineType;
  assigned_by?: string | null;
  assigned_at?: string | null;
  due_date?: string | null;
  status: AssignmentStatus;
  finished_note?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  tender_id: string;
  title: string;
  kanban_status: KanbanStatus;
  blocked_reason?: string | null;
  due_date?: string | null;
  progress_note?: string | null;
  completed_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  tender_id: string;
  user_id: string;
  text: string;
  attachment_path?: string | null;
  mentioned_user_ids: string[];
  created_at: string;
  updated_at: string;
}

export type NotificationEventType =
  | 'new_tender'
  | 'new_documents'
  | 'new_revision'
  | 'tender_assigned'
  | 'task_finished'
  | 'task_blocked'
  | 'pricing_updated'
  | 'due_reminder'
  | 'tender_sent'
  | 'status_awarded_lost'
  | 'comment_mention'
  | 'erp_geometry_ready'
  | 'erp_civil_boq_synced'
  | 'erp_mep_boq_synced'
  | 'erp_ready_for_commercial'
  | 'erp_commercial_bid_set'
  | 'catalog_price_updated';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationEventType;
  tender_id?: string | null;
  proposal_code?: string | null;
  title_en: string;
  title_ar: string;
  message_en: string;
  message_ar: string;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  in_app: boolean;
  muted_event_types: NotificationEventType[];
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
}

export interface SavedView {
  id: string;
  user_id: string;
  name: string;
  is_shared: boolean;
  column_group: 'all' | 'identity' | 'dates' | 'pricing' | 'contract' | 'audit';
  density: 'compact' | 'comfortable';
  filters?: Record<string, unknown>;
  column_visibility?: Record<string, boolean>;
  sorting?: { key: string; desc: boolean } | null;
}

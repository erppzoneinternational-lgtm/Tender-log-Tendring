// =============================================================================
// P.ZONE Tender Log — Role-Based Permissions & Hierarchy (7 System Roles)
// Roles:
//   - app_admin             (Whole App Admin — ONLY role with Admin, Lookups & User/Role authority)
//   - tender_manager        (Tender Manager — full operational tender & pricing authority; NO Admin/User access)
//   - civil_tender_engineer (Civil Tender Engineer)
//   - mechanical_engineer   (Mechanical Engineer)
//   - electrical_engineer   (Electrical Engineer)
//   - document_control      (Document Control — tender registration & document paths; NO Admin/User access)
//   - viewer                (Viewer — read-only)
// Tested by /tests/permissions.test.ts
// =============================================================================

import {
  ALL_USER_ROLES,
  type AccessLevel,
  type DisciplineType,
  type KanbanStatus,
  type ModulePermissions,
  type Profile,
  type SystemModuleKey,
  type Tender,
  type TenderAssignment,
  type UserRole,
} from '@/types/database';

/**
 * Fields that are automatically computed by database triggers or formulas
 * and cannot be directly typed without setting a manual override flag.
 */
export const COMPUTED_TENDER_FIELDS: ReadonlySet<keyof Tender> = new Set([
  'id',
  'serial_no',
  'previous_revision_id',
  'revision_reason',
  'revision_requested_by',
  'is_latest_revision',
  'total_components_area_m2',
  'total_components_volume_m3',
  'components_summary',
  'delayed_days',
  'tender_total_price_usd',
  'pr_contract_total_price_usd',
  'created_by',
  'created_at',
  'updated_by',
  'updated_at',
]);

/**
 * Fields editable by Document Control (Section 3 & Section 4.1 A/B/C/E):
 * Identity, client, contact, server path, scope of work, duplicate control, received/deadline dates,
 * AND post-submission Contract Switching & Contract Result fields.
 * Document Control has read-only access to tender engineering prices, and Tender Manager CANNOT overwrite these fields.
 */
export const DOCUMENT_CONTROL_EDITABLE_FIELDS: ReadonlySet<keyof Tender> = new Set([
  'year',
  'proposal_code',
  'proposal_rev',
  'sales_representative_id',
  'pzone_role',
  'contractor',
  'owner',
  'country',
  'governorate',
  'area',
  'district',
  'location',
  'proposal_origin',
  'proposal_name',
  'server_link_path',
  'scope_of_work',
  'project_priority',
  'received_date',
  'deadline_date',
  'is_duplicate',
  'duplicate_of_tender_id',
  'contact_name',
  'contact_number',
  'contact_job_title',
  'contact_email',
  'contact_address',
  'project_status',
  'contract_date',
  'project_status_note',
  'pr_code',
  'project_name',
  'pr_contract_date',
  'final_pr_contract_total_price',
  'exchange_rate_on_contract_date',
  'contract_rate_date_used',
  'contract_rate_source',
  'contract_rate_is_manual',
  'final_contracted_status',
  'final_contracted_status_notes',
]);

/**
 * Fields editable by Tender Manager:
 * Schedule (expected/actual send dates), tender workflow status & notes, team assignments,
 * and tender engineering pricing & sent FX rates.
 * Excludes Document Control registration/intake data and Document Control post-submission contract data.
 */
export const TENDER_MANAGER_EDITABLE_FIELDS: ReadonlySet<keyof Tender> = new Set([
  'expected_send_date',
  'actual_sent_date',
  'tender_status',
  'tender_status_notes',
  'responsible_civil_engineer_id',
  'civil_assigned_at',
  'mechanical_pricing_responsible_id',
  'mechanical_assigned_at',
  'electrical_pricing_responsible_id',
  'electrical_assigned_at',
  'currency',
  'maintenance_cost',
  'supply_cost',
  'design_cost',
  'civil_cost',
  'mechanical_cost',
  'electrical_cost',
  'total_price_is_manual',
  'tender_total_price',
  'estimated_price_if_not_sent',
  'exchange_rate_on_sent_date',
  'sent_rate_date_used',
  'sent_rate_source',
  'sent_rate_is_manual',
  'pump_room_included_in_water_features',
  'is_archived',
]);

/**
 * Fields editable by an Assigned Engineer (Civil, Mechanical, or Electrical):
 * Pricing fields and technical notes on assigned tenders.
 */
export const TENDER_ENGINEER_EDITABLE_FIELDS: ReadonlySet<keyof Tender> = new Set([
  'maintenance_cost',
  'supply_cost',
  'design_cost',
  'civil_cost',
  'mechanical_cost',
  'electrical_cost',
  'total_price_is_manual',
  'tender_total_price',
  'tender_status_notes',
  'pump_room_included_in_water_features',
]);

export function isAppAdmin(role: UserRole): boolean {
  return role === 'app_admin';
}

export function hasFullTenderAuthority(
  roleOrUser: UserRole | PermissionSubject
): boolean {
  if (!roleOrUser) return false;
  if (typeof roleOrUser === 'string') {
    return roleOrUser === 'app_admin' || roleOrUser === 'tender_manager';
  }
  if (roleOrUser.role === 'app_admin' || roleOrUser.role === 'tender_manager') {
    return true;
  }
  if (!isEngineerRole(roleOrUser.role) && canEditModule(roleOrUser, 'kanban_team')) {
    return true;
  }
  return false;
}

export function isEngineerRole(role: UserRole): boolean {
  return (
    role === 'civil_tender_engineer' ||
    role === 'mechanical_engineer' ||
    role === 'electrical_engineer'
  );
}

/**
 * Tender Engineers (`civil_tender_engineer`, `mechanical_engineer`, `electrical_engineer`)
 * AND any active non-admin/non-DC profile granted `edit` access on `erp_civil` or `erp_mep`
 * appear in engineer assignment dropdowns, engineer filters, and workload views.
 */
export function isAssignableEngineerOrManager(
  roleOrUser: UserRole | PermissionSubject
): boolean {
  if (!roleOrUser) return false;
  if (typeof roleOrUser === 'string') {
    return isEngineerRole(roleOrUser);
  }
  if (isEngineerRole(roleOrUser.role)) return true;
  if (
    roleOrUser.role === 'app_admin' ||
    roleOrUser.role === 'document_control'
  ) {
    return false;
  }
  return (
    canEditModule(roleOrUser, 'erp_civil') ||
    canEditModule(roleOrUser, 'erp_mep')
  );
}

export function isEngineerMatchingDiscipline(
  role: UserRole,
  discipline: DisciplineType
): boolean {
  if (discipline === 'Civil/Arch') return role === 'civil_tender_engineer';
  if (discipline === 'Mechanical Pricing') return role === 'mechanical_engineer';
  return role === 'electrical_engineer';
}

/**
 * Everyone can view all tender data, including prices, and export reports.
 */
export function canViewTenders(_role: UserRole): boolean {
  return true;
}

export function canViewPrices(_role: UserRole): boolean {
  return true;
}

export function canExportData(_role: UserRole): boolean {
  return true;
}

/**
 * App Admin, Tender Manager, and Document Control can register new tenders.
 * Only App Admin and Tender Manager create tender revisions (Document Control views & gets notified of revisions).
 */
export function canCreateTender(roleOrUser: UserRole | PermissionSubject): boolean {
  if (!roleOrUser) return false;
  if (typeof roleOrUser === 'string') {
    return (
      roleOrUser === 'app_admin' ||
      roleOrUser === 'tender_manager' ||
      roleOrUser === 'document_control'
    );
  }
  return (
    roleOrUser.role === 'app_admin' ||
    roleOrUser.role === 'tender_manager' ||
    roleOrUser.role === 'document_control' ||
    canEditModule(roleOrUser, 'tender_log')
  );
}

export function canCreateRevision(role: UserRole): boolean {
  return role === 'app_admin' || role === 'tender_manager';
}

/**
 * Document Control (and App Admin) is responsible for switching a Proposal to a Contract
 * and filling all post-submission Contract Result data.
 */
export function canManageContract(role: UserRole): boolean {
  return role === 'app_admin' || role === 'document_control';
}

/**
 * Checks whether a user with `role` can edit a specific field on `tenders`.
 * - App Admin (`app_admin`): can edit any non-computed field.
 * - Tender Manager (`tender_manager`): can edit operational, schedule, team, pricing, and contract fields ONLY (CANNOT update Document Control data).
 * - Document Control (`document_control`): can edit Document Control registration/intake fields ONLY.
 * - Engineers: can edit pricing & status notes on assigned tenders ONLY.
 */
export function canEditTenderField(
  role: UserRole,
  field: keyof Tender,
  isAssignedToTender = false
): boolean {
  if (COMPUTED_TENDER_FIELDS.has(field)) {
    return false;
  }

  if (role === 'app_admin') {
    return true;
  }

  if (role === 'tender_manager') {
    return TENDER_MANAGER_EDITABLE_FIELDS.has(field);
  }

  if (role === 'document_control') {
    return DOCUMENT_CONTROL_EDITABLE_FIELDS.has(field);
  }

  if (isEngineerRole(role)) {
    return isAssignedToTender && TENDER_ENGINEER_EDITABLE_FIELDS.has(field);
  }

  return false;
}

/**
 * App Admin, Tender Manager, and Assigned Engineers can create/edit proposal components.
 */
export function canEditComponents(
  roleOrUser: UserRole | PermissionSubject,
  isAssignedToTender = false
): boolean {
  if (!roleOrUser) return false;
  if (hasFullTenderAuthority(roleOrUser)) return true;
  if (isAssignableEngineerOrManager(roleOrUser) && isAssignedToTender) {
    return true;
  }
  return false;
}

/**
 * Determines whether a user can edit a specific engineering discipline cost
 * (`Civil/Arch`, `Mechanical Pricing`, `Electrical Pricing`) on a proposal water feature.
 * - App Admin & Tender Manager can edit all discipline costs.
 * - An assigned engineer edits their own assigned discipline(s) on the tender
 *   (including multiple disciplines if assigned to both Mechanical & Electrical),
 *   while viewing teammates' assigned discipline costs read-only so no engineer
 *   accidentally overwrites another engineer's water feature pricing.
 * - If a discipline is unassigned on the tender, any assigned engineer on that tender may fill it.
 */
export function canEditComponentDisciplineCost(
  roleOrUser: UserRole | PermissionSubject,
  userId: string,
  discipline: DisciplineType,
  assignments: ReadonlyArray<Pick<TenderAssignment, 'discipline' | 'user_id'>>
): boolean {
  if (!roleOrUser) return false;
  if (hasFullTenderAuthority(roleOrUser)) {
    return true;
  }
  if (!isAssignableEngineerOrManager(roleOrUser)) {
    return false;
  }
  const userHasAnyAssignment = assignments.some((a) => a.user_id === userId);
  if (!userHasAnyAssignment) {
    return false;
  }
  const discAsg = assignments.find((a) => a.discipline === discipline);
  if (discAsg) {
    return discAsg.user_id === userId;
  }
  return true;
}

/**
 * Document Control and App Admin can add/edit server document paths.
 * Tender Manager views and copies Document Control's paths without modifying them.
 */
export function canManageDocuments(role: UserRole): boolean {
  return role === 'app_admin' || role === 'document_control';
}

/**
 * App Admin, Tender Manager, and users granted `kanban_team: 'edit'` authority assign engineers and set due dates.
 */
export function canAssignEngineers(
  roleOrUser: UserRole | PermissionSubject
): boolean {
  return hasFullTenderAuthority(roleOrUser);
}

/**
 * Document Control (`document_control`) and Procurement (`procurement_cost_control`)
 * default to hiding Kanban Board (`/board`) unless customized via the Permission Matrix.
 */
export function canViewKanbanAndTeamManagement(
  roleOrUser: UserRole | Pick<Profile, 'role' | 'module_permissions'> | null | undefined
): boolean {
  if (!roleOrUser) return false;
  if (typeof roleOrUser === 'string') {
    return ROLE_DEFAULT_MODULE_PERMISSIONS[roleOrUser]?.kanban_team !== 'hidden';
  }
  return getModuleAccess(roleOrUser, 'kanban_team') !== 'hidden';
}

/**
 * - App Admin, Tender Manager, and non-engineer users with `kanban_team: 'edit'` can move cards anywhere (including Sent).
 * - Assigned Engineers (Civil / Mechanical / Electrical) can move cards through
 *   Assigned, In Progress, Waiting, and Finished, and once all assigned disciplines
 *   are Finished (`fromStatus === 'Finished'`), any assigned engineer can also confirm Sent.
 * - Unassigned engineers, Viewers, and Document Control cannot move Kanban task cards.
 */
export function canMoveKanbanCard(
  roleOrUser: UserRole | PermissionSubject,
  fromStatus: KanbanStatus,
  toStatus: KanbanStatus,
  isAssignedToTender = false
): boolean {
  if (!roleOrUser) return false;
  if (hasFullTenderAuthority(roleOrUser)) {
    return true;
  }

  const role = typeof roleOrUser === 'string' ? roleOrUser : roleOrUser.role;
  const canEditKanban =
    typeof roleOrUser === 'string'
      ? isEngineerRole(role)
      : canEditModule(roleOrUser, 'kanban_team');

  if ((isEngineerRole(role) || canEditKanban) && isAssignedToTender) {
    if (toStatus === 'Sent') {
      return fromStatus === 'Finished';
    }
    const allowedTargets: KanbanStatus[] = [
      'Not Started',
      'Assigned',
      'In Progress',
      'Cancelled or Waiting',
      'Waiting',
      'Finished',
    ];
    return allowedTargets.includes(toStatus);
  }

  return false;
}

/**
 * Viewers cannot comment; all other roles can comment.
 */
export function canAddComment(roleOrUser: UserRole | PermissionSubject): boolean {
  if (!roleOrUser) return false;
  if (typeof roleOrUser === 'string') {
    return roleOrUser !== 'viewer';
  }
  if (roleOrUser.role !== 'viewer') {
    return true;
  }
  return (
    canEditModule(roleOrUser, 'kanban_team') ||
    canEditModule(roleOrUser, 'tender_log')
  );
}

/**
 * Admin & Lookups Console (/admin — Users & Roles, Lookup Lists, FX Rates, Audit Log, Workspace Reset):
 * STRICTLY restricted to App Admins (`app_admin`) ONLY.
 */
export function canManageAdmin(role: UserRole): boolean {
  return role === 'app_admin';
}

/**
 * User & Role Management Authority (/admin/users):
 * STRICTLY restricted to App Admins (`app_admin`) ONLY.
 * Other roles (including Tender Manager and Document Control) cannot access
 * user management, inspect role administration, add users, or change roles.
 */
export function canManageUsers(role: UserRole): boolean {
  return role === 'app_admin';
}

/**
 * Returns true if `actorRole` has authority to edit, change the role of,
 * activate/deactivate, or remove a user whose current role is `targetUserRole`.
 * Only App Admins (`app_admin`) have authority over user accounts.
 */
export function canManageTargetUser(
  actorRole: UserRole,
  _targetUserRole: UserRole
): boolean {
  return actorRole === 'app_admin';
}

/**
 * Returns true if `actorRole` is allowed to assign `roleToAssign` to a user.
 * Only an App Admin (`app_admin`) can assign any role.
 */
export function canAssignRole(
  actorRole: UserRole,
  _roleToAssign: UserRole
): boolean {
  return actorRole === 'app_admin';
}

/**
 * Returns the list of roles that `actorRole` is allowed to assign in Admin → Users.
 */
export function getAssignableRoles(actorRole: UserRole): readonly UserRole[] {
  return actorRole === 'app_admin' ? ALL_USER_ROLES : [];
}

// =============================================================================
// 9-ROLE PRESETS + 8-MODULE VISUAL PERMISSION MATRIX (`hidden` | `view` | `edit`)
// =============================================================================

export interface SystemModuleMeta {
  key: SystemModuleKey;
  shortCode: string;
  labelEn: string;
  labelAr: string;
  descEn: string;
}

export const SYSTEM_MODULES_META: readonly SystemModuleMeta[] = [
  {
    key: 'tender_log',
    shortCode: 'TL',
    labelEn: 'Tender Log & Contracts',
    labelAr: 'سجل المناقصات والعقود',
    descEn: 'Proposal registry, intake details, revisions & contract award',
  },
  {
    key: 'kanban_team',
    shortCode: 'KB',
    labelEn: 'Kanban & Team',
    labelAr: 'لوحة المهام والفريق',
    descEn: 'Engineering task board, discipline statuses & team workload',
  },
  {
    key: 'erp_geometry',
    shortCode: 'GEO',
    labelEn: 'ERP 1: Geometry & Specs',
    labelAr: '١. أبعاد المسطحات والغرف',
    descEn: 'Water Features & Pump Rooms physical dimensions & basin sizing',
  },
  {
    key: 'erp_civil',
    shortCode: 'CIV',
    labelEn: 'ERP 2: Civil & Finishes BOQ',
    labelAr: '٢. مقايسات المدني والتشطيبات',
    descEn: 'Excavation, PC/RC concrete, waterproofing & finishes BOQ',
  },
  {
    key: 'erp_mep',
    shortCode: 'MEP',
    labelEn: 'ERP 3: Electromechanical BOQ',
    labelAr: '٣. مقايسات الكهروميكانيك',
    descEn: 'Filtration, pumps, dosing, heaters, LED lighting & panels BOQ',
  },
  {
    key: 'erp_overheads',
    shortCode: 'OVH',
    labelEn: 'ERP 4: Overheads & Profit',
    labelAr: '٤. المصاريف وهامش الربح',
    descEn: 'Indirects, mobilization, reserves, trade margins & Final Bid Price',
  },
  {
    key: 'catalog_fx',
    shortCode: 'CAT',
    labelEn: 'Master Catalog & FX Rates',
    labelAr: 'الكتالوج وأسعار الصرف',
    descEn: '1,154 equipment/material unit prices & USD/EGP exchange rates',
  },
  {
    key: 'analytics_reports',
    shortCode: 'RPT',
    labelEn: 'Analytics & Reports',
    labelAr: 'لوحة المؤشرات والتقارير',
    descEn: 'Executive KPIs, win-rate analytics & period Excel/CSV exports',
  },
] as const;

export const ROLE_DEFAULT_MODULE_PERMISSIONS: Record<UserRole, ModulePermissions> = {
  app_admin: {
    tender_log: 'edit',
    kanban_team: 'edit',
    erp_geometry: 'edit',
    erp_civil: 'edit',
    erp_mep: 'edit',
    erp_overheads: 'edit',
    catalog_fx: 'edit',
    analytics_reports: 'view',
  },
  commercial_approver: {
    tender_log: 'view',
    kanban_team: 'view',
    erp_geometry: 'view',
    erp_civil: 'view',
    erp_mep: 'view',
    erp_overheads: 'edit',
    catalog_fx: 'view',
    analytics_reports: 'view',
  },
  tender_manager: {
    tender_log: 'edit',
    kanban_team: 'edit',
    erp_geometry: 'edit',
    erp_civil: 'edit',
    erp_mep: 'edit',
    erp_overheads: 'hidden',
    catalog_fx: 'view',
    analytics_reports: 'view',
  },
  civil_tender_engineer: {
    tender_log: 'view',
    kanban_team: 'edit',
    erp_geometry: 'edit',
    erp_civil: 'edit',
    erp_mep: 'view',
    erp_overheads: 'hidden',
    catalog_fx: 'view',
    analytics_reports: 'view',
  },
  mechanical_engineer: {
    tender_log: 'view',
    kanban_team: 'edit',
    erp_geometry: 'edit',
    erp_civil: 'view',
    erp_mep: 'edit',
    erp_overheads: 'hidden',
    catalog_fx: 'view',
    analytics_reports: 'view',
  },
  electrical_engineer: {
    tender_log: 'view',
    kanban_team: 'edit',
    erp_geometry: 'edit',
    erp_civil: 'view',
    erp_mep: 'edit',
    erp_overheads: 'hidden',
    catalog_fx: 'view',
    analytics_reports: 'view',
  },
  procurement_cost_control: {
    tender_log: 'view',
    kanban_team: 'hidden',
    erp_geometry: 'hidden',
    erp_civil: 'view',
    erp_mep: 'view',
    erp_overheads: 'hidden',
    catalog_fx: 'edit',
    analytics_reports: 'view',
  },
  document_control: {
    tender_log: 'edit',
    kanban_team: 'hidden',
    erp_geometry: 'hidden',
    erp_civil: 'hidden',
    erp_mep: 'hidden',
    erp_overheads: 'hidden',
    catalog_fx: 'hidden',
    analytics_reports: 'view',
  },
  viewer: {
    tender_log: 'view',
    kanban_team: 'view',
    erp_geometry: 'hidden',
    erp_civil: 'hidden',
    erp_mep: 'hidden',
    erp_overheads: 'hidden',
    catalog_fx: 'hidden',
    analytics_reports: 'view',
  },
};

export type PermissionSubject =
  | Pick<Profile, 'role' | 'module_permissions' | 'can_access_commercial_overheads'>
  | null
  | undefined;

export function getEffectiveModulePermissions(
  user: PermissionSubject
): ModulePermissions {
  if (!user) {
    return { ...ROLE_DEFAULT_MODULE_PERMISSIONS.viewer };
  }
  const base =
    ROLE_DEFAULT_MODULE_PERMISSIONS[user.role] ||
    ROLE_DEFAULT_MODULE_PERMISSIONS.viewer;

  if (user.role === 'app_admin') {
    return { ...ROLE_DEFAULT_MODULE_PERMISSIONS.app_admin };
  }

  const merged: ModulePermissions = {
    ...base,
    ...(user.module_permissions || {}),
  };

  // Honor legacy boolean flag if set without explicit erp_overheads override
  if (
    user.module_permissions?.erp_overheads === undefined &&
    user.can_access_commercial_overheads === true
  ) {
    merged.erp_overheads = 'edit';
  }

  return merged;
}

export function getModuleAccess(
  user: PermissionSubject,
  moduleKey: SystemModuleKey
): AccessLevel {
  return getEffectiveModulePermissions(user)[moduleKey];
}

export function canViewModule(
  user: PermissionSubject,
  moduleKey: SystemModuleKey
): boolean {
  return getModuleAccess(user, moduleKey) !== 'hidden';
}

export function canEditModule(
  user: PermissionSubject,
  moduleKey: SystemModuleKey
): boolean {
  return getModuleAccess(user, moduleKey) === 'edit';
}

export function hasCustomModuleOverrides(user: PermissionSubject): boolean {
  if (!user || user.role === 'app_admin') return false;
  const base =
    ROLE_DEFAULT_MODULE_PERMISSIONS[user.role] ||
    ROLE_DEFAULT_MODULE_PERMISSIONS.viewer;
  const effective = getEffectiveModulePermissions(user);
  return SYSTEM_MODULES_META.some((m) => effective[m.key] !== base[m.key]);
}

export function canManageFxAndCatalog(user: PermissionSubject): boolean {
  if (!user) return false;
  if (user.role === 'app_admin') return true;
  return canEditModule(user, 'catalog_fx');
}

export function canAccessErpEngineering(
  roleOrUser: UserRole | PermissionSubject
): boolean {
  if (!roleOrUser) return false;
  if (typeof roleOrUser === 'string') {
    const d =
      ROLE_DEFAULT_MODULE_PERMISSIONS[roleOrUser] ||
      ROLE_DEFAULT_MODULE_PERMISSIONS.viewer;
    return (
      d.erp_geometry !== 'hidden' ||
      d.erp_civil !== 'hidden' ||
      d.erp_mep !== 'hidden'
    );
  }
  return (
    canViewModule(roleOrUser, 'erp_geometry') ||
    canViewModule(roleOrUser, 'erp_civil') ||
    canViewModule(roleOrUser, 'erp_mep')
  );
}

export function canAccessCommercialOverheads(
  user?: PermissionSubject
): boolean {
  if (!user) return false;
  return canViewModule(user, 'erp_overheads');
}

export function canOpenIntelligentTender(user?: PermissionSubject): boolean {
  if (!user) return false;
  return (
    canAccessErpEngineering(user) ||
    canAccessCommercialOverheads(user) ||
    canViewModule(user, 'catalog_fx')
  );
}

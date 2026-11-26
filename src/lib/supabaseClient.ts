// One client for the company Supabase project. The session is a cookie on the parent domain,
// shared with the Portal (erp.pzoneinternational.com) and every other company system (SSO).
import { createBrowserClient } from '@supabase/ssr';
import type { ExchangeRate, LookupValue } from '@/types/database';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  throw new Error('[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are missing');
}
// Safety net: a secret key must never reach the browser.
if (key.startsWith('sb_secret_') || key.includes('service_role')) {
  throw new Error('[Supabase] A secret key was configured in the browser. Use the publishable key.');
}

// These cookie options MUST stay exactly like this. They are identical in every company app.
function buildCookieOptions(domain: string | undefined, protocol: string) {
  return {
    domain: domain || undefined,
    path: '/',
    sameSite: 'lax' as const,
    secure: protocol === 'https:',
    maxAge: 400 * 24 * 60 * 60,
  };
}

// Default schema = tender, so every existing `.from('<table>')` keeps working unchanged.
export const supabase = createBrowserClient(url, key, {
  db: { schema: 'tender' },
  cookieOptions: buildCookieOptions(import.meta.env.VITE_AUTH_COOKIE_DOMAIN, window.location.protocol),
});

export const SYSTEM = 'tender';
export const PORTAL_URL =
  (import.meta.env.VITE_PORTAL_URL as string | undefined) || 'https://erp.pzoneinternational.com';
export const isSupabaseConfigured = import.meta.env.MODE !== 'test';

/**
 * Full seeded lookup values matching `/supabase/seed.sql` (Section 9: never hard-code dropdown values).
 */
export const DEFAULT_LOOKUP_VALUES: LookupValue[] = [
  // P.ZONE Role
  { id: 'lv-role-1', category: 'pzone_role', code: 'MAIN_CONTRACTOR', label_en: 'Main Contractor', label_ar: 'مقاول رئيسي', color: '#26336B', sort_order: 1, active: true },
  { id: 'lv-role-2', category: 'pzone_role', code: 'SUB_CONTRACTOR', label_en: 'Sub Contractor', label_ar: 'مقاول باطن', color: '#1E9090', sort_order: 2, active: true },

  // Project Priority
  { id: 'lv-prio-1', category: 'project_priority', code: 'URGENT', label_en: 'Urgent', label_ar: 'عاجل', color: '#8B1A28', sort_order: 1, active: true },
  { id: 'lv-prio-2', category: 'project_priority', code: 'HIGH', label_en: 'High', label_ar: 'مرتفع', color: '#D4741A', sort_order: 2, active: true },
  { id: 'lv-prio-3', category: 'project_priority', code: 'MEDIUM', label_en: 'Medium', label_ar: 'متوسط', color: '#1E9090', sort_order: 3, active: true },
  { id: 'lv-prio-4', category: 'project_priority', code: 'LOW', label_en: 'Low', label_ar: 'منخفض', color: '#7A9BBF', sort_order: 4, active: true },

  // Proposal Origin
  { id: 'lv-orig-1', category: 'proposal_origin', code: 'DIRECT_CLIENT', label_en: 'Direct Client Inquiry', label_ar: 'استفسار مباشر من العميل', color: '#26336B', sort_order: 1, active: true },
  { id: 'lv-orig-2', category: 'proposal_origin', code: 'CONSULTANT_RFP', label_en: 'Consultant RFP', label_ar: 'طرح استشاري', color: '#1E9090', sort_order: 2, active: true },
  { id: 'lv-orig-3', category: 'proposal_origin', code: 'SALES_LEAD', label_en: 'Sales Team Lead', label_ar: 'فريق المبيعات', color: '#5BA88A', sort_order: 3, active: true },
  { id: 'lv-orig-4', category: 'proposal_origin', code: 'REPEAT_CLIENT', label_en: 'Repeat Client', label_ar: 'عميل حالي', color: '#6A2A80', sort_order: 4, active: true },
  { id: 'lv-orig-5', category: 'proposal_origin', code: 'TENDER_PORTAL', label_en: 'Tender Portal / Invitation', label_ar: 'بوابة المناقصات', color: '#D4741A', sort_order: 5, active: true },

  // Tender Status
  { id: 'lv-stat-1', category: 'tender_status', code: 'NEW', label_en: 'New / Registered', label_ar: 'جديد / مسجل', color: '#7A9BBF', sort_order: 1, active: true },
  { id: 'lv-stat-2', category: 'tender_status', code: 'ASSIGNED', label_en: 'Assigned', label_ar: 'تم التعيين', color: '#26336B', sort_order: 2, active: true },
  { id: 'lv-stat-3', category: 'tender_status', code: 'IN_PROGRESS', label_en: 'In Progress', label_ar: 'قيد التنفيذ', color: '#1E9090', sort_order: 3, active: true },
  { id: 'lv-stat-4', category: 'tender_status', code: 'WAITING_INFO', label_en: 'Waiting for Info / Blocked', label_ar: 'بانتظار معلومات', color: '#D4741A', sort_order: 4, active: true },
  { id: 'lv-stat-5', category: 'tender_status', code: 'FINISHED', label_en: 'Finished (Ready to Send)', label_ar: 'مكتمل (جاهز للإرسال)', color: '#5BA88A', sort_order: 5, active: true },
  { id: 'lv-stat-6', category: 'tender_status', code: 'SENT', label_en: 'Sent to Client', label_ar: 'تم الإرسال للعميل', color: '#26336B', sort_order: 6, active: true },
  { id: 'lv-stat-7', category: 'tender_status', code: 'ON_HOLD', label_en: 'On Hold', label_ar: 'معلق', color: '#7A9BBF', sort_order: 7, active: true },
  { id: 'lv-stat-8', category: 'tender_status', code: 'CANCELLED', label_en: 'Cancelled / Apologized', label_ar: 'ملغى / اعتذار', color: '#8B1A28', sort_order: 8, active: true },

  // Project Status
  { id: 'lv-pstat-1', category: 'project_status', code: 'UNDER_EVALUATION', label_en: 'Under Client Evaluation', label_ar: 'قيد دراسة العميل', color: '#1E9090', sort_order: 1, active: true },
  { id: 'lv-pstat-2', category: 'project_status', code: 'SHORTLISTED', label_en: 'Shortlisted / Negotiation', label_ar: 'قائمة مختصرة / تفاوض', color: '#D4741A', sort_order: 2, active: true },
  { id: 'lv-pstat-3', category: 'project_status', code: 'AWARDED', label_en: 'Awarded', label_ar: 'تمت الترسية', color: '#5BA88A', sort_order: 3, active: true },
  { id: 'lv-pstat-4', category: 'project_status', code: 'LOST', label_en: 'Lost', label_ar: 'لم تتم الترسية', color: '#8B1A28', sort_order: 4, active: true },
  { id: 'lv-pstat-5', category: 'project_status', code: 'POSTPONED', label_en: 'Postponed', label_ar: 'مؤجل', color: '#7A9BBF', sort_order: 5, active: true },

  // Final Contracted Status
  { id: 'lv-fstat-1', category: 'final_contracted_status', code: 'CONTRACT_SIGNED', label_en: 'Contract Signed', label_ar: 'تم توقيع العقد', color: '#5BA88A', sort_order: 1, active: true },
  { id: 'lv-fstat-2', category: 'final_contracted_status', code: 'LOI_ISSUED', label_en: 'LOI / Notice to Proceed', label_ar: 'خطاب ترسية', color: '#1E9090', sort_order: 2, active: true },
  { id: 'lv-fstat-3', category: 'final_contracted_status', code: 'PENDING_SIGNATURE', label_en: 'Pending Signature', label_ar: 'بانتظار التوقيع', color: '#D4741A', sort_order: 3, active: true },
  { id: 'lv-fstat-4', category: 'final_contracted_status', code: 'NOT_CONTRACTED', label_en: 'Not Contracted', label_ar: 'غير متعاقد', color: '#7A9BBF', sort_order: 4, active: true },

  // Scope of Work
  { id: 'lv-scope-1', category: 'scope_of_work', code: 'DESIGN', label_en: 'Design & Engineering', label_ar: 'التصميم والهندسة', color: '#6A2A80', sort_order: 1, active: true },
  { id: 'lv-scope-2', category: 'scope_of_work', code: 'CIVIL', label_en: 'Civil & Structural Works', label_ar: 'الأعمال المدنية والإنشائية', color: '#D4741A', sort_order: 2, active: true },
  { id: 'lv-scope-3', category: 'scope_of_work', code: 'MECHANICAL', label_en: 'Mechanical Works', label_ar: 'الأعمال الميكانيكية', color: '#1E9090', sort_order: 3, active: true },
  { id: 'lv-scope-4', category: 'scope_of_work', code: 'ELECTRICAL', label_en: 'Electrical & Automation', label_ar: 'الأعمال الكهربائية والتحكم', color: '#D81E78', sort_order: 4, active: true },
  { id: 'lv-scope-5', category: 'scope_of_work', code: 'SUPPLY', label_en: 'Equipment Supply Only', label_ar: 'توريد المعدات فقط', color: '#26336B', sort_order: 5, active: true },
  { id: 'lv-scope-6', category: 'scope_of_work', code: 'FINISHING', label_en: 'Waterproofing & Finishing', label_ar: 'العزل والتشطيبات', color: '#5BA88A', sort_order: 6, active: true },
  { id: 'lv-scope-7', category: 'scope_of_work', code: 'MAINTENANCE', label_en: 'Operation & Maintenance (O&M)', label_ar: 'التشغيل والصيانة', color: '#7A9BBF', sort_order: 7, active: true },

  // Proposal Type
  { id: 'lv-ptype-1', category: 'proposal_type', code: 'FULL_TURNKEY', label_en: 'Full Turnkey (Civil + MEP)', label_ar: 'تسليم مفتاح كامل (مدني + كهروميكانيك)', color: '#26336B', sort_order: 1, active: true },
  { id: 'lv-ptype-2', category: 'proposal_type', code: 'MEP_ONLY', label_en: 'MEP Package Only', label_ar: 'حزمة كهروميكانيك فقط', color: '#1E9090', sort_order: 2, active: true },
  { id: 'lv-ptype-3', category: 'proposal_type', code: 'CIVIL_ONLY', label_en: 'Civil Works Only', label_ar: 'أعمال مدنية فقط', color: '#D4741A', sort_order: 3, active: true },
  { id: 'lv-ptype-4', category: 'proposal_type', code: 'SUPPLY_INSTALL', label_en: 'Supply & Installation', label_ar: 'توريد وتركيب', color: '#5BA88A', sort_order: 4, active: true },
  { id: 'lv-ptype-5', category: 'proposal_type', code: 'DESIGN_BUILD', label_en: 'Design & Build', label_ar: 'تصميم وتنفيذ', color: '#6A2A80', sort_order: 5, active: true },

  // =========================================================================
  // OFFICIAL COMPONENT DATABASES (Component, Component Type, Filtration Methods, Finishing Types)
  // =========================================================================

  // 1. Component (water_feature — 20 separated items + Pump Room & Pump Room with Balance Tank)
  { id: 'lv-wf-1', category: 'water_feature', code: 'CONCRETE_BASE_LAGOON', label_en: 'Concrete Base Lagoon', label_ar: 'لاجون قاعدة خرسانية', color: '#1E9090', sort_order: 1, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-2', category: 'water_feature', code: 'SAND_BASE_LAGOON', label_en: 'Sand Base Lagoon', label_ar: 'لاجون قاعدة رملية', color: '#5BA88A', sort_order: 2, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-3', category: 'water_feature', code: 'SWIMMING_POOL', label_en: 'Swimming Pool', label_ar: 'حمام سباحة', color: '#1E9090', sort_order: 3, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-4', category: 'water_feature', code: 'OLYMPIC_POOL', label_en: 'Olympic Pool', label_ar: 'حمام سباحة أولمبي', color: '#26336B', sort_order: 4, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-5', category: 'water_feature', code: 'FIBER_GLASS_SWIMMING_POOL', label_en: 'Fiber Glass Swimming Pool', label_ar: 'حمام سباحة فايبر جلاس', color: '#1E9090', sort_order: 5, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-6', category: 'water_feature', code: 'WATER_FOUNTAIN', label_en: 'Water Fountain', label_ar: 'نافورة مائية', color: '#D81E78', sort_order: 6, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-7', category: 'water_feature', code: 'WATER_TANK', label_en: 'Water Tank', label_ar: 'خزان مياه', color: '#26336B', sort_order: 7, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-8', category: 'water_feature', code: 'WATER_DESALINATION_PLANT', label_en: 'Water Desalination Plant', label_ar: 'محطة تحلية مياه', color: '#6A2A80', sort_order: 8, metadata: { requires_depth: false }, active: true },
  { id: 'lv-wf-9', category: 'water_feature', code: 'JACUZZI', label_en: 'Jacuzzi', label_ar: 'جاكوزي', color: '#8B1A28', sort_order: 9, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-10', category: 'water_feature', code: 'WATER_FALL', label_en: 'Water Fall', label_ar: 'شلال مائي', color: '#1E9090', sort_order: 10, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-11', category: 'water_feature', code: 'AQUA_PARK', label_en: 'Aqua Park', label_ar: 'أكوا بارك', color: '#D4741A', sort_order: 11, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-12', category: 'water_feature', code: 'AQUATONIC_SWIMMING_POOLS', label_en: 'Aquatonic Swimming Pools', label_ar: 'حمامات سباحة أكواتونيك', color: '#1E9090', sort_order: 12, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-13', category: 'water_feature', code: 'WATER_WALL', label_en: 'Water Wall', label_ar: 'جدار مائي', color: '#6A2A80', sort_order: 13, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-14', category: 'water_feature', code: 'LAGOON', label_en: 'Lagoon', label_ar: 'لاجون', color: '#5BA88A', sort_order: 14, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-15', category: 'water_feature', code: 'LAKES', label_en: 'Lakes', label_ar: 'بحيرات', color: '#7A9BBF', sort_order: 15, metadata: { requires_depth: true }, active: true },
  { id: 'lv-wf-17', category: 'water_feature', code: 'SAUNA_ROOM', label_en: 'Sauna Room', label_ar: 'غرفة ساونا', color: '#D4741A', sort_order: 16, metadata: { requires_depth: false }, active: true },
  { id: 'lv-wf-18', category: 'water_feature', code: 'STEAM_ROOM', label_en: 'Steam Room', label_ar: 'غرفة بخار', color: '#7A9BBF', sort_order: 17, metadata: { requires_depth: false }, active: true },
  { id: 'lv-wf-26', category: 'water_feature', code: 'PUMP_ROOM', label_en: 'Pump Room', label_ar: 'غرفة طلمبات', color: '#1E9090', sort_order: 18, metadata: { requires_depth: false }, active: true },
  { id: 'lv-wf-27', category: 'water_feature', code: 'PUMP_ROOM_WITH_BALANCE_TANK', label_en: 'Pump Room with Balance Tank', label_ar: 'غرفة طلمبات مع خزان موازنة', color: '#26336B', sort_order: 19, metadata: { requires_depth: false }, active: true },
  { id: 'lv-wf-25', category: 'water_feature', code: 'SPA', label_en: 'SPA', label_ar: 'سبا (SPA)', color: '#8B1A28', sort_order: 20, metadata: { requires_depth: true }, active: true },

  // 1b. Component Shape (component_shape — Rectangle & Free Form only)
  { id: 'lv-cshape-1', category: 'component_shape', code: 'RECTANGLE', label_en: 'Rectangle', label_ar: 'مستطيل', color: '#1E9090', sort_order: 1, active: true },
  { id: 'lv-cshape-2', category: 'component_shape', code: 'FREE_FORM', label_en: 'Free Form', label_ar: 'شكل حر / غير منتظم', color: '#5BA88A', sort_order: 2, active: true },

  // 2. Component Type (water_feature_type — 6 items)
  { id: 'lv-ctype-1', category: 'water_feature_type', code: 'SKIMMER', label_en: 'Skimmer', label_ar: 'اسكيمر', color: '#1E9090', sort_order: 1, active: true },
  { id: 'lv-ctype-2', category: 'water_feature_type', code: 'SKIMFILTER', label_en: 'Skimfilter', label_ar: 'سكيم فلتر', color: '#5BA88A', sort_order: 2, active: true },
  { id: 'lv-ctype-3', category: 'water_feature_type', code: 'OVERFLOW', label_en: 'Overflow', label_ar: 'أوفرفلو', color: '#26336B', sort_order: 3, active: true },
  { id: 'lv-ctype-4', category: 'water_feature_type', code: 'HORIZON', label_en: 'Horizon', label_ar: 'هورايزون', color: '#6A2A80', sort_order: 4, active: true },
  { id: 'lv-ctype-5', category: 'water_feature_type', code: 'SKIMMER_OVERFLOW', label_en: 'Skimmer + Overflow', label_ar: 'اسكيمر + أوفرفلو', color: '#D4741A', sort_order: 5, active: true },
  { id: 'lv-ctype-6', category: 'water_feature_type', code: 'COMPACT_UNIT', label_en: 'Compact Unit', label_ar: 'وحدة مدمجة', color: '#7A9BBF', sort_order: 6, active: true },

  // 3. Filtration Methods (filtration_method — 7 items)
  { id: 'lv-fmeth-1', category: 'filtration_method', code: 'SAND_FILTER', label_en: 'Sand Filter', label_ar: 'فلتر رملي', color: '#1E9090', sort_order: 1, active: true },
  { id: 'lv-fmeth-2', category: 'filtration_method', code: 'RMF_FILTER', label_en: 'RMF Filter', label_ar: 'فلتر RMF', color: '#26336B', sort_order: 2, active: true },
  { id: 'lv-fmeth-3', category: 'filtration_method', code: 'SKIMFILTER', label_en: 'Skimfilter', label_ar: 'سكيم فلتر', color: '#5BA88A', sort_order: 3, active: true },
  { id: 'lv-fmeth-4', category: 'filtration_method', code: 'COMPACT_UNIT', label_en: 'Compact unit', label_ar: 'وحدة مدمجة', color: '#6A2A80', sort_order: 4, active: true },
  { id: 'lv-fmeth-5', category: 'filtration_method', code: 'CARTRIDGE_FILTER', label_en: 'Cartridge filter', label_ar: 'فلتر خرطوشي', color: '#D4741A', sort_order: 5, active: true },
  { id: 'lv-fmeth-6', category: 'filtration_method', code: 'AERATOR_AND_CIRCULATOR', label_en: 'aerator and circulator', label_ar: 'هوايات وتقليب', color: '#7A9BBF', sort_order: 6, active: true },
  { id: 'lv-fmeth-7', category: 'filtration_method', code: 'SAND_FILTER_AND_SKIMFILTER', label_en: 'Sand Filter & Skimfilter', label_ar: 'فلتر رملي وسكيم فلتر', color: '#D81E78', sort_order: 7, active: true },

  // 4. Finishing Types (finishing_type — 11 items)
  { id: 'lv-ftype-1', category: 'finishing_type', code: 'MOSAIC', label_en: 'Mosaic', label_ar: 'موزاييك', color: '#1E9090', sort_order: 1, active: true },
  { id: 'lv-ftype-2', category: 'finishing_type', code: 'LINER', label_en: 'Liner', label_ar: 'لاينر', color: '#5BA88A', sort_order: 2, active: true },
  { id: 'lv-ftype-3', category: 'finishing_type', code: 'CERAMIC', label_en: 'Ceramic', label_ar: 'سيراميك', color: '#26336B', sort_order: 3, active: true },
  { id: 'lv-ftype-4', category: 'finishing_type', code: 'NOT_IN_SCOPE', label_en: 'Not in Scope', label_ar: 'خارج النطاق', color: '#7A9BBF', sort_order: 4, active: true },
  { id: 'lv-ftype-5', category: 'finishing_type', code: 'TRIESTA', label_en: 'Triesta', label_ar: 'تريستا', color: '#D81E78', sort_order: 5, active: true },
  { id: 'lv-ftype-6', category: 'finishing_type', code: 'MOSAIC_AND_LINER', label_en: 'Mosaic & Liner', label_ar: 'موزاييك ولاينر', color: '#1E9090', sort_order: 6, active: true },
  { id: 'lv-ftype-7', category: 'finishing_type', code: 'CONCRETE', label_en: 'Concrete', label_ar: 'خرسانة', color: '#D4741A', sort_order: 7, active: true },
  { id: 'lv-ftype-8', category: 'finishing_type', code: 'DOUBLE_BLACK', label_en: 'Double black', label_ar: 'دبل بلاك', color: '#26336B', sort_order: 8, active: true },
  { id: 'lv-ftype-9', category: 'finishing_type', code: 'ALIPHATIC_POLYURETHANE', label_en: 'Aliphatic Polyurethane', label_ar: 'بولي يوريثان أليفاتيك', color: '#6A2A80', sort_order: 9, active: true },
  { id: 'lv-ftype-10', category: 'finishing_type', code: 'ASWAN_GRANITE', label_en: 'Aswan Granite', label_ar: 'جرانيت أسواني', color: '#8B1A28', sort_order: 10, active: true },
  { id: 'lv-ftype-11', category: 'finishing_type', code: 'GRAVEL_AND_EPDM', label_en: 'Gravel and EPDM', label_ar: 'زلط وغشاء EPDM', color: '#5BA88A', sort_order: 11, active: true },

  // =========================================================================
  // UNIFIED OWNERS / DEVELOPERS & MAIN CONTRACTORS DATABASE (company_directory)
  // Both Owner/Developer and Main Contractor fields read from and write to this
  // single shared database so they always have the exact same company list.
  // =========================================================================
  { id: 'lv-comp-1', category: 'company_directory', code: 'DIRECT_OWNER', label_en: 'Direct Owner (No Main Contractor)', label_ar: 'تعاقد مباشر مع المالك', color: '#5BA88A', sort_order: 1, active: true },
  { id: 'lv-comp-2', category: 'company_directory', code: 'EMAAR_MISR', label_en: 'Emaar Misr', label_ar: 'إعمار مصر للتنمية', color: '#26336B', sort_order: 2, metadata: { default_contact_address: 'Uptown Cairo Head Office, Mokattam, Cairo' }, active: true },
  { id: 'lv-comp-3', category: 'company_directory', code: 'SODIC', label_en: 'SODIC', label_ar: 'سوديك (السادس من أكتوبر للتنمية)', color: '#1E9090', sort_order: 3, metadata: { default_contact_address: 'SODIC West, Km 38 Cairo-Alex Desert Rd, Sheikh Zayed' }, active: true },
  { id: 'lv-comp-4', category: 'company_directory', code: 'PALM_HILLS', label_en: 'Palm Hills Developments', label_ar: 'بالم هيلز للتعمير', color: '#D4741A', sort_order: 4, metadata: { default_contact_address: 'Smart Village, 6th of October, Giza' }, active: true },
  { id: 'lv-comp-5', category: 'company_directory', code: 'TMG', label_en: 'TMG (Talaat Moustafa Group)', label_ar: 'مجموعة طلعت مصطفى القابضة', color: '#5BA88A', sort_order: 5, metadata: { default_contact_address: '36 Mosaddak St., Dokki, Giza' }, active: true },
  { id: 'lv-comp-6', category: 'company_directory', code: 'MOUNTAIN_VIEW', label_en: 'Mountain View (DMG)', label_ar: 'ماونتن فيو للتنمية والاستثمار العقاري', color: '#26336B', sort_order: 6, metadata: { default_contact_address: '5th Settlement, New Cairo' }, active: true },
  { id: 'lv-comp-7', category: 'company_directory', code: 'ORASCOM_DEV', label_en: 'Orascom Development Egypt', label_ar: 'أوراسكوم للتنمية مصر', color: '#1E9090', sort_order: 7, metadata: { default_contact_address: 'Nile City Towers, Corniche El Nil, Cairo' }, active: true },
  { id: 'lv-comp-8', category: 'company_directory', code: 'ORASCOM_CONST', label_en: 'Orascom Construction', label_ar: 'أوراسكوم للإنشاءات', color: '#1E9090', sort_order: 8, active: true },
  { id: 'lv-comp-9', category: 'company_directory', code: 'ORA_DEVELOPERS', label_en: 'Ora Developers', label_ar: 'أورا ديفلوبرز', color: '#D81E78', sort_order: 9, metadata: { default_contact_address: 'ZED Park Office, Sheikh Zayed' }, active: true },
  { id: 'lv-comp-10', category: 'company_directory', code: 'HASSAN_ALLAM_PROP', label_en: 'Hassan Allam Properties (HAP)', label_ar: 'حسن علام العقارية', color: '#1E9090', sort_order: 10, active: true },
  { id: 'lv-comp-11', category: 'company_directory', code: 'HASSAN_ALLAM_CONST', label_en: 'Hassan Allam Construction', label_ar: 'حسن علام للإنشاءات', color: '#26336B', sort_order: 11, active: true },
  { id: 'lv-comp-12', category: 'company_directory', code: 'HYDE_PARK', label_en: 'Hyde Park Developments', label_ar: 'هايد بارك للتطوير العقاري', color: '#5BA88A', sort_order: 12, metadata: { default_contact_address: 'Road 90, 5th Settlement, New Cairo' }, active: true },
  { id: 'lv-comp-13', category: 'company_directory', code: 'TATWEER_MISR', label_en: 'Tatweer Misr', label_ar: 'تطوير مصر', color: '#D4741A', sort_order: 13, metadata: { default_contact_address: 'Arkan Plaza, Sheikh Zayed' }, active: true },
  { id: 'lv-comp-14', category: 'company_directory', code: 'MARAKEZ', label_en: 'Marakez', label_ar: 'مراكز للاستثمار العقاري', color: '#6A2A80', sort_order: 14, active: true },
  { id: 'lv-comp-15', category: 'company_directory', code: 'CITY_EDGE', label_en: 'City Edge Developments', label_ar: 'سيتي إيدج للتطوير العقاري', color: '#26336B', sort_order: 15, active: true },
  { id: 'lv-comp-16', category: 'company_directory', code: 'MADINET_MASR', label_en: 'Madinet Masr (MNHD)', label_ar: 'مدينة مصر للإسكان والتعمير', color: '#D81E78', sort_order: 16, active: true },
  { id: 'lv-comp-17', category: 'company_directory', code: 'LA_VISTA', label_en: 'La Vista Developments', label_ar: 'لافيستا للتطوير العقاري', color: '#5BA88A', sort_order: 17, active: true },
  { id: 'lv-comp-18', category: 'company_directory', code: 'AL_AHLY_SABBOUR', label_en: 'Al Ahly Sabbour', label_ar: 'الأهلي صبور للتنمية العقارية', color: '#26336B', sort_order: 18, active: true },
  { id: 'lv-comp-19', category: 'company_directory', code: 'MISR_ITALIA', label_en: 'Misr Italia Properties', label_ar: 'مصر إيطاليا العقارية', color: '#D4741A', sort_order: 19, active: true },
  { id: 'lv-comp-20', category: 'company_directory', code: 'INERTIA_EGYPT', label_en: 'Inertia Egypt', label_ar: 'إنرشيا للتنمية العقارية', color: '#6A2A80', sort_order: 20, active: true },
  { id: 'lv-comp-21', category: 'company_directory', code: 'MAVENS_DEV', label_en: 'Mavens Developments', label_ar: 'مافن للتطوير العقاري', color: '#1E9090', sort_order: 21, active: true },
  { id: 'lv-comp-22', category: 'company_directory', code: 'AL_FUTTAIM', label_en: 'Al-Futtaim Group Real Estate (CFC)', label_ar: 'مجموعة الفطيم العقارية (كايرو فيستيفال)', color: '#26336B', sort_order: 22, active: true },
  { id: 'lv-comp-23', category: 'company_directory', code: 'BADRELDIN', label_en: 'Badreldin Developments', label_ar: 'بدر الدين للتطوير العقاري', color: '#5BA88A', sort_order: 23, active: true },
  { id: 'lv-comp-24', category: 'company_directory', code: 'LMD', label_en: 'LMD (Landmark Sabbour)', label_ar: 'لاند مارك صبور (LMD)', color: '#7A9BBF', sort_order: 24, active: true },
  { id: 'lv-comp-25', category: 'company_directory', code: 'NEW_GIZA', label_en: 'NEWGIZA Real Estate & Development', label_ar: 'نيو جيزة للتنمية العقارية', color: '#D4741A', sort_order: 25, active: true },
  { id: 'lv-comp-26', category: 'company_directory', code: 'IL_CAZAR', label_en: 'IL Cazar Developments', label_ar: 'إل كازار للتطوير العقاري', color: '#6A2A80', sort_order: 26, active: true },
  { id: 'lv-comp-27', category: 'company_directory', code: 'ROWAD_RME', label_en: 'Rowad Modern Engineering (RME)', label_ar: 'رواد الهندسة الحديثة', color: '#D4741A', sort_order: 27, active: true },
  { id: 'lv-comp-28', category: 'company_directory', code: 'REDCON_CONST', label_en: 'Redcon Construction', label_ar: 'ريدكون للتعمير', color: '#8B1A28', sort_order: 28, active: true },
  { id: 'lv-comp-29', category: 'company_directory', code: 'SIAC_CONST', label_en: 'SIAC Construction', label_ar: 'سياك للإنشاءات (الشركة الصناعية الهندسية)', color: '#26336B', sort_order: 29, active: true },
  { id: 'lv-comp-30', category: 'company_directory', code: 'ARAB_CONTRACTORS', label_en: 'The Arab Contractors (Osman Ahmed Osman)', label_ar: 'المقاولون العرب (عثمان أحمد عثمان)', color: '#5BA88A', sort_order: 30, active: true },
  { id: 'lv-comp-31', category: 'company_directory', code: 'ATRIUM', label_en: 'Atrium Quality Contractors', label_ar: 'أتريوم للمقاولات', color: '#1E9090', sort_order: 31, active: true },
  { id: 'lv-comp-32', category: 'company_directory', code: 'CONCRETE_PLUS', label_en: 'Concrete Plus Engineering & Construction', label_ar: 'كونكريت بلس للهندسة والإنشاءات', color: '#D4741A', sort_order: 32, active: true },
  { id: 'lv-comp-33', category: 'company_directory', code: 'CCC', label_en: 'Consolidated Contractors Company (CCC)', label_ar: 'شركة اتحاد المقاولين العالمية (CCC)', color: '#6A2A80', sort_order: 33, active: true },
  { id: 'lv-comp-34', category: 'company_directory', code: 'DETAC', label_en: 'Detac Construction', label_ar: 'ديتاك للإنشاءات', color: '#26336B', sort_order: 34, active: true },
  { id: 'lv-comp-35', category: 'company_directory', code: 'GAMA_CONST', label_en: 'Gama Construction', label_ar: 'جاما للإنشاءات', color: '#1E9090', sort_order: 35, active: true },
  { id: 'lv-comp-36', category: 'company_directory', code: 'SOLID_CONST', label_en: 'Solid Construction', label_ar: 'سوليد للإنشاءات', color: '#5BA88A', sort_order: 36, active: true },
  { id: 'lv-comp-37', category: 'company_directory', code: 'SAMCRETE', label_en: 'Samcrete Engineers & Contractors', label_ar: 'سامكريت مصر - مهندسون ومقاولون', color: '#D81E78', sort_order: 37, active: true },
  { id: 'lv-comp-38', category: 'company_directory', code: 'ELSEWEDY_PSP', label_en: 'Elsewedy Electric PSP', label_ar: 'السويدي إليكتريك للمشروعات', color: '#8B1A28', sort_order: 38, active: true },
  { id: 'lv-comp-39', category: 'company_directory', code: 'KHARAFI_NATIONAL', label_en: 'Kharafi National', label_ar: 'الخرافي ناشيونال', color: '#26336B', sort_order: 39, active: true },
  { id: 'lv-comp-40', category: 'company_directory', code: 'PETROJET', label_en: 'Petrojet', label_ar: 'بتروجيت', color: '#D4741A', sort_order: 40, active: true },
  { id: 'lv-comp-41', category: 'company_directory', code: 'ASGC', label_en: 'ASGC Construction', label_ar: 'الشعفار للإنشاءات (ASGC)', color: '#1E9090', sort_order: 41, active: true },
  { id: 'lv-comp-42', category: 'company_directory', code: 'DORRA_CRC', label_en: 'Dorra Group (CRC)', label_ar: 'مجموعة درة للمقاولات (CRC)', color: '#6A2A80', sort_order: 42, active: true },
  { id: 'lv-comp-43', category: 'company_directory', code: 'BUILT_CONT', label_en: 'Built Contracting', label_ar: 'بيلت للمقاولات', color: '#7A9BBF', sort_order: 43, active: true },
  { id: 'lv-comp-44', category: 'company_directory', code: 'ROSHN_KSA', label_en: 'ROSHN Group (KSA)', label_ar: 'مجموعة روشن العقارية - السعودية', color: '#5BA88A', sort_order: 44, active: true },
  { id: 'lv-comp-45', category: 'company_directory', code: 'DIRIYAH_KSA', label_en: 'Diriyah Company (KSA)', label_ar: 'شركة الدرعية - السعودية', color: '#D4741A', sort_order: 45, active: true },
  { id: 'lv-comp-46', category: 'company_directory', code: 'ALDAR_UAE', label_en: 'Aldar Properties', label_ar: 'الدار العقارية', color: '#26336B', sort_order: 46, active: true },

  // =========================================================================
  // COUNTRIES DATABASE (country)
  // =========================================================================
  { id: 'lv-cnt-1', category: 'country', code: 'EGYPT', label_en: 'Egypt', label_ar: 'مصر', color: '#26336B', sort_order: 1, active: true },
  { id: 'lv-cnt-2', category: 'country', code: 'KSA', label_en: 'Saudi Arabia (KSA)', label_ar: 'المملكة العربية السعودية', color: '#5BA88A', sort_order: 2, active: true },
  { id: 'lv-cnt-3', category: 'country', code: 'UAE', label_en: 'United Arab Emirates (UAE)', label_ar: 'الإمارات العربية المتحدة', color: '#1E9090', sort_order: 3, active: true },
  { id: 'lv-cnt-4', category: 'country', code: 'QATAR', label_en: 'Qatar', label_ar: 'قطر', color: '#8B1A28', sort_order: 4, active: true },
  { id: 'lv-cnt-5', category: 'country', code: 'KUWAIT', label_en: 'Kuwait', label_ar: 'الكويت', color: '#D4741A', sort_order: 5, active: true },
  { id: 'lv-cnt-6', category: 'country', code: 'OMAN', label_en: 'Oman', label_ar: 'سلطنة عمان', color: '#D81E78', sort_order: 6, active: true },
  { id: 'lv-cnt-7', category: 'country', code: 'BAHRAIN', label_en: 'Bahrain', label_ar: 'البحرين', color: '#8B1A28', sort_order: 7, active: true },
  { id: 'lv-cnt-8', category: 'country', code: 'JORDAN', label_en: 'Jordan', label_ar: 'الأردن', color: '#6A2A80', sort_order: 8, active: true },
  { id: 'lv-cnt-9', category: 'country', code: 'LIBYA', label_en: 'Libya', label_ar: 'ليبيا', color: '#5BA88A', sort_order: 9, active: true },
  { id: 'lv-cnt-10', category: 'country', code: 'IRAQ', label_en: 'Iraq', label_ar: 'العراق', color: '#7A9BBF', sort_order: 10, active: true },

  // =========================================================================
  // GOVERNORATES / PROVINCES DATABASE (governorate — Listed for EVERY Country)
  // =========================================================================
  // 1. Egypt (All 27 Governorates)
  { id: 'lv-gov-1', category: 'governorate', code: 'GOV_CAIRO', label_en: 'Cairo', label_ar: 'القاهرة', color: '#26336B', sort_order: 1, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-2', category: 'governorate', code: 'GOV_GIZA', label_en: 'Giza', label_ar: 'الجيزة', color: '#D4741A', sort_order: 2, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-3', category: 'governorate', code: 'GOV_MATROUH', label_en: 'Matrouh', label_ar: 'مطروح', color: '#1E9090', sort_order: 3, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-4', category: 'governorate', code: 'GOV_RED_SEA', label_en: 'Red Sea', label_ar: 'البحر الأحمر', color: '#D81E78', sort_order: 4, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-5', category: 'governorate', code: 'GOV_SUEZ', label_en: 'Suez', label_ar: 'السويس', color: '#5BA88A', sort_order: 5, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-6', category: 'governorate', code: 'GOV_SOUTH_SINAI', label_en: 'South Sinai', label_ar: 'جنوب سيناء', color: '#6A2A80', sort_order: 6, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-7', category: 'governorate', code: 'GOV_ALEXANDRIA', label_en: 'Alexandria', label_ar: 'الإسكندرية', color: '#1E9090', sort_order: 7, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-8', category: 'governorate', code: 'GOV_NORTH_SINAI', label_en: 'North Sinai', label_ar: 'شمال سيناء', color: '#7A9BBF', sort_order: 8, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-9', category: 'governorate', code: 'GOV_ISMAILIA', label_en: 'Ismailia', label_ar: 'الإسماعيلية', color: '#1E9090', sort_order: 9, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-10', category: 'governorate', code: 'GOV_PORT_SAID', label_en: 'Port Said', label_ar: 'بورسعيد', color: '#26336B', sort_order: 10, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-11', category: 'governorate', code: 'GOV_DAKAHLIA', label_en: 'Dakahlia', label_ar: 'الدقهلية', color: '#5BA88A', sort_order: 11, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-12', category: 'governorate', code: 'GOV_DAMIETTA', label_en: 'Damietta', label_ar: 'دمياط', color: '#D4741A', sort_order: 12, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-13', category: 'governorate', code: 'GOV_SHARQIA', label_en: 'Sharqia', label_ar: 'الشرقية', color: '#5BA88A', sort_order: 13, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-14', category: 'governorate', code: 'GOV_QALYUBIA', label_en: 'Qalyubia', label_ar: 'القليوبية', color: '#7A9BBF', sort_order: 14, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-15', category: 'governorate', code: 'GOV_GHARBIA', label_en: 'Gharbia', label_ar: 'الغربية', color: '#26336B', sort_order: 15, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-16', category: 'governorate', code: 'GOV_MONUFIA', label_en: 'Monufia', label_ar: 'المنوفية', color: '#5BA88A', sort_order: 16, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-17', category: 'governorate', code: 'GOV_BEHEIRA', label_en: 'Beheira', label_ar: 'البحيرة', color: '#1E9090', sort_order: 17, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-18', category: 'governorate', code: 'GOV_KAFR_ELSHEIKH', label_en: 'Kafr El Sheikh', label_ar: 'كفر الشيخ', color: '#7A9BBF', sort_order: 18, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-19', category: 'governorate', code: 'GOV_FAIYUM', label_en: 'Faiyum', label_ar: 'الفيوم', color: '#5BA88A', sort_order: 19, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-20', category: 'governorate', code: 'GOV_BENI_SUEF', label_en: 'Beni Suef', label_ar: 'بني سويف', color: '#D4741A', sort_order: 20, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-21', category: 'governorate', code: 'GOV_MINYA', label_en: 'Minya', label_ar: 'المنيا', color: '#6A2A80', sort_order: 21, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-22', category: 'governorate', code: 'GOV_ASSIUT', label_en: 'Assiut', label_ar: 'أسيوط', color: '#26336B', sort_order: 22, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-23', category: 'governorate', code: 'GOV_SOHAG', label_en: 'Sohag', label_ar: 'سوهاج', color: '#7A9BBF', sort_order: 23, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-24', category: 'governorate', code: 'GOV_QENA', label_en: 'Qena', label_ar: 'قنا', color: '#D4741A', sort_order: 24, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-25', category: 'governorate', code: 'GOV_LUXOR', label_en: 'Luxor', label_ar: 'الأقصر', color: '#D81E78', sort_order: 25, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-26', category: 'governorate', code: 'GOV_ASWAN', label_en: 'Aswan', label_ar: 'أسوان', color: '#1E9090', sort_order: 26, metadata: { country: 'Egypt' }, active: true },
  { id: 'lv-gov-27', category: 'governorate', code: 'GOV_NEW_VALLEY', label_en: 'New Valley', label_ar: 'الوادي الجديد', color: '#5BA88A', sort_order: 27, metadata: { country: 'Egypt' }, active: true },

  // 2. Saudi Arabia (KSA) (All 13 Provinces)
  { id: 'lv-gov-28', category: 'governorate', code: 'GOV_RIYADH', label_en: 'Riyadh Province', label_ar: 'منطقة الرياض', color: '#5BA88A', sort_order: 28, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },
  { id: 'lv-gov-29', category: 'governorate', code: 'GOV_MAKKAH', label_en: 'Makkah / Jeddah Province', label_ar: 'منطقة مكة المكرمة / جدة', color: '#1E9090', sort_order: 29, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },
  { id: 'lv-gov-30', category: 'governorate', code: 'GOV_TABUK_NEOM', label_en: 'Tabuk / Red Sea / NEOM', label_ar: 'منطقة تبوك / نيوم / البحر الأحمر', color: '#D81E78', sort_order: 30, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },
  { id: 'lv-gov-31', category: 'governorate', code: 'GOV_EASTERN_KSA', label_en: 'Eastern Province (Dammam / Khobar)', label_ar: 'المنطقة الشرقية (الدمام / الخبر)', color: '#26336B', sort_order: 31, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },
  { id: 'lv-gov-35', category: 'governorate', code: 'GOV_MADINAH', label_en: 'Madinah Province', label_ar: 'منطقة المدينة المنورة', color: '#5BA88A', sort_order: 32, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },
  { id: 'lv-gov-36', category: 'governorate', code: 'GOV_ASIR', label_en: 'Asir Province (Abha)', label_ar: 'منطقة عسير (أبها)', color: '#D4741A', sort_order: 33, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },
  { id: 'lv-gov-37', category: 'governorate', code: 'GOV_QASSIM', label_en: 'Qassim Province', label_ar: 'منطقة القصيم', color: '#6A2A80', sort_order: 34, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },
  { id: 'lv-gov-38', category: 'governorate', code: 'GOV_HAIL', label_en: 'Hail Province', label_ar: 'منطقة حائل', color: '#7A9BBF', sort_order: 35, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },
  { id: 'lv-gov-39', category: 'governorate', code: 'GOV_JAZAN', label_en: 'Jazan Province', label_ar: 'منطقة جازان', color: '#1E9090', sort_order: 36, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },
  { id: 'lv-gov-40', category: 'governorate', code: 'GOV_NAJRAN', label_en: 'Najran Province', label_ar: 'منطقة نجران', color: '#D4741A', sort_order: 37, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },
  { id: 'lv-gov-41', category: 'governorate', code: 'GOV_BAHAH', label_en: 'Al Bahah Province', label_ar: 'منطقة الباحة', color: '#5BA88A', sort_order: 38, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },
  { id: 'lv-gov-42', category: 'governorate', code: 'GOV_JAWF', label_en: 'Al Jawf Province', label_ar: 'منطقة الجوف', color: '#26336B', sort_order: 39, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },
  { id: 'lv-gov-43', category: 'governorate', code: 'GOV_NORTHERN_KSA', label_en: 'Northern Borders Province', label_ar: 'منطقة الحدود الشمالية', color: '#7A9BBF', sort_order: 40, metadata: { country: 'Saudi Arabia (KSA)' }, active: true },

  // 3. United Arab Emirates (UAE) (All 7 Emirates)
  { id: 'lv-gov-32', category: 'governorate', code: 'GOV_DUBAI', label_en: 'Dubai', label_ar: 'دبي', color: '#1E9090', sort_order: 41, metadata: { country: 'United Arab Emirates (UAE)' }, active: true },
  { id: 'lv-gov-33', category: 'governorate', code: 'GOV_ABU_DHABI', label_en: 'Abu Dhabi', label_ar: 'أبوظبي', color: '#26336B', sort_order: 42, metadata: { country: 'United Arab Emirates (UAE)' }, active: true },
  { id: 'lv-gov-44', category: 'governorate', code: 'GOV_SHARJAH', label_en: 'Sharjah', label_ar: 'الشارقة', color: '#D4741A', sort_order: 43, metadata: { country: 'United Arab Emirates (UAE)' }, active: true },
  { id: 'lv-gov-45', category: 'governorate', code: 'GOV_RAS_AL_KHAIMAH', label_en: 'Ras Al Khaimah', label_ar: 'رأس الخيمة', color: '#D81E78', sort_order: 44, metadata: { country: 'United Arab Emirates (UAE)' }, active: true },
  { id: 'lv-gov-46', category: 'governorate', code: 'GOV_AJMAN', label_en: 'Ajman', label_ar: 'عجمان', color: '#5BA88A', sort_order: 45, metadata: { country: 'United Arab Emirates (UAE)' }, active: true },
  { id: 'lv-gov-47', category: 'governorate', code: 'GOV_FUJAIRAH', label_en: 'Fujairah', label_ar: 'الفجيرة', color: '#6A2A80', sort_order: 46, metadata: { country: 'United Arab Emirates (UAE)' }, active: true },
  { id: 'lv-gov-48', category: 'governorate', code: 'GOV_UMM_AL_QUWAIN', label_en: 'Umm Al Quwain', label_ar: 'أم القيوين', color: '#7A9BBF', sort_order: 47, metadata: { country: 'United Arab Emirates (UAE)' }, active: true },

  // 4. Qatar (All 8 Municipalities)
  { id: 'lv-gov-34', category: 'governorate', code: 'GOV_DOHA', label_en: 'Doha', label_ar: 'الدوحة', color: '#8B1A28', sort_order: 48, metadata: { country: 'Qatar' }, active: true },
  { id: 'lv-gov-49', category: 'governorate', code: 'GOV_LUSAIL_DAAYEN', label_en: 'Lusail / Al Daayen', label_ar: 'لوسيل / الضعاين', color: '#1E9090', sort_order: 49, metadata: { country: 'Qatar' }, active: true },
  { id: 'lv-gov-50', category: 'governorate', code: 'GOV_RAYYAN', label_en: 'Al Rayyan', label_ar: 'الريان', color: '#26336B', sort_order: 50, metadata: { country: 'Qatar' }, active: true },
  { id: 'lv-gov-51', category: 'governorate', code: 'GOV_WAKRAH', label_en: 'Al Wakrah', label_ar: 'الوكرة', color: '#D4741A', sort_order: 51, metadata: { country: 'Qatar' }, active: true },
  { id: 'lv-gov-52', category: 'governorate', code: 'GOV_KHOR', label_en: 'Al Khor', label_ar: 'الخور', color: '#5BA88A', sort_order: 52, metadata: { country: 'Qatar' }, active: true },
  { id: 'lv-gov-53', category: 'governorate', code: 'GOV_UMM_SALAL', label_en: 'Umm Salal', label_ar: 'أم صلال', color: '#7A9BBF', sort_order: 53, metadata: { country: 'Qatar' }, active: true },

  // 5. Kuwait (All 6 Governorates)
  { id: 'lv-gov-54', category: 'governorate', code: 'GOV_KUWAIT_CITY', label_en: 'Al Asimah (Kuwait City)', label_ar: 'العاصمة (مدينة الكويت)', color: '#26336B', sort_order: 54, metadata: { country: 'Kuwait' }, active: true },
  { id: 'lv-gov-55', category: 'governorate', code: 'GOV_HAWALLI', label_en: 'Hawalli', label_ar: 'حولي', color: '#1E9090', sort_order: 55, metadata: { country: 'Kuwait' }, active: true },
  { id: 'lv-gov-56', category: 'governorate', code: 'GOV_AHMADI', label_en: 'Al Ahmadi', label_ar: 'الأحمدي', color: '#D4741A', sort_order: 56, metadata: { country: 'Kuwait' }, active: true },
  { id: 'lv-gov-57', category: 'governorate', code: 'GOV_FARWANIYAH', label_en: 'Al Farwaniyah', label_ar: 'الفروانية', color: '#5BA88A', sort_order: 57, metadata: { country: 'Kuwait' }, active: true },
  { id: 'lv-gov-58', category: 'governorate', code: 'GOV_MUBARAK_KABEER', label_en: 'Mubarak Al-Kabeer', label_ar: 'مبارك الكبير', color: '#6A2A80', sort_order: 58, metadata: { country: 'Kuwait' }, active: true },
  { id: 'lv-gov-59', category: 'governorate', code: 'GOV_JAHRA', label_en: 'Al Jahra', label_ar: 'الجهراء', color: '#7A9BBF', sort_order: 59, metadata: { country: 'Kuwait' }, active: true },

  // 6. Oman (Governorates)
  { id: 'lv-gov-60', category: 'governorate', code: 'GOV_MUSCAT', label_en: 'Muscat Governorate', label_ar: 'محافظة مسقط', color: '#D81E78', sort_order: 60, metadata: { country: 'Oman' }, active: true },
  { id: 'lv-gov-61', category: 'governorate', code: 'GOV_DHOFAR', label_en: 'Dhofar (Salalah)', label_ar: 'محافظة ظفار (صلالة)', color: '#5BA88A', sort_order: 61, metadata: { country: 'Oman' }, active: true },
  { id: 'lv-gov-62', category: 'governorate', code: 'GOV_BATINAH_NORTH', label_en: 'Al Batinah North (Sohar)', label_ar: 'شمال الباطنة (صحار)', color: '#1E9090', sort_order: 62, metadata: { country: 'Oman' }, active: true },
  { id: 'lv-gov-63', category: 'governorate', code: 'GOV_BATINAH_SOUTH', label_en: 'Al Batinah South', label_ar: 'جنوب الباطنة', color: '#26336B', sort_order: 63, metadata: { country: 'Oman' }, active: true },
  { id: 'lv-gov-64', category: 'governorate', code: 'GOV_DAKHILIYAH', label_en: 'Ad Dakhiliyah (Nizwa)', label_ar: 'محافظة الداخلية (نزوى)', color: '#D4741A', sort_order: 64, metadata: { country: 'Oman' }, active: true },
  { id: 'lv-gov-65', category: 'governorate', code: 'GOV_MUSANDAM', label_en: 'Musandam Governorate', label_ar: 'محافظة مسندم', color: '#6A2A80', sort_order: 65, metadata: { country: 'Oman' }, active: true },

  // 7. Bahrain (All 4 Governorates)
  { id: 'lv-gov-66', category: 'governorate', code: 'GOV_MANAMA_CAPITAL', label_en: 'Capital Governorate (Manama)', label_ar: 'محافظة العاصمة (المنامة)', color: '#8B1A28', sort_order: 66, metadata: { country: 'Bahrain' }, active: true },
  { id: 'lv-gov-67', category: 'governorate', code: 'GOV_MUHARRAQ', label_en: 'Muharraq Governorate', label_ar: 'محافظة المحرق', color: '#1E9090', sort_order: 67, metadata: { country: 'Bahrain' }, active: true },
  { id: 'lv-gov-68', category: 'governorate', code: 'GOV_NORTHERN_BH', label_en: 'Northern Governorate', label_ar: 'المحافظة الشمالية', color: '#5BA88A', sort_order: 68, metadata: { country: 'Bahrain' }, active: true },
  { id: 'lv-gov-69', category: 'governorate', code: 'GOV_SOUTHERN_BH', label_en: 'Southern Governorate', label_ar: 'المحافظة الجنوبية', color: '#D4741A', sort_order: 69, metadata: { country: 'Bahrain' }, active: true },

  // 8. Jordan (Governorates)
  { id: 'lv-gov-70', category: 'governorate', code: 'GOV_AMMAN', label_en: 'Amman Governorate', label_ar: 'محافظة العاصمة (عمّان)', color: '#26336B', sort_order: 70, metadata: { country: 'Jordan' }, active: true },
  { id: 'lv-gov-71', category: 'governorate', code: 'GOV_AQABA', label_en: 'Aqaba Governorate', label_ar: 'محافظة العقبة', color: '#1E9090', sort_order: 71, metadata: { country: 'Jordan' }, active: true },
  { id: 'lv-gov-72', category: 'governorate', code: 'GOV_BALQA_DEAD_SEA', label_en: 'Balqa (Dead Sea)', label_ar: 'محافظة البلقاء (البحر الميت)', color: '#5BA88A', sort_order: 72, metadata: { country: 'Jordan' }, active: true },
  { id: 'lv-gov-73', category: 'governorate', code: 'GOV_IRBID', label_en: 'Irbid Governorate', label_ar: 'محافظة إربد', color: '#D4741A', sort_order: 73, metadata: { country: 'Jordan' }, active: true },
  { id: 'lv-gov-74', category: 'governorate', code: 'GOV_ZARQA', label_en: 'Zarqa Governorate', label_ar: 'محافظة الزرقاء', color: '#6A2A80', sort_order: 74, metadata: { country: 'Jordan' }, active: true },

  // 9. Libya (Provinces / Districts)
  { id: 'lv-gov-75', category: 'governorate', code: 'GOV_TRIPOLI', label_en: 'Tripoli', label_ar: 'طرابلس', color: '#5BA88A', sort_order: 75, metadata: { country: 'Libya' }, active: true },
  { id: 'lv-gov-76', category: 'governorate', code: 'GOV_BENGHAZI', label_en: 'Benghazi', label_ar: 'بنغازي', color: '#26336B', sort_order: 76, metadata: { country: 'Libya' }, active: true },
  { id: 'lv-gov-77', category: 'governorate', code: 'GOV_MISRATA', label_en: 'Misrata', label_ar: 'مصراتة', color: '#1E9090', sort_order: 77, metadata: { country: 'Libya' }, active: true },
  { id: 'lv-gov-78', category: 'governorate', code: 'GOV_JABAL_AKHDAR', label_en: 'Al Jabal Al Akhdar (Bayda)', label_ar: 'الجبل الأخضر (البيضاء)', color: '#D4741A', sort_order: 78, metadata: { country: 'Libya' }, active: true },

  // 10. Iraq (Governorates)
  { id: 'lv-gov-79', category: 'governorate', code: 'GOV_BAGHDAD', label_en: 'Baghdad Governorate', label_ar: 'محافظة بغداد', color: '#26336B', sort_order: 79, metadata: { country: 'Iraq' }, active: true },
  { id: 'lv-gov-80', category: 'governorate', code: 'GOV_ERBIL', label_en: 'Erbil Governorate', label_ar: 'محافظة أربيل', color: '#5BA88A', sort_order: 80, metadata: { country: 'Iraq' }, active: true },
  { id: 'lv-gov-81', category: 'governorate', code: 'GOV_BASRA', label_en: 'Basra Governorate', label_ar: 'محافظة البصرة', color: '#1E9090', sort_order: 81, metadata: { country: 'Iraq' }, active: true },
  { id: 'lv-gov-82', category: 'governorate', code: 'GOV_SULAYMANIYAH', label_en: 'Sulaymaniyah Governorate', label_ar: 'محافظة السليمانية', color: '#D4741A', sort_order: 82, metadata: { country: 'Iraq' }, active: true },
  { id: 'lv-gov-83', category: 'governorate', code: 'GOV_NAJAF_KARBALA', label_en: 'Najaf & Karbala', label_ar: 'النجف وكربلاء', color: '#6A2A80', sort_order: 83, metadata: { country: 'Iraq' }, active: true },
  { id: 'lv-gov-84', category: 'governorate', code: 'GOV_NINEVEH_MOSUL', label_en: 'Nineveh (Mosul)', label_ar: 'محافظة نينوى (الموصل)', color: '#7A9BBF', sort_order: 84, metadata: { country: 'Iraq' }, active: true },

  // =========================================================================
  // GEOGRAPHIC AREAS DATABASE (area — Separated from Governorate)
  // =========================================================================
  // Cairo Governorate Areas (Egypt)
  { id: 'lv-area-1', category: 'area', code: 'NEW_CAIRO', label_en: 'New Cairo & Fifth Settlement', label_ar: 'القاهرة الجديدة والتجمع الخامس', color: '#26336B', sort_order: 1, metadata: { country: 'Egypt', governorate: 'Cairo' }, active: true },
  { id: 'lv-area-2', category: 'area', code: 'NEW_CAPITAL', label_en: 'New Administrative Capital', label_ar: 'العاصمة الإدارية الجديدة', color: '#1E9090', sort_order: 2, metadata: { country: 'Egypt', governorate: 'Cairo' }, active: true },
  { id: 'lv-area-8', category: 'area', code: 'MOSTAKBAL_CITY', label_en: 'Mostakbal City', label_ar: 'مدينة المستقبل', color: '#5BA88A', sort_order: 3, metadata: { country: 'Egypt', governorate: 'Cairo' }, active: true },
  { id: 'lv-area-9', category: 'area', code: 'MADINATY', label_en: 'Madinaty', label_ar: 'مدينتي', color: '#1E9090', sort_order: 4, metadata: { country: 'Egypt', governorate: 'Cairo' }, active: true },
  { id: 'lv-area-10', category: 'area', code: 'SHOROUK_BADR', label_en: 'El Shorouk & Badr City', label_ar: 'الشروق ومدينة بدر', color: '#7A9BBF', sort_order: 5, metadata: { country: 'Egypt', governorate: 'Cairo' }, active: true },
  { id: 'lv-area-11', category: 'area', code: 'HELIOPOLIS_NASR', label_en: 'Heliopolis & Nasr City', label_ar: 'مصر الجديدة ومدينة نصر', color: '#D4741A', sort_order: 6, metadata: { country: 'Egypt', governorate: 'Cairo' }, active: true },
  { id: 'lv-area-12', category: 'area', code: 'MAADI_MOKATTAM', label_en: 'Maadi & Uptown Mokattam', label_ar: 'المعادي والمقطم', color: '#6A2A80', sort_order: 7, metadata: { country: 'Egypt', governorate: 'Cairo' }, active: true },
  { id: 'lv-area-13', category: 'area', code: 'DOWNTOWN_ZAMALEK', label_en: 'Downtown Cairo & Zamalek', label_ar: 'وسط البلد والزمالك', color: '#26336B', sort_order: 8, metadata: { country: 'Egypt', governorate: 'Cairo' }, active: true },

  // Giza Governorate Areas (Egypt)
  { id: 'lv-area-4', category: 'area', code: 'SHEIKH_ZAYED', label_en: 'Sheikh Zayed City', label_ar: 'مدينة الشيخ زايد', color: '#D4741A', sort_order: 9, metadata: { country: 'Egypt', governorate: 'Giza' }, active: true },
  { id: 'lv-area-14', category: 'area', code: 'NEW_ZAYED', label_en: 'New Zayed', label_ar: 'زايد الجديدة', color: '#D81E78', sort_order: 10, metadata: { country: 'Egypt', governorate: 'Giza' }, active: true },
  { id: 'lv-area-15', category: 'area', code: 'OCTOBER_CITY', label_en: '6th of October City', label_ar: 'مدينة 6 أكتوبر', color: '#26336B', sort_order: 11, metadata: { country: 'Egypt', governorate: 'Giza' }, active: true },
  { id: 'lv-area-16', category: 'area', code: 'OCTOBER_GARDENS', label_en: 'October Gardens & Hadayek El Ahram', label_ar: 'حدائق أكتوبر وحدائق الأهرام', color: '#5BA88A', sort_order: 12, metadata: { country: 'Egypt', governorate: 'Giza' }, active: true },
  { id: 'lv-area-17', category: 'area', code: 'SPHINX_DESERT_RD', label_en: 'Sphinx & Cairo-Alex Desert Road', label_ar: 'سفنكس وطريق مصر إسكندرية الصحراوي', color: '#1E9090', sort_order: 13, metadata: { country: 'Egypt', governorate: 'Giza' }, active: true },
  { id: 'lv-area-18', category: 'area', code: 'MOHANDESSIN_DOKKI', label_en: 'Mohandessin, Dokki & Pyramids', label_ar: 'المهندسين والدقي والهرم', color: '#7A9BBF', sort_order: 14, metadata: { country: 'Egypt', governorate: 'Giza' }, active: true },

  // Matrouh Governorate (North Coast) Areas (Egypt)
  { id: 'lv-area-3', category: 'area', code: 'NORTH_COAST', label_en: 'North Coast — New Alamein', label_ar: 'الساحل الشمالي - العلمين الجديدة', color: '#5BA88A', sort_order: 15, metadata: { country: 'Egypt', governorate: 'Matrouh' }, active: true },
  { id: 'lv-area-19', category: 'area', code: 'SIDI_ABDEL_RAHMAN', label_en: 'North Coast — Sidi Abdel Rahman', label_ar: 'الساحل الشمالي - سيدي عبد الرحمن', color: '#1E9090', sort_order: 16, metadata: { country: 'Egypt', governorate: 'Matrouh' }, active: true },
  { id: 'lv-area-20', category: 'area', code: 'RAS_EL_HEKMA', label_en: 'North Coast — Ras El Hekma', label_ar: 'الساحل الشمالي - رأس الحكمة', color: '#D81E78', sort_order: 17, metadata: { country: 'Egypt', governorate: 'Matrouh' }, active: true },
  { id: 'lv-area-21', category: 'area', code: 'DABAA_GHAZALA', label_en: 'North Coast — Dabaa & Ghazala Bay', label_ar: 'الساحل الشمالي - الضبعة وغزالة باي', color: '#26336B', sort_order: 18, metadata: { country: 'Egypt', governorate: 'Matrouh' }, active: true },
  { id: 'lv-area-22', category: 'area', code: 'SIDI_HENEISH', label_en: 'North Coast — Sidi Heneish & Almaza', label_ar: 'الساحل الشمالي - سيدي حنيش وألماظة', color: '#6A2A80', sort_order: 19, metadata: { country: 'Egypt', governorate: 'Matrouh' }, active: true },

  // Suez Governorate Areas (Egypt)
  { id: 'lv-area-5', category: 'area', code: 'RED_SEA', label_en: 'Ain Sokhna', label_ar: 'العين السخنة', color: '#D81E78', sort_order: 20, metadata: { country: 'Egypt', governorate: 'Suez' }, active: true },
  { id: 'lv-area-23', category: 'area', code: 'GALALA_CITY', label_en: 'Galala City', label_ar: 'مدينة الجلالة', color: '#D4741A', sort_order: 21, metadata: { country: 'Egypt', governorate: 'Suez' }, active: true },

  // Red Sea Governorate Areas (Egypt)
  { id: 'lv-area-24', category: 'area', code: 'EL_GOUNA', label_en: 'El Gouna', label_ar: 'الجونة', color: '#1E9090', sort_order: 22, metadata: { country: 'Egypt', governorate: 'Red Sea' }, active: true },
  { id: 'lv-area-6', category: 'area', code: 'SHARM_HURGHADA', label_en: 'Hurghada & Sahl Hasheesh', label_ar: 'الغردقة وسهل حشيش', color: '#6A2A80', sort_order: 23, metadata: { country: 'Egypt', governorate: 'Red Sea' }, active: true },
  { id: 'lv-area-25', category: 'area', code: 'SOMA_MAKADI_BAY', label_en: 'Soma Bay & Makadi Bay', label_ar: 'سوما باي ومكادي باي', color: '#5BA88A', sort_order: 24, metadata: { country: 'Egypt', governorate: 'Red Sea' }, active: true },
  { id: 'lv-area-26', category: 'area', code: 'MARSA_ALAM', label_en: 'Marsa Alam', label_ar: 'مرسى علم', color: '#26336B', sort_order: 25, metadata: { country: 'Egypt', governorate: 'Red Sea' }, active: true },

  // South Sinai Governorate Areas (Egypt)
  { id: 'lv-area-27', category: 'area', code: 'SHARM_ELSHEIKH', label_en: 'Sharm El-Sheikh & Nabq Bay', label_ar: 'شرم الشيخ وخليج نبق', color: '#D81E78', sort_order: 26, metadata: { country: 'Egypt', governorate: 'South Sinai' }, active: true },
  { id: 'lv-area-28', category: 'area', code: 'DAHAB_TABA', label_en: 'Dahab, Nuweiba & Taba', label_ar: 'دهب ونويبع وطابا', color: '#1E9090', sort_order: 27, metadata: { country: 'Egypt', governorate: 'South Sinai' }, active: true },

  // Alexandria & Delta & Upper Egypt Areas (Egypt)
  { id: 'lv-area-29', category: 'area', code: 'ALEX_CORNICHE', label_en: 'Alexandria Central & Corniche', label_ar: 'وسط الإسكندرية والكورنيش', color: '#26336B', sort_order: 28, metadata: { country: 'Egypt', governorate: 'Alexandria' }, active: true },
  { id: 'lv-area-30', category: 'area', code: 'BORG_EL_ARAB', label_en: 'Borg El Arab & King Mariout', label_ar: 'برج العرب وكينج مريوط', color: '#7A9BBF', sort_order: 29, metadata: { country: 'Egypt', governorate: 'Alexandria' }, active: true },
  { id: 'lv-area-31', category: 'area', code: 'NEW_MANSOURA', label_en: 'New Mansoura City', label_ar: 'مدينة المنصورة الجديدة', color: '#5BA88A', sort_order: 30, metadata: { country: 'Egypt', governorate: 'Dakahlia' }, active: true },
  { id: 'lv-area-36', category: 'area', code: 'NEW_DAMIETTA_RAS_ELBAR', label_en: 'New Damietta & Ras El Bar', label_ar: 'دمياط الجديدة ورأس البر', color: '#D4741A', sort_order: 31, metadata: { country: 'Egypt', governorate: 'Damietta' }, active: true },
  { id: 'lv-area-37', category: 'area', code: 'TENTH_OF_RAMADAN', label_en: '10th of Ramadan & Zagazig', label_ar: 'العاشر من رمضان والزقازيق', color: '#5BA88A', sort_order: 32, metadata: { country: 'Egypt', governorate: 'Sharqia' }, active: true },
  { id: 'lv-area-38', category: 'area', code: 'OBOUR_CITY', label_en: 'Obour City & Banha', label_ar: 'مدينة العبور وبنها', color: '#1E9090', sort_order: 33, metadata: { country: 'Egypt', governorate: 'Qalyubia' }, active: true },
  { id: 'lv-area-39', category: 'area', code: 'NEW_ASSIUT_MINYA', label_en: 'New Assiut & New Minya', label_ar: 'أسيوط الجديدة والمنيا الجديدة', color: '#26336B', sort_order: 34, metadata: { country: 'Egypt', governorate: 'Assiut' }, active: true },
  { id: 'lv-area-40', category: 'area', code: 'LUXOR_ASWAN_CORNICHE', label_en: 'Luxor & Aswan Nile Corniche', label_ar: 'كورنيش النيل بالأقصر وأسوان', color: '#D81E78', sort_order: 35, metadata: { country: 'Egypt', governorate: 'Luxor' }, active: true },

  // Saudi Arabia (KSA) Areas
  { id: 'lv-area-7', category: 'area', code: 'KSA_GCC', label_en: 'North Riyadh & Diriyah Gate', label_ar: 'شمال الرياض وبوابة الدرعية', color: '#8B1A28', sort_order: 36, metadata: { country: 'Saudi Arabia (KSA)', governorate: 'Riyadh Province' }, active: true },
  { id: 'lv-area-41', category: 'area', code: 'RIYADH_KAFD_OLAYA', label_en: 'KAFD & Central Olaya Riyadh', label_ar: 'مركز الملك عبدالله المالي والعليا', color: '#5BA88A', sort_order: 37, metadata: { country: 'Saudi Arabia (KSA)', governorate: 'Riyadh Province' }, active: true },
  { id: 'lv-area-42', category: 'area', code: 'QIDDIYA_CITY', label_en: 'Qiddiya Entertainment City', label_ar: 'مدينة القدية', color: '#D4741A', sort_order: 38, metadata: { country: 'Saudi Arabia (KSA)', governorate: 'Riyadh Province' }, active: true },
  { id: 'lv-area-32', category: 'area', code: 'JEDDAH_CORNICHE', label_en: 'Jeddah Corniche & Obhur', label_ar: 'كورنيش جدة وأبحر', color: '#1E9090', sort_order: 39, metadata: { country: 'Saudi Arabia (KSA)', governorate: 'Makkah / Jeddah Province' }, active: true },
  { id: 'lv-area-43', category: 'area', code: 'KAEC_MAKKAH', label_en: 'King Abdullah Economic City (KAEC) & Makkah', label_ar: 'مدينة الملك عبدالله الاقتصادية ومكة', color: '#26336B', sort_order: 40, metadata: { country: 'Saudi Arabia (KSA)', governorate: 'Makkah / Jeddah Province' }, active: true },
  { id: 'lv-area-33', category: 'area', code: 'RED_SEA_AMAALA', label_en: 'The Red Sea Project, NEOM & AMAALA', label_ar: 'مشروع البحر الأحمر ونيوم وأمالا', color: '#D81E78', sort_order: 41, metadata: { country: 'Saudi Arabia (KSA)', governorate: 'Tabuk / Red Sea / NEOM' }, active: true },
  { id: 'lv-area-44', category: 'area', code: 'KHOBAR_DHAHRAN_BAY', label_en: 'Al Khobar Waterfront & Dhahran', label_ar: 'واجهة الخبر البحرية والظهران', color: '#26336B', sort_order: 42, metadata: { country: 'Saudi Arabia (KSA)', governorate: 'Eastern Province (Dammam / Khobar)' }, active: true },
  { id: 'lv-area-45', category: 'area', code: 'SOUDAH_ABHA', label_en: 'Soudah Peaks & Abha', label_ar: 'قمم السودة وأبها', color: '#5BA88A', sort_order: 43, metadata: { country: 'Saudi Arabia (KSA)', governorate: 'Asir Province (Abha)' }, active: true },

  // United Arab Emirates (UAE) Areas
  { id: 'lv-area-34', category: 'area', code: 'DUBAI_MARINA_PALM', label_en: 'Dubai Marina & Palm Jumeirah', label_ar: 'دبي مارينا ونخلة جميرا', color: '#26336B', sort_order: 44, metadata: { country: 'United Arab Emirates (UAE)', governorate: 'Dubai' }, active: true },
  { id: 'lv-area-46', category: 'area', code: 'DOWNTOWN_CREEK_DUBAI', label_en: 'Downtown Dubai & Dubai Creek Harbour', label_ar: 'وسط مدينة دبي وخور دبي', color: '#1E9090', sort_order: 45, metadata: { country: 'United Arab Emirates (UAE)', governorate: 'Dubai' }, active: true },
  { id: 'lv-area-47', category: 'area', code: 'DUBAI_HILLS_SOUTH', label_en: 'Dubai Hills & Dubai South', label_ar: 'دبي هيلز ودبي الجنوب', color: '#D4741A', sort_order: 46, metadata: { country: 'United Arab Emirates (UAE)', governorate: 'Dubai' }, active: true },
  { id: 'lv-area-35', category: 'area', code: 'SAADIYAT_YAS', label_en: 'Saadiyat Island, Yas & Al Reem Island', label_ar: 'جزيرة السعديات وياس والريم', color: '#5BA88A', sort_order: 47, metadata: { country: 'United Arab Emirates (UAE)', governorate: 'Abu Dhabi' }, active: true },
  { id: 'lv-area-48', category: 'area', code: 'AL_MARJAN_RAK', label_en: 'Al Marjan Island & Mina Al Arab', label_ar: 'جزيرة المرجان وميناء العرب', color: '#D81E78', sort_order: 48, metadata: { country: 'United Arab Emirates (UAE)', governorate: 'Ras Al Khaimah' }, active: true },
  { id: 'lv-area-49', category: 'area', code: 'AL_JADA_SHARJAH', label_en: 'Aljada & Sharjah Waterfront', label_ar: 'الجادة وواجهة الشارقة البحرية', color: '#6A2A80', sort_order: 49, metadata: { country: 'United Arab Emirates (UAE)', governorate: 'Sharjah' }, active: true },

  // Qatar, Kuwait, Oman, Bahrain, Jordan, Libya, Iraq Areas
  { id: 'lv-area-50', category: 'area', code: 'WEST_BAY_PEARL_DOHA', label_en: 'West Bay & The Pearl Qatar', label_ar: 'الخليج الغربي واللؤلؤة قطر', color: '#8B1A28', sort_order: 50, metadata: { country: 'Qatar', governorate: 'Doha' }, active: true },
  { id: 'lv-area-51', category: 'area', code: 'LUSAIL_MARINA_QATAR', label_en: 'Lusail Marina & Qetaifan Islands', label_ar: 'مارينا لوسيل وجزر قطيفان', color: '#1E9090', sort_order: 51, metadata: { country: 'Qatar', governorate: 'Lusail / Al Daayen' }, active: true },
  { id: 'lv-area-52', category: 'area', code: 'KUWAIT_BAY_SALMIYA', label_en: 'Kuwait City Waterfront & Salmiya', label_ar: 'واجهة الكويت البحرية والسالمية', color: '#26336B', sort_order: 52, metadata: { country: 'Kuwait', governorate: 'Al Asimah (Kuwait City)' }, active: true },
  { id: 'lv-area-53', category: 'area', code: 'KHIRAN_AHMADI_KW', label_en: 'Sabah Al Ahmad Sea City (Khiran)', label_ar: 'مدينة صباح الأحمد البحرية (الخيران)', color: '#1E9090', sort_order: 53, metadata: { country: 'Kuwait', governorate: 'Al Ahmadi' }, active: true },
  { id: 'lv-area-54', category: 'area', code: 'AL_MOUJ_SULTAN_HAITHAM', label_en: 'Al Mouj Muscat & Sultan Haitham City', label_ar: 'الموج مسقط ومدينة السلطان هيثم', color: '#D81E78', sort_order: 54, metadata: { country: 'Oman', governorate: 'Muscat Governorate' }, active: true },
  { id: 'lv-area-55', category: 'area', code: 'SALALAH_HAWRANA_OMAN', label_en: 'Hawana Salalah Resort Area', label_ar: 'منتجعات هوانا صلالة', color: '#5BA88A', sort_order: 55, metadata: { country: 'Oman', governorate: 'Dhofar (Salalah)' }, active: true },
  { id: 'lv-area-56', category: 'area', code: 'BAHRAIN_BAY_SEEF', label_en: 'Bahrain Bay & Seef District', label_ar: 'خليج البحرين وضاحية السيف', color: '#8B1A28', sort_order: 56, metadata: { country: 'Bahrain', governorate: 'Capital Governorate (Manama)' }, active: true },
  { id: 'lv-area-57', category: 'area', code: 'MARASSI_AMWAJ_BH', label_en: 'Marassi Al Bahrain & Amwaj Islands', label_ar: 'مراسي البحرين وجزر أمواج', color: '#1E9090', sort_order: 57, metadata: { country: 'Bahrain', governorate: 'Muharraq Governorate' }, active: true },
  { id: 'lv-area-58', category: 'area', code: 'ABDALI_WEST_AMMAN', label_en: 'Abdali Boulevard & West Amman', label_ar: 'بوليفارد العبدلي وعمّان الغربية', color: '#26336B', sort_order: 58, metadata: { country: 'Jordan', governorate: 'Amman Governorate' }, active: true },
  { id: 'lv-area-59', category: 'area', code: 'AYLA_SARAYA_AQABA', label_en: 'Ayla Oasis & Saraya Aqaba', label_ar: 'واحة أيلة وسرايا العقبة', color: '#1E9090', sort_order: 59, metadata: { country: 'Jordan', governorate: 'Aqaba Governorate' }, active: true },
  { id: 'lv-area-60', category: 'area', code: 'TRIPOLI_CORNICHE_JANZOUR', label_en: 'Tripoli Central & Janzour Coastal Belt', label_ar: 'وسط طرابلس والشريط الساحلي جنزور', color: '#5BA88A', sort_order: 60, metadata: { country: 'Libya', governorate: 'Tripoli' }, active: true },
  { id: 'lv-area-61', category: 'area', code: 'BAGHDAD_JADRIYA_MANSOUR', label_en: 'Al-Jadriya, Mansour & Bismayah City', label_ar: 'الجادرية والمنصور ومدينة بسماية', color: '#26336B', sort_order: 61, metadata: { country: 'Iraq', governorate: 'Baghdad Governorate' }, active: true },
  { id: 'lv-area-62', category: 'area', code: 'EMPIRE_DREAM_CITY_ERBIL', label_en: 'Empire World & Dream City Erbil', label_ar: 'إمباير وورلد ودريم سيتي أربيل', color: '#5BA88A', sort_order: 62, metadata: { country: 'Iraq', governorate: 'Erbil Governorate' }, active: true },

  // =========================================================================
  // DISTRICTS / COMPOUNDS / BUILDINGS DATABASE (district — Standalone Table)
  // Saved in database table so any Compound or Building Name can be reused
  // independently of Country, Governorate, or Geographic Area
  // =========================================================================
  { id: 'lv-dist-1', category: 'district', code: 'DIST_MIVIDA', label_en: 'Mivida Compound', label_ar: 'كمبوند ميفيدا', color: '#26336B', sort_order: 1, active: true },
  { id: 'lv-dist-2', category: 'district', code: 'DIST_MV_ICITY_NC', label_en: 'Mountain View iCity New Cairo', label_ar: 'ماونتن فيو آي سيتي التجمع', color: '#1E9090', sort_order: 2, active: true },
  { id: 'lv-dist-3', category: 'district', code: 'DIST_HYDE_PARK_NC', label_en: 'Hyde Park New Cairo', label_ar: 'هايد بارك التجمع الخامس', color: '#5BA88A', sort_order: 3, active: true },
  { id: 'lv-dist-4', category: 'district', code: 'DIST_SWANLAKE_RES', label_en: 'SwanLake Residences', label_ar: 'سوان ليك ريزيدنس', color: '#D4741A', sort_order: 4, active: true },
  { id: 'lv-dist-5', category: 'district', code: 'DIST_CFC', label_en: 'Cairo Festival City (CFC)', label_ar: 'كايرو فيستيفال سيتي', color: '#6A2A80', sort_order: 5, active: true },
  { id: 'lv-dist-6', category: 'district', code: 'DIST_VILLETTE_SODIC', label_en: 'SODIC Villette & Eastown', label_ar: 'سوديك فيليت وإيست تاون', color: '#1E9090', sort_order: 6, active: true },
  { id: 'lv-dist-7', category: 'district', code: 'DIST_PALM_HILLS_NC', label_en: 'Palm Hills New Cairo', label_ar: 'بالم هيلز القاهرة الجديدة', color: '#D81E78', sort_order: 7, active: true },
  { id: 'lv-dist-8', category: 'district', code: 'DIST_ZED_EAST', label_en: 'ZED East', label_ar: 'زد إيست', color: '#26336B', sort_order: 8, active: true },
  { id: 'lv-dist-9', category: 'district', code: 'DIST_TAJ_CITY', label_en: 'Taj City', label_ar: 'تاج سيتي', color: '#5BA88A', sort_order: 9, active: true },
  { id: 'lv-dist-10', category: 'district', code: 'DIST_CELIA_TMG', label_en: 'Celia Compound (TMG)', label_ar: 'كمبوند سيليا - العاصمة الإدارية', color: '#5BA88A', sort_order: 10, active: true },
  { id: 'lv-dist-11', category: 'district', code: 'DIST_IL_BOSCO', label_en: 'IL Bosco New Capital', label_ar: 'البوسكو العاصمة الإدارية', color: '#D4741A', sort_order: 11, active: true },
  { id: 'lv-dist-12', category: 'district', code: 'DIST_BLOOMFIELDS', label_en: 'Bloomfields & HapTown', label_ar: 'بلوم فيلدز وهاب تاون', color: '#1E9090', sort_order: 12, active: true },
  { id: 'lv-dist-13', category: 'district', code: 'DIST_SARAI', label_en: 'Sarai Compound', label_ar: 'كمبوند سراي', color: '#D81E78', sort_order: 13, active: true },
  { id: 'lv-dist-14', category: 'district', code: 'DIST_PRIVADO_MADINATY', label_en: 'Privado & Madinaty Golf', label_ar: 'بريفادو وجولف مدينتي', color: '#26336B', sort_order: 14, active: true },
  { id: 'lv-dist-15', category: 'district', code: 'DIST_UPTOWN_CAIRO', label_en: 'Uptown Cairo', label_ar: 'أب تاون كايرو', color: '#26336B', sort_order: 15, active: true },
  { id: 'lv-dist-16', category: 'district', code: 'DIST_ZED_WEST', label_en: 'ZED West Towers & Park', label_ar: 'أبراج وبارك زد ويست', color: '#D81E78', sort_order: 16, active: true },
  { id: 'lv-dist-17', category: 'district', code: 'DIST_SODIC_WEST_ALLEGRIA', label_en: 'SODIC West — Allegria & The Estates', label_ar: 'سوديك ويست - أليجريا وذا إستيتس', color: '#1E9090', sort_order: 17, active: true },
  { id: 'lv-dist-18', category: 'district', code: 'DIST_BELLE_VIE_NEW_ZAYED', label_en: 'Belle Vie & Marakez New Zayed', label_ar: 'بيل في ومراكز زايد الجديدة', color: '#26336B', sort_order: 18, active: true },
  { id: 'lv-dist-19', category: 'district', code: 'DIST_BADYA_OCTOBER', label_en: 'Badya Palm Hills', label_ar: 'بادية بالم هيلز', color: '#D4741A', sort_order: 19, active: true },
  { id: 'lv-dist-20', category: 'district', code: 'DIST_NEWGIZA_COMPOUND', label_en: 'NEWGIZA Compound', label_ar: 'كمبوند نيو جيزة', color: '#6A2A80', sort_order: 20, active: true },
  { id: 'lv-dist-21', category: 'district', code: 'DIST_MV_CHILLOUT_OCT', label_en: 'Mountain View Chillout Park & iCity October', label_ar: 'ماونتن فيو تشيل أوت وآي سيتي أكتوبر', color: '#5BA88A', sort_order: 21, active: true },
  { id: 'lv-dist-22', category: 'district', code: 'DIST_MARASSI', label_en: 'Marassi (Blanca / Marina / Catania)', label_ar: 'مراسي الساحل الشمالي', color: '#26336B', sort_order: 22, active: true },
  { id: 'lv-dist-23', category: 'district', code: 'DIST_HACIENDA', label_en: 'Hacienda Bay & Hacienda White', label_ar: 'هاسيندا باي وهاسيندا وايت', color: '#D4741A', sort_order: 23, active: true },
  { id: 'lv-dist-24', category: 'district', code: 'DIST_SILVERSANDS_CAESAR', label_en: 'Silversands & Caesar Ras El Hekma', label_ar: 'سيلفر ساندس وسيزر رأس الحكمة', color: '#D81E78', sort_order: 24, active: true },
  { id: 'lv-dist-25', category: 'district', code: 'DIST_MV_RAS_ELHEKMA', label_en: 'Mountain View Ras El Hekma', label_ar: 'ماونتن فيو رأس الحكمة', color: '#1E9090', sort_order: 25, active: true },
  { id: 'lv-dist-26', category: 'district', code: 'DIST_ALMAZA_BAY', label_en: 'Almaza Bay & Sidi Heneish Resorts', label_ar: 'ألماظة باي ومنتجعات سيدي حنيش', color: '#5BA88A', sort_order: 26, active: true },
  { id: 'lv-dist-27', category: 'district', code: 'DIST_IL_MONTE_GALALA', label_en: 'Il Monte Galala & Azha Sokhna', label_ar: 'إل مونت جلالة وأزها السخنة', color: '#D4741A', sort_order: 27, active: true },
  { id: 'lv-dist-28', category: 'district', code: 'DIST_EL_GOUNA_SHEDS', label_en: 'El Gouna — Ancient Sands & Fanadir Bay', label_ar: 'الجونة - أنشينت ساندس وفنادير باي', color: '#1E9090', sort_order: 28, active: true },
  { id: 'lv-dist-29', category: 'district', code: 'DIST_SEDR_ROSHN', label_en: 'SEDRA by ROSHN & Wadi Safar', label_ar: 'سدرة روشن ووادي صفار', color: '#5BA88A', sort_order: 29, active: true },
  { id: 'lv-dist-30', category: 'district', code: 'DIST_DUBAI_HILLS_EST', label_en: 'Dubai Hills Estate & Creek Beach', label_ar: 'دبي هيلز إستيت وكريك بيتش', color: '#26336B', sort_order: 30, active: true },

  // Sales Representative (Starts empty / clear — users add their own Sales Representatives)

  // Duplicate Status
  { id: 'lv-dup-1', category: 'duplicate_status', code: 'NOT_DUPLICATE', label_en: 'Not Duplicate', label_ar: 'غير مكرر', color: '#5BA88A', sort_order: 1, active: true },
  { id: 'lv-dup-2', category: 'duplicate_status', code: 'DUPLICATE', label_en: 'Duplicate', label_ar: 'مكرر', color: '#D4741A', sort_order: 2, active: true },

  // Revision Reason
  { id: 'lv-rev-1', category: 'revision_reason', code: 'CLIENT_REQUEST', label_en: 'Client Scope Modification', label_ar: 'تعديل نطاق العمل بطلب العميل', color: '#1E9090', sort_order: 1, active: true },
  { id: 'lv-rev-2', category: 'revision_reason', code: 'PRICE_AMENDMENT', label_en: 'Price / Discount Amendment', label_ar: 'تعديل الأسعار / خصم تجاري', color: '#D4741A', sort_order: 2, active: true },
  { id: 'lv-rev-3', category: 'revision_reason', code: 'SPECS_CHANGE', label_en: 'Technical Specs / Filtration Change', label_ar: 'تعديل المواصفات الفنية', color: '#26336B', sort_order: 3, active: true },
  { id: 'lv-rev-4', category: 'revision_reason', code: 'BOQ_ADDENDUM', label_en: 'Consultant BOQ Addendum', label_ar: 'ملحق مقايسة من الاستشاري', color: '#6A2A80', sort_order: 4, active: true },
];

export const DEFAULT_EXCHANGE_RATES: ExchangeRate[] = [
  { id: 'fx-1', currency: 'EGP', rate_date: '2024-06-01', rate_to_usd: 47.25, source: 'currency-api (jsDelivr)', is_manual: false, fetched_at: '2024-06-01T10:00:00Z' },
  { id: 'fx-2', currency: 'EGP', rate_date: '2024-09-01', rate_to_usd: 48.55, source: 'currency-api (jsDelivr)', is_manual: false, fetched_at: '2024-09-01T10:00:00Z' },
  { id: 'fx-3', currency: 'EGP', rate_date: '2024-12-15', rate_to_usd: 50.816503, source: 'currency-api (jsDelivr)', is_manual: false, fetched_at: '2024-12-15T10:00:00Z' },
  { id: 'fx-4', currency: 'EGP', rate_date: '2025-01-15', rate_to_usd: 50.45, source: 'currency-api (jsDelivr)', is_manual: false, fetched_at: '2025-01-15T10:00:00Z' },
  { id: 'fx-5', currency: 'EGP', rate_date: '2025-06-01', rate_to_usd: 49.85, source: 'currency-api (jsDelivr)', is_manual: false, fetched_at: '2025-06-01T10:00:00Z' },
  { id: 'fx-6', currency: 'EGP', rate_date: '2026-01-01', rate_to_usd: 50.2, source: 'currency-api (jsDelivr)', is_manual: false, fetched_at: '2026-01-01T10:00:00Z' },
  { id: 'fx-7', currency: 'EGP', rate_date: '2026-06-01', rate_to_usd: 50.65, source: 'currency-api (jsDelivr)', is_manual: false, fetched_at: '2026-06-01T10:00:00Z' },
  { id: 'fx-8', currency: 'EGP', rate_date: '2026-11-01', rate_to_usd: 50.9, source: 'currency-api (jsDelivr)', is_manual: false, fetched_at: '2026-11-01T10:00:00Z' },
];

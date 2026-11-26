# P7-tender report

## 1. Status
- **Status:** Done fully.
- **Branch:** `feat/merge-platform`
- **Base commit:** `4f17f35073b7e380e81047560cbd245e512e4d6e` (`4f17f35` — `company/main`)
- **Last code commit (prior to committing this report):** `3c1df6461b3ca9e8a5319dfcd97a44f9c2c9e4bc`
- **Commits on `feat/merge-platform` before this report commit:**
```text
3c1df64 feat(commercial): save full configurator inputs and snapshot in tender_log.commercial_config
0976c56 chore(cleanup): remove legacy unmounted ERP shell and seed scripts, mark old SQL patches
e3854cf feat(users): read roles/permissions from tender.profiles view and restrict /admin/users to team edits
dbbd8a6 feat(auth): replace Firebase/OAuth login and user switching with Portal SSO
6487862 feat(supabase): unify onto single @supabase/ssr client on tender schema
5662348 chore(deps): add @supabase/ssr, upgrade @supabase/supabase-js, and remove firebase
```
- **`git remote -v`:**
```text
company	https://github.com/erppzoneinternational-lgtm/Tender-log-Tendring.git (fetch)
company	https://github.com/erppzoneinternational-lgtm/Tender-log-Tendring.git (push)
origin	https://github.com/AmrFaisalElAraby/PZ-Intelliget-Tender-Management.git (fetch)
origin	https://github.com/AmrFaisalElAraby/PZ-Intelliget-Tender-Management.git (push)
```

---

## 2. Files

### Created
- `P7-tender-REPORT.md` — Full technical migration & verification report for the merged platform move.

### Changed
- `package.json` — Added `@supabase/ssr@^0.12.7`, upgraded `@supabase/supabase-js@^2.117.3`, and removed `firebase`.
- `package-lock.json` — Updated lockfile for `@supabase/ssr`, `@supabase/supabase-js`, and removal of `firebase`.
- `.env.example` — Replaced legacy dual-Supabase/Firebase variables with the 4 company platform variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_AUTH_COOKIE_DOMAIN`, `VITE_PORTAL_URL`).
- `src/lib/supabaseClient.ts` — Replaced `createClient` and seeded admin constants with a single `createBrowserClient` targeting `db: { schema: 'tender' }` with shared parent-domain SSO cookies.
- `src/lib/supabase.js` — Reduced to `export { supabase } from './supabaseClient';` and deleted `syncErpAllowlistUsers`, `deleteErpAllowlistUser`, and `supabaseUrl`.
- `src/components/DatabaseHealth.jsx` — Removed deleted `supabaseUrl` import and read `import.meta.env.VITE_SUPABASE_URL` directly for health diagnostics display.
- `src/contexts/AppContext.tsx` — Replaced Firebase/Google OAuth, dual-DB session check, allowlist sign-out gate, and user switching with Portal SSO (`getClaims()`, `tender.profiles` lookup, window `focus` refresh, localized `NoAccessScreen`, and `signOut({ scope: 'local' })`).
- `src/App.jsx` — Deleted `Login` page usage, redirected `/login` via `goToPortalLogin()` rendering `null`, and updated `ProtectedRoutes` to render `RibbonLoader` while `loading || !user`.
- `src/lib/i18n.ts` — Added EN and AR translation keys for the `noAccess` screen and the `/admin/users` Portal Console notice and team save feedback.
- `src/components/layout/Topbar.tsx` — Removed the App Admin "Switch User" impersonation dropdown and related context bindings.
- `src/components/layout/Sidebar.tsx` — Removed the mobile drawer App Admin "Switch User" impersonation selector and related context bindings.
- `src/pages/Notifications.tsx` — Removed `isRealAppAdmin` reference and used `canManageAdmin(user.role)` directly.
- `src/lib/dataStore.ts` — Removed `SEEDED_PROFILES`, `REMOVED_DEMO_*`, `user_access_matrix`/`user_overheads_access` lookup overlays, `authorizeGoogleUser`, `inviteOrCreateUser`, and `deleteUserProfile`; restricted `updateUserProfile` to Step 1 columns; added `getCurrentSessionUser`/`setCurrentSessionUser` for actor tracking.
- `src/lib/supabaseSync.ts` — Blocked `profiles` from ever being pushed/deleted by array-diff sync, removed `profiles` role-mapping/email-update workarounds, switched Realtime to `schema: 'tender'`, and ignored `profiles` in Realtime events.
- `src/lib/erpBridge.ts` — Switched `erpSupabase` to unified `supabase`, resolved acting user from `getCurrentSessionUser()`, added `CommercialConfig` interface, updated `getCommercialBidSnapshotForTender` to read `tender_log.commercial_config.snapshot` with one-time `localStorage` fallback, and deleted `saveCommercialBidSnapshotForTender`.
- `src/pages/admin/UsersAdmin.tsx` — Converted `/admin/users` into a read-only user/role/module-matrix directory with the Portal Console notice link and inline `team` editing for `app_admin`.
- `src/components/CommercialBidPricePortal.jsx` — Saved and hydrated all 11 commercial configurator & export input states plus `snapshot` in `tender_log.commercial_config` alongside `commercial_overheads` and `notes`.
- `src/components/CommercialBoqPptxModal.jsx` — Supported controlled PPTX export option props from `CommercialBidPricePortal.jsx` so presentation settings persist in `tender_log.commercial_config`.
- `supabase/01_rls_tender_log_db.sql` — Added top warning comment `-- OLD (before the merged platform). Do not run on the company project.`.
- `supabase/02_rls_intelligent_erp_db.sql` — Added top warning comment `-- OLD (before the merged platform). Do not run on the company project.`.
- `supabase/03_fix_audit_trigger_db1.sql` — Added top warning comment `-- OLD (before the merged platform). Do not run on the company project.`.

### Deleted
- `src/lib/firebaseAuthBridge.ts` — Firebase Google popup bridge removed (Portal owns login).
- `src/pages/Login.tsx` — Local login page removed (unauthenticated users redirect to Portal).
- `src/lib/authContext.jsx` — Unmounted legacy ERP auth context deleted.
- `src/lib/router.jsx` — Unmounted legacy custom router deleted.
- `src/lib/themeContext.jsx` — Unmounted legacy theme context deleted.
- `src/components/LoginPage.jsx` — Unmounted legacy ERP login page deleted.
- `src/components/Navbar.jsx` — Unmounted legacy ERP navbar deleted.
- `src/components/PortalHome.jsx` — Unmounted legacy ERP home component deleted.
- `Datasets/seedSupabase.js` — Database seeding write script deleted (CSV datasets kept).
- `Datasets/direct_import.js` — Database direct-import write script deleted (CSV datasets kept).

---

## 3. Login and session after the change
- **Shared Cookie Session Client (`src/lib/supabaseClient.ts:17-37`):**
  - `supabase` is created once with `createBrowserClient(url, key, { db: { schema: 'tender' }, cookieOptions })` (`src/lib/supabaseClient.ts:29-32`), reading the shared cookie on `VITE_AUTH_COOKIE_DOMAIN` (`.pzoneinternational.com` in production, `undefined` locally), `path: '/'`, `sameSite: 'lax'`, `secure: protocol === 'https:'`, `maxAge: 400 * 24 * 60 * 60`.
  - Every `supabase.from('<table>')` request automatically carries the verified session JWT from the shared cookie against schema `tender`.
- **Portal Login Redirect (`src/contexts/AppContext.tsx:27-31`, `src/App.jsx:38-43,124`):**
  - `goToPortalLogin()` calls `window.location.replace(`${PORTAL_URL}/login?redirect=${encodeURIComponent(window.location.href)}`)`.
  - Visiting `/login` mounts `LoginRedirect` (`src/App.jsx:38-43`), which calls `goToPortalLogin()` inside `useEffect` and renders `null`.
  - `ProtectedRoutes` (`src/App.jsx:45-55`) renders `<RibbonLoader size="lg" />` while `loading || !user`.
- **`refresh()` Session & Profile Verification (`src/contexts/AppContext.tsx:192-267`):**
  1. Calls `await supabase.auth.getClaims()` (`src/contexts/AppContext.tsx:198`) to verify the JWT token and extract `claims.sub`.
  2. If `error || !sub` (`src/contexts/AppContext.tsx:200-206`), clears `user` and `currentSessionUser`, resets `noAccess = false`, and calls `goToPortalLogin()`.
  3. Queries `await supabase.from('profiles').select('*').eq('id', sub).maybeSingle()` (`src/contexts/AppContext.tsx:208-212`).
  4. If `profileErr || !row || row.active !== true` (`src/contexts/AppContext.tsx:214-220`), clears `user`, sets `noAccess = true` and `loading = false`, and does **not** hydrate or mount the workspace (`src/contexts/AppContext.tsx:270,458-462`).
  5. Otherwise normalizes `row` (`normalizeProfileRow`, `src/contexts/AppContext.tsx:222`), sets `currentSessionUser` and `user`, sets `loading = false`, and starts workspace hydration + `tender` schema Realtime sync (`src/contexts/AppContext.tsx:269-319`).
  6. `refresh()` runs on initial mount (`src/contexts/AppContext.tsx:243`) and on `window` `'focus'` (`src/contexts/AppContext.tsx:245-248`), and `supabase.auth.onAuthStateChange` redirects via `goToPortalLogin()` on `'SIGNED_OUT'` (`src/contexts/AppContext.tsx:250-260`). Both the `focus` listener and auth subscription are cleaned up on unmount (`src/contexts/AppContext.tsx:262-266`).
- **"No access" Screen (`src/contexts/AppContext.tsx:65-117,458-460`, `src/lib/i18n.ts:87-92,326-331`):**
  - Rendered by `AppProvider` in place of `children` whenever `noAccess === true`, preventing any workspace routes or data hydration from running.
  - Uses only `react-i18next` keys (`noAccess.title`, `noAccess.message`, `noAccess.backToPortal`, `noAccess.signOut`, `brand.name`) with EN message `"You don't have access to the Tender system. Ask your administrator to give you a Tender role in the Portal."` and two actions: **Back to Portal** (`href={PORTAL_URL}`, `src/contexts/AppContext.tsx:100-105`) and **Sign out** (`onClick={() => void onSignOut()}`, `src/contexts/AppContext.tsx:106-112`).
- **Sign-Out (`src/contexts/AppContext.tsx:33-38,430-434`, `src/components/layout/Topbar.tsx:201-208`):**
  - `signOut()` clears `currentSessionUser`, calls `await supabase.auth.signOut({ scope: 'local' })` (`src/contexts/AppContext.tsx:36`), and redirects to `${PORTAL_URL}/login` (`src/contexts/AppContext.tsx:37`).

---

## 4. Every database call after the change
All calls go through the single `supabase` client (`db: { schema: 'tender' }` in `src/lib/supabaseClient.ts:29-32`). Dynamic table variables are noted where used (`DatabaseWorkspace.jsx`, `TableBrowser.jsx`, `lookupContext.jsx`, `supabaseSync.ts`).

| File:line | Table / view / rpc | Operation (select/insert/update/delete/upsert/rpc/realtime) |
| :--- | :--- | :--- |
| `src/components/CivilBoqTableTab.jsx:319` | `'proposal_breakdown_items'` | `update` |
| `src/components/CivilBoqTableTab.jsx:325` | `'proposal_breakdown_items'` | `insert` |
| `src/components/CivilBoqTableTab.jsx:380` | `'proposal_breakdown_items'` | `delete` |
| `src/components/CommercialBidPricePortal.jsx:435` | `'proposal_breakdown_items'` | `select` |
| `src/components/CommercialBidPricePortal.jsx:461` | `'tender_log'` | `select` |
| `src/components/CommercialBidPricePortal.jsx:462` | `'phases'` | `select` |
| `src/components/CommercialBidPricePortal.jsx:463` | `'clients'` | `select` |
| `src/components/CommercialBidPricePortal.jsx:465` | `'proposal_data_entry'` | `select` |
| `src/components/CommercialBidPricePortal.jsx:466` | `'pump_room_data_entry'` | `select` |
| `src/components/CommercialBidPricePortal.jsx:467` | `'proposal_finishes_water_feature'` | `select` |
| `src/components/CommercialBidPricePortal.jsx:468` | `'proposal_finishes_pump_room'` | `select` |
| `src/components/CommercialBidPricePortal.jsx:469` | `'boq_work_type'` | `select` |
| `src/components/CommercialBidPricePortal.jsx:470` | `'items'` | `select` |
| `src/components/CommercialBidPricePortal.jsx:1647` | `'tender_log'` | `update` |
| `src/components/DatabaseHealth.jsx:27` | `'items'` | `select` |
| `src/components/DatabaseWorkspace.jsx:27` | `t.name` | `select` |
| `src/components/StructuralPortal.jsx:376` | `'items'` | `select` |
| `src/components/StructuralPortal.jsx:398` | `'proposal_breakdown_items'` | `select` |
| `src/components/StructuralPortal.jsx:439` | `'tender_log'` | `select` |
| `src/components/StructuralPortal.jsx:440` | `'phases'` | `select` |
| `src/components/StructuralPortal.jsx:441` | `'proposal_data_entry'` | `select` |
| `src/components/StructuralPortal.jsx:442` | `'water_feature_structural_works'` | `select` |
| `src/components/StructuralPortal.jsx:443` | `'pump_room_data_entry'` | `select` |
| `src/components/StructuralPortal.jsx:444` | `'pump_room_structural_works'` | `select` |
| `src/components/StructuralPortal.jsx:445` | `'proposal_finishes_water_feature'` | `select` |
| `src/components/StructuralPortal.jsx:446` | `'proposal_finishes_pump_room'` | `select` |
| `src/components/StructuralPortal.jsx:447` | `'clients'` | `select` |
| `src/components/StructuralPortal.jsx:448` | `'regions'` | `select` |
| `src/components/StructuralPortal.jsx:449` | `'brands'` | `select` |
| `src/components/StructuralPortal.jsx:450` | `'civil_material_types'` | `select` |
| `src/components/StructuralPortal.jsx:451` | `'water_feature_categories'` | `select` |
| `src/components/StructuralPortal.jsx:452` | `'water_feature_types'` | `select` |
| `src/components/StructuralPortal.jsx:454` | `'item_categories'` | `select` |
| `src/components/StructuralPortal.jsx:456` | `'boq_work_type'` | `select` |
| `src/components/StructuralPortal.jsx:457` | `'finishes_type'` | `select` |
| `src/components/StructuralPortal.jsx:458` | `'finishes_category'` | `select` |
| `src/components/StructuralPortal.jsx:1280` | `'proposal_breakdown_items'` | `delete` |
| `src/components/StructuralPortal.jsx:1284` | `'proposal_finishes_water_feature'` | `delete` |
| `src/components/StructuralPortal.jsx:1293` | `'proposal_breakdown_items'` | `delete` |
| `src/components/StructuralPortal.jsx:1297` | `'proposal_finishes_pump_room'` | `delete` |
| `src/components/StructuralPortal.jsx:1306` | `'proposal_breakdown_items'` | `delete` |
| `src/components/StructuralPortal.jsx:1310` | `'water_feature_structural_works'` | `delete` |
| `src/components/StructuralPortal.jsx:1319` | `'proposal_breakdown_items'` | `delete` |
| `src/components/StructuralPortal.jsx:1323` | `'pump_room_structural_works'` | `delete` |
| `src/components/StructuralPortal.jsx:1371` | `'proposal_data_entry'` | `select` |
| `src/components/StructuralPortal.jsx:1380` | `'proposal_data_entry'` | `insert` |
| `src/components/StructuralPortal.jsx:1397` | `'proposal_breakdown_items'` | `select` |
| `src/components/StructuralPortal.jsx:1444` | `'water_feature_structural_works'` | `select` |
| `src/components/StructuralPortal.jsx:1467` | `'water_feature_structural_works'` | `update` |
| `src/components/StructuralPortal.jsx:1473` | `'water_feature_structural_works'` | `insert` |
| `src/components/StructuralPortal.jsx:1497` | `'proposal_breakdown_items'` | `delete` |
| `src/components/StructuralPortal.jsx:1516` | `'proposal_breakdown_items'` | `upsert` |
| `src/components/StructuralPortal.jsx:1569` | `'proposal_breakdown_items'` | `select` |
| `src/components/StructuralPortal.jsx:1613` | `'pump_room_structural_works'` | `select` |
| `src/components/StructuralPortal.jsx:1636` | `'pump_room_structural_works'` | `update` |
| `src/components/StructuralPortal.jsx:1642` | `'pump_room_structural_works'` | `insert` |
| `src/components/StructuralPortal.jsx:1666` | `'proposal_breakdown_items'` | `delete` |
| `src/components/StructuralPortal.jsx:1685` | `'proposal_breakdown_items'` | `upsert` |
| `src/components/StructuralPortal.jsx:1739` | `'proposal_data_entry'` | `select` |
| `src/components/StructuralPortal.jsx:1747` | `'proposal_data_entry'` | `insert` |
| `src/components/StructuralPortal.jsx:1764` | `'proposal_breakdown_items'` | `select` |
| `src/components/StructuralPortal.jsx:1812` | `'proposal_finishes_water_feature'` | `select` |
| `src/components/StructuralPortal.jsx:1835` | `'proposal_finishes_water_feature'` | `update` |
| `src/components/StructuralPortal.jsx:1841` | `'proposal_finishes_water_feature'` | `insert` |
| `src/components/StructuralPortal.jsx:1865` | `'proposal_breakdown_items'` | `delete` |
| `src/components/StructuralPortal.jsx:1884` | `'proposal_breakdown_items'` | `upsert` |
| `src/components/StructuralPortal.jsx:1938` | `'pump_room_data_entry'` | `select` |
| `src/components/StructuralPortal.jsx:1946` | `'pump_room_data_entry'` | `insert` |
| `src/components/StructuralPortal.jsx:1961` | `'proposal_breakdown_items'` | `select` |
| `src/components/StructuralPortal.jsx:2008` | `'proposal_finishes_pump_room'` | `select` |
| `src/components/StructuralPortal.jsx:2031` | `'proposal_finishes_pump_room'` | `update` |
| `src/components/StructuralPortal.jsx:2037` | `'proposal_finishes_pump_room'` | `insert` |
| `src/components/StructuralPortal.jsx:2061` | `'proposal_breakdown_items'` | `delete` |
| `src/components/StructuralPortal.jsx:2080` | `'proposal_breakdown_items'` | `upsert` |
| `src/components/TableBrowser.jsx:57` | `t.name` | `select` |
| `src/components/TableBrowser.jsx:80` | `currentTableConfig.name` | `select` |
| `src/components/TableBrowser.jsx:99` | `currentTableConfig.name` | `select` |
| `src/components/TenderPortal.jsx:164` | `'tender_log'` | `select` |
| `src/components/TenderPortal.jsx:170` | `'phases'` | `select` |
| `src/components/TenderPortal.jsx:258` | `'countries'` | `insert` |
| `src/components/TenderPortal.jsx:263` | `'governorates'` | `insert` |
| `src/components/TenderPortal.jsx:272` | `'regions'` | `insert` |
| `src/components/TenderPortal.jsx:282` | `'districts'` | `insert` |
| `src/components/TenderPortal.jsx:291` | `'clients'` | `insert` |
| `src/components/TenderPortal.jsx:401` | `'tender_log'` | `insert` |
| `src/components/TenderPortal.jsx:415` | `'phases'` | `insert` |
| `src/components/TenderPortal.jsx:478` | `'tender_log'` | `update` |
| `src/components/TenderPortal.jsx:504` | `'tender_log'` | `update` |
| `src/components/TenderPortal.jsx:541` | `'phases'` | `select` |
| `src/components/TenderPortal.jsx:549` | `'proposal_breakdown_items'` | `delete` |
| `src/components/TenderPortal.jsx:551` | `'proposal_breakdown_items'` | `delete` |
| `src/components/TenderPortal.jsx:554` | `'proposal_finishes_water_feature'` | `delete` |
| `src/components/TenderPortal.jsx:555` | `'proposal_finishes_pump_room'` | `delete` |
| `src/components/TenderPortal.jsx:558` | `'water_feature_structural_works'` | `delete` |
| `src/components/TenderPortal.jsx:559` | `'pump_room_structural_works'` | `delete` |
| `src/components/TenderPortal.jsx:562` | `'proposal_data_entry'` | `delete` |
| `src/components/TenderPortal.jsx:563` | `'pump_room_data_entry'` | `delete` |
| `src/components/TenderPortal.jsx:566` | `'phases'` | `delete` |
| `src/components/TenderPortal.jsx:569` | `'tender_log'` | `delete` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:176` | `'items'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:198` | `'proposal_breakdown_items'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:241` | `'tender_log'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:242` | `'phases'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:243` | `'proposal_data_entry'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:244` | `'pump_room_data_entry'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:246` | `'filter_pump_types'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:247` | `'filter_types'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:248` | `'item_categories'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:249` | `'lighting_type'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:250` | `'cable_types'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:251` | `'transformer_type'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:252` | `'junction_box'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:253` | `'circulation_accessories'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:254` | `'main_drain'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:255` | `'tablet_chlorinator'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:256` | `'heaters'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:257` | `'disconnect_switch_types'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:258` | `'cable_conduits'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:259` | `'brands'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:260` | `'boq_work_type'` | `select` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:574` | `'proposal_data_entry'` | `update` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:581` | `'proposal_breakdown_items'` | `delete` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:596` | `'proposal_breakdown_items'` | `insert` |
| `src/components/WaterFeatureElectromechanicalPortal.jsx:946` | `'proposal_breakdown_items'` | `delete` |
| `src/components/WaterFeaturePortal.jsx:256` | `'tender_log'` | `select` |
| `src/components/WaterFeaturePortal.jsx:257` | `'phases'` | `select` |
| `src/components/WaterFeaturePortal.jsx:258` | `'water_feature_categories'` | `select` |
| `src/components/WaterFeaturePortal.jsx:259` | `'water_feature_types'` | `select` |
| `src/components/WaterFeaturePortal.jsx:260` | `'finishes_category'` | `select` |
| `src/components/WaterFeaturePortal.jsx:261` | `'proposal_data_entry'` | `select` |
| `src/components/WaterFeaturePortal.jsx:262` | `'pump_room_data_entry'` | `select` |
| `src/components/WaterFeaturePortal.jsx:263` | `'water_feature_structural_works'` | `select` |
| `src/components/WaterFeaturePortal.jsx:264` | `'clients'` | `select` |
| `src/components/WaterFeaturePortal.jsx:265` | `'regions'` | `select` |
| `src/components/WaterFeaturePortal.jsx:266` | `'brands'` | `select` |
| `src/components/WaterFeaturePortal.jsx:267` | `'civil_material_types'` | `select` |
| `src/components/WaterFeaturePortal.jsx:468` | `'proposal_data_entry'` | `delete` |
| `src/components/WaterFeaturePortal.jsx:482` | `'pump_room_data_entry'` | `delete` |
| `src/components/WaterFeaturePortal.jsx:716` | `'proposal_data_entry'` | `update` |
| `src/components/WaterFeaturePortal.jsx:723` | `'proposal_data_entry'` | `insert` |
| `src/components/WaterFeaturePortal.jsx:772` | `'proposal_data_entry'` | `select` |
| `src/components/WaterFeaturePortal.jsx:780` | `'proposal_data_entry'` | `insert` |
| `src/components/WaterFeaturePortal.jsx:806` | `'water_feature_structural_works'` | `select` |
| `src/components/WaterFeaturePortal.jsx:824` | `'water_feature_structural_works'` | `update` |
| `src/components/WaterFeaturePortal.jsx:830` | `'water_feature_structural_works'` | `insert` |
| `src/components/WaterFeaturePortal.jsx:857` | `'pump_room_data_entry'` | `update` |
| `src/components/WaterFeaturePortal.jsx:864` | `'pump_room_data_entry'` | `insert` |
| `src/components/WfMepBoqTableTab.jsx:326` | `'proposal_breakdown_items'` | `update` |
| `src/components/WfMepBoqTableTab.jsx:332` | `'proposal_breakdown_items'` | `insert` |
| `src/components/WfMepBoqTableTab.jsx:387` | `'proposal_breakdown_items'` | `delete` |
| `src/contexts/AppContext.tsx:209` | `'profiles'` | `select` |
| `src/lib/dataStore.ts:599` | `'profiles'` | `update` |
| `src/lib/erpBridge.ts:179` | `'proposal_breakdown_items'` | `select` |
| `src/lib/erpBridge.ts:227` | `'tender_log'` | `select` |
| `src/lib/erpBridge.ts:237` | `'tender_log'` | `select` |
| `src/lib/erpBridge.ts:272` | `'tender_log'` | `insert` |
| `src/lib/erpBridge.ts:343` | `'phases'` | `insert` |
| `src/lib/erpBridge.ts:350` | `'proposal_data_entry'` | `select` |
| `src/lib/erpBridge.ts:447` | `'tender_log'` | `select` |
| `src/lib/erpBridge.ts:448` | `'phases'` | `select` |
| `src/lib/erpBridge.ts:449` | `'clients'` | `select` |
| `src/lib/erpBridge.ts:451` | `'proposal_data_entry'` | `select` |
| `src/lib/erpBridge.ts:454` | `'pump_room_data_entry'` | `select` |
| `src/lib/erpBridge.ts:457` | `'proposal_finishes_water_feature'` | `select` |
| `src/lib/erpBridge.ts:460` | `'proposal_finishes_pump_room'` | `select` |
| `src/lib/lookupContext.jsx:174` | `tableName` | `select` |
| `src/lib/supabaseSync.ts:210` | `table` | `delete` |
| `src/lib/supabaseSync.ts:222` | `table` | `insert` |
| `src/lib/supabaseSync.ts:242` | `table` | `upsert` |
| `src/lib/supabaseSync.ts:244` | `table` | `insert` |
| `src/lib/supabaseSync.ts:255` | `table` | `upsert` |
| `src/lib/supabaseSync.ts:266` | `'tasks'` | `update` |
| `src/lib/supabaseSync.ts:280` | `'tenders'` | `upsert` |
| `src/lib/supabaseSync.ts:289` | `'notifications'` | `upsert` |
| `src/lib/supabaseSync.ts:297` | `'notifications'` | `upsert` |
| `src/lib/supabaseSync.ts:347` | `'profiles'` | `select` |
| `src/lib/supabaseSync.ts:373` | `table` | `select` |
| `src/lib/supabaseSync.ts:437` | `channel('pzone-tender-log-live')` | `realtime` |
| `src/pages/admin/UsersAdmin.tsx:125` | `'profiles'` | `update` |

---

## 5. Users and roles after the change
- **Where `role`, `module_permissions`, and `team` are read:**
  - **Signed-in user session load:** `src/contexts/AppContext.tsx:208-225` reads the signed-in user's row from `tender.profiles` (`eq('id', sub)`) and normalizes it via `normalizeProfileRow` (`src/lib/dataStore.ts:488-505`), preserving `row.role`, `row.team`, `row.module_permissions`, and `row.can_access_commercial_overheads` directly from the view.
  - **Workspace profiles list:** `src/lib/supabaseSync.ts:373` hydrates `tender.profiles` (`select('*')`), and `getProfiles()` (`src/lib/dataStore.ts:507-510`) maps rows through `normalizeProfileRow` with no `lookup_values` overlay.
  - **Permission & route checks:** `src/lib/permissions.ts:651-715` (`getEffectiveModulePermissions`, `canViewModule`, `canEditModule`, `hasCustomModuleOverrides`, `canManageFxAndCatalog`), `src/App.jsx:57-117` (route guards), `src/components/layout/Sidebar.tsx:62-193`, and `src/components/layout/Topbar.tsx:92-97,191-199`.
  - **Kanban & engineer `team` consumers:** `src/pages/admin/UsersAdmin.tsx:104,269,340-379`, `src/components/ui/EngineerWorkloadAdvisor.tsx:93`, `src/pages/Board.tsx:1589,1593,4741,4763,4785`, `src/pages/Tenders.tsx:1831-1835,2041`, `src/pages/TenderDetail.tsx:3291`, and `src/pages/ExecutiveDashboard.tsx:286`.
- **What `/admin/users` (`src/pages/admin/UsersAdmin.tsx`) can still do:**
  - Restricted to `app_admin` via `AdminRouteGuard` (`src/App.jsx:57-63,259-265`).
  - Displays the top Portal Console notice (`t('admin.users.portalConsoleNotice')`) with a link to `${PORTAL_URL}/admin/users` (`src/pages/admin/UsersAdmin.tsx:172-193`).
  - Displays all users with Name, Role (and read-only `Custom` badge), Email/Phone, read-only 8-module access chips (`<span>` elements, `src/pages/admin/UsersAdmin.tsx:396-419`), and read-only Active/Inactive status badge (`src/pages/admin/UsersAdmin.tsx:422-441`).
  - Allows `app_admin` to edit only `team` per user and save it with the exact update call at `src/pages/admin/UsersAdmin.tsx:124-127`:
    ```ts
    const { error } = await supabase
      .from('profiles')
      .update({ team })
      .eq('id', target.id);
    ```
- **Every write to `profiles` left in the code:**
  1. `src/pages/admin/UsersAdmin.tsx:124-127` — `supabase.from('profiles').update({ team }).eq('id', target.id)` (columns: `team`, callable only by `app_admin`).
  2. `src/lib/dataStore.ts:598-601` — `supabase.from('profiles').update(dbPatch).eq('id', userId)` inside `updateUserProfile` (`src/lib/dataStore.ts:544-627`), which restricts `dbPatch` strictly to `team`, `full_name`, `full_name_ar`, `phone`, `avatar_url` (own row or `app_admin`) and `preferred_theme`, `preferred_lang` (own row only, enforced at `src/lib/dataStore.ts:549-560,590-595`).
  - `src/lib/supabaseSync.ts:156` explicitly returns early when `table === 'profiles'`, and `STORAGE_KEY_TO_SUPABASE_TABLE` (`src/lib/dataStore.ts:99-111`) omits `PROFILES`, so the sync engine never inserts, upserts, or deletes `profiles`.
- **Every read of `erp_authorized_users`:**
  - **None** (`0` hits in `src/`; all writes were deleted with `syncErpAllowlistUsers` and `deleteErpAllowlistUser`).

---

## 6. Things removed (with the step-0 grep lists: what happened to each hit)

### Step 0 Grep 1 (`erpSupabase|signInWithIdToken|signInWithOAuth|firebase|pzone_session_email|pzone_signed_out|pzone_admin_switch_user_id|isRealAppAdmin|switchUser|PRIMARY_APP_ADMIN|SEEDED_PROFILES|user_access_matrix|user_overheads_access|erp_authorized_users|syncErpAllowlist|deleteErpAllowlist|linkProfileAuthUserIdIfNeeded|syncAllDb1ProfilesToErpAllowlist`)
| Base (`4f17f35`) file:line | Matched line | What happened to it |
| :--- | :--- | :--- |
| `src/components/layout/Sidebar.tsx:42` | `isRealAppAdmin,` | Removed `isRealAppAdmin` import/usage and mobile "Switch User" block (`Sidebar.tsx`) in Step 5. |
| `src/components/layout/Sidebar.tsx:593` | `{user && isRealAppAdmin && (` | Removed `isRealAppAdmin` import/usage and mobile "Switch User" block (`Sidebar.tsx`) in Step 5. |
| `src/components/layout/Topbar.tsx:47` | `isRealAppAdmin,` | Removed `isRealAppAdmin` import/usage and desktop "Switch User" dropdown (`Topbar.tsx`) in Step 5. |
| `src/components/layout/Topbar.tsx:118` | `{user && isRealAppAdmin && (` | Removed `isRealAppAdmin` import/usage and desktop "Switch User" dropdown (`Topbar.tsx`) in Step 5. |
| `src/contexts/AppContext.tsx:9` | `supabase as erpSupabase,` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:10` | `syncErpAllowlistUsers,` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:29` | `} from '@/lib/firebaseAuthBridge';` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:38` | `const ADMIN_SWITCH_STORAGE_KEY = 'pzone_admin_switch_user_id';` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:42` | `* - Non-admin accounts ('role !== 'app_admin'') NEVER get 'isRealAppAdmin = true'` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:45` | `*   'isRealAppAdmin = true' so they can switch back at any time.` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:53` | `isRealAppAdmin: boolean;` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:57` | `return { user: null, isRealAppAdmin: false, isSwitchingUser: false };` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:68` | `return { user: null, isRealAppAdmin: false, isSwitchingUser: false };` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:71` | `const isRealAppAdmin = latestSelf.role === 'app_admin';` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:72` | `if (!isRealAppAdmin) {` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:75` | `isRealAppAdmin: false,` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:85` | `isRealAppAdmin: true,` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:93` | `isRealAppAdmin: true,` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:118` | `async function linkProfileAuthUserIdIfNeeded(` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:144` | `async function syncAllDb1ProfilesToErpAllowlist(): Promise<void> {` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:151` | `.eq('category', 'user_access_matrix'),` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:180` | `await syncErpAllowlistUsers(merged);` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:206` | `isRealAppAdmin: boolean;` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:243` | `if (localStorage.getItem('pzone_signed_out') === 'true') {` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:250` | `const savedEmail = localStorage.getItem('pzone_session_email');` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:258` | `localStorage.removeItem('pzone_session_email');` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:332` | `localStorage.removeItem('pzone_session_email');` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:334` | `localStorage.setItem('pzone_signed_out', 'true');` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:368` | `localStorage.setItem('pzone_session_email', live.email);` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:375` | `const { user, isRealAppAdmin, isSwitchingUser } = useMemo(` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:629` | `profileData = await linkProfileAuthUserIdIfNeeded(profileData, authUserId);` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:635` | `void syncAllDb1ProfilesToErpAllowlist();` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:639` | `void syncErpAllowlistUsers(getProfiles());` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:651` | `localStorage.removeItem('pzone_signed_out');` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:652` | `localStorage.setItem('pzone_session_email', profileData.email);` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:661` | `const { data: erpSess } = await erpSupabase.auth.getSession();` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:764` | `supabase.auth.signInWithIdToken({` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:768` | `erpSupabase.auth` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:769` | `.signInWithIdToken({` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:780` | `const retryErp = await erpSupabase.auth` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:781` | `.signInWithIdToken({` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:805` | `await erpSupabase.auth.signOut();` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:817` | `const alignedProfile = await linkProfileAuthUserIdIfNeeded(` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:823` | `await syncAllDb1ProfilesToErpAllowlist();` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:829` | `localStorage.removeItem('pzone_signed_out');` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:830` | `localStorage.setItem('pzone_session_email', alignedProfile.email);` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:861` | `localStorage.removeItem('pzone_signed_out');` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:863` | `localStorage.setItem('pzone_session_email', signedInProfile.email);` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:876` | `// 1. Firebase Google Sign-In Popup -> Supabase 'signInWithIdToken' Bridge (zero Google Cloud Console needed)` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:889` | `const { error } = await supabase.auth.signInWithOAuth({` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:925` | `localStorage.removeItem('pzone_signed_out');` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:927` | `localStorage.setItem('pzone_session_email', check.profile.email);` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:948` | `await erpSupabase.auth.signOut();` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:956` | `localStorage.setItem('pzone_signed_out', 'true');` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:957` | `localStorage.removeItem('pzone_session_email');` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/contexts/AppContext.tsx:970` | `isRealAppAdmin,` | Removed in Step 5 rewrite of `AppContext.tsx` (replaced Firebase/OAuth/dual-DB/allowlist/impersonation with Portal SSO `getClaims()` + `tender.profiles` lookup). |
| `src/lib/dataStore.ts:35` | `PRIMARY_APP_ADMIN_EMAIL,` | Removed `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `syncErpAllowlistUsers`, `deleteErpAllowlistUser`, `USER_OVERHEADS_ACCESS_CATEGORY`, and `USER_ACCESS_MATRIX_CATEGORY` in Step 4 & Step 7. |
| `src/lib/dataStore.ts:36` | `SEEDED_PROFILES,` | Removed `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `syncErpAllowlistUsers`, `deleteErpAllowlistUser`, `USER_OVERHEADS_ACCESS_CATEGORY`, and `USER_ACCESS_MATRIX_CATEGORY` in Step 4 & Step 7. |
| `src/lib/dataStore.ts:39` | `deleteErpAllowlistUser,` | Removed `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `syncErpAllowlistUsers`, `deleteErpAllowlistUser`, `USER_OVERHEADS_ACCESS_CATEGORY`, and `USER_ACCESS_MATRIX_CATEGORY` in Step 4 & Step 7. |
| `src/lib/dataStore.ts:40` | `syncErpAllowlistUsers,` | Removed `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `syncErpAllowlistUsers`, `deleteErpAllowlistUser`, `USER_OVERHEADS_ACCESS_CATEGORY`, and `USER_ACCESS_MATRIX_CATEGORY` in Step 4 & Step 7. |
| `src/lib/dataStore.ts:524` | `const USER_OVERHEADS_ACCESS_CATEGORY = 'user_overheads_access';` | Removed `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `syncErpAllowlistUsers`, `deleteErpAllowlistUser`, `USER_OVERHEADS_ACCESS_CATEGORY`, and `USER_ACCESS_MATRIX_CATEGORY` in Step 4 & Step 7. |
| `src/lib/dataStore.ts:525` | `const USER_ACCESS_MATRIX_CATEGORY = 'user_access_matrix';` | Removed `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `syncErpAllowlistUsers`, `deleteErpAllowlistUser`, `USER_OVERHEADS_ACCESS_CATEGORY`, and `USER_ACCESS_MATRIX_CATEGORY` in Step 4 & Step 7. |
| `src/lib/dataStore.ts:655` | `const raw = readStorage<Profile[]>(STORAGE_KEYS.PROFILES, SEEDED_PROFILES);` | Removed `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `syncErpAllowlistUsers`, `deleteErpAllowlistUser`, `USER_OVERHEADS_ACCESS_CATEGORY`, and `USER_ACCESS_MATRIX_CATEGORY` in Step 4 & Step 7. |
| `src/lib/dataStore.ts:668` | `for (const seeded of SEEDED_PROFILES) {` | Removed `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `syncErpAllowlistUsers`, `deleteErpAllowlistUser`, `USER_OVERHEADS_ACCESS_CATEGORY`, and `USER_ACCESS_MATRIX_CATEGORY` in Step 4 & Step 7. |
| `src/lib/dataStore.ts:838` | `void syncErpAllowlistUsers(getProfiles());` | Removed `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `syncErpAllowlistUsers`, `deleteErpAllowlistUser`, `USER_OVERHEADS_ACCESS_CATEGORY`, and `USER_ACCESS_MATRIX_CATEGORY` in Step 4 & Step 7. |
| `src/lib/dataStore.ts:988` | `void syncErpAllowlistUsers(getProfiles());` | Removed `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `syncErpAllowlistUsers`, `deleteErpAllowlistUser`, `USER_OVERHEADS_ACCESS_CATEGORY`, and `USER_ACCESS_MATRIX_CATEGORY` in Step 4 & Step 7. |
| `src/lib/dataStore.ts:1053` | `void deleteErpAllowlistUser(existing.email);` | Removed `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `syncErpAllowlistUsers`, `deleteErpAllowlistUser`, `USER_OVERHEADS_ACCESS_CATEGORY`, and `USER_ACCESS_MATRIX_CATEGORY` in Step 4 & Step 7. |
| `src/lib/dataStore.ts:5020` | `(p) => p.email.trim().toLowerCase() === PRIMARY_APP_ADMIN_EMAIL.toLowerCase()` | Replaced `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `pzone_admin_switch_user_id`, and `pzone_session_email` actor resolution with `getCurrentSessionUser()` (`dataStore.ts:4582-4583`). |
| `src/lib/dataStore.ts:5024` | `SEEDED_PROFILES[0]?.id \|\|` | Replaced `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `pzone_admin_switch_user_id`, and `pzone_session_email` actor resolution with `getCurrentSessionUser()` (`dataStore.ts:4582-4583`). |
| `src/lib/dataStore.ts:5030` | `? sessionStorage.getItem('pzone_admin_switch_user_id')` | Replaced `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `pzone_admin_switch_user_id`, and `pzone_session_email` actor resolution with `getCurrentSessionUser()` (`dataStore.ts:4582-4583`). |
| `src/lib/dataStore.ts:5036` | `const sessionEmail = localStorage.getItem('pzone_session_email');` | Replaced `PRIMARY_APP_ADMIN_EMAIL`, `SEEDED_PROFILES`, `pzone_admin_switch_user_id`, and `pzone_session_email` actor resolution with `getCurrentSessionUser()` (`dataStore.ts:4582-4583`). |
| `src/lib/erpBridge.ts:7` | `import { supabase as erpSupabase } from './supabase';` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:21` | `import { PRIMARY_APP_ADMIN_PROFILE } from './supabaseClient';` | Removed `PRIMARY_APP_ADMIN_PROFILE`, `pzone_signed_out`, `pzone_admin_switch_user_id`, and `pzone_session_email`; `resolveCurrentErpActor()` now reads `getCurrentSessionUser()` (`erpBridge.ts:727-741`). |
| `src/lib/erpBridge.ts:44` | `const actorLabel = actor.full_name \|\| PRIMARY_APP_ADMIN_PROFILE.full_name;` | Removed `PRIMARY_APP_ADMIN_PROFILE`, `pzone_signed_out`, `pzone_admin_switch_user_id`, and `pzone_session_email`; `resolveCurrentErpActor()` now reads `getCurrentSessionUser()` (`erpBridge.ts:727-741`). |
| `src/lib/erpBridge.ts:179` | `const { data, error } = await erpSupabase` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:227` | `const { data: byId } = await erpSupabase` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:237` | `const { data: byCode } = await erpSupabase` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:272` | `const { data: insertedTender, error: insertErr } = await erpSupabase` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:344` | `await erpSupabase.from('phases').insert(phasesToInsert);` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:350` | `const { data: wfData } = await erpSupabase` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:448` | `erpSupabase.from('tender_log').select('*').order('created_at', { ascending: false }),` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:449` | `erpSupabase.from('phases').select('*'),` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:450` | `erpSupabase.from('clients').select('*'),` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:451` | `erpSupabase` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:454` | `erpSupabase` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:457` | `erpSupabase` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:460` | `erpSupabase` | Replaced `erpSupabase` alias with the unified `supabase` client from `./supabaseClient` in Step 4 & Step 7. |
| `src/lib/erpBridge.ts:721` | `if (localStorage.getItem('pzone_signed_out') === 'true') {` | Removed `PRIMARY_APP_ADMIN_PROFILE`, `pzone_signed_out`, `pzone_admin_switch_user_id`, and `pzone_session_email`; `resolveCurrentErpActor()` now reads `getCurrentSessionUser()` (`erpBridge.ts:727-741`). |
| `src/lib/erpBridge.ts:723` | `id: PRIMARY_APP_ADMIN_PROFILE.id,` | Removed `PRIMARY_APP_ADMIN_PROFILE`, `pzone_signed_out`, `pzone_admin_switch_user_id`, and `pzone_session_email`; `resolveCurrentErpActor()` now reads `getCurrentSessionUser()` (`erpBridge.ts:727-741`). |
| `src/lib/erpBridge.ts:729` | `const switchedId = sessionStorage.getItem('pzone_admin_switch_user_id');` | Removed `PRIMARY_APP_ADMIN_PROFILE`, `pzone_signed_out`, `pzone_admin_switch_user_id`, and `pzone_session_email`; `resolveCurrentErpActor()` now reads `getCurrentSessionUser()` (`erpBridge.ts:727-741`). |
| `src/lib/erpBridge.ts:736` | `const email = localStorage.getItem('pzone_session_email');` | Removed `PRIMARY_APP_ADMIN_PROFILE`, `pzone_signed_out`, `pzone_admin_switch_user_id`, and `pzone_session_email`; `resolveCurrentErpActor()` now reads `getCurrentSessionUser()` (`erpBridge.ts:727-741`). |
| `src/lib/erpBridge.ts:752` | `PRIMARY_APP_ADMIN_PROFILE;` | Removed `PRIMARY_APP_ADMIN_PROFILE`, `pzone_signed_out`, `pzone_admin_switch_user_id`, and `pzone_session_email`; `resolveCurrentErpActor()` now reads `getCurrentSessionUser()` (`erpBridge.ts:727-741`). |
| `src/lib/firebaseAuthBridge.ts:1` | `import { getApps, initializeApp } from 'firebase/app';` | Deleted entire file (`src/lib/firebaseAuthBridge.ts`) in Step 5. |
| `src/lib/firebaseAuthBridge.ts:6` | `signOut as firebaseSignOut,` | Deleted entire file (`src/lib/firebaseAuthBridge.ts`) in Step 5. |
| `src/lib/firebaseAuthBridge.ts:7` | `} from 'firebase/auth';` | Deleted entire file (`src/lib/firebaseAuthBridge.ts`) in Step 5. |
| `src/lib/firebaseAuthBridge.ts:9` | `const firebaseApiKey =` | Deleted entire file (`src/lib/firebaseAuthBridge.ts`) in Step 5. |
| `src/lib/firebaseAuthBridge.ts:11` | `const firebaseAuthDomain =` | Deleted entire file (`src/lib/firebaseAuthBridge.ts`) in Step 5. |
| `src/lib/firebaseAuthBridge.ts:15` | `Boolean(firebaseApiKey) && Boolean(firebaseAuthDomain);` | Deleted entire file (`src/lib/firebaseAuthBridge.ts`) in Step 5. |
| `src/lib/firebaseAuthBridge.ts:20` | `* ('supabase.auth.signInWithIdToken') can establish the real PostgreSQL session.` | Deleted entire file (`src/lib/firebaseAuthBridge.ts`) in Step 5. |
| `src/lib/firebaseAuthBridge.ts:35` | `apiKey: firebaseApiKey,` | Deleted entire file (`src/lib/firebaseAuthBridge.ts`) in Step 5. |
| `src/lib/firebaseAuthBridge.ts:36` | `authDomain: firebaseAuthDomain,` | Deleted entire file (`src/lib/firebaseAuthBridge.ts`) in Step 5. |
| `src/lib/firebaseAuthBridge.ts:48` | `await firebaseSignOut(auth).catch(() => {});` | Deleted entire file (`src/lib/firebaseAuthBridge.ts`) in Step 5. |
| `src/lib/supabase.js:17` | `* Mirrors authorized Gmail profiles from Admin -> Users into 'public.erp_authorized_users'` | Deleted `syncErpAllowlistUsers` and `deleteErpAllowlistUser` (`erp_authorized_users` writes); `supabase.js` now only re-exports `{ supabase }` from `./supabaseClient`. |
| `src/lib/supabase.js:19` | `* Silently no-ops if 'erp_authorized_users' has not been created yet.` | Deleted `syncErpAllowlistUsers` and `deleteErpAllowlistUser` (`erp_authorized_users` writes); `supabase.js` now only re-exports `{ supabase }` from `./supabaseClient`. |
| `src/lib/supabase.js:21` | `export async function syncErpAllowlistUsers(profiles = []) {` | Deleted `syncErpAllowlistUsers` and `deleteErpAllowlistUser` (`erp_authorized_users` writes); `supabase.js` now only re-exports `{ supabase }` from `./supabaseClient`. |
| `src/lib/supabase.js:38` | `await supabase.from('erp_authorized_users').upsert(rows, { onConflict: 'email' });` | Deleted `syncErpAllowlistUsers` and `deleteErpAllowlistUser` (`erp_authorized_users` writes); `supabase.js` now only re-exports `{ supabase }` from `./supabaseClient`. |
| `src/lib/supabase.js:44` | `export async function deleteErpAllowlistUser(email) {` | Deleted `syncErpAllowlistUsers` and `deleteErpAllowlistUser` (`erp_authorized_users` writes); `supabase.js` now only re-exports `{ supabase }` from `./supabaseClient`. |
| `src/lib/supabase.js:48` | `await supabase.from('erp_authorized_users').delete().eq('email', clean);` | Deleted `syncErpAllowlistUsers` and `deleteErpAllowlistUser` (`erp_authorized_users` writes); `supabase.js` now only re-exports `{ supabase }` from `./supabaseClient`. |
| `src/lib/supabaseClient.ts:28` | `export const PRIMARY_APP_ADMIN_EMAIL = 'amr.faisal.elaraby@gmail.com';` | Deleted `PRIMARY_APP_ADMIN_EMAIL`, `PRIMARY_APP_ADMIN_PROFILE`, and `SEEDED_PROFILES` in Step 4. |
| `src/lib/supabaseClient.ts:30` | `export const PRIMARY_APP_ADMIN_PROFILE: Profile = {` | Deleted `PRIMARY_APP_ADMIN_EMAIL`, `PRIMARY_APP_ADMIN_PROFILE`, and `SEEDED_PROFILES` in Step 4. |
| `src/lib/supabaseClient.ts:36` | `email: PRIMARY_APP_ADMIN_EMAIL,` | Deleted `PRIMARY_APP_ADMIN_EMAIL`, `PRIMARY_APP_ADMIN_PROFILE`, and `SEEDED_PROFILES` in Step 4. |
| `src/lib/supabaseClient.ts:45` | `export const SEEDED_PROFILES: Profile[] = [` | Deleted `PRIMARY_APP_ADMIN_EMAIL`, `PRIMARY_APP_ADMIN_PROFILE`, and `SEEDED_PROFILES` in Step 4. |
| `src/lib/supabaseClient.ts:46` | `PRIMARY_APP_ADMIN_PROFILE,` | Deleted `PRIMARY_APP_ADMIN_EMAIL`, `PRIMARY_APP_ADMIN_PROFILE`, and `SEEDED_PROFILES` in Step 4. |
| `src/lib/supabaseSync.ts:71` | `// preserving full preset & 8-module matrix inside 'lookup_values' ('user_access_matrix').` | Removed `profiles` role-rewriting / `user_access_matrix` comment and blocked `profiles` pushes in Step 7. |
| `src/pages/Notifications.tsx:210` | `const { user, isRealAppAdmin, lang } = useApp();` | Removed `isRealAppAdmin` destructuring and simplified admin button guard to `canManageAdmin(user.role)` (`Notifications.tsx:210,294`). |
| `src/pages/Notifications.tsx:294` | `{(isRealAppAdmin \|\| canManageAdmin(user.role)) && (` | Removed `isRealAppAdmin` destructuring and simplified admin button guard to `canManageAdmin(user.role)` (`Notifications.tsx:210,294`). |

### Step 0 Grep 2 (`schema: 'public'|schema: "public"`)
| Base (`4f17f35`) file:line | Matched line | What happened to it |
| :--- | :--- | :--- |
| `src/lib/supabaseSync.ts:459` | `{ event: '*', schema: 'public' },` | Changed Realtime subscription from `schema: 'public'` to `schema: 'tender'` and excluded `profiles` view events (`src/lib/supabaseSync.ts:440-445`). |

---

## 7. Commercial bid settings in the database (step 9b)

### 7.1 Configurator & Export Input List
Every user-editable `useState` across `src/components/CommercialBidPricePortal.jsx` and its child modal `src/components/CommercialBoqPptxModal.jsx` that affects `calculatedFinancials`, CSV export (`handleExportFullCsv`), or PPTX export (`CommercialBoqPptxModal`):

| State name | File:line | Type | Default value |
| :--- | :--- | :--- | :--- |
| `activeWorkTypeTab` | `src/components/CommercialBidPricePortal.jsx:281` | `'ALL' \| 'Civil' \| 'Mechanical' \| 'Electrical'` | `'ALL'` *(written to CSV export row `Active Filter Scope` at line 1690)* |
| `globalFinancialConfig` | `src/components/CommercialBidPricePortal.jsx:288` | `Record<string, unknown>` (12 indirects, mobilization overrides, 3 reserves, 5 financial/commission adders, corporate taxes, LG/insurance rates, duration/HO settings) | `getDefaultGlobalFinancialSettings()` (`lines 166-235`: `materialTransportationPct: 2.0`, `engineeringPct: 1.56`, `mobilizationMode: 'percentage'`, `mobilizationPct: 1.39`, `mobilizationFixedAmt: 75000`, `portacabinMonthlyRentPerUnit: 8500`, `portacabinsCount: 2`, `officeSetupCost: 25000`, `mobTransportTrucksCost: 20000`, `tempWaterPct: 0.11`, `tempPowerPct: 0.14`, `contractorSiteOfficePct: 0.31`, `stationaryCopyingPct: 0.29`, `safetyFacilitiesMode: 'percentage'`, `safetyFacilitiesPct: 0.23`, `safetyFacilitiesFixedAmt: 45000`, `safetyPpePerStaffMonthly: 1200`, `safetySignageAndFirstAid: 15000`, `companyAccommodationMode: 'percentage'`, `companyAccommodationPct: 0.44`, `companyAccommodationFixedAmt: 60000`, `accommodationRentMonthlyPerStaff: 4500`, `dailySubsistenceAllowancePerStaff: 150`, `siteVehiclesMonthlyFuelAndMaintenance: 12000`, `siteVehiclesCount: 1`, `salariesSiteStaffMode: 'percentage'`, `salariesSiteStaffPct: 3.61`, `salariesSiteStaffFixedAmt: 180000`, `staffExtraDaysPerMonth: 3`, `technicalServicesPct: 0.18`, `headOfficeCalculationMode: 'percentage'`, `headOfficeDaysPerMonthBasis: 3`, `headOfficeDurationHandling: 'exact_prorata'`, `headOfficeCustomDays: 0`, `headOfficePct: 9.0`, `deductSiteStaffFromHeadOffice: true`, `customProjectDurationDays: 0`, `contingencyReservesPct: 2.5`, `managementReservesPct: 1.5`, `guaranty1YearPct: 1.0`, `salesCommissionMode: 'selling_price_divisor'`, `salesCommissionPct: 1.5`, `marketingAllowanceAmt: 0`, `paymentGuaranteePct: 0.96`, `finalGuaranteePct: 0.12`, `financingInterestPct: 1.22`, `socialInsurancePct: 2.7`, `corporateTaxesPct: 22.5`, plus optional `mobilizationCustomOverrides: {}`) |
| `disciplineMargins` | `src/components/CommercialBidPricePortal.jsx:291` | `Record<'Civil' \| 'Mechanical' \| 'Electrical' \| 'General', number>` | `{ Civil: 15.0, Mechanical: 20.0, Electrical: 22.0, General: 18.0 }` (`DEFAULT_DISCIPLINE_MARGINS`, `lines 238-243`) |
| `workTypeSpecificMargins` | `src/components/CommercialBidPricePortal.jsx:294` | `Record<string, number>` | `{}` |
| `siteStaffRoster` | `src/components/CommercialBidPricePortal.jsx:297` | `Array<{ id: string; role?: string; code?: string; name?: string; jobTitle?: string; department?: string; monthlySalary: number; dailySalary?: number; customDays?: number; activeOnProject: boolean; allocationPct: number; notes: string }>` | `DEFAULT_SITE_STAFF` (10 default site roles, `lines 246-257`) |
| `templateId` | `src/components/CommercialBidPricePortal.jsx:304` (controlled prop to `src/components/CommercialBoqPptxModal.jsx:73,97`) | `string` | `'executive_navy'` |
| `tableMode` | `src/components/CommercialBidPricePortal.jsx:305` (controlled prop to `src/components/CommercialBoqPptxModal.jsx:75,99`) | `'full_boq' \| 'all_lumpsum' \| 'qty_and_total' \| 'title_and_total'` | `'full_boq'` |
| `pumpRoomSeparate` | `src/components/CommercialBidPricePortal.jsx:306` (controlled prop to `src/components/CommercialBoqPptxModal.jsx:77,101`) | `boolean` | `true` |
| `granularity` | `src/components/CommercialBidPricePortal.jsx:307` (controlled prop to `src/components/CommercialBoqPptxModal.jsx:79,103`) | `'work_types' \| 'line_items'` | `'work_types'` |
| `includeCoverSlide` | `src/components/CommercialBidPricePortal.jsx:308` (controlled prop to `src/components/CommercialBoqPptxModal.jsx:81,105`) | `boolean` | `true` |
| `includeSummarySlide` | `src/components/CommercialBidPricePortal.jsx:309` (controlled prop to `src/components/CommercialBoqPptxModal.jsx:83,107`) | `boolean` | `true` |

*(Derived values such as `tendersList`, `phasesList`, `breakdownItems`, `clientsList`, `boqWorkTypesList`, `catalogItemsList`, `disciplinesTree`, `totalDirectCost`, `wholeProjectDuration`, `calculatedFinancials`, and ephemeral UI states like modal/search/filter toggles are not stored.)*

### 7.2 Old Save Code vs. New Save Code (`handleSaveCommercialSettings`)

**Old save code (base commit `4f17f35`, `src/components/CommercialBidPricePortal.jsx:1490-1525`):**
```jsx
  // Save Settings to Supabase Tender Record
  const handleSaveCommercialSettings = async () => {
    if (!selectedTenderId) return;
    setIsSaving(true);
    try {
      const summaryNotes = `[Commercial Overheads: Weighted Margin ${calculatedFinancials.weightedAvgMarginPct}%, Duration ${wholeProjectDuration.days}d, Total Bid: ${calculatedFinancials.finalBidPrice.toLocaleString()} EGP]`;
      const cleanedNotes = String(activeTender?.notes || '').replace(/\[Commercial Overheads:.*?\]/g, '').trim();
      
      const { error } = await supabase
        .from('tender_log')
        .update({
          commercial_overheads: Number(calculatedFinancials.weightedAvgMarginPct || 18),
          notes: `${cleanedNotes} ${summaryNotes}`.trim(),
          ...buildErpAuditFields(true)
        })
        .eq('id', selectedTenderId);

      if (error) throw error;

      const civilBid = Number(calculatedFinancials.disciplineBreakdown?.Civil?.discBidPrice || 0);
      const mechBid = Number(calculatedFinancials.disciplineBreakdown?.Mechanical?.discBidPrice || 0);
      const elecBid = Number(calculatedFinancials.disciplineBreakdown?.Electrical?.discBidPrice || 0);

      // Persist exact custom Commercial Bid snapshot so PZ.Tender Log reflects the exact custom overheads & margins
      saveCommercialBidSnapshotForTender(String(selectedTenderId), {
        directTotal: Number(calculatedFinancials.directTotal || 0),
        civilBidPrice: civilBid,
        mechBidPrice: mechBid,
        elecBidPrice: elecBid,
        finalBidPrice: Number(calculatedFinancials.finalBidPrice || 0),
        weightedAvgMarginPct: Number(calculatedFinancials.weightedAvgMarginPct || 0),
        updatedAt: nowCairoIso(),
      });

      // Push calculated Civil, Mechanical, Electrical & Final Bid Price back to PZ.Tender Log
      await syncAllErpTendersAndCostsToTenderLog();
```

**New save code (`src/components/CommercialBidPricePortal.jsx:1597-1674`):**
```jsx
  // Save Settings to Supabase Tender Record
  const handleSaveCommercialSettings = async () => {
    if (!selectedTenderId) return;
    setIsSaving(true);
    try {
      const summaryNotes = `[Commercial Overheads: Weighted Margin ${calculatedFinancials.weightedAvgMarginPct}%, Duration ${wholeProjectDuration.days}d, Total Bid: ${calculatedFinancials.finalBidPrice.toLocaleString()} EGP]`;
      const cleanedNotes = String(activeTender?.notes || '').replace(/\[Commercial Overheads:.*?\]/g, '').trim();
      const nextOverheads = Number(calculatedFinancials.weightedAvgMarginPct || 18);
      const nextNotes = `${cleanedNotes} ${summaryNotes}`.trim();

      const civilBid = Number(calculatedFinancials.disciplineBreakdown?.Civil?.discBidPrice || 0);
      const mechBid = Number(calculatedFinancials.disciplineBreakdown?.Mechanical?.discBidPrice || 0);
      const elecBid = Number(calculatedFinancials.disciplineBreakdown?.Electrical?.discBidPrice || 0);
      const savedAt = nowCairoIso();
      const actor = resolveCurrentErpActor();

      const snapshot = {
        directTotal: Number(calculatedFinancials.directTotal || 0),
        civilBidPrice: civilBid,
        mechBidPrice: mechBid,
        elecBidPrice: elecBid,
        finalBidPrice: Number(calculatedFinancials.finalBidPrice || 0),
        weightedAvgMarginPct: Number(calculatedFinancials.weightedAvgMarginPct || 0),
        updatedAt: savedAt,
      };

      const commercialConfig = {
        version: 1,
        inputs: {
          activeWorkTypeTab,
          globalFinancialConfig,
          disciplineMargins,
          workTypeSpecificMargins,
          siteStaffRoster,
          templateId,
          tableMode,
          pumpRoomSeparate,
          granularity,
          includeCoverSlide,
          includeSummarySlide,
        },
        snapshot,
        saved_at: savedAt,
        saved_by: {
          id: actor.id,
          full_name: actor.full_name,
        },
      };

      const auditFields = buildErpAuditFields(true);
      const { error } = await supabase
        .from('tender_log')
        .update({
          commercial_overheads: nextOverheads,
          notes: nextNotes,
          commercial_config: commercialConfig,
          ...auditFields,
        })
        .eq('id', selectedTenderId);

      if (error) throw error;

      setTendersList(prev =>
        prev.map(t =>
          String(t.id) === String(selectedTenderId)
            ? {
                ...t,
                commercial_overheads: nextOverheads,
                notes: nextNotes,
                commercial_config: commercialConfig,
                ...auditFields,
              }
            : t
        )
      );

      // Push calculated Civil, Mechanical, Electrical & Final Bid Price back to PZ.Tender Log
      await syncAllErpTendersAndCostsToTenderLog();
```

### 7.3 Load Code (`src/components/CommercialBidPricePortal.jsx:332-427`)
```jsx
  // Hydrate saved commercial_config inputs (or reset to defaults) when selected tender changes
  useEffect(() => {
    if (!selectedTenderId || tendersList.length === 0) return;
    if (hydratedTenderIdRef.current === String(selectedTenderId)) return;

    const targetRow = tendersList.find(
      (t) => String(t.id) === String(selectedTenderId)
    );
    if (!targetRow) return;

    hydratedTenderIdRef.current = String(selectedTenderId);

    const cfgObj =
      targetRow.commercial_config &&
      typeof targetRow.commercial_config === 'object' &&
      !Array.isArray(targetRow.commercial_config)
        ? targetRow.commercial_config
        : null;
    const inp =
      cfgObj?.inputs &&
      typeof cfgObj.inputs === 'object' &&
      !Array.isArray(cfgObj.inputs)
        ? cfgObj.inputs
        : null;

    if (!cfgObj || !inp) {
      setActiveWorkTypeTab('ALL');
      setGlobalFinancialConfig(getDefaultGlobalFinancialSettings());
      setDisciplineMargins({ ...DEFAULT_DISCIPLINE_MARGINS });
      setWorkTypeSpecificMargins({});
      setSiteStaffRoster(DEFAULT_SITE_STAFF.map((s) => ({ ...s })));
      setTemplateId('executive_navy');
      setTableMode('full_boq');
      setPumpRoomSeparate(true);
      setGranularity('work_types');
      setIncludeCoverSlide(true);
      setIncludeSummarySlide(true);
      return;
    }

    setActiveWorkTypeTab(
      typeof inp.activeWorkTypeTab === 'string' ? inp.activeWorkTypeTab : 'ALL'
    );
    setGlobalFinancialConfig(
      inp.globalFinancialConfig &&
        typeof inp.globalFinancialConfig === 'object' &&
        !Array.isArray(inp.globalFinancialConfig)
        ? {
            ...getDefaultGlobalFinancialSettings(),
            ...inp.globalFinancialConfig,
          }
        : getDefaultGlobalFinancialSettings()
    );
    setDisciplineMargins(
      inp.disciplineMargins &&
        typeof inp.disciplineMargins === 'object' &&
        !Array.isArray(inp.disciplineMargins)
        ? {
            ...DEFAULT_DISCIPLINE_MARGINS,
            ...inp.disciplineMargins,
          }
        : { ...DEFAULT_DISCIPLINE_MARGINS }
    );
    setWorkTypeSpecificMargins(
      inp.workTypeSpecificMargins &&
        typeof inp.workTypeSpecificMargins === 'object' &&
        !Array.isArray(inp.workTypeSpecificMargins)
        ? { ...inp.workTypeSpecificMargins }
        : {}
    );
    setSiteStaffRoster(
      Array.isArray(inp.siteStaffRoster)
        ? inp.siteStaffRoster.map((s) => ({ ...s }))
        : DEFAULT_SITE_STAFF.map((s) => ({ ...s }))
    );
    setTemplateId(
      typeof inp.templateId === 'string' ? inp.templateId : 'executive_navy'
    );
    setTableMode(
      typeof inp.tableMode === 'string' ? inp.tableMode : 'full_boq'
    );
    setPumpRoomSeparate(
      typeof inp.pumpRoomSeparate === 'boolean' ? inp.pumpRoomSeparate : true
    );
    setGranularity(
      typeof inp.granularity === 'string' ? inp.granularity : 'work_types'
    );
    setIncludeCoverSlide(
      typeof inp.includeCoverSlide === 'boolean' ? inp.includeCoverSlide : true
    );
    setIncludeSummarySlide(
      typeof inp.includeSummarySlide === 'boolean'
        ? inp.includeSummarySlide
        : true
    );
  }, [selectedTenderId, tendersList]);
```

### 7.4 `CommercialConfig`, `getCommercialBidSnapshotForTender`, and One-Time `localStorage` Fallback (`src/lib/erpBridge.ts:552,684-722`)
Called during sync at `src/lib/erpBridge.ts:552` as `getCommercialBidSnapshotForTender(pId, erpTenders)` using the already-fetched `tender_log` rows (zero extra queries per tender):
```ts
export interface CommercialConfig {
  version: 1;
  inputs: Record<string, unknown>;
  snapshot: CommercialBidSnapshot;
  saved_at: string;
  saved_by: { id: string; full_name: string };
}

export function getCommercialBidSnapshotForTender(
  erpTenderId: string,
  erpTenderRows?: ReadonlyArray<Record<string, unknown>> | Record<string, unknown> | null
): CommercialBidSnapshot | null {
  if (!erpTenderId) return null;
  const targetId = String(erpTenderId);

  const matchedRow = Array.isArray(erpTenderRows)
    ? erpTenderRows.find((r) => String(r?.id) === targetId) ?? null
    : erpTenderRows && String(erpTenderRows.id) === targetId
      ? erpTenderRows
      : null;

  const rawConfig = matchedRow?.commercial_config as CommercialConfig | null | undefined;
  if (rawConfig && typeof rawConfig === 'object') {
    if (rawConfig.snapshot && typeof rawConfig.snapshot === 'object') {
      return rawConfig.snapshot;
    }
    return null;
  }

  // One-time fallback when commercial_config is null on the tender_log row
  try {
    const raw = localStorage.getItem('pzone_commercial_saved_bids_v1');
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, CommercialBidSnapshot>;
    return map[targetId] || null;
  } catch {
    return null;
  }
}
```

### 7.5 Example `commercial_config` Object (Made-Up Numbers)
```json
{
  "version": 1,
  "inputs": {
    "activeWorkTypeTab": "ALL",
    "globalFinancialConfig": {
      "materialTransportationPct": 2.0,
      "engineeringPct": 1.56,
      "mobilizationMode": "percentage",
      "mobilizationPct": 1.5,
      "mobilizationFixedAmt": 80000,
      "portacabinMonthlyRentPerUnit": 8500,
      "portacabinsCount": 2,
      "officeSetupCost": 25000,
      "mobTransportTrucksCost": 20000,
      "tempWaterPct": 0.11,
      "tempPowerPct": 0.14,
      "contractorSiteOfficePct": 0.31,
      "stationaryCopyingPct": 0.29,
      "safetyFacilitiesMode": "percentage",
      "safetyFacilitiesPct": 0.25,
      "safetyFacilitiesFixedAmt": 45000,
      "safetyPpePerStaffMonthly": 1200,
      "safetySignageAndFirstAid": 15000,
      "companyAccommodationMode": "percentage",
      "companyAccommodationPct": 0.44,
      "companyAccommodationFixedAmt": 60000,
      "accommodationRentMonthlyPerStaff": 4500,
      "dailySubsistenceAllowancePerStaff": 150,
      "siteVehiclesMonthlyFuelAndMaintenance": 12000,
      "siteVehiclesCount": 1,
      "salariesSiteStaffMode": "percentage",
      "salariesSiteStaffPct": 3.61,
      "salariesSiteStaffFixedAmt": 180000,
      "staffExtraDaysPerMonth": 3,
      "technicalServicesPct": 0.18,
      "headOfficeCalculationMode": "percentage",
      "headOfficeDaysPerMonthBasis": 3,
      "headOfficeDurationHandling": "exact_prorata",
      "headOfficeCustomDays": 0,
      "headOfficePct": 9.0,
      "deductSiteStaffFromHeadOffice": true,
      "customProjectDurationDays": 90,
      "contingencyReservesPct": 2.5,
      "managementReservesPct": 1.5,
      "guaranty1YearPct": 1.0,
      "salesCommissionMode": "selling_price_divisor",
      "salesCommissionPct": 1.5,
      "marketingAllowanceAmt": 0,
      "paymentGuaranteePct": 0.96,
      "finalGuaranteePct": 0.12,
      "financingInterestPct": 1.22,
      "socialInsurancePct": 2.7,
      "corporateTaxesPct": 22.5
    },
    "disciplineMargins": {
      "Civil": 16.0,
      "Mechanical": 21.0,
      "Electrical": 23.0,
      "General": 18.0
    },
    "workTypeSpecificMargins": {
      "Reinforced Concrete": 17.5,
      "Water Filter": 22.0
    },
    "siteStaffRoster": [
      {
        "id": "s1",
        "role": "Project Manager",
        "monthlySalary": 35000,
        "activeOnProject": true,
        "allocationPct": 100,
        "notes": "Full-time site execution leadership"
      }
    ],
    "templateId": "executive_navy",
    "tableMode": "full_boq",
    "pumpRoomSeparate": true,
    "granularity": "work_types",
    "includeCoverSlide": true,
    "includeSummarySlide": true
  },
  "snapshot": {
    "directTotal": 4200000,
    "civilBidPrice": 2850000,
    "mechBidPrice": 2410000,
    "elecBidPrice": 1190000,
    "finalBidPrice": 6450000,
    "weightedAvgMarginPct": 19.42,
    "updatedAt": "2026-11-26T13:00:00+02:00"
  },
  "saved_at": "2026-11-26T13:00:00+02:00",
  "saved_by": {
    "id": "11111111-2222-4333-8444-555555555555",
    "full_name": "Sample Commercial Approver"
  }
}
```

---

## 8. Command results (step 10): paste real outputs

```bash
$ npm run build

> pzone-intelligent-tendering-system@1.0.0 build
> vite build

[36mvite v6.4.3 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 2462 modules transformed.
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                 [39m[1m[2m    1.29 kB[22m[1m[22m[2m │ gzip:     0.63 kB[22m
[2mdist/[22m[35massets/index-BM83naN9.css  [39m[1m[2m  273.70 kB[22m[1m[22m[2m │ gzip:    31.50 kB[22m
[2mdist/[22m[36massets/index-LvXR277I.js   [39m[1m[33m4,216.79 kB[39m[22m[2m │ gzip: 1,021.91 kB[22m
[32m✓ built in 9.95s[39m
```

```bash
$ npm run lint || true
# (no output, exit code 0)
```

```bash
$ grep -rn "gjfqnmustacsmwvccvou\|owgwlrrpqxlejbdodbsd" src .env.example
# (no output, exit code 1)
```

```bash
$ grep -rn "VITE_TENDER_LOG_\|VITE_ERP_SUPABASE\|VITE_SUPABASE_ANON_KEY\|VITE_FIREBASE\|VITE_GOOGLE_CLIENT_ID\|VITE_ENABLE_DEMO_MODE" src
# (no output, exit code 1)
```

```bash
$ grep -rn "firebase\|signInWithIdToken\|signInWithOAuth\|signInWithPassword" src
# (no output, exit code 1)
```

```bash
$ grep -rn "createClient\|createBrowserClient" src
src/lib/supabaseClient.ts:3:import { createBrowserClient } from '@supabase/ssr';
src/lib/supabaseClient.ts:29:export const supabase = createBrowserClient(url, key, {
```

```bash
$ grep -rn "schema: 'public'\|schema: \"public\"" src
# (no output, exit code 1)
```

```bash
$ grep -rn "user_access_matrix\|user_overheads_access\|syncErpAllowlist\|deleteErpAllowlist\|pzone_session_email\|pzone_admin_switch_user_id\|PRIMARY_APP_ADMIN" src
# (no output, exit code 1)
```

```bash
$ grep -rn "eyJ\|sb_secret_\|service_role\|sb_publishable_" src
src/lib/supabaseClient.ts:13:if (key.startsWith('sb_secret_') || key.includes('service_role')) {
```

```bash
$ grep -rln "eyJhbGci\|sb_secret_\|gjfqnmustacsmwvccvou\|owgwlrrpqxlejbdodbsd" dist
dist/assets/index-LvXR277I.js
```

```bash
$ grep -rn "from('erp_authorized_users')" src
# (no output, exit code 1)
```

```bash
$ grep -rn "pzone_commercial_saved_bids_v1" src
src/lib/erpBridge.ts:715:    const raw = localStorage.getItem('pzone_commercial_saved_bids_v1');
```

```bash
$ grep -rn "commercial_config" src
src/components/CommercialBidPricePortal.jsx:303:  // Commercial BOQ PPTX Presentation Options (persisted per tender in commercial_config)
src/components/CommercialBidPricePortal.jsx:332:  // Hydrate saved commercial_config inputs (or reset to defaults) when selected tender changes
src/components/CommercialBidPricePortal.jsx:345:      targetRow.commercial_config &&
src/components/CommercialBidPricePortal.jsx:346:      typeof targetRow.commercial_config === 'object' &&
src/components/CommercialBidPricePortal.jsx:347:      !Array.isArray(targetRow.commercial_config)
src/components/CommercialBidPricePortal.jsx:348:        ? targetRow.commercial_config
src/components/CommercialBidPricePortal.jsx:1651:          commercial_config: commercialConfig,
src/components/CommercialBidPricePortal.jsx:1665:                commercial_config: commercialConfig,
src/lib/erpBridge.ts:705:  const rawConfig = matchedRow?.commercial_config as CommercialConfig | null | undefined;
src/lib/erpBridge.ts:713:  // One-time fallback when commercial_config is null on the tender_log row
```

```bash
$ grep -rn "Switch User\|switchUser\|isRealAppAdmin" src
# (no output, exit code 1)
```

```bash
$ git ls-files | grep -i "\.env"
.env.example
```

*Note on `grep -rln "eyJhbGci\|...\|gjfqnmustacsmwvccvou\|owgwlrrpqxlejbdodbsd" dist` matching `dist/assets/index-LvXR277I.js`:*
- `eyJhbGci`, `gjfqnmustacsmwvccvou`, and `owgwlrrpqxlejbdodbsd` all have **0 matches** in `dist/`.
- The match is solely the literal prefix guard string in Step 4's safety check (`src/lib/supabaseClient.ts:13`: `key.startsWith(...) `) and `@supabase/supabase-js`'s internal key-prefix validator in `node_modules/@supabase/supabase-js`. No actual secret key value exists anywhere in `src/` or `dist/`.
- Also note on `npm run lint || true`: `package.json` has no `lint` script defined (only `dev`, `build`, `preview`, `deploy`), and `npm` exited cleanly under `|| true`.

---

## 9. Things that were different from the instructions
| Instruction | What I found / did | Why |
| :--- | :--- | :--- |
| Step 0: `git log -1` must be `4f17f35` | Local `origin/main` was at `93ddd9a`, while `company/main` (`erppzoneinternational-lgtm/Tender-log-Tendring`) was at `4f17f35`. Created `feat/merge-platform` directly from `company/main` (`4f17f35`). | Ensures `feat/merge-platform` branches cleanly from the `4f17f35` root commit on `company` without pulling historical commits from `origin`. |
| Step 3: Declare the 4 new env names in `src/vite-env.d.ts` if present | No `src/vite-env.d.ts` (or `tsconfig.json`) exists in the repository; left as-is without inventing extra config files. | Step 3 specifies *"If `src/vite-env.d.ts` (or similar) declares env types, declare the 4 new names there."* |
| Step 4: Delete `supabaseUrl` export from `src/lib/supabase.js` | `src/components/DatabaseHealth.jsx:14,140` imported `supabaseUrl` from `../lib/supabase`. Updated `DatabaseHealth.jsx` to read `import.meta.env.VITE_SUPABASE_URL` directly. | Prevents a Rollup/Vite missing-export build failure after deleting `supabaseUrl` from `src/lib/supabase.js`. |
| Step 5: Remove `isRealAppAdmin` | Found an additional consumer in `src/pages/Notifications.tsx:210,294` (`(isRealAppAdmin \|\| canManageAdmin(user.role))`), updated to `canManageAdmin(user.role)`. | With user impersonation removed, `user.role === 'app_admin'` (`canManageAdmin`) is identical to `isRealAppAdmin`, and Step 10 requires zero hits for `isRealAppAdmin` in `src`. |
| Step 10: `dist` secret grep | `dist/assets/index-LvXR277I.js` matched the prefix literal from Step 4's browser guard (`supabaseClient.ts:13`) and `@supabase/supabase-js`'s internal key-format check. | Verified zero JWTs, zero secret keys, and zero legacy project refs exist in `dist/`. |

---

## 10. Anything I did not do or am not sure about
- All steps (Steps 0 through 13) were completed in full.
- Confirmed that none of the unmoved DB2 tables (`projects`, `activities`, `purchase_orders`, `vendors`, `contracts`, `user_roles`, etc.) are queried anywhere in `src/`, including `TABLES_CONFIG` in `src/lib/schemaData.js` (which lists only the 30 active ERP proposal, BOQ, catalog, civil/MEP spec, and geography tables).
- In `P7-tender-REPORT.md` Section 8, note that `npm --silent` / Git Bash suppressed stderr on missing `lint` script under `|| true`, producing empty stdout as shown verbatim.

---

## 11. Environment variables the app now needs (names only)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_AUTH_COOKIE_DOMAIN`
- `VITE_PORTAL_URL`

---

## Fix 1

### 1. Summary of Changes (`file:line`)
1. **Fresh role vs. cached profile list (`src/contexts/AppContext.tsx:163-186`)**
   - Updated the `"Keep user state synced when hydrated profiles updates"` effect so `role`, `module_permissions`, `can_access_commercial_overheads`, and `active` come **only** from `refresh()` (`src/contexts/AppContext.tsx:205-228`).
   - Removed the `live.active !== true` logout/no-access branch and removed `email`, `role`, `can_access_commercial_overheads`, and `module_permissions` from the hydrated `profiles` sync effect; the effect now compares and copies only `full_name`, `full_name_ar`, `team`, `phone`, and `avatar_url` onto `{ ...user, ... }` (`src/contexts/AppContext.tsx:168-184`).
2. **`refresh()` on a temporary error (`src/contexts/AppContext.tsx:204-231`)**
   - Separated transient read failures (`profileErr` at `src/contexts/AppContext.tsx:211-214` and thrown network errors in `catch` at `src/contexts/AppContext.tsx:229-231`) from missing/inactive profile rows.
   - On a temporary `profiles` read error (network / 5xx), `refresh()` now calls `setLoading(false)` and returns while preserving the current `user` and `noAccess` state.
   - `"No access"` (`setNoAccess(true)`) is shown only when the `profiles` query succeeds without error and `!row || row.active !== true` (`src/contexts/AppContext.tsx:216-222`).
3. **No database requests before sign-in (`src/main.jsx:1-14`)**
   - Removed the root `<LookupProvider>` import and wrapper from `src/main.jsx:6-13`, leaving `<LookupProvider>` mounted solely inside `src/pages/ErpWorkspacePage.tsx:321-520` for `/erp/*` routes.
4. **Existing columns & join keys in `syncAllErpTendersAndCostsToTenderLog` (`src/lib/erpBridge.ts:450-560, 621-625`)**
   - Replaced non-existent columns in the 4 ERP entry/finishes `.select(...)` calls (`src/lib/erpBridge.ts:450-461`) and aligned the phase/proposal/area/volume roll-up joins (`src/lib/erpBridge.ts:471-560, 621-625`) with all cost, margin, area, and volume formulas left untouched.

### 2. `useLookup` Screen & Component Check
- **Screens outside `/erp/*` using `useLookup`:** **None (`0` screens)**. Every non-ERP route (`/`, `/tenders`, `/tenders/new`, `/tenders/:id`, `/board`, `/dashboard`, `/reports`, `/notifications`, `/admin/users`, `/admin/lookups`, `/admin/rates`, `/admin/audit`) reads Tender Log lookups from `dataStore.ts` (`lookup_values`) after sign-in and has zero imports of `lookupContext`, `RecordDrawer`, `TableBrowser`, `TenderPortal`, `SearchableSelect`, or `StyledSelect`.
- **All `useLookup` consumers in `src/` (all rendered exclusively inside `ErpWorkspacePage.tsx:321-520` under `/erp/*`):**
  - `src/components/RecordDrawer.jsx:20` -> `TableBrowser.jsx:566` -> `DatabaseWorkspace.jsx:132` -> `ErpWorkspacePage.tsx:511` (`/erp/database/*`).
  - `src/components/TableBrowser.jsx:26` -> `DatabaseWorkspace.jsx:132` -> `ErpWorkspacePage.tsx:511` (`/erp/database/*`).
  - `src/components/TenderPortal.jsx:34` -> `ErpWorkspacePage.tsx:504` (`/erp/proposals`).
  - `src/components/SearchableSelect.jsx:42` (`useLookup() || {}`) -> used only by ERP forms/modals/tables (`CivilBoqTableTab.jsx`, `CreateTenderModal.jsx`, `EditTenderModal.jsx`, `PumpRoomDimensionsCard.jsx`, `PumpRoomFinishesForm.jsx`, `PumpRoomForm.jsx`, `PumpRoomStructuralForm.jsx`, `WaterFeatureDimensionsCard.jsx`, `WaterFeatureElectricalForm.jsx`, `WaterFeatureElectromechanicalPortal.jsx`, `WaterFeatureElectromechanicalSuite.jsx`, `WaterFeatureFinishesForm.jsx`, `WaterFeatureForm.jsx`, `WaterFeatureMechanicalForm.jsx`, `WaterFeatureStructuralForm.jsx`, `WfMepBoqTableTab.jsx`), all mounted under `ErpWorkspacePage.tsx:485-507` (`/erp/*`).
  - `src/components/StyledSelect.jsx:29` -> used only by ERP forms/tables (`CivilBoqTableTab.jsx`, `PumpRoomFinishesForm.jsx`, `PumpRoomForm.jsx`, `PumpRoomStructuralForm.jsx`, `WaterFeatureFinishesForm.jsx`, `WaterFeatureForm.jsx`, `WaterFeatureStructuralForm.jsx`), all mounted under `ErpWorkspacePage.tsx:485-490` (`/erp/*`).

### 3. `syncAllErpTendersAndCostsToTenderLog` Select Lists & Roll-Up Joins

| Table | Old `.select(...)` list | New `.select(...)` list |
| :--- | :--- | :--- |
| `proposal_data_entry` (`src/lib/erpBridge.ts:451-452`) | `'id, phase_id, linked_phase, project_title, proposal_id, tender_log_id, water_feature_area_m2, water_feature_volume_m3'` | `'id, phase_id, tender_log_id, water_feature_area_m2, water_feature_volume_m3'` |
| `pump_room_data_entry` (`src/lib/erpBridge.ts:454-455`) | `'id, phase_id, linked_phase, project_title, proposal_id, tender_log_id'` | `'id, linked_phase, tender_log_id'` |
| `proposal_finishes_water_feature` (`src/lib/erpBridge.ts:457-458`) | `'id, phase_id, linked_phase, project_title, proposal_id'` | `'id, linked_phase, linked_proposal'` |
| `proposal_finishes_pump_room` (`src/lib/erpBridge.ts:460-461`) | `'id, phase_id, linked_phase, project_title, proposal_id'` | `'id, linked_phase, linked_proposal'` |

**What the roll-up now matches on (`src/lib/erpBridge.ts:471-560, 621-625`):**
- **`phases` -> `tender_log` (`lines 472-475, 551-553`):** `phases.tender_log_id === tender_log.id` (`phaseToProposalMap` and per-tender `tPhaseIds`).
- **`proposal_data_entry` (`lines 480-490`):** `phase_id -> phases.id` (`recordToPhaseMap`) and `tender_log_id -> tender_log.id` (falling back to `phaseToProposalMap.get(phase_id)` in `recordToProposalMap`).
- **`pump_room_data_entry` (`lines 492-502`):** `linked_phase -> phases.id` (`recordToPhaseMap`) and `tender_log_id -> tender_log.id` (falling back to `phaseToProposalMap.get(linked_phase)` in `recordToProposalMap`).
- **`proposal_finishes_water_feature` & `proposal_finishes_pump_room` (`lines 504-519`):** `linked_phase -> proposal_data_entry.id` / `pump_room_data_entry.id` (resolved to `phases.id` through `recordToPhaseMap`, or direct `phases.id` if present in `phaseIdsSet`) and `linked_proposal -> tender_log.id` (falling back to `recordToProposalMap.get(linked_phase)` or `phaseToProposalMap.get(phaseId)`).
- **`proposal_breakdown_items` BOQ cost roll-up (`lines 521-560`):** `item.tender_log_id` (or resolved `proposal_id` via `recordToProposalMap` / `phaseToProposalMap`) `=== tender_log.id`, or `item.phase_id` (resolved via `recordToPhaseMap` when holding an entry/finishes record ID) in `tPhaseIds`.
- **Water Feature area & volume roll-up (`lines 621-625`):** `proposal_data_entry.tender_log_id === tender_log.id` or `proposal_data_entry.phase_id` in `tPhaseIds`, summing `water_feature_area_m2` and `water_feature_volume_m3`.

### 4. Build Output (`npm run build`)
```bash
$ npm run build

> pzone-intelligent-tendering-system@1.0.0 build
> vite build

vite v6.4.3 building for production...
transforming...
✓ 2462 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.29 kB │ gzip:     0.62 kB
dist/assets/index-BM83naN9.css    273.70 kB │ gzip:    31.50 kB
dist/assets/index-DDnhy4dl.js   4,216.85 kB │ gzip: 1,021.88 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 6.80s
```

---

## Fix 2

### 1. Summary of Changes (`file:line`)
1. **Stop live sync & clear workspace storage (`src/lib/supabaseSync.ts:123-168, 204-206, 245-372, 382-468` & `src/lib/dataStore.ts:78-80, 140, 180-315, 550-556, 762`)**
   - Added `stopAndDrainSupabaseSync(maxWaitMs = 3000)` and `resumeSupabaseSync()` (`src/lib/supabaseSync.ts:128-168`), which stop Realtime channels (`supabase.removeAllChannels()`), cancel pending timers and queued sync steps (`syncStopped`), block new writes after clearing, and wait up to 3 s for any in-flight sync write (`activeWritePromise`).
   - Added `registerLiveSyncCleanup()` (`src/lib/dataStore.ts:183-188`) and exported `clearTenderLocalData()` (`src/lib/dataStore.ts:202-255`), which stops the 15 s live-sync timer and focus/visibility listeners, drains in-flight sync writes (max 3 s), locks out subsequent writes until a fresh session starts (`isLocalDataCleared`), removes every `pzone_*` key from `localStorage` (except `pzone_theme`, `pzone_lang`, `pzone_commercial_saved_bids_v1`) and `sessionStorage` without touching `sb-*` auth cookies/storage or `PORTAL_URL`, clears `memoryCache`, and notifies subscribers so the current page resets to empty arrays.
2. **i18n label (`src/lib/i18n.ts:35, 91, 273, 329`)**
   - Added `topbar.backToPortal` (`'Back to Portal'` in EN at `src/lib/i18n.ts:35`; `'العودة إلى البوابة'` in AR at `src/lib/i18n.ts:273`) and removed `topbar.signOut` and `noAccess.signOut`.
3. **Top bar Back to Portal button (`src/components/layout/Topbar.tsx:7, 16-17, 42-56, 192-201`)**
   - Replaced the `LogOut` / `signOut` button with **Back to Portal** (`LayoutGrid` icon + `t('topbar.backToPortal')`), calling `await clearTenderLocalData()` followed by `window.location.assign(\`${PORTAL_URL}/?stay=1\`)`.
   - Checked `src/components/layout/Sidebar.tsx` (`lines 1-642`): no sign-out button exists in the desktop or mobile sidebar.
4. **"No access" screen, session-end cleanup, and `signOut()` removal (`src/contexts/AppContext.tsx:3, 12, 18, 29-33, 59-110, 189-196, 251-261, 310-323, 464-494`)**
   - Deleted the unused `signOut()` export, `AppContextValue.signOut`, and `handleSignOut`.
   - Updated `NoAccessScreen` (`src/contexts/AppContext.tsx:59-110`) to remove the Sign out button and keep only **Back to Portal** (`await clearTenderLocalData()` then `window.location.assign(\`${PORTAL_URL}/?stay=1\`)`).
   - Updated `refresh()` when no session is found (`src/contexts/AppContext.tsx:189-196`) and `onAuthStateChange` on `SIGNED_OUT` (`src/contexts/AppContext.tsx:251-261`) to call `clearTenderLocalData()` before `goToPortalLogin()`.
   - Registered the 15 s live-sync loop cleanup via `registerLiveSyncCleanup(stopLiveLoop)` (`src/contexts/AppContext.tsx:310-323`).

### 2. Storage Keys Cleared and Kept

**Keys kept (untouched by `clearTenderLocalData()`):**
- `localStorage` `pzone_theme` — user theme choice (written at `src/contexts/AppContext.tsx:421` and preserved at `src/lib/dataStore.ts:147`).
- `localStorage` `pzone_lang` — user language choice (written at `src/contexts/AppContext.tsx:435` and preserved at `src/lib/dataStore.ts:148`).
- `localStorage` `pzone_commercial_saved_bids_v1` — Fix 9b one-time read-only fallback (read at `src/lib/erpBridge.ts:739`; no writer).
- Shared Supabase auth cookie and `sb-*` browser storage, `PORTAL_URL`, and any non-`pzone_` keys belonging to other apps.

**Keys removed from `localStorage` (every `pzone_*` key except the 3 above):**
| Key | Constant / Location | Writer (`file:line`) |
| :--- | :--- | :--- |
| `pzone_prod_v1_profiles` | `STORAGE_KEYS.PROFILES` (`src/lib/dataStore.ts:86`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_v1_lookups` | `STORAGE_KEYS.LOOKUPS` (`src/lib/dataStore.ts:87`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_v1_fx_rates` | `STORAGE_KEYS.FX_RATES` (`src/lib/dataStore.ts:88`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_v1_audit_log` | `STORAGE_KEYS.AUDIT_LOG` (`src/lib/dataStore.ts:89`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_v1_tenders` | `STORAGE_KEYS.TENDERS` (`src/lib/dataStore.ts:90`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_v1_components` | `STORAGE_KEYS.COMPONENTS` (`src/lib/dataStore.ts:91`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_v1_documents` | `STORAGE_KEYS.DOCUMENTS` (`src/lib/dataStore.ts:92`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_v1_assignments` | `STORAGE_KEYS.ASSIGNMENTS` (`src/lib/dataStore.ts:93`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_v1_tasks` | `STORAGE_KEYS.TASKS` (`src/lib/dataStore.ts:94`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_v1_comments` | `STORAGE_KEYS.COMMENTS` (`src/lib/dataStore.ts:95`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_v1_notifications` | `STORAGE_KEYS.NOTIFICATIONS` (`src/lib/dataStore.ts:96`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_v1_notif_prefs` | `STORAGE_KEYS.NOTIF_PREFS` (`src/lib/dataStore.ts:97`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_v1_saved_views` | `STORAGE_KEYS.SAVED_VIEWS` (`src/lib/dataStore.ts:98`) | `src/lib/dataStore.ts:307` (`persistCacheOnly`) |
| `pzone_prod_clean_slate_v2_empty` | `CLEAN_SLATE_MARKER` (`src/lib/dataStore.ts:131`) | `src/lib/dataStore.ts:149` |
| `pzone_audit_cleared_before_v1` | `AUDIT_CLEARED_STORAGE_KEY` (`src/lib/dataStore.ts:460`) | `src/lib/dataStore.ts:505` |
| `pzone_active_erp_tender_v1` | `ACTIVE_ERP_TENDER_KEY` (`src/lib/erpBridge.ts:68`) | `src/lib/erpBridge.ts:84` |
| `pzone_wizard_draft_v3_geo` | `WIZARD_DRAFT_KEY` (`src/pages/TenderNew.tsx:27`) | `src/pages/TenderNew.tsx:193` *(plus legacy `pzone_wizard_draft_v1`, no active writer)* |
| `pzone_tender_log_header_expanded` | Inline key (`src/pages/Tenders.tsx:115`) | `src/pages/Tenders.tsx:125` |
| `pzone_shown_device_notifs_<userId>` | Per-user key (`src/contexts/AppContext.tsx:336`) | `src/contexts/AppContext.tsx:402` |
| Legacy `pzone_*` keys (if present) | e.g. `pzone_session_email`, `pzone_signed_out` | No active writers (removed in `feat/merge-platform`) |

**Keys removed from `sessionStorage`:**
- Every key starting with `pzone_` (`0` active writers in current code; removes any leftover legacy `pzone_admin_switch_user_id`).

### 3. Button Code Before and After

**Topbar (`src/components/layout/Topbar.tsx`) — Before (`lines 186-193`):**
```tsx
            <button
              type="button"
              onClick={signOut}
              title={t('topbar.signOut')}
              className="p-2 rounded-xl text-muted-foreground hover:text-pzone-crimson hover:bg-pzone-crimson/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
```

**Topbar (`src/components/layout/Topbar.tsx`) — After (`lines 53-56, 192-201`):**
```tsx
  const handleBackToPortal = async () => {
    await clearTenderLocalData();
    window.location.assign(`${PORTAL_URL}/?stay=1`);
  };
...
            <button
              type="button"
              onClick={() => void handleBackToPortal()}
              title={t('topbar.backToPortal')}
              aria-label={t('topbar.backToPortal')}
              className="inline-flex items-center gap-1.5 p-2 xl:px-3 xl:py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-pzone-teal hover:bg-pzone-teal/10 transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span className="hidden xl:inline">{t('topbar.backToPortal')}</span>
            </button>
```

**`NoAccessScreen` (`src/contexts/AppContext.tsx`) — Before (`lines 99-113`):**
```tsx
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href={PORTAL_URL}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-pzone-navy hover:bg-pzone-navy/90 dark:bg-pzone-teal dark:hover:bg-pzone-teal/90 text-white text-xs font-semibold transition-colors text-center"
          >
            {t('noAccess.backToPortal')}
          </a>
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold transition-colors cursor-pointer"
          >
            {t('noAccess.signOut')}
          </button>
        </div>
```

**`NoAccessScreen` (`src/contexts/AppContext.tsx`) — After (`lines 64-67, 97-106`):**
```tsx
  const handleBackToPortal = async () => {
    await clearTenderLocalData();
    window.location.assign(`${PORTAL_URL}/?stay=1`);
  };
...
        <div className="flex items-center justify-center pt-2">
          <button
            type="button"
            onClick={() => void handleBackToPortal()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-pzone-navy hover:bg-pzone-navy/90 dark:bg-pzone-teal dark:hover:bg-pzone-teal/90 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>{t('topbar.backToPortal')}</span>
          </button>
        </div>
```

### 4. Build & Grep Verification

```bash
$ npm run build

> pzone-intelligent-tendering-system@1.0.0 build
> vite build

vite v6.4.3 building for production...
transforming...
✓ 2462 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.29 kB │ gzip:     0.63 kB
dist/assets/index-CmrrlHWD.css    273.83 kB │ gzip:    31.53 kB
dist/assets/index-DyYKRGv5.js   4,217.76 kB │ gzip: 1,022.07 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 8.00s
```

```bash
$ grep -rn "signOut\|topbar.signOut" src
# (no output, exit code 1 — signOut() export and all Sign Out buttons/keys deleted; Supabase SIGNED_OUT is handled via onAuthStateChange at src/contexts/AppContext.tsx:251-261)
```

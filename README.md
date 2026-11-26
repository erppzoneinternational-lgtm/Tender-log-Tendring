# Intelligent Tendering System

[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

An enterprise-grade ERP Engineering Estimation & Intelligent Tendering Engine designed specifically for **Swimming Pools, Water Features, Underground Pump Rooms, and MEP/Civil Infrastructure**.

---

## 🌟 Architecture & Semantic Routes

The system uses a zero-dependency, ultra-fast **Native Browser History Router** (`src/lib/router.jsx`) providing instant page transitions and direct bookmarkable URLs:

| Route Path | Workspace Module | Purpose |
|---|---|---|
| `/` | **System Launchpad** | Executive hub with system health status and 5-portal quick-launch grid. |
| `/tenders` | **Tender Log & Proposals** | Proposal creation, cascading geography, stakeholder lookups, and multi-phase management. |
| `/water-features` | **Technical Specifications Suite** | Full-width 2-tab data hub for Water Features (`proposal_data_entry`) and Pump Rooms (`pump_room_data_entry`) with SHOW_IF conditional logic and real-time geometry/hydraulic calculators. |
| `/structural-works` | **Civil & Structural Works Hub** | 5-tab multi-trade estimation suite: WF Structural, PR Structural, WF Finishes, PR Finishes, and **Civil Master BOQ Table** syncing into `proposal_breakdown_items`. |
| `/wf-electromechanical` | **WF Electromechanical (MEP) Portal** | 3-tab MEP engineering suite: Filtration & Hydraulics, Underwater Lighting & Power, and **MEP Master BOQ Table** syncing into `proposal_breakdown_items`. |
| `/database/explorer` | **Database Explorer** | Real-time browser for all 32 Supabase tables with UUID-to-Title translation and pagination. |
| `/database/graph` | **Interactive ERD Graph** | Visual node graph showing entity relationships and foreign key linkages. |
| `/database/dictionary` | **Schema Dictionary** | Data matrix of table definitions, primary keys, and data types. |
| `/database/health` | **Database Health & Latency** | Live API latency ping, connection diagnostics, and record distribution. |

---

## 🌊 Technical Specifications Suite (`/water-features`)

A dedicated full-width 2-tab technical data hub with tabular scope browsers, live counters, search filtering, and modal data entry dialogs.

### Tab 1: Water Features (`proposal_data_entry`)
* **Section 0: Proposal & Phase Linkage**:
  * Active Tender Proposal selector (`tender_log`).
  * Filtered Water Feature Phase selector (`phases` where `component_type == 'Water Feature'`).
* **Section 1: Classification & Core Geometry**:
  * **Category**: `Swimming Pool` vs `Lagoon` (with auto-synchronized sub-types).
  * **Type**: `Overflow`, `Skimmer`, `Olympic Pool` for pools; `Concrete Base Lagoon`, `Sand Base Lagoon` for lagoons.
  * **Shape & Finishes**: `Rectangle` / `Free Form`; Finishes from database (`Mosaic`, `Liner`, `Ceramic`).
  * **Auto Geometry Formulas**:
    $$\text{Avg Height} = \frac{\text{Shallow Height} + \text{Deep Height}}{2}$$
    $$\text{Rectangle Area} = \text{Length} \times \text{Width} \quad \text{(Auto-locked for rectangle pools)}$$
    $$\text{Rectangle Perimeter} = 2 \times (\text{Length} + \text{Width})$$
    $$\text{Water Volume} = \text{Surface Area} \times \text{Avg Height}$$
  * **Turnover & Usage**: `Swimmable` (default 6h turnover) vs `Unswimmable` (default 12h turnover).
  * **Sand Base Lagoon**: Unlocks `Walls Ground Base Width (m)` (default 1.2 m).
* **Section 2: Beach & Shore Options (SHOW_IF: Lagoon)**:
  * Length, Width, and Auto-calculated Beach Area $(\text{Length} \times \text{Width})$.
* **Section 3: Deep Retaining Walls (SHOW_IF: Lagoon)**:
  * Outer/Internal wall heights & lengths, auto-summing Total Wall Length.
* **Section 4: Lagoon Amenities (SHOW_IF: Lagoon)**:
  * Chaise Lounges & Love Seats dimensions with instant surface area computation.
* **Section 5: Island Structures & Concrete Stairs (Common)**:
  * Island 01/02/03 perimeters, areas, and heights.
  * Concrete stair types (`Reinforced Concrete`, `Plain Concrete`), lengths, and heights.

---

### Tab 2: Pump Rooms (`pump_room_data_entry`)
* **Section 0: Proposal & Phase Linkage**:
  * Active Tender Proposal & filtered Pump Room Phase selector (`phases` where `component_type == 'Pump Room'`).
* **Section 1: Main Pump Room Geometry**:
  * Length, Width, Height with live computed Area $(L \times W)$ and Perimeter $(2 \times (L + W))$.
* **Section 2: Sump Pit (Drainage Pit)**:
  * Footprint Area ($1.0\text{ m}^2$), Formwork Perimeter ($4.0\text{ m}$), and Depth Below Slab ($1.0\text{ m}$).
* **Section 3: Balance Tank (Surge Storage)**:
  * Inner Length, Width, Height with live computed Area, Perimeter, and Surge Storage Volume ($L \times W \times H$).
  * Site Accommodations Required (`No`, `Yes`).

---

## 🎨 UI & Custom Component Architecture

* **`StyledSelect` (`src/components/StyledSelect.jsx`)**:
  * Custom styled dropdowns replacing native OS selects.
  * 180° animated chevrons, category subtitles, active checkmark badges, and instant clear `(✕)` button.
* **`SearchableSelect` (`src/components/SearchableSelect.jsx`)**:
  * Real-time combobox with instant text search, auto UUID translation, and quick-add modals.
* **`lookupContext.jsx` (`src/lib/lookupContext.jsx`)**:
  * Global foreign key caching provider translating 36-character UUIDs across all 30+ tables into readable titles.
* **Full-Width Responsive Grid**:
  * 100% full-width viewports with zero awkward side margins, optimized for engineering workstations.

---

## 📋 Tender Log & Proposal Engine (`/tenders`)

### 1. Basic Identification & Auto-Naming Engine
* **Proposal Year** (`proposal_year`): Automatically populated with the current year (e.g. `2026`).
* **Proposal Code** (`proposal_number`): Scans all existing database records for the current year and auto-generates the sequential code:
  $$\text{Next Code} = \text{"SP."} + \text{Year} + \text{"."} + \text{Pad2}(\text{MaxSerial} + 1) \quad (\text{e.g. } \text{SP.2026.04})$$
* **Editable Override**: The proposal code can be directly modified or customized in the input box, with a one-click **"Reset to Auto"** button.
* **Project Title** (`proposal_title`): User-entered descriptive name (e.g. *Marassi Beach Club*).
* **Full Title** (`proposal_full_title`): Dynamically constructed in real time:
  $$\text{Full Title} = \text{proposal\_number} + \text{": "} + \text{proposal\_title} \quad (\text{e.g. } \text{SP.2026.04: Marassi Beach Club})$$

---

### 2. 4-Tier Cascading Geolocation Engine
Filters dropdown options dynamically from the database:
$$\text{Country (Default: Egypt)} \longrightarrow \text{Governorate} \longrightarrow \text{Region / City} \longrightarrow \text{District}$$
* Changing a parent location immediately resets and filters the child dropdowns.
* **Searchable Combobox (`<SearchableSelect>`)**: Instant real-time filtering as you type.
* **Inline Quick-Add Dialogs**: Add new Countries, Governorates, Regions, or Districts directly from the dropdown without leaving the form.

---

### 3. Stakeholders & Consultant Team Directory
* **Project Owner / Client**: Selected from `clients` directory with quick search and inline client creation.
* **Main Contractor**: Searchable lookup reading from the `clients` table.
* **P.ZONE Role** (Strict): `Sub Contractor` vs `Main Contractor`.
* **Multi-Disciplinary Consultants**: Searchable lookups reading from `clients` for:
  * *Civil Consultant*
  * *Mechanical Consultant*
  * *Electric Consultant*
  * *Landscape Consultant*

---

### 4. Scheduling & Deadline Automation
* **Proposal Request Date**: Defaults to current date (`YYYY-MM-DD`).
* **Target Submittal Date**: Auto-calculated as $\text{Request Date} + 7\text{ Days}$.
* **Proposal Status Workflow**: `In Progress`, `Sent`, `Hold`, `Not Sent`, `Out of Scope`, `Cancelled`.
* **Sent Timestamp Capture**: Automatically timestamps `sent_date` when status transitions to `Sent`.

---

### 5. Direct Child Phase Spawning & Discipline Selectors
* **`+ Add Water Feature`**: Adds a new basin phase (e.g. *Swimming Pool 01*, *Swimming Pool 02*).
* **`+ Add Pump Room`**: Adds an equipment room phase (e.g. *Pump Room 01*).
* **Interactive Discipline Pill Selector**:
  * 🔵 **Civil Structural** (`Civil Structural Works`)
  * 🟢 **Finishes** (`Finishes Works`)
  * 🔷 **Mechanical** (`Mechanical Works`)
  * 🟡 **Electrical** (`Electrical Works`)
  * **Quick Presets**: *"Select All (4 Trades)"* and *"MEP Only"*.
* **Database Persistence**: When saved, inserts the parent into `tender_log`, then uses the returned ID to insert all child phase rows into `phases` with `phase_full_title` (`${proposal_number}.${phase_title}`).

---

## 🗄️ Database Tables Breakdown

| Domain | Key Tables | Description |
|---|---|---|
| **Tenders & Scopes** | `tender_log`, `phases`, `boq_items`, `clients` | Proposal registry (32 columns), project scopes (10 columns), itemized BOQ, clients directory |
| **Technical Data Entry** | `proposal_data_entry`, `pump_room_data_entry` | Basin geometries, water volumes, turnover filtration hours, deep walls, surge balance tanks, sump pits |
| **Master Catalog** | `items`, `brands`, `item_categories`, `boq_work_type` | Master price book (1,150+ items), manufacturers, units |
| **MEP Equipment** | `filter_pump_types`, `filter_types`, `cable_types`, `cable_glands`, `cable_conduits`, `lighting_type`, `transformer_type`, `junction_box`, `heaters`, `disconnect_switch_types` | Hydraulic pumps, sand filters, subsea lighting, power wiring, transformers |
| **Civil & Finishes** | `civil_material_types`, `finishes_category`, `finishes_type`, `water_feature_categories`, `water_feature_types`, `lambda_factor`, `pump_room_structural_works` | Concrete sizing, finishes mosaic, earthing resistance coefficients |
| **Geography** | `countries`, `governorates`, `regions`, `districts` | 4-Tier hierarchical territory mapping |

---

## 📁 Modular Clean Code Structure

```text
src/
├── components/
│   ├── WaterFeaturePortal.jsx  # Full-width 2-tab Technical Specifications data hub
│   ├── WaterFeatureForm.jsx    # 5-Section Water Feature geometry, beach & amenities form
│   ├── PumpRoomForm.jsx        # 3-Section Pump Room, sump pit & balance tank form
│   ├── StyledSelect.jsx        # Custom styled dropdown component with animations & checkmarks
│   ├── CreateTenderModal.jsx   # Tender creation wizard with 5 sections & scope pills
│   ├── EditTenderModal.jsx     # Proposal editing dialog (code, title, dates, stakeholders)
│   ├── TenderDetailDrawer.jsx  # Read-only slide-over inspection drawer
│   ├── QuickAddModal.jsx       # Universal quick-add modal for geo and clients
│   ├── SearchableSelect.jsx    # Real-time searchable combobox with quick-add trigger
│   ├── TenderPortal.jsx        # Tender workspace, statistics ribbon, table and card views
│   ├── TableBrowser.jsx        # Live Supabase table explorer with translated FKs
│   ├── RelationshipGraph.jsx   # Interactive visual ERD node canvas
│   ├── DataDictionary.jsx      # Schema data matrix & engineering dictionary
│   ├── DatabaseHealth.jsx      # Live latency diagnostics & ping
│   ├── Navbar.jsx              # Full-width navigation bar with active route highlighting
│   ├── PortalHome.jsx          # System launchpad with interactive navigation cards
│   ├── RecordDrawer.jsx        # Table record inspection drawer
│   └── ErrorBoundary.jsx       # Global React error boundary
├── lib/
│   ├── router.jsx              # Zero-dependency browser history router
│   ├── supabase.js             # Supabase client connection
│   ├── schemaData.js           # 30+ table schemas, relationships & categories
│   ├── lookupContext.jsx       # Dynamic UUID-to-title caching and translation provider
│   └── staticLookup.js         # Pre-indexed catalog lookup dictionary
├── App.jsx                     # Full-width application layout & route switcher
├── main.jsx                    # React 19 entry point
└── index.css                   # Tailwind CSS styling & animations
```

---

## 🏗️ Civil & Structural Works Hub (`/structural-works`)

An estimation engine supporting multi-trade calculations and live BOQ generation.

### 1. Water Feature Structural Works (`water_feature_structural_works`)
* **Excavation Works**: Footing extension, depth calculation, total cubic meters $(\text{m}^3)$.
* **Plain Concrete (PC)**: Footing area, thickness, ready-mix concrete, geomembrane polyethylene sheets $(\text{kg})$.
* **Reinforced Concrete (RC)**: Grade selection ($25, 30, 35\text{ N/mm}^2$), ground slab, vertical walls, rebar density $(\text{kg/m}^3)$, vibrator machines.
* **Coffor Formwork**: Isolated panel system calculated via perimeter and forming height.
* **Waterproofing**: Dual-section architecture:
  * *Section 6*: Bituminous & Torch-applied Membrane (external envelope).
  * *Section 7*: Cementitious Waterproofing (internal wet surfaces & balance tanks).
* **Sorted BOQ Breakdowns**: Itemized tables across all trades sorted by `total_cost` descending.

### 2. Pump Room Structural Works (`pump_room_structural_works`)
* **Upstream Sync**: Reads pump room length, width, height, balance tank, and sump pit directly from `pump_room_data_entry`.
* **Forming Height**:
  $$\text{Forming Height} = H_{\text{PR}} + T_{\text{RC, ground}} + T_{\text{RC, ceiling}}$$
* **RC Dimensions**:
  $$L_{\text{RC}} = L_{\text{PR}} + W_{\text{BT}} + 2 \times T_{\text{RC, wall}}, \quad W_{\text{RC}} = W_{\text{PR}} + 2 \times T_{\text{RC, wall}}$$
* **PC Dimensions**:
  $$L_{\text{PC}} = L_{\text{RC}} + 2 \times T_{\text{PC}} + 2 \times F_{\text{PC}}, \quad W_{\text{PC}} = W_{\text{RC}} + 2 \times T_{\text{PC}} + 2 \times F_{\text{PC}}$$
* **Coffor Area**:
  $$A_{\text{coffor}} = \lceil 2(L_{\text{RC}} + W_{\text{RC}}) \times \text{Forming Height} + \lceil P_{\text{sumpit}} \times H_{\text{sumpit}} \rceil \rceil$$
* **Waterproofing**:
  $$A_{\text{bitu}} = \lceil (L_{\text{PC}} \times W_{\text{PC}}) + 2(L_{\text{RC}} + W_{\text{RC}}) \times (\text{Forming Height} + 0.1) + (L_{\text{RC}} \times W_{\text{RC}}) \rceil$$
  $$A_{\text{cem}} = \lceil 2(L_{\text{BT}} + W_{\text{BT}}) \times H_{\text{PR}} + A_{\text{BT}} + \lceil A_{\text{sumpit}} + (H_{\text{sumpit}} \times P_{\text{sumpit}}) \rceil \rceil$$

---

## 🛡️ In-App Modal Dialog & Entity Resolution Architecture

### 1. In-App Glassmorphism Confirmation Dialogs
* **Zero Native Browser Popups**: Complete replacement of all native browser `window.confirm()` and `alert()` popups with high-contrast, accessible Tailwind CSS glassmorphic modals.
* **Contextual Danger Alerts**:
  * Action-specific alert badges (`Trash2` in rose tint).
  * Dynamic confirmation titles identifying the exact target (e.g. *Delete tender "SP.2026.04: Amr Proposal" and all 103 breakdown items?*).
  * Safe non-destructive **Cancel** and animated **Delete Permanently** buttons with loading spinners.
* **Instant Toast Banners**: Real-time non-blocking status notifications for creates, updates, status changes, and error alerts.

### 2. Cascading Relational Deletion Engine
* Multi-level cascade integrity preventing foreign key violations and eliminating orphan records:
  1. Retrieve all child `phases` associated with the target `tender_log_id`.
  2. Cascade-delete all `proposal_breakdown_items` referencing either `phase_id` or `tender_log_id`.
  3. Delete finishes entries from `proposal_finishes_water_feature` and `proposal_finishes_pump_room`.
  4. Delete structural entries from `water_feature_structural_works` and `pump_room_structural_works`.
  5. Delete technical specifications from `proposal_data_entry` and `pump_room_data_entry`.
  6. Delete child `phases`.
  7. Delete parent `tender_log` record.

### 3. Water Feature Type & Category Resolvers (`src/lib/staticLookup.js`)
* **`resolveWaterFeatureType(pde)`**:
  * Resolves raw database UUIDs and values into clean, professional titles (*Overflow*, *Skimmer*, *Skimfilter*, *Concrete Base Lagoon*, *Sand Base Lagoon*, *Olympic Pool*).
  * Displays informative **`Pending Specification`** badges for newly spawned phases before technical parameters are entered, avoiding arbitrary default fallbacks.
* **`resolveCategoryName(item)`**:
  * Dynamically translates internal category UUIDs into standard trade headers (*Reinforced Concrete*, *Plain Concrete*, *Bituminous Waterproofing*, *Cementitious Waterproofing*, *Coffor Formwork*, *UPVC Piping*, *Submersible Pumps*, etc.) across all Master BOQ tables and CSV export feeds.
* **`resolvePhaseForRecord` & `resolveProposalForRecord`**:
  * Resolves intermediate data entry technical UUIDs to true parent Phase names (e.g. *Swimming Pool 01*, *Pump Room 01*) with zero UUID leakage into table views.

---

## 🚀 Development & Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build
npm run build
```

---

## 🛡️ License
Proprietary software developed for **PZONE**. All rights reserved.



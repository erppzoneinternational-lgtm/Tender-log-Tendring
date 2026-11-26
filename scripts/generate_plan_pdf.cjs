const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Read and encode the PZONE logo
const logoPath = path.resolve(__dirname, '../public/Horizontal Logo (black).png');
let logoBase64 = '';
if (fs.existsSync(logoPath)) {
  const logoBuffer = fs.readFileSync(logoPath);
  logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
} else {
  console.warn('Logo file not found at:', logoPath);
}

// 2. Build HTML Content
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PZONE Intelligent Tendering System - Implementation & Rollout Plan</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @page {
    size: A4 portrait;
    margin: 8mm 11mm 8mm 11mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.35;
    font-size: 8.5pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page-container {
    width: 100%;
    height: 279mm;
    max-height: 279mm;
    position: relative;
    padding-bottom: 24px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .page-break {
    page-break-after: always;
    break-after: page;
  }

  .no-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Header Bar */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 6px;
    margin-bottom: 9px;
  }

  .header-logo img {
    height: 34px;
    max-width: 210px;
    object-fit: contain;
  }

  .header-meta {
    text-align: right;
    font-size: 7.2pt;
    color: #64748b;
    line-height: 1.25;
  }

  .header-meta strong {
    color: #0f172a;
    font-weight: 700;
  }

  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 6.8pt;
    font-weight: 700;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }

  .badge-primary { background-color: #0284c7; color: #ffffff; }
  .badge-success { background-color: #0d9488; color: #ffffff; }
  .badge-amber   { background-color: #d97706; color: #ffffff; }
  .badge-slate   { background-color: #334155; color: #ffffff; }
  .badge-hotline { background-color: #059669; color: #ffffff; }

  /* Title Hero */
  .title-hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 65%, #0369a1 100%);
    color: #ffffff;
    border-radius: 5px;
    padding: 11px 15px;
    margin-bottom: 9px;
  }

  .title-hero h1 {
    font-size: 13.5pt;
    font-weight: 800;
    letter-spacing: -0.3px;
    color: #38bdf8;
    margin-bottom: 2px;
    text-transform: uppercase;
  }

  .title-hero .subtitle {
    font-size: 8.5pt;
    color: #e2e8f0;
    font-weight: 400;
    margin-bottom: 6px;
  }

  .title-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    font-size: 7.2pt;
  }

  .title-grid-item span {
    display: block;
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 6.2pt;
    font-weight: 600;
  }

  .title-grid-item strong {
    color: #f8fafc;
    font-size: 7.6pt;
  }

  /* Hot Callout Banner (Admin 24/7) */
  .admin-hotline-card {
    background: linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 100%);
    border: 1.5px solid #059669;
    border-left: 5px solid #059669;
    border-radius: 4px;
    padding: 7px 11px;
    margin-bottom: 9px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .admin-hotline-left {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .admin-hotline-icon {
    background-color: #059669;
    color: #ffffff;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 13pt;
  }

  .admin-hotline-text h3 {
    font-size: 8.2pt;
    color: #065f46;
    font-weight: 800;
    text-transform: uppercase;
    margin-bottom: 1px;
  }

  .admin-hotline-text p {
    font-size: 7.2pt;
    color: #047857;
    line-height: 1.3;
  }

  .admin-hotline-badges {
    text-align: right;
    font-size: 7.2pt;
    color: #065f46;
  }

  /* Section Styling */
  .section {
    margin-bottom: 9px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 9.2pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 3px;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: -0.2px;
  }

  .section-title .step-pill {
    background-color: #0284c7;
    color: #ffffff;
    font-size: 7pt;
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 700;
  }

  /* Grids */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 7px;
  }

  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  /* Cards */
  .card {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 7px 9px;
  }

  .card-highlight {
    background-color: #ffffff;
    border: 1.5px solid #0284c7;
    box-shadow: 0 1px 3px rgba(2, 132, 199, 0.06);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .card-title {
    font-size: 8pt;
    font-weight: 700;
    color: #0f172a;
  }

  .card-p {
    font-size: 7.4pt;
    color: #475569;
    line-height: 1.32;
    margin-bottom: 3px;
  }

  /* Step Flow Compact */
  .step-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-left: 3.5px solid #0284c7;
    border-radius: 4px;
    padding: 6px 8px;
    margin-bottom: 6px;
  }

  .step-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }

  .step-title {
    font-size: 7.9pt;
    font-weight: 700;
    color: #0f172a;
  }

  .step-desc {
    font-size: 7.1pt;
    color: #475569;
    line-height: 1.28;
  }

  .flow-tags {
    margin-top: 3px;
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
  }

  .tag {
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #334155;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 6.2pt;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
  }

  .tag-cyan { background-color: #e0f2fe; border-color: #bae6fd; color: #0369a1; }
  .tag-emerald { background-color: #d1fae5; border-color: #a7f3d0; color: #047857; }

  /* Tables */
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.1pt;
    margin-top: 3px;
    margin-bottom: 3px;
  }

  table.data-table th {
    background-color: #0f172a;
    color: #f8fafc;
    text-align: left;
    padding: 3.5px 5.5px;
    font-weight: 700;
    font-size: 6.7pt;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    border: 1px solid #1e293b;
  }

  table.data-table td {
    padding: 3.5px 5.5px;
    border: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: top;
    line-height: 1.25;
  }

  table.data-table tr:nth-child(even) {
    background-color: #f8fafc;
  }

  .table-mono {
    font-family: 'JetBrains Mono', monospace;
    font-size: 6.8pt;
    font-weight: 600;
  }

  /* Footer */
  .doc-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 4px;
    font-size: 6.8pt;
    color: #94a3b8;
  }

  .doc-footer strong {
    color: #475569;
  }

  /* Timeline & Sign-off */
  .timeline-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-top: 4px;
  }

  .timeline-col {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-top: 3px solid #0284c7;
    border-radius: 4px;
    padding: 5px 7px;
  }

  .timeline-col.active {
    border-top-color: #0d9488;
    background-color: #f0fdfa;
  }

  .timeline-title {
    font-size: 7.3pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
  }

  .timeline-desc {
    font-size: 6.6pt;
    color: #64748b;
    line-height: 1.22;
  }

  .sign-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 7px;
    margin-top: 5px;
  }

  .sign-box {
    border: 1px dashed #cbd5e1;
    border-radius: 4px;
    padding: 5px;
    background-color: #ffffff;
    text-align: center;
  }

  .sign-box .role {
    font-size: 6.8pt;
    font-weight: 700;
    color: #0f172a;
    text-transform: uppercase;
  }

  .sign-box .name {
    font-size: 7.2pt;
    color: #0284c7;
    font-weight: 600;
    margin: 10px 0 3px 0;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 2px;
  }

  .sign-box .date {
    font-size: 6.2pt;
    color: #94a3b8;
  }

  /* Formula Box */
  .formula-card {
    background-color: #0f172a;
    color: #e2e8f0;
    border-radius: 4px;
    padding: 5px 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 6.8pt;
    line-height: 1.35;
    margin: 3px 0;
  }
  .formula-card strong { color: #38bdf8; }
</style>
</head>
<body>

<!-- ================================================= PAGE 1 ================================================= -->
<div class="page-container page-break">
  <!-- Document Header -->
  <div class="doc-header">
    <div class="header-logo">
      <img src="${logoBase64}" alt="PZONE Logo">
    </div>
    <div class="header-meta">
      <div><strong>INTELLIGENT TENDERING SYSTEM</strong> | PZ-ERP-PLN-2026-V1.2</div>
      <div>Application: <span class="table-mono">pzone-tendering-system.vercel.app</span></div>
      <div>Deployment Date: <strong>September 2026</strong> | Classification: <strong>Confidential Internal Plan</strong></div>
    </div>
  </div>

  <!-- Title Hero Banner -->
  <div class="title-hero">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <div style="margin-bottom: 2px;">
          <span class="badge badge-primary">Standard Operating Procedure</span>
          <span class="badge badge-success">System Rollout</span>
          <span class="badge badge-slate">v1.2 Production</span>
        </div>
        <h1>Enterprise Implementation &amp; Execution Plan</h1>
        <div class="subtitle">Operational Master Plan for Civil &amp; MEP Tendering Divisions — Parametric Estimation Calibration</div>
      </div>
      <div style="text-align: right; background: rgba(0,0,0,0.25); padding: 5px 9px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.15);">
        <div style="font-size: 6.2pt; color: #94a3b8; text-transform: uppercase;">Lead ERP Operator</div>
        <div style="font-size: 8.2pt; font-weight: 700; color: #ffffff;">Eng. Amr Faisal</div>
        <div style="font-size: 6.2pt; color: #38bdf8;">Lead System Architect</div>
      </div>
    </div>

    <div class="title-grid">
      <div class="title-grid-item">
        <span>Target Division</span>
        <strong>Civil &amp; MEP Tendering</strong>
      </div>
      <div class="title-grid-item">
        <span>Pilot Scope</span>
        <strong>Pools (Skimmer, Overflow, Skimfilter) &amp; Lagoons</strong>
      </div>
      <div class="title-grid-item">
        <span>Primary Objective</span>
        <strong>Standardize BOQ &amp; Dry Cost Accuracy</strong>
      </div>
      <div class="title-grid-item">
        <span>Admin Availability</span>
        <strong style="color:#4ade80;">24/7 Priority Support</strong>
      </div>
    </div>
  </div>

  <!-- 24/7 ADMIN SLA GUARANTEE CARD -->
  <div class="admin-hotline-card">
    <div class="admin-hotline-left">
      <div class="admin-hotline-icon">&#9742;</div>
      <div class="admin-hotline-text">
        <h3>24/7 Real-Time Operator Support &amp; Hotline Guarantee</h3>
        <p>As the ERP Lead Operator, <strong>Eng. Amr Faisal</strong> is online and directly reachable 24 hours via WhatsApp &amp; Direct Phone Calls to immediately solve calculation discrepancies, missing database items, formula adjustments, and UI calibrations in real time with continuous zero-downtime hotfixes.</p>
      </div>
    </div>
    <div class="admin-hotline-badges">
      <span class="badge badge-hotline">&#9679; 24/7 ACTIVE</span>
      <div style="font-size: 6.8pt; font-weight: 700; margin-top: 2px; color: #065f46;">Direct WhatsApp &amp; Phone Access</div>
    </div>
  </div>

  <!-- Executive Summary & Strategic Rationale -->
  <div class="section">
    <div class="section-title">
      <span class="step-pill">01</span>
      Executive Summary &amp; Strategic Purpose
    </div>
    <div class="grid-2">
      <div class="card card-highlight">
        <div class="card-header">
          <span class="card-title">Transition to Parametric Tendering</span>
          <span class="badge badge-primary">Core Objective</span>
        </div>
        <p class="card-p">The PZONE Intelligent Tendering System transitions the engineering estimation department from manual, error-prone spreadsheets to a synchronized, single-source-of-truth cloud platform. It guarantees absolute mathematical precision across concrete structural volumes, rebar steel density, waterproofing membranes, finish claddings, hydraulic turnovers, pumping stations, and electrical control panels.</p>
        <p class="card-p">This Implementation Plan outlines the exact operational sequence required from both <strong>Civil Tendering Engineers</strong> (Phase 1) and <strong>Electromechanical Engineers</strong> (Phase 2), backed by 24/7 technical operator administration.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Key Architectural Modules</span>
          <span class="badge badge-slate">Cloud Architecture</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; margin-top:2px;">
          <div style="display:flex; justify-content:space-between; font-size:7.2pt; border-bottom:1px solid #e2e8f0; padding-bottom:2px;">
            <strong>1. Tender Log &amp; Client Registry</strong>
            <span class="table-mono text-cyan">/tender-log</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:7.2pt; border-bottom:1px solid #e2e8f0; padding-bottom:2px;">
            <strong>2. Proposal Data Entry (PDE - Dimensions)</strong>
            <span class="table-mono text-cyan">/proposal-data-entry</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:7.2pt; border-bottom:1px solid #e2e8f0; padding-bottom:2px;">
            <strong>3. Civil Proposal (Structurals &amp; Finishes)</strong>
            <span class="table-mono text-cyan">/civil-proposal</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:7.2pt; border-bottom:1px solid #e2e8f0; padding-bottom:2px;">
            <strong>4. Electromechanical (MEP) Sizing</strong>
            <span class="table-mono text-cyan">/electromechanical</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:7.2pt;">
            <strong>5. Cost Aggregation &amp; Overheads BOQ</strong>
            <span class="table-mono text-cyan">/boq-summary</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Phased Master Implementation Framework -->
  <div class="section">
    <div class="section-title">
      <span class="step-pill">02</span>
      Phased Master Implementation Framework
    </div>
    <div class="grid-3">
      <!-- Phase 1 Box -->
      <div class="card" style="border-top: 3px solid #0284c7;">
        <div class="card-header">
          <span class="card-title" style="color:#0284c7;">PHASE 1: Civil Engineering</span>
          <span class="badge badge-primary">Immediate Start</span>
        </div>
        <p class="card-p"><strong>Owner:</strong> Civil Tendering Engineers</p>
        <p class="card-p"><strong>Key Mandates:</strong></p>
        <ul style="font-size:7pt; color:#475569; padding-left:12px; margin-bottom:3px; line-height:1.3;">
          <li>Ingest client tender details into Tender Log (Title, Code, Owner).</li>
          <li>Determine component count: Water Features &amp; Pump Rooms.</li>
          <li>Enter geometric PDE parameters (Length, Width, Depths, Freeboard).</li>
          <li>Conduct material selection for Concrete, Steel, and Finishes.</li>
          <li>Revise quantities, item breakdown lines, and Total Civil Dry Cost.</li>
          <li>Benchmark across Skimmer, Overflow, Skimfilter &amp; Lagoon types.</li>
        </ul>
      </div>

      <!-- Phase 2 Box -->
      <div class="card" style="border-top: 3px solid #0d9488;">
        <div class="card-header">
          <span class="card-title" style="color:#0d9488;">PHASE 2: MEP Engineering</span>
          <span class="badge badge-success">Sequential Follow-up</span>
        </div>
        <p class="card-p"><strong>Owner:</strong> Mechanical &amp; Electrical Engineers</p>
        <p class="card-p"><strong>Key Mandates:</strong></p>
        <ul style="font-size:7pt; color:#475569; padding-left:12px; margin-bottom:3px; line-height:1.3;">
          <li>Ingest calculated water volume &amp; perimeter from Phase 1.</li>
          <li>Compute hydraulic flow rates based on required turnover hours.</li>
          <li>Size filtration sand filters, circulation pumps, and backwash valves.</li>
          <li>Configure chemical treatment, heating, underwater LED, and MCP.</li>
          <li>Audit all equipment line items, specifications, and unit rates.</li>
          <li>Finalize Total Electromechanical Dry Cost.</li>
        </ul>
      </div>

      <!-- Phase 3 / Governance Box -->
      <div class="card" style="border-top: 3px solid #059669;">
        <div class="card-header">
          <span class="card-title" style="color:#059669;">24/7 SUPPORT &amp; SLA</span>
          <span class="badge badge-hotline">Continuous</span>
        </div>
        <p class="card-p"><strong>Owner:</strong> ERP Operator (Eng. Amr Faisal)</p>
        <p class="card-p"><strong>Support Commitments:</strong></p>
        <ul style="font-size:7pt; color:#475569; padding-left:12px; margin-bottom:3px; line-height:1.3;">
          <li>24/7 Continuous live availability via WhatsApp &amp; Voice calls.</li>
          <li>Instant resolution of system errors, calculation doubts, and UI glitches.</li>
          <li>Dynamic calibration of unit costs, labor rates, and database items.</li>
          <li>Immediate push of code updates to live Vercel cloud environment.</li>
          <li>Review of submitted commercial markups and final tender proposals.</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Document Footer -->
  <div class="doc-footer">
    <div>PZONE Intelligent Tendering System | Enterprise Rollout Protocol</div>
    <div>Document Ref: <strong>PZ-ERP-PLN-2026-V1.2</strong></div>
    <div>Page <strong>1</strong> of <strong>4</strong></div>
  </div>
</div>


<!-- ================================================= PAGE 2 ================================================= -->
<div class="page-container page-break">
  <!-- Document Header -->
  <div class="doc-header">
    <div class="header-logo">
      <img src="${logoBase64}" alt="PZONE Logo">
    </div>
    <div class="header-meta">
      <div><strong>PHASE 1 DEEP-DIVE: CIVIL TENDERING PROTOCOL</strong></div>
      <div>Application: <span class="table-mono">pzone-tendering-system.vercel.app</span></div>
      <div>Operational Workflow &amp; Typology Calibration Matrix</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      <span class="step-pill">Phase 1</span>
      Civil Tendering Engineering Workflow (Step-by-Step)
    </div>

    <!-- 2x2 Step Grid for compactness -->
    <div class="grid-2">
      <!-- Step 1.1 -->
      <div class="step-card">
        <div class="step-header">
          <span class="step-title">1. Tender Log &amp; Scope Counts</span>
          <span class="badge badge-primary">Step 1.1</span>
        </div>
        <div class="step-desc">
          Receive client RFP. In <span class="table-mono">/tender-log</span>, create proposal record with <strong>Proposal Title</strong>, <strong>Unique Proposal Code</strong> (e.g. <span class="table-mono">SP.2026.025</span>), Client, Owner, Region, and Submission date. Crucially define asset counts: <strong>No. of Water Features</strong> and <strong>No. of Pump Rooms</strong>.
        </div>
        <div class="flow-tags">
          <span class="tag tag-cyan">Proposal Title</span>
          <span class="tag tag-cyan">Proposal Code</span>
          <span class="tag tag-cyan">No. of Water Features</span>
          <span class="tag tag-cyan">No. of Pump Rooms</span>
        </div>
      </div>

      <!-- Step 1.2 -->
      <div class="step-card">
        <div class="step-header">
          <span class="step-title">2. Proposal Data Entry (PDE)</span>
          <span class="badge badge-primary">Step 1.2</span>
        </div>
        <div class="step-desc">
          In <span class="table-mono">/proposal-data-entry</span>, input geometry: <strong>Length</strong>, <strong>Width</strong>, <strong>Shallow Depth</strong>, <strong>Deep Depth</strong>, and Freeboard. Enter Pump Room dimensions (L, W, H) plus <strong>Balance Tank &amp; Sump Pit</strong> sizing. Auto-computes surface area ($m^2$), perimeter ($m$), and volume ($m^3$).
        </div>
        <div class="flow-tags">
          <span class="tag tag-cyan">L &times; W Dimensions</span>
          <span class="tag tag-cyan">Shallow &amp; Deep H</span>
          <span class="tag tag-cyan">Pump Room &amp; Tank</span>
          <span class="tag tag-emerald">Area &amp; Volume</span>
        </div>
      </div>

      <!-- Step 1.3 -->
      <div class="step-card">
        <div class="step-header">
          <span class="step-title">3. Structurals &amp; Formwork</span>
          <span class="badge badge-primary">Step 1.3</span>
        </div>
        <div class="step-desc">
          Parametric structural rules calculate takeoffs: Bulk Excavation (+1m working offset), Plain Concrete (P.C. 10cm blinding), Reinforced Concrete (R.C. raft slab, retaining walls, pump room), Steel Rebar B500D ($kg/m^3$ density ratio), Formwork, and PVC Waterstops at construction cold joints.
        </div>
        <div class="flow-tags">
          <span class="tag tag-cyan">P.C. Blinding</span>
          <span class="tag tag-cyan">R.C. Raft &amp; Walls</span>
          <span class="tag tag-cyan">Steel Density</span>
          <span class="tag tag-emerald">Structural BOQ</span>
        </div>
      </div>

      <!-- Step 1.4 -->
      <div class="step-card">
        <div class="step-header">
          <span class="step-title">4. Finishes &amp; Materials</span>
          <span class="badge badge-primary">Step 1.4</span>
        </div>
        <div class="step-desc">
          Select materials from live catalogs: Dual-component elastic cementitious waterproofing membrane with fiberglass mesh, Floor screed with drainage slopes, Vitreous Glass Mosaic vs. Anti-slip Ceramic Tiles, Coping stone (Granite / Marble / Basalt), and Overflow PVC drainage grating.
        </div>
        <div class="flow-tags">
          <span class="tag tag-cyan">Waterproofing Membrane</span>
          <span class="tag tag-cyan">Mosaic / Ceramic</span>
          <span class="tag tag-cyan">Coping Stone</span>
          <span class="tag tag-emerald">Catalog Selection</span>
        </div>
      </div>
    </div>

    <!-- Step 1.5 Horizontal Bar -->
    <div class="step-card" style="border-left-color: #0d9488; background-color: #f0fdfa; margin-top: -2px;">
      <div class="step-header">
        <span class="step-title" style="color: #0f766e;">5. Quantity Verification, Breakdown Items &amp; Total Civil Dry Cost Audit</span>
        <span class="badge badge-success">Step 1.5 Final</span>
      </div>
      <div class="step-desc">
        Review every generated breakdown line item: labor man-hours, equipment plant, material consumption, and subcontractor allowances. Verify unit rates match prevailing market conditions. Audit and certify the final <strong>Total Civil Dry Cost</strong> before handing off to the MEP team.
      </div>
    </div>
  </div>

  <!-- Cross-Typology Testing & Calibration Matrix Table -->
  <div class="section no-break">
    <div class="section-title">
      <span class="step-pill">Test Matrix</span>
      Water Feature Typology Benchmarking Plan
    </div>
    <p class="card-p" style="margin-bottom:3px;">Civil Tendering Engineers must stress-test and calibrate the system across the following core typologies:</p>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 17%;">Feature Typology</th>
          <th style="width: 25%;">Key Structural &amp; Civil Characteristics</th>
          <th style="width: 28%;">Material Selection &amp; Finishes Focus</th>
          <th style="width: 30%;">Critical Validation Checkpoint</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. Skimmer Pool</strong></td>
          <td>Standard R.C. basin; no surge balance tank required; dedicated pump room adjacent.</td>
          <td>Vitreous mosaic, cementitious waterproofing, bullnose granite coping, skimmer throats.</td>
          <td>Verify wall thickness (25-30cm), raft slab thickness, and skimmer count formula.</td>
        </tr>
        <tr>
          <td><strong>2. Overflow Pool</strong></td>
          <td>Perimeter overflow gutter channel, surge balance tank (10-15% of pool volume).</td>
          <td>Overflow PVC grating, gutter waterproofing, non-slip tile nosing, mosaic lining.</td>
          <td>Ensure balance tank concrete &amp; waterproofing quantities add to the main pool total.</td>
        </tr>
        <tr>
          <td><strong>3. Skimfilter Pool</strong></td>
          <td>Compact design with integrated skimfilters built into pool coping; minimal pump room.</td>
          <td>Pre-formed skimfilter niches, high-grade coping stone, seamless mosaic tilework.</td>
          <td>Verify zero balance tank and reduced pump room footprint civil cost calculation.</td>
        </tr>
        <tr>
          <td><strong>4. Olympic / Semi-Olympic</strong></td>
          <td>50m / 25m lane lengths, deep water profile (2.0-3.0m), high hydrostatic loading.</td>
          <td>FINA-compliant anti-slip racing ceramic tiles, lane markings, stainless anchor plates.</td>
          <td>Audit massive concrete volumes, heavy rebar ratio (140-160 kg/m&sup3;), and joint detailing.</td>
        </tr>
        <tr>
          <td><strong>5. Concrete Base Lagoon</strong></td>
          <td>Extensive surface area (&gt;500 m&sup2;), sloped beach entries, reinforced floor slab.</td>
          <td>Specialized elastic waterproofing, crystalline silica quartz finish, stone rip-rap borders.</td>
          <td>Validate large-scale excavation takeoffs, expansion joint spacing, and slope screeding.</td>
        </tr>
        <tr>
          <td><strong>6. Sand Base Lagoon</strong></td>
          <td>Natural sand beach transitions, geomembrane HDPE/EPDM liner, perimeter anchor trench.</td>
          <td>Geotextile protective fleece, 1.5mm HDPE liner, washed white silica sand, anchor beams.</td>
          <td>Verify liner surface area vs. concrete base cost comparison in the breakdown items.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Document Footer -->
  <div class="doc-footer">
    <div>PZONE Intelligent Tendering System | Phase 1 Civil Execution Protocol</div>
    <div>Document Ref: <strong>PZ-ERP-PLN-2026-V1.2</strong></div>
    <div>Page <strong>2</strong> of <strong>4</strong></div>
  </div>
</div>


<!-- ================================================= PAGE 3 ================================================= -->
<div class="page-container page-break">
  <!-- Document Header -->
  <div class="doc-header">
    <div class="header-logo">
      <img src="${logoBase64}" alt="PZONE Logo">
    </div>
    <div class="header-meta">
      <div><strong>PHASE 2 DEEP-DIVE: ELECTROMECHANICAL (MEP) PROTOCOL</strong></div>
      <div>Application: <span class="table-mono">pzone-tendering-system.vercel.app</span></div>
      <div>Hydraulics, Filtration, Electrical &amp; Equipment Breakdown Audit</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      <span class="step-pill">Phase 2</span>
      Mechanical &amp; Electrical (MEP) Tendering Workflow
    </div>

    <div class="grid-2">
      <!-- Hydraulic Sizing -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">1. Automated Hydraulic Calculations</span>
          <span class="badge badge-success">Turnover Sizing</span>
        </div>
        <p class="card-p">The MEP module ingests water volume ($V$) and perimeter ($P$) from Phase 1 PDE. The engineer defines target turnover hours ($T$):</p>
        <div class="formula-card">
          Flow Rate: <strong>Q (m&sup3;/h) = Water Volume (V) &divide; Turnover Hours (T)</strong><br>
          Code Turnovers: Public Pool = <strong>4h</strong> | Residential = <strong>6h</strong> | Lagoon = <strong>8-12h</strong>
        </div>
        <p class="card-p">The system calculates design flow rate ($m^3/h$) and total dynamic head (TDH) factoring pipe friction, static lift, and filter media resistance.</p>
      </div>

      <!-- Filtration Plant -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">2. Commercial Filtration Plant</span>
          <span class="badge badge-success">Filters &amp; Media</span>
        </div>
        <p class="card-p">Based on total flow ($Q$), the system sizes sand filters maintaining standard filtration velocity ($v \le 30-50\,m^3/h/m^2$):</p>
        <ul style="font-size:7pt; color:#475569; padding-left:12px; line-height:1.28;">
          <li>Select filter diameter: 650mm, 800mm, 900mm, 1200mm, or multi-tank array.</li>
          <li>Choose filter media: High-grade Quartz Silica Sand vs. Activated AFM Glass Media.</li>
          <li>Configure multiport valves (6-way) or butterfly face-piping manifold.</li>
        </ul>
      </div>

      <!-- Circulation Pumping -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">3. Circulation Pumping Station</span>
          <span class="badge badge-success">Pump Redundancy</span>
        </div>
        <p class="card-p">Pumps are sized to meet total system flow $Q$ against calculated head loss (12-18m TDH):</p>
        <ul style="font-size:7pt; color:#475569; padding-left:12px; line-height:1.28;">
          <li>Select pump configuration: Single duty, 1 Duty + 1 Standby, or multi-pump parallel array.</li>
          <li>Specify brand preference (e.g. AstralPool, Hayward, Kripsol, Pentair).</li>
          <li>Verify pre-filter strainer baskets, self-priming suction, and impeller materials.</li>
        </ul>
      </div>

      <!-- Chemical Dosing & Heating -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">4. Disinfection &amp; Thermal Heating</span>
          <span class="badge badge-success">Water Quality</span>
        </div>
        <p class="card-p">MEP Engineers calibrate automated disinfection and climate control:</p>
        <ul style="font-size:7pt; color:#475569; padding-left:12px; line-height:1.28;">
          <li>Automated chlorine &amp; pH dosing pumps with electronic amperometric controllers.</li>
          <li>Electrolytic salt chlorinators &amp; secondary UV / Ozone sterilization.</li>
          <li>Air-to-water inverter heat pumps sized to pool surface heat loss (kW rating).</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Electrical Infrastructure & Lighting -->
  <div class="section">
    <div class="section-title">
      <span class="step-pill">Electrical</span>
      Subaquatic Lighting, Power &amp; Main Control Panel (MCP)
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Underwater LED Lighting</span>
          <span class="badge badge-primary">Safety SELV</span>
        </div>
        <p class="card-p">Illumination calculated based on surface area ratio ($12-25\,W/m^2$):</p>
        <ul style="font-size:7pt; color:#475569; padding-left:11px; line-height:1.28;">
          <li>IP68 underwater LED luminaires (Warm White 3000K or RGBW).</li>
          <li>Step-down safety isolating transformers (220V AC &rarr; 12V AC SELV).</li>
          <li>Silicone-sealed IP68 deck junction boxes and flexible conduits.</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Main Control Panel (MCP)</span>
          <span class="badge badge-primary">Automation</span>
        </div>
        <p class="card-p">Custom IP65 weatherproof control enclosure in pump room:</p>
        <ul style="font-size:7pt; color:#475569; padding-left:11px; line-height:1.28;">
          <li>Motor Protection Circuit Breakers (MPCB) &amp; contactors for all pumps.</li>
          <li>VFD variable frequency drives for flow optimization and energy savings.</li>
          <li>Digital daily timers, phase failure relay, and dry-run float switches.</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Piping Network &amp; Earthing</span>
          <span class="badge badge-primary">Hydraulic BOQ</span>
        </div>
        <p class="card-p">Pipework, valves and safety grounding network:</p>
        <ul style="font-size:7pt; color:#475569; padding-left:11px; line-height:1.28;">
          <li>UPVC Class 10 / Class 16 pressure pipes, fittings, and solvent welds.</li>
          <li>Wafer butterfly valves and PVC double-union ball valves.</li>
          <li>Equipotential bonding copper mesh grounding all structural rebar and metals.</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- MEP Breakdown & Verification Table -->
  <div class="section no-break">
    <div class="section-title">
      <span class="step-pill">Audit</span>
      MEP Breakdown Items &amp; Quantity Review Checklist
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 19%;">Sub-System</th>
          <th style="width: 31%;">Breakdown Item Lines to Inspect</th>
          <th style="width: 25%;">Unit Rate &amp; Specification Audit</th>
          <th style="width: 25%;">Dry Cost Verification Rule</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Filtration Station</strong></td>
          <td>Sand filters, filter media (sand/glass), multiport valve, face piping, pressure gauges.</td>
          <td>Check filter diameter, working pressure rating, and brand origin (Europe / Local).</td>
          <td>Ensure filter capacity matches or exceeds calculated turnover flow rate ($Q$).</td>
        </tr>
        <tr>
          <td><strong>Pumping Station</strong></td>
          <td>Circulation pumps, pre-filters, isolation valves, non-return check valves, anti-vibration pads.</td>
          <td>Verify pump HP rating, head curve (m), flow ($m^3/h$), and 3-phase vs 1-phase power.</td>
          <td>Audit standby pump addition; ensure pipe manifold handles combined flow safely.</td>
        </tr>
        <tr>
          <td><strong>Disinfection &amp; Dosing</strong></td>
          <td>Chemical dosing pumps, inline pH/ORP probes, dosing tank barrels, injection valves.</td>
          <td>Confirm automated vs manual dosing unit cost; verify probe calibration reagents.</td>
          <td>Check electrical circuit allocation on the Main Control Panel for dosers.</td>
        </tr>
        <tr>
          <td><strong>Underwater Lighting</strong></td>
          <td>LED fixtures, ABS/bronze niches, 12V safety transformers, deck junction boxes, cabling.</td>
          <td>Inspect lumen output, color temperature (3000K vs RGB), and transformer wattage buffer (+25%).</td>
          <td>Confirm cable length between pool niche and pump room step-down transformer.</td>
        </tr>
        <tr>
          <td><strong>Main Control Panel (MCP)</strong></td>
          <td>IP65 panel enclosure, circuit breakers, contactors, timers, VFDs, indicator pilot lights.</td>
          <td>Audit total connected electrical load (kW), fault current rating, and surge protection.</td>
          <td>Verify all pump motors, lights, and chemical systems are individually switched.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Document Footer -->
  <div class="doc-footer">
    <div>PZONE Intelligent Tendering System | Phase 2 MEP Execution Protocol</div>
    <div>Document Ref: <strong>PZ-ERP-PLN-2026-V1.2</strong></div>
    <div>Page <strong>3</strong> of <strong>4</strong></div>
  </div>
</div>


<!-- ================================================= PAGE 4 ================================================= -->
<div class="page-container">
  <!-- Document Header -->
  <div class="doc-header">
    <div class="header-logo">
      <img src="${logoBase64}" alt="PZONE Logo">
    </div>
    <div class="header-meta">
      <div><strong>OPERATIONAL GOVERNANCE &amp; 24/7 SUPPORT SLA</strong></div>
      <div>Application: <span class="table-mono">pzone-tendering-system.vercel.app</span></div>
      <div>Rollout Timeline, Commercial Markups &amp; Formal Approvals</div>
    </div>
  </div>

  <!-- Section 4.1: 24/7 SLA & Incident Management -->
  <div class="section">
    <div class="section-title">
      <span class="step-pill">Hotline SLA</span>
      Operator 24/7 Priority Support &amp; Incident Resolution Protocol
    </div>
    <div class="grid-2">
      <div class="card card-highlight">
        <div class="card-header">
          <span class="card-title" style="color:#0284c7;">Direct Operator Contact Channels</span>
          <span class="badge badge-hotline">&#9679; 24 HOURS ACTIVE</span>
        </div>
        <p class="card-p"><strong>Administrator / ERP Operator:</strong> Eng. Amr Faisal</p>
        <p class="card-p"><strong>Communication Channels:</strong> Dedicated WhatsApp Support Channel &amp; Direct Phone Calls.</p>
        <p class="card-p"><strong>Operational Scope:</strong> Engineers who experience any hesitation, unexpected output, database lookup question, or calculation anomaly can reach out immediately. The operator provides screen-share assistance, immediate database record updates, and rapid code fixes.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Incident Escalation &amp; Resolution Tiers</span>
          <span class="badge badge-slate">SLA Matrix</span>
        </div>
        <div style="font-size:7.1pt; display:flex; flex-direction:column; gap:3px;">
          <div><strong style="color:#0284c7;">Tier 1: Minor Bugs &amp; Label Lookups (Under 15 Mins)</strong><br><span style="color:#64748b;">Missing UUID labels, typo corrections, dropdown options &rarr; Immediate live hotfix.</span></div>
          <div><strong style="color:#0d9488;">Tier 2: Formula Adjustments &amp; Material Catalogs (Under 2 Hours)</strong><br><span style="color:#64748b;">Custom concrete mix ratios, new pump brands, specialized mosaic rates &rarr; DB update.</span></div>
          <div><strong style="color:#d97706;">Tier 3: Complex Typologies &amp; New Structural Modules (Same Day)</strong><br><span style="color:#64748b;">Lagoon perimeter anchors, deep retaining wall equations &rarr; Code release to Vercel.</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Section 4.2: Commercial Markups & Financial Rollup -->
  <div class="section">
    <div class="section-title">
      <span class="step-pill">Commercial</span>
      Dry Cost Aggregation, Overheads &amp; Final Bid Markup Structure
    </div>
    <p class="card-p" style="margin-bottom:3px;">Once Civil and MEP Dry Costs are certified, the system applies PZONE's calibrated commercial overhead and profit percentages:</p>

    <div class="grid-4">
      <div class="card" style="text-align:center;">
        <span class="badge badge-primary">Direct Dry Costs</span>
        <div style="font-size:8.2pt; font-weight:800; color:#0f172a; margin:3px 0 1px 0;">Base Costs</div>
        <div style="font-size:6.7pt; color:#64748b;">Civil Dry Cost +<br>MEP Dry Cost + Subcontracts</div>
      </div>
      <div class="card" style="text-align:center;">
        <span class="badge badge-slate">Site Overheads</span>
        <div style="font-size:8.2pt; font-weight:800; color:#0f172a; margin:3px 0 1px 0;">Mobilization &amp; Site</div>
        <div style="font-size:6.7pt; color:#64748b;">Staff salaries, logistics, power/water, safety</div>
      </div>
      <div class="card" style="text-align:center;">
        <span class="badge badge-amber">Reserves &amp; Risk</span>
        <div style="font-size:8.2pt; font-weight:800; color:#0f172a; margin:3px 0 1px 0;">Risk Provisions</div>
        <div style="font-size:6.7pt; color:#64748b;">Contingency, management, 1-yr guarantee</div>
      </div>
      <div class="card" style="text-align:center;">
        <span class="badge badge-success">Profit Margins</span>
        <div style="font-size:8.2pt; font-weight:800; color:#0f172a; margin:3px 0 1px 0;">Gross Profit %</div>
        <div style="font-size:6.7pt; color:#64748b;">Civil Gross Profit % &amp;<br>MEP Gross Profit % + Taxes</div>
      </div>
    </div>
  </div>

  <!-- Section 4.3: 4-Week Implementation Timeline -->
  <div class="section">
    <div class="section-title">
      <span class="step-pill">Roadmap</span>
      4-Week Implementation &amp; Testing Rollout Timeline
    </div>

    <div class="timeline-bar">
      <div class="timeline-col active">
        <div class="timeline-title" style="color:#0d9488;">Week 1: Civil Kickoff</div>
        <div class="timeline-desc">
          &bull; Tender Log setup &amp; Code entry.<br>
          &bull; Proposal Data Entry (PDE) training.<br>
          &bull; Sizing Skimmer &amp; Overflow pools.<br>
          &bull; Admin 24/7 live assistance active.
        </div>
      </div>
      <div class="timeline-col active">
        <div class="timeline-title" style="color:#0d9488;">Week 2: Civil Deep Testing</div>
        <div class="timeline-desc">
          &bull; Concrete &amp; steel ratio verification.<br>
          &bull; Finishes &amp; coping stone catalogs.<br>
          &bull; Lagoons (Concrete &amp; Sand base).<br>
          &bull; Civil Dry Cost audit &amp; sign-off.
        </div>
      </div>
      <div class="timeline-col">
        <div class="timeline-title" style="color:#0284c7;">Week 3: MEP Onboarding</div>
        <div class="timeline-desc">
          &bull; Hydraulic turnover flow calculations.<br>
          &bull; Pump &amp; filter plant selection.<br>
          &bull; Underwater LED &amp; MCP panel sizing.<br>
          &bull; Equipment breakdown verification.
        </div>
      </div>
      <div class="timeline-col">
        <div class="timeline-title" style="color:#0284c7;">Week 4: Full Go-Live</div>
        <div class="timeline-desc">
          &bull; End-to-end multi-disciplinary dry-run.<br>
          &bull; Commercial markup &amp; BOQ export.<br>
          &bull; Real-world tender submission test.<br>
          &bull; Official enterprise deployment.
        </div>
      </div>
    </div>
  </div>

  <!-- Section 4.4: Stakeholder Sign-Off Matrix -->
  <div class="section no-break" style="margin-top:8px;">
    <div class="section-title">
      <span class="step-pill">Sign-off</span>
      Governance &amp; Authorization Matrix
    </div>

    <div class="sign-grid">
      <div class="sign-box">
        <div class="role">Civil Tendering Lead</div>
        <div class="name">Lead Civil Engineer</div>
        <div class="date">Signature &amp; Stamp / Date</div>
      </div>
      <div class="sign-box">
        <div class="role">MEP Tendering Lead</div>
        <div class="name">Lead MEP Engineer</div>
        <div class="date">Signature &amp; Stamp / Date</div>
      </div>
      <div class="sign-box">
        <div class="role">ERP Lead Operator</div>
        <div class="name">Eng. Amr Faisal</div>
        <div class="date">Operational Authorization</div>
      </div>
      <div class="sign-box">
        <div class="role">Tendering Director</div>
        <div class="name">Head of Tendering Dept.</div>
        <div class="date">Final Executive Approval</div>
      </div>
    </div>
  </div>

  <!-- Document Footer -->
  <div class="doc-footer">
    <div>PZONE Intelligent Tendering System | Enterprise Rollout Protocol</div>
    <div>Document Ref: <strong>PZ-ERP-PLN-2026-V1.2</strong></div>
    <div>Page <strong>4</strong> of <strong>4</strong></div>
  </div>
</div>

</body>
</html>
`;

// 3. Write HTML file
const outputPathHtml = path.resolve(__dirname, '../PZONE_Tendering_System_Implementation_Plan.html');
fs.writeFileSync(outputPathHtml, htmlContent, 'utf8');
console.log('HTML generated successfully at:', outputPathHtml);

// 4. Compile PDF using Microsoft Edge headless
const outputPathPdf = path.resolve(__dirname, '../PZONE_Tendering_System_Implementation_Plan.pdf');
const edgePath = 'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe';

console.log('Generating PDF via Microsoft Edge Chromium Engine...');
try {
  const cmd = `"${edgePath}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${outputPathPdf}" --no-pdf-header-footer "${outputPathHtml}"`;
  execSync(cmd, { stdio: 'inherit' });
  
  if (fs.existsSync(outputPathPdf)) {
    const stats = fs.statSync(outputPathPdf);
    console.log(`SUCCESS: PDF created successfully at ${outputPathPdf} (${stats.size} bytes)`);
  } else {
    console.error('ERROR: PDF file was not created.');
  }
} catch (err) {
  console.error('Failed to generate PDF:', err);
}

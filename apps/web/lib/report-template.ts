export const REPORT_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ClaimClear Audit Report</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #ffffff;
      color: #1e293b;
      padding: 40px;
      font-size: 12px;
      line-height: 1.5;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .brand h1 {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .brand p {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      font-weight: 500;
    }
    .report-meta {
      text-align: right;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      color: #475569;
    }
    .report-meta strong {
      color: #0f172a;
    }

    /* Overview Grid */
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      margin-bottom: 8px;
    }
    .grid-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px 18px;
      margin-bottom: 22px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      row-gap: 12px;
      column-gap: 20px;
    }
    .meta-item span {
      display: block;
      font-size: 9px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .meta-item strong {
      font-size: 13px;
      color: #0f172a;
    }

    /* Readiness Banner */
    .readiness-banner {
      display: flex;
      align-items: center;
      gap: 22px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 5px solid #eab308;
      background: #fefce8;
      padding: 16px 20px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    .score-circle {
      position: relative;
      width: 70px;
      height: 70px;
      flex-shrink: 0;
    }
    .score-circle svg {
      transform: rotate(-90deg);
      width: 70px;
      height: 70px;
    }
    .score-circle-track {
      fill: none;
      stroke: #fef08a;
      stroke-width: 6;
    }
    .score-circle-fill {
      fill: none;
      stroke: #ca8a04;
      stroke-width: 6;
      stroke-linecap: round;
      stroke-dasharray: 188.5;
      stroke-dashoffset: 71.6; /* 62% filled */
    }
    .score-number {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 800;
      color: #854d0e;
      line-height: 1;
    }
    .score-copy h2 {
      font-size: 15px;
      font-weight: 700;
      color: #854d0e;
      margin-bottom: 3px;
    }
    .score-copy p {
      color: #713f12;
      font-size: 11px;
    }

    /* Codes Table */
    .table-container {
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.05em;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
    }
    td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    td.mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
      color: #0f172a;
    }

    /* Findings List */
    .findings-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .finding-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .finding-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .finding-rule {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      font-size: 9px;
      font-weight: 700;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-critical {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }
    .badge-warning {
      background: #fef3c7;
      color: #d97706;
      border: 1px solid #fde68a;
    }
    .badge-info {
      background: #e0f2fe;
      color: #0284c7;
      border: 1px solid #bae6fd;
    }
    .finding-issue {
      color: #475569;
      font-size: 11px;
      margin-bottom: 8px;
    }
    .finding-fix {
      background: #f8fafc;
      border-left: 3px solid #0f172a;
      padding: 6px 10px;
      font-size: 11px;
      color: #0f172a;
      font-weight: 500;
    }

    /* Footer */
    .footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header class="header">
    <div class="brand">
      <h1>ClaimClear</h1>
      <p>Pre-Submission Insurance Claim Audit Report</p>
    </div>
    <div class="report-meta">
      <div>REPORT ID: <strong>CLM-2026-883A</strong></div>
      <div>DATE: <strong>2026-09-08</strong></div>
    </div>
  </header>

  <!-- Patient & Claim Meta -->
  <p class="section-title">Claim Overview</p>
  <div class="grid-card">
    <div class="meta-grid">
      <div class="meta-item"><span>Patient Name</span><strong>John Doe</strong></div>
      <div class="meta-item"><span>Attending Provider</span><strong>Dr. Sarah Jenkins</strong></div>
      <div class="meta-item"><span>Date of Service</span><strong>2026-09-08</strong></div>

      <div class="meta-item"><span>Date of Birth</span><strong>1985-04-12</strong></div>
      <div class="meta-item"><span>Specialty</span><strong>Orthopedics</strong></div>
      <div class="meta-item"><span>Total Billed</span><strong>$4,500.00</strong></div>

      <div class="meta-item"><span>Policy Number</span><strong>POL-98273645</strong></div>
      <div class="meta-item"><span>Registration ID</span><strong>MED-44582</strong></div>
      <div class="meta-item"><span>Claim ID</span><strong>CLM-2026-883A</strong></div>
    </div>
  </div>

  <!-- Score Banner -->
  <div class="readiness-banner">
    <div class="score-circle">
      <svg viewBox="0 0 70 70">
        <circle class="score-circle-track" cx="35" cy="35" r="30"></circle>
        <circle class="score-circle-fill" cx="35" cy="35" r="30"></circle>
      </svg>
      <div class="score-number">62</div>
    </div>
    <div class="score-copy">
      <h2>Readiness Score: 62/100 (High Risk)</h2>
      <p>A score below 80 indicates elevated risk of rejection. Critical issues must be resolved before submission.</p>
    </div>
  </div>

  <!-- Medical Codes Extracted -->
  <p class="section-title">Medical Codes Extracted</p>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Type</th>
          <th style="width: 20%;">Code</th>
          <th>Description (Inferred)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Diagnosis (ICD-10)</td>
          <td class="mono">M23.2</td>
          <td>Derangement of meniscus due to old tear or injury</td>
        </tr>
        <tr>
          <td>Procedure (CPT)</td>
          <td class="mono">29881</td>
          <td>Arthroscopy, knee, surgical; with meniscectomy</td>
        </tr>
        <tr>
          <td>Procedure (CPT)</td>
          <td class="mono">99213</td>
          <td>Office or other outpatient visit</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Audit Findings -->
  <p class="section-title">Audit Findings &amp; Recommended Actions</p>
  <div class="findings-list">
    <div class="finding-card">
      <div class="finding-header">
        <span class="finding-rule">MISSING_PREAUTH</span>
        <span class="badge badge-critical">Critical</span>
      </div>
      <p class="finding-issue">Procedure 29881 typically requires pre-authorization for planned surgical interventions. No pre-authorization reference was found in the extracted documentation.</p>
      <div class="finding-fix"><strong>Fix:</strong> Attach pre-authorization reference number before submission.</div>
    </div>

    <div class="finding-card">
      <div class="finding-header">
        <span class="finding-rule">DIAGNOSIS_PROCEDURE_MISMATCH</span>
        <span class="badge badge-warning">Major</span>
      </div>
      <p class="finding-issue">Diagnosis code M23.2 (Meniscus tear) is logically consistent with procedure 29881, but the primary diagnosis field on the draft claim form was left blank.</p>
      <div class="finding-fix"><strong>Fix:</strong> Ensure primary diagnosis field matches clinical extraction (M23.2) on the draft claim.</div>
    </div>

    <div class="finding-card">
      <div class="finding-header">
        <span class="finding-rule">MISSING_SIGNATURE</span>
        <span class="badge badge-info">Minor</span>
      </div>
      <p class="finding-issue">Provider signature and certification field appears empty on the drafted claim form.</p>
      <div class="finding-fix"><strong>Fix:</strong> Ensure Dr. Sarah Jenkins signs the final claim form.</div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="footer">
    <span>ClaimClear Pre-Submission Audit System</span>
    <span>Private &amp; Confidential</span>
  </footer>

</body>
</html>
`;
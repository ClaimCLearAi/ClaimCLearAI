'use client'

import { ArrowDownToLine } from 'lucide-react'

const REPORT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ClaimClear - Audit Report</title>
<style>
  :root {
    --brand-primary: #1e3a8a;
    --brand-secondary: #0369a1;
    --text-main: #0f172a;
    --text-muted: #64748b;
    --bg-main: #f4f7f6;
    --bg-card: #ffffff;
    --critical: #dc2626;
    --major: #f59e0b;
    --minor: #3b82f6;
  }

  body { 
    font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; 
    margin: 0; 
    padding: 0; 
    background-color: var(--bg-main);
    color: var(--text-main); 
    line-height: 1.5;
  }
  
  * { box-sizing: border-box; }
  
  .report-container {
    max-width: 900px;
    margin: 40px auto;
    background: var(--bg-card);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-radius: 8px;
    overflow: hidden;
  }

  .header { 
    background-color: var(--brand-primary); 
    color: white; 
    padding: 30px; 
    text-align: center; 
  }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
  .header p { margin: 8px 0 0 0; font-size: 16px; opacity: 0.9; }
  
  .content-wrapper { padding: 30px; }
  .section { margin-bottom: 30px; border-top: 4px solid var(--brand-primary); padding-top: 15px; }
  .section-title { font-size: 20px; color: var(--brand-primary); margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
  
  .layout-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
  .data-group { margin-bottom: 15px; }
  .data-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
  .data-val { font-size: 16px; color: var(--text-main); margin-top: 4px; font-weight: 500; }
  
  .score-section { display: flex; flex-direction: column; align-items: center; background: #f8fafc; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .score-desc { font-size: 15px; color: var(--text-muted); margin-bottom: 20px; text-align: center; max-width: 500px; }
  .score-box { display: flex; align-items: center; justify-content: center; background: #e0f2fe; border-radius: 50%; width: 130px; height: 130px; font-size: 48px; font-weight: 700; color: var(--brand-secondary); border: 8px solid #0284c7; box-shadow: 0 4px 6px rgba(2, 132, 199, 0.2); }
  
  .finding { border-left: 5px solid var(--critical); padding: 20px; background: #fef2f2; margin-bottom: 20px; border-radius: 0 6px 6px 0; }
  .finding.major { border-left-color: var(--major); background: #fffbeb; }
  .finding.minor { border-left-color: var(--minor); background: #eff6ff; }
  
  .finding-header { display: flex; align-items: center; margin-bottom: 12px; }
  .finding-title { font-weight: 700; font-size: 16px; margin: 0; color: #111; }
  .finding-desc { font-size: 15px; margin: 0 0 15px 0; color: #334155; }
  .finding-fix { font-size: 14px; font-weight: 600; color: #065f46; margin: 0; background: #d1fae5; padding: 8px 12px; border-radius: 4px; display: inline-block; }
  
  .badge { display: inline-block; padding: 4px 10px; font-size: 12px; border-radius: 4px; color: white; margin-left: 12px; font-weight: 700; }
  .badge.critical { background: var(--critical); }
  .badge.major { background: var(--major); }
  .badge.minor { background: var(--minor); }
  
  .codes-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  .codes-table th, .codes-table td { border: 1px solid #e2e8f0; padding: 12px 15px; text-align: left; font-size: 15px; }
  .codes-table th { background-color: #f8fafc; font-weight: 600; color: #475569; }
  .codes-table tr:nth-child(even) { background-color: #f8fafc; }

  @media (max-width: 768px) {
      .report-container { margin: 0; border-radius: 0; }
      .layout-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="report-container">
  <div class="header">
    <h1>ClaimClear</h1>
    <p>Pre-Submission Insurance Claim Audit Report</p>
  </div>
  <div class="content-wrapper">
      <div class="section">
        <h2 class="section-title">Claim Overview</h2>
        <div class="layout-grid">
            <div>
              <div class="data-group"><div class="data-label">Patient Name</div><div class="data-val">John Doe</div></div>
              <div class="data-group"><div class="data-label">Date of Birth</div><div class="data-val">1985-04-12</div></div>
              <div class="data-group"><div class="data-label">Policy Number</div><div class="data-val">POL-98273645</div></div>
            </div>
            <div>
              <div class="data-group"><div class="data-label">Attending Provider</div><div class="data-val">Dr. Sarah Jenkins</div></div>
              <div class="data-group"><div class="data-label">Specialty</div><div class="data-val">Orthopedics</div></div>
              <div class="data-group"><div class="data-label">Registration ID</div><div class="data-val">MED-44582</div></div>
            </div>
            <div>
              <div class="data-group"><div class="data-label">Date of Service</div><div class="data-val">2026-09-08</div></div>
              <div class="data-group"><div class="data-label">Total Billed</div><div class="data-val">$4,500.00</div></div>
              <div class="data-group"><div class="data-label">Claim ID</div><div class="data-val">CLM-2026-883A</div></div>
            </div>
        </div>
      </div>
      <div class="section">
        <h2 class="section-title">Medical Codes Extracted</h2>
        <table class="codes-table">
          <thead><tr><th>Type</th><th>Code</th><th>Description (Inferred)</th></tr></thead>
          <tbody>
            <tr><td>Diagnosis (ICD-10)</td><td>M23.2</td><td>Derangement of meniscus due to old tear or injury</td></tr>
            <tr><td>Procedure (CPT)</td><td>29881</td><td>Arthroscopy, knee, surgical; with meniscectomy</td></tr>
            <tr><td>Procedure (CPT)</td><td>99213</td><td>Office or other outpatient visit</td></tr>
          </tbody>
        </table>
      </div>
      <div class="section">
        <h2 class="section-title">Readiness Score</h2>
        <div class="score-section">
            <p class="score-desc">A score below 80 indicates a high risk of rejection upon submission. Please review the findings below.</p>
            <div class="score-box">62</div>
        </div>
      </div>
      <div class="section" style="border-top: none; padding-top: 0;">
        <h2 class="section-title">Audit Findings & Fixes</h2>
        <div class="finding">
          <div class="finding-header"><div class="finding-title">MISSING_PREAUTH</div><span class="badge critical">CRITICAL</span></div>
          <p class="finding-desc">Procedure 29881 typically requires pre-authorization for planned surgical interventions. No pre-authorization reference was found in the extracted documentation.</p>
          <div class="finding-fix">Fix: Attach pre-authorization reference number before submission.</div>
        </div>
        <div class="finding major">
          <div class="finding-header"><div class="finding-title">DIAGNOSIS_PROCEDURE_MISMATCH</div><span class="badge major">MAJOR</span></div>
          <p class="finding-desc">Diagnosis code M23.2 (Meniscus tear) is logically consistent with procedure 29881, but the primary diagnosis field on the draft claim form was left blank.</p>
          <div class="finding-fix">Fix: Ensure primary diagnosis field matches clinical extraction (M23.2) on the draft claim.</div>
        </div>
        <div class="finding minor">
           <div class="finding-header"><div class="finding-title">MISSING_SIGNATURE</div><span class="badge minor">MINOR</span></div>
          <p class="finding-desc">Provider signature and certification field appears empty on the drafted claim form.</p>
          <div class="finding-fix">Fix: Ensure Dr. Sarah Jenkins signs the final claim form.</div>
        </div>
      </div>
  </div>
</div>
</body>
</html>`;

export function DownloadReportButton() {
  const handleDownload = () => {
    const blob = new Blob([REPORT_HTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ClaimClear_Audit_Report.html';
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button className="button button-small" onClick={handleDownload}>
      <ArrowDownToLine size={15} aria-hidden="true" /> Download report
    </button>
  );
}
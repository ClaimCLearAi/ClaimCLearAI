export type ReportFinding = {
  rule_id: string
  title: string
  category: string
  severity: string
  deduction: number
  regulatory_source: string
  detected_issue: string
  suggested_fix: string
}

export type ReportData = {
  readiness_score: number
  status: string
  total_violations: number
  findings: ReportFinding[]
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function badgeClass(severity: string): 'badge-critical' | 'badge-warning' | 'badge-info' {
  const s = severity.toUpperCase()
  if (s === 'CRITICAL' || s === 'MAJOR') return 'badge-critical'
  if (s === 'WARNING' || s === 'MODERATE') return 'badge-warning'
  return 'badge-info'
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ')
}

export function generateReportHtml(data: ReportData): string {
  const circumference = 2 * Math.PI * 30 // r=30, matches the SVG below
  const dashOffset = circumference - (data.readiness_score / 100) * circumference
  const today = new Date().toISOString().slice(0, 10)

  const findingsHtml = data.findings
    .map(
      (f) => `
    <div class="finding-card">
      <div class="finding-header">
        <span class="finding-rule">${escapeHtml(f.rule_id)}</span>
        <span class="badge ${badgeClass(f.severity)}">${escapeHtml(f.severity)}</span>
      </div>
      <p class="finding-issue">${escapeHtml(f.detected_issue)}</p>
      <div class="finding-fix"><strong>Fix:</strong> ${escapeHtml(f.suggested_fix)}</div>
    </div>`,
    )
    .join('\n')

  const findingsSection = data.findings.length
    ? findingsHtml
    : `<p style="color:#475569;font-size:11px;">No issues found — this claim looks ready to submit.</p>`

  return `
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

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .brand h1 { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .brand p { font-size: 11px; color: #64748b; margin-top: 2px; font-weight: 500; }
    .report-meta { text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #475569; }
    .report-meta strong { color: #0f172a; }

    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 8px; }

    .readiness-banner {
      display: flex;
      align-items: center;
      gap: 22px;
      border: 1px solid #bbf7d0;
      border-left: 5px solid #eab308;
      background: #fefce8;
      padding: 16px 20px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    .score-circle { position: relative; width: 70px; height: 70px; flex-shrink: 0; }
    .score-circle svg { transform: rotate(-90deg); width: 70px; height: 70px; }
    .score-circle-track { fill: none; stroke: #fef08a; stroke-width: 6; }
    .score-circle-fill { fill: none; stroke: #ca8a04; stroke-width: 6; stroke-linecap: round; }
    .score-number {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: #854d0e; line-height: 1;
    }
    .score-copy h2 { font-size: 15px; font-weight: 700; color: #854d0e; margin-bottom: 3px; }
    .score-copy p { color: #713f12; font-size: 11px; }

    .findings-list { display: flex; flex-direction: column; gap: 12px; }
    .finding-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; background: #ffffff; page-break-inside: avoid; }
    .finding-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .finding-rule { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 700; color: #0f172a; }
    .badge { display: inline-block; padding: 2px 7px; font-size: 9px; font-weight: 700; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.04em; }
    .badge-critical { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-warning { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
    .badge-info { background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; }
    .finding-issue { color: #475569; font-size: 11px; margin-bottom: 8px; }
    .finding-fix { background: #f8fafc; border-left: 3px solid #0f172a; padding: 6px 10px; font-size: 11px; color: #0f172a; font-weight: 500; }

    .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
  </style>
</head>
<body>

  <header class="header">
    <div class="brand">
      <h1>ClaimClear</h1>
      <p>Pre-Submission Insurance Claim Audit Report</p>
    </div>
    <div class="report-meta">
      <div>DATE: <strong>${today}</strong></div>
    </div>
  </header>

  <div class="readiness-banner">
    <div class="score-circle">
      <svg viewBox="0 0 70 70">
        <circle class="score-circle-track" cx="35" cy="35" r="30"></circle>
        <circle class="score-circle-fill" cx="35" cy="35" r="30" style="stroke-dasharray:${circumference};stroke-dashoffset:${dashOffset}"></circle>
      </svg>
      <div class="score-number">${data.readiness_score}</div>
    </div>
    <div class="score-copy">
      <h2>Readiness Score: ${data.readiness_score}/100 (${escapeHtml(statusLabel(data.status))})</h2>
      <p>${data.total_violations} issue${data.total_violations === 1 ? '' : 's'} detected. Critical issues must be resolved before submission.</p>
    </div>
  </div>

  <p class="section-title">Audit Findings &amp; Recommended Actions</p>
  <div class="findings-list">
    ${findingsSection}
  </div>

  <footer class="footer">
    <span>ClaimClear Pre-Submission Audit System</span>
    <span>Private &amp; Confidential</span>
  </footer>

</body>
</html>
`
}

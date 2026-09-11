'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowDownToLine, ChevronDown, CircleAlert, Info, ShieldAlert } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SiteFooter } from '@/components/site-footer'

type Finding = {
  severity: 'Critical' | 'Warning' | 'Info'
  tone: 'critical' | 'warning' | 'info'
  rule: string
  title: string
  issue: string
  fix: string
}

const findings: Finding[] = [
  { severity: 'Critical', tone: 'critical', rule: 'Rule 04 — Diagnosis Code Specificity', title: 'Primary Diagnosis (ICD-10)', issue: 'The primary diagnosis code is too broad for the documented procedure. This may trigger a medical necessity review.', fix: 'Verify the most specific ICD-10 code against the clinical documentation.' },
  { severity: 'Critical', tone: 'critical', rule: 'Rule 11 — Pre-authorization Reference', title: 'Box 23 — Prior Authorization Number', issue: 'The claim does not include a prior authorization reference for a procedure that requires one.', fix: 'Add the authorization reference from the payer confirmation before submission.' },
  { severity: 'Warning', tone: 'warning', rule: 'Rule 07 — Modifier Conflict', title: 'Line 3 — CPT 99213-25', issue: 'The modifier may conflict with another service billed on the same date.', fix: 'Confirm modifier 25 is supported by a separately identifiable evaluation.' },
  { severity: 'Warning', tone: 'warning', rule: 'Rule 02 — Date Sequence Integrity', title: 'Admission / Discharge Dates', issue: 'Discharge date (12 Aug) precedes procedure date (13 Aug) on Line 4. Sequence error will trigger auto-denial.', fix: 'Verify procedure date against the operative report and correct Line 4 to 12 Aug 2026.' },
  { severity: 'Info', tone: 'info', rule: 'Rule 15 — NPI Taxonomy Mismatch', title: 'Box 24J — Rendering Provider NPI', issue: 'The rendering provider taxonomy is different from the specialty listed in the claim.', fix: 'Review the provider taxonomy and update it if the specialty has changed.' },
]

const icons = { critical: CircleAlert, warning: ShieldAlert, info: Info }

export default function ResultsPage() {
  const [openFinding, setOpenFinding] = useState(3)

  return (
    <main className="report-page">
      <header className="site-header shell">
        <Link className="wordmark" href="/">ClaimClear</Link>
        <div className="header-actions">
          <ThemeToggle />
          <button className="button button-small" onClick={() => window.print()}>
            <ArrowDownToLine size={15} aria-hidden="true" /> Download report
          </button>
        </div>
      </header>

      <section className="report-shell shell" aria-labelledby="report-title">
        <div className="report-summary">
          <div className="score-ring" aria-label="Claim readiness score 62 out of 100">
            <div className="score-ring-inner"><strong>62</strong><span>READINESS</span></div>
          </div>
          <div className="score-copy">
            <p className="mono-label">CLAIM READINESS SCORE</p>
            <h1 id="report-title">Needs Attention</h1>
            <p>2 critical issues and 2 warnings detected. Resolve critical items before submission.</p>
            <div className="severity-counts"><span className="count-critical"><i />2 Critical</span><span className="count-warning"><i />2 Warnings</span><span className="count-info"><i />1 Info</span></div>
          </div>
        </div>

        <section className="report-findings" aria-labelledby="issues-title">
          <div className="report-section-heading"><p id="issues-title" className="mono-label">ISSUES — RANKED BY IMPACT</p><p className="mono report-id">REPORT / CC-2048</p></div>
          <div className="report-finding-list">
            {findings.map((finding, index) => {
              const Icon = icons[finding.tone]
              const isOpen = openFinding === index
              return (
                <article className={`report-finding ${finding.tone} ${isOpen ? 'is-open' : ''}`} key={finding.rule}>
                  <button className="report-finding-trigger" onClick={() => setOpenFinding(isOpen ? -1 : index)} aria-expanded={isOpen}>
                    <span className="severity-badge"><Icon size={12} aria-hidden="true" /> {finding.severity}</span>
                    <span className="finding-title"><span className="mono">{finding.rule}</span><strong>{finding.title}</strong></span>
                    <ChevronDown className="finding-chevron" size={16} aria-hidden="true" />
                  </button>
                  {isOpen && <div className="finding-details"><div><p className="detail-label">ISSUE</p><p>{finding.issue}</p></div><div className="fix-panel"><p className="detail-label">RECOMMENDED FIX</p><p>{finding.fix}</p></div></div>}
                </article>
              )
            })}
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  )
}

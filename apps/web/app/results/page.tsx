'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowDownToLine, ChevronDown, CircleAlert, Info, Loader2, ShieldAlert } from 'lucide-react'
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
  { 
    severity: 'Critical', 
    tone: 'critical', 
    rule: 'MISSING_PREAUTH', 
    title: 'Pre-authorization for 29881', 
    issue: 'Procedure 29881 typically requires pre-authorization for planned surgical interventions. No pre-authorization reference was found in the extracted documentation.', 
    fix: 'Attach pre-authorization reference number before submission.' 
  },
  { 
    severity: 'Warning', 
    tone: 'warning', 
    rule: 'DIAGNOSIS_PROCEDURE_MISMATCH', 
    title: 'Primary Diagnosis Blank', 
    issue: 'Diagnosis code M23.2 (Meniscus tear) is logically consistent with procedure 29881, but the primary diagnosis field on the draft claim form was left blank.', 
    fix: 'Ensure primary diagnosis field matches clinical extraction (M23.2) on the draft claim.' 
  },
  { 
    severity: 'Info', 
    tone: 'info', 
    rule: 'MISSING_SIGNATURE', 
    title: 'Provider Signature', 
    issue: 'Provider signature and certification field appears empty on the drafted claim form.', 
    fix: 'Ensure Dr. Sarah Jenkins signs the final claim form.' 
  },
]

const icons = { critical: CircleAlert, warning: ShieldAlert, info: Info }

const READINESS_SCORE = 62
const RING_RADIUS = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export default function ResultsPage() {
  const [openFinding, setOpenFinding] = useState(0) // Default to opening the first (critical) finding
  const [animatedScore, setAnimatedScore] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const duration = 1400 
    let startTime: number | null = null
    let raf: number

    function tick(timestamp: number) {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      setAnimatedScore(Math.round(eased * READINESS_SCORE))

      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const dashOffset = RING_CIRCUMFERENCE - (animatedScore / 100) * RING_CIRCUMFERENCE

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch('/api/report')
      if (!res.ok) {
        alert('Failed to generate report. Please try again.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = 'ClaimClear_Audit_Report.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Something went wrong generating the report.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <main className="report-page">
      <header className="site-header shell">
        <Link className="wordmark" href="/">
          ClaimClear
        </Link>
        <div className="header-actions">
          <ThemeToggle />
          <button className="button button-small" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <ArrowDownToLine size={15} aria-hidden="true" />
            )}
            {isDownloading ? 'Generating…' : 'Download report'}
          </button>
        </div>
      </header>

      <section className="report-shell shell" aria-labelledby="report-title">
        <div className="report-summary">
          <div className="score-ring" aria-label={`Claim readiness score ${READINESS_SCORE} out of 100`}>
            <svg className="score-ring-svg" viewBox="0 0 120 120">
              <circle className="score-ring-track" cx="60" cy="60" r={RING_RADIUS} />
              <circle
                className="score-ring-progress"
                cx="60"
                cy="60"
                r={RING_RADIUS}
                style={{
                  strokeDasharray: RING_CIRCUMFERENCE,
                  strokeDashoffset: dashOffset,
                }}
              />
            </svg>
            <div className="score-ring-inner"><strong>{animatedScore}</strong><span>READINESS</span></div>
          </div>
          <div className="score-copy">
            <p className="mono-label">CLAIM READINESS SCORE</p>
            <h1 id="report-title">Needs Attention</h1>
            <p>1 critical issue, 1 warning, and 1 info note detected. Resolve critical items before submission.</p>
            <div className="severity-counts">
              <span className="count-critical"><i />1 Critical</span>
              <span className="count-warning"><i />1 Warning</span>
              <span className="count-info"><i />1 Info</span>
            </div>
          </div>
        </div>

        <section className="report-findings" aria-labelledby="issues-title">
          <div className="report-section-heading">
            <p id="issues-title" className="mono-label">ISSUES — RANKED BY IMPACT</p>
            <p className="mono report-id">REPORT / CLM-2026-883A</p>
          </div>
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
                  {isOpen && (
                    <div className="finding-details">
                      <div>
                        <p className="detail-label">ISSUE</p>
                        <p>{finding.issue}</p>
                      </div>
                      <div className="fix-panel">
                        <p className="detail-label">RECOMMENDED FIX</p>
                        <p>{finding.fix}</p>
                      </div>
                    </div>
                  )}
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
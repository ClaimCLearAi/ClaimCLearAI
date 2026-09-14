'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDownToLine, ChevronDown, CircleAlert, Info, Loader2, ShieldAlert } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SiteFooter } from '@/components/site-footer'
import { getState, subscribe, AuditFinding } from '@/lib/audit-store'

const RING_RADIUS = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

// Map your backend's severity strings to the tone classes the CSS expects.
function toneFor(severity: string): 'critical' | 'warning' | 'info' {
  const s = severity.toUpperCase()
  if (s === 'CRITICAL' || s === 'MAJOR') return 'critical'
  if (s === 'WARNING' || s === 'MODERATE') return 'warning'
  return 'info'
}

const icons = { critical: CircleAlert, warning: ShieldAlert, info: Info }

export default function ResultsPage() {
  const router = useRouter()
  const [audit, setAudit] = useState(getState())
  const [openFinding, setOpenFinding] = useState(0)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribe(() => setAudit(getState()))
    return unsubscribe
  }, [])

  useEffect(() => {
    if (audit.status !== 'done' || !audit.result) {
      if (audit.status === 'idle' || audit.status === 'error') router.replace('/upload')
      return
    }
  }, [audit.status, audit.result, router])

  const result = audit.result
  const score = result?.readiness_score ?? 0

  useEffect(() => {
    if (!result) return
    const duration = 1400
    let startTime: number | null = null
    let raf: number
    function tick(timestamp: number) {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimatedScore(Math.round(easeOutCubic(progress) * score))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [result, score])

  if (!result) return null // redirect effect above handles navigation

  const dashOffset = RING_CIRCUMFERENCE - (animatedScore / 100) * RING_CIRCUMFERENCE
  const findings = result.findings
  const counts = findings.reduce(
    (acc, f) => {
      acc[toneFor(f.severity)] += 1
      return acc
    },
    { critical: 0, warning: 0, info: 0 } as Record<'critical' | 'warning' | 'info', number>,
  )

  const statusLabel = result.status.replace(/_/g, ' ')

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      })
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
        <Link className="wordmark" href="/">ClaimClear</Link>
        <div className="header-actions">
          <ThemeToggle />
          <button className="button button-small" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <ArrowDownToLine size={15} aria-hidden="true" />}
            {isDownloading ? 'Generating…' : 'Download report'}
          </button>
        </div>
      </header>

      <section className="report-shell shell" aria-labelledby="report-title">
        <div className="report-summary">
          <div className="score-ring" aria-label={`Claim readiness score ${score} out of 100`}>
            <svg className="score-ring-svg" viewBox="0 0 120 120">
              <circle className="score-ring-track" cx="60" cy="60" r={RING_RADIUS} />
              <circle className="score-ring-progress" cx="60" cy="60" r={RING_RADIUS} style={{ strokeDasharray: RING_CIRCUMFERENCE, strokeDashoffset: dashOffset }} />
            </svg>
            <div className="score-ring-inner"><strong>{animatedScore}</strong><span>READINESS</span></div>
          </div>
          <div className="score-copy">
            <p className="mono-label">CLAIM READINESS SCORE</p>
            <h1 id="report-title">{statusLabel}</h1>
            <p>{result.total_violations} issue{result.total_violations === 1 ? '' : 's'} detected. Resolve critical items before submission.</p>
            <div className="severity-counts">
              <span className="count-critical"><i />{counts.critical} Critical</span>
              <span className="count-warning"><i />{counts.warning} Warning</span>
              <span className="count-info"><i />{counts.info} Info</span>
            </div>
          </div>
        </div>

        <section className="report-findings" aria-labelledby="issues-title">
          <div className="report-section-heading">
            <p id="issues-title" className="mono-label">ISSUES — RANKED BY IMPACT</p>
          </div>
          <div className="report-finding-list">
            {findings.map((finding: AuditFinding, index: number) => {
              const tone = toneFor(finding.severity)
              const Icon = icons[tone]
              const isOpen = openFinding === index
              return (
                <article className={`report-finding ${tone} ${isOpen ? 'is-open' : ''}`} key={finding.rule_id}>
                  <button className="report-finding-trigger" onClick={() => setOpenFinding(isOpen ? -1 : index)} aria-expanded={isOpen}>
                    <span className="severity-badge"><Icon size={12} aria-hidden="true" /> {finding.severity}</span>
                    <span className="finding-title"><span className="mono">{finding.rule_id}</span><strong>{finding.title}</strong></span>
                    <ChevronDown className="finding-chevron" size={16} aria-hidden="true" />
                  </button>
                  {isOpen && (
                    <div className="finding-details">
                      <div>
                        <p className="detail-label">ISSUE</p>
                        <p>{finding.detected_issue}</p>
                      </div>
                      <div className="fix-panel">
                        <p className="detail-label">RECOMMENDED FIX</p>
                        <p>{finding.suggested_fix}</p>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
            {findings.length === 0 && <p>No issues found — this claim looks ready to submit.</p>}
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  )
}

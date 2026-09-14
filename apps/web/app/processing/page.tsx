'use client'

import Link from 'next/link'
import { ArrowRight, Check, CircleDashed, TriangleAlert } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SiteFooter } from '@/components/site-footer'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getState, subscribe } from '@/lib/audit-store'
import { Logo } from '@/components/logo'


// Purely cosmetic step labels — they no longer drive completion, the
// real backend response does. They just advance on a timer while we wait,
// and freeze once the request actually finishes.
const steps = ['Parsing documents', 'Extracting claim data', 'Running checks', 'Preparing your report']

export default function ProcessingPage() {
  const router = useRouter()
  const [visualStep, setVisualStep] = useState(0)
  const [audit, setAudit] = useState(getState())

  useEffect(() => {
    // If someone lands here directly without uploading, send them back.
    if (audit.status === 'idle') {
      router.replace('/upload')
    }
  }, [audit.status, router])

  useEffect(() => {
    const unsubscribe = subscribe(() => setAudit(getState()))
    return unsubscribe
  }, [])

  useEffect(() => {
    if (audit.status !== 'processing') return
    const timer = window.setInterval(() => {
      setVisualStep((current) => Math.min(current + 1, steps.length - 1))
    }, 1200)
    return () => window.clearInterval(timer)
  }, [audit.status])

  useEffect(() => {
    if (audit.status === 'done') {
      // brief pause so the last step reads as "complete" before navigating
      const t = window.setTimeout(() => router.push('/results'), 500)
      return () => window.clearTimeout(t)
    }
  }, [audit.status, router])

  const displayStep = audit.status === 'done' ? steps.length : visualStep

  return (
    <main>
      <header className="site-header shell">
        <Logo />
        <div className="header-actions"><ThemeToggle /><span className="mono">Processing</span></div>
      </header>
      <section className="center-page">
        <div className="processing">
          <p className="mono-label">STEP 02 / ANALYSIS</p>
          <h1>{audit.status === 'error' ? 'Something went wrong.' : 'Auditing your claim.'}</h1>

          {audit.status === 'error' ? (
            <>
              <p style={{ margin: '16px 0' }}><TriangleAlert size={17} aria-hidden="true" /> {audit.error}</p>
              <Link className="button" href="/upload">Try again</Link>
            </>
          ) : (
            <ol className="process-list">
              {steps.map((step, index) => {
                const done = index < displayStep
                const current = index === displayStep && displayStep < steps.length
                return (
                  <li key={step} className={done ? 'complete' : current ? 'current' : ''}>
                    <span className="process-mark">{done ? <Check size={17} /> : current ? <CircleDashed size={17} /> : '—'}</span>
                    <span>{step}</span>
                  </li>
                )
              })}
            </ol>
          )}

          {audit.status === 'done' && (
            <Link className="button" href="/results" style={{ marginTop: 34 }}>
              View Report <ArrowRight size={17} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}

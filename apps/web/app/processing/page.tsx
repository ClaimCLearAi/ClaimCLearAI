'use client'

import Link from 'next/link'
import { ArrowRight, Check, CircleDashed } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SiteFooter } from '@/components/site-footer'
import { useEffect, useState } from 'react'

const steps = ['Parsing documents', 'Extracting claim data', 'Running 15 checks', 'Preparing your report']
export default function ProcessingPage() { const [complete, setComplete] = useState(0); useEffect(() => { const timer = window.setInterval(() => setComplete((current) => Math.min(current + 1, steps.length)), 850); return () => window.clearInterval(timer) }, []); return <main><header className="site-header shell"><Link className="wordmark" href="/">ClaimClear</Link><div className="header-actions"><ThemeToggle /><span className="mono">Processing</span></div></header><section className="center-page"><div className="processing"><p className="mono-label">STEP 02 / ANALYSIS</p><h1>Auditing your claim.</h1><ol className="process-list">{steps.map((step, index) => { const done = index < complete; const current = index === complete && complete < steps.length; return <li key={step} className={done ? 'complete' : current ? 'current' : ''}><span className="process-mark">{done ? <Check size={17} /> : current ? <CircleDashed size={17} /> : '—'}</span><span>{step}</span></li> })}</ol>{complete === steps.length && <Link className="button" href="/results" style={{ marginTop: 34 }}>View Report <ArrowRight size={17} aria-hidden="true" /></Link>}</div></section><SiteFooter /></main> }

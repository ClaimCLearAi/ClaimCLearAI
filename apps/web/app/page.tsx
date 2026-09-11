'use client'

import Link from 'next/link'
import { ArrowRight, FileCheck2, FileText, ShieldCheck, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SiteFooter } from '@/components/site-footer'

const clearSteps = [
  { icon: FileText, title: 'Add your documents', description: 'Upload your clinical record and draft claim.' },
  { icon: Sparkles, title: 'Run the audit', description: 'We scan 15 common rejection patterns.' },
  { icon: FileCheck2, title: 'Submit with confidence', description: 'Fix clear, prioritized findings first.' },
]

export default function Page() {
  return <main>
    <header className="site-header shell"><Link className="wordmark" href="/">ClaimClear</Link><div className="header-actions"><ThemeToggle /><Link className="button button-small" href="/upload">Start an audit <ArrowRight size={15} aria-hidden="true" /></Link></div></header>
    <section className="landing-hero shell"><div className="hero-content"><p className="mono-label">CLAIMS, MADE CLEAR</p><h1>Know what to fix before you submit.</h1><p className="hero-copy">ClaimClear reviews your clinical record and draft claim in one calm, guided pass—so avoidable errors do not become delays.</p><div className="hero-actions"><Link className="button" href="/upload">Check my claim <ArrowRight size={17} aria-hidden="true" /></Link><span className="action-note">Free to try · No account needed</span></div></div><aside className="hero-card" aria-label="Annual claim rejection statistics"><div className="hero-card-top"><span className="mono">CLAIM SNAPSHOT</span><span className="status-dot">2024 REPORT</span></div><div className="hero-card-score"><span>1 in 5</span><p>health insurance claims<br />are rejected on first submission</p></div><div className="claim-stat-grid"><div><strong>20%</strong><span>rejected initially</span></div><div><strong>14 days</strong><span>average delay</span></div><div><strong>$1.2B</strong><span>denied annually</span></div><div><strong>80%</strong><span>can be prevented</span></div></div><div className="hero-card-list"><div><ShieldCheck size={16} aria-hidden="true" />Catch avoidable errors before submission</div><div><ShieldCheck size={16} aria-hidden="true" />Get clear, prioritized next steps</div></div><p className="hero-card-foot">ClaimClear helps you turn claim risk into a clear action plan.</p></aside></section>
    <section className="reassurance shell"><span className="mono">BUILT FOR THE MOMENT BEFORE SUBMISSION</span><p>Clear answers, not more paperwork. Know what needs attention before an insurer does.</p></section>
    <section className="how-it-works shell"><div className="section-heading"><p className="mono-label">THREE SIMPLE STEPS</p><h2>A straight line to a cleaner claim.</h2></div><div className="flow-steps">{clearSteps.map(({ icon: Icon, title, description }, index) => <div className="flow-step-wrap" key={title}><article className="flow-step"><span className="flow-icon"><Icon size={22} aria-hidden="true" /></span><span className="flow-number mono">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>{index < clearSteps.length - 1 && <ArrowRight className="flow-arrow" size={24} aria-hidden="true" />}</div>)}</div></section>
    <section className="final-cta shell"><div><p className="mono-label">READY WHEN YOU ARE</p><h2>Make the clean claim the first claim.</h2></div><Link className="button" href="/upload">Audit a claim <ArrowRight size={17} aria-hidden="true" /></Link></section>
    <SiteFooter />
  </main>
}

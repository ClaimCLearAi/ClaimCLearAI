'use client'

import Link from 'next/link'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="site-footer shell">
      <div className="footer-brand"><div className="footer-mark"><ShieldCheck size={17} aria-hidden="true" /></div><div><Link className="wordmark" href="/">ClaimClear</Link><p>Pre-submission claim review, made simple.</p></div></div>
      <nav className="footer-nav" aria-label="Footer navigation"><Link href="/upload">Start an audit <ArrowUpRight size={14} aria-hidden="true" /></Link><Link href="/">How it works</Link></nav>
      <p className="footer-legal">Private by design.<br />Your documents are only used for this audit.</p>
    </footer>
  )
}

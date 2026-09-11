'use client'

import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { ArrowRight, FileCheck2, FileText, ShieldCheck, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SiteFooter } from '@/components/site-footer'

const clearSteps = [
  { icon: FileText, title: 'Add your documents', description: 'Upload your clinical record and draft claim.' },
  { icon: Sparkles, title: 'Run the audit', description: 'We scan 15 common rejection patterns.' },
  { icon: FileCheck2, title: 'Submit with confidence', description: 'Fix clear, prioritized findings first.' },
]

export default function Page() {
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <main>
      <header className="site-header shell">
        <Link className="wordmark" href="/">
          ClaimClear
        </Link>
        <div className="header-actions">
          <ThemeToggle />
          <Link className="button button-small" href="/upload">
            Start an audit <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="landing-hero shell">
        <motion.div 
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.p className="mono-label" variants={fadeUp}>CLAIMS, MADE CLEAR</motion.p>
          <motion.h1 variants={fadeUp}>Know what to fix before you submit.</motion.h1>
          <motion.p className="hero-copy" variants={fadeUp}>
            ClaimClear reviews your clinical record and draft claim in one calm, guided pass—so avoidable errors do not become delays.
          </motion.p>
          <motion.div className="hero-actions" variants={fadeUp}>
            <Link className="button" href="/upload">
              Check my claim <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <span className="action-note">Free to try · No account needed</span>
          </motion.div>
        </motion.div>

        <motion.aside 
          className="hero-card" 
          aria-label="Annual claim rejection statistics"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <div className="hero-card-top">
            <span className="mono">CLAIM SNAPSHOT</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <motion.span 
                style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              />
              <span >INDIA 2025</span>
            </div>
          </div>
          
          <div className="hero-card-score">
            <span>1 in 3</span>
            <p>
              health insurance claims<br />
              get stuck in query loops
            </p>
          </div>
          
          <div className="claim-stat-grid">
            <div>
              <strong>6-12 hrs</strong>
              <span>discharge delay</span>
            </div>
            <div>
              <strong>30%</strong>
              <span>avg. deductions</span>
            </div>
            <div>
              <strong>₹30k Cr</strong>
              <span>denied annually</span>
            </div>
            <div>
              <strong>85%</strong>
              <span>can be prevented</span>
            </div>
          </div>
          
          <div className="hero-card-list">
            <div>
              <ShieldCheck size={16} aria-hidden="true" />
              Catch avoidable errors before submission
            </div>
            <div>
              <ShieldCheck size={16} aria-hidden="true" />
              Get clear, prioritized next steps
            </div>
          </div>
          
          <p className="hero-card-foot">
            ClaimClear helps you turn claim friction into instant approvals.
          </p>
        </motion.aside>
      </section>

      <motion.section 
        className="reassurance shell"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeUp}
      >
        <span className="mono">BUILT FOR THE MOMENT BEFORE SUBMISSION</span>
        <p>Clear answers, not more paperwork. Know what needs attention before an insurer does.</p>
      </motion.section>

      <section className="how-it-works shell">
        <div className="section-heading">
          <p className="mono-label">THREE SIMPLE STEPS</p>
          <h2>A straight line to a cleaner claim.</h2>
        </div>
        <motion.div 
          className="flow-steps"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
        >
          {clearSteps.map(({ icon: Icon, title, description }, index) => (
            <div className="flow-step-wrap" key={title}>
              <motion.article 
                className="flow-step"
                variants={fadeUp}
                whileHover={{ y: -5 }}
              >
                <span className="flow-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="flow-number mono">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </motion.article>
              {index < clearSteps.length - 1 && (
                <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowRight className="flow-arrow" size={24} aria-hidden="true" />
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>
      </section>

      <motion.section 
        className="final-cta shell"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <p className="mono-label">READY WHEN YOU ARE</p>
          <h2>Make the clean claim the first claim.</h2>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link className="button" href="/upload">
            Audit a claim <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </motion.div>
      </motion.section>

      <SiteFooter />
    </main>
  );
}
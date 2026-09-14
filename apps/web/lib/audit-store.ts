'use client'

// Simple module-level store. Next.js keeps this module alive across
// client-side navigations (router.push), so state set on /upload is
// still readable on /processing and /results without any backend
// session or database. It resets on a hard refresh — that's fine,
// since a hard refresh means the user re-uploads anyway.

export type AuditFinding = {
  rule_id: string
  title: string
  category: string
  severity: string // "CRITICAL" | "MAJOR" | "MINOR" (whatever rules_config.json defines)
  deduction: number
  regulatory_source: string
  detected_issue: string
  suggested_fix: string
}

export type AuditResult = {
  readiness_score: number
  status: string
  total_violations: number
  findings: AuditFinding[]
}

export type AuditStatus = 'idle' | 'processing' | 'done' | 'error'

type State = {
  status: AuditStatus
  result: AuditResult | null
  error: string | null
}

let state: State = { status: 'idle', result: null, error: null }
const listeners = new Set<() => void>()

function setState(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState() {
  return state
}

// FastAPI's `detail` can be a plain string OR (for our document-type
// validation) an object like { message, reasons: [...] }. Normalize
// either shape into one readable string for the UI.
function extractErrorMessage(detail: unknown, fallback: string): string {
  if (!detail) return fallback
  if (typeof detail === 'string') return detail
  if (typeof detail === 'object' && detail !== null) {
    const d = detail as { message?: string; reasons?: string[] }
    if (d.message) {
      return d.reasons?.length ? `${d.message} ${d.reasons.join(' ')}` : d.message
    }
  }
  return fallback
}

export async function startAudit(clinicalDoc: File, draftClaim: File) {
  setState({ status: 'processing', result: null, error: null })

  const formData = new FormData()
  formData.append('clinical_doc', clinicalDoc)
  formData.append('draft_claim', draftClaim)

  try {
    const res = await fetch('/api/extract', { method: 'POST', body: formData })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(body.detail, `Extraction failed (${res.status})`))
    }

    const data = await res.json()
    setState({ status: 'done', result: data.audit as AuditResult })
  } catch (err) {
    setState({
      status: 'error',
      error: err instanceof Error ? err.message : 'Something went wrong during the audit.',
    })
  }
}

export function resetAudit() {
  setState({ status: 'idle', result: null, error: null })
}

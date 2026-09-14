import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Set this in apps/web/.env.local, e.g.:
// EXTRACTION_SERVICE_URL=http://127.0.0.1:8000
const EXTRACTION_SERVICE_URL = process.env.EXTRACTION_SERVICE_URL || 'http://127.0.0.1:8000'

export async function POST(request: NextRequest) {
  try {
    const incomingForm = await request.formData()

    const clinicalDoc = incomingForm.get('clinical_doc')
    const draftClaim = incomingForm.get('draft_claim')

    if (!clinicalDoc || !draftClaim) {
      return NextResponse.json(
        { detail: 'Both clinical_doc and draft_claim files are required.' },
        { status: 400 },
      )
    }

    // Re-build the multipart form to forward to FastAPI.
    const forwardForm = new FormData()
    forwardForm.append('clinical_doc', clinicalDoc)
    forwardForm.append('draft_claim', draftClaim)

    const backendRes = await fetch(`${EXTRACTION_SERVICE_URL}/extract`, {
      method: 'POST',
      body: forwardForm,
    })

    const data = await backendRes.json()

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Proxy to extraction service failed:', err)
    return NextResponse.json(
      { detail: 'Could not reach the extraction service. Is it running?' },
      { status: 502 },
    )
  }
}

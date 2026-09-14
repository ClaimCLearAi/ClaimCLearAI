export const runtime = 'nodejs'

import puppeteer from 'puppeteer'
import { NextRequest, NextResponse } from 'next/server'
import { generateReportHtml, ReportData } from '@/lib/report-template'

export async function POST(request: NextRequest) {
  let browser
  try {
    const data = (await request.json()) as ReportData

    if (!data || typeof data.readiness_score !== 'number' || !Array.isArray(data.findings)) {
      return NextResponse.json({ error: 'Missing or malformed audit data.' }, { status: 400 })
    }

    const html = generateReportHtml(data)

    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
    })

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ClaimClear_Audit_Report.pdf"',
      },
    })
  } catch (err) {
    console.error('PDF generation failed:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  } finally {
    if (browser) await browser.close()
  }
}

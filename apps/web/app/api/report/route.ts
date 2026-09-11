export const runtime = 'nodejs'

import puppeteer from 'puppeteer'
import { NextResponse } from 'next/server'
import { REPORT_HTML } from '@/lib/report-template'

export async function GET() {
  let browser
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()

    await page.setContent(REPORT_HTML, { waitUntil: 'load' })

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
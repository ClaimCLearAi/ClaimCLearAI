import { Analytics } from '@vercel/analytics/next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const interTight = Geist({ variable: '--font-inter-tight', subsets: ['latin'] })
const plexMono = Geist_Mono({ variable: '--font-plex-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClaimClear',
  description: 'Audit clinical records and draft insurance claims against known rejection patterns before submission.',
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: '#0D1114',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${interTight.variable} ${plexMono.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

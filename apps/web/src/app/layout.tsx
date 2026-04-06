import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CookieConsent } from '@/components/cookie-consent'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const DESCRIPTION = 'Trouvez et reservez des places de parking privees en quelques secondes. Flashpark, la marketplace P2P du parking.'

export const metadata: Metadata = {
  metadataBase: new URL('https://flashpark.fr'),
  title: 'Flashpark — Louez votre place de parking',
  description: DESCRIPTION,
  keywords: ['parking', 'location parking', 'place de parking', 'France', 'P2P parking', 'Montpellier', 'Nice', 'Paris'],
  openGraph: {
    title: 'Flashpark',
    description: DESCRIPTION,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Flashpark',
    url: 'https://flashpark.fr',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flashpark',
    description: DESCRIPTION,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css" rel="stylesheet" />
      </head>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}

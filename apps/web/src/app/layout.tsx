import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Flashpark — Louez votre place de parking',
  description:
    'Trouvez et réservez des places de parking privées en quelques secondes. Flashpark, la marketplace P2P du parking.',
  keywords: ['parking', 'location parking', 'place de parking', 'France', 'P2P parking', 'Montpellier', 'Nice', 'Paris'],
  openGraph: {
    title: 'Flashpark',
    description: "L'Airbnb du parking",
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}

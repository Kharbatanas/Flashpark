import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Flashpark Admin',
  description: 'Back-office Flashpark — Gestion de la plateforme',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-[#F8FAFC] text-gray-900 antialiased font-sans">{children}</body>
    </html>
  )
}

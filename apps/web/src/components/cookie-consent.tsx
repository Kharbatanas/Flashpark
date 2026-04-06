'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'flashpark_cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-gray-100 bg-white p-4 shadow-lg md:left-6 md:right-auto md:w-[420px]"
    >
      <p className="text-sm text-gray-700">
        Ce site utilise des cookies pour ameliorer votre experience et analyser notre trafic.{' '}
        <a href="/terms" className="text-[#0540FF] hover:underline">
          En savoir plus
        </a>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={accept}
          className="flex-1 rounded-xl bg-[#0540FF] py-2 text-sm font-semibold text-white hover:bg-[#0435D2] transition-colors"
        >
          Accepter
        </button>
        <button
          onClick={decline}
          className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Refuser
        </button>
      </div>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

export default function BecomeHostButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/host/onboarding')}
      className="inline-flex items-center gap-2 rounded-2xl bg-[#0540FF] px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-[#0435D2] transition-colors"
    >
      Devenir hote gratuitement
      <ChevronRight className="h-4 w-4" />
    </button>
  )
}

'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '../../../lib/trpc/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS: Record<string, { label: string; variant: 'pending' | 'success' | 'active' | 'secondary' | 'cancelled' }> = {
  pending: { label: 'En attente', variant: 'pending' },
  confirmed: { label: 'Confirmee', variant: 'success' },
  active: { label: 'Active', variant: 'active' },
  completed: { label: 'Terminee', variant: 'secondary' },
  cancelled: { label: 'Annulee', variant: 'cancelled' },
}

function formatDT(d: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get('code') ?? ''

  const [code, setCode] = useState(codeFromUrl)
  const [searchedCode, setSearchedCode] = useState(codeFromUrl || null)

  // Search by QR code or booking ID
  const { data: results, isLoading, error } = api.bookings.verifyCode.useQuery(
    { code: searchedCode! },
    { enabled: !!searchedCode, retry: false }
  )

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (code.trim()) setSearchedCode(code.trim())
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0540FF]/10">
            <svg className="h-8 w-8 text-[#0540FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Verification de reservation</h1>
          <p className="mt-2 text-sm text-gray-500">
            Scannez le QR code du conducteur ou entrez le code manuellement
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: FP-E9B4EB24-260405"
              className="font-mono text-sm"
            />
            <Button type="submit" disabled={!code.trim() || isLoading}>
              {isLoading ? '...' : 'Verifier'}
            </Button>
          </div>
        </form>

        {/* Result */}
        {error && (
          <Card className="border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-700">Reservation introuvable</p>
            <p className="mt-1 text-xs text-red-500">Verifiez le code et reessayez</p>
          </Card>
        )}

        {results && (
          <Card className="overflow-hidden">
            {/* Status header */}
            <div className={`px-6 py-4 ${
              results.isValid ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-red-50 border-b border-red-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {results.isValid ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                      <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className={`text-sm font-bold ${results.isValid ? 'text-emerald-700' : 'text-red-700'}`}>
                      {results.isValid ? 'Reservation valide' : 'Reservation invalide'}
                    </p>
                    <p className={`text-xs ${results.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                      {results.message}
                    </p>
                  </div>
                </div>
                <Badge variant={STATUS_LABELS[results.booking.status]?.variant ?? 'secondary'}>
                  {STATUS_LABELS[results.booking.status]?.label ?? results.booking.status}
                </Badge>
              </div>
            </div>

            {/* Booking details */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Place</p>
                <p className="mt-1 text-sm font-semibold text-[#1A1A2E]">{results.spotTitle}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Arrivee</p>
                  <p className="mt-1 text-sm text-gray-700">{formatDT(results.booking.startTime)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Depart</p>
                  <p className="mt-1 text-sm text-gray-700">{formatDT(results.booking.endTime)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Reference</p>
                <p className="mt-1 font-mono text-sm text-gray-700">{results.booking.qrCode ?? results.booking.id.slice(0, 8)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Instructions */}
        <div className="mt-8 rounded-xl border border-gray-100 bg-white p-5">
          <h3 className="text-sm font-semibold text-[#1A1A2E]">Comment utiliser</h3>
          <ul className="mt-3 space-y-2 text-xs text-gray-500">
            <li className="flex gap-2">
              <span className="font-bold text-[#0540FF]">1.</span>
              Le conducteur vous montre son QR code sur son telephone
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#0540FF]">2.</span>
              Entrez le code (sous le QR) dans le champ ci-dessus
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-[#0540FF]">3.</span>
              Si la reservation est valide et active, laissez le conducteur acceder a la place
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

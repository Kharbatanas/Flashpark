'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resolveDispute, updateDisputeStatus } from './actions'

interface DisputeActionsProps {
  disputeId: string
  bookingId: string | null
  status: string
  description: string
  photos: string[] | null
  reportedUserId: string | null
}

export function DisputeActions({
  disputeId,
  bookingId,
  status,
  description,
  photos,
  reportedUserId,
}: DisputeActionsProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [resolution, setResolution] = useState('')
  const [resolveStatus, setResolveStatus] = useState<'resolved_refunded' | 'resolved_rejected' | 'resolved_compensation'>('resolved_rejected')
  const [refundAmount, setRefundAmount] = useState('')
  const [addStrike, setAddStrike] = useState(false)

  const isResolved = ['resolved_refunded', 'resolved_rejected', 'resolved_compensation'].includes(status)
  const showRefundAmount = resolveStatus === 'resolved_refunded' || resolveStatus === 'resolved_compensation'

  async function handleMarkUnderReview() {
    setLoading(true)
    setMessage(null)
    try {
      const result = await updateDisputeStatus(disputeId, 'under_review')
      if (result.ok) {
        router.refresh()
      } else {
        setMessage(result.error ?? 'Erreur inconnue')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResolve() {
    if (!resolution.trim()) {
      setMessage('La resolution est requise')
      return
    }

    const amount = showRefundAmount && refundAmount ? parseFloat(refundAmount) : null

    setLoading(true)
    setMessage(null)
    try {
      const result = await resolveDispute(
        disputeId,
        resolution,
        resolveStatus,
        amount,
        addStrike
      )
      if (result.ok) {
        setResolveOpen(false)
        router.refresh()
      } else {
        setMessage(result.error ?? 'Erreur inconnue')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
        >
          {expanded ? 'Masquer' : 'Voir'}
        </button>

        {status === 'open' && (
          <button
            onClick={handleMarkUnderReview}
            disabled={loading}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            En cours
          </button>
        )}

        {!isResolved && (
          <button
            onClick={() => setResolveOpen((v) => !v)}
            className="rounded-lg bg-[#0540FF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Resoudre
          </button>
        )}
      </div>

      {message && (
        <p className="text-xs text-red-500">{message}</p>
      )}

      {expanded && (
        <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{description}</p>
          </div>

          {bookingId && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">ID Reservation</p>
              <p className="text-xs font-mono text-gray-600">{bookingId}</p>
            </div>
          )}

          {reportedUserId && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Utilisateur signale</p>
              <p className="text-xs font-mono text-gray-600">{reportedUserId}</p>
            </div>
          )}

          {photos && photos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Photos</p>
              <div className="flex flex-wrap gap-2">
                {photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="h-16 w-16 rounded-lg object-cover border border-gray-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {resolveOpen && !isResolved && (
        <div className="mt-2 rounded-xl border border-gray-100 bg-white shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-[#1A1A2E]">Resoudre le litige</p>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Resolution *</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              placeholder="Decrire la decision prise..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Decision</label>
            <select
              value={resolveStatus}
              onChange={(e) => setResolveStatus(e.target.value as typeof resolveStatus)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
            >
              <option value="resolved_refunded">Rembourser</option>
              <option value="resolved_rejected">Rejeter</option>
              <option value="resolved_compensation">Compenser</option>
            </select>
          </div>

          {showRefundAmount && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Montant (EUR)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addStrike}
              onChange={(e) => setAddStrike(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#0540FF] focus:ring-[#0540FF]"
            />
            <span className="text-xs text-gray-700">Ajouter un strike a l&apos;hote</span>
          </label>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleResolve}
              disabled={loading}
              className="rounded-lg bg-[#0540FF] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'En cours...' : 'Confirmer'}
            </button>
            <button
              onClick={() => { setResolveOpen(false); setMessage(null) }}
              disabled={loading}
              className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
          </div>

          {message && (
            <p className="text-xs text-red-500">{message}</p>
          )}
        </div>
      )}
    </div>
  )
}

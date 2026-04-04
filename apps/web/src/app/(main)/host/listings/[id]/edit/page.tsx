'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '../../../../../../lib/trpc/client'

type SpotType = 'outdoor' | 'indoor' | 'garage' | 'covered' | 'underground'

interface FormData {
  title: string
  description: string
  amenities: string[]
  pricePerHour: string
  pricePerDay: string
  status: 'active' | 'inactive'
}

const AMENITIES = [
  { key: 'lighting', label: 'Éclairage', icon: '💡' },
  { key: 'security_camera', label: 'Caméra de sécurité', icon: '📷' },
  { key: 'covered', label: 'Couvert', icon: '🏠' },
  { key: 'ev_charging', label: 'Recharge électrique', icon: '⚡' },
  { key: 'disabled_access', label: 'Accès PMR', icon: '♿' },
  { key: '24h_access', label: 'Accès 24h/24', icon: '🕐' },
]

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    amenities: [],
    pricePerHour: '',
    pricePerDay: '',
    status: 'active',
  })
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const { data: spot, isLoading } = api.spots.byId.useQuery({ id }, { enabled: !!id })
  const updateSpot = api.spots.update.useMutation()

  useEffect(() => {
    if (spot) {
      setForm({
        title: spot.title,
        description: spot.description ?? '',
        amenities: (spot.amenities as string[]) ?? [],
        pricePerHour: String(spot.pricePerHour),
        pricePerDay: spot.pricePerDay ? String(spot.pricePerDay) : '',
        status: spot.status === 'active' ? 'active' : 'inactive',
      })
    }
  }, [spot])

  function update(fields: Partial<FormData>) {
    setForm((prev) => ({ ...prev, ...fields }))
    setError(null)
    setSaved(false)
  }

  function toggleAmenity(key: string) {
    update({
      amenities: form.amenities.includes(key)
        ? form.amenities.filter((a) => a !== key)
        : [...form.amenities, key],
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.title.trim().length < 5) {
      setError('Le titre doit faire au moins 5 caractères')
      return
    }
    if (!form.pricePerHour || Number(form.pricePerHour) <= 0) {
      setError('Le prix à l\'heure est requis')
      return
    }

    try {
      await updateSpot.mutateAsync({
        id,
        title: form.title,
        description: form.description || undefined,
        amenities: form.amenities,
        pricePerHour: Number(form.pricePerHour),
        pricePerDay: form.pricePerDay ? Number(form.pricePerDay) : undefined,
        status: form.status,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0540FF] border-t-transparent" />
      </div>
    )
  }

  if (!spot) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
        <p className="text-gray-500">Annonce introuvable</p>
        <Link href="/host/listings" className="text-sm font-medium text-[#0540FF] hover:underline">
          Retour aux annonces
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/host/listings"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0540FF]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Mes annonces
          </Link>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Modifier l&apos;annonce</h1>
          <p className="mt-1 text-sm text-gray-500">{spot.address}, {spot.city}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Status toggle */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-[#1A1A2E]">Statut de l&apos;annonce</h2>
              <div className="flex items-center gap-4">
                {(['active', 'inactive'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update({ status: s })}
                    className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all ${
                      form.status === s
                        ? s === 'active'
                          ? 'border-[#10B981] bg-emerald-50 text-[#10B981]'
                          : 'border-gray-300 bg-gray-50 text-gray-600'
                        : 'border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    {s === 'active' ? '● Active' : '○ Inactive'}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & description */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-[#1A1A2E]">Informations</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Titre de l&apos;annonce *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => update({ title: e.target.value })}
                    maxLength={100}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">{form.title.length}/100</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => update({ description: e.target.value })}
                    rows={4}
                    maxLength={1000}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">{form.description.length}/1000</p>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-[#1A1A2E]">Équipements</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AMENITIES.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => toggleAmenity(a.key)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                      form.amenities.includes(a.key)
                        ? 'border-[#0540FF] bg-blue-50 text-[#0540FF]'
                        : 'border-gray-100 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{a.icon}</span>
                    <span className="text-xs">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-[#1A1A2E]">Tarification</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Prix à l&apos;heure (€) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={form.pricePerHour}
                      onChange={(e) => update({ pricePerHour: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 py-3 pl-8 pr-4 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Vous recevrez{' '}
                    {form.pricePerHour
                      ? (Number(form.pricePerHour) * 0.8).toFixed(2).replace('.', ',')
                      : '—'}{' '}
                    € par heure (après frais de 20 %)
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Prix à la journée (€) — optionnel
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.pricePerDay}
                      onChange={(e) => update({ pricePerDay: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 py-3 pl-8 pr-4 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {saved && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                ✓ Modifications enregistrées avec succès
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Link
                href="/host/listings"
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={updateSpot.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0540FF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {updateSpot.isPending ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '../../../../../../lib/trpc/client'
import { createSupabaseBrowserClient } from '../../../../../../lib/supabase/client'

type SpotType = 'outdoor' | 'indoor' | 'garage' | 'covered' | 'underground'

interface FormData {
  title: string
  description: string
  amenities: string[]
  pricePerHour: string
  pricePerDay: string
  status: 'active' | 'inactive'
  photos: string[]
}

const AMENITIES = [
  { key: 'lighting', label: 'Eclairage', icon: '💡' },
  { key: 'security_camera', label: 'Camera de securite', icon: '📷' },
  { key: 'covered', label: 'Couvert', icon: '🏠' },
  { key: 'ev_charging', label: 'Recharge electrique', icon: '⚡' },
  { key: 'disabled_access', label: 'Acces PMR', icon: '♿' },
  { key: '24h_access', label: 'Acces 24h/24', icon: '🕐' },
]

const TYPE_LABELS: Record<string, string> = {
  outdoor: 'Exterieur',
  indoor: 'Interieur',
  garage: 'Garage',
  covered: 'Couvert',
  underground: 'Souterrain',
}

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
    photos: [],
  })
  const [uploading, setUploading] = useState(false)
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
        photos: (spot.photos as string[]) ?? [],
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

  async function handlePhotoUpload() {
    if (form.photos.length >= 5) {
      setError('Maximum 5 photos')
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp'
    input.multiple = true
    input.onchange = async () => {
      const files = Array.from(input.files ?? [])
      if (!files.length) return

      const remaining = 5 - form.photos.length
      const toUpload = files.slice(0, remaining)

      setUploading(true)
      try {
        const supabase = createSupabaseBrowserClient()
        const newUrls: string[] = []

        for (const file of toUpload) {
          if (file.size > 5 * 1024 * 1024) continue
          const ext = file.name.split('.').pop()
          const path = `spots/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error: uploadErr } = await supabase.storage.from('photos').upload(path, file)
          if (uploadErr) continue
          const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
          newUrls.push(publicUrl)
        }

        update({ photos: [...form.photos, ...newUrls] })
      } catch {
        setError('Erreur lors de l\'upload')
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  function removePhoto(idx: number) {
    update({ photos: form.photos.filter((_, i) => i !== idx) })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.title.trim().length < 5) {
      setError('Le titre doit faire au moins 5 caracteres')
      return
    }
    if (!form.pricePerHour || Number(form.pricePerHour) <= 0) {
      setError('Le prix a l\'heure est requis')
      return
    }

    try {
      await updateSpot.mutateAsync({
        id,
        title: form.title,
        description: form.description || undefined,
        amenities: form.amenities,
        photos: form.photos,
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
        <div className="mb-8">
          <Link href="/host/listings" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0540FF]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Mes annonces
          </Link>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Modifier l&apos;annonce</h1>
          <p className="mt-1 text-sm text-gray-500">{spot.address}, {spot.city} · {TYPE_LABELS[spot.type] ?? spot.type}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Status */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-[#1A1A2E]">Statut</h2>
              <div className="flex gap-3">
                {(['active', 'inactive'] as const).map((s) => (
                  <button key={s} type="button" onClick={() => update({ status: s })}
                    className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all ${
                      form.status === s
                        ? s === 'active' ? 'border-[#10B981] bg-emerald-50 text-[#10B981]' : 'border-gray-300 bg-gray-50 text-gray-600'
                        : 'border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    {s === 'active' ? 'Active' : 'Inactive'}
                  </button>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-[#1A1A2E]">Photos ({form.photos.length}/5)</h2>
                <button type="button" onClick={handlePhotoUpload} disabled={uploading || form.photos.length >= 5}
                  className="rounded-lg bg-[#0540FF] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {uploading ? 'Upload...' : '+ Ajouter'}
                </button>
              </div>
              {form.photos.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400">
                  Aucune photo — ajoutez-en pour attirer plus de conducteurs
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {form.photos.map((url, i) => (
                    <div key={i} className="group relative">
                      <img src={url} alt={`Photo ${i + 1}`} className="h-28 w-full rounded-xl object-cover" />
                      <button type="button" onClick={() => removePhoto(i)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title & description */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-[#1A1A2E]">Informations</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Titre *</label>
                  <input type="text" value={form.title} onChange={(e) => update({ title: e.target.value })} maxLength={100}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">{form.title.length}/100</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                  <textarea value={form.description} onChange={(e) => update({ description: e.target.value })} rows={4} maxLength={1000}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                  />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-[#1A1A2E]">Equipements</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AMENITIES.map((a) => (
                  <button key={a.key} type="button" onClick={() => toggleAmenity(a.key)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                      form.amenities.includes(a.key)
                        ? 'border-[#0540FF] bg-blue-50 text-[#0540FF]'
                        : 'border-gray-100 text-gray-600 hover:border-gray-300'
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Prix/heure (EUR) *</label>
                  <input type="number" min="0.5" step="0.5" value={form.pricePerHour}
                    onChange={(e) => update({ pricePerHour: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Net: {form.pricePerHour ? (Number(form.pricePerHour) * 0.8).toFixed(2) : '—'} EUR/h
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Prix/jour (EUR)</label>
                  <input type="number" min="1" step="1" value={form.pricePerDay}
                    onChange={(e) => update({ pricePerDay: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                  />
                </div>
              </div>
            </div>

            {/* Availability link */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-[#1A1A2E]">Disponibilites</h2>
                  <p className="mt-1 text-xs text-gray-500">Gerez vos creneaux disponibles et bloques</p>
                </div>
                <Link href="/host/availability" className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200">
                  Gerer
                </Link>
              </div>
            </div>

            {/* Planning link */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-[#1A1A2E]">Planning des reservations</h2>
                  <p className="mt-1 text-xs text-gray-500">Voir les reservations a venir pour cette place</p>
                </div>
                <Link href={`/host/planning?spot=${id}`} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200">
                  Voir
                </Link>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            {saved && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Modifications enregistrees
              </div>
            )}

            <div className="flex items-center justify-between">
              <Link href="/host/listings" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Annuler
              </Link>
              <button type="submit" disabled={updateSpot.isPending}
                className="rounded-xl bg-[#0540FF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {updateSpot.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

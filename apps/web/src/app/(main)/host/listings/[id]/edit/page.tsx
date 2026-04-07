'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '../../../../../../lib/trpc/client'
import { useRequireHost } from '../../../../../../lib/use-require-host'
import { createSupabaseBrowserClient } from '../../../../../../lib/supabase/client'

type SpotType = 'outdoor' | 'indoor' | 'garage' | 'covered' | 'underground'
type SizeCategory = 'motorcycle' | 'compact' | 'sedan' | 'suv' | 'van'
type CancellationPolicy = 'flexible' | 'moderate' | 'strict'

interface FormData {
  title: string
  description: string
  amenities: string[]
  pricePerHour: string
  pricePerDay: string
  status: 'active' | 'inactive'
  photos: string[]
  parkingInstructions: string
  // dimensions & compatibility
  width: string
  length: string
  sizeCategory: SizeCategory
  cancellationPolicy: CancellationPolicy
  // access instructions
  accessInstructions: string
  accessPhotos: string[]
  floorNumber: string
  spotNumber: string
  buildingCode: string
  gpsPinLat: string
  gpsPinLng: string
  ownershipProofUrl: string
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

const SIZE_CATEGORIES: { value: SizeCategory; label: string; icon: string }[] = [
  { value: 'motorcycle', label: 'Moto', icon: '🏍️' },
  { value: 'compact', label: 'Citadine', icon: '🚗' },
  { value: 'sedan', label: 'Berline', icon: '🚘' },
  { value: 'suv', label: 'SUV', icon: '🚙' },
  { value: 'van', label: 'Utilitaire', icon: '🚐' },
]

const CANCELLATION_POLICIES: { value: CancellationPolicy; label: string; desc: string }[] = [
  {
    value: 'flexible',
    label: 'Flexible',
    desc: "Remboursement intégral jusqu'à 2h avant. 50% après.",
  },
  {
    value: 'moderate',
    label: 'Modérée',
    desc: "Remboursement intégral jusqu'à 24h avant. 50% entre 2-24h. Aucun après.",
  },
  {
    value: 'strict',
    label: 'Stricte',
    desc: "Remboursement intégral jusqu'à 48h avant. 50% entre 24-48h. Aucun après.",
  },
]

export default function EditListingPage() {
  useRequireHost()
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
    parkingInstructions: '',
    width: '',
    length: '',
    sizeCategory: 'sedan',
    cancellationPolicy: 'flexible',
    accessInstructions: '',
    accessPhotos: [],
    floorNumber: '',
    spotNumber: '',
    buildingCode: '',
    gpsPinLat: '',
    gpsPinLng: '',
    ownershipProofUrl: '',
  })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const { data: spot, isLoading } = api.spots.byId.useQuery({ id }, { enabled: !!id })
  const updateSpot = api.spots.update.useMutation()

  useEffect(() => {
    if (spot) {
      const s = spot as Record<string, unknown>
      setForm({
        title: spot.title,
        description: spot.description ?? '',
        amenities: (spot.amenities as string[]) ?? [],
        pricePerHour: String(spot.pricePerHour),
        pricePerDay: spot.pricePerDay ? String(spot.pricePerDay) : '',
        status: spot.status === 'active' ? 'active' : 'inactive',
        photos: (spot.photos as string[]) ?? [],
        parkingInstructions: (s.parkingInstructions as string) ?? '',
        width: s.width ? String(s.width) : '',
        length: s.length ? String(s.length) : '',
        sizeCategory: (s.sizeCategory as SizeCategory) ?? 'sedan',
        cancellationPolicy: (s.cancellationPolicy as CancellationPolicy) ?? 'flexible',
        accessInstructions: (s.accessInstructions as string) ?? '',
        accessPhotos: (s.accessPhotos as string[]) ?? [],
        floorNumber: (s.floorNumber as string) ?? '',
        spotNumber: (s.spotNumber as string) ?? '',
        buildingCode: (s.buildingCode as string) ?? '',
        gpsPinLat: s.gpsPinLat ? String(s.gpsPinLat) : '',
        gpsPinLng: s.gpsPinLng ? String(s.gpsPinLng) : '',
        ownershipProofUrl: (s.ownershipProofUrl as string) ?? '',
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
        const MAX_SIZE = 5 * 1024 * 1024
        const skipped: string[] = []

        for (const file of toUpload) {
          if (file.size > MAX_SIZE) { skipped.push(file.name); continue }
          const ext = file.name.split('.').pop()
          const path = `spots/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error: uploadErr } = await supabase.storage.from('spot-photos').upload(path, file)
          if (uploadErr) continue
          const { data: { publicUrl } } = supabase.storage.from('spot-photos').getPublicUrl(path)
          newUrls.push(publicUrl)
        }

        if (skipped.length) alert(`Fichiers trop volumineux (max 5 Mo) : ${skipped.join(', ')}`)
        update({ photos: [...form.photos, ...newUrls] })
      } catch {
        setError("Erreur lors de l'upload")
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  function removePhoto(idx: number) {
    update({ photos: form.photos.filter((_, i) => i !== idx) })
  }

  function addAccessPhoto() {
    if (form.accessPhotos.length >= 10) return
    update({ accessPhotos: [...form.accessPhotos, ''] })
  }

  function updateAccessPhoto(idx: number, value: string) {
    const updated = form.accessPhotos.map((p, i) => (i === idx ? value : p))
    update({ accessPhotos: updated })
  }

  function removeAccessPhoto(idx: number) {
    update({ accessPhotos: form.accessPhotos.filter((_, i) => i !== idx) })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.title.trim().length < 5) {
      setError('Le titre doit faire au moins 5 caracteres')
      return
    }
    if (!form.pricePerHour || Number(form.pricePerHour) <= 0) {
      setError("Le prix a l'heure est requis")
      return
    }
    for (const url of form.accessPhotos) {
      if (url && !url.startsWith('https://')) {
        setError("Les URLs de photos d'accès doivent commencer par https://")
        return
      }
    }
    if (form.ownershipProofUrl && !form.ownershipProofUrl.startsWith('https://')) {
      setError("L'URL du justificatif doit commencer par https://")
      return
    }

    try {
      await updateSpot.mutateAsync({
        id,
        title: form.title,
        description: form.description || undefined,
        amenities: form.amenities,
        photos: form.photos,
        parkingInstructions: form.parkingInstructions || undefined,
        pricePerHour: Number(form.pricePerHour),
        pricePerDay: form.pricePerDay ? Number(form.pricePerDay) : undefined,
        status: form.status,
        width: form.width ? Number(form.width) : undefined,
        length: form.length ? Number(form.length) : undefined,
        sizeCategory: form.sizeCategory,
        cancellationPolicy: form.cancellationPolicy,
        accessInstructions: form.accessInstructions || undefined,
        accessPhotos: form.accessPhotos.filter((url) => url.startsWith('https://')),
        floorNumber: form.floorNumber || undefined,
        spotNumber: form.spotNumber || undefined,
        buildingCode: form.buildingCode || undefined,
        gpsPinLat: form.gpsPinLat ? Number(form.gpsPinLat) : undefined,
        gpsPinLng: form.gpsPinLng ? Number(form.gpsPinLng) : undefined,
        ownershipProofUrl: form.ownershipProofUrl || undefined,
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

            {/* Dimensions & Compatibility */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-[#1A1A2E]">Dimensions &amp; Compatibilité</h2>

              {/* Width & Length */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Largeur (m)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={form.width}
                    onChange={(e) => update({ width: e.target.value })}
                    placeholder="2.5"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Longueur (m)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="0.1"
                    value={form.length}
                    onChange={(e) => update({ length: e.target.value })}
                    placeholder="5.0"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                  />
                </div>
              </div>
              <p className="mb-5 text-xs text-gray-400">
                Renseigner les dimensions aide les conducteurs à vérifier la compatibilité
              </p>

              {/* Size category */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">Catégorie de véhicule max</label>
                <div className="flex flex-wrap gap-2">
                  {SIZE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => update({ sizeCategory: cat.value })}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm transition-all ${
                        form.sizeCategory === cat.value
                          ? 'border-[#0540FF] bg-blue-50 text-[#0540FF]'
                          : 'border-gray-100 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cancellation policy */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Politique d&apos;annulation</label>
                <div className="space-y-2">
                  {CANCELLATION_POLICIES.map((policy) => (
                    <button
                      key={policy.value}
                      type="button"
                      onClick={() => update({ cancellationPolicy: policy.value })}
                      className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        form.cancellationPolicy === policy.value
                          ? 'border-[#0540FF] bg-blue-50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        form.cancellationPolicy === policy.value ? 'border-[#0540FF] bg-[#0540FF]' : 'border-gray-300'
                      }`}>
                        {form.cancellationPolicy === policy.value && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A2E]">{policy.label}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{policy.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Parking instructions (legacy field) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-[#1A1A2E]">Instructions d&apos;acces (résumé)</h2>
              <p className="mb-2 text-xs text-gray-500">Etage, code portail, numero de place, consignes...</p>
              <textarea
                value={form.parkingInstructions}
                onChange={(e) => update({ parkingInstructions: e.target.value })}
                rows={3}
                maxLength={500}
                placeholder="Ex: 2eme sous-sol, place 42. Code portail: 1234. Tourner a droite apres l'entree."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
              />
            </div>

            {/* Access instructions */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-1 font-semibold text-[#1A1A2E]">Instructions d&apos;accès détaillées</h2>
              <p className="mb-4 text-xs text-gray-500">Partagées uniquement avec les conducteurs ayant une réservation confirmée</p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Comment accéder à la place ?</label>
                  <textarea
                    value={form.accessInstructions}
                    onChange={(e) => update({ accessInstructions: e.target.value })}
                    rows={4}
                    maxLength={2000}
                    placeholder="Ex: Entrez par le portail principal, code 1234. Prenez l'ascenseur au sous-sol -1. La place est numérotée B12 sur le mur."
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">{form.accessInstructions.length}/2000</p>
                </div>

                {/* Building details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Étage / Niveau</label>
                    <input
                      type="text"
                      value={form.floorNumber}
                      onChange={(e) => update({ floorNumber: e.target.value })}
                      placeholder="-1, RDC, 2"
                      maxLength={10}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">N° de place</label>
                    <input
                      type="text"
                      value={form.spotNumber}
                      onChange={(e) => update({ spotNumber: e.target.value })}
                      placeholder="B12, 47"
                      maxLength={20}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Code d&apos;accès immeuble <span className="font-normal text-gray-400">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={form.buildingCode}
                    onChange={(e) => update({ buildingCode: e.target.value })}
                    placeholder="1234"
                    maxLength={20}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                  />
                </div>

                {/* Access photos */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Photos d&apos;accès <span className="font-normal text-gray-400">(entrée, escalier, place)</span>
                    </label>
                    <button
                      type="button"
                      onClick={addAccessPhoto}
                      disabled={form.accessPhotos.length >= 10}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40"
                    >
                      + Ajouter
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.accessPhotos.map((url, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => updateAccessPhoto(idx, e.target.value)}
                          placeholder="https://..."
                          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                        />
                        <button
                          type="button"
                          onClick={() => removeAccessPhoto(idx)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {form.accessPhotos.length === 0 && (
                      <p className="text-xs text-gray-400">Aucune photo d&apos;accès — optionnel mais recommandé</p>
                    )}
                    <p className="text-xs text-gray-400">{form.accessPhotos.length}/10 photos</p>
                  </div>
                </div>

                {/* GPS pin */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Position GPS exacte de l&apos;entrée <span className="font-normal text-gray-400">(optionnel)</span>
                  </label>
                  <p className="mb-2 text-xs text-gray-400">Aidez les conducteurs à trouver l&apos;entrée facilement</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Latitude</label>
                      <input
                        type="number"
                        min="-90"
                        max="90"
                        step="0.00001"
                        value={form.gpsPinLat}
                        onChange={(e) => update({ gpsPinLat: e.target.value })}
                        placeholder="43.70314"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Longitude</label>
                      <input
                        type="number"
                        min="-180"
                        max="180"
                        step="0.00001"
                        value={form.gpsPinLng}
                        onChange={(e) => update({ gpsPinLng: e.target.value })}
                        placeholder="7.26608"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                      />
                    </div>
                  </div>
                </div>

                {/* Ownership proof */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Justificatif de propriété / bail
                  </label>
                  <p className="mb-2 text-xs text-gray-400">
                    Titre de propriété, bail, ou appel de charges (requis pour la vérification)
                  </p>
                  <input
                    type="url"
                    value={form.ownershipProofUrl}
                    onChange={(e) => update({ ownershipProofUrl: e.target.value })}
                    placeholder="https://..."
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

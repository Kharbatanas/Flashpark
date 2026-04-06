'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../../../lib/trpc/client'
import { useRequireHost } from '../../../../../lib/use-require-host'
import { createSupabaseBrowserClient } from '../../../../../lib/supabase/client'
import { AddressAutocomplete, type AddressResult } from '../../../../../components/address-autocomplete'

// ───────────────── Types ─────────────────
type SpotType = 'outdoor' | 'indoor' | 'garage' | 'covered' | 'underground'

interface FormData {
  type: SpotType | null
  address: string
  city: string
  latitude: number | null
  longitude: number | null
  title: string
  description: string
  amenities: string[]
  photos: string[]
  pricePerHour: string
  pricePerDay: string
  instantBook: boolean
  hasSmartGate: boolean
  maxVehicleHeight: string
}

const TOTAL_STEPS = 6

// ───────────────── Step 1: Type ─────────────────
const TYPES: { value: SpotType; label: string; icon: string; desc: string }[] = [
  { value: 'outdoor', label: 'Extérieur', icon: '🌤️', desc: 'Place en plein air, sans couverture' },
  { value: 'indoor', label: 'Intérieur', icon: '🏢', desc: 'Place dans un bâtiment fermé' },
  { value: 'garage', label: 'Garage', icon: '🏠', desc: 'Box garage individuel' },
  { value: 'covered', label: 'Couvert', icon: '⛱️', desc: 'Place abritée mais ouverte' },
  { value: 'underground', label: 'Souterrain', icon: '🚇', desc: 'Parking sous-terrain' },
]

function Step1({ data, onChange }: { data: FormData; onChange: (v: SpotType) => void }) {
  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-[#1A1A2E]">Type de place</h2>
      <p className="mb-6 text-sm text-gray-500">Quel type de parking proposez-vous ?</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
              data.type === t.value
                ? 'border-[#0540FF] bg-blue-50'
                : 'border-gray-100 bg-white hover:border-[#0540FF]/30 hover:bg-gray-50'
            }`}
          >
            <span className="text-3xl">{t.icon}</span>
            <div>
              <p className="font-semibold text-[#1A1A2E]">{t.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ───────────────── Step 2: Location ─────────────────
function Step2({
  data,
  onChange,
}: {
  data: FormData
  onChange: (fields: Partial<FormData>) => void
}) {
  function handleAddressSelect(result: AddressResult) {
    onChange({
      address: result.address,
      city: result.city,
      latitude: result.latitude,
      longitude: result.longitude,
    })
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-[#1A1A2E]">Localisation</h2>
      <p className="mb-6 text-sm text-gray-500">Indiquez l&apos;adresse exacte de votre place</p>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Adresse complète *</label>
          <AddressAutocomplete
            onSelect={handleAddressSelect}
            defaultValue={data.address}
          />
        </div>

        {/* City — auto-filled, editable */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Ville *</label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Remplie automatiquement"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
          />
        </div>

        {/* Lat/Lng — read-only, auto-filled */}
        {data.latitude && data.longitude && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            Position enregistree : {data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}
          </div>
        )}
      </div>
    </div>
  )
}

// ───────────────── Step 3: Details ─────────────────
const AMENITIES = [
  { key: 'lighting', label: 'Éclairage', icon: '💡' },
  { key: 'security_camera', label: 'Caméra de sécurité', icon: '📷' },
  { key: 'covered', label: 'Couvert', icon: '🏠' },
  { key: 'ev_charging', label: 'Recharge électrique', icon: '⚡' },
  { key: 'disabled_access', label: 'Accès PMR', icon: '♿' },
  { key: '24h_access', label: 'Accès 24h/24', icon: '🕐' },
]

function Step3({
  data,
  onChange,
}: {
  data: FormData
  onChange: (fields: Partial<FormData>) => void
}) {
  function toggleAmenity(key: string) {
    const current = data.amenities
    onChange({
      amenities: current.includes(key) ? current.filter((a) => a !== key) : [...current, key],
    })
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-[#1A1A2E]">Détails de la place</h2>
      <p className="mb-6 text-sm text-gray-500">Décrivez votre place pour attirer les conducteurs</p>
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Titre de l&apos;annonce *</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Place de parking sécurisée centre-ville Nice"
            maxLength={100}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{data.title.length}/100</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={4}
            maxLength={1000}
            placeholder="Décrivez l'emplacement, l'accès, les particularités..."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF] resize-none"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{data.description.length}/1000</p>
        </div>
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700">Équipements</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AMENITIES.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => toggleAmenity(a.key)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                  data.amenities.includes(a.key)
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange({ hasSmartGate: !data.hasSmartGate })}
            className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors ${data.hasSmartGate ? 'bg-[#0540FF]' : 'bg-gray-200'}`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${data.hasSmartGate ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
          <span className="text-sm text-gray-700">Ma place est équipée d&apos;un Smart Gate</span>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Hauteur maximale (m) — optionnel
          </label>
          <input
            type="number"
            min="1"
            max="5"
            step="0.1"
            value={data.maxVehicleHeight}
            onChange={(e) => onChange({ maxVehicleHeight: e.target.value })}
            placeholder="2.0"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
          />
          <p className="mt-1 text-xs text-gray-400">Laissez vide si aucune restriction de hauteur</p>
        </div>
      </div>
    </div>
  )
}

// ───────────────── Step 4: Photos ─────────────────
function Step4Photos({
  data,
  onChange,
}: {
  data: FormData
  onChange: (fields: Partial<FormData>) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createSupabaseBrowserClient()

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)

    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Chaque photo doit faire moins de 5 Mo')
        continue
      }
      const ext = file.name.split('.').pop()
      const path = `spots/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('spot-photos').upload(path, file, { upsert: false })
      if (error) {
        setUploadError(`Erreur upload : ${error.message}`)
        continue
      }
      const { data: urlData } = supabase.storage.from('spot-photos').getPublicUrl(path)
      newUrls.push(urlData.publicUrl)
    }

    onChange({ photos: [...data.photos, ...newUrls] })
    setUploading(false)
  }

  function removePhoto(url: string) {
    onChange({ photos: data.photos.filter((p) => p !== url) })
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-[#1A1A2E]">Photos</h2>
      <p className="mb-6 text-sm text-gray-500">
        Ajoutez jusqu&apos;à 5 photos de votre place (optionnel mais recommandé)
      </p>

      {/* Upload zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || data.photos.length >= 5}
        className="mb-4 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 transition hover:border-[#0540FF] hover:bg-blue-50/30 disabled:opacity-50"
      >
        {uploading ? (
          <svg className="h-6 w-6 animate-spin text-[#0540FF]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        <span className="text-sm font-medium text-gray-500">
          {uploading ? 'Upload en cours...' : data.photos.length >= 5 ? '5 photos maximum atteint' : 'Cliquez pour ajouter des photos'}
        </span>
        <span className="text-xs text-gray-400">JPG, PNG, WEBP · 5 Mo max · {data.photos.length}/5</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploadError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {uploadError}
        </p>
      )}

      {/* Preview grid */}
      {data.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {data.photos.map((url, i) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
              <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ───────────────── Step 5: Pricing ─────────────────
function Step5({
  data,
  onChange,
}: {
  data: FormData
  onChange: (fields: Partial<FormData>) => void
}) {
  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-[#1A1A2E]">Tarification</h2>
      <p className="mb-6 text-sm text-gray-500">Fixez vos prix et vos préférences de réservation</p>
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Prix à l&apos;heure (€) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={data.pricePerHour}
              onChange={(e) => onChange({ pricePerHour: e.target.value })}
              placeholder="3.50"
              className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Vous recevrez {data.pricePerHour ? (Number(data.pricePerHour) * 0.8).toFixed(2).replace('.', ',') : '—'} € par heure (après frais de 20 %)
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Prix à la journée (€) — optionnel
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
            <input
              type="number"
              min="1"
              step="1"
              value={data.pricePerDay}
              onChange={(e) => onChange({ pricePerDay: e.target.value })}
              placeholder="25"
              className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
            />
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Réservation instantanée</p>
              <p className="mt-0.5 text-xs text-gray-400">
                Les conducteurs peuvent réserver sans votre approbation
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ instantBook: !data.instantBook })}
              className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors ${data.instantBook ? 'bg-[#0540FF]' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${data.instantBook ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ───────────────── Step 6: Review ─────────────────
function Step6({ data }: { data: FormData }) {
  const typeLabel = TYPES.find((t) => t.value === data.type)?.label ?? data.type

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-[#1A1A2E]">Récapitulatif</h2>
      <p className="mb-6 text-sm text-gray-500">Vérifiez les informations avant de publier</p>
      <div className="space-y-3">
        {[
          { label: 'Type', value: typeLabel },
          { label: 'Adresse', value: `${data.address}, ${data.city}` },
          {
            label: 'Coordonnées',
            value: data.latitude && data.longitude ? `${data.latitude?.toFixed(5)}, ${data.longitude?.toFixed(5)}` : '—',
          },
          { label: 'Titre', value: data.title },
          { label: 'Description', value: data.description || '—' },
          { label: 'Équipements', value: data.amenities.join(', ') || '—' },
          { label: 'Photos', value: data.photos.length > 0 ? `${data.photos.length} photo(s)` : 'Aucune' },
          { label: 'Prix/heure', value: data.pricePerHour ? `${Number(data.pricePerHour).toFixed(2).replace('.', ',')} €` : '—' },
          { label: 'Prix/jour', value: data.pricePerDay ? `${Number(data.pricePerDay).toFixed(2).replace('.', ',')} €` : '—' },
          { label: 'Hauteur max', value: data.maxVehicleHeight ? `${Number(data.maxVehicleHeight).toFixed(1)} m` : '—' },
          { label: 'Smart Gate', value: data.hasSmartGate ? 'Oui' : 'Non' },
          { label: 'Réservation instantanée', value: data.instantBook ? 'Oui' : 'Non' },
        ].map(({ label, value }) => (
          <div key={label} className="flex gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3">
            <span className="w-40 flex-shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wide pt-0.5">
              {label}
            </span>
            <span className="text-sm text-[#1A1A2E]">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
        Votre annonce sera soumise à révision avant d&apos;être publiée. Ce processus prend généralement quelques heures.
      </div>
    </div>
  )
}

// ───────────────── Main Component ─────────────────
const INITIAL_DATA: FormData = {
  type: null,
  address: '',
  city: '',
  latitude: null,
  longitude: null,
  title: '',
  description: '',
  amenities: [],
  photos: [],
  pricePerHour: '',
  pricePerDay: '',
  instantBook: true,
  hasSmartGate: false,
  maxVehicleHeight: '',
}

function validateStep(step: number, data: FormData): string | null {
  if (step === 1 && !data.type) return 'Veuillez sélectionner un type de place'
  if (step === 2) {
    if (data.address.trim().length < 5) return "L'adresse doit faire au moins 5 caractères"
    if (!data.city.trim()) return 'La ville est requise'
    if (!data.latitude || !data.longitude) return 'Les coordonnées GPS sont requises'
  }
  if (step === 3 && data.title.trim().length < 5) return 'Le titre doit faire au moins 5 caractères'
  // step 4 = photos, optional — no validation
  if (step === 5 && (!data.pricePerHour || Number(data.pricePerHour) <= 0))
    return 'Le prix à l\'heure est requis'
  return null
}

export default function NewListingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>(INITIAL_DATA)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useRequireHost()

  const createSpot = api.spots.create.useMutation()

  function update(fields: Partial<FormData>) {
    setData((prev) => ({ ...prev, ...fields }))
    setError(null)
  }

  function handleNext() {
    const err = validateStep(step, data)
    if (err) { setError(err); return }
    setError(null)
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function handleBack() {
    setError(null)
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    const err = validateStep(step, data)
    if (err) { setError(err); return }

    setSubmitting(true)
    setError(null)

    try {
      await createSpot.mutateAsync({
        type: data.type!,
        address: data.address,
        city: data.city,
        latitude: data.latitude!,
        longitude: data.longitude!,
        title: data.title,
        description: data.description || undefined,
        amenities: data.amenities,
        photos: data.photos,
        pricePerHour: Number(data.pricePerHour),
        pricePerDay: data.pricePerDay ? Number(data.pricePerDay) : undefined,
        instantBook: data.instantBook,
        hasSmartGate: data.hasSmartGate,
        maxVehicleHeight: data.maxVehicleHeight ? Number(data.maxVehicleHeight) : undefined,
      })
      router.push('/host/listings')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 pb-24 md:py-8 md:pb-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Nouvelle annonce</h1>
          <p className="mt-1 text-sm text-gray-500">Étape {step} sur {TOTAL_STEPS}</p>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-[#0540FF] transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {step === 1 && <Step1 data={data} onChange={(v) => update({ type: v })} />}
          {step === 2 && <Step2 data={data} onChange={update} />}
          {step === 3 && <Step3 data={data} onChange={update} />}
          {step === 4 && <Step4Photos data={data} onChange={update} />}
          {step === 5 && <Step5 data={data} onChange={update} />}
          {step === 6 && <Step6 data={data} />}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Précédent
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0540FF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Suivant
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors"
              >
                {submitting ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Publier l&apos;annonce
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

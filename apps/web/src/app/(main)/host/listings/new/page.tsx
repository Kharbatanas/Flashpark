'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../../../lib/trpc/client'
import { useRequireHost } from '../../../../../lib/use-require-host'
import { createSupabaseBrowserClient } from '../../../../../lib/supabase/client'
import { AddressAutocomplete, type AddressResult } from '../../../../../components/address-autocomplete'

// ───────────────── Types ─────────────────
type SpotType = 'outdoor' | 'indoor' | 'garage' | 'covered' | 'underground'
type SizeCategory = 'motorcycle' | 'compact' | 'sedan' | 'suv' | 'van'
type CancellationPolicy = 'flexible' | 'moderate' | 'strict'

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
  // dimensions & compatibility
  width: string
  length: string
  sizeCategory: SizeCategory
  cancellationPolicy: CancellationPolicy
  // access instructions
  accessInstructions: string
  floorNumber: string
  spotNumber: string
  buildingCode: string
  accessPhotos: string[]
  gpsPinLat: string
  gpsPinLng: string
  ownershipProofUrl: string
}

const TOTAL_STEPS = 7

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

  const IMAGE_SIGNATURES: Array<{ mime: string; bytes: number[] }> = [
    { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
    { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47] },
    { mime: 'image/gif', bytes: [0x47, 0x49, 0x46] },
    { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
  ]

  const SAFE_EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  }

  async function isValidImage(file: File): Promise<boolean> {
    const buffer = await file.slice(0, 12).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    return IMAGE_SIGNATURES.some(sig =>
      sig.bytes.every((b, i) => bytes[i] === b)
    )
  }

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
      const valid = await isValidImage(file)
      if (!valid) {
        setUploadError('Format de fichier invalide. Seuls JPEG, PNG, GIF et WebP sont acceptes.')
        continue
      }
      const ext = SAFE_EXTENSIONS[file.type] ?? 'jpg'
      const path = `spots/${Date.now()}-${crypto.randomUUID()}.${ext}`
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

// ───────────────── Step 5: Dimensions & Compatibilité + Instructions d'accès ─────────────────

const SIZE_CATEGORIES: { value: SizeCategory; label: string; icon: string; desc: string }[] = [
  { value: 'motorcycle', label: 'Moto', icon: '🏍️', desc: 'Moto uniquement' },
  { value: 'compact', label: 'Citadine', icon: '🚗', desc: 'Petite voiture' },
  { value: 'sedan', label: 'Berline', icon: '🚘', desc: 'Véhicule standard' },
  { value: 'suv', label: 'SUV', icon: '🚙', desc: 'Grand SUV / 4x4' },
  { value: 'van', label: 'Utilitaire', icon: '🚐', desc: 'Van / utilitaire' },
]

const CANCELLATION_POLICIES: {
  value: CancellationPolicy
  label: string
  desc: string
}[] = [
  {
    value: 'flexible',
    label: 'Flexible',
    desc: 'Remboursement intégral jusqu\'à 2h avant. 50% après.',
  },
  {
    value: 'moderate',
    label: 'Modérée',
    desc: 'Remboursement intégral jusqu\'à 24h avant. 50% entre 2-24h. Aucun après.',
  },
  {
    value: 'strict',
    label: 'Stricte',
    desc: 'Remboursement intégral jusqu\'à 48h avant. 50% entre 24-48h. Aucun après.',
  },
]

function Step5DimensionsAccess({
  data,
  onChange,
}: {
  data: FormData
  onChange: (fields: Partial<FormData>) => void
}) {
  function addAccessPhoto() {
    if (data.accessPhotos.length >= 10) return
    onChange({ accessPhotos: [...data.accessPhotos, ''] })
  }

  function updateAccessPhoto(idx: number, value: string) {
    const updated = data.accessPhotos.map((p, i) => (i === idx ? value : p))
    onChange({ accessPhotos: updated })
  }

  function removeAccessPhoto(idx: number) {
    onChange({ accessPhotos: data.accessPhotos.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-xl font-bold text-[#1A1A2E]">Dimensions &amp; Compatibilité</h2>
        <p className="mb-6 text-sm text-gray-500">
          Renseigner les dimensions aide les conducteurs à vérifier la compatibilité
        </p>

        {/* Dimensions */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Largeur (m)</label>
              <input
                type="number"
                min="1"
                max="10"
                step="0.1"
                value={data.width}
                onChange={(e) => onChange({ width: e.target.value })}
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
                value={data.length}
                onChange={(e) => onChange({ length: e.target.value })}
                placeholder="5.0"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">Optionnel — hauteur max déjà renseignée à l&apos;étape précédente</p>
        </div>

        {/* Size category */}
        <div className="mt-5">
          <label className="mb-3 block text-sm font-medium text-gray-700">Catégorie de véhicule max</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SIZE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => onChange({ sizeCategory: cat.value })}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  data.sizeCategory === cat.value
                    ? 'border-[#0540FF] bg-blue-50'
                    : 'border-gray-100 bg-white hover:border-[#0540FF]/30 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A2E]">{cat.label}</p>
                  <p className="text-xs text-gray-400">{cat.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cancellation policy */}
        <div className="mt-5">
          <label className="mb-3 block text-sm font-medium text-gray-700">Politique d&apos;annulation</label>
          <div className="space-y-2">
            {CANCELLATION_POLICIES.map((policy) => (
              <button
                key={policy.value}
                type="button"
                onClick={() => onChange({ cancellationPolicy: policy.value })}
                className={`flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  data.cancellationPolicy === policy.value
                    ? 'border-[#0540FF] bg-blue-50'
                    : 'border-gray-100 bg-white hover:border-[#0540FF]/30 hover:bg-gray-50'
                }`}
              >
                <div className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                  data.cancellationPolicy === policy.value
                    ? 'border-[#0540FF] bg-[#0540FF]'
                    : 'border-gray-300'
                }`}>
                  {data.cancellationPolicy === policy.value && (
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

      {/* ── Instructions d'accès ── */}
      <div className="border-t border-gray-100 pt-8">
        <h2 className="mb-2 text-xl font-bold text-[#1A1A2E]">Instructions d&apos;accès</h2>
        <p className="mb-6 text-sm text-gray-500">Partagées uniquement avec les conducteurs ayant une réservation confirmée</p>

        {/* Access instructions textarea */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Comment accéder à la place ?</label>
            <textarea
              value={data.accessInstructions}
              onChange={(e) => onChange({ accessInstructions: e.target.value })}
              rows={4}
              maxLength={2000}
              placeholder="Ex: Entrez par le portail principal, code 1234. Prenez l'ascenseur au sous-sol -1. La place est numérotée B12 sur le mur."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{data.accessInstructions.length}/2000</p>
          </div>

          {/* Building details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Étage / Niveau</label>
              <input
                type="text"
                value={data.floorNumber}
                onChange={(e) => onChange({ floorNumber: e.target.value })}
                placeholder="-1, RDC, 2"
                maxLength={10}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">N° de place</label>
              <input
                type="text"
                value={data.spotNumber}
                onChange={(e) => onChange({ spotNumber: e.target.value })}
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
              value={data.buildingCode}
              onChange={(e) => onChange({ buildingCode: e.target.value })}
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
                disabled={data.accessPhotos.length >= 10}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40"
              >
                + Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {data.accessPhotos.map((url, idx) => (
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
              {data.accessPhotos.length === 0 && (
                <p className="text-xs text-gray-400">Aucune photo d&apos;accès ajoutée — optionnel mais recommandé</p>
              )}
              <p className="text-xs text-gray-400">{data.accessPhotos.length}/10 photos</p>
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
                  value={data.gpsPinLat}
                  onChange={(e) => onChange({ gpsPinLat: e.target.value })}
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
                  value={data.gpsPinLng}
                  onChange={(e) => onChange({ gpsPinLng: e.target.value })}
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
              value={data.ownershipProofUrl}
              onChange={(e) => onChange({ ownershipProofUrl: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ───────────────── Step 6: Pricing ─────────────────
function Step6Pricing({
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

// ───────────────── Step 7: Review ─────────────────
const SIZE_LABELS: Record<SizeCategory, string> = {
  motorcycle: 'Moto',
  compact: 'Citadine',
  sedan: 'Berline',
  suv: 'SUV',
  van: 'Utilitaire',
}

const POLICY_LABELS: Record<CancellationPolicy, string> = {
  flexible: 'Flexible',
  moderate: 'Modérée',
  strict: 'Stricte',
}

function Step7Review({ data }: { data: FormData }) {
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
          {
            label: 'Dimensions',
            value: data.width && data.length
              ? `${data.width} m × ${data.length} m`
              : data.width ? `Largeur ${data.width} m` : data.length ? `Longueur ${data.length} m` : '—',
          },
          { label: 'Catégorie max', value: SIZE_LABELS[data.sizeCategory] },
          { label: 'Annulation', value: POLICY_LABELS[data.cancellationPolicy] },
          { label: 'Étage', value: data.floorNumber || '—' },
          { label: 'N° place', value: data.spotNumber || '—' },
          { label: 'Code accès', value: data.buildingCode || '—' },
          {
            label: 'Photos accès',
            value: data.accessPhotos.filter(Boolean).length > 0
              ? `${data.accessPhotos.filter(Boolean).length} photo(s)`
              : 'Aucune',
          },
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
  width: '',
  length: '',
  sizeCategory: 'sedan',
  cancellationPolicy: 'flexible',
  accessInstructions: '',
  floorNumber: '',
  spotNumber: '',
  buildingCode: '',
  accessPhotos: [],
  gpsPinLat: '',
  gpsPinLng: '',
  ownershipProofUrl: '',
}

function validateStep(step: number, data: FormData): string | null {
  if (step === 1 && !data.type) return 'Veuillez sélectionner un type de place'
  if (step === 2) {
    if (data.address.trim().length < 5) return "L'adresse doit faire au moins 5 caractères"
    if (!data.city.trim()) return 'La ville est requise'
    if (!data.latitude || !data.longitude) return 'Les coordonnées GPS sont requises'
  }
  if (step === 3 && data.title.trim().length < 5) return 'Le titre doit faire au moins 5 caractères'
  if (step === 5) {
    // Validate access photo URLs — they must be https if non-empty
    for (const url of data.accessPhotos) {
      if (url && !url.startsWith('https://')) {
        return 'Les URLs de photos d\'accès doivent commencer par https://'
      }
    }
    if (data.ownershipProofUrl && !data.ownershipProofUrl.startsWith('https://')) {
      return 'L\'URL du justificatif doit commencer par https://'
    }
  }
  if (step === 6 && (!data.pricePerHour || Number(data.pricePerHour) <= 0))
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
        width: data.width ? Number(data.width) : undefined,
        length: data.length ? Number(data.length) : undefined,
        sizeCategory: data.sizeCategory,
        cancellationPolicy: data.cancellationPolicy,
        accessInstructions: data.accessInstructions || undefined,
        accessPhotos: data.accessPhotos.filter((url) => url.startsWith('https://')),
        floorNumber: data.floorNumber || undefined,
        spotNumber: data.spotNumber || undefined,
        buildingCode: data.buildingCode || undefined,
        gpsPinLat: data.gpsPinLat ? Number(data.gpsPinLat) : undefined,
        gpsPinLng: data.gpsPinLng ? Number(data.gpsPinLng) : undefined,
        ownershipProofUrl: data.ownershipProofUrl || undefined,
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
          {step === 5 && <Step5DimensionsAccess data={data} onChange={update} />}
          {step === 6 && <Step6Pricing data={data} onChange={update} />}
          {step === 7 && <Step7Review data={data} />}

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

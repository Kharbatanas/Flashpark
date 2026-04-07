'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '../../../../../lib/trpc/client'
import { Button } from '@/components/ui/button'
import { FadeIn, PageTransition } from '../../../../../components/motion'
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react'

/* ─── types ──────────────────────────────────────────────────────── */

type DisputeType = 'spot_occupied' | 'spot_not_matching' | 'access_issue' | 'safety_concern' | 'other'

interface DisputeTypeOption {
  value: DisputeType
  label: string
  description: string
}

/* ─── constants ─────────────────────────────────────────────────── */

const DISPUTE_TYPES: DisputeTypeOption[] = [
  {
    value: 'spot_occupied',
    label: 'Place occupée',
    description: 'La place était déjà occupée à votre arrivée',
  },
  {
    value: 'spot_not_matching',
    label: 'Non conforme à l\'annonce',
    description: 'La place ne correspond pas à la description ou aux photos',
  },
  {
    value: 'access_issue',
    label: 'Problème d\'accès',
    description: 'Impossible d\'accéder à la place (barrière, code incorrect, etc.)',
  },
  {
    value: 'safety_concern',
    label: 'Problème de sécurité',
    description: 'La place présente un danger pour votre véhicule ou votre sécurité',
  },
  {
    value: 'other',
    label: 'Autre',
    description: 'Un autre problème non listé ci-dessus',
  },
]

const MAX_PHOTOS = 5
const MIN_DESCRIPTION_LENGTH = 10
const MAX_DESCRIPTION_LENGTH = 1000

/* ─── photo URL input ────────────────────────────────────────────── */

interface PhotoInputProps {
  index: number
  value: string
  onChange: (value: string) => void
  onRemove: () => void
}

function PhotoInput({ index, value, onChange, onRemove }: PhotoInputProps) {
  const isValid = value === '' || (value.startsWith('https://') && value.length > 10)

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`URL de la photo ${index + 1} (https://...)`}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
            !isValid && value !== ''
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
              : 'border-gray-200 focus:border-[#0540FF] focus:ring-[#0540FF]/20'
          }`}
        />
        {!isValid && value !== '' && (
          <p className="mt-1 text-xs text-red-500">L&apos;URL doit commencer par https://</p>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
        aria-label="Supprimer la photo"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

/* ─── main page ──────────────────────────────────────────────────── */

export default function DisputePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const bookingId = params.id

  const [selectedType, setSelectedType] = useState<DisputeType | null>(null)
  const [description, setDescription] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([''])
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const createDispute = api.disputes.create.useMutation()

  // Derive valid photos: non-empty strings starting with https://
  const validPhotos = photoUrls.filter((url) => url.trim() !== '' && url.startsWith('https://'))
  const hasInvalidPhoto = photoUrls.some((url) => url.trim() !== '' && !url.startsWith('https://'))

  function addPhotoField() {
    if (photoUrls.length < MAX_PHOTOS) {
      setPhotoUrls((prev) => [...prev, ''])
    }
  }

  function updatePhoto(index: number, value: string) {
    setPhotoUrls((prev) => prev.map((url, i) => (i === index ? value : url)))
  }

  function removePhoto(index: number) {
    setPhotoUrls((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.length === 0 ? [''] : next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedType) {
      setError('Veuillez sélectionner un type de problème')
      return
    }

    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      setError(`La description doit contenir au moins ${MIN_DESCRIPTION_LENGTH} caractères`)
      return
    }

    if (hasInvalidPhoto) {
      setError('Certaines URLs de photos sont invalides (elles doivent commencer par https://)')
      return
    }

    setError(null)

    try {
      await createDispute.mutateAsync({
        bookingId,
        type: selectedType,
        description: description.trim(),
        photos: validPhotos,
      })
      setSubmitted(true)
      setTimeout(() => router.push(`/booking/${bookingId}?dispute=submitted`), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.')
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <FadeIn>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Signalement envoyé</h1>
            <p className="mt-2 text-sm text-gray-500">Notre équipe va examiner votre signalement.</p>
            <p className="mt-1 text-xs text-gray-400">Redirection en cours...</p>
          </div>
        </FadeIn>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-lg">

          {/* Back link */}
          <FadeIn>
            <Link
              href={`/booking/${bookingId}`}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la réservation
            </Link>
          </FadeIn>

          {/* Header */}
          <FadeIn delay={0.05}>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Signaler un problème</h1>
                <p className="text-sm text-gray-500">Décrivez le problème rencontré lors de votre stationnement</p>
              </div>
            </div>
          </FadeIn>

          <form onSubmit={handleSubmit} noValidate>

            {/* Type selector */}
            <FadeIn delay={0.1}>
              <div className="mb-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Type de problème
                </p>
                <div className="space-y-2">
                  {DISPUTE_TYPES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedType(option.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                        selectedType === option.value
                          ? 'border-[#0540FF] bg-blue-50 ring-2 ring-[#0540FF]/20'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors ${
                          selectedType === option.value
                            ? 'border-[#0540FF] bg-[#0540FF]'
                            : 'border-gray-300'
                        }`}>
                          {selectedType === option.value && (
                            <div className="flex h-full w-full items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${
                            selectedType === option.value ? 'text-[#0540FF]' : 'text-gray-900'
                          }`}>
                            {option.label}
                          </p>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Description */}
            <FadeIn delay={0.15}>
              <div className="mb-5">
                <label
                  htmlFor="description"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-gray-400"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  minLength={MIN_DESCRIPTION_LENGTH}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  placeholder="Décrivez le problème en détail : heure, circonstances, impact sur votre véhicule..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#0540FF] focus:outline-none focus:ring-2 focus:ring-[#0540FF]/20"
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className={`text-xs ${
                    description.trim().length > 0 && description.trim().length < MIN_DESCRIPTION_LENGTH
                      ? 'text-red-500'
                      : 'text-gray-400'
                  }`}>
                    {description.trim().length < MIN_DESCRIPTION_LENGTH
                      ? `Minimum ${MIN_DESCRIPTION_LENGTH} caractères`
                      : ''}
                  </p>
                  <p className="text-right text-xs text-gray-400">
                    {description.length}/{MAX_DESCRIPTION_LENGTH}
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* Photo URLs */}
            <FadeIn delay={0.2}>
              <div className="mb-6">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Photos (optionnel)
                </p>
                <p className="mb-3 text-xs text-gray-500">
                  Ajoutez jusqu&apos;à {MAX_PHOTOS} photos pour appuyer votre signalement (URLs HTTPS uniquement)
                </p>
                <div className="space-y-2.5">
                  {photoUrls.map((url, index) => (
                    <PhotoInput
                      key={index}
                      index={index}
                      value={url}
                      onChange={(value) => updatePhoto(index, value)}
                      onRemove={() => removePhoto(index)}
                    />
                  ))}
                </div>
                {photoUrls.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={addPhotoField}
                    className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-[#0540FF] hover:text-[#0435D2]"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter une photo
                  </button>
                )}
              </div>
            </FadeIn>

            {/* Error message */}
            {error && (
              <FadeIn>
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              </FadeIn>
            )}

            {/* Submit */}
            <FadeIn delay={0.25}>
              <Button
                type="submit"
                loading={createDispute.isPending}
                disabled={!selectedType || description.trim().length < MIN_DESCRIPTION_LENGTH || hasInvalidPhoto}
                className="w-full rounded-xl bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                Envoyer le signalement
              </Button>

              <p className="mt-3 text-center text-xs text-gray-400">
                Votre signalement sera examiné par notre équipe sous 24 à 48 h.
              </p>
            </FadeIn>

          </form>
        </div>
      </div>
    </PageTransition>
  )
}

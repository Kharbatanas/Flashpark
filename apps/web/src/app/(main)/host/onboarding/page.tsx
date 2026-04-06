'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '../../../../lib/supabase/client'
import { api } from '../../../../lib/trpc/client'
import {
  Upload,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  FileText,
  Info,
  ShieldCheck,
  Euro,
  Home,
  User,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Types ────────────────────────────────────────────────────────
type DocType = 'id_card' | 'passport' | 'proof_of_address' | 'property_proof'

interface UploadedFile {
  name: string
  size: number
  url: string
}

// ── File upload zone ─────────────────────────────────────────────
function FileUploadZone({
  label,
  hint,
  accept,
  uploaded,
  uploading,
  onUpload,
  onRemove,
}: {
  label: string
  hint?: string
  accept?: string
  uploaded: UploadedFile | null
  uploading: boolean
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}

      {uploaded ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-800">{uploaded.name}</p>
            <p className="text-xs text-gray-500">{formatSize(uploaded.size)}</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1 text-gray-400 hover:bg-emerald-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragOver
              ? 'border-[#0540FF] bg-[#EFF6FF]'
              : 'border-gray-200 bg-gray-50 hover:border-[#0540FF] hover:bg-[#EFF6FF]'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-[#0540FF]" />
              <p className="text-sm text-gray-500">Chargement en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0540FF]/10">
                <Upload className="h-5 w-5 text-[#0540FF]" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Glissez-deposez ou{' '}
                <span className="text-[#0540FF] underline">cliquez pour parcourir</span>
              </p>
              <p className="text-xs text-gray-400">JPG, PNG, PDF — max 10 Mo</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept ?? 'image/*,.pdf'}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ── Info box ──────────────────────────────────────────────────────
function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-blue-200 bg-[#EFF6FF] px-4 py-3">
      <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0540FF]" />
      <div className="text-sm text-blue-800">{children}</div>
    </div>
  )
}

// ── Success screen ────────────────────────────────────────────────
function SuccessScreen() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" strokeWidth={1.5} />
        </div>
        <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#0540FF] text-lg font-bold text-white shadow-md">
          ✓
        </div>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        Bienvenue dans la communaute des hotes !
      </h2>
      <p className="mb-8 max-w-sm text-gray-500">
        Votre dossier est en cours de verification. En attendant, creez votre premiere annonce et commencez a gagner de l&apos;argent.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={() => router.push('/host/listings/new')}
          className="rounded-xl bg-[#0540FF] px-6 py-3 font-semibold hover:bg-[#0435D2]"
        >
          Creer ma premiere annonce
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/host')}
          className="rounded-xl border-gray-200 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Voir mon tableau de bord
        </Button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function HostOnboardingPage() {
  const router = useRouter()

  // tRPC mutations
  const submitDoc = api.verification.submit.useMutation()
  const becomeHost = api.users.becomeHost.useMutation()
  const updateProfile = api.users.updateProfile.useMutation()

  // Step state
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Step 1: Identity ──────────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [iban, setIban] = useState('')
  const [idDoc, setIdDoc] = useState<UploadedFile | null>(null)
  const [idDocType, setIdDocType] = useState<'id_card' | 'passport'>('id_card')
  const [addressDoc, setAddressDoc] = useState<UploadedFile | null>(null)
  const [uploadingId, setUploadingId] = useState(false)
  const [uploadingAddress, setUploadingAddress] = useState(false)

  // ── Step 2: Property authorization ───────────────────────────
  const [ownerType, setOwnerType] = useState<'owner' | 'tenant'>('owner')
  const [propertyDoc, setPropertyDoc] = useState<UploadedFile | null>(null)
  const [uploadingProperty, setUploadingProperty] = useState(false)
  const [coproprieteChecked, setCoproprieteChecked] = useState(false)

  // ── Step 3: Tax & confirmation ────────────────────────────────
  const [taxChecked, setTaxChecked] = useState(false)
  const [cgvChecked, setCgvChecked] = useState(false)

  // ── File upload helper ────────────────────────────────────────
  async function uploadFile(
    file: File,
    type: DocType,
    setUploading: (v: boolean) => void,
    setDoc: (d: UploadedFile) => void
  ) {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Type de fichier non supporte. Utilisez JPG, PNG, WebP ou PDF.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Fichier trop volumineux. Taille maximale : 5 Mo.')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id ?? 'unknown'
      const ext = file.name.split('.').pop()
      const filePath = `verification/${userId}/${Date.now()}-${type}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)
      if (uploadError) throw new Error(uploadError.message)

      // Store just the storage path — admin uses createSignedUrl() to view docs
      await submitDoc.mutateAsync({ type, fileUrl: filePath })
      setDoc({ name: file.name, size: file.size, url: filePath })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du fichier')
    } finally {
      setUploading(false)
    }
  }

  // ── Validation ────────────────────────────────────────────────
  function canProceedStep1() {
    return (
      firstName.trim().length >= 1 &&
      lastName.trim().length >= 1 &&
      dob.trim().length > 0 &&
      phone.trim().length >= 8 &&
      idDoc !== null &&
      addressDoc !== null
    )
  }

  function canProceedStep2() {
    return propertyDoc !== null && coproprieteChecked
  }

  function canProceedStep3() {
    return taxChecked && cgvChecked
  }

  // ── Submit ────────────────────────────────────────────────────
  async function handleFinish() {
    if (!canProceedStep3()) return
    setSubmitting(true)
    setError(null)
    try {
      await becomeHost.mutateAsync()
      await updateProfile.mutateAsync({
        ...(phone.trim() ? { phoneNumber: phone.trim() } : {}),
        ...(firstName.trim() || lastName.trim()
          ? { fullName: `${firstName.trim()} ${lastName.trim()}`.trim() }
          : {}),
        // TODO: persist dateOfBirth and iban once columns are added to the users schema
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <SuccessScreen />
        </div>
      </div>
    )
  }

  const STEPS = [
    { n: 1, title: "Verification d'identite" },
    { n: 2, title: 'Autorisation du bien' },
    { n: 3, title: 'Conditions & fiscalite' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Devenir hote Flashpark</h1>
          <p className="mt-1 text-sm text-gray-500">
            Completez les 3 etapes pour activer votre compte hote.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            {STEPS.map(({ n, title }) => (
              <div key={n} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step > n
                      ? 'bg-emerald-500 text-white'
                      : step === n
                      ? 'bg-[#0540FF] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > n ? <CheckCircle2 className="h-4 w-4" /> : n}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    step === n ? 'text-[#0540FF]' : step > n ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {title}
                </span>
              </div>
            ))}
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#0540FF] transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

          {/* ── STEP 1 ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF]">
                  <User className="h-5 w-5 text-[#0540FF]" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Verification d&apos;identite</h2>
                  <p className="text-xs text-gray-500">Requis par la reglementation europeenne (DAC7)</p>
                </div>
              </div>

              {/* Name */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    Prenom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jean"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dupont"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* DOB + Phone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    Date de naissance <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                      .toISOString()
                      .split('T')[0]}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    Numero de telephone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* IBAN */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">
                  IBAN (pour les virements)
                </Label>
                <Input
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="FR76 3000 6000 0112 3456 7890 189"
                  className="rounded-xl font-mono text-sm"
                />
                <p className="text-xs text-gray-400">
                  Optionnel maintenant — vous pourrez l&apos;ajouter plus tard depuis votre tableau de bord.
                </p>
              </div>

              {/* ID document */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    Type de document d&apos;identite <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-3">
                    {(['id_card', 'passport'] as const).map((t) => (
                      <label
                        key={t}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                          idDocType === t
                            ? 'border-[#0540FF] bg-[#EFF6FF] text-[#0540FF]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="idDocType"
                          value={t}
                          checked={idDocType === t}
                          onChange={() => setIdDocType(t)}
                          className="sr-only"
                        />
                        {t === 'id_card' ? 'Carte nationale d\'identite' : 'Passeport'}
                      </label>
                    ))}
                  </div>
                </div>

                <FileUploadZone
                  label={idDocType === 'id_card' ? 'CNI recto-verso' : 'Passeport (page photo)'}
                  hint="Format JPG, PNG ou PDF — taille max 10 Mo"
                  uploaded={idDoc}
                  uploading={uploadingId}
                  onUpload={(file) => uploadFile(file, idDocType, setUploadingId, setIdDoc)}
                  onRemove={() => setIdDoc(null)}
                />
              </div>

              {/* Address proof */}
              <FileUploadZone
                label="Justificatif de domicile"
                hint="Facture EDF, eau, telecom ou quittance de loyer de moins de 3 mois"
                uploaded={addressDoc}
                uploading={uploadingAddress}
                onUpload={(file) =>
                  uploadFile(file, 'proof_of_address', setUploadingAddress, setAddressDoc)
                }
                onRemove={() => setAddressDoc(null)}
              />
            </div>
          )}

          {/* ── STEP 2 ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF]">
                  <Home className="h-5 w-5 text-[#0540FF]" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Autorisation du bien</h2>
                  <p className="text-xs text-gray-500">Justifiez votre droit a louer cette place</p>
                </div>
              </div>

              {/* Owner type */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Vous etes <span className="text-red-500">*</span>
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    { value: 'owner', label: 'Proprietaire', sub: 'Vous etes l\'ayant-droit du bien' },
                    { value: 'tenant', label: 'Locataire avec autorisation', sub: 'Votre proprietaire vous autorise a sous-louer' },
                  ] as const).map(({ value, label, sub }) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer flex-col gap-0.5 rounded-xl border p-4 transition-colors ${
                        ownerType === value
                          ? 'border-[#0540FF] bg-[#EFF6FF]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="ownerType"
                        value={value}
                        checked={ownerType === value}
                        onChange={() => setOwnerType(value)}
                        className="sr-only"
                      />
                      <span className={`text-sm font-semibold ${ownerType === value ? 'text-[#0540FF]' : 'text-gray-800'}`}>
                        {label}
                      </span>
                      <span className="text-xs text-gray-500">{sub}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Property document */}
              <FileUploadZone
                label={
                  ownerType === 'owner'
                    ? 'Titre de propriete ou avis de taxe fonciere'
                    : 'Bail de location + autorisation ecrite du proprietaire'
                }
                hint={
                  ownerType === 'owner'
                    ? 'Document prouvant que vous etes bien proprietaire du bien'
                    : 'Les deux documents sont necessaires (bail + lettre d\'autorisation signee)'
                }
                uploaded={propertyDoc}
                uploading={uploadingProperty}
                onUpload={(file) =>
                  uploadFile(file, 'property_proof', setUploadingProperty, setPropertyDoc)
                }
                onRemove={() => setPropertyDoc(null)}
              />

              {/* Info copropriete */}
              <InfoBox>
                <p className="font-semibold">Parking en copropriete ?</p>
                <p className="mt-1">
                  Si votre parking est dans une residence, verifiez que le reglement de copropriete n&apos;interdit pas la location a des non-residents. En cas de doute, consultez votre syndic.
                </p>
              </InfoBox>

              {/* Checkbox copropriete */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={coproprieteChecked}
                    onChange={(e) => setCoproprieteChecked(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                      coproprieteChecked
                        ? 'border-[#0540FF] bg-[#0540FF]'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {coproprieteChecked && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700">
                  Je confirme que le reglement de copropriete de mon immeuble <strong>autorise la location de ma place a des tiers</strong>, ou que mon parking n&apos;est pas soumis a un tel reglement.
                </span>
              </label>
            </div>
          )}

          {/* ── STEP 3 ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF]">
                  <Euro className="h-5 w-5 text-[#0540FF]" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Conditions &amp; fiscalite</h2>
                  <p className="text-xs text-gray-500">Derniere etape avant d&apos;etre hote</p>
                </div>
              </div>

              {/* Tax info */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Vos obligations fiscales</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#0540FF]" />
                    Les revenus locatifs de parking sont declares comme <strong>revenus fonciers</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#0540FF]" />
                    Si vos revenus fonciers totaux sont <strong>{'<'} 15 000 €/an</strong>, le regime micro-foncier s&apos;applique (abattement de 30 %).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#0540FF]" />
                    Flashpark declare automatiquement vos revenus a l&apos;administration fiscale conformement a la <strong>directive DAC7</strong>.
                  </li>
                </ul>
              </div>

              {/* Insurance info */}
              <InfoBox>
                <p className="font-semibold">Assurance incluse</p>
                <p className="mt-1">
                  Chaque reservation est automatiquement couverte par notre assurance partenaire. Aucune demarche de votre part n&apos;est necessaire.
                </p>
              </InfoBox>

              {/* Tax checkbox */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={taxChecked}
                    onChange={(e) => setTaxChecked(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                      taxChecked ? 'border-[#0540FF] bg-[#0540FF]' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {taxChecked && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700">
                  Je comprends que les revenus generes sur Flashpark <strong>doivent etre declares aux impots</strong> en tant que revenus fonciers.
                </span>
              </label>

              {/* CGV checkbox */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={cgvChecked}
                    onChange={(e) => setCgvChecked(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                      cgvChecked ? 'border-[#0540FF] bg-[#0540FF]' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {cgvChecked && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700">
                  J&apos;accepte les{' '}
                  <a href="/terms" target="_blank" className="text-[#0540FF] underline">
                    conditions generales d&apos;hebergement
                  </a>{' '}
                  de Flashpark.
                </span>
              </label>

              {/* Payout info */}
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800">
                  Les virements seront disponibles apres validation de votre dossier par notre equipe (sous 48 h ouvrables).
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <Button
              variant="outline"
              onClick={() => (step === 1 ? router.back() : setStep(step - 1))}
              className="rounded-xl border-gray-200 font-semibold text-gray-700"
              disabled={submitting}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {step === 1 ? 'Annuler' : 'Precedent'}
            </Button>

            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !canProceedStep1()) ||
                  (step === 2 && !canProceedStep2())
                }
                className="rounded-xl bg-[#0540FF] px-6 font-semibold hover:bg-[#0435D2] disabled:opacity-50"
              >
                Suivant
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!canProceedStep3() || submitting}
                className="rounded-xl bg-[#0540FF] px-6 font-semibold hover:bg-[#0435D2] disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Finaliser mon inscription
              </Button>
            )}
          </div>
        </div>

        {/* Step indicator (mobile) */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Etape {step} sur 3
        </p>
      </div>
    </div>
  )
}

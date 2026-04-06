'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/trpc/client'
import { PageTransition, FadeIn, StaggerContainer, StaggerItem, motion, AnimatePresence } from '../../../components/motion'
import { Car, Plus, Pencil, Trash2, Check, X, Zap, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type VehicleType = 'sedan' | 'suv' | 'compact' | 'van' | 'motorcycle' | 'electric'

const TYPE_LABELS: Record<VehicleType, string> = {
  sedan: 'Berline',
  suv: 'SUV',
  compact: 'Compacte',
  van: 'Utilitaire',
  motorcycle: 'Moto',
  electric: 'Électrique',
}

const TYPE_OPTIONS: VehicleType[] = ['sedan', 'suv', 'compact', 'van', 'motorcycle', 'electric']

interface VehicleForm {
  licensePlate: string
  brand: string
  model: string
  color: string
  type: VehicleType
  height: string
  isElectric: boolean
  isDefault: boolean
}

const BLANK_FORM: VehicleForm = {
  licensePlate: '',
  brand: '',
  model: '',
  color: '',
  type: 'sedan',
  height: '',
  isElectric: false,
  isDefault: false,
}

function VehicleFormPanel({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: VehicleForm
  onSave: (data: VehicleForm) => void
  onCancel: () => void
  saving: boolean
  error: string | null
}) {
  const [form, setForm] = useState<VehicleForm>(initial)

  function update(fields: Partial<VehicleForm>) {
    setForm((prev) => ({ ...prev, ...fields }))
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">Immatriculation *</label>
          <input
            type="text"
            value={form.licensePlate}
            onChange={(e) => update({ licensePlate: e.target.value.toUpperCase() })}
            placeholder="AA-123-BB"
            maxLength={20}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm uppercase focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">Type</label>
          <select
            value={form.type}
            onChange={(e) => update({ type: e.target.value as VehicleType })}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">Marque</label>
          <input
            type="text"
            value={form.brand}
            onChange={(e) => update({ brand: e.target.value })}
            placeholder="Renault"
            maxLength={50}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">Modèle</label>
          <input
            type="text"
            value={form.model}
            onChange={(e) => update({ model: e.target.value })}
            placeholder="Clio"
            maxLength={50}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">Couleur</label>
          <input
            type="text"
            value={form.color}
            onChange={(e) => update({ color: e.target.value })}
            placeholder="Blanc"
            maxLength={30}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">Hauteur (m) — optionnel</label>
          <input
            type="number"
            value={form.height}
            onChange={(e) => update({ height: e.target.value })}
            placeholder="1.5"
            min={0.5}
            max={5}
            step={0.1}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isElectric}
            onChange={(e) => update({ isElectric: e.target.checked })}
            className="h-4 w-4 rounded accent-[#0540FF]"
          />
          Véhicule électrique
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => update({ isDefault: e.target.checked })}
            className="h-4 w-4 rounded accent-[#0540FF]"
          />
          Véhicule par défaut
        </label>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.licensePlate.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0540FF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0435D2] disabled:opacity-50 transition-colors"
        >
          <Check className="h-4 w-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <X className="h-4 w-4" />
          Annuler
        </button>
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  const router = useRouter()
  const { data: me, isLoading: meLoading } = api.users.me.useQuery()
  const { data: vehicles, isLoading, refetch } = api.vehicles.list.useQuery()

  const createVehicle = api.vehicles.create.useMutation({ onSuccess: () => { refetch(); setShowAddForm(false) } })
  const updateVehicle = api.vehicles.update.useMutation({ onSuccess: () => { refetch(); setEditingId(null) } })
  const deleteVehicle = api.vehicles.delete.useMutation({ onSuccess: () => refetch() })

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!meLoading && !me) router.replace('/login?redirect=/vehicles')
  }, [me, meLoading, router])

  if (meLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0540FF] border-t-transparent" />
      </div>
    )
  }

  if (!me) return null

  async function handleCreate(data: VehicleForm) {
    setFormError(null)
    try {
      await createVehicle.mutateAsync({
        licensePlate: data.licensePlate.trim(),
        brand: data.brand.trim() || undefined,
        model: data.model.trim() || undefined,
        color: data.color.trim() || undefined,
        type: data.type,
        height: data.height ? Number(data.height) : undefined,
        isElectric: data.isElectric,
        isDefault: data.isDefault,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création')
    }
  }

  async function handleUpdate(id: string, data: VehicleForm) {
    setFormError(null)
    try {
      await updateVehicle.mutateAsync({
        id,
        licensePlate: data.licensePlate.trim(),
        brand: data.brand.trim() || undefined,
        model: data.model.trim() || undefined,
        color: data.color.trim() || undefined,
        type: data.type,
        height: data.height ? Number(data.height) : undefined,
        isElectric: data.isElectric,
        isDefault: data.isDefault,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la modification')
    }
  }

  async function handleDelete(id: string, plate: string) {
    if (!window.confirm(`Supprimer le véhicule ${plate} ?`)) return
    setDeletingId(id)
    try {
      await deleteVehicle.mutateAsync({ id })
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 pb-24 md:pb-8">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <FadeIn className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A2E]">Mes véhicules</h1>
              <p className="mt-1 text-sm text-gray-500">
                {vehicles?.length ?? 0} véhicule{(vehicles?.length ?? 0) !== 1 ? 's' : ''} enregistré{(vehicles?.length ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button onClick={() => { setShowAddForm(true); setEditingId(null) }} disabled={showAddForm}>
                <Plus className="h-4 w-4 mr-1.5" />
                Ajouter
              </Button>
            </motion.div>
          </FadeIn>

          {/* Add form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6"
              >
                <h2 className="mb-3 text-sm font-semibold text-gray-700">Nouveau véhicule</h2>
                <VehicleFormPanel
                  initial={BLANK_FORM}
                  onSave={handleCreate}
                  onCancel={() => { setShowAddForm(false); setFormError(null) }}
                  saving={createVehicle.isPending}
                  error={formError}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Vehicle list */}
          {vehicles?.length === 0 && !showAddForm ? (
            <FadeIn>
              <Card className="p-12 text-center">
                <Car className="mx-auto mb-4 h-12 w-12 text-gray-200" />
                <h2 className="text-base font-semibold text-[#1A1A2E]">Aucun véhicule</h2>
                <p className="mt-1 text-sm text-gray-400">Ajoutez votre véhicule pour accélérer la réservation.</p>
                <Button className="mt-5" onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Ajouter un véhicule
                </Button>
              </Card>
            </FadeIn>
          ) : (
            <StaggerContainer className="space-y-4">
              {vehicles?.map((vehicle) => {
                const isEditing = editingId === vehicle.id
                return (
                  <StaggerItem key={vehicle.id}>
                    {isEditing ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 className="mb-2 text-sm font-semibold text-gray-700">Modifier le véhicule</h2>
                        <VehicleFormPanel
                          initial={{
                            licensePlate: vehicle.licensePlate,
                            brand: vehicle.brand ?? '',
                            model: vehicle.model ?? '',
                            color: vehicle.color ?? '',
                            type: vehicle.type as VehicleType,
                            height: vehicle.height ?? '',
                            isElectric: vehicle.isElectric,
                            isDefault: vehicle.isDefault,
                          }}
                          onSave={(data) => handleUpdate(vehicle.id, data)}
                          onCancel={() => { setEditingId(null); setFormError(null) }}
                          saving={updateVehicle.isPending}
                          error={formError}
                        />
                      </motion.div>
                    ) : (
                      <motion.div whileHover={{ y: -1, boxShadow: '0 6px 20px -5px rgba(0,0,0,0.06)' }}>
                        <Card className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5">
                          {/* Icon */}
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0540FF]/10">
                            <Car className="h-6 w-6 text-[#0540FF]" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 tracking-wide uppercase">
                                {vehicle.licensePlate}
                              </span>
                              {vehicle.isDefault && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#0540FF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0540FF]">
                                  <Star className="h-2.5 w-2.5" />
                                  Par défaut
                                </span>
                              )}
                              {vehicle.isElectric && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                  <Zap className="h-2.5 w-2.5" />
                                  Électrique
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {[vehicle.brand, vehicle.model, vehicle.color].filter(Boolean).join(' · ') || TYPE_LABELS[vehicle.type as VehicleType]}
                              {' · '}
                              <span className="text-xs">{TYPE_LABELS[vehicle.type as VehicleType]}</span>
                              {vehicle.height && (
                                <span className="ml-1 text-xs text-gray-400">· H {Number(vehicle.height).toFixed(1)} m</span>
                              )}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditingId(vehicle.id); setShowAddForm(false); setFormError(null) }}
                              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(vehicle.id, vehicle.licensePlate)}
                              disabled={deletingId === vehicle.id}
                              className="rounded-lg border border-red-200 p-2 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </Card>
                      </motion.div>
                    )}
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          )}

        </div>
      </div>
    </PageTransition>
  )
}

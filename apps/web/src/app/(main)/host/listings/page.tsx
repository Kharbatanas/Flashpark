'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '../../../../lib/trpc/client'
import { useRequireHost } from '../../../../lib/use-require-host'
import { PageTransition, FadeIn, StaggerContainer, StaggerItem, motion, AnimatePresence } from '../../../../components/motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

const TYPE_LABELS: Record<string, string> = {
  outdoor: 'Extérieur',
  indoor: 'Intérieur',
  garage: 'Garage',
  covered: 'Couvert',
  underground: 'Souterrain',
}

const STATUS_VARIANT: Record<string, 'active' | 'secondary' | 'pending'> = {
  active: 'active',
  inactive: 'secondary',
  pending_review: 'pending',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending_review: 'En révision',
}

export default function HostListingsPage() {
  const { isHost, isLoading: hostLoading } = useRequireHost()
  const { data: listings, isLoading, refetch } = api.spots.myListings.useQuery(undefined, { enabled: isHost })
  const updateSpot = api.spots.update.useMutation({ onSuccess: () => refetch() })
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle(id: string, currentStatus: string) {
    setTogglingId(id)
    setError(null)
    try {
      await updateSpot.mutateAsync({
        id,
        status: currentStatus === 'active' ? 'inactive' : 'active',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 pb-24 md:py-8 md:pb-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <FadeIn className="mb-6 md:mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1A1A2E]">Mes annonces</h1>
              <p className="mt-1 text-sm text-gray-500">
                {listings?.length ?? 0} annonce{(listings?.length ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild>
                <Link href="/host/listings/new">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nouvelle annonce
                </Link>
              </Button>
            </motion.div>
          </FadeIn>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <motion.svg
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-8 w-8 text-[#0540FF]" fill="none" viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </motion.svg>
            </div>
          ) : listings?.length === 0 ? (
            <FadeIn>
              <Card className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0540FF]/10"
                >
                  <svg className="h-8 w-8 text-[#0540FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </motion.div>
                <h2 className="text-lg font-semibold text-[#1A1A2E]">Aucune annonce</h2>
                <p className="mt-1 text-sm text-gray-500">Créez votre première annonce pour commencer à gagner</p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-6 inline-block">
                  <Button asChild>
                    <Link href="/host/listings/new">
                      Créer une annonce
                    </Link>
                  </Button>
                </motion.div>
              </Card>
            </FadeIn>
          ) : (
            <StaggerContainer className="space-y-4">
              {listings?.map((spot) => {
                const badgeVariant = STATUS_VARIANT[spot.status] ?? 'secondary'
                const label = STATUS_LABEL[spot.status] ?? spot.status
                const canToggle = spot.status === 'active' || spot.status === 'inactive'

                return (
                  <StaggerItem key={spot.id}>
                    <motion.div
                      whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.08)' }}
                    >
                      <Card className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 sm:p-5">
                        {/* Photo */}
                        <div className="w-full h-32 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                          {spot.photos?.[0] ? (
                            <img src={spot.photos[0]} alt={spot.title} className="h-full w-full object-cover" />
                          ) : (
                            <svg className="h-7 w-7 text-[#0540FF]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-[#1A1A2E] truncate">{spot.title}</h3>
                            <Badge variant={badgeVariant}>{label}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500 truncate">{spot.address}</p>
                          <div className="mt-1.5 flex items-center gap-3">
                            <span className="text-sm font-medium text-[#0540FF]">
                              {Number(spot.pricePerHour).toFixed(2).replace('.', ',')} €/h
                            </span>
                            <span className="text-xs text-gray-400">{TYPE_LABELS[spot.type] ?? spot.type}</span>
                            {spot.rating && (
                              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                <svg className="h-3 w-3 text-[#F5A623] fill-current" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {Number(spot.rating).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Toggle */}
                        {canToggle && (
                          <Switch
                            checked={spot.status === 'active'}
                            disabled={togglingId === spot.id}
                            onCheckedChange={() => handleToggle(spot.id, spot.status)}
                            title={spot.status === 'active' ? 'Désactiver' : 'Activer'}
                          />
                        )}
                      </Card>
                    </motion.div>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          )}
        </div>

        {/* FAB — mobile only */}
        <Link
          href="/host/listings/new"
          className="md:hidden fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0540FF] text-white shadow-lg shadow-[#0540FF]/30 active:scale-95 transition-transform"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </Link>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-700 shadow-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}

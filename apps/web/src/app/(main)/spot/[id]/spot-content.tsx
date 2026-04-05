'use client'

import Link from 'next/link'
import { BookingWidget } from '../../../../components/booking-widget'
import { ReviewsSection } from '../../../../components/reviews-section'
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  PageTransition,
  motion,
} from '../../../../components/motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const TYPE_LABELS: Record<string, string> = {
  outdoor: 'Extérieur',
  indoor: 'Intérieur',
  garage: 'Garage',
  covered: 'Couvert',
  underground: 'Souterrain',
}

const AMENITY_ICONS: Record<string, string> = {
  lighting: '💡',
  security_camera: '📷',
  covered: '🏠',
  ev_charging: '⚡',
  disabled_access: '♿',
  '24h_access': '🕐',
}

interface SpotData {
  id: string
  title: string
  description: string | null
  address: string
  city: string
  latitude: string
  longitude: string
  pricePerHour: string
  pricePerDay: string | null
  type: string
  status: string
  hasSmartGate: boolean
  photos: string[]
  amenities: string[]
  instantBook: boolean
  rating: string | null
  reviewCount: number
  maxVehicleHeight: string | null
  parkingInstructions: string | null
  hostId: string
}

export function SpotContent({ spot }: { spot: SpotData }) {
  const photos = spot.photos ?? []

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Back link */}
          <motion.div whileHover={{ y: -2 }} className="inline-block">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/map" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0540FF]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour à la carte
              </Link>
            </Button>
          </motion.div>

          {/* Photo gallery */}
          <FadeIn>
            <div className="mb-8 grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl" style={{ height: 360 }}>
              {photos.length > 0 ? (
                photos.slice(0, 5).map((url, i) => (
                  <FadeIn key={i} delay={i * 0.1}>
                    <div
                      className={`overflow-hidden bg-gray-100 h-full ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                    >
                      <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  </FadeIn>
                ))
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <FadeIn key={i} delay={i * 0.1}>
                    <div
                      className={`flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 h-full ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                    >
                      <svg className="h-10 w-10 text-[#0540FF]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </FadeIn>
                ))
              )}
            </div>
          </FadeIn>

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Title + badges */}
              <FadeIn direction="up">
                <div className="mb-4 flex flex-wrap items-start gap-2">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[#1A1A2E]">{spot.title}</h1>
                    <p className="mt-1 text-sm text-gray-500">{spot.address}, {spot.city}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="blue">
                      {TYPE_LABELS[spot.type] ?? spot.type}
                    </Badge>
                    {spot.hasSmartGate && (
                      <Badge variant="success">
                        ⚡ Smart Gate
                      </Badge>
                    )}
                    {spot.instantBook && (
                      <Badge variant="blue">
                        Réservation instantanée
                      </Badge>
                    )}
                  </div>
                </div>
              </FadeIn>

              {/* Rating */}
              {spot.rating && (
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg
                        key={s}
                        className={`h-4 w-4 ${Number(spot.rating) >= s ? 'text-[#F5A623] fill-current' : 'text-gray-200 fill-current'}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-[#1A1A2E]">{Number(spot.rating).toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({spot.reviewCount} avis)</span>
                </div>
              )}

              <Separator className="my-6" />

              {/* Description */}
              {spot.description && (
                <div className="mb-6">
                  <h2 className="mb-3 text-lg font-semibold text-[#1A1A2E]">Description</h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">{spot.description}</p>
                </div>
              )}

              {/* Amenities */}
              {spot.amenities.length > 0 && (
                <div className="mb-6">
                  <h2 className="mb-3 text-lg font-semibold text-[#1A1A2E]">Équipements</h2>
                  <StaggerContainer className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {spot.amenities.map((amenity) => (
                      <StaggerItem key={amenity}>
                        <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm text-gray-700">
                          <span>{AMENITY_ICONS[amenity] ?? '✓'}</span>
                          <span className="capitalize">{amenity.replace(/_/g, ' ')}</span>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </div>
              )}

              {/* Max vehicle height */}
              {spot.maxVehicleHeight && (
                <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-[#1A1A2E]">Hauteur maximale :</span>{' '}
                    {Number(spot.maxVehicleHeight).toFixed(1)} m
                  </p>
                </div>
              )}

              {/* Parking instructions */}
              {spot.parkingInstructions && (
                <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">Instructions d&apos;acces</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{spot.parkingInstructions}</p>
                </div>
              )}

              {/* Cancellation policy */}
              <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Politique d&apos;annulation</p>
                <p className="text-sm text-gray-600">
                  Annulation gratuite jusqu&apos;a 24h avant le debut de la reservation.
                  Au-dela, le montant total est du.
                </p>
              </div>

              <Separator className="my-6" />

              {/* Reviews */}
              <FadeIn>
                <div className="mb-6">
                  <ReviewsSection spotId={spot.id} />
                </div>
              </FadeIn>

              <Separator className="my-6" />

              {/* Host info */}
              <FadeIn>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Votre hôte</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0540FF]/10">
                        <svg className="h-6 w-6 text-[#0540FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A2E]">Hôte Flashpark</p>
                        <p className="text-xs text-gray-500">Membre vérifié</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>

            {/* Booking sidebar */}
            <div className="w-full lg:w-96 lg:flex-shrink-0">
              <div className="sticky top-24">
                <BookingWidget spot={spot} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

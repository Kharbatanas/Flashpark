'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { BookingWidget } from '../../../../components/booking-widget'
import { ReviewsSection } from '../../../../components/reviews-section'
import { api } from '../../../../lib/trpc/client'
import { FadeIn, StaggerContainer, StaggerItem, PageTransition, motion, AnimatePresence } from '../../../../components/motion'
import {
  ArrowLeft,
  Star,
  Shield,
  Zap,
  Camera,
  Lightbulb,
  Accessibility,
  Clock,
  Car,
  MapPin,
  Info,
  ChevronDown,
  ChevronUp,
  Grid2X2,
  X,
  ChevronRight,
} from 'lucide-react'

/* ─── constants ──────────────────────────────────────────────── */

const TYPE_LABELS: Record<string, string> = {
  outdoor: 'Extérieur',
  indoor: 'Intérieur',
  garage: 'Garage',
  covered: 'Couvert',
  underground: 'Souterrain',
}

const AMENITY_META: Record<string, { label: string; Icon: React.ElementType }> = {
  lighting:        { label: 'Éclairage',          Icon: Lightbulb     },
  security_camera: { label: 'Caméra de sécurité',  Icon: Camera        },
  covered:         { label: 'Couvert',              Icon: Car           },
  ev_charging:     { label: 'Recharge électrique',  Icon: Zap           },
  disabled_access: { label: 'Accès PMR',            Icon: Accessibility },
  '24h_access':    { label: 'Accès 24h/24',         Icon: Clock         },
}

/* ─── types ──────────────────────────────────────────────────── */

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

/* ─── helpers ────────────────────────────────────────────────── */

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`h-4 w-4 fill-current ${rating >= s ? 'text-[#0540FF]' : 'text-gray-200'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

/* ─── fullscreen gallery overlay ────────────────────────────── */

function GalleryOverlay({
  photos,
  startIndex,
  onClose,
}: {
  photos: string[]
  startIndex: number
  onClose: () => void
}) {
  const [current, setCurrent] = useState(startIndex)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* close */}
      <button
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* counter */}
      <span className="absolute left-1/2 top-5 -translate-x-1/2 text-sm text-white/70">
        {current + 1} / {photos.length}
      </span>

      {/* prev */}
      {current > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => c - 1) }}
          className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      {/* image */}
      <motion.img
        key={current}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        src={photos[current]}
        alt={`Photo ${current + 1}`}
        className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* next */}
      {current < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => c + 1) }}
          className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5 rotate-180" />
        </button>
      )}

      {/* thumbnails strip */}
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
        {photos.map((url, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
            className={`h-14 w-14 overflow-hidden rounded-lg border-2 transition-all ${
              i === current ? 'border-white' : 'border-transparent opacity-50'
            }`}
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── photo gallery ──────────────────────────────────────────── */

function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [overlayStart, setOverlayStart] = useState(0)
  const [mobileIndex, setMobileIndex] = useState(0)
  const touchStartX = useRef<number>(0)
  const touchDeltaX = useRef<number>(0)

  function openAt(i: number) {
    if (photos.length === 0) return
    setOverlayStart(i)
    setOverlayOpen(true)
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
  }

  function onTouchMove(e: React.TouchEvent) {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }

  function onTouchEnd() {
    const threshold = 50
    if (touchDeltaX.current < -threshold && mobileIndex < photos.length - 1) {
      setMobileIndex((i) => i + 1)
    } else if (touchDeltaX.current > threshold && mobileIndex > 0) {
      setMobileIndex((i) => i - 1)
    }
  }

  const displayPhotos = photos.length > 0 ? photos : ['']

  return (
    <>
      {/* ── Mobile: swipeable carousel ── */}
      <div className="relative mb-6 md:hidden">
        <div
          className="relative h-64 w-full overflow-hidden bg-gray-100"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={() => openAt(mobileIndex)}
        >
          {displayPhotos[mobileIndex] ? (
            <img
              src={displayPhotos[mobileIndex]}
              alt={`${title} — photo ${mobileIndex + 1}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <PlaceholderPhoto />
          )}

          {/* Image counter badge */}
          {photos.length > 0 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {mobileIndex + 1}/{photos.length}
            </span>
          )}

          {/* Next chevron hint */}
          {mobileIndex < photos.length - 1 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1">
              <ChevronRight className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Dots indicator */}
        {photos.length > 1 && (
          <div className="mt-2 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setMobileIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === mobileIndex ? 'w-4 bg-[#0540FF]' : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop: grid layout ── */}
      <div className="relative mb-8 hidden overflow-hidden rounded-2xl md:block" style={{ height: 420 }}>
        <div className="grid h-full grid-cols-4 grid-rows-2 gap-1.5">
          {/* main large photo */}
          <div
            className="col-span-2 row-span-2 cursor-pointer overflow-hidden bg-gray-100"
            onClick={() => openAt(0)}
          >
            {photos[0] ? (
              <motion.img
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.4 }}
                src={photos[0]}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <PlaceholderPhoto />
            )}
          </div>

          {/* 4 small photos */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="cursor-pointer overflow-hidden bg-gray-100"
              onClick={() => openAt(i)}
            >
              {photos[i] ? (
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  src={photos[i]}
                  alt={`${title} — photo ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <PlaceholderPhoto />
              )}
            </div>
          ))}
        </div>

        {/* "show all" button */}
        {photos.length > 0 && (
          <button
            onClick={() => openAt(0)}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow hover:bg-gray-50"
          >
            <Grid2X2 className="h-3.5 w-3.5" />
            Voir les {photos.length} photos
          </button>
        )}
      </div>

      <AnimatePresence>
        {overlayOpen && (
          <GalleryOverlay
            photos={photos}
            startIndex={overlayStart}
            onClose={() => setOverlayOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function PlaceholderPhoto() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Car className="h-10 w-10 text-gray-300" />
    </div>
  )
}

/* ─── expandable description ─────────────────────────────────── */

function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.split('\n').length > 3 || text.length > 240

  return (
    <div>
      <p
        className={`whitespace-pre-line text-[15px] leading-relaxed text-gray-700 ${
          !expanded && isLong ? 'line-clamp-3' : ''
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-sm font-semibold text-gray-900 underline underline-offset-2 hover:text-[#0540FF]"
        >
          {expanded ? (
            <>Réduire <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Lire la suite <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      )}
    </div>
  )
}

/* ─── divider ─────────────────────────────────────────────────── */
function Divider() {
  return <div className="my-8 border-b border-gray-100" />
}

/* ─── mobile sticky CTA bar ──────────────────────────────────── */

function MobileStickyBar({
  pricePerHour,
  onReserve,
}: {
  pricePerHour: number
  onReserve: () => void
}) {
  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden">
      <div className="border-t border-gray-100 bg-white/95 backdrop-blur-xl px-4 pb-[env(safe-area-inset-bottom)] pt-3">
        <div className="flex items-center justify-between gap-4" style={{ minHeight: 52 }}>
          <div>
            <span className="text-xl font-bold text-gray-900">
              {pricePerHour.toFixed(2).replace('.', ',')} €
            </span>
            <span className="text-sm text-gray-500">/h</span>
          </div>
          <button
            onClick={onReserve}
            className="rounded-full bg-[#0540FF] px-7 py-3 text-sm font-semibold text-white active:bg-[#0435D2]"
          >
            Réserver
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── main component ─────────────────────────────────────────── */

export function SpotContent({ spot }: { spot: SpotData }) {
  const photos = spot.photos ?? []
  const rating = spot.rating ? Number(spot.rating) : null
  const pricePerHour = Number(spot.pricePerHour)

  const { data: myBooking } = api.bookings.myBookingForSpot.useQuery(
    { spotId: spot.id },
    { retry: false }
  )

  // Scroll to the inline booking widget on desktop when the sticky CTA is tapped
  const bookingRef = useRef<HTMLDivElement>(null)

  function scrollToBooking() {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        {/* On mobile add bottom padding so sticky bar doesn't overlap content */}
        <div className="mx-auto max-w-6xl px-4 pb-36 pt-6 md:pb-16">

          {/* Back link */}
          <Link
            href="/map"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 md:mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la carte
          </Link>

          {/* Photo gallery — mobile carousel is edge-to-edge via negative margin */}
          <FadeIn>
            <div className="-mx-4 md:mx-0">
              <PhotoGallery photos={photos} title={spot.title} />
            </div>
          </FadeIn>

          {/* Two-column layout */}
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">

            {/* ── Left column ── */}
            <div className="min-w-0 flex-1">

              {/* Title + location */}
              <FadeIn direction="up">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2 md:mb-3 md:gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 md:text-2xl">{spot.title}</h1>
                    <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      {spot.address}, {spot.city}
                    </p>
                  </div>
                  {/* type badge */}
                  <span className="mt-1 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#0540FF]">
                    {TYPE_LABELS[spot.type] ?? spot.type}
                  </span>
                </div>
              </FadeIn>

              {/* Rating row — wraps on mobile */}
              {rating !== null && (
                <FadeIn direction="up">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <StarRow rating={rating} />
                    <span className="text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-400">
                      ({spot.reviewCount} avis)
                    </span>
                    {spot.instantBook && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Zap className="h-3.5 w-3.5 text-[#0540FF]" />
                          Instantané
                        </span>
                      </>
                    )}
                    {spot.hasSmartGate && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Shield className="h-3.5 w-3.5 text-[#0540FF]" />
                          Smart Gate
                        </span>
                      </>
                    )}
                  </div>
                </FadeIn>
              )}

              <Divider />

              {/* Host card — compact horizontal on mobile */}
              <FadeIn direction="up">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0540FF]/10 md:h-12 md:w-12">
                      <svg className="h-5 w-5 text-[#0540FF] md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Hôte Flashpark</p>
                      <p className="flex items-center gap-1 text-sm text-gray-500">
                        <Shield className="h-3.5 w-3.5 text-emerald-500" />
                        Membre vérifié
                      </p>
                    </div>
                  </div>
                  <button className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                    Contacter
                  </button>
                </div>
              </FadeIn>

              <Divider />

              {/* Description */}
              {spot.description && (
                <FadeIn direction="up">
                  <div>
                    <h2 className="mb-3 text-base font-semibold text-gray-900 md:text-lg">À propos de ce parking</h2>
                    <ExpandableDescription text={spot.description} />
                  </div>
                </FadeIn>
              )}

              {spot.description && <Divider />}

              {/* Amenities — horizontal scroll chips on mobile, grid on desktop */}
              {spot.amenities.length > 0 && (
                <FadeIn direction="up">
                  <div>
                    <h2 className="mb-3 text-base font-semibold text-gray-900 md:mb-4 md:text-lg">Équipements</h2>

                    {/* Mobile: horizontal scrollable chips */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:hidden" style={{ scrollbarWidth: 'none' }}>
                      {spot.amenities.map((amenity) => {
                        const meta = AMENITY_META[amenity]
                        const Icon = meta?.Icon ?? Car
                        return (
                          <div
                            key={amenity}
                            className="flex flex-shrink-0 items-center gap-2 rounded-full border border-gray-100 bg-white px-3 py-2 text-sm text-gray-700"
                          >
                            <Icon className="h-4 w-4 flex-shrink-0 text-[#0540FF]" />
                            <span className="whitespace-nowrap">{meta?.label ?? amenity.replace(/_/g, ' ')}</span>
                          </div>
                        )
                      })}
                      {spot.maxVehicleHeight && (
                        <div className="flex flex-shrink-0 items-center gap-2 rounded-full border border-gray-100 bg-white px-3 py-2 text-sm text-gray-700">
                          <Car className="h-4 w-4 flex-shrink-0 text-[#0540FF]" />
                          <span className="whitespace-nowrap">Hauteur max : {Number(spot.maxVehicleHeight).toFixed(1)} m</span>
                        </div>
                      )}
                    </div>

                    {/* Desktop: grid */}
                    <StaggerContainer className="hidden grid-cols-2 gap-3 md:grid">
                      {spot.amenities.map((amenity) => {
                        const meta = AMENITY_META[amenity]
                        const Icon = meta?.Icon ?? Car
                        return (
                          <StaggerItem key={amenity}>
                            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700">
                              <Icon className="h-5 w-5 flex-shrink-0 text-[#0540FF]" />
                              <span>{meta?.label ?? amenity.replace(/_/g, ' ')}</span>
                            </div>
                          </StaggerItem>
                        )
                      })}
                    </StaggerContainer>

                    {spot.maxVehicleHeight && (
                      <div className="mt-3 hidden items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 md:flex">
                        <Car className="h-5 w-5 flex-shrink-0 text-[#0540FF]" />
                        <span>Hauteur maximale : <strong>{Number(spot.maxVehicleHeight).toFixed(1)} m</strong></span>
                      </div>
                    )}
                  </div>
                </FadeIn>
              )}

              {spot.amenities.length > 0 && <Divider />}

              {/* Parking instructions */}
              {spot.parkingInstructions && (
                <FadeIn direction="up">
                  <div>
                    <h2 className="mb-3 text-base font-semibold text-gray-900 md:text-lg">Instructions d&apos;accès</h2>
                    <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0540FF]" />
                      <p className="text-[15px] leading-relaxed text-gray-700 whitespace-pre-line">
                        {spot.parkingInstructions}
                      </p>
                    </div>
                  </div>
                  <Divider />
                </FadeIn>
              )}

              {/* Location */}
              <FadeIn direction="up">
                <div>
                  <h2 className="mb-3 text-base font-semibold text-gray-900 md:text-lg">Localisation</h2>
                  <p className="mb-3 text-[15px] text-gray-600">
                    {spot.address}, {spot.city}
                  </p>
                  {/* static map placeholder — exact address shown after booking */}
                  <div className="flex h-[200px] items-center justify-center rounded-xl border border-gray-100 bg-gray-50 md:h-40">
                    <div className="text-center">
                      <MapPin className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                      <p className="text-xs text-gray-400">Adresse exacte communiquée après réservation</p>
                    </div>
                  </div>
                </div>
              </FadeIn>

              <Divider />

              {/* Reviews */}
              <FadeIn>
                <ReviewsSection spotId={spot.id} bookingId={myBooking?.id} />
              </FadeIn>

            </div>

            {/* ── Right column (40%) — desktop only sticky booking widget ── */}
            <div className="hidden w-full lg:block lg:w-[380px] lg:flex-shrink-0">
              <div className="sticky top-24" ref={bookingRef}>

                {/* price header */}
                <div className="mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {pricePerHour.toFixed(2).replace('.', ',')} €
                  </span>
                  <span className="text-gray-500"> / heure</span>
                  {rating !== null && (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                      <Star className="h-3.5 w-3.5 fill-current text-[#0540FF]" />
                      <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
                      <span>· {spot.reviewCount} avis</span>
                    </div>
                  )}
                </div>

                {/* booking card */}
                <BookingWidget spot={spot} />

                {/* cancellation note */}
                <p className="mt-3 text-center text-xs text-gray-400">
                  Annulation gratuite jusqu&apos;à 24 h avant l&apos;arrivée.
                  {!spot.instantBook && (
                    <> L&apos;hôte devra approuver votre demande.</>
                  )}
                </p>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile sticky booking CTA */}
      <MobileStickyBar pricePerHour={pricePerHour} onReserve={scrollToBooking} />
    </PageTransition>
  )
}

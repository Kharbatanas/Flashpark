'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  motion,
} from '../../../components/motion'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, Star, ParkingCircle } from 'lucide-react'

// ── Status config ────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: 'En attente',  className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed: { label: 'Confirmée',   className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  active:    { label: 'Active',      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  completed: { label: 'Terminée',    className: 'bg-gray-100 text-gray-600 border border-gray-200' },
  cancelled: { label: 'Annulée',     className: 'bg-red-50 text-red-600 border border-red-200' },
  refunded:  { label: 'Remboursée',  className: 'bg-gray-100 text-gray-600 border border-gray-200' },
}

type Tab = 'active' | 'upcoming' | 'past'

const TAB_STATUSES: Record<Tab, string[]> = {
  active:   ['active', 'confirmed'],
  upcoming: ['pending'],
  past:     ['completed', 'cancelled', 'refunded'],
}

function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(d))
}

function formatTime(d: Date | string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d))
}

interface BookingData {
  id: string
  spotId: string
  startTime: Date | string
  endTime: Date | string
  status: string
  totalPrice: string
}

interface SpotInfo {
  title: string
  address: string
}

interface DashboardContentProps {
  userBookings: BookingData[]
  spotMap: Record<string, SpotInfo>
}

function CancelButton({ bookingId }: { bookingId: string }) {
  return (
    <form action={`/api/bookings/${bookingId}/cancel`} method="POST">
      <button
        type="submit"
        className="text-xs font-medium text-red-500 hover:text-red-700"
        onClick={(e) => { if (!confirm('Annuler cette réservation ?')) e.preventDefault() }}
      >
        Annuler
      </button>
    </form>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  const config = {
    active:   { title: 'Aucune réservation en cours', desc: 'Vous n\'avez pas de séjour actif pour le moment.', cta: 'Trouver un parking' },
    upcoming: { title: 'Aucune réservation à venir',  desc: 'Planifiez votre prochain stationnement dès maintenant.', cta: 'Réserver un parking' },
    past:     { title: 'Aucun historique',             desc: 'Vos réservations terminées apparaîtront ici.', cta: 'Explorer la carte' },
  }[tab]

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white px-8 py-16 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF]">
        <ParkingCircle className="h-8 w-8 text-[#0540FF]" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{config.title}</h3>
      <p className="mt-1 text-sm text-gray-500">{config.desc}</p>
      <Button asChild className="mt-6 rounded-full bg-[#0540FF] px-6 font-semibold hover:bg-[#0435D2]">
        <Link href="/map">{config.cta}</Link>
      </Button>
    </div>
  )
}

export default function DashboardContent({ userBookings, spotMap }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('active')

  const filtered = userBookings.filter((b) => TAB_STATUSES[activeTab].includes(b.status))

  const tabs: { key: Tab; label: string }[] = [
    { key: 'active',   label: 'En cours' },
    { key: 'upcoming', label: 'À venir' },
    { key: 'past',     label: 'Passées' },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">

          {/* ── Header ──────────────────────────────────────── */}
          <FadeIn>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Mes réservations</h1>
              <p className="mt-1 text-sm text-gray-500">
                {userBookings.length} réservation{userBookings.length !== 1 ? 's' : ''} au total
              </p>
            </div>
          </FadeIn>

          {/* ── Tab pills ───────────────────────────────────── */}
          <FadeIn delay={0.05}>
            <div className="mb-6 flex gap-2">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    activeTab === key
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </FadeIn>

          {/* ── Booking list ────────────────────────────────── */}
          {filtered.length === 0 ? (
            <FadeIn delay={0.1}>
              <EmptyState tab={activeTab} />
            </FadeIn>
          ) : (
            <StaggerContainer className="space-y-3">
              {filtered.map((booking) => {
                const spotInfo = spotMap[booking.spotId]
                const statusCfg = STATUS_CONFIG[booking.status] ?? { label: booking.status, className: 'bg-gray-100 text-gray-600 border border-gray-200' }
                const canCancel = booking.status === 'pending' || booking.status === 'confirmed'
                const isCompleted = booking.status === 'completed'

                return (
                  <StaggerItem key={booking.id}>
                    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                      <Link href={`/booking/${booking.id}`} className="block">
                        <div className="flex gap-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                          {/* Colored left accent */}
                          <div className={`w-1 flex-shrink-0 ${
                            booking.status === 'active' ? 'bg-emerald-400' :
                            booking.status === 'confirmed' ? 'bg-[#0540FF]' :
                            booking.status === 'pending' ? 'bg-amber-400' :
                            booking.status === 'cancelled' ? 'bg-red-400' :
                            'bg-gray-200'
                          }`} />

                          {/* Placeholder photo */}
                          <div className="hidden w-[110px] flex-shrink-0 sm:block">
                            <div className="flex h-full items-center justify-center bg-gray-50">
                              <ParkingCircle className="h-10 w-10 text-gray-300" strokeWidth={1.25} />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex flex-1 flex-col gap-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate font-semibold text-gray-900">
                                  {spotInfo?.title ?? 'Parking'}
                                </h3>
                                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  {spotInfo?.address ?? '—'}
                                </p>
                              </div>
                              <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.className}`}>
                                {statusCfg.label}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(booking.startTime)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(booking.startTime)} → {formatTime(booking.endTime)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="text-base font-bold text-gray-900">
                                {Number(booking.totalPrice).toFixed(2).replace('.', ',')} €
                              </p>
                              <div className="flex items-center gap-3" onClick={(e) => e.preventDefault()}>
                                {isCompleted && (
                                  <Link
                                    href={`/booking/${booking.id}#review`}
                                    className="flex items-center gap-1 text-xs font-semibold text-[#0540FF] hover:underline"
                                  >
                                    <Star className="h-3 w-3" />
                                    Laisser un avis
                                  </Link>
                                )}
                                {canCancel && <CancelButton bookingId={booking.id} />}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
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

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BecomeHostButton from './_become-host-button'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  motion,
} from '../../../components/motion'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { api } from '../../../lib/trpc/client'
import {
  Euro,
  Calendar,
  LayoutList,
  Clock,
  Plus,
  ChevronRight,
  ParkingCircle,
  Check,
  X,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────
function formatDateTime(d: Date | string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d))
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: 'En attente',  className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed: { label: 'Confirmée',   className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  active:    { label: 'Active',      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  completed: { label: 'Terminée',    className: 'bg-gray-100 text-gray-600 border border-gray-200' },
  cancelled: { label: 'Annulée',     className: 'bg-red-50 text-red-600 border border-red-200' },
  refunded:  { label: 'Remboursée',  className: 'bg-gray-100 text-gray-600 border border-gray-200' },
}

// ── Interfaces ───────────────────────────────────────────────
interface StatCard {
  label: string
  value: string | number
  icon: string
  bg: string
}

interface BookingRow {
  id: string
  spotId: string
  startTime: string
  endTime: string
  status: string
  hostPayout: string
}

interface HostContentProps {
  isHost: boolean
  stats: StatCard[]
  recentBookings: BookingRow[]
  spotMap: Record<string, string>
}

// ── Stat icon map ─────────────────────────────────────────────
const STAT_ICON_MAP: Record<string, { icon: React.ReactNode; iconBg: string; iconColor: string }> = {
  earnings: {
    icon: <Euro className="h-5 w-5" />,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  total: {
    icon: <Calendar className="h-5 w-5" />,
    iconBg: 'bg-blue-50',
    iconColor: 'text-[#0540FF]',
  },
  listings: {
    icon: <LayoutList className="h-5 w-5" />,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  pending: {
    icon: <Clock className="h-5 w-5" />,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
}

// ── Booking actions ───────────────────────────────────────────
function BookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter()
  const confirmMutation = api.bookings.confirm.useMutation({ onSuccess: () => router.refresh() })
  const rejectMutation  = api.bookings.reject.useMutation({ onSuccess: () => router.refresh() })

  if (status !== 'pending') return null
  const isLoading = confirmMutation.isPending || rejectMutation.isPending

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={isLoading}
        onClick={() => confirmMutation.mutate({ id: bookingId })}
        className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        <Check className="h-3 w-3" />
        Accepter
      </button>
      <button
        disabled={isLoading}
        onClick={() => rejectMutation.mutate({ id: bookingId })}
        className="flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        <X className="h-3 w-3" />
        Refuser
      </button>
    </div>
  )
}

// ── Become host wall ──────────────────────────────────────────
function BecomeHostWall() {
  const perks = [
    { emoji: '💶', text: "Jusqu'à 300 € / mois en moyenne" },
    { emoji: '📅', text: 'Vous choisissez vos disponibilités' },
    { emoji: '🔒', text: 'Assurance incluse sur chaque réservation' },
    { emoji: '📱', text: "Tout géré depuis l'application" },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-lg">
          <FadeIn>
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#EFF6FF]">
                <ParkingCircle className="h-10 w-10 text-[#0540FF]" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Devenez hôte Flashpark</h1>
              <p className="mt-2 text-sm text-gray-500">
                Louez votre place de parking et générez des revenus supplémentaires. Gratuit, sans engagement.
              </p>

              <div className="my-7 space-y-3 text-left">
                {perks.map(({ emoji, text }) => (
                  <div key={text} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <span className="text-lg">{emoji}</span>
                    <span className="text-sm text-gray-700">{text}</span>
                  </div>
                ))}
              </div>

              <BecomeHostButton />
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  )
}

// ── Main component ────────────────────────────────────────────
export default function HostContent({ isHost, stats, recentBookings, spotMap }: HostContentProps) {
  if (!isHost) return <BecomeHostWall />

  const pendingBookings = recentBookings.filter((b) => b.status === 'pending')
  const otherBookings   = recentBookings.filter((b) => b.status !== 'pending')

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">

          {/* ── Header ────────────────────────────────────────── */}
          <FadeIn>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tableau de bord hôte</h1>
                <p className="mt-1 text-sm text-gray-500">Gérez vos annonces et vos réservations</p>
              </div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button asChild className="rounded-full bg-[#0540FF] font-semibold hover:bg-[#0435D2]">
                  <Link href="/host/listings/new">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Créer une annonce
                  </Link>
                </Button>
              </motion.div>
            </div>
          </FadeIn>

          {/* ── Stats grid ────────────────────────────────────── */}
          <StaggerContainer className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(({ label, value, icon }) => {
              const cfg = STAT_ICON_MAP[icon] ?? STAT_ICON_MAP.total
              return (
                <StaggerItem key={label}>
                  <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${cfg.iconBg} ${cfg.iconColor}`}>
                      {cfg.icon}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="mt-1 text-xs text-gray-500">{label}</p>
                  </div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>

          {/* ── Quick links ───────────────────────────────────── */}
          <FadeIn delay={0.1}>
            <div className="mb-8 flex flex-wrap gap-2">
              {[
                { href: '/host/listings', label: 'Mes annonces' },
                { href: '/host/planning',  label: 'Planning' },
                { href: '/host/earnings',  label: 'Revenus' },
                { href: '/host/verification', label: 'Vérification' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900"
                >
                  {label}
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              ))}
            </div>
          </FadeIn>

          {/* ── Pending bookings ──────────────────────────────── */}
          {pendingBookings.length > 0 && (
            <FadeIn delay={0.15}>
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">Demandes en attente</h2>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {pendingBookings.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {pendingBookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-amber-100 bg-white p-4 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{spotMap[b.spotId] ?? 'Parking'}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {formatDateTime(b.startTime)} → {formatDateTime(b.endTime)}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <p className="text-sm font-bold text-gray-900">
                          {Number(b.hostPayout).toFixed(2).replace('.', ',')} €
                        </p>
                        <BookingActions bookingId={b.id} status={b.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          {/* ── Recent bookings table ─────────────────────────── */}
          <FadeIn delay={0.2}>
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900">Réservations récentes</h2>
              </div>

              {otherBookings.length === 0 && pendingBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-8 py-14 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                    <Calendar className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Aucune réservation pour le moment</p>
                </div>
              ) : otherBookings.length === 0 ? null : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Annonce</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Arrivée</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Départ</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Statut</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Revenus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {otherBookings.map((b) => {
                        const cfg = STATUS_CONFIG[b.status] ?? { label: b.status, className: 'bg-gray-100 text-gray-600 border border-gray-200' }
                        return (
                          <tr key={b.id} className="transition-colors hover:bg-gray-50/60">
                            <td className="px-6 py-3.5 font-medium text-gray-900">{spotMap[b.spotId] ?? 'Parking'}</td>
                            <td className="px-6 py-3.5 text-gray-500">{formatDateTime(b.startTime)}</td>
                            <td className="px-6 py-3.5 text-gray-500">{formatDateTime(b.endTime)}</td>
                            <td className="px-6 py-3.5">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-right font-semibold text-gray-900">
                              {Number(b.hostPayout).toFixed(2).replace('.', ',')} €
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  )
}

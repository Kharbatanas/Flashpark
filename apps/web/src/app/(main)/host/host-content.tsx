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
  AnimatePresence,
} from '../../../components/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '../../../lib/trpc/client'

function formatDateTime(d: Date | string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d))
}

const STATUS_VARIANT: Record<string, 'pending' | 'active' | 'success' | 'secondary' | 'cancelled' | 'outline'> = {
  pending: 'pending',
  confirmed: 'success',
  active: 'active',
  completed: 'secondary',
  cancelled: 'cancelled',
  refunded: 'outline',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  active: 'Active',
  completed: 'Terminée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
}

const STAT_ICONS: Record<string, { icon: JSX.Element }> = {
  earnings: {
    icon: <svg className="h-6 w-6 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  listings: {
    icon: <svg className="h-6 w-6 text-[#0540FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  pending: {
    icon: <svg className="h-6 w-6 text-[#F5A623]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  total: {
    icon: <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
}

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

function BecomeHostWall() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-16">
        <div className="mx-auto max-w-lg text-center">
          <FadeIn>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#0540FF]/10">
              <svg className="h-10 w-10 text-[#0540FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Devenez hôte Flashpark</h1>
            <p className="mt-3 text-gray-500">
              Louez votre place de parking et générez des revenus supplémentaires. Gratuit, sans engagement.
            </p>
          </FadeIn>

          <StaggerContainer className="my-8 space-y-3 text-left">
            {[
              { icon: '\u{1F4B6}', text: 'Jusqu\'à 300 \u20AC/mois en moyenne' },
              { icon: '\u{1F4C5}', text: 'Vous choisissez vos disponibilités' },
              { icon: '\u{1F512}', text: 'Assurance incluse sur chaque réservation' },
              { icon: '\u{1F4F1}', text: 'Tout géré depuis l\'application' },
            ].map(({ icon, text }) => (
              <StaggerItem key={text}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl">{icon}</span>
                    <span className="text-sm text-gray-700">{text}</span>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* This button calls the becomeHost mutation via profile page */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block"
          >
            <BecomeHostButton />
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}

function BookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter()
  const confirmMutation = api.bookings.confirm.useMutation({
    onSuccess: () => router.refresh(),
  })
  const rejectMutation = api.bookings.reject.useMutation({
    onSuccess: () => router.refresh(),
  })

  if (status !== 'pending') return null

  const isLoading = confirmMutation.isPending || rejectMutation.isPending

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        loading={confirmMutation.isPending}
        disabled={isLoading}
        onClick={() => confirmMutation.mutate({ id: bookingId })}
        className="h-7 rounded-lg bg-[#10B981] px-2.5 text-xs hover:bg-emerald-600"
      >
        Accepter
      </Button>
      <Button
        size="sm"
        variant="outline"
        loading={rejectMutation.isPending}
        disabled={isLoading}
        onClick={() => rejectMutation.mutate({ id: bookingId })}
        className="h-7 rounded-lg px-2.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
      >
        Refuser
      </Button>
    </div>
  )
}

export default function HostContent({ isHost, stats, recentBookings, spotMap }: HostContentProps) {
  if (!isHost) return <BecomeHostWall />

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <FadeIn>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Tableau de bord hôte</h1>
                <p className="mt-1 text-sm text-gray-500">Gérez vos annonces et vos réservations</p>
              </div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button asChild>
                  <Link href="/host/listings/new">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nouvelle annonce
                  </Link>
                </Button>
              </motion.div>
            </div>
          </FadeIn>

          {/* Stats */}
          <StaggerContainer className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(({ label, value, icon, bg }) => (
              <StaggerItem key={label}>
                <Card className="p-5">
                  <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                    {STAT_ICONS[icon]?.icon}
                  </div>
                  <p className="text-2xl font-bold text-[#1A1A2E]">{value}</p>
                  <p className="mt-1 text-xs text-gray-500">{label}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Links */}
          <div className="mb-6">
            <Button variant="link" asChild className="px-0">
              <Link href="/host/listings">
                Voir toutes mes annonces
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </Button>
          </div>

          {/* Recent bookings */}
          <FadeIn>
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-gray-100 px-6 py-4">
                <CardTitle>Réservations récentes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {recentBookings.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-gray-400">Aucune réservation pour le moment</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-100 bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Annonce</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Arrivée</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Départ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Statut</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Revenus</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentBookings.map((b) => {
                          const badgeVariant = STATUS_VARIANT[b.status] ?? 'outline'
                          const label = STATUS_LABEL[b.status] ?? b.status
                          return (
                            <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-3.5 font-medium text-[#1A1A2E]">{spotMap[b.spotId] ?? 'Parking'}</td>
                              <td className="px-6 py-3.5 text-gray-600">{formatDateTime(b.startTime)}</td>
                              <td className="px-6 py-3.5 text-gray-600">{formatDateTime(b.endTime)}</td>
                              <td className="px-6 py-3.5">
                                <Badge variant={badgeVariant}>{label}</Badge>
                              </td>
                              <td className="px-6 py-3.5 text-right font-semibold text-[#1A1A2E]">
                                {Number(b.hostPayout).toFixed(2).replace('.', ',')} &euro;
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <BookingActions bookingId={b.id} status={b.status} />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  )
}

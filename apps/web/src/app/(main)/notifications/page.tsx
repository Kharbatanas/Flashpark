'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { api } from '../../../lib/trpc/client'
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../../../components/motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NotificationsPage() {
  const { data: notifs, refetch } = api.notifications.list.useQuery()
  const markAllRead = api.notifications.markAllRead.useMutation({ onSuccess: () => refetch() })

  const unreadCount = notifs?.filter((n) => !n.readAt).length ?? 0

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Notifications</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </FadeIn>

          {!notifs?.length ? (
            <Card className="p-8 text-center text-sm text-gray-400">
              Aucune notification
            </Card>
          ) : (
            <StaggerContainer className="space-y-2">
              {notifs.map((n) => {
                const bookingId = (n.data as Record<string, string> | null)?.bookingId
                return (
                  <StaggerItem key={n.id}>
                    <Card className={`p-4 ${!n.readAt ? 'border-l-4 border-l-[#0540FF] bg-blue-50/30' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                          {n.body && <p className="mt-0.5 text-sm text-gray-600">{n.body}</p>}
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(n.createdAt).toLocaleString('fr-FR', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {bookingId && (
                          <Button variant="outline" size="sm" asChild className="shrink-0 text-xs">
                            <Link href={`/booking/${bookingId}`}>Voir</Link>
                          </Button>
                        )}
                      </div>
                    </Card>
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

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/trpc/client'
import { PageTransition, FadeIn, motion, AnimatePresence } from '../../../components/motion'
import { MessageCircle, Send, ArrowLeft, Car, Clock } from 'lucide-react'

function formatTime(d: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(d))
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  active: 'Active',
  completed: 'Terminée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
}

/* ─── Message thread panel ─── */
function MessageThread({
  bookingId,
  currentUserId,
  onBack,
}: {
  bookingId: string
  currentUserId: string
  onBack: () => void
}) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: messages, refetch } = api.messages.byBooking.useQuery({ bookingId })
  const sendMsg = api.messages.send.useMutation({ onSuccess: () => { refetch(); setText('') } })
  const markRead = api.messages.markRead.useMutation()

  useEffect(() => {
    if (bookingId) markRead.mutate({ bookingId })
  }, [bookingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    sendMsg.mutate({ bookingId, content: text.trim() })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back button — mobile only */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 lg:hidden">
        <button onClick={onBack} className="rounded-full p-1.5 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-900">Conversation</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!messages?.length ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageCircle className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Aucun message pour cette réservation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isOwn
                    ? 'rounded-br-sm bg-[#0540FF] text-white'
                    : 'rounded-bl-sm bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`mt-1 text-[10px] ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </motion.div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrire un message..."
            maxLength={2000}
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
          />
          <button
            type="submit"
            disabled={!text.trim() || sendMsg.isPending}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0540FF] text-white hover:bg-[#0435D2] disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

/* ─── Main page ─── */
export default function MessagesPage() {
  const router = useRouter()
  const { data: me, isLoading: meLoading } = api.users.me.useQuery()
  const { data: bookings, isLoading: bookingsLoading } = api.bookings.myBookings.useQuery()

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [mobileShowThread, setMobileShowThread] = useState(false)

  // Auth redirect
  useEffect(() => {
    if (!meLoading && !me) router.replace('/login?redirect=/messages')
  }, [me, meLoading, router])

  if (meLoading || bookingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0540FF] border-t-transparent" />
      </div>
    )
  }

  if (!me) return null

  const activeBookings = (bookings ?? []).filter((b) =>
    ['pending', 'confirmed', 'active', 'completed'].includes(b.status)
  )

  function handleSelectBooking(id: string) {
    setSelectedBookingId(id)
    setMobileShowThread(true)
  }

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-72px)] bg-white">

        {/* ── Sidebar: conversation list ── */}
        <div className={`w-full border-r border-gray-100 flex flex-col lg:w-80 lg:flex-shrink-0 ${
          mobileShowThread ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="border-b border-gray-100 px-5 py-4">
            <h1 className="text-lg font-bold text-[#1A1A2E]">Messages</h1>
            <p className="text-xs text-gray-400 mt-0.5">{activeBookings.length} réservation{activeBookings.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <MessageCircle className="h-12 w-12 text-gray-200 mb-4" />
                <p className="text-sm font-semibold text-gray-900">Aucune conversation</p>
                <p className="mt-1 text-xs text-gray-400">
                  Vos échanges avec les hôtes apparaîtront ici une fois une réservation effectuée.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activeBookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => handleSelectBooking(booking.id)}
                    className={`w-full flex items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50 ${
                      selectedBookingId === booking.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0540FF]/10">
                      <Car className="h-5 w-5 text-[#0540FF]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          Réservation #{booking.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span className={`flex-shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                          booking.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          booking.status === 'confirmed' ? 'bg-blue-50 text-blue-700' :
                          booking.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {STATUS_LABELS[booking.status] ?? booking.status}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        {formatDate(booking.startTime)} · {Number(booking.totalPrice).toFixed(2).replace('.', ',')} €
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Thread panel ── */}
        <div className={`flex-1 flex flex-col ${
          mobileShowThread ? 'flex' : 'hidden lg:flex'
        }`}>
          {selectedBookingId ? (
            <MessageThread
              key={selectedBookingId}
              bookingId={selectedBookingId}
              currentUserId={me.id}
              onBack={() => setMobileShowThread(false)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
              <MessageCircle className="h-14 w-14 text-gray-200 mb-4" />
              <p className="text-base font-semibold text-gray-900">Sélectionnez une conversation</p>
              <p className="mt-1 text-sm text-gray-400">Choisissez une réservation dans la liste pour afficher les messages.</p>
            </div>
          )}
        </div>

      </div>
    </PageTransition>
  )
}

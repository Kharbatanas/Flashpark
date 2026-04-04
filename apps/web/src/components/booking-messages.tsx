'use client'

import { useState, useRef, useEffect } from 'react'
import { api } from '../lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface BookingMessagesProps {
  bookingId: string
  currentUserId: string
}

export function BookingMessages({ bookingId, currentUserId }: BookingMessagesProps) {
  const [newMessage, setNewMessage] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: messages, refetch } = api.messages.byBooking.useQuery(
    { bookingId },
    { refetchInterval: 10000 } // poll every 10s
  )
  const sendMessage = api.messages.send.useMutation({
    onSuccess: () => {
      setNewMessage('')
      refetch()
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!newMessage.trim()) return
    sendMessage.mutate({ bookingId, content: newMessage.trim() })
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3.5">
        <h3 className="text-sm font-semibold text-gray-900">Messages</h3>
      </div>

      {/* Messages list */}
      <div className="h-64 overflow-y-auto px-5 py-4 space-y-3">
        {!messages?.length ? (
          <p className="text-center text-xs text-gray-400 py-8">
            Aucun message — commencez la conversation
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMine
                      ? 'bg-[#0540FF] text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`mt-1 text-[10px] ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Send form */}
      <div className="border-t border-gray-100 px-5 py-3 flex gap-2">
        <Input
          placeholder="Votre message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 text-sm"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!newMessage.trim() || sendMessage.isPending}
        >
          Envoyer
        </Button>
      </div>
    </div>
  )
}

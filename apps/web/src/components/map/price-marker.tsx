'use client'

import { cn } from '@flashpark/ui'

interface PriceMarkerProps {
  price: number
  selected?: boolean
  onClick?: () => void
}

export function PriceMarker({ price, selected = false, onClick }: PriceMarkerProps) {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex cursor-pointer items-center justify-center rounded-full px-3 py-1.5 text-xs font-bold shadow-md transition-all duration-150',
        'hover:scale-110 hover:z-10',
        selected
          ? 'bg-[#1A1A2E] text-white scale-110 z-10 ring-2 ring-white'
          : 'bg-[#0540FF] text-white hover:bg-blue-700'
      )}
      style={{ minWidth: '56px' }}
    >
      {formatted}/h
      {/* Caret */}
      <span
        className={cn(
          'absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-0 w-0',
          'border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent',
          selected ? 'border-t-[#1A1A2E]' : 'border-t-[#0540FF]'
        )}
        style={{
          borderTopWidth: 6,
          borderLeftWidth: 4,
          borderRightWidth: 4,
        }}
      />
    </button>
  )
}

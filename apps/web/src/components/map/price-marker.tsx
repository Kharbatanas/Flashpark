'use client'

import { cn } from '@/lib/utils'

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
    maximumFractionDigits: 1,
  }).format(price)

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex cursor-pointer items-center justify-center rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-150',
        'hover:scale-110 hover:z-10',
        selected
          ? 'bg-gray-900 text-white scale-110 z-10 ring-2 ring-white shadow-lg'
          : 'bg-white text-gray-900 hover:bg-gray-50 shadow-md ring-1 ring-gray-200'
      )}
      style={{ minWidth: '52px' }}
    >
      {formatted}
      {/* Caret */}
      <span
        className={cn(
          'absolute -bottom-1 left-1/2 -translate-x-1/2 h-0 w-0',
          'border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent',
          selected ? 'border-t-gray-900' : 'border-t-white'
        )}
      />
    </button>
  )
}

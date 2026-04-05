'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface FiltersProps {
  countries: string[]
  cities: string[]
  sources: string[]
}

export function IntelligenceFilters({ countries, cities, sources }: FiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeCountry = searchParams.get('country') || ''
  const activeCity = searchParams.get('city') || ''
  const activeSource = searchParams.get('source') || ''

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset city when country changes
      if (key === 'country') params.delete('city')
      router.push(`/intelligence?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm mb-6">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Filtres</span>

      {/* Country filter */}
      <select
        value={activeCountry}
        onChange={(e) => setFilter('country', e.target.value)}
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      >
        <option value="">Tous les pays</option>
        {countries.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* City filter */}
      <select
        value={activeCity}
        onChange={(e) => setFilter('city', e.target.value)}
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      >
        <option value="">Toutes les villes</option>
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Source filter */}
      <select
        value={activeSource}
        onChange={(e) => setFilter('source', e.target.value)}
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      >
        <option value="">Toutes les sources</option>
        {sources.map((s) => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
        ))}
      </select>

      {/* Clear filters */}
      {(activeCountry || activeCity || activeSource) && (
        <button
          onClick={() => router.push('/intelligence')}
          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-100 transition-colors"
        >
          Effacer
        </button>
      )}
    </div>
  )
}

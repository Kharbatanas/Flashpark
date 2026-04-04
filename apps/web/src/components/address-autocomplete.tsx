'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export interface AddressResult {
  address: string
  city: string
  latitude: number
  longitude: number
}

interface Props {
  onSelect: (result: AddressResult) => void
  defaultValue?: string
}

interface MapboxFeature {
  place_name: string
  center: [number, number]
  context?: { id: string; text: string }[]
  text: string
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export function AddressAutocomplete({ onSelect, defaultValue = '' }: Props) {
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3 || !MAPBOX_TOKEN) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=fr&language=fr&types=address,place&limit=5`
      )
      const data = await res.json()
      const features: MapboxFeature[] = data.features ?? []
      setSuggestions(features)
      setIsOpen(features.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInputChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300)
  }

  function extractCity(feature: MapboxFeature): string {
    if (feature.context) {
      const place = feature.context.find((c) => c.id.startsWith('place'))
      if (place) return place.text
    }
    // If no context place found, use feature text as fallback
    return feature.text
  }

  function handleSelect(feature: MapboxFeature) {
    const city = extractCity(feature)
    const result: AddressResult = {
      address: feature.place_name,
      city,
      latitude: feature.center[1],
      longitude: feature.center[0],
    }
    setQuery(feature.place_name)
    setSuggestions([])
    setIsOpen(false)
    onSelect(result)
  }

  function handleGeolocate() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&language=fr&types=address,place&limit=1`
          )
          const data = await res.json()
          const feature: MapboxFeature | undefined = data.features?.[0]
          if (feature) {
            handleSelect(feature)
          } else {
            onSelect({ address: `${latitude}, ${longitude}`, city: '', latitude, longitude })
          }
        } catch {
          onSelect({ address: `${latitude}, ${longitude}`, city: '', latitude, longitude })
        } finally {
          setLocating(false)
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    )
  }

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
          placeholder="Tapez une adresse en France..."
          className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-10 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <svg className="h-4 w-4 animate-spin text-[#0540FF]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {/* Suggestions dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            {suggestions.map((feature, i) => (
              <button
                key={`${feature.place_name}-${i}`}
                type="button"
                onClick={() => handleSelect(feature)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
              >
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-sm text-gray-700 line-clamp-2">{feature.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Geolocate button */}
      <button
        type="button"
        onClick={handleGeolocate}
        disabled={locating}
        className="flex items-center gap-2 text-sm font-medium text-[#0540FF] hover:underline disabled:opacity-60"
      >
        {locating ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        )}
        Utiliser ma position
      </button>
    </div>
  )
}

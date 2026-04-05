'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Map, { Marker, Popup, NavigationControl, type MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { PriceMarker } from './price-marker'
import { motion, AnimatePresence, FadeIn, StaggerContainer, StaggerItem, HoverScale } from '../motion'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Center of France — will auto-detect user location if available
const FRANCE_CENTER = { longitude: 1.888334, latitude: 46.603354 }

interface MapboxFeature {
  place_name: string
  center: [number, number]
}

interface Spot {
  id: string
  title: string
  address: string
  latitude: string | number
  longitude: string | number
  pricePerHour: string | number
  type: string
  photos: string[]
  rating: string | number | null
  reviewCount: number
}

interface SpotMapProps {
  initialSpots: Spot[]
}

const TYPE_LABELS: Record<string, string> = {
  outdoor: 'Extérieur',
  indoor: 'Intérieur',
  garage: 'Garage',
  covered: 'Couvert',
  underground: 'Souterrain',
}

function SpotListFallback({ spots }: { spots: Spot[] }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <FadeIn>
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Carte non disponible — token Mapbox non configuré. Voici les places disponibles :
        </div>
      </FadeIn>
      <StaggerContainer className="grid gap-4 sm:grid-cols-2">
        {filteredSpots.map((spot) => (
          <StaggerItem key={spot.id}>
            <HoverScale>
              <Link href={`/spot/${spot.id}`} className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-3 h-32 w-full rounded-xl bg-gray-100" />
                <h3 className="font-semibold text-[#1A1A2E]">{spot.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{spot.address}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0540FF]">
                    {Number(spot.pricePerHour).toFixed(2).replace('.', ',')} €/h
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {TYPE_LABELS[spot.type] ?? spot.type}
                  </span>
                </div>
              </Link>
            </HoverScale>
          </StaggerItem>
        ))}
      </StaggerContainer>
      {spots.length === 0 && (
        <FadeIn>
          <p className="text-center text-gray-500">Aucune place disponible pour le moment.</p>
        </FadeIn>
      )}
    </div>
  )
}

export function SpotMap({ initialSpots }: SpotMapProps) {
  const mapRef = useRef<MapRef>(null)
  const searchParams = useSearchParams()
  const [spots] = useState<Spot[]>(initialSpots)
  const [selected, setSelected] = useState<Spot | null>(null)
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '')
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(50)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const filteredSpots = spots.filter((s) => {
    if (filterType !== 'all' && s.type !== filterType) return false
    if (Number(s.pricePerHour) > filterMaxPrice) return false
    return true
  })
  const [viewport, setViewport] = useState({
    ...FRANCE_CENTER,
    zoom: 6,
  })

  // Try to auto-detect user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setViewport({ latitude, longitude, zoom: 13 })
          mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 13, duration: 1500 })
        },
        () => { /* user denied — stay on France view */ }
      )
    }
  }, [])

  // If ?q= is present in URL, geocode it on mount
  useEffect(() => {
    const q = searchParams.get('q')
    if (!q?.trim() || !MAPBOX_TOKEN) return
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&country=fr&language=fr&limit=1`
    )
      .then((res) => res.json())
      .then((data) => {
        const feature = data.features?.[0]
        if (feature) {
          const [lng, lat] = feature.center
          setViewport({ longitude: lng, latitude: lat, zoom: 14 })
          mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 1200 })
        }
      })
      .catch(() => { /* silent */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 3 || !MAPBOX_TOKEN) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    setSearchLoading(true)
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=fr&language=fr&types=address,place,locality,neighborhood&limit=5`
      )
      const data = await res.json()
      const features: MapboxFeature[] = data.features ?? []
      setSuggestions(features)
      setShowSuggestions(features.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  function handleSearchInput(value: string) {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300)
  }

  function handleSuggestionClick(feature: MapboxFeature) {
    const [lng, lat] = feature.center
    setSearchValue(feature.place_name)
    setSuggestions([])
    setShowSuggestions(false)
    setViewport({ longitude: lng, latitude: lat, zoom: 14 })
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 1200 })
  }

  const handleSearchSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!searchValue.trim()) return
      // If we have suggestions, select the first one
      if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[0])
        return
      }
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchValue)}.json?access_token=${MAPBOX_TOKEN}&country=fr&language=fr&limit=1`
        )
        const data = await res.json()
        const feature = data.features?.[0]
        if (feature) {
          const [lng, lat] = feature.center
          setViewport({ longitude: lng, latitude: lat, zoom: 14 })
          mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 1200 })
        }
      } catch {
        // silent fail
      }
      setShowSuggestions(false)
    },
    [searchValue, suggestions]
  )

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN.startsWith('pk.eyJ1...')) {
    return <SpotListFallback spots={spots} />
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full">
      {/* Search overlay */}
      <motion.div
        ref={searchContainerRef}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute left-1/2 top-4 z-10 w-full max-w-md -translate-x-1/2 px-4"
      >
        <motion.form
          onSubmit={handleSearchSubmit}
          whileHover={{ scale: 1.01, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' }}
          className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
        >
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
            placeholder="Rechercher une adresse, une ville..."
            className="flex-1 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
          {searchLoading && (
            <div className="flex items-center pr-2">
              <svg className="h-4 w-4 animate-spin text-[#0540FF]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-3 bg-[#0540FF] text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </motion.button>
        </motion.form>

        {/* Autocomplete suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            {suggestions.map((feature, i) => (
              <button
                key={`${feature.place_name}-${i}`}
                type="button"
                onClick={() => handleSuggestionClick(feature)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
              >
                <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="line-clamp-1">{feature.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Filters */}
      <div className="absolute left-4 top-[72px] z-10 flex flex-wrap gap-2">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm"
        >
          <option value="all">Tous les types</option>
          <option value="outdoor">Exterieur</option>
          <option value="indoor">Interieur</option>
          <option value="garage">Garage</option>
          <option value="covered">Couvert</option>
          <option value="underground">Souterrain</option>
        </select>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <span className="text-xs text-gray-500">Max</span>
          <input
            type="range"
            min={1}
            max={20}
            step={0.5}
            value={filterMaxPrice}
            onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
            className="w-20 accent-[#0540FF]"
          />
          <span className="text-xs font-semibold text-[#1A1A2E]">{filterMaxPrice} EUR/h</span>
        </div>
        <span className="flex items-center rounded-xl bg-white/90 px-2.5 py-1.5 text-xs text-gray-500 shadow-sm border border-gray-200">
          {filteredSpots.length} place{filteredSpots.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Map */}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={viewport}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onClick={() => setSelected(null)}
      >
        <NavigationControl position="bottom-right" />

        {filteredSpots.map((spot) => (
          <Marker
            key={spot.id}
            longitude={Number(spot.longitude)}
            latitude={Number(spot.latitude)}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelected(spot)
            }}
          >
            <PriceMarker
              price={Number(spot.pricePerHour)}
              selected={selected?.id === spot.id}
              onClick={() => setSelected(spot)}
            />
          </Marker>
        ))}

        {selected && (
          <Popup
            longitude={Number(selected.longitude)}
            latitude={Number(selected.latitude)}
            anchor="bottom"
            offset={24}
            closeButton={true}
            closeOnClick={false}
            onClose={() => setSelected(null)}
            className="z-20"
            maxWidth="260px"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="w-60 overflow-hidden rounded-xl bg-white"
            >
              {/* Photo */}
              {selected.photos?.[0] ? (
                <img src={selected.photos[0]} alt={selected.title} className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                  <svg className="h-10 w-10 text-[#0540FF]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
              <div className="p-3">
                <p className="font-semibold text-sm text-[#1A1A2E] line-clamp-1">{selected.title}</p>
                <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{selected.address}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-sm text-[#0540FF]">
                    {Number(selected.pricePerHour).toFixed(2).replace('.', ',')} €/h
                  </span>
                  {selected.rating && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <svg className="h-3 w-3 text-[#F5A623] fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {Number(selected.rating).toFixed(1)}
                    </span>
                  )}
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={`/spot/${selected.id}`}
                    className="mt-3 block w-full rounded-lg bg-[#0540FF] py-2 text-center text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Voir le parking
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </Popup>
        )}
      </Map>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { PriceMarker } from './price-marker'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Star, Zap, X, SlidersHorizontal, Car, Warehouse, Building2, ParkingCircle, ChevronDown } from 'lucide-react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
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
  hasSmartGate?: boolean
  instantBook?: boolean
}

interface SpotMapProps {
  initialSpots: Spot[]
}

const TYPE_LABELS: Record<string, string> = {
  outdoor: 'Exterieur',
  indoor: 'Interieur',
  garage: 'Garage',
  covered: 'Couvert',
  underground: 'Souterrain',
}

const TYPE_ICONS: Record<string, typeof Car> = {
  outdoor: Car,
  indoor: Building2,
  garage: Warehouse,
  covered: Building2,
  underground: ParkingCircle,
}

/* ─── Spot Card for list ─── */
function SpotCard({ spot, isHovered, onHover, onLeave }: {
  spot: Spot
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  return (
    <Link
      href={`/spot/${spot.id}`}
      className={`group block rounded-xl transition-all duration-200 ${isHovered ? 'shadow-md ring-1 ring-gray-200' : 'hover:shadow-md'}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
        {spot.photos?.[0] ? (
          <img
            src={spot.photos[0]}
            alt={spot.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <ParkingCircle className="h-10 w-10 text-gray-200" />
          </div>
        )}
        {/* Price badge */}
        <div className="absolute bottom-2 left-2 rounded-lg bg-white/95 backdrop-blur-sm px-2.5 py-1 text-sm font-bold text-gray-900 shadow-sm">
          {Number(spot.pricePerHour).toFixed(2).replace('.', ',')} €<span className="text-xs font-normal text-gray-500">/h</span>
        </div>
        {/* Type badge */}
        <div className="absolute top-2 left-2 rounded-md bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-gray-700">
          {TYPE_LABELS[spot.type] ?? spot.type}
        </div>
        {/* Smart gate */}
        {spot.hasSmartGate && (
          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0540FF] shadow-sm">
            <Zap className="h-3 w-3 text-white" fill="white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2.5 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{spot.title}</h3>
          {spot.rating && Number(spot.rating) > 0 && (
            <span className="flex items-center gap-1 text-sm shrink-0">
              <Star className="h-3.5 w-3.5 text-gray-900" fill="currentColor" />
              <span className="font-medium text-gray-900">{Number(spot.rating).toFixed(1)}</span>
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-gray-500 line-clamp-1 flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          {spot.address}
        </p>
      </div>
    </Link>
  )
}

/* ─── Filter Chip ─── */
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        active
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  )
}

/* ─── Main component ─── */
export function SpotMap({ initialSpots }: SpotMapProps) {
  const mapRef = useRef<MapRef>(null)
  const searchParams = useSearchParams()
  const [spots, setSpots] = useState<Spot[]>(initialSpots)
  const [selected, setSelected] = useState<Spot | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '')
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(20)
  const [showFilters, setShowFilters] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
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

  async function fetchSpotsNear(lat: number, lng: number) {
    try {
      const res = await fetch('/api/trpc/spots.nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { lat, lng, radiusKm: 30 } }),
      })
      if (!res.ok) return
      const data = await res.json()
      const newSpots = data?.result?.data?.json
      if (Array.isArray(newSpots) && newSpots.length > 0) {
        setSpots((prev) => {
          const ids = new Set(prev.map((s) => s.id))
          const unique = newSpots.filter((s: Spot) => !ids.has(s.id))
          return [...prev, ...unique]
        })
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setViewport({ latitude, longitude, zoom: 13 })
          mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 13, duration: 1500 })
          fetchSpotsNear(latitude, longitude)
        },
        () => {}
      )
    }
  }, [])

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
          fetchSpotsNear(lat, lng)
        }
      })
      .catch(() => {})
  }, [])

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
    fetchSpotsNear(lat, lng)
  }

  const handleSearchSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!searchValue.trim()) return
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
      } catch {}
      setShowSuggestions(false)
    },
    [searchValue, suggestions]
  )

  // When hovering a spot in the list, highlight on map
  function handleSpotHover(spotId: string | null) {
    setHoveredId(spotId)
  }

  // No Mapbox token fallback
  if (!MAPBOX_TOKEN || MAPBOX_TOKEN.startsWith('pk.eyJ1...')) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Carte non disponible. Voici les places disponibles :
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSpots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              isHovered={false}
              onHover={() => {}}
              onLeave={() => {}}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-72px)] w-full">
      {/* ═══ LEFT PANEL: Search + List ═══ */}
      <div className={`w-full lg:w-[55%] xl:w-[50%] flex flex-col border-r border-gray-100 ${mobileView === 'map' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Search bar */}
        <div ref={searchContainerRef} className="relative border-b border-gray-100 px-6 py-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2.5 shadow-sm focus-within:border-gray-300 focus-within:shadow-md transition-all">
              <Search className="h-4 w-4 text-gray-400 shrink-0" strokeWidth={2} />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                placeholder="Rechercher une adresse, une ville..."
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              {searchValue && (
                <button type="button" onClick={() => { setSearchValue(''); setSuggestions([]) }} className="p-0.5">
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                showFilters ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
            </button>
          </form>

          {/* Autocomplete */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-6 right-6 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
              >
                {suggestions.map((feature, i) => (
                  <button
                    key={`${feature.place_name}-${i}`}
                    type="button"
                    onClick={() => handleSuggestionClick(feature)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span className="line-clamp-1">{feature.place_name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-gray-100"
            >
              <div className="px-6 py-3 space-y-3">
                {/* Type filters */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  <FilterChip label="Tous" active={filterType === 'all'} onClick={() => setFilterType('all')} />
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <FilterChip key={key} label={label} active={filterType === key} onClick={() => setFilterType(key)} />
                  ))}
                </div>
                {/* Price slider */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 shrink-0">Prix max</span>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={0.5}
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
                    className="flex-1 accent-[#0540FF] h-1.5"
                  />
                  <span className="text-sm font-semibold text-gray-900 min-w-[60px] text-right">{filterMaxPrice} €/h</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <div className="px-6 py-3 border-b border-gray-50">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filteredSpots.length}</span> place{filteredSpots.length !== 1 ? 's' : ''} disponible{filteredSpots.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Spot list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredSpots.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {filteredSpots.map((spot) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  isHovered={hoveredId === spot.id}
                  onHover={() => handleSpotHover(spot.id)}
                  onLeave={() => handleSpotHover(null)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ParkingCircle className="h-12 w-12 text-gray-200 mb-4" />
              <p className="text-lg font-semibold text-gray-900">Aucune place trouvee</p>
              <p className="mt-1 text-sm text-gray-500">Essayez d&apos;elargir votre recherche ou de modifier les filtres.</p>
              {filterType !== 'all' && (
                <button
                  onClick={() => { setFilterType('all'); setFilterMaxPrice(20) }}
                  className="mt-4 rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Mobile toggle: Carte / Liste ═══ */}
      <div className="lg:hidden fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
        <div className="flex overflow-hidden rounded-full border border-gray-200 bg-white shadow-lg">
          <button
            onClick={() => setMobileView('list')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold transition-colors ${
              mobileView === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapPin className="h-4 w-4" />
            Liste
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold transition-colors ${
              mobileView === 'map' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            Carte
          </button>
        </div>
      </div>

      {/* ═══ RIGHT PANEL: Map ═══ */}
      <div className={`flex-1 relative ${mobileView === 'map' ? 'block' : 'hidden lg:block'}`}>
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={viewport}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          onClick={() => setSelected(null)}
        >
          <NavigationControl position="bottom-right" showCompass={false} />

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
                selected={selected?.id === spot.id || hoveredId === spot.id}
                onClick={() => setSelected(spot)}
              />
            </Marker>
          ))}
        </Map>

        {/* Selected spot popup card */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-6 right-6 z-10 max-w-sm"
            >
              <Link href={`/spot/${selected.id}`} className="block overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
                <div className="flex">
                  {/* Photo */}
                  <div className="h-28 w-28 shrink-0 bg-gray-100">
                    {selected.photos?.[0] ? (
                      <img src={selected.photos[0]} alt={selected.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ParkingCircle className="h-8 w-8 text-gray-200" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 p-3">
                    <p className="font-semibold text-sm text-gray-900 line-clamp-1">{selected.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{selected.address}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-900">
                        {Number(selected.pricePerHour).toFixed(2).replace('.', ',')} €<span className="text-xs font-normal text-gray-500">/h</span>
                      </span>
                      {selected.rating && (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <Star className="h-3 w-3 fill-current" />
                          {Number(selected.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                        {TYPE_LABELS[selected.type] ?? selected.type}
                      </span>
                      {selected.hasSmartGate && (
                        <span className="rounded-md bg-[#0540FF]/5 px-1.5 py-0.5 text-[10px] font-medium text-[#0540FF] flex items-center gap-0.5">
                          <Zap className="h-2.5 w-2.5" /> Smart Gate
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); setSelected(null) }}
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

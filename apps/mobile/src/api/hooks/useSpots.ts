import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { supabase } from '../client'
import { Spot, SpotFilters, SpotType } from '../../types/database'

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const spotKeys = {
  all: ['spots'] as const,
  lists: () => [...spotKeys.all, 'list'] as const,
  list: (filters: object) => [...spotKeys.lists(), filters] as const,
  detail: (id: string) => [...spotKeys.all, 'detail', id] as const,
  nearby: (lat: number, lng: number, radius: number) =>
    [...spotKeys.all, 'nearby', lat, lng, radius] as const,
  search: (query: string, filters: object) =>
    [...spotKeys.all, 'search', query, filters] as const,
}

// ─── Fetch Functions ────────────────────────────────────────────────────────────

async function fetchSpots(category?: SpotType, limit = 20): Promise<Spot[]> {
  let query = supabase
    .from('spots')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (category) {
    query = query.eq('type', category)
  }

  const { data, error } = await query
  if (error) throw new Error(`Impossible de charger les spots: ${error.message}`)
  return data as Spot[]
}

async function fetchSpot(id: string): Promise<Spot> {
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(`Spot introuvable: ${error.message}`)
  return data as Spot
}

async function fetchNearbySpots(lat: number, lng: number, radiusKm = 5): Promise<Spot[]> {
  // Haversine approximation via bounding box then distance filter
  const latDelta = radiusKm / 111.0
  const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180))

  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('status', 'active')
    .gte('latitude', lat - latDelta)
    .lte('latitude', lat + latDelta)
    .gte('longitude', lng - lngDelta)
    .lte('longitude', lng + lngDelta)
    .limit(50)

  if (error) throw new Error(`Impossible de charger les spots proches: ${error.message}`)

  // Refine with actual Haversine distance
  const spots = (data as Spot[]).filter((spot) => {
    const dLat = ((parseFloat(spot.latitude) - lat) * Math.PI) / 180
    const dLng = ((parseFloat(spot.longitude) - lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((parseFloat(spot.latitude) * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return distance <= radiusKm
  })

  return spots
}

async function searchSpots(query: string, filters?: SpotFilters): Promise<Spot[]> {
  let req = supabase
    .from('spots')
    .select('*')
    .eq('status', 'active')
    .or(`title.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`)
    .limit(30)

  if (filters?.type) req = req.eq('type', filters.type)
  if (filters?.minPrice) req = req.gte('price_per_hour', filters.minPrice)
  if (filters?.maxPrice) req = req.lte('price_per_hour', filters.maxPrice)
  if (filters?.instantBook !== undefined) req = req.eq('instant_book', filters.instantBook)
  if (filters?.hasSmartGate !== undefined) req = req.eq('has_smart_gate', filters.hasSmartGate)
  if (filters?.cancellationPolicy) req = req.eq('cancellation_policy', filters.cancellationPolicy)
  if (filters?.sizeCategory) req = req.eq('size_category', filters.sizeCategory)

  const { data, error } = await req
  if (error) throw new Error(`Recherche échouée: ${error.message}`)
  return data as Spot[]
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useSpots(category?: SpotType, limit = 20) {
  return useQuery({
    queryKey: spotKeys.list({ category, limit }),
    queryFn: () => fetchSpots(category, limit),
  })
}

export function useSpot(id: string) {
  return useQuery({
    queryKey: spotKeys.detail(id),
    queryFn: () => fetchSpot(id),
    enabled: Boolean(id),
  })
}

export function useNearbySpots(lat: number, lng: number, radiusKm = 5) {
  return useQuery({
    queryKey: spotKeys.nearby(lat, lng, radiusKm),
    queryFn: () => fetchNearbySpots(lat, lng, radiusKm),
    enabled: Boolean(lat) && Boolean(lng),
  })
}

export function useSearchSpots(query: string, filters?: SpotFilters) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400)
    return () => clearTimeout(timer)
  }, [query])

  return useQuery({
    queryKey: spotKeys.search(debouncedQuery, filters ?? {}),
    queryFn: () => searchSpots(debouncedQuery, filters),
    enabled: debouncedQuery.length >= 2,
  })
}

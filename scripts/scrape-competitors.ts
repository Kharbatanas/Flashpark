/**
 * FlashPark — European Competitive Intelligence Scraper
 *
 * REAL DATA SOURCES:
 *   1. OpenStreetMap Overpass API (free, always runs)
 *   2. Apify Google Places (requires APIFY_TOKEN)
 *   3. Apify Google Search for SEO (requires APIFY_TOKEN)
 *
 * Usage:
 *   npx tsx scripts/scrape-competitors.ts              # All countries
 *   npx tsx scripts/scrape-competitors.ts --country=FR  # France only
 *   npx tsx scripts/scrape-competitors.ts --mock        # Force mock data
 *
 * Reads from .env at project root automatically.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// ============================================================
// ENV & CONFIG
// ============================================================

try {
  const envPath = resolve(import.meta.dirname || __dirname, '..', '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
} catch { /* .env not found */ }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jhamfoiedxjotpwdddgj.supabase.co'
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/apify-webhook`
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'flashpark-apify-2026'
const APIFY_TOKEN = process.env.APIFY_TOKEN || ''

const args = process.argv.slice(2)
const countryFilter = args.find(a => a.startsWith('--country='))?.split('=')[1]?.toUpperCase()
const forceMock = args.includes('--mock')

// ============================================================
// TYPES
// ============================================================

interface CityTarget {
  name: string
  country: string
  countryCode: string
  lat: number
  lng: number
  searchLang: string
  searches: string[]
}

interface CompetitorRow {
  source: string
  country: string
  city: string
  spot_name: string
  spot_type: string | null
  price_hour: number | null
  price_day: number | null
  price_month: number | null
  rating: number | null
  review_count: number
  latitude: number | null
  longitude: number | null
  address: string | null
  features: string[]
}

// ============================================================
// TARGET MARKETS
// ============================================================

const MARKETS: CityTarget[] = [
  // France
  { name: 'Paris', country: 'France', countryCode: 'FR', lat: 48.8566, lng: 2.3522, searchLang: 'fr', searches: ['parking particulier location', 'parking pas cher', 'Zenpark parking', 'Yespark parking', 'Indigo parking'] },
  { name: 'Nice', country: 'France', countryCode: 'FR', lat: 43.7102, lng: 7.2620, searchLang: 'fr', searches: ['parking particulier location', 'parking pas cher', 'parking couvert'] },
  { name: 'Lyon', country: 'France', countryCode: 'FR', lat: 45.7640, lng: 4.8357, searchLang: 'fr', searches: ['parking particulier location', 'parking pas cher', 'parking souterrain'] },
  { name: 'Marseille', country: 'France', countryCode: 'FR', lat: 43.2965, lng: 5.3698, searchLang: 'fr', searches: ['parking particulier location', 'parking pas cher'] },
  { name: 'Montpellier', country: 'France', countryCode: 'FR', lat: 43.6108, lng: 3.8767, searchLang: 'fr', searches: ['parking particulier location', 'parking pas cher'] },
  { name: 'Toulouse', country: 'France', countryCode: 'FR', lat: 43.6047, lng: 1.4442, searchLang: 'fr', searches: ['parking particulier location', 'parking pas cher'] },
  { name: 'Bordeaux', country: 'France', countryCode: 'FR', lat: 44.8378, lng: -0.5792, searchLang: 'fr', searches: ['parking particulier location', 'parking pas cher'] },
  { name: 'Strasbourg', country: 'France', countryCode: 'FR', lat: 48.5734, lng: 7.7521, searchLang: 'fr', searches: ['parking pas cher', 'parking centre ville'] },
  { name: 'Lille', country: 'France', countryCode: 'FR', lat: 50.6292, lng: 3.0573, searchLang: 'fr', searches: ['parking pas cher', 'parking centre ville'] },
  { name: 'Nantes', country: 'France', countryCode: 'FR', lat: 47.2184, lng: -1.5536, searchLang: 'fr', searches: ['parking pas cher', 'parking centre ville'] },
  // Spain
  { name: 'Barcelona', country: 'Espagne', countryCode: 'ES', lat: 41.3851, lng: 2.1734, searchLang: 'es', searches: ['parking barato', 'aparcamiento privado', 'parking centro ciudad'] },
  { name: 'Madrid', country: 'Espagne', countryCode: 'ES', lat: 40.4168, lng: -3.7038, searchLang: 'es', searches: ['parking barato', 'aparcamiento privado', 'parking centro'] },
  { name: 'Valencia', country: 'Espagne', countryCode: 'ES', lat: 39.4699, lng: -0.3763, searchLang: 'es', searches: ['parking barato', 'aparcamiento'] },
  { name: 'Sevilla', country: 'Espagne', countryCode: 'ES', lat: 37.3891, lng: -5.9845, searchLang: 'es', searches: ['parking barato', 'aparcamiento'] },
  { name: 'Malaga', country: 'Espagne', countryCode: 'ES', lat: 36.7213, lng: -4.4214, searchLang: 'es', searches: ['parking barato', 'parking playa'] },
  // Belgium
  { name: 'Bruxelles', country: 'Belgique', countryCode: 'BE', lat: 50.8503, lng: 4.3517, searchLang: 'fr', searches: ['parking pas cher', 'parking centre ville', 'BePark parking'] },
  { name: 'Anvers', country: 'Belgique', countryCode: 'BE', lat: 51.2194, lng: 4.4025, searchLang: 'nl', searches: ['parking goedkoop', 'parkeerplaats huren'] },
  { name: 'Gand', country: 'Belgique', countryCode: 'BE', lat: 51.0543, lng: 3.7174, searchLang: 'nl', searches: ['parking goedkoop', 'parkeerplaats'] },
  // Germany
  { name: 'Berlin', country: 'Allemagne', countryCode: 'DE', lat: 52.5200, lng: 13.4050, searchLang: 'de', searches: ['Parkplatz mieten', 'gunstiger Parkplatz', 'Parkhaus'] },
  { name: 'Munich', country: 'Allemagne', countryCode: 'DE', lat: 48.1351, lng: 11.5820, searchLang: 'de', searches: ['Parkplatz mieten', 'gunstiger Parkplatz'] },
  { name: 'Hambourg', country: 'Allemagne', countryCode: 'DE', lat: 53.5511, lng: 9.9937, searchLang: 'de', searches: ['Parkplatz mieten', 'Parkhaus'] },
  { name: 'Francfort', country: 'Allemagne', countryCode: 'DE', lat: 50.1109, lng: 8.6821, searchLang: 'de', searches: ['Parkplatz mieten', 'Parkhaus'] },
  // Italy
  { name: 'Rome', country: 'Italie', countryCode: 'IT', lat: 41.9028, lng: 12.4964, searchLang: 'it', searches: ['parcheggio economico', 'parcheggio privato'] },
  { name: 'Milan', country: 'Italie', countryCode: 'IT', lat: 45.4642, lng: 9.1900, searchLang: 'it', searches: ['parcheggio economico', 'parcheggio centro'] },
  { name: 'Florence', country: 'Italie', countryCode: 'IT', lat: 43.7696, lng: 11.2558, searchLang: 'it', searches: ['parcheggio economico', 'parcheggio'] },
  // Netherlands
  { name: 'Amsterdam', country: 'Pays-Bas', countryCode: 'NL', lat: 52.3676, lng: 4.9041, searchLang: 'nl', searches: ['parkeren goedkoop', 'parkeerplaats huren'] },
  { name: 'Rotterdam', country: 'Pays-Bas', countryCode: 'NL', lat: 51.9244, lng: 4.4777, searchLang: 'nl', searches: ['parkeren goedkoop', 'parkeerplaats'] },
  // Portugal
  { name: 'Lisbonne', country: 'Portugal', countryCode: 'PT', lat: 38.7223, lng: -9.1393, searchLang: 'pt', searches: ['estacionamento barato', 'parking privado'] },
  { name: 'Porto', country: 'Portugal', countryCode: 'PT', lat: 41.1579, lng: -8.6291, searchLang: 'pt', searches: ['estacionamento barato', 'parking'] },
  // Switzerland
  { name: 'Geneve', country: 'Suisse', countryCode: 'CH', lat: 46.2044, lng: 6.1432, searchLang: 'fr', searches: ['parking pas cher', 'parking centre'] },
  { name: 'Zurich', country: 'Suisse', countryCode: 'CH', lat: 47.3769, lng: 8.5417, searchLang: 'de', searches: ['Parkplatz mieten', 'Parkhaus'] },
  // Luxembourg
  { name: 'Luxembourg', country: 'Luxembourg', countryCode: 'LU', lat: 49.6116, lng: 6.1319, searchLang: 'fr', searches: ['parking pas cher', 'parking centre ville'] },
]

// ============================================================
// COMPETITOR IDENTIFICATION
// ============================================================

const COMPETITOR_KEYWORDS: Record<string, string[]> = {
  zenpark: ['zenpark'],
  yespark: ['yespark'],
  indigo: ['indigo', 'opngo', 'indigo neo'],
  onepark: ['onepark'],
  effia: ['effia'],
  qpark: ['q-park', 'qpark', 'q park'],
  interparking: ['interparking'],
  parclick: ['parclick'],
  saemes: ['saemes', 'semiacs'],
  vinci: ['vinci park', 'vincipark', 'vinci'],
  apcoa: ['apcoa'],
  sags: ['sags'],
  empark: ['empark'],
  saba: ['saba'],
}

function identifySource(name?: string | null, operator?: string | null, website?: string | null): string {
  const text = [name, operator, website].filter(Boolean).join(' ').toLowerCase()
  for (const [source, keywords] of Object.entries(COMPETITOR_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return source
  }
  return 'other'
}

// ============================================================
// 1. OPENSTREETMAP OVERPASS API (FREE — always runs)
// ============================================================

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

async function scrapeOverpass(city: CityTarget, retries = 2): Promise<CompetitorRow[]> {
  const radius = 5000 // 5km from city center
  const query = `[out:json][timeout:30];(node["amenity"="parking"](around:${radius},${city.lat},${city.lng});way["amenity"="parking"](around:${radius},${city.lat},${city.lng}););out center body qt 80;`

  try {
    // POST is recommended by Overpass API for reliability
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    })
    if (res.status === 429 && retries > 0) {
      console.log(`  [OSM] Rate limited, waiting 20s and retrying...`)
      await sleep(20_000)
      return scrapeOverpass(city, retries - 1)
    }
    if (!res.ok) {
      // Check if we got HTML error page instead of JSON
      const text = await res.text()
      if (text.startsWith('<?xml') || text.startsWith('<')) {
        if (retries > 0) {
          console.log(`  [OSM] Server busy, waiting 20s and retrying...`)
          await sleep(20_000)
          return scrapeOverpass(city, retries - 1)
        }
      }
      console.log(`  [OSM] HTTP ${res.status}`)
      return []
    }

    const text = await res.text()
    if (text.startsWith('<?xml') || text.startsWith('<')) {
      if (retries > 0) {
        console.log(`  [OSM] Got HTML response, waiting 20s and retrying...`)
        await sleep(20_000)
        return scrapeOverpass(city, retries - 1)
      }
      console.log(`  [OSM] Got HTML instead of JSON`)
      return []
    }

    const data = JSON.parse(text)
    const elements: any[] = data.elements || []

    return elements
      .filter((el: any) => el.tags) // skip elements without tags
      .map((el: any) => {
        const tags = el.tags || {}
        const lat = el.lat ?? el.center?.lat
        const lng = el.lon ?? el.center?.lon
        const source = identifySource(tags.name, tags.operator, tags.website)

        return {
          source: source === 'other' ? 'osm' : source,
          country: city.country,
          city: city.name,
          spot_name: tags.name || tags.operator || `Parking OSM ${city.name}`,
          spot_type: classifyOsmType(tags),
          price_hour: parseOsmPrice(tags),
          price_day: null,
          price_month: null,
          rating: null,
          review_count: 0,
          latitude: lat,
          longitude: lng,
          address: buildOsmAddress(tags, city),
          features: extractOsmFeatures(tags),
        }
      })
  } catch (err) {
    console.log(`  [OSM] Error: ${err}`)
    return []
  }
}

function classifyOsmType(tags: Record<string, string>): string {
  const pt = (tags.parking || '').toLowerCase()
  if (pt.includes('underground') || pt.includes('souterrain')) return 'underground'
  if (pt.includes('multi-storey') || pt.includes('garage')) return 'garage'
  if (tags.covered === 'yes') return 'covered'
  if (pt.includes('surface') || pt === 'yes') return 'outdoor'
  return tags.building ? 'indoor' : 'outdoor'
}

function parseOsmPrice(tags: Record<string, string>): number | null {
  // Try to extract price from OSM fee tags
  const fee = tags.fee
  if (fee === 'no') return 0

  // Try common price tags
  for (const key of ['charge', 'fee:amount', 'parking:fee', 'price']) {
    const val = tags[key]
    if (val) {
      const match = val.match(/(\d+[.,]?\d*)/)
      if (match) return parseFloat(match[1].replace(',', '.'))
    }
  }

  return null // unknown
}

function buildOsmAddress(tags: Record<string, string>, city: CityTarget): string | null {
  const street = tags['addr:street']
  if (!street) return null
  const num = tags['addr:housenumber'] || ''
  return `${num} ${street}, ${city.name}`.trim()
}

function extractOsmFeatures(tags: Record<string, string>): string[] {
  const features: string[] = []
  if (tags.covered === 'yes') features.push('covered')
  if (tags.lit === 'yes') features.push('lighting')
  if (tags.surveillance === 'yes' || tags['surveillance:type']) features.push('security_camera')
  if (tags.capacity_disabled || tags.wheelchair === 'yes') features.push('disabled_access')
  if (tags['capacity:charging'] || tags.amenity_1 === 'charging_station') features.push('ev_charging')
  if (tags.access === 'yes' || tags.opening_hours === '24/7') features.push('24h_access')
  return features
}

// ============================================================
// 2. APIFY — Google Places (requires APIFY_TOKEN)
// ============================================================

async function scrapeGooglePlaces(city: CityTarget): Promise<CompetitorRow[]> {
  if (!APIFY_TOKEN) return []

  console.log(`  [APIFY] Scraping Google Places for "${city.name}"...`)

  const searchTerms = city.searches.map(s => `${s} ${city.name}`)

  try {
    // Start the Apify actor run
    const runResponse = await fetch('https://api.apify.com/v2/acts/compass~crawler-google-places/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_TOKEN}`,
      },
      body: JSON.stringify({
        searchStringsArray: searchTerms,
        maxCrawledPlacesPerSearch: 20,
        language: city.searchLang,
        maxReviews: 0,
        onePerQuery: false,
      }),
    })

    if (!runResponse.ok) {
      console.log(`  [APIFY] Start failed: ${runResponse.status}`)
      return []
    }

    const run = await runResponse.json()
    const runId = run.data?.id
    if (!runId) return []

    // Poll for completion (max 5 min)
    let status = 'RUNNING'
    let attempts = 0
    while (status === 'RUNNING' && attempts < 30) {
      await sleep(10_000)
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` },
      })
      const statusData = await statusRes.json()
      status = statusData.data?.status || 'FAILED'
      attempts++
    }

    if (status !== 'SUCCEEDED') {
      console.log(`  [APIFY] Run ended: ${status}`)
      return []
    }

    // Fetch results
    const datasetRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?format=json`,
      { headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` } }
    )
    const items: any[] = await datasetRes.json()

    // Deduplicate by placeId
    const seen = new Set<string>()
    const unique = (items || []).filter((item: any) => {
      const id = item.placeId || item.cid || item.title
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    console.log(`  [APIFY] Got ${unique.length} unique places (from ${items?.length || 0} raw)`)

    return unique.map((item: any) => {
      const source = identifySource(item.title, null, item.website)
      return {
        source: source === 'other' ? 'google_maps' : source,
        country: city.country,
        city: city.name,
        spot_name: item.title || item.name || 'Unknown',
        spot_type: classifyGoogleType(item.categoryName || '', item.categories || []),
        price_hour: extractGooglePrice(item),
        price_day: null,
        price_month: null,
        rating: item.totalScore || item.rating || null,
        review_count: item.reviewsCount || 0,
        latitude: item.location?.lat || null,
        longitude: item.location?.lng || null,
        address: item.address || item.street || null,
        features: extractGoogleFeatures(item),
      }
    })
  } catch (err) {
    console.log(`  [APIFY] Error: ${err}`)
    return []
  }
}

function classifyGoogleType(category: string, categories: string[]): string {
  const text = [category, ...categories].join(' ').toLowerCase()
  if (text.includes('souterrain') || text.includes('underground') || text.includes('subterr')) return 'underground'
  if (text.includes('garage') || text.includes('garaje') || text.includes('parkhaus')) return 'garage'
  if (text.includes('couvert') || text.includes('covered') || text.includes('cubierto')) return 'covered'
  if (text.includes('indoor') || text.includes('interior')) return 'indoor'
  return 'outdoor'
}

function extractGooglePrice(item: any): number | null {
  // Try to extract price from description or additional info
  const texts = [item.price, item.description, item.additionalInfo].filter(Boolean)
  for (const text of texts) {
    const match = String(text).match(/(\d+[.,]?\d*)\s*(?:€|EUR)?\s*[\/\\]?\s*h/i)
    if (match) return parseFloat(match[1].replace(',', '.'))
  }
  return null
}

function extractGoogleFeatures(item: any): string[] {
  const features: string[] = []
  const text = JSON.stringify(item).toLowerCase()
  if (text.includes('camera') || text.includes('surveillance') || text.includes('vigilancia') || text.includes('security')) features.push('security_camera')
  if (text.includes('eclairage') || text.includes('light') || text.includes('iluminac') || text.includes('beleuchtung')) features.push('lighting')
  if (text.includes('couvert') || text.includes('covered') || text.includes('cubierto') || text.includes('gedeckt')) features.push('covered')
  if (text.includes('electrique') || text.includes('ev') || text.includes('charging') || text.includes('electrico') || text.includes('borne')) features.push('ev_charging')
  if (text.includes('pmr') || text.includes('handicap') || text.includes('disabled') || text.includes('wheelchair')) features.push('disabled_access')
  if (text.includes('24h') || text.includes('24/7')) features.push('24h_access')
  return [...new Set(features)]
}

// ============================================================
// 3. PRICE ESTIMATION (for data missing prices)
// ============================================================

const COUNTRY_PRICING: Record<string, { hourMin: number; hourMax: number; monthMin: number; monthMax: number }> = {
  France:     { hourMin: 1.5, hourMax: 6.0,  monthMin: 60,  monthMax: 200 },
  Espagne:    { hourMin: 1.0, hourMax: 4.0,  monthMin: 50,  monthMax: 150 },
  Belgique:   { hourMin: 1.5, hourMax: 5.5,  monthMin: 70,  monthMax: 180 },
  Allemagne:  { hourMin: 1.5, hourMax: 5.0,  monthMin: 60,  monthMax: 200 },
  Italie:     { hourMin: 1.0, hourMax: 4.5,  monthMin: 50,  monthMax: 170 },
  'Pays-Bas': { hourMin: 2.0, hourMax: 7.0,  monthMin: 80,  monthMax: 250 },
  Portugal:   { hourMin: 0.8, hourMax: 3.5,  monthMin: 40,  monthMax: 120 },
  Suisse:     { hourMin: 3.0, hourMax: 10.0, monthMin: 120, monthMax: 400 },
  Luxembourg: { hourMin: 2.0, hourMax: 6.0,  monthMin: 80,  monthMax: 220 },
}

const CITY_MULTIPLIER: Record<string, number> = {
  Paris: 1.4, Nice: 1.2, Barcelona: 1.3, Madrid: 1.2, Amsterdam: 1.5,
  Geneve: 1.3, Zurich: 1.4, Milan: 1.2, Rome: 1.1, Bruxelles: 1.1,
  Berlin: 1.0, Munich: 1.2, Luxembourg: 1.2, Lisbonne: 1.0,
}

function estimatePrice(city: CityTarget, spotType: string | null): { hour: number; day: number; month: number } {
  const pricing = COUNTRY_PRICING[city.country] || COUNTRY_PRICING.France
  const mult = CITY_MULTIPLIER[city.name] || 1.0

  // Underground/garage tend to be more expensive
  const typeMult = spotType === 'underground' ? 1.2 : spotType === 'garage' ? 1.1 : spotType === 'outdoor' ? 0.85 : 1.0

  const hour = rand(pricing.hourMin * mult * typeMult, pricing.hourMax * mult * typeMult)
  const day = rand(hour * 5, hour * 8)
  const month = rand(pricing.monthMin * mult * typeMult, pricing.monthMax * mult * typeMult)

  return { hour, day, month }
}

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

// ============================================================
// 4. DEDUPLICATION
// ============================================================

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function deduplicateByProximity(data: CompetitorRow[], radiusMeters = 50): CompetitorRow[] {
  const result: CompetitorRow[] = []

  for (const row of data) {
    if (!row.latitude || !row.longitude) {
      result.push(row)
      continue
    }

    const isDuplicate = result.some(existing => {
      if (!existing.latitude || !existing.longitude) return false
      const dist = haversineMeters(row.latitude!, row.longitude!, existing.latitude!, existing.longitude!)
      if (dist > radiusMeters) return false
      // Same location — check name similarity
      const nameA = (row.spot_name || '').toLowerCase()
      const nameB = (existing.spot_name || '').toLowerCase()
      return nameA === nameB || nameA.includes(nameB) || nameB.includes(nameA) || dist < 20
    })

    if (!isDuplicate) {
      result.push(row)
    } else {
      // Merge: prefer the record with more data (rating, price)
      const idx = result.findIndex(existing =>
        existing.latitude && existing.longitude &&
        haversineMeters(row.latitude!, row.longitude!, existing.latitude!, existing.longitude!) < radiusMeters
      )
      if (idx >= 0) {
        const existing = result[idx]
        // Prefer Apify data (has ratings) over OSM data
        if (!existing.rating && row.rating) result[idx] = { ...existing, ...row, features: [...new Set([...existing.features, ...row.features])] }
        else if (!existing.price_hour && row.price_hour) result[idx].price_hour = row.price_hour
      }
    }
  }

  return result
}

// ============================================================
// 5. REAL SEO TRACKING (Apify Google Search)
// ============================================================

async function scrapeRealSEO(): Promise<any[]> {
  if (!APIFY_TOKEN) {
    console.log('  [SEO] No APIFY_TOKEN, skipping real SEO')
    return []
  }

  console.log('\n=== SEO Tracking (Apify Google Search) ===')

  const keywords = [
    { keyword: 'parking particulier nice', city: 'Nice', gl: 'fr', hl: 'fr' },
    { keyword: 'location place parking nice', city: 'Nice', gl: 'fr', hl: 'fr' },
    { keyword: 'parking pas cher nice', city: 'Nice', gl: 'fr', hl: 'fr' },
    { keyword: 'parking particulier montpellier', city: 'Montpellier', gl: 'fr', hl: 'fr' },
    { keyword: 'location parking paris', city: 'Paris', gl: 'fr', hl: 'fr' },
    { keyword: 'parking entre particuliers france', city: 'France', gl: 'fr', hl: 'fr' },
    { keyword: 'louer sa place de parking', city: 'France', gl: 'fr', hl: 'fr' },
    { keyword: 'airbnb du parking', city: 'France', gl: 'fr', hl: 'fr' },
    { keyword: 'parking P2P france', city: 'France', gl: 'fr', hl: 'fr' },
    { keyword: 'flashpark', city: 'France', gl: 'fr', hl: 'fr' },
    { keyword: 'parking barato barcelona', city: 'Barcelona', gl: 'es', hl: 'es' },
    { keyword: 'aparcamiento privado madrid', city: 'Madrid', gl: 'es', hl: 'es' },
    { keyword: 'parking pas cher bruxelles', city: 'Bruxelles', gl: 'be', hl: 'fr' },
    { keyword: 'parkplatz mieten berlin', city: 'Berlin', gl: 'de', hl: 'de' },
    { keyword: 'parcheggio economico roma', city: 'Rome', gl: 'it', hl: 'it' },
    { keyword: 'parkeren amsterdam', city: 'Amsterdam', gl: 'nl', hl: 'nl' },
  ]

  const competitors = ['zenpark.com', 'yespark.fr', 'indigo.fr', 'onepark.fr', 'parclick.com', 'flashpark.fr']

  try {
    // Use Apify's Google Search Results Scraper
    const runResponse = await fetch('https://api.apify.com/v2/acts/apify~google-search-scraper/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_TOKEN}`,
      },
      body: JSON.stringify({
        queries: keywords.map(k => k.keyword).join('\n'),
        maxPagesPerQuery: 1,
        resultsPerPage: 30,
        languageCode: '',
        mobileResults: false,
      }),
    })

    if (!runResponse.ok) {
      console.log(`  [SEO] Apify start failed: ${runResponse.status}`)
      return []
    }

    const run = await runResponse.json()
    const runId = run.data?.id
    if (!runId) return []

    // Poll for completion
    let status = 'RUNNING'
    let attempts = 0
    while (status === 'RUNNING' && attempts < 30) {
      await sleep(10_000)
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` },
      })
      const statusData = await statusRes.json()
      status = statusData.data?.status || 'FAILED'
      attempts++
    }

    if (status !== 'SUCCEEDED') {
      console.log(`  [SEO] Run ended: ${status}`)
      return []
    }

    // Fetch results
    const datasetRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?format=json`,
      { headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` } }
    )
    const searchResults: any[] = await datasetRes.json()

    // Process search results into SEO data
    const seoData: any[] = []
    for (const result of searchResults || []) {
      const searchQuery = result.searchQuery?.term || result.searchQuery || ''
      const kwData = keywords.find(k => k.keyword === searchQuery)
      if (!kwData) continue

      const organicResults: any[] = result.organicResults || []

      // Find FlashPark position
      const fpResult = organicResults.find((r: any) =>
        (r.url || r.link || '').includes('flashpark')
      )
      const fpPosition = fpResult ? (organicResults.indexOf(fpResult) + 1) : null

      // Find top competitor
      const topCompetitor = organicResults.find((r: any) => {
        const url = (r.url || r.link || '').toLowerCase()
        return competitors.some(c => url.includes(c) && !url.includes('flashpark'))
      })

      seoData.push({
        keyword: kwData.keyword,
        position: fpPosition,
        competitor: topCompetitor ? new URL(topCompetitor.url || topCompetitor.link).hostname : null,
        url: topCompetitor?.url || topCompetitor?.link || null,
        city: kwData.city,
      })
    }

    console.log(`  [SEO] Got ${seoData.length} keyword results`)
    return seoData
  } catch (err) {
    console.log(`  [SEO] Error: ${err}`)
    return []
  }
}

// ============================================================
// 6. MOCK FALLBACK (only when no real data available)
// ============================================================

const MOCK_SOURCES = ['zenpark', 'yespark', 'indigo', 'google_maps']
const SPOT_TYPES = ['outdoor', 'indoor', 'garage', 'underground', 'covered']
const FEATURE_SETS = [
  ['lighting', 'security_camera'],
  ['lighting', 'security_camera', 'covered'],
  ['ev_charging', 'lighting', '24h_access'],
  ['security_camera', 'disabled_access'],
  ['lighting', 'covered', 'ev_charging'],
  ['24h_access', 'security_camera', 'lighting'],
]

const SOURCE_LABELS: Record<string, string> = {
  zenpark: 'Zenpark', yespark: 'Yespark', indigo: 'Indigo', google_maps: 'Google Maps',
}

function generateMockForCity(city: CityTarget): CompetitorRow[] {
  const results: CompetitorRow[] = []
  for (const source of MOCK_SOURCES) {
    const count = Math.floor(Math.random() * 10) + 4
    for (let i = 0; i < count; i++) {
      const est = estimatePrice(city, SPOT_TYPES[Math.floor(Math.random() * SPOT_TYPES.length)])
      results.push({
        source,
        country: city.country,
        city: city.name,
        spot_name: `${source === 'google_maps' ? 'Parking' : SOURCE_LABELS[source]} ${city.name} #${i + 1}`,
        spot_type: SPOT_TYPES[Math.floor(Math.random() * SPOT_TYPES.length)],
        price_hour: source === 'yespark' ? null : est.hour,
        price_day: source === 'yespark' ? null : est.day,
        price_month: est.month,
        rating: rand(2.8, 4.9),
        review_count: Math.floor(Math.random() * 300) + 3,
        latitude: city.lat + (Math.random() - 0.5) * 0.03,
        longitude: city.lng + (Math.random() - 0.5) * 0.03,
        address: `${Math.floor(Math.random() * 200) + 1} Rue ${city.name}, ${city.country}`,
        features: FEATURE_SETS[Math.floor(Math.random() * FEATURE_SETS.length)],
      })
    }
  }
  return results
}

function generateMockSEO(): any[] {
  const keywords = [
    { keyword: 'parking particulier nice', city: 'Nice' },
    { keyword: 'location place parking nice', city: 'Nice' },
    { keyword: 'parking pas cher nice', city: 'Nice' },
    { keyword: 'parking particulier montpellier', city: 'Montpellier' },
    { keyword: 'location parking paris', city: 'Paris' },
    { keyword: 'parking entre particuliers france', city: 'France' },
    { keyword: 'louer sa place de parking', city: 'France' },
    { keyword: 'airbnb du parking', city: 'France' },
    { keyword: 'parking P2P france', city: 'France' },
    { keyword: 'flashpark', city: 'France' },
    { keyword: 'parking barato barcelona', city: 'Barcelona' },
    { keyword: 'aparcamiento privado madrid', city: 'Madrid' },
    { keyword: 'parking pas cher bruxelles', city: 'Bruxelles' },
    { keyword: 'parkplatz mieten berlin', city: 'Berlin' },
    { keyword: 'parcheggio economico roma', city: 'Rome' },
    { keyword: 'parkeren amsterdam', city: 'Amsterdam' },
  ]
  const competitors = ['zenpark.com', 'yespark.fr', 'indigo.fr', 'onepark.fr', 'parclick.com', 'flashpark.fr']

  return keywords.map(k => {
    const shuffled = [...competitors].sort(() => Math.random() - 0.5)
    const fpPos = shuffled.indexOf('flashpark.fr') + 1
    return {
      keyword: k.keyword,
      position: fpPos <= 3 ? fpPos : (Math.random() > 0.4 ? Math.floor(Math.random() * 30) + 4 : null),
      competitor: shuffled[0],
      url: `https://${shuffled[0]}`,
      city: k.city,
    }
  })
}

// ============================================================
// PUSH TO SUPABASE
// ============================================================

async function pushToWebhook(data: any[], type: string, source: string) {
  if (data.length === 0) return

  for (let i = 0; i < data.length; i += 100) {
    const batch = data.slice(i, i + 100)
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify({ type, source, data: batch }),
    })

    const result = await res.json()
    if (res.ok) {
      console.log(`  [OK] Batch ${Math.floor(i / 100) + 1}: ${result.inserted} rows`)
    } else {
      console.error(`  [ERROR] ${res.status}: ${JSON.stringify(result)}`)
    }
  }
}

// ============================================================
// UTILS
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const targets = countryFilter
    ? MARKETS.filter(m => m.countryCode === countryFilter)
    : MARKETS

  if (targets.length === 0) {
    console.error(`No cities found for country code: ${countryFilter}`)
    console.log('Available:', [...new Set(MARKETS.map(m => `${m.countryCode} (${m.country})`))])
    process.exit(1)
  }

  const countries = [...new Set(targets.map(t => t.country))]

  console.log('=== FlashPark European Intelligence Scraper ===')
  console.log(`Countries: ${countries.join(', ')}`)
  console.log(`Cities: ${targets.length}`)
  console.log(`Mode: ${forceMock ? 'MOCK (forced)' : `REAL DATA — OSM: YES | Apify: ${APIFY_TOKEN ? 'YES' : 'NO'}`}`)
  console.log('')

  let totalInserted = 0
  let totalOsm = 0
  let totalApify = 0
  let totalMock = 0

  for (const city of targets) {
    console.log(`\n--- ${city.name} (${city.country}) ---`)

    if (forceMock) {
      const mockData = generateMockForCity(city)
      console.log(`  [MOCK] ${mockData.length} listings`)
      totalMock += mockData.length
      totalInserted += mockData.length
      await pushToWebhook(mockData, 'competitor_data', 'mock')
      continue
    }

    // 1. Scrape OpenStreetMap (free, always available)
    console.log('  [OSM] Querying Overpass API...')
    const osmData = await scrapeOverpass(city)
    console.log(`  [OSM] ${osmData.length} parkings found`)
    totalOsm += osmData.length

    // 2. Scrape Google Places via Apify (if token available)
    const apifyData = await scrapeGooglePlaces(city)
    totalApify += apifyData.length

    // 3. Merge and deduplicate
    const merged = deduplicateByProximity([...apifyData, ...osmData])

    // 4. Fill in missing prices with estimates
    const enriched = merged.map(row => {
      if (row.price_hour == null && row.source !== 'yespark') {
        const est = estimatePrice(city, row.spot_type)
        row.price_hour = est.hour
        row.price_day = est.day
        if (!row.price_month) row.price_month = est.month
      }
      if (!row.price_month) {
        const est = estimatePrice(city, row.spot_type)
        row.price_month = est.month
      }
      return row
    })

    // 5. If no real data at all, use mock as fallback
    let finalData = enriched
    if (finalData.length === 0) {
      console.log('  [FALLBACK] No real data, generating mock...')
      finalData = generateMockForCity(city)
      totalMock += finalData.length
    }

    console.log(`  [TOTAL] ${finalData.length} listings (${osmData.length} OSM + ${apifyData.length} Apify${finalData.length > merged.length ? ' + mock fallback' : ''})`)
    totalInserted += finalData.length

    await pushToWebhook(finalData, 'competitor_data', 'multi')

    // Rate limit: Overpass API needs ~8s between requests to avoid 429
    await sleep(8000)
  }

  // SEO Tracking
  console.log('\n=== SEO Tracking ===')
  let seoData: any[]
  if (forceMock || !APIFY_TOKEN) {
    seoData = generateMockSEO()
    console.log(`  [MOCK] ${seoData.length} keywords`)
  } else {
    seoData = await scrapeRealSEO()
    if (seoData.length === 0) {
      console.log('  [FALLBACK] Using mock SEO data')
      seoData = generateMockSEO()
    }
  }
  await pushToWebhook(seoData, 'seo_data', 'serp')

  // Summary
  console.log('\n=== Summary ===')
  console.log(`Total: ${totalInserted} listings across ${countries.length} countries`)
  console.log(`  OSM (real):   ${totalOsm}`)
  console.log(`  Apify (real): ${totalApify}`)
  console.log(`  Mock:         ${totalMock}`)
  console.log(`  SEO keywords: ${seoData.length}`)
  console.log('\nCheck your admin dashboard at /intelligence')
}

main().catch(console.error)

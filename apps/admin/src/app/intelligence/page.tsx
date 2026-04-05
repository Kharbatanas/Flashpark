import { createSupabaseServerClient } from '../../lib/supabase/server'
import { Sidebar } from '../../components/sidebar'
import { IntelligenceFilters } from './filters'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

const SOURCE_COLORS: Record<string, string> = {
  zenpark: 'bg-purple-100 text-purple-700',
  yespark: 'bg-blue-100 text-blue-700',
  indigo: 'bg-amber-100 text-amber-700',
  google_maps: 'bg-emerald-100 text-emerald-700',
  onepark: 'bg-rose-100 text-rose-700',
  unknown: 'bg-gray-100 text-gray-600',
}

const SOURCE_LABELS: Record<string, string> = {
  zenpark: 'Zenpark', yespark: 'Yespark', indigo: 'Indigo',
  google_maps: 'Google Maps', onepark: 'Onepark',
}

const COUNTRY_FLAGS: Record<string, string> = {
  France: '🇫🇷', Espagne: '🇪🇸', Belgique: '🇧🇪', Allemagne: '🇩🇪',
  Italie: '🇮🇹', 'Pays-Bas': '🇳🇱', Portugal: '🇵🇹', Suisse: '🇨🇭', Luxembourg: '🇱🇺',
}

function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return '—'
  return Number(n).toFixed(2).replace('.', ',') + ' €'
}

function pct(a: number, b: number): number {
  return b > 0 ? Math.round((1 - a / b) * 100) : 0
}

interface Props {
  searchParams: Promise<{ country?: string; city?: string; source?: string }>
}

export default async function IntelligencePage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = createSupabaseServerClient()

  // Fetch ALL data (unfiltered) for global stats
  const [
    { data: allCompetitors },
    { data: allSummaries },
    { data: seoData },
    { data: flashparkSpots },
  ] = await Promise.all([
    supabase.from('competitor_data').select('*').order('scraped_at', { ascending: false }).limit(5000),
    supabase.from('market_summary').select('*').order('date', { ascending: false }).limit(200),
    supabase.from('seo_tracking').select('*').order('scraped_at', { ascending: false }).limit(200),
    supabase.from('spots').select('id, price_per_hour, city, status').eq('status', 'active'),
  ])

  const all = allCompetitors ?? []
  const summaries = allSummaries ?? []
  const seo = seoData ?? []
  const ourSpots = flashparkSpots ?? []

  // Available filter options
  const allCountries = [...new Set(all.map(c => c.country).filter(Boolean))].sort()
  const allCities = params.country
    ? [...new Set(all.filter(c => c.country === params.country).map(c => c.city))].sort()
    : [...new Set(all.map(c => c.city))].sort()
  const allSources = [...new Set(all.map(c => c.source))].sort()

  // Apply filters
  let filtered = all
  if (params.country) filtered = filtered.filter(c => c.country === params.country)
  if (params.city) filtered = filtered.filter(c => c.city === params.city)
  if (params.source) filtered = filtered.filter(c => c.source === params.source)

  // ---- GLOBAL KPIs (across all data) ----
  const totalGlobal = all.length
  const countriesCount = allCountries.length
  const citiesCount = [...new Set(all.map(c => c.city))].length

  // ---- FILTERED KPIs ----
  const totalFiltered = filtered.length
  const filteredPricesH = filtered.map(c => Number(c.price_hour)).filter(p => p > 0)
  const avgPrice = filteredPricesH.length > 0 ? filteredPricesH.reduce((a, b) => a + b, 0) / filteredPricesH.length : 0
  const minPrice = filteredPricesH.length > 0 ? Math.min(...filteredPricesH) : 0
  const maxPrice = filteredPricesH.length > 0 ? Math.max(...filteredPricesH) : 0

  const filteredPricesM = filtered.map(c => Number(c.price_month)).filter(p => p > 0)
  const avgMonthly = filteredPricesM.length > 0 ? filteredPricesM.reduce((a, b) => a + b, 0) / filteredPricesM.length : 0

  const filteredRatings = filtered.map(c => Number(c.rating)).filter(r => r > 0)
  const avgRating = filteredRatings.length > 0 ? filteredRatings.reduce((a, b) => a + b, 0) / filteredRatings.length : 0

  // Our avg price
  const ourPrices = ourSpots.map(s => Number(s.price_per_hour)).filter(p => p > 0)
  const ourAvg = ourPrices.length > 0 ? ourPrices.reduce((a, b) => a + b, 0) / ourPrices.length : 0
  const priceAdv = avgPrice > 0 && ourAvg > 0 ? pct(ourAvg, avgPrice) : 0

  // ---- COUNTRY BREAKDOWN ----
  const countryStats = allCountries.map(country => {
    const rows = all.filter(c => c.country === country)
    const prices = rows.map(c => Number(c.price_hour)).filter(p => p > 0)
    const ratings = rows.map(c => Number(c.rating)).filter(r => r > 0)
    const cities = [...new Set(rows.map(c => c.city))]
    return {
      country,
      flag: COUNTRY_FLAGS[country] || '🏳️',
      listings: rows.length,
      cities: cities.length,
      avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
    }
  }).sort((a, b) => b.listings - a.listings)

  // ---- SOURCE BREAKDOWN ----
  const sourceStats = allSources.map(source => {
    const rows = filtered.filter(c => c.source === source)
    const prices = rows.map(c => Number(c.price_hour)).filter(p => p > 0)
    return {
      source,
      count: rows.length,
      avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      pct: totalFiltered > 0 ? Math.round((rows.length / totalFiltered) * 100) : 0,
    }
  }).sort((a, b) => b.count - a.count)

  // ---- CITY PRICE RANKING ----
  const filteredCities = [...new Set(filtered.map(c => c.city))]
  const cityRanking = filteredCities.map(city => {
    const rows = filtered.filter(c => c.city === city)
    const prices = rows.map(c => Number(c.price_hour)).filter(p => p > 0)
    const country = rows[0]?.country || ''
    const ourCity = ourSpots.filter(s => s.city?.toLowerCase() === city.toLowerCase())
    const ourCityPrices = ourCity.map(s => Number(s.price_per_hour)).filter(p => p > 0)
    return {
      city,
      country,
      flag: COUNTRY_FLAGS[country] || '',
      listings: rows.length,
      avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      ourAvg: ourCityPrices.length > 0 ? ourCityPrices.reduce((a, b) => a + b, 0) / ourCityPrices.length : null,
      ourCount: ourCity.length,
    }
  }).sort((a, b) => b.avgPrice - a.avgPrice)

  // Price bar max for chart
  const maxBarPrice = Math.max(...cityRanking.map(c => c.maxPrice), 1)

  // ---- TOP 15 cheapest ----
  const cheapest = [...filtered]
    .filter(c => c.price_hour && Number(c.price_hour) > 0)
    .sort((a, b) => Number(a.price_hour) - Number(b.price_hour))
    .slice(0, 15)

  // ---- TOP 10 rated ----
  const topRated = [...filtered]
    .filter(c => c.rating && Number(c.rating) > 0)
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .slice(0, 10)

  // ---- SEO ----
  const topSeo = seo
    .filter(s => s.position != null)
    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
    .slice(0, 20)
  const seoTop10 = seo.filter(s => s.position != null && s.position <= 10).length
  const seoTotal = [...new Set(seo.map(s => s.keyword))].length

  // ---- LAST SCRAPE ----
  const lastScrape = all.length > 0
    ? new Date(all[0].scraped_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Jamais'

  const isFiltered = params.country || params.city || params.source
  const filterLabel = [params.country, params.city, params.source].filter(Boolean).join(' > ') || 'Europe'

  return (
    <>
      <Sidebar />
      <main className="ml-60 min-h-screen bg-[#F8FAFC] p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[#1A1A2E] flex items-center gap-2">
                🕵️ Veille Concurrentielle
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Intelligence de marche europeenne — {lastScrape}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="rounded-xl bg-[#0540FF] px-4 py-2 shadow-md shadow-blue-200">
                <span className="text-xs text-blue-200">Total </span>
                <span className="font-extrabold text-white">{totalGlobal.toLocaleString()}</span>
                <span className="text-xs text-blue-200"> annonces</span>
              </div>
              <div className="rounded-xl bg-white px-4 py-2 border border-gray-100 shadow-sm text-sm">
                <span className="font-bold text-[#1A1A2E]">{countriesCount}</span>
                <span className="text-gray-400"> pays</span>
              </div>
              <div className="rounded-xl bg-white px-4 py-2 border border-gray-100 shadow-sm text-sm">
                <span className="font-bold text-[#1A1A2E]">{citiesCount}</span>
                <span className="text-gray-400"> villes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Suspense fallback={null}>
          <IntelligenceFilters countries={allCountries} cities={allCities} sources={allSources} />
        </Suspense>

        {/* Context label */}
        {isFiltered && (
          <div className="mb-4 text-sm font-medium text-gray-500">
            Donnees filtrees : <span className="font-bold text-[#1A1A2E]">{filterLabel}</span>
            <span className="ml-2 text-gray-400">({totalFiltered} annonces)</span>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <KpiCard emoji="🔍" label="Annonces" value={totalFiltered.toLocaleString()} sub={`${filteredPricesH.length} avec prix/h`} />
          <KpiCard emoji="💰" label="Prix moy /h" value={fmt(avgPrice)} sub={`Min ${fmt(minPrice)} — Max ${fmt(maxPrice)}`} color="text-amber-600" />
          <KpiCard emoji="📅" label="Prix moy /mois" value={fmt(avgMonthly)} sub={`${filteredPricesM.length} annonces`} color="text-purple-600" />
          <KpiCard emoji="⭐" label="Note moyenne" value={avgRating > 0 ? avgRating.toFixed(1) + '/5' : '—'} sub={`${filteredRatings.length} avec note`} color="text-amber-500" />
          <KpiCard emoji="⚡" label="FlashPark" value={fmt(ourAvg) + '/h'} sub={`${ourSpots.length} annonces actives`} color="text-[#0540FF]" />
          <KpiCard
            emoji={priceAdv > 0 ? '✅' : priceAdv < 0 ? '⚠️' : '➖'}
            label="Ecart prix"
            value={priceAdv === 0 ? '—' : `${priceAdv > 0 ? '-' : '+'}${Math.abs(priceAdv)}%`}
            sub={priceAdv > 0 ? 'Moins cher' : priceAdv < 0 ? 'Plus cher' : 'Pas de donnees'}
            color={priceAdv > 0 ? 'text-emerald-600' : priceAdv < 0 ? 'text-red-500' : 'text-gray-400'}
          />
        </div>

        {/* Country Overview + Source Breakdown */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Country map */}
          <div className="col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Vue par pays</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 text-gray-400 font-medium text-xs uppercase">Pays</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium text-xs uppercase">Villes</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium text-xs uppercase">Annonces</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium text-xs uppercase">Min /h</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium text-xs uppercase">Moy /h</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium text-xs uppercase">Max /h</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium text-xs uppercase">Note</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium text-xs uppercase">Part</th>
                  </tr>
                </thead>
                <tbody>
                  {countryStats.map(cs => {
                    const share = totalGlobal > 0 ? Math.round((cs.listings / totalGlobal) * 100) : 0
                    return (
                      <tr key={cs.country} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-2 font-bold text-[#1A1A2E]">
                          <span className="mr-1.5">{cs.flag}</span>{cs.country}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600">{cs.cities}</td>
                        <td className="py-3 px-2 text-center font-bold text-[#1A1A2E]">{cs.listings}</td>
                        <td className="py-3 px-2 text-center text-emerald-600 font-medium">{fmt(cs.minPrice)}</td>
                        <td className="py-3 px-2 text-center font-bold">{fmt(cs.avgPrice)}</td>
                        <td className="py-3 px-2 text-center text-red-500 font-medium">{fmt(cs.maxPrice)}</td>
                        <td className="py-3 px-2 text-center">
                          {cs.avgRating > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="text-amber-500 text-xs">★</span>
                              <span className="font-medium">{cs.avgRating.toFixed(1)}</span>
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full bg-[#0540FF]" style={{ width: `${share}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-500 w-8">{share}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Source breakdown */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Sources</h2>
            <div className="space-y-4">
              {sourceStats.map(s => (
                <div key={s.source}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${SOURCE_COLORS[s.source] || SOURCE_COLORS.unknown}`}>
                      {SOURCE_LABELS[s.source] || s.source}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#1A1A2E]">{s.count}</span>
                      <span className="text-xs text-gray-400 ml-1">({s.pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#0540FF] to-blue-400 transition-all" style={{ width: `${s.pct}%` }} />
                  </div>
                  {s.avgPrice > 0 && (
                    <p className="text-[11px] text-gray-400 mt-1">Moy: {fmt(s.avgPrice)}/h</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* City Price Chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-8">
          <h2 className="text-base font-bold text-[#1A1A2E] mb-1">Prix par ville — Comparatif visuel</h2>
          <p className="text-xs text-gray-400 mb-5">Barre = fourchette min-max, point = prix moyen concurrent, losange bleu = FlashPark</p>
          <div className="space-y-2.5">
            {cityRanking.slice(0, 20).map(c => {
              const minPct = (c.minPrice / maxBarPrice) * 100
              const maxPct = (c.maxPrice / maxBarPrice) * 100
              const avgPct = (c.avgPrice / maxBarPrice) * 100
              const ourPct = c.ourAvg ? (c.ourAvg / maxBarPrice) * 100 : null
              return (
                <div key={c.city} className="flex items-center gap-3">
                  <div className="w-28 flex-shrink-0 text-right">
                    <span className="text-xs mr-1">{c.flag}</span>
                    <span className="text-xs font-bold text-[#1A1A2E]">{c.city}</span>
                  </div>
                  <div className="flex-1 relative h-5">
                    {/* Background */}
                    <div className="absolute inset-0 rounded-full bg-gray-50" />
                    {/* Range bar */}
                    <div
                      className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-emerald-200 to-red-200"
                      style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
                    />
                    {/* Avg dot */}
                    <div
                      className="absolute top-0 w-5 h-5 rounded-full bg-amber-400 border-2 border-white shadow-sm flex items-center justify-center"
                      style={{ left: `calc(${avgPct}% - 10px)` }}
                      title={`Moy: ${fmt(c.avgPrice)}`}
                    >
                      <span className="text-[8px] font-bold text-white">M</span>
                    </div>
                    {/* FlashPark dot */}
                    {ourPct && (
                      <div
                        className="absolute top-0 w-5 h-5 rounded-sm rotate-45 bg-[#0540FF] border-2 border-white shadow-md"
                        style={{ left: `calc(${ourPct}% - 10px)` }}
                        title={`FlashPark: ${fmt(c.ourAvg!)}`}
                      />
                    )}
                  </div>
                  <div className="w-24 flex-shrink-0 text-right">
                    <span className="text-xs font-bold text-[#1A1A2E]">{fmt(c.avgPrice)}</span>
                    <span className="text-[10px] text-gray-400">/h</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* SEO Rankings */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#1A1A2E]">SEO — Positions Google</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                {seoTop10}/{seoTotal} top 10
              </span>
            </div>
            {topSeo.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnee SEO</p>
            ) : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {topSeo.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold flex-shrink-0 ${
                      (s.position ?? 99) <= 3 ? 'bg-emerald-100 text-emerald-700'
                      : (s.position ?? 99) <= 10 ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                    }`}>
                      #{s.position ?? '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A2E] truncate">{s.keyword}</p>
                      {s.competitor && <p className="text-[11px] text-gray-400">#1 : {s.competitor}</p>}
                    </div>
                    {s.city && (
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full flex-shrink-0">{s.city}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Rated */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Top concurrents (note)</h2>
            {topRated.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnee</p>
            ) : (
              <div className="space-y-1.5">
                {topRated.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-extrabold text-gray-300 w-5 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A2E] truncate">{c.spot_name || 'Sans nom'}</p>
                      <p className="text-[11px] text-gray-400">{COUNTRY_FLAGS[c.country] || ''} {c.city}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} className={`text-xs ${Number(c.rating) >= s ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                      <span className="text-sm font-bold text-[#1A1A2E]">{Number(c.rating).toFixed(1)}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${SOURCE_COLORS[c.source] || SOURCE_COLORS.unknown}`}>
                      {SOURCE_LABELS[c.source] || c.source}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Full Cheapest Table */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-8">
          <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Concurrents les moins chers</h2>
          {cheapest.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnee</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 text-gray-400 font-medium text-xs uppercase">#</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium text-xs uppercase">Nom</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium text-xs uppercase">Ville</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium text-xs uppercase">Pays</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium text-xs uppercase">Source</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium text-xs uppercase">Prix /h</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium text-xs uppercase">Prix /mois</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium text-xs uppercase">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {cheapest.map((c, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 px-2 font-bold text-gray-300">{i + 1}</td>
                      <td className="py-2.5 px-2 font-medium text-[#1A1A2E] max-w-[180px] truncate">{c.spot_name || '—'}</td>
                      <td className="py-2.5 px-2 text-gray-600">{c.city}</td>
                      <td className="py-2.5 px-2">{COUNTRY_FLAGS[c.country] || ''} {c.country}</td>
                      <td className="py-2.5 px-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SOURCE_COLORS[c.source] || SOURCE_COLORS.unknown}`}>
                          {SOURCE_LABELS[c.source] || c.source}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-600">{fmt(c.price_hour)}</td>
                      <td className="py-2.5 px-2 text-right text-gray-600">{fmt(c.price_month)}</td>
                      <td className="py-2.5 px-2 text-center">
                        {c.rating ? <span className="font-medium">★ {Number(c.rating).toFixed(1)}</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-5">
          <h3 className="text-sm font-bold text-[#1A1A2E] mb-3">Mettre a jour les donnees</h3>
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
            <div>
              <p className="font-medium text-gray-700 mb-1">Toute l'Europe</p>
              <code className="block bg-gray-100 rounded-lg p-2 text-[11px] font-mono">npx tsx scripts/scrape-competitors.ts</code>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Un pays specifique</p>
              <code className="block bg-gray-100 rounded-lg p-2 text-[11px] font-mono">npx tsx scripts/scrape-competitors.ts --country=ES</code>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Codes pays</p>
              <p className="text-[11px]">FR (France), ES (Espagne), BE (Belgique), DE (Allemagne), IT (Italie), NL (Pays-Bas), PT (Portugal), CH (Suisse), LU (Luxembourg)</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

// ---- Reusable KPI Card ----
function KpiCard({ emoji, label, value, sub, color }: {
  emoji: string; label: string; value: string; sub: string; color?: string
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{emoji}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-extrabold ${color || 'text-[#1A1A2E]'}`}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

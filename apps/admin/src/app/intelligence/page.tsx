import { createSupabaseServerClient } from '../../lib/supabase/server'
import { Sidebar } from '../../components/sidebar'

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
  zenpark: 'Zenpark',
  yespark: 'Yespark',
  indigo: 'Indigo',
  google_maps: 'Google Maps',
  onepark: 'Onepark',
}

function formatPrice(n: number | null | undefined): string {
  if (n == null) return '—'
  return Number(n).toFixed(2).replace('.', ',') + ' €'
}

export default async function IntelligencePage() {
  const supabase = createSupabaseServerClient()

  // Fetch all data in parallel
  const [
    { data: competitorData },
    { data: marketSummaries },
    { data: seoData },
    { data: flashparkSpots },
  ] = await Promise.all([
    supabase
      .from('competitor_data')
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(500),
    supabase
      .from('market_summary')
      .select('*')
      .order('date', { ascending: false })
      .limit(50),
    supabase
      .from('seo_tracking')
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(100),
    supabase
      .from('spots')
      .select('id, price_per_hour, city, status')
      .eq('status', 'active'),
  ])

  const competitors = competitorData ?? []
  const summaries = marketSummaries ?? []
  const seo = seoData ?? []
  const ourSpots = flashparkSpots ?? []

  // ---------- Aggregations ----------

  // Total competitor listings
  const totalListings = competitors.length

  // Unique sources
  const sources = [...new Set(competitors.map(c => c.source))]

  // Unique cities in competitor data
  const cities = [...new Set(competitors.map(c => c.city))]

  // Average competitor price per hour
  const pricesHour = competitors.map(c => Number(c.price_hour)).filter(p => p > 0)
  const avgCompetitorPrice = pricesHour.length > 0
    ? pricesHour.reduce((a, b) => a + b, 0) / pricesHour.length
    : 0

  // Our average price
  const ourPrices = ourSpots.map(s => Number(s.price_per_hour)).filter(p => p > 0)
  const avgOurPrice = ourPrices.length > 0
    ? ourPrices.reduce((a, b) => a + b, 0) / ourPrices.length
    : 0

  // Price advantage
  const priceAdvantage = avgCompetitorPrice > 0 && avgOurPrice > 0
    ? Math.round((1 - avgOurPrice / avgCompetitorPrice) * 100)
    : 0

  // Source breakdown
  const sourceBreakdown: Record<string, number> = {}
  competitors.forEach(c => {
    sourceBreakdown[c.source] = (sourceBreakdown[c.source] || 0) + 1
  })

  // City breakdown with price comparison
  const cityStats = cities.map(city => {
    const cityCompetitors = competitors.filter(c => c.city === city)
    const cityPrices = cityCompetitors.map(c => Number(c.price_hour)).filter(p => p > 0)
    const cityOurSpots = ourSpots.filter(s => s.city?.toLowerCase() === city.toLowerCase())
    const cityOurPrices = cityOurSpots.map(s => Number(s.price_per_hour)).filter(p => p > 0)

    return {
      city,
      competitorCount: cityCompetitors.length,
      avgPrice: cityPrices.length > 0 ? cityPrices.reduce((a, b) => a + b, 0) / cityPrices.length : 0,
      minPrice: cityPrices.length > 0 ? Math.min(...cityPrices) : 0,
      maxPrice: cityPrices.length > 0 ? Math.max(...cityPrices) : 0,
      ourSpotCount: cityOurSpots.length,
      ourAvgPrice: cityOurPrices.length > 0 ? cityOurPrices.reduce((a, b) => a + b, 0) / cityOurPrices.length : 0,
    }
  }).sort((a, b) => b.competitorCount - a.competitorCount)

  // SEO metrics
  const seoKeywords = [...new Set(seo.map(s => s.keyword))]
  const flashparkRanked = seo.filter(s => s.position != null && s.position <= 10)
  const topKeywords = seo
    .filter(s => s.position != null)
    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
    .slice(0, 15)

  // Latest scrape date
  const lastScrape = competitors.length > 0
    ? new Date(competitors[0].scraped_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : 'Jamais'

  // Top rated competitors
  const topRated = [...competitors]
    .filter(c => c.rating)
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .slice(0, 10)

  // Cheapest competitors
  const cheapest = [...competitors]
    .filter(c => c.price_hour && Number(c.price_hour) > 0)
    .sort((a, b) => Number(a.price_hour) - Number(b.price_hour))
    .slice(0, 10)

  return (
    <>
      <Sidebar />
      <main className="ml-60 min-h-screen bg-[#F8FAFC] p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[#1A1A2E]">
                Veille Concurrentielle
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Intelligence de marche — Derniere mise a jour : {lastScrape}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-xl bg-white px-4 py-2 border border-gray-100 shadow-sm text-sm">
                <span className="text-gray-400">Sources: </span>
                <span className="font-bold text-[#1A1A2E]">{sources.length}</span>
              </div>
              <div className="rounded-xl bg-white px-4 py-2 border border-gray-100 shadow-sm text-sm">
                <span className="text-gray-400">Villes: </span>
                <span className="font-bold text-[#1A1A2E]">{cities.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {/* Total listings scraped */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <span className="text-lg">🔍</span>
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Annonces concurrentes</span>
            </div>
            <p className="text-3xl font-extrabold text-[#1A1A2E]">{totalListings}</p>
            <p className="text-xs text-gray-400 mt-1">{sources.length} plateformes scannees</p>
          </div>

          {/* Average competitor price */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <span className="text-lg">💰</span>
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Prix moyen concurrent</span>
            </div>
            <p className="text-3xl font-extrabold text-amber-600">{formatPrice(avgCompetitorPrice)}/h</p>
            <p className="text-xs text-gray-400 mt-1">Sur {pricesHour.length} annonces</p>
          </div>

          {/* Our average price */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <span className="text-lg">⚡</span>
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Prix moyen FlashPark</span>
            </div>
            <p className="text-3xl font-extrabold text-[#0540FF]">{formatPrice(avgOurPrice)}/h</p>
            <p className="text-xs text-gray-400 mt-1">{ourSpots.length} annonces actives</p>
          </div>

          {/* Price advantage */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${priceAdvantage > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <span className="text-lg">{priceAdvantage > 0 ? '✅' : '⚠️'}</span>
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avantage prix</span>
            </div>
            <p className={`text-3xl font-extrabold ${priceAdvantage > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {priceAdvantage > 0 ? '-' : '+'}{Math.abs(priceAdvantage)}%
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {priceAdvantage > 0 ? 'Moins cher que la concurrence' : 'Plus cher que la concurrence'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Source Breakdown */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Repartition par source</h2>
            <div className="space-y-3">
              {Object.entries(sourceBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => {
                  const pct = totalListings > 0 ? Math.round((count / totalListings) * 100) : 0
                  return (
                    <div key={source}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SOURCE_COLORS[source] || SOURCE_COLORS.unknown}`}>
                          {SOURCE_LABELS[source] || source}
                        </span>
                        <span className="text-sm font-bold text-[#1A1A2E]">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0540FF] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* City Price Comparison */}
          <div className="col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Comparatif prix par ville</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Ville</th>
                    <th className="text-center py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Concurrents</th>
                    <th className="text-center py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Prix min/h</th>
                    <th className="text-center py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Prix moy/h</th>
                    <th className="text-center py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Prix max/h</th>
                    <th className="text-center py-2.5 px-3 text-amber-500 font-medium text-xs uppercase">FlashPark</th>
                    <th className="text-center py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Ecart</th>
                  </tr>
                </thead>
                <tbody>
                  {cityStats.map(cs => {
                    const diff = cs.avgPrice > 0 && cs.ourAvgPrice > 0
                      ? Math.round((1 - cs.ourAvgPrice / cs.avgPrice) * 100)
                      : null
                    return (
                      <tr key={cs.city} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-bold text-[#1A1A2E]">{cs.city}</td>
                        <td className="py-3 px-3 text-center text-gray-600">{cs.competitorCount}</td>
                        <td className="py-3 px-3 text-center text-emerald-600 font-medium">{formatPrice(cs.minPrice)}</td>
                        <td className="py-3 px-3 text-center font-bold text-[#1A1A2E]">{formatPrice(cs.avgPrice)}</td>
                        <td className="py-3 px-3 text-center text-red-500 font-medium">{formatPrice(cs.maxPrice)}</td>
                        <td className="py-3 px-3 text-center">
                          {cs.ourSpotCount > 0 ? (
                            <span className="font-bold text-[#0540FF]">{formatPrice(cs.ourAvgPrice)}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {diff != null ? (
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                              diff > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                            }`}>
                              {diff > 0 ? '-' : '+'}{Math.abs(diff)}%
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* SEO Rankings */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#1A1A2E]">SEO — Positions Google</h2>
              <span className="text-xs font-medium text-gray-400">
                {flashparkRanked.length}/{seoKeywords.length} en top 10
              </span>
            </div>
            {topKeywords.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnee SEO. Lancez le scraper.</p>
            ) : (
              <div className="space-y-2">
                {topKeywords.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                      (s.position ?? 99) <= 3 ? 'bg-emerald-100 text-emerald-700'
                      : (s.position ?? 99) <= 10 ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                    }`}>
                      #{s.position ?? '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A2E] truncate">{s.keyword}</p>
                      {s.competitor && (
                        <p className="text-xs text-gray-400 truncate">#1: {s.competitor}</p>
                      )}
                    </div>
                    {s.city && (
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{s.city}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Rated Competitors */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Top concurrents par note</h2>
            {topRated.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnee. Lancez le scraper.</p>
            ) : (
              <div className="space-y-2">
                {topRated.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A2E] truncate">{c.spot_name || 'Sans nom'}</p>
                      <p className="text-xs text-gray-400">{c.city} — {c.address?.substring(0, 40)}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500">★</span>
                        <span className="text-sm font-bold text-[#1A1A2E]">{Number(c.rating).toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-gray-400">{c.review_count} avis</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SOURCE_COLORS[c.source] || SOURCE_COLORS.unknown}`}>
                      {SOURCE_LABELS[c.source] || c.source}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cheapest Competitors */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-8">
          <h2 className="text-base font-bold text-[#1A1A2E] mb-4">Concurrents les moins chers (par heure)</h2>
          {cheapest.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnee. Lancez le scraper.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">#</th>
                    <th className="text-left py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Nom</th>
                    <th className="text-left py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Ville</th>
                    <th className="text-left py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Source</th>
                    <th className="text-left py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Type</th>
                    <th className="text-right py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Prix/h</th>
                    <th className="text-right py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Prix/jour</th>
                    <th className="text-right py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Prix/mois</th>
                    <th className="text-center py-2.5 px-3 text-gray-400 font-medium text-xs uppercase">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {cheapest.map((c, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-bold text-gray-300">{i + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-[#1A1A2E] max-w-[200px] truncate">{c.spot_name || '—'}</td>
                      <td className="py-2.5 px-3 text-gray-600">{c.city}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SOURCE_COLORS[c.source] || SOURCE_COLORS.unknown}`}>
                          {SOURCE_LABELS[c.source] || c.source}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 capitalize">{c.spot_type || '—'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{formatPrice(c.price_hour)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{formatPrice(c.price_day)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{formatPrice(c.price_month)}</td>
                      <td className="py-2.5 px-3 text-center">
                        {c.rating ? (
                          <span className="flex items-center justify-center gap-1">
                            <span className="text-amber-500">★</span>
                            <span className="font-medium">{Number(c.rating).toFixed(1)}</span>
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* How to use section */}
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-6">
          <h3 className="text-sm font-bold text-[#1A1A2E] mb-3">Comment alimenter ces donnees ?</h3>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <p className="font-medium text-gray-700 mb-1">1. Scraper automatique</p>
              <code className="block bg-gray-100 rounded-lg p-2 text-[11px] font-mono">
                npx tsx scripts/scrape-competitors.ts
              </code>
              <p className="mt-1">Lance le scan de toutes les villes cibles. Fonctionne avec ou sans API Apify.</p>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">2. Webhook Apify</p>
              <code className="block bg-gray-100 rounded-lg p-2 text-[11px] font-mono break-all">
                POST {process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://[project].supabase.co'}/functions/v1/apify-webhook
              </code>
              <p className="mt-1">Configurez un webhook Apify avec le header X-Webhook-Secret.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

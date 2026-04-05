import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const WEBHOOK_SECRET = Deno.env.get("APIFY_WEBHOOK_SECRET") || "flashpark-apify-2026";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Secret",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const secret = req.headers.get("x-webhook-secret");
  if (secret !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await req.json();
    const { source, data, type } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (type === "competitor_data" && Array.isArray(data)) {
      const rows = data.map((item: any) => ({
        source: source || item.source || "unknown",
        country: item.country || "France",
        city: item.city || "unknown",
        spot_name: item.spot_name || item.name || null,
        spot_type: item.spot_type || item.type || null,
        price_hour: item.price_hour ?? item.priceHour ?? null,
        price_day: item.price_day ?? item.priceDay ?? null,
        price_month: item.price_month ?? item.priceMonth ?? null,
        rating: item.rating ?? null,
        review_count: item.review_count ?? item.reviewCount ?? 0,
        latitude: item.latitude ?? item.lat ?? null,
        longitude: item.longitude ?? item.lng ?? null,
        address: item.address ?? null,
        features: item.features ?? [],
        raw_data: item,
        scraped_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("competitor_data").insert(rows);
      if (error) throw error;

      // Update market summary per country+city
      const keys = [...new Set(rows.map((r: any) => `${r.country}|||${r.city}`))];
      for (const key of keys) {
        const [country, city] = key.split("|||");
        const cityRows = rows.filter((r: any) => r.country === country && r.city === city);
        const prices = cityRows.map((r: any) => Number(r.price_hour)).filter((p: number) => p > 0);
        const dayPrices = cityRows.map((r: any) => Number(r.price_day)).filter((p: number) => p > 0);
        const monthPrices = cityRows.map((r: any) => Number(r.price_month)).filter((p: number) => p > 0);
        const ratings = cityRows.map((r: any) => Number(r.rating)).filter((p: number) => p > 0);

        const sourceBreakdown: Record<string, number> = {};
        cityRows.forEach((r: any) => {
          sourceBreakdown[r.source] = (sourceBreakdown[r.source] || 0) + 1;
        });

        const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

        await supabase.from("market_summary").upsert({
          country,
          city,
          date: new Date().toISOString().split("T")[0],
          avg_price_hour: avg(prices) ? Math.round(avg(prices)! * 100) / 100 : null,
          min_price_hour: prices.length > 0 ? Math.min(...prices) : null,
          max_price_hour: prices.length > 0 ? Math.max(...prices) : null,
          avg_price_day: avg(dayPrices) ? Math.round(avg(dayPrices)! * 100) / 100 : null,
          avg_price_month: avg(monthPrices) ? Math.round(avg(monthPrices)! * 100) / 100 : null,
          total_listings: cityRows.length,
          avg_rating: avg(ratings) ? Math.round(avg(ratings)! * 100) / 100 : null,
          source_breakdown: sourceBreakdown,
        }, { onConflict: "country,city,date" });
      }

      return new Response(JSON.stringify({
        success: true,
        inserted: rows.length,
        countries: [...new Set(rows.map((r: any) => r.country))],
        cities: [...new Set(rows.map((r: any) => r.city))],
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "seo_data" && Array.isArray(data)) {
      const rows = data.map((item: any) => ({
        keyword: item.keyword,
        position: item.position ?? null,
        competitor: item.competitor ?? null,
        url: item.url ?? null,
        city: item.city ?? null,
        scraped_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("seo_tracking").insert(rows);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, inserted: rows.length }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

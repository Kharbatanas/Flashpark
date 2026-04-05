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

      // Update market summary
      const cities = [...new Set(rows.map((r: any) => r.city))];
      for (const city of cities) {
        const cityRows = rows.filter((r: any) => r.city === city);
        const prices = cityRows.map((r: any) => r.price_hour).filter(Boolean);
        const ratings = cityRows.map((r: any) => r.rating).filter(Boolean);

        const sourceBreakdown: Record<string, number> = {};
        cityRows.forEach((r: any) => {
          sourceBreakdown[r.source] = (sourceBreakdown[r.source] || 0) + 1;
        });

        if (prices.length > 0) {
          const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
          const avgRating = ratings.length > 0
            ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
            : null;

          await supabase.from("market_summary").upsert({
            city,
            date: new Date().toISOString().split("T")[0],
            avg_price_hour: Math.round(avg * 100) / 100,
            min_price_hour: Math.min(...prices),
            max_price_hour: Math.max(...prices),
            total_listings: cityRows.length,
            avg_rating: avgRating ? Math.round(avgRating * 100) / 100 : null,
            source_breakdown: sourceBreakdown,
          }, { onConflict: "city,date" });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        inserted: rows.length,
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

    return new Response(JSON.stringify({ error: "Unknown type. Use 'competitor_data' or 'seo_data'" }), {
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

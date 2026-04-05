import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5MB

const WEBHOOK_SECRET = Deno.env.get("APIFY_WEBHOOK_SECRET");
if (!WEBHOOK_SECRET) {
  console.error("APIFY_WEBHOOK_SECRET not configured");
}

// --- Validation helpers ---

/** Remove control characters and trim whitespace from a string. */
function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  // Remove ASCII control characters (0x00-0x1F except \t \n \r) and DEL (0x7F)
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

function isPositiveNumberOrNull(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  const n = Number(value);
  return !isNaN(n) && n >= 0;
}

function isValidRating(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  const n = Number(value);
  return !isNaN(n) && n >= 0 && n <= 5;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validatePayload(body: any): ValidationResult {
  const { source, data, type } = body;

  if (typeof source !== "string" || source.trim().length === 0 || source.length > 100) {
    return { valid: false, error: "source must be a non-empty string (max 100 chars)" };
  }

  if (!Array.isArray(data)) {
    return { valid: false, error: "data must be an array" };
  }

  if (data.length > 500) {
    return { valid: false, error: "data array exceeds maximum of 500 items" };
  }

  if (type === "competitor_data") {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (typeof item !== "object" || item === null) {
        return { valid: false, error: `data[${i}] must be an object` };
      }

      const city = item.city;
      if (typeof city !== "string" || city.trim().length === 0 || city.length > 100) {
        return { valid: false, error: `data[${i}].city must be a non-empty string (max 100 chars)` };
      }

      const spotName = item.spot_name || item.name;
      if (typeof spotName !== "string" || spotName.trim().length === 0 || spotName.length > 200) {
        return { valid: false, error: `data[${i}].spot_name must be a non-empty string (max 200 chars)` };
      }

      if (!isPositiveNumberOrNull(item.price_hour ?? item.priceHour ?? null)) {
        return { valid: false, error: `data[${i}].price_hour must be a positive number if present` };
      }
      if (!isPositiveNumberOrNull(item.price_day ?? item.priceDay ?? null)) {
        return { valid: false, error: `data[${i}].price_day must be a positive number if present` };
      }
      if (!isPositiveNumberOrNull(item.price_month ?? item.priceMonth ?? null)) {
        return { valid: false, error: `data[${i}].price_month must be a positive number if present` };
      }
      if (!isValidRating(item.rating ?? null)) {
        return { valid: false, error: `data[${i}].rating must be between 0 and 5 if present` };
      }
    }
  }

  return { valid: true };
}

// --- Handler ---

Deno.serve(async (req: Request) => {
  // CORS preflight — restricted to server-to-server; no browser origin needed
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Secret",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  // 1. Ensure webhook secret is configured
  if (!WEBHOOK_SECRET) {
    console.error("[SECURITY] APIFY_WEBHOOK_SECRET env var is missing — rejecting all requests");
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), { status: 500 });
  }

  // 2. Authenticate
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== WEBHOOK_SECRET) {
    console.error("[SECURITY] Invalid webhook secret provided", {
      providedLength: secret?.length ?? 0,
      remoteAddr: req.headers.get("x-forwarded-for") || "unknown",
    });
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // 3. Reject oversized payloads
  const contentLength = parseInt(req.headers.get("content-length") || "0");
  if (contentLength > MAX_PAYLOAD_BYTES) {
    console.error("[SECURITY] Payload too large", { contentLength });
    return new Response("Payload too large", { status: 413 });
  }

  try {
    const body = await req.json();
    const { source, data, type } = body;

    // 4. Input validation
    const validation = validatePayload(body);
    if (!validation.valid) {
      console.error("[VALIDATION] Payload rejected", {
        error: validation.error,
        type,
        source: typeof source === "string" ? source.slice(0, 50) : typeof source,
        dataType: typeof data,
        dataLength: Array.isArray(data) ? data.length : "N/A",
      });
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (type === "competitor_data" && Array.isArray(data)) {
      const rows = data.map((item: any) => ({
        source: sanitizeString(source || item.source || "unknown"),
        country: sanitizeString(item.country || "France"),
        city: sanitizeString(item.city || "unknown"),
        spot_name: sanitizeString(item.spot_name || item.name || "") || null,
        spot_type: sanitizeString(item.spot_type || item.type || "") || null,
        price_hour: item.price_hour ?? item.priceHour ?? null,
        price_day: item.price_day ?? item.priceDay ?? null,
        price_month: item.price_month ?? item.priceMonth ?? null,
        rating: item.rating ?? null,
        review_count: item.review_count ?? item.reviewCount ?? 0,
        latitude: item.latitude ?? item.lat ?? null,
        longitude: item.longitude ?? item.lng ?? null,
        address: sanitizeString(item.address ?? "") || null,
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
        keyword: sanitizeString(item.keyword),
        position: item.position ?? null,
        competitor: sanitizeString(item.competitor ?? "") || null,
        url: sanitizeString(item.url ?? "") || null,
        city: sanitizeString(item.city ?? "") || null,
        scraped_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("seo_tracking").insert(rows);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, inserted: rows.length }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("[VALIDATION] Unknown type received", { type: String(type).slice(0, 50) });
    return new Response(JSON.stringify({ error: "Unknown type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ERROR] Webhook processing failed", { error: String(err) });
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

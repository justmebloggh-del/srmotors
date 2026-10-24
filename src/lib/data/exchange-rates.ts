import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { REPORTING_CURRENCY, rateCutoffDate, type RatesToGhs } from "@/lib/exchange-rates";

export async function getRatesToGhs(): Promise<RatesToGhs> {
  const supabase = createPublicClient();
  const cutoff = rateCutoffDate();

  const { data, error } = await supabase
    .from("currency_rates")
    .select("base_currency, quote_currency, rate, source, as_of, created_at")
    .eq("quote_currency", REPORTING_CURRENCY)
    .gte("as_of", cutoff)
    .order("as_of", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rates: RatesToGhs = {};
  for (const row of data ?? []) {
    if (rates[row.base_currency]) continue; // rows are newest-first
    rates[row.base_currency] = {
      base: row.base_currency,
      quote: row.quote_currency,
      rate: Number(row.rate),
      source: row.source,
      asOf: row.as_of,
    };
  }
  return rates;
}

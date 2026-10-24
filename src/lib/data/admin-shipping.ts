import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listShippingRates() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipping_rates")
    .select("*, body_types ( name )")
    .order("effective_from", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listCurrencyRates() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("currency_rates").select("*").order("as_of", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { buildCostBreakdown, type CostBreakdown } from "@/lib/cost-estimate";
import { getRatesToGhs } from "@/lib/data/exchange-rates";
import type { VehicleCostEstimate } from "@/types/vehicle";

export interface VehicleEstimateResult {
  vehicle: {
    id: string;
    slug: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    engineCapacityCc: number | null;
    condition: string;
    sourceCountry: string | null;
    fobAmount: number;
    fobCurrency: string;
  };
  breakdown: CostBreakdown;
}

export async function getCostEstimateForVehicle(
  slug: string,
): Promise<VehicleEstimateResult | null> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("vehicles")
    .select(
      "id, slug, year, fob_amount, fob_currency, engine_capacity_cc, condition, source_country, brands ( name ), vehicle_models ( name ), model_name_override",
    )
    .eq("slug", slug)
    .is("archived_at", null)
    .maybeSingle();

  if (error || !row) return null;

  const { data: estimateRow } = await supabase
    .from("vehicle_latest_estimate")
    .select("*")
    .eq("vehicle_id", row.id)
    .maybeSingle();

  const latestEstimate: VehicleCostEstimate | null = estimateRow
    ? {
        id: estimateRow.id,
        status: estimateRow.status,
        shippingAmount: estimateRow.shipping_amount,
        shippingCurrency: estimateRow.shipping_currency,
        customsDutyAmount: estimateRow.customs_duty_amount,
        customsCurrency: estimateRow.customs_currency,
        customsMethod: estimateRow.customs_method,
        portChargesAmount: estimateRow.port_charges_amount,
        clearingFeesAmount: estimateRow.clearing_fees_amount,
        localTransportAmount: estimateRow.local_transport_amount,
        otherChargesAmount: estimateRow.other_charges_amount,
        otherChargesDescription: estimateRow.other_charges_description,
        assumptions: estimateRow.assumptions,
        notes: estimateRow.notes,
        calculatedAt: estimateRow.calculated_at,
        reviewDueAt: estimateRow.review_due_at,
      }
    : null;

  const brand = (row as { brands?: { name: string } | null }).brands?.name ?? "";
  const model =
    (row as { vehicle_models?: { name: string } | null }).vehicle_models?.name ??
    (row as { model_name_override?: string | null }).model_name_override ??
    "";

  const fobAmount = Number(row.fob_amount);
  const rates = await getRatesToGhs();
  const breakdown = buildCostBreakdown(row.id, fobAmount, row.fob_currency, latestEstimate, rates);

  return {
    vehicle: {
      id: row.id,
      slug: row.slug,
      title: `${brand} ${model}`.trim(),
      brand,
      model,
      year: row.year,
      engineCapacityCc: row.engine_capacity_cc,
      condition: row.condition,
      sourceCountry: row.source_country,
      fobAmount,
      fobCurrency: row.fob_currency,
    },
    breakdown,
  };
}

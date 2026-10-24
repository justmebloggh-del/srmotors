"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublicSite } from "@/lib/revalidate";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/audit";
import { vehicleCostEstimateSchema, type VehicleCostEstimateInput } from "@/lib/validations/vehicle";

export interface ShippingActionResult {
  ok: boolean;
  error?: string;
}

export async function createShippingRateAction(input: {
  bodyTypeId: string | null;
  method: string;
  minCbm: number | null;
  maxCbm: number | null;
  originPort: string;
  destinationPort: string;
  rateAmount: number;
  rateCurrency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  notes: string | null;
}): Promise<ShippingActionResult> {
  const session = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("shipping_rates").insert({
    body_type_id: input.bodyTypeId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    method: input.method as any,
    min_cbm: input.minCbm,
    max_cbm: input.maxCbm,
    origin_port: input.originPort,
    destination_port: input.destinationPort,
    rate_amount: input.rateAmount,
    rate_currency: input.rateCurrency,
    effective_from: input.effectiveFrom,
    effective_to: input.effectiveTo,
    notes: input.notes,
    created_by: session.userId,
    updated_by: session.userId,
  });

  if (error) return { ok: false, error: "Could not create shipping rate." };

  await logAuditEvent({ action: "shipping_rate.create", entityType: "shipping_rate" });
  revalidatePath("/admin/shipping");
  revalidatePublicSite();
  return { ok: true };
}

export async function expireShippingRateAction(id: string): Promise<ShippingActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("shipping_rates")
    .update({ effective_to: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not expire rate." };

  revalidatePath("/admin/shipping");
  revalidatePublicSite();
  return { ok: true };
}

const currencyRateSchema = z.object({
  baseCurrency: z.string().trim().length(3, "Use a 3-letter currency code").toUpperCase(),
  quoteCurrency: z.string().trim().length(3).toUpperCase(),
  rate: z.number().positive("Rate must be greater than zero"),
  source: z.string().trim().min(2, "Record where this rate came from"),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the date of the rate"),
});

export async function createCurrencyRateAction(
  input: z.input<typeof currencyRateSchema>,
): Promise<ShippingActionResult> {
  const session = await requireAdmin();
  const parsed = currencyRateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid rate" };
  if (parsed.data.baseCurrency === parsed.data.quoteCurrency) {
    return { ok: false, error: "Base and quote currencies must differ." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("currency_rates").insert({
    base_currency: parsed.data.baseCurrency,
    quote_currency: parsed.data.quoteCurrency,
    rate: parsed.data.rate,
    source: parsed.data.source,
    as_of: parsed.data.asOf,
    created_by: session.userId,
  });
  if (error) return { ok: false, error: "Could not save exchange rate." };

  await logAuditEvent({
    action: "currency_rate.create",
    entityType: "currency_rate",
    metadata: {
      pair: `${parsed.data.baseCurrency}/${parsed.data.quoteCurrency}`,
      rate: parsed.data.rate,
      source: parsed.data.source,
      as_of: parsed.data.asOf,
    },
  });
  revalidatePath("/admin/shipping");
  revalidatePublicSite();
  return { ok: true };
}

export async function upsertCostEstimateAction(input: VehicleCostEstimateInput): Promise<ShippingActionResult> {
  const session = await requireAdmin();
  const parsed = vehicleCostEstimateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid estimate data" };

  const supabase = await createClient();
  const { error } = await supabase.from("vehicle_cost_estimates").insert({
    vehicle_id: parsed.data.vehicleId,
    status: parsed.data.status,
    shipping_rate_id: parsed.data.shippingRateId || null,
    shipping_amount: parsed.data.shippingAmount ?? null,
    shipping_currency: parsed.data.shippingCurrency ?? null,
    customs_duty_amount: parsed.data.customsDutyAmount ?? null,
    customs_currency: parsed.data.customsCurrency ?? null,
    customs_method: parsed.data.customsMethod ?? null,
    port_charges_amount: parsed.data.portChargesAmount ?? null,
    clearing_fees_amount: parsed.data.clearingFeesAmount ?? null,
    local_transport_amount: parsed.data.localTransportAmount ?? null,
    other_charges_amount: parsed.data.otherChargesAmount ?? null,
    other_charges_description: parsed.data.otherChargesDescription ?? null,
    assumptions: parsed.data.assumptions ?? null,
    notes: parsed.data.notes ?? null,
    review_due_at: parsed.data.reviewDueAt ?? null,
    created_by: session.userId,
    updated_by: session.userId,
  });

  if (error) {
    console.error("upsertCostEstimateAction failed", error);
    return { ok: false, error: "Could not save cost estimate." };
  }

  await logAuditEvent({
    action: "cost_estimate.create",
    entityType: "vehicle_cost_estimate",
    entityId: parsed.data.vehicleId,
    metadata: { status: parsed.data.status },
  });
  revalidatePath("/admin/vehicles");
  revalidatePublicSite();
  return { ok: true };
}

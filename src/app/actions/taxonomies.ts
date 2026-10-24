"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublicSite } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/audit";

type TaxonomyTable = "brands" | "body_types" | "fuel_types" | "transmission_types";

export interface TaxonomyActionResult {
  ok: boolean;
  error?: string;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createTaxonomyAction(table: TaxonomyTable, name: string): Promise<TaxonomyActionResult> {
  await requireAdmin();
  if (!name.trim()) return { ok: false, error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from(table).insert({ name: name.trim(), slug: slugify(name) });
  if (error) return { ok: false, error: error.code === "23505" ? "That name already exists." : "Could not create record." };

  await logAuditEvent({ action: `${table}.create`, entityType: table, metadata: { name } });
  revalidatePath("/admin/taxonomies");
  revalidatePublicSite();
  return { ok: true };
}

export async function archiveTaxonomyAction(table: TaxonomyTable, id: string): Promise<TaxonomyActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from(table).update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: "Could not archive record." };

  await logAuditEvent({ action: `${table}.archive`, entityType: table, entityId: id });
  revalidatePath("/admin/taxonomies");
  revalidatePublicSite();
  return { ok: true };
}

export async function createVehicleModelAction(brandId: string, name: string): Promise<TaxonomyActionResult> {
  await requireAdmin();
  if (!name.trim()) return { ok: false, error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("vehicle_models").insert({ brand_id: brandId, name: name.trim(), slug: slugify(name) });
  if (error) return { ok: false, error: "Could not create model." };

  revalidatePath("/admin/taxonomies");
  revalidatePublicSite();
  return { ok: true };
}

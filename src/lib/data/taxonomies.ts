import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

export interface Taxonomy {
  id: string;
  name: string;
  slug: string;
}

async function listTaxonomy(table: "body_types" | "fuel_types" | "transmission_types") {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from(table)
    .select("id, name, slug")
    .is("archived_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Taxonomy[];
}

export async function getBodyTypes() {
  return listTaxonomy("body_types");
}

export async function getFuelTypes() {
  return listTaxonomy("fuel_types");
}

export async function getTransmissionTypes() {
  return listTaxonomy("transmission_types");
}

export async function getBrands() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug")
    .is("archived_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Taxonomy[];
}

export async function getModelsForBrand(brandId: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("vehicle_models")
    .select("id, name, slug")
    .eq("brand_id", brandId)
    .is("archived_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Taxonomy[];
}

export async function resolveIdsBySlug(
  table: "brands" | "body_types" | "fuel_types" | "transmission_types",
  slugs: string[],
): Promise<string[]> {
  if (!slugs.length) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase.from(table).select("id").in("slug", slugs);
  if (error) throw error;
  return (data ?? []).map((r: { id: string }) => r.id);
}

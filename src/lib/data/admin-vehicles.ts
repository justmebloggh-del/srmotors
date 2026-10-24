import "server-only";
import { createClient } from "@/lib/supabase/server";
import { mediaPublicUrl } from "@/lib/supabase/media-url";
import type { VehicleStatus } from "@/types/database";

export interface AdminVehicleListItem {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  fobAmount: number;
  fobCurrency: string;
  status: string;
  featured: boolean;
  publishedAt: string | null;
  updatedAt: string;
  mainImageUrl: string | null;
}

export async function listAdminVehicles(filters: {
  status?: string;
  featured?: boolean;
  q?: string;
} = {}): Promise<AdminVehicleListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("vehicles")
    .select(
      "id, slug, year, fob_amount, fob_currency, status, featured, published_at, updated_at, brands ( name ), vehicle_models ( name ), model_name_override, media:main_media_id ( storage_path )",
    )
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status as VehicleStatus);
  if (filters.featured) query = query.eq("featured", true);

  const { data, error } = await query;
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items = (data ?? []).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    brand: row.brands?.name ?? "—",
    model: row.vehicle_models?.name ?? row.model_name_override ?? "—",
    year: row.year,
    fobAmount: Number(row.fob_amount),
    fobCurrency: row.fob_currency,
    status: row.status,
    featured: row.featured,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    mainImageUrl: mediaPublicUrl(row.media?.storage_path),
  }));

  if (filters.q) {
    const q = filters.q.toLowerCase();
    items = items.filter(
      (v) => v.brand.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.slug.includes(q),
    );
  }

  return items;
}

export async function getAdminVehicleById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      `id, slug, brand_id, model_id, model_name_override, trim, year, mileage_value, mileage_unit,
       fuel_type_id, transmission_id, engine_capacity_cc, body_type_id, drivetrain, steering,
       condition, source_country, location, cbm, fob_amount, fob_currency, price_notes,
       status, featured, description, condition_notes, main_media_id, seo_title, seo_description,
       published_at, brands ( name ), vehicle_models ( name ),
       vehicle_media ( id, position, media ( id, type, storage_path, alt_text ) )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getVehicleCostEstimateHistory(vehicleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_cost_estimates")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

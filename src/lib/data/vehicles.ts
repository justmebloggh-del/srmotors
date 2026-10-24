import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { mediaPublicUrl } from "@/lib/supabase/media-url";
import { resolveIdsBySlug } from "@/lib/data/taxonomies";
import { getRatesToGhs } from "@/lib/data/exchange-rates";
import { convertToGhs, formatRateNote, type RatesToGhs } from "@/lib/exchange-rates";
import type {
  MediaItem,
  VehicleCostEstimate,
  VehicleDetail,
  VehicleFilters,
  VehicleListItem,
} from "@/types/vehicle";

const LIST_SELECT = `
  id, slug, trim, year, mileage_value, mileage_unit, engine_capacity_cc,
  condition, source_country, fob_amount, fob_currency, status, featured, created_at,
  brands ( name ),
  vehicle_models ( name ),
  model_name_override,
  fuel_types ( name ),
  transmission_types ( name ),
  body_types ( name ),
  media:main_media_id ( storage_path, alt_text ),
  photo_count:vehicle_media ( count )
`;

const DETAIL_SELECT = `
  id, slug, trim, year, mileage_value, mileage_unit, engine_capacity_cc,
  brand_id, condition, source_country, location, cbm, drivetrain, steering,
  fob_amount, fob_currency, price_notes, status, featured, description, condition_notes,
  seo_title, seo_description,
  published_at, updated_at, created_at,
  brands ( name ),
  vehicle_models ( name ),
  model_name_override,
  fuel_types ( name ),
  transmission_types ( name ),
  body_types ( name ),
  media:main_media_id ( storage_path, alt_text ),
  vehicle_media ( position, media ( id, type, storage_path, alt_text, caption ) )
`;

export const SAMPLE_SLUG_PREFIX = "sample-";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapListRow(row: any, rates: RatesToGhs): VehicleListItem {
  const fobAmount = Number(row.fob_amount);
  const converted = row.fob_currency === "GHS" ? null : convertToGhs(fobAmount, row.fob_currency, rates);

  return {
    id: row.id,
    slug: row.slug,
    brand: row.brands?.name ?? "—",
    model: row.vehicle_models?.name ?? row.model_name_override ?? "—",
    trim: row.trim,
    year: row.year,
    mileageValue: row.mileage_value,
    mileageUnit: row.mileage_unit,
    fuelType: row.fuel_types?.name ?? null,
    transmission: row.transmission_types?.name ?? null,
    engineCapacityCc: row.engine_capacity_cc,
    bodyType: row.body_types?.name ?? null,
    condition: row.condition,
    sourceCountry: row.source_country,
    fobAmount,
    fobCurrency: row.fob_currency,
    status: row.status,
    featured: row.featured,
    mainImageUrl: mediaPublicUrl(row.media?.storage_path),
    photoCount: row.photo_count?.[0]?.count ?? (row.media ? 1 : 0),
    createdAt: row.created_at,
    isSample: String(row.slug).startsWith(SAMPLE_SLUG_PREFIX),
    ghsApprox:
      converted && converted.rate
        ? { amount: converted.amount, rateNote: formatRateNote(converted.rate) }
        : null,
  };
}

/** PostgREST `in.(...)` list with each value quoted, so names containing spaces or commas work. */
function quotedList(values: string[]) {
  return `(${values.map((v) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")})`;
}

async function resolveModelFilter(names: string[]): Promise<string | null> {
  if (!names.length) return null;
  const supabase = createPublicClient();
  const { data } = await supabase.from("vehicle_models").select("id").in("name", names);
  const ids = (data ?? []).map((m) => m.id);

  const clauses = [`model_name_override.in.${quotedList(names)}`];
  if (ids.length) clauses.push(`model_id.in.(${ids.join(",")})`);
  return clauses.join(",");
}

export async function getVehicles(
  filters: VehicleFilters = {},
): Promise<{ items: VehicleListItem[]; total: number }> {
  const supabase = createPublicClient();
  const perPage = filters.perPage ?? 12;
  const page = filters.page ?? 1;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const [brandIds, bodyTypeIds, fuelTypeIds, transmissionIds, modelFilter, rates] = await Promise.all([
    resolveIdsBySlug("brands", filters.brand ?? []),
    resolveIdsBySlug("body_types", filters.bodyType ?? []),
    resolveIdsBySlug("fuel_types", filters.fuelType ?? []),
    resolveIdsBySlug("transmission_types", filters.transmission ?? []),
    resolveModelFilter(filters.model ?? []),
    getRatesToGhs(),
  ]);

  let query = supabase
    .from("vehicles")
    .select(LIST_SELECT, { count: "exact" })
    .not("published_at", "is", null)
    .is("archived_at", null)
    .neq("status", "draft");

  if (filters.status?.length) query = query.in("status", filters.status);
  if (brandIds.length) query = query.in("brand_id", brandIds);
  if (bodyTypeIds.length) query = query.in("body_type_id", bodyTypeIds);
  if (fuelTypeIds.length) query = query.in("fuel_type_id", fuelTypeIds);
  if (transmissionIds.length) query = query.in("transmission_id", transmissionIds);
  if (modelFilter) query = query.or(modelFilter);
  if (filters.condition?.length) query = query.in("condition", filters.condition);
  if (filters.sourceCountry?.length) query = query.in("source_country", filters.sourceCountry);
  if (filters.yearMin != null) query = query.gte("year", filters.yearMin);
  if (filters.yearMax != null) query = query.lte("year", filters.yearMax);
  if (filters.priceMin != null) query = query.gte("fob_amount", filters.priceMin);
  if (filters.priceMax != null) query = query.lte("fob_amount", filters.priceMax);
  if (filters.mileageMaxKm != null) query = query.lte("mileage_km", filters.mileageMaxKm);
  if (filters.engineMinCc != null) query = query.gte("engine_capacity_cc", filters.engineMinCc);
  if (filters.engineMaxCc != null) query = query.lte("engine_capacity_cc", filters.engineMaxCc);
  if (filters.currency) query = query.eq("fob_currency", filters.currency);
  if (filters.featured) query = query.eq("featured", true);
  if (filters.q) query = query.ilike("description", `%${filters.q}%`);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("fob_amount", { ascending: true });
      break;
    case "price_desc":
      query = query.order("fob_amount", { ascending: false });
      break;
    case "year_desc":
      query = query.order("year", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return { items: (data ?? []).map((row) => mapListRow(row, rates)), total: count ?? 0 };
}

export interface VehicleFacets {
  models: { name: string; brandSlug: string }[];
  sourceCountries: string[];
}

/** Filter options drawn only from published listings, so no filter ever leads to an empty result by construction. */
export async function getVehicleFacets(): Promise<VehicleFacets> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("model_name_override, source_country, brands ( slug ), vehicle_models ( name )")
    .not("published_at", "is", null)
    .is("archived_at", null)
    .neq("status", "draft")
    .limit(2000);

  if (error) throw error;

  const models = new Map<string, { name: string; brandSlug: string }>();
  const countries = new Set<string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data ?? []) as any[]) {
    const name = row.vehicle_models?.name ?? row.model_name_override;
    if (name) models.set(`${row.brands?.slug}:${name}`, { name, brandSlug: row.brands?.slug ?? "" });
    if (row.source_country) countries.add(row.source_country);
  }

  return {
    models: [...models.values()].sort((a, b) => a.name.localeCompare(b.name)),
    sourceCountries: [...countries].sort(),
  };
}

export async function getFeaturedVehicles(limit = 20): Promise<VehicleListItem[]> {
  const supabase = createPublicClient();
  const [{ data, error }, rates] = await Promise.all([
    supabase
      .from("vehicles")
      .select(LIST_SELECT)
      .not("published_at", "is", null)
      .is("archived_at", null)
      .eq("featured", true)
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(limit),
    getRatesToGhs(),
  ]);

  if (error) throw error;
  return (data ?? []).map((row) => mapListRow(row, rates));
}

export async function getRecentVehicles(limit = 8): Promise<VehicleListItem[]> {
  const supabase = createPublicClient();
  const [{ data, error }, rates] = await Promise.all([
    supabase
      .from("vehicles")
      .select(LIST_SELECT)
      .not("published_at", "is", null)
      .is("archived_at", null)
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(limit),
    getRatesToGhs(),
  ]);

  if (error) throw error;
  return (data ?? []).map((row) => mapListRow(row, rates));
}

export async function getVehicleBySlug(
  slug: string,
): Promise<{ vehicle: VehicleDetail; rates: RatesToGhs } | null> {
  const supabase = createPublicClient();
  const [{ data: row, error }, rates] = await Promise.all([
    supabase.from("vehicles").select(DETAIL_SELECT).eq("slug", slug).is("archived_at", null).maybeSingle(),
    getRatesToGhs(),
  ]);

  if (error) throw error;
  if (!row) return null;

  const { data: estimateRow } = await supabase
    .from("vehicle_latest_estimate")
    .select("*")
    .eq("vehicle_id", row.id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vehicleMediaRows: any[] = (row as any).vehicle_media ?? [];
  const media: MediaItem[] = vehicleMediaRows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((vm: any) => ({
      id: vm.media?.id,
      url: mediaPublicUrl(vm.media?.storage_path) ?? "",
      type: vm.media?.type ?? "image",
      altText: vm.media?.alt_text,
      caption: vm.media?.caption ?? null,
      position: vm.position,
    }))
    .sort((a: MediaItem, b: MediaItem) => a.position - b.position);

  const latestEstimate: VehicleCostEstimate | null = estimateRow
    ? {
        id: estimateRow.id,
        status: estimateRow.status,
        shippingAmount: estimateRow.shipping_amount != null ? Number(estimateRow.shipping_amount) : null,
        shippingCurrency: estimateRow.shipping_currency,
        customsDutyAmount: estimateRow.customs_duty_amount != null ? Number(estimateRow.customs_duty_amount) : null,
        customsCurrency: estimateRow.customs_currency,
        customsMethod: estimateRow.customs_method,
        portChargesAmount: estimateRow.port_charges_amount != null ? Number(estimateRow.port_charges_amount) : null,
        clearingFeesAmount: estimateRow.clearing_fees_amount != null ? Number(estimateRow.clearing_fees_amount) : null,
        localTransportAmount:
          estimateRow.local_transport_amount != null ? Number(estimateRow.local_transport_amount) : null,
        otherChargesAmount: estimateRow.other_charges_amount != null ? Number(estimateRow.other_charges_amount) : null,
        otherChargesDescription: estimateRow.other_charges_description,
        assumptions: estimateRow.assumptions,
        notes: estimateRow.notes,
        calculatedAt: estimateRow.calculated_at,
        reviewDueAt: estimateRow.review_due_at,
      }
    : null;

  return {
    vehicle: {
      ...mapListRow(row, rates),
      brandId: row.brand_id,
      drivetrain: row.drivetrain,
      steering: row.steering,
      location: row.location,
      cbm: row.cbm,
      description: row.description,
      conditionNotes: row.condition_notes,
      priceNotes: row.price_notes,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      media,
      latestEstimate,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    },
    rates,
  };
}

export async function getVehicleOptions(): Promise<{ slug: string; label: string }[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("slug, year, brands ( name ), vehicle_models ( name ), model_name_override")
    .not("published_at", "is", null)
    .is("archived_at", null)
    .in("status", ["available", "reserved"])
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    slug: row.slug,
    label: `${row.year} ${row.brands?.name ?? ""} ${row.vehicle_models?.name ?? row.model_name_override ?? ""}`.trim(),
  }));
}

export async function getRelatedVehicles(
  vehicle: VehicleDetail,
  rates: RatesToGhs,
  limit = 4,
): Promise<VehicleListItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(LIST_SELECT)
    .not("published_at", "is", null)
    .is("archived_at", null)
    .neq("status", "draft")
    .neq("id", vehicle.id)
    .eq("brand_id", vehicle.brandId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => mapListRow(row, rates));
}

export interface BrandSummary {
  brandId: string;
  available: number;
  /** Lowest FOB price among available listings, in the brand's most common listing currency. */
  fromAmount: number;
  fromCurrency: string;
}

/** Per-brand count and starting FOB price, from available (not reserved/sold) listings only. */
export async function getBrandSummaries(): Promise<Record<string, BrandSummary>> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("brand_id, fob_amount, fob_currency")
    .not("published_at", "is", null)
    .is("archived_at", null)
    .eq("status", "available")
    .limit(5000);
  if (error) throw error;

  const byBrand = new Map<string, { count: number; minByCurrency: Map<string, number>; currencyCount: Map<string, number> }>();
  for (const row of data ?? []) {
    const entry = byBrand.get(row.brand_id) ?? { count: 0, minByCurrency: new Map(), currencyCount: new Map() };
    const amount = Number(row.fob_amount);
    entry.count += 1;
    entry.currencyCount.set(row.fob_currency, (entry.currencyCount.get(row.fob_currency) ?? 0) + 1);
    entry.minByCurrency.set(row.fob_currency, Math.min(entry.minByCurrency.get(row.fob_currency) ?? Infinity, amount));
    byBrand.set(row.brand_id, entry);
  }

  const result: Record<string, BrandSummary> = {};
  for (const [brandId, entry] of byBrand) {
    // Never compare prices across currencies without a rate — quote the brand's main currency.
    const [currency] = [...entry.currencyCount.entries()].sort((a, b) => b[1] - a[1])[0];
    result[brandId] = {
      brandId,
      available: entry.count,
      fromAmount: entry.minByCurrency.get(currency)!,
      fromCurrency: currency,
    };
  }
  return result;
}

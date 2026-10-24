import type { VehicleCondition, VehicleFilters, VehicleStatus } from "@/types/vehicle";

type SearchParams = { [key: string]: string | string[] | undefined };

function toArray(value: string | string[] | undefined): string[] | undefined {
  if (value == null) return undefined;
  const arr = Array.isArray(value) ? value : value.split(",");
  const filtered = arr.map((v) => v.trim()).filter(Boolean);
  return filtered.length ? filtered : undefined;
}

function toNumber(value: string | string[] | undefined): number | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const VALID_SORTS = new Set(["newest", "price_asc", "price_desc", "year_desc"]);

export function parseVehicleFilters(searchParams: SearchParams): VehicleFilters {
  const sortRaw = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;

  const engineMinL = toNumber(searchParams.engineMin);
  const engineMaxL = toNumber(searchParams.engineMax);

  return {
    brand: toArray(searchParams.brand),
    model: toArray(searchParams.model),
    mileageMaxKm: toNumber(searchParams.mileageMax),
    engineMinCc: engineMinL != null ? Math.round(engineMinL * 1000) : undefined,
    engineMaxCc: engineMaxL != null ? Math.round(engineMaxL * 1000) : undefined,
    bodyType: toArray(searchParams.bodyType),
    fuelType: toArray(searchParams.fuelType),
    transmission: toArray(searchParams.transmission),
    condition: toArray(searchParams.condition) as VehicleCondition[] | undefined,
    status: toArray(searchParams.availability) as VehicleStatus[] | undefined,
    sourceCountry: toArray(searchParams.sourceCountry),
    yearMin: toNumber(searchParams.yearMin),
    yearMax: toNumber(searchParams.yearMax),
    priceMin: toNumber(searchParams.priceMin),
    priceMax: toNumber(searchParams.priceMax),
    currency: Array.isArray(searchParams.currency) ? searchParams.currency[0] : searchParams.currency,
    featured: searchParams.featured === "true" ? true : undefined,
    sort: sortRaw && VALID_SORTS.has(sortRaw) ? (sortRaw as VehicleFilters["sort"]) : "newest",
    page: toNumber(searchParams.page) ?? 1,
    perPage: 12,
  };
}

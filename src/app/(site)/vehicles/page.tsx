import type { Metadata } from "next";
import { getVehicles, getVehicleFacets } from "@/lib/data/vehicles";
import { getBrands, getBodyTypes, getFuelTypes, getTransmissionTypes } from "@/lib/data/taxonomies";
import { parseVehicleFilters } from "@/lib/data/parse-vehicle-filters";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { VehicleFilterSidebar } from "@/components/vehicles/vehicle-filter-sidebar";
import { VehicleSortSelect } from "@/components/vehicles/vehicle-sort-select";
import { VehiclePagination } from "@/components/vehicles/vehicle-pagination";

export const metadata: Metadata = {
  title: "Browse Vehicles",
  description: "Search and filter the full SR Motors vehicle inventory by manufacturer, body type, fuel type, price and more.",
  alternates: { canonical: "/vehicles" },
};

export default async function VehiclesPage({
  searchParams,
}: PageProps<"/vehicles">) {
  const resolvedParams = await searchParams;
  const filters = parseVehicleFilters(resolvedParams);

  const [{ items, total }, brands, bodyTypes, fuelTypes, transmissionTypes, facets] = await Promise.all([
    getVehicles(filters),
    getBrands(),
    getBodyTypes(),
    getFuelTypes(),
    getTransmissionTypes(),
    getVehicleFacets(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / (filters.perPage ?? 12)));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse Vehicles</h1>
        <p className="mt-2 text-muted-foreground">
          {total} vehicle{total === 1 ? "" : "s"} found. All prices shown are FOB — see each
          listing for import cost guidance.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <VehicleFilterSidebar
          brands={brands}
          bodyTypes={bodyTypes}
          fuelTypes={fuelTypes}
          transmissionTypes={transmissionTypes}
          facets={facets}
        />

        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {filters.page ?? 1} of {totalPages}
            </p>
            <VehicleSortSelect />
          </div>

          {items.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border py-20 text-center text-muted-foreground">
              No vehicles match these filters yet. Try adjusting your search, or{" "}
              <a href="/contact" className="font-medium text-brand-gold-dark hover:underline">
                contact us
              </a>{" "}
              and we&apos;ll help you find one.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}

          <VehiclePagination page={filters.page ?? 1} totalPages={totalPages} searchParams={resolvedParams} />
        </div>
      </div>
    </div>
  );
}

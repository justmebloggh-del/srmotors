import Link from "next/link";
import type { Taxonomy } from "@/lib/data/taxonomies";
import type { BrandSummary } from "@/lib/data/vehicles";
import { formatPrice } from "@/lib/utils/format";

export function BrowseBy({
  brands,
  bodyTypes,
  fuelTypes,
  transmissionTypes,
  brandSummaries,
}: {
  brands: Taxonomy[];
  bodyTypes: Taxonomy[];
  fuelTypes: Taxonomy[];
  transmissionTypes: Taxonomy[];
  brandSummaries: Record<string, BrandSummary>;
}) {
  // Manufacturers with stock first, so every brand with listings shows its starting price.
  const brandsWithStock = brands
    .filter((b) => brandSummaries[b.id])
    .sort((a, b) => brandSummaries[b.id].available - brandSummaries[a.id].available);

  const groups = [
    { label: "By Manufacturer", param: "brand", items: brandsWithStock.length ? brandsWithStock : brands, limit: 12 },
    { label: "By Body Type", param: "bodyType", items: bodyTypes, limit: 6 },
    { label: "By Fuel Type", param: "fuelType", items: fuelTypes, limit: 6 },
    { label: "By Transmission", param: "transmission", items: transmissionTypes, limit: 6 },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="bg-muted/40 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-8 text-2xl font-bold sm:text-3xl">Browse the Inventory</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h3>
              <ul className="space-y-2">
                {group.items.slice(0, group.limit).map((item) => {
                  const summary = group.param === "brand" ? brandSummaries[item.id] : undefined;
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/vehicles?${group.param}=${item.slug}`}
                        className="flex items-baseline justify-between gap-3 text-sm text-foreground transition-colors hover:text-brand-gold-dark"
                      >
                        <span>{item.name}</span>
                        {summary && (
                          <span className="text-xs text-muted-foreground">
                            from {formatPrice(summary.fromAmount, summary.fromCurrency)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

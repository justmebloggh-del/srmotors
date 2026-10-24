import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/data/taxonomies";
import { getBrandSummaries } from "@/lib/data/vehicles";
import { formatPrice } from "@/lib/utils/format";

// Served from cache and regenerated at most every 5 minutes; admin edits revalidate immediately.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Brands",
  description: "Browse SR Motors vehicle inventory by manufacturer, with starting FOB prices for each brand.",
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const [brands, summaries] = await Promise.all([getBrands(), getBrandSummaries()]);
  // Brands with stock first (most listings first), then the rest alphabetically.
  const sorted = [...brands].sort(
    (a, b) => (summaries[b.id]?.available ?? 0) - (summaries[a.id]?.available ?? 0) || a.name.localeCompare(b.name),
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Browse by Manufacturer</h1>
      <p className="mt-3 text-muted-foreground">
        Select a manufacturer to see the vehicles currently available. Prices shown are the lowest
        FOB price for each brand — shipping and Ghana import costs are additional.
      </p>

      {sorted.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No manufacturers published yet.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((brand) => {
            const summary = summaries[brand.id];
            return (
              <Link
                key={brand.id}
                href={`/vehicles?brand=${brand.slug}`}
                className="flex flex-col items-center justify-center gap-1 rounded-sm border border-border px-4 py-7 text-center transition-colors hover:border-brand-gold"
              >
                <span className="font-semibold">{brand.name}</span>
                {summary ? (
                  <>
                    <span className="text-sm">
                      from <span className="font-semibold">{formatPrice(summary.fromAmount, summary.fromCurrency)}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{summary.available} available · FOB</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">No vehicles listed yet</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

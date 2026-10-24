import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VehicleQuickSearch } from "@/components/vehicles/vehicle-quick-search";
import type { Taxonomy } from "@/lib/data/taxonomies";

export function HeroSection({
  brands,
  bodyTypes,
  heroTitle,
  heroBody,
}: {
  brands: Taxonomy[];
  bodyTypes: Taxonomy[];
  heroTitle: string;
  heroBody: string;
}) {
  return (
    <section className="relative overflow-hidden bg-brand-black text-white">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(214,180,106,0.35), transparent 45%), radial-gradient(circle at 80% 60%, rgba(214,180,106,0.2), transparent 50%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-28 lg:py-32">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
          SR Motors — Driven by Trust. Defined by Quality.
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
          {heroTitle}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-brand-grey sm:text-lg">
          {heroBody}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button asChild size="lg" className="bg-brand-gold text-brand-black hover:bg-brand-gold-light">
            <Link href="/vehicles">Explore Vehicles</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-brand-grey/40 bg-transparent text-white hover:bg-white/10"
          >
            <Link href="/import-calculator">Estimate Import Cost</Link>
          </Button>
        </div>

        <div className="mt-12 rounded-sm bg-white/5 p-4 backdrop-blur sm:p-6">
          <VehicleQuickSearch brands={brands} bodyTypes={bodyTypes} />
        </div>
      </div>
    </section>
  );
}

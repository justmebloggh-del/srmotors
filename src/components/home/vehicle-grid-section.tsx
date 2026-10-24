import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { FeaturedCarousel } from "@/components/home/featured-carousel";
import type { VehicleListItem } from "@/types/vehicle";

export function VehicleGridSection({
  title,
  subtitle,
  vehicles,
  viewAllHref,
  layout = "grid",
}: {
  title: string;
  subtitle?: string;
  vehicles: VehicleListItem[];
  viewAllHref: string;
  layout?: "grid" | "carousel";
}) {
  if (vehicles.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        <Link
          href={viewAllHref}
          className="hidden items-center gap-1 text-sm font-medium text-brand-gold-dark hover:underline sm:flex"
        >
          View all <ArrowRight className="size-4" />
        </Link>
      </div>
      {layout === "carousel" ? (
        <FeaturedCarousel label={title}>
          {vehicles.map((v) => (
            <div key={v.id} className="w-[82%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]">
              <VehicleCard vehicle={v} />
            </div>
          ))}
        </FeaturedCarousel>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
      <div className="mt-8 sm:hidden">
        <Link href={viewAllHref} className="flex items-center gap-1 text-sm font-medium text-brand-gold-dark">
          View all <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

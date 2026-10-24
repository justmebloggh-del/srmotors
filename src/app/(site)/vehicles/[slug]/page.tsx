import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicleBySlug, getRelatedVehicles } from "@/lib/data/vehicles";
import { VehicleGallery } from "@/components/vehicles/vehicle-gallery";
import { VehicleSpecTable } from "@/components/vehicles/vehicle-spec-table";
import { CostBreakdownCard } from "@/components/vehicles/cost-breakdown-card";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { FobNotice } from "@/components/shared/fob-notice";
import { ShareButtons } from "@/components/shared/share-buttons";
import { EnquiryForm } from "@/components/shared/enquiry-form";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DutyCheckerCard } from "@/components/shared/duty-checker-card";
import { getDutyChecker } from "@/lib/data/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, statusLabel } from "@/lib/utils/format";
import { siteConfig, vehicleWhatsappMessage, whatsappLink } from "@/lib/site-config";

// Served from cache and regenerated at most every 5 minutes; admin edits revalidate immediately.
export const revalidate = 300;

// Render each listing on first visit, then cache it (no build-time list needed).
export function generateStaticParams() {
  return [];
}

// Dedupes the lookup between generateMetadata and the page within one request.
const loadVehicle = cache(getVehicleBySlug);

export async function generateMetadata({
  params,
}: PageProps<"/vehicles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadVehicle(slug);
  if (!result) return {};
  const { vehicle } = result;

  const title = vehicle.seoTitle ?? `${vehicle.year} ${vehicle.brand} ${vehicle.model}`;
  const description =
    vehicle.seoDescription ??
    `${vehicle.year} ${vehicle.brand} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""} — FOB ${formatPrice(vehicle.fobAmount, vehicle.fobCurrency)}. ${vehicle.condition} condition, ${vehicle.sourceCountry ?? "sourced internationally"}.`;

  return {
    title,
    description,
    alternates: { canonical: `/vehicles/${vehicle.slug}` },
    // Temporary demo listings must never be indexed as real stock.
    ...(vehicle.isSample ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      images: vehicle.mainImageUrl ? [vehicle.mainImageUrl] : undefined,
    },
  };
}

export default async function VehicleDetailPage({
  params,
}: PageProps<"/vehicles/[slug]">) {
  const { slug } = await params;
  const result = await loadVehicle(slug);
  if (!result) notFound();
  const { vehicle, rates } = result;

  const [related, dutyChecker] = await Promise.all([getRelatedVehicles(vehicle, rates), getDutyChecker()]);
  const title = `${vehicle.brand} ${vehicle.model}`;
  const url = `${siteConfig.url}/vehicles/${vehicle.slug}`;
  const isSold = vehicle.status === "sold";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${vehicle.year} ${title}`,
    brand: vehicle.brand,
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: vehicle.mileageValue
      ? { "@type": "QuantitativeValue", value: vehicle.mileageValue, unitCode: vehicle.mileageUnit === "km" ? "KMT" : "SMI" }
      : undefined,
    fuelType: vehicle.fuelType ?? undefined,
    vehicleTransmission: vehicle.transmission ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: vehicle.fobCurrency,
      price: vehicle.fobAmount,
      availability: isSold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url,
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Vehicles", href: "/vehicles" },
          { label: `${vehicle.year} ${title}` },
        ]}
      />

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          <VehicleGallery media={vehicle.media} title={`${vehicle.year} ${title}`} fallbackImageUrl={vehicle.mainImageUrl} />

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              {vehicle.featured && <Badge className="bg-brand-gold text-brand-black">Featured</Badge>}
              <Badge variant="secondary">{statusLabel(vehicle.status)}</Badge>
              <Badge variant="outline">{vehicle.condition.replace(/_/g, " ")}</Badge>
              {vehicle.isSample && <Badge variant="outline">Sample listing</Badge>}
            </div>
            <h1 className="mt-3 text-3xl font-bold">{vehicle.year} {title}</h1>
            {vehicle.trim && <p className="mt-1 text-muted-foreground">{vehicle.trim}</p>}

            <div className="mt-6">
              <VehicleSpecTable vehicle={vehicle} />
            </div>

            {vehicle.description && (
              <div className="mt-8">
                <h2 className="mb-2 text-lg font-semibold">Description</h2>
                <p className="leading-relaxed text-muted-foreground">{vehicle.description}</p>
              </div>
            )}

            {vehicle.conditionNotes && (
              <div className="mt-6">
                <h2 className="mb-2 text-lg font-semibold">Condition & Inspection Notes</h2>
                <p className="leading-relaxed text-muted-foreground">{vehicle.conditionNotes}</p>
              </div>
            )}

            <div className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">Share This Listing</h2>
              <ShareButtons url={url} title={`${vehicle.year} ${title}`} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-sm border border-border p-5">
            <p className="text-3xl font-bold">{formatPrice(vehicle.fobAmount, vehicle.fobCurrency)}</p>
            <p className="text-sm text-muted-foreground">FOB price — see notice below</p>
            {vehicle.fobCurrency !== "GHS" &&
              (vehicle.ghsApprox ? (
                <p className="mt-2 text-sm">
                  ≈ <span className="font-semibold">{formatPrice(vehicle.ghsApprox.amount, "GHS")}</span>
                  <span className="block text-xs text-muted-foreground">
                    Indicative only, at {vehicle.ghsApprox.rateNote}. The rate at payment may differ.
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  No current GHS exchange rate is available — contact SR Motors to confirm the cedi
                  equivalent.
                </p>
              ))}
            <FobNotice className="mt-4" />

            {isSold ? (
              <p className="mt-4 rounded-sm bg-muted p-3 text-center text-sm font-medium">
                This vehicle has been sold. Browse similar vehicles below.
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild className="bg-[#25D366] text-brand-black hover:bg-[#1ebc59]">
                  <a
                    href={whatsappLink(
                      vehicleWhatsappMessage({
                        title,
                        year: vehicle.year,
                        fobAmount: vehicle.fobAmount,
                        fobCurrency: vehicle.fobCurrency,
                        url,
                      }),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Enquire on WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/import-calculator?vehicle=${vehicle.slug}`}>Open Import Calculator</Link>
                </Button>
              </div>
            )}
          </div>

          <CostBreakdownCard
            vehicleId={vehicle.id}
            fobAmount={vehicle.fobAmount}
            fobCurrency={vehicle.fobCurrency}
            estimate={vehicle.latestEstimate}
            rates={rates}
          />

          {dutyChecker && !isSold && (
            <DutyCheckerCard
              checker={dutyChecker}
              vehicle={{
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                engineCapacityCc: vehicle.engineCapacityCc,
                condition: vehicle.condition,
                sourceCountry: vehicle.sourceCountry,
              }}
            />
          )}

          <div className="rounded-sm border border-border p-5">
            <h3 className="mb-4 font-semibold">Send an Enquiry</h3>
            <EnquiryForm
              vehicleId={vehicle.id}
              source="vehicle_page"
              defaultMessage={`I'm interested in the ${vehicle.year} ${title}${vehicle.trim ? ` ${vehicle.trim}` : ""} (FOB ${formatPrice(vehicle.fobAmount, vehicle.fobCurrency)}).`}
            />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Related Vehicles</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

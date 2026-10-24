import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { VehicleGridSection } from "@/components/home/vehicle-grid-section";
import { BrowseBy } from "@/components/home/browse-by";
import { PricingExplainer } from "@/components/home/pricing-explainer";
import { ImportProcessPreview } from "@/components/home/import-process-preview";
import { TrustSection } from "@/components/home/trust-section";
import { EnquiryCta } from "@/components/home/enquiry-cta";
import { getBrandSummaries, getFeaturedVehicles, getRecentVehicles } from "@/lib/data/vehicles";
import {
  getBrands,
  getBodyTypes,
  getFuelTypes,
  getTransmissionTypes,
} from "@/lib/data/taxonomies";
import { getContentBlock } from "@/lib/data/content";

// Served from cache and regenerated at most every 5 minutes; admin edits revalidate immediately.
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [featured, recent, brands, bodyTypes, fuelTypes, transmissionTypes, hero, brandSummaries] =
    await Promise.all([
      getFeaturedVehicles(),
      getRecentVehicles(),
      getBrands(),
      getBodyTypes(),
      getFuelTypes(),
      getTransmissionTypes(),
      getContentBlock("home_hero"),
      getBrandSummaries(),
    ]);

  const heroTitle = hero?.title ?? "Find Your Next Car with Confidence.";
  const heroBody =
    hero?.body ??
    "SR Motors helps you source vehicles and arrange transparent imports to Ghana.";

  return (
    <>
      <HeroSection brands={brands} bodyTypes={bodyTypes} heroTitle={heroTitle} heroBody={heroBody} />

      <VehicleGridSection
        title="Featured Vehicles"
        subtitle="Hand-picked listings currently available. Swipe or use the arrows to see more."
        vehicles={featured}
        viewAllHref="/vehicles?featured=true"
        layout="carousel"
      />

      <BrowseBy
        brands={brands}
        bodyTypes={bodyTypes}
        fuelTypes={fuelTypes}
        transmissionTypes={transmissionTypes}
        brandSummaries={brandSummaries}
      />

      <VehicleGridSection
        title="Recently Added"
        subtitle="The newest vehicles added to our inventory."
        vehicles={recent}
        viewAllHref="/vehicles"
      />

      <PricingExplainer />
      <ImportProcessPreview />
      <TrustSection />
      <EnquiryCta />
    </>
  );
}

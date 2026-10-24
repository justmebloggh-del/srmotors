import type { Metadata } from "next";
import { getContentBlock } from "@/lib/data/content";
import { TrustSection } from "@/components/home/trust-section";
import { siteConfig } from "@/lib/site-config";

// Served from cache and regenerated at most every 5 minutes; admin edits revalidate immediately.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "About Us",
  description: `About ${siteConfig.name} — automobile sales and import specialists serving Ghana.`,
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const content = await getContentBlock("about");

  return (
    <div>
      <div className="bg-brand-black py-16 text-white">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
            About SR Motors
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">{content?.title ?? "About SR Motors"}</h1>
          <p className="mt-4 text-brand-grey">{siteConfig.tagline}</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="whitespace-pre-line leading-relaxed text-foreground">
          {content?.body ?? siteConfig.description}
        </p>
      </div>

      <TrustSection />
    </div>
  );
}

import { TopBar } from "@/components/layout/top-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppFloat } from "@/components/shared/whatsapp-float";
import { siteConfig } from "@/lib/site-config";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AutomotiveBusiness",
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      email: siteConfig.contact.email,
      telephone: `+${siteConfig.contact.whatsappE164}`,
      areaServed: "GH",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <TopBar />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}

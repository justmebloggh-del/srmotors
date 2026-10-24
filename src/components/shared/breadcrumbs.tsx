import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.label,
      item: item.href ? `${siteConfig.url}${item.href}` : undefined,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          {idx > 0 && <ChevronRight className="size-3.5" />}
          {item.href && idx < items.length - 1 ? (
            <Link href={item.href} className="hover:text-brand-gold-dark">
              {item.label}
            </Link>
          ) : (
            <span className={idx === items.length - 1 ? "text-foreground" : undefined}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

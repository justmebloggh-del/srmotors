import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Regenerated hourly so new listings reach search engines without a redeploy.
export const revalidate = 3600;

const staticRoutes = [
  "",
  "/vehicles",
  "/brands",
  "/import-process",
  "/import-calculator",
  "/about",
  "/contact",
  "/faq",
  "/legal/privacy-policy",
  "/legal/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  try {
    const supabase = createServiceRoleClient();
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("slug, updated_at")
      .not("published_at", "is", null)
      .is("archived_at", null)
      .neq("status", "draft")
      .not("slug", "like", "sample-%")
      .limit(5000);

    for (const v of vehicles ?? []) {
      entries.push({
        url: `${siteConfig.url}/vehicles/${v.slug}`,
        lastModified: v.updated_at,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("published", true)
      .limit(1000);

    for (const p of posts ?? []) {
      entries.push({
        url: `${siteConfig.url}/blog/${p.slug}`,
        lastModified: p.updated_at,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch {
    // Database unavailable at build time — fall back to static routes only.
  }

  return entries;
}

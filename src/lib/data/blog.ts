import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { mediaPublicUrl } from "@/lib/supabase/media-url";

export interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
  authorName: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export async function getBlogPosts(): Promise<BlogPostSummary[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, published_at, media:cover_media_id ( storage_path )")
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImageUrl: mediaPublicUrl(row.media?.storage_path),
    publishedAt: row.published_at,
  }));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const supabase = createPublicClient();
  const { data: row, error } = await supabase
    .from("blog_posts")
    .select(
      "slug, title, excerpt, content, author_name, seo_title, seo_description, published_at, media:cover_media_id ( storage_path )",
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !row) return null;

  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    authorName: row.author_name,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    coverImageUrl: mediaPublicUrl((row as { media?: { storage_path: string } | null }).media?.storage_path),
    publishedAt: row.published_at,
  };
}

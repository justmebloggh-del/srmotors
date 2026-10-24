import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/data/blog";
import { ShareButtons } from "@/components/shared/share-buttons";
import { siteConfig } from "@/lib/site-config";

// Served from cache and regenerated at most every 5 minutes; admin edits revalidate immediately.
export const revalidate = 300;

// Render each listing on first visit, then cache it (no build-time list needed).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.seoTitle ?? post.title,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const url = `${siteConfig.url}/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    author: { "@type": "Organization", name: post.authorName ?? siteConfig.name },
    datePublished: post.publishedAt ?? undefined,
    image: post.coverImageUrl ?? undefined,
    url,
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <h1 className="text-3xl font-bold sm:text-4xl">{post.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {post.authorName ?? siteConfig.name}
        {post.publishedAt && ` · ${new Date(post.publishedAt).toLocaleDateString()}`}
      </p>

      {post.coverImageUrl && (
        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-sm bg-muted">
          <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
        </div>
      )}

      <div className="mt-8 whitespace-pre-line leading-relaxed text-foreground">{post.content}</div>

      <div className="mt-10 border-t border-border pt-6">
        <ShareButtons url={url} title={post.title} />
      </div>
    </article>
  );
}

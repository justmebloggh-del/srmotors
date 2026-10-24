import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getBlogPosts } from "@/lib/data/blog";

// Served from cache and regenerated at most every 5 minutes; admin edits revalidate immediately.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides on importing vehicles to Ghana, understanding FOB pricing, shipping and more from SR Motors.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">SR Motors Blog</h1>
      <p className="mt-3 text-muted-foreground">
        Guidance on importing, FOB pricing, shipping and vehicle buying in Ghana.
      </p>

      {posts.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No articles published yet — check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-sm border border-border"
            >
              <div className="relative aspect-[16/9] bg-muted">
                {post.coverImageUrl && (
                  <Image
                    src={post.coverImageUrl}
                    alt={post.title}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold group-hover:text-brand-gold-dark">{post.title}</h2>
                {post.excerpt && <p className="mt-1 text-sm text-muted-foreground">{post.excerpt}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

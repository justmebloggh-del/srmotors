"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublicSite } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/audit";

export interface BlogActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function upsertBlogPostAction(input: {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
}): Promise<BlogActionResult> {
  const session = await requireAdmin();
  if (!input.title.trim() || !input.content.trim()) return { ok: false, error: "Title and content are required." };

  const supabase = await createClient();
  const publishedAt = input.published ? new Date().toISOString() : null;

  if (input.id) {
    const { error } = await supabase
      .from("blog_posts")
      .update({ title: input.title, excerpt: input.excerpt, content: input.content, published: input.published, published_at: publishedAt })
      .eq("id", input.id);
    if (error) return { ok: false, error: "Could not update article." };
    await logAuditEvent({ action: "blog_post.update", entityType: "blog_post", entityId: input.id });
  } else {
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        slug: `${slugify(input.title)}-${Date.now().toString(36)}`,
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        published: input.published,
        published_at: publishedAt,
        created_by: session.userId,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: "Could not create article." };
    await logAuditEvent({ action: "blog_post.create", entityType: "blog_post", entityId: data.id });
  }

  revalidatePath("/admin/blog");
  revalidatePublicSite();
  return { ok: true };
}

export async function deleteBlogPostAction(id: string): Promise<BlogActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete article." };

  revalidatePath("/admin/blog");
  revalidatePublicSite();
  return { ok: true };
}

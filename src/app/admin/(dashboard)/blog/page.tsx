import { createClient } from "@/lib/supabase/server";
import { BlogManager } from "@/components/admin/blog-manager";

export default async function AdminBlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, excerpt, content, published")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Blog</h1>
      <BlogManager posts={posts ?? []} />
    </div>
  );
}

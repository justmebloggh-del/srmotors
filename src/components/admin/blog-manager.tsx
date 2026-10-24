"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { upsertBlogPostAction, deleteBlogPostAction } from "@/app/actions/blog";

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  published: boolean;
}

export function BlogManager({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", published: false });
  const [pending, startTransition] = useTransition();

  function startEdit(post: Post | null) {
    setEditing(post);
    setForm(post ? { title: post.title, excerpt: post.excerpt ?? "", content: post.content, published: post.published } : { title: "", excerpt: "", content: "", published: false });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertBlogPostAction({ id: editing?.id, ...form });
      if (result.ok) {
        toast.success("Saved");
        startEdit(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this article?")) return;
    startTransition(async () => {
      await deleteBlogPostAction(id);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-2">
        <Button size="sm" onClick={() => startEdit(null)}>
          + New Article
        </Button>
        {posts.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-sm border border-border p-3">
            <div>
              <p className="text-sm font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.published ? "Published" : "Draft"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(p)}>
                <Pencil className="size-4" />
              </button>
              <button onClick={() => handleDelete(p.id)} disabled={pending}>
                <Trash2 className="size-4 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-sm border border-border p-5">
        <h2 className="font-semibold">{editing ? "Edit Article" : "New Article"}</h2>
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea placeholder="Excerpt" rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
        <Textarea placeholder="Content" rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: Boolean(v) })} />
          Published
        </label>
        <Button disabled={pending} onClick={handleSave} className="bg-brand-gold text-brand-black hover:bg-brand-gold-light">
          Save Article
        </Button>
      </div>
    </div>
  );
}

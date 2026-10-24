"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublicSite } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/audit";

export interface ContentActionResult {
  ok: boolean;
  error?: string;
}

export async function upsertContentBlockAction(input: {
  key: string;
  title: string;
  body: string;
  published: boolean;
}): Promise<ContentActionResult> {
  const session = await requireAdmin();
  if (input.key === "duty_checker") {
    if (!input.title.trim()) return { ok: false, error: "Enter the service name." };
    if (!/^https:\/\/[^\s]+$/.test(input.body.trim())) {
      return { ok: false, error: "The link must be a full https:// address." };
    }
    input = { ...input, title: input.title.trim(), body: input.body.trim() };
  }
  const supabase = await createClient();

  const { error } = await supabase.from("content_blocks").upsert({
    key: input.key,
    title: input.title,
    body: input.body,
    published: input.published,
    updated_by: session.userId,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: "Could not save content." };

  await logAuditEvent({ action: "content.update", entityType: "content_block", entityId: input.key });
  revalidatePath("/admin/content");
  revalidatePublicSite();
  return { ok: true };
}

export async function createFaqAction(question: string, answer: string): Promise<ContentActionResult> {
  await requireAdmin();
  if (!question.trim() || !answer.trim()) return { ok: false, error: "Question and answer are required." };

  const supabase = await createClient();
  const { error } = await supabase.from("faqs").insert({ question: question.trim(), answer: answer.trim(), published: true });
  if (error) return { ok: false, error: "Could not create FAQ." };

  revalidatePath("/admin/content");
  revalidatePublicSite();
  return { ok: true };
}

export async function deleteFaqAction(id: string): Promise<ContentActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete FAQ." };

  revalidatePath("/admin/content");
  revalidatePublicSite();
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/audit";

export interface EnquiryActionResult {
  ok: boolean;
  error?: string;
}

type EnquiryStatus = "new" | "contacted" | "negotiating" | "converted" | "closed";

export async function setEnquiryStatusAction(
  id: string,
  status: EnquiryStatus,
): Promise<EnquiryActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
  if (error) return { ok: false, error: "Could not update status." };

  await logAuditEvent({ action: "enquiry.status_change", entityType: "enquiry", entityId: id, metadata: { status } });
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
  return { ok: true };
}

export async function setEnquiryFollowUpAction(id: string, date: string | null): Promise<EnquiryActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("enquiries").update({ follow_up_date: date }).eq("id", id);
  if (error) return { ok: false, error: "Could not update follow-up date." };
  revalidatePath(`/admin/enquiries/${id}`);
  return { ok: true };
}

export async function addEnquiryNoteAction(id: string, note: string): Promise<EnquiryActionResult> {
  const session = await requireAdmin();
  if (!note.trim()) return { ok: false, error: "Note cannot be empty." };

  const supabase = await createClient();
  const { error } = await supabase.from("enquiry_notes").insert({ enquiry_id: id, author_id: session.userId, note: note.trim() });
  if (error) return { ok: false, error: "Could not add note." };

  revalidatePath(`/admin/enquiries/${id}`);
  return { ok: true };
}

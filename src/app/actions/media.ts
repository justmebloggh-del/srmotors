"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublicSite } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/audit";

export interface MediaRecordResult {
  ok: boolean;
  error?: string;
  id?: string;
}

/**
 * Registers a file already uploaded to the `media` storage bucket (by the
 * authenticated admin's browser client, under RLS) as a `media` table row.
 * The upload itself happens client-side; this just records the metadata.
 */
export async function registerUploadedMediaAction(input: {
  storagePath: string;
  type: "image" | "video";
  mimeType: string;
  filesizeBytes: number;
  width?: number;
  height?: number;
  originalFilename: string;
  altText?: string;
}): Promise<MediaRecordResult> {
  const session = await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("media")
    .insert({
      type: input.type,
      storage_path: input.storagePath,
      mime_type: input.mimeType,
      filesize_bytes: input.filesizeBytes,
      width: input.width ?? null,
      height: input.height ?? null,
      original_filename: input.originalFilename,
      alt_text: input.altText ?? null,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("registerUploadedMediaAction failed", error);
    return { ok: false, error: "Could not save media record." };
  }

  await logAuditEvent({ action: "media.upload", entityType: "media", entityId: data.id });
  revalidatePath("/admin/media");
  revalidatePublicSite();
  return { ok: true, id: data.id };
}

export async function updateMediaAltTextAction(id: string, altText: string): Promise<MediaRecordResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("media").update({ alt_text: altText }).eq("id", id);
  if (error) return { ok: false, error: "Could not update alt text." };
  revalidatePath("/admin/media");
  revalidatePublicSite();
  return { ok: true };
}

export async function deleteMediaAction(id: string, storagePath: string): Promise<MediaRecordResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { count } = await supabase
    .from("vehicle_media")
    .select("id", { count: "exact", head: true })
    .eq("media_id", id);

  if (count && count > 0) {
    return { ok: false, error: "This media is still used by one or more vehicles. Remove it from those listings first." };
  }

  await supabase.storage.from("media").remove([storagePath]);
  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete media." };

  await logAuditEvent({ action: "media.delete", entityType: "media", entityId: id });
  revalidatePath("/admin/media");
  revalidatePublicSite();
  return { ok: true };
}

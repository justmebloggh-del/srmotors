import "server-only";
import { createClient } from "@/lib/supabase/server";
import { mediaPublicUrl } from "@/lib/supabase/media-url";

export interface AdminMediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  altText: string | null;
  originalFilename: string | null;
  storagePath: string;
  usageCount: number;
  createdAt: string;
}

export async function listAdminMedia(search?: string): Promise<AdminMediaItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("media")
    .select("id, type, storage_path, alt_text, original_filename, created_at, vehicle_media ( id )")
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) query = query.ilike("original_filename", `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    url: mediaPublicUrl(row.storage_path) ?? "",
    type: row.type,
    altText: row.alt_text,
    originalFilename: row.original_filename,
    storagePath: row.storage_path,
    usageCount: row.vehicle_media?.length ?? 0,
    createdAt: row.created_at,
  }));
}

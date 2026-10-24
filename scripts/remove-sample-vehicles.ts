/**
 * Removes every SAMPLE listing (slug starts with "sample-") plus its photos.
 * Customer enquiries about a sample are kept (their vehicle link is cleared),
 * because enquiries are real customer records.
 *
 *   npm run samples:remove
 */
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: vehicles, error } = await db.from("vehicles").select("id, slug").like("slug", "sample-%");
  if (error) throw error;
  const ids = (vehicles ?? []).map((v) => v.id);

  const { data: media } = await db.from("media").select("id, storage_path").like("storage_path", "samples/%");

  if (ids.length) {
    // vehicle_media and cost estimates cascade; enquiries keep their record with vehicle_id cleared.
    const { error: deleteError } = await db.from("vehicles").delete().in("id", ids);
    if (deleteError) throw deleteError;
  }
  if (media?.length) {
    await db.storage.from("media").remove(media.map((m) => m.storage_path));
    await db.from("media").delete().in("id", media.map((m) => m.id));
  }

  console.log(`Target: ${url}`);
  console.log(`Removed ${ids.length} sample listing(s) and ${media?.length ?? 0} sample photo(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

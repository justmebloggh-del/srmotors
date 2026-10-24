/**
 * Adds the 20 temporary SAMPLE listings from scripts/sample-data/sample-vehicles.json
 * (featured, available, each with a gallery of Wikimedia Commons photos: front,
 * rear, side, interior… where freely licensed left-hand-drive photos exist).
 * Also gives the two original local seed vehicles a photo gallery.
 *
 * Safe to re-run: existing listings are kept and only missing photos are added.
 *
 *   npm run samples:seed      (uses .env.local)
 *   npm run samples:remove    (deletes the samples and every sample photo again)
 *
 * Uses the service role key, so it runs against whichever Supabase project the
 * env points at — double-check before running it against production.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

interface Photo {
  view: string;
  url: string;
  commonsPage: string;
  license: string;
  author: string;
  file: string;
}

interface SampleVehicle {
  slug: string;
  brand: string;
  model: string;
  trim: string;
  year: number;
  mileageValue: number;
  mileageUnit: "km" | "miles";
  fuelType: string;
  transmission: string;
  engineCapacityCc: number;
  bodyType: string;
  drivetrain: string;
  steering: "lhd";
  condition: "used";
  sourceCountry: string;
  location: string;
  cbm: number;
  fobAmount: number;
  fobCurrency: string;
  image: Omit<Photo, "view">;
  gallery: Photo[];
}

const USER_AGENT = "SRMotorsSampleSeeder/1.0 (sample data seeding; contact srmotors@gmail.com)";

/** Uploads one photo (if not already stored) and returns its media id. */
async function storePhoto(db: SupabaseClient, storagePath: string, photo: Photo, title: string): Promise<string> {
  const { data: existing } = await db.from("media").select("id").eq("storage_path", storagePath).maybeSingle();

  if (!existing) {
    const response = await fetch(photo.url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) throw new Error(`Could not download ${photo.file}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const { error } = await db.storage
      .from("media")
      .upload(storagePath, bytes, { contentType: "image/jpeg", upsert: true, cacheControl: "31536000" });
    if (error) throw error;
  }

  const { data, error } = await db
    .from("media")
    .upsert(
      {
        type: "image",
        storage_path: storagePath,
        mime_type: "image/jpeg",
        original_filename: photo.file,
        // "<title> — <view>" is what the gallery reads its view label from.
        alt_text: `${title} — ${photo.view}`,
        caption: `Photo: ${photo.author}, ${photo.license}, via Wikimedia Commons — ${photo.commonsPage}`,
      },
      { onConflict: "storage_path" },
    )
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("media upsert failed");
  return data.id;
}

/** Ensures every photo is attached to the vehicle in order; the first becomes the main image. */
async function syncGallery(db: SupabaseClient, vehicleId: string, slug: string, title: string, photos: Photo[]) {
  const mediaIds: string[] = [];
  for (const [i, photo] of photos.entries()) {
    const storagePath = i === 0 && slug.startsWith("sample-") ? `samples/${slug}.jpg` : `samples/${slug}-${i + 1}.jpg`;
    mediaIds.push(await storePhoto(db, storagePath, photo, title));
  }

  const { data: linked } = await db.from("vehicle_media").select("media_id").eq("vehicle_id", vehicleId);
  const already = new Set((linked ?? []).map((l) => l.media_id));
  const missing = mediaIds.map((id, position) => ({ id, position })).filter((m) => !already.has(m.id));
  if (missing.length) {
    const { error } = await db
      .from("vehicle_media")
      .insert(missing.map((m) => ({ vehicle_id: vehicleId, media_id: m.id, position: m.position })));
    if (error) throw error;
  }

  const { error } = await db.from("vehicles").update({ main_media_id: mediaIds[0] }).eq("id", vehicleId);
  if (error) throw error;
  return missing.length;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  const db = createClient(url, key, { auth: { persistSession: false } });

  const manifest = JSON.parse(
    readFileSync(path.join(process.cwd(), "scripts/sample-data/sample-vehicles.json"), "utf8"),
  ) as { vehicles: SampleVehicle[]; existingVehicleGalleries?: Record<string, Photo[]> };

  const lookup = async (table: string, column: string) => {
    const { data, error } = await db.from(table).select(`id, ${column}`);
    if (error) throw error;
    return new Map((data as unknown as Record<string, string>[]).map((r) => [r[column], r.id]));
  };
  const [brands, bodyTypes, fuelTypes, transmissions] = await Promise.all([
    lookup("brands", "name"),
    lookup("body_types", "slug"),
    lookup("fuel_types", "slug"),
    lookup("transmission_types", "slug"),
  ]);

  console.log(`Target: ${url}`);
  let created = 0;
  let photosAdded = 0;

  for (const v of manifest.vehicles) {
    const title = `${v.year} ${v.brand} ${v.model} ${v.trim}`;
    const photos: Photo[] = [{ ...v.image, view: "Front view" }, ...(v.gallery ?? [])];

    let { data: vehicle } = await db.from("vehicles").select("id").eq("slug", v.slug).maybeSingle();

    if (!vehicle) {
      const brandId = brands.get(v.brand);
      if (!brandId) throw new Error(`Brand "${v.brand}" not found — add it under Brands & Categories first`);
      const { data, error } = await db
        .from("vehicles")
        .insert({
          slug: v.slug,
          brand_id: brandId,
          model_name_override: v.model,
          trim: v.trim,
          year: v.year,
          mileage_value: v.mileageValue,
          mileage_unit: v.mileageUnit,
          fuel_type_id: fuelTypes.get(v.fuelType) ?? null,
          transmission_id: transmissions.get(v.transmission) ?? null,
          engine_capacity_cc: v.engineCapacityCc,
          body_type_id: bodyTypes.get(v.bodyType) ?? null,
          drivetrain: v.drivetrain,
          steering: v.steering,
          condition: v.condition,
          source_country: v.sourceCountry,
          location: v.location,
          cbm: v.cbm,
          fob_amount: v.fobAmount,
          fob_currency: v.fobCurrency,
          status: "available",
          featured: true,
          description:
            `SAMPLE LISTING — for demonstration only, not a real vehicle for sale. ` +
            `${title}, ${v.mileageValue.toLocaleString()} ${v.mileageUnit}, sourced from ${v.sourceCountry}. ` +
            `Prices and specifications are illustrative.`,
          published_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("vehicle insert failed");
      vehicle = data;
      created += 1;
    }

    const added = await syncGallery(db, vehicle.id, v.slug, title, photos);
    photosAdded += added;
    console.log(`  ${v.slug.padEnd(42)} ${photos.length} photos${added ? ` (+${added} new)` : ""}`);
  }

  for (const [slug, photos] of Object.entries(manifest.existingVehicleGalleries ?? {})) {
    const { data: vehicle } = await db
      .from("vehicles")
      .select("id, year, model_name_override, trim, brands ( name ), vehicle_models ( name )")
      .eq("slug", slug)
      .maybeSingle();
    if (!vehicle) continue; // only exists on the local seed database
    const v = vehicle as unknown as {
      id: string;
      year: number;
      trim: string | null;
      model_name_override: string | null;
      brands: { name: string } | null;
      vehicle_models: { name: string } | null;
    };
    const title = [v.year, v.brands?.name, v.vehicle_models?.name ?? v.model_name_override, v.trim].filter(Boolean).join(" ");
    const added = await syncGallery(db, v.id, slug, title, photos);
    photosAdded += added;
    console.log(`  ${slug.padEnd(42)} ${photos.length} photos${added ? ` (+${added} new)` : ""}`);
  }

  console.log(`\nDone: ${created} listing(s) created, ${photosAdded} photo(s) attached.`);
  console.log("Public pages are cached for up to 5 minutes; they refresh on the next visit after that.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

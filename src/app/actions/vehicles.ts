"use server";

import { revalidatePath } from "next/cache";
import { revalidatePublicSite } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/audit";
import { vehicleFormSchema, type VehicleFormInput } from "@/lib/validations/vehicle";
import { PHOTO_VIEWS, altTextForView } from "@/lib/vehicle-photo-views";

export interface VehicleActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export interface VehicleGalleryItem {
  mediaId: string;
  position: number;
  view?: string | null;
}

function toRow(input: VehicleFormInput) {
  return {
    slug: input.slug,
    brand_id: input.brandId,
    model_id: input.modelId || null,
    model_name_override: input.modelNameOverride || null,
    trim: input.trim || null,
    year: input.year,
    mileage_value: input.mileageValue ?? null,
    mileage_unit: input.mileageUnit,
    fuel_type_id: input.fuelTypeId || null,
    transmission_id: input.transmissionId || null,
    engine_capacity_cc: input.engineCapacityCc ?? null,
    body_type_id: input.bodyTypeId || null,
    drivetrain: input.drivetrain || null,
    steering: input.steering || null,
    condition: input.condition,
    source_country: input.sourceCountry || null,
    location: input.location || null,
    cbm: input.cbm ?? null,
    fob_amount: input.fobAmount,
    fob_currency: input.fobCurrency,
    price_notes: input.priceNotes || null,
    status: input.status,
    featured: input.featured,
    description: input.description || null,
    condition_notes: input.conditionNotes || null,
    seo_title: input.seoTitle || null,
    seo_description: input.seoDescription || null,
  };
}

async function vehicleTitle(input: VehicleFormInput) {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("name").eq("id", input.brandId).maybeSingle();
  return [input.year, data?.name, input.modelNameOverride, input.trim].filter(Boolean).join(" ");
}

async function syncGallery(vehicleId: string, gallery: VehicleGalleryItem[], title: string) {
  const supabase = await createClient();

  // Labelled photos get a consistent, descriptive alt text ("2020 Toyota Corolla SE — Rear view"),
  // rebuilt on every save so it follows edits to the vehicle's title.
  const views = new Set<string>(PHOTO_VIEWS);
  await Promise.all(
    gallery
      .filter((g) => g.view && views.has(g.view))
      .map((g) => supabase.from("media").update({ alt_text: altTextForView(title, g.view!) }).eq("id", g.mediaId)),
  );

  await supabase.from("vehicle_media").delete().eq("vehicle_id", vehicleId);

  if (gallery.length > 0) {
    await supabase.from("vehicle_media").insert(
      gallery.map((g) => ({ vehicle_id: vehicleId, media_id: g.mediaId, position: g.position })),
    );
  }

  const mainMediaId = gallery[0]?.mediaId ?? null;
  await supabase.from("vehicles").update({ main_media_id: mainMediaId }).eq("id", vehicleId);
}

export async function createVehicleAction(
  input: VehicleFormInput,
  gallery: VehicleGalleryItem[],
): Promise<VehicleActionResult> {
  const session = await requireAdmin();
  const parsed = vehicleFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid vehicle data" };
  }

  const supabase = await createClient();
  const row = toRow(parsed.data);
  const publishedAt = parsed.data.status === "draft" ? null : new Date().toISOString();

  const { data, error } = await supabase
    .from("vehicles")
    .insert({ ...row, published_at: publishedAt, created_by: session.userId, updated_by: session.userId })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createVehicleAction failed", error);
    return { ok: false, error: "Could not create vehicle. Check that the slug is unique." };
  }

  await syncGallery(data.id, gallery, await vehicleTitle(parsed.data));
  await logAuditEvent({ action: "vehicle.create", entityType: "vehicle", entityId: data.id, metadata: { slug: row.slug } });

  revalidatePath("/admin/vehicles");
  revalidatePublicSite();
  return { ok: true, id: data.id };
}

export async function updateVehicleAction(
  id: string,
  input: VehicleFormInput,
  gallery: VehicleGalleryItem[],
): Promise<VehicleActionResult> {
  const session = await requireAdmin();
  const parsed = vehicleFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid vehicle data" };
  }

  const supabase = await createClient();
  const row = toRow(parsed.data);

  const { data: existing } = await supabase.from("vehicles").select("published_at, status").eq("id", id).maybeSingle();
  const publishedAt =
    parsed.data.status === "draft" ? null : (existing?.published_at ?? new Date().toISOString());

  const { error } = await supabase
    .from("vehicles")
    .update({ ...row, published_at: publishedAt, updated_by: session.userId })
    .eq("id", id);

  if (error) {
    console.error("updateVehicleAction failed", error);
    return { ok: false, error: "Could not update vehicle. Check that the slug is unique." };
  }

  await syncGallery(id, gallery, await vehicleTitle(parsed.data));
  await logAuditEvent({ action: "vehicle.update", entityType: "vehicle", entityId: id, metadata: { slug: row.slug } });

  revalidatePath("/admin/vehicles");
  revalidatePublicSite();
  return { ok: true, id };
}

export async function archiveVehicleAction(id: string): Promise<VehicleActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  // Soft-delete only — enquiries referencing this vehicle must survive.
  const { error } = await supabase
    .from("vehicles")
    .update({ archived_at: new Date().toISOString(), status: "archived" })
    .eq("id", id);

  if (error) return { ok: false, error: "Could not archive vehicle." };

  await logAuditEvent({ action: "vehicle.archive", entityType: "vehicle", entityId: id });
  revalidatePath("/admin/vehicles");
  revalidatePublicSite();
  return { ok: true };
}

export async function setVehicleStatusAction(
  id: string,
  status: "draft" | "available" | "reserved" | "sold" | "archived",
): Promise<VehicleActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  let publishedAt: string | undefined;
  if (status !== "draft") {
    const { data: existing } = await supabase.from("vehicles").select("published_at").eq("id", id).maybeSingle();
    if (!existing?.published_at) publishedAt = new Date().toISOString();
  }

  const { error } = await supabase
    .from("vehicles")
    .update(publishedAt ? { status, published_at: publishedAt } : { status })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not update status." };

  await logAuditEvent({ action: "vehicle.status_change", entityType: "vehicle", entityId: id, metadata: { status } });
  revalidatePath("/admin/vehicles");
  revalidatePublicSite();
  return { ok: true };
}

export async function toggleFeaturedAction(id: string, featured: boolean): Promise<VehicleActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").update({ featured }).eq("id", id);
  if (error) return { ok: false, error: "Could not update featured status." };

  await logAuditEvent({ action: "vehicle.feature_toggle", entityType: "vehicle", entityId: id, metadata: { featured } });
  revalidatePath("/admin/vehicles");
  revalidatePublicSite();
  return { ok: true };
}

export async function duplicateVehicleAction(id: string): Promise<VehicleActionResult> {
  const session = await requireAdmin();
  const supabase = await createClient();

  const { data: original, error: fetchError } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();
  if (fetchError || !original) return { ok: false, error: "Vehicle not found." };

  const { id: _id, created_at, updated_at, slug, published_at, ...rest } = original;
  void _id;
  void created_at;
  void updated_at;
  void published_at;

  const newSlug = `${slug}-copy-${Date.now().toString(36)}`;

  const { data: created, error } = await supabase
    .from("vehicles")
    .insert({ ...rest, slug: newSlug, status: "draft", published_at: null, created_by: session.userId, updated_by: session.userId })
    .select("id")
    .single();

  if (error || !created) return { ok: false, error: "Could not duplicate vehicle." };

  const { data: media } = await supabase.from("vehicle_media").select("media_id, position").eq("vehicle_id", id);
  if (media?.length) {
    await supabase
      .from("vehicle_media")
      .insert(media.map((m) => ({ vehicle_id: created.id, media_id: m.media_id, position: m.position })));
  }

  await logAuditEvent({ action: "vehicle.duplicate", entityType: "vehicle", entityId: created.id, metadata: { from: id } });
  revalidatePath("/admin/vehicles");
  revalidatePublicSite();
  return { ok: true, id: created.id };
}

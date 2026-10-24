import { notFound } from "next/navigation";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { getAdminVehicleById } from "@/lib/data/admin-vehicles";
import { getBrands, getBodyTypes, getFuelTypes, getTransmissionTypes } from "@/lib/data/taxonomies";
import { mediaPublicUrl } from "@/lib/supabase/media-url";
import type { GalleryItem } from "@/components/admin/vehicle-media-uploader";
import { viewFromAltText } from "@/lib/vehicle-photo-views";

export default async function EditVehiclePage({
  params,
}: PageProps<"/admin/vehicles/[id]/edit">) {
  const { id } = await params;

  const [vehicle, brands, bodyTypes, fuelTypes, transmissionTypes] = await Promise.all([
    getAdminVehicleById(id),
    getBrands(),
    getBodyTypes(),
    getFuelTypes(),
    getTransmissionTypes(),
  ]);

  if (!vehicle) notFound();

  const gallery: GalleryItem[] = (vehicle.vehicle_media ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.position - b.position)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((vm: any) => ({
      mediaId: vm.media.id,
      url: mediaPublicUrl(vm.media.storage_path) ?? "",
      type: vm.media.type,
      altText: vm.media.alt_text,
      view: viewFromAltText(vm.media.alt_text),
    }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">
        Edit {vehicle.year} Vehicle
      </h1>
      <VehicleForm
        vehicleId={vehicle.id}
        defaultValues={{
          slug: vehicle.slug,
          brandId: vehicle.brand_id,
          modelId: vehicle.model_id,
          modelNameOverride: vehicle.model_name_override,
          trim: vehicle.trim,
          year: vehicle.year,
          mileageValue: vehicle.mileage_value,
          mileageUnit: vehicle.mileage_unit,
          fuelTypeId: vehicle.fuel_type_id,
          transmissionId: vehicle.transmission_id,
          engineCapacityCc: vehicle.engine_capacity_cc,
          bodyTypeId: vehicle.body_type_id,
          drivetrain: vehicle.drivetrain,
          steering: vehicle.steering,
          condition: vehicle.condition,
          sourceCountry: vehicle.source_country,
          location: vehicle.location,
          cbm: vehicle.cbm,
          fobAmount: Number(vehicle.fob_amount),
          fobCurrency: vehicle.fob_currency,
          priceNotes: vehicle.price_notes,
          status: vehicle.status,
          featured: vehicle.featured,
          description: vehicle.description,
          conditionNotes: vehicle.condition_notes,
          seoTitle: vehicle.seo_title,
          seoDescription: vehicle.seo_description,
        }}
        defaultGallery={gallery}
        brands={brands}
        bodyTypes={bodyTypes}
        fuelTypes={fuelTypes}
        transmissionTypes={transmissionTypes}
      />
    </div>
  );
}

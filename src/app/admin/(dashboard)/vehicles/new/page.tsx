import { VehicleForm } from "@/components/admin/vehicle-form";
import { getBrands, getBodyTypes, getFuelTypes, getTransmissionTypes } from "@/lib/data/taxonomies";

export default async function NewVehiclePage() {
  const [brands, bodyTypes, fuelTypes, transmissionTypes] = await Promise.all([
    getBrands(),
    getBodyTypes(),
    getFuelTypes(),
    getTransmissionTypes(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add Vehicle</h1>
      <VehicleForm brands={brands} bodyTypes={bodyTypes} fuelTypes={fuelTypes} transmissionTypes={transmissionTypes} />
    </div>
  );
}

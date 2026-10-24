import { getBrands, getBodyTypes, getFuelTypes, getTransmissionTypes } from "@/lib/data/taxonomies";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";

export default async function AdminTaxonomiesPage() {
  const [brands, bodyTypes, fuelTypes, transmissionTypes] = await Promise.all([
    getBrands(),
    getBodyTypes(),
    getFuelTypes(),
    getTransmissionTypes(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Brands & Categories</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <TaxonomyManager table="brands" title="Brands" items={brands} />
        <TaxonomyManager table="body_types" title="Body Types" items={bodyTypes} />
        <TaxonomyManager table="fuel_types" title="Fuel Types" items={fuelTypes} />
        <TaxonomyManager table="transmission_types" title="Transmission Types" items={transmissionTypes} />
      </div>
    </div>
  );
}

import {
  conditionLabel,
  drivetrainLabel,
  formatEngine,
  formatMileage,
  steeringLabel,
} from "@/lib/utils/format";
import type { VehicleDetail } from "@/types/vehicle";

export function VehicleSpecTable({ vehicle }: { vehicle: VehicleDetail }) {
  const specs: { label: string; value: string }[] = [
    { label: "Year", value: String(vehicle.year) },
    { label: "Mileage", value: formatMileage(vehicle.mileageValue, vehicle.mileageUnit) },
    { label: "Fuel Type", value: vehicle.fuelType ?? "—" },
    { label: "Transmission", value: vehicle.transmission ?? "—" },
    { label: "Engine Capacity", value: formatEngine(vehicle.engineCapacityCc) },
    { label: "Body Type", value: vehicle.bodyType ?? "—" },
    { label: "Drivetrain", value: drivetrainLabel(vehicle.drivetrain) },
    { label: "Steering", value: steeringLabel(vehicle.steering) },
    { label: "Condition", value: conditionLabel(vehicle.condition) },
    { label: "Source Country", value: vehicle.sourceCountry ?? "—" },
    { label: "Location", value: vehicle.location ?? "—" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {specs.map((spec) => (
        <div key={spec.label}>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{spec.label}</dt>
          <dd className="mt-0.5 font-medium">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}

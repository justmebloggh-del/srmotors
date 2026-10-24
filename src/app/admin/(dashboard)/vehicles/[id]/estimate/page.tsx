import { notFound } from "next/navigation";
import { getAdminVehicleById, getVehicleCostEstimateHistory } from "@/lib/data/admin-vehicles";
import { CostEstimateForm } from "@/components/admin/cost-estimate-form";
import { formatMoney } from "@/lib/cost-estimate";
import { getDutyChecker } from "@/lib/data/content";
import { conditionLabel, formatPrice } from "@/lib/utils/format";

export default async function VehicleEstimatePage({
  params,
}: PageProps<"/admin/vehicles/[id]/estimate">) {
  const { id } = await params;
  const [vehicle, history, dutyChecker] = await Promise.all([
    getAdminVehicleById(id),
    getVehicleCostEstimateHistory(id),
    getDutyChecker(),
  ]);
  if (!vehicle) notFound();

  const brand = (vehicle as { brands?: { name: string } | null }).brands?.name ?? "";
  const model = (vehicle as { vehicle_models?: { name: string } | null }).vehicle_models?.name ?? vehicle.model_name_override ?? "";
  const dutyCheckDetails = [
    brand,
    model,
    vehicle.year,
    vehicle.engine_capacity_cc ? `${vehicle.engine_capacity_cc.toLocaleString()} cc` : null,
    conditionLabel(vehicle.condition),
    vehicle.source_country,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Cost Estimate</h1>
        <p className="text-sm text-muted-foreground">
          {vehicle.year} {brand} {model} — FOB {formatPrice(Number(vehicle.fob_amount), vehicle.fob_currency)}
        </p>
      </div>

      <CostEstimateForm vehicleId={id} dutyChecker={dutyChecker} dutyCheckDetails={dutyCheckDetails} />

      <div>
        <h2 className="mb-3 font-semibold">Estimate History</h2>
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.id} className="rounded-sm border border-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{h.status}</span>
                <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Shipping: {formatMoney(h.shipping_amount ? Number(h.shipping_amount) : null, h.shipping_currency)} ·
                Customs: {formatMoney(h.customs_duty_amount ? Number(h.customs_duty_amount) : null, h.customs_currency)}
              </p>
            </div>
          ))}
          {history.length === 0 && <p className="text-sm text-muted-foreground">No estimates recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}

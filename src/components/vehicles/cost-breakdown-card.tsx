import { buildCostBreakdown } from "@/lib/cost-estimate";
import { CostBreakdownView } from "@/components/vehicles/cost-breakdown-view";
import type { RatesToGhs } from "@/lib/exchange-rates";
import type { VehicleCostEstimate } from "@/types/vehicle";

export function CostBreakdownCard({
  vehicleId,
  fobAmount,
  fobCurrency,
  estimate,
  rates,
}: {
  vehicleId: string;
  fobAmount: number;
  fobCurrency: string;
  estimate: VehicleCostEstimate | null;
  rates: RatesToGhs;
}) {
  const breakdown = buildCostBreakdown(vehicleId, fobAmount, fobCurrency, estimate, rates);

  return (
    <div className="rounded-sm border border-border p-5">
      <h3 className="mb-4 font-semibold">Estimated Import Cost to Ghana</h3>
      <CostBreakdownView breakdown={breakdown} />
    </div>
  );
}

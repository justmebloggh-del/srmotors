import type { Metadata } from "next";
import { getVehicleOptions } from "@/lib/data/vehicles";
import { ImportCalculatorClient } from "@/components/calculator/import-calculator-client";
import { getCostEstimateForVehicle } from "@/app/actions/cost-estimate";
import { getDutyChecker } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Import Cost Calculator",
  description:
    "Estimate the total cost of importing a vehicle to Ghana — FOB price, shipping, Ghana Customs duty and clearing fees, broken down transparently.",
  alternates: { canonical: "/import-calculator" },
};

export default async function ImportCalculatorPage({
  searchParams,
}: PageProps<"/import-calculator">) {
  const resolved = await searchParams;
  const initialSlug = Array.isArray(resolved.vehicle) ? resolved.vehicle[0] : resolved.vehicle;
  const [vehicleOptions, initialResult, dutyChecker] = await Promise.all([
    getVehicleOptions(),
    initialSlug ? getCostEstimateForVehicle(initialSlug) : Promise.resolve(null),
    getDutyChecker(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold">Import Cost Calculator</h1>
        <p className="mt-2 text-muted-foreground">
          Select a vehicle to see a transparent breakdown of its FOB price plus shipping, Ghana
          Customs duty and other applicable charges — wherever a current figure is available.
        </p>
      </div>

      <ImportCalculatorClient vehicleOptions={vehicleOptions} initialSlug={initialSlug} initialResult={initialResult}
        dutyChecker={dutyChecker}
      />
    </div>
  );
}

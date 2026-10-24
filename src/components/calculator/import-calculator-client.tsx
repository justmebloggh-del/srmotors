"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EnquiryForm } from "@/components/shared/enquiry-form";
import { fobDisclaimer } from "@/lib/site-config";
import { CostBreakdownView } from "@/components/vehicles/cost-breakdown-view";
import { DutyCheckerCard } from "@/components/shared/duty-checker-card";
import type { DutyChecker } from "@/lib/data/content";
import { getCostEstimateForVehicle, type VehicleEstimateResult } from "@/app/actions/cost-estimate";

export function ImportCalculatorClient({
  vehicleOptions,
  initialSlug,
  initialResult,
  dutyChecker,
}: {
  vehicleOptions: { slug: string; label: string }[];
  initialSlug?: string;
  /** Computed on the server so a shared ?vehicle= link shows its breakdown immediately. */
  initialResult: VehicleEstimateResult | null;
  dutyChecker: DutyChecker | null;
}) {
  const [slug, setSlug] = useState<string | undefined>(initialResult ? initialSlug : undefined);
  const [result, setResult] = useState<VehicleEstimateResult | null>(initialResult);
  const [pending, startTransition] = useTransition();

  function selectVehicle(next: string) {
    setSlug(next);
    startTransition(async () => {
      setResult(await getCostEstimateForVehicle(next));
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Select a vehicle from our inventory</label>
          <Select value={slug} onValueChange={selectVehicle}>
            <SelectTrigger className="w-full" aria-label="Vehicle">
              <SelectValue placeholder="Choose a vehicle…" />
            </SelectTrigger>
            <SelectContent>
              {vehicleOptions.map((v) => (
                <SelectItem key={v.slug} value={v.slug}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">
            Don&apos;t see the vehicle you want? {" "}
            <Link href="/contact" className="font-medium text-brand-gold-dark hover:underline">
              Contact us
            </Link>{" "}
            for a custom estimate.
          </p>
        </div>

        <div className="rounded-sm border border-brand-gold/30 bg-brand-gold/5 p-4 text-sm">
          {fobDisclaimer}
        </div>

        {pending && <p className="text-sm text-muted-foreground">Calculating…</p>}

        {result && (
          <div id="print-area" className="rounded-sm border border-border p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {result.vehicle.year} {result.vehicle.title}
                </h2>
              </div>
              <Button variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
                <Printer className="size-4" /> Print
              </Button>
            </div>

            <CostBreakdownView breakdown={result.breakdown} />
          </div>
        )}

        {dutyChecker && (
          <div className="print:hidden">
            <DutyCheckerCard
              checker={dutyChecker}
              vehicle={
                result
                  ? {
                      brand: result.vehicle.brand,
                      model: result.vehicle.model,
                      year: result.vehicle.year,
                      engineCapacityCc: result.vehicle.engineCapacityCc,
                      condition: result.vehicle.condition,
                      sourceCountry: result.vehicle.sourceCountry,
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>

      <div className="rounded-sm border border-border p-6">
        <h2 className="mb-1 text-lg font-semibold">Submit This Estimate to SR Motors</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          We&apos;ll review your estimate reference and follow up with the latest figures.
        </p>
        <EnquiryForm
          // Remount per vehicle so the pre-filled message matches the selection.
          key={result?.vehicle.id ?? "no-vehicle"}
          vehicleId={result?.vehicle.id}
          source="calculator"
          estimateReference={result?.breakdown.reference}
          defaultMessage={
            result
              ? `I'd like a reviewed import-cost estimate for the ${result.vehicle.year} ${result.vehicle.title} (ref: ${result.breakdown.reference}).`
              : ""
          }
        />
      </div>
    </div>
  );
}

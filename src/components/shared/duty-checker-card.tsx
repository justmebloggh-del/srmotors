import { ExternalLink, Calculator } from "lucide-react";
import { formatEngine } from "@/lib/utils/format";
import { conditionLabel } from "@/lib/utils/format";
import type { DutyChecker } from "@/lib/data/content";

export interface DutyCheckVehicle {
  brand: string;
  model: string;
  year: number;
  engineCapacityCc: number | null;
  condition: string;
  sourceCountry: string | null;
}

/**
 * Points customers to the configured third-party duty estimator, with the
 * exact details to enter there. Deliberately explicit that it is independent
 * and unofficial — SR Motors must not imply an affiliation with it or with GRA.
 */
export function DutyCheckerCard({ checker, vehicle }: { checker: DutyChecker; vehicle?: DutyCheckVehicle }) {
  const details: [string, string][] = vehicle
    ? [
        ["Make", vehicle.brand],
        ["Model", vehicle.model],
        ["Year of manufacture", String(vehicle.year)],
        ["Engine capacity", vehicle.engineCapacityCc ? `${vehicle.engineCapacityCc.toLocaleString()} cc (${formatEngine(vehicle.engineCapacityCc)})` : "—"],
        ["Condition", conditionLabel(vehicle.condition)],
        ["Purchase market", vehicle.sourceCountry ?? "—"],
      ]
    : [];

  return (
    <section aria-labelledby="duty-check-heading" className="rounded-sm border border-border p-5">
      <div className="flex items-center gap-2">
        <Calculator className="size-4 text-brand-gold-dark" />
        <h3 id="duty-check-heading" className="font-semibold">Check Ghana import duty</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        For a detailed duty and levies estimate, use {checker.name}, an independent third-party
        calculator. It is not affiliated with SR Motors or Ghana Customs (GRA), may ask you to sign
        in, and gives an estimate — not an official assessment.
      </p>

      {details.length > 0 && (
        <>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Enter these details</p>
          <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {details.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <a
        href={checker.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-4 inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-brand-gold"
      >
        Open {checker.name}
        <ExternalLink className="size-3.5" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </section>
  );
}

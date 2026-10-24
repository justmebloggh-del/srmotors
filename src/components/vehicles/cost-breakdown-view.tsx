import { AlertTriangle } from "lucide-react";
import { formatMoney, type CostBreakdown } from "@/lib/cost-estimate";
import { formatRateNote } from "@/lib/exchange-rates";
import { customsDisclaimer } from "@/lib/site-config";

export function CostBreakdownView({ breakdown }: { breakdown: CostBreakdown }) {
  return (
    <div>
      <dl className="space-y-2.5">
        {breakdown.lines.map((line) => (
          <div key={line.label} className="flex items-start justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">{line.label}</dt>
            <dd className={line.confirmed ? "text-right font-medium" : "text-right italic text-muted-foreground"}>
              {line.confirmed ? formatMoney(line.amount, line.currency) : "Not yet confirmed"}
              {line.converted && (
                <span className="block text-xs font-normal text-muted-foreground">
                  ≈ {formatMoney(line.converted.amount, line.converted.currency)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Estimated Total</span>
          <span className="text-lg font-bold">
            {breakdown.total != null ? formatMoney(breakdown.total, breakdown.totalCurrency) : "Not yet confirmed"}
          </span>
        </div>

        {breakdown.ratesUsed.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Converted using {breakdown.ratesUsed.map(formatRateNote).join("; ")}. Indicative only —
            the rate applied at payment and clearance may differ.
          </p>
        )}
        {breakdown.total == null && breakdown.missingLabels.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Not yet confirmed: {breakdown.missingLabels.join(", ")}. Contact SR Motors for the latest figures.
          </p>
        )}
        {breakdown.total == null && breakdown.missingLabels.length === 0 && breakdown.unconvertibleCurrencies.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            A total can&apos;t be shown yet because no current exchange rate is available for{" "}
            {breakdown.unconvertibleCurrencies.join(", ")}. Contact SR Motors to confirm the conversion.
          </p>
        )}
      </div>

      {breakdown.estimate && breakdown.estimate.status !== "unavailable" && (
        <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
          <div>
            <dt className="inline font-medium text-foreground">Estimate status: </dt>
            <dd className="inline capitalize">
              {breakdown.estimate.status} · prepared {formatDate(breakdown.estimate.calculatedAt)}
              {breakdown.estimate.reviewDueAt && ` · review due ${formatDate(breakdown.estimate.reviewDueAt)}`}
            </dd>
          </div>
          {breakdown.estimate.method && (
            <div>
              <dt className="inline font-medium text-foreground">Duty estimate source: </dt>
              <dd className="inline">{breakdown.estimate.method}</dd>
            </div>
          )}
          {breakdown.estimate.assumptions && (
            <div>
              <dt className="inline font-medium text-foreground">Assumptions: </dt>
              <dd className="inline">{breakdown.estimate.assumptions}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-sm bg-muted/60 p-3 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-brand-gold" />
        <p>{customsDisclaimer}</p>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Reference: {breakdown.reference} · Generated {new Date(breakdown.generatedAt).toLocaleString("en-GB", { timeZone: "Africa/Accra" })}
      </p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Accra" });
}

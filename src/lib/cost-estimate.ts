import type { VehicleCostEstimate } from "@/types/vehicle";
import {
  REPORTING_CURRENCY,
  convertToGhs,
  type ExchangeRate,
  type RatesToGhs,
} from "@/lib/exchange-rates";

export interface CostLineItem {
  label: string;
  amount: number | null;
  currency: string | null;
  source: "fob" | "shipping" | "customs" | "port" | "clearing" | "local_transport" | "other";
  confirmed: boolean;
  /** Present only when the line was converted into the reporting currency. */
  converted: { amount: number; currency: string } | null;
}

export interface CostBreakdown {
  lines: CostLineItem[];
  /** Null unless every line is confirmed and expressible in one currency. */
  total: number | null;
  totalCurrency: string | null;
  allConfirmed: boolean;
  missingLabels: string[];
  /** Rates used to convert lines into the total's currency (empty if none needed). */
  ratesUsed: ExchangeRate[];
  /** Currencies that appeared on confirmed lines but had no current rate. */
  unconvertibleCurrencies: string[];
  /** Provenance of the admin-entered estimate, shown so customers can judge it. */
  estimate: {
    status: VehicleCostEstimate["status"];
    method: string | null;
    assumptions: string | null;
    calculatedAt: string;
    reviewDueAt: string | null;
  } | null;
  reference: string;
  generatedAt: string;
}

function makeReference(vehicleId: string, at: Date) {
  return `SRM-EST-${vehicleId.slice(0, 8).toUpperCase()}-${at.getFullYear()}${String(
    at.getMonth() + 1,
  ).padStart(2, "0")}${String(at.getDate()).padStart(2, "0")}`;
}

/**
 * Builds a transparent, line-by-line import cost breakdown.
 *
 * A missing figure is surfaced as "Not yet confirmed", never treated as zero.
 * A total is only produced when every line is confirmed and either already
 * shares one currency or can be converted to GHS with an admin-entered,
 * non-stale exchange rate — conversion is never guessed.
 */
export function buildCostBreakdown(
  vehicleId: string,
  fobAmount: number,
  fobCurrency: string,
  estimate: VehicleCostEstimate | null,
  rates: RatesToGhs = {},
): CostBreakdown {
  const estimateUsable = estimate?.status === "preliminary" || estimate?.status === "reviewed";
  const localCurrency = estimate?.customsCurrency ?? null;

  const raw: Omit<CostLineItem, "converted">[] = [
    { label: "FOB price", amount: fobAmount, currency: fobCurrency, source: "fob", confirmed: true },
    {
      label: "Shipping to Ghana",
      amount: estimate?.shippingAmount ?? null,
      currency: estimate?.shippingCurrency ?? null,
      source: "shipping",
      confirmed: estimateUsable && estimate?.shippingAmount != null,
    },
    {
      label: "Estimated customs duty & taxes",
      amount: estimate?.customsDutyAmount ?? null,
      currency: localCurrency,
      source: "customs",
      confirmed: estimateUsable && estimate?.customsDutyAmount != null,
    },
    {
      label: "Port charges",
      amount: estimate?.portChargesAmount ?? null,
      currency: localCurrency,
      source: "port",
      confirmed: estimateUsable && estimate?.portChargesAmount != null,
    },
    {
      label: "Clearing fees",
      amount: estimate?.clearingFeesAmount ?? null,
      currency: localCurrency,
      source: "clearing",
      confirmed: estimateUsable && estimate?.clearingFeesAmount != null,
    },
    {
      label: "Local transportation",
      amount: estimate?.localTransportAmount ?? null,
      currency: localCurrency,
      source: "local_transport",
      confirmed: estimateUsable && estimate?.localTransportAmount != null,
    },
  ];

  if (estimate?.otherChargesAmount != null) {
    raw.push({
      label: estimate.otherChargesDescription?.trim() || "Other applicable charges",
      amount: estimate.otherChargesAmount,
      currency: localCurrency,
      source: "other",
      confirmed: estimateUsable,
    });
  }

  const confirmedRaw = raw.filter((l) => l.confirmed && l.amount != null && l.currency);
  const currencies = new Set(confirmedRaw.map((l) => l.currency as string));
  const needsConversion = currencies.size > 1 || (currencies.size === 1 && !currencies.has(REPORTING_CURRENCY));

  const ratesUsed = new Map<string, ExchangeRate>();
  const unconvertible = new Set<string>();

  const lines: CostLineItem[] = raw.map((line) => {
    if (!needsConversion || !line.confirmed || line.amount == null || !line.currency) {
      return { ...line, converted: null };
    }
    if (line.currency === REPORTING_CURRENCY) return { ...line, converted: null };

    const result = convertToGhs(line.amount, line.currency, rates);
    if (!result) {
      unconvertible.add(line.currency);
      return { ...line, converted: null };
    }
    if (result.rate) ratesUsed.set(result.rate.base, result.rate);
    return { ...line, converted: { amount: result.amount, currency: REPORTING_CURRENCY } };
  });

  const missingLabels = lines.filter((l) => !l.confirmed).map((l) => l.label);
  const allLinesConfirmed = missingLabels.length === 0;

  let total: number | null = null;
  let totalCurrency: string | null = null;

  if (allLinesConfirmed) {
    if (currencies.size === 1) {
      totalCurrency = [...currencies][0];
      total = lines.reduce((sum, l) => sum + (l.amount ?? 0), 0);
      // Single non-GHS currency: also offer a GHS total when a rate exists.
      if (totalCurrency !== REPORTING_CURRENCY && unconvertible.size === 0 && lines.every((l) => l.converted)) {
        total = lines.reduce((sum, l) => sum + (l.converted?.amount ?? 0), 0);
        totalCurrency = REPORTING_CURRENCY;
      }
    } else if (unconvertible.size === 0) {
      totalCurrency = REPORTING_CURRENCY;
      total = lines.reduce((sum, l) => sum + (l.converted?.amount ?? l.amount ?? 0), 0);
    }
  }

  const now = new Date();
  return {
    lines,
    total,
    totalCurrency,
    allConfirmed: total != null,
    missingLabels,
    ratesUsed: total != null ? [...ratesUsed.values()] : [],
    unconvertibleCurrencies: [...unconvertible],
    estimate: estimate
      ? {
          status: estimate.status,
          method: estimate.customsMethod,
          assumptions: estimate.assumptions,
          calculatedAt: estimate.calculatedAt,
          reviewDueAt: estimate.reviewDueAt,
        }
      : null,
    reference: makeReference(vehicleId, now),
    generatedAt: now.toISOString(),
  };
}

export function formatMoney(amount: number | null, currency: string | null): string {
  if (amount == null || !currency) return "Not yet confirmed";
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

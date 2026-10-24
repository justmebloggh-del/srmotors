export const REPORTING_CURRENCY = "GHS";

/** Rates older than this are treated as unavailable rather than shown as current. */
export const MAX_RATE_AGE_DAYS = 14;

/** Oldest `as_of` date (YYYY-MM-DD) still treated as current. */
export function rateCutoffDate(now = Date.now()): string {
  return new Date(now - MAX_RATE_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export interface ExchangeRate {
  base: string;
  quote: string;
  rate: number;
  source: string;
  asOf: string;
}

/** Keyed by base currency; every rate quotes into REPORTING_CURRENCY. */
export type RatesToGhs = Record<string, ExchangeRate>;

export function convertToGhs(
  amount: number,
  currency: string,
  rates: RatesToGhs,
): { amount: number; rate: ExchangeRate | null } | null {
  if (currency === REPORTING_CURRENCY) return { amount, rate: null };
  const rate = rates[currency];
  if (!rate) return null;
  return { amount: amount * rate.rate, rate };
}

export function formatRateNote(rate: ExchangeRate): string {
  const date = new Date(rate.asOf).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `1 ${rate.base} = ${rate.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${rate.quote} (${rate.source}, ${date})`;
}

import { listShippingRates, listCurrencyRates } from "@/lib/data/admin-shipping";
import { getBodyTypes } from "@/lib/data/taxonomies";
import { ShippingRateForm } from "@/components/admin/shipping-rate-form";
import { ShippingRateList } from "@/components/admin/shipping-rate-list";
import { CurrencyRateManager } from "@/components/admin/currency-rate-manager";
import { MAX_RATE_AGE_DAYS, rateCutoffDate } from "@/lib/exchange-rates";

export default async function AdminShippingPage() {
  const [rates, bodyTypes, currencyRates] = await Promise.all([
    listShippingRates(),
    getBodyTypes(),
    listCurrencyRates(),
  ]);

  const rateCutoff = rateCutoffDate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shipping & Customs</h1>
        <p className="text-sm text-muted-foreground">
          Manage exchange rates and shipping rate tiers. Per-vehicle customs estimates are set from
          each vehicle&apos;s &ldquo;Import Cost Estimate&rdquo; page.
        </p>
      </div>

      <CurrencyRateManager
        rates={currencyRates.map((r) => ({ ...r, rate: Number(r.rate), current: r.as_of >= rateCutoff }))}
        maxAgeDays={MAX_RATE_AGE_DAYS}
      />

      <ShippingRateForm bodyTypes={bodyTypes} />

      <div className="rounded-sm border border-border bg-background">
        <ShippingRateList
          rates={rates.map((r) => ({
            ...r,
            rate_amount: Number(r.rate_amount),
            min_cbm: r.min_cbm != null ? Number(r.min_cbm) : null,
            max_cbm: r.max_cbm != null ? Number(r.max_cbm) : null,
          }))}
        />
        {rates.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">No shipping rates yet.</p>}
      </div>
    </div>
  );
}

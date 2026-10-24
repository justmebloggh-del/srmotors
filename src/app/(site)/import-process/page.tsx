import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { FobNotice } from "@/components/shared/fob-notice";
import { importProcessSteps } from "@/lib/import-process-steps";
import { customsDisclaimer } from "@/lib/site-config";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Import Process",
  description:
    "How SR Motors imports vehicles to Ghana — from browsing and FOB pricing through shipping, Ghana Customs clearance and collection.",
  alternates: { canonical: "/import-process" },
};

export default function ImportProcessPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">How Importing With SR Motors Works</h1>
      <p className="mt-4 text-muted-foreground">
        A straightforward, transparent process from browsing to collection in Ghana. No hidden
        steps, no surprise fees sprung on you at the last minute.
      </p>

      <FobNotice className="mt-8" />

      <ol className="mt-10 space-y-8 border-l border-border pl-8">
        {importProcessSteps.map((s) => (
          <li key={s.step} className="relative">
            <span className="absolute -left-[41px] flex size-8 items-center justify-center rounded-full bg-brand-gold text-sm font-bold text-brand-black">
              {s.step}
            </span>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mt-1 text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-12 rounded-sm bg-muted/50 p-6">
        <h2 className="mb-2 font-semibold">About Payment</h2>
        <p className="text-sm text-muted-foreground">
          Payment arrangements depend on the agreed transaction and are confirmed directly with
          SR Motors once you proceed. We do not advertise payment methods we have not configured
          or authorised — ask us directly for current options.
        </p>
      </div>

      <div className="mt-6 rounded-sm bg-muted/50 p-6">
        <h2 className="mb-2 font-semibold">Customs & Clearance Disclaimer</h2>
        <p className="text-sm text-muted-foreground">{customsDisclaimer}</p>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Button asChild className="bg-brand-gold text-brand-black hover:bg-brand-gold-light">
          <Link href="/vehicles">Browse Vehicles</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/import-calculator">Estimate Import Cost</Link>
        </Button>
      </div>
    </div>
  );
}

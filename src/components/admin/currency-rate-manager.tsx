"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createCurrencyRateAction } from "@/app/actions/shipping";

interface Rate {
  id: string;
  base_currency: string;
  quote_currency: string;
  rate: number;
  source: string;
  as_of: string;
  current: boolean;
}

export function CurrencyRateManager({ rates, maxAgeDays }: { rates: Rate[]; maxAgeDays: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    baseCurrency: "USD",
    quoteCurrency: "GHS",
    rate: "",
    source: "",
    asOf: new Date().toISOString().slice(0, 10),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCurrencyRateAction({ ...form, rate: Number(form.rate) });
      if (result.ok) {
        toast.success("Exchange rate saved");
        setForm({ ...form, rate: "" });
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4 rounded-sm border border-border p-5">
      <div>
        <h2 className="font-semibold">Exchange Rates</h2>
        <p className="text-sm text-muted-foreground">
          Used to show indicative cedi prices and GHS cost totals. Rates older than {maxAgeDays} days
          stop being shown publicly, so the site never presents a stale conversion as current.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-5">
        <div>
          <Label>From</Label>
          <Input maxLength={3} value={form.baseCurrency} onChange={(e) => setForm({ ...form, baseCurrency: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <Label>To</Label>
          <Input maxLength={3} value={form.quoteCurrency} onChange={(e) => setForm({ ...form, quoteCurrency: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <Label>Rate</Label>
          <Input type="number" step="0.0001" min="0" required value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="e.g. 13.25" />
        </div>
        <div>
          <Label>Source</Label>
          <Input required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g. Bank of Ghana" />
        </div>
        <div>
          <Label>Rate Date</Label>
          <Input type="date" required value={form.asOf} onChange={(e) => setForm({ ...form, asOf: e.target.value })} />
        </div>
        <div className="sm:col-span-5">
          <Button type="submit" size="sm" disabled={pending} className="bg-brand-gold text-brand-black hover:bg-brand-gold-light">
            Add Rate
          </Button>
        </div>
      </form>

      <ul className="divide-y divide-border text-sm">
        {rates.map((r) => {
          const current = r.current;
          return (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                1 {r.base_currency} = <strong>{Number(r.rate).toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong> {r.quote_currency}
                <span className="ml-2 text-muted-foreground">
                  {r.source} · {r.as_of}
                </span>
              </span>
              <Badge variant={current ? "default" : "secondary"}>{current ? "Current" : "Stale — not shown"}</Badge>
            </li>
          );
        })}
        {rates.length === 0 && (
          <li className="py-2 text-muted-foreground">No rates yet — the site shows original currencies only.</li>
        )}
      </ul>
    </div>
  );
}

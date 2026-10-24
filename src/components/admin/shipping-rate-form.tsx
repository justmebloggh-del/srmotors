"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createShippingRateAction } from "@/app/actions/shipping";
import type { Taxonomy } from "@/lib/data/taxonomies";

export function ShippingRateForm({ bodyTypes }: { bodyTypes: Taxonomy[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    bodyTypeId: "",
    method: "ro_ro",
    minCbm: "",
    maxCbm: "",
    originPort: "",
    destinationPort: "Tema, Ghana",
    rateAmount: "",
    rateCurrency: "USD",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: "",
    notes: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createShippingRateAction({
        bodyTypeId: form.bodyTypeId || null,
        method: form.method,
        minCbm: form.minCbm ? Number(form.minCbm) : null,
        maxCbm: form.maxCbm ? Number(form.maxCbm) : null,
        originPort: form.originPort,
        destinationPort: form.destinationPort,
        rateAmount: Number(form.rateAmount),
        rateCurrency: form.rateCurrency,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || null,
        notes: form.notes || null,
      });
      if (result.ok) {
        toast.success("Shipping rate added");
        router.refresh();
        setForm({ ...form, originPort: "", rateAmount: "", notes: "" });
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-sm border border-border p-5">
      <h2 className="font-semibold">Add Shipping Rate</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label>Body Type</Label>
          <Select value={form.bodyTypeId} onValueChange={(v) => setForm({ ...form, bodyTypeId: v })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              {bodyTypes.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Method</Label>
          <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ro_ro">RoRo</SelectItem>
              <SelectItem value="container_shared">Shared Container</SelectItem>
              <SelectItem value="container_exclusive">Exclusive Container</SelectItem>
              <SelectItem value="air">Air</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Rate Amount</Label>
          <Input type="number" step="0.01" required value={form.rateAmount} onChange={(e) => setForm({ ...form, rateAmount: e.target.value })} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <Label>Min CBM</Label>
          <Input type="number" step="0.1" value={form.minCbm} onChange={(e) => setForm({ ...form, minCbm: e.target.value })} />
        </div>
        <div>
          <Label>Max CBM</Label>
          <Input type="number" step="0.1" value={form.maxCbm} onChange={(e) => setForm({ ...form, maxCbm: e.target.value })} />
        </div>
        <div>
          <Label>Origin Port</Label>
          <Input required value={form.originPort} onChange={(e) => setForm({ ...form, originPort: e.target.value })} />
        </div>
        <div>
          <Label>Destination Port</Label>
          <Input required value={form.destinationPort} onChange={(e) => setForm({ ...form, destinationPort: e.target.value })} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label>Effective From</Label>
          <Input type="date" required value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
        </div>
        <div>
          <Label>Effective To</Label>
          <Input type="date" value={form.effectiveTo} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })} />
        </div>
        <div>
          <Label>Currency</Label>
          <Input maxLength={3} value={form.rateCurrency} onChange={(e) => setForm({ ...form, rateCurrency: e.target.value })} />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>

      <Button type="submit" disabled={pending} className="bg-brand-gold text-brand-black hover:bg-brand-gold-light">
        Add Rate
      </Button>
    </form>
  );
}

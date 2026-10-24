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
import { ExternalLink } from "lucide-react";
import { upsertCostEstimateAction } from "@/app/actions/shipping";

export function CostEstimateForm({
  vehicleId,
  dutyChecker,
  dutyCheckDetails,
}: {
  vehicleId: string;
  dutyChecker: { name: string; url: string } | null;
  /** e.g. "Toyota · Corolla · 2020 · 1,798 cc · Used · United States" */
  dutyCheckDetails: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    status: "preliminary" as "unavailable" | "preliminary" | "reviewed" | "expired",
    shippingAmount: "",
    shippingCurrency: "USD",
    customsDutyAmount: "",
    customsCurrency: "GHS",
    customsMethod: "",
    portChargesAmount: "",
    clearingFeesAmount: "",
    localTransportAmount: "",
    otherChargesAmount: "",
    otherChargesDescription: "",
    assumptions: "",
    notes: "",
    reviewDueAt: "",
  });

  function recordDutyCheckerSource() {
    if (!dutyChecker) return;
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const reviewBy = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setForm((f) => ({
      ...f,
      customsCurrency: "GHS",
      customsMethod: `${dutyChecker.name} third-party estimate, checked ${today} (${dutyCheckDetails}). Independent tool — not an official GRA assessment.`,
      reviewDueAt: f.reviewDueAt || reviewBy,
    }));
    toast.success(`Source set to ${dutyChecker.name} — now enter the duty figure it gave you.`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await upsertCostEstimateAction({
        vehicleId,
        status: form.status,
        shippingAmount: form.shippingAmount ? Number(form.shippingAmount) : null,
        shippingCurrency: form.shippingCurrency || null,
        customsDutyAmount: form.customsDutyAmount ? Number(form.customsDutyAmount) : null,
        customsCurrency: form.customsCurrency || null,
        customsMethod: form.customsMethod || null,
        portChargesAmount: form.portChargesAmount ? Number(form.portChargesAmount) : null,
        clearingFeesAmount: form.clearingFeesAmount ? Number(form.clearingFeesAmount) : null,
        localTransportAmount: form.localTransportAmount ? Number(form.localTransportAmount) : null,
        otherChargesAmount: form.otherChargesAmount ? Number(form.otherChargesAmount) : null,
        otherChargesDescription: form.otherChargesDescription || null,
        assumptions: form.assumptions || null,
        notes: form.notes || null,
        reviewDueAt: form.reviewDueAt ? new Date(form.reviewDueAt).toISOString() : null,
      });

      if (result.ok) {
        toast.success("Cost estimate saved");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-sm border border-border p-5">
      <div>
        <Label>Estimate Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unavailable">Unavailable</SelectItem>
            <SelectItem value="preliminary">Preliminary</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Shipping Amount</Label>
          <Input type="number" step="0.01" value={form.shippingAmount} onChange={(e) => setForm({ ...form, shippingAmount: e.target.value })} />
        </div>
        <div>
          <Label>Shipping Currency</Label>
          <Input maxLength={3} value={form.shippingCurrency} onChange={(e) => setForm({ ...form, shippingCurrency: e.target.value })} />
        </div>
      </div>

      {dutyChecker && (
        <div className="rounded-sm border border-dashed border-border bg-muted/40 p-3 text-sm">
          <p>
            Get the duty figure from <strong>{dutyChecker.name}</strong> using:{" "}
            <span className="text-muted-foreground">{dutyCheckDetails}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline" size="sm">
              <a href={dutyChecker.url} target="_blank" rel="noopener noreferrer nofollow">
                Open {dutyChecker.name} <ExternalLink className="size-3.5" />
              </a>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={recordDutyCheckerSource}>
              Record {dutyChecker.name} as the source
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Customs Duty Amount</Label>
          <Input type="number" step="0.01" value={form.customsDutyAmount} onChange={(e) => setForm({ ...form, customsDutyAmount: e.target.value })} />
        </div>
        <div>
          <Label>Customs Currency</Label>
          <Input maxLength={3} value={form.customsCurrency} onChange={(e) => setForm({ ...form, customsCurrency: e.target.value })} />
        </div>
      </div>

      <div>
        <Label>Customs Calculation Method / Source</Label>
        <Textarea rows={2} value={form.customsMethod} onChange={(e) => setForm({ ...form, customsMethod: e.target.value })} placeholder="e.g. manual estimate based on vehicle age and CIF value, per current published Ghana duty schedule" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Port Charges</Label>
          <Input type="number" step="0.01" value={form.portChargesAmount} onChange={(e) => setForm({ ...form, portChargesAmount: e.target.value })} />
        </div>
        <div>
          <Label>Clearing Fees</Label>
          <Input type="number" step="0.01" value={form.clearingFeesAmount} onChange={(e) => setForm({ ...form, clearingFeesAmount: e.target.value })} />
        </div>
        <div>
          <Label>Local Transport</Label>
          <Input type="number" step="0.01" value={form.localTransportAmount} onChange={(e) => setForm({ ...form, localTransportAmount: e.target.value })} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Other Charges Amount</Label>
          <Input type="number" step="0.01" value={form.otherChargesAmount} onChange={(e) => setForm({ ...form, otherChargesAmount: e.target.value })} />
        </div>
        <div>
          <Label>Other Charges Description</Label>
          <Input value={form.otherChargesDescription} onChange={(e) => setForm({ ...form, otherChargesDescription: e.target.value })} />
        </div>
      </div>

      <div>
        <Label>Assumptions</Label>
        <Textarea rows={2} value={form.assumptions} onChange={(e) => setForm({ ...form, assumptions: e.target.value })} />
      </div>
      <div>
        <Label>Internal Notes</Label>
        <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div>
        <Label>Review / Expiry Date</Label>
        <Input type="date" value={form.reviewDueAt} onChange={(e) => setForm({ ...form, reviewDueAt: e.target.value })} className="sm:w-64" />
      </div>

      <Button type="submit" disabled={pending} className="bg-brand-gold text-brand-black hover:bg-brand-gold-light">
        Save New Estimate Version
      </Button>
    </form>
  );
}

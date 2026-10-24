"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { expireShippingRateAction } from "@/app/actions/shipping";
import { formatPrice } from "@/lib/utils/format";

interface Rate {
  id: string;
  body_types: { name: string } | null;
  method: string;
  min_cbm: number | null;
  max_cbm: number | null;
  origin_port: string;
  destination_port: string;
  rate_amount: number;
  rate_currency: string;
  effective_from: string;
  effective_to: string | null;
}

export function ShippingRateList({ rates }: { rates: Rate[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  function handleExpire(id: string) {
    startTransition(async () => {
      const result = await expireShippingRateAction(id);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Route</TableHead>
          <TableHead>CBM</TableHead>
          <TableHead>Rate</TableHead>
          <TableHead>Validity</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rates.map((r) => {
          const expired = r.effective_to != null && r.effective_to < today;
          return (
            <TableRow key={r.id}>
              <TableCell>{r.body_types?.name ?? "Any"}</TableCell>
              <TableCell className="capitalize">{r.method.replace(/_/g, " ")}</TableCell>
              <TableCell className="text-sm">{r.origin_port} → {r.destination_port}</TableCell>
              <TableCell className="text-sm">
                {r.min_cbm ?? 0}–{r.max_cbm ?? "∞"}
              </TableCell>
              <TableCell>{formatPrice(Number(r.rate_amount), r.rate_currency)}</TableCell>
              <TableCell>
                <Badge variant={expired ? "secondary" : "default"}>
                  {expired ? "Expired" : `Until ${r.effective_to ?? "ongoing"}`}
                </Badge>
              </TableCell>
              <TableCell>
                {!expired && (
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => handleExpire(r.id)}>
                    Expire
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

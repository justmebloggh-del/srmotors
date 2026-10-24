"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  archiveVehicleAction,
  duplicateVehicleAction,
  setVehicleStatusAction,
  toggleFeaturedAction,
} from "@/app/actions/vehicles";

export function AdminVehicleRowActions({
  id,
  status,
  featured,
}: {
  id: string;
  status: string;
  featured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(successMsg);
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending} aria-label="Vehicle actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/vehicles/${id}/edit`}>Edit</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/vehicles/${id}/estimate`}>Import Cost Estimate</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run(() => duplicateVehicleAction(id), "Vehicle duplicated")}>
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run(() => toggleFeaturedAction(id, !featured), featured ? "Unfeatured" : "Featured")}>
          {featured ? "Remove from Featured" : "Mark as Featured"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {status !== "available" && (
          <DropdownMenuItem onClick={() => run(() => setVehicleStatusAction(id, "available"), "Marked available")}>
            Mark Available
          </DropdownMenuItem>
        )}
        {status !== "reserved" && (
          <DropdownMenuItem onClick={() => run(() => setVehicleStatusAction(id, "reserved"), "Marked reserved")}>
            Mark Reserved
          </DropdownMenuItem>
        )}
        {status !== "sold" && (
          <DropdownMenuItem onClick={() => run(() => setVehicleStatusAction(id, "sold"), "Marked sold")}>
            Mark Sold
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => {
            if (confirm("Archive this vehicle? It will be removed from the public site but enquiries are kept.")) {
              run(() => archiveVehicleAction(id), "Vehicle archived");
            }
          }}
        >
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

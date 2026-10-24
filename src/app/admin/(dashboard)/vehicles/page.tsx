import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAdminVehicles } from "@/lib/data/admin-vehicles";
import { AdminVehicleRowActions } from "@/components/admin/admin-vehicle-row-actions";
import { formatPrice, statusLabel } from "@/lib/utils/format";

export default async function AdminVehiclesPage({
  searchParams,
}: PageProps<"/admin/vehicles">) {
  const resolved = await searchParams;
  const status = typeof resolved.status === "string" ? resolved.status : undefined;
  const featured = resolved.featured === "true";

  const vehicles = await listAdminVehicles({ status, featured });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">{vehicles.length} vehicle(s)</p>
        </div>
        <Button asChild className="bg-brand-gold text-brand-black hover:bg-brand-gold-light">
          <Link href="/admin/vehicles/new">
            <Plus className="size-4" /> Add Vehicle
          </Link>
        </Button>
      </div>

      <div className="rounded-sm border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-sm bg-muted">
                      {v.mainImageUrl && <Image src={v.mainImageUrl} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {v.year} {v.brand} {v.model}
                      </p>
                      <p className="text-xs text-muted-foreground">/{v.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatPrice(v.fobAmount, v.fobCurrency)}</TableCell>
                <TableCell>
                  <Badge variant={v.status === "available" ? "default" : "secondary"}>{statusLabel(v.status)}</Badge>
                </TableCell>
                <TableCell>{v.featured ? "★" : "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(v.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <AdminVehicleRowActions id={v.id} status={v.status} featured={v.featured} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {vehicles.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">No vehicles yet.</p>
        )}
      </div>
    </div>
  );
}

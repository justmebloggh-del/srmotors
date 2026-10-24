import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAdminEnquiries } from "@/lib/data/admin-enquiries";

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  new: "default",
  contacted: "secondary",
  negotiating: "secondary",
  converted: "outline",
  closed: "outline",
};

export default async function AdminEnquiriesPage({
  searchParams,
}: PageProps<"/admin/enquiries">) {
  const resolved = await searchParams;
  const status = typeof resolved.status === "string" ? resolved.status : undefined;
  const enquiries = await listAdminEnquiries({ status });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Enquiries</h1>
      <p className="mb-6 text-sm text-muted-foreground">{enquiries.length} enquiries</p>

      <div className="rounded-sm border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enquiries.map((e) => (
              <TableRow key={e.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/admin/enquiries/${e.id}`} className="block">
                    <p className="font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.email || e.phone}</p>
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{e.vehicleLabel ?? "—"}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{e.message}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[e.status] ?? "secondary"} className="capitalize">
                    {e.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(e.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {enquiries.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">No enquiries yet.</p>
        )}
      </div>
    </div>
  );
}

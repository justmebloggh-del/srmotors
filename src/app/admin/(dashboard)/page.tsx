import Link from "next/link";
import { getDashboardMetrics } from "@/lib/data/admin-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  const cards = [
    { label: "Total Vehicles", value: metrics.totalVehicles, href: "/admin/vehicles" },
    { label: "Available", value: metrics.availableVehicles, href: "/admin/vehicles?status=available" },
    { label: "Reserved", value: metrics.reservedVehicles, href: "/admin/vehicles?status=reserved" },
    { label: "Sold", value: metrics.soldVehicles, href: "/admin/vehicles?status=sold" },
    { label: "Drafts", value: metrics.draftVehicles, href: "/admin/vehicles?status=draft" },
    { label: "Featured", value: metrics.featuredVehicles, href: "/admin/vehicles?featured=true" },
    { label: "Enquiries (7 days)", value: metrics.recentEnquiries, href: "/admin/enquiries" },
    { label: "Unread Enquiries", value: metrics.unreadEnquiries, href: "/admin/enquiries?status=new", highlight: metrics.unreadEnquiries > 0 },
    { label: "Estimates Expiring Soon", value: metrics.expiringEstimates, href: "/admin/shipping", highlight: metrics.expiringEstimates > 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Overview of SR Motors inventory and activity.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className={card.highlight ? "border-brand-gold" : undefined}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/vehicles/new" className="rounded-sm border border-dashed border-border p-6 text-center hover:border-brand-gold">
          <p className="font-medium">+ Add a New Vehicle</p>
          <p className="mt-1 text-sm text-muted-foreground">Create a listing with photos, specs and pricing.</p>
        </Link>
        <Link href="/admin/enquiries" className="rounded-sm border border-dashed border-border p-6 text-center hover:border-brand-gold">
          <p className="font-medium">Review Enquiries</p>
          <p className="mt-1 text-sm text-muted-foreground">Follow up on recent customer messages.</p>
        </Link>
      </div>
    </div>
  );
}

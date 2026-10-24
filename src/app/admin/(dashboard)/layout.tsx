import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar fullName={session.fullName} role={session.role} />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-8">{children}</main>
    </div>
  );
}

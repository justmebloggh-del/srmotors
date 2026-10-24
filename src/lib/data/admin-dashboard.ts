import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface DashboardMetrics {
  totalVehicles: number;
  availableVehicles: number;
  reservedVehicles: number;
  soldVehicles: number;
  draftVehicles: number;
  featuredVehicles: number;
  recentEnquiries: number;
  unreadEnquiries: number;
  expiringEstimates: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const [
    total,
    available,
    reserved,
    sold,
    draft,
    featured,
    recentEnquiries,
    unreadEnquiries,
    expiringEstimates,
  ] = await Promise.all([
    supabase.from("vehicles").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "reserved"),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "sold"),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("featured", true),
    supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase
      .from("vehicle_cost_estimates")
      .select("id", { count: "exact", head: true })
      .not("review_due_at", "is", null)
      .lte("review_due_at", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return {
    totalVehicles: total.count ?? 0,
    availableVehicles: available.count ?? 0,
    reservedVehicles: reserved.count ?? 0,
    soldVehicles: sold.count ?? 0,
    draftVehicles: draft.count ?? 0,
    featuredVehicles: featured.count ?? 0,
    recentEnquiries: recentEnquiries.count ?? 0,
    unreadEnquiries: unreadEnquiries.count ?? 0,
    expiringEstimates: expiringEstimates.count ?? 0,
  };
}

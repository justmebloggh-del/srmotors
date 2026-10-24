import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EnquiryStatus } from "@/types/database";

export interface AdminEnquiryListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  status: EnquiryStatus;
  source: string;
  vehicleLabel: string | null;
  vehicleSlug: string | null;
  createdAt: string;
  followUpDate: string | null;
}

export async function listAdminEnquiries(filters: { status?: string } = {}): Promise<AdminEnquiryListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("enquiries")
    .select(
      "id, name, email, phone, message, status, source, created_at, follow_up_date, vehicles ( slug, year, model_name_override, brands ( name ), vehicle_models ( name ) )",
    )
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status as EnquiryStatus);

  const { data, error } = await query;
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    status: row.status,
    source: row.source,
    vehicleLabel: row.vehicles ? `${row.vehicles.year} ${row.vehicles.brands?.name ?? ""} ${row.vehicles.vehicle_models?.name ?? row.vehicles.model_name_override ?? ""}`.trim() : null,
    vehicleSlug: row.vehicles?.slug ?? null,
    createdAt: row.created_at,
    followUpDate: row.follow_up_date,
  }));
}

export async function getAdminEnquiryById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select(
      "*, vehicles ( slug, year, model_name_override, brands ( name ), vehicle_models ( name ) ), enquiry_notes ( id, note, created_at, author_id )",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

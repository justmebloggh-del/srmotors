"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { headers } from "next/headers";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { enquirySchema, type EnquiryInput } from "@/lib/validations/enquiry";
import { sendEnquiryAlert } from "@/lib/notifications/enquiry-alert";

export interface EnquiryActionResult {
  ok: boolean;
  error?: string;
}

const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX = 5;

export async function submitEnquiry(input: EnquiryInput): Promise<EnquiryActionResult> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid submission" };
  }

  // Honeypot: if filled in, silently pretend success (don't tip off bots).
  if (parsed.data.companyWebsite) {
    return { ok: true };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  if (ip) {
    // Counting needs to see other visitors' rows, which RLS (correctly) hides from anon.
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await createServiceRoleClient()
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("submitted_ip", ip)
      .gte("created_at", since);
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return {
        ok: false,
        error: "You've sent several enquiries in a short time. Please wait a few minutes, or message us on WhatsApp.",
      };
    }
  }

  // Generated here because anon can insert but not read back (RLS), so
  // `.insert().select()` would fail — and the alert needs the id.
  const id = randomUUID();
  const supabase = await createClient();

  const { error } = await supabase.from("enquiries").insert({
    id,
    vehicle_id: parsed.data.vehicleId ?? null,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    preferred_contact_method: parsed.data.preferredContactMethod,
    message: parsed.data.message,
    source: parsed.data.source,
    estimate_reference: parsed.data.estimateReference || null,
    submitted_ip: ip,
  });

  if (error) {
    console.error("submitEnquiry failed", error);
    return { ok: false, error: "Something went wrong submitting your enquiry. Please try WhatsApp instead." };
  }

  after(() => sendEnquiryAlert(id));

  return { ok: true };
}

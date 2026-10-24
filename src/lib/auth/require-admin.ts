import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AdminSession {
  userId: string;
  email: string | null;
  fullName: string | null;
  role: "superadmin" | "admin" | "editor";
}

/**
 * Server-side authorization gate for every admin page and action.
 * Checks both an authenticated session AND an active admin_profiles row —
 * middleware only checks for a session, this is the real authorization check.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role, full_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_authorized");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile.full_name,
    role: profile.role,
  };
}

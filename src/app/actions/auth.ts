"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export interface AuthActionResult {
  ok: boolean;
  error?: string;
}

export async function signInAction(input: { email: string; password: string }): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { ok: false, error: "Invalid email or password." };
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account is not authorized to access the admin dashboard." };
  }

  return { ok: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordResetAction(email: string): Promise<AuthActionResult> {
  const parsed = z.string().trim().email().safeParse(email);
  if (!parsed.success) return { ok: false, error: "Enter a valid email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteConfig.url}/admin/reset-password`,
  });

  // Always return ok (even on error) to avoid leaking which emails have accounts.
  if (error) console.error("resetPasswordForEmail failed", error);
  return { ok: true };
}

export async function updatePasswordAction(newPassword: string): Promise<AuthActionResult> {
  const parsed = z.string().min(8).safeParse(newPassword);
  if (!parsed.success) return { ok: false, error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

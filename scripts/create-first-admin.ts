/**
 * Provisions the first SR Motors administrator account.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/create-first-admin.ts admin@example.com "a-strong-password" "Admin Name"
 *
 * Run this once against each environment (local, staging, production). It
 * uses the service role key — never commit it, never run this from the
 * browser, and rotate the key if it is ever exposed.
 */
import { createClient } from "@supabase/supabase-js";

async function main() {
  const [, , email, password, fullName] = process.argv;

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/create-first-admin.ts <email> <password> ["Full Name"]');
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    console.error("Failed to create auth user:", createError?.message);
    process.exit(1);
  }

  const { error: profileError } = await supabase.from("admin_profiles").insert({
    id: created.user.id,
    full_name: fullName ?? null,
    role: "superadmin",
    is_active: true,
  });

  if (profileError) {
    console.error("Auth user created but admin_profiles insert failed:", profileError.message);
    console.error("You can fix this by inserting a row manually with id =", created.user.id);
    process.exit(1);
  }

  console.log(`✔ Admin account created for ${email} (role: superadmin).`);
  console.log("Sign in at /admin/login with the password you provided.");
}

main();

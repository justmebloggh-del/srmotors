import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cookie-free, anonymous client for public reads. Because it never touches
 * the request's cookies, pages using it can be statically rendered and
 * cached (ISR) instead of rendered per request. RLS still applies — it sees
 * exactly what a signed-out visitor may see. Not for admin pages or writes
 * that need a session; use `createClient` from ./server for those.
 */
export function createPublicClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

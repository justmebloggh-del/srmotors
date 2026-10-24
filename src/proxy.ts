import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only staff sign in, so session refresh is scoped to /admin. Running it on
// public pages would add an Auth API round trip to every visitor's request.
export const config = {
  matcher: ["/admin/:path*"],
};

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function logAuditEvent(params: {
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, Json>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Audit writes bypass RLS's admin-only insert restriction by going through
  // no insert policy at all for ordinary roles — so this uses the service
  // role client deliberately, scoped to this one privileged write.
  const { createServiceRoleClient } = await import("@/lib/supabase/server");
  const service = createServiceRoleClient();

  await service.from("audit_log").insert({
    actor_id: user?.id ?? null,
    actor_email: user?.email ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
  });
}

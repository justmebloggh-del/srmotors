import { createClient } from "@/lib/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminAuditLogPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("audit_log")
    .select("id, actor_email, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Audit Log</h1>
      <p className="mb-6 text-sm text-muted-foreground">Recent sensitive administrative actions.</p>

      <div className="rounded-sm border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(entries ?? []).map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-sm">{e.actor_email ?? "—"}</TableCell>
                <TableCell className="text-sm font-mono">{e.action}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {e.entity_type} {e.entity_id ? `#${e.entity_id.slice(0, 8)}` : ""}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(e.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {(!entries || entries.length === 0) && (
          <p className="p-10 text-center text-sm text-muted-foreground">No audit events recorded yet.</p>
        )}
      </div>
    </div>
  );
}

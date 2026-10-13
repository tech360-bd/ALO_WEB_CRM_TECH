"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ErrorState, EmptyState } from "@/components/admin/page-primitives";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { Search } from "lucide-react";

type AuditLog = {
  id: string; action: string; resource: string | null; resourceId: string | null;
  meta: string | null; actor: { name: string | null; email: string | null } | null;
  createdAt: string;
};

type ApiResponse = AuditLog[];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = actionFilter ? `/api/v1/admin/audit-logs?action=${encodeURIComponent(actionFilter)}` : "/api/v1/admin/audit-logs";
        const env = await adminFetch<ApiResponse>(url);
        setLogs(env.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, [actionFilter]);

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable record of every administrative action"
      />

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by action (e.g. contact.create)"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <ErrorState message={error} />
      ) : logs.length === 0 ? (
        <EmptyState message="No audit logs match your filter." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Action</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Actor</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Resource</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2"><Badge variant="secondary" className="font-mono text-xs">{l.action}</Badge></td>
                      <td className="px-3 py-2">{l.actor?.name || "system"}{l.actor?.email && <div className="text-xs text-muted-foreground">{l.actor.email}</div>}</td>
                      <td className="px-3 py-2">{l.resource || "—"}{l.resourceId && <div className="text-xs text-muted-foreground font-mono">{l.resourceId}</div>}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{fmtDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

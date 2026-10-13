"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, Mail, MailCheck, MailX } from "lucide-react";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { PageHeader, TableSkeleton, ErrorState, EmptyState } from "@/components/admin/page-primitives";
import { toast } from "sonner";

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  interest: string | null;
  consent: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  confirmed: "default",
  pending: "secondary",
  unsubscribed: "destructive",
};

const INTEREST_LABELS: Record<string, string> = {
  executive: "Executive",
  operations: "Operations",
  education: "Education",
  technology: "Technology",
  partnership: "Partnership",
  student: "Student",
  other: "Other",
};

export default function AdminNewsletterPage() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");

  const fetchPage = useCallback(async (p: number, query: string, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/v1/admin/newsletter", window.location.origin);
      url.searchParams.set("page", String(p));
      url.searchParams.set("pageSize", "25");
      if (query) url.searchParams.set("q", query);
      if (status !== "all") url.searchParams.set("status", status);
      const env = await adminFetch<Subscriber[]>(url.pathname + url.search);
      setItems(Array.isArray(env.data) ? env.data : []);
      setTotal(Number(env.meta.total ?? env.data.length));
      setPage(Number(env.meta.page ?? 1));
      setTotalPages(Number(env.meta.totalPages ?? 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchPage(1, q, activeStatus), 250);
    return () => clearTimeout(t);
  }, [q, activeStatus, fetchPage]);

  async function destroy(s: Subscriber) {
    if (!confirm(`Delete subscriber "${s.email}"? This permanently removes them from the list.`)) return;
    try {
      await adminFetch(`/api/v1/admin/newsletter/${s.id}`, { method: "DELETE" });
      toast.success("Subscriber deleted.");
      fetchPage(page, q, activeStatus);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  async function setStatus(s: Subscriber, status: "confirmed" | "unsubscribed") {
    try {
      await adminFetch(`/api/v1/admin/newsletter/${s.id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      toast.success(`Subscriber marked as ${status}.`);
      fetchPage(page, q, activeStatus);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    }
  }

  const columns: Column<Subscriber>[] = [
    { key: "email", label: "Subscriber", render: (s) => (
      <div>
        <div className="font-medium">{s.email}</div>
        <div className="text-xs text-muted-foreground">{s.name || "—"}</div>
      </div>
    ) },
    { key: "interest", label: "Interest", render: (s) => s.interest ? <Badge variant="outline">{INTEREST_LABELS[s.interest] || s.interest}</Badge> : "—" },
    { key: "consent", label: "Consent", render: (s) => s.consent ? <Badge variant="default">Yes</Badge> : <Badge variant="outline">No</Badge> },
    { key: "status", label: "Status", render: (s) => <Badge variant={STATUS_VARIANTS[s.status] || "default"}>{s.status}</Badge> },
    { key: "createdAt", label: "Subscribed", render: (s) => <span className="text-xs text-muted-foreground">{fmtDate(s.createdAt)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Newsletter Subscribers"
        subtitle="Manage newsletter sign-ups — search, filter by status, confirm or unsubscribe."
        actions={
          <Button variant="outline" size="sm" onClick={() => fetchPage(page, q, activeStatus)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full border rounded px-3 py-2 pl-9 text-sm bg-background"
          />
        </div>
        <select
          className="border rounded px-3 py-2 text-sm bg-background"
          value={activeStatus}
          onChange={(e) => setActiveStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
      </div>

      {loading ? (
        <div className="border rounded-lg p-4 bg-card"><TableSkeleton rows={6} /></div>
      ) : error ? (
        <div className="border rounded-lg p-4 bg-card"><ErrorState message={error} /></div>
      ) : items.length === 0 ? (
        <div className="border rounded-lg p-4 bg-card"><EmptyState message="No subscribers found." /></div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="text-left px-3 py-2 font-semibold text-muted-foreground">
                      {c.label}
                    </th>
                  ))}
                  <th className="text-right px-3 py-2 w-44">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                    {columns.map((c) => (
                      <td key={c.key} className="px-3 py-2 align-top">
                        {c.render ? c.render(s) : String((s as Record<string, unknown>)[c.key] ?? "—")}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        {s.status !== "confirmed" && (
                          <Button size="sm" variant="outline" onClick={() => setStatus(s, "confirmed")} title="Mark confirmed">
                            <MailCheck className="h-4 w-4" />
                          </Button>
                        )}
                        {s.status !== "unsubscribed" && (
                          <Button size="sm" variant="outline" onClick={() => setStatus(s, "unsubscribed")} title="Unsubscribe">
                            <MailX className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => destroy(s)} aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            {total} subscribers · page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => fetchPage(page - 1, q, activeStatus)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => fetchPage(page + 1, q, activeStatus)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

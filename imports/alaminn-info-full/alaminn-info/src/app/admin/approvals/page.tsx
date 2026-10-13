"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ErrorState, EmptyState } from "@/components/admin/page-primitives";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";
import { Check, X, RotateCcw, Loader2 } from "lucide-react";

type AiTask = {
  id: string; workflow: string; objective: string; prompt: string;
  status: string; sensitivity: string; result: string | null;
  createdAt: string; requester: { name: string | null } | null;
};

type ApprovalsData = {
  approvals: unknown[];
  pendingTasks: AiTask[];
};

export default function AdminApprovalsPage() {
  const [data, setData] = useState<ApprovalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const env = await adminFetch<ApprovalsData>("/api/v1/admin/approvals?status=awaiting-approval");
      setData(env.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function decide(taskId: string, decision: "approved" | "rejected" | "revision") {
    setActing(taskId);
    try {
      await adminFetch("/api/v1/admin/approvals", {
        method: "POST",
        body: JSON.stringify({ taskId, decision, note: notes[taskId] || "" }),
      });
      toast.success(`Task ${decision}.`);
      setNotes((n) => { const c = { ...n }; delete c[taskId]; return c; });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setActing(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Approvals"
        subtitle="Review and decide on AI task outputs before delivery"
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || data.pendingTasks.length === 0 ? (
        <EmptyState message="No tasks awaiting approval. New AI outputs that require review will appear here." />
      ) : (
        <div className="space-y-4">
          {data.pendingTasks.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{t.objective}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <Badge variant="outline">{t.workflow}</Badge>
                      <Badge variant="secondary">{t.sensitivity}</Badge>
                      <span className="text-muted-foreground">by {t.requester?.name || "—"}</span>
                      <span className="text-muted-foreground">· {fmtDate(t.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Prompt</div>
                  <p className="text-sm bg-muted/30 p-3 rounded">{t.prompt}</p>
                </div>
                {t.result && (
                  <div>
                    <div className="text-xs font-medium uppercase text-muted-foreground mb-1">AI Output</div>
                    <pre className="text-sm bg-muted/30 p-3 rounded whitespace-pre-wrap max-h-72 overflow-y-auto">{t.result}</pre>
                  </div>
                )}
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground mb-1">Reviewer Note (optional)</div>
                  <Textarea
                    value={notes[t.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [t.id]: e.target.value }))}
                    placeholder="Add a note explaining your decision..."
                    rows={2}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => decide(t.id, "approved")} disabled={acting === t.id}>
                    {acting === t.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => decide(t.id, "rejected")} disabled={acting === t.id}>
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decide(t.id, "revision")} disabled={acting === t.id}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Request Revision
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

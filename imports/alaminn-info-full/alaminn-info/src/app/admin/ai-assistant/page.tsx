"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ErrorState, EmptyState } from "@/components/admin/page-primitives";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";
import { Bot, Loader2, Send } from "lucide-react";

type AiTask = {
  id: string; workflow: string; objective: string; prompt: string;
  status: string; sensitivity: string; result: string | null;
  createdAt: string; completedAt: string | null;
};

const WORKFLOWS = [
  "executive-linkedin-post", "seo-article-draft", "newsletter-draft",
  "case-study-draft", "partnership-proposal", "university-research-brief",
  "operations-audit", "sales-process-review", "crm-requirements-draft",
  "presentation-outline", "speaking-notes", "media-response",
  "monthly-authority-report", "competitor-research", "resource-checklist",
  "risk-review", "brand-consistency-audit",
];

export default function AdminAiAssistantPage() {
  const [tasks, setTasks] = useState<AiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [workflow, setWorkflow] = useState(WORKFLOWS[0]);
  const [objective, setObjective] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sensitivity, setSensitivity] = useState("internal");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const env = await adminFetch<AiTask[]>("/api/v1/admin/ai-tasks");
      setTasks(env.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!objective || !prompt) {
      toast.error("Objective and prompt are required.");
      return;
    }
    setSubmitting(true);
    try {
      await adminFetch("/api/v1/admin/ai-tasks", {
        method: "POST",
        body: JSON.stringify({ workflow, objective, prompt, sensitivity, approvalRequired: true }),
      });
      toast.success("AI task created. It will appear in the Approvals queue once processed.");
      setObjective(""); setPrompt("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Assistant"
        subtitle="Create governed AI tasks. All outputs require human approval before delivery."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4" /> New AI Task</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow">Workflow</Label>
                <Select value={workflow} onValueChange={setWorkflow}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WORKFLOWS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective">Objective *</Label>
                <Input id="objective" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="What should the AI accomplish?" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt *</Label>
                <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Detailed instructions for the AI..." rows={5} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sensitivity">Sensitivity</Label>
                <Select value={sensitivity} onValueChange={setSensitivity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Submit Task
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Past Tasks</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64" /> : error ? <ErrorState message={error} /> : tasks.length === 0 ? (
              <EmptyState message="No AI tasks yet. Create one to get started." />
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {tasks.map((t) => (
                  <div key={t.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{t.workflow}</Badge>
                      <Badge variant="secondary" className="text-xs">{t.status}</Badge>
                    </div>
                    <p className="text-sm font-medium line-clamp-1">{t.objective}</p>
                    {t.result && (
                      <pre className="text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">{t.result}</pre>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{fmtDate(t.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

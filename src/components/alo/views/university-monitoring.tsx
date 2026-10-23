"use client";

import * as React from "react";
import { Icon, StatCard, SectionCard, StatusBadge, EmptyState, LoadingGrid, PageHeader, MiniBar } from "@/components/alo/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { fmtDate, timeAgo } from "@/lib/alo-types";

// Change type metadata
const CHANGE_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  NEW_UNIVERSITY: { label: "New University", icon: "Building2", color: "bg-blue-50 text-blue-700 border-blue-200" },
  UNIVERSITY_UPDATED: { label: "University Updated", icon: "Building2", color: "bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border)]" },
  UNIVERSITY_CLOSED: { label: "University Closed", icon: "XCircle", color: "bg-rose-50 text-rose-700 border-rose-200" },
  NEW_FACULTY: { label: "New Faculty", icon: "Layers", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FACULTY_UPDATED: { label: "Faculty Updated", icon: "Layers", color: "bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border)]" },
  NEW_COURSE: { label: "New Course", icon: "BookOpen", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  COURSE_UPDATED: { label: "Course Updated", icon: "BookOpen", color: "bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border)]" },
  COURSE_CLOSED: { label: "Course Closed", icon: "XCircle", color: "bg-rose-50 text-rose-700 border-rose-200" },
  COURSE_RENAMED: { label: "Course Renamed", icon: "Edit3", color: "bg-amber-50 text-amber-700 border-amber-200" },
  COURSE_CODE_CHANGED: { label: "Course Code Changed", icon: "Hash", color: "bg-amber-50 text-amber-700 border-amber-200" },
  FEE_CHANGED: { label: "Fee Changed", icon: "DollarSign", color: "bg-orange-50 text-orange-700 border-orange-200" },
  INTAKE_CHANGED: { label: "Intake Changed", icon: "Calendar", color: "bg-orange-50 text-orange-700 border-orange-200" },
  DEADLINE_CHANGED: { label: "Deadline Changed", icon: "Clock", color: "bg-orange-50 text-orange-700 border-orange-200" },
  REQUIREMENT_CHANGED: { label: "Requirement Changed", icon: "FileCheck", color: "bg-orange-50 text-orange-700 border-orange-200" },
  ENGLISH_REQUIREMENT_CHANGED: { label: "English Req. Changed", icon: "Languages", color: "bg-orange-50 text-orange-700 border-orange-200" },
  SCHOLARSHIP_NEW: { label: "New Scholarship", icon: "Award", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SCHOLARSHIP_UPDATED: { label: "Scholarship Updated", icon: "Award", color: "bg-orange-50 text-orange-700 border-orange-200" },
  SCHOLARSHIP_CLOSED: { label: "Scholarship Closed", icon: "Award", color: "bg-rose-50 text-rose-700 border-rose-200" },
  DURATION_CHANGED: { label: "Duration Changed", icon: "Clock", color: "bg-amber-50 text-amber-700 border-amber-200" },
  CAMPUS_CHANGED: { label: "Campus Changed", icon: "MapPin", color: "bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border)]" },
  STUDY_MODE_CHANGED: { label: "Study Mode Changed", icon: "Monitor", color: "bg-amber-50 text-amber-700 border-amber-200" },
  APPLICATION_PROCESS_CHANGED: { label: "Application Process", icon: "ListChecks", color: "bg-amber-50 text-amber-700 border-amber-200" },
  OFFICIAL_POLICY_CHANGE: { label: "Official Policy Change", icon: "ShieldAlert", color: "bg-orange-50 text-orange-700 border-orange-200" },
  GOVERNMENT_POLICY_CHANGE: { label: "Government Policy", icon: "Landmark", color: "bg-rose-50 text-rose-700 border-rose-200" },
  SOURCE_CHANGED: { label: "Source Changed", icon: "RefreshCw", color: "bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border)]" },
  SOURCE_UNAVAILABLE: { label: "Source Unavailable", icon: "WifiOff", color: "bg-rose-50 text-rose-700 border-rose-200" },
  POSSIBLE_DATA_CONFLICT: { label: "Data Conflict", icon: "AlertTriangle", color: "bg-orange-50 text-orange-700 border-orange-200" },
  NEEDS_MANUAL_REVIEW: { label: "Needs Review", icon: "HelpCircle", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

const IMPACT_COLORS: Record<string, string> = {
  LOW: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-rose-100 text-rose-700",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  NEEDS_REVIEW: "bg-orange-100 text-orange-700",
  RECHECK_REQUESTED: "bg-blue-100 text-blue-700",
  SUPERSEDED: "bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]",
};

const HEALTH_COLORS: Record<string, string> = {
  HEALTHY: "bg-emerald-500",
  RUNNING: "bg-blue-500 animate-pulse",
  NEEDS_REVIEW: "bg-amber-500",
  ERROR: "bg-rose-500",
};

interface DashboardData {
  job: any;
  health: string;
  lastRun: any;
  recentRuns: any[];
  queue: {
    pending: number; approved: number; rejected: number;
    needsReview: number; recheckRequested: number; critical: number; conflicts: number;
  };
  sources: { total: number; active: number; broken: number; failed: number };
  entities: {
    universities: number; verifiedUniversities: number; unverifiedUniversities: number;
    courses: number; verifiedCourses: number; faculties: number;
    documents: number; approvedDocuments: number; discoveredDocuments: number;
  };
  changes: {
    byType: Array<{ type: string; count: number }>;
    byImpact: Array<{ level: string; count: number }>;
  };
  coursesByLevel: Array<{ level: string; count: number }>;
  universitiesByCountry: Array<{ country: string; count: number }>;
}

export function UniversityMonitoring({ onNavigate }: { onNavigate: (v: any, slug?: string) => void }) {
  const { toast } = useToast();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("overview");
  const [changes, setChanges] = React.useState<any[]>([]);
  const [changesTotal, setChangesTotal] = React.useState(0);
  const [changesLoading, setChangesLoading] = React.useState(false);
  const [changeFilter, setChangeFilter] = React.useState({ status: "PENDING", impact: "", changeType: "", q: "" });
  const [conflicts, setConflicts] = React.useState<any[]>([]);
  const [sources, setSources] = React.useState<any[]>([]);
  const [runs, setRuns] = React.useState<any[]>([]);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [triggering, setTriggering] = React.useState(false);
  const [selectedChange, setSelectedChange] = React.useState<any | null>(null);
  const [actionNotes, setActionNotes] = React.useState("");
  const [acting, setActing] = React.useState(false);
  const [canManageSources, setCanManageSources] = React.useState(false);
  const [sourceDialogOpen, setSourceDialogOpen] = React.useState(false);
  const [sourceSaving, setSourceSaving] = React.useState(false);
  const [sourceActionId, setSourceActionId] = React.useState<string | null>(null);
  const [sourceForm, setSourceForm] = React.useState({
    sourceName: '', sourceUrl: '', sourceType: 'official_university', entityType: 'UNIVERSITY',
    universitySlug: '', courseSlug: '', countrySlug: '', category: 'CATALOGUE',
  });

  const fetchDashboard = React.useCallback(async () => {
    try {
      const res = await fetch("/api/university-monitoring/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchChanges = React.useCallback(async () => {
    setChangesLoading(true);
    try {
      const params = new URLSearchParams();
      if (changeFilter.status) params.set("status", changeFilter.status);
      if (changeFilter.impact) params.set("impact", changeFilter.impact);
      if (changeFilter.changeType) params.set("changeType", changeFilter.changeType);
      if (changeFilter.q) params.set("q", changeFilter.q);
      const res = await fetch(`/api/university-monitoring/changes?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load changes");
      const json = await res.json();
      setChanges(json.changes);
      setChangesTotal(json.total);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setChangesLoading(false);
    }
  }, [changeFilter, toast]);

  const fetchConflicts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/university-monitoring/conflicts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load conflicts");
      const json = await res.json();
      setConflicts(json.conflicts);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }, [toast]);

  const fetchSources = React.useCallback(async () => {
    try {
      const res = await fetch("/api/university-monitoring/sources?limit=200", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load sources");
      const json = await res.json();
      setSources(json.sources);
      setCanManageSources(Boolean(json.canManage));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }, [toast]);

  const submitSourceCandidate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSourceSaving(true);
    try {
      const res = await fetch('/api/university-monitoring/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...sourceForm,
          universitySlug: sourceForm.universitySlug || undefined,
          courseSlug: sourceForm.courseSlug || undefined,
          countrySlug: sourceForm.countrySlug || undefined,
          category: sourceForm.category || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unable to register source');
      toast({ title: 'Source candidate registered', description: 'It is paused until source ownership and connectivity are verified.' });
      setSourceDialogOpen(false);
      setSourceForm({ sourceName: '', sourceUrl: '', sourceType: 'official_university', entityType: 'UNIVERSITY', universitySlug: '', courseSlug: '', countrySlug: '', category: 'CATALOGUE' });
      await fetchSources();
      fetchDashboard();
    } catch (error: any) {
      toast({ title: 'Source registration failed', description: error.message, variant: 'destructive' });
    } finally {
      setSourceSaving(false);
    }
  };

  const updateSource = async (source: any, action: 'VERIFY_SOURCE' | 'PAUSE' | 'RETIRE') => {
    if (action === 'VERIFY_SOURCE' && !window.confirm(`Confirm that ${source.sourceUrl} is an official source for the selected target? The server will make a bounded HTTPS probe; factual content is not automatically verified.`)) return;
    if (action === 'RETIRE' && !window.confirm(`Retire ${source.sourceName}? This cannot be undone; register a new source to monitor it again.`)) return;
    setSourceActionId(source.id);
    try {
      const res = await fetch('/api/university-monitoring/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: source.id, action, confirmedOfficialOwnership: action === 'VERIFY_SOURCE' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Source action failed');
      toast({ title: action === 'VERIFY_SOURCE' ? 'Source verified' : `Source ${action.toLowerCase()}`, description: json.message });
      await fetchSources();
      fetchDashboard();
    } catch (error: any) {
      toast({ title: 'Source action failed', description: error.message, variant: 'destructive' });
    } finally {
      setSourceActionId(null);
    }
  };

  const fetchRuns = React.useCallback(async () => {
    try {
      const res = await fetch("/api/university-monitoring/runs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load runs");
      const json = await res.json();
      setRuns(json.runs);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }, [toast]);

  const fetchLogs = React.useCallback(async () => {
    try {
      const res = await fetch("/api/university-monitoring/logs?limit=100", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load logs");
      const json = await res.json();
      setLogs(json.logs);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }, [toast]);

  React.useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  React.useEffect(() => { if (tab === "queue") fetchChanges(); }, [tab, fetchChanges]);
  React.useEffect(() => { if (tab === "conflicts") fetchConflicts(); }, [tab, fetchConflicts]);
  React.useEffect(() => { if (tab === "sources") fetchSources(); }, [tab, fetchSources]);
  React.useEffect(() => { if (tab === "runs") fetchRuns(); }, [tab, fetchRuns]);
  React.useEffect(() => { if (tab === "logs") fetchLogs(); }, [tab, fetchLogs]);

  const triggerRun = async () => {
    setTriggering(true);
    try {
      const res = await fetch("/api/university-monitoring/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scope: "verified-only", limit: 30 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Trigger failed");
      toast({
        title: "Monitoring run triggered",
        description: `${json.sourcesChecked || 0} sources checked, ${json.changesDetected || 0} changes detected.`,
      });
      fetchDashboard();
    } catch (e: any) {
      toast({ title: "Trigger failed", description: e.message, variant: "destructive" });
    } finally {
      setTriggering(false);
    }
  };

  const performAction = async (changeId: string, action: string) => {
    setActing(true);
    try {
      const res = await fetch(`/api/university-monitoring/changes/${changeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, notes: actionNotes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      toast({
        title: `Change ${action.toLowerCase()}d`,
        description: json.message,
        variant: action === "REJECT" ? "destructive" : "default",
      });
      setSelectedChange(null);
      setActionNotes("");
      fetchChanges();
      fetchDashboard();
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const recheck = async (changeId: string) => {
    setActing(true);
    try {
      const res = await fetch("/api/university-monitoring/recheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ changeId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Recheck failed");
      toast({
        title: "Recheck complete",
        description: `Confidence: ${(json.recheck?.confidence * 100).toFixed(0)}%`,
      });
      fetchChanges();
    } catch (e: any) {
      toast({ title: "Recheck failed", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  if (loading || !data) {
    return <LoadingGrid count={8} />;
  }

  const healthLabel = data.health.replace(/_/g, " ");

  return (
    <div className="space-y-6">
      <PageHeader
        title="University & Course Data Monitoring"
        subtitle="AI-powered 7-day monitoring of official university and government sources. All material changes require Super Admin approval before mutating production data."
        icon="SatelliteDish"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => fetchDashboard()} className="h-10">
              <Icon name="RefreshCw" className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button onClick={triggerRun} disabled={triggering} className="h-10 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand)]/90">
              <Icon name={triggering ? "Loader2" : "Play"} className={`mr-2 h-4 w-4 ${triggering ? "animate-spin" : ""}`} />
              {triggering ? "Running..." : "Trigger Run Now"}
            </Button>
          </div>
        }
      />

      {/* Health Banner */}
      <Card className={`rounded-2xl border-2 p-5 ${
        data.health === "HEALTHY" ? "border-emerald-200 bg-emerald-50/50" :
        data.health === "RUNNING" ? "border-blue-200 bg-blue-50/50" :
        data.health === "NEEDS_REVIEW" ? "border-amber-200 bg-amber-50/50" :
        "border-rose-200 bg-rose-50/50"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${HEALTH_COLORS[data.health]}`} />
            <div>
              <div className="text-sm font-semibold text-[var(--alo-text)]">System Status: {healthLabel}</div>
              <div className="text-xs text-[var(--alo-body)]">
                {data.job ? (
                  <>Last run: {data.job.lastRunCompletedAt ? timeAgo(data.job.lastRunCompletedAt) : "never"} · Next scheduled run: {data.job.nextRunAt ? fmtDate(data.job.nextRunAt) : "not scheduled"}</>
                ) : (
                  <>Monitoring job not configured</>
                )}
              </div>
            </div>
          </div>
          {data.job && (
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="text-center">
                <div className="font-bold text-[var(--alo-text)]">{data.job.totalRuns}</div>
                <div className="text-[var(--alo-text-muted)]">Total Runs</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-emerald-600">{data.job.successfulRuns}</div>
                <div className="text-[var(--alo-text-muted)]">Successful</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-rose-600">{data.job.failedRuns}</div>
                <div className="text-[var(--alo-text-muted)]">Failed</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Universities" value={data.entities.universities} icon="Building2" accent="blue" hint={`${data.entities.verifiedUniversities} verified · ${data.entities.unverifiedUniversities} unverified`} />
        <StatCard label="Courses" value={data.entities.courses} icon="BookOpen" accent="orange" hint={`${data.entities.verifiedCourses} verified`} />
        <StatCard label="Official Sources" value={data.sources.total} icon="Link2" accent="violet" hint={`${data.sources.active} active · ${data.sources.broken} broken`} />
        <StatCard label="Pending Approvals" value={data.queue.pending} icon="Clock" accent="amber" hint={`${data.queue.critical} critical`} />
        <StatCard label="Critical Changes" value={data.queue.critical} icon="AlertTriangle" accent="rose" hint="Needs immediate review" />
        <StatCard label="Conflicts" value={data.queue.conflicts} icon="GitBranch" accent="orange" hint="Official sources disagree" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border-2 border-[var(--alo-border)] bg-white p-1.5">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="queue" className="rounded-xl data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white">
            Verification Queue {data.queue.pending > 0 && <Badge className="ml-2 bg-amber-100 text-amber-700">{data.queue.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="rounded-xl data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white">
            Conflicts {data.queue.conflicts > 0 && <Badge className="ml-2 bg-rose-100 text-rose-700">{data.queue.conflicts}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sources" className="rounded-xl data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white">Official Sources</TabsTrigger>
          <TabsTrigger value="runs" className="rounded-xl data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white">Run History</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white">Audit Logs</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Last Run Summary */}
            <SectionCard title="Last Monitoring Run" icon="History">
              {data.lastRun ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm text-[var(--alo-brand)]">{data.lastRun.runId}</div>
                    <Badge className={STATUS_COLORS[data.lastRun.status] || "bg-[var(--alo-surface-muted)]"}>{data.lastRun.status}</Badge>
                  </div>
                  <div className="text-xs text-[var(--alo-text-muted)]">Started {timeAgo(data.lastRun.startedAt)} · Completed {data.lastRun.completedAt ? timeAgo(data.lastRun.completedAt) : "in progress"}</div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg bg-[var(--alo-page)] p-3">
                      <div className="font-bold text-[var(--alo-text)]">{data.lastRun.sourcesChecked}</div>
                      <div className="text-[var(--alo-text-muted)]">Sources Checked</div>
                    </div>
                    <div className="rounded-lg bg-[var(--alo-page)] p-3">
                      <div className="font-bold text-[var(--alo-text)]">{data.lastRun.changesDetected}</div>
                      <div className="text-[var(--alo-text-muted)]">Changes Detected</div>
                    </div>
                    <div className="rounded-lg bg-[var(--alo-page)] p-3">
                      <div className="font-bold text-rose-600">{data.lastRun.criticalChanges}</div>
                      <div className="text-[var(--alo-text-muted)]">Critical</div>
                    </div>
                  </div>
                  {data.lastRun.aiReportSummary && (
                    <div className="rounded-lg bg-blue-50 p-3 text-xs text-[var(--alo-body)]">
                      <div className="mb-1 font-semibold text-[var(--alo-brand)]">AI Report Summary</div>
                      {data.lastRun.aiReportSummary}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState icon="Calendar" title="No runs yet" description="Trigger a monitoring run to see results here." />
              )}
            </SectionCard>

            {/* Change Breakdown by Impact */}
            <SectionCard title="Pending Changes by Impact Level" icon="BarChart3">
              {data.changes.byImpact.length > 0 ? (
                <div className="space-y-3">
                  {data.changes.byImpact.map((c) => (
                    <div key={c.level} className="flex items-center gap-3">
                      <div className={`rounded-lg px-3 py-1 text-xs font-semibold ${IMPACT_COLORS[c.level]}`}>{c.level}</div>
                      <div className="flex-1">
                        <MiniBar value={c.count} max={Math.max(...data.changes.byImpact.map((x) => x.count), 1)} color={c.level === "CRITICAL" ? "#e11d48" : c.level === "HIGH" ? "#C93D13" : c.level === "MEDIUM" ? "#f59e0b" : "#64748b"} />
                      </div>
                      <div className="w-8 text-right text-sm font-bold text-[var(--alo-text)]">{c.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="CheckCircle" title="No pending changes" description="All caught up!" />
              )}
            </SectionCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Courses by Level */}
            <SectionCard title="Course Catalogue by Degree Level" icon="GraduationCap">
              <div className="space-y-2">
                {data.coursesByLevel.map((c) => (
                  <div key={c.level} className="flex items-center justify-between text-sm">
                    <div className="text-[var(--alo-body)]">{c.level}</div>
                    <Badge className="bg-blue-50 text-blue-700">{c.count}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Universities by Country */}
            <SectionCard title="Universities by Country" icon="Globe">
              <div className="space-y-2 max-h-72 overflow-y-auto alo-scroll pr-2">
                {data.universitiesByCountry.map((c) => (
                  <div key={c.country} className="flex items-center justify-between text-sm">
                    <div className="text-[var(--alo-body)] capitalize">{c.country}</div>
                    <Badge className="bg-violet-50 text-violet-700">{c.count}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* AI Safety Rules */}
          <SectionCard title="AI Safety Rules — Non-Negotiable" icon="ShieldCheck">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border-2 border-rose-200 bg-rose-50/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-700">
                  <Icon name="X" className="h-4 w-4" /> AI MUST NOT
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--alo-body)]">
                  <li>• Publish changes to production data without Super Admin approval</li>
                  <li>• Delete existing verified data based on detected changes</li>
                  <li>• Override existing verified values without preserving history</li>
                  <li>• Present unapproved detected changes as confirmed facts to students</li>
                  <li>• Use third-party websites to override official university sources</li>
                  <li>• Fabricate university or course records to reach a target count</li>
                  <li>• Mark unverified information as verified</li>
                </ul>
              </div>
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <Icon name="Check" className="h-4 w-4" /> AI MUST
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--alo-body)]">
                  <li>• Detect changes, classify, and route to Super Admin approval queue</li>
                  <li>• Preserve old values in versioned history (never destroy)</li>
                  <li>• Store evidence: source URL, snapshot, AI explanation, confidence</li>
                  <li>• Mark uncertain data as NEEDS_REVIEW</li>
                  <li>• Log every monitoring run, fetch, and approval action</li>
                  <li>• Restrict student-facing data to APPROVED + VERIFIED records only</li>
                  <li>• Flag conflicting official sources as DATA_CONFLICT</li>
                </ul>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* VERIFICATION QUEUE TAB */}
        <TabsContent value="queue" className="mt-6 space-y-4">
          {/* Filters */}
          <Card className="rounded-2xl border-2 border-[var(--alo-border)] p-4">
            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-[var(--alo-text-muted)]">Status</Label>
                <Select value={changeFilter.status} onValueChange={(v) => setChangeFilter({ ...changeFilter, status: v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="RECHECK_REQUESTED">Recheck Requested</SelectItem>
                    <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
                    <SelectItem value="ALL">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[var(--alo-text-muted)]">Impact Level</Label>
                <Select value={changeFilter.impact || "ALL"} onValueChange={(v) => setChangeFilter({ ...changeFilter, impact: v === "ALL" ? "" : v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[var(--alo-text-muted)]">Change Type</Label>
                <Select value={changeFilter.changeType || "ALL"} onValueChange={(v) => setChangeFilter({ ...changeFilter, changeType: v === "ALL" ? "" : v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    {Object.entries(CHANGE_TYPE_META).slice(0, 15).map(([k, m]) => (
                      <SelectItem key={k} value={k}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[var(--alo-text-muted)]">Search</Label>
                <Input
                  className="h-10"
                  placeholder="Field, value, URL..."
                  value={changeFilter.q}
                  onChange={(e) => setChangeFilter({ ...changeFilter, q: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[var(--alo-text-muted)]">
              <div>{changesTotal} changes found</div>
              <Button variant="outline" size="sm" onClick={fetchChanges} disabled={changesLoading}>
                <Icon name="RefreshCw" className={`mr-2 h-3 w-3 ${changesLoading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
          </Card>

          {/* Changes Table */}
          {changesLoading ? (
            <LoadingGrid count={5} />
          ) : changes.length === 0 ? (
            <EmptyState icon="Inbox" title="No changes found" description="Try adjusting your filters or trigger a monitoring run." />
          ) : (
            <Card className="rounded-2xl border-2 border-[var(--alo-border)] overflow-hidden">
              <div className="max-h-[640px] overflow-auto alo-scroll">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="text-xs">Change Type</TableHead>
                      <TableHead className="text-xs">Entity</TableHead>
                      <TableHead className="text-xs">Field</TableHead>
                      <TableHead className="text-xs">Old → New</TableHead>
                      <TableHead className="text-xs">Impact</TableHead>
                      <TableHead className="text-xs">Confidence</TableHead>
                      <TableHead className="text-xs">Detected</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changes.map((c) => {
                      const meta = CHANGE_TYPE_META[c.changeType] || { label: c.changeType, icon: "AlertCircle", color: "bg-[var(--alo-page)] text-[var(--alo-body)]" };
                      return (
                        <TableRow key={c.id} className="cursor-pointer hover:bg-[var(--alo-page)]" onClick={() => { setSelectedChange(c); setActionNotes(""); }}>
                          <TableCell className="align-top">
                            <div className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${meta.color}`}>
                              <Icon name={meta.icon} className="h-3 w-3" /> {meta.label}
                            </div>
                          </TableCell>
                          <TableCell className="align-top text-xs">
                            <div className="font-medium text-[var(--alo-text)]">{c.universitySlug || c.courseSlug || c.countrySlug || "—"}</div>
                            <div className="text-[var(--alo-text-muted)]">{c.entityType}</div>
                          </TableCell>
                          <TableCell className="align-top text-xs font-mono text-[var(--alo-brand)]">{c.fieldName}</TableCell>
                          <TableCell className="align-top text-xs max-w-xs">
                            <div className="truncate text-rose-600 line-through" title={c.oldValue || ""}>{c.oldValue || "(none)"}</div>
                            <div className="truncate text-emerald-700" title={c.newValue || ""}>{c.newValue || "(removed)"}</div>
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge className={IMPACT_COLORS[c.impactLevel]}>{c.impactLevel}</Badge>
                          </TableCell>
                          <TableCell className="align-top text-xs">
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-10 rounded-full bg-slate-200 overflow-hidden">
                                <div className={`h-full ${c.confidence >= 0.8 ? "bg-emerald-500" : c.confidence >= 0.5 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${c.confidence * 100}%` }} />
                              </div>
                              <span>{(c.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="align-top text-xs text-[var(--alo-text-muted)]">{timeAgo(c.detectedAt)}</TableCell>
                          <TableCell className="align-top text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => recheck(c.id)} disabled={acting}>
                                <Icon name="RefreshCw" className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => performAction(c.id, "APPROVE")} disabled={acting}>
                                <Icon name="Check" className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => performAction(c.id, "REJECT")} disabled={acting}>
                                <Icon name="X" className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* CONFLICTS TAB */}
        <TabsContent value="conflicts" className="mt-6 space-y-4">
          {conflicts.length === 0 ? (
            <EmptyState icon="GitMerge" title="No data conflicts" description="When two official sources disagree about the same fact, a conflict will appear here." />
          ) : (
            <div className="grid gap-4">
              {conflicts.map((c) => (
                <Card key={c.id} className="rounded-2xl border-2 border-orange-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-700">CONFLICT</Badge>
                        <span className="font-mono text-sm text-[var(--alo-brand)]">{c.fieldName}</span>
                      </div>
                      <div className="mt-1 text-xs text-[var(--alo-text-muted)]">
                        {c.entityType} · {c.universitySlug || c.courseSlug || c.countrySlug} · detected {timeAgo(c.detectedAt)}
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[c.status] || "bg-[var(--alo-surface-muted)]"}>{c.status}</Badge>
                  </div>
                  <div className="mt-3 text-xs">
                    <div className="font-semibold text-[var(--alo-body)]">Conflicting Values:</div>
                    <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-[var(--alo-page)] p-2 text-[11px] alo-scroll">{JSON.stringify(JSON.parse(c.conflictingValues || "[]"), null, 2)}</pre>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SOURCES TAB */}
        <TabsContent value="sources" className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--alo-text)]">Official source registry</div>
              <div className="mt-1 text-xs text-[var(--alo-body)]">New entries remain paused until a Super Admin confirms official ownership and a safe HTTPS probe succeeds. Page facts still require separate review.</div>
            </div>
            {canManageSources && <Button onClick={() => setSourceDialogOpen(true)} className="shrink-0 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">Register Source Candidate</Button>}
          </div>
          <Card className="rounded-2xl border-2 border-[var(--alo-border)] overflow-hidden">
            <div className="max-h-[640px] overflow-auto alo-scroll">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="text-xs">Source</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Entity</TableHead>
                    <TableHead className="text-xs">Priority</TableHead>
                    <TableHead className="text-xs">Last Checked</TableHead>
                    <TableHead className="text-xs">Source Verification</TableHead>
                    <TableHead className="text-xs">Monitoring</TableHead>
                    <TableHead className="text-xs">Failures</TableHead>
                    {canManageSources && <TableHead className="text-xs">Admin Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="align-top">
                        <div className="text-sm font-medium text-[var(--alo-text)]">{s.sourceName}</div>
                        <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--alo-brand)] hover:underline">{s.sourceUrl}</a>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge className="bg-violet-50 text-violet-700 text-xs">{s.sourceType.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="align-top text-xs">
                        <div>{s.entityType}</div>
                        <div className="text-[var(--alo-text-muted)]">{s.universitySlug || s.courseSlug || s.countrySlug || "—"}</div>
                      </TableCell>
                      <TableCell className="align-top text-xs">
                        <Badge className={s.priority === 1 ? "bg-emerald-100 text-emerald-700" : s.priority <= 3 ? "bg-blue-100 text-blue-700" : "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"}>P{s.priority}</Badge>
                      </TableCell>
                      <TableCell className="align-top text-xs text-[var(--alo-text-muted)]">{s.lastCheckedAt ? timeAgo(s.lastCheckedAt) : "never"}</TableCell>
                      <TableCell className="align-top">
                        <Badge className={['verified', 'VERIFIED'].includes(s.verificationStatus) ? "bg-emerald-100 text-emerald-700" : s.verificationStatus === 'failed' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}>{String(s.verificationStatus || 'pending').replace(/_/g, ' ')}</Badge>
                        <div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{s.lastVerifiedAt ? `source confirmed ${timeAgo(s.lastVerifiedAt)}` : 'ownership not confirmed'}</div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge className={s.status === "ACTIVE" && s.monitoringEnabled ? "bg-emerald-100 text-emerald-700" : s.status === "BROKEN" ? "bg-rose-100 text-rose-700" : "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"}>{s.status}{s.monitoringEnabled ? ' · ON' : ' · OFF'}</Badge>
                      </TableCell>
                      <TableCell className="align-top text-xs">
                        {s.consecutiveFailures > 0 ? <span className="text-rose-600 font-semibold">{s.consecutiveFailures}</span> : <span className="text-[var(--alo-text-muted)]">0</span>}
                      </TableCell>
                      {canManageSources && <TableCell className="align-top">
                        <div className="flex min-w-32 flex-col gap-1.5">
                          {s.status !== 'RETIRED' && (s.status === 'ACTIVE' && s.monitoringEnabled
                            ? <Button size="sm" variant="outline" disabled={sourceActionId === s.id} onClick={() => updateSource(s, 'PAUSE')}>Pause</Button>
                            : <Button size="sm" variant="outline" disabled={sourceActionId === s.id} onClick={() => updateSource(s, 'VERIFY_SOURCE')}>Verify / Recheck</Button>)}
                          {s.status !== 'RETIRED' && <Button size="sm" variant="ghost" className="text-rose-700" disabled={sourceActionId === s.id} onClick={() => updateSource(s, 'RETIRE')}>Retire</Button>}
                        </div>
                      </TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
          <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register official source candidate</DialogTitle>
              </DialogHeader>
              <form onSubmit={submitSourceCandidate} className="space-y-4">
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Registering does not mark a source or its facts as verified. The new record stays paused until a Super Admin verifies the official ownership and connectivity.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="monitor-source-name">Source label</Label><Input id="monitor-source-name" required maxLength={180} value={sourceForm.sourceName} onChange={(e) => setSourceForm((current) => ({ ...current, sourceName: e.target.value }))} placeholder="Official source page label" /></div>
                  <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="monitor-source-url">Official HTTPS URL</Label><Input id="monitor-source-url" required type="url" value={sourceForm.sourceUrl} onChange={(e) => setSourceForm((current) => ({ ...current, sourceUrl: e.target.value }))} placeholder="https://..." /></div>
                  <div className="space-y-1.5"><Label>Entity type</Label><Select value={sourceForm.entityType} onValueChange={(value) => setSourceForm((current) => ({ ...current, entityType: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['UNIVERSITY', 'COURSE', 'COUNTRY', 'GOVERNMENT', 'AUTHORITY'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label>Source type</Label><Select value={sourceForm.sourceType} onValueChange={(value) => setSourceForm((current) => ({ ...current, sourceType: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['official_university', 'official_government', 'official_authority', 'official_admissions_portal', 'official_test_provider', 'official_scholarship'].map((value) => <SelectItem key={value} value={value}>{value.replaceAll('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label>Category</Label><Select value={sourceForm.category} onValueChange={(value) => setSourceForm((current) => ({ ...current, category: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['CATALOGUE', 'ADMISSIONS', 'SCHOLARSHIPS', 'VISAS', 'FEES', 'INTAKES', 'REQUIREMENTS', 'POLICY'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label htmlFor="monitor-source-university">University slug {sourceForm.entityType === 'UNIVERSITY' || sourceForm.entityType === 'COURSE' ? '(required)' : '(optional)'}</Label><Input id="monitor-source-university" value={sourceForm.universitySlug} onChange={(e) => setSourceForm((current) => ({ ...current, universitySlug: e.target.value }))} placeholder="existing-catalogue-slug" /></div>
                  {sourceForm.entityType === 'COURSE' && <div className="space-y-1.5"><Label htmlFor="monitor-source-course">Course slug (required)</Label><Input id="monitor-source-course" required value={sourceForm.courseSlug} onChange={(e) => setSourceForm((current) => ({ ...current, courseSlug: e.target.value }))} placeholder="existing-course-slug" /></div>}
                  {['COUNTRY', 'GOVERNMENT', 'AUTHORITY'].includes(sourceForm.entityType) && <div className="space-y-1.5"><Label htmlFor="monitor-source-country">Country slug (required)</Label><Input id="monitor-source-country" required value={sourceForm.countrySlug} onChange={(e) => setSourceForm((current) => ({ ...current, countrySlug: e.target.value }))} placeholder="country-slug" /></div>}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSourceDialogOpen(false)} disabled={sourceSaving}>Cancel</Button>
                  <Button type="submit" disabled={sourceSaving} className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">{sourceSaving ? 'Registering…' : 'Register paused candidate'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* RUNS TAB */}
        <TabsContent value="runs" className="mt-6 space-y-4">
          <Card className="rounded-2xl border-2 border-[var(--alo-border)] overflow-hidden">
            <div className="max-h-[640px] overflow-auto alo-scroll">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="text-xs">Run ID</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Started</TableHead>
                    <TableHead className="text-xs">Completed</TableHead>
                    <TableHead className="text-xs">Sources</TableHead>
                    <TableHead className="text-xs">Changes</TableHead>
                    <TableHead className="text-xs">Critical</TableHead>
                    <TableHead className="text-xs">Failed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs text-[var(--alo-brand)]">{r.runId}</TableCell>
                      <TableCell><Badge className={STATUS_COLORS[r.status] || "bg-[var(--alo-surface-muted)]"}>{r.status}</Badge></TableCell>
                      <TableCell className="text-xs text-[var(--alo-text-muted)]">{timeAgo(r.startedAt)}</TableCell>
                      <TableCell className="text-xs text-[var(--alo-text-muted)]">{r.completedAt ? timeAgo(r.completedAt) : "—"}</TableCell>
                      <TableCell className="text-xs">{r.sourcesChecked}</TableCell>
                      <TableCell className="text-xs">{r.changesDetected}</TableCell>
                      <TableCell className="text-xs text-rose-600 font-semibold">{r.criticalChanges}</TableCell>
                      <TableCell className="text-xs text-rose-600">{r.failedSources}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* LOGS TAB */}
        <TabsContent value="logs" className="mt-6 space-y-4">
          <Card className="rounded-2xl border-2 border-[var(--alo-border)] p-4">
            <div className="max-h-[640px] overflow-auto alo-scroll font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <div className="text-center text-[var(--alo-text-muted)] py-8">No logs yet</div>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="flex gap-2 py-1 border-b border-[var(--alo-border)]">
                    <span className="text-[var(--alo-text-muted)] w-32 shrink-0">{new Date(l.createdAt).toISOString().slice(0, 19)}</span>
                    <span className={`w-12 shrink-0 font-semibold ${l.level === "ERROR" ? "text-rose-600" : l.level === "WARN" ? "text-amber-600" : l.level === "AUDIT" ? "text-[var(--alo-brand)]" : "text-[var(--alo-body)]"}`}>{l.level}</span>
                    <span className="text-[var(--alo-body)]">{l.message}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Detail / Compare Dialog */}
      <Dialog open={!!selectedChange} onOpenChange={(o) => !o && setSelectedChange(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto alo-scroll">
          {selectedChange && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Icon name={CHANGE_TYPE_META[selectedChange.changeType]?.icon || "AlertCircle"} className="h-5 w-5 text-[var(--alo-brand)]" />
                  {CHANGE_TYPE_META[selectedChange.changeType]?.label || selectedChange.changeType}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Source */}
                <div className="rounded-lg bg-[var(--alo-page)] p-3 text-xs">
                  <div className="font-semibold text-[var(--alo-body)]">Source</div>
                  <a href={selectedChange.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--alo-brand)] hover:underline break-all">{selectedChange.sourceUrl}</a>
                  {selectedChange.source?.sourceName && <div className="mt-1 text-[var(--alo-text-muted)]">{selectedChange.source.sourceName} (Priority P{selectedChange.source.priority})</div>}
                </div>

                {/* Old vs New comparison */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-lg border-2 border-rose-200 bg-rose-50/50 p-4">
                    <div className="mb-2 text-xs font-semibold text-rose-700">OLD VALUE (verified {selectedChange.previousVerifiedAt ? fmtDate(selectedChange.previousVerifiedAt) : "unknown"})</div>
                    <pre className="whitespace-pre-wrap break-words text-xs text-[var(--alo-text)]">{selectedChange.oldValue || "(field did not exist before)"}</pre>
                  </div>
                  <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50/50 p-4">
                    <div className="mb-2 text-xs font-semibold text-emerald-700">NEW VALUE (detected {timeAgo(selectedChange.detectedAt)})</div>
                    <pre className="whitespace-pre-wrap break-words text-xs text-[var(--alo-text)]">{selectedChange.newValue || "(field was removed)"}</pre>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="rounded-lg bg-blue-50 p-3 text-xs">
                  <div className="mb-1 font-semibold text-[var(--alo-brand)]">AI Explanation</div>
                  <div className="text-[var(--alo-body)]">{selectedChange.aiExplanation}</div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-[var(--alo-text-muted)]">
                    <span>Confidence: <strong className={selectedChange.confidence >= 0.8 ? "text-emerald-600" : selectedChange.confidence >= 0.5 ? "text-amber-600" : "text-rose-600"}>{(selectedChange.confidence * 100).toFixed(0)}%</strong></span>
                    <span>Impact: <strong>{selectedChange.impactLevel}</strong></span>
                  </div>
                </div>

                {/* Review notes */}
                <div>
                  <Label className="text-xs text-[var(--alo-text-muted)]">Review Notes (optional)</Label>
                  <Textarea
                    className="mt-1"
                    rows={3}
                    placeholder="Add notes for the audit log..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 rounded-lg bg-amber-50 p-3 text-xs text-[var(--alo-body)]">
                  <Icon name="Info" className="h-4 w-4 text-amber-600" />
                  <span>Approval applies only allowlisted fields after the current official snapshot, quoted evidence, and production version are checked. Rejected values never write; the actual pre-change value is preserved in history.</span>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => recheck(selectedChange.id)} disabled={acting}>
                  <Icon name="RefreshCw" className={`mr-2 h-4 w-4 ${acting ? "animate-spin" : ""}`} /> Request Recheck
                </Button>
                <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => performAction(selectedChange.id, "REJECT")} disabled={acting}>
                  <Icon name="X" className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => performAction(selectedChange.id, "APPROVE")} disabled={acting}>
                  <Icon name="Check" className="mr-2 h-4 w-4" /> Approve & Apply to Production
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default UniversityMonitoring;

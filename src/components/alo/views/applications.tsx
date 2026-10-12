"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  StatusBadge,
  PageHeader,
  EmptyState,
  LoadingGrid,
  SectionCard,
} from "@/components/alo/shared";
import {
  APP_STAGES,
  COUNTRIES,
  STAGE_COLORS,
  STAGE_LABELS,
  fmtDate,
} from "@/lib/alo-types";

interface AppRow {
  id: string;
  applicationId: string;
  studentId: string;
  university: string;
  course: string;
  country: string;
  intake: string;
  studyLevel: string;
  stage: string;
  priority: string;
  deadline: string | null;
  student?: { studentId: string; fullName: string } | null;
}

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  URGENT: { label: "Urgent", cls: "bg-red-100 text-red-700" },
  HIGH: { label: "High", cls: "bg-orange-100 text-orange-700" },
  NORMAL: { label: "Normal", cls: "bg-sky-100 text-sky-700" },
  LOW: { label: "Low", cls: "bg-slate-100 text-slate-600" },
};

const COUNTRY_FLAGS: Record<string, string> = {
  UK: "GB",
  USA: "US",
  Canada: "CA",
  Australia: "AU",
  Germany: "DE",
  Ireland: "IE",
  Malaysia: "MY",
  "New Zealand": "NZ",
  Finland: "FI",
  Sweden: "SE",
};

export function ApplicationsView() {
  const { toast } = useToast();
  const [apps, setApps] = React.useState<AppRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stageFilter, setStageFilter] = React.useState("ALL");
  const [countryFilter, setCountryFilter] = React.useState("ALL");

  // Update dialog
  const [updateOpen, setUpdateOpen] = React.useState(false);
  const [updateTarget, setUpdateTarget] = React.useState<AppRow | null>(null);
  const [newStage, setNewStage] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const fetchApps = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      setApps(Array.isArray(data.applications) ? data.applications : []);
    } catch {
      toast({
        title: "Failed to load applications",
        description: "Please check your connection and try again.",
      });
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const stats = React.useMemo(() => {
    const total = apps.length;
    const submitted = apps.filter((a) =>
      ["APPLICATION_SUBMITTED", "CONDITIONAL_OFFFER", "UNCONDITIONAL_OFFER"].includes(a.stage)
    ).length;
    const offers = apps.filter((a) =>
      ["CONDITIONAL_OFFFER", "UNCONDITIONAL_OFFER"].includes(a.stage)
    ).length;
    const visaApproved = apps.filter((a) => a.stage === "VISA_APPROVED").length;
    return { total, submitted, offers, visaApproved };
  }, [apps]);

  const stageCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const stage of APP_STAGES) map.set(stage, 0);
    for (const a of apps) map.set(a.stage, (map.get(a.stage) || 0) + 1);
    return map;
  }, [apps]);

  const filtered = React.useMemo(() => {
    return apps.filter((a) => {
      if (stageFilter !== "ALL" && a.stage !== stageFilter) return false;
      if (countryFilter !== "ALL" && a.country !== countryFilter) return false;
      return true;
    });
  }, [apps, stageFilter, countryFilter]);

  const openUpdate = (app: AppRow) => {
    setUpdateTarget(app);
    setNewStage(app.stage);
    setUpdateOpen(true);
  };

  const submitUpdate = async () => {
    if (!updateTarget || !newStage) return;
    setSaving(true);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updateTarget.id,
          stage: newStage,
        }),
      });
      if (!res.ok) throw new Error("patch failed");
      const data = await res.json();
      setApps((prev) =>
        prev.map((a) => (a.id === updateTarget.id ? { ...a, ...(data.application || {}) } : a))
      );
      toast({
        title: "Stage updated",
        description: `${updateTarget.university} moved to ${STAGE_LABELS[newStage] || newStage}.`,
      });
      setUpdateOpen(false);
      setUpdateTarget(null);
    } catch {
      toast({
        title: "Update failed",
        description: "Could not update application stage. Try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Pipeline"
        subtitle="Track applications from counseling to enrollment — 20 stages."
        icon="ClipboardList"
      />

      {/* Stats */}
      {loading ? (
        <LoadingGrid count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Applications" value={stats.total} icon="Files" accent="blue" hint="Across all students" />
          <StatCard label="Submitted" value={stats.submitted} icon="Send" accent="orange" hint="Awaiting university decision" />
          <StatCard label="Offers Received" value={stats.offers} icon="Award" accent="violet" hint="Conditional & unconditional" />
          <StatCard label="Visa Approved" value={stats.visaApproved} icon="Stamp" accent="emerald" hint="Ready for pre-departure" />
        </div>
      )}

      {/* Stage funnel */}
      <SectionCard
        title="Pipeline funnel"
        icon="GitBranch"
        description="Distribution of applications across the 20 stages."
      >
        <div className="flex flex-wrap gap-2">
          {APP_STAGES.map((stage) => {
            const count = stageCounts.get(stage) || 0;
            const active = count > 0;
            const colorCls = STAGE_COLORS[stage] || "bg-slate-100 text-slate-700";
            return (
              <button
                key={stage}
                onClick={() => setStageFilter(stageFilter === stage ? "ALL" : stage)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  stageFilter === stage
                    ? "border-[#2563EB] ring-2 ring-[#2563EB]/20"
                    : "border-transparent"
                } ${active ? colorCls : "bg-slate-50 text-slate-400"}`}
                title={STAGE_LABELS[stage]}
              >
                <span className="font-mono text-[10px] opacity-70">
                  {APP_STAGES.indexOf(stage) + 1}
                </span>
                <span className="truncate max-w-[140px]">{STAGE_LABELS[stage]}</span>
                <span
                  className={`ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    active ? "bg-white/70 text-current" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Filters */}
      <SectionCard title="Filter applications" icon="Filter">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Stage</label>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="h-10 w-full border-[#2563EB]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All stages</SelectItem>
                {APP_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Country</label>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="h-10 w-full border-[#2563EB]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All countries</SelectItem>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Application list */}
      <SectionCard
        title="Applications"
        icon="Layers"
        description={`${filtered.length} of ${apps.length} applications shown`}
      >
        {loading ? (
          <LoadingGrid count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="ClipboardList"
            title="No applications found"
            description={
              apps.length === 0
                ? "Applications will appear here once students submit their first university application."
                : "Try adjusting your filters to see more results."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((app) => {
              const stageIdx = APP_STAGES.indexOf(app.stage);
              const pct = Math.round(((stageIdx + 1) / APP_STAGES.length) * 100);
              const priority = PRIORITY_META[app.priority] || PRIORITY_META.NORMAL;
              const flag = COUNTRY_FLAGS[app.country];
              const deadline = app.deadline ? new Date(app.deadline) : null;
              const daysToDeadline = deadline
                ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              const deadlineNear = daysToDeadline !== null && daysToDeadline >= 0 && daysToDeadline <= 14;
              const deadlinePassed = daysToDeadline !== null && daysToDeadline < 0;
              return (
                <Card
                  key={app.id}
                  className="rounded-2xl border-2 border-[#2563EB]/15 transition-colors hover:border-[#2563EB]/40"
                >
                  <CardContent className="space-y-3 pt-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#2563EB]">
                            {app.applicationId}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priority.cls}`}
                          >
                            {priority.label}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-bold text-foreground">
                          {app.student?.fullName || "Unknown student"}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {app.student?.studentId || app.studentId}
                        </p>
                      </div>
                      <StatusBadge
                        status={app.stage}
                        colorMap={STAGE_COLORS}
                        labels={STAGE_LABELS}
                      />
                    </div>

                    {/* Course details */}
                    <div className="rounded-xl border border-[#2563EB]/10 bg-[#f7f9fc] p-3">
                      <div className="flex items-start gap-2">
                        <Icon name="Building2" className="mt-0.5 size-4 shrink-0 text-[#2563EB]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {app.university}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{app.course}</p>
                        </div>
                        {flag && (
                          <span
                            className="shrink-0 rounded border border-[#2563EB]/15 bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#2563EB]"
                            title={app.country}
                          >
                            {flag} {app.country}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Icon name="CalendarDays" className="size-3" />
                          Intake: <span className="font-medium text-foreground">{app.intake || "—"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="GraduationCap" className="size-3" />
                          <span className="font-medium text-foreground">{app.studyLevel || "—"}</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">Pipeline progress</span>
                        <span className="font-semibold text-[#2563EB]">
                          Stage {stageIdx + 1} / {APP_STAGES.length} · {pct}%
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className="h-2 bg-[#e8f0fb]"
                        // style for indicator color
                      />
                    </div>

                    {/* Deadline + actions */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Icon
                          name="CalendarClock"
                          className={`size-3.5 ${
                            deadlinePassed
                              ? "text-red-500"
                              : deadlineNear
                              ? "text-amber-500"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span className="text-muted-foreground">Deadline:</span>
                        <span
                          className={`font-semibold ${
                            deadlinePassed
                              ? "text-red-600"
                              : deadlineNear
                              ? "text-amber-600"
                              : "text-foreground"
                          }`}
                        >
                          {fmtDate(app.deadline)}
                        </span>
                        {daysToDeadline !== null && daysToDeadline >= 0 && (
                          <Badge
                            variant="outline"
                            className={`ml-1 px-1.5 py-0 text-[10px] ${
                              deadlineNear
                                ? "border-amber-300 text-amber-700"
                                : "border-[#2563EB]/20 text-[#2563EB]"
                            }`}
                          >
                            {daysToDeadline}d left
                          </Badge>
                        )}
                        {deadlinePassed && (
                          <Badge variant="outline" className="ml-1 border-red-300 px-1.5 py-0 text-[10px] text-red-700">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openUpdate(app)}
                        className="h-8 bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
                      >
                        <Icon name="GitCommitHorizontal" className="size-3.5" />
                        Update Stage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ===== Update Stage Dialog ===== */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2563EB]">Update application stage</DialogTitle>
            <DialogDescription>
              {updateTarget?.university} — <span className="font-mono">{updateTarget?.applicationId}</span>
            </DialogDescription>
          </DialogHeader>
          {updateTarget && (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#2563EB]/15 bg-[#e8f0fb]/40 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#2563EB]">Student</span>
                  <span>
                    {updateTarget.student?.fullName} ({updateTarget.student?.studentId})
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-semibold text-[#2563EB]">Course</span>
                  <span className="text-right">{updateTarget.course}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-semibold text-[#2563EB]">Current</span>
                  <span className="font-semibold text-foreground">
                    {STAGE_LABELS[updateTarget.stage] || updateTarget.stage}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#2563EB]">New stage</label>
                <Select value={newStage} onValueChange={setNewStage}>
                  <SelectTrigger className="h-10 w-full border-[#2563EB]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {APP_STAGES.map((s, i) => (
                      <SelectItem key={s} value={s}>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="ml-1">{STAGE_LABELS[s]}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <Icon name="History" className="size-3.5 shrink-0" />
                A timeline event &amp; audit log entry will be created for this change.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setUpdateOpen(false)}
              className="h-10"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={submitUpdate}
              disabled={saving || (updateTarget?.stage === newStage)}
              className="h-10 bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
            >
              {saving ? (
                <>
                  <Icon name="Loader2" className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="Save" className="size-4" />
                  Update stage
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default ApplicationsView;

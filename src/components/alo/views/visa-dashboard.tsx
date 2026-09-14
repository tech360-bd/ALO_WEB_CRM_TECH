"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Icon,
  StatCard,
  StatusBadge,
  SectionCard,
  EmptyState,
  LoadingGrid,
  InfoRow,
  MiniBar,
  PageHeader,
} from "@/components/alo/shared";
import { fmtDate, timeAgo } from "@/lib/alo-types";

// ---------- Types ----------
interface VisaStudent {
  id: string;
  studentId: string;
  fullName: string;
}
interface VisaCase {
  id: string;
  caseId: string;
  student: VisaStudent;
  country: string;
  university: string;
  course: string;
  intake: string | null;
  casStatus: string;
  visaStage: string;
  interviewStatus: string;
  interviewDate: string | null;
  docStatus: string;
  priority: string;
  deadline: string | null;
  aiReadinessScore: number | null;
  financialRisk: string | null;
  studyGapRisk: string | null;
  sponsorRisk: string | null;
  notes: string | null;
  updatedAt?: string;
}

// ---------- Maps ----------
const COUNTRY_FLAGS: Record<string, string> = {
  UK: "🇬🇧",
  USA: "🇺🇸",
  Canada: "🇨🇦",
  Australia: "🇦🇺",
  Germany: "🇩🇪",
  Ireland: "🇮🇪",
  Malaysia: "🇲🇾",
  "New Zealand": "🇳🇿",
  Finland: "🇫🇮",
  Sweden: "🇸🇪",
};

const VISA_STAGE_COLORS: Record<string, string> = {
  VISA_DOCUMENTS: "bg-amber-100 text-amber-700",
  VISA_SUBMITTED: "bg-blue-100 text-blue-700",
  VISA_DECISION_PENDING: "bg-blue-100 text-blue-700",
  VISA_APPROVED: "bg-emerald-100 text-emerald-700",
  VISA_REFUSED: "bg-red-100 text-red-700",
};

const VISA_STAGE_LABELS: Record<string, string> = {
  VISA_DOCUMENTS: "Visa Documents",
  VISA_SUBMITTED: "Visa Submitted",
  VISA_DECISION_PENDING: "Decision Pending",
  VISA_APPROVED: "Visa Approved",
  VISA_REFUSED: "Visa Refused",
};

const VISA_STAGES = [
  "VISA_DOCUMENTS",
  "VISA_SUBMITTED",
  "VISA_DECISION_PENDING",
  "VISA_APPROVED",
  "VISA_REFUSED",
];

const CAS_BADGE: Record<string, string> = {
  ISSUED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
};

const INTERVIEW_BADGE: Record<string, string> = {
  NOT_SCHEDULED: "bg-slate-100 text-slate-700",
  SCHEDULED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const INTERVIEW_LABEL: Record<string, string> = {
  NOT_SCHEDULED: "Not Scheduled",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
};

const DOC_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  UPLOADED: "bg-sky-100 text-sky-700",
  UNDER_REVIEW: "bg-violet-100 text-violet-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  NORMAL: "bg-blue-100 text-blue-700",
  LOW: "bg-slate-100 text-slate-700",
};

const RISK_COLORS: Record<string, string> = {
  HIGH: "#dc2626",
  MEDIUM: "#f59e0b",
  LOW: "#10b981",
};

function riskCount(cases: VisaCase[], field: "financialRisk" | "studyGapRisk" | "sponsorRisk", level: string) {
  return cases.filter((c) => (c as any)[field] === level).length;
}

function readinessColor(score: number | null) {
  if (score == null) return "text-slate-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function readinessBg(score: number | null) {
  if (score == null) return "bg-slate-100";
  if (score >= 80) return "bg-emerald-50";
  if (score >= 60) return "bg-amber-50";
  return "bg-red-50";
}

function isPast(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

function isToday(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isWithinDays(dateStr: string | null, days: number) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const diff = d.getTime() - Date.now();
  return diff >= 0 && diff <= days * 86400000;
}

// ---------- Component ----------
export function VisaDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [cases, setCases] = React.useState<VisaCase[]>([]);

  const [filterCountry, setFilterCountry] = React.useState("ALL");
  const [filterStage, setFilterStage] = React.useState("ALL");
  const [filterPriority, setFilterPriority] = React.useState("ALL");

  // Update stage dialog
  const [stageDialogCase, setStageDialogCase] = React.useState<VisaCase | null>(null);
  const [stageValue, setStageValue] = React.useState<string>("");
  const [savingStage, setSavingStage] = React.useState(false);

  // Details dialog
  const [detailsCase, setDetailsCase] = React.useState<VisaCase | null>(null);

  const loadCases = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/visa", { cache: "no-store" });
      const data = await res.json();
      setCases(data.visaCases || []);
    } catch (e) {
      toast({ title: "Failed to load visa cases", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadCases();
  }, [loadCases]);

  const filtered = React.useMemo(() => {
    return cases.filter((c) => {
      if (filterCountry !== "ALL" && c.country !== filterCountry) return false;
      if (filterStage !== "ALL" && c.visaStage !== filterStage) return false;
      if (filterPriority !== "ALL" && c.priority !== filterPriority) return false;
      return true;
    });
  }, [cases, filterCountry, filterStage, filterPriority]);

  const stats = React.useMemo(() => {
    return {
      total: cases.length,
      submitted: cases.filter((c) => c.visaStage === "VISA_SUBMITTED").length,
      pending: cases.filter((c) => c.visaStage === "VISA_DECISION_PENDING").length,
      approved: cases.filter((c) => c.visaStage === "VISA_APPROVED").length,
    };
  }, [cases]);

  const urgentCases = React.useMemo(() => {
    return cases
      .filter(
        (c) =>
          c.priority === "URGENT" ||
          (c.aiReadinessScore != null && c.aiReadinessScore < 60) ||
          (isWithinDays(c.deadline, 7) || isPast(c.deadline))
      )
      .sort((a, b) => {
        const order: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
        return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      });
  }, [cases]);

  const todayInterviews = React.useMemo(() => {
    return cases.filter((c) => c.interviewStatus === "SCHEDULED" && isToday(c.interviewDate));
  }, [cases]);

  const upcomingInterviews = React.useMemo(() => {
    return cases.filter(
      (c) => c.interviewStatus === "SCHEDULED" && !isToday(c.interviewDate) && isWithinDays(c.interviewDate, 7)
    );
  }, [cases]);

  const countries = React.useMemo(() => {
    const set = new Set(cases.map((c) => c.country).filter(Boolean));
    return Array.from(set).sort();
  }, [cases]);

  function openStageDialog(c: VisaCase) {
    setStageDialogCase(c);
    setStageValue(c.visaStage);
  }

  async function saveStage() {
    if (!stageDialogCase) return;
    if (stageValue === stageDialogCase.visaStage) {
      toast({ title: "No change", description: "Stage is already set to this value." });
      setStageDialogCase(null);
      return;
    }
    setSavingStage(true);
    try {
      const res = await fetch("/api/visa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: stageDialogCase.id, visaStage: stageValue, userId: "visa-officer-demo" }),
      });
      if (!res.ok) throw new Error("update failed");
      const data = await res.json();
      setCases((prev) =>
        prev.map((c) => (c.id === stageDialogCase.id ? { ...c, visaStage: data.visaCase.visaStage } : c))
      );
      toast({
        title: "Visa stage updated",
        description: `${stageDialogCase.caseId} → ${VISA_STAGE_LABELS[stageValue] || stageValue}`,
      });
      setStageDialogCase(null);
    } catch (e) {
      toast({ title: "Update failed", description: "Could not save visa stage.", variant: "destructive" });
    } finally {
      setSavingStage(false);
    }
  }

  function scheduleInterview(c: VisaCase) {
    toast({
      title: "Interview scheduling",
      description: `Calendar invite sent for ${c.caseId} (${c.student.fullName}). Confirm with student on WhatsApp.`,
    });
  }

  function riskCard(title: string, field: "financialRisk" | "studyGapRisk" | "sponsorRisk", icon: string, desc: string) {
    const high = riskCount(cases, field, "HIGH");
    const med = riskCount(cases, field, "MEDIUM");
    const low = riskCount(cases, field, "LOW");
    const total = high + med + low || 1;
    const max = Math.max(high, med, low, 1);
    return (
      <SectionCard title={title} icon={icon} description={desc}>
        <div className="space-y-3">
          {high > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-red-700">High Risk</span>
                <span className="font-bold text-red-700 tabular-nums">{high}</span>
              </div>
              <div className="mt-1.5">
                <MiniBar value={high} max={max} color="#dc2626" />
              </div>
            </div>
          )}
          <div className="space-y-2">
            {[
              { label: "High", value: high, color: RISK_COLORS.HIGH },
              { label: "Medium", value: med, color: RISK_COLORS.MEDIUM },
              { label: "Low", value: low, color: RISK_COLORS.LOW },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-14 text-xs font-medium text-muted-foreground">{r.label}</span>
                <div className="flex-1">
                  <MiniBar value={r.value} max={max} color={r.color} />
                </div>
                <span className="w-6 text-right text-xs font-bold tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {high > 0
              ? `${high} case${high > 1 ? "s" : ""} need urgent review.`
              : "No high-risk cases in this category."}
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visa Officer Dashboard"
        icon="Plane"
        subtitle="Visa cases, interview scheduling, and AI readiness scores."
        action={
          <Button
            onClick={() => loadCases()}
            variant="outline"
            className="h-10 border-[#0057B8]/20 text-[#0057B8]"
          >
            <Icon name="RefreshCw" className="size-4" />
            Refresh
          </Button>
        }
      />

      {loading ? (
        <LoadingGrid count={4} />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Visa Cases" value={stats.total} icon="Plane" accent="blue" hint="All active cases" />
            <StatCard label="Visa Submitted" value={stats.submitted} icon="Send" accent="orange" hint="Awaiting biometrics" />
            <StatCard label="Decision Pending" value={stats.pending} icon="Clock" accent="amber" hint="Under review by embassy" />
            <StatCard label="Visa Approved" value={stats.approved} icon="CheckCircle2" accent="emerald" hint="Ready for pre-departure" />
          </div>

          {/* Risk overview */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {riskCard("Financial Risk", "financialRisk", "Wallet", "Bank statement & funding verification")}
            {riskCard("Study Gap Risk", "studyGapRisk", "CalendarClock", "Gap year & academic continuity")}
            {riskCard("Sponsor Risk", "sponsorRisk", "Users", "Sponsor relation & documentation")}
          </div>

          {/* Urgent + Today interviews */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Urgent cases */}
            <div className="lg:col-span-2">
              <SectionCard
                title="Urgent Cases"
                icon="AlertTriangle"
                description="High priority, low readiness, or near deadlines"
              >
                {urgentCases.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <Icon name="CheckCircle2" className="size-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">All clear — no urgent cases</p>
                      <p className="text-xs text-emerald-700">Every case is on track.</p>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="max-h-72">
                    <div className="space-y-2 pr-2">
                      {urgentCases.slice(0, 8).map((c) => {
                        const past = isPast(c.deadline);
                        const soon = isWithinDays(c.deadline, 7);
                        const lowScore = c.aiReadinessScore != null && c.aiReadinessScore < 60;
                        return (
                          <div
                            key={c.id}
                            className={cn(
                              "flex flex-col gap-2 rounded-xl border-2 p-3 sm:flex-row sm:items-center sm:justify-between",
                              c.priority === "URGENT"
                                ? "border-red-200 bg-red-50"
                                : "border-amber-200 bg-amber-50"
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-foreground">{c.caseId}</span>
                                <Badge className={cn("border-0", PRIORITY_BADGE[c.priority] || PRIORITY_BADGE.NORMAL)}>
                                  {c.priority}
                                </Badge>
                                {lowScore && (
                                  <Badge className="border-0 bg-red-100 text-red-700">
                                    AI {c.aiReadinessScore}
                                  </Badge>
                                )}
                                {(past || soon) && (
                                  <Badge className={cn("border-0", past ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                                    {past ? "Overdue" : "Soon"}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 truncate text-sm font-medium text-foreground">
                                {c.student.fullName} · {COUNTRY_FLAGS[c.country] || "🌐"} {c.country}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {c.university} — {c.course}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {c.deadline && (
                                <span className={cn("text-xs font-medium", past ? "text-red-600" : "text-muted-foreground")}>
                                  Due {fmtDate(c.deadline)}
                                </span>
                              )}
                              <Button size="sm" variant="outline" onClick={() => setDetailsCase(c)} className="h-8">
                                View
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 bg-[#E8501A] hover:bg-[#E8501A]/90 text-white"
                                onClick={() => openStageDialog(c)}
                              >
                                Update
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </SectionCard>
            </div>

            {/* Today interviews */}
            <SectionCard title="Interview Schedule" icon="CalendarDays" description="Today and upcoming">
              {todayInterviews.length === 0 && upcomingInterviews.length === 0 ? (
                <EmptyState icon="CalendarOff" title="No interviews scheduled" description="No visa interviews in the next 7 days." />
              ) : (
                <div className="space-y-3">
                  {todayInterviews.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#E8501A]">Today</p>
                      <div className="space-y-2">
                        {todayInterviews.map((c) => (
                          <div key={c.id} className="rounded-xl border-2 border-[#E8501A]/30 bg-[#fdece4] p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-semibold text-[#E8501A]">{c.caseId}</span>
                              <span className="text-xs font-medium text-muted-foreground">
                                {c.interviewDate ? new Date(c.interviewDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-sm font-medium text-foreground">{c.student.fullName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {COUNTRY_FLAGS[c.country] || "🌐"} {c.country} · {c.university}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {upcomingInterviews.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Upcoming (7 days)</p>
                      <div className="space-y-2">
                        {upcomingInterviews.map((c) => (
                          <div key={c.id} className="flex items-center justify-between rounded-xl border border-[#0057B8]/15 bg-[#e8f0fb]/50 p-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{c.student.fullName}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {COUNTRY_FLAGS[c.country] || "🌐"} {c.country} · {fmtDate(c.interviewDate)}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 text-[#0057B8]" onClick={() => scheduleInterview(c)}>
                              <Icon name="MessageSquare" className="size-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Filters + Case queue */}
          <SectionCard
            title="Visa Case Queue"
            icon="ListChecks"
            description={`${filtered.length} of ${cases.length} cases`}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Select value={filterCountry} onValueChange={setFilterCountry}>
                  <SelectTrigger className="h-9 w-[140px] border-[#0057B8]/20 text-xs">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All countries</SelectItem>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {COUNTRY_FLAGS[c] || "🌐"} {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger className="h-9 w-[170px] border-[#0057B8]/20 text-xs">
                    <SelectValue placeholder="Visa stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All stages</SelectItem>
                    {VISA_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {VISA_STAGE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="h-9 w-[130px] border-[#0057B8]/20 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All priorities</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          >
            {filtered.length === 0 ? (
              <EmptyState
                icon="Plane"
                title="No visa cases match"
                description="Try adjusting filters or check back later."
                action={
                  <Button
                    variant="outline"
                    className="h-10 border-[#0057B8]/20 text-[#0057B8]"
                    onClick={() => {
                      setFilterCountry("ALL");
                      setFilterStage("ALL");
                      setFilterPriority("ALL");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#0057B8]/10">
                      <TableHead className="text-xs font-semibold text-[#0057B8]">Case</TableHead>
                      <TableHead className="text-xs font-semibold text-[#0057B8]">Student</TableHead>
                      <TableHead className="text-xs font-semibold text-[#0057B8]">Country</TableHead>
                      <TableHead className="text-xs font-semibold text-[#0057B8]">University / Course</TableHead>
                      <TableHead className="text-xs font-semibold text-[#0057B8]">Intake</TableHead>
                      <TableHead className="text-xs font-semibold text-[#0057B8]">CAS</TableHead>
                      <TableHead className="text-xs font-semibold text-[#0057B8]">Visa Stage</TableHead>
                      <TableHead className="text-xs font-semibold text-[#0057B8]">Interview</TableHead>
                      <TableHead className="text-xs font-semibold text-[#0057B8]">Docs</TableHead>
                      <TableHead className="text-xs font-semibold text-[#0057B8]">Priority</TableHead>
                      <TableHead className="text-xs font-semibold text-[#0057B8]">AI Ready</TableHead>
                      <TableHead className="text-xs font-semibold text-[#0057B8]">Deadline</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-[#0057B8]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => {
                      const past = isPast(c.deadline);
                      return (
                        <TableRow key={c.id} className="border-[#0057B8]/5">
                          <TableCell>
                            <span className="font-mono text-xs font-semibold text-foreground">{c.caseId}</span>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-[140px]">
                              <p className="truncate text-sm font-medium text-foreground">{c.student.fullName}</p>
                              <p className="font-mono text-[10px] text-muted-foreground">{c.student.studentId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {COUNTRY_FLAGS[c.country] || "🌐"} <span className="ml-1 align-middle">{c.country}</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-[180px]">
                              <p className="truncate text-sm font-medium text-foreground">{c.university}</p>
                              <p className="truncate text-xs text-muted-foreground">{c.course}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">{c.intake || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border-0", CAS_BADGE[c.casStatus] || "bg-slate-100 text-slate-700")}>
                              {c.casStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={c.visaStage} colorMap={VISA_STAGE_COLORS} labels={VISA_STAGE_LABELS} />
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border-0", INTERVIEW_BADGE[c.interviewStatus] || "bg-slate-100 text-slate-700")}>
                              {INTERVIEW_LABEL[c.interviewStatus] || c.interviewStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border-0", DOC_BADGE[c.docStatus] || "bg-slate-100 text-slate-700")}>
                              {c.docStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border-0", PRIORITY_BADGE[c.priority] || PRIORITY_BADGE.NORMAL)}>
                              {c.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums",
                                readinessBg(c.aiReadinessScore),
                                readinessColor(c.aiReadinessScore)
                              )}
                            >
                              {c.aiReadinessScore != null ? c.aiReadinessScore : "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn("text-xs font-medium", past ? "text-red-600" : "text-muted-foreground")}>
                              {fmtDate(c.deadline)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-[#0057B8]/20 text-[#0057B8] hover:bg-[#e8f0fb]"
                                onClick={() => openStageDialog(c)}
                              >
                                <Icon name="GitBranch" className="size-3.5" />
                                <span className="hidden xl:inline">Stage</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-[#0057B8]/20 text-[#0057B8] hover:bg-[#e8f0fb]"
                                onClick={() => scheduleInterview(c)}
                              >
                                <Icon name="CalendarPlus" className="size-3.5" />
                                <span className="hidden xl:inline">Interview</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-[#0057B8]"
                                onClick={() => setDetailsCase(c)}
                              >
                                <Icon name="Eye" className="size-3.5" />
                                <span className="hidden xl:inline">View</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </>
      )}

      {/* Update Stage Dialog */}
      <Dialog open={!!stageDialogCase} onOpenChange={(o) => !o && setStageDialogCase(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0057B8]">Update Visa Stage</DialogTitle>
            <DialogDescription>
              {stageDialogCase && (
                <>
                  Case <span className="font-mono font-semibold text-foreground">{stageDialogCase.caseId}</span> — {stageDialogCase.student.fullName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl bg-[#e8f0fb]/60 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current stage</span>
                <StatusBadge
                  status={stageDialogCase?.visaStage || ""}
                  colorMap={VISA_STAGE_COLORS}
                  labels={VISA_STAGE_LABELS}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">New visa stage</label>
              <Select value={stageValue} onValueChange={setStageValue}>
                <SelectTrigger className="h-11 w-full border-[#0057B8]/20">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {VISA_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {VISA_STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setStageDialogCase(null)} disabled={savingStage}>
              Cancel
            </Button>
            <Button
              className="h-10 bg-[#E8501A] hover:bg-[#E8501A]/90 text-white"
              onClick={saveStage}
              disabled={savingStage || !stageValue}
            >
              {savingStage ? (
                <>
                  <Icon name="Loader2" className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="Check" className="size-4" />
                  Save Stage
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!detailsCase} onOpenChange={(o) => !o && setDetailsCase(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0057B8]">Visa Case Details</DialogTitle>
            <DialogDescription>
              {detailsCase && (
                <>
                  <span className="font-mono font-semibold text-foreground">{detailsCase.caseId}</span> · last updated {detailsCase.updatedAt ? timeAgo(detailsCase.updatedAt) : "—"}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {detailsCase && (
            <ScrollArea className="max-h-[60vh] pr-2">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <InfoRow label="Student" value={detailsCase.student.fullName} />
                  <InfoRow label="Student ID" value={detailsCase.student.studentId} mono />
                  <InfoRow label="Country" value={`${COUNTRY_FLAGS[detailsCase.country] || "🌐"} ${detailsCase.country}`} />
                  <InfoRow label="Intake" value={detailsCase.intake || "—"} />
                  <InfoRow label="University" value={detailsCase.university} />
                  <InfoRow label="Course" value={detailsCase.course} />
                  <InfoRow
                    label="Deadline"
                    value={
                      <span className={cn(isPast(detailsCase.deadline) && "font-semibold text-red-600")}>
                        {fmtDate(detailsCase.deadline)}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Interview Date"
                    value={detailsCase.interviewDate ? fmtDate(detailsCase.interviewDate) : "—"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border-2 border-[#0057B8]/15 bg-[#e8f0fb]/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CAS</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{detailsCase.casStatus}</p>
                  </div>
                  <div className="rounded-xl border-2 border-[#0057B8]/15 bg-[#e8f0fb]/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Visa Stage</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{VISA_STAGE_LABELS[detailsCase.visaStage] || detailsCase.visaStage}</p>
                  </div>
                  <div className="rounded-xl border-2 border-[#0057B8]/15 bg-[#e8f0fb]/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Interview</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{INTERVIEW_LABEL[detailsCase.interviewStatus] || detailsCase.interviewStatus}</p>
                  </div>
                  <div className="rounded-xl border-2 border-[#0057B8]/15 bg-[#e8f0fb]/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Docs</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{detailsCase.docStatus}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Risk Assessment</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Financial", value: detailsCase.financialRisk },
                      { label: "Study Gap", value: detailsCase.studyGapRisk },
                      { label: "Sponsor", value: detailsCase.sponsorRisk },
                    ].map((r) => (
                      <div
                        key={r.label}
                        className={cn(
                          "rounded-lg border p-2 text-center",
                          r.value === "HIGH"
                            ? "border-red-200 bg-red-50"
                            : r.value === "MEDIUM"
                            ? "border-amber-200 bg-amber-50"
                            : "border-emerald-200 bg-emerald-50"
                        )}
                      >
                        <p className="text-[10px] font-medium text-muted-foreground">{r.label}</p>
                        <p
                          className={cn(
                            "mt-0.5 text-sm font-bold",
                            r.value === "HIGH" ? "text-red-700" : r.value === "MEDIUM" ? "text-amber-700" : "text-emerald-700"
                          )}
                        >
                          {r.value || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border-2 border-[#0057B8]/15 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Readiness Score</p>
                    <span className={cn("text-lg font-bold tabular-nums", readinessColor(detailsCase.aiReadinessScore))}>
                      {detailsCase.aiReadinessScore != null ? `${detailsCase.aiReadinessScore}/100` : "Not scored"}
                    </span>
                  </div>
                  {detailsCase.aiReadinessScore != null && (
                    <div className="mt-2">
                      <MiniBar
                        value={detailsCase.aiReadinessScore}
                        max={100}
                        color={
                          detailsCase.aiReadinessScore >= 80
                            ? "#10b981"
                            : detailsCase.aiReadinessScore >= 60
                            ? "#f59e0b"
                            : "#dc2626"
                        }
                      />
                    </div>
                  )}
                </div>

                {detailsCase.notes && (
                  <div className="rounded-xl border-2 border-[#0057B8]/15 bg-[#f7f9fc] p-3">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Officer Notes</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{detailsCase.notes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="h-10 border-[#0057B8]/20 text-[#0057B8]"
              onClick={() => detailsCase && scheduleInterview(detailsCase)}
            >
              <Icon name="CalendarPlus" className="size-4" />
              Schedule Interview
            </Button>
            <Button
              className="h-10 bg-[#E8501A] hover:bg-[#E8501A]/90 text-white"
              onClick={() => {
                if (detailsCase) {
                  setStageDialogCase(detailsCase);
                  setStageValue(detailsCase.visaStage);
                  setDetailsCase(null);
                }
              }}
            >
              <Icon name="GitBranch" className="size-4" />
              Update Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default VisaDashboard;

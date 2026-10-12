"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Icon,
  StatCard,
  StatusBadge,
  SectionCard,
  EmptyState,
  LoadingGrid,
  CompletionRing,
  MiniBar,
  Progress,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";
import {
  APP_STAGES,
  STAGE_COLORS,
  STAGE_LABELS,
  type ViewKey,
  timeAgo,
} from "@/lib/alo-types";

// ---------- Types ----------
interface StudentLite {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  mobile: string;
  nationality: string;
  profileCompletion: number;
  counselorId?: string | null;
  counselor?: { id: string; name: string; email: string; role: string } | null;
}

interface ApplicationRow {
  id: string;
  applicationId: string;
  university: string;
  course: string;
  country: string;
  intake: string;
  studyLevel: string;
  stage: string;
  priority: string;
}

interface DocumentRow {
  id: string;
  category: string;
  name: string;
  status: string;
}

interface InterviewRow {
  id: string;
  sessionId: string;
  type: string;
  status: string;
  readiness: string | null;
  riskLevel: string | null;
  scores: string | null;
  feedback: string | null;
  completedAt: string | null;
}

interface MockTestRow {
  id: string;
  testId: string;
  testType: string;
  isFree: boolean;
  status: string;
  overallScore: number | null;
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  completedAt: string | null;
}

interface TimelineEventRow {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  createdAt: string;
  user?: { name: string } | null;
}

interface StudentFull extends StudentLite {
  applications?: ApplicationRow[];
  documents?: DocumentRow[];
  interviews?: InterviewRow[];
  mockTests?: MockTestRow[];
  timelineEvents?: TimelineEventRow[];
  englishTests?: string;
}

// ---------- Quick action button ----------
function QuickAction({
  icon,
  label,
  onClick,
  accent = "blue",
}: {
  icon: string;
  label: string;
  onClick: () => void;
  accent?: "blue" | "orange" | "violet" | "emerald" | "amber";
}) {
  const accentMap: Record<string, string> = {
    blue: "bg-[#e8f0fb] text-[#0057B8] group-hover:bg-[#0057B8] group-hover:text-white",
    orange: "bg-[#fdece4] text-[#E8501A] group-hover:bg-[#E8501A] group-hover:text-white",
    violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
  };
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-2 rounded-xl border border-[#0057B8]/15 bg-white p-3 text-left transition-all hover:border-[#0057B8]/40 hover:shadow-sm"
    >
      <div className={`flex size-9 items-center justify-center rounded-lg transition-colors ${accentMap[accent]}`}>
        <Icon name={icon} className="size-4" />
      </div>
      <span className="text-xs font-semibold leading-tight text-foreground">{label}</span>
    </button>
  );
}

// ---------- Timeline item ----------
function TimelineItem({ ev }: { ev: TimelineEventRow }) {
  const iconMap: Record<string, { icon: string; color: string }> = {
    PROFILE_UPDATED: { icon: "UserCog", color: "bg-[#0057B8] text-white" },
    DOC_UPLOADED: { icon: "Upload", color: "bg-sky-500 text-white" },
    DOC_APPROVED: { icon: "CheckCircle2", color: "bg-emerald-500 text-white" },
    APP_STATUS_CHANGED: { icon: "ClipboardList", color: "bg-violet-500 text-white" },
    VISA_STATUS_CHANGED: { icon: "Plane", color: "bg-orange-500 text-white" },
    INTERVIEW_COMPLETED: { icon: "Mic", color: "bg-rose-500 text-white" },
    MOCK_TEST_DONE: { icon: "GraduationCap", color: "bg-amber-500 text-white" },
    AI_ACTION: { icon: "Bot", color: "bg-indigo-500 text-white" },
    MESSAGE_SENT: { icon: "MessageSquare", color: "bg-teal-500 text-white" },
    PAYMENT: { icon: "CreditCard", color: "bg-emerald-600 text-white" },
    NOTE: { icon: "StickyNote", color: "bg-slate-500 text-white" },
    LEAD_CREATED: { icon: "UserPlus", color: "bg-[#0057B8] text-white" },
  };
  const cfg = iconMap[ev.type] || { icon: "Activity", color: "bg-[#0057B8] text-white" };
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
          <Icon name={cfg.icon} className="size-3.5" />
        </div>
        <div className="w-px flex-1 bg-[#0057B8]/15" />
      </div>
      <div className="min-w-0 flex-1 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{ev.title}</p>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{timeAgo(ev.createdAt)}</span>
        </div>
        {ev.description && <p className="mt-0.5 text-xs text-muted-foreground">{ev.description}</p>}
        {ev.user && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            by <span className="font-medium text-foreground/80">{ev.user.name}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ---------- Readiness helper ----------
function readinessColor(r?: string | null) {
  if (!r) return "bg-slate-100 text-slate-700";
  if (r === "ready") return "bg-emerald-100 text-emerald-700";
  if (r === "needs_practice") return "bg-amber-100 text-amber-700";
  if (r === "high_risk") return "bg-red-100 text-red-700";
  return "bg-indigo-100 text-indigo-700";
}
function readinessLabel(r?: string | null) {
  if (!r) return "Pending";
  if (r === "ready") return "Ready";
  if (r === "needs_practice") return "Needs Practice";
  if (r === "high_risk") return "High Risk";
  if (r === "human_review_required") return "Review Required";
  return r.replace(/_/g, " ");
}

// ---------- Main Dashboard ----------
export function StudentDashboard({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const { toast } = useToast();
  const [lite, setLite] = React.useState<StudentLite | null>(null);
  const [student, setStudent] = React.useState<StudentFull | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 1) Fetch list, pick first
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/students", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load students");
        const data = await res.json();
        if (!alive) return;
        const first = (data.students?.[0] as StudentLite) || null;
        setLite(first);
        if (!first) {
          setLoading(false);
          return;
        }
        // 2) Fetch full detail
        const full = await fetch(`/api/students?id=${encodeURIComponent(first.id)}`, { cache: "no-store" });
        if (!full.ok) throw new Error("Failed to load student detail");
        const fullData = await full.json();
        if (!alive) return;
        setStudent(fullData.student as StudentFull);
      } catch (e: any) {
        if (alive) setError(e?.message || "Unknown error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingGrid count={4} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <LoadingGrid count={2} />
          </div>
          <div className="space-y-6">
            <LoadingGrid count={2} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !lite) {
    return (
      <EmptyState
        icon="UserX"
        title="No student profile found"
        description={error || "Once your counselor creates your student record, your mission-control dashboard will appear here."}
        action={
          <Button
            className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-11"
            onClick={() => onNavigate("student-profile")}
          >
            <Icon name="ArrowRight" className="size-4" />
            Go to Profile Form
          </Button>
        }
      />
    );
  }

  const s = student || lite;
  const completion = s.profileCompletion ?? 0;
  const apps = (s as StudentFull).applications || [];
  const docs = (s as StudentFull).documents || [];
  const interviews = (s as StudentFull).interviews || [];
  const mockTests = ((s as StudentFull).mockTests || []).filter((m) => m.status === "COMPLETED");
  const timeline = (s as StudentFull).timelineEvents || [];
  const pendingDocs = docs.filter((d) => d.status === "PENDING");
  const freeMockRemaining = Math.max(0, 3 - mockTests.filter((m) => m.isFree).length);

  const latestInterview = interviews[0];
  let latestScore: number | null = null;
  let scoreBreakdown: { label: string; value: number; max: number }[] = [];
  let scoreType = "";
  const completedMock = mockTests.find((m) => m.status === "COMPLETED" && m.overallScore != null);
  if (completedMock) {
    latestScore = completedMock.overallScore;
    scoreType = completedMock.testType;
    scoreBreakdown = [
      { label: "Listening", value: completedMock.listeningScore || 0, max: 9 },
      { label: "Reading", value: completedMock.readingScore || 0, max: 9 },
      { label: "Writing", value: completedMock.writingScore || 0, max: 9 },
      { label: "Speaking", value: completedMock.speakingScore || 0, max: 9 },
    ];
  } else {
    // Try englishTests JSON
    try {
      const et = JSON.parse((s as StudentFull).englishTests || "[]");
      if (Array.isArray(et) && et.length > 0) {
        const t = et[0];
        latestScore = t.overallScore ? parseFloat(t.overallScore) : null;
        scoreType = t.testName || "English Test";
        scoreBreakdown = [
          { label: "Listening", value: parseFloat(t.listening) || 0, max: 9 },
          { label: "Reading", value: parseFloat(t.reading) || 0, max: 9 },
          { label: "Writing", value: parseFloat(t.writing) || 0, max: 9 },
          { label: "Speaking", value: parseFloat(t.speaking) || 0, max: 9 },
        ];
      }
    } catch {
      /* noop */
    }
  }

  const counselName = (s as StudentFull).counselor?.name || "Farhana Yesmin";

  const quickActions: { icon: string; label: string; view: ViewKey; accent: "blue" | "orange" | "violet" | "emerald" | "amber" }[] = [
    { icon: "UserSquare", label: "Complete Profile", view: "student-profile", accent: "blue" },
    { icon: "FolderLock", label: "Upload Documents", view: "document-hub", accent: "orange" },
    { icon: "Mic", label: "Practice Interview", view: "ai-interview", accent: "violet" },
    { icon: "GraduationCap", label: "Take Mock Test", view: "english-test", accent: "emerald" },
    { icon: "ClipboardList", label: "View Applications", view: "applications", accent: "amber" },
    { icon: "Bot", label: "AI Assistant", view: "ai-command", accent: "blue" },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#0057B8]/15 bg-white p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 size-44 rounded-full bg-[#e8f0fb]/70 blur-2xl" aria-hidden />
          <div className="absolute right-24 top-8 size-24 rounded-full bg-[#fdece4]/70 blur-xl" aria-hidden />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-alo-gradient text-lg font-black text-white alo-shadow">
                {s.firstName?.[0]?.toUpperCase() || "S"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#E8501A]">Student Portal</p>
                <h1 className="mt-0.5 text-2xl font-bold text-[#0057B8] sm:text-3xl">
                  Welcome back, {s.firstName}!
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-[#0057B8]/30 bg-[#e8f0fb] font-mono text-xs font-semibold text-[#0057B8]">
                    <Icon name="Hash" className="size-3" />
                    {s.studentId}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Last active {timeAgo(new Date().toISOString())}
                  </span>
                </div>
                <div className="mt-3">
                  <Button
                    className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-10"
                    onClick={() => onNavigate("student-profile")}
                  >
                    <Icon name="UserSquare" className="size-4" />
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-4 self-stretch sm:self-auto">
              <CompletionRing value={completion} size={84} label="Profile" />
            </div>
          </div>
        </div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Profile Completion"
            value={`${completion}%`}
            icon="UserCheck"
            accent="blue"
            hint={`${completion >= 80 ? "Excellent" : completion >= 50 ? "Good progress" : "Needs work"}`}
            trend={completion >= 60 ? "+12% this week" : undefined}
          />
          <StatCard
            label="Applications"
            value={apps.length}
            icon="ClipboardList"
            accent="orange"
            hint={`${apps.length === 1 ? "1 active" : `${apps.length} active`}`}
          />
          <StatCard
            label="Documents Pending"
            value={pendingDocs.length}
            icon="FileWarning"
            accent="amber"
            hint={pendingDocs.length === 0 ? "All submitted" : "Action needed"}
          />
          <StatCard
            label="Free Mock Remaining"
            value={`${freeMockRemaining}/3`}
            icon="GraduationCap"
            accent="violet"
            hint="Use before expiry"
          />
        </div>

        {/* Recommended action banner */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#E8501A]/30 bg-gradient-to-r from-[#fdece4] via-[#fef5f0] to-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8501A] text-white shadow-md">
                <Icon name="Sparkles" className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-[#E8501A]">AI Recommended Next Action</p>
                <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">
                  Complete your bank statement upload to unblock your visa documents stage.
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Your counselor flagged this as the highest-impact task this week.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                className="border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb] h-11"
                onClick={() => onNavigate("document-hub")}
              >
                <Icon name="Upload" className="size-4" />
                Upload Now
              </Button>
              <Button
                className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-11"
                onClick={() => toast({ title: "Reminder snoozed", description: "We'll remind you tomorrow morning." })}
              >
                <Icon name="BellOff" className="size-4" />
                Snooze
              </Button>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT: applications + timeline */}
          <div className="space-y-6 lg:col-span-2">
            {/* Application progress */}
            <SectionCard
              title="Application Progress"
              description={`${apps.length} ${apps.length === 1 ? "application" : "applications"} in progress`}
              icon="ClipboardList"
              action={
                <Button variant="ghost" size="sm" className="text-[#0057B8] hover:bg-[#e8f0fb]" onClick={() => onNavigate("applications")}>
                  View all
                  <Icon name="ArrowRight" className="size-4" />
                </Button>
              }
            >
              {apps.length === 0 ? (
                <EmptyState
                  icon="ClipboardList"
                  title="No applications yet"
                  description="Your counselor will create applications once your profile is complete."
                />
              ) : (
                <div className="space-y-4">
                  {apps.slice(0, 4).map((app) => {
                    const stageIdx = Math.max(0, APP_STAGES.indexOf(app.stage));
                    const pct = Math.round(((stageIdx + 1) / APP_STAGES.length) * 100);
                    return (
                      <div
                        key={app.id}
                        className="rounded-xl border border-[#0057B8]/12 bg-gradient-to-br from-white to-[#f7f9fc] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold text-foreground">{app.university}</p>
                              <Badge variant="outline" className="border-[#0057B8]/20 text-[10px] text-muted-foreground">
                                {app.country}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {app.course} · {app.studyLevel} · {app.intake}
                            </p>
                          </div>
                          <StatusBadge status={app.stage} colorMap={STAGE_COLORS} labels={STAGE_LABELS} />
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <Progress value={pct} className="h-2 flex-1 bg-muted" />
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-[#0057B8]">
                            {stageIdx + 1}/{APP_STAGES.length}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                          <span className="font-mono">{app.applicationId}</span>
                          <span>·</span>
                          <span>Stage {stageIdx + 1} of 20</span>
                          <span>·</span>
                          <span className="capitalize">{app.priority.toLowerCase()} priority</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Timeline */}
            <SectionCard
              title="Recent Activity"
              description="Your latest journey events"
              icon="Activity"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#0057B8] hover:bg-[#e8f0fb]"
                  onClick={() => toast({ title: "Timeline refreshed", description: "Showing latest 20 events." })}
                >
                  <Icon name="RefreshCw" className="size-4" />
                  Refresh
                </Button>
              }
            >
              {timeline.length === 0 ? (
                <EmptyState icon="Activity" title="No activity yet" description="Your actions will appear here as you progress." />
              ) : (
                <div className="max-h-96 overflow-y-auto alo-scroll pr-1">
                  <div className="space-y-1">
                    {timeline.slice(0, 20).map((ev) => (
                      <TimelineItem key={ev.id} ev={ev} />
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* RIGHT: quick actions + counselor + AI readiness + latest score */}
          <div className="space-y-6">
            {/* Quick actions */}
            <SectionCard title="Quick Actions" description="Jump to what matters" icon="Zap">
              <div className="grid grid-cols-2 gap-2.5">
                {quickActions.map((qa) => (
                  <QuickAction
                    key={qa.label}
                    icon={qa.icon}
                    label={qa.label}
                    accent={qa.accent}
                    onClick={() => onNavigate(qa.view)}
                  />
                ))}
              </div>
            </SectionCard>

            {/* Counselor card */}
            <SectionCard title="Your Counselor" icon="Headset">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-alo-gradient text-base font-bold text-white">
                  {counselName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{counselName}</p>
                  <p className="text-xs text-muted-foreground">Senior Education Counselor</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-medium text-emerald-600">Online · responds in ~2h</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb] h-10"
                  onClick={() => toast({ title: "Message sent", description: `Your counselor ${counselName} will reply shortly.` })}
                >
                  <Icon name="MessageSquare" className="size-4" />
                  Message
                </Button>
                <Button
                  variant="outline"
                  className="border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb] h-10"
                  onClick={() => toast({ title: "Call scheduled", description: "A 15-min slot has been added to your calendar." })}
                >
                  <Icon name="PhoneCall" className="size-4" />
                  Book Call
                </Button>
              </div>
            </SectionCard>

            {/* AI Interview readiness */}
            <SectionCard title="AI Interview Readiness" icon="BrainCircuit">
              {latestInterview ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold tabular-nums text-[#0057B8]">
                        {(() => {
                          try {
                            const sc = latestInterview.scores ? JSON.parse(latestInterview.scores) : null;
                            return sc?.overallReadiness ?? "—";
                          } catch {
                            return "—";
                          }
                        })()}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {latestInterview.type.replace(/_/g, " ").toLowerCase()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${readinessColor(latestInterview.readiness)}`}>
                      {readinessLabel(latestInterview.readiness)}
                    </span>
                  </div>
                  {latestInterview.feedback && (
                    <div className="rounded-lg bg-[#e8f0fb]/60 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0057B8]">AI Feedback</p>
                      <p className="mt-1 text-xs text-foreground/80">{latestInterview.feedback}</p>
                    </div>
                  )}
                  <Button
                    className="w-full bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-10"
                    onClick={() => onNavigate("ai-interview")}
                  >
                    <Icon name="Mic" className="size-4" />
                    Practice Again
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                    <Icon name="MicOff" className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Not started yet</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Practice with our AI interviewer to estimate your readiness score.
                    </p>
                  </div>
                  <Button
                    className="w-full bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-10"
                    onClick={() => onNavigate("ai-interview")}
                  >
                    <Icon name="Sparkles" className="size-4" />
                    Practice Now
                  </Button>
                </div>
              )}
            </SectionCard>

            {/* Latest English score */}
            <SectionCard title="Latest English Score" icon="GraduationCap">
              {latestScore != null ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold tabular-nums text-[#0057B8]">
                        {Number.isInteger(latestScore) ? latestScore.toFixed(1) : latestScore}
                      </p>
                      <p className="text-xs text-muted-foreground">Overall · {scoreType}</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="flex size-7 items-center justify-center rounded-full bg-[#e8f0fb] text-[#0057B8]">
                          <Icon name="Info" className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Score breakdown by section (out of 9)</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2">
                    {scoreBreakdown.map((b) => (
                      <div key={b.label} className="flex items-center gap-3">
                        <span className="w-16 shrink-0 text-[11px] font-medium text-muted-foreground">{b.label}</span>
                        <MiniBar value={b.value} max={b.max} color="#0057B8" />
                        <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
                          {b.value.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb] h-10"
                    onClick={() => onNavigate("english-test")}
                  >
                    <Icon name="Plus" className="size-4" />
                    Take New Mock Test
                  </Button>
                </div>
              ) : (
                <EmptyState
                  icon="GraduationCap"
                  title="No English score yet"
                  description="Take a free mock test to estimate your IELTS/PTE band score."
                  action={
                    <Button
                      className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-10"
                      onClick={() => onNavigate("english-test")}
                    >
                      <Icon name="Sparkles" className="size-4" />
                      Take Free Mock
                    </Button>
                  }
                />
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

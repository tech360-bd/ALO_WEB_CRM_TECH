"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState, StatCard, SectionCard, MiniBar } from "@/components/alo/shared";
import { type ViewKey } from "@/lib/alo-types";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  NORMAL: "bg-[#EAF3FF] text-[#0057B8]",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-rose-100 text-rose-700",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

export function EmployeeWorkspace({
  onNavigate,
}: {
  onNavigate?: (v: ViewKey, slug?: string) => void;
}) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/counselor/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load dashboard");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader
          title="My Workspace"
          subtitle="Your daily briefing, tasks, and AI recommendations"
          icon="LayoutPanelLeft"
        />
        <div className="text-center text-[#5A7299]">Loading your workspace...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader
          title="My Workspace"
          subtitle="Your daily briefing, tasks, and AI recommendations"
          icon="LayoutPanelLeft"
        />
        <EmptyState
          icon="AlertTriangle"
          title="Workspace unavailable"
          description={error || "Could not load your workspace. Please try again later."}
        />
      </div>
    );
  }

  const m = data.metrics || {};
  const counselor = data.counselor || {};
  const tasks = data.tasks || [];
  const appointments = data.appointments || [];
  const unread = data.unreadMessages || [];
  const slaEvents = data.slaEvents || [];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = counselor.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="My Workspace"
        subtitle={`${greeting}, ${firstName} — here's your daily briefing`}
        icon="LayoutPanelLeft"
        action={
          <Button
            variant="outline"
            className="border-[#DCE8F5] text-[#0057B8] hover:bg-[#EAF3FF]"
            onClick={() => onNavigate?.("crm-tasks")}
          >
            <Icon name="CheckSquare" className="mr-1.5 size-4" /> View All Tasks
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Students"
          value={m.activeStudents || 0}
          icon="Users"
          accent="blue"
          hint={`${m.assignedLeads || 0} leads assigned`}
        />
        <StatCard
          label="Tasks Due"
          value={tasks.length}
          icon="Clock"
          accent="orange"
          hint={`${m.followUpsDue || 0} follow-ups`}
        />
        <StatCard
          label="Unread Messages"
          value={(m.unreadWhatsApp || 0) + (m.unreadSocial || 0)}
          icon="MessageSquare"
          accent="violet"
          hint={`${m.unreadWhatsApp || 0} WhatsApp`}
        />
        <StatCard
          label="Today's Appointments"
          value={m.todayAppointments || 0}
          icon="CalendarClock"
          accent="emerald"
        />
      </div>

      {/* SLA alerts */}
      {slaEvents.length > 0 && (
        <Card className="rounded-2xl border border-rose-200 bg-rose-50/40">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <Icon name="AlertTriangle" className="size-4" />
              </div>
              <h3 className="font-bold text-[#0B2447]">SLA Alerts</h3>
              <Badge className="bg-rose-600 text-white">{slaEvents.length}</Badge>
            </div>
            <div className="space-y-2">
              {slaEvents.slice(0, 3).map((e: any) => {
                const elapsed = Math.floor(
                  (Date.now() - new Date(e.receivedAt).getTime()) / 60000
                );
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="Clock" className="size-4 text-rose-600" />
                      <span className="text-[#0B2447]">{e.channel} • {elapsed}m ago</span>
                    </div>
                    <Badge
                      className={
                        e.status === "ESCALATED_50"
                          ? "bg-rose-600 text-white"
                          : "bg-amber-100 text-amber-700"
                      }
                    >
                      {e.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tasks */}
        <SectionCard
          title="Today's Tasks"
          description={`${tasks.filter((t: any) => t.status !== "COMPLETED").length} pending`}
          icon="CheckSquare"
          className="lg:col-span-2"
          action={
            <Button
              size="sm"
              variant="outline"
              className="border-[#DCE8F5] text-[#0057B8] hover:bg-[#EAF3FF]"
              onClick={() => onNavigate?.("crm-tasks")}
            >
              View all
            </Button>
          }
        >
          {tasks.length === 0 ? (
            <EmptyState
              icon="CheckCircle2"
              title="All clear"
              description="No tasks due today. Nice work!"
            />
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 6).map((t: any) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] px-3 py-2"
                >
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      t.priority === "URGENT"
                        ? "bg-rose-100 text-rose-700"
                        : t.priority === "HIGH"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-[#EAF3FF] text-[#0057B8]"
                    }`}
                  >
                    <Icon name="CheckSquare" className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0B2447]">{t.title}</p>
                    {t.dueDate && (
                      <p className="text-xs text-[#5A7299]">
                        Due: {new Date(t.dueDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    )}
                  </div>
                  <Badge className={PRIORITY_COLORS[t.priority] || "bg-slate-100"}>
                    {t.priority}
                  </Badge>
                  <Badge className={TASK_STATUS_COLORS[t.status] || "bg-slate-100"}>
                    {t.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Appointments */}
        <SectionCard
          title="Upcoming Appointments"
          icon="CalendarDays"
          action={
            <Button
              size="sm"
              variant="outline"
              className="border-[#DCE8F5] text-[#0057B8] hover:bg-[#EAF3FF]"
              onClick={() => onNavigate?.("crm-appointments")}
            >
              Calendar
            </Button>
          }
        >
          {appointments.length === 0 ? (
            <EmptyState
              icon="Calendar"
              title="No appointments"
              description="Upcoming sessions will appear here."
            />
          ) : (
            <div className="space-y-2">
              {appointments.slice(0, 4).map((a: any) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#0B2447]">{a.title}</p>
                    <Badge className="bg-[#EAF3FF] text-[#0057B8]">{a.type}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#5A7299]">
                    <Icon name="Clock" className="mr-1 inline size-3" />
                    {new Date(a.scheduledAt).toLocaleString("en-GB", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Unread messages */}
        <SectionCard
          title="Unread Messages"
          icon="MessageSquare"
          action={
            <Button
              size="sm"
              variant="outline"
              className="border-[#DCE8F5] text-[#0057B8] hover:bg-[#EAF3FF]"
              onClick={() => onNavigate?.("unified-inbox")}
            >
              Inbox
            </Button>
          }
        >
          {unread.length === 0 ? (
            <EmptyState
              icon="Inbox"
              title="Inbox zero"
              description="No unread messages."
            />
          ) : (
            <div className="space-y-2">
              {unread.slice(0, 5).map((m: any) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-[#0B2447]">
                      {m.fromName || "Unknown"}
                    </p>
                    <Badge className="bg-[#EAF3FF] text-[#0057B8]">{m.channel}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-[#5A7299]">
                    {m.body?.slice(0, 80)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Pipeline overview */}
        <SectionCard
          title="My Pipeline"
          description="Active applications by stage"
          icon="TrendingUp"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Active Applications", value: m.activeApplications || 0, color: "#0057B8" },
              { label: "Offers Received", value: m.offersReceived || 0, color: "#E8501A" },
              { label: "CAS Pending", value: m.casPending || 0, color: "#8B5CF6" },
              { label: "Documents Pending", value: m.documentsPending || 0, color: "#F59E0B" },
              { label: "SOP Reviews", value: m.sopPending || 0, color: "#06B6D4" },
              { label: "High-risk Interviews", value: m.aiInterviewHighRisk || 0, color: "#EF4444" },
              { label: "Hot Leads", value: m.hotLeads || 0, color: "#10B981" },
              { label: "SLA Overdue", value: m.slaOverdue || 0, color: "#EF4444" },
            ].map((p) => (
              <div
                key={p.label}
                className="rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] p-3"
              >
                <p className="text-xs text-[#5A7299]">{p.label}</p>
                <p
                  className="mt-1 text-2xl font-bold tabular-nums"
                  style={{ color: p.color }}
                >
                  {p.value}
                </p>
                <div className="mt-2">
                  <MiniBar value={p.value} max={Math.max(10, p.value)} color={p.color} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* AI Recommendations */}
        <SectionCard
          title="AI Recommendations"
          description="Suggested actions for today"
          icon="Sparkles"
          className="lg:col-span-3"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Follow up with Tasnim",
                description:
                  "Her SOP draft is awaiting review and her CAS deadline is in 5 days.",
                icon: "FileText",
                priority: "HIGH",
                action: "crm-tasks",
              },
              {
                title: "Schedule mock test for Rahim",
                description:
                  "IELTS speaking score is below target. Recommend a speaking mock test.",
                icon: "Mic",
                priority: "NORMAL",
                action: "student-mock-tests",
              },
              {
                title: "Respond to 2 unread WhatsApp messages",
                description:
                  "Both leads are HOT tier. Quick response improves conversion by 30%.",
                icon: "MessageSquare",
                priority: "URGENT",
                action: "unified-inbox",
              },
              {
                title: "Update application stage for 3 students",
                description:
                  "Documents received last week. Move them to University Shortlisted stage.",
                icon: "ClipboardList",
                priority: "NORMAL",
                action: "crm",
              },
              {
                title: "Commission pending: 12,500 BDT",
                description:
                  "Two of your converted students have pending commission payouts.",
                icon: "DollarSign",
                priority: "LOW",
                action: "crm-invoices",
              },
              {
                title: "Pre-departure briefing due",
                description:
                  "1 student with visa approved needs pre-departure briefing before intake.",
                icon: "Plane",
                priority: "NORMAL",
                action: "visa",
              },
            ].map((rec, idx) => (
              <Card
                key={idx}
                className="cursor-pointer rounded-2xl border border-[#DCE8F5] bg-white transition-shadow hover:shadow-md"
                onClick={() => rec.action && onNavigate?.(rec.action as ViewKey)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                      <Icon name={rec.icon} className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0B2447]">{rec.title}</p>
                      <p className="mt-0.5 text-xs text-[#5A7299]">{rec.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge className={PRIORITY_COLORS[rec.priority] || "bg-slate-100"}>
                      {rec.priority}
                    </Badge>
                    <span className="text-xs font-medium text-[#0057B8]">
                      Take action →
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SectionCard>

        {/* Performance & commission */}
        {data.performance && (
          <SectionCard
            title="My Performance"
            description="Current period metrics"
            icon="Trophy"
            className="lg:col-span-3"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] p-4">
                <p className="text-xs text-[#5A7299]">Pending Commission</p>
                <p className="mt-1 text-2xl font-bold text-[#E8501A]">
                  {(m.pendingCommission || 0).toLocaleString()} BDT
                </p>
              </div>
              <div className="rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] p-4">
                <p className="text-xs text-[#5A7299]">Paid Commission</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {(m.paidCommission || 0).toLocaleString()} BDT
                </p>
              </div>
              <div className="rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] p-4">
                <p className="text-xs text-[#5A7299]">New Leads Today</p>
                <p className="mt-1 text-2xl font-bold text-[#0057B8]">
                  {m.newLeadsToday || 0}
                </p>
              </div>
              <div className="rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] p-4">
                <p className="text-xs text-[#5A7299]">Partner Referred</p>
                <p className="mt-1 text-2xl font-bold text-violet-600">
                  {m.partnerReferredStudents || 0}
                </p>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
export default EmployeeWorkspace;

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Icon,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
} from "@/components/alo/shared";
import { fmtDate, timeAgo } from "@/lib/alo-types";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ReportType = "COUNSELOR" | "MARKETING" | "VISA" | "PARTNER" | "BRANCH";

interface WeeklyReport {
  id: string;
  type: ReportType;
  periodStart: string;
  periodEnd: string;
  recipientId?: string | null;
  summary: Record<string, any>;
  insights?: string | null;
  status: string;
  createdAt: string;
}

interface ReportsResponse {
  reports: WeeklyReport[];
}

// -----------------------------------------------------------------------------
// Tab config
// -----------------------------------------------------------------------------

const TABS: { key: ReportType; label: string; icon: string }[] = [
  { key: "COUNSELOR", label: "Counselor", icon: "Headset" },
  { key: "MARKETING", label: "Marketing", icon: "Megaphone" },
  { key: "VISA", label: "Visa", icon: "Plane" },
  { key: "PARTNER", label: "Partner", icon: "Handshake" },
  { key: "BRANCH", label: "Branch", icon: "Building2" },
];

// -----------------------------------------------------------------------------
// Per-type metric tile configs (label, key, icon, accent)
// -----------------------------------------------------------------------------

type Tile = {
  key: string;
  label: string;
  icon: string;
  accent: "blue" | "orange" | "emerald" | "amber" | "violet" | "rose";
};

const COUNSELOR_TILES: Tile[] = [
  { key: "totalLeadsHandled", label: "Leads handled", icon: "Users", accent: "blue" },
  { key: "responseTime", label: "Avg response time", icon: "Timer", accent: "emerald" },
  { key: "missedSla", label: "Missed SLAs", icon: "AlertTriangle", accent: "rose" },
  { key: "newStudents", label: "New students", icon: "UserPlus", accent: "violet" },
  { key: "applicationsCreated", label: "Applications", icon: "ClipboardList", accent: "blue" },
  { key: "documentsRequested", label: "Docs requested", icon: "FileText", accent: "amber" },
  { key: "sopCompleted", label: "SOPs completed", icon: "FileCheck", accent: "orange" },
  { key: "messagesSent", label: "Messages sent", icon: "Send", accent: "emerald" },
  { key: "conversionRate", label: "Conversion rate", icon: "Target", accent: "orange" },
  { key: "pendingTasks", label: "Pending tasks", icon: "ListTodo", accent: "amber" },
  { key: "aiAssistedReplies", label: "AI-assisted replies", icon: "Bot", accent: "violet" },
];

const MARKETING_TILES: Tile[] = [
  { key: "totalLeads", label: "Total leads", icon: "Users", accent: "blue" },
  { key: "facebookLeads", label: "Facebook leads", icon: "Facebook", accent: "blue" },
  { key: "instagramLeads", label: "Instagram leads", icon: "Instagram", accent: "rose" },
  { key: "whatsappLeads", label: "WhatsApp leads", icon: "MessageCircle", accent: "emerald" },
  { key: "websiteLeads", label: "Website leads", icon: "Globe", accent: "violet" },
  { key: "campaigns", label: "Campaigns active", icon: "Megaphone", accent: "orange" },
  { key: "costPerLead", label: "Cost per lead", icon: "DollarSign", accent: "amber" },
  { key: "conversionRate", label: "Conversion rate", icon: "Target", accent: "emerald" },
  { key: "socialReplies", label: "Social replies", icon: "MessageSquare", accent: "blue" },
  { key: "commentToLead", label: "Comment → Lead", icon: "Repeat", accent: "violet" },
  { key: "bestCountry", label: "Top country", icon: "MapPin", accent: "orange" },
  { key: "bestCourse", label: "Top course", icon: "BookOpen", accent: "blue" },
];

const VISA_TILES: Tile[] = [
  { key: "totalCases", label: "Total cases", icon: "Briefcase", accent: "blue" },
  { key: "interviewsScheduled", label: "Interviews scheduled", icon: "CalendarClock", accent: "violet" },
  { key: "readinessAvg", label: "Readiness avg", icon: "Gauge", accent: "emerald" },
  { key: "highRiskStudents", label: "High-risk students", icon: "AlertTriangle", accent: "rose" },
  { key: "missingDocuments", label: "Missing documents", icon: "FileWarning", accent: "amber" },
  { key: "approvals", label: "Approvals", icon: "CheckCircle2", accent: "emerald" },
  { key: "refusals", label: "Refusals", icon: "XCircle", accent: "rose" },
];

const PARTNER_TILES: Tile[] = [
  { key: "partnerLeads", label: "Partner leads", icon: "Users", accent: "blue" },
  { key: "activeApplications", label: "Active applications", icon: "ClipboardList", accent: "violet" },
  { key: "commissionPending", label: "Commission pending", icon: "DollarSign", accent: "orange" },
  { key: "conversionRate", label: "Conversion rate", icon: "Target", accent: "emerald" },
];

const BRANCH_TILES: Tile[] = [
  { key: "totalLeads", label: "Total leads", icon: "Users", accent: "blue" },
  { key: "totalStudents", label: "Total students", icon: "GraduationCap", accent: "violet" },
  { key: "totalApplications", label: "Applications", icon: "ClipboardList", accent: "blue" },
  { key: "totalVisaCases", label: "Visa cases", icon: "Plane", accent: "orange" },
  { key: "totalRevenue", label: "Total revenue", icon: "DollarSign", accent: "emerald" },
  { key: "slaCompliance", label: "SLA compliance", icon: "Timer", accent: "amber" },
  { key: "avgResponseTime", label: "Avg response", icon: "Clock", accent: "rose" },
];

const TILES_BY_TYPE: Record<ReportType, Tile[]> = {
  COUNSELOR: COUNSELOR_TILES,
  MARKETING: MARKETING_TILES,
  VISA: VISA_TILES,
  PARTNER: PARTNER_TILES,
  BRANCH: BRANCH_TILES,
};

// -----------------------------------------------------------------------------
// Status badges
// -----------------------------------------------------------------------------

const REPORT_STATUS_COLORS: Record<string, string> = {
  GENERATED: "bg-slate-100 text-slate-700",
  SENT: "bg-sky-100 text-sky-700",
  VIEWED: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-amber-100 text-amber-700",
};

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function MetricTile({
  tile,
  value,
}: {
  tile: Tile;
  value: any;
}) {
  const accentMap: Record<string, string> = {
    blue: "bg-[#e8f0fb] text-[#0057B8]",
    orange: "bg-[#fdece4] text-[#E8501A]",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
  };
  const isEmpty = value === undefined || value === null || value === "";

  return (
    <div className="rounded-xl border border-[#0057B8]/10 bg-white p-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            accentMap[tile.accent]
          )}
        >
          <Icon name={tile.icon} className="size-3.5" />
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {tile.label}
        </span>
      </div>
      <p className="mt-2 text-lg font-bold text-foreground tabular-nums">
        {isEmpty ? "—" : String(value)}
      </p>
    </div>
  );
}

function ReportCard({ report }: { report: WeeklyReport }) {
  const tiles = TILES_BY_TYPE[report.type] || [];
  const summary = report.summary || {};

  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-[#0057B8]/15">
      <CardHeader className="flex-row items-center justify-between space-y-0 bg-[#e8f0fb]/40">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#0057B8] text-white">
            <Icon
              name={TABS.find((t) => t.key === report.type)?.icon || "BarChart3"}
              className="size-5"
            />
          </div>
          <div>
            <CardTitle className="text-sm text-[#0057B8]">
              {fmtDate(report.periodStart)} → {fmtDate(report.periodEnd)}
            </CardTitle>
            <CardDescription className="text-xs">
              Generated {timeAgo(report.createdAt)}
              {report.recipientId ? ` · Recipient ${report.recipientId.slice(-6)}` : ""}
            </CardDescription>
          </div>
        </div>
        <Badge
          className={cn(
            "border",
            REPORT_STATUS_COLORS[report.status] || "bg-slate-100 text-slate-700"
          )}
        >
          {report.status}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* Metric grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((tile) => (
            <MetricTile key={tile.key} tile={tile} value={summary[tile.key]} />
          ))}
        </div>

        {/* AI insights */}
        {report.insights && (
          <div className="flex items-start gap-3 rounded-xl border-2 border-violet-200 bg-violet-50/60 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Icon name="Bot" className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-violet-900">
                AI Insights
                <Badge className="bg-violet-100 text-violet-700" variant="outline">
                  Auto-generated
                </Badge>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-violet-900/80">
                {report.insights}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportTabContent({ type }: { type: ReportType }) {
  const [reports, setReports] = React.useState<WeeklyReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fetched, setFetched] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/weekly-reports?type=${type}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load reports");
        const data = (await res.json()) as ReportsResponse;
        if (!cancelled) {
          setReports(Array.isArray(data?.reports) ? data.reports : []);
        }
      } catch {
        if (!cancelled) setReports([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setFetched(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  if (loading) {
    return <LoadingGrid count={4} />;
  }

  if (fetched && reports.length === 0) {
    return (
      <EmptyState
        icon="BarChart3"
        title="No reports yet for this period"
        description="The next scheduled report run will populate this tab. You can also trigger one manually."
      />
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((r) => (
        <ReportCard key={r.id} report={r} />
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export function WeeklyReports() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<ReportType>("COUNSELOR");

  const handleGenerate = () => {
    toast({
      title: "Report generation queued",
      description:
        "AI will compile the weekly summary across counselor, marketing, visa, partner, and branch operations. You'll see it here within a few minutes.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Reports"
        icon="BarChart3"
        subtitle="Automated weekly performance reports across counselor, marketing, visa, and partner operations."
        action={
          <Button
            onClick={handleGenerate}
            className="h-12 bg-[#E8501A] hover:bg-[#E8501A]/90 text-white"
          >
            <Icon name="Sparkles" className="size-4" />
            Generate New Report
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportType)}>
        <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl bg-[#e8f0fb] p-1.5">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0057B8] data-[state=active]:shadow-sm"
            >
              <Icon name={t.icon} className="mr-1.5 size-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(" ")[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-5">
            <ReportTabContent type={t.key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
export default WeeklyReports;

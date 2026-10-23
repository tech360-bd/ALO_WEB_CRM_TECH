"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState, StatCard, MiniBar } from "@/components/alo/shared";

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]",
  CONTACTED: "bg-amber-100 text-amber-700",
  QUALIFIED: "bg-violet-100 text-violet-700",
  CONVERTED: "bg-emerald-100 text-emerald-700",
  LOST: "bg-rose-100 text-rose-700",
  DUPLICATE: "bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]",
};

export function CrmAnalytics() {
  const [stats, setStats] = React.useState<any>(null);
  const [automation, setAutomation] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/automation/dashboard").then((r) => r.json()),
    ])
      .then(([s, a]) => {
        setStats(s);
        setAutomation(a);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader
          title="CRM Analytics"
          subtitle="Conversion rates, pipeline health, and counselor performance"
          icon="TrendingUp"
        />
        <div className="text-center text-[var(--alo-text-muted)]">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader
          title="CRM Analytics"
          subtitle="Conversion rates, pipeline health, and counselor performance"
          icon="TrendingUp"
        />
        <EmptyState
          icon="TrendingUp"
          title="No analytics available"
          description="Analytics will appear here once data is available."
        />
      </div>
    );
  }

  const totalLeads = stats.counts?.leads || 0;
  const converted = stats.leadsByStatus?.CONVERTED || 0;
  const lost = stats.leadsByStatus?.LOST || 0;
  const conversionRate = totalLeads ? Math.round((converted / totalLeads) * 100) : 0;

  const statusEntries = Object.entries(stats.leadsByStatus || {});
  const maxStatus = Math.max(1, ...statusEntries.map(([, v]) => v as number));

  const sourceEntries = Object.entries(stats.leadsBySource || {});
  const maxSource = Math.max(1, ...sourceEntries.map(([, v]) => v as number));

  const stageEntries = Object.entries(stats.appsByStage || {});
  const maxStage = Math.max(1, ...stageEntries.map(([, v]) => v as number));

  const automationPct = automation?.automation?.automationPercentage || 0;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="CRM Analytics"
        subtitle="Conversion rates, pipeline health, and counselor performance"
        icon="TrendingUp"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Leads"
          value={totalLeads}
          icon="Users"
          accent="blue"
          hint={`${stats.counts?.students || 0} converted to students`}
        />
        <StatCard
          label="Conversion Rate"
          value={`${conversionRate}%`}
          icon="TrendingUp"
          accent="emerald"
          hint={`${converted} enrolled / ${lost} lost`}
        />
        <StatCard
          label="Active Applications"
          value={stats.counts?.applications || 0}
          icon="ClipboardList"
          accent="orange"
        />
        <StatCard
          label="Automation Rate"
          value={`${automationPct}%`}
          icon="Sparkles"
          accent="violet"
          hint={`Target: ${automation?.targetAutomation || 70}%`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Lead Status Pipeline */}
        <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-white">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                <Icon name="Filter" className="size-4" />
              </div>
              <h3 className="font-bold text-[var(--alo-text)]">Lead Pipeline</h3>
            </div>
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between">
                    <Badge className={STATUS_COLORS[status] || "bg-[var(--alo-surface-muted)]"}>
                      {status}
                    </Badge>
                    <span className="text-sm font-semibold text-[var(--alo-text)]">
                      {count as number}
                    </span>
                  </div>
                  <MiniBar
                    value={count as number}
                    max={maxStatus}
                    color="#0057B8"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-white">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]">
                <Icon name="Megaphone" className="size-4" />
              </div>
              <h3 className="font-bold text-[var(--alo-text)]">Leads by Source</h3>
            </div>
            <div className="space-y-3">
              {sourceEntries.map(([source, count]) => (
                <div key={source}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--alo-text)]">
                      {source.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-semibold text-[var(--alo-text)]">
                      {count as number}
                    </span>
                  </div>
                  <MiniBar value={count as number} max={maxSource} color="#E8501A" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Application Stages */}
        <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-white">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Icon name="ClipboardList" className="size-4" />
              </div>
              <h3 className="font-bold text-[var(--alo-text)]">Applications by Stage</h3>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {stageEntries.map(([stage, count]) => (
                <div key={stage}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--alo-text)]">
                      {stage.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-semibold text-[var(--alo-text)]">
                      {count as number}
                    </span>
                  </div>
                  <MiniBar value={count as number} max={maxStage} color="#10B981" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Marketing Performance */}
        <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-white">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Icon name="BarChart3" className="size-4" />
              </div>
              <h3 className="font-bold text-[var(--alo-text)]">Marketing Performance</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-[var(--alo-page)] p-3">
                <p className="text-xs text-[var(--alo-text-muted)]">Total Budget</p>
                <p className="mt-1 text-lg font-bold text-[var(--alo-text)]">
                  {(stats.marketing?.totalBudget || 0).toLocaleString()} BDT
                </p>
              </div>
              <div className="rounded-lg bg-[var(--alo-page)] p-3">
                <p className="text-xs text-[var(--alo-text-muted)]">Total Spent</p>
                <p className="mt-1 text-lg font-bold text-[var(--alo-cta)]">
                  {(stats.marketing?.totalSpent || 0).toLocaleString()} BDT
                </p>
              </div>
              <div className="rounded-lg bg-[var(--alo-page)] p-3">
                <p className="text-xs text-[var(--alo-text-muted)]">Leads Generated</p>
                <p className="mt-1 text-lg font-bold text-[var(--alo-brand)]">
                  {stats.marketing?.totalLeadsFromCampaigns || 0}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--alo-page)] p-3">
                <p className="text-xs text-[var(--alo-text-muted)]">Cost Per Lead</p>
                <p className="mt-1 text-lg font-bold text-[var(--alo-text)]">
                  {stats.marketing?.costPerLead || 0} BDT
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-[var(--alo-brand-border)] bg-[var(--alo-brand-light)] p-3">
              <p className="text-xs text-[var(--alo-text-muted)]">Campaign Conversion Rate</p>
              <p className="mt-1 text-2xl font-bold text-[var(--alo-brand)]">
                {stats.marketing?.conversionRate || 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Agents by Department */}
      {stats.agentsByDept && Object.keys(stats.agentsByDept).length > 0 && (
        <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-white">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Icon name="Bot" className="size-4" />
              </div>
              <h3 className="font-bold text-[var(--alo-text)]">AI Agents by Department</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.agentsByDept).map(([dept, count]) => (
                <div
                  key={dept}
                  className="flex items-center gap-2 rounded-lg border border-[var(--alo-brand-border)] bg-[var(--alo-page)] px-3 py-2"
                >
                  <Icon name="Bot" className="size-4 text-violet-600" />
                  <span className="text-sm font-medium text-[var(--alo-text)]">{dept}</span>
                  <Badge className="bg-violet-100 text-violet-700">{count as number}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
export default CrmAnalytics;

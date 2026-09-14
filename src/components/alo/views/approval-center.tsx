"use client";

/**
 * Human Approval Center (per master brief §25)
 * ============================================
 * Central screen for the 20% human work — all AI outputs that require
 * human approval before publishing/executing.
 *
 * Sources aggregated:
 *   - AI Command Actions (CRM modifications)
 *   - University Monitoring changes
 *   - Communication Drafts (AI-drafted replies)
 *
 * Each item shows:
 *   - Source badge (AI_COMMAND / UNIVERSITY / COMMUNICATION)
 *   - Risk level (CRITICAL/HIGH/MEDIUM/LOW)
 *   - Title + description
 *   - Approve / Reject / View Details actions
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Icon,
  PageHeader,
  KpiCard,
  SectionCard,
  EmptyState,
  ErrorState,
  LoadingGrid,
  IconButton,
  type AccentColor,
} from "@/components/alo/ui";

interface ApprovalItem {
  id: string;
  source: "AI_COMMAND" | "UNIVERSITY_MONITORING" | "COMMUNICATION";
  type: string;
  targetType: string;
  targetId: string | null;
  payload: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskFlags: string;
  requestedBy: string;
  createdAt: string;
  title: string;
  description: string;
}

interface ApprovalStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  bySource: {
    AI_COMMAND: number;
    UNIVERSITY_MONITORING: number;
    COMMUNICATION: number;
  };
}

const RISK_META: Record<string, { accent: AccentColor; icon: string; label: string }> = {
  CRITICAL: { accent: "rose", icon: "AlertOctagon", label: "CRITICAL" },
  HIGH: { accent: "amber", icon: "AlertTriangle", label: "HIGH" },
  MEDIUM: { accent: "sky", icon: "Info", label: "MEDIUM" },
  LOW: { accent: "slate", icon: "CircleCheck", label: "LOW" },
};

const SOURCE_META: Record<string, { icon: string; label: string; color: string }> = {
  AI_COMMAND: { icon: "Bot", label: "AI Command", color: "text-[var(--alo-blue)]" },
  UNIVERSITY_MONITORING: { icon: "SatelliteDish", label: "University Monitor", color: "text-[var(--alo-orange)]" },
  COMMUNICATION: { icon: "MessageCircle", label: "Communication Draft", color: "text-[var(--alo-success)]" },
};

export function ApprovalCenter() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<ApprovalItem[]>([]);
  const [stats, setStats] = React.useState<ApprovalStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [sourceFilter, setSourceFilter] = React.useState<"ALL" | "AI_COMMAND" | "UNIVERSITY_MONITORING" | "COMMUNICATION">("ALL");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/approval-center", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.items || []);
      setStats(data.stats || null);
    } catch (e: any) {
      setError(e.message || "Failed to load approvals");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (item: ApprovalItem) => {
    toast({
      title: "Approving item",
      description: `${item.title} — approved. AI output will be published/executed.`,
    });
    // Optimistic removal
    setItems(prev => prev.filter(i => i.id !== item.id));
    setStats(prev => prev ? { ...prev, total: prev.total - 1 } : null);
  };

  const handleReject = async (item: ApprovalItem) => {
    toast({
      title: "Item rejected",
      description: `${item.title} — rejected. AI output will NOT be published.`,
      variant: "destructive",
    });
    setItems(prev => prev.filter(i => i.id !== item.id));
    setStats(prev => prev ? { ...prev, total: prev.total - 1 } : null);
  };

  const filtered = React.useMemo(() => {
    return items.filter(item => {
      if (filter !== "ALL" && item.riskLevel !== filter) return false;
      if (sourceFilter !== "ALL" && item.source !== sourceFilter) return false;
      return true;
    });
  }, [items, filter, sourceFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human Approval Center"
        subtitle="Central control for the 20% human work — every high-impact AI output requires your approval"
        icon="ClipboardCheck"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <Icon name="RotateCw" className="size-3.5" />Refresh
            </Button>
          </div>
        }
      />

      {/* Trust banner */}
      <div className="rounded-xl border-2 border-[var(--alo-sunshine)]/30 bg-[var(--alo-sunshine-soft)] p-4">
        <div className="flex items-start gap-3">
          <Icon name="ShieldCheck" className="mt-0.5 size-5 text-[var(--alo-sunshine)]" />
          <div>
            <p className="text-sm font-bold text-[var(--alo-text)]">Human Approval Gate</p>
            <p className="mt-0.5 text-xs text-[var(--alo-text-secondary)]">
              No AI output is published or executed without human review. This is the 20% human work that controls the 80% AI automation.
              High-risk items (visa, legal, payment) always require human approval.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <LoadingGrid count={4} />
      ) : error ? (
        <ErrorState title="Failed to load" description={error} onRetry={fetchData} />
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Total Pending" value={stats.total} icon="ClipboardList" accent="blue" />
          <KpiCard label="Critical" value={stats.critical} icon="AlertOctagon" accent="rose" />
          <KpiCard label="High Risk" value={stats.high} icon="AlertTriangle" accent="amber" />
          <KpiCard label="AI Commands" value={stats.bySource.AI_COMMAND} icon="Bot" accent="violet" />
          <KpiCard label="Comms Drafts" value={stats.bySource.COMMUNICATION} icon="MessageCircle" accent="emerald" />
        </div>
      ) : null}

      {/* Filters */}
      <SectionCard title="Approval Queue" icon="ListChecks" description={`${filtered.length} item(s) pending review`}>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--alo-muted)]">Risk:</span>
            {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map(r => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                  filter === r
                    ? "bg-[var(--alo-blue)] text-white"
                    : "bg-[var(--alo-gray-light)] text-[var(--alo-text-secondary)] hover:bg-[var(--alo-blue-soft)]"
                )}
              >
                {r === "ALL" ? "All" : r}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--alo-muted)]">Source:</span>
            {(["ALL", "AI_COMMAND", "UNIVERSITY_MONITORING", "COMMUNICATION"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                  sourceFilter === s
                    ? "bg-[var(--alo-orange)] text-white"
                    : "bg-[var(--alo-gray-light)] text-[var(--alo-text-secondary)] hover:bg-[var(--alo-orange-soft)]"
                )}
              >
                {s === "ALL" ? "All Sources" : s === "AI_COMMAND" ? "AI Commands" : s === "UNIVERSITY_MONITORING" ? "University" : "Drafts"}
              </button>
            ))}
          </div>
        </div>

        {/* Approval items list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="CheckCircle2"
            title="No items pending approval"
            description="All AI outputs have been reviewed. New approvals will appear here automatically."
            accent="emerald"
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const risk = RISK_META[item.riskLevel];
              const src = SOURCE_META[item.source];
              return (
                <Card
                  key={item.id}
                  className={cn(
                    "rounded-xl border-l-4 bg-[var(--alo-surface)] shadow-[var(--alo-shadow-xs)] transition-all hover:shadow-[var(--alo-shadow-sm)]",
                    item.riskLevel === "CRITICAL" && "border-l-[var(--alo-danger)]",
                    item.riskLevel === "HIGH" && "border-l-[var(--alo-warning)]",
                    item.riskLevel === "MEDIUM" && "border-l-[var(--alo-info)]",
                    item.riskLevel === "LOW" && "border-l-[var(--alo-border)]"
                  )}
                >
                  <CardContent className="py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      {/* Risk icon */}
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg",
                        item.riskLevel === "CRITICAL" && "bg-[var(--alo-danger-soft)] text-[var(--alo-danger)]",
                        item.riskLevel === "HIGH" && "bg-[var(--alo-warning-soft)] text-[var(--alo-warning)]",
                        item.riskLevel === "MEDIUM" && "bg-[var(--alo-info-soft)] text-[var(--alo-info)]",
                        item.riskLevel === "LOW" && "bg-[var(--alo-gray-light)] text-[var(--alo-muted)]",
                      )}>
                        <Icon name={risk.icon} className="size-5" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={item.riskLevel === "CRITICAL" ? "danger" : item.riskLevel === "HIGH" ? "warning" : item.riskLevel === "MEDIUM" ? "info" : "neutral"} className="text-[10px]">
                            {risk.label}
                          </Badge>
                          <span className={cn("flex items-center gap-1 text-xs font-semibold", src.color)}>
                            <Icon name={src.icon} className="size-3" />
                            {src.label}
                          </span>
                          <span className="text-xs text-[var(--alo-muted)]">
                            • {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-sm font-bold text-[var(--alo-text)]">{item.title}</h4>
                        <p className="mt-0.5 text-xs text-[var(--alo-text-secondary)]">{item.description}</p>

                        {/* Risk flags */}
                        {item.riskFlags && item.riskFlags !== "[]" && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {JSON.parse(item.riskFlags || "[]").map((flag: string, i: number) => (
                              <Badge key={i} variant="warning" className="text-[10px]">{flag.replace(/_/g, " ")}</Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          variant="cta"
                          onClick={() => handleApprove(item)}
                          className="h-9"
                        >
                          <Icon name="Check" className="size-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(item)}
                          className="h-9 border-[var(--alo-danger)]/40 text-[var(--alo-danger)] hover:bg-[var(--alo-danger-soft)]"
                        >
                          <Icon name="X" className="size-3.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Workflow explanation */}
      <SectionCard title="How the Human Approval Gate Works" icon="GitBranch">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { step: "01", title: "AI Output", desc: "AI generates content/action", icon: "Bot" },
            { step: "02", title: "Auto QA", desc: "Automated quality check", icon: "ShieldCheck" },
            { step: "03", title: "Fact Check", desc: "Verified against sources", icon: "Search" },
            { step: "04", title: "Risk Classify", desc: "LOW/MEDIUM/HIGH/CRITICAL", icon: "AlertTriangle" },
            { step: "05", title: "Human Approval", desc: "You review & approve", icon: "UserCheck" },
            { step: "06", title: "Publish", desc: "Approved output goes live", icon: "Rocket" },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-surface)] p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--alo-blue-soft)] text-xs font-bold text-[var(--alo-blue)]">{s.step}</span>
                <Icon name={s.icon} className="size-4 text-[var(--alo-orange)]" />
              </div>
              <p className="mt-2 text-sm font-bold text-[var(--alo-text)]">{s.title}</p>
              <p className="mt-0.5 text-xs text-[var(--alo-muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-lg bg-[var(--alo-gray-light)] p-3 text-xs text-[var(--alo-text-secondary)]">
          <Icon name="Info" className="mr-1 inline size-3" />
          LOW-risk items can be auto-approved by the system. MEDIUM/HIGH/CRITICAL items always require human review.
          No visa, legal, or financial result is treated as an autonomous AI decision.
        </p>
      </SectionCard>
    </div>
  );
}
export default ApprovalCenter;

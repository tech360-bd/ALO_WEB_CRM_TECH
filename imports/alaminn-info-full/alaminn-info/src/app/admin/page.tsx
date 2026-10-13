"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader, ErrorState } from "@/components/admin/page-primitives";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import {
  Users, CheckSquare, Newspaper, TrendingUp, Mail,
  ArrowUpRight, Activity,
} from "lucide-react";

type DashboardData = {
  kpis: {
    inquiries: number;
    opportunitiesValue: number;
    tasksDue: number;
    articlesPublished: number;
    contacts: number;
    pendingApprovals: number;
    newsletterSubscribers: number;
  };
  auditLogs: {
    id: string;
    action: string;
    resource: string | null;
    resourceId: string | null;
    actorName: string;
    createdAt: string;
    meta: string | null;
  }[];
  analytics: {
    totalEvents: number;
    windowDays: number;
    topEventTypes: { eventName: string; count: number }[];
  };
};

// Per-card tonal palette — subtle gradient washes that signal category at a glance
// without resorting to bright saturated colors. Each card gets a soft from-{tint}
// gradient + matching icon chip background.
type CardTone = {
  gradient: string;
  chipBg: string;
  icon: string;
  ring: string;
};

const TONES: Record<string, CardTone> = {
  orange: {
    gradient: "from-orange-50/70 via-white to-white",
    chipBg: "bg-orange-100 text-orange-700",
    icon: "text-orange-600",
    ring: "group-hover:shadow-orange-500/15",
  },
  emerald: {
    gradient: "from-emerald-50/70 via-white to-white",
    chipBg: "bg-emerald-100 text-emerald-700",
    icon: "text-emerald-600",
    ring: "group-hover:shadow-emerald-500/15",
  },
  amber: {
    gradient: "from-amber-50/70 via-white to-white",
    chipBg: "bg-amber-100 text-amber-700",
    icon: "text-amber-600",
    ring: "group-hover:shadow-amber-500/15",
  },
  rose: {
    gradient: "from-rose-50/70 via-white to-white",
    chipBg: "bg-rose-100 text-rose-700",
    icon: "text-rose-600",
    ring: "group-hover:shadow-rose-500/15",
  },
  blue: {
    gradient: "from-blue-50/70 via-white to-white",
    chipBg: "bg-blue-100 text-blue-700",
    icon: "text-blue-600",
    ring: "group-hover:shadow-blue-500/15",
  },
  purple: {
    gradient: "from-purple-50/70 via-white to-white",
    chipBg: "bg-purple-100 text-purple-700",
    icon: "text-purple-600",
    ring: "group-hover:shadow-purple-500/15",
  },
  cyan: {
    gradient: "from-cyan-50/70 via-white to-white",
    chipBg: "bg-cyan-100 text-cyan-700",
    icon: "text-cyan-600",
    ring: "group-hover:shadow-cyan-500/15",
  },
  teal: {
    gradient: "from-teal-50/70 via-white to-white",
    chipBg: "bg-teal-100 text-teal-700",
    icon: "text-teal-600",
    ring: "group-hover:shadow-teal-500/15",
  },
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const env = await adminFetch<DashboardData>("/api/v1/admin/dashboard");
        if (!cancelled) setData(env.data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Executive Dashboard" subtitle="Aggregated KPIs across your platform" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} />;

  const kpis = data?.kpis;
  const cards = [
    { label: "Inquiries", value: kpis?.inquiries ?? 0, icon: Mail, href: "/admin/contacts", tone: "orange" },
    { label: "Pipeline Value", value: `$${(kpis?.opportunitiesValue ?? 0).toLocaleString()}`, icon: TrendingUp, href: "/admin/contacts", tone: "emerald" },
    { label: "Tasks Due (7d)", value: kpis?.tasksDue ?? 0, icon: CheckSquare, href: "/admin/tasks", tone: "amber" },
    { label: "Articles Published", value: kpis?.articlesPublished ?? 0, icon: Newspaper, href: "/admin/articles", tone: "rose" },
    { label: "Contacts", value: kpis?.contacts ?? 0, icon: Users, href: "/admin/contacts", tone: "blue" },
    { label: "Pending AI Approvals", value: kpis?.pendingApprovals ?? 0, icon: Activity, href: "/admin/approvals", tone: "purple" },
    { label: "Newsletter Subscribers", value: kpis?.newsletterSubscribers ?? 0, icon: Mail, href: "/admin/settings", tone: "cyan" },
    { label: "Analytics Events (7d)", value: data?.analytics.totalEvents ?? 0, icon: TrendingUp, href: "/admin/analytics", tone: "teal" },
  ];

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        subtitle="Aggregated KPIs and recent activity across your platform"
        actions={
          <Button asChild variant="outline">
            <Link href="/" target="_blank">View public site <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          const tone = TONES[c.tone] ?? TONES.blue;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card
                className={`relative h-full overflow-hidden border-ink-200 bg-gradient-to-br ${tone.gradient} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${tone.ring} hover:border-ink-300`}
              >
                <CardContent className="relative p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</p>
                      <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{c.value}</p>
                    </div>
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.chipBg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    View
                    <ArrowUpRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.auditLogs?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <ul className="max-h-96 space-y-3 overflow-y-auto pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent">
                {data?.auditLogs?.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 text-sm transition-colors hover:bg-muted/40 rounded-lg p-1.5 -m-1.5">
                    <Badge variant="secondary" className="text-xs font-mono shrink-0">{a.action}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">
                        {a.actorName} · <span className="text-muted-foreground">{a.resource || "—"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{fmtDate(a.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Events (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.analytics?.topEventTypes?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded.</p>
            ) : (
              <ul className="space-y-2">
                {data?.analytics?.topEventTypes?.map((e, i) => {
                  const max = data?.analytics?.topEventTypes?.[0]?.count ?? 1;
                  const pct = Math.max(4, Math.round((e.count / max) * 100));
                  return (
                    <li key={i} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs truncate text-muted-foreground">{e.eventName}</span>
                        <span className="font-semibold tabular-nums">{e.count}</span>
                      </div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-orange-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/contacts", label: "Add Contact" },
          { href: "/admin/articles", label: "Write Article" },
          { href: "/admin/ai-assistant", label: "New AI Task" },
          { href: "/admin/settings", label: "Site Settings" },
        ].map((q) => (
          <Button key={q.href} asChild variant="outline" className="justify-start transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <Link href={q.href}>{q.label} <ArrowUpRight className="h-3.5 w-3.5 ml-auto" /></Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

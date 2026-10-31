"use client";
import { NamedIcon } from "@/components/ui/named-icon";

/**
 * ALO Labs AI-EOS Master Blueprint.
 *
 * Faithful React port of the "ALO Labs AI-EOS Master Blueprint" blueprint
 * (ai-eos-master-blueprint.html): executive dashboard, 4 execution streams,
 * 52-week roadmap, 10 deliverables, 15 strategic recommendations, 4 mobile
 * apps, the 100-department / 2,000-agent plan, infrastructure, governance,
 * revenue, budget and team views.
 */
import * as React from "react";
import Link from "next/link";
import {
  EOS_DEPARTMENTS,
  DELIVERABLES,
  STRATEGIES,
  EOS_APPS,
  buildRoadmap,
  PHASE_COLOR,
  PHASE_LABEL,
  PHASE_WEEKS,
  REVENUE_EXISTING,
  REVENUE_NEW,
  REVENUE_PROJECTION,
  BUDGET_TIERS,
  COST_BREAKDOWN,
  ROI_TARGETS,
  TEAM_ROLES,
  API_INTEGRATIONS,
  SECURITY_INFRA,
  AGENT_ROLE_DISTRIBUTION,
  STREAM_DETAILS,
  type Phase,
} from "./data";
import { cn } from "@/lib/utils";
import { Card, MiniStat, ProgressBar, SectionTitle, StatCard, TONE, TONE_BG } from "../ui";
import { BarChart, Donut, LineChart, TabButton } from "../charts";

type ViewKey =
  | "dashboard" | "streams" | "roadmap" | "deliverables" | "strategy"
  | "app-customer" | "app-admin" | "app-agent" | "app-reseller"
  | "departments" | "agents" | "infrastructure" | "governance"
  | "revenue" | "budget" | "team";

const NAV: { group: string; items: { key: ViewKey; label: string; icon: string }[] }[] = [
  { group: "Overview", items: [
    { key: "dashboard", label: "Executive Dashboard", icon: "BarChart3" },
    { key: "streams", label: "4 Parallel Streams", icon: "Waves" },
    { key: "roadmap", label: "52-Week Roadmap", icon: "CalendarDays" },
  ] },
  { group: "Deliverables", items: [
    { key: "deliverables", label: "10 Deliverables", icon: "Package" },
    { key: "strategy", label: "15 Strategic Recommendations", icon: "Target" },
  ] },
  { group: "Mobile Apps", items: [
    { key: "app-customer", label: "Customer App", icon: "Smartphone" },
    { key: "app-admin", label: "Admin App", icon: "ShieldCheck" },
    { key: "app-agent", label: "Agent Management", icon: "Bot" },
    { key: "app-reseller", label: "Reseller App", icon: "Briefcase" },
  ] },
  { group: "Deployment", items: [
    { key: "departments", label: "100 Departments", icon: "Landmark" },
    { key: "agents", label: "2,000 AI Agents", icon: "Bot" },
  ] },
  { group: "Strategy", items: [
    { key: "infrastructure", label: "Infrastructure", icon: "Settings" },
    { key: "governance", label: "Governance & DCC", icon: "ScrollText" },
    { key: "revenue", label: "Revenue Strategy", icon: "Wallet" },
    { key: "budget", label: "Budget & ROI", icon: "TrendingDown" },
    { key: "team", label: "Team & Resources", icon: "Users" },
  ] },
];

const TITLES: Record<ViewKey, string> = {
  dashboard: "Executive Dashboard",
  streams: "4 Parallel Streams",
  roadmap: "52-Week Roadmap",
  deliverables: "10 Deliverables",
  strategy: "15 Strategic Recommendations",
  "app-customer": "Customer App",
  "app-admin": "Admin App",
  "app-agent": "Agent Management App",
  "app-reseller": "Reseller App",
  departments: "100 Departments",
  agents: "2,000 AI Agents",
  infrastructure: "Infrastructure",
  governance: "Governance & DCC",
  revenue: "Revenue Strategy",
  budget: "Budget & ROI",
  team: "Team & Resources",
};

export default function AiEosMasterBlueprint() {
  const [view, setView] = React.useState<ViewKey>("dashboard");
  const [mobileNav, setMobileNav] = React.useState(false);

  return (
    <div className="cc min-h-screen">
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-30 w-64 shrink-0 overflow-y-auto border-r border-[var(--cc-border)] bg-[var(--cc-bg-2)] transition-transform",
          mobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="p-5 border-b border-[var(--cc-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--cc-blue)] via-[var(--cc-cyan)] to-[var(--cc-purple)] flex items-center justify-center font-bold text-white">AL</div>
            <div>
              <div className="font-bold text-sm cc-gradient-text">ALO Labs AI-EOS</div>
              <div className="text-xs text-[var(--cc-text-3)]">Master Blueprint v1.0</div>
            </div>
          </div>
        </div>
        <nav className="py-4">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="px-4 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--cc-text-3)]">{group.group}</div>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setView(item.key); setMobileNav(false); }}
                  className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors", view === item.key ? "text-[var(--cc-blue)]" : "text-[var(--cc-text-2)] hover:bg-[var(--cc-card-hover)]")}
                  style={view === item.key ? { background: "rgba(59,130,246,0.15)" } : undefined}
                >
                  <NamedIcon name={item.icon} className="size-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-4 mt-4 border-t border-[var(--cc-border)] text-[11px] space-y-1">
          <Link href="/super-admin/dashboard" className="block text-[var(--cc-cyan)] hover:text-[var(--cc-text)]">← Command Center</Link>
          <Link href="/super-admin/dashboard" className="block text-[var(--cc-text-3)]">Super Admin Dashboard</Link>
        </div>
      </aside>

      {mobileNav && <div className="fixed inset-0 z-20 bg-[var(--alo-navy)]/50 lg:hidden" onClick={() => setMobileNav(false)} />}

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-[var(--cc-bg)]/90 backdrop-blur border-b border-[var(--cc-border)] px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden w-9 h-9 rounded-lg bg-[var(--cc-card)] border border-[var(--cc-border)] flex items-center justify-center text-lg"
              onClick={() => setMobileNav((v) => !v)}
              aria-label="Toggle navigation"
            >☰</button>
            <h1 className="text-lg font-bold truncate">{TITLES[view]}</h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[var(--cc-green)]"><span className="cc-live-dot" /> LIVE</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative hidden sm:block">
              <input className="w-40 lg:w-56 text-sm bg-[var(--cc-bg-2)] border border-[var(--cc-border)] rounded-lg pl-9 pr-3 py-1.5 text-[var(--cc-text)] placeholder:text-[var(--cc-text-3)] focus:outline-none focus:border-[var(--cc-blue)]" placeholder="Search..." />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cc-text-3)]">🔍</span>
            </div>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-[var(--cc-blue)]/20 text-[var(--cc-blue)] hover:bg-[var(--cc-blue)]/30 transition">📤 Export</button>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {view === "dashboard" && <DashboardView />}
          {view === "streams" && <StreamsView />}
          {view === "roadmap" && <RoadmapView />}
          {view === "deliverables" && <DeliverablesView />}
          {view === "strategy" && <StrategyView />}
          {view === "app-customer" && <AppView key="customer" appKey="customer" />}
          {view === "app-admin" && <AppView key="admin" appKey="admin" />}
          {view === "app-agent" && <AppView key="agent" appKey="agent" />}
          {view === "app-reseller" && <AppView key="reseller" appKey="reseller" />}
          {view === "departments" && <DepartmentsView />}
          {view === "agents" && <AgentsView />}
          {view === "infrastructure" && <InfrastructureView />}
          {view === "governance" && <GovernanceView />}
          {view === "revenue" && <RevenueView />}
          {view === "budget" && <BudgetView />}
          {view === "team" && <TeamView />}
        </div>
      </main>
    </div>
  );
}

/* ---------- Executive Dashboard ---------- */
function DashboardView() {
  const hero = [
    { icon: "Smartphone", value: "4", label: "Mobile Apps", tone: "blue" },
    { icon: "🏢", value: "100", label: "Departments", tone: "cyan" },
    { icon: "Bot", value: "2,000", label: "AI Agents", tone: "green" },
    { icon: "Zap", value: "10K+", label: "Skills", tone: "purple" },
    { icon: "FileEdit", value: "50K+", label: "Prompts", tone: "orange" },
    { icon: "ClipboardList", value: "500+", label: "SOPs", tone: "pink" },
    { icon: "CalendarDays", value: "52", label: "Weeks", tone: "gold" },
    { icon: "Wallet", value: "$2-50K", label: "Monthly Cost", tone: "green" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">ALO Labs AI-EOS Master Blueprint</h2>
        <p className="text-sm text-[var(--cc-text-2)]">
          Complete production-ready AI Enterprise Operating System with 4 mobile apps, 100 departments, 2,000 AI agents, and full governance — built for Bangladesh with global scalability.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {hero.map((h, i) => (
          <div key={i} className="rounded-xl p-4 border border-[var(--cc-border)] bg-gradient-to-br from-[var(--cc-card)] to-[var(--cc-bg-2)]">
            <div className="mb-1"><NamedIcon name={h.icon} className="size-6" /></div>
            <div className={cn("text-xl font-bold", TONE[h.tone])}>{h.value}</div>
            <div className="text-xs text-[var(--cc-text-3)]">{h.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(STREAM_DETAILS).map(([key, s]) => (
          <div key={key} className="cc-card rounded-xl p-5" style={{ borderLeft: `3px solid var(--cc-${s.tone})` }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className={cn("font-semibold text-sm", TONE[s.tone])}>{s.title}</h3>
              </div>
              <span className="cc-badge cc-badge-degraded">Ready</span>
            </div>
            <div className="space-y-2 mb-3">
              {s.items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className={cn("w-5 text-center text-xs font-bold", TONE[s.tone])}>{String.fromCharCode(65 + i)}</span>
                  <span className="flex-1">{it}</span>
                </div>
              ))}
            </div>
            <ProgressBar value={0} tone={s.tone} />
            <div className="text-[11px] text-[var(--cc-text-3)] mt-2">{s.footer}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle>5-Year Revenue Projection</SectionTitle>
          <BarChart
            height={190}
            segments={REVENUE_PROJECTION.map((r, i) => ({
              label: r.year,
              value: [0.75, 3.5, 15, 30, 50][i] ?? 0,
              color: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#fbbf24"][i],
            }))}
          />
          <div className="flex flex-wrap gap-4 mt-3 text-xs">
            {REVENUE_PROJECTION.map((r) => (
              <span key={r.year} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#fbbf24"][REVENUE_PROJECTION.indexOf(r)] }} />
                <span className="text-[var(--cc-text-2)]">{r.year}: </span>
                <span className="font-semibold">{r.value}</span>
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle>Year 1 Budget Breakdown</SectionTitle>
          <Donut
            size={150}
            segments={COST_BREAKDOWN.map((c) => ({ label: c.label.split(" (")[0], value: c.pct, color: `var(--cc-${c.tone})` }))}
          />
        </Card>
      </div>
    </div>
  );
}

/* ---------- 4 Streams ---------- */
function StreamsView() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">4 Parallel Execution Streams</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(STREAM_DETAILS).map(([key, s]) => (
          <Card key={key} className="border-l-[3px]" style={{ borderLeftColor: `var(--cc-${s.tone})` } as React.CSSProperties}>
            <h3 className={cn("font-semibold text-sm mb-3", TONE[s.tone])}>{s.title}</h3>
            <div className="space-y-2 text-sm mb-3">
              {s.items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--cc-bg-2)]">
                  <span className="text-crm-success-text">✓</span>
                  <span>{it}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-[var(--cc-text-3)]">{s.footer}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- 52-Week Roadmap ---------- */
function RoadmapView() {
  const roadmap = buildRoadmap();
  const phases = (["A", "B", "C", "D"] as Phase[]).map((p) => ({
    phase: p,
    label: PHASE_LABEL[p],
    weeks: PHASE_WEEKS[p],
    color: PHASE_COLOR[p],
    detail:
      p === "A" ? "5 depts • 130 agents • App dev start"
      : p === "B" ? "20 depts • 500+ agents • Apps launch"
      : p === "C" ? "60 depts • 1,200+ agents • Regional"
      : "100 depts • 2,000 agents • Global",
  }));
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">52-Week Master Roadmap</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {phases.map((p) => (
          <div key={p.phase} className="cc-card rounded-xl p-4" style={{ borderTop: `3px solid var(--cc-${p.color})` }}>
            <div className="text-xs text-[var(--cc-text-3)]">PHASE {p.phase}: {p.label}</div>
            <div className={cn("text-lg font-bold mt-1", TONE[p.color])}>{p.weeks}</div>
            <div className="text-xs text-[var(--cc-text-2)] mt-1">{p.detail}</div>
          </div>
        ))}
      </div>
      <Card className="p-4">
        <SectionTitle>Week-by-Week Breakdown</SectionTitle>
        <div className="space-y-1.5 max-h-[560px] overflow-auto">
          {roadmap.map((wk) => (
            <div key={wk.week} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--cc-card-hover)] transition-colors">
              <div className="w-12 text-center">
                <div className={cn("text-xs font-bold", TONE[wk.color])}>W{wk.week}</div>
              </div>
              <div className="flex-1 text-xs text-[var(--cc-text-2)]">{wk.stream2}</div>
              {wk.milestone && <span className="cc-badge cc-badge-operational text-[11px]">{wk.milestone}</span>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------- 10 Deliverables ---------- */
function DeliverablesView() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">10 Deliverables</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DELIVERABLES.map((d) => (
          <Card key={d.num}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--cc-bg-2)] flex items-center justify-center"><NamedIcon name={d.icon} className="size-6" /></div>
              <div>
                <div className="text-xs text-[var(--cc-text-3)]">DELIVERABLE {d.num}</div>
                <div className="font-semibold text-sm">{d.name}</div>
              </div>
            </div>
            <p className="text-xs text-[var(--cc-text-2)] mb-3">{d.description}</p>
            <span className="cc-badge cc-badge-degraded">Ready</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- 15 Strategies ---------- */
function StrategyView() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Top 15 Strategic Recommendations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STRATEGIES.map((s) => (
          <Card key={s.num}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--cc-bg-2)] flex items-center justify-center"><NamedIcon name={s.icon} className="size-6" /></div>
              <div>
                <div className="text-xs text-[var(--cc-text-3)]">RECOMMENDATION {s.num}</div>
                <div className={cn("font-semibold text-sm", TONE[s.color])}>{s.title}</div>
              </div>
            </div>
            <p className="text-xs text-[var(--cc-text-2)]">{s.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Mobile Apps ---------- */
function AppView({ appKey }: { appKey: "customer" | "admin" | "agent" | "reseller" }) {
  const app = EOS_APPS.find((a) => a.key === appKey)!;
  return (
    <div>
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><NamedIcon name={app.icon} className="size-5" />{app.name}</h2>
      <p className="text-sm text-[var(--cc-text-2)] mb-4">{app.platforms} • {app.purpose}</p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <MiniStat label="Screens" value={`${app.screens.length}+`} tone={app.color} />
        <MiniStat label="Dev Plan" value={app.sprint} tone={app.color} />
        <MiniStat label="API Endpoints" value={app.apiCount} tone={app.color} />
      </div>
      <Card className="mb-4">
        <h3 className={cn("font-semibold text-sm mb-3", TONE[app.color])}>Key Features ({app.features.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {app.features.map((f) => (
            <div key={f} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--cc-bg-2)] text-xs">
              <span className="text-[var(--cc-green)]">✓</span> {f}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className={cn("font-semibold text-sm mb-3", TONE[app.color])}>Screens ({app.screens.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {app.screens.map((s, i) => (
            <div key={s} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--cc-bg-2)] text-xs">
              <span className={cn("font-bold", TONE[app.color])}>{String(i + 1).padStart(2, "0")}</span> {s}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------- 100 Departments ---------- */
function DepartmentsView() {
  const phaseCards = (["A", "B", "C", "D"] as Phase[]).map((p) => {
    const phaseDepts = EOS_DEPARTMENTS.filter((d) => d.phase === p);
    const agents = phaseDepts.reduce((s, d) => s + d.agents, 0);
    return { phase: p, depts: phaseDepts.length, agents, color: PHASE_COLOR[p] };
  });
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">100 Departments — Deployment Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {phaseCards.map((p) => (
          <div key={p.phase} className="cc-card rounded-xl p-4" style={{ borderTop: `3px solid var(--cc-${p.color})` }}>
            <div className="text-xs text-[var(--cc-text-3)]">Phase {p.phase}</div>
            <div className={cn("text-lg font-bold mt-1", TONE[p.color])}>{p.depts} depts / {p.agents} agents</div>
            <div className="text-xs text-[var(--cc-text-3)] mt-1">{PHASE_WEEKS[p.phase as Phase]}</div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {EOS_DEPARTMENTS.map((d) => (
          <div key={d.id} className="cc-card rounded-xl p-4" style={{ borderLeft: `3px solid var(--cc-${PHASE_COLOR[d.phase]})` }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--cc-text-3)]">{d.id}</span>
                  <span className="cc-badge cc-badge-degraded">Phase {d.phase}</span>
                  <span className="text-xs text-[var(--cc-text-3)]">Week {d.week}</span>
                </div>
                <div className="font-semibold text-sm mt-1">{d.name}</div>
                {d.roles && <div className="text-xs text-[var(--cc-text-3)] mt-1">{d.roles}</div>}
                <div className="flex flex-wrap gap-1 mt-2">
                  {d.features.map((f) => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-[var(--cc-bg-2)] text-[var(--cc-text-2)]">{f}</span>
                  ))}
                </div>
              </div>
              <div className="text-center ml-4">
                <div className={cn("text-2xl font-bold", TONE[PHASE_COLOR[d.phase]])}>{d.agents}</div>
                <div className="text-xs text-[var(--cc-text-3)]">agents</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 2,000 Agents ---------- */
function AgentsView() {
  const phases = (["A", "B", "C", "D"] as Phase[]).map((p) => {
    const n = EOS_DEPARTMENTS.filter((d) => d.phase === p).reduce((s, d) => s + d.agents, 0);
    return { phase: p, n, color: PHASE_COLOR[p] };
  });
  const total = phases.reduce((s, p) => s + p.n, 0);
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">2,000 AI Agents — Deployment Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {phases.map((p) => (
          <div key={p.phase} className="rounded-xl p-4 border border-[var(--cc-border)] bg-gradient-to-br from-[var(--cc-card)] to-[var(--cc-bg-2)]">
            <div className="text-xs text-[var(--cc-text-3)]">Phase {p.phase}</div>
            <div className={cn("text-2xl font-bold", TONE[p.color])}>{p.n}</div>
          </div>
        ))}
        <div className="rounded-xl p-4 border border-[var(--cc-border)] bg-gradient-to-br from-[var(--cc-card)] to-[var(--cc-bg-2)]">
          <div className="text-xs text-[var(--cc-text-3)]">Total</div>
          <div className="text-2xl font-bold cc-gradient-text">2,000</div>
        </div>
      </div>
      <Card>
        <SectionTitle>Agent Roles Distribution</SectionTitle>
        <Donut size={200} segments={AGENT_ROLE_DISTRIBUTION} center={<span className="text-xl font-bold">2,000</span>} />
      </Card>
      <div className="mt-4 text-xs text-[var(--cc-text-3)]">
        Projected total 2,000 agents (20 per department across 100 departments). Phase breakdown above reflects the 20-department pilot catalog.
      </div>
    </div>
  );
}

/* ---------- Infrastructure ---------- */
function InfrastructureView() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Infrastructure & Integration</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className={cn("font-semibold text-sm mb-3", TONE["blue"])}>AI Orchestration Platform</h3>
          <pre className="cc-code overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap bg-[var(--cc-bg-2)] rounded-lg p-4 border border-[var(--cc-border)]">{`Recommended: Hybrid Platform
├─ LangChain / LlamaIndex (orchestration)
├─ Vector DB: Pinecone / Weaviate
├─ Redis (real-time state)
├─ PostgreSQL (structured data)
├─ Node.js / Python (services)
├─ n8n / Make.com (workflow automation)
└─ Custom AI layer on top`}</pre>
        </Card>
        <Card>
          <h3 className={cn("font-semibold text-sm mb-3", TONE["green"])}>API Integration Layer (15+ systems)</h3>
          <div className="space-y-1 text-xs">
            {API_INTEGRATIONS.map((a) => (
              <div key={a} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--cc-bg-2)]">
                <span className="text-[var(--cc-green)]">✓</span> {a}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className={cn("font-semibold text-sm mb-3", TONE["purple"])}>AI/ML Stack</h3>
          <div className="space-y-2 text-xs">
            {[
              ["Complex Reasoning:", "Claude (analysis), GPT-4 (creativity), Gemini (multimodal)"],
              ["High-Volume:", "Fine-tuned smaller models, Local (Llama/Mistral), Custom Bengali NLP"],
              ["Specific:", "Whisper (STT), ElevenLabs (TTS), DALL-E (images)"],
              ["Cost:", "Route simple→cheap, complex→premium, Cache + RAG"],
            ].map(([k, v]) => (
              <div key={k} className="p-2 rounded-lg bg-[var(--cc-bg-2)]">
                <span className={cn("font-bold", TONE["purple"])}>{k}</span> {v}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className={cn("font-semibold text-sm mb-3", TONE["red"])}>Security Infrastructure</h3>
          <div className="space-y-1 text-xs">
            {SECURITY_INFRA.map((s) => (
              <div key={s} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--cc-bg-2)]">
                <span className="text-[var(--cc-red)]">🛡️</span> {s}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Governance ---------- */
function GovernanceView() {
  const metrics = [
    { icon: "ScrollText", value: "500+", label: "Constitutional Rules", tone: "blue" },
    { icon: "Award", value: "9", label: "DCC Criteria", tone: "green" },
    { icon: "Search", value: "100%", label: "Actions Logged", tone: "orange" },
    { icon: "👤", value: "Founder", label: "Ultimate Authority", tone: "purple" },
  ];
  const criteria = [
    { label: "SOP", val: 96, thr: "≥95%", tone: "green" as const },
    { label: "Know.", val: 95, thr: "≥95%", tone: "green" as const },
    { label: "Skill", val: 97, thr: "≥95%", tone: "green" as const },
    { label: "Test", val: 94, thr: "≥95%", tone: "orange" as const },
    { label: "KPI", val: 88, thr: "≥90%", tone: "orange" as const },
    { label: "Sec.", val: 100, thr: "=100%", tone: "green" as const },
    { label: "Audit", val: 100, thr: "=100%", tone: "green" as const },
    { label: "Recov.", val: 91, thr: "≥90%", tone: "green" as const },
    { label: "Escal.", val: 8, thr: "≤10%", tone: "green" as const },
  ];
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Governance & DCC</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m, i) => (
          <Card key={i} className="flex items-center gap-3">
            <div><NamedIcon name={m.icon} className="size-6" /></div>
            <div>
              <div className={cn("text-lg font-bold", TONE[m.tone])}>{m.value}</div>
              <div className="text-xs text-[var(--cc-text-3)]">{m.label}</div>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <SectionTitle>DCC 9 Certification Criteria</SectionTitle>
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
          {criteria.map((c) => (
            <div key={c.label} className="text-center">
              <div className="text-xs text-[var(--cc-text-3)] mb-1">{c.label}</div>
              <ProgressBar value={c.val} tone={c.tone} />
              <div className={cn("text-xs mt-1", TONE[c.tone])}>{c.thr}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------- Revenue ---------- */
function RevenueView() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Revenue Strategy</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <h3 className={cn("font-semibold text-sm mb-3", TONE["green"])}>Existing Revenue (Enhanced with AI)</h3>
          <div className="space-y-2 text-sm">
            {REVENUE_EXISTING.map((r) => (
              <div key={r.label} className="flex items-center justify-between p-2 rounded-lg bg-[var(--cc-bg-2)]">
                <span>{r.label}</span>
                <span className={TONE[r.tone]}>{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className={cn("font-semibold text-sm mb-3", TONE["blue"])}>New AI-Powered Revenue Streams</h3>
          <div className="space-y-2 text-sm">
            {REVENUE_NEW.map((r) => (
              <div key={r.label} className="flex items-center justify-between p-2 rounded-lg bg-[var(--cc-bg-2)]">
                <span>{r.label}</span>
                <span className={TONE[r.tone]}>{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <SectionTitle>5-Year Revenue Projection</SectionTitle>
        <div className="grid grid-cols-5 gap-3">
          {REVENUE_PROJECTION.map((r) => (
            <div key={r.year} className="text-center p-4 rounded-xl bg-[var(--cc-bg-2)]">
              <div className="text-xs text-[var(--cc-text-3)]">{r.year}</div>
              <div className={cn("text-xl font-bold mt-1", TONE[r.tone])}>{r.value}</div>
              <div className="text-xs text-[var(--cc-text-3)]">ARR</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------- Budget ---------- */
function BudgetView() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Budget & ROI</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {BUDGET_TIERS.map((t) => (
          <StatCard key={t.label} label={t.label} value={t.value} caption="/month" valueClass={TONE[t.tone]} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Cost Breakdown</SectionTitle>
          <div className="space-y-2 text-sm">
            {COST_BREAKDOWN.map((c) => (
              <div key={c.label} className="flex justify-between p-2 rounded-lg bg-[var(--cc-bg-2)]">
                <span>{c.label}</span>
                <span className={TONE[c.tone]}>{c.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle>ROI Targets</SectionTitle>
          <div className="space-y-2 text-sm">
            {ROI_TARGETS.map((r) => (
              <div key={r.label} className="flex justify-between p-2 rounded-lg bg-[var(--cc-bg-2)]">
                <span>{r.label}</span>
                <span className="font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Team ---------- */
function TeamView() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Team & Resources Plan</h2>
      <Card className="mb-4">
        <h3 className="font-semibold text-sm mb-3">Minimum Viable Team (Months 1-6) — 5-8 people</h3>
        <div className="space-y-2">
          {TEAM_ROLES.map((r) => (
            <div key={r.name} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--cc-bg-2)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--cc-blue)]/20 flex items-center justify-center"><NamedIcon name={r.icon} className="size-4" /></div>
              <div className="flex-1">
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-xs text-[var(--cc-text-3)]">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold text-sm mb-3">Scaling Roadmap</h3>
        <div className="grid grid-cols-3 gap-4">
          <MiniStat label="Months 1-6" value="5-8 people" tone="green" />
          <MiniStat label="Months 7-12" value="8-12 people" tone="blue" />
          <MiniStat label="Year 2" value="15-20 people" tone="orange" />
        </div>
        <p className="text-xs text-[var(--cc-text-2)] mt-4">
          Bangladesh dev talent = cost-effective. Combine a lean core team with the AI workforce (2,000 agents) to deliver enterprise scale without headcount bloat.
        </p>
      </Card>
    </div>
  );
}

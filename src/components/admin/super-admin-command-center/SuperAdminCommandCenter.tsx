"use client";
import { NamedIcon } from "@/components/ui/named-icon";

/**
 * ALO Enterprise Command Center — Super Admin Dashboard.
 *
 * Faithful React port of the "ALO Enterprise Command Center" blueprint
 * (command-center.html). Every tab from the blueprint is implemented:
 * Command Center, Departments, AI Employees, Skills, Prompt Templates,
 * Constitutional Rules, SOPs, DCC Certification, Audit & Compliance,
 * Enterprise Engines, Memory & Knowledge, Security Center, Observability,
 * Identity & RBAC and Settings.
 *
 * Live data: on mount the shell hydrates aggregate counts from the
 * AI-workforce / AgentOS APIs. When the database is empty the dashboard
 * falls back to the blueprint catalog so it is never blank.
 */
import * as React from "react";
import Link from "next/link";
import { OverviewSection } from "./sections/Overview";
import { DepartmentsSection } from "./sections/Departments";
import { AgentsSection } from "./sections/Agents";
import { GovernanceSection } from "./sections/Governance";
import { InfrastructureSection } from "./sections/Infrastructure";
import { TOTALS } from "./catalog";
import { cn } from "@/lib/utils";

type TabKey =
  | "command-center"
  | "departments"
  | "agents"
  | "skills"
  | "prompts"
  | "constitutional"
  | "sops"
  | "dcc"
  | "audit"
  | "engines"
  | "memory"
  | "security"
  | "monitoring"
  | "rbac"
  | "settings";

interface NavItem {
  key: TabKey;
  label: string;
  icon: string;
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { key: "command-center", label: "Command Center", icon: "Shield" },
      { key: "departments", label: "Departments", icon: "Landmark", badge: "100" },
      { key: "agents", label: "AI Employees", icon: "Bot", badge: "2,000" },
      { key: "skills", label: "Skills", icon: "Zap", badge: "10,000+" },
      { key: "prompts", label: "Prompt Templates", icon: "FileEdit", badge: "50,000+" },
    ],
  },
  {
    group: "Governance",
    items: [
      { key: "constitutional", label: "Constitutional Rules", icon: "ScrollText", badge: "500+" },
      { key: "sops", label: "SOPs", icon: "ClipboardList", badge: "500+" },
      { key: "dcc", label: "DCC Certification", icon: "Award" },
      { key: "audit", label: "Audit & Compliance", icon: "Search" },
    ],
  },
  {
    group: "Engines",
    items: [
      { key: "engines", label: "Enterprise Engines", icon: "Settings", badge: "28" },
      { key: "memory", label: "Memory & Knowledge", icon: "Brain" },
      { key: "security", label: "Security Center", icon: "ShieldCheck" },
    ],
  },
  {
    group: "System",
    items: [
      { key: "monitoring", label: "Observability", icon: "BarChart3" },
      { key: "rbac", label: "Identity & RBAC", icon: "Users" },
      { key: "settings", label: "Settings", icon: "Settings" },
    ],
  },
];

const TITLES: Record<TabKey, string> = {
  "command-center": "Command Center",
  departments: "Departments",
  agents: "AI Employees",
  skills: "Skills",
  prompts: "Prompt Templates",
  constitutional: "Constitutional Rules",
  sops: "SOPs",
  dcc: "DCC Certification",
  audit: "Audit & Compliance",
  engines: "Enterprise Engines",
  memory: "Memory & Knowledge",
  security: "Security Center",
  monitoring: "Observability",
  rbac: "Identity & RBAC",
  settings: "Settings",
};

const GOVERNANCE_TABS = new Set<TabKey>(["constitutional", "sops", "dcc", "audit"]);
const INFRA_TABS = new Set<TabKey>(["skills", "prompts", "engines", "memory", "security", "monitoring", "rbac", "settings"]);

interface LiveState {
  source: "api" | "catalog";
  departments?: number;
  agents?: number;
  engines?: number;
  checkedAt?: string;
}

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("portal_token") || localStorage.getItem("token") || "";
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function fetchJson(path: string): Promise<any | null> {
  try {
    const res = await fetch(path, { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function hydrateLive(): Promise<LiveState> {
  const checkedAt = new Date().toLocaleTimeString();
  const [depts, engines, dashboard] = await Promise.all([
    fetchJson("/api/agentos/departments"),
    fetchJson("/api/agentos/engines"),
    fetchJson("/api/ai-workforce/dashboard"),
  ]);

  const departments =
    typeof depts?.count === "number" ? depts.count
    : Array.isArray(depts?.departments) ? depts.departments.length
    : undefined;
  const engineCount =
    typeof engines?.count === "number" ? engines.count
    : Array.isArray(engines?.engines) ? engines.engines.length
    : undefined;
  const agents =
    typeof dashboard?.agents === "number" ? dashboard.agents
    : typeof dashboard?.counts?.aiAgents === "number" ? dashboard.counts.aiAgents
    : Array.isArray(dashboard?.agents) ? dashboard.agents.length
    : undefined;

  if (departments || engineCount || agents) {
    return { source: "api", departments, agents, engines: engineCount, checkedAt };
  }
  return { source: "catalog", checkedAt };
}

export default function SuperAdminCommandCenter() {
  const [tab, setTab] = React.useState<TabKey>("command-center");
  const [live, setLive] = React.useState<LiveState | null>(null);
  const [mobileNav, setMobileNav] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    hydrateLive().then((state) => {
      if (active) setLive(state);
    });
    return () => {
      active = false;
    };
  }, []);

  const select = (key: TabKey) => {
    setTab(key);
    setMobileNav(false);
  };

  return (
    <div className="cc min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-30 w-64 shrink-0 overflow-y-auto border-r border-[var(--cc-border)] bg-[var(--cc-bg-2)] transition-transform",
          mobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="p-5 border-b border-[var(--cc-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--cc-blue)] to-[var(--cc-cyan)] flex items-center justify-center font-bold text-white text-lg">A</div>
            <div>
              <div className="font-bold text-sm">ALO Enterprise</div>
              <div className="text-xs text-[var(--cc-text-3)]">Command Center v4.0</div>
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
                  onClick={() => select(item.key)}
                  className={cn(
                    "nav-item w-full flex items-center gap-3 px-4 py-2.5 text-sm",
                    tab === item.key ? "active" : "",
                  )}
                  style={tab === item.key ? { background: "rgba(59,130,246,0.15)", color: "var(--cc-blue)" } : undefined}
                >
                  <NamedIcon name={item.icon} className="size-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-[var(--cc-blue)]/20 text-[var(--cc-blue)]">{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 mt-4 border-t border-[var(--cc-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--cc-orange)] to-[var(--cc-red)] flex items-center justify-center text-xs font-bold">SA</div>
            <div className="flex-1">
              <div className="text-xs font-semibold">Super Admin</div>
              <div className="text-xs text-[var(--cc-text-3)]">admin@alolabs.net</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--cc-border)] space-y-1 text-[11px]">
            <Link href="/super-admin/ai-eos-blueprint" className="block text-[var(--cc-cyan)] hover:text-[var(--cc-text)]">AI-EOS Master Blueprint →</Link>
            <Link href="/admin/dashboard" className="block text-[var(--cc-text-2)] hover:text-[var(--cc-text)]">Enhanced Control Center →</Link>
          </div>
        </div>
      </aside>

      {mobileNav && <div className="fixed inset-0 z-20 bg-[var(--alo-navy)]/50 lg:hidden" onClick={() => setMobileNav(false)} />}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-[var(--cc-bg)]/90 backdrop-blur border-b border-[var(--cc-border)] px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden w-9 h-9 rounded-lg bg-[var(--cc-card)] border border-[var(--cc-border)] flex items-center justify-center text-lg"
              onClick={() => setMobileNav((v) => !v)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <h1 className="text-lg font-bold truncate">{TITLES[tab]}</h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[var(--cc-green)]">
              <span className="cc-live-dot" /> LIVE
            </span>
          </div>
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <div className="relative hidden sm:block">
              <input
                className="w-40 lg:w-64 text-sm bg-[var(--cc-bg-2)] border border-[var(--cc-border)] rounded-lg pl-9 pr-3 py-1.5 text-[var(--cc-text)] placeholder:text-[var(--cc-text-3)] focus:outline-none focus:border-[var(--cc-blue)]"
                placeholder="Search departments, agents, skills..."
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cc-text-3)]">🔍</span>
            </div>
            <button className="hidden sm:inline-block px-3 py-1.5 text-xs rounded-lg bg-[var(--cc-blue)]/20 text-[var(--cc-blue)] hover:bg-[var(--cc-blue)]/30 transition">📤 Export Report</button>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-[var(--cc-green)]/20 text-[var(--cc-green)] hover:bg-[var(--cc-green)]/30 transition">⚡ Deploy Agent</button>
            <button className="relative px-3 py-1.5 text-sm rounded-lg hover:bg-[var(--cc-card)] transition">
              🔔
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--cc-red)] text-white text-[11px] rounded-full flex items-center justify-center">3</span>
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {/* Live-sync banner */}
          {live && (
            <div className="mb-5 flex items-center gap-2 text-[11px] px-3 py-2 rounded-lg border border-[var(--cc-border)] bg-[var(--cc-card)]">
              <span className="cc-live-dot" />
              <span className="text-[var(--cc-text-2)]">
                {live.source === "api"
                  ? `Hydrated from live API · ${live.departments ?? TOTALS.departments} departments · ${live.agents ?? TOTALS.agents} agents · ${live.engines ?? TOTALS.engines} engines · checked ${live.checkedAt}`
                  : `Blueprint catalog · ${TOTALS.departments} departments · ${TOTALS.agents} agents · ${TOTALS.engines} engines · live API unreachable (check ${live.checkedAt})`}
              </span>
            </div>
          )}

          {/* Content */}
          {tab === "command-center" && <OverviewSection />}
          {tab === "departments" && <DepartmentsSection />}
          {tab === "agents" && <AgentsSection />}
          {tab === "skills" && <InfrastructureSection key="skills" initialTab="skills" />}
          {tab === "prompts" && <InfrastructureSection key="prompts" initialTab="prompts" />}
          {tab === "engines" && <InfrastructureSection key="engines" initialTab="engines" />}
          {tab === "memory" && <InfrastructureSection key="memory" initialTab="memory" />}
          {tab === "security" && <InfrastructureSection key="security" initialTab="security" />}
          {tab === "monitoring" && <InfrastructureSection key="monitoring" initialTab="monitoring" />}
          {tab === "rbac" && <InfrastructureSection key="rbac" initialTab="rbac" />}
          {tab === "settings" && <InfrastructureSection key="settings" initialTab="settings" />}
          {GOVERNANCE_TABS.has(tab) && <GovernanceSection key={tab} initialTab={tab as any} />}
        </div>
      </main>
    </div>
  );
}

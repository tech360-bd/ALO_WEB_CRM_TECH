"use client";

import * as React from "react";
import {
  SKILL_CATEGORIES,
  PROMPT_TEMPLATES,
  ENGINES,
  SECURITY_EVENTS,
  RBAC_ROLES,
  SYSTEM_TOGGLES,
} from "../catalog";
import { Card, MiniStat, ProgressBar, SectionTitle, StatCard, statusBadgeClass, healthColor, healthBarColor, TONE, TONE_BG } from "../ui";
import { LineChart, TabButton } from "../charts";

type InfraTab = "skills" | "prompts" | "engines" | "memory" | "security" | "monitoring" | "rbac" | "settings";

export function InfrastructureSection({ initialTab = "skills" }: { initialTab?: InfraTab }) {
  const [tab, setTab] = React.useState<InfraTab>(initialTab);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "skills"} onClick={() => setTab("skills")} tone="purple">Skills</TabButton>
        <TabButton active={tab === "prompts"} onClick={() => setTab("prompts")} tone="orange">Prompt Templates</TabButton>
        <TabButton active={tab === "engines"} onClick={() => setTab("engines")} tone="cyan">Enterprise Engines</TabButton>
        <TabButton active={tab === "memory"} onClick={() => setTab("memory")} tone="blue">Memory & Knowledge</TabButton>
        <TabButton active={tab === "security"} onClick={() => setTab("security")} tone="red">Security Center</TabButton>
        <TabButton active={tab === "monitoring"} onClick={() => setTab("monitoring")} tone="green">Observability</TabButton>
        <TabButton active={tab === "rbac"} onClick={() => setTab("rbac")} tone="blue">Identity & RBAC</TabButton>
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")} tone="blue">Settings</TabButton>
      </div>
      {tab === "skills" && <SkillsPanel />}
      {tab === "prompts" && <PromptsPanel />}
      {tab === "engines" && <EnginesPanel />}
      {tab === "memory" && <MemoryPanel />}
      {tab === "security" && <SecurityPanel />}
      {tab === "monitoring" && <MonitoringPanel />}
      {tab === "rbac" && <RbacPanel />}
      {tab === "settings" && <SettingsPanel />}
    </div>
  );
}

function SkillsPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Skills" value="10,247" valueClass="text-[var(--cc-purple)]" />
        <StatCard label="Active" value="9,832" valueClass="text-[var(--cc-green)]" />
        <StatCard label="In Quarantine" value="12" valueClass="text-[var(--cc-red)]" />
        <StatCard label="Pending Approval" value="47" valueClass="text-[var(--cc-gold)]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {SKILL_CATEGORIES.map((c) => (
          <div key={c.name} className="p-4 rounded-xl bg-[var(--cc-bg-2)] hover:bg-[var(--cc-card-hover)] transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${TONE_BG[c.tone]}`}>{c.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-xs text-[var(--cc-text-3)]">{c.count} skills</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptsPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Templates" value="52,384" valueClass="text-[var(--cc-orange)]" />
        <StatCard label="Most Used" value="Email Draft" caption="3,421 uses" valueClass="text-[var(--cc-blue)]" />
        <StatCard label="New This Week" value="127" valueClass="text-[var(--cc-green)]" />
        <StatCard label="Avg Quality Score" value="94.2%" valueClass="text-[var(--cc-purple)]" />
      </div>
      <Card>
        <SectionTitle>Top Prompt Templates</SectionTitle>
        <div className="space-y-2">
          {PROMPT_TEMPLATES.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--cc-bg-2)] hover:bg-[var(--cc-card-hover)] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[var(--cc-orange)]/20 flex items-center justify-center text-xs font-bold text-[var(--cc-orange)]">{i + 1}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-[var(--cc-text-3)]">{p.category} • {p.uses.toLocaleString()} uses</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-[var(--cc-green)]">{p.quality}%</div>
                <div className="text-xs text-[var(--cc-text-3)]">quality</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EnginesPanel() {
  const operational = ENGINES.filter((e) => e.status === "operational").length;
  const degraded = ENGINES.filter((e) => e.status === "degraded").length;
  const avgHealth = Math.round(ENGINES.reduce((s, e) => s + e.health, 0) / ENGINES.length);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Engines" value={ENGINES.length} valueClass="text-[var(--cc-cyan)]" />
        <StatCard label="Operational" value={operational} valueClass="text-[var(--cc-green)]" />
        <StatCard label="Degraded" value={degraded} valueClass="text-[var(--cc-gold)]" />
        <StatCard label="Avg Health" value={`${avgHealth}%`} valueClass="text-[var(--cc-blue)]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ENGINES.map((e) => (
          <div key={e.id} className="cc-card rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-xs text-[var(--cc-text-3)]">{e.id} • v{e.version}</div>
                <div className="font-semibold text-sm mt-0.5">{e.name}</div>
                <div className="text-xs text-[var(--cc-text-3)] mt-0.5">{e.category}</div>
              </div>
              <span className={`${statusBadgeClass(e.status)} capitalize`}>{e.status}</span>
            </div>
            <div className="text-xs text-[var(--cc-text-2)] mb-3">{e.description}</div>
            <div className="flex items-center gap-2 mb-3">
              <ProgressBar value={e.health} tone={e.health >= 97 ? "green" : e.health >= 93 ? "orange" : "red"} className="flex-1" />
              <span className={`text-xs font-bold ${healthColor(e.health)}`}>{e.health}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(e.metrics).map(([k, v]) => (
                <div key={k} className="p-2 rounded-lg bg-[var(--cc-bg-2)]">
                  <div className="text-[11px] text-[var(--cc-text-3)]">{k}</div>
                  <div className="text-sm font-bold">{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemoryPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Memories" value="2.4M" valueClass="text-[var(--cc-purple)]" />
        <StatCard label="Hot Memory" value="340K" valueClass="text-[var(--cc-red)]" />
        <StatCard label="Warm Memory" value="890K" valueClass="text-[var(--cc-gold)]" />
        <StatCard label="Cold Archive" value="1.17M" valueClass="text-[var(--cc-blue)]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Knowledge Graph Stats</SectionTitle>
          <div className="space-y-3">
            {[
              { label: "Nodes", value: "2.4M", tone: "blue" as const },
              { label: "Edges", value: "18.7M", tone: "green" as const },
              { label: "Queries/sec", value: "4,500", tone: "purple" as const },
              { label: "Avg Latency", value: "12ms", tone: "cyan" as const },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center p-3 rounded-lg bg-[var(--cc-bg-2)]">
                <span className="text-sm">{r.label}</span>
                <span className={`font-bold ${TONE[r.tone]}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle>RAG Performance</SectionTitle>
          <div className="space-y-3">
            {[
              { label: "Documents Indexed", value: "1.2M", tone: "blue" as const },
              { label: "Retrieval Accuracy", value: "96.8%", tone: "green" as const },
              { label: "Avg Query Time", value: "45ms", tone: "purple" as const },
              { label: "Index Freshness", value: "Real-time", tone: "cyan" as const },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center p-3 rounded-lg bg-[var(--cc-bg-2)]">
                <span className="text-sm">{r.label}</span>
                <span className={`font-bold ${TONE[r.tone]}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SecurityPanel() {
  const iconColor: Record<string, string> = {
    info: "text-[var(--cc-blue)]",
    warning: "text-[var(--cc-orange)]",
    critical: "text-[var(--cc-red)]",
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Threats Blocked (24h)" value="47" valueClass="text-[var(--cc-red)]" />
        <StatCard label="Security Score" value="100%" valueClass="text-[var(--cc-green)]" />
        <StatCard label="Active Sessions" value="23" valueClass="text-[var(--cc-blue)]" />
        <StatCard label="Vulnerabilities" value="0" valueClass="text-[var(--cc-green)]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Protection Mode</SectionTitle>
          <div className="space-y-2 text-sm">
            {["Credential Theft Protection", "Shell Command Validation", "Network Exfiltration Prevention", "Payment Guard", "Prompt Injection Protection"].map((name) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-[var(--cc-bg-2)]">
                <span>{name}</span>
                <span className="cc-badge cc-badge-operational">Active</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle>Recent Security Events</SectionTitle>
          <div className="space-y-2">
            {SECURITY_EVENTS.map((e, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--cc-bg-2)]">
                <span className={`${iconColor[e.severity]} text-lg`}>●</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{e.message}</div>
                  <div className="text-xs text-[var(--cc-text-3)]">{e.detail}</div>
                  <div className="text-[11px] text-[var(--cc-text-3)] mt-0.5">{e.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MonitoringPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Uptime (30d)" value="99.97%" valueClass="text-[var(--cc-green)]" />
        <StatCard label="Avg Response" value="23ms" valueClass="text-[var(--cc-blue)]" />
        <StatCard label="Active Alerts" value="2" valueClass="text-[var(--cc-orange)]" />
        <StatCard label="Data Processed" value="4.2TB" valueClass="text-[var(--cc-purple)]" />
      </div>
      <Card>
        <SectionTitle>System Metrics (Last 24 Hours)</SectionTitle>
        <LineChart
          height={200}
          labels={Array.from({ length: 24 }, (_, i) => `${i}:00`)}
          series={[
            { label: "CPU %", color: "#3b82f6", values: Array.from({ length: 24 }, (_, i) => 20 + ((i * 7) % 30)) },
            { label: "Memory %", color: "#8b5cf6", values: Array.from({ length: 24 }, (_, i) => 50 + ((i * 5) % 20)) },
            { label: "Active Agents", color: "#10b981", values: Array.from({ length: 24 }, (_, i) => 1600 + ((i * 37) % 200)) },
          ]}
        />
      </Card>
    </div>
  );
}

function RbacPanel() {
  const toneBg: Record<string, string> = {
    red: "bg-[var(--cc-red)]/20",
    orange: "bg-[var(--cc-orange)]/20",
    blue: "bg-[var(--cc-blue)]/20",
    green: "bg-[var(--cc-green)]/20",
    purple: "bg-[var(--cc-purple)]/20",
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value="47" valueClass="text-[var(--cc-blue)]" />
        <StatCard label="Roles" value="8" valueClass="text-[var(--cc-green)]" />
        <StatCard label="Permission Sets" value="24" valueClass="text-[var(--cc-purple)]" />
        <StatCard label="Active Sessions" value="23" valueClass="text-[var(--cc-orange)]" />
      </div>
      <Card>
        <SectionTitle>Role Hierarchy</SectionTitle>
        <div className="space-y-2">
          {RBAC_ROLES.map((r) => (
            <div key={r.name} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--cc-bg-2)]">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${toneBg[r.tone]}`}>{r.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-xs text-[var(--cc-text-3)]">{r.description}</div>
              </div>
              <span className="text-xs text-[var(--cc-text-3)]">{r.users} user{r.users !== 1 ? "s" : ""}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SettingsPanel() {
  const [toggles, setToggles] = React.useState(SYSTEM_TOGGLES);
  return (
    <Card>
      <SectionTitle>System Configuration</SectionTitle>
      <div className="space-y-3">
        {toggles.map((t, i) => (
          <div key={t.name} className="flex items-center justify-between p-3 rounded-lg bg-[var(--cc-bg-2)]">
            <div>
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-[var(--cc-text-3)]">{t.description}</div>
            </div>
            <button
              onClick={() => setToggles((prev) => prev.map((x, j) => (j === i ? { ...x, enabled: !x.enabled } : x)))}
              className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${toggles[i].enabled ? "bg-[var(--cc-green)]" : "bg-gray-700"}`}
              aria-pressed={toggles[i].enabled}
              aria-label={t.name}
            >
              <span className={`inline-block w-5 h-5 rounded-full bg-white transition-transform ${toggles[i].enabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

export { healthColor, healthBarColor, MiniStat };

"use client";

import * as React from "react";
import {
  DEPARTMENT_CATEGORY_COUNTS,
  DEPARTMENTS,
  DCC_DISTRIBUTION,
  ACTIVE_WORKFLOWS,
  RECENT_EVENTS,
  DCC_CRITERIA,
  TOTALS,
} from "../catalog";
import { Card, Gauge, ProgressBar, SectionTitle, StatCard, TONE, dccBadgeClass, ringClass } from "../ui";
import { Donut, LineChart } from "../charts";

const CAT_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#14b8a6"];

export function OverviewSection() {
  const deptSegments = DEPARTMENT_CATEGORY_COUNTS.map((c, i) => ({
    label: c.category,
    value: c.count,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }));

  const dccCriteria = DCC_CRITERIA.map((c) => {
    const dept = DEPARTMENTS[0];
    const val =
      c.label === "SOP Coverage" ? dept.dcc.sop
      : c.label === "Knowledge Coverage" ? dept.dcc.know
      : c.label === "Skill Coverage" ? dept.dcc.skill
      : c.label === "Test Pass Rate" ? dept.dcc.test
      : c.label === "KPI Achievement" ? dept.dcc.kpi
      : c.label === "Security Compliance" ? dept.dcc.sec
      : c.label === "Audit Compliance" ? dept.dcc.audit
      : c.label === "Human Escalation Rate" ? dept.dcc.esc
      : dept.dcc.esc;
    return { ...c, value: val };
  });

  const levelOrder = ["Platinum", "Gold", "Silver", "Bronze", "Pending"] as const;
  const levelTone: Record<string, string> = {
    Platinum: "gold",
    Gold: "gold",
    Silver: "slate",
    Bronze: "orange",
    Pending: "red",
  };

  return (
    <div className="space-y-6">
      {/* Hero stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Departments" value={TOTALS.departments} caption="↑ All operational" glow="blue" />
        <StatCard label="AI Employees" value={TOTALS.agents.toLocaleString()} caption="20 per department" valueClass="text-[var(--cc-green)]" glow="green" />
        <StatCard label="Skills" value="10,000+" caption={`~${Math.round(TOTALS.skills / TOTALS.departments)} per department`} valueClass="text-[var(--cc-purple)]" glow="purple" />
        <StatCard label="Prompt Templates" value="50,000+" caption="~500 per department" valueClass="text-[var(--cc-orange)]" glow="orange" />
        <StatCard label="Constitutional Rules" value="500+" caption="Enterprise-wide" valueClass="text-[var(--cc-blue)]" glow="blue" />
        <StatCard label="SOPs" value="500+" caption="~5 per department" valueClass="text-[var(--cc-cyan)]" glow="green" />
      </div>

      {/* Health + distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <SectionTitle right={<span className="cc-badge cc-badge-operational">Operational</span>}>System Health</SectionTitle>
          <div className="flex justify-center mb-4">
            <Gauge value={98.5} label="Overall" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--cc-green)]" /> All Systems: 26/28</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--cc-orange)]" /> Degraded: 2/28</div>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <SectionTitle right={<span className="cc-badge cc-badge-operational">By Count</span>}>Department Distribution by Category</SectionTitle>
          <Donut segments={deptSegments} size={180} center={<span className="text-2xl font-bold">100</span>} />
        </Card>
      </div>

      {/* DCC overview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Department Capability Certification (DCC) Overview</h3>
            <p className="text-xs text-[var(--cc-text-3)] mt-1">Only certified departments can create new AI agents</p>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-lg bg-[var(--cc-blue)]/20 text-[var(--cc-blue)] hover:bg-[var(--cc-blue)]/30 transition">View Details</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {levelOrder.map((lvl) => (
            <div key={lvl} className="text-center p-3 rounded-xl bg-[var(--cc-bg-2)]">
              <span className={ringClass(lvl)}>{lvl[0]}</span>
              <div className={`text-xl font-bold mt-2 ${TONE[levelTone[lvl]]}`}>{DCC_DISTRIBUTION[lvl]}</div>
              <div className="text-xs text-[var(--cc-text-3)]">{lvl}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
          {dccCriteria.map((c) => {
            const pass = c.inverse ? c.value <= c.threshold : c.value >= c.threshold;
            return (
              <div key={c.label} className="text-center">
                <div className="text-[11px] text-[var(--cc-text-3)] mb-1">{c.label.split(" ")[0]}</div>
                <ProgressBar value={c.inverse ? (c.threshold / Math.max(1, c.value)) * 100 : c.value} tone={pass ? "green" : "orange"} />
                <div className={`text-[11px] mt-1 ${pass ? "text-[var(--cc-green)]" : "text-[var(--cc-orange)]"}`}>{c.value}%</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Workflows + recent events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Active Workflows</SectionTitle>
          <div className="space-y-3">
            {ACTIVE_WORKFLOWS.map((w) => (
              <div key={w.name} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--cc-bg-2)]">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${w.tone === "blue" ? "bg-[var(--cc-blue)]/20" : w.tone === "green" ? "bg-[var(--cc-green)]/20" : w.tone === "purple" ? "bg-[var(--cc-purple)]/20" : "bg-[var(--cc-orange)]/20"}`}>{w.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{w.name}</div>
                  <div className="text-xs text-[var(--cc-text-3)]">{w.department} • {w.agents} agents</div>
                </div>
                <span className={w.status === "operational" ? "cc-badge cc-badge-operational" : "cc-badge cc-badge-degraded"}>{w.status === "operational" ? "Running" : "Degraded"}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle>Recent System Events</SectionTitle>
          <div className="space-y-2">
            {RECENT_EVENTS.map((e, i) => (
              <div key={i} className="flex items-start gap-3 p-2 text-sm">
                <span className={`mt-0.5`}>●</span>
                <div>
                  <span className="font-medium">{e.title}</span>
                  <div className={`text-xs ${e.color}`}>{e.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue / activity trend (fills the blueprint's revenue chart slot) */}
      <Card>
        <SectionTitle right={<span className="cc-badge cc-badge-operational">Live</span>}>Enterprise Activity — Last 14 Days</SectionTitle>
        <LineChart
          height={180}
          labels={Array.from({ length: 14 }, (_, i) => `D${i + 1}`)}
          series={[
            { label: "Agent Tasks", color: "#3b82f6", values: [820, 932, 901, 934, 1290, 1330, 1320, 1100, 1240, 1390, 1520, 1410, 1620, 1730] },
            { label: "Workflows Run", color: "#10b981", values: [320, 410, 380, 460, 520, 480, 510, 560, 600, 580, 640, 700, 720, 780] },
          ]}
        />
      </Card>
    </div>
  );
}

export { dccBadgeClass };

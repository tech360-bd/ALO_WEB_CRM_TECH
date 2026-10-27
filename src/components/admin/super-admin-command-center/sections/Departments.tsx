"use client";

import * as React from "react";
import { DEPARTMENTS, DEPARTMENT_CATEGORIES, AGENT_ROLES, type Department, type DccLevel } from "../catalog";
import { Card, MiniStat, ProgressBar, SectionTitle, dccBadgeClass, ringClass, TONE } from "../ui";
import { TabButton } from "../charts";

function dccMetric(label: string, value: number, threshold: number, inverse?: boolean) {
  const pass = inverse ? value <= threshold : value >= threshold;
  return (
    <div>
      <div className="text-xs text-[var(--cc-text-3)]">{label}</div>
      <div className={`font-bold ${pass ? "text-[var(--cc-green)]" : "text-[var(--cc-red)]"}`}>{value}%</div>
      <div className={`text-[11px] ${pass ? "text-[var(--cc-green)]" : "text-[var(--cc-red)]"}`}>
        {pass ? "✓ Pass" : "✗ Fail"} (≥ {threshold}%)
      </div>
    </div>
  );
}

export function DepartmentsSection() {
  const [filter, setFilter] = React.useState<string>("all");
  const [selected, setSelected] = React.useState<Department | null>(null);

  const filtered = filter === "all" ? DEPARTMENTS : DEPARTMENTS.filter((d) => d.category === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <TabButton active={filter === "all"} onClick={() => setFilter("all")} tone="blue">
          All ({DEPARTMENTS.length})
        </TabButton>
        {DEPARTMENT_CATEGORIES.map((cat) => (
          <TabButton key={cat} active={filter === cat} onClick={() => setFilter(cat)} tone="blue">
            {cat} ({DEPARTMENTS.filter((d) => d.category === cat).length})
          </TabButton>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <Card key={d.id} onClick={() => setSelected(d)} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-xs text-[var(--cc-text-3)]">{d.id}</div>
                <div className="font-semibold text-sm mt-0.5">{d.name}</div>
                <div className="text-xs text-[var(--cc-text-3)] mt-0.5">{d.category}</div>
              </div>
              <span className={ringClass(d.dcc.level)}>{d.dcc.level[0]}</span>
            </div>
            <div className="text-xs text-[var(--cc-text-2)] mb-3">{d.description}</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat label="Agents" value={d.agents} tone="green" />
              <MiniStat label="Skills" value={d.skills} tone="purple" />
              <MiniStat label="Prompts" value={d.prompts} tone="orange" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={dccBadgeClass(d.dcc.level)}>{d.dcc.level}</span>
              <span className="text-xs text-[var(--cc-text-3)]">SOPs: {d.sops}</span>
            </div>
          </Card>
        ))}
      </div>

      {selected && <DepartmentModal department={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DepartmentModal({ department, onClose }: { department: Department; onClose: () => void }) {
  const d = department;
  const agents = React.useMemo(
    () =>
      AGENT_ROLES.map((r, i) => ({
        name: `Agent-${d.id.split("-")[1]}-${String(i + 1).padStart(2, "0")}`,
        role: r,
      })),
    [d.id],
  );

  return (
    <div className="fixed inset-0 z-50 cc flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div
        className="cc-card rounded-2xl p-6 w-full max-w-3xl max-h-[88vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs text-[var(--cc-text-3)]">{d.id}</div>
            <h2 className="text-xl font-bold mt-1">{d.name}</h2>
            <div className="text-sm text-[var(--cc-text-3)]">{d.category} • {d.description}</div>
          </div>
          <button onClick={onClose} className="text-2xl text-[var(--cc-text-3)] hover:text-[var(--cc-text)] leading-none">×</button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <MiniStat label="Agents" value={d.agents} tone="green" />
          <MiniStat label="Skills" value={d.skills} tone="purple" />
          <MiniStat label="Prompts" value={d.prompts} tone="orange" />
          <MiniStat label="SOPs" value={d.sops} tone="cyan" />
        </div>

        <div className="p-4 rounded-xl bg-[var(--cc-bg-2)] mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">DCC Certification</h3>
            <span className={dccBadgeClass(d.dcc.level)}>{d.dcc.level}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {dccMetric("SOP Coverage", d.dcc.sop, 95)}
            {dccMetric("Knowledge", d.dcc.know, 95)}
            {dccMetric("Skill", d.dcc.skill, 95)}
            {dccMetric("Test Pass", d.dcc.test, 95)}
            {dccMetric("KPI", d.dcc.kpi, 90)}
            {dccMetric("Security", d.dcc.sec, 100)}
            {dccMetric("Audit", d.dcc.audit, 100)}
            {dccMetric("Recovery", d.dcc.recov, 90)}
            {dccMetric("Escalation", d.dcc.esc, 10, true)}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-2">{d.agents} AI Employees</h3>
          <div className="grid grid-cols-2 gap-2">
            {agents.map((a) => (
              <div key={a.name} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--cc-bg-2)] text-xs">
                <span className="cc-live-dot" />
                <span className="font-medium">{a.name}</span>
                <span className="text-[var(--cc-text-3)]">{a.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

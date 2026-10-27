"use client";

import * as React from "react";
import {
  DEPARTMENTS,
  DCC_CRITERIA,
  AUDIT_EVENTS,
  type DccLevel,
} from "../catalog";
import { Card, MiniStat, ProgressBar, SectionTitle, StatCard, dccBadgeClass, ringClass, TONE } from "../ui";
import { LineChart, TabButton } from "../charts";

type GovTab = "constitutional" | "sops" | "dcc" | "audit";

const LEVEL_BADGE: Record<DccLevel, string> = {
  Platinum: "cc-badge cc-badge-platinum",
  Gold: "cc-badge cc-badge-gold",
  Silver: "cc-badge cc-badge-silver",
  Bronze: "cc-badge cc-badge-bronze",
  Pending: "cc-badge cc-badge-pending",
};

export function GovernanceSection({ initialTab = "constitutional" }: { initialTab?: GovTab }) {
  const [tab, setTab] = React.useState<GovTab>(initialTab);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "constitutional"} onClick={() => setTab("constitutional")} tone="blue">Constitutional Rules</TabButton>
        <TabButton active={tab === "sops"} onClick={() => setTab("sops")} tone="cyan">SOPs</TabButton>
        <TabButton active={tab === "dcc"} onClick={() => setTab("dcc")} tone="gold">DCC Certification</TabButton>
        <TabButton active={tab === "audit"} onClick={() => setTab("audit")} tone="green">Audit & Compliance</TabButton>
      </div>
      {tab === "constitutional" && <ConstitutionalRules />}
      {tab === "sops" && <SopsPanel />}
      {tab === "dcc" && <DccPanel />}
      {tab === "audit" && <AuditPanel />}
    </div>
  );
}

function ConstitutionalRules() {
  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Constitutional Rules Engine</SectionTitle>
        <p className="text-xs text-[var(--cc-text-3)] mb-4">
          500+ enterprise-wide rules governing all AI agent behavior. These rules supersede all department-level instructions.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MiniStat label="Safety Rules" value={147} tone="blue" />
          <MiniStat label="Privacy Rules" value={89} tone="green" />
          <MiniStat label="Compliance" value={76} tone="purple" />
          <MiniStat label="Operational" value={112} tone="orange" />
          <MiniStat label="Ethics" value={76} tone="cyan" />
        </div>
      </Card>
      <Card>
        <SectionTitle>Rule Enforcement (Last 24h)</SectionTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--cc-bg-2)]">
            <span className="text-sm text-[var(--cc-green)]">✓ Rules passed</span>
            <span className="text-sm font-bold text-[var(--cc-green)]">14,832</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--cc-bg-2)]">
            <span className="text-sm text-[var(--cc-orange)]">⚠ Rules warned</span>
            <span className="text-sm font-bold text-[var(--cc-orange)]">47</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--cc-bg-2)]">
            <span className="text-sm text-[var(--cc-red)]">✗ Rules blocked</span>
            <span className="text-sm font-bold text-[var(--cc-red)]">3</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SopsPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total SOPs" value="512" valueClass="text-[var(--cc-cyan)]" />
        <StatCard label="Avg Coverage" value="96.4%" valueClass="text-[var(--cc-green)]" />
        <StatCard label="Updated This Month" value="38" valueClass="text-[var(--cc-blue)]" />
        <StatCard label="Pending Review" value="12" valueClass="text-[var(--cc-orange)]" />
      </div>
      <Card>
        <SectionTitle>SOP Execution Stats (Last 7 Days)</SectionTitle>
        <LineChart
          height={170}
          labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
          series={[
            { label: "SOPs Executed", color: "#06b6d4", values: [3200, 3400, 3100, 3600, 3500, 2800, 2900] },
            { label: "Success Rate", color: "#10b981", values: [95, 96, 94, 97, 96, 93, 95] },
          ]}
        />
      </Card>
    </div>
  );
}

function DccPanel() {
  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Department Capability Certification (DCC)</SectionTitle>
        <p className="text-xs text-[var(--cc-text-3)] mb-4">
          A department may only create new AI agents when it passes all 9 certification criteria below.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[var(--cc-bg-2)]">
            <h4 className="text-sm font-semibold mb-3 text-[var(--cc-green)]">Certification Criteria</h4>
            <div className="space-y-2 text-sm">
              {DCC_CRITERIA.map((c) => (
                <div key={c.label} className="flex justify-between">
                  <span>{c.label}</span>
                  <span className="text-[var(--cc-green)]">≥ {c.threshold}{c.unit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--cc-bg-2)]">
            <h4 className="text-sm font-semibold mb-3 text-[var(--cc-gold)]">Certification Levels</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><span className={ringClass("Platinum")}>P</span> Platinum — All 9 exceeded by 3%+</div>
              <div className="flex items-center gap-2"><span className={ringClass("Gold")}>G</span> Gold — All 9 criteria met</div>
              <div className="flex items-center gap-2"><span className={ringClass("Silver")}>S</span> Silver — 7/9 met, 2 within 5%</div>
              <div className="flex items-center gap-2"><span className={ringClass("Bronze")}>B</span> Bronze — 5/9 criteria met</div>
              <div className="flex items-center gap-2"><span className={ringClass("Pending")}>!</span> Pending — Below 5 criteria</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--cc-bg-2)]">
            <h4 className="text-sm font-semibold mb-3 text-[var(--cc-blue)]">Agent Creation Permission</h4>
            <div className="space-y-2 text-sm text-[var(--cc-text-2)]">
              <p><span className="text-[var(--cc-green)]">Bronze+</span> — Can create new agents</p>
              <p><span className="text-[var(--cc-green)]">Silver+</span> — Can create up to 50 agents</p>
              <p><span className="text-[var(--cc-green)]">Gold+</span> — Can create up to 100 agents</p>
              <p><span className="text-[var(--cc-green)]">Platinum</span> — Unlimited agent creation</p>
              <p><span className="text-[var(--cc-red)]">Pending</span> — Cannot create new agents</p>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--cc-border)] text-xs text-[var(--cc-text-3)]">
              Recertification: Quarterly (every 90 days)
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <SectionTitle>All 100 Departments — DCC Status</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-xs text-[var(--cc-text-3)] border-b border-[var(--cc-border)]">
                <th className="py-2 pr-3">Dept ID</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Level</th>
                <th className="py-2 pr-3">SOP</th>
                <th className="py-2 pr-3">Know.</th>
                <th className="py-2 pr-3">Skill</th>
                <th className="py-2 pr-3">Test</th>
                <th className="py-2 pr-3">KPI</th>
                <th className="py-2 pr-3">Sec.</th>
                <th className="py-2 pr-3">Audit</th>
                <th className="py-2 pr-3">Recov.</th>
                <th className="py-2 pr-3">Escal.</th>
              </tr>
            </thead>
            <tbody>
              {DEPARTMENTS.map((d) => {
                const pass = (v: number, t: number, inv?: boolean) => (inv ? v <= t : v >= t);
                return (
                  <tr key={d.id} className="border-b border-[var(--cc-border)] hover:bg-[var(--cc-card-hover)] transition-colors">
                    <td className="py-1.5 pr-3 text-xs text-[var(--cc-text-2)]">{d.id}</td>
                    <td className="py-1.5 pr-3 text-xs">{d.name}</td>
                    <td className="py-1.5 pr-3"><span className={LEVEL_BADGE[d.dcc.level]}>{d.dcc.level}</span></td>
                    <td className={`py-1.5 pr-3 text-xs ${pass(d.dcc.sop, 95) ? "text-[var(--cc-green)]" : "text-[var(--cc-red)]"}`}>{d.dcc.sop}%</td>
                    <td className={`py-1.5 pr-3 text-xs ${pass(d.dcc.know, 95) ? "text-[var(--cc-green)]" : "text-[var(--cc-red)]"}`}>{d.dcc.know}%</td>
                    <td className={`py-1.5 pr-3 text-xs ${pass(d.dcc.skill, 95) ? "text-[var(--cc-green)]" : "text-[var(--cc-red)]"}`}>{d.dcc.skill}%</td>
                    <td className={`py-1.5 pr-3 text-xs ${pass(d.dcc.test, 95) ? "text-[var(--cc-green)]" : "text-[var(--cc-red)]"}`}>{d.dcc.test}%</td>
                    <td className={`py-1.5 pr-3 text-xs ${pass(d.dcc.kpi, 90) ? "text-[var(--cc-green)]" : "text-[var(--cc-red)]"}`}>{d.dcc.kpi}%</td>
                    <td className={`py-1.5 pr-3 text-xs ${pass(d.dcc.sec, 100) ? "text-[var(--cc-green)]" : "text-[var(--cc-red)]"}`}>{d.dcc.sec}%</td>
                    <td className={`py-1.5 pr-3 text-xs ${pass(d.dcc.audit, 100) ? "text-[var(--cc-green)]" : "text-[var(--cc-red)]"}`}>{d.dcc.audit}%</td>
                    <td className={`py-1.5 pr-3 text-xs ${pass(d.dcc.recov, 90) ? "text-[var(--cc-green)]" : "text-[var(--cc-red)]"}`}>{d.dcc.recov}%</td>
                    <td className={`py-1.5 pr-3 text-xs ${pass(d.dcc.esc, 10, true) ? "text-[var(--cc-green)]" : "text-[var(--cc-red)]"}`}>{d.dcc.esc}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AuditPanel() {
  const iconColor: Record<string, string> = {
    info: "text-[var(--cc-blue)]",
    warning: "text-[var(--cc-orange)]",
    critical: "text-[var(--cc-red)]",
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Audit Logs (24h)" value="48,231" valueClass="text-[var(--cc-blue)]" />
        <StatCard label="Compliance Score" value="100%" valueClass="text-[var(--cc-green)]" />
        <StatCard label="Open Findings" value="3" valueClass="text-[var(--cc-orange)]" />
        <StatCard label="Overdue Actions" value="0" valueClass="text-[var(--cc-red)]" />
      </div>
      <Card>
        <SectionTitle>Recent Audit Events</SectionTitle>
        <div className="space-y-2">
          {AUDIT_EVENTS.map((e, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--cc-bg-2)]">
              <span className={`${iconColor[e.type]} text-lg`}>{e.icon}</span>
              <div className="flex-1">
                <div className="text-sm">{e.message}</div>
                <div className="text-xs text-[var(--cc-text-3)]">{e.time}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export { dccBadgeClass, TONE };

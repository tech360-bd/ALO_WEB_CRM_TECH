"use client";

import * as React from "react";
import { buildAgents, type AgentRow } from "../catalog";
import { Card, MiniStat, SectionTitle, StatCard } from "../ui";

export function AgentsSection() {
  const [agents, setAgents] = React.useState<AgentRow[]>([]);
  const [seed] = React.useState(0);

  React.useEffect(() => {
    setAgents(buildAgents(seed));
  }, [seed]);

  const active = agents.filter((a) => a.status === "active").length;
  const busy = agents.filter((a) => a.status === "busy").length;
  const idle = agents.filter((a) => a.status === "idle").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Agents" value="2,000" valueClass="text-[var(--cc-green)]" />
        <StatCard label="Active Now" value="1,847" valueClass="text-[var(--cc-blue)]" />
        <StatCard label="In Tasks" value="342" valueClass="text-[var(--cc-purple)]" />
        <StatCard label="Idle" value="153" valueClass="text-[var(--cc-orange)]" />
      </div>

      <Card className="p-4">
        <SectionTitle right={
          <div className="flex gap-2">
            <select className="bg-[var(--cc-bg-2)] border border-[var(--cc-border)] text-xs rounded-lg px-3 py-1.5 text-[var(--cc-text)]">
              <option>All Departments</option>
              <option>Core Operations</option>
              <option>Marketing & Sales</option>
              <option>Web & Tech</option>
            </select>
            <select className="bg-[var(--cc-bg-2)] border border-[var(--cc-border)] text-xs rounded-lg px-3 py-1.5 text-[var(--cc-text)]">
              <option>All Roles</option>
              <option>Manager</option>
              <option>Planner</option>
              <option>Executor</option>
              <option>QA</option>
            </select>
          </div>
        }>
          Agent Roster (showing first 50 of 2,000)
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs text-[var(--cc-text-3)] border-b border-[var(--cc-border)]">
                <th className="py-2 pr-4">Agent ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Tasks Today</th>
                <th className="py-2 pr-4">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-b border-[var(--cc-border)] hover:bg-[var(--cc-card-hover)] transition-colors">
                  <td className="py-2 pr-4 text-xs text-[var(--cc-text-2)]">{a.id}</td>
                  <td className="py-2 pr-4">{a.name}</td>
                  <td className="py-2 pr-4 text-xs text-[var(--cc-text-3)]">{a.department}</td>
                  <td className="py-2 pr-4 text-xs">{a.role}</td>
                  <td className="py-2 pr-4">
                    {a.status === "active" ? (
                      <span className="cc-badge cc-badge-operational">Active</span>
                    ) : a.status === "idle" ? (
                      <span className="cc-badge cc-badge-degraded">Idle</span>
                    ) : (
                      <span className="cc-badge" style={{ background: "rgba(59,130,246,0.15)", color: "var(--cc-blue)", border: "1px solid rgba(59,130,246,0.3)" }}>Busy</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{a.tasks}</td>
                  <td className="py-2 pr-4 text-[var(--cc-green)]">{a.success}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Active (sample)" value={active} tone="green" />
        <MiniStat label="Busy (sample)" value={busy} tone="blue" />
        <MiniStat label="Idle (sample)" value={idle} tone="orange" />
        <MiniStat label="Avg Success" value={`${Math.round(agents.reduce((s, a) => s + a.success, 0) / (agents.length || 1))}%`} tone="cyan" />
      </div>
    </div>
  );
}

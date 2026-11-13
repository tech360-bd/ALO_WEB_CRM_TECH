"use client";

/**
 * Super Admin AI Command Center — Master Dashboard
 * Spec §1-2, §37. The highest-level AI control plane.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database, Bot, Cpu, Brain, FileText, Shield, GitBranch,
  Network, BookOpen, HardDrive, ClipboardCheck, Gavel,
  Lock, ScrollText, Activity, Workflow, Radio, Plug,
  Layers, Users, AlertTriangle, CheckCircle2, Loader2,
} from "lucide-react";

interface CommandCenterData {
  overview: {
    departments: { total: number; active: number; certified: number; uncertified: number };
    ai_employees: { total: number; active: number; failed: number; paused: number; training: number; loop_agents: number };
    models: { total: number; production: number };
    skills: number;
    prompts: number;
    sops: number;
    constitutional_rules: number;
    workflows: { total: number; active: number; failed: number };
    knowledge: { sources: number; documents: number };
    memory_records: number;
    events: { total: number; recent_24h: number };
    governance: { pending_actions: number };
    audit: { total_events: number; recent_24h: number };
    resource_quotas_exceeded: number;
  };
  engines: any;
  dcc: { certified_departments: number; total_departments: number; completion_pct: number };
  health: Record<string, string>;
}

const SECTIONS = [
  { href: "/super-admin/ai-command-center/departments", label: "Departments", icon: Layers },
  { href: "/super-admin/ai-command-center/agents", label: "AI Workforce", icon: Bot },
  { href: "/super-admin/ai-command-center/models", label: "Models", icon: Cpu },
  { href: "/super-admin/ai-command-center/skills", label: "Skills", icon: Brain },
  { href: "/super-admin/ai-command-center/prompts", label: "Prompts", icon: FileText },
  { href: "/super-admin/ai-command-center/sops", label: "SOPs", icon: ClipboardCheck },
  { href: "/super-admin/ai-command-center/rules", label: "Constitution", icon: Shield },
  { href: "/super-admin/ai-command-center/workflows", label: "Workflows", icon: Workflow },
  { href: "/super-admin/ai-command-center/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/super-admin/ai-command-center/rag", label: "RAG", icon: Network },
  { href: "/super-admin/ai-command-center/memory", label: "Memory", icon: HardDrive },
  { href: "/super-admin/ai-command-center/evaluation", label: "Evaluation", icon: Activity },
  { href: "/super-admin/ai-command-center/governance", label: "Governance", icon: Gavel },
  { href: "/super-admin/ai-command-center/security", label: "Security", icon: Lock },
  { href: "/super-admin/ai-command-center/audit", label: "Audit", icon: ScrollText },
  { href: "/super-admin/ai-command-center/observability", label: "Observability", icon: Radio },
  { href: "/super-admin/ai-command-center/certification", label: "DCC Certification", icon: CheckCircle2 },
];

export default function AICommandCenterPage() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/super-admin/ai-command-center", { credentials: "same-origin" });
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (e) {
        // Use empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  const o = data?.overview;
  const kpis = [
    { label: "Departments", value: o?.departments.total ?? 0, sub: `${o?.departments.certified ?? 0} certified`, icon: Layers, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "AI Employees", value: o?.ai_employees.total ?? 0, sub: `${o?.ai_employees.active ?? 0} active`, icon: Bot, color: "text-green-600", bg: "bg-green-50" },
    { label: "Loop Agents", value: o?.ai_employees.loop_agents ?? 0, sub: "sub-agents", icon: GitBranch, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "AI Models", value: o?.models.total ?? 0, sub: `${o?.models.production ?? 0} production`, icon: Cpu, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Skills", value: o?.skills ?? 0, sub: "registry", icon: Brain, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Prompts", value: o?.prompts ?? 0, sub: "templates", icon: FileText, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "SOPs", value: o?.sops ?? 0, sub: "procedures", icon: ClipboardCheck, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Rules", value: o?.constitutional_rules ?? 0, sub: "constitutional", icon: Shield, color: "text-red-600", bg: "bg-red-50" },
    { label: "Workflows", value: o?.workflows.total ?? 0, sub: `${o?.workflows.active ?? 0} active`, icon: Workflow, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Events (24h)", value: o?.events.recent_24h ?? 0, sub: `${o?.events.total ?? 0} total`, icon: Radio, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Audit Events", value: o?.audit.total_events ?? 0, sub: `${o?.audit.recent_24h ?? 0} today`, icon: ScrollText, color: "text-gray-600", bg: "bg-gray-50" },
    { label: "Failed Agents", value: o?.ai_employees.failed ?? 0, sub: "needs attention", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-alo-text">AI Command Center</h1>
        <p className="text-alo-text-muted mt-1">
          Master control plane for 100 Departments · 2,000+ AI Employees · 10,000+ Skills · 50,000+ Prompts
        </p>
      </div>

      {/* DCC Progress */}
      <Card className="border-alo-brand/20 bg-gradient-to-r from-alo-brand-light to-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-alo-text flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-alo-brand" />
                Department Capability Certification (DCC)
              </h2>
              <p className="text-sm text-alo-text-muted">
                Departments must be DCC-certified before creating agents
              </p>
            </div>
            <Badge variant="brand" className="text-sm">
              {data?.dcc.completion_pct ?? 0}% Certified
            </Badge>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="bg-alo-brand h-full rounded-full transition-all"
              style={{ width: `${data?.dcc.completion_pct ?? 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-green-600 font-semibold">{data?.dcc.certified_departments ?? 0} Certified</span>
            <span className="text-alo-text-muted">{data?.dcc.total_departments ?? 0} Total Departments</span>
          </div>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg ${kpi.bg} mb-2`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold text-alo-text">{kpi.value}</p>
                <p className="text-xs text-alo-text-muted">{kpi.label}</p>
                <p className="text-[10px] text-alo-text-muted/70 mt-0.5">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Command Center Sections</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group block p-4 rounded-xl border border-gray-200 hover:border-alo-brand hover:shadow-md transition-all bg-white"
              >
                <Icon className="w-6 h-6 text-alo-brand mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold text-alo-text group-hover:text-alo-brand">
                  {section.label}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader><CardTitle className="text-base">System Health</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(data?.health ?? {}).map(([key, status]) => (
              <div key={key} className="flex items-center gap-2 p-2 rounded border">
                <div className={`w-2 h-2 rounded-full ${
                  status === "healthy" ? "bg-green-500" :
                  status === "degraded" ? "bg-yellow-500" : "bg-gray-400"
                }`} />
                <span className="text-xs font-medium capitalize">{key.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-alo-text-muted ml-auto">{status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

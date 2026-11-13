"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Bot, GitBranch } from "lucide-react";

export default function AgentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super-admin/ai-command-center", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto my-20" />;

  const a = data?.overview.ai_employees;
  const kpis = [
    { label: "Total AI Employees", value: a?.total ?? 0, icon: Bot, color: "text-blue-600" },
    { label: "Active", value: a?.active ?? 0, icon: Bot, color: "text-green-600" },
    { label: "Failed", value: a?.failed ?? 0, icon: Bot, color: "text-red-600" },
    { label: "Paused", value: a?.paused ?? 0, icon: Bot, color: "text-yellow-600" },
    { label: "Training", value: a?.training ?? 0, icon: Bot, color: "text-purple-600" },
    { label: "Loop Agents", value: a?.loop_agents ?? 0, icon: GitBranch, color: "text-indigo-600" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">AI Workforce</h1>
        <p className="text-alo-text-muted">2,000+ AI Employees · 100 Departments · ~20 per department</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}><CardContent className="p-4">
              <Icon className={`w-6 h-6 ${k.color} mb-2`} />
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="text-xs text-muted">{k.label}</p>
            </CardContent></Card>
          );
        })}
      </div>
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Hierarchy</h3>
          <pre className="text-xs text-muted bg-gray-50 p-3 rounded">
{`ENTERPRISE AI COMMAND
        │
100 DEPARTMENTS
        │
DEPARTMENT AI LEADS
        │
AI SPECIALISTS
        │
TASK AGENTS
        │
LOOP / SUB-AGENTS`}
          </pre>
          <p className="text-sm text-muted mt-2">Max depth: MODEL → AGENT → LOOP_AGENT (configurable). No uncontrolled recursive agent explosion.</p>
        </CardContent>
      </Card>
    </div>
  );
}

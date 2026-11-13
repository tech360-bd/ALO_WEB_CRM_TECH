"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Layers, CheckCircle2, XCircle } from "lucide-react";

export default function DepartmentsPage() {
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

  const d = data?.overview.departments;
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Departments</h1>
        <p className="text-alo-text-muted">100 Department Enterprise Registry</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><Layers className="w-6 h-6 text-blue-600 mb-2" /><p className="text-2xl font-bold">{d?.total ?? 0}</p><p className="text-xs text-muted">Total</p></CardContent></Card>
        <Card><CardContent className="p-4"><CheckCircle2 className="w-6 h-6 text-green-600 mb-2" /><p className="text-2xl font-bold">{d?.certified ?? 0}</p><p className="text-xs text-muted">Certified</p></CardContent></Card>
        <Card><CardContent className="p-4"><XCircle className="w-6 h-6 text-orange-600 mb-2" /><p className="text-2xl font-bold">{d?.uncertified ?? 0}</p><p className="text-xs text-muted">Uncertified</p></CardContent></Card>
        <Card><CardContent className="p-4"><Layers className="w-6 h-6 text-indigo-600 mb-2" /><p className="text-2xl font-bold">{d?.active ?? 0}</p><p className="text-xs text-muted">Active</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">DCC Requirement</h3>
          <p className="text-sm text-muted">Each department must pass Department Capability Certification (DCC) before creating AI agents. Certification requires: SOP Coverage ≥ 95%, Knowledge Coverage ≥ 95%, Skill Coverage ≥ 95%, Test Pass Rate ≥ 95%, KPI Achievement ≥ 90%, Security Compliance = 100%, Audit Compliance = 100%, Self-Recovery ≥ 90%, Human Escalation ≤ 10%.</p>
        </CardContent>
      </Card>
    </div>
  );
}

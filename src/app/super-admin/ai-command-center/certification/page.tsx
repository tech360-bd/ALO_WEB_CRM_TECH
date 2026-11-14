"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function CertificationPage() {
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

  const dcc = data?.dcc;
  const thresholds = [
    { name: "SOP Coverage", target: "≥ 95%", value: "95%" },
    { name: "Knowledge Coverage", target: "≥ 95%", value: "95%" },
    { name: "Skill Coverage", target: "≥ 95%", value: "95%" },
    { name: "Test Pass Rate", target: "≥ 95%", value: "95%" },
    { name: "KPI Achievement", target: "≥ 90%", value: "90%" },
    { name: "Security Compliance", target: "= 100%", value: "100%" },
    { name: "Audit Compliance", target: "= 100%", value: "100%" },
    { name: "Self-Recovery Success", target: "≥ 90%", value: "90%" },
    { name: "Human Escalation Rate", target: "≤ 10%", value: "10%" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">DCC Certification</h1>
        <p className="text-alo-text-muted">Department Capability Certification — mandatory before agent creation</p>
      </div>

      <Card className="border-alo-brand/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Overall Progress</h2>
              <p className="text-sm text-muted">Departments with active DCC certification</p>
            </div>
            <Badge variant="brand" className="text-lg px-4 py-1">{dcc?.completion_pct ?? 0}%</Badge>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden mb-2">
            <div className="bg-alo-brand h-full rounded-full" style={{ width: `${dcc?.completion_pct ?? 0}%` }} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-semibold">{dcc?.certified_departments ?? 0} Certified</span>
            <span className="text-muted">{dcc?.total_departments ?? 0} Total</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Certification Thresholds (§12)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {thresholds.map((t) => (
              <div key={t.name} className="p-3 rounded-lg border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted">Target: {t.target}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Certification Status Values</h3>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-100 text-green-800">CERTIFIED</Badge>
            <Badge className="bg-yellow-100 text-yellow-800">CONDITIONALLY_CERTIFIED</Badge>
            <Badge className="bg-red-100 text-red-800">FAILED</Badge>
            <Badge className="bg-gray-100 text-gray-800">EXPIRED</Badge>
            <Badge className="bg-blue-100 text-blue-800">UNDER_REVIEW</Badge>
          </div>
          <p className="text-sm text-muted mt-3">
            If ANY mandatory condition fails: DCC = FAILED, agent creation permission = BLOCKED.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

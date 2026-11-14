"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function WorkflowsPage() {
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

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold capitalize">workflows</h1>
        <p className="text-alo-text-muted">Enterprise AI Command Center — workflows section</p>
      </div>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted">
            This section connects to the enterprise AI engine for workflows. Data is loaded from the
            unified command center API and the dedicated workflows engine module in src/lib/enterprise-ai/.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

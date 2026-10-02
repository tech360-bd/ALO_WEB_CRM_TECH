"use client";

import * as React from "react";
import { useStudentId } from "@/hooks/use-student-id";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";

type ChecklistItem = {
  id: string;
  itemName?: string;
  category?: string;
  status?: string;
  isBlocking?: boolean;
};

type VisaReadinessData = {
  checklist?: ChecklistItem[];
  totalItems?: number;
  blockingItems?: number;
  overallScore?: number;
  riskLevel?: string;
  docScore?: number;
};

const RISK_COLORS: Record<string, string> = {
  READY: "bg-emerald-100 text-emerald-700",
  NEEDS_DOCUMENT_UPDATE: "bg-amber-100 text-amber-700",
  HIGH_RISK: "bg-rose-100 text-rose-700",
  HUMAN_REVIEW_REQUIRED: "bg-violet-100 text-violet-700",
  UNKNOWN: "bg-slate-100 text-slate-700",
};

export function StudentVisaReadiness() {
  const { studentId } = useStudentId();

  const [data, setData] = React.useState<VisaReadinessData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetch(`/api/student/visa-readiness?studentId=${studentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (!studentId) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader title="Visa Readiness" subtitle="AI-powered assessment" icon="ShieldCheck" />
        <EmptyState
          icon="LogIn"
          title="Please log in"
          description="Sign in to your student account to view your visa readiness assessment."
        />
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-center text-[#5A7299]">Loading...</div>;
  }

  const score = data?.overallScore || 0;
  const risk = data?.riskLevel || "UNKNOWN";
  const riskColor = RISK_COLORS[risk] || RISK_COLORS.UNKNOWN;
  const checklist = data?.checklist || [];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Visa Readiness"
        subtitle="AI-powered assessment"
        icon="ShieldCheck"
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border border-[#DCE8F5] bg-white">
          <CardContent className="p-4 text-center sm:p-6">
            <p className="text-sm font-bold uppercase text-[#5A7299]">
              Overall Readiness
            </p>
            <p className="mt-4 text-5xl font-black text-[#0B5ED7]">{score}%</p>
            <Badge className={cn("mt-4 capitalize", riskColor)}>
              {risk.replace(/_/g, " ").toLowerCase()}
            </Badge>
            <Progress value={score} className="mt-4" />
            <p className="mt-3 text-xs text-[#5A7299]">
              AI assessment only — not a visa guarantee.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl border border-[#DCE8F5] bg-white">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-bold text-[#0B2447]">
              Visa Checklist ({data?.totalItems || 0} items, {data?.blockingItems || 0}{" "}
              blocking)
            </h3>
            {!checklist || checklist.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon="ListChecks"
                  title="No checklist yet"
                  description="Generated when you reach visa stage."
                />
              </div>
            ) : (
              <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#DCE8F5] bg-[#F7FAFE] p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0B2447]">
                        {item.itemName}
                      </p>
                      {item.category && (
                        <p className="text-xs text-[#5A7299]">{item.category}</p>
                      )}
                    </div>
                    <Badge
                      variant={item.status === "APPROVED" ? "default" : "secondary"}
                      className={cn("capitalize shrink-0")}
                    >
                      {(item.status || "pending").toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StudentVisaReadiness;

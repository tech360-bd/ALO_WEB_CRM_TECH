"use client";

import * as React from "react";
import { useStudentId } from "@/hooks/use-student-id";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState } from "@/components/alo/shared";

type ChecklistItem = {
  id: string;
  itemName?: string;
  category?: string;
  status?: string;
  isBlocking?: boolean;
  notes?: string;
};

type VisaReadinessData = {
  checklist?: ChecklistItem[];
  totalItems?: number;
  blockingItems?: number;
  overallScore?: number;
  riskLevel?: string;
};

export function StudentVisaChecklist() {
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
        <PageHeader
          title="Visa Checklist"
          subtitle="Track all documents required for your visa"
          icon="ListChecks"
        />
        <EmptyState
          icon="LogIn"
          title="Please log in"
          description="Sign in to your student account to view your visa document checklist."
        />
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-center text-[var(--alo-text-muted)]">Loading...</div>;
  }

  const checklist = data?.checklist || [];

  const renderStatusIcon = (status?: string) => {
    if (status === "APPROVED") {
      return (
        <div className="flex size-8 items-center justify-center rounded-full bg-crm-success-bg">
          <Icon name="Check" className="size-4 text-crm-success-text" />
        </div>
      );
    }
    if (status === "REJECTED") {
      return (
        <div className="flex size-8 items-center justify-center rounded-full bg-crm-warning-bg">
          <Icon name="X" className="size-4 text-crm-warning-text" />
        </div>
      );
    }
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-crm-warning-bg">
        <Icon name="Clock" className="size-4 text-crm-warning-text" />
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Visa Checklist"
        subtitle="Track all documents required for your visa"
        icon="ListChecks"
      />
      {checklist.length === 0 ? (
        <EmptyState
          icon="ListChecks"
          title="No visa checklist yet"
          description="Generated when you reach the visa stage."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checklist.map((item) => (
            <Card key={item.id} className="rounded-2xl border border-[var(--alo-brand-border)] bg-white">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--alo-text)]">{item.itemName}</p>
                    {item.category && (
                      <Badge variant="outline" className="mt-1">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  {renderStatusIcon(item.status)}
                </div>
                {item.isBlocking && item.status !== "APPROVED" && (
                  <p className="mt-3 text-xs font-semibold text-crm-warning-text">
                    ⚠ Required for visa submission
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentVisaChecklist;

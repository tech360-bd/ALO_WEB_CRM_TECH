"use client";

import * as React from "react";
import { useStudentId } from "@/hooks/use-student-id";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState, StatCard } from "@/components/alo/shared";

type MockTest = {
  id: string;
  testId?: string;
  testType?: string;
  studentId?: string;
  status?: string;
  overallScore?: number;
  listeningScore?: number;
  readingScore?: number;
  writingScore?: number;
  speakingScore?: number;
  createdAt?: string;
};

const TEST_TYPES = [
  { type: "IELTS", label: "IELTS Mock", icon: "BookOpen" },
  { type: "PTE", label: "PTE Mock", icon: "Mic" },
  { type: "TOEFL", label: "TOEFL Mock", icon: "FileText" },
  { type: "DET", label: "Duolingo", icon: "Globe" },
  { type: "OIETC", label: "OIETC / ELLT", icon: "Languages" },
  { type: "GRE", label: "GRE Mock", icon: "Calculator" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

export function StudentMockTests() {
  const { studentId } = useStudentId();
  const [tests, setTests] = React.useState<MockTest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetch(`/api/mock-tests?studentId=${studentId || ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const all: MockTest[] = d.mockTests || [];
        setTests(all.filter((t) => t.studentId === studentId));
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
          title="Mock Test Center"
          subtitle="Practice IELTS, PTE, TOEFL and other English proficiency tests"
          icon="FileCheck2"
        />
        <EmptyState
          icon="LogIn"
          title="Please log in"
          description="Sign in to your student account to access mock tests."
        />
      </div>
    );
  }

  const completed = tests.filter((t) => t.status === "COMPLETED");
  const avgScore = completed.length
    ? (completed.reduce((s, t) => s + (t.overallScore || 0), 0) / completed.length).toFixed(1)
    : "—";
  const creditsRemaining = Math.max(0, 6 - tests.length);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Mock Test Center"
        subtitle="Practice IELTS, PTE, TOEFL and other English proficiency tests"
        icon="FileCheck2"
      />

      {loading ? (
        <div className="text-center text-[#5A7299]">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Tests Taken" value={tests.length} icon="FileCheck2" accent="blue" />
            <StatCard
              label="Avg Overall Score"
              value={avgScore}
              icon="TrendingUp"
              accent="emerald"
              hint="Across all completed tests"
            />
            <StatCard
              label="Credits Remaining"
              value={creditsRemaining}
              icon="Sparkles"
              accent="orange"
              hint="Free mock tests available"
            />
          </div>

          {/* Available tests */}
          <div>
            <h3 className="mb-3 text-lg font-bold text-[#0B2447]">Available Mock Tests</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TEST_TYPES.map((t) => (
                <Card
                  key={t.type}
                  className="rounded-2xl border border-[#DCE8F5] bg-white transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#0057B8]">
                        <Icon name={t.icon} className="size-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[#0B2447]">{t.label}</p>
                        <p className="text-xs text-[#5A7299]">Full-length practice test</p>
                      </div>
                    </div>
                    <Button
                      className="mt-4 w-full bg-[#0057B8] text-white hover:bg-[#003F87]"
                      disabled={creditsRemaining === 0}
                    >
                      <Icon name="Play" className="mr-1.5 size-4" />
                      Start Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Test history */}
          <div>
            <h3 className="mb-3 text-lg font-bold text-[#0B2447]">Test History</h3>
            {tests.length === 0 ? (
              <EmptyState
                icon="History"
                title="No test history"
                description="Take your first mock test to see your results here."
              />
            ) : (
              <Card className="rounded-2xl border border-[#DCE8F5] bg-white">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F7FAFE] text-left text-[#5A7299]">
                        <tr>
                          <th className="px-5 py-3 font-medium">Test ID</th>
                          <th className="px-5 py-3 font-medium">Type</th>
                          <th className="px-5 py-3 font-medium">Overall</th>
                          <th className="px-5 py-3 font-medium">Listening</th>
                          <th className="px-5 py-3 font-medium">Reading</th>
                          <th className="px-5 py-3 font-medium">Writing</th>
                          <th className="px-5 py-3 font-medium">Speaking</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                          <th className="px-5 py-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE8F5]">
                        {tests.map((t) => (
                          <tr key={t.id} className="hover:bg-[#F7FAFE]">
                            <td className="px-5 py-3 font-mono text-[#0B2447]">{t.testId}</td>
                            <td className="px-5 py-3 text-[#0B2447]">{t.testType}</td>
                            <td className="px-5 py-3 font-bold text-[#0057B8]">
                              {t.overallScore?.toFixed(1) || "—"}
                            </td>
                            <td className="px-5 py-3 text-[#5A7299]">
                              {t.listeningScore?.toFixed(1) || "—"}
                            </td>
                            <td className="px-5 py-3 text-[#5A7299]">
                              {t.readingScore?.toFixed(1) || "—"}
                            </td>
                            <td className="px-5 py-3 text-[#5A7299]">
                              {t.writingScore?.toFixed(1) || "—"}
                            </td>
                            <td className="px-5 py-3 text-[#5A7299]">
                              {t.speakingScore?.toFixed(1) || "—"}
                            </td>
                            <td className="px-5 py-3">
                              <Badge
                                className={cn(STATUS_COLORS[t.status || ""] || "bg-slate-100")}
                              >
                                {t.status}
                              </Badge>
                            </td>
                            <td className="px-5 py-3 text-[#5A7299]">
                              {t.createdAt
                                ? new Date(t.createdAt).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default StudentMockTests;

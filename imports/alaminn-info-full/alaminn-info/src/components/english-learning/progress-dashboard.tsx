"use client";

/**
 * ProgressDashboard — client component that fetches the user's
 * enrollments + progress rows from /api/v1/english-learning/progress
 * using the sessionId stored in localStorage.
 *
 * Shows:
 *  - Session ID display (truncated, with copy button)
 *  - List of enrolled courses with progress bars
 *  - List of completed/in-progress lessons and tests with scores
 *  - Empty state if no enrollments yet
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  Copy,
  Check,
  GraduationCap,
  Clock,
  Trophy,
  TrendingUp,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/english-learning/empty-state";
import { cn } from "@/lib/utils";

interface ProgressRow {
  id: string;
  status: string;
  scorePercent: number | null;
  timeSpentMinutes: number;
  lastAttemptAt: string | null;
  attemptsCount: number;
  lessonId: string | null;
  testId: string | null;
  lesson: { id: string; slug: string; title: string; lessonType: string } | null;
  test: { id: string; slug: string; title: string; testType: string } | null;
}

interface Enrollment {
  id: string;
  sessionId: string;
  courseId: string;
  status: string;
  progressPercent: number;
  lastAccessedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  course: {
    id: string;
    slug: string;
    title: string;
    level: string;
    heroImageUrl: string | null;
  };
  progress: ProgressRow[];
}

interface ApiResponse {
  success: boolean;
  data?: { enrollments: Enrollment[]; count: number } | null;
  message?: string;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const KEY = "alaminn-el-session";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

type Phase = "loading" | "ready" | "error";

export function ProgressDashboard() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sid = getSessionId();
    setSessionId(sid);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/v1/english-learning/progress?sessionId=${encodeURIComponent(sid)}`,
          { cache: "no-store" },
        );
        const json = (await res.json().catch(() => null)) as ApiResponse | null;
        if (cancelled) return;
        if (!res.ok || !json?.success || !json.data) {
          throw new Error(json?.message ?? "Could not load progress.");
        }
        setEnrollments(json.data.enrollments);
        setPhase("ready");
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Unknown error.");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = () => {
    setPhase("loading");
    setErrorMsg(null);
    // Re-trigger the effect by toggling state — simpler: re-run the fetch.
    (async () => {
      try {
        const res = await fetch(
          `/api/v1/english-learning/progress?sessionId=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" },
        );
        const json = (await res.json().catch(() => null)) as ApiResponse | null;
        if (!res.ok || !json?.success || !json.data) {
          throw new Error(json?.message ?? "Could not load progress.");
        }
        setEnrollments(json.data.enrollments);
        setPhase("ready");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Unknown error.");
        setPhase("error");
      }
    })();
  };

  const copySessionId = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore — clipboard might be unavailable.
    }
  };

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-20 text-ink-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        Loading your progress…
      </div>
    );
  }

  if (phase === "error") {
    return (
      <Card className="border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="font-display text-base font-bold text-ink-900">
              Could not load progress
            </h3>
            <p className="mt-1 text-sm text-ink-600">{errorMsg}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refresh}
              className="mt-3 gap-1.5 rounded-xl border-ink-200 text-ink-700"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session ID display */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
              Your anonymous session ID
            </div>
            <code className="mt-0.5 block text-xs font-mono text-ink-800">
              {sessionId.slice(0, 24)}…
            </code>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copySessionId}
            className="gap-1.5 rounded-xl border-ink-200 text-ink-700"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy ID
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={GraduationCap}
          label="Enrolled courses"
          value={String(enrollments.length)}
          color="text-blue-600"
        />
        <StatCard
          icon={Trophy}
          label="Completed"
          value={String(
            enrollments.filter((e) => e.status === "completed").length,
          )}
          color="text-emerald-600"
        />
        <StatCard
          icon={Clock}
          label="In progress"
          value={String(
            enrollments.filter((e) => e.status === "started").length,
          )}
          color="text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg progress"
          value={
            enrollments.length > 0
              ? `${Math.round(
                  enrollments.reduce((a, e) => a + e.progressPercent, 0) /
                    enrollments.length,
                )}%`
              : "—"
          }
          color="text-orange-600"
        />
      </div>

      {/* Enrollments */}
      {enrollments.length === 0 ? (
        <EmptyState
          title="No enrollments yet"
          description="Browse courses and click Enroll to start tracking your progress. Your progress will appear here automatically."
          icon={GraduationCap}
          action={{
            label: "Browse courses",
            href: "/english-learning/courses",
          }}
        />
      ) : (
        <div className="space-y-4">
          {enrollments.map((e) => (
            <Card key={e.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-[10px] font-bold uppercase tracking-wider text-blue-700"
                    >
                      {e.course.level}
                    </Badge>
                    <StatusBadge status={e.status} />
                  </div>
                  <h3 className="mt-1.5 font-display text-base font-bold text-ink-900">
                    <Link
                      href={`/english-learning/courses/${e.course.slug}`}
                      className="hover:text-orange-600"
                    >
                      {e.course.title}
                    </Link>
                  </h3>
                  <div className="mt-1 text-[11px] text-ink-500">
                    Enrolled {new Date(e.createdAt).toLocaleDateString()}
                    {e.lastAccessedAt &&
                      ` · Last accessed ${new Date(e.lastAccessedAt).toLocaleDateString()}`}
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="gap-1.5 rounded-xl border-ink-200 text-ink-700"
                >
                  <Link href={`/english-learning/courses/${e.course.slug}`}>
                    Continue
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <span>Course progress</span>
                  <span>{e.progressPercent}%</span>
                </div>
                <Progress value={e.progressPercent} className="h-2" />
              </div>

              {e.progress.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
                    Recent activity
                  </div>
                  {e.progress.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 bg-ink-50/40 p-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        {p.lesson ? (
                          <span className="font-medium text-ink-800">
                            Lesson: {p.lesson.title}
                          </span>
                        ) : p.test ? (
                          <span className="font-medium text-ink-800">
                            Test: {p.test.title}
                          </span>
                        ) : (
                          <span className="text-ink-600">Activity</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {p.scorePercent != null && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold",
                              (p.scorePercent ?? 0) >= 70
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700",
                            )}
                          >
                            {p.scorePercent}%
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold",
                            p.status === "completed"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-blue-200 bg-blue-50 text-blue-700",
                          )}
                        >
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof GraduationCap;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <Card className="p-4 text-center">
      <Icon className={cn("mx-auto h-5 w-5", color)} aria-hidden="true" />
      <div className="mt-1.5 font-display text-xl font-extrabold text-ink-900">
        {value}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        {label}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    enrolled: {
      cls: "border-blue-200 bg-blue-50 text-blue-700",
      label: "Enrolled",
    },
    started: {
      cls: "border-purple-200 bg-purple-50 text-purple-700",
      label: "In progress",
    },
    completed: {
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "Completed",
    },
    abandoned: {
      cls: "border-ink-200 bg-ink-50 text-ink-600",
      label: "Abandoned",
    },
  };
  const cfg = map[status] ?? map.enrolled;
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-bold uppercase tracking-wider", cfg.cls)}
    >
      {cfg.label}
    </Badge>
  );
}

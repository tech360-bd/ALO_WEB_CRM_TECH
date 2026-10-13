/**
 * PracticeTestCard — server component rendering a practice test result.
 */
import Link from "next/link";
import {
  ClipboardCheck,
  Clock,
  ListChecks,
  Target,
  ArrowRight,
  Sparkles,
  Gauge,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TEST_TYPE_MAP } from "@/lib/english-learning/constants";
import type { PracticeTest } from "@/lib/english-learning/types";

interface PracticeTestCardProps {
  test: PracticeTest & { _count?: { questions?: number } };
  className?: string;
}

export function PracticeTestCard({
  test,
  className,
}: PracticeTestCardProps) {
  const detailHref = `/english-learning/practice-tests/${test.slug}`;
  const testType = TEST_TYPE_MAP[test.testType as string];
  const typeLabel = testType?.label ?? test.testType;
  const questionCount = test._count?.questions ?? test.totalQuestions ?? 0;

  // Difficulty / readiness indicator — derived from passing score (0–100).
  // Lower passing score = easier test, higher = harder. Mapped to a 4-step
  // visual meter shown beneath the meta cells.
  const passingScore = test.passingScore ?? 0;
  const difficultyLevel =
    passingScore >= 80
      ? { label: "Advanced", tone: "text-rose-600", fill: 4 }
      : passingScore >= 70
        ? { label: "Upper-int", tone: "text-orange-600", fill: 3 }
        : passingScore >= 60
          ? { label: "Intermediate", tone: "text-amber-600", fill: 2 }
          : passingScore > 0
            ? { label: "Foundational", tone: "text-emerald-600", fill: 1 }
            : { label: "Self-paced", tone: "text-blue-600", fill: 0 };

  return (
    <Card
      className={cn(
        "group relative gap-4 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 focus-within:border-purple-300 focus-within:shadow-lg",
        className,
      )}
    >
      {/* Soft hover glow blob */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-purple-100/0 blur-2xl transition-all duration-500 group-hover:bg-purple-200/40"
        aria-hidden="true"
      />

      {test.isFeatured && (
        <div className="absolute right-0 top-0 z-10 rounded-bl-xl bg-orange-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-orange">
          Featured
        </div>
      )}

      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <Badge
            variant="outline"
            className="mb-1.5 gap-1 border-purple-200 bg-purple-50 text-[11px] font-semibold text-purple-700 transition-colors group-hover:border-purple-300 group-hover:bg-purple-100"
          >
            {typeLabel}
          </Badge>
          <h3 className="font-display text-base font-bold leading-snug text-ink-900 transition-colors group-hover:text-purple-700">
            <Link href={detailHref} className="hover-underline line-clamp-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:rounded">
              {test.title}
            </Link>
          </h3>
          {test.description && (
            <p className="mt-1 line-clamp-2 text-xs text-ink-600">
              {test.description}
            </p>
          )}
        </div>
      </div>

      <div className="relative grid grid-cols-3 gap-2 text-xs">
        {test.durationMinutes != null && (
          <MetaCell icon={<Clock className="h-3 w-3" />} label="Time">
            {test.durationMinutes}m
          </MetaCell>
        )}
        <MetaCell icon={<ListChecks className="h-3 w-3" />} label="Questions">
          {questionCount}
        </MetaCell>
        {test.passingScore != null && (
          <MetaCell icon={<Target className="h-3 w-3" />} label="Pass">
            {test.passingScore}%
          </MetaCell>
        )}
      </div>

      {/* Difficulty / readiness progress indicator — a 4-segment meter
          derived from passingScore. Purely visual; the numeric pass mark
          is shown in the meta cell above for screen readers. */}
      <div className="relative">
        <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
          <span className="inline-flex items-center gap-1 text-ink-500">
            <Gauge className="h-3 w-3" aria-hidden="true" />
            Difficulty
          </span>
          <span className={difficultyLevel.tone}>{difficultyLevel.label}</span>
        </div>
        <div
          className="flex items-center gap-1"
          role="img"
          aria-label={`Difficulty: ${difficultyLevel.label}`}
        >
          {[0, 1, 2, 3].map((seg) => (
            <span
              key={seg}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                seg < difficultyLevel.fill
                  ? "bg-gradient-to-r from-purple-500 to-orange-500"
                  : "bg-ink-100",
              )}
            />
          ))}
        </div>
      </div>

      <Button
        asChild
        size="sm"
        className="relative h-9 gap-1.5 rounded-xl bg-purple-600 text-white transition-all duration-300 hover:bg-purple-700 hover:shadow-md hover:shadow-purple-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
      >
        <Link href={detailHref}>
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Start Test
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </Button>
    </Card>
  );
}

function MetaCell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-ink-100 bg-ink-50/60 px-2.5 py-1.5 transition-colors duration-300 group-hover:border-purple-100 group-hover:bg-purple-50/40">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
        <span className="text-ink-400" aria-hidden="true">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-0.5 text-xs text-ink-800">{children}</div>
    </div>
  );
}

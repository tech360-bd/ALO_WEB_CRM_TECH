/**
 * CourseCard — server component rendering an English Learning course card.
 *
 * Shows: title, level badge, summary, duration / hours / price meta grid,
 * featured ribbon, lesson count, and Apply / View action buttons.
 */
import Link from "next/link";
import {
  GraduationCap,
  Clock,
  BookOpen,
  DollarSign,
  Sparkles,
  ArrowRight,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApplyCta } from "./apply-cta";
import { cn } from "@/lib/utils";
import { COURSE_LEVEL_MAP } from "@/lib/english-learning/constants";
import type { Course } from "@/lib/english-learning/types";

interface CourseCardProps {
  course: Course & { _count?: { lessons?: number } };
  className?: string;
  showActions?: boolean;
}

function formatPrice(
  fee: number | null | undefined,
  currency: string,
): string | null {
  if (fee == null) return null;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(fee);
  } catch {
    return `${currency} ${fee.toLocaleString()}`;
  }
}

export function CourseCard({
  course,
  className,
  showActions = true,
}: CourseCardProps) {
  const detailHref = `/english-learning/courses/${course.slug}`;
  const levelLabel =
    COURSE_LEVEL_MAP[course.level as string]?.label ?? course.level;
  const price = formatPrice(course.priceUsd, course.currency);
  const lessonCount = course._count?.lessons ?? course.lessons?.length ?? 0;

  return (
    <Card
      className={cn(
        "group relative gap-4 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 focus-within:border-blue-300 focus-within:shadow-lg",
        className,
      )}
    >
      {/* Soft hover glow blob */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-100/0 blur-2xl transition-all duration-500 group-hover:bg-blue-200/40"
        aria-hidden="true"
      />

      {course.isFeatured && (
        <div className="absolute right-0 top-0 z-10 rounded-bl-xl bg-orange-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-orange">
          Featured
        </div>
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Badge
            variant="outline"
            className="mb-1.5 gap-1 border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700 transition-colors group-hover:border-blue-300 group-hover:bg-blue-100"
          >
            <GraduationCap className="h-3 w-3" aria-hidden="true" />
            {levelLabel}
          </Badge>
          <h3 className="font-display text-base font-bold leading-snug text-ink-900 transition-colors group-hover:text-blue-700">
            <Link href={detailHref} className="hover-underline line-clamp-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:rounded">
              {course.title}
            </Link>
          </h3>
          {course.summary && (
            <p className="mt-1.5 line-clamp-2 text-xs text-ink-600">
              {course.summary}
            </p>
          )}
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-2 text-xs">
        {course.durationWeeks != null && (
          <MetaCell icon={<Clock className="h-3 w-3" />} label="Duration">
            {course.durationWeeks}w
          </MetaCell>
        )}
        {course.hoursPerWeek != null && (
          <MetaCell icon={<BookOpen className="h-3 w-3" />} label="Hours/wk">
            {course.hoursPerWeek}h
          </MetaCell>
        )}
        {price && (
          <MetaCell icon={<DollarSign className="h-3 w-3" />} label="Price">
            <span className="font-semibold text-emerald-700">{price}</span>
          </MetaCell>
        )}
        {lessonCount > 0 && (
          <MetaCell icon={<Sparkles className="h-3 w-3" />} label="Lessons">
            {lessonCount}
          </MetaCell>
        )}
      </div>

      {course.enrollmentCount > 0 && (
        <div className="relative flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
          <Users className="h-3 w-3" aria-hidden="true" />
          <span className="tabular-nums">{course.enrollmentCount.toLocaleString()}</span>
          <span>enrolled</span>
          {/* Mini enrollment bar — visualizes relative popularity (capped at 500 for scaling) */}
          <span className="ml-auto h-1 w-16 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
              style={{ width: `${Math.min(100, (course.enrollmentCount / 500) * 100)}%` }}
            />
          </span>
        </div>
      )}

      {showActions && (
        <div className="relative mt-1 grid grid-cols-2 gap-2">
          <Button
            asChild
            size="sm"
            className="h-9 rounded-xl bg-blue-600 text-white shadow-blue transition-all duration-300 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
          >
            <Link href={detailHref}>
              View
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
          <ApplyCta
            courseSlug={course.slug}
            level={course.level}
            label="Apply"
            size="sm"
            sourceEntityId={course.id}
            sourceEntityType="course"
            className="h-9 rounded-xl bg-orange-600 text-white shadow-orange transition-all duration-300 hover:bg-orange-700 hover:shadow-md hover:shadow-orange-500/30"
          />
        </div>
      )}

      <div
        className="pointer-events-none absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-blue-100/40 blur-2xl transition-opacity duration-500 group-hover:opacity-150"
        aria-hidden="true"
      />
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
    <div className="rounded-lg border border-ink-100 bg-ink-50/60 px-2.5 py-1.5">
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

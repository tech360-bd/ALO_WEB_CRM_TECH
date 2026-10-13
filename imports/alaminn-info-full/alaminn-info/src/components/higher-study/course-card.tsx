/**
 * CourseCard — server component rendering a course / programme result.
 *
 * Shows: title, university name, country, study-level badge,
 * qualification, duration, study mode, tuition fee (formatted),
 * intake, and action buttons (View / Compare / Save / Apply).
 */
import Link from "next/link";
import {
  GraduationCap,
  Clock,
  BookOpen,
  DollarSign,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "./verification-badge";
import { CompareButton } from "./compare-button";
import { SaveButton } from "./save-button";
import { ApplyCta } from "./apply-cta";
import { cn } from "@/lib/utils";
import { STUDY_LEVEL_MAP } from "@/lib/higher-study/constants";
import type { Course } from "@/lib/higher-study/types";

interface CourseCardProps {
  course: Course;
  className?: string;
  showActions?: boolean;
}

/** Format a tuition fee as a human-readable USD amount (or returns null). */
function formatTuition(
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

/**
 * Render a single course / programme card.
 */
export function CourseCard({
  course,
  className,
  showActions = true,
}: CourseCardProps) {
  const detailHref = `/higher-study/courses/${course.slug}`;
  const studyLevelLabel = STUDY_LEVEL_MAP[course.studyLevel] ?? course.studyLevel;
  const tuition = formatTuition(course.tuitionFee, course.tuitionCurrency);
  const country = course.country;
  const university = course.university;

  return (
    <Card
      className={cn(
        "group relative gap-4 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg",
        className,
      )}
    >
      {/* Featured ribbon */}
      {course.featured && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-orange-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-orange">
          Featured
        </div>
      )}

      {/* Header: title + level badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Badge
            variant="outline"
            className="mb-1.5 gap-1 border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700"
          >
            <GraduationCap className="h-3 w-3" aria-hidden="true" />
            {studyLevelLabel}
          </Badge>
          <h3 className="font-display text-base font-bold leading-snug text-ink-900">
            <Link href={detailHref} className="hover-underline line-clamp-2">
              {course.title}
            </Link>
          </h3>
          {course.qualification && (
            <div className="mt-1 text-xs text-ink-600">
              {course.qualification}
              {course.specialisation ? ` · ${course.specialisation}` : ""}
            </div>
          )}
        </div>
        <VerificationBadge
          status={course.verificationStatus}
          lastVerifiedAt={course.lastVerifiedAt}
          sourceUrl={course.officialSourceUrl}
          className="shrink-0"
        />
      </div>

      {/* University + country */}
      <div className="space-y-1 text-xs">
        {university && (
          <div className="flex items-center gap-1.5 text-ink-700">
            <BookOpen className="h-3 w-3 text-ink-400" aria-hidden="true" />
            <Link
              href={`/higher-study/universities/${university.slug}`}
              className="font-semibold text-ink-800 hover:text-orange-600"
            >
              {university.officialName}
            </Link>
          </div>
        )}
        {country && (
          <div className="flex items-center gap-1.5 text-ink-600">
            <span aria-hidden="true">{country.flagEmoji}</span>
            <span>{country.name}</span>
          </div>
        )}
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {course.duration && (
          <MetaCell icon={<Clock className="h-3 w-3" />} label="Duration">
            {course.duration}
          </MetaCell>
        )}
        {course.studyMode && (
          <MetaCell icon={<BookOpen className="h-3 w-3" />} label="Mode">
            <span className="capitalize">{course.studyMode}</span>
          </MetaCell>
        )}
        {tuition && (
          <MetaCell icon={<DollarSign className="h-3 w-3" />} label="Tuition">
            <span className="font-semibold text-emerald-700">{tuition}</span>
            {course.scholarshipAvailable && (
              <span className="ml-1 text-[10px] font-semibold text-emerald-600">
                + scholarship
              </span>
            )}
          </MetaCell>
        )}
        {course.intake?.name && (
          <MetaCell icon={<Calendar className="h-3 w-3" />} label="Intake">
            {course.intake.name}
          </MetaCell>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="mt-1 grid grid-cols-2 gap-2">
          <Button
            asChild
            size="sm"
            className="h-9 rounded-xl bg-blue-600 text-white shadow-blue transition-all hover:bg-blue-700"
          >
            <Link href={detailHref}>
              View
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
          <ApplyCta
            referralType="course-application"
            courseSlug={course.slug}
            universitySlug={university?.slug}
            countrySlug={country?.slug}
            studyLevel={course.studyLevel}
            label="Apply"
            size="sm"
            className="h-9 rounded-xl bg-orange-600 text-white shadow-orange transition-all hover:bg-orange-700"
          />
          <CompareButton
            entityType="course"
            entitySlug={course.slug}
            entityName={course.title}
            className="h-9 rounded-xl"
          />
          <SaveButton
            entityType="course"
            entitySlug={course.slug}
            entityName={course.title}
            className="h-9 rounded-xl"
          />
        </div>
      )}

      <div
        className="pointer-events-none absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-blue-100/40 blur-2xl"
        aria-hidden="true"
      />
    </Card>
  );
}

// ─── Small helper component ──────────────────────────────────────────

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

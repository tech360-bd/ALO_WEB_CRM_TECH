/**
 * ResearchCard — server component rendering a PhD / research project card.
 *
 * Shows: title, university, department, supervisor name, funding-status
 * badge (green if fully-funded), stipend, deadline, and action buttons
 * (View / Save / Apply).
 */
import Link from "next/link";
import {
  FlaskConical,
  Building2,
  UserCircle,
  Banknote,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "./verification-badge";
import { SaveButton } from "./save-button";
import { ApplyCta } from "./apply-cta";
import { cn } from "@/lib/utils";
import type { ResearchProject } from "@/lib/higher-study/types";

interface ResearchCardProps {
  research: ResearchProject;
  className?: string;
  showActions?: boolean;
}

/**
 * Map a research project's `fundingStatus` to a display config
 * (color + label). Fully-funded projects get the emerald treatment.
 */
function fundingConfig(status?: string | null): {
  label: string;
  className: string;
  dot: string;
} {
  switch (status) {
    case "fully-funded":
      return {
        label: "Fully Funded",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "studentship":
      return {
        label: "Studentship",
        className: "border-blue-200 bg-blue-50 text-blue-700",
        dot: "bg-blue-500",
      };
    case "partially-funded":
      return {
        label: "Partially Funded",
        className: "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
      };
    case "self-funded":
      return {
        label: "Self-Funded",
        className: "border-ink-200 bg-ink-50 text-ink-700",
        dot: "bg-ink-400",
      };
    case "unfunded":
      return {
        label: "Unfunded",
        className: "border-red-200 bg-red-50 text-red-700",
        dot: "bg-red-500",
      };
    default:
      return {
        label: status ?? "Funding TBC",
        className: "border-ink-200 bg-ink-50 text-ink-700",
        dot: "bg-ink-400",
      };
  }
}

/**
 * Render a single research project card.
 */
export function ResearchCard({
  research,
  className,
  showActions = true,
}: ResearchCardProps) {
  const detailHref = `/higher-study/research/${research.slug}`;
  const funding = fundingConfig(research.fundingStatus);
  const university = research.university;
  const supervisor = research.supervisor;
  const isFullyFunded = research.fundingStatus === "fully-funded";

  return (
    <Card
      className={cn(
        "group relative gap-4 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg",
        isFullyFunded && "ring-1 ring-emerald-200",
        className,
      )}
    >
      {/* Featured ribbon */}
      {research.featured && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-orange-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-orange">
          Featured
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Badge
            variant="outline"
            className="mb-1.5 gap-1 border-purple-200 bg-purple-50 text-[11px] font-semibold text-purple-700"
          >
            <FlaskConical className="h-3 w-3" aria-hidden="true" />
            PhD / Research
          </Badge>
          <h3 className="font-display text-base font-bold leading-snug text-ink-900">
            <Link href={detailHref} className="hover-underline line-clamp-2">
              {research.title}
            </Link>
          </h3>
        </div>
        <VerificationBadge
          status={research.verificationStatus}
          lastVerifiedAt={research.lastVerifiedAt}
          sourceUrl={research.officialSourceUrl}
          className="shrink-0"
        />
      </div>

      {/* University + department */}
      <div className="space-y-1 text-xs">
        {university && (
          <div className="flex items-center gap-1.5 text-ink-700">
            <Building2 className="h-3 w-3 text-ink-400" aria-hidden="true" />
            <Link
              href={`/higher-study/universities/${university.slug}`}
              className="font-semibold text-ink-800 hover:text-orange-600"
            >
              {university.officialName}
            </Link>
          </div>
        )}
        {research.department && (
          <div className="text-ink-600">Department: {research.department}</div>
        )}
        {supervisor && (
          <div className="flex items-center gap-1.5 text-ink-600">
            <UserCircle className="h-3 w-3 text-ink-400" aria-hidden="true" />
            <Link
              href={`/higher-study/supervisors/${supervisor.slug}`}
              className="font-medium hover:text-orange-600"
            >
              {supervisor.name}
            </Link>
            {supervisor.academicTitle && (
              <span className="text-ink-400">· {supervisor.academicTitle}</span>
            )}
          </div>
        )}
      </div>

      {/* Funding + stipend */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            funding.className,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", funding.dot)} aria-hidden="true" />
          {funding.label}
        </span>
        {research.stipend && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
            <Banknote className="h-3 w-3" aria-hidden="true" />
            {research.stipend}
          </span>
        )}
        {research.duration && (
          <span className="text-[11px] text-ink-500">{research.duration}</span>
        )}
      </div>

      {/* Deadline */}
      {research.applicationDeadline && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 bg-ink-50 px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-ink-700">
            <CalendarClock className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
            <span>
              Apply by{" "}
              {new Date(research.applicationDeadline).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </span>
        </div>
      )}

      {/* Summary preview */}
      {research.projectSummary && (
        <p className="line-clamp-2 text-xs leading-relaxed text-ink-600">
          {research.projectSummary}
        </p>
      )}

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
            referralType="research-application"
            researchSlug={research.slug}
            universitySlug={university?.slug}
            label="Apply"
            size="sm"
            className="h-9 rounded-xl bg-orange-600 text-white shadow-orange transition-all hover:bg-orange-700"
          />
          <SaveButton
            entityType="research"
            entitySlug={research.slug}
            entityName={research.title}
            className="col-span-2 h-9 rounded-xl"
          />
        </div>
      )}

      <div
        className="pointer-events-none absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-purple-100/40 blur-2xl"
        aria-hidden="true"
      />
    </Card>
  );
}

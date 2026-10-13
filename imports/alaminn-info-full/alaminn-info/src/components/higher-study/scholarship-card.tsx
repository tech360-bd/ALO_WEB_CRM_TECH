/**
 * ScholarshipCard — server component rendering a scholarship result.
 *
 * Shows: name, provider, funding-type badge, funding amount,
 * deadline (with countdown if within 30 days), eligibility preview,
 * and action buttons (View / Compare / Save / Apply).
 */
import Link from "next/link";
import {
  Award,
  Building2,
  DollarSign,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
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
import { FUNDING_TYPE_MAP } from "@/lib/higher-study/constants";
import type { Scholarship } from "@/lib/higher-study/types";

interface ScholarshipCardProps {
  scholarship: Scholarship;
  className?: string;
  showActions?: boolean;
}

/**
 * Compute the days remaining until a deadline. Returns `null` if no
 * deadline or if the deadline has passed.
 */
function daysRemaining(deadline: Date | string | null | undefined): number | null {
  if (!deadline) return null;
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  if (Number.isNaN(d.getTime())) return null;
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

/**
 * Render a single scholarship card with deadline countdown when the
 * deadline is within 30 days.
 */
export function ScholarshipCard({
  scholarship,
  className,
  showActions = true,
}: ScholarshipCardProps) {
  const detailHref = `/higher-study/scholarships/${scholarship.slug}`;
  const fundingTypeLabel = scholarship.fundingType
    ? (FUNDING_TYPE_MAP[scholarship.fundingType] ?? scholarship.fundingType)
    : "Funding";
  const days = daysRemaining(scholarship.deadline);
  const isUrgent = days !== null && days <= 30;
  const isFullyFunded = scholarship.fundingType === "fully-funded";
  const country = scholarship.country;
  const university = scholarship.university;

  return (
    <Card
      className={cn(
        "group relative gap-4 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg",
        isFullyFunded && "ring-1 ring-emerald-200",
        className,
      )}
    >
      {/* Featured ribbon */}
      {scholarship.featured && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-orange-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-orange">
          Featured
        </div>
      )}

      {/* Header: title + verification */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                "gap-1 text-[11px] font-semibold",
                isFullyFunded
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700",
              )}
            >
              <Award className="h-3 w-3" aria-hidden="true" />
              {fundingTypeLabel}
            </Badge>
            {scholarship.tuitionCoverage && (
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-[11px] font-medium text-blue-700"
              >
                Tuition
              </Badge>
            )}
            {scholarship.livingCostCoverage && (
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-[11px] font-medium text-blue-700"
              >
                Living
              </Badge>
            )}
          </div>
          <h3 className="font-display text-base font-bold leading-snug text-ink-900">
            <Link href={detailHref} className="hover-underline line-clamp-2">
              {scholarship.name}
            </Link>
          </h3>
        </div>
        <VerificationBadge
          status={scholarship.verificationStatus}
          lastVerifiedAt={scholarship.lastVerifiedAt}
          sourceUrl={scholarship.officialSourceUrl}
          className="shrink-0"
        />
      </div>

      {/* Provider + university */}
      <div className="space-y-1 text-xs">
        {scholarship.provider && (
          <div className="flex items-center gap-1.5 text-ink-700">
            <Building2 className="h-3 w-3 text-ink-400" aria-hidden="true" />
            <span className="font-medium">{scholarship.provider}</span>
          </div>
        )}
        {university && (
          <div className="flex items-center gap-1.5 text-ink-600">
            <Link
              href={`/higher-study/universities/${university.slug}`}
              className="font-semibold hover:text-orange-600"
            >
              {university.officialName}
            </Link>
            {country && (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true">{country.flagEmoji}</span>
                {country.name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Funding amount */}
      {scholarship.fundingAmount && (
        <div className="rounded-xl border border-ink-100 bg-gradient-to-br from-emerald-50 to-white p-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wide text-ink-500">
              <DollarSign className="mr-1 inline h-3 w-3" aria-hidden="true" />
              Funding
            </span>
            <span className="font-display text-sm font-bold text-emerald-700">
              {scholarship.fundingAmount}
            </span>
          </div>
        </div>
      )}

      {/* Deadline + countdown */}
      {scholarship.deadline && (
        <div
          className={cn(
            "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs",
            isUrgent
              ? "border-orange-200 bg-orange-50"
              : "border-ink-100 bg-ink-50",
          )}
        >
          <span className="inline-flex items-center gap-1.5 font-medium text-ink-700">
            <CalendarClock
              className={cn("h-3.5 w-3.5", isUrgent ? "text-orange-600" : "text-ink-400")}
              aria-hidden="true"
            />
            <span>
              Deadline{" "}
              {new Date(scholarship.deadline).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </span>
          {days !== null && isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              {days === 0 ? "Today!" : `${days}d left`}
            </span>
          )}
          {days !== null && !isUrgent && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              {days}d left
            </span>
          )}
        </div>
      )}

      {/* Eligibility preview */}
      {scholarship.eligibilityCriteria && (
        <p className="line-clamp-2 text-xs leading-relaxed text-ink-600">
          {scholarship.eligibilityCriteria}
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
            referralType="scholarship-application"
            scholarshipSlug={scholarship.slug}
            universitySlug={university?.slug}
            countrySlug={country?.slug}
            label="Apply"
            size="sm"
            className="h-9 rounded-xl bg-orange-600 text-white shadow-orange transition-all hover:bg-orange-700"
          />
          <CompareButton
            entityType="scholarship"
            entitySlug={scholarship.slug}
            entityName={scholarship.name}
            className="h-9 rounded-xl"
          />
          <SaveButton
            entityType="scholarship"
            entitySlug={scholarship.slug}
            entityName={scholarship.name}
            className="h-9 rounded-xl"
          />
        </div>
      )}

      <div
        className="pointer-events-none absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-emerald-100/40 blur-2xl"
        aria-hidden="true"
      />
    </Card>
  );
}

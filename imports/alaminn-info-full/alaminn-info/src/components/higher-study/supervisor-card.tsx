/**
 * SupervisorCard — server component rendering a supervisor profile card.
 *
 * Shows: name, academic title, university, department, research
 * interests (chips), accepting-students badge (green if yes),
 * and a "View Profile" button.
 */
import Link from "next/link";
import {
  UserCircle,
  Building2,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "./verification-badge";
import { SaveButton } from "./save-button";
import { ApplyCta } from "./apply-cta";
import { cn } from "@/lib/utils";
import type { Supervisor } from "@/lib/higher-study/types";

interface SupervisorCardProps {
  supervisor: Supervisor;
  className?: string;
  showActions?: boolean;
}

/** Parse a comma-separated research-interests string into chips. */
function parseInterests(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

/**
 * Render a single supervisor card.
 */
export function SupervisorCard({
  supervisor,
  className,
  showActions = true,
}: SupervisorCardProps) {
  const detailHref = `/higher-study/supervisors/${supervisor.slug}`;
  const interests = parseInterests(supervisor.researchInterests);
  const university = supervisor.university;

  return (
    <Card
      className={cn(
        "group relative gap-4 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg",
        supervisor.acceptingStudents && "ring-1 ring-emerald-200",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-orange-100 text-blue-700">
          <UserCircle className="h-7 w-7" aria-hidden="true" />
          {supervisor.acceptingStudents && (
            <span
              className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white"
              title="Accepting students"
            >
              <CheckCircle2 className="h-2.5 w-2.5 text-white" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold leading-snug text-ink-900">
            <Link href={detailHref} className="hover-underline">
              {supervisor.name}
            </Link>
          </h3>
          <div className="mt-0.5 text-xs text-ink-600">
            {supervisor.academicTitle ?? "Faculty member"}
            {supervisor.department ? ` · ${supervisor.department}` : ""}
          </div>
        </div>
        <VerificationBadge
          status={supervisor.verificationStatus}
          lastVerifiedAt={supervisor.lastVerifiedAt}
          sourceUrl={supervisor.officialSourceUrl}
          className="shrink-0"
        />
      </div>

      {/* University */}
      {university && (
        <div className="flex items-center gap-1.5 text-xs">
          <Building2 className="h-3 w-3 text-ink-400" aria-hidden="true" />
          <Link
            href={`/higher-study/universities/${university.slug}`}
            className="font-semibold text-ink-800 hover:text-orange-600"
          >
            {university.officialName}
          </Link>
        </div>
      )}

      {/* Research interests chips */}
      {interests.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
            <BookOpen className="h-3 w-3" aria-hidden="true" />
            Research interests
          </div>
          <div className="flex flex-wrap gap-1.5">
            {interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Accepting students badge */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs",
          supervisor.acceptingStudents
            ? "border-emerald-200 bg-emerald-50"
            : "border-ink-200 bg-ink-50",
        )}
      >
        <span className="font-semibold uppercase tracking-wide text-ink-500">
          Status
        </span>
        {supervisor.acceptingStudents ? (
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Accepting students
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-bold text-ink-600">
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Not currently accepting
          </span>
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
              View Profile
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
          {supervisor.acceptingStudents ? (
            <ApplyCta
              referralType="supervisor-enquiry"
              supervisorSlug={supervisor.slug}
              universitySlug={university?.slug}
              label="Enquire"
              size="sm"
              className="h-9 rounded-xl bg-orange-600 text-white shadow-orange transition-all hover:bg-orange-700"
            />
          ) : (
            <SaveButton
              entityType="supervisor"
              entitySlug={supervisor.slug}
              entityName={supervisor.name}
              className="h-9 rounded-xl"
            />
          )}
          <SaveButton
            entityType="supervisor"
            entitySlug={supervisor.slug}
            entityName={supervisor.name}
            className="col-span-2 h-9 rounded-xl"
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

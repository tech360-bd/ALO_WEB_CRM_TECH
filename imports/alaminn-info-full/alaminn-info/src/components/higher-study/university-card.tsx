/**
 * UniversityCard — server component rendering a university result card.
 *
 * Shows: name, country flag + name, city, established year, institution
 * type, featured badge, verification badge, ranking preview, study-level
 * chips, tuition range, and action buttons (View / Compare / Save / Apply).
 *
 * No client hooks — the interactive bits (Compare/Save/Apply buttons)
 * are themselves client components composed as children.
 */
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Building2,
  Star,
  GraduationCap,
  ArrowRight,
  Trophy,
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
import type {
  University,
  RankingEntry,
} from "@/lib/higher-study/types";

interface UniversityCardProps {
  university: University;
  /** Optional className for the outer card. */
  className?: string;
  /** Show all action buttons (default true). */
  showActions?: boolean;
}

/**
 * Parse a comma-separated study-levels string (e.g. "masters,phd,mba")
 * into a list of `{ value, label }` for chip rendering.
 */
function parseStudyLevels(raw?: string | null): { value: string; label: string }[] {
  if (!raw) return [];
  const levels = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  return levels.map((value) => ({
    value,
    label: STUDY_LEVEL_MAP[value] ?? value,
  }));
}

/**
 * Parse `rankingsJson` (a JSON string on the University model) into an
 * array of `RankingEntry`. Silently returns `[]` on malformed JSON.
 */
function parseRankings(raw?: string | null): RankingEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is RankingEntry =>
        typeof r === "object" && r !== null && typeof r.provider === "string",
    );
  } catch {
    return [];
  }
}

/**
 * Render a single university result card.
 */
export function UniversityCard({
  university,
  className,
  showActions = true,
}: UniversityCardProps) {
  const detailHref = `/higher-study/universities/${university.slug}`;
  const studyLevels = parseStudyLevels(university.studyLevels);
  const rankings = parseRankings(university.rankingsJson).slice(0, 2);
  const country = university.country;
  const cityName = university.city?.name ?? null;

  return (
    <Card
      className={cn(
        "group relative gap-4 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg",
        className,
      )}
    >
      {/* Featured ribbon */}
      {university.featured && (
        <div className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-xl bg-orange-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-orange">
          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
          Featured
        </div>
      )}

      {/* Header: logo + name + verification */}
      <div className="flex items-start gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl grad-intelligence text-white">
          {university.logoUrl ? (
            <img
              src={university.logoUrl}
              alt={`${university.officialName} logo`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Building2 className="h-6 w-6" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold leading-snug text-ink-900">
            <Link
              href={detailHref}
              className="hover-underline line-clamp-2"
            >
              {university.officialName}
            </Link>
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-600">
            {country && (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true">{country.flagEmoji}</span>
                <span className="font-medium">{country.name}</span>
              </span>
            )}
            {cityName && (
              <>
                <span className="text-ink-300" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {cityName}
                </span>
              </>
            )}
          </div>
        </div>
        <VerificationBadge
          status={university.verificationStatus}
          lastVerifiedAt={university.lastVerifiedAt}
          sourceUrl={university.officialSourceUrl}
          className="shrink-0"
        />
      </div>

      {/* Meta row: established + type */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {university.establishedYear && (
          <Badge
            variant="outline"
            className="gap-1 border-ink-200 bg-ink-50 font-medium text-ink-600"
          >
            <Calendar className="h-3 w-3" aria-hidden="true" />
            Est. {university.establishedYear}
          </Badge>
        )}
        {university.institutionType && (
          <Badge
            variant="outline"
            className="gap-1 border-blue-200 bg-blue-50 font-medium capitalize text-blue-700"
          >
            <Building2 className="h-3 w-3" aria-hidden="true" />
            {university.institutionType}
          </Badge>
        )}
      </div>

      {/* Ranking preview */}
      {rankings.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {rankings.map((r, idx) => (
            <span
              key={`${r.provider}-${idx}`}
              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200"
            >
              <Trophy className="h-3 w-3" aria-hidden="true" />
              {r.provider} #{r.rank}
              {r.year ? ` (${r.year})` : ""}
            </span>
          ))}
        </div>
      )}

      {/* Study levels */}
      {studyLevels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {studyLevels.map((lvl) => (
            <span
              key={lvl.value}
              className="inline-flex items-center gap-1 rounded-md bg-ink-50 px-2 py-0.5 text-[11px] font-medium text-ink-700 ring-1 ring-ink-200"
            >
              <GraduationCap className="h-3 w-3" aria-hidden="true" />
              {lvl.label}
            </span>
          ))}
        </div>
      )}

      {/* Tuition range */}
      {university.tuitionFeeRange && (
        <div className="rounded-xl border border-ink-100 bg-gradient-to-br from-ink-50 to-white p-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wide text-ink-500">
              Tuition range
            </span>
            <span className="font-display text-sm font-bold text-ink-900">
              {university.tuitionFeeRange}
            </span>
          </div>
        </div>
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
            referralType="university-application"
            universitySlug={university.slug}
            countrySlug={country?.slug}
            label="Apply"
            size="sm"
            className="h-9 rounded-xl bg-orange-600 text-white shadow-orange transition-all hover:bg-orange-700"
          />
          <CompareButton
            entityType="university"
            entitySlug={university.slug}
            entityName={university.officialName}
            className="h-9 rounded-xl"
          />
          <SaveButton
            entityType="university"
            entitySlug={university.slug}
            entityName={university.officialName}
            className="h-9 rounded-xl"
          />
        </div>
      )}

      {/* Decorative bottom corner */}
      <div
        className="pointer-events-none absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-orange-100/40 blur-2xl"
        aria-hidden="true"
      />
    </Card>
  );
}

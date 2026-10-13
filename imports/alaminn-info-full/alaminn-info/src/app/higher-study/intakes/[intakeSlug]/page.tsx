/**
 * /higher-study/intakes/[intakeSlug]
 * --------------------------------------------------------------------
 * Intake detail page. Renders intake header + all courses with this
 * intake. Application deadline is prominently displayed. Each result
 * is a CourseCard. Paginated 20/page.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, ArrowRight, CalendarClock, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { CourseCard } from "@/components/higher-study/course-card";
import { EmptyState } from "@/components/higher-study/empty-state";
import { PaginationClient } from "@/components/higher-study/pagination-client";
import { PageHero, StatsStrip } from "@/components/higher-study/page-hero";
import { ListPageControls } from "@/components/higher-study/list-page-controls";
import { LoadingSkeleton } from "@/components/higher-study/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import {
  getStringParam,
  getPageParam,
  getLimitParam,
  buildFilterValuesFromParams,
} from "@/app/higher-study/_lib/search-params";
import type { FilterDefinition, FilterValues } from "@/components/higher-study/filter-panel";
import { COUNTRIES_LIST, STUDY_LEVELS } from "@/lib/higher-study/constants";
import type { BreadcrumbItem } from "@/components/higher-study/breadcrumb";
import type { Prisma } from "@prisma/client";
import { formatDate, deadlineCountdown } from "@/app/higher-study/_lib/detail-helpers";

interface PageProps {
  params: Promise<{ intakeSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// ─── Dynamic metadata ─────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { intakeSlug } = await params;
  let intake: { name: string; slug: string; applicationDeadline: Date | null; status: string } | null = null;
  try {
    intake = await db.higherStudyIntake.findUnique({
      where: { slug: intakeSlug },
      select: { name: true, slug: true, applicationDeadline: true, status: true },
    });
  } catch {
    /* ignore */
  }
  if (!intake) {
    return buildHigherStudyMetadata({
      title: "Intake not found — Higher Study",
      description: "The intake you were looking for could not be found.",
      path: `/higher-study/intakes/${intakeSlug}`,
      noindex: true,
    });
  }
  const deadlineStr = intake.applicationDeadline
    ? ` Application deadline: ${formatDate(intake.applicationDeadline) ?? "TBC"}.`
    : "";
  return buildHigherStudyMetadata({
    title: `${intake.name} Intake — Higher Study`,
    description: `Browse all programmes starting in the ${intake.name} intake.${deadlineStr} Filter by country, study level and university.`,
    path: `/higher-study/intakes/${intake.slug}`,
    keywords: [
      `${intake.name} intake`,
      "application deadline",
      "study abroad",
      "course finder",
      "intake",
    ],
  });
}

// ─── Filter definitions ───────────────────────────────────────────────

const FILTERS: FilterDefinition[] = [
  {
    name: "countrySlug",
    label: "Country",
    type: "select",
    options: COUNTRIES_LIST.map((c) => ({
      value: c.slug,
      label: `${c.flagEmoji} ${c.name}`,
    })),
  },
  {
    name: "studyLevel",
    label: "Study level",
    type: "select",
    options: STUDY_LEVELS.map((l) => ({ value: l.value, label: l.label })),
  },
  {
    name: "scholarshipAvailable",
    label: "Scholarship available",
    type: "boolean",
    defaultCollapsed: true,
  },
];

const SORT_OPTIONS = [
  { value: "title-asc", label: "Title A→Z" },
  { value: "title-desc", label: "Title Z→A" },
  { value: "tuition-asc", label: "Tuition: low to high" },
  { value: "tuition-desc", label: "Tuition: high to low" },
  { value: "featured", label: "Featured first" },
];

// ─── Page ─────────────────────────────────────────────────────────────

export default async function IntakeDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { intakeSlug } = await params;
  const sp = await searchParams;

  const intake = await db.higherStudyIntake
    .findUnique({
      where: { slug: intakeSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        startDate: true,
        endDate: true,
        applicationDeadline: true,
        status: true,
      },
    })
    .catch(() => null);

  if (!intake) {
    notFound();
  }

  const page = getPageParam(sp);
  const limit = getLimitParam(sp, 20);
  const countrySlug = getStringParam(sp, "countrySlug");
  const studyLevel = getStringParam(sp, "studyLevel");
  const scholarshipAvailable = getStringParam(sp, "scholarshipAvailable") === "true";
  const sort = getStringParam(sp, "sort") ?? "featured";
  const order = (getStringParam(sp, "order") ?? "asc") as "asc" | "desc";

  const where: Prisma.HigherStudyCourseWhereInput = {
    intakeId: intake.id,
    publicationStatus: "published",
    verificationStatus: { in: ["verified", "published"] },
  };
  if (countrySlug) where.country = { slug: countrySlug };
  if (studyLevel) where.studyLevel = studyLevel;
  if (scholarshipAvailable) where.scholarshipAvailable = true;

  const sortMap: Record<string, string> = {
    "title-asc": "title",
    "title-desc": "title",
    "tuition-asc": "tuitionFee",
    "tuition-desc": "tuitionFee",
    featured: "featured",
  };
  const sortField = sortMap[sort] ?? "featured";
  const orderBy: Prisma.HigherStudyCourseOrderByWithRelationInput[] =
    sort === "featured" || !(sort in sortMap)
      ? [{ featured: "desc" }, { lastVerifiedAt: "desc" }]
      : [{ [sortField]: order }, { title: "asc" }];

  const [total, items, universitiesCount, countriesCount] = await Promise.all([
    db.higherStudyCourse.count({ where }).catch(() => 0),
    db.higherStudyCourse
      .findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          university: { select: { id: true, slug: true, officialName: true } },
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          subject: { select: { id: true, slug: true, name: true } },
          intake: { select: { id: true, slug: true, name: true } },
        },
      })
      .catch(() => []),
    db.higherStudyCourse
      .findMany({
        where: { intakeId: intake.id, publicationStatus: "published" },
        distinct: ["universityId"],
        select: { universityId: true },
      })
      .then((rows) => rows.length)
      .catch(() => 0),
    db.higherStudyCourse
      .findMany({
        where: { intakeId: intake.id, publicationStatus: "published" },
        distinct: ["countryId"],
        select: { countryId: true },
      })
      .then((rows) => rows.length)
      .catch(() => 0),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  const filterValues: FilterValues = buildFilterValuesFromParams(sp, [
    { name: "countrySlug", type: "select" },
    { name: "studyLevel", type: "select" },
    { name: "scholarshipAvailable", type: "boolean" },
  ]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Intakes", href: "/higher-study/courses" },
    { label: intake.name },
  ];

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Courses", url: `${HIGHER_STUDY_BASE_URL}/higher-study/courses` },
    { name: intake.name, url: `${HIGHER_STUDY_BASE_URL}/higher-study/intakes/${intake.slug}` },
  ]);

  const deadline = intake.applicationDeadline;
  const countdown = deadlineCountdown(deadline);

  const statusConfig: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    upcoming: { label: "Upcoming", className: "border-blue-200 bg-blue-50 text-blue-700" },
    closed: { label: "Closed", className: "border-ink-200 bg-ink-50 text-ink-600" },
  };
  const statusInfo = statusConfig[intake.status] ?? statusConfig.open;

  return (
    <>
      <HigherStudyBreadcrumb
        items={breadcrumbItems}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="Intake"
        title={`${intake.name} Intake`}
        description={`Browse all programmes starting in the ${intake.name} intake. Apply through ALO Education with verified referral tracking.`}
      >
        {/* Deadline banner */}
        {deadline && (
          <div
            className={
              countdown?.urgent
                ? "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4"
                : "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft"
            }
          >
            <div className="flex items-center gap-3">
              <div
                className={
                  countdown?.urgent
                    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white"
                    : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"
                }
              >
                <CalendarClock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  Application deadline
                </div>
                <div className="font-display text-base font-extrabold text-ink-900">
                  {formatDate(deadline, "d MMM yyyy") ?? "—"}
                </div>
              </div>
            </div>
            {countdown && (
              <Badge
                className={
                  countdown.urgent
                    ? "gap-1 bg-orange-600 text-[11px] font-bold uppercase tracking-wider text-white"
                    : "gap-1 bg-emerald-100 text-[11px] font-bold uppercase tracking-wider text-emerald-700"
                }
              >
                {countdown.urgent && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
                {countdown.label}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-4">
          <StatsStrip
            stats={[
              { label: "Programmes", value: total },
              { label: "Universities", value: universitiesCount },
              { label: "Countries", value: countriesCount },
              {
                label: "Status",
                value: statusInfo.label,
              },
            ]}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href="/higher-study/courses"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-800 transition-colors hover:bg-blue-50"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
            All courses
          </Link>
          <span className="inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700">
            <Calendar className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
            {intake.startDate ? `Starts ${formatDate(intake.startDate, "d MMM yyyy")}` : "Start date TBC"}
          </span>
        </div>
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <ListPageControls
          searchPlaceholder={`Search ${intake.name} courses…`}
          searchValue={getStringParam(sp, "q") ?? ""}
          filters={FILTERS}
          filterValues={filterValues}
          sortOptions={SORT_OPTIONS}
          sortValue={sort}
          orderValue={order}
          searchAriaLabel={`Search ${intake.name} courses`}
        />

        <div className="mt-5">
          {items.length === 0 ? (
            <EmptyState
              title={`No courses for the ${intake.name} intake match your filters`}
              description="Try removing some filters or browse all courses."
              icon={Calendar}
              action={{
                label: "Browse all courses",
                href: "/higher-study/courses",
              }}
            />
          ) : (
            <Suspense fallback={<LoadingSkeleton type="course" count={6} />}>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <CourseCard key={c.id} course={c as never} />
                ))}
              </div>
            </Suspense>
          )}
        </div>

        {paginationMeta.total > 0 && (
          <div className="mt-6">
            <PaginationClient
              page={paginationMeta.page}
              limit={paginationMeta.limit}
              total={paginationMeta.total}
              totalPages={paginationMeta.totalPages}
              hasNext={paginationMeta.hasNext}
              hasPrev={paginationMeta.hasPrev}
            />
          </div>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}

/**
 * /higher-study/subjects/[subjectSlug]
 * --------------------------------------------------------------------
 * Subject detail page. Renders subject header + all courses in this
 * subject. Filterable by country, study level and tuition range.
 * Paginated 20/page. Each result is a CourseCard.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowRight, GraduationCap } from "lucide-react";
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
import { Suspense } from "react";
import {
  getStringParam,
  getNumberParam,
  getPageParam,
  getLimitParam,
  buildFilterValuesFromParams,
} from "@/app/higher-study/_lib/search-params";
import type { FilterDefinition, FilterValues } from "@/components/higher-study/filter-panel";
import { COUNTRIES_LIST, STUDY_LEVELS } from "@/lib/higher-study/constants";
import type { BreadcrumbItem } from "@/components/higher-study/breadcrumb";
import type { Prisma } from "@prisma/client";

interface PageProps {
  params: Promise<{ subjectSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// ─── Dynamic metadata ─────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { subjectSlug } = await params;
  let subject: { name: string; slug: string; description: string | null; category: string | null } | null = null;
  try {
    subject = await db.higherStudySubject.findUnique({
      where: { slug: subjectSlug },
      select: { name: true, slug: true, description: true, category: true },
    });
  } catch {
    /* ignore */
  }
  if (!subject) {
    return buildHigherStudyMetadata({
      title: "Subject not found — Higher Study",
      description: "The subject you were looking for could not be found.",
      path: `/higher-study/subjects/${subjectSlug}`,
      noindex: true,
    });
  }
  const description = subject.description
    ? subject.description.slice(0, 160)
    : `Browse all ${subject.name} courses across 30 destinations. Filter by country, study level and tuition range.`;
  return buildHigherStudyMetadata({
    title: `${subject.name} Courses — Higher Study`,
    description,
    path: `/higher-study/subjects/${subject.slug}`,
    keywords: [
      `${subject.name} courses`,
      `${subject.name} programmes`,
      `study ${subject.name}`,
      "study abroad",
      "course finder",
      subject.category ?? "",
    ].filter(Boolean) as string[],
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
  {
    name: "workExperienceRequired",
    label: "Work experience required",
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

export default async function SubjectDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { subjectSlug } = await params;
  const sp = await searchParams;

  const subject = await db.higherStudySubject
    .findUnique({
      where: { slug: subjectSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        description: true,
        iconUrl: true,
      },
    })
    .catch(() => null);

  if (!subject) {
    notFound();
  }

  const page = getPageParam(sp);
  const limit = getLimitParam(sp, 20);
  const countrySlug = getStringParam(sp, "countrySlug");
  const studyLevel = getStringParam(sp, "studyLevel");
  const scholarshipAvailable = getStringParam(sp, "scholarshipAvailable") === "true";
  const workExp = getStringParam(sp, "workExperienceRequired") === "true";
  const maxTuition = getNumberParam(sp, "maxTuitionFee");
  const sort = getStringParam(sp, "sort") ?? "featured";
  const order = (getStringParam(sp, "order") ?? "asc") as "asc" | "desc";

  const where: Prisma.HigherStudyCourseWhereInput = {
    subjectId: subject.id,
    publicationStatus: "published",
    verificationStatus: { in: ["verified", "published"] },
  };
  if (countrySlug) where.country = { slug: countrySlug };
  if (studyLevel) where.studyLevel = studyLevel;
  if (scholarshipAvailable) where.scholarshipAvailable = true;
  if (workExp) where.workExperienceRequired = true;
  if (typeof maxTuition === "number") where.tuitionFee = { lte: maxTuition };

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

  const [total, items, countriesCount, universitiesCount] = await Promise.all([
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
        where: { subjectId: subject.id, publicationStatus: "published" },
        distinct: ["countryId"],
        select: { countryId: true },
      })
      .then((rows) => rows.length)
      .catch(() => 0),
    db.higherStudyCourse
      .findMany({
        where: { subjectId: subject.id, publicationStatus: "published" },
        distinct: ["universityId"],
        select: { universityId: true },
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
    { name: "workExperienceRequired", type: "boolean" },
  ]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Subjects", href: "/higher-study/courses" },
    { label: subject.name },
  ];

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Courses", url: `${HIGHER_STUDY_BASE_URL}/higher-study/courses` },
    { name: subject.name, url: `${HIGHER_STUDY_BASE_URL}/higher-study/subjects/${subject.slug}` },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={breadcrumbItems}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow={subject.category ?? "Subject"}
        title={`${subject.name} Courses`}
        description={subject.description ?? `Browse all ${subject.name} courses across our 30 study destinations. Filter by country, study level and tuition range to find the right programme for you.`}
      >
        <StatsStrip
          stats={[
            { label: "Courses", value: total },
            { label: "Universities", value: universitiesCount },
            { label: "Countries", value: countriesCount },
            { label: "Study levels", value: STUDY_LEVELS.length },
          ]}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href="/higher-study/courses"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-800 transition-colors hover:bg-blue-50"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
            All courses
          </Link>
          <Link
            href="/higher-study/scholarships"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-800 transition-colors hover:bg-blue-50"
          >
            <GraduationCap className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
            Scholarships for {subject.name}
          </Link>
        </div>
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <ListPageControls
          searchPlaceholder={`Search ${subject.name} courses…`}
          searchValue={getStringParam(sp, "q") ?? ""}
          filters={FILTERS}
          filterValues={filterValues}
          sortOptions={SORT_OPTIONS}
          sortValue={sort}
          orderValue={order}
          searchAriaLabel={`Search ${subject.name} courses`}
        />

        <div className="mt-5">
          {items.length === 0 ? (
            <EmptyState
              title={`No ${subject.name} courses match your filters`}
              description="Try removing some filters or widening your search."
              icon={BookOpen}
              action={{
                label: `Browse all ${subject.name} courses`,
                href: `/higher-study/subjects/${subject.slug}`,
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

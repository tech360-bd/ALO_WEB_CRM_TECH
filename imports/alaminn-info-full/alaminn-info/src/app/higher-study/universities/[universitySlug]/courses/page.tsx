/**
 * /higher-study/universities/[universitySlug]/courses
 * --------------------------------------------------------------------
 * Lists all courses at a single university. Filterable by study level,
 * subject and intake. Paginated 20/page.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Building2 } from "lucide-react";
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
import {
  PageHero,
} from "@/components/higher-study/page-hero";
import { ListPageControls } from "@/components/higher-study/list-page-controls";
import { LoadingSkeleton } from "@/components/higher-study/loading-skeleton";
import { Suspense } from "react";
import {
  getStringParam,
  getPageParam,
  getLimitParam,
  buildFilterValuesFromParams,
} from "@/app/higher-study/_lib/search-params";
import type { FilterDefinition, FilterValues } from "@/components/higher-study/filter-panel";
import { STUDY_LEVELS } from "@/lib/higher-study/constants";
import type { BreadcrumbItem } from "@/components/higher-study/breadcrumb";
import type { Prisma } from "@prisma/client";

interface PageProps {
  params: Promise<{ universitySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// ─── Dynamic metadata ─────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { universitySlug } = await params;
  let name: string | null = null;
  try {
    const u = await db.higherStudyUniversity.findUnique({
      where: { slug: universitySlug },
      select: { officialName: true },
    });
    name = u?.officialName ?? null;
  } catch {
    /* ignore */
  }
  if (!name) {
    return buildHigherStudyMetadata({
      title: "University not found — Higher Study",
      description: "The university you were looking for could not be found.",
      path: `/higher-study/universities/${universitySlug}/courses`,
      noindex: true,
    });
  }
  return buildHigherStudyMetadata({
    title: `Courses at ${name} — Higher Study`,
    description: `Browse all programmes at ${name}. Filter by study level, subject and intake. Apply through ALO Education with verified referral tracking.`,
    path: `/higher-study/universities/${universitySlug}/courses`,
    keywords: [`${name} courses`, `${name} programmes`, "study abroad", "course finder"],
  });
}

// ─── Filter definitions ───────────────────────────────────────────────

const FILTERS: FilterDefinition[] = [
  {
    name: "studyLevel",
    label: "Study level",
    type: "select",
    options: STUDY_LEVELS.map((l) => ({ value: l.value, label: l.label })),
  },
  {
    name: "intake",
    label: "Intake",
    type: "select",
    options: [], // populated dynamically below
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

export default async function UniversityCoursesPage({
  params,
  searchParams,
}: PageProps) {
  const { universitySlug } = await params;
  const sp = await searchParams;

  // Fetch the university first (for the hero + 404).
  const university = await db.higherStudyUniversity
    .findUnique({
      where: { slug: universitySlug },
      select: {
        id: true,
        slug: true,
        officialName: true,
        country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
        city: { select: { id: true, slug: true, name: true } },
      },
    })
    .catch(() => null);

  if (!university) {
    notFound();
  }

  // Fetch filter option lists.
  const [subjects, intakes] = await Promise.all([
    db.higherStudySubject
      .findMany({
        where: { courses: { some: { universityId: university.id } } },
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
      })
      .catch(() => []),
    db.higherStudyIntake
      .findMany({
        where: { courses: { some: { universityId: university.id } } },
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
      })
      .catch(() => []),
  ]);

  // Inject dynamic options into the FILTERS list (intake + subject).
  const dynamicFilters: FilterDefinition[] = [
    FILTERS[0],
    {
      name: "subject",
      label: "Subject",
      type: "select",
      options: subjects.map((s) => ({ value: s.slug, label: s.name })),
    },
    {
      name: "intake",
      label: "Intake",
      type: "select",
      options: intakes.map((i) => ({ value: i.slug, label: i.name })),
    },
    ...FILTERS.slice(2),
  ];

  // Parse search params.
  const page = getPageParam(sp);
  const limit = getLimitParam(sp, 20);
  const studyLevel = getStringParam(sp, "studyLevel");
  const subject = getStringParam(sp, "subject");
  const intake = getStringParam(sp, "intake");
  const scholarshipAvailable = getStringParam(sp, "scholarshipAvailable") === "true";
  const workExp = getStringParam(sp, "workExperienceRequired") === "true";
  const sort = getStringParam(sp, "sort") ?? "featured";
  const order = (getStringParam(sp, "order") ?? "asc") as "asc" | "desc";

  const where: Prisma.HigherStudyCourseWhereInput = {
    universityId: university.id,
    publicationStatus: "published",
    verificationStatus: { in: ["verified", "published"] },
  };
  if (studyLevel) where.studyLevel = studyLevel;
  if (subject) where.subject = { slug: subject };
  if (intake) where.intake = { slug: intake };
  if (scholarshipAvailable) where.scholarshipAvailable = true;
  if (workExp) where.workExperienceRequired = true;

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

  const [total, items] = await Promise.all([
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
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const meta = {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  const filterValues: FilterValues = buildFilterValuesFromParams(sp, [
    { name: "studyLevel", type: "select" },
    { name: "subject", type: "select" },
    { name: "intake", type: "select" },
    { name: "scholarshipAvailable", type: "boolean" },
    { name: "workExperienceRequired", type: "boolean" },
  ]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Universities", href: "/higher-study/global-universities" },
    { label: university.officialName, href: `/higher-study/universities/${university.slug}` },
    { label: "Courses" },
  ];

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Universities", url: `${HIGHER_STUDY_BASE_URL}/higher-study/global-universities` },
    {
      name: university.officialName,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${university.slug}`,
    },
    {
      name: "Courses",
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${university.slug}/courses`,
    },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={breadcrumbItems}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="University courses"
        title={`Courses at ${university.officialName}`}
        description={`Browse every programme offered at ${university.officialName}${university.country ? `, ${university.country.name}` : ""}. Filter by study level, subject or intake, then apply through ALO Education with verified referral tracking.`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/higher-study/universities/${university.slug}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-800 transition-colors hover:bg-blue-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to university
          </Link>
          {university.country && (
            <span className="inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700">
              <Building2 className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              {university.country.flagEmoji} {university.country.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700">
            <BookOpen className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
            {total} programme{total === 1 ? "" : "s"}
          </span>
        </div>
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <ListPageControls
          searchPlaceholder="Search courses by title…"
          searchValue={getStringParam(sp, "q") ?? ""}
          filters={dynamicFilters}
          filterValues={filterValues}
          sortOptions={SORT_OPTIONS}
          sortValue={sort}
          orderValue={order}
          searchAriaLabel="Search courses at this university"
        />

        <div className="mt-5">
          {items.length === 0 ? (
            <EmptyState
              title="No courses match your filters"
              description="Try removing some filters or widening your search to see more programmes."
              icon={BookOpen}
              action={{
                label: "Browse all courses at this university",
                href: `/higher-study/universities/${university.slug}/courses`,
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

        {meta.total > 0 && (
          <div className="mt-6">
            <PaginationClient
              page={meta.page}
              limit={meta.limit}
              total={meta.total}
              totalPages={meta.totalPages}
              hasNext={meta.hasNext}
              hasPrev={meta.hasPrev}
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

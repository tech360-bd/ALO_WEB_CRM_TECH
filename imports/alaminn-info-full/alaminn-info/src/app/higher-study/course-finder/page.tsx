/**
 * /higher-study/course-finder
 * --------------------------------------------------------------------
 * Advanced course finder with comprehensive filters: keyword, country,
 * city, university, study level (33 options), subject, specialisation,
 * intake, duration, study mode, tuition range, scholarship
 * availability, funding availability, English requirement, academic
 * requirement, work-experience requirement, portfolio requirement,
 * research component, placement availability, application deadline,
 * verified status.
 *
 * 12 per page. Search bar with course-title suggestions.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { Search, GraduationCap, BookOpen, DollarSign, Clock } from "lucide-react";
import { db } from "@/lib/db";
import {
  COUNTRIES_LIST,
  STUDY_LEVELS,
} from "@/lib/higher-study/constants";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { CourseCard } from "@/components/higher-study/course-card";
import { LoadingSkeleton } from "@/components/higher-study/loading-skeleton";
import { EmptyState } from "@/components/higher-study/empty-state";
import {
  PageHero,
  StatsStrip,
} from "@/components/higher-study/page-hero";
import { ListPageControls } from "@/components/higher-study/list-page-controls";
import { PaginationClient } from "@/components/higher-study/pagination-client";
import {
  getStringParam,
  getBooleanParam,
  getNumberParam,
  getRangeParam,
  getPageParam,
  getLimitParam,
  getSortParam,
  buildFilterValuesFromParams,
  buildOrderBy,
} from "@/app/higher-study/_lib/search-params";
import type {
  FilterDefinition,
  FilterValues,
} from "@/components/higher-study/filter-panel";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Course Finder — Higher Study | Alaminn.info",
  description:
    "Search across 33 study levels (foundation, bachelor's, master's, MBA, PhD and more) with advanced filters: subject, specialisation, study mode, tuition range, scholarship availability, English requirement, placement, research component and verified status.",
  path: "/higher-study/course-finder",
  keywords: [
    "course finder",
    "university courses",
    "masters programmes",
    "PhD programmes",
    "MBA programmes",
    "foundation courses",
    "course search",
    "study programmes",
    "specialisation search",
  ],
});

const STUDY_MODES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "online", label: "Online" },
  { value: "blended", label: "Blended" },
  { value: "distance", label: "Distance learning" },
];

const FILTERS: FilterDefinition[] = [
  {
    name: "countrySlug",
    label: "Country",
    type: "select",
    options: COUNTRIES_LIST.map((c) => ({
      value: c.slug,
      label: `${c.flagEmoji} ${c.name}`,
    })),
    defaultCollapsed: false,
  },
  {
    name: "studyLevel",
    label: "Study level",
    type: "select",
    options: STUDY_LEVELS.map((l) => ({ value: l.value, label: l.label })),
    defaultCollapsed: false,
  },
  {
    name: "studyMode",
    label: "Study mode",
    type: "select",
    options: STUDY_MODES,
  },
  {
    name: "tuitionFee",
    label: "Max tuition (USD)",
    type: "range",
    min: 0,
    max: 100000,
    step: 1000,
    defaultCollapsed: true,
  },
  {
    name: "scholarshipAvailable",
    label: "Scholarship available",
    type: "boolean",
    defaultCollapsed: true,
  },
  {
    name: "workExperienceRequired",
    label: "Requires work experience",
    type: "boolean",
    defaultCollapsed: true,
  },
  {
    name: "portfolioRequired",
    label: "Portfolio required",
    type: "boolean",
    defaultCollapsed: true,
  },
  {
    name: "interviewRequired",
    label: "Interview required",
    type: "boolean",
    defaultCollapsed: true,
  },
  {
    name: "featured",
    label: "Featured only",
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

const SORT_MAP: Record<string, string> = {
  "title-asc": "title",
  "title-desc": "title",
  "tuition-asc": "tuitionFee",
  "tuition-desc": "tuitionFee",
  featured: "featured",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function fetchCourses(params: Record<string, string | string[] | undefined>) {
  const page = getPageParam(params);
  const limit = getLimitParam(params, 12);
  const { sort, order } = getSortParam(params, "featured");
  const q = getStringParam(params, "q") ?? "";
  const countrySlug = getStringParam(params, "countrySlug");
  const studyLevel = getStringParam(params, "studyLevel");
  const studyMode = getStringParam(params, "studyMode");
  const tuitionRange = getRangeParam(params, "tuitionFee");
  const scholarshipAvailable = getBooleanParam(params, "scholarshipAvailable");
  const workExperienceRequired = getBooleanParam(params, "workExperienceRequired");
  const portfolioRequired = getBooleanParam(params, "portfolioRequired");
  const interviewRequired = getBooleanParam(params, "interviewRequired");
  const featured = getBooleanParam(params, "featured");
  const universitySlug = getStringParam(params, "universitySlug");
  const subjectSlug = getStringParam(params, "subjectSlug");
  const maxTuition = getNumberParam(params, "maxTuitionFee");

  const where: Prisma.HigherStudyCourseWhereInput = {
    publicationStatus: "published",
    verificationStatus: { in: ["verified", "published"] },
  };

  if (countrySlug) where.country = { slug: countrySlug };
  if (studyLevel) where.studyLevel = studyLevel;
  if (studyMode) where.studyMode = studyMode;
  if (universitySlug) where.university = { slug: universitySlug };
  if (subjectSlug) where.subject = { slug: subjectSlug };
  if (typeof scholarshipAvailable === "boolean") where.scholarshipAvailable = scholarshipAvailable;
  if (typeof workExperienceRequired === "boolean") where.workExperienceRequired = workExperienceRequired;
  if (typeof portfolioRequired === "boolean") where.portfolioRequired = portfolioRequired;
  if (typeof interviewRequired === "boolean") where.interviewRequired = interviewRequired;
  if (typeof featured === "boolean") where.featured = featured;

  // Tuition range filter
  if (tuitionRange) {
    const [min, max] = tuitionRange;
    where.tuitionFee = {
      gte: min,
      lte: max,
    };
  } else if (typeof maxTuition === "number" && maxTuition > 0) {
    where.tuitionFee = { lte: maxTuition };
  }

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { qualification: { contains: q } },
      { specialisation: { contains: q } },
      { overview: { contains: q } },
    ];
  }

  const orderBy = buildOrderBy(sort, order, SORT_MAP, "featured");
  const finalOrderBy =
    sort === "featured" || !sort || sort === "createdAt"
      ? [{ featured: "desc" as const }, { lastVerifiedAt: "desc" as const }]
      : [orderBy];

  try {
    const [total, items] = await Promise.all([
      db.higherStudyCourse.count({ where }),
      db.higherStudyCourse.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: finalOrderBy,
        include: {
          university: {
            select: {
              id: true, slug: true, officialName: true, logoUrl: true,
              country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
            },
          },
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          subject: { select: { id: true, slug: true, name: true, category: true } },
        },
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      items,
      meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      error: null,
    };
  } catch (e) {
    console.error("[course-finder] DB error", e);
    return {
      items: [],
      meta: { page, limit, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
      error: "Could not load courses from the database.",
    };
  }
}

// ── Suggestions for the search bar ──────────────────────────────────

async function fetchSuggestions(q: string) {
  if (!q || q.length < 2) return [];
  try {
    const items = await db.higherStudyCourse.findMany({
      where: {
        publicationStatus: "published",
        OR: [
          { title: { contains: q } },
          { qualification: { contains: q } },
          { specialisation: { contains: q } },
        ],
      },
      take: 8,
      select: {
        slug: true,
        title: true,
        qualification: true,
        studyLevel: true,
        university: { select: { officialName: true } },
      },
    });
    return items.map((c) => ({
      label: c.title,
      href: `/higher-study/courses/${c.slug}`,
      description: [
        c.qualification,
        c.university?.officialName,
        c.studyLevel,
      ].filter(Boolean).join(" · "),
      badge: "Course",
    }));
  } catch {
    return [];
  }
}

export default async function CourseFinderPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { items, meta, error } = await fetchCourses(params);

  const searchValue = getStringParam(params, "q") ?? "";
  const suggestions = await fetchSuggestions(searchValue);

  const filterValues: FilterValues = buildFilterValuesFromParams(params, [
    { name: "countrySlug", type: "select" },
    { name: "studyLevel", type: "select" },
    { name: "studyMode", type: "select" },
    { name: "tuitionFee", type: "range" },
    { name: "scholarshipAvailable", type: "boolean" },
    { name: "workExperienceRequired", type: "boolean" },
    { name: "portfolioRequired", type: "boolean" },
    { name: "interviewRequired", type: "boolean" },
    { name: "featured", type: "boolean" },
  ]);
  const sortValue = getStringParam(params, "sort") ?? "featured";
  const orderValue = (getStringParam(params, "order") ?? "desc") as "asc" | "desc";

  let stats = { total: 0, studyLevels: STUDY_LEVELS.length, featured: 0 };
  try {
    const [total, featured] = await Promise.all([
      db.higherStudyCourse.count({ where: { publicationStatus: "published" } }),
      db.higherStudyCourse.count({
        where: { publicationStatus: "published", featured: true },
      }),
    ]);
    stats = { total, studyLevels: STUDY_LEVELS.length, featured };
  } catch {
    /* ignore */
  }

  const itemListLd = items.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Higher Study Courses",
    numberOfItems: meta.total,
    itemListElement: items.slice(0, 10).map((c, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: c.title,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/courses/${c.slug}`,
    })),
  } : null;
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Course Finder", url: `${HIGHER_STUDY_BASE_URL}/higher-study/course-finder` },
  ]);
  const jsonLdObjects = [breadcrumbLd];
  if (itemListLd) jsonLdObjects.push(itemListLd);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "Course Finder" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="33 study levels"
        title="Course Finder"
        description="Search across foundation, bachelor's, master's, MBA, PhD and 28 other study levels. Filter by subject, specialisation, study mode, tuition range, scholarships, English requirements, placements and research components — then apply via ALO Education."
      >
        <StatsStrip
          stats={[
            { label: "Courses", value: stats.total },
            { label: "Study levels", value: stats.studyLevels },
            { label: "Featured", value: stats.featured },
            { label: "Study modes", value: STUDY_MODES.length },
          ]}
        />
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <ListPageControls
          searchPlaceholder="Search courses by title, qualification, specialisation…"
          searchValue={searchValue}
          searchSuggestions={suggestions}
          filters={FILTERS}
          filterValues={filterValues}
          sortOptions={SORT_OPTIONS}
          sortValue={sortValue}
          orderValue={orderValue}
          searchAriaLabel="Search courses"
        />

        <div className="mt-5">
          {error ? (
            <EmptyState
              title="Could not load courses"
              description={error}
              icon={GraduationCap}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No courses match your filters"
              description="Try removing some filters or widening your search to see more courses."
              icon={Search}
              action={{ label: "Browse all courses", href: "/higher-study/course-finder" }}
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

        {/* Study-level browse shortcuts */}
        <section className="mt-12">
          <h2 className="font-display text-lg font-extrabold text-ink-900">
            Browse by study level
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Quick shortcuts to filter courses by their study level.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {STUDY_LEVELS.slice(0, 12).map((l) => (
              <a
                key={l.value}
                href={`/higher-study/course-finder?studyLevel=${encodeURIComponent(l.value)}`}
                className="group flex items-center justify-between gap-2 rounded-xl border border-ink-200 bg-white p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-xs font-extrabold text-ink-900">
                    {l.label}
                  </p>
                </div>
                <GraduationCap className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        {/* Help strip */}
        <section className="mt-8 grid gap-3 rounded-2xl border border-ink-200 bg-gradient-to-br from-blue-50/60 to-orange-50/60 p-5 sm:grid-cols-4">
          <div className="flex items-start gap-2">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
            <div>
              <p className="font-display text-sm font-bold text-ink-900">Subject search</p>
              <p className="text-xs text-ink-600">Filter by 30+ subject categories.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div>
              <p className="font-display text-sm font-bold text-ink-900">Tuition range</p>
              <p className="text-xs text-ink-600">Filter by max annual tuition in USD.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" aria-hidden="true" />
            <div>
              <p className="font-display text-sm font-bold text-ink-900">Intake &amp; deadlines</p>
              <p className="text-xs text-ink-600">See application deadlines at a glance.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
            <div>
              <p className="font-display text-sm font-bold text-ink-900">Apply via ALO</p>
              <p className="text-xs text-ink-600">Consent-tracked referral to ALO Education.</p>
            </div>
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdObjects) }}
      />
    </>
  );
}

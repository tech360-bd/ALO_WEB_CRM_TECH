/**
 * /higher-study/study-resources
 * --------------------------------------------------------------------
 * Study resources library with category filter (all categories from
 * HigherStudyResource.category). Each result: ResourceCard. Filter by
 * category, reading time, featured.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Star,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { ResourceCard } from "@/components/higher-study/resource-card";
import { LoadingSkeleton } from "@/components/higher-study/loading-skeleton";
import { EmptyState } from "@/components/higher-study/empty-state";
import {
  PageHero,
  StatsStrip,
  SectionCard,
} from "@/components/higher-study/page-hero";
import { ListPageControls } from "@/components/higher-study/list-page-controls";
import { PaginationClient } from "@/components/higher-study/pagination-client";
import {
  getStringParam,
  getBooleanParam,
  getPageParam,
  getLimitParam,
  getSortParam,
  buildFilterValuesFromParams,
} from "@/app/higher-study/_lib/search-params";
import type {
  FilterDefinition,
  FilterValues,
} from "@/components/higher-study/filter-panel";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Study Resources Library — Higher Study | Alaminn.info",
  description:
    "Long-form guides covering SOPs, personal statements, academic CVs, research proposals, recommendation letters, portfolios, visa prep, financial planning, English tests and more. Filter by category, reading time and featured.",
  path: "/higher-study/study-resources",
  keywords: [
    "study resources",
    "SOP guide",
    "personal statement",
    "academic CV",
    "research proposal",
    "recommendation letter",
    "portfolio",
    "visa guide",
    "financial planning",
    "IELTS preparation",
    "PTE preparation",
    "TOEFL preparation",
    "academic writing",
  ],
});

const RESOURCE_CATEGORIES = [
  { value: "planning", label: "Planning" },
  { value: "country-guides", label: "Country Guides" },
  { value: "university-guides", label: "University Guides" },
  { value: "course-selection", label: "Course Selection" },
  { value: "scholarship-guides", label: "Scholarship Guides" },
  { value: "phd-guides", label: "PhD Guides" },
  { value: "research-guides", label: "Research Guides" },
  { value: "proposal-guides", label: "Proposal Guides" },
  { value: "supervisor-contact", label: "Supervisor Contact" },
  { value: "sop", label: "Statement of Purpose" },
  { value: "personal-statement", label: "Personal Statement" },
  { value: "cv", label: "Academic CV" },
  { value: "recommendation-letter", label: "Recommendation Letters" },
  { value: "portfolio", label: "Portfolio" },
  { value: "visa", label: "Visa" },
  { value: "financial", label: "Financial" },
  { value: "accommodation", label: "Accommodation" },
  { value: "pre-departure", label: "Pre-Departure" },
  { value: "student-life", label: "Student Life" },
  { value: "checklists", label: "Checklists" },
  { value: "interview", label: "Interview" },
  { value: "ielts", label: "IELTS" },
  { value: "ielts-ukvi", label: "IELTS for UKVI" },
  { value: "pte", label: "PTE Academic" },
  { value: "toefl", label: "TOEFL iBT" },
  { value: "duolingo", label: "Duolingo English Test" },
  { value: "languagecert", label: "LanguageCert" },
  { value: "academic-writing", label: "Academic Writing" },
  { value: "research-methods", label: "Research Methods" },
  { value: "publication", label: "Publication" },
  { value: "referencing", label: "Referencing" },
  { value: "research-ethics", label: "Research Ethics" },
  { value: "comparison", label: "Comparison" },
  { value: "faq", label: "FAQ" },
];

const READING_TIME_OPTIONS = [
  { value: "0-5", label: "Under 5 min" },
  { value: "5-10", label: "5–10 min" },
  { value: "10-20", label: "10–20 min" },
  { value: "20+", label: "20+ min" },
];

const FILTERS: FilterDefinition[] = [
  {
    name: "category",
    label: "Category",
    type: "select",
    options: RESOURCE_CATEGORIES,
    defaultCollapsed: false,
  },
  {
    name: "readingTime",
    label: "Reading time",
    type: "select",
    options: READING_TIME_OPTIONS,
    defaultCollapsed: false,
  },
  {
    name: "featured",
    label: "Featured only",
    type: "boolean",
    defaultCollapsed: true,
  },
];

const SORT_OPTIONS = [
  { value: "published-desc", label: "Newest first" },
  { value: "published-asc", label: "Oldest first" },
  { value: "title-asc", label: "Title A→Z" },
  { value: "title-desc", label: "Title Z→A" },
  { value: "reading-asc", label: "Shortest read first" },
];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function fetchResources(params: Record<string, string | string[] | undefined>) {
  const page = getPageParam(params);
  const limit = getLimitParam(params, 12);
  const { sort } = getSortParam(params, "published-desc");
  const q = getStringParam(params, "q") ?? "";
  const category = getStringParam(params, "category");
  const readingTime = getStringParam(params, "readingTime");
  const featured = getBooleanParam(params, "featured");

  const where: Prisma.HigherStudyResourceWhereInput = {
    publicationStatus: "published",
    verificationStatus: { in: ["verified", "published"] },
  };

  if (category) where.category = category;
  if (typeof featured === "boolean") where.featured = featured;

  // Reading time filter
  if (readingTime) {
    if (readingTime === "0-5") where.readingTimeMinutes = { lt: 5 };
    else if (readingTime === "5-10") where.readingTimeMinutes = { gte: 5, lt: 10 };
    else if (readingTime === "10-20") where.readingTimeMinutes = { gte: 10, lt: 20 };
    else if (readingTime === "20+") where.readingTimeMinutes = { gte: 20 };
  }

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { summary: { contains: q } },
      { content: { contains: q } },
    ];
  }

  const orderBy =
    sort === "title-asc"
      ? [{ title: "asc" as const }]
      : sort === "title-desc"
        ? [{ title: "desc" as const }]
        : sort === "reading-asc"
          ? [{ readingTimeMinutes: "asc" as const }]
          : sort === "published-asc"
            ? [{ publishedAt: "asc" as const }]
            : [{ publishedAt: "desc" as const }];

  try {
    const [total, items] = await Promise.all([
      db.higherStudyResource.count({ where }),
      db.higherStudyResource.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      items,
      meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      error: null,
    };
  } catch (e) {
    console.error("[study-resources] DB error", e);
    return {
      items: [],
      meta: { page, limit, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
      error: "Could not load resources from the database.",
    };
  }
}

export default async function StudyResourcesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { items, meta, error } = await fetchResources(params);

  const searchValue = getStringParam(params, "q") ?? "";
  const filterValues: FilterValues = buildFilterValuesFromParams(params, [
    { name: "category", type: "select" },
    { name: "readingTime", type: "select" },
    { name: "featured", type: "boolean" },
  ]);
  const sortValue = getStringParam(params, "sort") ?? "published-desc";
  const orderValue = (getStringParam(params, "order") ?? "desc") as "asc" | "desc";

  let stats = { total: 0, categories: RESOURCE_CATEGORIES.length, featured: 0 };
  try {
    const [total, featured, categoryCount] = await Promise.all([
      db.higherStudyResource.count({
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
        },
      }),
      db.higherStudyResource.count({
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
          featured: true,
        },
      }),
      db.higherStudyResource.groupBy({
        by: ["category"],
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
        },
        _count: { _all: true },
      }),
    ]);
    stats = {
      total,
      categories: Math.max(categoryCount.length, RESOURCE_CATEGORIES.length),
      featured,
    };
  } catch {
    /* ignore */
  }

  const itemListLd = items.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Higher Study Resources",
    numberOfItems: meta.total,
    itemListElement: items.slice(0, 10).map((r, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: r.title,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/resources/${r.slug}`,
    })),
  } : null;
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Study Resources", url: `${HIGHER_STUDY_BASE_URL}/higher-study/study-resources` },
  ]);
  const jsonLdObjects = [breadcrumbLd];
  if (itemListLd) jsonLdObjects.push(itemListLd);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "Study Resources" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="Guides · Templates · Checklists"
        title="Study Resources Library"
        description="Long-form, verified guides covering every stage of your study-abroad journey: planning, country selection, SOPs, personal statements, academic CVs, research proposals, recommendation letters, visa prep, financial planning, English tests and more."
      >
        <StatsStrip
          stats={[
            { label: "Resources", value: stats.total },
            { label: "Categories", value: stats.categories },
            { label: "Featured", value: stats.featured },
          ]}
        />
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <ListPageControls
          searchPlaceholder="Search resources by title, summary, content…"
          searchValue={searchValue}
          filters={FILTERS}
          filterValues={filterValues}
          sortOptions={SORT_OPTIONS}
          sortValue={sortValue}
          orderValue={orderValue}
          searchAriaLabel="Search study resources"
        />

        <div className="mt-5">
          {error ? (
            <EmptyState
              title="Could not load resources"
              description={error}
              icon={BookOpen}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No resources match your filters"
              description="Try removing some filters or widening your search."
              icon={BookOpen}
              action={{ label: "Browse all resources", href: "/higher-study/study-resources" }}
            />
          ) : (
            <Suspense fallback={<LoadingSkeleton type="resource" count={6} />}>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((r) => (
                  <ResourceCard key={r.id} resource={r as never} />
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

        {/* Category browse shortcuts */}
        <section className="mt-12">
          <h2 className="font-display text-lg font-extrabold text-ink-900">
            Browse by category
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Most-searched resource categories.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {RESOURCE_CATEGORIES.slice(0, 16).map((c) => (
              <Link
                key={c.value}
                href={`/higher-study/study-resources?category=${encodeURIComponent(c.value)}`}
                className="group flex items-center gap-2 rounded-xl border border-ink-200 bg-white p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              >
                <FileText className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                <span className="truncate text-xs font-semibold text-ink-900">
                  {c.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Help strip */}
        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
            <Clock className="h-5 w-5 text-orange-600" aria-hidden="true" />
            <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">Reading time</h4>
            <p className="mt-1 text-xs text-ink-600">
              Each resource has an estimated reading time so you can plan your prep.
            </p>
          </div>
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
            <Star className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">Featured</h4>
            <p className="mt-1 text-xs text-ink-600">
              Start with featured resources — they&apos;re the most-consulted guides.
            </p>
          </div>
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
            <Sparkles className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">Need 1:1 help?</h4>
            <p className="mt-1 text-xs text-ink-600">
              Book a free consultation to get personalised advice on your application.
            </p>
            <Link
              href="/higher-study/book-consultation"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              Book consultation
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <SectionCard className="mt-8 border-blue-200 bg-gradient-to-br from-blue-50 to-orange-50">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-lg font-extrabold text-ink-900">
                Looking for application support?
              </h3>
              <p className="mt-1 text-sm text-ink-700">
                Apply through ALO Education for end-to-end application management
                with consent-tracked referral handoff.
              </p>
            </div>
            <Link
              href="/higher-study/apply"
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-orange hover:bg-orange-700"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Apply through ALO Education
            </Link>
          </div>
        </SectionCard>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdObjects) }}
      />
    </>
  );
}

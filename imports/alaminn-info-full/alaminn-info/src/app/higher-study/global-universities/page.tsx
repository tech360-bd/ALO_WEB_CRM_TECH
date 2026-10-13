/**
 * /higher-study/global-universities
 * --------------------------------------------------------------------
 * Lists universities across all countries EXCEPT UK.
 * Filters: country, region, city, university type, degree level,
 * subject, tuition range, scholarship availability, research
 * availability, ranking range, intake, English requirement, study
 * mode, campus type, application deadline, verified status.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { Building2, Globe2, GraduationCap, ShieldCheck } from "lucide-react";
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
import { UniversityCard } from "@/components/higher-study/university-card";
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
  title: "Global Universities Directory — Higher Study | Alaminn.info",
  description:
    "Browse universities across all destinations outside the UK — USA, Canada, Australia, Ireland, Germany, Netherlands, Sweden, Australia, UAE and more. Filter by country, study level, tuition range, scholarships, research strengths and verified status.",
  path: "/higher-study/global-universities",
  keywords: [
    "global universities",
    "international universities",
    "study abroad",
    "universities in USA",
    "universities in Canada",
    "universities in Australia",
    "universities in Germany",
    "universities in Ireland",
    "universities in UAE",
  ],
});

const GLOBAL_COUNTRIES = COUNTRIES_LIST.filter((c) => c.slug !== "uk");

const INSTITUTION_TYPES = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "specialist", label: "Specialist" },
  { value: "research-intensive", label: "Research-intensive" },
  { value: "modern", label: "Modern" },
];

const REGIONS = [
  { value: "Europe", label: "Europe" },
  { value: "North America", label: "North America" },
  { value: "Asia-Pacific", label: "Asia-Pacific" },
  { value: "Middle East", label: "Middle East" },
];

const FILTERS: FilterDefinition[] = [
  {
    name: "countrySlug",
    label: "Country",
    type: "select",
    options: GLOBAL_COUNTRIES.map((c) => ({
      value: c.slug,
      label: `${c.flagEmoji} ${c.name}`,
    })),
    defaultCollapsed: false,
  },
  {
    name: "region",
    label: "Region",
    type: "select",
    options: REGIONS,
    defaultCollapsed: false,
  },
  {
    name: "institutionType",
    label: "Institution type",
    type: "select",
    options: INSTITUTION_TYPES,
  },
  {
    name: "studyLevel",
    label: "Study level",
    type: "select",
    options: STUDY_LEVELS.map((l) => ({ value: l.value, label: l.label })),
  },
  {
    name: "hasMBA",
    label: "Offers MBA",
    type: "boolean",
    defaultCollapsed: true,
  },
  {
    name: "hasPhD",
    label: "Offers PhD",
    type: "boolean",
    defaultCollapsed: true,
  },
  {
    name: "hasMRes",
    label: "Offers MRes",
    type: "boolean",
    defaultCollapsed: true,
  },
  {
    name: "hasMPhil",
    label: "Offers MPhil",
    type: "boolean",
    defaultCollapsed: true,
  },
  {
    name: "hasProfessionalDoctorate",
    label: "Professional doctorates",
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
  { value: "name-asc", label: "Name A→Z" },
  { value: "name-desc", label: "Name Z→A" },
  { value: "established-asc", label: "Oldest first" },
  { value: "established-desc", label: "Newest first" },
  { value: "featured", label: "Featured first" },
];

const SORT_MAP: Record<string, string> = {
  "name-asc": "officialName",
  "name-desc": "officialName",
  "established-asc": "establishedYear",
  "established-desc": "establishedYear",
  featured: "featured",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function fetchUniversities(params: Record<string, string | string[] | undefined>) {
  const page = getPageParam(params);
  const limit = getLimitParam(params, 12);
  const { sort, order } = getSortParam(params, "featured");
  const q = getStringParam(params, "q") ?? "";
  const countrySlug = getStringParam(params, "countrySlug");
  const region = getStringParam(params, "region");
  const institutionType = getStringParam(params, "institutionType");
  const studyLevel = getStringParam(params, "studyLevel");
  const featured = getBooleanParam(params, "featured");
  const hasMBA = getBooleanParam(params, "hasMBA");
  const hasPhD = getBooleanParam(params, "hasPhD");
  const hasMRes = getBooleanParam(params, "hasMRes");
  const hasMPhil = getBooleanParam(params, "hasMPhil");
  const hasProfDoc = getBooleanParam(params, "hasProfessionalDoctorate");

  // Country filter: always exclude UK (UK is on its own page), AND
  // optionally filter by a specific country slug + region.
  const countryAnd: Prisma.HigherStudyCountryWhereInput[] = [
    { slug: { not: "uk" } },
  ];
  if (countrySlug) countryAnd.push({ slug: countrySlug });
  const countryFilter: Prisma.HigherStudyCountryWhereInput = { AND: countryAnd };
  if (region) countryFilter.region = region;

  const where: Prisma.HigherStudyUniversityWhereInput = {
    publicationStatus: "published",
    country: countryFilter,
    verificationStatus: { in: ["verified", "published"] },
  };
  if (institutionType) where.institutionType = institutionType;
  if (studyLevel) {
    where.studyLevels = { contains: studyLevel };
  }
  if (typeof featured === "boolean") where.featured = featured;
  if (typeof hasMBA === "boolean") where.hasMBA = hasMBA;
  if (typeof hasPhD === "boolean") where.hasPhD = hasPhD;
  if (typeof hasMRes === "boolean") where.hasMRes = hasMRes;
  if (typeof hasMPhil === "boolean") where.hasMPhil = hasMPhil;
  if (typeof hasProfDoc === "boolean") where.hasProfessionalDoctorate = hasProfDoc;

  if (q) {
    where.OR = [
      { officialName: { contains: q } },
      { alternativeNames: { contains: q } },
      { overview: { contains: q } },
    ];
  }

  const orderBy = buildOrderBy(sort, order, SORT_MAP, "featured");
  const finalOrderBy =
    sort === "featured" || (!sort || sort === "createdAt")
      ? [{ featured: "desc" as const }, { lastVerifiedAt: "desc" as const }]
      : [orderBy];

  try {
    const [total, items] = await Promise.all([
      db.higherStudyUniversity.count({ where }),
      db.higherStudyUniversity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: finalOrderBy,
        include: {
          country: { select: { id: true, slug: true, name: true, flagEmoji: true, region: true } },
          city: { select: { id: true, slug: true, name: true } },
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
    console.error("[global-universities] DB error", e);
    return {
      items: [],
      meta: { page, limit, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
      error: "Could not load universities from the database.",
    };
  }
}

export default async function GlobalUniversitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { items, meta, error } = await fetchUniversities(params);

  const searchValue = getStringParam(params, "q") ?? "";
  const filterValues: FilterValues = buildFilterValuesFromParams(params, [
    { name: "countrySlug", type: "select" },
    { name: "region", type: "select" },
    { name: "institutionType", type: "select" },
    { name: "studyLevel", type: "select" },
    { name: "hasMBA", type: "boolean" },
    { name: "hasPhD", type: "boolean" },
    { name: "hasMRes", type: "boolean" },
    { name: "hasMPhil", type: "boolean" },
    { name: "hasProfessionalDoctorate", type: "boolean" },
    { name: "featured", type: "boolean" },
  ]);
  const sortValue = getStringParam(params, "sort") ?? "featured";
  const orderValue = (getStringParam(params, "order") ?? "desc") as "asc" | "desc";

  let stats = { total: 0, countries: 0, featured: 0 };
  try {
    const [total, featured, countries] = await Promise.all([
      db.higherStudyUniversity.count({
        where: { publicationStatus: "published", country: { slug: { not: "uk" } } },
      }),
      db.higherStudyUniversity.count({
        where: {
          publicationStatus: "published",
          country: { slug: { not: "uk" } },
          featured: true,
        },
      }),
      db.higherStudyCountry.count({
        where: {
          status: "published",
          slug: { not: "uk" },
        },
      }),
    ]);
    stats = { total, featured, countries };
  } catch {
    /* ignore */
  }

  const itemListLd = items.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Global Universities",
    numberOfItems: meta.total,
    itemListElement: items.slice(0, 10).map((u, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: u.officialName,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${u.slug}`,
    })),
  } : null;
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Global Universities", url: `${HIGHER_STUDY_BASE_URL}/higher-study/global-universities` },
  ]);
  const jsonLdObjects = [breadcrumbLd];
  if (itemListLd) jsonLdObjects.push(itemListLd);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "Global Universities" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="Worldwide"
        title="Global Universities Directory"
        description="Explore universities across the USA, Canada, Australia, Ireland, Germany, the Netherlands, Sweden, France, the UAE and beyond — every destination outside the UK. Filter by country, study level, tuition range and verified status."
      >
        <StatsStrip
          stats={[
            { label: "Universities", value: stats.total },
            { label: "Countries", value: stats.countries },
            { label: "Featured", value: stats.featured },
            { label: "Regions", value: REGIONS.length },
          ]}
        />
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <ListPageControls
          searchPlaceholder="Search universities by name, city or country…"
          searchValue={searchValue}
          filters={FILTERS}
          filterValues={filterValues}
          sortOptions={SORT_OPTIONS}
          sortValue={sortValue}
          orderValue={orderValue}
          searchAriaLabel="Search global universities"
        />

        <div className="mt-5">
          {error ? (
            <EmptyState
              title="Could not load universities"
              description={error}
              icon={Building2}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No universities match your filters"
              description="Try removing some filters or widening your search to see more universities."
              icon={Globe2}
              action={{ label: "Browse all universities", href: "/higher-study/global-universities" }}
            />
          ) : (
            <Suspense fallback={<LoadingSkeleton type="university" count={6} />}>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((u) => (
                  <UniversityCard key={u.id} university={u as never} />
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

        {/* Regional browse shortcuts */}
        <section className="mt-12">
          <h2 className="font-display text-lg font-extrabold text-ink-900">
            Browse by region
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Quick shortcuts to filter universities by world region.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {REGIONS.map((r) => (
              <a
                key={r.value}
                href={`/higher-study/global-universities?region=${encodeURIComponent(r.value)}`}
                className="group flex items-center justify-between gap-2 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              >
                <div>
                  <p className="font-display text-sm font-extrabold text-ink-900">{r.label}</p>
                  <p className="text-xs text-ink-500">
                    {COUNTRIES_LIST.filter((c) => c.region === r.value && c.slug !== "uk").length} countries
                  </p>
                </div>
                <Globe2 className="h-5 w-5 text-blue-600 transition-transform group-hover:scale-110" aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <section className="mt-8 grid gap-3 rounded-2xl border border-ink-200 bg-gradient-to-br from-blue-50/60 to-orange-50/60 p-5 sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div>
              <p className="font-display text-sm font-bold text-ink-900">Verified data</p>
              <p className="text-xs text-ink-600">Every university has a verification badge + last-verified date.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
            <div>
              <p className="font-display text-sm font-bold text-ink-900">Apply with consent</p>
              <p className="text-xs text-ink-600">All applications go through ALO Education with consent-tracked referral.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" aria-hidden="true" />
            <div>
              <p className="font-display text-sm font-bold text-ink-900">Side-by-side compare</p>
              <p className="text-xs text-ink-600">Compare up to 4 universities on tuition, rankings and English requirements.</p>
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

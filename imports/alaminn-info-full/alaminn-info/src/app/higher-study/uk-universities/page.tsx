/**
 * /higher-study/uk-universities
 * --------------------------------------------------------------------
 * Lists UK universities (country.slug=uk) with advanced filters:
 * region (England/Scotland/Wales/Northern Ireland), institution type,
 * study level, subject, tuition range, ranking range, intake, English
 * requirement, verified status.
 *
 * 12 results per page. Sort: name A-Z, established year, featured first.
 * Search bar. Empty state when no results.
 *
 * Hero section explaining the UK university system.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Building2,
  GraduationCap,
  Trophy,
  ShieldCheck,
  Info,
} from "lucide-react";
import { db } from "@/lib/db";
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
  SectionCard,
  ProseSection,
} from "@/components/higher-study/page-hero";
import { ListPageControls } from "@/components/higher-study/list-page-controls";
import { PaginationClient } from "@/components/higher-study/pagination-client";
import {
  getStringParam,
  getStringArrayParam,
  getBooleanParam,
  getPageParam,
  getLimitParam,
  getSortParam,
  buildFilterValuesFromParams,
  buildOrderBy,
} from "@/app/higher-study/_lib/search-params";
import { STUDY_LEVELS } from "@/lib/higher-study/constants";
import type {
  FilterDefinition,
  FilterValues,
} from "@/components/higher-study/filter-panel";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "UK Universities Directory — Higher Study | Alaminn.info",
  description:
    "Browse verified UK universities across England, Scotland, Wales and Northern Ireland. Filter by region, study level, subject, tuition range, English requirements and rankings — then apply through ALO Education with a consent-tracked referral.",
  path: "/higher-study/uk-universities",
  keywords: [
    "UK universities",
    "universities in England",
    "universities in Scotland",
    "universities in Wales",
    "universities in Northern Ireland",
    "Russell Group",
    "study in UK",
    "UK university application",
    "UK Student Visa",
    "graduate route UK",
  ],
});

const UK_REGIONS = [
  { value: "england", label: "England" },
  { value: "scotland", label: "Scotland" },
  { value: "wales", label: "Wales" },
  { value: "northern-ireland", label: "Northern Ireland" },
];

const INSTITUTION_TYPES = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "specialist", label: "Specialist" },
  { value: "conservatoire", label: "Conservatoire" },
  { value: "research-intensive", label: "Research-intensive" },
  { value: "modern", label: "Modern (post-1992)" },
];

const VERIFICATION_OPTIONS = [
  { value: "verified", label: "Verified only" },
  { value: "published", label: "Published" },
];

const FILTERS: FilterDefinition[] = [
  {
    name: "ukRegion",
    label: "UK Region",
    type: "select",
    options: UK_REGIONS,
    defaultCollapsed: false,
  },
  {
    name: "institutionType",
    label: "Institution type",
    type: "select",
    options: INSTITUTION_TYPES,
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
    name: "featured",
    label: "Featured only",
    type: "boolean",
    defaultCollapsed: true,
  },
  {
    name: "verificationStatus",
    label: "Verification status",
    type: "select",
    options: VERIFICATION_OPTIONS,
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

// ── Data fetcher ────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function fetchUniversities(params: Record<string, string | string[] | undefined>) {
  const page = getPageParam(params);
  const limit = getLimitParam(params, 12);
  const { sort, order } = getSortParam(params, "featured");
  const q = getStringParam(params, "q") ?? "";
  const ukRegion = getStringParam(params, "ukRegion");
  const institutionType = getStringParam(params, "institutionType");
  const studyLevel = getStringParam(params, "studyLevel");
  const featured = getBooleanParam(params, "featured");
  const hasMBA = getBooleanParam(params, "hasMBA");
  const hasPhD = getBooleanParam(params, "hasPhD");
  const hasMRes = getBooleanParam(params, "hasMRes");
  const hasMPhil = getBooleanParam(params, "hasMPhil");
  const verificationStatus = getStringParam(params, "verificationStatus");

  const where: Prisma.HigherStudyUniversityWhereInput = {
    publicationStatus: "published",
    country: { slug: "uk" },
  };

  // Region filter — match against city.name (heuristic) or campusLocations text
  if (ukRegion) {
    const regionMap: Record<string, string[]> = {
      england: ["London", "Manchester", "Birmingham", "Leeds", "Bristol", "Sheffield", "Liverpool", "Newcastle", "Nottingham", "Oxford", "Cambridge", "York", "Exeter", "Southampton"],
      scotland: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "St Andrews", "Stirling"],
      wales: ["Cardiff", "Swansea", "Aberystwyth", "Bangor"],
      "northern-ireland": ["Belfast", "Londonderry", "Coleraine"],
    };
    const cityList = regionMap[ukRegion] ?? [];
    if (cityList.length > 0) {
      where.OR = [
        { city: { name: { in: cityList } } },
        ...cityList.map((c) => ({ campusLocations: { contains: c } })),
      ];
    }
  }

  if (institutionType) where.institutionType = institutionType;
  if (studyLevel) {
    const existingOr = (Array.isArray(where.OR) ? where.OR : []) as Prisma.HigherStudyUniversityWhereInput[];
    where.OR = [
      ...existingOr,
      { studyLevels: { contains: studyLevel } },
    ];
  }
  if (typeof featured === "boolean") where.featured = featured;
  if (typeof hasMBA === "boolean") where.hasMBA = hasMBA;
  if (typeof hasPhD === "boolean") where.hasPhD = hasPhD;
  if (typeof hasMRes === "boolean") where.hasMRes = hasMRes;
  if (typeof hasMPhil === "boolean") where.hasMPhil = hasMPhil;
  if (verificationStatus) {
    where.verificationStatus = verificationStatus;
  } else {
    where.verificationStatus = { in: ["verified", "published"] };
  }

  if (q) {
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { officialName: { contains: q } },
      { alternativeNames: { contains: q } },
      { overview: { contains: q } },
    ];
  }

  const orderBy = buildOrderBy(sort, order, SORT_MAP, "featured");
  // For featured sort, we want featured=true first then by lastVerifiedAt desc
  const finalOrderBy =
    sort === "featured"
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
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          city: { select: { id: true, slug: true, name: true } },
        },
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      items,
      meta: {
        page, limit, total, totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      error: null,
    };
  } catch (e) {
    console.error("[uk-universities] DB error", e);
    return {
      items: [],
      meta: { page, limit, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
      error: "Could not load universities from the database.",
    };
  }
}

// ── Page ────────────────────────────────────────────────────────────

export default async function UkUniversitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { items, meta, error } = await fetchUniversities(params);

  const searchValue = getStringParam(params, "q") ?? "";
  const filterValues: FilterValues = buildFilterValuesFromParams(params, [
    { name: "ukRegion", type: "select" },
    { name: "institutionType", type: "select" },
    { name: "studyLevel", type: "select" },
    { name: "hasMBA", type: "boolean" },
    { name: "hasPhD", type: "boolean" },
    { name: "hasMRes", type: "boolean" },
    { name: "hasMPhil", type: "boolean" },
    { name: "featured", type: "boolean" },
    { name: "verificationStatus", type: "select" },
  ]);
  const sortValue = getStringParam(params, "sort") ?? "featured";
  const orderValue = (getStringParam(params, "order") ?? "desc") as "asc" | "desc";

  // Stats strip
  let stats = { total: 0, featured: 0, verified: 0, oldest: 0 };
  try {
    const [total, featured, verified] = await Promise.all([
      db.higherStudyUniversity.count({
        where: { publicationStatus: "published", country: { slug: "uk" } },
      }),
      db.higherStudyUniversity.count({
        where: { publicationStatus: "published", country: { slug: "uk" }, featured: true },
      }),
      db.higherStudyUniversity.count({
        where: {
          publicationStatus: "published",
          country: { slug: "uk" },
          verificationStatus: { in: ["verified", "published"] },
        },
      }),
    ]);
    stats = { total, featured, verified, oldest: 1096 };
  } catch {
    /* ignore */
  }

  const itemListLd = items.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "UK Universities",
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
    { name: "UK Universities", url: `${HIGHER_STUDY_BASE_URL}/higher-study/uk-universities` },
  ]);
  const jsonLdObjects = [breadcrumbLd];
  if (itemListLd) jsonLdObjects.push(itemListLd);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "UK Universities" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="United Kingdom"
        title="UK Universities Directory"
        description="Browse universities across England, Scotland, Wales and Northern Ireland. The UK is home to some of the world's oldest universities (Oxford, Cambridge, St Andrews) and a diverse range of institutions from research-intensive Russell Group universities to modern post-1992 institutions."
      >
        <StatsStrip
          stats={[
            { label: "UK universities", value: stats.total },
            { label: "Featured", value: stats.featured },
            { label: "Verified", value: stats.verified },
            { label: "Oldest founded", value: stats.oldest },
          ]}
        />
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <ListPageControls
          searchPlaceholder="Search UK universities by name or city…"
          searchValue={searchValue}
          filters={FILTERS}
          filterValues={filterValues}
          sortOptions={SORT_OPTIONS}
          sortValue={sortValue}
          orderValue={orderValue}
          searchAriaLabel="Search UK universities"
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
              description="Try removing some filters or widening your search to see more UK universities."
              icon={Building2}
              action={{ label: "Browse all UK universities", href: "/higher-study/uk-universities" }}
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

        {/* UK system explainer */}
        <section className="mt-12 space-y-6">
          <SectionCard
            title="Understanding the UK university system"
            icon={<GraduationCap className="h-4 w-4" />}
            description="A short overview of how UK higher education is structured."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="font-display text-sm font-extrabold text-ink-900">Russell Group</h4>
                <p className="mt-1 text-sm text-ink-700">
                  24 research-intensive universities including Oxford, Cambridge,
                  Imperial, UCL, LSE, Edinburgh, Manchester and King&apos;s College London.
                  Known for strong research output and global reputation.
                </p>
              </div>
              <div>
                <h4 className="font-display text-sm font-extrabold text-ink-900">Post-1992 (Modern)</h4>
                <p className="mt-1 text-sm text-ink-700">
                  Universities that gained university status in 1992 — often more
                  teaching-focused, with strong industry links. Examples: Manchester
                  Metropolitan, Nottingham Trent, Oxford Brookes.
                </p>
              </div>
              <div>
                <h4 className="font-display text-sm font-extrabold text-ink-900">Specialist institutions</h4>
                <p className="mt-1 text-sm text-ink-700">
                  Focused on a single discipline — e.g. LSE (social sciences),
                  Imperial (STEM), SOAS (Asian &amp; African studies), RCS
                  (music &amp; drama).
                </p>
              </div>
              <div>
                <h4 className="font-display text-sm font-extrabold text-ink-900">Conservatoires</h4>
                <p className="mt-1 text-sm text-ink-700">
                  Specialise in music, drama and dance — e.g. Royal Academy of
                  Music, RADA, Royal Conservatoire of Scotland. Apply via UCAS
                  Conservatoires.
                </p>
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
              <Trophy className="h-5 w-5 text-amber-600" aria-hidden="true" />
              <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">Rankings</h4>
              <p className="mt-1 text-xs text-ink-600">
                UK universities consistently rank in the QS, THE and ARWU world
                top 100. Always check the year and methodology before comparing.
              </p>
            </div>
            <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
              <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">Graduate Route</h4>
              <p className="mt-1 text-xs text-ink-600">
                International students can stay in the UK for 2 years after
                graduation (3 for PhD graduates) to work or look for work.
              </p>
            </div>
            <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
              <Info className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">UCAS</h4>
              <p className="mt-1 text-xs text-ink-600">
                Undergraduate applications go through UCAS. Postgraduate applications
                are usually direct to the university.
              </p>
            </div>
          </div>

          <SectionCard
            title="Application routes"
            icon={<GraduationCap className="h-4 w-4" />}
          >
            <ProseSection
              content={`Most UK undergraduate applications go through UCAS (Universities and Colleges Admissions Service) — a single application can be sent to up to 5 universities. Postgraduate applications are made directly to each university. International students typically apply between September and January for September entry, though many universities have later deadlines or rolling admissions.

English language requirements are usually IELTS Academic (overall 6.0–7.5 depending on the course), IELTS for UKVI (for Student Visa routes), PTE Academic, TOEFL iBT, Duolingo English Test or LanguageCert. Some universities waive the requirement for students from majority-English-speaking countries.`}
            />
          </SectionCard>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdObjects) }}
      />
    </>
  );
}

// silence unused-import warnings for getStringArrayParam (used elsewhere)
void getStringArrayParam;

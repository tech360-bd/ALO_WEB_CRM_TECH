/**
 * /higher-study/phd-research
 * --------------------------------------------------------------------
 * PhD and research platform with filters: country, university,
 * department, research area, supervisor, funding status, tuition fee,
 * stipend, start date, deadline, study mode, duration, eligibility,
 * English requirement, verified status.
 *
 * Tabs: All / Fully Funded / Studentships / DTPs / CDTs / Self-Funded /
 * Postdoc.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Building2,
  UserSearch,
  Banknote,
  CalendarClock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { db } from "@/lib/db";
import { COUNTRIES_LIST } from "@/lib/higher-study/constants";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { ResearchCard } from "@/components/higher-study/research-card";
import { LoadingSkeleton } from "@/components/higher-study/loading-skeleton";
import { EmptyState } from "@/components/higher-study/empty-state";
import {
  PageHero,
  StatsStrip,
  SectionCard,
} from "@/components/higher-study/page-hero";
import { ListPageControls } from "@/components/higher-study/list-page-controls";
import { TabsClient } from "@/components/higher-study/tabs-client";
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
  title: "PhD & Research Opportunities — Higher Study | Alaminn.info",
  description:
    "Browse PhD studentships, doctoral training partnerships (DTPs), centres for doctoral training (CDTs), postdoctoral fellowships and self-funded PhD projects. Filter by country, university, department, research area, supervisor, funding status, stipend and deadline.",
  path: "/higher-study/phd-research",
  keywords: [
    "PhD opportunities",
    "PhD studentships",
    "fully funded PhD",
    "DTP",
    "CDT",
    "postdoc",
    "research fellowships",
    "doctoral training",
    "PhD supervisor",
    "research projects",
  ],
});

const TAB_VALUES = [
  "all",
  "fully-funded",
  "studentship",
  "dtp",
  "cdt",
  "self-funded",
  "postdoc",
];

const TAB_LABELS: Record<string, string> = {
  all: "All",
  "fully-funded": "Fully Funded",
  studentship: "Studentships",
  dtp: "DTPs",
  cdt: "CDTs",
  "self-funded": "Self-Funded",
  postdoc: "Postdoc",
};

const FUNDING_STATUSES = [
  { value: "fully-funded", label: "Fully Funded" },
  { value: "partially-funded", label: "Partially Funded" },
  { value: "studentship", label: "Studentship" },
  { value: "self-funded", label: "Self-Funded" },
  { value: "unfunded", label: "Unfunded" },
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
    name: "fundingStatus",
    label: "Funding status",
    type: "select",
    options: FUNDING_STATUSES,
    defaultCollapsed: false,
  },
  {
    name: "tuitionCoverage",
    label: "Tuition covered",
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
  { value: "deadline-asc", label: "Deadline: soonest first" },
  { value: "deadline-desc", label: "Deadline: latest first" },
  { value: "title-asc", label: "Title A→Z" },
  { value: "title-desc", label: "Title Z→A" },
  { value: "featured", label: "Featured first" },
];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function fetchResearch(params: Record<string, string | string[] | undefined>) {
  const page = getPageParam(params);
  const limit = getLimitParam(params, 12);
  const { sort } = getSortParam(params, "deadline-asc");
  const q = getStringParam(params, "q") ?? "";
  const countrySlug = getStringParam(params, "countrySlug");
  const fundingStatus = getStringParam(params, "fundingStatus");
  const tab = getStringParam(params, "tab") ?? "all";
  const tuitionCoverage = getBooleanParam(params, "tuitionCoverage");
  const featured = getBooleanParam(params, "featured");
  const universitySlug = getStringParam(params, "universitySlug");
  const researchAreaSlug = getStringParam(params, "researchAreaSlug");
  const supervisorSlug = getStringParam(params, "supervisorSlug");

  // Tab → fundingStatus mapping
  const tabToFunding: Record<string, string> = {
    "fully-funded": "fully-funded",
    studentship: "studentship",
    "self-funded": "self-funded",
  };
  // DTP and CDT are matched against department/project title text (heuristic)
  const isDtp = tab === "dtp";
  const isCdt = tab === "cdt";
  const isPostdoc = tab === "postdoc";

  const effectiveFundingStatus = fundingStatus ?? (tab && tabToFunding[tab] ? tabToFunding[tab] : undefined);

  const where: Prisma.HigherStudyResearchProjectWhereInput = {
    publicationStatus: "published",
    verificationStatus: { in: ["verified", "published"] },
    OR: [
      { applicationDeadline: null },
      { applicationDeadline: { gte: new Date() } },
    ],
  };

  if (countrySlug) where.university = { ...((where.university as Prisma.HigherStudyUniversityWhereInput) ?? {}), country: { slug: countrySlug } };
  if (effectiveFundingStatus) where.fundingStatus = effectiveFundingStatus;
  if (universitySlug) where.university = { ...((where.university as Prisma.HigherStudyUniversityWhereInput) ?? {}), slug: universitySlug };
  if (researchAreaSlug) where.researchArea = { slug: researchAreaSlug };
  if (supervisorSlug) where.supervisor = { slug: supervisorSlug };
  if (typeof tuitionCoverage === "boolean") where.tuitionCoverage = tuitionCoverage;
  if (typeof featured === "boolean") where.featured = featured;

  if (isDtp) {
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { title: { contains: "DTP" } },
      { title: { contains: "doctoral training partnership" } },
      { department: { contains: "DTP" } },
    ];
  }
  if (isCdt) {
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { title: { contains: "CDT" } },
      { title: { contains: "centre for doctoral training" } },
      { department: { contains: "CDT" } },
    ];
  }
  if (isPostdoc) {
    // Postdoc projects have "postdoc" or "postdoctoral" in the title
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { title: { contains: "postdoc" } },
      { title: { contains: "postdoctoral" } },
    ];
  }

  if (q) {
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { title: { contains: q } },
      { projectSummary: { contains: q } },
      { department: { contains: q } },
    ];
  }

  const orderBy =
    sort === "deadline-asc"
      ? [{ applicationDeadline: { sort: "asc", nulls: "last" } as never }, { featured: "desc" as const }]
      : sort === "deadline-desc"
        ? [{ applicationDeadline: { sort: "desc", nulls: "last" } as never }, { featured: "desc" as const }]
        : sort === "title-asc" || sort === "title-desc"
          ? [{ title: sort === "title-asc" ? "asc" as const : "desc" as const }]
          : [{ featured: "desc" as const }, { lastVerifiedAt: "desc" as const }];

  try {
    const [total, items, tabCounts] = await Promise.all([
      db.higherStudyResearchProject.count({ where }),
      db.higherStudyResearchProject.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          university: {
            select: {
              id: true, slug: true, officialName: true, logoUrl: true,
              country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
            },
          },
          researchArea: { select: { id: true, slug: true, name: true } },
          supervisor: { select: { id: true, slug: true, name: true, academicTitle: true } },
        },
      }),
      Promise.all(
        TAB_VALUES.map(async (t) => ({
          tab: t,
          count:
            t === "all"
              ? await db.higherStudyResearchProject.count({
                  where: {
                    publicationStatus: "published",
                    verificationStatus: { in: ["verified", "published"] },
                    OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: new Date() } }],
                  },
                })
              : t === "fully-funded" || t === "studentship" || t === "self-funded"
                ? await db.higherStudyResearchProject.count({
                    where: {
                      publicationStatus: "published",
                      verificationStatus: { in: ["verified", "published"] },
                      fundingStatus: t,
                      OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: new Date() } }],
                    },
                  })
                : // DTP / CDT / Postdoc — heuristic count
                  await db.higherStudyResearchProject.count({
                    where: {
                      publicationStatus: "published",
                      verificationStatus: { in: ["verified", "published"] },
                      AND: [
                        {
                          OR: [
                            { applicationDeadline: null },
                            { applicationDeadline: { gte: new Date() } },
                          ],
                        },
                        t === "dtp"
                          ? { OR: [{ title: { contains: "DTP" } }, { title: { contains: "doctoral training partnership" } }] }
                          : t === "cdt"
                            ? { OR: [{ title: { contains: "CDT" } }, { title: { contains: "centre for doctoral training" } }] }
                            : { OR: [{ title: { contains: "postdoc" } }, { title: { contains: "postdoctoral" } }] },
                      ],
                    },
                  }),
        })),
      ),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const tabCountMap: Record<string, number> = Object.fromEntries(
      tabCounts.map((t) => [t.tab, t.count]),
    );
    return {
      items,
      meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      tabCounts: tabCountMap,
      error: null,
    };
  } catch (e) {
    console.error("[phd-research] DB error", e);
    return {
      items: [],
      meta: { page, limit, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
      tabCounts: {},
      error: "Could not load research projects from the database.",
    };
  }
}

export default async function PhdResearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { items, meta, tabCounts, error } = await fetchResearch(params);

  const searchValue = getStringParam(params, "q") ?? "";
  const filterValues: FilterValues = buildFilterValuesFromParams(params, [
    { name: "countrySlug", type: "select" },
    { name: "fundingStatus", type: "select" },
    { name: "tuitionCoverage", type: "boolean" },
    { name: "featured", type: "boolean" },
  ]);
  const sortValue = getStringParam(params, "sort") ?? "deadline-asc";
  const orderValue = (getStringParam(params, "order") ?? "asc") as "asc" | "desc";
  const activeTab = getStringParam(params, "tab") ?? "all";

  let stats = { total: 0, fullyFunded: 0, closingSoon: 0 };
  try {
    const now = new Date();
    const soonDeadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [total, fullyFunded, closingSoon] = await Promise.all([
      db.higherStudyResearchProject.count({
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
          OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: now } }],
        },
      }),
      db.higherStudyResearchProject.count({
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
          fundingStatus: "fully-funded",
          OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: now } }],
        },
      }),
      db.higherStudyResearchProject.count({
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
          applicationDeadline: { gte: now, lte: soonDeadline },
        },
      }),
    ]);
    stats = { total, fullyFunded, closingSoon };
  } catch {
    /* ignore */
  }

  const itemListLd = items.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "PhD & Research Opportunities",
    numberOfItems: meta.total,
    itemListElement: items.slice(0, 10).map((r, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: r.title,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/research/${r.slug}`,
    })),
  } : null;
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "PhD & Research", url: `${HIGHER_STUDY_BASE_URL}/higher-study/phd-research` },
  ]);
  const jsonLdObjects = [breadcrumbLd];
  if (itemListLd) jsonLdObjects.push(itemListLd);

  const tabItems = TAB_VALUES.map((t) => ({
    value: t,
    label: TAB_LABELS[t],
    count: tabCounts[t] ?? 0,
    content: t === activeTab ? (
      <ResearchGrid items={items} error={error} meta={meta} />
    ) : (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 p-12 text-center">
        <p className="text-sm text-ink-500">Click to load this tab.</p>
      </div>
    ),
  }));

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "PhD & Research" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="PhD · Postdoc · Fellowships"
        title="PhD & Research Opportunities"
        description="Browse PhD studentships, doctoral training partnerships (DTPs), centres for doctoral training (CDTs), postdoctoral fellowships and self-funded research projects. Filter by country, university, department, research area, supervisor, funding status and deadline."
      >
        <StatsStrip
          stats={[
            { label: "Projects", value: stats.total },
            { label: "Fully funded", value: stats.fullyFunded },
            { label: "Closing soon", value: stats.closingSoon },
            { label: "Funding types", value: FUNDING_STATUSES.length },
          ]}
        />
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <TabsClient items={tabItems} defaultValue="all" paramName="tab" className="mb-5" />

        <ListPageControls
          searchPlaceholder="Search PhD projects by title, summary, department…"
          searchValue={searchValue}
          filters={FILTERS}
          filterValues={filterValues}
          sortOptions={SORT_OPTIONS}
          sortValue={sortValue}
          orderValue={orderValue}
          searchAriaLabel="Search research projects"
        />

        <div className="mt-5">
          <ResearchGrid items={items} error={error} meta={meta} />
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

        {/* Help cards */}
        <section className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
            <Banknote className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">Fully funded?</h4>
            <p className="mt-1 text-xs text-ink-600">
              Fully-funded PhDs cover tuition + provide a stipend (typically
              £15,000–£18,000/yr in the UK). Look for the emerald badge.
            </p>
          </div>
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
            <Building2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">DTPs &amp; CDTs</h4>
            <p className="mt-1 text-xs text-ink-600">
              Doctoral Training Partnerships and Centres for Doctoral Training
              are funded cohorts of PhDs in a specific research theme.
            </p>
          </div>
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
            <UserSearch className="h-5 w-5 text-orange-600" aria-hidden="true" />
            <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">Find a supervisor</h4>
            <p className="mt-1 text-xs text-ink-600">
              Most PhDs require you to identify a supervisor before applying.
              Use our supervisor finder to shortlist faculty.
            </p>
            <Link
              href="/higher-study/supervisors"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              Browse supervisors
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
            <CalendarClock className="h-5 w-5 text-orange-600" aria-hidden="true" />
            <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">Deadlines</h4>
            <p className="mt-1 text-xs text-ink-600">
              Funded PhDs typically have deadlines 6–12 months before the start
              date. Don&apos;t miss the window — start preparing early.
            </p>
          </div>
        </section>

        {/* Consultation CTA */}
        <SectionCard
          className="mt-8 border-blue-200 bg-gradient-to-br from-blue-50 to-orange-50"
          title="Need help with your PhD application?"
          icon={<Sparkles className="h-4 w-4" />}
        >
          <p className="text-sm text-ink-700">
            Our advisors can help you shortlist supervisors, draft your research
            proposal, and identify funded PhDs aligned with your research
            interests. Free 30-minute consultation.
          </p>
          <Link
            href="/higher-study/book-consultation"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-orange hover:bg-orange-700"
          >
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            Book a free consultation
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </SectionCard>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdObjects) }}
      />
    </>
  );
}

function ResearchGrid({
  items,
  error,
  meta,
}: {
  items: Awaited<ReturnType<typeof db.higherStudyResearchProject.findMany>>;
  error: string | null;
  meta: { total: number };
}) {
  if (error) {
    return (
      <EmptyState
        title="Could not load research projects"
        description={error}
        icon={FlaskConical}
      />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="No research projects match your filters"
        description="Try removing some filters or widening your search to see more PhD and postdoc opportunities."
        icon={FlaskConical}
        action={{ label: "Browse all projects", href: "/higher-study/phd-research" }}
      />
    );
  }
  void meta;
  return (
    <Suspense fallback={<LoadingSkeleton type="research" count={6} />}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <ResearchCard key={r.id} research={r as never} />
        ))}
      </div>
    </Suspense>
  );
}

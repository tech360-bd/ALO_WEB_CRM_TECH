/**
 * /higher-study/scholarships
 * --------------------------------------------------------------------
 * Scholarship intelligence centre with filters: country, university,
 * study level, subject, nationality, funding type (24 options),
 * funding amount range, deadline range, verified status.
 *
 * Tabs: All / Fully Funded / Government / University / PhD Studentships /
 * Merit Based / Need Based. Deadline countdown badge for scholarships
 * closing within 30 days.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  Award,
  Sparkles,
  DollarSign,
  CalendarClock,
  Globe2,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  COUNTRIES_LIST,
  FUNDING_TYPES,
  SCHOLARSHIP_PROGRAMS,
} from "@/lib/higher-study/constants";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { ScholarshipCard } from "@/components/higher-study/scholarship-card";
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
  title: "Scholarships — Higher Study | Alaminn.info",
  description:
    "Browse 24 funding types — fully-funded, government, university, PhD studentships, merit-based, need-based and more. Filter by country, study level, subject, nationality, deadline range and verified status. Apply through ALO Education with consent-tracked referral.",
  path: "/higher-study/scholarships",
  keywords: [
    "scholarships",
    "fully funded scholarships",
    "government scholarships",
    "university scholarships",
    "PhD studentships",
    "merit scholarships",
    "need-based scholarships",
    "Chevening",
    "Commonwealth",
    "Erasmus Mundus",
    "DAAD",
    "Fulbright",
  ],
});

const TAB_VALUES = [
  "all",
  "fully-funded",
  "government",
  "university",
  "phd-studentship",
  "merit",
  "need",
];

const TAB_LABELS: Record<string, string> = {
  all: "All",
  "fully-funded": "Fully Funded",
  government: "Government",
  university: "University",
  "phd-studentship": "PhD Studentships",
  merit: "Merit Based",
  need: "Need Based",
};

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
    name: "fundingType",
    label: "Funding type",
    type: "select",
    options: FUNDING_TYPES.map((f) => ({ value: f.value, label: f.label })),
    defaultCollapsed: false,
  },
  {
    name: "tuitionCoverage",
    label: "Covers tuition",
    type: "boolean",
    defaultCollapsed: true,
  },
  {
    name: "livingCostCoverage",
    label: "Covers living costs",
    type: "boolean",
    defaultCollapsed: true,
  },
  {
    name: "travelSupport",
    label: "Travel support",
    type: "boolean",
    defaultCollapsed: true,
  },
  {
    name: "healthInsurance",
    label: "Health insurance",
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
  { value: "name-asc", label: "Name A→Z" },
  { value: "name-desc", label: "Name Z→A" },
  { value: "featured", label: "Featured first" },
];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function fetchScholarships(params: Record<string, string | string[] | undefined>) {
  const page = getPageParam(params);
  const limit = getLimitParam(params, 12);
  const { sort, order } = getSortParam(params, "deadline-asc");
  const q = getStringParam(params, "q") ?? "";
  const countrySlug = getStringParam(params, "countrySlug");
  const fundingType = getStringParam(params, "fundingType");
  const tab = getStringParam(params, "tab") ?? "all";
  const tuitionCoverage = getBooleanParam(params, "tuitionCoverage");
  const livingCostCoverage = getBooleanParam(params, "livingCostCoverage");
  const travelSupport = getBooleanParam(params, "travelSupport");
  const healthInsurance = getBooleanParam(params, "healthInsurance");
  const featured = getBooleanParam(params, "featured");
  const universitySlug = getStringParam(params, "universitySlug");

  // Resolve effective funding type from tab (if user clicked a tab)
  const effectiveFundingType = fundingType ?? (tab !== "all" ? tab : undefined);

  const where: Prisma.HigherStudyScholarshipWhereInput = {
    publicationStatus: "published",
    verificationStatus: { in: ["verified", "published"] },
    OR: [
      { deadline: null },
      { deadline: { gte: new Date() } },
    ],
  };

  if (countrySlug) where.country = { slug: countrySlug };
  if (effectiveFundingType) where.fundingType = effectiveFundingType;
  if (universitySlug) where.university = { slug: universitySlug };
  if (typeof tuitionCoverage === "boolean") where.tuitionCoverage = tuitionCoverage;
  if (typeof livingCostCoverage === "boolean") where.livingCostCoverage = livingCostCoverage;
  if (typeof travelSupport === "boolean") where.travelSupport = travelSupport;
  if (typeof healthInsurance === "boolean") where.healthInsurance = healthInsurance;
  if (typeof featured === "boolean") where.featured = featured;

  if (q) {
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { name: { contains: q } },
      { provider: { contains: q } },
      { eligibilityCriteria: { contains: q } },
    ];
  }

  // Sorting — handle nulls on deadline column gracefully
  const orderBy =
    sort === "deadline-asc"
      ? [{ deadline: { sort: "asc", nulls: "last" } as never }, { featured: "desc" as const }]
      : sort === "deadline-desc"
        ? [{ deadline: { sort: "desc", nulls: "last" } as never }, { featured: "desc" as const }]
        : sort === "name-asc" || sort === "name-desc"
          ? [{ name: sort === "name-asc" ? "asc" as const : "desc" as const }]
          : [{ featured: "desc" as const }, { lastVerifiedAt: "desc" as const }];

  void order;

  try {
    const [total, items, tabCounts] = await Promise.all([
      db.higherStudyScholarship.count({ where }),
      db.higherStudyScholarship.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          university: {
            select: { id: true, slug: true, officialName: true, logoUrl: true },
          },
        },
      }),
      // Tab counts — fetch in parallel
      Promise.all(
        TAB_VALUES.map(async (t) => ({
          tab: t,
          count: t === "all"
            ? await db.higherStudyScholarship.count({
                where: {
                  publicationStatus: "published",
                  verificationStatus: { in: ["verified", "published"] },
                  OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
                },
              })
            : await db.higherStudyScholarship.count({
                where: {
                  publicationStatus: "published",
                  verificationStatus: { in: ["verified", "published"] },
                  fundingType: t,
                  OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
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
    console.error("[scholarships] DB error", e);
    return {
      items: [],
      meta: { page, limit, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
      tabCounts: {},
      error: "Could not load scholarships from the database.",
    };
  }
}

export default async function ScholarshipsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { items, meta, tabCounts, error } = await fetchScholarships(params);

  const searchValue = getStringParam(params, "q") ?? "";
  const filterValues: FilterValues = buildFilterValuesFromParams(params, [
    { name: "countrySlug", type: "select" },
    { name: "fundingType", type: "select" },
    { name: "tuitionCoverage", type: "boolean" },
    { name: "livingCostCoverage", type: "boolean" },
    { name: "travelSupport", type: "boolean" },
    { name: "healthInsurance", type: "boolean" },
    { name: "featured", type: "boolean" },
  ]);
  const sortValue = getStringParam(params, "sort") ?? "deadline-asc";
  const orderValue = (getStringParam(params, "order") ?? "asc") as "asc" | "desc";
  const activeTab = getStringParam(params, "tab") ?? "all";

  let stats = { total: 0, fullyFunded: 0, closingSoon: 0, programmes: SCHOLARSHIP_PROGRAMS.length };
  try {
    const now = new Date();
    const soonDeadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [total, fullyFunded, closingSoon] = await Promise.all([
      db.higherStudyScholarship.count({
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
          OR: [{ deadline: null }, { deadline: { gte: now } }],
        },
      }),
      db.higherStudyScholarship.count({
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
          fundingType: "fully-funded",
          OR: [{ deadline: null }, { deadline: { gte: now } }],
        },
      }),
      db.higherStudyScholarship.count({
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
          deadline: { gte: now, lte: soonDeadline },
        },
      }),
    ]);
    stats = { total, fullyFunded, closingSoon, programmes: SCHOLARSHIP_PROGRAMS.length };
  } catch {
    /* ignore */
  }

  const itemListLd = items.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Higher Study Scholarships",
    numberOfItems: meta.total,
    itemListElement: items.slice(0, 10).map((s, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: s.name,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/scholarships/${s.slug}`,
    })),
  } : null;
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Scholarships", url: `${HIGHER_STUDY_BASE_URL}/higher-study/scholarships` },
  ]);
  const jsonLdObjects = [breadcrumbLd];
  if (itemListLd) jsonLdObjects.push(itemListLd);

  // Build tab items — each tab's content is the SAME grid + filters
  // (the tab selection drives the fundingType filter via URL ?tab=).
  const tabItems = TAB_VALUES.map((t) => ({
    value: t,
    label: TAB_LABELS[t],
    count: tabCounts[t] ?? 0,
    content: t === activeTab ? (
      <ScholarshipGrid items={items} error={error} meta={meta} />
    ) : (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 p-12 text-center">
        <p className="text-sm text-ink-500">Click to load this tab.</p>
      </div>
    ),
  }));

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "Scholarships" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="24 funding types · 11 programmes"
        title="Scholarship Intelligence Centre"
        description="Browse fully-funded, government, university, PhD studentships, merit-based and need-based scholarships. Filter by country, study level, subject, nationality, deadline range and verified status — and apply with a consent-tracked referral."
      >
        <StatsStrip
          stats={[
            { label: "Scholarships", value: stats.total },
            { label: "Fully funded", value: stats.fullyFunded },
            { label: "Closing soon", value: stats.closingSoon },
            { label: "Major programmes", value: stats.programmes },
          ]}
        />
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        {/* Tabs */}
        <TabsClient
          items={tabItems}
          defaultValue="all"
          paramName="tab"
          className="mb-5"
        />

        <ListPageControls
          searchPlaceholder="Search scholarships by name, provider, eligibility…"
          searchValue={searchValue}
          filters={FILTERS}
          filterValues={filterValues}
          sortOptions={SORT_OPTIONS}
          sortValue={sortValue}
          orderValue={orderValue}
          searchAriaLabel="Search scholarships"
        />

        <div className="mt-5">
          <ScholarshipGrid items={items} error={error} meta={meta} />
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

        {/* Major programmes strip */}
        <section className="mt-12">
          <h2 className="font-display text-lg font-extrabold text-ink-900">
            Major scholarship programmes
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Eleven of the world&apos;s most-awarded scholarship programmes. Click
            through to the official programme site for full eligibility details.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SCHOLARSHIP_PROGRAMS.map((p) => (
              <div
                key={p.slug}
                className="group rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-extrabold text-ink-900">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">{p.provider}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-700 ring-1 ring-orange-200">
                    {p.region}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-600">
                  {p.summary}
                </p>
                <a
                  href={p.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  Official site
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Help cards */}
        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
            <DollarSign className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">
              Fully-funded?
            </h4>
            <p className="mt-1 text-xs text-ink-600">
              Fully-funded scholarships cover tuition + living costs + often
              travel and health insurance. Look for the emerald ring on the card.
            </p>
          </div>
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
            <CalendarClock className="h-5 w-5 text-orange-600" aria-hidden="true" />
            <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">
              Deadline countdown
            </h4>
            <p className="mt-1 text-xs text-ink-600">
              We highlight scholarships closing within 30 days with an orange
              countdown badge. Set up an alert to be reminded before they close.
            </p>
          </div>
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
            <Globe2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h4 className="mt-2 font-display text-sm font-extrabold text-ink-900">
              Country-specific
            </h4>
            <p className="mt-1 text-xs text-ink-600">
              Many scholarships target specific nationalities. Use the country
              filter to find ones you&apos;re eligible for as a Bangladeshi
              applicant.
            </p>
          </div>
        </section>

        {/* Consultation CTA */}
        <SectionCard
          className="mt-8 border-blue-200 bg-gradient-to-br from-blue-50 to-orange-50"
          title="Need help choosing the right scholarship?"
          icon={<Sparkles className="h-4 w-4" />}
        >
          <p className="text-sm text-ink-700">
            Our advisors can review your profile and shortlist 5–10 scholarships
            you have a realistic chance of winning. Free 30-minute consultation,
            online via Google Meet.
          </p>
          <Link
            href="/higher-study/book-consultation"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-orange hover:bg-orange-700"
          >
            <Award className="h-4 w-4" aria-hidden="true" />
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

// ── Grid wrapper ────────────────────────────────────────────────────

function ScholarshipGrid({
  items,
  error,
  meta,
}: {
  items: Awaited<ReturnType<typeof db.higherStudyScholarship.findMany>>;
  error: string | null;
  meta: { total: number };
}) {
  if (error) {
    return (
      <EmptyState
        title="Could not load scholarships"
        description={error}
        icon={Award}
      />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="No scholarships match your filters"
        description="Try removing some filters or widening your search to see more scholarships."
        icon={Award}
        action={{ label: "Browse all scholarships", href: "/higher-study/scholarships" }}
      />
    );
  }
  void meta;
  return (
    <Suspense fallback={<LoadingSkeleton type="scholarship" count={6} />}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <ScholarshipCard key={s.id} scholarship={s as never} />
        ))}
      </div>
    </Suspense>
  );
}

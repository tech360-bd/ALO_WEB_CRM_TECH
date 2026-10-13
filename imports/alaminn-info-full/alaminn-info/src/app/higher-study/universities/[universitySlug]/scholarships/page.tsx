/**
 * /higher-study/universities/[universitySlug]/scholarships
 * --------------------------------------------------------------------
 * Lists all scholarships available at a single university (or in its
 * country when the scholarship has no university link).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Award, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { ScholarshipCard } from "@/components/higher-study/scholarship-card";
import { EmptyState } from "@/components/higher-study/empty-state";
import { PaginationClient } from "@/components/higher-study/pagination-client";
import { PageHero } from "@/components/higher-study/page-hero";
import { ListPageControls } from "@/components/higher-study/list-page-controls";
import { LoadingSkeleton } from "@/components/higher-study/loading-skeleton";
import { Suspense } from "react";
import {
  getStringParam,
  getBooleanParam,
  getPageParam,
  getLimitParam,
  buildFilterValuesFromParams,
} from "@/app/higher-study/_lib/search-params";
import type { FilterDefinition, FilterValues } from "@/components/higher-study/filter-panel";
import { FUNDING_TYPES } from "@/lib/higher-study/constants";
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
      path: `/higher-study/universities/${universitySlug}/scholarships`,
      noindex: true,
    });
  }
  return buildHigherStudyMetadata({
    title: `Scholarships at ${name} — Higher Study`,
    description: `Browse all scholarship and funding opportunities at ${name}. Filter by funding type, coverage and deadline. Apply through ALO Education.`,
    path: `/higher-study/universities/${universitySlug}/scholarships`,
    keywords: [`${name} scholarships`, `${name} funding`, "study abroad", "scholarships"],
  });
}

// ─── Filter definitions ───────────────────────────────────────────────

const FILTERS: FilterDefinition[] = [
  {
    name: "fundingType",
    label: "Funding type",
    type: "select",
    options: FUNDING_TYPES.map((f) => ({ value: f.value, label: f.label })),
  },
  {
    name: "tuitionCoverage",
    label: "Covers tuition",
    type: "boolean",
  },
  {
    name: "livingCostCoverage",
    label: "Covers living cost",
    type: "boolean",
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
];

const SORT_OPTIONS = [
  { value: "deadline-asc", label: "Deadline: soonest first" },
  { value: "deadline-desc", label: "Deadline: latest first" },
  { value: "featured", label: "Featured first" },
  { value: "name-asc", label: "Name A→Z" },
];

// ─── Page ─────────────────────────────────────────────────────────────

export default async function UniversityScholarshipsPage({
  params,
  searchParams,
}: PageProps) {
  const { universitySlug } = await params;
  const sp = await searchParams;

  const university = await db.higherStudyUniversity
    .findUnique({
      where: { slug: universitySlug },
      select: {
        id: true,
        slug: true,
        officialName: true,
        countryId: true,
        country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
      },
    })
    .catch(() => null);

  if (!university) {
    notFound();
  }

  const page = getPageParam(sp);
  const limit = getLimitParam(sp, 20);
  const fundingType = getStringParam(sp, "fundingType");
  const tuitionCoverage = getBooleanParam(sp, "tuitionCoverage");
  const livingCostCoverage = getBooleanParam(sp, "livingCostCoverage");
  const travelSupport = getBooleanParam(sp, "travelSupport");
  const healthInsurance = getBooleanParam(sp, "healthInsurance");
  const sort = getStringParam(sp, "sort") ?? "deadline-asc";
  const order = (getStringParam(sp, "order") ?? "asc") as "asc" | "desc";

  const where: Prisma.HigherStudyScholarshipWhereInput = {
    OR: [
      { universityId: university.id },
      { countryId: university.countryId },
    ],
    publicationStatus: "published",
    verificationStatus: { in: ["verified", "published"] },
  };
  if (fundingType) where.fundingType = fundingType;
  if (typeof tuitionCoverage === "boolean") where.tuitionCoverage = tuitionCoverage;
  if (typeof livingCostCoverage === "boolean") where.livingCostCoverage = livingCostCoverage;
  if (typeof travelSupport === "boolean") where.travelSupport = travelSupport;
  if (typeof healthInsurance === "boolean") where.healthInsurance = healthInsurance;

  const sortMap: Record<string, string> = {
    "deadline-asc": "deadline",
    "deadline-desc": "deadline",
    "name-asc": "name",
    featured: "featured",
  };
  const sortField = sortMap[sort] ?? "deadline";
  const orderBy: Prisma.HigherStudyScholarshipOrderByWithRelationInput[] =
    sort === "featured"
      ? [{ featured: "desc" }, { deadline: "asc" }]
      : [{ [sortField]: order }, { name: "asc" }];

  const [total, items] = await Promise.all([
    db.higherStudyScholarship.count({ where }).catch(() => 0),
    db.higherStudyScholarship
      .findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          university: { select: { id: true, slug: true, officialName: true } },
        },
      })
      .catch(() => []),
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
    { name: "fundingType", type: "select" },
    { name: "tuitionCoverage", type: "boolean" },
    { name: "livingCostCoverage", type: "boolean" },
    { name: "travelSupport", type: "boolean" },
    { name: "healthInsurance", type: "boolean" },
  ]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Universities", href: "/higher-study/global-universities" },
    { label: university.officialName, href: `/higher-study/universities/${university.slug}` },
    { label: "Scholarships" },
  ];

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Universities", url: `${HIGHER_STUDY_BASE_URL}/higher-study/global-universities` },
    {
      name: university.officialName,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${university.slug}`,
    },
    {
      name: "Scholarships",
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${university.slug}/scholarships`,
    },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={breadcrumbItems}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="University scholarships"
        title={`Scholarships at ${university.officialName}`}
        description={`Funding opportunities at ${university.officialName} and in ${university.country?.name ?? "this country"}. Filter by funding type, coverage and deadline.`}
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
            <Award className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
            {total} scholarship{total === 1 ? "" : "s"}
          </span>
        </div>
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <ListPageControls
          searchPlaceholder="Search scholarships…"
          searchValue={getStringParam(sp, "q") ?? ""}
          filters={FILTERS}
          filterValues={filterValues}
          sortOptions={SORT_OPTIONS}
          sortValue={sort}
          orderValue={order}
          searchAriaLabel="Search scholarships at this university"
        />

        <div className="mt-5">
          {items.length === 0 ? (
            <EmptyState
              title="No scholarships match your filters"
              description="Try removing some filters or browse all scholarships."
              icon={Award}
              action={{
                label: "Browse all scholarships",
                href: "/higher-study/scholarships",
              }}
            />
          ) : (
            <Suspense fallback={<LoadingSkeleton type="scholarship" count={6} />}>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <ScholarshipCard key={s.id} scholarship={s as never} />
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

/**
 * /higher-study/supervisors
 * --------------------------------------------------------------------
 * Supervisor finder with filters: name (search), university, country,
 * department, research area, keywords, publications, available
 * projects, accepting-student status, verified date.
 *
 * Sidebar: supervisor email guide, research-interest matching, academic
 * CV checklist, research proposal checklist, contact preparation,
 * follow-up etiquette, interview preparation (as links to study
 * resources).
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  UserSearch,
  Building2,
  FileText,
  Mail,
  FileCheck,
  MessageSquare,
  Clock,
  Video,
  Sparkles,
  ArrowRight,
  Download,
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
import { SupervisorCard } from "@/components/higher-study/supervisor-card";
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
  title: "Supervisor Finder — Higher Study | Alaminn.info",
  description:
    "Find university supervisors currently accepting PhD / research students. Filter by name, university, country, department, research area, accepting-students status and verified date. Includes email guide, CV checklist and research proposal checklist.",
  path: "/higher-study/supervisors",
  keywords: [
    "PhD supervisor",
    "find a supervisor",
    "research supervisor",
    "academic supervisor",
    "supervisor email",
    "research proposal",
    "academic CV",
    "PhD interview",
    "principal investigator",
  ],
});

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
    name: "acceptingStudents",
    label: "Accepting students now",
    type: "boolean",
    defaultCollapsed: false,
  },
  // Note: HigherStudySupervisor has no `featured` column — accepting-students
  // is the closest equivalent "is this supervisor active?" signal.
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A→Z" },
  { value: "name-desc", label: "Name Z→A" },
  { value: "featured", label: "Accepting students first" },
  { value: "recent", label: "Recently verified" },
];

const SIDEBAR_RESOURCES = [
  {
    icon: Mail,
    title: "Supervisor Email Guide",
    description: "How to write a first-contact email that gets a response.",
    href: "/higher-study/study-resources/supervisor-email-guide",
  },
  {
    icon: Sparkles,
    title: "Research Interest Matching",
    description: "How to align your interests with a supervisor's publications.",
    href: "/higher-study/study-resources/research-interest-matching",
  },
  {
    icon: FileText,
    title: "Academic CV Checklist",
    description: "What to include — and what to leave out — on an academic CV.",
    href: "/higher-study/study-resources/academic-cv-checklist",
  },
  {
    icon: FileCheck,
    title: "Research Proposal Checklist",
    description: "Structure, length, references and what reviewers look for.",
    href: "/higher-study/study-resources/research-proposal-checklist",
  },
  {
    icon: MessageSquare,
    title: "Contact Preparation",
    description: "Read their last 5 papers before reaching out — here's how.",
    href: "/higher-study/study-resources/supervisor-contact-preparation",
  },
  {
    icon: Clock,
    title: "Follow-up Etiquette",
    description: "When and how to follow up if you don't hear back.",
    href: "/higher-study/study-resources/supervisor-follow-up-etiquette",
  },
  {
    icon: Video,
    title: "Interview Preparation",
    description: "Common PhD interview questions and how to answer them.",
    href: "/higher-study/study-resources/phd-interview-preparation",
  },
];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function fetchSupervisors(params: Record<string, string | string[] | undefined>) {
  const page = getPageParam(params);
  const limit = getLimitParam(params, 12);
  const { sort } = getSortParam(params, "featured");
  const q = getStringParam(params, "q") ?? "";
  const countrySlug = getStringParam(params, "countrySlug");
  const acceptingStudents = getBooleanParam(params, "acceptingStudents");
  const _featured = getBooleanParam(params, "featured");
  const universitySlug = getStringParam(params, "universitySlug");
  const researchAreaSlug = getStringParam(params, "researchAreaSlug");

  const where: Prisma.HigherStudySupervisorWhereInput = {
    publicationStatus: "published",
    verificationStatus: { in: ["verified", "published"] },
  };

  if (countrySlug) where.university = { ...((where.university as Prisma.HigherStudyUniversityWhereInput) ?? {}), country: { slug: countrySlug } };
  if (universitySlug) where.university = { ...((where.university as Prisma.HigherStudyUniversityWhereInput) ?? {}), slug: universitySlug };
  if (researchAreaSlug) where.researchArea = { slug: researchAreaSlug };
  if (typeof acceptingStudents === "boolean") where.acceptingStudents = acceptingStudents;
  // Note: HigherStudySupervisor has no `featured` column — skip the filter.

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { researchInterests: { contains: q } },
      { department: { contains: q } },
      { selectedPublications: { contains: q } },
    ];
  }

  const orderBy =
    sort === "name-asc"
      ? [{ name: "asc" as const }]
      : sort === "name-desc"
        ? [{ name: "desc" as const }]
        : sort === "recent"
          ? [{ lastVerifiedAt: "desc" as const }]
          : [{ acceptingStudents: "desc" as const }, { lastVerifiedAt: "desc" as const }];

  try {
    const [total, items] = await Promise.all([
      db.higherStudySupervisor.count({ where }),
      db.higherStudySupervisor.findMany({
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
    console.error("[supervisors] DB error", e);
    return {
      items: [],
      meta: { page, limit, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
      error: "Could not load supervisors from the database.",
    };
  }
}

export default async function SupervisorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { items, meta, error } = await fetchSupervisors(params);

  const searchValue = getStringParam(params, "q") ?? "";
  const filterValues: FilterValues = buildFilterValuesFromParams(params, [
    { name: "countrySlug", type: "select" },
    { name: "acceptingStudents", type: "boolean" },
  ]);
  const sortValue = getStringParam(params, "sort") ?? "featured";
  const orderValue = (getStringParam(params, "order") ?? "desc") as "asc" | "desc";

  let stats = { total: 0, accepting: 0, countries: 0 };
  try {
    const [total, accepting, countries] = await Promise.all([
      db.higherStudySupervisor.count({
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
        },
      }),
      db.higherStudySupervisor.count({
        where: {
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
          acceptingStudents: true,
        },
      }),
      db.higherStudyCountry.count({
        where: {
          status: "published",
          universities: {
            some: {
              publicationStatus: "published",
              supervisors: {
                some: {
                  publicationStatus: "published",
                  verificationStatus: { in: ["verified", "published"] },
                },
              },
            },
          },
        },
      }),
    ]);
    stats = { total, accepting, countries };
  } catch {
    /* ignore */
  }

  const itemListLd = items.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Higher Study Supervisors",
    numberOfItems: meta.total,
    itemListElement: items.slice(0, 10).map((s, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: s.name,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/supervisors/${s.slug}`,
    })),
  } : null;
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Supervisor Finder", url: `${HIGHER_STUDY_BASE_URL}/higher-study/supervisors` },
  ]);
  const jsonLdObjects = [breadcrumbLd];
  if (itemListLd) jsonLdObjects.push(itemListLd);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "Supervisor Finder" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="Find a PhD supervisor"
        title="Supervisor Finder"
        description="Search supervisors by name, university, department or research interest. Look for the green indicator showing they're currently accepting students — then prepare your first-contact email using our guide."
      >
        <StatsStrip
          stats={[
            { label: "Supervisors", value: stats.total },
            { label: "Accepting now", value: stats.accepting },
            { label: "Countries", value: stats.countries },
          ]}
        />
      </PageHero>

      <div className="mx-auto grid max-w-[1320px] gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1fr_320px]">
        <div>
          <ListPageControls
            searchPlaceholder="Search supervisors by name, research interest, department…"
            searchValue={searchValue}
            filters={FILTERS}
            filterValues={filterValues}
            sortOptions={SORT_OPTIONS}
            sortValue={sortValue}
            orderValue={orderValue}
            searchAriaLabel="Search supervisors"
          />

          <div className="mt-5">
            {error ? (
              <EmptyState
                title="Could not load supervisors"
                description={error}
                icon={UserSearch}
              />
            ) : items.length === 0 ? (
              <EmptyState
                title="No supervisors match your filters"
                description="Try removing some filters or widening your search."
                icon={UserSearch}
                action={{ label: "Browse all supervisors", href: "/higher-study/supervisors" }}
              />
            ) : (
              <Suspense fallback={<LoadingSkeleton type="supervisor" count={6} />}>
                <div className="grid gap-5 sm:grid-cols-2">
                  {items.map((s) => (
                    <SupervisorCard key={s.id} supervisor={s as never} />
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

        {/* Sidebar: guides */}
        <aside className="space-y-4 lg:sticky lg:top-[148px] lg:self-start">
          <SectionCard
            title="Supervisor contact toolkit"
            icon={<FileText className="h-4 w-4" />}
            description="Guides to help you find, contact and impress potential supervisors."
          >
            <ul className="space-y-2">
              {SIDEBAR_RESOURCES.map((r) => {
                const Icon = r.icon;
                return (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="group flex items-start gap-3 rounded-xl border border-ink-100 bg-ink-50/40 p-3 transition-colors hover:border-blue-200 hover:bg-white"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-bold text-ink-900">
                          {r.title}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-600">{r.description}</p>
                      </div>
                      <Download className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-400 group-hover:text-blue-600" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <SectionCard
            title="Ready to apply?"
            icon={<Sparkles className="h-4 w-4" />}
          >
            <p className="text-sm text-ink-600">
              Once you&apos;ve shortlisted 3–5 supervisors and sent your first-contact
              emails, our team can review your CV and proposal before you submit.
            </p>
            <Link
              href="/higher-study/book-consultation"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-2 text-xs font-bold text-white shadow-orange hover:bg-orange-700"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Get a free review
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </SectionCard>
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdObjects) }}
      />
    </>
  );
}

// silence unused import
void Building2;

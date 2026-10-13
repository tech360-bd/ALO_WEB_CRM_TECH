/**
 * /higher-study/universities/[universitySlug]/research
 * --------------------------------------------------------------------
 * Lists all research projects + supervisors at a single university.
 * Two tabs: Research Projects | Supervisors.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, FlaskConical, Users } from "lucide-react";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { ResearchCard } from "@/components/higher-study/research-card";
import { SupervisorCard } from "@/components/higher-study/supervisor-card";
import { EmptyState } from "@/components/higher-study/empty-state";
import { PageHero } from "@/components/higher-study/page-hero";
import { TabsClient } from "@/components/higher-study/tabs-client";
import type { BreadcrumbItem } from "@/components/higher-study/breadcrumb";

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
      path: `/higher-study/universities/${universitySlug}/research`,
      noindex: true,
    });
  }
  return buildHigherStudyMetadata({
    title: `Research at ${name} — Higher Study`,
    description: `PhD projects, postdocs and supervisors at ${name}. Filter by research area, funding status and accepting-students status.`,
    path: `/higher-study/universities/${universitySlug}/research`,
    keywords: [`${name} research`, `${name} PhD`, "PhD projects", "supervisors", "research areas"],
  });
}

// ─── Page ─────────────────────────────────────────────────────────────

export default async function UniversityResearchPage({
  params,
}: PageProps) {
  const { universitySlug } = await params;

  const university = await db.higherStudyUniversity
    .findUnique({
      where: { slug: universitySlug },
      select: {
        id: true,
        slug: true,
        officialName: true,
        country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
      },
    })
    .catch(() => null);

  if (!university) {
    notFound();
  }

  const [researchProjects, supervisors] = await Promise.all([
    db.higherStudyResearchProject
      .findMany({
        where: {
          universityId: university.id,
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
        },
        take: 24,
        orderBy: [{ featured: "desc" }, { applicationDeadline: "asc" }],
        include: {
          university: { select: { id: true, slug: true, officialName: true } },
          supervisor: { select: { id: true, slug: true, name: true, academicTitle: true } },
        },
      })
      .catch(() => []),
    db.higherStudySupervisor
      .findMany({
        where: {
          universityId: university.id,
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
        },
        take: 24,
        orderBy: [{ acceptingStudents: "desc" }, { lastVerifiedAt: "desc" }],
        include: {
          university: { select: { id: true, slug: true, officialName: true } },
        },
      })
      .catch(() => []),
  ]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Universities", href: "/higher-study/global-universities" },
    { label: university.officialName, href: `/higher-study/universities/${university.slug}` },
    { label: "Research" },
  ];

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Universities", url: `${HIGHER_STUDY_BASE_URL}/higher-study/global-universities` },
    {
      name: university.officialName,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${university.slug}`,
    },
    {
      name: "Research",
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${university.slug}/research`,
    },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={breadcrumbItems}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="University research"
        title={`Research at ${university.officialName}`}
        description={`PhD projects, postdocs, fellowships and supervisors at ${university.officialName}. Apply through ALO Education with verified referral tracking.`}
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
            <FlaskConical className="h-3.5 w-3.5 text-purple-600" aria-hidden="true" />
            {researchProjects.length} research project{researchProjects.length === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700">
            <Users className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
            {supervisors.length} supervisor{supervisors.length === 1 ? "" : "s"}
          </span>
        </div>
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <TabsClient
          defaultValue="projects"
          items={[
            {
              value: "projects",
              label: "Research Projects",
              count: researchProjects.length,
              content:
                researchProjects.length === 0 ? (
                  <EmptyState
                    title="No research projects published yet"
                    description="Check back soon — new PhD projects are added regularly."
                    icon={FlaskConical}
                    action={{
                      label: "Browse all PhD projects",
                      href: "/higher-study/phd-research",
                    }}
                  />
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {researchProjects.map((r) => (
                      <ResearchCard key={r.id} research={r as never} />
                    ))}
                  </div>
                ),
            },
            {
              value: "supervisors",
              label: "Supervisors",
              count: supervisors.length,
              content:
                supervisors.length === 0 ? (
                  <EmptyState
                    title="No supervisor profiles published yet"
                    description="Check back soon — supervisor profiles are added regularly."
                    icon={Users}
                    action={{
                      label: "Browse all supervisors",
                      href: "/higher-study/supervisors",
                    }}
                  />
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {supervisors.map((s) => (
                      <SupervisorCard key={s.id} supervisor={s as never} />
                    ))}
                  </div>
                ),
            },
          ]}
        />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}

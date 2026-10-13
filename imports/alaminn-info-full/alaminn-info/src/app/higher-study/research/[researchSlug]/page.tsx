/**
 * /higher-study/research/[researchSlug]
 * --------------------------------------------------------------------
 * PhD / research project detail page per master prompt §13. Renders
 * header (title, university link, department, research group, supervisor
 * link, funding-status badge), project summary, research objectives,
 * methodology summary, candidate profile, academic + English requirements,
 * funding status (tuition coverage, stipend, additional funding),
 * duration, start date, application deadline (with countdown), required
 * documents, application process, sticky sidebar (Apply / Save / Compare /
 * Contact supervisor guidance / Check Eligibility), verification footer,
 * related research, JSON-LD (Article + BreadcrumbList), generateMetadata
 * + generateStaticParams.
 *
 * Note: the canonical route is `/higher-study/research/[researchSlug]`
 * (matching the ResearchCard link). The listing page at `/higher-study/phd-research`
 * is the canonical list.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FlaskConical,
  Building2,
  UserCircle,
  Banknote,
  CalendarClock,
  Calendar,
  Clock,
  Target,
  FileText,
  ClipboardCheck,
  BookOpen,
  Mail,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ListChecks,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { ResearchCard } from "@/components/higher-study/research-card";
import { ApplyCta } from "@/components/higher-study/apply-cta";
import { SaveButton } from "@/components/higher-study/save-button";
import { CompareButton } from "@/components/higher-study/compare-button";
import {
  DetailShell,
  DetailLayout,
  DetailHero,
  DetailCard,
  SidebarCard,
  SidebarActionLink,
  MetaGrid,
  type MetaItemProps,
  ProseParagraphs,
  InfoRow,
  Checklist,
  HeroMetaItem,
  FeaturedBadge,
  DeadlineBadge,
  VerificationFooter,
  RelatedSection,
  JsonLdScript,
  EmptyDataNote,
  parseCommaList,
  formatDate,
  deadlineCountdown,
} from "../../_lib/detail-helpers";
import type { BreadcrumbItem } from "@/components/higher-study/breadcrumb";
import type { ResearchProject } from "@/lib/higher-study/types";

// ─── Static params ────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const items = await db.higherStudyResearchProject.findMany({
      where: { publicationStatus: "published" },
      select: { slug: true },
      take: 50,
      orderBy: [{ featured: "desc" }, { applicationDeadline: "asc" }],
    });
    return items.map((r) => ({ researchSlug: r.slug }));
  } catch {
    return [];
  }
}

// ─── Dynamic metadata ─────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ researchSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { researchSlug } = await params;
  let research: {
    title: string;
    projectSummary: string | null;
    slug: string;
    fundingStatus: string | null;
    applicationDeadline: Date | null;
    university: { officialName: string; slug: string } | null;
  } | null = null;
  try {
    research = await db.higherStudyResearchProject.findUnique({
      where: { slug: researchSlug },
      select: {
        title: true,
        projectSummary: true,
        slug: true,
        fundingStatus: true,
        applicationDeadline: true,
        university: { select: { officialName: true, slug: true } },
      },
    });
  } catch {
    /* ignore */
  }
  if (!research) {
    return buildHigherStudyMetadata({
      title: "Research project not found — Higher Study",
      description: "The research project you were looking for could not be found.",
      path: `/higher-study/research/${researchSlug}`,
      noindex: true,
    });
  }
  const description = research.projectSummary
    ? research.projectSummary.slice(0, 160)
    : `${research.title}${research.university ? ` at ${research.university.officialName}` : ""} — PhD research project with verified funding status and application guidance.`;
  return buildHigherStudyMetadata({
    title: `${research.title} — PhD Research | Higher Study`,
    description,
    path: `/higher-study/research/${research.slug}`,
    keywords: [
      research.title,
      "PhD",
      "research project",
      research.university?.officialName ?? "",
      research.fundingStatus ?? "",
      "doctoral",
    ].filter(Boolean) as string[],
    type: "article",
    publishedTime: research.applicationDeadline ? research.applicationDeadline.toISOString() : undefined,
  });
}

// ─── Funding status badge config ─────────────────────────────────────

function fundingConfig(status?: string | null) {
  switch (status) {
    case "fully-funded":
      return { label: "Fully Funded", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    case "studentship":
      return { label: "Studentship", className: "border-blue-200 bg-blue-50 text-blue-700" };
    case "partially-funded":
      return { label: "Partially Funded", className: "border-amber-200 bg-amber-50 text-amber-700" };
    case "self-funded":
      return { label: "Self-Funded", className: "border-ink-200 bg-ink-50 text-ink-700" };
    case "unfunded":
      return { label: "Unfunded", className: "border-red-200 bg-red-50 text-red-700" };
    default:
      return { label: status ?? "Funding TBC", className: "border-ink-200 bg-ink-50 text-ink-700" };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────

export default async function ResearchDetailPage({ params }: PageProps) {
  const { researchSlug } = await params;

  let research: ResearchProject | null = null;
  try {
    research = (await db.higherStudyResearchProject.findUnique({
      where: { slug: researchSlug },
      include: {
        university: {
          select: {
            id: true,
            slug: true,
            officialName: true,
            logoUrl: true,
            country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          },
        },
        researchArea: { select: { id: true, slug: true, name: true, description: true } },
        supervisor: {
          select: {
            id: true,
            slug: true,
            name: true,
            academicTitle: true,
            department: true,
            publicProfileUrl: true,
          },
        },
      },
    })) as ResearchProject | null;
  } catch (e) {
    console.error("[research-detail] DB error", e);
  }

  if (!research) {
    notFound();
  }

  const requiredDocuments = parseCommaList(research.requiredDocuments);
  const funding = fundingConfig(research.fundingStatus);
  const isFullyFunded = research.fundingStatus === "fully-funded";
  const university = research.university;
  const supervisor = research.supervisor;
  const researchArea = research.researchArea;
  const countdown = deadlineCountdown(research.applicationDeadline);

  // Related research (same research area, exclude self).
  const relatedResearch = researchArea
    ? await db.higherStudyResearchProject
        .findMany({
          where: {
            researchAreaId: researchArea.id,
            slug: { not: research.slug },
            publicationStatus: "published",
            verificationStatus: { in: ["verified", "published"] },
          },
          take: 4,
          orderBy: [{ featured: "desc" }, { applicationDeadline: "asc" }],
          include: {
            university: { select: { id: true, slug: true, officialName: true } },
            supervisor: { select: { id: true, slug: true, name: true, academicTitle: true } },
          },
        })
        .catch(() => [])
    : [];

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "PhD & Research", href: "/higher-study/phd-research" },
    { label: research.title },
  ];

  // Build Article JSON-LD (since schema.org has no Scholarship/PhD type).
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${HIGHER_STUDY_BASE_URL}/higher-study/research/${research.slug}#research`,
    headline: research.title,
    url: `${HIGHER_STUDY_BASE_URL}/higher-study/research/${research.slug}`,
    ...(research.projectSummary ? { description: research.projectSummary } : {}),
    ...(research.researchObjectives ? { articleBody: research.researchObjectives } : {}),
    datePublished: research.createdAt.toISOString(),
    dateModified: research.updatedAt.toISOString(),
    inLanguage: "en",
    author: {
      "@type": "Organization",
      name: "Alaminn.info Higher Study",
      url: HIGHER_STUDY_BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Alaminn.info",
      url: HIGHER_STUDY_BASE_URL,
      logo: { "@type": "ImageObject", url: `${HIGHER_STUDY_BASE_URL}/logo.svg` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${HIGHER_STUDY_BASE_URL}/higher-study/research/${research.slug}`,
    },
    ...(university
      ? {
          mentions: {
            "@type": "CollegeOrUniversity",
            name: university.officialName,
            url: `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${university.slug}`,
          },
        }
      : {}),
    ...(supervisor
      ? {
          contributor: {
            "@type": "Person",
            name: supervisor.name,
            url: `${HIGHER_STUDY_BASE_URL}/higher-study/supervisors/${supervisor.slug}`,
          },
        }
      : {}),
    ...(research.applicationDeadline
      ? { expires: research.applicationDeadline.toISOString() }
      : {}),
  };

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "PhD & Research", url: `${HIGHER_STUDY_BASE_URL}/higher-study/phd-research` },
    { name: research.title, url: `${HIGHER_STUDY_BASE_URL}/higher-study/research/${research.slug}` },
  ]);

  // Funding details meta grid.
  const fundingMeta: MetaItemProps[] = [];
  fundingMeta.push({
    icon: Banknote,
    label: "Funding status",
    value: <span className="font-semibold">{funding.label}</span>,
  });
  fundingMeta.push({
    icon: GraduationCap,
    label: "Tuition coverage",
    value: research.tuitionCoverage ? (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Covered
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-ink-500">
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Not covered
      </span>
    ),
  });
  if (research.stipend) {
    fundingMeta.push({
      icon: Banknote,
      label: "Stipend",
      value: <span className="font-semibold text-emerald-700">{research.stipend}</span>,
    });
  }
  if (research.duration) {
    fundingMeta.push({
      icon: Clock,
      label: "Duration",
      value: research.duration,
    });
  }
  if (research.startDate) {
    fundingMeta.push({
      icon: Calendar,
      label: "Start date",
      value: formatDate(research.startDate) ?? "—",
    });
  }

  return (
    <>
      <HigherStudyBreadcrumb
        items={breadcrumbItems}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <DetailHero
        variant={isFullyFunded ? "default" : "warm"}
        eyebrow="PhD / Research Project"
        title={research.title}
        description={research.projectSummary ? research.projectSummary.slice(0, 220) : undefined}
        badges={
          <>
            {research.featured && <FeaturedBadge />}
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${funding.className}`}
            >
              <FlaskConical className="h-3 w-3" aria-hidden="true" />
              {funding.label}
            </span>
            {researchArea && (
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700">
                <BookOpen className="h-3 w-3" aria-hidden="true" />
                {researchArea.name}
              </span>
            )}
          </>
        }
        meta={
          <>
            {university && (
              <HeroMetaItem icon={Building2}>
                <Link
                  href={`/higher-study/universities/${university.slug}`}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {university.officialName}
                </Link>
              </HeroMetaItem>
            )}
            {research.department && (
              <HeroMetaItem icon={Building2}>{research.department}</HeroMetaItem>
            )}
            {supervisor && (
              <HeroMetaItem icon={UserCircle}>
                <Link
                  href={`/higher-study/supervisors/${supervisor.slug}`}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {supervisor.name}
                </Link>
                {supervisor.academicTitle && (
                  <span className="text-ink-500"> · {supervisor.academicTitle}</span>
                )}
              </HeroMetaItem>
            )}
            {research.applicationDeadline && (
              <DeadlineBadge date={research.applicationDeadline} label="Apply by" />
            )}
          </>
        }
        actions={
          <>
            <ApplyCta
              referralType="phd-application"
              researchSlug={research.slug}
              universitySlug={university?.slug}
              label="Apply through ALO Education"
              className="h-11 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
            />
            <SaveButton
              entityType="research"
              entitySlug={research.slug}
              entityName={research.title}
              className="h-11 rounded-xl"
            />
            <CompareButton
              entityType="research"
              entitySlug={research.slug}
              entityName={research.title}
              className="h-11 rounded-xl"
            />
          </>
        }
      />

      <DetailShell>
        <DetailLayout
          sidebar={
            <>
              <SidebarCard title="Quick actions">
                <ApplyCta
                  referralType="phd-application"
                  researchSlug={research.slug}
                  universitySlug={university?.slug}
                  label="Apply"
                  className="w-full h-10 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                />
                <SaveButton
                  entityType="research"
                  entitySlug={research.slug}
                  entityName={research.title}
                  className="w-full h-10 rounded-xl"
                />
                <CompareButton
                  entityType="research"
                  entitySlug={research.slug}
                  entityName={research.title}
                  className="w-full h-10 rounded-xl"
                />
                {supervisor && (
                  <SidebarActionLink
                    href={`/higher-study/study-resources/supervisor-email-guide`}
                    icon={Mail}
                    label="Contact supervisor guidance"
                    description="How to write a strong enquiry"
                  />
                )}
                <SidebarActionLink
                  href={`/higher-study/eligibility-check?research=${research.slug}`}
                  icon={ClipboardCheck}
                  label="Check eligibility"
                  description="See if you qualify"
                />
              </SidebarCard>

              <SidebarCard title="Key facts">
                <InfoRow label="Funding status" value={funding.label} />
                <InfoRow
                  label="Tuition coverage"
                  value={research.tuitionCoverage ? "Yes" : "No"}
                  boolean
                />
                {research.stipend && <InfoRow label="Stipend" value={research.stipend} />}
                {research.duration && <InfoRow label="Duration" value={research.duration} />}
                {research.startDate && (
                  <InfoRow label="Start date" value={formatDate(research.startDate) ?? "—"} />
                )}
                {research.applicationDeadline && (
                  <InfoRow label="Deadline" value={formatDate(research.applicationDeadline) ?? "—"} />
                )}
                {researchArea && <InfoRow label="Research area" value={researchArea.name} />}
                {research.department && <InfoRow label="Department" value={research.department} />}
              </SidebarCard>

              {supervisor && (
                <SidebarCard title="Supervisor">
                  <Link
                    href={`/higher-study/supervisors/${supervisor.slug}`}
                    className="group flex items-start gap-2.5 rounded-xl border border-ink-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-soft"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-orange-100 text-blue-700">
                      <UserCircle className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink-900 group-hover:text-blue-700">
                        {supervisor.name}
                      </div>
                      {supervisor.academicTitle && (
                        <div className="text-[11px] text-ink-500">{supervisor.academicTitle}</div>
                      )}
                      {supervisor.department && (
                        <div className="text-[11px] text-ink-500">{supervisor.department}</div>
                      )}
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
                  </Link>
                </SidebarCard>
              )}

              {university && (
                <SidebarCard title="Host university">
                  <Link
                    href={`/higher-study/universities/${university.slug}`}
                    className="group flex items-start gap-2.5 rounded-xl border border-ink-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-soft"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl grad-intelligence text-white">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink-900 group-hover:text-blue-700">
                        {university.officialName}
                      </div>
                      {university.country && (
                        <div className="text-[11px] text-ink-500">
                          {university.country.flagEmoji} {university.country.name}
                        </div>
                      )}
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
                  </Link>
                </SidebarCard>
              )}
            </>
          }
        >
          {/* Project summary */}
          {research.projectSummary && (
            <DetailCard
              title="Project summary"
              icon={FileText}
              description="A concise overview of the research project."
            >
              <ProseParagraphs content={research.projectSummary} />
            </DetailCard>
          )}

          {/* Research objectives */}
          {research.researchObjectives && (
            <DetailCard
              title="Research objectives"
              icon={Target}
              description="The specific research questions and objectives."
            >
              <ProseParagraphs content={research.researchObjectives} />
            </DetailCard>
          )}

          {/* Methodology summary */}
          {research.methodologySummary && (
            <DetailCard
              title="Methodology summary"
              icon={FlaskConical}
              description="Planned research methods and approach (if published)."
            >
              <ProseParagraphs content={research.methodologySummary} />
            </DetailCard>
          )}

          {/* Candidate profile */}
          {research.candidateProfile && (
            <DetailCard
              title="Candidate profile"
              icon={UserCircle}
              description="The ideal candidate for this research project."
            >
              <ProseParagraphs content={research.candidateProfile} />
            </DetailCard>
          )}

          {/* Requirements */}
          {(research.academicRequirements || research.englishRequirements) && (
            <DetailCard
              title="Requirements"
              icon={GraduationCap}
              description="Academic and English-language requirements."
            >
              {research.academicRequirements && (
                <div className="mb-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Academic requirements
                  </div>
                  <ProseParagraphs content={research.academicRequirements} />
                </div>
              )}
              {research.englishRequirements && (
                <div className="border-t border-ink-100 pt-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    English requirements
                  </div>
                  <ProseParagraphs content={research.englishRequirements} />
                </div>
              )}
            </DetailCard>
          )}

          {/* Funding details */}
          <DetailCard
            title="Funding & duration"
            icon={Banknote}
            description="Funding status, stipend and project duration."
          >
            <MetaGrid items={fundingMeta} />
            {research.additionalFunding && (
              <div className="mt-4 border-t border-ink-100 pt-3">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  Additional funding
                </div>
                <ProseParagraphs content={research.additionalFunding} />
              </div>
            )}
          </DetailCard>

          {/* Deadline card */}
          {research.applicationDeadline && (
            <DetailCard
              title="Application deadline"
              icon={CalendarClock}
              description="Submit your application by this date."
            >
              <div
                className={
                  countdown?.urgent
                    ? "rounded-xl border border-orange-200 bg-orange-50 p-4"
                    : "rounded-xl border border-ink-100 bg-ink-50/60 p-4"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                      Apply by
                    </div>
                    <div className="mt-1 font-display text-lg font-extrabold text-ink-900">
                      {formatDate(research.applicationDeadline, "d MMM yyyy") ?? "—"}
                    </div>
                  </div>
                  {countdown && (
                    <span
                      className={
                        countdown.urgent
                          ? "inline-flex items-center gap-1 rounded-full bg-orange-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
                          : "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700"
                      }
                    >
                      {countdown.urgent && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
                      {countdown.label}
                    </span>
                  )}
                </div>
              </div>
            </DetailCard>
          )}

          {/* Required documents */}
          {requiredDocuments.length > 0 && (
            <DetailCard
              title="Required documents"
              icon={FileText}
              description="Documents typically required when applying to this project."
            >
              <Checklist items={requiredDocuments} variant="check" />
            </DetailCard>
          )}

          {/* Application process */}
          {research.applicationProcess && (
            <DetailCard
              title="Application process"
              icon={ListChecks}
              description="How to apply for this research project."
            >
              <ProseParagraphs content={research.applicationProcess} />
            </DetailCard>
          )}

          {/* Empty state for projects with sparse data */}
          {!research.projectSummary &&
            !research.researchObjectives &&
            !research.methodologySummary &&
            !research.candidateProfile &&
            !research.academicRequirements &&
            !research.applicationProcess &&
            requiredDocuments.length === 0 && (
              <EmptyDataNote label="Detailed project information is being finalised. Please check back soon or contact the supervisor directly." />
            )}

          {/* Verification footer */}
          <VerificationFooter
            status={research.verificationStatus}
            lastVerifiedAt={research.lastVerifiedAt}
            sourceUrl={research.officialSourceUrl}
            lastVerifiedBy={research.lastVerifiedBy}
          />

          {/* Related research */}
          {relatedResearch.length > 0 && (
            <RelatedSection
              title={researchArea ? `More ${researchArea.name} research` : "Related research"}
              description="Other PhD projects in the same research area."
              viewAllHref={researchArea ? `/higher-study/phd-research?area=${researchArea.slug}` : "/higher-study/phd-research"}
            >
              {relatedResearch.map((r) => (
                <ResearchCard key={r.id} research={r as never} showActions={false} />
              ))}
            </RelatedSection>
          )}
        </DetailLayout>
      </DetailShell>

      <JsonLdScript data={[articleLd, breadcrumbLd]} />
    </>
  );
}

/**
 * /higher-study/supervisors/[supervisorSlug]
 * --------------------------------------------------------------------
 * Supervisor detail page per master prompt §14. Renders header (name,
 * academic title, university link, department, accepting-students badge),
 * public profile link (external, rel=nofollow), research interests (as
 * chips), selected publications (from JSON), current projects (DB query
 * where supervisorId), application guidance, sticky sidebar (Apply /
 * Save), links to resources (supervisor email guide, research-interest
 * matching, academic CV checklist, research proposal checklist, contact
 * preparation, follow-up etiquette, interview preparation), verification
 * footer, related supervisors, JSON-LD (Person + BreadcrumbList),
 * generateMetadata + generateStaticParams.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  BookOpen,
  ExternalLink,
  Mail,
  FileText,
  FlaskConical,
  CheckCircle2,
  XCircle,
  GraduationCap,
  ClipboardList,
  PencilLine,
  MessageSquare,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { SupervisorCard } from "@/components/higher-study/supervisor-card";
import { ResearchCard } from "@/components/higher-study/research-card";
import { ApplyCta } from "@/components/higher-study/apply-cta";
import { SaveButton } from "@/components/higher-study/save-button";
import {
  DetailShell,
  DetailLayout,
  DetailHero,
  DetailCard,
  SidebarCard,
  SidebarActionLink,
  ProseParagraphs,
  ChipList,
  InfoRow,
  HeroMetaItem,
  VerificationFooter,
  RelatedSection,
  JsonLdScript,
  EmptyDataNote,
  safeParseJsonArray,
  parseCommaList,
} from "../../_lib/detail-helpers";
import type { BreadcrumbItem } from "@/components/higher-study/breadcrumb";
import type { Supervisor } from "@/lib/higher-study/types";

// ─── Static params ────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const items = await db.higherStudySupervisor.findMany({
      where: { publicationStatus: "published" },
      select: { slug: true },
      take: 50,
      orderBy: [{ acceptingStudents: "desc" }, { lastVerifiedAt: "desc" }],
    });
    return items.map((s) => ({ supervisorSlug: s.slug }));
  } catch {
    return [];
  }
}

// ─── Dynamic metadata ─────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ supervisorSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { supervisorSlug } = await params;
  let supervisor: {
    name: string;
    academicTitle: string | null;
    slug: string;
    department: string | null;
    researchInterests: string | null;
    university: { officialName: string; slug: string } | null;
  } | null = null;
  try {
    supervisor = await db.higherStudySupervisor.findUnique({
      where: { slug: supervisorSlug },
      select: {
        name: true,
        academicTitle: true,
        slug: true,
        department: true,
        researchInterests: true,
        university: { select: { officialName: true, slug: true } },
      },
    });
  } catch {
    /* ignore */
  }
  if (!supervisor) {
    return buildHigherStudyMetadata({
      title: "Supervisor not found — Higher Study",
      description: "The supervisor you were looking for could not be found.",
      path: `/higher-study/supervisors/${supervisorSlug}`,
      noindex: true,
    });
  }
  const description = `${supervisor.name}${supervisor.academicTitle ? `, ${supervisor.academicTitle}` : ""}${supervisor.university ? ` at ${supervisor.university.officialName}` : ""}${supervisor.department ? `, ${supervisor.department}` : ""}. Research interests, publications and current PhD projects.`;
  return buildHigherStudyMetadata({
    title: `${supervisor.name} — Supervisor Profile | Higher Study`,
    description,
    path: `/higher-study/supervisors/${supervisor.slug}`,
    keywords: [
      supervisor.name,
      supervisor.academicTitle ?? "",
      "supervisor",
      "PhD supervisor",
      supervisor.university?.officialName ?? "",
      supervisor.department ?? "",
    ].filter(Boolean) as string[],
    type: "article",
  });
}

// ─── Resource links (sidebar) ───────────────────────────────────────

interface ResourceLink {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

const RESOURCE_LINKS: ResourceLink[] = [
  {
    href: "/higher-study/study-resources/supervisor-email-guide",
    icon: Mail,
    label: "Supervisor email guide",
    description: "How to write a strong first email",
  },
  {
    href: "/higher-study/study-resources/research-interest-matching",
    icon: FlaskConical,
    label: "Research-interest matching",
    description: "Align your interests with theirs",
  },
  {
    href: "/higher-study/study-resources/academic-cv-checklist",
    icon: FileText,
    label: "Academic CV checklist",
    description: "What to include in your CV",
  },
  {
    href: "/higher-study/study-resources/research-proposal-checklist",
    icon: ClipboardList,
    label: "Research proposal checklist",
    description: "Structure + key sections",
  },
  {
    href: "/higher-study/study-resources/contact-preparation",
    icon: PencilLine,
    label: "Contact preparation",
    description: "Prepare before you reach out",
  },
  {
    href: "/higher-study/study-resources/follow-up-etiquette",
    icon: MessageSquare,
    label: "Follow-up etiquette",
    description: "When + how to follow up",
  },
  {
    href: "/higher-study/study-resources/interview-preparation",
    icon: PhoneCall,
    label: "Interview preparation",
    description: "Ace your supervisor interview",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────

export default async function SupervisorDetailPage({ params }: PageProps) {
  const { supervisorSlug } = await params;

  let supervisor: Supervisor | null = null;
  try {
    supervisor = (await db.higherStudySupervisor.findUnique({
      where: { slug: supervisorSlug },
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
      },
    })) as Supervisor | null;
  } catch (e) {
    console.error("[supervisor-detail] DB error", e);
  }

  if (!supervisor) {
    notFound();
  }

  const researchInterests = parseCommaList(supervisor.researchInterests);
  const publications = safeParseJsonArray<{
    title?: string;
    year?: number | string;
    venue?: string;
    authors?: string;
    url?: string;
    doi?: string;
  }>(supervisor.selectedPublications);

  const university = supervisor.university;
  const researchArea = supervisor.researchArea;

  // Current PhD projects supervised by this supervisor.
  const currentProjects = await db.higherStudyResearchProject
    .findMany({
      where: {
        supervisorId: supervisor.id,
        publicationStatus: "published",
        verificationStatus: { in: ["verified", "published"] },
      },
      take: 8,
      orderBy: [{ featured: "desc" }, { applicationDeadline: "asc" }],
      include: {
        university: { select: { id: true, slug: true, officialName: true } },
        supervisor: { select: { id: true, slug: true, name: true, academicTitle: true } },
      },
    })
    .catch(() => []);

  // Related supervisors (same research area, exclude self).
  const relatedSupervisors = researchArea
    ? await db.higherStudySupervisor
        .findMany({
          where: {
            researchAreaId: researchArea.id,
            slug: { not: supervisor.slug },
            publicationStatus: "published",
            verificationStatus: { in: ["verified", "published"] },
          },
          take: 4,
          orderBy: [{ acceptingStudents: "desc" }, { lastVerifiedAt: "desc" }],
          include: {
            university: { select: { id: true, slug: true, officialName: true } },
          },
        })
        .catch(() => [])
    : [];

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Supervisors", href: "/higher-study/supervisors" },
    { label: supervisor.name },
  ];

  // Build Person JSON-LD.
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${HIGHER_STUDY_BASE_URL}/higher-study/supervisors/${supervisor.slug}#person`,
    name: supervisor.name,
    url: `${HIGHER_STUDY_BASE_URL}/higher-study/supervisors/${supervisor.slug}`,
    ...(supervisor.academicTitle ? { jobTitle: supervisor.academicTitle } : {}),
    ...(supervisor.department ? { worksFor: {
      "@type": "EducationalOrganization",
      name: supervisor.department,
    } } : {}),
    ...(university ? { affiliation: {
      "@type": "CollegeOrUniversity",
      name: university.officialName,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${university.slug}`,
    } } : {}),
    ...(supervisor.publicProfileUrl ? { sameAs: [supervisor.publicProfileUrl] } : {}),
    ...(researchInterests.length > 0 ? { knowsAbout: researchInterests } : {}),
    ...(publications.length > 0 ? {
      author: publications.map((p) => ({
        "@type": "CreativeWork",
        name: p.title ?? "Untitled",
        ...(p.year ? { datePublished: String(p.year) } : {}),
        ...(p.venue ? { publisher: { "@type": "Organization", name: p.venue } } : {}),
      })),
    } : {}),
  };

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Supervisors", url: `${HIGHER_STUDY_BASE_URL}/higher-study/supervisors` },
    { name: supervisor.name, url: `${HIGHER_STUDY_BASE_URL}/higher-study/supervisors/${supervisor.slug}` },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={breadcrumbItems}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <DetailHero
        variant={supervisor.acceptingStudents ? "default" : "warm"}
        eyebrow={supervisor.academicTitle ?? "Faculty Member"}
        title={supervisor.name}
        description={
          researchInterests.length > 0
            ? `Research interests: ${researchInterests.slice(0, 6).join(", ")}.`
            : undefined
        }
        badges={
          <>
            <span
              className={
                supervisor.acceptingStudents
                  ? "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700"
                  : "inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-[11px] font-semibold text-ink-600"
              }
            >
              {supervisor.acceptingStudents ? (
                <>
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Accepting students
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" aria-hidden="true" />
                  Not currently accepting
                </>
              )}
            </span>
            {researchArea && (
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700">
                <FlaskConical className="h-3 w-3" aria-hidden="true" />
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
            {supervisor.department && (
              <HeroMetaItem icon={Building2}>{supervisor.department}</HeroMetaItem>
            )}
            {supervisor.publicProfileUrl && (
              <a
                href={supervisor.publicProfileUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Public profile
              </a>
            )}
          </>
        }
        actions={
          <>
            <ApplyCta
              referralType="supervisor-enquiry"
              supervisorSlug={supervisor.slug}
              universitySlug={university?.slug}
              label={supervisor.acceptingStudents ? "Enquire via ALO Education" : "Apply through ALO Education"}
              className="h-11 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
            />
            <SaveButton
              entityType="supervisor"
              entitySlug={supervisor.slug}
              entityName={supervisor.name}
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
                  referralType="supervisor-enquiry"
                  supervisorSlug={supervisor.slug}
                  universitySlug={university?.slug}
                  label={supervisor.acceptingStudents ? "Enquire" : "Apply"}
                  className="w-full h-10 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                />
                <SaveButton
                  entityType="supervisor"
                  entitySlug={supervisor.slug}
                  entityName={supervisor.name}
                  className="w-full h-10 rounded-xl"
                />
                {supervisor.publicProfileUrl && (
                  <SidebarActionLink
                    href={supervisor.publicProfileUrl}
                    icon={ExternalLink}
                    label="Public profile"
                    description="View official faculty page"
                    external
                  />
                )}
              </SidebarCard>

              <SidebarCard title="Key facts">
                {supervisor.academicTitle && (
                  <InfoRow label="Title" value={supervisor.academicTitle} />
                )}
                {university && (
                  <InfoRow
                    label="University"
                    value={
                      <Link
                        href={`/higher-study/universities/${university.slug}`}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        {university.officialName}
                      </Link>
                    }
                  />
                )}
                {supervisor.department && (
                  <InfoRow label="Department" value={supervisor.department} />
                )}
                {researchArea && (
                  <InfoRow label="Research area" value={researchArea.name} />
                )}
                <InfoRow
                  label="Accepting students"
                  value={supervisor.acceptingStudents ? "Yes" : "No"}
                  boolean
                />
              </SidebarCard>

              <SidebarCard title="Resources for contacting supervisors">
                {RESOURCE_LINKS.map((r) => (
                  <SidebarActionLink
                    key={r.href}
                    href={r.href}
                    icon={r.icon}
                    label={r.label}
                    description={r.description}
                  />
                ))}
              </SidebarCard>
            </>
          }
        >
          {/* Research interests */}
          {researchInterests.length > 0 && (
            <DetailCard
              title="Research interests"
              icon={BookOpen}
              description="Topics this supervisor is interested in supervising."
            >
              <ChipList items={researchInterests} variant="purple" />
            </DetailCard>
          )}

          {/* Application guidance */}
          {supervisor.applicationGuidance && (
            <DetailCard
              title="Application guidance"
              icon={GraduationCap}
              description="Guidance from the supervisor on how to apply."
            >
              <ProseParagraphs content={supervisor.applicationGuidance} />
            </DetailCard>
          )}

          {/* Selected publications */}
          {publications.length > 0 && (
            <DetailCard
              title="Selected publications"
              icon={FileText}
              description="A selection of this supervisor's published work."
            >
              <ul className="space-y-3">
                {publications.map((p, idx) => {
                  const title = p.title ?? `Publication ${idx + 1}`;
                  return (
                    <li
                      key={`${title}-${idx}`}
                      className="rounded-xl border border-ink-100 bg-ink-50/40 p-3"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="font-display text-sm font-bold text-ink-900">
                          {p.url ? (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-700 hover:underline"
                            >
                              {title}
                            </a>
                          ) : (
                            title
                          )}
                        </div>
                        {p.year && (
                          <span className="text-[11px] font-medium text-ink-500">{p.year}</span>
                        )}
                      </div>
                      {p.authors && (
                        <div className="mt-0.5 text-xs text-ink-600">{p.authors}</div>
                      )}
                      {p.venue && (
                        <div className="mt-0.5 text-[11px] italic text-ink-500">{p.venue}</div>
                      )}
                      {p.doi && (
                        <div className="mt-1">
                          <a
                            href={`https://doi.org/${p.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-700 hover:underline"
                          >
                            DOI: {p.doi}
                            <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                          </a>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </DetailCard>
          )}

          {/* Current projects */}
          <DetailCard
            title="Current PhD projects"
            icon={FlaskConical}
            description="Research projects currently supervised by this supervisor."
            actions={
              <Link
                href={`/higher-study/phd-research?supervisor=${supervisor.slug}`}
                className="inline-flex items-center gap-1 rounded-xl border border-ink-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              >
                View all
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            }
          >
            {currentProjects.length === 0 ? (
              <EmptyDataNote label="No current PhD projects published. Contact the supervisor directly to enquire about upcoming opportunities." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {currentProjects.map((r) => (
                  <ResearchCard key={r.id} research={r as never} showActions={false} />
                ))}
              </div>
            )}
          </DetailCard>

          {/* Empty state */}
          {!supervisor.applicationGuidance &&
            researchInterests.length === 0 &&
            publications.length === 0 &&
            currentProjects.length === 0 && (
              <EmptyDataNote label="Detailed profile information is being finalised. Please check back soon or use the public profile link above." />
            )}

          {/* Verification footer */}
          <VerificationFooter
            status={supervisor.verificationStatus}
            lastVerifiedAt={supervisor.lastVerifiedAt}
            sourceUrl={supervisor.officialSourceUrl}
            lastVerifiedBy={supervisor.lastVerifiedBy}
          />

          {/* Related supervisors */}
          {relatedSupervisors.length > 0 && (
            <RelatedSection
              title={researchArea ? `More ${researchArea.name} supervisors` : "Related supervisors"}
              description="Other supervisors in the same research area."
              viewAllHref={researchArea ? `/higher-study/supervisors?area=${researchArea.slug}` : "/higher-study/supervisors"}
            >
              {relatedSupervisors.map((s) => (
                <SupervisorCard key={s.id} supervisor={s as never} showActions={false} />
              ))}
            </RelatedSection>
          )}
        </DetailLayout>
      </DetailShell>

      <JsonLdScript data={[personLd, breadcrumbLd]} />
    </>
  );
}

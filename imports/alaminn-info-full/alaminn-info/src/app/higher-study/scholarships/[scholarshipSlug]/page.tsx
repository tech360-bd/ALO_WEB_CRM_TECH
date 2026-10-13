/**
 * /higher-study/scholarships/[scholarshipSlug]
 * --------------------------------------------------------------------
 * Scholarship detail page per master prompt §12. Renders header (name,
 * provider, country, eligible university link, funding-type badge,
 * featured badge), eligible study levels / subjects / nationalities (as
 * chips), funding details (amount, tuition coverage, living-cost
 * coverage, travel support, health/insurance, other benefits),
 * eligibility criteria, academic + English + work-experience requirements,
 * required documents, opening date + deadline (with countdown if ≤30d),
 * application process + selection process, restrictions, sticky sidebar
 * (Apply / Save / Compare / Deadline-reminder / Eligibility /
 * Consultation), verification footer, related scholarships, JSON-LD
 * (Article + BreadcrumbList), generateMetadata + generateStaticParams.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Award,
  Building2,
  MapPin,
  DollarSign,
  GraduationCap,
  Briefcase,
  FileText,
  CalendarClock,
  Calendar,
  ClipboardCheck,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Plane,
  HeartPulse,
  ListChecks,
  ExternalLink,
  AlertCircle,
  Bell,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildScholarshipJsonLd,
  buildBreadcrumbJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { ScholarshipCard } from "@/components/higher-study/scholarship-card";
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
  ChipList,
  HeroMetaItem,
  FeaturedBadge,
  DeadlineBadge,
  VerificationFooter,
  RelatedSection,
  JsonLdScript,
  parseCommaList,
  formatDate,
  deadlineCountdown,
} from "../../_lib/detail-helpers";
import type { BreadcrumbItem } from "@/components/higher-study/breadcrumb";
import type { Scholarship } from "@/lib/higher-study/types";
import { FUNDING_TYPE_MAP, STUDY_LEVEL_MAP } from "@/lib/higher-study/constants";

// ─── Static params ────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const items = await db.higherStudyScholarship.findMany({
      where: { publicationStatus: "published" },
      select: { slug: true },
      take: 50,
      orderBy: [{ featured: "desc" }, { deadline: "asc" }],
    });
    return items.map((s) => ({ scholarshipSlug: s.slug }));
  } catch {
    return [];
  }
}

// ─── Dynamic metadata ─────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ scholarshipSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { scholarshipSlug } = await params;
  let scholarship: {
    name: string;
    eligibilityCriteria: string | null;
    slug: string;
    fundingAmount: string | null;
    fundingType: string | null;
    deadline: Date | null;
  } | null = null;
  try {
    scholarship = await db.higherStudyScholarship.findUnique({
      where: { slug: scholarshipSlug },
      select: {
        name: true,
        eligibilityCriteria: true,
        slug: true,
        fundingAmount: true,
        fundingType: true,
        deadline: true,
      },
    });
  } catch {
    /* ignore */
  }
  if (!scholarship) {
    return buildHigherStudyMetadata({
      title: "Scholarship not found — Higher Study",
      description: "The scholarship you were looking for could not be found.",
      path: `/higher-study/scholarships/${scholarshipSlug}`,
      noindex: true,
    });
  }
  const ftLabel = scholarship.fundingType
    ? (FUNDING_TYPE_MAP[scholarship.fundingType] ?? scholarship.fundingType)
    : "Funding";
  const description = scholarship.eligibilityCriteria
    ? scholarship.eligibilityCriteria.slice(0, 160)
    : `${scholarship.name} — ${ftLabel}${scholarship.fundingAmount ? `, ${scholarship.fundingAmount}` : ""}. Eligibility, requirements, deadline and application guidance.`;
  const publishedTime = scholarship.deadline ? scholarship.deadline.toISOString() : undefined;
  return buildHigherStudyMetadata({
    title: `${scholarship.name} — ${ftLabel} | Higher Study`,
    description,
    path: `/higher-study/scholarships/${scholarship.slug}`,
    keywords: [
      scholarship.name,
      ftLabel,
      "scholarship",
      "funding",
      "study abroad",
      scholarship.fundingAmount ?? "",
    ].filter(Boolean) as string[],
    type: "article",
    publishedTime,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────

export default async function ScholarshipDetailPage({ params }: PageProps) {
  const { scholarshipSlug } = await params;

  let scholarship: Scholarship | null = null;
  try {
    scholarship = (await db.higherStudyScholarship.findUnique({
      where: { slug: scholarshipSlug },
      include: {
        country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
        university: { select: { id: true, slug: true, officialName: true, logoUrl: true } },
      },
    })) as Scholarship | null;
  } catch (e) {
    console.error("[scholarship-detail] DB error", e);
  }

  if (!scholarship) {
    notFound();
  }

  const eligibleStudyLevels = parseCommaList(scholarship.eligibleStudyLevels).map(
    (l) => STUDY_LEVEL_MAP[l] ?? l,
  );
  const eligibleSubjects = parseCommaList(scholarship.eligibleSubjects);
  const eligibleNationalities = parseCommaList(scholarship.eligibleNationalities);
  const requiredDocuments = parseCommaList(scholarship.requiredDocuments);

  const fundingTypeLabel = scholarship.fundingType
    ? (FUNDING_TYPE_MAP[scholarship.fundingType] ?? scholarship.fundingType)
    : "Funding";
  const isFullyFunded = scholarship.fundingType === "fully-funded";
  const country = scholarship.country;
  const university = scholarship.university;
  const countdown = deadlineCountdown(scholarship.deadline);

  // Related scholarships (same funding type OR same country).
  const relatedScholarships = await db.higherStudyScholarship
    .findMany({
      where: {
        slug: { not: scholarship.slug },
        publicationStatus: "published",
        verificationStatus: { in: ["verified", "published"] },
        OR: [
          ...(scholarship.fundingType ? [{ fundingType: scholarship.fundingType }] : []),
          ...(country ? [{ countryId: country.id }] : []),
        ],
      },
      take: 4,
      orderBy: [{ featured: "desc" }, { deadline: "asc" }],
      include: {
        country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
        university: { select: { id: true, slug: true, officialName: true } },
      },
    })
    .catch(() => []);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Scholarships", href: "/higher-study/scholarships" },
    { label: scholarship.name },
  ];

  const scholarshipLd = buildScholarshipJsonLd(scholarship);
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Scholarships", url: `${HIGHER_STUDY_BASE_URL}/higher-study/scholarships` },
    { name: scholarship.name, url: `${HIGHER_STUDY_BASE_URL}/higher-study/scholarships/${scholarship.slug}` },
  ]);

  // Funding details meta grid.
  const fundingMeta: MetaItemProps[] = [];
  if (scholarship.fundingAmount) {
    fundingMeta.push({
      icon: DollarSign,
      label: "Funding amount",
      value: <span className="font-semibold text-emerald-700">{scholarship.fundingAmount}</span>,
    });
  }
  fundingMeta.push({
    icon: GraduationCap,
    label: "Tuition coverage",
    value: scholarship.tuitionCoverage ? (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Covered
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-ink-500">
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Not covered
      </span>
    ),
  });
  fundingMeta.push({
    icon: Briefcase,
    label: "Living-cost coverage",
    value: scholarship.livingCostCoverage ? (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Covered
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-ink-500">
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Not covered
      </span>
    ),
  });
  fundingMeta.push({
    icon: Plane,
    label: "Travel support",
    value: scholarship.travelSupport ? (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Included
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-ink-500">
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Not included
      </span>
    ),
  });
  fundingMeta.push({
    icon: HeartPulse,
    label: "Health insurance",
    value: scholarship.healthInsurance ? (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Covered
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-ink-500">
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Not covered
      </span>
    ),
  });

  return (
    <>
      <HigherStudyBreadcrumb
        items={breadcrumbItems}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <DetailHero
        variant={isFullyFunded ? "default" : "warm"}
        eyebrow={fundingTypeLabel}
        title={scholarship.name}
        description={scholarship.eligibilityCriteria ? scholarship.eligibilityCriteria.slice(0, 220) : undefined}
        badges={
          <>
            {scholarship.featured && <FeaturedBadge />}
            <span
              className={
                isFullyFunded
                  ? "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700"
                  : "inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700"
              }
            >
              <Award className="h-3 w-3" aria-hidden="true" />
              {fundingTypeLabel}
            </span>
            {scholarship.tuitionCoverage && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                Tuition
              </span>
            )}
            {scholarship.livingCostCoverage && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                Living cost
              </span>
            )}
          </>
        }
        meta={
          <>
            {scholarship.provider && (
              <HeroMetaItem icon={Building2}>{scholarship.provider}</HeroMetaItem>
            )}
            {country && (
              <HeroMetaItem icon={MapPin}>
                {country.flagEmoji} {country.name}
              </HeroMetaItem>
            )}
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
            {scholarship.deadline && (
              <DeadlineBadge date={scholarship.deadline} />
            )}
          </>
        }
        actions={
          <>
            <ApplyCta
              referralType="scholarship-application"
              scholarshipSlug={scholarship.slug}
              universitySlug={university?.slug}
              countrySlug={country?.slug}
              label="Apply through ALO Education"
              className="h-11 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
            />
            <SaveButton
              entityType="scholarship"
              entitySlug={scholarship.slug}
              entityName={scholarship.name}
              className="h-11 rounded-xl"
            />
            <CompareButton
              entityType="scholarship"
              entitySlug={scholarship.slug}
              entityName={scholarship.name}
              compareHref="/higher-study/compare/scholarships"
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
                  referralType="scholarship-application"
                  scholarshipSlug={scholarship.slug}
                  universitySlug={university?.slug}
                  countrySlug={country?.slug}
                  label="Apply"
                  className="w-full h-10 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                />
                <SaveButton
                  entityType="scholarship"
                  entitySlug={scholarship.slug}
                  entityName={scholarship.name}
                  className="w-full h-10 rounded-xl"
                />
                <CompareButton
                  entityType="scholarship"
                  entitySlug={scholarship.slug}
                  entityName={scholarship.name}
                  compareHref="/higher-study/compare/scholarships"
                  className="w-full h-10 rounded-xl"
                />
                {scholarship.deadline && (
                  <SidebarActionLink
                    href={`/higher-study/book-consultation?scholarship=${scholarship.slug}&topic=deadline-alert`}
                    icon={Bell}
                    label="Deadline reminder"
                    description={
                      countdown
                        ? `${countdown.label} — get a reminder`
                        : "Get a reminder"
                    }
                  />
                )}
                <SidebarActionLink
                  href={`/higher-study/eligibility-check?scholarship=${scholarship.slug}`}
                  icon={ClipboardCheck}
                  label="Check eligibility"
                  description="See if you qualify"
                />
                <SidebarActionLink
                  href={`/higher-study/book-consultation?scholarship=${scholarship.slug}`}
                  icon={CalendarCheck}
                  label="Book consultation"
                  description="Free 1:1 with an advisor"
                />
              </SidebarCard>

              <SidebarCard title="Key facts">
                {scholarship.provider && (
                  <InfoRow label="Provider" value={scholarship.provider} />
                )}
                {country && (
                  <InfoRow
                    label="Country"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden="true">{country.flagEmoji}</span>
                        {country.name}
                      </span>
                    }
                  />
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
                <InfoRow label="Funding type" value={fundingTypeLabel} />
                {scholarship.fundingAmount && (
                  <InfoRow label="Amount" value={scholarship.fundingAmount} />
                )}
                {scholarship.openingDate && (
                  <InfoRow label="Opens" value={formatDate(scholarship.openingDate) ?? "—"} />
                )}
                {scholarship.deadline && (
                  <InfoRow label="Deadline" value={formatDate(scholarship.deadline) ?? "—"} />
                )}
                <InfoRow
                  label="Tuition coverage"
                  value={scholarship.tuitionCoverage ? "Yes" : "No"}
                  boolean
                />
                <InfoRow
                  label="Living-cost coverage"
                  value={scholarship.livingCostCoverage ? "Yes" : "No"}
                  boolean
                />
                <InfoRow
                  label="Travel support"
                  value={scholarship.travelSupport ? "Yes" : "No"}
                  boolean
                />
                <InfoRow
                  label="Health insurance"
                  value={scholarship.healthInsurance ? "Yes" : "No"}
                  boolean
                />
                <InfoRow
                  label="Work exp. required"
                  value={scholarship.workExperienceRequired ? "Yes" : "No"}
                  boolean
                />
              </SidebarCard>

              {scholarship.officialSourceUrl && (
                <SidebarCard title="Official source">
                  <SidebarActionLink
                    href={scholarship.officialSourceUrl}
                    icon={ExternalLink}
                    label="View official page"
                    description="Always confirm details"
                    external
                  />
                </SidebarCard>
              )}
            </>
          }
        >
          {/* Eligibility chips */}
          {(eligibleStudyLevels.length > 0 || eligibleSubjects.length > 0 || eligibleNationalities.length > 0) && (
            <DetailCard
              title="Eligibility at a glance"
              icon={Users}
              description="Study levels, subjects and nationalities this scholarship accepts."
            >
              {eligibleStudyLevels.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Eligible study levels
                  </div>
                  <ChipList items={eligibleStudyLevels} variant="blue" />
                </div>
              )}
              {eligibleSubjects.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Eligible subjects
                  </div>
                  <ChipList items={eligibleSubjects} variant="purple" />
                </div>
              )}
              {eligibleNationalities.length > 0 && (
                <div>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Eligible nationalities
                  </div>
                  <ChipList items={eligibleNationalities} variant="orange" />
                </div>
              )}
            </DetailCard>
          )}

          {/* Funding details */}
          <DetailCard
            title="Funding details"
            icon={DollarSign}
            description="What this scholarship covers and how much it provides."
          >
            <MetaGrid items={fundingMeta} />
            {scholarship.otherBenefits && (
              <div className="mt-4 border-t border-ink-100 pt-3">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  Other benefits
                </div>
                <ProseParagraphs content={scholarship.otherBenefits} />
              </div>
            )}
          </DetailCard>

          {/* Eligibility criteria */}
          {scholarship.eligibilityCriteria && (
            <DetailCard
              title="Eligibility criteria"
              icon={ListChecks}
              description="Full eligibility criteria for this scholarship."
            >
              <ProseParagraphs content={scholarship.eligibilityCriteria} />
            </DetailCard>
          )}

          {/* Academic + English + work-experience requirements */}
          {(scholarship.academicRequirement || scholarship.englishRequirement) && (
            <DetailCard
              title="Requirements"
              icon={GraduationCap}
              description="Academic, English-language and work-experience requirements."
            >
              {scholarship.academicRequirement && (
                <div className="mb-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Academic requirement
                  </div>
                  <ProseParagraphs content={scholarship.academicRequirement} />
                </div>
              )}
              {scholarship.englishRequirement && (
                <div className="mb-4 border-t border-ink-100 pt-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    English requirement
                  </div>
                  <ProseParagraphs content={scholarship.englishRequirement} />
                </div>
              )}
              <div className="border-t border-ink-100 pt-3">
                <InfoRow
                  label="Work experience required"
                  value={scholarship.workExperienceRequired ? "Yes" : "No"}
                  boolean
                />
              </div>
            </DetailCard>
          )}

          {/* Required documents */}
          {requiredDocuments.length > 0 && (
            <DetailCard
              title="Required documents"
              icon={FileText}
              description="Documents typically required when applying for this scholarship."
            >
              <Checklist items={requiredDocuments} variant="check" />
            </DetailCard>
          )}

          {/* Opening date + deadline */}
          {(scholarship.openingDate || scholarship.deadline) && (
            <DetailCard
              title="Dates & deadline"
              icon={CalendarClock}
              description="Application window and deadline for this scholarship."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {scholarship.openingDate && (
                  <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                      <Calendar className="h-3 w-3" aria-hidden="true" />
                      Opens
                    </div>
                    <div className="mt-1 text-sm font-semibold text-ink-900">
                      {formatDate(scholarship.openingDate) ?? "—"}
                    </div>
                  </div>
                )}
                {scholarship.deadline && (
                  <div
                    className={
                      countdown?.urgent
                        ? "rounded-xl border border-orange-200 bg-orange-50 p-3"
                        : "rounded-xl border border-ink-100 bg-ink-50/60 p-3"
                    }
                  >
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                      <CalendarClock className="h-3 w-3" aria-hidden="true" />
                      Deadline
                    </div>
                    <div className="mt-1 text-sm font-semibold text-ink-900">
                      {formatDate(scholarship.deadline) ?? "—"}
                    </div>
                    {countdown && (
                      <div
                        className={
                          countdown.urgent
                            ? "mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-orange-700"
                            : "mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700"
                        }
                      >
                        {countdown.urgent && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
                        {countdown.label}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DetailCard>
          )}

          {/* Application process */}
          {scholarship.applicationProcess && (
            <DetailCard
              title="Application process"
              icon={FileText}
              description="How to apply for this scholarship."
            >
              <ProseParagraphs content={scholarship.applicationProcess} />
            </DetailCard>
          )}

          {/* Selection process */}
          {scholarship.selectionProcess && (
            <DetailCard
              title="Selection process"
              icon={ShieldCheck}
              description="How applicants are selected for this scholarship."
            >
              <ProseParagraphs content={scholarship.selectionProcess} />
            </DetailCard>
          )}

          {/* Restrictions */}
          {scholarship.restrictions && (
            <DetailCard
              title="Restrictions"
              icon={AlertCircle}
              description="Eligibility restrictions, exclusions or conditions."
            >
              <ProseParagraphs content={scholarship.restrictions} />
            </DetailCard>
          )}

          {/* Verification footer */}
          <VerificationFooter
            status={scholarship.verificationStatus}
            lastVerifiedAt={scholarship.lastVerifiedAt}
            sourceUrl={scholarship.officialSourceUrl}
            lastVerifiedBy={scholarship.lastVerifiedBy}
          />

          {/* Related scholarships */}
          {relatedScholarships.length > 0 && (
            <RelatedSection
              title="Related scholarships"
              description="Other funding opportunities with similar criteria."
              viewAllHref="/higher-study/scholarships"
            >
              {relatedScholarships.map((s) => (
                <ScholarshipCard key={s.id} scholarship={s as never} showActions={false} />
              ))}
            </RelatedSection>
          )}
        </DetailLayout>
      </DetailShell>

      <JsonLdScript data={[scholarshipLd, breadcrumbLd]} />
    </>
  );
}

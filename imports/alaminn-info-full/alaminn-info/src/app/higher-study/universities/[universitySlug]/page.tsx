/**
 * /higher-study/universities/[universitySlug]
 * --------------------------------------------------------------------
 * University detail page — comprehensive profile per master prompt §9.
 *
 * Renders: hero (name, alt names, established year, type, country + flag,
 * city, campus, website, contact), overview, available intakes,
 * programmes by level (UG/PG/MBA/MRes/MPhil/PhD/ProfDoc counts → filtered
 * course-finder links), research departments + strengths, available
 * supervisors (DB query), scholarships (DB query), tuition ranges +
 * deposit info, academic + country-specific entry requirements, English
 * requirements table (7 tests) + waiver policy, work-experience /
 * portfolio / interview requirements, application deadlines,
 * accommodation + living costs, international student services + disability
 * + career support, graduate outcomes + Graduate Route guidance, application
 * guidance, rankings table, official links, sticky sidebar with Apply /
 * Save / Compare / Eligibility / Consultation / "View courses" actions,
 * verification footer, related universities (same country), JSON-LD
 * (CollegeOrUniversity + BreadcrumbList), generateMetadata +
 * generateStaticParams (top 50 universities).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Globe2,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  GraduationCap,
  FlaskConical,
  Award,
  DollarSign,
  BookOpen,
  CheckCircle2,
  XCircle,
  Trophy,
  Users,
  Briefcase,
  Home,
  HeartHandshake,
  Target,
  FileText,
  ShieldCheck,
  CalendarClock,
  LayoutGrid,
  ClipboardCheck,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildUniversityJsonLd,
  buildBreadcrumbJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { UniversityCard } from "@/components/higher-study/university-card";
import { SupervisorCard } from "@/components/higher-study/supervisor-card";
import { ScholarshipCard } from "@/components/higher-study/scholarship-card";
import { ApplyCta } from "@/components/higher-study/apply-cta";
import { SaveButton } from "@/components/higher-study/save-button";
import { CompareButton } from "@/components/higher-study/compare-button";
import { cn } from "@/lib/utils";
import {
  DetailShell,
  DetailLayout,
  DetailHero,
  DetailCard,
  SidebarCard,
  SidebarActionLink,
  MetaGrid,
  ProseParagraphs,
  ChipList,
  InfoRow,
  HeroMetaItem,
  FeaturedBadge,
  VerificationFooter,
  RelatedSection,
  JsonLdScript,
  EmptyDataNote,
  safeParseJsonArray,
  parseCommaList,
} from "../../_lib/detail-helpers";
import type { BreadcrumbItem } from "@/components/higher-study/breadcrumb";
import type { OfficialLink, RankingEntry, University } from "@/lib/higher-study/types";

// ─── Static params (top 50 universities) ──────────────────────────────

export async function generateStaticParams() {
  try {
    const universities = await db.higherStudyUniversity.findMany({
      where: { publicationStatus: "published" },
      select: { slug: true },
      take: 50,
      orderBy: [{ featured: "desc" }, { lastVerifiedAt: "desc" }],
    });
    return universities.map((u) => ({ universitySlug: u.slug }));
  } catch {
    return [];
  }
}

// ─── Dynamic metadata ─────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ universitySlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { universitySlug } = await params;
  let university: {
    officialName: string;
    overview: string | null;
    slug: string;
    institutionType: string | null;
    establishedYear: number | null;
    country: { name: string } | null;
    city: { name: string } | null;
  } | null = null;
  try {
    university = await db.higherStudyUniversity.findUnique({
      where: { slug: universitySlug },
      select: {
        officialName: true,
        overview: true,
        slug: true,
        institutionType: true,
        establishedYear: true,
        country: { select: { name: true } },
        city: { select: { name: true } },
      },
    });
  } catch {
    /* ignore */
  }
  if (!university) {
    return buildHigherStudyMetadata({
      title: "University not found — Higher Study | Alaminn.info",
      description: "The university you were looking for could not be found.",
      path: `/higher-study/universities/${universitySlug}`,
      noindex: true,
    });
  }
  const country = university.country?.name;
  const city = university.city?.name;
  const description = university.overview
    ? university.overview.slice(0, 160)
    : `${university.officialName}${country ? ` in ${country}` : ""}${city ? `, ${city}` : ""} — programmes, entry requirements, scholarships, PhD opportunities and verified application guidance.`;
  return buildHigherStudyMetadata({
    title: `${university.officialName} — Programmes, Requirements & Scholarships | Higher Study`,
    description,
    path: `/higher-study/universities/${university.slug}`,
    keywords: [
      university.officialName,
      country ? `universities in ${country}` : "",
      city ? `universities in ${city}` : "",
      university.institutionType ? `${university.institutionType} university` : "",
      "study abroad",
      "programmes",
      "entry requirements",
      "scholarships",
    ].filter(Boolean) as string[],
    type: "website",
  });
}

// ─── English requirements table builder ───────────────────────────────

const ENGLISH_TEST_FIELDS: Array<{
  key:
    | "ieltsRequirement"
    | "ieltsUkviRequirement"
    | "pteRequirement"
    | "toeflRequirement"
    | "duolingoRequirement"
    | "languageCertRequirement"
    | "oxfordElltRequirement";
  label: string;
}> = [
  { key: "ieltsRequirement", label: "IELTS Academic" },
  { key: "ieltsUkviRequirement", label: "IELTS for UKVI" },
  { key: "pteRequirement", label: "PTE Academic" },
  { key: "toeflRequirement", label: "TOEFL iBT" },
  { key: "duolingoRequirement", label: "Duolingo English Test" },
  { key: "languageCertRequirement", label: "LanguageCert" },
  { key: "oxfordElltRequirement", label: "Oxford ELLT" },
];

// ─── Page ─────────────────────────────────────────────────────────────

export default async function UniversityDetailPage({ params }: PageProps) {
  const { universitySlug } = await params;

  // Fetch the university with all relations needed for the detail page.
  let university: University | null = null;
  try {
    university = (await db.higherStudyUniversity.findUnique({
      where: { slug: universitySlug },
      include: {
        country: { select: { id: true, slug: true, name: true, flagEmoji: true, region: true } },
        city: { select: { id: true, slug: true, name: true } },
      },
    })) as University | null;
  } catch (e) {
    console.error("[university-detail] DB error", e);
  }

  if (!university) {
    notFound();
  }

  // Parse JSON / list fields safely.
  const rankings = safeParseJsonArray<RankingEntry>(university.rankingsJson);
  const officialLinks = safeParseJsonArray<OfficialLink>(university.officialLinks);
  const altNames = parseCommaList(university.alternativeNames);
  const researchDepartments = parseCommaList(university.researchDepartments);
  const availableIntakes = parseCommaList(university.availableIntakes);

  // Parallel DB queries for related entities.
  const [supervisors, scholarships, coursesCount, relatedUniversities] = await Promise.all([
    db.higherStudySupervisor
      .findMany({
        where: {
          universityId: university.id,
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
        },
        take: 8,
        orderBy: [{ acceptingStudents: "desc" }, { lastVerifiedAt: "desc" }],
        include: {
          university: { select: { id: true, slug: true, officialName: true } },
        },
      })
      .catch(() => []),
    db.higherStudyScholarship
      .findMany({
        where: {
          OR: [
            { universityId: university.id },
            { countryId: university.countryId },
          ],
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
        },
        take: 8,
        orderBy: [{ featured: "desc" }, { deadline: "asc" }],
        include: {
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          university: { select: { id: true, slug: true, officialName: true } },
        },
      })
      .catch(() => []),
    db.higherStudyCourse
      .count({
        where: {
          universityId: university.id,
          publicationStatus: "published",
        },
      })
      .catch(() => 0),
    db.higherStudyUniversity
      .findMany({
        where: {
          countryId: university.countryId,
          slug: { not: university.slug },
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
        },
        take: 4,
        orderBy: [{ featured: "desc" }, { lastVerifiedAt: "desc" }],
        include: {
          country: { select: { id: true, slug: true, name: true, flagEmoji: true, region: true } },
          city: { select: { id: true, slug: true, name: true } },
        },
      })
      .catch(() => []),
  ]);

  // Programme-level counts: render as links to course-finder filtered
  // by university + study-level group.
  const programmeLevels: Array<{
    label: string;
    count: number | string | null | undefined;
    href: string;
    icon: LucideIcon;
    enabled: boolean;
  }> = [
    {
      label: "Undergraduate",
      count: university.undergraduateCount,
      href: `/higher-study/courses?university=${university.slug}&level=undergraduate`,
      icon: BookOpen,
      enabled: (university.undergraduateCount ?? 0) > 0,
    },
    {
      label: "Postgraduate",
      count: university.postgraduateCount,
      href: `/higher-study/courses?university=${university.slug}&level=postgraduate`,
      icon: GraduationCap,
      enabled: (university.postgraduateCount ?? 0) > 0,
    },
    {
      label: "MBA",
      count: university.hasMBA ? "Available" : null,
      href: `/higher-study/courses?university=${university.slug}&level=mba`,
      icon: Briefcase,
      enabled: university.hasMBA,
    },
    {
      label: "MRes",
      count: university.hasMRes ? "Available" : null,
      href: `/higher-study/courses?university=${university.slug}&level=mres`,
      icon: FlaskConical,
      enabled: university.hasMRes,
    },
    {
      label: "MPhil",
      count: university.hasMPhil ? "Available" : null,
      href: `/higher-study/courses?university=${university.slug}&level=mphil`,
      icon: FlaskConical,
      enabled: university.hasMPhil,
    },
    {
      label: "PhD",
      count: university.hasPhD ? "Available" : null,
      href: `/higher-study/phd-research?university=${university.slug}`,
      icon: FlaskConical,
      enabled: university.hasPhD,
    },
    {
      label: "Professional Doctorate",
      count: university.hasProfessionalDoctorate ? "Available" : null,
      href: `/higher-study/courses?university=${university.slug}&level=professional-doctorate`,
      icon: Award,
      enabled: university.hasProfessionalDoctorate,
    },
  ];

  // English requirements rows (only render rows with non-empty values).
  const englishRows = ENGLISH_TEST_FIELDS.map((t) => ({
    label: t.label,
    value: university[t.key] as string | null | undefined,
  })).filter((r) => r.value);

  // Build breadcrumb items.
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Universities", href: "/higher-study/global-universities" },
    { label: university.officialName },
  ];

  // Build JSON-LD objects.
  const universityLd = buildUniversityJsonLd(university);
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Universities", url: `${HIGHER_STUDY_BASE_URL}/higher-study/global-universities` },
    { name: university.officialName, url: `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${university.slug}` },
  ]);

  const country = university.country;
  const city = university.city;

  return (
    <>
      <HigherStudyBreadcrumb
        items={breadcrumbItems}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <DetailHero
        eyebrow={country ? `${country.flagEmoji} ${country.name}` : "University"}
        title={university.officialName}
        description={university.overview ? university.overview.slice(0, 220) : undefined}
        badges={
          <>
            {university.featured && <FeaturedBadge />}
            {university.institutionType && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-blue-700">
                <Building2 className="h-3 w-3" aria-hidden="true" />
                {university.institutionType}
              </span>
            )}
            {university.establishedYear && (
              <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-[11px] font-medium text-ink-700">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                Est. {university.establishedYear}
              </span>
            )}
          </>
        }
        meta={
          <>
            {country && (
              <HeroMetaItem icon={Globe2}>
                {country.flagEmoji} {country.name}
              </HeroMetaItem>
            )}
            {city && (
              <HeroMetaItem icon={MapPin}>{city.name}</HeroMetaItem>
            )}
            {university.campusLocations && (
              <HeroMetaItem icon={Building2}>{university.campusLocations}</HeroMetaItem>
            )}
            {university.officialWebsite && (
              <a
                href={university.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Official website
              </a>
            )}
            {university.contactEmail && (
              <HeroMetaItem icon={Mail}>{university.contactEmail}</HeroMetaItem>
            )}
            {university.contactPhone && (
              <HeroMetaItem icon={Phone}>{university.contactPhone}</HeroMetaItem>
            )}
          </>
        }
        actions={
          <>
            <ApplyCta
              referralType="university-application"
              universitySlug={university.slug}
              countrySlug={country?.slug}
              label="Apply through ALO Education"
              className="h-11 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
            />
            <SaveButton
              entityType="university"
              entitySlug={university.slug}
              entityName={university.officialName}
              className="h-11 rounded-xl"
            />
            <CompareButton
              entityType="university"
              entitySlug={university.slug}
              entityName={university.officialName}
              compareHref={`/higher-study/compare/universities`}
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
                  referralType="university-application"
                  universitySlug={university.slug}
                  countrySlug={country?.slug}
                  label="Apply"
                  className="w-full h-10 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                />
                <SaveButton
                  entityType="university"
                  entitySlug={university.slug}
                  entityName={university.officialName}
                  className="w-full h-10 rounded-xl"
                />
                <CompareButton
                  entityType="university"
                  entitySlug={university.slug}
                  entityName={university.officialName}
                  compareHref="/higher-study/compare/universities"
                  className="w-full h-10 rounded-xl"
                />
                <SidebarActionLink
                  href={`/higher-study/eligibility-check?university=${university.slug}`}
                  icon={ClipboardCheck}
                  label="Check eligibility"
                  description="See if you qualify"
                />
                <SidebarActionLink
                  href={`/higher-study/book-consultation?university=${university.slug}`}
                  icon={CalendarCheck}
                  label="Book consultation"
                  description="Free 1:1 with an advisor"
                />
              </SidebarCard>

              <SidebarCard title="Key facts">
                <InfoRow
                  label="Country"
                  value={
                    country ? (
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden="true">{country.flagEmoji}</span>
                        {country.name}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                {city && <InfoRow label="City" value={city.name} />}
                {university.establishedYear && (
                  <InfoRow label="Established" value={university.establishedYear} />
                )}
                {university.institutionType && (
                  <InfoRow label="Type" value={<span className="capitalize">{university.institutionType}</span>} />
                )}
                {university.tuitionFeeRange && (
                  <InfoRow label="Tuition" value={university.tuitionFeeRange} />
                )}
                {coursesCount > 0 && (
                  <InfoRow label="Programmes" value={coursesCount} />
                )}
                <InfoRow
                  label="Work exp. required"
                  value={university.workExperienceRequired ? "Yes" : "No"}
                  boolean
                />
                <InfoRow
                  label="Portfolio required"
                  value={university.portfolioRequired ? "Yes" : "No"}
                  boolean
                />
                <InfoRow
                  label="Interview required"
                  value={university.interviewRequired ? "Yes" : "No"}
                  boolean
                />
              </SidebarCard>

              <SidebarCard title="Explore at this university">
                <SidebarActionLink
                  href={`/higher-study/universities/${university.slug}/courses`}
                  icon={LayoutGrid}
                  label="View courses"
                  description={`${coursesCount} programme${coursesCount === 1 ? "" : "s"}`}
                />
                <SidebarActionLink
                  href={`/higher-study/universities/${university.slug}/scholarships`}
                  icon={Award}
                  label="View scholarships"
                  description="Funding opportunities"
                />
                <SidebarActionLink
                  href={`/higher-study/universities/${university.slug}/research`}
                  icon={FlaskConical}
                  label="Research & PhDs"
                  description="Projects + supervisors"
                />
                {university.officialWebsite && (
                  <SidebarActionLink
                    href={university.officialWebsite}
                    icon={ExternalLink}
                    label="Official website"
                    description="Visit the university site"
                    external
                  />
                )}
              </SidebarCard>
            </>
          }
        >
          {/* Overview */}
          {university.overview && (
            <DetailCard
              title="Overview"
              icon={FileText}
              description="A summary of the university, its history and what it offers."
            >
              <ProseParagraphs content={university.overview} />
              {altNames.length > 0 && (
                <div className="mt-4 border-t border-ink-100 pt-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Also known as
                  </div>
                  <ChipList
                    items={altNames}
                    variant="orange"
                    className="mt-2"
                  />
                </div>
              )}
            </DetailCard>
          )}

          {/* Programmes by level */}
          <DetailCard
            title="Programmes by level"
            icon={GraduationCap}
            description="Explore programmes at this university by study level. Counts link to filtered course-finder results."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {programmeLevels.map((lvl) => (
                <Link
                  key={lvl.label}
                  href={lvl.enabled ? lvl.href : "#"}
                  aria-disabled={!lvl.enabled}
                  tabIndex={lvl.enabled ? 0 : -1}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-xl border p-3 transition-all",
                    lvl.enabled
                      ? "border-ink-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-soft"
                      : "border-dashed border-ink-200 bg-ink-50/40 opacity-60 pointer-events-none",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <lvl.icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-900">
                        {lvl.label}
                      </div>
                      <div className="text-[11px] text-ink-500">
                        {lvl.count != null && lvl.count !== "" ? (
                          typeof lvl.count === "number"
                            ? `${lvl.count} programme${lvl.count === 1 ? "" : "s"}`
                            : lvl.count
                        ) : (
                          "Not offered"
                        )}
                      </div>
                    </div>
                  </div>
                  {lvl.enabled && (
                    <ExternalLink
                      className="h-4 w-4 shrink-0 text-blue-600 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              ))}
            </div>
          </DetailCard>

          {/* Available intakes */}
          {availableIntakes.length > 0 && (
            <DetailCard
              title="Available intakes"
              icon={CalendarClock}
              description="When new cohorts begin. Confirm exact dates on the official site."
            >
              <ChipList items={availableIntakes} variant="blue" />
            </DetailCard>
          )}

          {/* Research departments + strengths */}
          {(researchDepartments.length > 0 || university.researchStrengths) && (
            <DetailCard
              title="Research departments & strengths"
              icon={FlaskConical}
              description="Faculty-organised research areas and proven strengths."
            >
              {researchDepartments.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Departments
                  </div>
                  <ChipList items={researchDepartments} variant="purple" />
                </div>
              )}
              {university.researchStrengths && (
                <div>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Research strengths
                  </div>
                  <ProseParagraphs content={university.researchStrengths} />
                </div>
              )}
            </DetailCard>
          )}

          {/* Available supervisors */}
          <DetailCard
            title="Available supervisors"
            icon={Users}
            description="Faculty members currently accepting research students at this university."
            actions={
              <Link
                href={`/higher-study/supervisors?university=${university.slug}`}
                className="inline-flex items-center gap-1 rounded-xl border border-ink-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              >
                Browse all
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            }
          >
            {supervisors.length === 0 ? (
              <EmptyDataNote label="No supervisor profiles published yet. Check back soon or browse all supervisors." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {supervisors.map((s) => (
                  <SupervisorCard key={s.id} supervisor={s as never} showActions={false} />
                ))}
              </div>
            )}
          </DetailCard>

          {/* Scholarships */}
          <DetailCard
            title="Scholarships"
            icon={Award}
            description="Funding opportunities available at this university or in this country."
            actions={
              <Link
                href={`/higher-study/universities/${university.slug}/scholarships`}
                className="inline-flex items-center gap-1 rounded-xl border border-ink-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              >
                View all
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            }
          >
            {scholarships.length === 0 ? (
              <EmptyDataNote label="No scholarships published yet for this university." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {scholarships.map((s) => (
                  <ScholarshipCard key={s.id} scholarship={s as never} showActions={false} />
                ))}
              </div>
            )}
          </DetailCard>

          {/* Tuition + deposit */}
          {(university.tuitionFeeRange || university.depositInfo) && (
            <DetailCard
              title="Tuition fees & deposit"
              icon={DollarSign}
              description="Indicative annual tuition range and deposit policy."
            >
              {university.tuitionFeeRange && (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Tuition range (annual)
                  </div>
                  <div className="mt-1 font-display text-xl font-extrabold text-emerald-700">
                    {university.tuitionFeeRange}
                  </div>
                </div>
              )}
              {university.depositInfo && (
                <ProseParagraphs content={university.depositInfo} />
              )}
            </DetailCard>
          )}

          {/* Academic entry requirements */}
          {(university.academicEntryRequirements || university.countrySpecificRequirements) && (
            <DetailCard
              title="Academic entry requirements"
              icon={GraduationCap}
              description="General academic requirements and country-specific guidance."
            >
              {university.academicEntryRequirements && (
                <div className="mb-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    General requirements
                  </div>
                  <ProseParagraphs content={university.academicEntryRequirements} />
                </div>
              )}
              {university.countrySpecificRequirements && (
                <div className="border-t border-ink-100 pt-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Country-specific requirements
                  </div>
                  <ProseParagraphs content={university.countrySpecificRequirements} />
                </div>
              )}
            </DetailCard>
          )}

          {/* English requirements table */}
          {(englishRows.length > 0 || university.englishWaiverPolicy) && (
            <DetailCard
              title="English language requirements"
              icon={BookOpen}
              description="Minimum accepted scores by test. Some programmes may require higher scores."
            >
              {englishRows.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-ink-200">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-ink-50">
                        <th scope="col" className="border-b border-ink-200 px-4 py-2.5 text-left font-semibold text-ink-900">
                          Test
                        </th>
                        <th scope="col" className="border-b border-ink-200 px-4 py-2.5 text-left font-semibold text-ink-900">
                          Minimum requirement
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {englishRows.map((row) => (
                        <tr key={row.label} className="border-b border-ink-100 last:border-b-0">
                          <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink-800">
                            {row.label}
                          </th>
                          <td className="px-4 py-2.5 text-ink-700">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyDataNote label="No specific English-test scores published — confirm with the official source." />
              )}
              {university.englishWaiverPolicy && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    English waiver policy
                  </div>
                  <ProseParagraphs content={university.englishWaiverPolicy} />
                </div>
              )}
            </DetailCard>
          )}

          {/* Other requirements (work-experience / portfolio / interview) */}
          <DetailCard
            title="Other requirements"
            icon={ClipboardCheck}
            description="Whether the university typically requires work experience, a portfolio or an interview."
          >
            <MetaGrid
              items={[
                {
                  icon: Briefcase,
                  label: "Work experience",
                  value: university.workExperienceRequired ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-ink-500">
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Not typically
                    </span>
                  ),
                },
                {
                  icon: FileText,
                  label: "Portfolio",
                  value: university.portfolioRequired ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-ink-500">
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Not typically
                    </span>
                  ),
                },
                {
                  icon: Users,
                  label: "Interview",
                  value: university.interviewRequired ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-ink-500">
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Not typically
                    </span>
                  ),
                },
              ]}
            />
          </DetailCard>

          {/* Application deadlines */}
          {university.applicationDeadlines && (
            <DetailCard
              title="Application deadlines"
              icon={CalendarClock}
              description="Typical deadlines by intake. Always confirm on the official site."
            >
              <ProseParagraphs content={university.applicationDeadlines} />
            </DetailCard>
          )}

          {/* Accommodation + living costs */}
          {(university.accommodationOptions || university.estimatedLivingCosts) && (
            <DetailCard
              title="Accommodation & living costs"
              icon={Home}
              description="Housing options and indicative living-cost estimates."
            >
              {university.estimatedLivingCosts && (
                <div className="mb-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Estimated living costs
                  </div>
                  <ProseParagraphs content={university.estimatedLivingCosts} />
                </div>
              )}
              {university.accommodationOptions && (
                <div className="border-t border-ink-100 pt-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Accommodation options
                  </div>
                  <ProseParagraphs content={university.accommodationOptions} />
                </div>
              )}
            </DetailCard>
          )}

          {/* International student services */}
          {(university.internationalStudentServices || university.disabilitySupport || university.careerSupport) && (
            <DetailCard
              title="Student services"
              icon={HeartHandshake}
              description="Support available to international students."
            >
              {university.internationalStudentServices && (
                <div className="mb-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    International student services
                  </div>
                  <ProseParagraphs content={university.internationalStudentServices} />
                </div>
              )}
              {university.disabilitySupport && (
                <div className="mb-3 border-t border-ink-100 pt-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Disability support
                  </div>
                  <ProseParagraphs content={university.disabilitySupport} />
                </div>
              )}
              {university.careerSupport && (
                <div className="border-t border-ink-100 pt-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Career support
                  </div>
                  <ProseParagraphs content={university.careerSupport} />
                </div>
              )}
            </DetailCard>
          )}

          {/* Graduate outcomes + Graduate Route */}
          {(university.graduateOutcomes || university.graduateRouteGuidance) && (
            <DetailCard
              title="Graduate outcomes & post-study route"
              icon={Target}
              description="Employment outcomes and post-study work visa guidance."
            >
              {university.graduateOutcomes && (
                <div className="mb-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Graduate outcomes
                  </div>
                  <ProseParagraphs content={university.graduateOutcomes} />
                </div>
              )}
              {university.graduateRouteGuidance && (
                <div className="border-t border-ink-100 pt-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Graduate Route guidance
                  </div>
                  <ProseParagraphs content={university.graduateRouteGuidance} />
                </div>
              )}
            </DetailCard>
          )}

          {/* Application guidance */}
          {university.applicationGuidance && (
            <DetailCard
              title="Application guidance"
              icon={FileText}
              description="Step-by-step guidance on how to apply."
            >
              <ProseParagraphs content={university.applicationGuidance} />
            </DetailCard>
          )}

          {/* Rankings table */}
          {rankings.length > 0 && (
            <DetailCard
              title="Rankings"
              icon={Trophy}
              description="Verified rankings from recognised providers."
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-ink-50">
                      <th scope="col" className="border-b border-ink-200 px-3 py-2 text-left font-semibold text-ink-900">
                        Provider
                      </th>
                      <th scope="col" className="border-b border-ink-200 px-3 py-2 text-left font-semibold text-ink-900">
                        Year
                      </th>
                      <th scope="col" className="border-b border-ink-200 px-3 py-2 text-left font-semibold text-ink-900">
                        Category
                      </th>
                      <th scope="col" className="border-b border-ink-200 px-3 py-2 text-left font-semibold text-ink-900">
                        Rank
                      </th>
                      <th scope="col" className="border-b border-ink-200 px-3 py-2 text-left font-semibold text-ink-900">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((r, idx) => (
                      <tr key={`${r.provider}-${idx}`} className="border-b border-ink-100 last:border-b-0">
                        <td className="px-3 py-2 font-medium text-ink-800">{r.provider}</td>
                        <td className="px-3 py-2 text-ink-700">{r.year ?? "—"}</td>
                        <td className="px-3 py-2 text-ink-700">{r.category ?? "—"}</td>
                        <td className="px-3 py-2 font-semibold text-orange-700">#{r.rank ?? "—"}</td>
                        <td className="px-3 py-2 text-ink-700">
                          {r.source ? (
                            <a
                              href={r.source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                            >
                              Link
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DetailCard>
          )}

          {/* Official links */}
          {officialLinks.length > 0 && (
            <DetailCard
              title="Official links"
              icon={ExternalLink}
              description="Verified official sources for this university."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {officialLinks.map((link, idx) => (
                  <a
                    key={`${link.label}-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-2 rounded-xl border border-ink-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-soft"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink-900">{link.label}</span>
                      <span className="block truncate text-[11px] text-ink-500">{link.url}</span>
                    </span>
                    <ExternalLink className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </DetailCard>
          )}

          {/* Verification footer */}
          <VerificationFooter
            status={university.verificationStatus}
            lastVerifiedAt={university.lastVerifiedAt}
            sourceUrl={university.officialSourceUrl}
            lastVerifiedBy={university.lastVerifiedBy}
          />

          {/* Related universities */}
          {relatedUniversities.length > 0 && (
            <RelatedSection
              title={`More universities in ${country?.name ?? "this country"}`}
              description="Other verified institutions in the same destination."
              viewAllHref={`/higher-study/global-universities?country=${country?.slug ?? ""}`}
            >
              {relatedUniversities.map((u) => (
                <UniversityCard key={u.id} university={u as never} showActions={false} />
              ))}
            </RelatedSection>
          )}
        </DetailLayout>
      </DetailShell>

      <JsonLdScript data={[universityLd, breadcrumbLd]} />
    </>
  );
}

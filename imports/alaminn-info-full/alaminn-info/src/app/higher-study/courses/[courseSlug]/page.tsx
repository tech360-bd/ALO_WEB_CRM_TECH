/**
 * /higher-study/courses/[courseSlug]
 * --------------------------------------------------------------------
 * Course detail page per master prompt §11. Renders header (title,
 * university link, country, campus, study-level badge, qualification,
 * subject, specialisation), overview, modules (from JSON), duration,
 * study mode, available intakes, tuition fee + other costs, scholarship
 * availability, academic + country-specific requirements, English
 * requirements, work-experience / portfolio / interview requirements,
 * career outcomes, placement info, research component, application
 * deadline, required documents, sticky sidebar (Apply / Save / Compare /
 * Eligibility / Consultation), verification footer, related courses,
 * JSON-LD (Course + BreadcrumbList), generateMetadata +
 * generateStaticParams (top 100 courses).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Clock,
  DollarSign,
  Calendar,
  MapPin,
  Award,
  Briefcase,
  FileText,
  TrendingUp,
  FlaskConical,
  CalendarClock,
  ExternalLink,
  ClipboardCheck,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  ListChecks,
  Building2,
  Languages,
  ArrowRight,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildCourseJsonLd,
  buildBreadcrumbJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { CourseCard } from "@/components/higher-study/course-card";
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
  safeParseJsonArray,
  parseCommaList,
  formatCurrency,
} from "../../_lib/detail-helpers";
import type { BreadcrumbItem } from "@/components/higher-study/breadcrumb";
import type { Course } from "@/lib/higher-study/types";
import { STUDY_LEVEL_MAP } from "@/lib/higher-study/constants";

// ─── Static params (top 100 courses) ──────────────────────────────────

export async function generateStaticParams() {
  try {
    const courses = await db.higherStudyCourse.findMany({
      where: { publicationStatus: "published" },
      select: { slug: true },
      take: 100,
      orderBy: [{ featured: "desc" }, { lastVerifiedAt: "desc" }],
    });
    return courses.map((c) => ({ courseSlug: c.slug }));
  } catch {
    return [];
  }
}

// ─── Dynamic metadata ─────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { courseSlug } = await params;
  let course: {
    title: string;
    overview: string | null;
    slug: string;
    qualification: string | null;
    specialisation: string | null;
    studyLevel: string;
    tuitionFee: number | null;
    tuitionCurrency: string;
    duration: string | null;
    university: { officialName: string; slug: string } | null;
  } | null = null;
  try {
    course = await db.higherStudyCourse.findUnique({
      where: { slug: courseSlug },
      select: {
        title: true,
        overview: true,
        slug: true,
        qualification: true,
        specialisation: true,
        studyLevel: true,
        tuitionFee: true,
        tuitionCurrency: true,
        duration: true,
        university: { select: { officialName: true, slug: true } },
      },
    });
  } catch {
    /* ignore */
  }
  if (!course) {
    return buildHigherStudyMetadata({
      title: "Course not found — Higher Study",
      description: "The course you were looking for could not be found.",
      path: `/higher-study/courses/${courseSlug}`,
      noindex: true,
    });
  }
  const levelLabel = STUDY_LEVEL_MAP[course.studyLevel] ?? course.studyLevel;
  const description = course.overview
    ? course.overview.slice(0, 160)
    : `${course.title}${course.university ? ` at ${course.university.officialName}` : ""} — ${levelLabel}${course.qualification ? `, ${course.qualification}` : ""}. Tuition, entry requirements, scholarships and verified application guidance.`;
  return buildHigherStudyMetadata({
    title: `${course.title} — ${levelLabel} | Higher Study`,
    description,
    path: `/higher-study/courses/${course.slug}`,
    keywords: [
      course.title,
      course.qualification ?? "",
      levelLabel,
      course.specialisation ?? "",
      course.university?.officialName ?? "",
      "study abroad",
      "course",
      "programme",
    ].filter(Boolean) as string[],
    type: "website",
  });
}

// ─── Module renderer ──────────────────────────────────────────────────

interface CourseModule {
  title?: string;
  name?: string;
  code?: string;
  credits?: number | string;
  description?: string;
  semester?: string;
  compulsory?: boolean;
}

function renderModules(modules: CourseModule[]) {
  return (
    <ul className="space-y-2">
      {modules.map((m, idx) => {
        const title = m.title ?? m.name ?? `Module ${idx + 1}`;
        return (
          <li
            key={`${title}-${idx}`}
            className="rounded-xl border border-ink-100 bg-ink-50/40 p-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-sm font-bold text-ink-900">
                  {title}
                </span>
                {m.code && (
                  <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-mono text-ink-600 ring-1 ring-ink-200">
                    {m.code}
                  </span>
                )}
                {m.compulsory !== undefined && (
                  <span
                    className={
                      m.compulsory
                        ? "inline-flex items-center gap-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"
                        : "inline-flex items-center gap-0.5 rounded-md bg-ink-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-600"
                    }
                  >
                    {m.compulsory ? "Core" : "Optional"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-ink-500">
                {m.credits && <span>{m.credits} credits</span>}
                {m.semester && <span>· {m.semester}</span>}
              </div>
            </div>
            {m.description && (
              <p className="mt-1 text-xs leading-relaxed text-ink-600">
                {m.description}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseSlug } = await params;

  let course: Course | null = null;
  try {
    course = (await db.higherStudyCourse.findUnique({
      where: { slug: courseSlug },
      include: {
        university: {
          select: {
            id: true,
            slug: true,
            officialName: true,
            logoUrl: true,
            country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
            city: { select: { id: true, slug: true, name: true } },
          },
        },
        country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
        subject: { select: { id: true, slug: true, name: true, category: true } },
        intake: { select: { id: true, slug: true, name: true, applicationDeadline: true } },
      },
    })) as Course | null;
  } catch (e) {
    console.error("[course-detail] DB error", e);
  }

  if (!course) {
    notFound();
  }

  const modules = safeParseJsonArray<CourseModule>(course.modules);
  const requiredDocuments = parseCommaList(course.requiredDocuments);

  const tuition = formatCurrency(course.tuitionFee, course.tuitionCurrency);
  const studyLevelLabel = STUDY_LEVEL_MAP[course.studyLevel] ?? course.studyLevel;
  const university = course.university;
  const country = course.country ?? university?.country;
  const city = university?.city;
  const subject = course.subject;

  // Related courses (same subject, exclude self).
  const relatedCourses = subject
    ? await db.higherStudyCourse
        .findMany({
          where: {
            subjectId: subject.id,
            slug: { not: course.slug },
            publicationStatus: "published",
            verificationStatus: { in: ["verified", "published"] },
          },
          take: 4,
          orderBy: [{ featured: "desc" }, { lastVerifiedAt: "desc" }],
          include: {
            university: { select: { id: true, slug: true, officialName: true } },
            country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
            subject: { select: { id: true, slug: true, name: true } },
            intake: { select: { id: true, slug: true, name: true } },
          },
        })
        .catch(() => [])
    : [];

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Courses", href: "/higher-study/courses" },
    { label: course.title },
  ];

  const courseLd = buildCourseJsonLd(course);
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Courses", url: `${HIGHER_STUDY_BASE_URL}/higher-study/courses` },
    { name: course.title, url: `${HIGHER_STUDY_BASE_URL}/higher-study/courses/${course.slug}` },
  ]);

  // Meta grid for hero (duration, mode, tuition, intake).
  const metaItems: MetaItemProps[] = [];
  if (course.duration) metaItems.push({ icon: Clock, label: "Duration", value: course.duration });
  if (course.studyMode) metaItems.push({ icon: BookOpen, label: "Mode", value: <span className="capitalize">{course.studyMode}</span> });
  if (tuition) metaItems.push({ icon: DollarSign, label: "Tuition", value: <span className="font-semibold text-emerald-700">{tuition}</span> });
  if (course.intake?.name) metaItems.push({ icon: Calendar, label: "Intake", value: course.intake.name });

  return (
    <>
      <HigherStudyBreadcrumb
        items={breadcrumbItems}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <DetailHero
        eyebrow={studyLevelLabel}
        title={course.title}
        description={course.overview ? course.overview.slice(0, 220) : undefined}
        badges={
          <>
            {course.featured && <FeaturedBadge />}
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
              <GraduationCap className="h-3 w-3" aria-hidden="true" />
              {studyLevelLabel}
            </span>
            {course.qualification && (
              <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-[11px] font-medium text-ink-700">
                <Award className="h-3 w-3" aria-hidden="true" />
                {course.qualification}
              </span>
            )}
            {course.scholarshipAvailable && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                <Award className="h-3 w-3" aria-hidden="true" />
                Scholarships available
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
            {country && (
              <HeroMetaItem icon={MapPin}>
                {country.flagEmoji} {country.name}
              </HeroMetaItem>
            )}
            {city && <HeroMetaItem icon={MapPin}>{city.name}</HeroMetaItem>}
            {course.specialisation && (
              <HeroMetaItem icon={BookOpen}>{course.specialisation}</HeroMetaItem>
            )}
            {subject && (
              <HeroMetaItem icon={BookOpen}>Subject: {subject.name}</HeroMetaItem>
            )}
          </>
        }
        actions={
          <>
            <ApplyCta
              referralType="course-application"
              courseSlug={course.slug}
              universitySlug={university?.slug}
              countrySlug={country?.slug}
              studyLevel={course.studyLevel}
              label="Apply through ALO Education"
              className="h-11 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
            />
            <SaveButton
              entityType="course"
              entitySlug={course.slug}
              entityName={course.title}
              className="h-11 rounded-xl"
            />
            <CompareButton
              entityType="course"
              entitySlug={course.slug}
              entityName={course.title}
              compareHref="/higher-study/compare/courses"
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
                  referralType="course-application"
                  courseSlug={course.slug}
                  universitySlug={university?.slug}
                  countrySlug={country?.slug}
                  studyLevel={course.studyLevel}
                  label="Apply"
                  className="w-full h-10 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                />
                <SaveButton
                  entityType="course"
                  entitySlug={course.slug}
                  entityName={course.title}
                  className="w-full h-10 rounded-xl"
                />
                <CompareButton
                  entityType="course"
                  entitySlug={course.slug}
                  entityName={course.title}
                  compareHref="/higher-study/compare/courses"
                  className="w-full h-10 rounded-xl"
                />
                <SidebarActionLink
                  href={`/higher-study/eligibility-check?course=${course.slug}`}
                  icon={ClipboardCheck}
                  label="Check eligibility"
                  description="See if you qualify"
                />
                <SidebarActionLink
                  href={`/higher-study/book-consultation?course=${course.slug}`}
                  icon={CalendarCheck}
                  label="Book consultation"
                  description="Free 1:1 with an advisor"
                />
              </SidebarCard>

              <SidebarCard title="Key facts">
                {course.duration && <InfoRow label="Duration" value={course.duration} />}
                {course.studyMode && (
                  <InfoRow label="Mode" value={<span className="capitalize">{course.studyMode}</span>} />
                )}
                {tuition && (
                  <InfoRow label="Tuition" value={<span className="font-semibold text-emerald-700">{tuition}</span>} />
                )}
                {course.intake?.name && <InfoRow label="Intake" value={course.intake.name} />}
                {course.qualification && <InfoRow label="Qualification" value={course.qualification} />}
                {course.specialisation && <InfoRow label="Specialisation" value={course.specialisation} />}
                {subject && <InfoRow label="Subject" value={subject.name} />}
                <InfoRow
                  label="Work exp. required"
                  value={course.workExperienceRequired ? "Yes" : "No"}
                  boolean
                />
                <InfoRow
                  label="Portfolio required"
                  value={course.portfolioRequired ? "Yes" : "No"}
                  boolean
                />
                <InfoRow
                  label="Interview required"
                  value={course.interviewRequired ? "Yes" : "No"}
                  boolean
                />
                <InfoRow
                  label="Scholarship"
                  value={course.scholarshipAvailable ? "Available" : "Not available"}
                  boolean
                />
              </SidebarCard>

              {university && (
                <SidebarCard title="Offered by">
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
                      {country && (
                        <div className="text-[11px] text-ink-500">
                          {country.flagEmoji} {country.name}
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
          {/* Overview */}
          {course.overview && (
            <DetailCard
              title="Course overview"
              icon={FileText}
              description="A summary of the programme, its aims and what students can expect."
            >
              <ProseParagraphs content={course.overview} />
            </DetailCard>
          )}

          {/* Quick facts grid */}
          <DetailCard
            title="At a glance"
            icon={ListChecks}
            description="Duration, mode, tuition and intake at a glance."
          >
            <MetaGrid items={metaItems} />
          </DetailCard>

          {/* Modules */}
          {modules.length > 0 && (
            <DetailCard
              title="Course modules"
              icon={BookOpen}
              description="The modules typically offered on this programme. Optional modules may vary by year."
            >
              {renderModules(modules)}
            </DetailCard>
          )}

          {/* Tuition + other costs */}
          {(tuition || course.otherCosts) && (
            <DetailCard
              title="Tuition fees & other costs"
              icon={DollarSign}
              description="Indicative tuition fee and additional estimated costs."
            >
              {tuition && (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Tuition fee
                  </div>
                  <div className="mt-1 font-display text-xl font-extrabold text-emerald-700">
                    {tuition}
                  </div>
                  <div className="mt-1 text-[11px] text-ink-500">
                    Per academic year · {course.tuitionCurrency}
                  </div>
                </div>
              )}
              {course.otherCosts && (
                <div className="border-t border-ink-100 pt-3">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Other costs
                  </div>
                  <ProseParagraphs content={course.otherCosts} />
                </div>
              )}
            </DetailCard>
          )}

          {/* Scholarship availability */}
          {course.scholarshipAvailable && university && (
            <DetailCard
              title="Scholarship availability"
              icon={Award}
              description="This course is eligible for at least one scholarship. Browse opportunities at this university."
            >
              <p className="text-sm text-ink-700">
                Scholarships are available for this programme. Visit the
                scholarship directory to see funding opportunities at{" "}
                <Link
                  href={`/higher-study/universities/${university.slug}/scholarships`}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {university.officialName}
                </Link>{" "}
                or browse all{" "}
                <Link
                  href="/higher-study/scholarships"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  scholarships
                </Link>
                .
              </p>
            </DetailCard>
          )}

          {/* Academic entry requirements */}
          {(course.academicEntryRequirements || course.countrySpecificRequirements) && (
            <DetailCard
              title="Academic entry requirements"
              icon={GraduationCap}
              description="General academic requirements and country-specific guidance."
            >
              {course.academicEntryRequirements && (
                <div className="mb-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    General requirements
                  </div>
                  <ProseParagraphs content={course.academicEntryRequirements} />
                </div>
              )}
              {course.countrySpecificRequirements && (
                <div className="border-t border-ink-100 pt-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    Country-specific requirements
                  </div>
                  <ProseParagraphs content={course.countrySpecificRequirements} />
                </div>
              )}
            </DetailCard>
          )}

          {/* English requirements */}
          {course.englishRequirements && (
            <DetailCard
              title="English language requirements"
              icon={BookOpen}
              description="Minimum accepted English-test scores for this programme."
            >
              <ProseParagraphs content={course.englishRequirements} />
              <div className="mt-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="flex items-start gap-2">
                  <Languages className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                  <div className="flex-1">
                    <div className="text-xs font-bold uppercase tracking-widest text-blue-700">
                      Need English prep?
                    </div>
                    <p className="mt-1 text-xs text-ink-700">
                      Prepare for IELTS, TOEFL, PTE, Duolingo, GRE &amp; GMAT on
                      the Alaminn.info English Learning platform — free courses,
                      practice tests, 1:1 tutors and study resources.
                    </p>
                    <a
                      href="/english-learning"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                    >
                      Explore English Learning
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            </DetailCard>
          )}

          {/* Other requirements */}
          <DetailCard
            title="Other requirements"
            icon={ClipboardCheck}
            description="Whether this course typically requires work experience, a portfolio or an interview."
          >
            <MetaGrid
              items={[
                {
                  icon: Briefcase,
                  label: "Work experience",
                  value: course.workExperienceRequired ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-ink-500">
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Not required
                    </span>
                  ),
                },
                {
                  icon: FileText,
                  label: "Portfolio",
                  value: course.portfolioRequired ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-ink-500">
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Not required
                    </span>
                  ),
                },
                {
                  icon: Building2,
                  label: "Interview",
                  value: course.interviewRequired ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-ink-500">
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Not required
                    </span>
                  ),
                },
              ]}
            />
          </DetailCard>

          {/* Career outcomes */}
          {course.careerOutcomes && (
            <DetailCard
              title="Career outcomes"
              icon={TrendingUp}
              description="Typical career paths and graduate outcomes for this programme."
            >
              <ProseParagraphs content={course.careerOutcomes} />
            </DetailCard>
          )}

          {/* Placement information */}
          {course.placementInfo && (
            <DetailCard
              title="Placement information"
              icon={Briefcase}
              description="Year-in-industry, internship or placement opportunities."
            >
              <ProseParagraphs content={course.placementInfo} />
            </DetailCard>
          )}

          {/* Research component */}
          {course.researchComponent && (
            <DetailCard
              title="Research component"
              icon={FlaskConical}
              description="Dissertation, thesis or independent research component."
            >
              <ProseParagraphs content={course.researchComponent} />
            </DetailCard>
          )}

          {/* Application deadline */}
          {course.applicationDeadline && (
            <DetailCard
              title="Application deadline"
              icon={CalendarClock}
              description="Typical deadline for this programme. Always confirm with the official source."
            >
              <div className="flex flex-wrap items-center gap-3">
                <DeadlineBadge date={course.applicationDeadline} />
              </div>
              <p className="mt-3 text-xs text-ink-500">
                Note: deadlines may be expressed as a date, month or rolling window.
              </p>
            </DetailCard>
          )}

          {/* Required documents */}
          {requiredDocuments.length > 0 && (
            <DetailCard
              title="Required documents"
              icon={FileText}
              description="Documents typically required when applying to this programme."
            >
              <Checklist items={requiredDocuments} variant="check" />
            </DetailCard>
          )}

          {/* Verification footer */}
          <VerificationFooter
            status={course.verificationStatus}
            lastVerifiedAt={course.lastVerifiedAt}
            sourceUrl={course.officialSourceUrl}
            lastVerifiedBy={course.lastVerifiedBy}
          />

          {/* Related courses */}
          {relatedCourses.length > 0 && (
            <RelatedSection
              title={subject ? `More ${subject.name} courses` : "Related courses"}
              description="Other programmes in the same subject."
              viewAllHref={subject ? `/higher-study/subjects/${subject.slug}` : "/higher-study/courses"}
            >
              {relatedCourses.map((c) => (
                <CourseCard key={c.id} course={c as never} showActions={false} />
              ))}
            </RelatedSection>
          )}
        </DetailLayout>
      </DetailShell>

      <JsonLdScript data={[courseLd, breadcrumbLd]} />
    </>
  );
}

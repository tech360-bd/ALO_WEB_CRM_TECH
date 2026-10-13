/**
 * /higher-study/destinations/[countrySlug]
 * --------------------------------------------------------------------
 * Full country guide: overview, education system, study levels,
 * popular subjects, top universities, tuition range, living costs,
 * major student cities, admission requirements, English requirements,
 * intakes, application deadlines, scholarships, research opportunities,
 * student visa overview, financial evidence, work rights, post-study
 * opportunities, accommodation, healthcare, transport, student safety,
 * cultural info, application process, required documents, FAQ,
 * official sources, last verified date.
 *
 * Sidebar: universities in this country, ALO Education apply link,
 * English Learning link.
 *
 * Generates `staticParams` for SSG (top 30 country slugs from the
 * COUNTRIES_LIST constant).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  Globe2,
  GraduationCap,
  BookOpen,
  Building2,
  DollarSign,
  Home,
  Stethoscope,
  Bus,
  ShieldCheck,
  Sparkles,
  CalendarClock,
  Landmark,
  Briefcase,
  FileText,
  CheckSquare,
  Plane,
  Banknote,
  Languages,
  Send,
  ArrowRight,
  ExternalLink,
  Info,
  AlertCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  COUNTRIES_LIST,
  COUNTRIES_MAP,
  ENGLISH_LEARNING_URL,
} from "@/lib/higher-study/constants";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { UniversityCard } from "@/components/higher-study/university-card";
import { LoadingSkeleton } from "@/components/higher-study/loading-skeleton";
import { EmptyState } from "@/components/higher-study/empty-state";
import {
  PageHero,
  SectionCard,
  ProseSection,
} from "@/components/higher-study/page-hero";
import { ApplyCta } from "@/components/higher-study/apply-cta";
import type { FaqItem } from "@/lib/higher-study/types";

// ── staticParams (SSG) ──────────────────────────────────────────────

export function generateStaticParams() {
  return COUNTRIES_LIST.map((c) => ({ countrySlug: c.slug }));
}

// ── Metadata ────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ countrySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { countrySlug } = await params;
  const country = COUNTRIES_MAP[countrySlug];
  const title = country
    ? `${country.name} — Study Abroad Guide | Higher Study`
    : "Study Abroad Guide | Higher Study";
  const description = country
    ? `Complete study abroad guide for ${country.name}: education system, top universities, tuition ranges, living costs, admission requirements, English tests, intakes, scholarships, student visa, post-study work rights and more. Verified by Alaminn.info.`
    : "Higher Study destination guide.";
  return buildHigherStudyMetadata({
    title,
    description,
    path: `/higher-study/destinations/${countrySlug}`,
    keywords: [
      `study in ${country?.name ?? "abroad"}`,
      `${country?.name ?? ""} universities`,
      `${country?.name ?? ""} student visa`,
      `${country?.name ?? ""} scholarships`,
      "study abroad guide",
    ],
  });
}

// ── Data fetcher ────────────────────────────────────────────────────

async function fetchCountry(countrySlug: string) {
  try {
    const country = await db.higherStudyCountry.findUnique({
      where: { slug: countrySlug },
      include: {
        cities: {
          where: { status: "published" },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            universities: true,
            courses: true,
            scholarships: true,
          },
        },
      },
    });
    return country;
  } catch (e) {
    console.error("[country detail] DB error", e);
    return null;
  }
}

async function fetchTopUniversities(countryId: string) {
  try {
    return await db.higherStudyUniversity.findMany({
      where: {
        countryId,
        publicationStatus: "published",
      },
      orderBy: [{ featured: "desc" }, { lastVerifiedAt: "desc" }],
      take: 6,
      include: {
        country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
        city: { select: { id: true, slug: true, name: true } },
      },
    });
  } catch {
    return [];
  }
}

async function fetchScholarships(countryId: string) {
  try {
    return await db.higherStudyScholarship.findMany({
      where: {
        countryId,
        publicationStatus: "published",
        OR: [
          { deadline: null },
          { deadline: { gte: new Date() } },
        ],
      },
      orderBy: [{ featured: "desc" }, { deadline: "asc" }],
      take: 6,
      include: {
        country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
        university: {
          select: { id: true, slug: true, officialName: true, logoUrl: true },
        },
      },
    });
  } catch {
    return [];
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function parseFaq(raw?: string | null): FaqItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is FaqItem =>
          typeof x === "object" && x !== null &&
          typeof (x as { question?: unknown }).question === "string" &&
          typeof (x as { answer?: unknown }).answer === "string",
      )
      .slice(0, 20);
  } catch {
    return [];
  }
}

function parseList(raw?: string | null, max = 12): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function parseOfficialSources(raw?: string | null): Array<{ label: string; url: string }> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is { label: string; url: string } =>
          typeof x === "object" && x !== null &&
          typeof (x as { url?: unknown }).url === "string" &&
          typeof (x as { label?: unknown }).label === "string",
      )
      .slice(0, 12);
  } catch {
    return [];
  }
}

// ── Page ────────────────────────────────────────────────────────────

export default async function CountryDetailPage({ params }: PageProps) {
  const { countrySlug } = await params;
  const countryRef = COUNTRIES_MAP[countrySlug];
  if (!countryRef) notFound();

  const country = await fetchCountry(countrySlug);
  if (!country || country.status !== "published") {
    // DB row missing — show a "coming soon" page using the constant's data
    return (
      <>
        <HigherStudyBreadcrumb
          items={[
            { label: "Study Destinations", href: "/higher-study/destinations" },
            { label: countryRef.name },
          ]}
          className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
        />
        <PageHero
          eyebrow={`${countryRef.flagEmoji} ${countryRef.region}`}
          title={countryRef.name}
          description={`Our editors are preparing a comprehensive study guide for ${countryRef.name}. In the meantime, browse the universities, scholarships and courses already listed, or start your application via ALO Education.`}
        />
        <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6">
          <EmptyState
            title="Country guide coming soon"
            description={`We're still verifying the official details for ${countryRef.name}. Check back shortly — or contact us if you have specific questions.`}
            icon={Info}
            action={{
              label: "Browse all destinations",
              href: "/higher-study/destinations",
            }}
          />
        </div>
      </>
    );
  }

  const [universities, scholarships] = await Promise.all([
    fetchTopUniversities(country.id),
    fetchScholarships(country.id),
  ]);

  const faqs = parseFaq(country.faq);
  const popularSubjects = parseList(country.popularSubjects);
  const studyLevels = parseList(country.studyLevels);
  const majorCities = parseList(country.majorStudentCities);
  const requiredDocuments = parseList(country.requiredDocuments);
  const applicationDeadlines = parseList(country.applicationDeadlines, 6);
  const officialSources = parseOfficialSources(country.officialSources);

  const lastVerified = country.lastVerifiedAt
    ? new Date(country.lastVerifiedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // JSON-LD: Country + BreadcrumbList + FAQPage
  const countryLd = {
    "@context": "https://schema.org",
    "@type": "Country",
    "@id": `${HIGHER_STUDY_BASE_URL}/higher-study/destinations/${country.slug}#country`,
    name: country.name,
    ...(country.officialName ? { alternateName: country.officialName } : {}),
    url: `${HIGHER_STUDY_BASE_URL}/higher-study/destinations/${country.slug}`,
    ...(country.overview ? { description: country.overview } : {}),
    ...(country.imageUrl ? { image: country.imageUrl } : {}),
  };
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Destinations", url: `${HIGHER_STUDY_BASE_URL}/higher-study/destinations` },
    { name: country.name, url: `${HIGHER_STUDY_BASE_URL}/higher-study/destinations/${country.slug}` },
  ]);
  const faqLd = faqs.length > 0 ? buildFaqJsonLd(faqs) : null;

  const jsonLdObjects = [countryLd, breadcrumbLd];
  if (faqLd) jsonLdObjects.push(faqLd);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[
          { label: "Study Destinations", href: "/higher-study/destinations" },
          { label: country.name },
        ]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow={`${country.flagEmoji ?? ""} ${country.region ?? ""}`}
        title={country.name}
        description={country.overview ?? `Complete study-abroad guide for ${country.name}.`}
        variant="default"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Building2 className="h-4 w-4" />}
            label="Universities"
            value={country._count.universities}
          />
          <StatCard
            icon={<BookOpen className="h-4 w-4" />}
            label="Courses"
            value={country._count.courses}
          />
          <StatCard
            icon={<Sparkles className="h-4 w-4" />}
            label="Scholarships"
            value={country._count.scholarships}
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Tuition / yr"
            value={country.tuitionFeeRange ?? "—"}
            isText
          />
        </div>
      </PageHero>

      <div className="mx-auto grid max-w-[1320px] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="space-y-6">
          {country.overview && (
            <SectionCard title="Overview" icon={<Globe2 className="h-4 w-4" />}>
              <ProseSection content={country.overview} />
            </SectionCard>
          )}

          {country.educationSystem && (
            <SectionCard title="Education system" icon={<GraduationCap className="h-4 w-4" />}>
              <ProseSection content={country.educationSystem} />
            </SectionCard>
          )}

          {studyLevels.length > 0 && (
            <SectionCard title="Study levels" icon={<BookOpen className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {studyLevels.map((lvl) => (
                  <span
                    key={lvl}
                    className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200"
                  >
                    {lvl}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {popularSubjects.length > 0 && (
            <SectionCard title="Popular subjects" icon={<BookOpen className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {popularSubjects.map((s) => (
                  <span
                    key={s}
                    className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Top universities in this country */}
          <SectionCard
            title="Top universities"
            icon={<Building2 className="h-4 w-4" />}
            description="Featured universities across this destination."
            actions={
              <Link
                href={`/higher-study/global-universities?countrySlug=${country.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                View all
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            }
          >
            {universities.length === 0 ? (
              <EmptyState
                title="No universities listed yet"
                description={`We're still verifying universities in ${country.name}. Check back soon.`}
                size="compact"
                icon={Building2}
              />
            ) : (
              <Suspense fallback={<LoadingSkeleton type="university" count={3} />}>
                <div className="grid gap-5 sm:grid-cols-2">
                  {universities.map((u) => (
                    <UniversityCard key={u.id} university={u as never} />
                  ))}
                </div>
              </Suspense>
            )}
          </SectionCard>

          {/* Tuition + living costs */}
          {(country.tuitionFeeRange || country.livingCostRange) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {country.tuitionFeeRange && (
                <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    <DollarSign className="h-3 w-3" aria-hidden="true" />
                    Tuition fee range
                  </p>
                  <p className="mt-2 font-display text-xl font-extrabold text-ink-900">
                    {country.tuitionFeeRange}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">Per academic year, varies by institution.</p>
                </div>
              )}
              {country.livingCostRange && (
                <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    <Home className="h-3 w-3" aria-hidden="true" />
                    Living cost range
                  </p>
                  <p className="mt-2 font-display text-xl font-extrabold text-ink-900">
                    {country.livingCostRange}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">Per year, includes accommodation + food.</p>
                </div>
              )}
            </div>
          )}

          {/* Major student cities */}
          {majorCities.length > 0 && (
            <SectionCard title="Major student cities" icon={<Landmark className="h-4 w-4" />}>
              <div className="grid gap-2 sm:grid-cols-2">
                {majorCities.map((city) => {
                  const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                  return (
                    <Link
                      key={city}
                      href={`/higher-study/destinations/${country.slug}/${citySlug}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 bg-ink-50/40 p-3 transition-colors hover:border-ink-200 hover:bg-white"
                    >
                      <span className="font-semibold text-ink-900">{city}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Admission + English requirements */}
          {(country.admissionRequirements || country.englishRequirements) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {country.admissionRequirements && (
                <SectionCard title="Admission requirements" icon={<CheckSquare className="h-4 w-4" />}>
                  <ProseSection content={country.admissionRequirements} />
                </SectionCard>
              )}
              {country.englishRequirements && (
                <SectionCard title="English requirements" icon={<Languages className="h-4 w-4" />}>
                  <ProseSection content={country.englishRequirements} />
                </SectionCard>
              )}
            </div>
          )}

          {/* Intakes + deadlines */}
          {(country.availableIntakes || applicationDeadlines.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {country.availableIntakes && (
                <SectionCard title="Available intakes" icon={<CalendarClock className="h-4 w-4" />}>
                  <ProseSection content={country.availableIntakes} />
                </SectionCard>
              )}
              {applicationDeadlines.length > 0 && (
                <SectionCard title="Application deadlines" icon={<CalendarClock className="h-4 w-4" />}>
                  <ul className="space-y-1.5">
                    {applicationDeadlines.map((d, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-ink-700">
                        <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden="true" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
            </div>
          )}

          {/* Scholarships available in this country */}
          <SectionCard
            title="Scholarships"
            icon={<Sparkles className="h-4 w-4" />}
            description="Funding opportunities available to international students in this country."
            actions={
              <Link
                href={`/higher-study/scholarships?countrySlug=${country.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                View all
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            }
          >
            {scholarships.length === 0 ? (
              <EmptyState
                title="No scholarships listed"
                description={`We're still verifying scholarships for ${country.name}.`}
                size="compact"
                icon={Sparkles}
              />
            ) : (
              <Suspense fallback={<LoadingSkeleton type="scholarship" count={3} />}>
                <div className="grid gap-5 sm:grid-cols-2">
                  {scholarships.map((s) => (
                    <ScholarshipCardLite key={s.id} scholarship={s as never} />
                  ))}
                </div>
              </Suspense>
            )}
          </SectionCard>

          {/* Research opportunities */}
          {country.researchOpportunities && (
            <SectionCard title="Research opportunities" icon={<GraduationCap className="h-4 w-4" />}>
              <ProseSection content={String(country.researchOpportunities)} />
              <div className="mt-4">
                <Link
                  href={`/higher-study/phd-research?countrySlug=${country.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  Browse PhD &amp; research projects
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </SectionCard>
          )}

          {/* Visa + financial + work rights + post-study */}
          {(country.studentVisaOverview ||
            country.financialEvidence ||
            country.workRights ||
            country.postStudyOpportunities) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {country.studentVisaOverview && (
                <SectionCard title="Student visa overview" icon={<FileText className="h-4 w-4" />}>
                  <ProseSection content={country.studentVisaOverview} />
                </SectionCard>
              )}
              {country.financialEvidence && (
                <SectionCard title="Financial evidence" icon={<Banknote className="h-4 w-4" />}>
                  <ProseSection content={country.financialEvidence} />
                </SectionCard>
              )}
              {country.workRights && (
                <SectionCard title="Work rights" icon={<Briefcase className="h-4 w-4" />}>
                  <ProseSection content={country.workRights} />
                </SectionCard>
              )}
              {country.postStudyOpportunities && (
                <SectionCard title="Post-study opportunities" icon={<Plane className="h-4 w-4" />}>
                  <ProseSection content={country.postStudyOpportunities} />
                </SectionCard>
              )}
            </div>
          )}

          {/* Living: accommodation + healthcare + transport + safety */}
          {(country.accommodation ||
            country.healthcare ||
            country.transport ||
            country.studentSafety) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {country.accommodation && (
                <SectionCard title="Accommodation" icon={<Home className="h-4 w-4" />}>
                  <ProseSection content={country.accommodation} />
                </SectionCard>
              )}
              {country.healthcare && (
                <SectionCard title="Healthcare" icon={<Stethoscope className="h-4 w-4" />}>
                  <ProseSection content={country.healthcare} />
                </SectionCard>
              )}
              {country.transport && (
                <SectionCard title="Transport" icon={<Bus className="h-4 w-4" />}>
                  <ProseSection content={country.transport} />
                </SectionCard>
              )}
              {country.studentSafety && (
                <SectionCard title="Student safety" icon={<ShieldCheck className="h-4 w-4" />}>
                  <ProseSection content={country.studentSafety} />
                </SectionCard>
              )}
            </div>
          )}

          {/* Cultural info */}
          {country.culturalInfo && (
            <SectionCard title="Cultural info" icon={<Sparkles className="h-4 w-4" />}>
              <ProseSection content={country.culturalInfo} />
            </SectionCard>
          )}

          {/* Application process + required documents */}
          {(country.applicationProcess || requiredDocuments.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {country.applicationProcess && (
                <SectionCard title="Application process" icon={<Send className="h-4 w-4" />}>
                  <ProseSection content={country.applicationProcess} />
                </SectionCard>
              )}
              {requiredDocuments.length > 0 && (
                <SectionCard title="Required documents" icon={<FileText className="h-4 w-4" />}>
                  <ul className="space-y-1.5">
                    {requiredDocuments.map((d, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-ink-700">
                        <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
            </div>
          )}

          {/* FAQ */}
          {faqs.length > 0 && (
            <SectionCard title="Frequently asked questions" icon={<Info className="h-4 w-4" />}>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <details
                    key={idx}
                    className="group rounded-xl border border-ink-100 bg-ink-50/40 p-4 [&_summary]:cursor-pointer [&_summary]:list-none"
                  >
                    <summary className="flex items-center justify-between gap-2 font-semibold text-ink-900">
                      {faq.question}
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-ink-400 transition-transform group-open:rotate-90"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-ink-700">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Official sources */}
          {officialSources.length > 0 && (
            <SectionCard title="Official sources" icon={<ExternalLink className="h-4 w-4" />}>
              <ul className="space-y-2">
                {officialSources.map((src, idx) => (
                  <li key={idx}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      {src.label}
                    </a>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Last verified */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-800">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>
                <strong className="font-bold">Last verified:</strong>{" "}
                {lastVerified ?? "Awaiting verification"}
                {country.lastVerifiedBy && (
                  <span> by {country.lastVerifiedBy}</span>
                )}
                .
              </span>
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Always cross-check critical information (visa rules, deadlines,
              tuition fees) with the official source before applying.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-[148px] lg:self-start">
          <SectionCard title="Quick actions" icon={<Send className="h-4 w-4" />}>
            <div className="space-y-2">
              <ApplyCta
                referralType="university-application"
                countrySlug={country.slug}
                label="Apply through ALO Education"
                className="w-full bg-orange-600 text-white shadow-orange hover:bg-orange-700"
              />
              <a
                href={ENGLISH_LEARNING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 transition-all hover:border-blue-200 hover:bg-blue-50"
              >
                <Languages className="h-4 w-4" aria-hidden="true" />
                Prepare for IELTS / PTE / TOEFL
              </a>
              <Link
                href={`/higher-study/eligibility-check?countrySlug=${country.slug}`}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 transition-all hover:border-blue-200 hover:bg-blue-50"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Check eligibility
              </Link>
            </div>
          </SectionCard>

          {universities.length > 0 && (
            <SectionCard
              title="Universities in this country"
              icon={<Building2 className="h-4 w-4" />}
            >
              <ul className="space-y-1.5">
                {universities.slice(0, 6).map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/higher-study/universities/${u.slug}`}
                      className="block rounded-lg px-2 py-1.5 text-sm font-medium text-ink-800 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    >
                      {u.officialName}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/higher-study/global-universities?countrySlug=${country.slug}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                View all universities
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </SectionCard>
          )}

          <SectionCard title="Need help?" icon={<Info className="h-4 w-4" />}>
            <p className="text-sm text-ink-600">
              Have a question about studying in {country.name}? Book a free
              1:1 consultation with our higher-study advisors.
            </p>
            <Link
              href="/higher-study/book-consultation"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-blue hover:bg-blue-700"
            >
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              Book consultation
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

// ── Stat card ───────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  isText,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white/80 p-4 shadow-soft backdrop-blur">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-extrabold text-ink-900">
        {isText ? value : (value as number).toLocaleString()}
      </p>
    </div>
  );
}

// ── Scholarship card lite (avoids circular dep with the full card) ──

function ScholarshipCardLite({ scholarship }: { scholarship: {
  id: string;
  slug: string;
  name: string;
  fundingType?: string | null;
  fundingAmount?: string | null;
  deadline?: Date | null;
  provider?: string | null;
} }) {
  const deadline = scholarship.deadline
    ? new Date(scholarship.deadline).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  return (
    <Link
      href={`/higher-study/scholarships/${scholarship.slug}`}
      className="block rounded-2xl border border-ink-200 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
    >
      <p className="font-display text-sm font-bold text-ink-900">{scholarship.name}</p>
      {scholarship.provider && (
        <p className="mt-0.5 text-xs text-ink-600">{scholarship.provider}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        {scholarship.fundingType && (
          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {scholarship.fundingType.replace(/-/g, " ")}
          </span>
        )}
        {scholarship.fundingAmount && (
          <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-semibold text-blue-700 ring-1 ring-blue-200">
            {scholarship.fundingAmount}
          </span>
        )}
        {deadline && (
          <span className="rounded-md bg-ink-50 px-1.5 py-0.5 font-medium text-ink-600">
            Due {deadline}
          </span>
        )}
      </div>
    </Link>
  );
}

// silence unused-import warnings for icons re-exported but not directly used
void AlertCircle;
void Globe2;

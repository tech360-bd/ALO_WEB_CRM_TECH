/**
 * Higher Study home page — 35 sections per the master prompt §7.
 *
 * Server Component. Fetches data directly from Prisma (all tables in
 * the Higher Study family) and renders 35 sections wrapped by the
 * HigherStudyShell layout. Includes SEO metadata + Organization and
 * FAQPage JSON-LD.
 *
 * Sections are split into async sub-components so each can stream in
 * via its own <Suspense> boundary. This means the hero + nav render
 * instantly and DB-backed sections fill in as their queries complete.
 */
import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  Search,
  Award,
  FlaskConical,
  UserSearch,
  Columns3,
  Bookmark,
  GraduationCap,
  Globe2,
  Calendar,
  Send,
  ShieldCheck,
  Languages,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Mail,
  ListChecks,
  Sparkles,
  Compass,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { UniversityCard } from "@/components/higher-study/university-card";
import { CourseCard } from "@/components/higher-study/course-card";
import { ScholarshipCard } from "@/components/higher-study/scholarship-card";
import { ResearchCard } from "@/components/higher-study/research-card";
import { ResourceCard } from "@/components/higher-study/resource-card";
import { LoadingSkeleton } from "@/components/higher-study/loading-skeleton";
import { EmptyState } from "@/components/higher-study/empty-state";
import { ApplyCta } from "@/components/higher-study/apply-cta";
import { HigherStudyHomeHeroSearch } from "@/components/higher-study/home-hero-search";
import { HomeNewsletterSubscribe } from "@/components/higher-study/home-newsletter-subscribe";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildOrganizationJsonLd,
  buildFaqJsonLd,
  serializeJsonLd,
} from "@/lib/higher-study/seo";
import {
  COUNTRIES_LIST,
  ENGLISH_TESTS,
  ALO_EDUCATION_URL,
  ENGLISH_LEARNING_URL,
} from "@/lib/higher-study/constants";
import type {
  University,
  Course,
  Scholarship,
  ResearchProject,
  Resource,
  StudentStory,
  HigherStudyEvent,
  Subject,
  Intake,
  FaqItem,
} from "@/lib/higher-study/types";
import type { Prisma } from "@prisma/client";

// ─── Metadata ────────────────────────────────────────────────────────

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Higher Study — Universities, Courses, Scholarships & PhD Opportunities",
  description:
    "Verified higher-study intelligence across 30 destinations. Browse universities, courses, scholarships, PhD opportunities and supervisors — with consent-tracked referral handoff to ALO Education for application processing.",
  path: "/higher-study",
  keywords: [
    "higher study",
    "study abroad",
    "international universities",
    "postgraduate scholarships",
    "PhD opportunities",
    "MBA",
    "MSc",
    "MRes",
    "MPhil",
    "university application",
    "ALO Education",
    "study destinations",
    "supervisor finder",
  ],
});

// ─── FAQ (used in section 30 + FAQPage JSON-LD) ──────────────────────

const HOMEPAGE_FAQS: FaqItem[] = [
  {
    question: "Is the Higher Study information on Alaminn.info free?",
    answer:
      "Yes. All verified university, course, scholarship, PhD and supervisor information is free to browse. When you choose to apply, you are transferred to ALO Education, Alaminn.info's official application partner, with full consent tracking.",
  },
  {
    question: "How is the information verified?",
    answer:
      "Every entity has a verification status (draft, pending-review, verified, published, needs-update or archived) and a last-verified timestamp. Where possible, we link to the official source so you can confirm details directly with the university or funding body.",
  },
  {
    question: "What does applying through ALO Education mean?",
    answer:
      "When you click Apply, we create a referral record with only public context (study level, country, programme slug) and transfer you to ALO Education's secure registration page. Your name, email and documents are collected by ALO Education after the transfer, on their own domain.",
  },
  {
    question: "Can I save universities and courses for later?",
    answer:
      "Yes. Use the Save button on any card to bookmark it. Anonymous saves are stored in your browser; if you sign in, they sync to your Alaminn.info account. You can also compare up to 4 entities side-by-side.",
  },
  {
    question: "Do you cover scholarships for international students?",
    answer:
      "Yes — we track 24 funding types including fully-funded, government, university, research-council and named programmes like Chevening, Commonwealth, Erasmus Mundus, Rhodes, Gates Cambridge, Marshall, Fulbright and DAAD.",
  },
  {
    question: "How often is the data updated?",
    answer:
      "Verification timestamps are shown on every entity. We sweep stale records and mark them as 'needs-update' when they pass their review cycle. You can subscribe to the bi-weekly digest for new scholarship and PhD deadlines.",
  },
];

// ─── Page ────────────────────────────────────────────────────────────

export default function HigherStudyHomePage() {
  const orgJsonLd = buildOrganizationJsonLd();
  const faqJsonLd = buildFaqJsonLd(HOMEPAGE_FAQS);

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <HigherStudyBreadcrumb items={[]} />
        </div>
      </div>

      {/* JSON-LD: Organization + FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([orgJsonLd, faqJsonLd]),
        }}
      />

      {/* ─── Section 1: Hero ─────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden bg-ink-950 text-white"
      >
        {/* Ambient gradient background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 18% 0%, rgba(11,99,206,0.55), transparent 45%), radial-gradient(circle at 82% 10%, rgba(242,97,19,0.35), transparent 45%), linear-gradient(180deg, #06162F 0%, #0A1B3A 100%)",
          }}
        />
        {/* Soft top glow accent */}
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle, rgba(242,97,19,0.45), transparent 70%)",
          }}
        />
        {/* Dot-grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-100 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500 node-active" />
              </span>
              Higher Study Hub · Alaminn.info
            </div>

            <h1
              id="hero-heading"
              className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl [text-wrap:balance]"
            >
              Find your path through{" "}
              <span
                className="text-grad-momentum"
                style={{ filter: "drop-shadow(0 2px 16px rgba(242,97,19,0.35))" }}
              >
                international higher study
              </span>
              .
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-blue-100 sm:text-lg">
              Verified universities, courses, scholarships, PhD projects and
              supervisors across 30 study destinations — with consent-tracked
              application handoff to ALO Education.
            </p>

            <div className="mx-auto mt-7 max-w-2xl">
              <HigherStudyHomeHeroSearch />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                className="h-11 gap-2 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-orange transition-all duration-300 hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
              >
                <Link href="/higher-study/apply">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Apply through ALO Education
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 gap-2 rounded-xl border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
              >
                <Link href="/higher-study/destinations">
                  <Globe2 className="h-4 w-4" aria-hidden="true" />
                  Browse destinations
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: "30", label: "Study destinations" },
              { value: "33", label: "Study levels" },
              { value: "24", label: "Funding types" },
              { value: "11", label: "Major scholarship programmes" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center backdrop-blur transition-all duration-300 hover:border-orange-400/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-orange-500/5"
              >
                <div className="font-display text-3xl font-extrabold text-orange-400 transition-transform duration-300 group-hover:scale-105">
                  {stat.value}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-blue-200">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Sections 2–6: Search surfaces ────────────────────────── */}
      <section
        aria-labelledby="search-surfaces-heading"
        className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="mb-8 text-center">
          <div className="eyebrow text-orange-600">Five search surfaces</div>
          <h2
            id="search-surfaces-heading"
            className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl"
          >
            Search across every kind of opportunity
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-600">
            Each surface is built for a specific decision: choosing a
            university, picking a course, finding funding, identifying a PhD
            project, or locating the right supervisor.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Section 2: University search */}
          <SearchSurfaceCard
            href="/higher-study/universities"
            icon={Building2}
            title="University search"
            description="Browse all universities across 30 destinations. Filter by country, institution type, study levels offered and tuition range."
            badge="30 destinations"
          />
          {/* Section 3: Course search */}
          <SearchSurfaceCard
            href="/higher-study/courses"
            icon={Search}
            title="Course finder"
            description="Filter by 33 study levels (foundation → PhD), subject, study mode, tuition, intake and scholarship availability."
            badge="33 study levels"
          />
          {/* Section 4: Scholarship search */}
          <SearchSurfaceCard
            href="/higher-study/scholarships"
            icon={Award}
            title="Scholarship search"
            description="Browse 24 funding types and 11 major named programmes (Chevening, Commonwealth, Erasmus Mundus, Rhodes and more)."
            badge="24 funding types"
          />
          {/* Section 5: PhD & research */}
          <SearchSurfaceCard
            href="/higher-study/research"
            icon={FlaskConical}
            title="PhD &amp; research projects"
            description="Open PhD studentships, postdocs and research fellowships. Filter by funding status, supervisor and research area."
            badge="Funding-status filter"
          />
          {/* Section 6: Supervisor search */}
          <SearchSurfaceCard
            href="/higher-study/supervisors"
            icon={UserSearch}
            title="Supervisor finder"
            description="Find faculty currently accepting research students. Browse by research interest, department or university."
            badge="Accepting now"
          />
          {/* Section 7: Study-level selector */}
          <SearchSurfaceCard
            href="/higher-study/courses"
            icon={GraduationCap}
            title="Study-level selector"
            description="Foundation, undergraduate, postgraduate taught, postgraduate research, professional, or flexible learning — pick your stage."
            badge="5 groups"
          />
        </div>
      </section>

      {/* ─── Section 8: Study destination selector ────────────────── */}
      <section
        aria-labelledby="destinations-heading"
        className="border-y border-ink-100 bg-gradient-to-b from-blue-50/40 to-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="eyebrow text-blue-600">Study destinations</div>
              <h2
                id="destinations-heading"
                className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl"
              >
                30 destinations, grouped by region
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-ink-600">
                Pick a country to see verified universities, courses,
                scholarships, visa requirements, living costs and major
                student cities.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="h-10 gap-1.5 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Link href="/higher-study/destinations">
                <Globe2 className="h-4 w-4" aria-hidden="true" />
                Browse all destinations
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(["Europe", "North America", "Asia-Pacific", "Middle East"] as const).map(
              (region) => {
                const countries = COUNTRIES_LIST.filter((c) => c.region === region);
                return (
                  <Card
                    key={region}
                    className="group gap-3 rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-base font-bold text-ink-900 transition-colors group-hover:text-blue-700">
                        {region}
                      </h3>
                      <Badge
                        variant="outline"
                        className="border-ink-200 bg-ink-50 text-[11px] font-semibold text-ink-600 transition-colors group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700"
                      >
                        {countries.length} countries
                      </Badge>
                    </div>
                    <ul className="space-y-1">
                      {countries.slice(0, 6).map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/higher-study/universities?country=${c.slug}`}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-700 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 hover:pl-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                          >
                            <span className="text-base transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
                              {c.flagEmoji}
                            </span>
                            <span className="font-medium">{c.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {countries.length > 6 && (
                      <Link
                        href={`/higher-study/destinations?region=${encodeURIComponent(region)}`}
                        className="hover-underline mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 transition-colors hover:text-orange-700"
                      >
                        + {countries.length - 6} more in {region}
                        <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    )}
                  </Card>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* ─── Section 9: Featured UK universities ──────────────────── */}
      <HomeSection
        eyebrow="United Kingdom"
        title="Featured UK universities"
        description="Verified institutions across England, Scotland, Wales and Northern Ireland — from Russell Group research-intensive universities to specialist conservatoires."
        viewAllHref="/higher-study/universities/uk"
        viewAllLabel="View all UK universities"
      >
        <Suspense fallback={<LoadingSkeleton type="university" count={3} />}>
          <FeaturedUkUniversities />
        </Suspense>
      </HomeSection>

      {/* ─── Section 10: Featured global universities ─────────────── */}
      <HomeSection
        eyebrow="Global"
        title="Featured global universities"
        description="Verified institutions outside the UK — from US Ivy League and Canadian U15 to Australian Group of Eight and European research universities."
        viewAllHref="/higher-study/universities"
        viewAllLabel="View all global universities"
        tinted
      >
        <Suspense fallback={<LoadingSkeleton type="university" count={3} />}>
          <FeaturedGlobalUniversities />
        </Suspense>
      </HomeSection>

      {/* ─── Section 11: Popular Master's programmes ─────────────── */}
      <HomeSection
        eyebrow="Postgraduate taught"
        title="Popular Master's programmes"
        description="MSc, MA, MBA, LLM and specialist master's across STEM, business, humanities, law and the arts."
        viewAllHref="/higher-study/courses?level=masters"
        viewAllLabel="View all Master's"
      >
        <Suspense fallback={<LoadingSkeleton type="course" count={3} />}>
          <PopularMastersCourses />
        </Suspense>
      </HomeSection>

      {/* ─── Section 12: MBA programmes ──────────────────────────── */}
      <HomeSection
        eyebrow="Business school"
        title="MBA & Executive MBA programmes"
        description="AMBA- and AACSB-accredited MBAs, Executive MBAs and specialist business master's with strong industry placements."
        viewAllHref="/higher-study/courses?level=mba"
        viewAllLabel="View all MBAs"
        tinted
      >
        <Suspense fallback={<LoadingSkeleton type="course" count={3} />}>
          <MbaCourses />
        </Suspense>
      </HomeSection>

      {/* ─── Section 13: MRes and MPhil ──────────────────────────── */}
      <HomeSection
        eyebrow="Research master's"
        title="MRes &amp; MPhil programmes"
        description="Research-led master's degrees — ideal preparation for a PhD or a research career in industry."
        viewAllHref="/higher-study/courses?level=mres"
        viewAllLabel="View all research master's"
      >
        <Suspense fallback={<LoadingSkeleton type="course" count={3} />}>
          <ResearchMasterCourses />
        </Suspense>
      </HomeSection>

      {/* ─── Section 14: Featured PhD ────────────────────────────── */}
      <HomeSection
        eyebrow="PhD &amp; research"
        title="Featured PhD opportunities"
        description="Open PhD studentships, postdoctoral positions and research fellowships across all research areas."
        viewAllHref="/higher-study/research"
        viewAllLabel="View all PhD & research"
        tinted
      >
        <Suspense fallback={<LoadingSkeleton type="research" count={3} />}>
          <FeaturedResearchProjects />
        </Suspense>
      </HomeSection>

      {/* ─── Section 15: Fully funded scholarships ──────────────── */}
      <HomeSection
        eyebrow="Funding"
        title="Fully funded scholarships"
        description="Scholarships covering tuition, living costs and often travel — including Chevening, Commonwealth, Rhodes and Gates Cambridge."
        viewAllHref="/higher-study/scholarships?type=fully-funded"
        viewAllLabel="View all fully-funded scholarships"
      >
        <Suspense fallback={<LoadingSkeleton type="scholarship" count={3} />}>
          <FullyFundedScholarships />
        </Suspense>
      </HomeSection>

      {/* ─── Section 16: Research funding ────────────────────────── */}
      <HomeSection
        eyebrow="Research funding"
        title="Research funding &amp; studentships"
        description="PhD studentships, research assistantships and funded postdoctoral positions — searchable by funding status."
        viewAllHref="/higher-study/research?status=fully-funded"
        viewAllLabel="View funded research"
        tinted
      >
        <Suspense fallback={<LoadingSkeleton type="research" count={3} />}>
          <FundedResearchProjects />
        </Suspense>
      </HomeSection>

      {/* ─── Section 17: Popular subjects ────────────────────────── */}
      <HomeSection
        eyebrow="Subjects"
        title="Popular study subjects"
        description="Browse courses by subject — from STEM and business to humanities, medicine and the arts."
        viewAllHref="/higher-study/courses"
        viewAllLabel="Browse course finder"
      >
        <Suspense fallback={<SubjectChipsSkeleton />}>
          <PopularSubjects />
        </Suspense>
      </HomeSection>

      {/* ─── Section 18: Upcoming intakes ────────────────────────── */}
      <HomeSection
        eyebrow="Intakes"
        title="Upcoming intakes"
        description="Open and upcoming application windows across universities. Apply early — popular courses fill fast."
        viewAllHref="/higher-study/courses"
        viewAllLabel="Browse courses by intake"
        tinted
      >
        <Suspense fallback={<IntakeSkeleton />}>
          <UpcomingIntakes />
        </Suspense>
      </HomeSection>

      {/* ─── Section 19: Latest deadlines ───────────────────────── */}
      <HomeSection
        eyebrow="Deadlines"
        title="Latest application deadlines"
        description="Scholarship and research deadlines within the next 60 days. Subscribe to get alerts before they fire."
        viewAllHref="/higher-study/scholarships"
        viewAllLabel="View all scholarships"
      >
        <Suspense fallback={<LoadingSkeleton type="scholarship" count={3} />}>
          <UpcomingDeadlines />
        </Suspense>
      </HomeSection>

      {/* ─── Sections 20–22: Comparison CTAs ────────────────────── */}
      <section
        aria-labelledby="compare-heading"
        className="border-y border-ink-100 bg-gradient-to-br from-orange-50/60 via-white to-blue-50/60 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="mb-8 text-center">
            <div className="eyebrow text-orange-600">Compare side by side</div>
            <h2
              id="compare-heading"
              className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl"
            >
              Compare up to 4 entities at once
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-600">
              Build a comparison list as you browse — universities, courses
              and scholarships live in separate lists, each capped at 4.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <CompareCtaCard
              href="/higher-study/compare/universities"
              icon={Building2}
              title="University comparison"
              description="Compare tuition ranges, rankings, English requirements, intake availability, research strengths and graduate outcomes."
              sampleHref="/higher-study/universities"
            />
            <CompareCtaCard
              href="/higher-study/compare/courses"
              icon={Search}
              title="Course comparison"
              description="Compare duration, study mode, tuition, scholarship availability and career outcomes across 4 courses."
              sampleHref="/higher-study/courses"
            />
            <CompareCtaCard
              href="/higher-study/compare/scholarships"
              icon={Award}
              title="Scholarship comparison"
              description="Compare funding amounts, eligibility, deadlines, coverage and renewal terms across 4 scholarships."
              sampleHref="/higher-study/scholarships"
            />
          </div>
        </div>
      </section>

      {/* ─── Section 23: Study-abroad process ───────────────────── */}
      <section
        aria-labelledby="process-heading"
        className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="mb-10 text-center">
          <div className="eyebrow text-blue-600">The 6-stage process</div>
          <h2
            id="process-heading"
            className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl"
          >
            How studying abroad actually works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-600">
            From shortlisting universities to enroling on day one — here&apos;s
            what to expect at each stage.
          </p>
        </div>

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STUDY_ABROAD_STEPS.map((step, idx) => (
            <li key={step.title}>
              <Card className="h-full gap-3 rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl grad-intelligence font-display text-base font-extrabold text-white">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <step.icon className="h-5 w-5 text-orange-600" aria-hidden="true" />
                </div>
                <h3 className="font-display text-base font-bold text-ink-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-600">
                  {step.description}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── Section 24: Eligibility checker CTA ─────────────────── */}
      <section
        aria-labelledby="eligibility-heading"
        className="border-y border-ink-100 bg-gradient-to-r from-blue-50/60 to-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="eyebrow text-orange-600">Eligibility checker</div>
              <h2
                id="eligibility-heading"
                className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl"
              >
                Not sure where you qualify?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                Tell us your academic background, English proficiency and
                budget — we&apos;ll match you against verified entry
                requirements across universities and surface the programmes
                you&apos;re most likely to be admitted to.
              </p>
              <ul className="mt-5 space-y-2">
                {[
                  "Cross-checked against each university's published entry requirements",
                  "English-test equivalences (IELTS, PTE, TOEFL, Duolingo, LanguageCert, Oxford ELLT)",
                  "Country-specific requirements and conditional-offer logic",
                  "Free — no signup required to see your matches",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-ink-700"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-11 gap-2 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-orange hover:bg-orange-700"
                >
                  <Link href="/higher-study/eligibility-check">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Check my eligibility
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 gap-2 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Link href="/higher-study/book-consultation">
                    Book a 1:1 consultation
                  </Link>
                </Button>
              </div>
            </div>
            <Card className="rounded-3xl border border-ink-200 bg-white p-6 shadow-soft">
              <div className="space-y-3">
                {[
                  { label: "Academic background", value: "BSc Computer Science, 3.4 GPA" },
                  { label: "English proficiency", value: "IELTS 7.0 (no band below 6.5)" },
                  { label: "Budget (annual)", value: "$25,000 – $40,000 USD" },
                  { label: "Target study level", value: "MSc / Master's" },
                  { label: "Preferred destinations", value: "UK, Ireland, Germany" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 border-b border-ink-100 pb-2 last:border-b-0"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                      {row.label}
                    </span>
                    <span className="text-sm font-medium text-ink-900">
                      {row.value}
                    </span>
                  </div>
                ))}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Match preview
                  </div>
                  <p className="mt-1 text-xs text-emerald-800">
                    12 universities match your profile across UK, Ireland and
                    Germany. 8 offer scholarship-eligible programmes.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Section 25: Application checklist ──────────────────── */}
      <HomeSection
        eyebrow="Plan ahead"
        title="Your study-abroad application checklist"
        description="The documents and milestones every international application needs — print this off and tick items as you go."
        viewAllHref="/higher-study/resources"
        viewAllLabel="Browse study resources"
      >
        <Card className="rounded-2xl border border-ink-200 bg-white p-6 shadow-soft">
          <div className="grid gap-3 sm:grid-cols-2">
            {APPLICATION_CHECKLIST.map((item) => (
              <label
                key={item}
                className="flex items-start gap-2.5 rounded-xl border border-ink-100 p-3 text-sm text-ink-700 hover:bg-blue-50"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" aria-hidden="true" />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="h-10 gap-1.5 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Link href="/higher-study/resources">
                <ListChecks className="h-4 w-4" aria-hidden="true" />
                Download full checklist (PDF)
              </Link>
            </Button>
            <span className="text-xs text-ink-500">
              Updated for the 2026–2027 application cycle.
            </span>
          </div>
        </Card>
      </HomeSection>

      {/* ─── Section 26: English preparation ────────────────────── */}
      <section
        aria-labelledby="english-heading"
        className="border-y border-ink-100 bg-gradient-to-br from-blue-50/60 to-orange-50/40 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="mb-8 text-center">
            <div className="eyebrow text-blue-600">English preparation</div>
            <h2
              id="english-heading"
              className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl"
            >
              Hit your English-test target
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-600">
              Most partner universities accept any of the seven English
              proficiency tests below. Improve your score with adaptive
              English learning on the ALO Education platform.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ENGLISH_TESTS.slice(0, 4).map((test) => (
              <Card
                key={test.slug}
                className="gap-2 rounded-2xl border border-ink-200 bg-white p-5 shadow-soft"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Languages className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-ink-900">
                    {test.name}
                  </h3>
                </div>
                <p className="text-xs text-ink-500">{test.fullForm}</p>
                <div className="mt-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">
                  <span className="font-semibold">Typical req:</span>{" "}
                  {test.typicalRequirement}
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-3xl border border-ink-200 bg-white p-6 text-center shadow-soft sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h3 className="font-display text-base font-extrabold text-ink-900">
                ALO English Learning Platform
              </h3>
              <p className="mt-1 text-sm text-ink-600">
                Adaptive practice for IELTS, PTE, TOEFL, Duolingo and more —
                with mock tests, speaking practice and progress tracking.
              </p>
            </div>
            <Button
              asChild
              className="h-11 gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-blue hover:bg-blue-700"
            >
              <a
                href={ENGLISH_LEARNING_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Languages className="h-4 w-4" aria-hidden="true" />
                Start learning English
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Section 27: Student success stories ────────────────── */}
      <HomeSection
        eyebrow="Student stories"
        title="Stories from students who got there"
        description="Verified journeys from offer to enrolment — including the application strategy that worked and the advice they wish they&apos;d had earlier."
        viewAllHref="/higher-study/resources"
        viewAllLabel="Read more stories"
        tinted
      >
        <Suspense fallback={<StoriesSkeleton />}>
          <StudentStories />
        </Suspense>
      </HomeSection>

      {/* ─── Section 28: Latest study resources ─────────────────── */}
      <HomeSection
        eyebrow="Resources"
        title="Latest study resources &amp; guides"
        description="Long-form guides on SOPs, personal statements, CVs, proposal writing, supervisor outreach, visa preparation and pre-departure planning."
        viewAllHref="/higher-study/resources"
        viewAllLabel="Browse all resources"
      >
        <Suspense fallback={<LoadingSkeleton type="resource" count={3} />}>
          <LatestResources />
        </Suspense>
      </HomeSection>

      {/* ─── Section 29: Events & webinars ──────────────────────── */}
      <HomeSection
        eyebrow="Events &amp; webinars"
        title="Upcoming Higher Study events"
        description="Live application workshops, university spotlight sessions and Q&amp;A panels with current students and supervisors."
        viewAllHref="/higher-study/resources"
        viewAllLabel="View all events"
        tinted
      >
        <Suspense fallback={<EventsSkeleton />}>
          <UpcomingEvents />
        </Suspense>
      </HomeSection>

      {/* ─── Section 30: FAQ ────────────────────────────────────── */}
      <section
        aria-labelledby="faq-heading"
        className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="mb-8 text-center">
          <div className="eyebrow text-orange-600">FAQ</div>
          <h2
            id="faq-heading"
            className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl"
          >
            Higher Study, answered
          </h2>
        </div>

        <div className="space-y-3">
          {HOMEPAGE_FAQS.map((faq, idx) => (
            <details
              key={idx}
              className="group rounded-2xl border border-ink-200 bg-white p-4 shadow-soft open:bg-blue-50/30"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left font-display text-base font-bold text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-2">
                {faq.question}
                <span className="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-200 text-ink-500 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ─── Section 31: ALO Education application support ──────── */}
      <section
        aria-labelledby="alo-heading"
        className="border-y border-ink-100 bg-ink-950 py-16 text-white sm:py-20"
      >
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-100">
                <Send className="h-3 w-3" aria-hidden="true" />
                Application partner
              </div>
              <h2
                id="alo-heading"
                className="mt-4 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl"
              >
                Apply through{" "}
                <span className="text-grad-momentum">ALO Education</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100">
                Alaminn.info surfaces verified information; ALO Education
                handles the application. Your referral is consent-tracked,
                signed with a 24-hour token, and audited end-to-end — so
                your application has a clean chain of custody from research
                to enrolment.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ApplyCta
                  referralType="consultation"
                  label="Start my application"
                  showViaLabel
                  className="h-11 gap-2 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-orange hover:bg-orange-700"
                />
                <Button
                  asChild
                  variant="outline"
                  className="h-11 gap-2 rounded-xl border-white/20 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <a
                    href={ALO_EDUCATION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit ALO Education
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Consent-tracked handoff",
                  body: "Your consent is recorded with timestamp + version before any data leaves Alaminn.info.",
                },
                {
                  icon: Send,
                  title: "Signed 24h token",
                  body: "Every referral carries a HMAC-signed token valid for 24 hours, so both platforms can verify authenticity.",
                },
                {
                  icon: CheckCircle2,
                  title: "No PII in URLs",
                  body: "Only public context (study level, country, programme slug) is shared. ALO Education collects your details on their secure domain.",
                },
                {
                  icon: Mail,
                  title: "Audited end-to-end",
                  body: "Every referral has a status: created → transferred → completed. You can see yours in your Saved Items.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">
                    <card.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-white">
                      {card.title}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-blue-200">
                      {card.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 32: Book a consultation ────────────────────── */}
      <section
        aria-labelledby="consult-heading"
        className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20"
      >
        <Card className="overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-soft">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grad-intelligence p-8 text-white sm:p-10">
              <div className="eyebrow text-orange-300">1:1 consultation</div>
              <h2
                id="consult-heading"
                className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl"
              >
                Book a free 30-minute consultation
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-blue-100">
                Talk through your study plans with an Alaminn.info advisor.
                We&apos;ll review your shortlist, sanity-check your
                eligibility, and refer you to ALO Education only if it&apos;s
                the right next step.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "30 minutes, video or phone",
                  "No obligation — no sales pressure",
                  "Available in English and Bengali",
                  "Evening slots for South-Asian time zones",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-blue-100">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10">
              <div className="space-y-3">
                {[
                  { label: "Duration", value: "30 minutes" },
                  { label: "Format", value: "Video call or phone" },
                  { label: "Cost", value: "Free" },
                  { label: "Languages", value: "English, Bengali" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 border-b border-ink-100 pb-2"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                      {row.label}
                    </span>
                    <span className="text-sm font-medium text-ink-900">
                      {row.value}
                    </span>
                  </div>
                ))}
                <div className="pt-3">
                  <Button
                    asChild
                    className="h-11 w-full gap-2 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-orange hover:bg-orange-700"
                  >
                    <Link href="/higher-study/book-consultation">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      Book a consultation
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ─── Section 33: Trust & verification ───────────────────── */}
      <section
        aria-labelledby="trust-heading"
        className="border-y border-ink-100 bg-gradient-to-b from-white to-blue-50/40 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="mb-8 text-center">
            <div className="eyebrow text-emerald-600">Trust &amp; verification</div>
            <h2
              id="trust-heading"
              className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl"
            >
              Every record has an evidence chain
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-600">
              We don&apos;t publish unverified metrics. Every entity carries
              a verification status, a last-verified timestamp, and (where
              possible) a link to the official source.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Verification lifecycle",
                body: "Each entity moves through draft → pending-review → verified → published. Stale records are flagged 'needs-update' and re-reviewed before they're republished.",
              },
              {
                icon: ExternalLink,
                title: "Source-of-truth links",
                body: "Where the university or funding body publishes the data themselves, we link to their page directly — so you can confirm details at the source.",
              },
              {
                icon: Clock,
                title: "Last-verified timestamps",
                body: "Every card shows when the record was last verified. Records older than their review cycle are marked visually before you act on them.",
              },
            ].map((card) => (
              <Card
                key={card.title}
                className="gap-3 rounded-2xl border border-ink-200 bg-white p-6 shadow-soft"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <card.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-display text-base font-bold text-ink-900">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-600">
                  {card.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 34: Privacy & consent notice ───────────────── */}
      <section
        aria-labelledby="privacy-heading"
        className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20"
      >
        <Card className="rounded-3xl border border-ink-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="eyebrow text-blue-600">Privacy &amp; consent</div>
              <h2
                id="privacy-heading"
                className="mt-1 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl"
              >
                How your data is handled
              </h2>
            </div>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-700">
            <p>
              Alaminn.info collects only the data needed to operate the
              Higher Study platform. Anonymous browsing — looking at
              universities, courses and scholarships — is fully anonymous:
              we use privacy-friendly, cookie-less analytics that respect
              Do Not Track.
            </p>
            <p>
              When you save an item, build a comparison, or subscribe to a
              deadline alert, that data is stored either in your browser
              (anonymous) or in your account (when signed in). When you
              click <strong>Apply</strong>, a referral record is created
              with only public context (study level, country, programme
              slug), signed with a 24-hour token, and the destination URL
              never contains your name, email, phone or any other PII.
            </p>
            <p>
              ALO Education collects your personal information on their own
              secure domain after the transfer, under their own privacy
              policy. Read our full{" "}
              <a
                href="/legal/privacy"
                className="font-semibold text-blue-700 hover:underline"
              >
                privacy policy
              </a>{" "}
              and{" "}
              <a
                href="/legal/terms"
                className="font-semibold text-blue-700 hover:underline"
              >
                terms of service
              </a>
              .
            </p>
          </div>
        </Card>
      </section>

      {/* ─── Section 35: Newsletter / deadline-alert subscription ─ */}
      <section
        aria-labelledby="newsletter-heading"
        className="mx-auto max-w-[1320px] px-4 pb-20 sm:px-6"
      >
        <HomeNewsletterSubscribe />
      </section>
    </>
  );
}

// ─── HomeSection wrapper ─────────────────────────────────────────────

interface HomeSectionProps {
  eyebrow: string;
  title: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  tinted?: boolean;
  children: React.ReactNode;
}

function HomeSection({
  eyebrow,
  title,
  description,
  viewAllHref,
  viewAllLabel = "View all",
  tinted = false,
  children,
}: HomeSectionProps) {
  return (
    <section
      className={
        tinted
          ? "border-y border-ink-100 bg-gradient-to-b from-white to-blue-50/40 py-16 sm:py-20"
          : "py-16 sm:py-20"
      }
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="eyebrow text-orange-600">{eyebrow}</div>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              <span dangerouslySetInnerHTML={{ __html: title }} />
            </h2>
            {description && (
              <p
                className="mt-2 max-w-2xl text-sm text-ink-600"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </div>
          {viewAllHref && (
            <Button
              asChild
              variant="outline"
              className="h-10 gap-1.5 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Link href={viewAllHref}>
                {viewAllLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

// ─── Search surface card (sections 2-7) ──────────────────────────────

interface SearchSurfaceCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

function SearchSurfaceCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
}: SearchSurfaceCardProps) {
  return (
    <Card className="group relative gap-3 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10">
      {/* Soft hover glow background */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/0 blur-2xl transition-all duration-500 group-hover:bg-blue-200/40"
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl grad-intelligence text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        {badge && (
          <Badge
            variant="outline"
            className="border-orange-200 bg-orange-50 text-[10px] font-semibold uppercase tracking-wider text-orange-700 transition-colors group-hover:border-orange-300 group-hover:bg-orange-100"
          >
            {badge}
          </Badge>
        )}
      </div>
      <h3 className="relative font-display text-base font-bold text-ink-900 transition-colors group-hover:text-blue-700">
        <Link href={href} className="hover-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:rounded">
          {title}
        </Link>
      </h3>
      <p className="relative text-sm leading-relaxed text-ink-600">{description}</p>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="relative mt-1 h-8 gap-1 self-start px-2 text-blue-700 transition-colors hover:bg-blue-50 hover:gap-2"
      >
        <Link href={href}>
          Explore
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </Button>
    </Card>
  );
}

// ─── Compare CTA card (sections 20-22) ───────────────────────────────

interface CompareCtaCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  sampleHref?: string;
}

function CompareCtaCard({
  href,
  icon: Icon,
  title,
  description,
  sampleHref,
}: CompareCtaCardProps) {
  return (
    <Card className="group gap-3 rounded-2xl border border-ink-200 bg-white p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl grad-momentum text-white shadow-orange">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="font-display text-lg font-extrabold text-ink-900">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-ink-600">{description}</p>
      <div className="mt-2 flex items-center gap-2">
        <Button
          asChild
          className="h-10 gap-1.5 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white shadow-orange hover:bg-orange-700"
        >
          <Link href={href}>
            <Columns3 className="h-4 w-4" aria-hidden="true" />
            Compare now
          </Link>
        </Button>
        {sampleHref && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-10 gap-1 px-3 text-blue-700 hover:bg-blue-50"
          >
            <Link href={sampleHref}>
              Add items
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}

// ─── Static content (study-abroad steps + checklist) ─────────────────

const STUDY_ABROAD_STEPS: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Research",
    description: "Shortlist destinations, universities and programmes using verified entry requirements and tuition ranges.",
    icon: Compass,
  },
  {
    title: "Shortlist",
    description: "Narrow to 5–8 universities across safe / match / ambitious tiers. Save and compare them on Alaminn.info.",
    icon: Bookmark,
  },
  {
    title: "Apply",
    description: "Prepare SOP, CV, references and transcripts. Apply directly or via ALO Education with consent-tracked referral.",
    icon: Send,
  },
  {
    title: "Offer",
    description: "Receive conditional or unconditional offers. Compare scholarship offers and accept your best fit.",
    icon: Trophy,
  },
  {
    title: "Visa",
    description: "Apply for your student visa with CAS/COE, financial evidence and biometrics. Book early — slots fill up.",
    icon: ShieldCheck,
  },
  {
    title: "Enrol",
    description: "Pre-departure briefing, accommodation confirmation, travel and enrolment on day one. Welcome abroad.",
    icon: GraduationCap,
  },
];

const APPLICATION_CHECKLIST: string[] = [
  "Valid passport (6+ months validity)",
  "Academic transcripts (attested)",
  "Degree certificates or provisional letters",
  "English proficiency test score report",
  "Statement of Purpose (SOP)",
  "Personal statement (if required)",
  "2–3 letters of recommendation",
  "CV / resume (academic format)",
  "Portfolio (for arts / design programmes)",
  "Proof of funds / bank statement",
  "Passport-size photographs (recent)",
  "Application fee payment receipt",
];

// ─── Async data-fetching section components ──────────────────────────

const PUBLISHED_FILTER = { publicationStatus: "published" } as const;
const UNIVERSITY_INCLUDE = {
  country: true,
  city: true,
} satisfies Prisma.HigherStudyUniversitySelect;

async function FeaturedUkUniversities() {
  let universities: University[] = [];
  let ukExists = true;
  try {
    const uk = await db.higherStudyCountry.findUnique({
      where: { slug: "uk" },
      select: { id: true },
    });
    if (!uk) {
      ukExists = false;
    } else {
      universities = (await db.higherStudyUniversity.findMany({
        where: {
          ...PUBLISHED_FILTER,
          countryId: uk.id,
          featured: true,
        },
        include: UNIVERSITY_INCLUDE,
        take: 6,
        orderBy: { updatedAt: "desc" },
      })) as unknown as University[];
    }
  } catch {
    // ignore — fall through to empty state
  }
  if (!ukExists) {
    return (
      <EmptyState
        title="No UK universities yet"
        description="United Kingdom universities will appear here once verified."
        size="compact"
      />
    );
  }
  if (universities.length === 0) {
    return (
      <EmptyState
        title="No featured UK universities yet"
        description="Featured UK universities will appear here once verified and flagged."
        size="compact"
      />
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {universities.map((u) => (
        <UniversityCard key={u.id} university={u} />
      ))}
    </div>
  );
}

async function FeaturedGlobalUniversities() {
  let universities: University[] = [];
  try {
    const uk = await db.higherStudyCountry.findUnique({
      where: { slug: "uk" },
      select: { id: true },
    });
    universities = (await db.higherStudyUniversity.findMany({
      where: {
        ...PUBLISHED_FILTER,
        featured: true,
        ...(uk ? { NOT: { countryId: uk.id } } : {}),
      },
      include: UNIVERSITY_INCLUDE,
      take: 6,
      orderBy: { updatedAt: "desc" },
    })) as unknown as University[];
  } catch {
    // ignore
  }
  if (universities.length === 0) {
    return (
      <EmptyState
        title="No featured global universities yet"
        description="Featured universities outside the UK will appear here once verified."
        size="compact"
      />
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {universities.map((u) => (
        <UniversityCard key={u.id} university={u} />
      ))}
    </div>
  );
}

const COURSE_INCLUDE = {
  university: { include: { country: true } },
  country: true,
  intake: true,
} satisfies Prisma.HigherStudyCourseSelect;

async function PopularMastersCourses() {
  let courses: Course[] = [];
  try {
    courses = (await db.higherStudyCourse.findMany({
      where: {
        ...PUBLISHED_FILTER,
        studyLevel: { in: ["masters", "msc", "ma"] },
      },
      include: COURSE_INCLUDE,
      take: 6,
      orderBy: { updatedAt: "desc" },
    })) as unknown as Course[];
  } catch {
    // ignore
  }
  if (courses.length === 0) {
    return (
      <EmptyState
        title="No Master's programmes listed yet"
        description="Verified MSc, MA and Master's courses will appear here once published."
        size="compact"
        action={{ label: "Browse course finder", href: "/higher-study/courses" }}
      />
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </div>
  );
}

async function MbaCourses() {
  let courses: Course[] = [];
  try {
    courses = (await db.higherStudyCourse.findMany({
      where: {
        ...PUBLISHED_FILTER,
        studyLevel: { in: ["mba", "executive-mba"] },
      },
      include: COURSE_INCLUDE,
      take: 4,
      orderBy: { updatedAt: "desc" },
    })) as unknown as Course[];
  } catch {
    // ignore
  }
  if (courses.length === 0) {
    return (
      <EmptyState
        title="No MBA programmes listed yet"
        description="MBA and Executive MBA courses will appear here once published."
        size="compact"
      />
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {courses.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </div>
  );
}

async function ResearchMasterCourses() {
  let courses: Course[] = [];
  try {
    courses = (await db.higherStudyCourse.findMany({
      where: {
        ...PUBLISHED_FILTER,
        studyLevel: { in: ["mres", "mphil"] },
      },
      include: COURSE_INCLUDE,
      take: 4,
      orderBy: { updatedAt: "desc" },
    })) as unknown as Course[];
  } catch {
    // ignore
  }
  if (courses.length === 0) {
    return (
      <EmptyState
        title="No MRes / MPhil programmes listed yet"
        description="Research-master's programmes will appear here once published."
        size="compact"
      />
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {courses.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </div>
  );
}

const RESEARCH_INCLUDE = {
  university: { include: { country: true } },
  supervisor: true,
  researchArea: true,
} satisfies Prisma.HigherStudyResearchProjectSelect;

async function FeaturedResearchProjects() {
  let projects: ResearchProject[] = [];
  try {
    projects = (await db.higherStudyResearchProject.findMany({
      where: { ...PUBLISHED_FILTER, featured: true },
      include: RESEARCH_INCLUDE,
      take: 6,
      orderBy: { updatedAt: "desc" },
    })) as unknown as ResearchProject[];
  } catch {
    // ignore
  }
  if (projects.length === 0) {
    return (
      <EmptyState
        title="No featured PhD projects yet"
        description="Featured research projects will appear here once verified."
        size="compact"
        action={{ label: "Browse all research", href: "/higher-study/research" }}
      />
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <ResearchCard key={p.id} research={p} />
      ))}
    </div>
  );
}

async function FundedResearchProjects() {
  let projects: ResearchProject[] = [];
  try {
    projects = (await db.higherStudyResearchProject.findMany({
      where: {
        ...PUBLISHED_FILTER,
        fundingStatus: { in: ["fully-funded", "studentship"] },
      },
      include: RESEARCH_INCLUDE,
      take: 6,
      orderBy: { updatedAt: "desc" },
    })) as unknown as ResearchProject[];
  } catch {
    // ignore
  }
  if (projects.length === 0) {
    return (
      <EmptyState
        title="No funded research projects yet"
        description="Fully-funded PhD studentships and postdocs will appear here once verified."
        size="compact"
        action={{ label: "Browse all research", href: "/higher-study/research" }}
      />
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <ResearchCard key={p.id} research={p} />
      ))}
    </div>
  );
}

const SCHOLARSHIP_INCLUDE = {
  country: true,
  university: true,
} satisfies Prisma.HigherStudyScholarshipSelect;

async function FullyFundedScholarships() {
  let scholarships: Scholarship[] = [];
  try {
    scholarships = (await db.higherStudyScholarship.findMany({
      where: {
        ...PUBLISHED_FILTER,
        fundingType: "fully-funded",
      },
      include: SCHOLARSHIP_INCLUDE,
      take: 6,
      orderBy: { deadline: "asc" },
    })) as unknown as Scholarship[];
  } catch {
    // ignore
  }
  if (scholarships.length === 0) {
    return (
      <EmptyState
        title="No fully-funded scholarships listed yet"
        description="Verified fully-funded scholarships will appear here once published."
        size="compact"
        action={{ label: "Browse all scholarships", href: "/higher-study/scholarships" }}
      />
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {scholarships.map((s) => (
        <ScholarshipCard key={s.id} scholarship={s} />
      ))}
    </div>
  );
}

async function PopularSubjects() {
  let subjects: Subject[] = [];
  try {
    subjects = (await db.higherStudySubject.findMany({
      take: 12,
      orderBy: { name: "asc" },
    })) as unknown as Subject[];
  } catch {
    // ignore
  }
  if (subjects.length === 0) {
    return (
      <EmptyState
        title="No subjects tagged yet"
        description="Subject taxonomy will populate here as courses are verified."
        size="compact"
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {subjects.map((subject) => (
        <Link
          key={subject.id}
          href={`/higher-study/courses?subject=${subject.slug}`}
          className="group flex flex-col gap-1 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-ink-900">
              {subject.name}
            </h3>
            <ArrowRight
              className="h-3.5 w-3.5 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-600"
              aria-hidden="true"
            />
          </div>
          {subject.category && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
              {subject.category}
            </span>
          )}
          {subject.description && (
            <p className="mt-1 line-clamp-2 text-xs text-ink-600">
              {subject.description}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

async function UpcomingIntakes() {
  let intakes: Intake[] = [];
  try {
    intakes = (await db.higherStudyIntake.findMany({
      where: { status: "open" },
      take: 6,
      orderBy: { applicationDeadline: "asc" },
    })) as unknown as Intake[];
  } catch {
    // ignore
  }
  if (intakes.length === 0) {
    return (
      <EmptyState
        title="No open intakes listed yet"
        description="Open application windows will appear here as intakes are verified."
        size="compact"
      />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {intakes.map((intake) => (
        <Card
          key={intake.id}
          className="gap-3 rounded-2xl border border-ink-200 bg-white p-5 shadow-soft"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-ink-900">
              {intake.name}
            </h3>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Open
            </Badge>
          </div>
          <div className="space-y-1.5 text-xs text-ink-600">
            {intake.startDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-ink-400" aria-hidden="true" />
                Starts{" "}
                {new Date(intake.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}
            {intake.applicationDeadline && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-ink-400" aria-hidden="true" />
                Apply by{" "}
                {new Date(intake.applicationDeadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="mt-1 h-9 gap-1 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Link href={`/higher-study/courses?intake=${intake.slug}`}>
              Find courses
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </Card>
      ))}
    </div>
  );
}

async function UpcomingDeadlines() {
  let scholarships: Scholarship[] = [];
  let projects: ResearchProject[] = [];
  try {
    const now = new Date();
    const sixtyDaysLater = new Date(
      now.getTime() + 60 * 24 * 60 * 60 * 1000,
    );
    [scholarships, projects] = await Promise.all([
      db.higherStudyScholarship.findMany({
        where: {
          ...PUBLISHED_FILTER,
          deadline: { gte: now, lte: sixtyDaysLater },
        },
        include: SCHOLARSHIP_INCLUDE,
        take: 4,
        orderBy: { deadline: "asc" },
      }) as unknown as Promise<Scholarship[]>,
      db.higherStudyResearchProject.findMany({
        where: {
          ...PUBLISHED_FILTER,
          applicationDeadline: {
            gte: now.toISOString(),
            lte: sixtyDaysLater.toISOString(),
          },
        },
        include: RESEARCH_INCLUDE,
        take: 4,
        orderBy: { applicationDeadline: "asc" },
      }) as unknown as Promise<ResearchProject[]>,
    ]);
  } catch {
    // ignore
  }
  if (scholarships.length === 0 && projects.length === 0) {
    return (
      <EmptyState
        title="No deadlines in the next 60 days"
        description="Upcoming scholarship and research deadlines will appear here as they're verified."
        size="compact"
      />
    );
  }
  // Merge + sort by deadline (mix of scholarship.deadline Date and research.applicationDeadline string).
  type DeadlineItem =
    | { kind: "scholarship"; deadline: Date; node: Scholarship }
    | { kind: "research"; deadline: Date; node: ResearchProject };
  const merged: DeadlineItem[] = [
    ...scholarships.map((s) => ({
      kind: "scholarship" as const,
      deadline: s.deadline ?? new Date(8640000000000000),
      node: s,
    })),
    ...projects.map((p) => ({
      kind: "research" as const,
      deadline: p.applicationDeadline
        ? new Date(p.applicationDeadline)
        : new Date(8640000000000000),
      node: p,
    })),
  ].sort((a, b) => a.deadline.getTime() - b.deadline.getTime()).slice(0, 8);

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {merged.map((item) =>
        item.kind === "scholarship" ? (
          <ScholarshipCard key={`s-${item.node.id}`} scholarship={item.node} />
        ) : (
          <ResearchCard key={`r-${item.node.id}`} research={item.node} />
        ),
      )}
    </div>
  );
}

async function StudentStories() {
  let stories: StudentStory[] = [];
  try {
    stories = (await db.higherStudyStudentStory.findMany({
      where: { featured: true },
      take: 3,
      orderBy: { publishedAt: "desc" },
    })) as unknown as StudentStory[];
  } catch {
    // ignore
  }
  if (stories.length === 0) {
    return (
      <EmptyState
        title="No student stories published yet"
        description="Featured student stories will appear here once verified."
        size="compact"
      />
    );
  }
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {stories.map((story) => (
        <Card
          key={story.id}
          className="gap-3 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft"
        >
          {story.imageUrl && (
            <img
              src={story.imageUrl}
              alt={`${story.studentName} — student story`}
              className="aspect-[3/2] w-full rounded-xl object-cover"
              loading="lazy"
            />
          )}
          <div>
            <div className="eyebrow text-orange-600">
              {story.country ?? "Student story"}
            </div>
            <h3 className="mt-1 font-display text-base font-bold text-ink-900">
              {story.studentName}
            </h3>
            {story.universityName && (
              <p className="text-xs text-ink-600">{story.universityName}</p>
            )}
            {story.courseName && (
              <p className="text-xs text-ink-500">{story.courseName}</p>
            )}
          </div>
          {story.story && (
            <p className="line-clamp-3 text-sm leading-relaxed text-ink-700">
              &ldquo;{story.story}&rdquo;
            </p>
          )}
          {story.advice && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 text-xs italic text-blue-900">
              Advice: {story.advice}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

async function LatestResources() {
  let resources: Resource[] = [];
  try {
    resources = (await db.higherStudyResource.findMany({
      where: { ...PUBLISHED_FILTER, featured: true },
      take: 6,
      orderBy: { publishedAt: "desc" },
    })) as unknown as Resource[];
  } catch {
    // ignore
  }
  if (resources.length === 0) {
    return (
      <EmptyState
        title="No resources published yet"
        description="Verified study resources and guides will appear here."
        size="compact"
      />
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((r) => (
        <ResourceCard key={r.id} resource={r} />
      ))}
    </div>
  );
}

async function UpcomingEvents() {
  let events: HigherStudyEvent[] = [];
  try {
    events = (await db.higherStudyEvent.findMany({
      where: { status: "upcoming", eventDate: { gte: new Date() } },
      take: 3,
      orderBy: { eventDate: "asc" },
    })) as unknown as HigherStudyEvent[];
  } catch {
    // ignore
  }
  if (events.length === 0) {
    return (
      <EmptyState
        title="No upcoming events"
        description="Higher Study webinars and workshops will appear here as they're scheduled."
        size="compact"
      />
    );
  }
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {events.map((event) => (
        <Card
          key={event.id}
          className="gap-3 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft"
        >
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={`${event.title} event banner`}
              className="aspect-[3/2] w-full rounded-xl object-cover"
              loading="lazy"
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="border-orange-200 bg-orange-50 text-[11px] font-semibold text-orange-700"
            >
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {new Date(event.eventDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Badge>
            {event.location && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {event.location}
              </span>
            )}
          </div>
          <h3 className="font-display text-base font-bold text-ink-900">
            {event.title}
          </h3>
          {event.description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-ink-600">
              {event.description}
            </p>
          )}
          {event.registrationUrl && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="mt-1 h-9 gap-1 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Register
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── Skeletons for non-card sections ─────────────────────────────────

function SubjectChipsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: 8 }).map((_, idx) => (
        <Skeleton key={idx} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}

function IntakeSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }).map((_, idx) => (
        <Skeleton key={idx} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}

function StoriesSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }).map((_, idx) => (
        <Skeleton key={idx} className="h-72 rounded-2xl" />
      ))}
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }).map((_, idx) => (
        <Skeleton key={idx} className="h-72 rounded-2xl" />
      ))}
    </div>
  );
}

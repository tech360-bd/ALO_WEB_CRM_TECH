/**
 * English Learning home page — at least 12 sections.
 *
 * Server Component. Fetches featured courses, popular practice tests,
 * top tutors, free resources, course-level overview, and renders the
 * hero + 11 supporting sections + JSON-LD (Organization + FAQPage).
 */
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  GraduationCap,
  ClipboardCheck,
  UserSearch,
  BookOpen,
  Send,
  ShieldCheck,
  Trophy,
  Sparkles,
  ExternalLink,
  CalendarPlus,
  ListChecks,
  ArrowLeftRight,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import {
  buildEnglishLearningMetadata,
  buildOrganizationJsonLd,
  buildFaqJsonLd,
  serializeJsonLd,
} from "@/lib/english-learning/seo";
import {
  COURSE_LEVELS,
  TEST_TYPES,
  HOMEPAGE_FAQS,
  HIGHER_STUDY_URL,
  ALO_EDUCATION_URL,
} from "@/lib/english-learning/constants";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { CourseCard } from "@/components/english-learning/course-card";
import { PracticeTestCard } from "@/components/english-learning/practice-test-card";
import { TutorCard } from "@/components/english-learning/tutor-card";
import { ResourceCard } from "@/components/english-learning/resource-card";
import { HomeHeroSearch } from "@/components/english-learning/home-hero-search";
import { NewsletterSubscribe } from "@/components/english-learning/newsletter-subscribe";
import { ReferralCta } from "@/components/english-learning/referral-cta";

export const metadata: Metadata = buildEnglishLearningMetadata({
  title: "English Learning — IELTS, TOEFL, PTE, Duolingo, GRE & GMAT Prep",
  description:
    "Prepare for IELTS, TOEFL, PTE, Duolingo, GRE and GMAT with verified courses, practice tests, 1:1 tutors and study resources. Referral handoff to ALO Education for paid packages.",
  path: "/english-learning",
  keywords: [
    "english learning",
    "IELTS",
    "TOEFL",
    "PTE",
    "Duolingo English Test",
    "GRE verbal",
    "GMAT verbal",
    "english courses",
    "english tutors",
    "english practice tests",
  ],
});

export const dynamic = "force-dynamic";

async function fetchHomeData() {
  const [courses, tests, tutors, resources] = await Promise.all([
    db.englishLearningCourse.findMany({
      where: { isPublished: true, isFeatured: true },
      take: 6,
      orderBy: { enrollmentCount: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        level: true,
        durationWeeks: true,
        hoursPerWeek: true,
        priceUsd: true,
        currency: true,
        isFeatured: true,
        enrollmentCount: true,
        _count: { select: { lessons: true } },
      },
    }),
    db.englishLearningPracticeTest.findMany({
      where: { isPublished: true, isFeatured: true },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        testType: true,
        level: true,
        durationMinutes: true,
        totalQuestions: true,
        passingScore: true,
        isFeatured: true,
        _count: { select: { questions: true } },
      },
    }),
    db.englishLearningTutor.findMany({
      where: { isPublished: true, isAvailable: true },
      take: 4,
      orderBy: { rating: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        bio: true,
        avatarUrl: true,
        specialties: true,
        qualifications: true,
        yearsExperience: true,
        hourlyRateUsd: true,
        currency: true,
        rating: true,
        reviewCount: true,
        isAvailable: true,
        isPublished: true,
      },
    }),
    db.englishLearningResource.findMany({
      where: { isPublished: true, isFeatured: true },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        resourceType: true,
        url: true,
        durationMinutes: true,
        readingTimeMinutes: true,
        level: true,
        isFeatured: true,
        authorName: true,
        sourceName: true,
      },
    }),
  ]);

  return { courses, tests, tutors, resources };
}

export default async function EnglishLearningHomePage() {
  const data = await fetchHomeData();
  const orgJsonLd = buildOrganizationJsonLd();
  const faqJsonLd = buildFaqJsonLd(HOMEPAGE_FAQS);

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb items={[]} />
        </div>
      </div>

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
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 18% 0%, rgba(192,38,211,0.55), transparent 45%), radial-gradient(circle at 82% 10%, rgba(242,97,19,0.35), transparent 45%), linear-gradient(180deg, #1A0B2E 0%, #0A1B3A 100%)",
          }}
        />
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
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-purple-100 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
              </span>
              English Learning · Powered by Alaminn.info
            </div>

            <h1
              id="hero-heading"
              className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            >
              Master English for{" "}
              <span className="bg-gradient-to-r from-purple-300 via-orange-300 to-amber-300 bg-clip-text text-transparent">
                IELTS, TOEFL, PTE
              </span>{" "}
              &amp; beyond
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base text-blue-100/90 sm:text-lg">
              Verified prep courses, full-length practice tests, 1:1 tutors and
              study resources — all free to browse. When you&apos;re ready to
              apply, we hand you off to ALO Education with consent tracking.
            </p>

            <div className="mt-8">
              <HomeHeroSearch />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                className="gap-1.5 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-orange hover:bg-orange-700"
              >
                <Link href="/english-learning/courses">
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                  Browse Courses
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="gap-1.5 rounded-xl border-white/20 bg-white/5 px-5 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
              >
                <Link href="/english-learning/practice-tests">
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  Take a Practice Test
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="gap-1.5 rounded-xl px-5 text-sm font-semibold text-purple-100 hover:bg-white/5 hover:text-white"
              >
                <Link href="/english-learning/eligibility-check">
                  <ListChecks className="h-4 w-4" aria-hidden="true" />
                  Check My Level
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 2: Stats strip ──────────────────────────────── */}
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6">
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <StatCard
              icon={GraduationCap}
              value="9"
              label="Course levels"
              color="text-blue-600"
            />
            <StatCard
              icon={ClipboardCheck}
              value="12"
              label="Test types"
              color="text-purple-600"
            />
            <StatCard
              icon={ShieldCheck}
              value="100%"
              label="Free to browse"
              color="text-emerald-600"
            />
            <StatCard
              icon={Trophy}
              value="24h"
              label="Signed referral"
              color="text-orange-600"
            />
          </div>
        </div>
      </section>

      {/* ─── Section 3: Quick nav cards ──────────────────────────── */}
      <section className="py-12">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickNavCard
              icon={GraduationCap}
              title="Courses"
              description="Self-paced English courses from beginner to GRE/GMAT."
              href="/english-learning/courses"
              color="bg-blue-50 text-blue-700"
            />
            <QuickNavCard
              icon={ClipboardCheck}
              title="Practice Tests"
              description="Full-length IELTS, TOEFL, PTE, Duolingo, GRE, GMAT mocks."
              href="/english-learning/practice-tests"
              color="bg-purple-50 text-purple-700"
            />
            <QuickNavCard
              icon={UserSearch}
              title="Tutors"
              description="Verified 1:1 English tutors for every test and skill."
              href="/english-learning/tutors"
              color="bg-emerald-50 text-emerald-700"
            />
            <QuickNavCard
              icon={BookOpen}
              title="Resources"
              description="Articles, videos, infographics and PDF study guides."
              href="/english-learning/resources"
              color="bg-cyan-50 text-cyan-700"
            />
          </div>
        </div>
      </section>

      {/* ─── Section 4: Featured courses ─────────────────────────── */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-[11px] font-bold uppercase tracking-widest text-blue-700"
              >
                Featured
              </Badge>
              <h2 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
                Popular English courses
              </h2>
              <p className="mt-1.5 text-sm text-ink-600">
                Hand-picked courses across all 9 levels — from absolute beginner
                to GRE Verbal mastery.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="gap-1.5 rounded-xl border-ink-200 text-ink-700"
            >
              <Link href="/english-learning/courses">
                All courses
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {data.courses.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.courses.map((c) => (
                <CourseCard key={c.id} course={c as never} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-ink-50/50 p-10 text-center text-sm text-ink-600">
              Courses are being verified. Check back soon.
            </Card>
          )}
        </div>
      </section>

      {/* ─── Section 5: Practice tests ───────────────────────────── */}
      <section className="py-14">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge
                variant="outline"
                className="border-purple-200 bg-purple-50 text-[11px] font-bold uppercase tracking-widest text-purple-700"
              >
                Practice tests
              </Badge>
              <h2 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
                Take a mock test
              </h2>
              <p className="mt-1.5 text-sm text-ink-600">
                Free, full-length mock tests with instant scoring and per-question
                explanations.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="gap-1.5 rounded-xl border-ink-200 text-ink-700"
            >
              <Link href="/english-learning/practice-tests">
                All tests
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {data.tests.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.tests.map((t) => (
                <PracticeTestCard key={t.id} test={t as never} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-ink-50/50 p-10 text-center text-sm text-ink-600">
              Practice tests are being added. Check back soon.
            </Card>
          )}
        </div>
      </section>

      {/* ─── Section 6: Top tutors ───────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-[11px] font-bold uppercase tracking-widest text-emerald-700"
              >
                Tutors
              </Badge>
              <h2 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
                Top-rated English tutors
              </h2>
              <p className="mt-1.5 text-sm text-ink-600">
                Book a 1:1 session with a verified tutor — payment + scheduling
                handled securely by ALO Education.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="gap-1.5 rounded-xl border-ink-200 text-ink-700"
            >
              <Link href="/english-learning/tutors">
                All tutors
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {data.tutors.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.tutors.map((t) => (
                <TutorCard key={t.id} tutor={t as never} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-ink-50/50 p-10 text-center text-sm text-ink-600">
              Tutor profiles are being verified. Check back soon.
            </Card>
          )}
        </div>
      </section>

      {/* ─── Section 7: Free resources ───────────────────────────── */}
      <section className="py-14">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge
                variant="outline"
                className="border-cyan-200 bg-cyan-50 text-[11px] font-bold uppercase tracking-widest text-cyan-700"
              >
                Free resources
              </Badge>
              <h2 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
                Study resources library
              </h2>
              <p className="mt-1.5 text-sm text-ink-600">
                Articles, videos, infographics and PDFs — all free, all
                vetted by our editorial team.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="gap-1.5 rounded-xl border-ink-200 text-ink-700"
            >
              <Link href="/english-learning/resources">
                All resources
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {data.resources.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.resources.map((r) => (
                <ResourceCard key={r.id} resource={r as never} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-ink-50/50 p-10 text-center text-sm text-ink-600">
              Resources are being added. Check back soon.
            </Card>
          )}
        </div>
      </section>

      {/* ─── Section 8: Course levels overview ──────────────────── */}
      <section className="bg-ink-950 py-14 text-white">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="mb-8 text-center">
            <Badge
              variant="outline"
              className="border-white/20 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-purple-200"
            >
              Levels
            </Badge>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              9 course levels, every English test covered
            </h2>
            <p className="mx-auto mt-1.5 max-w-2xl text-sm text-blue-100/80">
              From absolute beginner (A1) to GRE Verbal mastery — pick your
              level and we&apos;ll suggest the right course.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COURSE_LEVELS.map((lvl) => (
              <Link
                key={lvl.value}
                href={`/english-learning/courses?level=${lvl.value}`}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/30 hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-white">
                    {lvl.label}
                  </h3>
                  <ArrowRight
                    className="h-4 w-4 text-purple-200 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-blue-100/80">
                  {lvl.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 9: Test types ──────────────────────────────── */}
      <section className="py-14">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="mb-8 text-center">
            <Badge
              variant="outline"
              className="border-purple-200 bg-purple-50 text-[11px] font-bold uppercase tracking-widest text-purple-700"
            >
              Tests
            </Badge>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              12 test types across 6 English exams
            </h2>
            <p className="mx-auto mt-1.5 max-w-2xl text-sm text-ink-600">
              IELTS, TOEFL, PTE Academic, Duolingo, GRE and GMAT — full coverage
              of every section.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEST_TYPES.slice(0, 9).map((t) => (
              <Link
                key={t.value}
                href={`/english-learning/practice-tests?testType=${t.value}`}
                className="group rounded-2xl border border-ink-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
                      {t.group}
                    </div>
                    <h3 className="mt-0.5 font-display text-sm font-bold text-ink-900">
                      {t.label}
                    </h3>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 text-purple-400 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-600">{t.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 10: Eligibility check CTA ──────────────────── */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-orange-50 py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
            <Zap className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            Not sure where to start?
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            Take our free 10-question level check — we&apos;ll recommend the
            right course based on your current English.
          </p>
          <Button
            asChild
            className="mt-6 gap-1.5 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-purple-700"
          >
            <Link href="/english-learning/eligibility-check">
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              Check my level now
            </Link>
          </Button>
        </div>
      </section>

      {/* ─── Section 11: ALO Education referral CTA ─────────────── */}
      <section className="bg-ink-950 py-14 text-white">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge
                variant="outline"
                className="border-orange-300/30 bg-orange-500/10 text-[11px] font-bold uppercase tracking-widest text-orange-300"
              >
                ALO Education
              </Badge>
              <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
                Ready for paid tutoring or a course package?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-blue-100/90">
                When you&apos;re ready to enrol in a paid course package or book
                a 1:1 tutor, we transfer you securely to ALO Education — our
                official application partner. They handle scheduling, payment
                and course delivery on their own domain.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>Only public context is shared — no PII in the URL.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>24-hour signed referral token for audit trail.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>You consent on Alaminn.info, then re-consent on ALO.</span>
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <ReferralCta
                  referralType="course-package"
                  label="Apply for Course Package"
                  size="lg"
                  className="rounded-xl bg-orange-600 px-6 text-white shadow-orange hover:bg-orange-700"
                />
                <Button
                  asChild
                  variant="outline"
                  className="gap-1.5 rounded-xl border-white/20 bg-white/5 px-5 text-white backdrop-blur hover:bg-white/10"
                >
                  <Link href="/english-learning/book-tutor">
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    Book a Tutor
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="border-white/10 bg-white/5 p-6 text-white backdrop-blur">
              <h3 className="font-display text-lg font-bold">How it works</h3>
              <ol className="mt-4 space-y-4 text-sm">
                <Step
                  num="1"
                  title="Browse & shortlist"
                  desc="Find a course or tutor on Alaminn.info — all info is free."
                />
                <Step
                  num="2"
                  title="Consent & transfer"
                  desc="Click Apply or Book. We create a signed referral and transfer you to ALO Education."
                />
                <Step
                  num="3"
                  title="Enrol on ALO"
                  desc="Complete your enrolment, payment and scheduling on ALO Education's secure domain."
                />
                <Step
                  num="4"
                  title="Track progress"
                  desc="Come back to Alaminn.info to track your lesson progress (anonymous or signed-in)."
                />
              </ol>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Section 12: Higher Study cross-link ────────────────── */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <Card className="overflow-hidden rounded-3xl border-ink-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 sm:p-10">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
              <div>
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-[11px] font-bold uppercase tracking-widest text-blue-700"
                >
                  <ArrowLeftRight className="mr-1 h-3 w-3" aria-hidden="true" />
                  Sister platform
                </Badge>
                <h2 className="mt-3 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">
                  Planning to study abroad after English prep?
                </h2>
                <p className="mt-2 text-sm text-ink-600">
                  Alaminn.info also hosts the Higher Study platform — 30 study
                  destinations, universities, courses, scholarships, PhD
                  opportunities and supervisors. Cross-link your English prep
                  with academic pathway planning.
                </p>
                <Button
                  asChild
                  className="mt-5 gap-1.5 rounded-xl bg-blue-600 px-5 text-white shadow-blue hover:bg-blue-700"
                >
                  <Link href={HIGHER_STUDY_URL}>
                    Explore Higher Study
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <MiniStat icon={GraduationCap} value="30" label="Destinations" />
                <MiniStat icon={BookOpen} value="33" label="Study levels" />
                <MiniStat icon={Trophy} value="24" label="Funding types" />
                <MiniStat icon={UserSearch} value="11" label="Major programmes" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ─── Section 13: FAQ ────────────────────────────────────── */}
      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <Badge
              variant="outline"
              className="border-ink-200 bg-ink-50 text-[11px] font-bold uppercase tracking-widest text-ink-700"
            >
              FAQ
            </Badge>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-3">
            {HOMEPAGE_FAQS.map((faq) => (
              <Card key={faq.question} className="p-5">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-sm font-bold text-ink-900">
                    {faq.question}
                    <span className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-700">
                    {faq.answer}
                  </p>
                </details>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 14: Newsletter subscribe ───────────────────── */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <NewsletterSubscribe />
        </div>
      </section>

      {/* ─── Section 15: Final CTA ──────────────────────────────── */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-purple-50 py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Sparkles className="mx-auto h-10 w-10 text-orange-500" aria-hidden="true" />
          <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            Start your English journey today
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            Browse courses, take a free practice test, or apply for a paid
            course package — whatever stage you&apos;re at, we&apos;ve got you.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="gap-1.5 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-orange hover:bg-orange-700"
            >
              <Link href="/english-learning/courses">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                Browse Courses
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="gap-1.5 rounded-xl border-ink-200 px-6 py-3 text-sm font-bold text-ink-700"
            >
              <Link href="/english-learning/apply">
                <Send className="h-4 w-4" aria-hidden="true" />
                Apply for Paid Package
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-[11px] text-ink-500">
            Handoff to{" "}
            <a
              href={ALO_EDUCATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-semibold text-blue-700 hover:underline"
            >
              ALO Education
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>{" "}
            · Verified referral · 24h signed token
          </p>
        </div>
      </section>
    </>
  );
}

// ─── Small helper components ──────────────────────────────────────────

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className={cn("h-5 w-5", color)} aria-hidden="true" />
      <div className="font-display text-2xl font-extrabold text-ink-900">
        {value}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">
        {label}
      </div>
    </div>
  );
}

function QuickNavCard({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl",
          color,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-3 font-display text-base font-bold text-ink-900">
        {title}
      </h3>
      <p className="mt-1 text-xs text-ink-600">{description}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
        Explore
        <ArrowRight
          className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

function Step({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
        {num}
      </span>
      <div>
        <div className="font-display text-sm font-bold">{title}</div>
        <div className="mt-0.5 text-xs text-blue-100/80">{desc}</div>
      </div>
    </li>
  );
}

function MiniStat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <Icon className="mx-auto h-5 w-5 text-blue-600" aria-hidden="true" />
      <div className="mt-1.5 font-display text-lg font-extrabold text-ink-900">
        {value}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        {label}
      </div>
    </div>
  );
}

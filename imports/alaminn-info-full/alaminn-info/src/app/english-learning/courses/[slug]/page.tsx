/**
 * /english-learning/courses/[slug]
 * --------------------------------------------------------------------
 * Course detail page — hero, summary, syllabus (lessons list with free-preview
 * badges), meta grid, enrollment CTA, related courses, FAQ JSON-LD.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Clock,
  BookOpen,
  DollarSign,
  Sparkles,
  Trophy,
  Users,
  ShieldCheck,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  buildEnglishLearningMetadata,
  buildCourseJsonLd,
  serializeJsonLd,
} from "@/lib/english-learning/seo";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { LessonCard } from "@/components/english-learning/lesson-card";
import { CourseCard } from "@/components/english-learning/course-card";
import { ApplyCta } from "@/components/english-learning/apply-cta";
import { EmptyState } from "@/components/english-learning/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COURSE_LEVEL_MAP } from "@/lib/english-learning/constants";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await db.englishLearningCourse.findFirst({
    where: { slug, isPublished: true },
    select: {
      title: true,
      summary: true,
      metaTitle: true,
      metaDescription: true,
      level: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!course) {
    return buildEnglishLearningMetadata({
      title: "Course not found",
      description: "This English Learning course could not be found.",
      path: `/english-learning/courses/${slug}`,
      noindex: true,
    });
  }
  return buildEnglishLearningMetadata({
    title: course.metaTitle || course.title,
    description:
      course.metaDescription ||
      course.summary ||
      `English Learning course: ${course.title}`,
    path: `/english-learning/courses/${slug}`,
    type: "article",
    publishedTime: course.createdAt.toISOString(),
    modifiedTime: course.updatedAt.toISOString(),
  });
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await db.englishLearningCourse.findFirst({
    where: { slug, isPublished: true, publicationStatus: "published" },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      description: true,
      level: true,
      durationWeeks: true,
      hoursPerWeek: true,
      priceUsd: true,
      currency: true,
      isFeatured: true,
      verificationStatus: true,
      lastVerifiedAt: true,
      officialSourceUrl: true,
      heroImageUrl: true,
      introVideoUrl: true,
      syllabus: true,
      prerequisites: true,
      targetAudience: true,
      learningOutcomes: true,
      certificationType: true,
      passScore: true,
      enrollmentCount: true,
      createdAt: true,
      updatedAt: true,
      lessons: {
        where: { isPublished: true },
        select: {
          id: true,
          courseId: true,
          slug: true,
          title: true,
          summary: true,
          orderIndex: true,
          durationMinutes: true,
          lessonType: true,
          isFreePreview: true,
          isPublished: true,
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!course) notFound();

  // Related courses (same level, excluding self).
  const related = await db.englishLearningCourse.findMany({
    where: {
      isPublished: true,
      level: course.level,
      slug: { not: course.slug },
    },
    take: 3,
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
  });

  const levelLabel = COURSE_LEVEL_MAP[course.level as string]?.label ?? course.level;
  const courseJsonLd = buildCourseJsonLd(course as never);

  // Parse JSON columns into arrays (safely).
  const syllabus = parseJsonArray(course.syllabus);
  const prerequisites = parseJsonArray(course.prerequisites);
  const targetAudience = parseJsonArray(course.targetAudience);
  const learningOutcomes = parseJsonArray(course.learningOutcomes);

  const price = course.priceUsd != null ? formatPrice(course.priceUsd, course.currency) : null;

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb
            items={[
              { label: "Courses", href: "/english-learning/courses" },
              { label: course.title },
            ]}
          />
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(courseJsonLd) }}
      />

      {/* Hero */}
      <section className="border-b border-ink-100 bg-gradient-to-br from-purple-50 via-white to-blue-50 py-10">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-[11px] font-bold uppercase tracking-wider text-blue-700"
                >
                  <GraduationCap className="mr-1 h-3 w-3" aria-hidden="true" />
                  {levelLabel}
                </Badge>
                {course.isFeatured && (
                  <Badge
                    variant="outline"
                    className="border-orange-200 bg-orange-50 text-[11px] font-bold uppercase tracking-wider text-orange-700"
                  >
                    Featured
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-[11px] font-bold uppercase tracking-wider text-emerald-700"
                >
                  <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />
                  Verified
                </Badge>
              </div>
              <h1 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
                {course.title}
              </h1>
              {course.summary && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-700 sm:text-base">
                  {course.summary}
                </p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {course.durationWeeks != null && (
                  <MetaCell icon={<Clock className="h-4 w-4" />} label="Duration">
                    {course.durationWeeks} weeks
                  </MetaCell>
                )}
                {course.hoursPerWeek != null && (
                  <MetaCell icon={<BookOpen className="h-4 w-4" />} label="Hours/wk">
                    {course.hoursPerWeek} hours
                  </MetaCell>
                )}
                {price && (
                  <MetaCell icon={<DollarSign className="h-4 w-4" />} label="Price">
                    <span className="font-semibold text-emerald-700">{price}</span>
                  </MetaCell>
                )}
                <MetaCell icon={<Sparkles className="h-4 w-4" />} label="Lessons">
                  {course.lessons.length}
                </MetaCell>
              </div>

              {course.enrollmentCount > 0 && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700">
                  <Users className="h-3 w-3" aria-hidden="true" />
                  {course.enrollmentCount.toLocaleString()} enrolled
                </div>
              )}
            </div>

            {/* Sticky enrollment CTA */}
            <Card className="p-5 shadow-soft lg:sticky lg:top-6">
              {course.heroImageUrl ? (
                <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-ink-100">
                  <img
                    src={course.heroImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <div className="space-y-3">
                <ApplyCta
                  courseSlug={course.slug}
                  level={course.level}
                  sourceEntityId={course.id}
                  sourceEntityType="course"
                  label="Apply for this Course"
                  size="lg"
                  className="w-full rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                />
                <Button
                  asChild
                  variant="outline"
                  className="w-full gap-1.5 rounded-xl border-ink-200 text-ink-700"
                >
                  <Link href={`/english-learning/book-consultation?course=${course.slug}`}>
                    Book a free consultation
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                {course.officialSourceUrl && (
                  <a
                    href={course.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-[11px] font-semibold text-blue-700 hover:underline"
                  >
                    View official source →
                  </a>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-10">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-10">
              {course.description && (
                <div>
                  <h2 className="font-display text-xl font-bold text-ink-900">
                    About this course
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                    {course.description}
                  </p>
                </div>
              )}

              {learningOutcomes.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-bold text-ink-900">
                    Learning outcomes
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {learningOutcomes.map((o, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-ink-700"
                      >
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        <span>{String(o)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {syllabus.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-bold text-ink-900">
                    Syllabus
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {syllabus.map((s, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-ink-100 bg-white p-3 text-sm text-ink-700"
                      >
                        <span className="font-bold text-ink-900">Module {i + 1}:</span>{" "}
                        {String(s)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lessons list */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-ink-900">
                    Lessons ({course.lessons.length})
                  </h2>
                  <span className="text-xs text-ink-500">
                    {course.lessons.filter((l) => l.isFreePreview).length} free preview
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {course.lessons.length === 0 ? (
                    <EmptyState
                      title="Lessons are being prepared"
                      description="Check back soon — this course's lessons are being finalised."
                      size="compact"
                    />
                  ) : (
                    course.lessons.map((lesson, _idx) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson as never}
                        courseSlug={course.slug}
                        isLocked={!lesson.isFreePreview}
                      />
                    ))
                  )}
                </div>
              </div>

              {prerequisites.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-bold text-ink-900">
                    Prerequisites
                  </h2>
                  <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                    {prerequisites.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span>{String(p)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {targetAudience.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-bold text-ink-900">
                    Who this course is for
                  </h2>
                  <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                    {targetAudience.map((a, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                        <span>{String(a)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {course.certificationType && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                    <h3 className="font-display text-base font-bold text-ink-900">
                      Certification
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-ink-700">
                    Completing this course awards a{" "}
                    <strong>{course.certificationType}</strong> certificate
                    {course.passScore != null
                      ? ` (pass score: ${course.passScore}%)`
                      : ""}
                    .
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar: Higher Study cross-link */}
            <aside className="space-y-4">
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-5">
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-[10px] font-bold uppercase tracking-widest text-blue-700"
                >
                  <ArrowLeftRight className="mr-1 h-3 w-3" aria-hidden="true" />
                  Cross-link
                </Badge>
                <h3 className="mt-2 font-display text-base font-bold text-ink-900">
                  Planning to study abroad?
                </h3>
                <p className="mt-1 text-xs text-ink-600">
                  Pair your English prep with university applications, scholarships
                  and PhD opportunities on the Higher Study platform.
                </p>
                <Button
                  asChild
                  size="sm"
                  className="mt-3 w-full gap-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Link href="/higher-study">
                    Explore Higher Study
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </Card>

              {course.lastVerifiedAt && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-xs text-ink-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    <span>
                      Last verified:{" "}
                      <time dateTime={course.lastVerifiedAt.toISOString()}>
                        {course.lastVerifiedAt.toLocaleDateString()}
                      </time>
                    </span>
                  </div>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-ink-100 bg-white py-10">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <h2 className="mb-5 font-display text-xl font-bold text-ink-900">
              Related courses
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((c) => (
                <CourseCard key={c.id} course={c as never} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function MetaCell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-3">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
        <span className="text-ink-400" aria-hidden="true">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-0.5 text-sm text-ink-800">{children}</div>
    </div>
  );
}

function formatPrice(fee: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(fee);
  } catch {
    return `${currency} ${fee.toLocaleString()}`;
  }
}

function parseJsonArray(value: unknown): unknown[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

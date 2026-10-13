/**
 * /english-learning/courses — list page with filter sidebar + pagination.
 */
import type { Metadata } from "next";
import { GraduationCap, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildEnglishLearningMetadata,
} from "@/lib/english-learning/seo";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { CourseCard } from "@/components/english-learning/course-card";
import { CourseFilters } from "@/components/english-learning/course-filters";
import { EmptyState } from "@/components/english-learning/empty-state";
import { PaginationClient } from "@/components/english-learning/pagination-client";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = buildEnglishLearningMetadata({
  title: "Browse English Courses — IELTS, TOEFL, PTE & more",
  description:
    "Browse all English Learning courses by level and test prep type. Filter by level, price and featured status. Free to browse.",
  path: "/english-learning/courses",
});

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    level?: string;
    testType?: string;
    isFeatured?: string;
    maxPriceUsd?: string;
    page?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1"));
  const limit = DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * limit;

  const q = (sp.q || "").trim();
  const levels = (sp.level || "").split(",").filter(Boolean);
  const testType = sp.testType || "";
  const featured = sp.isFeatured === "true";
  const maxPriceUsd = Number(sp.maxPriceUsd || "0");
  const order: "asc" | "desc" = sp.order === "asc" ? "asc" : "desc";
  const sort = sp.sort || "createdAt";

  const where: Prisma.EnglishLearningCourseWhereInput = {
    isPublished: true,
    publicationStatus: "published",
  };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { summary: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (levels.length > 0) {
    where.level = { in: levels };
  } else if (testType) {
    where.level = testType;
  }
  if (featured) where.isFeatured = featured;
  if (maxPriceUsd > 0) where.priceUsd = { lte: Math.floor(maxPriceUsd) };

  const sortWhitelist = new Set([
    "createdAt",
    "updatedAt",
    "title",
    "priceUsd",
    "enrollmentCount",
  ]);
  const sortField = sortWhitelist.has(sort) ? sort : "createdAt";

  const [items, total] = await Promise.all([
    db.englishLearningCourse.findMany({
      where,
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
      skip,
      take: limit,
      orderBy: [{ isFeatured: "desc" }, { [sortField]: order }],
    }),
    db.englishLearningCourse.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb items={[{ label: "Courses" }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-ink-100 bg-gradient-to-br from-purple-50 via-white to-blue-50 py-10">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-[11px] font-bold uppercase tracking-widest text-blue-700"
          >
            <GraduationCap className="mr-1 h-3 w-3" aria-hidden="true" />
            Course catalog
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            English Learning Courses
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            Browse {total} course{total === 1 ? "" : "s"} across all 9 levels —
            from beginner to GRE/GMAT Verbal. Filter by level, price and test
            type.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <CourseFilters className="lg:sticky lg:top-6 lg:self-start" />

            <div>
              {items.length === 0 ? (
                <EmptyState
                  title="No courses match your filters"
                  description="Try widening your filters or clearing them to see all courses."
                  icon={Search}
                  action={{
                    label: "Clear filters",
                    href: "/english-learning/courses",
                  }}
                />
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs text-ink-500">
                      Showing {items.length} of {total} courses
                    </p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((c) => (
                      <CourseCard key={c.id} course={c as never} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-8">
                      <PaginationClient
                        page={page}
                        limit={limit}
                        total={total}
                        totalPages={totalPages}
                        hasNext={page < totalPages}
                        hasPrev={page > 1}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

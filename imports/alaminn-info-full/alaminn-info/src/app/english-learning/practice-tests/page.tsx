/**
 * /english-learning/practice-tests — list with filters by test type.
 */
import type { Metadata } from "next";
import { ClipboardCheck, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { buildEnglishLearningMetadata } from "@/lib/english-learning/seo";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { PracticeTestCard } from "@/components/english-learning/practice-test-card";
import { TestFilters } from "@/components/english-learning/test-filters";
import { EmptyState } from "@/components/english-learning/empty-state";
import { PaginationClient } from "@/components/english-learning/pagination-client";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = buildEnglishLearningMetadata({
  title: "Practice Tests — IELTS, TOEFL, PTE, Duolingo, GRE & GMAT Mocks",
  description:
    "Take free, full-length practice tests for IELTS, TOEFL, PTE, Duolingo English Test, GRE Verbal and GMAT Verbal. Instant scoring with explanations.",
  path: "/english-learning/practice-tests",
});

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    testType?: string;
    level?: string;
    isFeatured?: string;
    page?: string;
  }>;
}

export default async function PracticeTestsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1"));
  const limit = DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * limit;

  const q = (sp.q || "").trim();
  const testType = sp.testType || "";
  const level = sp.level || "";
  const featured = sp.isFeatured === "true";

  const where: Prisma.EnglishLearningPracticeTestWhereInput = {
    isPublished: true,
  };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (testType) where.testType = testType;
  if (level) where.level = level;
  if (featured) where.isFeatured = featured;

  const [items, total] = await Promise.all([
    db.englishLearningPracticeTest.findMany({
      where,
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
      skip,
      take: limit,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
    db.englishLearningPracticeTest.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb items={[{ label: "Practice Tests" }]} />
        </div>
      </div>

      <section className="border-b border-ink-100 bg-gradient-to-br from-purple-50 via-white to-cyan-50 py-10">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <Badge
            variant="outline"
            className="border-purple-200 bg-purple-50 text-[11px] font-bold uppercase tracking-widest text-purple-700"
          >
            <ClipboardCheck className="mr-1 h-3 w-3" aria-hidden="true" />
            Practice tests
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            English Practice Tests
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            Full-length mock tests for IELTS, TOEFL, PTE, Duolingo, GRE &amp;
            GMAT. Free, instant scoring, per-question explanations.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <TestFilters className="lg:sticky lg:top-6 lg:self-start" />
            <div>
              {items.length === 0 ? (
                <EmptyState
                  title="No practice tests match your filters"
                  description="Try clearing filters or selecting a different test type."
                  icon={Search}
                  action={{
                    label: "Clear filters",
                    href: "/english-learning/practice-tests",
                  }}
                />
              ) : (
                <>
                  <p className="mb-4 text-xs text-ink-500">
                    Showing {items.length} of {total} tests
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((t) => (
                      <PracticeTestCard key={t.id} test={t as never} />
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

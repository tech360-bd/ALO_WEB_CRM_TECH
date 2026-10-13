/**
 * /english-learning/tutors — tutor directory with filter sidebar.
 */
import type { Metadata } from "next";
import { UserSearch } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { buildEnglishLearningMetadata } from "@/lib/english-learning/seo";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { TutorCard } from "@/components/english-learning/tutor-card";
import { TutorFilters } from "@/components/english-learning/tutor-filters";
import { EmptyState } from "@/components/english-learning/empty-state";
import { PaginationClient } from "@/components/english-learning/pagination-client";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = buildEnglishLearningMetadata({
  title: "English Tutors — IELTS, TOEFL & Academic English Specialists",
  description:
    "Browse verified 1:1 English tutors. Filter by specialty, hourly rate, rating and availability. Book via ALO Education with consent-tracked referral.",
  path: "/english-learning/tutors",
});

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    specialty?: string;
    maxHourlyRate?: string;
    minRating?: string;
    isAvailable?: string;
    page?: string;
  }>;
}

export default async function TutorsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1"));
  const limit = DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * limit;

  const q = (sp.q || "").trim();
  const specialty = sp.specialty || "";
  const maxRate = Number(sp.maxHourlyRate || "0");
  const minRating = Number(sp.minRating || "0");
  const availableOnly = sp.isAvailable === "true";

  const where: Prisma.EnglishLearningTutorWhereInput = {
    isPublished: true,
  };
  if (q) {
    where.OR = [{ name: { contains: q } }, { bio: { contains: q } }];
  }
  if (specialty) {
    where.specialties = { string_contains: specialty };
  }
  if (maxRate > 0) where.hourlyRateUsd = { lte: Math.floor(maxRate) };
  if (minRating > 0) where.rating = { gte: minRating };
  if (availableOnly) where.isAvailable = true;

  const [items, total] = await Promise.all([
    db.englishLearningTutor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { rating: "desc" },
    }),
    db.englishLearningTutor.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb items={[{ label: "Tutors" }]} />
        </div>
      </div>

      <section className="border-b border-ink-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-10">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-[11px] font-bold uppercase tracking-widest text-emerald-700"
          >
            <UserSearch className="mr-1 h-3 w-3" aria-hidden="true" />
            Tutor directory
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            English Tutors
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            {total} verified tutor{total === 1 ? "" : "s"} — filter by specialty,
            rate, rating and availability. Booking handled securely by ALO
            Education.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <TutorFilters className="lg:sticky lg:top-6 lg:self-start" />
            <div>
              {items.length === 0 ? (
                <EmptyState
                  title="No tutors match your filters"
                  description="Try widening your filters or clearing them."
                  action={{
                    label: "Clear filters",
                    href: "/english-learning/tutors",
                  }}
                />
              ) : (
                <>
                  <p className="mb-4 text-xs text-ink-500">
                    Showing {items.length} of {total} tutors
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((t) => (
                      <TutorCard key={t.id} tutor={t as never} />
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

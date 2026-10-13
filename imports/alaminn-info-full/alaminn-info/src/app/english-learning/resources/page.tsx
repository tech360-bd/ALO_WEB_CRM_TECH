/**
 * /english-learning/resources — resource library.
 */
import type { Metadata } from "next";
import { BookOpen, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { buildEnglishLearningMetadata } from "@/lib/english-learning/seo";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { ResourceCard } from "@/components/english-learning/resource-card";
import { EmptyState } from "@/components/english-learning/empty-state";
import { PaginationClient } from "@/components/english-learning/pagination-client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export const metadata: Metadata = buildEnglishLearningMetadata({
  title: "English Learning Resources — Articles, Videos & PDFs",
  description:
    "Free English Learning resources: articles, videos, infographics and PDF study guides. Curated by our editorial team.",
  path: "/english-learning/resources",
});

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    resourceType?: string;
    level?: string;
    isFeatured?: string;
    page?: string;
  }>;
}

export default async function ResourcesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || "1"));
  const limit = DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * limit;

  const q = (sp.q || "").trim();
  const resourceType = sp.resourceType || "";
  const level = sp.level || "";
  const featured = sp.isFeatured === "true";

  const where: Prisma.EnglishLearningResourceWhereInput = {
    isPublished: true,
  };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { summary: { contains: q } },
    ];
  }
  if (resourceType) where.resourceType = resourceType;
  if (level) where.level = level;
  if (featured) where.isFeatured = featured;

  const [items, total] = await Promise.all([
    db.englishLearningResource.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
    db.englishLearningResource.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const typeLinks: { label: string; value: string | null }[] = [
    { label: "All", value: null },
    { label: "Articles", value: "article" },
    { label: "Videos", value: "video" },
    { label: "Infographics", value: "infographic" },
    { label: "Audio", value: "audio" },
    { label: "PDFs", value: "pdf" },
  ];

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb items={[{ label: "Resources" }]} />
        </div>
      </div>

      <section className="border-b border-ink-100 bg-gradient-to-br from-cyan-50 via-white to-blue-50 py-10">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <Badge
            variant="outline"
            className="border-cyan-200 bg-cyan-50 text-[11px] font-bold uppercase tracking-widest text-cyan-700"
          >
            <BookOpen className="mr-1 h-3 w-3" aria-hidden="true" />
            Resource library
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            English Learning Resources
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            {total} curated articles, videos, infographics and PDFs — all free.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          {/* Type filter pills */}
          <Card className="mb-6 p-3">
            <div className="flex flex-wrap gap-1.5">
              {typeLinks.map((t) => {
                const isActive =
                  (t.value === null && !resourceType) ||
                  t.value === resourceType;
                const href = t.value
                  ? `/english-learning/resources?resourceType=${t.value}`
                  : "/english-learning/resources";
                return (
                  <Link
                    key={t.label}
                    href={href}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-cyan-600 text-white"
                        : "bg-ink-50 text-ink-700 hover:bg-ink-100"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </Card>

          {items.length === 0 ? (
            <EmptyState
              title="No resources found"
              description="Try a different filter or check back later — we add new resources weekly."
              icon={Search}
              action={{
                label: "Clear filters",
                href: "/english-learning/resources",
              }}
            />
          ) : (
            <>
              <p className="mb-4 text-xs text-ink-500">
                Showing {items.length} of {total} resources
              </p>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((r) => (
                  <ResourceCard key={r.id} resource={r as never} />
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
      </section>
    </>
  );
}

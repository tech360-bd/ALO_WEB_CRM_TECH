/**
 * /higher-study/resources/[resourceSlug]
 * --------------------------------------------------------------------
 * Study resource detail page per master prompt §16. Renders header
 * (title, category badge, summary, author, reviewer, published date,
 * updated date, reading time), table of contents (from JSON), content
 * body (rendered as markdown via MarkdownRenderer), related universities
 * / courses / scholarships (from comma-separated slugs), sticky sidebar
 * (Save, Consultation CTA, Application CTA), verification footer,
 * related resources (same category), JSON-LD (Article + BreadcrumbList),
 * generateMetadata + generateStaticParams.
 *
 * Note: the canonical detail route is `/higher-study/resources/[slug]`
 * (matching the ResourceCard link). The listing page at
 * `/higher-study/study-resources` redirects but the detail route stays
 * at `/higher-study/resources/[slug]`.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Clock,
  BookOpen,
  UserCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Building2,
  GraduationCap,
  Award,
  CalendarClock,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { ResourceCard } from "@/components/higher-study/resource-card";
import { UniversityCard } from "@/components/higher-study/university-card";
import { CourseCard } from "@/components/higher-study/course-card";
import { ScholarshipCard } from "@/components/higher-study/scholarship-card";
import { ApplyCta } from "@/components/higher-study/apply-cta";
import { SaveButton } from "@/components/higher-study/save-button";
import { cn } from "@/lib/utils";
import {
  DetailShell,
  DetailLayout,
  DetailHero,
  DetailCard,
  SidebarCard,
  SidebarActionLink,
  ProseParagraphs,
  HeroMetaItem,
  FeaturedBadge,
  VerificationFooter,
  RelatedSection,
  JsonLdScript,
  EmptyDataNote,
  safeParseJsonArray,
  parseCommaList,
  formatDate,
} from "../../_lib/detail-helpers";
import { MarkdownRenderer } from "../../_lib/markdown-renderer";
import type { BreadcrumbItem } from "@/components/higher-study/breadcrumb";
import type { Resource } from "@/lib/higher-study/types";

// ─── Static params ────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const items = await db.higherStudyResource.findMany({
      where: { publicationStatus: "published" },
      select: { slug: true },
      take: 50,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    });
    return items.map((r) => ({ resourceSlug: r.slug }));
  } catch {
    return [];
  }
}

// ─── Dynamic metadata ─────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ resourceSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { resourceSlug } = await params;
  let resource: {
    title: string;
    summary: string | null;
    slug: string;
    category: string | null;
    author: string | null;
    reviewer: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
    readingTimeMinutes: number | null;
  } | null = null;
  try {
    resource = await db.higherStudyResource.findUnique({
      where: { slug: resourceSlug },
      select: {
        title: true,
        summary: true,
        slug: true,
        category: true,
        author: true,
        reviewer: true,
        publishedAt: true,
        updatedAt: true,
        readingTimeMinutes: true,
      },
    });
  } catch {
    /* ignore */
  }
  if (!resource) {
    return buildHigherStudyMetadata({
      title: "Resource not found — Higher Study",
      description: "The study resource you were looking for could not be found.",
      path: `/higher-study/resources/${resourceSlug}`,
      noindex: true,
    });
  }
  const description = resource.summary
    ? resource.summary.slice(0, 160)
    : `${resource.title} — a Higher Study guide${resource.category ? ` in the ${resource.category.replace(/-/g, " ")} category` : ""}.`;
  return buildHigherStudyMetadata({
    title: `${resource.title} — Higher Study Guide`,
    description,
    path: `/higher-study/resources/${resource.slug}`,
    keywords: [
      resource.title,
      resource.category ?? "",
      "study guide",
      "higher study",
      resource.author ?? "",
    ].filter(Boolean) as string[],
    type: "article",
    publishedTime: resource.publishedAt
      ? resource.publishedAt.toISOString()
      : resource.updatedAt.toISOString(),
    modifiedTime: resource.updatedAt.toISOString(),
  });
}

// ─── Prettify category slug ───────────────────────────────────────────

function prettifyCategory(category?: string | null): string {
  if (!category) return "Resource";
  return category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Page ─────────────────────────────────────────────────────────────

export default async function ResourceDetailPage({ params }: PageProps) {
  const { resourceSlug } = await params;

  let resource: Resource | null = null;
  try {
    resource = (await db.higherStudyResource.findUnique({
      where: { slug: resourceSlug },
    })) as Resource | null;
  } catch (e) {
    console.error("[resource-detail] DB error", e);
  }

  if (!resource) {
    notFound();
  }

  // Parse JSON / list fields.
  const toc = safeParseJsonArray<{
    id?: string;
    title?: string;
    level?: number;
  }>(resource.tableOfContents);
  const relatedUniversitySlugs = parseCommaList(resource.relatedUniversitySlugs);
  const relatedCourseSlugs = parseCommaList(resource.relatedCourseSlugs);
  const relatedScholarshipSlugs = parseCommaList(resource.relatedScholarshipSlugs);

  // Fetch related entities by slug.
  const [relatedUniversities, relatedCourses, relatedScholarships, relatedResources] = await Promise.all([
    relatedUniversitySlugs.length > 0
      ? db.higherStudyUniversity
          .findMany({
            where: {
              slug: { in: relatedUniversitySlugs },
              publicationStatus: "published",
            },
            take: 4,
            include: {
              country: { select: { id: true, slug: true, name: true, flagEmoji: true, region: true } },
              city: { select: { id: true, slug: true, name: true } },
            },
          })
          .catch(() => [])
      : Promise.resolve([]),
    relatedCourseSlugs.length > 0
      ? db.higherStudyCourse
          .findMany({
            where: {
              slug: { in: relatedCourseSlugs },
              publicationStatus: "published",
            },
            take: 4,
            include: {
              university: { select: { id: true, slug: true, officialName: true } },
              country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
              subject: { select: { id: true, slug: true, name: true } },
              intake: { select: { id: true, slug: true, name: true } },
            },
          })
          .catch(() => [])
      : Promise.resolve([]),
    relatedScholarshipSlugs.length > 0
      ? db.higherStudyScholarship
          .findMany({
            where: {
              slug: { in: relatedScholarshipSlugs },
              publicationStatus: "published",
            },
            take: 4,
            include: {
              country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
              university: { select: { id: true, slug: true, officialName: true } },
            },
          })
          .catch(() => [])
      : Promise.resolve([]),
    db.higherStudyResource
      .findMany({
        where: {
          slug: { not: resource.slug },
          publicationStatus: "published",
          verificationStatus: { in: ["verified", "published"] },
          ...(resource.category ? { category: resource.category } : {}),
        },
        take: 4,
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      })
      .catch(() => []),
  ]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Study Resources", href: "/higher-study/study-resources" },
    { label: resource.title },
  ];

  const categoryLabel = prettifyCategory(resource.category);

  // Build Article JSON-LD.
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${HIGHER_STUDY_BASE_URL}/higher-study/resources/${resource.slug}#article`,
    headline: resource.title,
    url: `${HIGHER_STUDY_BASE_URL}/higher-study/resources/${resource.slug}`,
    ...(resource.summary ? { description: resource.summary } : {}),
    ...(resource.content ? { articleBody: resource.content } : {}),
    ...(resource.publishedAt ? { datePublished: resource.publishedAt.toISOString() } : {}),
    dateModified: resource.updatedAt.toISOString(),
    inLanguage: "en",
    ...(resource.author
      ? {
          author: {
            "@type": "Person",
            name: resource.author,
          },
        }
      : {
          author: {
            "@type": "Organization",
            name: "Alaminn.info Higher Study",
            url: HIGHER_STUDY_BASE_URL,
          },
        }),
    ...(resource.reviewer
      ? {
          editor: {
            "@type": "Person",
            name: resource.reviewer,
          },
        }
      : {}),
    publisher: {
      "@type": "Organization",
      name: "Alaminn.info",
      url: HIGHER_STUDY_BASE_URL,
      logo: { "@type": "ImageObject", url: `${HIGHER_STUDY_BASE_URL}/logo.svg` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${HIGHER_STUDY_BASE_URL}/higher-study/resources/${resource.slug}`,
    },
    ...(resource.readingTimeMinutes
      ? { timeRequired: `PT${resource.readingTimeMinutes}M` }
      : {}),
  };

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Study Resources", url: `${HIGHER_STUDY_BASE_URL}/higher-study/study-resources` },
    { name: resource.title, url: `${HIGHER_STUDY_BASE_URL}/higher-study/resources/${resource.slug}` },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={breadcrumbItems}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <DetailHero
        eyebrow={categoryLabel}
        title={resource.title}
        description={resource.summary ?? undefined}
        badges={
          <>
            {resource.featured && <FeaturedBadge />}
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
              <FileText className="h-3 w-3" aria-hidden="true" />
              {categoryLabel}
            </span>
            {resource.readingTimeMinutes && (
              <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-[11px] font-medium text-ink-700">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {resource.readingTimeMinutes} min read
              </span>
            )}
          </>
        }
        meta={
          <>
            {resource.author && (
              <HeroMetaItem icon={UserCircle}>By {resource.author}</HeroMetaItem>
            )}
            {resource.reviewer && (
              <HeroMetaItem icon={ShieldCheck}>Reviewed by {resource.reviewer}</HeroMetaItem>
            )}
            {resource.publishedAt && (
              <HeroMetaItem icon={CalendarClock}>
                Published {formatDate(resource.publishedAt) ?? "—"}
              </HeroMetaItem>
            )}
            <HeroMetaItem icon={Clock}>
              Updated {formatDate(resource.updatedAt) ?? "—"}
            </HeroMetaItem>
          </>
        }
        actions={
          <>
            <ApplyCta
              referralType="resource-referral"
              label="Apply through ALO Education"
              className="h-11 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
            />
            <SaveButton
              entityType="resource"
              entitySlug={resource.slug}
              entityName={resource.title}
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
                  referralType="resource-referral"
                  label="Apply"
                  className="w-full h-10 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                />
                <SaveButton
                  entityType="resource"
                  entitySlug={resource.slug}
                  entityName={resource.title}
                  className="w-full h-10 rounded-xl"
                />
                <SidebarActionLink
                  href={`/higher-study/book-consultation?resource=${resource.slug}`}
                  icon={CalendarClock}
                  label="Book consultation"
                  description="Free 1:1 with an advisor"
                />
                <SidebarActionLink
                  href="/higher-study/apply"
                  icon={ArrowRight}
                  label="Start an application"
                  description="Begin your application"
                />
              </SidebarCard>

              {/* Table of contents */}
              {toc.length > 0 && (
                <SidebarCard title="On this page">
                  <nav aria-label="Table of contents" className="space-y-1">
                    {toc.map((item, idx) => {
                      const title = item.title ?? `Section ${idx + 1}`;
                      const href = item.id ? `#${item.id}` : undefined;
                      const level = item.level ?? 1;
                      return href ? (
                        <Link
                          key={`${title}-${idx}`}
                          href={href}
                          className={cn(
                            "block text-xs font-medium text-ink-700 transition-colors hover:text-orange-600",
                            level === 2 && "ml-3",
                            level === 3 && "ml-6",
                          )}
                        >
                          {title}
                        </Link>
                      ) : (
                        <span
                          key={`${title}-${idx}`}
                          className={cn(
                            "block text-xs font-medium text-ink-700",
                            level === 2 && "ml-3",
                            level === 3 && "ml-6",
                          )}
                        >
                          {title}
                        </span>
                      );
                    })}
                  </nav>
                </SidebarCard>
              )}

              <SidebarCard title="Resource details">
                {resource.author && (
                  <div className="flex items-center justify-between gap-3 border-b border-ink-100 py-2">
                    <span className="text-xs font-medium text-ink-500">Author</span>
                    <span className="text-sm font-medium text-ink-900">{resource.author}</span>
                  </div>
                )}
                {resource.reviewer && (
                  <div className="flex items-center justify-between gap-3 border-b border-ink-100 py-2">
                    <span className="text-xs font-medium text-ink-500">Reviewer</span>
                    <span className="text-sm font-medium text-ink-900">{resource.reviewer}</span>
                  </div>
                )}
                {resource.readingTimeMinutes && (
                  <div className="flex items-center justify-between gap-3 border-b border-ink-100 py-2">
                    <span className="text-xs font-medium text-ink-500">Reading time</span>
                    <span className="text-sm font-medium text-ink-900">{resource.readingTimeMinutes} min</span>
                  </div>
                )}
                {resource.publishedAt && (
                  <div className="flex items-center justify-between gap-3 border-b border-ink-100 py-2">
                    <span className="text-xs font-medium text-ink-500">Published</span>
                    <span className="text-sm font-medium text-ink-900">
                      {formatDate(resource.publishedAt) ?? "—"}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 py-2">
                  <span className="text-xs font-medium text-ink-500">Updated</span>
                  <span className="text-sm font-medium text-ink-900">
                    {formatDate(resource.updatedAt) ?? "—"}
                  </span>
                </div>
              </SidebarCard>
            </>
          }
        >
          {/* Summary */}
          {resource.summary && (
            <DetailCard
              title="Summary"
              icon={BookOpen}
              description="A short overview of what this resource covers."
            >
              <ProseParagraphs content={resource.summary} />
            </DetailCard>
          )}

          {/* Content body */}
          {resource.content ? (
            <DetailCard
              title="Full guide"
              icon={FileText}
              description="The complete guide. Use the table of contents to navigate."
            >
              <MarkdownRenderer content={resource.content} />
            </DetailCard>
          ) : (
            <EmptyDataNote label="The full content of this guide is being finalised. Please check back soon." />
          )}

          {/* Related entities (universities / courses / scholarships) */}
          {(relatedUniversities.length > 0 || relatedCourses.length > 0 || relatedScholarships.length > 0) && (
            <DetailCard
              title="Related on Alaminn.info"
              icon={CheckCircle2}
              description="Universities, courses and scholarships mentioned in this guide."
            >
              <div className="space-y-6">
                {relatedUniversities.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                      <Building2 className="h-3 w-3" aria-hidden="true" />
                      Universities
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                      {relatedUniversities.map((u) => (
                        <UniversityCard key={u.id} university={u as never} showActions={false} />
                      ))}
                    </div>
                  </div>
                )}
                {relatedCourses.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                      <GraduationCap className="h-3 w-3" aria-hidden="true" />
                      Courses
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                      {relatedCourses.map((c) => (
                        <CourseCard key={c.id} course={c as never} showActions={false} />
                      ))}
                    </div>
                  </div>
                )}
                {relatedScholarships.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                      <Award className="h-3 w-3" aria-hidden="true" />
                      Scholarships
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                      {relatedScholarships.map((s) => (
                        <ScholarshipCard key={s.id} scholarship={s as never} showActions={false} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DetailCard>
          )}

          {/* Verification footer */}
          <VerificationFooter
            status={resource.verificationStatus}
            lastVerifiedAt={resource.lastVerifiedAt}
            sourceUrl={resource.officialSourceUrl}
          />

          {/* Related resources */}
          {relatedResources.length > 0 && (
            <RelatedSection
              title={`More ${resource.category ? prettifyCategory(resource.category).toLowerCase() : ""} resources`}
              description="Other guides in the same category."
              viewAllHref={
                resource.category
                  ? `/higher-study/study-resources?category=${resource.category}`
                  : "/higher-study/study-resources"
              }
            >
              {relatedResources.map((r) => (
                <ResourceCard key={r.id} resource={r as never} />
              ))}
            </RelatedSection>
          )}
        </DetailLayout>
      </DetailShell>

      <JsonLdScript data={[articleLd, breadcrumbLd]} />
    </>
  );
}

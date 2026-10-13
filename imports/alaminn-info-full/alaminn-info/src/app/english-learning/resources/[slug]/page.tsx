/**
 * /english-learning/resources/[slug]
 * --------------------------------------------------------------------
 * Single resource detail page — shows description, meta info, external
 * link if available, and a referral CTA for paid course packages.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Clock,
  User,
  ArrowLeftRight,
  GraduationCap,
} from "lucide-react";
import { db } from "@/lib/db";
import { buildEnglishLearningMetadata } from "@/lib/english-learning/seo";
import { EnglishLearningBreadcrumb } from "@/components/english-learning/breadcrumb";
import { ReferralCta } from "@/components/english-learning/referral-cta";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RESOURCE_TYPE_MAP } from "@/lib/english-learning/constants";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await db.englishLearningResource.findFirst({
    where: { slug, isPublished: true },
    select: { title: true, summary: true, createdAt: true, updatedAt: true },
  });
  if (!resource) {
    return buildEnglishLearningMetadata({
      title: "Resource not found",
      description: "This English Learning resource could not be found.",
      path: `/english-learning/resources/${slug}`,
      noindex: true,
    });
  }
  return buildEnglishLearningMetadata({
    title: resource.title,
    description: resource.summary || `English Learning resource: ${resource.title}`,
    path: `/english-learning/resources/${slug}`,
    type: "article",
    publishedTime: resource.createdAt.toISOString(),
    modifiedTime: resource.updatedAt.toISOString(),
  });
}

export default async function ResourceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const resource = await db.englishLearningResource.findFirst({
    where: { slug, isPublished: true },
  });

  if (!resource) notFound();

  const typeLabel =
    RESOURCE_TYPE_MAP[resource.resourceType as string] ?? "Resource";

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-3 sm:px-6">
          <EnglishLearningBreadcrumb
            items={[
              { label: "Resources", href: "/english-learning/resources" },
              { label: resource.title },
            ]}
          />
        </div>
      </div>

      <section className="border-b border-ink-100 bg-gradient-to-br from-cyan-50 via-white to-blue-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Badge
            variant="outline"
            className="border-cyan-200 bg-cyan-50 text-[11px] font-bold uppercase tracking-wider text-cyan-700"
          >
            {typeLabel}
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            {resource.title}
          </h1>
          {resource.summary && (
            <p className="mt-3 text-sm leading-relaxed text-ink-700">
              {resource.summary}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-500">
            {resource.authorName && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" aria-hidden="true" />
                {resource.authorName}
              </span>
            )}
            {resource.readingTimeMinutes != null && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {resource.readingTimeMinutes} min read
              </span>
            )}
            {resource.durationMinutes != null && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {resource.durationMinutes}m
              </span>
            )}
            {resource.sourceName && (
              <span>· Source: {resource.sourceName}</span>
            )}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {resource.description ? (
            <article className="prose prose-sm max-w-none whitespace-pre-line text-ink-700">
              {resource.description}
            </article>
          ) : (
            <Card className="border-dashed bg-ink-50/50 p-8 text-center text-sm text-ink-600">
              Full description coming soon. Click the link below to view the
              resource directly.
            </Card>
          )}

          {resource.url && (
            <div className="mt-8">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-cyan-700"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open resource
              </a>
            </div>
          )}

          <Card className="mt-10 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-purple-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-ink-900">
                  Ready to take the next step?
                </h3>
                <p className="mt-1 text-xs text-ink-600">
                  Apply for a paid course package via ALO Education — our
                  official English Learning services partner.
                </p>
              </div>
              <ReferralCta
                referralType="course-package"
                label="Apply"
                className="rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
              />
            </div>
          </Card>

          <Card className="mt-6 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-5">
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-[10px] font-bold uppercase tracking-widest text-blue-700"
            >
              <ArrowLeftRight className="mr-1 h-3 w-3" aria-hidden="true" />
              Cross-link
            </Badge>
            <h3 className="mt-2 font-display text-base font-bold text-ink-900">
              Want to study abroad?
            </h3>
            <p className="mt-1 text-xs text-ink-600">
              Explore universities, courses, scholarships and PhD opportunities
              on the Higher Study platform.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-3 gap-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              <Link href="/higher-study">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                Explore Higher Study
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </Card>
        </div>
      </section>
    </>
  );
}

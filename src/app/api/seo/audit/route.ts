import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCountryDestination } from '@/lib/country-destinations-data';
import { db } from '@/lib/db';
import { publicCourseIdentifierWhere } from '@/lib/public-catalog';
import { requireSeoStaff } from '@/lib/seo/request-access';
import { auditSeoPage } from '@/lib/seo/page-auditor';
import {
  articleSchema,
  breadcrumbSchema,
  collegeOrUniversitySchema,
  courseSchema,
  organizationSchema,
} from '@/lib/seo/schema-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com').replace(/\/$/, '');

const AuditBody = z
  .object({
    contentId: z.string().trim().max(191).optional(),
    entityType: z.enum(['destination', 'university', 'course']).optional(),
    slug: z.string().trim().max(191).optional(),
    html: z.string().max(500_000).optional(),
    markdown: z.string().max(500_000).optional(),
    title: z.string().max(300).optional(),
    metaDescription: z.string().max(500).optional(),
    canonicalUrl: z.string().max(2048).optional(),
    jsonLd: z.array(z.unknown()).max(20).optional(),
    attachDefaultAloSchemas: z.boolean().default(false),
  })
  .strict();

export async function POST(request: Request) {
  const auth = await requireSeoStaff(request);
  if (auth instanceof NextResponse) return auth;

  const parsed = AuditBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid SEO audit payload.' },
      { status: 400 },
    );
  }

  const data = parsed.data;
  let title = data.title;
  let markdown = data.markdown;
  let metaDescription = data.metaDescription;
  let canonicalUrl = data.canonicalUrl;
  const jsonLd: unknown[] = Array.isArray(data.jsonLd) ? [...data.jsonLd] : [];

  if (data.entityType && data.slug) {
    const cleanSlug = data.slug.trim();
    if (data.entityType === 'destination') {
      const country = getCountryDestination(cleanSlug);
      if (!country) {
        return NextResponse.json({ error: 'Destination guide not found.' }, { status: 404 });
      }
      title = title || country.seoTitle;
      metaDescription = metaDescription || country.seoDescription.slice(0, 158);
      canonicalUrl = canonicalUrl || country.canonicalUrl;
      markdown =
        markdown ||
        `# Study in ${country.name} from Bangladesh\n\n${country.heroSubtitle}\n\n## Overview\n\n${country.overview}\n\n[Find Courses](/course-finder?country=${encodeURIComponent(country.name)}) [Check Eligibility](/eligibility-check) [Request Consultation](/book-consultation)`;
      jsonLd.push(
        organizationSchema(SITE_URL),
        breadcrumbSchema(
          [
            { name: 'Home', url: '/' },
            { name: 'Destinations', url: '/destinations' },
            { name: country.name, url: `/destinations/${country.slug}` },
          ],
          SITE_URL,
        ),
      );
    } else if (data.entityType === 'university') {
      const uni = await db.crmUniversity.findFirst({
        where: {
          OR: [{ slug: cleanSlug }, { universityId: cleanSlug }],
          status: 'active',
          verificationStatus: 'VERIFIED',
          publicationStatus: { in: ['published', 'PUBLISHED'] },
        },
        select: {
          name: true,
          slug: true,
          universityId: true,
          country: true,
          city: true,
          description: true,
          officialUrl: true,
        },
      });
      if (!uni) {
        return NextResponse.json(
          { error: 'Published verified university record not found.' },
          { status: 404 },
        );
      }
      const uniSlug = uni.slug || uni.universityId || cleanSlug;
      title = title || `${uni.name} | University Information | ALO Education`.slice(0, 60);
      metaDescription =
        metaDescription ||
        (
          uni.description ||
          `Verified university information, entry requirements, and international courses at ${uni.name} via ALO Education.`
        ).slice(0, 155);
      canonicalUrl = canonicalUrl || `${SITE_URL}/universities/${encodeURIComponent(uniSlug)}`;
      markdown =
        markdown ||
        `# ${uni.name}\n\n## Institution Overview\n\n${uni.description || 'Source-linked university record.'}\n\n[Course Search](/course-finder?university=${encodeURIComponent(uniSlug)}) [Destinations](/destinations)`;
      jsonLd.push(
        collegeOrUniversitySchema({
          name: uni.name,
          slug: uniSlug,
          country: uni.country || '',
          city: uni.city || undefined,
          officialWebsite: uni.officialUrl || undefined,
          baseUrl: SITE_URL,
        }),
        breadcrumbSchema(
          [
            { name: 'Home', url: '/' },
            { name: 'Universities', url: '/universities' },
            { name: uni.name, url: `/universities/${encodeURIComponent(uniSlug)}` },
          ],
          SITE_URL,
        ),
      );
    } else if (data.entityType === 'course') {
      const where = publicCourseIdentifierWhere(cleanSlug);
      const course = where
        ? await db.crmCourse.findFirst({
            where: where as any,
            select: {
              courseTitle: true,
              slug: true,
              courseId: true,
              studyLevel: true,
              description: true,
              university: { select: { name: true, slug: true, universityId: true } },
            },
          })
        : null;
      if (!course) {
        return NextResponse.json(
          { error: 'Published verified course record not found.' },
          { status: 404 },
        );
      }
      const cSlug = course.slug || course.courseId || cleanSlug;
      const uSlug = course.university?.slug || course.university?.universityId;
      title = title || `${course.courseTitle} | ALO Education`.slice(0, 60);
      metaDescription =
        metaDescription ||
        (
          course.description ||
          `Source-linked course details, entry criteria, and application steps for ${course.courseTitle} via ALO Education.`
        ).slice(0, 155);
      canonicalUrl = canonicalUrl || `${SITE_URL}/course/${encodeURIComponent(cSlug)}`;
      markdown =
        markdown ||
        `# ${course.courseTitle}\n\n## Course Information\n\n${course.description || 'Source-linked course details.'}\n\n[Course Finder](/course-finder) [Apply Now](/apply/${encodeURIComponent(cSlug)})`;
      jsonLd.push(
        courseSchema({
          name: course.courseTitle,
          description: metaDescription,
          slug: cSlug,
          providerName: course.university?.name || 'Partner University',
          providerUrl: uSlug ? `${SITE_URL}/universities/${encodeURIComponent(uSlug)}` : undefined,
          educationalCredentialAwarded: course.studyLevel || undefined,
          baseUrl: SITE_URL,
        }),
        breadcrumbSchema(
          [
            { name: 'Home', url: '/' },
            { name: 'Courses', url: '/courses' },
            { name: course.courseTitle, url: `/course/${encodeURIComponent(cSlug)}` },
          ],
          SITE_URL,
        ),
      );
    }
  } else if (data.contentId) {
    const content = await db.marketingGeneratedContent.findUnique({
      where: { id: data.contentId },
      select: {
        id: true,
        title: true,
        topic: true,
        body: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!content) {
      return NextResponse.json({ error: 'Stored SEO content item not found.' }, { status: 404 });
    }
    title = title || content.title;
    markdown = markdown || content.body;
    metaDescription = metaDescription || content.topic;

    if (data.attachDefaultAloSchemas) {
      const slug = content.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 80);
      canonicalUrl = canonicalUrl || `${SITE_URL}/blog/${slug || content.id}`;
      jsonLd.push(
        organizationSchema(SITE_URL),
        breadcrumbSchema(
          [
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
            { name: content.title, url: `/blog/${slug || content.id}` },
          ],
          SITE_URL,
        ),
        articleSchema({
          headline: content.title,
          description: metaDescription || content.title,
          slug: slug || content.id,
          datePublished: content.createdAt.toISOString(),
          dateModified: content.updatedAt.toISOString(),
          baseUrl: SITE_URL,
        }),
      );
    }
  } else if (data.attachDefaultAloSchemas) {
    jsonLd.push(organizationSchema(SITE_URL));
  }

  if (!data.html && !markdown && !title && jsonLd.length === 0) {
    return NextResponse.json(
      { error: 'Supply html, markdown, title, jsonLd, entityType+slug, or a valid contentId to audit.' },
      { status: 400 },
    );
  }

  const report = auditSeoPage({
    html: data.html,
    markdown,
    title,
    metaDescription,
    canonicalUrl,
    jsonLd,
  });

  return NextResponse.json({
    success: true,
    verification: report.verification,
    report,
    generatedSchemas: jsonLd,
  });
}

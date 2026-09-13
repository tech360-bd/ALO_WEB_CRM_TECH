// UNIFIED UNIVERSITY, COURSE, SCHOLARSHIP, SERVICE, RESOURCE SYSTEM
// DB-first with static fallback, source verification, related content engine

import { db } from '@/lib/db';

// Information not verified message per spec
export const NOT_VERIFIED_MSG = "Information not currently verified. Please check with an ALO Education counselor.";

export interface RelatedContentItem {
  id: string;
  type: string;
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
  relation: string;
  score: number;
}

// Related content algorithm per spec section 31
// Priority: 1. Exact relationship 2. Same university 3. Same country 4. Same subject 5. Same destination 6. Same tag/category
export async function getRelatedContent(
  sourceType: string,
  sourceId: string,
  sourceSlug: string,
  options?: { country?: string; universityId?: string; subjectArea?: string; studyLevel?: string; tags?: string[]; limit?: number }
): Promise<RelatedContentItem[]> {
  const limit = options?.limit || 8;
  const related: RelatedContentItem[] = [];

  try {
    // Try to get from RelatedContent table first (precomputed)
    const precomputed = await db.relatedContent.findMany({
      where: { sourceType, sourceId },
      orderBy: { score: 'desc' },
      take: limit,
    }).catch(() => []);

    if (precomputed.length > 0) {
      return precomputed.map((rc: any) => ({
        id: rc.relatedId,
        type: rc.relatedType,
        slug: rc.relatedSlug,
        title: rc.relatedId, // Will be enriched
        relation: rc.relation,
        score: rc.score,
      }));
    }

    // Fallback: compute dynamically based on priority
    const { country, universityId, subjectArea, studyLevel } = options || {};

    // 1. Exact relationship — same university courses
    if (universityId) {
      const coursesSameUni = await db.crmCourse.findMany({
        where: { universityId, publicationStatus: 'published' },
        take: 4,
        select: { courseId: true, courseTitle: true, slug: true, country: true, universityId: true, subjectArea: true, studyLevel: true },
      }).catch(() => []);
      coursesSameUni.forEach((c: any) => {
        related.push({ id: c.courseId, type: 'course', slug: c.slug || c.courseId, title: c.courseTitle, relation: 'same_university', score: 0.95 });
      });
    }

    // 2. Same country
    if (country && related.length < limit) {
      const unisSameCountry = await db.crmUniversity.findMany({
        where: { country, publicationStatus: 'published' },
        take: 4,
        select: { universityId: true, name: true, slug: true, country: true },
      }).catch(() => []);
      unisSameCountry.forEach((u: any) => {
        if (!related.find(r => r.id === u.universityId)) {
          related.push({ id: u.universityId, type: 'university', slug: u.slug || u.universityId, title: u.name, relation: 'same_country', score: 0.8 });
        }
      });
    }

    // 3. Same subject
    if (subjectArea && related.length < limit) {
      const coursesSameSubject = await db.crmCourse.findMany({
        where: { subjectArea, publicationStatus: 'published' },
        take: 4,
        select: { courseId: true, courseTitle: true, slug: true, subjectArea: true },
      }).catch(() => []);
      coursesSameSubject.forEach((c: any) => {
        if (!related.find(r => r.id === c.courseId)) {
          related.push({ id: c.courseId, type: 'course', slug: c.slug || c.courseId, title: c.courseTitle, relation: 'same_subject', score: 0.7 });
        }
      });
    }

    // 4. Same study level
    if (studyLevel && related.length < limit) {
      const coursesSameLevel = await db.crmCourse.findMany({
        where: { studyLevel, publicationStatus: 'published' },
        take: 4,
        select: { courseId: true, courseTitle: true, slug: true, studyLevel: true },
      }).catch(() => []);
      coursesSameLevel.forEach((c: any) => {
        if (!related.find(r => r.id === c.courseId)) {
          related.push({ id: c.courseId, type: 'course', slug: c.slug || c.courseId, title: c.courseTitle, relation: 'same_level', score: 0.6 });
        }
      });
    }

    // 5. Related scholarships — same country/university
    if (related.length < limit) {
      const where: any = { status: 'active' };
      if (country) where.country = country;
      if (universityId) where.universityId = universityId;
      const scholarships = await db.scholarship.findMany({ where, take: 3, select: { id: true, slug: true, name: true, country: true } }).catch(() => []);
      scholarships.forEach((s: any) => {
        related.push({ id: s.id, type: 'scholarship', slug: s.slug, title: s.name, subtitle: s.country, relation: country ? 'same_destination' : 'same_tag', score: 0.65 });
      });
    }

    // 6. Related services
    if (related.length < limit) {
      const services = await db.service.findMany({ where: { status: 'active' }, take: 3, orderBy: { sortOrder: 'asc' }, select: { id: true, slug: true, title: true } }).catch(() => []);
      services.forEach((s: any) => {
        related.push({ id: s.id, type: 'service', slug: s.slug, title: s.title, relation: 'same_tag', score: 0.5 });
      });
    }

    // 7. Related resources
    if (related.length < limit) {
      const resources = await db.resource.findMany({ where: { status: 'active' }, take: 3, orderBy: { sortOrder: 'asc' }, select: { id: true, slug: true, title: true } }).catch(() => []);
      resources.forEach((r: any) => {
        related.push({ id: r.id, type: 'resource', slug: r.slug, title: r.title, relation: 'same_tag', score: 0.45 });
      });
    }

    // Sort by score and limit
    related.sort((a, b) => b.score - a.score);
    return related.slice(0, limit);
  } catch (e) {
    console.error('getRelatedContent error', e);
    return [];
  }
}

export async function getUniversityBySlugDB(slug: string): Promise<any | null> {
  try {
    // DB first
    const uni = await db.crmUniversity.findFirst({
      where: { OR: [{ slug }, { universityId: slug }, { name: { contains: slug.replace(/-/g, ' '), mode: 'insensitive' } }], publicationStatus: { not: 'draft' } },
      include: {
        courses: { where: { publicationStatus: 'published' }, take: 20, select: { courseId: true, courseTitle: true, slug: true, studyLevel: true, subjectArea: true, country: true } },
        scholarshipRecords: { where: { status: 'active' }, take: 10 },
        requirements: { take: 10 },
        intakeFees: { where: { status: 'active' }, take: 20, orderBy: { intakeYear: 'desc' } },
        rankingRecords: { take: 5, orderBy: { rankingYear: 'desc' } },
      },
    });
    if (uni) return uni;

    // Fallback to static
    const { getUniversityBySlug } = await import('@/lib/all-universities');
    const staticUni = getUniversityBySlug(slug);
    if (staticUni) {
      return {
        universityId: staticUni.slug,
        name: staticUni.name,
        slug: staticUni.slug,
        country: staticUni.country,
        city: staticUni.city,
        worldRanking: staticUni.worldRanking,
        type: staticUni.type,
        ieltsMin: staticUni.ieltsMin,
        tuitionRange: staticUni.tuitionRange,
        description: '',
        website: staticUni.website,
        verificationStatus: 'NEEDS_REVIEW',
        lastVerifiedAt: null,
        sourceUrl: '',
        isStaticFallback: true,
      };
    }
    return null;
  } catch (e) {
    console.error('getUniversityBySlugDB error', e);
    return null;
  }
}

export async function getCourseBySlugDB(slug: string): Promise<any | null> {
  try {
    const course = await db.crmCourse.findFirst({
      where: { OR: [{ slug }, { courseId: slug }] },
      include: {
        university: { select: { universityId: true, name: true, slug: true, country: true, city: true, website: true } },
        intakeFees: { where: { status: 'active' }, orderBy: { intakeYear: 'desc' }, take: 20 },
        requirements: { take: 10 },
        scholarshipRecords: { where: { status: 'active' }, take: 10 },
        commissions: { take: 1 }, // For internal, but will be blocked for public
      },
    });
    if (course) {
      // Block commission for public API
      const { commissions, ...safe } = course as any;
      return safe;
    }
    return null;
  } catch (e) {
    console.error('getCourseBySlugDB error', e);
    return null;
  }
}

export async function getFaqsForPage(targetType: string, targetSlug: string, limit = 10): Promise<any[]> {
  try {
    const faqs = await db.unifiedFaq.findMany({
      where: { OR: [{ targetType, targetSlug }, { targetType: 'general' }], status: 'active' },
      orderBy: { sortOrder: 'asc' },
      take: limit,
    }).catch(() => []);

    if (faqs.length > 0) return faqs;

    // Fallback to country or homepage FAQs
    if (targetType === 'country') {
      const country = await db.country.findFirst({ where: { slug: targetSlug }, select: { id: true } }).catch(() => null);
      if (country) {
        const countryFaqs = await db.countryFaq.findMany({ where: { countryId: country.id, status: 'active' }, take: limit }).catch(() => []);
        return countryFaqs.map((f: any) => ({ question: f.question, answer: f.answer, category: 'general' }));
      }
    }

    // Fallback to homepage FAQs
    const homeFaqs = await db.homepageFaq.findMany({ where: { status: 'active' }, take: limit, orderBy: { sortOrder: 'asc' } }).catch(() => []);
    return homeFaqs.map((f: any) => ({ question: f.question, answer: f.answer, category: 'general' }));
  } catch (e) {
    console.error('getFaqsForPage error', e);
    return [];
  }
}

export async function getScholarshipBySlugDB(slug: string): Promise<any | null> {
  try {
    const scholarship = await db.scholarship.findFirst({
      where: { slug, status: 'active' },
      include: { faqs: { where: { status: 'active' }, orderBy: { sortOrder: 'asc' }, take: 10 } },
    });
    return scholarship;
  } catch (e) {
    console.error('getScholarshipBySlugDB error', e);
    return null;
  }
}

export async function getServiceBySlugDB(slug: string): Promise<any | null> {
  try {
    const service = await db.service.findFirst({
      where: { slug, status: 'active' },
      include: { faqs: { where: { status: 'active' }, orderBy: { sortOrder: 'asc' }, take: 15 } },
    });
    if (service) return service;

    // Fallback to static
    const { getServiceBySlug } = await import('@/lib/services-data');
    const staticService = getServiceBySlug(slug);
    if (staticService) {
      return {
        id: staticService.id,
        slug: staticService.slug,
        title: staticService.title,
        shortDescription: staticService.shortDesc,
        longDescription: staticService.longDescription,
        heroImage: staticService.heroImage,
        benefits: staticService.benefits,
        processSteps: JSON.stringify(staticService.processSteps),
        whoIsFor: JSON.stringify(staticService.whoIsItFor),
        requiredDocuments: JSON.stringify(staticService.requiredDocuments),
        faqs: staticService.faqs.map((f: any, i: number) => ({ question: f.question, answer: f.answer, sortOrder: i })),
        isStaticFallback: true,
        verificationStatus: 'NEEDS_REVIEW',
      };
    }
    return null;
  } catch (e) {
    console.error('getServiceBySlugDB error', e);
    return null;
  }
}

export async function getResourceBySlugDB(slug: string): Promise<any | null> {
  try {
    const resource = await db.resource.findFirst({
      where: { slug, status: 'active' },
      include: { category: true, faqs: { where: { status: 'active' }, take: 10 } },
    });
    return resource;
  } catch (e) {
    console.error('getResourceBySlugDB error', e);
    return null;
  }
}

// Weekly update workflow per spec section 25
export async function createWeeklyUpdateCheck(targetType: string, targetId: string, targetName: string, fieldName: string, oldValue: string, newValue: string, sourceUrl: string, evidence: string, aiConfidence: number) {
  try {
    const existing = await db.weeklyUpdateRequest.findFirst({
      where: { targetType, targetId, fieldName, status: 'PENDING_REVIEW' },
    });
    if (existing) return existing; // Avoid duplicate pending

    const request = await db.weeklyUpdateRequest.create({
      data: {
        targetType,
        targetId,
        targetName,
        fieldName,
        oldValue,
        newValue,
        sourceUrl,
        evidence,
        aiConfidence,
        status: 'PENDING_REVIEW',
      },
    });

    // Also create UniversityUpdateRequest for backward compatibility
    if (targetType === 'university' || targetType === 'course') {
      await db.universityUpdateRequest.create({
        data: {
          universityId: targetType === 'university' ? targetId : '',
          courseId: targetType === 'course' ? targetId : '',
          entityType: targetType,
          entityName: targetName,
          fieldName,
          oldValue,
          newValue,
          evidenceUrl: sourceUrl,
          aiConfidence,
          status: 'pending_approval',
        },
      }).catch(() => {});
    }

    await db.auditLog.create({
      data: {
        userId: 'system',
        action: 'WEEKLY_UPDATE_DETECTED',
        resource: targetType,
        resourceId: targetId,
        details: JSON.stringify({ fieldName, oldValue, newValue, sourceUrl, aiConfidence }),
        actorRole: 'system',
      },
    }).catch(() => {});

    return request;
  } catch (e) {
    console.error('createWeeklyUpdateCheck error', e);
    return null;
  }
}

// UNIFIED UNIVERSITY, COURSE, SCHOLARSHIP, SERVICE, RESOURCE SYSTEM
// Public catalogue queries reuse canonical publication/source rules; no university demo fallback.

import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';
import { hasCurrentScholarshipSourceVerification } from '@/lib/scholarships/status-engine';
import { publicUniversityWhere, publicCourseWhere, publicUniversityIdentifierWhere, publicCourseIdentifierWhere, publicIntakeWhere, publicRequirementWhere, publicScholarshipWhere, publicCrmScholarshipWhere, stripInternalFields } from '@/lib/public-catalog';

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
  const requested = options?.limit ?? 8;
  const limit = Number.isSafeInteger(requested) ? Math.max(1, Math.min(20, requested)) : 8;
  const related: RelatedContentItem[] = [];

  try {
    const type = sourceType.toUpperCase();
    if (['SERVICE', 'RESOURCE', 'SCHOLARSHIP'].includes(type)) {
      let source: { id: string } | null = null;
      const identity = sourceId ? { id: sourceId } : { slug: sourceSlug };
      if (type === 'SERVICE') source = await db.service.findFirst({ where: { ...identity, status: 'PUBLISHED' }, select: { id: true } });
      if (type === 'RESOURCE') source = await db.resource.findFirst({ where: { ...identity, status: 'PUBLISHED', category: { status: 'ACTIVE' } }, select: { id: true } });
      if (type === 'SCHOLARSHIP') source = await db.scholarship.findFirst({ where: { ...identity, ...publicScholarshipWhere() }, select: { id: true } });
      if (!source) return [];
      const links = await db.contentRelationship.findMany({ where: { status: 'ACTIVE', OR: [{ sourceType: type, sourceId: source.id }, { targetType: type, targetId: source.id }] }, orderBy: { sortOrder: 'asc' }, take: limit });
      for (const link of links) {
        const outgoing = link.sourceType === type && link.sourceId === source.id;
        const targetType = outgoing ? link.targetType : link.sourceType;
        const targetId = outgoing ? link.targetId : link.sourceId;
        if (targetType === 'SERVICE') {
          const item = await db.service.findFirst({ where: { id: targetId, status: 'PUBLISHED' }, select: { id: true, slug: true, title: true } });
          if (item) related.push({ ...item, type: 'service', relation: link.relationshipType, score: 1 });
        }
        if (targetType === 'RESOURCE') {
          const item = await db.resource.findFirst({ where: { id: targetId, status: 'PUBLISHED', category: { status: 'ACTIVE' } }, include: { category: { select: { slug: true } } } });
          if (item?.category) related.push({ id: item.id, slug: `${item.category.slug}/${item.slug}`, title: item.title, type: 'resource', relation: link.relationshipType, score: 1 });
        }
        if (targetType === 'SCHOLARSHIP') {
          const item = await db.scholarship.findFirst({ where: { id: targetId, ...publicScholarshipWhere() }, select: { id: true, slug: true, name: true } });
          if (item) related.push({ id: item.id, slug: item.slug, title: item.name, type: 'scholarship', relation: link.relationshipType, score: 1 });
        }
      }
    }

    // Fallback: compute dynamically based on priority
    const { country, universityId, subjectArea, studyLevel } = options || {};

    // 1. Exact relationship — same university courses
    if (universityId) {
      const coursesSameUni = await db.crmCourse.findMany({
        where: { AND: [publicCourseWhere(), { universityId }] },
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
        where: { AND: [publicUniversityWhere(), { country }] },
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
        where: { AND: [publicCourseWhere(), { subjectArea }] },
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
        where: { AND: [publicCourseWhere(), { studyLevel }] },
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
      const where: any = { ...publicScholarshipWhere() };
      if (country) where.country = country;
      if (universityId) where.universityId = universityId;
      const scholarships = await db.scholarship.findMany({
        where,
        take: 3,
        select: { id: true, slug: true, name: true, country: true, verificationStatus: true, lastVerifiedAt: true, officialSourceUrl: true },
      }).catch(() => []);
      scholarships.filter((s: any) => hasCurrentScholarshipSourceVerification({
        verificationStatus: s.verificationStatus,
        lastVerifiedAt: s.lastVerifiedAt,
        officialSourceUrl: s.officialSourceUrl,
      })).forEach((s: any) => {
        related.push({ id: s.id, type: 'scholarship', slug: s.slug, title: s.name, subtitle: s.country, relation: country ? 'same_destination' : 'same_tag', score: 0.65 });
      });
    }

    // 6. Related services
    if (related.length < limit) {
      const services = await db.service.findMany({ where: { status: 'PUBLISHED' }, take: 3, orderBy: { sortOrder: 'asc' }, select: { id: true, slug: true, title: true } }).catch(() => []);
      services.forEach((s: any) => {
        related.push({ id: s.id, type: 'service', slug: s.slug, title: s.title, relation: 'same_tag', score: 0.5 });
      });
    }

    // 7. Related resources
    if (related.length < limit) {
      const resources = await db.resource.findMany({ where: { status: 'PUBLISHED', category: { status: 'ACTIVE' } }, take: 3, orderBy: { sortOrder: 'asc' }, select: { id: true, slug: true, title: true, category: { select: { slug: true } } } }).catch(() => []);
      resources.forEach((r: any) => {
        related.push({ id: r.id, type: 'resource', slug: `${r.category.slug}/${r.slug}`, title: r.title, relation: 'same_tag', score: 0.45 });
      });
    }

    // Sort by score and limit
    related.sort((a, b) => b.score - a.score);
    return related.filter((item, index, all) => all.findIndex(other => other.type === item.type && other.id === item.id) === index).slice(0, limit);
  } catch (e) {
    console.error('getRelatedContent error', e);
    return [];
  }
}

/** Public helper only. Staff must use their separately authorized APIs. */
export async function getUniversityBySlugDB(slug: string): Promise<any | null> {
  const where = publicUniversityIdentifierWhere(slug);
  if (!where) return null;
  try {
    const uni = await db.crmUniversity.findFirst({
      where,
      include: {
        courses: { where: publicCourseWhere(), take: 20, select: { courseId: true, courseTitle: true, slug: true, studyLevel: true, subjectArea: true, country: true } },
        scholarshipRecords: { where: publicCrmScholarshipWhere(), take: 10 },
        requirements: { where: publicRequirementWhere(), take: 10 },
        intakeFees: { where: publicIntakeWhere(), take: 20, orderBy: { intakeYear: 'desc' } },
        rankingRecords: { where: { verificationStatus: 'VERIFIED' }, take: 5, orderBy: { rankingYear: 'desc' } },
      },
    });
    return uni ? stripInternalFields(uni) : null;
  } catch (e) {
    console.error('getUniversityBySlugDB error', e);
    return null;
  }
}

export async function getCourseBySlugDB(slug: string): Promise<any | null> {
  const where = publicCourseIdentifierWhere(slug);
  if (!where) return null;
  try {
    const course = await db.crmCourse.findFirst({
      where,
      include: {
        university: { select: { universityId: true, name: true, slug: true, country: true, city: true, website: true } },
        intakeFees: { where: publicIntakeWhere(), orderBy: { intakeYear: 'desc' }, take: 20 },
        requirements: { where: publicRequirementWhere(), take: 10 },
        scholarshipRecords: { where: publicCrmScholarshipWhere(), take: 10 },
      },
    });
    return course ? stripInternalFields(course) : null;
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
      where: { slug, ...publicScholarshipWhere() },
      include: { faqs: { where: { status: 'active' }, orderBy: { sortOrder: 'asc' }, take: 10 } },
    });
    return scholarship && hasCurrentScholarshipSourceVerification({
      verificationStatus: scholarship.verificationStatus,
      lastVerifiedAt: scholarship.lastVerifiedAt,
      officialSourceUrl: scholarship.officialSourceUrl,
    }) ? scholarship : null;
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

// Creates proposals only, never verifies or publishes catalogue data. Legacy
// queue mirroring and a namespace-aware audit commit with the proposal or fail.
export async function createWeeklyUpdateCheck(targetType: string, targetId: string, targetName: string, fieldName: string, oldValue: string, newValue: string, sourceUrl: string, evidence: string, aiConfidence: number, auth: AuthContext) {
  return db.$transaction(async tx => {
    const existing = await tx.weeklyUpdateRequest.findFirst({
      where: { targetType, targetId, fieldName, status: 'PENDING_REVIEW' },
    });
    if (existing) return existing; // Best-effort deduplication, not a unique constraint.

    const proposal = await tx.weeklyUpdateRequest.create({
      data: { targetType, targetId, targetName, fieldName, oldValue, newValue, sourceUrl, evidence, aiConfidence, status: 'PENDING_REVIEW' },
    });
    if (targetType === 'university' || targetType === 'course') {
      await tx.universityUpdateRequest.create({
        data: {
          universityId: targetType === 'university' ? targetId : '',
          courseId: targetType === 'course' ? targetId : '',
          entityType: targetType, entityName: targetName, fieldName, oldValue,
          newValue, evidenceUrl: sourceUrl, aiConfidence, status: 'pending_approval',
        },
      });
    }
    await tx.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId,
        action: 'CATALOG_UPDATE_PROPOSED', entityType: 'WeeklyUpdateRequest', entityId: proposal.id,
        metadata: JSON.stringify({ identityDomain: auth.identityDomain, effectiveUserId: auth.userId, targetType, targetId, fieldName }),
      },
    });
    return proposal;
  });
}

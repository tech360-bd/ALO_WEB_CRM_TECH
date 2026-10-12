import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { db } from '@/lib/db';
import { withAuth, logAuditAction, type AuthContext } from '@/lib/auth-middleware';
import { generateText, extractJson } from '@/lib/ai';
import {
  ALO_BUILDER_CONTENT_TYPES,
  BUILDER_IMAGE_LIBRARY,
  canonicalizeCountry,
  parseBuilderDocument,
  parseBuilderPrompt,
  recommendedBuilderImages,
  slugifyBuilderText,
  statusForRecord,
  validateBuilderDocument,
  type AloBuilderDocument,
  type AloBuilderInput,
  type BuilderEntityRef,
  type BuilderGroundedFact,
  type BuilderImage,
} from '@/lib/alo-short-form-builder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUILDER_TAG = 'alo-short-form-builder';
const ASSET_TYPE = 'ALO_PAGE';
const WEBSITE_BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com').replace(/\/$/, '');

function isBuilderUser(auth: AuthContext): boolean {
  const roles = new Set(auth.roles.map((role) => role.toLowerCase()));
  const userType = auth.userType.toLowerCase();
  return [
    'super_admin', 'admin', 'content_manager', 'content_editor', 'marketing_manager', 'marketing',
  ].some((role) => roles.has(role) || userType === role);
}

function isApprover(auth: AuthContext): boolean {
  const roles = new Set(auth.roles.map((role) => role.toLowerCase()));
  return ['super_admin', 'admin'].some((role) => roles.has(role)) || ['super_admin', 'admin'].includes(auth.userType.toLowerCase());
}

function forbidden(message = 'Builder access is restricted to authorized content and admin users.') {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

function cleanText(value: unknown, max = 300): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function sourceName(sourceUrl: string | null | undefined): string {
  if (!sourceUrl) return '';
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function parseJsonArray(value: string | null | undefined): any[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isoOrNull(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function tagList(asset: any): string[] {
  return parseJsonArray(asset?.tags).filter((tag) => typeof tag === 'string');
}

function hasBuilderTag(asset: any): boolean {
  return asset?.contentType === ASSET_TYPE && tagList(asset).includes(BUILDER_TAG);
}

function pageTitle(input: AloBuilderInput, countryName: string): string {
  if (input.contentType === 'Course Page' && input.course) return `${input.course} | Course Guide`;
  if (input.contentType === 'University Page' && input.university) return `${input.university} | University Guide`;
  if (input.contentType === 'Scholarship Page') return `${input.subject || 'Scholarship'} opportunities in ${countryName || 'your destination'}`;
  if (input.contentType === 'English Test Guide') return `${input.subject || 'English test'} guide for ${countryName || 'international study'}`;
  const subject = input.subject || input.course || 'International Study';
  return `${countryName || 'Study Abroad'} ${subject} ${input.contentType}`.replace(/\s+/g, ' ').trim();
}

function addFact(
  facts: BuilderGroundedFact[],
  label: string,
  value: unknown,
  entityType: string,
  entityId: string,
  sourceUrl: string | null | undefined,
  verificationStatus: string | null | undefined,
  lastVerifiedAt: string | Date | null | undefined,
) {
  if (!nonEmpty(value)) return;
  const url = typeof sourceUrl === 'string' && /^https:\/\//i.test(sourceUrl) ? sourceUrl : undefined;
  facts.push({
    id: `${entityType}:${entityId}:${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    label,
    value: String(value).trim(),
    entityType,
    entityId,
    status: statusForRecord(verificationStatus, lastVerifiedAt, true),
    sourceName: sourceName(url),
    sourceUrl: url,
    lastVerifiedAt: isoOrNull(lastVerifiedAt),
  });
}

function safeEntity(
  type: BuilderEntityRef['type'],
  record: any,
  name: string,
  href: string,
): BuilderEntityRef {
  return {
    type,
    id: record?.id || record?.courseId || record?.universityId,
    name,
    slug: record?.slug || undefined,
    href,
    verificationStatus: statusForRecord(record?.verificationStatus, record?.lastVerifiedAt, Boolean(record)),
    sourceUrl: record?.sourceUrl || record?.officialUrl || record?.officialInternationalAdmissionsUrl || undefined,
    lastVerifiedAt: record?.lastVerifiedAt ? String(record.lastVerifiedAt) : null,
  };
}

async function getImageMetadata(url: string) {
  const publicRoot = path.resolve(process.cwd(), 'public');
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return null;
  }
  if (!decoded.startsWith('/images/') || decoded.includes('..') || decoded.includes('\\')) return null;
  const absolute = path.resolve(publicRoot, `.${decoded}`);
  if (!absolute.startsWith(`${publicRoot}${path.sep}`)) return null;
  try {
    await access(absolute);
    const fileInfo = await stat(absolute);
    const imageInfo = await sharp(absolute, { failOn: 'error' }).metadata();
    if (!fileInfo.isFile() || !imageInfo.width || !imageInfo.height) return null;
    return {
      width: imageInfo.width,
      height: imageInfo.height,
      aspectRatio: Number((imageInfo.width / imageInfo.height).toFixed(4)),
      bytes: fileInfo.size,
      absolute,
    };
  } catch {
    return null;
  }
}

async function hydrateImageMetadata(images: BuilderImage[]) {
  const brokenImageIds: string[] = [];
  const hydrated: BuilderImage[] = [];
  for (const image of images) {
    const metadata = await getImageMetadata(image.url);
    if (!metadata) {
      brokenImageIds.push(image.id);
      hydrated.push({ ...image, width: 0, height: 0, aspectRatio: 0, verified: false });
      continue;
    }
    hydrated.push({
      ...image,
      width: metadata.width,
      height: metadata.height,
      aspectRatio: metadata.aspectRatio,
    });
  }
  return { images: hydrated, brokenImageIds };
}

async function loadEntityContext(input: AloBuilderInput) {
  const requestedCountry = canonicalizeCountry(input.country);
  let country: any = null;
  let countryPage: any = null;
  let university: any = null;
  let selectedCourse: any = null;
  let relatedUniversities: any[] = [];
  let relatedCourses: any[] = [];
  let scholarships: any[] = [];
  let sourceRecords: any[] = [];

  try {
    if (requestedCountry) {
      country = await db.country.findFirst({
        where: {
          OR: [
            { name: { equals: requestedCountry } },
            { name: { contains: requestedCountry } },
            { slug: { equals: slugifyBuilderText(requestedCountry) } },
            { code: { equals: requestedCountry.toUpperCase() } },
          ],
        },
        include: { sources: { where: { status: 'active' }, orderBy: { lastVerifiedAt: 'desc' }, take: 5 } },
      });
      countryPage = await db.countryPage.findFirst({
        where: {
          OR: [
            { name: { equals: requestedCountry } },
            { name: { contains: requestedCountry } },
            { slug: { equals: slugifyBuilderText(requestedCountry) } },
            ...(country?.slug ? [{ slug: country.slug }] : []),
          ],
        },
      });
    }

    if (input.university.trim()) {
      university = await db.crmUniversity.findFirst({
        where: {
          OR: [
            { universityId: input.university.trim() },
            { slug: input.university.trim() },
            { name: { contains: input.university.trim() } },
          ],
          ...(country?.name ? { country: { contains: country.name } } : {}),
        },
      });
    }

    if (input.course.trim()) {
      selectedCourse = await db.crmCourse.findFirst({
        where: {
          OR: [
            { courseId: input.course.trim() },
            { slug: input.course.trim() },
            { courseTitle: { contains: input.course.trim() } },
            { name: { contains: input.course.trim() } },
          ],
          ...(university?.universityId ? { universityId: university.universityId } : {}),
        },
        include: {
          university: true,
          intakeFees: { where: { intakeYear: { gte: 2027, lte: 2028 }, status: 'active' }, orderBy: [{ intakeYear: 'asc' }, { intakeMonth: 'asc' }], take: 4 },
          requirements: { take: 2 },
          englishRequirements: { take: 6 },
          scholarshipRecords: { where: { status: 'active' }, take: 5 },
        },
      });
      if (!university && selectedCourse?.university) university = selectedCourse.university;
    }

    const countryName = country?.name || countryPage?.name || requestedCountry;
    const universityWhere: any = {};
    if (countryName) universityWhere.country = { contains: countryName };
    if (university?.universityId) universityWhere.universityId = { not: university.universityId };
    relatedUniversities = await db.crmUniversity.findMany({
      where: universityWhere,
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      take: 5,
      select: {
        id: true, universityId: true, name: true, slug: true, country: true, city: true,
        verificationStatus: true, status: true, publicationStatus: true, sourceUrl: true, officialUrl: true, lastVerifiedAt: true,
      },
    });

    const courseWhere: any = {
      status: { in: ['active', 'verified', 'published'] },
    };
    if (input.subject.trim()) courseWhere.subjectArea = { contains: input.subject.trim() };
    if (input.degree.trim()) courseWhere.OR = [{ studyLevel: { contains: input.degree.trim() } }, { qualification: { contains: input.degree.trim() } }];
    if (countryName) {
      const countryScope = { OR: [{ country: { contains: countryName } }, { university: { country: { contains: countryName } } }] };
      courseWhere.AND = [...(courseWhere.AND || []), countryScope];
    }
    if (selectedCourse?.courseId) {
      courseWhere.courseId = { not: selectedCourse.courseId };
    }
    relatedCourses = await db.crmCourse.findMany({
      where: courseWhere,
      orderBy: [{ courseTitle: 'asc' }],
      take: 8,
      include: {
        university: { select: { name: true, universityId: true, slug: true, country: true, city: true, verificationStatus: true, sourceUrl: true, officialUrl: true, lastVerifiedAt: true } },
        intakeFees: { where: { intakeYear: { gte: 2027, lte: 2028 }, status: 'active' }, orderBy: [{ intakeYear: 'asc' }, { intakeMonth: 'asc' }], take: 2 },
      },
    });

    if (countryName) {
      scholarships = await db.scholarship.findMany({
        where: {
          OR: [
            { country: { contains: countryName } },
            ...(country?.id ? [{ countryId: country.id }] : []),
            ...(university?.universityId ? [{ universityId: university.universityId }] : []),
          ],
          status: { in: ['PUBLISHED', 'active', 'ACTIVE'] },
        },
        take: 6,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, name: true, slug: true, country: true, university: true, fundingAmount: true,
          currency: true, deadline: true, officialSourceUrl: true, verificationStatus: true, lastVerifiedAt: true,
        },
      });
    }

    const officialSourceWhere: any[] = [];
    if (university?.slug) officialSourceWhere.push({ universitySlug: university.slug });
    if (selectedCourse?.slug) officialSourceWhere.push({ courseSlug: selectedCourse.slug });
    if (country?.slug) officialSourceWhere.push({ countrySlug: country.slug });
    if (officialSourceWhere.length) {
      sourceRecords = await db.officialSource.findMany({
        where: { OR: officialSourceWhere, verificationStatus: { in: ['verified', 'VERIFIED'] } },
        orderBy: { lastVerifiedAt: 'desc' },
        take: 8,
        select: { sourceUrl: true, sourceType: true, sourceTitle: true, targetType: true, targetSlug: true, dataSection: true, verificationStatus: true, lastVerifiedAt: true },
      });
    }
  } catch (error) {
    console.error('[alo-builder] database lookup failed', error instanceof Error ? error.message : 'unknown');
    throw new Error('The ALO data catalogue could not be queried. No factual page was generated.');
  }

  const facts: BuilderGroundedFact[] = [];
  const entities: BuilderEntityRef[] = [];
  const countryName = country?.name || countryPage?.name || requestedCountry;
  const countrySlug = countryPage?.slug || country?.slug;
  const countrySource = countryPage?.sourceUrl || country?.sources?.find((source: any) => source.sourceUrl)?.sourceUrl;
  const countryVerification = countryPage?.verificationStatus || (countrySource ? 'VERIFIED' : 'NEEDS_REVIEW');
  const countryLastVerified = countryPage?.lastVerifiedAt || country?.lastVerifiedAt || country?.sources?.find((source: any) => source.lastVerifiedAt)?.lastVerifiedAt;
  if (countryName) {
    entities.push({
      type: 'country', id: country?.id || countryPage?.id, name: countryName, slug: countrySlug,
      href: countrySlug ? `/destinations/${countrySlug}` : undefined,
      verificationStatus: statusForRecord(countryVerification, countryLastVerified, Boolean(country || countryPage)),
      sourceUrl: countrySource || undefined,
      lastVerifiedAt: countryLastVerified ? new Date(countryLastVerified).toISOString() : null,
    });
    const countryEntityId = country?.id || countryPage?.id || countrySlug || 'unmatched-country';
    addFact(facts, 'Destination', countryName, 'country', countryEntityId, countrySource, countryVerification, countryLastVerified);
    addFact(facts, 'Country capital', countryPage?.capital || country?.capital, 'country', countryEntityId, countrySource, countryVerification, countryLastVerified);
    addFact(facts, 'Currency', countryPage?.currency || country?.currency, 'country', countryEntityId, countrySource, countryVerification, countryLastVerified);
    addFact(facts, 'Recorded visa overview', country?.visaOverview, 'country', countryEntityId, countrySource, countryVerification, countryLastVerified);
  }

  if (university) {
    const universitySlug = university.slug || slugifyBuilderText(university.name);
    entities.push(safeEntity('university', university, university.name, `/universities/${universitySlug}`));
    addFact(facts, 'University name', university.name, 'university', university.id, university.sourceUrl || university.officialUrl, university.verificationStatus, university.lastVerifiedAt);
    addFact(facts, 'University location', [university.city, university.country].filter(Boolean).join(', '), 'university', university.id, university.sourceUrl || university.officialUrl, university.verificationStatus, university.lastVerifiedAt);
    addFact(facts, 'Recorded ranking', university.worldRanking > 0 ? `#${university.worldRanking}` : '', 'university', university.id, university.rankingSourceUrl || university.sourceUrl, university.verificationStatus, university.lastVerifiedAt);
    addFact(facts, 'International student support', university.internationalStudentSupportSummary, 'university', university.id, university.officialInternationalAdmissionsUrl || university.sourceUrl, university.verificationStatus, university.lastVerifiedAt);
  } else if (input.university.trim()) {
    entities.push({ type: 'university', name: input.university.trim(), verificationStatus: 'MISSING' });
  }

  if (selectedCourse) {
    const courseSlug = selectedCourse.slug || slugifyBuilderText(`${selectedCourse.courseTitle}-${university?.name || ''}`);
    entities.push(safeEntity('course', selectedCourse, selectedCourse.courseTitle, `/courses/${courseSlug}`));
    addFact(facts, 'Course title', selectedCourse.courseTitle, 'course', selectedCourse.id, selectedCourse.sourceUrl || selectedCourse.officialUrl, selectedCourse.verificationStatus, selectedCourse.lastVerifiedAt);
    addFact(facts, 'Course level', selectedCourse.studyLevel || selectedCourse.qualification, 'course', selectedCourse.id, selectedCourse.sourceUrl || selectedCourse.officialUrl, selectedCourse.verificationStatus, selectedCourse.lastVerifiedAt);
    addFact(facts, 'Course subject', selectedCourse.subjectArea, 'course', selectedCourse.id, selectedCourse.sourceUrl || selectedCourse.officialUrl, selectedCourse.verificationStatus, selectedCourse.lastVerifiedAt);
    addFact(facts, 'Duration', selectedCourse.durationMonths > 0 ? `${selectedCourse.durationMonths} months` : '', 'course', selectedCourse.id, selectedCourse.sourceUrl || selectedCourse.officialUrl, selectedCourse.verificationStatus, selectedCourse.lastVerifiedAt);
    for (const intake of selectedCourse.intakeFees || []) {
      const source = intake.intakeSourceUrl || intake.feeSourceUrl;
      addFact(facts, `${intake.intakeMonth} ${intake.intakeYear} intake`, intake.applicationDeadline ? `Recorded intake; deadline: ${intake.applicationDeadline}` : 'Recorded intake', 'course', selectedCourse.id, source, intake.verificationStatus, intake.lastCheckedAt);
      addFact(facts, `${intake.intakeMonth} ${intake.intakeYear} tuition`, intake.yearlyTuition > 0 ? `${intake.tuitionCurrency || ''} ${intake.yearlyTuition}`.trim() : '', 'course', selectedCourse.id, intake.feeSourceUrl, intake.verificationStatus, intake.lastCheckedAt);
    }
    for (const requirement of selectedCourse.requirements || []) {
      addFact(facts, 'Academic entry requirement', requirement.academicReq, 'course', selectedCourse.id, requirement.officialRequirementUrl || selectedCourse.sourceUrl, requirement.verificationStatus, requirement.lastCheckedAt);
      if (requirement.ieltsOverall > 0) addFact(facts, 'IELTS requirement', `Overall ${requirement.ieltsOverall}${requirement.ieltsMinBand > 0 ? `; no component below ${requirement.ieltsMinBand}` : ''}`, 'course', selectedCourse.id, requirement.officialRequirementUrl || selectedCourse.sourceUrl, requirement.verificationStatus, requirement.lastCheckedAt);
      if (requirement.pteOverall > 0) addFact(facts, 'PTE requirement', `Overall ${requirement.pteOverall}`, 'course', selectedCourse.id, requirement.officialRequirementUrl || selectedCourse.sourceUrl, requirement.verificationStatus, requirement.lastCheckedAt);
      if (requirement.toeflOverall > 0) addFact(facts, 'TOEFL requirement', `Overall ${requirement.toeflOverall}`, 'course', selectedCourse.id, requirement.officialRequirementUrl || selectedCourse.sourceUrl, requirement.verificationStatus, requirement.lastCheckedAt);
      if (requirement.detOverall > 0) addFact(facts, 'Duolingo requirement', `Overall ${requirement.detOverall}`, 'course', selectedCourse.id, requirement.officialRequirementUrl || selectedCourse.sourceUrl, requirement.verificationStatus, requirement.lastCheckedAt);
    }
    for (const english of selectedCourse.englishRequirements || []) {
      const overall = Number(english.overallScore) > 0 ? String(english.overallScore) : '';
      addFact(facts, `${english.testType} English requirement`, overall ? `Overall ${overall}` : english.remarks, 'course', selectedCourse.id, english.sourceUrl || selectedCourse.sourceUrl, selectedCourse.verificationStatus, english.lastVerifiedAt);
    }
  } else if (input.course.trim()) {
    entities.push({ type: 'course', name: input.course.trim(), verificationStatus: 'MISSING' });
  }

  if (input.subject.trim()) entities.push({ type: 'subject', name: input.subject.trim(), verificationStatus: 'RESEARCH_REQUIRED' });
  if (input.degree.trim()) entities.push({ type: 'degree', name: input.degree.trim(), verificationStatus: 'RESEARCH_REQUIRED' });
  if (input.intake.trim()) entities.push({ type: 'intake', name: input.intake.trim(), verificationStatus: 'RESEARCH_REQUIRED' });

  for (const scholarship of scholarships) {
    const recordSource = scholarship.officialSourceUrl;
    entities.push({
      type: 'scholarship', id: scholarship.id, name: scholarship.name, slug: scholarship.slug,
      href: scholarship.slug ? `/scholarships/${scholarship.slug}` : undefined,
      verificationStatus: statusForRecord(scholarship.verificationStatus, scholarship.lastVerifiedAt, true),
      sourceUrl: recordSource || undefined,
      lastVerifiedAt: scholarship.lastVerifiedAt ? new Date(scholarship.lastVerifiedAt).toISOString() : null,
    });
    addFact(facts, 'Scholarship name', scholarship.name, 'scholarship', scholarship.id, recordSource, scholarship.verificationStatus, scholarship.lastVerifiedAt);
    addFact(facts, 'Recorded scholarship award', scholarship.fundingAmount, 'scholarship', scholarship.id, recordSource, scholarship.verificationStatus, scholarship.lastVerifiedAt);
    addFact(facts, 'Recorded scholarship deadline', scholarship.deadline, 'scholarship', scholarship.id, recordSource, scholarship.verificationStatus, scholarship.lastVerifiedAt);
  }

  const links: AloBuilderDocument['links'] = [];
  const addLink = (label: string, href: string | undefined, relationship: string, type?: string, id?: string) => {
    if (!href || links.some((link) => link.href === href)) return;
    links.push({ label, href, relationship, entityType: type, entityId: id, status: 'VALID' });
  };
  if (countrySlug) addLink(`${countryName} destination guide`, `/destinations/${countrySlug}`, 'parent destination', 'country', country?.id || countryPage?.id);
  if (university?.slug || university?.universityId) addLink(`Explore ${university.name}`, `/universities/${university.slug || university.universityId}`, 'related university', 'university', university.id);
  for (const course of [selectedCourse, ...relatedCourses].filter(Boolean).slice(0, 5)) {
    const slug = course.slug || slugifyBuilderText(`${course.courseTitle}-${course.university?.name || ''}`);
    addLink(`${course.courseTitle}`, `/courses/${slug}`, course === selectedCourse ? 'featured course' : 'related course', 'course', course.id);
  }
  for (const scholarship of scholarships.slice(0, 3)) addLink(scholarship.name, `/scholarships/${scholarship.slug}`, 'related scholarship', 'scholarship', scholarship.id);
  addLink('Application process', '/application-process', 'student journey');
  addLink('Book counselling', '/book-consultation', 'student journey CTA');

  return {
    country,
    countryPage,
    university,
    selectedCourse,
    relatedUniversities,
    relatedCourses,
    scholarships,
    sourceRecords,
    countryName,
    countrySlug,
    facts,
    entities,
    links,
  };
}

async function findLikelyDuplicate(title: string, prompt: string, exceptId?: string) {
  const candidates = await db.contentAsset.findMany({
    where: {
      contentType: ASSET_TYPE,
      tags: { contains: BUILDER_TAG },
      status: { not: 'ARCHIVED' },
      ...(exceptId ? { id: { not: exceptId } } : {}),
      OR: [
        { title: { equals: title } },
        { topic: { equals: prompt } },
        { title: { contains: title.split(' ').slice(0, 3).join(' ') } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: 6,
    select: { id: true, title: true, slug: true, status: true, topic: true, updatedAt: true },
  });
  const titleKey = title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const promptKey = prompt.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const score = (candidate: any) => {
    const otherTitle = String(candidate.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const otherPrompt = String(candidate.topic || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (titleKey && otherTitle === titleKey) return 1;
    if (promptKey && otherPrompt === promptKey) return 1;
    const left = new Set(`${titleKey} ${promptKey}`.split(/\s+/).filter((word) => word.length > 2));
    const right = new Set(`${otherTitle} ${otherPrompt}`.split(/\s+/).filter((word) => word.length > 2));
    const intersection = [...left].filter((word) => right.has(word)).length;
    const union = new Set([...left, ...right]).size;
    return union ? intersection / union : 0;
  };
  const best = candidates.map((candidate) => ({ ...candidate, similarity: score(candidate) })).sort((a, b) => b.similarity - a.similarity)[0];
  return best && best.similarity >= 0.72 ? best : null;
}

function buildSafeFactsForPrompt(facts: BuilderGroundedFact[]) {
  return facts
    .filter((fact) => fact.status === 'VERIFIED' && fact.sourceUrl)
    .map(({ label, value, sourceName, sourceUrl, lastVerifiedAt }) => ({ label, value, sourceName, sourceUrl, lastVerifiedAt }));
}

async function generateStructuredCopy(input: AloBuilderInput, title: string, facts: BuilderGroundedFact[], entityNames: string[]) {
  const model = process.env.ALO_BUILDER_MODEL || process.env.AI_DEFAULT_MODEL || 'llama-3.3-70b-versatile';
  const systemPrompt = [
    'You are the editorial assistant inside ALO Education’s short-form page builder.',
    'Create concise, helpful page copy for the requested study-abroad page. This is a draft, never an authority source.',
    'Do not invent or assert tuition, application fees, deadlines, dates of availability, admission requirements, English test scores, rankings, visa/work rules, scholarships, campus facts, student counts, accreditation, or career guarantees.',
    'Do not invent university, course, scholarship, city, or country names. Only use names included in the supplied matched entity list.',
    'Use only supplied verified facts when repeating facts. A requested intake is a target topic, NOT proof that a course is open for that intake.',
    'Where the record does not provide evidence, write exactly “Information currently being verified.”',
    'Write generic practical editorial guidance and label it as guidance, not official policy. Avoid numerical claims, guarantees and comparative superlatives.',
    'Return ONLY valid JSON with keys: title, seoTitle, metaDescription, heroTitle, heroDescription, sections, faqs.',
    'sections must be an array of 3 or 4 objects {title, type, body, bullets}; type is editorial or steps; body is 2-4 short sentences; bullets is an array of up to 4 concise strings.',
    'faqs must be an array of 3 objects {question, answer}. Answers must not state factual admission, visa, tuition or intake rules unless directly present in supplied verified facts.',
    'Keep the whole answer under 1200 words. No markdown fences.',
  ].join('\n');
  const prompt = JSON.stringify({
    requestedTitle: title,
    prompt: input.prompt,
    contentType: input.contentType,
    topic: input.subject || input.course || input.degree,
    country: input.country,
    university: input.university,
    course: input.course,
    degree: input.degree,
    requestedIntake: input.intake,
    audience: input.audience,
    language: input.language,
    tone: input.tone,
    seoTarget: input.seoTarget,
    callToAction: input.cta,
    matchedDatabaseEntities: entityNames,
    verifiedSourceFacts: buildSafeFactsForPrompt(facts),
  });
  const result = await generateText({
    prompt,
    systemPrompt,
    model,
    maxTokens: 1800,
    temperature: 0.35,
    timeoutMs: 45000,
  });
  const parsed = extractJson<any>(result.text);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.sections) || !Array.isArray(parsed.faqs)) {
    throw new Error('The configured AI provider returned an invalid page outline. Nothing was saved.');
  }
  const sections = parsed.sections.slice(0, 4).map((section: any, index: number) => ({
    id: `section-${index + 1}`,
    title: cleanText(section?.title, 90) || `Section ${index + 1}`,
    type: section?.type === 'steps' ? 'steps' as const : 'editorial' as const,
    body: cleanText(section?.body, 1200),
    bullets: Array.isArray(section?.bullets) ? section.bullets.slice(0, 4).map((bullet: unknown) => cleanText(bullet, 160)).filter(Boolean) : [],
  }));
  const faqs = parsed.faqs.slice(0, 5).map((faq: any) => ({
    question: cleanText(faq?.question, 180),
    answer: cleanText(faq?.answer, 600),
    factIds: [],
  })).filter((faq: any) => faq.question && faq.answer);
  if (sections.filter((section: any) => section.title && section.body).length < 2) {
    throw new Error('The generated outline did not contain enough complete sections. Nothing was saved.');
  }
  return {
    provider: result.provider,
    model: result.model,
    title: cleanText(parsed.title, 110) || title,
    seoTitle: cleanText(parsed.seoTitle, 100),
    metaDescription: cleanText(parsed.metaDescription, 260),
    heroTitle: cleanText(parsed.heroTitle, 100),
    heroDescription: cleanText(parsed.heroDescription, 700),
    sections,
    faqs,
  };
}

function makeDocument(
  input: AloBuilderInput,
  context: Awaited<ReturnType<typeof loadEntityContext>>,
  copy: Awaited<ReturnType<typeof generateStructuredCopy>>,
  images: BuilderImage[],
): AloBuilderDocument {
  const title = copy.title || pageTitle(input, context.countryName);
  const slug = slugifyBuilderText(title);
  const heroImage = images.find((image) => image.role === 'hero') || images[0];
  const currentLinks = [...context.links];
  const breadcrumbs: AloBuilderDocument['breadcrumbs'] = [
    { label: 'Home', href: '/' },
    { label: 'Destinations', href: '/destinations' },
  ];
  if (context.countryName && context.countrySlug) breadcrumbs.push({ label: context.countryName, href: `/destinations/${context.countrySlug}` });
  breadcrumbs.push({ label: title, href: `/guides/${slug}` });

  const seoTitle = copy.seoTitle || `${title} | ALO Education`;
  const metaDescription = copy.metaDescription || `${title}. Explore verified study information, connected courses and next steps with ALO Education. Check current details with official sources before applying.`;
  return {
    schemaVersion: 1,
    contentType: input.contentType,
    prompt: input.prompt,
    input,
    slug,
    title,
    seoTitle: seoTitle.slice(0, 60),
    metaDescription: metaDescription.slice(0, 160),
    targetKeywords: [input.seoTarget, input.country, input.subject, input.course].filter(Boolean).join(', '),
    canonicalUrl: `/guides/${slug}`,
    hero: {
      eyebrow: [input.country, input.intake].filter(Boolean).join(' • '),
      title: copy.heroTitle || title,
      description: copy.heroDescription || 'Explore your options using connected ALO Education course and university records. Specific requirements and availability are shown only when supported by verified sources.',
      imageId: heroImage?.id || '',
    },
    sections: copy.sections.map((section, index) => ({
      ...section,
      type: index === 0 ? 'intro' : section.type,
      imageId: index === 1 ? images.find((image) => image.role === 'section')?.id : undefined,
    })),
    facts: context.facts,
    faqs: copy.faqs,
    breadcrumbs,
    links: currentLinks,
    entities: context.entities,
    images,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: metaDescription,
      inLanguage: input.language,
      mainEntityOfPage: `${WEBSITE_BASE}/guides/${slug}`,
      author: { '@type': 'Organization', name: 'ALO Education' },
      publisher: { '@type': 'Organization', name: 'ALO Education', url: WEBSITE_BASE },
      about: context.entities.filter((entity) => entity.id).map((entity) => ({ '@type': 'Thing', name: entity.name })),
    },
    translations: [{ language: input.language, status: 'GENERATED', title }],
    publication: { status: 'DRAFT', approvalRequired: true },
  };
}

async function getContextPayload() {
  const [countries, universities, courses, recent, templates, generations] = await Promise.all([
    db.country.findMany({ where: { status: 'active' }, select: { id: true, name: true, slug: true, code: true }, orderBy: { name: 'asc' }, take: 100 }).catch(() => []),
    db.crmUniversity.findMany({
      where: { status: { in: ['active', 'verified'] } },
      select: { id: true, universityId: true, name: true, slug: true, country: true, city: true, verificationStatus: true, sourceUrl: true },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }], take: 20,
    }).catch(() => []),
    db.crmCourse.findMany({
      where: { status: { in: ['active', 'verified', 'published'] } },
      select: { id: true, courseId: true, courseTitle: true, name: true, slug: true, subjectArea: true, country: true, studyLevel: true, university: { select: { name: true } } },
      orderBy: { courseTitle: 'asc' }, take: 20,
    }).catch(() => []),
    db.contentAsset.findMany({
      where: { contentType: ASSET_TYPE, tags: { contains: BUILDER_TAG }, status: { not: 'ARCHIVED' } },
      select: { id: true, title: true, slug: true, topic: true, status: true, qualityScore: true, updatedAt: true, tags: true, body: true },
      orderBy: { updatedAt: 'desc' }, take: 8,
    }).catch(() => []),
    db.cmsManagedContent.findMany({ where: { contentType: 'builder-template', status: 'published' }, orderBy: { updatedAt: 'desc' }, take: 8 }).catch(() => []),
    db.cmsRevision.findMany({
      where: { entityType: 'alo-builder-generation' },
      orderBy: { createdAt: 'desc' }, take: 8,
      select: { id: true, entityId: true, label: true, createdAt: true, createdBy: true, snapshot: true },
    }).catch(() => []),
  ]);
  const imageLibrary: Array<BuilderImage & { bytes: number }> = [];
  for (const image of BUILDER_IMAGE_LIBRARY) {
    const metadata = await getImageMetadata(image.url);
    if (!metadata) continue;
    imageLibrary.push({
      id: image.id,
      url: image.url,
      alt: image.alt,
      caption: image.caption,
      source: '',
      license: '',
      width: metadata.width,
      height: metadata.height,
      aspectRatio: metadata.aspectRatio,
      entityType: image.role === 'hero' ? 'country' : 'ALO Education service',
      verified: false,
      role: image.role,
      bytes: metadata.bytes,
    });
  }
  return {
    countries,
    universities,
    courses,
    recent: recent.map((asset: any) => ({
      id: asset.id,
      title: asset.title,
      slug: asset.slug,
      topic: asset.topic,
      status: asset.status,
      qualityScore: asset.qualityScore,
      updatedAt: asset.updatedAt,
      document: parseBuilderDocument(asset.body),
    })),
    templates: templates.map((template: any) => ({ id: template.id, key: template.key, label: template.label, data: template.data, updatedAt: template.updatedAt })),
    generations: generations.map((entry: any) => ({
      id: entry.id,
      generationId: entry.entityId,
      label: entry.label,
      createdAt: entry.createdAt,
      createdBy: entry.createdBy,
      summary: (entry.snapshot as any)?.summary || '',
      prompt: (entry.snapshot as any)?.prompt || '',
    })),
    imageLibrary,
    databaseStatus: 'connected',
  };
}

async function loadAsset(assetId: string) {
  const asset = await db.contentAsset.findUnique({ where: { id: assetId } });
  if (!asset || !hasBuilderTag(asset)) return null;
  const document = parseBuilderDocument(asset.body);
  if (!document) return null;
  return { asset, document };
}

async function currentDuplicate(document: AloBuilderDocument, exceptId?: string) {
  return findLikelyDuplicate(document.title, document.prompt, exceptId);
}

async function persistRevision(asset: any, actorId: string, label: string, snapshot?: unknown) {
  await db.cmsRevision.create({
    data: {
      entityType: 'aloBuilderContentAsset',
      entityId: asset.id,
      kind: 'AUTO',
      label,
      snapshot: snapshot ?? {
        title: asset.title,
        slug: asset.slug,
        body: asset.body,
        status: asset.status,
        metaTitle: asset.metaTitle,
        metaDescription: asset.metaDescription,
        canonicalUrl: asset.canonicalUrl,
      },
      createdBy: actorId,
    },
  });
}

function authorFromTags(asset: any): string | undefined {
  return tagList(asset).find((tag) => tag.startsWith('author:'))?.slice('author:'.length);
}

async function saveAsset(document: AloBuilderDocument, auth: AuthContext, assetId?: string, asReview = false) {
  const { images, brokenImageIds } = await hydrateImageMetadata(document.images || []);
  document.images = images;
  const duplicate = await currentDuplicate(document, assetId);
  const validation = validateBuilderDocument(document, { duplicate: Boolean(duplicate), brokenImageIds });
  if (asReview && !validation.canSubmit) {
    return { saved: false, validation, duplicate, brokenImageIds };
  }

  const previous = assetId ? await loadAsset(assetId) : null;
  if (assetId && !previous) throw new Error('Builder draft was not found.');
  if (previous && ['APPROVED', 'PUBLISHED'].includes(previous.asset.status)) {
    throw new Error('Approved or published pages are immutable. Create a new draft version before editing.');
  }
  if (!previous && duplicate) return { saved: false, validation, duplicate, brokenImageIds };

  const tags = previous
    ? tagList(previous.asset)
    : [BUILDER_TAG, `author:${auth.userId}`, `generation:${document.generationId || ''}`].filter(Boolean);
  const draftStatus = asReview ? 'IN_REVIEW' : 'DRAFT';
  document.publication.status = draftStatus;
  const body = JSON.stringify(document);
  let asset: any;
  if (previous) {
    await persistRevision(previous.asset, auth.userId, 'Before-image: builder draft updated');
    asset = await db.contentAsset.update({
      where: { id: previous.asset.id },
      data: {
        title: document.title,
        slug: previous.asset.slug,
        contentType: ASSET_TYPE,
        body,
        excerpt: document.hero.description.slice(0, 400),
        topic: document.prompt,
        source: 'ALO Education database-grounded AI builder',
        sourceQuery: document.prompt,
        authorAgentId: 'alo-short-form-builder',
        tags: JSON.stringify(tags),
        metaTitle: document.seoTitle,
        metaDescription: document.metaDescription,
        targetKeywords: document.targetKeywords,
        canonicalUrl: document.canonicalUrl,
        status: draftStatus,
        qualityScore: validation.score,
        factChecked: validation.categories.data === 100,
        sourceChecked: validation.checks.find((item) => item.key === 'fact-sources')?.severity === 'PASS',
        brandChecked: /ALO Education/i.test(body),
        seoChecked: validation.categories.seo >= 80,
        duplicateChecked: !duplicate,
      },
    });
  } else {
    const baseSlug = document.slug || slugifyBuilderText(document.title);
    let slug = baseSlug;
    let attempt = 2;
    while (await db.contentAsset.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${attempt++}`;
      if (attempt > 100) throw new Error('Could not generate a unique content URL.');
    }
    document.slug = slug;
    document.canonicalUrl = `/guides/${slug}`;
    document.breadcrumbs = document.breadcrumbs.map((crumb, index) => index === document.breadcrumbs.length - 1 ? { ...crumb, href: `/guides/${slug}` } : crumb);
    document.structuredData = { ...document.structuredData, mainEntityOfPage: `${WEBSITE_BASE}/guides/${slug}` };
    const finalValidation = validateBuilderDocument(document, { duplicate: false, brokenImageIds });
    if (asReview && !finalValidation.canSubmit) return { saved: false, validation: finalValidation, duplicate: null, brokenImageIds };
    asset = await db.contentAsset.create({
      data: {
        title: document.title,
        slug,
        contentType: ASSET_TYPE,
        body: JSON.stringify(document),
        excerpt: document.hero.description.slice(0, 400),
        topic: document.prompt,
        source: 'ALO Education database-grounded AI builder',
        sourceQuery: document.prompt,
        authorAgentId: 'alo-short-form-builder',
        tags: JSON.stringify(tags),
        metaTitle: document.seoTitle,
        metaDescription: document.metaDescription,
        targetKeywords: document.targetKeywords,
        canonicalUrl: document.canonicalUrl,
        status: draftStatus,
        qualityScore: finalValidation.score,
        factChecked: finalValidation.categories.data === 100,
        sourceChecked: finalValidation.checks.find((item) => item.key === 'fact-sources')?.severity === 'PASS',
        brandChecked: /ALO Education/i.test(JSON.stringify(document)),
        seoChecked: finalValidation.categories.seo >= 80,
        duplicateChecked: true,
        legalChecked: !/guaranteed\s+(visa|admission)|100%\s+scholarship/i.test(body),
        privacyChecked: !/\b[\w.-]+@[\w.-]+\.\w{2,}\b/.test(body),
      },
    });
    await persistRevision(asset, auth.userId, 'AI generation saved as builder draft', { document, score: finalValidation.score });
  }

  if (asReview) {
    await db.contentApproval.create({
      data: {
        contentType: 'ALO_PAGE',
        title: `Page approval: ${document.title}`,
        content: document.hero.description,
        platform: 'WEBSITE',
        mediaUrls: JSON.stringify(document.images.map((image) => image.url)),
        submittedById: auth.userId,
        submittedByName: auth.name || auth.email,
        status: 'pending',
        auditHistory: JSON.stringify([{ at: new Date().toISOString(), actorId: auth.userId, action: 'SUBMITTED_FOR_REVIEW' }]),
      },
    });
  }
  await logAuditAction(auth, asReview ? 'ALO_BUILDER_SUBMIT_REVIEW' : 'ALO_BUILDER_SAVE_DRAFT', 'ContentAsset', asset.id, { slug: asset.slug, title: document.title, score: validation.score });
  const finalValidation = validateBuilderDocument(document, { duplicate: false, brokenImageIds });
  return { saved: true, asset, document, validation: finalValidation, duplicate: null, brokenImageIds };
}

async function hasUnresolvedEntityConflict(document: AloBuilderDocument) {
  const filters: any[] = [];
  for (const entity of document.entities) {
    if (!entity.slug) continue;
    if (entity.type === 'university') filters.push({ universitySlug: entity.slug });
    if (entity.type === 'course') filters.push({ courseSlug: entity.slug });
    if (entity.type === 'country') filters.push({ countrySlug: entity.slug });
  }
  if (!filters.length) return [];
  return db.dataConflict.findMany({
    where: { status: 'PENDING', OR: filters },
    orderBy: { detectedAt: 'desc' },
    take: 10,
    select: { id: true, entityType: true, universitySlug: true, courseSlug: true, countrySlug: true, fieldName: true, conflictingValues: true, detectedAt: true },
  });
}

async function validateStoredDocument(asset: any, document: AloBuilderDocument) {
  const { images, brokenImageIds } = await hydrateImageMetadata(document.images || []);
  document.images = images;
  const duplicate = await currentDuplicate(document, asset.id);
  const conflicts = await hasUnresolvedEntityConflict(document);
  const validation = validateBuilderDocument(document, { duplicate: Boolean(duplicate), brokenImageIds });
  if (conflicts.length) {
    validation.checks.push({
      key: 'data-conflicts',
      label: 'Unresolved source conflicts',
      severity: 'BLOCKER',
      message: `${conflicts.length} unresolved data conflict(s) affect this page. Human research review is required.`,
      score: 0,
    });
    validation.categories.data = Math.min(validation.categories.data, 35);
    validation.score = Math.round(Object.values(validation.categories).reduce((total, value) => total + value, 0) / Object.values(validation.categories).length);
    validation.canSubmit = false;
    validation.canPublish = false;
  }
  return { validation, duplicate, conflicts, brokenImageIds };
}

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  if (!isBuilderUser(auth)) return forbidden();
  const url = new URL(request.url);
  const assetId = url.searchParams.get('assetId');
  if (assetId) {
    const loaded = await loadAsset(assetId);
    if (!loaded) return NextResponse.json({ success: false, error: 'Builder page not found.' }, { status: 404 });
    const { images, brokenImageIds } = await hydrateImageMetadata(loaded.document.images || []);
    loaded.document.images = images;
    return NextResponse.json({ success: true, asset: { id: loaded.asset.id, status: loaded.asset.status, qualityScore: loaded.asset.qualityScore, updatedAt: loaded.asset.updatedAt }, document: loaded.document, validation: validateBuilderDocument(loaded.document, { brokenImageIds }) });
  }
  try {
    const context = await getContextPayload();
    return NextResponse.json({ success: true, data: context });
  } catch (error) {
    console.error('[alo-builder] context error', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Builder data could not be loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  if (!isBuilderUser(auth)) return forbidden();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const action = cleanText(body?.action, 50);

  if (action === 'generate') {
    const rawInput = body?.input || {};
    const prompt = cleanText(rawInput.prompt, 1600);
    if (!prompt) return NextResponse.json({ success: false, error: 'Enter a short instruction before generating.' }, { status: 400 });
    if (prompt.length < 12) return NextResponse.json({ success: false, error: 'Add a little more detail to the prompt.' }, { status: 400 });
    const contentType = ALO_BUILDER_CONTENT_TYPES.includes(rawInput.contentType) ? rawInput.contentType : 'Study Guide';
    const baseInput: AloBuilderInput = {
      prompt,
      contentType,
      country: cleanText(rawInput.country, 120),
      university: cleanText(rawInput.university, 180),
      course: cleanText(rawInput.course, 180),
      subject: cleanText(rawInput.subject, 160),
      degree: cleanText(rawInput.degree, 100),
      intake: cleanText(rawInput.intake, 60),
      audience: cleanText(rawInput.audience, 180),
      language: cleanText(rawInput.language, 50) || 'English',
      tone: cleanText(rawInput.tone, 80) || 'Professional and encouraging',
      seoTarget: cleanText(rawInput.seoTarget, 180),
      cta: cleanText(rawInput.cta, 160) || 'Book a free counselling session',
      publishingStatus: rawInput.publishingStatus === 'REQUEST_REVIEW' ? 'REQUEST_REVIEW' : 'DRAFT',
    };
    const input = parseBuilderPrompt(prompt, baseInput);
    input.country = canonicalizeCountry(input.country);
    let context: Awaited<ReturnType<typeof loadEntityContext>>;
    try {
      context = await loadEntityContext(input);
    } catch (error) {
      return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Data lookup failed.' }, { status: 503 });
    }
    const title = pageTitle(input, context.countryName);
    let duplicate: any = null;
    try {
      duplicate = await findLikelyDuplicate(title, prompt);
    } catch {
      // A duplicate query failure must not create an unsafe publish path.
      return NextResponse.json({ success: false, error: 'Duplicate detection is currently unavailable. Generation was stopped safely.' }, { status: 503 });
    }
    if (duplicate) {
      return NextResponse.json({
        success: false,
        duplicateDetected: true,
        duplicate: { id: duplicate.id, title: duplicate.title, slug: duplicate.slug, status: duplicate.status, updatedAt: duplicate.updatedAt },
        error: 'A similar builder page already exists. Open it and continue editing instead of creating a duplicate.',
      }, { status: 409 });
    }
    const entityNames = [...new Set([
      context.countryName,
      context.university?.name,
      context.selectedCourse?.courseTitle,
      ...context.relatedCourses.slice(0, 5).map((course: any) => course.courseTitle),
      ...context.scholarships.slice(0, 4).map((scholarship: any) => scholarship.name),
    ].filter(Boolean))];
    let copy: Awaited<ReturnType<typeof generateStructuredCopy>>;
    try {
      copy = await generateStructuredCopy(input, title, context.facts, entityNames);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Configured AI provider is unavailable.';
      return NextResponse.json({ success: false, error: message, saved: false }, { status: 503 });
    }
    const candidates = recommendedBuilderImages(input);
    const imageResult = await hydrateImageMetadata(candidates);
    const document = makeDocument(input, context, copy, imageResult.images);
    const validation = validateBuilderDocument(document, { brokenImageIds: imageResult.brokenImageIds });
    const generationId = randomUUID();
    document.generationId = generationId;
    await db.cmsRevision.create({
      data: {
        entityType: 'alo-builder-generation',
        entityId: generationId,
        kind: 'AUTO',
        label: `AI draft: ${document.title}`,
        snapshot: {
          prompt,
          contentType: input.contentType,
          summary: `${document.sections.length} sections, ${document.facts.length} database facts, ${document.links.length} connected links.`,
          provider: copy.provider,
          model: copy.model,
          score: validation.score,
          generatedAt: new Date().toISOString(),
          document,
        } as unknown as Prisma.InputJsonValue,
        createdBy: auth.userId,
      },
    }).catch((error) => console.error('[alo-builder] generation history save failed', error instanceof Error ? error.message : 'unknown'));
    await logAuditAction(auth, 'ALO_BUILDER_GENERATE', 'AloBuilder', generationId, { contentType: input.contentType, title: document.title, provider: copy.provider, model: copy.model });
    return NextResponse.json({
      success: true,
      document,
      validation,
      pipeline: [
        { step: 'Intent understood', status: 'complete' },
        { step: 'Database entities queried', status: 'complete', detail: `${entityNames.length} matched names` },
        { step: 'Related content connected', status: context.links.length >= 3 ? 'complete' : 'warning', detail: `${context.links.length} internal links` },
        { step: 'Structured copy generated', status: 'complete', detail: `${copy.provider} · ${copy.model}` },
        { step: 'Fact and image validation', status: validation.checks.some((item) => item.severity === 'BLOCKER') ? 'review' : 'complete' },
        { step: 'Human approval', status: 'required' },
      ],
      matched: {
        country: context.countryName || null,
        university: context.university?.name || null,
        course: context.selectedCourse?.courseTitle || null,
        universities: context.relatedUniversities.length,
        courses: context.relatedCourses.length + (context.selectedCourse ? 1 : 0),
        scholarships: context.scholarships.length,
        sources: context.sourceRecords.length,
      },
      duplicate: null,
    });
  }

  if (action === 'save' || action === 'submit') {
    const document = body?.document as AloBuilderDocument;
    if (!document || document.schemaVersion !== 1 || !document.title || !document.input?.prompt) {
      return NextResponse.json({ success: false, error: 'A valid generated page document is required.' }, { status: 400 });
    }
    if (action === 'submit' && !isApprover(auth)) {
      // Content authors can save drafts; only an admin-level user may submit a page into the approval queue.
      return forbidden('Only an admin-level content approver may submit pages for publication review.');
    }
    try {
      const result = await saveAsset(document, auth, cleanText(body?.assetId, 120) || undefined, action === 'submit');
      if (!result.saved) {
        return NextResponse.json({
          success: false,
          error: result.duplicate ? 'An equivalent page already exists.' : 'The page does not meet the publication review threshold.',
          duplicate: result.duplicate,
          validation: result.validation,
          brokenImageIds: result.brokenImageIds,
        }, { status: result.duplicate ? 409 : 422 });
      }
      return NextResponse.json({ success: true, asset: { id: result.asset.id, slug: result.asset.slug, status: result.asset.status, qualityScore: result.asset.qualityScore, updatedAt: result.asset.updatedAt }, document: result.document, validation: result.validation });
    } catch (error) {
      return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'The page could not be saved.' }, { status: 400 });
    }
  }

  if (action === 'approve') {
    if (!isApprover(auth)) return forbidden('Only ADMIN or SUPER_ADMIN may approve generated pages.');
    const assetId = cleanText(body?.assetId, 120);
    if (!assetId) return NextResponse.json({ success: false, error: 'assetId is required.' }, { status: 400 });
    const loaded = await loadAsset(assetId);
    if (!loaded) return NextResponse.json({ success: false, error: 'Builder page not found.' }, { status: 404 });
    if (loaded.asset.status !== 'IN_REVIEW') return NextResponse.json({ success: false, error: 'Only a page in the review queue can be approved.' }, { status: 409 });
    const authorId = authorFromTags(loaded.asset);
    if (authorId && authorId === auth.userId) return NextResponse.json({ success: false, error: 'A second authorized person must approve this page; authors cannot self-approve factual content.' }, { status: 403 });
    const checked = await validateStoredDocument(loaded.asset, loaded.document);
    if (!checked.validation.canSubmit) return NextResponse.json({ success: false, error: 'Approval is blocked until all required validations pass.', validation: checked.validation, conflicts: checked.conflicts }, { status: 422 });
    loaded.document.publication.status = 'APPROVED';
    loaded.document.publication.approvedBy = auth.userId;
    loaded.document.publication.approvedAt = new Date().toISOString();
    const updated = await db.contentAsset.update({ where: { id: assetId }, data: { status: 'APPROVED', humanApproverId: auth.userId, body: JSON.stringify(loaded.document), qualityScore: checked.validation.score } });
    await db.contentApproval.updateMany({ where: { contentType: 'ALO_PAGE', title: `Page approval: ${loaded.document.title}`, status: 'pending' }, data: { status: 'approved', reviewedById: auth.userId, reviewedByName: auth.name || auth.email, reviewNotes: 'Approved after fact, source, image, SEO, entity, link and accessibility checks.' } });
    await persistRevision(updated, auth.userId, 'Builder page approved', { document: loaded.document, validation: checked.validation });
    await logAuditAction(auth, 'ALO_BUILDER_APPROVE', 'ContentAsset', assetId, { title: updated.title, score: checked.validation.score });
    return NextResponse.json({ success: true, asset: { id: updated.id, slug: updated.slug, status: updated.status, qualityScore: updated.qualityScore }, document: loaded.document, validation: checked.validation });
  }

  if (action === 'publish') {
    if (!isApprover(auth)) return forbidden('Only ADMIN or SUPER_ADMIN may publish generated pages.');
    const assetId = cleanText(body?.assetId, 120);
    if (!assetId) return NextResponse.json({ success: false, error: 'assetId is required.' }, { status: 400 });
    const loaded = await loadAsset(assetId);
    if (!loaded) return NextResponse.json({ success: false, error: 'Builder page not found.' }, { status: 404 });
    if (loaded.asset.status !== 'APPROVED') return NextResponse.json({ success: false, error: 'Publication is blocked until an independent reviewer has approved the page.' }, { status: 409 });
    const checked = await validateStoredDocument(loaded.asset, loaded.document);
    if (!checked.validation.canSubmit || checked.conflicts.length) return NextResponse.json({ success: false, error: 'The page no longer passes current validation or has unresolved data conflicts.', validation: checked.validation, conflicts: checked.conflicts }, { status: 422 });
    loaded.document.publication.status = 'PUBLISHED';
    loaded.document.publication.publishedAt = new Date().toISOString();
    const publishedUrl = `/guides/${loaded.asset.slug}`;
    loaded.document.canonicalUrl = publishedUrl;
    loaded.document.structuredData = { ...loaded.document.structuredData, mainEntityOfPage: `${WEBSITE_BASE}${publishedUrl}` };
    const updated = await db.contentAsset.update({ where: { id: assetId }, data: { status: 'PUBLISHED', publishedAt: new Date(), publishedUrl, body: JSON.stringify(loaded.document), qualityScore: checked.validation.score } });
    await db.contentPublication.create({ data: { contentAssetId: assetId, platform: 'WEBSITE', status: 'PUBLISHED', publishedAt: new Date(), publishedUrl } });
    await db.contentApproval.updateMany({ where: { contentType: 'ALO_PAGE', title: `Page approval: ${loaded.document.title}`, status: 'approved' }, data: { publishedAt: new Date() } });
    await persistRevision(updated, auth.userId, 'Builder page published', { document: loaded.document, validation: checked.validation, publishedUrl });
    await logAuditAction(auth, 'ALO_BUILDER_PUBLISH', 'ContentAsset', assetId, { title: updated.title, publishedUrl, score: checked.validation.score });
    return NextResponse.json({ success: true, asset: { id: updated.id, slug: updated.slug, status: updated.status, publishedUrl, publishedAt: updated.publishedAt }, document: loaded.document, validation: checked.validation });
  }

  if (action === 'save-template') {
    const name = cleanText(body?.name, 80);
    const input = body?.input as AloBuilderInput;
    if (!name || !input) return NextResponse.json({ success: false, error: 'Template name and builder fields are required.' }, { status: 400 });
    const key = `builder-template:${slugifyBuilderText(name)}`;
    const template = await db.cmsManagedContent.create({
      data: {
        contentType: 'builder-template',
        key,
        label: name,
        section: 'alo-short-form-builder',
        data: { input, savedBy: auth.userId, savedAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
        status: 'published',
        createdById: auth.userId,
      },
    });
    await logAuditAction(auth, 'ALO_BUILDER_SAVE_TEMPLATE', 'CmsManagedContent', template.id, { name });
    return NextResponse.json({ success: true, template: { id: template.id, key: template.key, label: template.label, data: template.data } }, { status: 201 });
  }

  return NextResponse.json({ success: false, error: 'Unsupported builder action.' }, { status: 400 });
});

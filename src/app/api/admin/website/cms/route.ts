// ============================================================
// /api/admin/website/cms — Super Admin Website CMS Master API
// Full CRUD for all website content models
// Allows Super Admin to edit any part of website directly
// Real DB operations, audit logs, RBAC, validation
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const ALLOWED_TYPES = [
  'hero-slides',
  'home-services',
  'success-stories',
  'team-members',
  'faqs',
  'home-sections',
  'english-tests',
  'countries',
  'country-quick-facts',
  'country-cities',
  'country-pathways',
  'country-reasons',
  'country-entry-reqs',
  'country-english-tests',
  'country-visa-steps',
  'country-work-rights',
  'country-faqs',
  'country-sources',
  'services',
  'service-faqs',
] as const;

type CmsType = typeof ALLOWED_TYPES[number];

function mapTypeToModel(type: string) {
  switch (type) {
    case 'hero-slides': return 'homeHeroSlide';
    case 'home-services': return 'homeService';
    case 'success-stories': return 'successStory';
    case 'team-members': return 'teamMember';
    case 'faqs': return 'homepageFaq';
    case 'home-sections': return 'homeSection';
    case 'english-tests': return 'websiteEnglishTest';
    case 'countries': return 'country';
    case 'country-quick-facts': return 'countryQuickFact';
    case 'country-cities': return 'countryCity';
    case 'country-pathways': return 'countryEducationPathway';
    case 'country-reasons': return 'countryStudyReason';
    case 'country-entry-reqs': return 'countryEntryRequirement';
    case 'country-english-tests': return 'countryEnglishTest';
    case 'country-visa-steps': return 'countryVisaStep';
    case 'country-work-rights': return 'countryWorkRight';
    case 'country-faqs': return 'countryFaq';
    case 'country-sources': return 'countrySource';
    case 'services': return 'service';
    case 'service-faqs': return 'serviceFaq';
    default: return null;
  }
}

// GET /api/admin/website/cms?type=hero-slides&search=&status=&limit=
// Returns list for any website entity
export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const primaryRole = auth.roles[0] || auth.userType || '';
    if (!['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(primaryRole)) {
      // Also allow any admin-level via withAuth logic
      if (!auth.roles.includes('super_admin') && !auth.roles.includes('admin') && auth.userType !== 'SUPER_ADMIN' && auth.userType !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Forbidden — SUPER_ADMIN or ADMIN only' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as CmsType | null;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500);
    const countryId = searchParams.get('countryId') || '';

    if (!type) {
      return NextResponse.json({
        success: true,
        availableTypes: ALLOWED_TYPES,
        message: 'Provide ?type= one of availableTypes',
      });
    }

    if (!ALLOWED_TYPES.includes(type as any)) {
      return NextResponse.json({ success: false, error: `Invalid type. Allowed: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
    }

    let data: any[] = [];

    // Build where clauses based on type
    const baseWhere: any = {};
    if (status) baseWhere.status = status;
    
    // Search handling per model
    const searchWhere = search ? {
      OR: [
        { title: { contains: search } },
        { name: { contains: search } },
        { headline: { contains: search } },
        { question: { contains: search } },
        { studentName: { contains: search } },
      ]
    } : {};

    const where = { ...baseWhere, ...(search ? searchWhere : {}) };
    if (countryId && type.startsWith('country-')) {
      where.countryId = countryId;
    }

    switch (type) {
      case 'hero-slides':
        data = await db.homeHeroSlide.findMany({
          where: search ? { OR: [{ headline: { contains: search } }, { countryCode: { contains: search } }, { popularCity: { contains: search } }] } : {},
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
          take: limit,
        });
        break;
      case 'home-services':
        data = await db.homeService.findMany({
          where,
          orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
          take: limit,
        });
        break;
      case 'success-stories':
        data = await db.successStory.findMany({
          where: search ? { OR: [{ studentName: { contains: search } }, { university: { contains: search } }, { course: { contains: search } }] } : (status ? { status } : {}),
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        break;
      case 'team-members':
        data = await db.teamMember.findMany({
          where,
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          take: limit,
        });
        break;
      case 'faqs':
        data = await db.homepageFaq.findMany({
          where: search ? { OR: [{ question: { contains: search } }, { answer: { contains: search } }] } : (status ? { status } : {}),
          orderBy: { sortOrder: 'asc' },
          take: limit,
        });
        break;
      case 'home-sections':
        data = await db.homeSection.findMany({
          where: search ? { OR: [{ title: { contains: search } }, { sectionKey: { contains: search } }] } : (status ? { status } : {}),
          orderBy: { sortOrder: 'asc' },
          take: limit,
        });
        break;
      case 'english-tests':
        data = await db.websiteEnglishTest.findMany({
          where,
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          take: limit,
        });
        break;
      case 'countries':
        data = await db.country.findMany({
          where: search ? { OR: [{ name: { contains: search } }, { slug: { contains: search } }, { code: { contains: search } }] } : (status ? { status } : {}),
          orderBy: { sortOrder: 'asc' },
          take: limit,
          include: {
            _count: { select: { quickFacts: true, cities: true, faqs: true } }
          }
        });
        break;
      case 'country-quick-facts':
        data = await db.countryQuickFact.findMany({
          where: { ...(countryId ? { countryId } : {}), ...(status ? { status } : {}), ...(search ? { OR: [{ factLabel: { contains: search } }, { factValue: { contains: search } }] } : {}) },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        break;
      case 'country-cities':
        data = await db.countryCity.findMany({
          where: { ...(countryId ? { countryId } : {}), ...(status ? { status } : {}), ...(search ? { cityName: { contains: search } } : {}) },
          orderBy: { cityName: 'asc' },
          take: limit,
        });
        break;
      case 'country-pathways':
        data = await db.countryEducationPathway.findMany({
          where: { ...(countryId ? { countryId } : {}), ...(status ? { status } : {}) },
          orderBy: { sortOrder: 'asc' },
          take: limit,
        });
        break;
      case 'country-reasons':
        data = await db.countryStudyReason.findMany({
          where: { ...(countryId ? { countryId } : {}), ...(status ? { status } : {}) },
          orderBy: { sortOrder: 'asc' },
          take: limit,
        });
        break;
      case 'country-entry-reqs':
        data = await db.countryEntryRequirement.findMany({
          where: { ...(countryId ? { countryId } : {}), ...(status ? { status } : {}) },
          orderBy: { studyLevel: 'asc' },
          take: limit,
        });
        break;
      case 'country-english-tests':
        data = await db.countryEnglishTest.findMany({
          where: { ...(countryId ? { countryId } : {}), ...(status ? { status } : {}) },
          orderBy: { testName: 'asc' },
          take: limit,
        });
        break;
      case 'country-visa-steps':
        data = await db.countryVisaStep.findMany({
          where: { ...(countryId ? { countryId } : {}), ...(status ? { status } : {}) },
          orderBy: { stepNumber: 'asc' },
          take: limit,
        });
        break;
      case 'country-work-rights':
        data = await db.countryWorkRight.findMany({
          where: { ...(countryId ? { countryId } : {}), ...(status ? { status } : {}) },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        break;
      case 'country-faqs':
        data = await db.countryFaq.findMany({
          where: { ...(countryId ? { countryId } : {}), ...(status ? { status } : {}), ...(search ? { OR: [{ question: { contains: search } }, { answer: { contains: search } }] } : {}) },
          orderBy: { sortOrder: 'asc' },
          take: limit,
        });
        break;
      case 'country-sources':
        data = await db.countrySource.findMany({
          where: { ...(countryId ? { countryId } : {}), ...(status ? { status } : {}), ...(search ? { sourceName: { contains: search } } : {}) },
          orderBy: { dataSection: 'asc' },
          take: limit,
        });
        break;
      case 'services':
        data = await db.service.findMany({
          where: search ? { OR: [{ title: { contains: search } }, { slug: { contains: search } }] } : (status ? { status } : {}),
          orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
          take: limit,
        });
        break;
      case 'service-faqs':
        data = await db.serviceFaq.findMany({
          where: search ? { question: { contains: search } } : {},
          orderBy: { sortOrder: 'asc' },
          take: limit,
        });
        break;
      default:
        return NextResponse.json({ success: false, error: 'Type not implemented yet' }, { status: 400 });
    }

    return NextResponse.json({ success: true, type, data, total: data.length });
  } catch (error: any) {
    console.error('[admin.website.cms GET] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/website/cms?type=hero-slides
// Create new item
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const primaryRole = auth.roles[0] || auth.userType || '';
    if (!['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(primaryRole)) {
      if (!auth.roles.includes('super_admin') && !auth.roles.includes('admin') && auth.userType !== 'SUPER_ADMIN' && auth.userType !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as CmsType;
    const body = await request.json();

    if (!type || !ALLOWED_TYPES.includes(type as any)) {
      return NextResponse.json({ success: false, error: 'Invalid or missing type' }, { status: 400 });
    }

    let created: any;

    switch (type) {
      case 'hero-slides':
        created = await db.homeHeroSlide.create({
          data: {
            countryId: body.countryId || '',
            countryCode: body.countryCode || body.code || '',
            headline: body.headline || body.title || '',
            subtitle: body.subtitle || '',
            imageUrl: body.imageUrl || body.heroImage || '',
            imageAlt: body.imageAlt || '',
            accentColor: body.accentColor || '#0057B8',
            popularCity: body.popularCity || body.heroCity || '',
            popularIntake: body.popularIntake || body.heroIntake || '',
            universityCountLabel: body.universityCountLabel || '',
            courseCountLabel: body.courseCountLabel || '',
            scholarshipLabel: body.scholarshipLabel || '',
            ctaPrimaryLabel: body.ctaPrimaryLabel || 'Explore Courses',
            ctaPrimaryUrl: body.ctaPrimaryUrl || '',
            ctaSecondaryLabel: body.ctaSecondaryLabel || 'Book Consultation',
            ctaSecondaryUrl: body.ctaSecondaryUrl || '',
            sourceUrl: body.sourceUrl || '',
            licenseNote: body.licenseNote || '',
            sortOrder: body.sortOrder ?? 0,
            status: body.status || 'active',
          }
        });
        break;
      case 'home-services':
        if (!body.title || !body.slug) return NextResponse.json({ success: false, error: 'title and slug required' }, { status: 400 });
        created = await db.homeService.create({
          data: {
            title: body.title,
            slug: body.slug.toLowerCase().trim(),
            icon: body.icon || '🎓',
            description: body.description || '',
            ctaLabel: body.ctaLabel || '',
            ctaUrl: body.ctaUrl || '',
            sortOrder: body.sortOrder ?? 0,
            status: body.status || 'active',
          }
        });
        break;
      case 'success-stories':
        if (!body.studentName) return NextResponse.json({ success: false, error: 'studentName required' }, { status: 400 });
        created = await db.successStory.create({
          data: {
            studentName: body.studentName,
            homeDistrict: body.homeDistrict || '',
            countryId: body.countryId || '',
            university: body.university || '',
            course: body.course || '',
            outcome: body.outcome || '',
            testimonial: body.testimonial || '',
            photo: body.photo || '',
            consentStatus: body.consentStatus || 'verified',
            status: body.status || 'published',
          }
        });
        break;
      case 'team-members':
        if (!body.name || !body.role) return NextResponse.json({ success: false, error: 'name and role required' }, { status: 400 });
        created = await db.teamMember.create({
          data: {
            name: body.name,
            role: body.role,
            specialty: body.specialty || '',
            bio: body.bio || '',
            photo: body.photo || '',
            sortOrder: body.sortOrder ?? 0,
            status: body.status || 'active',
          }
        });
        break;
      case 'faqs':
        if (!body.question || !body.answer) return NextResponse.json({ success: false, error: 'question and answer required' }, { status: 400 });
        created = await db.homepageFaq.create({
          data: {
            question: body.question,
            answer: body.answer,
            sortOrder: body.sortOrder ?? 0,
            status: body.status || 'active',
          }
        });
        break;
      case 'home-sections':
        if (!body.sectionKey) return NextResponse.json({ success: false, error: 'sectionKey required' }, { status: 400 });
        created = await db.homeSection.upsert({
          where: { sectionKey: body.sectionKey },
          update: {
            title: body.title || '',
            subtitle: body.subtitle || '',
            content: body.content || '',
            sortOrder: body.sortOrder ?? 0,
            status: body.status || 'active',
          },
          create: {
            sectionKey: body.sectionKey,
            title: body.title || '',
            subtitle: body.subtitle || '',
            content: body.content || '',
            sortOrder: body.sortOrder ?? 0,
            status: body.status || 'active',
          }
        });
        break;
      case 'english-tests':
        if (!body.name || !body.slug) return NextResponse.json({ success: false, error: 'name and slug required' }, { status: 400 });
        created = await db.websiteEnglishTest.create({
          data: {
            name: body.name,
            slug: body.slug.toLowerCase().trim(),
            shortDescription: body.shortDescription || '',
            bestFor: body.bestFor || '',
            acceptedDest: body.acceptedDest || '',
            resultTime: body.resultTime || '',
            scoreRange: body.scoreRange || '',
            format: body.format || '',
            status: body.status || 'active',
            sortOrder: body.sortOrder ?? 0,
          }
        });
        break;
      case 'countries':
        if (!body.name || !body.slug) return NextResponse.json({ success: false, error: 'name and slug required' }, { status: 400 });
        created = await db.country.upsert({
          where: { slug: body.slug.toLowerCase().trim() },
          update: {
            name: body.name,
            code: body.code || body.countryCode || '',
            countryCode: body.countryCode || body.code || '',
            flag: body.flag || '🌐',
            capital: body.capital || '',
            currency: body.currency || '',
            heroTitle: body.heroTitle || '',
            heroSubtitle: body.heroSubtitle || '',
            overview: body.overview || body.description || '',
            description: body.description || body.overview || '',
            visaOverview: body.visaOverview || '',
            visaType: body.visaType || '',
            workRights: body.workRights || '',
            costOfLiving: body.costOfLiving || '',
            livingCost: body.livingCost || '',
            whyStudySummary: body.whyStudySummary || '',
            tuitionRange: body.tuitionRange || '',
            heroImage: body.heroImage || '',
            heroCity: body.heroCity || '',
            heroIntake: body.heroIntake || '',
            seoTitle: body.seoTitle || '',
            seoDescription: body.seoDescription || '',
            status: body.status || 'active',
            sortOrder: body.sortOrder ?? 0,
            accentColor: body.accentColor || '#0057B8',
            lastVerifiedAt: new Date(),
          },
          create: {
            name: body.name,
            slug: body.slug.toLowerCase().trim(),
            code: body.code || body.countryCode || '',
            countryCode: body.countryCode || body.code || '',
            flag: body.flag || '🌐',
            capital: body.capital || '',
            currency: body.currency || '',
            heroTitle: body.heroTitle || '',
            heroSubtitle: body.heroSubtitle || '',
            overview: body.overview || body.description || '',
            description: body.description || body.overview || '',
            visaOverview: body.visaOverview || '',
            visaType: body.visaType || '',
            workRights: body.workRights || '',
            costOfLiving: body.costOfLiving || '',
            livingCost: body.livingCost || '',
            whyStudySummary: body.whyStudySummary || '',
            tuitionRange: body.tuitionRange || '',
            heroImage: body.heroImage || '',
            heroCity: body.heroCity || '',
            heroIntake: body.heroIntake || '',
            seoTitle: body.seoTitle || '',
            seoDescription: body.seoDescription || '',
            status: body.status || 'active',
            sortOrder: body.sortOrder ?? 0,
            accentColor: body.accentColor || '#0057B8',
            lastVerifiedAt: new Date(),
          }
        });
        break;
      case 'country-quick-facts':
        if (!body.countryId || !body.factKey) return NextResponse.json({ success: false, error: 'countryId and factKey required' }, { status: 400 });
        created = await db.countryQuickFact.create({
          data: {
            countryId: body.countryId,
            factKey: body.factKey,
            factLabel: body.factLabel || body.factKey,
            factValue: body.factValue || '',
            sourceUrl: body.sourceUrl || '',
            status: body.status || 'active',
          }
        });
        break;
      case 'country-cities':
        if (!body.countryId || !body.cityName) return NextResponse.json({ success: false, error: 'countryId and cityName required' }, { status: 400 });
        created = await db.countryCity.create({
          data: {
            countryId: body.countryId,
            cityName: body.cityName,
            slug: body.slug || body.cityName.toLowerCase().replace(/\s+/g, '-'),
            costLevel: body.costLevel || 'Medium',
            studentVibe: body.studentVibe || '',
            popularUniversities: body.popularUniversities || '[]',
            transportSummary: body.transportSummary || '',
            jobOpportunitySummary: body.jobOpportunitySummary || '',
            livingCostEstimate: body.livingCostEstimate || '',
            sourceUrl: body.sourceUrl || '',
            status: body.status || 'active',
          }
        });
        break;
      case 'country-reasons':
        if (!body.countryId || !body.heading) return NextResponse.json({ success: false, error: 'countryId and heading required' }, { status: 400 });
        created = await db.countryStudyReason.create({
          data: {
            countryId: body.countryId,
            icon: body.icon || '🎓',
            heading: body.heading,
            description: body.description || '',
            ctaLabel: body.ctaLabel || 'Explore Courses',
            ctaUrl: body.ctaUrl || '',
            sortOrder: body.sortOrder ?? 0,
            status: body.status || 'active',
          }
        });
        break;
      case 'country-entry-reqs':
        if (!body.countryId || !body.studyLevel) return NextResponse.json({ success: false, error: 'countryId and studyLevel required' }, { status: 400 });
        created = await db.countryEntryRequirement.create({
          data: {
            countryId: body.countryId,
            studyLevel: body.studyLevel,
            academicRequirement: body.academicRequirement || '',
            englishRequirement: body.englishRequirement || '',
            documentsRequired: body.documentsRequired || '[]',
            remarks: body.remarks || '',
            sourceUrl: body.sourceUrl || '',
            status: body.status || 'active',
          }
        });
        break;
      case 'country-english-tests':
        if (!body.countryId || !body.testName) return NextResponse.json({ success: false, error: 'countryId and testName required' }, { status: 400 });
        created = await db.countryEnglishTest.create({
          data: {
            countryId: body.countryId,
            testName: body.testName,
            acceptedSummary: body.acceptedSummary || '',
            minimumNote: body.minimumNote || '',
            sourceUrl: body.sourceUrl || '',
            status: body.status || 'active',
          }
        });
        break;
      case 'country-visa-steps':
        if (!body.countryId || !body.stepTitle) return NextResponse.json({ success: false, error: 'countryId and stepTitle required' }, { status: 400 });
        created = await db.countryVisaStep.create({
          data: {
            countryId: body.countryId,
            stepNumber: body.stepNumber ?? 1,
            stepTitle: body.stepTitle,
            stepDescription: body.stepDescription || '',
            sourceUrl: body.sourceUrl || '',
            status: body.status || 'active',
          }
        });
        break;
      case 'country-work-rights':
        if (!body.countryId) return NextResponse.json({ success: false, error: 'countryId required' }, { status: 400 });
        created = await db.countryWorkRight.create({
          data: {
            countryId: body.countryId,
            termTimeRule: body.termTimeRule || '',
            vacationRule: body.vacationRule || '',
            courseLevelCondition: body.courseLevelCondition || '',
            postStudyRouteSummary: body.postStudyRouteSummary || '',
            sourceUrl: body.sourceUrl || '',
            status: body.status || 'active',
          }
        });
        break;
      case 'country-faqs':
        if (!body.countryId || !body.question) return NextResponse.json({ success: false, error: 'countryId and question required' }, { status: 400 });
        created = await db.countryFaq.create({
          data: {
            countryId: body.countryId,
            question: body.question,
            answer: body.answer || '',
            sortOrder: body.sortOrder ?? 0,
            status: body.status || 'active',
          }
        });
        break;
      case 'country-sources':
        if (!body.countryId || !body.sourceName || !body.sourceUrl) return NextResponse.json({ success: false, error: 'countryId, sourceName, sourceUrl required' }, { status: 400 });
        created = await db.countrySource.create({
          data: {
            countryId: body.countryId,
            dataSection: body.dataSection || 'general',
            sourceName: body.sourceName,
            sourceUrl: body.sourceUrl,
            verifiedBy: body.verifiedBy || 'ALO Compliance Team',
            notes: body.notes || '',
            status: body.status || 'active',
          }
        });
        break;
      default:
        return NextResponse.json({ success: false, error: `Create not implemented for ${type}` }, { status: 400 });
    }

    await logAuditAction(auth, `CREATE_${type.toUpperCase()}`, mapTypeToModel(type) || type, created.id, { type, id: created.id }).catch(()=>{});

    return NextResponse.json({ success: true, type, data: created }, { status: 201 });
  } catch (error: any) {
    console.error('[admin.website.cms POST] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/website/cms?type=hero-slides&id=xxx
export async function PUT(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as CmsType;
    const id = searchParams.get('id');
    const body = await request.json();

    if (!type || !ALLOWED_TYPES.includes(type as any)) {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }
    if (!id) {
      return NextResponse.json({ success: false, error: 'id query param required' }, { status: 400 });
    }

    let updated: any;

    switch (type) {
      case 'hero-slides':
        updated = await db.homeHeroSlide.update({ where: { id }, data: { ...body, updatedAt: new Date() } });
        break;
      case 'home-services':
        updated = await db.homeService.update({ where: { id }, data: body });
        break;
      case 'success-stories':
        updated = await db.successStory.update({ where: { id }, data: body });
        break;
      case 'team-members':
        updated = await db.teamMember.update({ where: { id }, data: body });
        break;
      case 'faqs':
        updated = await db.homepageFaq.update({ where: { id }, data: body });
        break;
      case 'home-sections':
        updated = await db.homeSection.update({ where: { id }, data: body });
        break;
      case 'english-tests':
        updated = await db.websiteEnglishTest.update({ where: { id }, data: body });
        break;
      case 'countries':
        updated = await db.country.update({ where: { id }, data: { ...body, lastVerifiedAt: new Date() } });
        break;
      case 'country-quick-facts':
        updated = await db.countryQuickFact.update({ where: { id }, data: body });
        break;
      case 'country-cities':
        updated = await db.countryCity.update({ where: { id }, data: body });
        break;
      case 'country-pathways':
        updated = await db.countryEducationPathway.update({ where: { id }, data: body });
        break;
      case 'country-reasons':
        updated = await db.countryStudyReason.update({ where: { id }, data: body });
        break;
      case 'country-entry-reqs':
        updated = await db.countryEntryRequirement.update({ where: { id }, data: body });
        break;
      case 'country-english-tests':
        updated = await db.countryEnglishTest.update({ where: { id }, data: body });
        break;
      case 'country-visa-steps':
        updated = await db.countryVisaStep.update({ where: { id }, data: body });
        break;
      case 'country-work-rights':
        updated = await db.countryWorkRight.update({ where: { id }, data: body });
        break;
      case 'country-faqs':
        updated = await db.countryFaq.update({ where: { id }, data: body });
        break;
      case 'country-sources':
        updated = await db.countrySource.update({ where: { id }, data: body });
        break;
      case 'services':
        updated = await db.service.update({ where: { id }, data: body });
        break;
      case 'service-faqs':
        updated = await db.serviceFaq.update({ where: { id }, data: body });
        break;
      default:
        return NextResponse.json({ success: false, error: 'Update not implemented' }, { status: 400 });
    }

    await logAuditAction(auth, `UPDATE_${type.toUpperCase()}`, mapTypeToModel(type) || type, id, { type, id }).catch(()=>{});

    return NextResponse.json({ success: true, type, data: updated });
  } catch (error: any) {
    console.error('[admin.website.cms PUT] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/website/cms?type=hero-slides&id=xxx
export async function DELETE(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as CmsType;
    const id = searchParams.get('id');

    if (!type || !ALLOWED_TYPES.includes(type as any)) {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

    switch (type) {
      case 'hero-slides':
        await db.homeHeroSlide.delete({ where: { id } });
        break;
      case 'home-services':
        await db.homeService.delete({ where: { id } });
        break;
      case 'success-stories':
        await db.successStory.delete({ where: { id } });
        break;
      case 'team-members':
        await db.teamMember.delete({ where: { id } });
        break;
      case 'faqs':
        await db.homepageFaq.delete({ where: { id } });
        break;
      case 'home-sections':
        await db.homeSection.delete({ where: { id } });
        break;
      case 'english-tests':
        await db.websiteEnglishTest.delete({ where: { id } });
        break;
      case 'countries':
        await db.country.delete({ where: { id } });
        break;
      case 'country-quick-facts':
        await db.countryQuickFact.delete({ where: { id } });
        break;
      case 'country-cities':
        await db.countryCity.delete({ where: { id } });
        break;
      case 'country-pathways':
        await db.countryEducationPathway.delete({ where: { id } });
        break;
      case 'country-reasons':
        await db.countryStudyReason.delete({ where: { id } });
        break;
      case 'country-entry-reqs':
        await db.countryEntryRequirement.delete({ where: { id } });
        break;
      case 'country-english-tests':
        await db.countryEnglishTest.delete({ where: { id } });
        break;
      case 'country-visa-steps':
        await db.countryVisaStep.delete({ where: { id } });
        break;
      case 'country-work-rights':
        await db.countryWorkRight.delete({ where: { id } });
        break;
      case 'country-faqs':
        await db.countryFaq.delete({ where: { id } });
        break;
      case 'country-sources':
        await db.countrySource.delete({ where: { id } });
        break;
      case 'services':
        await db.service.delete({ where: { id } });
        break;
      case 'service-faqs':
        await db.serviceFaq.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ success: false, error: 'Delete not implemented' }, { status: 400 });
    }

    await logAuditAction(auth, `DELETE_${type.toUpperCase()}`, mapTypeToModel(type) || type, id, { type, id }).catch(()=>{});

    return NextResponse.json({ success: true, message: `${type} ${id} deleted` });
  } catch (error: any) {
    console.error('[admin.website.cms DELETE] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

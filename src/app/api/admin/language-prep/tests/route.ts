import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { ENGLISH_PREP_TESTS } from '@/lib/language-prep/data';

// GET — List all tests (admin view with verification fields)
export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    try {
      const tests = await (db as any).englishPrepTest.findMany({
        include: {
          modules: { orderBy: { sortOrder: 'asc' } },
          faqs: true,
          acceptance: true,
          requirements: true,
          resources: true,
          successStories: true,
        },
        orderBy: { sortOrder: 'asc' },
      });

      if (tests.length > 0) {
        return NextResponse.json({ success: true, tests });
      }
    } catch (e) {
      console.log('DB english_tests not migrated yet, using fallback');
    }

    // Fallback to static data
    const fallback = ENGLISH_PREP_TESTS.map(t => ({
      ...t,
      modules: [],
      faqs: [],
      acceptance: [],
      requirements: [],
      resources: [],
      successStories: [],
    }));

    return NextResponse.json({ success: true, tests: fallback, source: 'fallback_static', note: 'DB not migrated — showing static verified data' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — Create / Upsert test (Super Admin full, Admin limited)
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const primaryRole = auth.roles?.[0] || auth.userType || '';
    if (!['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(primaryRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden — Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, slug, shortName, provider, officialUrl, testType,
      description, longDescription, durationMinutes, durationDisplay,
      scoringSystem, resultTimeline, costSummary, validitySummary,
      format, bestFor, acceptanceSummary, difficultyLevel,
      sourceUrl, sourceName, verifiedBy, verificationStatus, lastVerifiedAt,
      seoTitle, seoDescription, canonicalUrl, isPopular, isFeatured, isPublished, sortOrder
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'Name and slug required' }, { status: 400 });
    }

    // Validate verification fields — every factual field must have source if verified
    if (verificationStatus === 'verified' && (!sourceUrl || !sourceName)) {
      return NextResponse.json({ success: false, error: 'Verified tests must have sourceUrl and sourceName' }, { status: 400 });
    }

    try {
      const test = await (db as any).englishPrepTest.upsert({
        where: { slug: slug.toLowerCase().trim() },
        update: {
          name,
          shortName: shortName || name,
          provider: provider || '',
          officialUrl: officialUrl || sourceUrl || '',
          testType: testType || 'english_proficiency',
          description: description || '',
          longDescription: longDescription || description || '',
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
          durationDisplay: durationDisplay || '',
          scoringSystem: scoringSystem || '',
          resultTimeline: resultTimeline || 'Check current provider information',
          costSummary: costSummary || 'Check current provider information',
          validitySummary: validitySummary || 'Check current provider information',
          format: format || 'Computer-based',
          bestFor: bestFor || '',
          acceptanceSummary: acceptanceSummary || '',
          difficultyLevel: difficultyLevel || 'Intermediate',
          sourceUrl: sourceUrl || '',
          sourceName: sourceName || '',
          verifiedBy: verifiedBy || auth.user?.email || 'admin',
          verificationStatus: verificationStatus || 'pending',
          lastVerifiedAt: lastVerifiedAt ? new Date(lastVerifiedAt) : new Date(),
          seoTitle: seoTitle || `${name} Preparation | Requirements, Format & Study Abroad Guidance | ALO Education`,
          seoDescription: seoDescription || description || '',
          canonicalUrl: canonicalUrl || `https://aloeducation.com/language-prep/${slug}`,
          isPopular: !!isPopular,
          isFeatured: !!isFeatured,
          isPublished: isPublished !== false,
          sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        },
        create: {
          name,
          slug: slug.toLowerCase().trim(),
          shortName: shortName || name,
          provider: provider || '',
          officialUrl: officialUrl || sourceUrl || '',
          testType: testType || 'english_proficiency',
          description: description || '',
          longDescription: longDescription || description || '',
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
          durationDisplay: durationDisplay || '',
          scoringSystem: scoringSystem || '',
          resultTimeline: resultTimeline || 'Check current provider information',
          costSummary: costSummary || 'Check current provider information',
          validitySummary: validitySummary || 'Check current provider information',
          format: format || 'Computer-based',
          bestFor: bestFor || '',
          acceptanceSummary: acceptanceSummary || '',
          difficultyLevel: difficultyLevel || 'Intermediate',
          sourceUrl: sourceUrl || '',
          sourceName: sourceName || '',
          verifiedBy: verifiedBy || auth.user?.email || 'admin',
          verificationStatus: verificationStatus || 'pending',
          lastVerifiedAt: lastVerifiedAt ? new Date(lastVerifiedAt) : new Date(),
          seoTitle: seoTitle || `${name} Preparation | Requirements, Format & Study Abroad Guidance | ALO Education`,
          seoDescription: seoDescription || description || '',
          canonicalUrl: canonicalUrl || `https://aloeducation.com/language-prep/${slug}`,
          isPopular: !!isPopular,
          isFeatured: !!isFeatured,
          isPublished: isPublished !== false,
          sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        },
      });

      await logAuditAction(auth, 'SAVE_ENGLISH_PREP_TEST', 'EnglishPrepTest', test.id, { name, slug, verificationStatus });

      return NextResponse.json({ success: true, message: `Test ${name} saved`, test });
    } catch (dbError: any) {
      console.log('DB save failed, likely table not migrated:', dbError.message);
      return NextResponse.json({
        success: false,
        error: 'Database table english_tests not migrated yet — run prisma migrate. Data validation passed.',
        details: dbError.message,
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { hasCurrentLanguagePrepVerification } from '@/lib/language-prep/verification';

function isHttpsUrl(value: string): boolean {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

// GET — list database-managed tests without substituting static catalogue data.
export async function GET(request: Request) {
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
    return NextResponse.json({ success: true, tests, source: 'database' });
  } catch (error) {
    console.error('Admin language-prep catalogue fetch failed', error);
    return NextResponse.json({ success: false, error: 'The language-prep catalogue is temporarily unavailable.' }, { status: 503 });
  }
}

// POST — create/update the existing EnglishPrepTest record; no parallel catalogue is created.
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;

  const primaryRole = auth.roles?.[0] || auth.userType || '';
  if (!['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(primaryRole)) {
    return NextResponse.json({ success: false, error: 'Forbidden — content-management permission required.' }, { status: 403 });
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'A valid JSON request body is required.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 180) : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const verificationStatus = typeof body.verificationStatus === 'string' ? body.verificationStatus.trim().toLowerCase() : 'pending';
  const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : '';
  const lastVerifiedAt = typeof body.lastVerifiedAt === 'string' ? body.lastVerifiedAt.trim() : '';

  if (!name || !/^[a-z0-9-]{1,100}$/.test(slug)) {
    return NextResponse.json({ success: false, error: 'A name and valid lowercase slug are required.' }, { status: 400 });
  }
  if (!['verified', 'pending', 'needs_review'].includes(verificationStatus)) {
    return NextResponse.json({ success: false, error: 'Unsupported verification status.' }, { status: 400 });
  }
  if (verificationStatus === 'verified' && (!sourceUrl || !isHttpsUrl(sourceUrl) || !body.sourceName || !lastVerifiedAt)) {
    return NextResponse.json({ success: false, error: 'Verified catalogue entries require an HTTPS source, source name, and explicit review date.' }, { status: 400 });
  }
  if (verificationStatus === 'verified' && !hasCurrentLanguagePrepVerification({
    verificationStatus,
    sourceUrl,
    lastVerifiedAt,
  })) {
    return NextResponse.json({ success: false, error: 'The source review date must be valid, not future-dated, and no more than 90 days old.' }, { status: 400 });
  }

  const durationMinutes = Number.parseInt(String(body.durationMinutes ?? ''), 10);
  const sortOrder = Number.parseInt(String(body.sortOrder ?? ''), 10);
  const lastVerifiedDate = verificationStatus === 'verified' ? new Date(lastVerifiedAt) : null;
  const shortDescription = typeof body.description === 'string'
    ? body.description.trim().slice(0, 5000)
    : typeof body.shortDescription === 'string' ? body.shortDescription.trim().slice(0, 5000) : '';
  const longDescription = typeof body.longDescription === 'string' ? body.longDescription.trim().slice(0, 20000) : shortDescription;
  const published = body.isPublished !== false;

  const data = {
    name,
    shortName: typeof body.shortName === 'string' ? body.shortName.trim().slice(0, 80) || name : name,
    provider: typeof body.provider === 'string' ? body.provider.trim().slice(0, 180) : '',
    officialUrl: typeof body.officialUrl === 'string' ? body.officialUrl.trim().slice(0, 2048) : sourceUrl,
    testType: typeof body.testType === 'string' ? body.testType.trim().slice(0, 60) : 'english_proficiency',
    shortDescription,
    longDescription,
    durationMinutes: Number.isFinite(durationMinutes) && durationMinutes >= 0 ? durationMinutes : 0,
    durationDisplay: typeof body.durationDisplay === 'string' ? body.durationDisplay.trim().slice(0, 180) : '',
    scoringSystem: typeof body.scoringSystem === 'string' ? body.scoringSystem.trim().slice(0, 500) : '',
    resultTimeline: typeof body.resultTimeline === 'string' ? body.resultTimeline.trim().slice(0, 500) : 'Check current provider information',
    costSummary: typeof body.costSummary === 'string' ? body.costSummary.trim().slice(0, 500) : 'Check current provider information',
    validitySummary: typeof body.validitySummary === 'string' ? body.validitySummary.trim().slice(0, 500) : 'Check current provider information',
    format: typeof body.format === 'string' ? body.format.trim().slice(0, 180) : '',
    bestFor: typeof body.bestFor === 'string' ? body.bestFor.trim().slice(0, 2000) : '',
    acceptanceSummary: typeof body.acceptanceSummary === 'string' ? body.acceptanceSummary.trim().slice(0, 2000) : '',
    difficultyLevel: typeof body.difficultyLevel === 'string' ? body.difficultyLevel.trim().slice(0, 80) : '',
    sourceUrl,
    sourceName: typeof body.sourceName === 'string' ? body.sourceName.trim().slice(0, 180) : '',
    verifiedBy: typeof body.verifiedBy === 'string' ? body.verifiedBy.trim().slice(0, 180) : auth.email || 'admin',
    verificationStatus,
    lastVerifiedAt: lastVerifiedDate,
    seoTitle: typeof body.seoTitle === 'string' ? body.seoTitle.trim().slice(0, 300) : `${name} Preparation | ALO Education`,
    seoDescription: typeof body.seoDescription === 'string' ? body.seoDescription.trim().slice(0, 500) : '',
    isPopular: body.isPopular === true,
    isFeatured: body.isFeatured === true,
    status: published ? 'active' : 'draft',
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };

  try {
    const test = await (db as any).englishPrepTest.upsert({
      where: { slug },
      update: data,
      create: { ...data, slug },
    });
    await logAuditAction(auth, 'SAVE_ENGLISH_PREP_TEST', 'EnglishPrepTest', test.id, { name, slug, verificationStatus, status: data.status });
    return NextResponse.json({ success: true, message: `Test ${name} saved.`, test });
  } catch (error) {
    console.error('Admin language-prep catalogue save failed', error);
    return NextResponse.json({ success: false, error: 'The catalogue entry could not be saved.' }, { status: 503 });
  }
}

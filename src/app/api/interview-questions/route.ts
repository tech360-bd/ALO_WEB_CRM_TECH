import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateInterviewGuidance } from '@/lib/interview/honesty';
import { buildQuestionPack, normalizeConfidence, normalizeSourceType } from '@/lib/interview/research';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Interview question library.
 *
 * GET now returns a *provenance-checked* pack (spec §31/§53/§54/§95/§96):
 * only questions with a real source and a verification inside the rolling
 * six-month window are publishable by default, every question carries its
 * source/confidence/freshness, and the mandatory honesty disclaimers are
 * attached. Staff may request stale evidence explicitly with
 * `?includeStale=true`; it is still labelled, never presented as current.
 *
 * The response keeps the historical `questions` array so existing consumers
 * keep working; `meta` and `groups` are additive.
 */
export async function GET(req: NextRequest) {
  const universitySlug = req.nextUrl.searchParams.get('universitySlug');
  const countrySlug = req.nextUrl.searchParams.get('countrySlug');
  const courseSlug = req.nextUrl.searchParams.get('courseSlug');
  const category = req.nextUrl.searchParams.get('category');
  const includeStale = req.nextUrl.searchParams.get('includeStale') === 'true';

  const where: Record<string, unknown> = { isActive: true };
  if (category) where.category = category;

  try {
    // Scope filtering happens in the engine so a bound question can never leak
    // into another university's pack.
    const rows = await db.interviewQuestion.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }],
      take: 500,
    });

    const pack = buildQuestionPack({
      questions: rows.map((row) => ({
        id: row.id,
        category: row.category,
        question: row.question,
        universitySlug: row.universitySlug,
        courseSlug: row.courseSlug,
        countrySlug: row.countrySlug,
        theme: row.theme,
        source: row.source,
        sourceType: row.sourceType,
        sourceUrl: row.sourceUrl,
        lastVerifiedAt: row.lastVerifiedAt,
        confidence: row.confidence,
        frequency: row.frequency,
        guidance: row.suggestedAnswer,
        isActive: row.isActive,
        sortOrder: row.sortOrder,
      })),
      now: new Date(),
      universitySlug,
      countrySlug,
      courseSlug,
      includeStale,
    });

    return NextResponse.json(
      {
        questions: pack.questions,
        groups: pack.groups,
        meta: {
          generatedAt: pack.generatedAt,
          researchWindowMonths: pack.researchWindowMonths,
          counts: pack.counts,
          excluded: pack.excluded,
          includeStale,
          disclaimers: pack.disclaimers,
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    // Fail closed on a sanitized error: never serve an unverified question as
    // if it were current evidence.
    return NextResponse.json(
      {
        questions: [],
        groups: [],
        meta: {
          error: 'Interview question library is temporarily unavailable.',
          disclaimers: [],
        },
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

/**
 * Create a question. Guidance that claims guaranteed outcomes, leaked or exact
 * questions is rejected outright (spec §96) rather than stored and served.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }
  const {
    universitySlug, courseSlug, countrySlug, category, question, suggestedAnswer,
    difficulty, theme, source, sourceType, sourceUrl, lastVerifiedAt, confidence, frequency,
  } = body as Record<string, unknown>;

  if (typeof category !== 'string' || !category.trim() || typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'category and question required' }, { status: 400 });
  }
  if (String(question).length > 500) {
    return NextResponse.json({ error: 'question must be 500 characters or fewer.' }, { status: 400 });
  }

  const answer = typeof suggestedAnswer === 'string' ? suggestedAnswer : '';
  if (answer) {
    const policy = validateInterviewGuidance(answer);
    if (!policy.ok) {
      return NextResponse.json(
        { error: 'Guidance contains a prohibited certainty or confidentiality claim.', violations: policy.violations },
        { status: 422 },
      );
    }
  }

  const normalizedSourceType = sourceType === undefined ? null : normalizeSourceType(String(sourceType));
  if (sourceType && !normalizedSourceType) {
    return NextResponse.json({ error: 'Unsupported sourceType.' }, { status: 400 });
  }

  const verifiedDate = typeof lastVerifiedAt === 'string' || lastVerifiedAt instanceof Date
    ? new Date(lastVerifiedAt as string | Date)
    : null;
  if (verifiedDate && Number.isNaN(verifiedDate.getTime())) {
    return NextResponse.json({ error: 'lastVerifiedAt must be a valid date.' }, { status: 400 });
  }

  try {
    const created = await db.interviewQuestion.create({
      data: {
        universitySlug: typeof universitySlug === 'string' ? universitySlug : null,
        courseSlug: typeof courseSlug === 'string' ? courseSlug : null,
        countrySlug: typeof countrySlug === 'string' ? countrySlug : null,
        category: String(category),
        question: String(question),
        suggestedAnswer: answer || null,
        difficulty: typeof difficulty === 'string' && difficulty ? difficulty : 'MEDIUM',
        theme: typeof theme === 'string' && theme ? theme : null,
        source: typeof source === 'string' && source.trim() ? source.trim() : null,
        sourceType: normalizedSourceType,
        sourceUrl: typeof sourceUrl === 'string' && sourceUrl.trim() ? sourceUrl.trim() : null,
        lastVerifiedAt: verifiedDate,
        confidence: normalizeConfidence(typeof confidence === 'string' ? confidence : null),
        frequency: Number.isFinite(Number(frequency)) ? Math.max(0, Math.trunc(Number(frequency))) : 0,
      },
    });
    return NextResponse.json({ question: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Question could not be saved.' }, { status: 503 });
  }
}

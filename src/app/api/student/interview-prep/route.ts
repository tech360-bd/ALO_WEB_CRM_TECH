import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';
import { INTERVIEW_DISCLAIMERS, INTERVIEW_RESEARCH_WINDOW_MONTHS } from '@/lib/interview/honesty';
import { ANSWER_FACT_KEYS, assembleAnswerFramework, buildQuestionPack } from '@/lib/interview/research';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Student interview preparation workspace feed (spec §30, §33, §38, §71).
 *
 * Every read is scoped to `auth.studentId` — a client-supplied student id is
 * ignored entirely. Question evidence comes from the provenance-checked
 * research pack, and the answer frameworks are assembled from facts the student
 * stored themselves; when a fact is missing the framework reports the gap
 * instead of generating prose.
 */

const FACT_COLUMNS = {
  reasonUniversity: 'reasonUniversity',
  reasonCourse: 'reasonCourse',
  fundingSource: 'fundingSource',
  futurePlan: 'futurePlan',
} as const;

const MAX_FACT_LENGTH = 1200;
const FRAMEWORK_LIMIT = 8;

type StoredFact = {
  reasonUniversity?: string | null;
  reasonCourse?: string | null;
  fundingSource?: string | null;
  futurePlan?: string | null;
} | null;

function toFacts(record: StoredFact) {
  if (!record) {
    return { reasonUniversity: '', reasonCourse: '', fundingSource: '', futurePlan: '' };
  }
  return {
    reasonUniversity: record.reasonUniversity ?? '',
    reasonCourse: record.reasonCourse ?? '',
    fundingSource: record.fundingSource ?? '',
    futurePlan: record.futurePlan ?? '',
  };
}

export const GET = withStudentAuth(async (request, auth) => {
  try {
    const url = new URL(request.url);
    const requestedApplicationId = url.searchParams.get('applicationId');

    const [applications, fact, sessions] = await Promise.all([
      db.application.findMany({
        where: { studentId: auth.studentId },
        select: {
          id: true,
          applicationId: true,
          applicationCode: true,
          universityId: true,
          universityName: true,
          courseName: true,
          country: true,
          intake: true,
          stage: true,
          offerStatus: true,
          visaHandoverStatus: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 25,
      }),
      db.studentInterviewFact.findUnique({ where: { studentId: auth.studentId } }),
      db.interviewSession.findMany({
        where: { studentId: auth.studentId },
        select: { id: true, type: true, status: true, readiness: true, startedAt: true, completedAt: true },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),
    ]);

    const selected = requestedApplicationId
      ? applications.find((application) => application.id === requestedApplicationId)
      : applications[0];

    // Resolve the university slug (the research library is keyed by slug) for
    // the selected application only; unknown ids are ignored rather than guessed.
    let universitySlug: string | null = null;
    if (selected?.universityId) {
      const university = await db.crmUniversity.findFirst({
        where: { OR: [{ id: selected.universityId }, { universityId: selected.universityId }] },
        select: { slug: true, universityId: true },
      });
      universitySlug = university?.slug || university?.universityId || null;
    }

    const rows = await db.interviewQuestion.findMany({
      where: { isActive: true },
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
      // Country slugs in the catalogue are lowercase ISO names ("uk", "canada").
      countrySlug: selected?.country ? selected.country.trim().toLowerCase().replace(/\s+/g, '-') : null,
      // Students never receive stale evidence: only the current window.
      includeStale: false,
    });

    const facts = toFacts(fact);
    const frameworks = pack.questions.slice(0, FRAMEWORK_LIMIT).map((question) => ({
      questionId: question.id,
      category: question.category,
      question: question.question,
      framework: assembleAnswerFramework({
        question: { id: question.id, category: question.category, question: question.question },
        facts,
      }),
    }));

    return NextResponse.json(
      {
        student: { studentCode: auth.studentCode, name: auth.name },
        applications: applications.map((application) => ({
          id: application.id,
          serial: application.applicationId || application.applicationCode,
          universityName: application.universityName,
          courseName: application.courseName,
          country: application.country,
          intake: application.intake,
          stage: application.stage,
          offerStatus: application.offerStatus,
          visaHandoverStatus: application.visaHandoverStatus,
        })),
        selectedApplicationId: selected?.id ?? null,
        scope: { universitySlug, countrySlug: pack.questions[0]?.countrySlug ?? null },
        facts,
        factsUpdatedAt: fact?.updatedAt ?? null,
        packs: {
          questions: pack.questions,
          groups: pack.groups,
          counts: pack.counts,
          withheld: pack.excluded.length,
        },
        frameworks,
        practice: {
          sessions: sessions.length,
          lastSessionAt: sessions[0]?.startedAt ?? null,
          latestReadiness: sessions.find((session) => session.readiness)?.readiness ?? null,
          history: sessions,
        },
        meta: {
          generatedAt: pack.generatedAt,
          researchWindowMonths: INTERVIEW_RESEARCH_WINDOW_MONTHS,
          disclaimers: [...INTERVIEW_DISCLAIMERS],
          factKeys: Object.values(ANSWER_FACT_KEYS),
          frameworkLimit: FRAMEWORK_LIMIT,
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Interview preparation is temporarily unavailable. No practice data was lost.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
});

/** Save the student's own facts. Only the authenticated student's row is written. */
export const POST = withStudentAuth(async (request, auth) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const data: Record<string, string> = {};
  for (const column of Object.values(FACT_COLUMNS)) {
    const value = input[column];
    if (value === undefined) continue;
    if (typeof value !== 'string') {
      return NextResponse.json({ error: `${column} must be text.` }, { status: 400 });
    }
    if (value.length > MAX_FACT_LENGTH) {
      return NextResponse.json({ error: `${column} must be ${MAX_FACT_LENGTH} characters or fewer.` }, { status: 400 });
    }
    data[column] = value.trim();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No recognised fact fields were supplied.' }, { status: 400 });
  }

  try {
    const saved = await db.studentInterviewFact.upsert({
      where: { studentId: auth.studentId },
      create: {
        studentId: auth.studentId,
        reasonUniversity: data.reasonUniversity ?? '',
        reasonCourse: data.reasonCourse ?? '',
        fundingSource: data.fundingSource ?? '',
        futurePlan: data.futurePlan ?? '',
        updatedBy: auth.studentCode,
      },
      update: { ...data, updatedBy: auth.studentCode },
    });

    return NextResponse.json(
      {
        success: true,
        facts: toFacts(saved),
        updatedAt: saved.updatedAt,
        note: 'Only the facts you enter are used. The coach cannot add income, sponsors, results or plans you did not state.',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Your interview facts could not be saved.' }, { status: 503 });
  }
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  auth: { studentId: 'student-1', studentCode: 'AE-2026000001', name: 'Test Student', email: 's@alo.test', phone: '', sessionId: 'sess', sessionToken: 'tok' },
  applications: vi.fn(),
  facts: vi.fn(),
  upsert: vi.fn(),
  sessions: vi.fn(),
  university: vi.fn(),
  questions: vi.fn(),
}));

vi.mock('@/lib/student-auth', () => ({
  withStudentAuth: (handler: (request: Request, auth: unknown) => Promise<Response>) =>
    (request: Request) => handler(request, m.auth),
}));
vi.mock('@/lib/db', () => ({
  db: {
    application: { findMany: m.applications },
    studentInterviewFact: { findUnique: m.facts, upsert: m.upsert },
    interviewSession: { findMany: m.sessions },
    crmUniversity: { findFirst: m.university },
    interviewQuestion: { findMany: m.questions },
  },
}));

import { GET, POST } from '@/app/api/student/interview-prep/route';

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
const get = (query = '') => new Request(`https://alo.test/api/student/interview-prep${query}`);
const post = (body: unknown) => new Request('https://alo.test/api/student/interview-prep', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const sourced = (overrides: Record<string, unknown> = {}) => ({
  id: 'q1',
  category: 'COURSE',
  question: 'Why this course?',
  universitySlug: 'birmingham',
  courseSlug: null,
  countrySlug: null,
  theme: 'academic',
  source: 'Official course page',
  sourceType: 'OFFICIAL_UNIVERSITY',
  sourceUrl: null,
  lastVerifiedAt: daysAgo(20),
  confidence: 'HIGH',
  frequency: 2,
  suggestedAnswer: null,
  difficulty: 'MEDIUM',
  sortOrder: 0,
  isActive: true,
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
  m.applications.mockResolvedValue([
    { id: 'app-1', applicationId: 'AE-2026000001-01', applicationCode: 'C1', universityId: 'u1', universityName: 'University of Birmingham', courseName: 'MSc Computer Science', country: 'uk', intake: '2027-09', stage: 'SUBMITTED', offerStatus: 'PENDING', visaHandoverStatus: 'NOT_READY', updatedAt: new Date() },
  ]);
  m.facts.mockResolvedValue(null);
  m.upsert.mockImplementation(async (args: { create: Record<string, unknown>; update: Record<string, unknown> }) => ({
    id: 'fact-1',
    ...args.create,
    ...args.update,
    updatedAt: new Date(),
  }));
  m.sessions.mockResolvedValue([]);
  m.university.mockResolvedValue({ slug: 'birmingham', universityId: 'u1' });
  m.questions.mockResolvedValue([sourced()]);
});

describe('GET /api/student/interview-prep', () => {
  it('scopes every read to the authenticated student and ignores a client-supplied id', async () => {
    const response = await GET(get('?studentId=victim&applicationId=app-1'));
    expect(response.status).toBe(200);
    expect(m.applications).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: 'student-1' } }));
    expect(m.facts).toHaveBeenCalledWith({ where: { studentId: 'student-1' } });
    expect(m.sessions).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: 'student-1' } }));
  });

  it('publishes only sourced questions inside the research window', async () => {
    m.questions.mockResolvedValue([
      sourced(),
      sourced({ id: 'q-unverified', question: 'Unsourced?', source: null, lastVerifiedAt: null }),
      sourced({ id: 'q-expired', question: 'Expired?', lastVerifiedAt: daysAgo(500) }),
    ]);
    const body = await (await GET(get())).json();
    expect(body.packs.questions.map((q: { id: string }) => q.id)).toEqual(['q1']);
    expect(body.packs.withheld).toBe(2);
    expect(body.packs.counts.publishable).toBe(1);
  });

  it('returns an unpublished framework until the student supplies the required fact', async () => {
    const empty = await (await GET(get())).json();
    expect(empty.frameworks[0].framework.ready).toBe(false);
    expect(empty.frameworks[0].framework.missingFacts).toEqual(['reasonCourse']);
    expect(empty.frameworks[0].framework.shortAnswerDraft).toBeNull();

    m.facts.mockResolvedValue({
      reasonUniversity: 'Modules', reasonCourse: 'Data engineering modules', fundingSource: 'Father', futurePlan: 'Data analyst',
      updatedAt: new Date(),
    });
    const filled = await (await GET(get())).json();
    expect(filled.frameworks[0].framework.ready).toBe(true);
    expect(filled.frameworks[0].framework.shortAnswerDraft).toBe('Data engineering modules');
  });

  it('never returns stale evidence to a student', async () => {
    m.questions.mockResolvedValue([sourced({ lastVerifiedAt: daysAgo(200) })]);
    const body = await (await GET(get())).json();
    expect(body.packs.questions).toEqual([]);
    expect(body.packs.withheld).toBe(1);
  });

  it('labels the pack with the honesty disclaimers and research window', async () => {
    const body = await (await GET(get())).json();
    expect(body.meta.researchWindowMonths).toBe(6);
    expect(body.meta.disclaimers.length).toBeGreaterThan(0);
    expect(body.meta.disclaimers.join(' ')).not.toMatch(/guarantee(d)? (a )?(visa|admission)/i);
  });

  it('fails closed with a sanitized message', async () => {
    m.applications.mockRejectedValue(new Error('mysql://dummy-user:dummy-password@db.invalid refused'));
    const response = await GET(get());
    expect(response.status).toBe(503);
    const text = await response.text();
    expect(text).not.toContain('mysql://');
  });
});

describe('POST /api/student/interview-prep', () => {
  it('writes only the authenticated student\'s facts, ignoring a body studentId', async () => {
    const response = await POST(post({
      studentId: 'victim',
      reasonCourse: 'Data engineering modules',
      fundingSource: 'Father',
    }));
    expect(response.status).toBe(200);
    if (!('upsert' in m)) return;
    expect(m.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { studentId: 'student-1' },
      create: expect.objectContaining({ studentId: 'student-1', reasonCourse: 'Data engineering modules' }),
    }));
    const upsertArg = m.upsert.mock.calls[0][0] as { create: Record<string, unknown> };
    expect(JSON.stringify(upsertArg.create)).not.toContain('victim');
  });

  it('trims values and rejects non-string facts', async () => {
    expect((await POST(post({ reasonCourse: 42 }))).status).toBe(400);
    expect(m.upsert).not.toHaveBeenCalled();

    await POST(post({ reasonCourse: '  spaced  ' }));
    const arg = m.upsert.mock.calls[0][0] as { create: Record<string, unknown>; update: Record<string, unknown> };
    expect(arg.update.reasonCourse).toBe('spaced');
  });

  it('rejects oversized facts instead of silently truncating', async () => {
    expect((await POST(post({ futurePlan: 'x'.repeat(1201) }))).status).toBe(400);
    expect(m.upsert).not.toHaveBeenCalled();
  });

  it('rejects a body with no recognised fact fields', async () => {
    expect((await POST(post({ nickname: 'nope' }))).status).toBe(400);
    expect(m.upsert).not.toHaveBeenCalled();
  });

  it('reports a sanitized failure when the write fails', async () => {
    m.upsert.mockRejectedValue(new Error('duplicate key mysql://dummy-user:dummy-password@db.invalid'));
    const response = await POST(post({ reasonCourse: 'ok' }));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('dummy-password');
  });
});

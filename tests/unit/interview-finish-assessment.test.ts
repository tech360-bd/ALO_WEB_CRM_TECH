import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  sessionFindFirst: vi.fn(),
  answerFindMany: vi.fn(),
  applicationFindMany: vi.fn(),
  assessmentUpsert: vi.fn(),
  resultUpsert: vi.fn(),
  sessionUpdate: vi.fn(),
  eventCreate: vi.fn(),
  timelineCreate: vi.fn(),
}));

vi.mock('@/lib/student-auth', () => ({ authenticateStudentRequest: m.auth }));
vi.mock('@/lib/db', () => ({
  db: {
    aiInterviewSession: { findFirst: m.sessionFindFirst },
    aiInterviewAnswer: { findMany: m.answerFindMany },
    application: { findMany: m.applicationFindMany },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn({
      interviewAssessment: { upsert: m.assessmentUpsert },
      aiInterviewResult: { upsert: m.resultUpsert },
      aiInterviewSession: { update: m.sessionUpdate },
      studentEvent: { create: m.eventCreate },
      timelineEvent: { create: m.timelineCreate },
    })),
  },
}));

import { POST } from '@/app/api/visa/ai-interview/[sessionId]/finish/route';

const ctx = (sessionId = 'session-1') => ({ params: Promise.resolve({ sessionId }) });
const req = (body?: unknown) => new Request('https://alo.test/api/visa/ai-interview/session-1/finish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
});

const transcript = JSON.stringify({
  language: 'english',
  difficulty: 'standard',
  answers: [
    { question: 'Why this university?', answer: 'Because its lab is strong.', category: 'UNIVERSITY' },
    { question: 'Why this course?', answer: 'Because I need the qualification.', category: 'COURSE' },
    { question: 'How will you pay?', answer: 'My father sponsors me with a bank statement.', category: 'FINANCIAL' },
  ],
});

beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ studentId: 'student-1', studentCode: 'AE-2026000001', name: 'Test Student', email: '', phone: '', sessionId: 's', sessionToken: 't' });
  m.sessionFindFirst.mockResolvedValue({ id: 'session-1', status: 'in_progress', interviewType: 'embassy_mock', transcript });
  m.answerFindMany.mockResolvedValue([
    { question: 'Why this university?', answer: 'Because its lab is strong and I compared three offers before deciding.', transcript: '' },
    { question: 'Why this course?', answer: 'Because I need the qualification for a senior role and the modules match my work.', transcript: '' },
    { question: 'How will you pay?', answer: 'My father sponsors me with a bank statement covering the first year and 12 months of living costs.', transcript: '' },
  ]);
  m.applicationFindMany.mockResolvedValue([{ universityName: 'University of Greenwich', courseName: 'MSc Computer Science' }]);
  m.assessmentUpsert.mockResolvedValue({ id: 'assessment-1' });
  m.resultUpsert.mockResolvedValue({});
  m.sessionUpdate.mockResolvedValue({});
  m.eventCreate.mockResolvedValue({});
  m.timelineCreate.mockResolvedValue({});
});

describe('finishing a practice session', () => {
  it('creates a PENDING preliminary assessment and tells the student a human decides', async () => {
    const response = await POST(req(), ctx());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.assessmentStatus).toBe('pending_human_review');
    expect(body.assessmentId).toBe('assessment-1');
    expect(body.preliminary.humanReviewRequired).toBe(true);
    expect(body.preliminary.label).toMatch(/^Preliminary/);
    expect(body.note).toMatch(/may override it in full/i);

    const create = m.assessmentUpsert.mock.calls[0][0] as { create: Record<string, unknown> };
    expect(create.create.reviewStatus).toBe('PENDING');
    expect(create.create.studentId).toBe('student-1');
    expect(create.create.engine).toBe('DETERMINISTIC_RUBRIC');
    expect(create.create.answerCount).toBe(3);
  });

  it('never writes a human-sounding verdict into the legacy result row', async () => {
    await POST(req(), ctx());
    const call = m.resultUpsert.mock.calls[0][0] as { create: { verdict: string } };
    expect(call.create.verdict).toBe('pending_human_review');
  });

  it('rejects scores or a verdict submitted by the student', async () => {
    const response = await POST(req({ verdict: 'READY', overallScore: 99 }), ctx());
    expect(response.status).toBe(400);
    expect(m.assessmentUpsert).not.toHaveBeenCalled();
  });

  it('rejects a session with no recorded answers', async () => {
    m.answerFindMany.mockResolvedValue([]);
    const response = await POST(req(), ctx());
    expect(response.status).toBe(400);
    expect(m.assessmentUpsert).not.toHaveBeenCalled();
  });

  it('rejects a session that is already complete', async () => {
    m.sessionFindFirst.mockResolvedValue({ id: 'session-1', status: 'completed', interviewType: 'embassy_mock', transcript });
    expect((await POST(req(), ctx())).status).toBe(409);
  });

  it('does not leak another student\'s session', async () => {
    m.sessionFindFirst.mockResolvedValue(null);
    expect((await POST(req(), ctx('someone-elses-session'))).status).toBe(404);
    expect(m.auth).toHaveBeenCalled();
  });

  it('returns the auth failure untouched', async () => {
    m.auth.mockResolvedValue(NextResponse.json({ error: 'Student session required.' }, { status: 401 }));
    expect((await POST(req(), ctx())).status).toBe(401);
    expect(m.sessionFindFirst).not.toHaveBeenCalled();
  });

  it('falls back to GENERAL categories when the transcript has none', async () => {
    m.sessionFindFirst.mockResolvedValue({ id: 'session-1', status: 'in_progress', interviewType: 'embassy_mock', transcript: JSON.stringify({ answers: [] }) });
    const response = await POST(req(), ctx());
    expect(response.status).toBe(200);
    const create = m.assessmentUpsert.mock.calls[0][0] as { create: { dimensions: string } };
    const dimensions = JSON.parse(create.create.dimensions) as Array<{ key: string }>;
    expect(dimensions.map((dimension) => dimension.key)).not.toContain('COURSE');
  });
});

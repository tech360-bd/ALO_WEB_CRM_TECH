import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  auth: { studentId: 'student-1', studentCode: 'AE-2026000001', name: 'Test Student', email: '', phone: '', sessionId: 's', sessionToken: 't' },
  findMany: vi.fn(),
}));

vi.mock('@/lib/student-auth', () => ({
  withStudentAuth: (handler: (request: Request, auth: unknown) => Promise<Response>) =>
    (request: Request) => handler(request, m.auth),
}));
vi.mock('@/lib/db', () => ({ db: { interviewAssessment: { findMany: m.findMany } } }));

import { GET } from '@/app/api/student/interview-assessment/route';

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'assessment-1',
  sessionId: 'session-1',
  verdict: 'READY_WITH_IMPROVEMENT',
  confidence: 'MEDIUM',
  overallScore: 58,
  dimensions: JSON.stringify([{ key: 'structure', label: 'Answer structure', score: 64, basis: 'Averaged.' }]),
  strengths: JSON.stringify(['Uses reason clauses.']),
  improvements: JSON.stringify(['Add concrete detail.']),
  limitations: JSON.stringify(['Not a visa decision.']),
  answerCount: 3,
  averageWords: 42,
  reviewStatus: 'PENDING',
  finalVerdict: null,
  studentMessage: '',
  reviewedByName: '',
  reviewedAt: null,
  generatedAt: new Date('2026-10-24T10:00:00Z'),
  internalNotes: 'DO NOT LEAK',
  reviewedById: 'counselor-1',
  rationale: 'DO NOT LEAK',
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
  m.findMany.mockResolvedValue([row()]);
});

describe('student interview assessments', () => {
  it('scopes the query to the authenticated student', async () => {
    await GET(new Request('https://alo.test/api/student/interview-assessment'));
    expect(m.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: 'student-1' } }));
  });

  it('labels a pending result as preliminary and says it is not final', async () => {
    const body = await (await GET(new Request('https://alo.test/api/student/interview-assessment'))).json();
    expect(body.assessments[0].status).toBe('PENDING');
    expect(body.assessments[0].preliminary.label).toMatch(/^Preliminary/);
    expect(body.assessments[0].final).toBeNull();
    expect(body.pendingReview).toBe(true);
    expect(body.note).toMatch(/not final/i);
  });

  it('leads with the counselor verdict once reviewed and shows who decided', async () => {
    m.findMany.mockResolvedValue([row({
      reviewStatus: 'REVIEWED',
      finalVerdict: 'READY',
      studentMessage: 'You are ready — keep rehearsing the funding answer.',
      reviewedByName: 'Rahim Uddin',
      reviewedAt: new Date('2026-10-24T12:00:00Z'),
    })]);
    const body = await (await GET(new Request('https://alo.test/api/student/interview-assessment'))).json();
    expect(body.assessments[0].status).toBe('REVIEWED');
    expect(body.assessments[0].final).toMatchObject({
      verdict: 'READY',
      counselor: 'Rahim Uddin',
      changedFromPreliminary: true,
    });
    expect(body.pendingReview).toBe(false);
  });

  it('never returns internal notes, reviewer IDs or the raw rationale', async () => {
    const response = await GET(new Request('https://alo.test/api/student/interview-assessment'));
    const raw = JSON.stringify(await response.json());
    expect(raw).not.toContain('DO NOT LEAK');
    expect(raw).not.toContain('reviewedById');
  });

  it('returns an empty list rather than an error when nothing exists', async () => {
    m.findMany.mockResolvedValue([]);
    const body = await (await GET(new Request('https://alo.test/api/student/interview-assessment'))).json();
    expect(body.assessments).toEqual([]);
    expect(body.pendingReview).toBe(false);
  });

  it('returns a sanitized 503 when the database fails', async () => {
    m.findMany.mockRejectedValue(new Error('connection refused'));
    const response = await GET(new Request('https://alo.test/api/student/interview-assessment'));
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.error).not.toMatch(/connection refused/);
  });
});

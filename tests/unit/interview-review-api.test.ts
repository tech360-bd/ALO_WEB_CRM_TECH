import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  assessmentFindUnique: vi.fn(),
  assessmentFindMany: vi.fn(),
  assessmentCount: vi.fn(),
  assessmentUpdate: vi.fn(),
  decisionCreate: vi.fn(),
  decisionFindFirst: vi.fn(),
  studentFindMany: vi.fn(),
  studentFindFirst: vi.fn(),
  applicationFindMany: vi.fn(),
  applicationFindFirst: vi.fn(),
  studentEventCreate: vi.fn(),
  timelineEventCreate: vi.fn(),
  canViewB2B: vi.fn(),
}));

vi.mock('@/lib/counselor/student-access', () => ({
  requireCanonicalCounselor: m.auth,
  counselorStudentScope: (auth: { userType: string; userId: string }) =>
    ['ADMIN', 'SUPER_ADMIN'].includes(auth.userType.toUpperCase()) ? {} : { counselorId: auth.userId },
}));
vi.mock('@/lib/ucc/document-access', () => ({ canViewUccB2B: m.canViewB2B }));
vi.mock('@/lib/db', () => ({
  db: {
    interviewAssessment: {
      findUnique: m.assessmentFindUnique,
      findMany: m.assessmentFindMany,
      count: m.assessmentCount,
      update: m.assessmentUpdate,
    },
    interviewReviewDecision: { create: m.decisionCreate, findFirst: m.decisionFindFirst },
    student: { findMany: m.studentFindMany, findFirst: m.studentFindFirst },
    application: { findMany: m.applicationFindMany, findFirst: m.applicationFindFirst },
    studentEvent: { create: m.studentEventCreate },
    timelineEvent: { create: m.timelineEventCreate },
    $transaction: vi.fn(async (ops: unknown) => {
      if (Array.isArray(ops)) return Promise.all(ops);
      return (ops as (tx: unknown) => unknown)({});
    }),
  },
}));

import { GET, POST } from '@/app/api/crm/interview-review/route';

const assessment = {
  id: 'assessment-1',
  sessionId: 'session-1',
  studentId: 'student-1',
  applicationId: '',
  engine: 'DETERMINISTIC_RUBRIC',
  engineVersion: '1.0.0',
  verdict: 'READY_WITH_IMPROVEMENT',
  confidence: 'MEDIUM',
  overallScore: 58,
  dimensions: JSON.stringify([{ key: 'structure', label: 'Answer structure', score: 64, basis: 'Averaged across 3 recorded answers.' }]),
  strengths: JSON.stringify(['Uses reason clauses.']),
  improvements: JSON.stringify(['Add concrete detail.']),
  evidence: JSON.stringify([]),
  limitations: JSON.stringify(['Not a visa decision.']),
  answerCount: 3,
  averageWords: 42,
  reviewStatus: 'PENDING',
  finalVerdict: null as string | null,
  studentMessage: '',
  reviewedById: null as string | null,
  reviewedByName: '',
  reviewedAt: null as Date | null,
  generatedAt: new Date('2026-10-24T10:00:00Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const post = (body: unknown) => new Request('https://alo.test/api/crm/interview-review', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const get = (query = '') => new Request(`https://alo.test/api/crm/interview-review${query}`);

beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ userId: 'counselor-1', userType: 'COUNSELOR', name: 'Rahim Uddin', roles: ['COUNSELOR'], permissions: [] });
  m.canViewB2B.mockReturnValue(false);
  m.assessmentFindUnique.mockResolvedValue(assessment);
  m.assessmentFindMany.mockResolvedValue([assessment]);
  m.assessmentCount.mockResolvedValue(1);
  m.assessmentUpdate.mockResolvedValue({ ...assessment, reviewStatus: 'REVIEWED', finalVerdict: 'READY' });
  m.decisionCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({ id: 'decision-1', decidedAt: new Date(), ...args.data }));
  m.decisionFindFirst.mockResolvedValue(null);
  m.studentFindMany.mockResolvedValue([{ id: 'student-1', studentId: 'AE-2026000001', name: 'Test Student' }]);
  m.studentFindFirst.mockResolvedValue({ id: 'student-1', studentId: 'AE-2026000001', name: 'Test Student', counselorId: 'counselor-1' });
  m.applicationFindMany.mockResolvedValue([]);
  m.applicationFindFirst.mockResolvedValue(null);
  m.studentEventCreate.mockResolvedValue({});
  m.timelineEventCreate.mockResolvedValue({});
});

describe('review queue', () => {
  it('returns pending and decided assessments inside the counselor scope', async () => {
    const response = await GET(get());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(m.studentFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { counselorId: 'counselor-1' } }));
    expect(body.pending).toHaveLength(1);
    expect(body.pending[0].student).toEqual({ studentId: 'AE-2026000001', name: 'Test Student' });
    expect(body.pending[0].dimensions[0].key).toBe('structure');
    expect(body.counts.pending).toBe(1);
  });

  it('hides assessments belonging to a confidential B2B student', async () => {
    m.applicationFindMany.mockResolvedValue([{ studentId: 'student-1' }]);
    const body = await (await GET(get())).json();
    expect(body.pending).toHaveLength(0);
    expect(m.assessmentFindMany).not.toHaveBeenCalled();
  });

  it('forwards the authorization failure untouched', async () => {
    m.auth.mockResolvedValue(NextResponse.json({ error: 'Canonical User counselor access required.' }, { status: 403 }));
    expect((await GET(get())).status).toBe(403);
    expect(m.assessmentFindMany).not.toHaveBeenCalled();
  });
});

describe('recording a decision', () => {
  const valid = { assessmentId: 'assessment-1', finalVerdict: 'READY', rationale: 'Reviewed the transcript in full against the recorded answers.', studentMessage: 'You are ready — keep rehearsing the funding answer.' };

  it('saves the human verdict, the reviewer and an audit event', async () => {
    const response = await POST(post(valid));
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.decision).toMatchObject({ aiVerdict: 'READY_WITH_IMPROVEMENT', finalVerdict: 'READY', overridden: true, direction: 'UPGRADED', reviewerName: 'Rahim Uddin' });
    expect(m.decisionCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        aiVerdict: 'READY_WITH_IMPROVEMENT',
        finalVerdict: 'READY',
        overridden: true,
        reviewerId: 'counselor-1',
        reviewerName: 'Rahim Uddin',
        reviewerRole: 'COUNSELOR',
      }),
    }));
    expect(m.assessmentUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'assessment-1' },
      data: expect.objectContaining({ reviewStatus: 'REVIEWED', finalVerdict: 'READY', reviewedById: 'counselor-1' }),
    }));
    expect(m.studentEventCreate).toHaveBeenCalled();
    expect(m.timelineEventCreate).toHaveBeenCalled();
  });

  it('reads the AI verdict from the database, not from the request', async () => {
    await POST(post({ ...valid, finalVerdict: 'READY', aiVerdict: 'NEEDS_MORE_PRACTICE', overridden: false }));
    const call = m.decisionCreate.mock.calls[0][0] as { data: { aiVerdict: string; overridden: boolean } };
    expect(call.data.aiVerdict).toBe('READY_WITH_IMPROVEMENT');
    expect(call.data.overridden).toBe(true);
  });

  it('records agreement as agreement', async () => {
    m.assessmentFindUnique.mockResolvedValue({ ...assessment, verdict: 'READY' });
    const response = await POST(post(valid));
    const body = await response.json();
    expect(body.decision.overridden).toBe(false);
    expect(body.decision.direction).toBe('AGREED');
  });

  it('requires a rationale of at least 20 characters', async () => {
    expect((await POST(post({ ...valid, rationale: 'fine' }))).status).toBe(400);
    expect(m.decisionCreate).not.toHaveBeenCalled();
  });

  it('requires a student message when overriding the preliminary verdict', async () => {
    const response = await POST(post({ ...valid, studentMessage: '' }));
    expect(response.status).toBe(400);
    expect(m.decisionCreate).not.toHaveBeenCalled();
  });

  it('allows an override with no student message when only confirming', async () => {
    m.assessmentFindUnique.mockResolvedValue({ ...assessment, verdict: 'READY' });
    const response = await POST(post({ ...valid, studentMessage: '' }));
    expect(response.status).toBe(201);
  });

  it('rejects an unknown verdict', async () => {
    expect((await POST(post({ ...valid, finalVerdict: 'APPROVED' }))).status).toBe(400);
  });

  it('refuses to overwrite an existing final decision', async () => {
    m.assessmentFindUnique.mockResolvedValue({ ...assessment, reviewStatus: 'REVIEWED', finalVerdict: 'READY' });
    const response = await POST(post(valid));
    expect(response.status).toBe(409);
    expect(m.decisionCreate).not.toHaveBeenCalled();
  });

  it('lets only an administrator revise a final decision, appending a superseding row', async () => {
    m.assessmentFindUnique.mockResolvedValue({ ...assessment, reviewStatus: 'REVIEWED', finalVerdict: 'READY' });
    m.decisionFindFirst.mockResolvedValue({ id: 'decision-0' });

    const counselor = await POST(post({ ...valid, revise: true }));
    expect(counselor.status).toBe(403);

    m.auth.mockResolvedValue({ userId: 'admin-1', userType: 'ADMIN', name: 'Admin User', roles: ['ADMIN'], permissions: [] });
    m.studentFindFirst.mockResolvedValue({ id: 'student-1', studentId: 'AE-2026000001', name: 'Test Student', counselorId: 'counselor-1' });
    const admin = await POST(post({ ...valid, revise: true }));
    expect(admin.status).toBe(201);
    expect(m.decisionCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ supersedesId: 'decision-0' }) }));
  });

  it('refuses an assessment whose student is outside the caller scope', async () => {
    m.studentFindFirst.mockResolvedValue(null);
    expect((await POST(post(valid))).status).toBe(404);
    expect(m.decisionCreate).not.toHaveBeenCalled();
  });

  it('refuses a confidential B2B student', async () => {
    m.applicationFindFirst.mockResolvedValue({ id: 'app-1' });
    expect((await POST(post(valid))).status).toBe(404);
    expect(m.decisionCreate).not.toHaveBeenCalled();
  });
});

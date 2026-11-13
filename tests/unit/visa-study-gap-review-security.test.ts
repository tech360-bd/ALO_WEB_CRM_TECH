import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  visaCaseFindUnique: vi.fn(),
  studentDocumentFindMany: vi.fn(),
  reviewFindUnique: vi.fn(),
  reviewUpsert: vi.fn(),
  auditCreate: vi.fn(),
  timelineCreate: vi.fn(),
}));

const transactionClient = {
  visaStudyGapReview: { upsert: (...args: unknown[]) => mocks.reviewUpsert(...args) },
  portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
  timelineEvent: { create: (...args: unknown[]) => mocks.timelineCreate(...args) },
};

vi.mock('@/lib/db', () => ({
  db: {
    visaCase: { findUnique: (...args: unknown[]) => mocks.visaCaseFindUnique(...args) },
    studentDocument: { findMany: (...args: unknown[]) => mocks.studentDocumentFindMany(...args) },
    visaStudyGapReview: { findUnique: (...args: unknown[]) => mocks.reviewFindUnique(...args) },
    $transaction: (callback: (client: typeof transactionClient) => unknown) => callback(transactionClient),
  },
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, unknown>, context?: unknown) => Promise<Response>) =>
    (request: Request, context?: unknown) => handler(request, mocks.auth(), context),
}));

import { PATCH } from '@/app/api/visa/study-gap-review/[caseId]/route';

const assignedCase = {
  id: 'case-1',
  studentId: 'student-1',
  visaOfficerId: 'officer-1',
  counselorId: 'counselor-1',
  applicationOfficerId: 'application-1',
};

function request(body: unknown) {
  return new Request('https://alo.test/api/visa/study-gap-review/case-1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue({
    userId: 'officer-1',
    actorUserId: 'officer-1',
    userType: 'VISA_OFFICER',
    roles: ['VISA_OFFICER'],
    permissions: ['visa.cases.view', 'visa.risk.update', 'visa.documents.view'],
  });
  mocks.visaCaseFindUnique.mockResolvedValue(assignedCase);
  mocks.studentDocumentFindMany.mockResolvedValue([]);
  mocks.reviewFindUnique.mockResolvedValue(null);
  mocks.reviewUpsert.mockResolvedValue({
    id: 'review-1',
    caseId: 'case-1',
    studentId: 'student-1',
    hasStudyGap: true,
    gapDurationMonths: 6,
    medicalReason: '',
    supportingDocuments: '[]',
  });
  mocks.auditCreate.mockResolvedValue({});
  mocks.timelineCreate.mockResolvedValue({});
});

describe('Visa study-gap review security', () => {
  it('requires evidence to belong to the assigned student and this case or be case-less', async () => {
    const response = await PATCH(request({
      hasStudyGap: true,
      gapDurationMonths: 6,
      supportingDocumentIds: ['document-from-another-case'],
    }), { params: { caseId: 'case-1' } });

    expect(response.status).toBe(400);
    expect(mocks.studentDocumentFindMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['document-from-another-case'] },
        studentId: 'student-1',
        caseId: { in: ['case-1', ''] },
        isArchived: false,
        storagePath: { not: null },
        mimeType: { not: null },
        fileHash: { not: null },
      },
      select: { id: true, category: true },
    });
    expect(mocks.reviewUpsert).not.toHaveBeenCalled();
  });

  it('does not let a risk-review permissioner update sensitive medical details', async () => {
    const response = await PATCH(request({
      hasStudyGap: true,
      gapDurationMonths: 6,
      medicalReason: 'Private medical explanation',
    }), { params: { caseId: 'case-1' } });

    expect(response.status).toBe(403);
    expect(mocks.studentDocumentFindMany).not.toHaveBeenCalled();
    expect(mocks.reviewUpsert).not.toHaveBeenCalled();
  });

  it('accepts a stored document already associated with the same case', async () => {
    mocks.studentDocumentFindMany.mockResolvedValueOnce([{ id: 'document-case-1', category: 'study_gap' }]);
    const response = await PATCH(request({
      hasStudyGap: true,
      gapDurationMonths: 6,
      gapPurpose: 'Work experience and independent study.',
      supportingDocumentIds: ['document-case-1'],
    }), { params: { caseId: 'case-1' } });

    expect(response.status).toBe(200);
    expect(mocks.reviewUpsert).toHaveBeenCalledOnce();
  });

  it('preserves existing private evidence when a review edit omits the document field', async () => {
    mocks.reviewFindUnique.mockResolvedValueOnce({ supportingDocuments: '["existing-case-document"]' });
    const response = await PATCH(request({
      hasStudyGap: true,
      gapDurationMonths: 8,
      gapPurpose: 'Employment and training.',
    }), { params: { caseId: 'case-1' } });

    expect(response.status).toBe(200);
    expect(mocks.studentDocumentFindMany).not.toHaveBeenCalled();
    expect(mocks.reviewUpsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ supportingDocuments: '["existing-case-document"]' }),
    }));
  });
});

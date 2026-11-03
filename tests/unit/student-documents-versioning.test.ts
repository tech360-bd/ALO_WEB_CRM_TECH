import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

/**
 * Student document slot: idempotency, non-destructive versions and the "current
 * version" marker.
 *
 * Requirement under test: uploading the same document three times must retain
 * three versions (never overwrite), a retry of the *same bytes* must not create a
 * duplicate row, and the list must identify which upload is the live one without
 * hiding the earlier ones.
 */
const mocks = vi.hoisted(() => ({
  auth: { studentId: 'student-1', studentCode: 'ALO-STU-1', name: 'Student One', email: 's1@example.test' },
  db: {
    studentDocument: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    documentAudit: { create: vi.fn() },
    portalAuditLog: { create: vi.fn() },
    studentEvent: { create: vi.fn() },
    timelineEvent: { create: vi.fn() },
    application: { findMany: vi.fn() },
    applicationDocument: { findMany: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
  storePrivateFile: vi.fn(),
  removePrivateFile: vi.fn(),
  refreshApplicationDocumentStatus: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('@/lib/student-auth', () => ({
  withStudentAuth: (handler: (req: Request, auth: unknown) => unknown) => (req: Request) => handler(req, mocks.auth),
}));
vi.mock('@/lib/storage/private-file-store', () => ({
  storePrivateFile: mocks.storePrivateFile,
  removePrivateFile: mocks.removePrivateFile,
}));
vi.mock('@/lib/application-manager/document-readiness', () => ({
  refreshApplicationDocumentStatus: mocks.refreshApplicationDocumentStatus,
}));

import { GET as listDocuments, POST as uploadDocument } from '@/app/api/student/documents/route';

const bytes = Buffer.from('%PDF-1.7\nsynthetic versioning fixture\n%%EOF');
const hash = createHash('sha256').update(bytes).digest('hex');

const uploadRequest = (name = 'passport.pdf', payload: Buffer = bytes, type = 'application/pdf') => {
  const form = new FormData();
  form.set('documentType', 'Passport');
  form.set('file', new File([new Uint8Array(payload)], name, { type }));
  return new Request('https://portal.example.test/api/student/documents', { method: 'POST', body: form });
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.db.studentDocument.findMany.mockResolvedValue([]);
  mocks.db.studentDocument.findFirst.mockResolvedValue(null); // no duplicate, no prior version
  mocks.db.application.findMany.mockResolvedValue([]);
  mocks.db.documentAudit.create.mockResolvedValue({ id: 'audit-1' });
  mocks.db.portalAuditLog.create.mockResolvedValue({ id: 'portal-audit-1' });
  mocks.db.studentEvent.create.mockResolvedValue({ id: 'event-1' });
  mocks.db.timelineEvent.create.mockResolvedValue({ id: 'timeline-1' });
  mocks.db.$transaction.mockImplementation(async (callback: (tx: typeof mocks.db) => unknown) => callback(mocks.db));
  mocks.db.studentDocument.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'doc-created',
    ...data,
    createdAt: new Date('2026-11-02T10:00:00Z'),
  }));
  mocks.storePrivateFile.mockResolvedValue({ storagePath: 'sha256/stored.pdf', fileHash: hash, fileSize: bytes.length });
  mocks.removePrivateFile.mockResolvedValue(undefined);
});

describe('student document upload idempotency and versioning', () => {
  it('deduplicates a retry of the same bytes instead of creating a second row', async () => {
    mocks.db.studentDocument.findFirst.mockResolvedValue({
      id: 'existing-doc', category: 'Passport', fileName: 'passport.pdf',
      fileSize: bytes.length, status: 'pending_review', version: 1,
      createdAt: new Date('2026-11-01T09:00:00Z'),
    });

    const response = await uploadDocument(uploadRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({ id: 'existing-doc', version: 1, deduplicated: true });
    expect(mocks.storePrivateFile).not.toHaveBeenCalled();
    expect(mocks.db.studentDocument.create).not.toHaveBeenCalled();
  });

  it('scopes the duplicate check to the same student, slot and hash, and ignores rejected uploads', async () => {
    await uploadDocument(uploadRequest());
    expect(mocks.db.studentDocument.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        studentId: 'student-1',
        category: 'Passport',
        fileHash: hash,
        isArchived: false,
        status: { not: 'rejected' },
      },
    }));
  });

  it('stores the hash it verified and creates the next version, linking the previous one', async () => {
    // First lookup is the duplicate check (null), second is the prior version.
    mocks.db.studentDocument.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'version-2', version: 2 });

    const response = await uploadDocument(uploadRequest());
    expect(response.status).toBe(201);
    const createCall = mocks.db.studentDocument.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(createCall.data).toMatchObject({
      version: 3,
      previousVersionId: 'version-2',
      status: 'pending_review',
      fileHash: hash,
    });
  });

  it('marks the newest version of each slot as current and keeps every earlier version', async () => {
    mocks.db.studentDocument.findMany.mockResolvedValue([
      { id: 'passport-v3', category: 'Passport', version: 3, status: 'pending_review', createdAt: new Date('2026-11-02T10:00:00Z') },
      { id: 'passport-v2', category: 'Passport', version: 2, status: 'rejected', createdAt: new Date('2026-11-01T10:00:00Z') },
      { id: 'passport-v1', category: 'Passport', version: 1, status: 'rejected', createdAt: new Date('2026-10-31T10:00:00Z') },
      { id: 'cv-v1', category: 'CV', version: 1, status: 'verified', createdAt: new Date('2026-10-30T10:00:00Z') },
    ]);

    const response = await listDocuments(new Request('https://portal.example.test/api/student/documents'), mocks.auth as never);
    const body = await response.json();
    expect(body.data).toHaveLength(4);
    const current = Object.fromEntries(body.data.map((row: { id: string; isCurrentVersion: boolean }) => [row.id, row.isCurrentVersion]));
    expect(current).toEqual({ 'passport-v3': true, 'passport-v2': false, 'passport-v1': false, 'cv-v1': true });
  });

  it('rejects mismatched file content before anything is stored', async () => {
    const response = await uploadDocument(uploadRequest('passport.pdf', Buffer.from('not a pdf'), 'application/pdf'));
    expect(response.status).toBe(400);
    expect(mocks.storePrivateFile).not.toHaveBeenCalled();
    expect(mocks.db.studentDocument.create).not.toHaveBeenCalled();
  });
});

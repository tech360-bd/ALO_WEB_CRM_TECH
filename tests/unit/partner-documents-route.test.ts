import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: { userId: 'partner-user', userType: 'PARTNER', partnerId: 'partner-1', name: 'Partner User' },
  authenticateRequest: vi.fn(),
  db: {
    partnerProfile: { findUnique: vi.fn() },
    portalStudentDocument: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    portalStudentProfile: { findFirst: vi.fn() },
    $transaction: vi.fn(),
    portalAuditLog: { create: vi.fn() },
  },
  tx: {
    portalStudentDocument: { create: vi.fn() },
    portalTimelineEvent: { create: vi.fn() },
    portalAuditLog: { create: vi.fn() },
  },
  storePrivateFile: vi.fn(),
  readPrivateFile: vi.fn(),
  removePrivateFile: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: mocks.authenticateRequest }));
vi.mock('@/lib/storage/private-file-store', () => ({
  storePrivateFile: mocks.storePrivateFile,
  readPrivateFile: mocks.readPrivateFile,
  removePrivateFile: mocks.removePrivateFile,
}));

import { GET as listDocuments, POST as uploadDocument } from '@/app/api/partner/documents/route';
import { GET as downloadDocument } from '@/app/api/partner/documents/[id]/download/route';

const pdfBytes = Buffer.from('%PDF-1.7\nunit test bytes\n%%EOF');
const fileHash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const nextRequest = (url: string, init?: ConstructorParameters<typeof NextRequest>[1]) => new NextRequest(`https://portal.example.test${url}`, init);

beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(mocks.auth, { userId: 'partner-user', userType: 'PARTNER', partnerId: 'partner-1', name: 'Partner User' });
  mocks.authenticateRequest.mockResolvedValue(mocks.auth);
  mocks.db.partnerProfile.findUnique.mockResolvedValue({ partnerId: 'partner-1' });
  mocks.db.portalStudentProfile.findFirst.mockResolvedValue({ id: 'student-profile-1', partnerId: 'partner-1', studentId: 'STU-1', fullName: 'Student One' });
  mocks.db.portalStudentDocument.findMany.mockResolvedValue([]);
  mocks.db.portalStudentDocument.count.mockResolvedValue(0);
  mocks.db.portalStudentDocument.groupBy.mockResolvedValue([]);
  mocks.db.portalStudentDocument.findFirst.mockResolvedValue(null);
  mocks.db.portalAuditLog.create.mockResolvedValue({ id: 'download-audit' });
  mocks.tx.portalStudentDocument.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'document-1', ...data, uploadedAt: new Date().toISOString(), createdAt: new Date(),
    studentProfile: { id: 'student-profile-1', fullName: 'Student One', studentId: 'STU-1' },
  }));
  mocks.tx.portalTimelineEvent.create.mockResolvedValue({ id: 'event-1' });
  mocks.tx.portalAuditLog.create.mockResolvedValue({ id: 'upload-audit' });
  mocks.db.$transaction.mockImplementation(async (callback: (tx: typeof mocks.tx) => Promise<unknown>) => callback(mocks.tx));
  mocks.storePrivateFile.mockResolvedValue({ storagePath: 'private/sha256/document.pdf', fileHash: fileHash(pdfBytes), fileSize: pdfBytes.length });
  mocks.readPrivateFile.mockResolvedValue(pdfBytes);
  mocks.removePrivateFile.mockResolvedValue(undefined);
});

describe('partner document private storage and tenant boundaries', () => {
  it('lists only documents under the authenticated partner tenant', async () => {
    const response = await listDocuments(nextRequest('/api/partner/documents?search=student&page=1&limit=10'));
    expect(response.status).toBe(200);
    expect(mocks.db.portalStudentDocument.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        studentProfile: { partnerId: 'partner-1' },
        OR: expect.arrayContaining([expect.objectContaining({ name: { contains: 'student' } })]),
      }),
      skip: 0,
      take: 10,
    }));
  });

  it('stores real, MIME-checked file bytes and commits metadata, timeline, and audit together', async () => {
    const form = new FormData();
    form.set('studentProfileId', 'student-profile-1');
    form.set('category', 'Passport');
    form.set('file', new File([pdfBytes], 'passport.pdf', { type: 'application/pdf' }));
    const response = await uploadDocument(nextRequest('/api/partner/documents', { method: 'POST', body: form }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ success: true, data: { id: 'document-1', status: 'pending' } });
    expect(mocks.storePrivateFile).toHaveBeenCalledWith(pdfBytes, 'passport.pdf');
    expect(mocks.db.$transaction).toHaveBeenCalledOnce();
    expect(mocks.tx.portalTimelineEvent.create).toHaveBeenCalledOnce();
    expect(mocks.tx.portalAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'PARTNER_DOCUMENT_UPLOADED', entityId: 'document-1' }),
    }));
  });

  it('rejects a cross-tenant student and mismatched file bytes before private storage', async () => {
    mocks.db.portalStudentProfile.findFirst.mockResolvedValue(null);
    const form = new FormData();
    form.set('studentProfileId', 'student-from-another-partner');
    form.set('category', 'Passport');
    form.set('file', new File([pdfBytes], 'passport.pdf', { type: 'application/pdf' }));
    expect((await uploadDocument(nextRequest('/api/partner/documents', { method: 'POST', body: form }))).status).toBe(404);
    expect(mocks.storePrivateFile).not.toHaveBeenCalled();

    const invalidForm = new FormData();
    invalidForm.set('studentProfileId', 'student-profile-1');
    invalidForm.set('category', 'Passport');
    invalidForm.set('file', new File(['not a PDF'], 'passport.pdf', { type: 'application/pdf' }));
    expect((await uploadDocument(nextRequest('/api/partner/documents', { method: 'POST', body: invalidForm }))).status).toBe(400);
    expect(mocks.storePrivateFile).not.toHaveBeenCalled();
  });

  it('downloads private bytes only for the partner that owns the student document', async () => {
    mocks.db.portalStudentDocument.findFirst.mockResolvedValue({
      id: 'document-1', fileName: 'passport.pdf', storagePath: 'private/sha256/document.pdf',
      mimeType: 'application/pdf', fileHash: fileHash(pdfBytes),
    });
    const response = await downloadDocument(nextRequest('/api/partner/documents/document-1/download'), { params: Promise.resolve({ id: 'document-1' }) });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toContain("filename*=UTF-8''passport.pdf");
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(Buffer.from(await response.arrayBuffer()).equals(pdfBytes)).toBe(true);
    expect(mocks.db.portalStudentDocument.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'document-1', studentProfile: { partnerId: 'partner-1' } } }));
    expect(mocks.db.portalAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PARTNER_DOCUMENT_DOWNLOADED' }) }));
  });

  it('does not read storage or return content for another partner or a failed integrity check', async () => {
    mocks.db.partnerProfile.findUnique.mockResolvedValue({ partnerId: 'partner-2' });
    mocks.db.portalStudentDocument.findFirst.mockResolvedValue(null);
    const notFound = await downloadDocument(nextRequest('/api/partner/documents/document-1/download'), { params: Promise.resolve({ id: 'document-1' }) });
    expect(notFound.status).toBe(404);
    expect(mocks.readPrivateFile).not.toHaveBeenCalled();

    mocks.db.partnerProfile.findUnique.mockResolvedValue({ partnerId: 'partner-1' });
    mocks.db.portalStudentDocument.findFirst.mockResolvedValue({
      id: 'document-1', fileName: 'passport.pdf', storagePath: 'private/sha256/document.pdf',
      mimeType: 'application/pdf', fileHash: '0'.repeat(64),
    });
    const integrityFailure = await downloadDocument(nextRequest('/api/partner/documents/document-1/download'), { params: Promise.resolve({ id: 'document-1' }) });
    expect(integrityFailure.status).toBe(500);
    expect(mocks.db.portalAuditLog.create).not.toHaveBeenCalled();
  });

  it('keeps unauthenticated list and download requests from querying or reading files', async () => {
    mocks.authenticateRequest.mockResolvedValueOnce(NextResponse.json({ success: false }, { status: 401 }));
    expect((await listDocuments(nextRequest('/api/partner/documents'))).status).toBe(401);
    mocks.authenticateRequest.mockResolvedValueOnce(NextResponse.json({ success: false }, { status: 401 }));
    expect((await downloadDocument(nextRequest('/api/partner/documents/document-1/download'), { params: Promise.resolve({ id: 'document-1' }) })).status).toBe(401);
    expect(mocks.db.portalStudentDocument.findMany).not.toHaveBeenCalled();
    expect(mocks.readPrivateFile).not.toHaveBeenCalled();
  });
});

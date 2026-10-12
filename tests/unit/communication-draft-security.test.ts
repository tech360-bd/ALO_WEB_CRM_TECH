import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  conversationFindUnique: vi.fn(),
  applicationFindFirst: vi.fn(),
  applicationFindUnique: vi.fn(),
  studentFindUnique: vi.fn(),
  leadFindUnique: vi.fn(),
  draftCreate: vi.fn(),
  draftFindUnique: vi.fn(),
  draftUpdate: vi.fn(),
  providerStatusFindUnique: vi.fn(),
  communicationLogCreate: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: mocks.authenticateRequest }));
vi.mock('@/lib/db', () => ({
  db: {
    uccConversation: { findUnique: mocks.conversationFindUnique },
    communicationThread: { findUnique: vi.fn() },
    application: { findFirst: mocks.applicationFindFirst, findUnique: mocks.applicationFindUnique, findMany: vi.fn() },
    student: { findUnique: mocks.studentFindUnique },
    lead: { findUnique: mocks.leadFindUnique },
    communicationDraft: { create: mocks.draftCreate, findUnique: mocks.draftFindUnique, update: mocks.draftUpdate, findMany: vi.fn() },
    whatsAppMessageStatus: { findUnique: mocks.providerStatusFindUnique },
    communicationLog: { create: mocks.communicationLogCreate },
  },
}));

import { POST as createDraft } from '@/app/api/communications/drafts/route';
import { PATCH as updateDraft } from '@/app/api/communications/drafts/[id]/route';

// Canonical administrator test only. Counselor workflows are deliberately blocked pending domain-aware UCC ownership.
const staff = { identityDomain:'user', userId: 'staff-1', userType: 'ADMIN', roles: ['ADMIN'], permissions: [], name: 'Counselor', email: 'staff@example.test' };
const existingDraft = { id: 'draft-1', createdBy: 'staff-1', studentId: null, leadId: null, applicationId: null, channel: 'WHATSAPP', status: 'DRAFT', mode: 'AI_DRAFT_HUMAN_SEND', riskLevel: 'LOW', riskFlags: '[]', draftBody: 'Hello', approvedBy: null, createdAt: new Date('2026-01-01T00:00:00Z') };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticateRequest.mockResolvedValue(staff);
  mocks.applicationFindFirst.mockResolvedValue(null);
  mocks.draftCreate.mockResolvedValue({ ...existingDraft, id: 'created-draft', createdBy: staff.userId });
  mocks.draftFindUnique.mockResolvedValue(existingDraft);
  mocks.providerStatusFindUnique.mockResolvedValue(null);
  mocks.draftUpdate.mockResolvedValue({ ...existingDraft, status: 'SENT' });
  mocks.communicationLogCreate.mockResolvedValue({ id: 'audit-1' });
});

describe('communication draft access and send-state integrity', () => {
  it('blocks anonymous draft creation before database writes', async () => {
    mocks.authenticateRequest.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    const request = new NextRequest('https://alo.test/api/communications/drafts', { method: 'POST', body: JSON.stringify({ channel: 'WHATSAPP', draftBody: 'Hello', mode: 'AI_DRAFT_HUMAN_SEND' }) });
    const response = await createDraft(request);
    expect(response.status).toBe(401);
    expect(mocks.draftCreate).not.toHaveBeenCalled();
  });

  it('uses the authenticated actor and assigned conversation when saving an AI draft', async () => {
    mocks.conversationFindUnique.mockResolvedValue({ id: 'conversation-1', studentId: 'student-1', assignedToUserId: staff.userId });
    mocks.applicationFindFirst.mockResolvedValue(null);
    const request = new NextRequest('https://alo.test/api/communications/drafts', {
      method: 'POST',
      body: JSON.stringify({ channel: 'WHATSAPP', conversationId: 'conversation-1', studentId: 'student-1', draftBody: 'Hello', mode: 'AI_DRAFT_HUMAN_SEND', createdBy: 'forged-user' }),
    });
    const response = await createDraft(request);
    expect(response.status).toBe(201);
    expect(mocks.draftCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ createdBy: staff.userId, studentId: 'student-1', status: 'DRAFT' }) }));
  });

  it('does not let a caller mark a draft SENT without provider acknowledgement evidence', async () => {
    const request = new NextRequest('https://alo.test/api/communications/drafts/draft-1', { method: 'PATCH', body: JSON.stringify({ status: 'SENT', sentById: 'forged-user' }) });
    const response = await updateDraft(request, { params: Promise.resolve({ id: 'draft-1' }) });
    expect(response.status).toBe(400);
    expect(mocks.draftUpdate).not.toHaveBeenCalled();
    expect(mocks.providerStatusFindUnique).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  aiChat: vi.fn(),
  uccConversationFindUnique: vi.fn(),
  applicationFindFirst: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: mocks.authenticateRequest }));
vi.mock('@/lib/ai', () => ({ aiChat: mocks.aiChat }));
vi.mock('@/lib/db', () => ({ db: {
  uccConversation: { findUnique: mocks.uccConversationFindUnique },
  communicationThread: { findUnique: vi.fn() },
  application: { findFirst: mocks.applicationFindFirst },
} }));

import { POST } from '@/app/api/whatsapp/ai-reply/route';

// Canonical administrator test only. Counselor workflows are deliberately blocked pending domain-aware UCC ownership.
const staff = { identityDomain:'user', userId: 'staff-1', userType: 'ADMIN', roles: ['ADMIN'], permissions: [], name: 'Counselor', email: 'staff@example.test' };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticateRequest.mockResolvedValue(staff);
  mocks.aiChat.mockResolvedValue('Thanks for reaching out. I will help you find the correct next step.');
  mocks.uccConversationFindUnique.mockResolvedValue({ id: 'conv-1', channel: 'whatsapp', studentId: 'student-1', assignedToUserId: staff.userId });
  mocks.applicationFindFirst.mockResolvedValue(null);
});

describe('WhatsApp AI reply endpoint security', () => {
  it('requires staff authentication before reading a conversation', async () => {
    mocks.authenticateRequest.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    const response = await POST(new NextRequest('https://alo.test/api/whatsapp/ai-reply', { method: 'POST', body: JSON.stringify({ conversationId: 'conv-1', conversationSource: 'ucc_conversation', message: 'Hello' }) }));
    expect(response.status).toBe(401);
    expect(mocks.uccConversationFindUnique).not.toHaveBeenCalled();
    expect(mocks.aiChat).not.toHaveBeenCalled();
  });

  it('rejects caller-supplied student context that does not match the assigned conversation', async () => {
    const response = await POST(new NextRequest('https://alo.test/api/whatsapp/ai-reply', { method: 'POST', body: JSON.stringify({ conversationId: 'conv-1', conversationSource: 'ucc_conversation', studentId: 'another-student', message: 'Hello' }) }));
    expect(response.status).toBe(403);
    expect(mocks.aiChat).not.toHaveBeenCalled();
  });

  it('does not generate or expose OTPs and avoids AI on private-data requests', async () => {
    const response = await POST(new NextRequest('https://alo.test/api/whatsapp/ai-reply', { method: 'POST', body: JSON.stringify({ conversationId: 'conv-1', conversationSource: 'ucc_conversation', studentId: 'student-1', message: 'What is my passport document status?' }) }));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ success: true, requiresOtp: true, verificationAvailable: false });
    expect(payload.otp).toBeUndefined();
    expect(mocks.aiChat).not.toHaveBeenCalled();
  });
});

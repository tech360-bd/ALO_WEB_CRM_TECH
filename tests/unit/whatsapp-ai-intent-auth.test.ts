import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  threadFindUnique: vi.fn(),
  applicationFindFirst: vi.fn(),
  intentFindMany: vi.fn(),
  sentimentFindMany: vi.fn(),
  leadScoreFindMany: vi.fn(),
  audit: vi.fn(),
  logAiOperation: vi.fn(),
  generateAiReply: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: unknown) => unknown) => handler,
  logAuditAction: (...args: unknown[]) => mocks.audit(...args),
}));
vi.mock('@/lib/db', () => ({
  db: {
    communicationThread: { findUnique: (...args: unknown[]) => mocks.threadFindUnique(...args) },
    application: { findFirst: (...args: unknown[]) => mocks.applicationFindFirst(...args) },
    aiIntentLog: { findMany: (...args: unknown[]) => mocks.intentFindMany(...args) },
    aiSentimentLog: { findMany: (...args: unknown[]) => mocks.sentimentFindMany(...args) },
    aiLeadScore: { findMany: (...args: unknown[]) => mocks.leadScoreFindMany(...args) },
  },
}));
vi.mock('@/lib/ai-whatsapp-engine', () => ({
  detectLanguage: () => ({ language: 'english', confidence: 1 }),
  detectIntent: () => ({ intent: 'general_information', confidence: 1 }),
  detectSentiment: () => ({ sentiment: 'neutral', confidence: 1, isHighRisk: false, isUrgent: false }),
  generateAiReply: (...args: unknown[]) => mocks.generateAiReply(...args),
  logAiOperation: (...args: unknown[]) => mocks.logAiOperation(...args),
}));
vi.mock('@/lib/ucc/conversation-visibility', () => ({ canViewUccConversationB2B: async () => true }));

import { GET, POST } from '@/app/api/whatsapp/ai-intent/route';

const admin = {
  identityDomain: 'user' as const,
  userId: 'admin-1', actorUserId: 'admin-1', email: 'admin@example.test', actorEmail: 'admin@example.test', name: 'Admin', actorName: 'Admin',
  userType: 'ADMIN', roles: ['ADMIN'], permissions: [], sessionId: 'session-1',
};
const counselor = { ...admin, identityDomain: 'user' as const, userId: 'counselor-1', userType: 'COUNSELOR', roles: ['COUNSELOR'] };

function request(url: string, body?: unknown) {
  return new Request(url, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.threadFindUnique.mockResolvedValue({ id: 'thread-1', channel: 'whatsapp', studentId: 'student-db-1' });
  mocks.applicationFindFirst.mockResolvedValue(null);
  mocks.intentFindMany.mockResolvedValue([]);
  mocks.sentimentFindMany.mockResolvedValue([]);
  mocks.leadScoreFindMany.mockResolvedValue([]);
  mocks.audit.mockResolvedValue(undefined);
  mocks.logAiOperation.mockResolvedValue(undefined);
  mocks.generateAiReply.mockResolvedValue({ reply: 'A safe draft.', shouldHandover: false, confidence: 0.5 });
});

describe('/api/whatsapp/ai-intent server-side scope', () => {
  it('denies a non-admin actor before accepting draft-generation requests', async () => {
    const response = await (POST as any)(request('https://alo.test/api/whatsapp/ai-intent', { message: 'Hello' }), counselor);
    expect(response.status).toBe(403);
    expect(mocks.threadFindUnique).not.toHaveBeenCalled();
    expect(mocks.generateAiReply).not.toHaveBeenCalled();
  });

  it('rejects a client student ID that does not match the server-resolved WhatsApp thread', async () => {
    const response = await (POST as any)(request('https://alo.test/api/whatsapp/ai-intent', { message: 'Hello', threadId: 'thread-1', studentId: 'forged-student' }), admin);
    expect(response.status).toBe(403);
    expect(mocks.generateAiReply).not.toHaveBeenCalled();
    expect(mocks.logAiOperation).not.toHaveBeenCalled();
  });

  it('derives student scope from the authorized thread and marks output as review-only', async () => {
    const response = await (POST as any)(request('https://alo.test/api/whatsapp/ai-intent', { message: 'Hello', threadId: 'thread-1' }), admin);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.aiReply).toMatchObject({ reply: 'A safe draft.', requiresHumanApproval: true, automaticallySent: false });
    expect(mocks.logAiOperation).toHaveBeenCalledWith(expect.objectContaining({ threadId: 'thread-1', studentId: 'student-db-1' }));
    expect(mocks.audit).toHaveBeenCalledWith(admin, 'WHATSAPP_AI_DRAFT_CREATED', 'CommunicationThread', 'thread-1', expect.any(Object));
  });

  it('does not allow arbitrary student IDs to filter private AI logs', async () => {
    const response = await (GET as any)(request('https://alo.test/api/whatsapp/ai-intent?studentId=other-student'), admin);
    expect(response.status).toBe(400);
    expect(mocks.intentFindMany).not.toHaveBeenCalled();
  });
});

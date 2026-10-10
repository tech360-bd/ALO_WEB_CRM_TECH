import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: {
    userId: 'partner-user', actorUserId: 'partner-user', actorEmail: 'partner@example.com', actorName: 'Partner User',
    email: 'partner@example.com', name: 'Partner User', userType: 'PARTNER', partnerId: 'partner-1',
    partnerRole: 'PARTNER_SUPER_ADMIN', roles: [], permissions: [], sessionId: 'partner-session',
  },
  authenticateRequest: vi.fn(),
  db: {
    partnerMarketingQuota: { findUnique: vi.fn() },
    partnerMarketingUsage: { findUnique: vi.fn(), upsert: vi.fn() },
    partnerMarketingRequest: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    integrationAuditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  tx: {
    partnerMarketingRequest: { create: vi.fn() },
    partnerMarketingUsage: { upsert: vi.fn() },
  },
  generateStructured: vi.fn(),
  generateImage: vi.fn(),
  generateVideo: vi.fn(),
  reserveQuota: vi.fn(),
  releaseQuota: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: mocks.authenticateRequest }));
vi.mock('@/lib/ai-gateway', () => ({ generateStructured: mocks.generateStructured }));
vi.mock('@/lib/ai', () => ({ generateImage: mocks.generateImage, generateVideo: mocks.generateVideo }));
vi.mock('@/lib/access-check-engine', () => ({ reserveQuota: mocks.reserveQuota, releaseQuota: mocks.releaseQuota }));

import { GET, PATCH, POST } from '@/app/api/partner-admin/marketing/route';

const timestamp = new Date('2026-10-10T00:00:00.000Z');
function marketingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'campaign-1', partnerId: 'partner-1', requestedBy: 'partner@example.com', idea: 'Promote our verified intake information session.',
    countryId: 'Bangladesh', universityId: 'Northbridge University', courseId: 'MSc Computing', intake: 'September 2027',
    targetAudience: 'Prospective students', language: 'English', ctaText: 'Book a consultation', preferredStyle: 'Professional',
    caption: 'Learn about the September 2027 intake. Book a consultation.', hashtags: '#StudyAbroad',
    imagePrompt: 'A professional campus information poster with a student.', videoPrompt: 'A short campus information video for prospective students.',
    videoScript: 'A short information session invitation for prospective students.', generatedContent: '{}',
    generatedImageUrl: '', generatedVideoUrl: '', platform: 'FACEBOOK', status: 'ai_draft_generated', approvalStatus: 'draft',
    requiresAloApproval: true, publishedUrl: '', rejectionReason: '', scheduledAt: null, createdAt: timestamp, updatedAt: timestamp,
    ...overrides,
  };
}

function request(method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown, origin = 'https://portal.example.test') {
  return new NextRequest(`https://portal.example.test${path}`, {
    method,
    headers: { origin, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function safeDraft() {
  return {
    idea: 'Promote our September 2027 intake information session.',
    country: 'Bangladesh', university: 'Northbridge University', course: 'MSc Computing',
    intake: 'September 2027', targetAudience: 'Prospective students', language: 'English',
    cta: 'Book a consultation', platform: 'FACEBOOK', preferredStyle: 'Professional',
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(mocks.auth, {
    userId: 'partner-user', actorUserId: 'partner-user', actorEmail: 'partner@example.com', actorName: 'Partner User',
    email: 'partner@example.com', name: 'Partner User', userType: 'PARTNER', partnerId: 'partner-1',
    partnerRole: 'PARTNER_SUPER_ADMIN', roles: [], permissions: [], sessionId: 'partner-session',
  });
  mocks.authenticateRequest.mockResolvedValue(mocks.auth);
  mocks.db.partnerMarketingQuota.findUnique.mockResolvedValue(null);
  mocks.db.partnerMarketingUsage.findUnique.mockResolvedValue(null);
  mocks.db.partnerMarketingUsage.upsert.mockResolvedValue({ imagesUsed: 0, videosUsed: 0, ideasSubmitted: 0 });
  mocks.db.partnerMarketingRequest.findMany.mockResolvedValue([]);
  mocks.db.partnerMarketingRequest.findUnique.mockResolvedValue(null);
  mocks.db.partnerMarketingRequest.create.mockResolvedValue(marketingRow());
  mocks.db.partnerMarketingRequest.update.mockResolvedValue(marketingRow());
  mocks.db.partnerMarketingRequest.updateMany.mockResolvedValue({ count: 1 });
  mocks.db.integrationAuditLog.create.mockResolvedValue({ id: 'audit-1' });
  mocks.tx.partnerMarketingRequest.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => marketingRow(data));
  mocks.tx.partnerMarketingUsage.upsert.mockResolvedValue({ imagesUsed: 0, videosUsed: 0, ideasSubmitted: 1 });
  mocks.db.$transaction.mockImplementation(async (callback: (tx: typeof mocks.tx) => Promise<unknown>) => callback(mocks.tx));
  mocks.generateStructured.mockRejectedValue(new Error('provider credential detail must not escape'));
  mocks.generateImage.mockResolvedValue({ url: 'https://assets.example.test/campaign.png' });
  mocks.generateVideo.mockResolvedValue({ url: 'https://assets.example.test/campaign.mp4' });
  mocks.reserveQuota.mockResolvedValue({ allowed: true, used: 1, limit: 15, remaining: 14, message: 'Quota reserved.' });
  mocks.releaseQuota.mockResolvedValue(undefined);
});

describe('partner marketing API capability and workflow boundaries', () => {
  it('returns explicit disabled social, scheduling, and publishing capabilities', async () => {
    const response = await GET(request('GET', '/api/partner-admin/marketing?partnerId=other-partner'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      capabilities: { socialConnections: false, scheduling: false, publishing: false },
      socialAccounts: [],
    });
    expect(mocks.db.partnerMarketingQuota.findUnique).toHaveBeenCalledWith({ where: { partnerId: 'partner-1' } });
    expect(mocks.db.partnerMarketingRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { partnerId: 'partner-1' } }));
  });

  it('provides the ALO-only review queue without trusting a client tenant id', async () => {
    Object.assign(mocks.auth, { userId: 'alo-admin', actorUserId: 'alo-admin', userType: 'SUPER_ADMIN', partnerId: null, partnerRole: null, roles: ['SUPER_ADMIN'] });
    const pending = marketingRow({ partnerId: 'partner-2', approvalStatus: 'pending', status: 'pending_approval' });
    mocks.db.partnerMarketingRequest.findMany.mockResolvedValue([pending]);
    const response = await GET(request('GET', '/api/partner-admin/marketing'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ scope: 'alo_review', requests: [{ partnerId: 'partner-2', approvalStatus: 'PENDING_APPROVAL' }] });
    expect(mocks.db.partnerMarketingRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { approvalStatus: { in: ['pending', 'pending_approval'] }, requiresAloApproval: true },
    }));
    expect(mocks.db.partnerMarketingQuota.findUnique).not.toHaveBeenCalled();
  });

  it('rejects unsupported claims in user input before provider, persistence, or quota mutation', async () => {
    const response = await POST(request('POST', '/api/partner-admin/marketing', { ...safeDraft(), cta: 'Guaranteed free admission with a £5,000 scholarship' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, fields: expect.arrayContaining(['cta']) });
    expect(mocks.generateStructured).not.toHaveBeenCalled();
    expect(mocks.db.partnerMarketingRequest.create).not.toHaveBeenCalled();
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });

  it('uses a grounded fallback and atomically persists the draft with the idea counter', async () => {
    mocks.db.partnerMarketingQuota.findUnique.mockResolvedValue({ requiresAloApproval: true });
    mocks.tx.partnerMarketingUsage.upsert.mockResolvedValue({ imagesUsed: 0, videosUsed: 0, ideasSubmitted: 1 });
    const response = await POST(request('POST', '/api/partner-admin/marketing', safeDraft()));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      success: true,
      generationMode: 'template',
      notice: expect.stringContaining('grounded template'),
      request: { approvalStatus: 'DRAFT', intake: 'September 2027' },
    });
    expect(mocks.tx.partnerMarketingRequest.create).toHaveBeenCalledWith({ data: expect.objectContaining({ requiresAloApproval: true, approvalStatus: 'draft' }) });
    expect(mocks.tx.partnerMarketingUsage.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { partnerId_monthYear: { partnerId: 'partner-1', monthYear: expect.any(String) } },
      update: { ideasSubmitted: { increment: 1 } },
    }));
    expect(mocks.db.$transaction).toHaveBeenCalledOnce();
    expect(JSON.stringify(payload)).not.toContain('provider credential detail');
  });

  it('does not mistake an intake year for a scholarship amount', async () => {
    const response = await POST(request('POST', '/api/partner-admin/marketing', {
      ...safeDraft(), idea: 'Promote the September 2027 scholarship information session for prospective students.',
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, generationMode: 'template' });
  });

  it('rejects unsafe model claims in image/video prompts and returns only a grounded replacement', async () => {
    mocks.generateStructured.mockResolvedValue({ data: {
      facebookCaption: 'Join this student information session to learn about real requirements.',
      instagramCaption: 'Explore the intake timeline and ask a counselor about your options.',
      reelCaption: 'Ask a counselor about your next step.',
      hashtags: '#StudyAbroad #ALOEducation',
      imagePrompt: 'Guaranteed £5,000 scholarship poster with instant admission.',
      videoPrompt: 'A campus tour with a student talking about application documents.',
      videoScript: 'A counselor explains how to prepare application documents and where to ask questions.',
      ctaText: 'Book a consultation',
    } });
    const response = await POST(request('POST', '/api/partner-admin/marketing', safeDraft()));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.generationMode).toBe('template');
    expect(payload.request.imagePrompt).not.toContain('Guaranteed');
    expect(payload.request.imagePrompt).not.toContain('£5,000');
  });

  it('rejects image generation after submission before reserving quota', async () => {
    mocks.db.partnerMarketingRequest.findUnique.mockResolvedValue(marketingRow({ approvalStatus: 'pending', status: 'pending_approval' }));
    const response = await PATCH(request('PATCH', '/api/partner-admin/marketing', { id: 'campaign-1', action: 'generate_image' }));
    expect(response.status).toBe(409);
    expect(mocks.reserveQuota).not.toHaveBeenCalled();
    expect(mocks.generateImage).not.toHaveBeenCalled();
  });

  it('lets ALO staff approve a persisted queue item without a forged partner id', async () => {
    Object.assign(mocks.auth, { userId: 'alo-admin', actorUserId: 'alo-admin', actorEmail: 'admin@example.com', userType: 'SUPER_ADMIN', partnerId: null, partnerRole: null, roles: ['SUPER_ADMIN'] });
    const pending = marketingRow({ partnerId: 'partner-2', approvalStatus: 'pending', status: 'pending_approval', generatedImageUrl: 'https://assets.example.test/campaign.png' });
    const approved = { ...pending, approvalStatus: 'approved', status: 'approved' };
    mocks.db.partnerMarketingRequest.findUnique.mockResolvedValueOnce(pending).mockResolvedValueOnce(approved);
    const response = await PATCH(request('PATCH', '/api/partner-admin/marketing', { id: 'campaign-1', action: 'approve', partnerId: 'forged-partner' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, request: { approvalStatus: 'APPROVED', partnerId: 'partner-2' } });
    expect(mocks.db.partnerMarketingRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'campaign-1', partnerId: 'partner-2', approvalStatus: 'pending', status: 'pending_approval', updatedAt: timestamp },
      data: expect.objectContaining({ approvalStatus: 'approved', approvedById: 'alo-admin' }),
    });
  });

  it('rejects a stale concurrent review transition', async () => {
    Object.assign(mocks.auth, { userId: 'alo-admin', actorUserId: 'alo-admin', userType: 'SUPER_ADMIN', partnerId: null, partnerRole: null, roles: ['SUPER_ADMIN'] });
    const pending = marketingRow({ approvalStatus: 'pending', status: 'pending_approval', generatedImageUrl: 'https://assets.example.test/campaign.png' });
    mocks.db.partnerMarketingRequest.findUnique.mockResolvedValueOnce(pending);
    mocks.db.partnerMarketingRequest.updateMany.mockResolvedValue({ count: 0 });
    const response = await PATCH(request('PATCH', '/api/partner-admin/marketing', { id: 'campaign-1', action: 'approve' }));
    expect(response.status).toBe(409);
    expect(mocks.db.integrationAuditLog.create).not.toHaveBeenCalled();
  });

  it('blocks scheduling and publishing rather than returning fabricated success', async () => {
    const approved = marketingRow({ approvalStatus: 'approved', status: 'approved', generatedImageUrl: 'https://assets.example.test/campaign.png' });
    mocks.db.partnerMarketingRequest.findUnique.mockResolvedValue(approved);
    for (const action of ['schedule', 'publish'] as const) {
      const response = await PATCH(request('PATCH', '/api/partner-admin/marketing', { id: 'campaign-1', action }));
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ success: false });
    }
    expect(mocks.db.partnerMarketingRequest.update).not.toHaveBeenCalled();
    expect(mocks.db.partnerMarketingRequest.updateMany).not.toHaveBeenCalled();
  });

  it('refuses a cross-origin mutation before reading or changing a campaign', async () => {
    const response = await PATCH(request('PATCH', '/api/partner-admin/marketing', { id: 'campaign-1', action: 'archive' }, 'https://attacker.example'));
    expect(response.status).toBe(403);
    expect(mocks.db.partnerMarketingRequest.findUnique).not.toHaveBeenCalled();
    expect(mocks.db.partnerMarketingRequest.updateMany).not.toHaveBeenCalled();
  });
});

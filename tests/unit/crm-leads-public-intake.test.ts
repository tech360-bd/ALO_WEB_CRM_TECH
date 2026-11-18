/**
 * /api/crm/leads/public — public Course Finder / destination-page lead intake.
 *
 * These tests pin the parts of the contract the spec depends on:
 *   P3  — the inquiry carries an accurate source and reaches the CRM pipeline
 *   P4  — no auto-welcome/marketing blast; consent stays false unless opted in
 *   P6  — marketing consent is recorded ONLY on explicit opt-in, never pre-set
 *   P8  — same-origin + rate-limit gates run before any database access
 *
 * The identity-resolution internals are exercised through the exported route
 * with the database mocked; the phone/email normalizers under test are the
 * real implementations.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => {
  const tx = {
    whatsAppContact: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    timelineEvent: { create: vi.fn().mockResolvedValue({ id: 'tl-1' }) },
  };
  return {
    tx,
    transaction: vi.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
    whatsAppContactUpsert: vi.fn(),
    whatsAppContactUpdate: vi.fn().mockResolvedValue({}),
    studentFindMany: vi.fn().mockResolvedValue([]),
    studentFindFirst: vi.fn().mockResolvedValue(null),
    leadFindMany: vi.fn().mockResolvedValue([]),
    leadFindFirst: vi.fn().mockResolvedValue(null),
    leadFindUnique: vi.fn().mockResolvedValue(null),
    userFindMany: vi.fn().mockResolvedValue([]),
    b2bContactFindMany: vi.fn().mockResolvedValue([]),
    contactMatchReviewFindFirst: vi.fn().mockResolvedValue(null),
    contactMatchReviewCreate: vi.fn().mockResolvedValue({ id: 'review-1' }),
    leadFormCreate: vi.fn().mockResolvedValue({ id: 'lf-1' }),
    leadFormUpdate: vi.fn().mockResolvedValue({}),
    marketingLeadCreate: vi.fn().mockResolvedValue({ id: 'ml-1' }),
    marketingLeadUpdate: vi.fn().mockResolvedValue({}),
    crmAuditLogCreate: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    createLeadWithReference: vi.fn().mockResolvedValue({ id: 'lead-new-1', source: 'PUBLIC_COURSE_FINDER' }),
    scoreLead: vi.fn().mockResolvedValue({ score: 55, tier: 'WARM' }),
    autoAssignCounselor: vi.fn().mockResolvedValue({ counselorId: 'counsellor-1', reason: 'least_leads_branch' }),
    createFollowUpTask: vi.fn().mockResolvedValue({ id: 'fu-1' }),
    grantConsent: vi.fn().mockResolvedValue({ recordId: 'consent-1' }),
    rateLimitAllowed: true,
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: (cb: (t: typeof m.tx) => unknown) => m.transaction(cb),
    whatsAppContact: {
      upsert: (...args: unknown[]) => m.whatsAppContactUpsert(...args),
      update: (...args: unknown[]) => m.whatsAppContactUpdate(...args),
    },
    student: {
      findMany: (...args: unknown[]) => m.studentFindMany(...args),
      findFirst: (...args: unknown[]) => m.studentFindFirst(...args),
    },
    lead: {
      findMany: (...args: unknown[]) => m.leadFindMany(...args),
      findFirst: (...args: unknown[]) => m.leadFindFirst(...args),
      findUnique: (...args: unknown[]) => m.leadFindUnique(...args),
    },
    user: { findMany: (...args: unknown[]) => m.userFindMany(...args) },
    b2BContact: { findMany: (...args: unknown[]) => m.b2bContactFindMany(...args) },
    contactMatchReview: {
      findFirst: (...args: unknown[]) => m.contactMatchReviewFindFirst(...args),
      create: (...args: unknown[]) => m.contactMatchReviewCreate(...args),
    },
    leadForm: {
      create: (...args: unknown[]) => m.leadFormCreate(...args),
      update: (...args: unknown[]) => m.leadFormUpdate(...args),
    },
    marketingLead: {
      create: (...args: unknown[]) => m.marketingLeadCreate(...args),
      update: (...args: unknown[]) => m.marketingLeadUpdate(...args),
    },
    crmAuditLog: { create: (...args: unknown[]) => m.crmAuditLogCreate(...args) },
  },
}));

vi.mock('@/lib/lead-reference', () => ({
  createLeadWithReference: (...args: unknown[]) => m.createLeadWithReference(...args),
}));

vi.mock('@/lib/attribution/lead-attribution', () => ({
  captureAttributionFromRequest: () => ({ visitorId: 'visitor-test-0001', firstTouch: null, lastTouch: null }),
  describeAttribution: () => ({ visitorId: 'visitor-test-0001' }),
  newLeadAttribution: () => ({}),
  toLeadFormColumns: () => ({}),
}));

vi.mock('@/lib/crm-automation', () => ({
  scoreLead: (...args: unknown[]) => m.scoreLead(...args),
  autoAssignCounselor: (...args: unknown[]) => m.autoAssignCounselor(...args),
  createFollowUpTask: (...args: unknown[]) => m.createFollowUpTask(...args),
}));

vi.mock('@/lib/marketing-consent', () => ({
  grantConsent: (...args: unknown[]) => m.grantConsent(...args),
}));

vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: () => (m.rateLimitAllowed
    ? { allowed: true, resetAt: Date.now() + 60_000 }
    : { allowed: false, resetAt: Date.now() + 60_000 }),
}));

const { POST } = await import('@/app/api/crm/leads/public/route');

function req(body: unknown, origin: string | null = 'https://alo.test') {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (origin !== null) headers.set('origin', origin);
  return new NextRequest('https://alo.test/api/crm/leads/public', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

const validBody = {
  fullName: 'Synthetic Student',
  phone: '01712345678',
  email: 'synthetic@example.test',
  preferredCountry: 'United Kingdom',
  preferredSubject: 'Computer Science',
  preferredLevel: 'Masters',
  intake: 'September 2027',
  budget: 'GBP 20000',
  source: 'PUBLIC_COURSE_FINDER',
  sourceSection: 'Course Finder - University of Manchester',
};

beforeEach(() => {
  vi.clearAllMocks();
  m.rateLimitAllowed = true;
  m.transaction.mockImplementation(async (cb: (t: typeof m.tx) => unknown) => cb(m.tx));
  m.tx.whatsAppContact.findUnique.mockResolvedValue({ id: 'wa-1', studentId: '', leadId: '', partnerId: '' });
  m.tx.whatsAppContact.updateMany.mockResolvedValue({ count: 1 });
  m.whatsAppContactUpsert.mockResolvedValue({ id: 'wa-1', normalizedPhone: '8801712345678', studentId: null, leadId: null, partnerId: null, normalizedEmail: 'synthetic@example.test' });
  m.createLeadWithReference.mockResolvedValue({ id: 'lead-new-1', source: 'PUBLIC_COURSE_FINDER' });
  m.leadFindUnique.mockResolvedValue({ counselorId: '' });
});

describe('POST /api/crm/leads/public — gates', () => {
  it('rejects cross-site submissions before touching the database', async () => {
    const res = await POST(req(validBody, 'https://evil.example'));
    expect(res.status).toBe(403);
    expect(m.whatsAppContactUpsert).not.toHaveBeenCalled();
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it('returns 429 when the lead_create bucket is exhausted', async () => {
    m.rateLimitAllowed = false;
    const res = await POST(req(validBody));
    expect(res.status).toBe(429);
    expect(m.whatsAppContactUpsert).not.toHaveBeenCalled();
  });

  it('rejects submissions missing a usable name or phone', async () => {
    const res = await POST(req({ ...validBody, phone: 'abc' }));
    expect(res.status).toBe(400);
    const res2 = await POST(req({ ...validBody, fullName: '', name: '' }));
    expect(res2.status).toBe(400);
    expect(m.whatsAppContactUpsert).not.toHaveBeenCalled();
  });

  it('rejects an invalid email address', async () => {
    const res = await POST(req({ ...validBody, email: 'not-an-email' }));
    expect(res.status).toBe(400);
    expect(m.whatsAppContactUpsert).not.toHaveBeenCalled();
  });
});

describe('POST /api/crm/leads/public — CRM pipeline', () => {
  it('creates a NEW lead carrying the Course Finder source and intake context', async () => {
    const res = await POST(req(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(m.createLeadWithReference).toHaveBeenCalledTimes(1);
    const created = m.createLeadWithReference.mock.calls[0][1];
    expect(created.source).toBe('PUBLIC_COURSE_FINDER');
    expect(created.preferredIntake).toBe('September 2027');
    expect(created.preferredCountry).toBe('United Kingdom');
    expect(created.status).toBe('NEW');
    expect(created.welcomeSent).toBe(false);
    expect(json.crmLeadId).toBe('lead-new-1');
  });

  it('records a marketing lead with consent=false when the visitor never opted in', async () => {
    const res = await POST(req(validBody)); // no marketingConsent field at all
    expect(res.status).toBe(201);
    const created = m.marketingLeadCreate.mock.calls[0][0].data;
    expect(created.consent).toBe(false);
    expect(created.source).toBe('PUBLIC_COURSE_FINDER');
    expect(m.grantConsent).not.toHaveBeenCalled();
    expect(m.marketingLeadUpdate.mock.calls.flatMap(c => [c[0]?.data?.consent])).not.toContain(true);
  });

  it('records marketing consent ONLY on explicit opt-in, via the consent service', async () => {
    const res = await POST(req({ ...validBody, marketingConsent: true }));
    expect(res.status).toBe(201);
    // The pre-existing MarketingLead row is flipped to consent=true...
    expect(m.marketingLeadUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ consent: true }) }),
    );
    // ...and a purpose/channel-specific consent record exists (append-only service).
    expect(m.grantConsent).toHaveBeenCalledTimes(1);
    expect(m.grantConsent.mock.calls[0][0]).toMatchObject({
      consentMethod: 'CHECKBOX',
      visitorId: 'visitor-test-0001',
    });
  });

  it('treats an explicit marketingConsent=false exactly like silence', async () => {
    const res = await POST(req({ ...validBody, marketingConsent: false }));
    expect(res.status).toBe(201);
    expect(m.marketingLeadCreate.mock.calls[0][0].data.consent).toBe(false);
    expect(m.grantConsent).not.toHaveBeenCalled();
  });

  it('assigns a counselor and queues the first follow-up (never a marketing blast)', async () => {
    const res = await POST(req(validBody));
    expect(res.status).toBe(201);
    expect(m.autoAssignCounselor).toHaveBeenCalledWith('lead-new-1');
    expect(m.createFollowUpTask).toHaveBeenCalledWith('lead-new-1', 1);
    // No outbound messaging happens inside the public intake route.
    expect(JSON.stringify(m.crmAuditLogCreate.mock.calls)).not.toContain('welcomeSent":true');
  });

  it('logs an audit record with the real consent flag', async () => {
    await POST(req({ ...validBody, marketingConsent: true }));
    const audit = m.crmAuditLogCreate.mock.calls[0][0].data;
    expect(audit.action).toBe('PUBLIC_LEAD_SUBMITTED');
    expect(audit.actorRole).toBe('GUEST');
    expect(JSON.parse(audit.afterData).marketingConsentRecorded).toBe(true);
  });
});

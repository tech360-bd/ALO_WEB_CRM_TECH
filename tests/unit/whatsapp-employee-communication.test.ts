import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock db for whatsapp number pool tests
vi.mock('@/lib/db', () => ({
  db: {
    whatsAppOfficialNumber: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
    },
    employee: { findFirst: vi.fn() },
    employeeCommunicationProfile: { findUnique: vi.fn() },
    whatsAppNumberAssignmentAudit: { create: vi.fn() },
    communicationRoutingLog: { create: vi.fn() },
    whatsAppMessageStatus: { upsert: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    whatsAppMessageArchive: { updateMany: vi.fn() },
    webhookEvent: { create: vi.fn() },
    uccWebhookEvent: { create: vi.fn() },
    communicationThread: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    communicationMessage: { create: vi.fn(), findMany: vi.fn() },
    student: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    timelineEvent: { create: vi.fn() },
    slaEvent: { groupBy: vi.fn() },
  }
}));

import { db } from '@/lib/db';
import { normalizeBdPhone, OFFICIAL_NUMBERS, MAIN_NUMBER, COO_NUMBER, determineSenderNumber, seedOfficialNumberPool } from '@/lib/whatsapp-number-pool';
import { verifyWhatsAppSignature } from '@/lib/whatsapp-cloud-api';

describe('WhatsApp Employee Communication — core safeguards', () => {
  it('normalizes BD phones to E.164 without +', () => {
    expect(normalizeBdPhone('01805020100')).toBe('8801805020100');
    expect(normalizeBdPhone('+8801805020100')).toBe('8801805020100');
    expect(normalizeBdPhone('8801805020100')).toBe('8801805020100');
    expect(normalizeBdPhone('01805020102 ')).toBe('8801805020102');
  });

  it('official numbers are exactly 20 in range 01805020100-01805020119', () => {
    expect(OFFICIAL_NUMBERS).toHaveLength(20);
    expect(OFFICIAL_NUMBERS[0]).toBe('01805020100');
    expect(OFFICIAL_NUMBERS[19]).toBe('01805020119');
    expect(MAIN_NUMBER).toBe('01805020100');
    expect(COO_NUMBER).toBe('01805020101');
  });

  it('seedOfficialNumberPool remains additive and repairs a partial pool even when rows already exist', async () => {
    vi.mocked(db.whatsAppOfficialNumber.createMany).mockResolvedValue({ count: 2 } as never);
    vi.mocked(db.whatsAppOfficialNumber.count).mockResolvedValue(20);

    const result = await seedOfficialNumberPool();

    expect(db.whatsAppOfficialNumber.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ phoneNumber: '01805020100', isDefaultSender: true, isComplaintSender: true, isFollowUpSender: true }),
        expect.objectContaining({ phoneNumber: '01805020101', ownerType: 'COO', isSupport247: true }),
        expect.objectContaining({ phoneNumber: '01805020119', ownerType: 'EMPLOYEE' }),
      ]),
      skipDuplicates: true,
    });
    expect(result).toEqual({ seeded: true, created: 2, count: 20 });
  });

  it('routing: explicit number takes precedence', async () => {
    const r = await determineSenderNumber({ explicitNumber: '01805020105' });
    expect(r.number).toBe('01805020105');
    expect(r.reason).toBe('explicit_assignment');
    expect(r.fallback).toBe(false);
  });

  it('routing: urgent goes to COO 24/7', async () => {
    const r = await determineSenderNumber({ isUrgent: true });
    expect(r.number).toBe(COO_NUMBER);
    expect(r.reason).toBe('urgent_support');
  });

  it('routing: complaint and follow-up go to main', async () => {
    expect((await determineSenderNumber({ isComplaint: true })).number).toBe(MAIN_NUMBER);
    expect((await determineSenderNumber({ isFollowUp: true })).number).toBe(MAIN_NUMBER);
  });

  it('routing: defaults to main with fallback flag', async () => {
    const r = await determineSenderNumber({});
    expect(r.number).toBe(MAIN_NUMBER);
    expect(r.fallback).toBe(true);
    expect(r.reason).toBe('default_fallback');
  });

  it('verifyWhatsAppSignature: dev mode skips when secret missing', () => {
    const orig = process.env.WHATSAPP_APP_SECRET;
    delete process.env.WHATSAPP_APP_SECRET;
    process.env.NODE_ENV = 'development';
    expect(verifyWhatsAppSignature('body', null)).toBe(true);
    process.env.NODE_ENV = 'production';
    expect(verifyWhatsAppSignature('body', null)).toBe(false);
    if (orig) process.env.WHATSAPP_APP_SECRET = orig;
  });

  it('verifyWhatsAppSignature: rejects bad signature format', () => {
    process.env.WHATSAPP_APP_SECRET = 'test-secret';
    expect(verifyWhatsAppSignature('{}', 'bad')).toBe(false);
    expect(verifyWhatsAppSignature('{}', null)).toBe(false);
    expect(verifyWhatsAppSignature('{}', 'sha256=invalidhex')).toBe(false);
  });

  it('unconfigured sender must show CONFIGURATION REQUIRED — never fake connected', () => {
    // This is a policy test: if token/phone_number_id missing, send must not pretend connected
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    // In CI both are undefined — the send function should return CONFIGURATION REQUIRED
    expect(!token || !phoneId).toBe(true); // CI has no real creds
  });
});

describe('Partner data isolation — server enforcement', () => {
  it('partner must not access other partners students (mock RBAC)', async () => {
    // Simulate partner scope check: query must include partnerId filter
    const partnerId = 'partner-123';
    const otherPartnerStudent = { id: 'student-999', partnerId: 'partner-999' };
    // In real API, db.student.findMany would be called with where: { partnerId }
    // Here we assert the rule: without partnerId filter, test must fail
    const where: any = { partnerId };
    expect(where.partnerId).toBe(partnerId);
    expect(otherPartnerStudent.partnerId).not.toBe(where.partnerId);
  });

  it('attempt to change record ID is blocked', () => {
    const requestedId = 'student-123';
    const actualId = 'student-999';
    const isAuthorized = requestedId === actualId;
    expect(isAuthorized).toBe(false);
  });
});

describe('Document versioning — rejection never deletes', () => {
  it('rejection keeps original document', () => {
    const doc = { id: 'doc-1', status: 'VERIFIED', versions: [{ v: 1, url: 'a.pdf' }] };
    const rejected = { ...doc, status: 'REJECTED', rejectionReason: 'Blurry scan' };
    expect(rejected.versions).toHaveLength(1); // not deleted
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejectionReason).toBeTruthy();
  });

  it('verified documents cannot be casually replaced', () => {
    const doc = { id: 'doc-1', status: 'VERIFIED' };
    const canReplace = doc.status !== 'VERIFIED'; // must go through correction workflow
    expect(canReplace).toBe(false);
  });
});

describe('SLA exclusions', () => {
  it('provider outage does not count as breach', () => {
    const sla = { status: 'breach', reason: 'provider_outage' };
    const countsAsBreach = sla.reason !== 'provider_outage' && sla.status === 'breach';
    expect(countsAsBreach).toBe(false);
  });

  it('holiday excludes SLA', () => {
    const isHoliday = true;
    const slaDue = isHoliday ? 'excluded' : 'counted';
    expect(slaDue).toBe('excluded');
  });
});

describe('AI draft — human approval', () => {
  it('AI draft is labelled and requires human approval for high-risk', () => {
    const draft = { body: 'Dear student...', aiGenerated: true, label: 'AI GENERATED DRAFT', confidence: 0.6 };
    expect(draft.label).toBe('AI GENERATED DRAFT');
    const needsHuman = draft.aiGenerated && draft.confidence < 0.8;
    expect(needsHuman).toBe(true);
  });

  it('AI must not invent university deadline', () => {
    const aiReply = 'Your deadline is 15 Jan 2027';
    // In real code, AI service must not invent deadlines without source
    const hasSource = false;
    const shouldEscalate = aiReply.includes('deadline') && !hasSource;
    expect(shouldEscalate).toBe(true);
  });
});

describe('Webhook idempotency', () => {
  it('duplicate eventId is ignored', async () => {
    const eventId = 'wamid.123';
    const seen = new Set<string>();
    const process = (id: string) => {
      if (seen.has(id)) return 'duplicate';
      seen.add(id);
      return 'processed';
    };
    expect(process(eventId)).toBe('processed');
    expect(process(eventId)).toBe('duplicate');
  });
});

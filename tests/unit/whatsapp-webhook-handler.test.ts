import { describe, it, expect, vi } from 'vitest';

// Mock db to avoid PrismaClient init failure in CI (no binary download)
vi.mock('@/lib/db', () => ({
  db: {
    whatsAppOfficialNumber: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    employee: { findFirst: vi.fn() },
    student: { findFirst: vi.fn(), count: vi.fn() },
    portalStudentProfile: { findFirst: vi.fn() },
  },
}));
vi.mock('@/lib/whatsapp-number-pool', async () => {
  const actual = await vi.importActual('@/lib/whatsapp-number-pool') as any;
  return actual;
});

import {
  normalizePhone,
  normalizePhoneE164,
  normalizePhoneForCRM,
  safeEqual,
  verifySignature,
  verifySignatureStrict,
  sendOutboundViaApi,
  extractMessageContent,
  classifyIntent,
  detectPriority,
  generateStudentId,
} from '@/lib/whatsapp-webhook-handler';

describe('Consolidated WhatsApp Webhook Handler — lossless', () => {
  it('exports normalizePhone (BD 880) and normalizePhoneE164 (+)', () => {
    expect(normalizePhone('01805020100')).toBe('8801805020100');
    expect(normalizePhoneE164('01805020100')).toBe('+8801805020100');
    expect(normalizePhoneForCRM('01805020102')).toBe('+8801805020102');
    expect(normalizePhoneE164('+8801805020100')).toBe('+8801805020100');
  });

  it('exports safeEqual and verifySignature', () => {
    expect(typeof safeEqual).toBe('function');
    expect(typeof verifySignature).toBe('function');
  });

  it('exports verifySignatureStrict with 503 reason', () => {
    const orig = process.env.WHATSAPP_APP_SECRET;
    delete process.env.WHATSAPP_APP_SECRET;
    const r = verifySignatureStrict('body', 'sig');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/not configured/);
    if (orig) process.env.WHATSAPP_APP_SECRET = orig;
  });

  it('exports sendOutboundViaApi', async () => {
    expect(typeof sendOutboundViaApi).toBe('function');
    const res = await sendOutboundViaApi('8801805020100', 'hello');
    expect(res).toHaveProperty('messageId');
    expect(res.apiResponse.error).toMatch(/not configured|WHATSAPP/);
  });

  it('extractMessageContent handles all 10 types', () => {
    expect(extractMessageContent({ type: 'text', text: { body: 'hi' } }).body).toBe('hi');
    expect(extractMessageContent({ type: 'image', image: { id: '1', caption: 'cap' } }).body).toBe('cap');
    expect(extractMessageContent({ type: 'document', document: { filename: 'a.pdf', id: '2' } }).mediaId).toBe('2');
    expect(extractMessageContent({ type: 'audio', audio: { id: '3' } }).type).toBe('audio');
    expect(extractMessageContent({ type: 'video', video: { id: '4' } }).type).toBe('video');
    expect(extractMessageContent({ type: 'location', location: { latitude: 1, longitude: 1 } }).body).toContain('Location');
    expect(extractMessageContent({ type: 'contacts', contacts: [{ name: { formatted_name: 'John' } }] }).body).toContain('John');
    expect(extractMessageContent({ type: 'interactive', interactive: { type: 'button_reply', button_reply: { title: 'Yes' } } }).body).toBe('Yes');
    expect(extractMessageContent({ type: 'button', button: { text: 'Click' } }).body).toBe('Click');
  });

  it('classifyIntent and detectPriority from CRM (preserved)', () => {
    expect(classifyIntent('please upload passport please')).toBe('DOCUMENT_REQUIREMENT');
    expect(classifyIntent('payment failed for deposit')).toBe('PAYMENT_QUESTION');
    expect(classifyIntent('visa biometric appointment')).toBe('VISA_QUESTION');
    expect(classifyIntent('urgent deadline tomorrow')).toBe('URGENT');
    expect(detectPriority('URGENT', 'urgent')).toBe('critical');
    expect(detectPriority('DOCUMENT_REQUIREMENT', 'document')).toBe('high');
    expect(detectPriority('GENERAL', 'hello')).toBe('normal');
  });

  it('generateStudentId formats AE-YYYYNNNN', async () => {
    const fakeDb = {
      student: { findFirst: async () => ({ studentId: `AE-${new Date().getFullYear()}0005` }), count: async () => 5 },
      portalStudentProfile: { findFirst: async () => null },
    };
    const id = await generateStudentId(fakeDb);
    expect(id).toMatch(/^AE-\d{4}\d{4}$/);
  });

  it('re-exports number-pool and AI helpers', async () => {
    const handler = await import('@/lib/whatsapp-webhook-handler');
    expect(handler.MAIN_NUMBER).toBe('01805020100');
    expect(handler.COO_NUMBER).toBe('01805020101');
    expect(handler.OFFICIAL_NUMBERS).toHaveLength(20);
    expect(typeof handler.detectLanguage).toBe('function');
    expect(typeof handler.startSlaForThread).toBe('function');
  });
});

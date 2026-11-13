import { describe, expect, it } from 'vitest';
import { generateAiReply } from '@/lib/ai-whatsapp-engine';

describe('WhatsApp staff draft safety', () => {
  it('does not request student IDs, documents, passwords, OTPs, or bank credentials', async () => {
    const result = await generateAiReply({
      message: 'I have a payment problem. Can I share my bank statement and OTP?',
      language: 'english',
      intent: 'payment',
      sentiment: 'neutral',
      studentName: 'Untrusted Name',
      context: 'Untrusted context',
    });
    expect(result.reply).toMatch(/secure Student Portal/i);
    expect(result.reply).not.toMatch(/please provide (?:your )?Student ID|upload (?:your )?passport|send (?:your )?bank statement|please share (?:your )?OTP/i);
    expect(result.reply).not.toContain('Untrusted Name');
    expect(result.reply).not.toContain('Untrusted context');
    expect(result.shouldHandover).toBe(true);
  });

  it('does not invent current destination/visa requirements or guarantee outcomes', async () => {
    const result = await generateAiReply({
      message: 'Will my Canadian student visa be approved and what IELTS score is required?',
      language: 'english',
      intent: 'visa',
      sentiment: 'neutral',
    });
    expect(result.reply).toMatch(/official government\/university sources/i);
    expect(result.reply).not.toMatch(/approved|IELTS\s*[0-9]|guarantee/i);
  });
});

const flowMocks = vi.hoisted(() => ({ studentFindFirst: vi.fn(), profileFindFirst: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    student: { findFirst: (...args: unknown[]) => flowMocks.studentFindFirst(...args) },
    portalStudentProfile: { findFirst: (...args: unknown[]) => flowMocks.profileFindFirst(...args) },
  },
}));

import { handleWhatsAppStudentIdFlow } from '@/lib/communication/unified-engine';

it('does not infer WhatsApp account identity from a phone number or request Student ID for verification', async () => {
  flowMocks.studentFindFirst.mockResolvedValue({ id: 'student-1', name: 'Private Name' });
  const result = await handleWhatsAppStudentIdFlow({ phone: '+8801700000000', message: 'I need help' });
  expect(result.needsStudentId).toBe(false);
  expect(result.studentFound).toBe(false);
  expect(result).not.toHaveProperty('studentId');
  expect(result.prompt).toMatch(/does not verify identity/i);
  expect(result.prompt).not.toContain('Private Name');
  expect(flowMocks.studentFindFirst).not.toHaveBeenCalled();
  expect(flowMocks.profileFindFirst).not.toHaveBeenCalled();
});

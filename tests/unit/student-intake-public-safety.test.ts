import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  agentFindFirst: vi.fn(),
  memoryFindFirst: vi.fn(),
  memoryUpsert: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    agentDefinition: { findFirst: (...args: unknown[]) => mocks.agentFindFirst(...args) },
    agentMemory: {
      findFirst: (...args: unknown[]) => mocks.memoryFindFirst(...args),
      upsert: (...args: unknown[]) => mocks.memoryUpsert(...args),
    },
  },
}));
vi.mock('@/lib/communication/business-hours-store', () => ({
  loadBusinessHoursConfig: async () => ({
    timeZone: 'Asia/Dhaka',
    days: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, startTime: '09:00', endTime: '18:00', isWorkDay: [0, 1, 2, 3, 4, 6].includes(dayOfWeek), afterHoursAiAuto: true })),
    holidays: [],
  }),
}));
vi.mock('@/lib/ai-whatsapp-engine', () => ({ detectLanguage: vi.fn(() => ({ language: 'english' })) }));

import { handleIntakeMessage } from '@/lib/ai-agents/student-intake-agent';

afterEach(() => vi.unstubAllEnvs());

beforeEach(() => {
  vi.stubEnv('INTAKE_SESSION_SECRET', 'a-secure-test-secret-with-at-least-32-characters');
  vi.resetAllMocks();
  mocks.agentFindFirst.mockResolvedValue({ id: 'agent-1' });
  mocks.memoryFindFirst.mockResolvedValue(null);
  mocks.memoryUpsert.mockResolvedValue({});
});

describe('public student intake privacy and factuality', () => {
  it('never authenticates or looks up a student from a public Student ID', async () => {
    const result = await handleIntakeMessage({ channel: 'website', senderId: 'signed-session', text: 'My Student ID is AE-2025000123' });
    expect(result.studentDbId).toBeNull();
    expect(result.studentCode).toBeNull();
    expect(result.reply).toMatch(/cannot verify|cannot authenticate|Student Portal/i);
    expect(result.reply).not.toContain('AE-2025000123');
    expect(JSON.stringify(mocks.agentFindFirst.mock.calls)).not.toContain('AE-2025000123');
  });

  it('redacts contact details, IDs and credentials before saving conversation memory', async () => {
    await handleIntakeMessage({
      channel: 'website',
      senderId: 'signed-session',
      text: 'Please call me at +8801700000000, email me@example.test, my OTP is 481029 and my password is secret123.',
    });
    const serialized = JSON.stringify(mocks.memoryUpsert.mock.calls);
    expect(serialized).not.toContain('+8801700000000');
    expect(serialized).not.toContain('me@example.test');
    expect(serialized).not.toContain('481029');
    expect(serialized).not.toContain('secret123');
    expect(serialized).not.toContain('signed-session');
    expect(serialized).toContain('[phone or account number omitted]');
    expect(serialized).toContain('[email omitted]');
    expect(serialized).toContain('[credential omitted]');
  });

  it('redacts passport, national identity, and date-of-birth patterns from memory', async () => {
    await handleIntakeMessage({
      channel: 'website', senderId: 'signed-session',
      text: 'My passport is AB1234567, my NID is 1234567890123, and date of birth is 01/02/1998.',
    });
    const serialized = JSON.stringify(mocks.memoryUpsert.mock.calls);
    expect(serialized).not.toContain('AB1234567');
    expect(serialized).not.toContain('1234567890123');
    expect(serialized).not.toContain('01/02/1998');
    expect(serialized).toContain('[document number omitted]');
    expect(serialized).toMatch(/\[(?:number|phone or account number) omitted\]/);
    expect(serialized).toContain('[date omitted]');
  });

  it('pseudonymizes provider sender IDs before persisting memory keys or values', async () => {
    await handleIntakeMessage({ channel: 'whatsapp', senderId: '+8801700000000', text: 'Hello' });
    const serialized = JSON.stringify(mocks.memoryUpsert.mock.calls);
    expect(serialized).not.toContain('+8801700000000');
    expect(serialized).not.toContain('8801700000000');
    expect(serialized).toContain('[sender omitted]');
  });

  it('does not accept or analyze public document/image uploads', async () => {
    const result = await handleIntakeMessage({ channel: 'webchat', senderId: 'signed-session', text: 'Please review this', mediaType: 'document' });
    expect(result.reply).toMatch(/does not accept or review document uploads/i);
    expect(result.studentDbId).toBeNull();
  });

  it('uses bounded, non-factual guidance for destination questions', async () => {
    const result = await handleIntakeMessage({ channel: 'website', senderId: 'signed-session', text: 'What are the current Canada visa requirements?' });
    expect(result.reply).toMatch(/official sources|verify/i);
    expect(result.reply).not.toMatch(/visa (will|is) be approved|guarantee|IELTS [0-9]|bank statement/i);
  });
});

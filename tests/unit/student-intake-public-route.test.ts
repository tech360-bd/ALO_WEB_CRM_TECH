import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  handle: vi.fn(),
  status: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/ai-agents/student-intake-agent', () => ({ handleIntakeMessage: (...args: unknown[]) => mocks.handle(...args) }));
vi.mock('@/lib/communication/after-hours', () => ({ getOfficeHoursStatus: (...args: unknown[]) => mocks.status(...args) }));
vi.mock('@/lib/rate-limiter', () => ({ rateLimitMiddleware: (...args: unknown[]) => mocks.rateLimit(...args) }));

import { POST } from '@/app/api/ai/student-intake/route';

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('https://alo.test/api/ai/student-intake', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

afterEach(() => vi.unstubAllEnvs());

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('INTAKE_SESSION_SECRET', 'a-secure-test-secret-with-at-least-32-characters');
  mocks.rateLimit.mockReturnValue(null);
  mocks.handle.mockResolvedValue({
    reply: 'Use the secure Student Portal for personal information.',
    context: { state: 'COUNSELING', lang: 'en', officeHours: false },
    studentDbId: null,
    studentCode: null,
  });
});

describe('public student-intake route security contract', () => {
  it('ignores the client-supplied sender ID and never exposes student identifiers', async () => {
    const response = await POST(request({ channel: 'website', senderId: 'attacker-selected-student-id', text: 'Hello' }));
    const body = await response.json();
    const call = mocks.handle.mock.calls[0][0];

    expect(response.status).toBe(200);
    expect(call.senderId).not.toBe('attacker-selected-student-id');
    expect(call.senderId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body.studentDbId).toBeNull();
    expect(body.studentCode).toBeNull();
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('set-cookie')).toContain('alo_intake_session=');
  });

  it('fails closed when no sufficiently long signing secret is configured', async () => {
    vi.stubEnv('INTAKE_SESSION_SECRET', 'short');
    const response = await POST(request({ channel: 'website', text: 'Hello' }));
    expect(response.status).toBe(503);
    expect(mocks.handle).not.toHaveBeenCalled();
  });

  it('stops requests rejected by the rate limiter before parsing or processing intake', async () => {
    mocks.rateLimit.mockReturnValue(new Response('limited', { status: 429 }));
    const response = await POST(request({ channel: 'website', text: 'Hello' }));
    expect(response.status).toBe(429);
    expect(mocks.handle).not.toHaveBeenCalled();
  });

  it('rejects unexpected body fields and malformed intake payloads', async () => {
    const response = await POST(request({ channel: 'website', text: 'Hello', role: 'SUPER_ADMIN' }));
    expect(response.status).toBe(400);
    expect(mocks.handle).not.toHaveBeenCalled();
  });
});

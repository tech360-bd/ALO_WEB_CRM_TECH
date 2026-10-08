import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  runWorkflow: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: mocks.getServerSession }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/automation-engine', () => ({ runWorkflow: mocks.runWorkflow }));

import type { NextRequest } from 'next/server';
import { POST } from '@/app/api/automation/run/route';

function makeRequest(body: unknown): NextRequest {
  return new Request('https://alo.test/api/automation/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getServerSession.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
});

describe('legacy automation dispatch safety', () => {
  it('requires a target for lead-specific workflows instead of processing a bulk set', async () => {
    const response = await POST(makeRequest({ workflow: 'lead_scoring' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: expect.stringContaining('unscoped bulk execution is disabled') });
    expect(mocks.runWorkflow).not.toHaveBeenCalled();
  });

  it('rejects workflow names without an implementation', async () => {
    const response = await POST(makeRequest({ workflow: 'university_twin_refresh' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: 'Unsupported automation workflow' });
    expect(mocks.runWorkflow).not.toHaveBeenCalled();
  });

  it('validates bounded follow-up timing before execution', async () => {
    const response = await POST(makeRequest({ workflow: 'follow_up_task_creation', targetId: 'lead-1', days: 365.5 }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: 'days must be an integer between 0 and 365' });
    expect(mocks.runWorkflow).not.toHaveBeenCalled();
  });

  it('does not translate a failed workflow result into HTTP success', async () => {
    mocks.runWorkflow.mockResolvedValue({ workflow: 'lead_scoring', skipped: false, success: false, error: 'record unavailable' });

    const response = await POST(makeRequest({ workflow: 'lead_scoring', targetId: 'lead-1' }));

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ success: false, status: 'FAILED', error: 'record unavailable' });
  });

  it('does not claim completion when the runtime returns no success state', async () => {
    mocks.runWorkflow.mockResolvedValue({ workflow: 'report_generation', skipped: true, reason: 'DRY_RUN' });

    const response = await POST(makeRequest({ workflow: 'report_generation' }));

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ success: false, status: 'UNVERIFIED_RESULT' });
  });

  it('labels an explicit dry run as dry-run and does not claim execution', async () => {
    mocks.runWorkflow.mockResolvedValue({ workflow: 'lead_scoring', skipped: true, reason: 'DRY_RUN' });

    const response = await POST(makeRequest({ workflow: 'lead_scoring', targetId: 'lead-1', dryRun: true }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, status: 'DRY_RUN', message: 'No workflow side effects were requested.' });
  });

  it('returns a completed state only when the workflow reports success', async () => {
    mocks.runWorkflow.mockResolvedValue({ workflow: 'lead_scoring', skipped: false, success: true, result: { score: 82 } });

    const response = await POST(makeRequest({ workflow: 'lead_scoring', targetId: 'lead-1' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, status: 'COMPLETED', result: { success: true, result: { score: 82 } } });
  });
});

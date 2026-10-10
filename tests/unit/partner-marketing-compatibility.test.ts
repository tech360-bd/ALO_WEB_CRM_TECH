import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  GET: vi.fn(),
  POST: vi.fn(),
  PATCH: vi.fn(),
}));
vi.mock('@/app/api/partner-admin/marketing/route', () => ({ GET: mocks.GET, POST: mocks.POST, PATCH: mocks.PATCH }));

import { GET as legacyDashboard, POST as legacyIdea } from '@/app/api/partner/marketing/route';
import { POST as legacyGenerate } from '@/app/api/partner/marketing/generate/route';
import { POST as legacyApprove } from '@/app/api/partner/marketing/approve/route';

function request(path: string, body: unknown, method = 'POST') {
  return new Request(`https://portal.example.test${path}`, {
    method,
    headers: { origin: 'https://portal.example.test', cookie: 'alo_portal_session=test-session', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.GET.mockResolvedValue(NextResponse.json({ success: true }));
  mocks.POST.mockResolvedValue(NextResponse.json({ success: true }));
  mocks.PATCH.mockResolvedValue(NextResponse.json({ success: true }));
});

describe('legacy partner marketing URLs do not retain a second or fake implementation', () => {
  it('delegates dashboard reads to the tenant-scoped canonical route', async () => {
    await legacyDashboard(new Request('https://portal.example.test/api/partner/marketing?status=draft', { headers: { cookie: 'session=x' } }));
    const delegated = mocks.GET.mock.calls[0][0];
    expect(delegated).toBeInstanceOf(NextRequest);
    expect(new URL(delegated.url).pathname).toBe('/api/partner-admin/marketing');
    expect(new URL(delegated.url).search).toBe('?status=draft');
  });

  it('maps legacy idea fields to the canonical compliant draft generator', async () => {
    await legacyIdea(request('/api/partner/marketing', {
      idea: 'Promote our September intake information session', countryId: 'Bangladesh',
      universityId: 'Northbridge University', courseId: 'MSc Computing', intake: 'September 2027',
      platform: 'FACEBOOK', language: 'English', ctaText: 'Book a consultation',
    }));
    const delegated = mocks.POST.mock.calls[0][0];
    expect(delegated).toBeInstanceOf(NextRequest);
    expect(JSON.parse(await delegated.text())).toMatchObject({
      idea: 'Promote our September intake information session',
      country: 'Bangladesh', university: 'Northbridge University', course: 'MSc Computing',
      cta: 'Book a consultation', intake: 'September 2027',
    });
  });

  it('delegates image/video generation to the real provider/quota workflow, never a fabricated CDN URL', async () => {
    const response = await legacyGenerate(request('/api/partner/marketing/generate', { requestId: 'campaign-1', generateType: 'image' }));
    expect(response.status).toBe(200);
    const delegated = mocks.PATCH.mock.calls[0][0];
    expect(JSON.parse(await delegated.text())).toEqual({ id: 'campaign-1', action: 'generate_image' });

    await legacyGenerate(request('/api/partner/marketing/generate', { requestId: 'campaign-2', generateType: 'video' }));
    expect(JSON.parse(await mocks.PATCH.mock.calls[1][0].text())).toEqual({ id: 'campaign-2', action: 'generate_video' });

    const retiredContent = await legacyGenerate(request('/api/partner/marketing/generate', { requestId: 'campaign-3', generateType: 'content' }));
    expect(retiredContent.status).toBe(410);
    expect(mocks.PATCH).toHaveBeenCalledTimes(2);
  });

  it('maps the old partner approve URL to submit-for-review, never scheduled/published success', async () => {
    await legacyApprove(request('/api/partner/marketing/approve', { requestId: 'campaign-1' }));
    expect(JSON.parse(await mocks.PATCH.mock.calls[0][0].text())).toEqual({ id: 'campaign-1', action: 'submit' });
  });
});

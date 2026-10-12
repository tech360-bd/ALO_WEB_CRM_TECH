import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), search: vi.fn(), record: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/keyword-research-engine', () => ({ searchKeywords: m.search, recordKeyword: m.record }));
import { GET, POST } from '@/app/api/seo/keywords/route';
function req(query = '', body?: unknown) { return new NextRequest('https://alo.example.test/api/seo/keywords'+query, body ? { method:'POST', headers:{ origin:'https://alo.example.test' }, body:JSON.stringify(body) } : undefined); }
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue({ userId:'synthetic', userType:'MARKETING', authenticationMethod:'cookie' }); m.search.mockResolvedValue({ items:[], total:0 }); });
describe('SEO stored keywords', () => {
  it.each(['STUDENT','PARTNER','COUNSELOR'])('denies %s before querying private research', async role => {
    m.auth.mockResolvedValue({ userType:role }); expect((await GET(req())).status).toBe(403); expect(m.search).not.toHaveBeenCalled();
  });
  it('unauthenticated requests are not accepted', async () => {
    m.auth.mockResolvedValue(NextResponse.json({}, { status:401 })); expect((await GET(req())).status).toBe(401);
  });
  it('empty stored dataset returns empty data, no invented ranks', async () => {
    const response = await GET(req('?q=scholarships')); expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ items:[], total:0, liveProviderVerified:false }); expect(m.search).toHaveBeenCalledWith(expect.objectContaining({ q:'scholarships', limit:50, offset:0 }));
  });
  it.each(['?limit=NaN','?limit=-1','?offset=-2'])('invalid pagination %s returns validation error', async query => {
    expect((await GET(req(query))).status).toBe(400); expect(m.search).not.toHaveBeenCalled();
  });
  it('database failure is explicit, not an empty success', async () => {
    m.search.mockRejectedValue(new Error('synthetic DB failure')); expect((await GET(req())).status).toBe(503);
  });
  it('negative fabricated input is rejected', async () => {
    expect((await POST(req('', {keyword:'synthetic', searchVolume:-1}))).status).toBe(400); expect(m.record).not.toHaveBeenCalled();
  });
});

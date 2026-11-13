import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ find: vi.fn(), create: vi.fn(), sourceUpdate: vi.fn(), guard: vi.fn(), canonicalPost: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { monitoringLog: { findFirst: m.find, create: m.create }, officialSource: { update: m.sourceUpdate } } }));
vi.mock('@/lib/university-monitoring-auth', () => ({ requireMonitoringAdmin: m.guard }));
vi.mock('@/app/api/university-monitoring/sources/route', () => ({ POST: m.canonicalPost }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: vi.fn() }));
import { monitorCatalogueBatch } from '@/lib/official-crawlers/catalogue-monitoring';
import { GET } from '@/app/api/university-monitoring/catalogue/route';
import { POST as legacyPost } from '@/app/api/official-sources/route';
const source = { id: 'synthetic-source', sourceUrl: 'https://synthetic-university.edu/courses', universitySlug: 'synthetic-university' };
beforeEach(() => { vi.resetAllMocks(); m.find.mockResolvedValue(null); m.create.mockResolvedValue({ id: 'checkpoint-1' }); m.guard.mockResolvedValue({ ok: true, actor: { auth: {}, userId: 'synthetic-admin' } }); });
describe('catalogue discovery persistence and access', () => {
  it('appends a durable checkpoint without creating a production university/course', async () => {
    const result = await monitorCatalogueBatch(source, 'synthetic-run', async (url) => ({ ok: true, text: `<a href="${url}?page=next">Next courses</a>`, contentType: 'text/html' }));
    expect(result.report.status).toBe('IN_PROGRESS');
    expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({ runId: 'synthetic-run', entityType: 'CATALOGUE_TRAVERSAL', entitySlug: source.id }) });
    expect(m.sourceUpdate).toHaveBeenCalledWith({ where: { id: source.id }, data: { lastCheckedAt: null } });
    const saved = JSON.parse(m.create.mock.calls[0][0].data.metadata).state;
    expect(saved.catalogueVerified).toBe(false); expect(saved.frontier.length).toBeGreaterThan(0);
  });
  it('resumes the persisted frontier rather than restarting at the root', async () => {
    let fetched = 0;
    const result = await monitorCatalogueBatch(source, 'synthetic-run', async (url) => ({ ok: true, text: `<a href="/courses/page-${++fetched}">More courses</a>` }));
    m.find.mockResolvedValue({ metadata: m.create.mock.calls[0][0].data.metadata });
    const calls: string[] = [];
    await monitorCatalogueBatch(source, 'synthetic-next-run', async (url) => { calls.push(url); return { ok: true, text: '<p>Synthetic final page</p>' }; });
    expect(calls[0]).toBe(result.report.frontier[0].url); expect(calls).not.toContain(source.sourceUrl);
  });
  it('does not expose unapproved discovery evidence to non-admin callers', async () => {
    m.guard.mockResolvedValue({ ok: false, response: NextResponse.json({}, { status: 403 }) });
    expect((await GET(new Request(`https://alo.test/api/university-monitoring/catalogue?sourceId=${source.id}`))).status).toBe(403);
    expect(m.find).not.toHaveBeenCalled();
  });
  it('does not return a false verified-catalogue flag even if stored metadata is corrupt', async () => {
    m.find.mockResolvedValue({ id: 'checkpoint', metadata: JSON.stringify({ state: { version: 1, catalogueVerified: true } }) });
    const body = await (await GET(new Request(`https://alo.test/api/university-monitoring/catalogue?sourceId=${source.id}`))).json();
    expect(body.report.catalogueVerified).toBe(false);
  });
  it('legacy source creation cannot self-verify or bypass canonical source registration', async () => {
    m.canonicalPost.mockImplementation(async (req: Request) => NextResponse.json({ mapped: await req.json() }));
    const response = await legacyPost(new NextRequest('https://alo.test/api/official-sources', { method: 'POST', headers: { origin: 'https://alo.test' }, body: JSON.stringify({ sourceUrl: source.sourceUrl, sourceTitle: 'Synthetic catalogue', targetType: 'university', targetSlug: source.universitySlug, verificationStatus: 'verified', verifiedBy: 'forged-user' }) }));
    const body = await response.json();
    expect(body.mapped.entityType).toBe('UNIVERSITY'); expect(body.mapped.universitySlug).toBe(source.universitySlug);
    expect(body.mapped).not.toHaveProperty('verificationStatus'); expect(body.mapped).not.toHaveProperty('verifiedBy');
  });
});

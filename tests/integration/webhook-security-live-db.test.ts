import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { testDatabaseUrl } from '../helpers/test-database';
const url = testDatabaseUrl();
const prisma = new PrismaClient(url ? { datasourceUrl: url } : {});
vi.mock('@/lib/db', () => ({ get db() { return prisma; } }));
import { POST as create, GET as list } from '@/app/api/webhooks/subscriptions/route';
import { DELETE as archive } from '@/app/api/webhooks/subscriptions/[id]/route';
import { POST as diagnostic } from '@/app/api/webhooks/test/route';
const suite = url ? describe : describe.skip;
const suffix = `${Date.now().toString(36)}-webhooks`;
const master = `master-${suffix}`;
const staff = `staff-${suffix}`;
const token = `isolated-session-${suffix}`;
const staffToken = `isolated-staff-session-${suffix}`;
let subscriptionId = '';
function request(path: string, body?: unknown, session = token, method = 'POST') {
  return new NextRequest(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${path}`, {
    method: body === undefined ? (method === 'DELETE' ? method : 'GET') : method,
    headers: { cookie: `alo_portal_session=${session}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
suite('real MySQL webhook authority, diagnostics and preserved history', () => {
  beforeAll(async () => {
    vi.stubEnv('ENCRYPTION_KEY', '0'.repeat(64));
    for (const [id, userType, session] of [[master, 'SUPER_ADMIN', token], [staff, 'EMPLOYEE', staffToken]]) {
      await prisma.portalUser.create({ data: { id, email: `${id}@isolated.test`, name: id, userType, status: 'active', emailVerified: true } });
      await prisma.portalSession.create({ data: { userId: id, token: session, expiresAt: new Date(Date.now() + 3600000) } });
    }
  });
  afterAll(async () => {
    if (subscriptionId) { await prisma.webhookDelivery.deleteMany({ where: { subscriptionId } }); await prisma.webhookSubscription.deleteMany({ where: { id: subscriptionId } }); }
    await prisma.portalAuditLog.deleteMany({ where: { actorUserId: { in: [master, staff] } } });
    await prisma.portalSession.deleteMany({ where: { userId: { in: [master, staff] } } });
    await prisma.portalUser.deleteMany({ where: { id: { in: [master, staff] } } });
    vi.unstubAllEnvs(); await prisma.$disconnect();
  });
  it('rejects unauthenticated requests through the real auth middleware', async () => {
    expect((await list(request('/api/webhooks/subscriptions', undefined, 'unknown-session'))).status).toBe(401);
  });
  it('denies an actual active employee without an explicit global grant', async () => {
    expect((await list(request('/api/webhooks/subscriptions', undefined, staffToken))).status).toBe(403);
  });
  it('creates an encrypted subscription and its audit in actual database tables', async () => {
    const response = await create(request('/api/webhooks/subscriptions', { name: `Isolated ${suffix}`, targetUrl: 'https://example.invalid/isolated', events: ['lead.created'] }));
    expect(response.status).toBe(201);
    const body = await response.json(); subscriptionId = body.subscription.id;
    const row = await prisma.webhookSubscription.findUniqueOrThrow({ where: { id: subscriptionId } });
    expect(row.secret).not.toBe(body.secret); expect(row.secret.split(':')).toHaveLength(3);
    expect(await prisma.portalAuditLog.count({ where: { entityId: subscriptionId, action: 'WEBHOOK_SUBSCRIPTION_CREATED', actorUserId: master } })).toBe(1);
  });
  it('rejects client-controlled destination overrides without enqueueing a test', async () => {
    const response = await diagnostic(request('/api/webhooks/test', { subscriptionId, targetUrl: 'http://169.254.169.254/' }));
    expect(response.status).toBe(400);
    expect(await prisma.webhookDelivery.count({ where: { subscriptionId } })).toBe(0);
  });
  it('fails closed on an unavailable signing secret and records the real failure without outbound HTTP', async () => {
    // Deliberately corrupt this isolated fixture. No external request is allowed.
    await prisma.webhookSubscription.update({ where: { id: subscriptionId }, data: { secret: '' } });
    const response = await diagnostic(request('/api/webhooks/test', { subscriptionId })); expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ delivered: false, status: 'DEAD' });
    const row = await prisma.webhookDelivery.findFirstOrThrow({ where: { subscriptionId, eventType: 'webhook.test' } });
    expect(row.status).toBe('DEAD'); expect(row.errorMessage).toContain('SIGNING_SECRET_UNAVAILABLE');
    expect(await prisma.portalAuditLog.count({ where: { entityId: row.id, action: { in: ['WEBHOOK_TEST_REQUESTED', 'WEBHOOK_TEST_COMPLETED'] } } })).toBe(2);
  });
  it('rate limits a second actual diagnostic reservation', async () => {
    expect((await diagnostic(request('/api/webhooks/test', { subscriptionId }))).status).toBe(429);
    expect(await prisma.webhookDelivery.count({ where: { subscriptionId } })).toBe(1);
  });
  it('archives configuration and retains actual delivery and audit history', async () => {
    const response = await archive(request(`/api/webhooks/subscriptions/${subscriptionId}`, undefined, token, 'DELETE'), { params: Promise.resolve({ id: subscriptionId }) });
    expect(response.status).toBe(200);
    expect((await prisma.webhookSubscription.findUniqueOrThrow({ where: { id: subscriptionId } })).active).toBe(false);
    expect(await prisma.webhookDelivery.count({ where: { subscriptionId } })).toBe(1);
    expect(await prisma.portalAuditLog.count({ where: { entityId: subscriptionId, action: 'WEBHOOK_SUBSCRIPTION_ARCHIVED' } })).toBe(1);
  });
  it('rejects diagnostics after archive', async () => {
    expect((await diagnostic(request('/api/webhooks/test', { subscriptionId }))).status).toBe(409);
  });
});

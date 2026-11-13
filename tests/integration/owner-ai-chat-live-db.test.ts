import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { testDatabaseUrl } from '../helpers/test-database';
const url = testDatabaseUrl();
const prisma = new PrismaClient(url ? { datasourceUrl: url } : {});
vi.mock('@/lib/db', () => ({ get db() { return prisma; } }));
// Provider responses are mocked; persistence/auth/encryption/audit use real MySQL.
const gateway = vi.hoisted(() => vi.fn());
vi.mock('@/lib/ai-gateway', () => ({ aiGateway: gateway }));
import { GET, POST } from '@/app/api/admin/ai-chat/route';
const suite = url ? describe : describe.skip;
const id = `owner-chat-test-${randomUUID()}`;
const other = `${id}-other`;
const staff = `${id}-staff`;
const conversationId = randomUUID();
const requestId = randomUUID();
const payload = { requestId, conversationId, provider: 'local', model: 'isolated-local-test', message: 'Isolated private history fixture' };
function request(owner = id, body?: unknown, conversation?: string) { return new NextRequest(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/ai-chat${conversation ? `?conversationId=${conversation}` : ''}`, { ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}), headers: { cookie: `alo_portal_session=${owner}-session`, 'Content-Type': 'application/json' } }); }
suite('owner AI chat real MySQL authorization and encrypted persistence', () => {
  beforeAll(async () => {
    vi.stubEnv('UNOROUTER_ENABLED','false'); vi.stubEnv('LOCAL_AI_URL','http://127.0.0.1:11434/v1'); vi.stubEnv('LOCAL_AI_MODEL','isolated-local-test'); vi.stubEnv('ENCRYPTION_KEY','29'.repeat(32));
    for (const userId of [id,other,staff]) {
      await prisma.portalUser.create({ data: { id: userId, email: `${userId}@isolated.test`, name: userId, userType: userId === staff ? 'EMPLOYEE' : 'SUPER_ADMIN', status: 'active', emailVerified: true } });
      await prisma.portalSession.create({ data: { userId, token: `${userId}-session`, expiresAt: new Date(Date.now() + 600000) } });
    }
    gateway.mockResolvedValue({ provider: 'local', model: 'isolated-local-test', text: 'Isolated reply from mocked provider' });
  });
  afterAll(async () => {
    await prisma.awfRun.deleteMany({ where: { actorUserId: { in: [id,other,staff] } } });
    await prisma.portalAuditLog.deleteMany({ where: { actorUserId: { in: [id,other,staff] } } });
    await prisma.portalSession.deleteMany({ where: { userId: { in: [id,other,staff] } } });
    await prisma.portalUser.deleteMany({ where: { id: { in: [id,other,staff] } } });
    await prisma.$disconnect(); vi.unstubAllEnvs();
  });
  it('creates encrypted persistent history and audit; retries do not infer twice', async () => {
    const first = await POST(request(id,payload)); expect(first.status).toBe(200);
    const row = await prisma.awfRun.findFirstOrThrow({ where: { actorUserId: id, entityId: conversationId } });
    expect(row.status).toBe('COMPLETED'); expect(row.input).not.toContain(payload.message); expect(row.output).not.toContain('Isolated reply');
    expect((await POST(request(id,payload))).status).toBe(200); expect(gateway).toHaveBeenCalledTimes(1);
    expect(await prisma.awfRun.count({ where: { actorUserId: id, entityId: conversationId } })).toBe(1);
    const history = await GET(request(id,undefined,conversationId)); expect(history.status).toBe(200); expect(await history.text()).toContain(payload.message);
    expect(await prisma.portalAuditLog.count({ where: { actorUserId: id, action: 'AI_CHAT_COMPLETED' } })).toBe(1);
  });
  it('rejects changed retries and prevents another owner from viewing history', async () => {
    expect((await POST(request(id,{ ...payload, message: 'Changed retry' }))).status).toBe(409);
    const history = await GET(request(other,undefined,conversationId)); expect(history.status).toBe(200); expect((await history.json()).messages).toEqual([]);
  });
  it('ordinary employees cannot access the owner endpoint directly', async () => { expect((await POST(request(staff,payload))).status).toBe(403); });
});

import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { testDatabaseUrl } from '../helpers/test-database';
const state = vi.hoisted(() => ({ actorId: '' }));
vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: state.actorId, role: 'SUPER_ADMIN' } })) }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
const url = testDatabaseUrl();
const prisma = new PrismaClient(url ? { datasourceUrl: url } : {});
vi.mock('@/lib/db', () => ({ get db() { return prisma; } }));
import { POST } from '@/app/api/admin/resources/route';
import { contentAuditLog } from '@/lib/content-audit';
const suite = url ? describe : describe.skip;
const suffix = Date.now().toString(36);
const categoryId = `security-category-${suffix}`;
const slugs = [`security-success-${suffix}`, `security-rollback-${suffix}`, `security-denied-${suffix}`];
function request(slug: string, origin = 'https://aloeducation.com') {
  return new NextRequest('https://aloeducation.com/api/admin/resources', { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify({ slug, title: 'Local security fixture', categoryId, content: 'Local integration fixture only', status: 'DRAFT' }) });
}
suite('real local MySQL content authorization and atomic audit', () => {
  beforeAll(async () => {
    state.actorId = `security-admin-${suffix}`;
    await prisma.user.create({ data: { id: state.actorId, email: `${suffix}@alo.test`, role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerified: true } });
    await prisma.resourceCategory.create({ data: { id: categoryId, slug: categoryId, name: 'Local fixture', status: 'ACTIVE' } });
  });
  afterAll(async () => {
    vi.restoreAllMocks();
    await prisma.resource.deleteMany({ where: { slug: { in: slugs } } });
    await prisma.portalAuditLog.deleteMany({ where: { actorUserId: state.actorId } });
    await prisma.resourceCategory.delete({ where: { id: categoryId } });
    await prisma.user.delete({ where: { id: state.actorId } });
    await prisma.$disconnect();
  });
  it('persists a resource and its audit without invalid null text values', async () => {
    const response = await POST(request(slugs[0]));
    expect(response.status).toBe(201);
    const row = await prisma.resource.findUniqueOrThrow({ where: { slug: slugs[0] } });
    expect(row.sourceUrl).toBe('');
    expect(await prisma.portalAuditLog.count({ where: { entityId: row.id, action: 'RESOURCE_CREATE' } })).toBe(1);
  });
  it('rolls back the resource when audit persistence fails', async () => {
    const spy = vi.spyOn(contentAuditLog, 'create').mockRejectedValueOnce(new Error('Injected audit failure'));
    expect((await POST(request(slugs[1]))).status).toBe(500);
    expect(await prisma.resource.count({ where: { slug: slugs[1] } })).toBe(0);
    spy.mockRestore();
  });
  it('rejects foreign origins even with an admin session', async () => {
    expect((await POST(request(slugs[2], 'https://attacker.example'))).status).toBe(401);
    expect(await prisma.resource.count({ where: { slug: slugs[2] } })).toBe(0);
  });
  it('revalidates disabled accounts instead of trusting stale session roles', async () => {
    await prisma.user.update({ where: { id: state.actorId }, data: { status: 'INACTIVE' } });
    expect((await POST(request(slugs[2]))).status).toBe(401);
    expect(await prisma.resource.count({ where: { slug: slugs[2] } })).toBe(0);
  });
});

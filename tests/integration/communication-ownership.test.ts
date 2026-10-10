import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { testDatabaseUrl } from '../helpers/test-database';
import type { AuthContext } from '@/lib/auth-middleware';
const state = vi.hoisted(() => ({ auth: {} as AuthContext }));
vi.mock('@/lib/auth-middleware', () => ({ withAuth: (handler: (req: Request, auth: AuthContext) => unknown) => (req: Request) => handler(req, state.auth) }));
const url = testDatabaseUrl();
const prisma = new PrismaClient(url ? { datasourceUrl: url } : {});
vi.mock('@/lib/db', () => ({ get db() { return prisma; } }));
import { createCommunication } from '@/lib/communication/unified-engine';
import { GET as timeline } from '@/app/api/crm/communications/timeline/route';
import { GET as inbox, POST as action } from '@/app/api/crm/communications/inbox/route';
import { GET as messages } from '@/app/api/crm/communications/route';
import { GET as broadcasts, POST as broadcastAction } from '@/app/api/crm/communications/broadcasts/route';
const suite = url ? describe : describe.skip;
const suffix = Date.now().toString(36);
const ids = ['student', 'other', 'staff', 'partner', 'master'].map(name => `scope-${name}-${suffix}`);
const threads: string[] = [];
function actor(index: number, userType: string, roles: string[] = [], permissions: string[] = []) {
  state.auth = { userId: ids[index], userType, roles, permissions, actorUserId: ids[index], email: '', name: '', sessionId: '', actorEmail: '', actorName: '' };
}
function req(path: string) { return new NextRequest(`https://aloeducation.com/api/crm/communications${path}`); }
suite('real MySQL communication ownership, previews and atomic actions', () => {
  beforeAll(async () => {
    for (let i = 0; i < ids.length; i++) await prisma.portalUser.create({ data: { id: ids[i], email: `${ids[i]}@alo.test`, emailVerified: true } });
    await prisma.portalStudentProfile.create({ data: { userId: ids[0], studentId: ids[0] } });
    await prisma.employee.create({ data: { userId: ids[2], employeeId: ids[2], status: 'active' } });
    await prisma.partnerProfile.create({ data: { userId: ids[3], partnerId: ids[3], approvalStatus: 'approved' } });
    for (const data of [
      { studentId: ids[0], visibility: 'student_visible', assignedToId: ids[2] },
      { studentId: ids[1], visibility: 'student_visible', assignedToId: ids[1] },
      { studentId: ids[0], visibility: 'b2b_confidential', b2bProviderId: 'private', assignedToId: ids[2] },
      { partnerId: ids[3], visibility: 'partner_visible', assignedToId: ids[2] },
    ]) {
      const thread = await prisma.communicationThread.create({ data }); threads.push(thread.id);
      await prisma.communicationMessage.create({ data: { threadId: thread.id, studentId: data.studentId, partnerId: data.partnerId, b2bProviderId: data.b2bProviderId, visibility: data.visibility, messageBody: data.visibility, content: data.visibility } });
    }
    await prisma.communicationMessage.create({ data: { threadId: threads[0], studentId: ids[0], visibility: 'super_admin_only', messageBody: 'Never expose this preview', content: 'secret' } });
  });
  afterAll(async () => {
    const messageIds = (await prisma.communicationMessage.findMany({ where: { threadId: { in: threads } }, select: { id: true } })).map(row => row.id);
    await prisma.communicationLog.deleteMany({ where: { communicationId: { in: messageIds } } });
    await prisma.crmAuditLog.deleteMany({ where: { actorUserId: { in: ids } } });
    await prisma.timelineEvent.deleteMany({ where: { studentId: { in: ids } } });
    await prisma.communicationMessage.deleteMany({ where: { threadId: { in: threads } } });
    await prisma.communicationThread.deleteMany({ where: { id: { in: threads } } });
    await prisma.portalAuditLog.deleteMany({ where: { actorUserId: { in: ids } } });
    await prisma.counselorTask.deleteMany({ where: { employeeId: { in: ids } } });
    await prisma.employee.deleteMany({ where: { userId: { in: ids } } });
    await prisma.partnerProfile.deleteMany({ where: { userId: { in: ids } } });
    await prisma.portalStudentProfile.deleteMany({ where: { userId: { in: ids } } });
    await prisma.portalUser.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });
  it('denies student and partner broadcast creation even with forged elevated roles', async () => {
    for (const [index, type] of [[0, 'STUDENT'], [3, 'PARTNER']] as const) {
      actor(index, type, ['SUPER_ADMIN'], ['communication.broadcast']);
      expect((await broadcasts(req('/broadcasts'))).status).toBe(403);
      expect((await broadcastAction(new NextRequest(req('/broadcasts').url, { method: 'POST', body: JSON.stringify({ action: 'create', title: 'Forbidden' }) }))).status).toBe(403);
    }
  });
  it('limits student queries to own safe messages even when a foreign ID is supplied', async () => {
    actor(0, 'STUDENT');
    expect((await (await timeline(req(`/timeline?studentId=${ids[1]}`))).json()).count).toBe(0);
    const result = await (await messages(req(''))).json();
    expect(result.total).toBe(1); expect(result.data[0].threadId).toBe(threads[0]);
  });
  it('filters inbox previews and counts so hidden newest messages cannot leak', async () => {
    actor(0, 'STUDENT');
    const result = await (await inbox(req('/inbox'))).json();
    expect(result.total).toBe(1); expect(result.threads[0].lastMessage).toBe('student_visible');
    expect(result.channelSummary[0]._count.id).toBe(1);
  });
  it('limits partner accounts to their own company even with a forged super-admin role', async () => {
    actor(3, 'PARTNER', ['super_admin']);
    const result = await (await timeline(req('/timeline'))).json();
    expect(result.count).toBe(1); expect(result.messages[0].partnerId).toBe(ids[3]);
  });
  it('restricts staff to assigned threads and hides B2B without explicit authority', async () => {
    actor(2, 'EMPLOYEE', ['counselor']);
    const result = await (await timeline(req('/timeline'))).json();
    expect(result.count).toBe(2); expect(result.messages.every((row: { visibility: string }) => row.visibility !== 'b2b_confidential')).toBe(true);
  });
  it('persists inbound delivery and audit without claiming external delivery', async () => {
    const result = await createCommunication({ threadId: threads[0], channel: 'whatsapp', studentId: ids[0], messageBody: 'Stored local inbound message', visibility: 'student_visible', createdBy: ids[2] });
    expect(result.message.deliveryStatus).toBe('received');
    expect(await prisma.communicationLog.count({ where: { communicationId: result.message.id, eventType: 'created' } })).toBe(1);
  });
  it('keeps confidential communication out of the student-facing timeline', async () => {
    await createCommunication({ threadId: threads[2], channel: 'whatsapp', studentId: ids[0], b2bProviderId: 'private', messageBody: 'Confidential provider note', visibility: 'b2b_confidential', createdBy: ids[2] });
    expect(await prisma.timelineEvent.count({ where: { studentId: ids[0], description: 'Confidential provider note' } })).toBe(0);
  });
  it('rejects foreign thread mutations before writing', async () => {
    actor(2, 'EMPLOYEE', ['counselor'], ['communication.reply']);
    const result = await action(new NextRequest(req('/inbox').url, { method: 'POST', body: JSON.stringify({ action: 'mark_resolved', threadId: threads[1] }) }));
    expect(result.status).toBe(404);
    expect((await prisma.communicationThread.findUniqueOrThrow({ where: { id: threads[1] } })).status).toBe('open');
  });
  it('rolls back a task and its audit when the database write fails', async () => {
    actor(2, 'EMPLOYEE', ['counselor'], ['communication.reply']);
    const result = await action(new NextRequest(req('/inbox').url, { method: 'POST', body: JSON.stringify({ action: 'create_task', threadId: threads[0], taskData: { title: { invalid: true } } }) }));
    expect(result.status).toBe(500);
    expect(await prisma.portalAuditLog.count({ where: { actorUserId: ids[2] } })).toBe(0);
  });
});

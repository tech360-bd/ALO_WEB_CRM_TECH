import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), access: vi.fn(), transaction: vi.fn(), previous: vi.fn(), create: vi.fn(), update: vi.fn(), audit: vi.fn(), list: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/access-control/central-security-engine', () => ({ validateRequestAccess: m.access }));
vi.mock('@/lib/transactional-audit', () => ({ writePortalAudit: m.audit }));
vi.mock('@/lib/db', () => ({ db: { marketingTemplate: { findMany: m.list }, $transaction: m.transaction } }));
import { GET, POST } from '@/app/api/employee/diagram-drafts/route';
import { DiagramDraftSchema, parseDiagramRows } from '@/lib/diagrams/editable';
const draft = { title: 'Admission workload', type: 'bar', rows: [{ label: 'Counseling', group: '', value: 3, end: 0 }] };
const req = (data: unknown) => new NextRequest('https://alo.test/api/employee/diagram-drafts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
beforeEach(() => {
  vi.resetAllMocks(); m.auth.mockResolvedValue({ userId: 'staff', actorUserId: 'staff', roles: ['EMPLOYEE'] }); m.access.mockResolvedValue({ allowed: true });
  m.transaction.mockImplementation(async callback => callback({ marketingTemplate: { findUnique: m.previous, create: m.create, updateMany: m.update, findUniqueOrThrow: m.create } }));
  m.create.mockResolvedValue({ id: 'saved', updatedAt: new Date('2026-10-24T00:00:00Z') }); m.list.mockResolvedValue([]); m.update.mockResolvedValue({ count: 1 });
});
describe('editable diagram storage boundaries', () => {
  it('denies manually invoked save without backend permission', async () => { m.access.mockResolvedValue({ allowed: false }); expect((await POST(req({ draft }))).status).toBe(403); expect(m.transaction).not.toHaveBeenCalled(); });
  it('only lists the current author’s drafts', async () => { expect((await GET(req({}))).status).toBe(200); expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ where: { category: 'alo-diagram-draft-v1', createdById: 'staff' }, take: 20 })); });
  it.each(['0', '-1', '1.5', '1001', 'NaN', 'Infinity', 'words'])('rejects invalid pagination %s before querying records', async page => {
    const response = await GET(new NextRequest(`https://alo.test/api/employee/diagram-drafts?page=${page}`)); expect(response.status).toBe(400); expect(m.list).not.toHaveBeenCalled();
  });
  it('does not accept script or raw HTML payload fields', async () => { expect((await POST(req({ draft: { ...draft, html: '<script>bad()</script>' } }))).status).toBe(400); });
  it('stores structured draft and audits the same transaction', async () => { expect((await POST(req({ draft }))).status).toBe(201); expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({ createdById: 'staff', status: 'draft', content: JSON.stringify(draft) }) }); expect(m.audit.mock.calls[0][2]).toBe('DIAGRAM_DRAFT_CREATED'); });
  it('cannot overwrite another author even with a global permission', async () => { m.previous.mockResolvedValue({ id: 'other', category: 'alo-diagram-draft-v1', createdById: 'other' }); expect((await POST(req({ id: 'other', expectedUpdatedAt: '2026-10-24T00:00:00Z', draft }))).status).toBe(404); expect(m.update).not.toHaveBeenCalled(); });
  it('rejects a lost update after revision changes', async () => { m.previous.mockResolvedValue({ id: 'own', category: 'alo-diagram-draft-v1', createdById: 'staff', updatedAt: new Date('2026-10-24T01:00:00Z') }); expect((await POST(req({ id: 'own', expectedUpdatedAt: '2026-10-24T00:00:00Z', draft }))).status).toBe(409); });
  it('does not report saved when audit fails', async () => { m.audit.mockRejectedValue(new Error('internal secret')); const response = await POST(req({ draft })); expect(response.status).toBe(503); expect(await response.text()).not.toContain('internal secret'); });
  it('does not fabricate bar values from invalid numeric text', () => { expect(parseDiagramRows('bar', 'Totals', 'Actual | | not-a-number').success).toBe(false); });
  it('rejects reversed Gantt ranges', () => { expect(parseDiagramRows('gantt', 'Schedule', 'Review | | 5 | 2').success).toBe(false); });
  it('rejects ambiguous permission matrix values', () => { expect(parseDiagramRows('security-matrix', 'Access', 'Counselor | Salary | 5').success).toBe(false); });
  it('limits rows and refuses empty diagrams', () => { expect(DiagramDraftSchema.safeParse({ ...draft, rows: [] }).success).toBe(false); expect(DiagramDraftSchema.safeParse({ ...draft, rows: Array(25).fill(draft.rows[0]) }).success).toBe(false); });
});

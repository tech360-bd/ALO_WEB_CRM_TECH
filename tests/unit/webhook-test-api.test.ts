import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ auth: { userId: 'operator', actorUserId: 'operator', userType: 'PARTNER', partnerId: 'own-company' }, guard: vi.fn(), find: vi.fn(), recent: vi.fn(), create: vi.fn(), audit: vi.fn(), deliver: vi.fn(), tx: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ withAuth: (handler: (request: Request, auth: typeof m.auth) => Promise<Response>) => (request: Request) => handler(request, m.auth) }));
vi.mock('@/lib/webhooks/access', () => ({ requireWebhookManagement: m.guard }));
vi.mock('@/lib/db', () => ({ db: { webhookSubscription: { findUnique: m.find }, $transaction: m.tx } }));
vi.mock('@/lib/transactional-audit', () => ({ writePortalAudit: m.audit }));
vi.mock('@/lib/webhooks', () => ({ deliverWebhook: m.deliver }));
import { POST } from '@/app/api/webhooks/test/route';
const request = (body: unknown = { subscriptionId: 'subscription' }) => new Request('https://alo.test/api/webhooks/test', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
beforeEach(() => {
    vi.resetAllMocks();
    m.guard.mockResolvedValue(null);
    m.find.mockResolvedValue({ id: 'subscription', partnerId: 'own-company', active: true });
    m.recent.mockResolvedValue(null);
    m.create.mockResolvedValue({ id: 'delivery' });
    m.tx.mockImplementation(callback => callback({ webhookDelivery: { findFirst: m.recent, create: m.create } }));
    m.deliver.mockResolvedValue({ status: 'DELIVERED', httpStatus: 200 });
});
describe('webhook connectivity API security and truthful outcomes', () => {
    it('stops before any query or egress when authority is denied', async () => {
        m.guard.mockResolvedValue(new Response(null, { status: 403 }));
        expect((await POST(request())).status).toBe(403);
        expect(m.find).not.toHaveBeenCalled();
        expect(m.deliver).not.toHaveBeenCalled();
    });
    it('rejects arbitrary target or payload fields instead of forwarding client-controlled data', async () => {
        expect((await POST(request({ subscriptionId: 'subscription', targetUrl: 'https://attacker.invalid' }))).status).toBe(400);
        expect(m.deliver).not.toHaveBeenCalled();
    });
    it('hides a foreign tenant subscription and never sends to it', async () => {
        m.find.mockResolvedValue({ id: 'subscription', partnerId: 'other-company', active: true });
        expect((await POST(request())).status).toBe(404);
        expect(m.create).not.toHaveBeenCalled();
        expect(m.deliver).not.toHaveBeenCalled();
    });
    it('does not test inactive subscriptions', async () => {
        m.find.mockResolvedValue({ id: 'subscription', partnerId: 'own-company', active: false });
        expect((await POST(request())).status).toBe(409);
        expect(m.deliver).not.toHaveBeenCalled();
    });
    it('rate limits repeated tests before enqueueing or sending', async () => {
        m.recent.mockResolvedValue({ id: 'previous' });
        const response = await POST(request());
        expect(response.status).toBe(429);
        expect(response.headers.get('Retry-After')).toBe('60');
        expect(m.deliver).not.toHaveBeenCalled();
    });
    it('persists the diagnostic and initiating audit before sending, then records completion', async () => {
        const response = await POST(request());
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ delivered: true, status: 'DELIVERED' });
        expect(m.audit).toHaveBeenCalledTimes(2);
        expect(m.audit.mock.invocationCallOrder[0]).toBeLessThan(m.deliver.mock.invocationCallOrder[0]);
        const payload = JSON.parse(m.create.mock.calls[0][0].data.payload);
        expect(payload.data).toEqual({ test: true, organization: 'ALO Education' });
    });
    it('reports provider failure as undelivered, never a successful connectivity result', async () => {
        m.deliver.mockResolvedValue({ status: 'FAILED', httpStatus: 503, error: 'Provider unavailable' });
        const response = await POST(request());
        expect(await response.json()).toMatchObject({ delivered: false, status: 'FAILED' });
    });
    it('does not send if the initiating audit cannot persist', async () => {
        m.audit.mockRejectedValue(new Error('audit unavailable'));
        expect((await POST(request())).status).toBe(503);
        expect(m.deliver).not.toHaveBeenCalled();
    });
});

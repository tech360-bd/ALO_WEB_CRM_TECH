import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '@/lib/auth-middleware';
const m = vi.hoisted(() => ({ access: vi.fn(), feature: vi.fn() }));
vi.mock('@/lib/access-control/central-security-engine', () => ({ validateRequestAccess: m.access }));
vi.mock('@/lib/access-check-engine', () => ({ canAccessFeature: m.feature }));
import { requireWebhookManagement } from '@/lib/webhooks/access';
const auth = (type = 'EMPLOYEE', permissions: string[] = []) => ({ userId: 'actor', actorUserId: 'actor', userType: type, roles: [type], permissions, partnerId: type === 'PARTNER' ? 'company' : undefined } as AuthContext);
beforeEach(() => { vi.resetAllMocks(); m.access.mockResolvedValue({ allowed: false }); m.feature.mockResolvedValue(false); vi.stubEnv('NEXTAUTH_URL', 'https://alo.test'); });
afterEach(() => vi.unstubAllEnvs());
describe('webhook management central authority', () => {
    it.each(['EMPLOYEE', 'ADMIN', 'STUDENT'])('does not grant global webhook access from %s title', async (role) => { expect((await requireWebhookManagement(auth(role)))?.status).toBe(403); });
    it('requires an actual global central grant for internal administration', async () => { m.access.mockResolvedValue({ allowed: true, scope: 'BRANCH' }); expect((await requireWebhookManagement(auth()))?.status).toBe(403); m.access.mockResolvedValue({ allowed: true, scope: 'GLOBAL' }); expect(await requireWebhookManagement(auth())).toBeNull(); });
    it('requires both individual permission and tenant feature for partner access', async () => { m.feature.mockResolvedValue(true); expect((await requireWebhookManagement(auth('PARTNER')))?.status).toBe(403); expect(await requireWebhookManagement(auth('PARTNER', ['webhooks.manage']))).toBeNull(); m.feature.mockResolvedValue(false); expect((await requireWebhookManagement(auth('PARTNER', ['webhooks.manage'])))?.status).toBe(403); });
    it('rejects a cross-origin mutation before evaluating authority', async () => { expect((await requireWebhookManagement(auth('SUPER_ADMIN'), new Request('https://alo.test/api/webhooks/test', { headers: { origin: 'https://other.invalid' } }), true))?.status).toBe(403); expect(m.access).not.toHaveBeenCalled(); });
});

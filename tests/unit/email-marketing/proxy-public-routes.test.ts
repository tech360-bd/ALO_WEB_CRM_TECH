// The auth gate in src/proxy.ts decides which /api routes are reachable without a session.
// Email routes must be exactly: unsubscribe and the cron worker public (each enforces its own check),
// and the campaign admin routes must stay behind login.
import { describe, expect, it } from 'vitest';
import { isPublicApiRequest } from '@/proxy';

describe('proxy public API allowlist for email marketing', () => {
  it.each([
    ['/api/email/unsubscribe', 'GET'],
    ['/api/email/unsubscribe', 'POST'],
    ['/api/cron/email-outbox', 'GET'],
    ['/api/cron/email-outbox', 'POST'],
  ])('%s %s is public (token or CRON_SECRET is checked inside the route)', (path, method) => {
    expect(isPublicApiRequest(path, method)).toBe(true);
  });

  it.each([
    ['/api/email/campaigns', 'GET'],
    ['/api/email/campaigns', 'POST'],
    ['/api/email/campaigns/abc123', 'GET'],
    ['/api/email/campaigns/abc123/queue', 'POST'],
    ['/api/email/campaigns/abc123/status', 'POST'],
  ])('%s %s requires a session', (path, method) => {
    expect(isPublicApiRequest(path, method)).toBe(false);
  });

  it('keeps the other cron routes behind the proxy (they are not allowlisted, so external schedulers get 401 today)', () => {
    expect(isPublicApiRequest('/api/cron/sla-monitor', 'GET')).toBe(false);
    expect(isPublicApiRequest('/api/cron/weekly-university-scan', 'GET')).toBe(false);
  });
});

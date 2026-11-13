import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { marketingUserAccess: { findUnique: vi.fn() } } }));
vi.mock('@/lib/auth-middleware', () => ({ withAuth: (handler: unknown) => handler }));

import { marketingAccessDecision } from '@/lib/marketing/access';
import type { AuthContext } from '@/lib/auth-middleware';

function auth(userType: string, roles: string[] = []): AuthContext {
  return {
    userId: 'user-1', email: 'user@example.test', name: 'User', userType, roles,
    permissions: [], sessionId: 'session-1', actorUserId: 'user-1', actorEmail: 'user@example.test', actorName: 'User',
  };
}

const limited = { status: 'ACTIVE', accessLevel: 'LIMITED', permissions: '[]' };

describe('server-side marketing access policy', () => {
  it('grants manager capabilities only to Marketing Manager and Super Admin roles', () => {
    expect(marketingAccessDecision(auth('MARKETING_MANAGER'), null, 'manager')).toBe(true);
    expect(marketingAccessDecision(auth('EMPLOYEE', ['MARKETING_MANAGER']), null, 'manager')).toBe(true);
    expect(marketingAccessDecision(auth('SUPER_ADMIN'), null, 'manager')).toBe(true);
    expect(marketingAccessDecision(auth('ADMIN'), null, 'manager')).toBe(false);
    expect(marketingAccessDecision(auth('ADMIN', ['ADMIN']), { ...limited, accessLevel: 'FULL' }, 'manager')).toBe(false);
  });

  it('permits an approved limited user only the baseline assigned-inbox/draft workspace', () => {
    const actor = auth('EMPLOYEE');
    expect(marketingAccessDecision(actor, limited, 'social-inbox')).toBe(true);
    expect(marketingAccessDecision(actor, limited, 'draft-post')).toBe(true);
    expect(marketingAccessDecision(actor, limited, 'brand-read')).toBe(true);
    expect(marketingAccessDecision(actor, limited, 'manager')).toBe(false);
  });

  it('treats explicit permission lists as an allowlist and supports the existing social-inbox key', () => {
    const actor = auth('EMPLOYEE');
    const access = { ...limited, permissions: '["social_inbox"]' };
    expect(marketingAccessDecision(actor, access, 'social-inbox')).toBe(true);
    expect(marketingAccessDecision(actor, access, 'draft-post')).toBe(false);
    expect(marketingAccessDecision(actor, access, 'manager')).toBe(false);
  });

  it('fails closed for missing, revoked, malformed, or FULL non-manager access rows', () => {
    const actor = auth('MARKETING');
    expect(marketingAccessDecision(actor, null, 'social-inbox')).toBe(false);
    expect(marketingAccessDecision(actor, { ...limited, status: 'REVOKED' }, 'social-inbox')).toBe(false);
    expect(marketingAccessDecision(actor, { ...limited, permissions: '{bad json' }, 'social-inbox')).toBe(false);
    expect(marketingAccessDecision(actor, { ...limited, accessLevel: 'FULL' }, 'social-inbox')).toBe(false);
  });
});

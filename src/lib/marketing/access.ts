import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthContext, withAuth } from '@/lib/auth-middleware';

type Capability = 'workspace' | 'social-inbox' | 'draft-post' | 'brand-read' | 'manager';
type Handler = (request: Request, auth: AuthContext, context?: any) => Promise<NextResponse<any>>;

function rolesOf(auth: AuthContext): string[] {
  return [...auth.roles, auth.userType].map((role) => String(role || '').trim().toLowerCase().replace(/[ -]/g, '_'));
}

export function isMarketingSuperAdmin(auth: AuthContext): boolean {
  return rolesOf(auth).includes('super_admin');
}

export function isMarketingManager(auth: AuthContext): boolean {
  return rolesOf(auth).includes('marketing_manager') || isMarketingSuperAdmin(auth);
}

function permissionSet(raw: string): Set<string> {
  try {
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== 'string')) return new Set(['__invalid_permissions__']);
    return new Set(parsed.map((value: string) => value.trim().toLowerCase()));
  } catch {
    return new Set(['__invalid_permissions__']);
  }
}

export function marketingAccessDecision(
  auth: AuthContext,
  record: { status: string; accessLevel: string; permissions: string } | null,
  capability: Capability,
): boolean {
  if (isMarketingSuperAdmin(auth)) return true;
  const manager = isMarketingManager(auth);
  if (capability === 'manager') return manager;
  if (manager) return true;
  if (!record || record.status !== 'ACTIVE' || record.accessLevel !== 'LIMITED') return false;
  const permissions = permissionSet(record.permissions);
  if (permissions.size === 0) return ['workspace', 'social-inbox', 'draft-post', 'brand-read'].includes(capability);
  const aliases: Record<Exclude<Capability, 'manager'>, string[]> = {
    workspace: ['marketing.workspace.read', 'marketing.dashboard.read'],
    'social-inbox': ['marketing.inbox.assigned.read', 'marketing.inbox.assigned.reply', 'marketing.social.inbox', 'social_inbox'],
    'draft-post': ['marketing.posts.draft', 'marketing.posts.submit', 'marketing.content.draft', 'campaign_posts'],
    'brand-read': ['marketing.brand.read'],
  };
  return aliases[capability].some((permission) => permissions.has(permission));
}

export async function hasMarketingAccess(auth: AuthContext, capability: Capability): Promise<boolean> {
  if (isMarketingManager(auth)) return marketingAccessDecision(auth, null, capability);
  const record = await db.marketingUserAccess.findUnique({ where: { userId: auth.userId } }).catch(() => null);
  return marketingAccessDecision(auth, record, capability);
}

/** Reusable fail-closed wrapper for Marketing workspace routes. Limited users are authorized by the persisted approval row, not by a client role string. */
export function withMarketingAccess(handler: Handler, capability: Capability = 'workspace') {
  return withAuth(async (request, auth, context) => {
    if (!(await hasMarketingAccess(auth, capability))) {
      return NextResponse.json({ success: false, error: 'Marketing access is not approved for this account.' }, { status: 403 });
    }
    return handler(request, auth, context);
  });
}

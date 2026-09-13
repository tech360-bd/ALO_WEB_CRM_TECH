import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { canAccessFeature } from '@/lib/access-check-engine';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const featureKey = searchParams.get('featureKey');
    const action = searchParams.get('action') || 'view';

    if (featureKey) {
      const allowed = await canAccessFeature(auth.userId, auth.roles, featureKey, action);
      return NextResponse.json({ success: true, featureKey, action, allowed, userId: auth.userId, roles: auth.roles });
    }

    // List all feature rules
    const rules = await (db as any).featureAccessRule.findMany({ take: 100 }).catch(() => []);

    // Check current user's accessible features
    const checks = await Promise.all(
      ['whatsapp','social','email','phone','ai','application','student','document','finance','visa','marketing','partner','b2b','quota'].map(async (key) => ({
        featureKey: key,
        allowed: await canAccessFeature(auth.userId, auth.roles, key, 'view').catch(() => false),
      }))
    );

    return NextResponse.json({ success: true, rules, accessibleFeatures: checks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Super Admin required' }, { status: 403 });

    const body = await req.json();
    const { featureKey, displayName, description, allowedRoles, requiredPermissions } = body;
    if (!featureKey) return NextResponse.json({ success: false, error: 'featureKey required' }, { status: 400 });

    const rule = await (db as any).featureAccessRule.create({
      data: {
        featureKey,
        displayName: displayName || featureKey,
        description: description || '',
        allowedRoles: JSON.stringify(allowedRoles || []),
        requiredPermissions: JSON.stringify(requiredPermissions || []),
      },
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

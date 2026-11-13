import { NextResponse } from 'next/server';
import type { AuthContext } from '@/lib/auth-middleware';
import { validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { canAccessFeature } from '@/lib/access-check-engine';
/** Configuration and delivery logs need explicit authority, never an employee title. */
export async function requireWebhookManagement(auth: AuthContext, request?: Request, mutation = false): Promise<NextResponse | null> {
    const type = auth.userType.toUpperCase();
    if (type === 'STUDENT')
        return denied();
    if (mutation && request) {
        const origin = request.headers.get('origin');
        const expected = new URL(process.env.NEXTAUTH_URL || request.url).origin;
        if ((origin && origin !== expected) || request.headers.get('sec-fetch-site') === 'cross-site')
            return denied();
    }
    if (type === 'PARTNER') {
        if (!auth.partnerId || !auth.permissions?.includes('webhooks.manage') || !await canAccessFeature(auth.userId, 'webhooks.manage'))
            return denied();
        return null; // Every caller must still compare the STORED subscription partnerId.
    }
    const result = await validateRequestAccess({ userId: auth.userId }, 'webhooks', 'manage');
    return result.allowed && result.scope === 'GLOBAL' ? null : denied();
}
function denied() { return NextResponse.json({ success: false, error: 'Explicit webhook-management access is required.' }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } }); }

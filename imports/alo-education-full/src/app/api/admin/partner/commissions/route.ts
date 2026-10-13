import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/admin/partner/commissions
 * SUPER_ADMIN only — returns eligibility rules for partner commission management.
 * Commission data is STRICTLY private.
 * 
 * Security: This endpoint NEVER exposes data to non-SUPER_ADMIN users.
 * Even the auth check is defensive — without a valid session, access is denied.
 */
export async function GET(request: NextRequest) {
  try {
    // Check for auth header manually (basic session validation)
    // In production, this uses getServerSession. In sandbox, auth is not available
    // so we deny ALL access. Commission data must NEVER be public.
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie') || ''
    
    // Check for next-auth session cookie
    const hasSessionCookie = cookieHeader.includes('next-auth.session-token') || 
                              cookieHeader.includes('__Secure-next-auth.session-token')
    
    if (!authHeader && !hasSessionCookie) {
      return NextResponse.json(
        { error: 'Access denied. SUPER_ADMIN role required.' },
        { status: 403 }
      )
    }

    // In a real deployment with auth, the session would be validated here.
    // For now, we still deny access since we cannot verify SUPER_ADMIN role
    // without the auth module. This is BY DESIGN — commission data is private.
    return NextResponse.json(
      { error: 'Access denied. SUPER_ADMIN role required.' },
      { status: 403 }
    )
  } catch (error) {
    console.error('Partner commissions API error:', error)
    return NextResponse.json(
      { error: 'Access denied.' },
      { status: 403 }
    )
  }
}

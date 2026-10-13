/**
 * ALO Education - Client Session Utility
 *
 * Thin wrapper around localStorage-based JWT session.
 * Used by portal client components for auth guard + role checks.
 */

export interface AloSession {
  token: string
  user: {
    id: string
    email: string
    name: string
    phone: string | null
    profilePhoto: string | null
    userType: 'student' | 'partner' | 'employee'
    referenceId: string | null
    forcePasswordChange: boolean
    status: string
  }
  roles: Array<{ id: string; name: string; displayName: string }>
  permissions: Array<{ module: string; action: string; granted: boolean }>
}

const TOKEN_KEY = 'alo_token'
const SESSION_KEY = 'alo_session'

export function getSession(): AloSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AloSession
  } catch {
    return null
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setSession(session: AloSession): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, session.token)
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
}

export function hasRole(session: AloSession | null, ...roleNames: string[]): boolean {
  if (!session) return false
  return session.roles.some((r) => roleNames.includes(r.name))
}

export function hasPermission(
  session: AloSession | null,
  module: string,
  action: string
): boolean {
  if (!session) return false
  if (hasRole(session, 'super_admin')) return true
  return session.permissions.some(
    (p) => p.module === module && p.action === action && p.granted
  )
}

export function primaryRole(session: AloSession | null): string {
  if (!session || session.roles.length === 0) return ''
  return session.roles[0].name
}

/**
 * Determine which workspace the session belongs to.
 * Returns 'student' | 'partner' | 'crm' | null
 */
export function workspaceFor(session: AloSession | null): 'student' | 'partner' | 'crm' | null {
  if (!session) return null
  if (session.user.userType === 'student') return 'student'
  if (session.user.userType === 'partner') return 'partner'
  if (session.user.userType === 'employee') {
    if (hasRole(session, 'student')) return 'student'
    if (hasRole(session, 'partner_super_admin', 'partner_staff')) return 'partner'
    return 'crm'
  }
  return null
}

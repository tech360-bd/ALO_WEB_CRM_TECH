'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api, getToken, setToken, clearToken } from '@/lib/api'

export interface AuthUser {
  id: string
  email: string
  name: string
  phone?: string
  profilePhoto?: string
  userType: string // student | partner | employee
  referenceId?: string
  forcePasswordChange?: boolean
  status: string
}

export interface AuthRole {
  id: string
  name: string
  displayName: string
}

export interface AuthPermission {
  module: string
  action: string
  granted: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  roles: AuthRole[]
  permissions: AuthPermission[]
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ redirectUrl: string }>
  logout: () => void
  hasRole: (roleName: string) => boolean
  hasPermission: (module: string, action: string) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'alo_auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [roles, setRoles] = useState<AuthRole[]>([])
  const [permissions, setPermissions] = useState<AuthPermission[]>([])
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setUser(parsed.user)
        setRoles(parsed.roles || [])
        setPermissions(parsed.permissions || [])
      }
    } catch {
      // ignore parse errors
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password)
    setToken(res.token)
    const authData = {
      user: res.user,
      roles: res.roles,
      permissions: res.permissions,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData))
    setUser(res.user)
    setRoles(res.roles)
    setPermissions(res.permissions)
    return { redirectUrl: res.redirectUrl }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    setRoles([])
    setPermissions([])
    router.push('/')
  }, [router])

  const hasRole = useCallback(
    (roleName: string) => roles.some((r) => r.name === roleName),
    [roles]
  )

  const hasPermission = useCallback(
    (module: string, action: string) =>
      permissions.some(
        (p) => p.module === module && p.action === action && p.granted
      ),
    [permissions]
  )

  const refreshUser = useCallback(async () => {
    // Re-fetch user profile if needed (optional)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        hasPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

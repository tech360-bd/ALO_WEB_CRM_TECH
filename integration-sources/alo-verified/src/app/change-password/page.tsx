'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, Lock, CheckCircle2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { getSession, workspaceFor, clearSession } from '@/lib/session'

// ============================================================
// Change Password page (logged-in user)
// For users who know their current password and want to set a
// new one. Also used by the forcePasswordChange redirect path.
// Hits /api/auth/change-password (requireAuth).
// ============================================================

function passwordStrength(pwd: string): {
  lengthOk: boolean
  hasLetter: boolean
  hasNumber: boolean
  allOk: boolean
} {
  const lengthOk = pwd.length >= 8
  const hasLetter = /[a-zA-Z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  return { lengthOk, hasLetter, hasNumber, allOk: lengthOk && hasLetter && hasNumber }
}

export default function ChangePasswordPage() {
  const router = useRouter()
  const session = getSession()
  const workspace = workspaceFor(session)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)

  // If the user is not logged in, send them to login.
  useEffect(() => {
    if (!session) {
      router.replace('/')
    }
  }, [session, router])

  const strength = passwordStrength(newPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      toast.error('Your session has expired. Please log in again.')
      router.push('/')
      return
    }

    if (!currentPassword) {
      toast.error('Please enter your current password')
      return
    }
    if (!strength.allOk) {
      toast.error('New password must be at least 8 chars with 1 letter and 1 number')
      return
    }
    if (currentPassword === newPassword) {
      toast.error('New password must be different from the current one')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 401) {
          // Session expired — clear and bounce to login.
          clearSession()
          toast.error('Session expired — please log in again')
          router.push('/')
          return
        }
        throw new Error(data.error || 'Password change failed')
      }
      toast.success('Password changed successfully')
      const dest = workspace ? `/${workspace}/dashboard` : '/'
      router.push(dest)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Password change failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header
        className="text-white"
        style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}
      >
        <div className="max-w-md mx-auto px-6 py-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center font-bold">
            ALO
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">ALO Education</h1>
            <p className="text-white/80 text-xs">Change your password</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {session?.user.forcePasswordChange && (
            <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-900">
              <KeyRound className="h-4 w-4" />
              <AlertTitle>Action required</AlertTitle>
              <AlertDescription>
                For your security, please set a new password before continuing.
              </AlertDescription>
            </Alert>
          )}

          <Card className="border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Change password</CardTitle>
              <CardDescription>
                Enter your current password and choose a new one.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="text-sm font-medium">Current password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="currentPassword"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showCurrent ? 'Hide password' : 'Show password'}
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-sm font-medium">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      className="pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <ul className="mt-1.5 space-y-1 text-xs">
                    <li className={strength.lengthOk ? 'text-emerald-600' : 'text-slate-500'}>
                      • At least 8 characters
                    </li>
                    <li className={strength.hasLetter ? 'text-emerald-600' : 'text-slate-500'}>
                      • At least one letter
                    </li>
                    <li className={strength.hasNumber ? 'text-emerald-600' : 'text-slate-500'}>
                      • At least one number
                    </li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm new password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showNew ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      className="pl-9"
                    />
                    {confirmPassword.length > 0 && newPassword === confirmPassword && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !currentPassword || !strength.allOk || newPassword !== confirmPassword}
                  className="w-full bg-[#0057B8] hover:bg-[#00449a] text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Changing…
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 border-t border-slate-100 pt-4">
              <Link
                href={workspace ? `/${workspace}/dashboard` : '/'}
                className="text-xs text-slate-600 hover:text-[#0057B8] transition-colors"
              >
                Back to dashboard
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Sticky footer */}
      <footer
        className="mt-auto text-white"
        style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}
      >
        <div className="max-w-md mx-auto px-6 py-4 text-center text-xs">
          © {new Date().getFullYear()} ALO Education. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

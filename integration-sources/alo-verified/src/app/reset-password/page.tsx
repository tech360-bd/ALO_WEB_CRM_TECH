'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react'
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
import { toast } from 'sonner'

// ============================================================
// Reset Password page
// Reads ?token=...&userId=... from the query (set by the
// /verify-otp page after OTP verification), collects a new
// password, and POSTs to /api/auth/reset-password.
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

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const userId = searchParams.get('userId') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = passwordStrength(newPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token || !userId) {
      toast.error('Invalid reset link. Please request a new OTP.')
      return
    }
    if (!strength.allOk) {
      toast.error('Password must be at least 8 chars with 1 letter and 1 number')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          resetToken: token,
          newPassword,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed')
      }
      toast.success('Password reset successfully — please log in')
      router.push('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">Set a new password</CardTitle>
        <CardDescription>
          Your new password must be at least 8 characters and include a letter and a number.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-sm font-medium">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className="pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Strength hints */}
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
                type={showPassword ? 'text' : 'password'}
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
            disabled={loading || !strength.allOk || newPassword !== confirmPassword}
            className="w-full bg-[#0057B8] hover:bg-[#00449a] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resetting…
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-slate-100 pt-4">
        <Link
          href="/"
          className="text-xs text-slate-600 hover:text-[#0057B8] transition-colors"
        >
          Back to login
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function ResetPasswordPage() {
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
            <p className="text-white/80 text-xs">Set a new password</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-[#0057B8] animate-spin" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
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

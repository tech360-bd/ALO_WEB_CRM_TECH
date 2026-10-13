'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ArrowLeft, ShieldCheck } from 'lucide-react'
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
// Verify OTP page (password reset flow)
// Reads ?email= from query, asks the user for the 6-digit OTP,
// calls /api/auth/verify-otp, then redirects to /reset-password
// with the signed reset token in the URL.
// ============================================================

function VerifyOtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedOtp = otp.trim()
    if (!trimmedEmail) {
      toast.error('Please enter your email address')
      return
    }
    if (!/^\d{6}$/.test(trimmedOtp)) {
      toast.error('OTP must be a 6-digit code')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, otp: trimmedOtp }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'OTP verification failed')
      }
      // data: { success, resetToken, userId, expiresAt }
      const { resetToken, userId } = data as {
        resetToken: string
        userId: string
      }
      toast.success('OTP verified — set your new password')
      router.push(
        `/reset-password?token=${encodeURIComponent(resetToken)}&userId=${encodeURIComponent(userId)}`
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">Enter verification code</CardTitle>
        <CardDescription>
          We sent a 6-digit code to your email. Enter it below to continue.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="otp" className="text-sm font-medium">6-digit OTP</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              autoComplete="one-time-code"
              required
              className="text-center text-lg tracking-[0.5em] font-semibold"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0057B8] hover:bg-[#00449a] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" /> Verify OTP
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between w-full text-xs">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0057B8] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Resend OTP
          </Link>
          <Link
            href="/"
            className="text-slate-600 hover:text-[#0057B8] transition-colors"
          >
            Back to login
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function VerifyOtpPage() {
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
            <p className="text-white/80 text-xs">Verify your identity</p>
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
            <VerifyOtpForm />
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

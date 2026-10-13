'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Briefcase, Building2, X, Loader2, Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface AloLoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogin: (email: string, password: string) => Promise<void>
}

const demoAccounts = [
  {
    role: 'Super Admin',
    email: 'admin@aloeducation.com',
    password: 'ChangeMe@12345',
    icon: Building2,
    color: '#0057B8',
    desc: 'Full CRM access — all modules',
  },
  {
    role: 'Student',
    email: 'student@aloeducation.com',
    password: 'ChangeMe@12345',
    icon: GraduationCap,
    color: '#10B981',
    desc: 'Student portal dashboard',
  },
  {
    role: 'Partner',
    email: 'partner@aloeducation.com',
    password: 'ChangeMe@12345',
    icon: Briefcase,
    color: '#E8501A',
    desc: 'Partner / agent workspace',
  },
]

export default function AloLoginModal({ open, onOpenChange, onLogin }: AloLoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter your email and password')
      return
    }
    setLoading(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (acc: { email: string; password: string }) => {
    setEmail(acc.email)
    setPassword(acc.password)
    toast.info(`Demo ${acc.email} filled in. Click Sign In to continue.`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <div className="px-6 pt-6 pb-4" style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}>
          <DialogHeader className="space-y-0">
            <div className="flex items-center gap-2 text-white mb-2">
              <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center font-bold">
                ALO
              </div>
              <div>
                <DialogTitle className="text-white text-lg">Sign in to ALO Education</DialogTitle>
                <p className="text-white/80 text-xs">Choose your workspace and continue</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#0057B8] hover:text-[#00449a] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0057B8] hover:bg-[#00449a] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-500">Quick demo access</span>
            </div>
          </div>

          <div className="space-y-2">
            {demoAccounts.map((acc) => {
              const Icon = acc.icon
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                >
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: acc.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{acc.role}</div>
                    <div className="text-xs text-slate-500 truncate">{acc.email}</div>
                  </div>
                  <span className="text-xs text-slate-400">→</span>
                </button>
              )
            })}
          </div>

          <p className="text-center text-xs text-slate-400 pt-2">
            By signing in you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

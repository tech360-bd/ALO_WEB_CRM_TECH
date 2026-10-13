'use client'

import React, { useState } from 'react'
import { useAppStore, getDashboardForRole } from '@/lib/store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Shield,
  Lock,
  Mail,
} from 'lucide-react'

export default function LoginPage() {
  const { setCurrentView, setCurrentUser, setAuthToken } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.auth.login(email, password)

      // Extract role from response
      const primaryRole = data.roles?.[0]?.name || 'student'
      const user = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: primaryRole as Parameters<typeof getDashboardForRole>[0],
        userType: data.user.userType,
        referenceId: data.user.referenceId,
        profilePhoto: data.user.profilePhoto,
        forcePasswordChange: data.user.forcePasswordChange,
        permissions: data.permissions || [],
      }

      // Save auth token to localStorage and Zustand
      api.setToken(data.token)
      setAuthToken(data.token)

      // Store user in localStorage and Zustand
      localStorage.setItem('alo_user', JSON.stringify(user))
      setCurrentUser(user)

      // Navigate to appropriate dashboard
      const dashboard = getDashboardForRole(user.role)
      setCurrentView(dashboard)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Login failed. Please try again.')
      } else {
        setError('Network error. Please check your connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-[#1A2332] via-[#1e2d42] to-[#0066CC] py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#F37021] rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              ALO<span className="text-[#F37021]"> Education</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm">Sign in to access your portal</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to sign in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs text-[#0066CC] hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#F37021] hover:bg-[#e0651a] text-white h-11"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            {/* Register Options */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-1 border-[#0066CC]/30 hover:bg-[#0066CC]/5"
                onClick={() => setCurrentView('student-register')}
              >
                <GraduationCap className="h-5 w-5 text-[#0066CC]" />
                <span className="text-xs font-medium text-[#0066CC]">Student Register</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-1 border-[#F37021]/30 hover:bg-[#F37021]/5"
                onClick={() => setCurrentView('partner-register')}
              >
                <Shield className="h-5 w-5 text-[#F37021]" />
                <span className="text-xs font-medium text-[#F37021]">Partner Register</span>
              </Button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-3 bg-[#F7F9FC] rounded-lg border">
              <p className="text-xs font-semibold text-[#1A2332] mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-[#555555]">
                <p><span className="font-medium">Admin:</span> admin@aloeducation.com / ChangeMe@12345</p>
                <p><span className="font-medium">Counselor:</span> fatema@aloeducation.com / ChangeMe@12345</p>
                <p><span className="font-medium">Visa Officer:</span> tasneem@aloeducation.com / ChangeMe@12345</p>
                <p><span className="font-medium">Finance:</span> imran@aloeducation.com / ChangeMe@12345</p>
                <p><span className="font-medium">Student:</span> tanvir.ahmed@gmail.com / ChangeMe@12345</p>
                <p><span className="font-medium">Marketing:</span> mithila@aloeducation.com / ChangeMe@12345</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back */}
        <div className="text-center mt-6">
          <button
            onClick={() => setCurrentView('home')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to website
          </button>
        </div>
      </div>
    </div>
  )
}

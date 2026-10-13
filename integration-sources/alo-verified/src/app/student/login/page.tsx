'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'

export default function StudentLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        localStorage.setItem('alo_session', JSON.stringify(data))
        router.push('/student/dashboard')
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Card className="w-full max-w-md shadow-lg" style={{ borderColor: '#E2E8F0' }}>
        <CardHeader className="text-center" style={{ background: '#0057B8' }}>
          <div className="flex justify-center mb-2"><GraduationCap className="h-10 w-10 text-white" /></div>
          <CardTitle className="text-2xl text-white">Student Login</CardTitle>
          <p className="text-blue-100 text-sm">ALO Education Student Portal</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded" style={{ color: '#EF4444' }}>{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12" />
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 text-base" style={{ background: '#E8501A', color: 'white' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <div className="text-center text-sm">
            <a href="/forgot-password" className="text-blue-600 hover:underline">Forgot password?</a>
          </div>
          <div className="text-center text-sm" style={{ color: '#0F172A' }}>
            Don't have an account?{' '}
            <a href="/api/auth/register" onClick={(e) => { e.preventDefault(); router.push('/') }} className="text-orange-600 hover:underline font-medium">Register</a>
          </div>
          <div className="text-center pt-2 border-t" style={{ borderColor: '#E2E8F0' }}>
            <a href="/" className="text-sm text-gray-500 hover:underline">← Back to home</a>
          </div>
        </CardContent>
      </Card>
      <footer className="mt-auto py-4 text-center text-sm text-gray-500">
        © 2026 ALO Education. All rights reserved.
      </footer>
    </div>
  )
}

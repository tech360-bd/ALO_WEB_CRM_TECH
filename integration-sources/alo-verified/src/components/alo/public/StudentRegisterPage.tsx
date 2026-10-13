'use client'

import React, { useState } from 'react'
import { useAppStore, getDashboardForRole } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Lock,
  Globe,
  BookOpen,
  Award,
} from 'lucide-react'

export default function StudentRegisterPage() {
  const { setCurrentView, setCurrentUser } = useAppStore()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: '',
    preferredCountry: '',
    preferredCourse: '',
    highestEducation: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'student',
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber,
          password: formData.password,
          preferredCountry: formData.preferredCountry,
          preferredCourse: formData.preferredCourse,
          highestEducation: formData.highestEducation,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-[#1A2332] via-[#1e2d42] to-[#0066CC] py-12 px-4">
        <Card className="border-0 shadow-2xl max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A2332]">Registration Successful!</h2>
            <p className="text-[#555555]">
              Your student account has been created. You can now log in with your email and password.
            </p>
            {error === '' && (
              <p className="text-sm text-[#555555]">
                Student ID: <span className="font-mono font-semibold text-[#F37021]">Will be assigned</span>
              </p>
            )}
            <div className="flex flex-col gap-3 mt-6">
              <Button
                onClick={() => setCurrentView('login')}
                className="bg-[#F37021] hover:bg-[#e0651a] text-white h-11"
              >
                Go to Login <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                onClick={() => setCurrentView('home')}
                variant="outline"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-[#1A2332] via-[#1e2d42] to-[#0066CC] py-12 px-4">
      <div className="w-full max-w-lg">
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
          <p className="text-gray-400 text-sm">Create your student account</p>
        </div>

        {/* Registration Card */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Student Registration</CardTitle>
            <CardDescription className="text-center">
              Fill in your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      placeholder="+880 1XXX-XXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    placeholder="+880 1XXX-XXXXXX"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#0066CC] hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'} passwords
                </button>
              </div>

              {/* Preferred Country & Course */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Preferred Country</Label>
                  <Select
                    value={formData.preferredCountry}
                    onValueChange={(v) => setFormData({ ...formData, preferredCountry: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UK">United Kingdom 🇬🇧</SelectItem>
                      <SelectItem value="USA">United States 🇺🇸</SelectItem>
                      <SelectItem value="Canada">Canada 🇨🇦</SelectItem>
                      <SelectItem value="Australia">Australia 🇦🇺</SelectItem>
                      <SelectItem value="Europe">Europe 🇪🇺</SelectItem>
                      <SelectItem value="Malaysia">Malaysia 🇲🇾</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Course</Label>
                  <Select
                    value={formData.preferredCourse}
                    onValueChange={(v) => setFormData({ ...formData, preferredCourse: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Business">Business & MBA</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Medicine">Medicine</SelectItem>
                      <SelectItem value="Law">Law</SelectItem>
                      <SelectItem value="Arts">Arts & Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Highest Education */}
              <div className="space-y-2">
                <Label>Highest Education Level</Label>
                <Select
                  value={formData.highestEducation}
                  onValueChange={(v) => setFormData({ ...formData, highestEducation: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SSC">SSC / O-Level</SelectItem>
                    <SelectItem value="HSC">HSC / A-Level</SelectItem>
                    <SelectItem value="Diploma">Diploma</SelectItem>
                    <SelectItem value="Bachelor">Bachelor&apos;s Degree</SelectItem>
                    <SelectItem value="Master">Master&apos;s Degree</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#F37021] hover:bg-[#e0651a] text-white h-11"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Account...</>
                ) : (
                  <>Create Student Account <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                By registering, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-500">already have an account?</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC] hover:text-white"
              onClick={() => setCurrentView('login')}
            >
              Sign In Instead
            </Button>
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

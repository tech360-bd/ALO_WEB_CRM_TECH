'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  function validate(): string | null {
    if (!name.trim()) return 'Please enter your full name.';
    if (!email.trim()) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return 'Please enter a valid email address.';
    if (!password) return 'Please enter a password.';
    if (password.length < 8)
      return 'Password must be at least 8 characters long.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (!terms) return 'You must agree to the Terms of Service.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      setSuccess(true);
      setSuccessMessage(
        data.message ||
          'Check your email for verification.'
      );
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Left Branding Panel */}
        <div className="hidden lg:flex lg:w-1/2 gradient-blue relative overflow-hidden">
          <div className="dot-grid-blue absolute inset-0 opacity-40" />
          <div className="relative z-10 flex flex-col justify-center items-center px-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm mb-6">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              ALO Education
            </h1>
            <p className="text-lg text-blue-100 max-w-md leading-relaxed">
              Your trusted partner for studying abroad.
            </p>
          </div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        </div>

        {/* Right Panel — Success */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-alo-gray-light">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-alo-black mb-3">
              Account Created!
            </h2>
            <p className="text-alo-gray mb-8 leading-relaxed">
              {successMessage}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push('/login')}
                className={cn(
                  'h-11 rounded-lg font-semibold',
                  'bg-alo-blue hover:bg-alo-blue-dark text-white'
                )}
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="h-11 rounded-lg font-semibold"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 gradient-blue relative overflow-hidden">
        <div className="dot-grid-blue absolute inset-0 opacity-40" />
        <div className="relative z-10 flex flex-col justify-center items-center px-12 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm mb-6">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              ALO Education
            </h1>
            <p className="text-lg text-blue-100 max-w-md leading-relaxed">
              Join thousands of students who found their dream university
              through ALO Education.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8 max-w-sm w-full">
            {[
              { value: '500+', label: 'Universities' },
              { value: '50+', label: 'Countries' },
              { value: '10K+', label: 'Students' },
              { value: '100+', label: 'Partners' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
              >
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-alo-gray-light">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-alo-blue mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-alo-black">
              ALO Education
            </h1>
          </div>

          {/* Back to Home */}
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-alo-gray hover:text-alo-blue transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>

          <h2 className="text-2xl font-bold text-alo-black mb-1">
            Create your account
          </h2>
          <p className="text-alo-gray mb-8">
            Start your study abroad journey today.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="h-11 bg-white"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email Address</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11 bg-white"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number{' '}
                <span className="text-alo-gray font-normal">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="h-11 bg-white"
              />
            </div>

            {/* Role */}
            <div className="space-y-3">
              <Label>I am a</Label>
              <RadioGroup
                value={role}
                onValueChange={setRole}
                className="flex gap-4"
                disabled={loading}
              >
                <label
                  htmlFor="role-student"
                  className={cn(
                    'flex items-center gap-2.5 px-4 py-3 rounded-lg border cursor-pointer transition-all flex-1',
                    role === 'STUDENT'
                      ? 'border-alo-blue bg-alo-blue-light'
                      : 'border-alo-gray-medium bg-white hover:border-alo-gray'
                  )}
                >
                  <RadioGroupItem value="STUDENT" id="role-student" />
                  <span className="text-sm font-medium text-alo-black">
                    Student
                  </span>
                </label>
                <label
                  htmlFor="role-partner"
                  className={cn(
                    'flex items-center gap-2.5 px-4 py-3 rounded-lg border cursor-pointer transition-all flex-1',
                    role === 'PARTNER'
                      ? 'border-alo-blue bg-alo-blue-light'
                      : 'border-alo-gray-medium bg-white hover:border-alo-gray'
                  )}
                >
                  <RadioGroupItem value="PARTNER" id="role-partner" />
                  <span className="text-sm font-medium text-alo-black">
                    Partner
                  </span>
                </label>
              </RadioGroup>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-gray hover:text-alo-black transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-gray hover:text-alo-black transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={terms}
                onCheckedChange={(checked) => setTerms(checked === true)}
                disabled={loading}
                className="mt-0.5"
              />
              <Label
                htmlFor="terms"
                className="text-sm font-normal text-alo-gray leading-snug cursor-pointer"
              >
                I agree to the{' '}
                <a
                  href="/"
                  className="text-alo-blue hover:underline"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/"
                  className="text-alo-blue hover:underline"
                >
                  Privacy Policy
                </a>
              </Label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-11 text-base font-semibold rounded-lg',
                'bg-alo-orange hover:bg-alo-orange-dark text-white',
                'transition-colors'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="mt-8 text-center text-sm text-alo-gray">
            Already have an account?{' '}
            <a
              href="/login"
              className="font-semibold text-alo-blue hover:underline"
            >
              Sign In
            </a>
          </p>

          {/* Footer */}
          <p className="mt-12 text-center text-xs text-alo-gray">
            &copy; {new Date().getFullYear()} ALO Education. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
